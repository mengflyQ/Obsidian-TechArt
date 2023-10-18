![[ad1a354636446ecb62354cf3fe9ce611_MD5.webp]]

官方 V 粒子系统

        从本篇开始，本人将在知乎上同步更新文章，https://zhuanlan.zhihu.com/p/166001958

，说到 GPU 粒子，首先想到的便是官方的 GPU 粒子系统 VisualEffectGraph，它是使用 C#+ComputeShader+Vertex/FragShader 去实现的一套全新的粒子系统，他们的分工是这样的：

1.C# 负责传递数据。对应下图中的黄框区域部分。2.ComputeShader 计算每个粒子的行为。对应下图中的蓝框部分。3.Vertex/FragShader 去渲染每个粒子，对应下图中的红框部分。

![[5489d50b1805fe884d27b4f0f135ed87_MD5.webp]]

       这里我们实现一个简单的粒子系统效果，关于 ComputeShader 的初步介绍已经在上一篇文章 [https://www.bilibili.com/read/cv6794949](https://www.bilibili.com/read/cv6794949) 里讲过一次，这里再细致讲一下其中容易混淆的一些概念。

![[ab5ee515421ac9841236ba49a7a90e7f_MD5.webp]]

**线程（Thread）**：最基础工元。

**线程组（ThreadGroup）**：多个线程的组合，一个线程组的线程是按 XYZ3 个维度进行排布。如 [numthreads(4,8,12)] 是定义 x 方向 4 个线程，y 方向 8 个线程，z 方向 12 个线程的一个线程组。1 个线程组的大小（ThreadGroupSize）最大为 1024，也就是 x*y*z<=1024。

对于 AMD 的 GPU 平台，线程组的大小建议定义成 64 的倍数（WaveFront 构架）。

对于 Nvidia 的 GPU 平台，线程组的大小建议定义成 32 的倍数（SIMD32(Warp) 构架）。

同一个线程组的线程是可以支持线程同步（GroupMemoryBarrierWithGroupSync（）；）的，不同线程组不支持。

**调度（Dispatch）**：多个线程组的组合，一个 Dispatch 的线程组是按 XYZ3 个维度进行排布。如 Dispatch（KernelID，3，9，12）是定义 x 方向 3 个线程组，y 方向 9 个线程组，z 方向 12 个线程组，调用 ComputeShader 里 KernelID 的 kernel 函数的一个调度。

--------------------------------------- 上面是线程的一些基本内容，下面对容易混淆的 id 做出解释 --------------------------------------------

**组内线程 ID（GroupThreadID）**: 三维数据，表示一个线程组里的线程的位置；相对于指定线程组内的指定线程 id（x，y，z）；x，y，z 三个值分别对应三个维度的取值；如下图中的红色点的组内线程 ID 是（2，1，0）。

![[40c86a56cfa43b0dca17e93072908553_MD5.webp]]

某线程组里的线程

**组内序号（GroupIndex）**：和 GroupThreadID 是同一种东西，不过是一维数据版本，可以由 GroupThreadID 直接推导转换得：如上图中红色点的 GroupIndex 是 2+1*4+0*4*4=6。

**线程组 ID（GroupID)**：三维数据，表示一个调度里的一个线程组的位置；相对于一个调度内指定线程组的 id（x，y，z）；x，y，z 三个值分别对应 3 个维度的取值；如下图中的红色线程组的 GroupID 是（2，1，0）。

![[a61d17d4f832c9246ae1975dad83bc2b_MD5.webp]]

某调度里的线程组

**调度线程 ID(DispatchThreadID)**: 三维数据，某线程相对于一个调度里的绝对位置；相对于一个调度内指定线程的 id（x，y，z）；x，y，z 三个值分别对应 3 个维度的取值；如下图中的 DispatchThreadID 为（9，1，0），其可由 GroupID,GroupThreadID 直接换算得到。他们之间的换算公式如下：

DispatchThreadID=GroupThreadID+GroupID*numthreads（x，y，z）。这里代入可得

（9，1，0）=（1，1，0）+（2，0，0）*（4，4，1）。

![[5b3c951a68e6661154eef92377edac74_MD5.webp]]

某调度里的线程

**调度序号（DispatchIndex）**：和 DispatchThreadID 是同一个东西，不过是一维数据版本，可以由 DispatchThreadID 直接推导转换得：如上图中红色点的 DispatchIndex 是 21。(该 id 是本人自己定义并非官方定义，因 computeShader 要经常使用它所以干脆直接定义出来方面后续文章使用）。

其换算公式非常简单，如下可得

DispatchIndex=DispatchThreadID.x+DispatchThreadID.y*numthreads.x*Dispatch.x+DispatchThreadID.z*numthreads.x*Dispatch.x*numthreads.y*Dispatch.y。代入可得

21=9+1*4*3+0*4*3*4*2。

下一篇文中，我们将实现一个非常基础的 GPU 粒子效果，其效果图如下。

GIF

![[2956e51222b8bdb54bb7c449b576bd14_MD5.webp]]