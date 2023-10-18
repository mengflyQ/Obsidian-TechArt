

# 0 FFT相关数学
## 振幅、周期、相移和频率
有些函数（像[正弦和余弦](https://www.shuxuele.com/algebra/trig-sin-cos-tan-graphs.html)） 永远重复，它们叫**周期函数。**


$y = A sin (Bx + C) + D$

*   振幅是 $A$
*   角频率 $B$
*   周期是 $2π/B$ ，频率为周期的倒数
*   相移是 $−C/B$
*   垂直移位是 $D$
*   相位是 $Bx + C$

**周期**是从一个最高点到下一个最高点（或任何一点到下一个相对点）：

![[96dd33653dd84ae74cc6e2b9363ea089_MD5.svg]]


**频率**是在一个时间单位里发生多少次（每 "1"）。
$频率=\frac{1}{周期}$
例子：这个正弦函数在 0 到 1 之间重复了 4 次：

![[ca9f58389e42428d0337ec33391c3cf6_MD5.svg]]


**振幅**是从中（平）线到最高点的高度（或到最低点），也是从最高点到最低点的距离除以 2。

![[d79ec3499d643bc8ccccaeeb39a61b40_MD5.svg]]

**相移**是函数比通常的位置**水平**向**右移**了多远。

![[2a9fb6980154519d1a128d980b11ffee_MD5.svg]]

**垂直位移**是函数比通常的位置**垂直**向上移了多远。


例：$2 sin(4x − 2) + 3$
*   振幅 **A = 2**
*   周期 **2π/B** = **2π/4 = π/2**
*   相移 **−C/B** = **−(−2)/4 = 1/2**
*   垂直移位 **D = 3**

![[a95371e3ff488c053ab7455f2801bf18_MD5.svg]]

用文字写出来：

*   **2** 告诉我们它是比一般高了一倍，所以振幅 = 2
*   一般周期是 2**π**，但在这例子它是 "加快了"（短了）**4** 倍，所以周期 = **π/2**
*   **−2 代表函数向右移（正向左，负向右）**，但因为它也 "加快" 了 **4** 倍，所以函数只是移动了 **1/2**，故此相移 = **1/2**
*   最后，+3 的意思是中（平）线是 y = +3，所以垂直位移 = 3

注意：相移的公式 **−C/B** 有负号：

*   若 C 为正值，曲线向负方向（左）移
*   若 C 为负值，曲线向正方向（右）移

有时我们用 **t** 而不用 **x** （也可能用其他变量）：


## 简单的正弦波

我们在模拟水面时，如果水面的起伏不是非常明显，直接使用法线纹理动画就可以得到不错的结果 (在《UnityShader 入门精要》15.2 节, 有详细的讲解)。如果想要一些比较明显的波形，我们可以使用最简单的波形 - 正弦波，我们来看下最简单的公式形式

$y = sin(x)$

![[6a87be83ce5216ea9e0335abe118cd75_MD5.jpg]]

为了方便说明，这里的波形都是 2 维的，如果你想拓展到 3 维，可以参考《GPU Gems 1》第一章的内容。

我们可以看到，我们已经有了一个基本的波形。但是又有一些问题，我们不能控制他的形状，他也不会动。所以我们现在需要一些参数来控制他，我们加入第一个控制的参数振幅 A, 公式变为

$y = Asin(x)$

![[6ee09d4bba3b8faceb5d8a34fcbd1582_MD5.gif]]

我们调节振幅 A 的值，可以看到振幅就是从水平面到波峰的高度。然后加入第二个参数**角频率** $\omega$ ，公式为

$y = Asin(\omega x)$

![[cd8162e35bb272122e7a3c0cd292a0ee_MD5.gif]]

可以轻易的看出角频率 $\omega$ 指的是波动震动次数， $\omega$ 值越高波长 $L$ 越小，角频率 $\omega$ 与波长的关系为 $\omega = 2\pi/L$ , **波长 $L$ 是波的周期，也是波峰到波峰之间的距离**。至此我们已经改变波的基本形状，但是这个波是静止的，他并不会随着时间的推移而运动，我们添加一个时间参数 $t$ 和速度参数 $s$，用来控制波的运动，**一般使用相位常数 $\varphi$ 来表示速度,** $\varphi=s*2\pi/L=s\omega$ 公式为

$y = Asin(\omega x + t\varphi)$

$\displaystyle 相移 = \frac{-t\varphi}{\omega}=\frac{-ts \omega}{\omega}=-ts$，即向右移动 $-ts$

![[bcd20891bdc226638283a9fa7a862e0c_MD5.gif]]

至此我们的波已经可以动了，还可以在运动时修改振幅、频率等参数来改变波行，可喜可贺、可喜可贺。但是我们的工作还远没有结束，这个波显得太单一了，没有细节。那如何让他的波形变得更复杂呢，可以想到既然一个波行太单一，我们可以多加几个波，来让波形变得更加复杂。

$y=\Sigma A_{i}sin(\omega_{i}x+t\varphi_{i})$

![[98ba8ff27caec754b80ef54281e2b80a_MD5.gif]]

这里为了简单我们就进行了两个波的叠加。通过两个波的叠加就可以得到一个比之前更复杂的波形，如果想要更加复杂的波形，那就多加几个....

下图是截取《GPU Gems 1》对单个波函数参数的介绍

![[5f6300ea5b9feebc1f8640094be3343d_MD5.jpg]]

## Gerstner 波

对于正弦波所叠加起来的波，看起来比较圆滑，这适用于绘制一个平静的水面。但是对于粗狂的海洋，需要形成较尖的浪头和较宽的浪槽，我们选择使用 Gerstner 波。

Gerstner 波是**将水平位置进行挤压，使得波峰变尖，波谷变宽。** 下面简单演示了 Gerstner 是如何进行挤压的。

![[a2d921534a9cc60b61f42ab7397758e7_MD5.gif]]

这里我们可以清楚的看到一个简单的正弦波，是如何被挤压成比较野蛮的波。当挤压过头时，波峰就会形成环。来看一下 Gerstner 波的公式

![[5697eff8b8f39ed7024a2597d18e6ef5_MD5.jpg]]

这里是一个 3 维的公式， $x$ 、 $y$ 是水平坐标 (在 Unity 中 $y$ 指的是高度，这里的 xy 对应 Unity 的 xz)， $D$ 是波动方向。
- 先看 $z$ 坐标的表达式，其实就是我们之前所说简单的正弦波的叠加公式。
- 再看 $x$ 、 $y$ 表达式，他们的形式都是一样的，都加了一个 cos 波的偏移来进行挤压，前面的是控制挤压程度的参数 $Q_{i}$ 。当 $Q_{i}=0$ 时，我们就会得到一个简单的正弦波, 当 $Q_{i}=1/(\omega_{i}A_{i})$ 时会得到波峰最尖的波形。如果使用更大的值，就像我们上面那样，在波峰处形成环。如果想要复杂的波形那么叠加波就是了....

# 1 生成服从标准生成分布的随机数
在 fft 海面模拟中，需要生成服从标准生成分布的随机数（见：[杨超：fft 海面模拟 (一)](https://zhuanlan.zhihu.com/p/64414956)）。

我们知道数构造服从目标分布的随机数发生器，一般是采用反函数法：对目标分布的 CDF 求反函数，则当其输入服从 U (0,1) 的随机数时，就返回服从目标分布的随机数。（参考 pbrt 第三版第 13 章第 3 节）。

不过由于正态分布的 CDF 无法用初等函数表达，所以上面方法走不通，需另辟蹊径。

通常使用称为 Box-Muller 转换（Box-Muller transform）的方法来生成服从标准正态分布的随机数（对儿）。

## **一，Box-Muller 转换的基本形式（basic form）**

设 U1, U2 相互独立，均服从分布 U (0,1)

X= $Rcos\Theta=\sqrt{-2lnU_1}cos(2\pi U_2)$

Y= $Rsin\Theta=\sqrt{-2lnU_1}sin(2\pi U_2)$

则 X、Y 相互独立且均服从标准正态分布。

证明：

U1, U2~U (0,1) 所以 $p_{U_1}(u_1)=p_{U_2}(u_2)=1$。

因为 $\Theta=2\pi U_2$ ，根据一元随机变量函数分布（见：[杨超：pbrt 注解：transforming between distributions](https://zhuanlan.zhihu.com/p/67446317)）有：

$p_\Theta(\theta)=|\frac{d\theta}{du_2}|^{-1}p_{U_2}(u_2)$

$=|\frac{d(2 \pi u_2)}{du_2}|^{-1}p_{U_2}(u_2)$

$=\frac{1}{2 \pi}$

因为 $R=\sqrt{-2lnU_1}$ ，同样，根据一元随机变量函数分布，有：

$p_R(r)=|\frac{dr}{du_1}|^{-1}p_{U_1}(u_1)$

$=|\frac{d\sqrt{-2lnu_1}}{du_1}|^{-1}*1$

$=u_1\sqrt{-2lnu_1}$

(因为 $r=\sqrt{-2lnu_1}$ ，所以 $u_1=e^{-\frac{r^2}{2}}$，所以 )

$=r*e^{-\frac{r^2}{2}}$

因为 U1、U2 互相独立，而 $\Theta$ 只取决于 U2，R 只取决于 U1，所以 $\Theta$ 、R 互相独立。而独立随机变量联合分布等于边缘分布之积。所以

$p_{\Theta,R}(\theta,r)=p_{\Theta}(\theta)*p_R(r)=\frac{1}{2 \pi}r*e^{-\frac{r^2}{2}}$

因为

$X=Rcos\Theta$

$Y=Rsin\Theta$

根据二元随机变量函数分布（见：[杨超：pbrt 注解：transforming between distributions](https://zhuanlan.zhihu.com/p/67446317)），有：

$p_{X,Y}(x,y)=|J|^{-1}p_{\Theta,R}(\theta,r)$

其中

$J=\begin{vmatrix} \frac{\partial x}{\partial \theta} &\frac{\partial x}{\partial r} \\ \frac{\partial y}{\partial \theta} &\frac{\partial y}{\partial r} \end{vmatrix}$

$=\begin{vmatrix} \frac{\partial (r*cos\theta)}{\partial \theta} &\frac{\partial (r*cos\theta)}{\partial r} \\ \frac{\partial (r*sin\theta)}{\partial \theta} &\frac{\partial (r*sin\theta)}{\partial r} \end{vmatrix}$

$=\begin{vmatrix} -r*sin\theta & cos\theta \\ r*cos\theta&sin\theta \end{vmatrix}$

$=-r*sin^2\theta-r*cos^2\theta$

$=-r$

所以

$p_{X,Y}(x,y)=|-r|^{-1}*\frac{1}{2 \pi}r*e^{-\frac{r^2}{2}}$

$=\frac{1}{2 \pi}e^{-\frac{r^2}{2}}$

(因为 $r^2=x^2+y^2$ ，所以)

$=\frac{1}{2 \pi}e^{-\frac{x^2+y^2}{2}}$

所以

$p_X(x)=\int_{-\infty}^{\infty}p_{X,Y}(x,y)dy$

$=\int_{-\infty}^{\infty}\frac{1}{2\pi}e^{-\frac{x^2+y^2}{2}}dy$

$=\frac{1}{2\pi}e^{-\frac{x^2}{2}}\int_{-\infty}^{\infty}e^{-\frac{y^2}{2}}dy$

$=\frac{1}{2\pi}e^{-\frac{x^2}{2}}*\sqrt{2\pi}*\int_{-\infty}^{\infty}\frac{1}{\sqrt{2\pi}}e^{-\frac{y^2}{2}}dy$

(注意其中积分正好是标准正态分布密度函数的积分，故积分结果为 1)

$=\frac{1}{2\pi}e^{-\frac{x^2}{2}}*\sqrt{2\pi}*1$

$=\frac{1}{\sqrt{2\pi}}e^{-\frac{x^2}{2}}$

同理可得：

$p_Y(y)=\int_{-\infty}^{\infty}p_{X,Y}(x,y)dx=\frac{1}{\sqrt{2\pi}}e^{-\frac{y^2}{2}}$

可见 X 和 Y 均服从标准正态分布。又因可验证 $p_{X,Y}(x,y)=p_X(x)*p_Y(y)$ ，所以 X, Y 互相独立。

证毕。

## **二，Box-Muller 转换的极坐标形式（polar form）**

设 u, v 相互独立，均服从分布 U (-1,1)，但拒绝掉 $u^2+v^2=0$ 和 $u^2+v^2\geq1$ 的 (u, v) 对儿。

X= $u*\sqrt{\frac{-2lns}{s}}$

Y= $v*\sqrt{\frac{-2lns}{s}}$

其中 $s=u^2+v^2$

则 X、Y 相互独立且均服从标准正态分布。

证明：

实际上在 Box-Muller 转换的标准形式

X= $\sqrt{-2lnU_1}cos(2\pi U_2)$

Y= $\sqrt{-2lnU_1}sin(2\pi U_2)$

中，作变换 (*)：

$U_1=s$

$cos(2\pi U_2)=\frac{u}{\sqrt s}$

$sin(2\pi U_2)=\frac{v}{\sqrt s}$

即得

X= $u*\sqrt{\frac{-2lns}{s}}$

Y= $v*\sqrt{\frac{-2lns}{s}}$

但问题是上述变换 (*) 能满足 “U1, U2 相互独立，均服从分布 U (0,1)” 吗？

验证如下：

（1）首先确认 U1, U2 的取值范围均为 (0,1)：

![](https://pic2.zhimg.com/v2-f7a6610eebff35f3742aea5629912ed5_r.jpg)

如图，因为 (u, v) 均匀分布在单位圆内，而

$U_1=s=r^2$

故 U1 取值范围为 (0,1)。

又由图中看出 $2\pi U_2$ 即为辐角θ，因为θ取值范围为 $(0,2\pi)$ ，故 U2 取值范围为 (0,1)。

（2）再看 U1, U2 的分布：

因为 (u, v) 均匀分布在单位圆内，故 $p_{u,v}(u,v)=\frac{1}{\pi}$ 。

根据二元随机变量函数分布，有：

$p_{U_1,U_2}(u_1,u_2)=|J|^{-1}p_{u,v}(u,v)$

其中

$J=\begin{vmatrix} \frac{\partial u_1}{\partial u} &\frac{\partial u_1}{\partial v} \\ \frac{\partial u_2}{\partial u} &\frac{\partial u_2}{\partial v} \end{vmatrix}$

$\frac{\partial u_1}{\partial u}$ 和 $\frac{\partial u_1}{\partial v}$ 好求：

$\frac{\partial u_1}{\partial u}=\frac{\partial s}{\partial u}=\frac{\partial (u^2+v^2)}{\partial u}=2u$

$\frac{\partial u_1}{\partial v}=\frac{\partial s}{\partial v}=\frac{\partial (u^2+v^2)}{\partial v}=2v$

$\frac{\partial u_2}{\partial u}$ 和 $\frac{\partial u_2}{\partial v}$ 则需隐函数求导：

将 $cos(2\pi u_2)=\frac{u}{\sqrt s}$ 两边对 v 求导，得：

$-sin(2\pi u_2)*2\pi*\frac{\partial u_2}{\partial v}=-\frac{uv}{s\sqrt s}$

解得：

$\frac{\partial u_2}{\partial v}=\frac{uv}{s\sqrt s *sin(2\pi u_2)*2\pi}$

(因为 $sin(2\pi u_2)=\frac{v}{\sqrt s}$ ，所以)

$=\frac{uv}{s\sqrt s *(v/\sqrt s)*2\pi}$

$=\frac{u}{2\pi s}$

同理，将 $sin(2\pi u_2)=\frac{v}{\sqrt s}$ 两边对 u 求导，可解得：

$\frac{\partial u_2}{\partial u}=\frac{-v}{2\pi s}$

所以：

$J=\begin{vmatrix} \frac{\partial u_1}{\partial u} &\frac{\partial u_1}{\partial v} \\ \frac{\partial u_2}{\partial u} &\frac{\partial u_2}{\partial v} \end{vmatrix}$

$=\begin{vmatrix}2u &2v \\ \frac{-v}{2\pi s} &\frac{u}{2\pi s} \end{vmatrix}$

$=\frac{u^2+v^2}{s\pi}$

(因为 $u^2+v^2=s$ ，所以)

$=\frac{1}{\pi}$

所以

$p_{U_1,U_2}(u_1,u_2)=|J|^{-1}p_{u,v}(u,v)$

$=|\frac{1}{\pi}|^{-1}*\frac{1}{\pi}$

$=1$

所以

$p_{U_1}(u_1)=\int_{-\infty}^{\infty}p_{U_1,U_2}(u_1,u_2)du_2$

(因为 U2 取值范围为 (0,1)，所以)

$=\int_{0}^{1}1du_2$

$=1$

同理

$p_{U_2}(u_2)=\int_{-\infty}^{\infty}p_{U_1,U_2}(u_1,u_2)du_1=\int_{0}^{1}1du_1=1$

故 U1，U2 均服从 U (0,1)。

又 $p_{U_1,U_2}(u_1,u_2)=p_{U_1}(u_1)*p_{U_2}(u_2)$ ，故 U1, U2 相互独立。

证毕。

## **三，代码**

采用极坐标形式：

```
public Vector2 gaussianRandomVariablePair() {
		float x1, x2, w;
		do {
			x1 = 2f * Random.Range(0f,1f) - 1f;
			x2 = 2f * Random.Range(0f,1f) - 1f;
			w = x1 * x1 + x2 * x2;
		} while ( w >= 1f );
		w = Mathf.Sqrt((-2f * Mathf.Log(w)) / w);
		return new Vector2(x1 * w, x2 * w);
	}
```

# 2 法线的解析式推导
用差分就可以求法线，但那样求出来的不是很精确。最精确的方法是直接推出法线的解析式。

差分方法：假设我们想要计算点 $M_0$ 处的法线，我们需要计算两个切向量 $T_x$ 和 $T_y$ ，然后两者叉积就可以得到我们的法线。**对于求切向量就是对曲面方程求偏导就可以得到，因为我们这都是离散的点，可以直接取 $M_0$ 两侧的点，做差就可以求到。
![[a0c4e435a42580c72c32e743c3526dd2_MD5.jpg|450]]


**推解析式：**
因为高度是：

$h(\vec{x},t)=\sum_{\vec{k}}^{}{\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$

其空间梯度为：

$\triangledown h(\vec{x},t)=\sum_{\vec{k}}^{}{\tilde{h}(\vec{k},t)\triangledown e^{i\vec{k}\cdot\vec{x}}}$ （因为 $\tilde{h}(\vec{k},t)$ 并不包含空间变元，故可从梯度符号内移出）

而其中

$\triangledown e^{i\vec{k}\cdot\vec{x}}=(\frac{\partial e^{i(k_x*x+k_z*z)}}{\partial x},\frac{\partial e^{i(k_x*x+k_z*z)}}{\partial z})$

$=(e^{i(k_x*x+k_z*z)}*ik_x,e^{i(k_x*x+k_z*z)}*ik_z)$

$=e^{i(k_x*x+k_z*z)}*i(k_x,k_z)$

$=i\vec{k}e^{i\vec{k}\cdot\vec{x}}$

所以

$\triangledown h(\vec{x},t)=\sum_{\vec{k}}^{}{i\vec{k}\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$

又梯度向量、up 向量、法向量三者具有下图所示几何关系：

![[83cffe3c57011f127bc4444be5b1d538_MD5.jpg]]

所以有（注意，normalize 是必要的）：

$\vec{N}=normalize((0,1,0)-(\triangledown {h}_x(\vec{x},t),0,\triangledown{h}_z(\vec{x},t)))$

$=normalize(-\triangledown {h}_x(\vec{x},t),1,-\triangledown {h}_z(\vec{x},t))$


# 3 浪尖泡沫推导
在 gerstner wave 中，为了表现波峰尖角，使用下面公式在 xz 平面内进行挤压（红框中部分）：

![[46e4202e2b55209453431d647a793bbb_MD5.jpg]]

此处 IDFT 海面，同样需要类似挤压操作，公式为：

$\vec{D}(\vec{x},t)=\sum_{\vec{k}}^{}{-i\frac{\vec{k}}{k}\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$

$\vec{x}^{,}=\vec{x}+\lambda \vec{D}(\vec{x},t)$

不难看出，两者虽然写法不同，含义是一样的：**即对 sin 波进行 cos 挤压，对 cos 波进行 sin 挤压。**

**当 xz 平面内挤压过头时，就会出现刺穿（如图所示）。恰好对应浪尖破碎形成泡沫的区域。**

![[544cbe481f20abfeeedfbcd9777dea24_MD5.jpg]]

当发生刺穿时，局部发生翻转，表现在数学上，即面元有向面积变为负值。

**那么如何求面元有向面积呢？** 同济高数下册里学过：二重积分换元法，雅可比行列式。[[FFT相关推导#二重积分换元法、雅可比行列式]]

因为 x'和 z'均为以 x, z 为变元的二元函数，即 x'=x' (x, z), z'=z' (x, z)，由二重积分换元法知变换后面积元为：

$dA=\vec{dx'}\times \vec{dz'}= \begin{vmatrix} \frac{\partial x'}{\partial x} & \frac{\partial x'}{\partial z}\\ \frac{\partial z'}{\partial x}& \frac{\partial z'}{\partial z} \end{vmatrix}dxdz$

由于 dxdz 必定为正数，所以 dA 的正负就取决于雅可比行列式

$J(\vec{x})=\begin{vmatrix} J_{xx} &J_{xz} \\ J_{zx} & J_{zz} \end{vmatrix}= \begin{vmatrix} \frac{\partial x'}{\partial x} & \frac{\partial x'}{\partial z}\\ \frac{\partial z'}{\partial x}& \frac{\partial z'}{\partial z} \end{vmatrix}$

的正负。

由于 $\vec{x}^{,}=\vec{x}+\lambda \vec{D}(\vec{x},t)$ ，所以：

$J_{xx}=\frac{\partial x'}{\partial x}=1+\lambda\frac{\partial D_x(\vec{x},t)}{\partial x}$

$J_{zz}=\frac{\partial z'}{\partial z}=1+\lambda\frac{\partial D_z(\vec{x},t)}{\partial z}$

$J_{zx}=\frac{\partial z'}{\partial x}=\lambda\frac{\partial D_z(\vec{x},t)}{\partial x}$

$J_{xz}=\frac{\partial x'}{\partial z}=\lambda\frac{\partial D_x(\vec{x},t)}{\partial z}$

由于我们有 $\vec{D}(\vec{x},t)$ 的表达式，所以其实上面各偏导数都是可以求出来的。

如果真的去求，我们会发现 $J_{xz}=J_{zx}$，亦即 $\frac{\partial D_z(\vec{x},t)}{\partial x}=\frac{\partial D_x(\vec{x},t)}{\partial z}$ ，验证如下：

![[290e778049f1613a582f1da2442ca948_MD5.jpg]]


# 4 二重积分换元法、雅可比行列式
[[二重积分换元法、雅可比行列式]]

二重积分换元法同济高数下册有讲，当时没细看证明，近来用到搜了一下，感觉下面这样推比较直观：

![[dcfa47b288ff779b3e0f287006004b2b_MD5.jpg]]

$\vec{dx}=\vec{P'Q'}=Q'-P'$

$=f(Q)-f(P)$

$=f(u+du,v)-f(u,v)$  
$=\frac{f(u+du,v)-f(u,v)}{du}du$

$=\binom{\frac{x(u+du,v)-x(u,v)}{du}}{\frac{y(u+du,v)-y(u,v)}{du}}du$  
$=\binom{\frac{\partial x}{\partial u}du}{\frac{\partial y}{\partial u}du}$  
同理可得：

$\vec{dy}=\binom{\frac{\partial x}{\partial v}dv}{\frac{\partial y}{\partial v}dv}$

所以变换后面积元

$dA=\vec{dx}\times \vec{dy}$  
$=\binom{\frac{\partial x}{\partial u}du}{\frac{\partial y}{\partial u}du}\times \binom{\frac{\partial x}{\partial v}dv}{\frac{\partial y}{\partial v}dv}$

$=\begin{vmatrix} \frac{\partial x}{\partial u} & \frac{\partial x}{\partial v}\\ \frac{\partial y}{\partial u}& \frac{\partial y}{\partial v} \end{vmatrix}dudv$

**雅可比行列式的绝对值就是换元前后微元面积的比值。**
$dxdy=|J|dudv$