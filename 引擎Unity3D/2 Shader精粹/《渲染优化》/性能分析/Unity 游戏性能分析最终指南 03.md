[Unity](https://so.csdn.net/so/search?q=Unity&spm=1001.2101.3001.7020) 中有两种分析内存的方法：

*   Memory Profiler ：内置的分析器，提供内存使用的基本信息。
*   Memory Profiler package：将 package 添加到项目中，更详细地分析内存使用情况。可以存储和比较快照查找内存泄漏，查看内存布局以查找内存碎片问题。

### 确定物理 RAM 限制

每个目标平台都有一个内存限制，以此为应用程序设置一个内存预算。使用内存分析器查看捕获的快照。硬件资源（下图）显示 RAM 和 VRAM 的大小。这个数字不是基于真实统计的，不是所有空间都可用于使用，它只提供了一个基准数字。

![](https://img-blog.csdnimg.cn/img_convert/03264f1f601a4f86912f9b89a8574961.png)

### 为每个目标平台的确定最低支持规格

为每个平台确定 RAM 最低规格的硬件，来指导内存预算。请记住，并不是所有的物理内存都可用。考虑使用一个百分比（例如 80%）来进行[内存分配](https://so.csdn.net/so/search?q=%E5%86%85%E5%AD%98%E5%88%86%E9%85%8D&spm=1001.2101.3001.7020)。对于移动平台，还可以考虑将规格分成多个层次，以支持高端设备获得更好的品质。

## 内存分析器模块的简单和详细视图

内存分析器模块提供两个视图：简单视图和详细视图。使用简单视图获得内存使用情况的总览图。必要时，切换到详细视图进行深入分析。

![](https://img-blog.csdnimg.cn/img_convert/67db629690f51688495f7ab821d969e0.png)

使用内存分析器快速收集与资源和场景对象内存分配相关的信息

### 简单视图

Total Used Memory 是 Unity 跟踪的总内存，不包括 Unity 保留的内存（Total Reserved Memory）。系统使用内存是操作系统认为应用程序正在使用的内存。如果此数字始终显示为 0，这表示 Profiler 计数器在当前正在分析的平台上没有实现。在这种情况下，最好依赖 Total Reserved Memory。同时建议切换到本平台的分析工具以获取详细的内存信息。

### 详细视图

如果要查看可执行文件、DLL 和 [Mono](https://so.csdn.net/so/search?q=Mono&spm=1001.2101.3001.7020) 虚拟机使用了多少内存，逐帧查看内存数据是不够的。使用详细快照来深入分析内存分布。

![](https://img-blog.csdnimg.cn/img_convert/a25f3534f4780c133bffb06ba251cdaf.png)

使用捕获的样本分析详细信息，例如可执行文件和 DLL 的内存使用情况

## 使用 Memory Profiler package 进行深入分析

Memory Profiler package 可用于进行更详细的内存分析。使用它来存储和比较快照，以查找内存泄漏或查看内存布局以找到优化方向。 Memory Profiler package 的一个巨大优势是，除了捕获本机对象，它还允许查看托管内存，保存和比较快照，并以更详细的方式浏览内存，以可视化内存使用情况。

![](https://img-blog.csdnimg.cn/img_convert/e133c0ff30838518956c42038a26e1e9.png)

Memory Profiler 主视图

另外，也可以使用内存分析器模块中的详细视图来深入了解内存树，找出使用最多内存的内容。

![](https://img-blog.csdnimg.cn/img_convert/a7d069e5ff7b3f00dedb567d0289781e.png)

内存分析器的许多功能已被 Memory Profiler package 取代，但仍然可以使用它辅助内存分析。 例如：

*   查找 GC 分配
*   快速查看堆的使用 / 保留大小（较新版本的内存分析器）
*   着色器内存分析（较新版本的内存分析器）

在分析内存时需要考虑以下一些要点：

质量级别、图形层和 AssetBundle 变量等设置可能在高端设备上具有不同的内存使用情况。例如：

*   质量级别和图形设置可能会影响 shadow map 的 RenderTextures 的大小。
*   分辨率缩放可能会影响屏幕缓冲大小、RenderTextures 和后处理效果。
*   纹理质量设置可能会影响所有纹理的大小。
*   最大 LOD 可能会影响模型等。
*   如果您有类似于高清（High Definition）和标准（Standard Definition）版本的 AssetBundle 变量，并根据设备规格选择使用，也可能会获得不同的资源大小。
*   目标设备的屏幕分辨率将影响用于后处理效果的 RenderTextures 的大小。
*   设备的图形 API 可能会影响着色器的大小，这取决于 API 对其变体的支持情况。