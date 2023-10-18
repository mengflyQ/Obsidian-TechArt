---
title: 4 PBR推导
aliases: []
tags: []
create_time: 2023-07-10 14:10
uid: 202307101410
banner: "[[Pasted image 20230710141009.png]]"
---

#  3 公式推导

## 3.3  Cook-Torrance BRDF 推导

本节参考了[基于物理着色：BRDF](https://zhuanlan.zhihu.com/p/21376124) 的公式推导部分。

假设有一束光照射到微表面上，入射光方向 $\omega_i$，视线方向 $\omega_o$，对反射到 $\omega_o$ 方向的反射光有贡献的微表面法线为半角向量 $\omega_h$，则这束光的微分通量是：

$$d \Phi_h = L_i(\omega_i) d \omega_i dA^{\bot}(\omega_h) = L_i(\omega_i) d \omega_i cos \theta_h dA(\omega_h)$$

其中 $dA(\omega_h)$ 是法线为半角向量 $\omega_h$ 的微分微表面面积，$dA^{\bot}(\omega_h)$ 为 $dA(\omega_h)$ 在入射光线方向的投影，$\theta_h$ 为入射光线 $\omega_i$ 和微表面法线 $\omega_h$ 的夹角。

Torrance-Sparrow 将微分微表面面积 $dA(\omega_h)$ 定义为 $dA(\omega_h) = D(\omega_h) d \omega_h dA$，Torrance-Sparrow 将前两项解释为单位面积微平面中朝向为 $\omega_h$ 的微分面积。

要从一组微表面面积 dA 中得到朝向为 $\omega_h$ 的微表面面积 $dA(\omega_h)$，只需要将 $D(\omega_h)$ 定义为 $dA$ 中朝向为 $\omega_h$ 的比例，取值范围在 $[0, 1]$ 就可以了。这里引入 $d \omega_h$ 的实际用途稍后再讨论。

由上两式可得：

$$d \Phi_h = L_i(\omega_i) d \omega_i cos \theta_h D(\omega_h) d \omega_h dA$$

设定微表面反射光线遵循菲涅尔定理，则反射通量：

$$d \Phi_o = F_r(\omega_o) d \Phi_h$$

由上两式可得反射辐射率：

$$dL_o(\omega_o) = \frac{d \Phi_o}{d \omega_o cos \theta_o dA} = \frac{F_r(\omega_o) L_i(\omega_i) d \omega_i cos \theta_h D(\omega_h) d \omega_h dA}{d \omega_o cos \theta_o dA}$$

由 BRDF 的定义可得：

$$f_r(\omega_i, \omega_o) = \frac{d L_o(\omega_o)}{d E_i(\omega_i)} = \frac{d L_o(\omega_o)}{L_i(\omega_i) cos \theta_i d \omega_i} = \frac{F_r(\omega_o) cos \theta_h D(\omega_h) d \omega_h}{cos \theta_o cos \theta_i d \omega_o}$$

这里需要特别强调几个夹角：

*   $\theta_h$ 是入射光线 $\omega_i$ 与朝向为 $\omega_h$ 的微表面法线的夹角
*   $\theta_i$ 是入射光线 $\omega_i$ 与宏观表面法线的夹角
*   $\theta_o$ 是反射光线 $\omega_o$ 与宏观表面法线的夹角

回到反射方程：

$$L_o(v) = \int_{\Omega }^{} f(l, v) \otimes L_i(l) cos \theta_i d\omega_i$$

它是对 $d \omega_i$ 积分，而上式分母包含 $d \omega_o$，可以通过找到 $\frac{d \omega_h}{d \omega_o}$ 的关系，把 $d \omega_o$ 消掉。塞入 $d \omega_h$ 并不会影响方程的合理性，因为 $D(\omega_h)$ 是可以调整的，现在 $D(\omega_h)$ 是一个有单位的量，单位为 $1/sr$。

继续 $d\omega_h$ 和 $d\omega_o$ 关系的推导：

![[1679148483497.png]]

如上图，入射光线照射到一个微表面上，与微表面的单位上半球相交于点 $I$，与微表面相交于点 $O$，反射光线与单位上半球相交于点 $R$，反射光束立体角 $d \omega_o$（图中是 $d \omega_r$）等于光束与单位上半球相交区域面积 $dA_r$，法线立体角 $d \omega_h$（图中是 $d \omega^\prime$）等于法线立体角与单位上半球相交区域面积 $dA^\prime$，因此求 $\frac{d \omega_h}{d \omega_o}$ 等价于求 $\frac{dA^\prime}{dA_r}$。

连线 $IR$ 与法线 $n^\prime$ 相交于点 $P$，则 $IR = 2IP$，由于 $dA_r$ 与 $dA^{\prime \prime \prime}$ 半径的比值等于 $\frac{IR}{IP}$，而面积为 $\pi r^2$，与半径的平方成正比，所以 $dA_r = 4 dA^{\prime \prime \prime}$

连线 $OQ$ 长度为 1，$OP$ 长度为 $cos \theta_i ^ \prime$，所以

$$\frac{dA^{\prime \prime}}{dA^{\prime \prime \prime}} = \frac{1}{cos ^ 2 \theta_i ^ \prime}$$

而 $dA^{\prime \prime} = \frac{dA^{\prime}}{cos \theta_i^{\prime}}$

由以上几式可得 $\frac{dA^\prime}{dA_r} = \frac{1}{4 cos \theta_i ^ \prime}$

需要注意的是，上图中的 $\theta_i ^ \prime$ 实际上是微表面的半角 $\theta_h$，所以 $\frac{d \omega_h}{d \omega_o} = \frac{1}{4 cos \theta_h}$

因此

$$f_r(\omega_i, \omega_o) = \frac{F_r(\omega_o) D(\omega_h)}{4 cos \theta_o cos \theta_i}$$

前面讲到过并非所有朝向为 $\omega_h$ 的微表面都能接受到光照（Shadowing），也并非所有反射光照都能到达观察者（Masking），考虑几何衰减因子 G 的影响，最终得出 Cook-Torrance 公式：

$$f_r(\omega_i, \omega_o) = \frac{F_r(\omega_o) D(\omega_h) G(\omega_i, \omega_o)}{4 cos \theta_o cos \theta_i}$$

## 3.4 预计算技术

在第三章阐述 PBR 的 Cook-Torrance 原理和实现的时候，提及过很多预渲染技术，诸如：Cubemap、HDR 环境光等。本章节主要是讲解这些预计算或预卷积的技术，为将耗时的部分提前渲染，以便减轻实时光照时的渲染消耗。

### 立方体图卷积（Cubemap convolution）

立方体图卷积是以离线的方式预先为场景的辐照度求解所有漫反射间接光照的积分。为了解决积分问题，必须对每个片元在半球 $\Omega$ 内的所有可能方向对场景的辐射进行采样。

然而，代码实现上不可能在半球 $\Omega$ 从每个可能的方向采样环境的照明，可能的方向数量在理论上是无限的。但可以通过采用有限数量的方向或样本来近似方向的数量，均匀间隔或从半球内随机取得，以获得相当精确的辐照度近似，从而有效地用离散的方法求解积分 $\int$。

即便采用离散的近似方法，对于每个片元实时执行此操作仍然太昂贵，因为样本数量仍然需要非常大才能获得不错的结果，因此通常采用预计算解决实时的消耗问题。由于半球 $\Omega$ 的朝向决定所需捕获辐照度的位置，可以预先计算每个可能的半球方向的辐照度，所有采样的半球环绕着所有传出的方向 $w_o$：

$$L_o(p,\omega_o) = k_d\frac{c}{\pi} \int\limits_{\Omega} L_i(p,\omega_i) n \cdot \omega_i d\omega_i$$

给定任意方向向量 $w_i$ 后，就可以预计算的辐照度图进行采样。为了确定小块表面的间接漫射（辐照）光的数量，可以从半球的整个辐照度中采样出围绕其表面法线的总辐照度。取得场景的辐照度的代码很简单：

```
vec3 irradiance = texture(irradianceMap, N);
```

为了生成辐照度图，需要将环境的光照卷积转换为立方体图。鉴于对于每个片段，表面的半球沿着法向量定向 $N$，对立方体图进行卷积等于计算沿着法线 $N$ 的半球 $\Omega$ 内的每个方向的总平均辐射度 $w_i$。

![[1679148483521.png]]

[[#3.3.1.2 从球体图到立方体图|3.3.1.2 从球体图到立方体图]] 描述了如何从球体图转换成立方体贴图，这样就可以直接获取转换后的立方体贴图，以便在片段着色器中对其进行卷积，并使用朝向所有 6 个面部方向呈现的帧缓冲区将其计算结果放到新的立方体贴图中。由于已经描述了将球体图转换为立方体图，可以采用类似的方法和代码：

```
#version 330 core
out vec4 FragColor;
in vec3 localPos;

uniform samplerCube environmentMap;

const float PI = 3.14159265359;

void main()
{		
    // the sample direction equals the hemisphere's orientation 
    vec3 normal = normalize(localPos);
  
    vec3 irradiance = vec3(0.0);
  
    [...] // convolution code
  
    FragColor = vec4(irradiance, 1.0);
}
```

用 `environmentMap` 从球体 HDR 环境图转换到 HDR 立方体图。

卷积环境贴图有很多种方法，此处将为半球上的每个立方体贴图像素生成固定数量的样本方向向量围绕半球 $\Omega$ 并平均结果。固定量的样本向量将均匀地分布在半球内部。注意，积分是连续函数，并且在给定固定量的样本向量的情况下离散地采样积分函数只是近似值。如果使用的样本向量越多，就越接近积分实际值，但同时预计算过程越慢。

围绕着立体角 $dw$ 的反射方程的积分 $\int$ 很难处理，所以用其等效的球面坐标 $\theta$ 和 $\phi$。

![[1679148483542.png]]

我们使用极面方位角 $\phi$ 在半球环之间采样，其角度范围是 $0$ 和 $2\pi$，并使用仰角 $\theta$，其角度范围是 $0$ 和 $\frac{1}{2}\pi$，这样可方便地对半球进行采样。采用球面角度后的反射公式：

$$L_o(p,\phi_o, \theta_o) = k_d\frac{c}{\pi} \int_{\phi = 0}^{2\pi} \int_{\theta = 0}^{\frac{1}{2}\pi} L_i(p,\phi_i, \theta_i) \cos(\theta) \sin(\theta) d\phi d\theta$$

用黎曼和的方法以及给定的 $n_1$、$n_2$ 球面坐标采样数量，可将积分转换为以下离散版本：

$$L_o(p,\phi_o, \theta_o) = k_d\frac{c}{\pi} \frac{1}{n_1 n_2} \sum_{\phi = 0}^{n_1} \sum_{\theta = 0}^{n_2} L_i(p,\phi_i, \theta_i) \cos(\theta) \sin(\theta) d\phi d\theta$$

当离散地对两个球面值进行采样时，仰角越高 $\theta$，面积越小，如上图所示。如果不对面积差进行处理，就会出现累积误差。为了弥补较小的区域，可以增加额外的 $\sin$ 值来缩放 $\sin \theta$ 的权重。

给定每个片段调用的积分球面坐标对半球进行离散采样转换为以下代码：

```
vec3 irradiance = vec3(0.0);  

vec3 up    = vec3(0.0, 1.0, 0.0);
vec3 right = cross(up, normal);
up         = cross(normal, right);

float sampleDelta = 0.025;
float nrSamples = 0.0; 
for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
{
    for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
    {
        // spherical to cartesian (in tangent space)
        vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
        // tangent space to world
        vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * normal;

        irradiance += texture(environmentMap, sampleVec).rgb * cos(theta) * sin(theta);
        nrSamples++;
    }
}
irradiance = PI * irradiance * (1.0 / float(nrSamples));
```

通过指定一个固定的 `sampleDelta` 值来遍历半球，减小或增加样本增量将分别增加或减少准确度。

在两个 `for` 循环内，采用球面坐标将它们转换为 3D 笛卡尔样本向量，将样本从切线空间转换为世界空间，并使用此样本向量直接对 HDR 环境贴图进行采样。循环的最后将每个样本结果添加到 `irradiance`，并除以采样的总数，得到平均采样辐照度。请注意，缩放采样的颜色值是 `cos(theta)`，因为光线在较大的角度处较弱，并且 `sin(theta)` 是为了弥补较高仰角的半球区域中面积较小的样本区域。

### 预过滤 HDR 环境图（Pre-filtering HDR environment map）

预过滤环境图与预卷积辐照图非常相似。不同之处在于，需要考虑粗糙度并在预过滤环境图的不同 mip 级别中按顺序地存储更粗糙的反射。

通过使用球面坐标生成均匀分布在半球 $\Omega$ 上的样本向量来对环境贴图进行复杂处理的方法，虽然这个方法适用于辐照度，但对于镜面反射效果较差。当涉及镜面反射时，基于表面的粗糙度，光在通过法线 $n$ 附近的反射就越粗糙，范围越大：

![[1679148483587.png]]

光线反射后所有可能的出射光形成的形状被称为**镜面波瓣**。随着粗糙度的增加，镜面波瓣的大小增加; 并且镜面波瓣的形状在变化的入射光方向上变化。因此，镜面波瓣高度取决于材质。

当谈到微表面模型时，可以将镜面波瓣想象为给定一些入射光方向的微平面中间向量的反射方向。当看到的大多数光线最终反射在微平面中间矢量周围的镜面波瓣中，这样的方法生成的样本向量才是有意义的，这个处理过程就是**重要性采样（Importance sampling）**。

#### 蒙特卡洛（Monte Carlo）积分和重要性采样（Importance sampling）

为了充分掌握重要性采样的重要性，需要先深入研究已知的数学方法：蒙特卡洛积分。

**蒙特卡洛积分**主要围绕着统计和概率理论的组合。它帮我们离散地解决了一个群体统计或重要性的问题，而不必考虑**所有**群体。

例如，假设想要计算一个国家所有公民的平均身高。为了得到结果，可以测量**每个**公民并平均他们的身高，这将提供确切 ** 的答案。但是，由于大多数国家人口众多，这不是一个现实的方法：需要花费太多的精力和时间。

另一种方法是选择一个小得多的**完全随机**（无偏差）的人口子集，测量他们的身高并平均结果。这个人口可能只有 100 人。虽然不如确切的答案准确，但也会得到一个相对接近真相的答案，它被称为**大数定律（Law of large numbers）**。这个方法是，如果测量一个较小数量的子集 $N$，它从总人口中得到真正随机的样本，结果将与真实答案相对接近，并且随着样本数量 $N$ 的增加而变得更接近实际结果。

蒙特卡罗积分建立在这个大数定律的基础上，并采用相同的方法来求解积分。从总人口和平均值中随机抽取的方式简单地生成样本值 $N$，而不是为所有可能的（理论上无限的）样本值 $x$ 求解积分。如 $N$ 增加得到的结果更接近积分的确切答案：

$$O = \int\limits_{a}^{b} f(x) dx = \frac{1}{N} \sum_{i=0}^{N-1} \frac{f(x)}{pdf(x)}$$

为了解决积分，我们采取用 $N$ 从人口 $a$ 到 $b$ 中随机抽样，将它们加在一起并除以样本总数以平均它们。该 $pdf$ 代表着概率密度函数（Probability density function），它表明特定样本在整个样本集上发生的概率。例如，人口高度的 $pdf$ 看起来有点像这样：

![[1679148483630.png]]

从该图中可以看出，如果我们采用任意随机样本的人口，那么挑选高度为 1.70 的人的样本的可能性更高，而样本高度为 1.50 的概率较低。

当涉及蒙特卡罗积分时，一些样本可能比其他样本具有更高的生成概率。这就是为什么对于任何一般的蒙特卡罗估计，我们根据 $pdf$ 将采样值除以采样概率。到目前为止，在估算积分的每个例子中，生成的样本是均匀的，具有完全相同的生成几率。到目前为止我们的估计是不偏不倚，这意味着，鉴于样本数量不断增加，我们最终将会收敛到积分的**精确**解。

但是，蒙特卡罗的一些样本是有偏倚的，意味着生成的样本不是完全随机的，而是聚焦于特定的值或方向。这些有偏倚的蒙特卡罗估计有一个更快的收敛速度，这意味着它们可以以更快的速度收敛到精确值。但是，由于此方法的偏向性质，它们可能永远不会收敛到精确值。这通常是可接受的平衡，特别是在计算机图形学中，因为只要结果在视觉上可接受，精确的解决方案就不太重要。正如我们很快就会看到重要性采样（使用偏置估计器）所生成的样本偏向于特定方向，在这种情况下，我们通过将每个样本乘以或除以其对应的 $pdf$ 来达到这一点。

蒙特卡罗积分在计算机图形学中非常普遍，因为它是以离散和有效的方式近似连续积分的一种相当直观的方式：取任何面积或体积进行采样（如半球 $\Omega$），生成 $N$ 区域 / 体积内的随机样本量和总和，并权衡每个样本对最终结果的权重。

蒙特卡洛积分是一个广泛的数学主题，这里不会深入研究具体细节，但会提到有多种方法可以生成**随机样本**。默认情况下，每个样本都是完全随机（伪随机）的，因为我们习惯了，但是通过利用半随机序列的某些属性，我们可以生成仍然是随机的但具有有趣属性的样本向量。例如，我们可以用**低差异序列（Low-discrepancy sequences）**对蒙特卡洛进行积分，以生成随机样本，且每个样本分布更均匀：

![[1679148483730.png]]

_图左：完全伪随机序列生成的采用点；图右：低差异序列生成的采样点。可以看出右边的更均匀。_

当使用低差异序列生成蒙特卡罗样本向量时，该过程称为**准蒙特卡罗积分（Quasi-Monte Carlo integration）**。准蒙特卡罗方法有更快的收敛速度，这使它们对性能繁重的应用程序感兴趣。

鉴于新获得的蒙特卡罗和准蒙特卡罗积分的知识，我们可以使用一个有趣的属性来实现更快的收敛速度，它就是**重要性采样（ Importance sampling）**。当涉及光的镜面反射时，反射光向量被约束在镜面波瓣中，其尺寸由表面的粗糙度决定。看到镜面外的任何（准）随机生成的样本与镜面积分无关，将样本生成集中在镜面波瓣内是有意义的，代价是蒙特卡罗估计有偏差。

重要性采样是这样的：在一些区域内生成样本向量，该区域受到围绕微平面中间向量的粗糙度的约束。通过将准蒙特卡罗采样与低差异序列相结合并使用重要性采样偏置采样向量，可以获得高收敛率。因为以更快的速度到达解决方案，所以只需要更少的样本来达到足够的近似值。因此，该组合甚至允许图形应用程序实时解决镜面反射积分，尽管它仍然比预先计算结果慢得多。

#### 低差异序列（Low-discrepancy sequence）

这里，将通过基于准蒙特卡罗方法的随机低差异序列，使用重要性采样预先计算间接反射方程的镜面反射部分。本小节使用的序列称为**哈默斯利序列（Hammersley Sequence）**。哈默斯利序列序列基于**范德科皮特（Van Der Corpus）序列**，它将以基数 $b$ 表示的自然数列反转可得结果。

鉴于一些巧妙的技巧，我们可以非常有效地产生，我们将用它来获得一个序列哈默斯利样品着色器程序范德语料库序列，`N` 是总样本：

```
// 反转的范德科皮特序列
float RadicalInverse_VdC(uint bits) 
{
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}
// ----------------------------------------------------------------------------
// 哈默斯利序列
vec2 Hammersley(uint i, uint N)
{
    return vec2(float(i)/float(N), RadicalInverse_VdC(i));
}
```

GLSL 代码 `Hammersley` 函数给出了总样本集为 $N$ 的低差异样本 $i$。

并非所有与 OpenGL 的驱动程序都支持位运算符（例如 WebGL 和 OpenGL ES 2.0），在这种情况下，我们可能希望使用不依赖于位运算符的替代版 Van Der Corpus Sequence：

```
float VanDerCorpus(uint n, uint base)
{
    float invBase = 1.0 / float(base);
    float denom   = 1.0;
    float result  = 0.0;

    for(uint i = 0u; i < 32u; ++i)
    {
        if(n > 0u)
        {
            denom   = mod(float(n), 2.0);
            result += denom * invBase;
            invBase = invBase / 2.0;
            n       = uint(float(n) / 2.0);
        }
    }

    return result;
}
// ----------------------------------------------------------------------------
vec2 HammersleyNoBitOps(uint i, uint N)
{
    return vec2(float(i)/float(N), VanDerCorpus(i, 2u));
}
```

请注意，由于旧硬件中的 GLSL 循环限制，序列会循环遍历 `32` 位能表示的所有数。这个版本性能较差，但可以在所有硬件上运行。

值得一提的是，生成低差异序列的方法还有很多：

*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Random_numbers]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Additive_recurrence]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#van_der_Corput_sequence]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Halton_sequence]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Hammersley_set]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Sobol_sequence]]
*   [[https://en.wikipedia.org/wiki/Low-discrepancy_sequence#Poisson_disk_sampling]]

详细请参看 [Low-discrepancy sequence](https://en.wikipedia.org/wiki/Low-discrepancy_sequence)。

#### GGX 重要性采样（GGX Importance sampling）

我们将基于表面粗糙度生成偏向于微表面中间矢量的一般反射方向的样本矢量来取代统一或随机（蒙特卡罗）地在积分半球 $\Omega$ 上生成样本向量。采样过程将类似于之前的过程：开始一个大循环，生成一个随机（低差异）序列值，取序列值在切线空间中生成一个样本向量，转换到世界空间并采样场景的辐射。不同的是，我们现在使用低差异序列值作为输入来生成样本向量：

```
const uint SAMPLE_COUNT = 4096u;
for(uint i = 0u; i < SAMPLE_COUNT; ++i)
{
	// 使用Hammersley序列
    vec2 Xi = Hammersley(i, SAMPLE_COUNT);
```

另外，为了构建样本向量，我们需要一些方法来定向和偏置原本朝向某些表面粗糙度的镜面波瓣的样本向量。我们可以按照章节 [[#3.1.4 双向反射分布函数（BRDF）|3.1.4 双向反射分布函数（BRDF）]] 中的描述获取 NDF ，并将 GGX NDF 结合在 Epic Games 所描述的那样球形采样向量：

```
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness*roughness;
	
    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
	
    // from spherical coordinates to cartesian coordinates
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;
	
    // from tangent-space vector to world-space sample vector
    vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);
	
    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}
```

这给了我们一个样本向量，它基于一些输入粗糙度和低差异序列值 $X_i$，并且在预期的微表面中间向量的周围。请注意，根据迪斯尼原则的 PBR 研究，Epic Games 使用平方粗糙度来获得更好的视觉效果。

用低差异序列的 Hammersley 序列和样本生成为我们提供了最终确定预过滤卷积着色器：

```
#version 330 core
out vec4 FragColor;
in vec3 localPos;

uniform samplerCube environmentMap;
uniform float roughness;

const float PI = 3.14159265359;

float RadicalInverse_VdC(uint bits);
vec2 Hammersley(uint i, uint N);
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness);
  
void main()
{		
    vec3 N = normalize(localPos); 
    vec3 R = N;
    vec3 V = R;

    const uint SAMPLE_COUNT = 1024u;
    float totalWeight = 0.0; 
    vec3 prefilteredColor = vec3(0.0); 
    for(uint i = 0u; i < SAMPLE_COUNT; ++i)
    {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H  = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L  = normalize (2.0 * dot (V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0)
        {
            prefilteredColor += texture(environmentMap, L).rgb * NdotL;
            totalWeight      += NdotL;
        }
    }
    prefilteredColor = prefilteredColor / totalWeight;

    FragColor = vec4(prefilteredColor, 1.0);
}
```

根据输入的粗糙度预先过滤环境，这些粗糙度在预过滤器立方体贴图的每个 mipmap 级别（从 `0.0` 到 `1.0`）中变化，并将结果存储在 `prefilteredColor` 中。得到的预过滤颜色除以总样品权重，其中对最终结果影响较小的样品（对于小 NdotL）对最终重量的权重较小。

#### 预过滤卷积瑕疵

虽然上述的预过滤图在大多数情况下都能正常，但总会遇到一些瑕疵。下面列出最常见的，包括如何解决它们。

*   **Cubemap 高粗糙度的接缝**

在具有粗糙表面的表面上对预滤镜图进行采样意味着在其一些较低的 mip 级别上对预滤镜图进行采样。对立方体贴图进行采样时，默认情况下，OpenGL 不会在立方体贴图面上进行线性插值。由于较低的 mip 级别都具有较低的分辨率，并且预滤波器映射与较大的样本波瓣进行了卷积，因此立方体面之间的滤波的瑕疵变得非常明显：

![[1679148483753.png]]

幸运的是，OpenGL 为我们提供了通过启用 GL_TEXTURE_CUBE_MAP_SEAMLESS 来正确过滤立方体贴图面的选项：

```
glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS);
```

只需在应用程序启动时的某个位置启用此属性，接缝就会消失。

*   **预过滤卷积中的亮点**

由于镜面反射中的高频细节和剧烈变化的光强度，使镜面反射卷积需要大量样本以适当地解析 HDR 环境反射的广泛变化的性质。我们已经采集了大量样本，但在某些环境中，在某些较粗糙的 mip 级别上可能仍然不够，在这种情况下，将开始看到明亮区域周围出现点状图案：

![[1679148484012.png]]

一种选择是进一步增加样本数，但这对所有环境都还不足够。可以通过（在预过滤卷积期间）不直接对环境贴图进行采样来减少这种伪影，而是基于积分的 PDF 和粗糙度对环境贴图的 mip 级别进行采样：

```
float D   = DistributionGGX(NdotH, roughness);
float pdf = (D * NdotH / (4.0 * HdotV)) + 0.0001; 

float resolution = 512.0; // resolution of source cubemap (per face)
float saTexel  = 4.0 * PI / (6.0 * resolution * resolution);
float saSample = 1.0 / (float(SAMPLE_COUNT) * pdf + 0.0001);

float mipLevel = roughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel);
```

不要忘记在环境贴图上启用三线性过滤，以便从以下位置对其 mip 级别进行采样：

```
glBindTexture(GL_TEXTURE_CUBE_MAP, envCubemap);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
```

然后让 OpenGL 在设置立方体贴图的基本纹理后生成 mipmap ：

```
// convert HDR equirectangular environment map to cubemap equivalent
[...]
// then generate mipmaps
glBindTexture(GL_TEXTURE_CUBE_MAP, envCubemap);
glGenerateMipmap(GL_TEXTURE_CUBE_MAP);
```

这种效果非常好，并且可以在粗糙表面上的预过滤图中删除大多数点。

####  预计算 BRDF

在预过滤环境启动和运行的情况下，我们可以关注分裂和近似的第二部分：BRDF。让我们再次简要回顾一下镜面分裂和近似：

$$L_o(p,\omega_o) = \int\limits_{\Omega} L_i(p,\omega_i) d\omega_i * \int\limits_{\Omega} f_r(p, \omega_i, \omega_o) n \cdot \omega_i d\omega_i$$

我们已经在不同粗糙度级别的预过滤图中预先计算了分裂和近似的左侧部分。右侧要求我们在角度上收集 BRDF 方程 $n \cdot \omega_o$、表面粗糙度和菲涅耳的 $F_0$。这类似于将镜面 BRDF 与纯白环境或 `1.0` 的恒定辐射 $L_i$ 进行积分。将 BRDF 压缩为 3 个变量有点多，但我们可以将 $F_0$ 移出镜面 BRDF 方程式：

$$\int\limits_{\Omega} f_r(p, \omega_i, \omega_o) n \cdot \omega_i d\omega_i = \int\limits_{\Omega} f_r(p, \omega_i, \omega_o) \frac{F(\omega_o, h)}{F(\omega_o, h)} n \cdot \omega_i d\omega_i$$

$F$ 是菲涅耳方程。将菲涅耳分母移动到 BRDF 给出了以下等效方程：

$$\int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} F(\omega_o, h) n \cdot \omega_i d\omega_i$$

用 Fresnel-Schlick 近似法代替最右边的 $F$ 可得到：

$$\int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (F_0 + (1 - F_0){(1 - \omega_o \cdot h)}^5) n \cdot \omega_i d\omega_i$$

再进一步地，用 $\alpha$ 替换 ${(1 - \omega_o \cdot h)}^5$，将更容易解决 $F_0$：

$$\begin{eqnarray*} &&\int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (F_0 + (1 - F_0)\alpha) n \cdot \omega_i d\omega_i \\ &=& \int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (F_0 + 1*\alpha - F_0*\alpha) n \cdot \omega_i d\omega_i \\ &=& \int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (F_0 * (1 - \alpha) + \alpha) n \cdot \omega_i d\omega_i \end{eqnarray*}$$

然后拆分菲涅耳函数 $F$ 成两个积分：

$$\int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (F_0 * (1 - \alpha)) n \cdot \omega_i d\omega_i + \int\limits_{\Omega} \frac{f_r(p, \omega_i, \omega_o)}{F(\omega_o, h)} (\alpha) n \cdot \omega_i d\omega_i$$

由于 $F_0$ 是常量，可以从积分号内移出。接下来，我们替换 $\alpha$ 回原来的形式，得到最终的 BRDF 方程：

$$F_0 \int\limits_{\Omega} f_r(p, \omega_i, \omega_o)(1 - {(1 - \omega_o \cdot h)}^5) n \cdot \omega_i d\omega_i + \int\limits_{\Omega} f_r(p, \omega_i, \omega_o) {(1 - \omega_o \cdot h)}^5 n \cdot \omega_i d\omega_i$$

两个得到的积分分别代表了 $F_0$ 的缩放和偏移。请注意，作为 $f(p, \omega_i, \omega_o)$ 已包含一个 $F$ 项，所以 $F$ 项都从 f$ 中删除了！

以类似于早期卷积环境图的方式，我们可以在其输入上卷积 BRDF 方程：$n$ 和 $\omega_o$ 之间的角度和粗糙度，并将卷积的结果存储在 2D 查找纹理（LUT）中。

BRDF 卷积着色器在 2D 平面上运行，使用其 2D 纹理坐标直接作为 BRDF 卷积的输入（`NdotV` 和 `roughness`）。卷积代码很大程度上类似于预过滤卷积，不同之处在于它现在根据我们的 BRDF 几何函数和 Fresnel-Schlick 的近似值处理样本向量：

```
vec2 IntegrateBRDF(float NdotV, float roughness)
{
    vec3 V;
    V.x = sqrt(1.0 - NdotV*NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    const uint SAMPLE_COUNT = 1024u;
    for(uint i = 0u; i < SAMPLE_COUNT; ++i)
    {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H  = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L  = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);

        if(NdotL > 0.0)
        {
            float G = GeometrySmith(N, V, L, roughness);
            float G_Vis = (G * VdotH) / (NdotH * NdotV);
            float Fc = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }
    A /= float(SAMPLE_COUNT);
    B /= float(SAMPLE_COUNT);
    return vec2(A, B);
}
// ----------------------------------------------------------------------------
void main() 
{
    vec2 integratedBRDF = IntegrateBRDF(TexCoords.x, TexCoords.y);
    FragColor = integratedBRDF;
}
```

从上面可看到，BRDF 卷积是从数学到代码的直接转换。采取角度 $\theta$ 和粗糙度作为输入，生成具有重要性采样的样本向量，在几何体上处理它并且导出 BRDF 的菲涅耳项，并输出对于每个样本的 $F_0$ 的缩放和偏移，最后将它们平均化。

当与 IBL 一起使用时，BRDF 的几何项略有不同，亦即变量 $k$ 的解释略有不同：

$$\begin{eqnarray*} k_{direct} &=& \frac{(\alpha + 1)^2}{8} \\ k_{IBL} &=& \frac{\alpha^2}{2} \end{eqnarray*}$$

由于 BRDF 卷积是我们将使用的镜面 IBL 积分的一部分，所以用 $k_{IBL}$ 作为 Schlick-GGX 几何函数的参数：

```
float GeometrySchlickGGX(float NdotV, float roughness) {
    float a = roughness;
    float k = (a * a) / 2.0; // k_IBL

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
```

分裂和积分卷积的 BRDF 部分渲染结果如下：

![[1679148484034.png]]

利用预滤环境图和 BRDF 2D LUT，我们可以根据分裂和近似计算间接光照镜面部分的积分。然后，组合间接或环境镜面反射光，最终算出 IBL 光照结果。

# Cook-Torrance BRDF 推导

说明一下，不同的文献给出了不同的推导方式，下面给出我认为最简单的 [GDC2017: PBR Diffuse Lighting for GGX+Smith Microsurfaces](https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2017/Presentations/Hammon_Earl_PBR_Diffuse_Lighting.pdf) 中的推导。另外两种推导方式，我会在本节最后给出相应 paper 和参考文章。

由于 Cook-Torrance 模型基于镜面反射，每个微平面都是完美菲涅尔镜，只有反射向量为观察向量时，这个微平面才对接收能量有贡献。因此，我们只考虑 $m=h$ 的情况，将其带入宏观 BRDF 公式：

 $f(l,v)=\int_{h\in\Omega}f_{\mu}(l,v,h)G_{2}(l,v,h)D(h)\frac{(h\cdot l)^{+}}{|n\cdot l|}\frac{(h\cdot v)^{+}}{|n\cdot v|}dh$

我们需要推导出来的式子为：

 $f_{spec}(l,v)=\frac{F(h,l)G_{2}(l,v,h)D(h)}{4|n\cdot l||n\cdot v|}$

所以我们的 **推导目标 1** 为：

，并且搞掉积分  $f_{\mu}(l,v,h)=\frac{F(h,l)}{4(h\cdot l)(h\cdot v)}，并且搞掉积分$

下面正式开始推导。

前面提到，只有当微平面法线 $m$ 等于入射光向量 $l$ 与观察向量的半程向量 $h=\frac{l+v}{||l+v||}$ 时，微表面 brdf 项 $f_{\mu}(l,v,m)\neq 0$ 。将这个描述用数学方程表达出来：

 $f_{\mu}(l,v,m)=\rho k\delta_{m}(h,m)$

其中， $\delta_{m}(h,m)$ 为称为狄拉克 (dirac delta) 的概念函数，它在除了零以外的点函数值都等于零，而其在整个定义域上的积分等于 1。由于我们要把这个函数放在积分里，所以这里这样理解：当 $h=m$ 时， $\delta_{m}(h,m)$ 对积分的贡献为 1，否则为 0。另外一个重要的性质是， $\delta_{m}(h,m)$ 消除积分，并且设置 $m=h$ 。 $\rho$ 是表面对入射光线的反射率 (剧透一下即菲涅尔项)

k 是我们要找到的，将这个函数进行归一化的因子。这里称它为 **推导目标 2**。

将这个带狄拉克的微表面 brdf 方程带入最开始提到的 BRDF 归一化方程：

 $\begin{align} \int_{\Omega}f_{\mu}(l,v,m)(v\cdot m)dv&=1\\ \int_{\Omega}\rho k\delta_{m}(h,m)(v\cdot m)dv&=1 \end{align}$

由于狄拉克函数 $\delta_{m}(h,m)$ 是关于微平面法线 $m$ 的函数，所以我们应该将上式的积分项改为 $dm$ ，即：

 $\int_{\Omega}\rho k\delta_{m}(h,m)(v\cdot m)\frac{dv}{dm}dm=1$

所以我们的 **推导目标 3**，最关键的目标，就是找到 $\frac{dv}{dm}$ 是什么，将它用向量表示出来。

由于狄拉克函数 $\delta_m(h,m)$ 将积分的贡献集中到了 $m=h$ 的评估上，所以我们令 $dm=dh$ 。规定所有向量都定义在单位半球面上，所以向量的微元可以认为是一小段立体角。我们在这个单位球面上找到 $dv$ 和 $dm=dh$ 。

![[7af040bd34482bad06189d8132a80d87_MD5.jpg]]

为了建立 $dm$ 和 $dv$ 的联系 (推导目标 2)，我们将 $dv$ 平移到 $dm$ 延长线上，也就是与 $l+v$ 向量相交，如下图绿线。

![[aded02f52b2122c96aed4a95a839fa07_MD5.jpg]]

接下来，我们需要将 $dv$ 投影到 $l+v$ 所定义的半球面上，使得它与 $dm$ 呈缩放关系。即把上图绿线投影为红线。

 $dv\bot=(h\cdot v)dv$

然后，我们需要将 $dv\bot$ 缩放到单位半球面，缩放因子为单位球面和 $l+v$ 定义球面的立体角比：

 $Scaler=\frac{4\pi\cdot 1^{2}}{4\pi\cdot |l+v|^{2}}=\frac{1}{|l+v|^{2}}$

![[f41738cdc3216db8aca6220fdb17b6ab_MD5.jpg]]

最后，将 $dv\bot$ 进行缩放，得到 $dm$ 。

 $dm=Scaler~dv\bot=\frac{h\cdot v}{|l+v|^{2}}dv$

总结一下我们上述的推导过程：

![[084564ee023db080d1fa1b75d6a90441_MD5.jpg]]

然后，我们对 $|l+v|$ 作进一步展开，**注意向量都是单位向量**：

 $\begin{align} |l+v|&=h\cdot (l+v)\\ &=h\cdot l+h\cdot v\\ &=2h\cdot v \end{align}$

把 $|l+v|=2h\cdot v$ 带入上面推导的 $dm$ 中。

 $\begin{align} dm&=\frac{h\cdot v}{|l+v|^{2}}dv\\ &=\frac{h\cdot v}{4(h\cdot v)^{2}}dv \end{align}$

也就是说，

 $\frac{dv}{dm}=4h\cdot v$

(终于得到分母那个 4 了！)

至此，我们的推导目标 3 完成。

将 $\frac{dv}{dm}=4h\cdot v$ 带入 BRDF 归一化方程：

 $\begin{align} \int_{\Omega}f_{\mu}(l,v,m)(v\cdot m)dv&=1\\ \int_{\Omega}\rho k\delta_{m}(h,m)(v\cdot m)\frac{dv}{dm}dm&=1\\ \int_{\Omega}\rho k\delta_{m}(h,m)(v\cdot m)(4h\cdot v)dm&=1 \end{align}$

由狄拉克函数积分方程：

 $\int\delta(x)dx=1$

且

 $\begin{align} m&=h\\ h\cdot v&=h\cdot l \end{align}$

所以，

 $k=\frac{1}{4(h\cdot l)(h\cdot v)}$

至此，我们的推理目标 2 完成。

把 $k$ 带入微 brdf 定义式：

 $\begin{align} f_{\mu}(l,v,m)&=\rho k\delta_{m}(h,m)\\ &=\rho\frac{\delta_{m}(m,h)}{4(h\cdot l)(h\cdot v)} \end{align}$

其中， $\rho$ 是表面对入射光的反射率，在镜面反射中，它就是菲涅尔项 $F(l,m)$ 。

即

 $f_{\mu}=F(l,m)\frac{\delta_{m}(m,h)}{4(h\cdot l)(h\cdot v)}$

把 $f_{\mu}$ 带入宏观 BRDF 方程：

 $\begin{align} f(l,v)=\int_{h\in\Omega}f_{\mu}(l,v,h)G_{2}(l,v,h)D(h)\frac{(h\cdot l)^{+}}{|n\cdot l|}\frac{(h\cdot v)^{+}}{|n\cdot v|}dh \end{align}$

得到

 $f(l,v)=\int_{h\in{\Omega}}\frac{F(l,h)D(h)G_{2}(l,v,h)}{4|n\cdot l||n\cdot v|}\delta_{m}(m,h)$

至此，推导目标 1 完成。

由狄拉克函数的性质， $\delta_{m}(m,h)$ 将积分贡献集中设置为 $m=h$ ，并且消除积分，最终得到：

 $f_{spec}(l,v)=\frac{F(h,l)G_{2}(l,v,h)D(h)}{4|n\cdot l||n\cdot v|}$

推导完毕。

描述出来可能有点繁琐，但核心还是变量替换，在 [Walter. 的 Paper: Microfacet Models for Refraction through Rough Surfaces](https://jcgt.org/published/0003/02/03/paper.pdf) 中，用的是雅可比式。在 [Eric Heitz 的 Paper: Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs](https://jcgt.org/published/0003/02/03/paper.pdf) 中，用的球面度坐标。

放一下分别解释这两篇推导的文章：

[孙小磊：基于物理的渲染：微平面理论 (Cook-Torrance BRDF 推导)](https://zhuanlan.zhihu.com/p/152226698) [赵航：Cook-Torrance 的光照模型分母公式推导](https://zhuanlan.zhihu.com/p/34417784)

pbrt 中也解释了第二篇 paper 的推导： [Physically Based Rendering 3ed: Microfacet Models](https://www.pbr-book.org/3ed-2018/Reflection_Models/Microfacet_Models)

还是觉得上面这篇 GDC 的推导更人话一点，如果我没解释清楚可以看看 [GDC 的视频报告](https://www.gdcvault.com/play/1033723/PBR-Diffuse-Lighting-for-GGX)。

