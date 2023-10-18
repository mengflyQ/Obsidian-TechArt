
# 1 动画剪辑

## Animation Clip 概念

在 Unity 中，**单个动画**存储在一个名为 `Animation Clip` 的资源中。它们与创建剪辑时选择的对象相关联，并存储用于创建特定动画的所有 **数据** 。

动画剪辑存储中的数据信息是随时间更改，可以是形变，如：Transform 中的位置、大小、旋转；也可以是所关联对象的外观着色变化（Shading），比如颜色、发光度等等。

动画剪辑可以是任意时间长度，单个游戏对象可以有多个与之关联的动画剪辑。

Unity 中，可以自建较为简单的动画剪辑，也支持导入外部动画。

## Unity 内创建动画剪辑

1.  打开 Animation 窗口：顶部菜单：Window > Animation > **Animation** ，Ctrl + 6 是快捷键
    
2.  在 Hierarchy 中选择要创建动画的游戏对象，在 Animation 窗口时间轴区域的中心位置点击 “Create” 按钮，创建动画剪辑
    
    ![[0b3b28d258093304d3bf584a2307f2e6_MD5.png]]
    
3.  在打开的窗口中，将动画剪辑保存在 Assets 文件夹内，最好新建一个专门用来存放动画剪辑的 Animations 文件夹，分类保存素材
    
    保存这个新的空动画剪辑时，Unity 会执行以下操作：
    
    *   创建新的 Animator Controller 资源
    *   将新剪辑以默认状态添加到 Animator Controller 中
    *   将 Animator 组件添加到要应用动画的游戏对象
    *   为 Animator 组件分配新的 Animator Controller
    ![[2ebffae667d588a0d922898258d2fecf_MD5.png]]
    
4.  编辑动画剪辑，添加关键帧，添加变化，形成完整动画片段
    
5.  如果需要，可以为同一个游戏对象添加多个动画剪辑
    
    ![[1d871362f805c528a2cdc1d02b53e9ce_MD5.png]]
    
6.  同一对象的不同的动画剪辑可以放入一个动画控制器中，进行管理，满足不同条件是进行切换
    
    ![[ec99148bf4f40ad9dc3d498cac7b69f9_MD5.png]]
    

## 2.2 创建并导入 Blender 动画

1.  Blender Animation 工作区中，在 动画摄影表 窗口中，调整模式为：动作编辑器，在中间点击 “新建” 按钮，创建 Action "动作" ，这个 Blender 动画系统中的 Action 动作，其实就对等于 Unity 里的 Animation Clip 动画剪辑（片段）
    
    ![[4e75a6af2607c1f1c010325e6c7e14ba_MD5.png]]
    
2.  在 时间线 窗口中，设置好结束点帧数，定位到关键帧，配置对象各项属性，blender 动画系统会自动补帧，形成动画
    
    ![[07efb2b0fe8f33ccd3ab2e1bd99fe8cf_MD5.png]]
    
3.  导出为 FBX ，注意下图中的各个配置项
    
    ![[73b1329d0d03a16889f26f514ff5e4da_MD5.png]]
    
4.  在 Unity 中，导入 FBX，并调整导入参数，为了让动画循环播放，将 LoopTime 复选框勾选
    
    ![[958e34d3c855b962e10bb7afe99e6d93_MD5.png]]
    
5.  将模型素材直接拖拽入 Hierarchy 或者 Scene 窗口，创建游戏对象，并将模型中的动画剪辑，直接拖拽到 Hierarchy 中的游戏对象上 拖拽动画剪辑的操作会产生下面这些效果，都由 Unity 自动完成：
    *   为游戏对象添加 Animator 组件
    *   生成新的动画控制器 Animation Controller，以游戏对象命名
    *   将 动画剪辑 自动添加到 Animation Controller，并配置为初始动画
6.  直接预览动画，或点击游戏运行，查看动画运行效果

## 2.3 导入 网络动画资源

对于一些学习 Unity 开发的程序员来说，模型制作已经很让人崩溃，更别说骨骼绑定和动画制作了。但学习过程中，还必须使用一些素材，最好的方式，就是去寻找网上免费资源。

基本上，各个不同网站上获取的资源，只要格式（后缀名）相同，操作基本一致，咱们在此就挑选其中最具代表性，质量最高的网站之一：[https://www.mixamo.com/](https://gitee.com/link?target=https%3A%2F%2Fwww.mixamo.com%2F)，来作为我们的例子。

![[98008aa3d533cfe14da22f58d7402b75_MD5.png]]

[https://www.mixamo.com/](https://gitee.com/link?target=https%3A%2F%2Fwww.mixamo.com%2F) 是 Adobe 为大家提供的免费的人物模型及动画资源网站，还提供自动骨骼绑定等功能。

大家甚至可以将自己做好的人物模型上传到 Mixamo 上，自动绑定骨骼，选取动画，并套用到自己的模型上。这样，你只需要进行人物建模，其他的交给 Mixamo，就能获取到一个完整的包含骨骼，以及各种大多数动作的角色了。

![[80705f155d83a686dd1e07541bf7e311_MD5.png]]

### [](#%E5%AF%BC%E5%85%A5-mixamo-%E8%A7%92%E8%89%B2%E5%8A%A8%E7%94%BB)导入 Mixamo 角色 & 动画

1.  在 Mixamo.com 网站上注册并登录，如果已经有 Adobe 账号，可以直接登录；
2.  网站左上角有两个分页，一个 Characters 角色，一个 Animations 动画，可以分开下载；
3.  选择在左侧一个角色，然后到右侧动画中，选中一个或一组动画，点击 Download 下载
    
    ![[9c37f7d201cfb222699e6e3d04c0fcf7_MD5.png]]
    
4.  配置适合自己的下载选项后，就可以下载了
    
    ![[db98b5bf18173f830b6636512c1fb80f_MD5.png]]
    ![[Pasted image 20230719221155.png]]
5.  导入方式参照上面导入 Blender 中的 4-6 步

## 导入素材时材质或纹理丢失问题解决

导入素材到 Unity 中时，一般来说，其中的材质和纹理需要配置一下，否则导入的会是白模（无材质、纹理）。大多数情况，都可以通过解压材质、纹理，修复材质方式解决。
