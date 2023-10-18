本节将深入探讨 Unity 中各个分析工具和调试工具的功能。

以下是分析工具、调试工具和静态分析工具之间的差异：

*   分析工具对代码执行情况进行仪表化显示并收集时间数据。
*   调试工具允许逐步执行程序，暂停和检查值，并提供许多其他高级功能。例如，Frame Debugger 可以逐步执行帧渲染，检查着色器值等。
*   静态分析器可以将源代码或其他资源作为输入，并使用内置规则对输入进行 “正确性” 推理，而无需运行项目。

## 分析工具

Unity Profiler 可以在运行时分析性能瓶颈，并更好地了解特定帧或时间点所发生的情况。

Unity Profiler 可以提供大量的分析标记数据。请注意，在 Editor 中直接进行分析会增加额外开销并影响结果。

只启用关注的 Profiler 模块或使用 Standalone Profiler，以提供更纯净的分析数据，降低分析开销。按照经验，启用 CPU、Memory 和 Renderer 模块总是有用的；然后根据需要启用其他 Profiler 模块，例如 Audio 和 Physics。

### 开始 Unity 性能分析

按照以下步骤开始使用 Unity Profiler：

*   在进行分析时，必须使用开发版本。File > Build Settings > Development Build。
*   勾选 Autoconnect Profile（可选）。
*   注意：Autoconnect Profile 会增加初始启动时间。如果不启用 Autoconnect Profiler，可以随时手动连接正在运行的开发版本。
*   针对目标平台进行构建。
*   通过 Window > Analysis > Profiler 打开 Unity Profiler。
*   禁用不关注的 Profiler 模块。每个启用的分析模块都会带来性能开销。（可以使用 Profiler.CollectGlobalStats 标记观察一些开销。）
*   禁用设备的移动网络，保持 WiFi 开启。
*   在目标设备上运行构建版本。
*   如果选择 Autoconnect Profiler，那么构建版本中将会嵌入 Editor 所在机器的 IP 地址。启动应用时，它将尝试直接连接到此 IP 的 Profiler。Profiler 将自动连接并开始显示帧和分析信息。
*   没有选择 Autoconnect Profiler，则需要使用 “Target Selection” 下拉菜单手动连接。

![[68f34453578687919c51cc202bef59ba_MD5.png]]

Profiler 与目标设备自动连接时

为了节省构建时间（牺牲部分准确性），对 Editor 中运行的应用程序直接分析。在 Profiler 窗口中，从 Attach to Player 下拉菜单中选择 Playmode。

![[bdb06ef018c8de7add993f2e8a66da5e_MD5.png]]

使用 Profiler 分析 Playmode 下运行的游戏

## 分析提示

### 在 CPU Usage 中禁用 VSync

CPU 主线程在等待 VSync 时处于空闲状态。但是隐藏标记有时会使人难以理解其他类别时间的组成，甚至无法理解当前帧总时间的组成。

考虑到这一点，重新排序显示列表，使 VSync 标记位于顶部。这样可以降低 VSync 标记的干扰降，使整体画面更清晰。

### 在构建中禁用 VSync

通过 Edit > Project Settings，然后选择 Quality ，设置 VSync Count 为 Don't Sync。

发布 development 版本，并连接到 Profiler。游戏不再等待下一个 VBlank，而是在一帧完成后立即开始下一帧。禁用 VSync 可能会在某些平台上产生视觉撕裂（这种情况下，为 release 版本重新启用 VSync）。

### 什么时候在 Playmode 或 Editor 下分析

使用 Profiler 时，可以选择 Playmode、Editor、远程或附加设备作为目标。将 Editor 下分析，对分析的准确性有很大影响。因为 Profiler 实际上也递归地对分析了自己本身。

然而当 Editor 的性能变差时，分析 Editor 就非常就有价值了，可以后续分析影响 Editor 性能的脚本和扩展。

### 分析 Editor 的一些示例

*   按下 Play 按钮后进入 Play 模式需要很长时间
*   Editor 变得缓慢或无响应
*   项目打开需要很长时间。文章 [Tips for working more effectively with the Asset Database](https://link.zhihu.com/?target=https%3A//blog.unity.com/technology/tips-for-working-more-effectively-with-the-asset-database%3Futm_source%3Ddemand-gen%26utm_medium%3Dpdf%26utm_campaign%3Dprofiling-for-performance%26utm_content%3Dthe-ultimate-guide-to-profiling-ebook "Tips for working more effectively with the Asset Database") 介绍了如何使用 -profiler-enable 命令行。

### 使用 Standalone Profiler

当在 Editor 下分析时，Standalone Profiler 将作为一个新的进程启动。这避免了 Profiler UI 和 Editor 对时间统计的影响，以获得更干净的分析数据。

![[caf143f4cb191195f039849457466191_MD5.png]]

### 在 Editor 中分析并快速迭代

如果在构建包中发现性能问题，可以先在 Editor 中验证是否存在相同问题。如果存在问题，在 Editor 中定位并快速解决。一旦问题解决，再去目标设备上运行以验证解决方案。

这种优化过工作流程，可以不必先花费时间构建部署，而是先在 Editor 中快速迭代，再使用分析工具验证优化结果。

### Frame Debugger

Frame Debugger 在运行时允许暂停在指定帧，以查看渲染该帧的 draw call 信息。与其他帧调试工具相比，Frame Debugger 的一个优势是，如果 draw call 对应于某个 GameObject ，则该对象在 Hierarchy 面板中会突出显示。Frame Debugger 也可以用于测试 overdraw。

![[54f81912ad567abd90d9482fbcfd8cae_MD5.png]]

使用 Frame Debugger 分析 overdraw

从 Window > Analysis > Frame Debugger 菜单中打开 Frame Debugge。 在编辑器中或设备上运行应用程序时，单击 Enable。应用程序将会暂停，并在帧调试窗口的左侧按顺序列出当前帧的所有 draw call。还包括如帧缓冲清除事件等详细信息。

![[779703be01c3807de4208183645fd84d_MD5.png]]

Frame Debugger 在左侧列出 draw call 和 event，并提供一个滑块，可以逐帧显示。

右侧的面板提供了 draw call 的详细信息，例如几何细节和 shader。其他信息还包括 draw call 无法与之前合批的原因，以及输入到 shader 的属性值。

![[1e43937bbdda7a6b351d9556ac2ccc84_MD5.png]]

选中一个 draw call，详细信息区域中显示 shader，不能合批的原因，shader 属性值。

除了 shader 属性值，ShaderProperties 部分还会显示它在哪些阶段中被使用（例如 vertex, fragment, geometry,hull, domain）。

![[c98390e5e2e3d8e850ddb1ea6030a077_MD5.png]]

着色器阶段会在 ShaderProperties 详细信息区域中显示

### 远程到 Frame Debug

在支持的平台上（WebGL 不支持），可以远程连接到 Frame Debug。

设置远程帧调试：

*   创建目标平台的标准构建。
*   运行播放器。
*   从 Editor 中打开 Frame Debugger。
*   单击 Player 下拉列表，选择正在运行的目标。
*   单击 Enable。

![[e70bf1127be8db1e40e611c2f02ee6a2_MD5.png]]

Frame Debugger 窗口远程连接到构建

### Render target 显示选项

Frame Debug 窗口有一个工具栏，可以独立显示 Game 视图的 R、G、B、A 通道。使用 channel 按钮右侧的 Levels 滑块，按照亮度级别显示。当存在多个渲染目标时，可以使用 RenderTarget 下拉列表选择在 Game 视图中显示的渲染目标。

![[f51230bfa3558d5c42742f08afc89cf7_MD5.png]]

下拉列表还有一个 Depth 选项，用于显示深度缓冲区的内容。

![[b29f5adb02255966dcfa0821a04c7e14_MD5.png]]

显示深度缓冲区内容

### 5 个常见染优化技巧

首先定位性能瓶颈。主流平台都提供了分析 CPU 和 GPU 性能的工具。例如，Arm/Mali GPU，可以使用 Arm Mobile Studio；Microsoft Xbox，可以使用 PIX；Sony PlayStation，可以使用 Razor；Apple iOS，可以使用 Xcode Instruments。

1.draw call 优化

降低 draw call 批次的技术包括：遮挡剔除；GPU 实例化；SRP 合批

2. 减少 overdraw，优化填充率

overdraw 表明应用程序试图在每帧内绘制比 GPU 处理能力更多的像素。这不仅会影响性能，还会影响移动设备的热量和电池寿命。可以通过了解 Unity 在渲染对象之前如何对它们进行排序来解决过度绘制问题。

内置渲染管线根据对象的 Rendering Mode 和 renderQueue 进行排序。每个对象的着色器将其放入一个渲染队列中，通常决定其绘制顺序。

相互重叠的对象会产生过度绘制。如果正在使用内置渲染管线，请使用 Scene viewcontrol 来可视化 overdraw。将绘制模式切换为 Overdraw。

![[fb496f69c0bb061abeb6b2958783c521_MD5.png]]

亮色像素表示对象重叠绘制，而暗色像素表示重叠绘制较少

![[ab90cd4fc3eab1e26295cb240ce17b6d_MD5.png]]

标准视图

![[ef2fb5b4e2af5908c7acbac56cd432d8_MD5.png]]

Overdraw 视图

3. 检查消耗性能的着色器

4. 渲染的多线程优化

5. 分析后处理效果

### Profile Analyzer

Unity Profiler 可以进行单帧分析，但是 Profile Analyzer 可以聚合显示一组 Unity Profiler 帧捕获的分析标记数据。

开始使用 Profile Analyzer：通过 Window> Package Manager 安装 Profile Analyzer 包。

在使用 Profile Analyzer 时，一个好的方法是保存分析会话，在性能优化工作之前和之后进行比较。

![[e67ffb4b71197998f76cd0242e03200e_MD5.png]]

Profile Analyzer 会提取在 Unity Profiler 中捕获的一组帧，对它们进行统计分析。然后显示这些数据，为每个函数生成性能时间信息，例如最小值、最大值、平均值和中位数时间。 在开发过程中，它可以帮助解决和优化问题。将其用于游戏场景的 A/B 测试以查看性能差异，在较重构和优化代码前后分析数据，以及升级新功能或 Unity 版本前后使用。

![[a21fc95519252336ccb78e67c61b794d_MD5.png]]

在 Profile Analyzer 的 Single view 中使用总计数据也可以找到随时间变化的性能问题。

![[3f2b3ab3a403e5262e3da162c4b45571_MD5.png]]

Profile Analyzer 主窗口视图

Profile Analyzer 具有多种视图和分析性能数据的方式，它提供不同的面板用于选择、排序、查看和比较一组性能分析数据。

Frame Control 面板用于选择一帧或一组帧。选择后，Marker Details 面板将更新，以显示所选范围的数据，包含统计信息的排序列表。Marker Summary 面板显示选定标记的详细信息。列表中的每个标记都是该标记在所选帧范围内，跨所有筛选线程实例的聚合。

![[463cdf28e1b42fdd6a74b44ada3379ca_MD5.png]]

Marker Summary 面板显示 Marker Details 面板中选择的每个 Marker 集合的详细信息。

使用 Name Filter，或 Thread 进行筛选。当查看 Time 或 Count 统计值的范围选择时，这非常有用。

![[1843113c583b39ed87e3e5ca31dbbb0d_MD5.png]]

按线程或标记名称进行筛选，以便在 Marker details 面板中关注特定的性能数据。

调整 Filters 时，Marker details 面板可以自定义地显示分析数据的不同信息集。使用 Marker column 下拉菜单选择预设选项，或自定义选项。

![[9bf4351d701cae0a2df0f871148d7f4b_MD5.png]]

使用 Marker column 的预设选项自定义 Marker details 面板显示的统计信息。

这些预设选项包括：

*   Time and count：显示 markers 平均计时和调用次数的信息
*   Time：显示 markers 的平均计时信息
*   Totals: 显示 markers 对整个数据集所需的总时间信息
*   Time with totals：同时显示 markers 的平均计时和总时间信息
*   Count totals: 显示 markers 被调用的总次数信息
*   Count per frame: 显示 markers 每帧被调用的平均总次数信息
*   Depths: 显示 markers 在层次结构中的位置信息
*   Threads: 显示 markers 所在的线程名称信息。

### Profile Analyzer 视图

Single 视图

Single 视图显示单个捕获数据集的信息。使用它来分析每一帧 profile markers 的执行情况。该视图分为几个面板，其中包含每帧、每个线程和每个标记的计时信息（最小值、最大值、中位值、平均值）。

![[5072d04454cf7795bbac12858352ad8d_MD5.png]]

Single 视图显示单个或一组帧的 profile marker 统计信息和计时信息

Profile Analyzer 使用提示

*   通过选择 Depth level 为 4，可以深入到用户脚本中（忽略 Unity Engine API）。在 Unity Profiler timeline 模式下查看，您可以对调用堆栈深度进行相关分析： Monobehaviour 脚本将以蓝色出现，并在第四个级别下。
*   以同样的方式过滤 Unity 其他部分，例如 animators 或 engine physics。
*   在 Frame Summary 部分的右侧，可以找到突出显示的方法性能范围直方图。将鼠标悬停在最耗时帧上，获取可以点击的链接，从而查看 Unity Profiler 中的帧选择。使用此视图来分析导致该帧消耗时间的因素。

Compare 视图

Compare 视图是 Profile Analyzer 真正发挥作用的地方。在此视图中，您可以加载两个数据集，Profile Analyzer 将以两种不同的颜色分别显示两个数据集。

通过 “拉取数据” 方法将配置文件会话数据加载到 Profile Analyzer 中：

*   通过 Window > Analysis > Profile Analyzer 打开 Profile Analyzer。
*   使用 Unity Profiler 捕获数据。
*   在 Profile Analyzer 中，切换到对比页签，然后单击第一个 “Pull Data” 按钮加载来自 Profiler 的捕获数据。
*   在代码和性能改进之后，使用 Unity Profiler 再次捕获数据。
*   单击第二个 “Pull Data” 按钮加载新的捕获数据。

注意：如果选择加载选项，则数据必须采用 Profile Analyzer 的. pdata 文件格式。如果拥有 Profiler 的. data 格式的文件，请先在 Profiler 中打开它，然后单击 Profile Analyzer 中的 Pull Data 按钮。（确保在拉取数据之前保存 Profiler 的. data 文件）

使用 Marker Comparison 查看第一组和第二组数据集（左侧和右侧）之间的计时差异。

![[95fead692b9186f2d467739ba6100b23_MD5.png]]

调整 Marker Columns filter 会相应地更改要进行比较的值。

### 比较 Median Frame 和 Longest Frame

在单个捕获数据中比较 Median Frame 和 Longest Frame，找到在 Longest Frame 中出现，在 Median Frame 中没出现的事情，或查看哪些操作超过了平均完成时长。

打开 Profile Analyzer 的 Compare 视图，在左右两侧加载同一个数据集。也可以在 Single 视图中加载数据集，然后切换到 Compare 视图。

右键点击上侧的 Frame Control 图，选择 Select Median Frame。右键点击下侧 Frame Control 图，选择 Select Longest Frame。

Profile Analyzer 的 Marker 比较面板将更新显示差异。

![[ee34438f02850e1706b9b3557b7b4843_MD5.png]]

比较单个捕获数据中的 Median Frame 和 Longest Frame

一个技巧是，在比较数据时将 Frame Control 图按帧时间排序（右键单击 > Order By Frame Duration），然后在每个集合中选择一个范围来进行比较。

![[63fe21175539241682296b0e7129a882_MD5.png]]

按照持续时间排序并选择范围