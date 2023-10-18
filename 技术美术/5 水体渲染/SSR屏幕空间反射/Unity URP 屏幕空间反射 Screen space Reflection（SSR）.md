## 原理：（长文预警）

利用屏幕空间的深度，法线进行 RayMarching，得到反射的采样在屏幕上的颜色。

1. 首先，需要**法线图** -> 计算入射光线被平面反射之后的角度
2. 然后需要**深度图** -> 对屏幕上的像素计算每一个反射光线，从观察空间的点出发进行 RayMarching，计算射线是否与物体相交，如果大于深度图且在屏幕之内，就将该点的位置再次变换到屏幕空间进行采样（屏幕空间重建观察空间下的坐标 -> 进行 raymarching-> 打到物体将观察空间坐标点转换为屏幕上的 UV 值，采样）。

屏幕空间反射只能计算屏幕中的像素的反射。

我们的 Shader 结构是这样的：

```
pass0{
进行RayMarching得到贴图
}
pass1{
模糊图像
}
pass2{
为挡住遮罩之前的物体写入遮罩
}

pass3{
进行图像遮罩，得到黑白色的MainTex
}
pass4{
进行叠加
}
```

我们的 RenderFeature 结构是这样的：

```
1.首先申请3个id
ReflectTexID;
BlurID;
MaskID;

(在Execute（） 中：)
2.用FilterSettings 设置过滤的层级（LayerMask）与队列（queue）;
3.用DrawRenderers（）将过滤的物体生成一张黑白色贴图（注意这里调用的是两次，因为还要绘制一次反射平面之前的物体）
4.进行第一次的RayMarching，写入ReflectTex
5.对得到的ReflectTex进行模糊;
6.叠加ReflecTex和主图像。
```

既然已经 5 个 Pass 了，咱也不敢在手机上跑一跑~ 就充当课后娱乐吧~ 追求高质量为先~ 反正 RayMarching 也不能用在手机上~

## raymarching 光线步进

定义两个函数：
*   判断光线是否与物体相交，如果相交，且在屏幕之内，并且在视线的正方向，小于一定的深度阙值，便判定为相交。（深度阙值最好用物体厚度图，不然厚度不一放在场景里就很尴尬）

```c
bool checkDepthCollision(float3 viewPos, out float2 screenPos,inout float depthDistance)
{
    //将观察空间的值变换到裁剪空间，计算屏幕空间的采样位置
    float4 clipPos = mul(unity_CameraProjection, float4(viewPos, 1.0));
     //裁剪空间齐次除法
     clipPos = clipPos / clipPos.w;

     //变换到屏幕空间
     screenPos = float2(clipPos.x, clipPos.y) * 0.5 + 0.5;

     float4 depthnormalTex = SAMPLE_TEXTURE2D(_CameraDepthNormalsTexture, sampler_CameraDepthNormalsTexture, screenPos);
     
     float4 depthcolor = SAMPLE_TEXTURE2D_X(_CameraDepthTexture, sampler_CameraDepthTexture,screenPos);
     float depth = LinearEyeDepth(depthcolor, _ZBufferParams)+ 0.2;
    
     return screenPos.x > 0 && screenPos.y > 0 && screenPos.x < 1.0 && screenPos.y < 1.0 && (depth < -viewPos.z) && depth+_depthThickness>-viewPos.z;
}
```

*   从观察空间的像素点发出光线（这里是已经有了加速结构的）

```c
bool viewSpaceRayMarching(float3 rayOri, float3 rayDir,float currentRayMarchingStepSize,inout float depthDistance,inout float3 currentViewPos,inout float2 hitScreenPos,float2 ditherUV) {
                float2 offsetUV = fmod(floor(ditherUV),4.0);
                float ditherValue = SAMPLE_TEXTURE2D(_ditherMap, sampler_ditherMap,offsetUV * 0.25).a;
                rayOri += ditherValue * rayDir;
      
                 
                 int maxStep = _maxRayMarchingStep;

                 UNITY_LOOP
                 for (int i = 0; i < maxStep; i++) {
                     float3 currentPos = rayOri + rayDir * currentRayMarchingStepSize * i;

                    if (length(rayOri - currentPos) > _maxRayMarchingDistance)
                         return false;
                    if (checkDepthCollision(currentPos, hitScreenPos, depthDistance)) {
                        currentViewPos = currentPos;
                        return true;
                      }
                    }
                 return false;
             }
```

## 加速结构：

```c
//搜索法
 bool binarySearchRayMarching(float3 rayOri,float3 rayDir,inout float2 hitScreenPos) {
     float currentStepSize = _rayMarchingStepSize;
     float3 currentPos = rayOri;
     float depthDistance = 0;
     UNITY_LOOP
         for (int i = 0; i < _maxRayMarchingBianrySearchCount; i++) {
             if (viewSpaceRayMarching(rayOri, rayDir, currentStepSize, depthDistance, currentPos, hitScreenPos))
             {
                 if (depthDistance < _depthThickness)
                 {
                     return true;
                 }
                 //在原点重新步进，并且currentStepSize减小一半
                 rayOri = currentPos - rayDir * currentStepSize;
                     currentStepSize *= 0.5;
             }

             else
             {
                 return false;
             }
         }
     
     return false;
```

然后在片源和顶点着色器中实现：

```c
Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                float4 clipPos;
                OUT.uv = TRANSFORM_TEX(IN.uv, _MainTex);

                 clipPos = float4(IN.uv * 2 - 1.0, 1.0, 1.0);
                float4 ScreenUV = mul(unity_CameraInvProjection, clipPos);
                //归一化设备坐标
                OUT.ScreenUV = ScreenUV.xyz / ScreenUV.w;
               
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 mainTex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv);
               

                float3 ScreenNormal = DecodeScreenNormalStereo(SAMPLE_TEXTURE2D(_CameraDepthNormalsTexture, sampler_CameraDepthNormalsTexture, IN.uv));
                
               //解码得到Linear01Depth和观察空间下的法线值
                float4 depthnormalTex = SAMPLE_TEXTURE2D(_CameraDepthNormalsTexture, sampler_CameraDepthNormalsTexture, IN.uv);
               
                float4 depthcolor = SAMPLE_TEXTURE2D_X(_CameraDepthTexture, sampler_CameraDepthTexture, IN.uv);
                float linear01Depth = Linear01Depth(depthcolor, _ZBufferParams);
       


                //重建观察空间下点的坐标
                float3 positionVS = linear01Depth *IN.ScreenUV;

                ScreenNormal = normalize(ScreenNormal);
                float3 viewDir = normalize(positionVS);

                float2 hitScreenPos = float2(0, 0);
                //计算反射方向
                float3 reflectDir =normalize(reflect(viewDir, ScreenNormal));
                
                float4 reflectTexMap = (0, 0, 0, 0);

                //Ray Marching***
                if (binarySearchRayMarching(positionVS, reflectDir, hitScreenPos,IN.uv))
                {
                   float4 reflectTex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex,hitScreenPos);
                   float ditherValue = SAMPLE_TEXTURE2D(_ditherMap, sampler_ditherMap, IN.uv * 0.25).a;
                   //mainTex.r = ditherValue;
                   float mask = SAMPLE_TEXTURE2D(_Mask, sampler_Mask, IN.uv);
    
                   
                   reflectTexMap.rgb += reflectTex.rgb;
                  
                    
               }
   
                  return reflectTexMap;
              
            }
            ENDHLSL
        }
```

![[9c702c51d31e03c156dfb2792dce287a_MD5.jpg]]

![[a71e64cabffc61473f604c6ec4c74c6d_MD5.jpg]]

## 效果优化：扰动：（暂时弃用）

```
TEXTURE2D(_DitherMap);
SAMPLER(sampler_DitherMap);
```

![[7015b7362e329bfe0ec278b30906b09c_MD5.jpg]]

新建一个 C# 文件，

不用太多，定义两个函数 GenerateDitherMap 并且将 Map 传给 Shader

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[ExecuteInEditMode]
public class ScreenSpaceReflection:MonoBehaviour
{

    [SerializeField]
    Material reflectionMaterial = null;
    Camera currentCamera = null;
    private Texture2D ditherMap = null;

    private void Awake()
    {
        var shader = Shader.Find("MyURP/URPssr");
        reflectionMaterial = new Material(shader);
        currentCamera = GetComponent<Camera>();
        ditherMap = GenerateDitherMap();
        reflectionMaterial.SetTexture("_ditherMap", ditherMap);

    }
    private void OnEnable()
    {
        if (ditherMap == null)
            ditherMap = GenerateDitherMap();

    }

private Texture2D GenerateDitherMap()
{ 
    int texSize = 4;
    var ditherMap = new Texture2D(texSize, texSize, TextureFormat.Alpha8, false, true);
    ditherMap.filterMode = FilterMode.Point;
        Color32[] colors = new Color32[texSize * texSize];

        colors[0] = GetDitherColor(0.0f);
        colors[1] = GetDitherColor(8.0f);
        colors[2] = GetDitherColor(2.0f);
        colors[3] = GetDitherColor(10.0f);
        colors[4] = GetDitherColor(12.0f);
        colors[5] = GetDitherColor(4.0f);
        colors[6] = GetDitherColor(14.0f);
        colors[7] = GetDitherColor(6.0f);
        colors[8] = GetDitherColor(3.0f);
        colors[9] = GetDitherColor(11.0f);
        colors[10] = GetDitherColor(1.0f);
        colors[11] = GetDitherColor(9.0f);
        colors[12] = GetDitherColor(15.0f);
        colors[13] = GetDitherColor(7.0f);
        colors[14] = GetDitherColor(13.0f);
        colors[15] = GetDitherColor(5.0f);

        ditherMap.SetPixels32(colors);
        ditherMap.Apply();
        return ditherMap;

    }

private Color32 GetDitherColor(float value)
    {
        byte byteValue = (byte)(value / 16.0f * 255);
        return new Color32(byteValue, byteValue, byteValue, byteValue);
    }


}
```

## 模糊处理 jitter（简单的高斯模糊）

一般高斯模糊需要两个 Pass，是一个 5x5 的矩阵

![[293fca2e2f7c696055de0f415cb1a29a_MD5.jpg]]

首先对于行进行模糊操作，然后对于列在进行模糊，

在 Shader 中新加一个 Pass，回来直接在 render feature 使用 cmd Blit 命令设置 Pass1 再画一遍即可，因这里只是对于水的操作，所以出于性能考虑，只模糊了一层。

```
Pass{
            Name"Blur"
            //ZTest Off
            //Cull Off
           // ZWrite Off

           
            HLSLPROGRAM
 #pragma vertex vert_blur
 #pragma fragment frag_blur
 #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
           
            struct v2f_blur
            {
                float4 positionHCS:SV_POSITION;
                float2 uv:TEXCOORD0;
                float4 uv01:TEXCOORD1;
                float4 uv23:TEXCOORD2;
                float4 uv45:TEXCOORD3;
            };

           


            v2f_blur vert_blur(Attributes v) {
                v2f_blur o;
                _offsets = _MainTex_TexelSize.xyxy;
                o.positionHCS = TransformObjectToHClip(v.positionOS);
                o.uv = v.uv;

                //对邻近区域使用的纹理坐标
                o.uv01 = v.uv.xyxy + _BlurSize * _offsets.xyxy * float4(1, 1, -1, -1);
                o.uv23 = v.uv.xyxy + _BlurSize * _offsets.xyxy * float4(1, 1, -1, -1) * 2.0;
                o.uv45 = v.uv.xyxy + _BlurSize * _offsets.xyxy * float4(1, 1, -1, -1) * 3.0;

                return o;

            }

            //计算进行滤波后的颜色
            half4 frag_blur(v2f_blur i) :SV_Target
            {

                half4 color = half4(0,0,0,0);
                color += 0.40 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv);
                color += 0.15 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv01.xy);
                color += 0.15 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv01.zw);
                color += 0.10 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex,i.uv23.xy);
                color += 0.10 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv23.zw);
                color += 0.05 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex,i.uv45.xy);
                color += 0.05 * SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv45.zw);
                return color;

            }

      

            ENDHLSL
            
        }
```

Tips：在这里分享下 Debug 技巧：一个一个 Pass 测试，可以输出到一个平面之中加入 MainTex 看看效果

![[b8ecc73734a2f4a1cc6ef13bb420d88f_MD5.jpg]]

直接放到场景里看效果测试

![[f786274e9873f1d0dd9337eff2d43ad9_MD5.jpg]]

## 自定义后处理：

Blit 命令好像不能设置局部的后处理，这里就先生成一个黑白 Mask 对于整个场景先遮罩，再后面的 Shader pass 中对于这个 Mask 采样，判断是否进行后处理

![[d1165d15317ed83e6d43db6256283e30_MD5.jpg]]

1. 建立 RenderFeature 框架，并且在 ReflectionPass 中申请 5 个 RenderTargetHandle ID

```
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class ReflectionFeature : ScriptableRendererFeature {
    class ReflectionPass : ScriptableRenderPass
    {
         private RenderTargetIdentifier source { get; set; }
        private RenderTargetHandle destination {get; set;}
        public Material reflectionMaterial = null;
        RenderTargetHandle MainTexID;
        RenderTargetHandle BlurID;
        RenderTargetHandle ReflectID;
        RenderTargetHandle MaskID;
        RenderTargetHandle SourID;
    
        FilteringSettings filter;
        FilteringSettings filterDepth;
        public ReflectionSettings settings;
        ShaderTagId shaderTag = new ShaderTagId("UniversalForward");

       }

    public void Setup(RenderTargetIdentifier source,RenderTargetHandle destination)
    {
        this.source = source;
        this.destination = destination;
    }

    public ReflectionPass(ReflectionSettings settings,Material reflectionMaterial)
    {

    }


    public override void Configure(CommandBuffer cmd,RenderTextureDescriptor cameraTextureDescriptor)
    {
        
    }

    public override void Execute(ScriptableRenderContext context,ref RenderingData renderingData)
    {

    }


}
    [System.Serializable]
    public class ReflectionSettings { 
    }

    public ReflectionSettings settings = new ReflectionSettings();
    ReflectionPass reflectionPass;
    RenderTargetHandle reflectTexture;
    public override void Create()
    {
        
    }

    // Here you can inject one or multiple render passes in the renderer.
    // This method is called when setting up the renderer once per-camera.
    public override void AddRenderPasses(ScriptableRenderer renderer,ref RenderingData renderingData)
    {

    }
```

定义 Reflectionsetting 类

```
public class ReflectionSettings {

        public Material reflectionMaterial = null;
        public LayerMask Reflection;
        public LayerMask Depth;
      
    }
```

定义 ReflectionPass 类：

```
public ReflectionPass(ReflectionSettings settings,Material reflectionMaterial) {
        this.settings = settings;
        this.reflectionMaterial = reflectionMaterial;
        SourID.Init("_SourTex");
        ReflectID.Init("_ReflectTex");
        MainTexID.Init("_MainTex");
        MaskID.Init("_Mask");


    }
```

在 Execute（）中执行并且执行之后释放 ID

```
public override void Execute(ScriptableRenderContext context,ref RenderingData renderingData)
    {
           


            CommandBuffer cmd = CommandBufferPool.Get("ReflectPass");

            RenderTextureDescriptor opaqueDescriptor = renderingData.cameraData.cameraTargetDescriptor;
            opaqueDescriptor.depthBufferBits = 0;


            //这里将原图像copy到sourceID中，后面做叠加使用
            int SourID = Shader.PropertyToID("_SourTex");
            cmd.GetTemporaryRT(SourID, opaqueDescriptor);
            cmd.CopyTexture(source, SourID);


            if (destination == RenderTargetHandle.CameraTarget)
            {

                // cmd.GetTemporaryRT(ReflectID.id, opaqueDescriptor, FilterMode.Point);

                cmd.GetTemporaryRT(BlurID.id, opaqueDescriptor, FilterMode.Point);
                cmd.GetTemporaryRT(ReflectID.id, opaqueDescriptor, FilterMode.Point);

                Blit(cmd, source, ReflectID.id, reflectionMaterial, 0);

                Blit(cmd, ReflectID.id, BlurID.id, reflectionMaterial, 1);
                Blit(cmd, BlurID.id, ReflectID.id);
                Blit(cmd, ReflectID.id, source, reflectionMaterial, 4);


            }
            else Blit(cmd, source, destination.Identifier());


            context.ExecuteCommandBuffer(cmd);
            CommandBufferPool.Release(cmd);
        }

 public override void FrameCleanup(CommandBuffer cmd)
        {

            if (destination == RenderTargetHandle.CameraTarget)
                // cmd.ReleaseTemporaryRT(MixID.id);
                cmd.ReleaseTemporaryRT(BlurID.id);
            cmd.ReleaseTemporaryRT(ReflectID.id);
            cmd.ReleaseTemporaryRT(SourID.id);
            cmd.ReleaseTemporaryRT(MainTexID.id);
            cmd.ReleaseTemporaryRT(MaskID.id);
        }
```

## 后处理过滤层级与 Mask

可以看到，上面的物体暂时都是被后处理过的，如果想局部后处理的话好像因 Blit 命令本身受到限制不能直接生成，所以只能退而求其次，主要是用 context.DrawRenderers 方法生成一张黑白色的遮罩贴图，然后需要另外一个 Pass 检测场景物体深度，写入这张 Mask 中。

![[7b5ea1132d4cd68aa82bc6d9f39e42f4_MD5.jpg]]

新建两个 FilterSettings 在 Pass 中

```
public ReflectionPass(ReflectionSettings settings,Material reflectionMaterial) {
        this.settings = settings;
        this.reflectionMaterial = reflectionMaterial;
        SourID.Init("_SourTex");
        ReflectID.Init("_ReflectTex");
        MainTexID.Init("_MainTex");
        MaskID.Init("_Mask");


        RenderQueueRange queue = new RenderQueueRange();
        queue.lowerBound = Mathf.Min(settings.QueueMin);
        queue.upperBound = Mathf.Max(settings.QueueMax);
        filter = new FilteringSettings(queue, settings.Reflection);
        filterDepth = new FilteringSettings(queue, settings.Depth);
    }
```

设置队列和 Layer

```
public class ReflectionSettings {

        public Material reflectionMaterial = null;
        public LayerMask Reflection;
        public LayerMask Depth;
        [Range(1000, 5000)] public int QueueMin = 2000;
        [Range(1000, 5000)] public int QueueMax = 2500;
    }
```

把 Mask 绘制在一张 RT 上，不需要画的物体为原始黑色，需要画的为白色，传入 Shader 中

```c
public override void Configure(CommandBuffer cmd,RenderTextureDescriptor cameraTextureDescriptor)
    {
            RenderTextureDescriptor desc = cameraTextureDescriptor;
            cmd.GetTemporaryRT(MaskID.id, desc);
            ConfigureTarget(MaskID.id);
            ConfigureClear(ClearFlag.All, Color.black);
        }

 public override void Execute(ScriptableRenderContext context,ref RenderingData renderingData)
    {
            //层级过滤,绘制Mask
            var draw = CreateDrawingSettings(shaderTag, ref renderingData, renderingData.cameraData.defaultOpaqueSortFlags);
            draw.overrideMaterial = settings.reflectionMaterial;
            draw.overrideMaterialPassIndex = 3;
            context.DrawRenderers(renderingData.cullResults, ref draw, ref filter);

//绘制Mask之前遮挡的物体
            var drawDepth = CreateDrawingSettings(shaderTag, ref renderingData, renderingData.cameraData.defaultOpaqueSortFlags);
            drawDepth.overrideMaterial = settings.reflectionMaterial;
            drawDepth.overrideMaterialPassIndex = 2;
            context.DrawRenderers(renderingData.cullResults, ref drawDepth, ref filterDepth);

            CommandBuffer cmd··
}
```

![[baaa336def2a694e8331cd54a8f87bac_MD5.jpg]]

![[103fbbc7c1166a62bfea8b702103e318_MD5.jpg]]

这样我们就有了完美的一张 Mask 图!

![[8c3d3d67dbb8613a266eff9cb9755ecc_MD5.jpg]]

MaskShaderPass：

```c
Pass//写入场景物体深度Pass2
            {
                Name "SceneDepthOnly"
                Tags{"LightMode" = "UniversalForward"}
                ZTest on
                ZWrite on
                Cull back


           HLSLPROGRAM

         #pragma vertex vert_depth
          #pragma fragment frag_depth

 struct a2v
 {
     float4 positionOS: POSITION;
 };

 struct v2f
 {
     float4 positionCS: SV_POSITION;
 };


 v2f vert_depth(a2v v)
 {
     v2f o;

     o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
     return o;
 }

 half4 frag_depth(v2f i) : SV_Target
 {
     return (0,0,0,0);
 }
 ENDHLSL


            }
    
                    
                    
         Pass{
     
     //pass3

                   Name"Mask"//Pass3

                    Tags{
                                  "LightMode" = "UniversalForward"}


                  ZTest on
                  ZWrite on
                  Cull back


                             HLSLPROGRAM

                             #pragma vertex vert_mask
                 #pragma fragment frag_mask

                        struct a2v {
                             float4 positionOS:POSITION;
                             float2 uv           : TEXCOORD0;
                        };
                         struct v2f {
                             float4 positionHCS : SV_POSITION;
                             float2 uv           : TEXCOORD0;
                         };


                         v2f vert_mask(a2v v)
                         {
                             v2f o;

                            o.positionHCS = TransformObjectToHClip(v.positionOS);
                            return o;

                     }
                         half4 frag_mask(v2f i) :SV_Target
                         {
                             return float4(1,1,1,1);

                         }

                 ENDHLSL
            }
```

[URP 系列教程 | 如何使用 Scriptable Renderer Feature 来自定义后处理效果](https://www.bilibili.com/read/cv11343490)[undefined](https://zhuanlan.zhihu.com/p/115080701)

## 合成

注意 MainTex 加上完 Reflect 会造成过曝情况，所以这里将 MainTex 的值映射回 0~1

```c
lerp(sourTex, reflectTex, reflectTex);
```

Pass4

```c
Pass{

         Name"Mix"//Pass4

                Tags{
                              "LightMode" = "UniversalForward"}

            ZTest Off
            Cull Off
            ZWrite Off
            Fog{ Mode Off }

              HLSLPROGRAM
 #pragma vertex vert_final
 #pragma fragment frag_final

                    struct a2v {
                         float4 positionOS:POSITION;
                         float2 uv           : TEXCOORD0;

                    };
                     struct v2f {
                         float4 positionHCS : SV_POSITION;
                         float2 uv           : TEXCOORD0;
                     };

                     v2f vert_final(a2v v)
                     {
                         v2f o;

                        o.positionHCS = TransformObjectToHClip(v.positionOS);
                        o.uv = v.uv;
                        return o;

                 }

                     half4 frag_final(v2f i) :SV_Target
                     {

                        half4 mainTex = SAMPLE_TEXTURE2D(_MainTex,sampler_MainTex,i.uv);
                        half4 reflectTex = SAMPLE_TEXTURE2D(_ReflectTex,sampler_ReflectTex,i.uv);
                        half4 sourTex = SAMPLE_TEXTURE2D(_SourTex, sampler_SourTex, i.uv);
                      
                      
                       
                        return
                            lerp(sourTex, reflectTex, reflectTex);
                               
                       



                     }

                                         ENDHLSL
                 }
```

## 工程与使用手册：

[https://github.com/alen-cell/SSRreflection](https://github.com/alen-cell/SSRreflection)

![[458e04d3025dd472a7459195aa58a278_MD5.jpg]]

![[40e39cf6aa5417dbd6a89f2c5cba94ab_MD5.jpg]]

*   set the layer in the object
*   set the layer in Renderfeature：
*   the reflection Layer is the water.etc
*   the depth layer is the object you want to render after the reflection surface

## 附录：

[[OpenGL] 屏幕空间反射效果](https://blog.csdn.net/ZJU_fish1996/article/details/89007236)[undefined](https://zhuanlan.zhihu.com/p/115080701)[Unity Shader - 反射效果（CubeMap，Reflection Probe，Planar Reflection，Screen Space Reflection）](https://blog.csdn.net/puppet_master/article/details/80808486)[undefined](https://zhuanlan.zhihu.com/p/232450616)[https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html](https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html)[URP 系列教程 | 如何使用 Scriptable Renderer Feature 来自定义后处理效果](https://www.bilibili.com/read/cv11343490)