
# 参考
[Unity URP14.0 自定义后处理系统 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/621840900)
[【Unity URP】关于2022的后处理简单搭建 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/633755942)
[Unity URP14.0 自定义后处理系统 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/621840900)

关于 URP14 的讨论：
[URP 毛玻璃（升级至URP_v14.0.6） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/618752003)
[URP Blit 入门 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/619482619)
# 创建后处理系统

> [!NOTE] Title
> 原文有错误，主要学习框架搭建思路，已经在个人代码中改正
> [Unity URP14.0 自定义后处理系统 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/621840900)

在 Unity [官方文档](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/index.html)中，给出了两种使用后处理的方法。
第一种使用 Global Volume，但仅限于使用内置后处理，自定义后处理需要修改 URP，十分麻烦。
第二种使用自定义 RenderFeature 添加自定义 RenderPass，但一个后处理效果对应两个脚本，并且会带来多个 RenderPass，不停纹理申请和获取的消耗。

**在这个基础上，我们创建一个自己的后处理系统，使得 Renderer 挂载一个 RenderFeature，并且一个后处理效果只需要创建一个脚本。**



## 后处理系统设计分析

通过上两个官方文档中的例子，可以发现第二种使用 `ReanderFeature/Pass` 来创建一个**指定**的后处理效果其实就是一个后处理系统的雏形。

然而这样会由一些性能问题。在类似 `ColorBlitFeature.cs` 的具体后处理 Feature 中，它们都在 `AddRenderPasses()` 中调用 `EnqueuePass` 函数。每个后处理效果都会创建一个 RenderPass，即使它们在相同的注入点。这样会导致一些性能问题，例如不停地请求纹理和创建纹理。  
为了解决这个问题，我们可以优化渲染过程。我们可以将相同注入点的后处理效果杂交到一个 RenderPass 中，然后再通过 RendererFeature 对这个杂交的 RenderPass 调用 `EnqueuePass` 函数。这样，相同注入点的后处理效果可以共享一个 RenderPass，在这个 RenderPass 的 `Execute` 中调用每个具体后处理的渲染逻辑，在相同纹理签名间 `Blit`，从而节省性能消耗。
**换句话说，让相同注入点的 RenderPass 包含许多子 Pass（子 Pass=> 一次 Blit），每个子 Pass 处理对应的后处理效果。通过上述描述，可以得出我们只需要向 Renderer 添加一个 RenderFeature 即可。**

除此之外，这样的设计也很繁琐。每次创建一个新的后处理 Shader 时，都需要额外创建两个脚本：一个 RendererFeature 用于创建 RenderPass，一个 RenderPass 用于执行 Blit 命令。

第一种使用 Global Volume 的方法就很方便，但仅适用于自带的后处理，要添加自定义后处理可能涉及到管线的修改，不采用。于是有了一个想法，即将第一种和第二种方法杂交一下。

因此，我们想到了一个基本的思路：
1. 创建**一个**后处理基类 `CustomPostProcessing.cs`，让具体的后处理效果继承自这个基类。具体的后处理效果只需要实现自己的渲染逻辑即可。
2. 创建**一个**自定义的 RendererFeature 类来获取所有 Volume 中 `CustomPostProcessing.cs` 子类，并根据它们的具体设置（如注入位置等）创建对应的自定义 RenderPass 实例。每个 RenderPass 类在 `Execute` 函数中调用对应所有 `CustomPostProcessing` 基类的 Render 函数，从而实现具体后处理脚本的渲染。

大致框架如下。  

![[a58728188f9a4998d4fba768d8007c77_MD5.jpg]]

## 后处理基类

经过上面分析，首先需要将 `CustomPostProcessing` 的基类添加到 Volume 的 Override 菜单里。这里通过前面对 `Bloom.cs` 源码的查看。  

![[3355a048d8f4b5c781e7be2ee45a8a7a_MD5.png]]

发现只需要继承 `VolumeComponent` 和 `IPostProcessComponent` 即可。基类添加 `VolumeComponentMenuForRenderPipeline()` 来添加菜单。由于渲染时会生成临时 RT，所以还需要继承 `IDisposable`。

```cs
public abstract class CustomPostProcessing : VolumeComponent, IPostProcessComponent, IDisposable{

	}
```

然后添加 `IPostProcessComponent` 必须要 override 的一些函数，同样可以通过查看 `Bloom.cs` 来填写。（其实是根据不写会报错）  
`IPostProcessComponent` 要求定义 `IsActive()` 用来返回当前后处理是否 active；`IsTileCompatible()` 不知道用来干嘛的，但 `Bloom.cs` 里 get 值 false，抄下来就行了。

```cs
#region IPostProcessComponent
	public abstract bool IsActive();
	
	public virtual bool IsTileCompatible() => false;
	 #endregion
```

`IDispose` 部分如下：

```cs
#region IDisposable 
	public void Dispose() {  
	    Dispose(true);  
	    GC.SuppressFinalize(this);  
	}  
	
	public virtual void Dispose(bool disposing) {  
	}  
	#endregion
```

最后为其添加每个公用的属性和函数。  
首先是这个后处理效果的注入点，这里先分三个。并且，加入当前后处理在注入点的执行顺序。

```cs
public enum CustomPostProcessInjectionPoint{
	AfterOpaqueAndSky,
	BeforePostProcess,
	AfterPostProcess
}

    public abstract class CustomPostProcessing : VolumeComponent, IPostProcessComponent, IDisposable{
        // 注入点
        public virtual CustomPostProcessInjectionPoint InjectionPoint => CustomPostProcessInjectionPoint.AfterPostProcess;
        
        //  在注入点的顺序
        public virtual int OrderInInjectionPoint => 0;
}
```

最后，加入 `Setup` 配置当前后处理，`Render` 渲染当前后处理。

```cs
// 配置当前后处理
        public abstract void Setup();

        // 执行渲染
        public abstract void Render(CommandBuffer cmd, ref RenderingData renderingData, RTHandle source, RTHandle destination);
```

`RTHandle` 是一个 RenderTexture，它会随着相机的大小自动缩放。这允许在渲染过程中使用不同尺寸的不同相机时适当地重用 RenderTexture 内存。

测试一下子类是否能在 Volume 组件里显示出来，这里新写一个 `ColorBlitPass.cs`：

```cs
[VolumeComponentMenu("Custom Post-processing/Color Blit")]
public class ColorBlitPass : CustomPostProcessing{
	public ClampedFloatParameter intensity = new(0.0f, 0.0f, 2.0f)

	public override bool IsActive() => true;
		
	public override void Setup() {

	}

	public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RTHandle source, RTHandle destination) {
	}

	public override void Dispose(bool disposing) {
	}
}
```

成功。  

![[9b4e4c81346beca9f822f358fcf2aa9f_MD5.jpg]]

## 抓取 Volume 内后处理组件

由前面的分析，`CustomRedererFeature` 应该抓取 Volume 内后处理的组件，然后根据注入点位置创建 3 种 RenderPass，入到队列中。

### CustomRenderPass

首先填写 CustomRenderPass 的必要代码。为了在 `Execute` 内调用对应注入点的 `CustomPostProcessing` 的 `Render` 函数，我们**需要在构造函数中向其传递当前注入点的所有 `CustomPostProcessing` 实例**。同时，再声明一些必要的变量。

**CustomPostProcessingPass. cs**

```cs
public class CustomPostProcessingPass : ScriptableRenderPass{
	// 所有自定义后处理基类
	private List<CustomPostProcessing> mCustomPostProcessings;
        // 当前active组件下标
        private List<int> mActiveCustomPostProcessingIndex;

        // 每个组件对应的ProfilingSampler
        private string mProfilerTag;
        private List<ProfilingSampler> mProfilingSamplers;

        // 声明RT
        private RTHandle mSourceRT;
        private RTHandle mDesRT;
        private RTHandle mTempRT0;
        private RTHandle mTempRT1;

        private string mTempRT0Name => "_TemporaryRenderTexture0";
        private string mTempRT1Name => "_TemporaryRenderTexture1";

        public CustomPostProcessingPass(string profilerTag, List<CustomPostProcessing> customPostProcessings) {
            mProfilerTag = profilerTag;
            mCustomPostProcessings = customPostProcessings;
            mActiveCustomPostProcessingIndex = new List<int>(customPostProcessings.Count);
            // 将自定义后处理器对象列表转换成一个性能采样器对象列表
            mProfilingSamplers = customPostProcessings.Select(c => new ProfilingSampler(c.ToString())).ToList();

            mTempRT0 = RTHandles.Alloc(mTempRT0Name, name: mTempRT0Name);
            mTempRT1 = RTHandles.Alloc(mTempRT1Name, name: mTempRT1Name);
        }
}
```

值得注意的是，**在 URP14.0 (或者在这之前) 中，抛弃了原有 `RenderTargetHandle`，而通通使用 `RTHandle`。原来的 `Init` 也变成了 `RTHandles.Alloc`**，具体更新内容可以看最后的参考连接。

### CustomRenderFeature

然后需要在 `CustomRenderFeature` 中抓取所有 Volume 中的后处理组件并按照注入点分类。这在 `Create()` 函数里进行，它会在 `OnEnable` 和 `OnValidate` 时被调用。

### 管线源码分析：如何抓取所有 Volume 中的组件

下面讨论**如何抓取所有 Volume 中的组件**。

首先，与 Volume 相关代码封装在 `VolumeManager.cs` 中。首先可以发现，它采用单例模式。  

![[14809a7ee86a6f2cad55d34d3481e749_MD5.png]]

忽略那些 Internal 函数，它提供了一个 `baseComponentArray` 属性，并且它是 public 的。

![[30e9c26d38b9c34f212615586dda2a71_MD5.jpg]]

  
根据描述，它是继承于 `VolumeComponent` 的所有子类**类型**的列表（注意是类型，而非实例）。注意这个描述，这说明不论后处理基类是否在 Volume 中，它都会存在 `baseComponentArray` 里面。

跟踪一下给这个属性赋值的地方，找到 `ReloadBaseType()` 函数。

![[6f3ac19aceb662e0e20406cd34f4fc00_MD5.jpg]]

  
在函数里获取了所有继承自 `VolumeComponent` 的非抽象类**类型**派生，存储在 `baseComponentTypeArray`。并且，循环 `baseComponentTypeArray`，把它作为 `VolumeComponent` 派生类**实例**添加到 `m_ComponentDefaultState` 里面，这个 `m_ComponentDefaultState` 在后面也有用处。  
根据注释描述，得知它只会在运行时调用一次，而每次脚本重载在编辑器中启动时，我们需要跟踪项目中的任何兼容组件。

继续跟踪 `ReloadBaseTypes()` 函数，发现它是在构造函数里创建的 (忽略 Editor Only)。的确是运行时只调用一次。也就是说，这个单例被创建时，就填充 `baseComponentTypeArray`。

![[653e6b912cda152864de51b2cf2621e0_MD5.jpg]]

**通过上述讨论，我们得知，如果想要获取所有继承自 `VolumeComponent` 的派生类类型，并且筛选出派生类型为 `CustomPostProcessing` 的列表，代码如下：**

```cs
var derivedVolumeComponentTypes = VolumeManager.instance.baseComponentTypeArray;  
var customPostProcessingTypes = derivedVolumeComponentTypes.Where(t => t.IsSubclassOf(typeof(CustomPostProcessing))).Tolist(;
```

但是这只能筛选出继承自 `VolumeComponent` 的派生类类型的列表，并不能获取具体派生类实例。继续分析。

注意到这个构造函数里还有一个 `CreateStack()` 函数赋值给 `m_DefaultStack`，并且将 `stack` 赋值。首先 `stack` 是 public 属性，我们可以直接通过单例访问到它。然后跟踪 `CreateStack()`。

![[077120b8ad43ea01945c3f2782cfb4dc_MD5.jpg]]

  
发现它用 `Reload(m_ComponentDefaultStata)` 函数填充 stack 并返回。继续跟踪 `Reload` 函数。发现它就是把 `m_ComponentDefaultStata` 里存放的 `VolumeComponent` 派生实例的类型和实例分割，放到一个字典 `components` 里。

![[9ed04af4d210913d6b49592505a07557_MD5.jpg]]

![[16387e5c1c0382129c2113c92c37af5e_MD5.jpg]]

  
也就是说，如果我们想要知道一个 `VolumeComponent` 派生类的具体实例，只需要访问 `components` 即可。但是 `components` 是 internal 的，我们对它进行跟踪，找到 `GetComponent()` 函数，正是我们需要的 public 的返回 `components` 的函数。

![[0065ff619fab72d8445397819d257048_MD5.jpg]]

那么获取所有继承于 `VolumeComponent` 的 `CustomPostProcessing` 实例的思路就很清晰了：首先获取所有类型为 `CustomProcessing` 的元素，让后将它们替换为 `stack.components` 里对应的实例。这样既保证了获取的是实例，又保证了实例类型是 `CustomProcessing`。  
代码如下：

```c
// 获取VolumeStack 
var stack = VolumeManager.instance.stack;  
  
// 获取volumeStack中所有CustomPostProcessing实例 
var customPostProcessings = VolumeManager.instance.baseComponentTypeArray  
    .Where(t => t.IsSubclassOf(typeof(CustomPostProcessing))) // 筛选出volumeStack中的CustomPostProcessing类型元素 不论是否在Volume中 不论是否激活 
    .Select(t => stack.GetComponent(t) as CustomPostProcessing) // 将类型元素转换为实例 
    .ToList(); // 转换为List
```

### 具体代码

经过上述分析，我们首先需要在 `Create()` 里抓取 `VolumeComponent` 的所有派生类实例。

**CustomPostProcessingFeature. cs**

```c
public override void Create() {
	// 获取VolumeStack
	var stack = VolumeManager.instance.stack;

	// 获取所有的CustomPostProcessing实例
	mCustomPostProcessings = VolumeManager.instance.baseComponentTypeArray
		.Where(t => t.IsSubclassOf(typeof(CustomPostProcessing))) // 筛选出VolumeComponent派生类类型中所有的CustomPostProcessing类型元素 不论是否在Volume中 不论是否激活
		.Select(t => stack.GetComponent(t) as CustomPostProcessing) // 将类型元素转换为实例
		.ToList(); // 转换为List
}
```

下一步，对抓取到的所有 CustomPostProcessing 实例按照注入点分类，并且按照在注入点的顺序进行排序。再把对应 CPPs 实例传递给 RenderPass 实例，依据注入点分类通过 `renderPassEvent` 设置渲染时间。

```c
// 初始化不同插入点的render pass
	// 找到在透明物和天空后渲染的CustomPostProcessing
	var afterOpaqueAndSkyCPPs = mCustomPostProcessings
		.Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.AfterOpaqueAndSky) // 筛选出所有CustomPostProcessing类中注入点为透明物体和天空后的实例
		.OrderBy(c => c.OrderInInjectionPoint) // 按照顺序排序
		.ToList(); // 转换为List
	// 创建CustomPostProcessingPass类
	mAfterOpaqueAndSkyPass = new CustomPostProcessingPass("Custom PostProcess after Skybox", afterOpaqueAndSkyCPPs);
	// 设置Pass执行时间
	mAfterOpaqueAndSkyPass.renderPassEvent = RenderPassEvent.AfterRenderingSkybox;

	var beforePostProcessingCPPs = mCustomPostProcessings
		.Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.BeforePostProcess)
		.OrderBy(c => c.OrderInInjectionPoint)
		.ToList();
	mBeforePostProcessPass = new CustomPostProcessingPass("Custom PostProcess before PostProcess", beforePostProcessingCPPs);
	mBeforePostProcessPass.renderPassEvent = RenderPassEvent.BeforeRenderingPostProcessing;

	var afterPostProcessCPPs = mCustomPostProcessings
		.Where(c => c.InjectionPoint == CustomPostProcessInjectionPoint.AfterPostProcess)
		.OrderBy(c => c.OrderInInjectionPoint)
		.ToList();
	mAfterPostProcessPass = new CustomPostProcessingPass("Custom PostProcess after PostProcessing", afterPostProcessCPPs);
	mAfterPostProcessPass.renderPassEvent = RenderPassEvent.AfterRenderingPostProcessing;
```

抓取完 CustomPostProcessing 实例后，我们需要在 Dispose 里全部释放他们。  
**CustomPostProcessingFeature. cs**

```c
protected override void Dispose(bool disposing) {
	base.Dispose(disposing);
	if (disposing && mCustomPostProcessings != null) {
		foreach (var item in mCustomPostProcessings) {
			item.Dispose();
		}
	}
}
```

### 注入 Pass

前面提到，通过 VolumeManager 抓取是所有 `VolumeComponent` 的派生类，不管是否在 Volume 中，所以我们还需要在 RenderPass 中判断杂交的 `CustomPostProcessing` 是否是激活状态。  
**CustomPostProcessingPass. cs**

```cs
// 获取active的CPPs下标，并返回是否存在有效组件
public bool SetupCustomPostProcessing() {
	mActiveCustomPostProcessingIndex.Clear();
	for (int i = 0; i < mCustomPostProcessings.Count; i++) {
		mCustomPostProcessings[i].Setup();
		if (mCustomPostProcessings[i].IsActive()) {
			mActiveCustomPostProcessingIndex.Add(i);
		}
	}

	return mActiveCustomPostProcessingIndex.Count != 0;
}
```

下面完成 RenderFeature 的第二个任务，将 RenderPass EnqueuePass。它在 `AddRenderPasses` 函数中进行，我们将不同的注入点的 RenderPass 注入到 renderer 中。  
**CustomRenderFeature. cs**

```cs
// 当为每个摄像机设置一个渲染器时，调用此方法
// 将不同注入点的RenderPass注入到renderer中
public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData) {
	// 当前渲染的游戏相机支持后处理
	if (renderingData.cameraData.postProcessEnabled) {
		// 为每个render pass设置RT
		// 并且将pass列表加到renderer中
		if (mAfterOpaqueAndSkyPass.SetupCustomPostProcessing()) {
			mAfterOpaqueAndSkyPass.ConfigureInput(ScriptableRenderPassInput.Color);
			renderer.EnqueuePass(mAfterOpaqueAndSkyPass);
		}
		
		if (mBeforePostProcessPass.SetupCustomPostProcessing()) {
			mBeforePostProcessPass.ConfigureInput(ScriptableRenderPassInput.Color);
			renderer.EnqueuePass(mBeforePostProcessPass);
		}
		
		if (mAfterPostProcessPass.SetupCustomPostProcessing()) {
			mAfterPostProcessPass.ConfigureInput(ScriptableRenderPassInput.Color);
			renderer.EnqueuePass(mAfterPostProcessPass);
		}
	}
}
```

网上有些资料在这个函数里配置 RenderPass 的源 RT 和目标 RT，具体来说使用类似 `RenderPass.Setup(renderer.cameraColorTargetHandle, renderer.cameraColorTargetHandle)` 的方式，但是这在 URP14.0 中会报错，提示 `renderer.cameraColorTargetHandle` 只能在 `ScriptableRenderPass` 子类里调用。具体细节可以查看最后的参考连接。

下面再讨论一种**错误**做法。转到 RenderPass 中，在 `OnCameraSetup` 重载函数中设置当前 RenderPass 的源 RT 和目标 RT，它将在相机渲染前被调用。

```cs
public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData) {
	RenderTextureDescriptor blitTargetDescriptor = renderingData.cameraData.cameraTargetDescriptor;
	blitTargetDescriptor.depthBufferBits = 0;

	var renderer = renderingData.cameraData.renderer;

	// 源RT固定为相机的颜色RT "_CameraColorAttachmentA"
	mSourceRT = renderer.cameraColorTargetHandle;
	mDesRT = renderer.cameraColorTargetHandle;
}
```

这会带来什么错误呢？如果注入点非后处理后，则相机源和目标应该为 `_CameraColorAttachmentA`。但是注入点在后处理后时，RP 会进行一次 FinalBlit，最终相机的源和目标应该为 `_CameraColorAttachmentB`。不过这不需要判断，直接在 `Execute` 里面赋值即可。（按理来说可能消耗会更高，但是我不知道怎样在有 finalBlit 的情况下提前获取_CameraColorAttachmentB）

如图，这是只有注入点在渲染天空盒后的 Frame Debugger。它没有 Final Blit，所以可以把 RT 设置为 `_CameraColorAttachmentA`。

![[9999f5057ab1a77a2c707abc73f872cb_MD5.jpg]]

  
然后，这是添加注入点在后处理后的 Frame Debugger。它生出了 Final Blit，而且 Final Blit 的输入源 RT 为 `_CameraColorAttachmentB`。

![[a3ee98ef673efc05ce6976875519d0c7_MD5.jpg]]

  
所以这个注入点在后处理后的后处理 RT 应该为 `_CameraColorAttchmentB`。

![[5191827d7ef488d9eb36600068697ec5_MD5.jpg]]

### RenderPass 渲染

下面完成最后一步，即在 `CustomPostProcessingPass` 的 `Execute` 函数里填写具体的渲染代码。  
**主要流程如下**

1.  声明临时纹理
2.  设置源渲染纹理 `mSourceRT` 目标渲染纹理 `mDesRT` 为渲染数据的相机颜色目标处理。（区分有无 finalBlit）
3.  如果只有一个后处理效果，则直接将这个后处理效果从 `mSourceRT` 渲染到 `mTempRT0`。
4.  如果有多个后处理效果，则逐后处理的在 `mTempRT0` 和 `mTempRT1` 之间渲染。由于每次循环结束交换它们，所以最终纹理依然存在 `mTempRT0`。
5.  使用 Blitter. BlitCameraTexture 函数将 mTempRT0 中的结果复制到目标渲染纹理 mDesRT 中。

完整代码如下：

```cs
// 实现渲染逻辑
public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData) {
	// 初始化commandbuffer
	var cmd = CommandBufferPool.Get(mProfilerTag);
	context.ExecuteCommandBuffer(cmd);
	cmd.Clear();

	// 获取相机Descriptor
	var descriptor = renderingData.cameraData.cameraTargetDescriptor;
	descriptor.msaaSamples = 1;
	descriptor.depthBufferBits = 0;

	// 初始化临时RT
	bool rt1Used = false;

	// 设置源和目标RT为本次渲染的RT 在Execute里进行 特殊处理后处理后注入点
	mDesRT = renderingData.cameraData.renderer.cameraColorTargetHandle;
	mSourceRT = renderingData.cameraData.renderer.cameraColorTargetHandle;

	// 声明temp0临时纹理
	// cmd.GetTemporaryRT(Shader.PropertyToID(mTempRT0.name), descriptor);
	// mTempRT0 = RTHandles.Alloc(mTempRT0.name);
	RenderingUtils.ReAllocateIfNeeded(ref mTempRT0, descriptor, name: mTempRT0Name);

	// 执行每个组件的Render方法
	if (mActiveCustomPostProcessingIndex.Count == 1) {
		int index = mActiveCustomPostProcessingIndex[0];
		using (new ProfilingScope(cmd, mProfilingSamplers[index])) {
			mCustomPostProcessings[index].Render(cmd, ref renderingData, mSourceRT, mTempRT0);
		}
	}
	else {
		// 如果有多个组件，则在两个RT上来回bilt
		RenderingUtils.ReAllocateIfNeeded(ref mTempRT1, descriptor, name: mTempRT1Name);
		rt1Used = true;
		Blit(cmd, mSourceRT, mTempRT0);
		for (int i = 0; i < mActiveCustomPostProcessingIndex.Count; i++) {
			int index = mActiveCustomPostProcessingIndex[i];
			var customProcessing = mCustomPostProcessings[index];
			using (new ProfilingScope(cmd, mProfilingSamplers[index])) {
				customProcessing.Render(cmd, ref renderingData, mTempRT0, mTempRT1);
			}

			CoreUtils.Swap(ref mTempRT0, ref mTempRT1);
		}
	}
	
	Blitter.BlitCameraTexture(cmd, mTempRT0, mDesRT);

	// 释放
	cmd.ReleaseTemporaryRT(Shader.PropertyToID(mTempRT0.name));
	if (rt1Used) cmd.ReleaseTemporaryRT(Shader.PropertyToID(mTempRT1.name));

	context.ExecuteCommandBuffer(cmd);
	CommandBufferPool.Release(cmd);
}
```

## 例子：ColorBlit

在这之前，注意把 `CustomPostProcessingFeature` 添加到 Renderer 中。  

![[70b586d29f2ac3ec29df39ec15788649_MD5.jpg]]

下面把官方文档里的 ColorBlit 例子改为我们 CPP 系统能用的脚本。


C# 很简单，首先创建一个挂载 `ColorBlit.shader` 的材质，然后在 `Render()` 函数中调用 Blit 从 sourceRT 调用材质的 Shader 渲染给 destinationRT。  
**需要注意的是，我们的 RenderFeature 抓取的 CusomProcessing 是全部基于 VolumenComponent 的派生类，而不是当前场景 Global Volume 组件里的后处理**。所以为了 RenderPass 能够判断当前后处理是否有效，最好给每个后处理 `IsActive()` 除了判断材质非空外加上一个属性的约束。

**渲染的核心在于 Render 最后的 ``Blitter.BlitCameraTexture(cmd, source, destination, m_Material,0);``**

```c file:ColorBlit.cs
using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

[VolumeComponentMenu("Custom Post-processing/Color Blit")]
public class ColorBlitPass : CustomPostProcessing
{
    public ClampedFloatParameter intensity = new ClampedFloatParameter(0f, 0f, 1f);
    
    public Material m_Material;
    private const string m_ShaderName = "CustomPostProcessing/ColorBlit";
    
    
    public override CustomPostProcessingInjectionPoint InjectionPoint => CustomPostProcessingInjectionPoint.BeforeRenderingPostProcessing;
    
    public override int OrderInInjectionPoint => 0;
    
    public override bool IsActive() => m_Material != null && intensity.value > 0f;
    
    public override void Setup()
    {
        if (m_Material == null)
        {
            m_Material = CoreUtils.CreateEngineMaterial(m_ShaderName);
        }
    }
    
    public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RTHandle source, RTHandle destination)
    {
        if(m_Material == null)
            return;
        m_Material.SetFloat("_Intensity", intensity.value);
        
        Blitter.BlitCameraTexture(cmd, source, destination, m_Material,0);
        
    }
    
    public override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        CoreUtils.Destroy(m_Material);
    }
}
```

shader 需要改变
```cs
Shader "CustomPostProcessing/ColorBlit"
{
        SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline" = "UniversalPipeline"}
        LOD 100
        ZWrite Off Cull Off
        Pass
        {
            Name "ColorBlitPass"

            HLSLPROGRAM
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            // The Blit.hlsl file provides the vertex shader (Vert),
            // input structure (Attributes) and output strucutre (Varyings)
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"

            #pragma vertex Vert
            #pragma fragment frag

            TEXTURE2D_X(_CameraOpaqueTexture);
            SAMPLER(sampler_CameraOpaqueTexture);

            float _Intensity;

            half4 frag (Varyings input) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
                float4 color = SAMPLE_TEXTURE2D_X(_CameraOpaqueTexture, sampler_CameraOpaqueTexture, input.texcoord);
                return color * float4(0, _Intensity, 0, 1);
            }
            ENDHLSL
        }
    }
}
```
## 例子：ColorAdjustment

最基本的色彩调整后处理。

### ColorAdjustment. cs

```c
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;


[VolumeComponentMenu("Custom Post-processing/ColorAdjusments")]
public class ColorAdjusments : CustomPostProcessing
{
    #region 变量定义

    //后曝光
    public FloatParameter postExposure = new FloatParameter(0.0f);

    //对比度
    public ClampedFloatParameter contrast = new ClampedFloatParameter(0.0f, 0.0f, 100.0f);

    //颜色滤镜
    public ColorParameter colorFilter = new ColorParameter(Color.white, true, false, true);

    //色相偏移
    public ClampedFloatParameter hueShift = new ClampedFloatParameter(0.0f, -180.0f, 180.0f);

    //饱和度
    public ClampedFloatParameter saturation = new ClampedFloatParameter(0.0f, -100.0f, 100.0f);

    #endregion
    
    //blit材质
    private Material m_Material;
    private const string ShaderName = "CustomPostProcessing/ColorAdjusments";


    public override bool IsActive() => m_Material != null && (postExposure.value != 0.0f || contrast.value != 0.0f || colorFilter.value != Color.white || hueShift.value != 0.0f || saturation.value != 0.0f);


    public override CustomPostProcessingInjectionPoint InjectionPoint => CustomPostProcessingInjectionPoint.BeforeRenderingPostProcessing;

    private int m_ColorAdjustmentsId = Shader.PropertyToID("_ColorAdjustments");
    private int m_ColorFilterId = Shader.PropertyToID("_ColorFilter");
    private const string ExposureKeyword = "EXPOSURE";
    private const string ContrastKeyword = "CONTRAST";
    private const string HueShiftKeyword = "HUE_SHIFT";
    private const string SaturationKeyword = "SATURATION";
    private const string ColorFilterKeyword = "COLOR_FILTER";


    public override void Setup()
    {
        if (m_Material == null)
            m_Material = CoreUtils.CreateEngineMaterial(ShaderName);
    }

    public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RTHandle source,
        RTHandle destination)
    {
        if (m_Material == null) 
            return;
        
        Vector4 colorAdjustmentsVector4 = new Vector4(
            Mathf.Pow(2f, postExposure.value), // 曝光度 曝光单位是2的幂次
            contrast.value * 0.01f + 1f, // 对比度 将范围从[-100, 100]映射到[0, 2]
            hueShift.value * (1.0f / 360.0f), // 色相偏移 将范围从[-180, 180]转换到[-0.5, 0.5]
            saturation.value * 0.01f + 1.0f); // 饱和度 将范围从[-100, 100]转换到[0, 2]
        m_Material.SetVector(m_ColorAdjustmentsId, colorAdjustmentsVector4);
        m_Material.SetColor(m_ColorFilterId, colorFilter.value);

        //设置keyword
        SetKeyWord(ExposureKeyword, postExposure.value != 0.0f);
        SetKeyWord(ContrastKeyword, contrast.value != 0.0f);
        SetKeyWord(HueShiftKeyword, hueShift.value != 0.0f);
        SetKeyWord(SaturationKeyword, saturation.value != 0.0f);
        SetKeyWord(ColorFilterKeyword, colorFilter.value != Color.white);
        
        //将src RTHandle blit到dest RTHandle
        Blitter.BlitCameraTexture(cmd, source, destination, m_Material,0);
    }

    private void SetKeyWord(string keyword, bool enabled = true)
    {
        if (enabled)
        {
            m_Material.EnableKeyword(keyword);
        }
        else
        {
            m_Material.DisableKeyword(keyword);
        }
    }

    public override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        CoreUtils.Destroy(m_Material);
    }
}
```

### ColorAdjustment. shader

```c
using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

[VolumeComponentMenu("Custom Post-processing/Color Blit")]
public class ColorBlitPass : CustomPostProcessing
{
    public ClampedFloatParameter intensity = new ClampedFloatParameter(0f, 0f, 1f);
    
    public Material m_Material;
    private const string m_ShaderName = "CustomPostProcessing/ColorBlit";
    
    
    public override CustomPostProcessingInjectionPoint InjectionPoint => CustomPostProcessingInjectionPoint.BeforeRenderingPostProcessing;
    
    public override int OrderInInjectionPoint => 0;
    
    public override bool IsActive() => m_Material != null && intensity.value > 0f;
    
    public override void Setup()
    {
        if (m_Material == null)
        {
            m_Material = CoreUtils.CreateEngineMaterial(m_ShaderName);
        }
    }
    
    public override void Render(CommandBuffer cmd, ref RenderingData renderingData, RTHandle source, RTHandle destination)
    {
        if(m_Material == null)
            return;
        m_Material.SetFloat("_Intensity", intensity.value);
        Blitter.BlitCameraTexture(cmd, source, destination, m_Material,0);
        
    }
    
    public override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        CoreUtils.Destroy(m_Material);
    }

    
}
```



