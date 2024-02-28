---
title: 02 PBR理论
aliases: 
tags: 
create_time: 2023-07-10 12:29
uid: "202307101229"
banner: "[[Pasted image 20230710142347.png]]"
---

**基于物理的渲染**（Physically Based Rendering） 是指使用基于物理原理和微表面理论建模的着色/光照模型，以及使用从现实中测量的表面参数来准确表示真实世界材质的渲染理念。

**三大组成部分：**
1. **基于物理的材质**（Material）
2. 基于物理的光照（Lighting）
3. 基于物理的摄像机（Camera）
![[0aacbee6a7db7477fc451dfab16366a9_MD5.jpg]]
> SIGGRAPH 2014 《Moving Frostbite to PBR》

# 1 PBR 基础基础理论
满足以下条件的光照模型才能称之为 PBR 光照模型（基于物理的材质三大条件）：
*   基于微表面理论的表面模型
*   能量守恒
*   使用基于物理的双向反射分布函数 BRDF

## 微表面理论
**微表面理论**将物体表面建模成无数个微观尺度上有随机朝向的**理想镜面反射**的微小平面（microfacet）。

> [!NOTE] 理想镜面反射
> 理想镜面反射即严格遵循反射定律，反射角等于入射角

光在与非光学平坦表面（Non-Optically-Flat Surfaces）的交互时，非光学平坦表面表现得像一个微小的光学平面表面的大集合。表面上的每个点都会以略微不同的方向对入射光反射，而最终的表面外观是许多具有不同表面取向的点的聚合结果（聚合结果即图红的绿色圆弧范围，这个范围称为**波瓣**）。


![[Pasted image 20230703155510.png]]
>微表面理论：在微观尺度上，表面越粗糙，反射越分散。表面越光滑，反射越集中，就会有更明显的高光。

从微观角度来说，没有任何表面是完全光滑的。由于这些微表面已经微小到无法逐像素地继续对其进行细分，因此我们只有假设一个 Roughness 参数，然后用**统计学方法**来概略的估算微表面的粗糙程度。

我们可以基于一个平面的粗糙度来计算出**某个向量的方向与微表面平均取向方向一致的概率**。这个向量便是位于光线向量 $l$ 和视线向量 $v$ 之间的中间向量，被称为**半角向量 (Halfway Vector)**。  

 ![[1679148476577.png##pic_center]]
$$h = \frac{v+l}{\|v+l\|}$$
## 能量守恒
**能量守恒** ：出射光线的能量永远不能大于入射光线的能量。

当光线折射进入内部的时候会与物体的微小粒子不断发生碰撞并散射到随机方向，同时在碰撞的过程中一部分光线的能量会被吸收转换为热能，有些光线在多次碰撞之后能量消耗殆尽，则表示该光线完全被物体吸收。
还有一部分折射到物体内部的光线会因为散射方向的随机性重新离开表面，而这部分光线就形成了漫反射。

![[Pasted image 20230703155647.png]]

**通常情况下，PBR 会简化折射光，将平面上所有折射光都视为被完全吸收而不会散开。** 而有一些被称为次表面散射 (Subsurface Scattering) 技术的着色器技术会计算折射光散开后的模拟，它们可以显著提升一些材质（如皮肤、大理石或蜡质）的视觉效果，不过性能也会随着下降。

金属 (Metallic) 材质会立即吸收所有折射光，故而金属只有镜面反射，而没有折射光引起的漫反射。

回到能量守恒话题。被表面反射出去的光无法再被材质吸收。故而，**进入材质内部的折射光就是入射光减去反射光后余下的能量。**

![[Pasted image 20230703155640.png]]
>基于微表面理论，我们可以观察到随着粗糙度的上升镜面反射区域的面积会增加。
>基于能量守恒，我们可以观察到镜面反射区域的平均亮度则会下降。

## 渲染方程和反射方程
如何实现能量守恒➡渲染方程
![|450](0f3c00735859275a4fa201b4e4561037.png)
**渲染方程** (Render Equation) 是用来模拟光的视觉效果最好的模型：
$$L_o(p,\omega_o) = L_{e}(p,\omega_{o})+\int\limits_{\Omega} f_r(p,\omega_i,\omega_o) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$
- $L_{e}(p,\omega_{o})$：$p 点的自发光辐射率$


在实时渲染中，我们常用的**反射方程(The Reflectance Equation)**，则是渲染方程的简化版本，或者说是一个特例：

$$L_o(p,\omega_o) = \int\limits_{\Omega} f_r(p,\omega_i,\omega_o) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$
- $p$：点
- $n$：$p$ 点法线
- $w_i,w_o$：无限小的入射光（光源方向）和出射光（观察方向）的立体角，可以看作方向向量。方向由 $p$ 点指向光源或观察者眼睛
- $(n\cdot w_i)$：入射光与法线的点乘，用来衡量入射光与平面法线夹角 $\cos \theta$ 对能量衰减的影响
- $f_r(p,\omega_i,\omega_o)$： BxDF（通常为 BRDF）。描述了入射光反射后在各个方向如何分布
- $L_i(p,\omega_i)$ ：入射光辐射率
- $L_o(p,\omega_o)=\int\limits_{\Omega} ... d\omega_i$：对所有光源方向的半球积分，即从各个方向 $\omega_i$ 射入半球 $\Omega$ 并打中点 $p$ 的入射光，经过反射函数 $f_r$ 进入观察者眼睛的所有反射光 $L_o$ 的辐射率之和。因为计算了所有光源方向的单位立体角，所以**总辐射率=辐照度，即我们最终得到了 $p$ 点的辐照度。**

>在涉及遮挡阴影计算的方程中，还要添加**可见性测试项**，方程如下：
> $$L_o(p,\omega_o) = \int\limits_{\Omega} V_i(p,\omega _i)f_r(p,\omega_i,\omega_o) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$ $V_i (p,\omega _i)$：如果点 $P$ 可以被看见就返回1，否则返回0（也就是光线不被遮挡才能有贡献）。

**反射方程计算了点 $p$ 在所有视线方向 $\omega_0$ 上被反射出来的辐射率 $L_o(p,\omega_o)$ 的总和。换言之：$L_0$ 计算的是在 $\omega_o$ 方向的眼睛观察到的 $p$ 点的辐照度。**

反射方程里面使用的辐照度，必须要包含所有以 $p$ 点为中心的**半球** $\Omega$ 内的入射光，而不单单只是某一个方向的入射光。这个半球指的是围绕面法线 $n$ 的那一个半球：  

![](1679148476772.png)

> [!question] 为什么只计算半球而不计算整个球体呢？
> 因为另外一边的半球因与视线方向相反，不能被观察，也就是辐射通量贡献量为 0，所以被忽略。

**入射光辐射度可以由光源处获得，此外还可以利用一个环境贴图来测算所有入射方向上的辐射度。**

至此，反射方程中，只剩下 $f_r$ 项未描述。$f_r$ 通常是**双向反射分布函数** (Bidirectional Reflectance DistributionFunction, BRDF)，**它的作用是基于表面材质属性来对入射辐射度进行缩放或者加权。** 后文将对其进行推导。


> [!quote] 
> 积分计算面积的方法，有**解析 (analytically)** 和**渐近 (numerically)** 两种方法。目前尚没有可以满足渲染计算的解析法，所以只能选择离散渐近法来解决这个积分问题。
> 
> 具体做法是在半球 $\Omega$ 按一定的步长将反射方程离散地求解，然后再按照步长大小将所得到的结果平均化，这种方法被称为**黎曼和 (Riemann sum)**。下面是实现的伪代码：
> 
> ```cs
> int steps = 100; // 分段计算的数量，数量越多，计算结果越准确。
> float dW  = 1.0f / steps;
> vec3 P    = ...;
> vec3 Wo   = ...;
> vec3 N    = ...;
> float sum = 0.0f;
> for(int i = 0; i < steps; ++i) 
> {
>     vec3 Wi = getNextIncomingLightDir(i);
>     sum += Fr(P, Wi, Wo) * L(P, Wi) * dot(N, Wi) * dW;
> }
> ```
> 
> `dW` 的值越小结果越接近正确的积分函数的面积或者说体积，衡量离散步长的 `dW` 可以看作反射方程中的 $d\omega_i$。积分计算中我们用到的 $d\omega_i$ 是线性连续的符号，跟代码中的 `dW` 并没有直接关系，但是这种方式有助于我们理解，而且这种离散渐近的计算方法总是可以得到一个很接近正确结果的值。值得一提的是，通过增加步骤数 `steps` 可以提高黎曼和的准确性，但计算量也会增大。

### 双向反射分布函数（BRDF）
材质由 BRDF 决定，或者说材质就是 BRDF。
#### 数学建模

**双向反射分布函数**（Bidirectional Reflectance Distribution Function，BRDF）是一个使用入射光方向 $\omega_i$ 作为输入参数的函数，输出参数为出射光 $\omega_o$，表面法线为 $n$，参数 $a$ 表示的是微表面的粗糙度。

为了进一步建模，我们只考虑光线的 **局部反射 (local reflection)** 情况，即光线击中表面，然后从交点向外反射 包括表面的镜面反射和次表面散射）出来。**但在局部反射中，可以把它们统一看作从宏观表面交点反射出来的光线。**
 
局部反射由 BRDF 量化，表示为 $f_r(\omega_i,\omega_o)$。**BRDF 被定义在均匀表面 (uniform surfaces)，这意味着任意点的 BRDF 相同。并且假设给定波长的入射光以相同的波长反射。**

**光线沿 $\omega_i$ 打到表面上某一面积微元上后，光线的辐照度 $dE (\omega_i)$ 会在交点处沿不同方向辐射出辐射率 $dL_r(x,\omega_r)$。**
![[Pasted image 20230713132522.png]]

反射光线的分布受到宏观表面的微观几何影响。当微观尺度越粗糙，反射波瓣越分散，而微观尺度越平滑，反射波瓣越集中。
- @ 因此，BRDF 就是描述光线从不同方向入射后，反射光线的分布情况。具体来说，BRDF 为朝某个方向发出反射光辐射率 radiance 与入射光辐照度 irrandiance 的比值。
$$BRDF=\frac{反射光辐射率(单方向的反射光)}{入射光辐照度(所有方向入射光)}$$
用数学式表达就是

$$f_{r}(w_{i}, w_{r})=\frac{dL_{r}(w_{r})}{dE_{i}(w_{i})}=\frac{dL_{r}(w_{r})}{L_{i}(w_{i}cos\theta_{i}d\omega_{i})}~~[\frac{1}{sr}]$$

![[9fada69e566c10e4ac9847dd065da360_MD5.jpg]]
**BRDF 材质 有三个特性：**
1.  **可逆性**： [Helmholtz reciprocity](https://en.wikipedia.org/wiki/Helmholtz_reciprocity) 即交换 BRDF 的两个输入向量，BRDF 的值不变。（光追采用这个思想，反过来算） $f_r(\omega_i,\omega_o)=f_r(\omega_o,\omega_i)$
2. **能量守恒**。比如反射光能量总和永远不应该超过入射光。技术上来说，Blinn-Phong 光照模型跟 BRDF 一样使用了 $\omega_i$ 跟 $\omega_o$ 作为输入参数，但是没有像基于物理的渲染这样严格地遵守能量守恒定律。
3. **各向同性和各向异性**

#### Cook-Torrance BRDF

BRDF 有好几种模拟表面光照的算法，然而，基本上所有的**实时**渲染管线使用的都是 **Cook-Torrance BRDF**。

Cook-Torrance BRDF 分为漫反射和高光反射两个部分：

$$f_r = k_d f_{lambert} + k_s f_{cook-torrance}$$

- $k_d$ ：漫反射比例
- $k_s$ ：高光反射比例
- $f_{lambert}$ ：漫反射部分，这部分叫做兰伯特漫反射（Lambertian Diffuse）。它类似于我们之前的漫反射着色，是一个恒定的算式：

$$f_{lambert} = \frac{c}{\pi}$$

其中 $c$ 代表的是反射率 Albedo 或漫反射颜色颜色，**除以 $\pi$ 是因为 $\int_{2\pi}cos\theta_od\omega_o=\pi$ ，如果不除 $\pi$ 表示的是反射到半球方向的总能量，而我们眼睛看到的是一个立体角方向，所以需要除π。

> [!quote] 
> 此处的兰伯特漫反射跟以前用的漫反射之间的关系：以前的漫反射是用表面的漫反射颜色乘以法线与面法线的点积，这个点积依然存在，只不过是被移到了 BRDF 外面，写作 $n \cdot \omega_i$，放在反射方程 $L_o$ 靠后的位置。

- BRDF 的高光（镜面）反射部分更复杂：
$$f_{cook-torrance} = \frac{DFG}{4(\omega_o \cdot n)(\omega_i \cdot n)}$$

Cook-Torrance 镜面反射 BRDF 由 3 个函数（$D$，$F$，$G$）和一个标准化因子构成。$D$，$F$，$G$ 符号各自近似模拟了特定部分的表面反射属性：

*   **$D$ (Normal Distribution Function，NDF)**：法线分布函数，描述的是微表面的法线方向与半角向量对齐的概率，如果对齐那么认为该反射光可以被看到，否则没有。这是用来估算微表面的主要函数。
*   **$F$ (Fresnel equation)**：菲涅尔方程，描述的是在不同的表面角下表面反射的光线所占的比率。
*   **$G$ (Geometry function)**：几何函数，描述了微表面自成阴影的属性。当一个平面相对比较粗糙的时候，平面表面上的微表面有可能挡住其他的微表面从而减少表面所反射的光线。

以上的每一种函数都是用来估算相应的物理参数的，而且你会发现用来实现相应物理机制的每种函数都有不止一种形式。它们有的非常真实，有的则性能高效。你可以按照自己的需求任意选择自己想要的函数的实现方法。

Epic Games 公司的 Brian Karis 对于这些函数的多种近似实现方式进行了大量的研究。这里将采用 Epic Games 在 Unreal Engine 4 中所使用的函数，其中 $D$ 使用 Trowbridge-Reitz GGX，$F$ 使用 Fresnel-Schlick 近似法 (Approximation)，而 $G$ 使用 Smith's Schlick-GGX。

#### D：GGX/TR
对于微表面模型的一个重要性质即每个微平面都有自己的微平面法线 $m$ 。微平面法线的分布被称为表面的 **法线分布函数 (NDF, normal distribution function)** $D(m)$ 。

![[Pasted image 20221211101035.png]]
 >如果一个微表面法线分布集中我们认为他是 glossy（光滑） 材质，如果分布分散则认为是漫反射材质
 
 
法线分布函数，从统计学上近似的表示了与某些（如中间向量 $h$）向量取向一致（即微平面法线 $n$ 与半角向量 $h$ 重合）的微表面在微观几何中的**密度**。
>只有当微平面的微平面法线 $n$ 是 $l$ 和 $v$ 的 **半程向量 (half vector)** $h=\frac{l+v}{||l+v||}$ 时，这个微平面才会将能量反射进眼睛，否则这个微平面的能量贡献为 0。

> [!quote]  数学定义
>
>  $D(m)=\int_{\cal M}\delta_{m}(m)\,d p_{m} ~~~~[\frac{m^{2}}{sr}]$
> 微表面法线分布 $D(m)$ 描述了微表面上表面法线 $m$ 的统计分布。给定以 $m$ 为中心的无穷小立体角 $dω$ 和无穷小的宏观表面积 $dS$，$D(m)dωdS$ 是相应微表面部分的总面积，其法线位于指定的立体角内。因此 $D$ 是单位为 1/sr 的密度函数。
>
![[24a7fb676f8588ade097e727c0b28bfb_MD5.jpg]]
>
>如上图微表面侧视图所示，则 NDF 函数 $D(m)$ 服从等式： $A=D(m)d\omega dS$ 其中， $A$ 为所有微平面法线为 $m$ 的微表面面积 (上图红线面积)， $\omega$ 为微平面法线 $m$ 的立体角， $dS$ 为无穷小的保证为 flat 的宏观表面面积微元，但它大于微表面面积微元。
>
>
通过这个等式，我们可以得出 $D(m)$ 的物理含义，即**每单位面积，每单位立体角，所有法向为 m 的微平面的面积**。
>
我们将微平面总面积规定为 1，**那么 $\frac{D(m)}{1}=D(m)$ 就是我们要的结果, 即密度！**

目前有很多种 NDF 都可以从统计学上来估算微表面的总体取向度，只要给定一些粗糙度的参数以及一个我们马上将会要用到的参数 Trowbridge-Reitz GGX（GGXTR）：

$$NDF_{GGX TR}(n, h, \alpha) = \frac{\alpha^2}{\pi((n \cdot h)^2 (\alpha^2 - 1) + 1)^2}$$

-  $h$ ：半角向量
 - $\alpha$ ：粗糙度
 - $n$ ：法线。


![](d9b94cd41cd6cea5cfe6c13c93784b69.png)
 >GGX 有更好的高光长尾

使用不同的粗糙度作为参数，可以得到下面的效果：  

m
![](1679148476814.png)
>当粗糙度很低（表面很光滑）时，与中间向量 $h$ 取向一致的微表面会高度集中在一个很小的半径范围内。由于这种集中性，NDF 最终会生成一个非常明亮的斑点。但是当表面比较粗糙的时候，微表面的取向方向会更加的随机，与向量 $h$ 取向一致的微表面分布在一个大得多的半径范围内，但是较低的集中性也会让最终效果显得更加灰暗。

Trowbridge-Reitz GGX 的 NDF 实现代码：

```c
//D法线分布函数：GGX/TR
float D_GGXTR(float3 N, float3 H, float Roughness)
{
    float a2 = Roughness * Roughness;
    float a4 = a2 * a2; //这里是参考的ue4，原公式使用a的二次方进行计算
    float NdotH2 = pow(max(0,dot(N, H)), 2);

    float nominator = a2; //分子
    float denominator = PI * pow(NdotH2 * (a2 - 1) + 1, 2); //分母
    return nominator / max(0.00001, denominator); //防止分母为0
}
```

#### F：Fresnel-Schlick
**菲涅尔效应 (fresnel effect)** 指的是反射随着 **掠射角 (glancing angle, 入射光与表面的夹角)** 的增大而增强。
![[Pasted image 20230709222844.png|354]]
当光线碰撞到一个表面的时候，**菲涅尔方程会根据观察角度告诉我们被反射的光线所占的百分比（即高光反射比例）。根据这个比例和能量守恒定律我们可以直接知道剩余的能量就是会被折射的能量。**

当我们垂直观察每个表面或者材质时都有一个基础反射率，当我们以任意一个角度观察表面时所有的反射现象都会变得更明显（反射率高于基础反射率）。你可以从你身边的任意一件物体上观察到这个现象，当你以平视（0 度）观察你的桌面你会法线反射现象将会变得更加的明显，理论上以完美的 0 度观察任意材质的表面都应该会出现全反射现象（所有物体、材质都有菲涅尔现象）。

![[Pasted image 20230703160302.png|450]]![[Pasted image 20230703160305.png|253]]
>越远（夹角越小）反射越强

菲涅尔（Fresnel）方程很复杂，计算量很大，实时渲染中广泛采用 Fresnel-Schlick 近似式，因为计算成本低廉，而且精度足够：

$$F_{Schlick}(h, v, F_0) = F_0 + (1 - F_0) ( 1 - (h \cdot v))^5$$
$$
F_0=\left(\frac{n_1-n_2}{n_1+n_2}\right)^2
$$
- $h$：半角向量
- $v$：观察方向
- $F_0$ ：表面基础反射率
- $n1,n2$ ：两种介质的真实折射率（即相对于真空的折射率），一般 $n_2$ 取取 $1$为空气的折射率

> [!NOTE] $h \cdot v$ 还是 $n \cdot v$?
> 1. 使用 nv 的菲涅尔方程是宏观的，即菲涅尔方程确实由表面法线和视角方向求得。但在这里我们处理的不是宏观平面而是由法线分布函数 D 筛选出的法线为 h 的微平面，故这里实际用的应该是 vh。也可以这么理解，微观上半角向量 h 就是微平面的法线。
> 
> 2. 闫老师：在实时渲染中，人们提到的这几个角度都是可以互换的，结果十分相似。视为 $\cos \theta$：
> -  $h \cdot v$
> -  $h \cdot l$
> -  $n \cdot v$
> -  $n \cdot l$
>
>3. Unity 对此做了一个优化：[Optimizing GGX Shaders with dot(L,H) – Filmic Worlds](http://filmicworlds.com/blog/optimizing-ggx-shaders-with-dotlh/) 使用 $l\cdot h$
>

![](1679148476836.png)
>菲涅尔方程运用在球面上的效果，观察方向越是接近**掠射角**（grazing angle，又叫切线角，与正视角相差 90 度），菲涅尔现象导致的反射就越强


菲涅尔方程中有几个微妙的地方，菲涅尔方程仅仅对电介质（绝缘体）或者说非金属表面有定义，而对于导体表面，使用它们的折射率（导体的折射率为负数）计算并不能得出正确的结果。这样我们就需要使用一种不同的菲涅尔方程来对导体表面进行计算，但是这样很不方便。所以我们**预先计算出导体的基础反射率，然后用 Schlick 方法来对其进行插值**估算。这样我们就能对金属和非金属材质使用同一个公式了。

下面是一些常见材质的基础反射率：

![](1679148476872.png)

这里可以观察到的一个有趣的现象，所有电介质材质表面的基础反射率都不会高于 0.17，这其实是例外而非普遍情况。导体材质表面的基础反射率起点更高一些并且（大多）在 0.5 和 1.0 之间变化。此外，对于导体或者金属表面而言基础反射率一般是带有色彩的，这也是为什么要用 RGB 三原色来表示的原因（法向入射的反射率可随波长不同而不同）。这种现象我们只能在金属表面观察的到。

金属表面这些和电介质表面相比所独有的特性引出了所谓的金属工作流的概念。也就是我们需要额外使用一个被称为金属度 (Metalness) 的参数来参与编写表面材质。金属度用来描述一个材质表面是金属还是非金属的。

**通过预先计算物体的基础反射率的值，我们可以对两种类型的表面使用相同的Fresnel-Schlick近似，但是如果是金属表面的话就需要对基础反射率添加色彩。我们一般是按下面这个样子来实现的：**

```c
//Fresnel F0：插值区分非金属和金属不同的F0值，非金属的FO数值较小，金属FO的数值较大
float F0 = lerp(0.04,BaseColor,Metallic); 
```

我们为大多数电介质表面定义了一个近似的基础反射率。$F_0$ 取最常见的电解质表面的平均值，这又是一个近似值。不过**对于大多数电介质表面而言使用 0.04 作为基础反射率已经足够好了**，而且可以在不需要输入额外表面参数的情况下得到物理可信的结果。**然后，基于金属表面特性，我们要么使用电介质的基础反射率要么就使用 $F_0$ 作来为表面颜色。因为金属表面会吸收所有折射光线而没有漫反射，所以我们可以直接使用表面颜色纹理来作为它们的基础反射率。**

Fresnel Schlick 近似可以用 HLSL 代码实现：

```c
//F菲涅尔方程：Schlick近似
//直接光部分 NV或VH均可
float3 F_FresnelSchlick(float VdotH, float3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0f - VdotH, 5.0);
}

//间接光部分 只能使用NV并引入粗糙度
float3 F_SchlickRoughness(float NdotV,float3 F0,float Roughness)
{
    float smoothness = 1.0 - Roughness;
    return F0 + (max(smoothness.xxx, F0) - F0) * pow(1.0 - NdotV, 5.0);
}
```

####  G：Schlick-GGX+ Smith G2

几何函数从统计学上近似的求得了微表面间相互遮蔽（自遮挡现象）的比率，这种相互遮蔽会损耗光线的能量。(除了被吸收，还有被遮蔽带来的能量损耗）

![](1679148476912.png)


> [!quote] 数学定义
> 我们是使用的微表面理论，也就是说每个面单独计算互不干扰。但现实世界中，物体的表面的凹凸存在相互遮蔽的情况。主要受粗糙度影响。对于渲染来说，我们只关心可见的微表面。
> 
> 基于上述事实，我们可以提出另外一种统计微平面法线到视角垂平面的投影面积：**统计所有可见微平面法线到视角垂平面的投影面积**。如下图，我们只考虑可见的红线部分的投影贡献。
> ![[22be779d5b79650eaf1533fe67a753df_MD5.jpg]]
> 
> 我们可以通过定义 **遮蔽函数 (masking function)** $G_{1}(m,v)$ 来数学的表示这一点，**该函数给出法线为 $m$ 且沿视角 $v$ 可见的微平面比例。**
> 
>  $\int_{m\in\Theta}G_{1}(m,v)D(m)(v\cdot m)^{+}dm=v\cdot n$
> 
> 其中， $(v\cdot m)^{+}$ 表示钳位到 0，它表示不可见的背微平面不会被计算。 $G_{1}(m,v)D(m)$ 为 **可见法线分布 (distrubition of visible normals)**。
>

对于给定法线分布函数 D (m)，可以有无数个遮蔽函数 G (m)。这是因为 D (m) 并没有完全指定微表面，它只告诉了微表面法线的分布，但不知道它们的排列。

> [!note]  Smith G1 和 Smith Shadow-Masking G2
> 一个被广泛使用的 G1 遮蔽函数为 **The Smith G1** 函数，它最初是针对高斯正态分布推导出来的，后来推广到任意的 NDFs 上。
> 
>  $\begin{align} G_{1}(\mathbf{m},\mathbf{v})&={\frac{\chi^{+}(\mathbf{m}\cdot\mathbf{v})}{1+\Lambda(\mathbf{v})}},\\ \chi^{+}(x)&=\left\{\begin{matrix}1,~~where~x>0.\\0,~~where~x\leq 0.\end{matrix}\right. \end{align}$
> 
> 其中， $m$ 为微平面法线， $v$ 为观察向量， $\Lambda$ 函数视 NDF 而不同。
> 
> **正如上面讨论的那样，遮蔽函数 G1 只考虑了微表面对视线的遮挡，即 Masking。而还存在微表面对光线的遮挡，即 Shadowing。**
> 
> ![[8c71e0b51185e84c583ab7a1df499b63_MD5.jpg]]
> 
> **为了考虑 Masking 对可见法线的影响，提出了联合遮蔽 - 阴影函数 (joint masking-shadowing function) $G_{2}(l,v,m)$，也被称为几何函数 (geometry function) 。**
> 
> 实际应用中，常用 **The Smith Shadow-Masking G2** 函数，它将 Shadowing 和 Masking 分开考虑。由于光路的可逆性，我们可以认为两种情况是近似等效的。
> 
>  $$G_{2}(l,v,m)=G_{1}(v,m)G_{1}(l,m)$$
> 
> 它建立在 Shadowing 和 Masking 不相关的基础上，但实际上它们是相关的。**使用这个 G2 会导致 BRDFs 结果偏暗。**
> 

类似 NDF，几何函数也使用粗糙度作为输入参数。几何函数使用由 GGX 和 Schlick-Beckmann 组合而成的模拟函数 Schlick-GGX：

$$G_{SchlickGGX}(n, v, k) = \frac{n \cdot v} {(n \cdot v)(1 - k) + k }$$

这里的 $k$ 是使用粗糙度 $\alpha$ 计算而来的，用于直接光照和 IBL 光照 (间接光)的几何函数的参数：

$$\begin{eqnarray*} k_{direct} &=& \frac{(\alpha + 1)^2}{8} \\ k_{IBL} &=& \frac{\alpha^2}{2} \end{eqnarray*}$$

需要注意的是这里 $\alpha$ 的值取决于你的引擎怎么将粗糙度转化成 $\alpha$。

为了有效地模拟几何体，我们需要同时考虑两个视角，观察方向（几何遮挡）跟光源方向（几何阴影），我们可以用 **Smith G2 函数**将两部分放到一起：

$$G_2(n, v, l, k) = G_{1}(n, v, k) G_{1}(n, l, k)$$
- $n$：法线
 - $v$ ：观察方向
 - $G_{1}(n, v, k)$ ：观察方向的几何遮挡
 - $l$ ：光源方向
 - $G_{1}(n, l, k)$ 表示光源方向的几何阴影。使用 Smith 函数与 Schlick-GGX 作为 $G_{1}$ 可以得到如下所示不同粗糙度 R 的视觉效果：  

![](1679148477023.png)
>几何函数是一个值域为 $[0.0, 1.0]$ 的乘数，其中白色 (1.0) 表示没有微表面阴影，而黑色 (0.0) 则表示微表面彻底被遮蔽。

使用 GLSL 编写的几何函数代码如下：

```cs
//G几何遮蔽函数:Schlick-GGX + SmithG2
float G_SchlickGGX(float NdotV, float Roughness)
{
    float k_direct = pow(Roughness + 1, 2) / 8;
    float noninator = NdotV;
    float denominator = NdotV * (1 - k_direct) + k_direct;
    return noninator / max(0.00001, denominator);
}

float G_SmithG2(float3 N,float3 V,float3 L,float Roughness)
{
    float NdotV = max(0,dot(N, V));
    float NdotL = max(0,dot(N, L));

    float G1 = G_SchlickGGX(NdotV, Roughness); //观察方向的几何遮挡
    float G2 = G_SchlickGGX(NdotL, Roughness); //光源方向的几何阴影

    return G1*G2;
}
```

#### Cook-Torrance 反射方程

Cook-Torrance 反射方程中的每一个部分我们我们都用基于物理的 BRDF 替换，可以得到最终的反射方程：

$$L_o(p,\omega_o) = \int\limits_{\Omega} (k_d\frac{c}{\pi} + k_s\frac{DFG}{4(\omega_o \cdot n)(\omega_i \cdot n)}) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$

上面的方程并非完全数学意义上的正确。前面提到菲涅尔项 $F$ 代表光在表面的反射比率，它直接影响 $k_s$ 因子，意味着反射方程的镜面反射部分已经隐含了因子 $k_s$。因此，最终的 Cook-Torrance 反射方程如下（去掉了 $k_s$）：

$$L_o(p,\omega_o) = \int\limits_{\Omega} (k_d\frac{c}{\pi} + \frac{D(n, h, \alpha)F(h, \omega_o, F_0)G(n, \omega_o, \omega_i, k)}{4(\omega_o \cdot n)(\omega_i \cdot n)}) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$

- 对于分母中的点积，仅仅避免负值是不够的，也必须避免零值。通常通过在常规的 clamp 或绝对值操作之后添加非常小的正值来完成。

这个方程完整地定义了一个基于物理的渲染模型，也就是我们一般所说的基于物理的渲染（PBR）。
```cs
/* 直接光 */
//Cook-Torrance BRDF
//漫反射部分
float3 Ks = F_FresnelSchlick(VdotH, F0); //菲涅尔项描述了光被反射的比例
float3 Kd = (1 - Ks) * (1 - Metallic);   
//float3 Diffuse = Kd * BaseColor / PI;
float3 Diffuse = Kd * BaseColor; //unity内置的PBR没有除以 PI, 颜色亮一些

//高光反射部分
float D = D_GGXTR(N, H, Roughness);
float3 F = Ks;
float G = G_SmithG2(N, V, L, Roughness);
float3 Specular = D * F * G / max(0.0001, 4 * NdotV * NdotL);

float3 DirectLightColor = (Diffuse + Specular) * mainLight.color * NdotL;
```
#### 能量补偿项

通过包含 G2 函数，Microfacet BRDF 能够考虑遮蔽 (masking) 和阴影 (shadowing)，但依然没有考虑微平面之间的互反射 (interreflection)，或多表面反射 (multiple surface bounce)。而缺少微平面互反射 (interreflection) 是业界主流 Microfacet BRDF 的共有的限制。如图，虽然在小球上没有出现任何掠射角的问题，但随着粗糙度的变大，渲染的结果越来越暗。即使认为最左边是抛光，最右边的是哑光，这个结果也是错误的。如果对小球材质进行白炉测试 ( $F(i,h)\equiv 1$ ， $uniform irrdiance = 1$ 的天光，检测材质反射能量是否未 1)，这种现象更为明显。
![[Pasted image 20230710202811.png]]
出现这种问题的原因是标准 Microfacet BRDF 模型虽然能量守恒 (即不会产生任何能量)，但它们也不能在高粗糙度时维持能量 (即能量损失)。这是**由于建模微平面模型时所做出的单散射假设，没有模拟微表面上的多次散射，即缺少微平面互反射 (interreflection)。单散射的在高粗糙度时会有较大的能量损失，从而显得过暗。

![[Pasted image 20230710202818.png]]

对此，在实时渲染中常用的处理方法是对原先的模型添加一个**能量补偿项**来补足损失的能量。**核心思想**是将反射光看作两种情况：当不被遮挡时，这些光会被看到；当反射光被微表面遮挡时，这些遮挡住的光将会进行后续的弹射，直到能被看到。

**【Kulla-Conty 近似】** 通过经验去补全多次反射丢失的能量，其实是创建了一个多次反射表面反射的附加 BRDF 波瓣，利用这个 BRDF 算出消失的能量作为能量补偿项。 
**预计算出一张图表示 $E_{avg}$ ，代入 $f_{ms}$ 中，进而求出消失的能量 $E_{ms}$ 。**
![[Pasted image 20230710203604.png|250]]

![[Pasted image 20230710204205.png|700]]

k 次间接反射的能量为 $F^{k}{avg}(1-E{avg})^{k}\cdot F_{avg}E_{avg}$ 将以上所有能量累加，得 $\frac{F_{avg}E_{avg}}{1-F_{avg}(1-E_{avg})}$ ，再与无色 $f_{ms}$ 相乘，即可得到有色的能量补偿项。

最后，考虑了能量补偿项的渲染方程如下：

 $L_{o}(p,\omega_{o})=\int_{\Omega^{+}}L_{i}(p,\omega_{i})(f_{r}(p,\omega_{i},\omega_{o})+f_{ms}(\omega_{i}.\omega_{o}))cos\theta_{i}d\omega_{i}$

增加颜色项后的结果如下所示。

![[Pasted image 20230710204422.png]]
### BxDF

目前计算机图形渲染领域，基于物理的渲染方式主要有：

*   **辐射度（Radiance）**：计算光源的镜面反射和漫反射占总的辐射能量的比例，从而算出颜色。在实时渲染领域，是最主流的渲染方式。BRDF 大多数都是基于此种方式，包括 Cook-Torrance。
    
*   **光线追踪（Ray Tracing）**：即光线追踪技术，它的做法是将摄像机的位置与渲染纹理的每个像素构造一条光线，从屏幕射出到虚拟世界，每遇到几何体就计算一次光照，同时损耗一定比例的能量，继续分拆成反射光线和折射光线，如此递归地计算，直到初始光线及其所有分拆的光线能量耗尽为止。
    
    ![[1679148482590.png|500]]
    
    由于这种方式开销非常大，特别是场景复杂度高的情况，所以常用于离线渲染，如影视制作、动漫制作、设计行业等。
    
    近年来，随着 NVIDIA 的 RTX 系列和 AMD 的 RX 系列显卡问世，它们的共同特点是硬件级别支持光线追踪，从而将高大上的光线追踪技术带入了实时渲染领域。
    
*   **路径追踪（Path Tracing）**：实际上路径追踪是光线追踪的一种改进方法。它与光线追踪不同的是，引入了蒙特卡洛方法，利用 BRDF 随机跟踪多条反射光线，随后根据这些光线的贡献计算该点的颜色值。
    这种方法更加真实（下图），但同时也更加耗时，通常用于离线渲染领域。
    ![[1679148482649.png|350]]

上章已经详细描述了基于辐射度的 Cook-Torrance 的 BRDF 模型的理论和实现。实际上，Cook-Torrance 模型在整个渲染体系中，只是冰山一角。下面是 BRDF 光照模型体系：

![[1679148482675.png]]

限于篇幅和本文主题，下面将介绍基于辐射度方式的 BxDF 光照模型。

**BxDF 一般而言是对 BRDF、BTDF、BSDF、BSSRDF 等几种双向分布函数的一个统一的表示。可细分为以下几类：**

*   **BRDF**（双向反射分布函数，Bidirectional Reflectance Distribution Function）：用于**非透明**材质的光照计算。**Cook-Torrance 就是 BRDF 的一种实现方式**。
*   **BTDF**（双向透射分布函数，Bidirectional Transmission Distribution Function）：用于**透明材质**的光照计算。折射光穿透介质进入另外一种介质时的光照计算模型，只对有透明度的介质适用。
*   **BSDF**（双向散射分布函数，Bidirectional Scattering Distribution Function）：实际上是 BRDF 和 BTDF 的综合体，简单地用公式表达：**BSDF = BRDF + BTDF**。
    
    ![[1679148482726.png|350]]
*   **SVBRDF**（空间变化双向反射分布函数，Spatially Varying Bidirectional Reflectance Distribution Function）：**将含有双参数的柯西分布替代常规高斯分布**引入微面元双向反射分布函数 (BRDF) 模型，同时考虑了目标自身辐射强度的方向依赖性，在此基础上推导了长波红外偏振的数学模型，并在合理范围内对模型做简化与修正使之适用于仿真渲染。
*   **BTF**（双向纹理函数，Bidirectional Texture Function）：主要用于**模拟非平坦表面**，参数跟 SVBRDF 一致。但是，BTF 包含了非局部的散射效果，比如阴影、遮挡、相互反射、次表面散射等。用 BTF 给表面的每个点建模的方法被成为 **Apparent BRDFs**（表面双向反射分布函数）。
*   **SSS**（次表面散射，也称 3S，Subsurface Scattering）：它是**模拟光进入半透明或者有一定透明深度的材质（皮肤、玉石、大理石、蜡烛等）后，在内部散射开来，然后又通过表面反射出来的光照模拟技术**。下面是用 SSS 模拟的玉石效果图：
    ![[1679148482775.png|400]]
    关于次表面散射方面的研究，比较好的是 Jensen 的文章《A Practical Model for Subsurface Light Transport》，该文提出了一个较为全面的 SSS 模型，将它建模成一个双向表面散射反射分布函数 (BSSRDF)。 ^c36ln4
*   **BSSRDF**（双向表面散射分布函数，Bidirectional Surface Scattering Reflectance Distribution Function）：它常用于**模拟透明材质**，目前是主流技术。它**和 BRDF 的不同之处在于，BSSRDF 可以再现光线透射材质的效果，还可以指定不同的光线入射位置和出射位置：**
    
    ![[1679148482799.png|600]] ^lxo1ef

**从上面可以看出，BxDF 的形式多种多样，但由于它们都是基于辐射度的光照模型，所以最终可以用以下公式抽象出来：**

$$L_o(p,\omega_o) = \int\limits_{\Omega} f_r(p,\omega_i,\omega_o) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$

用更简洁的方式描述，入射光 $\omega_i$ 在 $p$ 点的颜色的计算公式：

$$\begin{eqnarray*} p点颜色 & = & 光源颜色 \times 材质颜色 \times 反射系数 \times 光照函数 \\ 光照函数 & = & f(n_{法线}, \omega_{光源方向}, v_{视点方向}) \end{eqnarray*}$$

值得一提的是，BRDF 最终的光照计算结果是几何函数和油墨算法（ink-selection）结合的结果。其中油墨算法描述了如何计算各颜色分量的反射率，可参看论文 [《A Multi-Ink Color-Separation Algorithm Maximizing Color Constancy》](https://pdfs.semanticscholar.org/9e56/8b13ea51ca3c669186624566f672eb547857.pdf)。

![[1679148483056.png|500]]

### Disney
## 其他 DFG

### 法线分布函数 D

对于镜面反射 BRDF，法线分布函数 D 的常见模型可总结如下：

*   Beckmann[1963]
*   Blinn-Phong[1977]
*   GGX [2007] / Trowbridge-Reitz[1975]
*   Generalized-Trowbridge-Reitz (GTR) [2012]
*   Anisotropic Beckmann[2012]
*   Anisotropic GGX [2015]

**业界主流的法线分布函数是 GGX**。
![[Pasted image 20230710195651.png]]
>红线 Backmann，绿线 GGX。右图，左边为 GGX，右边为Backmann
#### Beckmann

Beckmann 是一种定义在坡度空间上的**类高斯分布**模型，这个函数**可以描述不同粗糙程度的表面，不同粗糙程度的意思是 NDF 中 lobe 是集中在一个点上，还是分布得比较开**。它的表达式为

 $$D_{Beckmann}(h)=\frac{e^{-\frac{tan^{2}\theta_{h}}{\alpha^{2}}}}{\pi\alpha^{2}cos^{4}\theta_{h}}$$

 $h$ ：半程向量
 $\alpha$ ：粗糙系数，粗糙程度这个值越小，表面就越光滑
  $\theta_{h}=(\hat{n}\cdot \hat{m})$ ：半程向量与宏观法线的夹角
  高斯分布函数 $X\sim N(\mu,\sigma^{2})=\frac{1}{\sqrt{2\pi}\sigma}^{-\frac{(x-\mu)^{2}}{2\sigma^{2}}}$ 中， $\sigma$ 控制胖瘦程度，同样的，在 Beckmann 表达式中， $\alpha$ 控制胖瘦程度。

![[fb9c19a8c393df03c7975ec33c889e0e_MD5.jpg]]

之所以幂的分子上使用 $tan\theta_{h}$ ，而不直接使用 $\theta_{h}$ 是因为 Beckmann 定义在**坡度空间**上，需要满足高斯部分的定义域无限大的性质，保证函数无论何时都具有对应的非负值，并且避免微表面出现法线朝下的问题 (但无法避免反射光朝下)。

![[ff979cf2a41139cb4a5100491c7ea536_MD5.jpg]]
>如图，随着 $\theta$ 不断增大不断增大，红色的向量永远不会朝下


#### GGX

GGX 模型的表达式为

 $$D_{GGX}(h)=\frac{\alpha^{2}}{\pi(cos^{2}\theta_{h}(\alpha^{2}-1)+1)^{2}}$$

其中， $h$ 为微观半程向量； $\alpha$ 为粗糙系数，粗糙程度这个值越小，表面就越光滑； $\theta_{h}=(\hat{n}\cdot \hat{m})$ 是半程向量与宏观法线的夹角。 GGX 相对于 Beckmann 在工业界得到了更为广泛的应用，因为它具有更好的高光拖尾 (Long tail 性质，衰减更加柔和)。

![[b55bc08e7043ee7b754a3e565fbaf616_MD5.jpg]]

这会带来两个好处：
*   Beckmann 的高光会逐渐消失，而 GGX 的高光会减少而不会消失，这就意味着高光的周围我们看到一种光晕的现象。
*   GGX 除了高光部分，其余部分会像 Diffuse 的感觉。

![[Pasted image 20230710200154.png]]

#### GTR
Generalized Trowbridge-Reitz (GGX/TR 模型增强版)

GTR 是根据对 GGX 等分布的观察，提出的**广义法线分布函数**，其目标是允许更多地控制 NDF 的形状，特别是分布的尾部。它的表达式为：
 $$D_{GTR}(h)=\frac{c}{(1+cos^{2}\theta_{h}(\alpha^{2}-1))^{\gamma}}$$

其中， $h$ 为微观半程向量； $\alpha$ 为粗糙系数，粗糙程度这个值越小，表面就越光滑； $\theta_{h}=(\hat{n}\cdot \hat{m})$ 是半程向量与宏观法线的夹角。 $\gamma$ 参数用于控制尾部形状。当 $\gamma=2$ 时，GTR 等同于 GGX。随着 $\gamma$ 的值减小，分布的尾部变得更长。而随着 $\gamma$ 值的增加，分布的尾部变得更短。越来越接近Backmann

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

另外，Eric Heitz 在 [Heitz14] 中展示了 Smith 几何阴影函数是正确且更准确的 G 项，并将其拓展为 Smith 联合遮蔽阴影函数 (Smith Joint Masking-Shadowing Function)，该函数具有四种形式：

*   分离遮蔽阴影型 (Separable Masking and Shadowing)
*   高度相关掩蔽阴影型 (Height-Correlated Masking and Shadowing)
*   方向相关掩蔽阴影型 (Direction-Correlated Masking and Shadowing)
*   高度 - 方向相关掩蔽阴影型 (Height-Direction-Correlated Masking and Shadowing)

目前较为常用的是其中最为简单的形式，分离遮蔽阴影 (Separable Masking and Shadowing Function)。

该形式将几何项 G 分为两个独立的部分：光线方向 (light) 和视线方向 (view)，并对两者用相同的分布函数来描述。根据这种思想，结合法线分布函数 (NDF) 与 Smith 几何阴影函数，于是有了以下新的 Smith 几何项：

*   Smith-GGX
*   Smith-Beckmann
*   Smith-Schlick
*   Schlick-Beckmann
*   Schlick-GGX

其中 UE4 的方案是上面列举中的 **“Schlick-GGX”** ，即基于 Schlick 近似，将 k 映射为 k=a/2, 去匹配 GGX Smith 方程：

$\begin{align} k&=\frac{\alpha}{2}\\ \alpha&=(\frac{roughness+1}{2})^{2}\\ G_{1}(v)&=\frac{n\cdot v}{(n\cdot v)(1-k)+k}\\ G(l,v,h)&=G_{1}(l)G_{1}v \end{align}$

# 2 PBR 扩展

## LTC 多边形光源渲染
Linearly Transformed Cosines：线性变换余弦分布

![[Pasted image 20230710210648.png]]

**多边形光源**下的渲染我们需要取光源上很多采样点，并且与 shaing point 连线, 如果不考虑连线是否与场景有交点则不考虑 shadow, 如果需要考虑 shadow 还需要做一下 shadow test。
但不论如何都需要采样, 那么不可避免地会使速度变慢。为了避免采样光源带来的开销问题，可以应用 LTC 技术来避免采样，满足实时渲染的要求。

![[Pasted image 20230710211040.png]]
>lobe：波瓣（函数图像如同花瓣）


简单来说就行，将反射方程中原本需要采样才能计算的 BRDF (原始球面分布)通过一个 M 矩阵变换为余弦分布（新球面分布）（注意余弦分布不是常见的 cos，而是一个球面分布函数），而 M 可以**预计算**，余弦分布可以**解析计算**积分，所以能快速计算 BRDF 积分而避免了采样，这种方法就是线性变换余弦 (Linearly Transformed Cosines, LTCs)。

代码实现: [[03 利用 LTC 实现实时多边形面积光]]

## **Disney's principle BRDF**

首先我们来讨论一下为什么还需要 Disney's principle BRDF:

因为微表面模型是由一些问题的:

**1. 微表面模型无法解释多层材质**
我们来举个例子, 我们有一个木头桌子, 我们知道木头是 diffuse 的, 在桌子的表面刷一层清漆。从而我们的桌子变成了多层材质: 清漆 + 木头。清漆是无色的, 由于清漆是平坦的, 因此在光线打入时, 一部分反射出去产生了高光现象。另一部分打入内部并打到桌子上以 diffuse 发散出去, 因此我们应该会看到高光和 diffuse. 这是微表面模型无法做到的, 因为**微表面模型无法解释多层材质。**
>清漆 ClearCoat，又名[凡立水](https://baike.baidu.com/item/%E5%87%A1%E7%AB%8B%E6%B0%B4/9978483)，是由[树脂](https://baike.baidu.com/item/%E6%A0%91%E8%84%82/281282)为主要[成膜物质](https://baike.baidu.com/item/%E6%88%90%E8%86%9C%E7%89%A9%E8%B4%A8)再加上溶剂组成的[涂料](https://baike.baidu.com/item/%E6%B6%82%E6%96%99/2503539)。由于涂料和涂膜都是透明的，因而也称透明涂料。涂在物体表面，干燥后形成光滑薄膜，显出物面原有的纹理。

**2. 微表面模型对艺术家来说并不好用**

我们知道 PBR, PBR, 都是基于物理的, 我们以金属反射率来说，反射率由 n 和 k 这两个参数定义。对于 artist 来说, 他们是不知道的怎么调。因此 PBR 材质对于艺术家来说不好用。
*   Disney's principle BRDF 诞生的首要目的就是为了让 artist 使用方便, 因此它并不要求在物理上完全正确.
*   但是在 RTR 中我们认为 Disney's principle BRDF 也算是 PBR 材质.

**Disney's principle BRDF 有几个重要的设计原则:**
1.  应该使用更直观的名词而不是使用物理名词参数, 比如使用平缓, 饱和度等
2.  让 brdf 框架不太复杂, 也就是让参数数量少一点
3.  最好有一个拖动条左边最小值, 右边最大值供艺术家们进行调整
4.  有时候为了特殊的效果允许将参数值超过范围, 也就是允许小于 0 或大于 1
5.  所有参数的组合应尽可能可靠和合理, 也就是不论如何调整参数最后的结果应该是正常的.

因此在这套设计原则下, artist 可以根据自己需要去定义自己想得到的 BRDF:
![[Pasted image 20230710213136.png]]

*   subsurface: 次表面反射, 为了在 BRDF 中给你一种比 diffuse 还要平的效果. 可以看出当 subsurface 为 1 时与 0 相比像是被压扁了一样.

![[2551fe83ada6e138c25626fe73749a96_MD5.png]]

*   metallic: 金属性, 顾名思义看起来像金属的程度.

![[bc4a549ff7fbdc5d159a481651c53d96_MD5.png]]

*   specular: 控制有多少镜面反射的内容, 0 为完全没有镜面反射内容, diffuse, 1 则表示全是镜面反射内容.

![[e4d933eae00a5ad3f4df0846b52821d3_MD5.png]]

*   specular tint: 镜面反射出的颜色无色 (为 0), 还是偏向于自己物体本身的颜色 (1).

![[671ef64bfd5f8d2c97526a43c4f22482_MD5.png]]

*   roughness: 粗糙度, 为 0 表示全是镜面反射, 为 1 表示没有镜面反射.

![[ce23c41e089a420eb52b7eda260f68c6_MD5.png]]

*   anisotropic: 各向异性程度, 可以理解为当为 1 的时候带来一种像是被刷过一样的效果.

![[e791eeb270d82ab760161a1fbede89fa_MD5.png]]

*   sheen: 可以理解为, 在物体表面法线方向上长了绒毛, 这让你在 grazing angle (外圈) 处看起来有一种雾化的感觉.

![[8b09eed3621623e4dbe668359e661671_MD5.png]]

*   sheen tint: 可以理解为绒毛造成的雾化效果颜色是无色, 还是偏向物体本身的颜色.

![[0f0858a058d023ab34408103752c9795_MD5.png]]

*   clearcoat: 可以理解为透明层的明显程度, 0 时表示没有透明层, 1 则表示有一层透明层 (涂了一层清漆).

![[2cee53fe70af566ce4635a27d0146bb0_MD5.png]]

*   clearcoat gloss: 透明层的光泽层度, 为 0 就像被磨砂了一样, 为 1 则表示完全光滑.

![[21607352efb99fcaaa82648a04312b72_MD5.png]]


**Disney's principle BRDF 的优点:**

1. 容易理解和使用各参数 (属性)
2. 参数的混合组合使得可以在一个模型上显示出很多不同的材质.
3. 开源

**Disney's principle BRDF 的缺点:**
1. 并不是完全基于物理的
2. 巨大的参数空间使得拥有强大的表示能力, 但是会造成冗余现象.

## 渲染方程不等式近似
在微积分中有很多有用的不等式, 如图中的两个不等式为例：

![[Pasted image 20230622211119.png]]

**在实时渲染中, 我们只关心近似约等, 我们不考虑不等的情况, 因此我们将这些不等式当约等式来使用。**

**在 RTR 中一个重要的近似式：**

$$
\int_\Omega f(x)g(x)\mathrm{~d}x\approx\frac{\int_\Omega f(x)\mathrm{~d}x}{\int_\Omega\mathrm{~d}x}\cdot\int_\Omega g(x)\mathrm{~d}x
$$
>如果你有两个函数的乘积, 你又想把他们的乘积积分起来, 你可以将其拆出来, 也就是:**两个函数乘积的积分 $≈$ 两个函数积分的乘积**

**例如：在 shadowmap 计算时，我们把渲染方程代入这个约等式中:**
我们把 $V(\mathrm{p},\omega_i)$ 看作是 $f(x)$, 提取出来并作归一化处理:
![[Pasted image 20230622212736.png]]

红色区域部分是 $V(\mathrm{p},\omega_i)$, 那么剩下的 $g(x)$ 部分, 也就是 shading 的结果.

因此其表示的意义就是, 我们计算每个点的 shading，然后去乘这个点的 V 项得到的就是最后的渲染结果。

该不等式的另一应用，计算 IBL：[[05 环境光照IBL#^x7aaaa|环境光照原理]]

- ? **为什么右边第一个函数多了个分母？**
**分母这一项的作用是为了保证左右能量相同而做的归一化操作。**

我们来用一个例子来解释这个归一化操作。我们假设 $f(x)$ 是一个**常值函数**, 也就是 $f(x) = 2$, 我们的积分域恒为 $\int_0^3$.

那么约等式左边, 把 $f(x) = 2$ 代入, 则可以提出来变为 $2$ 倍的 $g(x)$ 积分

而等式右侧第一个函数代入 $f(x)$ 的积分是 $\int_0^3 2dx=2x|_0^3=2 * 3 =6$，分母的积分是 $\int_0^3 dx=x|_0^3=3$，结果也正好是 $2$. 正好也是 $2$ 倍的 $g(x)$ 积分.

- ? **那么什么时候这个约等式比较正确呢？**   ^ptjnu8
    1. g (x) 积分域足够小（small support），也就是说我们只有一个点光源或者方向光源。环境光不行。
    2. g (x) 在积分域内变化不大（Smooth integrand），也就是说 brdf 的部分变化足够小，那么这个 brdf 部分是 diffuse 的。gloss  brdf 不行。
    3. 我们还要保证光源各处的 radience 变化也不大，类似于一个面光源。 

#  3 PBR 实现
![[Pasted image 20221101211713.png]]
![[Pasted image 20221102144938.png]]

直接光通常数量有限，使用反射方程计算将结果相加即可。
```cs
float F0 = lerp(0.04, BaseColor, Metallic); //Fresnel F0
/* Cook-Torrance BRDF */
/* 直接光 */
//漫反射部分
float3 Ks = F_FresnelSchlick(VdotH, F0); //菲涅尔项描述了光被反射的比例
float3 Kd = (1 - Ks) * (1-Metallic);
float3 Diffuse = Kd/PI * BaseColor ;

//高光反射部分
float D = D_GGXTR(NdotH, Roughness);
float3 F = Ks;
float G = G_SmithG2_direct(NdotV,NdotL, Roughness);
float3 Specular = D * F * G / 4 * NdotV * NdotL;

float3 DirectLightColor = (Diffuse + Specular) * mainLight.color * NdotL;
```

间接光照数量无限，计算间接光要使用积分，但是实时渲染中出于性能的考虑，通常使用预计算方法—— IBL（Image-Based Lighting）。

Cook-Torrance 反射方程：
$$L_o(p,\omega_o) = \int\limits_{\Omega} (k_d\frac{c}{\pi} + k_s\frac{DFG}{4(\omega_o \cdot n)(\omega_i \cdot n)}) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$ 将其拆开，分别为漫反射部分和高光反射部分：

$$
\begin{aligned}L_o(p,\omega_o)&=\int_\Omega(k_d\frac{c}{\pi})L_i(p,\omega_i)n\cdot\omega_id\omega_i+\int_\Omega(k_s\frac{DFG}{4(\omega_o\cdot n)(\omega_i\cdot n)})L_i(p,\omega_i)n\cdot\omega_id\omega_i\end{aligned}
$$
 
## 间接光漫反射
 
间接光照的漫反射本质是对**光照探针**进行采样，得到 $L_i(p,\omega_i)$
Unity 使用光照探针采样环境光照信息，用球谐函数存储。
得到 $L_i(p,\omega_i)$ 之后带入反射方程即可

```c
float3 Ks_Ami = F_SchlickRoughness(NdotV, F0, Roughness);
float3 Kd_Ami = (1 - Ks_Ami) * (1 - Metallic);
float3 SHcolor = SampleSH(N); //球谐函数计算环境光照Li
float3 Diffuse_Ami = Kd_Ami/PI * BaseColor * SHcolor;
```
## 间接光照的高光反射
 
间接光照的高光反射本质是对于**反射探针**生成的 CubeMap 进行采样。
用 `SplitSum` 算法将高光反射部分拆开

$$
\int_\Omega(k_s\frac{DFG}{4(\omega_o\cdot n)(\omega_i\cdot n)})L_i(p,\omega_i)n\cdot\omega_id\omega_i
$$
$$
=\int_{\Omega}L_i(p,\omega_i)d\omega_i\cdot\int_{\Omega}(k_s\frac{DFG}{4(\omega_o\cdot n)(\omega_i\cdot n)})n\cdot\omega_id\omega_i
$$
### part1 预过滤 IBL
[[05 环境光照IBL#（1）预过滤IBL]]
使用反射探针捕获场景信息，存储在 CubeMap 中，7 级 mipmap。
```cs
//采样反射探针
float3 R = reflect(-V, N);
float mipmapRoughness = Roughness*(1.7-0.7*Roughness);
float4 cubemapMipmap = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, sampler_unity_SpecCube0, R,mipmapRoughness*UNITY_SPECCUBE_LOD_STEPS);
// 根据材质的粗糙度,得到对应mip级别的预过滤环境贴图
float3 EnvSpecularPrefilted = DecodeHDREnvironment(cubemapMipmap, unity_SpecCube0_HDR); //得到Li
```

### part2 预计算 LUT /实时数值拟合
有两种方法，Unity 使用了数值拟合方法
#### BRDF LUT
将原公式结果离线生成出来。[[05 环境光照IBL#（2）预计算 BRDF LUT]]
LUT：Look Up Table  查找表
假设每个方向的入射光都是白色的 $L(p,x)= 1.0$，就可以在给定粗糙度，光线 $\omega_i$ 法线 $N$ 夹角 $N·\omega_i$ 的情况，预计算 BRDF 的响应结果。以 x 轴的法线与入射光的夹角（NL01），以 Y 轴为粗糙度，将计算的结果存储在一张 2D 贴图上（lut），该帖图称为为**BRDF 积分贴图**。积分的结果分别储存在贴图的**RG 通道**中。使用的时候直接采样该帖图即可。
![[Pasted image 20221101234002.png|300]]

![[Pasted image 20221101233948.png|450]]
>参考： https://www.gamedevs.org/uploads/real-shading-in-unreal-engine-4.pdf

#### 数值拟合
**这里以使命召唤黑色行动 2 的函数拟合为例**
如果输出该 float2 值，会发现和 Lut 贴图很相似。

```c
float2 BRDF_Ami = AmiBRDFApprox(i.uv.y, i.uv.x);  
return pow(float4(BRDF_Ami,0,0),2.2);
```

![[Pasted image 20221102201016.png|300]]
![[Pasted image 20221102143359.png]]
>参考： https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf

### 案例：PBR 头盔 

![[Pasted image 20221102205521.png|450]]
#### builtin 实现

```c fold title:builtin实现
Shader "Unlit/MyHelmet"
{
    Properties
    {
        _BRDFLUTTex ("BRDFLUT", 2D) = "white" {}
        _BaseColorTex ("BaseColor", 2D) = "white" {}
        _MetallicTex ("Metallic", 2D) = "white" {}
        _RoughnessTex ("Roughness", 2D) = "white" {}
        _EmissionTex ("Emission", 2D) = "white" {}
        [HDR]_EmissionColor("Emission Color",Color)=(1,1,1,1)
        _NormalTex ("Normal", 2D) = "black" {}
        _AOTex ("AO", 2D) = "white" {}
    }
    SubShader
    {
        //LightMode 设置为ForwardBase，否则ShadeSH9()会出错。
        Tags { "RenderType"="Opaque" "LightMode"="ForwardBase"}

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"
            #include "UnityGlobalIllumination.cginc" //ShadeSH9()头文件
            
            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                float3 normal : NORMAL;
                float4 tangent : TANGENT;
                
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 normal : TEXCOORD1;
                float3 tangent : TEXCOORD2;
                float3 bitangent : TEXCOORD3;
                float3 worldPos : TEXCOORD4;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            float  _Value, _RangeValue;
            float4 _Color, _BaseColor;

            float _Metallic, _Roughness;
            sampler2D _BRDFLUTTex;
            // samplerCUBE _EnvCubeMap;

            sampler2D _BaseColorTex, _MetallicTex, _RoughnessTex;
            sampler2D _EmissionTex, _AOTex, _NormalTex;
            float4 _EmissionColor;
            
            #define PI 3.14159265358979323846

            /* D法线分布函数：GGX */
            float D_DistributionGGX(float3 N, float3 H, float Roughness)
            {
                float a = Roughness * Roughness;
                float a2 = a * a;  //为什么取a的四次方，这里是参考的ue4，也可以使用a的二次方进行计算
                float NH =  max(0, dot(N,H));
                float NH2 = NH * NH;
                float nominator = a2; //分子
                float denominator = (NH2*(a2-1.0)+1.0);  //分母
                denominator = PI * denominator * denominator;  
                return nominator / max(0.00001, denominator);  //防止分母为0
            }
            
            /* G几何（遮蔽）函数 ：Schlick-GGX + Smith */
            // G_SchlickGGX  
            float G_SchlickGGX(float NV, float Roughness)  
            {  
                float a = Roughness + 1.0;  
                float k = a * a / 8.0;  //直接光  
                float nominator = NV;  
                float denominator = NV * (1.0 - k) + k;  
                
                return nominator / max(0.00001, denominator); 
             }
            
            // G_Smith  
            float G_Smith(float3 N, float3 V, float3 L, float Roughness)  
            {  
                float NV = max(0, dot(N,V));  
                float NL = max(0, dot(N,L)); 
                
                float GGX1 = G_SchlickGGX(NV, Roughness);  
                float GGX2 = G_SchlickGGX(NL,Roughness);  
              
                return GGX1 * GGX2;  
            }
            
            /* F菲涅尔方程：Schlick近似  */
            // 直接光部分 NV或VH均可
            float3 F_Schlick(float VH,float3 F0)
            {
                return F0 +(1.0 - F0)*pow(1.0-VH,5);
            }
            
            //间接光部分 只能使用NV并引入粗糙度
            float3 F_SchlickRoughness(float NV,float3 F0,float Roughness)
            {
                float smoothness = 1.0 - Roughness;
                return F0 + (max(smoothness.xxx, F0) - F0) * pow(1.0 - NV, 5.0);
            }

            /* 数值拟合 */
            // 使命召唤黑色行动2 的函数拟合
            // float2 AmiBRDFApprox(float Roughness, float NV)
            // {
            //     float g = 1 -Roughness;
            //     float4 t = float4(1/0.96, 0.475, (0.0275 - 0.25*0.04)/0.96, 0.25);
            //     t *= float4(g, g, g, g);
            //     t += float4(0, 0, (0.015 - 0.75*0.04)/0.96, 0.75);
            //     float A = t.x * min(t.y, exp2(-9.28 * NV)) + t.z;
            //     float B = t.w;
            //     return float2 ( t.w-A,A);
            // }
            
            // UE4 在黑色行动2 上的修改版本
            float2 AmiBRDFApprox(float Roughness, float NoV )
            {
                // [ Lazarov 2013, "Getting More Physical in Call of Duty: Black Ops II" ]
                // Adaptation to fit our G term.
                const float4 c0 = { -1, -0.0275, -0.572, 0.022 };
                const float4 c1 = { 1, 0.0425, 1.04, -0.04 };
                float4 r = Roughness * c0 + c1;//mad:multiply add
                float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;//mad
                float2 AB = float2( -1.04, 1.04 ) * a004 + r.zw;//mad
                return AB;
            }

            /* 色调映射 ToneMapping */
            float3 ACESToneMapping(float3 x)
            {
                float a = 2.51f;
                float b = 0.03f;
                float c = 2.43f;
                float d = 0.59f;
                float e = 0.14f;
                return saturate((x*(a*x+b))/(x*(c*x+d)+e));
            }
            
            float4 ACESToneMapping(float4 x)
            {
                float a = 2.51f;
                float b = 0.03f;
                float c = 2.43f;
                float d = 0.59f;
                float e = 0.14f;
                return saturate((x*(a*x+b))/(x*(c*x+d)+e));
            }
            
            v2f vert (appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.normal = UnityObjectToWorldNormal(v.normal);
                o.tangent = UnityObjectToWorldDir(v.tangent);
                o.bitangent = normalize(cross(o.normal, o.tangent) * v.tangent.w);
                o.worldPos = mul(unity_ObjectToWorld, v.vertex);
                
                return o;
            }

            
            fixed4 frag (v2f i) : SV_Target
            {
                // 纹理采样
                float3 BaseColor = tex2D(_BaseColorTex, i.uv);
                float3 NormalMap = UnpackNormal(tex2D(_NormalTex,i.uv));
                float Roughness = tex2D(_RoughnessTex, i.uv).r;
                float Metallic = tex2D(_MetallicTex, i.uv).r;
                float3 Emission = tex2D(_EmissionTex, i.uv);
                float3 AO = tex2D(_AOTex, i.uv);
                
                // 变量准备
                float3 L = normalize(UnityWorldSpaceLightDir(i.worldPos));
                float3 V = normalize(UnityWorldSpaceViewDir(i.worldPos));
                float3 H = normalize(L + V);
                float3x3 TBN = float3x3(i.tangent, i.bitangent, i.normal);
                float3 N = normalize(mul(NormalMap, TBN));
                
                float VH = max(0, dot(V, H));
                float NV = max(0, dot(N, V));
                float NL = max(0,dot(N,L));
                
                float3 F0 = lerp(0.04, BaseColor, Metallic); //Fresnel F0：插值区分非金属和金属不同的F0值，非金属的FO数值较小，金属FO的数值较大
                
                /*  直接光（主光） */
                // Cook-Torrance BRDF
                // 漫反射部分
                float3 Ks = F_Schlick(VH, F0); //菲涅尔描述了光被反射的比例
                float3 Kd = (1-Ks) * (1 - Metallic);
                float3 Diffuse = Kd * BaseColor / PI; 
                //float3 Diffuse = Kd * BaseColor; //unity内置的PBR没有除以 PI, 颜色亮一些
                
                // 高光反射部分
                float D = D_DistributionGGX(N, H, Roughness);
                float3 F = Ks; 
                float G = G_Smith(N, V, L, Roughness);
                float3 Specular = D * F * G / max(0.0001, 4 * NV * NL);

                float3 DirectLightColor = (Diffuse + Specular) * NL * _LightColor0.rgb; //NL在这里起到了阴影贴图的作用，背光处变暗
                
                /*  间接光（环境光ambient） */
                // 漫反射部分
                float3 Ks_Ami = F_SchlickRoughness(NV, F0, Roughness);
                float3 Kd_Ami = (1 - Ks_Ami) * (1 - Metallic);
                float3 irradiance =  ShadeSH9(float4(N, 1));  // 球谐函数
                float3 Diffuse_Ami = irradiance * BaseColor * Kd_Ami / PI;
                //float3 Diffuse_Ami = irradiance * BaseColor * Kd_Ami; //没有除以 PI
                
                // 高光反射部分
                float3 F_Ami = Ks_Ami;
                // PartOne
                float3 R = reflect(-V, N);
                //UNITY_SPECCUBE_LOD_STEPS在"UnityStandardConfig.cginc"中// #define UNITY_SPECCUBE_LOD_STEPS (6)
                //根据材质的粗糙度，映射到某个粗糙度区间，然后把计算结果保存到不同的LOD等级中(Unity默认6级)
                float mip = Roughness * (1.7 - 0.7 * Roughness) * UNITY_SPECCUBE_LOD_STEPS;
                // 得到预过滤环境贴图 pre-filtered environment map
                float4 rgb_mip = UNITY_SAMPLE_TEXCUBE_LOD(unity_SpecCube0, R, mip);
                // 采样：光滑的地方采样清晰，粗造的地方采样模糊
                float3 preFilteredEnvironmentMap = DecodeHDR(rgb_mip,unity_SpecCube0_HDR);

                // PartTwo
                //LUT采样
                //float2 env_brdf = tex2D(_BRDFLUTTex, float2(NV, Roughness)).rg; //0.356
                //float2 env_brdf = tex2D(_BRDFLUTTex, float2(lerp(0, 0.99, NV), lerp(0, 0.99, Roughness))).rg;
                
                // 数值拟合
                float2 BRDF_Ami = AmiBRDFApprox(Roughness, NV);
                // float2 BRDF_Ami = AmiBRDFApprox(i.uv.y,i.uv.x);
                //  return pow(float4(BRDF_Ami,0,0),2.2);
                
                float3 Specular_Ami = preFilteredEnvironmentMap  * (F_Ami * BRDF_Ami.r + BRDF_Ami.g);

                float3 AmbientLightColor = (Diffuse_Ami + Specular_Ami) * AO;

                /*  颜色混合 */
                float3 FinalColor = DirectLightColor + AmbientLightColor + (Emission * _EmissionColor);
                
                return float4(FinalColor,1);
            }
            ENDCG
        }
    }
}
```

#### URP 实现
```c fold title:URP
Shader "Custom/PBR"
{
    Properties
    {
        _BaseColorTex ("BaseColor", 2D) = "white" {}
        _MetallicTex ("Metallic", 2D) = "white" {}
        _RoughnessTex ("Roughness", 2D) = "white" {}
        _EmissionTex ("Emission", 2D) = "white" {}
        [HDR]_EmissionColor("Emission Color",Color)=(1,1,1,1)
        [Normal] _NormalMap("NormalMap", 2D) = "bump" {}
        _NormalScale("NormalScale", Float) = 1
        _AOTex ("AO", 2D) = "white" {}
        _BRDFLUTTex ("BRDFLUT", 2D) = "white" {}
    }

    HLSLINCLUDE
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/lighting.hlsl"
    #include "CookTorrance.hlsl"

    CBUFFER_START(UnityPerMaterial)
    float4 _BaseColorTex_ST;
    float _NormalScale;
    float4 _EmissionColor;
    CBUFFER_END

    TEXTURE2D(_BaseColorTex);
    SAMPLER(sampler_BaseColorTex);
    TEXTURE2D(_MetallicTex);
    SAMPLER(sampler_MetallicTex);
    TEXTURE2D(_RoughnessTex);
    SAMPLER(sampler_RoughnessTex);
    TEXTURE2D(_EmissionTex);
    SAMPLER(sampler_EmissionTex);
    TEXTURE2D(_NormalMap);
    SAMPLER(sampler_NormalMap);
    TEXTURE2D(_AOTex);
    SAMPLER(sampler_AOTex);
    TEXTURE2D(_BRDFLUTTex);
    SAMPLER(sampler_BRDFLUTTex);
    SAMPLER(sampler_unity_SpecCube0);

    struct Attributes
    {
        float4 positionOS : POSITION;
        float4 color : COLOR;
        float3 normalOS : NORMAL;
        float4 tangentOS : TANGENT;
        float2 uv : TEXCOORD0;
    };

    struct Varyings
    {
        float4 positionCS : SV_POSITION;
        float4 color : COLOR0;
        float2 uv : TEXCOORD0;
        float3 positionWS: TEXCOORD1;
        float3 normalWS : TEXCOORD2;
        float4 tangentWS : TEXCOORD3;
        float3 bitangentWS : TEXCOORD4;
        float3 viewDirWS : TEXCOORD5;
    };
    ENDHLSL

    SubShader
    {
        Tags
        {
            "RenderPipeline" = "UniversalPipeline"
            "RenderType"="Opaque"
        }

        Pass
        {
            Tags
            {
                "LightMode"="UniversalForward"
            }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            Varyings vert(Attributes i)
            {
                Varyings o = (Varyings)0;

                o.positionCS = TransformObjectToHClip(i.positionOS.xyz);
                o.uv = i.uv.xy * _BaseColorTex_ST.xy + _BaseColorTex_ST.zw;
                o.positionWS = TransformObjectToWorld(i.positionOS.xyz);
                o.normalWS = TransformObjectToWorldNormal(i.normalOS);
                o.tangentWS.xyz = TransformObjectToWorldDir(i.tangentOS.xyz);
                o.viewDirWS = normalize(_WorldSpaceCameraPos.xyz - o.positionWS);

                return o;
            }

            float4 frag(Varyings i) : SV_Target
            {
                //主光源
                Light mainLight = GetMainLight();

                //纹理采样
                float3 BaseColor = SAMPLE_TEXTURE2D(_BaseColorTex, sampler_BaseColorTex, i.uv);
                float3 normalMap = UnpackNormalScale(
                    SAMPLE_TEXTURE2D(_NormalMap, sampler_NormalMap, i.uv), _NormalScale);
                float Roughness = SAMPLE_TEXTURE2D(_RoughnessTex, sampler_RoughnessTex, i.uv).r;
                float Metallic = SAMPLE_TEXTURE2D(_MetallicTex, sampler_MetallicTex, i.uv).r;
                float3 Emission = SAMPLE_TEXTURE2D(_EmissionTex, sampler_EmissionTex, i.uv);
                float AO = SAMPLE_TEXTURE2D(_AOTex, sampler_AOTex, i.uv).r;

                //变量准备
                float3x3 TBN = CreateTangentToWorld(i.normalWS, i.tangentWS.xyz, i.tangentWS.w);
                float3 N = TransformTangentToWorld(normalMap, TBN, true);
                float3 L = normalize(mainLight.direction);
                float3 V = normalize(i.viewDirWS);
                float3 H = normalize(L + V);
                float NdotL = max(0,dot(N, L));
                float NdotH = max(0,dot(N, H));
                float NdotV = max(0,dot(N, V));
                float VdotH = max(0,dot(V, H));
                float F0 = lerp(0.04, BaseColor, Metallic); //Fresnel F0：插值区分非金属和金属不同的F0值，非金属的FO数值较小，金属FO的数值较大
                /* Cook-Torrance BRDF */
                /* 直接光 */
                //漫反射部分
                float3 Ks = F_FresnelSchlick(VdotH, F0); //菲涅尔项描述了光被反射的比例
                float3 Kd = (1 - Ks) * (1-Metallic);
                float3 Diffuse = Kd/PI * BaseColor ;
                //float3 Diffuse = Kd * BaseColor; //unity内置的PBR没有除以 PI, 颜色亮一些
                
                //高光反射部分
                float D = D_GGXTR(NdotH, Roughness);
                float3 F = Ks;
                float G = G_SmithG2_direct(NdotV,NdotL, Roughness);
                float3 Specular = D * F * G / 4 * NdotV * NdotL;
                
                float3 DirectLightColor = (Diffuse + Specular) * mainLight.color * NdotL;
                
                /* 间接光 */
                // 漫反射部分
                float3 Ks_Ami = F_SchlickRoughness(NdotV, F0, Roughness);
                float3 Kd_Ami = (1 - Ks_Ami) * (1 - Metallic);
                float3 SHcolor = SampleSH(N); //球谐函数计算环境光照Li
                float3 Diffuse_Ami = Kd_Ami/PI * BaseColor * SHcolor;
                //float3 Diffuse_Ami = Kd_Ami * BaseColor * irradiance; //unity内置的PBR没有除以 PI, 颜色亮一些
                
                // 高光反射部分
                float3 F_Ami = Ks_Ami;
                //Part One
                //采样反射探针
                float3 R = reflect(-V, N);
                float mipmapRoughness = Roughness*(1.7-0.7*Roughness);
                float4 cubemapMipmap = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, sampler_unity_SpecCube0, R,mipmapRoughness*UNITY_SPECCUBE_LOD_STEPS);
                // 根据材质的粗糙度,得到对应mip级别的预过滤环境贴图
                float3 EnvSpecularPrefilted = DecodeHDREnvironment(cubemapMipmap, unity_SpecCube0_HDR); //得到Li
                
                //Part Two
                //LUT采样
                //float2 env_brdf = tex2D(_BRDFLUTTex, float2(NV, Roughness)).rg; //0.356
                //float2 env_brdf = tex2D(_BRDFLUTTex, float2(lerp(0, 0.99, NV), lerp(0, 0.99, Roughness))).rg;

                //数值拟合
                float2 BRDF_Ami = AmiBRDFApprox(Roughness, NdotV);
                
                float3 Specular_Ami = EnvSpecularPrefilted * (F_Ami * BRDF_Ami.r + BRDF_Ami.g);
                
                float3 AmbientLightColor = (Diffuse_Ami + Specular_Ami) * AO;
                float3 finalColor = DirectLightColor + AmbientLightColor + (Emission * _EmissionColor);

                return float4(finalColor, 1);
            }
            ENDHLSL
        }
    }
}
```


```c fold title:CookTorrance.hlsl
#ifndef COOKTORRANCE_BRDF
#define COOKTORRANCE_BRDF
#define PI 3.14159265358979323846

//D法线分布函数：GGX/TR
float D_GGXTR(float NdotH, float Roughness)
{
    float a2 = Roughness * Roughness;
    float NdotH2 = NdotH * NdotH;

    float nominator = a2; //分子
    float denominator = NdotH2 * (a2 - 1) + 1; //分母
    denominator = denominator * denominator * PI; 
    return nominator / denominator; //防止分母为0
}

//F菲涅尔方程：Schlick近似
//直接光部分 NV或VH均可
float3 F_FresnelSchlick(float VdotH, float3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0f - VdotH, 5.0);
}

//间接光部分 只能使用NV并引入粗糙度
float3 F_SchlickRoughness(float NdotV,float3 F0,float Roughness)
{
    float smoothness = 1.0 - Roughness;
    return F0 + (max(smoothness.xxx, F0) - F0) * pow(1.0 - NdotV, 5.0);
}

//G几何遮蔽函数:Schlick-GGX + SmithG2
float G_SchlickGGX(float NdotV, float k)
{
    float noninator = NdotV;
    float denominator = NdotV * (1 - k) + k;
    return noninator / denominator;
}

float G_SmithG2_direct(float NdotV,float NdotL,float Roughness)
{
    float k = (1+Roughness)*(1+Roughness)/8;
    float G1 = G_SchlickGGX(NdotV, k); //观察方向的几何遮挡
    float G2 = G_SchlickGGX(NdotL, k); //光源方向的几何阴影

    return G1*G2;
}

float G_SmithG2_IBL(float NdotV,float NdotL,float Roughness)
{
    float k = Roughness*Roughness/2;
    float G1 = G_SchlickGGX(NdotV, k); //观察方向的几何遮挡
    float G2 = G_SchlickGGX(NdotL, k); //光源方向的几何阴影

    return G1*G2;
}

/* 数值拟合 */
// 使命召唤黑色行动2 的函数拟合
// float2 AmiBRDFApprox(float Roughness, float NV)
// {
//     float g = 1 -Roughness;
//     float4 t = float4(1/0.96, 0.475, (0.0275 - 0.25*0.04)/0.96, 0.25);
//     t *= float4(g, g, g, g);
//     t += float4(0, 0, (0.015 - 0.75*0.04)/0.96, 0.75);
//     float A = t.x * min(t.y, exp2(-9.28 * NV)) + t.z;
//     float B = t.w;
//     return float2 ( t.w-A,A);
// }
            
// UE4 在黑色行动2 上的修改版本
float2 AmiBRDFApprox(float Roughness, float NoV)
{
    // [ Lazarov 2013, "Getting More Physical in Call of Duty: Black Ops II" ]
    // Adaptation to fit our G term.
    const float4 c0 = { -1, -0.0275, -0.572, 0.022 };
    const float4 c1 = { 1, 0.0425, 1.04, -0.04 };
    float4 r = Roughness * c0 + c1;//mad:multiply add
    float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;//mad
    float2 AB = float2( -1.04, 1.04 ) * a004 + r.zw;//mad
    return AB;
}

#endif
```