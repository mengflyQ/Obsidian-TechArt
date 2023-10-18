![[395598a81e6a75edfe56ddf68383f507_MD5.webp]]

在上一篇文章里，[第三十五篇 屏幕空间平面反射](https://www.bilibili.com/read/cv7332339)里说了很多计算的内容，本文仅仅是补充。

由于像素的转换，从原图像翻转到新的反射图像，多个像素会重叠到一起从而导致绘制顺序的错误，比如下图中，红色 × 点和黄色 × 点翻转后的坐标都是蓝框里的位置，两者相互重叠了，后面我们通过深度测试解决了这个问题（**上一篇在使用裁剪坐标下的 z 值精度不足，，偶尔会出现排序错误问题，建议还是使用 NDC 的 Z 值进行深度测试**）。

![[2ba48c1455dffd45ec7fc76e50980618_MD5.webp]]

        既然会出现原始图像的多个像素翻转后对应翻转后的同一个像素，那也会出现因为透视变形被压缩的不可见像素的对应翻转后新的像素。但是它是没有原始数据的，翻转后就是黑色的小孔洞，如下图所示。

![[5c3ddc066deb47c61d65280554a2ab20_MD5.webp]]

翻转后的图像有大量小洞需要处理

        我们需要在 ComputeShader 里对图像进行处理，把这些小洞进行填充，填充后效果如下。

![[20668d6c98c85f5506a84c5a8c81f6dd_MD5.webp]]

处理后的小洞几乎都消失了

**填充算法**：本算法的原理是先找到这些小洞的像素，然后取附近的一个像素进行填充。如何确定一个像素就是小洞的像素呢？它必须满足以下条件。

1.  该像素本身的灰度值 (明度值) 为 0. 这是该像素为小洞的必要条件。
    
2.  该像素的上下左右临近像素的灰度值 (明度值)，必定存在一个不为 0。这样就直接排除掉下面的区域不被包含进去。为了节省计算量（保证效果的前提下），我只取了上和右的像素即可满足需要。
    

![[824eb1a906d9b5680e490abc730985ac_MD5.webp]]

在 ComputeShader 里，我定义了一个函数去计算明度（灰度），然后再计算出当前像素的颜色和灰度，右侧的像素的颜色和灰度，上侧的像素的颜色和灰度。

![[ac5e34c269af4f80a88154b9900705fb_MD5.webp]]

我随后通过一个条件去检测当前像素是不是小洞：

如果中心像素的灰度不为 0，那它就不是黑色，肯定不是小洞，直接 return；

如果上面的像素灰度和右侧的像素灰度之和为 0，2 个非 0 之和为 0，那就只有 0+0==0 成立，则说明中心像素附近的像素也是黑色，肯定不是小洞，直接 return。

![[1fc9cbea66d945e1da5a023b431894b3_MD5.webp]]

测试通过后，再赋颜色。取周围非 0 像素赋值给中心像素，先判断上部的像素是不是 0，如果是 0 则赋右侧的像素。

![[bfce6089359b196bf9667277c6763e51_MD5.webp]]

完整的填充小洞处理函数

这样，computeShader 里的第一个函数处理小洞就完成了，但是由于这一步的性能消耗比较大，而且我们往往对反射后的图像还会做各种扭曲扰动所以有无小洞不是特别敏感，所以我在后处理里添加了脚本去控制是否开启计算 “小洞填充”。

GIF

![[431fbaea7f8e8ab3dabdda1221a0f672_MD5.webp]]

后处理控制是否计算小洞填充

**HDR**: 有的时候，我们希望反射的 RT 图像能存储 HDR，而上一篇文里我们使用了 ARGB32 来存储，也就是单通道 8 字节，这是存储 LDR 的纹理格式，我们需要改成 ARGBhalf，即每个通道 16 字节来存储，但是它会无疑增大消耗，尤其是对带宽敏感的移动端需谨慎使用。在 volume 里扩展一个 bool 进行 2 种格式的切换，下面是效果图，读者直接看源码即可。

GIF

![[8b8945b6ee93f946a07eba671e162c42_MD5.webp]]

关于闪烁：目前还是没有好的高性能的解决方法, 在 shader 里我们通过扭曲一下 UV 达到扰动效果来模拟水波的反射质感，闪烁的问题就几乎看不出来了。

GIF

![[a557a7d53ace0e6f78e9d9166a3e29f5_MD5.webp]]

后续如果需要制作高质量的水体，再结合折射，法线，FFT 等等效果就能做出很棒的质感了。Shader 代码比较简单，这里就不贴上来了，读者直接下载附件的工程即可。

下载链接：https://wwa.lanzous.com/iB8bfg41uqh

**ComputeShader** 

#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

RWTexture2D<half4> RflectRT;// 存储反射后的颜色

RWTexture2D<half> ReDepthBufferRT;// 我们只用 r 通道 所以一维足以

Texture2D<float4> _ScreenColorTex;// 接收屏幕颜色图

Texture2D<float4> _ScreenDepthTex;// 接收屏幕深度图

float2 RTSize;

float ReflectPlaneHeight;

float FadeOut2Edge;

SamplerState PointClampSampler;// 像素采样，clamp 类型

SamplerState LinearClampSampler;// 模糊采样，clamp 类型

half sdfCube(half2 pos)

{

    half2 dis = abs(pos) - half2(1, 1);

    return length(max(dis, 0.0)) - min(max(dis.x, dis.y), 0.0);

}

#pragma kernel CSMain

[numthreads(8,8, 1)]// 最好是 64 的整数来提高性能，小于等于 256 保证移动端的性能支持

void CSMain(uint3 id:SV_DispatchThreadID)

{

    RflectRT[id.xy] = half4(0, 0, 0, 0);// 我自定义反射后的颜色缓冲区 给了个初始颜色纯黑色 如果后续的各种测试通过 则把计算出来的颜色写入该缓冲区

    ReDepthBufferRT[id.xy]=0;// 我自定义的反射后的深度缓冲区 给了个初始深度 如果后续的各种测试通过 则把计算出来的深度写入该缓冲区

    float2 SSUV = id.xy / RTSize;// 由线程 id 换算到屏幕 uv  0-RTSize-1 remap 到 01  

    float NDCposZ = _ScreenDepthTex.SampleLevel(PointClampSampler, SSUV, 0).x;// 得到深度根据 uv 采样对应的 id，这里使用 point 模式 + clamp

    float4 NDCpos = float4(SSUV*2.0 - 1.0, NDCposZ, 1);// 这里没有考虑反向 Z 因为 VP 的逆矩阵已经处理好了反 Z

    float4 HWSpos = mul(UNITY_MATRIX_I_VP, NDCpos);// 得到经过透除的世界坐标 其 w 值是我们用于透除的 w（near，far）的倒数

    float3 WSpos = HWSpos.xyz / HWSpos.w;// 得到正常的世界坐标

    //RflectRT[id.xy]=float4(WSpos,1);

    if (WSpos.y < ReflectPlaneHeight)return;// 测试 1：高度测试，低于反射平面高度的测试失败 不写入颜色和深度

    float3 reWSpos = WSpos;

    reWSpos.y = -(reWSpos.y - ReflectPlaneHeight) + ReflectPlaneHeight;

    float4 reCSpos = mul(UNITY_MATRIX_VP, float4(reWSpos, 1));

    float2 reNDC = reCSpos.xy / reCSpos.w;

    if (abs(reNDC.x) > 1 || abs(reNDC.y) > 1)return;// 测试 2 NDC 测试，超出 NDC 的部分测试失败 不写入颜色和深度

    float2 reSSUV = reNDC * 0.5 + 0.5;

    #ifdef UNITY_UV_STARTS_AT_TOP //DX 平台有 Y 翻转要考虑

    reSSUV.y = 1 - reSSUV.y;

    #endif

    uint2 reSSUVid = reSSUV * RTSize;

    #ifdef UNITY_REVERSED_Z

     if(reCSpos.z/reCSpos.w<=ReDepthBufferRT[reSSUVid])return;//DX 平台的深度测试 有 Z 反转  深度小的像素测试失败 不写入颜色和深度

    #else

    (reCSpos.z/reCSpos.w>=ReDepthBufferRT[reSSUVid])return;//OpenGL 平台的深度测试 没有 Z 反转  深度大的像素测试失败 不写入颜色和深度

    #endif

    half mask=sdfCube(SSUV*2-1);// 屏幕中心到屏幕边缘的距离, 有向

    mask=smoothstep(0,FadeOut2Edge, abs(mask));

    //RflectRT[reSSUVid]=mask;

    RflectRT[reSSUVid] = half4(_ScreenColorTex.SampleLevel(LinearClampSampler, SSUV, 0).xyz,mask);// 写入颜色到反射颜色缓冲区

    ReDepthBufferRT[reSSUVid]=reCSpos.z/reCSpos.w;// 写入深度到反射深度缓冲区

}

half GetGray(float4 color)// 计算颜色灰度

{

    return color.r*0.22+color.g*0.8+color.b*0.02;

}

#pragma kernel FillHoles

[numthreads(8,8,1)]

void FillHoles(uint3 id:SV_DispatchThreadID)

{

    float4 center=RflectRT[id.xy];

    float4 top=RflectRT[uint2(id.x,id.y+1)];

    float4 right=RflectRT[uint2(id.x+1,id.y)];

    float centerColor=GetGray(center);// 求中心灰度

    float topColor=GetGray(top);// 求上面像素灰度

    float rightColor=GetGray(right);// 求左边像素灰度

    if (centerColor!=0||(topColor+rightColor)==0)return;    // 中心点有颜色的排除掉；四周没颜色的点排除掉

    RflectRT[id.xy]=topColor>0?top:right;

}

**RendererFeature**

using UnityEngine;

using UnityEngine.Rendering;

using UnityEngine.Rendering.Universal;

public class SSPR : ScriptableRendererFeature

{

    public struct Thread// 存储线程相关的数据

    {

        public int GroupThreadX;// 组内线程 id x 分量   

        public int GroupThreadY;// 组内线程 id y 分量 

        public int GroupX;// 线程组 id x 分量     

        public int GroupY;// 线程组 id y 分量

    }

    [System.Serializable]

    public class Setting

    {

       // public ComputeShader cs;

        public RenderPassEvent eventPlugIn = RenderPassEvent.AfterRenderingTransparents;

        public string cmdName = "屏幕空间平面反射";

    }

    public Setting setting;

    class CustomRenderPass : ScriptableRenderPass

    {

        ScreenSpacePlaneReflection SSPRvolume;

        Thread SSRthreadInf = new Thread();

        Setting myset;

        int Xsize;// 这个才是真实的 rt 水平大小

        int Ysize;// 这个才是真实的 rt 垂直大小

        private static readonly int Reflect = Shader.PropertyToID("_ReflectColor");// 我定义了一张 RT 用来存储反射图像的颜色 当颜色缓冲区使

        RenderTargetIdentifier Reflectid = new RenderTargetIdentifier(Reflect);

        private static readonly int ReDepthBuffer = Shader.PropertyToID("ReDepthBufferTex");// 我定义了一张 RT 用来存储反射图像的深度 当深度缓冲区使 用来对反射图像进行深度测试

        RenderTargetIdentifier ReDepthBufferid = new RenderTargetIdentifier(ReDepthBuffer);

        ComputeShader cs;

        public CustomRenderPass(Setting SET)

        {

            this.myset = SET;

        }

        public override void Configure(CommandBuffer cmd, RenderTextureDescriptor cameraTextureDescriptor)

        {

            var POSTstack = VolumeManager.instance.stack;

            SSPRvolume = POSTstack.GetComponent<ScreenSpacePlaneReflection>();// 获取自定义的 volume 组件的参数来控制反射的效果

            float aspect = (float)Screen.height / Screen.width;

            SSRthreadInf.GroupThreadX = 8;

            SSRthreadInf.GroupThreadY = 8;

            SSRthreadInf.GroupY = SSPRvolume.RTsize.value / SSRthreadInf.GroupThreadY;

            SSRthreadInf.GroupX = Mathf.RoundToInt(SSRthreadInf.GroupY / aspect);

            this.Xsize = SSRthreadInf.GroupThreadX * SSRthreadInf.GroupX;

            this.Ysize = SSRthreadInf.GroupY * SSRthreadInf.GroupThreadY;

            RenderTextureDescriptor desc = new RenderTextureDescriptor(Xsize, Ysize, RenderTextureFormat.ARGB32);//ARGB 是用来存颜色通道的 这个图要传给 shader 注意我们要 a 当遮罩 精度我认为单通道 8 字节足够了

            if(SSPRvolume.HDR.value)

            {

                desc.colorFormat = RenderTextureFormat.ARGBHalf;

            }

            desc.enableRandomWrite = true;// 绑定 uav

            cmd.GetTemporaryRT(Reflect, desc);

            desc.colorFormat = RenderTextureFormat.R8;// 这个图只需要 r 通道即可 并且精度要求不高 8 字节即可

            cmd.GetTemporaryRT(ReDepthBuffer, desc);

            cs = (ComputeShader)Resources.Load("SSPRcomputeShader");

        }

        public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)

        {

            if(cs==null)

            {

                Debug.LogError("SSPRcomputeShader 丢失！");

                return;

            }

            if (SSPRvolume.on.value)

            {

                CommandBuffer cmd = CommandBufferPool.Get(myset.cmdName);

                cmd.SetComputeFloatParam(cs, Shader.PropertyToID("ReflectPlaneHeight"), SSPRvolume.ReflectHeight.value);

                cmd.SetComputeVectorParam(cs, Shader.PropertyToID("RTSize"), new Vector2(Xsize, Ysize));

                //cmd.SetComputeVectorParam(cs, Shader.PropertyToID("GroupThread"), new Vector2(SSRthreadInf.GroupThreadX,SSRthreadInf.GroupThreadY));

                cmd.SetComputeFloatParam(cs, Shader.PropertyToID("FadeOut2Edge"), SSPRvolume.fadeOutRange.value);

                cmd.SetComputeTextureParam(cs, 0, Shader.PropertyToID("RflectRT"), Reflectid);

                cmd.SetComputeTextureParam(cs, 0, Shader.PropertyToID("ReDepthBufferRT"), ReDepthBufferid);

                cmd.SetComputeTextureParam(cs, 0, Shader.PropertyToID("_ScreenColorTex"), new RenderTargetIdentifier("_CameraColorTexture"));

                cmd.SetComputeTextureParam(cs, 0, Shader.PropertyToID("_ScreenDepthTex"), new RenderTargetIdentifier("_CameraDepthTexture"));

                cmd.DispatchCompute(cs, 0, SSRthreadInf.GroupX, SSRthreadInf.GroupY, 1);

                if (SSPRvolume.FillHoles.value)

                {

                    cmd.SetComputeTextureParam(cs, 1, Shader.PropertyToID("RflectRT"), Reflectid);

                    cmd.DispatchCompute(cs, 1, SSRthreadInf.GroupX, SSRthreadInf.GroupY, 1);

                }

                context.ExecuteCommandBuffer(cmd);

                CommandBufferPool.Release(cmd);

            }

        }

        public override void FrameCleanup(CommandBuffer cmd)

        {

            cmd.ReleaseTemporaryRT(Reflect);

            cmd.ReleaseTemporaryRT(ReDepthBuffer);

        }

    }

    CustomRenderPass m_ScriptablePass;

    public override void Create()

    {

        m_ScriptablePass = new CustomRenderPass(setting);

        m_ScriptablePass.renderPassEvent = setting.eventPlugIn;

    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)

    {

            renderer.EnqueuePass(m_ScriptablePass);

    }

}

namespace UnityEngine.Rendering.Universal

{ 

[SerializeField,VolumeComponentMenu("Mypost/ScreenSpacePlaneReflect")]

    public class ScreenSpacePlaneReflection :VolumeComponent

  {

        public BoolParameter on = new BoolParameter(false);

        [Tooltip("是否填充黑斑点，填充后性能更费")]  public BoolParameter FillHoles = new BoolParameter(false);

        [Tooltip("是否开启 HDR，开启后 RT 单个通道占用翻倍（8bit 到 16bit）")] public BoolParameter HDR = new BoolParameter(false);

        [Tooltip("RT 的大小，越大性能越费")] public ClampedIntParameter RTsize = new ClampedIntParameter(512, 128, 720, false);

        [Tooltip("反射平面的高度")] public FloatParameter ReflectHeight = new FloatParameter(0.2f, false);

        [Tooltip("距离屏幕边缘的衰减")] public ClampedFloatParameter fadeOutRange = new ClampedFloatParameter(0.3f, 0.0f, 1.0f, false);

        public bool IsActive() => on.value;

        public bool IsTileCompatible() => false;

    }

}

Shader "URP/reflect"

{

    Properties

    {

        _MainTex("MainTex",2D)="white"{}

        _BaseColor("BaseColor",Color)=(1,1,1,1)

        [Normal]_NormalTex("NormalTex",2D)="bump"{}

        _ReflectNoise("ReflectNoise",Range(0,100))=20

        [Header(NORMAL1)]

        _Normal1Str("NormalScale1",Range(0,1))=1

        _scale1("Scale1",float)=1

        _flowSpeed1("FlowSpeed1",Range(-1,1))=0.5

        [Header(NORMAL2)]

        _Normal2Str("NormalScale2",Range(0,1))=1

        _scale2("Scale2",float)=-1

        _flowSpeed2("FlowSpeed2",Range(-1,1))=0.5

    }

    SubShader

    {

        Tags{

        "RenderPipeline"="UniversalRenderPipeline"

        "Queue"="Overlay"

        }

        HLSLINCLUDE

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        CBUFFER_START(UnityPerMaterial)

        float4 _MainTex_ST;

        half4 _BaseColor;

        real _Normal1Str;

        real _Normal2Str;

        real _ReflectNoise;

        float _flowSpeed1;

        float _scale1;

        float _scale2;

        float _flowSpeed2;

        float4 _NormalTex_TexelSize;

        CBUFFER_END

        TEXTURE2D(_MainTex);

        SAMPLER(sampler_MainTex);

        TEXTURE2D(_NormalTex);

        SAMPLER(sampler_NormalTex);

        TEXTURE2D(_ReflectColor);

        sampler LinearClampSampler;

         struct a2v

         {

             float4 positionOS:POSITION;

             float4 normalOS:NORMAL;

             float2 texcoord:TEXCOORD;

         };

         struct v2f

         {

             float4 positionCS:SV_POSITION;

             float2 texcoord:TEXCOORD;

             float4 screenPos:TEXCOORD1  ;

             float3 posWS:TEXCOORD2 ;

             float4 texcoordNor:TEXCOORD3;

         };

        ENDHLSL

        pass

        {

        Tags{

         "LightMode"="UniversalForward"

         "RenderType"="Overlay"

            }

            HLSLPROGRAM

            #pragma vertex vert

            #pragma fragment frag 

            v2f vert(a2v i)

            {

                v2f o;

                o.positionCS = TransformObjectToHClip(i.positionOS.xyz);

                o.texcoord=i.texcoord;

                o.texcoordNor.xy=i.texcoord*_scale1+_Time.y*_flowSpeed1*0.05;

                o.texcoordNor.zw=i.texcoord*_scale2+_Time.y*_flowSpeed2*0.05;

                o.screenPos = ComputeScreenPos(o.positionCS);

                return o;

            }

            float3  NormalBlend(float3 A, float3 B);

            real4 frag(v2f i) : SV_Target

            { 

                real4 texcolor=SAMPLE_TEXTURE2D(_MainTex,sampler_MainTex,i.texcoord);

                real4 normaltex1=SAMPLE_TEXTURE2D(_NormalTex,sampler_NormalTex,i.texcoordNor.xy);

                float3 TSnormal1=UnpackNormalScale(normaltex1,_Normal1Str);

                real4 normaltex2=SAMPLE_TEXTURE2D(_NormalTex,sampler_NormalTex,i.texcoordNor.zw);

                float3 TSnormal2=UnpackNormalScale(normaltex2,_Normal2Str);

                float3 normalMix=NormalBlend(TSnormal2,TSnormal1);

                float2 UVoffset=normalMix.xy*_NormalTex_TexelSize.xy*_ReflectNoise;

                half2 screenUV = i.screenPos.xy/i.screenPos.w;

                real4 SSPRResult = SAMPLE_TEXTURE2D(_ReflectColor,LinearClampSampler,screenUV+UVoffset);

SSPRResult.xyz *= SSPRResult.w;

                return SSPRResult+texcolor;

            }

            float3  NormalBlend(float3 A, float3 B)// 从 shadergraph 里白嫖的算法

            {

            return normalize(float3(A.rg + B.rg, A.b * B.b));

            }

            ENDHLSL

        }

    }

}