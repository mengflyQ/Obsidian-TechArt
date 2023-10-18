


从历史上看，图形加速始于在与三角形重叠的每条像素扫描线上插入颜色，然后显示这些值。其中包括访问图像数据的功能，可以将纹理应用于表面。其中还添加了用于内插（interpolating）和测试 z 深度的硬件，提供了内置的可见性检查。由于它们的频繁使用，因此将此类过程用于专用硬件以提高性能。连续几代硬件中添加了渲染管线的更多部分，以及每个部分的更多功能。专用图形硬件相对于 CPU 的唯一计算优势是速度，但速度至关重要。

在过去的二十年中，图形硬件经历了不可思议的转变。1999 年，第一款包含硬件顶点处理的消费者图形芯片（NVIDIA 的 GeForce 256）问世。NVIDIA 创造了图形处理单元（GPU，Graphics [Processing](https://so.csdn.net/so/search?q=Processing&spm=1001.2101.3001.7020) Unit）一词，以将 GeForce 256 与以前可用的仅光栅化芯片区分开来，并且它一直坚持下去。在接下来的几年中，GPU 从复杂的固定功能管道的可配置实现发展到高度可编程的空白状态，开发人员可以在其中实现自己的算法。各种可编程着色器是控制 GPU 的主要方法。为了提高效率，管线的某些部分仍然是可配置的，而不是可编程的，但是趋势是朝着可编程性和灵活性的方向发展 **[175]**。

GPU 通过专注于一组高度可并行化的任务而获得了卓越的速度。他们拥有专门的定制芯片，可以专用于实现 z 缓冲区、快速访问纹理图像和其他缓冲区、查找例如三角形覆盖的像素。这些部件如何执行其功能将在第 23 章中介绍。更重要的是要早点知道 GPU 如何实现其可编程着色器的并行性。

3.3 节介绍了着色器的功能。目前，您需要知道的是着色器核心是一个小型处理器，可以执行一些相对隔离的任务，例如将顶点从其在世界坐标转换为屏幕坐标，或者计算被三角形覆盖的像素的颜色 。每帧有成千上万个三角形发送到屏幕，每秒可能有数十亿次着色器调用（shader invocations），即运行着色器程序的单独实例。

首先，延迟（latency）是所有处理器都面临的问题。访问数据需要花费一些时间。考虑延迟长短的一种基本方法是，信息所处位置离处理器越远，等待时间就越长。第 23.3 节详细介绍了延迟。存储在存储芯片中的信息将比本地寄存器中的信息花费更长的时间。18.4.1 节将更深入地讨论内存访问。关键是等待数据检索意味着处理器停滞了，这降低了性能。

**引用：**

**[175]** Blythe, David, “The Direct3D 10 System,” ACM Transactions on Graphics, vol. 25, no. 3, pp. 724–734, July 2006. Cited on p. 29, 39, 42, 47, 48, 50, 249

## **3.1 数据并行架构 Data-Parallel Architectures**

不同的处理器体系结构使用各种策略来避免停顿。对 CPU 进行了优化，以处理各种数据结构和大型代码库。CPU 可以具有多个处理器，但是每个 CPU 都以串行方式运行代码，有限的 SIMD 向量处理是次要的例外。为了最大程度地减少延迟的影响，CPU 的许多芯片都由快速本地缓存组成，这些缓存中填充了下一步可能需要的数据。CPU 还通过使用诸如分支预测（branch prediction），指令重新排序（instruction reordering），寄存器重命名（register renaming）和缓存预取（cache prefetching ）之类的巧妙技术来避免停顿。**[715]**

GPU 采用不同的方法。GPU 的大部分芯片区域专用于称为着色器核心（shader cores）的大量处理器，通常数量多达数千个。GPU 是流处理器，其中依次处理相似数据的有序集合。由于这种相似性（例如，一组顶点或像素），GPU 可以大规模并行地处理这些数据。另一个重要的部分是这些调用要尽可能地独立，这样它们就不需要来自相邻调用的信息，并且不共享可写的存储位置。有时我们会打破该规则以允许新的功能，但是此类例外的代价是潜在的延迟，因为一个处理器可能会等待另一个处理器完成其工作。

GPU 针对吞吐量（throughput）进行了优化，吞吐量定义为可以处理数据的最大速率。但是，这种快速处理具有成本。由于专用于高速缓存存储器和控制逻辑的芯片面积较小，因此每个着色器内核的等待时间通常比 CPU 处理器遇到的等待时间长得多 **[462]**。

假设网格已光栅化，并且两千个像素具有要处理的片元（fragments）；像素着色器程序将被调用 2000 次。想象只有一个着色器处理器，这是世界上最弱的 GPU。它开始为 2000 的第一个片元执行着色器程序。着色器处理器对寄存器中的值执行一些算术运算。寄存器是本地的，可以快速访问，因此不会发生停顿。然后，着色器处理器会执行一条指令，例如纹理访问； 例如，对于给定的表面位置，程序需要知道应用于网格的图像的像素颜色。纹理是一个完全独立的资源，而不是像素程序本地内存的一部分，并且纹理访问可能会涉及到一定程度。内存提取可能需要数百到数千个时钟周期，在此期间 GPU 处理器不执行任何操作。此时，着色器处理器将停止运行，等待纹理的颜色值返回。

为了使这个糟糕的 GPU 变得更好，我们为每个片元提供一些用于其本地寄存器的存储空间。现在，允许着色器处理器切换并执行另一个片元，即两千个第二个片元，而不是停止纹理获取。此切换速度非常快，除了注意第一条指令正在执行哪条指令之外，第一段或第二段中的内容均不受影响。现在执行第二个片元。与第一个相同，执行一些算术函数，然后再次遇到纹理获取。着色器核心现在切换到另一个片元，即第三个片元。最终，所有两千个片元都以这种方式处理。此时，着色器处理器将返回片元编号一。此时，纹理颜色已被获取并且可以使用，因此着色器程序可以继续执行。处理器以相同的方式进行处理，直到遇到另一个已知会暂停执行的指令，或者程序完成。与着色器处理器（shader processor）始终专注于一个片元相比，执行单个片元所需的时间更长，但是整个片元的总体执行时间将大大减少。

在这种架构中，通过切换到另一个片元使 GPU 保持忙碌来隐藏延迟。GPU 通过将指令执行逻辑与数据分离开来，使该设计更进一步。称为单指令多数据（SIMD，single instruction, multiple data）的这种安排可以在固定数量的着色器程序上以锁定步骤执行同一命令。SIMD 的优点是，与使用单独的逻辑和调度单元运行每个程序相比，用于处理数据和交换的硅（和功率）要少得多。将我们的 2000 片元示例转换为现代 GPU 术语，每个片元的像素着色器调用都称为线程。这种类型的线程与 CPU 线程不同。它由用于着色器输入值的一点内存以及着色器执行所需的任何寄存器空间组成。使用相同着色器程序的线程被分为几组，被 NVIDIA 称为 warp，被 AMD 称为 wavefronts。一个 warp/wavefront 被 计划用于 SIMD 处理，由 8 至 64 之间的任意数量的 GPU 着色器内核执行。每个线程都映射到 SIMD 通道。

假设我们有两千个线程要执行。NVIDIA GPU 的 warps 包含 32 个线程。这将产生 2000/32 = 62.5 个 warps，这意味着分配了 63 个 warps，其中一个 warps 是一半为空。warp 的执行类似于我们的单个 GPU 处理器示例。着色器程序在所有 32 个处理器上以固定步骤执行。因为对所有线程执行相同的指令，遇到内存提取时，所有线程都会同时遇到它。提取信号表明线程 warp 将停止，所有线程都在等待它们的（不同的）结果。此时不会停顿，而是将 warp 换成 32 个线程的另一个 warp，然后由 32 个内核执行。这种交换的速度与我们的单处理器系统一样快，因为在将 warp 换入或换出时，每个线程内的数据都不会被触及。每个线程都有自己的寄存器，每个 warp 都跟踪其正在执行的指令。交换新线程只是将一组核心指向另一组要执行的线程即可。没有其他开销。warp 执行或换出，直到全部完成。参见图 3.1。

![[1685518870308.png]]

_图 3.1。简化的着色器执行示例。三角形片元（称为线程，threads）被收集成 warps。每个 warp 显示为四个线程，但实际上有 32 个线程。要执行的着色器程序长五个指令。四个 GPU 着色器处理器的集合在第一次 warp 时执行这些指令，直到在 “txr” 命令上检测到停顿条件为止，这需要时间来获取其数据。交换第二个 warp，并对其应用着色器程序的前三个指令，直到再次检测到停顿为止。交换第三个 warp 并使其停止后，通过交换第一个 warp 并继续执行。如果此时尚未返回其 “txr” 命令的数据，则执行将真正停止，直到这些数据可用为止。每个 warp 依次完成。_

_（注：寄存器占据越多 ，warps 越少，tex 操作会导致 warps 切换，如果单个 SM 的  warps 切换完了 ,tex 还没做完的话就会造成等待，当然这个不一定，在低端机上可能会，中高端可能不会，我们并不清楚这个具体耗时哪个更快，但是我们能从 shader code 上去避免这个。实际操作下来不断的 tex 操作，确实会造成性能灾难性降低，所以在中间插入其他计算，相比只有单个 tex 操作， 然后每个 warps 只执行  tex 然后就立即切换下一个 warps ，或许能减少造成的延迟。）_

在我们的简单示例中，纹理获取内存的等待时间可能导致 warp 掉出。实际上，因为交换成本非常低，所以可以将 warp 换成较短的延迟。还有其他几种用于优化执行的技术 **[945]**，但 warp 交换（warp-swapping）是所有 GPU 使用的主要延迟隐藏机制。此过程的效率如何涉及多个因素。例如，如果线程很少，那么几乎不会创建任何 warp，从而使延迟隐藏成为问题。

着色器程序的结构是影响效率的重要特征。一个主要因素是每个线程使用的寄存器数量。在我们的示例中，我们假设一次可以将 2000 个线程全部驻留在 GPU 上。与每个线程相关联的着色器程序所需的寄存器越多，则线程中可以驻留的线程越少，因此 warp 也就越少。warps 不足可能意味着无法通过交换来减轻失速。驻留的 warps 被称为 “飞行中”（in flight），这个数字称为占用率（occupancy）。高占用率意味着有许多可用于处理的 warp，因此空闲处理器的可能性较小。占用率低通常会导致性能不佳。内存提取的频率也影响需要多少延迟隐藏。Lauritzen **[993]** 概述了着色器使用的寄存器数量和共享内存如何影响占用率。Wronski **[1911，1914]** 讨论了理想的占用率如何根据着色器执行的操作类型而变化。

影响整体效率的另一个因素是由 “if” 语句和循环引起的动态分支。假设在着色器程序中遇到 “if” 语句。如果所有线程求值并采用同一分支，则 warp 可以继续进行而不必担心其他分支。但是，如果某些线程甚至一个线程采用了替代路径，那么 warp 必须执行两个分支，从而丢弃每个特定线程不需要的结果 **[530，945]**。这个问题称为线程发散（thread divergence），其中一些线程可能需要执行循环迭代或执行 warp 中其他线程不执行的 “if” 路径，从而使它们在此期间处于空闲状态。

所有 GPU 都实现了这些架构思想，从而导致系统具有严格的限制，但每瓦（watt）的计算能力却很大。了解该系统的运行方式将有助于您作为程序员充分利用其提供的功能。在以下各节中，我们讨论 GPU 如何实现渲染管线，可编程着色器如何运行以及每个 GPU 阶段的演变和功能。

**引用：**

**[715]** Hennessy, John L., and David A. Patterson, Computer Architecture: A Quantitative Approach, Fifth Edition, Morgan Kaufmann, 2011. Cited on p. 12, 30, 783, 789, 867, 1007, 1040

**[462]** Fatahalian, Kayvon, and Randy Bryant, Parallel Computer Architecture and Programming course, Carnegie Mellon University, Spring 2017. Cited on p. 30, 55

**[945]** Kubisch, Christoph, “Life of a Triangle—NVIDIA’s Logical Pipeline,” NVIDIA GameWorks blog, Mar. 16, 2015. Cited on p. 32

**[993]** Lauritzen, Andrew, “Future Directions for Compute-for-Graphics,” SIGGRAPH Open Problems in Real-Time Rendering course, Aug. 2017. Cited on p. 32, 812, 908

**[1911]** Wronski, Bartlomiej, “Assassin’s Creed: Black Flag—Road to Next-Gen Graphics,” Game Developers Conference, Mar. 2014. Cited on p. 32, 218, 478, 571, 572, 801

**[1914]** Wronski, Bartlomiej, “GCN—Two Ways of Latency Hiding and Wave Occupancy,” Bart Wronski blog, Mar. 27, 2014. Cited on p. 32, 801, 1005

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040

**[945]** Kubisch, Christoph, “Life of a Triangle—NVIDIA’s Logical Pipeline,” NVIDIA GameWorks blog, Mar. 16, 2015. Cited on p. 32

## **3.2 GPU 管线概述 GPU Pipeline Overview**

GPU 实现了第 2 章中描述的概念如几何处理，光栅化和像素处理管线阶段。这些阶段分为几个硬件阶段，这些阶段具有不同程度的可配置性或可编程性。图 3.2 显示了根据各个阶段的可编程性或可配置性对其进行颜色编码的各个阶段。请注意，这些物理阶段的划分与第二章中介绍的功能阶段有所不同。

![[1685518870342.png]]

_图 3.2。渲染管线的 GPU 实现。这些阶段根据用户对其操作的控制程度进行颜色编码。绿色阶段是完全可编程的。虚线表示可选阶段。黄色阶段是可配置的，但不是可编程的，例如，可以为合并阶段设置各种混合模式。蓝色阶段的功能完全固定。_

我们在这里描述了 GPU 的逻辑模型（logical model）www，它是由 API 作为程序员向您公开的逻辑模型。正如第 18 和 23 章所讨论的那样，此逻辑管线（物理模型）的实现取决于硬件供应商。通过将命令添加到相邻的可编程阶段，可以在 GPU 上执行逻辑模型中固定功能的阶段。流水线中的单个程序可以分为由单独的子单元执行的元素，也可以由单独的遍历完全执行。逻辑模型可以帮助您推断出哪些因素会影响性能，但不要误以为这是 GPU 实际实现管线的方式。

顶点着色器（vertex shader）是一个完全可编程的阶段，用于实现几何处理阶段。几何着色器是一个完全可编程的阶段，可在图元的顶点（点，线或三角形）上运行。它可用于执行每个图元的着色操作，销毁图元或创建新的图元。曲面细分和几何着色器都是可选的，并非所有 GPU 都支持它们，尤其是在移动设备上。

裁剪，三角形设置和三角形遍历阶段由固定功能硬件实现。屏幕映射受窗口和视口设置的影响，在内部形成简单的比例并重新定位。像素着色器阶段是完全可编程的。尽管合并阶段不是可编程的，但它是高度可配置的，可以设置为执行多种操作。它实现了 “合并” 功能阶段，负责修改颜色，z 缓冲区，混合，模板和任何其他与输出相关的缓冲区。像素着色器的执行与合并阶段一起构成了第 2 章中介绍的概念性像素处理阶段。

随着时间的流逝，GPU 管道已从硬编码操作演变为增加灵活性和控制能力。可编程着色器阶段的引入是这一发展过程中最重要的一步。下一节将介绍各个可编程阶段的通用功能。

## **3.3 可编程着色器阶段 The Programmable Shader Stage**

现代着色器程序使用统一的着色器设计。这意味着与顶点，像素，几何和曲面细分相关的着色器共享一个公共的编程模型。在内部，它们具有相同的指令集体系结构（ISA，instruction set architecture）。实现此模型的处理器在 DirectX 中称为 “通用着色器核心”（common-shader core），据说具有此类核心的 GPU 具有统一的着色器体系结构。这种架构背后的想法是，着色器处理器可以在各种角色中使用，GPU 可以根据需要分配它们。例如，与每个由两个三角形组成的大正方形相比，一组带有小三角形的网格将需要更多的顶点着色器处理。具有单独的顶点和像素着色器核心池的 GPU 意味着严格确定了使所有核心繁忙的理想工作分配。使用统一的着色器核心，GPU 可以决定如何平衡此负载。

描述整个着色器编程模型已经超出了本书的范围，并且已经有许多文档，书籍和网站。着色器使用类似 C 的着色语言（shading languages）进行编程，例如 DirectX 的高级着色语言（HLSL，High-Level Shading Language）和 OpenGL 着色语言（GLSL，OpenGL Shading Language）。DirectX 的 HLSL 可以编译为虚拟机字节码，也称为中间语言（IL 或 DXIL），以提供硬件独立性。中间表示还可以允许着色器程序被编译和离线存储。驱动程序将此中间语言转换为特定 GPU 的 ISA。控制台编程通常避免中间语言步骤，因为那时只有一个 ISA 用于系统。

基本数据类型是 32 位单精度浮点标量和向量，尽管向量只是着色器代码的一部分，并且如上所述在硬件中不受支持。在现代 GPU 上，本机还支持 32 位整数和 64 位浮点数。浮点向量通常包含位置（xyzw），法线，矩阵行，颜色（rgba）或纹理坐标（uvwq）等数据。整数最常用于表示计数器，索引或位掩码。还支持聚合数据类型（Aggregate data types），例如结构，数组和矩阵。

一次 Draw Call 调用图形 API 来绘制一组图元（primitives），从而使图形管线执行并运行其着色器（shaders）。每个可编程着色器阶段都有两种类型的输入：统一输入（uniform inputs），其值在整个绘制调用期间保持不变（但可以在绘制调用之间进行更改），以及变化的输入（varying inputs），即来自三角形顶点或光栅化的数据。例如，像素着色器可以将光源的颜色提供为统一的值，并且三角形表面的位置每像素变化，因此也变化。纹理是一种特殊的统一输入，它曾经总是应用于表面的彩色图像，但现在可以认为是任何大型数据数组。

基础虚拟机（The underlying virtual machine）为不同类型的输入和输出提供特殊的寄存器。用于统一（uniforms）的可用常数寄存器的数量比用于变化（varying）的输入或输出的可用寄存器的数量大得多。发生这种情况是因为需要为每个顶点或像素分别存储变化的输入和输出，因此对于需要多少个输入存在自然的限制。统一输入存储一次，并在绘制调用中的所有顶点或像素之间重复使用。虚拟机还具有用于暂存空间的通用临时寄存器。可以使用临时寄存器中的整数值对所有类型的寄存器进行数组索引。着色器虚拟机的输入和输出如图 3.3 所示。

![[1685518870413.png]]

_图 3.3。Shader Model 4.0 下的统一虚拟机体系结构和寄存器布局。每个资源旁边都会显示最大可用数量。用斜杠分隔的三个数字表示顶点，几何和像素着色器的限制（从左到右）。_

图形计算中常见的操作可在现代 GPU 上高效执行。着色语言通过 * 和 + 等运算符公开了这些运算中最常见的运算（例如加法和乘法）。其余的通过内在函数（intrinsic functions）公开，例如 atan（），sqrt（），log（）以及为 GPU 优化的许多其他函数。对于更复杂的运算，也存在函数，例如向量归一化（vector normalization）和反射（reflection），叉积（cross product），矩阵转置（matrix transpose）和行列式计算（determinant computations）。

术语 “流控制”（flow control）是指使用分支指令来更改代码执行流。与流控制相关的指令用于实现高级语言构造，例如“if” 和“ case”语句，以及各种类型的循环。着色器支持两种类型的流控制。静态流控制（Static flflow control）分支基于统一输入的值。这意味着代码流在绘图调用中是恒定的。静态流控制的主要好处是允许将相同的着色器用于各种不同的情况（例如，不同数量的灯光）。由于所有调用都采用相同的代码路径，因此没有线程差异。动态流控制（Dynamic flflow control）基于变化的输入的值，这意味着每个片段可以不同地执行代码。这比静态流控制功能强大得多，但会降低性能，尤其是在着色器调用之间代码流发生不规则变化时。

不闹情绪了…… 好好学习，拯救世界……

## **3.4 可编程着色和 API 的发展 The Evolution of Programmable Shading and APIs**

可编程着色框架的构想可以追溯到 1984 年，当时库克（Cook）的着色树（shade trees）**[287]**。一个简单的着色器及其相应的着色树如图 3.4 所示。RenderMan 着色语言（The RenderMan Shading Language）**[63，1804]** 是在 1980 年代后期从这个想法发展而来的。如今，它与其他不断发展的规范（例如，开放着色语言（OSL）项目 **[608]**）一起用于电影制作渲染。

![[1685518884809.png]]

_图 3.4。一个简单的铜着色器的着色树及其相应的着色器语言程序。（在库克 **[287]** 之后。）_

消费者级图形硬件最早是 3dfx Interactive 于 1996 年 10 月 1 日成功推出的。今年的时间表请参见图 3.5。他们的 Voodoo 图形卡能够以高品质和高性能来渲染《Quake》游戏，因此很快就被采用。该硬件始终实现了固定功能的流水线。在 GPU 原生支持可编程着色器之前，曾有各种尝试通过多次渲染实时实现可编程着色操作。Quake III：Arena 脚本语言是 1999 年在该领域的首个广泛的商业成功案例。如本章开头所述，NVIDIA 的 GeForce256 是第一个被称为 GPU 的硬件，它不是可编程的（not programmable），但是它是可配置的（configurable）。

![[1685518884833.png]]

_图 3.5。一些 API 和图形硬件版本的时间表。_

在 2001 年初，NVIDIA 的 GeForce 3 是第一个支持可编程顶点着色器 **[1049]** 的 GPU，该着色器通过 DirectX 8.0 和 OpenGL 扩展公开。这些着色器以一种类似于汇编的语言进行编程，该语言被驱动程序即时转换为微代码。像素着色器也包含在 DirectX 8.0 中，但是像素着色器没有达到实际的可编程性——驱动程序将受支持的有限 “程序” 转换为纹理混合状态，然后将其连接到硬件“寄存器组合器”（register combiners）。这些 “程序” 不仅限于长度（不超过 12 条指令），而且缺少重要的功能。通过对 RenderMan 的研究，Peercy 等人确定了相关的纹理读取和浮点数据 **[1363]** 对真正的可编程性是至关重要的，。

着色器此时不允许进行流控制（分支，branching），因此必须通过计算两个项以及在结果之间进行选择或内插（interpolating）来模拟条件选择。DirectX 定义了着色器模型（Shader Model，SM）的概念，以区分具有不同着色器功能的硬件。2002 年，包括 Shader Model 2.0 在内的 DirectX 9.0 发行了，该版本具有真正可编程的顶点和像素着色器。在 OpenGL 下，使用各种扩展功能也公开了类似的功能。添加了对任意依赖的纹理读取的支持以及对 16 位浮点值的存储的支持，最终完成了 Peercy 等人确定的一组要求。诸如指令，纹理和寄存器之类的着色器资源的限制增加了，因此着色器变得能够产生更复杂的效果。还增加了对流控制（flow control）的支持。着色器的长度和复杂性不断增长，使得汇编编程模型变得越来越麻烦。幸运的是，DirectX 9.0 还包含 HLSL 。此着色语言是由 Microsoft 与 NVIDIA 合作开发的。大约在同一时间，OpenGL ARB（架构审查委员会）发布了 GLSL，一种与 OpenGL 非常相似的语言 **[885]**。这些语言在很大程度上受到 C 编程语言的语法和设计理念的影响，其中包括来自 RenderMan 着色语言的元素。

Shader Model 3.0 于 2004 年推出，并添加了动态流控制（Dynamic Flow Control），使着色器功能更加强大。它还将可选功能转变为需求，进一步增加了资源限制，并增加了对顶点着色器中纹理读取的有限支持。当在 2005 年下半年（Microsoft 的 Xbox 360）和 2006 年下半年（Sony Computer Entertainment 的 PLAYSTATION 3 系统）推出新一代游戏机时，它们配备了 Shader Model 3.0 级 GPU。任天堂的 Wii console 是最后一批著名的固定功能 GPU 之一，该 GPU 最初于 2006 年底交付。纯固定功能产品线在这一点上早已消失了。着色器语言已经发展到可以使用各种工具来创建和管理它们的地步。图 3.6 显示了使用库克（Cook）的着色树（Shade Tree）概念的一种此类工具的屏幕截图。

可编程性的下一个重大进步也是在 2006 年底左右。DirectX 10.0 **[175]** 中包含的 Shader Model 4.0 引入了几个主要功能，例如几何体着色器（geometry shader）和流输出（stream output）。Shader Model 4.0 包括适用于所有着色器（顶点，像素和几何图形）的统一编程模型，这是先前描述的统一着色器设计。资源限制进一步增加，并增加了对整数数据类型（包括按位运算）的支持。OpenGL 3.3 中 GLSL 3.30 的引入提供了类似的着色器模型。

![[1685518884874.png]]

_图 3.6。用于着色器设计的可视着色器图形系统。各种操作封装在功能框中，可在左侧选择。选中后，每个功能框都有可调参数，如右图所示。每个功能框的输入和输出相互链接以形成最终结果，如中间框架的右下方所示。（摘自 “心理磨坊”，mental images inc。）_

2009 年发布了 DirectX 11 和 Shader Model 5.0，添加了细分阶段着色器（tessellation stage）和计算着色器（compute shader），也称为 DirectCompute。该版本还专注于更有效地支持 CPU 多处理，这是第 18.5 节中讨论的主题。OpenGL 在 4.0 版中添加了细分，在 4.3 版中添加了计算着色器。DirectX 和 OpenGL 的发展不同。两者都设置了特定版本发行所需的一定级别的硬件支持。Microsoft 控制 DirectX API，因此直接与独立硬件供应商（IHV）（例如 AMD，NVIDIA 和 Intel）以及游戏开发商和计算机辅助设计软件公司合作，以确定要公开的功能。OpenGL 由非营利组织 Khronos Group 管理的硬件和软件供应商联盟开发。由于涉及的公司数量众多，API 功能通常在 DirectX 中引入 OpenGL 之后的一段时间内就会出现。但是，OpenGL 允许特定于供应商的或更广泛的扩展（extensions），这些扩展允许在发行版正式支持之前使用最新的 GPU 功能。

API 的下一个重大变化是由 AMD 在 2013 年推出了 MantleAPI。Mantle 与视频游戏开发商 DICE 合作开发的，其目的是消除大部分图形驱动程序的开销，并将此控件直接交给开发人员。除了这种重构之外，还进一步支持有效的 CPU 多处理。这类新的 API 专注于大大减少 CPU 在驱动程序中花费的时间，以及更有效的 CPU 多处理器支持（第 18 章）。在 Mantle 中开创的创意被 Microsoft 采纳，并在 2015 年以 DirectX 12 的形式发布。请注意，DirectX 12 并不专注于公开新的 GPU 功能 - DirectX 11.3 公开了相同的硬件功能。这两个 API 均可用于将图形发送到虚拟现实系统，例如 Oculus Rift 和 HTC Vive。但是，DirectX 12 是对 API 的彻底重新设计，可以更好地映射到现代 GPU 架构。低开销的驱动程序对于以下应用程序很有用：CPU 驱动程序成本引起瓶颈，或者使用更多 CPU 处理器进行图形处理可能会提高性能 **[946]**。从较早的 API 移植可能很困难，并且天真的实现可能会导致性能降低 **[249、699、1438]**。

苹果于 2014 年发布了自己的低开销 API（称为 Metal）。Metal 首次在 iPhone 5S 和 iPad Air 等移动设备上可用，一年后，可通过 OS X El Capitan 访问较新的 Macin 代码。除效率外，减少 CPU 使用率还可以节省功耗，这是移动设备上的重要因素。该 API 具有自己的着色语言，适用于图形和 GPU 计算程序。

AMD 将其 Mantle 工作捐赠给了 Khronos Group，后者于 2016 年初发布了自己的新 API，名为 Vulkan。与 OpenGL 一样，Vulkan 可在多个操作系统上工作。Vulkan 使用一种称为 SPIR V 的新的高级中间语言，该语言既用于着色器表示又用于常规 GPU 计算。预编译的着色器是可移植的，因此可以在支持所需功能的任何 GPU 上使用 **[885]**。Vulkan 也可以用于非图形 GPU 计算，因为它不需要显示窗口 **[946]**。Vulkan 与其他低开销驱动程序的显着区别是，它旨在与多种系统一起使用，从工作站到移动设备。

在移动设备上，规范是使用 OpenGL ES。“ES” 代表嵌入式系统（Embedded Systems），因为此 API 是为移动设备而开发的。当时的标准 OpenGL 在其某些调用结构中相当庞大且缓慢，并且需要支持很少使用的功能。OpenGL ES 1.0 于 2003 年发布，是 OpenGL 1.3 的简化版本，描述了固定功能的管线。虽然 DirectX 的发布与支持它们的图形硬件的发布是同步的，但是开发针对移动设备的图形支持的方式却并不相同。例如，2010 年发布的第一台 iPad 实施了 OpenGL ES 1.1。OpenGL ES 2.0 规范于 2007 年发布，提供了可编程的着色（programmable shading）。它基于 OpenGL 2.0，但没有固定功能组件，因此与 OpenGL ES 1.1 不向后兼容。OpenGL ES 3.0 于 2012 年发布，提供了多个渲染目标，纹理压缩，变换反馈，实例化以及更广泛的纹理格式和模式等功能，并改进了着色器语言。OpenGL ES 3.1 添加了计算着色器，而 3.2 添加了几何和曲面细分着色器，以及其他功能。第 23 章将更详细地讨论移动设备架构。

OpenGL ES 的一个分支是基于浏览器的 API WebGL，可通过 JavaScript 调用。该 API 的第一版发布于 2011 年，可在大多数移动设备上使用，因为它的功能等效于 OpenGL ES 2.0。与 OpenGL 一样，扩展允许访问更高级的 GPU 功能。WebGL 2 假定支持 OpenGL ES 3.0。

WebGL 特别适合在教室中试用功能或使用：  
• 它是跨平台的，可在所有个人计算机和几乎所有移动设备上使用。  
• 驱动程序批准由浏览器处理。即使一个浏览器不支持特定的 GPU 或扩展，通常另一个浏览器也支持。  
• 代码被解释而不是编译，并且仅需要文本编辑器即可进行开发。  
• 大多数浏览器都内置了调试器，可以检查在任何网站上运行的代码。  
• 可以通过将程序上传到网站或 Github 来进行部署。

更高级别的场景图形和效果库（例如 three.js **[218]**）使您可以轻松访问代码，以获取各种更复杂的效果，例如着色算法（shadow algorithms），后处理效果（post-[processing](https://so.csdn.net/so/search?q=processing&spm=1001.2101.3001.7020) effects），基于物理的着色（physically based shading）和延迟渲染（deferred rendering）。

**引用：**

**[287]** Cook, Robert L., “Shade Trees,” Computer Graphics (SIGGRAPH ’84 Proceedings), vol. 18, no. 3, pp. 223–231, July 1984. Cited on p. 37, 765  
**[63]** Apodaca, Anthony A., and Larry Gritz, Advanced RenderMan: Creating CGI for Motion Pictures, Morgan Kaufmann, 1999. Cited on p. 37, 909  
**[1804]** Upstill, S., The RenderMan Companion: A Programmer’s Guide to Realistic Computer Graphics, Addison-Wesley, 1990. Cited on p. 37  
**[608]** Gritz, Larry, ed., “Open Shading Language 1.9: Language Specification,” Sony Pictures Imageworks Inc., 2017. Cited on p. 37  
**[1049]** Lindholm, Erik, Mark Kilgard, and Henry Moreton, “A User-Programmable Vertex Engine,” in SIGGRAPH ’01 Proceedings of the 28th Annual Conference on Computer Graphics and Interactive Techniques, ACM, pp. 149–158, Aug. 2001. Cited on p. 15, 38  
**[1363]** Peercy, Mark S., Marc Olano, John Airey, and P. Jeffrey Ungar, “Interactive Multi-Pass Programmable Shading,” in SIGGRAPH ’00: Proceedings of the 27th Annual Conference on Computer Graphics and Interactive Techniques, ACM Press/Addison-Wesley Publishing Co., pp. 425–432, July 2000. Cited on p. 38  
**[885]** Kessenich, John, Graham Sellers, and Dave Shreiner, OpenGL Programming Guide: The Of-ficial Guide to Learning OpenGL, Version 4.5 with SPIR-V, Ninth Edition, Addison-Wesley, 2016. Cited on p. 27, 39, 41, 55, 96, 173, 174  
**[175]** Blythe, David, “The Direct3D 10 System,” ACM Transactions on Graphics, vol. 25, no. 3, pp. 724–734, July 2006. Cited on p. 29, 39, 42, 47, 48, 50, 249  
**[946]** Kubisch, Christoph, “Transitioning from OpenGL to Vulkan,” NVIDIA GameWorks blog, Feb. 11, 2016. Cited on p. 40, 41, 796, 814  
**[249]** Chajdas, Matth¨aus G., “D3D12 and Vulkan: Lessons Learned,” Game Developers Conference, Mar. 2016. Cited on p. 40, 806, 814  
**[699]** Hector, Tobias, “Vulkan: High Efficiency on Mobile,” Imagination Blog, Nov. 5, 2015. Cited on p. 40, 794, 814  
**[1438]** Pranckeviˇcius, Aras, “Porting Unity to New APIs,” SIGGRAPH An Overview of Next Generation APIs course, Aug. 2015. Cited on p. 40, 806, 814  
**[885]** Kessenich, John, Graham Sellers, and Dave Shreiner, OpenGL Programming Guide: The Of-ficial Guide to Learning OpenGL, Version 4.5 with SPIR-V, Ninth Edition, Addison-Wesley, 2016. Cited on p. 27, 39, 41, 55, 96, 173, 174  
**[946]** Kubisch, Christoph, “Transitioning from OpenGL to Vulkan,” NVIDIA GameWorks blog, Feb. 11, 2016. Cited on p. 40, 41, 796, 814  
**[218]** Cabello, Ricardo, et al., Three.js source code, Release r89, Dec. 2017. Cited on p. 41, 50, 115, 189, 201, 407, 485, 552, 628  
**[175]** Blythe, David, “The Direct3D 10 System,” ACM Transactions on Graphics, vol. 25, no. 3, pp. 724–734, July 2006. Cited on p. 29, 39, 42, 47, 48, 50, 249  
**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[1208]** Microsoft, “Direct3D 11 Graphics,” Windows Dev Center. Cited on p. 42, 233, 525

## **3.5 顶点着色器 The Vertex Shader**

顶点着色器是图 3.2 所示功能管线中的第一阶段。虽然这是直接在程序员控制下的第一阶段，但值得注意的是，一些数据操作在此阶段之前发生。在 DirectX 所谓的输入汇编器 **[175、530、1208]** 中，可以将几个数据流编织在一起，以形成沿管线发送的一组顶点和图元。例如，一个对象可以由一个位置阵列和一个颜色阵列表示。输入汇编器将通过创建具有位置和颜色的顶点来创建此对象的三角形（或直线或点）。第二个对象可以使用相同的位置数组（以及不同的模型转换矩阵）和不同的颜色数组表示。数据表示将在 16.4.5 节中详细讨论。输入汇编器中也支持执行实例化。这允许一个对象被绘制多次，每个实例具有一些不同的数据，所有这些都可以通过一个绘制调用进行。第 18.4.2 节介绍了实例化的使用。

三角形网格由一组顶点表示，每个顶点与模型表面上的特定位置相关联。除了位置之外，每个顶点还有其他可选属性，例如颜色或纹理坐标。曲面法线也定义在网格顶点上，这似乎是一个奇怪的选择。从数学上讲，每个三角形都有一个定义明确的表面法线，直接将三角形的法线用于着色似乎更有意义。但是，渲染时，通常使用三角形网格来表示基础曲面，而使用顶点法线来表示该表面的方向，而不是三角形网格本身的方向。16.3.4 节将讨论计算顶点法线的方法。图 3.7 显示了两个三角形网格的侧视图，这些三角形网格代表曲面，一个是平滑的，另一个是带有锐利折痕的三角形。

![[1685518884921.png]]

_图 3.7。三角形曲面（黑色，具有顶点法线）的侧视图，代表曲面（红色）。在左侧，平滑的顶点法线用于表示平滑表面。在右侧，中间顶点已被复制并指定了两个法线，表示折痕。_

顶点着色器是处理三角形网格的第一阶段。描述顶点形成什么的数据对于顶点着色器是不可用的。顾名思义，它专门处理传入的顶点。顶点着色器提供了一种修改、创建或忽略与每个三角形的顶点关联的值的方法，例如其颜色、法线、纹理坐标和位置。通常，顶点着色器程序会将顶点从模型空间转换为齐次裁剪空间（homogeneous clip space）（第 4.7 节）。顶点着色器至少必须始终输出此位置。

顶点着色器与前面描述的统一着色器（unifified shader）几乎相同。传入的每个顶点都由顶点着色器程序处理，该程序然后输出在三角形或直线上内插的多个值。顶点着色器既不能创建也不能破坏顶点，并且一个顶点生成的结果不能传递到另一个顶点。由于每个顶点都是独立处理的，因此可以将 GPU 上任意数量的着色器处理器并行应用于传入的顶点流。

输入汇编通常表示为在执行顶点着色器之前发生的过程。这是一个物理模型通常与逻辑模型不同的例子。从物理上讲，获取数据以创建顶点的操作可能发生在顶点着色器中，并且驱动程序将悄悄地为每个着色器添加适当的指令，这些指令对于程序员是不可见的。

接下来的章节介绍了几种顶点着色器效果，例如用于动画关节的顶点混合和轮廓渲染。顶点着色器的其他用途包括：

• 对象生成，通过仅创建一次网格并使其由顶点着色器变形即可。  
• 使用蒙皮和变形技术对角色的身体和面部进行动画处理。  
• 程序变形，例如旗帜，布料或水的移动 **[802、943]**。  
• 通过发送退化的（degenerate）（无区域）网格沿管线生成粒子，并根据需要为其分配区域。  
• 通过将整个帧缓冲区的内容用作屏幕对齐的网格上的纹理，镜头变形，热雾，水波纹，页面卷曲和其他效果会发生程序变形。  
• 通过使用顶点纹理获取 **[40，1227]** 应用地形高度场（terrain height fields）。

使用顶点着色器完成的一些变形如图 3.8 所示。

顶点着色器的输出可以通过几种不同的方式使用。然后为每个实例的图元（例如三角形）生成常用路径，并对其进行光栅化，生成的各个像素片元将发送到像素着色器程序以进行继续处理。在某些 GPU 上，数据也可以发送到细分阶段或几何着色器，或存储在内存中。以下各节将讨论这些可选阶段。

![[1685518884945.png]]

_图 3.8。左边是一个普通的茶壶。由顶点着色器程序执行的简单剪切操作将生成中间图像。在右侧，噪声函数会创建一个使模型失真的字段。（图像由 FX Composer 2 制作，由 NVIDIA Corporation 提供。）_

**引用：**

**[802]** Isidoro, John, Alex Vlachos, and Chris Brennan, “Rendering Ocean Water,” in Wolfgang Engel, ed., Direct3D ShaderX: Vertex & Pixel Shader Tips and Techniques, Wordware, pp. 347– 356, May 2002. Cited on p. 43  
**[943]** Kryachko, Yuri, “Using Vertex Texture Displacement for Realistic Water Rendering,” in Matt Pharr, ed., GPU Gems 2, Addison-Wesley, pp. 283–294, 2005. Cited on p. 43  
**[40]** Andersson, Johan, “Terrain Rendering in Frostbite Using Procedural Shader Splatting,” SIGGRAPH Advanced Real-Time Rendering in 3D Graphics and Games course, Aug. 2007. Cited on p. 43, 175, 218, 877, 878  
**[1227]** Mittring, Martin, “Finding Next Gen—CryEngine 2,” SIGGRAPH Advanced Real-Time Rendering in 3D Graphics and Games course, Aug. 2007. Cited on p. 43, 195, 239, 242, 255, 457, 476, 559, 856, 860, 861

## **3.6 曲面细分阶段 The Tessellation Stage**

细分阶段允许我们渲染曲面。GPU 的任务是获取每个表面描述，并将其变成一组代表性的三角形。此阶段是可选的 GPU 功能，该功能首先在 DirectX 11 中可用（并且是 DirectX 11 所必需的）。OpenGL4.0 和 OpenGL ES 3.2 也支持该功能。

使用细分阶段有几个优点。曲面描述通常比提供相应的三角形本身更紧凑。除了节省内存外，此功能还可以防止 CPU 和 GPU 之间的总线成为形状变化的动画角色或对象的瓶颈。通过为给定视图生成适当数量的三角形，可以有效地渲染表面。例如，如果一个球远离相机，则仅需要几个三角形。近距离观察时，最好用数千个三角形来表示。这种控制细节水平的能力还可以使应用程序控制其性能，例如，在较弱的 GPU 上使用较低质量的网格以保持帧速率。通常用平坦表面表示的模型可以转换为三角形的细网格，然后根据需要进行变形 **[1493]**，或者可以对其进行细分，以便更不频繁地执行昂贵的着色计算 **[225]**。

细分阶段始终由三个元素组成。使用 DirectX 的术语，它们是外壳着色器（hull shader），细分（tessellator）和域着色器（domain shader）。在 OpenGL 中，外壳着色器是曲面细分控制着色器（the tessellation control shader），而域着色器是曲面细分评估着色器（tessellation evaluation shader），虽然详细，但更具描述性。固定功能细分器（fixed-function tessellator）在 OpenGL 中称为原始生成器（primitive generator），并且可以看到，确实是它的功能。

在第 17 章中详细讨论了如何指定和细分曲面和曲线。在这里，我们简要概述了每个细分阶段的目的。首先，外壳着色器的输入是一个特殊的补丁图元（patch primitive）。它由几个控制点组成，这些控制点定义了细分曲面，B'ezier 面片或其他类型的弯曲元素。外壳着色器具有两个功能。首先，它告诉细分器应生成多少个三角形以及采用哪种配置。其次，它对每个控制点执行处理。同样，可选地，外壳着色器可以修改传入的补丁描述，根据需要添加或删除控制点。外壳着色器将其控制点集以及细分控制数据放到域着色器中。参见图 3.9。

![[1685518884991.png]]

_图 3.9。细分阶段。外壳着色器采用由控制点定义的补丁。它将细分因子（tessellation factors, TFs）和类型发送给固定功能细分器。控制点集由外壳着色器根据需要进行转换，并与 TF 和相关的修补程序常量一起发送到域着色器。曲面细分对象将创建一组顶点及其重心坐标。然后由域着色器对其进行处理，从而生成三角形网格（显示控制点以供参考）。_

曲面细分是管线中的固定功能阶段，仅与曲面细分着色器一起使用。它的任务是为域着色器添加多个新顶点以进行处理。外壳着色器向细分器发送有关所需细分曲面类型的信息：三角形，四边形或等值线（isoline）。等值线是线带（line strips）的集合，有时用于毛发渲染 **[1954]**。外壳着色器发送的其他重要值是细分因子（OpenGL 中的细分级别，tessellation levels）。它们有两种类型：内边缘和外边缘。这两个内部因素决定了三角形或四边形内部发生了多少细分。外部因素决定每个外部边缘被分割多少（第 17.6 节）。图 3.10 显示了增加细分因子的示例。通过允许使用单独的控件，我们可以使相邻曲面的边缘在细分中匹配，而无论内部如何细分。匹配的边缘可避免在补丁相遇之处出现裂缝或其他着色瑕疵。顶点被分配了重心坐标（barycentric coordinates）（第 22.8 节），这些值指定了所需表面上每个点的相对位置。

外壳着色器始终输出补丁，一组控制点位置。但是，它可以通过向细分器发送零或更低（或非数字，NaN）的外部细分级别（outer tessellation level）来发出信号，表示将要丢弃补丁。否则，细分器将生成网格并将其发送到域着色器。域着色器的每次调用都使用来自外壳着色器的曲面的控制点，以计算每个顶点的输出值。域着色器具有类似于顶点着色器的数据流模式，来自细分细分器的每个输入顶点都经过处理并生成相应的输出顶点。然后将形成的三角形沿管道向下传递。

尽管此系统听起来很复杂，但我们是为提高效率而采用这种结构的，并且这样的话，每个着色器可能都非常简单。传递到外壳着色器中的补丁程序通常很少或根本不做修改。该着色器还可以使用补丁的估计距离或屏幕大小来动态计算细分因子，就像地形渲染一样 **[466]**。或者，外壳着色器可以简单地为应用程序计算和提供的所有补丁程序传递一组固定的值。细分器执行一个涉及但固定功能的过程，生成顶点，为其指定位置并指定它们形成的三角形或直线。此数据放大步骤是在着色器外部执行的，以提高计算效率 **[530]**。域着色器采用为每个点生成的重心坐标，并在补丁的评估方程式中使用这些坐标，以生成位置，法线，纹理坐标以及所需的其他顶点信息。有关示例，请参见图 3.11。

![[1685518885029.png]]

_图 3.11。左边是大约 6000 个三角形的基础网格。在右侧，使用 PN 三角形细分 来细分每个三角形并进行置换。（图像由 NVIDIA 公司提供，来自 NVIDIA SDK 11 **[1301]** 的示例，由 4A Games 提供的 Metro 2033 型号。）_

![[1685518885071.png]]

_图 3.12。几何着色器程序的几何着色器输入为某些单一类型：点，线段，三角形。最右边的两个图元包括与直线和三角形对象相邻的顶点。另外，更精细的补丁类型是可做到的。_

**引用：**

**[225]** Cantlay, Iain, and Andrei Tatarinov, “From Terrain to Godrays: Better Use of DX11,” Game Developers Conference, Mar. 2014. Cited on p. 44, 569  
**[1954]** Yuksel, Cem, and Sara Tariq, SIGGRAPH Advanced Techniques in Real-Time Hair Rendering and Simulation course, July 2010. Cited on p. 45, 642, 646, 649  
**[466]** Fernandes, Ant´onio Ramires, and Bruno Oliveira, “GPU Tessellation: We Still Have a LOD of Terrain to Cover,” in Patrick Cozzi & Christophe Riccio, eds., OpenGL Insights, CRC Press, pp. 145–161, 2012. Cited on p. 46, 879  
**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[1301]** NVIDIA SDK 11, https://developer.nvidia.com/dx11-samples. Cited on p. 46, 55, 150

赶在 2019 结束之前把第三章结束，提前祝大家新年快乐！

![[1685518897107.png]]

## 3.7 几何[着色器](https://so.csdn.net/so/search?q=%E7%9D%80%E8%89%B2%E5%99%A8&spm=1001.2101.3001.7020) The Geometry Shader

几何着色器可以将图元转换为其他图元，而这在细分阶段是无法完成的。例如，可以通过让每个三角形创建线边缘，将三角形网格转换为线框视图。或者，可以将这些线替换为面向观察者的四边形，从而使线框渲染的边缘更粗 **[1492]**。几何着色器是在 2006 年底随 DirectX 10 发行版添加到硬件加速的图形管道中的。它位于管道中的细分着色器之后，并且可以选择使用。虽然是 [Shader](https://so.csdn.net/so/search?q=Shader&spm=1001.2101.3001.7020) Model 4.0 的必需部分，但在较早的着色器模型中未使用它。OpenGL 3.2 和 OpenGL ES 3.2 也支持这种类型的着色器。

几何着色器的输入是单个对象及其关联的顶点。对象通常由带状（strip），线段（line segment）或点（point）构成的三角形所组成。扩展的图元可以由几何着色器定义和处理。特别是，可以传入三角形外部的三个附加顶点，并且可以使用折线上的两个相邻顶点。参见图 3.12。使用 DirectX 11 和 Shader Model 5.0，你可以传入多达 32 个控制点的更精细的补丁程序。也就是说，细分阶段对于补丁生成更有效 **[175]**。

几何着色器处理该图元并输出零个或多个顶点，这些顶点被视为点（points），折线（polylines）或三角形带（triangles）。请注意，几何着色器根本无法生成任何输出。通过这种方式，可以通过编辑顶点，添加新图元以及删除其他图元来选择性地修改网格。

几何着色器设计用于修改传入的数据或制作有限数量的副本（copies）。例如，一种用途是生成六个转换后的数据副本，以同时渲染立方体贴图的六个面； 参见第 10.4.3 节。它也可以用来有效地创建级联的阴影贴图（cascaded shadow maps），以生成高质量的阴影。利用几何着色器的其他算法包括从点数据创建尺寸可变的粒子，沿着轮廓拉伸鳍（fins）以进行毛发渲染以及为着色算法找到对象边缘。有关更多示例，请参见图 3.13。这些和其他用途将在本书的其余部分中讨论。

![[1685518897154.png]]

_图 3.13。几何着色器（GS）的某些用途。左侧图，使用 GS 快速进行元球等值面细分。中间图，使用 GS 完成线段的分形细分并将其输出，而 GS 生成广告牌以显示闪电效果。右侧图，通过使用流输出的顶点和几何着色器执行布料模拟。（图片来自 NVIDIA SDK 10 [1300] 示例，由 NVIDIA Corporation 提供。）_

DirectX 11 增加了几何着色器使用实例化的功能，其中几何着色器可以在任何给定的图元上运行设定的次数 **[530，1971]**。在 OpenGL 4.0 中，这是通过调用计数指定的。几何着色器最多也可以输出四个流。可以在渲染管道上发送一个流以进行进一步处理。所有这些流都可以选择发送到流输出渲染目标。

保证几何着色器以与输入相同的顺序从图元输出结果。这会影响性能，因为如果多个着色器内核并行运行，则必须保存和排序结果。此因素和其他因素不利于在单个调用中用于复制或创建大量几何图形的几何着色器 **[175，530]**。

发出绘制调用后，管线中只有三个位置可以在 GPU 上创建工作：光栅化，细分阶段和几何体着色器。其中，考虑到所需的资源和内存，几何着色器的行为是最不可预测的，因为它是完全可编程的。实际上，几何着色器通常用得很少，因为它无法很好地映射到 GPU 的优势。在某些移动设备上，它是通过软件实现的，因此在此强烈建议不要使用它 **[69]**。

**引用：**

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040

**[1971]** Zink, Jason, Matt Pettineo, and Jack Hoxley, Practical Rendering & Computation with Direct3D 11, CRC Press, 2011. Cited on p. 47, 54, 90, 518, 519, 520, 568, 795, 813, 814, 914

**[175]** Blythe, David, “The Direct3D 10 System,” ACM Transactions on Graphics, vol. 25, no. 3, pp. 724–734, July 2006. Cited on p. 29, 39, 42, 47, 48, 50, 249

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040

**[69]** ARM Limited, “ARM R MaliTMApplication Developer Best Practices, Version 1.0,” ARM documentation, Feb. 27, 2017. Cited on p. 48, 798, 1029

### **3.7.1 流输出 Stream Output**

GPU 管线的标准使用方法是通过顶点着色器发送数据，然后光栅化生成三角形并在像素着色器中进行处理。在以前，数据总是通过管线传递，而中间结果无法访问。流输出（stream output）的想法是在 Shader Model 4.0 中引入的。在顶点着色器（以及可选的细分和几何着色器）处理了顶点之后，除了可以发送到光栅化阶段之外，还可以将它们输出到流（即有序数组）中。实际上，光栅化可以完全关闭，然后将流水线纯粹用作非图形流处理器。可以将通过这种方式处理的数据通过管线发送回去，从而允许进行迭代处理。如第 13.8 节所述，这种类型的操作可用于模拟流水或其他粒子效果。它也可以用于为模型蒙皮，然后使这些顶点可重复使用（第 4.4 节）。

流输出仅以浮点数的形式返回数据，因此可能会产生明显的内存开销。流输出在图元上起作用，而不是在顶点上起作用。如果沿管线发送网格，则每个三角形将生成自己的三个输出顶点集。原始网格中共享的所有顶点都将丢失。因此，更典型的用法是仅通过管线将顶点发送为点集图元（point set primitive）。在 OpenGL 中，流输出阶段称为变换反馈（transform feedback），因为它的大部分使用重点是变换顶点并将其返回以进行进一步处理。保证按输入顺序将基元发送到流输出目标，这意味着将保持顶点顺序 **[530]**。

**引用：**

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040

## **3.8 像素着色器 The Pixel Shader**

顶点，曲面细分和几何体着色器执行完操作后，便会裁剪并设置图元以进行光栅化，如上一章所述。流水线的这一部分在其处理步骤中是相对固定的，即，不是可编程的，而是有些可配置的。遍历每个三角形以确定其覆盖哪些像素。光栅化器还可以粗略计算出三角形覆盖每个像素的像元（pixel’s cell）区域的数量（第 5.4.2 节）。部分或完全重叠像素的三角形称为片元（fragment）。

三角形顶点的值（包括 z 缓冲区中使用的 z 值）将在每个像素的三角形表面上插值。这些值将传递到像素着色器，然后由该着色器处理片元。在 OpenGL 中，像素着色器称为片元着色器，这也许是一个更好的名称。为了保证一致性，我们在本书中始终使用 “像素着色器”。沿管线发送的点和线图元也会为所覆盖的像素创建片元。

跨整个三角形执行的插值类型由像素着色器程序指定。通常，我们使用透视校正内插法（perspective-correct interpolation），以便像素表面位置之间的世界空间距离随着对象后退距离的增加而增加。一个示例是渲染延伸到地平线的铁轨。铁轨在铁轨较远的地方间距更近，因为每个接近地平线的连续像素行进的距离都更大。其他插值选项也可用，例如屏幕空间插值，其中不考虑透视投影。DirectX 11 进一步控制何时以及如何执行插值 **[530]**。

![[1685518897248.png]]

_图 3.14。用户定义的裁剪平面。左侧图为单个水平裁剪平面将对象切片。中间图为嵌套球被三个平面修剪。右侧图为仅当球体的曲面在所有三个剪切平面的外部时，才对其进行裁剪。（来自 Three.js 示例中的 webgl 裁剪和 webgl 裁剪交集 **[218]**。）_

用编程术语来说，顶点着色器程序的输出（插在三角形（或线）上）实际上成为像素着色器程序的输入。随着 GPU 的发展，其他输入也已公开。例如，片元的屏幕位置可用于 Shader Model 3.0 及更高版本中的像素着色器。同样，三角形的哪一侧可见是输入标志。该知识对于一次通过每个三角形的正面和背面渲染不同的材质非常重要。

有了输入，通常像素着色器会计算并输出片元的颜色。它还可能会产生不透明度值（opacity value），并可以选择修改其 z 深度。在合并期间，这些值用于修改存储在像素处的内容。光栅化阶段生成的深度值也可以由像素着色器修改。模板缓冲区值通常是不可修改的，而是传递到合并阶段。DirectX 11.3 允许着色器更改此值。雾计算和 alpha 测试等操作已从 SM 4.0 中的合并操作变为像素着色器计算 **[175]**。

像素着色器还具有丢弃传入片元（即不生成任何输出）的独特功能。图 3.14 显示了如何使用片元丢弃的一个示例。裁剪平面功能以前是固定功能管道中的可配置元素，后来在顶点着色器中指定。有了片元丢弃功能之后，就可以用像素着色器中所需的任何方式来实现此功能，例如确定裁剪量应进行 “与” 运算还是 “或” 运算。

最初，像素着色器只能输出到合并阶段，以进行最终显示。随着时间的推移，像素着色器可以执行的指令数量已大大增加。这种增加引起了多个渲染目标（multiple render targets，MRT）的想法。不仅可以将像素着色器程序的结果仅发送到颜色和 z 缓冲区，还可以为每个片元生成多组值并将其保存到不同的缓冲区，每个缓冲区称为渲染目标（render target）。渲染目标通常具有相同的 x 和 y 维度； 一些 API 允许使用不同的大小，但是渲染区域将是其中最小的。一些架构要求渲染目标必须具有相同的位深，甚至可能具有相同的数据格式。取决于 GPU，可用的渲染目标数量为四个或八个。

即使有这些限制，MRT 功能还是更有效地执行渲染算法的有力辅助。一次渲染过程可以在一个目标中生成彩色图像，在另一个目标中生成对象标识符，在第三个目标中生成世界空间距离。此功能还引起了另一种类型的渲染管线，称为延迟着色（deferred shading），其中可见性和着色是在单独的通道（passes）中完成的。第一遍存储有关每个像素处对象位置和材质的数据。然后，连续通过可以有效地施加照明和其他效果。此类渲染方法在第 20.1 节中进行了描述。

像素着色器的局限性在于，它通常只能在传递给目标的片元位置上写入渲染目标，而不能从相邻像素读取当前结果。也就是说，执行像素着色器程序时，它无法将其输出直接发送到相邻像素，也无法访问其他人的最新更改。而是，它计算仅影响其自身像素的结果。但是，此限制并不像听起来那样严重。一次通过创建的输出图像可以让像素着色器在后续通过中访问其任何数据。相邻像素可使用第 12.1 节中所述的图像处理技术进行处理。

像素着色器无法知道或影响相邻像素的结果的规则是有例外的。一种是像素着色器可以在计算梯度或导数信息时立即访问相邻片元的信息（尽管是间接的）。像素着色器具有沿 x 和 y 屏幕轴每像素内插值变化的量。这些值可用于各种计算和纹理寻址。这些梯度对于诸如纹理过滤（第 6.2.2 节）之类的操作尤为重要，因为我们想知道多少图像覆盖了一个像素。所有现代 GPU 都通过以 2×2 为一组处理片元（称为四边形）来实现此功能。当像素着色器请求梯度值时，将返回相邻片元之间的差异。参见图 3.15。统一核心具有访问相邻数据（保留在同一 warp 中的不同线程中）的功能，因此可以计算用于像素着色器的渐变。此实现的一个结果是，无法在受动态流控制影响的着色器的部分中访问渐变信息，即，“if” 语句或具有可变迭代次数的循环。一组中的所有片元都必须使用相同的指令集进行处理，以便所有四个像素的结果对于计算梯度都是有意义的。这是一个基本限制，即使在脱机渲染系统中也存在 **[64]**。

DirectX 11 引入了一种缓冲区类型，该类型允许对任何位置（无序访问视图（unordered access view，UAV））的写访问。最初仅适用于像素和计算着色器，对 UAV 的访问已扩展到 DirectX 11.1 中的所有着色器 **[146]**。OpenGL 4.3 将此称为着色器存储缓冲区对象（shader storage buffffer object，SSBO）。这两个名称以其自己的方式进行描述。像素着色器以任意顺序并行运行，并且此存储缓冲区在它们之间共享。

![[1685518897278.png]]

_图 3.15。在左侧，将三角形栅格化为四边形，每组 2 × 2 像素。然后，在右侧显示了带有黑点标记的像素的梯度计算。针对四边形中四个像素位置的每一个，显示了 v 的值。请注意，三角形中没有覆盖三个像素，但是 GPU 仍对其进行处理，以便可以找到渐变。通过使用左下像素的两个四边形邻居，可以计算出 x 和 y 屏幕方向上的渐变。_

通常需要某种机制来避免数据争用情况（也称为数据危险（data hazard）），在这种情况下，两个着色器程序都在 “竞相” 以影响相同的值，从而可能导致任意结果。例如，如果两次调用像素着色器试图在大约同一时间将其添加到相同的检索值中，则可能会发生错误。两者都将检索原始值，都将在本地对其进行修改，但是，无论哪个调用最后写入其结果，都将抹去另一个调用的作用，只会发生一次添加。GPU 通过使用着色器可以访问的专用原子单元（atomic units）来避免此问题 **[530]**。但是，原子意味着某些着色器可能在等待访问另一个着色器进行读 / 修改 / 写操作的存储位置时停滞。

尽管原子避免了数据危害，但许多算法都需要特定的执行顺序。例如，你可能需要绘制一个更远的透明蓝色三角形，然后再用红色透明三角形覆盖它，将红色混合在蓝色上面。一个像素可能对一个像素进行两次像素着色器调用，每个三角形调用一次，以这样一种方式执行：红色三角形的着色器先于蓝色着色器完成。在标准管线中，片段结果将在合并阶段进行排序，然后再进行处理。在 DirectX 11.3 中引入了光栅化程序顺序视图（Rasterizer order views，ROV）以强制执行顺序。这些就像无人机。着色器可以以相同的方式读取和写入它们。关键区别在于 ROV 保证以正确的顺序访问数据。这大大增加了这些着色器可访问缓冲区的有用性 **[327、328]**。例如，ROV 使像素着色器可以编写自己的混合方法，因为它可以直接访问和写入 ROV 中的任何位置，因此不需要合并阶段 **[176]**。代价是，如果检测到乱序访问，像素着色器调用可能会停顿，直到处理了先前绘制的三角形。

**引用：**

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[218]** Cabello, Ricardo, et al., Three.js source code, Release r89, Dec. 2017. Cited on p. 41, 50, 115, 189, 201, 407, 485, 552, 628  
**[175]** Blythe, David, “The Direct3D 10 System,” ACM Transactions on Graphics, vol. 25, no. 3, pp. 724–734, July 2006. Cited on p. 29, 39, 42, 47, 48, 50, 249  
**[64]** Apodaca, Anthony A., “How PhotoRealistic RenderMan Works,” in Advanced RenderMan: Creating CGI for Motion Pictures, Morgan Kaufmann, Chapter 6, 1999. Also in SIGGRAPH Advanced RenderMan 2: To RI INFINITY and Beyond course, July 2000. Cited on p. 51  
**[146]** Bilodeau, Bill, “Vertex Shader Tricks: New Ways to Use the Vertex Shader to Improve Performance,” Game Developers Conference, Mar. 2014. Cited on p. 51, 87, 514, 568, 571, 798  
**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[327]** Davies, Leigh, “OIT to Volumetric Shadow Mapping, 101 Uses for Raster-Ordered Views Using DirectX 12,” Intel Developer Zone blog, Mar. 5, 2015. Cited on p. 52, 139, 156  
**[328]** Davies, Leigh, “Rasterizer Order Views 101: A Primer,” Intel Developer Zone blog, Aug. 5, 2015. Cited on p. 52, 156  
**[176]** Bookout, David, “Programmable Blend with Pixel Shader Ordering,” Intel Developer Zone blog, Oct. 13, 2015. Cited on p. 52

## **3.9 合并阶段 The Merging Stage**

如第 2.5.2 节所述，合并阶段是将各个片段（在像素着色器中生成）的深度和颜色与帧缓冲区组合在一起的阶段。DirectX 将此阶段称为输出合并（output merger）； OpenGL 将其称为逐样本操作（per-sample operations）。在大多数传统管线图（包括我们自己的管线图）上，此阶段是模板缓冲区（stencil-buffer）和 z 缓冲区（z-buffer）操作发生的地方。如果片元可见，则此阶段中发生的另一种操作是颜色混合。对于不透明的表面，不涉及真正的混合，因为片段的颜色会简单地替换以前存储的颜色。片元和所存储颜色的实际混合通常用于透明度和合成操作（第 5.5 节）。

想象一下，通过光栅化生成的片元通过像素着色器运行，然后在应用 z 缓冲区时被某些先前渲染的片元隐藏。这样就不需要在像素着色器中进行所有处理。为了避免这种浪费，许多 GPU 在执行像素着色器之前执行一些合并测试 **[530]**。片元的 z 深度（以及其他正在使用的东西，例如模板缓冲区或剪刀）用于测试可见性。如果隐藏该片元，则将其剔除。此功能称为 Early-z **[1220，1542]**。像素着色器具有更改片元的 z 深度或完全丢弃片元的能力。如果发现像素着色器程序中存在这两种类型的操作，则通常无法使用 Early-Z ，然后通常将其关闭，这通常会使管线效率降低。DirectX 11 和 OpenGL 4.2 允许像素着色器强制进行 Early-Z 测试，尽管有很多限制 **[530]**。有关早期 z 和其他 z 缓冲区优化的更多信息，请参见第 23.7 节。有效使用 Early-z 会对性能产生很大影响，这将在 18.4.5 节中详细讨论。

合并阶段占据了固定功能阶段（例如三角形设置）和完全可编程着色器阶段之间的中间地带。尽管它不是可编程的，但它的操作是高度可配置的。可以将颜色混合设置为执行大量不同的操作。最常见的是涉及颜色和 Alpha 值的乘法，加法和减法的组合，但是其他操作（例如最小值和最大值）以及按位逻辑运算也是可能的。DirectX 10 添加了将像素着色器中的两种颜色与帧缓冲区颜色混合的功能。此功能称为双源颜色混合（dual source-color），不能与多个渲染目标一起使用。MRT 否则支持混合，DirectX 10.1 引入了在每个单独的缓冲区上执行不同混合操作的功能。

如上一节末尾所述，DirectX 11.3 提供了一种通过 ROV 进行混合编程的方法，尽管这是以性能为代价的。ROV 和合并阶段都保证了绘制顺序，也就是输出不变性。不管生成像素着色器结果的顺序如何，API 要求都按照输入结果的顺序（对象，对象和三角形，以及三角形）对结果进行排序并将其发送到合并阶段。

**引用：**

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[1220]** Mitchell, Jason L., and Pedro V. Sander, “Applications of Explicit Early-Z Culling,” SIGGRAPH Real-Time Shading course, Aug. 2004. Cited on p. 53, 1016  
**[1542]** Sander, Pedro V., Natalya Tatarchuk, and Jason L. Mitchell, “Explicit Early-Z Culling for Efficient Fluid Flow Simulation,” in Wolfgang Engel, ed., ShaderX5 , Charles River Media, pp. 553–564, 2006. Cited on p. 53, 1016  
**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040

## **3.10 计算着色器 The Compute Shader**

除了实现传统的图形管线外，GPU 还可以用于更多用途。在计算领域，有许多非图形用途，例如计算股票期权的估计价值和训练用于深度学习的神经网络。以这种方式使用硬件称为 GPU 计算。诸如 CUDA 和 OpenCL 之类的平台可作为大型并行处理器来控制 GPU，而无需真正的需求或访问特定于图形的功能。这些框架通常使用带有扩展功能的 C 或 C++ 等语言以及为 GPU 制作的库。

DirectX 11 中引入了计算着色器，它是 GPU 计算的一种形式，因为它是未锁定在图形管线中某个位置的着色器。它与渲染过程紧密相关，因为它由图形 API 调用。它与顶点，像素和其他着色器一起使用。它使用与管道中使用的统一着色器处理器池相同的池。与其他着色器一样，它是着色器，因为它具有一组输入数据，并且可以访问缓冲区（例如纹理）以进行输入和输出。扭曲和线程在计算着色器中更明显。例如，每个调用都会获取一个可以访问的线程索引。还有一个线程组的概念，它由 DirectX 11 中的 1 到 1024 个线程组成。这些线程组由 x，y 和 z 坐标指定，主要是为了简化在着色器代码中的使用。每个线程组都有少量的内存，这些内存在线程之间共享。在 DirectX 11 中，这等于 32 kB。计算着色器由线程组执行，因此保证该组中的所有线程可以同时运行 **[1971]**。

计算着色器的一个重要优点是它们可以访问在 GPU 上生成的数据。从 GPU 向 CPU 发送数据会产生延迟，因此如果可以将处理和结果保留在 GPU 上，则可以提高性能 **[1403]**。在后期处理中，以某种方式修改了渲染的图像，这是计算着色器的常见用法。共享内存意味着来自采样图像像素的中间结果可以与相邻线程共享。例如，已经发现使用计算着色器确定图像的分布或平均亮度的运行速度是在像素着色器上执行此操作的两倍 **[530]**。

计算着色器还可用于粒子系统，网格处理（例如面部动画 **[134]**，剔除 **[1883、1884]**，图像过滤 **[1102、1710]**，提高深度精度 **[991]**，阴影 **[865]**，景深 **[764]**，以及可以承担一组 GPU 处理器的任何其他任务。Wihlidal **[1884]** 讨论了计算着色器如何比曲面细分外壳着色器更有效。其他用途请参见图 3.16。

至此，我们对 GPU 的渲染管线实现的审查结束了。有多种方法可以使用和组合 GPU 功能来执行各种与渲染相关的过程。调整以利用这些功能的相关理论和算法是本书的重点。现在，我们将重点放在变换（transforms）和着色（shading）上。

![[1685518897522.png]]

_图 3.16。计算着色器示例。左侧是计算着色器，用于模拟受风影响的头发，并使用细分阶段渲染头发本身。在中间，计算着色器执行快速模糊操作。在右侧，模拟了海浪。（图像来自 NVIDIA SDK 11 **[1301]** 示例，由 NVIDIA Corporation 提供。）_

**引用：**

**[1971]** Zink, Jason, Matt Pettineo, and Jack Hoxley, Practical Rendering & Computation with Direct3D 11, CRC Press, 2011. Cited on p. 47, 54, 90, 518, 519, 520, 568, 795, 813, 814, 914  
**[1403]** Pettineo, Matt, “A Sampling of Shadow Techniques,” The Danger Zone blog, Sept. 10, 2013. Cited on p. 54, 238, 245, 250, 265  
**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[134]**  Bentley, Adrian, “inFAMOUS Second Son Engine Postmortem,” Game Developers Conference, Mar. 2014. Cited on p. 54, 490, 871, 884, 904  
**[1883]** Wihlidal, Graham, “Optimizing the Graphics Pipeline with Compute,” Game DevelopersConference, Mar. 2016. Cited on p. 54, 798, 834, 837, 840, 848, 849, 851, 908, 986  
**[1884]** Wihlidal, Graham, “Optimizing the Graphics Pipeline with Compute,” in Wolfgang Engel, ed., GPU Zen, Black Cat Publishing, pp. 277–320, 2017. Cited on p. 54, 702, 784, 798, 812, 834, 837, 840, 848, 850, 851, 908, 986  
**[1102]** Mah, Layla, and Stephan Hodes, “DirectCompute for Gaming: Supercharge Your Engine with Compute Shaders,” Game Developers Conference, Mar. 2013. Cited on p. 54, 518, 535  
**[1710]** Story, Jon, “DirectCompute Accelerated Separable Filtering,” Game Developers Conference, Mar. 2011. Cited on p. 54, 518  
**[991]** Lauritzen, Andrew, Marco Salvi, and Aaron Lefohn, “Sample Distribution Shadow Maps,” in Symposium on Interactive 3D Graphics and Games, ACM, pp. 97–102, Feb. 2011. Cited on p. 54, 101, 244, 245  
**[865]** Kasyan, Nikolas, “Playing with Real-Time Shadows,” SIGGRAPH Efficient Real-Time Shadows course, July 2013. Cited on p. 54, 234, 245, 251, 264, 585  
**[764]** Hoobler, Nathan, “High Performance Post-[Processing](https://so.csdn.net/so/search?q=Processing&spm=1001.2101.3001.7020),” Game Developers Conference, Mar. 2011. Cited on p. 54, 536  
**[1884]** Wihlidal, Graham, “Optimizing the Graphics Pipeline with Compute,” in Wolfgang Engel, ed., GPU Zen, Black Cat Publishing, pp. 277–320, 2017. Cited on p. 54, 702, 784, 798, 812, 834, 837, 840, 848, 850, 851, 908, 986  
**[1301]** NVIDIA SDK 11, https://developer.nvidia.com/dx11-samples. Cited on p. 46, 55, 150

##  **进一步阅读和资源**

吉森（Giesen）的图形管道之旅 **[530]** 详细讨论了 GPU 的许多方面，并解释了元素为何按其方式工作。Fatahalian 和 Bryant 的课程 **[462]** 在一系列详细的讲义幻灯片集中讨论了 GPU 并行性。尽管着眼于使用 CUDA 进行 GPU 计算，但 Kirk 和 Hwa 的书 **[903]** 的介绍部分讨论了 GPU 的发展和设计理念。

要学习着色器编程的形式方面，需要花费一些工作。诸如 OpenGL Superbible **[1606]** 和 OpenGL Programming Guide **[885]** 之类的书籍都包含有关着色器编程的材料。旧书 OpenGL Shading Language **[1512]** 没有涵盖较新的着色器阶段，例如几何和细分着色器，但确实专注于与着色器相关的算法。有关最新和推荐的图书，请参见本书的网站 realtimerendering.com。

**引用：**

**[530]** Giesen, Fabian, “A Trip through the Graphics Pipeline 2011,” The ryg blog, July 9, 2011. Cited on p. 32, 42, 46, 47, 48, 49, 52, 53, 54, 55, 141, 247, 684, 701, 784, 1040  
**[462]** Fatahalian, Kayvon, and Randy Bryant, Parallel Computer Architecture and Programming course, Carnegie Mellon University, Spring 2017. Cited on p. 30, 55  
**[903]** Kirk, David B., and Wen-mei W. Hwu, Programming Massively Parallel Processors: A Handson Approach, Third Edition, Morgan Kaufmann, 2016. Cited on p. 55, 1040  
**[1606]** Sellers, Graham, Richard S. Wright Jr., and Nicholas Haemel, OpenGL Superbible: Comprehensive Tutorial and Reference, Seventh Edition, Addison-Wesley, 2015. Cited on p. 55  
**[885]** Kessenich, John, Graham Sellers, and Dave Shreiner, OpenGL Programming Guide: The Of- ficial Guide to Learning OpenGL, Version 4.5 with SPIR-V, Ninth Edition, Addison-Wesley, 2016. Cited on p. 27, 39, 41, 55, 96, 173, 174  
**[1512]**  Rost, Randi J., Bill Licea-Kane, Dan Ginsburg, John Kessenich, Barthold Lichtenbelt, Hugh Malan, and Mike Weiblen, OpenGL Shading Language, Third Edition, Addison-Wesley, 2009. Cited on p. 55, 200