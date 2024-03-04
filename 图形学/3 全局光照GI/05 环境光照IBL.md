---
title: 05 环境光照IBL
aliases: 
tags: 
create_time: 2023-07-14 14:58
uid: 202307141458
banner: "[[Pasted image 20230714145946.png]]"
---

# 1 环境光照原理
环境光照就是在场景中任意一点往四周看去可看到的光照（距离视为无限远）, 将其记录在一张图上存储。也叫做 **IBL (image-based lighing)**。
通常我们用 Cube Map 和 Spherical Map 来存储环境光照，将贴图的每个像素当成一个光源。


![|400](1679148477478.png) ![|300](1679148477522.png)
>Cube Map（左）p 和 Spherical Map（右），它们是可以通过算法转换的

---

如果已知环境光照, 此时放置一个物体在场景中间, 在**不考虑阴影**时我们该如何去得到任何一物体上着色点的 shading 值呢?
- @ **首先要先来看渲染方程**
$$L_o(p,\omega_o) = \int\limits_{\Omega} f_r(p,\omega_i,\omega_o) L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$
通用的解法是使用**蒙特卡洛积分**去解, 但是蒙特卡洛需要大量的样本才能让得出的结果足够接近, 如果我们对每个 shading point 都做一遍蒙特卡洛积分，那样的话太慢了。

- @ **如何避免采样?**
**通过预滤波和预计算，完全避免采样！**

**brdf 分为两种情况:**
1.  brdf 为 glossy 时, 波瓣覆盖在球面上的范围很小
2.  brdf 为 diffuse 时, 波瓣会覆盖整个半球的区域，在积分域内变化不大
![[Pasted image 20230714130125.png]]

此时应该想到了我们之前讲的渲染方程近似公式:
[[02 PBR理论#渲染方程不等式近似]]
$$
\int_\Omega f(x)g(x)\mathrm{~d}x\approx\frac{\int_\Omega f(x)\mathrm{~d}x}{\int_\Omega\mathrm{~d}x}\cdot\int_\Omega g(x)\mathrm{~d}x
$$
![[02 PBR理论#^ptjnu8]]

由于  $f_r$  项作为 $g(x)$ 正好满足这个条件, 即 small support 或 Smooth integrand, 从而我们将渲染方程的 $L_i$ 项作为 $f(x)$ ，方程可拆分为两部分，这种方法称为 `Split Intergral` ： ^x7aaaa
$$
L_o(p,\omega_o)\approx\boxed{\frac{\int_{\Omega_{f_{r}}}L_i(p,\omega_i)\mathrm{~d}\omega_i}{\int_{\Omega_{f_r}}\mathrm{~d}\omega_i}}\cdot\int_{\Omega^+}f_r(p,\omega_i,\omega_o)\cos\theta_i\mathrm{~d}\omega_i
$$

> [!NOTE] 实时渲染：Split Sum
> 
> 在实时渲染中，为了追求速度通常不会求积分，而是转换成求和，上述拆分方法用**求和式**描述如下：
> $$
> \boxed{\frac1N\sum_{k=1}^N\frac{L_i(\mathbf{l}_k)f(\mathbf{l}_k,\mathbf{v})\cos\theta_{\mathbf{l}_k}}{p(\mathbf{l}_k,\mathbf{v})}\approx\left(\frac1N\sum_{k=1}^NL_i(\mathbf{l}_k)\right)\left(\frac1N\sum_{k=1}^N\frac{f(\mathbf{l}_k,\mathbf{v})\cos\theta_{\mathbf{l}_k}}{p(\mathbf{l}_k,\mathbf{v})}\right)}
> $$
> 这种方法称为 `Split Sum`，且结果和直接采用差异不大：
![[Pasted image 20230714143656.png]]
>

**下文为了讲述了 `Split Intergral` 方法的原理与推导，`Split Sum` 方法的原理与之类似**

## （1）预过滤IBL

**把 $L_i$ 项拆分出来, 然后将 brdf 范围内的 $L_i$ 积分起来并进行 normalize, 其实就是将 IBL 这张图给模糊了（即使用卷积核模糊图像）**

模糊就是在任何一点上取周围一片范围求出范围内的平均值并将平均值写回这个点上, 滤波核取多大取决于 BRDF 占多大, BRDF 的区域越大, 最后取得的图也就越模糊.

**环境光照的预过滤：**
- 预生成一组滤波核不同的环境光照滤波器（类似 mipmap），当我们需要使用时直接查询即可
- 其他滤波核尺寸的图可以通过 [[04 纹理#^s6etys|三线性插值]] 来近似。
![[Pasted image 20230714135052.png]]
![](1679148477798.png)

- ? 拆分就是为了做一个 Pre-filtering, 那么做 pre-filtering 是为了干什么?
![[Pasted image 20230714135944.png]]
左图为 brdf 求 shading point 值时, 我们要以一定立体角的范围内进行多次采样再加权平均从而求出 shading point 的值.

反过来思考，如右图，对环境光照做 pre-filtering。这样图上任何一点都是周围范围内的加权平均值，**只需要查询一次 IBL图** 就能得到和多次采样加权平均相同的结果，不需要多次采样！

## （2）预计算 BRDF LUT

到此我们解决了拆分后的前半部分积分采样的问题, 那么接下来我们处理 BRDF 项采样的问题：
$$
L_o(p,\omega_o)\approx\frac{\int_{\Omega_{fr}}L_i(p,\omega_i)\mathrm{d}\omega_i}{\int_{\Omega_{fr}}\mathrm{d}\omega_i}\cdot\boxed{\int_{\Omega^+}f_r(p,\omega_i,\omega_o)\cos\theta_i\mathrm{d}\omega_i}
$$
**如何避免采样？**
- % 接下来讲的方法并不是最优方法, 主要是为了学习方法背后的思想.

**仍然可以用预计算来解决后半部分积分采样的问题**, 但是预计算的话我们需要将参数的所有可能性均考虑进去, 但是比较多，包括 roughness、color 等。考虑所有参数的话我们需要打印出一张五维或者更高的表格, 这样会拥有爆炸的存储量, 因此**我们需要想办法降低维度, 也就是减少参数量从而实现预计算。**

---

在 BRDF 中，考虑的是 DFG 项，由于此时暂时不考虑阴影，此处需要关注的是 F 项和 D 项。
![[Pasted image 20230714142406.png]] 


- F 项可以近似成一个和基础反射率 $R_0$ 、观察角度 $\theta$ 相关的**指数函数**
- 法线发布函数（NDF）是一个一维的分布，其中有两个变量：
    1. 粗糙度 $\alpha$，定义材质是 diffuse 还是 gloosy
    2.  half vector 和法线中间的夹角，可以**近似成和观察角度 $\theta$ 相关的数**

---

至此我们有了三个变量: 基础反射率 $R_0$, 粗糙度 $\alpha$ 和观察角度 $\theta$ , 三维的预计算仍然是一个存储量爆炸的结果, 因此我们还要想办法减少参数量。

所以我们通过将 Schlick 近似带入后半部分的积分中：

$$
\begin{aligned}
\begin{aligned}\int_{\Omega^+}f_r(p,\omega_i,\omega_o)\cos\theta_i\mathrm{d}\omega_i\end{aligned}& \begin{aligned}\approx&R_0\int_{\Omega^+}\frac{f_r}{F}\left(1-(1-\cos\theta_i)^5\right)\cos\theta_i\mathrm{d}\omega_i+\end{aligned}  \\
&\int_{\Omega^+}\frac{f_r}F(1-\cos\theta_i)^5\cos\theta_i\mathrm{d}\omega_i
\end{aligned}
$$

**基础反射率 $R_0$ 被拆出积分式，需要预计算的两个量就只有粗糙度粗糙度 $\alpha$ 和角度 $\theta$，可以将预计算结果绘制成一张 2D 纹理（横轴为 $\cos\theta_v$，纵轴为粗糙度），在使用时进行查询即可。不需要采样！**
![[Pasted image 20230714143534.png|400]]

# 2 环境光照阴影
主要内容：**在环境光照下利用 sh 计算出 diffuse 物体的 shading 和 shadow**

我们在上节课讲述了如何不采样去计算不考虑 shadow 时的 shading 值, 那么如果考虑阴影，如何去得到物体在环境光照射下生成的阴影呢?

环境光照阴影对实时渲染来说是很困难的, 可以从两个角度考虑:
1. **Many Light 问题**：我们把环境光理解为很多个小的光源, 这种情况下去生成阴影的话, 需要在每个小光源下生成 shadow map, 因此会生成线性于光源数量的 shadow map, 这是十分高昂的代价。
2. **Sampling 问题**：在任何一个 shading point 上已知来自正半球方向的光照去解渲染方程, 最简单的方法是采样空间中各方向上的不同光照, 可以做重要性采样, 虽然做了重要性采样但仍需要大量的样本, 因为最困难的是可见性测试项 $V_i (p,\omega _i)$ 。由于 Shading point 不同方向上的遮挡是不相同的, 我们可以对环境光照进行重要性采样, 但一个 Shading point 周围的遮挡情况是未知的，因此我们只能盲目的去采样 (我个人对盲目采样的理解是, 为了确保准确性需要对 sp 各个方向的遮挡进行采样, 因此仍然会生成大量的样本)。我们也无法提取出  $V_i (p,\omega _i)$  项, 因为如果是 glossy brdf, 他是一个高频的, 且 $L_i$ 项的积分域是整个半球, 因此并不满足 smooth 或 small support, 因此无法提取出   $V_i (p,\omega _i)$  项.

**在工业界中, 我们通常以环境光中最亮的那个作为主要光源, 也就是太阳, 只生成太阳为光源的 shadow。**

下面是几篇关于生成阴影的文章: ![[Pasted image 20230714151259.png]]
1. 做的是全局光照部分产生的 shadow.
2. 解决的是离线渲染中的 many lights 的问题, 核心思想是把反射物当成小光源, 把所有的小光源做一下归类并近似出照射的结果.
3. Real Time Ray Tracing, 可能是最终解决方案.
4. **PRT 可以十分准确的得到来自环境光中的阴影.**

但是我们知道世上没有十全十美的事情,

**那么.... 古尔丹, 代价是什么呢?**

## 信号知识

回顾一下， [[02 光栅化#信号基础]]
这里我们要理解一个思想：
**两个函数相乘再做积分**（product integral）可以看作是一个滤波操作（卷积操作）：
$$
\int_{\Omega}f(x)g(x)\operatorname{d}x
$$

- 可以理解为空间域上的两个信号 $f (x)$ 和 $g (x)$ 进行一个卷积, 等于在频域上让两个信号相乘，如果两个信号有一个信号是低频的, 那么频域上相乘后得到的结果也是低频的, 最终相乘在积分的结produc果也是低频的, 可以总结为：**积分之后的频率取决于积分前最低的频率。**
- 低频意味着函数更加地 smooth 或者有着 slow 的变化。

## Basis Functions
基函数（Basis Functions）：通常可以用来表示其他函数的一组函数
$$
f(x)=\sum_ic_i\cdot B_i(x)
$$
- 傅里叶级数是一组基函数
- 多项式级数也可以是一组基函数

## Spherical Harmonics (球谐函数)
球面谐波函数
### 定义

回归正题, 我们要讨论的是如何在环境光照下生成阴影, 先从最简单的开始, 如果给了你环境光和一个 diffuse 的物体, 在不考虑 Shadow 的情况下如何去计算 shading 值?

为了计算 shading 值, 我们引入数学工具 ----->Spherical Harmonics (球谐函数)

**在游戏渲染中, SH 有很多应用. 比如 SH 可以用来表示低频部分的环境光照, 也可以用来提供 light probe 的烘培光照等等...**

- @ **SH 是一系列定义在球面上的 2D 基函数 $B_{i}(\omega)$** ，表示球面不同方向上的属性。$\omega$ 表示方向
1. 它是一系列的基函数，类似于一维的傅里叶函数, 与里面不同频率的 cos 和 sin 函数类似, 只是全都是二维函数。**这些 2D 函数有不同的频率。不同频率的函数个数也不同, 频率越高所含有的基函数越多。**
2. 因为它是定义在球面上的，球面上会有不同的值, **由于在球面上两个角度 $\theta$ 和 $\varphi$ 就可以确定一个方向了, 因此可以理解为是对方向的函数**, 通过两个角度变量从而知道这一方向**对应在球面上的值**。
3. 相比于傅里叶级数的基函数，球谐函数可以将最低频到最高频描述出来。
>三维空间的方向可以表示为一个二维函数，因为由两个角度 $\theta$ 和 $\varphi$ 就可以确定一个方向。


![[Pasted image 20230714160043.png]]
>SH 的可视化
> $l$ ：阶数，通常第 $l$ 阶有 $2l+1$ 个基函数，前 $n$ 阶有 $n^2$ 个基函数。**阶数越高，频率越高，包含的高频信息越多，每一阶中的函数频率相同**
> $m$ ：在某一个频率下基函数的序号，分别从从 $-l$ 一直到 $l$。


> [!question] 为什么不直接使用 $\theta$ 和 $\varphi$ 的 2D 函数做傅里叶变换来分析属性？而是使用球谐函数？
> 经过傅里叶变换可能在球面上有不连续的现象，而球谐函数本身就定义在球面上，生成的结果是连续的。
> 

每个基函数都有一个比较复杂的数学表示，对应一个 $legendre$ 多项式，我们不用去了解 $legendre$ 多项式, 我们只需要知道基函数是 $B_i(\omega)$, 可以被某些数学公式来定义不同方向的值是多少就可以了.
- 图中的颜色表示的是值的大小, l=0 中, 越偏白的蓝色地方值越大, 越黑的地方值越小. 而黄色中则表示偏白的地方表示其绝对值大, 偏黑的地方表示绝对值小。也就是蓝色表示正, 黄色表示负.
- 频率表示的就是值的变化, 因此可以很清晰的从形状看出.
### 性质
![[Pasted image 20230715144921.png]]

1. **正交性: 一个基函数投影到另一个基函数上，结果为 0： $$
\begin{aligned}&\int B_i(\mathbf{i})\cdot B_j(\mathbf{i})\mathrm{d}\mathbf{i}=\mathbf{1}\quad(\mathbf{i}=\mathbf{j})\\&\Omega\\&\int B_i(\mathbf{i})\cdot B_j(\mathbf{i})\mathrm{d}\mathbf{i}=\mathbf{0}\quad(\mathbf{i}\ne\mathbf{j})\\&\Omega\end{aligned}
$$
1. 简单地投影 / 重建
2. 简单地旋转（旋转不变性）
旋转是一个很重要的性质：**旋转一个基函数之后，得到的函数就不再是一个基函数，但是旋转球谐函数等价于同阶基函数的线性组合。**
![[Pasted image 20230715145545.png]]
>如图，框中的基函数旋转后，仍可以用同阶的基函数的线性组合表示出来
3. 用低阶基函数表示低频信息，用的阶数越多越接近与原始函数, 第四张图是前 26 阶函数去重建原始函数, 可以看到效果还不错. 但我们在使用时用不到那么多阶。 ![[Pasted image 20230715145947.png|650]]
4. 实际上球谐函数每个基函数表示的都是球面上某一部分的光照，如图
![[Pasted image 20230716204102.png]]
### 投影

> [!NOTE] 投影
> 求任一基函数的系数称为 Projection

**得到每个 SH 基函数的系数**

给定一个二维球面函数 $f(w)$，可以将其展开成由 SH 基函数的线性组合来描述的函数。对于任何一个基函数 $B_i$，他的系数 $c_i$ 通过以下公式求投影：
$$
c_i=\int_{\Omega}f(\omega)B_i(\omega)\mathrm{~d}\omega 
$$


### 重建
**知道基函数对应的系数，就能使用 (截断的)系数和基函数恢复原始函数**

由于基函数的阶可以是无限个的，越高的阶可恢复的细节就越好, 但一方面是因为更多的系数会带来更大的存储压力、计算压力，而一般描述变化比较平滑的**环境漫反射部分**，用 3 阶 SH 的低频信息就足够了；另一方面则是因为 SH 的物理含义不是特别好理解，高阶 SH 容易出现各种花式 Artifact，美术同学一般都会认为这种表现属于 bug。

以 Unity 为例：
对于场景中某个位置的环境光贴图，它贴在球面上应该是长这个样子：
![[Pasted image 20230716201254.png]]
在这里，我们用球坐标来表示球面上的环境光信息。球坐标的表示如下：
![[Pasted image 20230716201259.png]]
对于环境光贴图在单位球面上的一点 P, 假设它的颜色 c 是 $f$ 关于 $\theta$ 和 $\phi$ 的函数，则有 $c=f(\theta,\varphi)$
那么在球面上，也可以用多个球谐函数基函数 $B_i$ 来表示，我们只需要低阶基函数就能大致地重建这个球面函数。使用的基函数越多，重建出来的效果就越好。
unity 使用了七个球谐函数来重建，可以满足低频环境光照（漫反射）的需求。
```cs
half3 SampleSH(half3 normalWS)
{
    // LPPV is not supported in Ligthweight Pipeline
    real4 SHCoefficients[7];
    SHCoefficients[0] = unity_SHAr;
    SHCoefficients[1] = unity_SHAg;
    SHCoefficients[2] = unity_SHAb;
    SHCoefficients[3] = unity_SHBr;
    SHCoefficients[4] = unity_SHBg;
    SHCoefficients[5] = unity_SHBb;
    SHCoefficients[6] = unity_SHC;

    return max(half3(0, 0, 0), SampleSH9(SHCoefficients, normalWS));
}
```

# 3 不考虑阴影：环境光照下 diffuse 物体物体的着色
$f (\omega)$ 可以是任何一个函数, 我们说过基函数可以重建任何一个球面函数, 那么我们这里的 $f (\omega)$ 就是环境光照, 由于环境光是来自于四面八方且都有值, 所以环境光照就是一个球面函数,, 我们可以把它投影到任何一个 SH 基函数基函数上, 可以投影很多阶, 但是只需要取前三阶的 SH 去恢复环境光就可以恢复出最低频的细节了, 这个在下文 RAVI 教授的结论有提到.

**Ravi 教授等人在 01 年左右做过一些实验发现，diffuse BRDF 类似于一个低通滤波器，使用一些低频信息就可以恢复出原始内容。** 回忆一下，在本文之前的内容中曾说过：“**积分之后的频率取决于积分前最低的频率**”，当 diffuse BRDF 使用低频信息即可恢复内容时，也就意味着无论光照项是多么复杂，其本应该用多高频的基函数去表示，但我们希望得到的是其与 BRDF 之积的积分，所以可以使用比较低频的基函数去描述灯光。下面的实验结果意味着，遇到 diffuse 的物体时使用前 3 阶的球谐基函数就可以基本重建出正确率 99% 的结果。

![[Pasted image 20230715142919.png]]

# 4 考虑阴影：PRT 预计算辐射率转移 
Precomputed Radiance Transfer

在实时渲染中, 我们把渲染方程写成由三部分组成的积分:
![[Pasted image 20230715143714.png]]

光照项, visibility 项和 brdf 项, 这三项都可以描绘成球面函数, 这里用的是 cube map 描述法, 那么最简单的解这个方程的方法就是每个像素挨个去乘, 假设环境光是 $6*64*64$ 的 map，对于每个 shading point 来说，计算 shading 需要计算 $6*64*64$ 次。这个开销是十分大的.

因此我们利用基函数的基本原理把一些东西先预计算出来, 从而节省开销.
![[Pasted image 20230715143935.png|750]]
**PRT 的基本思想:**
我们把渲染方程分为两部分, lighting 和light transport
1. **假设在渲染时场景中只有 lighting 项会发生变化 (旋转, 更换光照等), 由于 lighting 是一个球面函数, 因此可以用基函数来表示, 在预计算阶段计算出 lighting**：$L(\mathbf{i})\approx\sum l_{i}B_{i}(\mathbf{i})$
2. 而 light transport (visibility 和 brdf) 是不变的, 因此相当于对任一 shading point 来说, light transport 项固定的, 可以认为是 shading point 自己的性质, light transport 总体来说还是一个球面函数, 因此也可以写成基函数形式, 是可以预计算出的。**（计算 light transport 时，考虑可见项 $V(i)$ 就能计算阴影了）**
3. 我们分为两种情况, diffuse 和 glossy:
## 预计算diffuse
由于在 diffuse 情况下, brdf 几乎是一个常数, 因此我们把 brdf 提到外面。
由于 lighting 项可以写成基函数的形式, 因此我们求和式把其代入积分中, 对于任何一个积分来说, 在 $B_i$ 的限制下, $l_i$ 此对积分来说是常数, 可以提出来
![[Pasted image 20230715144432.png]]
对于积分中的部分来说, $B_i$是基函数, $v$ 和 $cos$ 项在一起不就是 light transport 吗, 那不就是 light transport 乘与一个基函数，这就成了 lighting transport 投影到一个基函数的系数，接下来代入不就能进行预计算了吗，这样就只要算一个点乘就好了。
之所以说是点乘, 是因为结果是个求和, 我们要计算 $l_{1}T_{1}$ + $l_{2}T_{2}$ +......, 不正好相当于两个向量点乘吗.
**所以对于任何一个 shading point 我们去算他的 shading 和 shadow, 只需要计算一个点乘就可以了。**

> [!question] 
> 但是, 没有东西是十全十美的, 那么, 古尔丹, 这次的代价又是什么呢?
> 1. light transport 做了预计算, 因此 visibility 当了常量, 因此场景不能动, 因此只能对静止物体进行计算.**
> 2. 对于预计算的光源我们把它投影到 sh 上, 如果光源发生了旋转, 那不就相当于换了个光源吗?这个问题由于 sh 函数的**旋转不变性**可以完美的解决。**旋转光照 = 旋转 SH 的基函数**，任何一个 SH 基函数旋转后都可以被同阶的 SH 基函数线性组合表示出来。因此, 我们根据这个性质, 还是可以立刻得出旋转后的 sh 基函数新的线性组合。

**预计算Lighting部分：**
![[Pasted image 20230715150258.png]]
我们将 lighting 这个球面函数, 通过 SH 的基函数用一堆系数 $l_i$ 来表示, 这些系数排成一行也就是组成了向量, 因此光照变成了一个向量。
如果要重建原函数则只需要把这些系数乘以对应的基函数再加在一起即可。

**预计算 Lighting transport 部分 ：
![[1b95c21b053249c9221814cb0190b315_MD5.jpg]]

我们可以把 $Bi$ 理解为 lighting, 也就是说每个基函数所描述的环境光去照亮这个物体从而得到照亮之后的结果, 我个人理解预计算就是把每个基函数照亮得到的结果生成.

![[c97c488484872a02fea1e3365b32d170_MD5.jpg]]

**最后我们在计算 shading 和 shadow 时只需要进行向量 $l_i$ 和 $t_i$ 的点乘即可得到结果.

到此我们知道了如何再已知环境光的情况下, 通过使用 PRT 来计算出 diffuse 物体的 shading 和 Shadow 了.**
### 另一种方法预计算 Light transport 
首先我们从另外一个角度重新来看，怎么对 Light transport 做预计算:
和上一节推导不同，我们这里直接把渲染方程中的 lighting 和 light transport，都用 sh 基函数表示
![[Pasted image 20230715153512.png]]
然后把两个都展开成求和，然后把求和符号拆出去，然后就变成了一个双重求和的结果, 每个求和要乘三样东西:
1. 对应的两个系数
2. 积分值 (**积分与实际场景无关, 是两个基函数的 product integral**)
这样就会发现这样推导的结果与上一节课的结果不太一样  ：
![[Pasted image 20230715153601.png]]

如果基函数的个数为 $n$ 的话, 做一个向量点乘的复杂度应该是 $O (n)$, 为什么在这里是双重求和变成了 $O ( n^{2})$ 了呢?
实际上，因为 SH 具有正交性, 也就是当 p=q 时候, $B_p(w_i)B_q(w_i)$ 才不为 0，也就是这个二维矩阵上只有对角线上有值, 因此只需要计算对角线上的值就行了, 所以算法复杂度仍然是 $O (n)$。

## 预计算 golssy（没理解）
Diffuse 和 glossy 的区别在于, diffuse 的 brdf 是一个常数, 而 glossy 的 brdf 是一个 4 维的 brdf (2 维的输入方向（前面提到过一个方向用两个角度表示）, 2 维的输出方向)。

如果仍然按照上面的办法投影到 sh 上会出现一些问题, 因为 light transport 包含 visibility 和 brdf, brdf 又是一个 4 维的函数 (关于 i 和 o 的函数), 给一个 O 就会有一个不同的 brdf, 给定一个任意的观察方向 O, light transport 都会投影出一组完全不同的向量, 且向量中的每一个元素都是一个 o 的函数.

或者直观一点来说, glossy 物体有一个很重要的性质, 它是和视点有关的. diffuse 的物体不管视角如何旋转改变, 你看到的 Shading point 的 result 是不会改变的, 因为整个 Diffuse shading 和视角是无关的.

但是 glossy 不是这样的, glossy 是和视角有关的, 不同的视角得到的 shading result 也是不一样的, 因此 O 不一样, L (O) 也不一样. 所以即使 light transport 即使投影到了 i 方向上的基函数, 所得到的仍然是一个关于 O 的函数而不是系数.

![[Pasted image 20230715154419.png]]

我们将 4D 的函数投影在 2D 上之后, 虽然得到的是一个关于 O 的函数, 但是现在这个函数也只是关于 O 了, 因此我们在 O 的方向上将其投影到 SH 基函数上.

![[c1749010897ff2a894f8cd37080803f6_MD5.jpg]]

![[7c0a3f056325931521d0ab844a808a52_MD5.jpg]]

因此, light transport 上就不再认为得到的是向量了, 而是一个矩阵, 也就是对于任意一个 O 都会得到一串向量, 最后把所有不同 O 得到的向量摆在一起, 自然而然就形成了一个矩阵.

或者这样理解, 我们最后得到的是不同方向上的 radiance, 自然而然是一个向量, 我们将 lighting 投影到 SH 上得到的是一个向量, 只有向量 * 矩阵得到的结果才是向量, 因此这里只能是矩阵.

可想而知, 这样的话将会产生巨大的存储.

![[7ca5cc47908a71915da9ea5a87be01ac_MD5.jpg]]

**正常情况下人们会用多少阶的基函数呢？**
基函数个数：9 个（三阶）16（四阶）25 个（五阶）

**我们以四阶为例:**
Diffuse 物体：每个点需要两个长度为 16 的向量点乘；(diffuse 情况下一般三阶就足够了)
Glossy 物体：每个点需要 16 阶向量与 `16*16` 矩阵乘。(一般需要高阶一点)

![[c4e184988c86b6dbbb4594ebee4398c3_MD5.jpg]]

这里看出来 PRT Glossy 比 Diffuse 效率要差很多, 而当 Glossy 非常高频的时候, 也就是**接近镜面反射的情况的时候, PRT 就没有那么好用**，我们虽然可以采用更高阶的 SH 来描述高频信息, 但是使用 SH 甚至远不如直接采样方便。

图二中脚下关于阴影的遮挡充分考虑了 visibility（也就是考虑了阴影）效果就非常好；

图三考虑了多次光线 Bounce 的结果。

**那么怎样考虑把多次 bounce 当作 Light transport 的一部分呢？**
我们可以用一系列的表达式来描述不同光线传播的路径都是一种什么类。
**区分材质区分为三种：**
1.  Diffuse
2.  Specular 镜面反射
3.  Glossy 介于两者之间

![[aacc4f6b9dfda6d4d9f5b7d812ccb1b4_MD5.jpg]]

1.  LE：Light 直接到眼镜；
2.  LGE：light 打到 Glossy 物体然后到眼镜。
3.  LGGE：多 bounce 一次, 就是 light 先打到壶嘴, 在 bounce 到壶身, 最后到 eye。(L->glossy->glossy->eye)
4.  L（D|G）E：Light 从光源出发, 打到一个物体, 可能是 diffuse 也可能是 glossy,* 表示 bounce 次数, 最后到达 EYE.
5.  LS（D|G）*E：打到 Specular 面上，然后聚焦到 Diffuse 物体上, 最后被眼睛看到。也就是 caustics.

![[cae43d8f03ed39c3f40b51e73b3f7693_MD5.jpg]]

从上面可以看出所有路径开始都是 L 最后都是 E，因此我们在运用 PRT 时候，拆分为 light 和 light transport 之后, 不管中间 boucne 几次, 我们只需要预计算算出 Light transport 就行，不论多么复杂的 bounce, 我们只需要计算出 light transport 就能得出最后的 shading result。

所以说，只要采用了 PRT 的思路，把 light 和 light transport, 不管 light transport 有多复杂, bounce 了多少次, 只要进行了预计算, 渲染时实际跑的时候是很简单的, 因为实际跑的时间是与 transport 的复杂度无关的.

**overall, 这一页只是为了告诉我们, 可以把任意复杂的 light transport 给预计算出来, 只是 light transport 越复杂在预计算时花费的时间多而实际跑时候是很快的.**

**那么怎么算呢?**

![[5211396630d7ea7e196fd9d216f205c7_MD5.jpg]]

理解方式 1：把 light transport 和 sh 基函数做了一个 **Product Integral**

理解方式 2：把 light transport 的预计算看作是一个在一些奇怪 lighting 下做的渲染过程.

如果我们把基函数看为 lighting 项, 那么这就是 rendering equation, 我们把 light transport 投影到 basis 上, 相当于用 basis 这个 Lighting 照亮物体, 每个 basis 得到一个渲染图, 最后我们进行重建从而得出最后的 shaing 值.

下图是不同 BRDF 的渲染结果:

*   各项异性的 BRDF
*   普通的 BRDF
*   不同位置 BRDF 不同的物体（BRDF 维度增加）。

![[ebb722974b587f7c459174f45de8b3a1_MD5.jpg]]

Sloan 在 02 年提出的这个方法（即 PRT），使用球谐函数估计光照和光线传输，将光照变成光照系数，将光线传输变成系数或者矩阵的形式，通过预计算和存储光线传输将渲染问题变为每个 vertex/shading point：点乘（diffuse 表面）、向量矩阵乘法（glossy 表面）。

![[684d05b78a8d2801f3c550ea4351161a_MD5.jpg]]

  
但该方法也有其缺点：
*   **由于球谐函数的性质，该方法比较适合使用于低频的情况**（可用于高频但不合适, 如图即使使用了 26*26 阶的 sh 仍然得不到比较好的效果）
*   **当改变场景或者材质时需要重新预计算 light transport，此外预计算的数据比较大。**

![[6daa4a332c22711406a2585283f39ee6_MD5.jpg]]

## 更多的基函数
此外，基函数除了可以使用球谐函数外，还有很多选择，比如 Wavelet（小波函数）、Zonal Harmonics、Spherical Gaussian、Piecewise Constant 等。

![[5908515c0f9c57b31cf0f0f7ff421b2f_MD5.jpg]]

这里以 Haar 小波为例，小波变换的过程就是投影过程，相比于球谐函数对低频内容友好（球谐函数使用少量的基去表示），小波变换可以全频率表示，但是只有很少的系数是非零的.

![[0fb7468b6f90d043368609c6ee75db51_MD5.jpg]]

由于小波是平面上的函数，为了防止变换后在球面上出现缝隙，所以采用了 Cubemap 来作为环境光而不是 sphereical map。

从图中可以看到, 小波变化是把每张图的高频信息留在这张图的左下, 右上和右下三部分, 而把剩余的低频信息放在左上角, 左上角的信息可以继续进行小波变换, 我们会发现高频的东西很少, 对于绝大部分来说是 0, 不断地进行小波变换可以得到一个很不错的**既保留了低频又保留了高频的压缩。**

![[5ab2cd5bcdc667c438b2bc3a616d5d74_MD5.jpg]]

但是小波也有自己的缺陷：**不支持旋转**（使用球谐函数进行表示时，由于球谐函数具有 **simple rotation** 的性质，所以支持光源的旋转）。

![[61c6d37378f1b355c791886163dd4c16_MD5.jpg]]
