
---
title: HLSL语法
aliases: []
tags: []
create_time: 2023-04-25 23:15
uid: 202304252315
banner: "![[Pasted image 20230419181410.png]]"
banner_y: 0.4
---
# 1  数据类型

## 标量

常用标量类型如下：

<table><thead><tr><th>类型</th><th>描述</th></tr></thead><tbody><tr><td>bool</td><td>32 位整数值用于存放逻辑值 true 和 false</td></tr><tr><td>int</td><td>32 位有符号整数</td></tr><tr><td>uint</td><td>32 位无符号整数</td></tr><tr><td>half</td><td>16 位浮点数 (仅提供用于向后兼容)</td></tr><tr><td>float</td><td>32 位浮点数</td></tr><tr><td>double</td><td>64 位浮点数</td></tr></tbody></table>

注意：一些平台可能不支持`int`, `half`和`double`，如果出现这些情况将会使用`float`来模拟

此外，浮点数还有规格化的形式：

1.  `snorm float`是 IEEE 32 位有符号且规格化的浮点数，表示范围为 - 1 到 1
2.  `unorm float`是 IEEE 32 位无符号且规格化的浮点数，表示范围为 0 到 1

## 向量

向量类型可以支持 2 到 4 个同类元素

一种表示方式是使用类似模板的形式来描述

```c++
vector<float, 4> vec1;  // 向量vec1包含4个float元素
vector<int, 2> vec2;    // 向量vec2包含2个int元素
```

另一种方式则是直接在基本类型后面加上数字

```c++
float4 vec1;    // 向量vec1包含4个float元素
int3 vec2;      // 向量vec2包含3个int元素
```

当然，只使用`vector`本身则表示为一种包含 4 个 float 元素的类型

```c++
vector vec1;	// 向量vec1包含4个float元素
```

向量类型有如下初始化方式：

```c++
float2 vec0 = {0.0f, 1.0f};
float3 vec1 = float3(0.0f, 0.1f, 0.2f);
float4 vec2 = float4(vec1, 1.0f);
```

向量的第 1 到第 4 个元素既可以用 x, y, z, w 来表示，也可以用 r, g, b, a 来表示。除此之外，还可以用索引的方式来访问。下面展示了向量的取值和访问方式：

```c++
float4 vec0 = {1.0f, 2.0f, 3.0f, 0.0f};
float f0 = vec0.x;  // 1.0f
float f1 = vec0.g;  // 2.0f
float f2 = vec0[2]; // 3.0f
vec0.a = 4.0f;		// 4.0f
```

我们还可以使用`swizzles`的方式来进行赋值，可以一次性提供多个分量进行赋值操作，这些分量的名称可以重复出现：

```c++
float4 vec0 = {1.0f, 2.0f, 3.0f, 4.0f}; 
float3 vec1 = vec0.xyz;     // (1.0f, 2.0f, 3.0f)
float2 vec2 = vec0.rg;      // (1.0f, 2.0f)
float4 vec3 = vec0.zzxy;    // (3.0f, 3.0f, 1.0f, 2.0f)
vec3.wxyz = vec3;           // (3.0f, 1.0f, 2.0f, 3.0f)
vec3.yw = vec1.yy;           // (3.0f, 2.0f, 2.0f, 2.0f)
```

## 矩阵 (matrix)

矩阵有如下类型 (以`float`为例)：

```c++
float1x1 float1x2 float1x3 float1x4
float2x1 float2x2 float2x3 float2x4
float3x1 float3x2 float3x3 float3x4
float4x1 float4x2 float4x3 float4x4
```

此外，我们也可以使用类似模板的形式来描述：

```c++
matrix<float, 2, 2> mat1;	// float2x2
```

而单独的`matrix`类型的变量实际上可以看做是一个包含了 4 个`vector`向量的类型，即包含 16 个`float`类型的变量。`matrix`本身也可以写成`float4x4`：

```c++
matrix mat1;	// float4x4
```

矩阵的初始化方式如下：

```c++
float2x2 mat1 = {
	1.0f, 2.0f,	// 第一行
	3.0f, 4.0f  // 第二行
};
float3x3 TBN = float3x3(T, B, N); // T, B, N都是float3
```

矩阵的取值方式如下：

```c++
matrix M;
// ...

float f0 = M._m00;      // 第一行第一列元素(索引从0开始)
float f1 = M._12;       // 第一行第二列元素(索引从1开始)
float f2 = M[0][1];     // 第一行第二列元素(索引从0开始)
float2 f3 = M._11_12;   // Swizzles
```

矩阵的赋值方式如下：

```c++
matrix M;
vector v = {1.0f, 2.0f, 3.0f, 4.0f};
// ...

M[0] = v;               // 矩阵的第一行被赋值为向量v
M._m11 = v[0];          // 等价于M[1][1] = v[0];和M._22 = v[0];
M._12_21 = M._21_12;    // 交换M[0][1]和M[1][0]
```

无论是向量还是矩阵，乘法运算符都是用于对每个分量进行相乘，例如：

```c++
float4 vec0 = 2.0f * float4(1.0f, 2.0f, 3.0f, 4.0f);    //(2.0f, 4.0f, 6.0f, 8.0f)
float4 vec1 = vec0 * float4(1.0f, 0.2f, 0.1f, 0.0f);    //(2.0f, 0.8f, 0.6f, 0.0f)
```

若要进行向量与矩阵的乘法，则需要使用`mul`函数。

**在 C++ 代码层中，DirectXMath 数学库创建的矩阵都是行矩阵，但当矩阵从 C++ 传递给 HLSL 时，HLSL 默认是列矩阵的，看起来就好像传递的过程中进行了一次转置那样。**
如果希望不发生转置操作的话，可以添加修饰关键字`row_major`：

```c++
row_major matrix M; 
```

## 数组

和 C++ 一样，我们可以声明数组：

```c++
float M[4][4];
int p[4];
float3 v[12];	// 12个3D向量
```

## 结构体 (struct)

类似 C++ 中的结构体，区别在于不具有成员函数

```c++
struct A
{
    float4 vec;
};

struct B
{
    int scalar;
    float4 vec;
    float4x4 mat;
    float arr[8];
    A a;
};

// ...
B b;
b.vec = float4(1.0f, 2.0f, 3.0f, 4.0f);
```

## 变量的修饰符
下列关键字可以作为变量声明的修饰符。
1. `static`: 基本上与修饰符 extern 的作用相反，意即以 static 修饰的**着色器变量对于 C++
应用程序而言是不可见的。**

2. `uniform`: 对于经此修饰符标记的变量而言, 此值可以在 C++应用层改变, 但**在着色器执行 (处理顶点、像素）的过程中，其值始终保持不变**（其间可将其看作一种常量)。因此，**uniform 变量都是在着色器程序之外进行初始化的（例如，在 C++应用程序中得到初始化)。**
3. `extern`; 经此关键字修饰的变量会**暴露给 C++应用程序端 (即该变量可以被看色器之外的 C++应用代码访问到)。着色器程序中的全局变量被默认为既 uniform 且 extern。**
4. `const`: HLSL 中的 const 关键字与 C++中的意义相同。

5.  `shared`：如果变量以 shared 关键字为前缀，就提示效果框架：变量将在多个效果间被共享。仅全局变量可以以 shared 为前缀。  
6.  `volatile`：如果变量以 volatile 关键字为前缀，就提示效果框架：变量将时常被修改。仅全局变量可以以 volatile 为前缀  
## 类型转换

HLSL 有着极其灵活的类型转换机制。HLSL 中的类型转换语法和 C/C++ 的相同。下面是一些例子：

```c++
float f = 4.0f;
float4x4 m = (float4x4)f;	// 将浮点数f复制到矩阵m的每一个元素当中

float3 n = float3(...);
float3 v = 2.0f * n - 1.0f;	// 这里1.0f将会隐式转换成(1.0f, 1.0f, 1.0f)

float4x4 WInvT = float4x4(...);
float3x3 mat = (float3x3)WInvT;	// 只取4x4矩阵的前3行前3列
```

## typedef 关键字

和 C++ 一样，typedef 关键字用来声明一个类型的别称：

```c++
typedef float3 point;			
typedef const float cfloat;

point p;	// p为float3
cfloat f = 1.0f;	// f为const float
```


# 2 关键字与运算符
## 关键字
![[Pasted image 20230418160234.png]]
![[Pasted image 20230418160249.png]]
## 运算符
![[Pasted image 20230418160317.png]]
和 C++的差异：
1. 取模运算符 `%` 既可以用于整数也可以用于浮点数，必须保证左右操作数有相同的符号。
2. 向量的自增运算就是每个向量加 1
3. `*` 为向量的分量式乘法，若需要进行矩阵乘法运算，使用 `mul` 函数
4. 比较运算符 `==` 按分量一一对比，返回多维结果
5. 对于二维运算来说，如果所有操作数维度不同，则低维度自动提升为高维度。如果类型不同，低精度自动提升为高精度。比如 x 为 half，y 为 int，若计算 x+y，则 y 被提升为 half。

# 3 控制流

## 条件语句

HLSL 也支持`if`, `else`, `continue`, `break`, `switch`关键字，此外`discard`关键字用于像素着色阶段抛弃该像素。

条件的判断使用一个布尔值进行，通常由各种逻辑运算符或者比较运算符操作得到。注意向量之间的比较或者逻辑操作是得到一个存有布尔值的向量，不能够直接用于条件判断，也不能用于`switch`语句。

### 判断与动态分支

基于值的条件分支只有在程序执行的时候被编译好的着色器汇编成两种方式：**判断 (predication)** 和**动态分支 (dynamic branching)**。

如果使用的是判断的形式，编译器会提前计算两个不同分支下表达式的值。然后使用比较指令来基于比较结果来 "选择" 正确的值。

而动态分支使用的是跳转指令来避免一些非必要的计算和内存访问。

着色器程序在同时执行的时候应当选择相同的分支，以防止硬件在分支的两边执行。通常情况下，硬件会同时将一系列连续的顶点数据传入到顶点着色器并行计算，或者是一系列连续的像素单元传入到像素着色器同时运算等。

动态分支会由于执行分支指令所带来的开销而导致一定的性能损失，因此要权衡动态分支的开销和可以跳过的指令数目。

通常情况下编译器会自行选择使用判断还是动态分支，但我们可以通过重写某些属性来修改编译器的行为。我们可以在条件语句前可以选择添加下面两个属性之一：

<table><thead><tr><th>属性</th><th>描述</th></tr></thead><tbody><tr><td>[branch]</td><td>根据条件值的结果，只计算其中一边的内容，会产生跳转指令。默认不加属性的条件语句为 branch 型。</td></tr><tr><td>[flatten]</td><td>两边的分支内容都会计算，然后根据条件值选择其中一边。可以避免跳转指令的产生。</td></tr></tbody></table>

用法如下：

```c++
[flatten]
if (x)
{
    x = sqrt(x);
}
```

## 循环语句

HLSL 也支持`for`, `while`和`do while`循环。和条件语句一样，它可能也会在基于运行时的条件值判断而产生动态分支，从而影响程序性能。如果循环次数较小，我们可以使用属性`[unroll]`来展开循环，代价是产生更多的汇编指令。用法如下：

```c++
times = 4;
sum = times;
[unroll]
while (times--)
{
    sum += times;
}
```

若没有添加属性，默认使用的则为`[loop]`。


# 4  函数
HLSL 中的函数具有以下属性。
1. 函数采用类 C++语法。
2. 参数只能按值传递，没有引用和指针。
3. 不支持递归。
4. 只有内联函数 inline（避免产生调用的跳转来减小开销）。

此外，HLSL 函数的形参可以指定输入 / 输出类别：

<table><thead><tr><th>输入输出类别</th><th>描述</th></tr></thead><tbody><tr><td>in</td><td>仅读入。实参的值将会复制到形参上。若未指定则默认为 in</td></tr><tr><td>out</td><td>仅输出。对形参修改的最终结果将会复制到实参上</td></tr><tr><td>inout</td><td>即 in 和 out 的组合</td></tr></tbody></table>

例如：

```c++
bool foo (in const bool b, // 输入的bool类型参数
          out int r1,      // 输出的int类型参数
          inout float r2)  // 同时兼具输入/输出属性的float类型参数
{
    if( b )   // 测试输入值
    {
        r1 = 5;   // 通过r1输出一个值
    }
    else
        r1 = 1;   // 通过r1输出一个值
    }
    // 因为r2的类型为inout，所以既可把它作为输入值，也能通过它来输出值
    r2 = r2 * r2 * r2 ;
    
    return true;
}
```
除了 `in`、 `out` 与 `inout` 关键字以外，HLSL 中函数的语法基本与 C++中的函数相一致。

1. `in`: 在目标函数执行之前, 此修饰符所指定的参数应从调用此函数的程序中复制有输入的数据。我们其实不必显式地为参数指定此修饰符，**在默认的情况下参数都为 in 类型**。
2. `out`: 在目标函数返回时，此修饰符所指定的参数应当已经复制了该函数中的最后计算结果。借此即可方便地返回数值。关键字 out 的存在是很有必要的，因为 **HLSL 既不允许按引用的方式传递数据，也不允许使用指针**。需要注意的是，如果一个参数被标记为 out, 那么此参数在目标函数执行之前不能被复制任何值。换言之，out 参数只能用于输出数据而不能用于输入数据。
3. `inout`: 此修饰符表示参数兼有 in 与 out 的属性。如果希望某个参数既可输入又可输出就可用 inout。
## 内置函数

HLSL 提供了一些内置全局函数，它通常直接映射到指定的着色器汇编指令集。这里只列出一些比较常用的函数：

<table><thead><tr><th>函数名</th><th>描述</th><th>最小支持着色器模型</th></tr></thead><tbody><tr><td>abs</td><td>每个分量求绝对值</td><td>1.1</td></tr><tr><td>acos</td><td>求 x 分量的反余弦值</td><td>1.1</td></tr><tr><td>all</td><td>测试 x 分量是否按位全为 1</td><td>1.1</td></tr><tr><td>any</td><td>测试 x 分量是否按位存在 1</td><td>1.1</td></tr><tr><td>asdouble</td><td>将值按位重新解释成 double 类型</td><td>5.0</td></tr><tr><td>asfloat</td><td>将值按位重新解释成 float 类型</td><td>4.0</td></tr><tr><td>asin</td><td>求 x 分量的反正弦值</td><td>1.1</td></tr><tr><td>asint</td><td>将值按位重新解释成 int 类型</td><td>4.0</td></tr><tr><td>asuint</td><td>将值按位重新解释成 uint 类型</td><td>4.0</td></tr><tr><td>atan</td><td>求 x 分量的反正切值值</td><td>1.1</td></tr><tr><td>atan2</td><td>求 (x,y) 分量的反正切值</td><td>1.1</td></tr><tr><td>ceil</td><td>求不小于 x 分量的最小整数</td><td>1.1</td></tr><tr><td>clamp</td><td>将 x 分量的值限定在 [min, max]</td><td>1.1</td></tr><tr><td>clip</td><td>丢弃当前像素，如果 x 分量的值小于 0</td><td>1.1</td></tr><tr><td>cos</td><td>求 x 分量的余弦值</td><td>1.1</td></tr><tr><td>cosh</td><td>求 x 分量的双曲余弦值</td><td>1.1</td></tr><tr><td>countbits</td><td>计算输入整数的位 1 个数 (对每个分量)</td><td>5.0</td></tr><tr><td>cross</td><td>计算两个 3D 向量的叉乘</td><td>1.1</td></tr><tr><td>ddx</td><td>估算屏幕空间中的偏导数<span class="math inline"><span class="MathJax_Preview" style="color: inherit;"></span><span class="MathJax" id="MathJax-Element-1-Frame" tabindex="0" style="position: relative;" data-mathml="<math xmlns=&quot;http://www.w3.org/1998/Math/MathML&quot;><mi mathvariant=&quot;normal&quot;>&amp;#x2202;</mi><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mi mathvariant=&quot;bold&quot;>p</mi></mrow><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mo>/</mo></mrow><mi mathvariant=&quot;normal&quot;>&amp;#x2202;</mi><mi>x</mi></math>" role="presentation"><nobr aria-hidden="true"><span class="math" id="MathJax-Span-1" style="width: 3.66em; display: inline-block;"><span style="display: inline-block; position: relative; width: 2.917em; height: 0px; font-size: 125%;"><span style="position: absolute; clip: rect(1.374em, 1002.86em, 2.689em, -999.997em); top: -2.283em; left: 0em;"><span class="mrow" id="MathJax-Span-2"><span class="mi" id="MathJax-Span-3" style="font-family: MathJax_Main;">∂<span style="display: inline-block; overflow: hidden; height: 1px; width: 0.06em;"></span></span><span class="texatom" id="MathJax-Span-4"><span class="mrow" id="MathJax-Span-5"><span class="mi" id="MathJax-Span-6" style="font-family: MathJax_Main-bold;">p</span></span></span><span class="texatom" id="MathJax-Span-7"><span class="mrow" id="MathJax-Span-8"><span class="mo" id="MathJax-Span-9" style="font-family: MathJax_Main;">/</span></span></span><span class="mi" id="MathJax-Span-10" style="font-family: MathJax_Main;">∂<span style="display: inline-block; overflow: hidden; height: 1px; width: 0.06em;"></span></span><span class="mi" id="MathJax-Span-11" style="font-family: MathJax_Math-italic;">x</span></span><span style="display: inline-block; width: 0px; height: 2.289em;"></span></span></span><span style="display: inline-block; overflow: hidden; vertical-align: -0.354em; border-left: 0px solid; width: 0px; height: 1.432em;"></span></span></nobr><span class="MJX_Assistive_MathML" role="presentation"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi mathvariant="normal">∂</mi><mrow class="MJX-TeXAtom-ORD"><mi mathvariant="bold">p</mi></mrow><mrow class="MJX-TeXAtom-ORD"><mo>/</mo></mrow><mi mathvariant="normal">∂</mi><mi>x</mi></math></span></span><script type="math/tex" id="MathJax-Element-1">\partial \mathbf{p} / \partial x</script></span>。这使我们可以确定在屏幕空间的 x 轴方向上，相邻像素间某属性值<span class="math inline"><span class="MathJax_Preview" style="color: inherit;"></span><span class="MathJax" id="MathJax-Element-2-Frame" tabindex="0" style="position: relative;" data-mathml="<math xmlns=&quot;http://www.w3.org/1998/Math/MathML&quot;><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mi mathvariant=&quot;bold&quot;>p</mi></mrow></math>" role="presentation"><nobr aria-hidden="true"><span class="math" id="MathJax-Span-12" style="width: 0.803em; display: inline-block;"><span style="display: inline-block; position: relative; width: 0.631em; height: 0px; font-size: 125%;"><span style="position: absolute; clip: rect(1.66em, 1000.57em, 2.631em, -999.997em); top: -2.283em; left: 0em;"><span class="mrow" id="MathJax-Span-13"><span class="texatom" id="MathJax-Span-14"><span class="mrow" id="MathJax-Span-15"><span class="mi" id="MathJax-Span-16" style="font-family: MathJax_Main-bold;"> p</span></span></span></span><span style="display: inline-block; width: 0px; height: 2.289em;"></span></span></span><span style="display: inline-block; overflow: hidden; vertical-align: -0.282em; border-left: 0px solid; width: 0px; height: 0.932em;"></span></span></nobr><span class="MJX_Assistive_MathML" role="presentation"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow class="MJX-TeXAtom-ORD"><mi mathvariant="bold">p</mi></mrow></math></span></span><script type="math/tex" id="MathJax-Element-2">\mathbf{p}</script></span>的变化量</td><td>2.1</td></tr><tr><td>ddy</td><td>估算屏幕空间中的偏导数<span class="math inline"><span class="MathJax_Preview" style="color: inherit;"></span><span class="MathJax" id="MathJax-Element-3-Frame" tabindex="0" style="position: relative;" data-mathml="<math xmlns=&quot;http://www.w3.org/1998/Math/MathML&quot;><mi mathvariant=&quot;normal&quot;>&amp;#x2202;</mi><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mi mathvariant=&quot;bold&quot;>p</mi></mrow><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mo>/</mo></mrow><mi mathvariant=&quot;normal&quot;>&amp;#x2202;</mi><mi>y</mi></math>" role="presentation"><nobr aria-hidden="true"><span class="math" id="MathJax-Span-17" style="width: 3.546em; display: inline-block;"><span style="display: inline-block; position: relative; width: 2.803em; height: 0px; font-size: 125%;"><span style="position: absolute; clip: rect(1.374em, 1002.8em, 2.689em, -999.997em); top: -2.283em; left: 0em;"><span class="mrow" id="MathJax-Span-18"><span class="mi" id="MathJax-Span-19" style="font-family: MathJax_Main;">∂<span style="display: inline-block; overflow: hidden; height: 1px; width: 0.06em;"></span></span><span class="texatom" id="MathJax-Span-20"><span class="mrow" id="MathJax-Span-21"><span class="mi" id="MathJax-Span-22" style="font-family: MathJax_Main-bold;">p</span></span></span><span class="texatom" id="MathJax-Span-23"><span class="mrow" id="MathJax-Span-24"><span class="mo" id="MathJax-Span-25" style="font-family: MathJax_Main;">/</span></span></span><span class="mi" id="MathJax-Span-26" style="font-family: MathJax_Main;">∂<span style="display: inline-block; overflow: hidden; height: 1px; width: 0.06em;"></span></span><span class="mi" id="MathJax-Span-27" style="font-family: MathJax_Math-italic;">y<span style="display: inline-block; overflow: hidden; height: 1px; width: 0.003em;"></span></span></span><span style="display: inline-block; width: 0px; height: 2.289em;"></span></span></span><span style="display: inline-block; overflow: hidden; vertical-align: -0.354em; border-left: 0px solid; width: 0px; height: 1.432em;"></span></span></nobr><span class="MJX_Assistive_MathML" role="presentation"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi mathvariant="normal">∂</mi><mrow class="MJX-TeXAtom-ORD"><mi mathvariant="bold">p</mi></mrow><mrow class="MJX-TeXAtom-ORD"><mo>/</mo></mrow><mi mathvariant="normal">∂</mi><mi>y</mi></math></span></span><script type="math/tex" id="MathJax-Element-3">\partial \mathbf{p} / \partial y</script></span>。这使我们可以确定在屏幕空间的 y 轴方向上，相邻像素间某属性值<span class="math inline"><span class="MathJax_Preview" style="color: inherit;"></span><span class="MathJax" id="MathJax-Element-4-Frame" tabindex="0" style="position: relative;" data-mathml="<math xmlns=&quot;http://www.w3.org/1998/Math/MathML&quot;><mrow class=&quot;MJX-TeXAtom-ORD&quot;><mi mathvariant=&quot;bold&quot;>p</mi></mrow></math>" role="presentation"><nobr aria-hidden="true"><span class="math" id="MathJax-Span-28" style="width: 0.803em; display: inline-block;"><span style="display: inline-block; position: relative; width: 0.631em; height: 0px; font-size: 125%;"><span style="position: absolute; clip: rect(1.66em, 1000.57em, 2.631em, -999.997em); top: -2.283em; left: 0em;"><span class="mrow" id="MathJax-Span-29"><span class="texatom" id="MathJax-Span-30"><span class="mrow" id="MathJax-Span-31"><span class="mi" id="MathJax-Span-32" style="font-family: MathJax_Main-bold;"> p</span></span></span></span><span style="display: inline-block; width: 0px; height: 2.289em;"></span></span></span><span style="display: inline-block; overflow: hidden; vertical-align: -0.282em; border-left: 0px solid; width: 0px; height: 0.932em;"></span></span></nobr><span class="MJX_Assistive_MathML" role="presentation"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow class="MJX-TeXAtom-ORD"><mi mathvariant="bold">p</mi></mrow></math></span></span><script type="math/tex" id="MathJax-Element-4">\mathbf{p}</script></span>的变化量</td><td>2.1</td></tr><tr><td>degrees</td><td>将 x 分量从弧度转换为角度制</td><td>1.1</td></tr><tr><td>determinant</td><td>返回方阵的行列式</td><td>1.1</td></tr><tr><td>distance</td><td>返回两个点的距离值</td><td>1.1</td></tr><tr><td>dot</td><td>返回两个向量的点乘</td><td>1.1</td></tr><tr><td>dst</td><td>计算距离向量</td><td>5.0</td></tr><tr><td>exp</td><td>计算 e^x</td><td>1.1</td></tr><tr><td>exp2</td><td>计算 2^x</td><td>1.1</td></tr><tr><td>floor</td><td>求不大于 x 分量的最大整数</td><td>1.1</td></tr><tr><td>fmod</td><td>求 x/y 的余数</td><td>1.1</td></tr><tr><td>frac</td><td>返回 x 分量的小数部分</td><td>1.1</td></tr><tr><td>isfinite</td><td>返回 x 分量是否为有限的布尔值</td><td>1.1</td></tr><tr><td>isinf</td><td>返回 x 分量是否为无穷大的布尔值</td><td>1.1</td></tr><tr><td>isnan</td><td>返回 x 分量是否为 nan 的布尔值</td><td>1.1</td></tr><tr><td>length</td><td>计算向量的长度</td><td>1.1</td></tr><tr><td>lerp</td><td>求 x + s(y - x)</td><td>1.1</td></tr><tr><td>lit</td><td>返回一个光照系数向量 (环境光亮度, 漫反射光亮度, 镜面光亮度, 1.0f)</td><td>1.1</td></tr><tr><td>log</td><td>返回以 e 为底，x 分量的对数</td><td>1.1</td></tr><tr><td>log10</td><td>返回以 10 为底，x 分量的对数</td><td>1.1</td></tr><tr><td>log2</td><td>返回以 2 为底，x 分量的自然对数</td><td>1.1</td></tr><tr><td>mad</td><td>返回 mvalue * avalue + bvalue</td><td>1.1</td></tr><tr><td>max</td><td>返回 x 分量和 y 分量的最大值</td><td>1.1</td></tr><tr><td>min</td><td>返回 x 分量和 y 分量的最小值</td><td>1.1</td></tr><tr><td>modf</td><td>将值 x 分开成整数部分和小数部分</td><td>1.1</td></tr><tr><td>mul</td><td>矩阵乘法运算</td><td>1</td></tr><tr><td>normalize</td><td>计算规格化的向量</td><td>1.1</td></tr><tr><td>pow</td><td>返回 x^y</td><td>1.1</td></tr><tr><td>radians</td><td>将 x 分量从角度值转换成弧度值</td><td>1</td></tr><tr><td>rcp</td><td>对每个分量求倒数</td><td>5</td></tr><tr><td>reflect</td><td>返回反射向量</td><td>1</td></tr><tr><td>refract</td><td>返回折射向量</td><td>1.1</td></tr><tr><td>reversebits</td><td>对每个分量进行位的倒置</td><td>5</td></tr><tr><td>round</td><td>x 分量进行四舍五入</td><td>1.1</td></tr><tr><td>rsqrt</td><td>返回 1/sqrt(x)</td><td>1.1</td></tr><tr><td>saturate</td><td>对 x 分量限制在 [0,1] 范围</td><td>1</td></tr><tr><td>sign</td><td>计算符号函数的值，x 大于 0 为 1，x 小于 0 为 - 1，x 等于 0 则为 0</td><td>1.1</td></tr><tr><td>sin</td><td>计算 x 的正弦</td><td>1.1</td></tr><tr><td>sincos</td><td>返回 x 的正弦和余弦</td><td>1.1</td></tr><tr><td>sinh</td><td>返回 x 的双曲正弦</td><td>1.1</td></tr><tr><td>smoothstep</td><td>给定范围 [min, max]，映射到值 [0, 1]。小于 min 的值取 0，大于 max 的值取 1</td><td>1.1</td></tr><tr><td>step</td><td>返回 (x&gt;= a) ? 1 : 0</td><td>1.1</td></tr><tr><td>tan</td><td>返回 x 的正切值</td><td>1.1</td></tr><tr><td>tanh</td><td>返回 x 的双曲正切值</td><td>1.1</td></tr><tr><td>transpose</td><td>返回矩阵 m 的转置</td><td>1</td></tr><tr><td>trunc</td><td>去掉 x 的小数部分并返回</td><td>1</td></tr></tbody></table>

## 常量缓冲区的封装规则
在 HLSL 中，常量缓冲区会以补齐填充 (padding) 的方式，将其中的元素都包装为 4D 向量，但**一个单独的元素却不能被分开并横跨两个 4D 向量**。
必须按照 HLSL 的封装规则来定义 C++结构体，以使其中的数据元素可正确赋值给 HLSL 中的常量。
```c++
// 显式填充，定义常量缓冲区
cbuffer cb : register(b0)
{
    float3 Pos;
    float _pad0;
    float3 Dir;
    float _pad1;
};

// 定义C++结构体，必须和常量缓冲区匹配
struct Data
{
    XMFLOAT3 Pos;
    float _pad0;
    XMFLOAT3 Dir;
    float _pad1;
};


// 调用memcpy函数，数据呗正确复制到常量缓冲区
vector l:(Pos.x, Pos.y, Pos.z, pad0)
vector 2:( Dir.x,Dir.y, Dir.z, pad1)
```

当然，这种填充规则比较浪费空间，可以采用更紧凑的方式。但这种填充规则更加容易管理。

数组的处理方式与上文所述不同。根据 SDK 文档可知，“**数组中的每个元素都会被存于一个具有 4 个分量的向量之中**”。请看下面的示例，如果我们有一个类型为 float2 的数组:
```
float2 TexOffsets [8 ] ;
```

根据前文中的封装规则，我们可能会认为每两个元素会被包装到一个 float4 类型的槽位之中。但是，数组却是个例外，上述数组实际相当于:
```
float4 Texoffsets [ 8 ] ;
```

因此, 为了令程序能按预期正常工作, 我们需要在 C++代码中设置一个具有 8 个 XMFLOAT4 元素的数组，而不是由 8 个 XMFLOAT2 元素所构成的数组。显而易见的是，每个元素都浪费了两个 float 类型的存储空间，毕竟我们其实只需要一个 float2 类型的数组。
对此，SDK 文档指出，我们**可以通过强制类型转换以及额外的地址计算指令来更有效地利用内存:**
```
float4 array [ 4 ] ;
static float2 aggressivePackArray [8] =(float2[8]) array;
```


# 5 语义

语义通常是附加在着色器输入 / 输出参数上的字符串。它在着色器程序的用途如下：

1.  用于描述传递给着色器程序的变量参数的含义
2.  允许着色器程序接受由渲染管线生成的特殊系统值
3.  允许着色器程序传递由渲染管线解释的特殊系统值

## 顶点着色器语义

<table><thead><tr><th>输入</th><th>描述</th><th>类型</th></tr></thead><tbody><tr><td>BINORMAL[n]</td><td>副法线（副切线）向量</td><td>float4</td></tr><tr><td>BLENDINDICES[n]</td><td>混合索引</td><td>uint</td></tr><tr><td>BLENDWEIGHT[n]</td><td>混合权重</td><td>float</td></tr><tr><td>COLOR[n]</td><td>漫反射 / 镜面反射颜色</td><td>float4</td></tr><tr><td>NORMAL[n]</td><td>法向量</td><td>float4</td></tr><tr><td>POSITION[n]</td><td>物体坐标系下的顶点坐标</td><td>float4</td></tr><tr><td>POSITIONT</td><td>变换后的顶点坐标</td><td>float4</td></tr><tr><td>PSIZE[n]</td><td>点的大小</td><td>float</td></tr><tr><td>TANGENT[n]</td><td>切线向量</td><td>float4</td></tr><tr><td>TEXCOORD[n]</td><td>纹理坐标</td><td>float4</td></tr><tr><td>Output</td><td>仅描述输出</td><td>Type</td></tr><tr><td>FOG</td><td>顶点雾</td><td>float</td></tr></tbody></table>

n 是一个可选的整数，从 0 开始。比如 POSITION0, TEXCOORD1 等等。

## 像素着色器语义

<table><thead><tr><th>输入</th><th>描述</th><th>类型</th></tr></thead><tbody><tr><td>COLOR[n]</td><td>漫反射 / 镜面反射颜色</td><td>float4</td></tr><tr><td>TEXCOORD[n]</td><td>纹理坐标</td><td>float4</td></tr><tr><td>Output</td><td>仅描述输出</td><td>Type</td></tr><tr><td>DEPTH[n]</td><td>深度值</td><td>float</td></tr></tbody></table>

## 系统值语义

所有的系统值都包含前缀`SV_`。这些系统值将用于某些着色器的特定用途（并未全部列出）

<table><thead><tr><th>系统值</th><th>描述</th><th>类型</th></tr></thead><tbody><tr><td>SV_Depth</td><td>深度缓冲区数据，可以被任何着色器写入 / 读取</td><td>float</td></tr><tr><td>SV_InstanceID</td><td>每个实例都会在运行期间自动生成一个 ID。在任何着色器阶段都能读取</td><td>uint</td></tr><tr><td>SV_IsFrontFace</td><td>指定该三角形是否为正面。可以被几何着色器写入，以及可以被像素着色器读取</td><td>bool</td></tr><tr><td>SV_Position</td><td>若被声明用于输入到着色器，它描述的是像素位置，在所有着色器中都可用，可能会有 0.5 的偏移值</td><td>float4</td></tr><tr><td>SV_PrimitiveID</td><td>每个原始拓扑都会在运行期间自动生成一个 ID。可用在几何 / 像素着色器中写入，也可以在像素 / 几何 / 外壳 / 域着色器中读取</td><td>uint</td></tr><tr><td>SV_StencilRef</td><td>代表当前像素着色器的模板引用值。只可以被像素着色器写入</td><td>uint</td></tr><tr><td>SV_VertexID</td><td>每个实例都会在运行期间自动生成一个 ID。仅允许作为顶点着色器的输入</td><td>uint</td></tr></tbody></table>


# 6 通用着色器的核心

所有的可编程着色器阶段使用通用着色器核心来实现相同的基础功能。此外，顶点着色阶段、几何着色阶段和像素着色阶段则提供了独特的功能，例如几何着色阶段可以生成新的图元或删减图元，像素着色阶段可以决定当前像素是否被抛弃等。下图展示了数据是怎么流向一个着色阶段，以及通用着色器核心与着色器内存资源之间的关系：

![](1681895866782.png)

**Input Data**：顶点着色器从输入装配阶段获取数据；几何着色器则从上一个着色阶段的输出获取等等。通过给形参引入可以使用的系统值可以提供额外的输入

**Output Data**：着色器生成输出的结果然后传递给管线的下一个阶段。有些输出会被通用着色器核心解释成特定用途（如顶点位置、渲染目标对应位置的值），另外一些输出则由应用程序来解释。

**Shader Code**：着色器代码可以从内存读取，然后用于执行代码中所期望的内容。

**Samplers**：采样器决定了如何对纹理进行采样和滤波。

**Textures**：纹理可以使用采样器进行采样，也可以基于索引的方式按像素读取。

**Buffers**：缓冲区可以使用读取相关的内置函数，在内存中按元素直接读取。

**Constant Buffers**：常量缓冲区对常量值的读取有所优化。他们被设计用于 CPU 对这些数据的频繁更新，因此他们有额外的大小、布局和访问限制。


# 7 着色器常量

着色器常量存在内存中的一个或多个缓冲区资源当中。他们可以被组织成两种类型的缓冲区：常量缓冲区（cbuffers）和纹理缓冲区（tbuffers）。关于纹理缓冲区，我们不在这讨论。

## 常量缓冲区 (Constant Buffer)

常量缓冲区允许 C++ 端将数据传递给 HLSL 中使用，在 HLSL 端，这些传递过来的数据不可更改，因而是常量。常量缓冲区对这种使用方式有所优化，表现为低延迟的访问和允许来自 CPU 的频繁更新，因此他们有额外的大小、布局和访问限制。

声明方式如下：

```c++
cbuffer VSConstants
{
    float4x4 g_WorldViewProj;
    fioat3 g_Color;
    uint g_EnableFog;
    float2 g_ViewportXY;
    float2 g_ViewportWH;
}
```

由于我们写的是原生 HLSL，当我们在 HLSL 中声明常量缓冲区时，还**需要在 HLSL 的声明中使用关键字`register`手动指定对应的寄存器索引**，然后编译器会为对应的着色器阶段自动将其映射到 15 个常量缓冲寄存器的其中一个位置。这些寄存器的名字为`b0`到`b14`：

```c++
cbuffer VSConstants : register(b0)
{
    float4x4 g_WorldViewProj;
    fioat3 g_Color;
    uint g_EnableFog;
    float2 g_ViewportXY;
    float2 g_ViewportWH;
}
```

在 C++ 端是通过`ID3D11DeviceContext::*SSetConstantBuffers`指定特定的槽 (slot) 来给某一着色器阶段对应的寄存器索引提供常量缓冲区的数据。

如果是存在多个不同的着色器阶段使用同一个常量缓冲区，那就需要分别给这两个着色器阶段设置好相同的数据。

综合前面几节内容，下面演示了顶点着色器和常量缓冲区的用法：

```c++
cbuffer ConstantBuffer : register(b0)
{
    float4x4 g_WorldViewProj;
}

void VS_Main(
    in float4 inPos : POSITION,         // 绑定变量到输入装配器
    in uint VID : SV_VertexID,          // 绑定变量到系统生成值
    out float4 outPos : SV_Position)    // 告诉管线将该值解释为输出的顶点位置
{
    outPos = mul(inPos, g_WorldViewProj);
}
```

上面的代码也可以写成：

```c++
cbuffer ConstantBuffer : register(b0)
{
    float4x4 g_WorldViewProj;
}

struct VertexIn
{
	float4 inPos : POSITION;	// 源自输入装配器
	uint VID : SV_VertexID;		// 源自系统生成值
};

float4 VS_Main(VertexIn vIn) : SV_Position
{
    return mul(vIn.inPos, g_WorldViewProj);
}
```



# 8 矩阵的内存布局和 mul 函数

说实话，我感觉这是一个大坑，不知道为什么要设计成这样混乱的形式。

在我用的时候，以`row_major`矩阵，并且 mul 函数以向量左乘矩阵的形式来绘制时的确能够正常显示，并不会有什么感觉。但是也有人会遇到明明传的矩阵没有问题，却怎么样都绘制不出的情况；或者使用一遍矩阵，在 mul 函数用向量左乘的形式却又可以绘制出来的疑问。因此本文目的就是要扫清这些障碍。

## 行主序矩阵与列主序矩阵

首先要了解的是，对于连续内存数据：

$$m_{11} \; m_{12} \; m_{13} \; m_{14} \; m_{21} \; m_{22} \; m_{23} \; m_{24} \; m_{31} \; m_{32} \; m_{33} \; m_{34} \; m_{41} \; m_{42} \; m_{43} \; m_{44}$$

**行主序矩阵**是这样解释数据的：

$$\mathbf{M}=\begin{bmatrix} m_{11} & m_{12} & m_{13} & m_{14} \\m_{21} & m_{22} & m_{23} & m_{24} \\m_{31} & m_{32} & m_{33} & m_{34}\\m_{41} & m_{42} & m_{43} & m_{44}\end{bmatrix}$$

而**列主序矩阵**是这样解释数据的：

$$\mathbf{M}=\begin{bmatrix} m_{11} & m_{21} & m_{31} & m_{41} \\m_{12} & m_{22} & m_{32} & m_{42} \\m_{13} & m_{23} & m_{33} & m_{43}\\m_{14} & m_{24} & m_{34} & m_{44} \end{bmatrix}$$

显然，**行主序矩阵**经过一次**转置**后就会变成**列主序矩阵**

## C++ 和 HLSL 中矩阵的内存布局

在 C++ 的 DirectXMath 中，无论是`XMFLOAT4X4`，还是使用函数生成的`XMMATRIX`，都是采用**行主序矩阵**的解释方式。它的数据流如下：

$$m_{11} \; m_{12} \; m_{13} \; m_{14} \; m_{21} \; m_{22} \; m_{23} \; m_{24} \; m_{31} \; m_{32} \; m_{33} \; m_{34} \; m_{41} \; m_{42} \; m_{43} \; m_{44}$$

上述数据流传递到 HLSL 后，若是传递给 cb0 的寄存器的前 4 个向量，那么它内存布局一定如下：

```c++
cb0[0].xyzw = (m11, m12, m13, m14);
cb0[1].xyzw = (m21, m22, m23, m24);
cb0[2].xyzw = (m31, m32, m33, m34);
cb0[3].xyzw = (m41, m42, m43, m44);
```

而在 HLSL 中，默认的`matrix`或`float4x4`采用的是**列主序矩阵**的解释形式。

假设在 HLSL 的`cbuffer`为：

```c++
cbuffer cb : register(b0)
{
    (row_major) matrix g_World;
}
```

如果`g_World`是`matrix`或`float4x4`类型，由于是**列主序矩阵**，上面的 4 个寄存器存储的数据会被看作：

$$\begin{bmatrix} m_{11} & m_{21} & m_{31} & m_{41} \\ m_{12} & m_{22} & m_{32} & m_{42} \\ m_{13} & m_{23} & m_{33} & m_{43} \\ m_{14} & m_{24} & m_{34} & m_{44} \\ \end{bmatrix}$$

而如果`g_World`是`row_major matrix`或`row_major float4x4`类型，则为**行主序矩阵**，上面的 4 个寄存器存储的数据则依然被视作：

$$\begin{bmatrix}m_{11} & m_{12} & m_{13} & m_{14} \\m_{21} & m_{22} & m_{23} & m_{24} \\m_{31} & m_{32} & m_{33} & m_{34} \\m_{41} & m_{42} & m_{43} & m_{44} \\\end{bmatrix}$$


## HLSL 中的 mul 函数

微软的官方文档是这么描述 mul 函数的 ([微软官方文档链接](https://docs.microsoft.com/zh-cn/windows/desktop/direct3dhlsl/dx-graphics-hlsl-mul))，这里进行个人翻译：

使用矩阵数学来进行矩阵 x 乘矩阵 y 的运算，要求矩阵 x 的列数与矩阵 y 的行数相等。

如果 x 是一个向量，那么它将被解释为行向量。

如果 y 是一个向量，那么它将被解释为列向量。

表面上看起来很美满，很智能，但稍有不慎就要在这里踩大坑了。

## dp4 指令

dp4 是一个汇编指令 ([微软官方文档链接](https://docs.microsoft.com/zh-cn/windows/desktop/direct3dhlsl/dp4---vs))，使用方法如下：

dp4 dst, src0, src1

其中 src0 和 src1 是一个向量，计算它们的点乘并将结果传给 dst。

当然这里并不是要教大家怎么写汇编，而是怎么看。

为了了解`mul`函数是如何进行向量与矩阵的乘法运算，我们需要探讨一下它的汇编实现。这里我所使用的是`row_major`矩阵。首先是向量作为第一个参数的情况：

![](1681897511961.png)

可以看到这种运算方式实际上却是按照向量左乘矩阵的形式进行的运算。

然后是将向量作为第二个参数的情况（仅单纯的参数交换）:

![](1681897511991.png)

无论是行向量左乘矩阵，还是列向量左乘矩阵，在汇编层面上都是用`dp4`的形式进行计算，这是因为对矩阵来说在内存上是以 4 个行向量的形式存储的，传递一行的寄存器向量比传递一列更简单，适合进行与列向量的运算，并且效率会更高。

然后眼尖的同学会发现，同一条指令，只是改变了顺序，指令执行的起始地址就产生了差别 (16 条指令数目差)。

但是交换两个参数又会导致运算结果 / 显示结果的不同，这时候就要看看矩阵所存的值了。

先看一段 HLSL 代码：

```c++
cbuffer cb : register(b0)
{
    row_major matrix gWorld;
    row_major matrix gView;
    row_major matrix gProj;
}

struct VertexPosNormalTex
{
    float3 PosL : POSITION;
    float3 NormalL : NORMAL;
    float2 Tex : TEXCOORD;
};

struct VertexPosHWNormalTex
{
    float4 PosH : SV_POSITION;
    float3 PosW : POSITION; // 在世界中的位置
    float3 NormalW : NORMAL; // 法向量在世界中的方向
    float2 Tex : TEXCOORD;
};

// 顶点着色器
VertexPosHWNormalTex VS(VertexPosNormalTex pIn)
{
    VertexPosHWNormalTex pOut;
    
    row_major matrix viewProj = mul(gView, gProj);

    pOut.PosW = mul(float4(pIn.PosL, 1.0f), gWorld).xyz;
    pOut.PosH = mul(float4(pOut.PosW, 1.0f), viewProj);
    pOut.NormalW = mul(pIn.NormalL, (float3x3) gWorldInvTranspose);
    pOut.Tex = pIn.Tex;
    return pOut;
}
```

我们只考虑`viewProj`的初始化和`pOut.PosH`的赋值操作。

首先是`viewProj`经过计算后应该得到的值：

![](1681897512052.png)

这是向量左乘矩阵开始前四个向量寄存器的值 (默认 HLSL)：

![](1681897512098.png)

这是向量左乘矩阵开始前时四个向量寄存器的值 (将`float4(pOut.PosW, 1.0f)`和`viewProj`交换)：

| | | | | | | | | | | ![](1681897512168.png) | | | | | | | | | | |
| | | | | | | | | | |  | | | | | | | | | | |
也许有人会奇怪，怎么在开始运算前两边寄存器存储的内容会不一样。我们需要往前观察上一个语句产生的汇编 (默认 HLSL)：

![](1681897512210.png)

而将`float4(pOut.PosW, 1.0f)`和`viewProj`交换后，则汇编代码没有了转置操作:

![](1681897512269.png)

严格意义上说，00000000 到 0000001B 的指令才是上图语句的实际执行内容，而 0000001C 到 0000002B 的代码则应是在计算`pOut.PosH = mul(float4(pOut.PosW, 1.0f), viewProj);`之前所进行的一系列额外操作。

因此无论是行向量还是列向量，在执行完 0000001B 指令后，行主序矩阵`viewProj`的内存布局一定为：

![](1681897512316.png)

如果用行向量左乘该行主序矩阵，由于 dp4 运算需要按列取出这些寄存器的值，为此需要额外 16 条指令进行转置（0000001C 到 0000002B）。

而如果用列向量左乘该行主序矩阵，则不需要进行转置，直接取寄存器行向量就可以直接进行 dp4 运算。

因此，我们可以知道一个**行向量**左乘**行主序矩阵**时，为了满足`mul`函数使用`dp4`指令优化运算，需要会预先对原来的矩阵进行转置。其中 r4 r5 r6 r3 为`viewProj`转置后的矩阵，即将会左乘向量`float4(pOut.PosW, 1.0f)`。而**列向量**左乘**行主序矩阵**则可以避免转置操作。

同理，如果采用**列主序矩阵**，**行向量**左乘**列主序矩阵**可以避免转置操作；而**列向量**左乘**列主序矩阵**又会产生转置操作。

故对于`dp4`来说，最好是能够对一个**行向量**和**列主序矩阵** (取列主序矩阵的行，也就是取一行寄存器向量与行向量做点乘) 操作，又或者是对一个**行主序矩阵** (取行主序矩阵的行与列向量做点乘) 和**列矩阵**操作，这样都能有效避免转置。

![](1681897512342.png)


## 总结

综上所述，有三处地方可能会发生转置：

1.  C++ 代码端的转置
2.  HLSL 中 matrix(float4x4) 是列主矩阵时会发生转置
3.  mul 乘法内部是以列向量左乘矩阵的形式实现的，对于行向量左乘矩阵的情况会发生转置

经过组合，就一共有四种能够正常绘制的情况：

1.  **C++ 代码端不进行转置，HLSL 中使用`row_major matrix`(行主序矩阵)，mul 函数让向量放在左边 (行向量)，这样实际运算就是 (行向量 X 行主序矩阵)** 。这种方法易于理解，但是这样做 dp4 运算取矩阵的列很不方便，在 HLSL 中会产生用于转置矩阵的大量指令，性能上有损失。
2.  **C++ 代码端进行转置，HLSL 中使用`matrix`(列主序矩阵) ，mul 函数让向量放在左边 (行向量)，这样就是 (行向量 X 列主序矩阵)，但 C++ 这边需要进行一次矩阵转置，HLSL 内部不产生转置** 。这是官方例程所使用的方式，这样可以使得 dp4 运算可以直接取列主序矩阵的行，从而避免内部产生大量的转置指令。后续我会将教程的项目也使用这种方式。
3.  **C++ 代码端不进行转置，HLSL 中使用`matrix`(列主序矩阵)，mul 函数让向量放在右边 (列向量)，实际运算是 (列主序矩阵 X 列向量)**。这种方法的确可行，取列矩阵的行也比较方便，效率上又和 2 等同，就是 HLSL 那边的矩阵乘法都要反过来写，然而 DX 本身就是崇尚行主矩阵的，把 OpenGL 的习惯带来这边有点。。。
4.  **C++ 代码端进行转置，HLSL 中使用`row_major matrix`(行主序矩阵)，mul 函数让向量放在右边 (列向量)，实际运算是 (行主序矩阵 X 列向量)。** 就算这种方法也可以绘制出来，但还是很让人难受，比第 2 点还难受，我甚至不想去说它。

也就是说，以组合 1 为基准，任意改变其中两个状态都不会影响最终结果。

