

## 1. 贴图种类

漫反射 Diffuse 分为 3 类: 头发 Diffuse, 脸部 diffuse, 身体 Body(含 Dress)Diffuse。最后会给出 3 类 diffuse 的处理方法。

首先，来看看贴图种类：Ramp 图，LightMap 贴图，Diffuse 主色贴图，SDF 阴影贴图，脸部阴影范围图，Metal 高光控制图 (也可用于非 Metal 的高亮控制)

![[5d916e59f2cd4d74d38c48e20d96c6b9_MD5.jpg]]

## 2. 贴图可视化, 通道图

主要来看看贴图各个通道的样子，重点关注 LightMap，VertexColor，BaseColor 的 A 通道，以及 Ramp 颜色采样图，**各类型通道图 RGBA 的具体用途和含义，请看图片下面的解释说明！**

![[8f47fa6efe1d343e10896a00d9da7e31_MD5.jpg]]

![[07788259380e7a04991e7913c6bc0d4d_MD5.jpg]]

![[803dcb1706c8512cadbe94661d39e6d0_MD5.jpg]]

![[1a9ac411670050bca19de44dd947760c_MD5.jpg]]

![[9180c9caabadbb6c0f5693798c74f983_MD5.jpg]]

![[1ff4fd36cd0a28525d2f8f290e626f86_MD5.jpg]]

![[3a6dbbe4b51b4ded16313454a14e4198_MD5.jpg]]

## 3. 贴图可视化, Ramp 图

宵宫 Body Ramp 图，10 条颜色，下面 5 条是夜晚，上面 5 条是白天。lambert 系数, $-1\rightarrow0$ 表示在阴影中，对应 Ramp 图从左到右。关于 Lambert 系数，一会儿详细说一下。

![[bff88e452de540b33a786a5eef3e4e6b_MD5.jpg]]

宵宫 Hair Ramp 图，4 条颜色，下面 2 条是夜晚，上面 2 条是白天。分别代表头发 1 级阴影，2 级阴影的颜色。

![[1e918941f29a4e8f0a1e924fcfa085a7_MD5.jpg]]

## 4. 关于 Lambert 系数

Lambert 系数，lambert = N dot L，N 是法线 normal 的方向，L 是主光源方向，其中 N 和 L 都是单位向量，unit vector.

正常 lambert 系数的取值范围：$-1 \rightarrow1$

**Lambert 系数的用途 1：**判断光照区间，[-1, 0] 区间表示在阴影中，[0, 1] 表示在光照中。

**Lambert 系数的用途 2：**通过光照区间，进行 Ramp 的颜色采样，ramp 图 uv 两个轴，lambert 系数可以作为 u, 即横坐标，进行采样。作为采样使用时，一般使用半 lambert，使得颜色更透亮。HalfLambert = Lambert * 0.5 + 0.5。

## 5. URP 管线，使用 HLSL 编写 Shader，一些准备工作

```
//主光源
Light mainLight = GetMainLight(); 
float4 mainLightColor = float4(mainLight.color, 1); //获取主光源颜色
float3 lDir = normalize(mainLight.direction); //主光源方向

//基础色
half4 baseColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv); 
half4 vertexColor = IN.vertColor; //顶点色

//通道图
float4 lightMap = SAMPLE_TEXTURE2D(_LightMap, sampler_LightMap, IN.uv); 
float4 metalMap = SAMPLE_TEXTURE2D(_MetalMap, sampler_MetalMap, IN.vDirWS.xy * 0.5 + 0.5);
float4 faceShadowMap = SAMPLE_TEXTURE2D(_MetalMap, sampler_MetalMap, IN.uv);

//方向点积
float ndotLRaw = dot(IN.nDirWS, lDir);
float ndotL = max(0.0, ndotLRaw);
float ndotH = max(0, dot(IN.nDirWS, normalize(IN.vDirWS + lDir)));
float ndotV = max(0, dot(IN.nDirWS, IN.vDirWS));
```

## 6. AO 常暗区域的处理

AO = Ambient Occulusion, 通常是发生的原因是，两个物体挨在一起，中间的缝隙部分是黑的。原因是被 2 个紧挨的物体挡住了，无法受到光照。

那么在 Shader 中，处理 lambert 系数时，可以分为感受光照的 lambert 和采样 lambert 两大类。为了处理 AO 的情况，我们把 G 通道的 AO 值和 lambert 相乘，表示受 AO 印象的 lambert.

```
//lambert系数(光照): 光照面积, 光照面积AO, 平滑光照面积AO
float lambert = ndotL;
half lambertAO = lambert * saturate(lightMap.g * 2);
half lambertRampAO = smoothstep(0, _BodyShadowSmooth, lambertAO);
```

## 7. 日夜状态的处理

日夜系数，白天是 0.5，晚上是 0。实际情况为了采样在颜色条中间，我们再额外加 0.03 让颜色采样不至于卡在边界。

```
//日夜状态
half dayOrNight = (1 - step(0.1, _InNight)) * 0.5 + 0.03;
```

## 8. Ramp uv 轴，等同于 xy 轴的处理

前面提过 ramp 图，用于颜色的采样，我们需要知道 xy 坐标，也就是 uv 坐标。

横向坐标 x，也就是 u 坐标，我们用半 lambert 系数，由于有顶点色的存在，我们使用顶点色来作为 u 轴的一个偏移量，调整 u 坐标。

纵向坐标 y，也就是 v 坐标，我们需要考虑日夜情况，以及不同材质类型所对应的颜色。前面在通道图可视化的时候，Lightmap.a 是用来区分材质类型的。

**这里可以用 Lightmap.a 的值来做材质分层的映射，不用手动判断材质分层的取值范围。如果想更精准，可以手动控制范围。**

但需要注意的是，**Lightmap.a 其范围是 [0, 1]，我们需要进行压缩，把 [0, 1] -> [0, 0.5]**，之后再加上日夜状态的系数。

```
//lambert系数(采样): 半lambert采样, 偏移半lambert采样
half halfSampler = saturate(lambertRampAO * 0.5 + 0.5);
half rampOffset = step(0.5, vertexColor.g) == 1 ? vertexColor.g : vertexColor.g - 1;
half adjustedHalfSampler = saturate(halfSampler + rampOffset);
```

## 9. Hair Double Shadow，头发两级阴影的处理

如果我们注意看宵宫的头发，会发现其实有 3 个层次的阴影。深色阴影，浅色阴影，以及浅色阴影的平滑部分。

需要注意的是，**这 3 个阴影并没有超出正常的光照范围， 我的思路是利用原始 lambert [-1, 0] 的区间，分别处理这 3 级阴影。**

![[3cc25a5534f0a4b2bba7c517e32d533a_MD5.jpg]]

从前面的 ramp 图展示中，我们发现头发的 ramp 图里有 2 个颜色，分别代表了深色阴影，浅色阴影的颜色，那么阴影的处理代码如下:

```
//------漫反射diffuse: Double Shadow+Ramp------
float shadowUpperBound = step(ndotLRaw, _HairShadowSmooth) ;
float isHair = step(0.11, lightMap.r) - step(0.9, lightMap.r);
float litHair = step(0.0, ndotLRaw);

//1级暗阴影
float vDark = saturate(0.4 + dayOrNight);
float2 uvDark = float2(halfSampler, vDark);
float4 hairShadowD = SAMPLE_TEXTURE2D(_ShadowRampMap, sampler_ShadowRampMap, uvDark);

//2级亮阴影
float vLight = saturate(0.45 + dayOrNight);
float2 uvLight = float2(halfSampler, vLight);
float4 hairShadowL = SAMPLE_TEXTURE2D(_ShadowRampMap, sampler_ShadowRampMap, uvLight);

//计算1级深阴影，过度到2级浅阴影
float3 darkShadow = lerp(hairShadowD, hairShadowL, smoothstep(_HairDarkShadowSmooth, _HairDarkShadowArea, ndotLRaw))  * step(ndotLRaw, _HairDarkShadowArea);
                    
//2级阴影平滑
float lightSmoothArea = step(_HairDarkShadowArea, ndotLRaw);
float3 lightShadowSmooth = 0.5 * _HairSmoothShadowIntensity * hairShadowL * lightSmoothArea* shadowUpperBound;
```

## 10. 漫反射，Body Diffuse 的计算，身体部分

到这里，我们计算整个身体，包含 dress 小裙子部分的 diffuse color. 需要注意的是，要考虑 AO 的情况，处理的代码如下:

```
//漫反射diffuse: Ramp+AO
float rampV = saturate(lightMap.a * 0.45 + dayOrNight);
float2 rampUV = float2(adjustedHalfSampler, rampV);
half4 rampShadow = SAMPLE_TEXTURE2D(_ShadowRampMap, sampler_ShadowRampMap, rampUV);
diffuse = lerp(rampShadow, mainLightColor, lambertRampAO) * baseColor;
```

我们来看一下，如果只输出这部分 color 的效果。

![[8871fcf08a3a9f989b0acf9f11c6b048_MD5.jpg]]

## 11. 漫反射，Face Diffuse 的计算，脸部

脸部是没有 AO 的，但脸部后面会有描边 Outline 的问题，眼睛和嘴的地方不要描边。**面部的 SDF 阴影，会在后面单独一篇文章记录。**

```
//结合朝向使用阴影图 Decide which lightmap to use, and compute shadow area
diffuse = lerp(faceShadowColor, mainLightColor, inLight) * baseColor;
```

看一下加了面部的效果：

脸部需要 SDF 阴影，下一篇会提及，脸部无高光。

![[a90ed9714328aa87c0e66bdb4fd2b6d3_MD5.jpg]]

## 12. 漫反射，Hair Diffuse 的计算，头发

头发需要还原出，3 层阴影的感觉，我这里的实现，效果不够顺滑。

```
//计算头发和头饰颜色
float3 diffuseHair = (darkShadow + litHair) * baseColor * isHair + + lightShadowSmooth * isHair;
float3 diffuseHairAccessory = baseColor * step(lightMap.r, _HairRange);

//结合diffuse和AO
diffuse = (diffuseHair + diffuseHairAccessory) * step(_HairRange, lightMap.g);
diffuse += hairShadowD * (1 - step(_HairRange, lightMap.g)) * baseColor;
```

看一下头发的效果：

![[1f407db91830d344adb26c21bce9c026_MD5.jpg]]

![[88a08e3e1ae9942a638b41e68e0f1c2c_MD5.jpg]]

最后，**再说一下这个阴影的范围，要符合正常光照逻辑，对比游戏中的阴影范围如下**：

![[8bdec8d717a97e8b87f0c8bfc57ff6cd_MD5.jpg]]

![[7407859c3ff95640183a6fdbab1c37da_MD5.jpg]]

## 13. 整体效果

最后，我们来看一下漫反射 Diffuse 的整体效果：

![[a57f9ddf998218874c945222186cf9fa_MD5.jpg]]

下次预告：【02】Unity URP 卡通渲染 原神角色记录 - Specular: Metal + Non-Metal。下一篇，会记录有光高光，Specular 相关内容。

[张洋铭 Ocean：【02】Unity URP 卡通渲染 原神角色记录 - Specular: Metal+Non-Metal](https://zhuanlan.zhihu.com/p/552097073)

## 14. 参考链接

感谢各位知乎大佬的分享，列表如下：

[世界：【Unity 技术美术】 原神 Shader 渲染还原解析](https://zhuanlan.zhihu.com/p/435005339)

[T.yz：[卡通渲染] 二、原神角色渲染还原 - Diffuse-1](https://zhuanlan.zhihu.com/p/547129280)

[雪羽：原神角色渲染 Shader 分析还原](https://zhuanlan.zhihu.com/p/360229590)

[清清：从仿原神角色渲染到 MMD 制作 (小记)](https://zhuanlan.zhihu.com/p/490406107)

[2173：【02】从零开始的卡通渲染 - 着色篇 1](https://zhuanlan.zhihu.com/p/110025903)