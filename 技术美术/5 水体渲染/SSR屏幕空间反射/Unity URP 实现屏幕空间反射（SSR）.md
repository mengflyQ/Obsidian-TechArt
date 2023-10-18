Unity 版本：2022

URP 版本：14.0

基础 SSR 很简单，更重要的是如何对其进行优化和应用。在本文中，首先完成了在观察空间的 SSR，然后优化到屏幕光栅空间 SSR，最后加上二分和 Dither。

## SSR

SSR 可以理解为 Screen Space Raytracing（在屏幕空间做光追），从而在实时渲染中实现全局光照的方法。由于 SSR 在屏幕空间进行，所以我们只知道屏幕空间中已有的信息，也就是从 camera 看去场景得到的一层 “壳”。

SSR 大致可以分为两步，第一步是求光线与屏幕空间的 “壳” 进行求交，第二步是求出交点对 shading point 的贡献值。

在本文中，我们只讨论 specular 反射的情况。所以只需要关注光线与屏幕空间求交即可。

由于在屏幕空间进行，所以我们需要用到深度图和法线图。利用法线图计算出着色点反射光线，从观察空间出发进行 raymarching，如果步近深度大于表面深度（深度图采样），则认为当前点与物体相交。并将着色点颜色赋为交点颜色。

![[e4cc8d4a9129d8b433ba13cecb957d13_MD5.jpg]]

SSR 需要全屏深度图和法线图，并且还需要在 GPU 上进行光追，性能的消耗是很明显的。所以基础 SSR 原理很简单，但后面衍生出了很多实现的变种和优化和如何应用 SSR 更为重要。

由于 SSR 只能通过屏幕信息来计算着色点的颜色，所以那些不在屏幕空间内的信息是无法进行反射的。

首先不在屏幕空间这层 “壳” 中的信息是不会被反射的，丢失正常的反射信息。如图，手掌不在这层 “壳” 中，所以反射的信息是没有手掌的。

![[e6365ee1f9c6d43f8e8a47783229fadd_MD5.jpg]]

还存在屏幕边缘信息丢失的问题。如图，地板上的红色部分是有反射的，但是黄色部分由于是在屏幕外，因为得不到反射。但是实际上他应该是有反射的。

![[01d2127e39bee464998be7d163634f53_MD5.jpg]]

尽管如此，由于 SSR 算法可以带来实时的反射效果，并且可以很快的实现质量较好反射效果，它的应用也是蒸蒸日上的。

在下文中，我们会先在观察空间中做一个最基础的 SSR，然后按照[这篇论文](https://jcgt.org/published/0003/04/04/paper.pdf)的方法将其投影到屏幕空间中进行 DDA 光线追踪，然后再将其优化为二分（感觉对于屏幕空间的二分优化程度并不明显），最后添加对屏幕光追优化最明显的 jitter dither raymarching。具体原理编写变叙述吧。

## C# 脚本

C# 脚本就是最基本的绘制全屏后处理，使用 RendererFeature 在渲染不透明物体后（这里先不考虑半透明物体）插入 SSR 的 RenderPass，并对其进行模糊处理，最后再与相机叠加。

其中传值涉及到从深度图重建世界坐标的代码，可以参考：

[undefined](https://zhuanlan.zhihu.com/p/648793922)

代码如下，这里直接全部给出来了，最重要的还是 Shader。

```cs
using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace SSR{
    internal enum BlendMode{
        Addtive,
        Balance
    }

    [Serializable]
    internal class SSRSettings{
        // 填当前feature的参数
        [SerializeField] [Range(0.0f, 1.0f)] internal float Intensity = 0.8f;
        [SerializeField] internal float MaxDistance = 10.0f;
        [SerializeField] internal int Stride = 30;
        [SerializeField] internal int StepCount = 12;
        [SerializeField] internal float Thickness = 0.5f;
        [SerializeField] internal int BinaryCount = 6;
        [SerializeField] internal bool jitterDither = true;
        [SerializeField] internal BlendMode blendMode = BlendMode.Addtive;
        [SerializeField] internal float BlurRadius = 1.0f;
    }


    [DisallowMultipleRendererFeature("SSR")]
    public class SSR : ScriptableRendererFeature{
        [SerializeField] private SSRSettings mSettings = new SSRSettings();

        private Shader mShader;
        private const string mShaderName = "Hidden/SSR";

        private RenderPass mRenderPass;
        private Material mMaterial;

        public override void Create() {
            if (mRenderPass == null) {
                mRenderPass = new RenderPass();
                // 修改注入点
                mRenderPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
            }
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData) {
            if (renderingData.cameraData.postProcessEnabled) {
                if (!GetMaterials()) {
                    Debug.LogErrorFormat("{0}.AddRenderPasses(): Missing material. {1} render pass will not be added.", GetType().Name, name);
                    return;
                }

                bool shouldAdd = mRenderPass.Setup(ref mSettings, ref mMaterial);

                if (shouldAdd)
                    renderer.EnqueuePass(mRenderPass);
            }
        }

        protected override void Dispose(bool disposing) {
            CoreUtils.Destroy(mMaterial);

            mRenderPass?.Dispose();
            mRenderPass = null;
        }

        private bool GetMaterials() {
            if (mShader == null)
                mShader = Shader.Find(mShaderName);
            if (mMaterial == null && mShader != null)
                mMaterial = CoreUtils.CreateEngineMaterial(mShader);
            return mMaterial != null;
        }

        class RenderPass : ScriptableRenderPass{
            internal enum ShaderPass{
                Raymarching,
                Blur,
                Addtive,
                Balance,
            }

            private SSRSettings mSettings;

            private Material mMaterial;

            private ProfilingSampler mProfilingSampler = new ProfilingSampler("SSR");
            private RenderTextureDescriptor mSSRDescriptor;

            private RTHandle mSourceTexture;
            private RTHandle mDestinationTexture;

            private static readonly int mProjectionParams2ID = Shader.PropertyToID("_ProjectionParams2"),
                mCameraViewTopLeftCornerID = Shader.PropertyToID("_CameraViewTopLeftCorner"),
                mCameraViewXExtentID = Shader.PropertyToID("_CameraViewXExtent"),
                mCameraViewYExtentID = Shader.PropertyToID("_CameraViewYExtent"),
                mSourceSizeID = Shader.PropertyToID("_SourceSize"),
                mSSRParams0ID = Shader.PropertyToID("_SSRParams0"),
                mSSRParams1ID = Shader.PropertyToID("_SSRParams1"),
                mBlurRadiusID = Shader.PropertyToID("_SSRBlurRadius");

            private const string mJitterKeyword = "_JITTER_ON";

            private RTHandle mSSRTexture0, mSSRTexture1;

            private const string mSSRTexture0Name = "_SSRTexture0",
                mSSRTexture1Name = "_SSRTexture1";

            internal RenderPass() {
                mSettings = new SSRSettings();
            }

            internal bool Setup(ref SSRSettings featureSettings, ref Material material) {
                mMaterial = material;
                mSettings = featureSettings;

                ConfigureInput(ScriptableRenderPassInput.Normal);

                return mMaterial != null;
            }

            public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
                var renderer = renderingData.cameraData.renderer;

                // 发送参数
                Matrix4x4 view = renderingData.cameraData.GetViewMatrix();
                Matrix4x4 proj = renderingData.cameraData.GetProjectionMatrix();
                Matrix4x4 vp = proj * view;

                // 将camera view space 的平移置为0，用来计算world space下相对于相机的vector
                Matrix4x4 cview = view;
                cview.SetColumn(3, new Vector4(0.0f, 0.0f, 0.0f, 1.0f));
                Matrix4x4 cviewProj = proj * cview;

                // 计算viewProj逆矩阵，即从裁剪空间变换到世界空间
                Matrix4x4 cviewProjInv = cviewProj.inverse;

                // 计算世界空间下，近平面四个角的坐标
                var near = renderingData.cameraData.camera.nearClipPlane;
                // Vector4 topLeftCorner = cviewProjInv * new Vector4(-near, near, -near, near);
                // Vector4 topRightCorner = cviewProjInv * new Vector4(near, near, -near, near);
                // Vector4 bottomLeftCorner = cviewProjInv * new Vector4(-near, -near, -near, near);
                Vector4 topLeftCorner = cviewProjInv.MultiplyPoint(new Vector4(-1.0f, 1.0f, -1.0f, 1.0f));
                Vector4 topRightCorner = cviewProjInv.MultiplyPoint(new Vector4(1.0f, 1.0f, -1.0f, 1.0f));
                Vector4 bottomLeftCorner = cviewProjInv.MultiplyPoint(new Vector4(-1.0f, -1.0f, -1.0f, 1.0f));

                // 计算相机近平面上方向向量
                Vector4 cameraXExtent = topRightCorner - topLeftCorner;
                Vector4 cameraYExtent = bottomLeftCorner - topLeftCorner;

                near = renderingData.cameraData.camera.nearClipPlane;

                // 发送ReconstructViewPos参数
                mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
                mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
                mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
                mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));

                mMaterial.SetVector(mSourceSizeID, new Vector4(mSSRDescriptor.width, mSSRDescriptor.height, 1.0f / mSSRDescriptor.width, 1.0f / mSSRDescriptor.height));

                // 发送SSR参数
                mMaterial.SetVector(mSSRParams0ID, new Vector4(mSettings.MaxDistance, mSettings.Stride, mSettings.StepCount, mSettings.Thickness));
                mMaterial.SetVector(mSSRParams1ID, new Vector4(mSettings.BinaryCount, mSettings.Intensity, 0.0f, 0.0f));

                // 设置全局keyword
                if (mSettings.jitterDither) {
                    mMaterial.EnableKeyword(mJitterKeyword);
                }
                else {
                    mMaterial.DisableKeyword(mJitterKeyword);
                }

                // 分配RTHandle
                mSSRDescriptor = renderingData.cameraData.cameraTargetDescriptor;
                mSSRDescriptor.msaaSamples = 1;
                mSSRDescriptor.depthBufferBits = 0;
                RenderingUtils.ReAllocateIfNeeded(ref mSSRTexture0, mSSRDescriptor, name: mSSRTexture0Name);
                RenderingUtils.ReAllocateIfNeeded(ref mSSRTexture1, mSSRDescriptor, name: mSSRTexture1Name);

                // 配置目标和清除
                ConfigureTarget(renderer.cameraColorTargetHandle);
                ConfigureClear(ClearFlag.None, Color.white);
            }

            public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData) {
                if (mMaterial == null) {
                    Debug.LogErrorFormat("{0}.Execute(): Missing material. ScreenSpaceAmbientOcclusion pass will not execute. Check for missing reference in the renderer resources.", GetType().Name);
                    return;
                }

                var cmd = CommandBufferPool.Get();
                context.ExecuteCommandBuffer(cmd);
                cmd.Clear();

                mSourceTexture = renderingData.cameraData.renderer.cameraColorTargetHandle;
                mDestinationTexture = renderingData.cameraData.renderer.cameraColorTargetHandle;

                using (new ProfilingScope(cmd, mProfilingSampler)) {
                    // SSR
                    Blitter.BlitCameraTexture(cmd, mSourceTexture, mSSRTexture0, mMaterial, (int)ShaderPass.Raymarching);

                    // Horizontal Blur
                    cmd.SetGlobalVector(mBlurRadiusID, new Vector4(mSettings.BlurRadius, 0.0f, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mSSRTexture0, mSSRTexture1, mMaterial, (int)ShaderPass.Blur);

                    // Vertical Blur
                    cmd.SetGlobalVector(mBlurRadiusID, new Vector4(0.0f, mSettings.BlurRadius, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mSSRTexture1, mSSRTexture0, mMaterial, (int)ShaderPass.Blur);

                    // Additive Pass
                    Blitter.BlitCameraTexture(cmd, mSSRTexture0, mDestinationTexture, mMaterial, mSettings.blendMode == BlendMode.Addtive ? (int)ShaderPass.Addtive : (int)ShaderPass.Balance);
                }

                context.ExecuteCommandBuffer(cmd);
                CommandBufferPool.Release(cmd);
            }

            public override void OnCameraCleanup(CommandBuffer cmd) {
                mSourceTexture = null;
                mDestinationTexture = null;
            }

            public void Dispose() {
                // 释放RTHandle
                mSSRTexture0?.Release();
                mSSRTexture1?.Release();
            }
        }
    }
}
```

## 观察空间光线追踪

虽然说是在观察空间，但这里为了方便，我们选择的是**世界空间中相对相机坐标**（即在世界空间中，从从相机到顶点的偏移向量）。这样就不用将法线图的法线再进行一次空间转换。在本节中，我们统称观察空间。

因为这是最基础的做法， 所以做的也很粗糙看看效果，最后都要全部优化掉。

### 重建观察空间

从深度图中重建观察空间的方法有很多，可以在 GPU 中利用逆矩阵从 NDC 空间中变换到观察空间，也可以通过 C# 发送的相机射线来辅助还原。这里使用精度更高，计算更少的第二种方法。

具体的做法讨论可以参考：

[undefined](https://zhuanlan.zhihu.com/p/648793922)

**再重复一下，为了避免对法线的空间转换，这里我们将观察空间当作是世界空间中，顶点到相机的偏移位置。**

```cs
public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
    // 发送参数
    Matrix4x4 view = renderingData.cameraData.GetViewMatrix();
    Matrix4x4 proj = renderingData.cameraData.GetProjectionMatrix();
    Matrix4x4 vp = proj * view;

    // 将camera view space 的平移置为0，用来计算world space下相对于相机的vector
    Matrix4x4 cview = view;
    cview.SetColumn(3, new Vector4(0.0f, 0.0f, 0.0f, 1.0f));
    Matrix4x4 cviewProj = proj * cview;

    // 计算viewProj逆矩阵，即从裁剪空间变换到世界空间
    Matrix4x4 cviewProjInv = cviewProj.inverse;

    // 计算世界空间下，近平面四个角的坐标
    var near = renderingData.cameraData.camera.nearClipPlane;
    // Vector4 topLeftCorner = cviewProjInv * new Vector4(-near, near, -near, near);
    // Vector4 topRightCorner = cviewProjInv * new Vector4(near, near, -near, near);
    // Vector4 bottomLeftCorner = cviewProjInv * new Vector4(-near, -near, -near, near);
    Vector4 topLeftCorner = cviewProjInv.MultiplyPoint(new Vector4(-1.0f, 1.0f, -1.0f, 1.0f));
    Vector4 topRightCorner = cviewProjInv.MultiplyPoint(new Vector4(1.0f, 1.0f, -1.0f, 1.0f));
    Vector4 bottomLeftCorner = cviewProjInv.MultiplyPoint(new Vector4(-1.0f, -1.0f, -1.0f, 1.0f));

    // 计算相机近平面上方向向量
    Vector4 cameraXExtent = topRightCorner - topLeftCorner;
    Vector4 cameraYExtent = bottomLeftCorner - topLeftCorner;

    near = renderingData.cameraData.camera.nearClipPlane;
    // 计算相机近平面上方向向量
    Vector4 cameraXExtent = topRightCorner - topLeftCorner;
    Vector4 cameraYExtent = bottomLeftCorner - topLeftCorner;

    near = renderingData.cameraData.camera.nearClipPlane;

    // 发送ReconstructViewPos参数
    mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
    mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
    mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
    mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));

    // 配置目标和清除
    ConfigureTarget(renderer.cameraColorTargetHandle);
    ConfigureClear(ClearFlag.None, Color.white);
}
```

```cs
float4 _ProjectionParams2; 
float4 _CameraViewTopLeftCorner; 
float4 _CameraViewXExtent; 
float4 _CameraViewYExtent; 

// 还原世界空间下，相对于相机的位置 
half3 ReconstructViewPos(float2 uv, float linearEyeDepth) { 
    // Screen is y-inverted 
    uv.y = 1.0 - uv.y; 

    float zScale = linearEyeDepth * _ProjectionParams2.x; // divide by near plane 
    float3 viewPos = _CameraViewTopLeftCorner.xyz + _CameraViewXExtent.xyz * uv.x + _CameraViewYExtent.xyz * uv.y; 
    viewPos *= zScale; 
    return viewPos; 
}
```

![[8bdadb327f704638007e9e46b73c6e1d_MD5.jpg]]

### 还原 UV 及深度

除此之外，我们还需要从观察空间顶点中还原屏幕空间 uv 和深度。只需要将顶点变换到裁剪空间下，此时的 w 分量就是片元深度，再将裁剪空间的 xy 映射到 [0,1] 即可。

具体原理可参考：

[undefined](https://zhuanlan.zhihu.com/p/648793922)

```cs
// 从观察空间坐标片元uv和深度 
void ReconstructUVAndDepth(float3 wpos, out float2 uv, out float depth) {  
    float4 cpos = mul(UNITY_MATRIX_VP, wpos);  
    uv = float2(cpos.x, cpos.y * _ProjectionParams.x) / cpos.w * 0.5 + 0.5;  
    depth = cpos.w;  
}
```

### 光线追踪

有了上面两个辅助函数，就可以正式开始光追了。首先通过深度图还原出观察空间着色点 x，通过法线图采样法线 n。

![[8f1ef29cb4a8d4723d2386057ff9c9d7_MD5.jpg]]

步骤如下：

*   对于着色点 x，计算出反射方向 R
*   以着色点 x 为起点，每次沿着 R 方向偏移一个定长得到新的点 $x_{i}=x+i\times \Delta p$
*   计算新点 xi 的深度和 uv，并用 uv 采样深度图得到表面深度
*   如果新点 xi 的深度大于表面深度，则认为点 xi 为反射光线与物体交点 P，将 x 颜色赋为 P 颜色

**注意 for 循环时一定要开 UNITY_LOOP，否则循环次数是静态的，步数上去了编译展开可能会超过指令数量。**

```cs
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl" 
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl" 
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareNormalsTexture.hlsl" 
#include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"
 #define MAXDISTANCE 15
#define STEP_COUNT 100 
#define THICKNESS 0.3
#define STEP_SIZE 0.1

half4 GetSource(half2 uv) { 
    return SAMPLE_TEXTURE2D_X_LOD(_BlitTexture, sampler_LinearRepeat, uv, _BlitMipLevel); 
}

half4 SSRPassFragment(Varyings input) : SV_Target { 
    float rawDepth = SampleSceneDepth(input.texcoord); 
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams); 
    float3 viewPos = ReconstructViewPos(input.texcoord, linearDepth); 
    float3 viewNormal = SampleSceneNormals(input.texcoord); 
    float3 viewDir = normalize(viewPos); 
    float3 reflectDir = normalize(reflect(viewDir, viewNormal)); 

    float2 uv; 
    float depth;

    UNITY_UNROLL  
    for (int i = 0; i < STEP_COUNT; i++) { 
    float3 viewPos2 = viewPos + reflectDir * STEPSIZE * i; 
    float2 uv2; 
    float stepDepth; 
    ReconstructUVAndDepth(viewPos2, uv2, stepDepth); 
    float stepRawDepth = SampleSceneDepth(uv2); 
    float stepSurfaceDepth = LinearEyeDepth(stepRawDepth, _ZBufferParams); 
    if (stepSurfaceDepth < stepDepth && stepDepth < stepSurfaceDepth + THICKNESS) 
            return GetSource(uv2); 
    }    
    return half4(0.0, 0.0, 0.0, 1.0); 
}
```

其中，THICKNESS 表示物体厚度阈值。由于步近精度的问题，判断” 击中 “物体时，可能已经深入表面一段距离了，而 THICKNESS 就是用来限制击中点到表面的厚度。

如下图，这是步长 0.1，步数 100 的效果。从这张图就可以明显感受到，不在屏幕信息的” 龙头下方 “，无法被反射：

![[b3cf6986cd50190423c150eb64821828_MD5.jpg]]

## 屏幕空间光栅化光线追踪

### DDA 画线算法

在开始屏幕空间光追前，需要先引入一种在 2D 空间下画线的方法，即 DDA 画线算法。

这里直接引用大佬[这篇文章](https://zhuanlan.zhihu.com/p/386510829)的讲解：

![[9d39a2c8636334ba9beb7deb49a998bb_MD5.jpg]]

![[005ff9c8beaed084f165f9829367e484_MD5.jpg]]

DDA 画线算法是在屏幕空间最简单的一种画线算法（首先要明白在显示器上画线本质是画一系列的点）。如上图所示，如果需要画一条 A 到 B 的线，就需要确定 AB 线段经过了那些像素，然后把那些像素涂黑即可。

那么 DDA 画线算法的步骤是怎样的呢？其实非常简单，如上图所示，已知点 $A=(x,y)$ ，那么下一个需要画线的点就是 $P_{0}=A+(\Delta x, \Delta y)$ ，依次类推再下一个点就是 $P_{1}=P_{0}+(\Delta x, \Delta y)$ ，直到画到点 $B$ 。

可以看出 DDA 画线算法的关键就在于选取 $\Delta x, \Delta y$ ，对于斜率小于 1 的通常的选取为：

$\begin{align} \Delta x &= 1\\ \Delta y &= \frac{y_{B}-y_{A}}{x_{B}-x_{A}} \end{align}$

$\Delta x$ 指的是一个像素。对于斜率大于 1，为了代码的简洁则可以交换 $x,~y$ 。这样对于 $x$ 而言每次像素增加 1，对于 $y$ 而言每次最多增加 1。DDA 画线算法伪代码如下：

```
if(abs(xB - xA) < abs(yB -yA))
    swap(A,B);
float deltaX = 1.0f;
float deltaY = (yB - yA) / (xB - xA);
Point P = A;
for A to B
    P += float2(deltaX, deltaY);
    DrawPixel(int(P.x),int(P.y));
```

**DDA 非常适合 GPU，因为 GPU 的浮点数计算能力更强，而对于 CPU 中画线，则可以采用浮点计算更少的 Bresenham 画线算法。**

### Efficient GPU Screen-Space Ray Tracing

我们上文是通过观察空间进行 RayMarching 的，三维空间有一个很大的性质就是近大远小，就是所谓的透视效果，那么我们在观察空间步进一步，光栅化后对应到屏幕空间，可能就不一定是一个像素了。即在远处可能我们步进一步或者几步结果只对应到一个像素，这就浪费了计算；而到近处时，可能我们在观察空间步进一个单位，就已经跨过好多个像素了，这又涉及到了采样不足，可能效果不好。

如下图，非常多的观察空间点对应的是同一个像素，这就导致了一些区域过采样。

![[3869beffa93b1265f11460d60cbec153_MD5.jpg]]

如下图，观察空间点之间所采样的深度可能有比较大的间隔，这就导致了一些区域低采样。

![[c6e5348d3517a9d7df2c1181c7414ba8_MD5.jpg]]

因此[这篇论文](https://jcgt.org/published/0003/04/04/paper.pdf)的作者提出，将着色点从观察空间投影到屏幕空间。

我们希望在屏幕空间可以保证沿着反射光线方向进行步进，不漏掉一个像素，也不重复采样一个像素。其实也就是光栅化的方式。于是我们可以将观察空间的起点 $Q_{0}$ 和终点 $Q_{1}$ 投影到屏幕光栅空间 $H_{0},~H_{1}$ 。然后再从 $H_{0}$ 到 $H_{1}$ 进行 DDA 画线法采样。这样的好处就在于**绝不会重复采样，也保证会连续采样**。

由于屏幕空间丢失了 z 值信息，我们需要单独记录屏幕空间 $H_{0},~H_{1}$ 对应观察空间的深度。

在 DDA 算法中，我们记录屏幕空间的 $\Delta x,~\Delta y$ ，在每步进一步时，对当前屏幕坐标点 $P$ 进行线性偏移。但是当屏幕空间的点进行一次线性步近时，并不能将其映射到观察空间的等长线性步近。究其原因还是投影变换是非线性变换。

如下图， $H_{0},~H_{1}$ 是观察空间顶点 $Q_{0},~Q_{1}$ 投影到屏幕空间的对应点。当屏幕空间点 $H$ 等长线性步近时，观察空间点 $Q$ 的步近是非等长的。

![[0fc5bc8e202474cd66f45bda8b68f5e9_MD5.jpg]]

而我们需要做的就是利用 w 分量的线性增长通过齐次除法将屏幕空间和观察空间连接起来。

$\begin{align} V&=ProjectionMatrix\times Q\\ k&=V.w\\ V&/=V.w \end{align}$

其中， $Q$ 为观察空间顶点， $V$ 为经过齐次除法的观察空间顶点，此时 $V$ 的增长和屏幕空间就呈线性关系了。当从 $H_{0}$ 变换到 $H_{1}$ 的时候，不再变换 $Q$ ，而是变换 $V$ 。

同时为了将顶点 $V_{0},~V_{1}$ 还原回 $Q_{0},~Q_{1}$ ，还需要将 k 从 $k_{0}$ 变化到 $k_{1}$ 。

$\begin{align} V&=V\cdot K\\ Q&=InverseProjectMatrix\times V \end{align}$

这个过程可能有点抽象，而且确实需要注意一下，最开始自己写着写着忘记了好久才反应过来。可以结合 MVP 变换和代码慢慢想想。

### 代码实现

原理在上面已经阐述，下面直接给出代码吧。

```
#ifndef _SSR_PASS_INCLUDED 
#define _SSR_PASS_INCLUDED 
 #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl" 
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl" 
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareNormalsTexture.hlsl" 
#include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl" 

float4 _ProjectionParams2; 
float4 _CameraViewTopLeftCorner; 
float4 _CameraViewXExtent; 
float4 _CameraViewYExtent; 
 #define MAXDISTANCE 10 
#define STRIDE 3 
#define STEP_COUNT 200 
// 能反射和不可能的反射之间的界限 
#define THICKNESS 0.5 

void swap(inout float v0, inout float v1) { 
    float temp = v0; 
    v0 = v1; 
    v1 = temp;
}  

half4 GetSource(half2 uv) { 
    return SAMPLE_TEXTURE2D_X_LOD(_BlitTexture, sampler_LinearRepeat, uv, _BlitMipLevel); 
}  

// 还原世界空间下，相对于相机的位置 
half3 ReconstructViewPos(float2 uv, float linearEyeDepth) { 
    // Screen is y-inverted 
    uv.y = 1.0 - uv.y; 

    float zScale = linearEyeDepth * _ProjectionParams2.x; // divide by near plane 
    float3 viewPos = _CameraViewTopLeftCorner.xyz + _CameraViewXExtent.xyz * uv.x + _CameraViewYExtent.xyz * uv.y; 
    viewPos *= zScale; 
    return viewPos; 
}  

// 从世界空间坐标转片元uv和深度 
float4 TransformViewToHScreen(float3 viewPos, float2 screenSize) { 
    float4 cpos = mul(UNITY_MATRIX_P, viewPos); 
    cpos.xy = float2(cpos.x, cpos.y * _ProjectionParams.x) * 0.5 + 0.5 * cpos.w; 
    cpos.xy *= screenSize; 
    return cpos; 
}  

float4 _SourceSize; 

half4 SSRPassFragment(Varyings input) : SV_Target { 
    float rawDepth = SampleSceneDepth(input.texcoord); 
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams); 
    float3 viewPos = ReconstructViewPos(input.texcoord, linearDepth); 
    float3 normal = SampleSceneNormals(input.texcoord); 
    float3 viewDir = normalize(viewPos); 
    float3 reflectDir = TransformWorldToViewDir(normalize(reflect(viewDir, normal))); 

    float magnitude = MAXDISTANCE; 

    // 观察空间坐标 
    viewPos = _WorldSpaceCameraPos + viewPos; 
    float3 startView = TransformWorldToView(viewPos); 
    float end = startView.z + reflectDir.z * magnitude; 
    if (end > -_ProjectionParams.y) 
        magnitude = (-_ProjectionParams.y - startView.z) / reflectDir.z; 
    float3 endView = startView + reflectDir * magnitude; 

    // 齐次屏幕空间坐标 
    float4 startHScreen = TransformViewToHScreen(startView, _SourceSize.xy); 
    float4 endHScreen = TransformViewToHScreen(endView, _SourceSize.xy); 

    // inverse w 
    float startK = 1.0 / startHScreen.w; 
    float endK = 1.0 / endHScreen.w; 

    //  结束屏幕空间坐标 
    float2 startScreen = startHScreen.xy * startK; 
    float2 endScreen = endHScreen.xy * endK; 

    // 经过齐次除法的视角坐标 
    float3 startQ = startView * startK; 
    float3 endQ = endView * endK; 

    // 根据斜率将dx=1 dy = delta 
    float2 diff = endScreen - startScreen; 
    bool permute = false; 
    if (abs(diff.x) < abs(diff.y)) { 
        permute = true; 

        diff = diff.yx; 
        startScreen = startScreen.yx; 
        endScreen = endScreen.yx; 
    }  
    // 计算屏幕坐标、齐次视坐标、inverse-w的线性增量 
    float dir = sign(diff.x); 
    float invdx = dir / diff.x; 
    float2 dp = float2(dir, invdx * diff.y); 
    float3 dq = (endQ - startQ) * invdx; 
    float dk = (endK - startK) * invdx; 

    dp *= STRIDE; 
    dq *= STRIDE; 
    dk *= STRIDE; 

    // 缓存当前深度和位置 
    float rayZMin = startView.z; 
    float rayZMax = startView.z; 
    float preZ = startView.z; 

    float2 P = startScreen; 
    float3 Q = startQ; 
    float K = startK; 

    end = endScreen.x * dir; 

    // 进行屏幕空间射线步近 
    UNITY_LOOP  
    for (int i = 0; i < STEP_COUNT && P.x * dir <= end; i++) { 
        // 步近 
        P += dp; 
        Q.z += dq.z; 
        K += dk; 
        // 得到步近前后两点的深度 
        rayZMin = preZ; 
        rayZMax = (dq.z * 0.5 + Q.z) / (dk * 0.5 + K); 
        preZ = rayZMax;        if (rayZMin > rayZMax) 
            swap(rayZMin, rayZMax); 

        // 得到交点uv 
        float2 hitUV = permute ? P.yx : P; 
        hitUV *= _SourceSize.zw; 
        if (any(hitUV < 0.0) || any(hitUV > 1.0)) 
            return GetSource(input.texcoord); 
        float surfaceDepth = -LinearEyeDepth(SampleSceneDepth(hitUV), _ZBufferParams); 
        bool isBehind = (rayZMin + 0.1 <= surfaceDepth); // 加一个bias 防止stride过小，自反射 
        bool intersecting = isBehind && (rayZMax >= surfaceDepth - THICKNESS); 

        if (intersecting) 
            return GetSource(hitUV) + GetSource(input.texcoord); 
    }  

    return GetSource(input.texcoord); 
}  
 #endif
```

STRIDE=3, STEP_COUNT = 200, THICKNESS = 0.5

![[9f8513ebdd0f9db02a1d100a0b5cb3f0_MD5.jpg]]

当步长增大，步数变小时，可能会出现” 断带 “的情况。我们可以通过二分法或者 jitter dither 的方法解决，后者的效果更为明显。

STRIDE=30, STEPCOUNT=12, BINARYCOUNT = 1

![[be2167af3cc6fc06f5647dbcbcf7abc6_MD5.jpg]]

## 二分搜索

一种线性搜索的经典优化方式就是二分搜索。但感觉在屏幕空间的二分优化效果并不像在观察空间那样明显，但这里都写了还是提一下。

我们首先给定一个较大的步长，然后进行光追：

*   如果没击中物体，则返回假。
*   如果击中物体，有两种情况：
*   距离小于厚度，返回真
*   距离大于厚度，向后步近一次，步长除以 2，继续重复上述过程

代码如下，写起来还是有点麻烦，因为步近的量有 3 个，3 个都需要回溯。

```
bool ScreenSpaceRayMarching(inout float2 P, inout float3 Q, inout float K, float2 dp, float3 dq, float dk, float rayZ, bool permute, out float depthDistance, inout float2 hitUV) {
    // float end = endScreen.x * dir;
    float rayZMin = rayZ;
    float rayZMax = rayZ;
    float preZ = rayZ;

    // 进行屏幕空间射线步近
    UNITY_LOOP
    for (int i = 0; i < STEP_COUNT; i++) {
        // 步近
        P += dp;
        Q += dq;
        K += dk;

        // 得到步近前后两点的深度
        rayZMin = preZ;
        rayZMax = (dq.z * 0.5 + Q.z) / (dk * 0.5 + K);
        preZ = rayZMax;
        if (rayZMin > rayZMax)
            swap(rayZMin, rayZMax);

        // 得到交点uv
        hitUV = permute > 0.5 ? P.yx : P;
        hitUV *= _SourceSize.zw;

        if (any(hitUV < 0.0) || any(hitUV > 1.0))
            return false;

        float surfaceDepth = -LinearEyeDepth(SampleSceneDepth(hitUV), _ZBufferParams);
        bool isBehind = (rayZMin + 0.1 <= surfaceDepth); // 加一个bias 防止stride过小，自反射

        depthDistance = abs(surfaceDepth - rayZMax);

        if (isBehind) {
            return true;
        }
    }
    return false;
}

bool BinarySearchRaymarching(float3 startView, float3 reflectDir, inout float2 hitUV) {
    float magnitude = MAXDISTANCE;

    float end = startView.z + reflectDir.z * magnitude;
    if (end > -_ProjectionParams.y)
        magnitude = (-_ProjectionParams.y - startView.z) / reflectDir.z;
    float3 endView = startView + reflectDir * magnitude;

    // 齐次屏幕空间坐标
    float4 startHScreen = TransformViewToHScreen(startView, _SourceSize.xy);
    float4 endHScreen = TransformViewToHScreen(endView, _SourceSize.xy);

    // inverse w
    float startK = 1.0 / startHScreen.w;
    float endK = 1.0 / endHScreen.w;

    //  结束屏幕空间坐标
    float2 startScreen = startHScreen.xy * startK;
    float2 endScreen = endHScreen.xy * endK;

    // 经过齐次除法的视角坐标
    float3 startQ = startView * startK;
    float3 endQ = endView * endK;

    float stride = STRIDE;

    float depthDistance = 0.0;

    bool permute = false;

    // 根据斜率将dx=1 dy = delta
    float2 diff = endScreen - startScreen;
    if (abs(diff.x) < abs(diff.y)) {
        permute = true;

        diff = diff.yx;
        startScreen = startScreen.yx;
        endScreen = endScreen.yx;
    }

    // 计算屏幕坐标、齐次视坐标、inverse-w的线性增量
    float dir = sign(diff.x);
    float invdx = dir / diff.x;
    float2 dp = float2(dir, invdx * diff.y);
    float3 dq = (endQ - startQ) * invdx;
    float dk = (endK - startK) * invdx;

    dp *= stride;
    dq *= stride;
    dk *= stride;

    // 缓存当前深度和位置
    float rayZ = startView.z;

    float2 P = startScreen;
    float3 Q = startQ;
    float K = startK;

    UNITY_LOOP
    for (int i = 0; i < BINARY_COUNT; i++) {
        if (ScreenSpaceRayMarching(P, Q, K, dp, dq, dk, rayZ, permute, depthDistance, hitUV)) {
            if (depthDistance < THICKNESS)
                return true;
            P -= dp;
            Q -= dq;
            K -= dk;
            rayZ = Q / K;

            dp *= 0.5;
            dq *= 0.5;
            dk *= 0.5;
        }
        else {
            return false;
        }
    }
    return false;
}
```

STRIDE=3, STEPCOUNT=200, BINARY_COUNT = 1

![[bc972670062df1fb075bec4ae7fc7642_MD5.jpg]]

STRIDE=30, STEPCOUNT=12, BINARYCOUNT = 1

![[be2167af3cc6fc06f5647dbcbcf7abc6_MD5.jpg]]

STRIDE=30,STEPCOUNT=12,BIANRYCOUNT=6

![[59b29454e6bd04f0ddad7ebe6e066d9c_MD5.jpg]]

虽然使用二分，在步长较大，步近次数较小的情况下，走样的情况还是有点严重。因为较大的步长可能会跨过第一个连续网格的交点，打到第二个连续网格的交点。

![[dd52df44c23d9068afad302a12ee1f2e_MD5.jpg]]

## Jitter Dither

对于 Raymarching 来说，dither 带来的优化效果确实很明显。简单来说，Dither（Jitter）就是通过增加随机噪声来增加一些随机性，进而大幅度减少真正步进的次数。

应用它的方法也十分简单，首先采样一张噪声图，然后给起点加上这个值。这导致不同片元的起点扰动不同，从而大幅度减少步近次数。

![[acf3db294bc5cab9dc287428c383d291_MD5.jpg]]

```
// jitter dither map
static half dither[16] = {
    0.0, 0.5, 0.125, 0.625,
    0.75, 0.25, 0.875, 0.375,
    0.187, 0.687, 0.0625, 0.562,
    0.937, 0.437, 0.812, 0.312
};

bool BinarySearchRaymarching(float3 startView, float3 reflectDir, inout float2 hitUV) {
    ...

    UNITY_LOOP
    for (int i = 0; i < BINARY_COUNT; i++) {
        float2 ditherUV = fmod(P, 4);  
        float jitter = dither[ditherUV.x * 4 + ditherUV.y];  

        P += dp * jitter;  
        Q += dq * jitter;  
        K += dk * jitter;
        if (ScreenSpaceRayMarching(P, Q, K, dp, dq, dk, rayZ, permute, depthDistance, hitUV)) {
            ...
        }
        ...
    }
    return false;
}
```

STRIDE=30,STEPCOUNT=12,BIANRYCOUNT=6

![[e8821b07a685aeaabdde98d3cf970f75_MD5.jpg]]

STRIDE=8, STEPCOUNT=70, BIANRYCOUNT=6

![[20b1084f0ed4fc830798c4394c0ff1ff_MD5.jpg]]

可以看到，Jitter Dither 大幅提高了反射效果，但也带来了一些小格子。这些格子可以通过模糊解决。

## 高斯模糊与叠加

前面提到，Jitter Dither 会给反射结果带来一些格子的走样，这是因为起点扰动不同带来的，我们对它进行模糊即可。这里选择高斯模糊。

既然选择了模糊，结果就不能直接绘制给相机。这里采用的方式是将结果渲染到一张纹理中，然后再将这张纹理和相机源叠加。

具体执行过程如下：

```
using (new ProfilingScope(cmd, mProfilingSampler)) {
    // SSR
    Blitter.BlitCameraTexture(cmd, mSourceTexture, mSSRTexture0, mMaterial, (int)ShaderPass.Raymarching);

    // Horizontal Blur
    cmd.SetGlobalVector(mBlurRadiusID, new Vector4(mSettings.BlurRadius, 0.0f, 0.0f, 0.0f));
    Blitter.BlitCameraTexture(cmd, mSSRTexture0, mSSRTexture1, mMaterial, (int)ShaderPass.Blur);

    // Vertical Blur
    cmd.SetGlobalVector(mBlurRadiusID, new Vector4(0.0f, mSettings.BlurRadius, 0.0f, 0.0f));
    Blitter.BlitCameraTexture(cmd, mSSRTexture1, mSSRTexture0, mMaterial, (int)ShaderPass.Blur);

    // Additive Pass
    Blitter.BlitCameraTexture(cmd, mSSRTexture0, mDestinationTexture, mMaterial, mSettings.blendMode == BlendMode.Addtive ? (int)ShaderPass.Addtive : (int)ShaderPass.Balance);
}
```

高斯模糊的过程就不多说了。这里有两种叠加方式，一种是直接将结果叠加到源纹理，一种是将结果插值到源纹理。这里为了方便直接用 Blend 来叠加了，更灵活的当然是使用采样混合。但前者能够节省一个 Pass。

```
// SSR.shader
Pass {
    Name "SSR Addtive Pass"

    ZTest NotEqual
    ZWrite Off
    Cull Off
    Blend One One, One Zero

    HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment SSRFinalPassFragment
    ENDHLSL
}

Pass {
    Name "SSR Balance Pass"

    ZTest NotEqual
    ZWrite Off
    Cull Off
    Blend SrcColor OneMinusSrcColor, One Zero

    HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment SSRFinalPassFragment
    ENDHLSL
}

// SSRPass.hlsl
half4 SSRFinalPassFragment(Varyings input) : SV_Target { 
    return half4(GetSource(input.texcoord).rgb * INTENSITY, 1.0); 
}
```

![[c8a5c8aa0b582e2dd7754ec658735079_MD5.jpg]]

![[c0c4ea485e32af60cd9c6c3d104a8a49_MD5.jpg]]

关于如何指定物体的反射，最开始将反射物渲到一张 mask map 中，渲染反射贴图或叠加时对其采样，但这样的效果并没有很理想，所以就不放上来了。其他的方法暂时没有尝试。

## 参考

[games202](https://www.bilibili.com/video/BV1YK4y1T7)

[puppet_master：Unity Shader - 反射效果（CubeMap，Reflection Probe，Planar Reflection，Screen Space Reflection）](https://blog.csdn.net/puppet_master/article/details/80808486)

[Monica 的小甜甜：【论文复现】Efficient GPU Screen-Space Ray Tracing](https://zhuanlan.zhihu.com/p/386510829)

[Efficient GPU Screen-Space Ray Tracing](https://jcgt.org/published/0003/04/04/paper.pdf)

[Morgan McGuire：Screen Space Ray Tracing](https://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html)

[3D Game Shaders For Beginners：Screen Space Reflection (SSR)](https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html)