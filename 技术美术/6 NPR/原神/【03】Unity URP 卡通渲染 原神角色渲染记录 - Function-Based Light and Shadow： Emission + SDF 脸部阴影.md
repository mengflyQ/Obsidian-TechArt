点击下面链接，B 站上传了实际 Game 窗口效果，视频有压缩，实际运行效果更好些~

[【1080P 高码率】Unity URP 管线，仿原神渲染，第 6 弹，人物展示场景更新_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15T411w7zG)

系列一共 5 篇：

【01】Unity URP 卡通渲染 原神角色记录 - Diffuse: Ramp + AO + Double Shadow

[张洋铭 Ocean：【01】Unity URP 卡通渲染 原神角色渲染记录 - Diffuse: Ramp + AO + Double Shadow](https://zhuanlan.zhihu.com/p/551104542)

【02】Unity URP 卡通渲染 原神角色记录 - Specular: Metal+Non-Metal

[张洋铭 Ocean：【02】Unity URP 卡通渲染 原神角色渲染记录 - Specular: Metal + Non-Metal](https://zhuanlan.zhihu.com/p/552097073)

【03 | 当前浏览】Unity URP 卡通渲染 原神角色记录 - Function-Based Light and Shadow: Emission+SDF 脸部阴影

[张洋铭 Ocean：【03】Unity URP 卡通渲染 原神角色渲染记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影](https://zhuanlan.zhihu.com/p/552097741)

【04】Unity URP 卡通渲染 原神角色记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light

[张洋铭 Ocean：【04】Unity URP 卡通渲染 原神角色渲染记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light](https://zhuanlan.zhihu.com/p/552098339)

【05】Unity URP 卡通渲染 原神角色记录 - Double Pass Effect: Render Feature + 平滑法线 Outline

[张洋铭 Ocean：【05】Unity URP 卡通渲染 原神角色渲染记录 - Double Pass Effect: Render Feature + 平滑法线 Outline](https://zhuanlan.zhihu.com/p/552098653)

## 1. 前言

这次的主题，都是和函数相关的，简单说：

1.  **我们用周期函数，实现 Emission 自发光**
2.  **我们用有向距离场函数，SDF as interpolator，实现脸部阴影图的差值补完**

## 2. 先从简单的_Time 变量说起

Emission 自发光，是一个明暗交替的过程。说到这大家想到什么类型的函数？周期函数，或者有类似效果的函数都可以。说到函数，这是一个基础的一元函数，自变量也就是时间，那么 Unity HLSL Shader 中的时间是怎么定义的呢？

我们直接看看源代码好了：可以发现，**_Time.xyzw 分别对应 t/20, t, 2t, 3t 的时间变化，我们使用_Time.y 即可，正常的时间变化。**

![[fbda1d989fe0f8d2db57447b34669106_MD5.jpg]]

额外，_Time.y == Time.timeSinceLevelLoad，_Time 所代表的时间，是场景加载之后的秒数。那么如果我们需要一个 0-1 不断切换的函数，可以这么定义。

```
_Time.y * 0.5 //比如 0*0.5 = 0, 0.5*0.5 = 0.25, 1*0.5 = 0.5, 1.5*0.5 = 0.75, 1.99*0.5 = 0.995
frac(_Time.y * 0.5) //我们只需要小数部分，也就是0, 0.25, 0.5, 0.75, 0.995之间来回切换
frac(_Time.y * 0.5) -0.5 //变成了-0.5, -0.25, 0, 0.25, 0.495之间来回切换
(frac(_Time.y * 0.5) -0.5) * 2 //变成了-1, -0.5, 0, 0.5, 0.99之间来回切换
abs((frac(_Time.y * 0.5) -0.5) * 2) //变成了1, 0.5, 0, 0.5, 0.99之间来回切换
```

以上就是仿 Sine 周期的函数的推导，当然我们也可以直接写成:

```
abs(_SinTime.w) //效果和上面是一样的
```

## 3. Emission 自发光部分的代码

有了上面关于周期函数的推导，我们看一下自发光的实现:

```
//自发光Emission: 周期函数
float bloomMask  = baseColor.a;
bloomMask *= step(0.95, 1 - lightMap.a);
//abs(_SinTime.w)
emission = bloomMask * _EmissionIntensity * mainLightColor * abs((frac(_Time.y * 0.5) - 0.5) * 2);
emission *= baseColor;
```

## 4. 神之眼的实际效果

注意观察神之眼~ (这是视频，PC 端应该可以看，手机 APP 好像刷不出来)

## 5. 什么是 SDF，有向距离场，Signed Distance Field

首先，**SDF 是一个函数，函数的输入是空间的一个点，函数的输出是这个点到 shape 的距离**。什么意思呢？

举个栗子：假如我们做一个 SDF，表示平面上一个点，到圆的距离，怎么写这个函数呢？

![[a440e782a5258f9fc02d5264537dcc2d_MD5.jpg]]

以上就是一个简单的 SDF 函数，但通常我们更关心，一个点到一系列 shape 的距离，做一个全局的函数来表示这个概念。如下图，我们想找一个全局函数，表示点 P 到两个圆的距离。

![[58cb6300c3efc154166dd10e06b67ddb_MD5.jpg]]

我们只需要分别求 2 个单独圆的 SDF 函数，在组合起来，求最小的距离。

![[d0c240b6ebb32d56fb50e0974386ed07_MD5.jpg]]

通过这个函数，我们得到如下结论：

1.  **S_union = 0，意味着我们触碰到了多个 shape 组成的形状的边界 edge**
2.  **S_union > 0，意味着点在多个 shape 组成的形状之外**
3.  **S_union < 0，意味着点在多个 shape 组成的形状之内**

再来一个例子，如果是一个如下白圈的图，SDF 变换之后，会是什么样子呢？

![[af343959ad271c226ab95551427564f9_MD5.jpg]]

**答案就是图中所有的像素点，到圆边界的距离，我们知道圆内到边界，是负值；圆外到边界是正值。也就是说，圆心是 - 1，外围会逐渐变成 1，如下图所示：**

![[0db330e1bb1002fcea9b43fcdfca539f_MD5.jpg]]

## 6. 原神中面部阴影，使用的是 SDF Interpolation

原神的脸部阴影图的制作流程：**原始关键帧 Keyframe -> SDF Intepolator(SDF 差值算法) -> Shadow Texture(阴影贴图)**

**SDF Interpolation, SDF 差值函数是什么呢？本质就是输入关键帧，经过 SDF 函数计算，输出关键帧对应的 SDF 阴影图。**

假如我们有如下的关键帧：

![[0dfbc492e1b2152d14e060848d87913e_MD5.png]]

我们使用一个 SDF 算法，SDF 输出 > 0 在阴影外，SDF 输出 < 0 在阴影内，我们把这个结果写到一个阴影贴图中。

**每一个关键帧，都是会生成一个 SDF 阴影图，上面有 8 个关键帧，就是 8 张阴影图，最终我们要把 8 张阴影图合并成一张，就变成了如下的贴图**：

![[73e903c359a3f1c17d7c97be1ddfa8b5_MD5.jpg]]

## 7. 8ssedt 算法解释

**注意这里的 8 和上面 8 个关键帧没关系，我们也可以用 15 个关键帧，多少都行**。

那么继续，上面我们讲了从关键帧到最终的阴影贴图输出，中间有个 SDF 算法。那么更具体的说，这个 SDF 算法，目前讨论比较多的是 **8ssedt，8-points Signed Sequential Euclidean Distance Transform。**

[The signed Euclidean distance transform and its applications](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=28276)

这是个来自 1988 年的算法，原文也很短，核心是下面的 mask。需要注意的是，我们现在讨论的领域，算是 CV 领域，用 Filter 对图像进行处理，是不是想到了卷积 Convolution 操作？

![[bbc885d04d6c70e98bf19ddb928a6bab_MD5.jpg]]

### 7.1 箭头方向问题

上图中的箭头方向，让我们陷入了深深的哲学思考....... 我来简单解释一下，这么深奥的哲学问题是啥意思。

就是**一个像素点，要么在阴影外，要么在阴影内，我们不知道，所以要搞两个 pass。**

**先假设像素在阴影内算一遍，再假设像素在阴影外算一遍，最终把 2 个结果做减法。pass2.pixel.sdf - pass1.pixel.sdf 就是实际 SDF 的结果。**

```
//pass1 假设在阴影内
for bottom to up:
   for left to right:
      use Mask 1
   for right to left:
      use Mask 2

//pass2 假设在阴影外
for top to bottom:
   for left to right:
      use Mask 4
   for right to left:
      use Mask 3
```

### 7.2 阴影图初始化问题

**上面已经提到，每一个关键帧都是函数的输入，我们根据关键帧的黑白信息，来初始化内外两个 2 维数组。**

pass1: 我们假设像素都在 y 阴影内，那么黑色部分初始成 1，白色部分初始成 0

pass2: 我们假设像素都在 y 阴影外，那么黑色部分初始成 0， 白色部分初始成 1

### 7.3 为啥一个格子里有 2 个数，代表什么？

这个就有点唬人，其实就是个方向向量，比如 (-1, 0)，就代表 A[i + 0][j - 1]，行数不变，列数 - 1，取我左边的像素看看。**那么上面的 Mask 就是告诉你，找哪几个邻居像素而已。**

这里 8 的含义就出来了， **pass1：找左下 4 个邻居；pass2：找右上 4 个邻居；**

### 7.4 找到邻居怎么比较

核心代码思路如下：

```
//拿pass1举例，pass2同理
if(Pass1ShadowMap[curr.x][curr.y] == 1){ 
 curr.sdf = 0; //说明当前像素已经在阴影中，距离给0就行，距离其实应该是负的，但颜色不能是负的，就给0吧
}else{
 for (neighbor in GetNeighbors(curr)){ //左下的4个邻居像素，这个循环就跑4次
 //看看当前的距离，和当前到邻居+邻居的距离，哪个小，动态规划DP更新当前的sdf距离
 curr.sdf = min(curr.sdf, neighbor.sdf + dist(curr ,neighbor)); 
 }
}
```

到这里，我们就可以完成一张 SDF 阴影图的生成，根据关键帧的数量，我们会生成多张。

最后，再用一个算法合并这些阴影图。

### 7.5 合并阴影图

合并 2 张阴影图的核心思路如下：

```
Shadowmap[][] newMap = new Shadowmap[width][height]; 

for (int x = 0; x < height; x++) {
   for (int y = 0; y < width; y++) {
     float dist1 = shadowmap1.GetSDF(x, y);
     float dist2 = shadowmap2.GetSDF(x, y);
     float mergedDist = SomeLerp(dist1, dist2, someVal); //这里根据需要做多次采样混合
     newMap[x][y] = mergedDist;
   } 
}
```

## 8. 原神中的脸部阴影处理

上面折腾一大圈，都是生成阴影图的，那么有了阴影图之后，怎么用呢？

**这里需要注意的是，我们要支持 2 种不同的旋转：**

1.  **人物的朝向旋转**
2.  **灯光旋转，灯光的重点是光照方向和灯光 vector 并不一致，需要逆时针转 90 度**

```
//漫反射diffuse: SDF阴影
//人物朝向 Get character orientation
float3 up = float3(0,1,0); 
float3 front = TransformObjectToWorldDir(float4(0.0,0.0,1.0,1.0));
float3 right = cross(up, front);
```

![[4a67af50a6c2dfdc84c29027dc8b8a2d_MD5.jpg]]

**上图给出了人物 Z 和世界 Z 相反的情况，不要使用 unity_ObjectToWorld._12_22_32 这个值，结果是错的。**

接下来，我们关注 2 个重要的向量点积：

R = Right，F = Front

1.  **RdotL，用来决定是不是需要切换左右阴影图，0-90 度不需要，90-180 度 RdotL < 0，需要切换。**
2.  **FdotL，用来和阴影图做对比，用来判断当前是不是在阴影中。**

官方提供的阴影图，只涵盖了 $0^{\circ} \rightarrow 90^{\circ}$ 的范围，$90^{\circ} \rightarrow 180^{\circ}$ 需要我们自己水平翻转一下阴影图。

```
//左右阴影图 Sample flipped face light map
float2 rightFaceUV = float2(-IN.uv.x, IN.uv.y);
float4 faceShadowR = SAMPLE_TEXTURE2D(_LightMap, sampler_LightMap, rightFaceUV);
float4 faceShadowL = lightMap;

//灯光朝向和灯光vector不一致，逆时针转90，投影后要归一化，不然长度会小于1
float s = sin(90 * (PI/180.0f));
float c = cos(90 * (PI/180.0f));
float2x2 rMatrix = float2x2(c, -s, s, c);    
float2 realLDir = normalize(mul(rMatrix,lDir.xz));

float realFDotL = dot(normalize(front.xz), realLDir);
float realRDotL =  dot(normalize(right.xz), realLDir);

//通过RdotL决定用哪张阴影图
float shadowTex = realRDotL < 0? faceShadowL: faceShadowR;
//获取当前像素的阴影阈值
float shadowMargin = shadowTex.r;
//判断是否在阴影中
float inShadow = -0.5 * realFDotL + 0.5 < shadowMargin;

//采样阴影ramp颜色图
float2 shadowUV = float2(inShadow * mainLight.shadowAttenuation - 0.06, 0.4 + dayOrNight);
half3 faceShadowColor = SAMPLE_TEXTURE2D(_ShadowRampMap, sampler_ShadowRampMap, shadowUV);
diffuse = lerp(faceShadowColor, mainLightColor, inShadow) * baseColor * faceShadowMask;
```

## 9. SDF 脸部阴影效果

**先来一个灯光旋转的视频，注意苹果肌，那个小三角的变化要正确，不能出现在脸的另一边。**(这是视频，PC 端应该可以看，手机 APP 好像刷不出来)

**接下来再看看人物朝向旋转的例子：**

到这里，基于函数的效果就结束了。

下次预告：【04】Unity URP 卡通渲染 原神角色记录 - Depth-Based Effect: 7Spaces + Rim Light。

下一篇，会讲图形学中常见的 7 大空间，空间之间的转换，深度图相关的内容，以及如何用深度图做边缘光。

[张洋铭 Ocean：【04】Unity URP 仿原神渲染记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light](https://zhuanlan.zhihu.com/p/552098339)

## 10. 参考链接

感谢各位知乎大佬的分享，列表如下：

[欧克欧克：Signed Distance Field](https://zhuanlan.zhihu.com/p/337944099)

[世界：Unity 着色器《原神》面部平滑阴影解决思路](https://zhuanlan.zhihu.com/p/402037562)

[涂月观：卡通渲染之基于 SDF 生成面部阴影贴图的效果实现（URP）](https://zhuanlan.zhihu.com/p/361716315)