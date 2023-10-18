
匿名用户

说实话，我觉得这个问题说实话的都得被冲，所以，你懂的，就图一乐

![](1679722497805.png)

Heee

*** 如果你想要上手卡渲却苦于没有思路，本篇将带你走一遍人物卡渲管线，节省前期技术开发整理的时间。本人学疏才浅，讲到的内容可能不够全面，也请各路大佬多海涵。**

*** 本篇仅涉及知识点，实现方法可以参考我的往期教程~**

*** 本篇为录播知识点整理，配合录播食用效果更佳**

**开篇：**

![](1679722497841.png)

**目录：**

![](1679722497879.png)

**第一节：**

![](1679722497900.png)

首先，NPR-Non-Photorealistic Rendering，顾名思义，非真实渲染。

**对比下面的三个图：**

![](1679722497916.png)

左边塞尔达，不用说，完全的 NPR 效果。

右边使命召唤，完全的 PBR 效果。

[中间噬血代码](https://www.zhihu.com/search?q=%E4%B8%AD%E9%97%B4%E5%99%AC%E8%A1%80%E4%BB%A3%E7%A0%81&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)，整体在 PBR 基础上，在头发、衣服、Bloom 等效果上叠加了 NPR 效果。

再看什么是 NPR，[卡通渲染](https://www.zhihu.com/search?q=%E5%8D%A1%E9%80%9A%E6%B8%B2%E6%9F%93&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)也是 NPR 一种，各类非真实的视觉呈现效果都可以称为 NPR，没有一个标准，没法定论说 NPR 就是什么效果，每个厂商都有对 NPR 独到的理解，所以，让我们先从模仿做起，在模仿的过程中积累知识，并创造自己的一套渲染管线。

今天的是卡通人物渲染管线，所以让我们专注于纯 NPR 效果的实现，单从上面三张图，最明显能看出来的，是在着色上，塞尔达的人物卡渲呈现很多大色块，色阶很少，所以让我们先从大面积着色上入手今天的卡通人物渲染管线。

**这里有六种光照模型与对应解释：**（敲黑板，这是对模型整体大面积着色的关键一步）

![](1679722497953.png)

![](1679722497970.png)

较为常用的有：扁平光照（加高光）、增加扁平光照色阶、Ramp 图过渡、混合 NPR 与 PBR

在着色完成后，我们需要考虑描边：

**美术处理上的描边手段：**

![](1679722498004.png)

**图像处理上的描边手段：**

![](1679722498045.png)

**对应解释：**

屏幕空间顶点偏移：（不常用，最多用在高亮描边显示）

![](1679722498101.png)

BackFace 描边：（低消耗效果好，需要对模型预处理）

![](1679722498139.png)

[场景深度描边](https://www.zhihu.com/search?q=%E5%9C%BA%E6%99%AF%E6%B7%B1%E5%BA%A6%E6%8F%8F%E8%BE%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)：（通过对场景深度卷积运算得，常用作高质量外描边，内部细节不足）

![](1679722498180.png)

[场景法线描边](https://www.zhihu.com/search?q=%E5%9C%BA%E6%99%AF%E6%B3%95%E7%BA%BF%E6%8F%8F%E8%BE%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)：（通过对场景法线卷运算得，常用作内部细节描边，外描边粗细不足）

![](1679722498221.png)

综合细节描边处理：

（BackFace 经过[平滑法线](https://www.zhihu.com/search?q=%E5%B9%B3%E6%BB%91%E6%B3%95%E7%BA%BF&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)、转移到屏幕空间、活用 RBGA 四通道能达到较好的效果。结合自定义深度做外描边、场景法线做[内描边](https://www.zhihu.com/search?q=%E5%86%85%E6%8F%8F%E8%BE%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)也可以达到较好的效果）

![](1679722498260.png)

[IDTexture 描边](https://www.zhihu.com/search?q=IDTexture%E6%8F%8F%E8%BE%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)：

（通过对色值卷积，常用作模型内部部件外描边，并且让描边一定程度上有摆脱网格体限制的能力）

![](1679722498297.png)

**根据上面的内容，我们就能轻松复刻塞尔达的效果：**

![](1679722498336.png)

**接下来让我们看看，如何还原[原神](https://www.zhihu.com/search?q=%E5%8E%9F%E7%A5%9E&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)的人物卡通渲染：**

![](1679722498391.png)

塞尔达的卡渲风格也很符合游戏本身，比较粗犷，而原神的人物卡渲是那种比较精致的类型，增加了很多细节补充了画面的丰富的。所以，在开始上手制作前，细节分析要做到位，这也是为什么全网那么大佬做出的多[仿原神](https://www.zhihu.com/search?q=%E4%BB%BF%E5%8E%9F%E7%A5%9E&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)渲染中，卡渲效果也是良莠不齐的原因。

**接下来给出我的参考：**

![](1679722498432.png)

在做完分析后，让我们开始上手制作：

首先处理好光照效果：（用到了上文提到的 Ramp 图过渡的[扁平光照](https://www.zhihu.com/search?q=%E6%89%81%E5%B9%B3%E5%85%89%E7%85%A7&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)）

![](1679722498446.png)

· 后处理中制作扁平光照

·Ramp 图分为头发、身体、衣服三种：

头发：暗面略带紫红色，过渡由黄绿向灰白渐变

衣服：有黄绿色过渡（我这里懒了只做了灰色过渡）

身体：暗面略带红色体现肉体质感，黄绿色过渡表现向日光的过渡

* 值得一提的一点：（如何在后处理中 “消除” 引擎自带光照影响可以参考我的其他教程）

为什么上面消除要加双引号，可以在 RenderDoc 中看到，后处理是走完整个引擎自带渲染管线后附加的一套处理管线，本质上是在用[延迟渲染](https://www.zhihu.com/search?q=%E5%BB%B6%E8%BF%9F%E6%B8%B2%E6%9F%93&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)返现引擎自带管线，我们并没有改变引擎自带管线，所以并没有真正消除引擎自带光照，而是视觉上消除了而已，性能上肯定不如改管线的要好。

用后处理制作扁平光照能做到什么效果：

纯后处理能支持一个日光的光源阴影效果与多个环境光的光色效果。

结合后处理、材质和蓝图，能够支持多光源阴影效果。

**基于上面的扁平光照，添加多种高光体现质感：**

![](1679722498480.png)

四种高光：

衣服：布料类，不怎么需要高光

盔甲 & 绳结：硬胶类，需要硬边高光，据观察高光需要随视角改变

金属：金属类，需要软边高光，亮暗对比度较大，高光需要随视角改变

头发：遮罩类，在一定遮罩范围内高光随视角改变，亮暗测亮度需要调整避免过亮

**做完基础光照后，我们需要优化阴影细节：**

![](1679722498675.png)

分为三种阴影：

动态阴影：在上述光照中已经制作完成，注意 Ramp 图色值选取

静态阴影：静态阴影中分两种。一种，通过遮罩绘制出阴影区域，保证整体阴影色值统一。第二种，绘制在贴图上，要比统一阴影颜色更深，用来体现头发间隙、耳朵轮廓等需要通过阴影表现深度的地方。

面部阴影：通过 ShadowMap 制作（一种由 0 向 1 渐变的梯度图），通过蓝图与材质结合，调整日光与面部阴影的交互。具体做法可参考往期教程。

**在上面，我们已经完成了光照效果的制作，接下来看一下描边：**

![](1679722498713.png)

这里有三种描边：

外描边：自定义深度获取整体遮罩，卷积算得外描边

内描边：自定义深度获取遮罩，避免全局描边，对场景法线卷积算得内描边

内边缘光：

这个值得一提。许多仿原神渲染里似乎都没有看到对这个效果的还原，可能是没有注意到，也可能注意到了没能够实现。

先讲一种错误做法——用[菲涅尔](https://www.zhihu.com/search?q=%E8%8F%B2%E6%B6%85%E5%B0%94&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)制作。通过对菲涅尔的限制可以获取较细的内部描边，这点在单纯用一个球体可以实现，效果也很不错，但是，如果换成正方体，无论如何处理都得不到正确的结果。这是因为菲涅尔本质就是相机向量与物体法线[点积运算](https://www.zhihu.com/search?q=%E7%82%B9%E7%A7%AF%E8%BF%90%E7%AE%97&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)，当物体法线变化不够明显时，或者像是正方体这样一个面法线都是一个方向的情况，点积的结果一个面都是一个，不管怎么运算正方体这个面的结果都是统一的，所以不要用菲涅尔去做描边。

这里给出我的方法，用自定义深度绘制两次外边缘，并改变两者卷积的偏移量，获取一个粗细可控的区域用制作内边缘光。

在做完三个描边后，你会发现随着视角转变，描边粗细并没有变化，当摄像机原理、人物变小时，描边粗细不变会使卷积出来的描边揉成一坨，所以对每个描边都要相对相机距离进行缩放。

**描边做完后，让我们优化一下细节：**

![](1679722498753.png)

Ramp 图上文已经给出了参考这里不再赘述。

内边缘光：可以看到开启后角色变得立体更加饱满。这点从美术的角度上考虑也可以理解，阴影部分不会是完全的阴影，一定会有其它场景反射回来的光补充阴影的光照，而不是完全的阴影，这里便用内边缘光补充了阴影的效果。

金属：神里龟龟身上的金属大多为黄铜质感的金属，增加亮暗对比度不能只是提高亮度，阴影我选择了偏红棕色的色调，亮部给了更多的黄色。

**前文也提我们摒弃了引擎自带的光照系统，这意味着制作 MRAO（金属度、粗糙度、[环境光遮蔽](https://www.zhihu.com/search?q=%E7%8E%AF%E5%A2%83%E5%85%89%E9%81%AE%E8%94%BD&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)）这些贴图已经无法区分材质，粗糙度金属度对模型已经没有影响了，法线也只能影响反射光的朝向，这要求我们对应不同材质制作不同的 shader 并整合，这里给出我的解决方案：**

![](1679722498820.png)

通过制作材质 Mask，区分三种材质并通过 MakeMaterialAttributes 整合到一个材质中，可以看到右下角效果，能够提供大量的材质细节。

**至此，我们完成了仿原神渲染的复刻，结合上文的知识点，让我们试着读一下《蓝色协议》的游戏技术分享，运用上文的内容拓展更多的思路：**

![](1679722498878.png)

![](1679722498921.png)

**这里首先提到了描边：**

![](1679722498960.png)

原文的意思是主要是用后处理制作描边（什么嘛这我熟 x）

这里分三层叠加描边细节：

第一层：自定义深度制作外描边

第二层：IDTexture 制作内部各个部件外描边

第三层：场景法线制作各个部件内部细节描边

**光照效果：**（分析如图）

![](1679722499005.png)

* 关于光照范围：分享里并没有给出具体实现方式，如果只是单纯减少 50％，那当日光转移到背后时，阴影仍然在正面，这是个错误的效果。关于这点每个游戏厂商都有自己的一套规范，在什么角度怎么样调整光照的相应范围，这里也就不展开分析。

头发高光：

**首先需要看一个通用案例助于理解：**（具体做法可以参考往期教程）

![](1679722499053.png)

概括的讲就是通过调整 UV 可以让高光沿着头发移动。

**在理解 UV 与网格体对应关系后让我们看看蓝色协议头发高光的制作思路：**

![](1679722499094.png)

概括的讲：

蓝色协议初始方案是以菲涅尔作为权重依据，对基础高光球形进行缩放，达到靠近模型外围高光拉伸的效果。但存在拉伸后锯齿，拉伸方向与 UV 配合难以统一的问题

蓝色协议给出的解决方案是，沿着每个高光的重心缩放，但如何找到重心，找到重心后沿着哪个方向缩放，这些问题没有给出解决方案，所以这里给出一点我的拙见：

高光遮罩还是按照正常 UV 排布，但不是用纯白色的遮罩，而是用上文提到的 ShadowMap，由长条形为零收缩到基本型为 1，通过菲涅尔作为缩放权重，能够得到很好地控制效果。

**其他 NPR 效果：**

![](1679722499163.png)

风格化特效（透明度调低），分享内提到特效沿着顶点偏移，其实就是发射一个圆柱体承载特效贴图而不是平面，让特效有立体感。

风格化模型与材质，降低面数提高饱和度等。

后处理，右下角为环境光对视野影响放大十倍的效果。

草坪通过噪波丰富细节。

原文还有很多其他内容分享，在这篇人物卡通渲染概述就展开来说了。

**这次的分享也到这啦，感谢观看~**

![](1679722499223.png)

**参考资料：**

[虚幻引擎](https://www.zhihu.com/search?q=%E8%99%9A%E5%B9%BB%E5%BC%95%E6%93%8E&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)论坛：[https://forums.unrealengine.com/t/toon-shading-model/30226](https://link.zhihu.com/?target=https%3A//forums.unrealengine.com/t/toon-shading-model/30226)

[罪恶装备](https://www.zhihu.com/search?q=%E7%BD%AA%E6%81%B6%E8%A3%85%E5%A4%87&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2540882617%7D)技术分享：

[https://www.4gamer.net/games/216/G021678/20140703095/index_2.html](https://link.zhihu.com/?target=https%3A//www.4gamer.net/games/216/G021678/20140703095/index_2.html)

知乎网易游学：[https://zhuanlan.zhihu.com/p/450336192](https://zhuanlan.zhihu.com/p/450336192)

知乎游戏葡萄米哈游技术分享整理：[https://zhuanlan.zhihu.com/p/37001473](https://zhuanlan.zhihu.com/p/37001473)

《蓝色协议》技术分享：[https://www.famitsu.com/news/202009/08205405.html](https://link.zhihu.com/?target=https%3A//www.famitsu.com/news/202009/08205405.html)

文章《Line Drawing from 3d models》

文章《Effective Toon-Style Rendering Control Using Scalar Fields》

FMAwiki—Heee—卡通渲染流程：[https://fma.wiki/d/130](https://link.zhihu.com/?target=https%3A//fma.wiki/d/130)；[https://fma.wiki/d/145](https://link.zhihu.com/?target=https%3A//fma.wiki/d/145)

**PPT 与录播原件：**

链接：[https://pan.baidu.com/s/1E--dyo2Kw3Y2RhSL53aAOg?pwd=z876](https://link.zhihu.com/?target=https%3A//pan.baidu.com/s/1E--dyo2Kw3Y2RhSL53aAOg%3Fpwd%3Dz876)

提取码：z876
