### 简单理解

Renderer > RendererFeature > Pass

Renderer 核心方法：Setup()、Execute()

RendererFeature 核心方法：Create()、AddRenderPasses()

Pass 核心方法：Configure()、Execute()

### 框架脉络

```
Render()
	BeginFrameRendering()
		SortCameras()
		BeginCameraRendering() x n
			RenderSingleCamera()
				renderer.Clear()
				renderer.SetupCullingParameters()
				context.ExecuteCommandBuffer(cmd)
				cmd.Clear()
				context.Cull()
				InitializeRenderingData()
				renderer.Setup()
					pass.Setup() x m
					EnqueuePass(pass) x m
				renderer.Execute()
					SetupLights()
						m_ForwardLights.Setup()
						m_DeferredLights.SetupLights()
					ExecuteBlock() x 4
						ExecuteRenderPass()
							pass.Configure() or ConfigureNative()
							pass.Execute() or ExecuteNative()
				context.ExecuteCommandBuffer(cmd)
				CommandBufferPool.Release(cmd)
				context.Submit()
		EndCameraRendering() x n
	EndFrameRendering()
```

核心文件：一个入口（UniversalRenderPipeline.cs），三大基类（ScriptableRenderer.cs、ScriptableRendererFeature.cs、ScriptableRenderPass.cs）

unity 启用 URP 步骤：  
Windows》PackageManager》搜 Universal RP  
Project 面板》右键 create》rendering》URP Asset（with URP Renderer）  
Edit》ProjectSettings》Graphics》scriptable render pipeline settings 选 URPAsset

文件路径：Packages\com.unity.render-pipelines.universal@12.1.11\Runtime\UniversalRenderPipeline.cs

vscode 按文件名搜索文件：ctrl + p

### 1、UniversalRenderPipeline.cs 主入口 1400 行代码

Render()：流程如下

```
BeginFrameRendering()
	设置shader参数 
	SortCameras()
	遍历Cameras
		if gameCam then 
			RenderCameraStack()
				读取UniversalAdditionalCameraData数据
				BeginCameraRendering()
					UpdateVolumeFramework()
					RenderSingleCamera()
				EndCameraRendering()
		else
			BeginCameraRendering()
				UpdateVolumeFramework()
				RenderSingleCamera()
			EndCameraRendering()
EndFrameRendering()
```

RenderSingleCamera()：流程如下

```
// 清空 + 裁切
renderer.Clear()
renderer.SetupCullingParameters()
context.ExecuteCommandBuffer(cmd)
cmd.Clear()
context.Cull()
// 初始化 + Setup Execute + 提交
InitializeRenderingData()
renderer.Setup()
renderer.Execute()
context.ExecuteCommandBuffer(cmd)
CommandBufferPool.Release(cmd)
context.Submit()
```

### 2、ScriptableRenderer.cs 基类 1500 行代码

Execute()：流程如下，Execute() 还将 pass 根据其 RenderPassEvent 的值排序

```
SetupLights()：
	m_ForwardLights.Setup()：都是些初始化设置工作，核心代码还得看shader
	m_DeferredLights.SetupLights()：
ExecuteBlock() x 4：在渲染前、渲染不透明、渲染透明、渲染后共四个阶段都有执行
	ExecuteRenderPass()
		pass.Configure() or ConfigureNative()
		pass.Execute() or ExecuteNative()
```

AddRenderPasses()：禁用所有 NativeRenderPass，遍历 rendererFeatures 并调用他们的 AddRenderPasses()

### 2、UniversalRenderer.cs 1200 行代码

构造函数：各种各样的 pass 都要来到此处朝拜，pass 通过自身的构造函数 new 一个实例；要通过 this.renderingMode 区分开仅适用于前向渲染的 pass 和仅适用于延迟渲染的 pass

Setup()：有着数不清的同级 if 语句，都是各种 pass 来此处登记执行 pass.Setup() 和 EnqueuePass(pass)

Execute()：直接调用基类的 Execute()

SetupLights()：ctrl + f 看看

SetupCullingParameters()：ctrl + f 看看

### 2、ForwardRenderer 弃用旧类

构造函数：声明了各个内置 material，初始化 fowarender 中的各个 pass（按顺序）：shdowmap pass、opaque pass、skybox pass、transparent pass、post process pass。

Setup()：如果是深度相机，那么默认会执行 3 个老三样 pass：不透明物体、天空球、半透明物体，然后直接 return；若不是，观察代码得知固定会入队的三个 pass：不透明 pass、透明 pass、回调 pass

Execute()：直接调用基类的 Execute()

（提供一个方便记忆的映射彩蛋：ScriptableRenderer 基类是金庸笔下的大理皇族段氏，ScriptableRenderer::Execute() 是一阳指，UniversalRenderer 类是目前在位的段正明，ForwardRenderer 类是段延庆）

### 3、ScriptableRendererFeature.cs 基类 80 行代码

抽象方法：Create()、AddRenderPasses()；

子类的 AddRenderPasses() 方法一般会调用 pass.Setup() 和 renderer.EnqueuePass()

### 3、RenderObjects.cs

Create()、AddRenderPasses()

### 3、DecalRendererFeature.cs 贴花

Create()、AddRenderPasses()

### 3、ScreenSpaceAmbientOcclusion.cs 屏幕空间 AO

Create()、AddRenderPasses()

### 3、ScreenSpaceShadows.cs 屏幕空间阴影

Create()、AddRenderPasses()

### 3、可自定义扩展更多 RendererFeature

### 4、ScriptableRenderPass.cs 基类 500 行代码

enum RenderPassEvent：决定 pass 的排序，比如 AfterRenderingOpaques = 300、BeforeRenderingTransparents = 450

抽象方法 Configure()、Execute()

ConfigureInput()、ConfigureTarget()、ConfigureClear()：用于配置各种参数

OnCameraSetup()、OnCameraCleanup()、OnFinishCameraStackRendering()：虚函数

### 4、MainLightShadowCasterPass.cs

Configure()、Execute()

处理 tag "LightMode" = "ShadowCaster" 的 shader pass

主光源下渲染物体 Shadowmap，更新阴影贴图_MainLightShadowmapTexture

### 4、AdditionalLightsShadowCasterPass.cs

Configure()、Execute()

处理 tag "LightMode" = "ShadowCaster" 的 shader pass

多光源下渲染物体 Shadowmap，更新阴影贴图_AdditionalLightsShadowmapTexture

### 4、DepthOnlyPass.cs

Configure()、Execute()

处理 tag "LightMode" = "DepthOnly" 的 shader pass

更新深度缓冲_CameraDepthTexture

### 4、GBufferPass.cs

Configure()、Execute()

处理 tag "LightMode" = "UniversalGBuffer" 的 shader pass

首先渲染相机中除实时光之外的所有可见物体及其法线等信息，再对特定的材质写入模板值，最后对每个实时光源做 Lit() 和 SimpleLit() 共两次计算，即可实现延迟渲染

### 4、可自定义扩展更多 RenderPass

### **杂项文件**

**ForwardLights**.cs：前向渲染  
Setup()：都是些初始化设置工作，核心代码还得看 shader

**DeferredLights**.cs：延迟渲染  
GbufferAttachments：MRT 输出的 Gbuffer 信息  
SetupLights()、Setup()、ExecuteDeferredPass()

[metadata] **ScriptableRenderContext**.cs：闭源  
ExecuteCommandBuffer()：执行 GPU 命令  
Submit()：提交 GPU 命令  
DrawRenderers()：绘制

**NativeRenderPass**.cs：属于 ScriptableRenderer 的 partial class  
ConfigureNativeRenderPass()：遍历 m_ActiveRenderPassQueue 中的 pass，再调用 pass.Configure() ExecuteNativeRenderPass()：略

**RenderTargetBufferSystem**.cs：交换链  
SwapBuffer m_A, m_B：交换链一个 frontBuffer，一个 backBuffer，互相转换

**UniversalRenderPipelineAsset**.cs：对应 URPAsset 本体的面板

### 简单写个 URP 后处理

ChangeRedGreen 后处理开启步骤：去 UniversalRenderPipelineAsset_Renderer 的 Inspector 面板登记一下 ChangeRedGreenRendererFeature，然后绑定 ChangeRedGreen shader

ChangeRedGreen.cs：设置 Volume 参数

```
using System;

namespace UnityEngine.Rendering.Universal
{
    [Serializable, VolumeComponentMenu("Post-processing/ChangeRedGreen")]
    public class ChangeRedGreen : VolumeComponent, IPostProcessComponent
    {
        public ClampedFloatParameter red = new ClampedFloatParameter(0f, 0, 3);
        public ClampedFloatParameter green = new ClampedFloatParameter(0f, 0, 3);
        public bool IsActive()
        {
            return active;
        }
        public bool IsTileCompatible()
        {
            return false;
        }
    }
}
```

ChangeRedGreenRendererFeature.cs：继承 ScriptableRendererFeature，实现 Create()、AddRenderPasses()，其中 AddRenderPasses() 必不可少地会调用 pass.Setup() 和 renderer.EnqueuePass()

```
namespace UnityEngine.Rendering.Universal
{
    public class ChangeRedGreenRendererFeature : ScriptableRendererFeature
    {
        public Shader shader;
        ChangeRedGreenPass postPass;
        Material mat;
        public override void Create()
        {
            postPass = new ChangeRedGreenPass();
            postPass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques; //CameraEvent.AfterForwardOpaque
        }


        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData data)
        {
            if (shader == null)
                return;

            if (mat==null)
                mat = CoreUtils.CreateEngineMaterial(shader);

            var cameraColorTarget = renderer.cameraColorTarget;     

            postPass.Setup(cameraColorTarget, mat);

            renderer.EnqueuePass(postPass);
        }
    }
}
```

ChangeRedGreenPass.cs：继承 ScriptableRenderPass，实现 Setup()、Execute()，其中 Execute() 需要程序员自行管理对 RT 的操作命令并提交

```
namespace UnityEngine.Rendering.Universal
{
    public class ChangeRedGreenPass : ScriptableRenderPass
    {
        const string CommandBufferTag = "ChangeRedGreen cb";
        Material mat;
        ChangeRedGreen m_ChangeRedGreen;
        RenderTargetIdentifier targetId;
        RenderTargetHandle targetHandle;

        public ChangeRedGreenPass()
        {          
            targetHandle.Init("ChangeRedGreen_temp");
        }
        public void Setup(RenderTargetIdentifier target, Material material)
        {
            this.targetId = target;
            mat = material;
        }     
        public override void Execute(ScriptableRenderContext context, ref RenderingData data)
        {
            var stack = VolumeManager.instance.stack;
            m_ChangeRedGreen = stack.GetComponent<ChangeRedGreen>();
            var cb = CommandBufferPool.Get(CommandBufferTag);

            if (m_ChangeRedGreen.IsActive() && !data.cameraData.isSceneViewCamera)
            {
                mat.SetFloat("_red", m_ChangeRedGreen.red.value);
                mat.SetFloat("_green", m_ChangeRedGreen.green.value);

                RenderTextureDescriptor rtDesc = data.cameraData.cameraTargetDescriptor;
                rtDesc.depthBufferBits = 0;
                cb.GetTemporaryRT(targetHandle.id, rtDesc);

                cb.Blit(targetId, targetHandle.Identifier(), mat);

                cb.Blit(targetHandle.Identifier(), targetId);

                context.ExecuteCommandBuffer(cb);
            }
            cb.ReleaseTemporaryRT(targetHandle.id);
            CommandBufferPool.Release(cb);
        }
    }
}
```

ChangeRedGreen.shader

```
Shader "Hidden/ChangeRedGreen"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {    
        Pass
        {
            CGPROGRAM
 #pragma vertex vert
 #pragma fragment frag
            sampler2D _MainTex;
            float _red;
            float _green;
            struct appdata{
                float4 posOS: POSITION;
                float2 uv : TEXCOORD0;
            };
            struct v2f{
                float4 posCS: SV_POSITION;
                half2 uv: TEXCOORD0;
            };
            v2f vert(appdata v){
                v2f o; 
                o.posCS = UnityObjectToClipPos(v.posOS.xyz); 
                o.uv = v.uv;
                return o;
            }
            half4 frag(v2f i) : SV_Target{
                half4 col = tex2D(_MainTex, i.uv);
                col.r += _red*0.1;
                col.g += _green*0.1;
                return col;
            }
            ENDCG            
        }
    }
}
```