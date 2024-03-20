---
title: NeRF:Representing Scenes as Neural Radiance Fields for View Synthesis
title translation: NeRF:将场景表示为用于视图合成的神经辐射场
grade: ECCV 2020
author: Mildenhall等
date: 2020-08-03
DOI: 10.48550/arXiv.2003.08934
url:
  - http://arxiv.org/abs/2003.08934
create_time: 2023-05-06 21:54
uid: 202305062154
cssclasses:
  - academia
  - academia-rounded
banner: "[[ca177eecd11fb6fd36c5538ca5534611_MD5.png]]"
banner_y: 0.5
---

 
> [!abstract] 摘要
> 我们提出了一种方法，通过使用一组稀疏的输入视图集优化底层连续体积场景函数（an under-lying continuous volumetric scene function），实现了合成复杂场景新视图（novel views）的最好（state-of-the-art）结果。我们的算法使用全连接 (非卷积) 深度网络表示场景，其输入是单个连续的 5D 坐标 (空间位置 (x, y, z) 和观看方向 （θ，∅）)，其输出是体积密度以及在该空间位置依赖于视图的发射辐射率。（view-dependent emitted radiance）。我们通过沿相机光线查询 5D 坐标来合成视图（synthesize views），并使用经典的体渲染（volume rendering）技术将输出的颜色和密度投影到图像中。因为体渲染是自然可微的（naturally differentiable），所以优化我们的表示方法所需的唯一输入是一组具有已知摄像机位姿的图像。我们描述了如何有效地优化神经辐射场（neural radiance fields），以渲染具有复杂几何形状和外观的场景的照片级真实感新视图（photorealistic novel views），并展示了优于先前神经渲染和视图合成（view synthesis）工作的结果。查看合成结果最好以视频形式观看，因此我们敦促读者观看我们的补充视频以获得令人信服的比较。
>
>**Keywords:** scene representation, view synthesis, image-based rendering, volume rendering, 3D deep learning
**关键词：**场景表示、视图合成、基于图像的渲染、体渲染、3D 深度学习

- ? underlying continuous volumetric scene function（隐函数形式的连续体积场景函数）是这个意思吗???

# 1 Introduction

在这项工作中，我们**通过直接优化连续 5D 场景表示（continuous 5D scene representation）的参数以最小化渲染一组捕获图像的误差**，以一种新的方式解决了视图合成中长期存在的问题。

我们将静态场景表示为一个连续的 5D 函数，该函数输出空间中每一点（x，y，z）在每个方向（θ，∅）的辐射率（radiance），以及每一点的密度，其作用类似于一个微分不透明度（differential opacity）控制通过（x，y，z）的光线积累多少辐射率。

**我们的方法通过从单个 5D 坐标（x，y，z，θ，∅）回归到单个体积密度和视角相关 RGB 颜色（a single volume density and view-dependent RGB color），优化了一个没有任何卷积层的深度全连接神经网络（通常称为多层感知机或 MLP）。** 

**为了从一个特定的视角渲染这个神经辐射场（NeRF），我们：**
1. 相机光线步进穿过场景，生成一组采样的三维点。
2. 将这些点和它们相应的 2D 观察方向作为神经网络的输入，产生一组颜色和密度的输出。
3. 使用经典的体渲染技术，将这些颜色和密度累积到一个 2D 图像中。

> [!example] 
> 
![[f2310459741bfc15287288399fc1a55b_MD5.png|750]] 
> 
图 1：我们提出了一种方法，优化了一组输入图像中的场景的连续 5D 神经辐射场表示（任何连续位置的体积密度和视图相关（view-dependent）的颜色）。我们使用体渲染（volume rendering）技术，沿着光线积累这个场景表示的采样样本，以从任何视角渲染场景。在这里，我们可视化了在周围半球上随机捕获的合成鼓场景的 100 个输入视图集，并展示了从优化的 NeRF 表示中渲染的两个新视图。

因为这个过程是自然可微的，我们可以**使用梯度下降来优化这个模型**，通过最小化每个观察图像和从我们的表示中呈现的相应视图之间的误差（和真值进行对比）。
通过将高体积密度和准确的颜色分配给包含真实底层场景内容的位置，最大限度地减少多个视图之间的误差，鼓励网络预测一个连贯的场景模型。
图 2 可视化了整个管线：

> [!example] Pipeline
> ![[ca177eecd11fb6fd36c5538ca5534611_MD5.png|700]] 
> 图 2：我们的神经辐射场场景表示（neural radiance field scene representation）和可微分渲染（differentiable rendering）过程概述。
> 我们通过沿相机光线（a）采样 5D 坐标（位置和观察方向），将这些位置输入 MLP 以生成颜色和体积密度（b），并使用体渲染技术将这些值合成为图像（c）。该渲染函数是可微的，因此我们可以通过最小化合成图像和真实（ground truth）观察图像（d）之间的残差来优化场景表示。
>1. 输入一组稀疏图像，沿着相机光线的方向采样 5D 坐标 
>2. 将坐标信息输入到 MLP 中，生成 RGB 颜色和体积密度
> 1. 使用体渲染的方法根据颜色和体积密度生成图像 
> 1. 最小化合成图像和 Ground Truth 之间的残差来优化场景表示 ^iuvbi2

我们发现，优化复杂场景的神经辐射场表示法的基本实现并没有收敛（converge）到足够高分辨率的表示（sufficiently high-resolution representation），并且在每个相机光线所需的采样数量方面效率低下。
**我们通过将输入 5D 坐标转换为位置编码（positional encoding）来解决这些问题，位置编码使 MLP 能够表示更高频率的函数，并且我们提出了一种分层采样程序，以减少对这种高频场景表示进行充分采样所需的查询数。**

**我们的方法继承了体积表示（volumetric representations）的优点：** 两者都可以表示复杂的真实世界几何形状和外观，并且非常适合使用投影图像进行基于梯度的优化。重要的是，我们的方法**克服了在高分辨率建模复杂场景时离散化体素网格（discretized voxel grids）的高昂存储成本**。

**总之，我们的技术贡献是：**
- 一种将具有复杂几何形状和材质的连续场景表示为 5D 神经辐射场的方法，参数化为基本 MLP 网络。
- 一种基于经典体渲染（volume rendering）技术的可微分渲染过程，我们使用它从标准 RGB 图像中优化这些表示。这包括分层采样策略，用于将 MLP 的容量分配给具有可见场景内容的空间
- 将每个输入 5D 坐标映射到更高维空间的位置编码，使我们能够成功优化神经辐射场以表示高频场景内容（high-frequency scene content）。

我们证明了我们得到的神经辐射场方法在数量和质量上优于最先进的视图合成方法，包括将神经 3D 表示拟合到场景的工作，以及训练深度卷积网络以预测采样体积表示（sampled volumetric representations）的工作。
据我们所知，本文提出了第一个连续的神经场景表示，它能够从自然环境中捕获的 RGB 图像中渲染真实对象和场景的高分辨率照片真实感的新视图。

# 2 Related Work

**计算机视觉最近的一个很有前途的方向是以 MLP 的权重对对象和场景进行编码，该权重直接从 3D 空间位置映射到形状的隐式表示**，例如该位置的有向距离（the signed distance）[6]。然而，这些方法到目前为止还无法再现具有复杂几何形状的真实场景，其照片级真实感度与使用离散表示（如三角形网格或体素网格）表示场景的技术相同（好像这几年已经解决了 hxz）。在本节中，我们将回顾这两条工作线，并将其与我们的方法进行对比，我们的方法增强了神经场景表示的能力，以产生用于渲染复杂照片级真实感场景的最优结果。

使用 MLP 从低维坐标映射到颜色的类似方法也用于表示其他图形功能，如图像 [44]、纹理材质（textured materials）[12,31,36,37] 和间接照明值[38]。

**Neural 3D shape representations（神经 3D 形状表示）** 最近的工作通过优化将 xyz 坐标映射到**有向距离场（SDF: signed distance functions）**[15,32] 或占用域（occupancy fields）[11,27] 的深度网络，研究了连续 3D 形状作为水平集（level sets）的隐式表示。然而，这些模型受限于其对真实（ground truth）3D 几何结构的获取要求，通常从合成 3D 形状数据集（如 ShapeNet[3]）获得。随后的工作通过制定可差分渲染函数来放宽 ground truth 3D 形状的这一要求，该函数允许仅使用 2D 图像来优化神经隐式形状表示 (neural implicit shape representations)。Niemeyer 等人 [29] 将表面表示为 3D 占用场（3D occupancy fields），并使用数值方法找到每条射线的表面交点，然后使用隐式微分计算精确导数。每个光线相交位置（ray intersection location）都作为神经 3D 纹理场（a neural 3D texture field）的输入提供，该纹理场预测该点的漫反射颜色。Sitzmann 等人 [42] 使用了一种不太直接的神经 3D 表示法，简单地在每个连续的 3D 坐标处输出一个特征向量和 RGB 颜色，并提出了一种可微分的渲染函数，该函数由沿每条光线步进的循环神经网络（RNN）组成，以确定表面的位置。

>有向距离场SDF：每个像素（体素）记录自己与距离自己最近物体之间的距离，如果在物体内，则距离为负，正好在物体边界上则为0。
- ? 水平集 level sets？
尽管这些技术可能潜在地表示复杂和高分辨率的几何体，但迄今为止，它们仅限于几何复杂度较低的简单形状，导致渲染过度平滑。**我们展示了优化网络以编码 5D 辐射场（optimizing networks to encode 5D radiance fields）（具有 2D 视角相关的外观的 3D 体积）的替代策略可以代表更高分辨率的几何形状和外观，以渲染复杂场景的照片级真实感新视图。**

**View synthesis and image-based rendering（视图合成和基于图像的渲染）**：给定稠密的视图采样，可以通过简单的光场采样插值（light field sample interpolation）技术重建照片级真实感的新视图 [21,5,7]。对于具有稀疏视图采样 (sparser view sampling) 的新视图合成，计算机视觉和图形社区通过从观察到的图像中预测传统的几何和外观表示而取得了重大进展。一类流行的方法使用基于网格（mesh-based）的场景表示，具有漫反射 [48] 或视图相关（view-dependent） [2,8,49] 外观。可微光栅化器（Differentiable rasterizers）[4,10,23,25]或路径跟踪器（pathtracers）[22,30]可以直接优化网格表示，以使用梯度下降再现一组输入图像。然而，基于图像重投影（image reprojection）的梯度网格优化（gradient-based mesh optimization）通常很困难，可能是因为局部极小值或损失情况（loss landscape）的条件较差。此外，该策略要求在优化之前提供具有固定拓扑的模板网格（a template mesh）作为初始化 [22]，这通常不适用于无约束的真实场景（unconstrained real-world scenes）。

**另一类方法使用体积表示（volumetric representations）来解决从一组输入 RGB 图像进行照片级真实感视图合成（photorealistic view synthesis）的任务。体积方法能够真实地表示复杂的形状和材质，非常适合基于梯度的优化，并且与基于网格的方法相比，倾向于产生较少的视觉干扰伪影（visually distracting artifacts）**。早期的体积方法使用观察到的图像直接为体素网格着色 [19,40,45]。最近，有几种方法[9,13,17,28,33,43,46,52] 使用多个场景的大型数据集来训练深层网络，这些深层网络根据一组输入图像预测采样的体积表示，然后使用 alpha-compositing [34] 或沿射线学习合成，在测试时渲染新视图。其他工作针对每个特定场景优化了卷积网络（CNN）和采样体素网格的组合，使得 CNN 可以补偿低分辨率体素网格中的离散化伪影（discretization artifacts） [41]，或者允许预测的体素网格根据输入时间或动画控制而变化 [24]。**尽管这些体积技术在新的视图合成方面取得了令人印象深刻的成果，但由于离散采样（discrete sampling），它们缩放到更高分辨率图像的能力基本上受到了时间和空间复杂性的限制 - 渲染更高分辨率的图像需要对 3D 空间进行更精细的采样。
我们通过在深度全连接神经网络的参数内编码连续体积来绕过这个问题，这不仅比以前的体积方法产生了更高质量的渲染，而且只需要这些采样体积表示的存储成本的一小部分。**

# 3 ⭐Neural Radiance Field Scene Representation
我们将连续场景表示为 5D 向量值函数，其输入为 3D 位置 $x=(x,y,z)$ 和 2D 观看方向 $(θ，∅)$，其输出为发出的颜色 $c=(r,g,b)$ 和**体积密度** $σ$。在实践中，我们把方向 $(θ，∅)$ 表示为三维笛卡尔坐标的单位向量 $d$。我们用 MLP 网络 $F_Θ:(x, d)→(c, σ)$ 近似这个连续的 5D 场景表示并优化其权重 $Θ$，以从每个输入 5D 坐标映射到其相应的体积密度和定向发射颜色。

**我们通过限制网络将体积密度 $σ$ 预测为位置 $x$ 的函数，同时将 RGB 颜色 $c$ 预测为位置和观看方向的函数，从而鼓励表示具有多视图一致性（multiview consistent）**。为了实现这一点，MLP  $F_Θ$ 首先用 8 个全连接层处理输入 3D 坐标 $x$（使用 ReLU 激活和每层 256 个通道），并输出 $σ$ 和 256 维特征向量。然后，该特征向量与相机光线的观察方向连接，并传递到额外的全连接层（使用 ReLU 激活和 128 通道），该层输出与视图相关的 RGB 颜色。

图 7 详细说明了我们简单的全连接架构。

> [!example] 图 7 全连接的网络架构
> ![[Pasted image 20230507232312.png]] 图 7：我们全连接的网络架构的可视化。输入向量以绿色显示，中间隐藏层以蓝色显示，输出向量以红色显示，每个块内的数字表示向量的维度。所有层都是标准的全连接层，黑色箭头表示有 ReLU 激活的层，橙色箭头表示没有激活的层、黑色虚线箭头表示具有 sigmoid 激活的层， “+” 表示向量连接。
> 输入位置 $γ(x)$ 的位置编码通过 8 个完全连接的 ReLU 层，每个层有 256 个通道。我们遵循 DeepSDF[32] 架构，并包含一个跳跃连接 （Skip connection），将此输入连接到第五层的激活 (activation)(作用是提高准确度)。附加层输出体积密度 $σ$（使用 ReLU 进行校正，以确保输出体积密度为非负）和 256 维特征向量。这个特征向量与输入观察方向的位置编码 $γ(d)$ 相连接，并由一个具有 128 个通道的附加全连接 ReLU 层处理。最后一层（有一个 sigmoid 激活）**输出位置 $x$ 的 RGB 辐射率，作为通过方向为 $d$ 的光线所看到的颜色。**   ^lpcbbf

关于我们的方法如何使用输入观察方向来表示非朗伯体效应（non-Lambertian effects）的示例，请参见图 3。如图 4 所示，在不依赖视图的情况下训练的模型（只有 _x_ 作为输入）很难表示镜面反射。

> [!example] 图 3/图 4
> 
> ![[56558518c2018c3efa7d509a29e384bb_MD5.png]]
> 
> 图 3：视角相关的发射辐射率（view-dependent emitted radiance）的可视化。我们的神经辐射场表示法输出 RGB 颜色作为空间位置 x 和观察方向 d 的 5D 函数。在这里，我们在船舶场景的神经表示中可视化了两个空间位置的示例方向颜色分布。在（a）和（b）中，我们展示了来自两个不同相机位置的两个固定 3D 点的外观：一个在船侧（橙色插图），另一个在水面（蓝色插图）。我们的方法预测了这两个三维点不断变化的镜面外观（the changing specular appearance），在（c）中，我们展示了这种行为如何在整个半球的观察方向上不断泛化。
> 
> 
![[1e0924592d300e52121e69605d643570_MD5.png]]
>
图 4：在这里，我们可视化我们的完整模型如何从表示视图相关的发射辐射以及通过高频位置编码传递输入坐标中受益。**移除视图相关性（view dependence）可阻止模型在推土机踏板上重新创建镜面反射（不能够表示镜面反射了）。删除位置编码会大大降低模型表示高频几何体和纹理的能力，从而导致外观过于平滑。**

> [!question] 非朗伯体效应 non-Lambertian effects
> non-Lambertian objects 指的是那些不遵循 Lambertian 反射模型的物体，它们的表面反射不是均匀的。这些物体的表面反射可能会因为物体表面纹理、光线入射角度等因素而变化。例如，眼睛、嘴巴、胡须等都属于 non-Lambertian objects。
> 
>
而 Lambertian effect 指的是遵循 Lambertian 反射模型的物体表面反射的效果。Lambertian 反射模型假设物体表面是完全均匀的，在任何视角下都会反射相同的光线。这种反射模型通常用于模拟纹理较简单的物体的表面反射。
![[Pasted image 20230506233504.png]]
>朗伯辐亮度示意图(a) 与自然地物表面的非朗伯辐亮度示意图(b-d)
>自然界中的地物表面，应当都是非朗伯的 Non-Lambertian。

# 4 Volume Rendering with Radiance Fields

我们的 **5D 神经辐射场将场景表示为空间任意点的体积密度和定向发射辐射率**（directional emitted radiance）（即表示为体积密度和颜色）。我们使用经典体渲染（classical volume rendering）的原理渲染穿过场景的任何光线的颜色 [16]。**体积密度 $σ(x)$ 可以解释为光线在 $x$ 处终止于无穷小粒子（infinitesimal particle）的微分概率 (differential probability)。**

相机光线 $r(t)=o+td$ 的预期颜色 $C(r)$（具有近边界和远边界 $t_n$ 和 $t_f$）为：
$$
C(\mathbf{r})=\int_{t_n}^{t_f}T(t)\sigma(\mathbf{r}(t))\mathbf{c}(\mathbf{r}(t),\mathbf{d})dt,\text{where}\; T(t)=\exp\left(-\int_{t_n}^{t}\sigma(\mathbf{r}(s))ds\right).\tag{1}
$$
>公式中的 where 意思就是“其中”

**函数 $T(t)$ 表示光线从 $t_n$ 到 $t$ 的累积透射率（transmittance），即光线从 $t_n$ 到 $t$ 传播而不撞击任何其他粒子的概率。**
从我们的连续神经辐射场中渲染一个视图需要估计这个积分 $C(r)$，用于追踪通过所需摄像机的每个像素的摄像机光线。 

我们用求积法（quadrature）数值估计（numerically estimate）这个连续积分。确定性求积通常用于渲染离散化体素网格（discretized voxel grids），它将有效地限制我们表示的分辨率，因为 MLP 只能在固定的离散位置集上被查询。

我们**使用分层采样（stratified sampling）方法**，将 $[t_n,t_f]$ 划分为 $N$ 个均匀间隔的 box ，然后从每个 box 内均匀随机抽取一个样本：
$$
t_i\sim\mathcal{U}\left[t_n+\frac{i-1}{N}(t_f-t_n),t_n+\frac{i}{N}(t_f-t_n)\right].\tag{2}
$$

尽管我们使用一组离散的样本集来估计积分，但**分层采样使我们能够表示连续的场景表示**，因为它导致在优化过程中在连续的位置对 MLP 进行评估。我们使用这些样本通过 Max[26] 在体渲染评论中讨论的求积规则来估计 $C(r)$：
$$
\hat{C}(\mathbf{r})=\sum\limits_{i=1}^N T_i(1-\exp(-\sigma_i\delta_i))\mathbf{c}_i,\text{where}\;T_i=\exp\left(-\sum\limits_{j=1}^{i-1}\sigma_j\delta_j\right),\tag{3}
$$

其中 $δ_i = t_{i+1} − t_i$ 是相邻采样点之间的距离。
从一组 $(c_i,\sigma_{i})$ 值计算 $\hat{C}(\mathbf{r})$ 的函数是平凡可微的 (trivially differentiable)，并**简化为具有 $alpha$ 值 $α_i = 1 − exp(−σ_iδ_i)$的传统 $alpha$ 合成。**

# 5 Optimizing a Neural Radiance Field

在上一节中，我们描述了将场景建模为神经辐射场 (a neural radiance field) 和从该表示中渲染新视图所需的核心组件。然而，我们注意到，这些组件不足以达到第 6.4 节所示的最优 (state-of-the-art) 质量。

**我们引入了两个改进，以实现高分辨率复杂场景的表示。**
1. 输入坐标的位置编码，有助于 MLP 表示高频函数，
2. 分层采样程序，允许我们有效地对该高频表示进行采样。

## 5.1 位置编码 Positional encoding

尽管神经网络是通用的函数逼近器（function approximators） [14]，但我们发现让网络 $F_Θ$ 直接对 $xyz\theta\phi$ 输入坐标进行操作会导致渲染结果在表现颜色和几何形状的高频变化方面表现不佳。这与 Rahaman 等人 [35] 最近的研究一致，该研究表明**深度网络倾向于学习低频函数** (lower frequency functions)。他们还表明，**在将输入传递到网络之前，使用高频函数将输入映射到更高维空间，能够更好地拟合包含高频变化的数据。**

我们在神经场景表示的背景下利用这些发现，并表明将  $F_Θ$ 重新表述为两个函数 $F_\Theta=F_\Theta'$ 的组成，一个是学习，一个是不学习，明显提高了性能（见图 4 和表 2）。
这里 $γ$ 是从 $\mathbb{R}$ 到更高维空间 $\mathbb{R}^{2L}$ 的映射，而 $F_\Theta'$ 仍然是简单的正则 MLP。形式上，我们使用的**编码函数**是：
$$
\gamma(p)=\left(\sin\left(2^0\pi p\right),\cos\left(2^0\pi p\right),\cdots,\sin\left(2^{L-1}\pi p\right),\cos\left(2^{L-1}\pi p\right)\right).\tag{4}
$$
>可以理解为，这种表示方法，即便两个点在原空间中的距离很近，很难分辨，但通过上面的编码函数，可以很轻松地分辨两个点。

这个函数 $\gamma(\cdot)$ 分别应用于 $x$ 中的三个坐标值（被归一化为位于 $[-1, 1]$）和笛卡尔观察方向 (Cartesian viewing direction) 单位向量 $d$ 的三个分量（根据结构，它们位于 $[-1, 1]$）。在我们的实验中，我们为 $γ(x)$ 设置 $L=10$，为 $γ(d)$ 设置 $L=4$。 

流行的 Transformer 架构 [47] 中使用了类似的映射，它被称为位置编码。然而，Transformers 将其用于**不同的目的**，即提供序列中令牌的离散位置（the discrete positions of tokens），作为不包含任何顺序概念（any notion of order）的架构的输入。
**相反，我们使用这些函数将连续的输入坐标映射到更高维的空间，以使 MLP 更容易地逼近更高频率的函数。** 根据投影对3D 蛋白质结构建模[51]的相关问题的并行工作也利用了类似的输入坐标映射。

## 5.2 分层体积采样 Hierarchical volume sampling

我们的渲染策略是在沿每个相机光线的 N 个查询点处密集评估神经辐射场网络，这种**策略效率低下**：对渲染图像没有贡献的自由空间和遮挡区域（free space and occluded regions）仍会重复采样。我们从早期的体渲染工作中汲取灵感 [20]，并**提出了一种分层表示法，通过把样本按比例分配给期望的最终渲染效果，以提高渲染效率。**

**我们不只是使用单个网络来表示场景，而是同时优化两个网络：一个 “coarse（粗略）” 网络和一个 “fine（精细）” 网络（粗网络和细网络）。** 我们首先使用分层采样（stratified sampling）采样一组 $N_c$ 位置，并按照等式 2，3 中的描述评估在这些位置 "coarse" 网络，如公式 2 和 3 所述。给定这个 “coarse” 网络的输出，然后我们沿着每条光线对点进更细致的采样（more informed sampling），其中样本偏向于体积的相关部分。
为了做到这一点，我们首先将公式 3 中 coarse 网络的 alpha 合成颜色 $\hat{C}_{c}\left({r}\right)$ 重写为沿射线的所有采样颜色 $c_i$ 的加权和。（就是更为细致的 alpha 合成）
$$\hat{C}_c(\mathbf{r})=\sum_{i=1}^{N_c}w_ic_i,\quad w_i=T_i(1-\exp(-\sigma_i\delta_i)).\tag{5}$$

将这些权重归一化为 $\displaystyle\hat{w}_i = \frac{w_i}{\sum_{j=1}^{N_c}{w_j}}$，可产生沿光线的分段常数 (piecewise-constant) **PDF** 。
- ? PDF? 逆变换采样？
我们使用**逆变换采样**（inverse transform sampling）从这个分布中采样第二组 $N_f$ 位置，在第一组和第二组样本的联合处评估我们的 "fine" 网络，并使用公式 3 但使用所有 $N_c+N_f$ 样本计算光线的最终渲染颜色 $\hat{C}_{c}\left({r}\right)$ 。
此过程将更多样本分配给我们期望包含可见内容的区域。这解决了与重要性采样 (importance sampling) 类似的目标，但我们使用采样值作为整个积分域（integration domain）的非均匀离散化（nonuniform discretization），而不是将每个采样作为整个积分的独立概率估计 (an independent probabilistic estimate of the entire integral)。

## 5.3 Implementation details

我们为每个场景优化了一个单独的神经连续体积表示网络。这只需要**一个捕捉的场景的 RGB 图像的数据集，相应的相机位姿和内参（intrinsic），以及场景的边界（scene bounds）(我们对合成数据使用 ground truth 相机位姿、内参和边界。并使用 COLMAP 运动结构包 [39] 来估计真实数据的这些参数）**。
在每次优化迭代中，我们从数据集中所有像素的集合中随机采样一批（batch）相机光线，然后按照第 5.2 节中描述的分层采样，从粗网络中查询 $N_c$ 样本，从细网络中查询 $N_c+N_f$ 个样本。然后，我们使用第 4 节中描述的体渲染过程来渲染两组 样本中每条光线的颜色。我们的损失（loss）只是 coarse 渲染和 fine 渲染的渲染像素颜色和真实像素颜色之间的总平方误差： 
$$
\mathcal L=\sum_{\mathbf{r}\in\mathcal{R}}\left[\left\lVert\hat{C}_{c}(\mathbf{r})-C(\mathbf{r})\right\rVert_{2}^{2}+\left\lVert\hat{C}_{f}(\mathbf{r})-C(\mathbf{r})\right\rVert_{2}^{2}\right]\tag{6}
$$

其中 $R$ 是每个 batch 中的光线集，$C(\mathbf{r}), \hat{C}_c(\mathbf{r})$ 和 $\hat{C}_f(\mathbf{r})$ 分别是光线 $r$ 的真实值、coarse 体积预测和 fine 体积预测 RGB 颜色。请注意，即使最终渲染来自 $\hat{C}_f(\mathbf{r})$ ，我们也将 $\hat{C}_c(\mathbf{r})$ 的损失最小化，以便 coarse 网络的权重分布可以用于在 fine 网络中分配样本。   

在我们的实验中，我们使用了 4096 条光线的批量大小，每个射线在 coarse 体积中的 $N_c=64$ 个坐标和 fine 体积中 $N_f=128$ 个附加坐标（additional coordinates）处采样。我们使用 Adam 优化器（Adam optimizer） [18]，学习速率从 $5\times10^{-4}$ 开始，并在优化过程中呈指数衰减到 $5\times10^{-5}$ （其他 Adam 超参数（hyperparameters）保留为默认值： $\beta1=0.9;\beta2=0.999$ 和 $ϵ=10^{-7}$)。
在单个 NVIDIA V100 GPU 上，单个场景的优化通常需要大约 100—300k 次迭代才能收敛（大约 1-2 天）。

# 6 Results

我们定量地 (quantitatively)（表 1）和定性地（qualitatively）（图 8 和 6）表明，我们的方法优于先前的工作，并提供了广泛的**消融实验（ablation studies）** 来验证我们的设计选择（表 2）。我们敦促读者观看我们的补充视频，以更好地理解我们的方法在渲染新视图的平滑路径时相对于对照方法（baseline methods）的显著改进。 


## 6.1 Datasets
**Synthetic renderings of objects（物体的合成渲染）** 
我们首先展示了物体合成渲染的两个数据集的实验结果（表 1，“漫反射合成（Diffuse Synthetic）360°”和 “真实合成（Realistic Synthetic）360°”)。

DeepVoxels[41] 数据集包含四个具有简单几何形状的朗伯对象（Lambertian objects）。从上半球采样的视角（479 作为输入，1000 用于测试）以 512 × 512 像素渲染每个对象。。

此外，我们还生成了自己的数据集，其中包含八个对象的路径跟踪图像（pathtraced images），这些对象具有复杂的几何形状和照片级真实感的非朗伯材质（non-Lambertian materials）。六个从上半球上采样的视角渲染，两个从整个球体上采样的视角渲染。我们渲染每个场景的 100 个视图作为输入，200 个视图用于测试，所有视图均为 800×800 像素。

> [!example] 
> 
> ![[Pasted image 20230507220351.png]]
> 
> 表 1：我们的方法在合成图像和真实图像的数据集上的定量表现优于先前的工作。我们报告 PSNR/SSIM（越高越好）和 LPIPS[50]（越低越好）。DeepVoxels[41] 数据集由 4 个具有简单几何结构的漫反射对象（diffuse objects）组成。我们的真实合成数据集由 8 个具有复杂非朗伯材质的几何复杂对象的路径跟踪渲染组成。真实数据集由 8 个真实世界场景的手持式前向捕捉（handheld forward-facing captures）组成（NV 无法基于此数据进行评估，因为它仅重建有界体积内的对象）。虽然 LLFF 的 LPIPS 稍好一些，但我们敦促读者观看我们的补充视频，我们的方法实现了更好的多视图一致性，并且产生的伪影比所有对照组 (baselines，又称基准线)都少。

> [!NOTE] PSNR/SSIM/LPIPS
>  - PSNR：峰值信噪比。通常用来评价一幅图像压缩后和原图像相比质量的好坏，当然，压缩后图像一定会比原图像质量差的，所以就用这样一个评价指标来规定标准了。PSNR 越高，压缩后失真越小。
>-  SSIM：结构相似性。是一种全参考的图像质量评价指标，它分别从亮度、对比度、结构三方面度量图像相似性。
>- LPIPS：学习感知图像块相似度 (Learned Perceptual Image Patch Similarity, LPIPS) 也称为 “感知损失”(perceptual loss)，用于度量两张图像之间的差别。来源于 CVPR2018《The Unreasonable Effectiveness of Deep Features as a Perceptual Metric》

**Real images of complex scenes（复杂场景的真实图像）**
我们展示了用大致前向图像（roughly forward-facing images）捕获的复杂真实世界场景的结果（表 1，“Real Forward-Facing”）。这个数据集由 8 个用手持手机捕获的场景组成，（5 个取自 LLFF 论文，3 个是我们捕获的），捕获了 20 到 62 张图像，并保留其中的 1/8 用于测试集。所有图像都是 1008×756 像素。

> [!example] 
> ![[Pasted image 20230507223920.png]]
> 图 5：使用基于物理的渲染器（a physically-based renderer）生成的新合成数据集场景的测试集视图比较。我们的方法能够恢复几何和外观上的细微细节，例如船舶的索具、乐高的齿轮和踏板、麦克风闪亮的支架和网状格栅，以及材质的非朗伯反射。LLFF 展示了麦克风支架和材质的对象边缘上的带状伪影（banding artifacts），以及船舶桅杆和乐高对象内部的重影伪影（ghosting artifacts）。SRN 在任何情况下都会产生模糊和扭曲的渲染。Neural Volumes 无法捕捉麦克风格栅或乐高齿轮上的细节，并且完全无法恢复船舶索具的几何形状。


> [!example] 
> ![[Pasted image 20230507224408.png]]
> 
 图 6：真实世界场景的测试集视图比较。LLFF 是专门为这个用例设计的（真实场景的前向捕捉）。与 LLFF 相比，我们的方法能够在渲染视图中更一致地表示精细几何体，如 Fern 的叶子和 T-rex 中的骨架肋骨和栏杆所示。我们的方法还正确地重建了 LLFF 难以清晰渲染的部分遮挡区域，例如底部蕨类（Fern）作物叶子后面的黄色架子和底部兰花（Orchid）作物背景中的绿色叶子。多次渲染之间的混合也会导致 LLFF 的重复边缘，如在顶部的兰花（Orchid）作物中看到的那样。SRN 捕捉到每个场景中的低频几何形状和色彩变化，但无法再现任何精细的细节。


> [!example] 图 8
> 
![[Pasted image 20230508141324.png]] 图 8：对来自 DeepVoxels[41] 合成数据集的场景进行测试集视图（test-set views）的比较。该数据集中的对象具有简单的几何形状和完美的漫反射率（diffuse reflectance）。由于大量的输入图像（479 个视图）和渲染对象的简单性，我们的方法和 LLFF[28] 在这一数据上几乎表现完美。LLFF 在其 3D 体积之间插值时仍偶尔会出现伪影（artifacts），如每个对象的顶部插图所示。SRN[42] 和 NV[24] 不具有呈现精细细节的表现能力。

## 6.2 Comparisons

为了评估我们的模型，我们将其与当前表现最好（top-performing）的视图合成技术进行比较，详情如下。
所有方法都使用相同的一组输入视图来为每个场景训练单独的网络，局部光场融合（Local Light Field Fusion）[28] 除外，该方法在大型数据集上训练单个 3D 卷积网络，然后使用相同的训练网络在测试时处理新场景的输入图像。

**Neural Volumes (NV) [24]（神经体积）** 合成对象的新视图，这些对象完全位于不同背景之前的有界体积内（必须在没有感兴趣对象（the object of interest）的情况下单独捕捉）。它优化了一个深度 3D 卷积网络，以预测具有 $128^3$ 个样本的离散化 $RGBα$ 体素网格（voxel grid）以及具有 $32^3$ 个样本的三维翘曲网格（3D warp grid）。该算法通过使摄像机光线穿过扭曲的（warped）体素网格来渲染新的视图。  

**Scene Representation Networks (SRN) [42]（场景表示网络）** 将一个连续的场景表示为一个不透明的表面，由一个 MLP 隐式定义，将每个（x，y，z）坐标映射为一个特征向量。他们训练一个循环神经网络沿着光线步进，通过使用任何 3D 坐标的特征向量来预测沿射线的下一步步长，最后一步的特征向量被解码为表面上该点的单一颜色。请注意，SRN 是同一作者的 DeepVoxels[41] 的后续产品（followup），性能更好，这就是为什么我们不包括与 DeepVoxels 的比较。 

**Local Light Field Fusion(LLFF) [28]（局部光场融合）** LLFF 被设计用于为采样良好的前向场景生成照片级真实感的新视图（photorealistic novel views）。它使用一个训练有素的 3D 卷积网络来直接预测每个输入视图的离散截头体采样（a discretized frustum-sampled）$RGBα$ 网格（多平面图像或 MPI[52]），然后通过 alpha 合成和混合（alpha compositing and blending）附近的 MPI 到新的视角来渲染新的视图。 

## 6.3 Discussion

我们在所有场景中都完全优于（outperform）了对每个场景单独网络进行优化的两个对照（NV 和 SRN）。此外，与 LLFF 相比（除一项指标外），我们在只使用他们的输入图像作为我们的整个训练集的同时，产生的渲染在质量和数量上都更胜一筹。
 
SRN 方法产生了高度平滑的几何形状和纹理，而且由于每条相机光线仅选择单一的深度和颜色，它对视图合成的表现力受到限制。
NV 对照能够捕捉相当详细的体积几何和外观，但它使用底层显式（underlying explicit） $128^3$ 个体素网格，这使它无法在高分辨率下表示精细的细节。
LLFF 特别提供了一个 " 采样准则（sampling guideline）"，即输入视图之间的差距不超过 64 像素，因此它经常无法在包含多达 400-500 像素的视图之间的差异的合成数据集中估计出正确的几何形状。此外，LLFF 在不同的场景表示之间混合渲染不同的视图，导致在我们的补充视频中显而易见的感知上的不一致

这些方法之间最大的实际权衡（tradeoffs）是时间与空间。所有比较过的单场景方法每个场景都需要至少 12 个小时来训练。相比之下，LLFF 可以在 10 分钟内处理一个小的输入数据集。然而，LLFF 为每个输入图像生成一个大的 3D 体素网格，这导致了巨大的存储需求（一个 “Realistic Synthetic” 场景超过 15GB）。我们的方法只需要 5MB 的网络权重（与 LLFF 相比，相对压缩了 3000 倍），这甚至比我们任何一个数据集中单个场景的单独输入图像的内存还要少。

## 6.4 Ablation studies

> [!example] 表 2
> 
> ![[d136e3543d1e9ed7541d6782beb7bfff_MD5.png]]
> 
> 表 2：我们模型的消融研究。指标是我们现实合成数据集中 8 个场景的平均值。

我们通过表 2 中广泛的消融研究验证了我们算法的设计选择和参数。我们在我们的 "真实合成（Realistic Synthetic）360°" 场景中展示了结果。
第 9 行显示了我们的完整模型作为参考点。
第 1 行显示了我们的模型的最简版本，没有位置编码（PE），视图依赖（VD），或分层采样（H）。
在第 2-4 行中，我们从完整的模型中逐一去除这三个成分，观察到位置编码（第 2 行）和视图依赖性（第 3 行）提供了最大的定量效益（the largest quantitative benefit），其次是分层采样（第 4 行）。
第 5-6 行显示了随着输入图像数量的减少，我们的性能如何下降。
请注意，当提供 100 幅图像时，我们的方法仅使用 25 幅输入图像的性能在所有指标上仍然超过 NV、SRN 和 LLFF（参见补充资料）
在第 7-8 行中，我们验证了我们对 $x$ 的位置编码中所使用的最大频率 $L$ 的选择（对 $d$ 使用的最大频率是按比例缩放的）。只使用 5 个频率会降低性能，但将频率的数量从 10 个增加到 15 个并不能提高性能。我们认为，一旦 $2^L$ 超过了采样输入图像中存在的最大频率（在我们的数据中大约是 1024），增加 $L$ 的好处就会受到限制。

# 7 Conclusion

我们的工作直接解决了之前使用 MLPs 将物体和场景表示为连续函数（continuous functions）的工作的不足之处。我们证明了将场景表现为 5D 神经辐射场（输出体积密度和与视角相关的发射辐射作为 3D 位置和 2D 观察方向的函数的 MLP）比之前训练深度卷积网络输出离散体素表示（discretized voxel representations）的主流方法产生更好的渲染。

尽管我们已经提出了一种分层采样策略以使渲染更高效（用于训练和测试），但在研究有效优化和渲染神经辐射场的技术方面仍需要很大进展。未来工作的另一个方向是可解释性（interpretability:）：体素网格（voxel grids）和网格（meshes）等采样表征承认对渲染视图的预期质量和故障模式（the expected quality of rendered views and failure modes）的推理，但目前还不清楚当我们在深度神经网络的权重中对场景进行编码时如何分析这些问题。我们相信，这项工作在实现基于真实世界图像的图形管线方面取得了进展，复杂的场景可以由实际物体和场景的图像优化的神经辐射场组成。

# 8 Additonal
## Additional Implementation Details

**Volume Bounds** 我们的方法通过查询沿着相机光线的连续 5D 坐标处的神经辐射场表示来渲染视图。在合成图像的实验中，我们对场景进行缩放，使其位于以原点为中心的边长为 2 的立方体中，并且仅查询这个边界体积内的表示。我们的真实图像数据集包含的内容可以存在于最近点和无穷大之间的任何位置，所以我们使用归一化的设备坐标（NDC）将这些点的深度范围映射到 [-1, 1]。这将所有的光线原点转移到场景的近平面 (the near plane of the scene)，将摄像机的透视光线映射到转换后的体积中的平行光线，并使用视差（逆深度）（disparity (inverse depth)）而不是度量深度，所以现在所有的坐标都是有界的。
- ? 视差（逆深度）（disparity (inverse depth)）?
**Training Details** 对于真实的场景数据，我们通过在优化过程中向输出的 $σ$ 值（在通过 ReLU 之前）添加具有零均值和单位方差的随机高斯噪声（random Gaussian noise with zero mean and unit variance）来规范我们的网络，发现这略微提高了渲染新视图的视觉性能。 

**Rendering Details** 为了在测试时渲染新的视图，我们通过 coarse 网络对每条射线采样 64 个点，通过 fine 网络对每条射线采样 64+128=192 个点，每条射线总共有 256 次网络查询。我们的真实合成数据集每幅图像需要 640k 射线，而我们的真实场景每幅图像需要 762k 射线，因此每幅渲染的图像需要 1.5 亿到 2 亿的网络查询。在 NVIDIA V100 上，每帧大约需要 30 秒。

## Additional Baseline Method Details

**Neural Volumes** (NV) [24] 我们使用了作者在 https://github.com/facebookresearch/neuralvolumes 上公开的 NV 代码，并按照他们的程序在没有时间依赖性（time dependence）的单一场景上进行训练。

**Scene Representation Networks** (SRN) [42] 我们使用作者开源的 SRN 代码 https://github.com/vsitzmann/scene-representation-networks 并按照他们的程序在单个场景上进行训练。

**Local Light Field Fusion** (LLFF) [28] 我们使用作者开源的预训练的 LLFF 模型，网址是 https://github.com/Fyusion/LLFF。

**Quantitative Comparisons** 作者发表的 SRN 实现需要大量的 GPU 内存，即使在 4 个 NVIDIA V100 GPU 上并行化，也仅限于 512×512 像素的图像分辨率。我们在 512×512 像素的合成数据集和 504×376 像素的真实数据集上计算 SRN 的量化度量（quantitative metrics），而对于可以在更高分辨率下运行的其他方法，分别为 800×800 和 1008×752。

## NDC ray space derivation
我们通常在归一化设备坐标 (NDC) 空间中使用“前向”捕获重建真实场景
这个空间很方便，因为它保留了平行线，同时将 z 轴（相机轴）转换为线性的差距。

在这里，我们推导出应用于光线的变换，将它们从观察空间映射到 NDC 空间。齐次坐标的标准三维透视投影矩阵是：
$$
M=\begin{pmatrix}\frac{n}{r}0&0&0\\ 0&\frac{n}{t}&0&0\\ 0&0&\frac{-(f+n)}{f-n}&\frac{-2fn}{f-n}\\ 0&0&-1&0\end{pmatrix} \tag{7}
$$

其中，n、f 是近剪平面（clipping planes）和远剪平面，r 和 t 是近剪平面处场景的右边界和上边界。(请注意，这是基于摄像机朝 - z 方向看的惯例。) 

左乘投影矩阵，变换到裁剪空间，进行透视除法，变换到 NDC 空间，得到投影点：
$$
\begin{pmatrix}\frac{n}{r}&0&0&0\\ 0&\frac{n}{t}&0&0\\ 0&0&\frac{-(f+n)}{f-n}&\frac{-2fn}{f-n}\\0&0&-1&0 \end{pmatrix}\begin{pmatrix}x\\ y\\ z\\ 1\end{pmatrix}=\begin{pmatrix}\frac{n}{r}x\\ \frac{n}{t}y\\ \frac{-(f+n)}{f-n}z-\frac{-2fn}{f-n}\\ -z\end{pmatrix}\tag{8}
$$

$$
\text{project}\to\begin{pmatrix}\frac{n}{r}\frac{x}{-z}\\ \frac{n}{t}\frac{y}{-z}\\ \frac{(f+n)}{f-n}-\frac{2fn}{f-n}\frac{1}{-z}\end{pmatrix}\tag{9}
$$
投影点（ projected point）现在是在归一化设备坐标（NDC）空间中，原来的视锥体（the original viewing frustum）已经被映射到立方体 $[-1,1]^3$

我们的目标是取一条射线 $o+td$，并计算出 NDC 空间中的射线原点 $o'$ 和方向 $d'$，这样对于每一个 $t$，都存在一个新的 $t'$，对于这个 $t'$，$π(o+td)=o'+t'd'$（其中$π$是使用上述矩阵的投影）。换句话说，原始光线的投影和 NDC 空间光线追踪出相同的点（但速度不一定相同）。
让我们把公式 9 中的投影点改写为 $(a_xx/z,a_yy/z,a_z+b_z/z)^\top$。
新原点 $o'$ 和方向 $d'$ 的分量必须满足：
$$
\begin{pmatrix}a_x\frac{o_x+td_x}{o_z+td_z}\\ a_y\frac{o_y+td_y}{o_z+td_z}\\ a_z+\frac{b_z}{o_z+td_z}\end{pmatrix}=\begin{pmatrix}o_x'+t'd_x'\\ o_y'+t'd_y'\\ o_z'+t'd_z'\end{pmatrix}\tag{10}
$$

为了消除自由度 (a degree of freedom)，我们决定 $t'=0$ 和  $t=0$ 应该映射到同一点。将 $t'=0$ 和  $t=0$ 代入公式 10，直接得到我们的 NDC **空间原点** $o'$ 。
$$
\textbf{o}'=\begin{pmatrix}o'_x\\o'_y\\o'_z\end{pmatrix}=\begin{pmatrix}a_x\frac{o_x}{o_z}\\a_y\frac{o_y}{o_z}\\a_z+\frac{b_z}{o_z}\end{pmatrix}=\pi(\textbf{o})\tag{11}
$$

这正是原光线原点的投影 $π(o)$。通过将其代入（substituting
）公式 10 ，对于任意 $t$，我们可以确定  $t'$ 和 $d_{}'$ 的值。
$$
\begin{pmatrix}t'd_x'\\ t'd_y'\\ t'd_z'\end{pmatrix}=\begin{pmatrix}a_x\frac{a_x+td_x}{\partial_z+td_z}-a_x\frac{o_x}{o_z}\\ a_y\frac{o_y+td_y}{o_z+d_z}-a_y\frac{o_y}{o_z}\\ a_z+\frac{b_z}{o_z+td_z}-a_z-\frac{b_z}{o_z}\end{pmatrix}\tag{12}
$$
$$
=\left(\begin{matrix}{a_{x}\frac{o_{z}(o_{x}+t d_{x})-o_{x}(o_{z}+t d_{z})}{(o_{z}+t d_{z})o_{z}}}\\ {a_{y}\frac{o_{z}(o_{y}+t d_{y})-o_{y}(o_{z}+t d_{z})}{(o_{z}+t d_{z})o_{z}}}\\ {b_{z}\frac{o_{z}-(o_{z}+t d_{z})}{(o_{z}+t d_{z})o_{z}}}\end{matrix}\right)\tag{13}
$$
$$
=\begin{pmatrix}a_x\frac{td_z}{o_z+td_z}\left(\frac{d_x}{d_z}-\frac{o_x}{o_z}\right)\\ a_y\frac{td_z}{o_z+td_z}\left(\frac{d_y}{d_z}-\frac{o_y}{o_z}\right)\\ -b_z\frac{td_z}{o_z+td_z}\frac{1}{o_z}\end{pmatrix}\tag{14}
$$

 分解出一个仅依赖于 $t$ 的通用表达式（$t$ 是步长），我们可以得到：
$$
t'=\frac{td_z}{o_z+td_z}=1-\frac{o_z}{o_z+td_z}\tag{15}
$$
$$
\mathbf{d}'=\begin{pmatrix}a_x\left(\frac{d_x}{d_z}-\frac{o_x}{o_z}\right)\\ a_y\left(\frac{d_y}{d_z}-\frac{o_y}{o_z}\right)\\ -b_z\frac{1}{o_z}\end{pmatrix} \tag{16}
$$

注意，根据需要，当 $t=0$ 时，$t'=0$。此外，我们看到，当 $t→∞$ 时，$t'→1$。回到最初的投影矩阵，我们的常数是:
$$
\begin{aligned}a_x&=-\frac{n}{r}&\quad&(17)\\ a_y&=-\frac{n}{t}&\quad&(18)\\ a_z&=\frac{f+n}{f-n}&\quad&(19)\\ b_z&=\frac{2fn}{f-n}&\quad&(20)\end{aligned}
$$
使用标准针孔相机模型，我们可以重新参数化为：
$$
\begin{aligned}a_x&=-\frac{f_{cam}}{W/2}&\quad\text{(21)}\\ a_y&=-\frac{f_{cam}}{H/2}&\quad\text{(22)}\end{aligned}
$$
其中 W 和 H 是以像素为单位的图像的宽度和高度，$f_{cam}$ 是相机的焦距。

在我们真正的前向捕捉中，我们假设远处的场景边界 ( far scene bound) 是无穷大（即 f 很大）（这对我们来说成本很小，因为 NDC 使用 _z_ 维度来表示逆深度 (inverse depth)，即视差 (disparity)）。在此限制下，_z_ 常数简化为：
$$
\begin{aligned}a_z&=1&\quad(23)\\ b_z&=2n.&\quad(24)\end{aligned}
$$
将所有内容结合在一起：
$$
\mathbf{o}'=\begin{pmatrix}-\frac{f_{cam}}{W/2}\frac{o_x}{o_z}\\ -\frac{f_{can}}{H/2}\frac{o_y}{o_z}\\ 1+\frac{2n}{o_z}\end{pmatrix}\tag{25}
$$
$$
\mathbf{d}'=\begin{pmatrix}-\frac{f_{cam}}{W/2}\left(\frac{d_x}{d_z}-\frac{o_x}{o_z}\right)\\ -\frac{f_{cam}}{H/2}\left(\frac{dy}{d_z}-\frac{o_y}{o_z}\right)\\ -2n\frac{1}{o_z}\end{pmatrix}\tag{26}
$$

在我们的实现中最后的一个细节：我们将 $\textbf{o}$ 移到射线与近平面的交点 $z=-n$ 处（在这个 NDC 转换之前），通过对 $t_n=-(n+o_z)/d_z$ 取 $\textbf{o}_n=\textbf{o}+t_n\textbf{d}$ 。一旦我们转换为 NDC 光线，这就允许我们简单地从 0 到 1 线性采样 $t'$，以便在原始空间中得到从 $n$ 到 $∞$ 的线性视差（disparity）采样。

## Additional Results

**Per-scene breakdown**(按场景分类) 表 3、表 4、表 5 和表 6 包括了主文中提出的定量结果在每个场景中的细分指标。每个场景的细分与本文提出的总体定量指标一致，我们的方法在定量上优于所有对照 (baseline)。尽管 LLFF 取得了略好的 LPIPS 指标，但我们敦促读者观看我们的补充视频，我们的方法取得了更好的多视图一致性，并且比所有对照产生更少的伪影。

![[Pasted image 20230508141821.png]] 表 3：DeepVoxels[41]数据集的每场景定量结果。此数据集中的 “场景（scenes）” 都是具有简单几何结构的漫反射对象，由 3D 扫描仪捕获的纹理映射网格（texture-mapped meshes）渲染。DeepVoxels 方法的指标直接取自他们的论文，其中没有报告 LPIPS，只报告了 SSIM 的两个有效数字。

![[Pasted image 20230508141805.png]]
 表 4：我们真实合成数据集的每场景定量结果。此数据集中的 “场景（scenes）” 都是具有更复杂的几何和非朗伯材质的对象，使用 Blender 的 Cycles 路径跟踪器（pathtracer）进行渲染。

![[Pasted image 20230508141754.png]]
 表 5：来自真实图像数据集的每场景定量结果。这个数据集中的场景都是用面向前方的手持（forward-facing handheld）手机捕获的。
![[Pasted image 20230508141742.png]]
 表 6：我们消融研究的每场景定量结果。这里使用的场景与表 4 中的场景相同。




      