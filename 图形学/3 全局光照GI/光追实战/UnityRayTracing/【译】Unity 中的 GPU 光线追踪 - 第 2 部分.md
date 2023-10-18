---
title: 【译】Unity 中的 GPU 光线追踪 - 第 2 部分
aliases: []
tags: []
create_time: 2023-07-12 13:13
uid: 202307121313
banner: "[[Pasted image 20230711183803.jpg]]"
---

【原文】[GPU Path Tracing in Unity – Part 2](http://three-eyed-games.com/2018/05/12/gpu-path-tracing-in-unity-part-2/)


没有什么比一个模糊概念的清晰形象更糟糕的了。——安塞尔 · 亚当斯

在本系列的第一部分中，我们创建了一个 Whitted 光线追踪器，能够追踪完美反射和硬阴影。**目前还缺少模糊效果：漫反射相互反射、光泽反射和柔和阴影。**

基于我们已有的代码，我们将迭代地解决詹姆斯 · 卡吉亚 (James Kajiya) 在 1986 年提出的渲染方程，并将我们的渲染器转换为能够捕捉上述效果的路径追踪器。同样，我们将使用 C# 编写脚本，使用 HLSL 编写着色器。代码托管在 Bitbucket 上。

本文比前一篇文章更具数学性，但请不要担心。我会尽力解释每个公式。这些公式有助于您了解发生了什么以及我们的渲染器为何有效，因此我建议您尝试理解它们，并在评论部分提问，以防有任何不清楚的地方。

下面的图片是使用 HDRI Haven 的 Graffiti Shelter 渲染的。本文中的其他图片是使用 Kiara 9 Dusk 渲染的。

![[9ea254bc4a945b3f2d83c5fc853f6ec4_MD5.jpg]]

## 渲染方程

正式来说，真实感渲染器的任务是求解渲染方程，可以写成如下形式：

$$L(x,\vec{ω}_o)=L_e(x,\vec{ω}_o)+\int_{Ω} f_r(x,\vec{ω}_i,\vec{ω}_o)(\vec{ω}_i\cdot\vec{n})L(x,\vec{ω}_i) d\vec{ω}_i $$

 我们来分解一下。最终我们想确定屏幕上像素的亮度。渲染方程给出了从点 x（射线的击中点）沿方向 $\vec{ω}_ o$ （射线来自的方向）传递的光线 $L(x,\vec{ω}_ o)$ 的数量。表面本身可能是光源，在我们的方向上发射光线 $L_e(x,\vec{ω}_ o)$ 。大多数表面不会这样做，所以它们只反射来自外部的光线。这就是积分的作用。直观地说，它累积了来自半球Ω周围法线的每个可能方向的光线（所以现在我们只考虑从上面到达表面的光线，而不是从下面到达的光线，后者对半透明材料来说是必需的）。

第一部分 fr 称为双向反射分布函数（BRDF）。这个函数直观地描述了我们正在处理的材料类型——金属或电介质，亮或暗，光泽或暗淡。BRDF 定义了从 $\vec{ω}_ i$ 来的光线在 $\vec{ω}_ o$ 方向上的反射比例。在实践中，这是通过一个 3 分量向量来处理的，分别表示红色、绿色和蓝色光线的数量，每个分量的范围在 [0,1] 之间。

第二部分 $(\vec{ω}_ i\cdot\vec{n} )$ 相当于 1 中的 cosθ，其中θ是入射光与表面法线 $\vec{n}$ 之间的角度。想象一束平行光线正对着表面撞击。现在想象同一束光线以平坦的角度撞击表面。光线将在更大的区域内传播，但这也意味着该区域内的每个点看起来比之前暗。余弦会考虑到这一点。

最后，从 $\vecω_i$ 来的实际光线是使用相同的方程递归地确定的。因此，点 x 处的光线取决于上半球所有可能方向上的入射光线。在点 x 的每个方向上，又有另一个点 x'，其亮度再次取决于该点上半球所有可能方向上的入射光线。反复进行。

所以这就是它。一个无限递归的积分方程，包含无数个半球积分域。我们无法直接解这个方程，但有一个相当简单的解决方案。

1 记住这一点！我们将经常谈论余弦，当我们这样做时，我们指的是点积。由于 $\vec{a}\cdot\vec{b}=∥\vec{a}∥ ∥\vec{b} ∥cos(θ)$ ，而我们处理的是方向（单位长度向量），所以在计算机图形学中，点积在大多数情况下是余弦。

### 蒙特卡洛的救援

蒙特卡洛积分是一种数值积分技巧，允许我们使用有限数量的随机样本估计任何积分。此外，蒙特卡洛保证收敛到正确的解决方案——采样越多，效果越好。下面是通用形式：

$$F_N≈\frac{1}{N}\sum_{n=0}^N\frac{f(x_n)}{p(x_n)} $$

 因此，函数 $f(x_n)$ 的积分可以通过在积分域上取随机样本的平均值来估计。每个样本都除以它被选择的概率 $p(x_n)$ 。这样，经常被选择的样本会比较少被选择的样本权重更轻。

对半球进行均匀采样（每个方向被选中的概率相同），样本概率是常数： $p(ω)=\frac{1}{2π}$ （因为 2π是单位半球的表面积）。如果你把所有东西放在一起，你会得到：

$$L(x,\vec{ω}_o)≈L_e(x,\vec{ω}_o)+\frac{1}{N}\sum_{n=0}^N2πf_r(x,\vec{ω} _i,\vec{ω}_o)(\vec{ω}_i\cdot\vec{n})L(x,\vec{ω}_i) $$

 发射 $L_e(x,\vec{ω}_o)$ 就是我们 Shade 函数的返回值。 $\frac{1}{N}$ 已经在我们的 AddShader 中实现。当我们反射光线并进一步追踪时，会发生 $L(x,\vec{ω}_i)$ 的乘法。我们的任务是用一些生活填充方程的绿色部分。

## 先决条件

在我们开始冒险之前，让我们处理一些事情：样本累积、确定性场景和着色器随机性。

### 累积

出于某种原因，Unity 在 OnRenderImage 中没有给我一个 HDR 纹理作为目标。对于我来说，格式是 `R8G8B8A8_Typeless`，因此精度很快就会不足以累积多个样本。为了解决这个问题，让我们在 C# 脚本中添加 `private RenderTexture _converged`。这将是我们在将结果显示在屏幕上之前以高精度累积结果的缓冲区。在 InitRenderTexture 函数中，与 _target 完全相同地初始化 / 释放此纹理。在 Render 函数中，将 blit 加倍：

```
Graphics.Blit(_target, _converged, _addMaterial);
Graphics.Blit(_converged, destination);
```

### 确定性场景

当您对渲染进行更改时，将其与以前的结果进行比较有助于判断效果。目前，每次重新启动播放模式或重新编译脚本时，我们都会看到一个新的随机场景。为了解决这个问题，将 public int SphereSeed 添加到您的 C# 脚本中，并在 SetUpScene 的开头添加以下行：

```
Random.InitState(SphereSeed);
```

您现在可以手动设置场景的种子。输入任意数字，禁用 / 重新启用 RayTracingMaster 组件，直到找到您喜欢的场景。

用于示例图像的设置为：`Sphere Seed 1223832719，Sphere Radius [5，30]，Spheres Max 10000，Sphere Placement Radius 100`。

### 着色器随机性

在我们开始任何随机采样之前，我们需要在着色器中添加随机性。我正在使用我在网上找到的典型的一行代码，为了更方便进行了修改：

```c
float2 _Pixel;
float _Seed;
float rand() {
    float result = frac(sin(_Seed / 100.0f * dot(_Pixel, float2(12.9898f, 78.233f))) * 43758.5453f);
    _Seed += 1.0f;
    return result;
}
```

在 CSMain 中直接将 _Pixel 初始化为 _Pixel = id.xy，这样每个像素将使用不同的随机值。_Seed 是在 SetShaderParameters 函数中从 C# 初始化的。

```c
RayTracingShader.SetFloat("_Seed", Random.value);
```

我们在这里生成的随机数质量是不确定的。值得调查和测试这个函数，分析参数的影响，并将其与其他方法进行比较。暂时，我们只是使用它并希望获得最好的效果。

## 半球采样

首先：我们需要在半球上均匀分布的随机方向。对于整个球体，这个非平凡的挑战在 Cory Simon 的这篇文章中详细描述。它很容易适应半球。以下是着色器代码：

```c
float3 SampleHemisphere(float3 normal) {
    // Uniformly sample hemisphere direction
    float cosTheta = rand();
    float sinTheta = sqrt(max(0.0f, 1.0f - cosTheta * cosTheta));
    float phi = 2 * PI * rand();
    float3 tangentSpaceDir = float3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
    // Transform direction to world space
    return mul(tangentSpaceDir, GetTangentSpace(normal));
}
```

这些方向是为围绕正 Z 生成的半球而生成的，因此我们需要将其转换为围绕我们需要的任何法线。为此，我们生成一个切线和副法线（两个与法线垂直且互相垂直的向量）。我们首先选择一个辅助向量来生成切线。我们选择正 X，仅当法线与 X 轴（近似）共线时才回退到正 Z。然后我们可以使用叉积来生成切线和副法线。

```c
float3x3 GetTangentSpace(float3 normal) {
    // Choose a helper vector for the cross product
    float3 helper = float3(1, 0, 0);
    if (abs(normal.x) > 0.99f)
        helper = float3(0, 0, 1);
    // Generate vectors
    float3 tangent = normalize(cross(normal, helper));
    float3 binormal = normalize(cross(normal, tangent));
    return float3x3(tangent, binormal, normal);
}
```

## Lambert 漫反射

现在我们有了统一的随机方向，可以开始实现第一个 BRDF。Lambert BRDF 是用于漫反射的最常用方法，其简单之处令人瞩目： $f_r(x,\vec{ω}_i,\vec{ω}_o)=\frac{kd}{π}$ ，其中 $kd$ 是表面的反照率。让我们将其插入到我们的蒙特卡洛渲染方程中（我现在先去掉发射项），看看会发生什么：

$$L(x,\vec{ω}_o)≈\frac{1}{N}\sum_{n=0}^N2k_d(\vec{ω}_i\cdot\vec{n} )L(x,\vec{ω}_i) $$

 现在，让我们将其放入我们的着色器中。在 Shade 函数中，将 if (hit.distance < 1.#INF) 子句内的代码替换为以下几行：

```c
// Diffuse shading
ray.origin = hit.position + hit.normal * 0.001f;
ray.direction = SampleHemisphere(hit.normal);
ray.energy *= 2 * hit.albedo * sdot(hit.normal, ray.direction);
return 0.0f;
```

反射光线的新方向由我们的统一半球采样函数确定。光线的能量与上面方程中的相关部分相乘。由于表面不发光（仅反射它直接或间接从天空接收的光线），我们在这里返回 0。请记住，**我们的 AddShader 会为我们平均样本，所以我们不需要关心 $\frac{1}{N}\sum$ 。CSMain 函数已经包含了与 $L(x,ω⃗ i)$（下一个反射光线）的乘法，所以我们要做的不多。**

sdot 函数是我为自己定义的一个简单实用程序。它简单地返回点积的结果，可以选择性地添加一个因子，然后将其截断到 [0,1]：

```c
float sdot(float3 x, float3 y, float f = 1.0f) {
    return saturate(dot(x, y) * f);
}
```

让我们回顾一下迄今为止代码的功能。**CSMain 生成我们的主摄像机光线并调用 Shade。如果碰到表面，该函数将依次生成新的光线（法线周围的半球中均匀随机），并将材质的 BRDF 和余弦系数计入光线的能量。如果击中天空，我们将采样 HDRI（我们唯一的光源），并返回光线，该光线与光线的能量相乘（即从相机开始的所有先前击中的乘积）。这是一个单独的样本，与汇聚的结果进行混合。最后，每个样本的贡献为 1/N。**

现在尝试一下。由于金属没有漫反射，所以现在让我们在 C# 脚本的 SetUpScene 函数中暂时禁用它们（仍然在这里调用 Random.value 以保持场景的确定性）：

```
bool metal = Random.value < 0.0f;
```

进入播放模式，看看最初的噪点图像如何慢慢清晰，最终呈现出一幅漂亮的渲染图像，如下所示：

![[623e5b156c76bb1b4f0dd8ca5094766b_MD5.jpg]]

## Phong Specular

对于几行代码（以及一些仔细的数学 - 我看到你们正在慢慢成为朋友）来说，这并不算太糟糕。让我们通过添加 Phong BRDF 来增加镜面反射效果。最初的 Phong 公式存在一些问题（不可逆，不守恒能量），但幸运的是，其他人解决了这些问题。修正后的 Phong BRDF 如下所示，其中 $ω⃗ r$ 是完全反射的光线方向，α是控制粗糙度的 Phong 指数：

$$f_r(x,\vec{ω}_i,\vec{ω}_o) = k_s\frac{α+2}{2π}(\vec{ω}_r\cdot\vec{ω}_ o)^α $$

 这里是一个小型的二维图，显示了α=15 时 Phong BRDF 在 45° 入射角时的样子。点击右下角可以自行更改α值。

![[5f0c925e3c3886fefa4530796b27e5fd_MD5.jpg]]

将其插入我们的蒙特卡罗渲染方程：

$$L(x,\vec{ω}_o)≈\frac{1}{N}\sum_{n=0}^{N}k_s(α+2)(\vec{ω}_r\cdot\vec{ω}_o)^α(\vec{ω}_i\cdot\vec{n})L(x,\vec{ω}_i) $$

 最后，将其与我们已经拥有的 Lambert BRDF 相结合：

$$L(x,\vec{ω}_o)≈\frac{1}{N}\sum_{n=0}^{N}[2k_d+k_s(α+2)(\vec{ω}_r\cdot\vec{ω}_o)^α](\vec{ω}_i\cdot\vec{n})L(x,\vec{ω}_i) $$

 这是与 Lambert 漫反射一起的代码：

```
// Phong shading
ray.origin = hit.position + hit.normal * 0.001f;
float3 reflected = reflect(ray.direction, hit.normal);
ray.direction = SampleHemisphere(hit.normal);
float3 diffuse = 2 * min(1.0f - hit.specular, hit.albedo);
float alpha = 15.0f;
float3 specular = hit.specular * (alpha + 2) * pow(sdot(ray.direction, reflected), alpha);
ray.energy *= (diffuse + specular) * sdot(hit.normal, ray.direction);
return 0.0f;
```

请注意，我们用一个略有不同但等效的点积替换了原来的点积（反射的ωo 而不是ωi）。现在在 SetUpScene 函数中重新启用金属材质并试一试。

尝试不同的α值，你会注意到一个问题：较低的指数已经需要很长时间才能收敛，而对于较高的指数，噪声尤为顽固。即使等待了几分钟，结果远远不如漂亮，这对于如此简单的场景是不可接受的。α=15 和α=300，样本数为 8192 时看起来是这样的：

![[feeb422d850b6b007d44f58999114f39_MD5.jpg]]

“这是为什么呢？我们之前有很好的完美反射（α=∞）！” 你可能会问。问题在于我们生成了均匀的样本，并根据 BRDF 对它们进行加权。对于高 Phong 指数，除非方向非常接近完美反射，否则 BRDF 的值对于所有方向都非常小，而且我们很难通过均匀样本随机选择它们。另一方面，如果我们确实碰到了那些方向中的一个，BRDF 会非常大，以补偿所有其他很小的样本。结果是方差非常高。具有多个镜面反射的路径甚至更糟糕，导致你在上面的图像中看到的噪声。

## Better Sampling

为了使我们的路径追踪器更实用，我们需要改变范例。与其在最终不重要的区域浪费宝贵的样本（因为它们会获得非常低的 BRDF 和 / 或余弦因子），不如生成有意义的样本。

作为第一步，我们将恢复完美反射，然后看看我们如何推广这个想法。为此，我们将把我们的着色逻辑分为漫反射和镜面反射。对于每个样本，我们将根据 kd 和 ks 的比例随机选择其中之一。对于漫反射，我们将坚持均匀采样，但对于镜面反射，我们将明确地将光线反射到唯一重要的方向。由于现在每种反射类型的样本数量较少，我们需要相应地增加样本的贡献，以达到相同的净数量，如下所示：

```
// Calculate chances of diffuse and specular reflection
hit.albedo = min(1.0f - hit.specular, hit.albedo);
float specChance = energy(hit.specular);
float diffChance = energy(hit.albedo);
float sum = specChance + diffChance;
specChance /= sum;
diffChance /= sum;
// Roulette-select the ray's path
float roulette = rand();
if (roulette < specChance)
{
    // Specular reflection
    ray.origin = hit.position + hit.normal * 0.001f;
    ray.direction = reflect(ray.direction, hit.normal);
    ray.energy *= (1.0f / specChance) * hit.specular * sdot(hit.normal, ray.direction);
}
else
{
    // Diffuse reflection
    ray.origin = hit.position + hit.normal * 0.001f;
    ray.direction = SampleHemisphere(hit.normal);
    ray.energy *= (1.0f / diffChance) * 2 * hit.albedo * sdot(hit.normal, ray.direction);
}
return 0.0f;
```

能量函数是一个小助手，它对颜色通道进行平均：

```
float energy(float3 color) {
    return dot(color, 1.0f / 3.0f);
}
```

这里是我们上次构建的 Whitted 光线追踪器的优化版本，但现在具有真正的漫反射着色（阅读 "柔和阴影，环境遮蔽，漫射全局照明"）：

![[1a31e3e1ecaa2d32dd301ce5f15d7ec3_MD5.jpg]]

## 重要性采样

让我们再次看一下基本的蒙特卡洛公式：

$$F_N≈\frac{1}{N}\sum_{n=0}^{N}\frac{f(x_n)}{p(x_n)} $$

 如您所见，我们将每个样本的贡献除以选择这个特定样本的概率。到目前为止，我们在半球上使用均匀采样，因此具有恒定的 $p(ω)=\frac{1}{2π}$ 。正如我们之前看到的，这远非理想，例如在 Phong BRDF 中，它在非常窄的一组方向上具有很大的值。

想象一下，我们可以找到一个与被积函数完全匹配的概率分布：p(x)=f(x)。这将发生什么：

$$F_N≈\frac{1}{N}\sum_{n=0}^{N}1 $$

 现在没有一个样本会获得很少的贡献。相反，这些样本将本质上以较低的概率被选择。这将大幅减少结果的方差并使渲染更快收敛。

在实践中，找到这样一个完美的分布是不现实的，因为被积函数的某些因素（在我们的情况下是 BRDF × 余弦 × 入射光）是未知的（最突出的是入射光），但已经按照 BRDF × 余弦甚至仅按照 BRDF 分布样本对我们来说已经足够好了。这就是所谓的重要性采样。

### 余弦采样

对于接下来的步骤，我们需要用余弦（幂）分布替换均匀样本分布。请记住，我们要生成比例较少的样本，而不是用余弦乘以均匀样本，降低它们的贡献。

Thomas Poulet 在这篇文章中描述了如何实现这一点。我们将为 SampleHemisphere 函数添加一个 alpha 参数，用于确定余弦采样的幂：0 表示均匀，1 表示余弦，或者更高的 Phong 指数。在代码中：

```
float3 SampleHemisphere(float3 normal, float alpha) {
    // Sample the hemisphere, where alpha determines the kind of the sampling
    float cosTheta = pow(rand(), 1.0f / (alpha + 1.0f));
    float sinTheta = sqrt(1.0f - cosTheta * cosTheta);
    float phi = 2 * PI * rand();
    float3 tangentSpaceDir = float3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
    // Transform direction to world space
    return mul(tangentSpaceDir, GetTangentSpace(normal));
}
```

现在，每个样本的概率是 $p(ω)=α+12π(ω⃗ ⋅n⃗ )α$ 。这种美感可能不会立即显现出来，但过一会儿就会展现出来。

### 重要性采样 Lambert

首先，我们将改进我们的漫反射渲染。我们的均匀分布已经非常适合恒定的 Lambert BRDF，但通过包含余弦因子，我们可以做得更好。余弦采样（其中α=1）的概率分布为 $\frac{(\vec{ω}_i\cdot\vec{n})}{π}$ ，这简化了我们的漫反射蒙特卡洛公式：

$$L(x,\vec{ω}_o)≈\frac{1}{N}\sum_{n=0}^{N}k_dL(x,\vec{ω}_i) $$

```
// Diffuse reflection
ray.origin = hit.position + hit.normal * 0.001f;
ray.direction = SampleHemisphere(hit.normal, 1.0f);
ray.energy *= (1.0f / diffChance) * hit.albedo;
```

这将使我们的漫反射阴影稍微加速。现在让我们解决真正的罪魁祸首。

### 重要性采样 Phong

对于 Phong BRDF，过程类似。这次，我们有两个余弦的乘积：渲染方程中的常规余弦（如漫反射情况下）乘以 BRDF 自己的幂余弦。我们将只处理后者。

让我们将上述概率分布插入到我们的 Phong 方程中。详细推导可参见 Lafortune 和 Willems：使用修改的 Phong 反射模型进行物理基础渲染（1994）：

$$L(x,\vec{ω}_o)≈\frac{1}{N}\sum_{n=0}^{N}k_s\frac{α+2}{α+1}(\vec{ω}_ i\cdot\vec{n} )L(x,\vec{ω}_ i) $$

```
// Specular reflection
float alpha = 15.0f;
ray.origin = hit.position + hit.normal * 0.001f;
ray.direction = SampleHemisphere(reflect(ray.direction, hit.normal), alpha);
float f = (alpha + 2) / (alpha + 1);
ray.energy *= (1.0f / specChance) * hit.specular * sdot(hit.normal, ray.direction, f);
```

这些更改足以解决高 Phong 指数的任何问题，并使我们的渲染在更合理的时间内收敛。

## 材质

最后，让我们扩展我们的场景生成，以便我们获得光滑度和球体发射的不同值！在 C# 中，向 Sphere 结构体添加 public float smoothness 和 public Vector3 emission。由于我们更改了结构体的大小，我们需要在创建计算缓冲区时调整步幅（记得是 4 × 浮点数的数量吗？）。使 SetUpScene 函数为 smoothness 和 emission 放入一些值。

回到着色器中，将这两个变量添加到 Sphere 结构体和 RayHit 结构体中，并在 CreateRayHit 中进行初始化。最后但同样重要的是，在 IntersectGroundPlane（硬编码，放入任何你想要的值）和 IntersectSphere（从 Sphere 中获取值）中设置这两个值。

我想用光滑度值，就像我习惯于 Unity Standard 着色器那样，这与 Phong 指数有所不同。这是在 Shade 函数中使用的一个转换，效果还不错：

```
float SmoothnessToPhongAlpha(float s) {
    return pow(1000.0f, s * s);
}

float alpha = SmoothnessToPhongAlpha(hit.smoothness);
```

![[76441c73f433dd5883646aac24b2584c_MD5.png]]

使用发射仅需在 Shade 中返回该值：

```
return hit.emission;
```

## 结果

深呼吸，放松，等待你的图像清晰成如下舒缓的景象：

![[c3cc5878205d3a38a943ce37edc0c724_MD5.jpg]]

恭喜你！你已经度过了这片充满数学的森林。你实现了一个能够进行漫反射和镜面反射的路径追踪器，并且你了解了重要性采样，并立即应用这个概念使渲染在几分钟而不是几小时或几天内收敛。

这篇文章与上一篇在复杂性和结果质量方面有很大的飞跃。理解数学原理需要时间，但是值得的，因为它将极大地加深你对正在进行的事情的理解，并允许你在不破坏物理合理性的情况下扩展算法。

感谢你的关注！在第三部分，我们将暂时抛开采样和阴影的难题，回到文明世界，与 Möller 和 Trumbore 先生会面。他们将谈论一下关于三角形的一两点内容。