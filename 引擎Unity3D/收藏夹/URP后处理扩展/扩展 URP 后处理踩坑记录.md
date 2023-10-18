# 扩展 URP 后处理踩坑记录
![[85478d36ce4bca2c5e03985f2b1ac14a_MD5.webp]]

扩展 URP 后处理踩坑记录

# 更新 (2023.2.16)

已初步适配至 Unity 2021 URP 12.1.x 版本，仓库地址：[pamisu-kit-unity](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2FPamisuMyon%2Fpamisu-kit-unity)，测试场景为`Assets/Examples/CustomPostProcessing/Scenes/` 中的`CustomPP3D` 与 `CustomPP2D`。  
依然是本篇文章中的实现思路，只是稍微修改了后处理效果渲染的相关 RT。  

![[909a47e2cc07f1cae3ba439f359a5dd5_MD5.webp]]

自定义后处理效果 - 3D

![[5de4ae534abf329c343d7467badebcc5_MD5.webp]]

自定义后处理效果 - 2D

由于时间有限，没有修改得很完善，也没有充分测试，只测试了打包 PC 端的情况，并且大部分后处理组件的插入点都在`RenderPassEvent.AfterRenderingPostProcessing`。如果有不正确的地方欢迎指出。

# 原文

在目前 (10.2.2) 版本，URP 下的自定义后处理依然是通过 Renderer Feature 来实现，比起以前的 PPSV2 麻烦了不少，看着隔壁 HDRP 的提供的自定义后处理组件，孩子都快馋哭了。既然官方暂时没有提供，那么就自己先造一个解馋，对标 HDRP 的自定义后处理，目标效果是只需简单继承，就能添加自定义后处理组件。实现过程中遇到了不少问题，但对 URP 的源码有了初步的了解。

![[91e479f861f40e716adf3c82c2e14630_MD5.webp]]

效果

![[886dc4876b0396686ee65339b39c9729_MD5.webp]]

自定义 Volume 组件

实 (cai) 现(keng)过程：

*   封装自定义后处理组件基类，负责提供渲染方法、插入点设置等，并显示组件到 Volume 的 Add Override 菜单中。
*   实现后处理 Renderer Feature，获取所有自定义组件，根据它们的插入点分配到不同的 Render Pass。
*   实现后处理 Render Pass，管理并调用自定义组件的渲染方法。
*   适配 2D 场景下的自定义后处理。

类关系：

![[537752183b4aaf59958f14cbbfd21142_MD5.webp]]

# 后处理组件基类

首先要确保自定义的后处理组件能显示在 Volume 的 Add Override 菜单中，阅读源码可知，让组件出现在这个菜单中并没有什么神奇之处，只需继承`VolumeComponent`类并且添加`VolumeComponentMenu`特性即可，而 VolumeComponent 本质上是一个 ScriptableObject。

![[fd20946a48c79b33dc37e3aad1fb7712_MD5.webp]]

Volueme 的 Add Override 菜单

![[8c832175338977b2f89c72d45f0ee740_MD5.webp]]

Bloom.cs

那么就可以定义一个`CustomVolumeComponent`作为我们所有自定义后处理组件的基类：

**CustomVolumeComponent.cs**

```
public abstract class CustomVolumeComponent : VolumeComponent, IPostProcessComponent, IDisposable
{
    ...
}
```

通常希望后处理在渲染过程中能有不同的插入点，这里先提供三个插入点，天空渲染之后、内置后处理之前、内置后处理之后：

```
/// 后处理插入位置
public enum CustomPostProcessInjectionPoint
{
    AfterOpaqueAndSky, BeforePostProcess, AfterPostProcess
}
```

在同一个插入点可能会存在多个后处理组件，所以还需要一个排序编号来确定谁先谁后：

```
public abstract class CustomVolumeComponent : VolumeComponent, IPostProcessComponent, IDisposable
{
    /// 在InjectionPoint中的渲染顺序
    public virtual int OrderInPass => 0;

    /// 插入位置
    public virtual CustomPostProcessInjectionPoint InjectionPoint => CustomPostProcessInjectionPoint.AfterPostProcess;
}
```

然后定义一个初始化方法与渲染方法，渲染方法中，将 CommandBuffer、RenderingData、渲染源与目标都传入：

```
/// 初始化，将在RenderPass加入队列时调用
public abstract void Setup();

/// 执行渲染
public abstract void Render(CommandBuffer cmd, refRenderingData renderingData, RenderTargetIdentifiersource, RenderTargetIdentifier destination);

#region IPostProcessComponent
/// 返回当前组件是否处于激活状态
public abstract bool IsActive();

public virtual bool IsTileCompatible() => false;
#endregion
```

最后是`IDisposable`接口的方法，由于渲染可能需要临时生成材质，在这里将它们释放：

```
#region IDisposable
public void Dispose()
{
    Dispose(true);
    GC.SuppressFinalize(this);
}

/// 释放资源
public virtual void Dispose(bool disposing) {}
#endregion
```

后处理组件基类就完成了，随便写个类继承一下它，Volume 菜单中已经可以看到组件了：

**TestVolumeComponent.cs**

```
[VolumeComponentMenu("Custom Post-processing/Test Test Test!")]
public class TestVolumeComponent : CustomVolumeComponent
{

    public ClampedFloatParameter foo = new ClampedFloatParameter(.5f, 0, 1f);

    public override bool IsActive()
    {
    }

    public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RenderTargetIdentifier source, RenderTargetIdentifier destination)
    {
    }

    public override void Setup()
    {
    }
}
```

![[7ce9b8944b7654a98eaa0ad77a6d6982_MD5.webp]]

可以看到测试组件

# Renderer Feature 与 Render Pass

好看吗？就让你们看看，不卖。URP 并不会调用自定义组件的渲染方法（毕竟本来就没有），这部分需要自己实现，所以还是得祭出 Renderer Feature。

官方示例中，一个 Renderer Feature 对应一个自定义后处理效果，各个后处理相互独立，好处是灵活自由易调整；坏处也在此，相互独立意味着每个效果都可能要开临时 RT，耗费资源比双缓冲互换要多，并且 Renderer Feature 在 Renderer Data 下，相对于场景中的 Volume 来说在代码中调用起来反而没那么方便。

那么这里的思路便是将所有相同插入点的后处理组件放到同一个 Render Pass 下渲染，这样就可以做到双缓冲交换，又保持了 Volume 的优势。

## 获取自定义后处理组件

先来写 Render Pass，在里面定义好刚才写的自定义组件列表、Profiler 所需变量，还有渲染源、目标与可能会用到的临时 RT：

**CustomPostProcessRenderPass.cs**

```
public class CustomPostProcessRenderPass : ScriptableRenderPass
{
    List<CustomVolumeComponent> volumeComponents;   // 所有自定义后处理组件
    List<int> activeComponents; // 当前可用的组件下标

    string profilerTag;
    List<ProfilingSampler> profilingSamplers; // 每个组件对应的ProfilingSampler

    RenderTargetHandle source;  // 当前源与目标
    RenderTargetHandle destination;
    RenderTargetHandle tempRT0; // 临时RT
    RenderTargetHandle tempRT1;

    /// <param name="profilerTag">Profiler标识</param>
    /// <param name="volumeComponents">属于该RendererPass的后处理组件</param>
    public CustomPostProcessRenderPass(string profilerTag, List<CustomVolumeComponent> volumeComponents)
    {
        this.profilerTag = profilerTag;
        this.volumeComponents = volumeComponents;
        activeComponents = new List<int>(volumeComponents.Count);
        profilingSamplers = volumeComponents.Select(c => new ProfilingSampler(c.ToString())).ToList();

        tempRT0.Init("_TemporaryRenderTexture0");
        tempRT1.Init("_TemporaryRenderTexture1");
    }

    ...
}
```

构造方法中接收这个 Render Pass 的 Profiler 标识与后处理组件列表，以每个组件的名称作为它们渲染时的 Profiler 标识。

Renderer Feature 中，定义三个插入点对应的 Render Pass，以及所有自定义组件列表，还有一个用于后处理之后的 RenderTargetHandle，这个变量之后会介绍：

**CustomPostProcessRendererFeature.cs**

```
/// <summary>
/// 自定义后处理Renderer Feature
/// </summary>
public class CustomPostProcessRendererFeature : ScriptableRendererFeature
{
    // 不同插入点的render pass
    CustomPostProcessRenderPass afterOpaqueAndSky;
    CustomPostProcessRenderPass beforePostProcess;
    CustomPostProcessRenderPass afterPostProcess;

    // 所有自定义的VolumeComponent
    List<CustomVolumeComponent> components;

    // 用于after PostProcess的render target
    RenderTargetHandle afterPostProcessTexture;
    ...
}
```

那么要如何拿到所有自定义后处理组件，这些组件是一开始就存在，还是必须要从菜单中添加之后才存在？暂且蒙在鼓里。  
通常可以通过`VolumeManager.instance.stack.GetComponent`方法来获取到 VolumeComponent，那么去看看 VolumeStack 的源码：

![[84d3e612e786154291d9fb878aa453ec_MD5.webp]]

VolumeStack.cs

它用一个字典存放了所有的 VolumeComponent，并且在`Reload`方法中根据`baseTypes`参数创建了它们，遗憾的是这是个 internal 变量。再看 VolumeMangager 中，`CreateStack`方法与`CheckStack`方法对`Reload`方法进行了调用：

![[d3af7384e1bf63dc6c6f74c652c99c9e_MD5.webp]]

VolumeManager.cs

在`ReloadBaseTypes`中对`baseComponentTypes`进行了赋值，可以发现它包含了所有 VolumeComponent 的非抽象子类类型：

![[b59c92b375378d41d0d2c02d6b25d7b6_MD5.webp]]

VolumeManager.cs

看到这里可以得出结论，所有后处理组件的实例一开始便存在于默认的 VolumeStack 中，不管它们是否从菜单中添加。并且万幸的是，`baseComponentTypes`是一个 public 变量，这样就不需要通过粗暴手段来获取了。

接着编写 CustomPostProcessRendererFeature 的`Create`方法，在这里获取到所有的自定义后处理组件，并且将它们根据各自的插入点分类并排好序，放入到对应的 Render Pass 中：

**CustomPostProcessRendererFeature.cs**

```
// 初始化Feature资源，每当序列化发生时都会调用
public override void Create()
{
    // 从VolumeManager获取所有自定义的VolumeComponent
    var stack = VolumeManager.instance.stack;
    components = VolumeManager.instance.baseComponentTypes
        .Where(t => t.IsSubclassOf(typeof(CustomVolumeComponent)) && stack.GetComponent(t) != null)
        .Select(t => stack.GetComponent(t) as CustomVolumeComponent)
        .ToList();

    // 初始化不同插入点的render pass
    var afterOpaqueAndSkyComponents = components
        .Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.AfterOpaqueAndSky)
        .OrderBy(c => c.OrderInPass)
        .ToList();
    afterOpaqueAndSky = new CustomPostProcessRenderPass("Custom PostProcess after Opaque and Sky", afterOpaqueAndSkyComponents);
    afterOpaqueAndSky.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;

    var beforePostProcessComponents = components
        .Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.BeforePostProcess)
        .OrderBy(c => c.OrderInPass)
        .ToList();
    beforePostProcess = new CustomPostProcessRenderPass("Custom PostProcess before PostProcess", beforePostProcessComponents);
    beforePostProcess.renderPassEvent = RenderPassEvent.BeforeRenderingPostProcessing;

    var afterPostProcessComponents = components
        .Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.AfterPostProcess)
        .OrderBy(c => c.OrderInPass)
        .ToList();
    afterPostProcess = new CustomPostProcessRenderPass("Custom PostProcess after PostProcess", afterPostProcessComponents);
    // 为了确保输入为_AfterPostProcessTexture，这里插入到AfterRendering而不是AfterRenderingPostProcessing
    afterPostProcess.renderPassEvent = RenderPassEvent.AfterRendering;

    // 初始化用于after PostProcess的render target
    afterPostProcessTexture.Init("_AfterPostProcessTexture");
}
```

依次设置每个 Render Pass 的 renderPassEvent，对于 AfterPostProcess 插入点，renderPassEvent 为`AfterRendering`而不是`AfterRenderingPostProcessing`，原因是如果插入到`AfterRenderingPostProcessing`，无法确保渲染输入源为`_AfterPostProcessTexture`，查看两种情况下的帧调试器：

插入到 AfterRenderingPostProcess：

![[504f9401e0ffcdf9c3043aaeb4f731da_MD5.webp]]

插入到 AfterRenderingPostProcess

插入到 AfterRendering：

![[28be5e3e7c1c7956d7bd542d14ccdac8_MD5.webp]]

插入到 AfterRendering

对比二者，可以发现插入点之前的`Render PostProcessing Effects`的 RenderTarget 会不一样，并且在插入到 AfterRendering 的情况下，还会多出一个 FinalBlit，而 FinalBlit 的输入源正是`_AfterPostProcessTexture`：

![[9bd1196e97372cc403c5f849745e3420_MD5.webp]]

FinalBlit

所以定义`afterPostProcessTexture`变量的目的便是为了能获取到`_AfterPostProcessTexture`，处理后再渲染到它。

现在已经拿到了所有自定义后处理组件，下一步就可以开始初始化它们了。在这之前，记得重写`Dispose`方法做好资源释放，避免临时创建的材质漏得到处都是：

**CustomPostProcessRendererFeature.cs**

```
protected override void Dispose(bool disposing)
{
    base.Dispose(disposing);
    if (disposing && components != null)
    {
        foreach(var item in components)
        {
            item.Dispose();
        }
    }
}
```

## 初始化

上面在 CustomPostProcessRenderPass 中定义了一个变量`activeComponents`来存储当前可用的的后处理组件，在 Render Feature 的`AddRenderPasses`中，需要先判断 Render Pass 中是否有组件处于激活状态，如果没有一个组件激活，那么就没必要添加这个 Render Pass，这里调用先前在组件中定义好的 Setup 方法初始化，随后调用 IsActive 判断其是否处于激活状态：

**CustomPostProcessRenderPass.cs**

```
/// <summary>
/// 设置后处理组件
/// </summary>
/// <returns>是否存在有效组件</returns>
public bool SetupComponents()
{
    activeComponents.Clear();
    for (int i = 0; i < volumeComponents.Count; i++)
    {
        volumeComponents[i].Setup();
        if (volumeComponents[i].IsActive())
        {
            activeComponents.Add(i);
        }
    }
    return activeComponents.Count != 0;
}
```

当一个 Render Pass 中有处于激活状态的组件时，说明它行，很有精神，可以加入到队列中，那么需要设置它的渲染源与目标：

**CustomPostProcessRenderPass.cs**

```
/// <summary>
/// 设置渲染源和渲染目标
/// </summary>
public void Setup(RenderTargetHandle source, RenderTargetHandle destination)
{
    this.source = source;
    this.destination = destination;
}
```

之后在 CustomPostProcessRendererFeature 的`AddRenderPasses`方法中调用这两个方法，符合条件就将 Render Pass 添加：

**CustomPostProcessRendererFeature.cs**

```
// 你可以在这里将一个或多个render pass注入到renderer中。
// 当为每个摄影机设置一次渲染器时，将调用此方法。
public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
{
    if (renderingData.cameraData.postProcessEnabled)
    {
        // 为每个render pass设置render target
        var source = new RenderTargetHandle(renderer.cameraColorTarget);
        if (afterOpaqueAndSky.SetupComponents())
        {
            afterOpaqueAndSky.Setup(source, source);
            renderer.EnqueuePass(afterOpaqueAndSky);
        }
        if (beforePostProcess.SetupComponents())
        {
            beforePostProcess.Setup(source, source);
            renderer.EnqueuePass(beforePostProcess);
        }
        if (afterPostProcess.SetupComponents())
        {
            // 如果下一个Pass是FinalBlit，则输入与输出均为_AfterPostProcessTexture
            source = renderingData.cameraData.resolveFinalTarget ? afterPostProcessTexture : source;
            afterPostProcess.Setup(source, source);
            renderer.EnqueuePass(afterPostProcess);
        }
    }
}
```

至此 Renderer Feature 类中的所有代码就写完了，接下来继续在 Render Pass 中实现渲染。

## 执行渲染

编写 Render Pass 中渲染执行的方法`Execute`：

```
// 你可以在这里实现渲染逻辑。
// 使用<c>ScriptableRenderContext</c>来执行绘图命令或Command Buffer
// https://docs.unity3d.com/ScriptReference/Rendering.ScriptableRenderContext.html
// 你不需要手动调用ScriptableRenderContext.submit，渲染管线会在特定位置调用它。
public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
{
    var cmd = CommandBufferPool.Get(profilerTag);
    context.ExecuteCommandBuffer(cmd);
    cmd.Clear();

    // 获取Descriptor
    var descriptor = renderingData.cameraData.cameraTargetDescriptor;
    descriptor.msaaSamples = 1;
    descriptor.depthBufferBits = 0;

    // 初始化临时RT
    RenderTargetIdentifier buff0, buff1;
    bool rt1Used = false;
    cmd.GetTemporaryRT(tempRT0.id, descriptor);
    buff0 = tempRT0.id;
    // 如果destination没有初始化，则需要获取RT，主要是destinaton为_AfterPostProcessTexture的情况
    if (destination != RenderTargetHandle.CameraTarget && !destination.HasInternalRenderTargetId())
    {
        cmd.GetTemporaryRT(destination.id, descriptor);
    }

    // 执行每个组件的Render方法
    // 如果只有一个组件，则直接source -> buff0
    if (activeComponents.Count == 1)
    {
        int index = activeComponents[0];
        using (new ProfilingScope(cmd, profilingSamplers[index]))
        {
            volumeComponents[index].Render(cmd, ref renderingData, source.Identifier(), buff0);
        }
    }
    else
    {
        // 如果有多个组件，则在两个RT上左右横跳
        cmd.GetTemporaryRT(tempRT1.id, descriptor);
        buff1 = tempRT1.id;
        rt1Used = true;
        Blit(cmd, source.Identifier(), buff0);
        for (int i = 0; i < activeComponents.Count; i++)
        {
            int index = activeComponents[i];
            var component = volumeComponents[index];
            using (new ProfilingScope(cmd, profilingSamplers[index]))
            {
                component.Render(cmd, ref renderingData, buff0, buff1);
            }
            CoreUtils.Swap(ref buff0, ref buff1);
        }
    }

    // 最后blit到destination
    Blit(cmd, buff0, destination.Identifier());

    // 释放
    cmd.ReleaseTemporaryRT(tempRT0.id);
    if (rt1Used)
        cmd.ReleaseTemporaryRT(tempRT1.id);

    context.ExecuteCommandBuffer(cmd);
    CommandBufferPool.Release(cmd);
}
```

这里如果写得再简洁一些应该是可以只需要 source 和 destination 两个变量就行。需要注意某些情况下`_AfterPostProcessTexture`可能不存在，所以添加了手动获取 RT 的处理。如果不做这一步可能会出现 Warning：

![[c02ebaa7733142c5418ad09aa972c0c8_MD5.webp]]

找不到_AfterPostProcessTexture

到这里 Renderer Feature 与 Render Pass 就全部编写完成，接下来使用一下看看实际效果。

# 使用一下看看实际效果

以官方示例中的卡通描边效果为例，先从把示例中的 SobelFilter.shader 窃过来，将 Shader 名称改为 "Hidden/PostProcess/SobelFilter"，然后编写后处理组件 SobelFilter 类：

**SobelFilter.cs**

```
[VolumeComponentMenu("Custom Post-processing/Sobel Filter")]
public class SobelFilter : CustomVolumeComponent
{
    public ClampedFloatParameter lineThickness = new ClampedFloatParameter(0f, .0005f, .0025f);
    public BoolParameter outLineOnly = new BoolParameter(false);
    public BoolParameter posterize = new BoolParameter(false);
    public IntParameter count = new IntParameter(6);

    Material material;
    const string shaderName = "Hidden/PostProcess/SobelFilter";

    public override CustomPostProcessInjectionPoint InjectionPoint => CustomPostProcessInjectionPoint.AfterOpaqueAndSky;

    public override void Setup()
    {
        if (material == null)
            material = CoreUtils.CreateEngineMaterial(shaderName);
    }

    public override bool IsActive() => material != null && lineThickness.value > 0f;

    public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RenderTargetIdentifier source, RenderTargetIdentifier destination)
    {
        if (material == null)
            return;

        material.SetFloat("_Delta", lineThickness.value);
        material.SetInt("_PosterizationCount", count.value);
        if (outLineOnly.value)
            material.EnableKeyword("RAW_OUTLINE");
        else
            material.DisableKeyword("RAW_OUTLINE");
        if (posterize.value)
            material.EnableKeyword("POSTERIZE");
        else
            material.DisableKeyword("POSTERIZE");

        cmd.Blit(source, destination, material);
    }

    public override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        CoreUtils.Destroy(material);
    }
}
```

使用 CoreUtils.CreateEngineMaterial 来从 Shader 创建材质，在 Dispose 中销毁它。Render 方法中的 cmd.Blit 之后可以考虑换成 CoreUtils.DrawFullScreen 画全屏三角形。

需要注意的是，IsActive 方法最好要在组件无效时返回 false，避免组件未激活时仍然执行了渲染，原因之前提到过，无论组件是否添加到 Volume 菜单中或是否勾选，VolumeManager 总是会初始化所有的 VolumeComponent。

CoreUtils.CreateEngineMaterial(shaderName) 内部依然是调用 Shader.Find 方法来查找 Shader：

![[37aac0953bb56f6ccfc076c408abb658_MD5.webp]]

CoreUtils.cs

添加 Renderer Feature：

![[430cdd735d07185cabe200919858d6fc_MD5.webp]]

在 Volume 中添加并启用 Sobel Filter：

![[05526b2eca6ae6f797ee2ddb993641b1_MD5.webp]]

效果：

![[1a04aedc9a2f0ce4dd815529ce5426a4_MD5.webp]]

![[353969d293c281a340ddbf7407d9fe73_MD5.webp]]

继续加入更多后处理组件，这里使用连连看简单连了一个条纹故障和一个 RGB 分离故障，它们的插入点都是内置后处理之后：

![[479b7d4e587f5f82bcd7ee24287bca33_MD5.webp]]

条纹故障

![[33645742dd504c5bdd4b399aa636e83f_MD5.webp]]

RGB 分离

![[886dc4876b0396686ee65339b39c9729_MD5.webp]]

效果：

![[91e479f861f40e716adf3c82c2e14630_MD5.webp]]

效果

# 应用到 2D

~由于目前 2D Renderer 还不支持 Renderer Feature，只好采取一个妥协的办法。首先新建一个 Forward Renderer 添加到 Renderer List 中：~

![[7f982c13b9dbb97d78fdbd74eee9bfcd_MD5.webp]]

~场景中新建一个相机，Render Type 改为 Overlay，Renderer 选择刚才创建的 Forward Renderer，并开启 Post Processing：~

![[88081715b08710ef03ae5de6dc10d547_MD5.webp]]

~添加到主相机的 Stack 上，主相机关闭 Post Processing：~

![[b106202cf903d71c0c4fe3a485b5d162_MD5.webp]]

URP 12.1.x 中已经有了对 2D 的 Renderer Feature 支持，所以只需要添加自定义的 Renderer Feature 即可，其他使用方式和 3D 一致。

到这里对 URP 后处理的扩展就基本完成了，当然包括渲染在内还有很多地方可以继续完善，比如进一步优化双缓冲、全屏三角形、同一组件支持多个插入点等等。

对于编辑器中运行有效果，但打包后没有效果的情况，可能的原因是 Shader 文件在打包时被剔除了，这种情况只要确保 Shader 文件被包含或者可被加载即可（添加到 Always Included Shaders、放到 Resources、从 AB 加载等等）。

用到的素材：[Free Space Runner Pack](https://links.jianshu.com/go?to=https%3A%2F%2Fmattwalkden.itch.io%2Ffree-space-runner-pack) & [Free Lunar Battle Pack](https://links.jianshu.com/go?to=https%3A%2F%2Fmattwalkden.itch.io%2Flunar-battle-pack) by [MattWalkden](https://links.jianshu.com/go?to=https%3A%2F%2Fmattwalkden.itch.io%2F)