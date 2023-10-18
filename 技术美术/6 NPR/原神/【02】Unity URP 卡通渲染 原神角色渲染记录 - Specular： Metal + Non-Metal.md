点击下面链接，B 站上传了实际 Game 窗口效果，视频有压缩，实际运行效果更好些~

[【1080P 高码率】Unity URP 管线，仿原神渲染，第 6 弹，人物展示场景更新_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15T411w7zG)

系列一共 5 篇：

【01】Unity URP 卡通渲染 原神角色记录 - Diffuse: Ramp + AO + Double Shadow

[张洋铭 Ocean：【01】Unity URP 卡通渲染 原神角色渲染记录 - Diffuse: Ramp + AO + Double Shadow](https://zhuanlan.zhihu.com/p/551104542)

【02 | 当前浏览】Unity URP 卡通渲染 原神角色记录 - Specular: Metal + Non-Metal

[张洋铭 Ocean：【02】Unity URP 卡通渲染 原神角色渲染记录 - Specular: Metal + Non-Metal](https://zhuanlan.zhihu.com/p/552097073)

【03】Unity URP 卡通渲染 原神角色记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影

[张洋铭 Ocean：【03】Unity URP 卡通渲染 原神角色渲染记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影](https://zhuanlan.zhihu.com/p/552097741)

【04】Unity URP 卡通渲染 原神角色记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light

[张洋铭 Ocean：【04】Unity URP 卡通渲染 原神角色渲染记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light](https://zhuanlan.zhihu.com/p/552098339)

【05】Unity URP 卡通渲染 原神角色记录 - Double Pass Effect: Render Feature + 平滑法线 Outline

[张洋铭 Ocean：【05】Unity URP 卡通渲染 原神角色渲染记录 - Double Pass Effect: Render Feature + 平滑法线 Outline](https://zhuanlan.zhihu.com/p/552098653)

## 1. 高光的种类

在上一篇中，我们记录了漫反射 Diffuse 相关的内容，这次来聊聊高光相关的东西。简单说，我们所关注的高光，可以分成 **2 个大类:**

*   **基于视角的简单高亮**，也就是说高亮部分随视角的变化而变化，用数学去表达这个视角变化就是 N dot V，与之对应高亮的变化，可以用贴图来控制。

**需要注意的是，只有视角足够靠近法线时，才有高亮，这种类型的数学表达通常是:**

```
step(1 - someLayerValue, NdotV) * someSpecularIntensity //靠近时才有高亮
```

*   **Blinn-Phong 经验模型的高光，** 这个高光主要是视角 V 和反射光 R，之间的夹角，再加上 expoential power 形成的，但实际中，反射光线 R 不太好求，我们一般使用半程向量 H 来完成余弦夹角的求解，即 N dot H。

![[7429423594fd1a278a54e3255111f315_MD5.jpg]]

![[387aec771aaf509eb4e1539dfdf892c0_MD5.jpg]]

![[29e12840e0329b2f451f83da375057e1_MD5.jpg]]

## 2. 原神里的高光分析

原神的高光大致可以分成 2 种，一个是**金属类的高光 Metal，一个是非金属类的高光 Non-Metal**。

首先我们来回顾一下，和高光相关的 3 个贴图：

![[4691990ac6e219ad337bb84c5af27e1f_MD5.jpg]]

![[22b488adef3b5b1edce19ad341a411ff_MD5.jpg]]

![[e8c1cbf87c5919e01c42b9772e9ccd7b_MD5.jpg]]

处理这 3 张贴图的基本思路，我们先用 lightmap.r，来拆分出来金属和非金属，接着拆分非金属里面的层级。

**金属部分，我分成了 3 个区间：**

1. 身体的项链

2. 衣服的金属条

3. 头发的头饰

接下来，我们可以写一个函数，把 lightmap.b 里边定义的 roughness 转成高光指数 exponent，然后使用 Blinn-Phong Specular 作为强度。这里使用金属贴图 Metalmap.b，来控制视角变化带来的高光强弱变化，结合以上 Blinn-Phong 高光一起使用。

**非金属部分，我也分成了 3 个区间：**

1. 衣服的花纹边

2. 衣服的图案

3. 头发

这些部分，直接用 lightmap.b, roughness 作为强度，应该就可以。这里使用 NdotV，来控制视角变化带来的高光强弱变化，结合以上 lightmap.b 高亮强度一起使用。

## 3. 高光的代码准备

前面提到 Blinn-Phong 高亮的指数 p, 这个 p 怎么求呢？我使用了下面的等式进行转换。

![[c7b4e044dd9891625e91a530d735af1c_MD5.jpg]]

```
//获得高光指数p
float RoughnessToSpecularExponent(float roughness){
   return  sqrt(2 / (roughness + 2));
}

//高光系数 
float specularPow = pow(ndotH, RoughnessToSpecularExponent(lightMap.b));

//衣服材质，高光区间
half strokeVMask = step(1 - _StrokeRange, ndotV);
half patternVMask = step(1 - _PatternRange, ndotV);

//头部，高光区间
half hairMask = step(_HairRange, lightMap.r);
half hairViewMask = step(_HairViewSpecularThreshold, ndotV);
half hairSpecAreaMask = step(_HairSpecAreaBaseline, lightMap.b);
half hairAccGroveMask = step(_HairAccGroveBaseline, lightMap.r);
```

## 4. 视角高亮的实际效果

视角高亮总的来说，当视角靠近的时候的，会发亮；视角远离的时候会变暗。**注意看视频里肩部花纹随视角的明暗变化。**游戏里这个变化，请自行观察，很细微，抠出来很麻烦，就不弄了。(视频在 PC 端应该可以看，APP 好像不展示)

额外需要说明的是，**头发的高光处理，有些特殊，我们平视时是看不到高光的，只有俯视角，且非阴影中，才能看到。**

![[6f99c73d021e0952c60baab5371bbc9c_MD5.jpg]]

![[bec1ff574f429718c3dab94e7c20518c_MD5.jpg]]

![[eed168f6d05b556321312d0299bd6eb2_MD5.jpg]]

接下来看看头发还原的效果：先阴影，后无阴影 (视频在 PC 端应该可以看，APP 好像不展示)

为了接近游戏效果，高亮的强度，我调的比较低，游戏里也比较低。(视频在 PC 端应该可以看，APP 好像不展示)

额外说明的是，脸部无高光。

## 5. 视角金属高光的实际效果

游戏里的效果，可以自行对比，我就单独扣了，比较麻烦。**注意看脖子，蝴蝶项链的高光变化。**(视频在 PC 端应该可以看，APP 好像不展示)

## 6. 高光部分的计算代码

```
//高光specular: Metal+Non-metal

// ILM的R通道，视角高亮
half strokeMask = step(0.001, lightMap.r) - step(_StrokeRange, lightMap.r);
half3 strokeSpecular = lightMap.b  * strokeVMask  * strokeMask;
half patternMask = step(_StrokeRange, lightMap.r) - step(_PatternRange, lightMap.r);
half3 patternSpecular = lightMap.b  * patternVMask  * patternMask;

// 金属高光, Blinn-Phong
half metalMask = step(_PatternRange, lightMap.r);
half3 metalSpecular = _MetalIntensity * metalMap * metalMask;
                    
//最终高光
specular = (strokeSpecular + patternSpecular  + metalSpecular) * baseColor;
                    

//高光部分: 头发顶视角高亮
float shadowUpperBound = step(ndotLRaw, _HairShadowSmooth) ;
float isHair = step(0.11, lightMap.r) - step(0.9, lightMap.r);
float litHair = step(0.0, ndotLRaw);

specular = _HairViewSpecularIntensity * specularPow * hairViewMask * hairMask;
specular *= hairSpecAreaMask * baseColor * litHair;
specular += metalMap.b * hairAccGroveMask * baseColor;
specular += hairAccGroveMask * baseColor;
```

## 7. 整体效果

**三种不同的高光效果：**

**1. 衣服图案的高亮 2. 头发的特定视角高亮 3. 蝴蝶项链的金属高光** (视频在 PC 端应该可以看，APP 好像不展示)

下次预告：【03】Unity URP 卡通渲染 原神角色记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影。

下一篇，会讲一下有向距离场，Signed Distance Field，脸部阴影和自发光【硬核警告】

[张洋铭 Ocean：【03】Unity URP 仿原神渲染记录 - Function-Based Light and Shadow: Emission+SDF 脸部阴影](https://zhuanlan.zhihu.com/p/552097741)

## 8. 参考链接

感谢各位知乎大佬的分享，列表如下：

[世界：【Unity 技术美术】 原神 Shader 渲染还原解析](https://zhuanlan.zhihu.com/p/435005339)

[T.yz：[卡通渲染] 二、原神角色渲染还原 - Specular-2](https://zhuanlan.zhihu.com/p/547722925)

[雪羽：原神角色渲染 Shader 分析还原](https://zhuanlan.zhihu.com/p/360229590)

[清清：从仿原神角色渲染到 MMD 制作 (小记)](https://zhuanlan.zhihu.com/p/490406107)

[2173：【03】从零开始的卡通渲染 - 着色篇 2](https://zhuanlan.zhihu.com/p/111633226)