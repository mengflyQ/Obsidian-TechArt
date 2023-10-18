
# CG 语法基础
在 Unity Shader 中，ShaderLab 语言只是起到组织代码结构的作用，而真正实现渲染效果的部分是用 CG 语言编写的。
CG 程序片段通过指令嵌入在 Pass 中，夹在 Pass 中的指令 CGPROGRAM 和 ENDCG 之间

在 CG 程序片段之前，通常需要先使用 `#pragma` 声明编译指令

## 编译指令
### 编译目标等级

|编译指令 |作用|
|:--|:--|
| `#pragma vertex name` |定义顶点着色器的名称, 通常会使用 vert|
| `#pragma fragment name` |定义片段着色器的名称, 通常会使用 frag|
| `#pragma target name` |定义 Shader 要编译的目标级别﹐默认 2.5|

当编写完 Shader 程序之后，其中的 CG 代码可以被编译到不同的 Shader Models（简称 SM）中，为了能够使用更高级的 GPU 功能，需要对应使用更高等级的编译目标。同时，高等级的编译目标可能会导致 Shader 无法在旧的 GPU 上运行。

声明编译目标的级别可以使用 `#pragma target name` 指令，或者也可以使用 `#pragma require feature` 指令直接声明某个特定的功能，

```c
#pragma target 3.5  //目标等级3.5
#pragma require geometry tessellation //需要儿何体细分功能
```

### 渲染平台
默认情况下，Unity 会为所有支持的平台编译一份 Shader 程序，不过可以通过编译指令 `#pragma only_renderers PlatformName` 或者 ` #pragma exclude_renderers PlatformName` 指定编译某些平台或不编译某些平台

![[Pasted image 20230614194552.png]]

## 数据类型
顶点函数和片段函数中支持的数据类型
![[Pasted image 20230614194727.png]]


> [!NOTE] uniform 关键字
> uniform 关键词和图形 API 的 unitform 作用不一样，只是一个修饰词。在 UntiyShader 中，uniform 关键词是可以省略的。

### 整数数据类型

整数（`int` 数据类型）通常用作循环计数器或数组索引。为此，它们通常可以在各种平台上正常工作。

根据平台的不同，GPU 可能不支持整数类型。例如，Direct3D 9 和 OpenGL ES 2.0 GPU 仅对浮点数据进行运算，并且可以使用相当复杂的浮点数学指令来模拟简单的整数表达式（涉及位运算或逻辑运算）。

Direct3D 11、OpenGL ES 3、Metal 和其他现代平台都对整数数据类型有适当的支持，因此使用位移位和位屏蔽可以按预期工作。

### 复合矢量/矩阵类型

HLSL 具有从基本类型创建的内置矢量和矩阵类型。例如，`float3` 是一个 3D 矢量，具有分量 .x、. y 和 .z，而 `half4` 是一个中等精度 4D 矢量，具有分量 .x、. y、. z 和 .w。或者，可使用 .r、. g、. b 和 .a 分量来对矢量编制索引，这在处理颜色时很有用。

矩阵类型以类似的方式构建；例如 `float4x4` 是一个 4x4 变换矩阵。请注意，某些平台仅支持方形矩阵，最主要的是 OpenGL ES 2.0。

### 纹理/采样器类型

通常按照如下方式在 HLSL 代码中声明纹理：

```
sampler2D _MainTex;
samplerCUBE _Cubemap;
```

对于移动平台，这些将转换为“低精度采样器”，即预期纹理应具有低精度数据。如果您知道纹理包含 HDR 颜色，则可能需要使用半精度采样器：

```
sampler2D_half _MainTex;
samplerCUBE_half _Cubemap;
```

或者，如果纹理包含完整浮点精度数据（例如[深度纹理](https://docs.unity3d.com/cn/2021.1/Manual/SL-DepthTextures.html)），请使用完整精度采样器：

```
sampler2D_float _MainTex;
samplerCUBE_float _Cubemap;
```

## 语义
参数后被冒号隔开并且全部大写的关键词就是语义。

当使用 CG 语言编写着色器函数的时候，函数的输入参数和输出参数都需要填充一个语义（Semantic）来表示它们要传递的数据信息。语义可以执行大量烦琐的操作，使用户能够避免直接与 GPU 底层进行交流。

### 顶点着色器输入语义
![[Pasted image 20230614195139.png]]
当顶点信息包含的元素少于顶点着色器输入所需要的元素时，**缺少的部分会被 0 填充，而 w 分量会被 1 填充**。例如：顶点的 UV 坐标通常是二维向量，只包含 x 和 y 元素。如果输入的语义 TEXCOORD0 被声明为 float4 类型，那么顶点着色器最终获取到的数据将变成（x，y，0，1）。


> [!NOTE] 数据来源：MeshRender
> 填充到这些语义中的数据由使用该材质的 MeshRender 组件提供，每帧调用 DrawCall 的时候，MeshRender 组件会把它负责渲染的模型数据发送给 UnityShader。

### 顶点着色器输出和片段着色器输入语义
在整个渲染流水线中，顶点着色器最重要的一项任务就是需要输出顶点在裁切空间中的坐标，这样 GPU 就可以知道顶点在屏幕上的栅格化位置以及深度值。在顶点函数中，这个输出参数需要使用 float4 类型的 `SV_POSITION` 语义进行填充。

顶点着色器产生的输出值将会在三角形遍历阶段经过插值计算，最终作为像素值输入到片段着色器。换句话说，顶点着色器的输入即为片段着色器的输入。

![[Pasted image 20230614195313.png]]

片段着色器会自动获取顶点着色器输出的裁切空间顶点坐标，**所以片段函数输入的 SV_POSITION 可以省略**。这也解释了为什么有些 Shader 的片段函数中只有输出参数，但是没有输入参数。
**需要特别注意的是，与顶点函数的输入语义不同，`TEXCOORDn` 不再特指模型的 UV 坐标，`COLORn` 也不再特指顶点颜色。它们的使用范围更广，可以用于声明任何符合要求的数据，所以在使用过程中不要被语义的名称欺骗了。**
### 片段着色器输出语义
片段着色器通常只会输出一个 fixed4 类型的颜色信息，输出的值会存储到渲染目标（Render Target）中，输出参数使用 `SV_TARGET` 语义进行填充。

## CG 标准库函数
![[Pasted image 20230615103657.png]]
### lerp 插值

lerp 函数是针对**CG/HLSL**（一种 Shader 语法）中的 lerp 函数
我们先看一下它的函数签名和定义

![image-20220706155641339](image-20220706155641339.png)

从定义来看还是挺简单的，我们主要是理解它有什么作用。另外我们规定，weight 是一个在区间[0,1]的实数，倒不是因为取更大的值之后，这个函数就无定义了，而是因为取更大的值，这个函数就失去了我们构造它的理由，另外，CG 会限制 weight 的值在 0-1 的范围内，超过这个范围会被留在边界 0 或者边界 1

这里的 y1 被称为起点，而 y2 被称为终点，lerp 函数就是取值 y1 到 y2 中间的一个值。取多少呢？就由 weight 来控制，当 weight 为 0.5 时，它正好落在起点和终点的中间。为了更加方便理解，我们可以把这个公式换成这种格式

![image-20220706155700754](image-20220706155700754.png)

简单来说，lerp 函数就是在 y1 和 y2 之间过渡，唯一不同的地方就是，y1 和 y2 可以是一个值，也可以是一个函数。比如，我们可以在正弦函数和线性函数之前做过渡，我们先看一下正弦函数

![img](v2-911d01df3d20519bd07b2880d8d91fb2_1440w%201.jpg)

再看一下最简单的线性函数（恒等映射函数 y=x）

![img](v2-a2374819e0d93f70242bb91131883a47_1440w%201.jpg)

在它俩之间做过渡，我们只需要写出 lerp (sin (x), x, 0.5)即可。当然，可以调整 weight 参数观察不同的结果。

**weight 为 0.5 时：**

![img](v2-770e7772c6e7a8d99962450eb7672745_1440w%201.jpg)

**weight 为 0.8 时：**

![img](v2-000da5aa65555a40a9c08537824e69db_1440w%201.jpg)

**weight 为 0.2 时：**

![img](v2-aa8c4ca591e6dd6f54393eb8b67c634b_1440w%201.jpg)

是不是非常的直观，所以这就扯到了 Lerp 函数的两种不同的作用。

- 构造新的函数
- 在两个值之间进行过度

### frac 向下取整

frac 函数通过如下代码实现：

```cpp
float frac(float v)
{
  // floor函数返回值会向下取整
  return v - floor(v);
}
```

该函数只有一个参数 v，v 参数的类型不仅可以是 float 类型，也可以是其它 float 向量。通过该函数的实现可知，它**返回标量或每个矢量中各分量的小数部分。**

### clamp 夹具函数

~~~less
float clamp（float x, float a, float b）;
~~~

将 x 固定在[a, b]范围内，

如下所示:

1. 如果 x 小于 a，返回 a;

2. 如果 x 大于 b，返回 b;

3. 否则返回 x。

### clip 剔除

如果给定向量的任何分量或给定标量为负，则终止当前像素输出

对像素剔除：当采样结果小于 0，该像素就会被剔除不会显示到屏幕上

### smoothstep 平滑阶梯

smoothstep 可以用来生成 0 到 1 的平滑过渡值，它也叫平滑阶梯函数。

```cpp
float smoothstep(float t1, float t2, float x)
{
  x = clamp((x - t1) / (t2 - t1), 0.0, 1.0); 
  return x * x * (3 - 2 * x);
}
```

**当 x 等于 t1 时，结果值为 0；**

**当 x 等于 t2 时，结果值为 1；**

**(ps: 值限制在 0~1 之间的原因是因为 clamp 函数的限制)**



### step 函数

step (a, b) 

b >= a 时输出 1

b < a 时输出 0

# 封装 cgnic 库
新建文件: XXX. cgnic
unity 内无法直接创建，可以使用 IDE 创建

在 shader 中使用： # include “路径” 
![[Pasted image 20221018211856.png]]

# 多光源/阴影

![image-20220707190035317](image-20220707190035317.png)
## multi_compile
**在默认状态下，前向渲染只支持一个投射阴影的平行光，如果想要修改默认状态，就需要添加多重编译指令。**
Unity 提供了一系列多重编译指令以编译出不同的 Shader 变体，这些编译指令主要用于处理不同类型的灯光、阴影和灯光贴图，可以使用的编译指令如下：
（1）`multi_compile_fwdbase`：编译 Forward BasePass 中的所有变体，用于处理不同类型的光照贴图，并为主要平行光开启或者关闭阴影。
（2）`multi_compile_fwdadd`：编译 Forward Additional Pass 中的所有变体，用于处理平行光、聚光灯和点光源，以及它们的 cookie 纹理。
（3）`multi_compile_fwdadd_fullshadows`：与 multi_compile_fwdadd 类似，但是增加了灯光投射实时阴影的效果。


# 变体
### 快捷方式
在**内置管线**中，有几个 “快捷方式” 可以用于常用变体组合。这些组合常用于处理不同的灯光、阴影和光照贴图类型。


*   `multi_compile_fwdbase` 编译 [PassType.ForwardBase](https://docs.unity3d.com/cn/2021.1/ScriptReference/Rendering.PassType.ForwardBase.html) 所需的所有变体。这些变体处理不同的光照贴图类型以及启用或禁用的方向光主要阴影，它相当于这些变体的组合：
    *   DIRECTIONAL
    *   LIGHTMAP_ON
    *   DIRLIGHTMAP_COMBINED
    *   DYNAMICLIGHTMAP_ON
    *   SHADOWS_SCREEN
    *   SHADOWS_SHADOWMASK
    *   LIGHTMAP_SHADOW_MIXING
    *   LIGHTPROBE_SH
    *   VERTEXLIGHT_ON
*   `multi_compile_fwdadd` 编译 [PassType.ForwardAdd](https://docs.unity3d.com/cn/2021.1/ScriptReference/Rendering.PassType.ForwardAdd.html) 的变体。这将编译变体来处理方向光、聚光灯或点光源类型，以及它们带有剪影纹理的变体，它相当于这些变体的组合：
    *   POINT
    *   DIRECTIONAL
    *   SPOT
    *   POINT_COOKIE
    *   DIRECTIONAL_COOKIE
*   `multi_compile_fwdadd_fullshadows` - 与 `multi_compile_fwdadd` 相同，但还能够让光源具有实时阴影，它相当于 `multi_compile_fwdadd`  变体的组合加上：
    *   SHADOWS_DEPTH
    *   SHADOWS_SCREEN
    *   SHADOWS_CUBE
    *   SHADOWS_SOFT
    *   SHADOWS_SHADOWMASK
    *   LIGHTMAP_SHADOW_MIXING
*   `multi_compile_fog` 扩展为多个变体以处理不同的雾效类型 (off/linear/exp/exp2)。
