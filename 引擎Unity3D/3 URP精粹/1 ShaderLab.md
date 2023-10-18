# ShaderLab 语法基础
## 1 组织结构
Shader 中可以编写多个子着色器（SubShader），但至少需要一个。

在应用程序运行过程中，GPU 会先检测第一个子着色器能否正常运行，如果不能正常运行就会再检测第二个，以此类推。
假如当前 GPU 的硬件版本太旧，以至于所有的子着色器都无法正常运行时，则执行最后的回退（Fallback）命令，运行指定的一个基础着色器。

如果编写的是顶点-片元着色器（Vertex-Fragment Shader），每个子着色器中还会包含一个甚至多个 Pass。在运行的过程中，如果某个子着色器能够在当前 GPU 上运行，那么该子着色器内的所有 Pass 会依次执行，每个 Pass 的输出的结果会以指定的方式与上一步的结果进行**混合**，最终输出。

如果编写的是表面着色器（Surface Shader），着色器的代码也是包含在子着色器中，但是与顶点-片元着色器不同的是，表面着色器不会再嵌套 Pass。系统在编译表面着色器的时候会自动生成多个对应的 Pass，最终编译出来的 Shader 本质上就是顶点-片元着色器。

## 2 名称

Shader 程序的第一行代码用来声明该 Shader 的名称以及所在路径。

```
Shader "Unlit/NewUnlitShader"
```

这一行代码的意思是：这个 Shader 位于 Unlit 路径里，名称为 NewUnlitShader。最终在材质设置面板中选择 Shader 的下拉菜单，如图
![[Pasted image 20230614182320.png|450]]

当然也可以多加几级路径，例如：
```
Shader "Unlit/Path_1/Path_2/NewUnlitShader"
```

## 3 Properties
Unity Shader 的属性主要分为三大类：数值、颜色和向量、纹理贴图

```c file:所有类型属性汇总
Properties
{
    _Integer ( "Integer",Integer) = 1           //真正的整数，但好像不能用？
    _Int ( "Int",Int) = 1                       //编译时转换为浮点类型
    _Float ( "Float",Float) = 1.5               //浮点类型
    _Range ( "Range" , Range(0, 1)) = 0.1       //范围类型，也是float
    _Color("Color", Color) = (1, 1, 1, 1)
    _Vector ("Vector", Vector) = (1, 1, 1, 1)

    _Texture2D ("Texture2D", 2D) = "" {}
    _Texture2DArray ("Texture2DArray", 2DArray) = "" {}
    _Texture3D ("Texture3D", 3D) = "" {}
    _Cubemap ("Cubemap", Cube) = "" {}
    _CubemapArray ("CubemapArray", CubeArray) = "" {}
}
```

在 URP 中声明对应变量
```c
CBUFFER_START(UnityPerMaterial)
int _Int;
float _Float;
float _Range;
float4 _Color;
float4 _Vector;
CBUFFER_END

TEXTURE2D(_Texture2D);
SAMPLER(sampler_Texture2D);
TEXTURE2D_ARRAY_FLOAT(_Texture2DArray);
SAMPLER(sampler_Texture2DArray);
TEXTURE3D(_Texture3D);
SAMPLER(sampler_Texture3D);
TEXTURECUBE(_Cubemap);
SAMPLER(sampler_Cubemap);
TEXTURECUBE_ARRAY(_CubemapArray);
SAMPLER(sampler_CubemapArray);
```
#### 颜色和向量属性

```c
_Color("Color", Color) = (1, 1, 1, 1)
_Vector ("Vector", Vector) = (1, 1, 1, 1)
```

使用给定 RGBA 分量的默认值定义颜色属性，或使用默认值定义 4D 矢量属性。颜色属性会显示拾色器，并根据颜色空间按需进行调整。矢量属性显示为四个数字字段。

有一点需要注意的是：用 Photoshop 处理图片一般会使用8位深度图，每个通道的亮度最大值为 $2^8=256$，由于从 $0$ 开始计算，因此数值范围是 $[0，255]$。
而**在 Shader 中，每个分量的数值范围是 $[0,1]$**
![[Pasted image 20230614183329.png|500]]
#### 纹理贴图属性

```c
_Texture2D ("Texture2D", 2D) = "" {}
_Texture2DArray ("Texture2DArray", 2DArray) = "" {}
_Texture3D ("Texture3D", 3D) = "" {}
_Cubemap ("Cubemap", Cube) = "" {}
_CubemapArray ("CubemapArray", CubeArray) = "" {}
```

（1）2D 属性是纹理类属性中最常使用的，漫反射贴图、法线贴图等都属于 2D 类型。2D 
（2）Cube 全称 Cube map texture（立方体纹理），是由前、后、左、右、上、下 6 张有联系的 2D 贴图拼成的立方体，主要用作反射，例如 Skybox 和 Reflection Prob。
（3）3D 纹理只能被脚本创建

2D 类型的属性，默认值可以为空字符串，也可以是内置的表示颜色的字符串：`“white”（RGBA: 1，1，1，1）`，`“black”（RGBA：0，0，0，0）`，`“gray”（RGBA：0.5，0.5，0.5，0.5）`，`“bump”（RGBA：0.5，0.5，1，0.5）` 和 `“red”（RGBA：1，0，0，0）`。
至于非2D 类型的属性（Cube，3D，2DArray），默认值为空字符串。当材质没有指定 Cubemap 或者3D 或者2DArray 纹理的时候，会默认使用 `gray（RGBA：0.5，0.5，0.5，0.5）`。

**注意：这些默认纹理在 Inspector 中不可见。

> [!info] 纹理贴图类的属性最后都有一对空的花括号
这是因为在 Unity 5.0 之前的版本，纹理属性可以在花括号内添加选项，用于控制固定函数纹理坐标的生成。但是**该功能在 Unity 5.0 及以后的版本中已经被移除，所以无须考虑这个问题，直接加上一对空的花括号即可。**
#### 特殊纹理属性
```cs
//纹理属性的 Tiling 和 Offset 字段
float4 {TextureName}_ST
//#define TRANSFORM_TEX(tex,name) (tex.xy * name##_ST.xy + name##_ST.zw)

//纹理的纹素大小信息
//x 1.0/宽度
//y 1.0/高度
//z宽度
//w高度
float4 {TextureName}_TexelSize
//half2 offs = _MainTex_TexelSize.xy * half2(1,0) *  _BlurSize;

//纹理 HDR 参数
float4 {TextureName}_HDR //和DecodeHDR有关？
```

#### 颜色空间和颜色/矢量着色器数据

使用[线性颜色空间](https://docs.unity3d.com/cn/2022.3/Manual/LinearLighting.html)时，所有材质颜色属性均以 sRGB 颜色提供，但在传递到着色器时会转换为线性值。

例如，如果 [Properties](https://docs.unity3d.com/cn/2022.3/Manual/SL-Properties.html) 着色器代码块包含名为“_MyColor“的 `Color` 属性，则相应的”_MyColor”HLSL 变量将获得线性颜色值。

对于标记为 `Float` 或 `Vector` 类型的属性，默认情况下不进行颜色空间转换；而是假设它们包含非颜色数据。**可为浮点/矢量属性添加 `[Gamma]` 特性，以表示它们是以 sRGB 空间指定，就像颜色一样（请参阅[属性](https://docs.unity3d.com/cn/2022.3/Manual/SL-Properties.html)）。**

#### 如何向着色器提供属性值

在下列位置中查找着色器属性值并提供给着色器：

- [MaterialPropertyBlock](https://docs.unity3d.com/cn/2022.3/ScriptReference/MaterialPropertyBlock.html) 中设置的每渲染器值。这通常是“每实例”数据（例如，全部共享相同材质的许多对象的自定义着色颜色）。
- 在渲染的对象上使用的[材质](https://docs.unity3d.com/cn/2022.3/Manual/class-Material.html)中设置的值。
- 全局着色器属性，通过 Unity 渲染代码自身设置（请参阅[内置着色器变量](https://docs.unity3d.com/cn/2022.3/Manual/SL-UnityShaderVariables.html)），或通过您自己的脚本来设置（例如 [Shader.SetGlobalTexture](https://docs.unity3d.com/cn/2022.3/ScriptReference/Shader.SetGlobalTexture.html)）。

优先顺序如上所述：
1. 每实例数据覆盖所有内容
2. 然后使用材质数据
3. 最后，如果这两个地方不存在着色器属性，则使用全局属性值。
4. 最终，如果在任何地方都没有定义着色器属性值，则将提供“默认值”（浮点数的默认值为零，颜色的默认值为黑色，纹理的默认值为空的白色纹理）。

## 4 SubShader
```cs file:SubShader的大致结构
SubShader
{
    //标签
    Tags { "TagName1" = "valuel" "TagName2" = "value2" ...}
    //渲染状态
    Cull Back

    Pass
    {
        //第一个 Pass
    }
    
    Pass
    {
        //第二个 Pass
    }
    ...
}
```

在 Unity 中，每一个 Shader 都会包含至少一个 SubShader。当 Unity 想要显示一个物体的时候，它就会去检测这些 SubShader，然后选择第一个能够在当前显卡运行的 SubShader。
**每个 SubShader 都可以设置一个或者多个标签（Tags）和渲染状态（States），然后定义至少一个 Pass**。在 SubShader 中设置的渲染状态会影响到该 SubShader 中所有的 Pass，如果想要某些状态不影响其他 Pass，**可以针对某个 Pass 单独设置渲染状态。但是需要注意的是，部分渲染状态在 Pass 中并不支持。**
### Tags
[ShaderLab：向子着色器分配标签 - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2022.3/Manual/SL-SubShaderTags.html)

> [!bug] 
> 本节介绍的Tags仅可以在 SubShader 中声明，不可以在 Pass 块中声明。Pass 块有其独有的 Tags

SubShader 通过标签来**确定什么时候以及如何对物体进行渲染。**

标签通过**键值对**的形式进行声明，并且没有使用数量的限制。如果有需要，可以使用任意多个标签。

```c
Shader "ExampleShader" 
{
    SubShader 
    {
        Tags 
        {
            "RenderPipeline" = "UniversalRenderPipeline"
            "Queue" = "Transparent"
            "RenderType" = "Transparent"
            "DisableBatching" = "True" 
            "ForceNoShadowCasting" = "True"
            "IgnoreProjector" = "True"
            "PreviewType" = "Plane"
        }
        
        
        Pass 
        {
            …
        }
    }
}
```

#### RenderPipeline
向 Unity 告知子着色器是否与通用渲染管线 (URP) 或高清渲染管线 (HDRP) 兼容，Built-in 管线中没有这个标签。

|参数|说明|
|:--|:--|
|UniversalRenderPipeline|此子着色器仅与 URP 兼容|
|HighDefinitionRenderPipeline|此子着色器仅与 HDRP 兼容|
|任何其他值或未声明|此子着色器与 URP 和 HDRP 不兼容。|

#### Queue

**渲染队列**是确定 Unity 渲染顺序的因素之一。

|队列名称|**功能**|队列号 |
| :---------- | :------------------------ | :------------------------ |
| Background  |指定背景渲染队列。最先执行渲染﹐一般用来渲染天空盒 (Skybox)或者背景 |1000|
|Geometry|指定几何体渲染队列。非透明的几何体通常使用这个队列, 当没有声明渲染队列的时候，Unity 会默认使用这个队列|2000|
|AlphaTest |Alpha 测试的几何体会使用这个队列, 之所以从 Geometry 队列单独拆分出来，是因为当所有实体都绘制完之后再绘制 Alpha 测试会更高效 |2450|
|Transparent|在这个队列的几何体按由远及近的顺序进行绘制, 所有进行 Alpha 混合的几何体都应该使用这个队列, 例如玻璃材质、粒子特效等 |3000|
| Overlay     |用来叠加渲染的效果，例如镜头光晕等, 放在最后渲染 |4000|

除了使用 Unity 预定义的渲染队列，使用者也可以自己指定一个队列，例如：
`Tags { "Queue" = "Geometry+1" }`
这个队列的队列号其实就是 2001，表示在所有的非透明几何体绘制完成之后再进行绘制。
使用自定义的渲染队列在某些情况下非常有用，例如：透明的水应该在所有不透明几何体之后，透明几何体之前被绘制，所以透明水的渲染队列一般会使用`"Queue"="Transparent-1"`。

#### RenderType

**URP 可以自定义 Shader RenderType 标签的值**
在基于 SRP 的渲染管线中，可以使用 `RenderStateBlock` 结构覆盖在 Shader 对象中定义的渲染状态。可以使用 `RenderType` 标签的值标识要覆盖的子着色器。 ^d4529f

在内置渲染管线中，可以使用一种称为[着色器替换](https://docs.unity3d.com/cn/2022.3/Manual/SL-ShaderReplacement.html)的技术在运行时交换子着色器。此技术的工作方式是标识具有匹配 `RenderType` 标签值的子着色器。这在某些情况下用于生成[摄像机的深度纹理](https://docs.unity3d.com/cn/2022.3/Manual/SL-CameraDepthTexture.html)。

|类型名称|描述|
|:--|:--|
|Opaque |用于普通 Shader, 例如: 不透明、自发光、反射、地形 Shader|
|Transparent|用于半透明 Shader, 例如: 透明﹑粒子|
|TransparentCutout |用于透明测试 Shader, 例如: 植物叶子|
|Background|用于 Skybox Shader|
|Overlay|用于 GUI 纹理、Halo、 Flare Shader |
|TreeOpaque|用于地形系统中的干|
|TreeTransparentCutout|用于地形系统中的树叶|
|TreeBillboard|用于地形系统中的 Billboarded 树|
|Grass|用于地形系统中的草|
|GrassBillboard|用于地形系统中的 Billboarded 草|
 >适用于Built-in 管线下的标签
#### 禁用动态批处理
动态批处理会将所有几何体都变换为世界空间，这意味着着色器程序无法再访问模型空间。因此，依赖于模型空间的着色器程序不会正确渲染。为避免此问题，请使用此子着色器标签阻止 Unity 应用动态批处理。

开启 `DisableBatching` 可以禁用动态批处理
禁用批处理标签有三个数值可以使用：
（1）"DisableBatching"="True"：总是禁用批处理。
（2）"DisableBatching"="False"：不禁用批处理，这是默认数值。
（3）"DisableBatching"="LODFading"：当 LOD 效果激活的时候才会禁用批处理，主要用于地形系统上的树。

#### 禁止阴影投射
阻止子着色器中的几何体投射（有时是接收）阴影。确切行为取决于渲染管线和渲染路径。
如果使用[着色器替换](https://docs.unity3d.com/cn/current/Manual/SL-ShaderReplacement.html)，但是不希望从其他子着色器继承阴影通道，这可能非常有用。
`"ForceNoShadowCasting" = "True"/"False"

#### 忽略 Projector
**此标签只适用于 Built-in 渲染管线，在其他渲染管线中无效。**
如果不希望物体受到 Projector（投影机）的投射，可以在 Shader 中添加 `IgnoreProjector` 标签。它有两个数值可以使用："True"和"False"，分别为忽略投射机和不忽略投射机。一般半透明的 Shader 都会开启这个标签。

#### PreviewType

Unity 编辑器用于显示使用此子着色器的**材质预览的形状**。

|值|功能|
|------------|-----------------|
|球体|在球体上显示材质。这是默认值。|
| 平面 (Plane) |在平面上显示材质。|
| Skybox     | 在天空盒上显示材质。      |

### Pass
#### 自定义名称
```cs
pass
{
    Name  "mypass"
}
```

通过这个名称，我们可以使用 ShaderLab 的 `UsePass` 命令来直接**使用其他 Unity Shader 中的 Pass**，提高代码复用性。例如:
`UsePass "MyShader/MYPASSNAME"`

> [!warning] Title
> 1. 在内部，Unity 将名称转换为大写。在 ShaderLab 代码中引用名称时，必须使用大写变体；例如，如果值是 “example”，您必须使用 EXAMPLE 进行引用。
> 2. 如果同一个子着色器中有多个 Pass 具有相同的名称，则 Unity 使用代码中的第一个 Pass

**注意**：在基于可编程渲染管线的渲染管线中，您可以使用 `RenderStateBlock` 来更改 GPU 上的渲染状态，而无需单独的通道。

#### Pass 专用 Tags

Pass 也可以设置标签，但和 SubShader 不同。

**还可以使用自定义值创建自己的自定义通道标签，并从 C# 代码访问它们。**

##### LightMode
`LightMode`（灯光模式）标签定义了 Pass 在光照渲染流水线中的渲染规则，确定是否在给定帧期间执行该通道，在该帧期间 Unity 何时执行该通道，以及 Unity 对输出执行哪些操作。

> [!NOTE] Title
> LightMode 标签与 Light 组件的 LightMode 无关

[URP ShaderLab Pass tags | Universal RP | 14.0.8 --- URP ShaderLab Pass标记|通用RP | 14.0.8 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/urp-shaders/urp-shaderlab-pass-tags.html)

**URP 前向渲染管线 LigtMode：**

|标签值|作用|
|:--|:--|
|UniversalForward |渲染对象并评估所有灯光贡献。URP在前向渲染路径中使用此标记值。  |
|Universal2D|渲染对象并评估2D灯光贡献。URP在 2D Renderer 中使用此标记值。|
|ShadowCaster|将光源透视图中的深度信息渲染到到ShadowMap或Depth Texture|
|DepthOnly |仅将摄像机透视图中的深度信息渲染到 Depth Texture 中 |
|Meta|仅在“Unity 编辑器”中烘焙光照贴图时执行此过程。Unity 在构建播放器时从着色器中删除此 Pass |
|SRPDefaultUnlit|使用此 LightMode 标记值可以在渲染对象时绘制额外的 Pass。应用示例：绘制对象轮廓。此标记值对“正向渲染路径”和“延迟渲染路径”都有效。**当通行证没有 LightMode 标记时，URP 使用此标记值作为默认值。**

**URP延迟渲染管线LightMode**：UniversalGBuffer、UniversalForwardOnly、DepthNormalsOnly


**Built-in 的 LightMode**：在内置渲染管线中，如果不设置 `LightMode` 标签，Unity 会在没有任何光照或阴影的情况下渲染通道；这本质上相当于 `LightMode` 的值为 `Always`。
>Unity 创建的 Unlit 材质就是没有指定 LightMode 的，在 SRP 中，旧的着色器大部分基本不能再使用，但没有光照的内置着色器 Unlit 被保留了下来，可以使用 `SRPDefaultUnlit` 值来引用没有 LightMode 标签的通道。

![[Pasted image 20230615142758.png]]

##### UniversalMaterialType
Unity在URP延迟渲染路径中使用Tag。
### Fallback
Fallback 在所有 SubShader 之后进行定义。当所有的 SubShader 都不能在当前显卡上运行的时候，就会运行 Fallback 定义的 Shader。它的语法如下：
`Fallback "name"`
最常用于 Fallback 的 Shader 为 Unity 内置的 Diffuse。
如果觉得某些 Shader 肯定可以在目标显卡上运行，没有指定 Fallback 的必要，可以使用 Fallback Off 关闭 Fallback 功能，或者直接什么都不写。

### LOD
LOD：Level of Detail  
**shader 的 LOD 和模型的 LOD 作用不同！shader 的 LOD 只是用来选择 SubShader 的**
作用：unity 引擎会根据不同的 LOD 值在使用不同的 SubShader  

Unity 选择对应的 Subshader 会**从上往下寻找第一个小于等于  `shader.maximumLOD`  值的 SubShader**。

> [!bug] 
> 在 Shader 代码块中，**必须将子着色器按 LOD 降序排列**。例如，如果您有 LOD 值为 200、100 和 500 的子着色器，则必须先放置 LOD 值为 500 的子着色器，然后是 LOD 值为 200 的子着色器，然后是 LOD 值为 100 的子着色器。这是因为 Unity 选择所找到的第一个有效子着色器，所以如果它首先找到一个 LOD 较低的子着色器，它将始终使用它。

```c
SubShader
{
    Tags { "RenderType" = "Opaque" }
    LOD 600 // LOD这里设置为600

    CGPROGRAM
    ...
    ENDCG
}
        
SubShader
{
    Tags { "RenderType" = "Opaque" }
    LOD 500 // LOD这里设置为500

    CGPROGRAM
    ...
    ENDCG
}
SubShader
{
    Tags { "RenderType" = "Opaque" }
    LOD 400 // LOD这里设置为400
    
    CGPROGRAM
    ...
    ENDCG
}

```

通过脚本调整 `shader.maximumLOD`

`Shader.maximumLOD`：控制单个 shader 的最大 LOD
`Shader.globalMaximumLOD`：控制全部 shader 的最大 LOD

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class LODCtrl : MonoBehaviour
{
    public Shader shader;//将Shader拖进来即可
    
    void Start() {
        Debug.Log(this.shader.maximumLOD);
    }
    // Update is called once per frame
    void Update() {
        if (Input.GetKeyDown(KeyCode.A))
        {
            // 当前这个shader最大的LOD_value;
            this.shader.maximumLOD = 600;
        }
        if (Input.GetKeyDown(KeyCode.B))
        {
            this.shader.maximumLOD = 500;
        }
        if (Input.GetKeyDown(KeyCode.C))
        {
            this.shader.maximumLOD = 300;
        }
 
    }
}
```

（4）运行，查看效果，通过按 ABC 按键，修改 maximumLOD 的值。查看 Cube 颜色的变化。

## 5 命令
### 设置渲染状态
在 Pass 代码块中使用这些命令可为该 Pass 设置渲染状态，或者在 SubShader 代码块中使用这些命令可为该 SubShader 以及其中的所有 Pass 设置渲染状态。

- [AlphaToMask](https://docs.unity3d.com/cn/2022.3/Manual/SL-AlphaToMask.html)：设置 alpha-to-coverage 模式。
- [Blend](https://docs.unity3d.com/cn/2022.3/Manual/SL-Blend.html)：启用和配置 alpha 混合。
- [BlendOp](https://docs.unity3d.com/cn/2022.3/Manual/SL-BlendOp.html)：设置 Blend 命令使用的操作。
- [ColorMask](https://docs.unity3d.com/cn/2022.3/Manual/SL-ColorMask.html)：设置颜色通道写入掩码。
- [Conservative](https://docs.unity3d.com/cn/2022.3/Manual/SL-Conservative.html)：启用和禁用保守光栅化。
- [Cull](https://docs.unity3d.com/cn/2022.3/Manual/SL-Cull.html)：设置多边形剔除模式。
- [Offset](https://docs.unity3d.com/cn/2022.3/Manual/SL-Offset.html)：设置多边形深度偏移。
- [Stencil](https://docs.unity3d.com/cn/2022.3/Manual/SL-Stencil.html)：配置模板测试，以及向模板缓冲区写入的内容。
- [ZClip](https://docs.unity3d.com/cn/2022.3/Manual/SL-ZClip.html)：设置深度剪辑模式。
- [ZTest](https://docs.unity3d.com/cn/2022.3/Manual/SL-ZTest.html)：设置深度测试模式。
- [ZWrite](https://docs.unity3d.com/cn/2022.3/Manual/SL-ZWrite.html)：设置深度缓冲区写入模式。

**常用：**

|渲染状态|数值|作用|
|:--|:--|:--|
|Cull|Cull Back/Front/ Off|设置多边形的剔除方式, 有背面剔除、正面剔除、不剔除﹐默认为 Back|
|ZTest|ZTest (Less/Greater/LEqual/GEqual/Equal/NotEquall /Always)|设置深度测试的对比方式, 默认为 LEqual |
|ZWrite|ZWrite On/ Off|设置是否写入深度缓存, 默认为 On |
|Blend|Blend  sourceBlendMode  destBlendMode|设置渲染图像的混合方式|
|ColorMask|ColorMask RGB/A/0/或者 R、G、B、A 的任意组合|设置颜色通道的写入蒙版﹐默认蒙版为 RGBA, 当设置为 0 时, 则无法写入任何颜色|


### 通道命令

在 SubShader 中使用这些命令可定义具有特定用途的通道。

- [UsePass](https://docs.unity3d.com/cn/2022.3/Manual/SL-UsePass.html) 定义一个通道，它从另一个 Shader 对象导入指定的通道的内容。
- [GrabPass](https://docs.unity3d.com/cn/2022.3/Manual/SL-GrabPass.html) 创建一个通道，将屏幕内容抓取到纹理中，以便在之后的通道中使用。

### 使用 Category 代码块对命令进行分组
使用 **Category** 代码块可对设置渲染状态的命令进行分组，这样您可以“继承”该代码块内的分组渲染状态。

例如，您的 Shader 对象可能有多个子着色器，每个都需要混合设置为加法。可以如下所示使用 Category 代码块：
```cs
Shader "example" 
{
    Category 
    {
        Blend One One
        
        SubShader 
        {
            // ...
        }
        
        SubShader 
        {
            // ...
        }
        
        // ...
    }
}
```

# Unity 中的 HLSL
## HLSL 预处理器指令
### 着色器阶段
```cs
#pragma vertex <name>    //编译具有给定名称的函数作为顶点着色器
#pragma fragment <name>  //编译具有给定名称的函数作为片元着色器

//编译具有给定名称的函数作为几何体着色器，此选项自动打开 #pragma require geometry
#pragma geometry <name>  

//编译具有给定名称的函数作为DirectX 11外壳着色器，此选项自动打开 #pragma require tessellation
#pragma hull <name>

//编译具有给定名称的函数作为DirectX 11域着色器。此选项自动打开 #pragma require tessellation
#pragma domain <name>
```

### shader mode
[Targeting shader models and GPU features in HLSL - Unity 手册 --- 针对HLSL-Unity中的着色器模型和GPU功能手册 (unity3d.com)](https://docs.unity3d.com/cn/2022.3/Manual/SL-ShaderCompileTargets.html)
```cs
#pragma target <value>  //此着色器程序兼容的最小着色器模型
#pragma require <value> //此着色器兼容的最低GPU功能
```

### 其他
```cs
#pragma instancing_options <options> //启用GPU Instancing
#pragma once 
```

## 语义
参数后被冒号隔开并且全部大写的关键词就是语义。
输入和输出变量需要通过**语义**来表明其意图


### 顶点着色器输入语义
![[Pasted image 20230614195139.png]]
当顶点信息包含的元素少于顶点着色器输入所需要的元素时，**缺少的部分会被 0 填充，而 w 分量会被 1 填充**。例如：顶点的 UV 坐标通常是二维向量，只包含 x 和 y 元素。如果输入的语义 TEXCOORD0 被声明为 float4 类型，那么顶点着色器最终获取到的数据将变成（x，y，0，1）。

> [!NOTE] 数据来源：MeshRender
> 填充到这些语义中的数据由使用该材质的 MeshRender 组件提供，每帧调用 DrawCall 的时候，MeshRender 组件会把它负责渲染的模型数据发送给 UnityShader。

```cs
//顶点着色器输入结构
struct Attributes
{
    float4 positionOS : POSITION;
    float2 uv : TEXCOORD0;
};
```
### 顶点着色器输出语义和片元着色器输入语义
在整个渲染流水线中，顶点着色器最重要的一项任务就是需要输出顶点在裁切空间中的坐标，这样 GPU 就可以知道顶点在屏幕上的栅格化位置以及深度值。在顶点函数中，这个输出参数需要使用 float4 类型的 `SV_POSITION` 语义进行填充。

顶点着色器产生的输出值将会在三角形遍历阶段经过插值计算，最终作为像素值输入到片元着色器。换句话说，顶点着色器的输出即为片元着色器的输入。

![[Pasted image 20230614195313.png]]

**片元着色器会自动获取顶点着色器输出的裁切空间顶点坐标，所以片段函数输入的 SV_POSITION 可以省略。** 这也解释了为什么有些 Shader 的片段函数中只有输出参数，但是没有输入参数。

```cs
//顶点着色器输出结构
struct Varyings
{
    float4 positionCS : SV_POSITION;
    float2 uv : TEXCOORD0;
};
        
//顶点着色器函数
Varyings vert(Attributes input) : SV_POSITION
{
    ...
}
```

**需要特别注意的是，与顶点函数的输入语义不同，`TEXCOORDn` 不再特指模型的 UV 坐标，`COLORn` 也不再特指顶点颜色。它们的使用范围更广，可以用于声明任何符合要求的数据，所以在使用过程中不要被语义的名称欺骗了。**

许多现代 GPU 并不真正关心这些变量具有什么语义；然而，一些旧的系统（最值得注意的是，着色器模型2 GPU）确实有关于语义的特殊规则，即上述列表中对 TEXCOORD 和 COLOR 语义的描述，为了获得最佳的跨平台支持，应将顶点输出和片元输入标记为 `TEXCOORDn` 语义。

### 片元着色器输出语义
片元着色器通常只会输出一个 fixed4 类型的颜色信息，输出的值会存储到渲染目标（Render Target）中，输出参数使用 `SV_TARGET` 语义进行填充。

```cs
//片元着色器函数
float4 frag(Varyings input) : SV_TARGET
{

}
```

**其他语义：**
**`SV_TargetN`：多个渲染目标：**
`SV_Target1`、`SV_Target2` 等等：这些是着色器写入的附加颜色。这在一次渲染到多个渲染目标（称为“多渲染目标”渲染技术，简称 MRT）时使用。`SV_Target0` 等同于 `SV_Target`。

**`SV_Depth`：像素着色器深度输出**
通常，片元着色器不会覆盖 Z 缓冲区值，而是使用正三角形光栅化中的默认值。但是，对于某些效果，按像素输出自定义 Z 缓冲区深度值是有用的。深度输出值必须为单个 `float`。

### 其他特殊语义

#### VPOS 屏幕空间像素位置
片元着色器可以接收渲染为特殊 `VPOS` 语义的像素位置。**此功能仅从着色器模型 3.0 开始存在，因此着色器需要具有 `#pragma target 3.0` 编译指令。**

>Unity 文档：“在不同的平台上，屏幕空间位置输入的基本类型各不相同，因此为了最大限度地实现可移植性，请使用 `UNITY_VPOS_TYPE` 类型。”
>
>查阅源码如下：**现在直接使用 float4 类型即可！**
```c
//使用UNITY_VPOS_TYPE宏需要引用：
#include "HLSLSupport.cginc"

//看下源码：
//用于“屏幕空间位置”像素着色器输入语义的数据类型;现在是float4(以前是float2在D3D9上)
#define UNITY_VPOS_TYPE float4
```

此外，使用像素位置语义使得裁剪空间位置（SV_position）和 VPOS 很难在同一个顶点到片段结构中。因此，**顶点着色器应将裁剪空间位置输出为单独的`out`变量**。
```c h:11,19,27,39,45
Pass
{
    Tags
    {
        "LightMode" = "UniversalForward"
    }
    
    HLSLPROGRAM
    #pragma vertex vert
    #pragma fragment frag
    #pragma target 3.0   //注意设置shader model为3.0以上

    struct Attributes
    {
        float4 positionOS : POSITION;
        float2 uv : TEXCOORD0;
    };

    // 注意：此结构中没有 SV_POSITION
    struct Varyings
    {
        float2 uv : TEXCOORD0;
    };
    
    Varyings vert(
        Attributes input,
        out float4 positionCS : SV_POSITION)  // 裁剪空间位置输出
    {
        Varyings output = (Varyings)0;
        output.uv =input.uv.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    
        positionCS = TransformObjectToHClip(input.positionOS.xyz);
        
        return output;
    }

    float4 frag(
        Varyings input,
        float4 screenPos : VPOS //声明VPOS语义，输入屏幕空间坐标
        ) : SV_Target
    {
        // screenPos.xy 为屏幕空间像素坐标。
        // _ScreenParams.xy为屏幕分辨率
        //用屏幕坐标除以屏幕分辨率，得到视口空间中的坐标，即归一化的屏幕空间坐标[0,1]
        return float4 (screenPos.xy/_ScreenParams.xy,0.0,1.0);
    }
    ENDHLSL
}
```

**VPOS/WPOS（Built-in 中是WPOS）** 语义定义的输入是个 float4 类型的变量:
1. `xy` 分量代表**屏幕空间**中的像素坐标。
    - 如果屏幕分辨率为 400x300，那么 x 的范围就是 $[0.5,400.5]$ ,y 的范围是 $[0.5,300.5]$
    - **注意**：这里的像素坐标并不是整数值，这是因为 OpenGL 和 DirectX 10 以后的版本认为像素重心对应的是浮点值中的 0.5
2.  `z` 分量范围是  , 在相机的近裁剪平面处 z 为 0，远裁剪平面处 z 为 1
3.  `w` 分量范围是 $\displaystyle[\frac{1}{Near},\frac{1}{Far}]$ , $Near$ 和 $Far$ 对应 Camera 组件中设置的近裁切平面和远裁切平面距离相机的远近，若为正交投影，则 $w$ 恒为 1

代码最后：用屏幕坐标除以屏幕分辨率，得到**视口空间**中的坐标，**视口空间 (viewport space)** 就是把屏幕坐标归一化，屏幕左下角为 $(0,0)$ , 右上角为 $(1,1)$

#### VFACE 面对方向
**片元着色器可以接收一种指示渲染表面是面向摄像机还是背对摄像机的变量。**
这在渲染应从两侧可见的几何体时非常有用，通常用于树叶和类似的薄型物体。**`VFACE` 语义输入变量将包含表示正面三角形的正值，以及表示背面三角形的负值。**

此功能从着色器模型 3.0 开始才存在，因此着色器需要具有 `#pragma target 3.0` 编译指令。

![[2023711422.gif]]
```c h:1,6,28,34
Cull Off //关闭背面剔除  
  
HLSLPROGRAM  
#pragma vertex vert  
#pragma fragment frag  
#pragma target 3.0 //注意设置shader model为3.0以上

struct Attributes
{
    float4 positionOS : POSITION;
    float2 uv : TEXCOORD0;
};

struct Varyings
{
    float4 positionCS : SV_POSITION;
    float2 uv : TEXCOORD0;
};
            
Varyings vert(Attributes input)  
{  
    Varyings output = (Varyings)0;  
    output.positionCS = TransformObjectToHClip(input.positionOS.xyz);  
    
    return output;  
}

float4 frag(Varyings input, float facing : VFACE) : SV_Target
{
    // _ColorFront, _ColorBack分别设置为红色蓝色
    // 正面的 VFACE 输入为正，
    // 背面的为负。根据这种情况
    // 输出两种颜色中的一种。
    return facing > 0 ?_ColorFront : _ColorBack;
}
ENDHLSL
```

#### 顶点 ID：SV_VertexID 

**顶点着色器可以接收具有“顶点编号”（为无符号整数 `uint`）的变量**。当您想要从纹理或 [ComputeBuffers](https://docs.unity3d.com/cn/2022.3/Manual/class-ComputeShader.html) 中**获取额外的每顶点数据**时，这非常有用。

此功能从 DX10（着色器模型 4.0）和 GLCore/OpenGL ES 3 开始才存在，因此着色器需要具有 `#pragma target 3.5` 编译指令。
![[Pasted image 20230701143251.png]]

```c h:4,10,26
HLSLPROGRAM
#pragma vertex vert
#pragma fragment frag
#pragma target 3.5 //注意设置shader model为3.5以上

struct Attributes
{
    float4 positionOS : POSITION;
    float2 uv : TEXCOORD0;
    uint vid : SV_VertexID; //顶点 ID，必须为uint
};

struct Varyings
{
    float4 positionCS : SV_POSITION;
    float2 uv : TEXCOORD0;
    float4 color : COLOR;  //顶点颜色
};

Varyings vert(Attributes input)  
{
    Varyings output = (Varyings)0;
    output.positionCS = TransformObjectToHClip(input.positionOS.xyz);

    // 基于顶点 ID 输出顶点颜色
    float f = input.vid;
    output.color = float4(sin(f/10),sin(f/100),sin(f/1000),0) * 0.5 + 0.5;
    
    return output;
}

float4 frag(Varyings input) : SV_Target
{
    return input.color;
}
ENDHLSL
```

# 图形 API 平台差异 
**Unity 默认是以 OpenGL 的标准体系进行描述的：左手坐标系、屏幕坐标系左下角为（0,0）等。为了确保统一性，所有非OpenGL 的平台的特性，Unity 会做出转换，使得该特性能够以 OpenGL 的标准来描述。**

在某些情况下，不同图形 API 之间的图形渲染行为方式存在差异。大多数情况下，Unity 编辑器会隐藏这些差异，**但在某些情况下，编辑器无法为您执行此操作。下面列出了这些情况以及发生这些情况时需要采取的操作。**
## 渲染纹理坐标
平台差异：
- **Direct3D**：纹理坐标原点在左上角
- **OpenGL**：纹理坐标原点在左下角
![[v2-11bac0a9fd7fee29687f222ef4b317fd_1440w.webp]]
我们知道，Unity 是用 OpenGL 的标准进行描述的，右边的图像用左边的 OpenGL 坐标系来描述的话，得到的将会是下面这样一幅颠倒的图像。

![[v2-4ead41b0f3d7e5842f047d15f067e285_1440w.webp|450]]
>**为什么换了坐标系图像会颠倒？**
>首先我们得理解，**纹理本身就是以二维的数组的形式储存的**。从上面的参考图的网格可以理解，每个像素都有一个明确的数组下标（x,y），数组下标是不变的，但是坐标系会变。比如：在 D3D 中，像素点（512,0）是在右上角的，但是在 OpenGL 的坐标系中，就变成右下角了。这就是坐标系变换造成图像颠倒的原因。

**为了避免这种颠倒**，在 Direct3D 类平台上渲染到纹理时，Unity 会在内部上下翻转渲染。这样就会使坐标约定在平台之间匹配，并以 OpenGL 类平台约定作为标准。

在着色器中，有两种常见情况需要您采取操作确保不同的坐标约定不会在项目中产生问题，这两种情况就是**后处理**和 **UV 空间中的渲染**。

### 后处理

**抗锯齿：**
**在 non-OpenGL 平台，MSAA 开启的情况下，Unity 不会对图像进行 Filp 翻转操作**。但是由于 Unity 还是以 OpenGL 的 RenderTexture 的坐标系去描述这个 `_MainTex`，所以 `_MainTex_TexelSize.y` 为负数。`UNITY_UV_STARTS_AT_TOP` 这个宏其实就判断图形 api 平台是否为规定 uv 在原点在顶部，即非 OpenGL 平台平台。

```c
// 如果不是OpenGL平台，翻转纹理的采样
# if UNITY_UV_STARTS_AT_TOP
if (_MainTex_TexelSize.y < 0)
        uv.y = 1-uv.y;
# endif
```
>注意有的内置方法已经进行了判断，如果我们多写一个就会造成翻转失败


### 在 UV 空间中渲染

在纹理坐标 (UV) 空间中渲染特殊效果或工具时，您可能需要调整着色器，以便在 Direct3D 类和 OpenGL 类系统之间进行一致渲染。您还可能需要在渲染到屏幕和渲染到纹理之间进行渲染调整。为进行此类调整，应上下翻转 Direct3D 类投影，使其坐标与 OpenGL 类投影坐标相匹配。

内置变量 `ProjectionParams.x` 包含值 `+1` 或 `–1`。
`-1` 表示投影已上下翻转以匹配 OpenGL 类投影坐标，而 `+1` 表示尚未翻转。

您可以在着色器中检查此值，然后执行不同的操作。下面的示例将检查是否已翻转投影，如果已翻转，则再次进行翻转，然后返回 UV 坐标以便匹配。

`_ProjectionParams` ：
`x`  是 1.0（如果当前使用[翻转投影矩阵](https://docs.unity3d.com/cn/2022.3/Manual/SL-PlatformDifferences.html)进行渲染，则为 –1.0）
`y` 近平面$near$
`z` 远平面$far$
`w`  $\frac{1}{far}$ 
```c
float4 vert(float2 uv : TEXCOORD0) : SV_POSITION
{
    float4 pos;
    pos.xy = uv;
    // 此示例使用上下翻转的投影进行渲染，
    // 因此也翻转垂直 UV 坐标
    if (_ProjectionParams.x < 0)
        pos.y = 1 - pos.y;
    pos.z = 0;
    pos.w = 1;
    return pos;
}
```

## 缓冲区数据结构

执行以下操作以确保所有图形 API 编译具有相同数据布局的缓冲区：

- 使用“float4”和“float4x4”而不是“float3”和“float3x3”，因为“float4”变量在所有图形 API 上的大小相同，而“float3”变量在某些图形 API 上的大小可能不同。
- 按大小递减的顺序声明变量，例如“float4”，然后“float2”，然后“float”，因此所有图形 API 都以相同的方式构造数据。

例如：
```c
cbuffer myConstantBuffer { 
    float4x4 matWorld;
    float4 vObjectPosition; // Uses a float4 instead of a float3
    float arrayIndex;
}
```

# 变体
## 变体基础
![[Pasted image 20230628192002.png]]

能否写一个 All in One 的 Shader？
有三种方式，根据具体需求选择：
1. 静态分支 `#if`
2. 动态分支 `if`
3. 着色器变体 `#pragma`

### 静态分支 `#if`
![[Pasted image 20230628192227.png|500]]

**原理**：着色器**编译时**选择代码分支

**选择**：编译时，能够确定 Shader 执行的条件

**用法**：
- 使用 `#define` 定义激活分支
- 使用 `#if` 、 `#elif` 、 `#else` 和 `#endif` 预处理程序指令来创建静态分支
- 让 shader 代码执行其中一个分支
- 编译器会裁剪未激活代码分支，只会将执行的部分编译

**注意**：静态分支仅在手写代码可用，不能在 Shader Graph 中创建静念分文。

### 动态分支 `if`
![[Pasted image 20230628192654.png|300]]
**原理**：着色器**运行时**选择代码分支

**选择**：运行时，是否有可能动态选择分支? 

**用法**:
- 在手写代码中，使用 if 语句来执行分支
- 在 Shader Graph 中，使用 Branch 节点

动态分支的优点（相对于着色器变体方式)：
- 可以动态选择分支
- 不会造成代码膨胀

动态分支缺点（相对于着色器变体方式)：会导致运行时性能损失

### 着色器变体 `#pragma`

![[Pasted image 20230628193118.png]]

**着色器变体原理： (静态分支的加强版)**
- 编译时，生成多个**静态分支**的着色器版本
- 运行时，根据选择的变体**动态确定**要执行的着色器版本

**变体形成的 Shader 集合:** shader variants (SL) / shader states (SG)
  >SL 意思是手写的 shaderlab ，SG 意思是 shadergraph
  
**变体关键字:** shader keyword (SL) / keyword node (SG)

**包含多个变体的 Shader 被称为 Mega / Uber Shader**
- 例如: Standard/Lit Shader
- 详见《TA 进阶之路》: Unity Shader 源码解析

**着色器变体优点**：不会导致运行时性能损失
**着色器变体缺点**：构建时间、文件大小、运行时内存使用、加载时间

![[Pasted image 20230628193737.png]]

变体分类
  ![[Pasted image 20230628194409.png|700]]
**使用方法：**
属性快：声明变体
代码头：定义变体
代码体：使用变体

> [!Bug] 
> 变体关键词必须大写！
#### 全局关键字
**变体分类：**
1. `multi_ compile`：打包会为所有关键词生成变体，因此**可以在运行的时候通过脚本切换效果
2. **`shader_feature`：只会为材质使用到的关键词生成变体，没有使用到的关键词被裁剪不会生成变体，减小打包体积，**但无法在运行的时候通过脚本切换效果**。
```c
//shader_feature 可以看作 multi_compile 的子集 
#pragma shader_feature FANCY_STUFF
//这只是 #pragma shader_feature _ FANCY_STUFF 的快捷方式。它会扩展为两个着色器变体（第一个没有定义；第二个有定义）。
```


**如何选择：**
1. 变体用于所有 Shader 还是单个材质?
    - 应该将 shader_feature 用于单个材质中设置的关键字
    - 而 multi_compile 更适合**通过代码**来全局设置的
2. 关键字运行时是否会通过 CS 脚本修改？
如果设定好的变体在运行时不会通过 CS ，则应选择 shader_feature，否则选择 multi_compile

#### 局部关键字
**shader_feature** 和 **multi_compile** 的主要缺点是其中定义的所有关键字均会影响 Unity 的全局关键字计数上限（384 个全局关键字，外加 64 个本地关键字）。为了避免此问题，可以使用不同的着色器变体指令：__shader_feature_local__ 和 **multi_compile_local**。

*   `shader_feature_local`：类似于 `shader_feature`，但是枚举的关键字为本地关键字。
*   `multi_compile_local __`：类似于 `multi_compile`，但是枚举的关键字为本地关键字。

如果全局关键字和本地关键字同名，Unity 会优先考虑本地关键字。

**限制：**
*   不能将本地关键字与进行全局关键字更改的 API 一起使用（例如 Shader. EnableKeyword 或 CommandBuffer. EnableShaderKeyword）。
*   每个着色器最多有 64 个唯一性的本地关键字。
*   如果材质启用了本地关键字，并且其着色器变为不再声明的着色器，Unity 将创建新的全局关键字。

```c
# pragma multi_compile_local __ FOO_ON
```

此指令生成两个着色器变体：一个未定义任何关键字 (`__`)，另一个定义了 `FOO_ON`（本地关键字）。

启用本地关键字的过程与启用全局关键字的过程相同：

```c
public Material mat;
Private void Start() {
    mat.EnableKeyword("FOO_ON");
}
```

#### 特定于阶段的关键字指令

创建着色器变体时，**Unity 编辑器的默认行为是在每个变体中生成着色器程序的每个阶段**。例如，如果您的着色器程序包含一个顶点阶段和一个片元阶段，Unity 会为每个关键字组合生成一个顶点阶段和一个片元阶段。

如果关键字不影响所有阶段，则此默认行为会导致冗余工作。

为避免此问题，您可以使用特定于阶段的关键字指令。这些是应用于常规关键字指令的后缀。它们告诉编辑器给定关键字影响哪个着色器阶段，因此在为支持的图形 API 构建着色器时，它可以跳过多余的工作。

**使用特定于阶段的关键字指令**

可用的后缀是 `_vertex`、`_fragment`、`_hull`、`_domain`、`_geometry` 和 `_raytracing`。您在关键字指令的末尾应用后缀，例如：`multi_compile_fragment` 或 `shader_feature_local_vertex`。**要针对多个着色器阶段，您可以使用多个特定于阶段的关键字指令来声明同一个关键字。**

注意：您应确保关键字仅用于指定的着色器阶段。

 **支持的图形 API：**
Unity 并不完全支持在所有图形 API 中使用特定于阶段的关键字指令。
- 为 OpenGL 和 Vulkan 编译着色器时，编辑器会自动将任何特定于阶段的关键字指令恢复为常规关键字指令。
- 为 Metal 编译着色器时，任何针对顶点阶段的关键字也会影响曲面细分阶段，反之亦然。


## multi_ compile

![[Pasted image 20230628194839.png]]
### 变体激活
Unity 默认激活第一个变体，因此我们可以将默认关闭的开关放在第一个，防止意外打开开关。
```c
//如下：将产生两个变体，默认激活LIGHT_OFF变体
#pragma multi_compile LIGHT_OFF LIGHT_ON 
```

Unity 中的关键字数量上限是 384，Unity 将大约 60 个关键字保留供内部使用（因此降低了可用上限）
因此，可以用 `_` 或 `__` 表示开关关闭 6
```c
 #pragma multi_compile _ LIGHT_ON
 //生成两个变体
 //_或__:无关键字，即表示不用 LIGHT_ON，又不产生变体LIGHT_ON
 //第二个就是变体LIGHT_ON
```

对于单一条件的判定，没必要写两个变体浪费变体数量。
直接使用以下方式即可：
```c
#if defined(LIGHT_ON)
...
#else 
...
```


### 变体组合

![[Pasted image 20230628195933.png]]
 ![[Pasted image 20230628195959.png]]

### 变体开关
![[Pasted image 20230628200255.png]]

```cs
Shader.EnableKeyword  //启用全局关键字
Shader.DisableKeyword  //禁用全局关键字
CommandBuffer.EnableShaderKeyword  //使用 CommandBuffer 来启用全局关键字
CommandBuffer.DisableShaderKeyword  //使用 CommandBuffer 来禁用全局关键字
Material.EnableKeyword  //为常规着色器启用本地关键字
Material.DisableKeyword  //为常规着色器禁用本地关键字
ComputeShader.EnableKeyword  //为计算着色器启用本地关键字
ComputeShader.DisableKeyword  //计算着色器禁用本地关键字
```
### 快捷方式

有些情况需要定义很多变体，代码很长，Unity 提供了一些快捷方式

URP 支持着色器的变体，可以使用 #pragma multi_compile 宏实现编译不同需求下的着色器，常见的内置关键字有：

- `_MAIN_LIGHT_SHADOWS`
- `_MAIN_LIGHT_SHADOWS_CASCADE`
- `_ADDITIONAL_LIGHTS_VERTEX`
- `_ADDITIONAL_LIGHTS`
- `_ADDITIONAL_LIGHT_SHADOWS`
- `_SHADOWS_SOFT`
- `_MIXED_LIGHTING_SUBTRACTIVE`

大多数内置快捷方式会产生许多着色器变体。如果知道项目不需要这些变体，可以使用 `#pragma skip_variants` 来跳过对其中一些变体的编译。例如：

```c
# pragma multi_compile_fwdadd
# pragma skip_variants POINT POINT_COOKIE
```

该指令会跳过包含 `POINT` 或 `POINT_COOKIE` 的所有变体。

## 变体剥离
[Shader Stripping | Universal RP | 14.0.8 --- 着色器剥离|通用RP | 14.0.8 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/shader-stripping.html)
## 代码控制
通过外部控制变体切换有两种方式：
1. Properties 控制（KeywordEnum、Toggle 等）
2. 代码控制，当使用代码控制时，不要写 Properties，会有冲突。
![[6a7sdASdsssssadasd.gif]]
```cs
Properties
{
    //当使用代码控制时，注释掉该代码
    //[KeywordEnum(Red,Green,Blue)] _TestColor("Instancing", Float) = 0
}

...

float4 frag(Varyings input) : SV_Target
{
    #if _TESTCOLOR_RED
        return float4(1,0,0,1);
    #elif _TESTCOLOR_GREEN
        return  float4(0,1,0,1);
    #elif _TESTCOLOR_BLUE
        return float4(0,1,1,1);
    #endif

    return float4(1,1,1,1);
}
```

```cs
public class TestMultiCompile : MonoBehaviour
{
    public TMP_Dropdown dropdown; //使用一个dropdown来控制
   
    private List<string> showOptions = new List<string>();
    private List<string> dataOptions = new List<string>();
    
    void Start()
    {
        dropdown.options.Clear();
        
        showOptions.Add("Red");
        showOptions.Add("Green");
        showOptions.Add("Blue");
        
        
        dataOptions.Add("_TESTCOLOR_RED");
        dataOptions.Add("_TESTCOLOR_GREEN");
        dataOptions.Add("_TESTCOLOR_BLUE");
        
        dropdown.AddOptions(showOptions);
        dropdown.onValueChanged.AddListener(ChangeValue);
    }

    private void ChangeValue(int arg0)
    {
        for (int i = 0; i < dataOptions.Count; i++)
        {
            if (i == arg0)
            {
                Shader.EnableKeyword(dataOptions[i]);
            }
            else
            {
                Shader.DisableKeyword(dataOptions[i]);
            }
        }
    }

    private void OnDisable()
    {
        dropdown.onValueChanged.RemoveListener(ChangeValue);
        dropdown.options.Clear();
        showOptions.Clear();
        dataOptions.Clear();
    }
}
```



## 变体编辑器拓展（待续）

TestMultiCompile 属性面板如何自定义显示?
需求:
看到材质球当前启用了哪些全局和局部的变体
并且把全局和局部变体分两栏显示，两栏可折叠
## 局部变体的管理（待续）

