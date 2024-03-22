# Ray-Marching 算法
射线步进


## 万能的 Ray-Marching 算法

为了整合因内散射而沿光线射入的光线，我们会将光线经过的体积分解成小体积元素，并将每个小体积元素对整个体积对象的贡献合并在一起，这有点像我们在二维编辑软件（如 Photoshop）中将带有遮罩或 alpha 通道的图像堆叠在一起。  这就是我们在第一章中谈到 alpha 混合法的原因。这些小体积元素中的每一个都代表了第一章中提到的黎曼和中的一个样本。

![[fcf27b9058ebe22f6ffbc8f798645fc8_MD5.gif]]
>图 1：后向射线步进。沿着射线有规律地向前行进一小步，从 t1 到 t0。


该算法的工作原理如下

1. 找出 t0 和 t1 的值，即摄像机/眼睛光线进入和离开体积对象的点。
2. 将 t0-t1 所定义的线段分成 X 个大小相同的小线段。一般来说，我们可以通过选择所谓的步长来做到这一点。
    - 步长只是一个浮动数字，它定义了较小线段的长度。例如，如果 t0=2.5，t1=8.3，步长=0.25，那么我们将 t0-t1 所定义的线段划分为 (8.3-2.5)/0.25=23 个较小的线段（现在先保持简单，所以不用担心小数）。
3. 接下来要做的是从 t0 或 t1 开始，沿着摄像机射线 X 次 "行进"（见要点 6）。

![[2fc2bd728d11f882bb88c4f178c4959c_MD5.png]]
>图 2：要计算 Li (x)，我们需要沿着光线的方向追踪一条射线，以了解光束要穿过体积多远才能到达我们的采样点。

5. 每走一步，我们都会**从台阶中间（我们的采样点）向光线**射出一条 "光线"。我们计算光线与体积元素相交（离开）的位置，并利用比尔定律计算其对样本的贡献（由于内散射）。  
    - 请记住，从光源射出的光线在穿过体积到达采样点的过程中会被体积吸收。这就是我们在上一章中提到的黎曼和中的 $Li (x)$ 值。**别忘了，我们需要用这个值乘以步长**，在黎曼和中，步长对应于 dx 项，即我们矩形的宽度。伪代码如下

```c++
// compute Li(x) for current sample x
float lgt_t0, lgt_t1; // parametric distance to the points where the light ray intersects the sphere
volumeSphere->intersect(x, lgt_dir, t0, lgt_t1); // compute the intersection of the light ray with the sphere
color Li_x = exp(-lgt_t1 * sigma_a) * light_color * step_size; // step_size is our dx
...
```

如图 2 所示，光线与球面相交测试中的 t0 应该始终为 0，因为光线是从球面内开始的，而 t1 是光线从样本位置 x 到球面相交点的参数距离。  因此，我们可以在比尔定律方程中使用该值来计算光被体积物体吸收的距离。

6. 当然，穿过小体积元件（我们的样品）的光在穿过样品时也会被衰减。因此，我们使用比尔定律方程中的步长作为光束穿过体积的距离值，来计算样品的透射值。然后用这个透射值衰减（乘以）光量（内散射）。
7. 最后，我们需要将每个样本组合起来，以考虑它们各自对体积物体的整体不透明度和 "颜色 "的贡献。  
    - 事实上，如果把这个过程倒过来看（如图 1 所示），第一个体积元素（从 t1 开始）会被第二个体积元素遮挡，而第二个体积元素又会被第三个体积元素遮挡，如此反复，直到我们看到 "队列 "中的最后一个元素（紧挨着 t0 的样本）。  如果您 "透过摄像机 "观看光线，紧挨着 t1 的元素会被它前面的所有元素遮挡。紧挨着 t0 的样本之后的样本会被第一个样本遮挡，等等。


现在，我们可以很容易地理解 "射线步进 "这个名称了：如图 1 所示，我们沿着射线步进，迈着有规律的小碎步（这是一个向后射线步进的例子）。请注意，使用规则步长并不是射线步进算法的条件。  步长也可以是不规则的，但**为了简单起见，我们先使用规则步长或步长**。使用规则步长时，我们所说的是**均匀射线步进**（与自适应射线步进相反）。

我们可以用两种方式组合样本：向后（从 t1 到 t0）或向前（从 t0 到 t1）。其中一种比另一种更好（算是吧）。下面我们将介绍它们的工作原理。

## 后向 Ray-Marching


在后向射线步进中，我们将沿着射线从后向前行进。换句话说，就是从 t1 到 t0。这就改变了我们组合样本以计算最终像素不透明度和颜色值的方式。

**很自然，由于我们是从体积对象（我们的球体）的背面开始的，所以我们可以用背景色（我们的蓝色）来初始化我们的像素颜色（该摄像机光线返回的颜色）。** 但在我们的实施过程中，我们只会在流程结束时（计算出体积对象的颜色和不透明度后）将两者结合起来，这有点像我们在二维编辑软件中合成两张图像的过程。

我们将计算第一个样本（比如 X0）在体积中的贡献，如前所述，从 t1 开始，按步长（由步长定义）走回 t0。

![[8e88a3a554d6362307abddb510253e55_MD5.png]]

图 3：要计算一个样本，我们需要考虑来自背面（背景色）的光线和光源因内散射产生的光线。然后再计算小体积元素对这些光的部分吸收。  您可以将其视为背景颜色和光源颜色乘以小体积元素透明度值的加法。


该样本的贡献是什么？

*     我们将按照上面的解释（第 6 点）计算内散射贡献（光源贡献）Li (X0)：向光线方向发射光线，然后使用比尔定律衰减光线贡献，以计算光线从进入物体的点（我们的体积球）到取样点（X0）的过程中被体积物体吸收了多少。
- 然后，我们需要将该光线乘以样品的透明度 (transparency)值（表示该光线被样品吸收的程度）。再次使用比尔定律计算样品的透明度，将步长作为光束穿过样品的距离（图 3）。
    

```c++
...
color Li_x0 = exp(-lgt_t1 * sigma_a) * light_color * step_size; // step_size is our dx
color x0_contrib = Li_x0 * exp(-step_size * sigma_a);
...
```


我们刚刚计算了第一个样本 X0。然后我们移动到第二个样本（X1），但现在我们需要考虑两个光源：来自第一个样本 X0 的光束（我们之前的结果），以及由于内向散射而穿过第二个样本的光束 X1\ 。  

我们已经计算出了前者（正如我们刚才所说，这是我们之前的结果），也知道如何呈现后者。我们将它们相加，再乘以第二个样本传输值。这就是我们的新结果。然后我们不断重复 X2、X3...... 直到最终得出 t0\.  

最终结果是体积物体对当前摄像机光线像素颜色的贡献。该过程如下图所示。

![[6864fce3f7aeb1659c1321d1dc3d2f22_MD5.png]]

**从上图可以看出，我们计算了两个值：体积的整体颜色（存储在结果中）和体积的整体透射率。**  

我们将该值初始化为 1（完全透明），然后在向上（或向下）移动射线（从 t1 到 t0）时，用每个透明度样本值来衰减该值。然后，我们就可以（最终）使用这个总体透明度值将体积对象与背景颜色结合起来。我们只需这样做

```c++
color final = background_color * transmission + result;
```


在合成术语中，我们可以说 "结果 "项已经预先乘以了体积的整体透明度。但如果您对此感到困惑，我们将在下一章中加以说明。所以现在不要太在意这一点。


还请注意，在上图和下面的代码中，样本的衰减项始终是相同的： `exp(-step_size * sigma_a)` .. 当然，这样做并不高效。您应该计算一次衰减项，将其存储在一个变量中，然后使用该变量。但我们的目标是清晰，而不是编写高效代码。 此外，就目前而言，当我们沿着射线前进时，这个值是恒定的，但我们会在接下来的章节中发现，它最终会因样本的不同而变化。


翻译成代码就是这个样子：

```c++
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


但要注意这个代码。它还不准确。它缺少了一些我们将在下一章学习的术语。现在，我们只想让你理解射线步进的原理。然而，这段代码将生成一幅令人信服的图像。

![[7a7e8bc3f27ecc1f170bf02f4867a98e_MD5.png]]


请注意，在本例中，我们使用的是自上而下的远距离光线（光线方向沿 Y 轴向上）。球体的红色来自光线的颜色。您可以看到球体的上半部分比下半部分更亮。阴影效果已经显现。


让我们再来看看，当我们沿着射线前进时，样本会发生什么变化：如果你观察一下我们通过 loop 时发生了什么，就会发现它被样本衰减乘以一定的功率。  我们沿着射线走得越多，指数就越高（首先是 1，然后是 2，然后是 3，......），因此结果就越小（因为衰减或样本透明度低于 1）。  **换句话说，随着样品数量的增加，第一个样品对由体积产生的整体散射光的贡献也会减少。**

## 前向 Ray-Marching

![[749af0d2532b4ffbd581f37105486f0e_MD5.gif]]
>图 4：正向射线步进。从 t0 到 t1，沿着射线有规律地向前行进一小步。


在计算 Li (x) 和样本透射值时，后向射线步进与前向射线步进没有区别。不同的是我们如何组合样本，因为这次我们将从 t0 向 t1（从前向后）行进。  

在正向射线步进过程中，一个样品的散射光必须被我们迄今为止处理过的所有样品（包括当前样品）的总体透射（透明度）值所衰减：Li (X1) 被样本 X0 和 X1 的透射值衰减，Li (X2) 被样本 X0、X1 和 X2 的透射值遮挡，等等。  

下面是算法说明：

*  步骤 1：在进入射线步进循环之前：将整体 transmission（transparency）值初始化为 1，将结果颜色变量初始化为 0（该变量用于存储当前摄像机射线的体积对象颜色）： `float transmission = 1; color result = 0;` .
- 步骤 2：射线步进循环中的每个迭代：
    *   计算当前样本的内散射：Li (x).
    *   将总体传输（透明度）值乘以当前样本传输值，从而更新总体传输（透明度）值： `transmission *= sample_transmission` .
    *   用 Li (x) 乘以总体透射（透明度）值：样本散射的光被我们目前处理过的所有样本（包括当前样本）遮挡。  将结果添加到我们的全局变量中，该变量用于存储当前摄像机光线的体积颜色： `result += Li(x) * transmission` .


![[661daa73adcb7eeab19935e57e23345a_MD5.png]]

Translated into code: 翻译成代码：

```c++
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

但要注意这个代码。它还不准确。它缺少了一些我们将在下一章学习的术语。现在，我们只想让你理解射线步进的原理。然而，这段代码将生成一幅令人信服的图像。

这里无需显示图像。如果我们操作得当，后向和前向射线步进的结果应该是一样的。好了，我们知道你不会想当然地认为这就是结果。

![[fea726e14f6157dfbc036e9834cf84ec_MD5.png]]

## 为什么正向射线步进比反向射线步进 "更好"？


因为只要体积的透明度非常接近 0（如果体积足够大和/或散射系数足够高，就会出现这种情况），我们就可以停止射线步进。而这只有在射线步进的过程中才能实现。

现在，渲染体积球的速度相当快，但随着章节的推进，你会发现渲染速度最终会变慢。 因此，如果我们可以避免计算那些对像素颜色没有贡献的样本，因为我们在沿着射线步进的过程中到达了一个点，我们知道体积是不透明的，那么这就是一个很好的优化。

We will implement this idea in the next chapter.  
我们将在下一章实现这一想法。

## 选择步长


**请记住，我们之所以采用射线步进的方式，从 t0 到 t1 小步前进，是为了使用黎曼和法估算一个积分（由于内向散射，沿摄像机光线向眼睛散射的光量）**。正如前一章和 "阴影的数学 "一课中所解释的，**用于估算积分的矩形（在我们的例子中，矩形的宽度由这里的步长定义）越大，近似值就越不精确。  反之亦然：矩形越小（步长越小），估算就越准确，当然计算时间也越长**。  目前，渲染体积球体的速度相当快，但随着本课的深入，你会发现渲染速度最终会大大降低。**这就是为什么要在速度和精度之间权衡选择步长的原因。**

现在，我们假设体积密度也是均匀的。在接下来的章节中，我们将看到，要呈现云或烟等体积密度，密度在空间中是变化的。这些体积由大频率特征和小频率特征组成。  **如果步长过大，最终可能无法捕捉到一些较小的频率特性（图 5）。这是一个滤波问题，本身就是一个重要而复杂的课题。**

![[8149a40076f8a74b7814da2a8bdaba4e_MD5.png]]
>图 5：我们没有捕捉到体积中的小细节，因为我们的步长太大了。当然，这个例子很极端，但它的目的是帮助你理解。

**可能会出现另一个需要调整步长的问题：阴影。如果小的实体物体在体积物体上投射阴影，如果步长过大，最终就会错过（图 6）。**

![[62584b65f3bbe3a80fec9b49f04da613_MD5.png]]
>图 6：虽然这个例子也很极端（2 个样本可能永远不足以正确渲染体积物体的光照），但可以看到我们没有足够的样本来捕捉实体物体阴影中的部分体积物体。我们需要更小的步长。


**所有这些并没有告诉我们如何选择一个好的步幅。从理论上讲，没有规则可言。你基本上应该对体积物体的大小有所了解**。  例如，如果一个长方形的房间里弥漫着某种均匀的气氛，你就应该知道这个房间的大小（以及你使用的单位种类，例如 1 单位 = 10 厘米）。  因此，如果房间有 100 个单位大，0.1 的步长可能太小，而 1 或 2 的步长可能是个不错的起点。然后，就像我们之前提到的那样，你需要不断摸索，在速度和精确度之间找到一个很好的平衡点。


**现在看来，这也不完全正确。虽然我们可以根据场景中物体的大小来凭经验选择步长，但一定有更合理的方法。**  
一种可能的方法是，考虑在我们进入体积对象的距离处像素 "有多大"，并将步长设置为投影像素的尺寸。事实上，作为离散对象的像素无法表现小于其尺寸的场景细节。  我们在这里就不详细介绍了，因为滤波本身就值得上一课。**现在我们要说的是，一个好的步长大小应接近摄像机光线与体积相交处的像素投影大小。这可以通过以下方法估算出来**

```c++
float projPixWidth = 2 * tanf(M_PI / 180 * fov / (2 * imageWidth)) * tmin;
```

如果您愿意，可以对其进行优化。其中， `tmin` 是摄像机光线与物体相交的距离。同样，我们也可以计算光线离开体的投影像素宽度，并在 `tmin` 和 `tmax` 处对投影像素宽度进行线性插值，以设置沿射线步进时的步长。

## 其他值得关注的问题


编写制作代码时需要将射线的不透明度和颜色与射线数据一起存储。  

这样，我们就可以先对实体对象进行光线跟踪，然后再对体积对象进行光线跟踪，并在跟踪过程中将结果进行组合（与上例中将背景颜色与体积球体对象进行组合的方法类似）。

需要注意的是，摄像机光线路径上可能会出现多个体积物体。因此，我们有必要存储沿途的不透明度，并在射线步进过程中将连续的体积物体的不透明度和颜色结合起来。

体积物体可以由多个组合物体（如相互重叠的立方体或球体）组成。在这种情况下，我们可能希望将它们组合成某种集合结构。  

要对这种聚合体进行射线步进，需要特别小心地计算组成聚合体的物体的交点边界。

## 下一步：添加缺失项，得到物理上准确的结果。

  
在本课的第三章/下一章，我们将在当前的实现中添加一些缺失的术语，以获得物理上（更）准确的结果。  

我们还将向你展示，掌握了这些知识，你现在就可以阅读和理解其他人的渲染器代码了。准备好了吗？

##  源码

复制前两章图像的源代码可在本课最后一章下载，并附有编译说明（嵌入在文件中）（与往常一样）。  

请注意，这些代码与本章中展示的代码片段有些不同。下一章将解释这些不同之处。