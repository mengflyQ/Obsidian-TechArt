## [](#前言)前言

继续学习 Colin 大神的渲染示例库，这次学习的是[屏幕空间平面反射](https://github.com/ColinLeung-NiloCat/UnityURP-MobileScreenSpacePlanarReflection)（ScreenSpacePlanarReflection），一个可以用在移动端的平面反射库，但是对图形 API 有要求，PC/console/vulkan android/Metal iOS，OSX，因为其中用到了 Compute Shader 加速计算。项目还对不同平台做了差异化处理，干货很多。

学习过程中我也有很多疑问，有一些是百度谷歌看 PPT 解决的，有一些就实在不知道怎么办了，在文中有说明，望知道的大佬能不吝赐教。

## [](#正文)正文

### [](#compute-shader)Compute Shader

简单来说 Compute Shader 是运行在 GPU 中的计算管线中的程序，其与渲染管线相互独立，旨在将任务切分成一个个运行单元，然后充分利用 GPU 的并行计算能力来提高目标的运行效率，也是现代 GPGPU（General Purpose Computing on GPU）的基石。

其应用起来的相关概念用一张图即可概括（有一说一这张图感觉比 _NVIDIA_ 的好看和明了多了，AMD YES！）：

![[a0219b7ccf9f667da1e59006d368bb1d_MD5.webp]]

v2-1c5fea9e7f70885b59e0a637daffd43f_180x120

有关 Compute Shader 的更多内容参见：[知乎文章：Compute Shader : Optimize your game using compute](https://zhuanlan.zhihu.com/p/53785954)

### [](#sspr大体思路)SSPR 大体思路

一个大前提是将所有的图像处理（重建世界坐标，孔洞修复，边缘拉伸，自定义的 “深度测试” 等）放在 Compute Shader 中进行加速，通过 RenderFeature 来协调 ComputeShader 计算和正常的 Shader 渲染

*   从深度图重建当前世界坐标，将重建的世界坐标以反射平面为基准进行翻转处理
*   计算翻转后的世界坐标的屏幕 UV
*   对当前屏幕纹理进行采样暂存为一个 ReflectColor
*   将 ReflectColor 存入 ColorRT，但索引是反射后的屏幕像素值，也就是翻转后的世界坐标的屏幕 UV * ColorRT.size，这样在最后 Shader 中采样的时候就可以采样到反射后的颜色了
*   在反射平面的 Shader 中用模型的屏幕 UV 对 ColorRT 进行采样
*   在反射平面的 Shader 中采样噪声图进行混合，采样 Reflection Probe 进行混合来尽可能的让穿帮不会太明显

### [](#sspr存在的问题)SSPR 存在的问题

#### [](#反射渲染顺序错误)反射渲染顺序错误

由于我们使用了翻转后世界坐标进行投影变换 + 屏幕映射，所以会出现这种情况：原屏幕纹理中没有问题的像素会因为翻转 + 投影变换的原因会出现在反射平面中重合的情况，造成渲染顺序错误，并且由于 Compute Shader 执行的乱序性，会出现闪烁的情况

![[4b8cf8bdaa8f76694e20acb53c8a4006_MD5.webp]]

v2-b4b23b0c9defce7bc1571c07b1f7e81b_1440w

解决方案就是自己在 ComputeShader 中对 ColorRT 做深度测试

```
PosWSyRT[uint2(id.xy)] = 9999999;

uint2 reflectedScreenID = reflectedScreenUV * _RTSize;
float3 posWS = ConvertScreenIDToPosWS(id);

if(posWS.y < PosWSyRT[reflectedScreenID])
{
	float2 screenUV = id.xy / _RTSize;
	half3 inputPixelSceneColor = _CameraOpaqueTexture.SampleLevel(LinearClampSampler, screenUV, 0).rgb;

	ColorRT[reflectedScreenID] = half4(inputPixelSceneColor,1);
	PosWSyRT[reflectedScreenID] = posWS.y;
}




uint hash = id.y << 20 | id.x << 8 | fadeoutAlphaInt; 

InterlockedMin(HashRT[reflectedScreenID],hash);
```

#### [](#反射空洞)反射空洞

同样因为我们对翻转后的世界坐标进行透视投影变换，导致因为其近大远小的特性，像素会被偏移，也就导致我们最后的存在 ColorRT 中的纹理索引不对了（比如一个像素本该映射到 (233, 233) 索引的，可能会被映射到 (233, 232)，导致(233, 233) 这个索引处的纹理颜色一直为空，也就导致了空洞的出现），下图中对于墙壁边缘的偏移现象最为明显，其余地方的空洞也是由于这个偏移造成的

![[211f1b6ea6fe58c751aa29f21c23f855_MD5.webp]]

v2-d9c410d690ed383caf5a6572ecad5837_1440w

解决方案就是取得周围有效像素去填补空洞处

```
void FillHoles(uint3 id : SV_DispatchThreadID)
{
	
	id.xy *= 2;
	
	
	half4 center = ColorRT[id.xy + uint2(0, 0)];
	half4 right = ColorRT[id.xy + uint2(0, 1)];
	half4 bottom = ColorRT[id.xy + uint2(1, 0)];
	half4 bottomRight = ColorRT[id.xy + uint2(1, 1)];
	
	
	half4 best = center;
	best = right.a > best.a + 0.5 ? right : best;
	best = bottom.a > best.a + 0.5 ? bottom : best;
	best = bottomRight.a > best.a + 0.5 ? bottomRight : best;
	
	
	ColorRT[id.xy + uint2(0, 0)] = best.a > center.a + 0.5 ? best : center;
	ColorRT[id.xy + uint2(0, 1)] = best.a > right.a + 0.5 ? best : right;
	ColorRT[id.xy + uint2(1, 0)] = best.a > bottom.a + 0.5 ? best : bottom;
	ColorRT[id.xy + uint2(1, 1)] = best.a > bottomRight.a + 0.5 ? best : bottomRight;
}
```

修补后发现墙壁边缘的走样依旧存在，这是因为我们只是根据周边像素去修补空洞，但是没有去 “纠正” 已经偏移的像素造成的，而我们为了透视正确，这应该是必要的牺牲吧

![[514fab452e9b651daf5b8fbaa88eecd0_MD5.webp]]

v2-81ce40e5b7bb0974b8aae4b19dcd4a3b_1440w

#### [](#遮挡空洞)遮挡空洞

由于模型的遮挡问题，某些视角下反射平面将无法正确显示被遮挡的模型（比如一个墙壁前有一个浮空的 Cube，那么在反射平面上的墙壁就会出现一个 Cube 投影状的空白）

解决方案未知，有知道的大佬希望能指点一二。

![[0e3423c17b5631e4f4155a99e9a81ed9_MD5.webp]]

v2-0ef9c3d692d1f2f80463115b0c590501_1440w

#### [](#边缘缺失)边缘缺失

某些视角下（反射平面所需要的信息在相机渲染出来的屏幕纹理之外）会造成大块空白内容，只能通过拉伸这部分 uv 去处理

![[e52cb2e2dd561d84e9e85864d75104d1_MD5.webp]]

v2-5715562b708d7803404b6bd02e3d6505_1440w

但是这种方式没有办法处理所有角度的拉伸，仅适用于近乎平视且高度较低的情况，这是因为相机角度 / 高度过高会导致丢失的贴图位置偏高，而我们拉伸又是根据反转的世界坐标距离反射平面远近来确定拉伸系数的，所以就没有办法处理了

![[bf810d2440c1f06c9904d91d0196c864_MD5.webp]]

v2-96d1f4b8297e8c8c99870bc3caab9516_1440w

```
float Threshold = _ScreenLRStretchThreshold;
float Intensity = _ScreenLRStretchIntensity;
float HeightStretch = (abs(reflectedPosWS.y - _HorizontalPlaneHeightWS));
float AngleStretch = (-_CameraDirection.z);
float ScreenStretch = saturate(abs(reflectedScreenUV.x * 2 - 1) - Threshold);
reflectedScreenUV.x = reflectedScreenUV.x * 2 - 1;
reflectedScreenUV.x *= 1 + HeightStretch * AngleStretch * ScreenStretch * Intensity;
reflectedScreenUV.x = saturate(reflectedScreenUV.x * 0.5 + 0.5);
```

### [](#补充说明)补充说明

这种 SSPR 方案有一些十分明显的缺点，这些缺点都是因为其自身是基于屏幕空间的，如屏幕纹理原本就没有的内容，我们是没有办法变出来的，只能用各种 Trick 去处理，虽然做了种种 Trick 减缓了各种穿帮，但是仔细看还是会发现的，正所谓成也屏幕空间，败也屏幕空间，所以这边再多补充两个反射类型供参考

*   Planar Reflection，需要利用另一个与原相机 A 相对于反射平面对称的相机 B 再进行渲染一次，并且此次渲染会使用一个反射矩阵，这个反射矩阵用于将顶点相对于反射器平面进行翻转，所以需要放到观察变化之后，投影变换之前去做，然后将 Shader 挂载到平面上，根据其屏幕坐标去采样 B 相机渲染出来的屏幕纹理即可。这种方案优点是渲染信息全面，不容易穿帮，缺点是 Drawcall 直接翻倍，不是很能接受
*   Screen Space Reflection，另一种屏幕空间的反射，但他是基于一种光线步进的方式来做的，大体思路从平面开始根据场景的深度法线贴图去做碰撞 / 求交，得到反射颜色信息进行渲染。优点是基于 RayMarching 支持非平面，并且相对于本文记录的 SSPR 效果会好很多，缺点是显而易见的性能消耗爆炸（分支计算 + 求交操作）

本文是我边学边记录而成的一篇文章，可能有疏漏，错误之处，还请各位大佬不吝赐教。

## [](#参考)参考

[ColinLeung-NiloCat/UnityURP-MobileScreenSpacePlanarReflection](https://github.com/ColinLeung-NiloCat/UnityURP-MobileScreenSpacePlanarReflection)

[AMD PPT&&Video：Compute Shaders: Optimize your engine using compute / Lou Kramer, AMD (video)](https://link.zhihu.com/?target=https%3A//www.youtube.com/watch%3Fv%3D0DLOJPSxJEg)

[知乎文章：Compute Shader : Optimize your game using compute](https://zhuanlan.zhihu.com/p/53785954)

[screen-space-plane-indexed-reflection-in-ghost-recon-wildlands](http://remi-genin.fr/blog/screen-space-plane-indexed-reflection-in-ghost-recon-wildlands/#filling-the-gaps-jump)

[Unity_StochasticSSR[1]](https://zhuanlan.zhihu.com/p/38303394)

[Optimized pixel-projected reflections for planar reflectors](http://advances.realtimerendering.com/s2017/PixelProjectedReflectionsAC_v_1.92_withNotes.pdf)