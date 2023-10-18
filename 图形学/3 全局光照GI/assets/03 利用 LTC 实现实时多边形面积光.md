假期有空，整理了之前看过的论文《Real-Time Polygonal-Light Shading with Linearly Transformed Cosines》的笔记。这论文第一次看时，满脑子都是说的什么鬼。我认为要彻底理解了该论文的要点，还是得先从概念开始理解，并配合源码阅读理解，否则光是看论文要理解起来太困难。源码链接：

[selfshadow/ltc_code](https://github.com/selfshadow/ltc_code)

## 要点概述及概念理解

论文的目的是要实现实时的多边形面光源的反射，并且能有基于物理的 brdf 效果。而要实现基于物理的 brdf 反射，我们要计算每个着色点来自面光源的 irradiance。这里有两个难点：

1.  物理 brdf 球面的多边形积分没有解析解，而且非常消耗。
2.  面光反射需要带有真实感物理的效果。

为了解决这两个问题，我们引入一种新的球面分布叫 linearly transformed spherical distribution(LTSDs)。简单来说就是一个球面分布用一个 **3x3 的矩阵**做了线性变换后得到一个新的分布。经过这个线性变换后，改变了原分布的 “形状”，例如 roughness，elliptic anisotropy，skewness。我把论文的图片贴出来，但必须让大家明白，该图片描述的是 LTSDs，并不是后面提到的 LTC(Linearly Transformed Cosine)。

![[cfd5c1ef2e8ef3aeeff0cf127c79bc66_MD5.jpg]]

下面引入面光反射用到的分布，叫做 Linearly Transformed Cosine(LTC)，注意，这个分布是 LTSDs 这类分布中的**其中一员**而已。下面的图是 4 种 LTSDs，其中包括第三列的 LTC。

![[7ac728704a08d35f1e99beb6c827e17d_MD5.jpg]]

经过线性变换后的分布，继承了原分布的一些特点，例如归一化，球面多边形积分，重要性采样等。

而这些分布，都可以改变形状近似出基于物理的 brdf，为何我们要选择原分布是 clamped cosine 呢？下面我尽量说清楚。

## 核心思想

介绍完基本的概念后，我整理了整个实现的核心思想。

1.  在实时渲染的每个 pixel shading 中，我们利用 LTC 这个分布，去做面光的反射，也就是说我们要在 shading 中计算出着色点的 irradiance。
2.  由于 LTC 的分布可以转换回原来的 cosine 分布，在原分布中可以求得多边形的 irradiance 的积分解析解，这个 irradiance 等同于在 LTC 分布中的面光积分。
3.  这个多边形在半球上的 irradiance 的积分的算法，详细参考 [Geometric Derivation of the Irradiance of Polygonal Lights](https://hal.archives-ouvertes.fr/hal-01458129/document)。
4.  上面提到了从原 cosine 分布转换到 LTC 有一个 3x3 矩阵 M，这个矩阵 M 需要通过一个离线算法去生成，可以达到 LTC 拟合出 GGX 分布等效果，后面详细介绍。
5.  各个分布之间的关系：

![[0031d39cebe5761331531e91077a738d_MD5.png]]

简单来说，原分布是 cosine，经过一个 linearly tranform 后就是文中说的 LTC，这个 LTC 可以近似出 ggx 等物理效果。

## Linearly Transformed Cosine

上面已经提到，要模拟面光的反射，我们需要求得多边形面光在球面上的 irradiance 积分，而利用原分布是 clamped cosine 有解析解。

Linearly Transformed cosine，既然是一个变换，那把什么变换到什么？

实际上是把原函数的方向参数做了一个变换，我们把 transformed 后的新的分布定义成 D(ω)，原分布定义成 Do(ωo)，那么方向ω可以表达为：

$\omega = \frac{M \omega _o}{||M\omega _o||}$

反过来，ωo 也可以用ω来表达：

$\omega _o = \frac{M^{-1}\omega}{||M^{-1}\omega||}$

最后两个分布之间的关系表达式是：

$D(\omega) = D_o(\omega_o)\frac{\partial \omega _o}{\partial \omega} = D_o(\frac{M^{-1}\omega}{||M^{-1}\omega||})\frac{M^{-1}}{|M^{-1}\omega|^3}$ **(1)**

其中 $\frac{\partial \omega_o}{\partial \omega} = \frac{|M^{-1}|}{||M^{-1}\omega||^3}$ 是分布转换的雅可比行列式。关于分布之间的转换，可以参看 pbrbook 第 13 章的具体内容，有提及到分布转换的雅可比行列式。

分布关系表达式 **(1)** 具体有什么作用，我后面会说明清楚。

接下来，我把论文的 Appendix A 中的雅可比推导 $\frac{\partial \omega_o}{\partial \omega}$ 写出来。

![[9caa9b36b0e225c3fa4739b30a8b3303_MD5.jpg]]

如上图所示，左边红色面积是 $\partial \omega_o$ ，右边绿色面积是经过变换后的微分立体角 $\partial \omega$ ，现在我们求两者的关系。记得球面立体角的定义是ω = a/r²，单位是 steradiants。

那么根据立体角的定义，我们得到：

$\partial \omega = \frac{A\cos \theta}{r^2}$ **(2)**

现在我们来看看面 A 的面积计算：

$A = \partial \omega _o||M\omega _1 \times M\omega _2||$

这个公式是如何来的，我没有很严谨的推导，如果立体角ωo 在单位球面的面积是 $\partial \omega _o ||\omega _1 \times \omega _2||$ ，那么这个面积经过线性变换后得到 A。

曲面的面积计算定义参考如下，之前这个没完全弄明白，现在补上相关的数学知识，有兴趣的同学可以看下面这本书：

![[eef7326e0a083227d4f86c07892d9437_MD5.jpg]]

由于 $M\omega _1 \times M\omega _2 = det(M)(M^T)^{-1}\omega _1 \times \omega _2 = det(M)(M^T)^{-1}\omega _o$ ，这个推导详细看：[Cross product: matrix transformation identity](https://math.stackexchange.com/questions/859836/cross-product-matrix-transformation-identity)

代入公式 **(2)** 得到：

$\begin{align} \partial \omega &= \frac{\partial \omega _o||M\omega _1 \times M\omega _2||\cos\theta}{{||M\omega _o||}^2} \\ &= \frac{ \partial \omega _o ||M\omega _1 \times M\omega _2||\left <\frac{M\omega _o}{||M\omega _o||}, \frac{M\omega1 \times M\omega _2}{||M\omega1 \times M\omega _2||}\right >} {{||M\omega _o||}^2} \\ &= \frac{\partial \omega _o \left <M\omega _o, M\omega _1 \times M\omega _2 \right >}{||M\omega _o||^3} \\ &= \frac{\partial \omega _o det(M)\left <M\omega _o, (M^T)^{-1}\omega _o \right >}{||M\omega _o||^3} \end{align}$

其中 $\cos\theta = \left <\frac{M\omega _o}{ || M\omega _o ||} , \frac{M\omega _1 \times M\omega _2}{||M\omega _1 \times M\omega _2||} \right >$

所以最后得到 $\partial \omega _o$ 和 $\partial \omega$ 的关系：

$\frac{\partial \omega}{\partial \omega _o} = \frac{det(M)}{||M\omega _o||^3}$

那么倒数后得到：

$\frac{\partial \omega _o}{\partial \omega} = \frac{det(M^{-1})}{||M^{-1}\omega||^3}$

直到这里，公式 (1) 推导完毕。

那么公式 **(1)** 具体有什么作用？下面部分将尽我所能说清楚。

## 利用 LTC 拟合基于物理的 BRDF

上面提到了各个分布的关系，LTC 可以拟合出物理 BRDF 的效果，那么怎么拟合呢？关键是 3x3 矩阵 M 怎么求出来，上文已经提到，M 可以通过不同的参数，从形状上近似出 BRDF。论文中提到 M 只需要 4 个参数便能够拟合出 BRDF（注意，最新的代码作者已经不是用 4 个参数而是 3 个参数来做拟合，这里我还是引用原文的 4 个参数）。

用 4 个参数，M 可以表示为：

$M = \left [ \begin{array}{1} a &0 &b \\ 0 &c &0 \\ d &0 &1 \end{array} \right ]$

我们设定了粗糙度α和入射光角度θ便能得到 GGX 的近似效果：

![[f5d290253412a6e2832201fcf3004d50_MD5.jpg]]

这里可能会产生一个疑问，θv 应该是出射光才对，为何论文说是入射光？由于 BRDF 是双向的，也就是说，出射光和入射光交换可以得到同一个效果，我在实时 shading 的时候，入射光作为出射光的方向来查询能得到相同的效果。

到现在我们可以知道，我们需要的是两个参数α和θv，查询 abcd 四个值，所以查询表可以用一张 2D 纹理来存储数据。

然而，如何计算出矩阵 M 的 abcd 四个参数，论文并没提及，幸好作者开源，详细的预计算过程只能自己阅读源码。

下面是我根据源码，总结出的计算思路。

1.  估算 brdf 在出射光方向为θ，粗糙度为α时的 reflectance 和对应的入射光方向，reflectance 这个概念参考 pbr-book 8.1 节，采样的入射光的反射率除以 reflectance 做一个概率密度用。
2.  计算 LTC 拟合 brdf 的矩阵 M（，由于 LTC 是近似在θ和α下的 brdf 的 reflectance，那么这个近似必然存在误差值，为了使误差值最小，源码作者使用了一种叫 downhill simplex method 的方法去计算矩阵 M 的四个参数。
3.  downhill simplex method 算法需要做第一次猜测，然后迭代求使得误差值最小。第一次猜测用的是 brdf 估计出来的入射光方向做矩阵旋转，每一次迭代用当前的矩阵 M，通过重要性采样 brdf 和 LTC 做误差，利用蒙特卡洛积分求出总的误差值。
4.  上面提到了重要性采样求误差值，在源码中实际就是要采样某个入射光的贡献值，而 LTC 的采样就利用到公式 **(1)** 去求得重要性采样出来的入射方向 L 的反射率，再和近似的 BRDF 的 L 方向的反射率做一个差值进行误差比较。

所以论文说了很多但并没有把公式 **(1)** 的应用写出来，而是在作者的源码中得到了体现。

我把源码输出的数据导入到 unity 的一张 64 x 64 的 RGBAHalf 纹理里：

![[72311d089c8b68b7d85327e1ca41864a_MD5.jpg]]

## 实时着色

理解清楚了 LTC 的特点后，实时着色就相对比较简单了。我们已经离线生成了构建矩阵 M 的纹理，那么根据 View 向量的 Zenith Angle 和着色表面的粗糙度，查询出对应的 M 矩阵的参数，并构建出 M 的逆矩阵。

```
float theta = acos(dot(N, V));
half2 uv = half2(_Roughness, theta / (0.5 * UNITY_PI));
uv = uv * LUT_SCALE + LUT_BIAS;

half4 t1 = tex2D(ltc_mat, uv);

float3x3 Minv = float3x3(
    float3(t1.x, 0, t1.z),
    float3(0, 1, 0),
    float3(t1.y, 0, t1.w)
    );
```

M 的逆矩阵是为了让 LTC 变换回 Do 的 cosine 分布做多边形的积分求出 irradiance。

下面是矩形面积光的 irradiance 计算：

```
// construct orthonormal basis around N
half3 T1, T2;
T1 = normalize(V - N * dot(V, N));
T2 = cross(N, T1);

// rotate area light in (T1, T2, N) basis
// 矩阵要变换到T1 T2 N的坐标系，应该是以它们作为基的逆矩阵，这里和源码不一样，
// 因为hlsl中的float3x3中的向量是行向量，所以构建出来的就是T1 T2 N的逆矩阵。
Minv = mul(Minv, float3x3(T1, T2, N));

half3 L[5];
L[0] = mul(Minv, points[0].xyz - P);
L[1] = mul(Minv, points[1].xyz - P);
L[2] = mul(Minv, points[2].xyz - P);
L[3] = mul(Minv, points[3].xyz - P);
L[4] = L[0];

int n = 4;
//下面这个是计算多少个顶点在平面下面，一般不需要做
//ClipQuadToHorizon(L, n);

if (n == 0)
    return half3(0, 0, 0);

// project onto sphere
L[0] = normalize(L[0]);
L[1] = normalize(L[1]);
L[2] = normalize(L[2]);
L[3] = normalize(L[3]);
L[4] = normalize(L[4]);

// integrate
float sum = 0.0;

sum += IntegrateEdge(L[0], L[1]);
sum += IntegrateEdge(L[1], L[2]);
sum += IntegrateEdge(L[2], L[3]);
if (n >= 4)
    sum += IntegrateEdge(L[3], L[4]);
if (n == 5)
    sum += IntegrateEdge(L[4], L[0]);

sum = twoSided ? abs(sum) : max(0.0, sum);

half3 Lo_i = half3(sum, sum, sum);
```

至于多边形在半球上的 irradiance 积分，可以参考文章 [Geometric Derivation of the Irradiance of Polygonal Lights](https://hal.archives-ouvertes.fr/hal-01458129)。

根据这个算法，矩形的顶点顺序需要逆时针或顺时针传递到 shader 里。

```
void UpdateRectPoints() {
        float halfX = transform.localScale.x * 0.5f;
        float halfY = transform.localScale.y * 0.5f;
        rectPointsInWorld[0] = transform.position - transform.right * halfX
            - transform.up * halfY;

        rectPointsInWorld[1] = transform.position + transform.right * halfX
            - transform.up * halfY;

        rectPointsInWorld[2] = transform.position + transform.right * halfX
            + transform.up * halfY;

        rectPointsInWorld[3] = transform.position - transform.right * halfX
            + transform.up * halfY;

        Shader.SetGlobalVectorArray("_RectPoints", rectPointsInWorld);
}
```

最后的效果图：

![[96e31d0c04f606811050e1f7a59c84cb_MD5.jpg]]

还有矩形纹理面光源没来得及看，未来搞清楚再补充到文章里。

## 原论文地址

[https://hal.archives-ouvertes.fr/hal-02155101/document](https://hal.archives-ouvertes.fr/hal-02155101/document)