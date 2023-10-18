[Command Buffers In Unity - 腾讯云开发者社区-腾讯云 (tencent.com)](https://cloud.tencent.com/developer/news/102132)
[unity的CommandBuffer - 灰信网（软件开发博客聚合） (freesion.com)](https://www.freesion.com/article/7053897071/)

# URP 渲染概念

![[Pasted image 20230702213954.png]]
**Render Pass**：Frame Debug 中看到的每一个过程都有可能提交多个 DrawCall, 这个过程称作 Render Pass。注意这个 Render pass 和 unity shader 中的 pass 有区别. 一个 Render Pass 中可能包含了 unity shader 中多种不同 lightmode 的 pass。
**Render Pass 的作用就是将输入的顶点信息渲染到一个 Render Target 上。 
Render Pass 可以将 GPU 可识别的指令 CommandBuffer 提交到 GPU 中来添加渲染指令并在不同的渲染阶段执行。**

**渲染目标 Render Target**：[[DX12理论 #5 渲染到纹理技术]]是现代图形处理单元 (GPU)的一个特性，它允许 3D 场景被渲染到一个中间内存缓冲区，或渲染目标纹理 (Render-Target-Texture、RTT)，而不是帧缓冲区或后台缓冲区。可以通过像素着色器操纵此 RTT，以便在显示最终图像之前将其他效果应用于最终图像。
Render Target 可以设置为系统内置的纹理 (比如深度、相机纹理)，也可以是临时申请的纹理,，所有的绘制都是不可逆转的，故每一帧绘制前都会清理掉前一帧的绘制结果.

**多目标渲染 MRT**：多目标渲染（MRT: Multiple Render Target)容许应用程序一次渲染到多个缓冲区。利用 MRT 技术，片段着色器可以输出多个颜色，可以用于保存 RGBA 颜色、法线、深度信息或者纹理坐标，每个颜色连接一个颜色缓冲区。在延迟渲染或者前向渲染中, 对应的 Gbuffer 与 Dbuffer 作为 RenderTarget 同时有多个输出。![[Pasted image 20230702213259.png|450]]

**RenderPipeline**：URP 中 `RenderPipelineAsset` 文件会根据用户在其面板上定义的各种信息创建 `RenderPipeline`。而 `RenderPipeline` 则决定了所有 `RenderPass` 的数据来源, 渲染目标, 以及 `RenderPass` 之间的顺序，即所有的渲染流程会在 `RenderPipeline.render()` 下运行。`render()` 的最后会执行 `RenderContex.Submit()`, 将需要传输到 GPU 的数据、设置、以及在 GPU 中需要执行的指令 CommandBuffer 提交给 GPU.

**Renderer**：因为不同的对象的绘制使用到了不同的 RenderPass 进行绘制, 为了更方便的切换不同的管线。URP 在 RenderPipeline 与 RenderPass 之间抽象出了一层 Renderer，**用于管理 RenderPass 集合。**
![[Pasted image 20230702213440.png]]

**Renderer Data**：即 UR Data, 可以对 Render Pipeline 的功能进行一定控制
![[Pasted image 20230702213623.png|450]]

**Render Feature**：是一种 Asset，用于向 URP 渲染器添加额外的 Render pass 并配置其行为。在 Renderer 中定义了基本的 RenderPass 渲染流程，但是这个流程是固定, 如果我们想在不透明物体前增加一个绘制物体法线外扩描边的 RenderPass，或者是想将某一个时刻的渲染结果给保留到一张 RenderTexture 上供后续渲染使用，就需要增加 RenderPass。
自定义的 RenderPass 是通过 RenderFeature 进行设置与添加到渲染队列的，主要的作用是在面板中可视化, 以便用户设置与调整所添加的 RenderPass 的信息。


**Command Buffer**： 是用来存储渲染命令的缓冲区。保存着渲染命令列表，如 `SetRendertarget`, `Drawmesh` 等等，可以设置为在摄像机渲染期间的不同点执行. 
这么说可能会比较生硬, 举几个应用吧.
- 绘制网格: 通过指令在当前缓冲区绘制 mesh. 
- 添加一个 pass: 比如希望自定义的 pass 能够在指定阶段渲染到相机或指定贴图, 如在不透明渲染前进行法线外扩描边, 渲染毛发 shader 等需要多 pass 效果;
- 申请渲染 DBuffer 这种可以存储多张贴图供后续渲染使用的 RenderTexture (比如贴花) 
- 后处理: 需要获取当前渲染的结果并将其通过后处理 shader 渲染到一张临时材质上, 再将临时材质返回到原管线, 或者直接作为结果
# URP 渲染流程
![[Pasted image 20230702204334.png]]

![[Pasted image 20230702204838.png]]

# commandbuffer

![[Pasted image 20230702220808.png]]
处于跨平台的需要，Unity 对这些底层 API 做了一层封装，产生了 CommandBuffer
![[Pasted image 20230702220915.png]]

而为了更好扩展 unity 的渲染管线，unity 提供了 CommandBuffer, 让你根据自己的需求，在**不同的渲染阶段**插入绘制指令，例如插入 `DrawRenderer` , `DrawMesh`, `DrawProcedure`。
绘制的时候也可以根据需要设置绘制时材质的 `MaterialPropertyBlock` 更改当前绘制的材质的属性。
PS: MaterialPropertyBlock 比直接修改 Material 的优势是: 不会创建出新的材质实例。

这里我用了 RenderFeature 在 BeforeRenderingOpaques 的时候用 DrawMesh 指令渲染了一个 Box：
![[Pasted image 20230702221224.png]]

# 从自定义 RenderPipeline 分析 ScriptableRenderContext 与 CommandBuffer
## 创建渲染管线资产：RenderPipelineAsset
在 Project 文件夹下如何创建 Asset 文件的步骤：
1. 新建脚本 `CustomRenderPineAsset.cs`，继承 `RenderPipelineAsset` 
2. 添加特性标签，表示创建 Asset 选项在 Create 菜单中的位置
3.  重载 `CreatePipeline` 方法，该方法返回一个 `RenderPipeline` 的实例。
```cs file:CustomRenderPineAsset.cs
using UnityEngine;
using UnityEngine.Rendering;
/// <summary>
/// 自定义渲染管线资产类，用于创建自定义渲染管线
/// </summary>
//在Project下右键->Create菜单中添加一个新的子菜单,用来创建管线资产
[CreateAssetMenu(menuName = "Rendering/Create Custom Render Pipeline")]
public class CustomRenderPineAsset : RenderPipelineAsset
{
    //定义合批状态字段
    [SerializeField] private bool useDynamicBatching = true;
    [SerializeField] private bool useGPUInstancing = true;
    [SerializeField] private bool userSRPBatcher = true;
    
    //阴影设置
    [SerializeField] private ShadowSettings shadows = default;
    
    //重写抽象方法，需要返回一个RenderPipeline实例对象
    protected override RenderPipeline CreatePipeline()
    {
        return new CustomRenderPipeline(useDynamicBatching, useGPUInstancing, userSRPBatcher,shadows);
    }
}
```

## 创建渲染管线实例：RenderPipeline
首先先写一个继承自 `RenderPipeline` 的自定义管线类 `CustomRenderPipeline`，**类中有一个 `CameraRenderer`, 主要负责的是渲染的主要逻辑**。

**Unity 每一帧都会调用 `CustomRenderPipeline` 实例的 `Render()` 方法进行画面渲染**，<mark style="background: #FF5582A6;">该方法是 SRP 的入口</mark>，进行渲染时底层接口会调用它并传递两个参数对象：
1. **`ScriptableRenderContex` 定义自定义渲染管线使用的状态和绘制命令**。定义自定义 `RenderPipeline` 时，可使用 `ScriptableRenderContext` 向 GPU 调度和提交状态更新和绘制命令。（[[DX12理论#资源与描述符]]）
2.  **`Camera[]` 是相机对象的数组，存储了参与这一帧渲染的所有相机对象。**
3. 我们在 `CustomRenderPipeline` 脚本中创建一个 `CameraRenderer` 实例。在 `Render()` 中遍历所有相机进行单独渲染，这样设计可以让每个相机使用不同的渲染方式绘制画面

> [!NOTE] Title
> [ScriptableRenderContext](https://docs.unity3d.com/cn/2022.3/ScriptReference/Rendering.ScriptableRenderContext.html) 是 SRP 用于渲染的最底层接口之一，还有一个接口叫做 `CommandBuffer`。我们通过这两个接口封装的各种方法来实现基本的渲染绘制

```cs file:CustomRenderPipeline.cs
using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// 自定义渲染管线类
/// </summary>
public class CustomRenderPipeline : RenderPipeline
{
    private CameraRenderer render = new CameraRenderer();
    private bool useDynamicBatching, useGPUInstancing;
    private ShadowSettings shadowSettings;
    
    public CustomRenderPipeline(bool useDynamicBatching, bool useGPUInstancing,bool useSRPBatcher,ShadowSettings shadowSettings)
    {
        //设置合批启用状态
        this.useDynamicBatching = useDynamicBatching;
        this.useGPUInstancing = useGPUInstancing;
        
        //阴影设置
        this.shadowSettings = shadowSettings;
        
        //启用 SRP Batcher
        GraphicsSettings.useScriptableRenderPipelineBatching = useSRPBatcher;
        
        //true:visibleLight.finalColor = 光强度乘以线性空间颜色值
        //false:光强度乘以gamma空间颜色值
        GraphicsSettings.lightsUseLinearIntensity = true;
    }
    
    /// <summary>
    /// SRP的入口函数，每帧都会调用
    /// </summary>
    /// <param name="context">SRP 用于渲染的底层接口，使用封装的各种方法实现基本的渲染绘制</param>
    /// <param name="cameras">相机对象的数组，存储了参与这一帧渲染的所有相机对象</param>
    protected override void Render(ScriptableRenderContext context, Camera[] cameras)
    {
        //遍历所有相机进行单独渲染,这样设计可以让每个相机使用不同的渲染方式绘制画面
        foreach (Camera camera in cameras)
        {
            render.Render(context, camera,useDynamicBatching, useGPUInstancing, shadowSettings);
        }
    }
}
```

## 渲染逻辑：CameraRenderer 类

最后，就是负责渲染主要逻辑的 `Renderer` 类, 直译过来就是渲染器，渲染器的 `Render` 方法的参数可以随便设置，因为它目前并没有继承自什么类，所以在上一层的 `CustomRenderPipeline` 中，可以根据自己实际需要来处理。
可以看到在 `Render` 函数里主要的工作就是使用 `CommandBuffer` 把渲染过程相关指令写入到 `ScriptableRenderContext`，最后`ScriptableRenderContext` 使用 `Submit` 提交指令。
**为了方便组织渲染的流程和复用, 可以把其中渲染的一段流程抽离出来成为一个 Pass**。例如: 代码中的中的 `DrawVisibleGeometry` (并不完善)。

```cs file:CameraRenderer
using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// 相机渲染类，进行单个相机的单独渲染
/// </summary>
public partial class CameraRenderer
{
    Camera camera;

    //SRP 用于渲染的底层接口，使用封装的各种方法实现基本的渲染绘制
    ScriptableRenderContext context;

    //用于在 Frame Debugger 中识别CommandBuffer的名称
    const string bufferName = "Render Camera";

    //渲染接口CommandBuffer,用于存储渲染命令
    CommandBuffer buffer = new CommandBuffer { name = bufferName };

    //存储相机剔除后的所有视野内可见物体的数据信息
    CullingResults cullingResults;

    //着色器标记 ID 用于引用着色器中的各种名称。
    
    //获取 Pass 中名字为 SRPDefaultUnlit 的着色器标签ID(对应Tags里的属性)
    static ShaderTagId unlitShaderTagId = new ShaderTagId("SRPDefaultUnlit");
    //获取 Pass 中名字为 CustomLit 的着色器标签
    static ShaderTagId litShaderTagId = new ShaderTagId("CustomLit");
    
    //绘制SRP不支持的着色器类型
    partial void DrawUnsupportedShaders();

    //绘制Gizmos
    partial void DrawGizmos();

    //在Game视图绘制的几何体也绘制到Scene视图中
    partial void PrepareForSceneWindow();

    //设置命令缓冲区的名字
    partial void PrepareBuffer();

    //设置灯光
    Lighting lighting = new Lighting();
/*******************************************************************************/

    /// <summary>
    /// 绘制在相机视野内的所有物体
    /// </summary>
    public void Render(ScriptableRenderContext context, Camera camera,bool useDynamicBatching, bool useGPUInstancing,ShadowSettings shadowSettings)
    {
        this.context = context;
        this.camera = camera;

        PrepareBuffer();

        //此操作可能会给 Scene 场景中添加一些几何体，所以我们在 Render() 方法中进行几何体剔除之前调用这个方法。
        PrepareForSceneWindow();

        //剔除
        if (!Cull(shadowSettings.maxDistance))
        {
            return;
        }
        
        buffer.BeginSample(SampleName); 
        ExecuteBuffer();
        //光源数据发送到GPU计算光照 + 渲染阴影
        lighting.Setup(context, cullingResults, shadowSettings);
        buffer.EndSample(SampleName);
        
        //渲染场景开始前的设置
        Setup(); //设置结束后进行buffer.BeginSample(SampleName)
        
        //RenderPass:绘制可见几何体
        DrawVisibleGeometry(useDynamicBatching, useGPUInstancing);

        //RenderPass:绘制SRP不支持的着色器类型
        DrawUnsupportedShaders();

        //RenderPass:绘制Gizmos
        DrawGizmos();
        
        //释放ShadowMap RT内存
        lighting.Cleanup();
        
        //提交缓冲区渲染命令
        Submit(); //提交前进行buffer.EndSample(SampleName)
    }

/*******************************************************************************/

    /// <summary>
    /// 剔除相机视野外的物体
    /// </summary>
    /// <returns></returns>
    bool Cull(float maxShadowDistance)
    {
        if (camera.TryGetCullingParameters(out ScriptableCullingParameters p)) //得到需要进行剔除检查的所有物体
        {
            //得到最大阴影距离，和相机远截面做比较，取最小的那个作为阴影距离
            p.shadowDistance = Mathf.Min(maxShadowDistance, camera.farClipPlane);
            
            cullingResults = context.Cull(ref p); //存储剔除后的结果数据
            return true;
        }

        return false;
    }

/*******************************************************************************/

    /// <summary>
    /// 绘制可见几何体
    /// 绘制顺序：不透明物体->绘制天空盒->透明物体
    /// </summary>
    void DrawVisibleGeometry(bool useDynamicBatching,bool useGPUInstancing)
    {
        //1.绘制不透明物体
        //设置绘制顺序和指定渲染相机：确定相机的透明排序模式是否使用正交或基于距离的排序
        var sortingSettings = new SortingSettings(camera)
        {
            criteria = SortingCriteria.CommonOpaque //不透明对象的典型排序模式
        };

        //设置渲染的Shader Pass和排序模式：设置是哪个 Shader 的哪个 Pass 进行渲染
        var drawingSettings = new DrawingSettings(unlitShaderTagId, sortingSettings)
        {
            enableDynamicBatching = useDynamicBatching,
            enableInstancing = useGPUInstancing,
            perObjectData = PerObjectData.Lightmaps | PerObjectData.ShadowMask | PerObjectData.LightProbe | PerObjectData.OcclusionProbe | PerObjectData.LightProbeProxyVolume | PerObjectData.OcclusionProbeProxyVolume
            
        };
        
        //渲染CustomLit表示的pass块
        drawingSettings.SetShaderPassName(1, litShaderTagId);

        //过滤设置：设置哪些类型的渲染队列可以被绘制
        var fileteringSettings = new FilteringSettings(RenderQueueRange.opaque); //只绘制RenderQueue为opaque的不透明物体

        //图像绘制
        context.DrawRenderers(cullingResults, ref drawingSettings, ref fileteringSettings);

        //2.绘制天空盒
        context.DrawSkybox(camera);

        //3.绘制透明物体
        sortingSettings.criteria = SortingCriteria.CommonTransparent; //透明对象的典型排序模式
        drawingSettings.sortingSettings = sortingSettings;
        fileteringSettings.renderQueueRange = RenderQueueRange.transparent; //只绘制RenderQueue为transparent的透明的物体
        context.DrawRenderers(cullingResults, ref drawingSettings, ref fileteringSettings);
    }


/*******************************************************************************/

    /// <summary>
    /// 渲染场景开始前的设置
    /// 设置相机的属性和矩阵
    /// </summary>
    void Setup()
    {
        //设置相机特定的全局ShaderProperties
        context.SetupCameraProperties(camera); 

        //得到相机的清除标志Clear Flags 
        //这是一个枚举值，从小到大分别是 Skybox，Color(Solid Color)，Depth 和 Nothing
        CameraClearFlags flags = camera.clearFlags;

        //清除渲染目标，为了保证下一帧绘制的图像正确
        buffer.ClearRenderTarget(
            flags <= CameraClearFlags.Depth, //当相机的Clear Flags 设置为前三个枚举时，都会清除深度缓冲区
            flags == CameraClearFlags.SolidColor, //当相机的Clear Flags 设置为 Solid Color 时才清除颜色缓冲
            flags == CameraClearFlags.Color ? camera.backgroundColor.linear : Color.clear //清除缓冲区的颜色值，如果我们设置的 Clear Flags 是 Color，那么需要使用相机的 Background 属性的颜色值，由于我们使用的是线性色彩空间，颜色值进行一下转换，其它的 Clear Flags 还默认使用 Color.clear（黑色）即可
        );
        
        buffer.BeginSample(SampleName);
        ExecuteBuffer();
    }

/*******************************************************************************/

    /// <summary>
    /// 提交缓冲区渲染命令
    /// </summary>
    void Submit()
    {
        //结束采样，放在渲染过程的结束
        buffer.EndSample(SampleName); 
        ExecuteBuffer();
        
        //通过 context 发送的渲染命令都是缓冲的，最后需要通过调用 Submit() 方法来正式提交渲染命令
        context.Submit();
    }

/*******************************************************************************/

    /// <summary>
    /// 执行缓冲区命令
    /// </summary>
    void ExecuteBuffer()
    {
        context.ExecuteCommandBuffer(buffer);
        buffer.Clear(); //通常执行命令和清除缓冲区是一起执行的，这样才能重用缓冲区
    }

/*******************************************************************************/
}
```

## 渲染状态的更新：RenderStateBlock
![[Pasted image 20230702225910.png]]

![[1 ShaderLab#^d4529f]]

对于渲染状态的更新，体现最明显的是在 `Context.DrawRenderers` 这个指令，可以看到 DrawObjectPass  在构造函数中它的 `RenderStateBlock ` 是 ` Nothing `。
所以它对于 Opaque pass 也好，Transparent pass 也好，它渲染状态的更新是跟每个 Shader 中各自的 Depth、ZWrite、Blend 等等的状态设置有关。
而下面的 StencilState 则是与在 ForwardRenderer 中的 Forward Renderer Data 的具体设置有关。

```cs file:context.DrawRenderer
public void DrawRenderers (Rendering.CullingResults cullingResults, ref Rendering.DrawingSettings drawingSettings, ref Rendering.FilteringSettings filteringSettings, ref Rendering.RenderStateBlock stateBlock);

//调用：
context.DrawRenderers(cullingResults, ref drawingSettings, ref fileteringSettings, stateBlock);
```
`context.DrawRenderers` 指令是最常见用于绘制一批物体，参数如下：
1. `CullingResults` ：存储相机剔除后的结果（所有视野内可见物体的数据信息）
2. `DrawingSettings` 设置绘制顺序以及绘制时使用哪一个 Shader 中的 Pass。
3. `FilteringSettings` 设置过滤设置来渲染指定的 Layer,
4. `RenderStateBlock`： 重载覆盖 GPU 渲染状态，更改 StateBlock 来重载深度、模板写入方式。 

PS: 需要注意的是: `DrawObjectPass` 需要跟 `RenderObjectPass` 做下区分，这两还不太一样。具体体现在: `RenderObjectPass` 多了 `SetDetphState` 和 `SetStencilState` 这两个函数，能够更方便重载当前 pass 在 DrawRenderers 时的 Render state。

![[Pasted image 20230702232446.png]]

