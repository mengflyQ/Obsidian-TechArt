导语：本文适用于完全不了解可微渲染，原本不是 AI 专业研究、从业人员想急速了解可微渲染相关概念的同学，特别比如像我这样的传统游戏程序员想对可微渲染的概念做一个快速了解的人。基于可微渲染的 AIGC（目前主要是减面、LOD、蒙皮）在很多游戏中已有应用，但是在工作中优先接触到这一块的反而可能是美术、TA，只有极个别的程序会有一些原因接触到。

本人是游戏程序员，谈及应用时会从游戏的背景出发。这篇文章可微渲染出发，也会提及神经渲染、NeRF 等，考虑到很多传统游戏程序员不会对神经网络了解，也会顺带简介神经网络（只有三张 ppt，保证极简）。

我自己也不是这个领域的专家，只是出于一些机缘巧合的原因来学习，这里也是我自己目前的一个学习记录和整理。因为目标是急速了解，有些地方可能更偏向于大白话，如有错误欢迎指正。

文中 ppt 为我本人整理，糅合了大量资料，这里都会给出引用链接，可以看详细内容也可以仅看快速的概括内容。

![[1684928623232.png]]

什么是可微渲染？我们考虑将渲染的输入（场景，材质，光照等）视为各种参数，然后最终结果对参数求偏导

![[1684928623300.png]]

传统的光栅化渲染管线不可微，主要是光栅化、深度混合阶段都是离散的

![[1684928623342.png]]

OpenDR 采用近似导数的方法

关于 OpenDR 知乎上也有很多其它的文章：

[[一) ：OpenDR](https://zhuanlan.zhihu.com/p/584510853|Riser：理解可微渲染 (一) ：OpenDR]]

[邹晓航：OpenDR 论文笔记](https://zhuanlan.zhihu.com/p/631670088)

概括出处：[从传统渲染到可微渲染: 基本原理、方法和应用 - 中国知网](https://kns.cnki.net/kcms/detail/detail.aspx?dbcode=CJFD&dbname=CJFDLAST2021&filename=PZKX202107001&uniplatform=NZKPT&v=B1OrfO5a1pZ5_HqNBd3j2ihVrQZKDSqyYuRblImlzrCbwKzk7fpirEThnRBpRLLd)

![[1684928623383.png]]

SoftRas 使用概率分布的公式

![[1684928623418.png]]

概率分布的光栅化和聚合函数

[[二) ：Soft Rasterizer](https://zhuanlan.zhihu.com/p/585346760|Riser：理解可微渲染 (二) ：Soft Rasterizer]]

![[1684928623454.png]]

Nvdiffrast 的方法其实比较重要，它与游戏引擎的渲染架构比较契合，从 **Rasterization，Interpolation，Texture filtering，Antialiasing** 四个角度入手。不过它的原理我暂时也没理解太懂，之前有同事分享也过了，希望能有大神可以在知乎分享。

[Modular Primitives for High-Performance Differentiable Rendering](https://arxiv.org/abs/2011.03277)

[nvdiffrast](https://nvlabs.github.io/nvdiffrast/)

![[1684928623492.png]]

前面都是提到的都是光栅化渲染管线下的可微方法，其实谈到怎么做到可微，常提的还有微分的计算问题和光线追踪管线下的可微。

学术届往往是基于标准 PBR 渲染的研究，在游戏项目中材质可能会更加复杂，有时也需要考虑手动微分。在王者的分享中会同时自动微分和手动微分。

引用：[Mythal-- 基于可微渲染的智能资产辅助生产系统_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1UR4y117Cv/?spm_id_from=333.337.search-card.all.click&vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928623533.png]]

![[1684928623573.png]]

第一版中从 Unity Shader 到 python 代码，再借助 Pytorch 进行自动微分，第二版基于 LLVM 和微软开源的 DXC 去实现可微（具体可以去看官方分享）。

![[1684928623614.png]]

光纤追踪下的不连续问题主要是在三角形边界上，它的核心思路是把积分拆成两个部分，对于边界上的积分平摊到面上。

当然，这里只是其中一种方法的白话说明，了解细节可见

[https://shuangz.com/courses/pbdr-course-sg20/](https://shuangz.com/courses/pbdr-course-sg20/)

前文提到的[从传统渲染到可微渲染: 基本原理、方法和应用 - 中国知网](https://kns.cnki.net/kcms/detail/detail.aspx?dbcode=CJFD&dbname=CJFDLAST2021&filename=PZKX202107001&uniplatform=NZKPT&v=B1OrfO5a1pZ5_HqNBd3j2ihVrQZKDSqyYuRblImlzrCbwKzk7fpirEThnRBpRLLd)也有总结

![[1684928623651.png]]

说了那么多，回到一个问题，为什么要做可微？

其实是因为很多机器学习 / 优化算法都是利用梯度下降去做优化。比如我们有一个目标图像，由当前渲染得到的图像得到差距，然后得反过来去算，究竟是哪个参数影响了它，然后再慢慢优化。

![[1684928623693.png]]

举个例子，场景中的 mesh 也是输入的参数，我们有一张目标图像，然后不断的优化。

![[1684928623731.png]]

当然，这个例子比较复杂，直接优化 mesh 是比较难的，可能需要结合其它技术，再举个更简单的例子

mitsuba3 是一个基于光线追踪的开源可微渲染器，我们有一张目标图片，然后修改当前场景墙上的颜色，尝试通过可微渲染优化让我们修改的这个颜色逐渐恢复到目标颜色。

![[1684928623790.png]]

代码其实很简单，基于当前参数的场景渲染得到一张图片，然后和目标图片求 loss，反向传播推导优化参数，重复这个过程。

```
errors = []
for it in range(iteration_count):
    # Perform a (noisy) differentiable rendering of the scene
    image = mi.render(scene, params, spp=4)

    # Evaluate the objective function from the current rendered image
    loss = mse(image)

    # Backpropagate through the rendering process
    dr.backward(loss)

    # Optimizer: take a gradient descent step
    opt.step()

    # Post-process the optimized parameters to ensure legal color values.
    opt[key] = dr.clamp(opt[key], 0.0, 1.0)

    # Update the scene state to the new optimized values
    params.update(opt)

    # Track the difference between the current color and the true value
    err_ref = dr.sum(dr.sqr(param_ref - params[key]))
    print(f"Iteration {it:02d}: parameter error = {err_ref[0]:6f}", end='\r')
    errors.append(err_ref)
print('\nOptimization complete.')
```

![[1684928623830.png]]

再回到前面那个可微渲染与三维重建的问题，其实提到可微渲染与三维重建相关，常常会提到神经网络、神经渲染的一些东西。

我们为什么很多时候不单独提直接优化 mesh，其实也是很多人接触到可微渲染优化参数时的疑问。

![[1684928623868.png]]

![[1684928623911.png]]

直接移动优化 mesh 的格点会有一些限制，比如拓扑形状，很难从球优化成环，另外三角形数量也是确定的。

引用：[NeRF 系列公开课 01 | 基于 NeRF 的三维内容生成_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1d34y1n7fn/?spm_id_from=333.999.0.0&vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928623948.png]]

另外也涉及到一个积累与利用先验经验的问题，比如在仅有一个目标图像的情况下，我们不可能还原出模型背面的样子

引用：[神经渲染（Neural rendering）第一弹_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1jt4y1L7yD/?spm_id_from=333.999.0.0&vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928623996.png]]

![[1684928624041.png]]

![[1684928624077.png]]

也顺带简单提一下传统的三维重建算法，其主要思想是尝试通过计算去复原 3D 模型，从不同的图像中提取特征点，尝试又 2D 图像的位置还原 3D 空间的位置，得到稀疏点云后进一步重建。

引用：[从二次元到三次元的 “破壁” 计划——三维重建原理介绍 + 效果展示_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1SX4y1A76R/?spm_id_from=333.999.0.0&vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928624114.png]]

![[1684928624183.png]]

再来提下什么是神经网络

生物神经元接收其它神经元的输入信号并产生一个兴奋或抑制的输出。

人工神经元也是类似的，将其它神经元的输入加权求和，经过激活函数，产生一个输出。

引用：[神经网络与深度学习（第 1-6 讲）_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV13b4y1177W/?vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928624224.png]]

神经网络就是这些神经元的有向连接

![[1684928624257.png]]

这样的连接有什么意义？神经网络的强大之处在于它可以拟合任意函数。在训练过程中，我们不断学习神经网络的参数。

![[1684928624293.png]]

那么什么是神经渲染呢？

传统的场景通常由明确的几何（三角形网格、点云、SDF 等）、材质光照等信息描述，我们可不可以把传统的场景表达成神经网络？

![[1684928624336.png]]

![[1684928624372.png]]

NeRF 是专门为神经渲染涉及的一种网络模型

引用：[【原创】NeRF 三维重建 神经辐射场 建模 算法详解 NeRF 相关项目汇总介绍。_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1fL4y1T7Ag/?spm_id_from=333.999.0.0&vd_source=48fffbf26c1ef28d97943aeb0148bc86)

![[1684928624412.png]]

![[1684928624459.png]]

渲染过程和体绘制类似

可参考：[[NeRF)](https://zhuanlan.zhihu.com/p/606433494|deephub：100 行的 Pytorch 代码实现三维重建技术神经辐射场 (NeRF)]]

![[1684928624499.png]]

我们训练 NeRF，会得到一个由神经网络表达的场景。当然，如果我们还想得到三角形网格，还需要进一步从 NeRF 中提取重建出来。

当然，先 NeRF 训练再转传统 3D 网格这个过程是不可优化的，也有一些算法将这些过程结合起来，做到端到端的优化（所有参数联合学习，而不是分步骤学习）。

DMT：可微分渲染框架 DMT，同时预测 SDF 场的变化和空间格点的移动方向

引用：

[https://nvlabs.github.io/nvdiffrec/](https://nvlabs.github.io/nvdiffrec/)

[Deep Marching Tetrahedra: a Hybrid Representation for High-Resolution 3D Shape Synthesis](https://nv-tlabs.github.io/DMTet/)

![[1684928624533.png]]

![[1684928624567.png]]

回到 NeRF，Luma AI 就是基于 NeRF 的主要应用

引用：[Luma AI+UE5 | 扫描环境网络映射_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1x24y1w7NC/?spm_id_from=333.337.search-card.all.click)

![[1684928624600.png]]

再来聊一聊 3D AIGC，可微渲染是 3D AIGC 重要的基础概念，也有其它的流派，有基于扩散模型的。扩散模型概念上有一些差别，这次就不介绍了。

引用：[[下): 关于 3D AIGC 的务实探讨](https://zhuanlan.zhihu.com/p/613679756|胡渊鸣：Taichi NeRF (下): 关于 3D AIGC 的务实探讨]]

![[1684928624657.png]]

应用方面有一个思路是三维重建仅用于 mesh，贴图等生成等用扩散模型去做。

可微渲染在游戏领域较为成熟的落地应用：[Mythal-- 基于可微渲染的智能资产辅助生产系统_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1UR4y117Cv/?spm_id_from=333.337.search-card.all.click&vd_source=48fffbf26c1ef28d97943aeb0148bc86)（前面的图中也有引用）

![[1684928624699.png]]

一方面是提高美术生成效率，目标是一张清晰图，用低配版本去拟合（LOD 方面）

在减面质量本身其实也有提升，在特定应用下相比 Houdini 之类 PCG 减面也会有优势。

另一方面是原本很难做到的拟合，比如用一张贴图去逼近 PBR 渲染的效果、将 PBR 效果拟合到顶点色方面等。

![[1684928624735.png]]

当然 Mythal 是天美的，除了天美，其它公司 / 工作室的游戏项目有用么？其实本人听到也有很多，虽然应用面不一定大，功能没有天美的强大。还有一些 Mythal 目前也没做到，大家都在尝试的部分（比如拍照生成模型）。

文章到此结束，希望本文能对原本不了解可微渲染相关概念的同学产生帮助。