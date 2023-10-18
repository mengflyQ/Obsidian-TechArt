## 一、URP 渲染管线的设计目的

图像时游戏传达信息的主要方式，制作游戏时我们希望通过图像将游戏世界展现在玩家面前从而增强玩家反馈。游戏引擎将游戏世界的逻辑以及数据构造出来后，渲染管线则承担起如何将这些数据转换 2D 图像的任务。

渲染管线整体分为两部分，一部分是应用阶段的渲染任务规划和策略，另一部分则是 GPU 渲染流程。对于 GPU 渲染流程，由于涉及硬件，除非主机平台的定制化优化，开发者通常无法直接干预。应用阶段则给开发者更大的可能性。国内游戏通常种类繁多，一款通用的渲染管线，通常存在冗余，不合适的设计，或者一些特殊需求难以实现，另外渲染管线占用了大量 CPU 的资源，是游戏优化的重要部分，所以在移动端游戏开发任务愈发复杂的情况下，开发者有更强烈的需求定制更适合自己项目的渲染管线。

Unity 中 SRP 则承担起这样的任务，SRP 希望开发者可以以更低的学习成本来修改或者定制渲染流程。所以 SRP 尽可能隐藏复杂内容，如剔除，合批，物体渲染，阴影渲染，API 调用等，更多的将流程问题交予开发者处理。

## 二、GPU 硬件知识预备

在分析 Unity 的应用层面的管线设计前，还要预备一些 GPU 硬件相关知识来辅助管线设计决策和性能分配评估。GPU 资料相对有点分散，这里尽力对一些文章做了一下内容整合，涉及硬件的执行细节没有过多介绍，但是阅读前，尽量还是要清楚 GPU 的大致执行逻辑以及名称。这里主要介绍一些容易影响管线设计以及 shader 编写的内容。其中内容可能存在一些偏差，欢迎大佬指教。

内存方面推荐看下面两位大佬的文章：

GPU 的内存相对与 CPU 会更复杂一些，主要是为了适应不同数据的访问效率而做了很多存储分化。

[kaiyuan：GPU 内存 (显存) 的理解与基本使用](https://zhuanlan.zhihu.com/p/462191421)[深度学习可好玩了：cuda 编程笔记（四）：存储系统结构](https://zhuanlan.zhihu.com/p/463052196)

GPU 架构方面可以看下面这篇文章：

[夕殿萤飞思悄然：深入 GPU 硬件架构及运行机制](https://zhuanlan.zhihu.com/p/357112957)

### 1.GPU 存储结构

渲染流程中存在很多数据，如渲染单个物体需要的纹理，RenderTexture，模型，shader，shader property。还有各种 Buffer 分类，ConstantBuffer，StructureBuffer.., 各种资源视图分类 SRV，UAV...。以及渲染过程中产生的 FrameData... 都是管线需要考虑的，另外 ComputeShader，DrawProcedural 这些新鲜计算依然很依赖 GPU 数据结构的认知，所有还是有必要清楚 GPU 存储的大致逻辑。

**GPU 的片下内存（off-chip memory）：**

在移动端的集成芯片中会在系统内存中分配一片区域作为 GPU 的存储，同时会对这些内存进行一分化，而适应不同数据的读写效率。分化分类如下：

*   GlobalMemory（可读可写）：这部分属于通用存储部分自由度很高，允许读写, 但是读写速度优势不大。其中存储内容包括 UAV 资源（unordered access view），StructureBuffer，Mesh，着色器程序等。
*   ConstantMemory（只读）:shader 中 ConstantBuffer，Uniform 变量存在在这里，在同一 Warp 的多个线程由于执行指令相同，在访问同一变量时，如果该变量存储在一个物理地址上则会产生访问冲突。ConstantMemory 就是解决该问题，ConstantMemory 会将该变量拷贝多份，允许 warp 内的线程同时访问来提高并行性，至于怎么拷贝或者为什么会冲突没有找到相关资料，在 Unity 中，自带 instance 实现有使用到 ConstantBuffer，会比 StructureBuffer 快一些，但是由于 ConstantMemory 属于只读存储所以无法使用 ComputeShader 对 Buffer 进行初始化。
*   TextureMemory（只读）**：**纹理存储，这部分通常只读，但是对于 RenderTexture 这种特殊格纹理是允许读写操作的。
*   LocalMemory：寄存器不够时会用使用 LocalMemory，属于线程私有。

**GPU 片上存储 (on-chip memory)：**

![[9d52255053076ee68507583f60b82d74_MD5.jpg]]

先简单看一下 SM 的非存储结构：

*   PolyMorph Engine：用于处理几何处理，用于顶点数据生成和三角形剪裁、变化、输出等，这里要和 RasterEngine 进行区分，RasterEngine 用于光栅化和插值。PolyMorphEngine 和 VertexShader，GeometryShader，曲面细分需要配合进行，所以该架构每个 SM 都配备一个 PolyMorphEngine。
*   WarpScheduler/DispatchUnit:warp 调度和计算驱动
*   Core：计算单元
*   SFU：特殊函数计算单元，如三角函数，log
*   LD/ST: 用于从存储结构将数据加载寄存器，或从寄存器保存到其他可写存储结构
*   Tex: 纹理单元，用于纹理访问，纹理采样和过滤。

然后看一下片上储存，片上存储分成三种，一部分是寄存器，一部分是 L1, 一部分是 L2，

*   **寄存器：**寄存器访问速度，通常在 1 个时钟周期即可完成访问。寄存用于存储线程计算过程中的变量以及状态，属于线程私有。相对于 CPU 寄存器，GPU 寄存器通常数量庞大，在几千或者几万个。庞大的寄存器空间允许 SM 存储多个 Warp 的变量以及状态，这就使在 Warp 访问存储时（通常一次访问设计几十到几百个时钟周期）可以以非常小的成本进行 Warp 切换从而更好的实现延迟隐藏。

![[4763e6f36a1b28748d13c62d14e8c7d8_MD5.jpg]]

*   **L1Cache:**GPU 上有 L1Cache 用来存储 GlobalMemory 和 localMemory 内容，但是对于 TextureCache，ConstantCache，ShareMemory 依然可以看成 L1 缓存的分化:

L1Cache: 主要用来缓存 GlobalMemory 和 LocalMemory 数据。

TextureCache:TextureCache 是 GPU 纹理的缓存硬件， 当 Core 执行着色器程序访问纹理像素时，会先确定在 TextureCache 这一硬件结构中是否命中，如果命中这从 TextureCache 进行获取，这一过程通常会在几十个时钟周期内完成。如果未命中，则会请求 TextureMemory 进行获取，但是这一操作会涉及上百个时钟周期，对于具体周期网上资料给出的答案偏差相对大一些，下面表格是比较常见的周期表。但在其他资料以也看到过 TextureMemory 和 ConstantMemory 的访问速度会比 GlobalMemory 快一倍。除了 Memory 相关，TextUnit 是纹理内存访问的另一重要硬件结构，在一个 SM 结构中一个 Core 或多个 Core 会对应一个 TexUnit，也就是一个纹理访问窗口，TexUnit 在向 TextureMemory 请求数据时会执行硬件的解压缩操作，且在纹理采样时 TexUnit 则可根据参数设置进行采样以及过滤。下面这篇有解释一些缓存命中的相关问题。

[MR 一：GPU Texture - Mipmap, Bilinear and Cache](https://zhuanlan.zhihu.com/p/494964914?utm_id=0)<table data-draft-node="block" data-draft-type="table" data-size="normal" data-row-style="normal"><tbody><tr><th>存储类型</th><th>Register</th><th>Shared Memory</th><th>L1 Cache</th><th>L2 Cache</th><th>Texture/Const Memory</th><th>Global Memory</th></tr><tr><td>时钟周期</td><td>1</td><td>1-32</td><td>1-32</td><td>32-64</td><td>400-600</td><td>400-600</td></tr></tbody></table>

ConstantCache：常量缓存，用来缓冲 ConstantMemory 数据，ConstCache 有一定内存限制，Unity 单个 ContantBuffer 内存占用在 64KB 以下，Unity Instance 由于使用了 ConstantBuffer 所以绘制数量会受到限制。另外在定义 Shader 的 Uniform 变量时，需要注意到内存对齐，在 OpenGL std140 标准，ConstantBuffer 是 128 位对齐的也就是 4 个 float 值，所以对于下面两种情况，第一段实际占用 12 float 空间，而第二个只会占用 8 个 float 空间。

```
CBUFFER_START(UnityPerMaterial)
float2 a;
float4 b;
float2 c;
CBUFFER_END

CBUFFER_START(UnityPerMaterial)
float4 b;
float2 a;
float2 c;
CBUFFER_END
```

ShareMemory: 这部分是可读可写的块共享存储，这部分没有找到太多资料，在 GPU 泛用化上应用可能会比较多。对于块的在 CUDA 编程和 ComputeShader 中通常会定义块属性，即一个三维数组，在 ComputeShader 中 Kernel 方法可以使用 [numthreads(x, y, z)] 来定义线程块（block），一个线程块可以包含多个 Warp，使用一个 SM 执行。ShareMemory 即是块内共享存储，相对与 Cache 读写速度会更快， shared 关键字允许我们自定 Share 存储空间（shared float data[1024]）。但是需要保证 Block 内的线程不要产生访问冲突，这就意味着尽量每个线程都有独有 shareMemory 空间。

L2Cache：整个 GPU 共享缓存。

### **2. 带宽：**

对于 GPU 而言，把 GPU 抽象成工厂非常合适。计算核心就是流水线工人，带宽就行工厂的运输系统。为了使工人尽可能不停的生成产品，就需要规划运输系统的方案，来取得最大的产品吞吐量。

之所以着重考虑带宽，除了带宽会影响计算时间，还因为带宽是功耗的第一杀手。手机发烫在大多数游戏里是比较敏感的，会持久性的影响玩家的游戏体验。

对于带宽影响最大的通常就是纹理了， 从下面这几张图可以很好的理解纹理影响带宽的方式：

![[41ea042d162719a7c0701d039f309835_MD5.jpg]]

![[c2ca80f6d5022c5f1c0f1c9c62780e5a_MD5.jpg]]

![[3daea40d8a5683bf993a5a571730dd42_MD5.jpg]]

上图都是基于 IMR GPU 架构的渲染结果，移动端通常是 TBR、TBDR GPU 架构, 但是 TBR 每个渲染块通常也是 16*16 的导致调度块可能和 IMR 会比较相似。TBR 相关内容也比较有意思，感兴趣可以再去查看一些资料，对于 TBR，TBR 的设计相比于 IMR 会有更多可能性，尤其在对于同一个 tile 块中，由于可以拿到一批绘制的所有在此块中不透明三角面，所以 TBR 架构更有可能在硬件层面解决 OverDraw 的问题。

由图 1 开始，我们可以看到渲染单个三角形会以 16*16 的块为单位调度 SM，每个 SM 会有多个块需要执行，这里的 16*16 我们的可以理解为是一个 block，一个 block 会存在多个 warp，图 2 可以看出 16*16 的 block 内分成了 4*2 个 warp，每个 warp 为执行 4*8 32 个像素。图 3 有可以看出来一个 warp 内有 32 个线程，每个线程都会处理一个像素。

那么再理一下一个三角形是如何进行像素着色：

1.  三角形光栅化后会将光栅化结果分成多个 16*16 的 block（图 1），调度 GPU 上 SM 执行 Block 的着色。
2.  当一个 SM 拿到 16*_16 的 block 时，block 内会分成 4*2 个 Warp（图 2）然后使用 WarpScheduler 硬件调度 Warp 执行。_
3.  当 SM 开始执行一个 Warp，使用 DispatchUnit 调度线程执行着色程序。

### **3. 纹理采样：**

纹理采样是带宽的核心部分，也是着色器编写过程中令人头痛的内容，对于大面积的物体，每次采样都会有心里负担。所以这里尽可能解释采样到底发生了什么。

纹理在片下存储 TextureMemory 中是以 tile 的方式存储的，由此来增强纹理存储的局部性，每一个 tile 占用 1 个或多个 CacheLine 的空间也就是 n *（64 或 128 字节），这样的存储方式，在向 TextureMemory 请求纹理时，可以快速请求到一块纹理数据，而提高采样命中率。另外纹理压缩是以块的方式压缩的，对于 Astc 的格式，Astc 存在 12X12，8X8，6X6，5X5... 多种压缩状态，对于一个 n*n 的像素块，固定存储量是 16 字节，那么对于 64 字节的 CacheLine 可以容纳 4 个压缩块。那么在每次纹理请求时 TextureMemory 到 Cache 的传送量，针对不同压缩格是不同的。所以选择合适压缩格式一定程度上可以减少带宽。

纹理在片上 cache 中，L1 的 TextureCache 通常只会有几十 KB，但是一张图片在 TextureMemory 也就是系统内存中是压缩状态，但是读取到 Cache 是则是非压缩状态, 这就导致纹理块在 cache 中是比较大的，那么在渲染一个物体的过程中，TextureCache 内的纹理块并不会存储很长时间，很快会被切换出去。所以我们尽可能希望 SM 在一批像素的处理中尽可能少地从 TextureMemory 读取纹理块。这里一批也就是是一个 Block，通过图 1 可以看出来，在同一个 SM 上渲染的不同的 block 的通常是不连续的，不同的 Block 对应的采样的纹理区域差别会比较大，所以命中通常是在单个 block 内分析的。

这样在着色器在渲染一个 Block 的过程中，假设 block 内的一个 warp（4*8 像素块）的所有线程向 TexUnit 请求纹理数据，我们可以知道这些请求的 UV 会映射在纹理的一块区域内，所以一定程度上我们可以预估这个 Warp 采样使用的纹理范围的大概矩形区域，来判断 Texmory 的请求次数。如果希望 Warp 每个线程命中率近可能的高，那么最优情况，在渲染这个 warp 所属的 block 的过程中，第一次未命中时，向 L2Cache 或者 TextureMemory 请求纹理块时，该纹理块包含了 block 渲染需要的所有纹理数据，在 16*16 256 次的采样只有一次未命中，命中率会达到 99 以上。到这里再回想一下 TBR 架构设计也是这样，在对 ColorBuffer，DepthStencilBuffer 进行读写时会保证 block 的绘制只访问一次 Tile 块，所以命中率会非常高，从而极大减少与系统内存的交互，而减少功耗。

*   **if else：**  
    这个也是写着色器时经常要考虑的事情，if else 到底做了什么基本上很多文章都有介绍，大致的逻辑就是再同一个 warp 中的线程并非全部走同一分支，那么这个 Warp 会分别执行两个分支，执行时间也就变成了两个分支的执行时间。至于对于一个 warp 是否会执行同一分支，一定程度上也可以判断，上图图 2 中 warp 是 4*8 的像素块，那么在像素着色时，如果大部分的像素块会选择只执行一个分支，则 if else 的影响并不会很大。在顶点着色时，一个 warp32 个线程同时执行 32 个顶点着色，如果保证大部分 32 为一组的顶点组只会执行一个分支，则 if else 的影响依然不会很大。

## 二、自定义管线的重要接口

### 1.GraphicsSettings : Unity 暴露的全局图形设置接口

在 GraphicsSettings 中可以设置自定义 pipelineAsset，设置合批，shader 模式。。。

### **2.RenderPipelineAsset：管线设置方案**

对于整个管线，开发者需要配置一些渲染设置，如阴影，光照，后处理等渲染等设置，同时将自定义管线交付给引擎使用。所以 SRP 需要提供这样一个方案：

开发者可以创建继承 RenderPipelineAsset 的自定义的类，RenderPipelineAsset 继承 ScriptableObject 允许开发者自定义可序列化设置属性。同时通过实现基类的 CreatePipeLineAsset 方法，使引擎可以获取管线。

在 URP 中可以通过右键 Create/Rendering/Universal Render Pipeline/Pipeline Asset（Forward Render）创建管线资产，同时在顶部栏 Edit/ProjectSetting/Graphics 中设置该资产，这样就将通用渲染管线应用在游戏中。

### **3.ScriptableRenderContext：SRP 与引擎交互的方案**

ScriptableContext 向上承接引擎提供的物体渲染接口，向下调用图形 API。管线执行流程中会将绘制任务提交到 Context 中。Context 对象可以在自定义的 RenderPipeline 的 Render 方法获取获取，Render 方法这也是整个管线的入口。ScriptableContext 提供了几个非常重要的接口可以帮助我们绘制内容：

*   **DrawRenders()**

该方法允许我们将相机可见物体直接绘制出来，而不用过多的考虑物体的具体渲染流程，尽管 DrawRender 没有提供渲染细节，但是他提供了丰富的绘制设置，其中 DrawSetting 运行我们指定特定 Pass 或者使用替代材质进行渲染，同时也提供了合批选项。FilteringSetting 可以通过设置 Layer 层级 Mask 或者渲染队列范围过滤需要渲染的物体。DrawStateBlock 则允许覆盖自定义渲染状态进行渲染，如透明度混合，光栅化设置，深度和模板。

*   **ExecuteCommandBuffer()**

CommandBuffer 提供了丰富的图形 API，允许我们执行各种指令来控制渲染，其中不仅包含 Graphics 中 blit，textureCopy，物体绘制命令，RenderTarget 设置。还包含了 GPU 变量设置，ComputeBuffer 设置，GPU 数据回读，光线追踪，RenderTexture 相关内容。

*   **Submit()**

Submit 用于提交并执行管线提交的渲染任务，驱动 GPU 完成渲染。

除上述外，ScriptableObject 还提供 DrawSkybox，DrawUIOverlay，DrawWireOverly，DrawShaows 引擎封装好的相关操作。

### 4.ScriptableCullingParameter：剔除方案

## **四、管线流程设计**

### **1. 管线流程列表：**

以 URP 渲染流为例，其中主要包括下面操作：

1.  主光源阴影渲染 点光源阴影渲染 (MainLightShadowCasterPass，AdditionalLightsShadowCasterPass)
2.  深度 Buffer 或深度法线 Buffer 提前获取，这部分也可以叫做 Zprepass，通常情况会被屏蔽，只有在设备不支持 MRT 等情况下会开启 (DepthOnlyPass, DepthNormalPass)
3.  不透明物体渲染 或者 延迟渲染 (DrawObjectsPass, DeferredPass)
4.  天空盒 (DrawSkyBoxPass)
5.  CopyDepthTexture CopyColorTexture (CopyDepthPass, CopyColorPass)
6.  透明物体阴影设置 (TransparentSettingsPass)
7.  透明物体渲染 (DrawObjectsPass)
8.  后处理 (PostProcessingPass)
9.  GammaToLinear (ColorSpacePass)
10.  FinalBlit or FinalPostProcessing (PostProcessPass)

### 2. 阴影 Pass:

在渲染物体前，需要渲染出阴影遮罩以及将阴影相关属性设置到 Shader 中，以供物体渲染阴影，阴影 pass 需要考虑三个方面内容，一方面是主灯光阴影和额外灯光阴影，一方面是 CSM 级联阴影，还有就是软阴影。

阴影 Pass 相对管线的整个流程来说是非常重要的。在 CPU 资源方面阴影涉及额外剔除操作，增加阴影 drawCall，以及阴影渲染初始化操作，在优化时着重也需要在这三个方面考虑。在 GPU 方面阴影遮罩的绘制和阴影计算占用大量带宽资源，计算资源。

那么阴影绘制是怎么怎样进行的，以主灯光阴影为例，我们需要绘制可见阴影的物体，这一块再 URP 中已经封装好了，我们并不需要关心具体的代码流程。但是我们需要设置阴影的绘制 targetBuffer。

移动端阴影优化的话分成两种类型的优化

1、使用替代方案

面片阴影：透明问题，二次绘制投影到屏幕上，AO 贴图

2、优化流程

减少 DrawCall：配合使用 instance 以及其他合批方案，配合 AO 贴图

减少 GPU 消耗：使用低分辨率软阴影，或者较高分辨率硬阴影，优化软阴影方案，优化阴影投影增加纹理利用率。

### **3.DepthPrepass：**

这部分通常在 Unity 中是关闭，这部分在渲染物体前提前先渲染一遍物体只填充 ZBuffer，在之后渲染时就可以直接使用完整的 zbuffer 内容避免由于面片渲染顺序导致的 OverDraw 问题，但是性价比就非常低了，移动端很难达到使用 DepthPrepass 的地步。更详细的内容可看下面这位大佬的文章。

[自由自在：Depth Prepass](https://zhuanlan.zhihu.com/p/361131718)

### 4. 不透明物体渲染：

这部分 URP 暴露出来的内容比较简单，只需要设置 Shader 标记，过滤属性，剔除结果，渲染设置。然后调用 ScriptableContext.DrawRenderers 渲染出来即可。

### 5. 绘制 SkyBox：

直接调用 ScriptableContext.DrawSkybox(camera)

### **6. 深度纹理获取:**

CopyDepthPass 将深度缓冲渲染成深度纹理，深度纹理在手机端是比较贵的，属于性价比比较低的操作，拿到深度意味至少需要遍历一遍深度缓冲，带来的带宽损耗以及像素填充（Raster）资源消耗比较大。同时深度问题带来的效果对游戏核心玩法或体验的作用比较有限，如果只是水体需要深度缓冲，尽量将水体深度转换成纹理来表示深度。

### **7. 透明物体阴影渲染设置：**

这里会判断透明物体是否需要接受阴影

### 8. 透明物体渲染：

除了渲染顺序，其他和不透明物体没有太大区别。

## 五、URP 代码设计解读

首先在设计前需要明确 Unity 暴露了什么接口或者是条件可以让我们自定义管线流程：

*   PipeLineAsset（基类）：该类的 CreatePipeline: 这个方法允许将我们自定义的 RenderPipeline 交付给引擎
*   RenderPipeline（基类）：这个类的 Render 方法是整个管线内容，在 URPPackage 中其他的类仅是 URP 通用管线设计的代码框架并非是固定标准。RenderPipeline.Render 方法使我们可以拿到 ScriptableContext 来提交渲染命令完成渲染。
*   除了上述两个重要的类外，我们还可 ndBuffer 的 AP 以拿到 Unity 提供的 Cameras，CommaI, 以及 ScriptableContext 和 ScriptableContext 内方法所涉及的类，如 CullingResult 这个可以拿到剔除后的物体，灯光，探针。

### 1. 设计主要内容：

对于渲染一个场景我们需要考虑将场景内的相机有序的进行渲染，并拿到最后的结果。在渲染单个相机时需要考虑如何组织渲染流程。对于每一个渲染流程则要考虑一个流程的通用部分以及接口暴露。除了这几部分，还要考虑渲染设置的设计，渲染流程中需要的工具类，以及渲染流程中内置的 Shader 框架。同时 URP 还提供了 Pass 拓展方案 RenderFeature。

![[993d5f32de23e80e96d5e10b57224f5d_MD5.jpg]]

### **2. 管线设置（RenderingData）:**

这里只简单说自定义管线的设置，像光照贴图，天空盒相关绘制等内容 SRP 并未暴露。对于管线设置，URP 设置保证修改实时性，属性修改时可以立刻在画面上反馈，这就代表所有设置相关的初始化操作都要在每一帧进行，另外管线设置所有流程可读但不可写。之后代码也是遵循这种规则。

在 URP 对于设置选项分成下面几个方面，具体设置内容可以查看 URP 的 RenderingData 中的查看:

*   剔除
*   相机
*   灯光
*   阴影
*   后处理

**3.Camera 调度（RenderPipeline.Render）：**

![[dce0c5267a4e351de5ffead8f7291b30_MD5.jpg]]

![[ce743b2f27ee0b122fc5be12a3269414_MD5.jpg]]

![[73759adf5db054c28e27201117f63c03_MD5.jpg]]

### **3. 渲染流程**

渲染流程的控制主要是 ScriptableRenderer 类进行的，在该类的数据结构中定义了所有渲染步骤 --Passes，以及流程中涉及的 RenderTarget 和 Materials。在每帧渲染时，该类负责正确安排渲染步骤，初始化渲染步骤，并依次执行渲染步骤来完成一个相机的渲染。

(1) 渲染安排并初始化渲染步骤：ScriptableRender.SetUp()

在该方法中主要任务就是判断 pass 是否需要执行，并将正确的 RenderTarget 设置好，同时每个 Pass 各自完成自己的 SetUp() 操作。除此之外如果有支持 ClusterRendering，该方法也会预先进行 Cluster 的初始化。

(2) 渲染执行：ScriptableRender.Execute()

这部分就是渲染管线最核心的内容了，很多平时常用的 shader 属性或者宏都会在这边初始化。GPU Profile 的内容也可以在这里的到验证，具体每个 Pass 是如何执行的，这里就不介绍了，感兴趣可以再去看相关 Pass 的逻辑，下面按顺序逻辑 Execute 方法执行的内容。

配置 Pass 的 RenderTarget：

![[0d71df74abe943a30e6f55167416c8d2_MD5.jpg]]

重置 shader 宏定义：

![[b397933014ec99e3857fac9ae94c365e_MD5.jpg]]

设置时间属性：

![[ca28114f8b8f3383936b9c3a6f6da5b0_MD5.jpg]]

对 Pass 进行排序：

![[fa5885f6ce1398427e04be3e655db347_MD5.jpg]]

将 Pass 通过自建 hash 创建字典结构：

![[65c3a5848eef657f2f0d6b0dc49a53e6_MD5.jpg]]

设置光照 FowardLight.SetUp：

![[906a036e79682bd87060a6fc229cf9bb_MD5.jpg]]

之后开始 Pass 的执行，URP 将 Pass 分成几个部分执行，其中 BeforeRendering 是指在渲染物体前的准备工作，这部分不依赖相机属性，如阴影 Map 的绘制。AfterRendering 则是指渲染物体后的操作，如后处理：

![[11019e55b85b24ae6059a0833ce1ea31_MD5.jpg]]

在执行 BeforeRendering 后，会初始化相机属性，如相机矩阵，视口属性。SetPerCameraShaderVariables（）：

![[508ffd840d353a9170c4b816fa111166_MD5.jpg]]

![[7ba3d58068b85096b92cd99e67f441d6_MD5.png]]

对于上述几个 Block 的 Pass 执行过程中，一个 pass 的执行主要分成两部分，一部分是设置 RenderTarget, 一部分是 Pass.Execute()。对于设置 RenderTarget 逻辑相对复杂一些，有一些 MRT 情况，以及 NativeRenderPass 情况要处理。最后会调用 SetRenderTarget 方法设置渲染目标

![[69e6b8e368029d035e91f011e233fc64_MD5.jpg]]

![[a625e01fd62d338503d67e04ba418e60_MD5.png]]

### 4.Pass 设计

![[10262d743790a012be91d383b78b835b_MD5.jpg]]

## 六、通过 Profile 看管线执行

![[6bed76cb172e63f629f43dc56ce581e9_MD5.jpg]]

这部分就是 URP 的所有执行内容了，下面依次看各个分段的含义

![[7e7355e4130a4720eb46ce106f29d4b8_MD5.png]]

![[363278be4f5343828567e4dcfc37d960_MD5.png]]

![[b747d98f55d3b4df0c16ca5b70d0b259_MD5.png]]

![[b528ea36e86ef34610abf5364a7748e0_MD5.png]]

![[f446e4cf68784bf52418c34cfcd75fca_MD5.jpg]]

![[8b69550391c343dda6239a94c07f12ef_MD5.jpg]]

![[0cb864f9facc403edd3a0d2c60c73136_MD5.jpg]]

![[61f783fe356d93762eac02663ae3f0a9_MD5.png]]

![[4f85bbb0080281be67a769b762752c9b_MD5.png]]

![[42b20193cf91b6e171b5c082d9caabf4_MD5.jpg]]

![[f46055c0186821f97898c438be5f6205_MD5.png]]