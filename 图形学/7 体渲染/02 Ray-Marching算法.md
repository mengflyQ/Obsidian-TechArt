## The Ray-Marching Algorithm  
射线步进算法

**Reading time: 19 mins. 阅读时间：19 分钟**

## The almighty ray-marching algorithm  
万能的射线步进算法

To integrate incoming light along the ray due to in-scattering, we will break down the volume that the ray passes through into small volume elements and combine the contribution of each of these small volume elements to the overall volume object, a little bit like when we stack images with a mask or alpha channel (generally representing the objects' opacity) onto each other in a 2D editing software (such as Photoshop).  
为了整合因内散射而沿光线射入的光线，我们会将光线经过的体积分解成小体积元素，并将每个小体积元素对整个体积对象的贡献合并在一起，这有点像我们在二维编辑软件（如 Photoshop）中将带有遮罩或 alpha 通道（一般代表对象的不透明度）的图像堆叠在一起。  
That is why we spoke about the alpha compositing method in the first chapter. Each one of these small volume elements represents a sample in the Riemann sum mentioned in the first chapter.  
这就是我们在第一章中谈到阿尔法合成法的原因。这些小体积元素中的每一个都代表了第一章中提到的黎曼和中的一个样本。

![[fcf27b9058ebe22f6ffbc8f798645fc8_MD5.gif]]

**Figure 1:** backward ray-marching. Marching along the ray in small regular steps forward, from t1 to t0.  
图 1：后向射线步进。沿着射线有规律地向前行进一小步，从 t1 到 t0。

The algorithm works as follows:  
该算法的工作原理如下

1. Find the value for t0 and t1, the points where the camera/eye ray enters and leaves the volume object.  
1. 找出 t0 和 t1 的值，即摄像机/眼睛光线进入和离开体积物体的点。

2. Divide the segment defined by t0-t1 into X number of smaller segments of identical size. Generally, we do so by choosing what we call a **step size**, which is nothing else than a floating number defining the length of the smaller segment.  
2. 将 t0-t1 所定义的线段分成 X 个大小相同的小线段。一般来说，我们可以通过选择所谓的步长来做到这一点，步长只是一个浮动数字，它定义了较小线段的长度。  
So for instance, if t0=2.5, t1=8.3, and the step size = 0.25, we will divide the segment defined by t0-t1 by (8.3-2.5)/0.25=23 smaller segments (let's keep it simple for now, so don't worry about the decimals).  
例如，如果 t0=2.5，t1=8.3，步长=0.25，那么我们将 t0-t1 所定义的线段划分为 (8.3-2.5)/0.25=23 个较小的线段（现在先保持简单，所以不用担心小数）。

3. What you do next is "march" along the camera ray X times, starting from either t0 or t1 (see bullet point #6 ).  
3. 接下来要做的是从 t0 或 t1 开始，沿着摄像机射线 X 次 "行进"（见要点 6）。

![[2fc2bd728d11f882bb88c4f178c4959c_MD5.png]]

**Figure 2:** computing Li (x) requires us to trace a ray in the direction of the light to know how far the light beam had to travel through the volume to get to our sample point.  
图 2：要计算 Li (x)，我们需要沿着光线的方向追踪一条射线，以了解光束要穿过体积多远才能到达我们的采样点。

5. Each time we take a step, we shoot a "light ray" starting from the middle of the step (our sample point) to the light. We compute where the light ray intersects (leaves) the volume element, and compute its contribution to the sample (due to in-scattering) using Beer's Law.  
5. 每走一步，我们都会从台阶中间（我们的采样点）向光线射出一条 "光线"。我们计算光线与体积元素相交（离开）的位置，并利用比尔定律计算其对样本的贡献（由于内散射）。  
Remember, light coming from the light source is absorbed by the volume as it travels through it to the sample point. This is the **Li (x)** value in the Riemann sum that we mentioned in the previous chapter. Don't forget that we need to multiply this value by step size which in the Riemann sum, corresponds to the **dx** term, the width of our rectangle. In pseudo-code we get:  
请记住，从光源射出的光线在穿过体积到达采样点的过程中会被体积吸收。这就是我们在上一章中提到的黎曼和中的 Li (x) 值。别忘了，我们需要用这个值乘以步长，在黎曼和中，步长对应于 dx 项，即我们矩形的宽度。伪代码如下

```
// compute Li(x) for current sample x
float lgt_t0, lgt_t1; // parametric distance to the points where the light ray intersects the sphere
volumeSphere->intersect(x, lgt_dir, t0, lgt_t1); // compute the intersection of the light ray with the sphere
color Li_x = exp(-lgt_t1 * sigma_a) * light_color * step_size; // step_size is our dx
...
```

As you can see in Figure 2, t0 for the light ray-sphere intersection test should always be 0 because the light ray starts from within the sphere, and t1 is the parametric distance to the point where the light ray intersects the sphere from our sample position x.  
如图 2 所示，光线与球面相交测试中的 t0 应该始终为 0，因为光线是从球面内开始的，而 t1 是光线从样本位置 x 到球面相交点的参数距离。  
So we can use that value in Beer's law equation for the distance over which light is absorbed by the volumetric object.  
因此，我们可以在比尔定律方程中使用该值来计算光被体积物体吸收的距离。

6. Then of course light passing through the small volume element (our sample) is attenuated as it passes through the sample as well.  
6. 当然，穿过小体积元件（我们的样品）的光在穿过样品时也会被衰减。  
So we compute the transmission value for our sample using the step size as the value for the distance traveled by the light beam through the volume in Beer's law equation. And then attenuate (multiply) the light amount (in-scattering) by this transmission value.  
因此，我们使用比尔定律方程中的步长作为光束穿过体积的距离值，来计算样品的透射值。然后用这个透射值衰减（乘以）光量（内散射）。

7. Finally we need to combine each one of the samples to account for their respective contribution to both the overall opacity and "color" of the volumetric object.  
7. 最后，我们需要将每个样本组合起来，以考虑它们各自对体积物体的整体不透明度和 "颜色 "的贡献。  
Indeed, if you think of this process backward (like shown in Figure 1), the first volume element (starting from t1) is occluded by the second, which is itself occluded by the third one, etc. until we reach the last element in the "queue" (the sample that's directly next to t0).  
事实上，如果把这个过程倒过来看（如图 1 所示），第一个体积元素（从 t1 开始）会被第二个体积元素遮挡，而第二个体积元素又会被第三个体积元素遮挡，如此反复，直到我们看到 "队列 "中的最后一个元素（紧挨着 t0 的样本）。  
If you look"through the camera"ray, the element directly next to t1 is occluded by all the elements that are in front of it. The sample that's just after the sample that's directly next to t0 is occluded by that very first sample, etc.  
如果您 "透过摄像机 "观看光线，紧挨着 t1 的元素会被它前面的所有元素遮挡。紧挨着 t0 的样本之后的样本会被第一个样本遮挡，等等。

The name "ray-marching" can easily be understood now: we march along the ray, taking small regular steps as shown in Figure 1 (an example of backward ray-marching). Please note that using regular steps is not a condition of the ray marching algorithm.  
现在，我们可以很容易地理解 "射线步进 "这个名称了：如图 1 所示，我们沿着射线步进，迈着有规律的小碎步（这是一个向后射线步进的例子）。请注意，使用规则步长并不是射线步进算法的条件。  
Steps can be irregular as well but to keep things simple for now, let's work with regular steps or strides (as Ken Musgrave liked to call them). When regular steps are used we speak of **uniform ray-maching** (as opposed to adaptive ray-marching).  
步长也可以是不规则的，但为了简单起见，我们先使用规则步长或步长（肯-马斯格雷夫喜欢这样称呼）。使用规则步长时，我们所说的是均匀射线步进（与自适应射线步进相反）。

We can combine samples in two ways: either **backward** (marching from t1 to t0) or **forward** (marching from t0 to t1). One is better than the other (sort of). We will now describe how they work.  
我们可以用两种方式组合样本：向后（从 t1 到 t0）或向前（从 t0 到 t1）。其中一种比另一种更好（算是吧）。下面我们将介绍它们的工作原理。

## Backward Ray-Marching. 后向射线步进

In backward ray-marching, we will march along the ray from back to front. In other words from t1 to t0. This changes the way we combine the samples to compute the final pixel opacity and color values.  
在后向射线步进中，我们将沿着射线从后向前行进。换句话说，就是从 t1 到 t0。这就改变了我们组合样本以计算最终像素不透明度和颜色值的方式。

Quite naturally, since we start from the back of the volumetric object (our sphere), we could initialize our pixel color (the color returned for that camera ray) with the background color (our bluish color).  
很自然，由于我们是从体积对象（我们的球体）的背面开始的，所以我们可以用背景色（我们的蓝色）来初始化我们的像素颜色（该摄像机光线返回的颜色）。  
But in our implementation, we will only combine the two at end of the process (once we have computed the volumetric object color and opacity), a little bit like when we compose two images in a 2D editing software.  
但在我们的实施过程中，我们只会在流程结束时（计算出体积对象的颜色和不透明度后）将两者结合起来，这有点像我们在二维编辑软件中合成两张图像的过程。

We will compute the contribution of our first sample (say X0) in the volume, starting as we mentioned from t1, and walk back to t0, taking regular steps (defined by step size).  
我们将计算第一个样本（比如 X0）在体积中的贡献，如前所述，从 t1 开始，按步长（由步长定义）走回 t0。

![[8e88a3a554d6362307abddb510253e55_MD5.png]]

**Figure 3:** to compute a sample, we need to account for light coming from the back (background color) and light from the light source due to in-scattering. Then account for the small volume element which is going to absorb part of these light contributions.  
图 3：要计算一个样本，我们需要考虑来自背面（背景色）的光线和光源因内散射产生的光线。然后再计算小体积元素对这些光的部分吸收。  
You can see this as an addition of the background color and the color coming from the light source multiplied by the small volume element transparency value.  
您可以将其视为背景颜色和光源颜色乘以小体积元素透明度值的加法。

What is the contribution of that sample?  
该样本的贡献是什么？

*   We will compute the in-scattering contribution (the contribution of the light source) Li (X0) as explained above (point #6 ): shooting a light ray in the direction of the light, then attenuate the light contribution using Beer's law to account for how much of the light is absorbed by the volumetric object as it traveled from the point where it entered the object (our volume sphere) to our sample point (X0).  
    我们将按照上面的解释（第 6 点）计算内散射贡献（光源贡献）Li (X0)：向光线方向发射光线，然后使用比尔定律衰减光线贡献，以计算光线从进入物体的点（我们的体积球）到取样点（X0）的过程中被体积物体吸收了多少。
    
*   Then, we need to multiply that light by the sample's transparency value (which represents how much of that light is being absorbed by the sample).  
    然后，我们需要将该光线乘以样品的透明度值（表示该光线被样品吸收的程度）。  
    The sample transparency is computed using Beer's law again, using step size as the distance traveled by the light beam through that sample (figure 3).  
    再次使用比尔定律计算样品的透明度，将步长作为光束穿过样品的距离（图 3）。
    

```
...
color Li_x0 = exp(-lgt_t1 * sigma_a) * light_color * step_size; // step_size is our dx
color x0_contrib = Li_x0 * exp(-step_size * sigma_a);
...
```

We've just computed our first sample X0. We then move to our second sample (X1), but now we have two sources of light that we need to account for: the light beam coming from the first sample X0 (our previous result), and the light beam passing through the second sample due to in-scattering, X1\.  
我们刚刚计算了第一个样本 X0。然后我们移动到第二个样本（X1），但现在我们需要考虑两个光源：来自第一个样本 X0 的光束（我们之前的结果），以及由于内向散射而穿过第二个样本的光束 X1\ 。  
We already computed the former (as we just said, that's our previous result) and we know how to render the latter. We sum them up and multiply this sum by the second sample transmission value. This becomes our new result. And we keep repeating this process with X2, X3, ... until we eventually reach t0\.  
我们已经计算出了前者（正如我们刚才所说，这是我们之前的结果），也知道如何呈现后者。我们将它们相加，再乘以第二个样本传输值。这就是我们的新结果。然后我们不断重复 X2、X3...... 直到最终得出 t0\.  
The final result is the contribution of the volumetric object to the current camera ray pixel's color. This process is illustrated below.  
最终结果是体积物体对当前摄像机光线像素颜色的贡献。该过程如下图所示。

![[6864fce3f7aeb1659c1321d1dc3d2f22_MD5.png]]

Note from the image above that we compute two values: the volume overall color (stored in the result) and the overall volume transparency.  
从上图可以看出，我们计算了两个值：体积的整体颜色（存储在结果中）和体积的整体透明度。  
We initialize this value to 1 (fully transparent) and then attenuate the value with each one of the sample transparency values as we walk up (or down) the ray (from t1 to t0). We can then (finally) use this overall transparency value to combine the volume object **over** our background color. We simply do:  
我们将该值初始化为 1（完全透明），然后在向上（或向下）移动射线（从 t1 到 t0）时，用每个透明度样本值来衰减该值。然后，我们就可以（最终）使用这个总体透明度值将体积对象与背景颜色结合起来。我们只需这样做

```
color final = background_color * transmission + result;
```

In compositing terms, we would say that the "result" term is already pre-multiplied by the volume overall transparency. But if this is confusing to you, we will clarify this point in the next chapter. So don't focus on this too much for now.  
在合成术语中，我们可以说 "结果 "项已经预先乘以了体积的整体透明度。但如果您对此感到困惑，我们将在下一章中加以说明。所以现在不要太在意这一点。

Note also that both in the image above and in the code below the attenuation term of the samples is always the same: `exp(-step_size * sigma_a)`. Of course, this is not efficient. You should compute this term once, store it in a variable, and use that variable instead. But clarity is our goal, not writing performant code.  
还请注意，在上图和下面的代码中，样本的衰减项始终是相同的： `exp(-step_size * sigma_a)` .. 当然，这样做并不高效。您应该计算一次衰减项，将其存储在一个变量中，然后使用该变量。但我们的目标是清晰，而不是编写高效代码。  
Besides, for now, this value is constant as we march along the ray but we will discover in the next chapters that it will eventually vary from sample to sample.  
此外，就目前而言，当我们沿着射线前进时，这个值是恒定的，但我们会在接下来的章节中发现，它最终会因样本的不同而变化。

This is what it looks like translated into code:  
翻译成代码就是这个样子：

```
constexpr vec3 background_color{ 0.572f, 0.772f, 0.921f };

vec3 integrate(const vec3& ray_orig, const vec3& ray_dir, ...) {
    const Object* hit_object = nullptr;
    IsectData isect;
    for (const auto& object : objects) {
        IsectData isect_object;
        if (object->intersect(ray_orig, ray_dir, isectObject)) {
            hit_object = object.get();
            isect = isect_object;
        }
    }

    if (!hit_object) 
        return background_color;

    float step_size = 0.2;
    float sigma_a = 0.1; // absorption coefficient
    int ns = std::ceil((isect.t1 - isect.t0) / step_size);
    step_size = (isect.t1 - isect.t0) / ns;

    vec3 light_dir{ 0, 1, 0 };
    vec3 light_color{ 1.3, 0.3, 0.9 };

    float transparency = 1; // initialize transparency to 1
    vec3 result{ 0 }; // initialize the volume color to 0

    for (int n = 0; n < ns; ++n) {
        float t = isect.t1 - step_size * (n + 0.5);
        vec3 sample_pos= ray_orig + t * ray_dir; // sample position (middle of the step)

        // compute sample transparency using Beer's law
        float sample_transparency = exp(-step_size * sigma_a);
        
        // attenuate global transparency by sample transparency
        transparency *= sample_transparency;

        // In-scattering. Find the distance traveled by light through 
        // the volume to our sample point. Then apply Beer's law.
        IsectData isect_vol;
        if (hitObject->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) {
            float light_attenuation = exp(-isect_vol.t1 * sigma_a);
            result += light_color * light_attenuation * step_size;
        }

        // finally attenuate the result by sample transparency
        result *= sample_transparency;
    }

    // combine with background color and return
    return background_color* transparency + result;
}
```

But mindful of this code. It's not accurate yet. It's missing a few terms that we will be looking at in the next chapter. For now, we just want you to understand the principle of ray-marching. Yet this code will produce a convincing image.  
但要注意这个代码。它还不准确。它缺少了一些我们将在下一章学习的术语。现在，我们只想让你理解射线步进的原理。然而，这段代码将生成一幅令人信服的图像。

![[7a7e8bc3f27ecc1f170bf02f4867a98e_MD5.png]]

Note that in this example, we've been using a top-down distant light (light direction is upward along the y-axis). The reddish color of the sphere comes from the light color. You can see that the top half of the sphere is brighter than the bottom half.  
请注意，在本例中，我们使用的是自上而下的远距离光线（光线方向沿 Y 轴向上）。球体的红色来自光线的颜色。您可以看到球体的上半部分比下半部分更亮。  
The shadowing effect is visible already.  
阴影效果已经显现。

Let's see again what happens to the samples as we march along the ray:  
让我们再来看看，当我们沿着射线前进时，样本会发生什么变化：

If you look at what happens to just as we go through the loop, you can observe that it gets multiplied by the sample attenuation raised to some power.  
如果你观察一下我们通过环路时发生了什么，就会发现它被样本衰减乘以一定的功率。  
The more we march along the ray, the higher the exponent (first 1, then 2, then 3, ...) and thus the smaller the result (since the attenuation or sample transparency is lower than 1).  
我们沿着射线走得越多，指数就越高（首先是 1，然后是 2，然后是 3，......），因此结果就越小（因为衰减或样本透明度低于 1）。  
In other words, the contribution of the first sample to the overall resulting light scattered by the volume decreases as more samples are accumulated.  
换句话说，随着样品数量的增加，第一个样品对由体积产生的整体散射光的贡献也会减少。

## Forward Ray-Marching. 前进射线行军

![[749af0d2532b4ffbd581f37105486f0e_MD5.gif]]

**Figure 4:** forward ray-marching. Marching along the ray in small regular steps forward, from t0 to t1.  
图 4：正向射线步进。从 t0 到 t1，沿着射线有规律地向前行进一小步。

There is no difference with backward ray-marching when it comes to computing Li (x) and the sample's transmission value. What is different is how we combine samples because this time around, we will march from t0 to t1 (from front to back).  
在计算 Li (x) 和样本透射值时，后向射线步进与前向射线步进没有区别。不同的是我们如何组合样本，因为这次我们将从 t0 向 t1（从前向后）行进。  
In forward ray-marching, the contribution of light scattered by a sample has to be attenuated by the overall transmission (transparency) value of all samples (including the current one) that we've been processing so far: Li (X1) is attenuated by the transmission values of the samples X0 and X1, Li (X2) is occluded by the transmission values of the samples X0, X1, and X2, etc.  
在正向射线步进过程中，一个样品的散射光必须被我们迄今为止处理过的所有样品（包括当前样品）的总体透射（透明度）值所衰减：Li (X1) 被样本 X0 和 X1 的透射值衰减，Li (X2) 被样本 X0、X1 和 X2 的透射值遮挡，等等。  
Here is a description of the algorithm:  
下面是算法说明：

*   Step 1: before we enter the ray-marching loop: initialize the overall transmission (transparency) value to 1 and the result color variable to 0 (the variable that stores the volumetric object color for the current camera ray): `float transmission = 1; color result = 0;`.  
    步骤 1：在进入射线步进循环之前：将整体传输（透明度）值初始化为 1，将结果颜色变量初始化为 0（该变量用于存储当前摄像机射线的体积对象颜色）： `float transmission = 1; color result = 0;` .
    
*   Step 2: for each iteration in the ray-marching loop:  
    步骤 2：射线步进循环中的每个迭代：
    
    *   Compute in-scattering for the current sample: Li (x).  
        计算当前样本的内散射：Li (x).
        
    *   Update the overall transmission (transparency) value by multiplying it by the current sample transmission value: `transmission *= sample_transmission`.  
        将总体传输（透明度）值乘以当前样本传输值，从而更新总体传输（透明度）值： `transmission *= sample_transmission` .
        
    *   Multiply Li (x) by the overall transmission (transparency) value: light scattered by the sample is occluded by all samples (including the current sample) that we've been processing so far.  
        用 Li (x) 乘以总体透射（透明度）值：样本散射的光被我们目前处理过的所有样本（包括当前样本）遮挡。  
        Add the result to our global variable that stores the volume color for the current camera ray: `result += Li(x) * transmission`.  
        将结果添加到我们的全局变量中，该变量用于存储当前摄像机光线的体积颜色： `result += Li(x) * transmission` .
        

![[661daa73adcb7eeab19935e57e23345a_MD5.png]]

Translated into code: 翻译成代码：

```
...
vec3 integrate(const vec3& ray_orig, const vec3& ray_dir, ...) {
    ...
    float transparency = 1; // initialize transparency to 1
    vec3 result{ 0 }; // initialize the volume color to 0

    for (int n = 0; n < ns; ++n) {
        float t = isect.t0 + step_size * (n + 0.5);
        vec3 sample_pos = ray_orig + t * ray_dir;

        // current sample transparency
        float sample_attenuation = exp(-step_size * sigma_a);

        // attenuate volume object transparency by current sample transmission value
        transparency *= sample_attenuation;

        // In-Scattering. Find the distance traveled by light through 
        // the volume to our sample point. Then apply Beer's law.
        if (hit_object->intersect(sample_pos, light_dir, isect_vol) && isect_vol.inside) {
            float light_attenuation = exp(-isect_vol.t1 * sigma_a);
            // attenuate in-scattering contrib. by the transmission of all samples accumulated so far
            result += transparency * light_color * light_attenuation * step_size;
        }
    }

    // combine background color and volumetric object color
    return background_color * transparency + result;
}
```

But mindful of this code. It's not accurate yet. It's missing a few terms that we will be looking at in the next chapter. For now, we just want you to understand the principle of ray-marching. Yet this code will produce a convincing image.  
但要注意这个代码。它还不准确。它缺少了一些我们将在下一章学习的术语。现在，我们只想让你理解射线步进的原理。然而，这段代码将生成一幅令人信服的图像。

No need to show an image here. If we've done it right, backward and forward ray-marching should give the same result. Ok, we knew you wouldn't take this for granted, so here are the results.  
这里无需显示图像。如果我们操作得当，后向和前向射线步进的结果应该是一样的。好了，我们知道你不会想当然地认为这就是结果。

![[fea726e14f6157dfbc036e9834cf84ec_MD5.png]]

## Why is forward ray-marching "better" than backward ray-marching?  
为什么正向射线步进比反向射线步进 "更好"？

Because we can stop ray-marching as soon as the transparency of the volume gets very close to 0 (which would happen if the volume is large enough and/or the scattering coefficient is high enough). And this is possible only if you ray-march moving forward.  
因为只要体积的透明度非常接近 0（如果体积足够大和/或散射系数足够高，就会出现这种情况），我们就可以停止射线步进。而这只有在射线步进的过程中才能实现。

Right now, rendering our volume sphere is rather quick but you will see as we progress through the chapters that it will eventually get slow.  
现在，渲染体积球的速度相当快，但随着章节的推进，你会发现渲染速度最终会变慢。  
So, if we can avoid computing samples that aren't contributing to the pixel's color because we reached a point as we march along the ray where we know that the volume is opaque, then it's a good optimization.  
因此，如果我们可以避免计算那些对像素颜色没有贡献的样本，因为我们在沿着射线步进的过程中到达了一个点，我们知道体积是不透明的，那么这就是一个很好的优化。

We will implement this idea in the next chapter.  
我们将在下一章实现这一想法。

## Choosing the Step Size 选择步长

![[8149a40076f8a74b7814da2a8bdaba4e_MD5.png]]

**Figure 5:** we are not capturing the small details in the volume because our step size is too big. Of course, this example is extreme, but it was designed to help you get the idea.  
图 5：我们没有捕捉到体积中的小细节，因为我们的步长太大了。当然，这个例子很极端，但它的目的是帮助你理解。

![[62584b65f3bbe3a80fec9b49f04da613_MD5.png]]

**Figure 6:** though is example is also extreme (2 samples might never be enough to properly render the lighting of a volumetric object) you can see that we don't have enough samples to capture part of the volumetric object that is in the shadow of the solid object.  
图 6：虽然这个例子也很极端（2 个样本可能永远不足以正确渲染体积物体的光照），但可以看到我们没有足够的样本来捕捉实体物体阴影中的部分体积物体。  
We would need a much small step size.  
我们需要更小的步长。

Remember that the reason why we ray-marching, take small steps from t0 to t1 is to estimate an integral (the amount of light scattered towards the eye along the camera ray due to in-scattering) using the Riemann sum method. As explained in the chapter before and in the lesson [the mathematics of shading](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/mathematics-of-shading/mathematics-of-shading.html), the larger the rectangles (the width of the rectangles in our case are defined by the step size here) used to estimate the integral the less accurate the approximation.  
请记住，我们之所以采用射线步进的方式，从 t0 到 t1 小步前进，是为了使用黎曼和法估算一个积分（由于内向散射，沿摄像机光线向眼睛散射的光量）。正如前一章和 "阴影的数学 "一课中所解释的，用于估算积分的矩形（在我们的例子中，矩形的宽度由这里的步长定义）越大，近似值就越不精确。  
Or the other way around: the smaller the rectangle (the smaller the step size) the more accurate the estimation, but of course the longer it takes to calculate.  
反之亦然：矩形越小（步长越小），估算就越准确，当然计算时间也越长。  
For now, rendering our volumetric sphere is rather fast, but as we progress through the lesson, you will see that it will eventually get much much slower. This is why choosing the step size is a tradeoff between speed and accuracy.  
目前，渲染体积球体的速度相当快，但随着本课的深入，你会发现渲染速度最终会大大降低。这就是为什么要在速度和精度之间权衡选择步长的原因。

For now, we assume the volume density is also uniform. In the next chapters, we will see that to render volume density such as clouds or smoke, the density varies through space. Such volumes are made of large frequency features but also smaller ones.  
现在，我们假设体积密度也是均匀的。在接下来的章节中，我们将看到，要呈现云或烟等体积密度，密度在空间中是变化的。这些体积由大频率特征和小频率特征组成。  
If the step size is too large it might eventually fail to capture some of these smaller frequency features (Figure 5). This is a **filtering** issue, an important but complex topic on its own.  
如果步长过大，最终可能无法捕捉到一些较小的频率特性（图 5）。这是一个滤波问题，本身就是一个重要而复杂的课题。

Another problem might arise that requires tweaking the step size: **shadows**. If small solid objects are casting shadows on the volumetric object, you will eventually miss them if the step size is too large (Figure 6).  
可能会出现另一个需要调整步长的问题：阴影。如果小的实体物体在体积物体上投射阴影，如果步长过大，最终就会错过（图 6）。

All that doesn't tell us how to choose a good step size. In theory, there's no rule. You should essentially have an idea of the size of your volumetric object.  
所有这些并没有告诉我们如何选择一个好的步幅。从理论上讲，没有规则可言。你基本上应该对体积物体的大小有所了解。  
For example, if it's a rectangle filling up a room with some kind of uniform atmosphere, you should get an idea of the size of that room (and of the kind of units you use, like 1 unit = 10 centimeters for example).  
例如，如果一个长方形的房间里弥漫着某种均匀的气氛，你就应该知道这个房间的大小（以及你使用的单位种类，例如 1 单位 = 10 厘米）。  
So if the room is 100 units large, a step size of 0.1 might be too small whereas 1 or 2 might be a good place to start. Then you need to fiddle around to find a good tradeoff between speed and accuracy as we mentioned before.  
因此，如果房间有 100 个单位大，0.1 的步长可能太小，而 1 或 2 的步长可能是个不错的起点。然后，就像我们之前提到的那样，你需要不断摸索，在速度和精确度之间找到一个很好的平衡点。

Now, this is not entirely true either. While choosing the step size empirically by considering how big the objects are in the scene, there must be a more rational way of doing so.  
现在看来，这也不完全正确。虽然我们可以根据场景中物体的大小来凭经验选择步长，但一定有更合理的方法。  
One possible way is to consider "how big" is the pixel at the distance where we enter the volume object and set the step size to the dimension of the projected pixel. Indeed, a pixel that is a discrete object can't represent details from the scene that are smaller than its size.  
一种可能的方法是，考虑在我们进入体积对象的距离处像素 "有多大"，并将步长设置为投影像素的尺寸。事实上，作为离散对象的像素无法表现小于其尺寸的场景细节。  
We won't get into much more detail here because filtering is worth a lesson on its own. All we will say, for now, is that a good step size is close to the projected size of a pixel at the point where the camera ray intersects the volume. This can be estimated with something like:  
我们在这里就不详细介绍了，因为滤波本身就值得上一课。现在我们要说的是，一个好的步长大小应接近摄像机光线与体积相交处的像素投影大小。这可以通过以下方法估算出来

```
float projPixWidth = 2 * tanf(M_PI / 180 * fov / (2 * imageWidth)) * tmin;
```

Which you can optimize if you wish to. Where `tmin` is the distance where the camera ray intersects the volume object. One could similarly compute the projected pixel width where the ray leaves the volume and linearly interpolate the projected pixel width at `tmin` and `tmax` to set the step size as we march along the ray.  
如果您愿意，可以对其进行优化。其中， `tmin` 是摄像机光线与物体相交的距离。同样，我们也可以计算光线离开体的投影像素宽度，并在 `tmin` 和 `tmax` 处对投影像素宽度进行线性插值，以设置沿射线步进时的步长。

## Other considerations of interest before we move on!  
在我们继续讨论之前，还有其他值得关注的问题！

Writing production code would require storing the ray opacity and color with the ray data.  
编写制作代码时需要将射线的不透明度和颜色与射线数据一起存储。  
So that we can ray-trace the solid objects first, then the volumetric objects and combine the result as we go (in a similar fashion to what we did by combining the background color with the volumetric sphere object in the example above).  
这样，我们就可以先对实体对象进行光线跟踪，然后再对体积对象进行光线跟踪，并在跟踪过程中将结果进行组合（与上例中将背景颜色与体积球体对象进行组合的方法类似）。

Note that several volumetric objects can be on the camera ray's path. Hence the necessity of storing the opacity along the way and combining the consecutive volumetric objects' opacity and color as we ray-march them.  
需要注意的是，摄像机光线路径上可能会出现多个体积物体。因此，我们有必要存储沿途的不透明度，并在射线步进过程中将连续的体积物体的不透明度和颜色结合起来。

A volumetric object can be made of a collection of combined objects such as cubes or spheres overlapping each other. In this case, we may want to combine them in some sort of aggregate structure.  
体积物体可以由多个组合物体（如相互重叠的立方体或球体）组成。在这种情况下，我们可能希望将它们组合成某种集合结构。  
Ray-marching such aggregates require computing the intersection boundaries of the objects making the aggregate with special care.  
要对这种聚合体进行射线步进，需要特别小心地计算组成聚合体的物体的交点边界。

## Next: add the missing terms to get a physically accurate result.  
下一步：添加缺失项，得到物理上准确的结果。

In the third/next chapter of this lesson, we will add some of the terms that are missing to our current implementation to get a result that's physically (more) accurate.  
在本课的第三章/下一章，我们将在当前的实现中添加一些缺失的术语，以获得物理上（更）准确的结果。  
We will also show you that equipped with this knowledge, you should now be ready to read and understand other's people renderer's code. Ready?  
我们还将向你展示，掌握了这些知识，你现在就可以阅读和理解其他人的渲染器代码了。准备好了吗？

## Source Code 源代码

The source code to reproduce the images of the first two chapters is available for download with compilation instructions (embedded within the file) in the last chapter of the lesson (as usual).  
复制前两章图像的源代码可在本课最后一章下载，并附有编译说明（嵌入在文件中）（与往常一样）。  
Be aware though the code is a bit different from the code snippets that were shown in this chapter. The differences are explained in the next chapter.  
请注意，这些代码与本章中展示的代码片段有些不同。下一章将解释这些不同之处。