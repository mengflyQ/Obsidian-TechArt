# GPU Instancing 深入浅出-基础篇 1
本章节主要是让大家对 Unity3d 中的 GPU-Instancing 是干什么用的有一个整体的了解，以及通过对官方手册的解读全方面的了解对 GPU Instancing。

深入浅出的 GPU Instancing 文章：会分成三个部分进行，

基础篇：了解 GPU instancing 的基础使用，小白可从此开始

中级篇：写一个自定义的 GPU instancing Shader，并让他变的更有趣，有一定经验的开发可以从这里开始。

高级篇：在 GPU Instancing 的 instance 中使用 GPU 动画，以及 GPU 草场的应用，元宇宙小伙伴可以从这里开始。

跟着文章由浅入深，相信只要看完整个系列的文章就能轻松搞定在大规模的程序开发中使用 GPU Instancing 的问题，本文主要来源一个小众《元宇宙》项目。

## GPU Instanceing 相关章节传送门

[梅川依福：GPU Instancing 深入浅出 - 基础篇（1）](https://zhuanlan.zhihu.com/p/523702434)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（3）](https://zhuanlan.zhihu.com/p/523924945)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（1）](https://zhuanlan.zhihu.com/p/524195324)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（2）](https://zhuanlan.zhihu.com/p/524285662)

## **一、GPU Instancing 定义**

### **1、对官网手册的解读**

[https://docs.unity.cn/cn/current/Manual/GPUInstancing.html](https://docs.unity.cn/cn/current/Manual/GPUInstancing.html)

![[5c36b3d05f9c086390c77c92de7e9efa_MD5.png]]

翻译：GPU Instancing 是一种 Draw call 的优化方案，使用一个 Draw call 就能渲染具有多个相同材质的网格对象。而这些网格的每个 copy 称为一个实例。此技术在一个场景中对于需要绘制多个相同对象来说是一个行之有效办法，例如树木或灌木丛的绘制。

GPU Instancing 在同一个 Draw call 中渲染完全相同的网格。可以通过添加变量来减少重复的外观，每个实例可以具有不同的属性，例如颜色或缩放。在 Frame Debugger 中如有 Draw calls 显示多个实例时会显示 “Darw Mesh (Instanced)”。

![[8abf091a0c5b68192f5b736476758d70_MD5.jpg]]

以上是 GPU Instancing 的官方说明，翻译时加入了自己的理解，不到位之处尽请谅解。

### 2、苍白文章的感知

从官方手册的解读中，我们似乎可以这么理解：即只有使用相同网格和相同材质的物体渲染时，才可以使用 GPU Instancing 技术，这样看来，我们使用 GPU Instancing 似乎只能渲染出来一堆网格和材质都一样的物体？那除了告诉用户 “看！我能渲染出这么多一样的东西，厉不厉害？！” 之外，似乎毫无乐趣可言。事实如此么？

那具体是什么效果还是用一些用例来看看吧。

## 二、GPU Instancing 可达到的效果

### 1、相同 Mesh 个性化显示

![[7a3538457e338cb83168b95907a2c177_MD5.jpg]]

### 2、多个 Mesh Instancing 效果

![[f2ded0444a0b6624bcdd0d079a77dd2e_MD5.jpg]]

### 3、大型效果场景的显示

![[a483036d146f2b4fc4a2865b803f40e2_MD5.gif]]

### 4、GPU Instancing 的高级动作应用

![[80435649d3e0807bd0b248cc2580f5fe_MD5.gif]]

### 5、GPU 在植被中的应用

![[c17813a18cb0027221461352e1c4b376_MD5.gif]]

看完以上效果不知道有没有想试试手的感觉，GPU Instancing 技术的应用其实很广，所以不要小看官网中那些苍白的文字描述，到 AssetStore 中看看。

说了这么多展示了这么多，不防继续来看官方手册关于 GPU Instancing 的一些约束，

## **三、需要注意的事**

### **1、在 SRP Batcher 时如何使用 GPU Instancing 技术**

其实不是不支持而是 SRP 有 SRP Batcher，以下官网说明，官网偷偷的告诉我们如果非要在 SRP 下使用 GPU instance 的话那可以使用 Graphics. DrawMeshInstanced，其实是直接 draw a mesh on screen。

![[b19193964f6b0c1281f751f9efffc323_MD5.png]]

### 2、SkinnedMeshRenderers 不支持 GPU Instancing 技术

![[e67b31e3b550b619bc82cc64ab23571a_MD5.png]]

其实本质资源是 GPU Instancing 仅支持 MeshRender，不直接支持 SkinnedMeshRender 的 Instance，想想如果支持了那不是所有蒙皮动画都可以 Instance，正常来说对于 SkinnedMeshRender 其实有办法支持，以下是使用 GPU 的顶点动画的方案进行的支持。

[https://github.com/Unity-Technologies/Animation-Instancing](https://github.com/Unity-Technologies/Animation-Instancing)

当然支持 Animation-Instancing 是有一定牺牲。

### **3、Lighting 对 GPU Instance 是支持的**

说了很多不可以，同时 Unity 抛砖引玉的说到了 Lighting 对 GPU instanceing 对象的不离不弃

![[2209ab3178dee127edd4c4ef17f5e8c9_MD5.jpg]]

从以上的信息可以看出 GPU Instancing 出的对象可以受光照的影响，看起来不错，只要设置一下就好了。

## **四、总结**

看完以上的介绍，我们对 GPU instancing 有一个大体的了解，从苍白的文档中看不出什么效果，后面的章节我们会由浅入深的对 GPU Instancing 从基础篇一直讲到高级的应用。
# GPU Instancing 深入浅出-基础篇 2
## 一、什么是 Draw Call

### 1、官方手册解读

老样子先看相应 [Optimizing draw calls - Unity 手册](https://docs.unity.cn/cn/current/Manual/optimizing-draw-calls.html)

![[aca47d199d3ff143e0c3bb4d1b1f0747_MD5.jpg]]

优化 Draw calls 优化 Draw calls

要在屏幕上绘制几何图形，unity 会调用图形 API 进行处理。一个 Draw call 会告诉图形 API 需要绘制什么以及使用什么方式进行绘制。每个 Draw call 包含了图形 API 所需要的纹理，阴影以及缓冲区的绘制信息。大量的 Draw call 会消耗大量的资源，但 Draw call 的准备通阶段要比 Draw call 本身消耗更多的资源。

## 二、一次 DrawCall 在做什么

以上是为自己的翻译，我们可以通过以下的 Gif 来感受一下 GPU 与 CPU 的通信，简单的来说 Draw call 其实是 CPU 与 GPU 的通信方式，他们通过 CommandBuffer 作为通信的 “信道”，其实每一次 GPU 与 CPU 的通信并没有我们想得的那么简单叫一个 Draw Call 其中的过程有很多步骤，所以 Unity3D 又叫作 Batch（批次）。

如下图所示：

![[1473df82a90f4da4a4e2ed7d59b7be0f_MD5.gif]]

GPU 渲染速度远远高于 CPU 提交命令的速度，如果一帧中间 DrawCall 数量太多，CPU 就会在设置渲染状态 - 提交 drawcall 上花费大量时间，造成性能问题，这里的性能问题其实是 GPU 在等待 CPU 的处理。

![[0d437877aa1505267e7a098e77ac4150_MD5.png]]

### 1、举个例子（测试用例 1）

我们可以通过 Unity3D 的一个案例来说明

想要用例下载见百度网盘：

链接: [https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0](https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0) 提取码: 9hf0  
链接: https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0 提取码: 9hf0

创建 Unity 工程，在场景中创建对象，并使用如下代码

```
using UnityEngine;
public class CreateCube : MonoBehaviour
{
    [SerializeField]
    private GameObject _instanceGo;//需要实例化对象
    [SerializeField]
    private int _instanceCount;//需要实例化个数
    [SerializeField]
    private bool _bRandPos = false;//是否随机的显示对象
    // Start is called before the first frame update
    void Start()
    {
        for (int i = 0; i < _instanceCount; i++)
        {
            Vector3 pos = new Vector3(i * 1.5f, 0, 0);
            GameObject pGO = GameObject.Instantiate<GameObject>(_instanceGo);
            pGO.transform.SetParent(gameObject.transform);
            if(_bRandPos)
            {
                pGO.transform.localPosition = Random.insideUnitSphere * 10.0f;
            }
            else
            {
                pGO.transform.localPosition = pos;
            }          
        }
    }
}
```

创建一个 NormalCubeCreate 的空节点挂上以上代码

并创建一个 Cube 把 Cube 制作成 prefab 后拖放到 NormalCubeCreate 中的 Instance Go 属性上中

![[07775b79c582a749ba06f90569fcfaed_MD5.jpg]]

运行后的效果

![[a557d5273a8a1426a806827c10dda6ea_MD5.jpg]]

### 2、用例分析

通过 Statistics 我们可以看到 Batches 为 12 这里的 Batches 为 Draw Call 的次数

![[377556e6383f0c02a2563d85d916bf95_MD5.jpg]]

打开 Frame Debug: Frame Debug 可以显示每一帧渲染时 CPU 与 GPU 的一些绘制信息

![[4838286226a41ff7f0bd5d07f4e22647_MD5.jpg]]

相应 的 Frame Debug 下的数据显示

![[35f9b802b26f570dab19b59994c90c75_MD5.jpg]]

通过以上的测试我们在 RenderForward.RenderLoopJob 中看到 10 个 Draw Mesh NormalCube(Clone) 的提交，相当于在同一帧中 CPU 与 GPU 提交了 10 次的绘制（Draw call），每画一个 Cube 就有一次 DrawCall 的调用。

那有没有更优的解决方案呢，如一次就把这十个对象都绘制上，当然有的，但是是有前提的那就是我们说的材质和网格需要相同（但不完全如此总归是有此约束）。

## 三、更优的 Draw Call 处理

### 1、优化方案

![[0dfcfcc657453aea0ab51fea328c8f3d_MD5.gif]]

通过以上的 GIF 我们可以这么理解，我们可以把需要绘制的相同内容同时放到 CommandBuffer 中再通知 GPU 进行绘制，这样可以有效的优化每绘制一个对象就调用一个转态转换让 GPU 进行显示效率要高。

![[3fa0efbc4be5c65064b9675c38788442_MD5.png]]

### 2、举个例子

我们可以通过 Unity3D 的一个案例来说明

创建 Unity 工程，在场景中创建对象，并使用测试用例 1 的代码

重新创建一个 Prefab 命名 InstanceCube, 在所使用的 Material 中选择 Enable GPU Instancing

![[1447fb5a92792400170255c67e407944_MD5.jpg]]

创建一个 GameObject 重名称为 InstanceCubeCreate 挂上 CreateCube 组件，把 InstanceCube

![[d9e5c32633fab054fc24bf6dad30709d_MD5.jpg]]

运行效果如下

![[c5ba71d0555da2889772a66b7612ad5e_MD5.jpg]]

### 2、用例分析

从 Statistics 中我们可以看到 Batches 变成了 3，而 RenderForward.RenderLoop.Job 为 1，我们仅仅只是在 Cube 的材质中打开了 Enable GPU Instancing 就达到了我们想要的效果（Batch 从 12 变成了 3）。其中 Frame Debug 中显示的 Draw Mesh(Instanced) 和官方文档中提到的

![[541859cc0a89493cdf98c6001286b5c2_MD5.png]]

表现完全一至看来是 GPU Instancing 起到了正向的作用。

## 四、总结

经过以上的使用我们初小掌握了 GPU Instancing 的使用，在 Material 中只要把开 “Enale GPU Instancing” 就有如上的运行效果，原来 GPU Instancing 如此的简单。似乎到此咱们就结束了相应的课程。

![[e7026373b15023409867f814202fea55_MD5.jpg]]

咱只是入了个门，路漫漫兮......

在下面的章节中我会给大家介绍，GPU Instancing 中的一些限制，这些限制我们要如何绕过去？当然方法很多。

# GPU Instancing 深入浅出-中级篇 1
## 前言

前几个章节大家对 Unity3d 中的 GPU-Instancing 的官方手册，原理，以及如何打开 GPU Instnacing 有了一个整体的了解，当前我们还是有不少的疑问？

1、GPU Instancing 对渲染批次的影响会带来什么效果呢？

2、GPU Instancing 一个批次是否可以显示无数的对象而没有限制呢？

3、为什么我们需要把一些 CPU 的处理放到 GPU 中去处理呢？

本节为基础篇的最后一篇，把以上问题搞明白就可以进到 “中级篇” 的学习。

跟着文章由浅入深，相信只要看完整个系列的文章就能轻松搞定在大规模的程序开发中使用 GPU Instancing 的问题，本文主要来源一个小众《元宇宙》项目。

## GPU Instanceing 相关章节传送门

[梅川依福：GPU Instancing 深入浅出 - 基础篇（1）](https://zhuanlan.zhihu.com/p/523702434)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（3）](https://zhuanlan.zhihu.com/p/523924945)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（1）](https://zhuanlan.zhihu.com/p/524195324)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（2）](https://zhuanlan.zhihu.com/p/524285662)  

## 一、使用 GPU 与 CPU 的性能比对

在项目工程中我们可以通过生成 10000 个对象进行 runtime 的性能比对

![[481f26d8df337ce85fe545fa74027163_MD5.jpg]]

![[48ea4739a578c7f22702f68be400a53e_MD5.jpg]]

![[c8c6d64cb89f4e531b41d3f79def816f_MD5.jpg]]

从性能比对上来看 CPU 的帧率在打开 GPU Instancing 相差至少在一倍，由此可见使用 GPU Instacing 的性能有较强的优势，从 Batches 来看 Batches 相差了近 500 倍。从中也可以看到 GPU Instancing 每个批次的 Instance 数量是有上限的，10000 /22 约有 500 个对象可以合成一个批次。这是为什么呢？

## 二、单批次最多可支持 511 个 Instance 的显示

### 1、FrameDebug 中的数据

在 10000 个对象显示的时候被分成了 20 个批次 Draw Mesh(instanced) 进行显示，且显示 Instances 511 个，为什么会是 511 的对象呢？

![[bb18c37753e863b1607c81881fcc639f_MD5.jpg]]

### 2、查阅资料

在 Unity5.5 的手册中对以上问题进行的回复 ，但是在后面的版本手册中并没有提及

![[417539a170af3f55138a1f2afe8759a4_MD5.jpg]]

意思：D3D 的常量缓存区 (constant buffers) 最大值为 64KB，对于 OpenGL 通常只有 16KB。如果你试图定义过多的属性每个 instance 属性就将达到这个上限值。Shaders 可能会发生编译错误或更多问题， Shader 编译器可能会崩溃。所以我们需要去平衡每个 instance 的属性和渲染 batch。（不知道为什么只是 Unity5.5 有这样的提示，大约早期 GPU Instance 技术还不成熟），但这个 constant buffers 的限制到现在也没有变化，差别在于不会崩溃会自动分批渲染。

### 3、对 Shader 中的宏定义分析

PS: 这里的内容看不明白没有关系，在中级篇中我们还会细化分析。

以下是在 Shader 中翻译出的宏，可以看到在 Shader 中 CBUFFER_START 与 CBUFFER_END 中定义了 int unity_BaseInstanceID 以及 UNITY_INSTANCING_BUFFER_START 中有两个 4X4 的 float, unity_ObjectToWorldArray 和 unity_WorldToObjectArray

![[632225c8ecd1101c134a829309dae8de_MD5.jpg]]

以上两个矩阵，每个矩阵使用 4*(float 的 size)*4(四行)*4（四列） = 64byte 两个矩阵为 128byte

constant Buffer 为 64KB = 65536 byte

65536btte/128byte = 512 个对象

但一个 Unity_BaseInstanceID 为 4 个 byte, 所以 512 个对象少一个刚好 511

以上是为什么显示 511 个对象的问题，其实在 OpenGL 上 constant Buff 只是 16K， 这样推理少了 4 倍那手机应该为 127 个对象。

## 三、让 GPU 动起来

为什么要让 GPU 动起来呢？GPU 和 CPU 到底有什么本质上的差异？

### 1、GPU vs CPU

首先我们来看到二者在架构上的差异  

![[c843a509e59868129a3d69df25d79f72_MD5.jpg]]

ALU: 是专门执行算术和逻辑运算的数字电路

可以通过图看到 CPU 与 GPU 的最大差别就是 CPU 的 ALU 远远小于 GPU 的 ALU，也就是为什么我们会在区域链中使用 GPU 进行挖矿的原因。

### 2、属性比对

以下是两者的一些性能比对

![[17d1feaae828986a5ef2f52b45dcbbe4_MD5.jpg]]

总的来说，如果我们的电脑里面有两个计算单元可以为我们服务，为什么不让这两个计算单元都运行起来，更好的支持应用或是游戏的开发呢？  

## 四、总结

本节主要比对了使用 GPU Instancing 与没有使用 GPU Instancing 的性能比对，因为我使用的是 mac，所以在性能上只有两倍的差距，事实在 Android 或是 windows 上 GPU Instancing 会有更优异的表现。同时在本章中我们也说明了 GPU 与 CPU 的架构的差异性，同时发挥两个计算单元的优势更能让应用或是游戏运行的更顺畅。

但我们也要知道 GPU Instancing 的一些限制性问题，单个批次显示 511 个对象，通过计算我们知道显示对象的个数的多少主要还是和 Instance 对象在 Shader 中所使用的参数有关，这块需要上层业务进一步权衡。

在此我们结束了 “基础篇” 的学习，开启下一个篇章《GPU Instancing 深入浅出 - 基础篇“中级篇”》

在初期篇中我们对 GPU Instancing 的使用有了一个基础的了解，知道了其简单的原理，以及简单的应用，甚至是一些在使用过程中的约束。

进入中级篇，之前是写给小白们看的，当前一些老司机可以通过中级篇开始上路了。

在中级篇中我们将会看

1、创建带有 Enable GPU Instancing 的 Shader  
1、创建带有 Enable GPU Instancing 的 Shader

2、使用 MaterialPropertyBlock 让 GPU Instancing 变的更有趣  
2、使用 MaterialPropertyBlock 让 GPU Instancing 变的更有趣

3、使用 Graphic.DrawMeshInstanced 进行无 GameObject 的 Instance 对象创建

相关测试工程传送门如下：

链接:[https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0](https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0) 提取码: 9hf0  
链接: https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0 提取码: 9hf0

跟着文章由浅入深，相信只要看完整个系列的文章就能轻松搞定在大规模的程序开发中使用 GPU Instancing 的问题，本文主要来源一个小众《元宇宙》项目。

## GPU Instanceing 相关章节传送门

[梅川依福：GPU Instancing 深入浅出 - 基础篇（1）](https://zhuanlan.zhihu.com/p/523702434)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（3）](https://zhuanlan.zhihu.com/p/523924945)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（1）](https://zhuanlan.zhihu.com/p/524195324)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（2）](https://zhuanlan.zhihu.com/p/524285662)

# GPU Instancing 深入浅出-基础篇 3
## 一、目的

### 1、Unity 默认支持

其实在 Unity 的默认渲染管线中的 Standard Shader 中默认都支持了 Enable GPU Instancing

![[4adf22ae58d521cfb658cfcb27b5ba6f_MD5.jpg]]

那为什么我们需要还需要自己在 Shader 中重新支持 Enable GPU Instancing 呢？其实在 SRP 中或是 URP 中或是自己定义的 Shader 中其实默认都不支持 Enable GPU Instancing，所以在写 Shader 的时候我们都会自己加入 GPU Instacing 的支持。对于 GPU Instancing 的支持 Unity 提供了一系列的宏，让用户自定义的 Shader 可以轻松支持 GPU Instancing。

### 2、Unity 手册描述

[Creating shaders that support GPU instancing - Unity 手册  
创建支持 GPU 实例化的着色器 - Unity 手册](https://docs.unity.cn/cn/current/Manual/gpu-instancing-shader.html)

![[18ae2d020b1278183775742e50973598_MD5.jpg]]

翻译

创建支持 GPU Instancing 的 Shader

本节内容包括了如何给用户自定义的 Shader 增加支持 GPU Instancing 的功能。本文首先介绍了自定义 Unity 着色器支持 GPU 实例化所需的 Shader 关键字、变量和函数。然后，本文内容还包括如何向曲面着色器和顶点 / 片段着色器添加逐实例数据的示例。

所以建议感兴趣的也可以先看看官方手册。

## 一、创建 Unlit 的自定义 Shader 材质球

下载测试工程的话可以在 3_MyInstanceShader 中进行学习

![[8f9e8cfda7dac0b5ca094f7dc9031757_MD5.jpg]]

### 1、创建 Unlit Shader 1、创建无光照着色器

![[ae6d234d704c7c0e61bd808c84b52b2d_MD5.jpg]]

然后左键 NewUnlitShader

![[d46f0c510d12936e2101b2514bd11995_MD5.jpg]]

### 2、创建材质 Unlit 材质球

如下创建使用 NewUnlitShader 右键创建 Material

![[42a8c3b78e1280a24ba50ee88f2bbfc1_MD5.jpg]]

创建出的 Material

![[ceae30fdb516a7a4f8008451a4b86681_MD5.jpg]]

没有相应的 Enable GPU Instancing 的选项。

那要如何才能快速支持 Enable GPU Instancing 呢？

## 二、让材质球支持 GPU Instancing

### 1、给我们的 Shader 命个名

需要给自定义的 Shader 定义一个自己的名字，双击 Shader 后对开始 Shader 的编写

![[66f4f289aa465ee44f3492943cad1f0c_MD5.png]]

```
Shader "Unlit/MyGPUInstance"
```

### 2、第一步：增加变体让 Shader 支持 instance

增加变体使用 Shader 可以支持 Instance

![[1ade084cd809ceeae4aa897287e3a151_MD5.jpg]]

```
//第一步： sharder 增加变体使用shader可以支持instance 
#pragma multi_compile_instancing
```

以上代码将使 Unity 生成着色器的两个变体，一个具有 GPU 实例化支持，一个不具有 GPU 实例化支持。

到我们的材质球上看看有什么变化

![[2465998150d1c7987ab8b3ace241afb9_MD5.jpg]]

是不是很神奇

官方手册说明

![[543d64922e959a11a6dc7941ffe75ce1_MD5.png]]

翻译：生成 instance 变体。这对于片段和顶点着色器是必需增加的。对于曲面着色器，它是可选的。

### 3、第二步 - 添加顶点着色器输入宏

instancID 加入顶点着色器输入结构

![[cea41d10d6d45be9791a5061a71d4ba2_MD5.jpg]]

```
//第二步：instancID 加入顶点着色器输入结构 
  UNITY_VERTEX_INPUT_INSTANCE_ID
```

宏翻译后如下其实就是增加了一个 SV_InstanceID 语义的 instanceID 变量

#define UNITY_VERTEX_INPUT_INSTANCE_ID unit instanceID : SV_InstanceID  
#define UNITY_VERTEX_INPUT_INSTANCE_ID 单位实例 ID ： SV_InstanceID

instanceID 主要作用是使用 GPU 实例化时，用作顶点属性的索引。

官方手册说明

![[c0cadec7e7369ea1a3abb2b941554673_MD5.jpg]]

翻译：在顶点着色器输入 / 输出结构体中定义 instance ID。要使用此宏，请启用 IINSTANCING_ON 关键字。否则，Unity 不会设置 instance ID。要访问 instance ID，请使用 #ifdef INSTANCING_ON 中的 vertexInput.instanceID 。如果不使用此块，变体将无法编译。

### 4、第三步 - 添加顶点着色器输出宏

instancID 加入顶点着色器输出结构

![[0ed25b5dddb2d2bd3a0c4e48171b071d_MD5.jpg]]

如第二步一样目的是增加一个 SV_InstanceID 语义的 nstanceID 变量，用作顶点属性的索引。

```
//第三步：instancID 加入顶点着色器输出结构 
  UNITY_VERTEX_INPUT_INSTANCE_ID
```

### 5、第四步 - 得到 instanceid 顶点的相关设置

![[d72f0899fa30002e98815ec680bea960_MD5.jpg]]

```
//第四步：instanceid在顶点的相关设置 
UNITY_SETUP_INSTANCE_ID(v);
```

#define UNITY_SETUP_INSTANCE_ID(input) \  
#define UNITY_SETUP_INSTANCE_ID（输入） \

unity_InstanceID = input.instanceID + unity_BaseInstanceID;  
unity_InstanceID = input.instanceID + unity_BaseInstanceID;

官方文档

![[407c58a4f1c43cc28bb0587a02f10cf1_MD5.jpg]]

翻译：允许着色器函数访问实例 ID。对于顶点着色器，开始时需要此宏。对于片段着色器，此添加是可选的。有关示例，请参见顶点和片段着色器。

### 6、第五步 - 传递 instanceID 顶点到片元角色器

![[5816b11bf52c294fff6957000cc6bb8b_MD5.jpg]]

```
//第五步：传递 instanceid 顶点到片元
UNITY_TRANSFER_INSTANCE_ID(v, o);
```

官方手册

![[c3a50e88e117c33b1db5879150767e63_MD5.png]]

翻译：在顶点着色器中将 InstanceID 从输入结构复制到输出结构。如果需要访问片段着色器中的每个实例数据，请使用此宏。

### 7、第六步 instanceID 在片元的相关设置

![[95d95fd746889e9716b84071b86f5372_MD5.jpg]]

```
//第六步：instanceid在片元的相关设置
UNITY_SETUP_INSTANCE_ID(i);
```

### 8、代码全展示

经过以上六个步骤后我们写成了自己带 GPU Instancing 的 Shader(MyGPUInstance)

```
Shader "Unlit/MyGPUInstance"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            //第一步： sharder 增加变体使用shader可以支持instance 
            #pragma multi_compile_instancing

            #pragma vertex vert
            #pragma fragment frag
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;

                //第二步：instancID 加入顶点着色器输入结构 
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
                //第三步：instancID加入顶点着色器输出结构
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                //第四步：instanceid在顶点的相关设置 
                UNITY_SETUP_INSTANCE_ID(v);
                //第五步：传递 instanceid 顶点到片元
                UNITY_TRANSFER_INSTANCE_ID(v, o);

                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                UNITY_TRANSFER_FOG(o,o.vertex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                //第六步：instanceid在片元的相关设置
                UNITY_SETUP_INSTANCE_ID(i);
                // sample the texture
                fixed4 col = tex2D(_MainTex, i.uv);
                // apply fog
                UNITY_APPLY_FOG(i.fogCoord, col);
                return col;
            }
            ENDCG
        }
    }
}
```

## 三、一个带有 GPU instancing 的测试

### 1、创建 Prefab 并使用相应材质

命名：Prefba 为 MyGPUInstanceCube  
命名：Prefba 为 MyGPUInstanceCube

![[bd875511a3e414eae49d9677767cd2d6_MD5.jpg]]

按以上截图创建相应的 Prefab

### 2、挂上之前的 CreateCube 脚本

并在 Instance GO 中使用 MyGPUInstanceCube 的 Prefba  
并在 Instance GO 中使用 MyGPUInstanceCube 的 Prefba

![[041f582d981e9a6b970d330e74758af9_MD5.jpg]]

CreatCube 代码传送门：[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

### 3、来测试一下

![[0a72535d8bfcc0c12efd82eec8a8b159_MD5.jpg]]

达成目标，批次为 4 个批次，优化了 510 个 Batcing.

## 四、总结

本节我们使用 Unity 的 Ulit 的 Shader 创建了我们自定义的 MyGPUInstance.shader，并通过六步依次添加了宏完成了自己定义的 Shadr 支持 GPU instancing 的制作。然后通过创建一个材质并在 Cube 中使用了本材质，通过 createCube 批量创建了 512 个 Cube 只使用了 2 个批次渲染了 512 个 Cube 对象。

但是我们测试用例真的比较丑，那我们是不是需要让这些白盒看起来好看一些呢？下一节我们会让我们的白盒子变的更有趣一些，不然我自己都看不下去了。

## 前言

在使用 GPU Instancing 技术有一个约束，必须使用相同材质和相同 Mesh 的对象才能使用 GPU Instancing，那都显示一样的对象就显的很无趣，有没有办法能让 GPU Instancing 中每个 Instance 有不同的表现呢？那当然有，这一节我会带大家对不同 Instance 的个性化属性进行学习。

相关测试工程传送门如下：

链接:[https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0](https://pan.baidu.com/s/1qoiiHGRbe_skt6Nercub8Q?pwd=9hf0) 提取码: 9hf0

## GPU Instanceing 相关章节传送门

[梅川依福：GPU Instancing 深入浅出 - 基础篇（1）](https://zhuanlan.zhihu.com/p/523702434)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

[梅川依福：GPU Instancing 深入浅出 - 基础篇（3）](https://zhuanlan.zhihu.com/p/523924945)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（1）](https://zhuanlan.zhihu.com/p/524195324)

[梅川依福：GPU Instancing 深入浅出 - 中级篇（2）](https://zhuanlan.zhihu.com/p/524285662)
# GPU Instancing 深入浅出-中级篇 2
## 一、明确目的

上一节我们的通过 GPU Instancing 技术通过 4（其中渲染 GPU 对象的只有 2 个批次）个批次渲染了 512 个对象，现在我们要让这些对象变的更有趣起来

![[d341614014987e737d601eb331e78ba6_MD5.jpg]]

![[9423951cf0c7c3cc78fa2c00a1c07ce5_MD5.gif]]

从两者比对来看，我们需要让每个 Cube Instance 有自己独立的颜色，同时这些 Instance 还能有自己的运动方式

## 二、所要使用的技术

### 1、什么是 MaterialPropertyBlock

![[cffff41a57f9d9db5ccdc3d03a2fb089_MD5.jpg]]

其实就是可以给每个实例对象通过 Render.SetPropertyBlock 设置相应的 MaterialPropertyBlock

### 2、官方测试代码

![[0156988a0f0a11108f95b9e830443eaf_MD5.jpg]]

```
using UnityEngine;

public class MaterialPropertyBlockExample : MonoBehaviour
{
    public GameObject[] objects;

    void Start()
    {
        //创建MaterialPropertyBlock
        MaterialPropertyBlock props = new MaterialPropertyBlock();
        MeshRenderer renderer;

        foreach (GameObject obj in objects)
        {
            float r = Random.Range(0.0f, 1.0f);
            float g = Random.Range(0.0f, 1.0f);
            float b = Random.Range(0.0f, 1.0f);
            //设置MaterialPropertyBlock所使用的颜色
            props.SetColor("_Color", new Color(r, g, b));
            //得到MeshRenderer
            renderer = obj.GetComponent<MeshRenderer>();
            //设置PropertyBlock
            renderer.SetPropertyBlock(props);
        }
    }
}
```

通过以上测试官方用例我们知道了如何给 Render 设置颜色

## 三、让我们的 Instance 变的有意思

### 1、增加相应 C# 脚本

相应 CubeCreate 传送门：[梅川依福：GPU Instancing 深入浅出 - 基础篇（2）](https://zhuanlan.zhihu.com/p/523765931)

```
using UnityEngine;

public class FunnyGPUInstance : MonoBehaviour
{
    [SerializeField]
    private GameObject _instanceGo;//初实例化对你
    [SerializeField]
    private int _instanceCount;//实例化个数
    [SerializeField]
    private bool _bRandPos = false;
 
    private MaterialPropertyBlock _mpb = null;//与buffer交换数据
    // Start is called before the first frame update
    void Start()
    {
        for (int i = 0; i < _instanceCount; i++)
        {
            Vector3 pos = new Vector3(i * 1.5f, 0, 0);
            GameObject pGO = GameObject.Instantiate<GameObject>(_instanceGo);
            pGO.transform.SetParent(gameObject.transform);
            if (_bRandPos)
            {
                pGO.transform.localPosition = Random.insideUnitSphere * 10.0f;
            }
            else
            {
                pGO.transform.localPosition = pos;
            }
            //个性化显示
            SetPropertyBlockByGameObject(pGO);

        }
    }

    //修改每个实例的PropertyBlock
    private bool SetPropertyBlockByGameObject(GameObject pGameObject)
    {
        if(pGameObject == null)
        {
            return false;
        }
        if(_mpb == null)
        {
            _mpb = new MaterialPropertyBlock();
        }

        //随机每个对象的颜色
        _mpb.SetColor("_Color", new Color(Random.Range(0f, 1f), Random.Range(0f, 1f), Random.Range(0f, 1f), 1.0f));
        _mpb.SetFloat("_Phi", Random.Range(-40f, 40f));

        MeshRenderer meshRenderer = pGameObject.GetComponent<MeshRenderer>();
        if (meshRenderer == null)
        {
            return false;         
        }

        meshRenderer.SetPropertyBlock(_mpb);

        return true;
    }
}
```

把脚本挂到

![[be52b736ff58a80a842c6e65804faeac_MD5.jpg]]

在随机对象中我们给 “_Color” 与“_Phi”设置了两组随机数值

```
_mpb.SetColor("_Color", new Color(Random.Range(0f, 1f), Random.Range(0f, 1f), Random.Range(0f, 1f), 1.0f));      
_mpb.SetFloat("_Phi", Random.Range(-40f, 40f));
```

从代码中我们可以看到我们给相应的对象设置了 MaterialPropertyBlock

```
meshRenderer.SetPropertyBlock(_mpb);
```

以上的_Color 与_Phi 是给 Material 中的 Shader 设置的参数

### 2、定义 Shader 的属性

在上一节中的 MyGPUInstance.Shader 中增加代码如下

上一节传送门 [梅川依福：GPU Instancing 深入浅出 - 中级篇（1）](https://zhuanlan.zhihu.com/p/524195324)

定义 Shader 的属性代码，此代码和 C# 的代码中的_mpb.SetColor("_Color",X,X,X)，_mpb.SetFloat("_Phi", Random.Range(-40f, 40f)); 配对使用

```
UNITY_INSTANCING_BUFFER_START(Props)
    UNITY_DEFINE_INSTANCED_PROP(float4,_Color)
    UNITY_DEFINE_INSTANCED_PROP(float, _Phi)
UNITY_INSTANCING_BUFFER_END(Props)
```

以上代码定义了一个 Props 的常量缓冲区，并且定义了 float4 的_Color 的属性与 float 的_Phi 属性

官方手册的解释

![[418b3554e80da54a773890acdd964f92_MD5.jpg]]

翻译

<table data-draft-node="block" data-draft-type="table" data-size="normal" data-row-style="normal"><tbody><tr><th>宏的名称</th><th>描述</th></tr><tr><td>UNITY_INSTANCING_BUFFER_Start(bufferName)</td><td>在每个实例的开始处声明名为 bufferName 的常量缓冲区。将此宏与 UNITY_NSTANCING_BUFFER_END 一起使用，可以包装要对每个实例唯一的属性声明。使用 UNITY_DEFINE_INSTANCED_PROP 声明缓冲区内的属性。</td></tr><tr><td>UNITY_INSTANCING_BUFFER_END(bufferName)</td><td>在每个实例的结尾处声明名为 bufferName 的常量缓冲区。将此宏与 UNITY_INSTANCING_BUFFER_START 一起使用，可以包装要对每个实例唯一的属性声明。使用 UNITY_DEFINE_INSTANCED_PROP 声明缓冲区内的属性。</td></tr><tr><td>UNITY)DEFINE_INSTANCED_PROP(type, propertyName)</td><td>使用指定的类型和名称定义每个实例着色器属性。在以下示例中，_Color 属性是唯一的。(可以上面的官方测试代码)</td></tr><tr><td>UNITY_ACCESS_INSTANCED_PROP</td><td></td></tr></tbody></table>

### 3、使用属性

C# 的脚本代码通过 Setcolor 或是 SetFloat 传递到 Shader 中，那在 Shader 中是如何使用的呢

在顶点着色器中通过 UNITY_ACCESS_INSTANCED_PROP(Props, _Phi); 进行属性访问

![[a7b2e289e960343a14fbaf6b14567ab1_MD5.png]]

翻译：在一个实例常量缓冲区中访问每个实例着色器属性。Unity 使用 Instance ID 索引实例数据数组。bufferName 必须与包含指定属性的常量缓冲区的名称匹配。此宏的编译方式对于 Instance_ON 和非 Instance 变体编译不同。

顶点着色器的代码如下，通过得到 _Phi 来让对象有不同的偏移值

```
v2f vert (appdata v) {
   v2f o;
   //第四步：instanceid在顶点的相关设置 
   UNITY_SETUP_INSTANCE_ID(v);
   //第五步：传递 instanceid 顶点到片元
   UNITY_TRANSFER_INSTANCE_ID(v, o);

   float phi = UNITY_ACCESS_INSTANCED_PROP(Props, _Phi);
   v.vertex = v.vertex + sin(_Time.y + phi);

   o.vertex = UnityObjectToClipPos(v.vertex);
   o.uv = TRANSFORM_TEX(v.uv, _MainTex);
   UNITY_TRANSFER_FOG(o,o.vertex);
   return o;
 }
```

片元着色器代码如下

得到 C# 的设置给 Shader 的 UNITY_ACCESS_INSTANCED_PROP(Props, _Color); 颜色，并让每个片元显示这个颜色值

```
fixed4 frag (v2f i) : SV_Target
{
   //第六步：instanceid在片元的相关设置
   UNITY_SETUP_INSTANCE_ID(i);

   //得到由CPU设置的颜色
   float4 col= UNITY_ACCESS_INSTANCED_PROP(Props, _Color);
   return col;   
}
```

与 FunnyGPUInstance 的代码

```
Shader "Unlit/FunnyGPUInstance"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            //第一步： sharder 增加变体使用shader可以支持instance 
            #pragma multi_compile_instancing

            #pragma vertex vert
            #pragma fragment frag
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            UNITY_INSTANCING_BUFFER_START(Props)
                UNITY_DEFINE_INSTANCED_PROP(float4,_Color)
	      	    UNITY_DEFINE_INSTANCED_PROP(float, _Phi)
            UNITY_INSTANCING_BUFFER_END(Props)

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;

                //第二步：instancID 加入顶点着色器输入结构 
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
                //第三步：instancID加入顶点着色器输出结构
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                //第四步：instanceid在顶点的相关设置 
                UNITY_SETUP_INSTANCE_ID(v);
                //第五步：传递 instanceid 顶点到片元
                UNITY_TRANSFER_INSTANCE_ID(v, o);

                float phi = UNITY_ACCESS_INSTANCED_PROP(Props, _Phi);
                v.vertex = v.vertex + sin(_Time.y + phi);

                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                UNITY_TRANSFER_FOG(o,o.vertex);

              
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                //第六步：instanceid在片元的相关设置
                UNITY_SETUP_INSTANCE_ID(i);

                //得到由CPU设置的颜色
                float4 col= UNITY_ACCESS_INSTANCED_PROP(Props, _Color);
                return col;
            }
            ENDCG
        }
    }
}
```

### 4、制作 FunnyGPUInstanceCube 的 prefab

![[38b21a3c19c70dcccfe1a9a991c44efa_MD5.jpg]]

把相应的 Prefab 拖放到 FunnyGPUInstanceCube 中

![[2d4930f99c66f51d3a46981f5db38d8a_MD5.jpg]]

### 5、测试效果

![[5617d7d6022185f2adacfc566a9aa0bd_MD5.jpg]]

Batches 为 3，并且动起来了，目标达成

## 四、总结

通过 MatermialPropertyBlock 我们通过 C# 代码给每个实例对象进行了属性设置，把一个死寂沉沉的 GPUInstancing 用例变的有趣起来。当然所有的这一切还是归功于 Shader 与 C# 的代码的配合。