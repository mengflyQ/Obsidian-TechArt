# 03 正确处理Ray Marching


## 内散射和外散射

在前面的章节中，我们只考虑了光束与构成介质的粒子之间的两种相互作用：吸收和内散射。但是，**为了得到准确的结果，我们应该考虑四种类型**。我们可以将它们分为两类。  
当光束穿过介质到达眼睛时，它们之间的相互作用会削弱光束的能量。以及有助于增加光束能量的相互作用。

*   光束穿过介质到达眼睛时会损失能量，原因如下
    *   吸收（Absorption）：部分光能被构成介质的粒子吸收。
    *   外散射（Out-Scattering）：如上一章所述的内散射，光会被粒子散射，这就会导致没有射向眼睛的光线以某种方式转向眼睛。但是，射向眼睛的光线在到达眼睛的途中也会被散射出去。这意味着光也会因为这种效应而损失能量。这就是所谓的外散射。  
*   光束穿过介质到达眼睛时会获得能量，原因如下
    *  自发光 （Emission）：我们在第一章中提到过这种效应，但也提到过我们暂时会忽略它。例如，火焰可以发出白炽光。
    *   内散射 （In-Scattering）：我们已经熟悉了这种效应。由于散射作用，一些最初没有射向眼睛的光线被重新定向射向眼睛。这种效应称为内散射。  


这些效果如下图所示。
![[324072b99cbdd5a008d1fb5551cf36c6_MD5.png]]


在计算光通过介质到达眼睛时会损失多少光时，我们必须考虑到吸收和外散射。  

外散射和内散射都是由同一种光粒子相互作用引起的：散射，在前一章中，我们已经用变量（希腊字母 $\sigma_s$）定义了散射。  

因此，由于散射 $\sigma_s$ 也会导致我们在光线穿过介质到达眼睛时损失多少光线，因此我们需要在比尔定律方程中将其与吸收系数一起考虑在内。请记住，这个方程既用于计算 Li (x) 项，也用于计算样本透射值。  

这样，我们的代码就变成了（红色部分为修改）：

```c++
...
float sigma_a = 0.5; // absorption coefficient
float sigma_s = 0.5; // scattering coefficient
// 透射率
float sample_attenuation = exp(-step_size * (sigma_a + sigma_s)); 
transparency *= sample_attenuation; 
 
// 内散射。计算光穿过体积球到样品的距离。
// 然后利用比尔定律衰减由于内散射造成的光贡献。
if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) { 
    float light_attenuation = exp(-density * isect_vol.t1 * (sigma_a + sigma_s)); 
    result += ...; 
}
...
```


**有时，您会看到 $\sigma_a$ 和 $\sigma_s$ 这两个项相加，形成一个称为消光系数 (extinction coefficient)的项，通常表示为  $\sigma_t$。**

散射项的计算还没有完全结束... 因内散射而散射到眼睛的光的多少也与散射项成正比。因此，我们还需要将内散射导致的光贡献乘以变量。  

我们的代码变成了（红色部分有改动）：

```c++
...
float sigma_a = 0.5; // absorption coefficient
float sigma_s = 0.5; // scattering coefficient
// 透射率
float sample_attenuation = exp(-step_size * (sigma_a + sigma_s)); 
transparency *= sample_attenuation; 
 
// 内散射。计算光穿过体积球到样品的距离。
// 然后利用比尔定律衰减由于内散射造成的光贡献。
if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) { 
    float light_attenuation = exp(-isect_vol.t1 * (sigma_a + sigma_s)); 
    result += transparency * light_color * light_attenuation * sigma_s * step_size; 
}
...
```

##  密度术语


我们将在下一章详细介绍这一术语。

**到目前为止，我们认为散射系数和吸收系数在整个体积中是均匀的**，而我们一直在使用这两个系数来控制体积的 "不透明 "程度（请记住，这两个系数越高，体积就越不透明）。 在科学文献中，这通常被称为**同质参与介质** （homogenous participating medium）。现实世界中的 "体积 "通常并非如此。以云层或烟为例。它们的不透明度在空间上各不相同。因此，我们称之为**异质参与介质（heterogeneous participating medium）**。

We will only see how to simulate volumetric objects with varying densities in the next chapter, but for now, let's just say that we want some kind of variables that will scale our scattering and absorption coefficient globally. Let's call this variable density.  
我们将在下一章了解如何模拟具有不同密度的体积物体，**但现在，我们只需要某种变量，它将在全局范围内缩放我们的散射和吸收系数。我们将其称为 "密度变量"。**  

我们将用它来缩放两者，如下所示（多乘了一个 density 系数）：

```c++
...
float sigma_a = 0.5; // absorption coefficient
float sigma_s = 0.5; // scattering coefficient
float density = 1;
// 透射率
float sample_attenuation = exp(-step_size * density * (sigma_a + sigma_s)); 
transparency *= sample_attenuation; 
 
// 内散射。计算光穿过体积球到样品的距离。
// 然后利用比尔定律衰减由于内散射造成的光贡献。
if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) { 
    float light_attenuation = exp(-density * isect_vol.t1 * (sigma_a + sigma_s)); 
    result += transparency * light_color * light_attenuation * sigma_s * density * step_size; 
}
...
```


请记住，代码中有两处使用了这一概念。我们将在下一章解释如何实现空间变化密度的概念。

现在，请注意一些有趣的事情。当密度为 0 时， `result` 变量中不会添加任何东西。换句话说，在没有体积的地方（空的空间，或者密度 = 0），不应该有任何累积的光。这一点在这一行中非常重要：

```c++
// 结合背景颜色并返回
return background_color* transparency + result;
```

 
如果 `result` 在没有体积的情况下不是 0（因为我们在计算内散射时忽略了将散射乘以密度值），我们就会看到不该看到的结果（结果 > 0）（在这种情况下结果应该是 0）。  这就是为什么在上一章中，我们提到 `result` 已经被 "预乘法 "了。它已经与自身的 "不透明度掩码 "相乘。当密度/不透明度大于 0 时，它大于 0；反之则为 0。

## 相位函数 Phase Function

> [!NOTE] 
> 相位函数可以告诉你，在任何特定的入射光线方向（$\omega$），有多少光线可能会散射到观察者（$\omega'$）。


内散射贡献应使用下式计算：
$$
Li(x, \omega) = \sigma_s \int_{S^2} p(x, \omega, \omega')L(x,\omega')d\omega'
$$

$Li$ 为内散射（辐射）贡献，$x$ 为样本位置，$\omega$ 为视线方向（我们的相机光线方向）。通常，$\omega$ 总是指向辐射流动的方向，即从物体到眼睛的方向。该术语表示光线方向（应从物体指向光线）。这里的项只不过是 L (x) 项，即光贡献或入射辐射度，我们迄今为止一直在代码中计算其值。那个

```c++
...
// In-scattering. Find the distance light travels through the volumetric sphere to the sample.
// Then use Beer's law to attenuate the light contribution due to in-scattering.
if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) { 
    float light_attenuation = exp(-density * isect_vol.t1 * (sigma_a + sigma_s)); 
    result += transparency * light_color * light_attenuation * sigma_s * density * step_size;
...
```

它计算的是来自特定光照方向的光量，$\omega'$（代码中的变量 `light_dir` ），在经过体积 `isect_vol.t1` 一定距离后，在样本点 x `sample_pos` 处的光量。）

但我们还没有介绍积分符号后面的那个项 $p(x,\omega,\omega')$： 。它被称为相位函数，接下来我们将解释它是什么。但在此之前，我们先用语言来解释一下这个等式。  

符号为 $S^2$ 的积分（在文献中您最终也会看到这样的写法）意味着，在计算内散射贡献时，可以考虑到来自整个方向球 $S^2$ 的所有方向的光线。

**为了计算实体物体的外观，我们使用了名为 BRDF 的函数，它可以收集半球方向上的光线。**  对于实体物体，我们并不关心来自表面 "下方 "的光线--半透明材料除外，但这又是一个很长的故事。如果您对此感兴趣，请查看与阴影相关的课程，如《全局照明和路径跟踪》或《阴影数学》）。现在让我们回到相位函数。

![[6739176c719b6b1ff3d61ce3bb457136_MD5.png]]
图 1：各向同性 (isotropic)相位函数（光线在球面上向各个方向散射）与各向异性 (anisotropic)相位函数（光线在球面上的分布不均匀）。

When a photon interacts with a particle, it can be scattered out in any direction within the sphere of possible directions around the particle where every direction is equally likely to be chosen than any others. In this particular case, we speak of an **isotropic** scattering volume. But isotropic scattering is not the norm. Most volumes tend to scatter light in a restricted range of directions. We then speak of an **anisotropic** scattering medium or volume. The phase function is simply a mathematical equation that tells you how much light is being scattered for a particular combination of directions: the view direction and the incoming light direction $\omega'$.  
当一个光子与一个粒子相互作用时，它可以向粒子周围可能方向范围内的任何方向散射，在这个范围内，每个方向被选择的可能性都是相同的。在这种特殊情况下，我们称之为各向同性散射体积。但各向同性散射并非常态。大多数体积倾向于在有限的方向范围内散射光线。这就是各向异性散射介质或体积。相位函数是一个简单的数学公式，它可以告诉你在特定的方向组合下，有多少光被散射了：视线方向和入射光线方向 $\omega'$。  
The function returns a value in the range 0 to 1. In mathematical terms, we say that the phase function models the angular distribution of light (or radiance) scattered.  
用数学术语来说，相位函数是散射光（或辐射度）角度分布的模型。

The phase function has a couple of properties. First, it necessarily integrates to 1 over its domain which is the sphere of direction . Indeed particles making up the volume are hit by light beams coming from possibly all directions and that set of possible directions can be seen as a sphere centered around the particle.  
相位函数有几个特性。首先，它必然会在其领域内积分为 1，而这个领域就是方向球。事实上，构成体积的粒子会被来自各个方向的光束击中，而这一系列可能的方向可以看作是以粒子为中心的球体。  
So if we consider all directions from which light can come around the particle, how much light is being scattered out around that same particle can't be greater than the sum of all incoming light.  
因此，如果我们考虑到光线可以从粒子周围的所有方向射入，那么在同一粒子周围散射出去的光线就不可能大于所有射入光线的总和。  
This is the reason why the phase function needs to be normalized over the sphere of directions:  
这就是相位函数需要在方向球上进行归一化的原因：

If the phase function wasn't normalized, it would contribute to either"add"or"remove" light. Another property of phase functions is reciprocity. If you swap the and terms in the equation, the result returned by the phase function is the same.  
如果不对相位函数进行归一化处理，它就会 "增加 "或 "减少 "光线。相位函数的另一个特性是互易性。如果交换等式中的和项，相位函数返回的结果是相同的。

![[0f9fa28d95514acbeb4091881666170a_MD5.png]]

**Figure 2:** the phase function only considers the angle $\theta$ between the light and view direction.  
图 2：相位函数只考虑了光线和视线方向之间的角度 $\theta$。

The phase function only depends on the angle between the view and the incoming light direction. This is why it is generally defined in terms of an angle $\theta$ (the Greek letter theta), the angle between the two vectors (and not and ).  
相位函数只取决于视角和入射光方向之间的夹角。这就是为什么相位函数通常用角度 $\theta$（希腊字母 theta）来定义，即两个矢量（而不是和 ）之间的夹角。  
If we take the dot product of the directions $\omega$ (the view direction) and (the incoming light direction), ) spans over the range of [-1, 1] and thus itself spans over the range [0, $\pi$] as shown in the image below.  
如果我们求 $\omega$（视图方向）和（入射光方向）的点积，那么 ) 的范围是 [-1, 1]，因此它本身的范围是 [0, $\pi$] ，如下图所示。

![[79d86cd2c6674f6364a5d467c1efb7f7_MD5.png]]

In summary, the phase function tells you how much light is likely to be scattered towards the viewer () for any particular incoming light direction ().  
总之，相位函数可以告诉你，在任何特定的入射光线方向（$\omega$），有多少光线可能会散射到观察者（$\omega'$）。

Enough chatting. What do these phase functions look like?  
闲话少说。这些阶段功能是什么样的？

The simplest one is the phase function of isotropic volumes.  
最简单的是各向同性体积的相位函数。  
Because light coming from all sets of directions within the sphere of directions is also equally scattered in all sets of directions over the sphere, uniformly, the phase function (remember its integral over the spherical domain needs to be normalized to 1) simply is:  
由于来自球面内所有方向的光线在球面上所有方向的散射也是相同的，因此相位函数（记住，它在球面上的积分需要归一化为 1）就是这样：

Note that this function is independent of the view and incoming light direction. The $\theta$ angle is there in the function's definition but is not used in the equation itself (on the right-hand side of the equal sign).  
请注意，这个函数与视角和入射光方向无关。函数定义中包含了 $\theta$ 角，但等式本身（等号的右侧）中没有使用。  
This is expected since the direction of the out-scattered photon is independent of the incoming light direction (there's no dependency between the two so it has no reason to appear in the equation) and all out-scattered directions are equally likely to be chosen (which is why the equation is a constant).  
这是意料之中的，因为散射出去的光子的方向与入射光线的方向无关（两者之间不存在依赖关系，因此没有理由出现在等式中），而且所有散射出去的方向都有同样的可能被选中（这就是等式是一个常数的原因）。  
It's not very hard to understand this equation.  
要理解这个等式并不难。  
The area of a sphere is $4\pi$ steradians and so that's basically the surface covered by all our incoming directions if you think of this direction in terms of differential solid angles, and thus the phase function ought to be 1 over to satisfy the normalization property: the surface covered by all incoming directions divided by equals 1. This is a good time to mention that the unit of phase functions is 1/sr (sr here stands for [steradian](https://en.wikipedia.org/wiki/Steradian)).  
一个球体的面积是 4 美元/平方英寸，因此，如果从微分实心角的角度来考虑这个方向，这基本上就是我们所有传入方向所覆盖的表面，因此相位函数应该为 1，以满足归一化特性：所有传入方向所覆盖的表面除以等于 1。在此，我们不妨提一下相位函数的单位是 1/sr（这里的 sr 代表 steradian）。

The phase function for isotropic volumes is quite simple. Let's look at another one called the **Henyey-Greenstein** phase function. It looks like this:  
各向同性体积的相位函数非常简单。我们再来看看另一个相位函数，叫做亨耶-格林斯坦相位函数。它看起来是这样的

![[be6e3d2721f7291ebdf32937f5e1bd44_MD5.png]]

**Figure 3:** plot of the Henyey-Greenstein phase function in the polar coordinate system for different values of the asymmetry factor g (g=0.3, 0.5, 0, -03, -0.5). The angle is defined over the range [0, ].  
图 3：极坐标系中不同不对称系数 g 值（g=0.3，0.5，0，-03，-0.5）下的亨伊-格林斯坦相位函数图。角度定义范围为 [0, ]。

It's a little bit more complex indeed. And as you can it has another variable called the **asymmetry factor**, where . This parameter lets you control whether light is scattered in the forward or backward direction. When light is out-scattered mostly forward. When , it is scattered backward. And when , the function equals , the phase function for isotropic volumes.  
这确实有点复杂。正如你所看到的，它还有一个变量叫不对称因子，其中。这个参数可以控制光线是向前散射还是向后散射。当光线主要向前散射时，它向后散射。当，则向后散射。当时，该函数等于各向同性体积的相位函数。  
Figure 3 shows what the function looks like for different values of .  
图 3 显示了函数在 .

If you want proof that this function is normalized over the sphere of directions, here it is. First, don't forget we need to integrate the function over the sphere of directions (over steradians) because our directions here say are defined in terms of differential solid angle.  
如果您想证明这个函数是在方向球上归一化的，那么答案就在这里。首先，不要忘了我们需要在方向球（立体角）上对函数进行积分，因为我们这里所说的方向是用微分立体角定义的。  
We can write differential solid angles in terms of (longitude) and (latitude) as explained in the lesson [Introduction to Shading](https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/diffuse-lambertian-shading.html). So we get:  
我们可以用（经度）和（纬度）来书写微分实角，这在 "阴影入门 "一课中已有解释。因此我们可以得到

Integrating over simply gives . So we are left with:  
简单地进行积分，就得到 .因此我们得出

We can write it as a function of , integrating over -1 and 1:  
我们可以把它写成一个函数，对 -1 和 1 进行积分：

We can move the constant in the integral (in red) to the left so we have:  
我们可以将积分中的常数（红色部分）向左移动，得到

To make this integration, we will use the second fundamental theorem of calculus:  
为了进行积分，我们将使用微积分第二基本定理：

Where is the anti-derivative of function . So we need to compute the anti-derivative of:  
其中是函数的反求。因此，我们需要计算它的反求导：

xx finish this bit xx  
xx 完成这一点 xx

Other phase functions exist such as the Schlick, Rayleigh, or Lorenz-Mie scattering phase functions. They've been designed to fit the behavior of different types of particles.  
还有其他相位函数，如施利克、瑞利或洛伦兹-米散射相位函数。这些相位函数是为适应不同类型粒子的行为而设计的。  
For example, it's better to use the Rayleigh function when you attempt to render volumes that are made of tiny particles (smaller than the light wavelength) whereas the Mie function is better for larger particles (dust, water drops, etc.).  
例如，当您尝试渲染由微小颗粒（小于光波长）构成的体积时，最好使用瑞利函数，而对于较大的颗粒（灰尘、水滴等），米氏函数则更好用。  
The Henyey-Greenstein is often used in production rendering, the kind of rendering we do for movies because it's quick to compute (others can be less so) and also simple to sample (see the lesson on [Monte Carlo Simulation](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/monte-carlo-methods-in-practice/monte-carlo-simulation.html) for example).  
Henyey-Greenstein 常用于制作渲染，也就是我们为电影做的那种渲染，因为它计算速度快（其他的可能没那么快），而且取样简单（例如，请参阅蒙特卡罗模拟课程）。

Finally, here is what it looks like when we add the Henyey-Greenstein phase function to our code (feel free to implement other functions):  
最后，下面是我们在代码中添加 Henyey-Greenstein 相位函数后的结果（也可以实现其他函数）：

```
// the Henyey-Greenstein phase function
float phase(const float &g, const float &cos_theta) {
    float denom = 1 + g * g - 2 * g * cos_theta;
    return 1 / (4 * M_PI) * (1 - g * g) / (denom * sqrtf(denom));
}

vec3 integrate(...) {
    ...
    float g = 0.8; // asymmetry factor of the phase function
    for (int n = 0; n < ns; ++n) {
        ...
        // In-scattering. Find the distance light travels through the volumetric sphere to the sample.
        // Then use Beer's law to attenuate the light contribution due to in-scattering.
        if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) { 
            float cos_theta = ray_dir * light_dir;
            float light_attenuation = exp(-density * isect_vol.t1 * (sigma_a + sigma_s)); 
            result += density * sigma_s * <span style="color: red; font-weight: bold; background-color: rgba(255,0,0,0.1);">phase(g, cos_theta)</span> * light_attenuation * light_color * step_size;
        }
        ...
    }
    ...
}
```

Note that it looks a lot more like the formal mathematical definition of the in-scattering term provided above.  
请注意，它看起来更像上文提供的内散射项的正式数学定义。

![[dc7d0703ef95fda76b6142c4d9399a07_MD5.gif]]

The sequence of images above shows our volume sphere in two different lighting setups with different values for the phase function asymmetry factor $g$. On the left, the light is looking directly at the camera (backlighting).  
上面的一系列图像显示了我们的体积球在两种不同的照明设置下，相位函数不对称系数 $g$ 的不同值。左图中，光线直射相机（背光）。  
On the right, the light and the camera are pointing straight at the sphere (front lighting).  
在右侧，灯光和摄像机直射球体（正面照明）。

The Henyey-Greenstein phase function is simple but can offer a good fit to real-world data.  
Henyey-Greenstein 相位函数非常简单，但能很好地拟合真实世界的数据。  
You can use a two-lobe phase function for example by combining the result of the function for a value of g = 0.35 with the result for a negative value or higher value of g to achieve a more refined fit. Feel free to experiment.  
例如，您可以使用双叶相位函数，将 g = 0.35 时的函数结果与 g 为负值或更高值时的函数结果相结合，以获得更精细的拟合结果。请随意尝试。  
For objects such as clouds or haze, use a high value (around 0.8). Check the reference section at the end of the lesson for some pointers.  
对于云或雾霾等物体，请使用高值（约 0.8）。请查看本课最后的参考资料部分，以获取一些提示。

## Jittering the Sample Positions  
抖动采样位置

![[27c9402f3edf092af02747d38c2a9fd1_MD5.png]]

So far, we have always positioned our samples in the middle of the segments. Using regularly spaced samples is like cutting the volume into slices and these slices can lead to some unpleasant banding artifacts as shown in the image above (the effect was artificially exaggerated).  
到目前为止，我们总是将样本放置在片段的中间位置。使用有规律间隔的样本就像是将体积切割成片段，而这些片段可能会导致一些令人不悦的带状伪影，如上图所示（效果被人为夸大了）。  
To "fix" this problem, we can pick a random position on each segment instead. In other words, samples can be positioned anywhere within the boundaries of a segment (along the camera ray of course). To do so, we will replace these lines:  
为了 "解决 "这个问题，我们可以在每个线段上随机选择一个位置。换句话说，样本可以放置在线段边界内的任何位置（当然是沿着摄像机光线）。为此，我们将替换这些线条：

```
float t = isect.t0 + step_size * (n + 0.5); 
vec3 sample_pos = ray_orig + t * ray_dir;
```

With: 有了

```
float t = isect.t0 + step_size * (n + rand()); 
vec3 sample_pos = ray_orig + t * ray_dir;
```

![[d9438d133ef0ccd9c7547054189e7a08_MD5.png]]

**Figure 4:** to avoid banding artifacts, we can jitter the position of the samples rather than using regularly spaced samples. Samples can be positioned anywhere within the boundaries of a segment.  
图 4：为了避免带状伪影，我们可以抖动样本的位置，而不是使用有规律间隔的样本。样本可以放置在片段边界内的任何位置。

Where `rand()` is a function that returns a uniformly distributed number in the range [0,1]. We call this method stochastic sampling.  
其中， `rand()` 是一个函数，用于返回范围为 [0,1] 的均匀分布数。我们称这种方法为随机抽样。

Stochastic sampling is a Monte Carlo technique in which we sample the function at appropriate non-uniformly spaced locations rather than at regularly spaced locations.  
随机抽样是一种蒙特卡洛技术，我们在适当的非均匀分布位置而非规则分布位置对函数进行抽样。

We can't say that this is better (hence the quotes around"fixing the issue"), because we now replace banding with noise, which is a problem on its own. Still, the result is visually more pleasing than banding.  
我们不能说这样做更好（因此在 "解决了问题 "前加了引号），因为我们现在用噪点代替了条带，而噪点本身就是一个问题。尽管如此，这样做的结果在视觉上还是要比带状噪点更美观。  
You can reduce this noise using more elaborate ways of generating sequences of"random" numbers (see for example quasi Monte-Carlo methods).  
您可以使用更复杂的 "随机 "数字序列生成方法来减少这种噪音（例如，请参阅准蒙特卡洛方法）。  
However, in this version of the lesson, we will skip this topic; an entire book can be written about that (for now, you can find some information on this method in the lesson [Monte Carlo in Practice](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/monte-carlo-methods-in-practice/introduction-quasi-monte-carlo.html)).  
不过，在本版课程中，我们将跳过这一主题；关于这一点，可以写成一整本书（目前，您可以在《蒙特卡洛实践》一课中找到关于这种方法的一些信息）。

## Break From the Ray Marching Loop When Opaque (Optimization)  
不透明时脱离光线行进循环（优化）

Indeed if the volume's transparency after saying you've marched through half of the distance between t0 and t1 is, for example, lower than 1e-3, you might consider that computing the samples for the remaining half is not necessary (as shown in the adjacent figure).  
事实上，如果在 t0 和 t1 之间走过一半距离后，体积的透明度低于 1e-3，那么就可以认为没有必要计算剩余一半距离的样本（如下图所示）。  
You can do so by just breaking out from the ray-marching loop as soon as you detect that the transparency variable is lower than this minimum threshold (see pseudo-code below).  
只要检测到透明度变量低于最小阈值，就可以跳出光线行进循环（见下面的伪代码）。  
Considering that ray-marching is a rather slow computational method, we should use this optimization; it will save a lot of time particularly when volumetric objects are rather dense (the denser they are, the quicker the transparency drops).  
考虑到光线行进是一种相当慢的计算方法，我们应该使用这种优化方法；它可以节省大量时间，尤其是在体积物体相当密集的情况下（密度越大，透明度下降越快）。  
We mentioned in the previous chapter that this is one of the reasons why we might prefer the forward over backward integration method.  
我们在上一章提到过，这就是为什么我们更倾向于使用前向积分法而不是后向积分法的原因之一。

```
...
float transparency = 1;
// marching along the ray
for (int n = 0; n < ns; ++ns) {
    ...
    if (transparency < 1e-3)
        break;
}
```

![[693a1c001a51d3b09e97316be02fefdc_MD5.png]]

**Figure 5:** a visualization of the Russian roulette technique. We break out from the ray-marching loop as soon as the transparency gets below a certain threshold but that means that our result is "clamped". How do we fix this problem?  
图 5：俄罗斯轮盘赌技术的可视化。一旦透明度低于某个临界值，我们就会跳出光线行进循环，但这意味着我们的结果被 "箝制 "了。如何解决这个问题呢？

Now you can stop ray-marching when we pass this transparency test and do nothing else however this would be "statistically" wrong. This would somehow introduce some bias in your rendered image. This is more easily understood if you look at figure xx.  
现在，您可以在我们通过透明度测试后停止光线引导，而不做其他任何事情，但这在 "统计学上 "是错误的。这会在渲染图像中引入一些偏差。如果看一下图 xx，就更容易理解了。  
As you can see, the red line indicates the threshold below which we stop ray-marching. If we do so, we sort of remove the contribution of the volume that's below and beyond the curve (along the x-axis).  
如图所示，红线表示临界值，低于该临界值，我们将停止射线追踪。如果我们这样做，就会消除曲线（沿 X 轴）下方和上方的体积贡献。  
Sure, the amount is somehow"negligible"and that's why we decided to implement that cutoff solution in the first place, however, if you are a thermonuclear engineer trying to simulate how neutrons move through a plate, this is not acceptable.  
当然，这个数量在某种程度上是 "可以忽略不计 "的，这也是我们一开始就决定采用这种截止解决方案的原因，但是，如果你是一名热核工程师，试图模拟中子是如何在板中移动的，这种情况是不可接受的。  
So how can we still take advantage of this optimization while still satisfying the thermonuclear engineer's expectations?  
那么，如何才能在满足热核工程师期望的同时，还能利用这种优化呢？

The method we will be using is called the **Russian roulette** which we have already talked about already in the lesson dedicated to [Monte Carlo methods](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/monte-carlo-methods-in-practice/monte-carlo-simulation.html). The idea is to apply the Russian roulette technique when the transparency value is lower than some threshold for example 1e-3. Then we pick a random number (uniformly distributed) in the range [0, 1] and test whether this random number is greater than 1/d where d is some positive real number (integer but doesn't have to be) greater than 1 (it can be equal to 1 but the test would be useless then).  
我们要使用的方法叫做俄罗斯轮盘赌，在蒙特卡罗方法的专门课程中已经讲过。我们的想法是，当透明度值低于某个阈值（例如 1e-3）时，应用俄罗斯轮盘赌技术。然后，我们在 [0, 1] 范围内选取一个随机数（均匀分布），并测试这个随机数是否大于 1/d，其中 d 是某个大于 1 的正实数（整数，但不一定是）（可以等于 1，但这样测试就没用了）。  
If this is the case, we break out from the loop, otherwise, we continue, however, we multiply the current transparency value by d. The value d here represents the likelihood that we will pass the test.  
如果是这种情况，我们就跳出循环，否则，我们就继续，不过，我们要将当前的透明度值乘以 d。  
For example for d = 5, the"chances" of the ray-marching loop being terminated would be 4 out of 5.  
例如，当 d = 5 时，射线行进循环被终止的 "几率 "为五分之四。

This makes (hopefully sense). If the random number is lower than 1/d you kill say the photon. It's gone. You can't do anything with it anymore.  
这样做（希望有意义）。如果随机数小于 1/d，你就杀死了光子。它就消失了。你再也无法对它做任何事情。  
But in exchange for killing it, we will give more power to the ones that survived the test (increase the transparency value in our case), Inversely proportionally to the likelihood of photons being killed. Here is the idea put into code:  
但作为杀死光子的交换条件，我们会给那些通过测试的光子更多的能量（在我们的例子中增加透明度值），这与光子被杀死的可能性成反比。以下是代码中的想法：

```
...
float transparency = 1;
// marching along the ray
int d = 2; // the greater the value the more often we will break out from the marching loop
for (int n = 0; n < ns; ++ns) {
    ...
    if (transparency < 1e-3) {
        if (rand() > 1.f / d) // we stop here
            break;
        else
            transparency *= d; // we continue but compensate
   }
}
```

This is a quick explanation of the Russian roulette technique, which, as already mentioned, is used in Monte Carlo simulation and integration. Please check these lessons for a more detailed explanation if you need to.  
这是对俄罗斯轮盘赌技术的快速解释，如前所述，该技术用于蒙特卡罗模拟和积分。如果需要更详细的解释，请查阅这些课程。

## Reading Other People's Code!  
阅读他人的代码

The first three chapters of this lesson cover what's needed to start rendering volumes. To a point where, if you are confronted with reading other people's code, you should now be able to make sense of what's going on. Let's do this exercise together.  
本课的前三章涵盖了开始渲染卷所需的内容。如果你在阅读别人的代码时遇到问题，你现在应该能够理解其中的含义了。让我们一起来做这个练习。  
We will be using an open-source project called PBRT and looking at its implementation of volume rendering. There should be no secret for you in there any longer.  
我们将使用一个名为 PBRT 的开源项目，并研究它对体积渲染的实现。这对你来说已经没有什么秘密可言了。

PBRT is a research/educational project that took more or less the same approach as Scratchapixel: to teach rendering by example. However, PBRT comes as a completely integrated renderer whereas, with Scratchapixel, each technique is implemented in a self-contained example program.  
PBRT 是一个研究/教育项目，采用的方法与 Scratchapixel 大致相同：通过实例教授渲染。不过，PBRT 是一个完全集成的渲染器，而 Scratchapixel 则是在一个独立的示例程序中实现每种技术。  
Moreover, PBRT was designed for Master/Ph. D. students with the idea that they could use PBRT to implement their research. Most of the equations in PBRT's book are given without much explanation. The book assumes you have the necessary background to read and understand them.  
此外，PBRT 是为硕士/博士研究生设计的，他们可以利用 PBRT 开展研究。PBRT 书中的大部分方程式都没有给出太多解释。该书假定你有必要的背景知识来阅读和理解它们。  
Whereas, Scratchapixel aims to teach computer graphics to everyone. We do believe [PBRT's book](https://pbr-book.org/) is now online and free for anyone to read. the renderer's source code is available on [GitHub](https://github.com/mmp).  
而 Scratchapixel 则旨在向所有人传授计算机图形学知识。我们相信，PBRT 的书现在已经上线，任何人都可以免费阅读。渲染器的源代码可在 GitHub 上获取。

Besides being a little more complicated than Scratchapixel, it is a reference for students and engineers working in the field.  
除了比 Scratchapixel 稍为复杂之外，它还是学生和从事该领域工作的工程师的参考资料。  
It is still maintained by the authors of the first edition (published in 2004, Scratchapixel started around 2007), Math Pharr, Greg Humphreys, and Pat Hanrahan (more people contributed to the following editions) who keep updating the book and the code with the most recent techniques.  
该书目前仍由第一版（2004 年出版，Scratchapixel 于 2007 年左右开始）的作者 Math Pharr、Greg Humphreys 和 Pat Hanrahan（之后的版本有更多人参与）维护，他们不断用最新技术更新书中内容和代码。

Don't worry if you still find this code overwhelming. It may have taken us years to get familiar with all these concepts.  
如果您仍然觉得这些代码难以理解，请不要担心。我们可能花了很多年才熟悉所有这些概念。  
However, we hope that with the explanations given in this lesson, you will be able to follow the broad structure of this code, be able to understand what it does, and get a"now I finally get it" moment).  
不过，我们希望通过本课的讲解，您能够掌握代码的大致结构，理解代码的作用，并产生 "现在我终于明白了 "的感觉）。

```
Spectrum SingleScatteringIntegrator::Li(const Scene *scene, 
    const Renderer *renderer, const RayDifferential &ray, 
    const Sample *sample, RNG &rng, Spectrum *T, 
    MemoryArena &arena) const {

// [comment]
// Find the intersection boundaries (t0, t1) with the volume object. If the ray doesn't
// intersect the volumetric object, then set the transmission to 1 and return 0 as a color.
// [/comment]

    VolumeRegion *vr = scene->volumeRegion;
    float t0, t1;
    if (!vr || !vr->IntersectP(ray, &t0, &t1) || (t1-t0) == 0.f) {
        *T = 1.f;
        return 0.f;
    }

// [comment]
// If we have an intersection. Set the global transmission (transparency) to 1, and the variable
// in which we will store the final color (named Lv here) to 0. Compute the number of samples
// and adjust the step size accordingly.
// [/comment]

    // Do single scattering volume integration in _vr_
    Spectrum Lv(0.);

    // Prepare for volume integration stepping
    int nSamples = Ceil2Int((t1-t0) / stepSize);
    float step = (t1 - t0) / nSamples;
    Spectrum Tr(1.f);
    Point p = ray(t0), pPrev;
    Vector w = -ray.d;
    t0 += sample->oneD[scatterSampleOffset][0] * step;

    // Compute sample patterns for single scattering samples
    float *lightNum = arena.Alloc<float>(nSamples);
    LDShuffleScrambled1D(1, nSamples, lightNum, rng);
    float *lightComp = arena.Alloc<float>(nSamples);
    LDShuffleScrambled1D(1, nSamples, lightComp, rng);
    float *lightPos = arena.Alloc<float>(2*nSamples);
    LDShuffleScrambled2D(1, nSamples, lightPos, rng);
    uint32_t sampOffset = 0;

// [comment]
// Ray-march (forward). This is the main loop, where we will loop over the segments and
// calculate each sample's respective opacity and in-scattering contribution to the
// final volume transparency (Tr) and color (Lv).
// [/comment]

    for (int i = 0; i < nSamples; ++i, t0 += step) {
        // Advance to sample at _t0_ and update _T_

// [comment]
// Update the sample position. Then evaluate the density at that point in the volume.
// We haven't studied this part yet. This is the topic of the next two chapters. For now,
// consider that the variable stepTau is the density variable from our code.
// The sample position is jittered. Then apply Beer's law to attenuate our global
// transmission variable (Tr) with our current sample's opacity.
// [/comment]

        pPrev = p;
        p = ray(t0);
        Ray tauRay(pPrev, p - pPrev, 0.f, 1.f, ray.time, ray.depth);
        Spectrum stepTau = vr->tau(tauRay,
            .5f * stepSize, rng.RandomFloat());
        Tr *= Exp(-stepTau);

// [comment]
// Apply the russian-roulette technique.
// [/comment]

        // Possibly terminate ray marching if transmittance is small
        if (Tr.y() < 1e-3) {
            const float continueProb = .5f;
            if (rng.RandomFloat() > continueProb) {
                Tr = 0.f;
                break;
            }
            Tr /= continueProb;
        }

// [comment]
// We survived. Let's compute the in-scattering contribution for that sample. Normally
// one could calculate the contribution of each light in the scene. However, this code
// uses a different technique. It selects one light randomly and calculates the contribution
// of that one single light instead. This is another example of Monte Carlo integration.
// Don't worry too much about this for now. We will study this in a future lesson.
// [/comment]

        // Compute single-scattering source term at _p_
        Lv += Tr * vr->Lve(p, w, ray.time);
        Spectrum ss = vr->sigma_s(p, w, ray.time);
        if (!ss.IsBlack() && scene->lights.size() > 0) {
            int nLights = scene->lights.size();
            int ln = min(Floor2Int(lightNum[sampOffset] * nLights),
                nLights-1);
            Light *light = scene->lights[ln];
            // Add contribution of _light_ due to scattering at _p_
            float pdf;
            VisibilityTester vis;
            Vector wo;
            LightSample ls(lightComp[sampOffset], lightPos[2*sampOffset],
                lightPos[2*sampOffset+1]);

// [comment]
// Calculate the light color (color * intensity, etc.)
// [/comment]

            Spectrum L = light->Sample_L(p, 0.f, ls, ray.time, 
                &wo, &pdf, &vis);
            
            if (!L.IsBlack() && pdf > 0.f && vis.Unoccluded(scene)) {

// [comment]
// Multiply the light color by the light transmission value (how much light is left
// after it has traveled through the volume to the sample point). Beer's law is
// applied in the Transmittance function (code not shown here but you can check
// PBRT source code).
// [/comment]

                Spectrum Ld = L * vis.Transmittance(scene, 
                    renderer, NULL, rng, arena);

// [comment]
// Then add the in-scattering contribution to our final color. Note here that we
// multiply by all the right terms: Tr (the volume current transparency value),
// ss (the scattering term), vr->p (the phase function), Ld (the light contribution,
// the Li(x) term). Forget about the other terms, they have to do with the Monte Carlo
// integration method we talked about earlier. Note: we don't multiply by the step size
// here because it's done at the very end. Outside the ray-marching loop.
// [/comment]

                Lv += Tr * ss * vr->p(p, w, -wo, ray.time) * Ld * 
                    float(nLights) / pdf;
            }
        }
        ++sampOffset;
    }
    *T = Tr;

// [comment]
// Finally multiply the final color by the step size. In our code, we've done it in the
// ray-marching loop for clarity. But for optimization, you might want to do it at
// the very end which is what they decided to do here.
// [/comment]

    return Lv * step;
}
```

## Source Code 源代码

The source code for this chapter is available at the end of the lesson. And it should produce the following image. Note that in this version of the code the light color has higher values.  
本章的源代码可在本课末尾获取。生成的图像如下。请注意，在这一版本的代码中，浅色的值更高。  
The phase function introduces a division by which is the reason why we now need to increase the light color a lot.  
相位函数引入了除法，这就是我们现在需要大量增加光色的原因。

![[bc39b007bf58e406cca6aad7db0f762e_MD5.png]]

## Exercises 练习

*   You can test that the russian roulette method works?  
    你能证明俄罗斯轮盘赌法有效吗？
    
*   Make the code work for an arbitrary number of lights?  
    让代码适用于任意数量的灯光？
    
*   Move the camera around using matrices. Deform the volume sphere using matrices as well (try to squeeze/squash the sphere). You can find some clues on how to do that in this lesson: [Transform Objects using Matrices](https://www.scratchapixel.com/lessons/3d-basic-rendering/transforming-objects-using-matrices/using-4x4-matrices-transform-objects-3D.html).  
    使用矩阵移动摄像机。也可以使用矩阵对体积球体进行变形（尝试挤压/挤扁球体）。您可以在 "使用矩阵变换对象 "这一课中找到一些相关线索。
    
*   Make it work with the camera inside the volume.  
    使其与音量内的摄像头配合使用。
    
*   Replace the sphere with a cube.  
    用立方体代替球体。
    
*   Add a timer, to measure how slow volume rendering is. This will be most noticeable in the next chapter.  
    添加一个计时器，以测量音量渲染的速度有多慢。这在下一章中将最为明显。
    

## What's next? 下一步是什么？

Congratulation if you made it that far. You graduated and Scratchapixel is delivering you a virtual certificate with honors. The core of how these algorithm works has been covered.  
如果你成功了，恭喜你。你已经毕业了，Scratchapixel 将为你颁发荣誉虚拟证书。我们已经介绍了这些算法的核心工作原理。  
The remaining chapters are more about using what we have learned and built so far, to finally have some fun and make some cool images.  
剩下的章节更多的是利用我们迄今为止所学到的知识和所构建的模型，最终获得一些乐趣并制作出一些很酷的图像。  
Finally, in the last chapter, we will take everything we have learned so far, and see how it translates into the actual equations used to describe the flux of light energy as it travels through and interacts with a participating medium (air, smoke, cloud, water, etc.)  
最后，在最后一章中，我们将把迄今为止所学到的所有知识转化为实际方程，以描述光能穿过参与介质（空气、烟雾、云、水等）并与之相互作用时的通量。