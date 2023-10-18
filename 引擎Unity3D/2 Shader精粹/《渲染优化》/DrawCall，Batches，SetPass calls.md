# DrawCall，Batches，SetPass calls是什么？原理？
[DrawCall，Batches，SetPass calls是什么？原理？【匠】 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/353856280)
这三个值大家应该比较眼熟，也就是Unity点击Stats弹出的窗口里的信息。

![[371b89f03dcefbcb22e07e85c5080cef_MD5 1.webp]]

官网渲染 Statistics 窗口信息：[https://docs.unity.cn/cn/current/Manual/RenderingStatistics.html](https://link.zhihu.com/?target=https%3A//docs.unity.cn/cn/current/Manual/RenderingStatistics.html)

## 先来看看 CPU 到 GPU 通信原理图：

  

![[8099c1c7d9c80760c12a04c994a6b788_MD5 1.webp]]

渲染流程如下：（内置渲染管线 / 在URP未开启SRP Batcher）

![[7df3e0549c825d05389c8d5501977033_MD5 1.webp]]

## **D**rawCall是什么？

DrawCall就是一个渲染命令，理解成它来告诉GPU渲染哪个物体即可。这个命令指向一个需要被渲染的图元（点，线，面等）列表，不包含任何材质信息，这个命令本身并没有多少开销。

## **Batches(** 批处理 **)是什么？**

其实就理解成DrawCall值就可以，一个Batch至少包含一个DrawCall，那么为什么不叫DrawCall呢？

-   **原因 1**：Unity引擎开启批处理情况下将把满足条件的多个对象的渲染组合到一个内存块中以便减少由于资源切换而导致的 CPU 开销，也就是把多个DrawCall合并成一个DrawCall，来减少调用DrawCall的开销（主要是调用DrawCall之前的一系列设置），这个操作就是批处理。
-   **原因 2：**把数据加载到显存，设置渲染状态及数据，CPU调用DrawCall的这一整个过程就是一个Batch。这个过程当中主要性能消耗点在于**上传物体数据（加载到显存）**和**设置渲染状态及数据**这一块，而不是DrawCall命令本身。

下图中的一整个流程为一个Batch

  

![[70ca3c842661a730429da10c861efa0e_MD5 1.webp]]

在下图中Batches值为3

![[f2e2ab06967ff7e4a110a59c0dbe3e21_MD5 1.webp]]

## **SetPass calls是什么？**

**官网解释：**渲染 pass 的数量。每个 pass 都需要 Unity 运行时绑定一个新的着色器。

**个人解释：**

> **内置渲染管线：**是所有材质球的渲染pass的数量。这里可能会有疑惑，拿Unity内置的 Lit Shader来举例，这Shader里有好多个Pass通道，SetPass calls值却跟Pass通道数量始终对不上，个人猜测这是因为Unity渲染时会选择Pass通道渲染，比如关闭阴影，那么Unity就不会选择阴影渲染通道也就是 ShadowCaster通道。  
> **URP：**渲染不同pass的数量**，**跟内置渲染管线不一样的是在URP不局限于材质球，也就是假如有五个材质球，但Shader和关键字都一样，这个Shader有两个Pass通道，那么这些物体的SetPass Calls值就是2。  
> 其实想想也是合理的，SetPass calls值个人猜测官网主要是想呈现跟批处理相关的值，在内置渲染管线只能批处理使用同样材质球的物体，所以这个值为所有材质球的渲染Pass通道数量，在URP开启SRP Batcher情况下呢，是根据相同Shader变体的pass进行合批。

### 下面是**默认渲染管线**和**URP**上的SetPass calls值 实验。

假如 场景当中（关闭其他因素的情况下，如阴影，天空盒等，为了更方便计算）摄像机照射范围内有9个物体，用的都是一个Shader的情况下，4个物体分别用不同材质球，剩下5个物体使用同一个材质球时，那么一共有5个材质球。

### **默认渲染管线：**

> 不同颜色代表着不同的材质球  

![[bf461e49ee6f8bc480d2db2402cbbf3c_MD5 1.webp]]

​  
**结论：**SetPass calls值等同于材质球的pass数量（关掉了阴影，所以没有走阴影Pass通道）

### URP

> **未开启SRP Batcher情况下**（不同颜色代表着不同的材质球）

![[475156acaaf6d4fbf192eeabc677b2c5_MD5 1.webp]]

  
**开启SRP Batcher情况下**（不同颜色代表着不同的材质球）  

![[253735ef07133b37bd682355a43349d5_MD5 1.webp]]

  
**结论：**未开启SRP Batcher情况下跟内置管线一样，开启SRP Batcher情况下等同于渲染状态（pass）切换次数。

## 额外内容

CPU和GPU通信原理参考来自UnityShader入门精要（书籍） 和 RenderDoc抓帧数据。

以下是用RenderDoc抓的每个物体DrawCall图

![[cb9c82c644475028a4a23cec2ecb17fc_MD5 1.webp]]

物体 1（绿色物体，Shader：Standard）

![[9778c0642513696f32de523585441a55_MD5 1.webp]]

物体 2（黄色物体，Shader：Standard）

![[6c20c8982f9f57b8a9b17ec4b1473875_MD5 1.webp]]

物体 3（浅红色物体，Shader：Unity/Color）

![[61c1d5893d7e9efe5407f85ba314b513_MD5 1.webp]]

![[5bca81cc5602676a87148ea36cc06e80_MD5 1.webp]]

重点关注glUniform4fv和glUseProgram即可。

## 参考：

1.  UnityShader入门精要（书籍）
2.  Batch, Draw Call, Setpass Call：[https://zhuanlan.zhihu.com/p/76](https://zhuanlan.zhihu.com/p/76562300)