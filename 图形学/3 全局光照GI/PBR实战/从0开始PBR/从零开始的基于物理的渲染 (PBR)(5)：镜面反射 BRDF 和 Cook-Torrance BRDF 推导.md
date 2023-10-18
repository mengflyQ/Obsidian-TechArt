目录：

[TheTus：从零开始的基于物理的渲染 (PBR)(0)：开篇](https://zhuanlan.zhihu.com/p/633603239)

建议先看上一章：

[TheTus：从零开始的基于物理的渲染 (PBR)(4)：菲涅尔反射、微表面理论和宏观 BRDF](https://zhuanlan.zhihu.com/p/633554265)

镜面反射 BRDF 模型是基于上一章中宏观 BRDF 模型推导而来的，其中最常用最著名的是 Cook-Torrane 模型。在本章中，我们会介绍镜面反射 BRDF 的基本概念，然后推导出 Cook-Torrance BRDF 方程，最后，给出一些业界常用的参数函数。

## 镜面反射 BRDF 及 Cook-Torrance BRDF 模型

大多镜面反射 BRDF 模型都是通过上一章介绍的微表面模型推导出来的。在镜面反射的情况下，每个微平面都是一个完美的 **菲涅尔镜 (Fresnel mirror)**，这意味着一条入射光只会将光线反射成同一方向。即

 $\int_{\Omega}f_{\mu}(l,v,m)(v\cdot m)dv=1$

其中， $f_{\mu}(l,v,m)$ 为微 BRDF 项， $v$ 为观察向量， $n$ 为宏观表面法线。这个式子意味着对于所有光照和法线，所有能量都反射向眼睛。这个式子又被称为 **BRDF 归一化方程**。

如上所述，只有当观察向量 $v$ 平行于入射向量 $l$ 的反射向量 $r$ 时，微 BRDF 项 $f_{\mu}(l,v,m)$ 才不为 0。这等效于，只有当微平面的微平面法线 $m$ 是 $l$ 和 $v$ 的 **半程向量 (half vector)** $h=\frac{l+v}{||l+v||}$ 时，这个微平面才会将能量反射进眼睛，否则这个微平面的能量贡献为 0。

如下图，在镜面反射 BRDF 模型下，只有红线的微平面对眼睛接收的能量有贡献。

![[5f52523d97221c9d2a763508be65398b_MD5.jpg]]

回忆上一章推导出来的宏观 BRDF 方程：

 $f(l,v)=\int_{m\in\Omega}f_{\mu}(l,v,m)G_{2}(l,v,m)D(m)\frac{(m\cdot l)^{+}}{|n\cdot l|}\frac{(m\cdot v)^{+}}{|n\cdot v|}dm$

其中， $l$ 为入射光向量， $v$ 为观察向量， $n$ 为宏观平面法线， $m$ 为微平面法线。这个函数的积分域为半球体，将向量点积钳位避免收集表面下方的光的贡献。

**我们用 $m=h$ 代替宏观 BRDF 方程中的微平面法线，这很重要，因为它将积分贡献集中在了 $m=h$ 的情况评估上。再经过一点点变化**，最终得到镜面反射 BRDF 方程，这也被称为 **Microfacet Cook-Torrance BRDF** (主角终于出来了)：

 $f_{spec}(l,v)=\frac{F(h,l)G_{2}(l,v,h)D(h)}{4|n\cdot l||n\cdot v|}$

各个参数再上一章中都有详细介绍，这里简单概述一下。

*   **D(h)**：法线分布函数，描述微面元法线分布的密度，即 $D(m)$ 表示法线方向为 $m$ 的微平面在微观几何中的密度。物理含义为每单位面积，每单位立体角，所有法向为 $m$ 的微平面的面积
*   **F(l，h)**: 菲涅尔方程，描述不同的表面角下表面所反射的光线所占的比率。
*   **G(l，v，h)**: 几何函数：描述微平面自成阴影的属性，即 $m = h$ 的未被遮蔽的表面点的百分比。
*   **分母 4(n·l)(n·v)** ：校正因子，作为微观几何的局部空间和整个宏观表面的局部空间之间变换的微平面量的校正。

关于这个镜面反射 BRDF 方程，有两点说明：

*   对于分母中的点积，仅仅避免负值是不够的，也必须避免零值。通常通过在常规的 clamp 或绝对值操作之后添加非常小的正值来完成。
*   Microfacet Cook-Torrance BRDF 是实践中使用最广泛的模型，实际上也是人们可以想到的最简单的微平面模型。它仅对几何光学系统中的单层微表面上的单个散射进行建模，没有考虑多次散射，分层材质，以及衍射。

这个方程的推导放在文章最后。

DFG 的含义和相关性质在上一章做了详细讨论，这里不再复述。

下面简单描述部分 DFG 函数，有关 DFG 具体函数的推导，这里就不做展开，看之后有没有时间继续补充吧。

### 法线分布函数 D

渲染中使用的大多数 NDF 都是各向同性的，即关于宏观表面法线 n 旋转对称。在这种情况下，NDF 只是一个关于 n 和微平面法线 m 之间的角度的函数。理想情况下，可以将 NDF 写成 $cos\theta_{m}$ 的表达式，并且可以通过计算 $n$ 和 $m$ 的点积来高效地计算。

对于镜面反射 BRDF，法线分布函数 D 的常见模型可总结如下：

*   Beckmann[1963]
*   Blinn-Phong[1977]
*   GGX [2007] / Trowbridge-Reitz[1975]
*   Generalized-Trowbridge-Reitz(GTR) [2012]
*   Anisotropic Beckmann[2012]
*   Anisotropic GGX [2015]

**业界主流的法线分布函数是 GGX**。

**Beckmann**

Beckmann 是一种定义在坡度空间上的类高斯分布模型，这个函数可以描述不同粗糙程度的表面，不同粗糙程度的意思是 NDF 中 lobe 是集中在一个点上，还是分布得比较开。它的表达式为

 $D_{Beckmann}(h)=\frac{e^{-\frac{tan^{2}\theta_{h}}{\alpha^{2}}}}{\pi\alpha^{2}cos^{4}\theta_{h}}$

其中， $h$ 为半程向量； $\alpha$ 为粗糙系数，粗糙程度这个值越小，表面就越光滑； $\theta_{h}=(\hat{n}\cdot \hat{m})$ 是半程向量与宏观法线的夹角。 高斯分布函数 $X\sim N(\mu,\sigma^{2})=\frac{1}{\sqrt{2\pi}\sigma}^{-\frac{(x-\mu)^{2}}{2\sigma^{2}}}$ 中， $\sigma$ 控制胖瘦程度，同样的，在 Beckmann 表达式中， $\alpha$ 控制胖瘦程度。

![[fb9c19a8c393df03c7975ec33c889e0e_MD5.jpg]]

之所以幂的分子上使用 $tan\theta_{h}$ ，而不直接使用 $\theta_{h}$ 是因为 Beckmann 定义在坡度空间上，需要满足高斯部分的定义域无限大的性质，保证函数无论何时都具有对应的非负值，并且避免微表面出现法线朝下的问题 (但无法避免反射光朝下)。

![[ff979cf2a41139cb4a5100491c7ea536_MD5.jpg]]

**GGX**

GGX 模型的表达式为

 $D_{GGX}(h)=\frac{\alpha^{2}}{\pi(cos^{2}\theta_{h}(\alpha^{2}-1)+1)^{2}}$

其中， $h$ 为微观半程向量； $\alpha$ 为粗糙系数，粗糙程度这个值越小，表面就越光滑； $\theta_{h}=(\hat{n}\cdot \hat{m})$ 是半程向量与宏观法线的夹角。 GGX 相对于 Beckmann 在工业界得到了更为广泛的应用，因为它具有更好的高光拖尾 (Long tail 性质，衰减更加柔和)。

![[b55bc08e7043ee7b754a3e565fbaf616_MD5.jpg]]

这会带来两个好处：

*   Beckmann 的高光会逐渐消失，而 GGX 的高光会减少而不会消失，这就意味着高光的周围我们看到一种光晕的现象。
*   GGX 除了高光部分，其余部分会像 Diffuse 的感觉。

![[3ab0674d6edfa19f799e1142e5ac8417_MD5.jpg]]

**GTR**

GTR 是根据对 GGX 等分布的观察，提出的广义法线分布函数，其目标是允许更多地控制 NDF 的形状，特别是分布的尾部。它的表达式为：

 $D_{GTR}(h)=\frac{c}{(1+cos^{2}\theta_{h}(\alpha^{2}-1))^{\gamma}}$

其中， $h$ 为微观半程向量； $\alpha$ 为粗糙系数，粗糙程度这个值越小，表面就越光滑； $\theta_{h}=(\hat{n}\cdot \hat{m})$ 是半程向量与宏观法线的夹角。 $\gamma$ 参数用于控制尾部形状。当 $\gamma=2$ 时，GTR 等同于 GGX。随着 $\gamma$ 的值减小，分布的尾部变得更长。而随着 $\gamma$ 值的增加，分布的尾部变得更短。

![[4a7b3f86070440b46ab2f2c113de242b_MD5.jpg]]

### 菲涅尔项 F

对于镜面反射 BRDF，菲涅尔项 F 的常见模型可以总结如下：

*   Cook-Torrance [1982]
*   Schlick [1994]
*   Gotanta [2014]

**业界方案一般都采用 Schlick 的 Fresnel 近似**，因为计算成本低廉，而且精度足够：

 $F_{S c h l i c k}({\mathbf{v},\mathbf{h}})=F_{0}+({\mathbf{l}}-F_{0}){\bigl(}{\textbf{l}}-(v\cdot h){\bigr)}^{5}$

### 几何函数 G

对于镜面反射 BRDF，几何函数 G 的常见模型可以总结如下：

*   Smith [1967]
*   Cook-Torrance [1982]
*   Neumann [1999]
*   Kelemen [2001]
*   Implicit [2013]

另外，Eric Heitz 在 [Heitz14] 中展示了 Smith 几何阴影函数是正确且更准确的 G 项，并将其拓展为 Smith 联合遮蔽阴影函数(Smith Joint Masking-Shadowing Function)，该函数具有四种形式：

*   分离遮蔽阴影型 (Separable Masking and Shadowing)
*   高度相关掩蔽阴影型 (Height-Correlated Masking and Shadowing)
*   方向相关掩蔽阴影型 (Direction-Correlated Masking and Shadowing)
*   高度 - 方向相关掩蔽阴影型 (Height-Direction-Correlated Masking and Shadowing)

目前较为常用的是其中最为简单的形式，分离遮蔽阴影 (Separable Masking and Shadowing Function)。

该形式将几何项 G 分为两个独立的部分：光线方向 (light) 和视线方向 (view)，并对两者用相同的分布函数来描述。根据这种思想，结合法线分布函数(NDF) 与 Smith 几何阴影函数，于是有了以下新的 Smith 几何项：

*   Smith-GGX
*   Smith-Beckmann
*   Smith-Schlick
*   Schlick-Beckmann
*   Schlick-GGX

其中 UE4 的方案是上面列举中的 **“Schlick-GGX”** ，即基于 Schlick 近似，将 k 映射为 k=a/2, 去匹配 GGX Smith 方程：

$\begin{align} k&=\frac{\alpha}{2}\\ \alpha&=(\frac{roughness+1}{2})^{2}\\ G_{1}(v)&=\frac{n\cdot v}{(n\cdot v)(1-k)+k}\\ G(l,v,h)&=G_{1}(l)G_{1}v \end{align}$

## 能量补偿项

通过包含 G2 函数，Microfacet BRDF 能够考虑遮蔽 (masking) 和阴影 (shadowing)，但依然没有考虑微平面之间的互反射(interreflection)，或多表面反射(multiple surface bounce)。 而缺少微平面互反射(interreflection) 是业界主流 Microfacet BRDF 的共有的限制。 如图，虽然在小球上没有出现任何 grazing angle 的问题，但随着粗糙度的变大，渲染的结果越来越暗。即使认为最左边是抛光，最右边的是哑光，这个结果也是错误的。如果对小球材质进行白炉测试( $F(i,h)\equiv 1$ ， $uniform irrdiance = 1$ 的天光，检测材质反射能量是否未 1)，这种现象更为明显。

![[112f0e966df064920667cc3908001286_MD5.jpg]]

出现这种问题的原因是标准 Microfacet BRDF 模型虽然能量守恒 (即不会产生任何能量)，但它们也不能在高粗糙度时维持能量 (即能量损失)。 这是由于建模微平面模型时所做出的单散射假设，没有模拟微表面上的多次散射，即缺少微平面互反射 (interreflection)。单散射的在高粗糙度时会有较大的能量损失，从而显得过暗。

![[364b6d526c05b160819f23c1c2057a4c_MD5.png]]

对此，在实时渲染中常用的处理方法是对原先的模型添加一个**能量补偿项**来补足损失的能量。核心思想是将反射光看作两种情况：当不被遮挡时，这些光会被看到；当反射光被微表面遮挡时，这些遮挡住的光将会进行后续的弹射，直到能被看到。

### The Kulla-Conty Approximation

The Kulla-Conty Approximation 通过经验去补全多次反射丢失的能量，其实是创建了一个多次反射表面反射的附加 BRDF 波瓣，利用这个 BRDF 算出消失的能量作为能量补偿项。 需要考虑两件事：

*   在反射时有多少能量丢失
*   最后反射出的能量有多少

首先考虑计算最后反射出的能量，假设 uniform irradiance = 1(渲染方程中 L=1，brdf 与 i、o 无关)，则微表面在经过一次 bounce 后出射的能量百分比为

 $\begin{align} E(\mu_{0})&=\int_{\Omega^{+}}f(\mu_{0},\mu_{i},\phi)cos\theta d\omega\\ &\overset{d\omega=sin\theta d\theta\phi}{=}\int_{0}^{2\pi}\int_{0}^{\pi}f(\mu_{0},\mu_{i},\phi)cos\theta sin\theta d\theta d\phi\\ &\overset{cos\theta d\phi=dsin\theta}{=}\int_{0}^{2\pi}\int_{0}^{1}f(\mu_{0},\mu_{i},\phi)sin\theta dsin\theta d\phi\\ &\overset{\mu=sin\theta}{=}\int_{0}^{2\pi}\int_{0}^{1}f(\mu_{0},\mu_{i},\phi)\mu d\mu d\phi \end{align}$

那么被遮挡的能量百分比就是 $1-E(\mu_{0})$ 。不同方向积分出来的值是不同的，因此只需要计算出不同观察方向损失的能量 $1-E(\mu_{0})$ 。就可以加上这一部分能量，从而解决这一问题。 那么用来能量补偿的 BRDF 就必须满足：

*   光照对称性，即交换 $\mu_{0}$ 和 $\mu_{i}$ 不改变 BRDF 的值
*   余弦加权半球积分值等于缺失能量百分比，即 $E_{ms}(\mu_{0})=1-E(\mu_{0})$

根据第一个条件，可以用待定系数 $c$ 写出 $f_{ms}$ (缺失项) 的表达式

 $f_{ms}(\mu_{0},\mu_{i})=c(1-E(\mu_{0}))(1-E(\mu_{1}))$

再将其代入计算半球积分

 $\begin{align} E_{ms}(\mu_{0})&=\int_{0}^{2\pi}\int_{0}^{1}f(\mu_{0},\mu_{i},\phi)\mu_{i}d\mu_{i}d\phi\\ &=2\pi\int_{0}^{1}c(1-E(\mu_{0}))(1-E(\mu_{i}))\mu_{i}d\mu_{i}\\ &=2\pi c(1-E(\mu_{0}))\int_{0}^{1}(1-E(\mu_{i}))\mu_{i}d\omega_{i}\\ &=\pi c(1-E(\mu_{0}))(1-E_{avg}) \end{align}$

联立 $E_{ms}(\mu_{0})=1-E(\mu_{0})$ ，解得 $c=\frac{1}{\pi(1-E_{avg})}$ ，最终化简得

 $f_{ms}(\mu_{0},\mu_{i})=\frac{(1-E(\mu_{0})(1-E(\mu_{i}))}{\pi(1-E_{avg})}$

其中 $E_{avg}$ 是半球 E 上的余弦加权平均值，其取值仅依赖于粗糙度 $\alpha$ 。

 $\begin{align} E_{avg}&=\frac{\int_{\Omega^{+}}E(\omega_{i}(n\cdot\omega_{i}d\omega_{i}))}{\int_{\Omega^{+}(n\cdot\omega_{i})d\omega_{i}}}\\ &=2\int_{0}^{1}E(\mu)\mu d\mu \end{align}$

可以看出，只依赖于 $\mu_{0}$ 和 $\alpha$ ，也就是说可以根据它们打出一张 2D 纹理。

![[6a3b72f6e4420ee9638baf8b134d5d03_MD5.jpg]]

进而可以很快知道 $E_{avg}$ 对应的积分制，从而代入 $f_{ms}$ 中，进而求出消失的能量 $E_{ms}$ 。

![[49885ecefe8160ac7240250c05a39e9d_MD5.jpg]]

如果单次反射的 BRDF 是有颜色的，则可以认为其表面本身就具备吸收 (或放出) 能量的性质，其额外的 BRDF 项为：

 $f_{ms}(\mu_{0},\mu_{i})=\frac{F_{avg}E_{avg}}{1-F_{avg}(1-E_{avg}}$

其中， $F_{avg}$ 为平均菲尼尔项。宏观菲涅尔效应是微观菲涅尔的均值，所以还是半球上的余弦加权平均：

 $F_{avg}=2\int_{0}^{1}F(\mu)d\mu$

若使用 Schilick 近似，则 $F_{avg}=\frac{20}{21}\cdot F_{0}+\frac{1}{21}$ ，推导如下： 设入射光的总能量为 1，微表面每次散射的能量均为 diffuse，那么每当光线经过散射，原始的能量都要乘以 $F_{avg}$ 经过一次直接反射的能量为： $F_{avg}E_{avg}$

经过一次间接反射 (” 损耗 “的能量再经过微平面反射出来) 的能量为 $F_{avg}(1-E_{avg})\cdot F_{avg}E_{avg}$

······

k 次间接反射的能量为 $F^{k}{avg}(1-E{avg})^{k}\cdot F_{avg}E_{avg}$ 将以上所有能量累加，得 $\frac{F_{avg}E_{avg}}{1-F_{avg}(1-E_{avg})}$ ，再与无色 $f_{ms}$ 相乘，即可得到有色的能量补偿项。

最后，考虑了能量补偿项的渲染方程如下：

 $L_{o}(p,\omega_{o})=\int_{\Omega^{+}}L_{i}(p,\omega_{i})(f_{r}(p,\omega_{i},\omega_{o})+f_{ms}(\omega_{i}.\omega_{o}))cos\theta_{i}d\omega_{i}$

增加颜色项后的结果如下所示。

![[625669c3dfcfb96d7c74cc60f8a01598_MD5.jpg]]
