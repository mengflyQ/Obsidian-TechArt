---
title: DirectXMath
aliases: 
tags: []
create_time: 2023-04-25 23:07
uid: 202304252307
banner: "![[Pasted image 20230512121530.png]]"
banner_y: 0.33
---

> [!NOTE] D3D规定
> 使用左手坐标系，遵循左手法则
> 

> [!NOTE] 龙书规定
> 1. 本书中所使用的术语“标架”(frame)、“参考系”(frame of reference)、“空间”(space)和“坐标系”(coordinate System)皆表示相同的意义。
> 2. **normalize** 的不同译法：标准化，归一化，规范化，规格化，单位化......  译者按：区间、范围为归一化，名词向量或空间为规范化 (把一个向量的长度变为单位长度称为向量的规范化，方法是将向量的每个分量除以该向量的模，结果得到一个单位向量)
> 3. 正交（orthogonal）和垂直（perpendicular）为同义词

总链接： [DirectXMath 库函数 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/ovw-xnamath-reference-functions)

库向量函数 P16：[DirectXMath 库矢量负载函数 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/ovw-xnamath-reference-functions-load) 

库矩阵函数 P44：[DirectXMath 库矩阵函数 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/ovw-xnamath-reference-functions-matrix) 

库四元数函数 P661： [DirectXMath 库四元数函数 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/ovw-xnamath-reference-functions-quaternion) 

库平面函数 P731： [DirectXMath 库平面函数 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/ovw-xnamath-reference-functions-plane) 

# 0 简介
该数学库采用了 SIMD 流指令拓展 2（SSE2）指令集，它借助 128 位宽的单指令多数据（SIMD） 寄存器，利用**一条 SIMD 指令即可对 4 个 32 位浮点数或整数进行运算**。也就是说，我们可以用 1 条 SIMD 加法指令取代 4D 向量中 4 条普通的标量指令，从而直接算出 4 D 向量的加法结果。3D 和 2D 向量用不到的部分置 0 并忽略。

```c++ nums
#include <DirectXMath.h>
#include <DirectXPackedVector.h>
```
DirectXMath 关联的头文件：
-   `DirectXMath.h`，命名空间 `DirectX`
-   `DirectXPackedVector.h`，包含相关的数据结构，命名空间 `DirectX::PackedVector`

x86平台需要打开 vs 的 SSE2指令集。
x64 平台不必开启 SSE2 指令集，因为所有的 x64CPU 对此均有支持。

注： 将`XM_CALLCONV`调用约定注解加在非构造函数名之前时，它会根据编译器的版本确定出对应的调用约定属性。
# 1 向量
## 向量类型

**总结一下:**
1. 向量类型定义： `typedef __m128 XMVECTOR` ，这里的 `__m128`  是一种特殊的 SIMD 类型。必须通过此类型才可充分利用 SIMD 技术。 `XMVECTOR` 类型的数据按 16 字节对齐，对于局部变量和全局变量是自动实现的。
2. 对于类中的数据成员，使用 `XMFLOAT2`（2D 向量）、`XMFLOAT3` （3D 向量）和 `XMFLOAT4` （4D 向量）类型。
3. 在运算之前, 通过加载函数（loading function）将 `XMFLOATn` 类型转换为 `XMVECTOR` 类型。
4. 用 `XMVECTOR` 实例来进行运算。
5. 通过存储函数（storage function）将 `XMVECTOR` 类型转换为 `XMFLOATn` 类型。
## 加载和存储方法
**将数据从 `XMFLOATn` 类型加载到 `XMVECTOR` 类型：**
```c++ nums
//将数据从XMFLOAT2类型中加载到XMVECTOR类型
XMVECTOR XM_CALLCONV XMLoadFloat2(const XMFLOAT2 *pSource);

//将数据从XMFLOAT3类型中加载到XMVECTOR类型
XMVECTOR XM_CALLCONV XMLoadFloat3(const XMFLOAT3 *pSource);

//将数据从XMFLOAT 4类型中加载到XMVECTOR类型
XMVECTOR XM_CALLCONV XMLoadFloat4(Const XMFLOAT4 *PSource);
```

**将数据从 `XMVECTOR` 类型存储到 `XMFLOATn` 类型:**
```c++ nums
//将数据从XMVECTOR类型中存储到XMFLOAT2类型
void XM_CALLCONV XMStoreFloat2(XMFLOAT2 *pDestination，FXMVECTOR V);
//将数据从XMVECTOR类型中存储到XMFLOAT3类型
void XM_CALLCONV XMStoreFloat3(XMFLOAT3 *pDestination，FXMVECTOR V);
//将数据从XMVECTOR类型中存储到XMFLOAT4类型
void XM_CALLCONV XMStoreFloat4(XMFLOAT4 *pDestination，FXMVECTOR V);
```

当我们只希望从 `XMVECTOR` 实例中得到某一个向量分量或将某一向量分量转换为 `XMVECTOR` 类型时，相关的存取方法如下:
```c++ nums
float XM_CALLCONV XMVectorGetX(FXMVECTOR V);
float XM_CALLCONV XMVectorGetY(FXMVECTOR V);
float XM_CALLCONV XMVectorGetZ(FXMVECTOR V);
float XM_CALLCONV XMVectorGetW(FXMVECTOR V);

XMVECTOR XM_CALLCONV XMVectorSetX(FXMVECTOR V, float x);
XMVECTOR XM_CALLCONV XMVectorSetY(FXMVECTOR V, float y);
XMVECTOR XM_CALLCONV XMVectorSetZ(FXMVECTOR V, float z);
XMVECTOR XM_CALLCONV XMVectorSetW(FXMVECTOR V, float w);
```
## 参数的传递

> [!NOTE] 调用约定 
> 详情：[库内部结构 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/dxmath/pg-xnamath-internals)
> 
> 如果将 `XMVECTOR` 对象作为参数传递，这些对象定义为在 16 字节边界上对齐，则根据目标平台的不同调用要求集：
对于 64 位 Windows，有两个调用约定可用于高效传递 `__m128` 值。标准是 `__fastcall`，它传递堆栈上的所有 `__m128` 值。
>
较新的 Visual Studio 编译器支持 `__vectorcall` 调用约定，该约定最多可将 `XMVECTOR` 实例的六个 `__m128` 值作为参数传递给 SSE/SSE2 寄存器中的函数。如果有足够的空间，它还可以通过 SSE/SSE2 寄存器传递异类矢量聚合 (也称为 `XMMATRIX`) 。

为了提高效率，可以将 `XMVECTOR` 类型的值作为函数参数，直接传送至 SSE/SSE 2 寄存器（register）里，而不存于栈（stack）内。

此方式传递的参数数量取决于用户使用的平台和编译器，因此为了代码通用性，我们将**使用以下规则传递 `XMVECTOR` 参数：**

●前 3 个 `XMVECTOR` 参数应当用类型 `FXMVECTOR`；  
●第 4 个 `XMVECTOR` 参数应当用类型 `GXMVECTOR`；  
●第 5、6 个 `XMVECTOR` 参数应当用类型 `HXMVECTOR`；  
●其余的 `XMVECTOR` 参数应当用类型 `CXMVECTOR`；

```c++ nums
//在64位的windows系统上，编译器将根据_fastcall调用约定将所有参数存在栈上
typedef const XMVECTOR& FXMVECTOR;
typedef const XMVECTOR& GXMVECTOR;
typedef const XMVECTOR& HXMVECTOR;
typedef const XMVECTOR& CXMVECTOR;

//在64位的 windows系统上，编译器将通过_vectorcall调用约定将前6个XMVECTOR参数传递到SSE/SSE2寄存器中,而把其余参数均存在栈上
typedef const XMVECTOR  FXMVECTOR;
typedef const XMVECTOR  GXMVECTOR;
typedef const XMVECTOR  HXMVECTOR;
typedef const XMVECTOR& CXMVECTOR;
```

在声明具有 `XMMATRIX` 参数的函数时，要注意 **1 个 `XMMATRIX` 应计作 4 个 `XMVECTOR` 参数这一点之外，其他的规则与传入 `XMVECTOR` 类型的参数时相一致。**
假设传入函数的 `FXMVECTOR` 参数不超过两个，则第一个 `XMMATRIX` 参数应当为 `FXMMATRIX` 类型，其余的 `XMMATRIX` 参数均应为 `CXMMATRIX` 类型。

```c++ nums
// 在64位的Windows系统上，__fastcall调用约定将所有参数存在堆栈上
typedef const XMMATRIX& FXMMATRIX;
typedef const XMMATRIX& CXMMATRIX;

//在64位的 windows系统上，编译器将通过_vectorcall调用约定将前6个XMVECTOR参数传递到SSE/SSE2寄存器中,而把其余参数均存在栈上
typedef const XMMATRIX FXMMATRIX;
typedef const XMMATRIX& CXMMATRIX;
```

**需要遵守的规定**
1. 传递 `MVECTOR` 参数的**规则仅适用于“输入”参数**。“输出”的 `MVECTOR` 参数应该始终使用 `XMVECTOR&` 或 `XMVECTOR*`，不会占用 SSE/SSE2 寄存器，所以它们的处理方式与非 `MVECTOR` 类型的参数一致。 
2. 由于`__vectorcall`的限制，建议不要对 C++ 构造函数使用 `GXMVECTOR` 或 `HXMVECTOR` 。 **只需对前三个 `XMVECTOR` 值使用 `FXMVECTOR`，然后对其余值使用 `CXMVECTOR`。**
3. 由于__vectorcall的限制，建议不要对 C++ 构造函数使用 `FXMMATRIX` 。 只需使用 `CXMMATRIX`。
4. 必须使用 `XM_CALLCONV` 批注来确保**函数**根据编译器和体系结构使用适当的调用约定（`__fastcall` 与 `__vectorcall`）
5. 由于`__vectorcall` 的限制，不要对 构造函数使用 `XM_CALLCONV`。

## 常向量
`XMVECTOR` 类型的常量实例用 `XMVECTORF32` 类型表示，运用**初始化**语法的时候就要使用该类型。`XMVECTORF32` 是一种按 16 字节对齐的结构体。
```c++ nums
static const XMVECTORF32 g_vHalfVector = {0.5f,0.5f,0.5f,0.5f};
```
另外，也可以通过 `XMVECTORUU32` 类型来创建由整形数据构成的 XMVECTOR 常向量：
```c++ nums
static const XMVECTORF32 vGrabY ={0x00000000,0x00000000,0x00000000,0x00000000};
```
## 重载运算符
`XMVECTOR` 类型针对向量的加法运算、减法运算和标量乘法运算，都分别提供了对应的重载运算符。  
```c++ nums
XMVECTOR  XM_CALLCONV   operator+ (FXMVECTOR V);
XMVECTOR  XM_CALLCONV   operator- (FXMVECTOR V);

XMVECTOR&  XM_CALLCONV   operator+= (XMVECTOR& V1, FXMVECTOR V2);
XMVECTOR&  XM_CALLCONV   operator-= (XMVECTOR& V1, FXMVECTOR V2);
XMVECTOR&  XM_CALLCONV   operator*= (XMVECTOR& V1, FXMVECTOR V2);
XMVECTOR&  XM_CALLCONV   operator/= (XMVECTOR& V1, FXMVECTOR V2);

XMVECTOR&  operator*= (XMVECTOR& V, float S);
XMVECTOR&  operator/= (XMVECTOR& V, float S);

XMVECTOR  XM_CALLCONV   operator+ (FXMVECTOR V1, FXMVECTOR V2);
XMVECTOR  XM_CALLCONV   operator- (FXMVECTOR V1, FXMVECTOR V2);
XMVECTOR  XM_CALLCONV   operator* (FXMVECTOR V1, FXMVECTOR V2);
XMVECTOR  XM_CALLCONV   operator/ (FXMVECTOR V1, FXMVECTOR V2);
XMVECTOR  XM_CALLCONV   operator* (FXMVECTOR V, float S);
XMVECTOR  XM_CALLCONV   operator* (float S, FXMVECTOR V);
XMVECTOR  XM_CALLCONV   operator/ (FXMVECTOR V, float S);
```
## 杂项
DirectXMath 库定义了一组与 π 有关的常用数学常量近似值：
```c++ nums
const float XM_PI    =   3.141592654f;
const float XM_2PI   =   6.283185307f;
const float XM_1DIVPI    =  0.318309886f;
const float XM_1DIV2PI   =  0.159154943f;
const float XM_PIDIV2    =  1.570796327f;
const float XM_PIDIV4    =  0.785398163f;
```
下列内联函数实现了弧度和角度间的互相转化：
```c++ nums
inline float XMConvertToRadians(float fDegrees)
{ return fDegrees * (XM_PI / 180.0f); }
inline float XMConvertToDegrees(float fRadians)
{ return fRadians * (180.0f / XM_PI); }
```
DirectXMath 库还定义了求出两个数间较大值及较小值的函数：
```c++ nums
template<class T> inline T XMMin(T a, T b) { return (a < b) ? a : b; }
template<class T> inline T XMMax(T a, T b) { return (a > b) ? a : b; }
```
## Setter 函数
DirectXMath 库提供了下列函数，以设置 XMVECTOR 类型中的数据：
```c++ nums
// 返回零向量0
XMVECTOR XM_CALLCONV XMVectorZero();

// 返回向量(1, 1, 1, 1)
XMVECTOR XM_CALLCONV XMVectorSplatOne();

// 返回向量(x, y, z, w)
XMVECTOR XM_CALLCONV XMVectorSet(float x, float y, float z, float w);

// 返回向量(Value, Value, Value, Value)
XMVECTOR XM_CALLCONV XMVectorReplicate(float Value);

// 返回向量(Vx, Vx, Vx, Vx) 
XMVECTOR XM_CALLCONV XMVectorSplatX(FXMVECTOR V);

// 返回向量(Vy, Vy, Vy, Vy) 
XMVECTOR XM_CALLCONV XMVectorSplatY(FXMVECTOR V);

// 返回向量(Vz, Vz, Vz, Vz) 
XMVECTOR XM_CALLCONV XMVectorSplatZ(FXMVECTOR V);
```

```c++ nums
#include <windows.h> // 为了使XMVerifyCPUSupport函数返回正确值
#include <DirectXMath.h>
#include <DirectXPackedVector.h>
#include <iostream>
using namespace std;
using namespace DirectX;
using namespace DirectX::PackedVector;

// 重载"<<"运算符，这样就可以通过cout函数输出XMVECTOR对象
ostream& XM_CALLCONV operator<<(ostream& os, FXMVECTOR v)
{
  XMFLOAT3 dest;
  XMStoreFloat3(&dest, v);

  os << "(" << dest.x << ", " << dest.y << ", " << dest.z << ")";
  return os;
}

int main()
{
  cout.setf(ios_base::boolalpha);

  // 检查是否支持SSE2指令集 (Pentium4, AMD K8及其后续版本的处理器)
  if (!XMVerifyCPUSupport())
  {
    cout << "directx math not supported" << endl;
    return 0;
  }

  XMVECTOR p = XMVectorZero();
  XMVECTOR q = XMVectorSplatOne();
  XMVECTOR u = XMVectorSet(1.0f, 2.0f, 3.0f, 0.0f);
  XMVECTOR v = XMVectorReplicate(-2.0f);
  XMVECTOR w = XMVectorSplatZ(u);

  cout << "p = " << p << endl;
  cout << "q = " << q << endl;
  cout << "u = " << u << endl;
  cout << "v = " << v << endl;
  cout << "w = " << w << endl;

  return 0;
}
```
![[Pasted image 20230102000843.png]]
## 向量函数
DirectXMath 库提供了下面的函数来执行各种向量运算。**我们主要围绕 3D 向量的运算函数进行讲解，类似的运算还有 2D 和 4D 版本。** 除了表示维度的数字不同以外，这几种版本的函数名皆同。
```c++ nums
XMVECTOR XM_CALLCONV XMVector3Length(      // 返回||v||
  FXMVECTOR V);                            // 输入向量v

XMVECTOR XM_CALLCONV XMVector3LengthSq(    //返回||v||^2
  FXMVECTOR V);                            // 输入向量v

XMVECTOR XM_CALLCONV XMVector3Dot(         // 返回v1·v２
  FXMVECTOR V1,                            // 输入向量v1
  FXMVECTOR V2);                           // 输入向量v2

XMVECTOR XM_CALLCONV XMVector3Cross(       // 返回v1×v2
  FXMVECTOR V1,                            // 输入向量v1
  FXMVECTOR V2);                           // 输入向量v2

XMVECTOR XM_CALLCONV XMColorModulate(      // 返回c1⊗c2 颜色分量式乘法 
  FXMVECTOR c1,                             
  FXMVECTOR c2);        

XMVECTOR XM_CALLCONV XMVector3Normalize(   // 返回v/||v||
  FXMVECTOR V);                            // 输入向量v

XMVECTOR XM_CALLCONV XMVector3Orthogonal(  // 返回一个正交于v的向量
  FXMVECTOR V);                            // 输入向量v

XMVECTOR XM_CALLCONV XMVector3AngleBetweenVectors( // 返回v1和v2之间的夹角
  FXMVECTOR V1,                           // 输入向量v1
  FXMVECTOR V2);                          // 输入向量v2

void XM_CALLCONV XMVector3ComponentsFromNormal(
  XMVECTOR* pParallel,                   // 返回projn(v)
  XMVECTOR* pPerpendicular,              // 返回perpn(v)
  FXMVECTOR V,                           // 输入向量v
  FXMVECTOR Normal);                     // 输入规范化向量n

bool XM_CALLCONV XMVector3Equal(     // 返回v1 == v2？
  FXMVECTOR V1,                      // 输入向量v1
  FXMVECTOR V2);                     // 输入向量v2

bool XM_CALLCONV XMVector3NotEqual(  // 返回v1≠v２
  FXMVECTOR V1,                      // 输入向量v1
  FXMVECTOR V2);                     // 输入向量v2
```

> [!NOTE] 注意
>  可以看到，即使在数学上计算的结果是标量（如点积 $k=v_1\cdot v_2$），函数所返回的类型依旧是 `XMVECTOR` ，而得到的标量结果则被复制到 `XMVECTOR` 中的各个分量之中。如点积函数 `XMVector3Dot` ，此函数返回的向量为 $\left(\begin{array}{cc}\nu_1\cdot\nu_2,\nu_1\cdot\nu_2,\nu_1\cdot\nu_2,\nu_1\cdot\nu_2\end{array}\right)$ 这样做的原因之一是，将标量和 SIMD 向量的混合运算次数降到最低，使用户除了自定义的计算之外全程都使用 SIMD 技术，以提升计算效率。

DirectXMath 库也提供了一些估算方法，精度低但速度快。如果愿意为了速度而牺牲一些精度，则可以使用它们。下面是两个估算方法的例子：
```c++ nums
XMVECTOR XM_CALLCONV XMVector3LengthEst(     // 返回估算值||v||
  FXMVECTOR V);                              // 输入v
　
XMVECTOR XM_CALLCONV XMVector3NormalizeEst(  // 返回估算值v/||v||
  FXMVECTOR V);                             // 输入v
```

## 浮点数误差
在用计算机处理与向量有关的工作时，我们应当了解以下的内容。**在比较浮点数时，一定要注意浮点数存在的误差。** 我们认为相等的两个浮点数可能会因此而有细微的差别。例如，已知在数学上规范化向量的长度为 1，但是在计算机程序中的表达上，向量的长度只能接近于 1。此外，在数学中，对于任意实数 $p$ 有 $1^p=1$。但是，当只能在数值上逼近 1 时，随着幂 p 的增加，所求近似值的误差也在逐渐增大。由此可见，**数值误差是可积累的**。下面这个小程序可印证这些观点：
```c++ nums
#include <windows.h> // 为了使XMVerifyCPUSupport函数返回正确值
#include <DirectXMath.h>
#include <DirectXPackedVector.h>
#include <iostream>
using namespace std;
using namespace DirectX;
using namespace DirectX::PackedVector;

int main()
{
  cout.precision(8);

  // 检查是否支持SSE2指令集 (Pentium4, AMD K8及其后续版本的处理器)
  if (!XMVerifyCPUSupport())
  {
    cout << "directx math not supported" << endl;
    return 0;
  }

  XMVECTOR u = XMVectorSet(1.0f, 1.0f, 1.0f, 0.0f);
  XMVECTOR n = XMVector3Normalize(u);

  float LU = XMVectorGetX(XMVector3Length(n));

  // 在数学上，此向量的长度应当为1。在计算机中的数值表达上也是如此吗？
  cout << LU << endl;
  if (LU == 1.0f)
    cout << "Length 1" << endl;
  else
    cout << "Length not 1" << endl;

  // 1的任意次方都是1。但是在计算机中，事实确实如此吗？
  float powLU = powf(LU, 1.0e6f);
  cout << "LU^(10^6) = " << powLU << endl;
}
```
![[Pasted image 20230102001105.png]]
**为了弥补浮点数精确性上的不足，我们通过比较两个浮点数是否近似相等来加以解决。** 在比较的时候，我们需要定义一个 Epsilon 常量，它是个非常小的值，可为误差留下一定的“缓冲”余地。如果两个数相差的值小于 Epsilon，我们就说这两个数是近似相等的。
换句话说，**Epsilon 是针对浮点数的误差问题所指定的容差（tolerance）**。下面的函数解释了如何利用 Epsilon 来检测两个浮点数是否相等：
```c++ nums
const float Epsilon = 0.001f;
bool Equals(float lhs, float rhs)
{
    // lhs和rhs相差的值是否小于EPSILON?
    return fabs(lhs - rhs) < Epsilon ? true : false;
}
```

对此，DirectXMath 库提供了 `XMVector3NearEqual` 函数，用于以 Epsilon 作为容差，测试比较的向量是否相等：
```c++ nums
// 返回 
//  abs(U.x – V.x) <= Epsilon.x && 
//  abs(U.y – V.y) <= Epsilon.y &&
//  abs(U.z – V.z) <= Epsilon.z
XMFINLINE bool XM_CALLCONV XMVector3NearEqual(
  FXMVECTOR U, 
  FXMVECTOR V, 
  FXMVECTOR Epsilon);
```
# 2 矩阵
## 矩阵类型

DirectXMath 以定义在 `DirectXMath.h` 头文件中的 `XMMATRIX` 类来表示 4x4 矩阵（为了叙述清晰起见，这里进行了若干细节上的调整）：

```c++ nums
#if (defined(_M_IX86) || defined(_M_X64) || defined(_M_ARM)) && 
defined(_XM_NO_INTRINSICS_)
struct XMMATRIX
#else
__declspec(align(16)) struct XMMATRIX
#endif
{
  // 利用4个XMVECTOR来表示矩阵，借此使用SIMD技术
  XMVECTOR r[4];

  XMMATRIX() {}

  // 通过指定4个行向量来初始化矩阵
  XMMATRIX(FXMVECTOR R0, FXMVECTOR R1, FXMVECTOR R2, CXMVECTOR R3) 
    { r[0] = R0; r[1] = R1; r[2] = R2; r[3] = R3; }

  // 通过指定16个矩阵元素来初始化矩阵
  XMMATRIX(float m00, float m01, float m02, float m03,
       float m10, float m11, float m12, float m13,
       float m20, float m21, float m22, float m23,
       float m30, float m31, float m32, float m33);

  // 通过含有16个浮点数元素的数组来初始化矩阵
  explicit XMMATRIX(_In_reads_(16) const float *pArray);

  XMMATRIX&  operator= (const XMMATRIX& M) 
    { r[0] = M.r[0]; r[1] = M.r[1]; r[2] = M.r[2]; r[3] = M.r[3]; 
    return *this; }

  XMMATRIX  operator+ () const { return *this; }
  XMMATRIX  operator- () const;

  XMMATRIX&  XM_CALLCONV   operator+= (FXMMATRIX M);
  XMMATRIX&  XM_CALLCONV   operator-= (FXMMATRIX M);
  XMMATRIX&  XM_CALLCONV   operator*= (FXMMATRIX M);
  XMMATRIX&  operator*= (float S);
  XMMATRIX&  operator/= (float S);

  XMMATRIX  XM_CALLCONV   operator+ (FXMMATRIX M) const;
  XMMATRIX  XM_CALLCONV   operator- (FXMMATRIX M) const;
  XMMATRIX  XM_CALLCONV   operator* (FXMMATRIX M) const;
  XMMATRIX  operator* (float S) const;
  XMMATRIX  operator/ (float S) const;

  friend XMMATRIX   XM_CALLCONV   operator* (float S, FXMMATRIX M);
};

```

综上所述，`XMMATRIX` 由 4 个 `XMVECTOR` 实例所构成，并借此来使用 SIMD 技术。此外，XMMATRIX 类还为矩阵计算提供了多种重载运算符。

除了各种构造方法之外，还可以使用 `XMMatrixSet` 函数来创建 `XMMATRIX` 实例：

```c++ nums
XMMATRIX XM_CALLCONV XMMatrixSet(
  float m00, float m01, float m02, float m03,
  float m10, float m11, float m12, float m13,
  float m20, float m21, float m22, float m23,
  float m30, float m31, float m32, float m33);
```
## 加载和存储方法
就像通过 `XMFLOAT2 (2D)`，`XMFLOAT3 (3D)`和 `XMFLOAT4 (4D)`来存储类中不同维度的向量一样，DirectXMath 文档也建议我们用 `XMFLOAT4X4` 来存储类中的矩阵类型数据成员。

```c++ nums
struct XMFLOAT4X4
{
  union
  {
    struct
    {
      float _11, _12, _13, _14;
      float _21, _22, _23, _24;
      float _31, _32, _33, _34;
      float _41, _42, _43, _44;
    };
    float m[4][4];
  };

  XMFLOAT4X4() {}
  XMFLOAT4X4(float m00, float m01, float m02, float m03,
             float m10, float m11, float m12, float m13,
             float m20, float m21, float m22, float m23,
             float m30, float m31, float m32, float m33);
  explicit XMFLOAT4X4(_In_reads_(16) const float *pArray);

  float    operator() (size_t Row, size_t Column) const { return m[Row][Column]; }
  float&   operator() (size_t Row, size_t Column) { return m[Row][Column]; }

  XMFLOAT4X4& operator=(const XMFLOAT4X4& Float4x4);
};
```

通过下列方法将数据从 `XMFLOAT4X4` 内加载到 `XMMATRIX` 中：

```c++ nums
inline XMMATRIX XM_CALLCONV 
XMLoadFloat4x4(const XMFLOAT4X4* pSource);
```

通过下列方法将数据从 `XMMATRIX` 内存储到 `XMFLOAT4X4` 中：

```c++ nums
inline void XM_CALLCONV 
XMStoreFloat4x4(XMFLOAT4X4* pDestination, FXMMATRIX M);
```
## 矩阵函数
DirectXMath 库包含了下列与矩阵相关的实用函数：

```c++ nums
XMMATRIX XM_CALLCONV XMMatrixIdentity();   // 返回单位矩阵I

bool XM_CALLCONV XMMatrixIsIdentity(       // 如果M是单位矩阵则返回true
    FXMMATRIX M);                          // 输入矩阵M

XMMATRIX XM_CALLCONV XMMatrixMultiply(     // 返回矩阵乘积AB
    FXMMATRIX A,                           // 输入矩阵A
    CXMMATRIX B);                          // 输入矩阵B

XMMATRIX XM_CALLCONV XMMatrixTranspose(    // 返回MT转置矩阵
    FXMMATRIX M);                          // 输入矩阵M

XMVECTOR XM_CALLCONV XMMatrixDeterminant(  // 返回(det M, det M, det M, det M)行列式
    FXMMATRIX M);                          // 输入矩阵M

XMMATRIX XM_CALLCONV XMMatrixInverse(      // 返回M^-1 逆矩阵
    XMVECTOR* pDeterminant,                // 输入(det M, det M, det M, det M)
    FXMMATRIX M);                          // 输入矩阵M
```

## 示例
```c++ nums
#include <windows.h> // 为了使XMVerifyCPUSupport函数返回正确值
#include <DirectXMath.h>
#include <DirectXPackedVector.h>
#include <iostream>
using namespace std;
using namespace DirectX;
using namespace DirectX::PackedVector;

// 重载"<<"运算符，这样就可以利用cout输出XMVECTOR和XMMATRIX对象
ostream& XM_CALLCONV operator << (ostream& os, FXMVECTOR v)
{
  XMFLOAT4 dest;
  XMStoreFloat4(&dest, v);

  os << "(" << dest.x << ", " << dest.y << ", " << dest.z << ", " << dest.w << ")";
  return os;
}

ostream& XM_CALLCONV operator << (ostream& os, FXMMATRIX m)
{
  for (int i = 0; i < 4; ++i)
  {
    os << XMVectorGetX(m.r[i]) << "\t";
    os << XMVectorGetY(m.r[i]) << "\t";
    os << XMVectorGetZ(m.r[i]) << "\t";
    os << XMVectorGetW(m.r[i]);
    os << endl;
  }
  return os;
}

int main()
{
  // 检查是否支持SSE2指令集 (Pentium4, AMD K8及其后续版本的处理器)
  if (!XMVerifyCPUSupport())
  {
    cout << "directx math not supported" << endl;
    return 0;
  }

  XMMATRIX A(1.0f, 0.0f, 0.0f, 0.0f,
             0.0f, 2.0f, 0.0f, 0.0f,
             0.0f, 0.0f, 4.0f, 0.0f,
             1.0f, 2.0f, 3.0f, 1.0f);

  XMMATRIX B = XMMatrixIdentity();
  XMMATRIX C = A * B;

  XMMATRIX D = XMMatrixTranspose(A);

  XMVECTOR det = XMMatrixDeterminant(A);
  XMMATRIX E = XMMatrixInverse(&det, A);

  XMMATRIX F = A * E;

  cout << "A = " << endl << A << endl;
  cout << "B = " << endl << B << endl;
  cout << "C = A*B = " << endl << C << endl;
  cout << "D = transpose(A) = " << endl << D << endl;
  cout << "det = determinant(A) = " << det << endl << endl;
  cout << "E = inverse(A) = " << endl << E << endl;
  cout << "F = A*E = " << endl << F << endl;

  return 0;
}
```
![[Pasted image 20230102110223.png]]
# 3 变换
```c++ nums
// 构建一个缩放矩阵:
XMMATRIX XM_CALLCONV XMMatrixScaling(
float ScaleX, 
float ScaleY, 
float ScaleZ);                        // 缩放系数

// 用一个3D向量中的分量来构建缩放矩阵:
XMMATRIX XM_CALLCONV XMMatrixScalingFromVector(
FXMVECTOR Scale);                     // 缩放系数(sx,sy, sz)

// 构建一个绕x轴旋转的矩阵Rx:
XMMATRIX XM_CALLCONV XMMatrixRotationX(
    float Angle);                    // 以顺时针方向按弧度θ进行旋转

// 构建一个绕y轴旋转的矩阵Ry:
XMMATRIX XM_CALLCONV XMMatrixRotationY(
    float Angle);                    // 以顺时针方向按弧度θ进行旋转

// 构建一个绕z轴旋转的矩阵Rz:
XMMATRIX XM_CALLCONV XMMatrixRotationZ(
    float Angle);                    // 以顺时针方向按弧度θ进行旋转

// 构建一个绕任意轴旋转的矩阵Rn: 
XMMATRIX XM_CALLCONV XMMatrixRotationAxis(
 FXMVECTOR Axis,                      // 旋转轴n    
 float Angle);                        // 沿n轴正方向看，以顺时针方向按弧度θ进行旋转

// 构建一个平移矩阵:
XMMATRIX XM_CALLCONV XMMatrixTranslation(
float OffsetX, 
float OffsetY, 
float OffsetZ);                       // 平移系数

// 用一个3D向量中的分量来构建平移矩阵:
XMMATRIX XM_CALLCONV XMMatrixTranslationFromVector(
FXMVECTOR Offset);                    // 平移系数(tx, ty, tz)

// 计算向量与矩阵的乘积vM，此函数为针对点的变换，即总是默认令Vw = 1:
XMVECTOR XM_CALLCONV XMVector3TransformCoord(
FXMVECTOR V,      // 输入向量v
CXMMATRIX M);     // 输入矩阵M

// 计算向量与矩阵的乘积vM，此函数为针对向量的变换，即总是默认令Vw = 0:
XMVECTOR XM_CALLCONV XMVector3TransformNormal(
FXMVECTOR V,       // 输入向量v 
CXMMATRIX M);      // 输入矩阵M
```

构建透视投影矩阵
```c++ nums
//返回投影矩阵
XMMATRIX XM_CALLCONV XMMatrixPerspectiveFovLH (
float FovAngleY,//用弧度制表示的垂直视场角
float Aspect,   //横纵比=宽度/高度
float NearZ,    //到近平面的距离
float FarZ) ;   //到远平面的距离

```
# 4 颜色运算
## 分量式乘法
```c++ nums
XMVECTOR XM_CALLCONV XMColorModulate(      // 返回c1⊗c2 颜色分量式乘法 
  FXMVECTOR c1,                             
  FXMVECTOR c2);  
```

## 格式转换
32 位颜色转换 128 位颜色: 通过将整数范围 $[0,255]$ 映射到实数区间 $[0,1]$

$$
(80,140,200,255)\to\left(\dfrac{80}{255},\dfrac{140}{255},\dfrac{200}{255},\dfrac{255}{255}\right)\approx(0.31,\:0.55,\:0.78,1.0)
$$
相反的 128 位颜色转换 32 位颜色：
$$
(0.3,0.6,0.9,1.0)\to(0.3\times255,0.6\times255,0.9\times255,1.0\times255)=(77,153,230,255)\quad\text{}
$$

由于在 `XMCOLOR` 中通常将 4 个 8 位颜色分量封装为一个 32 位整数值（例如，一个 unsigned int 类型的值)，因此在 32 位颜色与 128 位颜色互相转换的过程中常常需要进行一些额外的位运算（提取出每个量)。对此，DirectXMath 库中定义了一个获取 `XMCOLOR` 类型实例并返回其相应 `XMVECTOR` 类型值的函数:
```c++ nums
XMVECTOR XM_ CALLCONV PackedVector::XMLoadColor(const XMCOLOR*psource) ;
```

XMCOLOR 类中使用的格式位 ARGB
![[Pasted image 20230414143444.png]]
 `XMVECTOR` 转换至 `XMCOLOR`：
 ```c++ nums
 void XM_ CALLCONV PackedVector::XMStorecolor
(XMCOLOR* pDestination, FXMVECTOR V);
```

一般来说，128 位颜色值常用于高精度的颜色运算（例如位于像素着色器中的各种运算)。在这种情况下，由于运算所用的精度较高，因此可有效降低计算过程中所产生的误差。
但是，最终存储在后台缓冲区中的像素颜色数据，却往往都是以 32 位颜色值来表示。而目前的物理显示设备仍不足以充分发挥出更高色彩分辨率的优势。
