目录：

[TheTus：从零开始的基于物理的渲染 (PBR)(0)：开篇](https://zhuanlan.zhihu.com/p/633603239)

在上一章中，我们介绍了 BRDF 和反射方程，它们是所有 BRDF 模型的基础。在这一章中，我们会介绍菲涅尔反射，它指示了表面的反射率。然后介绍很多 BRDFs 模型 (包括 Cook-Torrance) 的最核心理论——微表面理论，并在此基础上得出宏观 BRDF 的公式，为下一章推导出 Cook-Torrance 公式做铺垫 (但不会深入每个参数函数的具体计算过程)。

## 菲涅尔反射

表面是指将不同折射率的体积 (介质) 分开的二维界面。光打到表面上，会进行反射和折射(不考虑次表面散射)。折射的方向可以通过斯涅尔公式求解(见第二章)。

对于反射向量，可以通过入射方向和表面法线进行求解，如下图。

![[7a6f203eccf93b6400b72ecbbe6526c4_MD5.jpg]]

 $r_{i}=2(n\cdot l)n-l$

其中， $r_{i}$ 为反射向量， $n$ 为表面法线， $l$ 为入射向量。

**菲涅尔效应 (fresnel effect)** 指的是反射随着 **掠射角 (glancing angle, 入射光与表面的夹角)** 的增大而增强。如下图，三张图的书都垂直于表面放置，唯一不同的是拍摄的角度 (掠射角)。当垂直入射时，几乎看不到反射。当接近 grazing angle(浅入射角，入射光与表面平行) 时，反射十分强烈。

![[eff99384ccd10b70e1b9af0fc19514ed_MD5.jpg]]

通过上述例子，我们可以得出，某种材质的反射光强度与入射角度有关。光打到表面上，会进行折射与反射。而 **菲涅尔方程 (fresnel equations)** 描述了从表面反射出来的光的数量。给定折射率 (IOR) 和掠射角，菲涅尔方程给出该材质在两种介质下入射该表面的反射率。

精确的菲涅尔方程如下 (看个乐)：

 $\begin{align} r_{\parallel}&=\frac{\eta_{\mathrm{t}}\cos\theta_{\mathrm{i}}-\eta_{\mathrm{i}}\cos\theta_{\mathrm{t}}}{\eta_{\mathrm{t}}\cos\theta_{\mathrm{i}}+\eta_{\mathrm{i}}\cos\theta_{\mathrm{t}}},\\ r_{\perp}&=\frac{\eta_{\mathrm{i}}\cos\theta_{\mathrm{i}}-\eta_{\mathrm{t}}\cos\theta_{\mathrm{t}}}{\eta_{\mathrm{i}}\cos\theta_{\mathrm{i}}+\eta_{\mathrm{t}}\cos\theta_{\mathrm{t}}},\\ F_{\mathrm{r}}&+=\frac{1}{2}(r_{||}^{2}+r_{\perp}^{2}). \end{align}$

其中， $\eta_{\mathrm{i}}$ 和 $\eta_{\mathrm{t}}$ 分别为入射和折射介质折射率； $\omega_{i}$ 和 $\omega_{t}$ 分别为入射和折射方向，它们可以通过斯涅尔定律计算。

由于能量守恒，表面传输的能量为 $1-F_{r}$ 。

然而，在实时渲染中，这个公式由于复杂度通常是不使用的，更多的是使用后面介绍的近似公式。

光线在表面的反射可以分为两类，一种是 **外反射 (external reflection)**，它指 $n1<n2$ 的情况，即光线从折射率较低的介质折射进折射率较高的介质。通常入射介质为空气 (IOR≈1.003/1)，出射介质为物体。另一种是 **内反射 (internal reflection)**，它指的是光线从物体折射入空气。由于内反射计算昂贵，实时渲染一般考虑外反射的情况。下面都基于外反射进行讨论。

对于给定的物质，菲涅尔方程可以被解释为一个反射函数 $F(\theta_{i})$ ，仅依赖于入射角度 (掠射角)。在实时渲染中，它通常被解释为 RGB 向量。函数 $F(\theta_{i})$ 有如下性质：

*   当θi=0° 时，光线法线入射 (normal incidence)。此时 $F(\theta_{i})$ 的值时物质的属性，可以看作物质的镜面反射颜色，记为 **F0**。
*   随着θi 的增加， $F(\theta_{i})$ 的值趋于增加。当 $\theta_{i}=90°$ 时，可以认为 $F(\theta_{i})$ 为白色。

不同物质的 $F(\theta_{i})$ 不同，但他们都满足上述性质。如下图所示，分别是玻璃、铜和铝的 $F(\theta_{i})$ 随角度的变化，rgb 被单独绘制。

![[d6788654920532379c34775a69d3ed29_MD5.jpg]]

**反射通常在物体边缘更强**。这是因为在镜面反射下，入射角等于出射角。眼睛与物体边缘的出射角更大，入射角也就更接近 90°， $F(\theta_{i})$ 更大。

由于菲涅尔方程的复杂性，在实时渲染中，一般使用 **Schlick 近似公式**：

 $\begin{align} F(n,l)&=F_{0}+(1-F_{0})(1-(n\cdot l)^{+})^{5}\\ F_{0}&=(\frac{n_{1}-n_{2}}{n_{1}+n_{2}})^{2} \end{align}$

其中， $n$ 为表面法线， $l$ 为入射光向量。 $F_{0}\in[0,1]$ 是控制菲涅尔反射率的唯一参数，事实上它与材质有关，但我们使用这个式子进行近似。这个方程的结果是在白色和 $F0$ 之间的插值 RGB。

相对精确公式，Schlick 近似公式虽然简单，但也十分精确。

## 微表面理论

在第二章中，我们讨论了微观几何学。概括来说，即粗糙表面可以被建模成一组微平面，微平面通常被建模为高度场。每个微平面有着自己的法线，它们的分布对宏观的法向量有贡献，最终的表面外观是许多具有不同表面取向的点的聚合结果。

[TheTus：从零开始的基于物理的渲染 (PBR)(2)：物理材质和物理相机](https://zhuanlan.zhihu.com/p/633527357)

许多 BRDFs 模型都基于微观几何学对反射率的影响进行数学分析，这被称为 **微表面理论 (microfacet theory)**。

微表面理论将微观几何建模为一组 **微平面 (microfacets)**，每个微平面都是平滑的，有着自己的 **微平面法线 (microfacet normal)** $m$。同时，每个微平面都根据自己的 **微平面 BRDF(micro-BRDF)** $f_{\mu}(l,v,m)$ 对光进行反射，宏观表面的 BRDF 被认为是微 BRDF 的共同贡献。通常情况下，我们将微平面视为完美的菲涅尔镜 (perfect Fresnel mirror)，这用于对镜面反射 BRDF 进行建模。

### 法线分布函数 NDF

对于微表面模型的一个重要性质即每个微平面都有自己的微平面法线 $m$ 。微平面法线的分布被称为表面的 **法线分布函数 (NDF, normal distribution function)** $D(m)$ 。

法线分布函数是对微平面法线在微观几何表面上的统计分布，即 $D(m)$ 表示法线方向为 $m$ 的微平面在微观几何中的密度。它的数学定义如下：

 $D(m)=\int_{\cal M}\delta_{m}(m)\,d p_{m} ~~~~[\frac{m^{2}}{sr}]$

其中， $M$ 为微表面， $m$ 为微表面上一点 $p_{m}$ 的微平面法线。 $\delta$ 是狄拉克函数，它是一个在除了零以外的点函数值都等于零，而其在整个定义域上的积分等于 1 的函数。这个定义式说明 D(m)的范围是 [0, ∞] 而非[0,1]。在本专栏文章中，为了方便，称这个方程为 **NDF 定义式**。不用过度理解这个方程，只需要知道它从数学上表达了 $D(m)$ 的定义是微表面上所有微平面法线为 $m$ 的点的密度。

微平面法线的分布情况决定了宏观材质外观的粗糙度。如下图所示，当微平面法线分布集中，宏观材质表现得越光滑。反之则越粗糙。

![[a94496d2f834c035ca1086a993ed660c_MD5.jpg]]

关于法线分布函数定义中的 “密度”，究竟指的是什么，有很多说法。这里给出 Walter et al. 在 Paper:[Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs](https://jcgt.org/published/0003/02/03/paper.pdf) 给出的定义：

The microfacet normal distribution, **D(m)**, describes the statistical distribution of surface normals **m** over the microsurface. Given an infinitesimal solid angle **dω** centered on **m**, and an infinitesimal macrosurface area **dS**, **D(m)dωdS** is the total area of the portion of the corresponding microsurface whose normals lie within that specified solid angle. Hence **D** is a density function with units of 1/steradians.

![[24a7fb676f8588ade097e727c0b28bfb_MD5.jpg]]

如上图微表面侧视图所示，则 NDF 函数 $D(m)$ 服从等式： $A=D(m)d\omega dS$ 其中， $A$ 为所有微平面法线为 $m$ 的微表面面积 (上图红线面积)， $\omega$ 为微平面法线 $m$ 的立体角， $dS$ 为无穷小的保证为 flat 的宏观表面面积微元，但它大于微表面面积微元。

通过这个等式，我们可以得出 $D(m)$ 的物理含义，即**每单位面积，每单位立体角，所有法向为 m 的微平面的面积**。

在本专栏文章中，为了方便，称这个方程为 **NDF 面积方程**。

由于 BRDF 反映的是一个能量比例，所以按照习惯我们将宏观表面面积规定为 1。

法线分布函数有如下性质：

性质一：法线分布函数与微平面法线的积分为微表面面积。

![[452c4c49fcc7f42c581f746ce70aab75_MD5.jpg]]

$\int_{m\in{\Theta}}D(m)dm=A$

这个方程的推导就是把 NDF 面积方程的立体角变换为向量。但我们可以直接从 $D(m)$ 物理含义入手，统计全球上所有法向为 $m$ 微平面面积

性质二：微平面法线投影到宏观表面上面积的积分为宏观表面面积 (规定为 1)。

$\int_{m\in\Theta}D(m)(n\cdot m)dm = 1$

![[452c4c49fcc7f42c581f746ce70aab75_MD5.jpg]]

如下图所示，我们把微表面面积微元通过 $n\cdot m$ 投影到宏观表面面积微元，再统计起来就得到了宏观表面面积 (规定为 1)。

![[d4b5c4ecd6a27f76dfe4d9f3b2abecd0_MD5.jpg]]

这是法线分布函数最基本的性质，建立了微观与宏观表面的联系。它用于对微表面面积进行 **归一化**，使其反射率或透射率的总和为 1。

性质三：微表面法线投影到视角垂平面等效于宏观法线投影到视角垂平面。

![[ae994c2160ad9b460a38d0b00f822600_MD5.jpg]]

 $\int_{m\in\Theta}D(m)(v\cdot m)dm=v\cdot n$

这个解释与性质二类似，由于点乘向量为微平面法线和观察向量，所以几何意义应该是将微表面投影到视垂平面。

观察上图，我们并没有对 $v\cdot m$ 进行钳位，这意味着存在观察不到的微平面 (即 masking，见第二章)，它对投影的贡献是负的。但这个负贡献将与与其重叠的能够观察到的微平面的正投影贡献相抵消，最终统计的投影面积等效于宏观法线投影到视垂直平面的面积。

性质三反映了 **视角方向接收的微表面反射能量的比例**。

### 遮蔽函数

正如上面所述，我们的法线分布函数性质三方程考虑了所有重叠的微表面。然而对于渲染来说，我们只关心可见的微表面，即每个重叠集合中最靠近相机的微表面。

基于上述事实，我们可以提出另外一种统计微平面法线到视角垂平面的投影面积：统计所有可见微平面法线到视角垂平面的投影面积。如下图，我们只考虑可见的红线部分的投影贡献。

![[22be779d5b79650eaf1533fe67a753df_MD5.jpg]]

我们可以通过定义 **遮蔽函数 (masking function)** $G_{1}(m,v)$ 来数学的表示这一点，该函数给出法线为 $m$ 且沿视角 $v$ 可见的微平面比例。

 $\int_{m\in\Theta}G_{1}(m,v)D(m)(v\cdot m)^{+}dm=v\cdot n$

其中， $(v\cdot m)^{+}$ 表示钳位到 0，它表示不可见的背微平面不会被计算。 $G_{1}(m,v)D(m)$ 为 **可见法线分布 (distrubition of visible normals)**。

对于给定法线分布函数 D(m)，可以有无数个遮蔽函数 G(m)。这是因为 D(m) 并没有完全指定微表面，它只告诉了微表面法线的分布，但不知道它们的排列。

一个被广泛使用的 G1 遮蔽函数为 **The Smith G1** 函数，它最初是针对高斯正态分布推导出来的，后来推广到任意的 NDFs 上。

 $\begin{align} G_{1}(\mathbf{m},\mathbf{v})&={\frac{\chi^{+}(\mathbf{m}\cdot\mathbf{v})}{1+\Lambda(\mathbf{v})}},\\ \chi^{+}(x)&=\left\{\begin{matrix}1,~~where~x>0.\\0,~~where~x\leq 0.\end{matrix}\right. \end{align}$

其中， $m$ 为微平面法线， $v$ 为观察向量， $\Lambda$ 函数视 NDF 而不同。

正如上面讨论的那样，遮蔽函数 G1 只考虑了微表面对视线的遮挡，即 Masking。而还存在微表面对光线的遮挡，即 Shadowing。(见第二章)

![[8c71e0b51185e84c583ab7a1df499b63_MD5.jpg]]

为了考虑 Masking 对可见法线的影响，提出了 **联合遮蔽 - 阴影函数 (joint masking-shadowing function)** $G_{2}(l,v,m)$，也被称为 **几何函数 (geometry function)** 。

实际应用中，常用 **The Smith Shadow-Masking G2** 函数，它将 Shadowing 和 Masking 分开考虑。由于光路的可逆性，我们可以认为两种情况是近似等效的。

 $G_{2}(l,v,m)=G_{1}(v,m)G_{1}(l,m)$

它建立在 Shadowing 和 Masking 不相关的基础上，但实际上它们是相关的。使用这个 G2 会导致 BRDFs 结果偏暗。

## 宏观 BRDF

基于微表面理论，给出微 BRDF $f_{\mu}(l,v,m)$ ，法线分布函数 $D(m)$ ，联合遮蔽 - 阴影函数 $G_{2}(l,v,m)$ ，我们就可以推导出 **宏观 BRDF(macrosurface BRDF)**：

 $f(l,v)=\int_{m\in\Omega}f_{\mu}(l,v,m)G_{2}(l,v,m)D(m)\frac{(m\cdot l)^{+}}{|n\cdot l|}\frac{(m\cdot v)^{+}}{|n\cdot v|}dm$

其中， $l$ 为入射光向量， $v$ 为观察向量， $n$ 为宏观平面法线， $m$ 为微平面法线。这个函数的积分域为半球体，将向量点积钳位避免收集表面下方的光的贡献。

后面那坨分式 $\frac{(m\cdot l)^{+}}{|n\cdot l|}\frac{(m\cdot v)^{+}}{|n\cdot v|}$ 的作用是考虑 Shadowing 和 Masking，下面我们讨论一下这是怎么来的。

由微表面理论性质三，即

 $\int_{m\in\Theta}G_{1}(m,v)(m\cdot v)dm=n\cdot v$

它将微平面法线投影到视角垂平面，反映了相机接收的微表面反射的能量比例，但它的范围是 $[0,n\cdot v]$。为了得到 **归一化的相机接收的微表面反射的能量比例** ，我们对两边同时除以 $|n\cdot v|$：

 $\int_{m\in\Theta}G_{1}(m,v)\frac{m\cdot v}{|n\cdot v|}dm=\frac{n\cdot v}{|n\cdot v|}\in[0,1]$

同理，

 $\int_{m\in\Theta}G_{1}(m,l)\frac{m\cdot l}{|n\cdot l|}dm=\frac{n\cdot l}{|n\cdot l|}\in[0,1]$

反映了 **归一化的表面接收的入射光的能量比例**。

同 The Smith G2 函数的思想，我们认为 Shadowing 和 Masking 是不相关的，即 $G_{2}(l,v,m)=G_{1}(v,m)G_{1}(l,m)$ 。

所以，

 $\int_{m\in\Theta} G_{2}(l,v,m)\frac{(m\cdot l)^{+}}{|n\cdot l|}\frac{(m\cdot v)^{+}}{|n\cdot v|}dm=\int_{m\in\Theta}G_{1}(m,v)\frac{m\cdot v}{|n\cdot v|}G_{1}(m,l)\frac{m\cdot l}{|n\cdot l|}dm\in[0,1]$

反映了归一化的，考虑了 Shadowing 和 Masking 的，相机接收的能量比例。

到目前为止，我们并没有对任何参数函数进行展开，这是因为不同光照模型对应的具体 BRDF 模型是不同的。最常见也是一般够用的模型是基于 Cook-Torrance 的镜面反射 BRDF 模型。除此之外，还有次表面散射 BRDF 模型等。而它们都可以通过上面的宏观 BRDF 模型推导而出，可以认为宏观 BRDF 是不同光照模型下的具体 BRDF 模型的母体。

通过包含 G2 函数，宏观 BRDF 能够考虑 Masking 和 Shadowing，但依然没有考虑微平面之间的互反射 (interreflection)，或多表面反射 (multiple surface bounce)。 这是所有源自上述宏观 BRDF 公式的具体 BRDF 模型的共同局限性。

考虑内反射的 BRDF 模型被称为 **多重散射微平面 BRDF(Multiple-scattering microfacet BRDF)**，常见的解决方法有 The Kulla-Conty Approximation 等。具体做法在这里不做讨论，可以看看 Games202。

## 参考

《Real-time Rendering 4th》

[Paper: Microfacet Models for Refraction through Rough Surfaces](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf)

[Paper: Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs](https://jcgt.org/published/0003/02/03/paper.pdf)

[GDC2017: PBR Diffuse Lighting for GGX+Smith Microsurfaces](https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2017/Presentations/Hammon_Earl_PBR_Diffuse_Lighting.pdf)

[基于物理渲染 (PBR) 白皮书](https://github.com/QianMo/PBR-White-Paper/tree/master)

[Physically Based Rendering 3ed: Specular Reflection and Transmission](https://pbr-book.org/3ed-2018/Reflection_Models/Specular_Reflection_and_Transmission)

[Physically Based Rendering 3ed: Microfacet Models](https://www.pbr-book.org/3ed-2018/Reflection_Models/Microfacet_Models)

[Games101: Lecture 17](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_17.pdf)

[Games202](https://www.bilibili.com/video/BV1YK4y1T7yY)

[How Is The NDF Really Defined?](https://www.reedbeta.com/blog/hows-the-ndf-really-defined/)