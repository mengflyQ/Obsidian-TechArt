点击下面链接，B 站上传了实际 Game 窗口效果，视频有压缩，实际运行效果更好些~

[【1080P 高码率】Unity URP 管线，仿原神渲染，第 6 弹，人物展示场景更新_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15T411w7zG)

系列一共 5 篇：

【01】Unity URP 卡通渲染 原神角色记录 - Diffuse: Ramp + AO + Double Shadow

[张洋铭 Ocean：【01】Unity URP 卡通渲染 原神角色渲染记录 - Diffuse: Ramp + AO + Double Shadow](https://zhuanlan.zhihu.com/p/551104542)

【02】Unity URP 卡通渲染 原神角色记录 - Specular: Metal+Non-Metal

[张洋铭 Ocean：【02】Unity URP 卡通渲染 原神角色渲染记录 - Specular: Metal + Non-Metal](https://zhuanlan.zhihu.com/p/552097073)

【03】Unity URP 卡通渲染 原神角色记录 - Function-Based Light and Shadow: Emission+SDF 脸部阴影

[张洋铭 Ocean：【03】Unity URP 卡通渲染 原神角色渲染记录 - Function-Based Light and Shadow: Emission + SDF 脸部阴影](https://zhuanlan.zhihu.com/p/552097741)

【04】Unity URP 卡通渲染 原神角色记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light

[张洋铭 Ocean：【04】Unity URP 卡通渲染 原神角色渲染记录 - Depth-Based Effect: 7Spaces + 屏幕空间等距深度边缘光 Rim Light](https://zhuanlan.zhihu.com/p/552098339)

【05 | 当前浏览】Unity URP 卡通渲染 原神角色记录 - Double Pass Effect: Render Feature + 平滑法线 Outline

[张洋铭 Ocean：【05】Unity URP 卡通渲染 原神角色渲染记录 - Double Pass Effect: Render Feature + 平滑法线 Outline](https://zhuanlan.zhihu.com/p/552098653)

## 1. 前言

这一篇主要写 RenderFeature，以及**利用 RenderFeature，结合 LayerMask 进行 BackFace 描边**，同时也会提及平滑法线的计算脚本。

## 2. Unity URP 管线的光栅化 Rasterization 顺序问题

我们知道图形渲染，主要有光栅化 Rasterization，光线追踪 Ray Tracing 两种路径。这两者不矛盾，可以一起用。

那么 Unity URP 管线是如何进行光栅化渲染的呢？这里我们重点关注渲染的顺序，为了更好的说明，直接来一段源码吧:

![[a6f5412d1f6a7c2cf221ac23cbd7349c_MD5.jpg]]

URP 管线的渲染顺序，从代码中可以发现是如下的顺序:

**阴影 --> PrePass --> G Buffer --> Deferred Lights(延迟光照) --> 不透明物体 --> 天空盒子 --> 透明物体 --> 屏幕空间后处理**

G Buffer 说明: 就是把渲染表面 Surface 所需的所有数据，写入 Geometry Buffer，包括材质，位置，法线等

Positions, normals, and materials for each surface are rendered into the geometry buffer ([G-buffer](https://en.wikipedia.org/wiki/G-buffer))

## 3. 什么是 RenderFeature?

**Renderer Feature 可让我们向 URP Renderer 添加额外的渲染通道**，支持我们进行 Asset 资产配置来重写从而可以自定义渲染的顺序、渲染的对象、材质等等。

A Renderer Feature is an asset that lets you add extra Render passes to a URP Renderer and configure their behavior.

也就是说，在上面的渲染顺序中，我们可以加塞，弄一个自己的 pass 插进去。

这有什么用呢？比如像**描边这种事情，肯定都是不透明物体渲染完后，我们再额外描个边，这时候就可以插队到 Opaque 之后，放一个自己的 Pass。**

## 4. 如何创建 Render Feature?

URP 管线中，有 **2 种方式**可以做 render feature：

**第一种，Render Object**

URP contains the pre-built Renderer Feature called Render Objects.

这种方式很简单，点点按钮就好了

![[0442daa4fc2061bda6c6324d2b048426_MD5.jpg]]

这种方式，可以参考官方的教程，不是今天的重点：

[undefined](https://zhuanlan.zhihu.com/p/348500968)

**第二种，Scriptable Renderer Feature**

官方有个教程，可以看看

[undefined](https://zhuanlan.zhihu.com/p/373273390)

这种方式的核心就是写代码来定义一个 Render Feature，我是使用这种方式来定义一个描边 pass。

**Renderer Feature 定义的核心思路：放在 Opaque 物体之后，用 LayerMask 只选择人物 Layer，因为我们不需要对其他物体进行描边。**

把宵宫的人物放在 6 层，Character

![[03ae53ba628726ddcbbbe302a7624f57_MD5.jpg]]

创建脚本的方式可以参考官方教程，重点是 override Execute 方法这里，确保描边 pass 只用于宵宫所在的人物层：

```
ShaderTagId outlineTag = new ShaderTagId("Outline");

public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
{
    DrawingSettings drawingSettings = CreateDrawingSettings(outlineTag, ref renderingData, SortingCriteria.CommonOpaque);
    int myLayerIndexVariable = 6; // 宵宫的Layer Index
    int myLayerMaskVariable = 1 << myLayerIndexVariable; //用于Filter传参
    RenderQueueRange myRenderQueueRange = RenderQueueRange.opaque; //只包含不透明物体
    FilteringSettings filteringSettings = new FilteringSettings(myRenderQueueRange, myLayerMaskVariable);
    context.DrawRenderers(renderingData.cullResults, ref drawingSettings, ref filteringSettings);
}
```

**LayerMask 成功的之后，我们会发现，只有人物才描边，这里放一个对比图，左边的宵宫在 6 层，右边的球 default：**

![[3fca2b974f20f9e61a414e912aab63d3_MD5.jpg]]

之后记得在管线设置中，添加这个 Render Feature

![[90b6cd36cd717f77ef06001cc4655770_MD5.jpg]]

## 5. 法线平滑

有了 Render Feature 之后，我们就继续下一步，看看如何计算平滑法线。

**物体的硬边问题：处于硬边的顶点，会有多条法线存在，如图所示**

![[e9df522d994622d005a6589a9e4cd7e5_MD5.jpg]]

所以，**平滑法线的核心，就是发现有多个 normal 的 vertex 顶点，然后求平均法线，最后把平均法线存进 mesh 的 tangent 空间。**

如果对于图形学 7 大空间，有疑惑，请看第 4 篇，有讲解

[undefined](https://zhuanlan.zhihu.com/p/552098339)

核心代码如下，C# 脚本，挂在人物身上就行:

```
for (int i = 0; i < mesh.vertexCount; i++)
{
     Vector3 avgNormal = normalDictionary[mesh.vertices[i]].normalized;
     tangents[i] = new Vector4(avgNormal.x, avgNormal.y, avgNormal.z, 0f);
}
mesh.tangents = tangents;
```

## 6. BackFace 描边

这个相关的文章挺多了，说一下核心思路：

**在正常的 UniversalForward Pass 渲染完成后，我再加一个额外的 Pass，进行顶点沿法线方向偏移，之后输出颜色。**

UniversalForward Pass: Cull Back

Outline Pass: Cull Front

这里有一个选择问题，我们**在什么空间内，进行顶点偏移，我的选择是 Object Space 模型空间，效果最好**。

然后来看一下相关代码，很简单：

```
Pass
{
    Name "Outline"
    Tags { 
           "LightMode" = "Outline" //与ShaderTagId一致
    }
    Cull Front
    //.....其他参数根据工程需要配置
            
    HLSLPROGRAM
 #pragma vertex OutlinePassVert
 #pragma fragment OutlinePassFrag

    struct Attributes 
    {
       float4 vertex : POSITION;
       float3 normal : NORMAL;
       float2 uv : TEXCOORD0;
       float4 vertColor : COLOR;
       float4 tangent : TANGENT;
    };

    struct Varyings
    {
       float4 pos : SV_POSITION;
       float2 uv : TEXCOORD0;
       float3 vertColor : COLOR;
    };

    Varyings OutlinePassVert (Attributes v) 
    {
       Varyings o;
                
       UNITY_SETUP_INSTANCE_ID(v);
       UNITY_TRANSFER_INSTANCE_ID(v, o);
       UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
       //从tangent space取出平滑法线，进行外扩，处理硬边断裂
       v.vertex.xyz += v.tangent.xyz * 0.01 * _OutlineWidth * v.vertColor.a;//顶点色a通道控制粗细
       o.pos = TransformObjectToHClip(v.vertex.xyz);
       o.uv = v.uv;
       o.vertColor = v.vertColor.rgb;
       return o;
    }

    float4 OutlinePassFrag(Varyings i) : SV_TARGET 
    { 
       return float4(i.vertColor, 1) * _OutlineColor;//顶点色rgb混合描边颜色
    }

    ENDHLSL
}
```

接下来，我们看几个效果图的对比，首先是没有平滑法线的样子，只有正常的法线 normal

![[8ac3e81c2a7580d0fef452d2797a831b_MD5.jpg]]

然后是从 tangent 空间，取出平滑法线后再描边，我们可以发现硬边区域的描边，有了很大改善

![[1f20572ddbd064698dbdd82bd78c11b2_MD5.jpg]]

最后额外提一句，**脖子上的金属项链，不要描边，**我是通过宏 + Mask，扣掉了蝴蝶项链的大部分神之眼的描边，**以下是反例，如果直接输出颜色大概长下面的样子：**

![[b6fb591685ea2d07ce3a0e5f1c2d8df3_MD5.jpg]]

## 7. 后处理 ToneMapping，物理模拟和动画

**后处理的部分，我通过 Render Feature + Blit 方式，添加了 GranTurismo 的 ToneMapping，**Unity URP 默认只有 Neural 和 ACES 两种，不太给力。

动作可以去 Mixamo 上面白嫖，物理模拟用的 Magica Cloth，骨骼和弹簧模拟 2 种类型的结合。

## 8. 来看看最终成品效果

知乎视频太糊，清晰的去 B 站看吧：(知乎视频，移步 PC 端观看)

[【1080P 高码率】Unity URP 管线，仿原神渲染，第 6 弹，人物展示场景更新_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15T411w7zG)

本篇是这个系列的最后一篇，感谢阅读，后面有空再写写其他的，完结撒花✿✿ヽ (°▽°) ノ✿

更新预告:

下次的内容，自定义 Tonemapping-gran turismo，平面反射 - Planar Reflection，人物球

## 9. 参考链接

[Unity 官方：URP 系列教程 | 手把手教你如何用 Renderer Feature](https://zhuanlan.zhihu.com/p/348500968)

[Unity 官方：URP 系列教程 | 如何使用 Scriptable Renderer Feature 来自定义后处理效果](https://zhuanlan.zhihu.com/p/373273390)

[2173：【01】从零开始的卡通渲染 - 描边篇](https://zhuanlan.zhihu.com/p/109101851)