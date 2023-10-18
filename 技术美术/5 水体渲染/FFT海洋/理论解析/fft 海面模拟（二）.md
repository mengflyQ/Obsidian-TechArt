接上一篇：[杨超：fft 海面模拟 (一)](https://zhuanlan.zhihu.com/p/64414956)

![[8a4558fb595a33e8680170a1b156642d_MD5.jpg]]

00:15

本篇说 FFT 算法。

FFT：Fast Fourier Transformation（快速傅里叶变换），是计算 DFT 的快速方法，而且能在 gpu 上实现。

# **一，递归形式的 FFT 算法及复杂度**

对于如下标准 DFT：

$X(k)=\sum_{n=0}^{N-1}{x(n)e^{-i\frac{2\pi k}{N}n}},k\in{\{0,1,...,N-1\}}$

注：为了书写方便，通常令 $W_{N}^{k}=e^{-i\frac{2\pi k}{N}}$ 。

可以看作是 N 个输入和 N 个输出的电器元件（N point DFT calculator），如图：

![[d298c92acb3550bf819c3cf47c960fb9_MD5.jpg]]

如果直接按 DFT 定义式暴力计算，每一个输出都需要计算 N 次乘法，故 N 个输出共需乘法 N*N 次，即算法复杂度为 O(N*N)，是比较高的。

快速傅里叶变换则是使用分治思想对 DFT 进行计算，可有效降低算法复杂度。

注：FFT 只用于计算 N 为 2 的幂的 DFT。

考虑如何用两个 N/2 point DFT calculator 去构造出一个 N point DFT calculator（N 为 2 的幂）。

如果将序号为偶数的输入给到第一个 N/2 point DFT calculator，序号为奇数的输入给到第二个 N/2 point DFT calcuator，如下图所示：

![[d10163011519a4bcd8b6c396c47e8b72_MD5.jpg]]

则有：

$G(k)=\sum_{n=0}^{\frac{N}{2}-1}{g(n)e^{-i\frac{2\pi k}{\frac{N}{2}}n}}=\sum_{n=0}^{\frac{N}{2}-1}{x(2n)e^{-i\frac{2\pi k}{\frac{N}{2}}n}},k\in{\{0,1,...,\frac{N}{2}-1\}}$

$H(k)=\sum_{n=0}^{\frac{N}{2}-1}{h(n)e^{-i\frac{2\pi k}{\frac{N}{2}}n}}=\sum_{n=0}^{\frac{N}{2}-1}{x(2n+1)e^{-i\frac{2\pi k}{\frac{N}{2}}n}},k\in{\{0,1,...,\frac{N}{2}-1\}}$

如何用 G(k) 和 H(k) 得到 X(k) 呢？

结论是：

$X(k)=\left\{\begin{matrix} G(k)+W_{N}^kH(k) &,k\in{\{0,1,...,\frac{N}{2}-1\}} \\ G(k-\frac{N}{2})+W_{N}^kH(k-\frac{N}{2}) & ,k\in{\{\frac{N}{2},\frac{N}{2}+1,...,N-1\}} \end{matrix}\right.$

推导过程如下：

当 $k\in{\{0,1,...,\frac{N}{2}-1\}}$ 时 G(k) 和 H(k) 均有定义，有：

$X(k)=\sum_{n=0}^{N-1}{x(n)e^{-i\frac{2\pi kn}{N}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi k(2n)}{N}}}+\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi k(2n+1)}{N}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi kn}{N/2}}}+e^{-i\frac{2\pi k}{N}}\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi kn}{N/2}}}$

$=G(k)+W_{N}^{k}H(k)$

当 $k\in{\{\frac{N}{2},\frac{N}{2}+1,...,N-1\}}$ 时，令 K=k-N/2，则 $K\in{\{0,1,...,\frac{N}{2}-1\}}$ , 有：

$X(k)=\sum_{n=0}^{N-1}{x(n)e^{-i\frac{2\pi kn}{N}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi k(2n)}{N}}}+\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi k(2n+1)}{N}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi (K+\frac{N}{2})(2n)}{N}}}+\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi (K+\frac{N}{2})(2n+1)}{N}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi Kn}{N/2}}}-e^{-i\frac{2\pi K}{N}}\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi Kn}{N/2}}}$

$=\sum_{n=0}^{N/2-1}{x(2n)e^{-i\frac{2\pi Kn}{N/2}}}+e^{-i\frac{2\pi k}{N}}\sum_{n=0}^{N/2-1}{x(2n+1)e^{-i\frac{2\pi Kn}{N/2}}}$

$=G(K)+W_{N}^{k}H(K)$

$=G(k-\frac{N}{2})+W_{N}^{k}H(k-\frac{N}{2})$

根据上面 X 与 H、G 的关系，可补全电路图如下：

![[6d847cbec5e094e4924d8765717e4400_MD5.jpg]]

至此完成了用两个 N/2 point DFT calculator 构造 N point DFT calculator。

以上就是递归形式的 FFT 算法。但递归形式一般效率不佳，尤其是不适合在 gpu 上实现，所以经典的 FFT 算法并不是采用这种形式，而是采用展平的形式，所谓蝶形网络（见下一节）。

无论是递归形式还是蝶形网络，算法复杂度的量级是一样的。下面计算算法复杂度：

设上面 N point DFT calculator 的乘法次数为 C(N)，则两个 N/2 point DFT calculator 的乘法次数均为 C(N/2)，又由 G 和 H 计算 X 另需 N 次乘法，故有：

C(N)=2*C(N/2 )+N

此递推方程求解如下：

![[b5848ac534d2f82aabb86b747f9f24b7_MD5.jpg]]

故算法复杂度为 $O(N*log_2N)$ ，是不是快了不少。

![[4b22f31edce441ea56ec897896e1eb76_MD5.gif]]

# **二，蝶形网络（**butterfly diagram**）**

用上一节的递归电路计算 4 point DFT，完整展开如下图所示：

![[42c5dfc1b5db553f865d115d6393bd0d_MD5.jpg]]

简化得：

![[da56d42a6d926f9ba6992c87ae359ef7_MD5.jpg]]

此即 4 point FFT 的蝶形网络。

另外可以利用公式 $W_{N}^{k+\frac{N}{2}}=-W_N^k$ 对蝶形网络权重作如下变形：

![[65a63a5edecffd23525808aeef1eab0f_MD5.jpg]]

得：

![[4e7bbf0ee22e22e1fa188f27f8d72a7c_MD5.jpg]]

这是 4 point FFT 蝶形网络的另一种形式。

类似的，8 point FFT 蝶形网络（第二种形式）为：

![[cc2328b46dc54fd98d819dd0d6547aa4_MD5.jpg]]

对于给定的 point 数，蝶形网络是固定，可预计算。在 fft 的 gpu 实现中，通常将其生成为 lut。

上图中还标出了 stage。使用蝶形网络计算 FFT，是按 stage 推进的：N 个输入经过第一个 stage 得到 N 个中间结果，再输入第二个 stage... 直至得到最终 N 个输出。N point FFT 有 $log_2N$ 个 stage。

# **三，bitreverse 算法**

注意到蝶形网络的 N 个输入的顺序是打乱的，以 8 point 蝶形网络为例，可以看到：

x(0) 在 0 号位，x(1) 在 4 号位，x(2) 在 2 号位，x(3) 在 6 号位，x(4) 在 1 号位，x(5) 在 5 号位，x(6) 在 3 号位，x(7) 在 7 位号。

对于一般 N point 的情况，这个顺序是否可以直接算出来呢？

答案是肯定的，有称为 bitreverse 的算法，说：

对于 N point 蝶形网络，求 x(k) 在几号位，只需将 k 化为 $log_2N$ 位二进制数，然后将 bit 反序，再转回十进制，所得结果即为 x(k) 所在位号。

以 8 point 蝶形网络为例，我们求 x(3) 在几号位，将 3 化为 $log_28=3$ 位二进制数得 011，bit 反序得 110，将 110 化回十进制得 6，所以 x(3) 在 6 号位。

下面是完整列表：（图取自：[OpenStax CNX](https://cnx.org/contents/zmcmahhR@7/Decimation-in-time-DIT-Radix-2-FFT)）

![[1689fa1e1bea27448cd3fc3656a39922_MD5.jpg]]

此算法看起来很神奇，但其实是比较容易理解的。

![[d0bec6fccc75882b3acc21e347a3dd04_MD5.jpg]]

作为事后诸葛，我估计它是这么想出来的：

![[ca4d4c422010f9f1d4d954dfbebe1c06_MD5.jpg]]

以上就是用于快速计算 DFT 的 FFT 算法。

# **四，IFFT**

回到海面模型，遗憾的是它并非 DFT 而是 IDFT，所以无法套用 FFT 算法。

![[4645f0de46102f998a24fe35e67d5091_MD5.jpg]]

不过没事儿，比较标准 DFT 和标准 IDFT 的表达式：

DFT：

$X(k)=\sum_{n=0}^{N-1}{x(n)e^{-i\frac{2\pi kn}{N}}},k\in{\{0,1,...,N-1\}}$

IDFT：

$x(n)=\frac{1}{N}\sum_{k=0}^{N-1}{X(k)e^{i\frac{2\pi kn}{N}}},n\in{\{0,1,...,N-1\}}$

我们发现，两者很像。所以，虽然无法直接套用，前者思路仍可运用于后者。

模仿 FFT 算法推导过程重来一遍，可以得到 IFFT 算法：

用两个 N/2 point IDFT calculator 去构造一个 N point IDFT calculator。将序号为偶数的输入给到第一个 N/2 point IDFT calculator，序号为奇数的输入给到第二个 N/2 point IDFT calcuator，如下图所示：

![[b157f55c8938c03084dd3b7b00d23bca_MD5.jpg]]

则有：

$G(n)=\frac{1}{N}\sum_{k=0}^{\frac{N}{2}-1}{g(k)e^{i\frac{2\pi kn}{\frac{N}{2}}}}=\frac{1}{N}\sum_{k=0}^{\frac{N}{2}-1}{x(2k)e^{i\frac{2\pi kn}{\frac{N}{2}}}},n\in{\{0,1,...,\frac{N}{2}-1\}}$

$H(n)=\frac{1}{N}\sum_{k=0}^{\frac{N}{2}-1}{h(k)e^{i\frac{2\pi kn}{\frac{N}{2}}}}=\frac{1}{N}\sum_{k=0}^{\frac{N}{2}-1}{x(2k+1)e^{i\frac{2\pi kn}{\frac{N}{2}}}},n\in{\{0,1,...,\frac{N}{2}-1\}}$

如何用 G(n) 和 H(n) 得到 x(n) 呢？

与前面类似方法可推得：

$x(n)=\left\{\begin{matrix} G(n)+W_{N}^{-n}H(n) &,n\in{\{0,1,...,\frac{N}{2}-1\}} \\ G(n-\frac{N}{2})+W_{N}^{-n}H(n-\frac{N}{2}) & ,n\in{\{\frac{N}{2},\frac{N}{2}+1,...,N-1\}} \end{matrix}\right.$

于是补全电路图：

![[ad47e20c67d33b2e2d2d39ac4e862460_MD5.jpg]]

与前面相同，取 N=4 将电路彻底展开并简化，得到 4 point IFFT 蝶形网络：

![[2b09a1ef4db8a29516d63f497cf88004_MD5.jpg]]

利用公式 $W_{N}^{-n-\frac{N}{2}}=-W_N^{-n}$ 可变形为第二种形式：

![[c5380bea1e7514aa43ecc7ae6ede5c30_MD5.jpg]]

8 point IFFT 蝶形网络（第二种形式）：

![[8a9948b56f2caab9325be91e846d76b3_MD5.jpg]]

另外，IFFT 的 bitreverse 与 FFT 相同。

最后由于 DFT/IDFT 是线性的，所以常数因子并不会影响算法。

故适用于标准 IDFT：

$x(n)=\frac{1}{N}\sum_{n=0}^{N-1}{X(k)e^{i\frac{2\pi kn}{N}}},n\in{\{0,1,...,N-1\}}$

的 IFFT 算法，可不加任何修改地应用于未归一化的 IDFT：

$x(n)=\sum_{n=0}^{N-1}{X(k)e^{i\frac{2\pi kn}{N}}},n\in{\{0,1,...,N-1\}}$

海面的 IDFT 模型更接近于后者。

--

下一篇说如何用 IFFT 计算海面 IDFT 模型。

下一篇：[杨超：fft 海面模拟（三）](https://zhuanlan.zhihu.com/p/65156063)