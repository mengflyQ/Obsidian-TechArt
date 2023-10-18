---
title: 2 Draw Call
aliases: []
tags: []
create_time: 2023-06-19 15:23
uid: 202306191523
banner: "[[Pasted image 20230619152331.png]]"
banner_y: 0.5
---


![[Pasted image 20230619152316.png]]
# 2.1 Shader

Shader 是运行在 GPU 上的一种处理图像信息的程序。**要在哪里绘制，如何绘制通常由 Shader 决定**。第一节我们也说到，SRP 保留了对 Unlit Shader 的支持，从本节开始，我们将编写自己的 Shader 来渲染几何。

着色器有很多可编程的阶段，比如顶点着色器和片元着色器等。这些着色器的可编程性在于我们可以使用一种特定的语言来编写程序，就和我们可以用 C# 来编写游戏逻辑一样。着色语言就是专门用于编写着色器的，常见的三种高级着色语言分别是微软 DirectX 的 HLSL（High Level Shading Language）、OpenGL 的 GLSL（OpenGL Shading Language）和 NVIDIA 的 CG（C for Graphic）。这些语言会被编译成与机器无关的汇编语言，也被称为中间语言，这些中间语言再交给显卡驱动来翻译成真正的机器语言，即 GPU 可以理解的语言。

在 Unity 的内置渲染管线中，我们通常用 CG 语言来编写着色器，CG 是真正意义上的跨平台，它会根据平台不同编译成相应的中间语言，且 CG 的跨平台很大原因取决于与微软的合作，也导致 CG 语言的语法和 HLSL 非常像，很多情况下 CG 语言甚至可以无缝移植成 HLSL 代码，但 CG 语言已经停止更新很多年了，基本上已经被放弃了。**现在 SRP 的着色器代码库使用的是 HLSL，Unity 也使用了 HLSL 的编译器来编译 Shader，且 HLSL 转 GLSL 比较容易。接下来的所有着色器代码我们将使用 HLSL 着色语言来编写。**

在这里希望读者对 Shader 语法有一定的了解，一些基本的语法知识将不过多介绍。

## 2.1.1 Unlit Shader

本节内容不涉及光照的讲解，我们下面编写一个不受光照影响的 Unlit Shader。

1. 新建一个 Shaders 子文件夹，用来存放着色器代码。我们创建一个 Unlit Shader 资源，删除里面所有默认代码。编写一个最基础的结构骨架：

```cs
Shader "CustomRP/Unlit"
{
    Properties
    {

     }
    SubShader
    {     

         Pass
        {

         }
    }
}
```

2. 创建一个材质球，命名为 Unlit，使用该 Shader。
![[Pasted image 20230619152452.png]]

3. 我们接下来实现 Pass 块，因为我们使用 HLSL 着色语言，所以用 HLSLPROGRAM 和 ENDHLSL 来包裹 Shader 代码，只有这样才能正确的编译。开头也说到着色器有两个常用的可编程阶段，也就是顶点着色器和片元着色器。我们使用 Pragma 指令来标识顶点和片元着色器用什么函数来实现。**Pragma 个词来自希腊语，指的是一个行动或者一些需要做的事情，它在许多编程语言中用于发布特殊的编译器指令。**

我们在 Shader 的同级目录下创建一个 UnlitPass.hlsl 文件，在 HLSL 文件中去实现这两个函数，这有利于代码的管理和组织重用。然后在 Unlit.shader 中使用`#include` 指令插入 HLSL 的内容，文件的路径是相对路径。Unity 没有直接创建 HLSL 的菜单选项，我们拷贝一个 Unlit.shader，然后把 “.shader” 改为“.hlsl”，里面的代码全部清空。

```c
Pass
        {
            HLSLPROGRAM
            #pragma vertex UnlitPassVertex
            #pragma fragment UnlitPassFragment
            #include "UnlitPass.hlsl"
            ENDHLSL
        }
```


![[Pasted image 20230619152542.png]]
4. 使用 Include 指令会插入该 HLSL 文件全部的内容，并且**它允许多次 Include 同一文件**，这样就有可能出现多份重复代码，导致重复声明或者其它一些编译报错，当编写的 HLSL 文件多了，一层嵌套一层，难免会出现重复 Include 同一文件的疏忽，所以我们**有必要在编写 HLSL 着色器代码的时候加个保护。**

我们一般通过 `#define` 指令定义一些标识符，在定义宏之前先判断一下是否定义过此标识符，如果定义过了，就跳过里面的所有代码不再执行，直接跳转到 `#endif`末尾的代码。这样就能保证无论重复 Include 该 HLSL 文件多少次，只有第一次的 Include 是有效代码插入。这是一个良好的习惯，包括 Unity 的 SRP 源码库中的 HLSL 文件也是这么做的。

```c
#ifndef CUSTOM_UNLIT_PASS_INCLUDED
#define CUSTOM_UNLIT_PASS_INCLUDED
#endif
```

## 2.1.2 着色器函数

我们先定义一个空的顶点函数和片元函数来解决 Shader 的编译报错。然后在顶点函数中我们获取模型空间中的顶点位置并返回，**模型空间中的顶点位置是一个三维向量，我们将其扩展到四维，W 分量设为 1。**

为什么返回的是一个四维向量？

在计算机图形领域中，变换是一种非常重要的手段，它指的是把一些数据，如点、方向矢量和颜色等等通过某种方法进行转换的过程。常用的变换包括缩放、旋转和平移。其中缩放和旋转是线性变换，如果要对一个三维矢量进行变换，仅仅使用 3X3 的矩阵就可以表示所有的线性变换。但平移变换是非线性的，并不能用一个 3X3 的矩阵来表示，于是就有了仿射变换（Affine Transform）。仿射变换就是合并线性变换和平移变换的变换类型，可以使用一个 4X4 的矩阵来表示，为此我们需要把矢量扩展到四维空间下，这就是齐次坐标空间。

4X4 的矩阵可以表示平移变换，同时我们要把三维的矢量转换成四维矢量，也就是齐次坐标。对于 1 个点，从三维坐标转换成齐次坐标是要把 W 分量设置为 1，对于方向矢量则把 W 分量设置为 0。这样的设置会导致：当用一个 4X4 矩阵对一个点进行变换时，平移、旋转和缩放都会施加于该点。但如果是用于变换一个方向矢量，平移的效果会被忽略。

```c
#ifndef CUSTOM_UNLIT_PASS_INCLUDED
#define CUSTOM_UNLIT_PASS_INCLUDED
//顶点函数
float4 UnlitPassVertex(float3 positionOS : POSITION) : SV_POSITION
{
    return float4(positionOS, 1.0);
}
//片元函数
void UnlitPassFragment() {}

 #endif
```

然后我们创建一个球体，把 Unlit 材质球给它：

![[Pasted image 20230619152558.png]]
Mesh 被渲染出来了，但是效果不对，因为我们在顶点函数输出的顶点位置不是正确的空间。我们要进行空间变换，需要定义变换矩阵来进行。当物体被绘制时，这些变换矩阵会被发送到 GPU，我们需要在 Shader 中添加这些矩阵，由于这些都是相同的且是通用的，我们将这些定义到一个单独的 HLSL 文件中方便代码管理和调用。

1. 新建一个 ShaderLibrary 子文件夹，来存放一些自定义的着色器库文件。我们在其下面新建一个 UnityInput.hlsl 文件，该文件用于存放 Unity 提供的一些的标准输入，我们在里面定义一个 float 4X4 类型的从模型空间到世界空间的转换矩阵。

```c
//unity标准输入库
#ifndef CUSTOM_UNITY_INPUT_INCLUDED
#define CUSTOM_UNITY_INPUT_INCLUDED
//定义一个从模型空间转换到世界空间的转换矩阵
float4x4 unity_ObjectToWorld;

 #endif
```

2. 空间转换矩阵有了，我们需要定义一个方法用来进行空间转换，这些函数基本都是常用的功能，我们在 ShaderLibrary 子文件夹中新建一个 Common.hlsl 库文件。然后定义一个将顶点从模型空间转换到世界空间的方法，传参是三维顶点坐标，并使用 mul() 方法完成顶点坐标的空间转换。第一个参数是转换矩阵，第二个是四维顶点坐标。我们返回世界空间的顶点坐标的 XYZ 分量。

```c
//公共方法库
#ifndef CUSTOM_COMMON_INCLUDED
#define CUSTOM_COMMON_INCLUDED
//使用UnityInput里面的转换矩阵前先include进来
#include "UnityInput.hlsl"
//函数功能：顶点从模型空间转换到世界空间
float3 TransformObjectToWorld(float3 positionOS) {
    return mul(unity_ObjectToWorld, float4(positionOS, 1.0)).xyz;
}

 #endif
```

3. 回到 UnlitPass 的顶点函数中，调用该方法进行空间转换。

```c
#include "../ShaderLibrary/Common.hlsl"
//顶点函数
float4 UnlitPassVertex(float3 positionOS : POSITION) : SV_POSITION
{
    float3 positionWS = TransformObjectToWorld(positionOS.xyz);
    return float4(positionWS, 1.0);
}
```

4. 结果现在仍是错的，我们需要把顶点转换到齐次裁剪空间才能得到正确的结果。在 UnityInput.hlsl 中定义一个视图 - 投影转换矩阵，并在 Common.hlsl 定义方法将顶点从世界空间转换到齐次裁剪空间。

```c
//定义一个从世界空间转换到裁剪空间的矩阵
float4x4 unity_MatrixVP;
```

```c
//函数功能：顶点从世界空间转换到裁剪空间
float4 TransformWorldToHClip(float3 positionWS) {
    return mul(unity_MatrixVP, float4(positionWS, 1.0));
}
```

5. 在 UnlitPass 的顶点函数中将顶点转换到齐次裁剪空间后，我们得到了正确的结果。

```c
float4 UnlitPassVertex (float3 positionOS : POSITION) : SV_POSITION 
{
    float3 positionWS = TransformObjectToWorld(positionOS.xyz);
    return TransformWorldToHClip(positionWS);
}
```


![[Pasted image 20230619152611.png]]
## 2.1.3 SRP 源码库

1. 以上提及的在 Common.hlsl 定义的两个空间转换方法比较常用，在安装的插件包 Core RP Library 中也有官方的库文件定义了这两个方法，所以我们把自己定义的 TransformObjectToWorld 和 TransformWorldToHClip 方法删除，把定义这两个方法的库文件 SpaceTransforms.hlsl 给 Include 进来。

```c
//公共方法库
#ifndef CUSTOM_COMMON_INCLUDED
#define CUSTOM_COMMON_INCLUDED
//使用UnityInput里面的字段前先include进来
#include "UnityInput.hlsl"
#include "Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"
#endif
```

2. **这时会有编译报错，告诉你 SpaceTransforms.hlsl 中不存在 unity_ObjectToWorld ，它希望我们定义 UNITY_MATRIX_M 宏来取代它，遵守它的规则才能通过编译**。为了通过编译，我们定义一些宏来取代常用的转换矩阵。

```c
//定义一些宏取代常用的转换矩阵
#define UNITY_MATRIX_M unity_ObjectToWorld
#define UNITY_MATRIX_I_M unity_WorldToObject
#define UNITY_MATRIX_V unity_MatrixV
#define UNITY_MATRIX_VP unity_MatrixVP
#define UNITY_MATRIX_P glstate_matrix_projection
#define UNITY_PREV_MATRIX_M unity_ObjectToWorld_prev  
#define UNITY_PREV_MATRIX_I_M unity_WorldToObject_prev
#include 
"Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"
```

3. 然后在 UnityInput.hlsl 补充一些没有定义的转换矩阵。

```c
//unity标准输入库
#ifndef CUSTOM_UNITY_INPUT_INCLUDED
#define CUSTOM_UNITY_INPUT_INCLUDED
float4x4 unity_ObjectToWorld;  
float4x4 unity_WorldToObject;  
//这个矩阵包含一些在这里我们不需要的转换信息  
real4 unity_WorldTransformParams;  
  
float4x4 unity_MatrixVP;  
float4x4 unity_MatrixV;  
float4x4 glstate_matrix_projection;  
float4x4 unity_ObjectToWorld_prev;  
float4x4 unity_WorldToObject_prev;
#endif
```

4. 最后在 Common.hlsl 中把官方的 Common 库 include 进来，用来补全所有的别名替代宏。

```c
#include 
"Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
//使用UnityInput里面的字段前先include进来
#include "UnityInput.hlsl"
```

5. 下面我们开始补全片元函数，我们想让它返回一个在材质面板中可调的颜色值。首先在 Shader 的属性块中定义一个 Color 值，供我们在材质面板中调色，然后在 UnlitPass.hlsl 定义对应的字段获取该颜色值，最后在片元函数中返回它。

```c
Properties
      {
          _BaseColor("Color", Color) = (1.0, 1.0, 1.0, 1.0)
      }
```

```
float4 _BaseColor;
//片元函数
float4 UnlitPassFragment() : SV_TARGET
{
    return _BaseColor;
}
```


![[Pasted image 20230619152618.png]]
# 2.2 批处理

## 2.2.1 Draw Call 和 Set Pass Call
![[Pasted image 20230621095059.png|350]]
**要想 CPU 和 GPU 既可以并行又可以独立工作，要使用一个命令缓冲区（Command Buffer）**。命令缓冲区包含了一个命令队列，当 CPU 需要渲染一些对象时，它会通过图像编程接口向命令缓冲区添加命令，当 GPU 完成上一次的渲染任务后，它会从命令队列中读取一个命令并执行它，添加和读取的过程是相互独立的。

**命令缓冲区的命令有很多种类，而 Draw Call 就是其中一种，其它命令还有 Set Pass Call 等等**。

**Set Pass Call 代表了我们常说的改变渲染状态，当切换材质或者切换同一材质中 Shader 的不同 Pass 进行渲染时都会触发一次 Set Pass Call**。比如我们渲染 1000 个相同的物体和渲染 1000 个不同的物体，虽然两者 Draw Call 都是 1000，但是前者 Set Pass Call 为 1，后者还是 1000。<mark style="background: #FF5582A6;">切换渲染状态往往比 Draw Call 更耗时，所以这也是 URP 不再支持多 Pass 的原因。</mark>

每次调用 Draw Call 之前，CPU 都要向 GPU 发送很多内容，包括数据、状态和命令等。在这一阶段 CPU 需要完成很多工作，例如检查渲染状态等。一旦 CPU 完成了这些准备工作，GPU 就可以开始本次渲染，**GPU 的渲染能力很强，渲染速度往往比 CPU 的提交命令速度快，如果 Draw Call 数量过多，CPU 就会把大量时间花费在提交 Draw Call 上，造成 CPU 过载，游戏帧率变低，所以我们需要<mark style="background: #FF5582A6;">使用批处理（Batching）技术来降低 Draw Call</mark>。**

**早期的 Unity 只支持动态批处理和静态批处理，后来又支持了 GPU Instancing，最后 <mark style="background: #FF5582A6;">SRP 出现时支持了一种新的批处理方式 SRP Batcher</mark>**。本节内容我们不讨论静态批处理，其它三种批处理方式我们在渲染管线中会添加支持。

## 2.2.2 SRP Batcher

SRP Batcher 是一种新的批处理方式，**它不会减少 Draw Call 的数量，但可以减少 Set Pass Call 的数量，并减少绘制调用命令的开销**。CPU 不需要每帧都给 GPU 发送渲染数据，如果这些数据没有发生变化则会保存在 GPU 内存中，每个绘制调用仅需包含一个指向正确内存位置的偏移量。

**SRP Batcher 是否会被打断的判断依据是 Shader 变种，即使物体之间使用了不同的材质，但是使用的 Shader 变种相同就不会被打断**，传统的批处理方式是要求使用同一材质为前提的。

**SRP Batcher 会在主存中将模型的坐标信息、材质信息、主光源阴影参数和非主光源阴影参数分别保存到不同的 CBUFFER（常量缓冲区）中，只有 CBUFFER 发生变化才会重新提交到 GPU 并保存。**

基本概念介绍完了，下面来实践。现在我们的 Shader 是不兼容 SRP Batcher 的，可以看到以下信息，我们需要对我们的 Shader 做一些调整。

![[Pasted image 20230619152650.png]]

1. 它是指材质的所有属性都需要在常量内存缓冲区 CBUFFER 里定义，要我们将_BaseColor 这个属性在名字为 UnityPerMaterial 的 CBUFFER 块中定义，如下所示。

```c
cbuffer UnityPerMaterial 
{
    float _BaseColor;
};
```

但**并非所有平台（如 OpenGL ES 2.0）都支持常量缓冲区，我们使用 SRP 源码库中的 CBUFFER_START 和 CBUFFER_END 宏来替代 CBUFFER 块。这样的话不支持常量缓冲区的平台就会忽略掉 CBUFFER 的代码。**

2. 我们在 UnlitPass.hlsl 中将_BaseColor 定义在名字为 UnityPerMaterial 的常量缓冲区中。

```c
//所有材质的属性我们需要在常量缓冲区里定义
CBUFFER_START(UnityPerMaterial)
    float4 _BaseColor;
CBUFFER_END
```

3. 在 UnityInput.hlsl 中把几个矩阵定义在 UnityPerDraw 的常量缓冲区中。

```c
CBUFFER_START(UnityPerDraw)
float4x4 unity_ObjectToWorld;
float4x4 unity_WorldToObject;

 real4 unity_WorldTransformParams;
CBUFFER_END
```

编译后发现还是 Shader 不兼容 SRP Batcher：

![[Pasted image 20230619152700.png]]

4. **它指出，如果我们需要使用一组特定值的其中一个值，我们需要把这组特定值全部定义出来，现在还缺少 unity_LODFade 的定义。**

```c
CBUFFER_START(UnityPerDraw)
    float4x4 unity_ObjectToWorld;
    float4x4 unity_WorldToObject;
    float4 unity_LODFade;
    real4 unity_WorldTransformParams;
CBUFFER_END
```

![[Pasted image 20230619152712.png]]

5. 至此，我们的 Shader 已经兼容 SRP Batcher 了，我们在代码中启用 SRP Batcher 进行测试。**创建渲染管线实例的时候，在构造函数里启用。**

```c
public class CustomRenderPipeline : RenderPipeline
{
    CameraRenderer renderer = new CameraRenderer();
    //测试SRP合批启用
    public CustomRenderPipeline() {
        GraphicsSettings.useScriptableRenderPipelineBatching = true;
    }
```

![[Pasted image 20230619152718.png]]
可以看到，在 Statistics 面板中，有 4 个批次被存储起来，以负数的形式显示。**在 Frame Debugger 中可以看到一个 SRP Batch 条目，但这不是说这些物体被合并成了一个 Draw Call，而是指它们的优化序列。**

## 2.2.3 多种颜色

若想给相同的物体设置不同的颜色，那么每个物体都需要使用一个不同的材质并调整颜色，**我们接下来编写一个脚本，让所有相同物体使用同一个材质，但可以给每个物体设置不同的颜色。**

在 CustomRP 下创建一个 Examples 子文件夹，新建脚本 `PerObjectMaterialProperties.cs`，脚本中我们定义一个可以调整颜色的 baseColor 属性，并将颜色值通过 `MaterialPropertyBlock` 对象传递给材质。把这个脚本挂到每一个球体上面，然后设置不同的颜色。

```c
[DisallowMultipleComponent]  
public class PerObjectMaterialProperties : MonoBehaviour  
{  
    static int baseColorId = Shader.PropertyToID("_BaseColor");  
   
    [SerializeField]  
    Color baseColor = Color.white;  
    static MaterialPropertyBlock block;  
   
    void OnValidate()  
    {  
        if (block == null)  
        {  
            block = new MaterialPropertyBlock();  
        }  
        //设置材质属性  
        block.SetColor(baseColorId, baseColor);  
   
        GetComponent<Renderer>().SetPropertyBlock(block);  
    }  
    void Awake()  
    {  
        OnValidate();  
    }  
}
```

但**我们发现 SRP Batcher 失效了**！没有办法处理每个对象的材质属性。

![[Pasted image 20230619152723.png]]
## ​2.2.4 GPU Instancing

**如果能将数据一次性发送给 GPU，然后使用一个绘制函数让渲染流水线利用这些数据绘制多个相同的物体将会大大提升性能。这种技术就是 GPU 实例化（GPU Instancing）技术。** 使用 GPU Instancing 能够在一个绘制调用中渲染多个具有相同网格的物体，CPU 收集每个物体的材质属性和变换，放入数组发送到 GPU，GPU 遍历数组按顺序进行渲染。

GPU 实例化的思想，就是把每个实例的不同信息存储在缓冲区（可能是顶点缓冲区，可能是存储着色器 Uniform 变量的常量缓冲区）中，然后直接操作缓冲区中的数据来设置。

假设需要渲染 100 个相同的模型，每个模型有 256 个三角形，那么需要两个缓冲区，一个是用来描述模型的顶点信息，因为待渲染的模型是相同的，所以这个缓冲区只存储了 256 个三角形（如果不存在任何的优化组织方式，则有 768 个顶点）；另一个就是用来描述模型在世界坐标下的位置信息。例如不考虑旋转和缩放，100 个模型即占用 100 个 float3 类型的存储空间。

以 Direct3D 11 为例，当准备好顶点数据、设置好顶点缓冲区之后，接下来进入输入组装阶段。输入组装阶段是使用硬件实现的。此阶段根据用户输入的顶点缓冲区信息、图元拓扑结构信息和描述顶点布局格式信息，把顶点组装成图元，然后发送给顶点缓冲区。设置好组装的相关设置后，对应的顶点着色器和片元着色器也要做好对应的设置才能使用实例化技术。

1. **要支持 GPU Instancing，首先需要在 Shader 的 Pass 中添加 `#pragma multi_compile_instancing` 指令**，然后在材质球上就能看到切换开关了，这时 Unity 会为我们的 Shader 生成两种变体。

```c
HLSLPROGRAM
    #pragma multi_compile_instancing
    #pragma vertex UnlitPassVertex
    #pragma fragment UnlitPassFragment
```

![[Pasted image 20230619152734.png]]

2. 在 Common.hlsl 文件中 include SpaceTransforms.hlsl 之前，我们**将 SRP 源码库中的 `UnityInstancing.hlsl` 文件 Include 进来**，我们需要用到里面的一些定义好的宏和方法。

```c
#include 
"Packages/com.unity.render-pipelines.core/ShaderLibrary/UnityInstancing.hlsl"

 #include 
"Packages/com.unity.render-pipelines.core/ShaderLibrary/SpaceTransforms.hlsl"
```

1. **`UnityInstancing.hlsl` 通过重新定义一些宏去访问实例的数据数组，它需要知道当前渲染对象的索引，该索引是通过顶点数据提供的**。
   
   UnityInstancing.hlsl 中定义了 **`UNITY_VERTEX_INPUT_INSTANCE_ID` 宏**来简化了这个过程，通过该宏定义可以在输入输出结构体中获取到实例的 ID。**步骤如下：**
    1. 我们定义一个顶点输入结构体，将 positionOS 的定义放进来，然后在结构体中加入 `UNITY_VERTEX_INPUT_INSTANCE_ID` 宏
    2. 将该结构体对象作为顶点函数的输入参数。
    3. 在顶点函数添加 **`UNITY_SETUP_INSTANCE_ID(input)` 代码，用来提取顶点输入结构体中的渲染对象的索引，并将其存储到其他实例宏所依赖的全局静态变量中**。

```c
//用作顶点函数的输入参数
struct Attributes 
{
    float3 positionOS : POSITION;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

 //顶点函数
float4 UnlitPassVertex(Attributes input) : SV_POSITION
{
    UNITY_SETUP_INSTANCE_ID(input);
    float3 positionWS = TransformObjectToWorld(input.positionOS);
    return TransformWorldToHClip(positionWS);
}
```

4. 目前我们还不支持每个物体实例的材质数据，且 SRP Batcher 优先级比较高，我们还不能得到想要的结果。首先我们需要使用一个数组引用替换`_BaseColor`，并使用 `UNITY_INSTANCING_BUFFER_START` 和 `UNITY_INSTANCING_BUFFER_END` 替换 `CBUFFER_START` 和 `CBUFFER_END`。

```c
//CBUFFER_START(UnityPerMaterial)
// float4 _BaseColor;
//CBUFFER_END

UNITY_INSTANCING_BUFFER_START(UnityPerMaterial)
UNITY_DEFINE_INSTANCED_PROP(float4, _BaseColor)
UNITY_INSTANCING_BUFFER_END(UnityPerMaterial)
```

5. 我们还需要在片元函数中也提供对象的索引，通过在顶点函数中使用 `UNITY_TRANSFER_INSTANCE_ID(input，output)` 将对象位置和索引输出，若索引存在则进行复制。为此我们还需定义一个片元函数输入结构体，在其中定义 `positionCS` 和 `UNITY_VERTEX_INPUT_INSTANCE_ID` 宏。

```c
//用作片元函数的输入参数
struct Varyings 
{
    float4 positionCS : SV_POSITION;
    float2 baseUV : VAR_BASE_UV;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

 Varyings UnlitPassVertex (Attributes input) 
{
    Varyings output;
    UNITY_SETUP_INSTANCE_ID(input);
    UNITY_TRANSFER_INSTANCE_ID(input, output);
    float3 positionWS = TransformObjectToWorld(input.positionOS);
    output.positionCS = TransformWorldToHClip(positionWS);
    return output;
}
```

6. 在片元函数中也定义 `UNITY_SETUP_INSTANCE_ID(input)` 提供对象索引，且现在需要通过 `UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _BaseColor)` 来访问获取材质的颜色属性了。

```c
float4 UnlitPassFragment(Varyings input):SV_Target{
    UNITY_SETUP_INSTANCE_ID(input);
    return UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial,_BaseColor);
}
```

最后通过帧调试器可以看到 4 个小球已经合**并成一个 Draw Call** 了，它们使用的是同一材质。

![[Pasted image 20230619152750.png]]
## ​2.2.5 绘制许多网格小球

我们在 Examples 子文件夹下创建一个脚本 `MeshBall` 来生成多个 Mesh 和多个小球对象，来展示成百上千个对象使用 GPU Instancing 进行合批的效果。

**我们无需生成多个对象，只需要填充变换矩阵和颜色的数组，告诉 GPU 用它们去渲染 Mesh，这样最多可以一次提供 1023 个实例，这是 GPU Instancing 的特性**。然后我们在 Awake 方法中随机生成位置和颜色填充数组。最后调用 `Graphics.DrawMeshInstanced` 绘制网格。

```C
public class MeshBall : MonoBehaviour
{
    static int baseColorId = Shader.PropertyToID("_BaseColor");

     [SerializeField]
    Mesh mesh = default;
    [SerializeField]
    Material material = default;

     Matrix4x4[] matrices = new Matrix4x4[1023];
    Vector4[] baseColors = new Vector4[1023];

      MaterialPropertyBlock block;

     void Awake()
    {
        for (int i=0;i<matrices.Length;i++)
        {
            matrices[i] = Matrix4x4.TRS(Random.insideUnitSphere*10f,Quaternion.Euler(Random.value*360f, Random.value * 360f, Random.value * 360f),Vector3.one*Random.Range(0.5f,1.5f));
            baseColors[i] = new Vector4(Random.value,Random.value,Random.value,Random.Range(0.5f,1f));
        }
    }

      void Update()
    {
        if (block == null)
        {
            block = new MaterialPropertyBlock();
            block.SetVectorArray(baseColorId, baseColors);
        }
        Graphics.DrawMeshInstanced(mesh,0,material,matrices,1023,block);
    }
}
```

我们在场景中创建一个空的 GameObject，然后挂上该脚本，设置球体 Mesh 和 Unlit 材质球，运行游戏即可。

![[Pasted image 20230619152758.png]]

**绘制 1023 个小球产生了 3 个 Draw Call。每个 Draw Call 的最大缓冲区大小不一样，因此需要几个 Draw Call 是根据不同机器不同平台来决定的**，单个网格的绘制顺序与我们提供数组数据的顺序相同。

## 2.2.6 动态合批

**动态批处理的原理是每一帧把可以进行批处理的模型<mark style="background: #FF5582A6;">网格进行合并</mark>，再把合并好的数据传递给 CPU，然后使用同一个材质进行渲染。** 好处是经过批处理的物体仍然可以移动，这是由于 Unity 每帧都会重新合并一次网格。

**动态批处理有很多限制**，比如在使用逐对象的材质属性时会失效，网格顶点属性规模要小于 900 等等，该技术适用于共享材质的小型的网格。

开启步骤：
1. 禁用 GPU 实例化，并在 `CameraRenderer.DrawVisibleGeometry` 中 `enableDynamicBatching` 设置为 `true` 。
```cs
var drawingSettings = new DrawingSettings(unlitShaderTagId, sortingSettings) 
{
    enableDynamicBatching = true,
    enableInstancing = false
};
```

同时禁用 SRP 批处理程序，因为它优先级比较高。
```cs
GraphicsSettings.useScriptableRenderPipelineBatching = false;
```

一般来说，GPU 实例化比动态批处理效果更好。**动态批处理也有一些注意事项**，例如，当涉及不同的尺度时，不能保证较大网格的法向量为单位长度。此外，绘制顺序也会更改，因为它现在是单个网格而不是多个网格。
还有静态批处理，它的工作原理类似，但对于标记为批处理静态的对象，它会提前完成。除了需要更多的内存和存储之外，它没有任何警告。RP 没有意识到这一点，所以我们不必担心。

## 2.2.7 配置批处理
1. 我们的渲染管线已经支持了三种批处理，将这些批处理的启用开关设置成可配置项，使用或禁用哪种批处理由用户指定，在`CameraRenderer.DrawVisibleGeometry()` 方法中作为参数传入。

```c
void DrawVisibleGeometry(bool useDynamicBatching, bool useGPUInstancing)
    {
        //设置绘制顺序和指定渲染相机
        var sortingSettings = new SortingSettings(camera)
        {
            criteria = SortingCriteria.CommonOpaque
        };
        //设置渲染的shader pass和渲染排序
        var drawingSettings = new DrawingSettings(unlitShaderTagId, sortingSettings)
        {
            //设置渲染时批处理的使用状态
            enableDynamicBatching = useDynamicBatching,
            enableInstancing = useGPUInstancing
        };
        ...
   }
```

2. 在 Render 方法中获取该配置的值。

```c
public void Render(ScriptableRenderContext context, Camera camera,  
        bool useDynamicBatching, bool useGPUInstancing)  
    {  
        ...  
   
        Setup();  
        //绘制几何体  
        DrawVisibleGeometry(useDynamicBatching, useGPUInstancing);  
        ...  
    }
```

3. 在 CustomRenderPipeline 脚本中定义 bool 字段跟踪批处理的启用情况，在构造函数中获得这些配置值，最后传递到 render.Render() 方法中。

```c
 bool useDynamicBatching, useGPUInstancing;
    //测试SRP合批启用
    public CustomRenderPipeline(bool useDynamicBatching, bool useGPUInstancing, bool useSRPBatcher)
    {
        //设置合批启用状态
        this.useDynamicBatching = useDynamicBatching;
        this.useGPUInstancing = useGPUInstancing;
        GraphicsSettings.useScriptableRenderPipelineBatching = useSRPBatcher;
    }
    protected override void Render(ScriptableRenderContext context, Camera[] cameras)
    {
        foreach (Camera camera in cameras)
        {
            renderer.Render(context, camera, useDynamicBatching, useGPUInstancing);
        }
    }
```

4. 最后在 CustomRenderPipelineAsset 脚本中定义这三个可配置的批处理开关，实例化 CustomRenderPipeline 时作为参数传入。

```c
//定义合批状态字段
    [SerializeField]
    bool useDynamicBatching = true, useGPUInstancing = true, useSRPBatcher = true;

     //重写抽象方法，需要返回一个RenderPipeline实例对象
    protected override RenderPipeline CreatePipeline()
    {
        return new CustomRenderPipeline(useDynamicBatching, useGPUInstancing, useSRPBatcher);
    }
```

![[Pasted image 20230619152812.png]]
我们禁用 GPU Instancing 和 SRP Batcher，来测试动态批处理的效果。切换批处理的开关会立即生效，因为 Unity 在检测到管线资产改变时会创建一个新的渲染管线实例。（注：下图测试动态批处理时用的 Cube 进行测试，小球 Mesh 太大不满足动态合批的要求）。

![[Pasted image 20230619152814.png]]
# 2.3 Alpha Blend 和 Alpha Test

目前我们的 Unlit.shader 只支持不透明材质，现在我们做些修改，让它可以切换成透明材质。

## 2.3.1 Blend Modes

为了进行混合，我们需要使用 Unity 的混合命令——Blend，这是 Unity 提供的设置混合模式的命令。想要实现半透明效果就需要把自身的颜色和已经存在于颜色缓冲中的颜色值进行混合，混合时使用的函数就是由该命令提供的。

Blend 命令的语义有好几种，我们使用最常用的一种：Blend SrcFactor DstFactor。它的语义描述是：

开启混合，并设置混合因子，源颜色（该片元产生的颜色）会乘以 SrcFactor，而目标颜色（已经存在于颜色缓冲的颜色）会乘以 DstFactor，然后把两者相加后再存入颜色缓冲中。

示例：float4 result = SrcFactor * fragment_output + DstFactor * pixel_color。

1. 我们在 Shader 的属性中添加这两个混合因子，默认源混合因子是 1，表示完全添加，目标混合因子是 0，表示完全忽略，这是标准的不透明混合模式。

```cs
Properties
      {
          _BaseColor("Color", Color) = (1.0, 1.0, 1.0, 1.0)
          //设置混合模式
          [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend ("Src Blend", Float) = 1
          [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend ("Dst Blend", Float) = 0
      }
```


![[Pasted image 20230619152846.png]]
2. 标准透明物体混合模式源混合因子为 SrcAlpha，所以混合等式为源颜色（该片元产生的颜色）的 RGB 乘上源颜色的 Alpha 值，目标混合因子为 OneMinusSrcAlpha，代表颜色缓冲中的颜色值乘以（1 - 源颜色的 Alpha 值） 。我们在 Pass 中使用 Blend 语句来定义混合模式，并在材质面板中设置标准透明物体的源和目标混合因子。

```
Pass
    {
        //定义混合模式
        Blend[_SrcBlend][_DstBlend]
        HLSLPROGRAM
```


![[Pasted image 20230619152849.png]]
3. 透明物体的渲染一般要关闭深度写入，不然得不到正确的结果。我们在属性栏中定义是否写入深度的属性，然后在 Pass 中通过 ZWrite 语句控制是否写入深度缓冲。最后我们可以调整下透明物体的渲染队列为 3000，让其在不透明物体和天空盒之后渲染。

```cs
 //设置混合模式
      [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend("Src Blend", Float) = 1
      [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend("Dst Blend", Float) = 0
      //默认写入深度缓冲区
      [Enum(Off, 0, On, 1)] _ZWrite("Z Write", Float) = 1
```

```cs
 Pass
      {
          //定义混合模式
          Blend[_SrcBlend][_DstBlend]
          //是否写入深度
          ZWrite[_ZWrite]
```


![[Pasted image 20230619152853.png]]
## 2.3.2 材质添加对纹理的支持

1. 我们的材质球目前还不支持使用纹理，现在添加这个功能，在属性栏声明一张纹理。

```cs
Properties
    {
        _BaseMap("Texture", 2D) = "white" {}
```

1. Unity 会自动将使用的纹理上传到 GPU 内存中，然后使用 `TEXTURE2D()` 宏定义一张 2D 纹理，并使用 `SAMPLER（sampler + 纹理名）` 这个宏为该纹理指定一个采样器。**纹理和采样器是着色器资源，必须在全局定义，不能放入缓冲区中**。
2. 除此之外**还需要获取纹理的平铺和偏移值**，这是通过定义一个 float4 类型的纹理名`_ST` 属性来获取的，该属性可以在 UnityPerMaterial 缓冲区中定义，设置给每个对象实例。

```cs
TEXTURE2D(_BaseMap);
SAMPLER(sampler_BaseMap);

 UNITY_INSTANCING_BUFFER_START(UnityPerMaterial)
//提供纹理的缩放和平移
UNITY_DEFINE_INSTANCED_PROP(float4, _BaseMap_ST)
UNITY_DEFINE_INSTANCED_PROP(float4, _BaseColor)
UNITY_INSTANCING_BUFFER_END(UnityPerMaterial)
```

3. 要采样纹理，我们还需要一套 UV 坐标，它应该被定义在顶点输入结构体中，纹理坐标要传到片元函数中进行采样，所以片元输入结构体也要定义 UV 坐标。

```cs
//用作顶点函数的输入参数
struct Attributes 
{
    float3 positionOS : POSITION;
    float2 baseUV : TEXCOORD0;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};
//用作片元函数的输入参数
struct Varyings 
{
    float4 positionCS : SV_POSITION;
    float2 baseUV : VAR_BASE_UV;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};
```

4. 在顶点函数中，传递纹理坐标之前把为纹理的缩放和偏移也计算在内。

```cs
//顶点函数
Varyings UnlitPassVertex(Attributes input) {
    ...
    //计算缩放和偏移后的UV坐标
    float4 baseST = UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _BaseMap_ST);
    output.baseUV = input.baseUV * baseST.xy + baseST.zw;
    return output;
}
```

5. 最后我们将片元函数通过 SAMPLE_TEXTURE2D 宏对纹理采样，采样结果和颜色值相乘得到最终表面颜色。

```cs
//片元函数
float4 UnlitPassFragment (Varyings input) : SV_TARGET 
{
    UNITY_SETUP_INSTANCE_ID(input);
    float4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.baseUV);
    // 通过UNITY_ACCESS_INSTANCED_PROP访问material属性
    float4 baseColor = UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _BaseColor);
    return baseMap * baseColor;
}
```


![[Pasted image 20230619152901.png]]
我们当前使用的纹理 RGB 颜色值为白色，但 Alpha 不同，所以颜色不受影响，但透明度每个物体各有不同。

## 2.3.3 透明度测试（Alpha Test）

1. 本节开头我们已经讲过了透明度测试的原理，只要一个片元的透明度不满足条件（通常是小于某个阈值），那么它对应的片元就会被舍弃，首先在属性栏中添加一个_Cutoff 属性作为舍弃像素的阈值。

```cs
Properties
      {
          _BaseMap("Texture", 2D) = "white" {}
          _BaseColor("Color", Color) = (1.0, 1.0, 1.0, 1.0)
           //透明度测试的阈值
          _Cutoff("Alpha Cutoff", Range(0.0, 1.0)) = 0.5
```

2. 在 UnityPerMaterial 缓冲区中定义该属性，随后在片元函数中使用 clip() 函数舍弃不满足阈值的片元，它会判断传参如果为负数，就会舍弃当前像素的输出颜色（该片元就会产生完全透明的效果）。

```cs
UNITY_DEFINE_INSTANCED_PROP(float4, _BaseColor)
UNITY_DEFINE_INSTANCED_PROP(float, _Cutoff)
```

```cs
float4 baseColor = UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _BaseColor);
float4 base = baseMap * baseColor;
//透明度低于阈值的片元进行舍弃
clip(base.a - UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _Cutoff));
return base;
```


![[Pasted image 20230619152951.png]]

材质通常使用透明度测试和透明度混合其中一个，而不是同时使用。透明度测试应使用在完全不透明的物体身上，除了被 clip 丢弃的片元外，其它片元会写入深度缓冲中。我们把混合模式设置成标准不透明物体的配置，然后开启深度写入，渲染队列设置为 AlphaTest。

![[Pasted image 20230619152953.png]]
## 2.3.4 Shader Feature

**使用 shader feature 可以让 Unity 根据不同的定义条件或关键字编译多次，生成多个着色器变体。然后通过外部代码或者材质面板上的开关来启用某个关键字，加载对应的着色器变种版本来执行某些特定功能，是项目开发中比较常用的一种手段**。
下面我们的目标是添加一个控制透明度测试功能是否启用的开关。

1. 首先添加一个控制着色器关键字的 Toggle 切换开关来控制是否启用透明度测试功能。

```cs
 //透明度测试的阈值
_Cutoff("Alpha Cutoff", Range(0.0, 1.0)) = 0.5
[Toggle(_CLIPPING)] _Clipping("Alpha Clipping", Float) = 0
```

2. **在 Pass 中使用 shader feature 声明一个 Toggle 开关对应的_CLIPPING 关键字。**

```cs
HLSLPROGRAM
  #pragma shader_feature _CLIPPING
  #pragma multi_compile_instancing
```

3. 然后在片元函数中通过判断该关键字是否被定义，来控制是否进行裁剪操作。

```cs
#if defined(_CLIPPING)
    
    clip(base.a - UNITY_ACCESS_INSTANCED_PROP(UnityPerMaterial, _Cutoff));
#endif
    return base;
```

接下来就可以在材质面板中将控制裁剪功能启用。


![[Pasted image 20230619152958.png]]
## 2.3.5 逐对象的裁剪

1. 我们在 PerObjectMaterialProperties.cs 脚本中也添加裁剪的属性，可以给每个对象设置不同的裁剪程度，和设置颜色属性时差不多。

```cs
static int baseColorId = Shader.PropertyToID("_BaseColor");
    static int cutoffId = Shader.PropertyToID("_Cutoff");

     static MaterialPropertyBlock block;

     [SerializeField]
    Color baseColor = Color.white;

     [SerializeField, Range(0f, 1f)]
    float cutoff = 0.5f;

     …

     void OnValidate () 
    {
        …
        block.SetColor(baseColorId, baseColor);
        block.SetFloat(cutoffId, cutoff);
        GetComponent<Renderer>().SetPropertyBlock(block);
    }
```

2. 在 MeshBall.cs 脚本绘制多个小球时也进行一些调整。首先我们让每个小球的旋转角度增加一个随机变化，**我们不设置每个小球的裁剪值，而是让每个小球的 Alpha 值在 $[0.5,1]$ 区间内进行随机，最后可以通过调整材质上的裁剪值来控制小球的裁剪。**

```cs
matrices[i] = Matrix4x4.TRS(Random.insideUnitSphere*10f, Quaternion.Euler
                (
                    Random.value * 360f, Random.value * 360f, Random.value * 360f
                ),
                Vector3.one * Random.Range(0.5f, 1.5f));
                baseColors[i] = new Vector4(Random.value,Random.value,Random.value,Random.Range(0.5f, 1f));
```

![[Pasted image 20230619153002.png]]