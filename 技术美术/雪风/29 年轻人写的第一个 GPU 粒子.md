       在上一篇专栏[上篇文章里的 computeShader 简介](https://www.bilibili.com/read/cv6995587)里，讲了一下 computeShader 里经常要用的容易混淆的词汇以及相互转换的计算公式，虽然生涩但是非常重要，请务必牢记于心。本次专栏将完成一个简单的 GPU 粒子效果，现在开始吧！

       **ComputeShader 部分**，声明自己要编译的核心函数；定义一个 time 来接收时间；定义一个 float4 来接收颜色；用 size 定义大小；定义一个结构体 buffer 来计算海量的粒子属性，它包括每个粒子的颜色和位置。

![[4ddd3874cfeb80b62d408a76867096cd_MD5.webp]]

         [numthreads(4,8,12)]，定义 ThreadGroup，在上一篇已说明。

         定义核心函数，该函数接收了 DispatchthreadID，我们需要根据这个 id 来计算出 DispatchIndex，计算公式在上篇文章有说明。然后赋予颜色，计算位置，位置计算这里是画圆形，然后根据 y 轴方向去缩放一下 xz 的大小，让它有葫芦状？（本质就是正弦波）。

![[217d3084737a56ff9b2c7ada49c1a98c_MD5.webp]]

      **C# 脚本部分**：C# 的脚本部分就非常简单了，我已经附上了大部分的注释来解释每一步代码的含义，这里我就不对重复的内容做解释了，如果有错误请务必在评论区指正。

![[f8ca8b5c1754c307cb607254ff28d919_MD5.webp]]

      **最后就是 shader 部分**，shader 嘛就非常简单了，和 computeshader 一样要定义相同的 buffer 来接收 computeshader 的数据（如果你不接收了那 computeshader 计算了一大堆就没有意义了）。

      顶点着色器函数接收的数据是顶点 id 哦，也就是 0 到 50w，不是 a2f 了，之前在 c# 里根据每个粒子的从 0 到 50w 已经赋予好 position 和 color 然后到 computeShader 里计算了并传到 buffer 里了，这里根据 id 直接去 buffer 里查找对应的粒子就可以得到该 id 对应的 position 和 color，然后把它转到齐次裁剪坐标系下，把颜色也赋予过去，顶点着色器就完成了。

       片元着色器直接把 color 输出即可。

![[a250fe38e4c83a7cbbf9b253908883d0_MD5.webp]]

最后附上源码，在码云已经挂上去了，b 站的专栏对代码确实不友好，以后都丢码云了。

https://gitee.com/matrixry/codes/rfy4a52bed130sg9786mh70

GIF

![[583bea0efb9c02ba2ceaaefce084e697_MD5.webp]]