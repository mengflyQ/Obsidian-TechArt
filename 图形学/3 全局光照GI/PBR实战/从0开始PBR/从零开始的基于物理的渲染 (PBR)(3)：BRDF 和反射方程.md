目录：

[TheTus：从零开始的基于物理的渲染 (PBR)(0)：开篇](https://zhuanlan.zhihu.com/p/633603239)

在第一章中，我们介绍了几个重要的辐射量，掌握了正确衡量光线属性的方法。在这一章中，我们会借助这些辐射量得出最基础的概念——BRDF，然后在此概念上推导出反射方程和渲染方程。

关于 BRDF，有几个常见的误区。

第一个是，**BRDF ≠ BxDF**。

BxDF 一般而言是对 BRDF、BTDF、BSDF、BSSRDF 等几种双向分布函数的一个统一的表示。

其中，BSDF 可以看做 BRDF 和 BTDF 更一般的形式，而且 BSDF = BRDF + BTDF。

而 BSSRDF 和 BRDF 的不同之处在于，BSSRDF 可以指定不同的光线入射位置和出射位置。

在上述这些 BxDF 中，BRDF 最为简单，也最为常用。因为游戏和电影中的大多数物体都是不透明的，用 BRDF 就完全足够。而 BSDF、BTDF、BSSRDF 往往更多用于半透明材质和次表面散射材质。

![[454fac9363267b6c5528926d4bc50319_MD5.jpg]]

第二个是，**BRDF ≠ Microfacet Cook-Torrance BRDF**。

在谈到 BRDF 或反射方程时，有时会直接拿出那一大坨的 Microfacet Cook-Torrance BRDF 公式或 Microfacet Cook-Torrance 反射方程。这其实是不准确的，BRDF 本质就是一个比例式，而 Microfacet Cook-Torrance BRDF 是基于微表面模型的 BRDF 的一种特定实现。虽然它是游戏业界目前最主流的镜面反射 BRDF 模型，但它并不代表所有的 BRDFs。

在这一章中，主要需要理解如下要点：

*   辐射量 (第一章)
*   BRDF 定义
*   渲染的本质
*   反射方程

## BRDF

为了进一步建模，我们只考虑光线的 **局部反射 (local reflection)** 情况，即光线击中表面，然后从交点向外反射出来。这里的 “反射” 并非“镜面反射“，它包括表面的镜面反射和次表面散射(见上一章 光线与表面作用的方法)，但在局部反射中，可以把它们统一看作从宏观表面交点反射出来的光线。

局部反射由 **双向反射分布函数 (bidirectional reflectance distribution function, BRDF)** 量化，表示为 $f(l, v)$ 。BRDF 被定义在均匀表面 (uniform surfaces)，这意味着任意点的 BRDF 相同。并且假设给定波长的入射光以相同的波长反射。

**光线沿ωi 打到表面上某一面积微元上后，光线的 irradiance dE(ωi) 会在交点处沿不同方向辐射出 radiance dL(ωr)。**

![[3e8a79f380ab67ab4c698c65c66b1fd2_MD5.jpg]]

在上一章微观几何学中提到，反射光线的分布受到宏观表面的微观几何影响。当微观尺度越粗糙，反射 glossy 越分散，而微观尺度越平滑，反射 glossy 越集中。因此，BRDF 就是描述从不同方向入射后，反射光线的分布情况。具体来说，BRDF 为 **朝某个方向发出反射光 radiance 与入射光 irrandiance 的比值**。

![[9fada69e566c10e4ac9847dd065da360_MD5.jpg]]

$f_{r}(w_{i}, w_{r})=\frac{dL_{r}(w_{r})}{dE_{i}(w_{i})}=\frac{dL_{r}(w_{r})}{L_{i}(w_{i}cos\theta_{i}d\omega_{i})}~~[\frac{1}{sr}]$

其中，入射光方向为 $\omega_{i}$ ，出射光方向为 $\omega_{r}$ ，入射光总 irradiance 为 $L_{i}(x, \omega_{i})$ ，出射光ωr 方向 irrdiance 为 $L_{r}(x, \omega_{r})$ 。

BRDF 需要满足两个规则。

第一个规则，BRDF 需要满足 **赫姆霍兹互易性 (helmholtz reciprocity)**，即交换 BRDF 的两个输入向量，BRDF 的值不变。

$f(l,v)=f(v,l)$

在实时渲染中，通常不需要完全满足赫姆霍兹互易性的 BRDF。但赫姆霍兹互易性常用来确定 BRDF 是否符合物理。

第二个规则，BRDF 需要满足 **能量守恒 (conservation of energy)**。即出射能量不能大于入射能量 (不考虑表面自发光)。对于实时渲染来说，精确的能量守恒是不必要的，但近似的能量守恒是很重要的。不满足能量守恒的 BRDF 可能导致物体表面过亮，不符合物理真实性。

**定向半球反射率 (directional-hemispherical reflectance)** 用来计算 BRDF 能量守恒的比率。本质上，它测量了给定入射方向的能量损失。

$R(l)=\int_{v\in\Omega}f(l,v)(n\cdot v)dv$

其中，$l$ 为入射向量，$v$ 为半球上所有的观察向量。

类似的，**半球方向反射率 (hemispherical-directional reflectance)** 可以被类似地定义：

$R(v)=\int_{l\in\Omega}f(l,v)(n\cdot l)dl$

当 BRDF 满足赫姆霍兹互易性时，定向半球反射率和半球方向反射率相等。这种情况下，**定向反照率 (directional albedo)** 可以认为是两种反射率的总称。

最简单的 BRDF 情况兰伯特 (Lambertian) 模型 ，**兰伯特 BRDF(Lambertian BRDF)** 在实时渲染中常被用来表示局部次表面散射，它是最基础的 **漫反射 BRDF(Diffuse BRDF)** 模型。兰伯特表面的定义是将入射光 radiance 均匀的反射到各个方向。

根据兰伯特表面的定义，兰伯特 BRDF $f(l,v)$ 应该是一个常数。在定向半球反射率的方程中将其提出，得到兰伯特定向半球反射率方程为：

$R(l)=\pi f(l,v)$

兰伯特 BRDF 的常量值通常被称为 **漫反射颜色 (diffuse color)** $c_{diff}$ 或 **反照率 (albedo)**$\rho$。它们的实质都是 **次表面反照率 (subsurface albedo)** $\rho_{ss}$ (详见上章)。

$f(l,v)=\frac{\rho_{ss}}{\pi}$

分母中出现 $\pi$ 的原因是入射光 $cos\theta_{i}$ 对半球积分结果为 $\pi$ 。这在 BRDFs 中很常见。

在实时渲染中，我们常常用 rgb 常数α来表示兰伯特的反照率。

## 反射方程

渲染的本质是计算进入相机的 radiance，即 $L_{i}(c, -v)$ ，其中 $c$ 为相机位置， $-v$ 为观察方向。在渲染中，我们将介质建模为相对清洁的空气，它对光的辐射方向没有明显影响，因此可以忽略。即 $L_{i}(c, -v) = L_{o}(p, v)$ ，其中 p 是光线与物体表面的交点。所以，我们现在的计算目标为$L_{o}(p, v)$ $。

也就是说，渲染的本质是从相机发出一条 radiance 为 $L_{i}(x,\omega_{i})$ 的光线，打到场景物体的表面，计算该射线与相机近平面的交点 radiance $L_{o}(p, v)$ 。

![[940406e7505fbc2946810fd67c175e7b_MD5.gif]]

而反射方程就是描述这个过程的式子，即 $f(x):不同方向的输入光源的radiance\rightarrow输出光源的radiance$ 。借助 BRDF，我们可以得到 **反射方程 (relfection equation)**：

![[52c53f8d1dbb2c96ad723b934e41e22c_MD5.jpg]]

$L_{r}(p,\omega_{r})=\int_{H^{2}}f_{r}(p,\omega_{i},\omega_{r})L_{i}(p,\omega_{i})cos\theta_{i}d\omega_{i}$

其中，入射光方向为 $\omega_{i}$ ，出射光方向为 $\omega_{r}$ ，入射光总 irradiance 为 $L_{i}(x, \omega_{i})$ ，出射光ωr 方向 irrdiance 为 $L_{r}(x, \omega_{r})$ 。

简单推导一下，由于 radiance L 具有线性性质，所以相机受到 $\omega_{r}$ 方向反射的 radiance 应该是所有方向 $\omega_{i}$ (即单位半球) radiance 贡献的积分。

由于 $BRDF=\frac{radiance_{\omega_{r}}}{irradiance_{\omega_{i}}}$ ，所以一个入射方向 $\omega_{i}$ 朝反射方向 $\omega_{r}$ 贡献的 radiance 为 $BRDF\times irradiance_{\omega_{i}}$ 。

那么朝反射方向 $\omega_{r}$ 的 radiance：

$\begin{align} L_{r}(p,\omega_{r})&=\sum{radiance_{\omega_{wi\rightarrow\omega_{r}}}}\\ &=\int_{H^{2}}BRDF\times irrdiance_{\omega_{i}}\\ &=\int_{H^{2}}f_{r}(p,\omega_{i},\omega_{r})L_{i}(p,\omega_{i})cos\theta_{i}d\omega_{i} \end{align}$

观察反射方程， $L_{i}(p,\omega_{i})$ 不仅仅是光源所引起的，还有可能是其他物体着色点 q 的反射光线 radiance 打到 p 上的贡献，即间接光照。此时，我们可以将其他物体也当作发出 radiance'的直接光源。同时，着色点 q 的 radiance 也是由直接光照和间接光照的共同贡献。即这其实是一个递归过程。

## 渲染方程

反射方程可以认为是 **渲染方程 (rendering equation)** 的简化版本，或者说一个特例。渲染方程在反射方程的基础上，添加了一个 **自发光项 (emission term)**，使其更加通用：

$L_{o}(p,\omega_{o})=L_{e}(p,\omega_{o})+\int_{\Omega^{+}}L_{i}(p,\omega_{i})f_{r}(p,\omega_{i},\omega_{o})(n\cdot \omega_{i})d\omega_{i}$

其中， $L_{e}(p,\omega_{o})$ 为着色点自发光的 radiance。

下面我们讨论局部光照中的光源。

首先考虑单个 **点光源**。我们定义光源颜色 $c_{light}$ 为光源垂直入射纯白 (完全吸收入射 radiance) 的兰伯特表面，垂直观察着色点反射的 radiance (即 $n=l$ 时， $L(p,\omega) = c_{l}$ )。这是一种直观的定义，因为光的颜色直接对应其视觉效果。

![[df8ba16667209392cc83089af9d55138_MD5.jpg]]

此时可以对反射方程进一步化简，得到：

$L_{r}(x,\omega_{r})=L_{e}(x,\omega_{r})+\pi f(x,\omega_{i}, \omega_{r})c_{light}(\omega_{i}\cdot n)^{+}$

其中， $(n\cdot l_{c})^{+}$ 表示对其进行钳位到正半球 (0~1)。方程前的 $\pi$ 因子用来抵消 BRDFs 中经常出现的 $1/\pi$ 因子，具体需要视 BRDF 模型而定。另一种说法是渲染方程的前提是考虑全方位入射的光，但在局部模型中会得到很暗的结果，所以就把单个光源的 radiance 乘以 $\pi$ 近似全方位光源输入。

多个点光源的情况，将所有点光源对着色点 p 的贡献相加即可。

![[0c7cd2b33abb586d8f19afa92fd7f532_MD5.jpg]]

$L_{r}(x,\omega_{r})=L_{e}(x,\omega_{r})+ \pi \sum{f(x,\omega_{i},\omega_{r})c_{light_{k}}(\omega_{i}\cdot n)^{+}}$

其中， $c_{light_{k}}$ 为第 k 个点光源的 radiance。

下面讨论 **面光源** 的情况，面光源可以认为是无穷多个点光源的集合，所有只需要对面光源所在立体角范围进行积分，并且能够确定不同立体角反方向面光源入射光的 radiance 即可。

![[ef07bbc7c4017d7698ffa8a0e14423c3_MD5.jpg]]

$L_{r}(x,\omega_{r})=L_{e}(x,\omega_{r})+\pi\int_{\Omega}c_{light_{i}}f(x,\omega_{i},\omega_{r})(\omega_{i}\cdot n)d\omega_{i}$

其中， $c_{light_{i}}$ 为立体角为 $\omega_{i}$ 的入射光 radaince。

## 参考

《Real-time Rendering 4th》

[基于物理渲染 (PBR) 白皮书](https://github.com/QianMo/PBR-White-Paper/tree/master)

[Games101: Lecture 15](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_15.pdf)

[孙小磊的计算机图形学笔记](https://zhuanlan.zhihu.com/p/145410416)

[Physically Based Rendering 3ed: Surface Reflection](https://www.pbr-book.org/3ed-2018/Color_and_Radiometry/Surface_Reflection)

[Physically Based Rendering 3ed: Lambertian Reflection](https://www.pbr-book.org/3ed-2018/Reflection_Models/Lambertian_Reflection)

[wiki: Bidirectional scattering distribution function](https://en.wikipedia.org/wiki/Bidirectional_scattering_distribution_function)