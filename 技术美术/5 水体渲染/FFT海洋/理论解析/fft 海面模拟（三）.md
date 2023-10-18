接上一篇：[杨超：fft 海面模拟（二）](https://zhuanlan.zhihu.com/p/64726720)

![[8a4558fb595a33e8680170a1b156642d_MD5.jpg]]

00:15

本篇说如何用 IFFT 计算海面 IDFT 模型。

将海面 IDFT 模型

$h(\vec{x},t)=\sum_{\vec{k}}\tilde{h}(\vec{k},t)e^{i\vec k \cdot \vec x}$

写成标量形式：

$h(x,z,t)=\sum_{m=-\frac{N}{2}}^{\frac{N}{2}-1}\sum_{n=-\frac{N}{2}}^{\frac{N}{2}-1}\tilde{h}(k_x,k_z,t)e^{i(k_xx+k_zz)}$

接下来将 kx 和 kz 展开，因为：

$k_x=\frac{2 \pi n}{L}, n\in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

$k_z=\frac{2 \pi m}{L}, m\in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

故：

$h(x,z,t)=\sum_{m=-\frac{N}{2}}^{\frac{N}{2}-1}\sum_{n=-\frac{N}{2}}^{\frac{N}{2}-1}\tilde{h}(\frac{2 \pi n}{L},\frac{2\pi m}{L},t)e^{i(\frac{2\pi n}{L}x+\frac{2 \pi m}{L}z)}$

为使下标从 0 开始，令 m'=m+N/2，n'=n+N/2，则 $m',n'\in{\{0,1,..,N-1\}}$ 。得：

$h(x,z,t)=\sum_{m'=0}^{N-1}\sum_{n'=0}^{N-1}\tilde{h}(\frac{2 \pi (n'-\frac{N}{2})}{L},\frac{2\pi (m'-\frac{N}{2})}{L},t)e^{i(\frac{2\pi (n'-\frac{N}{2})}{L}x+\frac{2 \pi (m'-\frac{N}{2})}{L}z)}$

令 $\tilde{h}'(n',m',t)=\tilde{h}(\frac{2 \pi (n'-\frac{N}{2})}{L},\frac{2\pi (m'-\frac{N}{2})}{L},t)$，并将 $e^{i\frac{2\pi(m'-\frac{N}{2})z}{L}}$ 由内层求和号中提出，得：

$h(x,z,t)=\sum_{m'=0}^{N-1}e^{i\frac{2\pi(m'-\frac{N}{2})z}{L}}\sum_{n'=0}^{N-1}\tilde{h}'(n',m',t)e^{i\frac{2 \pi(n'-\frac{N}{2})x}{L}}$

上式可拆成：

$h(x,z,t)=\sum_{m'=0}^{N-1}h''(x,m',t)e^{i\frac{2\pi(m'-\frac{N}{2})z}{L}}$

$\tilde h''(x,m',t)=\sum_{n'=0}^{N-1}\tilde{h}'(n',m',t)e^{i\frac{2 \pi(n'-\frac{N}{2})x}{L}}$

由于 L 长度可随意选取，为向 IDFT 形式靠拢，取 L=N，得：

$h(x,z,t)=(-1)^z\sum_{m'=0}^{N-1}\tilde h''(x,m',t)e^{i\frac{2\pi m'z}{N}}$ ...(a)

$\tilde h''(x,m',t)=(-1)^x\sum_{n'=0}^{N-1}\tilde{h}'(n',m',t)e^{i\frac{2 \pi n'x}{N}}$ ...(b)

接下来把 x 和 z 展开。因为：

，$x=\frac{uL}{N}，u \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

，$z=\frac{vL}{N}，v \in{\{-\frac{N}{2},-\frac{N}{2}+1,...,\frac{N}{2}-1\}}$

又因为 L=N，且为使下标变为从零开始，令 u'=u+N/2，v'=v+N/2，得：

，$x=u'-\frac{N}{2}，u' \in{\{0,1,...,N-1\}}$

，$z=v'-\frac{N}{2}，v' \in{\{0,1,...,N-1\}}$

代入 (a)、(b) 得：

$h(u'-\frac{N}{2},v'-\frac{N}{2},t)=(-1)^{v'-\frac{N}{2}}\sum_{m'=0}^{N-1}\tilde h''(u'-\frac{N}{2},m',t)e^{i\frac{2\pi m'v'}{N}}(-1)^{m'}$ ...(c)

$\tilde h''(u'-\frac{N}{2},m',t)=(-1)^{u'-\frac{N}{2}}\sum_{n'=0}^{N-1}\tilde{h}'(n',m',t)e^{i\frac{2 \pi n'u'}{N}}(-1)^{n'}$ ...(d)

令：

$A(u',v',t)=h(u'-\frac{N}{2},v'-\frac{N}{2},t)/(-1)^{v'-\frac{N}{2}}$

$B(u',m',t)=\tilde h''(u'-\frac{N}{2},m',t)(-1)^{m'}$

$C(u',m',t)=\tilde{h}''(u'-\frac{N}{2},m',t)/(-1)^{u'-\frac{N}{2}}$

$D(n',m',t)=\tilde{h}'(n',m',t)(-1)^{n'}$

则 (c)、(d) 变为：

$A(u',v',t)=\sum_{m'=0}^{N-1}B(u',m',t)e^{i\frac{2\pi m'v'}{N}}$ ...(1)

$C(u',m',t)=\sum_{n'=0}^{N-1}D(n',m',t)e^{i\frac{2 \pi n'u'}{N}}$ ...(2)

至此，已化成非归一化的 IDFT 形式，可以套用 IFFT 了！

总结起来海面 IFFT 计算流程如下：

1，根据菲利普频谱公式得到各 $\tilde{h}(k_x,k_z,t)$ 。（参见：[杨超：fft 海面模拟 (一)](https://zhuanlan.zhihu.com/p/64414956)）。

2，根据 $\tilde{h}'(n',m',t)=\tilde{h}(k_x,k_z,t)$ 得到各 $\tilde{h}'(n',m',t)$ 。

3，根据 $D(n',m',t)=\tilde{h}'(n',m',t)(-1)^{n'}$ 得到各 $D(n',m',t)$ 。(符号校正 1)。

4，根据（2）式计算行 IFFT，得到各 $C(u',m',t)$ 。

5，根据 $B(u',m',t)=C(u',m',t)(-1)^{m'+u'-\frac{N}{2}}$ 得到各 $B(u',m',t)$ 。(符号校正 2)。

6，根据（1）式计算列 IFFT，得到各 $A(u',v',t)$ 。

7，根据 $h(x,z,t)=A(u',v',t)(-1)^{v'-\frac{N}{2}}$ 得到各 $h(x,z,t)$ 。(符号校正 3)。

8，结束。

可见，计算量主要集中在 1，4，6 步，其余步骤均为简单转换。

以 N=4 为例：

假设 1，2，3 步已执行完，而后便是核心的计算行、列 IFFT 步骤（4~6 步），图示如下：

![[e5d32f5644c3f48d33bddadd0f998ed7_MD5.jpg]]

图中 IFFT(1)表示式 (1) 对应的 IFFT，IFFT(2)表示式 (2) 对应的 IFFT。

可见总共需要计算 8 个 4 point IFFT。（一般情况需要计算 2N 个 N point IFFT）。

最后再执行步骤 7 得到各 h(x,z,t) 即可。

如果是 gpu 实现，则那 4 个 IFFT(2) 可以并行，4 个 IFFT(1) 也可以并行。故一般情况下 gpu 实现只相当于计算 2 个 N point IFFT 的量。飞起。

![[ec8bfac4a42ff55bfdc02bb7b2981528_MD5.jpg]]

至此，FFT 海面整个逻辑链条都理清了。

关于实现和优化细节也有一些技巧值得一说，例如 “蝶形 lut 生成”、“stage 乒乓”、“分帧插值”，或许以后再另写一篇。本系列重在原理，就先这样了。

