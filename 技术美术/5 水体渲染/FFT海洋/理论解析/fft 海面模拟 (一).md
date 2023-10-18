
本篇先讲基础理论和模型。

# **一，频谱，傅里叶变换与逆变换**

自变量为 $x$ 的函数 $f(x)$ 可看作一个随空间变化的信号（空间域信号），只要满足一定条件，它就可以表示为一堆不同频率的随空间变化的正弦信号（空间域正弦信号）的线性组合（或积分）。
>注：是求和还是积分，取决于信号是否具有周期性。

这些正弦信号（称为基底）的频率构成频域。如果将频域作为定义域，相应频率基底的振幅和相位作为函数值，则得到一个新函数 F(ω)。称为信号 $f(x)$ 的频谱。

>注：频域（Frequency Domain），空间域（Space Domain），时域（Time Domain）。**其中空间域和时域在数学上是一个意思，不同仅在于自变量用 x 还是 t**。图像处理领域，用空间域说法更恰当。

知道了频谱 $F(ω)$也就知道了 $f(x)$，反之亦然，二者是等价的，是同一个信号的两种不同表示方法。

由 $f(x)$ 求频谱 $F(ω)$，称为傅里叶变换。

由频谱 $F(ω)$ 求 $f(x)$，称为傅里叶逆变换。

**实际傅里叶变换 / 逆变换不是以正弦信号为基底**，而是以**复指数**信号 $e^{i\omega x}$ 为基底（i 为虚数单位），**频谱也相应地变成了复数**。

# **二，从三角形式到复数形式**


信号分解为基信号的线性组合（即傅里叶逆变换）有无数种方法，取决于基底形式的选择。不同基底形式导致不同的频谱形式。

（一）以带相位正弦信号作为基底：

$f(x)=\sum_{\omega}^{}{A(\omega)*sin(\omega x+\phi(\omega))}$

此时频谱需要给出振幅和相位，形式为 $F(\omega)=(A(\omega),\phi(\omega))$ 。

（二）以不带相位余弦和正弦信号联合作为基底：

使用三角恒等式$A*sin(\omega x+\phi)=A_{1}cos(\omega x)+A_{2}sin(\omega x)$ 对（一）作变形，得：

$f(x)=\sum_{\omega}^{}{(A_{1}(\omega)*cos(\omega x)+A_{2}(\omega)*sin(\omega x))}$

注：可以看出， $A_{2}(0)$ 取任意有限值都不影响结果。

此时频谱需要给出两个振幅 A1 和 A2，形式为 $F(\omega)=(A_{1}(\omega),A_{2}(\omega))$ 。

（三）**以复指数信号作为基底：**

使用欧拉恒等式 $cos(\omega x)=\frac{e^{i\omega x}+e^{-i\omega x}}{2},sin(\omega x)=\frac{e^{i\omega x}-e^{-i\omega x}}{2i}$ 对（二）作变形，得：

$f(x)=A_{1}(0)+\sum_{\omega(\omega>0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}+\sum_{\omega(\omega>0)}^{}\frac{A_{1}(\omega)+iA_{2}(\omega)}{2}e^{-i\omega x}$

上式还可以化简：

考虑到 $\omega\geq0$ ，也就是说频率只使用了正半轴，函数 $A_{1}(\omega)$ 和 $A_{2}(\omega)$ 也仅在正半轴上有定义，负半轴成了三不管地带我们可以为所欲为随便定义，所谓延拓。

我们将$A_{1}(\omega)$ 延拓成偶函数，将$A_{2}(\omega)$ 延拓成奇函数。

注意：奇函数必过原点，所以$A_{2}(\omega)$ 需满足 $A_{2}(0)=0$ ，因为前面已经说了 “$A_{2}(0)$ 取任意有限值都不影响结果”，所以这是能做到的。

延拓之后，有：

$f(x)=A_{1}(0)+\sum_{\omega(\omega>0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}+\sum_{\omega(\omega>0)}^{}\frac{A_{1}(-\omega)-iA_{2}(-\omega)}{2}e^{i(-\omega) x}$

$=A_{1}(0)+\sum_{\omega(\omega>0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}+\sum_{\omega(\omega<0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

或$=A_{1}(0)+\sum_{\omega(\omega>0 或\omega<0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

（由于 $A_{2}(0)=0$ )

或$=\frac{2*A_{1}(0)-iA_{2}(0)}{2}e^{i*0*x}+\sum_{\omega(\omega>0 或\omega<0)}^{}\frac{A_{1}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

（定义新函数 $A_{3}(\omega)=\left\{\begin{matrix} 2*A_{1}(\omega), \omega=0\\A_{1}(\omega) ,\omega\ne0 \end{matrix}\right.$ ）

或$=\frac{A_{3}(0)-iA_{2}(0)}{2}e^{i*0*x}+\sum_{\omega(\omega>0 或\omega<0)}^{}\frac{A_{3}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

或或$=\sum_{\omega(\omega>0或\omega=0或\omega<0)}^{}\frac{A_{3}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

$=\sum_{\omega}^{}\frac{A_{3}(\omega)-iA_{2}(\omega)}{2}e^{i\omega x}$

（令 $B(\omega)=\frac{A_{3}(\omega)-iA_{2}(\omega)}{2}$ ）

$=\sum_{\omega}^{}B(\omega)e^{i\omega x}$

化简完成。

需要注意，与前面两种形式不同，此时 $\omega$ 的取值范围（即频域）已经拓展到负半轴。

此时的频谱只需给出 B(ω)，故频谱形式为 F(ω)=B(ω)。

也就是说此时 B(ω) 恰好就是频谱。那不如干脆写成：

$f(x)=\sum_{\omega}^{}F(\omega)e^{i\omega x}$

此即复数形式的傅里叶逆变换，是不是很简洁。

![[b31264858d52a6a334d4f3a5abb438fd_MD5.jpg]]

由于 $e^{i\omega x}$ 是复数，所以频谱 F(ω) 也是复数。

这可以理解，因为频谱需要能解码出振幅和相位，所以必定需要两个分量。

# **三，傅里叶逆变换与海面模拟是如何扯上关系的**

如果将开放海域的波浪高度看作定义在 XZ 平面上的空间域信号 $h(x,z)$ ，根据经验，这个信号天然地就很接近大量正弦信号的叠加。如果我们知道了其频谱 $\tilde{h}(\omega_{x},\omega_{z})$ ，则使用傅里叶逆变换，就可以求出 $h(x,z)$ ，即得到海面的高度场。

由于计算机不能处理连续或无限的事物，所以海面模拟里用的傅里叶逆变换是离散傅里叶逆变换（Inverse Discrete Fourier Transform（IDFT)）。注：周期信号的频谱必定是离散的，但未必有限。

![[8e572af1a14c01e95ef231e9068ecadc_MD5.jpg]]

# **三，海面的 IDFT 模型**

海面高度由下面 IDFT 给出：

$h(\vec{x},t)=\sum_{\vec{k}}^{}{\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$

其中：

$\vec{x}=(x,z)$ 为空间域坐标。

$\vec{k}=(k_{x},k_{z})$ 为频域坐标。kx,kz 均为频率，相当于前文中的 $\omega_{x}$ 和 $\omega_{z}$ 。

$\tilde{h}(\vec{k},t)$ 为频谱。

这里频谱 $\tilde{h}(\vec{k},t)$ 较前文多了个参数 t，表示此频谱会随时间变化，相应地高度函数$h(\vec{x},t)$ 就也变成随时间变化的了，所以也加参数 t。

另外注意$e^{i\vec{k}\cdot \vec{x}}$ 中$\vec{k}$ 与$\vec{x}$ 是点乘，即 $e^{i(k_{x}x+k_{z}z)}$ ，表示：固定 z，只让 x 变化时频率为 $k_{x}$ ；固定 x，只让 z 变化时频率为 $k_{z}$ 。

求和是对所有频域坐标点$\vec{k}$ 进行。

$\vec{k}$ 在频率平面上以原点为中心每隔 $\frac{2\pi}{L}$ （L 为海面 patch 尺寸）取一个点，共 NxN 个点：

，$k_x=\frac{2\pi n}{L}，n \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

，$k_z=\frac{2\pi m}{L}，m \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

$\vec{x}$ 在 xz 平面上以原点为中心每隔 $\frac{L}{N}$ 取一个点，也是共 NxN 个点：

，$x=\frac{uL}{N}，u \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

，$z=\frac{vL}{N}，v \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

下图红点为频域点，蓝点为空间域点：

![[3942578c6c95cd10e0b16718165be066_MD5.jpg]]

对于游戏而言，通常取 N=64 就够用了，即 64^2=4096 个频率点，亦即 4096 个不同频率正弦信号叠加，这个叠加数量比一般 gerstner wave 多多了，所以细节更丰富。

另外可以验证，在 N 为偶数的情况下，以上所有频率值 k 对应的周期 T= $\frac{2\pi}{k}$ 均为 L 的约数，所以 $h(\vec{x},t)=\sum_{\vec{k}}^{}{\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$ 横向和纵向均以 L 为周期，也就是说海面 patch 是可以无缝 tiling 的。

# **四，菲利普频谱（Phillips spectrum）**

那么频谱$\tilde{h}(\vec{k},t)$ 为何呢？

通常采用的是菲利普频谱，公式如下：

$\tilde{h}(\vec{k},t)=\tilde{h}_{0}(\vec{k})e^{i\omega(k)t}+\tilde{h}_{0}^*(-\vec{k})e^{-i\omega(k)t}$

其中， $\tilde{h}_{0}^*$ 表示 $\tilde{h}_{0}$ 的共轭复数，k 表示 $\vec{k}$ 的模。

$\omega(k)=\sqrt{gk}$

其中 g 为重力加速度。

$\tilde{h}_{0}(\vec{k})=\frac{1}{\sqrt{2}}(\xi_{r}+i\xi_{i})\sqrt{P_{h}(\vec{k})}$

其中 $\xi_{r}$ 和 $\xi_{i}$ 是相互独立的随机数，均服从均值为 0，标准差为 1 的正态分布。

$P_{h}(\vec{k})=A\frac{e^{-1/(kL)^2}}{k^4}|\vec{k}\cdot\vec{w}|^2$

其中，w 是风向。L 和前面那个海面 patch 尺寸 L 字母用重了，不是一个东西，L 定义见下一条。

$L=\frac{V^2}{g}$

其中 V 为风速。

以上公式源于海洋统计学，我暂时无法给出更多解释。

![[f3110067dd1cfe22e69f6d75c1a464ff_MD5.jpg]]

其中生成服从标准正态分布的随机数对儿$(\xi_r,\xi_i)$ ，方法见：[杨超：生成服从标准正态分布的随机数](https://zhuanlan.zhihu.com/p/67776340)

# **五，法线**

上面用 IDFT 得到海面高度以后，用差分就可以求法线，但那样求出来的不是很精确。最精确的方法是直接推出法线的解析式。

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

又 梯度向量、up 向量、法向量 三者具有下图所示几何关系：

![[83cffe3c57011f127bc4444be5b1d538_MD5.jpg]]

所以有（注意，normalize 是必要的）：

$\vec{N}=normalize((0,1,0)-(\triangledown {h}_x(\vec{x},t),0,\triangledown{h}_z(\vec{x},t)))$

$=normalize(-\triangledown {h}_x(\vec{x},t),1,-\triangledown {h}_z(\vec{x},t))$

# **六，尖浪（**Choppy Waves**）**

在 gerstner wave 中，为了表现波峰尖角，使用下面公式在 xz 平面内进行挤压（红框中部分）：

![[46e4202e2b55209453431d647a793bbb_MD5.jpg]]

此处 IDFT 海面，同样需要类似挤压操作，公式为：

$\vec{D}(\vec{x},t)=\sum_{\vec{k}}^{}{-i\frac{\vec{k}}{k}\tilde{h}(\vec{k},t)e^{i\vec{k}\cdot\vec{x}}}$

$\vec{x}^{,}=\vec{x}+\lambda \vec{D}(\vec{x},t)$

不难看出，两者虽然写法不同，含义是一样的：即对 sin 波进行 cos 挤压，对 cos 波进行 sin 挤压。

当 xz 平面内挤压过头时，就会出现刺穿（如图所示）。恰好对应浪尖破碎形成泡沫的区域。

![[544cbe481f20abfeeedfbcd9777dea24_MD5.jpg]]

当发生刺穿时，局部发生翻转，表现在数学上，即面元有向面积变为负值。

那么如何求面元有向面积呢？同济高数下册里学过：二重积分换元法，雅可比行列式。

（找不到高数书的也可看这个：[杨超：二重积分换元法、雅可比行列式](https://zhuanlan.zhihu.com/p/65953562)）

因为 x'和 z'均为以 x,z 为变元的二元函数，即 x'=x'(x,z),z'=z'(x,z)，由二重积分换元法知变换后面积元为：

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

# **七，快速傅里叶变换（FFT）**

IDFT 如果用暴力求和的方法来计算会卡成翔，需要使用 FFT 来搞。

FFT 算法本来也算是基础理论，但本文已经比较长，而且今天太晚写不完了，就放到下一篇吧。

下一篇：[杨超：fft 海面模拟（二）](https://zhuanlan.zhihu.com/p/64726720)