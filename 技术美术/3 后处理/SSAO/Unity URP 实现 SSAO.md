Unity 版本：2022

URP 版本：14.0

## AO

**环境光遮蔽 (Ambient Occlusion)**，它的原理是通过将褶皱、孔洞和非常靠近的墙面变暗的方法近似模拟出间接光照。这些区域很大程度上是被周围的几何体遮蔽的，光线会很难流失，所以这些地方看起来会更暗一些。

![[6d6a15ce0d0846fd47e3d9f2f1b358ae_MD5.jpg]]

下面从偏理论的角度描述 AO，这部分内容可以太长不看。

AO 对光照信息做出如下假设：

*   shading point 上来自任何方向的间接光照都是一个常数
*   考虑 visibility
*   假设物体始终 diffuse

可以看出，这种假设和 Blinn-Phong 光照模型中的环境光的假设相似，但 Blinn-Phong 没有考虑 Visibility 项，如图是它们的对比。

![[b0677ed497118f0ecb510cbf2d080779_MD5.jpg]]

换句话说，AO 就是在环境光一样的情况下考虑遮挡关系。

![[71fae7bf122845192cd36396d7c014ad_MD5.jpg]]

以上是对 AO 的 high level 理解，下面从数学角度分析。

首先引出立体角，立体角是定义在单位球上的一个面积微元， $d\omega=sind\theta d\phi$ 。在此基础上，将这个面积微元向 $XOY$ 平面投影，就会得到一个单位圆上的面积微元，即投影立体角， $dx_{\bot}=cos\theta d\omega$ 。

![[1312e166fbf041d776c541a0fa5fb80f_MD5.jpg]]

然后来看渲染方程。

$L_{o}=\int_{\Omega^{+}}L_{i}(p,\omega_{i})f_{r}(p,\omega_{i},\omega_{o})V(p,\omega_{i})cos\theta_{i}d\omega_{i}$

运用经典近似式 $\int_{\Omega}f(x)g(x)dx\approx \frac{\int_{\Omega_{G}f(x)dx}}{\int_{\Omega_{G}}dx}\cdot\int_{\Omega}g(x)dx$ ，并将 $cos\theta d\omega$ 当作投影立体角（即整体当成投影面积微元）。

$L_{o}(p,\omega_{o})\approx \frac{\int_{\Omega^{+}}V(p,\omega_{i})cos\theta_{i}d\omega_{i}}{\int_{\Omega^{+}}cos\theta_{i}d\omega_{i}}\cdot \int_{\Omega^{+}}L_{i}(p,\omega_{i})f_{r}(p,\omega_{i},\omega_{o})cos\theta_{i}d\omega_{i}$

观察左边部分的分母 $\int_{\Omega^{+}}cos\theta_{i}d\omega_{i}$ ，它相当于对单位半球投影的单位圆进行积分，即单位圆面积 $\pi$ 。所以左边可以化简为 $k_{A}=\frac{\int_{\Omega^{+}}V(p,\omega_{i})cos\theta_{i}d\omega_{i}}{\pi}$ 。

在观察左边化简后的式子，它可以理解为是让可见性的 cos 值在单位半球面投影的单位元内进行平均加权。这个积分的结果我们称为 $k_{A}$ 。

再观察右边部分，由于假设所有方向的间接光是一个常数，并且假设物体是 diffuse 的，所以 brdf 也是常数。因此右边部分整个积分也是一个常数。

$\int_{\Omega^{+}}L_{i}(p,\omega_{i})f_{r}(p,\omega_{i},\omega_{o})cos\theta_{i}d\omega_{i}=L_{indir}\cdot\frac{\rho}{\pi}\cdot \pi = L_{indir}\cdot \rho$

于是，就可以理解为：shading point 的 visibility 的加权平均 x 自定义颜色。

或者说有一种更简单的理解方法，间接光是常数 $L_{i}$ ，diffuse brdf 是常数 $\frac{\rho}{\pi}$ ，因此这两项可以直接从积分中拿出来，最后渲染方程就变成了算 visibility 的积分。

$\begin{align} L_{o}(p,\omega_{o})&=\int_{\Omega^{+}}L_{i}(p,\omega_{i})f_{r}(p,\omega_{i},\omega_{o})V(p,\omega_{i})cos\theta_{i}d\omega_{i}\\ &=\frac{\rho}{\pi}\cdot L_{i}(p)\cdot \int_{\Omega^{+}}V(p,\omega_{i})cos\theta_{i}d\omega_{i} \end{align}$

但是，由上面的数学分析可以知道分母中的 $\pi$ 其实是 $k_{A}$ 中也就是用来对 VIsibility 进行归一化的。当然也可以将式子变形，把 $\pi$ 移到积分里面。

通过上面的式子，可以直观的了解到 AO 背后的实现原理，就是环境的简介光照来自远处未被遮挡的光线。

然而，这个” 远处 “并不能是无限大，因为在某些封闭的场景下（例如室内），无限大会使 AO 处处为 1（即没有间接光照）。但也不能太小，太小会导致可见信息丢失。因此我们为了得到准确的 AO，一般都会选取一个合适的判定半径，在一个半球范围内完成操作，这是一个不可避免的 trade off。

![[0be698bb3641faea3998e4a7458ee666_MD5.jpg]]

## 光线投射法

这里介绍一种最基本的思路，投射光线法。

如图，我们可以从着色点 p 向四周投射光线 (ray casting)，并检测这些光线与网格相交的情况。

![[17bfa02e29ecd52405d58835ab0f3e2e_MD5.jpg]]

如果投射了 N 条光线，其中 h 条与网格相交，则 p 所对应的遮蔽率与 visibility 为：

$\begin{align} occlusion=\frac{h}{N}\in[0,1]\\ visibility=1-\frac{h}{N}\in[0,1] \end{align}$

事实上，只有当光线与网格交点 q 到点 p 之间的距离小于某个阈值 d 时，才会将此光线记作收到遮挡。因为若交点 q 与 p 之间的距离过远就说明在某个方向上照射到点 p 的光不会受到物体的遮挡。

## SSAO

从另一个角度思考投射光线。**相机视角**下，在着色点 p 附近生成 N 个采样点 p'，计算射线 pp'与环境表面的交点 q。如果 q 的深度小于 p'的深度，则认为 p'被遮挡。这有点类似 shdowmap 的想法。

![[17bfa02e29ecd52405d58835ab0f3e2e_MD5.jpg]]

SSAO 就是利用屏幕空间的信息来解决上述问题：

*   从相机出发，得到屏幕空间深度信息，即 zbuffer
*   对**相机视角**下屏幕表面一着色点，以它为中心，R 为半径的球体范围内随机寻找数个采样点，判断其可见性
*   若该采样点深度大于相机视角下表面深度，则认为该点不可见，记可见性为 0。如下图红点。
*   若该采样点深度小于相机视角下表面深度，则认为该点可见，记可见性为 1。如下图绿点。
*   统计可见性为 1 采样点的占比，记作当前着色点的 visibility

![[7eaa8361212a7e88b2fd624635ac7bff_MD5.jpg]]

然而，当采样核心是一个球体时，它导致平整的墙面也会显得灰蒙蒙的，因为核心中一半的样本都会在墙这个几何体上。下面这幅图展示了孤岛危机的 SSAO，它清晰地展示了这种灰蒙蒙的感觉：

![[5c2ae872380ac61ea2faee846e36c80e_MD5.jpg]]

由于这个原因，我们将不会使用球体的采样核心，而使用一个沿着表面法向量的半球体采样核心。这要求我们生成法线图，或者从深度图从重建法线。

![[7997fb5f1b559c83d8a71ed03de24665_MD5.jpg]]

总结一下，我们需要两张图，一张深度图，它用来判断采样点是否被表面遮蔽，并且还会用来重建相机视角坐标系进而产生随机采样点。一张法线图，用来生成法向半球随机点。

关于 URP 下如何使用深度 / 法线图，如何重建世界坐标系，可以参考我之前的文章。

[TheTus：Unity URP 深度 / 法线图相关总结](https://zhuanlan.zhihu.com/p/648793922)

但是这样做也会有问题，由于没有记录法线信息，而是单纯比较深度。对于下图指向的红点，实际上是可见的，但 SSAO 从相机出发，判定为不可见。因此 SSAO 只考虑红点个数大于一半即 visbility 小于 50% 的情况。

![[f74ceaab16b2d7197f514dea7787411b_MD5.jpg]]

另外，SSAO 在采样中也存在问题。

选择 Sample 的数量与 PCSS 一样，越多越好，但也会越慢。一种解决方案是可以减少 Sample 数量，得到一个 noisy 的结果，然后对这张 noisy 的图进行降噪。这些降噪的模糊和噪声在和场景中其他效果与光照叠加后就会变得不明显。

尽管有这些问题，但在实时渲染中都认为是可以接受的。

下面介绍一下如何在 URP 中实现 SSAO。代码基本上就是照搬 URP 官方的 SSAO，大家可以搜`ScreenSpaceAmbientOcclusion.cs/shader`来定位它。

## C# 脚本

C# 脚本的写法大同小异，就是用 RendererFeature 在渲染不透明物体后注入一个 RenderPass 绘制全屏后处理。

```
using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace SSAO{
    [Serializable]
    internal class SSAOSettings{
        [SerializeField] internal float Intensity = 0.5f;
        [SerializeField] internal float Radius = 0.25f;
        [SerializeField] internal float Falloff = 100f;
    }

    [DisallowMultipleRendererFeature("SSAO")]
    public class SSAO : ScriptableRendererFeature{
        [SerializeField] private SSAOSettings mSettings = new SSAOSettings();

        private const string mShaderName = "Hidden/AO/SSAO";
        private Shader mShader;

        private SSAOPass mSSAOPass;
        private Material mMaterial;

        public override void Create() {
            if (mSSAOPass == null) {
                mSSAOPass = new SSAOPass();
                mSSAOPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
            }
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData) {
            // 当前渲染的相机支持后处理
            if (renderingData.cameraData.postProcessEnabled) {
                if (!GetMaterials()) {
                    Debug.LogErrorFormat("{0}.AddRenderPasses(): Missing material. {1} render pass will not be added.", GetType().Name, name);
                    return;
                }

                bool shouldAdd = mSSAOPass.Setup(ref mSettings, ref renderer, ref mMaterial);

                if (shouldAdd)
                    renderer.EnqueuePass(mSSAOPass);
            }
        }

        protected override void Dispose(bool disposing) {
            CoreUtils.Destroy(mMaterial);

            mSSAOPass?.Dispose();
            mSSAOPass = null;
        }

        private bool GetMaterials() {
            if (mShader == null)
                mShader = Shader.Find(mShaderName);
            if (mMaterial == null && mShader != null)
                mMaterial = CoreUtils.CreateEngineMaterial(mShader);
            return mMaterial != null;
        }

        class SSAOPass : ScriptableRenderPass{
            private SSAOSettings mSettings;

            private Material mMaterial;
            private ScriptableRenderer mRenderer;

            private ProfilingSampler mProfilingSampler = new ProfilingSampler("SSAO");
            private RenderTextureDescriptor mSSAODescriptor;

            private RTHandle mSourceTexture;
            private RTHandle mDestinationTexture;

            private static readonly int mProjectionParams2ID = Shader.PropertyToID("_ProjectionParams2"),
                mCameraViewTopLeftCornerID = Shader.PropertyToID("_CameraViewTopLeftCorner"),
                mCameraViewXExtentID = Shader.PropertyToID("_CameraViewXExtent"),
                mCameraViewYExtentID = Shader.PropertyToID("_CameraViewYExtent"),
                mSSAOParamsID = Shader.PropertyToID("_SSAOParams"),
                mSSAOBlurRadiusID = Shader.PropertyToID("_SSAOBlurRadius");

            private RTHandle mSSAOTexture0, mSSAOTexture1;

            private const string mSSAOTexture0Name = "_SSAO_OcclusionTexture0",
                mSSAOTexture1Name = "_SSAO_OcclusionTexture1";

            internal SSAOPass() {
                mSettings = new SSAOSettings();
            }

            internal bool Setup(ref SSAOSettings featureSettings, ref ScriptableRenderer renderer, ref Material material) {
                mMaterial = material;
                mRenderer = renderer;
                mSettings = featureSettings;

                ConfigureInput(ScriptableRenderPassInput.Normal);

                return mMaterial != null;
            }

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

                // 发送ReconstructViewPos参数
                mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
                mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
                mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
                mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));

                // 发送SSAO参数
                mMaterial.SetVector(mSSAOParamsID, new Vector4(mSettings.Intensity, mSettings.Radius * 1.5f, mSettings.Falloff));

                mSSAODescriptor = renderingData.cameraData.cameraTargetDescriptor;
                mSSAODescriptor.msaaSamples = 1;
                mSSAODescriptor.depthBufferBits = 0;
                // mSSAODescriptor.colorFormat = RenderTextureFormat.ARGB32;

                // 分配纹理
                RenderingUtils.ReAllocateIfNeeded(ref mSSAOTexture0, mSSAODescriptor, name: mSSAOTexture0Name);
                RenderingUtils.ReAllocateIfNeeded(ref mSSAOTexture1, mSSAODescriptor, name: mSSAOTexture1Name);

                // 配置目标和清除
                ConfigureTarget(mRenderer.cameraColorTargetHandle);
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
                    cmd.SetGlobalVector("_SourceSize", new Vector4(mSSAODescriptor.width, mSSAODescriptor.height, 1.0f / mSSAODescriptor.width, 1.0f / mSSAODescriptor.height));

                    // SSAO
                    CoreUtils.SetRenderTarget(cmd, mSSAOTexture0);
                    cmd.DrawProcedural(Matrix4x4.identity, mMaterial, 0, MeshTopology.Triangles, 3);

                    // Horizontal Blur
                    cmd.SetGlobalVector(mSSAOBlurRadiusID, new Vector4(1.0f, 0.0f, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mSSAOTexture0, mSSAOTexture1, mMaterial, 1);

                    // Vertical Blur
                    cmd.SetGlobalVector(mSSAOBlurRadiusID, new Vector4(0.0f, 1.0f, 0.0f, 0.0f));
                    Blitter.BlitCameraTexture(cmd, mSSAOTexture1, mSSAOTexture0, mMaterial, 1);

                    // Final Pass
                    Blitter.BlitCameraTexture(cmd, mSSAOTexture0, mDestinationTexture, mMaterial, 2);
                }

                context.ExecuteCommandBuffer(cmd);
                CommandBufferPool.Release(cmd);
            }


            public override void OnCameraCleanup(CommandBuffer cmd) {
                mSourceTexture = null;
                mDestinationTexture = null;
            }

            public void Dispose() {
                mSSAOTexture0?.Release();
                mSSAOTexture1?.Release();
            }
        }
    }
}
```

## Shader

### 重建相机视角

我们需要生成相机视角下着色点 **p** 周围的随机采样点 **q**，并判断其与表面交点 **r** 的深度关系。所以首先需要通过深度图重建相机视角得到着色点 **p** 的坐标。相机视角指的是相对于相机的坐标系，它可以在视图空间下，也可以在世界空间下。这里我们选择世界空间。

![[bf7c19ddcf8ff0171ceaa41cab18e64a_MD5.jpg]]

重建方法在我之前的文章里有详细说明，这里不再赘述。

[TheTus：Unity URP 深度 / 法线图相关总结](https://zhuanlan.zhihu.com/p/648793922)

首先在 RendererFeature 的`OnCameraSetup`函数中给材质发送数据。

```
public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
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

    mMaterial.SetVector(mCameraViewTopLeftCornerID, topLeftCorner);
    mMaterial.SetVector(mCameraViewXExtentID, cameraXExtent);
    mMaterial.SetVector(mCameraViewYExtentID, cameraYExtent);
    mMaterial.SetVector(mProjectionParams2ID, new Vector4(1.0f / near, renderingData.cameraData.worldSpaceCameraPos.x, renderingData.cameraData.worldSpaceCameraPos.y, renderingData.cameraData.worldSpaceCameraPos.z));
}
```

在 Shader 中还原世界空间下相机偏移向量。

```
// 根据线性深度值和屏幕UV，还原世界空间下，相机到顶点的位置偏移向量
half3 ReconstructViewPos(float2 uv, float linearEyeDepth) {
    // Screen is y-inverted
    uv.y = 1.0 - uv.y;

    float zScale = linearEyeDepth * _ProjectionParams2.x; // divide by near plane
    float3 viewPos = _CameraViewTopLeftCorner.xyz + _CameraViewXExtent.xyz * uv.x + _CameraViewYExtent.xyz * uv.y;
    viewPos *= zScale;

    return viewPos;
}

half4 SSAOPassFragment(Varyings input) : SV_Target {
    // 采样深度
    float rawDepth = SampleSceneDepth(input.uv);
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams);
    // 采样法线
    float3 normal = SampleSceneNormals(input.uv);
    // 还原世界空间相机到顶点偏移向量
    float3 vpos = ReconstructViewPos(input.uv, linearDepth);

    ...
}
```

![[8bdadb327f704638007e9e46b73c6e1d_MD5.jpg]]

### 采样点生成

采样点的生成通过原点加上随机偏移向量完成。第一步是在全球生成一个随机偏移向量，第二步将逆半球向量翻转到法向半球。

```
float Random(float2 p) {
    return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

// 获取半球上随机一点
half3 PickSamplePoint(float2 uv, int sampleIndex, half rcpSampleCount, half3 normal) {
    // 一坨随机数
    half gn = InterleavedGradientNoise(uv * _ScreenParams.xy, sampleIndex);
    half u = frac(Random(half2(0.0, sampleIndex)) + gn) * 2.0 - 1.0;
    half theta = Random(half2(1.0, sampleIndex) + gn) * TWO_PI;
    half u2 = sqrt(1.0 - u * u);

    // 全球上随机一点
    half3 v = half3(u2 * cos(theta), u2 * sin(theta), u);
    v *= sqrt(sampleIndex * rcpSampleCount); // 随着采样次数越向外采样

    // 半球上随机一点 逆半球法线翻转
    // https://thebookofshaders.com/glossary/?search=faceforward
    v = faceforward(v, -normal, v); // 确保v跟normal一个方向

    // 缩放到[0, RADIUS]
    v *= RADIUS;

    return v;
}

half4 SSAOPassFragment(Varyings input) : SV_Target {
    // 采样深度
    float rawDepth = SampleSceneDepth(input.uv);
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams);
    // 采样法线 法线图里的值未pack
    float3 normal = SampleSceneNormals(input.uv);
    // 还原世界空间相机到顶点偏移向量
    float3 vpos = ReconstructViewPos(input.uv, linearDepth);

    const half rcpSampleCount = rcp(SAMPLE_COUNT);

    half ao = 0.0;

    UNITY_UNROLL
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        // 取正半球上随机一点
        half3 offset = PickSamplePoint(input.uv, i, rcpSampleCount, normal);
        half3 vpos2 = vpos + offset;

        ...
    }


    return ao;
}
```

### 判断遮蔽

接下来，我们需要判断采样点与采样点表面的距离，进而判断遮蔽情况。

![[bf7c19ddcf8ff0171ceaa41cab18e64a_MD5.jpg]]

如图，我们需要知道采样点 **q** 的视角深度，以及相机视角下 **q** 在屏幕表面下的深度。

采样点的视角深度即裁剪空间下 w 分量的值。屏幕表面下的深度通过屏幕 UV 采样获得，而屏幕 UV 也可以通过裁剪空间坐标计算得到。计算的推导也可以参考我之前的文章：

[https://zhuanlan.zhihu.com/p/648793922](https://zhuanlan.zhihu.com/p/648793922)

所以说，我们需要将采样点 **q** 从世界空间变换到裁剪空间，进而求得两个深度。

```
UNITY_UNROLL
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        // 取正半球上随机一点
        half3 offset = PickSamplePoint(input.uv, i, rcpSampleCount, normal);
        half3 vpos2 = vpos + offset;

        // 把采样点从世界坐标变换到裁剪空间
        half4 spos2 = mul(UNITY_MATRIX_VP, vpos2);
        // 计算采样点的屏幕uv
        half2 uv2 = half2(spos2.x, spos2.y * _ProjectionParams.x) / spos2.w * 0.5 + 0.5;

        // 计算采样点的depth
        float rawDepth2 = SampleSceneDepth(uv2);
        float linearDepth2 = LinearEyeDepth(rawDepth2, _ZBufferParams);

        // 判断采样点是否被遮蔽
        half IsInsideRadius = abs(spos2.w - linearDepth2) < RADIUS ? 1.0 : 0.0;

        ...
    }
```

### 计算 AO

下面，我们需要计算采样点 **q** 对着色点 **r** 的贡献，而非单一的 0/1。

*   观察空间中点 **p** 与点 **r** 的深度距离为 **|p-r|** 。随着此距离的增长，遮蔽值将按比例线性缩小。这是因为随着遮蔽点与目标点距离越远，其遮蔽效果也就越弱。如果该距离超过某个指定的最大距离，那么点 r 将完全不会遮挡点 **p**。而且，如果此距离过小，我们就认为点 **p** 与点 **q** 位于同一平面上 (共面)，因此点 q 在这种情况下也不会遮挡点 **p**。
*   向量 **n** 与 **r-p** 之间夹角的测定方法为 $max(n\cdot(\frac{r-p}{||r-p||}),0)$ 。这是为了防止自相交情况的发生。

![[bf1d85eae50fd2111d48ec617192f2ee_MD5.jpg]]

```
// 光线与着色点夹角越大，贡献越小
        half3 difference = ReconstructViewPos(uv2, linearDepth2) - vpos; // 光线向量
        half inten = max(dot(difference, normal) - 0.004 * linearDepth, 0.0) * rcp(dot(difference, difference) + 0.0001);
        ao += inten * IsInsideRadius;
```

完整代码如下：

```
half4 SSAOPassFragment(Varyings input) : SV_Target {
    // 采样深度
    float rawDepth = SampleSceneDepth(input.uv);
    float linearDepth = LinearEyeDepth(rawDepth, _ZBufferParams);
    // 采样法线
    float3 normal = SampleSceneNormals(input.uv);
    // 还原世界空间相机到顶点偏移向量
    float3 vpos = ReconstructViewPos(input.uv, linearDepth);

    const half rcpSampleCount = rcp(SAMPLE_COUNT);

    half ao = 0.0;

    UNITY_UNROLL
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        // 取正半球上随机一点
        half3 offset = PickSamplePoint(input.uv, i, rcpSampleCount, normal);
        half3 vpos2 = vpos + offset;

        // 把采样点从世界坐标变换到裁剪空间
        half4 spos2 = mul(UNITY_MATRIX_VP, vpos2);
        // 计算采样点的屏幕uv
        half2 uv2 = half2(spos2.x, spos2.y * _ProjectionParams.x) / spos2.w * 0.5 + 0.5;

        // 计算采样点的depth
        float rawDepth2 = SampleSceneDepth(uv2);
        float linearDepth2 = LinearEyeDepth(rawDepth2, _ZBufferParams);

        // 判断采样点是否被遮蔽
        half IsInsideRadius = abs(spos2.w - linearDepth2) < RADIUS ? 1.0 : 0.0;

        // 光线与着色点夹角越大，贡献越小
        half3 difference = ReconstructViewPos(uv2, linearDepth2) - vpos; // 光线向量
        half inten = max(dot(difference, normal) - 0.004 * linearDepth, 0.0) * rcp(dot(difference, difference) + 0.0001);
        ao += inten * IsInsideRadius;
    }

    ao *= RADIUS;

    // 提高AO对比度，使SSAO的效果更为显著
    ao = PositivePow(saturate(ao * INTENSITY * rcpSampleCount), 0.6);

    return ao;
}
```

效果如下，此时的噪点还是很大的，我们需要对其进行模糊处理。

![[b90de81d2c8b59383aa400342c504f30_MD5.jpg]]

### 模糊

模糊采用基于法线的双边滤波 (Bilateral)，具体思路可以参考这篇文章： [https://blog.csdn.net/puppet_master/article/details/83066572?spm=1001.2014.3001.5502](https://blog.csdn.net/puppet_master/article/details/83066572?spm=1001.2014.3001.5502)

代码如下，这里面的参数都是来自 URP SSAO 里面魔法参数。

```
half CompareNormal(half3 d1, half3 d2) {
    return smoothstep(0.8, 1.0, dot(d1, d2));
}

half4 BlurPassFragment(Varyings input) : SV_Target {
    float2 delta = _SSAOBlurRadius * GetSourceTexelSize().xy;
    // 进行一堆魔法参数偏移的采样
    half3 n0 = SampleSceneNormals(input.uv);
    half3 n1a = SampleSceneNormals(input.uv - delta * 1.3846153846);
    half3 n1b = SampleSceneNormals(input.uv + delta * 1.3846153846);
    half3 n2a = SampleSceneNormals(input.uv - delta * 3.2307692308);
    half3 n2b = SampleSceneNormals(input.uv + delta * 3.2307692308);

    // 计算每个点的权重
    half w0 = half(0.2270270270);
    half w1a = CompareNormal(n0, n1a) * half(0.3162162162);
    half w1b = CompareNormal(n0, n1b) * half(0.3162162162);
    half w2a = CompareNormal(n0, n2a) * half(0.0702702703);
    half w2b = CompareNormal(n0, n2b) * half(0.0702702703);

    // 进行Blur
    half3 color = 0.0;
    color += GetSource(input.uv) * w0;
    color += GetSource(input.uv - delta * 1.3846153846) * w1a;
    color += GetSource(input.uv + delta * 1.3846153846) * w1b;
    color += GetSource(input.uv - delta * 3.2307692308) * w2a;
    color += GetSource(input.uv + delta * 3.2307692308) * w2b;
    color *= rcp(w0 + w1a + w1b + w2a + w2b);

    return half4(color, 1.0);
}
```

进行一次水平 Blur 和垂直 Blur 即可。

![[92f8d1a3758d4a6766e63e214601f3c5_MD5.jpg]]

我们把它优化一下，输出 AO 时把结果打包一下，AO 放 r 通道，法线放 gba 通道，这样模糊时只需要进行一次采样即可。

具体代码可以看 URP 下 SSAO 的代码。

### 应用

应用方法有两种，一种是输出到 AO 图中，物体渲染时采样 AO 图即可。第二种是在渲染不透明物体后，进行一次 Blend，把 AO Blend 上去。这里方便一点用第二种。

在 URP 中，经过垂直和水平 blur 的 SSAO 还需要进行一次对角线 Blur，进一步缩小噪点。这里我们在应用前进行计算即可。

```
Pass {
    Name "HBAO Final Pass"

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

// 对角线Blur
half BlurSmall(const float2 uv, const float2 delta) {
    half4 p0 = GetSource(uv);
    half4 p1 = GetSource(uv + float2(-delta.x, -delta.y));
    half4 p2 = GetSource(uv + float2(delta.x, -delta.y));
    half4 p3 = GetSource(uv + float2(-delta.x, delta.y));
    half4 p4 = GetSource(uv + float2(delta.x, delta.y));

    half3 n0 = GetPackedNormal(p0);

    half w0 = 1.0;
    half w1 = CompareNormal(n0, GetPackedNormal(p1));
    half w2 = CompareNormal(n0, GetPackedNormal(p2));
    half w3 = CompareNormal(n0, GetPackedNormal(p3));
    half w4 = CompareNormal(n0, GetPackedNormal(p4));

    half s = 0.0;
    s += GetPackedAO(p0) * w0;
    s += GetPackedAO(p1) * w1;
    s += GetPackedAO(p2) * w2;
    s += GetPackedAO(p3) * w3;
    s += GetPackedAO(p4) * w4;

    return s *= rcp(w0 + w1 + w2 + w3 + w4);
}

half4 FinalPassFragment(Varyings input) : SV_Target {
    float2 delta = _SourceSize.zw;
    half ao = 1.0 - BlurSmall(input.texcoord, delta);
    return half4(0.0, 0.0, 0.0, ao);
}
```

![[70b00016717b8a5423b85a88c91af199_MD5.jpg]]

## 参考

[games202](https://www.bilibili.com/video/BV1YK4y1T7yY?p=7)

[learnOpengl](https://learnopengl-cn.github.io/05%20Advanced%20Lighting/09%20SSAO/)

《DirectX 12 3D 游戏开发实战》