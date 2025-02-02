[GaMeS：基于网格的高斯分布调整和修改 --- GaMeS: Mesh-Based Adapting and Modification of Gaussian Splatting (arxiv.org)](https://arxiv.org/html/2402.01459v1)
[[2402.01459] GaMeS: Mesh-Based Adapting and Modification of Gaussian Splatting (arxiv.org)](https://arxiv.org/abs/2402.01459)

GaMeS: Mesh-Based Adapting and Modification of Gaussian Splatting  

GaMeS：基于Mesh的GS适配与修改
GaMes = Gaussian Mesh Splatting
# 摘要

近年来，出现了一系列基于神经网络的图像渲染方法。例如，经过广泛研究的NeRF依靠神经网络来表示三维场景，从而可以从少量的二维图像中合成逼真的视图。  然而，大多数 NeRF 模型都受到训练和推理时间过长的限制。   
相比之下，高斯拼接（GS）是一种新颖的SOTA技术，通过高斯分布近似渲染三维场景中的点对图像像素的贡献，从而保证快速训练和快速、实时渲染。  **高斯模型的一个缺点是，由于必须对几十万个高斯进行调节(conditioning)，因此缺乏一种明确的调节方法。**
**为了解决这个问题，我们引入了 GaMeS 模型**，它是网格和高斯分布的混合体，能将所有高斯溅射到物体表面（网格）上。我们的方法的独特之处在于完全根据网格上的位置定义高斯splats，从而在动画制作过程中自动调整位置、缩放和旋转。因此，我们在实时生成高质量视图的过程中获得了高质量的渲染效果。此外，我们还证明，在没有预定义网格的情况下，可以在学习过程中对初始网格进行微调。

# 1 引言

最近，我们注意到出现了几种利用神经网络渲染三维物体和场景的新视角的方法，这些方法前景广阔。例如，NeRFs（Mildenhall 等人，2020 年）在计算机视觉和图形学领域迅速流行起来（Gao 等人，2022 年），因为它们可以创建高质量的渲染效果。尽管人们对 NeRFs 产生了浓厚的兴趣，相关研究也在不断增加，但训练和推理时间过长仍然是 NeRFs 尚未解决的难题。

相比之下，新近推出的GS（Kerbl 等人，2023 年）具有快速训练和实时渲染功能。这种方法的独特之处在于它使用高斯分布（即高斯）来表示三维物体。因此，它不依赖于任何神经网络。 因此，使用高斯的方式类似于操作三维点云或网格，可以在三维空间中进行大小调整或重定位等操作。  
然而，在改变高斯位置时，特别是在准确跟踪椭圆等高斯的形状变化时，可能会遇到实际挑战。  此外，当物体的尺寸发生调整时，缩放高斯也是一项挑战，而对于传统网格来说，这并不是一个问题，因为在调整顶点位置时，可以随时更新网格的三角形面。

如 SuGaR（Guédon & Lepetit，2023 年）所示，上述限制可通过直接在网格上构建高斯来解决。在这里，作者在高斯splat成本函数（cost function）中引入了正则化项，以促进高斯与场景表面的最佳对齐。 
SuGaR 使用 原版 GS 的有向距离场（SDF），并最大限度地减小 SDF 与高斯计算的实际值之间的差值。相比之下，GaussianAvatars（Qian 等人，2023 年）利用局部坐标系生成与网格相关面对齐的高斯，在拥有用于网格拟合的逼真外部模型的假设条件下，提供了一种专为头像设计的技术。
**但是，不可能同时对网格和高斯进行训练。上述解决方案有一些优点，但不能直接将高斯与网格结合起来。因此，当网格发生变化时，我们无法自动调整高斯参数。** 为了解决这个问题，我们结合网格和高斯分布的概念，引入了一种名为GaMeS 的新方法。
实现 GaMeS 需要在网格面上定位高斯，确保这些高斯与网格结构正确对齐。在此，我们提出了一种定义和修改高斯的新方法：**仿射高斯变换**。
- 利用我们的方法，我们可以获得与传统 GS 方法类似的、可用于静态场景的最先进的高质量结果。此外，对网格的任何改动都会自动传播更新到相应的高斯，从而实现实时动画，见图 1。
- 我们的方法可应用于我们不想在训练过程中修改的已有网格，或需要同时优化网格和高斯拼接的场景，见图 2。

 总之，这项工作有以下贡献：
 1. 我们为 3D 对象引入了一种混合表示法，将网格和 GS 无缝地结合在一起。
 2. 在网格上附加高斯斑块，可以在网格变化的同时实时修改高斯斑块。
 3. 我们的方法只依赖于基本的矢量操作，因此我们能够在与静态场景相似的时间内渲染动态场景。

![[Pasted image 20240423144718.png]]
>图 1. GaMeS 是高斯分割和网格表示法的混合体。因此，GaMeS 可以实时修改和适应GS。补充材料提供了更多示例，包括展示我们成果的视频。


![[Pasted image 20240423144347.png]]
>图 2. GaMeS 可以对大型场景进行有效的训练，以便在保持高质量渲染的同时对其进行修改。

# 2相关作品

基于点的高斯表示法有大量潜在的应用场景，包括替代点云数据（Eckart 等人，2016 年）、分子结构建模（Blinn，1982 年）或形状重建（Keselman & Hebert，2023 年）。在涉及阴影（Nulkar & Mueller，2001 年）和云渲染（Man，2006 年）的应用中也可使用这些表示法。此外，最近还推出了一种新的技术：3DGS（Kerbl 等人，2023 年）。这种方法将泼溅方法与基于点的渲染相结合，以提高实时渲染速度。3D-GS 的渲染质量可与基于MLP的最佳渲染器之一 Mip-NeRF （Barron 等人，2021 年）相媲美。
GS 在训练和推理速度方面都超过了 NeRF，其与众不同之处在于不依赖神经网络运行。相反，GS 将基本信息存储在其三维高斯成分中，这一特点使其非常适合动态场景建模（Wu 等人，2023 年）。此外，将 GS 与专用的 3D 计算机图形引擎集成是一个简单的过程（Kerbl 等人，2023 年）。然而，由于通常涉及大量高斯（可多达数十万个），对高斯进行调节是一项具有挑战性的任务。
一种可能的方法是将GS与网格相结合。SuGaR（Guédon & Lepetit，2023 年）就是一个例子，它在 GS 成本函数中引入了正则项，以鼓励高斯与场景表面对齐。SuGaR 通过使用 SDF 和最小化 SDF 与计算高斯值之间的差值来实现这一目的。
另一种方法是GaussianAvatars（GaussianAvatars，Qian 等人，2023 年），它利用局部坐标系生成与网格面相对应的高斯。这种方法是专门为头像设计的，并假定有一个逼真的（外部）模型用于网格拟合。
**然而，同时训练网格和高斯是不可行的。虽然这些解决方案具有一定的优势，但它们并没有直接将高斯成分与网格结合起来。因此，无法根据不断变化的网格自动调整高斯参数。**

# 3 GaMeS：基于网格的GS
本节将深入探讨 GaMeS 模型的细节，我们将阐明如何对网格面上的高斯分布进行参数化。最后，我们将介绍新颖的 GaMeS 方法。

##  网格面上的分布
在 GaMeS 中，我们将所有高斯都置于网格面上。让我们来看看带有顶点的单个三角形面：
$$V={\{v_1,v_2,v_3\}}$$
我们的目标是利用面 $V$ 中的顶点来确定高斯的参数。我们将平均向量表示为顶点$V$的凸组合（convex combination）  ，从而确定高斯splats的位置：
$$m_V(\alpha_1,\alpha_2,\alpha_3)=\alpha_1V_1+\alpha_2V_2+\alpha_3V_3$$

其中，$\alpha_1,\alpha_2,\alpha_3$ 是可训练参数，使得 $\alpha_1+\alpha_2+\alpha_3=1$ 。**通过这种参数化，我们始终将高斯定位在面 𝑉 的中间位置。**

协方差矩阵可以定义为由三个点计算得出的经验协方差。然而，这种解决方案与 GS 中提出的优化方法结合起来非常复杂。取而代之的是**通过因式分解对协方差进行参数化：**
$$\Sigma=R^TSSR$$
其中, $R$ 是旋转矩阵，$S$ 是缩放矩阵。

在此，我们定义旋转矩阵与缩放矩阵，以保持原有框架。让我们从正交向量开始： $\mathbf{r}_1,\mathbf{r}_2,\mathbf{r}_3\in\mathbb{R}^3$ ，组成旋转矩阵 $R_V=[\mathbf{r}_1,\mathbf{r}_2,\mathbf{r}_3]$. 其中第一个向量由法向量定义：
$$\mathbf{n}=\frac{(\mathbf{v}_2-\mathbf{v}_1)\times(\mathbf{v}_3-\mathbf{v}_1)}{\|(\mathbf{v}_2-\mathbf{v}_1)\times(\mathbf{v}_3-\mathbf{v}_1)\|}$$

其中 $\times$ 是交叉积。在明确定义网格的情况下，我们可以始终掌握任何给定面的顶点顺序。因此，要计算 $\mathbf{r}_2$，我们可以定义从中心到顶点的向量 $v_1$ ：
$$\mathbf{r}_2=\frac{\mathbf{v}_1-\mathbf{m}}{\|\mathbf{v}_1-\mathbf{m}\|}$$其中 $𝐦=mean⁢(v_1, v_2, v_3)$ ，对应于三角形的中心点。

最后一个操作是将矢量与现有的两个矢量进行正交化处理（格拉姆-施密特过程中的一个步骤（Björck，1994 年））：
$$\operatorname{orth}(\mathbf{x};\mathbf{r}_1,\mathbf{r}_2)=x-\operatorname{proj}(\mathbf{x},\mathbf{r}_1)-\operatorname{proj}(\mathbf{x},\mathbf{r}_2)$$
其中，
$$\mathrm{proj}(\mathbf{v},\mathbf{u})=\frac{\langle\mathbf{v},\mathbf{u}\rangle}{\langle\mathbf{u},\mathbf{u}\rangle}\mathbf{u}$$
为了得到 $r_3$ ，我们使用了从三角形中心到第二个顶点的矢量：
$$\mathbf{r}_3=\frac{\mathrm{orth}(\mathbf{v}_2-\mathbf{m};\mathbf{r}_1,\mathbf{r}_2)}{\|\mathrm{orth}(\mathbf{v}_2-\mathbf{m};\mathbf{r}_1,\mathbf{r}_2)\|}$$
因此，我们可以得到一个旋转矩阵 $R_v=[r_1,r_2,r_3]$，该矩阵与三角形面对齐。作为我们使用的缩放参数$S$：
$$S_V=\mathrm{diag}(s_1,s_2,s_3)$$
其中
- $s_{1} = \varepsilon, s_{2} = \|\mathrm{mean}(\mathbf{v}_{1},\mathbf{v}_{2},\mathbf{v}_{3}) - \mathbf{v}_{1}\|$. 
- 
- 
- 是与法向量相对应的第一个缩放参数。由于在我们的案例中，高斯的位置是在面上，因此与面对齐 𝑠1 应该等于零。为避免出现数值问题，我们将该值设为一个小值（常数）。另一方面， 𝑠2 和 𝑠3 与中心到三角形边界的距离成正比。
