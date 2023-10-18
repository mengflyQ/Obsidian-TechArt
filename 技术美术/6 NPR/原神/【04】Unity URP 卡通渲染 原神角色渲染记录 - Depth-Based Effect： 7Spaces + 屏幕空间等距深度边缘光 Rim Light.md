点击下面链接，B 站上传了实际 Game 窗口效果，视频有压缩，实际运行效果更好些~

[【1080P 高码率】Unity URP 管线，仿原神渲染，第 6 弹，人物展示场景更新_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15T411w7zG)

系列一共 5 篇：

【01】Unity URP 卡通渲染 原神角色记录 - Diffuse: Ramp + AO + Double Shadow

[张洋铭 Ocean：【01】Unity URP 卡通渲染 原神角色渲染记录 - Diffuse: Ramp + AO + Double Shadow](https://zhuanlan.zhihu.com/p/551104542)

【02】Unity URP 卡通渲染 原神角色记录 - Specular: Metal+Non-Metal

[张洋铭 Ocean：【02】Unity URP 卡通渲染 原神角色渲染记录 - Specular: Metal + Non-Metal](https://zhuanlan.zhihu.com/p/552097073)

【03】Unity URP 卡通渲染 原神角色记录 - Function-Based Light and Shadow: Emission+SDF 脸部阴影

[张洋铭 Ocean：【03】Unity URP 卡通渲染 原神角色渲染记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影](https://zhuanlan.zhihu.com/p/552097741)

【04 | 当前浏览】Unity URP 卡通渲染 原神角色记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light

[张洋铭 Ocean：【04】Unity URP 卡通渲染 原神角色渲染记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light](https://zhuanlan.zhihu.com/p/552098339)

【05】Unity URP 卡通渲染 原神角色记录 - Double Pass Effect: Render Feature + 平滑法线 Outline

[张洋铭 Ocean：【05】Unity URP 卡通渲染 原神角色渲染记录 - Double Pass Effect: Render Feature + 平滑法线 Outline](https://zhuanlan.zhihu.com/p/552098653)

## 1. 前言

这一篇主要是和屏幕空间的等距离边缘光有关，实现方式是通过深度图差值的对比。

但在开始深度图之前，先来看看图形学中常见的 7 大空间，以及在这些空间中，我们关注的数据项，以及数据操作。之所以**先说 7 大空间，是因为后面屏幕空间等距 Rim 会用到这些概念**。

## 2. 七大空间 - 总览

线性代数中，一个 Subspace，基本就是 linear combination of basis vectors，也就是基向量的线性组合。

我们现在用的是 Euclidian 空间，对应的基向量就是 3 个互相垂直的单位向量: (1, 0, 0), (0, 1, 0), (0, 0, 1)。

同时一个子空间还要有个**原点 orgin，这个很重要**，**因为我在说坐标的时候，都是相对于原点 orgin 而言的。**我们就用这个原点在哪，以及坐标范围，来区分不同的图形学空间。

**图形学中常见的 7 大空间，我分成了 3 组：**

*   第一组: Object Space 模型空间, World Space 世界空间, View Space 相机 / 观察空间
*   第二组: Homogeneous Clip Space 剪裁空间, NDC Space 归一化设备空间, Screen Space 屏幕空间
*   第三组: Tangent Space 切线空间

![[19013b25a92ec2b3fdf1e408c901480c_MD5.jpg]]

### 2.1 核心的数据项

1.  **顶点位置 Vertex Position**
2.  **法线 Normal**

具体来说，我们主要关注，**顶点位置和法线，在不同空间之间的转换。**接下来，我们看看这些空间的意思，以及 Unity 不同空间中的转换。

![[268d43ce457d41731e0bf19926ce06ab_MD5.jpg]]

## 3. 第一组空间

主要靠原点位置来做区分：

**Object Space 模型空间：**

原点 origin 在模型身上，这个是在建模的时候，模型师规定的原点。那么模型空间的坐标就是相对于这个原点的向量值。

**World Space 世界空间：**

原点 origin 在世界的中心点，也就是 Unity 编辑器里面，position (0, 0, 0) 的这个点，那么世界空间的坐标都是相对于这个原点而言的。

**View Space 相机 / 观察空间：**

原点 origin 在 Camera 身上，所以观察空间的坐标，都是相对于相机身上这个原点而言的。

### 3.1 空间转换

对于 3 个空间之间的转换，一般来说我们只关心单向的转换： OS -> WS -> VS

数学上，这种转换，是通过更换基向量来完成的，change basis，也就是把老空间的 basis vector 映射到新空间的 basis vector。

在 Unity HLSL Shader 里面，我们有一些内置的方法完成这个操作：

### 3.2 从模型空间到世界空间转换：OS -> WS

```
//顶点位置 Vertex Position
positionWS = TransformObjectToWorld(positionOS);

//法线 Normal
normalWS = TransformObjectToWorldNormal(normalOS);
```

接下来，我们看来具体看看源码做了什么

![[6a769d08313c9119fccaca0cf333cfef_MD5.jpg]]

```
// Return the PreTranslated ObjectToWorld Matrix (i.e matrix with _WorldSpaceCameraPos apply to it if we use camera relative rendering)
float4x4 GetObjectToWorldMatrix() {
    return UNITY_MATRIX_M;
}
```

再来看看法线的源码：

核心还是矩阵乘法，注意矩阵乘法的顺序，不符合交换律

![[c308e54335a042c5532b6541a29853d4_MD5.jpg]]

对于法线，我们要用逆转置矩阵变换，Inverse Transpose

```
float4x4 GetWorldToObjectMatrix() {
    return UNITY_MATRIX_I_M;
}
```

### 3.3 从世界空间到相机 / 观察空间转换：WS -> VS

```
//顶点位置 Vertex Position
positionVS = TransformWorldToView(input.positionWS);
```

老规矩，看看源码，顶点的处理一般比法线简单很多

![[1e7e104e05b125adaa0b0aa27b4c5d8e_MD5.jpg]]

```
float4x4 GetWorldToViewMatrix() {
    return UNITY_MATRIX_V;
}
```

这里法线要单独提一下了，法线转到观察空间，我没看到直接的函数，不过原理还是利用逆转置矩阵，前面到世界空间是 M 的逆转置，这里是 **MV 的逆转置矩阵**：

```
//法线 Normal
normalVS = mul((real3x3)UNITY_MATRIX_IT_MV, input.normalOS); //注意是从OS->VS
```

## 4. 第二组空间

第二组空间，本质上都是更底层的空间，更接近 2D 图片的空间，主要靠坐标范围来做区分。

**Homogeneous Clip Space 齐次坐标剪裁空间：**

Homogeneous 齐次坐标，在线性代数中的引入，主要是为了解决平移变换的问题，因为原点不变性，我们需要更加一维来完成 translation 的线性变换。

这个空间，很多人会迷糊到底是啥，其实就是摄像机的视锥空间，图中 Near Plane - Far Plane 之间部分

![[c05ef671335eee9f2a838b86e0321d0c_MD5.jpg]]

这个视锥空间，有几个需要的注意的点：

1.  **Vertex Shader 的输出，是在 HCS 空间的顶点坐标**
2.  视锥之外的物体会被剔除，Clip 的由来
3.  这个视锥里面的坐标是 **homogeneous 的齐次坐标**
4.  这个视锥空间，在 MVP 矩阵转换之后得到

![[c15e81679541264dc900b5c58b578b4f_MD5.png]]

5. 【超级重要】**HCS 空间内的 xy 坐标范围，在 [-w, w] 之间！！！**

6. 在不同的图形 api 上的差异

the clip space coordinates (also known as post-projection space coordinates) differ between Direct3D-like and OpenGL-like platforms  
**Direct3D-like**: The clip space depth goes from 0.0 at the near plane to +1.0 at the far plane. This applies to Direct3D, Metal and consoles.  
**OpenGL-like**: The clip space depth goes from –1.0 at the near plane to +1.0 at the far plane. This applies to OpenGL and OpenGL ES.  
Inside Shader code, you can use the `UNITY_NEAR_CLIP_VALUE` [built-in macro](https://docs.unity3d.com/2019.1/Documentation/Manual/SL-BuiltinMacros.html) to get the near plane value based on the platform.

也就是说，我们想获得离相机近的截面，用 **UNITY_NEAR_CLIP_VALUE** 这个宏来跨平台。

**NDC(Normalized Device Coordinate) 归一化设备空间：**

可能是误解最多的空间，标准的 DNC 定义如下：

NDC space is a screen independent display coordinate system; it encompasses a cube where the x, y, and z components range from −1 to 1.

我们在变换到屏幕空间之前，需要把视锥空间，装到一个盒子里，这个盒子 xyz 坐标的范围是 [-1, 1]

但 Unity 里的 DNC，略有不同。**Unity 的 NDC 实际是 Homogeneous DNC！**

**Unity 实现从 HCS->NDC 的转换源码：**

![[b2b045bb84c4ff38ba1a91152423b6d7_MD5.jpg]]

超乎想象的简单，就 3 行代码，一行行的分析下，都干了点啥。

第一行，把视锥空间的齐次坐标都乘以 0.5，很简单

第二行，对 xy 坐标进行处理，x 坐标加上 w 奇次项，y 坐标乘以 1 或 -1 再加上 w 奇次项

_ProjectionParams.`x`is 1.0 (or –1.0 if currently rendering with a [flipped projection matrix](https://docs.unity3d.com/Manual/SL-PlatformDifferences.html)),

第三行，保留 zw 不变和 Clip Space 的值一样！

结论：这个转换之后，**Unity NDC 空间 xy 坐标范围从 [-w, w] ---> [0, w]。再次敲重点，Unity DNC 空间依然是 Homogeneous 奇次坐标！！！！！**

**Screen Space 屏幕空间：**

屏幕空间的坐标范围是从 [0, 1]，一般来说我们没法直接操控屏幕空间的坐标。但从上面 DNC 空间我们可以获得一个 xy 在[0, 1] 范围的屏幕坐标。

```
DNCSpace.xy / DNCSpace.w //得到[0, 1]之间的xy屏幕坐标
```

### 4.1 空间转换 (含 Unity 源码)

源码截图感觉，排版不太好看，就直接写下面吧

```
//顶点从VS --> HCS

// Transform to homogenous clip space
float4x4 GetWorldToHClipMatrix() {
    return UNITY_MATRIX_VP;
}
// Tranforms position from world space to homogenous space
float4 TransformWorldToHClip(float3 positionWS) {
    return mul(GetWorldToHClipMatrix(), float4(positionWS, 1.0));
}

positionCS = TransformWorldToHClip(input.positionWS);

//法线从VS --> HCS

// Transform to homogenous clip space
float4x4 GetWorldToHClipMatrix() {
    return UNITY_MATRIX_VP;
}

// Tranforms vector from world space to homogenous space
real3 TransformWorldToHClipDir(real3 directionWS, bool doNormalize = false) {
    float3 dirHCS = mul((real3x3)GetWorldToHClipMatrix(), directionWS).xyz;
    if (doNormalize)
        return normalize(dirHCS);

    return dirHCS;
}

normalCS = TransformWorldToHClipDir(input.normalWS);
```

从 HCS 到 DNC 的转换，上面以及提及了，这里就不在重复赘述。

## 5. 第三组空间

**Tangent Space 切线空间：**

这个空间好像挺多人有些迷惑，我们回顾一下**顶点 3 兄弟**，就不迷惑了。

*   对于任何一个顶点 Vertex，我们有 **normal 法线，tangent 切点，bitangent 双切线，三者互相垂直**。

![[e782ac7838c3d0324dee917481de8664_MD5.jpg]]

*   Texture 贴图是存在于切线空间的，原因就是顶点需要在一个平面上，这个平面是由 tangent 和 bitangent 构成，normal 则垂直于这个平面。

![[11f737b556fa54c74f1da41ef4190563_MD5.jpg]]

**TBN 矩阵，可以把进行空间转换，把 Tangent Space 映射到 Object Space，切线空间到模型空间**。

## 6. 深度图

有了 7 大空间的知识，我们再来看看深度图。**深度图就是一个单值 [0, 1] 区间的图片，代表里相机的远近。**

Unity 中，**离相机越远值越小 ---> 0，离相机越近值大 ---> 1**，如图所示:

![[d4a762ae9e5556573b4061a6dda6e9a1_MD5.jpg]]

那么如何获取这个深度图呢？我们使用的是 URP 管线，获取的方式如下：

![[2be6f7fccd2d9f8f05a0761b033d7e84_MD5.jpg]]

之后在 Shader 中，我们要加一个 Pass 渲染深度，代码如下:

```
Pass
{
   Name "Depth Rim"
   Tags
   {
      "LightMode" = "DepthOnly"
   }
   ZWrite On
   ColorMask 0
   Cull Off

   HLSLPROGRAM
   // Required to compile gles 2.0 with standard srp library
 #pragma vertex DepthOnlyVertex
 #pragma fragment DepthOnlyFragment
 #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"

   struct Attributes
   {
      float4 position     : POSITION;
      float2 texcoord     : TEXCOORD0;
      UNITY_VERTEX_INPUT_INSTANCE_ID
   };

   struct Varyings
   {
      float2 uv           : TEXCOORD0;
      float4 positionCS   : SV_POSITION;
      UNITY_VERTEX_INPUT_INSTANCE_ID
      UNITY_VERTEX_OUTPUT_STEREO
   };

   Varyings DepthOnlyVertex(Attributes input)
   {
      Varyings output = (Varyings)0;
      UNITY_SETUP_INSTANCE_ID(input);
      UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

      output.uv = TRANSFORM_TEX(input.texcoord, _BaseMap);
      output.positionCS = TransformObjectToHClip(input.position.xyz);
      return output;
   }

   half4 DepthOnlyFragment(Varyings input) : SV_TARGET
   {
       UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
       Alpha(SampleAlbedoAlpha(input.uv, TEXTURE2D_ARGS(_BaseMap, sampler_BaseMap)).a, _BaseColor, _Cutoff);
       return 0;
   }
            
   ENDHLSL
}
```

## 7. Frame Debug 截帧工具

那么问题来了，如何确定我们已经获得了深度图呢？这时候可以利用一个 Unity 中的工具，叫 Frame Debug 来查看，如下图:

![[da59d7b5f1ad2023d3607dee995d5ca7_MD5.jpg]]

虽然不是本篇重点，简单再说两句 Frame Debug。这是一个截帧工具，可以看渲染的顺序和每一个 DrawCall 都渲染了什么东西，**主要用途是用来优化性能。**

接下来需要记得这个名字，Unity 免费送给我们的深度 Texture 叫 **_CameraDepthTexture，**Shader 中直接取这个名字就好。

```
TEXTURE2D_X_FLOAT(_CameraDepthTexture); SAMPLER(sampler_CameraDepthTexture);
```

## 8. 屏幕空间深度等距边缘光 Rim Light

现在要实现屏幕空间等距离 Rim，就变得很简单了。

**核心思路：通过在屏幕空间的顶点偏移，对比顶点偏移前后，深度的差值，满足一定门槛则处于边缘光当中，输出颜色。**

Shader 中的相关代码，这里注意**我们不需要单独开 Pass 去做深度边缘光，直接在 UniversalForward 的 Frag Shader 中处理即可**，代码如下：

```
//边缘光Rim: 屏幕空间深度边缘光
float3 nonHomogeneousCoord = IN.posDNC.xyz / IN.posDNC.w;
float2 screenUV = nonHomogeneousCoord.xy;
// 保持z不变即可
float3 offsetPosVS = float3(IN.posVS.xy + IN.nDirVS.xy * _RimWidth, IN.posVS.z);
float4 offsetPosCS = TransformWViewToHClip(offsetPosVS);
float4 offsetPosVP = TransformHClipToViewPortPos(offsetPosCS);

float depth = SampleSceneDepth(screenUV); 
float linearEyeDepth = LinearEyeDepth(depth, _ZBufferParams); // 离相机越近越大

float offsetDepth = SampleSceneDepth(offsetPosVP);
float linearEyeOffsetDepth = LinearEyeDepth(offsetDepth, _ZBufferParams);

float depthDiff = linearEyeOffsetDepth - linearEyeDepth;
float depthDiff = linearEyeOffsetDepth - linearEyeDepth;
float rimMask = smoothstep(0, _RimThreshold, depthDiff);
rim = rimMask * _RimColor * shadowColor * baseColor * step(0.1, lightMap.g);
```

## 9. Rim Light 实际效果

我们来看看运行的实际效果，人物输出黑色，同时我把边缘光的范围和强度都调大了，方便观察。相机缩放，边缘光会等比例缩放。

![[fdb1c479bd5e87ead5f2fd64e07a88a2_MD5.jpg]]

动态效果：(这里是视频，PC 端浏览，手机 APP 好像看不见)

到此，本篇分享就结束了。

下次预告：【05】Unity URP 卡通渲染 原神角色记录 - Double Pass Effect: RenderFeature + 平滑法线 Outline。

下一篇，会讲 Unity URP 管线中的一个功能叫 Render Feature，以及通过平滑法线，BackFace 方式进行人物描边。

[张洋铭 Ocean：【05】Unity URP 仿原神渲染记录 - Double Pass Effect: Render Feature + 平滑法线 Outline](https://zhuanlan.zhihu.com/p/552098653)

## 10. 参考链接

感谢各位知乎大佬的分享，列表如下：

[Jason Ma：【JTRP】屏幕空间深度边缘光 Screen Space Depth Rimlight](https://zhuanlan.zhihu.com/p/139290492)

[T.yz：[卡通渲染] 副本、等宽屏幕空间边缘光 - 边缘光实现](https://zhuanlan.zhihu.com/p/551629982)

[Cutano：Unity URP Shader 与 HLSL 自学笔记六 等宽屏幕空间边缘光](https://zhuanlan.zhihu.com/p/365339160)