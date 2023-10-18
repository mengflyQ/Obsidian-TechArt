Unity 版本：2022

URP 版本：14.0

## HBAO

在上一篇文章中，我们用 URP 实现了 SSAO。HBAO 可以认为是 SSAO 的一种衍生，建议在这之前有 SSAO 的基础。

[TheTus：Unity URP 实现 SSAO](https://zhuanlan.zhihu.com/p/649234035)

SSAO 是在相机视角下在着色点周围撒点，再根据采样点与该采样点对应表面深度（深度缓冲区）来判断遮挡。而 HBAO 是在相机空间下，对深度缓冲区进行射线步近。

HBAO 的结果比 SSAO 柔和许多，淡出更为平缓（这里为了方便观察，把 radius 调大了）。

![[51459e5dca3a887fe640d68072cc656a_MD5.jpg]]

从官方图中更能感受到这一点。

![[1a501f9ac49e5c500fec5666db954ead_MD5.jpg]]

### 宏观讨论

如图，对于屏幕上的着色点 P，对其按照角度进行 4 次均匀划分（相当于对 3D 球面坐标按照方位角 $\theta$ 进行均分），对每条射线进行深度缓冲区上的射线步近。

![[98f1227a782d3aec42f53dea8b734a7b_MD5.jpg]]

在推导过程中，所有点和射线都以相对于相机坐标系的球面坐标表示。方位角 $\theta$ 围绕相机空间 - Z 轴旋转，**仰角 (horizon angle)** $\phi$ 则相对于 XY 平面，它是方位角为 $\theta$ 的射线与对应 1D 高度场的交点到 XY 平面的角度。每条射线都对应一个最大的仰角，我们用 $h(\theta)$ 表示。如下图 S3。

![[d3f78307cdee67ba5acb20b4aa8af002_MD5.jpg]]

根据着色点 P 和法线 N，计算出它的切面角 $t(\theta)$ 。

![[d91decb3e84cad0858431556dd8c0ca4_MD5.jpg]]

严格意义上，这个切面角应该是**面法线**和仰角生成的切面角。如果用顶点插值计算的法线，当 P 在拐弯的位置处时，计算的半球起始位置就可能会是错的。但是在下面的实现中，我们使用的还是法线贴图。

最后，我们就可以求出这条方位角为 $\theta$ 的射线的 $AO=sinh(\theta)-sint(\theta)$

![[6f01f8d31b49b1dfc60509396912436c_MD5.jpg]]

我们宏观理解一下，对于一个方位角 $\theta$ ，如果仰角与切线差值越高，说明周围物体越高，遮挡越大。

### HBAO 公式

下面我们简单讨论一下 HBAO 的公式。

首先，对于一着色点 P，它的 AO 为：

$A=\frac{1}{2\pi}\int_{\Omega}V(\vec{\omega})W(\vec{\omega})d\omega$

其中， $V$ 表示 $\omega$ 方向下的遮挡情况（V=1 遮挡，V=0 未遮挡）。 $W$ 则是一个简单的线性衰减函数。

而 HBAO 则认为 AO 与相机坐标系下的仰角与切面角差值有关，经过一系列推导，最终得到 HBAO 的公式如下（推导过程可查阅 [ShaderX7](https://www.amazon.com/ShaderX7-Rendering-Techniques-Wolfgang-Engel/dp/1584505982/ref=sr_1_1?ie=UTF8&qid=1387043804&sr=8-1&keywords=ShaderX7)，我也没推过）：

$A=\frac{1}{2\pi}\int_{\phi=-\pi}^{\pi}\int_{\phi=t(\theta)}^{h(\theta)}{w(\vec\omega)cos(\phi)d\phi d\theta}$

![[57bc2b35fababc3ccfd795dff96a0f50_MD5.jpg]]

其中， $\theta$ 为相机球面坐标系方位角， $h(\theta)$ 为该方位角的仰角， $t(\theta)$ 为该方位角的切面角。

我们对这个公式进行进一步的近似。首先

$\int_{\phi=t(\theta)}^{h(\theta)}{W(\vec\omega)cos(\phi)d\phi}\approx W(\vec{\omega_{i+1}})(sin(\theta_{i+1}-sin(\theta_{i}))$

基于这种近似，我们可以使公式更为简洁。

![[3b02816f36bb574a17d72f7481502ac3_MD5.jpg]]

把它带入公式中：

$\begin{align} A&=\frac{1}{2\pi}\int_{\theta=-\pi}^{\pi}\sum_{i=1}^{N_{s}}W(\vec{w_{i}})(s i n(\phi_{i})-s i n(\phi_{i-1})\,d\theta \\&=\frac{1}{2\pi}\int_{\theta=-\pi}^{\pi}\sum_{i=1}^{N_{s}}W(\vec{w_{i}})(\frac{N\cdot H_{i}}{|H_{i}|}-\frac{N\cdot H_{i-1}}{|H_{i-1}|})\,d\theta \end{align}$

其中， $n$ 为相机空间着色点法线， $h$ 为仰角， $W(\vec{\omega_{i}})$ 为距离衰减函数。内积分表示选择 N 条仰角递增的样本。

回到实际应用中，我们选择 K 条射线，所以最终公式为：

$A=\frac{1}{K\times N_{s}}\sum_{k=1}^{K}\sum_{i=1}^{N_{s}}W(\vec{\omega_{i}})(\frac{N\cdot H_{i}}{|H_{i}|}-\frac{N\cdot H_{i-1}}{|H_{i-1}|})\,d\theta$

### 其他细节

如果直接按照上面讨论的公式进行计算，最终结果会有许多问题。如下图，可以明显感觉到很多带状走样。

![[88dad5ae0c14e5772bb4c1da113107a1_MD5.jpg]]

**一、Low Tessellation 问题**

![[e747fe7086308a4a7eed526bb0e8dcc3_MD5.jpg]]

![[6843b86cb6de898f7ee39973459f93eb_MD5.jpg]]

对于上图中的圆拱门部分（曲面），我们能看到一些很规整的条纹，其实这就是因为在这些曲面中 Face Normal 的使用就会造成一些错误遮挡，因为曲面是一个连续的面变化，切面总会将一部分区域计算入遮挡，而 HBAO 希望这部分不要计算入遮挡，所以就加了个偏差，就能得到一个没有 AO 的很干净的曲面。

![[ef204237dee71b323db5e3f974f9e579_MD5.jpg]]

**二、不连续问题**

![[c8393566615958dcfc10a189d22925cd_MD5.jpg]]

对于相邻的两个像素 P0 和 P1，他们的 AO 值相差 0.7-0 = 0.7，相差幅度过大，会带来不连续问题，然而我们需要的是柔和的环境光遮蔽效果。

![[6d8bc6031a6f23b592d89e2603b8aeab_MD5.jpg]]

HBAO 通过一个衰减方程来解决这个问题：

$W(r)=1-r^{2}$

我们把它带入 HBAO 近似公式即可。

**三、噪声**

![[56c03f07a73fb4ced3504207e48e154e_MD5.jpg]]

由于采样射线的数量不足，所以会导致噪声的产生。对 HBAO 的结果进行模糊就可以了。

## C# 脚本

C# 脚本大同小异，用 RendererFeature 在渲染不透明物体后入队一个全屏幕 RenderPass，还负责给 Shader 传递参数。

```
using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace HBAO{
    [Serializable]
    internal class HBAOSettings{
        [SerializeField] internal float Intensity = 0.5f;
        [SerializeField] internal float Radius = 0.5f;
        [SerializeField] internal float MaxRadiusPixels = 32f;
        [SerializeField] internal float AngleBias = 0.1f;
    }


    [DisallowMultipleRendererFeature("HBAO")]
    public class HBAO : ScriptableRendererFeature{
        [SerializeField] private HBAOSettings mSettings = new HBAOSettings();

        private Shader mShader;
        private const string mShaderName = "Hidden/AO/HBAO";

        private HBAOPass mHBAOPass;
        private Material mMaterial;


        public override void Create() {
            if (mHBAOPass == null) {
                mHBAOPass = new HBAOPass();
                mHBAOPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
            }
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData) {
            if (renderingData.cameraData.postProcessEnabled) {
                if (!GetMaterials()) {
                    Debug.LogErrorFormat("{0}.AddRenderPasses(): Missing material. {1} render pass will not be added.", GetType().Name, name);
                    return;
                }

                bool shouldAdd = mHBAOPass.Setup(ref mSettings, ref mMaterial);

                if (shouldAdd)
                    renderer.EnqueuePass(mHBAOPass);
            }
        }

        protected override void Dispose(bool disposing) {
            CoreUtils.Destroy(mMaterial);

            mHBAOPass?.Dispose();
            mHBAOPass = null;
        }

        private bool GetMaterials() {
            if (mShader == null)
                mShader = Shader.Find(mShaderName);
            if (mMaterial == null && mShader != null)
                mMaterial = CoreUtils.CreateEngineMaterial(mShader);
            return mMaterial != null;
        }

        class HBAOPass : ScriptableRenderPass{
            private HBAOSettings mSettings;

            private Material mMaterial;

            private ProfilingSampler mProfilingSampler = new ProfilingSampler("HBAO");

            private RenderTextureDescriptor mHBAODescriptor;

            private RTHandle mSourceTexture;
            private RTHandle mDestinationTexture;

            private static readonly int mProjectionParams2ID = Shader.PropertyToID("_ProjectionParams2"),
                mCameraViewTopLeftCornerID = Shader.PropertyToID("_CameraViewTopLeftCorner"),
                mCameraViewXExtentID = Shader.PropertyToID("_CameraViewXExtent"),
                mCameraViewYExtentID = Shader.PropertyToID("_CameraViewYExtent"),
                mHBAOParamsID = Shader.PropertyToID("_HBAOParams"),
                mRadiusPixelID = Shader.PropertyToID("_RadiusPixel"),
                mSourceSizeID = Shader.PropertyToID("_SourceSize"),
                mHBAOBlurRadiusID = Shader.PropertyToID("_HBAOBlurRadius");

            private RTHandle mHBAOTexture0, mHBAOTexture1;

            private const string mHBAOTexture0Name = "_HBAO_OcclusionTexture0",
                mHBAOTexture1Name = "_HBAO_OcclusionTexture1";


            internal HBAOPass() {
                mSettings = new HBAOSettings();
            }

            internal bool Setup(ref HBAOSettings featureSettings, ref Material material) {
                mMaterial = material;
                mSettings = featureSettings;

                ConfigureInput(ScriptableRenderPassInput.Normal);

                return mMaterial != null;
            }

            public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
                var renderer = renderingData.cameraData.renderer;
                mHBAODescriptor = renderingData.cameraData.cameraTargetDescriptor;
                mHBAODescriptor.msaaSamples = 1;
                mHBAODescriptor.depthBufferBits = 0;

                // 设置Material属性
                // 发送参数
                Matrix4x4 proj = renderingData.cameraData.GetProjectionMatrix();

                // 计算proj逆矩阵，即从裁剪空间变换到世界空间
                Matrix4x4 projInv = proj.inverse;

                // 计算视角空间下，近平面四个角的坐标
                Vector4 topLeftCorner = projInv.MultiplyPoint(new Vector4(-1.0f, 1.0f, -1.0f, 1.0f));
                Vector4 topRightCorner = projInv.MultiplyPoint(new Vector4(1.0f, 1.0f, -1.0f, 1.0f));
                Vector4 bottomLeftCorner = projInv.MultiplyPoint(new Vector4(-1.0f, -1.0f, -1.0f, 1.0f));

                // 计算相机近平面上方向向量
                Vector4 cameraXExtent = topRightCorner - topLeftCorner;
                Vector4 cameraYExtent = bottomLeftCorner - topLeftCorner;

                // 发送ReconstructViewPos参数
                var camera = renderingData.cameraData.camera;
                var near = camera.nearClipPlane;

                mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
                mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
                mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
                mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));

                // 发送HBAO参数
                var tanHalfFovY = Mathf.Tan(camera.fieldOfView * 0.5f * Mathf.Deg2Rad);
                mMaterial.SetVector(mHBAOParamsID, new Vector4(mSettings.Intensity, mSettings.Radius * 1.5f, mSettings.MaxRadiusPixels, mSettings.AngleBias));
                mMaterial.SetFloat(mRadiusPixelID, renderingData.cameraData.camera.pixelHeight * mSettings.Radius * 1.5f / tanHalfFovY / 2.0f);

                // 分配RTHandle
                RenderingUtils.ReAllocateIfNeeded(ref mHBAOTexture0, mHBAODescriptor, name: mHBAOTexture0Name);
                RenderingUtils.ReAllocateIfNeeded(ref mHBAOTexture1, mHBAODescriptor, name: mHBAOTexture1Name);

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
                    cmd.SetGlobalVector(mSourceSizeID, new Vector4(mHBAODescriptor.width, mHBAODescriptor.height, 1.0f / mHBAODescriptor.width, 1.0f / mHBAODescriptor.height));

                    // Blit
                    CoreUtils.SetRenderTarget(cmd, mHBAOTexture0);
                    cmd.DrawProcedural(Matrix4x4.identity, mMaterial, 0, MeshTopology.Triangles, 3);

                    // Horizontal Blur
                    cmd.SetGlobalVector(mHBAOBlurRadiusID, new Vector4(1.0f, 0.0f, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mHBAOTexture0, mHBAOTexture1, mMaterial, 1);

                    // Final Pass & Vertical Blur
                    cmd.SetGlobalVector(mHBAOBlurRadiusID, new Vector4(0.0f, 1.0f, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mHBAOTexture1, mDestinationTexture, mMaterial, 2);
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
                mHBAOTexture0?.Release();
                mHBAOTexture1?.Release();
            }
        }
    }
}
```

## Shader

Shader Pass 结构如下：

```
Shader "Hidden/AO/HBAO" {
    SubShader {
        Tags {
            "RenderType"="Opaque"
            "RenderPipeline" = "UniversalPipeline"
        }
        LOD 200
        Cull Off ZWrite Off ZTest Always

        HLSLINCLUDE
 #include "HBAOPass.hlsl"
        ENDHLSL

        Pass {
            Name "HBAO Occlusion Pass"

            HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment HBAOPassFragment
            ENDHLSL
        }

        Pass {
            Name "HBAO Gaussian Blur Pass"
            HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment BlurPassFragment
            ENDHLSL
        }

        Pass {
            Name "HBAO Gaussian Final Pass"

            ZTest NotEqual
            ZWrite Off
            Cull Off
            Blend One SrcAlpha, Zero One
            BlendOp Add, Add

            HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment FinalPassFragment
            ENDHLSL
        }

        Pass {
            Name "HBAO Preview Pass"

            HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment PreviewPassFragment
            ENDHLSL
        }
    }
}
```

### 还原视角空间坐标

使用深度缓冲还原坐标可以通过在 Shader 里进行逆变换，或者 CPU 发送相机射线给 GPU 辅助计算。这里我们选择精度更高计算更少的第二种。

具体原理可以参考我之前的文章：

[TheTus：Unity URP 深度 / 法线图相关总结](https://zhuanlan.zhihu.com/p/648793922)

原文是还原世界坐标，这里还原视角空间的方法是大相径庭的。

首先，在 C# 脚本中传递相机到近平面四个点的偏移向量，它由裁剪空间逆变换到视角空间下求得。

```
public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
    // 设置Material属性
    // 发送参数
    Matrix4x4 proj = renderingData.cameraData.GetProjectionMatrix();

    // 计算proj逆矩阵，即从裁剪空间变换到世界空间
    Matrix4x4 projInv = proj.inverse;

    // 计算视角空间下，近平面四个角的坐标
    Vector4 topLeftCorner = projInv.MultiplyPoint(new Vector4(-1.0f, 1.0f, -1.0f, 1.0f));
    Vector4 topRightCorner = projInv.MultiplyPoint(new Vector4(1.0f, 1.0f, -1.0f, 1.0f));
    Vector4 bottomLeftCorner = projInv.MultiplyPoint(new Vector4(-1.0f, -1.0f, -1.0f, 1.0f));

    // 计算相机近平面上方向向量
    Vector4 cameraXExtent = topRightCorner - topLeftCorner;
    Vector4 cameraYExtent = bottomLeftCorner - topLeftCorner;

    // 发送ReconstructViewPos参数
    var camera = renderingData.cameraData.camera;
    var near = camera.nearClipPlane;

    mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
    mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
    mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
    mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));
}
```

然后再在 Shader 中，对视角空间进行还原。

```
// 根据线性深度值和屏幕UV，还原视角空间下的顶点位置
half3 ReconstructViewPos(float2 uv, float linearEyeDepth) {
    // Screen(NDC) to CS: uv.y = 1.0 - uv.y
    // CS to VS: uv = 1.0 - uv
    uv.x = 1.0 - uv.x;

    float zScale = -linearEyeDepth * _ProjectionParams2.x; // divide by near plane
    float3 viewPos = _CameraViewTopLeftCorner.xyz + _CameraViewXExtent.xyz * uv.x + _CameraViewYExtent.xyz * uv.y;
    viewPos *= zScale;

    return viewPos;
}
```

![[776ce5fd416b024edc59f9bfb8fea3cc_MD5.jpg]]

### 还原视角空间法线

由 HBAO 原理，所有推导都是在相机空间下进行的，所以我们需要将法线图的法线变换到视角空间下。

```
// 还原视角空间法线
half3 ReconstructViewNormals(float2 uv) {
    float3 normal = SampleSceneNormals(uv);
    normal = TransformWorldToViewNormal(normal, true);
    // erse z
    normal.z = -normal.z;

    return normal;
}

// out: normal * 0.5 + 0.5
```

![[6657ca25007d70228bb0f91224977968_MD5.jpg]]

### 射线步近

在射线步近前，我们需要做一些准备工作。首先获得着色点的视角空间位置和法线，然后计算步近角度和长度，最后计算一个随机数，用来对 AO 采样进行扰动。

```
#define INTENSITY _HBAOParams.x
#define RADIUS _HBAOParams.y
#define MAXRADIUSPIXEL _HBAOParams.z
#define ANGLEBIAS _HBAOParams.w

float Random(float2 p) {
    return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453123);
}

half4 HBAOPassFragment(Varyings input) : SV_Target {
    float rawDepth = SampleSceneDepth(input.texcoord);
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams);
    float3 vpos = ReconstructViewPos(input.texcoord, linearDepth);
    float3 normal = ReconstructViewNormals(input.texcoord);

    float2 noise = float2(Random(input.texcoord.yx), Random(input.texcoord.xy));

    // 计算步近值
    float stride = min(_RadiusPixel / vpos.z, MAXRADIUSPIXEL) / (STEP_COUNT + 1.0);
    // stride至少大于一个像素
    if (stride < 1) return 0.0;
    float stepRadian = TWO_PI / DIRECTION_COUNT;

    half ao = 0.0;
}
```

接下来，正式进入射线步近。首先选择一条射线，计算该射线的方向和起始长度。我们对射线的起始方向和长度进行随机值扰动，使 AO 结果更加随机。

```
half ao = 0.0;

    UNITY_UNROLL
    for (int d = 0; d < DIRECTION_COUNT; d++) {
        // 计算起始随机步近方向
        float radian = stepRadian * (d + noise.x);
        float sinr, cosr;
        sincos(radian, sinr, cosr);
        float2 direction = float2(cosr, sinr);

        // 计算起始随机步近长度
        float rayPixels = frac(noise.y) * stride + 1.0;
    }
```

然后，对这个方向进行射线步近。首先计算步近后的 uv，然后还原视角坐标和法线，最后累加 AO 值。

```
#define DIRECTION_COUNT 8
    #define STEP_COUNT 6

    UNITY_UNROLL
    for (int d = 0; d < DIRECTION_COUNT; d++) {
        // 计算起始随机步近方向
        float radian = stepRadian * (d + noise.x);
        float sinr, cosr;
        sincos(radian, sinr, cosr);
        float2 direction = float2(cosr, sinr);

        // 计算起始随机步近长度
        float rayPixels = frac(noise.y) * stride + 1.0;

        float topOcclusion = ANGLEBIAS; // 上一次（最大的）AO，初始值为angle bias
        // 进行光线步近
        UNITY_UNROLL
        for (int s = 0; s < STEP_COUNT; s++) {
            float2 uv2 = round(rayPixels * direction) * _SourceSize.zw + input.texcoord;
            float3 rawDepth2 = SampleSceneDepth(uv2);
            float3 linearDepth2 = LinearEyeDepth(rawDepth2, _ZBufferParams);
            float3 vpos2 = ReconstructViewPos(uv2, linearDepth2);
            ao += ComputeAO(vpos, vpos2, normal, topOcclusion);
            rayPixels += stride;
        }
    }
```

### 计算 AO

计算 AO 的公式在最开始已经讨论，这里我们挪下来。

$A=\frac{1}{K\times N_{s}}\sum_{k=1}^{K}\sum_{i=1}^{N_{s}}W(\vec{\omega_{i}})(\frac{N\cdot H_{i}}{|H_{i}|}-\frac{N\cdot H_{i-1}}{|H_{i-1}|})\,d\theta$

其中， $n$ 为相机空间着色点法线， $h$ 为仰角， $W(\vec{\omega_{i}})$ 为距离衰减函数。外积分表示选择 K 条射线。内积分表示选择 N 条仰角递增的样本。

```
// 计算距离衰减W
float FallOff(float dist) {
    return 1 - dist * dist / (RADIUS * RADIUS);
}

// https://www.derschmale.com/2013/12/20/an-alternative-implementation-for-hbao-2/
inline float ComputeAO(float3 vpos, float3 stepVpos, float3 normal, inout float topOcclusion) {
    float3 h = stepVpos - vpos;
    float dist = length(h);
    float occlusion = dot(normal, h) / dist;
    float diff = max(occlusion - topOcclusion, 0);
    topOcclusion = max(occlusion, topOcclusion);
    return diff * saturate(FallOff(dist));
}
```

最终，我们将累计 AO 除以样本数量，再提高对比度输出即可。

```
#define DIRECTION_COUNT 8
#define STEP_COUNT 6

#define INTENSITY _HBAOParams.x
#define RADIUS _HBAOParams.y
#define MAXRADIUSPIXEL _HBAOParams.z
#define ANGLEBIAS _HBAOParams.w

half4 HBAOPassFragment(Varyings input) : SV_Target {
    float rawDepth = SampleSceneDepth(input.texcoord);
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams);
    float3 vpos = ReconstructViewPos(input.texcoord, linearDepth);
    float3 normal = ReconstructViewNormals(input.texcoord);

    float2 noise = float2(Random(input.texcoord.yx), Random(input.texcoord.xy));

    // 计算步近值
    float stride = min(_RadiusPixel / vpos.z, MAXRADIUSPIXEL) / (STEP_COUNT + 1.0);
    // stride至少大于一个像素
    if (stride < 1) return 0.0;
    float stepRadian = TWO_PI / DIRECTION_COUNT;

    half ao = 0.0;

    UNITY_UNROLL
    for (int d = 0; d < DIRECTION_COUNT; d++) {
        // 计算起始随机步近方向
        float radian = stepRadian * (d + noise.x);
        float sinr, cosr;
        sincos(radian, sinr, cosr);
        float2 direction = float2(cosr, sinr);

        // 计算起始随机步近长度
        float rayPixels = frac(noise.y) * stride + 1.0;

        float topOcclusion = ANGLEBIAS; // 上一次（最大的）AO，初始值为angle bias
        // 进行光线步近
        UNITY_UNROLL
        for (int s = 0; s < STEP_COUNT; s++) {
            float2 uv2 = round(rayPixels * direction) * _SourceSize.zw + input.texcoord;
            float3 rawDepth2 = SampleSceneDepth(uv2);
            float3 linearDepth2 = LinearEyeDepth(rawDepth2, _ZBufferParams);
            float3 vpos2 = ReconstructViewPos(uv2, linearDepth2);
            ao += ComputeAO(vpos, vpos2, normal, topOcclusion);
            rayPixels += stride;
        }
    }

    // 提高对比度
    ao = PositivePow(ao * rcp(STEP_COUNT * DIRECTION_COUNT) * INTENSITY, 0.6);

    return half4(ao, ao, ao, ao);
}
```

![[1a3f03eeb1016da3d4e3d5214bc0a36d_MD5.jpg]]

此时结果还是有不少噪声，但比 SSAO 来的好得多，我们在此基础上做 Blur 即可。

### Blur

按照 PPT 的说法，模糊应该基于深度模糊。我最开始写了个深度双边滤波，但效果并不明显，后面就改为高斯模糊了。这高斯模糊的写法也是参考 URP 官方 SSAO 的写法，可以搜索`ScreenSpaceAmbientOcclusion.shader`查看。

```
// https://software.intel.com/content/www/us/en/develop/blogs/an-investigation-of-fast-real-time-gpu-based-image-blur-algorithms.html
half GaussianBlur(half2 uv, half2 pixelOffset) {
    half colOut = 0;

    // Kernel width 7 x 7
    const int stepCount = 2;

    const half gWeights[stepCount] = {
        0.44908,
        0.05092
    };
    const half gOffsets[stepCount] = {
        0.53805,
        2.06278
    };

    UNITY_UNROLL
    for (int i = 0; i < stepCount; i++) {
        half2 texCoordOffset = gOffsets[i] * pixelOffset;
        half4 p1 = GetSource(uv + texCoordOffset);
        half4 p2 = GetSource(uv - texCoordOffset);
        half col = p1.r + p2.r;
        colOut += gWeights[i] * col;
    }

    return colOut;
}

half4 BlurPassFragment(Varyings input) : SV_Target {
    float2 delta = _HBAOBlurRadius.xy * _SourceSize.zw;

    return GaussianBlur(input.texcoord, delta);
}
```

![[7ab7a38bdcd0d31ef7a743c6cafc1eaf_MD5.jpg]]

### 应用

同 SSAO，我们直接把 HBAO 的结果在渲染不透明物体后混合上去即可。

```
Pass {
    Name "HBAO Gaussian Final Pass"

    ZTest NotEqual
    ZWrite Off
    Cull Off
    Blend One SrcAlpha, Zero One
    BlendOp Add, Add

    HLSLPROGRAM
 #pragma vertex Vert
 #pragma fragment FinalPassFragment
    ENDHLSL
}

half4 FinalPassFragment(Varyings input) : SV_Target {
    float2 delta = _HBAOBlurRadius.xy * _SourceSize.zw;
    half ao = 1.0 - GaussianBlur(input.texcoord, delta);
    return half4(0.0, 0.0, 0.0, ao);
}
```

![[6b7adce0c23e70b54d6dd5a9d92d838c_MD5.jpg]]

## 参考

[HBAO_SIG08.pptx](https://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf)

[An alternative implementation for HBAO](https://www.derschmale.com/2013/12/20/an-alternative-implementation-for-hbao-2/)

[HBAO(屏幕空间的环境光遮蔽)](https://zhuanlan.zhihu.com/p/103683536)

[URP HBAO 源码分析](https://zhuanlan.zhihu.com/p/348467142)