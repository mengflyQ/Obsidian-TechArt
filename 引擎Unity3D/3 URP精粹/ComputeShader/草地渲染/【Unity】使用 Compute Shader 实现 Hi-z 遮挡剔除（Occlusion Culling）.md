[【Unity】使用Compute Shader实现Hi-z遮挡剔除（Occlusion Culling） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/396979267)
## 前言

在之前的文章里，分别介绍了一下 Compute Shader 的**基本概念**，以及使用 Compute Shader 实现简单的**视锥剔除**：

[Unity 中 ComputeShader 的基础介绍与使用](https://zhuanlan.zhihu.com/p/368307575)[Unity 中使用 ComputeShader 做视锥剔除（View Frustum Culling）](https://zhuanlan.zhihu.com/p/376801370)

本文我们再进一步，在视椎剔除的基础上，想办法把**遮挡剔除**也给加上来，具体实现后的效果图如下：

![[cb27f052a044e360423d9bce0fca911b_MD5.gif]]

![[4473b82b74493cb84112548b36dd4812_MD5.jpg]]

Demo 工程：

[ComputeShaderDemo/Assets/OcclusionCulling/Hiz at master · luckyWjr/ComputeShaderDemo](https://github.com/luckyWjr/ComputeShaderDemo/tree/master/Assets/OcclusionCulling/Hiz)

Demo 中我们绘制了 9w 颗草，使用的是 Hiz 的遮挡剔除方法，具体的思路参考了下面大佬的分享：

[Compute Shader 进阶应用: 结合 Hi-Z 剔除海量草渲染](https://zhuanlan.zhihu.com/p/278793984)注：本文是在 unity 的 build-in 渲染管线下实现的，对于使用 srp 的童鞋尽可做一些参考。

## 场景搭建

之前视锥剔除的一圈白色的树实在忒丑了，因此这个 Demo 的场景，就尽量让其美观一些，如下图：

![[b457020fce7f8ea1813a2318be728d53_MD5.jpg]]

由于使用的不是 Terrain，也没有相应的高度图来采样，因此 Demo 中每颗草的高度利用了射线检测（**RaycastHit**）的方法来获取。

并且因为我们使用的是 **Graphics.DrawMeshInstancedIndirect** 的技术来绘制这些草，因此对 Shader 也要进行一些修改。对于 Surface Shaders，可以利用如下指令手动设置 **instance data**：

```
#pragma instancing_options procedural:functionName
```

**在 Vertex Shader 开始时，Unity 会调用名为 functionName 的函数，我们可以在该函数内部设置我们每个要实例化的对象（Demo 中的每颗草）的数据。**如下代码，我们设置的了每颗草的模型空间与世界空间的互相转换的矩阵的值：

```
SubShader
{
	......
	#pragma instancing_options procedural:setup
	......
#ifdef UNITY_PROCEDURAL_INSTANCING_ENABLED
	StructuredBuffer<float4x4> positionBuffer;
#endif
	void setup() {
#ifdef UNITY_PROCEDURAL_INSTANCING_ENABLED
		unity_ObjectToWorld = positionBuffer[unity_InstanceID];
		unity_WorldToObject = unity_ObjectToWorld;
		unity_WorldToObject._14_24_34 *= -1;
		unity_WorldToObject._11_22_33 = 1.0f / unity_WorldToObject._11_22_33;
#endif
	}
	void surf(Input i , inout SurfaceOutputStandard o) {
		......
	}
	ENDCG
}
```

如果在 Fragment Shader 中包含任何获取的 instance 属性，Unity 也会在 Fragment Shader 开始时调用该函数。

官方文档：

[Unity - Manual: GPU instancing](https://docs.unity3d.com/Manual/GPUInstancing.html)

此时还没有做剔除操作，所以绘制 9w 颗草的时候，所有草的顶点都会被提交到渲染管线当中，增加 GPU 的负担，使得 FPS 很低。

![[f14116b0b659e124c10c09ea21cdfcaf_MD5.jpg]]

## 视椎剔除

接着我们再把视椎剔除给加上，视锥剔除的原理在之前的文章里已经介绍过了，这里就不赘述了。

不过本 Demo 中还是做了一些稍稍的修改，之前我们判断物体是否在视椎体外用的是把包围盒的顶点和视椎体的六个面做比较，这样可以有效避免一些需要渲染的大物体（例如墙体）由于包围盒顶点都在视椎体外而被剔除的情况。但是本 Demo 渲染的都是草这样的小物体，不存在类似前面说的情况，**因此我们可以使用渲染管线在 Clip Space 下做剔除的原理：即视椎体内的顶点，它的其次裁剪坐标的 xyz 取值范围应该在 (-w~w, -w~w,- w~w) 之间，若是 DirectX 的话 z 的范围为 0~w ：**

```
//在Clip Space下，根据齐次坐标做Clipping操作
bool IsInClipSpace(float4 clipSpacePosition) {
    if (isOpenGL)
        return clipSpacePosition.x > -clipSpacePosition.w && clipSpacePosition.x < clipSpacePosition.w&&
        clipSpacePosition.y > -clipSpacePosition.w && clipSpacePosition.y < clipSpacePosition.w&&
        clipSpacePosition.z > -clipSpacePosition.w && clipSpacePosition.z < clipSpacePosition.w;
    else
        return clipSpacePosition.x > -clipSpacePosition.w && clipSpacePosition.x < clipSpacePosition.w&&
        clipSpacePosition.y > -clipSpacePosition.w && clipSpacePosition.y < clipSpacePosition.w&&
        clipSpacePosition.z > 0 && clipSpacePosition.z < clipSpacePosition.w;
}
```

对 Clip Space 不是很懂的，可以了解下透视变换的原理：

[视图变换和投影变换矩阵的原理及推导，以及 OpenGL，DirectX 以及 Unity 的对应矩阵](https://zhuanlan.zhihu.com/p/362713511)

因此我们只需要判断每个草的包围盒顶点做完 MVP 变化后是否都在指定范围内，若都不在，则需要被剔除。这种方法比计算视椎体的六个面再判断要来的简单很多，得到的效果如下：

![[cb0b86f77e6b3b0434ab93798aeb1adf_MD5.gif]]

可以发现帧率比剔除前明显改进了很多，而且得到的画面没有任何的变化。

![[2323bcde54268c291d4ece8815abac98_MD5.jpg]]

## 遮挡剔除与深度

视椎剔除后，我们已经得到了一个不错的效果，那么还有没有办法更进一步的优化呢？

我们先来看两张图，如下：

![[9dd81b07ef02abf444168e62a726760d_MD5.jpg]]

![[df4883a31bee7ec8cf6cbcfb4c2ec958_MD5.jpg]]

图中我们可以发现，对于石头后面或者是山坡后面的草，由于被遮挡住了的关系，实际上是不会绘制到最终的屏幕上的，因此遮挡剔除要做的就是把这些被遮挡的物体在提交给渲染管线之前就剔除掉。那么问题的关键就是怎么判断要渲染的对象是否被遮挡住了，这里就需要**深度图**（Depth Texture）来帮助我们了。

深度图的介绍可参考：

[【Unity】深度图（Depth Texture）的简单介绍](https://zhuanlan.zhihu.com/p/389971233)

那么深度图怎么可以帮我们判断遮挡关系呢？我们知道深度图中每个像素只会记录下离 Camera 更近的物体深度，在 Unity 中，如果是 DirectX 类的 API，那么深度值越大说明越接近 Camera，如果是 OpenGL 类 API，则是深度值越小说明越接近 Camera，这里我们以 DirectX 为例。

也就是说在 Camera 视角下，如果 A 物体完全遮挡住了 B 物体，那么 A 的深度肯定大于 B 的深度，并且深度图的对应像素上肯定不是 B 的深度值，而是比它大的值（可能是 A 的，也可能是比 A 更前面的物体）。那么反过来说，**如果一个物体的深度都小于深度图上对应区域的深度，那么该物体肯定被完全遮挡了，需要被剔除。而如果该物体的深度只要有任意一部分大于深度图上对应区域的深度，那么该物体就能够被 Camera 所看见，不能被剔除。**

我们从一个例子来入手理解，如下图，假设我们要在场景中的 A，B，C 三个区域分别绘制一颗草，区域大小也就是草的 AABB 大小：

![[d5cdc4da65e65e8a85cec9a0b2287b35_MD5.jpg]]

而该场景此时的深度图如下图：

![[fecd909a3d02820cb778318604361e1b_MD5.jpg]]

接下来我们来看看三个区域的深度图是什么样的：

![[786817527ce42864189755fe4427e7b5_MD5.jpg]]

很明显，可以发现：

*   A 的深度值都小于深度图中该区域的值，所以 A 不能被 Camera 所看见，可以被剔除。
*   B 虽然左半部分的深度值小于深度图中对应区域的值，但是右半部分的深度值却大于深度图中的值，说明这一部分能够被看见，不能剔除。
*   C 的深度值都大于深度图中该区域的值，说明全部都能被看见，不能剔除。

所以只需要绘制 B，C 两个草即可，将 A 剔除掉：

![[2ac35bd2da7fea3fd5d04447a465636c_MD5.jpg]]

注 1：常规剔除方式有逐对象剔除，逐三角形剔除，逐像素剔除这么几种，而本文使用的 GPU Instance 技术适用于逐对象剔除，即单颗草要么都被剔除要么都存在，不存在单颗草的 mesh 只剔除了部分面这类的情况。

注 2：当场景绘制了草后，那么后续的深度图也会带有这些草的信息，但是由于我们计算时使用的是草的 AABB 的位置计算深度，因此计算的深度肯定大于草的 Mesh 实际深度，因此不会出现 z-fight 现象。

## Hi-Z

前面我们解释了如何用深度来判断遮挡关系，但是实际比较起来却需要不少的运算量。因为我们**需要一个像素一个像素的比较**，当一些草离 Camera 比较近，它的包围盒都会覆盖到非常多的像素，每个像素都要计算一次深度，然后再从深度图中采样深度，最后做对比。那么当草的数量非常多的时候，这个计算量同样非常的夸张，无法达不到很好的优化效果。

那么有没有什么好的办法呢？这里我们先做一个假设，假设当一个草的包围盒覆盖了 N 个像素时，每个像素的深度值都相同，其值记为 depthGrass。那么当我们要判断遮挡关系时就要从深度图中采样这 N 个像素，记为 depthTexture[xy]，然后和 depthGrass 作比较：

*   如果 depthTexture[xy] 的值都大于 depthGrass，那么该草被遮挡。
*   如果 depthTexture[xy] 中有任意一个值小于 depthGrass，那么该草能被看见。

**换句话说：如果被遮挡，即是 depthTexture[xy] 中的最小值大于 depthGrass，否则 depthTexture[xy] 中的最小值小于 depthGrass。那么问题的核心就变成了怎么快速的获取深度图中一片区域内的最小值了，而 Mipmap 就可以帮助我们解决这个的问题。**

在学习图形学的时候，提到 Mipmap 属于一种**范围查询**，可以帮我们查询到一个范围内的像素平均值。同样的我们可以**使用 Mipmap 来帮我们查询到一个范围内的像素最小值**，只需要稍稍修改下 Mipmap 的生成方法即可。

Mipmap 的简单介绍可参考：

[王江荣：纹理映射（Texture mapping）](https://zhuanlan.zhihu.com/p/364045620)

举个例子，如下图，假设图中一个格子就代表深度图中的一个像素，ABCD 是某个草所覆盖的区域，那么该草一共覆盖了 13*13 个像素，我们要采样和比较 169 次才能确定是否被遮挡。

![[72cc3e61763a95d8211f12f71d487e78_MD5.jpg]]

但是如果我们每次以最小值生成 Mipmap，那么在第 3 层 Mipmap 上（log(13)=3），每个像素的值代表了原本深度图中 64 个像素的最小值。覆盖情况可能如下图：

![[974b8e22b5f0f7a4db05842c26655d5c_MD5.jpg]]

可以发现在 Mipmap[3] 上只覆盖了 4 个像素，我们**只需要采样和对比 4 次即可**。如果这四个像素的深度值都大于 depthGrass，那就说明原本深度图中对应的 256 个像素的深度值都大于 depthGrass，草被完全遮挡了。如果四个中至少有一个像素小于 depthGrass，那就说明原本深度图中对应的 256 个像素的深度值至少有一个小于 depthGrass，草还能被看见。

注：因为原本深度图中，我们的区域只覆盖了 169 个像素，而在 Mipmap 里取的是 256 个像素中的四个最小值。这就可能存在原本 169 像素的深度值都大于 depthGrass（草被完全遮挡），但是周边的某个像素（比如原始深度图中 A 点左上角那个像素）的深度值小于 depthGrass，那么在 Mipmap[3] 中 A 点所在的那个像素的深度值也会小于 depthGrass，导致该草不能被剔除的错误情况。为了加速，减少计算，对于这类的误判断，我们还是可以容忍滴，有几个剔不掉那就剔不掉嘛。

对于上面这样使用 Mipmap 的优化方法，就是 Hi-z 的原理了，Hiz 的全称是 Hierarchical-Z map，其中 Hierarchical 的意思指的就是这一系列 Mipmap。

那么接下来要解决的问题就是怎么生成这一系列的 Mipmap，以及怎么用一个 depthGrass 代表整个 AABB 的深度。

## 深度图 Mipmap 生成

在说 Mipmap 之前，我们先来看一下 Unity 的[生命周期函数](https://docs.unity.cn/2021.1/Documentation/Manual/ExecutionOrder.html)，官方示意图如下：

![[d245c98cce2521181c714b44e4e652f1_MD5.jpg]]

我们应该在 Scene rendering 之前调用 Graphics.DrawMeshInstancedIndirect，将剔除后的结果给提交上去。但是当前帧的深度图只有在 **OnPostRender** 中才能正确获得，也就是说我们**在 Update 方法里无法获取到当前帧的深度图**。因此我们往往会在 Update 中**使用上一帧生成深度图**来做遮挡剔除操作。当然这就会造成当帧率很低或者镜头移动过快，由于前后两帧差异过大而导致的一些异常效果，如下图：

![[94b0a50c5638194bb86872e02b9c3056_MD5.gif]]

搞清楚生命周期和深度图的关系后，我们再来看看怎么利用深度图生成 Mipmap。在 Unity 中，我们可以使用 **RenderTexture** 来存储深度图以及其对应的 MipMap。利用 [Graphics.CopyTexture()](https://docs.unity.cn/2021.1/Documentation/ScriptReference/Graphics.CopyTexture.html) 方法可以为 Texture 设置 Mipmap：

```
public static void CopyTexture(Texture src, int srcElement, int srcMip, Texture dst, int dstElement, int dstMip);
```

由于 MipMap 的尺寸必须是 2 的幂次方，我们可以取屏幕分辨率较长的边的下一个 2 的幂次方值作为 RenderTexture 的大小。

那么当我们把屏幕分辨率大小的_CameraDepthTexture 存储到 2 的某幂次方大小的 RenderTexture 时，就会必定会存在拉伸的情况。这里 RenderTexture 的 filterMode 需要设置为 **FilterMode.Point**，因为我们并不需要在拉伸时采样周边像素的深度去做双线性插值或者三线性插值，直接采样即可。

RenderTexture 的初始化代码如下：

```
RenderTexture m_depthTexture;//带 mipmap 的深度图
public RenderTexture depthTexture => m_depthTexture;

int m_depthTextureSize = 0;
public int depthTextureSize {
    get {
        if(m_depthTextureSize == 0)
            m_depthTextureSize = Mathf.NextPowerOfTwo(Mathf.Max(Screen.width, Screen.height));
        return m_depthTextureSize;
    }
}

const RenderTextureFormat m_depthTextureFormat = RenderTextureFormat.RHalf;//深度取值范围0-1，单通道即可。

void InitDepthTexture() {
    if(m_depthTexture != null) return;
    m_depthTexture = new RenderTexture(depthTextureSize, depthTextureSize, 0, m_depthTextureFormat);
    m_depthTexture.autoGenerateMips = false;//Mipmap手动生成
    m_depthTexture.useMipMap = true;
    m_depthTexture.filterMode = FilterMode.Point;
    m_depthTexture.Create();
}
```

接下来就是如何手动生成 Mipmap 并且存储对应像素的最小值了，这里我们要借助 [Graphics.Blit()](https://docs.unity.cn/2021.1/Documentation/ScriptReference/Graphics.Blit.html) 方法了：

```
public static void Blit(Texture source, RenderTexture dest, Material mat);
```

利用该方法，**在生成 dest 纹理时，Unity 会调用我们设置的 mat 里的 Shader，并且把 source 设置到 Shader 的_MainTex 属性中，这样我们就可以在 Shader 中针对 source 对 dest 纹理的每个像素进行自定义处理。**（也可以 source 传 null，然后利用 Material.SetTexture 设置纹理）

例如我们可以把 Mipmap[i] 作为 source，Mipmap[i+1] 作为 dest 进行 Blit，然后在自定义 Shader 中，对 Mipmap[i+1] 的每个像素找到它对应在 Mipmap[i] 的 4 个像素，最后存储这 4 个像素的最小值。

我们来简单分析下如何在 Shader 中实现这一过程，首先我们知道 Mipmap[i+1]中下标为 (x, y) 像素，应该对应的是 Mipmap[i]的 (2x, 2y)、(2x, 2y+1)、(2x+1, 2y)、(2x+1, 2y+1) 这四个像素。而在 Shader 中我们需要使用 uv 来表示，假设 Mipmap[i+1]的边长为 w，那么 Mipmap[i]的边长即为 2w。Mipmap[i+1]中下标为 (x, y) 的像素的 uv 坐标即为 (x/w, y/w)，对应的 Mipmap[i] 的四个像素的 uv 则为(2x/2w, 2y/2w)、(2x/2w, (2y+1)/2w)、((2x+1)/2w, 2y/2w)、((2x+1)/2w, (2y+1)/2w)，即：

Mipmap[i+1]的 (u, v) 对应 Mipmap[i]的(u, v)、(u, v+0.5/w)、(u+0.5/w, v)、(u+0.5/w, v+0.5/w)。

有了这个关系，我们的 Shader 代码就可以写出来了，利用_MainTex 作为 Mipmap[i+1] 来生成新的 Mipmap[i]：

```
Shader "Custom/DepthTextureMipmapCalculator"
{
    Properties{
        [HideInInspector] _MainTex("Previous Mipmap", 2D) = "black" {}
    }
    SubShader{
        Pass {
            Cull Off
            ZWrite Off
            ZTest Always

            CGPROGRAM
 #pragma target 3.0
 #pragma vertex vert
 #pragma fragment frag

            sampler2D _MainTex;
            float4 _MainTex_TexelSize;

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };
            struct v2f
            {
                float4 vertex : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            inline float CalculatorMipmapDepth(float2 uv)
            {
                float4 depth;
                float offset = _MainTex_TexelSize.x / 2;
                depth.x = tex2D(_MainTex, uv);
                depth.y = tex2D(_MainTex, uv + float2(0, offset));
                depth.z = tex2D(_MainTex, uv + float2(offset, 0));
                depth.w = tex2D(_MainTex, uv + float2(offset, offset));
#if defined(UNITY_REVERSED_Z)
                return min(min(depth.x, depth.y), min(depth.z, depth.w));
#else
                return max(max(depth.x, depth.y), max(depth.z, depth.w));
#endif
            }
            v2f vert(appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex.xyz);
                o.uv = v.uv;
                return o;
            }
            float4 frag(v2f input) : Color
            {
                float depth = CalculatorMipmapDepth(input.uv);
                return float4(depth, 0, 0, 1.0f);
            }
            ENDCG
        }
    }
}
```

这里我们利用到了内置变量**_MainTex_TexelSize**，它的 xyzw 四个值分别代表的是 1.0/width，1.0/height，width，height，其中 width 和 height 即为_MainTex 的长宽。

注：如果是 OpenGL 这类没反转过深度值的，那么就是值越大代表越远，所以要取 max。

接着我们就可以在 C# 中利用这个 Shader 生成我们的 Mipmap 了，代码如下：

```
public Shader depthTextureShader;//用来生成mipmap的shader
Material m_depthTextureMaterial;
int m_depthTextureShaderID;

void Start() {
    Camera.main.depthTextureMode |= DepthTextureMode.Depth;
    m_depthTextureMaterial = new Material(depthTextureShader);
    m_depthTextureShaderID = Shader.PropertyToID("_CameraDepthTexture");
}

//生成mipmap
void OnPostRender() {
    int w = m_depthTexture.width;
    int mipmapLevel = 0;

    RenderTexture currentRenderTexture = null;//当前mipmapLevel对应的mipmap
    RenderTexture preRenderTexture = null;//上一层的mipmap，即mipmapLevel-1对应的mipmap
    
    //如果当前的mipmap的宽高大于8，则计算下一层的mipmap
    while(w > 8) {
        currentRenderTexture = RenderTexture.GetTemporary(w, w, 0, m_depthTextureFormat);
        currentRenderTexture.filterMode = FilterMode.Point;
        if(preRenderTexture == null) {
            //Mipmap[0]即copy原始的深度图
            Graphics.Blit(Shader.GetGlobalTexture(m_depthTextureShaderID), currentRenderTexture);
        }
        else {
            //将Mipmap[i] Blit到Mipmap[i+1]上
            Graphics.Blit(preRenderTexture, currentRenderTexture, m_depthTextureMaterial);
            RenderTexture.ReleaseTemporary(preRenderTexture);
        }
        Graphics.CopyTexture(currentRenderTexture, 0, 0, m_depthTexture, 0, mipmapLevel);
        preRenderTexture = currentRenderTexture;

        w /= 2;
        mipmapLevel++;
    }
    RenderTexture.ReleaseTemporary(preRenderTexture);
}
```

由于草相对比较小，不太可能单颗草覆盖屏幕很多的像素，因此我们的 Mipmap 最小到 16*16 的大小基本就可以了。假设屏幕分辨率为 500*300，那么生成的 Mipmap 如下图：

![[69e0a93de81ecda06d51256ba20f3b23_MD5.jpg]]

## AABB 的深度计算

深度图处理好之后，就只差如何计算 AABB 的深度这个问题了。终于要大功告成了！

我们先来看如下示意图：

![[a6b34f3501592709f867bf4740cafa27_MD5.jpg]]

上图 1，2，3 展示的是 Camera 从不同角度看向 AABB 的俯视图，可以看出我们的包围盒虽然在世界坐标下是轴对称的，但是变换到视图空间下就不一定了，而且由于透视投影变换到 NDC 下甚至不是长方体了。根据深度图的计算公式我们知道深度值只和 Camera 的 near clip plane，far clip plane 以及物体在视图空间下的 z 值有关。上图 2，3 可以明显看出 E 到 G 的深度值是一直在变化的，那么我们怎么使用一个值来代表整个 AABB 的深度值呢？

首先这个值需要满足什么条件？比方说我能使用图 3 中 A 点的深度值来代表整个 AABB 么，很明显不可以。因为 A 点的深度很可能小于草的实际深度，这样如果有个遮挡物的深度在 A 点和草的实际深度之间时，就会导致草实际没被完全遮挡但是由于遮挡物的深度大于 A 点的深度从而被认为被完全遮挡而剔除掉。为了画面效果，我们**宁可放过，不可杀错，所以我们代表 AABB 的深度值一定要比草的实际深度大**。最理想的效果就是图 1，2 使用 B 点的深度，图 3 使用 D 点的深度。

常见的做法有**从 AABB 的中心点（图中 o 点）向 CameraForward 的负方向偏移一段距离**，然后以偏移后的点的深度作为 AABB 的深度值。该方法计算简单，但是缺点在于这个偏移距离不好把控，因为理论上不同位置的 AABB 的偏移距离都应该不同，例如图 1 只需要偏移 AB 长度的一半即可，图 2 需要偏移大约 OB 的长度，如果都使用一个较大的固定值就可能导致放生太多。

想到一个方法可以直接得到图 1，2 的 B 点深度以及图 3 的 D 点深度，**既然世界坐标的 AABB 在 NDC 下变得不规则体了，那么我们就在 NDC 下用一个新的 AABB 去包住这个不规则体。**示意图如下：

![[4c0ca94b4a153a7877dfb0b32da0fc53_MD5.jpg]]

其中包围盒的各个顶点在 NDC 的坐标我们都可以计算出来，那么取他们三个轴的最大值最小值就可以得到新的包围盒的各顶点的值。其中 EF 平面的深度就可以代表原本 ABCD 的深度，而在 DirectX 下，EF 的深度就是 E 点的 z 值。

想要计算 ABCD 在 NDC 下的坐标，我们只需要知道 Camera 对应的 VP 矩阵即可，它们可以在 C# 代码中获得然后传递给 ComputeShader。其中 V 矩阵可以通过 **Camera.worldToCameraMatrix** 获得，P 矩阵可以通过 **GL.GetGPUProjectionMatrix(Camera.main.projectionMatrix, false)** 获得。

GetGPUProjectionMatrix 详细介绍可参考下面链接文末：

[王江荣：视图变换和投影变换矩阵的原理及推导，以及 OpenGL，DirectX 以及 Unity 的对应矩阵](https://zhuanlan.zhihu.com/p/362713511)

而且上述的方法也非常好求 ABCD 所覆盖的像素，只需要计算出 EF 平面左下角和右上角两个点所在的像素即可。

我们来看看怎么将 NDC 坐标转换到像素坐标，首先由于 NDC 坐标 x，y 的取值范围是 - 1 到 1，因此我们需要先将其转化到 0 到 1，也就是 uv 坐标：

```
float2 uv = ndc.xy * 0.5f + 0.5f;
```

然后乘以图片的分辨率即可：

```
int2 pixel = int2(uv * size);
```

这样我们就可以知道原本的 AABB 覆盖的屏幕像素区域了，而对应的 Mipmap 层级，我们只需要做一次 Log 运算即可得到。

完整的 ComputeShader 代码如下：

```
//视椎剔除+Hiz遮挡剔除
#pragma kernel GrassCulling

uint grassCount;//草的总数量
uint depthTextureSize;//原始深度图的大小
StructuredBuffer<float4x4> grassMatrixBuffer;//所有草的M矩阵
bool isOpenGL;//是否是OpenGL的API

float4x4 vpMatrix;//相机的VP矩阵
AppendStructuredBuffer<float4x4> cullResultBuffer;//剔除后保留的草
Texture2D hizTexture;//hiz纹理

static float3 boundMin = float3(-0.2f, 0.0f, -0.3f);//包围盒最小点
static float3 boundMax = float3(0.2f, 0.5f, 0.3f);//包围盒最大点

//在Clip Space下，根据齐次坐标做Clipping操作
bool IsInClipSpace(float4 clipSpacePosition)
{
    if (isOpenGL)
        return clipSpacePosition.x > -clipSpacePosition.w && clipSpacePosition.x < clipSpacePosition.w&&
        clipSpacePosition.y > -clipSpacePosition.w && clipSpacePosition.y < clipSpacePosition.w&&
        clipSpacePosition.z > -clipSpacePosition.w && clipSpacePosition.z < clipSpacePosition.w;
    else
        return clipSpacePosition.x > -clipSpacePosition.w && clipSpacePosition.x < clipSpacePosition.w&&
        clipSpacePosition.y > -clipSpacePosition.w && clipSpacePosition.y < clipSpacePosition.w&&
        clipSpacePosition.z > 0 && clipSpacePosition.z < clipSpacePosition.w;
}

[numthreads(640, 1, 1)]
void GrassCulling(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= grassCount) return;

    //单个草从View Space变换到World Space的矩阵，即M矩阵
    float4x4 grassMatrix = grassMatrixBuffer[id.x];
    //得到单个草的mvp矩阵
    float4x4 mvpMatrix = mul(vpMatrix, grassMatrix);

    //包围盒的8个顶点的View Space坐标
    float4 boundVerts[8];
    boundVerts[0] = float4(boundMin, 1);
    boundVerts[1] = float4(boundMax, 1);
    boundVerts[2] = float4(boundMax.x, boundMax.y, boundMin.z, 1);
    boundVerts[3] = float4(boundMax.x, boundMin.y, boundMax.z, 1);
    boundVerts[4] = float4(boundMax.x, boundMin.y, boundMin.z, 1);
    boundVerts[5] = float4(boundMin.x, boundMax.y, boundMax.z, 1);
    boundVerts[6] = float4(boundMin.x, boundMax.y, boundMin.z, 1);
    boundVerts[7] = float4(boundMin.x, boundMin.y, boundMax.z, 1);

    float minX = 1, minY = 1, minZ = 1, maxX = -1, maxY = -1, maxZ = -1;//NDC下新的的AABB各个参数

    //-------------------------------------------------------视椎剔除-------------------------------------------------------
    //通过mvp矩阵得到顶点的Clip Space的齐次坐标，然后在Clip Space做视椎剔除判断，所有点都不在NDC内就被剔除。
    bool isInClipSpace = false;
    for (int i = 0; i < 8; i++)
    {
        float4 clipSpace = mul(mvpMatrix, boundVerts[i]);
        if (!isInClipSpace && IsInClipSpace(clipSpace))
            isInClipSpace = true;

        //计算该草ndc下的AABB
        float3 ndc = clipSpace.xyz / clipSpace.w;
        if (minX > ndc.x) minX = ndc.x;
        if (minY > ndc.y) minY = ndc.y;
        if (minZ > ndc.z) minZ = ndc.z;
        if (maxX < ndc.x) maxX = ndc.x;
        if (maxY < ndc.y) maxY = ndc.y;
        if (maxZ < ndc.z) maxZ = ndc.z;
    }
    if (!isInClipSpace)
        return;

    //-------------------------------------------------------Hiz遮挡剔除-------------------------------------------------------
    //ndc的AABB的左下角和右上角的uv坐标，ndc的-1到1转换为uv的0到1
    float2 uvLeftBottom = float2(minX, minY) * 0.5f + 0.5f;
    float2 uvRightTop = float2(maxX, maxY) * 0.5f + 0.5f;
    //DirextX下NDC的z值即为深度（因为MVP变换后是反转过的，所以要取最大的那个值）
    float depth = maxZ;

    //如果是OpenGL,首先要取最小的那个z值，然后需要 *0.5+0.5 转换到 0-1 的深度值
    if (isOpenGL) {
        depth = minZ;
        depth = depth * 0.5f + 0.5f;
    }

    //计算应该读取哪层mipmap
    uint mipmapLevel = (uint)clamp(log2(max(maxX - minX, maxY - minY) * 0.5f * depthTextureSize), 0, log2(depthTextureSize) - 4);
    //当前mipmap的大小
    uint size = depthTextureSize / (1 << mipmapLevel);

    //左下角和右下角点所在的像素,不使用clamp会导致相机左右边出现一条剔除不掉的草，因为有些草部分超框了
    uint2 pixelLeftBottom = uint2(clamp(uvLeftBottom.x * size, 0, size - 1), clamp(uvLeftBottom.y * size, 0, size - 1));
    uint2 pixelRightTop = uint2(clamp(uvRightTop.x * size, 0, size - 1), clamp(uvRightTop.y * size, 0, size - 1));
    
    //采样对应深度图的对应像素的深度值，并且作比较
    float depthInTexture = hizTexture.mips[mipmapLevel][pixelLeftBottom].r;
    if (isOpenGL) {
        if (pixelLeftBottom.x < pixelRightTop.x && pixelLeftBottom.y < pixelRightTop.y) {
            depthInTexture = max(max(depthInTexture, hizTexture.mips[mipmapLevel][pixelRightTop].r),
                max(hizTexture.mips[mipmapLevel][int2(pixelLeftBottom.x, pixelRightTop.y)].r, hizTexture.mips[mipmapLevel][int2(pixelRightTop.x, pixelLeftBottom.y)].r));
        }
        else if (pixelLeftBottom.x < pixelRightTop.x)
            depthInTexture = max(depthInTexture, hizTexture.mips[mipmapLevel][int2(pixelRightTop.x, pixelLeftBottom.y)].r);
        else if (pixelLeftBottom.y < pixelRightTop.y)
            depthInTexture = max(depthInTexture, hizTexture.mips[mipmapLevel][int2(pixelLeftBottom.x, pixelRightTop.y)].r);

        if (depthInTexture < depth)
            return;
    }
    else {
        if (pixelLeftBottom.x < pixelRightTop.x && pixelLeftBottom.y < pixelRightTop.y) {
            depthInTexture = min(min(depthInTexture, hizTexture.mips[mipmapLevel][pixelRightTop].r),
                min(hizTexture.mips[mipmapLevel][int2(pixelLeftBottom.x, pixelRightTop.y)].r, hizTexture.mips[mipmapLevel][int2(pixelRightTop.x, pixelLeftBottom.y)].r));
        }
        else if (pixelLeftBottom.x < pixelRightTop.x)
            depthInTexture = min(depthInTexture, hizTexture.mips[mipmapLevel][int2(pixelRightTop.x, pixelLeftBottom.y)].r);
        else if (pixelLeftBottom.y < pixelRightTop.y)
            depthInTexture = min(depthInTexture, hizTexture.mips[mipmapLevel][int2(pixelLeftBottom.x, pixelRightTop.y)].r);

        if (depthInTexture > depth)
            return;
    }

    //视椎剔除和遮挡剔除后的存活的仔
    cullResultBuffer.Append(grassMatrix);
}
```

C# 代码就不贴了，相比之前的视椎剔除就多传递点值，有兴趣的自己看 Demo 吧。

相比之前两张图，剔除后效果如下：

![[806e653b6127aabbec7a2c830381ba20_MD5.jpg]]

![[ee947035721acf8ad4b420355426da72_MD5.jpg]]

## 使用 CommandBuffer 实现利用当前帧深度图做剔除

根据评论区大佬

[@Blurry Light](https://www.zhihu.com/people/01e237cbb7ab2898778341dfd79841d8)

的建议以及帮助，重新通过

[CommandBuffer](https://docs.unity3d.com/Manual/GraphicsCommandBuffers.html)

的方式来实现了上述效果。而且由于使用 CommandBuffer 使得我们可以

**在当前帧生成好 Hi-z 之后再去执行 GPU Culling**

，因此就不会存着之前由于两帧直接深度图差别过大而出现的剔除异常效果，掉帧测试的效果图如下：

![[dea4282762bb290461886bd55b930a3f_MD5.gif]]

是不是很酷！具体的思路和前面差不多，然后通过 CommandBuffer 来处理下各个步骤的执行顺序即可。

在 Unity 提供的生命周期函数里，与渲染相关的大概只有 OnPreRender，OnRenderObject，OnPostRender 等寥寥几个。但是当我们打开 Frame Debug 的时候，却可以发现其实这其中包含了很多很多操作，例如深度图的生成，ShadowMap 的生成，绘制 Object，绘制 Skybox 等等。示意图如下：

![[997fd724961144663f474f71944bed65_MD5.jpg]]

也就是说那点点生命周期函数很难满足我们的需求，就比如我们之前的渲染草的流程，看看它在 Frame Debug 里的样子：

![[6c887fdeb6fcd58bd7ecc94af9dc4bcd_MD5.jpg]]

可以看出 Update 里调用的 ComputeShader 在渲染前就执行了，之后才生成当前帧的深度图，而 OnPostRender 里调用的 Hi-z 操作则在绘制结束后才进行。这也就是为什么之前的实现方法无法获取到当前帧的 Hi-z 的原因。

而 CommandBuffer 恰恰可以帮我们解决这些问题，它几乎可以在 Frame Debug 中你看见的所有事件节点里为我们穿插自定义的渲染操作。我们来看看优化后的流程的样子：

![[02c3741e37930eaff1602079b53e33dd_MD5.jpg]]

在 UpdateDepthTexture 中会根据 Scene 中的物体生成深度图，我们就可以利用这个深度图来做 mipmap。

这个流程看着是不是舒服可靠多了，接下来看看代码的修改。

在一帧内，先进行 Compute Shader 的计算，再进行渲染操作会达到最佳的性能。但是在新的流程中我们可以发现，渲染管线的绘制操作和 Compute Shader 的计算操作有穿插（先绘制深度图，再计算 mipmap，然后进行后续的绘制），它们之间的来回切换会影响到性能。但是为了更好的效果，也是可以接受的。

注：完整代码见 Git 的 CommandBuffer 分支。

### Hi-z 生成

利用 CommandBuffer 我们可以在深度图生成之后，即 CameraEvent.AfterDepthTexture 的时候就来生成 Hi-z，DepthTextureGenerator 类的代码修改如下：

```
CommandBuffer m_calulateDepthCommandBuffer;

void Start() {
    ......

    m_calulateDepthCommandBuffer = new CommandBuffer() { name = "Calculate DepthTexture" };
    Camera.main.AddCommandBuffer(CameraEvent.AfterDepthTexture, m_calulateDepthCommandBuffer);
}

void OnPreRender() {
    m_calulateDepthCommandBuffer.Clear();
    ......

    while(w > 8) {
        currentRenderTexture = RenderTexture.GetTemporary(w, w, 0, m_depthTextureFormat);
        currentRenderTexture.filterMode = FilterMode.Point;
        if(preRenderTexture == null)
            m_calulateDepthCommandBuffer.Blit(null, currentRenderTexture, m_depthTextureMaterial, 1);
        else {
            m_calulateDepthCommandBuffer.Blit(preRenderTexture, currentRenderTexture, m_depthTextureMaterial, 0);
            RenderTexture.ReleaseTemporary(preRenderTexture);
        }
        m_calulateDepthCommandBuffer.CopyTexture(currentRenderTexture, 0, 0, m_depthTexture, 0, mipmapLevel);
        ......
    }
    RenderTexture.ReleaseTemporary(preRenderTexture);
}
```

经测试这里不能直接用 CommandBuffer 去 Blit 深度图：

```
m_calulateDepthCommandBuffer.Blit("_CameraDepthTexture", currentRenderTexture);
```

上述操作 Frame Debug 下的显示如下，无法正确 Blit：

![[1d9f5dd07cd8800ab3d0a70547686abd_MD5.jpg]]

解决方式是可以在原本计算 Hi-z 的 shader 里新写一个 Pass，用来采样深度图：

```
Pass {
    ......

    sampler2D _CameraDepthTexture;

    ,......
    float4 frag(v2f input) : Color
    {
        float depth = tex2D(_CameraDepthTexture, input.uv);
        return float4(depth, 0, 0, 1.0f);
    }
    ENDCG
}
```

### 执行 ComputeShader 以及绘制

Hi-z 生成好后，我们就可以利用它来做 GPU Culling，也就是 Dispatch 我们的 ComputeShader。而当它执行完后，就剩最后的绘制操作了。

GrassGenerator 类的代码修改如下：

```
public Texture whiteTexture;
CommandBuffer m_computeShaderCommandBuffer, m_collectShadowCommandBuffer, m_drawGrassCommandBuffer;
MaterialPropertyBlock m_materialBlock;

void Start()
{
    ......
    AddCommandBuffer();
}

void InitComputeShader() {
    ......
    shadowMapTextureId = Shader.PropertyToID("_ShadowMapTexture");
    shadowCasterPassIndex = grassMaterial.FindPass("ShadowCaster");
}

void AddCommandBuffer()
{
    m_computeShaderCommandBuffer = new CommandBuffer() { name = "Dispatch Compute" };
    mainCamera.AddCommandBuffer(CameraEvent.AfterDepthTexture, m_computeShaderCommandBuffer);

    m_collectShadowCommandBuffer = new CommandBuffer() { name = "Collect Shadow" };
    mainLight.AddCommandBuffer(LightEvent.AfterShadowMapPass, m_collectShadowCommandBuffer);

    m_drawGrassCommandBuffer = new CommandBuffer() { name = "Draw Grass" };
    mainCamera.AddCommandBuffer(CameraEvent.AfterForwardOpaque, m_drawGrassCommandBuffer);

    m_materialBlock = new MaterialPropertyBlock();
}

void OnPreRender()
{
    //AfterDepthTexture：执行compute shader
    m_computeShaderCommandBuffer.Clear();
    m_computeShaderCommandBuffer.SetComputeMatrixParam(compute, vpMatrixId, GL.GetGPUProjectionMatrix(mainCamera.projectionMatrix, false) * mainCamera.worldToCameraMatrix);
    m_computeShaderCommandBuffer.SetComputeBufferCounterValue(cullResultBuffer, 0);
    m_computeShaderCommandBuffer.SetComputeBufferParam(compute, kernel, cullResultBufferId, cullResultBuffer);
    m_computeShaderCommandBuffer.SetComputeTextureParam(compute, kernel, hizTextureId, depthTextureGenerator.depthTexture);
    m_computeShaderCommandBuffer.DispatchCompute(compute, kernel, 1 + m_grassCount / 640, 1, 1);
    m_computeShaderCommandBuffer.CopyCounterValue(cullResultBuffer, argsBuffer, sizeof(uint));

    //AfterShadowMapPass：执行处理阴影
    m_materialBlock.Clear();
    m_materialBlock.SetBuffer(positionBufferId, cullResultBuffer);
    m_collectShadowCommandBuffer.Clear();
    m_collectShadowCommandBuffer.DrawMeshInstancedIndirect(grassMesh, subMeshIndex, grassMaterial, shadowCasterPassIndex, argsBuffer, 0, m_materialBlock);

    //AfterForwardOpaque：画草
    m_drawGrassCommandBuffer.Clear();
    //解决草偏暗的问题
    m_drawGrassCommandBuffer.EnableShaderKeyword("LIGHTPROBE_SH");
    m_drawGrassCommandBuffer.EnableShaderKeyword("SHADOWS_SCREEN");
    m_materialBlock.SetTexture(shadowMapTextureId, whiteTexture);
    m_drawGrassCommandBuffer.DrawMeshInstancedIndirect(grassMesh, subMeshIndex, grassMaterial, 0, argsBuffer, 0, m_materialBlock);
}
```

需要注意的是，使用 SurfaceShader 时，在 DrawMeshInstancedIndirect 方法里一定要指定 Pass，否则会把 Shader 里的所有 Pass 都执行一遍，造成异常效果，如下图：

![[ae4b67033d38558efd73afb8aa53d01f_MD5.png]]

![[aea62c1c35d834d1c652dc7986612275_MD5.jpg]]

### 遇到的问题

1. 使用 CommandBuffer.SetGlobalXXX 动态设置 Shader 中变量不可行，官网文档描述为：Sets a global XXX property for all shaders。

2. 使用 SurfaceShader 的时候，发现在 AfterForwardOpaque 绘制的草会比正常调用 Graphics.DrawMesh 绘制出来的草要暗上许多，如下图：

![[ed4606609c0bc99282983f9ac1527b35_MD5.jpg]]

通过 FrameDebug 的对比发现，应该是 _ShadowMapTexture 所造成的，如下图：

![[1604599dffdb97bcec5a932b3bda912d_MD5.jpg]]

暂时没想到什么好的方法，暂时赋予了_ShadowMapTexture 一张纯白的图片解决偏暗的问题。