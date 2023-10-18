       祝大家七夕情人节（DanShenJie）快乐，过情人节的，还不如写代码有意思！对吧？对吧？一定是对的！说着说着流下了眼泪。

说到反射，unity 里无非就几种方法：反射探针，屏幕空间反射，平面反射，光追的不在本文讨论里。其中反射探针因为支持离线反射探针所以性能最佳但是效果假（实时反射探针本质是 360 相机实时去拍就很费）；屏幕空间反射性能均衡稳定，但是要使用光线步进，性能和精度权衡需要取舍；平面反射是使用额外一个相机去实时拍也很费，但是精度和效果不错。本文使用的是利用屏幕空间的技术，平面反射的思想去综合得到一个**高性能高精度**的反射效果，屏幕空间平面反射 SSPR，手机上都能高性能跑。

       吹一波 C 神，本文是基于 Colin 神的移动端屏幕空间平面反射的开源项目得来。（https://github.com/ColinLeung-NiloCat/UnityURP-MobileScreenSpacePlanarReflection）

![[0d76676592ab7b11bf1b85b7e3e2cd2e_MD5.webp]]

        **核心原理**：区别与传统的屏幕空间反射，假如我们拿到一张图，我们要求出它的反射图，我们可以把该图垂直翻转一下，然后各裁剪一部分，拼合起来，如下图。

![[55960b2fb26e66bd006b954ae413bc94_MD5.webp]]

        但是现在问题来了，这个拼得太假了，拼的面完完全全就是一个强行拼接，归根到底是少了**透视关系**，没有近大远小的变化，拼合的平面也不是按照世界坐标的水平面走的。所以我们需要利用深度图去重建世界坐标系来解决这个问题。如下图就是本次屏幕空间平面反射应该得到的反射效果：蓝色箭头标出了消失点的方向，这是典型的三点透视；红线标出了反射平面的拼接位置，也满足透视效果，所以看起来就很真实。

![[325b645f85238ac0e115c0dbfbbb67b2_MD5.webp]]

典型的 3 点透视

        为了达到这个透视效果，我们需要重建原本颜色的世界坐标系和反射后的颜色对应的世界坐标系，并且经过 VP 矩阵在透视除法得到 NDC，最终得到屏幕坐标，思路有了，我们开始实现吧。

**一：拓展自己的屏幕空间平面反射后处理系统：**

GIF

![[f3f03008696acd014feed25e86267569_MD5.webp]]

RTsize，RT 的大小，一般 512 足以，越大越耗性能，移动端还可以降低。  

ReflectHeight：反射平面高度。

FadeOutRange：衰减范围，指定屏幕边缘的衰减程度。

代码就非常简单了，读者请直接看源码吧。

![[45a4bb7da7e5803b68aeb499ef866b48_MD5.webp]]

![[cc19eeba62210b806fd1ed578501feb9_MD5.png]]

**二, RendererFeature。**我们需要在 RendererFeature 里完成的事情也不多，本次计算全部放在 ComputeShader 里处理，所以要小心处理线程 id 和调度线程组 id 和 RT 的关系，也同时要申请 rt 和向 ComputeShader 传输数据。

对于高度为 RT，宽度为 RT/aspect（宽纵比）的一张图，我们需要 RT*RT/aspect 个线程进行处理。因为是对 2D 图像进行处理，我们希望调度线程 id 和 UV 保持对应。

故组内线程 id 里也使用 2 维（8，8，1），即一个线程组有 64 个线程；一个调度里同样使用 2 维（RT/8/aspect，RT/8，1），这样就可以保证 0->1 的 uv，对应的是 (0->RT-1)，这样 UV 和 id 的对应就能保证正确了。关于线程的关系，这里 ->[ComputeShader 容易混淆名词](https://www.bilibili.com/read/cv6995587)有详细解释）。由于我们可能计算出小数，所以需要取整，方法不唯一，读者可以参考我的方法根据自己的思路实现，下图为我对线程和 RT 的大小的计算。

![[c052f1dcc119e29fcc285343ca450f62_MD5.webp]]

![[316db344b3af1ab4de92a640f86b27e3_MD5.webp]]

![[53a6fa8194a5b5a981a6d373dcc5eba9_MD5.webp]]

然后把自定义后处理的参数传递过去，这里共计需要传 4 张图：1 张屏幕的颜色，1 张屏幕的深度，1 张反射后的屏幕颜色，1 张反射后的屏幕深度。前 2 张直接使用_CameraColorTexture 和_CameraDepthTexture 即可，这里直接嫖 URP 自带的。

![[bddcce80ed04e72089287cde225c82e1_MD5.webp]]

后面 2 张是要自己计算出来的，所以要绑 uav 开启随机读写，然后 commandbufffer 里申请 2 张 RT，在申请时要注意下格式，申请反射后的屏幕颜色要带 a 通道的格式在 shader 里作为 mask 使用，这里使用了 ARGB32，即每个通道占 8 字节；申请反射后的屏幕深度我只需要 r 通道来存深度足以，并且精度要求低我就使用了 R8，单通道 8 字节。

![[77dd76620d901230ed52b03b747d9914_MD5.webp]]

![[cc19eeba62210b806fd1ed578501feb9_MD5.png]]

**3. 核心计算，ComputeShader 部分。**先获取从 RendererFeature 那里的数据，同时声明了 2 个采样器，像素采样来采样深度图，模糊采样去采样颜色图。

![[8410881b5286d48f2b6163d4bcbb0fc6_MD5.webp]]

**1. 缓冲区赋初始值。**反射后的颜色和反射后的深度指定一个初始值，然后把它当成**新的颜色缓冲区**和**新的深度缓冲区**去进行一系列测试，如果全部测试都通过，则写入深度和颜色，否则不处理。

![[dc6e16207bb2e3e73805b490de988f92_MD5.webp]]

反射后的颜色缓冲区和深度缓冲区

**2. 重建世界坐标系。**根据调度线程 id，重建当前屏幕颜色的世界坐标系。读者直接看源码吧，我注释写得很清晰。

![[69c4cc1c5805598575e07317ba5ff7dc_MD5.webp]]

然后把计算出来的结果输出到 RflectRT 里，通过 FrameDebug 里找到该图，看着效果没问题。

![[67d5c677b99c24e3555e046850f8bbd3_MD5.webp]]

![[5dce67ab0b87eccdf278a2838602526a_MD5.webp]]

FrameDebug 的世界坐标系

**3. 重建反射后的世界坐标系。**关键点是把反射前的世界坐标系的 Y 值，照着反射平面高度为对称平面向下翻转，得到翻转后的新的世界坐标 Y 值，而 X 和 Z 不变，作为新的反射后的世界坐标。计算过程如下：先把反射前的 Y 向下平移使翻转轴在 Y=0 平面上，然后取负值，就已经翻转过来了，在向上平移同样距离即可得到新的 Y 值。

![[30a147129ef6665a5e17111ef38ac583_MD5.webp]]

这里对于翻转前就小于翻转平面高度的的像素无需进行后续计算，它们反射出来的东西就就是错误的，对于这些测试失败的像素直接舍弃即可（即使用缓冲区默认值）。

**4. 构建反射后屏幕 UV**。由于重建后的屏幕 uv 可能超出屏幕范围，故需要对超出屏幕范围的像素进行测试，测试失败则不在继续计算。最后再根据新的反射后的屏幕 UV 得到新的 id。

![[ce05e4497ba5a8e87f57650eb457f6fb_MD5.webp]]

**5. 反射后的世界坐标进行深度测试。**我们直接把反射后的颜色进行输出，并写一个简单的 shader 来接收这张图看看效果。

![[98c63f8efa87d785f8c916a7d156a4c8_MD5.webp]]

当我们的镜头角度较低时，发现天空盒的颜色也被绘制出来了，绘制天空盒到没啥，关键是它把正常的颜色也给覆盖了！

GIF

![[cc4d0ff8948baee5e361c58bb8472faf_MD5.webp]]

在某些角度时，在后面的木板也挡住了前面的工具桌，顺序完全乱了！

![[2fd5e71efa6f0af17790d11ce8cc2021_MD5.webp]]

这个本质是由于反射前的 2 个像素位置比较远，翻转反射后就重叠到一个位置了，但是一个位置只能显示一个像素，由于反射后的不可控的随机性我们无法直接处理谁先画谁后画，为了解决这个问题，需要对深度进行简单的测试来决定画谁的颜色。

使用之前的反射后的深度缓冲区来存储深度值，我直接使用了裁剪空间下的 z 值进行测试（读者使用 NDC 下的 Z 值也可），考虑到 Z 反向的问题，我会根据 OpenGL 和 DX 的平台进行深度测试。如果深度测试通过，则写入当前的深度和颜色到反射后的深度缓冲区和颜色缓冲区。

![[68d30512edb662e501955c20e3055a18_MD5.webp]]

![[cc19eeba62210b806fd1ed578501feb9_MD5.png]]

**6. 遮罩。**对于在接近屏幕边缘的部分，过渡十分僵硬，做一个简单的遮罩当蒙版使用。

![[f3efd6cac718770cca89b02faa4659e4_MD5.webp]]

我定义了一个 2d 的 SDF 距离场，计算出屏幕上的像素到屏幕边缘的距离，关于有向距离场请左转[有向距离场简介](https://www.bilibili.com/read/cv7199563)。

![[9c4f983826d32c34f6ecf1f55089fbab_MD5.webp]]

利用 SDF 计算出一个简单的屏幕遮罩，把它输出在 FrameDebug 里看看。

![[188e3cfc1f0f97762e4cf404f01c8966_MD5.webp]]

看着遮罩效果不错，可以用。

![[011f112639be379b3f5c4e8ab6557b4b_MD5.webp]]

我们把遮罩存到颜色缓冲区的 a 通道里，后面在 shader 进行计算处理一下，看看效果。

![[d30bcc6260bc6a872703d3778cd6bdaa_MD5.webp]]

遮罩效果出来了，至此就完成了基本功能的实现，我打包到手机上跑性能也非常不错，下篇文章将会对它的效果进行美化，后面我还想实现一个包含反射，折射，菲涅尔，快速傅里叶变换，边缘浪花，泡沫的等等效果的水体出来。

GIF

![[e431e95d20ced90245b5163d54484635_MD5.webp]]

给自己群打个广告: 950138189 欢迎各位对卡通渲染感兴趣的大佬们入驻！

工程地址在此：https://wwa.lanzous.com/iFR9cg200ha

RendererFeature

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

**ComputeShader**

#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

RWTexture2D<half4> RflectRT;// 存储反射后的颜色

RWTexture2D<half> ReDepthBufferRT;// 我们只用 r 通道 所以一维足以

Texture2D<float4> _ScreenColorTex;// 接收屏幕颜色图

Texture2D<float4> _ScreenDepthTex;// 接收屏幕深度图

float2 RTSize;

float ReflectPlaneHeight;

float FadeOut2Edge;

SamplerState PointClampSampler;// 像素采样，clamp 类型

SamplerState LinearClampSampler;// 模糊采样，clamp 类型

half sdfCube(half2 pos)

{

half2 dis = abs(pos) - half2(1, 1);

return length(max(dis, 0.0)) - min(max(dis.x, dis.y), 0.0);

}

#pragma kernel CSMain

[numthreads(8,8, 1)]// 最好是 64 的整数来提高性能，小于等于 256 保证移动端的性能支持

void CSMain(uint3 id:SV_DispatchThreadID)

{

RflectRT[id.xy] = half4(0, 0, 0, 0);// 我自定义反射后的颜色缓冲区 给了个初始颜色纯黑色 如果后续的各种测试通过 则把计算出来的颜色写入该缓冲区

ReDepthBufferRT[id.xy]=0;// 我自定义的反射后的深度缓冲区 给了个初始深度 如果后续的各种测试通过 则把计算出来的深度写入该缓冲区

float2 SSUV = id.xy / RTSize;// 由线程 id 换算到屏幕 uv  0-RTSize-1 remap 到 01  

float NDCposZ = _ScreenDepthTex.SampleLevel(PointClampSampler, SSUV, 0).x;// 得到深度根据 uv 采样对应的 id，这里使用 point 模式 + clamp

float4 NDCpos = float4(SSUV*2.0 - 1.0, NDCposZ, 1);// 这里没有考虑反向 Z 因为 VP 的逆矩阵已经处理好了反 Z

float4 HWSpos = mul(UNITY_MATRIX_I_VP, NDCpos);// 得到经过透除的世界坐标 其 w 值是我们用于透除的 w（near，far）的倒数

float3 WSpos = HWSpos.xyz / HWSpos.w;// 得到正常的世界坐标

//RflectRT[id.xy]=float4(WSpos,1);

if (WSpos.y < ReflectPlaneHeight)return;// 测试 1：高度测试，低于反射平面高度的测试失败 不写入颜色和深度

float3 reWSpos = WSpos;

reWSpos.y = -(reWSpos.y - ReflectPlaneHeight) + ReflectPlaneHeight;

float4 reCSpos = mul(UNITY_MATRIX_VP, float4(reWSpos, 1));

float2 reNDC = reCSpos.xy / reCSpos.w;

if (abs(reNDC.x) > 1 || abs(reNDC.y) > 1)return;// 测试 2 NDC 测试，超出 NDC 的部分测试失败 不写入颜色和深度

float2 reSSUV = reNDC * 0.5 + 0.5;

    #ifdef UNITY_UV_STARTS_AT_TOP //DX 平台有 Y 翻转要考虑

reSSUV.y = 1 - reSSUV.y;

    #endif

uint2 reSSUVid = reSSUV * RTSize;

#ifdef UNITY_REVERSED_Z

if(reCSpos.z<ReDepthBufferRT[reSSUVid])return;//DX 平台的深度测试 有 Z 反转  深度小的像素测试失败 不写入颜色和深度

#else

(reCSpos.z>=ReDepthBufferRT[reSSUVid])return;//OpenGL 平台的深度测试 没有 Z 反转  深度大的像素测试失败 不写入颜色和深度

#endif

half mask=sdfCube(SSUV*2-1);// 屏幕中心到屏幕边缘的距离, 有向

mask=smoothstep(0,FadeOut2Edge, abs(mask));

//RflectRT[reSSUVid]=mask;

RflectRT[reSSUVid] = half4(_ScreenColorTex.SampleLevel(LinearClampSampler, SSUV, 0).xyz, mask);// 写入颜色到反射颜色缓冲区

    ReDepthBufferRT[reSSUVid]=reCSpos.z;// 写入深度到反射深度缓冲区

}

**Volume**

namespace UnityEngine.Rendering.Universal

{ 

[SerializeField,VolumeComponentMenu("Mypost/ScreenSpacePlaneReflect")]

    public class ScreenSpacePlaneReflection :VolumeComponent

  {

        public BoolParameter on = new BoolParameter(false);

        public ClampedIntParameter RTsize = new ClampedIntParameter(512, 128, 720, false);

        public FloatParameter ReflectHeight = new FloatParameter(0.2f, false);

        public ClampedFloatParameter fadeOutRange = new ClampedFloatParameter(0.3f, 0.0f, 1.0f, false);

        public bool IsActive() => on.value;

        public bool IsTileCompatible() => false;

    }

}

**Shader**

Shader "WX/URP/reflect"

{

    Properties

    {

        _MainTex("MainTex",2D)="white"{}

        _BaseColor("BaseColor",Color)=(1,1,1,1)

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

        CBUFFER_END

        TEXTURE2D(_MainTex);

        SAMPLER(sampler_MainTex);

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

                //OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap)+ _Time.y*_UV_MoveSpeed;

                o.screenPos = ComputeScreenPos(o.positionCS);

                return o;

            }

            half4 frag(v2f i) : SV_Target

            { 

                half2 screenUV = i.screenPos.xy/i.screenPos.w;

                float4 SSPRResult = SAMPLE_TEXTURE2D(_ReflectColor,LinearClampSampler, screenUV);

SSPRResult.xyz *= SSPRResult.w;

                return SSPRResult;

            }

            ENDHLSL

        }

    }

}