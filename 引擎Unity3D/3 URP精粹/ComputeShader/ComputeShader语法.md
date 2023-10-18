
> [!NOTE] Title
> 本文 CS 指 Compute Shader
# 总结
1. 每个 SM 至少需要两个线程组，避免线程阻塞
2. 每个线程组中又是由 $n$ 个线程组成的，由 numthreads 定义
3. `numthreads (tX, tY, tZ)`：一个线程组中可以被执行的线程总数量为 `tX*tY*tZ` ，应设置为 64 的倍数，默认 `8*8*1`
4.  先 `numthreads` 定义好每个核函数对应线程组里线程的数量（`tX*tY*tZ`），再用 `Dispatch` 定义用多少线程组 (`gX*gY*gZ`) 来处理这个核函数。


# Unity 中默认的 Compute Shader

在 Project 中右键，即可创建出一个 CS 文件：

![[8539e70bb339c5868513763f11a94c57_MD5.jpg]]

生成的文件属于一种 Asset 文件，并且都是以 **.compute 作为文件后缀**的。我们来看下里面的默认内容：

```c
// 每个 #kernel 表示编译哪个函数
// 可以有多个 kernel
#pragma kernel CSMain

// 创建一个带有 enableRandomWrite 标志的 RenderTexture 并设置它
// with cs.SetTexture
RWTexture2D<float4> Result;

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
    // TODO: insert actual code here!

    Result[id.xy] = float4(id.x & id.y, (id.x & 15)/15.0, (id.y & 15)/15.0, 0.0);
}
```

### kernel

把一个名为 CSMain 的函数声明为 kernel，或者称之为**核函数**。这个核函数就是最终会在 GPU 中被执行。
```c
#pragma kernel CSMain
```

1. 一个 CS 中**至少要有一个 kernel 才能够被唤起**。声明方法为：
```c
#pragma kernel functionName
```
2. **可以在一个 CS 里声明多个 kernel**，此外我们还可以在该指令后面定义一些预处理的宏命令：
```c
#pragma kernel KernelOne SOME_DEFINE DEFINE_WITH_VALUE=1337  
#pragma kernel KernelTwo OTHER_DEFINE```
```
3. **不能把注释写在该命令后面，而应该换行写注释**，否则编译报错
### RWTexture2D

**声明了一个名为 Result 的可读写二维纹理，其中每个像素的值为 float4。**
```c
RWTexture2D<float4> Result;
```

看着像是声明了一个和纹理有关的变量，具体来看一下这些关键字的含义。

`RWTexture2D` 中，RW 其实是 **Read** 和 **Write** 的意思，Texture2D 就是二维纹理，因此它的意思就是**一个可以被 CS 读写的二维纹理**（如果我们只想读不想写，那么可以使用 `Texture2D` 的类型）。在 CS 中可读写的类型除了 **RWTexture** 以外还有 **RWBuffer** 和 **RWStructuredBuffer**，后面会介绍。

我们知道纹理是由一个个像素组成的，每个像素都有它的下标，因此我们就可以通过像素的下标来访问它们，例如：`Result[uint2(0,0)]`。

`<type> `：每个像素的属性值，也就是我们要读取或者要写入的值。通常是一个 rgba 的值，因此是 float4 类型。**通常情况下，我们会在 CS 中处理好纹理，然后在 Fragment Shader 中来对处理后的纹理进行采样**。

### numthreads

定义**一个线程组（Thread Group）中可以被执行的线程（Thread）总数量。**

**每个核函数前面我们都需要定义 numthreads**，否则编译会报错。
```c
[numthreads(8,8,1)]
```

> [!quote] 线程组
> 在 GPU 编程中，我们可以将所有要执行的线程划分成一个个线程组，一个线程组在单个**流多处理器（Stream Multiprocessor，简称 SM）** 上被执行。如果我们的 GPU 架构有 16 个 SM，那么至少需要 16 个线程组来保证所有 SM 有事可做。**为了更好的利用 GPU，每个 SM 至少需要两个线程组**，因为 SM 可以切换到处理不同组中的线程来避免**线程阻塞**（如果着色器需要等待 Texture 处理的结果才能继续执行下一条指令，就会出现阻塞）。
> 
> **每个线程组都有一个各自的共享内存（Shared Memory），该组中的所有线程都可以访问改组对应的共享内存，但是不能访问别的组对应的共享内存。** 因此线程同步操作可以在线程组中的线程之间进行，不同的线程组则不能进行同步操作。

每个线程组中又是由 $n$ 个线程组成的，**线程组中的线程数量就是通过 `numthreads` 来定义的，格式如下：**

```c
numthreads(tX, tY, tZ)
//注：X，Y，Z 前加个 t 方便和后续线程组的 X，Y，Z 进行区分。
```

其中 `tX*tY*tZ` 的值即**线程的总数量**，例如 numthreads(4, 4, 1) 和 numthreads(16, 1, 1) 都代表着有 16 个线程。那么为什么不直接使用 numthreads(num) 这种形式定义，而非要分成 tX，tY，tZ 这种三维的形式呢？看到后面自然就懂其中的奥秘了。

`tX，tY，tZ` 在不同的版本里有如下的约束：

<table data-draft-node="block" data-draft-type="table" data-size="normal" data-row-style="normal"><tbody><tr><th>Compute Shader 版本</th><th>tZ 的最大取值</th><th>最大线程数量（tX*tY*tZ）</th></tr><tr><td>cs_4_x</td><td>1</td><td>768</td></tr><tr><td>cs_5_0</td><td>64</td><td>1024</td></tr></tbody></table>

如果是 NVIDIA 的显卡，线程组中的线程又会被划分成一个个 **Warp**，每个 Warp 由 32 个线程组成，一个 Warp 通过 SM 来调度。在 SIMD32 下，当 SM 操控一个 Warp 执行一个指令，意味着有 32 个线程同时执行相同的指令。假如我们使用 numthreads 设置每个线程组只有 10 个线程，但是由于 SM 每次调度一个 Warp 就会执行 32 个线程，这就会造成有 22 个线程是不干活的（静默状态），从而在性能上无法达到最优。**因此针对 NVIDIA 的显卡，我们应该将线程组中的线程数设置为 32 的倍数来达到最佳性能**。
如果是 AMD 显卡的话，线程组中的线程则是被划分成一个个由 64 个线程组成 **Wavefront**，那么线程组中的线程数应该设置为 64 的倍数。
>**建议 numthreads 值设为 64 的倍数，这样可以同时顾及到两大主流的显卡。**

在 Direct3D12 中，可以**通过 `ID3D12GraphicsCommandList::Dispatch(gX,gY,gZ)` 方法创建 `gX*gY*gZ` 个线程组。**（dispatch：调度）

**注意顺序，先 `numthreads` 定义好每个核函数对应线程组里线程的数量（`tX*tY*tZ`），再用 `Dispatch` 定义用多少线程组 (`gX*gY*gZ`) 来处理这个核函数**。

`gX，gY，gZ` 在不同的版本里有如下的约束：

<table data-draft-node="block" data-draft-type="table" data-size="normal" data-row-style="normal"><tbody><tr><th>Compute Shader 版本</th><th>gX 和 gY 的最大取值</th><th>gZ 的最大取值</th></tr><tr><td>cs_4_x</td><td>65535</td><td>1</td></tr><tr><td>cs_5_0</td><td>65535</td><td>65535</td></tr></tbody></table>

## 线程参数
接着我们用一张示意图来看看线程与线程组的结构，如下图：

![[ddc124d5a3fccbf870af69a09af2330f_MD5.jpg]]
>定义了 $5*3*2=30$ 个线程组来处理这个核函数，$(2,1,0)$ 这个线程组内的线程数量为 $10*8*3=240$ 个。

上半部分代表的是线程组结构，下半部分代表的是单个线程组里的线程结构。因为他们都是由 (X,Y,Z) 来定义数量的，因此就像一个三维数组，下标都是从 0 开始。我们可以把它们看做是表格一样：**有 Z 个一样的表格，每个表格有 X 列和 Y 行**。例如线程组中的 (2,1,0)，就是第 1 个表格的第 2 行第 3 列对应的线程组，下半部分的线程也是同理。

**对于每个线程，有四个参数：**

|参数|值|含义|取值范围|
|:--|:--|:--|:--|
|SV_GroupThreadID|int3|当前线程在所在线程组内的 ID。| $(0,0,0)$ 到$(tX-1,tY-1,tZ-1)$|
|SV_GroupID |int3 |当前线程所在的线程组的 ID| $(0,0,0)$ 到$(gX-1,gY-1,gZ-1)$|
|SV_DispatchThreadID|int3|当前线程在所有线程组中的所有线程里的 ID| $(0,0,0)$ 到 $(gX*tX-1, gY*tY-1, gZ*tZ-1)$| |
|SV_GroupIndex|int|当前线程在所在线程组内的下标| $0$ 到 $tX*tY*tZ-1$| |


这里需要注意的是，不管是 group 还是 thread，它们的**顺序都是先 X 再 Y 最后 Z**，用表格的理解就是先行 (X) 再列 (Y) 然后下一个表(Z)，例如我们 tX=5，tY=6 那么第 1 个 thread 的 SV_GroupThreadID=(0,0,0)，第 2 个的 SV_GroupThreadID=(1,0,0)，第 6 个的 SV_GroupThreadID=(0,1,0)，第 30 个的 SV_GroupThreadID=(4,5,0)，第 31 个的 SV_GroupThreadID=(0,0,1)。group 同理，搞清顺序后，SV_GroupIndex 的计算公式就很好理解了。

再举个例子，比如 SV_GroupID 为 (0,0,0) 和(1,0,0)的两个 group，它们内部的第 1 个 thread 的 SV_GroupThreadID 都为 (0,0,0) 且 SV_GroupIndex 都为 0，但是前者的 SV_DispatchThreadID=(0,0,0)而后者的 SV_DispatchThreadID=(tX,0,0)。

## 核函数

```c
void CSMain (uint3 id : SV_DispatchThreadID)
{
    Result[id.xy] = float4(id.x & id.y, (id.x & 15)/15.0, (id.y & 15)/15.0, 0.0);
}
```

核函数（其实就是 Compute Shader 函数体），其中参数 `SV_DispatchThreadID` 就是当前线程在所有线程组中的所有线程里的 ID。**除了这个参数以外，我们前面提到的几个参数都可以被传入到核函数当中，根据实际需求做取舍即可**，完整如下：

```c
void KernelFunction(uint3 groupId : SV_GroupID,
    uint3 groupThreadId : SV_GroupThreadID,
    uint3 dispatchThreadId : SV_DispatchThreadID,
    uint groupIndex : SV_GroupIndex)
{
    
}
```

**Unity 默认的核函数体内执行的代码就是为我们 Texture 中下标为 id.xy 的像素赋值一个颜色，这里也就是最牛逼的地方。**

举个例子，以往我们想要给一个 xy 分辨率的 Texture 每个像素进行赋值，单线程的情况下，我们的代码往往如下：

```c
for (int i = 0; i < x; i++)
    for (int j = 0; j < y; j++)
        Result[uint2(x, y)] = float4(a, b, c, d);
```

两个循环，像素一个个的慢慢赋值。那么如果我们要每帧给很多张 2048 * 2048 的图片进行操作，可想而知会卡死你。

如果使用多线程，为了避免不同的线程对同一个像素进行操作，我们往往使用分段操作的方法，如下，四个线程进行处理：

```c
void Thread1()
{
    for (int i = 0; i < x/4; i++)
        for (int j = 0; j < y/4; j++)
            Result[uint2(x, y)] = float4(a, b, c, d);
}

void Thread2()
{
    for (int i = x/4; i < x/2; i++)
        for (int j = y/4; j < y/2; j++)
            Result[uint2(x, y)] = float4(a, b, c, d);
}

void Thread3()
{
    for (int i = x/2; i < x/4*3; i++)
        for (int j = x/2; j < y/4*3; j++)
            Result[uint2(x, y)] = float4(a, b, c, d);
}

void Thread4()
{
    for (int i = x/4*3; i < x; i++)
        for (int j = y/4*3; j < y; j++)
            Result[uint2(x, y)] = float4(a, b, c, d);
}
```

这么写不是很蠢么，如果有更多的线程，分成更多段，不就一堆重复的代码。但是**如果我们能知道每个线程的开始和结束下标，不就可以把这些代码统一起来了么，如下：**

```c
void Thread(int start, int end) {
    for (int i = start; i < end; i++)
        for (int j = start; j < end; j++)
            Result[uint2(x, y)] = float4(a, b, c, d);
}
```

那我要是可以开出很多很多的线程关联起来，start 在所有线程的最前面，end 在所有线程的末尾。是不是就可以一个线程处理一个像素了？
>这里可以想到，用 `SV_DispatchThreadID` 就可以将所有线程都联系起来。轻松获得 start 和 end 的索引

```c
void Thread(int x, int y) {
    Result[uint2(x, y)] = float4(a, b, c, d);
}
```

用 CPU 我们做不到这样，但是用 GPU，用 CS 我们就可以，实际上，前面默认的 CS 的代码里，核函数的内容就是这样的—— 。

接下来我们来看看 CS 的妙处，**看 id.xy 的值**。id 的类型为 `SV_DispatchThreadID`，我们先来回忆下 SV_DispatchThreadID 的计算公式：

假设该线程的 `SV_GroupID=(a, b, c)`，`SV_GroupThreadID=(i, j, k) `那么 `SV_DispatchThreadID=(a*tX+i, b*tY+j, c*tZ+k)`
首先前面我们使用了 ` [numthreads(8,8,1)]`，即 tX=8，tY=8，tZ=1 ，且 i 和 j 的取值范围为 0 到 7，而 k=0。那么：
- 线程组(0,0,0) 中所有线程的 `SV_DispatchThreadID.xy` 也就是 `id.xy` 的取值范围即为 (0,0) 到 (7, 7)
- 线程组 (1,0,0) 中它的取值范围为 (8,0) 到 (15, 7)，
- ...
- 线程组 (0,1,0) 中它的取值范围为 (0,8) 到 (7, 15)
- ...
- 线程组 (a,b,0) 中它的取值范围为 (a*8, b*8, 0) 到(a*8+7, b*8+7, 0)。

我们用示意图来看下，假设下图每个网格里包含了 64 个像素，`id.xy` 一一对应这些像素。
每个线程组会有 64 个线程同步处理 64 个像素，并且不同的线程组里的线程不会重复处理同一个像素，若要处理分辨率为 `1024*1024` 的图，我们只需要 `dispatch(1024/8, 1024/8, 1)` 个线程组。

**即如果我们的 RT 分辨率为 `x*y`，` [numthreads(8,8,1)]`，那么就要 `dispatch(x/8, y/8,1)` 个线程组。**

![[58127c8f1c3c3ff68c3020ac26d40711_MD5.jpg]]

这样就实现了成百上千个线程同时处理一个像素了，若用 CPU 的方式这是不可能的。是不是很妙？

**而且我们可以发现 `numthreads` 中设置的值是很值得推敲的，例如我们有 `4*4` 的矩阵要处理，那么设置 `numthreads(4,4,1)`，那么每个线程的 `SV_GroupThreadID.xy` 的值不正好可以和矩阵中每项的下标对应上么。**

那么我们在 Unity 中怎么调用核函数，又怎么 dispatch 线程组以及使用的 RWTexture 又怎么来呢？这里就要回到我们 C# 的部分了。

# 相关脚本

以往的 Vertex & Fragment shader 我们都是给它关联到 Material 上来使用的，但是 CS 不一样，它是**由脚本来驱动**的。

先新建一个 monobehaviour 脚本，Unity 为我们提供了一个 **ComputeShader** 的类型用来引用我们前面生成的 .compute 文件：

```cs
public ComputeShader computeShader;
```

![[495aad692836b0c86178e6b2d23cbe2e_MD5.png]]

此外我们再关联一个 Material，因为 CS 处理后的纹理，依旧要经过 FragmentShader 采样后来显示。

```cs
public Material material;
```

这个 Material 我们使用一个 Unlit Shader，并且纹理不用设置，如下：

![[ae82d866386602efa8e27c0242a364d3_MD5.jpg]]

然后关联到我们的脚本上，并且随便建个 Cube 也关联上这 Material。

接着我们可以将 Unity 中的 **RenderTexture** 赋值到 CS 中的 RWTexture2D 上，但是需要注意因为我们是多线程处理像素，这个处理过程是**无序**的 **(随机访问)**，因此我们要将 RenderTexture 的 `enableRandomWrite` 属性设置为 true，代码如下：

```cs
RenderTexture mRenderTexture = new RenderTexture(256, 256, 16);
mRenderTexture.enableRandomWrite = true;
mRenderTexture.Create();
```

我们创建了一个分辨率为 `256*256` 的 RenderTexture，首先我们要把它赋值给我们的 Material，这样我们的 Cube 就会显示出它。然后要把它赋值给我们 CS 中的 Result 变量，代码如下：

```cs
material.mainTexture = mRenderTexture;
computeShader.SetTexture(kernelIndex, "Result", mRenderTexture);
```

这里有一个 `kernelIndex` 变量，即核函数下标，我们可以利用 `FindKernel` 来找到我们声明的核函数的下标：

```cs
int kernelIndex = computeShader.FindKernel("CSMain");
```

这样在我们 Fragment Shader 采样的时候，采样的就是 CS 处理过后的纹理：

```cs
fixed4 frag (v2f i) : SV_Target
{
    // _MainTex 就是被处理后的 RenderTexture
    fixed4 col = tex2D(_MainTex, i.uv);
    return col;
}
```

注：此时没有将 CS 的处理结果从 GPU 回读到 CPU 的操作，因为处理结果直接输入到渲染管线中由 Fragment Shader 进行处理了。

最后就是开线程组和调用我们的核函数了，C# 的 ComputeShader 类提供了 `Dispatch` 方法为我们一步到位：

```cs
computeShader.Dispatch(kernelIndex, 256 / 8, 256 / 8, 1);
```

为什么是 256/8，前面已经解释过了。来看看效果：

![[91182deb05e7a63a94bbd71a3bb4d1ec_MD5.jpg]]

上图就是我们 Unity 默认生成的 CS 代码所能带来的效果，我们也可试下用它处理 `2048*2048` 的 Texture，也是非常快的。

```cs file:案例代码
public class NewBehaviourScript : MonoBehaviour
{
    public ComputeShader computeShader;
    public Material material;
    private int kernelIndex;
    void Start()
    {
        RenderTexture RT = new RenderTexture(256, 256, 16);
        
        //RWTexture为UAV类型，支持无序(随机）访问读写操作
        RT.enableRandomWrite = true; 
        RT.Create();
        
        //核函数索引
        kernelIndex = computeShader.FindKernel("CSMain");
        //RT设置到核函数的RWTexture2D中
        computeShader.SetTexture(kernelIndex, "Result", RT);
        
        //将RT赋值给材质
        //片元着色器采样_MainTex，此时_MainTex是经过computeshader处理的RT
        material.mainTexture = RT;
        
        //调度线程组，执行核函数
        computeShader.Dispatch(kernelIndex, 256 / 8, 256 / 8, 1);
    }
}
```

# ComputeBuffer
以一个粒子功能来解释：

首先一个粒子通常拥有颜色和位置两个属性，并且我们肯定是要在 CS 里去处理这两个属性的，那么我们就可以在 CS 创建一个 struct 来存储：

```cs
struct ParticleData {
	float3 pos;
	float4 color;
};
```

**粒子肯定是很多很多的，我们就需要一个像 List 一样的东西来存储它们，HLSL 为我们提供了 `RWStructuredBuffer` 类型。**

## RWStructuredBuffer

它是一个可读写的 buffer，并且我们**可以指定 buffer 中的数据类型为我们自定义的 struct 类型**，不用再局限于 int，float 这类的基本类型。因此我们可以这么定义我们的粒子数据：

```cs
RWStructuredBuffer<ParticleData> ParticleBuffer;
```

为了有动效，我们可以再添加一个时间相关值，我们可以根据时间来修改粒子的位置和颜色：

```cs
float Time;
```

接着就是怎么在核函数里修改我们的粒子信息了，要修改某个粒子，我们肯定要知道粒子在 buffer 中的下标，并且这个下标在不同的线程中不能重复，否则就可能导致多个线程修改同一个粒子了。

根据前面的介绍，我们知道一个线程组中 `SV_GroupIndex` 是唯一的，但是在不同线程组中并不是，例如每个线程组内有 1000 个线程，那么 `SV_GroupID` 都是 0 到 999。那么我们可以根据 SV_GroupID 把它叠加上去，例如 SV_GroupID=(0,0,0)时 `SV_GroupIndex` 是 0-999，SV_GroupID=(1,0,0) 时 `SV_GroupIndex` 是 1000-1999 等等，为了方便我们的线程组就可以是 (X,1,1) 格式。然后我们就可以根据 Time 和 Index 随便的摆布下粒子，CS 完整代码：

```cs
#pragma kernel UpdateParticle

struct ParticleData {
	float3 pos;
	float4 color;
};

RWStructuredBuffer<ParticleData> ParticleBuffer;

float Time;

[numthreads(10, 10, 10)]
void UpdateParticle(uint3 gid : SV_GroupID, uint index : SV_GroupIndex) {
	int pindex = gid.x * 1000 + index;
	
	float x = sin(index);
	float y = sin(index * 1.2f);
	float3 forward = float3(x, y, -sqrt(1 - x * x - y * y));
	ParticleBuffer[pindex].color = float4(forward.x, forward.y, cos(index) * 0.5f + 0.5, 1);
	if (Time > gid.x)
		ParticleBuffer[pindex].pos += forward * 0.005f;
}
```

接下来我们要在 C# 里给粒子初始化并且传递给 CS。我们要传递粒子数据，也就是说要给前面的 `RWStructuredBuffer<ParticleData>` 赋值，Unity 为我们提供了 **ComputeBuffer 类来与 RWStructuredBuffer 或 StructuredBuffer 相对应**。

## ComputeBuffer

在 CS 中经常需要**将我们一些 CPU 中自定义的 Struct 数据读写到显存中**，ComputeBuffer 就是为这种情况而生的。我们可以在 C# 里创建并填充它，然后传递到 CS 或者其他 Shader 中使用。通常我们用下面方法来创建它：

```c
ComputeBuffer buffer = new ComputeBuffer(int count, int stride)
```

- `count` ： buffer 中元素的数量
- `stride` ：每个元素占用的空间（字节）
- 例如我们传递 10 个 float 的类型，那么 count=10，stride=4。需要注意的是 **ComputeBuffer 中的 stride 大小必须和 RWStructuredBuffer 中每个元素的大小一致**。

声明完成后我们可以使用 SetData 方法来填充，参数为自定义的 struct 数组：

```c
buffer.SetData(T[]);
```

最后我们可以使用 ComputeShader 类中的 SetBuffer 方法来把它传递到 CS 中：

```c
public void SetBuffer(int kernelIndex, string name, ComputeBuffer buffer)
```

记得用完后把它 `Release()` 掉。

---

在 C# 中我们定义一个一样的 Struct，这样才能保证和 CS 中的大小一致：

```cs
public struct ParticleData
{
    public Vector3 pos;//等价于float3
    public Color color;//等价于float4
}
```

然后我们在 Start 方法中声明我们的 ComputeBuffer，并且找到我们的核函数：

```cs
void Start() {
    //struct中一共7个float，size=28
    mParticleDataBuffer = new ComputeBuffer(mParticleCount, 28);
    ParticleData[] particleDatas = new ParticleData[mParticleCount];
    mParticleDataBuffer.SetData(particleDatas);
    kernelId = computeShader.FindKernel("UpdateParticle");
}
```

由于我们想要我们的粒子是运动的，即每帧要修改粒子的信息。因此我们在 Update 方法里去传递 Buffer 和 Dispatch：

```cs
void Update() {
    computeShader.SetBuffer(kernelId, "ParticleBuffer", mParticleDataBuffer);
    computeShader.SetFloat("Time", Time.time);
    computeShader.Dispatch(kernelId,mParticleCount/1000,1,1);
}
```

到这里我们的粒子位置和颜色的操作都已经完成了，但是这些数据并不能在 Unity 里显示出粒子，我们还需要 Vertex & FragmentShader 的帮忙，我们新建一个 UnlitShader，修改下里面的代码如下：

```cs
Shader "Custom/ParticleShader"
{
    Properties
    {
    }
    
    SubShader
    {
        Tags
        {
            "RenderPipeline" = "UniversalPipeline"
            "RenderType"="Opaque"
        }
    
        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        
        struct Attributes
        {
            float4 positionOS : POSITION;
            float4 color : COLOR;
            uint id : SV_VertexID; //顶点 ID，必须为uint
        };

        struct Varyings
        {
            float4 positionCS : SV_POSITION;
            float4 color : COLOR;
        };

        //用于接收ComputeBuffer数据
        StructuredBuffer<Varyings> _particleDataBuffer;
        
        ENDHLSL
        
        Pass
        {
            Tags
            {
                "LightMode" = "UniversalForward"
            }
            
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            Varyings vert(Attributes i)
            {
                Varyings o = (Varyings)0;
                o.positionCS = TransformObjectToHClip(_particleDataBuffer[i.id].positionCS);
                o.color = _particleDataBuffer[i.id].color;
                return o;
            }

            float4 frag(Varyings i) : SV_Target
            {
                return i.color;
            }
            ENDHLSL
        }
    }
    FallBack "Packages/com.unity.render-pipelines.universal/FallbackError"
}
```

前面我们说了 ComputeBuffer 也可以传递到普通的 Shader 中，因此我们在 Shader 中也创建一个结构一样的 Struct，然后利用 `StructuredBuffer<T>` 来接收。

[[1 ShaderLab#顶点 ID：SV_VertexID|SV_VertexID]]： 在 VertexShader 中用它来作为传递进来的参数，代表顶点的下标。我们有多少个粒子即有多少个顶点。顶点数据使用我们在 CS 中处理过的 buffer。

最后我们在 C# 中关联一个带有上面 shader 的 material，然后将粒子数据传递过去，最终绘制出来。完整代码如下：

```cs
public class ParticleEffect : MonoBehaviour
{
    public ComputeShader computeShader;
    public Material material;

   
    ComputeBuffer m_ParticleDataBuffer;  //ComputeBuffer,对应RWStructuredBuffer
    public const int ParticleCount = 1000; //粒子数量
    int m_KernelIndex;  //核函数索引
    
    //粒子结构体，要保证和computeshader中的结构一致
    struct ParticleData {
        public Vector3 Pos;   //等价于float3
        public Vector4 Color; //等价于float4
    };
    
    void Start()
    {
        //初始化ComputeBuffer
        m_ParticleDataBuffer = new ComputeBuffer(ParticleCount, 28);
        
        //初始化粒子结构体
        ParticleData[] particleDatas = new ParticleData[ParticleCount];
        
        //填充ComputeBuffer
        m_ParticleDataBuffer.SetData(particleDatas);
        
        //设置核函数索引
        m_KernelIndex = computeShader.FindKernel("UpdateParticle");
    }

    void Update()
    {
        //将ComputeBuffer数据传递到computeshader声明的RWStructuredBuffer(注意name别写错了)
        computeShader.SetBuffer(m_KernelIndex, "ParticleDataBuffer", m_ParticleDataBuffer);
        computeShader.SetFloat("Time",Time.time);
        
        //为了方便我们的线程组就采用 (X,1,1) 格式。然后我们就可以根据 Time 和 Index 随便的摆布下粒子
        computeShader.Dispatch(m_KernelIndex,ParticleCount/1000,1,1);
        
        //将ComputeBuffer数据传递到shader声明的StructuredBuffer
        material.SetBuffer("_particleDataBuffer",m_ParticleDataBuffer);

    }

    private void OnRenderObject()
    {
        material.SetPass(0);
        //绘制几何
        Graphics.DrawProceduralNow(MeshTopology.Points,ParticleCount);
    }

    private void OnDestroy()
    {
        m_ParticleDataBuffer.Release();
        m_ParticleDataBuffer.Dispose();
    }
}
```

**material.SetBuffer**：传递 ComputeBuffer 到我们的 shader 当中。

**OnRenderObject**：摄像机渲染场景后调用，该方法里我们可以自定义绘制几何。

**DrawProceduralNow**：我们可以用该方法绘制几何，第一个参数是拓扑结构，第二个参数数顶点数。

最终得到的效果如下：

![[e5eb8fc2d177387516bba61aefdc4030_MD5.gif]]

## ComputeBufferType

在例子中，我们 new 一个 ComputeBuffer 的时候并没有使用到 [ComputeBufferType](https://docs.unity3d.com/ScriptReference/ComputeBufferType.html) 的参数，默认使用了 ComputeBufferType.Default。实际上我们的 ComputeBuffer 可以有多种不同的类型对应 [HLSL 中不同的 Buffer](https://docs.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-cs-resources)，来在不同的场景下使用，一共有如下几种类型：

|Type|描述|  |
|:--|:--|:--|
|Default|ComputeBuffer 的默认类型，对应 HLSL shader 中的 StructuredBuffer 或 RWStructuredBuffer，常用于自定义 Struct 的 Buffer 传递。|  |
|Raw|Byte Address Buffer，把里面的内容（byte）做偏移，可用于寻址。它对应 HLSL shader 中的 ByteAddressBuffer 或 RWByteAddressBuffer，用于着色器访问的底层 DX11 格式为无类型的 R32。|  |
|Append|Append and Consume Buffer，允许我们像处理 Stack 一样处理 Buffer，例如动态添加和删除元素。它对应 HLSL shader 中的 AppendStructuredBuffer 或 ConsumeStructuredBuffer。|  |
|Counter|用作计数器，可以为 RWStructuredBuffer 添加一个计数器，然后在 ComputeShader 中使用 IncrementCounter 或 DecrementCounter 方法来增加或减少计数器的值。由于 Metal 和 Vulkan 平台没有原生的计数器，因此我们需要一个额外的小 buffer 用来做计数器。|  |
|Constant|constant buffer (uniform buffer)，该 buffer 可以被当做 Shader.SetConstantBuffer 和 Material.SetConstantBuffer 中的参数。如果想要绑定一个 structured buffer 那么还需要添加 ComputeBufferType.Structured，但是在有些平台（例如 DX11）不支持一个 buffer 即是 constant 又是 structured 的。|  |
|Structured|如果没有使用其他的 ComputeBufferType 那么等价于 Default。|  |
|IndirectArguments|被用作 Graphics.DrawProceduralIndirect，ComputeShader.DispatchIndirect 或 Graphics.DrawMeshInstancedIndirect 这些方法的参数。buffer 大小至少要 12 字节，DX11 底层 UAV 为 R32_UINT，SRV 为无类型的 R32。|  |

举个例子，在做 GPU 剔除的时候经常会使用到 Append 的 Buffer（例如后面介绍的用 CS 实现视椎剔除），C# 中的声明如下：

```cs
var buffer = new ComputeBuffer(count, sizeof(float), ComputeBufferType.Append);
```

>Default，Append，Counter，Structured 对应的 Buffer 每个元素的大小，也就是 stride 的值应该是 4 的倍数且小于 2048。

上述 ComputeBuffer 可以对应 CS 中的 AppendStructuredBuffer，然后我们可以在 CS 里使用 Append 方法为 Buffer 添加元素，例如：

```cs
AppendStructuredBuffer<float> result;

[numthreads(640, 1, 1)]
void ViewPortCulling(uint3 id : SV_DispatchThreadID)
{
    if(满足一些自定义条件)
        result.Append(value);
}
```

那么我们的 buffer 中到底有多少个元素呢？计数器可以帮助我们得到这个结果。

在 C# 中，我们可以先使用 ComputeBuffer.SetCounterValue 方法来初始化计数器的值，例如：

```cs
buffer.SetCounterValue(0);//计数器值为0
```

随着 AppendStructuredBuffer.Append 方法，我们计数器的值会自动的 ++。当 CS 处理完成后，我们可以使用 `ComputeBuffer.CopyCount` 方法来获取计数器的值，如下：

```cs
public static void CopyCount(ComputeBuffer src, ComputeBuffer dst, int dstOffsetBytes);
```

Append，Consume 或者 Counter 的 buffer 会维护一个计数器来存储 buffer 中的元素数量，该方法可以把 src 中的计数器的值拷贝到 dst 中，dstOffsetBytes 为在 dst 中的偏移。在 DX11 平台 dst 的类型必须为 Raw 或者 IndirectArguments，而在其他平台可以是任意类型。

因此获取 buffer 中元素数量的代码如下：

```cs
uint[] countBufferData = new uint[1] { 0 };
var countBuffer = new ComputeBuffer(1, sizeof(uint), ComputeBufferType.IndirectArguments);
ComputeBuffer.CopyCount(buffer, countBuffer, 0);
countBuffer.GetData(countBufferData);
//buffer中的元素数量即为：countBufferData[0]
```

# UAV

通常我们 Shader 中使用的资源被称作为 **`SRV`（Shader resource view）**，例如 Texure2D，它是**只读**的。
但是在 Compute Shader 中，我们往往需要对 Texture 进行写入的操作，因此 SRV 不能满足我们的需求，而应该使用一种新的类型来绑定我们的资源，即 **`UAV` (无序访问视图)。它允许来自多个线程临时的无序读 / 写操作，这意味着该资源类型可以由多个线程同时读 / 写，而不会产生内存冲突。**

前面我们提到了 RWTexture，RWStructuredBuffer 这些类型都属于 UAV 的数据类型，并且它们**支持在读取的同时写入**。它们只能在 Fragment Shader 和 Compute Shader 中被使用（绑定）。

**如果我们的 RenderTexture 不设置 enableRandomWrite，或者我们传递一个 Texture 给 RWTexture，那么运行时就会报错：**
the texture wasn't created with the UAV usage flag set!

# groupshared

我们可以通过 `Dispatch` 操作执行很多的线程组，每个线程组都有一块属于它们自己的内存空间，我们称之为（组内）共享内存或线程本地存储。线程组内的所有线程都可以对当前线程组的共享内存进行访问，但是没法访问别的线程组的共享内存。

**通过 `groupshared` 关键字声明的变量会被存放在共享内存中**：
```cs
groupshared float4 vec;
```

每个线程组都会有自己对应的 vec 变量，当前线程组对 vec 的修改不会影响到别的线程组的 vec 值。

Direct3D 11 以来，共享内存支持的最大大小为 32kb（之前的版本是 16kb），并且单个线程最多支持对共享内存进行 256byte 的写入操作。

**线程访问共享内存的速度非常的快，可以认为与硬件缓存一样快。我们常用它来缓存像素值，来避免不同线程之间重复采样的操作（采样是一个比较耗时的操作）**:

```cs
Texture2D input;
groupshared float4 cache[256];

[numthreads(256, 1, 1)]
void CS(int3 groupThreadID : SV_GroupThreadID, int3 dispatchThreadID : SV_DispatchThreadID)
{
    cache[groupThreadID.x] = input[dispatchThreadID.xy];

    GroupMemoryBarrierWithGroupSync();

    float4 left = cache[groupThreadID.x - 1];
    float4 right = cache[groupThreadID.x + 1];
    ......
}
```

**其中 `GroupMemoryBarrierWithGroupSync` 起到组内线程同步的作用。** 该函数会阻塞线程组中所有线程的执行，直到所有共享内存的访问完成并且线程组中的所有线程都执行到此调用。这样就避免了当我们在读取共享内存的时候，它却还没有写入完成的问题。

# 移动端支持问题

我们可以运行时调用 **`SystemInfo.supportsComputeShaders`** 来判断当前的机型是否支持 CS。其中 OpenGL ES 从 3.1 版本才开始支持 CS，而使用 Vulkan 的 Android 平台以及使用 Metal 的 IOS 平台都支持 CS。

然而有些 Android 手机即使支持 CS，但是对 RWStructuredBuffer 的支持并不友好。例如在某些 OpenGL ES 3.1 的手机上，只支持 Fragment Shader 内访问 StructuredBuffer。

在普通的 shader 中要支持 CS，shader model 最低要求为 4.5，即：

```
#pragma target 4.5
```


# Shader.PropertyToID

在 CS 中定义的变量依旧可以通过 `Shader.PropertyToID("name") `的方式来获得唯一 id。这样当我们要频繁利用 ComputeShader.SetBuffer 对一些相同变量进行赋值的时候，就可以把这些 id 事先缓存起来，避免造成 GC。

```cs
int grassMatrixBufferId;
void Start() {
    grassMatrixBufferId = Shader.PropertyToID("grassMatrixBuffer");
}
void Update() {
    compute.SetBuffer(kernel, grassMatrixBufferId, grassMatrixBuffer);
    
    // dont use it
    //compute.SetBuffer(kernel, "grassMatrixBuffer", grassMatrixBuffer);
}
```

# 全局变量或常量？

假如我们要实现一个需求，在 CS 中判断某个顶点是否在一个固定大小的包围盒内，那么按照以往 C# 的写法，我们可能如下定义包围盒大小：

```cs
#pragma kernel CSMain

float3 boxSize1 = float3(1.0f, 1.0f, 1.0f); // 方法1
const float3 boxSize2 = float3(2.0f, 2.0f, 2.0f); // 方法2
static float3 boxSize3 = float3(3.0f, 3.0f, 3.0f); // 方法3

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
    // 做判断
}
```

经过测试，其中方法 1 和方法 2 的定义，在 CSMain 里读取到的值都为 float3(0.0f,0.0f,0.0f) ，只有方法 3 才是最开始定义的值。

# 变体

CS 同样支持 [shader 变体](https://docs.unity3d.com/2020.3/Documentation/Manual/SL-MultipleProgramVariants.html)，用法和普通的 shader 变体基本相似，示例如下：

```
#pragma kernel CSMain
#pragma multi_compile __ COLOR_WHITE COLOR_BLACK

RWTexture2D<float4> Result;

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
#if defined(COLOR_WHITE)
	Result[id.xy] = float4(1.0, 1.0, 1.0, 1.0);
#elif defined(COLOR_BLACK)
	Result[id.xy] = float4(0.0, 0.0, 0.0, 1.0);
#else
	Result[id.xy] = float4(id.x & id.y, (id.x & 15) / 15.0, (id.y & 15) / 15.0, 0.0);
#endif
}
```

然后我们就可以在 C# 端启用或禁用某个变体了：

*   #pragma multi_compile 声明的全局变体可以使用 Shader.EnableKeyword/Shader.DisableKeyword 或者 ComputeShader.EnableKeyword/ComputeShader.DisableKeyword
*   #pragma multi_compile_local 声明的局部变体可以使用 ComputeShader.EnableKeyword/ComputeShader.DisableKeyword

示例如下：

```
public class DrawParticle : MonoBehaviour
{
    public ComputeShader computeShader;

    void Start() {
        ......
        computeShader.EnableKeyword("COLOR_WHITE");
    }
}
```