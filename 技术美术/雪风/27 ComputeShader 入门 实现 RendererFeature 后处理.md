        ComputeShader 是一种特殊的 shader，不同于顶点片元着色器，它能充分利用 gpu 的并行计算能力，实现超级大量的重复的计算，比如上一篇文章里所使用的 VEG 粒子特效就是充分利用 ComputeShader 的特性去实现的，除了做复杂的粒子，它还可以做后处理，做 GPU 布料解算等等。本文就是利用它实现后处理 RendererFeature。

        第一步，右键创建 shader/ComputeShader，ComputeShader 是后缀为 compute 的文件，以下是我写的一个 Computeshader。

![[2749a495f8b16033a5b93ce73d3fafdd_MD5.webp]]

        **#pragma kernel CSMain** ，指定要编译的函数，这个在 C# 可以被指定调用。

        **RWTexture2D<float4>** 和 **Texture2D<float4>** 是指的声明一张可读写的 tex 和可读不可写的 tex，前者可以用来修改，两者都通过 C# 传值。

        **float _Bright** 等，指定变量，通过 C# 传值。

        **[numthreads(8,8,1)]**，指定一个线程组里的线程的排序组成， [numthreads(x,y,z)] 里的 x 是水平方向的个数，y 是垂直方向个数，z 是维度方向个数。这里有篇文章非常棒可以参考。https://blog.csdn.net/weixin_38884324/article/details/80570160

        **void CSMain (uint3 id : SV_DispatchThreadID)**，定义函数用来处理图像，和 shader 的语法类似，还是利用《入门精要》的算法，非常简单。

        第二步，写自己的 rendererFeature，我定义了一个 RenderColorAdjust 的 RendererFeature，写法也和之前的专栏的写法基本上是一致的，需要注意点的就是向 ComputeShader 传数据使用的函数不一样了。

        向 ComputeShader 传 float：**CommandBuffer.SetComputeFloatParam()** 函数；

        向 ComputeShader 传贴图：**CommandBuffer.SetComputeTextureParam()** 函数；

       调度 ComputeShader 里的函数，**CommandBuffer.DispatchCompute（）**，执行 ComputeShader 里的某个函数。它在 FrameDebug 里可以查看到。

![[848ea749582fa6c25bafc4ba453397b3_MD5.webp]]

       最后，这个效果就完成了，这个和第 17 篇里的 [https://www.bilibili.com/read/cv6554452](https://www.bilibili.com/read/cv6554452) 效果一致，但是一个是使用顶点片元着色器，一个是 computeshader 去实现。

       我们可以通过 RendererFeature 去调整后处理的效果，以下为对比度调整的效果。

![[a92c88a9c6e24323703cfce08cc0507f_MD5.webp]]

对比度调整

![[4fb07d649fda428f9216395ef7024bfa_MD5.webp]]

亮度调整

![[767b9e27b402f9f71aa67b8f7a8ed10b_MD5.webp]]

饱和度调整

最后附上源码

RenderFeature

using UnityEngine;

using UnityEngine.Rendering;

using UnityEngine.Rendering.Universal;

public class RenderColorAdjust : ScriptableRendererFeature

{

    [System.Serializable]public class setting

    {

        public ComputeShader CS=null;

        [Range(0,2)]public float Saturate=1;

        [Range(0,2)]public float Bright=1;

        [Range(-2,3)]public float Constrast=1;

        public RenderPassEvent Event=RenderPassEvent.AfterRenderingTransparents;

    }

    public setting mysetting;

    class CustomRenderPass : ScriptableRenderPass

    {

        private ComputeShader CS;

        private setting Myset;

        private RenderTargetIdentifier Sour;

        public  CustomRenderPass(setting set)

        {

            this.Myset=set;

            this.CS=set.CS;

        }

        public void setup(RenderTargetIdentifier source)

        {

            this.Sour=source;

        }

        public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)

        {

            CommandBuffer cmd=CommandBufferPool.Get("ColorAdjust");

            int tempID=Shader.PropertyToID("temp1");

            RenderTextureDescriptor desc=renderingData.cameraData.cameraTargetDescriptor;

            desc.enableRandomWrite=true;

            cmd.GetTemporaryRT(tempID,desc);

            cmd.SetComputeFloatParam(CS,"_Bright",Myset.Bright);

            cmd.SetComputeFloatParam(CS,"_Saturate",Myset.Saturate);

            cmd.SetComputeFloatParam(CS,"_Constrast",Myset.Constrast);

            cmd.SetComputeTextureParam(CS,0,"_Result",tempID);

            cmd.SetComputeTextureParam(CS,0,"_Sour",Sour);

            cmd.DispatchCompute(CS,0,(int)desc.width/8,(int)desc.height/8,1);

            cmd.Blit(tempID,Sour);

            context.ExecuteCommandBuffer(cmd);

            CommandBufferPool.Release(cmd);

        }

    }

    CustomRenderPass m_ScriptablePass;

    public override void Create()

    {

        m_ScriptablePass = new CustomRenderPass(mysetting);

        m_ScriptablePass.renderPassEvent =mysetting.Event;

    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)

    {

        if(mysetting.CS!=null)

        {

        m_ScriptablePass.setup(renderer.cameraColorTarget);

        renderer.EnqueuePass(m_ScriptablePass);

        }

        else

        {

            Debug.LogError("ComputeShader missing!!");

        }

    }

}

ComputeShader

#pragma kernel CSMain 

RWTexture2D<float4> _Result;// 可读性的 tex

Texture2D<float4> _Sour;// 可读不可写 tex

float _Bright;

float _Saturate;

float _Constrast;

[numthreads(8,8,1)]// 一个线程组的设定

void CSMain (uint3 id : SV_DispatchThreadID)

{

    _Result[id.xy] =_Sour[id.xy];

    _Result[id.xy]*=_Bright;// 计算明度

    float gray=_Result[id.xy].x*0.21+_Result[id.xy].y*0.71+_Result[id.xy].z*0.08;// 计算灰度

    _Result[id.xy]=lerp(float4(gray,gray,gray,1),_Result[id.xy],_Saturate);// 饱和度

    _Result[id.xy]=lerp(float4(0.5,0.5,0.5,1),_Result[id.xy],_Constrast);// 计算对比度

}