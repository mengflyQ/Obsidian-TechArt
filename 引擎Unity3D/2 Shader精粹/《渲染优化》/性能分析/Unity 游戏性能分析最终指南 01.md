性能分析[工作流](https://so.csdn.net/so/search?q=%E5%B7%A5%E4%BD%9C%E6%B5%81&spm=1001.2101.3001.7020)对于游戏开发是 “必备” 的，从基本的三方面开始：

*   在修改之前分析：建立基准线
*   在开发过程中分析：确保修改不会影响性能
*   在修改后分析：证明修改产生了预期效果

分析工具是开发者的实用工具之一，可以帮助开发者定位代码中的内存问题和性能瓶颈，也能帮助了解 [Unity](https://so.csdn.net/so/search?q=Unity&spm=1001.2101.3001.7020) 引擎底层的运行。

Unity 提供了多种分析工具，用于在 Editor 和目标设备上分析代码。建议使用各目标平台 (例如 Arm，Apple，PlayStation 和 Xbox 等) 自己的原生分析工具。

## 理解 Unity 中的分析工作

Unity 的分析工具可在 Editor 和 Package Manager 中获得：

*   Unity Profiler：在 Editor 中，或连接到设备上，分析游戏的性能。
*   Profiling Core package：提供 API，可以向 Unity Profile 捕获添加上下文信息。
*   Memory Profiler：提供深入内存性能分析。
*   Profile Analyzer：比较两个分析数据集，分析修改对性能的影响。

### 采样法分析 vs 仪表法分析

游戏性能分析通常采用：

*   采样法分析
*   仪表法分析

采样法分析是收集游戏运行时的统计数据并进行分析。

采样法分析器每 n 纳秒检测一次调用堆栈，并利用堆栈信息查明函数的调用时机（由哪些函数调用），以及持续时间。在这种分析方法中，提高采样率频率会提高准确性，但是会带来更高的开销。

### 仪表法分析

仪表法分析通过添加 Profiler makers 来 “仪表化” 代码，记录每个标记中的代码执行的详细时间信息。该分析器为每个标记捕获一系列 Begin 和 End 事件。这种方法不会丢失任何信息，但是需要按顺序放置标记，以便捕获数据。

Unity Profiler 通过在多数 Unity API 接口设置标记，在重要原生函数和脚本代码间的调用进行了仪表化，捕获最重要的 “概括信息”。也支持添加自定义 Profiler makers 进一步深入分析。

深层分析会自动在每个脚本方法调用中插入 Begin 和 End 标记，包括 C# Getter 和 Setter 属性。该系统在脚本侧提供了完整的分析细节，但也带来了相应的开销，根据在捕获的分析范围内调用次数的多少，也会让分析报告的时间产生膨胀。

### Unity 中的仪表化分析

如上所述，脚本代码调用（默认进行了仪表化）通常包括从 Unity 原生代码到托管代码的第一个调用堆栈。例如 MonoBehaviour 的常见方法：Start、Update、FixedUpdate 等。

![](https://img-blog.csdnimg.cn/img_convert/fa24ef27a2317e8ae521dd60e7bb7af1.png)

分析一个示例脚本，显示了 Update() 方法调用 Unity 的 Instantiate() 方法

在 Profiler 中，还可以看到 Unity API 回调的脚本代码的子采样。值得注意的是，涉及的 Unity API 代码需要具有自身的 Profiler markers。大多数带有性能开销的 Unity API 都进行了仪表化。例如 Camera.main 会导致在捕获的分析数据中出现 FindMainCamera 标记。在检查捕获的数据集时，了解不同 marker 的含义非常重要。请使用常用 Profiler markers 列表来了解更多信息。

![](https://img-blog.csdnimg.cn/img_convert/b659d87e3f4ccc798d916744445fb114.png)

使用 Camera.main 会在捕获分析数据中出现 FindMainCamera 标记。

### 使用 Profiler markers 增加分析详细信息

默认情况下，Profiler 会分析 Profiler markers 中包含代码的时间开销。在代码的关键函数中手动插入 Profiler markers 可增加详细信息而不产生全部的深层分析开销。

### Profiler 模块

分析器以每帧性能指标为基础，帮助找到瓶颈。通过使用分析器中包含的 Profiler 模块，如 CPU Usage, GPU, Rendering, Memory, Physics 等，深入了解细节。

![](https://img-blog.csdnimg.cn/img_convert/4f42258a03c483a0d4b59f3e91ffcf2b.png)

Profiler 窗口主视图，左侧显示模块，底部显示详细信息。

Profiler 窗口在视图底部面板中列出了当前分析器模块捕获的详细信息。例如，CPU usage 模块显示 CPU 工作的 timeline 或 hierarchy 视图，以及具体的时间。

![](https://img-blog.csdnimg.cn/img_convert/6d16b448bfa65748b77797b3acc61bdf.png)

CPU usage 模块的 timeline 视图，显示主线程和渲染线程的标记详细信息。

默认情况下，分析器将连接到 Unity Editor player 实例。

在 Editor 中进行分析和对独立构建分析的性能差异很大。将 Profiler 连接到目标设备上的独立构建是更好的选择，这样可以获得更准确的结果，而不受 Editor 开销的影响。