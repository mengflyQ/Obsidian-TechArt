HLSL 提供了一些内置全局函数，它通常直接映射到指定的着色器汇编指令集。这里只列出一些比较常用的函数：

全部函数： [https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-intrinsic-functions](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-intrinsic-functions)
## clip，discard
通常，我们会在片元着色器中使用 clip 函数来进行透明度测试。
参数： 裁剪时使用的标量或矢量条件。
描述： 如果给定参数的任何一个分量是负数，就会舍弃当前像素的输出颜色。

```c
//定义
void clip(x)
{
	if(any(x < 0))
		discard;
}


//discard：丢弃像素
//在片段着色器中
if(input.uv > 0.5)
	dicard;

```

透明度测试中的常会添加一个阈值， `clip(texColor.a - _Cutoff)`，如果小于阈值，就裁剪掉。


**exp (x)**
**length (v)**
**distance (v1, v2)**：两点之间的欧几里德距离 ![[Pasted image 20221003192605.png]]

# saturate, clamp

`saturate(v)`: 将 v 夹取到 $[0,1]$ 区间.
`clamp(v,min,max)`: 将 v 夹取到 $[min, max]$ 区间

# 距离
`length` 向量到原点的距离
`distance` 两点距离
# 取数函数
`abs`：绝对值
`frac`：返回标量或每个矢量中各分量的**小数**部分（乘以大于 1 的数，曲线变密集，乘以小于 1 的数，曲线变稀疏）![[Pasted image 20230725155830.png|250]]
`trunc`：取整，去掉小数
`ceil`：向上取整
`floor`：向下取整。
`fmod (x, y)`: 返回 $x / y$ 的余数
`frac (x)`: 返回 $x$ 的小数
`rcp`：对每个分量求倒数 
`sqrt` ：平方根
`rsqrt` ：平方根的倒数
`round`: 四舍五入
`sign` ：返回 x 的正负，x<0返回-1，x=0返回0，x>0 返回 1
`any` 传入矢量，任何一个分量为非 0 返回 true，否则 false
`all` 传入矢量，所有分量均为非 0 返回 true，否则 false

# step,lerp,smoothstep 

`step(x,y):` 如果$x<=y$，则输出 $1$，否则输出 $0$
`lerp(x,y,a)` ：插值 `x*(1-a) + y*a`

`smoothstep (t1, t2, x)`: 用来生成 0 到 1 的平滑过渡值，也叫平滑阶梯函数.
**公式定义:**
```c
float smoothstep (float t1, float t2, float x)
{
    //值限制在0~1之间的原因是因为clamp函数的限制
    x = clamp ((x - t1) / (t2 - t1), 0, 1);
    return x * x * (3 - 2 *x);
}
```
**函数曲线:**
![[Diagram 3.svg]]
- 当 $t1 < t2$ 时，
    - $x=t1$ 时 $y=0$
    - $x=t2$ 时 $y=1$

- 当 $t1 > t2$
    - $x=t1$ 时，$y=1$
    - $x=t2$ 时，$y=0$

**应用举例:**
可以通过多个 smoothstep 叠加 / 相减，构造一些波形曲线。

假设式子（1）为：`smoothstep(1, 2, x)`；
（2）为：`smoothstep(2, 3, x)`;
（3）为：`smoothstep(3, 4, x)`
- （1）减（2）结果：在x的值为2时达到了峰值，并会往两边递减。
![[Pasted image 20230725145910.jpg|500]]
- （1）减（3）结果：同样的，峰值依旧会在第一个 smoothstep 中的 max 值与第二个 smoothstep 中的 min值之间产生，并随之会往两边递减。
 ![[Pasted image 20230725150202.jpg|500]]

> [!NOTE] 重要结论
> 两个` smoothstep (min, max, x) `函数相减，峰值会在第一个 smoothstep 中的 max 值与第二个 smoothstep 中的 min 值之间产生，并随之会往两边递减。
### 应用
**圆形mask实现：**
![[Pasted image 20230725153338.png|168]]
```cs
fixed4 frag (v2f i) : SV_Target
{
    // 先把uv坐标原点从左下角移至中心位置
    i.uv = i.uv * 2 - 1;  
    //通过length计算点（uv.x，uv.y）到原点的距离
    //由于t1>t2,x大于等于t1=0.5时，结果为0,x小于等于t2=0.2时，结果为1
    //表现就是距离uv中心越远，值越小
    return smoothstep(0.5, 0.2, length(i.uv));  
    
 }
```
![[Pasted image 20230725153611.png|261]]
```
smoothstep (0.2, 0.5, length (i.uv));  
```

**圆环 mask：**
![[Pasted image 20230725153711.png|170]] 减去 ![[Pasted image 20230725153729.png|171]] 等于 ![[Pasted image 20230725153404.png|160]]
```cs
fixed4 frag (v2f i) : SV_Target
{
    half l = length(i.uv - 0.5);
    float s1 = smoothstep(0.2, 0.3, l);
    float s2 = smoothstep(0.3, 0.4, l);
    return s1 - s2;
}
```

**距离场**

# 弧度角度
`degrees` ：弧度转换角度
`radians`：角度值转弧度
# reflect,refract

`reflect(i,n)`: 计算反射向量 (i 和 n 必须是归一化的)，使用公式 i - 2*n*dot (i, n)
`refract (i,n,eta)`: 计算折射向量 (i 和 n 必须是归一化的)，eta 为折射系数


# ddx,ddy,fwidth
## 定义

**GPU 在光栅化的时候一般以 2x2 的像素块为单位并行执行的。** 在这个 2x2 像素块当中，右侧的像素对应的 fragment 的 x 坐标减去左侧的像素对应的 fragment 的 x 坐标就是 ddx；下侧像素对应的 fragment 的坐标 y 减去上侧像素对应的 fragment 的坐标 y 就是 ddy。  

ddx , ddy 的计算规则如下图（注: dFdx, dFdy 是 GLSL 里的叫法）

![[842872b87359c92a610ee9f99bba8127_MD5.png|450]]
1. **`ddx，ddy` 反映了相邻像素在屏幕空间 x 和 y 方向上的距离（变化率）**
    - `ddx(v)` = 该像素点右边的 v 值 - 该像素点的 v 值  
    - `ddy(v)` = 该像素点下面的 v 值 - 该像素点的 v 值
    - `ddx(常量) = 0`，因为没有差值变化
1.  `fwidth(v) = abs(ddx(v) + ddy(v))`：**fwidth 反映了相邻像素在屏幕空间上的距离差值**.
    - `fwidth (pos)`：相邻像素位置的差值
    - `fwidth (normal)`：相邻像素法线的差值
    - `fwidth (uv)`：相邻像素 uv 的差值

## 应用举例：
### 计算 Mipmap Level

当相机离目标物体比较远时，当目标物体只占屏幕很小一块区域 (pixels), 这时如果还使用正常尺寸的 texture 对目标物体进行渲染，由于此时一个 pixel 对应多个 texel，导致采样不足出现走样。使用 Mipmap 就能解决这个问题，整个 texture 大小为原来的 1.33 倍，选择合适的 level，这样尽可能让 pixel 和 texel 一一对应 (同时也能减少 Cache Miss)。

![[8e9605977f310c6b72db592098f3445f_MD5.jpg]]

**Level 计算公式：**

$$
\rho=\max\left\{\sqrt{\left(\frac{\partial u}{\partial x}\right)^2+\left(\frac{\partial v}{\partial x}\right)^2+\left(\frac{\partial u}{\partial x}\right)^2},\sqrt{\left(\frac{\partial u}{\partial y}\right)^2+\left(\frac{\partial v}{\partial y}\right)^2+\left(\frac{\partial w}{\partial y}\right)^2}\right\}
$$

$$Mipmap Level = log_2 (ρ)$$

注：$w$ 是 3D 贴图的第三个坐标轴，对于 2D 贴图，$∂w/∂x$ 和$∂w/∂y$ 为 $0$;

$∂u/∂x$ 是 $u$ 对 $x$ 的偏微分 (也就是 $u$ 沿 $x$ 轴的变化率), 即 $ddx (u)$, 可以理解成当屏幕像素沿 $x$ 轴变换一个单位时，贴图沿 $u$ 方向变化了几个单位.

![[b5f733798149019e66cd179c37beec6d_MD5.png]]

### 边缘处理

**边缘突出**  
```c
Color += (ddx(Color) + ddy(Color)) * _Intensity;
```
![[Pasted image 20230722233401.png]]

**边缘亮化**  
```c
Color += fwidth(Color) * _Intensity;
```
![[Pasted image 20230722233412.png]]


### 计算表面法线


[[平面和线框着色#导数指令 ddx，ddy]]
```c
normal = normalize(cross(ddy(i.worldPos), ddx(i.worldPos)));
```
![[189df4a6706aa9f8085c04bbfb6df2c6_MD5.png]]

**ddx ddy 是如何工作的？**
GPU 需要知道纹理坐标的屏幕空间导数，以确定在采样纹理时使用哪个 mipmap 级别。它通过比较相邻碎片的坐标来计算这一点。
为了能够比较碎片，GPU 以 2×2 的块对它们进行处理。对于每个块，它确定两个 2×1 片段对在 X 维度上的两个导数，以及两个 1×2 片段对在 Y 维度上的二个导数。
**一对中的两个片段使用相同的导数数据。这意味着导数只在每个块上变化，每两个像素一次，而不是每个像素。**
因此，这些导数是一种近似值，当用于每个片段非线性变化的数据时，会显得块状。因为三角形是平的，所以这种近似不会影响我们导出的法向量。
GPU 总是处理 2×2 块中的片段，因此沿着三角形的边缘，片段将被处理，最终在三角形之外。这些无效片段被丢弃，但仍需要进行处理以确定导数。
在三角形之外，片段的插值数据被外推到顶点定义的范围之外。
![[Pasted image 20230811144106.png]]
>导数对的块



