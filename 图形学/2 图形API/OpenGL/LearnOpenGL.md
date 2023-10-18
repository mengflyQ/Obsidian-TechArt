
Open Graphics Library

本站的教程都是基于OpenGL 3.3或更高版本

[[https://blog.csdn.net/xiao_ran_give_up/article/details/124209930#:~:text=在LearnOpenGL中将采用,GLFW%2BCMake%2BGLAD%2BVS2022 来进行OpenGL的环境搭建。]]


# 图形学

## 坐标点和像素

2D坐标和像素是不同的，2D坐标精确表示一个点在2D空间中的位置，而2D像素是这个点的近似值，2D像素受到你的屏幕/窗口分辨率的限制。

## RGBA

在计算机图形中颜色被表示为有4个元素的数组：**红色、绿色、蓝色和alpha(透明度)**分量，通常缩写为RGBA。当在OpenGL或GLSL中定义一个颜色的时候，我们把颜色每个分量的强度设置在0.0到1.0之间。比如说我们设置红为1.0f，绿为1.0f，我们会得到两个颜色的混合色，即黄色。这三种颜色分量的不同调配可以生成超过1600万种不同的颜色！

## 图元(Primitive)

为了让OpenGL知道我们的坐标和颜色值构成的到底是什么，OpenGL需要你去指定这些数据所表示的渲染类型。我们是希望把这些数据渲染成一系列的点？一系列的三角形？还是仅仅是一个长长的线？做出的这些提示叫做图元(Primitive)，任何一个**绘制指令**的调用都将把图元传递给OpenGL。这是其中的几个：**GL_POINTS、GL_TRIANGLES、GL_LINE_STRIP**。

## 片段(Fragment)

OpenGL中的一个片段是OpenGL渲染一个像素所需的所有数据。

## 网格（Mesh）

当使用建模工具对物体建模的时候，艺术家通常不会用单个形状创建出整个模型。通常每个模型都由几个子模型/形状组合而成。组合模型的每个单独的形状就叫做一个网格(Mesh)。比如说有一个人形的角色：艺术家通常会将头部、四肢、衣服、武器建模为分开的组件，并将这些网格组合而成的结果表现为最终的模型**。一个网格是我们在OpenGL中绘制物体所需的最小单位（顶点数据、索引和材质属性）。一个模型（通常）会包括多个网格。**网格(Mesh)代表的是单个的可绘制实体。

## 管线（Pipeline）

![[pipeline.png|img]]

图形渲染管线接受一组3D坐标，然后把它们转变为你屏幕上的有色2D像素输出。图形渲染管线可以被划分为两个主要部分：第一部分把你的3D坐标转换为2D坐标，第二部分是把2D坐标转变为实际的有颜色的像素。

顶点、片段、几何着色器（图中蓝色部分）是可以自定义的。在现代OpenGL中，我们**必须**定义至少一个顶点着色器和一个片元着色器（因为GPU中没有默认的顶点/片元着色器），几何着色器是可选的，通常使用它默认的着色器就行了。

**工作流程：**

（1）首先，我们以数组的形式传递3个3D坐标作为图形渲染管线的输入，用来表示一个三角形，这个数组叫做顶点数据(Vertex Data)；顶点数据是一系列顶点的集合。一个顶点(Vertex)是一个3D坐标的数据的集合。而顶点数据是用顶点属性(Vertex Attribute)表示的，它可以包含任何我们想用的数据，但是简单起见，我们还是假定每个顶点只由一个3D位置(译注1)和一些颜色值组成的吧。

（2）图形渲染管线的第一个部分是**顶点着色器(Vertex Shader)**，它把一个单独的顶点作为输入。顶点着色器主要的目的是**把3D坐标转为另一种3D坐标**（后面会解释），同时顶点着色器允许我们对顶点属性进行一些基本处理。

（3）**图元装配(Primitive Assembly)阶段**将顶点着色器输出的所有顶点作为输入（如果是GL_POINTS，那么就是一个顶点），并所有的点装配成指定图元的形状；本节例子中是一个三角形。

（4）图元装配阶段的输出会传递给**几何着色器(Geometry Shader)**。几何着色器把图元形式的一系列顶点的集合作为输入，它可以通过产生新顶点构造出新的（或是其它的）图元来生成其他形状。例子中，它生成了另一个三角形。

（5）几何着色器的输出会被传入**光栅化阶段(Rasterization Stage)**，这里它会**把图元映射为最终屏幕上相应的像素，生成供片元着色器(Fragment Shader)使用的片段(Fragment)。**在片元着色器运行之前会执行**裁切(Clipping)**。裁切会丢弃超出你的视图以外的所有像素，用来提升执行效率。

（6）**片元着色器**的主要目的是**计算一个像素的最终颜色**，这也是所有OpenGL高级效果产生的地方。通常，片元着色器包含3D场景的数据（比如光照、阴影、光的颜色等等），这些数据可以被用来计算最终像素的颜色。

（7）在所有对应颜色值确定以后，最终的对象将会被传到最后一个阶段，我们叫做**Alpha测试和混合(Blending)阶段**。这个阶段检测片段的对应的深度（和模板(Stencil)）值（后面会讲），用它们来判断这个像素是其它物体的前面还是后面，决定是否应该丢弃。这个阶段也会检查alpha值（alpha值定义了一个物体的透明度）并对物体进行混合(Blend)。所以，即使在片元着色器中计算出来了一个像素输出的颜色，在渲染多个三角形的时候最后的像素颜色也可能完全不同。

## 坐标系统

**OpenGL希望在每次顶点着色器运行后，我们可见的所有顶点都为标准化设备坐标(Normalized Device Coordinate, NDC)。**也就是说，每个顶点的**x**，**y**，**z**坐标都应该在**-1.0**到**1.0**之间，超出这个坐标范围的顶点都将不可见。**我们通常会自己设定一个坐标的范围，之后再在顶点着色器中将这些坐标变换为标准化设备坐标。**然后将这些标准化设备坐标传入光栅器(Rasterizer)，将它们变换为屏幕上的二维坐标或像素。

将坐标变换为标准化设备坐标，接着再转化为屏幕坐标的过程通常是分步进行的，也就是类似于流水线那样子。在流水线中，物体的顶点在最终转化为屏幕坐标之前还会被变换到多个坐标系统(Coordinate System)。**将物体的坐标变换到几个过渡坐标系(Intermediate Coordinate System)的优点在于，在这些特定的坐标系统中，一些操作或运算更加方便和容易，这一点很快就会变得很明显。**对我们来说比较重要的总共有5个不同的坐标系统：

- **局部空间(Local Space，或者称为物体空间(Object Space))**
- **世界空间(World Space)**
- **观察空间(View Space，或者称为视觉空间(Eye Space))**
- **裁剪空间(Clip Space)**
- **屏幕空间(Screen Space)**

这就是一个顶点在最终被转化为片段之前需要经历的所有不同状态。

你现在可能会对什么是坐标空间，什么是坐标系统感到非常困惑，所以我们将用一种更加通俗的方式来解释它们。下面，我们将显示一个整体的图片，之后我们会讲解每个空间的具体功能。

### 概述

为了将坐标从一个坐标系变换到另一个坐标系，我们需要用到几个变换矩阵，最重要的几个分别是**模型(Model)、观察(View)、投影(Projection)三个矩阵**。我们的顶点坐标起始于局部空间(Local Space)，在这里它称为局部坐标(Local Coordinate)，它在之后会变为世界坐标(World Coordinate)，观察坐标(View Coordinate)，裁剪坐标(Clip Coordinate)，并最后以屏幕坐标(Screen Coordinate)的形式结束。下面的这张图展示了整个流程以及各个变换过程做了什么：

![[coordinate_systems.png]]



1. **局部坐标是对象相对于局部原点的坐标，也是物体起始的坐标。**
2. 下一步是将局部坐标变换为世界空间坐标，**世界空间坐标**是处于一个更大的空间范围的。这些坐标相**对于世界的全局原点**，它们会和其它物体一起相对于世界的原点进行摆放。
3. 接下来我们将世界坐标变换为**观察空间坐标**，使得每个坐标都是**从摄像机或者说观察者的角度**进行观察的。
4. 坐标到达观察空间之后，我们需要将其投影到**裁剪坐标**。裁剪坐标会被处理至**-1.0到1.0**的范围内，并判断哪些顶点将会出现在屏幕上。
5. 最后，我们将裁剪坐标变换为**屏幕坐标**，我们将使用一个叫做**视口变换(Viewport Transform)**的过程。视口变换将位于-1.0到1.0范围的坐标变换到由`glViewport`函数所定义的坐标范围内。最后变换出来的坐标将会送到光栅器，将其转化为片段。

你可能已经大致了解了每个坐标空间的作用。**我们之所以将顶点变换到各个不同的空间的原因是有些操作在特定的坐标系统中才有意义且更方便。**例如，当需要对物体进行修改的时候，在局部空间中来操作会更说得通；如果要对一个物体做出一个相对于其它物体位置的操作时，在世界坐标系中来做这个才更说得通，等等。如果我们愿意，我们也可以定义一个直接从局部空间变换到裁剪空间的变换矩阵，但那样会失去很多灵活性。

接下来我们将要更仔细地讨论各个坐标系统。

### 局部空间

**局部空间是指物体所在的坐标空间，即对象最开始所在的地方。**想象你在一个建模软件（比如说Blender）中创建了一个立方体。你创建的立方体的原点有可能位于(0, 0, 0)，即便它有可能最后在程序中处于完全不同的位置。甚至有可能你创建的所有模型都以(0, 0, 0)为初始位置（译注：然而它们会最终出现在世界的不同位置）。所以，你的模型的所有顶点都是在**局部**空间中：它们相对于你的物体来说都是局部的。

我们一直使用的那个箱子的顶点是被设定在-0.5到0.5的坐标范围中，(0, 0)是它的原点。这些都是局部坐标。

### 世界空间

如果我们将我们所有的物体导入到程序当中，它们有可能会全挤在世界的原点(0, 0, 0)上，这并不是我们想要的结果。我们想为每一个物体定义一个位置，从而能在更大的世界当中放置它们。世界空间中的坐标正如其名：是指顶点相对于（游戏）世界的坐标。如果你希望将物体分散在世界上摆放（特别是非常真实的那样），这就是你希望物体变换到的空间。物体的坐标将会从局部变换到世界空间；该变换是由模型矩阵(Model Matrix)实现的。

模型矩阵是一种变换矩阵，它能通过对物体进行位移、缩放、旋转来将它置于它本应该在的位置或朝向。你可以将它想像为变换一个房子，你需要先将它缩小（它在局部空间中太大了），并将其位移至郊区的一个小镇，然后在y轴上往左旋转一点以搭配附近的房子。你也可以把上一节将箱子到处摆放在场景中用的那个矩阵大致看作一个模型矩阵；我们将箱子的局部坐标变换到场景/世界中的不同位置。

### 观察空间

观察空间经常被人们称之OpenGL的摄像机(Camera)（所以有时也称为摄像机空间(Camera Space)或视觉空间(Eye Space)）。观察空间是将世界空间坐标转化为用户视野前方的坐标而产生的结果。因此**观察空间就是从摄像机的视角所观察到的空间。**而这通常是由一系列的位移和旋转的组合来完成，平移/旋转场景从而使得特定的对象被变换到摄像机的前方。这些组合在一起的变换通常存储在一个**观察矩阵(View Matrix)里，它被用来将世界坐标变换到观察空间。**在下一节中我们将深入讨论如何创建一个这样的观察矩阵来模拟一个摄像机。

### 裁剪空间

在一个顶点着色器运行的最后，OpenGL期望所有的坐标都能落在一个特定的范围内，且任何在这个范围之外的点都应该被裁剪掉(Clipped)。被裁剪掉的坐标就会被忽略，所以剩下的坐标就将变为屏幕上可见的片段。这也就是裁剪空间(Clip Space)名字的由来。

因为将所有可见的坐标都指定在-1.0到1.0的范围内不是很直观，所以我们会指定自己的坐标集(Coordinate Set)并将它变换回标准化设备坐标系，就像OpenGL期望的那样。

为了将顶点坐标从观察变换到裁剪空间，我们需要定义一个**投影矩阵(Projection Matrix)**，它指定了一个范围的坐标，比如在每个维度上的-1000到1000。投影矩阵接着会将在这个指定的范围内的坐标变换为标准化设备坐标的范围(-1.0, 1.0)。所有在范围外的坐标不会被映射到在-1.0到1.0的范围之间，所以会被裁剪掉。在上面这个投影矩阵所指定的范围内，坐标(1250, 500, 750)将是不可见的，这是由于它的x坐标超出了范围，它被转化为一个大于1.0的标准化设备坐标，所以被裁剪掉了。

> 如果只是图元(Primitive)，例如三角形，的一部分超出了裁剪体积(Clipping Volume)，则OpenGL会重新构建这个三角形为一个或多个三角形让其能够适合这个裁剪范围。

由投影矩阵创建的**观察箱(Viewing Box)**被称为**平截头体(Frustum)**，每个出现在平截头体范围内的坐标都会最终出现在用户的屏幕上。**将特定范围内的坐标转化到标准化设备坐标系的过程（而且它很容易被映射到2D观察空间坐标）被称之为投影(Projection)**，因为使用投影矩阵能将3D坐标投影(Project)到很容易映射到2D的标准化设备坐标系中。

一旦所有顶点被变换到裁剪空间，最终的操作——**透视除法(Perspective Division)**将会执行，**在这个过程中我们将位置向量的x，y，z分量分别除以向量的齐次w分量；透视除法是将4D裁剪空间坐标变换为3D标准化设备坐标的过程。这一步会在每一个顶点着色器运行的最后被自动执行。**

在这一阶段之后，最终的坐标将会被映射到屏幕空间中（使用`glViewport`中的设定），并被变换成片段。

将观察坐标变换为裁剪坐标的**投影矩阵**可以为两种不同的形式，每种形式都定义了不同的平截头体。我们可以选择创建一个**正交投影矩阵(Orthographic Projection Matrix)或一个透视投影矩阵(Perspective Projection Matrix)。**

### 正交投影

正射投影矩阵定义了一个类似立方体的平截头箱，它定义了一个裁剪空间，在这空间之外的顶点都会被裁剪掉。**创建一个正射投影矩阵需要指定可见平截头体的宽、高和长度。**在使用正射投影矩阵变换至裁剪空间之后处于这个平截头体内的所有坐标将不会被裁剪掉。它的平截头体看起来像一个容器：

![[orthographic_frustum.png|orthographic projection frustum]]

上面的平截头体定义了可见的坐标，它由由宽、高、近(Near)平面和远(Far)平面所指定。任何出现在近平面之前或远平面之后的坐标都会被裁剪掉。正射平截头体直接将平截头体内部的所有坐标映射为标准化设备坐标，因为每个向量的w分量都没有进行改变；如果w分量等于1.0，透视除法则不会改变这个坐标。

要**创建一个正射投影矩阵**，我们可以使用GLM的内置函数`glm::ortho`：

```c++ nums
glm::mat4 proj = glm::ortho(0.0f, 800.0f, 0.0f, 600.0f, 0.1f, 100.0f);
```

- 前两个参数指定了平截头体的左右坐标。
- 第三和第四参数指定了平截头体的底部和顶部。通过这四个参数我们定义了近平面和远平面的大小。
- 第五和第六个参数则定义了近平面和远平面的距离。这个投影矩阵会将处于这些x，y，z值范围内的坐标变换为标准化设备坐标。

正射投影矩阵直接将坐标映射到2D平面中，即你的屏幕，但实际上一个直接的投影矩阵会产生不真实的结果，因为这个投影没有将透视(Perspective)考虑进去。所以我们需要透视投影矩阵来解决这个问题。

### 透视投影

![[perspective.png]]

由于透视，这两条线在很远的地方看起来会相交。这正是透视投影想要模仿的效果，它是使用透视投影矩阵来完成的。**这个投影矩阵将给定的平截头体范围映射到裁剪空间，除此之外还修改了每个顶点坐标的w值，从而使得离观察者越远的顶点坐标w分量越大。被变换到裁剪空间的坐标都会在-w到w的范围之间（任何大于这个范围的坐标都会被裁剪掉）。**OpenGL要求所有可见的坐标都落在-1.0到1.0范围内，作为顶点着色器最后的输出，因此，**一旦坐标在裁剪空间内之后，透视除法就会被应用到裁剪空间坐标上：**

![[image-20220915162921885.png]]

顶点坐标的每个分量都会除以它的w分量，距离观察者越远顶点坐标就会越小。这是也是w分量非常重要的另一个原因，它能够帮助我们进行透视投影。最后的结果坐标就是处于标准化设备空间中的。如果你对正射投影矩阵和透视投影矩阵是如何计算的很感兴趣（且不会对数学感到恐惧的话）我推荐这篇由Songho写的[文章](http://www.songho.ca/opengl/gl_projectionmatrix.html)。

在GLM中可以这样创建一个透视投影矩阵：

```c++ nums
glm::mat4 proj = glm::perspective(glm::radians(45.0f), (float)width/(float)height, 0.1f, 100.0f);
```

- **第一个参数定义了fov的值。**它表示的是视野(Field of View)，并且设置了观察空间的大小。**如果想要一个真实的观察效果，它的值通常设置为45.0f，但想要一个末日风格的结果你可以将其设置一个更大的值。**

- **第二个参数设置了宽高比，由视口的宽除以高所得。**

- **第三和第四个参数设置了平截头体的近和远平面**。我们**通常设置近距离为0.1f，而远距离设为100.0f**。所有在近平面和远平面内且处于平截头体内的顶点都会被渲染。	

  > 当你把透视矩阵的 *near* 值设置太大时（如10.0f），OpenGL会将靠近摄像机的坐标（在0.0f和10.0f之间）都裁剪掉，这会导致一个你在游戏中很熟悉的视觉效果：在太过靠近一个物体的时候你的视线会直接穿过去。

同样，`glm::perspective`所做的其实就是创建了一个定义了可视空间的大**平截头体**，任何在这个平截头体以外的东西最后都不会出现在裁剪空间体积内，并且将会受到裁剪。一个透视平截头体可以被看作一个不均匀形状的箱子，在这个箱子内部的每个坐标都会被映射到裁剪空间上的一个点。下面是一张透视平截头体的图片：

![[perspective_frustum.png| perspective_frustum]]

当使用正射投影时，每一个顶点坐标都会直接映射到裁剪空间中而不经过任何精细的透视除法（它仍然会进行透视除法，只是w分量没有被改变（它保持为1），因此没有起作用）。因为正射投影没有使用透视，远处的物体不会显得更小，所以产生奇怪的视觉效果。由于这个原因，正射投影主要用于二维渲染以及一些建筑或工程的程序，在这些场景中我们更希望顶点不会被透视所干扰。某些如 *Blender* 等进行三维建模的软件有时在建模时也会使用正射投影，因为它在各个维度下都更准确地描绘了每个物体。下面你能够看到在Blender里面使用两种投影方式的对比：

![[perspective_orthographic.png]]

你可以看到，使用透视投影的话，远处的顶点看起来比较小，而在正射投影中每个顶点距离观察者的距离都是一样的。

### MVP

我们为上述的每一个步骤都创建了一个变换矩阵：模型矩阵、观察矩阵和投影矩阵。一个顶点坐标将会根据以下过程被变换到裁剪坐标：

![[image-20220915163918661 1.png|image-20220915163918661]]

注意矩阵运算的顺序是相反的（记住我们需要从右往左阅读矩阵的乘法）。最后的顶点应该被赋值到顶点着色器中的`gl_Position`，**OpenGL将会自动进行透视除法和裁剪。**

> **然后呢？**
>
> 顶点着色器的输出要求所有的顶点都在裁剪空间内，这正是我们刚才使用变换矩阵所做的。OpenGL然后对**裁剪坐标**执行**透视除法**从而将它们变换到**标准化设备坐标**。OpenGL会使用`glViewPort`内部的参数来将标准化设备坐标映射到**屏幕坐标**，每个坐标都关联了一个屏幕上的点（在我们的例子中是一个800x600的屏幕）。这个过程称为**视口变换**。

# 入门

## 词汇表

- **OpenGL**： 一个定义了函数布局和输出的图形API的正式规范。
- **GLAD**： 一个拓展加载库，用来为我们加载并设定所有OpenGL函数指针，从而让我们能够使用所有（现代）OpenGL函数。
- **视口(Viewport)**： 我们需要渲染的窗口。
- **图形管线(Graphics Pipeline)**： 一个顶点在呈现为像素之前经过的全部过程。
- **着色器(Shader)**： 一个运行在显卡上的小型程序。很多阶段的图形管道都可以使用自定义的着色器来代替原有的功能。
- **标准化设备坐标(Normalized Device Coordinates, NDC)**： 顶点在通过在剪裁坐标系中剪裁与透视除法后最终呈现在的坐标系。所有位置在NDC下-1.0到1.0的顶点将不会被丢弃并且可见。
- **顶点缓冲对象(Vertex Buffer Object)**： 一个调用显存并存储所有顶点数据供显卡使用的缓冲对象。
- **顶点数组对象(Vertex Array Object)**： 存储缓冲区和顶点属性状态。
- **元素缓冲对象(Element Buffer Object，EBO)，也叫索引缓冲对象(Index Buffer Object，IBO)**： 一个存储元素索引供索引化绘制使用的缓冲对象。
- **Uniform**： 一个特殊类型的GLSL变量。它是全局的（在一个着色器程序中每一个着色器都能够访问uniform变量），并且只需要被设定一次。
- **纹理(Texture)**： 一种包裹着物体的特殊类型图像，给物体精细的视觉效果。
- **纹理缠绕(Texture Wrapping)**： 定义了一种当纹理顶点超出范围(0, 1)时指定OpenGL如何采样纹理的模式。
- **纹理过滤(Texture Filtering)**： 定义了一种当有多种纹素选择时指定OpenGL如何采样纹理的模式。这通常在纹理被放大情况下发生。
- **多级渐远纹理(Mipmaps)**： 被存储的材质的一些缩小版本，根据距观察者的距离会使用材质的合适大小。
- **stb_image.h**： 图像加载库。
- **纹理单元(Texture Units)**： 通过绑定纹理到不同纹理单元从而允许多个纹理在同一对象上渲染。
- **向量(Vector)**： 一个定义了在空间中方向和/或位置的数学实体。
- **矩阵(Matrix)**： 一个矩形阵列的数学表达式。
- **GLM**： 一个为OpenGL打造的数学库。
- **局部空间(Local Space)**： 一个物体的初始空间。所有的坐标都是相对于物体的原点的。
- **世界空间(World Space)**： 所有的坐标都相对于全局原点。
- **观察空间(View Space)**： 所有的坐标都是从摄像机的视角观察的。
- **裁剪空间(Clip Space)**： 所有的坐标都是从摄像机视角观察的，但是该空间应用了投影。这个空间应该是一个顶点坐标最终的空间，作为顶点着色器的输出。OpenGL负责处理剩下的事情（裁剪/透视除法）。
- **屏幕空间(Screen Space)**： 所有的坐标都由屏幕视角来观察。坐标的范围是从0到屏幕的宽/高。
- **LookAt矩阵**： 一种特殊类型的观察矩阵，它创建了一个坐标系，其中所有坐标都根据从一个位置正在观察目标的用户旋转或者平移。
- **欧拉角(Euler Angles)**： 被定义为偏航角(Yaw)，俯仰角(Pitch)，和滚转角(Roll)从而允许我们通过这三个值构造任何3D方向。

## 窗口

### 创建窗口

（1）新建一个.cpp文件，输入**头文件**

```c++ nums++
#include <glad/glad.h>
#include <GLFW/glfw3.h>
//GLFW:Graphics Library For Windows
请确认是在包含GLFW的头文件之前包含了GLAD的头文件。GLAD的头文件包含了正确的OpenGL头文件（例如GL/gl.h），所以需要在其它依赖于OpenGL的头文件之前包含GLAD。
```

（2）接下来我们**创建main函数**，在这个函数中我们将会实例化GLFW窗口：

```c++ nums++
int main()
{
    glfwInit();  
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    //glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    
    return 0;
}
```

```c++ nums++
glfwInit();  //初始化GLFW
glfwWindowHint(); //第一个参数代表选项的名称，我们可以从很多以GLFW_开头的枚举值中选择；第二个参数接受一个整型，用来设置这个选项的值。  
```

我们将主版本号(Major)和次版本号(Minor)都设为3。我们同样明确告诉GLFW我们使用的是核心模式(Core-profile)。明确告诉GLFW我们需要使用核心模式意味着我们只能使用OpenGL功能的一个子集（没有我们已不再需要的向后兼容特性）。

所有的选项以及对应的值:[[https://www.glfw.org/docs/latest/window.html#window_hints]]

（3）接下来我们**创建一个窗口对象**，这个窗口对象存放了所有和窗口相关的数据，而且会被GLFW的其他函数频繁地用到。

```c++ nums++
GLFWwindow* window = glfwCreateWindow(800, 600, "LearnOpenGL", NULL, NULL);
if (window == NULL)
{
    std::cout << "Failed to create GLFW window" << std::endl;
    glfwTerminate(); //glfw终止
    return -1;
}
glfwMakeContextCurrent(window);
```

`glfwCreateWindow`函数需要窗口的宽和高作为它的前两个参数。第三个参数表示这个窗口的名称（标题），最后两个参数我们暂时忽略。这个函数将会返回一个GLFWwindow对象，我们会在其它的GLFW操作中使用到。创建完窗口我们就可以通知GLFW将我们窗口的上下文设置为当前线程的主上下文了。

### 初始化GLAD

GLAD是用来管理OpenGL的函数指针的，所以在**调用任何OpenGL的函数之前我们需要初始化GLAD**。

```c++ nums++
if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
{
    std::cout << "Failed to initialize GLAD" << std::endl;
    return -1;
}
```

我们给GLAD传入了用来加载系统相关的OpenGL函数指针地址的函数。GLFW给我们的是`glfwGetProcAddress`，它根据我们编译的系统定义了正确的函数。

### 设置视口

在我们开始渲染之前还有一件重要的事情要做，我们必须**告诉OpenGL渲染窗口的尺寸大小，即视口(Viewport)**，这样OpenGL才只能知道怎样根据窗口大小显示数据和坐标。我们可以通过调用`glViewport`函数来设置窗口的维度(Dimension)：

```c++ nums++
glViewport(0, 0, 800, 600);
//glViewport函数前两个参数控制窗口左下角的位置。第三个和第四个参数控制渲染窗口的宽度和高度（像素）
```

OpenGL幕后使用`glViewport`中定义的位置和宽高进行2D坐标的转换，将OpenGL中的位置坐标转换为你的屏幕坐标。例如，OpenGL中的坐标(-0.5, 0.5)有可能（最终）被映射为屏幕中的坐标(200,450)。注意，处理过的OpenGL坐标范围只为-1到1，因此我们事实上将(-1到1)范围内的坐标映射到(0, 800)和(0, 600)。

然而，**当用户改变窗口的大小的时候，视口也应该被调整。**我们可以**对窗口注册一个回调函数(Callback Function)**，它会在每次窗口大小被调整的时候被调用。这个回调函数的原型如下：

```c++ nums++
void framebuffer_size_callback(GLFWwindow* window, int width, int height);
//这个帧缓冲大小函数需要一个GLFWwindow作为它的第一个参数，以及两个整数表示窗口的新维度。每当窗口改变大小，GLFW会调用这个函数并填充相应的参数供你处理。
```

```c++ nums++
void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    glViewport(0, 0, width, height);
}
```

**我们还需要注册这个函数，告诉GLFW我们希望每当窗口调整大小的时候调用这个函数：**

```c++ nums+
glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
```

当窗口被第一次显示的时候`framebuffer_size_callback`也会被调用。对于视网膜(Retina)显示屏，width和height都会明显比原输入值更高一点。

我们还可以将我们的函数注册到其它很多的回调函数中。比如说，我们可以创建一个回调函数来处理手柄输入变化，处理错误消息等。我们会在创建窗口之后，渲染循环初始化之前注册这些回调函数。

### 引擎：渲染循环

我们希望程序在我们主动关闭它之前不断绘制图像并能够接受用户输入。因此，我们需要在程序中添加一个while循环，我们可以把它称之为**渲染循环**(Render Loop)，它能在我们让GLFW退出前一直保持运行。下面几行的代码就实现了一个简单的渲染循环：

```c++ nums++
while(!glfwWindowShouldClose(window))
{
    glfwSwapBuffers(window);
    glfwPollEvents();    
}
```

- **`glfwWindowShouldClose`函数**在我们每次循环的开始前检查一次GLFW是否被要求退出，如果是的话该函数返回`true`然后渲染循环便结束了，之后为我们就可以关闭应用程序了。

- **`glfwPollEvents`函数**检查有没有触发什么事件（比如键盘输入、鼠标移动等）、更新窗口状态，并调用对应的回调函数（可以通过回调方法手动设置）。

- **`glfwSwapBuffers`函数**会交换颜色缓冲（它是一个储存着GLFW窗口每一个像素颜色值的大缓冲），它在这一迭代中被用来绘制，并且将会作为输出显示在屏幕上。

  

> **==双缓冲(Double Buffer)==**
>
> 应用程序使用单缓冲绘图时可能会存在图像闪烁的问题。 这是因为生成的图像不是一下子被绘制出来的，而是按照从左到右，由上而下逐像素地绘制而成的。最终图像不是在瞬间显示给用户，而是通过一步一步生成的，这会导致渲染的结果很不真实。为了规避这些问题，我们应用双缓冲渲染窗口应用程序。**前**缓冲保存着最终输出的图像，它会在屏幕上显示；而所有的的渲染指令都会在**后**缓冲上绘制。当所有的渲染指令执行完毕后，我们**交换**(Swap)前缓冲和后缓冲，这样图像就立即呈显出来，之前提到的不真实感就消除了。



### 最后释放资源

当渲染循环结束后我们需要正确释放/删除之前的分配的所有资源。我们可以在main函数的最后调用`glfwTerminate`函数来完成。

```c++ nums++
glfwTerminate();
return 0;
//至此，运行后可以出现黑窗
```

### 输入

我们同样也希望能够在GLFW中实现一些输入控制，这可以通过使用GLFW的几个输入函数来完成。

GLFW的**`glfwGetKey`函数**，它需要一个窗口以及一个按键作为输入。这个函数将会返回这个按键是否正在被按下。

我们将创建一个`processInput`函数来让所有的输入代码保持整洁。

```c++ nums++
void processInput(GLFWwindow *window)
{
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}
```

这里我们检查用户是否按下了返回键(Esc)（如果没有按下，glfwGetKey将会返回GLFW_RELEASE。如果用户的确按下了返回键，我们将通过`glfwSetwindowShouldClose`使用把`WindowShouldClose`属性设置为 `true`的方法关闭GLFW。下一次while循环的条件检测将会失败，程序将会关闭。

我们接下来在渲染循环的每一个迭代中调用processInput：

```c++ nums++
while (!glfwWindowShouldClose(window))
{
    processInput(window);

    glfwSwapBuffers(window);
    glfwPollEvents();
}
```

这就给我们一个非常简单的方式来检测特定的键是否被按下，并在每一帧做出处理。

### 渲染

我们要把所有的渲染(Rendering)操作放到渲染循环中，因为我们想让这些渲染指令在每次渲染循环迭代的时候都能被执行。代码将会是这样的：

```c++ nums++
// 渲染循环
while(!glfwWindowShouldClose(window))
{
    // 输入
    processInput(window);

    // 渲染指令
    ...

    // 检查并调用事件，交换缓冲
    glfwPollEvents();
    glfwSwapBuffers(window);
}
```

为了测试一切都正常工作，我们使用一个自定义的颜色清空屏幕。在每个新的渲染迭代开始的时候我们总是希望清屏，否则我们仍能看见上一次迭代的渲染结果（这可能是你想要的效果，但通常这不是）。

我们可以通过调用**`glClear`函数来清空屏幕的颜色缓冲**，它接受一个缓冲位(Buffer Bit)来指定要清空的缓冲，可能的**缓冲位**有`GL_COLOR_BUFFER_BIT`，`GL_DEPTH_BUFFER_BIT`和`GL_STENCIL_BUFFER_BIT`。由于现在我们只关心颜色值，所以我们只清空颜色缓冲。

```c++ nums++
glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT);

//glClearColor函数是一个状态设置函数，而glClear函数则是一个状态使用的函数，它使用了当前的状态来获取应该清除为的颜色。
```

注意，除了glClear之外，我们还调用了**`glClearColor`来设置清空屏幕所用的颜色**。当调用`glClear`函数，清除颜色缓冲之后，整个颜色缓冲都会被填充为`glClearColor`里所设置的颜色。在这里，我们将屏幕设置为了类似黑板的深蓝绿色。

![[image-20220912210652281.png]]

### 代码

```c++ nums
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#include <iostream>

void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下
// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;
int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //种植
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}
	//引擎
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		// 渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);//RGB设置颜色
		glClear(GL_COLOR_BUFFER_BIT);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

## 三角形

- 顶点数组对象：Vertex Array Object，VAO
- 顶点缓冲对象：Vertex Buffer Object，VBO
- 元素缓冲对象：Element Buffer Object，EBO 或 索引缓冲对象 Index Buffer Object，IBO



开始绘制图形之前，我们需要先给OpenGL输入一些顶点数据。OpenGL是一个3D图形库，所以在OpenGL中我们指定的所有坐标都是3D坐标（x、y和z）。OpenGL不是简单地把所有的3D坐标变换为屏幕上的2D像素；OpenGL仅当3D坐标在3个轴**（x、y和z）上-1.0到1.0的范围**内时才处理它。所有在这个范围内的坐标叫做**标准化设备坐标(Normalized Device Coordinates)**，此范围内的坐标最终显示在屏幕上（在这个范围以外的坐标则不会显示）。



> ==**标准化设备坐标(Normalized Device Coordinates, NDC)**==
>
> 一旦你的顶点坐标已经在顶点着色器中处理过，它们就应该是**标准化设备坐标**了，标准化设备坐标是一个x、y和z值在-1.0到1.0的一小段空间。任何落在范围外的坐标都会被丢弃/裁剪，不会显示在你的屏幕上。下面你会看到我们定义的在标准化设备坐标中的三角形(忽略z轴)：
>
> ![[ndc.png|NDC]]
>
> 与通常的屏幕坐标不同，y轴正方向为向上，(0, 0)坐标是这个图像的中心，而不是左上角。最终你希望所有(变换过的)坐标都在这个坐标空间中，否则它们就不可见了。
>
> 通过使用由`glViewport`函数提供的数据，进行视口变换(Viewport Transform)，标准化设备坐标(Normalized Device Coordinates)会变换为屏幕空间坐标(Screen-space Coordinates)。所得的屏幕空间坐标又会被变换为片段输入到片元着色器中。



### 顶点数据

由于我们希望渲染一个三角形，我们一共要指定三个顶点，每个顶点都有一个3D位置。我们会将它们以标准化设备坐标的形式（OpenGL的可见区域）定义为一个`float`数组。

```c++ nums
float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
};
//由于OpenGL是在3D空间中工作的，而我们渲染的是一个2D三角形，我们将它顶点的z坐标设置为0.0。这样子的话三角形每一点的*深度*(Depth，译注2)都是一样的，从而使它看上去像是2D的。
```

定义这样的顶点数据以后，我们会把它作为输入发送给图形渲染管线的第一个处理阶段：顶点着色器。它会在GPU上创建内存用于储存我们的顶点数据，还要配置OpenGL如何解释这些内存，并且指定其如何发送给显卡。顶点着色器接着会处理我们在内存中指定数量的顶点。

### 顶点缓冲对象（VBO）

[VBO,VAO,EBO理解](https://www.cnblogs.com/zobol/p/10716333.html)	

我们**通过顶点缓冲对象(Vertex Buffer Objects, VBO)管理这个内存**，它会在GPU内存（通常被称为**显存**）中储存大量顶点。**使用这些缓冲对象的好处是我们可以一次性的发送一大批数据到显卡上，而不是每个顶点发送一次。**从CPU把数据发送到显卡相对较慢，所以只要可能我们都要尝试尽量一次性发送尽可能多的数据。当数据发送至显卡的内存中后，顶点着色器几乎能立即访问顶点，这是个非常快的过程。

顶点缓冲对象是我们在[OpenGL](https://learnopengl-cn.github.io/01 Getting started/01 OpenGL/)教程中第一个出现的OpenGL对象。就像OpenGL中的其它对象一样，**这个缓冲有一个独一无二的ID**，所以我们可以**使用`glGenBuffers`函数和一个缓冲ID生成一个VBO对象**：Gen：generate

```c++ nums
unsigned int VBO;
glGenBuffers(1, &VBO);
```

OpenGL有很多缓冲对象类型，顶点缓冲对象的缓冲类型是`GL_ARRAY_BUFFER`。**OpenGL允许我们同时绑定多个缓冲，只要它们是不同的缓冲类型**。

我们**可以使用`glBindBuffer`函数把新创建的缓冲绑定到`GL_ARRAY_BUFFER`目标上**：

```c++ nums
glBindBuffer(GL_ARRAY_BUFFER, VBO);  
```

从这一刻起，我们使用的任何（在`GL_ARRAY_BUFFER`目标上的）缓冲调用都会用来配置当前绑定的缓冲(VBO)。然后我们可以**调用`glBufferData`函数，它会把之前定义的顶点数据复制到缓冲的内存中**：

```c++ nums
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
```

**`glBufferData`**是一个专门用来**把用户定义的数据复制到当前绑定缓冲的函数**。它的第一个参数是目标缓冲的类型：顶点缓冲对象当前绑定到GL_ARRAY_BUFFER目标上。第二个参数指定传输数据的大小(以字节为单位)；用一个简单的`sizeof`计算出顶点数据大小就行。第三个参数是我们希望发送的实际数据。

**第四个参数指定了我们希望显卡如何管理给定的数据。它有三种形式：**

- GL_STATIC_DRAW ：数据不会或几乎不会改变。
- GL_DYNAMIC_DRAW：数据会被改变很多。
- GL_STREAM_DRAW ：数据每次绘制时都会改变。

三角形的位置数据不会改变，每次渲染调用时都保持原样，所以它的使用类型最好是GL_STATIC_DRAW。如果，比如说一个缓冲中的数据将频繁被改变，那么使用的类型就是GL_DYNAMIC_DRAW或GL_STREAM_DRAW，这样就能确保显卡把数据放在能够高速写入的内存部分。

**现在我们已经把顶点数据储存在显卡的内存中，用VBO这个顶点缓冲对象管理。**下面我们会创建一个顶点着色器和片元着色器来真正处理这些数据。

### 顶点着色器

我们需要做的第一件事是用**着色器语言GLSL(OpenGL Shading Language)**编写顶点着色器，然后编译这个着色器，这样我们就可以在程序中使用它了。下面你会看到一个非常基础的GLSL顶点着色器的源代码：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;

void main()
{
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
}
```

可以看到，GLSL看起来很像C语言。每个着色器都起始于一个版本声明。OpenGL 3.3以及和更高版本中，**GLSL版本号和OpenGL的版本是匹配的（比如说GLSL 420版本对应于OpenGL 4.2）。我们同样明确表示我们会使用核心模式。**

(1)使用`in`关键字，在顶点着色器中声明所有的输入顶点属性(Input Vertex Attribute)。现在我们只关心位置(Position)数据，所以我们只需要一个顶点属性。

(2)GLSL有一个向量数据类型，它包含1到4个`float`分量，包含的数量可以从它的后缀数字看出来。由于每个顶点都有一个3D坐标，我们就创建一个`vec3`输入变量`aPos`。

(3)我们同样也通过`layout (location = 0)`设定了输入变量的位置值(Location)你后面会看到为什么我们会需要这个位置值。->链接顶点属性



> ==**向量(Vector)**==
>
> 在图形编程中我们经常会使用向量这个数学概念，因为它简明地表达了任意空间中的位置和方向，并且它有非常有用的数学属性。在GLSL中一个向量有最多4个分量，每个分量值都代表空间中的一个坐标，它们可以通过`vec.x`、`vec.y`、`vec.z`和`vec.w`来获取。注意`vec.w`分量不是用作表达空间中的位置的（我们处理的是3D不是4D），而是用在所谓透视除法(Perspective Division)上。我们会在后面的教程中更详细地讨论向量。



为了设置顶点着色器的输出，我们必须把位置数据赋值给预定义的gl_Position变量，它在幕后是`vec4`类型的。在main函数的最后，我们将gl_Position设置的值会成为该顶点着色器的输出。由于我们的输入是一个3分量的向量，我们必须把它转换为4分量的。我们可以把`vec3`的数据作为`vec4`构造器的参数，同时把`w`分量设置为`1.0f`（我们会在后面解释为什么）来完成这一任务。

当前这个顶点着色器可能是我们能想到的最简单的顶点着色器了，因为我们对输入数据什么都没有处理就把它传到着色器的输出了。在真实的程序里输入数据通常都不是标准化设备坐标，所以我们首先必须先把它们转换至OpenGL的可视区域内。



**编译着色器**

现在，我们暂时将**顶点着色器的源代码硬编码**在代码文件顶部的C风格字符串中：

```c++ nums
const char *vertexShaderSource = "#version 330 core\n"
    "layout (location = 0) in vec3 aPos;\n"
    "void main()\n"
    "{\n"
    "   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
    "}\0";
```

为了能够让OpenGL使用它，我们必须在运行时动态编译它的源代码。

(1))我们首先要做的是**创建一个着色器对象**，注意还是用ID来引用的。所以我们储存这个顶点着色器为`unsigned int`，然后用glCreateShader创建这个着色器：

```c++ nums
unsigned int vertexShader;
vertexShader = glCreateShader(GL_VERTEX_SHADER);
```

我们把需要创建的着色器类型以参数形式提供给glCreateShader。由于我们正在创建一个顶点着色器，传递的参数是GL_VERTEX_SHADER。

(2)下一步我们**把这个着色器源码附加到着色器对象上，然后编译它**：

```c++ nums
glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
glCompileShader(vertexShader);

// glShaderSource 函数把要编译的着色器对象作为第一个参数。第二参数指定了传递的源码字符串数量，这里只有一个。第三个参数是顶点着色器真正的源码，第四个参数我们先设置为NULL。
```



> ==**检测编译错误**==
>
> 你可能会希望检测在调用`glCompileShader`后编译是否成功了，如果没成功的话，你还会希望知道错误是什么，这样你才能修复它们。**检测编译时错误**可以通过以下代码来实现：

```c++ nums
> int  success;
> char infoLog[512];
> glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
> 
> //首先我们定义一个整型变量来表示是否成功编译，还定义了一个储存错误消息（如果有的话）的容器。然后我们用 glGetShaderiv 检查是否编译成功。如果编译失败，我们会用 glGetShaderInfoLog 获取错误消息，然后打印它。
> 
> if(!success)
> {
>     glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
>     std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
> }
> 
> //如果编译的时候没有检测到任何错误，顶点着色器就被编译成功了。
```
### 片元着色器

片元着色器(Fragment Shader)是第二个也是最后一个我们打算创建的用于渲染三角形的着色器。片元着色器所做的是计算像素最后的颜色输出。为了让事情更简单，我们的片元着色器将会一直输出橘黄色。

```c++ nums
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
} 
```

片元着色器只需要一个输出变量，这个变量是一个4分量向量，它表示的是最终的输出颜色，我们应该自己将其计算出来。**声明输出变量**可以使用`out`关键字，这里我们命名为`FragColor`。下面，我们将一个Alpha值为1.0(1.0代表完全不透明)的橘黄色的`vec4`赋值给颜色输出。

编译片元着色器的过程与顶点着色器类似，只不过我们**使用`GL_FRAGMENT_SHADER`常量作为着色器类型**：

```c++ nums
unsigned int fragmentShader;
fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
glCompileShader(fragmentShader);
```

两个着色器现在都编译了，剩下的事情**是把两个着色器对象链接到一个用来渲染的着色器程序(Shader Program)中**。

### 着色器程序

**着色器程序对象(Shader Program Object)**是多个着色器合并之后并最终链接完成的版本。**如果要使用刚才编译的着色器我们必须把它们链接(Link)为一个着色器程序对象，然后在渲染对象的时候激活这个着色器程序。**已激活着色器程序的着色器将在我们发送渲染调用的时候被使用。

当链接着色器至一个程序的时候，它会把每个着色器的输出链接到下个着色器的输入。当输出和输入不匹配的时候，你会得到一个连接错误。

(1)创建一个程序对象很简单：

```c++ nums
unsigned int shaderProgram;
shaderProgram = glCreateProgram();
//glCreateProgram函数创建一个程序，并返回新创建程序对象的ID引用。
```

(2)现在我们需要**把之前编译的着色器附加到程序对象上，然后用`glLinkProgram`链接它们：**

```c++ nums
glAttachShader(shaderProgram, vertexShader);
glAttachShader(shaderProgram, fragmentShader);
glLinkProgram(shaderProgram);
```



> ==**检测链接失败**==
>
> 就像着色器的编译一样，我们也可以**检测链接着色器程序是否失败**，并获取相应的日志。与上面不同，我们不会调用glGetShaderiv和glGetShaderInfoLog，现在我们使用：

> ```c++ nums
> glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
> if(!success) {
>     glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
>     ...
> }
> ```



(3)得到的结果就是一个程序对象，我们可以调用`glUseProgram`函数，用刚创建的程序对象作为它的参数，以**激活这个程序对象**：

```c++ nums
glUseProgram(shaderProgram);
//在glUseProgram函数调用之后，每个着色器调用和渲染调用都会使用这个程序对象（也就是之前写的着色器)了。
```

(4)在把着色器对象链接到程序对象以后，记得删除着色器对象，我们不再需要它们了：

```c++ nums
glDeleteShader(vertexShader);
glDeleteShader(fragmentShader);
```

现在，我们已经**把输入顶点数据发送给了GPU，并指示了GPU如何在顶点和片元着色器中处理它**。就快要完成了，但还没结束，**OpenGL还不知道它该如何解释内存中的顶点数据，以及它该如何将顶点数据链接到顶点着色器的属性上**。我们需要告诉OpenGL怎么做。

### 链接顶点属性

顶点着色器允许我们指定任何以顶点属性为形式的输入。这使其具有很强的灵活性的同时，它还的确意味着**我们必须手动指定输入数据的哪一个部分对应顶点着色器的哪一个顶点属性。所以，我们必须在渲染前指定OpenGL该如何解释顶点数据**。

我们的顶点缓冲数据会被解析为下面这样子：

![[vertex_attribute_pointer.png|img]]

- 位置数据被储存为32位（4字节）浮点值。
- 每个位置包含3个这样的值。
- 在这3个值之间没有空隙（或其他值）。这几个值在数组中紧密排列(Tightly Packed)。
- 数据中第一个值在缓冲开始的位置。

**有了这些信息我们就可以使用`glVertexAttribPointer`函数告诉OpenGL该如何解析顶点数据（应用到逐个顶点属性上）了：**

```c++ nums
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
```

**`glVertexAttribPointer`函数的参数非常多，所以我会逐一介绍它们：**

- **第一个参数指定我们要配置的顶点属性。**还记得我们在顶点着色器中使用**`layout(location = 0)`**定义了position顶点属性的位置值(Location)吗？它可以把顶点属性的位置值设置为`0`。因为我们希望把数据传递到这一个顶点属性中，所以这里我们传入`0`。
- **第二个参数指定顶点属性的大小。**顶点属性是一个`vec3`，它由3个值组成，所以大小是3。
- **第三个参数指定数据的类型。**这里是GL_FLOAT(GLSL中`vec*`都是由浮点数值组成的)。
- **第四个参数定义我们是否希望数据被标准化(Normalize)。**如果我们设置为GL_TRUE，所有数据都会被映射到0（对于有符号型signed数据是-1）到1之间。我们把它设置为GL_FALSE。
- **第五个参数叫做步长(Stride)，它告诉我们在连续的顶点属性组之间的间隔。**由于下个组位置数据在3个`float`之后，我们把步长设置为`3 * sizeof(float)`。要注意的是由于我们知道这个数组是紧密排列的（在两个顶点属性之间没有空隙）我们也可以设置为0来让OpenGL决定具体步长是多少（只有当数值是紧密排列时才可用）。**一旦我们有更多的顶点属性，我们就必须更小心地定义每个顶点属性之间的间隔**，我们在后面会看到更多的例子（译注: **这个参数的意思简单说就是从这个属性第二次出现的地方到整个数组0位置之间有多少字节**）。
- **最后一个参数的类型是`void*`。**所以需要我们进行这个奇怪的强制类型转换。它表示位置数据在缓冲中起始位置的偏移量(Offset)。由于位置数据在数组的开头，所以这里是0。我们会在后面详细解释这个参数。

> 每个顶点属性从一个VBO管理的内存中获得它的数据，而具体是从哪个VBO（程序中可以有多个VBO）获取则是通过在调用glVertexAttribPointer时绑定到GL_ARRAY_BUFFER的VBO决定的。由于在调用glVertexAttribPointer之前绑定的是先前定义的VBO对象，顶点属性`0`现在会链接到它的顶点数据。

现在我们已经定义了OpenGL该如何解释顶点数据，我们现在应该**使用`glEnableVertexAttribArray`，以顶点属性位置值作为参数，启用顶点属性；顶点属性默认是禁用的。**

自此，所有东西都已经设置好了：我们使用一个顶点缓冲对象将顶点数据初始化至缓冲中，建立了一个顶点和一个片元着色器，并告诉了OpenGL如何把顶点数据链接到顶点着色器的顶点属性上。在OpenGL中绘制一个物体，代码会像是这样：

```c++ nums
// 0. 复制顶点数组到缓冲中供OpenGL使用
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
// 1. 设置顶点属性指针
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
// 2. 当我们渲染一个物体时要使用着色器程序
glUseProgram(shaderProgram);
// 3. 绘制物体
someOpenGLFunctionThatDrawsOurTriangle();
```

每当我们绘制一个物体的时候都必须重复这一过程。这看起来可能不多，但是如果有超过5个顶点属性，上百个不同物体呢（这其实并不罕见）。绑定正确的缓冲对象，为每个物体配置所有顶点属性很快就变成一件麻烦事。**有没有一些方法可以使我们把所有这些状态配置储存在一个对象中，并且可以通过绑定这个对象来恢复状态呢？**

### 顶点数组对象（VAO）

顶点数组对象(Vertex Array Object, VAO)可以像顶点缓冲对象那样被绑定，任何随后的顶点属性调用都会储存在这个VAO中。**这样的好处就是，当配置顶点属性指针时，你只需要将那些调用执行一次，之后再绘制物体的时候只需要绑定相应的VAO就行了。**这使在不同顶点数据和属性配置之间切换变得非常简单，只需要绑定不同的VAO就行了。刚刚设置的所有状态都将存储在VAO中

> OpenGL的核心模式**要求**我们使用VAO，所以它知道该如何处理我们的顶点输入。如果我们绑定VAO失败，OpenGL会拒绝绘制任何东西。

一个顶点数组对象会储存以下这些内容：

- `glEnableVertexAttribArray`和`glDisableVertexAttribArray`的调用。
- 通过`glVertexAttribPointer`设置的顶点属性配置。
- 通过`glVertexAttribPointer`调用与顶点属性关联的顶点缓冲对象。

![[vertex_array_objects.png|img]]

**创建一个VAO**和创建一个VBO很类似：

```c++ nums
unsigned int VAO;
glGenVertexArrays(1, &VAO);
```

要想**使用VAO**，要做的只是使用`glBindVertexArray`绑定VAO。从绑定之后起，我们应该绑定和配置对应的VBO和属性指针，之后解绑VAO供之后使用。当我们打算绘制一个物体的时候，我们只要在绘制物体前简单地把VAO绑定到希望使用的设定上就行了。这段代码应该看起来像这样：

```c++ nums
// ..:: 初始化代码（只运行一次 (除非你的物体频繁改变)） :: ..
// 1. 绑定VAO
glBindVertexArray(VAO);
// 2. 把顶点数组复制到缓冲中供OpenGL使用
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
// 3. 设置顶点属性指针
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

[...]

// ..:: 绘制代码（渲染循环中） :: ..
// 4. 绘制物体
glUseProgram(shaderProgram);
glBindVertexArray(VAO);
someOpenGLFunctionThatDrawsOurTriangle();
```

就这么多了！前面做的一切都是等待这一刻，一个储存了我们顶点属性配置和应使用的VBO的顶点数组对象。**一般当你打算绘制多个物体时，你首先要生成/配置所有的VAO（和必须的VBO及属性指针)，然后储存它们供后面使用。当我们打算绘制物体的时候就拿出相应的VAO，绑定它，绘制完物体后，再解绑VAO。**

#### 绘制三角形

要想绘制我们想要的物体，OpenGL给我们提供了**`glDrawArrays`函数，它使用当前激活的着色器，之前定义的顶点属性配置，和VBO的顶点数据（通过VAO间接绑定）来绘制图元。**

```c++ nums
glUseProgram(shaderProgram);
glBindVertexArray(VAO);
glDrawArrays(GL_TRIANGLES, 0, 3);
```

`glDrawArrays`函数**第一个参数是我们打算绘制的OpenGL图元的类型。**由于我们在一开始时说过，我们希望绘制的是一个三角形，这里传递GL_TRIANGLES给它。**第二个参数指定了顶点数组的起始索引**，我们这里填`0`。**最后一个参数指定我们打算绘制多少个顶点**，这里是`3`（我们只从我们的数据中渲染一个三角形，它只有3个顶点长）。

现在尝试编译代码，如果弹出了任何错误，回头检查你的代码。如果你编译通过了，你应该看到下面的结果：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/2.1.hello_triangle/hello_triangle.cpp)

![[hellotriangle.png|img]]

#### 代码

##### 绘制一个三角形

```c++ nums++
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#include <iostream>
void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

//顶点着色器的源代码硬编码
const char* vertexShaderSource = "#version 330 core\n"
"layout (location = 0) in vec3 aPos;\n"
"void main()\n"
"{\n"
"   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
"}\0";

//片元着色器的源代码硬编码
const char* fragmentShaderSource = "#version 330 core\n"
"out vec4 FragColor;\n"
"void main()\n"
"{\n"
"   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
"}\0";

int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //终止
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}

	//创建和编译Shader
	// ------------------
	//1. 顶点着色器
	unsigned int vertexShader;
	vertexShader = glCreateShader(GL_VERTEX_SHADER); //创建着色器对象
	glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);	//着色器源码附加到着色器对象
	glCompileShader(vertexShader);	//编译着色器

	//编译检测
	int success;	//表示是否成功编译
	char infoLog[512];	//存储错误信息的容器
	glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(vertexShader, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
	}

	//2. 片元着色器
	unsigned int fragmentShader;
	fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
	glCompileShader(fragmentShader);

	//编译检测
	glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
	}

	//3. 把两个着色器对象链接到一个用来渲染的着色器程序中
	unsigned int shaderProgram;
	shaderProgram = glCreateProgram();//创建着色器程序对象

	glAttachShader(shaderProgram, vertexShader); //着色器附加到程序对象上
	glAttachShader(shaderProgram, fragmentShader);
	glLinkProgram(shaderProgram);	//链接他们

	//链接检测
	glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::PROGRAM::LINK_FAILED\n" << infoLog << std::endl;
	}

	//删除顶点、片元着色器对象
	glDeleteShader(vertexShader);
	glDeleteShader(fragmentShader);

	//设置顶点数据(和缓冲区)并配置顶点属性
	// ----------------------------
	//定义三个顶点
	float vertices[] = {
		-0.5f, -0.5f, 0.0f,
		 0.5f, -0.5f, 0.0f,
		 0.0f,  0.5f, 0.0f
	};

	unsigned int VAO;	//顶点数组对象
	unsigned int VBO;	//顶点缓冲对象：管理显存

	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);	//	设置缓冲ID


	glBindVertexArray(VAO);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBO); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	//4. 链接顶点属性
	//设置顶点属性指针
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);	//启用顶点属性

	//注意这是允许的，对glVertexAttribPointer的调用将VBO注册为顶点属性的绑定顶点缓冲器对象，所以之后我们可以安全地解除绑定。
	glBindBuffer(GL_ARRAY_BUFFER, 0);

	//你可以在事后解除对VAO的绑定，这样其他的VAO调用就不会意外地修改这个VAO，但这很少发生。修改其他 VAO需要调用glBindVertexArray，所以在没有直接必要的情况下，我们一般不会解除对VAO（或者VBO）的绑定。
	glBindVertexArray(0);

	//取消注释这个调用来绘制线框多边形。
	//glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

	//引擎：渲染循环
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//5. 使用着色器程序渲染物体
		glUseProgram(shaderProgram);
		glBindVertexArray(VAO); //因为我们只有一个VAO，所以没有必要每次都绑定它，但为了让事情更有条理，我们会这样做

		//6. 绘制物体
		glDrawArrays(GL_TRIANGLES, 0, 3);



		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	//glDeleteVertexArrays(1, &VAO);
	//glDeleteBuffers(1, &VBO);
	//glDeleteProgram(shaderProgram);

	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	//设置视口大小
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

##### 使用不同的VAO和VBO

绘制两个相同的三角形，对它们的数据使用不同的VAO和VBO

```c++ nums
	//前部分代码和上面一样

	//定义两个相同的三角形
	float firstTriangle[] = {
		-0.5f, -0.5f, 0.0f,
		 0.5f, -0.5f, 0.0f,
		 0.0f,  0.5f, 0.0f,
	};

	float secondTriangle[] = {
		-0.5f, -0.5f, 0.0f,
		 0.5f, -0.5f, 0.0f,
		 0.0f,  0.5f, 0.0f,
	};

	unsigned int VAOs[2];	
	unsigned int VBOs[2];	

	glGenVertexArrays(2, VAOs); // 我们还可以同时生成多个vao或缓冲区
	glGenBuffers(2, VBOs);	


	glBindVertexArray(VAOs[0]);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(firstTriangle), firstTriangle, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);	

	//glBindVertexArray(0); //不需要解除绑定，因为我们在接下来的几行中直接绑定了一个不同的VAO

	glBindVertexArray(VAOs[1]);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(secondTriangle), secondTriangle, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);


	while (!glfwWindowShouldClose(window))
	{
		//输入
		processInput(window);

		//渲染
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);
		glUseProgram(shaderProgram);
		//分别绘制
		glBindVertexArray(VAOs[0]);
		glDrawArrays(GL_TRIANGLES, 0, 3);
		
		glBindVertexArray(VAOs[1]);
		glDrawArrays(GL_TRIANGLES, 0, 3);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	glDeleteVertexArrays(2, VAOs);
	glDeleteBuffers(2, VBOs);
	glDeleteProgram(shaderProgram);

	//释放资源
	glfwTerminate();

	return 0;
}
```

##### 使用不同着色器程序

创建两个着色器程序，第二个程序使用一个不同的片元着色器，输出黑色；绘制两个相连的三角形，让其中一个输出为黑色：

![[image-20220913101442635.png]]

```c++ nums
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#include <iostream>
void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

//顶点着色器的源代码硬编码
const char* vertexShaderSource = "#version 330 core\n"
"layout (location = 0) in vec3 aPos;\n"
"void main()\n"
"{\n"
"   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
"}\0";

//片元着色器的源代码硬编码
const char* fragmentShaderSource1 = "#version 330 core\n"
"out vec4 FragColor;\n"
"void main()\n"
"{\n"
"   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
"}\0";

const char* fragmentShaderSource2 = "#version 330 core\n"
"out vec4 FragColor;\n"
"void main()\n"
"{\n"
"   FragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);\n"
"}\0";

int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //种植
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}

	//创建和编译Shader
	// ------------------
	//1. 顶点着色器
	unsigned int vertexShader;
	vertexShader = glCreateShader(GL_VERTEX_SHADER); //创建着色器对象
	glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);	//着色器源码附加到着色器对象
	glCompileShader(vertexShader);	//编译着色器

	//编译检测
	int success;	//表示是否成功编译
	char infoLog[512];	//存储错误信息的容器
	glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(vertexShader, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
	}

	//2. 创建两个不同的片元着色器
	unsigned int fragmentShader1;
	fragmentShader1 = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader1, 1, &fragmentShaderSource1, NULL);
	glCompileShader(fragmentShader1);

	//编译检测
	glGetShaderiv(fragmentShader1, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(fragmentShader1, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED::FIRST\n" << infoLog << std::endl;
	}

	unsigned int fragmentShader2;
	fragmentShader2 = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader2, 1, &fragmentShaderSource2, NULL);
	glCompileShader(fragmentShader2);

	//编译检测
	glGetShaderiv(fragmentShader2, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(fragmentShader2, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED::SECOND\n" << infoLog << std::endl;
	}

	//3. 链接两个着色器程序
	unsigned int shaderProgram1;
	shaderProgram1 = glCreateProgram();//创建着色器程序对象
	glAttachShader(shaderProgram1, vertexShader); //着色器附加到程序对象上
	glAttachShader(shaderProgram1, fragmentShader1);
	glLinkProgram(shaderProgram1);	//链接他们
	//链接检测
	glGetProgramiv(shaderProgram1, GL_LINK_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetProgramInfoLog(shaderProgram1, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::LINK_FAILED::FIRST\n" << infoLog << std::endl;
	}

	unsigned int shaderProgram2;
	shaderProgram2 = glCreateProgram();//创建着色器程序对象
	glAttachShader(shaderProgram2, vertexShader); //着色器附加到程序对象上
	glAttachShader(shaderProgram2, fragmentShader2);
	glLinkProgram(shaderProgram2);	//链接他们
	//链接检测
	glGetProgramiv(shaderProgram2, GL_LINK_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetProgramInfoLog(shaderProgram2, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::LINK_FAILED::SECOND\n" << infoLog << std::endl;
	}


	//删除顶点、片元着色器对象
	glDeleteShader(vertexShader);
	glDeleteShader(fragmentShader1);
	glDeleteShader(fragmentShader2);
	//设置顶点数据(和缓冲区)并配置顶点属性
	// ----------------------------
	//定义两个三角形
	float firstTriangle[] = {
		-0.5f, -0.5f, 0.0f,
		 0.5f, -0.5f, 0.0f,
		 0.0f,  0.5f, 0.0f,
	};

	float secondTriangle[] = {
		-0.5f, 1.0f, 0.0f,
		 0.5f, 1.0f, 0.0f,
		 0.0f,  0.5f, 0.0f,
	};

	unsigned int VAOs[2];
	unsigned int VBOs[2];

	glGenVertexArrays(2, VAOs); // 我们还可以同时生成多个vao或缓冲区
	glGenBuffers(2, VBOs);


	glBindVertexArray(VAOs[0]);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(firstTriangle), firstTriangle, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	//glBindVertexArray(0); //不需要解除绑定，因为我们在接下来的几行中直接绑定了一个不同的VAO
	glBindVertexArray(VAOs[1]);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(secondTriangle), secondTriangle, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);


	while (!glfwWindowShouldClose(window))
	{
		//输入
		processInput(window);

		//渲染
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);
		glUseProgram(shaderProgram1);

		glBindVertexArray(VAOs[0]);
		glDrawArrays(GL_TRIANGLES, 0, 3);

		glUseProgram(shaderProgram2);
		glBindVertexArray(VAOs[1]);
		glDrawArrays(GL_TRIANGLES, 0, 3);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	glDeleteVertexArrays(2, VAOs);
	glDeleteBuffers(2, VBOs);
	glDeleteProgram(shaderProgram1);
	glDeleteProgram(shaderProgram2);
	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

### 元素缓冲对象（EBO）

EBO也叫索引缓冲对象(Index Buffer Object，IBO)。要解释元素缓冲对象的工作方式最好还是举个例子：假设我们不再绘制一个三角形而是绘制一个矩形。我们可以**绘制两个三角形来组成一个矩形**（OpenGL主要处理三角形）。这会生成下面的顶点的集合：

```c++ nums
float vertices[] = {
    // 第一个三角形
    0.5f, 0.5f, 0.0f,   // 右上角
    0.5f, -0.5f, 0.0f,  // 右下角
    -0.5f, 0.5f, 0.0f,  // 左上角
    // 第二个三角形
    0.5f, -0.5f, 0.0f,  // 右下角
    -0.5f, -0.5f, 0.0f, // 左下角
    -0.5f, 0.5f, 0.0f   // 左上角
};
```

可以看到，有几个顶点叠加了。我们指定了`右下角`和`左上角`两次！一个矩形只有4个而不是6个顶点，这样就产生50%的额外开销。当我们有包括上千个三角形的模型之后这个问题会更糟糕，这会产生一大堆浪费。**更好的解决方案是只储存不同的顶点，并设定绘制这些顶点的顺序。这样子我们只要储存4个顶点就能绘制矩形了，之后只要指定绘制的顺序就行了。**如果OpenGL提供这个功能就好了，对吧？

值得庆幸的是，元素缓冲区对象的工作方式正是如此。 **EBO是一个缓冲区，就像一个顶点缓冲区对象一样，它存储 OpenGL 用来决定要绘制哪些顶点的索引。**这种所谓的**索引绘制(Indexed Drawing)**正是我们问题的解决方案。

(1)首先，我们先要定义（不重复的）顶点，和绘制出矩形所需的索引：

```c++ nums
float vertices[] = {
    0.5f, 0.5f, 0.0f,   // 右上角
    0.5f, -0.5f, 0.0f,  // 右下角
    -0.5f, -0.5f, 0.0f, // 左下角
    -0.5f, 0.5f, 0.0f   // 左上角
};

unsigned int indices[] = {
    // 注意索引从0开始! 
    // 此例的索引(0,1,2,3)就是顶点数组vertices的下标，
    // 这样可以由下标代表顶点组合成矩形

    0, 1, 3, // 第一个三角形
    1, 2, 3  // 第二个三角形
};
```

你可以看到，当使用索引的时候，我们只定义了4个顶点，而不是6个。

(2)下一步我们需要创建元素缓冲对象：

```c++ nums
unsigned int EBO;
glGenBuffers(1, &EBO);
```

与VBO类似，我们先绑定EBO然后用`glBufferData`把索引复制到缓冲里。同样，和VBO类似，我们会把这些函数调用放在绑定和解绑函数调用之间，只不过这次我们把**缓冲的类型定义为`GL_ELEMENT_ARRAY_BUFFER`**。

```c++ nums
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
```

注意：我们传递了`GL_ELEMENT_ARRAY_BUFFER`当作缓冲目标。

(3)最后一件要做的事是用**`glDrawElements`**来替换`glDrawArrays`函数，**表示我们要从索引缓冲区渲染三角形**。**使用`glDrawElements`时，我们会使用当前绑定的索引缓冲对象中的索引进行绘制：**

```c++ nums
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
```

**第一个参数指定了我们绘制的模式**，这个和glDrawArrays的一样。

**第二个参数是我们打算绘制顶点的个数**，这里填6，也就是说我们一共需要绘制6个顶点。

**第三个参数是索引的类型**，这里是GL_UNSIGNED_INT。

**最后一个参数里我们可以指定EBO中的偏移量**（或者传递一个索引数组，但是这是当你不在使用索引缓冲对象的时候），但是我们会在这里填写0。

**`glDrawElements`函数从当前绑定到GL_ELEMENT_ARRAY_BUFFER目标的EBO中获取其索引。**这意味着我们每次想要使用索引渲染对象时都必须绑定相应的EBO，这又有点麻烦。碰巧**顶点数组对象也跟踪元素缓冲区对象绑定**。在绑定VAO时，绑定的最后一个元素缓冲区对象存储为VAO的元素缓冲区对象。然后，绑定到VAO也会自动绑定该EBO。

![[vertex_array_objects_ebo.png|img]]

> 当目标是GL_ELEMENT_ARRAY_BUFFER的时候，VAO会储存glBindBuffer的函数调用。这也意味着它也会储存解绑调用，**所以确保你没有在解绑VAO之前解绑索引数组缓冲，否则它就没有这个EBO配置了。**

最后的初始化和绘制代码现在看起来像这样：

```c++ nums
// ..:: 初始化代码 :: ..
// 1. 绑定顶点数组对象
glBindVertexArray(VAO);
// 2. 把我们的顶点数组复制到一个顶点缓冲中，供OpenGL使用
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
// 3. 复制我们的索引数组到一个索引缓冲中，供OpenGL使用
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
// 4. 设定顶点属性指针
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

[...]

// ..:: 绘制代码（渲染循环中） :: ..
glUseProgram(shaderProgram);
glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
glBindVertexArray(0);
```

运行程序会获得下面这样的图片的结果。左侧图片看应该起来很熟悉，而右侧的则是使用线框模式(Wireframe Mode)绘制的。线框矩形可以显示出矩形的确是由两个三角形组成的。

![[hellotriangle2.png|img]]

> **线框模式(Wireframe Mode)**
>
> 要想用线框模式绘制你的三角形，你可以通过`glPolygonMode(GL_FRONT_AND_BACK, GL_LINE)`函数配置OpenGL如何绘制图元。第一个参数表示我们打算将其应用到所有的三角形的正面和背面，第二个参数告诉我们用线来绘制。之后的绘制调用会一直以线框模式绘制三角形，直到我们用`glPolygonMode(GL_FRONT_AND_BACK, GL_FILL)`将其设置回默认模式。

#### 代码（两个三角形组成矩形+线框）

```c++ nums
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#include <iostream>
void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

//顶点着色器的源代码硬编码
const char* vertexShaderSource = "#version 330 core\n"
"layout (location = 0) in vec3 aPos;\n"
"void main()\n"
"{\n"
"   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
"}\0";

//片元着色器的源代码硬编码
const char* fragmentShaderSource = "#version 330 core\n"
"out vec4 FragColor;\n"
"void main()\n"
"{\n"
"   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
"}\0";

int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //种植
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}

	//创建和编译Shader
	// ------------------
	//1. 顶点着色器
	unsigned int vertexShader;
	vertexShader = glCreateShader(GL_VERTEX_SHADER); //创建着色器对象
	glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);	//着色器源码附加到着色器对象
	glCompileShader(vertexShader);	//编译着色器

	//编译检测
	int success;	//表示是否成功编译
	char infoLog[512];	//存储错误信息的容器
	glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(vertexShader, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
	}

	//2. 片元着色器
	unsigned int fragmentShader;
	fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
	glCompileShader(fragmentShader);

	//编译检测
	glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
	}

	//3. 把两个着色器对象链接到一个用来渲染的着色器程序中
	unsigned int shaderProgram;
	shaderProgram = glCreateProgram();//创建着色器程序对象

	glAttachShader(shaderProgram, vertexShader); //着色器附加到程序对象上
	glAttachShader(shaderProgram, fragmentShader);
	glLinkProgram(shaderProgram);	//链接他们

	//链接检测
	glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);	//检测是否编译成功
	if (!success)
	{
		glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog); //获取错误信息然后打印
		std::cout << "ERROR::SHADER::VERTEX::LINK_FAILED\n" << infoLog << std::endl;
	}

	//删除顶点、片元着色器对象
	glDeleteShader(vertexShader);
	glDeleteShader(fragmentShader);

	//设置顶点数据(和缓冲区)并配置顶点属性
	// ----------------------------
	//定义（不重复的）顶点，和绘制出矩形所需的索引
	float vertices[] = {
		0.5f, 0.5f, 0.0f,   // 右上角
		0.5f, -0.5f, 0.0f,  // 右下角
		-0.5f, -0.5f, 0.0f, // 左下角
		-0.5f, 0.5f, 0.0f   // 左上角
	};

	unsigned int indices[] = {
		0, 1, 3, // 第一个三角形
		1, 2, 3  // 第二个三角形
	};

	unsigned int VAO;	//顶点数组对象
	unsigned int VBO;	//顶点缓冲对象：管理显存
	unsigned int EBO;	//元素缓冲对象

	//设置缓冲ID
	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);

	glBindVertexArray(VAO);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBO); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	//4. 链接顶点属性
	//设置顶点属性指针
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);	//启用顶点属性

	//注意这是允许的，对glVertexAttribPointer的调用将VBO注册为顶点属性的绑定顶点缓冲器对象，所以之后我们可以安全地解除绑定。
	glBindBuffer(GL_ARRAY_BUFFER, 0);

	//记住:当绑定的元素缓冲区对象存储在VAO中时，不要解除EBO绑定;保持EBO的稳定。
	//glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);

	//你可以在事后解除对VAO的绑定，这样其他的VAO调用就不会意外地修改这个VAO，但这很少发生。修改其他 VAO需要调用glBindVertexArray，所以在没有直接必要的情况下，我们一般不会解除对VAO（或者VBO）的绑定。
	glBindVertexArray(0);

	//取消注释这个调用来绘制线框多边形。
	glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

	//引擎：渲染循环
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//5. 使用着色器程序渲染物体
		glUseProgram(shaderProgram);
		glBindVertexArray(VAO); //因为我们只有一个VAO，所以没有必要每次都绑定它，但为了让事情更有条理，我们会这样做

		//6. 绘制物体
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
		//glBindVertexArray(0); //没有必要每次都解除绑定


		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	glDeleteVertexArrays(1, &VAO);
	glDeleteBuffers(1, &VBO);
	glDeleteBuffers(1, &EBO);
	glDeleteProgram(shaderProgram);

	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	//设置视口大小
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

## 着色器

前文提到，着色器(Shader)是运行在GPU上的小程序。这些小程序为图形渲染管线的某个特定部分而运行。从基本意义上来说，着色器只是一种把输入转化为输出的程序。着色器也是一种非常独立的程序，因为它们之间不能相互通信；它们之间唯一的沟通只有通过输入和输出。

前面的教程里我们简要地触及了一点着色器的皮毛，并了解了如何恰当地使用它们。现在我们会用一种更加广泛的形式详细解释着色器，特别是OpenGL着色器语言(GLSL)。

### GLSL

着色器是使用一种叫GLSL的类C语言写成的。GLSL是为图形计算量身定制的，它包含一些针对向量和矩阵操作的有用特性。

**着色器的开头总是要声明版本，接着是输入和输出变量、uniform和main函数。**每个着色器的入口点都是main函数，在这个函数中我们处理所有的输入变量，并将结果输出到输出变量中。如果你不知道什么是uniform也不用担心，我们后面会进行讲解。

一个典型的着色器有下面的结构：

```c++ nums
#version version_number
in type in_variable_name;
in type in_variable_name;

out type out_variable_name;

uniform type uniform_name;

int main()
{
  // 处理输入并进行一些图形操作
  ...
  // 输出处理过的结果到输出变量
  out_variable_name = weird_stuff_we_processed;
}
```

当我们特别谈论到顶点着色器的时候，每个输入变量也叫顶点属性(Vertex Attribute)。**我们能声明的顶点属性是有上限的，它一般由硬件来决定。OpenGL确保至少有16个包含4分量的顶点属性可用，但是有些硬件或许允许更多的顶点属性**，你可以查询`GL_MAX_VERTEX_ATTRIBS`来获取具体的上限：

```c++ nums
int nrAttributes;
glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, &nrAttributes);
std::cout << "Maximum nr of vertex attributes supported: " << nrAttributes << std::endl;

//通常情况下它至少会返回16个，大部分情况下是够用了。
```

### 数据类型

和其他编程语言一样，GLSL有数据类型可以来指定变量的种类。GLSL中包含C等其它语言大部分的**默认基础数据类型**：`int`、`float`、`double`、`uint`和`bool`。GLSL也有**两种容器**类型，它们会在这个教程中使用很多，分别是向量(Vector)和矩阵(Matrix)，其中矩阵我们会在之后的教程里再讨论。

#### 向量

**GLSL中的向量是一个可以包含有2、3或者4个分量的容器**，分量的类型可以是前面默认基础类型的任意一个。它们可以是下面的形式（`n`代表分量的数量）：

| 类型    | 含义                            |
| :------ | :------------------------------ |
| `vecn`  | 包含`n`个float分量的默认向量    |
| `bvecn` | 包含`n`个bool分量的向量         |
| `ivecn` | 包含`n`个int分量的向量          |
| `uvecn` | 包含`n`个unsigned int分量的向量 |
| `dvecn` | 包含`n`个double分量的向量       |

大多数时候我们使用`vecn`，因为float足够满足大多数要求了。

一个向量的分量可以通过`vec.x`这种方式获取，这里`x`是指这个向量的第一个分量。你可以分别使用`.x`、`.y`、`.z`和`.w`来获取它们的第1、2、3、4个分量。GLSL也允许你对颜色使用`rgba`，或是对纹理坐标使用`stpq`访问相同的分量。

向量这一数据类型也允许一些有趣而灵活的**分量选择方式**，叫做**重组(Swizzling)**。重组允许这样的语法：

```c++ nums
vec2 someVec;
vec4 differentVec = someVec.xyxx;
vec3 anotherVec = differentVec.zyw;
vec4 otherVec = someVec.xxxx + anotherVec.yxzy;
```

你可以使用上面4个字母任意组合来创建一个和原来向量一样长的（同类型）新向量，只要原来向量有那些分量即可；然而，你**不允许在一个`vec2`向量中去获取`.z`元素**。

我们也可以把一个向量作为一个参数传给不同的向量构造函数，以减少需求参数的数量：

```c++ nums
vec2 vect = vec2(0.5, 0.7);
vec4 result = vec4(vect, 0.0, 0.0);
vec4 otherResult = vec4(result.xyz, 1.0);
```

### IO

虽然着色器是各自独立的小程序，但是它们都是一个整体的一部分，出于这样的原因，**我们希望每个着色器都有输入和输出，这样才能进行数据交流和传递。GLSL定义了`in`和`out`关键字专门来实现这个目的**。每个着色器使用这两个关键字设定输入和输出，**只要一个输出变量与下一个着色器阶段的输入匹配，它就会传递下去。但在顶点和片元着色器中会有点不同**。

顶点着色器应该接收的是一种特殊形式的输入，否则就会效率低下。**顶点着色器的输入特殊在，它从顶点数据中直接接收输入。**为了定义顶点数据该如何管理，我们使用`location`这一元数据指定输入变量，这样我们才可以在CPU上配置顶点属性。我们已经在前面的教程看过这个了，`layout (location = 0)`。**顶点着色器需要为它的输入提供一个额外的`layout`标识，这样我们才能把它链接到顶点数据。**

> 你也可以忽略`layout (location = 0)`标识符，通过在OpenGL代码中使用`glGetAttribLocation`查询属性位置值(Location)，但是我更喜欢在着色器中设置它们，这样会更容易理解而且节省你（和OpenGL）的工作量。

另一个例外是**片元着色器，它需要一个`vec4`颜色输出变量，因为片元着色器需要生成一个最终输出的颜色。**如果你在片元着色器没有定义输出颜色，OpenGL会把你的物体渲染为黑色（或白色）。

所以，如果我们打算从一个着色器向另一个着色器发送数据，我们必须在发送方着色器中声明一个输出，在接收方着色器中声明一个类似的输入。当类型和名字都一样的时候，OpenGL就会把两个变量链接到一起，它们之间就能发送数据了（这是在链接程序对象时完成的）。为了展示这是如何工作的，我们会稍微改动一下之前教程里的那个着色器，让顶点着色器为片元着色器决定颜色。

```c++ nums
//顶点着色器
#version 330 core
layout (location = 0) in vec3 aPos; // 位置变量的属性位置值为0

out vec4 vertexColor; // 为片元着色器指定一个颜色输出

void main()
{
    gl_Position = vec4(aPos, 1.0); // 注意我们如何把一个vec3作为vec4的构造器的参数
    vertexColor = vec4(0.5, 0.0, 0.0, 1.0); // 把输出变量设置为暗红色
}

//片元着色器
#version 330 core
out vec4 FragColor;

in vec4 vertexColor; // 从顶点着色器传来的输入变量（名称相同、类型相同）

void main()
{
    FragColor = vertexColor;
}
```

你可以看到我们在顶点着色器中声明了一个vertexColor变量作为`vec4`输出，并在片元着色器中声明了一个类似的vertexColor。由于它们名字相同且类型相同，片元着色器中的vertexColor就和顶点着色器中的vertexColor链接了。由于我们在顶点着色器中将颜色设置为深红色，最终的片段也是深红色的。下面的图片展示了输出结果：

![[shaders.png|img]]

完成了！我们成功地从顶点着色器向片元着色器发送数据。让我们更上一层楼，看看能否**从应用程序中直接给片元着色器发送一个颜色**！

### Uniform

**适用场景：设置一个在渲染迭代中会改变的属性**

**Uniform是一种从CPU中的应用向GPU中的着色器发送数据的方式。**

**uniform和顶点属性有些不同。**首先，uniform是全局的(Global)。全局意味着uniform变量必须在每个着色器程序对象中都是独一无二的，而且它可以被着色器程序的任意着色器在任意阶段访问。第二，无论你把uniform值设置成什么，uniform会一直保存它们的数据，直到它们被重置或更新。

我们可以在一个着色器中添加`uniform`关键字至类型和变量名前来声明一个GLSL的uniform。从此处开始我们就可以在着色器中使用新声明的uniform了。我们来看看这次是否能通过uniform设置三角形的颜色：

```c++ nums
#version 330 core
out vec4 FragColor;

uniform vec4 ourColor; // 在OpenGL程序代码中设定这个变量

void main()
{
    FragColor = ourColor;
}
```

我们在片元着色器中声明了一个uniform `vec4`的ourColor，并把片元着色器的输出颜色设置为uniform值的内容。因为uniform是全局变量，我们可以在任何着色器中定义它们，而无需通过顶点着色器作为中介。顶点着色器中不需要这个uniform，所以我们不用在那里定义它。

> 如果你声明了一个uniform却在GLSL代码中没用过，编译器会静默移除这个变量，导致最后编译出的版本中并不会包含它，这可能导致几个非常麻烦的错误，记住这点！

这个uniform现在还是空的；我们还没有给它添加任何数据，所以下面我们就做这件事。**我们首先需要找到着色器中uniform属性的索引/位置值。**当我们得到uniform的索引/位置值后，我们就可以更新它的值了。这次我们不去给像素传递单独一个颜色，而是让它随着时间改变颜色：

```c++ nums
float timeValue = glfwGetTime();
float greenValue = (sin(timeValue) / 2.0f) + 0.5f;
int vertexColorLocation = glGetUniformLocation(shaderProgram, "ourColor");
glUseProgram(shaderProgram);
glUniform4f(vertexColorLocation, 0.0f, greenValue, 0.0f, 1.0f);
```

(1)首先我们通过`glfwGetTime()`获取运行的秒数。然后我们使用sin函数让颜色在0.0到1.0之间改变，最后将结果储存到`greenValue`里。

(2)接着，我们用**` glGetUniformLocation`查询uniform ourColor的位置值**。我们为查询函数提供着色器程序和uniform的名字（这是我们希望获得的位置值的来源）。如果`glGetUniformLocation`返回`-1`就代表没有找到这个位置值。

(3)最后，我们可以**通过`glUniform4f`函数设置uniform值**。注意，查询uniform地址不要求你之前使用过着色器程序，但是**更新一个uniform之前你必须先使用程序（调用`glUseProgram`)，因为它是在当前激活的着色器程序中设置uniform的**。

> 因为OpenGL在其核心是一个C库，所以它**不支持类型重载**，在函数参数不同的时候就要为其定义新的函数；**`glUniform`是一个典型例子。这个函数有一个特定的后缀，标识设定的uniform的类型。可能的后缀有：**
>
> | 后缀 | 含义                                 |
> | :--- | :----------------------------------- |
> | `f`  | 函数需要一个float作为它的值          |
> | `i`  | 函数需要一个int作为它的值            |
> | `ui` | 函数需要一个unsigned int作为它的值   |
> | `3f` | 函数需要3个float作为它的值           |
> | `fv` | 函数需要一个float向量/数组作为它的值 |
>
> 每当你打算配置一个OpenGL的选项时就可以简单地根据这些规则选择适合你的数据类型的重载函数。在我们的例子里，我们希望分别设定uniform的4个float值，所以我们通过glUniform4f传递我们的数据(注意，我们也可以使用`fv`版本)。

现在你知道如何设置uniform变量的值了，我们可以**使用它们来渲染**了。如果我们打算让颜色慢慢变化，我们就要在游戏循环的每一次迭代中（所以他会逐帧改变）更新这个uniform，否则三角形就不会改变颜色。下面我们就计算greenValue然后每个渲染迭代都更新这个uniform：

```c++ nums
while(!glfwWindowShouldClose(window))
{
    // 输入
    processInput(window);

    // 渲染
    // 清除颜色缓冲
    glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    // 记得激活着色器
    glUseProgram(shaderProgram);

    // 更新uniform颜色
    float timeValue = glfwGetTime();
    float greenValue = sin(timeValue) / 2.0f + 0.5f;
    int vertexColorLocation = glGetUniformLocation(shaderProgram, "ourColor");
    glUniform4f(vertexColorLocation, 0.0f, greenValue, 0.0f, 1.0f);

    // 绘制三角形
    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLES, 0, 3);

    // 交换缓冲并查询IO事件
    glfwSwapBuffers(window);
    glfwPollEvents();
}
```

这里的代码对之前代码是一次非常直接的修改。这次，我们在每次迭代绘制三角形前先更新uniform值。如果你正确更新了uniform，你会看到你的三角形逐渐由绿变黑再变回绿色:[实现效果](https://learnopengl-cn.github.io/img/01/05/shaders.mp4)    [源码](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/3.1.shaders_uniform/shaders_uniform.cpp)

可以看到，**uniform对于设置一个在渲染迭代中会改变的属性是一个非常有用的工具，它也是一个在程序和着色器间数据交互的很好工具**，但假如我们打算为每个顶点设置一个颜色的时候该怎么办？这种情况下，我们就不得不声明和顶点数目一样多的uniform了。在这一问题上更好的解决方案是在顶点属性中包含更多的数据，这是我们接下来要做的事情。

### 更多属性

在前面的教程中，我们了解了如何填充VBO、配置顶点属性指针以及如何把它们都储存到一个VAO里。这次，我们同样打算把颜色数据加进顶点数据中。我们将把颜色数据添加为3个float值至vertices数组。我们将把三角形的三个角分别指定为红色、绿色和蓝色：

```c++ nums
float vertices[] = {
    // 位置              // 颜色
     0.5f, -0.5f, 0.0f,  1.0f, 0.0f, 0.0f,   // 右下
    -0.5f, -0.5f, 0.0f,  0.0f, 1.0f, 0.0f,   // 左下
     0.0f,  0.5f, 0.0f,  0.0f, 0.0f, 1.0f    // 顶部
};
```

由于现在有更多的数据要发送到顶点着色器，我们有必要去调整一下顶点着色器，使它能够接收颜色值作为一个顶点属性输入。需要注意的是我们用`layout`标识符来把aColor属性的位置值设置为1：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;   // 位置变量的属性位置值为 0 
layout (location = 1) in vec3 aColor; // 颜色变量的属性位置值为 1

out vec3 ourColor; // 向片元着色器输出一个颜色

void main()
{
    gl_Position = vec4(aPos, 1.0);
    ourColor = aColor; // 将ourColor设置为我们从顶点数据那里得到的输入颜色
}
```

由于我们不再使用uniform来传递片段的颜色了，现在使用`ourColor`输出变量，我们必须再修改一下片元着色器：

```c++ nums
#version 330 core
out vec4 FragColor;  
in vec3 ourColor;

void main()
{
    FragColor = vec4(ourColor, 1.0);
}
```

因为我们添加了另一个顶点属性，并且更新了VBO的内存，我们就必须重新配置顶点属性指针。更新后的VBO内存中的数据现在看起来像这样：

![[vertex_attribute_pointer_interleaved 1.png|img]]

知道了现在使用的布局，我们就可以使用`glVertexAttribPointer`函数更新顶点格式，

```c++ nums
// 位置属性
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
// 颜色属性
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3* sizeof(float)));
glEnableVertexAttribArray(1);
```

`glVertexAttribPointer`函数的前几个参数比较明了。这次我们配置属性位置值为1的顶点属性。颜色值有3个float那么大，我们不去标准化这些值。

由于我们现在有了两个顶点属性，我们不得不重新计算**步长**值。为获得数据队列中下一个属性值（比如位置向量的下个`x`分量）我们必须向右移动6个float，其中3个是位置值，另外3个是颜色值。这使我们的步长值为6乘以float的字节数（=24字节）。
同样，这次我们必须指定一个偏移量。对于每个顶点来说，位置顶点属性在前，所以它的偏移量是0。颜色属性紧随位置数据之后，所以偏移量就是`3 * sizeof(float)`，用字节来计算就是12字节。

运行程序你应该会看到如下结果：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/3.2.shaders_interpolation/shaders_interpolation.cpp)

![[shaders3.png|img]]

这个图片可能不是你所期望的那种，因为我们只提供了3个颜色，而不是我们现在看到的大调色板。这是在片元着色器中进行的所谓**片段插值(Fragment Interpolation)**的结果。当渲染一个三角形时，光栅化(Rasterization)阶段通常会造成比原指定顶点更多的片段。光栅会根据每个片段在三角形形状上所处相对位置决定这些片段的位置。
基于这些位置，它会插值(Interpolate)所有片元着色器的输入变量。比如说，我们有一个线段，上面的端点是绿色的，下面的端点是蓝色的。如果一个片元着色器在线段的70%的位置运行，它的颜色输入属性就会是一个绿色和蓝色的线性结合；更精确地说就是30%蓝 + 70%绿。

这正是在这个三角形中发生了什么。我们有3个顶点，和相应的3个颜色，从这个三角形的像素来看它可能包含50000左右的片段，片元着色器为这些像素进行插值颜色。如果你仔细看这些颜色就应该能明白了：红首先变成到紫再变为蓝色。片段插值会被应用到片元着色器的所有输入属性上。

### 我们自己的着色器类

编写、编译、管理着色器是件麻烦事。在着色器主题的最后，我们会写一个类来让我们的生活轻松一点，它可以从硬盘读取着色器，然后编译并链接它们，并对它们进行错误检测，这就变得很好用了。这也会让你了解该如何封装目前所学的知识到一个抽象对象中。

我们会把着色器类全部放在在头文件里，主要是为了学习用途，当然也方便移植。我们先来添加必要的include，并定义类结构：

```c++ nums
#ifndef SHADER_H
#define SHADER_H

#include <glad/glad.h>; // 包含glad来获取所有的必须OpenGL头文件

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>


class Shader
{
public:
    // 程序ID
    unsigned int ID;

    // 构造器读取并构建着色器
    Shader(const char* vertexPath, const char* fragmentPath);
    // 使用/激活程序
    void use();
    // uniform工具函数
    void setBool(const std::string &name, bool value) const;  
    void setInt(const std::string &name, int value) const;   
    void setFloat(const std::string &name, float value) const;
};

#endif
```

> 在上面，我们在头文件顶部使用了几个**预处理指令(Preprocessor Directives)**。这些预处理指令会告知你的编译器只在它没被包含过的情况下才包含和编译这个头文件，即使多个文件都包含了这个着色器头文件。它是用来防止链接冲突的。

着色器类储存了着色器程序的ID。它的构造器需要顶点和片元着色器源代码的文件路径，这样我们就可以把源码的文本文件储存在硬盘上了。除此之外，为了让我们的生活更轻松一点，还加入了一些工具函数：use用来激活着色器程序，所有的set…函数能够查询一个unform的位置值并设置它的值。

（1）我们使用C++文件流读取着色器内容，储存到几个`string`对象里

```c++ nums
Shader(const char* vertexPath, const char* fragmentPath)
{
    // 1. 从文件路径中获取顶点/片元着色器
    std::string vertexCode;
    std::string fragmentCode;
    std::ifstream vShaderFile;
    std::ifstream fShaderFile;
    // 保证ifstream对象可以抛出异常：
    vShaderFile.exceptions (std::ifstream::failbit | std::ifstream::badbit);
    fShaderFile.exceptions (std::ifstream::failbit | std::ifstream::badbit);
    try 
    {
        // 打开文件
        vShaderFile.open(vertexPath);
        fShaderFile.open(fragmentPath);
        std::stringstream vShaderStream, fShaderStream;
        // 读取文件的缓冲内容到数据流中
        vShaderStream << vShaderFile.rdbuf();
        fShaderStream << fShaderFile.rdbuf();       
        // 关闭文件处理器
        vShaderFile.close();
        fShaderFile.close();
        // 转换数据流到string
        vertexCode   = vShaderStream.str();
        fragmentCode = fShaderStream.str();     
    }
    catch(std::ifstream::failure e)
    {
        std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
    }
    const char* vShaderCode = vertexCode.c_str();
    const char* fShaderCode = fragmentCode.c_str();
    [...]
```

（2）下一步，我们需要编译和链接着色器。注意，我们也将检查编译/链接是否失败，如果失败则打印编译时错误，调试的时候这些错误输出会及其重要（你总会需要这些错误日志的）：

```c++ nums
// 2. 编译着色器
unsigned int vertex, fragment;
int success;
char infoLog[512];

// 顶点着色器
vertex = glCreateShader(GL_VERTEX_SHADER);
glShaderSource(vertex, 1, &vShaderCode, NULL);
glCompileShader(vertex);
// 打印编译错误（如果有的话）
glGetShaderiv(vertex, GL_COMPILE_STATUS, &success);
if(!success)
{
    glGetShaderInfoLog(vertex, 512, NULL, infoLog);
    std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
};

// 片元着色器也类似
[...]

// 着色器程序
ID = glCreateProgram();
glAttachShader(ID, vertex);
glAttachShader(ID, fragment);
glLinkProgram(ID);
// 打印连接错误（如果有的话）
glGetProgramiv(ID, GL_LINK_STATUS, &success);
if(!success)
{
    glGetProgramInfoLog(ID, 512, NULL, infoLog);
    std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
}

// 删除着色器，它们已经链接到我们的程序中了，已经不再需要了
glDeleteShader(vertex);
glDeleteShader(fragment);
```

use函数非常简单：

```c++ nums
void use() 
{ 
    glUseProgram(ID);
}
```

uniform的setter函数也很类似：

```c++ nums
void setBool(const std::string &name, bool value) const
{
    glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value); 
}
void setInt(const std::string &name, int value) const
{ 
    glUniform1i(glGetUniformLocation(ID, name.c_str()), value); 
}
void setFloat(const std::string &name, float value) const
{ 
    glUniform1f(glGetUniformLocation(ID, name.c_str()), value); 
} 
```

(3)现在我们就写完了一个完整的[着色器类](https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/shader_s.h)。使用这个着色器类很简单；只要创建一个着色器对象，从那一点开始我们就可以开始使用了：

```c++ nums
Shader ourShader("path/to/shaders/shader.vs", "path/to/shaders/shader.fs");
...
while(...)
{
    ourShader.use();
    ourShader.setFloat("someUniform", 1.0f);
    DrawStuff();
}
```

**我们把顶点和片元着色器储存为两个叫做`shader.vs`和`shader.fs`的文件。你可以使用自己喜欢的名字命名着色器文件；我自己觉得用`.vs`和`.fs`作为扩展名很直观**。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/3.3.shaders_class/shaders_class.cpp)找到使用[新着色器类](https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/shader_s.h)的源代码。注意你可以点击源码中的着色器文件路径来查看每一个着色器的源代码。

#### 代码

```c++ nums
#ifndef SHADER_H
#define SHADER_H

#include <glad/glad.h>
#include <glad/glad.h>
#include <glm/glm.hpp>

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>

class Shader
{
public:
	//程序ID
	unsigned int ID;

	//着色器构造函数
	Shader(const char* vertexPath, const char* fragmentPath)
	{
		//1. 从文件路径中获取顶点/片元着色器
		std::string vertexCode;
		std::string fragmentCode;
		std::ifstream vShaderFile;
		std::ifstream fShaderFile;

		//保证ifstream对象可以抛出异常：
		vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
		fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);

		try
		{
			//打开文件
			vShaderFile.open(vertexPath);
			fShaderFile.open(fragmentPath);
			std::stringstream vShaderStream, fShaderStream;
			//读取文件的缓冲内容到数据流中
			vShaderStream << vShaderFile.rdbuf();
			fShaderStream << fShaderFile.rdbuf();
			//关闭文件处理器
			vShaderFile.close();
			fShaderFile.close();
			//转换数据流到string
			vertexCode = vShaderStream.str();
			fragmentCode = fShaderStream.str();
		}
		catch (std::ifstream::failure e)
		{
			std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
		}

		const char* vShaderCode = vertexCode.c_str();
		const char* fShaderCode = fragmentCode.c_str();

		//2. 编译着色器
		unsigned int vertex, fragment; 

		//顶点着色器
		vertex = glCreateShader(GL_VERTEX_SHADER);
		glShaderSource(vertex, 1, &vShaderCode, nullptr);
		glCompileShader(vertex);
		//检测编译错误（如果有的话）
		checkErrors(vertex, "VERTEX");

		//片元着色器
		fragment = glCreateShader(GL_FRAGMENT_SHADER);
		glShaderSource(fragment, 1, &fShaderCode, nullptr);
		glCompileShader(fragment);
		//检测编译错误
		checkErrors(fragment, "FRAGMENT");

		//链接到着色器程序
		ID = glCreateProgram();
		glAttachShader(ID, vertex);
		glAttachShader(ID, fragment);
		glLinkProgram(ID);
		//检测链接错误
		checkErrors(ID, "PROGRAM");

		//删除着色器
		glDeleteShader(vertex);
		glDeleteShader(fragment);
	}

	//使用/激活着色器程序
	void use()
	{
		glUseProgram(ID);
	}
	//uniform工具函数:查询一个uniform的位置值并设置它的值。
	void setBool(const std::string& name, bool value) const
	{
		glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value);
	}
	// ------------------------------------------------------------------------
	void setInt(const std::string& name, int value) const
	{
		glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
	}
	// ------------------------------------------------------------------------
	void setFloat(const std::string& name, float value) const
	{
		glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
	}
	// ------------------------------------------------------------------------
	void setVec2(const std::string& name, const glm::vec2& value) const
	{
		glUniform2fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
	}
	void setVec2(const std::string& name, float x, float y) const
	{
		glUniform2f(glGetUniformLocation(ID, name.c_str()), x, y);
	}
	// ------------------------------------------------------------------------
	void setVec3(const std::string& name, const glm::vec3& value) const
	{
		glUniform3fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
	}
	void setVec3(const std::string& name, float x, float y, float z) const
	{
		glUniform3f(glGetUniformLocation(ID, name.c_str()), x, y, z);
	}
	// ------------------------------------------------------------------------
	void setVec4(const std::string& name, const glm::vec4& value) const
	{
		glUniform4fv(glGetUniformLocation(ID, name.c_str()), 1, &value[0]);
	}

	void setVec4(const std::string& name, float x, float y, float z, float w) const
	{
		glUniform4f(glGetUniformLocation(ID, name.c_str()), x, y, z, w);
	}
	// ------------------------------------------------------------------------
	void setMat2(const std::string& name, const glm::mat2& mat) const
	{
		glUniformMatrix2fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}
	// ------------------------------------------------------------------------
	void setMat3(const std::string& name, const glm::mat3& mat) const
	{
		glUniformMatrix3fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}
	// ------------------------------------------------------------------------
	void setMat4(const std::string& name, const glm::mat4& mat) const
	{
		glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}


private:
	//检测编译或者链接错误
	void checkErrors(unsigned int shader, std::string type)
	{
		int success;
		char infoLog[1024];
		if (type != "PROGRAM")
		{
			glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
			if (!success)
			{
				glGetShaderInfoLog(shader, 1024, NULL, infoLog);
				std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << std::endl;
			}
		}
		else
		{
			glGetProgramiv(shader, GL_LINK_STATUS, &success);
			if (!success)
			{
				glGetProgramInfoLog(shader, 1024, NULL, infoLog);
				std::cout << "ERROR::PROGRAM_LINK_ERROR of type: " << type << "\n" << infoLog << std::endl;
			}
		}

	}
};
#endif
```

## 纹理

使用`stb_image.h`库

我们已经了解到，我们可以为每个顶点添加颜色来增加图形的细节，从而创建出有趣的图像。但是，如果想让图形看起来更真实，我们就必须有足够多的顶点，从而指定足够多的颜色。这将会产生很多额外开销，因为每个模型都会需求更多的顶点，每个顶点又需求一个颜色属性。

艺术家和程序员更喜欢使用**纹理(Texture)**。**纹理是一个2D图片（甚至也有1D和3D的纹理），它可以用来添加物体的细节；**你可以想象纹理是一张绘有砖块的纸，无缝折叠贴合到你的3D的房子上，这样你的房子看起来就像有砖墙外表了。因为我们可以在一张图片上插入非常多的细节，这样就可以让物体非常精细而不用指定额外的顶点。

> 除了图像以外，纹理也可以被用来储存大量的数据，这些数据可以发送到着色器上，但是这不是我们现在的主题。

下面你会看到之前教程的那个三角形贴上了一张[砖墙](https://learnopengl-cn.github.io/img/01/06/wall.jpg)图片。

![[textures.png|img]]

为了能够把纹理**映射(Map)**到三角形上，我们需要指定三角形的每个顶点各自对应纹理的哪个部分。这样每个顶点就会关联着一个**纹理坐标(Texture Coordinate，用来标明该从纹理图像的哪个部分采样（译注：采集片段颜色）)**。之后在图形的其它片段上进行**片段插值(Fragment Interpolation)**。

纹理坐标在x和y轴上，**范围为0到1之间**（注意我们使用的是2D纹理图像）。**使用纹理坐标获取纹理颜色叫做采样(Sampling)**。纹理坐标起始于(0, 0)，也就是纹理图片的左下角，终始于(1, 1)，即纹理图片的右上角。下面的图片展示了我们是如何把纹理坐标映射到三角形上的。

![[tex_coords.png|img]]

我们为三角形指定了3个纹理坐标点。如上图所示，我们希望三角形的左下角对应纹理的左下角，因此我们把三角形左下角顶点的纹理坐标设置为(0, 0)；三角形的上顶点对应于图片的上中位置所以我们把它的纹理坐标设置为(0.5, 1.0)；同理右下方的顶点设置为(1, 0)。我们只要给顶点着色器传递这三个纹理坐标就行了，接下来它们会被传片元着色器中，它会为每个片段进行纹理坐标的插值。

纹理坐标看起来就像这样：

```c++ nums
float texCoords[] = {
    0.0f, 0.0f, // 左下角
    1.0f, 0.0f, // 右下角
    0.5f, 1.0f // 上中
};
```

**对纹理采样的解释非常宽松，它可以采用几种不同的插值方式。所以我们需要自己告诉OpenGL该怎样对纹理采样。**

### 纹理环绕方式

纹理坐标的范围通常是从(0, 0)到(1, 1)，那**如果我们把纹理坐标设置在范围之外会发生什么？OpenGL默认的行为是重复这个纹理图像（我们基本上忽略浮点纹理坐标的整数部分）**，但OpenGL提供了更多的选择：

| 环绕方式           | 描述                                                         |
| :----------------- | :----------------------------------------------------------- |
| GL_REPEAT          | 对纹理的默认行为。重复纹理图像。                             |
| GL_MIRRORED_REPEAT | 和GL_REPEAT一样，但每次重复图片是镜像放置的。                |
| GL_CLAMP_TO_EDGE   | 纹理坐标会被约束在0到1之间，超出的部分会重复纹理坐标的边缘，产生一种边缘被拉伸的效果。 |
| GL_CLAMP_TO_BORDER | 超出的坐标为用户指定的边缘颜色。                             |

当纹理坐标超出默认范围时，每个选项都有不同的视觉效果输出。我们来看看这些纹理图像的例子：

![[texture_wrapping.png|img]]

前面提到的**每个选项都可以使用`glTexParameteri`函数对单独的一个坐标轴设置**（`s`、`t`（如果是使用3D纹理那么还有一个`r`）它们和`x`、`y`、`z`是等价的）：

```c++ nums
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_MIRRORED_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_MIRRORED_REPEAT);
```

**第一个参数指定了纹理目标**；我们使用的是2D纹理，因此纹理目标是GL_TEXTURE_2D。

**第二个参数需要我们指定设置的选项与应用的纹理轴**。我们打算配置的是`WRAP`选项，并且指定`S`和`T`轴。

**最后一个参数需要我们传递一个环绕方式(Wrapping)**，在这个例子中OpenGL会给当前激活的纹理设定纹理环绕方式为GL_MIRRORED_REPEAT。

如果我们选择`GL_CLAMP_TO_BORDER`选项，我们还需要指定一个边缘的颜色。这需要使用`glTexParameter函数`的`fv`后缀形式，用`GL_TEXTURE_BORDER_COLOR`作为它的选项，并且传递一个float数组作为边缘的颜色值：

```c++ nums
float borderColor[] = { 1.0f, 1.0f, 0.0f, 1.0f };
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, borderColor);
```

### 纹理过滤

纹理坐标不依赖于分辨率(Resolution)，它可以是任意浮点值，所以OpenGL需要知道怎样将**纹理像素(Texture Pixel)**映射到纹理坐标。当你有一个很大的物体但是纹理的分辨率很低的时候这就变得很重要了。你可能已经猜到了，OpenGL也有对于**纹理过滤(Texture Filtering)**的选项。纹理过滤有很多个选项，但是现在我们只讨论**最重要的两种：GL_NEAREST和GL_LINEAR**。

> 译注1
>
> Texture Pixel也叫Texel，你可以想象你打开一张`.jpg`格式图片，不断放大你会发现它是由无数像素点组成的，这个点就是纹理像素；注意不要和纹理坐标搞混，纹理坐标是你给模型顶点设置的那个数组，OpenGL以这个顶点的纹理坐标数据去查找纹理图像上的像素，然后进行采样提取纹理像素的颜色。

**GL_NEAREST（也叫邻近过滤，Nearest Neighbor Filtering）是OpenGL默认的纹理过滤方式**。当设置为GL_NEAREST的时候，**OpenGL会选择中心点最接近纹理坐标的那个像素**。下图中你可以看到四个像素，加号代表纹理坐标。左上角那个纹理像素的中心距离纹理坐标最近，所以它会被选择为样本颜色：

![[filter_nearest.png|img]]

**GL_LINEAR（也叫线性过滤，(Bi)linear Filtering）它会基于纹理坐标附近的纹理像素，计算出一个插值，近似出这些纹理像素之间的颜色。**一个纹理像素的中心距离纹理坐标越近，那么这个纹理像素的颜色对最终的样本颜色的贡献越大。下图中你可以看到返回的颜色是邻近像素的混合色：

![[filter_linear.png|img]]

那么这两种纹理过滤方式有怎样的视觉效果呢？让我们看看在一个很大的物体上应用一张低分辨率的纹理会发生什么吧（纹理被放大了，每个纹理像素都能看到）：

![[texture_filtering.png|img]]

GL_NEAREST产生了颗粒状的图案，我们能够清晰看到组成纹理的像素，而GL_LINEAR能够产生更平滑的图案，很难看出单个的纹理像素。GL_LINEAR可以产生更真实的输出，但有些开发者更喜欢8-bit风格，所以他们会用GL_NEAREST选项。

**当进行放大(Magnify)和缩小(Minify)操作的时候可以设置纹理过滤的选项**，比如你可以在纹理被缩小的时候使用邻近过滤，被放大时使用线性过滤。我们需要**使用`glTexParameteri`函数为放大和缩小指定过滤方式**。这段代码看起来会和纹理环绕方式的设置很相似：

```c++ nums
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
```

### 多级渐远纹理（Mipmap）

想象一下，假设我们有一个包含着上千物体的大房间，每个物体上都有纹理。有些物体会很远，但其纹理会拥有与近处物体同样高的分辨率。由于远处的物体可能只产生很少的片段，OpenGL从高分辨率纹理中为这些片段获取正确的颜色值就很困难，因为它需要对一个跨过纹理很大部分的片段只拾取一个纹理颜色。在小物体上这会产生不真实的感觉，更不用说对它们使用高分辨率纹理浪费内存的问题了。

OpenGL使用一种叫做**多级渐远纹理(Mipmap)**的概念来解决这个问题，它简单来说就是一系列的纹理图像，后一个纹理图像是前一个的二分之一。**多级渐远纹理背后的理念很简单：距观察者的距离超过一定的阈值，OpenGL会使用不同的多级渐远纹理，即最适合物体的距离的那个。**由于距离远，解析度不高也不会被用户注意到。同时，多级渐远纹理另一加分之处是它的性能非常好。让我们看一下多级渐远纹理是什么样子的：

![[mipmaps.png|img]]

手工**为每个纹理图像创建一系列多级渐远纹理**很麻烦，幸好OpenGL有一个**`glGenerateMipmaps`函数**，在创建完一个纹理后调用它OpenGL就会承担接下来的所有工作了。后面的教程中你会看到该如何使用它。

在渲染中切换多级渐远纹理级别(Level)时，OpenGL在两个不同级别的多级渐远纹理层之间会产生不真实的生硬边界。就像普通的纹理过滤一样，切换多级渐远纹理级别时你也可以在两个不同多级渐远纹理级别之间使用NEAREST和LINEAR过滤。**为了指定不同多级渐远纹理级别之间的过滤方式，你可以使用下面四个选项中的一个代替原有的过滤方式：**

| 过滤方式                  | 描述                                                         |
| :------------------------ | :----------------------------------------------------------- |
| GL_NEAREST_MIPMAP_NEAREST | 使用最邻近的多级渐远纹理来匹配像素大小，并使用邻近插值进行纹理采样 |
| GL_LINEAR_MIPMAP_NEAREST  | 使用最邻近的多级渐远纹理级别，并使用线性插值进行采样         |
| GL_NEAREST_MIPMAP_LINEAR  | 在两个最匹配像素大小的多级渐远纹理之间进行线性插值，使用邻近插值进行采样 |
| GL_LINEAR_MIPMAP_LINEAR   | 在两个邻近的多级渐远纹理之间使用线性插值，并使用线性插值进行采样 |

就像纹理过滤一样，我们可以**使用`glTexParameteri`将过滤方式设置为前面四种提到的方法之一：**

```c++ nums
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
```

**一个常见的错误是，将放大过滤的选项设置为多级渐远纹理过滤选项之一。**这样没有任何效果，因为多级渐远纹理主要是使用在纹理被缩小的情况下的：纹理放大不会使用多级渐远纹理，为放大过滤设置多级渐远纹理的选项会产生一个GL_INVALID_ENUM错误代码。

### 加载与创建纹理

使用纹理之前要做的第一件事是把它们加载到我们的应用中。**纹理图像可能被储存为各种各样的格式，每种都有自己的数据结构和排列，所以我们如何才能把这些图像加载到应用中呢？**一个解决方案是选一个需要的文件格式，比如`.PNG`，然后自己写一个图像加载器，把图像转化为字节序列。写自己的图像加载器虽然不难，但仍然挺麻烦的，而且如果要支持更多文件格式呢？你就不得不为每种你希望支持的格式写加载器了。

另一个解决方案也许是一种更好的选择，**使用一个支持多种流行格式的图像加载库来为我们解决这个问题。比如说我们要用的`stb_image.h`库。**

> ## stb_image.h
>
> `stb_image.h`是[Sean Barrett](https://github.com/nothings)的一个非常流行的**单头文件图像加载库，它能够加载大部分流行的文件格式，并且能够很简单得整合到你的工程之中。**`stb_image.h`可以在[这里](https://github.com/nothings/stb/blob/master/stb_image.h)下载。下载这一个头文件，将它以`stb_image.h`的名字加入你的工程，并另创建一个新的C++文件，输入以下代码：
>
> ```c++ nums
> #define STB_IMAGE_IMPLEMENTATION
> #include "stb_image.h"
> ```
>
> **通过定义STB_IMAGE_IMPLEMENTATION，预处理器会修改头文件，让其只包含相关的函数定义源码，等于是将这个头文件变为一个 `.cpp` 文件了。现在只需要在你的程序中包含`stb_image.h`并编译就可以了。**
>
> 下面的教程中，我们会使用一张[木箱](https://learnopengl-cn.github.io/img/01/06/container.jpg)的图片。要使用`stb_image.h`加载图片，我们需要使用它的**`stbi_load`函数**：
>
> ```c++ nums
> int width, height, nrChannels;
> unsigned char *data = stbi_load("container.jpg", &width, &height, &nrChannels, 0);
> ```
>
> 这个函数首先接受一个图像文件的位置作为输入。接下来它需要三个`int`作为它的第二、第三和第四个参数，`stb_image.h`将会用图像的**宽度**、**高度**和**颜色通道的个数**填充这三个变量。我们之后生成纹理的时候会用到的图像的宽度和高度的。

### 生成纹理

和之前生成的OpenGL对象一样，纹理也是使用ID引用的。让我们来创建一个：

```c++ nums
unsigned int texture;
glGenTextures(1, &texture);
```

**`glGenTextures`函数首先需要输入生成纹理的数量，然后把它们储存在第二个参数的`unsigned int`数组中**（我们的例子中只是单独的一个`unsigned int`，所以第二个参数不是数组），就像其他对象一样，我们需要绑定它，让之后任何的纹理指令都可以配置当前绑定的纹理：

```c++ nums
glBindTexture(GL_TEXTURE_2D, texture);
```

现在纹理已经绑定了，我们可以使用前面载入的图片数据生成一个纹理了。**纹理可以通过`glTexImage2D`来生成**：

```c++ nums
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
glGenerateMipmap(GL_TEXTURE_2D);
```

- **第一个参数指定了纹理目标(Target)。**设置为GL_TEXTURE_2D意味着会生成与当前绑定的纹理对象在同一个目标上的纹理（任何绑定到GL_TEXTURE_1D和GL_TEXTURE_3D的纹理不会受到影响）。
- **第二个参数为纹理指定多级渐远纹理的级别。**如果你希望单独手动设置每个多级渐远纹理的级别的话。这里我们填0，也就是基本级别。
- **第三个参数告诉OpenGL我们希望把纹理储存为何种格式。**我们的图像只有`RGB`值，因此我们也把纹理储存为`RGB`值。**若有透明度，则是alpha通道，所以一定要告诉OpenGL数据类型是GL_RGBA。**
- **第四个和第五个参数设置最终的纹理的宽度和高度。**我们之前加载图像的时候储存了它们，所以我们使用对应的变量。
- **第六个参数应该总是被设为`0`（**历史遗留的问题）。
- **第七第八个参数定义了源图的格式和数据类型。**我们使用RGB值加载这个图像，并把它们储存为`char`(byte)数组，我们将会传入对应值。
- **最后一个参数是真正的图像数据。**

**当调用`glTexImage2D`时，当前绑定的纹理对象就会被附加上纹理图像。**然而，目前只有基本级别(Base-level)的纹理图像被加载了，如果要使用多级渐远纹理，我们必须手动设置所有不同的图像（不断递增第二个参数）。或者，**直接在生成纹理之后调用`glGenerateMipmap`。这会为当前绑定的纹理自动生成所有需要的多级渐远纹理。**

**生成了纹理和相应的多级渐远纹理后，释放图像的内存**是一个很好的习惯。

```c++ nums
stbi_image_free(data);
```

生成一个纹理的过程应该看起来像这样：

```c++ nums
unsigned int texture;
glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D, texture);
// 为当前绑定的纹理对象设置环绕、过滤方式
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
// 加载并生成纹理
int width, height, nrChannels;
unsigned char *data = stbi_load("container.jpg", &width, &height, &nrChannels, 0);
if (data)
{
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
    glGenerateMipmap(GL_TEXTURE_2D);
}
else
{
    std::cout << "Failed to load texture" << std::endl;
}
stbi_image_free(data);
```

### 应用纹理

后面的这部分我们会使用`glDrawElements`绘制[「你好，三角形」](https://learnopengl-cn.github.io/01 Getting started/04 Hello Triangle/)教程最后一部分的矩形。**我们需要告知OpenGL如何采样纹理，所以我们必须使用纹理坐标更新顶点数据：**

```c++ nums
float vertices[] = {
//     ---- 位置 ----       ---- 颜色 ----     - 纹理坐标 -
     0.5f,  0.5f, 0.0f,   1.0f, 0.0f, 0.0f,   1.0f, 1.0f,   // 右上
     0.5f, -0.5f, 0.0f,   0.0f, 1.0f, 0.0f,   1.0f, 0.0f,   // 右下
    -0.5f, -0.5f, 0.0f,   0.0f, 0.0f, 1.0f,   0.0f, 0.0f,   // 左下
    -0.5f,  0.5f, 0.0f,   1.0f, 1.0f, 0.0f,   0.0f, 1.0f    // 左上
};
```

（1）由于我们添加了一个额外的顶点属性，我们必须告诉OpenGL我们新的顶点格式：

![[vertex_attribute_pointer_interleaved_textures.png|img]]

```c++ nums
glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
glEnableVertexAttribArray(2);

//注意，我们同样需要调整前面两个顶点属性的步长参数为`8 * sizeof(float)`。
```

（2）接着我们需要调整**顶点着色器**使其能够接受顶点坐标为一个顶点属性，并把坐标传给片元着色器：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
layout (location = 2) in vec2 aTexCoord;

out vec3 ourColor;
out vec2 TexCoord;

void main()
{
    gl_Position = vec4(aPos, 1.0);
    ourColor = aColor;
    TexCoord = aTexCoord;
}
```

(3)**片元着色器**应该接下来会把输出变量`TexCoord`作为输入变量。

片元着色器也应该能访问纹理对象，但是我们**怎样能把纹理对象传给片元着色器呢？**GLSL有一个供纹理对象使用的内建数据类型，叫做**采样器(Sampler)**，它以纹理类型作为后缀，比如`sampler1D`、`sampler3D`，或在我们的例子中的`sampler2D`。**我们可以简单声明一个`uniform sampler2D`把一个纹理添加到片元着色器中，稍后我们会把纹理赋值给这个uniform。**

```c++ nums
#version 330 core
out vec4 FragColor;

in vec3 ourColor;
in vec2 TexCoord;

uniform sampler2D ourTexture;

void main()
{
    FragColor = texture(ourTexture, TexCoord);
}
```

我们使用GLSL内建的**`texture`函数来采样纹理的颜色，它第一个参数是纹理采样器，第二个参数是对应的纹理坐标。**texture函数会使用之前设置的纹理参数对相应的颜色值进行采样。这个片元着色器的输出就是纹理的（插值）纹理坐标上的(过滤后的)颜色。

(4)现在只剩下**在调用`glDrawElements`之前绑定纹理了，它会自动把纹理赋值给片元着色器的采样器**：

```c++ nums
glBindTexture(GL_TEXTURE_2D, texture);
glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
```

#### 代码

![[textures2.png|img]]

```c++ nums
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#define STB_IMAGE_IMPLEMENTATION
#include <stb/stb_image.h>
#include <MyShader.h>
#include <iostream>
void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //种植
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}

	//创建和编译Shader
	Shader myshader("vertexShader.vert", "fragmentShader.frag");

	//设置顶点数据(和缓冲区)并配置顶点属性
	float vertices[] = {
		//     ---- 位置 ----       ---- 颜色 ----     - 纹理坐标 -
			 0.5f,  0.5f, 0.0f,   1.0f, 0.0f, 0.0f,   1.0f, 1.0f,   // 右上
			 0.5f, -0.5f, 0.0f,   0.0f, 1.0f, 0.0f,   1.0f, 0.0f,   // 右下
			-0.5f, -0.5f, 0.0f,   0.0f, 0.0f, 1.0f,   0.0f, 0.0f,   // 左下
			-0.5f,  0.5f, 0.0f,   1.0f, 1.0f, 0.0f,   0.0f, 1.0f    // 左上
	};

	unsigned int indices[] = {
		0, 1, 3, // 第一个三角形
		1, 2, 3  // 第二个三角形
	};

	unsigned int VAO;	//顶点数组对象
	unsigned int VBO;	//顶点缓冲对象：管理显存
	unsigned int EBO;	//元素缓冲对象

	//设置缓冲ID
	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);

	glBindVertexArray(VAO);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBO); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	//4. 链接顶点属性
	//设置顶点属性指针
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);	//启用顶点属性

	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3*sizeof(float)));
	glEnableVertexAttribArray(1);	//启用顶点属性

	glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6*sizeof(float)));
	glEnableVertexAttribArray(2);	//启用顶点属性

	//纹理
	unsigned int texture;
	glGenTextures(1, &texture);	//创建纹理对象
	glBindTexture(GL_TEXTURE_2D, texture);	//绑定

	//为当前绑定的纹理对象设置纹理环绕方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	//设置过滤方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

	//加载并生成纹理
	int width, height, nrChannels;
	unsigned char* data = stbi_load("container.jpg", &width, &height, &nrChannels, 0);  //获取图像的宽度、高度、颜色通道个数
	if (data)
	{
		glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);   //由图像数据生成纹理
		glGenerateMipmap(GL_TEXTURE_2D);	//生成多级渐远纹理
	}
	else
	{
		std::cout << "Failed to load texture" << std::endl;
	}
	stbi_image_free(data);	//释放图像内存

	//引擎：渲染循环
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//绑定纹理
		glBindTexture(GL_TEXTURE_2D, texture);

		//5. 使用着色器程序渲染物体
		myshader.use();
		glBindVertexArray(VAO);

		//6. 绘制物体
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
		//glBindVertexArray(0); //没有必要每次都解除绑定


		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	glDeleteVertexArrays(1, &VAO);
	glDeleteBuffers(1, &VBO);
	glDeleteBuffers(1, &EBO);
	glDeleteProgram(myshader.ID);

	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	//设置视口大小
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

我们还可以把得到的纹理颜色与顶点颜色混合，来获得更有趣的效果。我们只需把纹理颜色与顶点颜色在片元着色器中相乘来混合二者的颜色：

```c++ nums
FragColor = texture(ourTexture, TexCoord) * vec4(ourColor, 1.0);
```

最终的效果应该是顶点颜色和纹理颜色的混合色：

![[textures_funky.png|img]]

### 纹理单元

你可能会奇怪为什么`sampler2D`变量是个uniform，我们却不用`glUniform`给它赋值。**使用`glUniform1i`，我们可以给纹理采样器分配一个位置值，这样的话我们能够在一个片元着色器中设置多个纹理。**

**一个纹理的位置值通常称为一个纹理单元(Texture Unit)。**一个纹理的默认纹理单元是0，它是默认的激活纹理单元，所以教程前面部分我们没有分配一个位置值。

**纹理单元的主要目的是让我们在着色器中可以使用多于一个的纹理。**通过把纹理单元赋值给采样器，我们可以一次绑定多个纹理，只要我们首先激活对应的纹理单元。就像glBindTexture一样，我们可以**使用glActiveTexture激活纹理单元，传入我们需要使用的纹理单元：**

```c++ nums
glActiveTexture(GL_TEXTURE0); // 在绑定纹理之前先激活纹理单元
glBindTexture(GL_TEXTURE_2D, texture);
```

激活纹理单元之后，接下来的`glBindTexture`函数调用会绑定这个纹理到当前激活的纹理单元，**纹理单元GL_TEXTURE0默认总是被激活**，所以我们在前面的例子里当我们使用`glBindTexture`的时候，无需激活任何纹理单元。

> OpenGL至少保证有16个纹理单元供你使用，也就是说你可以激活从GL_TEXTURE0到GL_TEXTRUE15。它们都是按顺序定义的，所以我们也可以通过GL_TEXTURE0 + 8的方式获得GL_TEXTURE8，这在当我们需要循环一些纹理单元的时候会很有用。

我们仍然需要编辑片元着色器来接收另一个采样器。这应该相对来说非常直接了：

```c++ nums
#version 330 core
...

uniform sampler2D texture1;
uniform sampler2D texture2;

void main()
{
    FragColor = mix(texture(texture1, TexCoord), texture(texture2, TexCoord), 0.2);
}
```

最终输出颜色现在是两个纹理的结合。**GLSL内建的`mix`函数需要接受两个值作为参数，并对它们根据第三个参数进行线性插值。如果第三个值是`0.0`，它会返回第一个输入；如果是`1.0`，会返回第二个输入值。`0.2`会返回`80%`的第一个输入颜色和`20%`的第二个输入颜色，即返回两个纹理的混合色。**

我们现在需要载入并创建另一个纹理；你应该对这些步骤很熟悉了。记得创建另一个纹理对象，载入图片，使用glTexImage2D生成最终纹理。对于第二个纹理我们使用一张[你学习OpenGL时的面部表情](https://learnopengl-cn.github.io/img/01/06/awesomeface.png)图片。

为了使用第二个纹理（以及第一个），我们必须改变一点渲染流程，先绑定两个纹理到对应的纹理单元，然后定义哪个uniform采样器对应哪个纹理单元：

```c++ nums
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture1);
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, texture2);

glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
```

我们还要**通过使用`glUniform1i`设置每个采样器的方式告诉OpenGL每个着色器采样器属于哪个纹理单元。**我们只需要设置一次即可，所以这个会放在渲染循环的前面：

```c++ nums
ourShader.use(); // 不要忘记在设置uniform变量之前激活着色器程序！
glUniform1i(glGetUniformLocation(ourShader.ID, "texture1"), 0); // 手动设置
ourShader.setInt("texture2", 1); // 或者使用着色器类设置

while(...) 
{
    [...]
}
```

通过使用`glUniform1i`设置采样器，我们保证了每个uniform采样器对应着正确的纹理单元。你应该能得到下面的结果：

![[textures_combined.png|img]]

你可能注意到纹理上下颠倒了！这是因为**OpenGL要求y轴`0.0`坐标是在图片的底部的，但是图片的y轴`0.0`坐标通常在顶部。很幸运，`stb_image.h`能够在图像加载时帮助我们翻转y轴，只需要在加载任何图像前加入以下语句即可：**

```c++ nums
stbi_set_flip_vertically_on_load(true);
```

在让`stb_image.h`在加载图片时翻转y轴之后你就应该能够获得下面的结果了：

![[textures_combined2.png|img]]

#### 代码

##### 生成两个纹理

```c++ nums
#include <glad/glad.h>
#include <GLFW/glfw3.h>  
#define STB_IMAGE_IMPLEMENTATION
#include <stb/stb_image.h>
#include <MyShader.h>
#include <iostream>
void framebuffer_size_callback(GLFWwindow*, int, int); //声明回调函数,每次更改窗口大小，调用该函数。
void processInput(GLFWwindow*);//返回这个按键是否正在被按下

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

int main()
{
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//创建窗口
	GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGl", NULL, NULL);
	if (window == NULL)
	{
		std::cout << "Failed to create GLFW window" << std::endl;
		glfwTerminate(); //种植
		return -1;
	}
	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	//glad管理OpenGL函数指针
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		std::cout << "Failed to initialize GLAD" << std::endl;
		return -1;
	}

	//创建和编译Shader
	Shader myshader("vertexShader.vert", "fragmentShader.frag");

	//设置顶点数据(和缓冲区)并配置顶点属性
	float vertices[] = {
		//     ---- 位置 ----       ---- 颜色 ----     - 纹理坐标 -
			 0.5f,  0.5f, 0.0f,   1.0f, 0.0f, 0.0f,   1.0f, 1.0f,   // 右上
			 0.5f, -0.5f, 0.0f,   0.0f, 1.0f, 0.0f,   1.0f, 0.0f,   // 右下
			-0.5f, -0.5f, 0.0f,   0.0f, 0.0f, 1.0f,   0.0f, 0.0f,   // 左下
			-0.5f,  0.5f, 0.0f,   1.0f, 1.0f, 0.0f,   0.0f, 1.0f    // 左上
	};

	unsigned int indices[] = {
		0, 1, 3, // 第一个三角形
		1, 2, 3  // 第二个三角形
	};

	unsigned int VAO;	//顶点数组对象
	unsigned int VBO;	//顶点缓冲对象：管理显存
	unsigned int EBO;	//元素缓冲对象

	//设置缓冲ID
	glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);

	glBindVertexArray(VAO);	//绑定VAO
	glBindBuffer(GL_ARRAY_BUFFER, VBO); //缓冲类型绑定
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	//4. 链接顶点属性
	//设置顶点属性指针
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);	//启用顶点属性

	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));
	glEnableVertexAttribArray(1);	//启用顶点属性

	glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
	glEnableVertexAttribArray(2);	//启用顶点属性


	unsigned int texture1, texture2;
	//第一个纹理
	glGenTextures(1, &texture1);	//创建纹理对象
	glBindTexture(GL_TEXTURE_2D, texture1);	//绑定

	//为当前绑定的纹理对象设置纹理环绕方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	//设置过滤方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

	//加载并生成纹理
	int width, height, nrChannels;
	stbi_set_flip_vertically_on_load(true);  //翻转y轴
	unsigned char* data = stbi_load("texture/container.jpg", &width, &height, &nrChannels, 0);  //获取图像的宽度、高度、颜色通道个数
	if (data)
	{
		glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);   //由图像数据生成纹理
		glGenerateMipmap(GL_TEXTURE_2D);	//生成多级渐远纹理
	}
	else
	{
		std::cout << "Failed to load texture1" << std::endl;
	}
	stbi_image_free(data);	//释放图像内存

	//第二个纹理
	glGenTextures(1, &texture2);	//创建纹理对象
	glBindTexture(GL_TEXTURE_2D, texture2);

	//为当前绑定的纹理对象设置纹理环绕方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	//设置过滤方式
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

	//加载并生成纹理
	data = stbi_load("texture/awesomeface.png", &width, &height, &nrChannels, 0);
	if (data)
	{
		//注意!!!awesomeface.png具有透明度，因此是alpha通道，所以一定要告诉OpenGL数据类型是GL_RGBA
		glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
		glGenerateMipmap(GL_TEXTURE_2D);
	}
	else
	{
		std::cout << "Failed to load texture2" << std::endl;
	}
	stbi_image_free(data);	//释放图像内存

	myshader.use(); //在设置uniform变量前要激活着色器程序
    //将纹理设置给对应的纹理单元
	glUniform1i(glGetUniformLocation(myshader.ID, "texture1"), 0); //手动设置
	myshader.setInt("texture2", 1); //或者使用着色器类设置

	//引擎：渲染循环
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//绑定纹理
		glActiveTexture(GL_TEXTURE0); // 在绑定纹理之前先激活纹理单元
		glBindTexture(GL_TEXTURE_2D, texture1);	//绑定
		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D, texture2);

		//5. 使用着色器程序渲染物体
		myshader.use();
		glBindVertexArray(VAO);

		//6. 绘制物体
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	//可选的：一旦所有的资源超过了它们的用途，就取消它们的分配。
	// ---------------------------------------------------
	glDeleteVertexArrays(1, &VAO);
	glDeleteBuffers(1, &VBO);
	glDeleteBuffers(1, &EBO);
	glDeleteProgram(myshader.ID);

	//释放资源
	glfwTerminate();

	return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int witdh, int height)
{
	//设置视口大小
	glViewport(0, 0, witdh, height);
}

void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}
```

##### 添加交互

上下键控制纹理透明度，左右键控制纹理坐标缩放

```c++ nums
//片元着色器
#version 330 core
out vec4 FragColor;

in vec3 ourColor;
in vec2 TexCoord;

uniform float mixValue;  //纹理透明度
uniform float uvScale; //纹理坐标缩放
// texture sampler
uniform sampler2D texture1;
uniform sampler2D texture2;

void main()
{
	FragColor = mix(texture(texture1, TexCoord), texture(texture2, TexCoord * uvScale), mixValue);
}

//main函数前定义
float mixValue = 0.2f;  //用来控制纹理透明度
float uvScale = 1.0f;	//控制纹理坐标缩放

//while循环内，绑定纹理后在着色器中设置纹理混合值
myshader.setFloat("mixValue", mixValue);
myshader.setFloat("uvScale", uvScale);

//完善processInput()函数实现交互
void processInput(GLFWwindow* window)
{
	//检查用户是否按下了返回键(Esc)，按了就关闭GLFW
	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);

	if (glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS)
	{
		mixValue += 0.001f;
		if (mixValue >= 1.0f)
			mixValue = 1.0f;
	}
	if (glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS)
	{
		mixValue -= 0.001f;
		if (mixValue <= 0.0f)
			mixValue = 0.0f;
	}
	if (glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS)
	{
		uvScale+= 0.001f;
	}
	if (glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS)
	{
		uvScale -= 0.001f;
	}
}
```

## 变换

### GLM库

GLM（OpenGL Mathematics），专门为OpenGL量身定做的数学库。它是一个**只有头文件的**库，也就是说我们只需包含对应的头文件就行了，不用链接和编译。GLM可以在它们的[网站](https://glm.g-truc.net/0.9.8/index.html)上下载。把头文件的根目录复制到你的**includes**文件夹，然后你就可以使用这个库了。[GLM环境配置](https://blog.csdn.net/Wonz5130/article/details/83116009)

**我使用的0.9.8.5版本，默认矩阵为单位矩阵。**

> GLM库从0.9.9版本起，默认会将矩阵类型初始化为一个零矩阵（所有元素均为0），而不是单位矩阵（对角元素为1，其它元素为0）。如果你使用的是0.9.9或0.9.9以上的版本，你需要将所有的矩阵初始化改为 `glm::mat4 mat = glm::mat4(1.0f)`。如果你想与本教程的代码保持一致，请使用低于0.9.9版本的GLM，或者改用上述代码初始化所有的矩阵。

我们需要的GLM的大多数功能都可以从下面这3个头文件中找到：

```c++ nums
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
```

把一个向量(1, 0, 0)位移(1, 1, 0)个单位（注意，我们把它定义为一个`glm::vec4`类型的值，齐次坐标设定为1.0）：

```c++ nums
glm::vec4 vec(1.0f, 0.0f, 0.0f, 1.0f);
// 译注：下面就是矩阵初始化的一个例子，如果使用的是0.9.9及以上版本
// 下面这行代码就需要改为:
// glm::mat4 trans = glm::mat4(1.0f)
// 之后将不再进行提示
glm::mat4 trans;
trans = glm::translate(trans, glm::vec3(1.0f, 1.0f, 0.0f));
vec = trans * vec;
std::cout << vec.x << vec.y << vec.z << std::endl;
```

我们先用GLM内建的向量类定义一个叫做`vec`的向量。接下来定义一个`mat4`类型的`trans`，默认是一个4×4单位矩阵。下一步是**创建一个变换矩阵，我们是把单位矩阵和一个位移向量传递给`glm::translate`函数来完成这个工作的**（然后用给定的矩阵乘以位移矩阵就能获得最后需要的矩阵）。 之后我们把向量乘以位移矩阵并且输出最后的结果。如果你仍记得位移矩阵是如何工作的话，得到的向量应该是(1 + 1, 0 + 1, 0 + 0)，也就是(2, 1, 0)。这个代码片段将会输出`210`，所以这个位移矩阵是正确的。

### 旋转和缩放笑脸箱

我们来做些更有意思的事情，让我们来旋转和缩放之前教程中的那个箱子。首先我们把箱子逆时针旋转90度。然后缩放0.5倍，使它变成原来的一半大。我们先来创建变换矩阵：

```c++ nums
glm::mat4 trans;
trans = glm::rotate(trans, glm::radians(90.0f), glm::vec3(0.0, 0.0, 1.0));	//glm::vec3(0.0, 0.0, 1.0)表示沿Z轴旋转
trans = glm::scale(trans, glm::vec3(0.5, 0.5, 0.5));
```

首先，我们把箱子在**每个轴都缩放到0.5倍，然后沿z轴旋转90度**。**GLM希望它的角度是弧度制的(Radian)**，所以我们使用**`glm::radians`将角度转化为弧度**。注意有纹理的那面矩形是在XY平面上的，所以我们需要把它绕着z轴旋转。**因为我们把这个矩阵传递给了GLM的每个函数，GLM会自动将矩阵相乘，返回的结果是一个包括了多个变换的变换矩阵。**

下一个大问题是：**如何把矩阵传递给着色器？**我们在前面简单提到过GLSL里也有一个`mat4`类型。所以我们将修改顶点着色器让其接收一个`mat4`的uniform变量，然后再用矩阵uniform乘以位置向量：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;

out vec2 TexCoord;

uniform mat4 transform;

void main()
{
    gl_Position = transform * vec4(aPos, 1.0f);
    TexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}
```

> GLSL也有`mat2`和`mat3`类型从而允许了像向量一样的混合运算。前面提到的所有数学运算（像是标量-矩阵相乘，矩阵-向量相乘和矩阵-矩阵相乘）在矩阵类型里都可以使用。当出现特殊的矩阵运算的时候我们会特别说明。

在把位置向量传给`gl_Position`之前，我们先添加一个uniform，并且将其与变换矩阵相乘。我们的箱子现在应该是原来的二分之一大小并（向左）旋转了90度。当然，我们仍需要把变换矩阵传递给着色器：

```c++ nums
unsigned int transformLoc = glGetUniformLocation(ourShader.ID, "transform");
glUniformMatrix4fv(transformLoc, 1, GL_FALSE, glm::value_ptr(trans));
```

我们首先查询uniform变量的地址，然后**用有`Matrix4fv`后缀的`glUniform`函数把矩阵数据发送给着色器。**

- 第一个参数是uniform的位置值。
- 第二个参数告诉OpenGL我们将要发送多少个矩阵，是1。
- 第三个参数询问我们是否希望对我们的矩阵进行转置(Transpose)，也就是说交换我们矩阵的行和列。

> OpenGL开发者通常使用一种内部矩阵布局，叫做列主序(Column-major Ordering)布局。**GLM的默认布局就是列主序，所以并不需要转置矩阵，我们填`GL_FALSE`。**

- 最后一个参数是真正的矩阵数据，但是GLM并不是把它们的矩阵储存为OpenGL所希望接受的那种，因此我们要先**用GLM的自带的函数`value_ptr`来变换这些数据,变被opengl接受的类型**。

  我们创建了一个变换矩阵，在顶点着色器中声明了一个uniform，并把矩阵发送给了着色器，着色器会变换我们的顶点坐标。最后的结果应该看起来像这样：

![[transformations.png|img]]

```c++ nums
while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//绑定纹理
		glActiveTexture(GL_TEXTURE0); // 在绑定纹理之前先激活纹理单元
		glBindTexture(GL_TEXTURE_2D, texture1);	//绑定
		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D, texture2);

		//创建变换矩阵
		//把箱子沿Z轴逆时针旋转90度。然后缩放0.5倍
		glm::mat4 trans;
		trans = glm::rotate(trans, glm::radians(90.0f), glm::vec3(0.0, 0.0, 1.0));
		trans = glm::scale(trans, glm::vec3(0.5, 0.5, 0.5));


		//5. 使用着色器程序渲染物体
		myshader.use();

		unsigned int transformLoc = glGetUniformLocation(myshader.ID, "transform");
		glUniformMatrix4fv(transformLoc, 1, GL_FALSE, glm::value_ptr(trans));

		glBindVertexArray(VAO);

		//6. 绘制物体
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}
```

我们现在做些更有意思的，看看我们是否可以**让箱子随着时间旋转，我们还会重新把箱子放在窗口的右下角。**要让箱子随着时间推移旋转，我们必须在游戏循环中更新变换矩阵，因为它在每一次渲染迭代中都要更新。我们使用GLFW的时间函数来获取不同时间的角度：

```c++ nums
glm::mat4 trans;
trans = glm::translate(trans, glm::vec3(0.5f, -0.5f, 0.0f));
trans = glm::rotate(trans, (float)glfwGetTime(), glm::vec3(0.0f, 0.0f, 1.0f));
```

要记住的是前面的例子中我们可以在任何地方声明变换矩阵，但是现在我们必须在每一次迭代中创建它，从而保证我们能够不断更新旋转角度。这也就意味着我们不得不在每次游戏循环的迭代中重新创建变换矩阵。通常在渲染场景的时候，我们也会有多个需要在每次渲染迭代中都用新值重新创建的变换矩阵

在这里我们先把箱子围绕原点(0, 0, 0)旋转，之后，我们把旋转过后的箱子位移到屏幕的右下角。**记住，实际的变换顺序应该与阅读顺序相反：尽管在代码中我们先位移再旋转，实际的变换却是先应用旋转再是位移的。**明白所有这些变换的组合，并且知道它们是如何应用到物体上是一件非常困难的事情。只有不断地尝试和实验这些变换你才能快速地掌握它们。

如果你做对了，你将看到下面的结果：[实现效果](https://learnopengl-cn.github.io/img/01/07/transformations.mp4)

## 进入3D

既然我们知道了如何将3D坐标变换为2D坐标【见坐标系统】，我们可以开始使用真正的3D物体，而不是枯燥的2D平面了。

**（1）首先创建一个模型矩阵。这个模型矩阵包含了位移、缩放与旋转操作，它们会被应用到所有物体的顶点上，以变换它们到全局的世界空间。**让我们变换一下我们的平面，将其绕着x轴旋转，使它看起来像放在地上一样。这个模型矩阵看起来是这样的：

```c++ nums
glm::mat4 model;
model = glm::rotate(model, glm::radians(-55.0f), glm::vec3(1.0f, 0.0f, 0.0f));
```

**通过将顶点坐标乘以这个模型矩阵，我们将该顶点坐标变换到世界坐标。**我们的平面看起来就是在地板上，代表全局世界里的平面。

**（2）接下来我们需要创建一个观察矩阵。我们想要在场景里面稍微往后移动，以使得物体变成可见的**（当在世界空间时，我们位于原点(0,0,0)）。要想在场景里面移动，先仔细想一想下面这个句子：

- **将摄像机向后移动，和将整个场景向前移动是一样的。**

这正是观察矩阵所做的，我们以相反于摄像机移动的方向移动整个场景。因为我们想要往后移动，并且**OpenGL是一个右手坐标系(Right-handed System)**，所以我们需要沿着z轴的正方向移动。我们会**通过将场景沿着z轴负方向平移来实现。它会给我们一种我们在往后移动的感觉。**

> ==**右手坐标系(Right-handed System)**==
>
> 按照惯例，OpenGL是一个右手坐标系。简单来说，就是正x轴在你的右手边，正y轴朝上，而正z轴是朝向后方的。想象你的屏幕处于三个轴的中心，则正z轴穿过你的屏幕朝向你。坐标系画起来如下：
>
> ![[coordinate_systems_right_handed.png]]
>
> 为了理解为什么被称为右手坐标系，按如下的步骤做：
>
> - 沿着正y轴方向伸出你的右臂，手指着上方。
> - 大拇指指向右方。
> - 食指指向上方。
> - 中指向下弯曲90度。
>
> 如果你的动作正确，那么你的大拇指指向正x轴方向，食指指向正y轴方向，中指指向正z轴方向。如果你用左臂来做这些动作，你会发现z轴的方向是相反的。这个叫做左手坐标系，它被DirectX广泛地使用。注意在标准化设备坐标系中OpenGL实际上使用的是左手坐标系（投影矩阵交换了左右手）。

在下一个教程中我们将会详细讨论如何在场景中移动。就目前来说，观察矩阵是这样的：

```c++ nums
glm::mat4 view;
// 注意，我们将矩阵向我们要进行移动场景的反方向移动。
view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
```

**（3）最后我们需要做的是定义一个投影矩阵。**我们希望在场景中**使用透视投影**，所以像这样声明一个投影矩阵：

```c++ nums
glm::mat4 projection;
projection = glm::perspective(glm::radians(45.0f), screenWidth / screenHeight, 0.1f, 100.0f);
```

**（4）既然我们已经创建了变换矩阵，我们应该将它们传入着色器。**首先，让我们在顶点着色器中声明一个uniform变换矩阵然后将它乘以顶点坐标：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
...
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    // 注意乘法要从右向左读
    gl_Position = projection * view * model * vec4(aPos, 1.0);
    ...
}
```

我们还应该将矩阵传入着色器（这通常在每次的渲染迭代中进行，因为变换矩阵会经常变动）：

```c++ nums
int modelLoc = glGetUniformLocation(ourShader.ID, "model"));
glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
... // 观察矩阵和投影矩阵与之类似
```

我们的顶点坐标已经使用模型、观察和投影矩阵进行变换了，最终的物体应该会：

- 稍微向后倾斜至地板方向。
- 离我们有一些距离。
- 有透视效果（顶点越远，变得越小）。

让我们检查一下结果是否满足这些要求：

![[coordinate_systems_result.png]]

它看起来就像是一个3D的平面，静止在一个虚构的地板上。如果你得到的不是相同的结果，请检查下完整的[源代码](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/6.1.coordinate_systems/coordinate_systems.cpp)。

```c++ nums
//引擎：渲染循环
	while (!glfwWindowShouldClose(window))
	{
		//输入
		//按ESC关闭窗口
		processInput(window);

		//渲染指令
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		//绑定纹理
		glActiveTexture(GL_TEXTURE0); // 在绑定纹理之前先激活纹理单元
		glBindTexture(GL_TEXTURE_2D, texture1);	//绑定
		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D, texture2);
		
		//5. 使用着色器程序渲染物体
		myshader.use();

		//定义MVP矩阵
		glm::mat4 model;
		model = glm::rotate(model, glm::radians(-55.0f), glm::vec3(1.0f, 0.0f, 0.0f));
		glm::mat4 view;
		view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
		glm::mat4 projection;
		projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);

		//将矩阵传入着色器
		unsigned int modelLoc = glGetUniformLocation(myshader.ID, "model");
		glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

		unsigned int viewLoc = glGetUniformLocation(myshader.ID, "view");
		glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

		//目前我们在每一帧设置投影矩阵，但是由于投影矩阵很少改变，所以最好的做法是在主循环之外只设置一次。
		unsigned int projLoc = glGetUniformLocation(myshader.ID, "projection");
		glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(projection));

		glBindVertexArray(VAO);

		//6. 绘制物体
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

		// 检查并调用事件，交换缓冲
		glfwSwapBuffers(window);
		glfwPollEvents();
	}
```

### 更加3D

到目前为止，我们一直都在使用一个2D平面，而且甚至是在3D空间里！所以，让我们大胆地拓展我们的2D平面为一个3D立方体。要想**渲染一个立方体**，我们一共需要36个顶点（6个面 x 每个面有2个三角形组成 x 每个三角形有3个顶点），这36个顶点的位置你可以从[这里](https://learnopengl.com/code_viewer.php?code=getting-started/cube_vertices)获取。

为了有趣一点，我们将让立方体随着时间旋转：

```
model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
```

然后我们使用`glDrawArrays`来绘制立方体，但这一次总共有36个顶点。

```
glDrawArrays(GL_TRIANGLES, 0, 36);
```

如果一切顺利的话你应该能得到下面这样的效果：[实现效果](https://learnopengl-cn.github.io/img/01/08/coordinate_system_no_depth.mp4)

#### 代码（旋转3d正方体）

```c++ nums
//矩阵
    float vertices[] = {
     -0.5f, -0.5f, -0.5f,  0.0f, 0.0f,
      0.5f, -0.5f, -0.5f,  1.0f, 0.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
     -0.5f,  0.5f, -0.5f,  0.0f, 1.0f,
     -0.5f, -0.5f, -0.5f,  0.0f, 0.0f,

     -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 1.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 1.0f,
     -0.5f,  0.5f,  0.5f,  0.0f, 1.0f,
     -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,

     -0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
     -0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
     -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
     -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
     -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
     -0.5f,  0.5f,  0.5f,  1.0f, 0.0f,

      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,

     -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  1.0f, 1.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
     -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
     -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,

     -0.5f,  0.5f, -0.5f,  0.0f, 1.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
     -0.5f,  0.5f,  0.5f,  0.0f, 0.0f,
     -0.5f,  0.5f, -0.5f,  0.0f, 1.0f
    };

//渲染循环
    while (!glfwWindowShouldClose(window))
    {

        processInput(window);

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // bind textures on corresponding texture units
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture1);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, texture2);
        
        ourShader.use();
        //定义MVP矩阵
         glm::mat4 model;	//实现旋转功能
        model = glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
        glm::mat4 view;
        view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
        glm::mat4 projection;
        projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);

        //将矩阵传入着色器
        unsigned int modelLoc = glGetUniformLocation(ourShader.ID, "model");
        glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

        unsigned int viewLoc = glGetUniformLocation(ourShader.ID, "view");
        glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

        //目前我们在每一帧设置投影矩阵，但是由于投影矩阵很少改变，所以最好的做法是在主循环之外只设置一次。
        unsigned int projLoc = glGetUniformLocation(ourShader.ID, "projection");
        glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(projection));

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);  //未使用EBO，注意这里绘制函数要改一下
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);

    glfwTerminate();
    return 0;
}

```

这的确有点像是一个立方体，但又有种说不出的奇怪。立方体的某些本应被遮挡住的面被绘制在了这个立方体其他面之上。之所以这样是因为OpenGL是一个三角形一个三角形地来绘制你的立方体的，所以即便之前那里有东西它也会覆盖之前的像素。因为这个原因，有些三角形会被绘制在其它三角形上面，虽然它们本不应该是被覆盖的。

幸运的是，OpenGL存储深度信息在一个叫做**Z缓冲(Z-buffer)**的缓冲中，它允许OpenGL决定何时覆盖一个像素而何时不覆盖。通过使用Z缓冲，我们可以配置OpenGL来进行深度测试。

### Z-Buffer

**OpenGL存储它的所有深度信息于一个Z缓冲(Z-buffer)中，也被称为深度缓冲(Depth Buffer)。GLFW会自动为你生成这样一个缓冲**（就像它也有一个颜色缓冲来存储输出图像的颜色）。**深度值存储在每个片段里面（作为片段的z值），当片段想要输出它的颜色时，OpenGL会将它的深度值和z缓冲进行比较，如果当前的片段在其它片段之后，它将会被丢弃，否则将会覆盖。这个过程称为深度测试(Depth Testing)，它是由OpenGL自动完成的。**

然而，如果我们想要确定OpenGL真的执行了深度测试，首先我们要告诉OpenGL我们想要启用**深度测试；它默认是关闭的**。我们可以**通过`glEnable`函数来开启深度测试**。`glEnable`和`glDisable`函数允许我们启用或禁用某个OpenGL功能。这个功能会一直保持启用/禁用状态，直到另一个调用来禁用/启用它。现在我们想**启用深度测试，需要开启`GL_DEPTH_TEST`：**

```c++ nums
glEnable(GL_DEPTH_TEST); 	//设置在创建shader对象前，全局配置
```

因为我们使用了深度测试，我们也想要在每次渲染迭代之前清除深度缓冲（否则前一帧的深度信息仍然保存在缓冲中）。就像清除颜色缓冲一样，我们可以**通过在`glClear`函数中指定`DEPTH_BUFFER_BIT`位来清除深度缓冲：**

```c++ nums
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
```

我们来重新运行下程序看看OpenGL是否执行了深度测试：[深度测试](https://learnopengl-cn.github.io/img/01/08/coordinate_system_depth.mp4)

### 更多的立方体

现在我们想在屏幕上**显示10个立方体**。每个立方体看起来都是一样的，区别在于它们**在世界的位置及旋转角度不同**。立方体的图形布局已经定义好了，所以当渲染更多物体的时候我们不需要改变我们的缓冲数组和属性数组，我们唯一需要做的只是改变每个对象的模型矩阵来将立方体变换到世界坐标系中。

（1）首先，让我们为每个立方体定义一个位移向量来指定它在世界空间的位置。我们将在一`glm::vec3`数组中定义10个立方体位置：

```c++ nums
glm::vec3 cubePositions[] = {
  glm::vec3( 0.0f,  0.0f,  0.0f), 
  glm::vec3( 2.0f,  5.0f, -15.0f), 
  glm::vec3(-1.5f, -2.2f, -2.5f),  
  glm::vec3(-3.8f, -2.0f, -12.3f),  
  glm::vec3( 2.4f, -0.4f, -3.5f),  
  glm::vec3(-1.7f,  3.0f, -7.5f),  
  glm::vec3( 1.3f, -2.0f, -2.5f),  
  glm::vec3( 1.5f,  2.0f, -2.5f), 
  glm::vec3( 1.5f,  0.2f, -1.5f), 
  glm::vec3(-1.3f,  1.0f, -1.5f)  
};
```

现在，在游戏循环中，我们调用glDrawArrays 10次，但这次在我们渲染之前每次传入一个不同的模型矩阵到顶点着色器中。我们将会在游戏循环中创建一个小的循环用不同的模型矩阵渲染我们的物体10次。注意我们也对每个箱子加了一点旋转：

```c++ nums
glBindVertexArray(VAO);
for(unsigned int i = 0; i < 10; i++)
{
  glm::mat4 model;
  model = glm::translate(model, cubePositions[i]);
  float angle = 20.0f * i; 
  model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
  ourShader.setMat4("model", model);

  glDrawArrays(GL_TRIANGLES, 0, 36);
}
```

这段代码将会在每次新立方体绘制出来的时候更新模型矩阵，如此总共重复10次。然后我们应该就能看到一个拥有10个正在奇葩地旋转着的立方体的世界。

![[coordinate_systems_multiple_objects 1.png|coordinate_systems_multiple_objects]]

#### 代码（十个3D立方体）

```c++ nums
while (!glfwWindowShouldClose(window))
    {
        // input
        // -----
        processInput(window);

        // render
        // ------
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // bind textures on corresponding texture units
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture1);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, texture2);

        // get matrix's uniform location and set matrix
        ourShader.use();

        glm::mat4 view;
        view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
        glm::mat4 projection;
        projection = glm::perspective(glm::radians(55.5f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);

        //将矩阵传入着色器
        unsigned int viewLoc = glGetUniformLocation(ourShader.ID, "view");
        glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

        //目前我们在每一帧设置投影矩阵，但是由于投影矩阵很少改变，所以最好的做法是在主循环之外只设置一次。
        unsigned int projLoc = glGetUniformLocation(ourShader.ID, "projection");
        glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(projection));

        glBindVertexArray(VAO);
        for (unsigned int i = 0; i < 10;i++)
        {
            glm::mat4 model;
            model = glm::translate(model, cubePositions[i]);
            float angle = 20.0f * i;
            model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
            
            unsigned int modelLoc = glGetUniformLocation(ourShader.ID, "model");
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

            glDrawArrays(GL_TRIANGLES, 0, 36);
        }
       
        glfwSwapBuffers(window);
        glfwPollEvents();
    }
```

## 摄像机

前面的教程中我们讨论了观察矩阵以及如何使用观察矩阵移动场景（我们向后移动了一点）。**OpenGL本身没有摄像机(Camera)的概念，但我们可以通过把场景中的所有物体往相反方向移动的方式来模拟出摄像机，产生一种我们在移动的感觉，而不是场景在移动。**

本节我们将会讨论如何在OpenGL中配置一个摄像机，并且将会讨论FPS风格的摄像机，让你能够在3D场景中自由移动。我们也会讨论键盘和鼠标输入，最终完成一个自定义的摄像机类。

### 摄像机/观察空间

当我们讨论摄像机/观察空间(Camera/View Space)的时候，是在讨论以摄像机的视角作为场景原点时场景中所有的顶点坐标：**观察矩阵把所有的世界坐标变换为相对于摄像机位置与方向的观察坐标。**

**要定义一个摄像机，我们需要它在世界空间中的位置、观察的方向、一个指向它右侧的向量以及一个指向它上方的向量。** 细心的读者可能已经注意到我们实际上创建了一个三个单位轴相互垂直的、以摄像机的位置为原点的坐标系。

![[camera_axes.png|img]]

#### 摄像机位置

获取摄像机位置很简单。摄像机位置简单来说就是世界空间中一个指向摄像机位置的向量。我们把摄像机位置设置为上一节中的那个相同的位置：

```c++ nums
glm::vec3 cameraPos = glm::vec3(0.0f, 0.0f, 3.0f);
```

> 不要忘记正z轴是从屏幕指向你的，如果我们希望摄像机向后移动，我们就沿着z轴的正方向移动。

#### 摄像机方向

下一个需要的向量是摄像机的方向，这里指的是**摄像机指向哪个方向**。现在我们让摄像机指向场景原点：(0, 0, 0)。还记得如果将两个矢量相减，我们就能得到这两个矢量的差吗？**用场景原点向量减去摄像机位置向量的结果就是摄像机的指向向量。** 由于我们知道**摄像机指向z轴负方向**，但我**们希望方向向量(Direction Vector)指向摄像机的z轴正方向**。如果我们**交换相减的顺序，我们就会获得一个指向摄像机正z轴方向的向量：**

```c++ nums
glm::vec3 cameraTarget = glm::vec3(0.0f, 0.0f, 0.0f);
glm::vec3 cameraDirection = glm::normalize(cameraPos - cameraTarget);
```

![[v2-3e85e6d0255d585d1174d5f705da7c5a_r 1.jpg|img]]

> **方向向量(Direction Vector)**并不是最好的名字，因为**它实际上指向从它到目标向量的相反方向**（译注：注意看前面的那个图，蓝色的方向向量大概指向z轴的正方向，与摄像机实际指向的方向是正好相反的）。

#### 右轴

![[v2-a4e1b60667d595b0202391078b28a286_r 1.jpg|img]]

我们需要的另一个向量是一个**右向量**(Right Vector)，**它代表摄像机空间的x轴的正方向。** 为获取右向量我们需要先使用一个小技巧：先定义一个**上向量**(Up Vector)（图中的是WordlUP）。接下来**把上向量和第二步得到的方向向量进行叉乘**。两个向量叉乘的结果会同时垂直于两向量，因此我们会得到指向x轴正方向的那个向量（如果我们交换两个向量叉乘的顺序就会得到相反的指向x轴负方向的向量）：

```c++ nums
glm::vec3 up = glm::vec3(0.0f, 1.0f, 0.0f); 
glm::vec3 cameraRight = glm::normalize(glm::cross(up, cameraDirection));
```

#### 上轴

现在我们已经有了x轴向量和z轴向量，获取一个指向摄像机的正y轴向量就相对简单了：我们把右向量和方向向量进行叉乘：

```c++ nums
glm::vec3 cameraUp = glm::cross(cameraDirection, cameraRight);
```

在叉乘和一些小技巧的帮助下，我们创建了所有构成观察/摄像机空间的向量。对于想学到更多数学原理的读者，提示一下，在线性代数中这个处理叫做[格拉姆—施密特正交化](http://en.wikipedia.org/wiki/Gram–Schmidt_process)(Gram-Schmidt Process)。使用这些摄像机向量我们就可以创建一个LookAt矩阵了，它在创建摄像机的时候非常有用。

### Look At(观察矩阵）

**使用矩阵的好处之一是如果你使用3个相互垂直（或非线性）的轴定义了一个坐标空间，你可以用这3个轴外加一个平移向量来创建一个矩阵，并且你可以用这个矩阵乘以任何向量来将其变换到那个坐标空间。** 这正是**LookAt**矩阵所做的，现在我们有了3个相互垂直的轴和一个定义摄像机空间的位置坐标，我们可以创建我们自己的 LookAt 矩阵了：

![[image-20220915201926169.png]]

**其中R是右向量，U是上向量，D是方向向量，P是摄像机位置向量。**

注意，位置向量是相反的，因为我们最终希望把世界平移到与摄像机移动的相反方向。把这个LookAt矩阵作为观察矩阵可以很高效地把所有世界坐标变换到刚刚定义的观察空间。**LookAt矩阵就像它的名字表达的那样：它会创建一个看着(Look at)给定目标的观察矩阵。**

幸运的是，GLM已经提供了这些支持。**我们要做的只是定义一个摄像机位置，一个目标位置和一个表示世界空间中的上向量的向量（我们计算右向量使用的那个上向量）。**接着GLM就会创建一个LookAt矩阵，我们可以把它当作我们的观察矩阵：

```c++ nums
glm::mat4 view;
view = glm::lookAt(glm::vec3(0.0f, 0.0f, 3.0f), 
           glm::vec3(0.0f, 0.0f, 0.0f), 
           glm::vec3(0.0f, 1.0f, 0.0f));
```

**`glm::LookAt`函数需要一个位置、目标和上向量。它会创建一个和在上一节使用的一样的观察矩阵。**

在讨论用户输入之前，我们先来做些有意思的事，把我们的摄像机在场景中旋转。我们会将摄像机的注视点保持在(0, 0, 0)。

我们需要用到一点三角学的知识来在每一帧创建一个x和z坐标，它会代表圆上的一点，我们将会使用它作为摄像机的位置。通过重新计算x和y坐标，我们会遍历圆上的所有点，这样摄像机就会绕着场景旋转了。我们预先定义这个圆的半径radius，在每次渲染迭代中使用GLFW的glfwGetTime函数重新创建观察矩阵，来扩大这个圆。

```c++ nums
float radius = 10.0f;
float camX = sin(glfwGetTime()) * radius;
float camZ = cos(glfwGetTime()) * radius;
glm::mat4 view;
view = glm::lookAt(glm::vec3(camX, 0.0, camZ), glm::vec3(0.0, 0.0, 0.0), glm::vec3(0.0, 1.0, 0.0)); 
```

如果你运行[源码](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/7.1.camera_circle/camera_circle.cpp)，应该会得到下面的结果：[摄像机转动](https://learnopengl-cn.github.io/img/01/09/camera_circle.mp4)

#### 代码（摄像机转动）

```c++ nums
//由于投影矩阵很少改变，所以最好的做法是在主循环之外只设置一次。
    glm::mat4 projection;
    projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
    unsigned int projLoc = glGetUniformLocation(ourShader.ID, "projection");
    glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(projection));

    // render loop
    while (!glfwWindowShouldClose(window))
    {
 
        processInput(window);

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture1);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, texture2);
        
        ourShader.use();
		
        //移动摄像机位置
        float radius = 10.0f;
        float camX = static_cast<float>((sin(glfwGetTime()) * radius));
        float camZ = static_cast<float>((cos(glfwGetTime()) * radius));
        glm::mat4 view;
        view = glm::lookAt(glm::vec3(camX, 0.0, camZ), glm::vec3(0.0, 0.0, 0.0), glm::vec3(0.0, 1.0, 0.0));
        
        //将矩阵传入着色器
        unsigned int viewLoc = glGetUniformLocation(ourShader.ID, "view");
        glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

        glBindVertexArray(VAO);
        for (unsigned int i = 0; i < 10;i++)
        {
            glm::mat4 model;
            model = glm::translate(model, cubePositions[i]);
            float angle = 20.0f * i;
            model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
            
            unsigned int modelLoc = glGetUniformLocation(ourShader.ID, "model");
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

            glDrawArrays(GL_TRIANGLES, 0, 36);
        }
       
        glfwSwapBuffers(window);
        glfwPollEvents();
    }
```

### 键盘控制移动

让摄像机绕着场景转的确很有趣，但是让我们自己移动摄像机会更有趣！首先我们必须设置一个摄像机系统，所以在我们的程序前面定义一些摄像机变量很有用：

```c++ nums
glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);
```

`LookAt`函数现在成了：

```c++ nums
view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);
```

我们首先将摄像机位置设置为之前定义的cameraPos。==**方向是当前的位置加上我们刚刚定义的方向向量。这样能保证无论我们怎么移动，摄像机都会注视着目标方向。**==让我们摆弄一下这些向量，在按下某些按钮时更新cameraPos向量。
![[Pasted image 20221004142725.png]]

我们已经为GLFW的键盘输入定义过一个processInput函数了，我们来新添加几个需要检查的按键命令：

```c++ nums
void processInput(GLFWwindow *window)
{
    ...
    float cameraSpeed = 0.05f; // adjust accordingly
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
        cameraPos += cameraSpeed * cameraFront;
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
        cameraPos -= cameraSpeed * cameraFront;
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
        cameraPos -= glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
        cameraPos += glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
}
```

当我们按下**WASD**键的任意一个，摄像机的位置都会相应更新。如果我们希望向前或向后移动，我们就把位置向量加上或减去方向向量。如果我们希望向左右移动，我们使用叉乘来创建一个**右向量**(Right Vector)，并沿着它相应移动就可以了。这样就创建了使用摄像机时熟悉的横移(Strafe)效果。

> 注意，我们对**右向量**进行了标准化。如果我们没对这个向量进行标准化，最后的叉乘结果会根据cameraFront变量返回大小不同的向量。如果我们不对向量进行标准化，我们就得根据摄像机的朝向不同加速或减速移动了，但如果进行了标准化移动就是匀速的。

现在你就应该能够移动摄像机了，虽然移动速度和系统有关，你可能会需要调整一下cameraSpeed。

### 鼠标控制视角

只用键盘移动没什么意思。特别是我们还不能转向，移动很受限制。是时候加入鼠标了！

**为了能够改变视角，我们需要根据鼠标的输入改变cameraFront向量。**然而，根据鼠标移动改变方向向量有点复杂，需要一些三角学知识。如果你对三角学知之甚少，别担心，你可以跳过这一部分，直接复制粘贴我们的代码；当你想了解更多的时候再回来看。

#### 欧拉角

**欧拉角(Euler Angle)是可以表示3D空间中任何旋转的3个值**，由莱昂哈德·欧拉(Leonhard Euler)在18世纪提出。**一共有3种欧拉角：俯仰角(Pitch)、偏航角(Yaw)和滚转角(Roll)**，下面的图片展示了它们的含义：

![[camera_pitch_yaw_roll.png|img]]

俯仰角是描述我们如何往上或往下看的角，可以在第一张图中看到。第二张图展示了偏航角，偏航角表示我们往左和往右看的程度。滚转角代表我们如何**翻滚**摄像机，通常在太空飞船的摄像机中使用。**每个欧拉角都有一个值来表示，把三个角结合起来我们就能够计算3D空间中任何的旋转向量了。**

**对于我们的摄像机系统来说，我们只关心俯仰角和偏航角**，所以我们不会讨论滚转角。**给定一个俯仰角和偏航角，我们可以把它们转换为一个代表新的方向向量的3D向量。**俯仰角和偏航角转换为方向向量的处理需要一些三角学知识，我们先从最基本的情况开始：

![[camera_triangle.png|img]]

如果我们把斜边边长定义为1，我们就能知道邻边的长度是cos x，它的对边是sin y。这样我们获得了能够得到x和y方向长度的通用公式，它们取决于所给的角度。**欧拉角推导过程：**

我们需要得到黄色向量，所以（X，Y，Z）一个一个去推

![[v2-739e305622886800faaf952a1df94270_r 1.jpg|img]]

Y的量是最好求的

俯仰角P是已知的，设黄色向量的值为1

所以红色向量=sinp，蓝色向量=cosp

黄色向量的Y=sinp

![[v2-97cdb45449dd0e831c22a87b0171e7c1_r 1.jpg|img]]

再利用偏航角y来求一下黄色向量的x、z，也就是图中绿色段和白色段

![[v2-447cf8767b7623fde4da0696a214eb36_r 1.jpg|img]]

已知偏航角y和刚刚求出来的cosp

所以黄色向量的x=siny*cosp、z=cosy*cosp

![[v2-b12cc179c00a5d6ca31f6b97c8b91f39_r 1.jpg|img]]

所以黄色向量为（siny*cosp，sinp，cosy*cosp）

**得到基于俯仰角和偏航角的方向向量：**

```c++ nums
direction.x = cos(glm::radians(pitch)) * cos(glm::radians(yaw)); // 译注：direction代表摄像机的前轴(Front)，这个前轴是和本文第一幅图片的第二个摄像机的方向向量是相反的
direction.y = sin(glm::radians(pitch));
direction.z = cos(glm::radians(pitch)) * sin(glm::radians(yaw));
```

这样我们就有了一个可以把俯仰角和偏航角转化为用来自由旋转视角的摄像机的3维方向向量了。

#### 	鼠标输入
你可能会奇怪：我们怎么得到俯仰角和偏航角？

偏航角和俯仰角是通过鼠标（或手柄）移动获得的，**水平的移动影响偏航角，竖直的移动影响俯仰角。**

**它的原理就是，储存上一帧鼠标的位置，在当前帧中我们当前计算鼠标位置与上一帧的位置相差多少。如果水平/竖直差别越大那么俯仰角或偏航角就改变越大，也就是摄像机需要移动更多的距离。**

**（1）首先我们要告诉GLFW，它应该隐藏光标，并捕捉(Capture)它。**捕捉光标表示的是，如果焦点在你的程序上（译注：即表示你正在操作这个程序，Windows中拥有焦点的程序标题栏通常是有颜色的那个，而失去焦点的程序标题栏则是灰色的），光标应该停留在窗口中（除非程序失去焦点或者退出）。我们可以用一个简单地配置调用来完成：

```c++ nums
glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
```

**在调用这个函数之后，无论我们怎么去移动鼠标，光标都不会显示了，它也不会离开窗口。**对于FPS摄像机系统来说非常完美。

**（2）为了计算俯仰角和偏航角，我们需要让GLFW监听鼠标移动事件。**（和键盘输入相似）我们会用一个**回调函数**来完成，函数的原型如下：

```c++ nums
void mouse_callback(GLFWwindow* window, double xpos, double ypos);
```

这里的xpos和ypos代表当前鼠标的位置。当我们用GLFW注册了回调函数之后，鼠标一移动mouse_callback函数就会被调用：

```c++ nums
glfwSetCursorPosCallback(window, mouse_callback);
```



**在处理FPS风格摄像机的鼠标输入的时候，我们必须在最终获取方向向量之前做下面这几步：**

1. **计算鼠标距上一帧的偏移量。**
2. **把偏移量添加到摄像机的俯仰角和偏航角中。**
3. **对偏航角和俯仰角进行最大和最小值的限制。**
4. **计算方向向量。**

（1）第一步是计算鼠标自上一帧的偏移量。我们必须先在程序中储存上一帧的鼠标位置，我们把它的初始值设置为屏幕的中心（屏幕的尺寸是800x600）：

```c++ nums
float lastX = 400, lastY = 300;
```

然后在鼠标的回调函数中我们计算当前帧和上一帧鼠标位置的偏移量：

```c++ nums
float xoffset = xpos - lastX;
float yoffset = lastY - ypos; // 注意这里是相反的，因为y坐标是从底部往顶部依次增大的 （解释在下图）
lastX = xpos;
lastY = ypos;

//设置灵敏度
float sensitivity = 0.05f;	
xoffset *= sensitivity;
yoffset *= sensitivity;
```
![[Pasted image 20221004142908.png]]
注意我们把偏移量乘以了sensitivity（灵敏度）值。如果我们忽略这个值，鼠标移动就会太大了；你可以自己实验一下，找到适合自己的灵敏度值。	

（2）接下来我们把偏移量加到全局变量pitch和yaw上：

```c++ nums
yaw   += xoffset;
pitch += yoffset;
```

(3)第三步，我们需要给摄像机添加一些限制，这样摄像机就不会发生奇怪的移动了（这样也会避免一些奇怪的问题）。对于俯仰角，要让用户不能看向高于89度的地方（在90度时视角会发生逆转，所以我们把89度作为极限），同样也不允许小于-89度。这样能够保证用户只能看到天空或脚下，但是不能超越这个限制。我们可以在值超过限制的时候将其改为极限值来实现：

```c++ nums
if(pitch > 89.0f)
  pitch =  89.0f;
if(pitch < -89.0f)
  pitch = -89.0f;
```

注意我们没有给偏航角设置限制，这是因为我们不希望限制用户的水平旋转。当然，给偏航角设置限制也很容易，如果你愿意可以自己实现。

(4)第四也是最后一步，就是通过俯仰角和偏航角来计算以得到真正的方向向量：

```c++ nums
glm::vec3 front;
front.x = cos(glm::radians(pitch)) * cos(glm::radians(yaw));
front.y = sin(glm::radians(pitch));
front.z = cos(glm::radians(pitch)) * sin(glm::radians(yaw));
cameraFront = glm::normalize(front);
```

计算出来的方向向量就会包含根据鼠标移动计算出来的所有旋转了。由于cameraFront向量已经包含在GLM的lookAt函数中，我们这就没什么问题了。

如果你现在运行代码，你会发现在窗口第一次获取焦点的时候摄像机会突然跳一下。这个问题产生的原因是，在你的鼠标移动进窗口的那一刻，鼠标回调函数就会被调用，这时候的xpos和ypos会等于鼠标刚刚进入屏幕的那个位置。这通常是一个距离屏幕中心很远的地方，因而产生一个很大的偏移量，所以就会跳了。我们可以简单的使用一个`bool`变量检验我们是否是第一次获取鼠标输入，如果是，那么我们先把鼠标的初始位置更新为xpos和ypos值，这样就能解决这个问题；接下来的鼠标移动就会使用刚进入的鼠标位置坐标来计算偏移量了：

```c++ nums
if(firstMouse) // 这个bool变量初始时是设定为true的
{
    lastX = xpos;
    lastY = ypos;
    firstMouse = false;
}
```

最后的代码应该是这样的：

```c++ nums
void mouse_callback(GLFWwindow* window, double xpos, double ypos)
{
    if(firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos; 
    lastX = xpos;
    lastY = ypos;

    float sensitivity = 0.05;
    xoffset *= sensitivity;
    yoffset *= sensitivity;

    yaw   += xoffset;
    pitch += yoffset;

    if(pitch > 89.0f)
        pitch = 89.0f;
    if(pitch < -89.0f)
        pitch = -89.0f;

    glm::vec3 front;
    front.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
    front.y = sin(glm::radians(pitch));
    front.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));
    cameraFront = glm::normalize(front);
}
```

现在我们就可以自由地在3D场景中移动了！

#### 滚轮缩放

作为我们摄像机系统的一个附加内容，我们还会来实现一个缩放(Zoom)接口。在之前的教程中我们说**视野**(Field of View)或**fov**定义了我们可以看到场景中多大的范围。当视野变小时，场景投影出来的空间就会减小，产生放大(Zoom In)了的感觉。我们会使用鼠标的滚轮来放大。与鼠标移动、键盘输入一样，我们**需要一个鼠标滚轮的回调函数：**

```c++ nums
void scroll_callback(GLFWwindow* window, double xoffset, double yoffset)
{
  if(fov >= 1.0f && fov <= 45.0f)
    fov -= yoffset;
  if(fov <= 1.0f)
    fov = 1.0f;
  if(fov >= 45.0f)
    fov = 45.0f;
}
```

当滚动鼠标滚轮的时候，yoffset值代表我们竖直滚动的大小。当scroll_callback函数被调用后，我们改变全局变量fov变量的内容。因为`45.0f`是默认的视野值，我们将会把缩放级别(Zoom Level)限制在`1.0f`到`45.0f`。

我们现在在每一帧都必须把透视投影矩阵上传到GPU，但现在使用fov变量作为它的视野：

```c++ nums
projection = glm::perspective(glm::radians(fov), 800.0f / 600.0f, 0.1f, 100.0f);
```

最后不要忘记注册鼠标滚轮的回调函数：

```c++ nums
glfwSetScrollCallback(window, scroll_callback);
```

现在，我们就实现了一个简单的摄像机系统了，它能够让我们在3D环境中自由移动。

[滚轮缩放效果](https://learnopengl-cn.github.io/img/01/09/camera_mouse.mp4)

> 注意，**使用欧拉角的摄像机系统并不完美。根据你的视角限制或者是配置，你仍然可能引入[万向节死锁](http://en.wikipedia.org/wiki/Gimbal_lock)问题。最好的摄像机系统是使用四元数(Quaternions)的**，但我们将会把这个留到后面讨论。（译注：[这里](https://github.com/cybercser/OpenGL_3_3_Tutorial_Translation/blob/master/Tutorial 17 Rotations.md)可以查看四元数摄像机的实现）

#### 代码(键鼠控制视角)

```c++ nums
//全局变量
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;
float lastX = 400, lastY = 300; 	//鼠标上一帧位置的初始值
float pitch= 0.0f, yaw = 0.0f; //俯仰角和翻滚角
bool firstMouse = true;

glm::vec3 cameraPos = glm::vec3(0.0f, 0.0f, 3.0f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp = glm::vec3(0.0f, 1.0f, 0.0f);

//渲染循环
// render loop
    while (!glfwWindowShouldClose(window))
    {
 
        processInput(window);
        glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);    //隐藏光标并捕捉
        glfwSetCursorPosCallback(window, mouse_callback); //监听鼠标移动时间，来计算俯仰角和偏航角

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture1);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, texture2);

    
        ourShader.use();

        glm::mat4 view;
        view = glm::lookAt(cameraPos,cameraPos+cameraFront,cameraUp);
        
        //将矩阵传入着色器
        unsigned int viewLoc = glGetUniformLocation(ourShader.ID, "view");
        glUniformMatrix4fv(viewLoc, 1, GL_FALSE, glm::value_ptr(view));

        glBindVertexArray(VAO);
        for (unsigned int i = 0; i < 10;i++)
        {
            glm::mat4 model;
            model = glm::translate(model, cubePositions[i]);
            float angle = 20.0f * i;
            model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
            
            unsigned int modelLoc = glGetUniformLocation(ourShader.ID, "model");
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));

            glDrawArrays(GL_TRIANGLES, 0, 36);
        }
       
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

//鼠标回调函数
void mouse_callback(GLFWwindow* window, double xpos, double ypos)
{
    //防止初始视角跳动
    if (firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }
    float xoffset = xpos - lastX;
    float yoffset =  lastY - ypos ;
    lastX = xpos;
    lastY = ypos;

    //设置灵敏度
    float sensitivity = 0.05;
    xoffset *= sensitivity;
    yoffset *= sensitivity;


    yaw += xoffset;
    pitch += yoffset;

    //控制俯仰角，不需要控制偏航角
    if (pitch > 89.0f)
        pitch = 89.0f;
    if (pitch < -89.0f)
        pitch = -89.0f;

    glm::vec3 front;
    front.x = cos(glm::radians(pitch)) * cos(glm::radians(yaw));
    front.y = sin(glm::radians(pitch));
    front.z = cos(glm::radians(pitch)) * sin(glm::radians(yaw));
    cameraFront = glm::normalize(front);
}
```

### 摄像机类

接下来的教程中，我们将会一直使用一个摄像机来浏览场景，从各个角度观察结果。我们将会从细节抽象出来，创建我们自己的摄像机对象，它会完成大多数的工作，而且还会提供一些附加的功能。

和着色器对象一样，我们把摄像机类写在一个单独的头文件中。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/camera.h)找到它，

> 我们介绍的摄像机系统是一个FPS风格的摄像机，它能够满足大多数情况需要，而且与欧拉角兼容，但是在创建不同的摄像机系统，比如飞行模拟摄像机，时就要当心。每个摄像机系统都有自己的优点和不足，所以确保对它们进行了详细研究。比如，这个FPS摄像机不允许俯仰角大于90度，而且我们使用了一个固定的上向量(0, 1, 0)，这在需要考虑滚转角的时候就不能用了。

使用新摄像机对象，更新后版本的源码可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/1.getting_started/7.4.camera_class/camera_class.cpp)找到。

```c++ nums
#ifndef CAMERA_H
#define CAMERA_H

#include <glad/glad.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <vector>

//定义摄像机移动的几个可能选项。用作抽象，以远离特定于窗口系统的输入方法
enum Camera_Movement
{
	FORWARD,
	BACKWARD,
	LEFT,
	RIGHT
};
//默认参数
const float YAW = -90.0f;
const float PITCH = 0.0f;
const float SPEED = 2.5f;
const float SENSITIVITY = 0.1f;
const float ZOOM = 45.0f;

//处理输入并计算相应的欧拉角、向量和矩阵的抽象相机类，供OpenGL使用
class Camera
{
public:
	//摄相机参数
	glm::vec3 Position;
	glm::vec3 Front;
	glm::vec3 Up;
	glm::vec3 Right;
	glm::vec3 WorldUp;

	//欧拉角
	float Yaw;
	float Pitch;

	//功能
	float MovementSpeed;	//键盘控制的移动速度
	float MouseSensitivity;	//鼠标灵敏度
	float Zoom;	//滚轮缩放

	//构造函数与向量
	Camera(glm::vec3 position = glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3 up = glm::vec3(0.0f, 1.0f, 0.0f), float yaw = YAW, float pitch = PITCH) 
		: Front(glm::vec3(0.0f, 0.0f, -1.0f)), MovementSpeed(SPEED), MouseSensitivity(SENSITIVITY), Zoom(ZOOM)
	{
		Position = position;
		WorldUp = up;
		Yaw = yaw;
		Pitch = pitch;
		updateCameraVectors();
	}

	//构造函数与标量值
	Camera(float posX, float posY, float posZ, float upX, float upY, float upZ, float yaw, float pitch) 
		: Front(glm::vec3(0.0f, 0.0f, -1.0f)), MovementSpeed(SPEED), MouseSensitivity(SENSITIVITY), Zoom(ZOOM)
	{
		Position = glm::vec3(posX, posY, posZ);
		WorldUp = glm::vec3(upX, upY, upZ);
		Yaw = yaw;
		Pitch = pitch;
		updateCameraVectors();
	}

	// 返回使用欧拉角和LookAt矩阵计算的观察矩阵
	glm::mat4 GetViewMatrix()
	{
		return glm::lookAt(Position, Position + Front, Up);
	}

	//处理从任何类似键盘的输入系统接收的输入。接受摄像机定义ENUM形式的输入参数(从窗口系统中抽象它)
	void ProcessKeyboard(Camera_Movement direction, float deltaTime)
	{
		//deltaTime:当前帧和上一帧之间的时间间隔
		//velocity:即速度v
		float velocity = MovementSpeed * deltaTime;
		if (direction == FORWARD)
			Position += Front * velocity;
		if (direction == BACKWARD)
			Position -= Front * velocity;
		if (direction == LEFT)
			Position -= Right * velocity;
		if (direction == RIGHT)
			Position += Right * velocity;
	}

	// 处理从鼠标输入系统接收的输入。期望在x和y方向上的偏移值。
	void ProcessMouseMovement(float xoffset, float yoffset, GLboolean constrainPitch = true)
	{
		xoffset *= MouseSensitivity;
		yoffset *= MouseSensitivity;

		Yaw += xoffset;
		Pitch += yoffset;

		// 确保当俯仰角超出界限时，屏幕不会翻转
		if (constrainPitch)
		{
			if (Pitch > 89.0f)
				Pitch = 89.0f;
			if (Pitch < -89.0f)
				Pitch = -89.0f;
		}

		//使用更新后的欧拉角更新前、右和上向量
		updateCameraVectors();
	}

	//处理从鼠标滚轮事件接收的输入。只需要在垂直轮轴上输入
	void ProcessMouseScroll(float yoffset)
	{
		Zoom -= (float)yoffset;
		if (Zoom < 1.0f)
			Zoom = 1.0f;
		if (Zoom > 45.0f)
			Zoom = 45.0f;
	}

private:
	// 从相机的(更新的)欧拉角计算前方矢量
	void updateCameraVectors()
	{
		//计算新的Front向量
		glm::vec3 front;
		front.x = cos(glm::radians(Yaw)) * cos(glm::radians(Pitch));
		front.y = sin(glm::radians(Pitch));
		front.z = sin(glm::radians(Yaw)) * cos(glm::radians(Pitch));
		Front = glm::normalize(front);
		// 也重新计算右和向上向量
		Right = glm::normalize(glm::cross(Front, WorldUp));  //将这些向量归一化，因为你越往上或往下看，它们的长度就越接近于0，这就会导致运动变慢。
		Up = glm::normalize(glm::cross(Right, Front));
	}
};
#endif


# 光照

## 颜色

本节我们将会更深入地讨论什么是颜色，并且还会为接下来的光照(Lighting)教程创建一个场景。	

现实世界中有无数种颜色，每一个物体都有它们自己的颜色。我们需要使用（有限的）数值来模拟真实世界中（无限）的颜色，所以并不是所有现实世界中的颜色都可以用数值来表示的。然而我们仍能通过数值来表现出非常多的颜色，甚至你可能都不会注意到与现实的颜色有任何的差异。颜色可以数字化的由红色(Red)、绿色(Green)和蓝色(Blue)三个分量组成，它们通常被缩写为RGB。仅仅用这三个值就可以组合出任意一种颜色。例如，要获取一个**珊瑚红(Coral)**色的话，我们可以定义这样的一个颜色向量：

```c++ nums
glm::vec3 coral(1.0f, 0.5f, 0.31f);
```

我们在现实生活中看到某一物体的颜色并不是这个物体真正拥有的颜色，而是它所反射的(Reflected)颜色。换句话说，**那些不能被物体所吸收(Absorb)的颜色（被拒绝的颜色）就是我们能够感知到的物体的颜色。**例如，太阳光能被看见的白光其实是由许多不同的颜色组合而成的（如下图所示）。如果我们将白光照在一个蓝色的玩具上，这个蓝色的玩具会吸收白光中除了蓝色以外的所有子颜色，不被吸收的蓝色光被反射到我们的眼中，让这个玩具看起来是蓝色的。下图显示的是一个珊瑚红的玩具，它以不同强度反射了多个颜色。

![[light_reflection.png|img]]

你可以看到，白色的阳光实际上是所有可见颜色的集合，物体吸收了其中的大部分颜色。它仅反射了代表物体颜色的部分，被反射颜色的组合就是我们所感知到的颜色（此例中为珊瑚红）。

这些颜色反射的定律被直接地运用在图形领域。当我们在OpenGL中创建一个光源时，我们希望给光源一个颜色。在上一段中我们有一个白色的太阳，所以我们也将光源设置为白色。**当我们把光源的颜色与物体的颜色值相乘，所得到的就是这个物体所反射的颜色（也就是我们所感知到的颜色）。**让我们再次审视我们的玩具（这一次它还是珊瑚红），看看如何在图形学中计算出它的反射颜色。我们将这两个颜色向量作**分量相乘**，结果就是最终的颜色向量了：

```c++ nums
glm::vec3 lightColor(1.0f, 1.0f, 1.0f);
glm::vec3 toyColor(1.0f, 0.5f, 0.31f);
glm::vec3 result = lightColor * toyColor; // = (1.0f, 0.5f, 0.31f);
```



我们可以看到玩具的颜色**吸收**了白色光源中很大一部分的颜色，但它根据自身的颜色值对红、绿、蓝三个分量都做出了一定的反射。这也表现了现实中颜色的工作原理。由此，我们可以定义**物体的颜色为物体从一个光源反射各个颜色分量的大小**。现在，如果我们使用绿色的光源又会发生什么呢？

```c++ nums
glm::vec3 lightColor(0.0f, 1.0f, 0.0f);
glm::vec3 toyColor(1.0f, 0.5f, 0.31f);
glm::vec3 result = lightColor * toyColor; // = (0.0f, 0.5f, 0.0f);
```

可以看到，并没有红色和蓝色的光让我们的玩具来吸收或反射。这个玩具吸收了光线中一半的绿色值，但仍然也反射了一半的绿色值。玩具现在看上去是深绿色(Dark-greenish)的。我们可以看到，如果我们用绿色光源来照射玩具，那么只有绿色分量能被反射和感知到，红色和蓝色都不能被我们所感知到。这样做的结果是，一个珊瑚红的玩具突然变成了深绿色物体。现在我们来看另一个例子，使用深橄榄绿色(Dark olive-green)的光源：

```c++ nums
glm::vec3 lightColor(0.33f, 0.42f, 0.18f);
glm::vec3 toyColor(1.0f, 0.5f, 0.31f);
glm::vec3 result = lightColor * toyColor; // = (0.33f, 0.21f, 0.06f);
```

可以看到，我们可以使用不同的光源颜色来让物体显现出意想不到的颜色。有创意地利用颜色其实并不难。

这些颜色的理论已经足够了，下面我们来构造一个实验用的场景吧。

#### 创建一个光照场景

在接下来的教程中，我们将会广泛地使用颜色来模拟现实世界中的光照效果，创造出一些有趣的视觉效果。由于我们现在将会使用光源了，我们希望将它们显示为可见的物体，并在场景中至少加入一个物体来测试模拟光照的效果。

首先我们需要一个物体来作为被投光(Cast the light)的对象，我们将使用前面教程中的那个著名的立方体箱子。我们还需要一个物体来代表光源在3D场景中的位置。简单起见，我们依然使用一个立方体来代表光源（我们已拥有立方体的[顶点数据](https://learnopengl.com/code_viewer.php?code=getting-started/cube_vertices)是吧？）。

填一个顶点缓冲对象(VBO)，设定一下顶点属性指针和其它一些乱七八糟的东西现在对你来说应该很容易了，所以我们就不再赘述那些步骤了。如果你仍然觉得这很困难，我建议你复习[之前的教程](https://learnopengl-cn.github.io/01 Getting started/04 Hello Triangle/)，并且在继续学习之前先把练习过一遍。

（1）**我们首先需要一个顶点着色器来绘制箱子。**与之前的顶点着色器相比，容器的顶点位置是保持不变的（虽然这一次我们不需要纹理坐标了），因此顶点着色器中没有新的代码。我们将会使用之前教程顶点着色器的精简版：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```

记得更新你的顶点数据和属性指针使其与新的顶点着色器保持一致（当然你可以继续留着纹理数据和属性指针。在这一节中我们将不会用到它们，但有一个全新的开始也不是什么坏主意）。

(2)因为我们还要**创建一个表示灯（光源）的立方体**，所以我们还要为这个灯创建一个专门的VAO。当然我们也可以让这个灯和其它物体使用同一个VAO，简单地对它的model（模型）矩阵做一些变换就好了，然而接下来的教程中我们会频繁地对顶点数据和属性指针做出修改，我们并不想让这些修改影响到灯（我们只关心灯的顶点位置），因此我们有必要**为灯创建一个新的VAO。**

```c++ nums
unsigned int lightVAO;
glGenVertexArrays(1, &lightVAO);
glBindVertexArray(lightVAO);
// 只需要绑定VBO不用再次设置VBO的数据，因为箱子的VBO数据中已经包含了正确的立方体顶点数据
glBindBuffer(GL_ARRAY_BUFFER, VBO);
// 设置灯立方体的顶点属性（对我们的灯来说仅仅只有位置数据）
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
```

这段代码对你来说应该非常直观。现在我们已经创建了表示灯和被照物体箱子，我们只需要再定义一个片元着色器就行了：

```c++ nums
#version 330 core
out vec4 FragColor;

uniform vec3 objectColor;
uniform vec3 lightColor;

void main()
{
    FragColor = vec4(lightColor * objectColor, 1.0);
}
```

这个片元着色器从uniform变量中接受物体的颜色和光源的颜色。正如本节一开始所讨论的那样，我们将光源的颜色和物体（反射的）颜色相乘。这个着色器理解起来应该很容易。我们把物体的颜色设置为之前提到的珊瑚红色，并把光源设置为白色。

```c++ nums
// 在此之前不要忘记首先 use 对应的着色器程序（来设定uniform）
lightingShader.use();
lightingShader.setVec3("objectColor", 1.0f, 0.5f, 0.31f);
lightingShader.setVec3("lightColor",  1.0f, 1.0f, 1.0f);
```

要注意的是，当我们修改顶点或者片元着色器后，灯的位置或颜色也会随之改变，这并不是我们想要的效果。我们不希望灯的颜色在接下来的教程中因光照计算的结果而受到影响，而是希望它能够与其它的计算分离。我们希望灯一直保持明亮，不受其它颜色变化的影响（这样它才更像是一个真实的光源）。

(3)为了实现这个目标，**我们需要为灯的绘制创建另外的一套着色器，从而能保证它能够在其它光照着色器发生改变的时候不受影响。**顶点着色器与我们当前的顶点着色器是一样的，所以你可以直接把现在的顶点着色器用在灯上。**灯的片元着色器给灯定义了一个不变的常量白色，保证了灯的颜色一直是亮的：**

```c++ nums
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0); // 将向量的四个分量全部设置为1.0
}
```

当我们想要绘制我们的物体的时候，我们需要使用刚刚定义的光照着色器来绘制箱子（或者可能是其它的物体）。当我们想要绘制灯的时候，我们会使用灯的着色器。在之后的教程里我们会逐步更新这个光照着色器，从而能够慢慢地实现更真实的效果。

(4)**使用这个灯立方体的主要目的是为了让我们知道光源在场景中的具体位置。**我们通常在场景中定义一个光源的位置，但这只是一个位置，它并没有视觉意义。为了显示真正的灯，我们将表示光源的立方体绘制在与光源相同的位置。我们将使用我们为它新建的片元着色器来绘制它，让它一直处于白色的状态，不受场景中的光照影响。

我们声明一个全局`vec3`变量来表示光源在场景的世界空间坐标中的位置：

```c++ nums
glm::vec3 lightPos(1.2f, 1.0f, 2.0f);
```

然后我们把灯位移到这里，然后将它缩小一点，让它不那么明显：

```c++ nums
model = glm::mat4();
model = glm::translate(model, lightPos);
model = glm::scale(model, glm::vec3(0.2f));
```

绘制灯立方体的代码应该与下面的类似：

```c++ nums
lampShader.use();
// 设置模型、视图和投影矩阵uniform
...
// 绘制灯立方体对象
glBindVertexArray(lightVAO);
glDrawArrays(GL_TRIANGLES, 0, 36);
```

请把上述的所有代码片段放在你程序中合适的位置，这样我们就能有一个干净的光照实验场地了。如果一切顺利，运行效果将会如下图所示：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/1.colors/colors.cpp)

![[colors_scene.png|img]]



```c++ nums
//全局变量
glm::vec3 lightPos(1.2f, 1.0f, 2.0f);

int main()
{
   .........
    Shader modelShader("vertexShader.vert", "fragmentShader.frag");
    Shader lightShader("lightvertexShader.vert", "lightfragmentShader.frag");
  
    float vertices[] = {
        -0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,

        -0.5f, -0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,

        -0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,

         0.5f,  0.5f,  0.5f,
         0.5f,  0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,

        -0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f, -0.5f,

        -0.5f,  0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f, -0.5f,
    };

   //第一，配置模型的VAO和VBO
    unsigned int VBO, VAO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
 
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glBindVertexArray(VAO);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    
    // 第二，配置灯的VAO (VBO保持不变;光源和模型的顶点是相同的，这也是一个3D立方体)
    unsigned int lightVAO;
    glGenVertexArrays(1, &lightVAO);
    glBindVertexArray(lightVAO);

    //我们只需要绑定到VBO(链接它与glVertexAttribPointer)，不需要填充它;VBO的数据已经包含了我们所需要的一切(它已经被绑定了，但我们为了教育目的再做一次)
    glBindBuffer(GL_ARRAY_BUFFER, VBO);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);


    // render loop
    while (!glfwWindowShouldClose(window))
    {
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        processInput(window);
        
       
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      	
        //1.绘制模型
        modelShader.use();
        //设定uniform不要忘记首先 use 对应的着色器程序
        //我们把物体的颜色设置为之前提到的珊瑚红色，并把光源设置为白色。
        modelShader.setVec3("objectColor", 1.0f, 0.5f, 0.31f);
        modelShader.setVec3("lightColor", 1.0f, 1.0f, 1.0f);
        //模型矩阵
        glm::mat4 model;
        modelShader.setMat4("model", model);
        //观察矩阵
        glm::mat4 view = camera.GetViewMatrix();
        modelShader.setMat4("view", view);
        //投影矩阵
        glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
        modelShader.setMat4("projection", projection);
       
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);
       
        //绘制灯模型
        lightShader.use();
        lightShader.setMat4("projection", projection);
        lightShader.setMat4("view", view);
        model = glm::translate(model, lightPos);
        model = glm::scale(model, glm::vec3(0.2f));
        lightShader.setMat4("model", model);
       
        glBindVertexArray(lightVAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteVertexArrays(1, &lightVAO);
    glDeleteBuffers(1, &VBO);
  
    glfwTerminate();
    return 0;
}
```

## 基础光照

现实世界的光照是极其复杂的，而且会受到诸多因素的影响，这是我们有限的计算能力所无法模拟的。因此OpenGL的光照使用的是简化的模型，对现实的情况进行近似，这样处理起来会更容易一些，而且看起来也差不多一样。

这些光照模型都是基于我们对光的物理特性的理解。其中一个模型被称为冯氏光照模型(Phong Lighting Model)。冯氏光照模型的主要结构由3个分量组成：环境(Ambient)、漫反射(Diffuse)和镜面(Specular)光照。下面这张图展示了这些光照分量看起来的样子：

![[basic_lighting_phong.png|img]]

- 环境光照(Ambient Lighting)：即使在黑暗的情况下，世界上通常也仍然有一些光亮（月亮、远处的光），所以物体几乎永远不会是完全黑暗的。为了模拟这个，我们会使用一个环境光照常量，它永远会给物体一些颜色。
- 漫反射光照(Diffuse Lighting)：模拟光源对物体的方向性影响(Directional Impact)。它是冯氏光照模型中视觉上最显著的分量。物体的某一部分越是正对着光源，它就会越亮。
- 镜面光照(Specular Lighting)：模拟有光泽物体上面出现的亮点。镜面光照的颜色相比于物体的颜色会更倾向于光的颜色。

为了创建有趣的视觉场景，我们希望模拟至少这三种光照分量。我们将以最简单的一个开始：**环境光照**。

### 环境光照

光通常都不是来自于同一个光源，而是来自于我们周围分散的很多光源，即使它们可能并不是那么显而易见。光的一个属性是，它可以向很多方向发散并反弹，从而能够到达不是非常直接临近的点。所以，光能够在其它的表面上**反射**，对一个物体产生间接的影响。考虑到这种情况的算法叫做全局照明(Global Illumination)算法，但是这种算法既开销高昂又极其复杂。

由于我们现在对那种又复杂又开销高昂的算法不是很感兴趣，所以我们将会先使用一个简化的全局照明模型，即环境光照。正如你在上一节所学到的，**我们使用一个很小的常量（光照）颜色，添加到物体片段的最终颜色中，这样子的话即便场景中没有直接的光源也能看起来存在有一些发散的光。**

**把环境光照添加到场景里非常简单。我们用光的颜色乘以一个很小的常量环境因子，再乘以物体的颜色，然后将最终结果作为片段的颜色：**

```c++ nums
void main()
{
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * lightColor;

    vec3 result = ambient * objectColor;
    FragColor = vec4(result, 1.0);
}
```

如果你现在运行你的程序，你会注意到冯氏光照的第一个阶段已经应用到你的物体上了。这个物体非常暗，但由于应用了环境光照（注意光源立方体没受影响是因为我们对它使用了另一个着色器），也不是完全黑的。它看起来应该像这样：

![[ambient_lighting.png|img]]

### 漫反射光照

漫反射光照使物体上与光线方向越接近的片段能从光源处获得更多的亮度。为了能够更好的理解漫反射光照，请看下图：

![[diffuse_light.png|img]]

图左上方有一个光源，它所发出的光线落在物体的一个片段上。我们需要测量这个光线是以什么角度接触到这个片段的。如果光线垂直于物体表面，这束光对物体的影响会最大化（译注：更亮）。为了测量光线和片段的角度，我们使用一个叫做**法向量(Normal Vector)的东西，它是垂直于片段表面的一个向量（这里以黄色箭头表示），我们在后面再讲这个东西。这两个向量之间的角度很容易就能够通过点乘计算出来。

你可能记得在[变换](https://learnopengl-cn.github.io/01 Getting started/07 Transformations/)那一节教程里，我们知道两个单位向量的夹角越小，它们点乘的结果越倾向于1。当两个向量的夹角为90度的时候，点乘会变为0。这同样适用于θ，θ越大，光对片段颜色的影响就应该越小。

> **注意，为了（只）得到两个向量夹角的余弦值，我们使用的是单位向量（长度为1的向量），所以我们需要确保所有的向量都是标准化的，否则点乘返回的就不仅仅是余弦值了**（见[变换](https://learnopengl-cn.github.io/01 Getting started/07 Transformations/)）。

点乘返回一个标量，我们可以用它计算光线对片段颜色的影响。不同片段朝向光源的方向的不同，这些片段被照亮的情况也不同。

**所以，计算漫反射光照需要什么？**

- **法向量**：一个垂直于顶点表面的向量。
- **定向的光线**：作为光源的位置与片段的位置之间向量差的方向向量**（方向由顶点指向光源）**。为了计算这个光线，我们需要光的位置向量和片段的位置向量。

法向量是一个垂直于顶点表面的（**单位**）向量。由于顶点本身并没有表面（它只是空间中一个独立的点），我们利用它周围的顶点来计算出这个顶点的表面。我们能够使用一个小技巧，使用叉乘对立方体所有的顶点计算法向量，但是由于3D立方体不是一个复杂的形状，所以我们可以简单地把法线数据手工添加到顶点数据中。更新后的顶点数据数组可以在[这里](https://learnopengl.com/code_viewer.php?code=lighting/basic_lighting_vertex_data)找到。试着去想象一下，这些法向量真的是垂直于立方体各个平面的表面的（一个立方体由6个平面组成）。

（1）由于我们向顶点数组添加了额外的数据，所以我们应该**更新光照的顶点着色器**：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
...
```

（2）现在我们已经向每个顶点添加了一个法向量并更新了顶点着色器，我们还要**更新顶点属性指针**。注意，灯使用同样的顶点数组作为它的顶点数据，然而灯的着色器并没有使用新添加的法向量。我们不需要更新灯的着色器或者是属性的配置，但是我们必须至少修改一下顶点属性指针来适应新的顶点数组的大小：

```c++ nums
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
```

我们只想使用每个顶点的前三个float，并且忽略后三个float，所以我们只需要把**步长**参数改成`float`大小的6倍就行了。

> 虽然对灯的着色器使用不能完全利用的顶点数据看起来不是那么高效，但这些顶点数据已经从箱子对象载入后开始就储存在GPU的内存里了，所以我们并不需要储存新数据到GPU内存中。这实际上比给灯专门分配一个新的VBO更高效了。

（3）所有光照的计算都是在片元着色器里进行，所以我们需要**将法向量由顶点着色器传递到片元着色器**。我们这么做：

```c++ nums
out vec3 Normal;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
    Normal = aNormal;
}
```

接下来，在片元着色器中定义相应的输入变量：

```c++ nums
in vec3 Normal;
```

（4）我们现在对每个顶点都有了法向量，但是我们仍然**需要光源的位置向量和片段的位置向量**。由于**光源的位置是一个静态变量**，我们可以简单地在片元着色器中把它声明为uniform：

```c++ nums
uniform vec3 lightPos;
```

然后在渲染循环中（渲染循环的外面也可以，因为它不会改变）更新uniform。我们使用在前面声明的lightPos向量作为光源位置：

```c++ nums
lightingShader.setVec3("lightPos", lightPos);
```

（5）我们还需要片段的位置。**我们会==在世界空间中进行所有的光照计算==，因此我们需要一个在世界空间中的顶点位置。**我们可以**通过把顶点位置属性乘以模型矩阵**（不是观察和投影矩阵）来把它**变换到世界空间坐标**。这个在顶点着色器中很容易完成，所以我们声明一个输出变量，并计算它的世界空间坐标：

```c++ nums
out vec3 FragPos;  
out vec3 Normal;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = aNormal;
}
```

最后，在片元着色器中添加相应的输入变量。

```c++ nums
in vec3 FragPos;
```

现在，所有需要的变量都设置好了，我们可以在片元着色器中**添加光照计算**了。

（1）我们需要做的第一件事是**计算光源和片段位置之间的方向向量**。前面提到，光的方向向量是光源位置向量与片段位置向量之间的向量差。我们同样希望确保所有相关向量最后都转换为单位向量，所以我们把法线和最终的方向向量都进行标准化：

```c++ nums
vec3 norm = normalize(Normal);
vec3 lightDir = normalize(lightPos - FragPos);
```

> **当计算光照时我们通常不关心一个向量的模长或它的位置，我们只关心它们的方向。所以，几乎所有的计算都使用单位向量完成，因为这简化了大部分的计算（比如点乘）。**所以当进行光照计算时，确保你总是对相关向量进行标准化，来保证它们是真正地单位向量。忘记对向量进行标准化是一个十分常见的错误。

（2）下一步，我们**对norm和lightDir向量进行点乘，计算光源对当前片段实际的漫发射影响。结果值再乘以光的颜色，得到漫反射分量。**两个向量之间的角度越大，漫反射分量就会越小：

```c++ nums
float diff = max(dot(norm, lightDir), 0.0);
vec3 diffuse = diff * lightColor;
```

**如果两个向量之间的角度大于90度，点乘的结果就会变成负数，这样会导致漫反射分量变为负数。为此，我们使用max函数返回两个参数之间较大的参数，从而保证漫反射分量不会变成负数。**负数颜色的光照是没有定义的，所以最好避免它，除非你是那种古怪的艺术家。

现在我们有了环境光分量和漫反射分量，我们把它们相加，然后把结果乘以物体的颜色，来获得片段最后的输出颜色。

```c++ nums
vec3 result = (ambient + diffuse) * objectColor;
FragColor = vec4(result, 1.0);
```

如果你的应用(和着色器)编译成功了，你可能看到类似的输出：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/2.1.basic_lighting_diffuse/basic_lighting_diffuse.cpp)

![[basic_lighting_diffuse.png|img]]

#### 	不等比缩放与法线矩阵

现在我们已经把法向量从顶点着色器传到了片元着色器。可是，目前片元着色器里的计算都是在世界空间坐标中进行的。所以，**我们是不是应该把法向量也转换为世界空间坐标？基本正确，但是这不是简单地把它乘以一个模型矩阵就能搞定的。**

首先，法向量只是一个方向向量，不能表达空间中的特定位置。同时，法向量没有齐次坐标（顶点位置中的w分量）。这意味着，位移不应该影响到法向量。因此，**如果我们打算把法向量乘以一个模型矩阵，我们就要从矩阵中移除位移部分，只选用模型矩阵左上角3×3的矩阵（注意，我们也可以把法向量的w分量设置为0，再乘以4×4矩阵；这同样可以移除位移）。对于法向量，我们只希望对它实施缩放和旋转变换。**

其次，**如果模型矩阵执行了不等比缩放，顶点的改变会导致法向量不再垂直于表面了。因此，我们不能用这样的模型矩阵来变换法向量。**下面的图展示了应用了不等比缩放的模型矩阵对法向量的影响：

![[basic_lighting_normal_transformation 1.png|img]]

每当我们应用一个不等比缩放时（注意：等比缩放不会破坏法线，因为法线的方向没被改变，仅仅改变了法线的长度，而这很容易通过标准化来修复），法向量就不会再垂直于对应的表面了，这样光照就会被破坏。

修复这个行为的诀窍是使用一个为法向量专门定制的模型矩阵。这个矩阵称之为**法线矩阵(Normal Matrix)，它使用了一些线性代数的操作来移除对法向量错误缩放的影响。**如果你想知道这个矩阵是如何计算出来的，建议去阅读这个[文章](http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/)。

**法线矩阵**被定义为**「模型矩阵左上角3x3部分的逆矩阵的转置矩阵」**。真是拗口，如果你不明白这是什么意思，别担心，我们还没有讨论逆矩阵(Inverse Matrix)和转置矩阵(Transpose Matrix)。注意，大部分的资源都会将法线矩阵定义为应用到模型-观察矩阵(Model-view Matrix)上的操作，但是由于我们只在世界空间中进行操作（不是在观察空间），我们只使用模型矩阵。

在顶点着色器中，我们可以使用`inverse`和`transpose`函数自己生成这个法线矩阵，这两个函数对所有类型矩阵都有效。注意我们还要把被处理过的矩阵强制转换为3×3矩阵，来保证它失去了位移属性以及能够乘以`vec3`的法向量。

```c++ nums
Normal = mat3(transpose(inverse(model))) * aNormal;
```

> 矩阵求逆是一项对于着色器开销很大的运算，因为它必须在场景中的每一个顶点上进行，所以**应该尽可能地避免在着色器中进行求逆运算**。以学习为目的的话这样做还好，但是对于一个高效的应用来说，你最好先在CPU上计算出法线矩阵，再通过uniform把它传递给着色器（就像模型矩阵一样）。

在漫反射光照部分，光照表现并没有问题，这是因为我们没有对物体进行任何缩放操作，所以我们并不真的需要使用一个法线矩阵，而是仅以模型矩阵乘以法线就可以。但是**如果你会进行不等比缩放，使用法线矩阵去乘以法向量就是必须的了。**

### 高光反射

和漫反射光照一样，镜面光照(Specular Highlight)也决定于光的方向向量和物体的法向量，但是它也决定于观察方向，例如玩家是从什么方向看向这个片段的。镜面光照决定于表面的反射特性。如果我们把物体表面设想为一面镜子，那么镜面光照最强的地方就是我们看到表面上反射光的地方。你可以在下图中看到效果：

![[basic_lighting_specular_theory.png|img]]

**我们通过根据法向量翻折入射光的方向来计算反射向量。然后我们计算反射向量与观察方向的角度差，它们之间夹角越小，镜面光的作用就越大。**由此产生的效果就是，我们看向在入射光在表面的反射方向时，会看到一点高光。

**观察向量是我们计算镜面光照时需要的一个额外变量，我们可以使用观察者的世界空间位置和片段的位置来计算它。**之后我们计算出镜面光照强度，用它乘以光源的颜色，并将它与环境光照和漫反射光照部分加和。



（1）要得到**观察者的世界空间坐标，我们直接使用摄像机的位置向量即可（它当然就是那个观察者）。**那么让我们把另一个uniform添加到片元着色器中，并把摄像机的位置向量传给着色器：

```c++ nums
uniform vec3 viewPos;
```

```c++ nums
lightingShader.setVec3("viewPos", camera.Position);
```

（2）现在我们已经获得所有需要的变量，可以计算高光强度了。首先，我们定义一个**镜面强度(Specular Intensity)变量，给镜面高光一个中等亮度颜色**，让它不要产生过度的影响。

```les
float specularStrength = 0.5;
```

如果我们把它设置为1.0f，我们会得到一个非常亮的镜面光分量，这对于一个珊瑚色的立方体来说有点太多了。下一节教程中我们会讨论如何合理设置这些光照强度，以及它们是如何影响物体的。

（3）下一步，我们**计算视线方向向量（顶点指向观察者），和对应的沿着法线轴的反射向量：**

```c++ nums
vec3 viewDir = normalize(viewPos - FragPos);
vec3 reflectDir = reflect(-lightDir, norm);
```

**需要注意的是我们对`lightDir`向量进行了取反。`reflect`函数要求第一个向量是从光源指向片段位置的向量.**但是`lightDir`当前正好相反，是从片段**指向**光源（由先前我们在片元着色器中计算`lightDir`向量时，减法的顺序决定）。

第二个参数要求是一个法向量，所以我们提供的是已标准化的`norm`向量。

> **reflect函数：通过给定的入射光线与法向量求取反射向量**
>
> ![[v2-2dbc0e75189c8f9f3a549119939a8723_1440w 1.jpg|img]]

剩下要做的是计算镜面分量。下面的代码完成了这件事：

```c++ nums
float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
vec3 specular = specularStrength * spec * lightColor;
```

我们先计算视线方向与反射方向的点乘（并确保它不是负值），然后取它的32次幂。这个**32是高光的反光度(Shininess)。一个物体的反光度越高，反射光的能力越强，散射得越少，高光点就会越小。**在下面的图片里，你会看到不同反光度的视觉效果影响：

![[basic_lighting_specular_shininess 1.png|img]]

我们不希望镜面成分过于显眼，所以我们把指数保持为32。剩下的最后一件事情是把它加到环境光分量和漫反射分量里，再用结果乘以物体的颜色：

```c++ nums
vec3 result = (ambient + diffuse + specular) * objectColor;
FragColor = vec4(result, 1.0);
```

我们现在为冯氏光照计算了全部的光照分量。根据你的视角，你可以看到类似下面的画面：[世界空间计算光照](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/2.2.basic_lighting_specular/basic_lighting_specular.cpp)

![[basic_lighting_specular.png|img]]

> 在光照着色器的早期，开发者曾经在顶点着色器中实现冯氏光照模型。在顶点着色器中做光照的优势是，相比片段来说，顶点要少得多，因此会更高效，所以（开销大的）光照计算频率会更低。然而，顶点着色器中的最终颜色值是仅仅只是那个顶点的颜色值，片段的颜色值是由插值光照颜色所得来的。结果就是这种光照看起来不会非常真实，除非使用了大量顶点。
>
> ![[basic_lighting_gouruad.png|img]]
>
> 在顶点着色器中实现的冯氏光照模型叫做Gouraud着色(Gouraud Shading)，而不是冯氏着色(Phong Shading)。记住，由于插值，这种光照看起来有点逊色。冯氏着色能产生更平滑的光照效果。[Gouraud代码](https://learnopengl.com/code_viewer.php?code=lighting/basic_lighting-exercise3)。

#### 代码（观察空间计算光照）

我们选择在世界空间进行光照计算，但是大多数人趋向于更偏向在观察空间进行光照计算。**在观察空间计算的优势是，观察者的位置总是在(0, 0, 0)，所以你已经零成本地拿到了观察者的位置。**然而，若以学习为目的，我认为在世界空间中计算光照更符合直觉。如果你仍然希望在观察空间计算光照的话，你需要将所有相关的向量也用观察矩阵进行变换（不要忘记也修改法线矩阵）。

```c++ nums
//顶点着色器
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 FragPos;
out vec3 Normal;
out vec3 LightPos;

//我们现在在顶点着色器中定义uniform，并将“观察空间”lightpos传递给片元着色器。lightPos目前在世界空间中。
uniform vec3 lightPos; 

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
	FragPos = vec3(view * model * vec4(aPos,1.0));
	Normal = mat3(transpose(inverse(view * model))) * aNormal;
	//将世界空间光位置转换为观察空间光位置
	LightPos = vec3(view * vec4(lightPos,1.0)); 

	gl_Position = projection * view * model * vec4(aPos, 1.0);
}

//片元着色器
#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
////额外的变量，因为我们需要在观察空间中的光位置，我们在顶点着色器中计算这个
in vec3 LightPos;

uniform vec3 objectColor;
uniform vec3 lightColor;


void main()
{
	//ambient
	float ambientStrength = 0.5f;
	vec3 ambient = ambientStrength * lightColor;

	//diffuse
	vec3 norm = normalize(Normal);
	vec3 lightDir = normalize(LightPos - FragPos);
	float diff = max(dot(norm, lightDir),0.0);
	vec3 diffuse = diff * lightColor;

	//specular
	float specularStrength = 0.5;	//镜面强度
	vec3 viewDir = normalize(-FragPos); //在观察空间中，观察者在（0，0，0），so viewDir is (0,0,0) - Position => -Position
	vec3 reflectDir = reflect(-lightDir,norm);
	float spec = pow(max(dot(viewDir,reflectDir),0.0),32);
	vec3 specular = specularStrength * spec * lightColor;

	vec3 result = (ambient + diffuse + specular) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

## 材质

在现实世界里，每个物体会对光产生不同的反应。比如，钢制物体看起来通常会比陶土花瓶更闪闪发光，一个木头箱子也不会与一个钢制箱子反射同样程度的光。有些物体反射光的时候不会有太多的散射(Scatter)，因而产生较小的高光点，而有些物体则会散射很多，产生一个有着更大半径的高光点。如果我们想要在OpenGL中模拟多种类型的物体，我们必须针对每种表面定义不同的材质(Material)属性。

在上一节中，我们定义了一个物体和光的颜色，并结合环境光与镜面强度分量，来决定物体的视觉输出。当描述一个表面时，我们可以分别为三个光照分量定义一个材质颜色(Material Color)：环境光照(Ambient Lighting)、漫反射光照(Diffuse Lighting)和镜面光照(Specular Lighting)。通过为每个分量指定一个颜色，我们就能够对表面的颜色输出有细粒度的控制了。现在，我们再**添加一个反光度(Shininess)分量**，结合上述的三个颜色，我们就有了全部所需的材质属性了：

```c++ nums
#version 330 core
struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
}; 

uniform Material material;
```

**在片元着色器中，我们创建一个结构体(Struct)来储存物体的材质属性。我们也可以把它们储存为独立的uniform值，但是作为一个结构体来储存会更有条理一些。我们首先定义结构体的布局(Layout)，然后简单地以刚创建的结构体作为类型声明一个uniform变量。**

如你所见，我们为冯氏光照模型的每个分量都定义一个颜色向量。ambient材质向量定义了在环境光照下这个表面反射的是什么颜色，通常与表面的颜色相同。diffuse材质向量定义了在漫反射光照下表面的颜色。漫反射颜色（和环境光照一样）也被设置为我们期望的物体颜色。specular材质向量设置的是表面上镜面高光的颜色（或者甚至可能反映一个特定表面的颜色）。最后，**shininess影响镜面高光的散射/半径。**

有这4个元素定义一个物体的材质，我们能够模拟很多现实世界中的材质。[OpenGL材质属性表](http://devernay.free.fr/cours/opengl/materials.html)中的一个表格展示了一系列材质属性，它们模拟了现实世界中的真实材质。下图展示了几组现实世界的材质参数值对我们的立方体的影响：

![[materials_real_world.png|img]]

可以看到，通过正确地指定一个物体的材质属性，我们对这个物体的感知也就不同了。效果非常明显，但是要想获得更真实的效果，我们需要以更复杂的形状替换这个立方体。在[模型加载](https://learnopengl-cn.github.io/03 Model Loading/01 Assimp/)章节中，我们会讨论更复杂的形状。

搞清楚一个物体正确的材质设定是个困难的工程，这主要需要实验和丰富的经验。用了不合适的材质而毁了物体的视觉质量是件经常发生的事。

让我们试着在着色器中实现这样的一个材质系统。

### 设置材质

我们在片元着色器中创建了一个材质结构体的uniform，所以下面我们希望修改一下光照的计算来遵从新的材质属性。由于所有材质变量都储存在一个结构体中，我们可以从uniform变量material中访问它们：

```c++ nums
void main()
{    
    // 环境光
    vec3 ambient = lightColor * material.ambient;

    // 漫反射 
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = lightColor * (diff * material.diffuse);

    // 镜面光
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = lightColor * (spec * material.specular);  

    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}
```

可以看到，我们现在在需要的地方访问了材质结构体中的所有属性，并且这次是根据材质的颜色来计算最终的输出颜色的。**物体的每个材质属性都乘上了它们各自对应的光照分量。**

我们现在可以通过设置适当的uniform来设置应用中物体的材质了。GLSL中一个结构体在设置uniform时并无任何区别，结构体只是充当uniform变量们的一个命名空间。所以如果想填充这个结构体的话，我们必须设置每个单独的uniform，但要以结构体名为前缀：

```c++ nums
lightingShader.setVec3("material.ambient",  1.0f, 0.5f, 0.31f);
lightingShader.setVec3("material.diffuse",  1.0f, 0.5f, 0.31f);
lightingShader.setVec3("material.specular", 0.5f, 0.5f, 0.5f);
lightingShader.setFloat("material.shininess", 32.0f);
```

我们将环境光和漫反射分量设置成我们想要让物体所拥有的颜色，而将镜面分量设置为一个中等亮度的颜色，我们不希望镜面分量过于强烈。我们仍将反光度保持为32。

现在我们能够轻松地在应用中影响物体的材质了。运行程序，你会得到像这样的结果：

![[materials_with_material.png|img]]

不过看起来真的不太对劲？

### 光的属性

这个物体太亮了。**物体过亮的原因是环境光、漫反射和镜面光这三个颜色对任何一个光源都全力反射。**光源对环境光、漫反射和镜面光分量也分别具有不同的强度。前面的章节中，我们通过使用一个强度值改变环境光和镜面光强度的方式解决了这个问题。我们想做类似的事情，但是这次是要为每个光照分量分别指定一个强度向量。如果我们假设lightColor是`vec3(1.0)`，代码会看起来像这样：

```c++ nums
vec3 ambient  = vec3(1.0) * material.ambient;
vec3 diffuse  = vec3(1.0) * (diff * material.diffuse);
vec3 specular = vec3(1.0) * (spec * material.specular);
```

所以物体的每个材质属性对每一个光照分量都返回了最大的强度。对单个光源来说，这些`vec3(1.0)`值同样可以对每种光源分别改变，而这通常就是我们想要的。现在，物体的环境光分量完全地影响了立方体的颜色，可是环境光分量实际上不应该对最终的颜色有这么大的影响，所以我们会将光源的环境光强度设置为一个小一点的值，从而限制环境光颜色：

```c++ nums
vec3 ambient = vec3(0.1) * material.ambient;
```

我们可以用同样的方式影响光源的漫反射和镜面光强度。这和我们在[上一节](https://learnopengl-cn.github.io/02 Lighting/02 Basic Lighting/)中所做的极为相似，你可以认为我们已经创建了一些光照属性来影响各个光照分量。我们希望**为光照属性创建类似材质结构体的东西：**

```c++ nums
struct Light {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Light light;
```

**一个光源对它的ambient、diffuse和specular光照分量有着不同的强度。环境光照通常被设置为一个比较低的强度**，因为我们不希望环境光颜色太过主导。**光源的漫反射分量通常被设置为我们希望光所具有的那个颜色，通常是一个比较明亮的白色。镜面光分量通常会保持为`vec3(1.0)`，以最大强度发光。**

**注意我们也将光源的位置向量加入了结构体。**

和材质uniform一样，我们需要更新片元着色器：

```c++ nums
vec3 ambient  = light.ambient * material.ambient;
vec3 diffuse  = light.diffuse * (diff * material.diffuse);
vec3 specular = light.specular * (spec * material.specular);
```

我们接下来在应用中设置光照强度：

```c++ nums
lightingShader.setVec3("light.ambient",  0.2f, 0.2f, 0.2f);
lightingShader.setVec3("light.diffuse",  0.5f, 0.5f, 0.5f); // 将光照调暗了一些以搭配场景
lightingShader.setVec3("light.specular", 1.0f, 1.0f, 1.0f); 
```

现在我们已经调整了光照对物体材质的影响，我们得到了一个与上一节很相似的视觉效果。但这次我们有了对光照和物体材质的完全掌控：

![[materials_light.png|img]]

### 不同的光源颜色

到目前为止，我们都只对光源设置了从白到灰到黑范围内的颜色，这样只会改变物体各个分量的强度，而不是它的真正颜色。由于现在能够非常容易地访问光照的属性了，我们可以随着时间改变它们的颜色，从而获得一些非常有意思的效果。由于所有的东西都在片元着色器中配置好了，修改光源的颜色非常简单，并立刻创造一些很有趣的效果：[效果展示](https://learnopengl-cn.github.io/img/02/03/materials.mp4)

你可以看到，不同的光照颜色能够极大地影响物体的最终颜色输出。由于光照颜色能够直接影响物体能够反射的颜色（回想[颜色](https://learnopengl-cn.github.io/02 Lighting/01 Colors/)这一节），这对视觉输出有着显著的影响。

我们可以利用sin和`glfwGetTime`函数改变光源的环境光和漫反射颜色，从而很容易地让光源的颜色随着时间变化：

```c++ nums
glm::vec3 lightColor;
lightColor.x = sin(glfwGetTime() * 2.0f);
lightColor.y = sin(glfwGetTime() * 0.7f);
lightColor.z = sin(glfwGetTime() * 1.3f);

glm::vec3 diffuseColor = lightColor   * glm::vec3(0.5f); // 降低影响
glm::vec3 ambientColor = diffuseColor * glm::vec3(0.2f); // 很低的影响

lightingShader.setVec3("light.ambient", ambientColor);
lightingShader.setVec3("light.diffuse", diffuseColor);
```

### 光照贴图

在[上一节](https://learnopengl-cn.github.io/02 Lighting/03 Materials/)中，我们讨论了让每个物体都拥有自己独特的材质从而对光照做出不同的反应的方法。这样子能够很容易在一个光照的场景中给每个物体一个独特的外观，但是这仍不能对一个物体的视觉输出提供足够多的灵活性。

在上一节中，我们将整个物体的材质定义为一个整体，但现实世界中的物体通常并不只包含有一种材质，而是由多种材质所组成。想想一辆汽车：它的外壳非常有光泽，车窗会部分反射周围的环境，轮胎不会那么有光泽，所以它没有镜面高光，轮毂非常闪亮（如果你洗车了的话）。汽车同样会有漫反射和环境光颜色，它们在整个物体上也不会是一样的，汽车有着许多种不同的环境光/漫反射颜色。总之，这样的物体**在不同的部件上都有不同的材质属性**。

所以，上一节中的那个材质系统是肯定不够的，它只是一个最简单的模型，所以我们需要拓展之前的系统，引入**漫反射**和**镜面光贴图(Map)**。**这允许我们对物体的漫反射分量（以及间接地对环境光分量，它们几乎总是一样的）和镜面光分量有着更精确的控制。**

#### 漫反射贴图

**我们希望通过某种方式对物体的每个片段单独设置漫反射颜色。**有能够让我们根据片段在物体上的位置来获取颜色值的系统吗？

这可能听起来很熟悉，而且事实上这个系统我们已经使用很长时间了。这听起来很像在[之前](https://learnopengl-cn.github.io/01 Getting started/06 Textures/)教程中详细讨论过的**纹理**，而这基本就是这样：一个纹理。我们仅仅是对同样的原理使用了不同的名字：**其实都是使用一张覆盖物体的图像，让我们能够逐片段索引其独立的颜色值。**在光照场景中，它通常叫做一个**漫反射贴图(Diffuse Map)**（3D艺术家通常都这么叫它），**它是一个表现了物体所有的漫反射颜色的纹理图像。**

为了演示漫反射贴图，我们将会使用[下面的图片](https://learnopengl-cn.github.io/img/02/04/container2.png)，它是一个有钢边框的木箱：

![[container2.png|img]]

在着色器中使用漫反射贴图的方法和纹理教程中是完全一样的。但这次我们会**将纹理储存为Material结构体中的一个`sampler2D`**。我们**将之前定义的`vec3`漫反射颜色向量替换为漫反射贴图。**

> 注意`sampler2D`是所谓的**不透明类型(Opaque Type)**，也就是说我们**不能将它实例化，只能通过uniform来定义它。**如果我们使用除uniform以外的方法（比如函数的参数）实例化这个结构体，GLSL会抛出一些奇怪的错误。**这同样也适用于任何封装了不透明类型的结构体。**

我们也**移除了环境光材质颜色向量**，因为**环境光颜色在几乎所有情况下都等于漫反射颜色，所以我们不需要将它们分开储存：**

```c++ nums
struct Material {
    sampler2D diffuse;
    vec3      specular;
    float     shininess;
}; 
...
in vec2 TexCoords;
```

> 如果你非常固执，仍想将环境光颜色设置为一个（漫反射值之外）不同的值，你也可以保留这个环境光的`vec3`，但整个物体仍只能拥有一个环境光颜色。如果想要对不同片段有不同的环境光值，你需要对环境光值单独使用另外一个纹理。

注意我们将在片元着色器中再次需要纹理坐标，所以我们声明一个额外的输入变量。接下来我们只需要**从纹理中采样片段的漫反射颜色值**即可：

```c++ nums
vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));
```

不要忘记将环境光的材质颜色设置为漫反射材质颜色同样的值。

```c++ nums
vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));
```

这就是使用漫反射贴图的全部步骤了。你可以看到，这并不是什么新的东西，但这能够极大地提高视觉品质。**为了让它正常工作，我们还需要使用纹理坐标更新顶点数据，将它们作为顶点属性传递到片元着色器，加载材质并绑定材质到合适的纹理单元。**

更新后的顶点数据可以在[这里](https://learnopengl.com/code_viewer.php?code=lighting/vertex_data_textures)找到。**顶点数据现在包含了顶点位置、法向量和立方体顶点处的纹理坐标。**让我们更新顶点着色器来以顶点属性的形式接受纹理坐标，并将它们传递到片元着色器中：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;
...
out vec2 TexCoords;

void main()
{
    ...
    TexCoords = aTexCoords;
}
```

记得去更新两个VAO的顶点属性指针来匹配新的顶点数据，并加载箱子图像为一个纹理。在绘制箱子之前，我们希望将要用的纹理单元赋值到`material.diffuse`这个uniform采样器，并绑定箱子的纹理到这个纹理单元：

```c++ nums
lightingShader.setInt("material.diffuse", 0);
...
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, diffuseMap);
```

使用了漫反射贴图之后，细节再一次得到惊人的提升，这次箱子有了光照开始闪闪发光（字面意思也是）了。你的箱子看起来可能像这样：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/4.1.lighting_maps_diffuse_map/lighting_maps_diffuse.cpp)

![[materials_diffuse_map.png|img]]

#### 高光反射贴图

你可能会注意到，镜面高光看起来有些奇怪，因为我们的物体大部分都是木头，我们知道木头不应该有这么强的镜面高光的。我们可以将物体的镜面光材质设置为`vec3(0.0)`来解决这个问题，但这也意味着箱子钢制的边框将不再能够显示镜面高光了，我们知道钢铁**应该**是有一些镜面高光的。所以，我们想要**让物体的某些部分以不同的强度显示镜面高光**。这个问题看起来和漫反射贴图非常相似。是巧合吗？我想不是。

我们同样可以使用一个专门用于镜面高光的纹理贴图。这也就意味着我们需要生成一个黑白的（如果你想得话也可以是彩色的）纹理，来定义物体每部分的镜面光强度。下面是一个[镜面光贴图](https://learnopengl-cn.github.io/img/02/04/container2_specular.png)(Specular Map)的例子：

![[container2_specular.png|img]]

镜面高光的强度可以通过图像每个像素的亮度来获取。镜面光贴图上的每个像素都可以由一个颜色向量来表示，比如说黑色代表颜色向量`vec3(0.0)`，灰色代表颜色向量`vec3(0.5)`。**在片元着色器中，我们接下来会取样对应的颜色值并将它乘以光源的镜面强度。一个像素越「白」，乘积就会越大，物体的镜面光分量就会越亮。**

由于箱子大部分都由木头所组成，而且木头材质应该没有镜面高光，所以漫反射纹理的整个木头部分全部都转换成了黑色。箱子钢制边框的镜面光强度是有细微变化的，钢铁本身会比较容易受到镜面高光的影响，而裂缝则不会。

> 从实际角度来说，木头其实也有镜面高光，尽管它的反光度(Shininess)很小（更多的光被散射），影响也比较小，但是为了教学目的，我们可以假设木头不会对镜面光有任何反应。

使用**Photoshop**或**Gimp**之类的工具，将漫反射纹理转换为镜面光纹理还是比较容易的，只需要剪切掉一些部分，将图像转换为黑白的，并增加亮度/对比度就好了。



**采样高光贴图**

镜面光贴图和其它的纹理非常类似，所以代码也和漫反射贴图的代码很类似。记得要保证正确地加载图像并生成一个纹理对象。由于我们正在同一个片元着色器中使用另一个纹理采样器，我们必须要对镜面光贴图**使用一个不同的纹理单元**（见[纹理](https://learnopengl-cn.github.io/01 Getting started/06 Textures/)），所以我们在渲染之前先把它绑定到合适的纹理单元上：

```c++ nums
lightingShader.setInt("material.specular", 1);
...
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, specularMap);
```

接下来更新片元着色器的材质属性，让其接受一个`sampler2D`而不是`vec3`作为镜面光分量：

```c++ nums
struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float     shininess;
};
```

最后我们希望采样镜面光贴图，来获取片段所对应的镜面光强度：

```c++ nums
vec3 ambient  = light.ambient  * vec3(texture(material.diffuse, TexCoords));
vec3 diffuse  = light.diffuse  * diff * vec3(texture(material.diffuse, TexCoords));  
vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
FragColor = vec4(ambient + diffuse + specular, 1.0);
```

通过使用镜面光贴图我们可以可以对物体设置大量的细节，比如物体的哪些部分需要有**闪闪发光**的属性，我们甚至可以设置它们对应的强度。镜面光贴图能够在漫反射贴图之上给予我们更高一层的控制。

> 如果你想另辟蹊径，你也可以在镜面光贴图中使用真正的颜色，不仅设置每个片段的镜面光强度，还设置了镜面高光的颜色。从现实角度来说，镜面高光的颜色大部分（甚至全部）都是由光源本身所决定的，所以这样并不能生成非常真实的视觉效果（这也是为什么图像通常是黑白的，我们只关心强度）。

如果你现在运行程序的话，你可以清楚地看到箱子的材质现在和真实的钢制边框箱子非常类似了：

![[materials_specular_map.png|img]]

通过使用漫反射和镜面光贴图，我们可以给相对简单的物体添加大量的细节。我们甚至可以使用法线/凹凸贴图(Normal/Bump Map)或者反射贴图(Reflection Map)给物体添加更多的细节，但这些将会留到之后的教程中。把你的箱子给你的朋友或者家人看看，并且坚信我们的箱子有一天会比现在更加漂亮！

#### 代码

##### 添加漫反射和高光贴图

```c++ nums
//顶点着色器
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;

out vec2 TexCoords;
out vec3 FragPos;
out vec3 Normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = mat3(transpose(inverse(model))) * aNormal;  
    TexCoords = aTexCoords;
    gl_Position = projection * view * vec4(FragPos, 1.0);
}

//片元着色器
#version 330 core
out vec4 FragColor;

struct Material
{
	sampler2D diffuse;
	sampler2D specular;
	float shininess;
};

struct Light
{
	vec3 position;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

in vec3 Normal;  
in vec3 FragPos;  
in vec2 TexCoords;

uniform Material material;
uniform Light light;
uniform vec3 viewPos; 

void main()
{
    // ambient
    vec3 ambient = texture(material.diffuse, TexCoords).rgb * light.ambient;
  	
    // diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * texture(material.diffuse, TexCoords).rgb * light.diffuse;
    
    // specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = (texture(material.specular,TexCoords).rgb * spec) * light.specular;  
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
} 

//主函数
int main()
{
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGL", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetCursorPosCallback(window, mouse_callback); 
    glfwSetScrollCallback(window, scroll_callback);
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }
    glEnable(GL_DEPTH_TEST);

    Shader modelShader("vertexShader.vert", "fragmentShader.frag");
    Shader lightShader("lightvertexShader.vert", "lightfragmentShader.frag");
  
    float vertices[] = {
        // positions          // normals           // diffuseMap coords
        -0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  0.0f, 0.0f,
         0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  1.0f, 0.0f,
         0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  1.0f, 1.0f,
         0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  1.0f, 1.0f,
        -0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  0.0f, 1.0f,
        -0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,  0.0f, 0.0f,

        -0.5f, -0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   0.0f, 0.0f,
         0.5f, -0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   1.0f, 0.0f,
         0.5f,  0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   1.0f, 1.0f,
         0.5f,  0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   1.0f, 1.0f,
        -0.5f,  0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   0.0f, 1.0f,
        -0.5f, -0.5f,  0.5f,  0.0f,  0.0f, 1.0f,   0.0f, 0.0f,

        -0.5f,  0.5f,  0.5f, -1.0f,  0.0f,  0.0f,  1.0f, 0.0f,
        -0.5f,  0.5f, -0.5f, -1.0f,  0.0f,  0.0f,  1.0f, 1.0f,
        -0.5f, -0.5f, -0.5f, -1.0f,  0.0f,  0.0f,  0.0f, 1.0f,
        -0.5f, -0.5f, -0.5f, -1.0f,  0.0f,  0.0f,  0.0f, 1.0f,
        -0.5f, -0.5f,  0.5f, -1.0f,  0.0f,  0.0f,  0.0f, 0.0f,
        -0.5f,  0.5f,  0.5f, -1.0f,  0.0f,  0.0f,  1.0f, 0.0f,

         0.5f,  0.5f,  0.5f,  1.0f,  0.0f,  0.0f,  1.0f, 0.0f,
         0.5f,  0.5f, -0.5f,  1.0f,  0.0f,  0.0f,  1.0f, 1.0f,
         0.5f, -0.5f, -0.5f,  1.0f,  0.0f,  0.0f,  0.0f, 1.0f,
         0.5f, -0.5f, -0.5f,  1.0f,  0.0f,  0.0f,  0.0f, 1.0f,
         0.5f, -0.5f,  0.5f,  1.0f,  0.0f,  0.0f,  0.0f, 0.0f,
         0.5f,  0.5f,  0.5f,  1.0f,  0.0f,  0.0f,  1.0f, 0.0f,

        -0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,  0.0f, 1.0f,
         0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,  1.0f, 1.0f,
         0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,  1.0f, 0.0f,
         0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,  1.0f, 0.0f,
        -0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,  0.0f, 0.0f,
        -0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,  0.0f, 1.0f,

        -0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f,  0.0f, 1.0f,
         0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f,  1.0f, 1.0f,
         0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,  1.0f, 0.0f,
         0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,  1.0f, 0.0f,
        -0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,  0.0f, 0.0f,
        -0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f,  0.0f, 1.0f
    };

   //第一，配置模型的VAO和VBO
    unsigned int VBO, VAO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
 
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glBindVertexArray(VAO);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3*sizeof(float)));
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
    glEnableVertexAttribArray(2);
                   
                                                                      // 第二，配置灯的VAO (VBO保持不变;光源和模型的顶点是相同的，这也是一个3D立方体)
    unsigned int lightVAO;
    glGenVertexArrays(1, &lightVAO);
    glBindVertexArray(lightVAO);

    //我们只需要绑定到VBO(链接它与glVertexAttribPointer)，不需要填充它;VBO的数据已经包含了我们所需要的一切(它已经被绑定了，但我们为了教育目的再做一次)
    glBindBuffer(GL_ARRAY_BUFFER, VBO);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    
    //加载贴图
    unsigned int diffuseMap = loadTexture("texture/container2.png");
    unsigned int specularMap = loadTexture("texture/specular.png");
    modelShader.use(); //在设置uniform变量前要激活着色器程序
    modelShader.setInt("material.diffuse", 0); 
    modelShader.setInt("material.specular", 1);

    // render loop
    while (!glfwWindowShouldClose(window))
    {
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        processInput(window);
        
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      
        modelShader.use();
        //计算漫反射光照：光源位置
        lightPos.x =  1.0f * sin(glfwGetTime() * 2.0f);
        lightPos.y = 1.0f * cos(glfwGetTime() * 2.0f);
        modelShader.setVec3("light.position", lightPos);
        //计算高光反照：观察者坐标
        modelShader.setVec3("viewPos", camera.Position);

        //灯参数
        modelShader.setVec3("light.ambient", 0.2f, 0.2f, 0.2f);
        modelShader.setVec3("light.diffuse", 0.5f, 0.5f, 0.5f); 
        modelShader.setVec3("light.specular", 1.0f, 1.0f, 1.0f);

        //设置材质
        modelShader.setFloat("material.shininess", 64.0f);

        //模型矩阵
        glm::mat4 model;
        modelShader.setMat4("model", model);
        //观察矩阵
        glm::mat4 view = camera.GetViewMatrix();
        modelShader.setMat4("view", view);
        //投影矩阵
        glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
        modelShader.setMat4("projection", projection);
       
        //绑定漫反射贴图
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, diffuseMap);
        //绑定高光贴图
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, specularMap);

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);
       
        //绘制灯对象
        lightShader.use();
        lightShader.setMat4("projection", projection);
        lightShader.setMat4("view", view);
        model = glm::translate(model, lightPos);
        model = glm::scale(model, glm::vec3(0.2f));
        lightShader.setMat4("model", model);
     
        glBindVertexArray(lightVAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteVertexArrays(1, &lightVAO);
    glDeleteBuffers(1, &VBO);
  
    glfwTerminate();
    return 0;
}

//纹理加载函数
unsigned int loadTexture(const char* path)
{
    //纹理
    unsigned int textureID;
    glGenTextures(1, &textureID);

    int width, height, nrChannels;
    unsigned char* data = stbi_load(path, &width, &height, &nrChannels, 0);  //获取图像的宽度、高度、颜色通道个数
  
    if (data)
    {
        //GLenum: 用于GL枚举的无符号整型。
        GLenum format;
        if (nrChannels == 1)
            format = GL_RED;
        else if (nrChannels == 3)
            format = GL_RGB;
        else if (nrChannels == 4)
             format = GL_RGBA;

        glBindTexture(GL_TEXTURE_2D, textureID);
        glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);   //由图像数据生成纹理
        glGenerateMipmap(GL_TEXTURE_2D);	//生成多级渐远纹理

        //为当前绑定的纹理对象设置纹理环绕方式
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
        //设置过滤方式
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    }
    else
    {
        std::cout << "Failed to load diffuseMap" << std::endl;
    }
    stbi_image_free(data);	//释放图像内存

    return textureID;
}
```

##### 放射光贴图

**放射光贴图(Emission Map)，它是一个储存了每个片段的发光值(Emission Value)的贴图。**发光值是一个包含（假设）光源的物体发光(Emit)时可能显现的颜色，这样的话物体就能够忽略光照条件进行发光(Glow)。游戏中某个物体在发光的时候，你通常看到的就是放射光贴图（比如 [机器人的眼](https://learnopengl-cn.github.io/img/02/04/shaders_enemy.jpg)，或是[箱子上的灯带](https://learnopengl-cn.github.io/img/02/04/emissive.png)）。将[这个](https://learnopengl-cn.github.io/img/02/04/matrix.jpg)纹理（作者为 creativesam）作为放射光贴图添加到箱子上，产生这些字母都在发光的效果：[参考解答](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/4.3.lighting_maps_exercise4/lighting_maps_exercise4.cpp)，[最终效果](https://learnopengl-cn.github.io/img/02/04/lighting_maps_exercise4.png)

![[lighting_maps_exercise4.png|img]]

```c++ nums
//正常读取贴图，在片元着色器中添加相应uniform，并添加以下代码：

 // emission
    vec3 emission = texture(material.emission, TexCoords).rgb;
        
    vec3 result = ambient + diffuse + specular + emission;

```

### 投光物

我们目前使用的光照都来自于空间中的一个点。它能给我们不错的效果，但现实世界中，我们有很多种类的光照，每种的表现都不同。**将光投射(Cast)到物体的光源叫做投光物(Light Caster)。**在这一节中，我们将会讨论几种不同类型的投光物。学会**模拟不同种类的光源**是又一个能够进一步丰富场景的工具。

我们首先将会讨论定向光(Directional Light)，接下来是点光源(Point Light)，它是我们之前学习的光源的拓展，最后我们将会讨论聚光(Spotlight)。在[下一节](https://learnopengl-cn.github.io/02 Lighting/06 Multiple lights/)中我们将讨论如何将这些不同种类的光照类型整合到一个场景之中。

#### 定向光

当一个光源处于很远的地方时，来自光源的每条光线就会近似于互相平行。不论物体和/或者观察者的位置，看起来好像所有的光都来自于同一个方向。**当我们使用一个假设光源处于无限远处的模型时，它就被称为定向光，因为它的所有光线都有着相同的方向，它与光源的位置是没有关系的。**

定向光非常好的一个例子就是**太阳**。太阳距离我们并不是无限远，但它已经远到在光照计算中可以把它视为无限远了。所以来自太阳的所有光线将被模拟为平行光线，我们可以在下图看到：

![[light_casters_directional.png|img]]

因为所有的光线都是平行的，所以物体与光源的相对位置是不重要的，因为对场景中每一个物体光的方向都是一致的。由于光的位置向量保持一致，场景中每个物体的光照计算将会是类似的。

**我们可以定义一个光线方向向量而不是位置向量来模拟一个定向光。**着色器的计算基本保持不变，但这次我们将**直接使用光的direction向量而不是通过position来计算lightDir向量。**

```c++ nums
struct Light {
    // vec3 position; // 使用定向光就不再需要了
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};
...
void main()
{
  vec3 lightDir = normalize(-light.direction);
  ...
}
```

注意我们首先对light.direction向量取反。我们目前使用的光照计算需求一个**从片段至光源的光线方向**，但人们更习惯定义定向光为一个**从**光源出发的全局方向。所以我们需要对全局光照方向向量取反来改变它的方向，它现在是一个指向光源的方向向量了。而且，记得对向量进行标准化，假设输入向量为一个单位向量是很不明智的。

最终的lightDir向量将和以前一样用在漫反射和镜面光计算中。

为了清楚地展示定向光对多个物体具有相同的影响，我们将会再次使用[坐标系统](https://learnopengl-cn.github.io/01 Getting started/08 Coordinate Systems/)章节最后的那个箱子派对的场景。如果你错过了派对，我们先定义了十个不同的[箱子位置](https://learnopengl.com/code_viewer.php?code=lighting/light_casters_container_positions)，并对每个箱子都生成了一个不同的模型矩阵，每个模型矩阵都包含了对应的局部-世界坐标变换：

```c++ nums
for(unsigned int i = 0; i < 10; i++)
{
    glm::mat4 model;
    model = glm::translate(model, cubePositions[i]);
    float angle = 20.0f * i;
    model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
    lightingShader.setMat4("model", model);

    glDrawArrays(GL_TRIANGLES, 0, 36);
}
```

同时，不要忘记**定义光源的方向（注意我们将方向定义为从光源出发的方向，你可以很容易看到光的方向朝下）**。

```c++ nums
lightingShader.setVec3("light.direction", -0.2f, -1.0f, -0.3f);
```

> 我们一直将光的位置和位置向量定义为`vec3`，但一些人会喜欢将所有的向量都定义为`vec4`。当我们将位置向量定义为一个`vec4`时，很重要的一点是要将w分量设置为1.0，这样变换和投影才能正确应用。然而，当我们定义一个方向向量为`vec4`的时候，我们不想让位移有任何的效果（因为它仅仅代表的是方向），所以我们将w分量设置为0.0。
>
> 方向向量就会像这样来表示：`vec4(0.2f, 1.0f, 0.3f, 0.0f)`。这也可以作为一个快速检测光照类型的工具：你可以检测w分量是否等于1.0，来检测它是否是光的位置向量；w分量等于0.0，则它是光的方向向量，这样就能根据这个来调整光照计算了：
>
> ```c++ nums
> if(lightVector.w == 0.0) // 注意浮点数据类型的误差
>   // 执行定向光照计算
> else if(lightVector.w == 1.0)
>   // 根据光源的位置做光照计算（与上一节一样）
> ```
>
> 你知道吗：这正是旧OpenGL（固定函数式）决定光源是定向光还是位置光源(Positional Light Source)的方法，并根据它来调整光照。

如果你现在编译程序，在场景中自由移动，你就可以看到好像有一个太阳一样的光源对所有的物体投光。你能注意到漫反射和镜面光分量的反应都好像在天空中有一个光源的感觉吗？它会看起来像这样：

![[light_casters_directional_light.png|img]]

#### 点光源

定向光对于照亮整个场景的全局光源是非常棒的，但除了定向光之外我们也需要一些分散在场景中的点光源(Point Light)。**点光源是处于世界中某一个位置的光源，它会朝着所有方向发光，但光线会随着距离逐渐衰减。**想象作为投光物的灯泡和火把，它们都是点光源。

![[light_casters_point.png|img]]

在之前的教程中，我们一直都在使用一个（简化的）点光源。我们在给定位置有一个光源，它会从它的光源位置开始朝着所有方向散射光线。然而，我们定义的光源模拟的是永远不会衰减的光线，这看起来像是光源亮度非常的强。在大部分的3D模拟中，我们都希望模拟的光源仅照亮光源附近的区域而不是整个场景。

如果你将10个箱子加入到上一节光照场景中，你会注意到在最后面的箱子和在灯面前的箱子都以相同的强度被照亮，并没有定义一个公式来将光随距离衰减。我们希望在后排的箱子与前排的箱子相比仅仅是被轻微地照亮。

#### 光的衰减

**随着光线传播距离的增长逐渐削减光的强度通常叫做衰减(Attenuation)。**随距离减少光强度的一种方式是使用一个线性方程。这样的方程能够随着距离的增长线性地减少光的强度，从而让远处的物体更暗。然而，这样的线性方程通常会看起来比较假。在现实世界中，灯在近处通常会非常亮，但随着距离的增加光源的亮度一开始会下降非常快，但在远处时剩余的光强度就会下降的非常缓慢了。所以，我们需要一个不同的公式来减少光的强度。

幸运的是一些聪明的人已经帮我们解决了这个问题。**下面这个公式根据片段距光源的距离计算了衰减值，之后我们会将它乘以光的强度向量：**

![[image-20220917143026145.png]]

在这里d代表了片段距光源的距离。接下来为了计算衰减值，我们定义3个（可配置的）项：常数项Kc、一次项Kl和二次项Kq。

- 常数项通常保持为1.0，它的主要作用是保证分母永远不会比1小，否则的话在某些距离上它反而会增加强度，这肯定不是我们想要的效果。
- 一次项会与距离值相乘，以线性的方式减少强度。
- 二次项会与距离的平方相乘，让光源以二次递减的方式减少强度。二次项在距离比较小的时候影响会比一次项小很多，但当距离值比较大的时候它就会比一次项更大了。

**由于二次项的存在，光线会在大部分时候以线性的方式衰退，直到距离变得足够大，让二次项超过一次项，光的强度会以更快的速度下降。这样的结果就是，光在近距离时亮度很高，但随着距离变远亮度迅速降低，最后会以更慢的速度减少亮度。**下面这张图显示了在100的距离内衰减的效果：

![[attenuation.png|img]]

##### 选择正确的值

但是，该对这三个项设置什么值呢？正确地设定它们的值取决于很多因素：环境、希望光覆盖的距离、光的类型等。在大多数情况下，这都是经验的问题，以及适量的调整。**下面这个表格显示了模拟一个（大概）真实的，覆盖特定半径（距离）的光源时，这些项可能取的一些值。第一列指定的是在给定的三项时光所能覆盖的距离。**这些值是大多数光源很好的起始点，它们由[Ogre3D的Wiki](http://www.ogre3d.org/tikiwiki/tiki-index.php?page=-Point+Light+Attenuation)所提供：

| 距离 | 常数项 | 一次项 | 二次项   |
| :--- | :----- | :----- | :------- |
| 7    | 1.0    | 0.7    | 1.8      |
| 13   | 1.0    | 0.35   | 0.44     |
| 20   | 1.0    | 0.22   | 0.20     |
| 32   | 1.0    | 0.14   | 0.07     |
| 50   | 1.0    | 0.09   | 0.032    |
| 65   | 1.0    | 0.07   | 0.017    |
| 100  | 1.0    | 0.045  | 0.0075   |
| 160  | 1.0    | 0.027  | 0.0028   |
| 200  | 1.0    | 0.022  | 0.0019   |
| 325  | 1.0    | 0.014  | 0.0007   |
| 600  | 1.0    | 0.007  | 0.0002   |
| 3250 | 1.0    | 0.0014 | 0.000007 |

你可以看到，常数项Kc在所有的情况下都是1.0。一次项Kl为了覆盖更远的距离通常都很小，二次项Kq甚至更小。尝试对这些值进行实验，看看它们在你的实现中有什么效果。在我们的环境中，32到100的距离对大多数的光源都足够了。

实现衰减

为了实现衰减，在片元着色器中我们还需要三个额外的值：也就是公式中的常数项、一次项和二次项。它们最好储存在之前定义的Light结构体中。注意我们使用上一节中计算lightDir的方法，而不是上面**定向光**部分的。

```c++ nums
struct Light {
    vec3 position;  

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};
```

然后我们将在OpenGL中设置这些项：我们希望光源能够覆盖50的距离，所以我们会使用表格中对应的常数项、一次项和二次项：

```c++ nums
lightingShader.setFloat("light.constant",  1.0f);
lightingShader.setFloat("light.linear",    0.09f);
lightingShader.setFloat("light.quadratic", 0.032f);
```

**在片元着色器中实现衰减还是比较直接的：我们根据公式计算衰减值，之后再分别乘以环境光、漫反射和镜面光分量。**

我们仍需要公式中距光源的距离d，还记得我们是怎么计算一个向量的长度的吗？我们可以通过获取片段和光源之间的向量差，并获取结果向量的长度作为距离项。我们可以使用GLSL内建的**`length`函数**来完成这一点：

```c++ nums
float distance    = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant + light.linear * distance + 
                light.quadratic * (distance * distance));
```

接下来，我们将包含这个衰减值到光照计算中，将它分别乘以环境光、漫反射和镜面光颜色。

> 我们可以将环境光分量保持不变，让环境光照不会随着距离减少，但是如果我们使用多于一个的光源，所有的环境光分量将会开始叠加，所以在这种情况下我们也希望衰减环境光照。简单实验一下，看看什么才能在你的环境中效果最好。

```c++ nums
ambient  *= attenuation; 
diffuse  *= attenuation;
specular *= attenuation;
```

如果你运行程序的话，你会获得这样的结果：

![[light_casters_point_light.png|img]]

你可以看到，只有前排的箱子被照亮的，距离最近的箱子是最亮的。后排的箱子一点都没有照亮，因为它们离光源实在是太远了。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/5.2.light_casters_point/light_casters_point.cpp)找到程序的代码。

点光源就是一个能够配置位置和衰减的光源。它是我们光照工具箱中的又一个光照类型。

#### 聚光

我们要讨论的最后一种类型的光是聚光(Spotlight)。**聚光是位于环境中某个位置的光源，它只朝一个特定方向而不是所有方向照射光线。**这样的结果就是只有在聚光方向的特定半径内的物体才会被照亮，其它的物体都会保持黑暗。**聚光很好的例子就是路灯或手电筒。**

**OpenGL中聚光是用一个世界空间位置、一个方向和一个切光角(Cutoff Angle)来表示的，切光角指定了聚光的半径**（译注：**是圆锥的半径**不是距光源距离那个半径）。对于每个片段，我们会计算片段是否位于聚光的切光方向之间（也就是在锥形内），如果是的话，我们就会相应地照亮片段。下面这张图会让你明白聚光是如何工作的：

![[light_casters_spotlight_angles.png|img]]

- `LightDir`：从片段指向光源的向量。
- `SpotDir`：聚光所指向的方向。
- `Phi`ϕ：指定了聚光半径的切光角。落在这个角度之外的物体都不会被这个聚光所照亮。
- `Theta`θ：LightDir向量和SpotDir向量之间的夹角。在聚光内部的话θ值应该比ϕ值小。

所以我们要做的就是**计算LightDir向量和SpotDir向量之间的点积**（点积返回两个单位向量夹角的余弦值），**并将它与切光角ϕ值对比**。你现在应该了解聚光究竟是什么了，下面我们将以手电筒的形式创建一个聚光。

##### 手电筒

手电筒(Flashlight)是一个位于观察者位置的聚光，通常它都会瞄准玩家视角的正前方。基本上说，手电筒就是普通的聚光，但它的位置和方向会随着玩家的位置和朝向不断更新。

所以，在片元着色器中我们需要的值有聚**光的位置向量（来计算光的方向向量）、聚光的方向向量和一个切光角**。我们可以将它们储存在Light结构体中：

```c++ nums
struct Light {
    vec3  position;
    vec3  direction;
    float cutOff;
    ...
};
```

接下来我们将合适的值传到着色器中：

```c++ nums
lightingShader.setVec3("light.position",  camera.Position);
lightingShader.setVec3("light.direction", camera.Front);
lightingShader.setFloat("light.cutOff",   glm::cos(glm::radians(12.5f)));
```

你可以看到，**我们并没有给切光角设置一个角度值，反而是用角度值计算了一个余弦值，将余弦结果传递到片元着色器中。**这样做的原因是在片元着色器中，我们会计算`LightDir`和`SpotDir`向量的点积，这个点积返回的将是一个余弦值而不是角度值，所以我们不能直接使用角度值和余弦值进行比较。**为了获取角度值我们需要计算点积结果的反余弦，这是一个开销很大的计算。所以为了节约一点性能开销，我们将会计算切光角对应的余弦值，并将它的结果传入片元着色器中。**由于这两个角度现在都由余弦角来表示了，我们可以直接对它们进行比较而不用进行任何开销高昂的计算。

接下来就是计算θ值，并将它和切光角ϕ对比，来决定是否在聚光的内部：

```c++ nums
float theta = dot(lightDir, normalize(-light.direction));

if(theta > light.cutOff) 
{       
  // 执行光照计算
}
else  // 否则，使用环境光，让场景在聚光之外时不至于完全黑暗
  color = vec4(light.ambient * vec3(texture(material.diffuse, TexCoords)), 1.0);
```

我们首先计算了lightDir和取反的direction向量（取反的是因为我们想让向量指向光源而不是从光源出发）之间的点积。记住要对所有的相关向量标准化。

> 你可能奇怪为什么在if条件中使用的是 > 符号而不是 < 符号。theta不应该比光的切光角更小才是在聚光内部吗？这并没有错，但不要忘记角度值现在都由余弦值来表示的。一个0度的角度表示的是1.0的余弦值，而一个90度的角度表示的是0.0的余弦值，你可以在下图中看到：
>
> ![[light_casters_cos.png|img]]
>
> 你现在可以看到，余弦值越接近1.0，它的角度就越小。这也就解释了为什么theta要比切光值更大了。切光值目前设置为12.5的余弦，约等于0.9978，所以在0.9979到1.0内的theta值才能保证片段在聚光内，从而被照亮。

运行程序，你将会看到一个聚光，它仅会照亮聚光圆锥内的片段。看起来像是这样的：[源码](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/5.3.light_casters_spot/light_casters_spot.cpp)

![[light_casters_spotlight_hard.png|img]]

但这仍看起来有些假，主要是因为聚光有一圈硬边。当一个片段遇到聚光圆锥的边缘时，它会完全变暗，没有一点平滑的过渡。一个真实的聚光将会在边缘处逐渐减少亮度。	

#### 平滑/软化边缘

为了创建一种看起来边缘平滑的聚光，我们需要**模拟聚光有一个内圆锥(Inner Cone)和一个外圆锥(Outer Cone)**。我们可以**将内圆锥设置为上一部分中的那个圆锥，但我们也需要一个外圆锥，来让光从内圆锥逐渐减暗，直到外圆锥的边界。**

为了创建一个外圆锥，我们**只需要再定义一个余弦值来代表聚光方向向量和外圆锥向量（等于它的半径）的夹角。然后，如果一个片段处于内外圆锥之间，将会给它计算出一个0.0到1.0之间的强度值。如果片段在内圆锥之内，它的强度就是1.0，如果在外圆锥之外强度值就是0.0。**

我们可以用下面这个公式来计算这个值：

![[image-20220917153358683.png]]

这里ϵ(Epsilon)是内（ϕ）和外圆锥（γ）之间的**余弦值差**（ϵ=ϕ−γ）。最终的**I值就是在当前片段聚光的强度**。

很难去表现这个公式是怎么工作的，所以我们用一些实例值来看看：

| θ     | θ（角度） | ϕ（内光切） | ϕ（角度） | γ（外光切） | γ（角度） | ϵ                       | I                             |
| :---- | :-------- | :---------- | :-------- | :---------- | :-------- | :---------------------- | :---------------------------- |
| 0.87  | 30        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.87 - 0.82 / 0.09 = 0.56     |
| 0.9   | 26        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.9 - 0.82 / 0.09 = 0.89      |
| 0.97  | 14        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.97 - 0.82 / 0.09 = 1.67     |
| 0.83  | 34        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.83 - 0.82 / 0.09 = 0.11     |
| 0.64  | 50        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.64 - 0.82 / 0.09 = -2.0     |
| 0.966 | 15        | 0.9978      | 12.5      | 0.953       | 17.5      | 0.9978 - 0.953 = 0.0448 | 0.966 - 0.953 / 0.0448 = 0.29 |

你可以看到，我们基本是在内外余弦值之间根据θ插值。如果你仍不明白发生了什么，不必担心，只需要记住这个公式就好了，在你更聪明的时候再回来看看。

我们现在有了一个在聚光外是负的，在内圆锥内大于1.0的，在边缘处于两者之间的强度值了。**如果我们正确地约束(Clamp)这个值，在片元着色器中就不再需要`if-else`了，我们能够使用计算出来的强度值直接乘以光照分量：**

```c++ nums
float theta     = dot(lightDir, normalize(-light.direction));
float epsilon   = light.cutOff - light.outerCutOff;
float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);    
...
// 将不对环境光做出影响，让它总是能有一点光
diffuse  *= intensity;
specular *= intensity;
...

```

> **clamp函数，它把第一个参数约束(Clamp)在了0.0到1.0之间。这保证强度值不会在[0, 1]区间之外。**

确定你**将outerCutOff值添加到了Light结构体之中，并在程序中设置它的uniform值。**下面的图片中，我们使用的内切光角是12.5，外切光角是17.5：

![[light_casters_spotlight.png|img]]

啊，这样看起来就好多了。稍微对内外切光角实验一下，尝试创建一个更能符合你需求的聚光。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/2.lighting/5.4.light_casters_spot_soft/light_casters_spot_soft.cpp)找到程序的源码。

这样的手电筒/聚光类型的灯光非常适合恐怖游戏，结合定向光和点光源，环境就会开始被照亮了。在[下一节](https://learnopengl-cn.github.io/02 Lighting/06 Multiple lights/)的教程中，我们将会结合我们至今讨论的所有光照和技巧。

### 多光源

我们在前面的教程中已经学习了许多关于OpenGL中光照的知识，其中包括冯氏着色(Phong Shading)、材质(Material)、光照贴图(Lighting Map)以及不同种类的投光物(Light Caster)。在这一节中，我们将结合之前学过的所有知识，创建一个包含六个光源的场景。我们将模拟一个类似太阳的定向光(Directional Light)光源，四个分散在场景中的点光源(Point Light)，以及一个手电筒(Flashlight)。

为了在场景中使用多个光源，我们希望**将光照计算封装到GLSL函数中。**这样做的原因是，每一种光源都需要一种不同的计算方法，而一旦我们想对多个光源进行光照计算时，代码很快就会变得非常复杂。如果我们只在main函数中进行所有的这些计算，代码很快就会变得难以理解。

GLSL中的函数和C函数很相似，它有一个函数名、一个返回值类型，如果函数不是在main函数之前声明的，我们还必须在代码文件顶部声明一个原型。我们对每个光照类型都创建一个不同的函数：定向光、点光源和聚光。

**当我们在场景中使用多个光源时，通常使用以下方法：我们需要有一个单独的颜色向量代表片段的输出颜色。对于每一个光源，它对片段的贡献颜色将会加到片段的输出颜色向量上。所以场景中的每个光源都会计算它们各自对片段的影响，并结合为一个最终的输出颜色。大体的结构会像是这样：**

```c++ nums
out vec4 FragColor;

void main()
{
  // 定义一个输出颜色值
  vec3 output;
  // 将定向光的贡献加到输出中
  output += someFunctionToCalculateDirectionalLight();
  // 对所有的点光源也做相同的事情
  for(int i = 0; i < nr_of_point_lights; i++)
    output += someFunctionToCalculatePointLight();
  // 也加上其它的光源（比如聚光）
  output += someFunctionToCalculateSpotLight();

  FragColor = vec4(output, 1.0);
}
```

实际的代码对每一种实现都可能不同，但大体的结构都是差不多的。我们定义了几个函数，用来计算每个光源的影响，并将最终的结果颜色加到输出颜色向量上。例如，如果两个光源都很靠近一个片段，那么它们所结合的贡献将会形成一个比单个光源照亮时更加明亮的片段。

#### 定向光

我们需要在片元着色器中定义一个函数来计算定向光对相应片段的贡献：它接受一些参数并计算一个定向光照颜色。

首先，我们需要定义一个定向光源最少所需要的变量。我们可以将这些变量储存在一个叫做DirLight的结构体中，并将它定义为一个uniform。需要的变量在[上一节](https://learnopengl-cn.github.io/02 Lighting/05 Light casters/)中都介绍过：

```c++ nums
struct DirLight {
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};  
uniform DirLight dirLight;
```

接下来我们可以将dirLight传入一个有着以下原型的函数。

```c++ nums
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir);
```

和C/C++一样，如果我们想调用一个函数（这里是在main函数中调用），这个函数需要在调用者的行数之前被定义过。在这个例子中我们更喜欢在main函数以下定义函数，所以上面要求就不满足了。所以，我们需要在main函数之上定义函数的原型，这和C语言中是一样的。

你可以看到，这个函数需要一个DirLight结构体和其它两个向量来进行计算。如果你认真完成了上一节的话，这个函数的内容应该理解起来很容易：

```c++ nums
vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir)
{
    vec3 lightDir = normalize(-light.direction);
    // 漫反射着色
    float diff = max(dot(normal, lightDir), 0.0);
    // 镜面光着色
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    // 合并结果
    vec3 ambient  = light.ambient  * vec3(texture(material.diffuse, TexCoords));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture(material.diffuse, TexCoords));
    vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
    return (ambient + diffuse + specular);
}
```

我们基本上只是从上一节中复制了代码，并使用函数参数的两个向量来计算定向光的贡献向量。最终环境光、漫反射和镜面光的贡献将会合并为单个颜色向量返回。

#### 点光源

和定向光一样，我们也希望定义一个用于计算点光源对相应片段贡献，以及衰减，的函数。同样，我们定义一个包含了点光源所需所有变量的结构体：

```c++ nums
struct PointLight {
    vec3 position;

    float constant;
    float linear;
    float quadratic;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};  
#define NR_POINT_LIGHTS 4
uniform PointLight pointLights[NR_POINT_LIGHTS];
```

你可以看到，我们在GLSL中**使用了预处理指令来定义了我们场景中点光源的数量**。接着我们使用了这个`NR_POINT_LIGHTS`常量来创建了一个PointLight结构体的数组。GLSL中的数组和C数组一样，可以使用一对方括号来创建。现在我们有四个待填充数据的PointLight结构体。

> 我们也可以定义**一个**大的结构体（而不是为每种类型的光源定义不同的结构体），包含**所有**不同种光照类型所需的变量，并将这个结构体用到所有的函数中，只需要忽略用不到的变量就行了。然而，我个人觉得当前的方法会更直观一点，不仅能够节省一些代码，而且由于不是所有光照类型都需要所有的变量，这样也能节省一些内存。

点光源函数的原型如下：

```c++ nums
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir);
```

这个函数从参数中获取所需的所有数据，并返回一个代表该点光源对片段的颜色贡献的`vec3`。我们再一次聪明地从之前的教程中复制粘贴代码，完成了下面这样的函数：

```c++ nums
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
{
    vec3 lightDir = normalize(light.position - fragPos);
    // 漫反射着色
    float diff = max(dot(normal, lightDir), 0.0);
    // 镜面光着色
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    // 衰减
    float distance    = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                 light.quadratic * (distance * distance));    
    // 合并结果
    vec3 ambient  = light.ambient  * vec3(texture(material.diffuse, TexCoords));
    vec3 diffuse  = light.diffuse  * diff * vec3(texture(material.diffuse, TexCoords));
    vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;
    return (ambient + diffuse + specular);
}
```

**将这些功能抽象到这样一个函数中的优点是，我们能够不用重复的代码而很容易地计算多个点光源的光照了。在main函数中，我们只需要创建一个循环，遍历整个点光源数组，对每个点光源调用CalcPointLight就可以了。**

#### 合并结果

现在我们已经定义了一个计算定向光的函数和一个计算点光源的函数了，我们可以将它们合并放到main函数中。

```c++ nums
void main()
{
    // 属性
    vec3 norm = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    // 第一阶段：定向光照
    vec3 result = CalcDirLight(dirLight, norm, viewDir);
    // 第二阶段：点光源
    for(int i = 0; i < NR_POINT_LIGHTS; i++)
        result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);    
    // 第三阶段：聚光
    //result += CalcSpotLight(spotLight, norm, FragPos, viewDir);    

    FragColor = vec4(result, 1.0);
}
```

每个光源类型都将它们的贡献加到了最终的输出颜色上，直到所有的光源都处理完了。最终的颜色包含了场景中所有光源的颜色影响所合并的结果。如果你想的话，你也可以实现一个聚光，并将它的效果加到输出颜色中。我们会将CalcSpotLight函数留给读者作为练习。

设置定向光结构体的uniform应该非常熟悉了，但是你可能会在想我们该**如何设置点光源的uniform值，因为点光源的uniform现在是一个PointLight的数组了。**这并不是我们以前讨论过的话题。

很幸运的是，这并不是很复杂，设置一个结构体数组的uniform和设置一个结构体的uniform是很相似的，但是这一次在访问uniform位置的时候，我们需要定义对应的数组下标值：

```c++ nums
lightingShader.setFloat("pointLights[0].constant", 1.0f);
```

在这里我们索引了pointLights数组中的第一个PointLight，并获取了constant变量的位置。但这也意味着不幸的是我们必须对这四个点光源手动设置uniform值，这让点光源本身就产生了28个uniform调用，非常冗长。你也可以尝试将这些抽象出去一点，定义一个点光源类，让它来为你设置uniform值，但最后你仍然要用这种方式设置所有光源的uniform值。

别忘了，我们还需要为每个点光源定义一个位置向量，所以我们让它们在场景中分散一点。我们会定义另一个`glm::vec3`数组来包含点光源的位置：

```c++ nums
glm::vec3 pointLightPositions[] = {
    glm::vec3( 0.7f,  0.2f,  2.0f),
    glm::vec3( 2.3f, -3.3f, -4.0f),
    glm::vec3(-4.0f,  2.0f, -12.0f),
    glm::vec3( 0.0f,  0.0f, -3.0f)
};
```

接下来我们从pointLights数组中索引对应的PointLight，将它的position值设置为刚刚定义的位置值数组中的其中一个。同时我们还要保证现在绘制的是四个灯立方体而不是仅仅一个。只要对每个灯物体创建一个不同的模型矩阵就可以了，和我们之前对箱子的处理类似。

如果你还使用了手电筒的话，所有光源组合的效果将看起来和下图差不多：

![[multiple_lights_combined.png|img]]

## 模型加载

到目前为止的所有场景中，我们一直都在滥用我们的箱子朋友，但时间久了甚至是我们最好的朋友也会感到无聊。在日常的图形程序中，通常都会使用非常复杂且好玩的模型，它们比静态的箱子要好看多了。然而，**和箱子对象不同，我们不太能够对像是房子、汽车或者人形角色这样的复杂形状手工定义所有的顶点、法线和纹理坐标。我们想要的是将这些模型(Model)导入(Import)到程序当中。**模型通常都由3D艺术家在[Blender](http://www.blender.org/)、[3DS Max](http://www.autodesk.nl/products/3ds-max/overview)或者[Maya](http://www.autodesk.com/products/autodesk-maya/overview)这样的工具中精心制作。

这些所谓的3D建模工具(3D Modeling Tool)可以让艺术家创建复杂的形状，并使用一种叫做**UV映射(uv-mapping)**的手段来应用贴图。**这些工具将会在导出到模型文件的时候自动生成所有的顶点坐标、顶点法线以及纹理坐标。**这样子艺术家们即使不了解图形技术细节的情况下，也能拥有一套强大的工具来构建高品质的模型了。所有的技术细节都隐藏在了导出的模型文件中。但是，作为图形开发者，我们就**必须**要了解这些技术细节了。

所以，**我们的工作就是解析这些导出的模型文件以及提取所有有用的信息，将它们储存为OpenGL能够理解的格式。**一个很常见的问题是，模型的文件格式有很多种，每一种都会以它们自己的方式来导出模型数据。像是[Wavefront的.obj](http://en.wikipedia.org/wiki/Wavefront_.obj_file)这样的模型格式，只包含了模型数据以及材质信息，像是模型颜色和漫反射/镜面光贴图。而以XML为基础的[Collada文件格式](http://en.wikipedia.org/wiki/COLLADA)则非常的丰富，包含模型、光照、多种材质、动画数据、摄像机、完整的场景信息等等。Wavefront的.obj格式通常被认为是一个易于解析的模型格式。建议至少去Wavefront的wiki页面上看看文件格式的信息是如何封装的。这应该能让你认识到模型文件的基本结构。

**总而言之，不同种类的文件格式有很多，它们之间通常并没有一个通用的结构。所以如果我们想从这些文件格式中导入模型的话，我们必须要去自己对每一种需要导入的文件格式写一个导入器。很幸运的是，正好有一个库专门处理这个问题。**

#### 模型加载库Assimp

一个非常流行的模型导入库是[Assimp](http://assimp.org/)，它是**Open Asset Import Library**（开放的资产导入库）的缩写。**Assimp能够导入很多种不同的模型文件格式（并也能够导出部分的格式），它会将所有的模型数据加载至Assimp的通用数据结构中。**当Assimp加载完模型之后，我们就能够从Assimp的数据结构中提取我们所需的所有数据了。由于Assimp的数据结构保持不变，不论导入的是什么种类的文件格式，它都能够将我们从这些不同的文件格式中抽象出来，用同一种方式访问我们需要的数据。

当使用Assimp导入一个模型的时候，它通常会将整个模型加载进一个**场景(Scene)对象**，它会包含导入的模型/场景中的所有数据。Assimp会将场景载入为一系列的节点(Node)，每个节点包含了场景对象中所储存数据的索引，每个节点都可以有任意数量的子节点。Assimp数据结构的（简化）模型如下：

![[assimp_structure.png|img]]

- 和材质和网格(Mesh)一样，所有的场景/模型数据都包含在Scene对象中。Scene对象也包含了场景根节点的引用。
- 场景的Root node（根节点）可能包含子节点（和其它的节点一样），它会有一系列指向场景对象中mMeshes数组中储存的网格数据的索引。**Scene下的mMeshes数组储存了真正的Mesh对象，节点中的mMeshes数组保存的只是场景中网格数组的索引。**
- 一个**Mesh对象本身包含了渲染所需要的所有相关数据**，像是顶点位置、法向量、纹理坐标、面(Face)和物体的材质。
- 一个网格包含了多个面。**Face代表的是物体的渲染图元(Primitive)**（三角形、方形、点）。**一个面包含了组成图元的顶点的索引。**由于顶点和索引是分开的，使用一个索引缓冲来渲染是非常简单的（见[你好，三角形](https://learnopengl-cn.github.io/01 Getting started/04 Hello Triangle/)）。
- 最后，**一个网格也包含了一个Material对象**，它包含了一些函数能让我们获取物体的材质属性，比如说颜色和纹理贴图（比如漫反射和镜面光贴图）。

所以，**我们需要做的第一件事是将一个物体加载到Scene对象中，遍历节点，获取对应的Mesh对象（我们需要递归搜索每个节点的子节点），并处理每个Mesh对象来获取顶点数据、索引以及它的材质属性。最终的结果是一系列的网格数据，我们会将它们包含在一个`Model`对象中。**

> **网格**
>
> 当使用建模工具对物体建模的时候，艺术家通常不会用单个形状创建出整个模型。通常每个模型都由几个子模型/形状组合而成。组合模型的每个单独的形状就叫做一个网格(Mesh)。比如说有一个人形的角色：艺术家通常会将头部、四肢、衣服、武器建模为分开的组件，并将这些网格组合而成的结果表现为最终的模型**。一个网格是我们在OpenGL中绘制物体所需的最小单位（顶点数据、索引和材质属性）。一个模型（通常）会包括多个网格。**

在[下一节](https://learnopengl-cn.github.io/03 Model Loading/02 Mesh/)中，我们将创建我们自己的Model和Mesh类来加载并使用刚刚介绍的结构储存导入后的模型。如果我们想要绘制一个模型，我们不需要将整个模型渲染为一个整体，只需要渲染组成模型的每个独立的网格就可以了。然而，在我们开始导入模型之前，我们首先需要将Assimp包含到我们的工程当中。

#### 构建Assimp

[Assimp环境配置（Visual Studio 2019）](https://blog.csdn.net/zhanxi1992/article/details/107804221)	

你可以在Assimp的[下载页面](http://assimp.org/index.php/downloads)中选择相应的版本。在写作时使用的Assimp最高版本为3.1.1。我们建议你自己编译Assimp库，因为它们的预编译库在大部分系统上都是不能运行的。如果你忘记如何使用CMake自己编译一个库的话，可以复习[创建窗口](https://learnopengl-cn.github.io/01 Getting started/02 Creating a window/)小节。

构建Assimp时可能会出现一些问题，所以我会将它们的解决方案列在这里，便于大家排除错误：

- CMake在读取配置列表时，不断报出DirectX库丢失的错误。报错如下：

  ```c++ nums
  Could not locate DirectX
  CMake Error at cmake-modules/FindPkgMacros.cmake:110 (message):
  Required library DirectX not found! Install the library (including dev packages) 
  and try again. If the library is already installed, set the missing variables 
  manually in cmake.
  ```

这个问题的解决方案是安装DirectX SDK，如果你之前没安装过的话。你可以从[这里](http://www.microsoft.com/en-us/download/details.aspx?id=6812)下载SDK。

- 安装DirectX SDK时，可能遇到一个错误码为`s1023`的错误。这种情况下，请在安装SDK之前根据[这个](http://blogs.msdn.com/b/chuckw/archive/2011/12/09/known-issue-directx-sdk-june-2010-setup-and-the-s1023-error.aspx)先卸载C++ Redistributable package(s)。
- 一旦配置完成，你就可以生成解决方案文件了，打开解决方案文件并编译Assimp库（可以编译为Debug版本也可以编译为Release版本，只要能工作就行）。
- **使用默认配置构建的Assimp是一个动态库(Dynamic Library)，所以我们需要包含所生成的assimp.dll文件以及程序的二进制文件。你可以简单地将DLL复制到我们程序可执行文件的同一目录中。**
- Assimp编译之后，生成的库和DLL文件位于**code/Debug**或者**code/Release**文件夹中。
- 接着把编译好的LIB文件和DLL文件拷贝到工程的相应目录下，并在解决方案中链接它们。并且记得把Assimp的头文件也复制到你的**include**目录中（头文件可以在从Assimp中下载的**include**目录里找到）。

> 如果你想让Assimp使用多线程来获得更高的性能，你可以使用Boost库来编译Assimp。你可以在它们的[安装页面](http://assimp.org/lib_html/install.html)找到完整的安装介绍。

现在，你应该已经编译完Assimp库并将它链接到你的程序中了。下一步：[导入](https://learnopengl-cn.github.io/03 Model Loading/02 Mesh/)漂亮的3D物体！

#### 网格

通过使用Assimp，我们可以加载不同的模型到程序中，但是载入后它们都被储存为Assimp的数据结构。我们最终仍要将这些数据转换为OpenGL能够理解的格式，这样才能渲染这个物体。我们从上一节中学到，网格(Mesh)代表的是单个的可绘制实体，我们现在先来定义一个我们自己的网格类。

首先我们来回顾一下我们目前学到的知识，想想一个网格最少需要什么数据。**一个网格应该至少需要一系列的顶点，每个顶点包含一个位置向量、一个法向量和一个纹理坐标向量。一个网格还应该包含用于索引绘制的索引以及纹理形式的材质数据（漫反射/镜面光贴图）。**

既然我们有了一个网格类的最低需求，我们可以在OpenGL中定义一个顶点了：

```c++ nums
struct Vertex {
    glm::vec3 Position;
    glm::vec3 Normal;
    glm::vec2 TexCoords;
};
```

我们将所有需要的向量储存到一个叫做Vertex的结构体中，我们可以用它来索引每个顶点属性。除了Vertex结构体之外，我们还需要将纹理数据整理到一个Texture结构体中。我们储存了纹理的id以及它的类型，比如是漫反射贴图或者是镜面光贴图。

```c++ nums
struct Texture {
    unsigned int id;
    string type;
};
```

知道了顶点和纹理的实现，我们可以开始定义**网格类**的结构了：

```c++ nums
class Mesh {
    public:
        /*  网格数据  */
        vector<Vertex> vertices;
        vector<unsigned int> indices;
        vector<Texture> textures;
        /*  函数  */
        Mesh(vector<Vertex> vertices, vector<unsigned int> indices, vector<Texture> textures);
        void Draw(Shader shader);
    private:
        /*  渲染数据  */
        unsigned int VAO, VBO, EBO;
        /*  函数  */
        void setupMesh();
};  
```

你可以看到这个类并不复杂。在构造器中，我们将所有必须的数据赋予了网格，我们**在`setupMesh`函数中初始化缓冲**，并最终**使用`Draw`函数来绘制网格**。注意我们将一个着色器传入了Draw函数中，**将着色器传入网格类中可以让我们在绘制之前设置一些uniform（像是链接采样器到纹理单元）**。

构造器的内容非常易于理解。我们只需要使用构造器的参数设置类的公有变量就可以了。我们在构造器中还调用了setupMesh函数：

```c++ nums
Mesh(vector<Vertex> vertices, vector<unsigned int> indices, vector<Texture> textures)
{
    this->vertices = vertices;
    this->indices = indices;
    this->textures = textures;

    setupMesh();
}
```

这里没什么可说的。我们接下来讨论setupMesh函数。

##### 初始化

由于有了构造器，我们现在有一大列的网格数据用于渲染。在此之前我们还必须**配置正确的缓冲，并通过顶点属性指针定义顶点着色器的布局。**现在你应该对这些概念都很熟悉了，但我们这次会稍微有一点变动，使用结构体中的顶点数据：

```c++ nums++
void setupMesh()
{
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);

    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);  

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), 
                 &indices[0], GL_STATIC_DRAW);

    // 顶点位置
    glEnableVertexAttribArray(0);   
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
    // 顶点法线
    glEnableVertexAttribArray(1);   
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal));
    // 顶点纹理坐标
    glEnableVertexAttribArray(2);   
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, TexCoords));

    glBindVertexArray(0);
}  
```

代码应该和你所想得没什么不同，但有了Vertex结构体的帮助，我们使用了一些小技巧。

**C++结构体有一个很棒的特性，它们的内存布局是连续的(Sequential)。**也就是说，如果我们将结构体作为一个数据数组使用，那么它将会以顺序排列结构体的变量，这将会直接转换为我们在数组缓冲中所需要的float（实际上是字节）数组。比如说，如果我们有一个填充后的Vertex结构体，那么它的内存布局将会等于：

```c++ nums
Vertex vertex;
vertex.Position  = glm::vec3(0.2f, 0.4f, 0.6f);
vertex.Normal    = glm::vec3(0.0f, 1.0f, 0.0f);
vertex.TexCoords = glm::vec2(1.0f, 0.0f);
// = [0.2f, 0.4f, 0.6f, 0.0f, 1.0f, 0.0f, 1.0f, 0.0f];
```

由于有了这个有用的特性，我们能够直接传入一大列的Vertex结构体的指针作为缓冲的数据，它们将会完美地转换为glBufferData所能用的参数：

```c++ nums
glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);
```

自然`sizeof`运算也可以用在结构体上来计算它的字节大小。这个应该是32字节的（8个float * 每个4字节）。

结构体的另外一个很好的用途是它的**预处理指令`offsetof(s, m)`**，它的第一个参数是一个结构体，第二个参数是这个结构体中变量的名字。**这个宏会返回那个变量距结构体头部的字节偏移量(Byte Offset)**。这正好可以用在定义glVertexAttribPointer函数中的偏移参数：

偏移量现在是使用offsetof来定义了，在这里它会将法向量的字节偏移量设置为结构体中法向量的偏移量，也就是3个float，即12字节。注意，我们同样将步长参数设置为了Vertex结构体的大小。

使用这样的一个结构体不仅能够提供可读性更高的代码，也允许我们很容易地拓展这个结构。如果我们希望添加另一个顶点属性，我们只需要将它添加到结构体中就可以了。由于它的灵活性，渲染的代码不会被破坏。

##### 渲染

我们需要为Mesh类定义最后一个函数，它的Draw函数。在真正渲染这个网格之前，我们需要在调用`glDrawElements`函数之前先绑定相应的纹理。然而，这实际上有些困难，我们一开始并不知道这个网格（如果有的话）有多少纹理、纹理是什么类型的。所以我们**该如何在着色器中设置纹理单元和采样器呢？**

为了解决这个问题，我们需要设定一个**命名标准：每个漫反射纹理被命名为`texture_diffuseN`，每个镜面光纹理应该被命名为`texture_specularN`，其中`N`的范围是1到纹理采样器最大允许的数字。**比如说我们对某一个网格有3个漫反射纹理，2个镜面光纹理，它们的纹理采样器应该之后会被调用：

```c++ nums
uniform sampler2D texture_diffuse1;
uniform sampler2D texture_diffuse2;
uniform sampler2D texture_diffuse3;
uniform sampler2D texture_specular1;
uniform sampler2D texture_specular2;
```

根据这个标准，我们可以在着色器中定义任意需要数量的纹理采样器，如果一个网格真的包含了（这么多）纹理，我们也能知道它们的名字是什么。根据这个标准，我们也能在一个网格中处理任意数量的纹理，开发者也可以自由选择需要使用的数量，他只需要定义正确的采样器就可以了（虽然定义少的话会有点浪费绑定和uniform调用）。

> 像这样的问题有很多种不同的解决方案。如果你不喜欢这个解决方案，你可以自己想一个你自己的解决办法。

最终的渲染代码是这样的：

```c++ nums
void Draw(Shader shader) 
{
    unsigned int diffuseNr = 1;
    unsigned int specularNr = 1;
    for(unsigned int i = 0; i < textures.size(); i++)
    {
        glActiveTexture(GL_TEXTURE0 + i); // 在绑定之前激活相应的纹理单元
        // 获取纹理序号（diffuse_textureN 中的 N）
        //to_string 函数：将数字常量转换为字符串，返回值为转换完毕的字符串
        string number;
        string name = textures[i].type;
        if(name == "texture_diffuse")
            number = std::to_string(diffuseNr++);
        else if(name == "texture_specular")
            number = std::to_string(specularNr++);

        shader.setInt(("material." + name + number).c_str(), i);
        glBindTexture(GL_TEXTURE_2D, textures[i].id);
    }
    glActiveTexture(GL_TEXTURE0);

    // 绘制网格
    glBindVertexArray(VAO);
    glDrawElements(GL_TRIANGLES, indices.size(), GL_UNSIGNED_INT, 0);
    glBindVertexArray(0);
}
```

我们首先计算了每个纹理类型的N-分量，并将其拼接到纹理类型字符串上，来获取对应的uniform名称。接下来我们查找对应的采样器，将它的位置值设置为当前激活的纹理单元，并绑定纹理。这也是我们在Draw函数中需要着色器的原因。我们也将`"material."`添加到了最终的uniform名称中，因为我们希望将纹理储存在一个材质结构体中（这在每个实现中可能都不同）。

> 注意我们在将漫反射计数器和镜面光计数器插入`stringstream`时，对它们进行了递增。在C++中，这个递增操作：`variable++`将会返回变量本身，**之后**再递增，而`++variable`则是**先**递增，再返回值。在我们的例子中是首先将原本的计数器值插入`stringstream`，之后再递增它，供下一次循环使用。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/mesh.h)找到Mesh类的完整源代码

我们刚定义的Mesh类是我们之前讨论的很多话题的抽象结果。在[下一节](https://learnopengl-cn.github.io/03 Model Loading/03 Model/)中，我们将创建一个模型，作为多个网格对象的容器，并真正地实现Assimp的加载接口。

##### 网格类

```c++ nums
#ifndef MESH_H
#define MESH_H

#include <glad/glad.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <MyShader.h>
#include <string>
#include <vector>
using namespace std;

#define MAX_BONE_INFLUENCE 4

struct Vertex
{
	glm::vec3 Position;
	glm::vec3 Normal;
	glm::vec2 TexCoords;
	glm::vec3 Tangent;
	glm::vec3 Bitangent;

	//骨骼索引影响顶点
	int m_BoneIDs[MAX_BONE_INFLUENCE];
	//
	float m_Weights[MAX_BONE_INFLUENCE];
};

struct Texture
{
	unsigned int id;
	string type;
	string path;
};

class Mesh
{
public:
	//网格数据
	vector<Vertex> vertices;
	vector<unsigned int> indices;
	vector<Texture> textures;
	unsigned int VAO;

	Mesh(vector<Vertex> vertices, vector<unsigned int>indices, vector<Texture> texture)
	{
		this->vertices = vertices;
		this->indices = indices;
		this->textures = textures;

		// 现在我们有了所有所需的数据，设置顶点缓冲区及其属性指针。
		setupMesh();
	}

	//渲染网格
	void Draw(Shader shader)
	{
		unsigned int diffuseNr = 1;
		unsigned int specularNr = 1;
		unsigned int normalNr = 1;
		unsigned int heightNr = 1;

		for (unsigned int i = 0; i < textures.size(); i++)
		{
			//在绑定之前激活适当的纹理单元
			glActiveTexture(GL_TEXTURE0 + i);

			//获取纹理数(diffuse_textureN中的N)
			//to_string 函数：将数字常量转换为字符串，返回值为转换完毕的字符串
			string number;
			string name = textures[i].type;
			if (name == "texture_diffuse")
				number = to_string(diffuseNr++);
			else if (name == "texture_specular")
				number = std::to_string(specularNr++); 
			else if (name == "texture_normal")
				number = std::to_string(normalNr++); 
			else if (name == "texture_height")
				number = std::to_string(heightNr++); 

			glUniform1i(glGetUniformLocation(shader.ID, (name + number).c_str()), i);
			glBindTexture(GL_TEXTURE_2D, textures[i].id);
		}

		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, static_cast<unsigned int>(indices.size()), GL_UNSIGNED_INT, 0);
		glBindVertexArray(0);
	}
private:
	//渲染数据
	unsigned int VBO, EBO;
	void setupMesh()
	{
		glGenVertexArrays(1, &VAO);
		glGenBuffers(1, &VBO);
		glGenBuffers(1, &EBO);

		glBindVertexArray(VAO);

		glBindBuffer(GL_ARRAY_BUFFER, VBO);
		glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);

		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
		glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

		// 顶点位置
		glEnableVertexAttribArray(0);
		glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
		// 顶点法线
		glEnableVertexAttribArray(1);
		glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal));
		// 顶点纹理坐标
		glEnableVertexAttribArray(2);
		glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, TexCoords));
		// vertex tangent
		glEnableVertexAttribArray(3);
		glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Tangent));
		// vertex bitangent
		glEnableVertexAttribArray(4);
		glVertexAttribPointer(4, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Bitangent));
		glBindVertexArray(0);
		// ids
		glEnableVertexAttribArray(5);
		glVertexAttribIPointer(5, 4, GL_INT, sizeof(Vertex), (void*)offsetof(Vertex, m_BoneIDs));
		// weights
		glEnableVertexAttribArray(6);
		glVertexAttribPointer(6, 4, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, m_Weights));

		glBindVertexArray(0);
	}
	
};
#endif

### 模型

现在是时候接触Assimp并创建实际的加载和转换代码了。这个教程的目标是创建另一个类来完整地表示一个模型，或者说是包含多个网格，甚至是多个物体的模型。一个包含木制阳台、塔楼、甚至游泳池的房子可能仍会被加载为一个模型。我们会使用Assimp来加载模型，并将它转换(Translate)至多个在[上一节](https://learnopengl-cn.github.io/03 Model Loading/02 Mesh/)中创建的Mesh对象。

事不宜迟，我会先把Model类的结构给你：

```c++ nums
class Model 
{
    public:
        /*  函数   */
        Model(char *path)
        {
            loadModel(path);
        }
        void Draw(Shader shader);   
    private:
        /*  模型数据  */
        vector<Mesh> meshes;
        string directory;
        /*  函数   */
        void loadModel(string path);
        void processNode(aiNode *node, const aiScene *scene);
        Mesh processMesh(aiMesh *mesh, const aiScene *scene);
        vector<Texture> loadMaterialTextures(aiMaterial *mat, aiTextureType type, string typeName);
};
```

Model类包含了一个Mesh对象的vector（译注：这里指的是C++中的vector模板类，之后遇到均不译），构造器需要我们给它一个文件路径。在构造器中，它会直接通过loadModel来加载文件。私有函数将会处理Assimp导入过程中的一部分，我们很快就会介绍它们。我们还将储存文件路径的目录，在之后加载纹理的时候还会用到它。

Draw函数没有什么特别之处，基本上就是遍历了所有网格，并调用它们各自的Draw函数。

```c++ nums
void Draw(Shader shader)
{
    for(unsigned int i = 0; i < meshes.size(); i++)
        meshes[i].Draw(shader);
}
```

#### 导入3D模型到OpenGL

要想导入一个模型，并将它转换到我们自己的数据结构中的话，首先我们需要包含Assimp对应的头文件：

```c++ nums
#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>
```

首先需要调用的函数是loadModel，它会从构造器中直接调用。**在loadModel中，我们使用Assimp来加载模型至Assimp的一个叫做scene的数据结构中。**你可能还记得在模型加载章节的[第一节](https://learnopengl-cn.github.io/03 Model Loading/01 Assimp/)教程中，这是Assimp数据接口的根对象。一旦我们有了这个场景对象，我们就能访问到加载后的模型中所有所需的数据了。

Assimp很棒的一点在于，它抽象掉了加载不同文件格式的所有技术细节，只需要一行代码就能完成所有的工作：

```c++ nums
Assimp::Importer importer;
const aiScene *scene = importer.ReadFile(path, aiProcess_Triangulate | aiProcess_FlipUVs);
```

我们首先声明了Assimp命名空间内的一个Importer，之后调用了它的**`ReadFile`函数。这个函数需要一个文件路径，它的第二个参数是一些后期处理(Post-processing)的选项。**除了加载文件之外，Assimp允许我们设定一些选项来强制它对导入的数据做一些额外的计算或操作。

**通过设定`aiProcess_Triangulate`，我们告诉Assimp，如果模型不是（全部）由三角形组成，它需要将模型所有的图元形状变换为三角形。**

**`aiProcess_FlipUVs`将在处理的时候翻转y轴的纹理坐标**（你可能还记得我们在[纹理](https://learnopengl-cn.github.io/01 Getting started/06 Textures/)教程中说过，在OpenGL中大部分的图像的y轴都是反的，所以这个后期处理选项将会修复这个）。**其它一些比较有用的选项有：**

- `aiProcess_GenNormals`：如果模型不包含法向量的话，就为每个顶点创建法线。
- `aiProcess_SplitLargeMeshes`：将比较大的网格分割成更小的子网格，如果你的渲染有最大顶点数限制，只能渲染较小的网格，那么它会非常有用。
- `aiProcess_OptimizeMeshes`：和上个选项相反，它会将多个小网格拼接为一个大的网格，减少绘制调用从而进行优化。

Assimp提供了很多有用的后期处理指令，你可以在[这里](http://assimp.sourceforge.net/lib_html/postprocess_8h.html)找到全部的指令。实际上使用Assimp加载模型是非常容易的（你也可以看到）。**困难的是之后使用返回的场景对象将加载的数据转换到一个Mesh对象的数组。**

完整的loadModel函数将会是这样的：

```c++ nums
void loadModel(string path)
{
    Assimp::Importer import;
    const aiScene *scene = import.ReadFile(path, aiProcess_Triangulate | aiProcess_FlipUVs);    

    if(!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode) 
    {
        cout << "ERROR::ASSIMP::" << import.GetErrorString() << endl;
        return;
    }
    directory = path.substr(0, path.find_last_of('/'));

    processNode(scene->mRootNode, scene);
}
```

在我们加载了模型之后，我们会检查场景和其根节点不为null，并且**检查了它的一个标记(Flag)，来查看返回的数据是不是不完整的。**如果遇到了任何错误，我们都会通过导入器的`GetErrorString`函数来报告错误并返回。我们也获取了文件路径的目录路径。

如果什么错误都没有发生，我们希望处理场景中的所有节点，所以我们将第一个节点（根节点）传入了递归的processNode函数。因为每个节点（可能）包含有多个子节点，我们希望首先处理参数中的节点，再继续处理该节点所有的子节点，以此类推。这正符合一个递归结构，所以我们将定义一个**递归函数**。递归函数在做一些处理之后，使用不同的参数递归调用这个函数自身，直到某个条件被满足停止递归。在我们的例子中**退出条件(Exit Condition)是所有的节点都被处理完毕。**

你可能还记得Assimp的结构中，每个节点包含了一系列的网格索引，每个索引指向场景对象中的那个特定网格。我们接下来就想去**获取这些网格索引，获取每个网格，处理每个网格，接着对每个节点的子节点重复这一过程。**processNode函数的内容如下：

```c++ nums
void processNode(aiNode *node, const aiScene *scene)
{
    // 处理节点所有的网格（如果有的话）
    for(unsigned int i = 0; i < node->mNumMeshes; i++)
    {
        aiMesh *mesh = scene->mMeshes[node->mMeshes[i]]; 
        meshes.push_back(processMesh(mesh, scene));         
    }
    // 接下来对它的子节点重复这一过程
    for(unsigned int i = 0; i < node->mNumChildren; i++)
    {
        processNode(node->mChildren[i], scene);
    }
}
```

我们首先检查每个节点的网格索引，并索引场景的mMeshes数组来获取对应的网格。**返回的网格将会传递到processMesh函数中，它会返回一个Mesh对象，我们可以将它存储在meshes列表/vector。**

所有网格都被处理之后，我们会遍历节点的所有子节点，并对它们调用相同的processMesh函数。当一个节点不再有任何子节点之后，这个函数将会停止执行。

> 认真的读者可能会发现，我们可以基本上忘掉处理任何的节点，只需要遍历场景对象的所有网格，就不需要为了索引做这一堆复杂的东西了。我们仍这么做的原因是，使用**节点的最初想法是将网格之间定义一个父子关系。**通过这样递归地遍历这层关系，我们就能将某个网格定义为另一个网格的父网格了。
> 这个系统的一个使用案例是，当你想位移一个汽车的网格时，你可以保证它的所有子网格（比如引擎网格、方向盘网格、轮胎网格）都会随着一起位移。这样的系统能够用父子关系很容易地创建出来。
>
> 然而，现在我们并没有使用这样一种系统，但如果你想对你的网格数据有更多的控制，通常都是建议使用这一种方法的。这种类节点的关系毕竟是由创建了这个模型的艺术家所定义。

**下一步就是将Assimp的数据解析到上一节中创建的Mesh类中。**

#### 从Assimp到网格

**将一个`aiMesh`对象转化为我们自己的网格对象不是那么困难。我们要做的只是访问网格的相关属性并将它们储存到我们自己的对象中。**`processMesh`函数的大体结构如下：

```c++ nums
Mesh processMesh(aiMesh *mesh, const aiScene *scene)
{
    vector<Vertex> vertices;
    vector<unsigned int> indices;
    vector<Texture> textures;

    for(unsigned int i = 0; i < mesh->mNumVertices; i++)
    {
        Vertex vertex;
        // 处理顶点位置、法线和纹理坐标
        ...
        vertices.push_back(vertex);
    }
    // 处理索引
    ...
    // 处理材质
    if(mesh->mMaterialIndex >= 0)
    {
        ...
    }

    return Mesh(vertices, indices, textures);
}
```

**处理网格的过程主要有三部分：获取所有的顶点数据，获取它们的网格索引，并获取相关的材质数据。**处理后的数据将会储存在三个vector当中，我们会利用它们构建一个Mesh对象，并返回它到函数的调用者那里。

获取顶点数据非常简单，我们定义了一个Vertex结构体，我们将在每个迭代之后将它加到vertices数组中。我们会遍历网格中的所有顶点（使用`mesh->mNumVertices`来获取）。在每个迭代中，我们希望使用所有的相关数据填充这个结构体。**顶点的位置是这样处理的：**

```c++ nums
glm::vec3 vector; 
vector.x = mesh->mVertices[i].x;
vector.y = mesh->mVertices[i].y;
vector.z = mesh->mVertices[i].z; 
vertex.Position = vector;
```

注意我们为了传输Assimp的数据，我们定义了一个`vec3`的临时变量。使用这样一个临时变量的原因是Assimp对向量、矩阵、字符串等都有自己的一套数据类型，它们并不能完美地转换到GLM的数据类型中。

> Assimp将它的顶点位置数组叫做mVertices，这其实并不是那么直观。

**处理法线的步骤也是差不多的：**

```c++ nums
vector.x = mesh->mNormals[i].x;
vector.y = mesh->mNormals[i].y;
vector.z = mesh->mNormals[i].z;
vertex.Normal = vector;
```

**纹理坐标的处理也大体相似**，但Assimp允许一个模型在一个顶点上有最多8个不同的纹理坐标，我们不会用到那么多，我们只关心第一组纹理坐标。我们同样也想检查网格是否真的包含了纹理坐标（可能并不会一直如此）

```c++ nums
if(mesh->mTextureCoords[0]) // 网格是否有纹理坐标？
{
    glm::vec2 vec;
    vec.x = mesh->mTextureCoords[0][i].x; 
    vec.y = mesh->mTextureCoords[0][i].y;
    vertex.TexCoords = vec;
}
else
    vertex.TexCoords = glm::vec2(0.0f, 0.0f);
```

vertex结构体现在已经填充好了需要的顶点属性，我们会在迭代的最后将它压入vertices这个vector的尾部。这个过程会对每个网格的顶点都重复一遍。

##### 面索引

**Assimp的接口定义了每个网格都有一个面(Face)数组，每个面代表了一个图元，**在我们的例子中（由于使用了aiProcess_Triangulate选项）它总是三角形。一个面包含了多个索引，它们定义了在每个图元中，我们应该绘制哪个顶点，并以什么顺序绘制，所以如果我们遍历了所有的面，并储存了面的索引到indices这个vector中就可以了。

```c++ nums
for(unsigned int i = 0; i < mesh->mNumFaces; i++)
{
    aiFace face = mesh->mFaces[i];
    for(unsigned int j = 0; j < face.mNumIndices; j++)
        indices.push_back(face.mIndices[j]);
}
```

所有的外部循环都结束了，我们现在有了一系列的顶点和索引数据，它们可以用来通过glDrawElements函数来绘制网格。然而，为了结束这个话题，并且对网格提供一些细节，我们还需要处理网格的材质。

##### 材质索引

和节点一样，一个网格只包含了一个指向材质对象的索引。如果想要获取网格真正的材质，我们还需要索引场景的mMaterials数组。**网格材质索引位于它的mMaterialIndex属性中，我们同样可以用它来检测一个网格是否包含有材质：**

```c++ nums
if(mesh->mMaterialIndex >= 0)
{
    aiMaterial *material = scene->mMaterials[mesh->mMaterialIndex];
    vector<Texture> diffuseMaps = loadMaterialTextures(material, aiTextureType_DIFFUSE, "texture_diffuse");
    textures.insert(textures.end(), diffuseMaps.begin(), diffuseMaps.end());
    vector<Texture> specularMaps = loadMaterialTextures(material,aiTextureType_SPECULAR, "texture_specular");
    textures.insert(textures.end(), specularMaps.begin(), specularMaps.end());
}
```

我们首先从场景的mMaterials数组中获取`aiMaterial`对象。接下来我们希望**加载网格的漫反射和/或镜面光贴图**。一个材质对象的内部对每种纹理类型都存储了一个纹理位置数组。**不同的纹理类型都以`aiTextureType_`为前缀。我们使用一个叫做`loadMaterialTextures`的工具函数来从材质中获取纹理。**这个函数将会返回一个Texture结构体的vector，我们将在模型的textures vector的尾部之后存储它。

`loadMaterialTextures`函数遍历了给定纹理类型的所有纹理位置，获取了纹理的文件位置，并加载并和生成了纹理，将信息储存在了一个Vertex结构体中。它看起来会像这样：

```c++ nums
vector<Texture> loadMaterialTextures(aiMaterial *mat, aiTextureType type, string typeName)
{
    vector<Texture> textures;
    for(unsigned int i = 0; i < mat->GetTextureCount(type); i++)
    {
        aiString str;
        mat->GetTexture(type, i, &str);
        Texture texture;
        texture.id = TextureFromFile(str.C_Str(), directory);
        texture.type = typeName;
        texture.path = str;
        textures.push_back(texture);
    }
    return textures;
}
```

我们首先**通过`GetTextureCount`函数检查储存在材质中纹理的数量**，这个函数需要一个纹理类型。我们会使用**`GetTexture`获取每个纹理的文件位置**，它会将结果储存在一个`aiString`中。我们接下来使用另外一个叫做TextureFromFile的工具函数，它将会（用`stb_image.h`）加载一个纹理并返回该纹理的ID。如果你不确定这样的代码是如何写出来的话，可以查看最后的完整代码。

> 注意，我们假设了模型文件中纹理文件的路径是相对于模型文件的本地(Local)路径，比如说与模型文件处于同一目录下。我们可以将纹理位置字符串拼接到之前（在loadModel中）获取的目录字符串上，来获取完整的纹理路径（这也是为什么GetTexture函数也需要一个目录字符串）。
>
> 在网络上找到的某些模型会对纹理位置使用绝对(Absolute)路径，这就不能在每台机器上都工作了。在这种情况下，你可能会需要手动修改这个文件，来让它对纹理使用本地路径（如果可能的话）。

这就是使用Assimp导入模型的全部了。

### 优化
这还没有完全结束，因为我们还想做出一个重大的（但不是完全必须的）优化。大多数场景都会在多个网格中重用部分纹理。还是想想一个房子，它的墙壁有着花岗岩的纹理。这个纹理也可以被应用到地板、天花板、楼梯、桌子，甚至是附近的一口井上。加载纹理并不是一个开销不大的操作，**在我们当前的实现中，即便同样的纹理已经被加载过很多遍了，对每个网格仍会加载并生成一个新的纹理。这很快就会变成模型加载实现的性能瓶颈。**

所以我们会对模型的代码进行调整，**将所有加载过的纹理全局储存，每当我们想加载一个纹理的时候，首先去检查它有没有被加载过。如果有的话，我们会直接使用那个纹理，并跳过整个加载流程，来为我们省下很多处理能力。**为了能够比较纹理，我们还需要储存它们的路径：

```c++ nums
struct Texture {
    unsigned int id;
    string type;
    aiString path;  // 我们储存纹理的路径用于与其它纹理进行比较
};
```

接下来我们将所有加载过的纹理储存在另一个vector中，在模型类的顶部声明为一个私有变量：

```c++ nums
vector<Texture> textures_loaded;
```

之后，在`loadMaterialTextures`函数中，我们希望将纹理的路径与储存在`textures_loaded`这个vector中的所有纹理进行比较，看看当前纹理的**路径**是否与其中的一个相同。如果是的话，则跳过纹理加载/生成的部分，直接使用定位到的纹理结构体为网格的纹理。更新后的函数如下：

```c++ nums
vector<Texture> loadMaterialTextures(aiMaterial *mat, aiTextureType type, string typeName)
{
    vector<Texture> textures;
    for(unsigned int i = 0; i < mat->GetTextureCount(type); i++)
    {
        aiString str;
        mat->GetTexture(type, i, &str);
        bool skip = false;
        for(unsigned int j = 0; j < textures_loaded.size(); j++)
        {
            if(std::strcmp(textures_loaded[j].path.data(), str.C_Str()) == 0)
            {
                textures.push_back(textures_loaded[j]);
                skip = true; 
                break;
            }
        }
        if(!skip)
        {   // 如果纹理还没有被加载，则加载它
            Texture texture;
            texture.id = TextureFromFile(str.C_Str(), directory);
            texture.type = typeName;
            texture.path = str.C_Str();
            textures.push_back(texture);
            textures_loaded.push_back(texture); // 添加到已加载的纹理中
        }
    }
    return textures;
}

```
所以现在我们不仅有了个灵活的模型加载系统，我们也获得了一个加载对象很快的优化版本。

> 有些版本的Assimp在使用调试版本或者使用IDE的调试模式下加载模型会非常缓慢，所以在你遇到缓慢的加载速度时，可以试试使用发布版本。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/model.h)找到优化后Model类的完整源代码。
#### 模型类

#### 孤岛危机模型

所以，让我们导入一个由真正的艺术家所创造的模型，这次我们将会加载Crytek的游戏孤岛危机(Crysis)中的原版[纳米服](http://tf3dm.com/3d-model/crysis-2-nanosuit-2-97837.html)(Nanosuit)。这个模型被输出为一个`.obj`文件以及一个`.mtl`文件，`.mtl`文件包含了模型的漫反射、镜面光和法线贴图（这个会在后面学习到），你可以在[这里](https://learnopengl-cn.github.io/data/nanosuit.rar)下载到（稍微修改之后的）模型，注意所有的纹理和模型文件应该位于同一个目录下，以供加载纹理。

> 你从本网站中下载到的版本是修改过的版本，每个纹理的路径都被修改为了一个本地的相对路径，而不是原资源的绝对路径。

现在在代码中，声明一个Model对象，将模型的文件位置传入。接下来模型应该会自动加载并（如果没有错误的话）在渲染循环中使用它的Draw函数来绘制物体，这样就可以了。不再需要缓冲分配、属性指针和渲染指令，只需要一行代码就可以了。接下来如果你创建一系列着色器，其中片元着色器仅仅输出物体的漫反射纹理颜色，最终的结果看上去会是这样的：


你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/3.model_loading/1.model_loading/model_loading.cpp)找到完整的源码。

我们可以变得更有创造力一点，根据我们之前在[光照](https://learnopengl-cn.github.io/02 Lighting/05 Light casters/)教程中学过的知识，引入两个点光源到渲染方程中，结合镜面光贴图，我们能得到很惊人的效果。

甚至我都必须要承认这个可能是比一直使用的箱子要好看多了。使用Assimp，你能够加载互联网上的无数模型。有很多资源网站都提供了多种格式的免费3D模型供你下载。但还是要注意，有些模型会不能正常地载入，纹理的路径会出现问题，或者Assimp并不支持它的格式。

我的代码

# 高级OpenGL

## 深度测试

在[坐标系统](https://learnopengl-cn.github.io/01 Getting started/08 Coordinate Systems/)小节中，我们渲染了一个3D箱子，并且运用了深度缓冲(Depth Buffer)来防止被阻挡的面渲染到其它面的前面。在这一节中，我们将会更加深入地讨论这些储存在深度缓冲（或z缓冲(z-buffer)）中的深度值(Depth Value)，以及它们是如何确定一个片段是处于其它片段后方的。

深度缓冲就像颜色缓冲(Color Buffer)（储存所有的片段颜色：视觉输出）一样，在每个片段中储存了信息，并且（通常）和颜色缓冲有着一样的宽度和高度。深度缓冲是由窗口系统自动创建的，它会以16、24或32位float的形式储存它的深度值。在大部分的系统中，深度缓冲的精度都是24位的。

当深度测试(Depth Testing)被启用的时候，OpenGL会将一个片段的深度值与深度缓冲的内容进行对比。OpenGL会执行一个深度测试，如果这个测试通过了的话，深度缓冲将会更新为新的深度值。如果深度测试失败了，片段将会被丢弃。

**深度缓冲是在片元着色器运行之后（以及模板测试(Stencil Testing)运行之后，我们将在[下一节](https://learnopengl-cn.github.io/04 Advanced OpenGL/02 Stencil testing/)中讨论）在屏幕空间中运行的。**屏幕空间坐标与通过OpenGL的`glViewport`所定义的视口密切相关，并且可以直接使用GLSL内建变量`gl_FragCoord`从片元着色器中直接访问。**gl_FragCoord的x和y分量代表了片段的屏幕空间坐标（其中(0, 0)位于左下角）。**gl_FragCoord中也包含了一个z分量，它包含了片段真正的深度值。z值就是需要与深度缓冲内容所对比的那个值。

> 现在大部分的GPU都提供一个叫做提前深度测试(Early Depth Testing)的硬件特性。提前深度测试允许深度测试在片元着色器之前运行。只要我们清楚一个片段永远不会是可见的（它在其他物体之后），我们就能提前丢弃这个片段。
>
> 片元着色器通常开销都是很大的，所以我们应该尽可能避免运行它们。当使用提前深度测试时，片元着色器的一个限制是你不能写入片段的深度值。如果一个片元着色器对它的深度值进行了写入，提前深度测试是不可能的。**OpenGL不能提前知道深度值。**

深度测试默认是禁用的，所以如果要启用深度测试的话，我们需要用GL_DEPTH_TEST选项来启用它：

```c++ nums
glEnable(GL_DEPTH_TEST);
```

当它启用的时候，如果一个片段通过了深度测试的话，OpenGL会在深度缓冲中储存该片段的z值；如果没有通过深度缓冲，则会丢弃该片段。**如果你启用了深度缓冲，你还应该在每个渲染迭代之前使用GL_DEPTH_BUFFER_BIT来清除深度缓冲，否则你会仍在使用上一次渲染迭代中的写入的深度值：**

```c++ nums
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
```

可以想象，在某些情况下你会需要对所有片段都执行深度测试并丢弃相应的片段，但**不**希望更新深度缓冲。基本上来说，你在使用一个只读的(Read-only)深度缓冲。OpenGL允许我们禁用深度缓冲的写入，只需要设置它的深度掩码(Depth Mask)设置为`GL_FALSE`就可以了：

```c++ nums
glDepthMask(GL_FALSE);
```

注意这只在深度测试被启用的时候才有效果。

### 深度测试函数

OpenGL允许我们修改深度测试中使用的比较运算符。这允许我们来控制OpenGL什么时候该通过或丢弃一个片段，什么时候去更新深度缓冲。我们可以调用glDepthFunc函数来设置比较运算符（或者说深度函数(Depth Function)）：

```c++ nums
glDepthFunc(GL_LESS);
```

这个函数接受下面表格中的比较运算符：

| 函数        | 描述                                         |
| :---------- | :------------------------------------------- |
|GL_ALWAYS| 永远通过深度测试                             |
| GL_NEVER    | 永远不通过深度测试                           |
| GL_LESS     | 在片段深度值小于缓冲的深度值时通过测试       |
| GL_EQUAL    | 在片段深度值等于缓冲区的深度值时通过测试     |
| GL_LEQUAL   | 在片段深度值小于等于缓冲区的深度值时通过测试 |
| GL_GREATER  | 在片段深度值大于缓冲区的深度值时通过测试     |
| GL_NOTEQUAL | 在片段深度值不等于缓冲区的深度值时通过测试   |
| GL_GEQUAL   | 在片段深度值大于等于缓冲区的深度值时通过测试 |

默认情况下使用的深度函数是GL_LESS，它将会丢弃深度值大于等于当前深度缓冲值的所有片段。

让我们看看改变深度函数会对视觉输出有什么影响。我们将使用一个新的代码配置，它会显示一个没有光照的基本场景，里面有两个有纹理的立方体，放置在一个有纹理的地板上。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/1.1.depth_testing/depth_testing.cpp)找到源代码。

在源代码中，我们将深度函数改为GL_ALWAYS：

```c++ nums
glEnable(GL_DEPTH_TEST);
glDepthFunc(GL_ALWAYS);
```

这将会模拟我们没有启用深度测试时所得到的结果。深度测试将会永远通过，所以最后绘制的片段将会总是会渲染在之前绘制片段的上面，即使之前绘制的片段本就应该渲染在最前面。因为我们是最后渲染地板的，它会覆盖所有的箱子片段：

![[depth_testing_func_always.png|img]]

将它重新设置为GL_LESS，这会将场景还原为原有的样子：

![[depth_testing_func_less.png|img]]

### 深度值精度

**深度缓冲包含了一个介于0.0和1.0之间的深度值，它将会与观察者视角所看见的场景中所有物体的z值进行比较。**观察空间的z值可能是投影平截头体的**近平面**(Near)和**远平面**(Far)之间的任何值。**我们需要一种方式来将这些观察空间的z值变换到[0, 1]范围之间，其中的一种方式就是将它们线性变换到[0, 1]范围之间。**下面这个（线性）方程将z值变换到了0.0到1.0之间的深度值：

![[image-20220927194448423.png]]

这里的nearnear和farfar值是我们之前提供给投影矩阵设置可视平截头体的（见[坐标系统](https://learnopengl-cn.github.io/01 Getting started/08 Coordinate Systems/)）那个 *near* 和 *far* 值。这个方程需要平截头体中的一个z值，并将它变换到了[0, 1]的范围中。z值和对应的深度值之间的关系可以在下图中看到：

![[depth_linear_graph.png|img]]

> 注意所有的方程都会将非常近的物体的深度值设置为接近0.0的值，而当物体非常接近远平面的时候，它的深度值会非常接近1.0。

然而，在实践中是几乎永远不会使用这样的线性深度缓冲(Linear Depth Buffer)的。**要想有正确的投影性质，需要使用一个非线性的深度方程，它是与 1/z 成正比的。它做的就是在z值很小的时候提供非常高的精度，而在z值很远的时候提供更少的精度。**花时间想想这个：我们真的需要对1000单位远的深度值和只有1单位远的充满细节的物体使用相同的精度吗？线性方程并不会考虑这一点。

由于**非线性方程与 1/z 成正比**，在1.0和2.0之间的z值将会变换至1.0到0.5之间的深度值，这就是一个float提供给我们的一半精度了，这在z值很小的情况下提供了非常大的精度。在50.0和100.0之间的z值将会只占2%的float精度，这正是我们所需要的。这样的一个考虑了远近距离的方程是这样的：

![[image-20220927194511670.png]]

如果你不知道这个方程是怎么回事也不用担心。**重要的是要记住深度缓冲中的值在屏幕空间中不是线性的（在透视矩阵应用之前在观察空间中是线性的）**。深度缓冲中0.5的值并不代表着物体的z值是位于平截头体的中间了，这个顶点的z值实际上非常接近近平面！你可以在下图中看到z值和最终的深度缓冲值之间的非线性关系：

![[depth_non_linear_graph.png|img]]

可以看到，深度值很大一部分是由很小的z值所决定的，这给了近处的物体很大的深度精度。**这个（从观察者的视角）变换z值的方程是嵌入在投影矩阵中的，所以当我们想将一个顶点坐标从观察空间至裁剪空间的时候这个非线性方程就被应用了。**如果你想深度了解投影矩阵究竟做了什么，我建议阅读[这篇文章](http://www.songho.ca/opengl/gl_projectionmatrix.html)。

如果我们想要可视化深度缓冲的话，非线性方程的效果很快就会变得很清楚。

### 深度缓冲的可视化

我们知道片元着色器中，内建gl_FragCoord向量的z值包含了那个特定片段的深度值。如果我们将这个深度值输出为颜色，我们可以显示场景中所有片段的深度值。我们可以根据片段的深度值返回一个颜色向量来完成这一工作：

```c++ nums
void main()
{
    FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
}
```

如果你再次运行程序的话，你可能会注意到所有东西都是白色的，看起来就想我们所有的深度值都是最大的1.0。所以为什么没有靠近0.0（即变暗）的深度值呢？

你可能还记得在上一部分中说到，屏幕空间中的深度值是非线性的，即它在z值很小的时候有很高的精度，而z值很大的时候有较低的精度。片段的深度值会随着距离迅速增加，所以几乎所有的顶点的深度值都是接近于1.0的。如果我们小心地靠近物体，你可能会最终注意到颜色会渐渐变暗，显示它们的z值在逐渐变小：

![[depth_testing_visible_depth.png|img]]

这很清楚地展示了深度值的非线性性质。近处的物体比起远处的物体对深度值有着更大的影响。只需要移动几厘米就能让颜色从暗完全变白。

然而，我们也可以让片段非线性的深度值变换为线性的。要实现这个，我们需要仅仅反转深度值的投影变换。这也就意味着我们需要首先将深度值从[0, 1]范围重新变换到[-1, 1]范围的标准化设备坐标（裁剪空间）。接下来我们需要像投影矩阵那样反转这个非线性方程（方程2），并将这个反转的方程应用到最终的深度值上。最终的结果就是一个线性的深度值了。听起来是可行的，对吧？

首先我们将深度值变换为NDC，不是非常困难：

```c++ nums
float z = depth * 2.0 - 1.0;
```

接下来使用获取到的z值，应用逆变换来获取线性的深度值：

```c++ nums
float linearDepth = (2.0 * near * far) / (far + near - z * (far - near));
```

这个方程是用投影矩阵推导得出的，它使用了方程2来非线性化深度值，返回一个near与far之间的深度值。这篇注重数学的[文章](http://www.songho.ca/opengl/gl_projectionmatrix.html)为感兴趣的读者详细解释了投影矩阵，它也展示了这些方程是怎么来的。

将屏幕空间中非线性的深度值变换至线性深度值的完整片元着色器如下：

```c++ nums
#version 330 core
out vec4 FragColor;

float near = 0.1; 
float far  = 100.0; 

float LinearizeDepth(float depth) 
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));    
}

void main()
{             
    float depth = LinearizeDepth(gl_FragCoord.z) / far; // 为了演示除以 far
    FragColor = vec4(vec3(depth), 1.0);
}
```

由于线性化的深度值处于near与far之间，它的大部分值都会大于1.0并显示为完全的白色。通过在main函数中将线性深度值除以far，我们近似地将线性深度值转化到[0, 1]的范围之间。这样子我们就能逐渐看到一个片段越接近投影平截头体的远平面，它就会变得越亮，更适用于展示目的。

如果我们现在运行程序，我们就能看见深度值随着距离增大是线性的了。尝试在场景中移动，看看深度值是怎样以线性变化的。

颜色大部分都是黑色，因为深度值的范围是0.1的**近**平面到100的**远**平面，它离我们还是非常远的。结果就是，我们相对靠近近平面，所以会得到更低的（更暗的）深度值。

### 深度冲突

**一个很常见的视觉错误会在两个平面或者三角形非常紧密地平行排列在一起时会发生，深度缓冲没有足够的精度来决定两个形状哪个在前面。结果就是这两个形状不断地在切换前后顺序，这会导致很奇怪的花纹。这个现象叫做深度冲突(Z-fighting)**，因为它看起来像是这两个形状在争夺(Fight)谁该处于顶端。

在我们一直使用的场景中，有几个地方的深度冲突还是非常明显的。箱子被放置在地板的同一高度上，这也就意味着箱子的底面和地板是共面的(Coplanar)。这两个面的深度值都是一样的，所以深度测试没有办法决定应该显示哪一个。

如果你将摄像机移动到其中一个箱子的内部，你就能清楚地看到这个效果的，箱子的底部不断地在箱子底面与地板之间切换，形成一个锯齿的花纹：

![[depth_testing_z_fighting.png|img]]

深度冲突是深度缓冲的一个常见问题，当物体在远处时效果会更明显（因为深度缓冲在z值比较大的时候有着更小的精度）。**深度冲突不能够被完全避免，但一般会有一些技巧有助于在你的场景中减轻或者完全避免深度冲突、**

#### 防止深度冲突

第一个也是最重要的技巧是**永远不要把多个物体摆得太靠近，以至于它们的一些三角形会重叠**。通过在两个物体之间设置一个用户无法注意到的偏移值，你可以完全避免这两个物体之间的深度冲突。在箱子和地板的例子中，我们可以将箱子沿着正y轴稍微移动一点。箱子位置的这点微小改变将不太可能被注意到，但它能够完全减少深度冲突的发生。然而，这需要对每个物体都手动调整，并且需要进行彻底的测试来保证场景中没有物体会产生深度冲突。

第二个技巧是**尽可能将近平面设置远一些**。在前面我们提到了精度在靠近**近**平面时是非常高的，所以如果我们将**近**平面远离观察者，我们将会对整个平截头体有着更大的精度。然而，将近平面设置太远将会导致近处的物体被裁剪掉，所以这通常需要实验和微调来决定最适合你的场景的**近**平面距离。

另外一个很好的技巧是牺牲一些性能，**使用更高精度的深度缓冲**。大部分深度缓冲的精度都是24位的，但现在大部分的显卡都支持32位的深度缓冲，这将会极大地提高精度。所以，牺牲掉一些性能，你就能获得更高精度的深度测试，减少深度冲突。

我们上面讨论的三个技术是最普遍也是很容易实现的抗深度冲突技术了。还有一些更复杂的技术，但它们依然不能完全消除深度冲突。深度冲突是一个常见的问题，但如果你组合使用了上面列举出来的技术，你可能不会再需要处理深度冲突了。

## 模板测试

**当片元着色器处理完一个片段之后，模板测试(Stencil Test)会开始执行，和深度测试一样，它也可能会丢弃片段。**接下来，被保留的片段会进入深度测试，它可能会丢弃更多的片段。模板测试是根据又一个缓冲来进行的，它叫做模板缓冲(Stencil Buffer)，我们可以在渲染的时候更新它来获得一些很有意思的效果。

一个模板缓冲中，（通常）每个模板值(Stencil Value)是8位的。所以每个像素/片段一共能有256种不同的模板值。我们可以将这些模板值设置为我们想要的值，然后当某一个片段有某一个模板值的时候，我们就可以选择丢弃或是保留这个片段了。

> 每个窗口库都需要为你配置一个模板缓冲。GLFW自动做了这件事，所以我们不需要告诉GLFW来创建一个，但其它的窗口库可能不会默认给你创建一个模板库，所以记得要查看库的文档。

模板缓冲的一个简单的例子如下：

![[stencil_buffer.png|img]]

模板缓冲首先会被清除为0，之后在模板缓冲中使用1填充了一个空心矩形。场景中的片段将会只在片段的模板值为1的时候会被渲染（其它的都被丢弃了）。

模板缓冲操作允许我们在渲染片段时将模板缓冲设定为一个特定的值。通过在渲染时修改模板缓冲的内容，我们**写入**了模板缓冲。在同一个（或者接下来的）渲染迭代中，我们可以**读取**这些值，来决定丢弃还是保留某个片段。使用模板缓冲的时候你可以尽情发挥，但大体的步骤如下：

- 启用模板缓冲的写入。
- 渲染物体，更新模板缓冲的内容。
- 禁用模板缓冲的写入。
- 渲染（其它）物体，这次根据模板缓冲的内容丢弃特定的片段。

所以，通过使用模板缓冲，我们可以根据场景中已绘制的其它物体的片段，来决定是否丢弃特定的片段。

你可以启用`GL_STENCIL_TEST`来启用模板测试。在这一行代码之后，所有的渲染调用都会以某种方式影响着模板缓冲。

```c++ nums
glEnable(GL_STENCIL_TEST);
```

注意，和颜色和深度缓冲一样，你也需要在每次迭代之前清除模板缓冲。

```c++ nums
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
```

和深度测试的glDepthMask函数一样，模板缓冲也有一个类似的函数。`glStencilMask`允许我们设置一个位掩码(Bitmask)，它会与将要写入缓冲的模板值进行与(AND)运算。默认情况下设置的位掩码所有位都为1，不影响输出，但如果我们将它设置为`0x00`，写入缓冲的所有模板值最后都会变成0.这与深度测试中的glDepthMask(GL_FALSE)是等价的。

```c++ nums
glStencilMask(0xFF); // 每一位写入模板缓冲时都保持原样
glStencilMask(0x00); // 每一位在写入模板缓冲时都会变成0（禁用写入）
```

大部分情况下你都只会使用`0x00`或者`0xFF`作为模板掩码(Stencil Mask)，但是知道有选项可以设置自定义的位掩码总是好的。

### 模板函数

和深度测试一样，我们对模板缓冲应该通过还是失败，以及它应该如何影响模板缓冲，也是有一定控制的。一共有两个函数能够用来配置模板测试：`glStencilFunc`和`glStencilOp`。

**glStencilFunc(GLenum func, GLint ref, GLuint mask)描述了OpenGL应该对模板缓冲内容做什么。**一共包含三个参数：

- `func`：设置模板测试函数(Stencil Test Function)。这个测试函数将会应用到已储存的模板值上和`glStencilFunc`函数的`ref`值上。可用的选项有：GL_NEVER、GL_LESS、GL_LEQUAL、GL_GREATER、GL_GEQUAL、GL_EQUAL、GL_NOTEQUAL和GL_ALWAYS。它们的语义和深度缓冲的函数类似。
- `ref`：设置了模板测试的参考值(Reference Value)。模板缓冲的内容将会与这个值进行比较。
- `mask`：设置一个掩码，它将会与参考值和储存的模板值在测试比较它们之前进行与(AND)运算。初始情况下所有位都为1。

在一开始的那个简单的模板例子中，函数被设置为：

```less
glStencilFunc(GL_EQUAL, 1, 0xFF)
```

这会告诉OpenGL，只要一个片段的模板值等于(`GL_EQUAL`)参考值1，片段将会通过测试并被绘制，否则会被丢弃。



**glStencilOp(GLenum sfail, GLenum dpfail, GLenum dppass)一描述了如何更新缓冲。**共包含三个选项，我们能够设定每个选项应该采取的行为：

- `sfail`：模板测试失败时采取的行为。
- `dpfail`：模板测试通过，但深度测试失败时采取的行为。
- `dppass`：模板测试和深度测试都通过时采取的行为。

每个选项都可以选用以下的其中一种行为：

| 行为         | 描述                                               |
| :----------- | :------------------------------------------------- |
| GL_KEEP      | 保持当前储存的模板值                               |
| GL_ZERO      | 将模板值设置为0                                    |
| GL_REPLACE   | 将模板值设置为glStencilFunc函数设置的`ref`值       |
| GL_INCR      | 如果模板值小于最大值则将模板值加1                  |
| GL_INCR_WRAP | 与GL_INCR一样，但如果模板值超过了最大值则归零      |
| GL_DECR      | 如果模板值大于最小值则将模板值减1                  |
| GL_DECR_WRAP | 与GL_DECR一样，但如果模板值小于0则将其设置为最大值 |
| GL_INVERT    | 按位翻转当前的模板缓冲值                           |

**默认情况下glStencilOp是设置为`(GL_KEEP, GL_KEEP, GL_KEEP)`的，所以不论任何测试的结果是如何，模板缓冲都会保留它的值。**默认的行为不会更新模板缓冲，所以如果你想写入模板缓冲的话，你需要至少对其中一个选项设置不同的值。

所以，通过使用glStencilFunc和glStencilOp，我们可以精确地指定更新模板缓冲的时机与行为了，我们也可以指定什么时候该让模板缓冲通过，即什么时候片段需要被丢弃。

### 物体轮廓

仅仅看了前面的部分你还是不太可能能够完全理解模板测试的工作原理，所以我们将会展示一个使用模板测试就可以完成的有用特性，它叫做物体轮廓(Object Outlining)。

![[stencil_object_outlining.png|img]]

物体轮廓所能做的事情正如它名字所描述的那样。我们将会为每个（或者一个）物体在它的周围创建一个很小的有色边框。当你想要在策略游戏中选中一个单位进行操作的，想要告诉玩家选中的是哪个单位的时候，这个效果就非常有用了。为物体创建轮廓的步骤如下：

1. 在绘制（需要添加轮廓的）物体之前，将模板函数设置为GL_ALWAYS，每当物体的片段被渲染时，将模板缓冲更新为1。
2. 渲染物体。
3. 禁用模板写入以及深度测试。
4. 将每个物体缩放一点点。
5. 使用一个不同的片元着色器，输出一个单独的（边框）颜色。
6. 再次绘制物体，但只在它们片段的模板值不等于1时才绘制。
7. 再次启用模板写入和深度测试。

这个过程将每个物体的片段的模板缓冲设置为1，当我们想要绘制边框的时候，我们主要绘制放大版本的物体中模板测试通过的部分，也就是物体的边框的位置。我们主要使用模板缓冲丢弃了放大版本中属于原物体片段的部分。

所以我们首先来创建一个很简单的片元着色器，它会输出一个边框颜色。我们简单地给它设置一个硬编码的颜色值，将这个着色器命名为shaderSingleColor：

```c++ nums
void main()
{
    FragColor = vec4(0.04, 0.28, 0.26, 1.0);
}
```

我们只想给那两个箱子加上边框，所以我们让地板不参与这个过程。我们希望首先绘制地板，再绘制两个箱子（并写入模板缓冲），之后绘制放大的箱子（并丢弃覆盖了之前绘制的箱子片段的那些片段）。

我们首先启用模板测试，并设置测试通过或失败时的行为：

```c++ nums
glEnable(GL_STENCIL_TEST);
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);
```

如果其中的一个测试失败了，我们什么都不做，我们仅仅保留当前储存在模板缓冲中的值。如果模板测试和深度测试都通过了，那么我们希望将储存的模板值设置为参考值，参考值能够通过glStencilFunc来设置，我们之后会设置为1。

我们将模板缓冲清除为0，对箱子中所有绘制的片段，将模板值更新为1：

```c++ nums
glStencilFunc(GL_ALWAYS, 1, 0xFF); // 所有的片段都应该更新模板缓冲
glStencilMask(0xFF); // 启用模板缓冲写入
normalShader.use();
DrawTwoContainers();
```

通过使用GL_ALWAYS模板测试函数，我们保证了箱子的每个片段都会将模板缓冲的模板值更新为1。因为片段永远会通过模板测试，在绘制片段的地方，模板缓冲会被更新为参考值。

现在模板缓冲在箱子被绘制的地方都更新为1了，我们将要绘制放大的箱子，但这次要禁用模板缓冲的写入：

```c++ nums
glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
glStencilMask(0x00); // 禁止模板缓冲的写入
glDisable(GL_DEPTH_TEST);
shaderSingleColor.use(); 
DrawTwoScaledUpContainers();
```

我们将模板函数设置为GL_NOTEQUAL，它会保证我们只绘制箱子上模板值不为1的部分，即只绘制箱子在之前绘制的箱子之外的部分。注意我们也禁用了深度测试，让放大的箱子，即边框，不会被地板所覆盖。

记得要在完成之后重新启用深度缓冲。

场景中物体轮廓的完整步骤会看起来像这样：

```c++ nums
glEnable(GL_DEPTH_TEST);
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);  

glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT); 

glStencilMask(0x00); // 记得保证我们在绘制地板的时候不会更新模板缓冲
normalShader.use();
DrawFloor()  

glStencilFunc(GL_ALWAYS, 1, 0xFF); 
glStencilMask(0xFF); 
DrawTwoContainers();

glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
glStencilMask(0x00); 
glDisable(GL_DEPTH_TEST);
shaderSingleColor.use(); 
DrawTwoScaledUpContainers();
glStencilMask(0xFF);
glEnable(GL_DEPTH_TEST);  
```

只要你理解了模板缓冲背后的大体思路，这个代码片段就不是那么难理解了。如果还是不能理解的话，尝试再次仔细阅读之前的部分，并尝试通过上面使用的范例，完全理解每个函数的功能。

在[深度测试](https://learnopengl-cn.github.io/04 Advanced OpenGL/01 Depth testing/)小节的场景中，这个轮廓算法的结果看起来会像是这样的：

可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/2.stencil_testing/stencil_testing.cpp)查看源代码，看看物体轮廓算法的完整代码。

你可以看到这两个箱子的边框重合了，这通常都是我们想要的结果（想想策略游戏中，我们希望选择10个单位，合并边框通常是我们想需要的结果）。如果你想让每个物体都有一个完整的边框，你需要对每个物体都清空模板缓冲，并有创意地利用深度缓冲。

> 你看到的物体轮廓算法在需要显示选中物体的游戏（想想策略游戏）中非常常见。这样的算法能够在一个模型类中轻松实现。你可以在模型类中设置一个boolean标记，来设置需不需要绘制边框。如果你有创造力的话，你也可以使用后期处理滤镜(Filter)，像是高斯模糊(Gaussian Blur)，让边框看起来更自然。

除了物体轮廓之外，模板测试还有很多用途，比如在一个后视镜中绘制纹理，让它能够绘制到镜子形状中，或者使用一个叫做阴影体积(Shadow Volume)的模板缓冲技术渲染实时阴影。模板缓冲为我们已经很丰富的OpenGL工具箱又提供了一个很好的工具。

## 混合

OpenGL中，**混合(Blending)通常是实现物体透明度(Transparency)的一种技术。**透明就是说一个物体（或者其中的一部分）不是纯色(Solid Color)的，它的颜色是物体本身的颜色和它背后其它物体的颜色的不同强度结合。一个有色玻璃窗是一个透明的物体，玻璃有它自己的颜色，但它最终的颜色还包含了玻璃之后所有物体的颜色。这也是混合这一名字的出处，我们混合(Blend)（不同物体的）多种颜色为一种颜色。所以透明度能让我们看穿物体。

![[blending_transparency.png|img]]

透明的物体可以是完全透明的（让所有的颜色穿过），或者是半透明的（它让颜色通过，同时也会显示自身的颜色）。一个物体的透明度是通过它颜色的alpha值来决定的。Alpha颜色值是颜色向量的第四个分量，你可能已经看到过它很多遍了。在这个教程之前我们都将这个第四个分量设置为1.0，让这个物体的透明度为0.0，而当alpha值为0.0时物体将会是完全透明的。当alpha值为0.5时，物体的颜色有50%是来自物体自身的颜色，50%来自背后物体的颜色。

我们目前一直使用的纹理有三个颜色分量：红、绿、蓝。但一些材质会有一个内嵌的alpha通道，对每个纹素(Texel)都包含了一个alpha值。这个alpha值精确地告诉我们纹理各个部分的透明度。比如说，下面这个[窗户纹理](https://learnopengl-cn.github.io/img/04/03/blending_transparent_window.png)中的玻璃部分的alpha值为0.25（它在一般情况下是完全的红色，但由于它有75%的透明度，能让很大一部分的网站背景颜色穿过，让它看起来不那么红了），角落的alpha值是0.0。

![[blending_transparent_window.png|img]]

我们很快就会将这个窗户纹理添加到场景中，但是首先我们需要讨论一个更简单的技术，来实现只有完全透明和完全不透明的纹理的透明度。

### 丢弃片段

有些图片并不需要半透明，只需要根据纹理颜色值，显示一部分，或者不显示一部分，没有中间情况。比如说草，如果想不太费劲地创建草这种东西，你需要将一个草的纹理贴在一个2D四边形(Quad)上，然后将这个四边形放到场景中。然而，草的形状和2D四边形的形状并不完全相同，所以你只想显示草纹理的某些部分，而忽略剩下的部分。

下面这个纹理正是这样的，它要么是完全不透明的（alpha值为1.0），要么是完全透明的（alpha值为0.0），没有中间情况。你可以看到，只要不是草的部分，这个图片显示的都是网站的背景颜色而不是它本身的颜色。

![[grass.png|img]]

所以当添加像草这样的植被到场景中时，我们不希望看到草的方形图像，而是只显示草的部分，并能看透图像其余的部分。**我们想要丢弃(Discard)显示纹理中透明部分的片段，不将这些片段存储到颜色缓冲中。**在此之前，我们还要学习如何加载一个透明的纹理。

要想加载有alpha值的纹理，我们并不需要改很多东西，`stb_image`在纹理有alpha通道的时候会自动加载，但我们仍要在纹理生成过程中告诉OpenGL，我们的纹理现在使用alpha通道了：

```c++ nums
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
```

同样，保证你在片元着色器中获取了纹理的全部4个颜色分量，而不仅仅是RGB分量：

```c++ nums
void main()
{
    // FragColor = vec4(vec3(texture(texture1, TexCoords)), 1.0);
    FragColor = texture(texture1, TexCoords);
}
```

既然我们已经知道该如何加载透明的纹理了，是时候将它带入实战了，我们将会在[深度测试](https://learnopengl-cn.github.io/04 Advanced OpenGL/01 Depth testing/)小节的场景中加入几棵草。

我们会创建一个vector，向里面添加几个`glm::vec3`变量来代表草的位置：

```c++ nums
vector<glm::vec3> vegetation;
vegetation.push_back(glm::vec3(-1.5f,  0.0f, -0.48f));
vegetation.push_back(glm::vec3( 1.5f,  0.0f,  0.51f));
vegetation.push_back(glm::vec3( 0.0f,  0.0f,  0.7f));
vegetation.push_back(glm::vec3(-0.3f,  0.0f, -2.3f));
vegetation.push_back(glm::vec3( 0.5f,  0.0f, -0.6f));
```

每个草都被渲染到了一个四边形上，贴上草的纹理。这并不能完美地表示3D的草，但这比加载复杂的模型要快多了。使用一些小技巧，比如在同一个位置加入一些旋转后的草四边形，你仍然能获得比较好的结果的。

因为草的纹理是添加到四边形对象上的，我们还需要创建另外一个VAO，填充VBO，设置正确的顶点属性指针。接下来，在绘制完地板和两个立方体后，我们将会绘制草：

```c++ nums
glBindVertexArray(vegetationVAO);
glBindTexture(GL_TEXTURE_2D, grassTexture);  
for(unsigned int i = 0; i < vegetation.size(); i++) 
{
    model = glm::mat4(1.0f);
    model = glm::translate(model, vegetation[i]);               
    shader.setMat4("model", model);
    glDrawArrays(GL_TRIANGLES, 0, 6);
}
```

运行程序你将看到：

![[blending_no_discard.png|img]]

出现这种情况是因为**OpenGL默认是不知道怎么处理alpha值的，更不知道什么时候应该丢弃片段。我们需要自己手动来弄。**幸运的是，有了着色器，这还是非常容易的。**GLSL给了我们`discard`命令，一旦被调用，它就会保证片段不会被进一步处理，所以就不会进入颜色缓冲。有了这个指令，我们就能够在片元着色器中检测一个片段的alpha值是否低于某个阈值，如果是的话，则丢弃这个片段，就好像它不存在一样：**

```c++ nums
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D texture1;

void main()
{             
    vec4 texColor = texture(texture1, TexCoords);
    if(texColor.a < 0.1)
        discard;
    FragColor = texColor;
}
```

这里，我们检测被采样的纹理颜色的alpha值是否低于0.1的阈值，如果是的话，则丢弃这个片段。片元着色器保证了它只会渲染不是（几乎）完全透明的片段。现在它看起来就正常了：

![[blending_discard.png|img]]

> 注意，当采样纹理的边缘的时候，OpenGL会对边缘的值和纹理下一个重复的值进行插值（因为我们将它的环绕方式设置为了GL_REPEAT。这通常是没问题的，但是由于我们使用了透明值，纹理图像的顶部将会与底部边缘的纯色值进行插值。这样的结果是一个半透明的有色边框，你可能会看见它环绕着你的纹理四边形。要想避免这个，每当你alpha纹理的时候，请将纹理的环绕方式设置为GL_CLAMP_TO_EDGE：
>
> ```less
> glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
> glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
> ```

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/3.1.blending_discard/blending_discard.cpp)找到源码。

### 混合

虽然直接丢弃片段很好，但它不能让我们渲染半透明的图像。我们要么渲染一个片段，要么完全丢弃它。要**想渲染有多个透明度级别的图像，我们需要启用混合(Blending)**。和OpenGL大多数的功能一样，我们可以启用GL_BLEND来启用混合：

```
glEnable(GL_BLEND);
```

启用了混合之后，我们需要告诉OpenGL它该**如何**混合。

OpenGL中的混合是通过下面这个方程来实现的：

![[image-20220927202954188.png]]

片元着色器运行完成后，并且所有的测试都通过之后，这个混合方程(Blend Equation)才会应用到片段颜色输出与当前颜色缓冲中的值（当前片段之前储存的之前片段的颜色）上。源颜色和目标颜色将会由OpenGL自动设定，但源因子和目标因子的值可以由我们来决定。我们先来看一个简单的例子：

![[blending_equation.png|img]]

我们有两个方形，我们希望将这个半透明的绿色方形绘制在红色方形之上。红色的方形将会是目标颜色（所以它应该先在颜色缓冲中），我们将要在这个红色方形之上绘制这个绿色方形。

问题来了：我们将因子值设置为什么？嘛，我们至少想让绿色方形乘以它的alpha值，所以我们想要将FsrcFsrc设置为源颜色向量的alpha值，也就是0.6。接下来就应该清楚了，目标方形的贡献应该为剩下的alpha值。如果绿色方形对最终颜色贡献了60%，那么红色方块应该对最终颜色贡献了40%，即`1.0 - 0.6`。所以我们将FdestinationFdestination设置为1减去源颜色向量的alpha值。这个方程变成了：

![[image-20220927203008812.png]]

结果就是重叠方形的片段包含了一个60%绿色，40%红色的一种脏兮兮的颜色：

![[blending_equation_mixed.png|img]]

最终的颜色将会被储存到颜色缓冲中，替代之前的颜色。

这样子很不错，但我们该如何让OpenGL使用这样的因子呢？正好有一个专门的函数，叫做`glBlendFunc`。

`glBlendFunc(GLenum sfactor, GLenum dfactor)`函数接受两个参数，来设置源和目标因子。OpenGL为我们定义了很多个选项，我们将在下面列出大部分最常用的选项。注意常数颜色向量![[image-20220927210306459.png]]可以通过`glBlendColor`函数来另外设置。

| 选项                          | 值                                                      |
| :---------------------------- | :------------------------------------------------------ |
| `GL_ZERO`                     | 因子等于00                                              |
| `GL_ONE`                      | 因子等于11                                              |
| `GL_SRC_COLOR`                | 因子等于源颜色向量C¯sourceC¯source                      |
| `GL_ONE_MINUS_SRC_COLOR`      | 因子等于1−C¯source1−C¯source                            |
| `GL_DST_COLOR`                | 因子等于目标颜色向量C¯destinationC¯destination          |
| `GL_ONE_MINUS_DST_COLOR`      | 因子等于1−C¯destination1−C¯destination                  |
| `GL_SRC_ALPHA`                | 因子等于C¯sourceC¯source的alphaalpha分量                |
| `GL_ONE_MINUS_SRC_ALPHA`      | 因子等于1−1− C¯sourceC¯source的alphaalpha分量           |
| `GL_DST_ALPHA`                | 因子等于C¯destinationC¯destination的alphaalpha分量      |
| `GL_ONE_MINUS_DST_ALPHA`      | 因子等于1−1− C¯destinationC¯destination的alphaalpha分量 |
| `GL_CONSTANT_COLOR`           | 因子等于常数颜色向量C¯constantC¯constant                |
| `GL_ONE_MINUS_CONSTANT_COLOR` | 因子等于1−C¯constant1−C¯constant                        |
| `GL_CONSTANT_ALPHA`           | 因子等于C¯constantC¯constant的alphaalpha分量            |
| `GL_ONE_MINUS_CONSTANT_ALPHA` | 因子等于1−1− C¯constantC¯constant的alphaalpha分量       |

为了获得之前两个方形的混合结果，我们需要使用源颜色向量的alpha作为源因子，使用1−alpha1作为目标因子。这将会产生以下的glBlendFunc：

```c++ nums
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
```

也可以使用glBlendFuncSeparate为RGB和alpha通道分别设置不同的选项：

```c++ nums
glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_ONE, GL_ZERO);
```

这个函数和我们之前设置的那样设置了RGB分量，但这样只能让最终的alpha分量被源颜色向量的alpha值所影响到。

OpenGL甚至给了我们更多的灵活性，允许我们改变方程中源和目标部分的运算符。当前源和目标是相加的，但如果愿意的话，我们也可以让它们相减。glBlendEquation(GLenum mode)允许我们设置运算符，它提供了三个选项：

![[image-20220927203053134.png]]

通常我们都可以省略调用glBlendEquation，因为GL_FUNC_ADD对大部分的操作来说都是我们希望的混合方程，但如果你真的想打破主流，其它的方程也可能符合你的要求。

### 渲染半透明纹理

既然我们已经知道OpenGL是如何处理混合的了，是时候将我们的知识运用到实战中了，我们将会在场景中添加几个半透明的窗户。我们将使用本节开始的那个场景，但是这次不再是渲染草的纹理了，我们现在将使用本节开始时的那个[透明的窗户](https://learnopengl-cn.github.io/img/04/03/blending_transparent_window.png)纹理。

首先，在初始化时我们启用混合，并设定相应的混合函数：

```c++ nums
glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
```

由于启用了混合，我们就不需要丢弃片段了，所以我们把片元着色器还原：

```c++ nums
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D texture1;

void main()
{             
    FragColor = texture(texture1, TexCoords);
}
```

现在（每当OpenGL渲染了一个片段时）它都会将当前片段的颜色和当前颜色缓冲中的片段颜色根据alpha值来进行混合。由于窗户纹理的玻璃部分是半透明的，我们应该能通窗户中看到背后的场景了。

![[blending_incorrect_order.png|img]]

如果你仔细看的话，你可能会注意到有些不对劲。**最前面窗户的透明部分遮蔽了背后的窗户？这为什么会发生呢？**

**发生这一现象的原因是，深度测试和混合一起使用的话会产生一些麻烦。当写入深度缓冲时，深度缓冲不会检查片段是否是透明的，所以透明的部分会和其它值一样写入到深度缓冲中。结果就是窗户的整个四边形不论透明度都会进行深度测试。即使透明的部分应该显示背后的窗户，深度测试仍然丢弃了它们。**

所以我们不能随意地决定如何渲染窗户，让深度缓冲解决所有的问题了。这也是混合变得有些麻烦的部分。要想保证窗户中能够显示它们背后的窗户，我们需要首先绘制背后的这部分窗户。这也就是说在绘制的时候，我们必须先手动将窗户按照最远到最近来排序，再按照顺序渲染。

> 注意，对于草这种全透明的物体，我们可以选择丢弃透明的片段而不是混合它们，这样就解决了这些头疼的问题（没有深度问题）。

### 不要打乱顺序

**要想让混合在多个物体上工作，我们需要最先绘制最远的物体，最后绘制最近的物体。**普通不需要混合的物体仍然可以使用深度缓冲正常绘制，所以它们不需要排序。但我们仍要保证它们在绘制（排序的）透明物体之前已经绘制完毕了。当绘制一个有不透明和透明物体的场景的时候，大体的原则如下：

1. 先绘制所有不透明的物体。
2. 对所有透明的物体排序。
3. 按顺序绘制所有透明的物体。

排序透明物体的一种方法是，从观察者视角获取物体的距离。这可以通过计算摄像机位置向量和物体的位置向量之间的距离所获得。接下来我们把距离和它对应的位置向量存储到一个STL库的map数据结构中。map会自动根据键值(Key)对它的值排序，所以只要我们添加了所有的位置，并以它的距离作为键，它们就会自动根据距离值排序了。

```c++ nums
std::map<float, glm::vec3> sorted;
for (unsigned int i = 0; i < windows.size(); i++)
{
    float distance = glm::length(camera.Position - windows[i]);
    sorted[distance] = windows[i];
}
```

结果就是一个排序后的容器对象，它根据distance键值从低到高储存了每个窗户的位置。

之后，这次在渲染的时候，我们将以逆序（从远到近）从map中获取值，之后以正确的顺序绘制对应的窗户：

```c++ nums
for(std::map<float,glm::vec3>::reverse_iterator it = sorted.rbegin(); it != sorted.rend(); ++it) 
{
    model = glm::mat4();
    model = glm::translate(model, it->second);              
    shader.setMat4("model", model);
    glDrawArrays(GL_TRIANGLES, 0, 6);
}
```

我们使用了map的一个反向迭代器(Reverse Iterator)，反向遍历其中的条目，并将每个窗户四边形位移到对应的窗户位置上。这是排序透明物体的一个比较简单的实现，它能够修复之前的问题，现在场景看起来是这样的：

![[blending_sorted.png|img]]

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/3.2.blending_sort/blending_sorted.cpp)找到带有排序的完整源代码。

虽然按照距离排序物体这种方法对我们这个场景能够正常工作，但它并没有考虑旋转、缩放或者其它的变换，奇怪形状的物体需要一个不同的计量，而不是仅仅一个位置向量。

在场景中排序物体是一个很困难的技术，很大程度上由你场景的类型所决定，更别说它额外需要消耗的处理能力了。完整渲染一个包含不透明和透明物体的场景并不是那么容易。更高级的技术还有次序无关透明度(Order Independent Transparency, OIT)，但这超出本教程的范围了。现在，你还是必须要普通地混合你的物体，但如果你很小心，并且知道目前方法的限制的话，你仍然能够获得一个比较不错的混合实现。

## 面剔除

尝试在脑子中想象一个3D立方体，数数你从任意方向最多能同时看到几个面。如果你的想象力不是过于丰富了，你应该能得出最大的面数是3。你可以从任意位置和任意方向看向这个球体，但你永远不能看到3个以上的面。所以我们为什么要浪费时间绘制我们不能看见的那3个面呢？如果我们能够以某种方式丢弃这几个看不见的面，我们能省下超过50%的片元着色器执行数！

> 我说的是**超过**50%而不是50%，因为从特定角度来看的话只能看见2个甚至是1个面。在这种情况下，我们就能省下超过50%了。

这是一个很好的主意，但我们仍有一个问题需要解决：我们如何知道一个物体的某一个面不能从观察者视角看到呢？
如果我们想象任何一个闭合形状，它的每一个面都有两侧，每一侧要么**面向**用户，要么背对用户。如果我们能够只绘制**面向**观察者的面呢？

这正是面剔除(Face Culling)所做的。**OpenGL能够检查所有面向(Front Facing)观察者的面，并渲染它们，而丢弃那些背向(Back Facing)的面，节省我们很多的片元着色器调用**（它们的开销很大！）。但**我们仍要告诉OpenGL哪些面是正向面(Front Face)，哪些面是背向面(Back Face)。OpenGL使用了一个很聪明的技巧，分析顶点数据的环绕顺序(Winding Order)。**

### 环绕顺序

当我们定义一组三角形顶点时，我们会以特定的环绕顺序来定义它们，可能是顺时针(Clockwise)的，也可能是逆时针(Counter-clockwise)的。每个三角形由3个顶点所组成，我们会从三角形中间来看，为这3个顶点设定一个环绕顺序。

![[faceculling_windingorder.png|img]]

可以看到，我们首先定义了顶点1，之后我们可以选择定义顶点2或者顶点3，这个选择将定义了这个三角形的环绕顺序。下面的代码展示了这点：

```c++ nums
float vertices[] = {
    // 顺时针
    vertices[0], // 顶点1
    vertices[1], // 顶点2
    vertices[2], // 顶点3
    // 逆时针
    vertices[0], // 顶点1
    vertices[2], // 顶点3
    vertices[1]  // 顶点2  
};
```

每组组成三角形图元的三个顶点就包含了一个环绕顺序。OpenGL在渲染图元的时候将使用这个信息来决定一个三角形是一个正向三角形还是背向三角形。**默认情况下，逆时针顶点所定义的三角形将会被处理为正向三角形。**

当你定义顶点顺序的时候，你应该想象对应的三角形是面向你的，所以你定义的三角形从正面看去应该是逆时针的。这样定义顶点很棒的一点是，实际的环绕顺序是在光栅化阶段进行的，也就是顶点着色器运行之后。这些顶点就是从**观察者视角**所见的了。

**观察者所面向的所有三角形顶点就是我们所指定的正确环绕顺序了，而立方体另一面的三角形顶点则是以相反的环绕顺序所渲染的。**这样的结果就是，我们所面向的三角形将会是正向三角形，而背面的三角形则是背向三角形。下面这张图显示了这个效果：

![[faceculling_frontback.png|img]]

在顶点数据中，我们将两个三角形都以逆时针顺序定义（正面的三角形是1、2、3，背面的三角形也是1、2、3（如果我们从正面看这个三角形的话））。然而，如果从观察者当前视角使用1、2、3的顺序来绘制的话，从观察者的方向来看，背面的三角形将会是以顺时针顺序渲染的。虽然背面的三角形是以逆时针定义的，它现在是以顺时针顺序渲染的了。这正是我们想要剔除（Cull，丢弃）的不可见面了！

在顶点数据中，我们定义的是两个逆时针顺序的三角形。然而，从观察者的方面看，后面的三角形是顺时针的，如果我们仍以1、2、3的顺序以观察者当面的视野看的话。即使我们以逆时针顺序定义后面的三角形，它现在还是变为顺时针。它正是我们打算剔除（丢弃）的不可见的面！

### 面剔除

在本节的开头我们就说过，OpenGL能够丢弃那些渲染为背向三角形的三角形图元。既然已经知道如何设置顶点的环绕顺序了，我们就可以使用OpenGL的面剔除选项了，它默认是禁用状态的。

在之前教程中使用的立方体顶点数据并不是按照逆时针环绕顺序定义的，所以我更新了顶点数据，来反映逆时针的环绕顺序，你可以从[这里](https://learnopengl.com/code_viewer.php?code=advanced/faceculling_vertexdata)复制它们。尝试想象这些顶点，确认在每个三角形中它们都是以逆时针定义的，这是一个很好的习惯。

**要想启用面剔除，我们只需要启用OpenGL的`GL_CULL_FACE`选项：**

```c++ nums
glEnable(GL_CULL_FACE);
```

从这一句代码之后，所有背向面都将被丢弃（尝试飞进立方体内部，看看所有的内面是不是都被丢弃了）。目前我们在渲染片段的时候能够节省50%以上的性能，但注意这只对像立方体这样的封闭形状有效。当我们想要绘制[上一节](https://learnopengl-cn.github.io/04 Advanced OpenGL/03 Blending/)中的草时，我们必须要再次禁用面剔除，因为它们的正向面和背向面都应该是可见的。

OpenGL允许我们改变需要剔除的面的类型。如果我们只想剔除正向面而不是背向面会怎么样？我们可以调用glCullFace来定义这一行为：

```c++ nums
glCullFace(GL_FRONT);
```

glCullFace函数有三个可用的选项：

- `GL_BACK`：只剔除背向面。
- `GL_FRONT`：只剔除正向面。
- `GL_FRONT_AND_BACK`：剔除正向面和背向面。

glCullFace的初始值是GL_BACK。除了需要剔除的面之外，我们也可以通过调用glFrontFace，告诉OpenGL我们希望将顺时针的面（而不是逆时针的面）定义为正向面：

```c++ nums
glFrontFace(GL_CCW);
```

默认值是GL_CCW，它代表的是逆时针的环绕顺序，另一个选项是GL_CW，它（显然）代表的是顺时针顺序。

我们可以来做一个实验，告诉OpenGL现在顺时针顺序代表的是正向面：

```c++ nums
glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);
glFrontFace(GL_CW);
```

这样的结果是只有背向面被渲染了：

![[faceculling_reverse.png|img]]

注意你可以仍使用默认的逆时针环绕顺序，但剔除正向面，来达到相同的效果：

```c++ nums
glEnable(GL_CULL_FACE);
glCullFace(GL_FRONT);
```

可以看到，面剔除是一个提高OpenGL程序性能的很棒的工具。但你需要记住哪些物体能够从面剔除中获益，而哪些物体不应该被剔除。

## 帧缓冲（未学习）

到目前为止，我们已经使用了很多屏幕缓冲了：**用于写入颜色值的颜色缓冲、用于写入深度信息的深度缓冲和允许我们根据一些条件丢弃特定片段的模板缓冲。这些缓冲结合起来叫做帧缓冲(Framebuffer)，它被储存在内存中。**OpenGL允许我们定义我们自己的帧缓冲，也就是说我们能够定义我们自己的颜色缓冲，甚至是深度缓冲和模板缓冲。

我们目前所做的所有操作都是在默认帧缓冲的渲染缓冲上进行的。默认的帧缓冲是在你创建窗口的时候生成和配置的（GLFW帮我们做了这些）。有了我们自己的帧缓冲，我们就能够有更多方式来渲染了。

你可能不能很快理解帧缓冲的应用，但渲染你的场景到不同的帧缓冲能够让我们在场景中加入类似镜子的东西，或者做出很酷的后期处理效果。首先我们会讨论它是如何工作的，之后我们将来实现这些炫酷的后期处理效果。

### 创建一个帧缓冲

和OpenGL中的其它对象一样，我们会使用一个叫做`glGenFramebuffers`的函数来创建一个帧缓冲对象(Framebuffer Object, FBO)：

```c++ nums
unsigned int fbo;
glGenFramebuffers(1, &fbo);
```

首先我们创建一个帧缓冲对象，将它绑定为激活的(Active)帧缓冲，做一些操作，之后解绑帧缓冲。我们使用`glBindFramebuffer`来绑定帧缓冲。

```less
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
```

在绑定到GL_FRAMEBUFFER目标之后，所有的**读取**和**写入**帧缓冲的操作将会影响当前绑定的帧缓冲。我们也可以使用`GL_READ_FRAMEBUFFER`或`GL_DRAW_FRAMEBUFFER`，将一个帧缓冲分别绑定到读取目标或写入目标。绑定到GL_READ_FRAMEBUFFER的帧缓冲将会使用在所有像是`glReadPixels`的读取操作中，而绑定到`GL_DRAW_FRAMEBUFFER`的帧缓冲将会被用作渲染、清除等写入操作的目标。大部分情况你都不需要区分它们，**通常都会使用`GL_FRAMEBUFFER`，绑定到两个上。**

不幸的是，我们现在还不能使用我们的帧缓冲，因为它还不完整(Complete)，**一个完整的帧缓冲需要满足以下的条件：**

- 附加至少一个缓冲（颜色、深度或模板缓冲）。
- 至少有一个**颜色附件(Attachment)**。
- 所有的附件都必须是完整的（保留了内存）。
- 每个缓冲都应该有相同的**样本**数。

如果你不知道什么是样本，不要担心，我们将在[之后的](https://learnopengl-cn.github.io/04 Advanced OpenGL/11 Anti Aliasing/)教程中讲到。

从上面的条件中可以知道，我们需要为帧缓冲创建一些附件，并将附件附加到帧缓冲上。在完成所有的条件之后，我们可以以`GL_FRAMEBUFFE`R为参数调用`glCheckFramebufferStatus`，检查帧缓冲是否完整。它将会检测当前绑定的帧缓冲，并返回规范中[这些](https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/glCheckFramebufferStatus.xhtml)值的其中之一。如果它返回的是`GL_FRAMEBUFFER_COMPLETE`，帧缓冲就是完整的了。

```less
if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
  // 执行胜利的舞蹈
```

之后所有的渲染操作将会渲染到当前绑定帧缓冲的附件中。**由于我们的帧缓冲不是默认帧缓冲，渲染指令将不会对窗口的视觉输出有任何影响。出于这个原因，渲染到一个不同的帧缓冲被叫做离屏渲染(Off-screen Rendering)。要保证所有的渲染操作在主窗口中有视觉效果，我们需要再次激活默认帧缓冲，将它绑定到`0`。**

```c++ nums
glBindFramebuffer(GL_FRAMEBUFFER, 0);
```

在完成所有的帧缓冲操作之后，不要忘记删除这个帧缓冲对象：

```less
glDeleteFramebuffers(1, &fbo);
```

在完整性检查执行之前，我们需要给帧缓冲附加一个附件。**附件是一个内存位置，它能够作为帧缓冲的一个缓冲，可以将它想象为一个图像。当创建一个附件的时候我们有两个选项：纹理或渲染缓冲对象(Renderbuffer Object)。**

### 纹理附件

当把一个纹理附加到帧缓冲的时候，所有的渲染指令将会写入到这个纹理中，就像它是一个普通的颜色/深度或模板缓冲一样。**使用纹理的优点是，所有渲染操作的结果将会被储存在一个纹理图像中，我们之后可以在着色器中很方便地使用它。**

为帧缓冲创建一个纹理和创建一个普通的纹理差不多：

```less
unsigned int texture;
glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D, texture);

glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 800, 600, 0, GL_RGB, GL_UNSIGNED_BYTE, NULL);

glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
```

主要的区别就是，我们将维度设置为了屏幕大小（尽管这不是必须的），并且我们给纹理的`data`参数传递了`NULL`。对于这个纹理，我们仅仅分配了内存而没有填充它。填充这个纹理将会在我们渲染到帧缓冲之后来进行。同样注意我们并不关心环绕方式或多级渐远纹理，我们在大多数情况下都不会需要它们。

> 如果你想将你的屏幕渲染到一个更小或更大的纹理上，你需要（在渲染到你的帧缓冲之前）再次调用glViewport，使用纹理的新维度作为参数，否则只有一小部分的纹理或屏幕会被渲染到这个纹理上。

现在我们已经创建好一个纹理了，要做的最后一件事就是将它附加到帧缓冲上了：

```
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture, 0);
```

glFrameBufferTexture2D有以下的参数：

- `target`：帧缓冲的目标（绘制、读取或者两者皆有）
- `attachment`：我们想要附加的附件类型。当前我们正在附加一个颜色附件。注意最后的`0`意味着我们可以附加多个颜色附件。我们将在之后的教程中提到。
- `textarget`：你希望附加的纹理类型
- `texture`：要附加的纹理本身
- `level`：多级渐远纹理的级别。我们将它保留为0。

除了颜色附件之外，我们还可以附加一个深度和模板缓冲纹理到帧缓冲对象中。要附加深度缓冲的话，我们将附件类型设置为GL_DEPTH_ATTACHMENT。注意纹理的格式(Format)和内部格式(Internalformat)类型将变为GL_DEPTH_COMPONENT，来反映深度缓冲的储存格式。要附加模板缓冲的话，你要将第二个参数设置为GL_STENCIL_ATTACHMENT，并将纹理的格式设定为GL_STENCIL_INDEX。

也可以将深度缓冲和模板缓冲附加为一个单独的纹理。纹理的每32位数值将包含24位的深度信息和8位的模板信息。要将深度和模板缓冲附加为一个纹理的话，我们使用GL_DEPTH_STENCIL_ATTACHMENT类型，并配置纹理的格式，让它包含合并的深度和模板值。将一个深度和模板缓冲附加为一个纹理到帧缓冲的例子可以在下面找到：

```
glTexImage2D(
  GL_TEXTURE_2D, 0, GL_DEPTH24_STENCIL8, 800, 600, 0, 
  GL_DEPTH_STENCIL, GL_UNSIGNED_INT_24_8, NULL
);

glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_TEXTURE_2D, texture, 0);
```

### 渲染缓冲对象附件

渲染缓冲对象(Renderbuffer Object)是在纹理之后引入到OpenGL中，作为一个可用的帧缓冲附件类型的，所以在过去纹理是唯一可用的附件。和纹理图像一样，渲染缓冲对象是一个真正的缓冲，即一系列的字节、整数、像素等。渲染缓冲对象附加的好处是，它会将数据储存为OpenGL原生的渲染格式，它是为离屏渲染到帧缓冲优化过的。

渲染缓冲对象直接将所有的渲染数据储存到它的缓冲中，不会做任何针对纹理格式的转换，让它变为一个更快的可写储存介质。然而，渲染缓冲对象通常都是只写的，所以你不能读取它们（比如使用纹理访问）。当然你仍然还是能够使用glReadPixels来读取它，这会从当前绑定的帧缓冲，而不是附件本身，中返回特定区域的像素。

因为它的数据已经是原生的格式了，当写入或者复制它的数据到其它缓冲中时是非常快的。所以，交换缓冲这样的操作在使用渲染缓冲对象时会非常快。我们在每个渲染迭代最后使用的glfwSwapBuffers，也可以通过渲染缓冲对象实现：只需要写入一个渲染缓冲图像，并在最后交换到另外一个渲染缓冲就可以了。渲染缓冲对象对这种操作非常完美。

创建一个渲染缓冲对象的代码和帧缓冲的代码很类似：

```
unsigned int rbo;
glGenRenderbuffers(1, &rbo);
```

类似，我们需要绑定这个渲染缓冲对象，让之后所有的渲染缓冲操作影响当前的rbo：

```
glBindRenderbuffer(GL_RENDERBUFFER, rbo);
```

由于渲染缓冲对象通常都是只写的，它们会经常用于深度和模板附件，因为大部分时间我们都不需要从深度和模板缓冲中读取值，只关心深度和模板测试。我们**需要**深度和模板值用于测试，但不需要对它们进行**采样**，所以渲染缓冲对象非常适合它们。当我们不需要从这些缓冲中采样的时候，通常都会选择渲染缓冲对象，因为它会更优化一点。

创建一个深度和模板渲染缓冲对象可以通过调用glRenderbufferStorage函数来完成：

```
glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, 800, 600);
```

创建一个渲染缓冲对象和纹理对象类似，不同的是这个对象是专门被设计作为帧缓冲附件使用的，而不是纹理那样的通用数据缓冲(General Purpose Data Buffer)。这里我们选择GL_DEPTH24_STENCIL8作为内部格式，它封装了24位的深度和8位的模板缓冲。

最后一件事就是附加这个渲染缓冲对象：

```
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);
```

渲染缓冲对象能为你的帧缓冲对象提供一些优化，但知道什么时候使用渲染缓冲对象，什么时候使用纹理是很重要的。通常的规则是，如果你不需要从一个缓冲中采样数据，那么对这个缓冲使用渲染缓冲对象会是明智的选择。如果你需要从缓冲中采样颜色或深度值等数据，那么你应该选择纹理附件。性能方面它不会产生非常大的影响的。

### 渲染到纹理

既然我们已经知道帧缓冲（大概）是怎么工作的了，是时候实践它们了。我们将会将场景渲染到一个附加到帧缓冲对象上的颜色纹理中，之后将在一个横跨整个屏幕的四边形上绘制这个纹理。这样视觉输出和没使用帧缓冲时是完全一样的，但这次是打印到了一个四边形上。这为什么很有用呢？我们会在下一部分中知道原因。

首先要创建一个帧缓冲对象，并绑定它，这些都很直观：

```
unsigned int framebuffer;
glGenFramebuffers(1, &framebuffer);
glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
```

接下来我们需要创建一个纹理图像，我们将它作为一个颜色附件附加到帧缓冲上。我们将纹理的维度设置为窗口的宽度和高度，并且不初始化它的数据：

```
// 生成纹理
unsigned int texColorBuffer;
glGenTextures(1, &texColorBuffer);
glBindTexture(GL_TEXTURE_2D, texColorBuffer);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 800, 600, 0, GL_RGB, GL_UNSIGNED_BYTE, NULL);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glBindTexture(GL_TEXTURE_2D, 0);

// 将它附加到当前绑定的帧缓冲对象
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texColorBuffer, 0);  
```

我们还希望OpenGL能够进行深度测试（如果你需要的话还有模板测试），所以我们还需要添加一个深度（和模板）附件到帧缓冲中。由于我们只希望采样颜色缓冲，而不是其它的缓冲，我们可以为它们创建一个渲染缓冲对象。还记得当我们不需要采样缓冲的时候，渲染缓冲对象是更好的选择吗？

创建一个渲染缓冲对象不是非常复杂。我们需要记住的唯一事情是，我们将它创建为一个深度**和**模板附件渲染缓冲对象。我们将它的**内部**格式设置为GL_DEPTH24_STENCIL8，对我们来说这个精度已经足够了。

```
unsigned int rbo;
glGenRenderbuffers(1, &rbo);
glBindRenderbuffer(GL_RENDERBUFFER, rbo); 
glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, 800, 600);  
glBindRenderbuffer(GL_RENDERBUFFER, 0);
```

当我们为渲染缓冲对象分配了足够的内存之后，我们可以解绑这个渲染缓冲。

接下来，作为完成帧缓冲之前的最后一步，我们将渲染缓冲对象附加到帧缓冲的深度**和**模板附件上：

```
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);
```

最后，我们希望检查帧缓冲是否是完整的，如果不是，我们将打印错误信息。

```
if(glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
    std::cout << "ERROR::FRAMEBUFFER:: Framebuffer is not complete!" << std::endl;
glBindFramebuffer(GL_FRAMEBUFFER, 0);
```

记得要解绑帧缓冲，保证我们不会不小心渲染到错误的帧缓冲上。

现在这个帧缓冲就完整了，我们只需要绑定这个帧缓冲对象，让渲染到帧缓冲的缓冲中而不是默认的帧缓冲中。之后的渲染指令将会影响当前绑定的帧缓冲。所有的深度和模板操作都会从当前绑定的帧缓冲的深度和模板附件中（如果有的话）读取。如果你忽略了深度缓冲，那么所有的深度测试操作将不再工作，因为当前绑定的帧缓冲中不存在深度缓冲。

所以，要想绘制场景到一个纹理上，我们需要采取以下的步骤：

1. 将新的帧缓冲绑定为激活的帧缓冲，和往常一样渲染场景
2. 绑定默认的帧缓冲
3. 绘制一个横跨整个屏幕的四边形，将帧缓冲的颜色缓冲作为它的纹理。

我们将会绘制[深度测试](https://learnopengl-cn.github.io/04 Advanced OpenGL/01 Depth testing/)小节中的场景，但这次使用的是旧的[箱子](https://learnopengl-cn.github.io/img/04/05/container.jpg)纹理。

为了绘制这个四边形，我们将会新创建一套简单的着色器。我们将不会包含任何花哨的矩阵变换，因为我们提供的是标准化设备坐标的[顶点坐标](https://learnopengl.com/code_viewer.php?code=advanced/framebuffers_quad_vertices)，所以我们可以直接将它们设定为顶点着色器的输出。顶点着色器是这样的：

```less
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec2 aTexCoords;

out vec2 TexCoords;

void main()
{
    gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0); 
    TexCoords = aTexCoords;
}
```

并没有太复杂的东西。片元着色器会更加基础，我们做的唯一一件事就是从纹理中采样：

```
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;

void main()
{ 
    FragColor = texture(screenTexture, TexCoords);
}
```

接着就靠你来为屏幕四边形创建并配置一个VAO了。帧缓冲的一个渲染迭代将会有以下的结构：

```
// 第一处理阶段(Pass)
glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // 我们现在不使用模板缓冲
glEnable(GL_DEPTH_TEST);
DrawScene();    

// 第二处理阶段
glBindFramebuffer(GL_FRAMEBUFFER, 0); // 返回默认
glClearColor(1.0f, 1.0f, 1.0f, 1.0f); 
glClear(GL_COLOR_BUFFER_BIT);

screenShader.use();  
glBindVertexArray(quadVAO);
glDisable(GL_DEPTH_TEST);
glBindTexture(GL_TEXTURE_2D, textureColorbuffer);
glDrawArrays(GL_TRIANGLES, 0, 6);  
```

要注意一些事情。第一，由于我们使用的每个帧缓冲都有它自己一套缓冲，我们希望设置合适的位，调用glClear，清除这些缓冲。第二，当绘制四边形时，我们将禁用深度测试，因为我们是在绘制一个简单的四边形，并不需要关系深度测试。在绘制普通场景的时候我们将会重新启用深度测试。

有很多步骤都可能会出错，所以如果你没有得到输出的话，尝试调试程序，并重新阅读本节的相关部分。如果所有的东西都能够正常工作，你将会得到下面这样的视觉输出：

![[framebuffers_screen_texture.png|img]]

左边展示的是视觉输出，它和[深度测试](https://learnopengl-cn.github.io/04 Advanced OpenGL/01 Depth testing/)中是完全一样的，但这次是渲染在一个简单的四边形上。如果我们使用线框模式渲染场景，就会变得很明显，我们在默认的帧缓冲中只绘制了一个简单的四边形。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/5.1.framebuffers/framebuffers.cpp)找到程序的源代码。

所以这个有什么用处呢？因为我们能够以一个纹理图像的方式访问已渲染场景中的每个像素，我们可以在片元着色器中创建出非常有趣的效果。这些有趣效果统称为后期处理(Post-processing)效果。

### 后期处理

既然整个场景都被渲染到了一个纹理上，我们可以简单地通过修改纹理数据创建出一些非常有意思的效果。在这一部分中，我们将会向你展示一些流行的后期处理效果，并告诉你改如何使用创造力创建你自己的效果。

让我们先从最简单的后期处理效果开始。

#### 反相

我们现在能够访问渲染输出的每个颜色，所以在（译注：屏幕的）片元着色器中返回这些颜色的反相(Inversion)并不是很难。我们将会从屏幕纹理中取颜色值，然后用1.0减去它，对它进行反相：

```
void main()
{
    FragColor = vec4(vec3(1.0 - texture(screenTexture, TexCoords)), 1.0);
}
```

尽管反相是一个相对简单的后期处理效果，它已经能创造一些奇怪的效果了：

![[framebuffers_inverse.png|img]]

在片元着色器中仅仅使用一行代码，就能让整个场景的颜色都反相了。很酷吧？

#### 灰度

另外一个很有趣的效果是，移除场景中除了黑白灰以外所有的颜色，让整个图像灰度化(Grayscale)。很简单的实现方式是，取所有的颜色分量，将它们平均化：

```
void main()
{
    FragColor = texture(screenTexture, TexCoords);
    float average = (FragColor.r + FragColor.g + FragColor.b) / 3.0;
    FragColor = vec4(average, average, average, 1.0);
}
```

这已经能创造很好的结果了，但人眼会对绿色更加敏感一些，而对蓝色不那么敏感，所以为了获取物理上更精确的效果，我们需要使用加权的(Weighted)通道：

```
void main()
{
    FragColor = texture(screenTexture, TexCoords);
    float average = 0.2126 * FragColor.r + 0.7152 * FragColor.g + 0.0722 * FragColor.b;
    FragColor = vec4(average, average, average, 1.0);
}
```

![[framebuffers_grayscale.png|img]]

你可能不会立刻发现有什么差别，但在更复杂的场景中，这样的加权灰度效果会更真实一点。

#### 核效果

在一个纹理图像上做后期处理的另外一个好处是，我们可以从纹理的其它地方采样颜色值。比如说我们可以在当前纹理坐标的周围取一小块区域，对当前纹理值周围的多个纹理值进行采样。我们可以结合它们创建出很有意思的效果。

核(Kernel)（或卷积矩阵(Convolution Matrix)）是一个类矩阵的数值数组，它的中心为当前的像素，它会用它的核值乘以周围的像素值，并将结果相加变成一个值。所以，基本上我们是在对当前像素周围的纹理坐标添加一个小的偏移量，并根据核将结果合并。下面是核的一个例子：

![[image-20220927212556962.png]]

这个核取了8个周围像素值，将它们乘以2，而把当前的像素乘以-15。这个核的例子将周围的像素乘上了一个权重，并将当前像素乘以一个比较大的负权重来平衡结果。

> 你在网上找到的大部分核将所有的权重加起来之后都应该会等于1，如果它们加起来不等于1，这就意味着最终的纹理颜色将会比原纹理值更亮或者更暗了。

核是后期处理一个非常有用的工具，它们使用和实验起来都很简单，网上也能找到很多例子。我们需要稍微修改一下片元着色器，让它能够支持核。我们假设使用的核都是3x3核（实际上大部分核都是）：

```
const float offset = 1.0 / 300.0;  

void main()
{
    vec2 offsets[9] = vec2[](
        vec2(-offset,  offset), // 左上
        vec2( 0.0f,    offset), // 正上
        vec2( offset,  offset), // 右上
        vec2(-offset,  0.0f),   // 左
        vec2( 0.0f,    0.0f),   // 中
        vec2( offset,  0.0f),   // 右
        vec2(-offset, -offset), // 左下
        vec2( 0.0f,   -offset), // 正下
        vec2( offset, -offset)  // 右下
    );

    float kernel[9] = float[](
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
    );

    vec3 sampleTex[9];
    for(int i = 0; i < 9; i++)
    {
        sampleTex[i] = vec3(texture(screenTexture, TexCoords.st + offsets[i]));
    }
    vec3 col = vec3(0.0);
    for(int i = 0; i < 9; i++)
        col += sampleTex[i] * kernel[i];

    FragColor = vec4(col, 1.0);
}
```

在片元着色器中，我们首先为周围的纹理坐标创建了一个9个`vec2`偏移量的数组。偏移量是一个常量，你可以按照你的喜好自定义它。之后我们定义一个核，在这个例子中是一个锐化(Sharpen)核，它会采样周围的所有像素，锐化每个颜色值。最后，在采样时我们将每个偏移量加到当前纹理坐标上，获取需要采样的纹理，之后将这些纹理值乘以加权的核值，并将它们加到一起。

这个锐化核看起来是这样的：

![[framebuffers_sharpen.png|img]]

这能创建一些很有趣的效果，比如说你的玩家打了麻醉剂所感受到的效果。

#### 模糊

创建模糊(Blur)效果的核是这样的：

![[image-20220927212611407.png]]

由于所有值的和是16，所以直接返回合并的采样颜色将产生非常亮的颜色，所以我们需要将核的每个值都除以16。最终的核数组将会是：

```
float kernel[9] = float[](
    1.0 / 16, 2.0 / 16, 1.0 / 16,
    2.0 / 16, 4.0 / 16, 2.0 / 16,
    1.0 / 16, 2.0 / 16, 1.0 / 16  
);
```

通过在片元着色器中改变核的float数组，我们完全改变了后期处理效果。它现在看起来是这样子的：

![[framebuffers_blur.png|img]]

这样的模糊效果创造了很多的可能性。我们可以随着时间修改模糊的量，创造出玩家醉酒时的效果，或者在主角没带眼镜的时候增加模糊。模糊也能够让我们来平滑颜色值，我们将在之后教程中使用到。

你可以看到，只要我们有了这个核的实现，创建炫酷的后期处理特效是非常容易的事。我们再来看最后一个很流行的效果来结束本节的讨论。

#### 边缘检测

下面的边缘检测(Edge-detection)核和锐化核非常相似：

![[image-20220927212622832.png]]

这个核高亮了所有的边缘，而暗化了其它部分，在我们只关心图像的边角的时候是非常有用的。

![[framebuffers_edge_detection.png|img]]

你可能不会奇怪，像是Photoshop这样的图像修改工具/滤镜使用的也是这样的核。因为显卡处理片段的时候有着极强的并行处理能力，我们可以很轻松地在实时的情况下逐像素对图像进行处理。所以图像编辑工具在图像处理的时候会更倾向于使用显卡。

> 注意，核在对屏幕纹理的边缘进行采样的时候，由于还会对中心像素周围的8个像素进行采样，其实会取到纹理之外的像素。由于环绕方式默认是GL_REPEAT，所以在没有设置的情况下取到的是屏幕另一边的像素，而另一边的像素本不应该对中心像素产生影响，这就可能会在屏幕边缘产生很奇怪的条纹。为了消除这一问题，我们可以将屏幕纹理的环绕方式都设置为GL_CLAMP_TO_EDGE。这样子在取到纹理外的像素时，就能够重复边缘的像素来更精确地估计最终的值了。

## 立方体贴图

我们已经使用2D纹理很长时间了，但除此之外仍有更多的纹理类型等着我们探索。在本节中，我们将讨论的是**将多个纹理组合起来映射到一张纹理上的一种纹理类型：立方体贴图(Cube Map)。**

简单来说，立方体贴图就是一个包含了6个2D纹理的纹理，每个2D纹理都组成了立方体的一个面：一个有纹理的立方体。你可能会奇怪，这样一个立方体有什么用途呢？为什么要把6张纹理合并到一张纹理中，而不是直接使用6个单独的纹理呢？**立方体贴图有一个非常有用的特性，它可以通过一个方向向量来进行索引/采样。**假设我们有一个1x1x1的单位立方体，方向向量的原点位于它的中心。使用一个橘黄色的方向向量来从立方体贴图上采样一个纹理值会像是这样：

![[cubemaps_sampling 1.png|img]]

> 方向向量的大小并不重要，只要提供了方向，**OpenGL就会获取方向向量（最终）所击中的纹素，并返回对应的采样纹理值。**

如果我们假设将这样的立方体贴图应用到一个立方体上，采样立方体贴图所使用的方向向量将和立方体（插值的）顶点位置非常相像。这样子，只要立方体的中心位于原点，我们就能使用立方体的实际位置向量来对立方体贴图进行采样了。接下来，我们可以将所有顶点的纹理坐标当做是立方体的顶点位置。最终得到的结果就是可以访问立方体贴图上正确面(Face)纹理的一个纹理坐标。

### 创建立方体贴图

立方体贴图是和其它纹理一样的，所以如果想创建一个立方体贴图的话，我们需要生成一个纹理，并将其绑定到纹理目标上，之后再做其它的纹理操作。这次要**绑定到`GL_TEXTURE_CUBE_MAP`：**

```less
unsigned int textureID;
glGenTextures(1, &textureID);
glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);
```

因为立方体贴图包含有6个纹理，每个面一个，我们需要调用`glTexImage2D`函数6次，参数和之前教程中很类似。但这一次我们将纹理目标(**target**)参数设置为立方体贴图的一个特定的面，告诉OpenGL我们在对立方体贴图的哪一个面创建纹理。这就意味着**我们需要对立方体贴图的每一个面都调用一次glTexImage2D。**

由于我们有6个面，**OpenGL给我们提供了6个特殊的纹理目标，专门对应立方体贴图的一个面。**

| 纹理目标                         | 方位 |
| :------------------------------- | :--- |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_X` | 右   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_X` | 左   |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_Y` | 上   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_Y` | 下   |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_Z` | 后   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_Z` | 前   |

和OpenGL的很多枚举(Enum)一样，它们背后的int值是线性递增的，所以如果我们有一个纹理位置的数组或者vector，我们就可以从`GL_TEXTURE_CUBE_MAP_POSITIVE_X`开始遍历它们，在每个迭代中对枚举值加1，遍历了整个纹理目标：

```
int width, height, nrChannels;
unsigned char *data;  
for(unsigned int i = 0; i < textures_faces.size(); i++)
{
    data = stbi_load(textures_faces[i].c_str(), &width, &height, &nrChannels, 0);
    glTexImage2D(
        GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 
        0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data
    );
}
```

这里我们有一个叫做textures_faces的vector，它包含了立方体贴图所需的所有纹理路径，并以表中的顺序排列。这将为当前绑定的立方体贴图中的每个面生成一个纹理。

因为立方体贴图和其它纹理没什么不同，我们也需要设定它的环绕和过滤方式：

```
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
```

不要被GL_TEXTURE_WRAP_R吓到，它仅仅是为纹理的**R**坐标设置了环绕方式，它对应的是纹理的第三个维度（和位置的**z**一样）。我们将环绕方式设置为GL_CLAMP_TO_EDGE，这是因为正好处于两个面之间的纹理坐标可能不能击中一个面（由于一些硬件限制），所以通过使用GL_CLAMP_TO_EDGE，OpenGL将在我们对两个面之间采样的时候，永远返回它们的边界值。

在绘制使用立方体贴图的物体之前，我们要先激活对应的纹理单元，并绑定立方体贴图，这和普通的2D纹理没什么区别。

在片元着色器中，我们使用了一个不同类型的采样器，`samplerCube`，我们将使用texture函数使用它进行采样，但这次我们将使用一个`vec3`的方向向量而不是`vec2`。使用立方体贴图的片元着色器会像是这样的：

```
in vec3 textureDir; // 代表3D纹理坐标的方向向量
uniform samplerCube cubemap; // 立方体贴图的纹理采样器

void main()
{             
    FragColor = texture(cubemap, textureDir);
}
```

看起来很棒，但为什么要用它呢？恰巧有一些很有意思的技术，使用立方体贴图来实现的话会简单多了。其中一个技术就是创建一个天空盒(Skybox)。

### 天空盒

天空盒是一个包含了整个场景的（大）立方体，它包含周围环境的6个图像，让玩家以为他处在一个比实际大得多的环境当中。游戏中使用天空盒的例子有群山、白云或星空。下面这张截图中展示的是星空的天空盒，它来自于『上古卷轴3』：

![[cubemaps_morrowind.jpg|img]]

你可能现在已经猜到了，立方体贴图能完美满足天空盒的需求：我们有一个6面的立方体，每个面都需要一个纹理。在上面的图片中，他们使用了夜空的几张图片，让玩家产生其位于广袤宇宙中的错觉，但实际上他只是在一个小小的盒子当中。

你可以在网上找到很多像这样的天空盒资源。比如说这个[网站](http://www.custommapmakers.org/skyboxes.php)就提供了很多天空盒。天空盒图像通常有以下的形式：

![[cubemaps_skybox.png|img]]

如果你将这六个面折成一个立方体，你就会得到一个完全贴图的立方体，模拟一个巨大的场景。一些资源可能会提供了这样格式的天空盒，你必须手动提取六个面的图像，但在大部分情况下它们都是6张单独的纹理图像。

之后我们将在场景中使用这个（高质量的）天空盒，它可以在[这里](https://learnopengl-cn.github.io/data/skybox.rar)下载到。

#### 加载天空盒

因为天空盒本身就是一个立方体贴图，加载天空盒和之前加载立方体贴图时并没有什么不同。为了加载天空盒，我们将使用下面的函数，它接受一个包含6个纹理路径的vector：

```less
unsigned int loadCubemap(vector<std::string> faces)
{
    unsigned int textureID;
    glGenTextures(1, &textureID);
    glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);

    int width, height, nrChannels;
    for (unsigned int i = 0; i < faces.size(); i++)
    {
        unsigned char *data = stbi_load(faces[i].c_str(), &width, &height, &nrChannels, 0);
        if (data)
        {
            glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data
            );
            stbi_image_free(data);
        }
        else
        {
            std::cout << "Cubemap texture failed to load at path: " << faces[i] << std::endl;
            stbi_image_free(data);
        }
    }
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);

    return textureID;
}
```

函数本身应该很熟悉了。它基本就是上一部分中立方体贴图的代码，只不过合并到了一个便于管理的函数中。

之后，在调用这个函数之前，我们需要将合适的纹理路径按照立方体贴图枚举指定的顺序加载到一个vector中。

```less
vector<std::string> faces
{
    "right.jpg",
    "left.jpg",
    "top.jpg",
    "bottom.jpg",
    "front.jpg",
    "back.jpg"
};
unsigned int cubemapTexture = loadCubemap(faces);
```

现在我们就将这个天空盒加载为一个立方体贴图了，它的id是cubemapTexture。我们可以将它绑定到一个立方体中，替换掉用了很长时间的难看的纯色背景。

#### 显示天空盒

由于天空盒是绘制在一个立方体上的，和其它物体一样，我们需要另一个VAO、VBO以及新的一组顶点。你可以在[这里](https://learnopengl.com/code_viewer.php?code=advanced/cubemaps_skybox_data)找到它的顶点数据。

**用于贴图3D立方体的立方体贴图可以使用立方体的位置作为纹理坐标来采样。**当立方体处于原点(0, 0, 0)时，它的每一个位置向量都是从原点出发的方向向量。这个方向向量正是获取立方体上特定位置的纹理值所需要的。正是因为这个，**我们只需要提供位置向量而不用纹理坐标了**。

要渲染天空盒的话，我们需要一组新的着色器，它们都不是很复杂。因为我们只有一个顶点属性，顶点着色器非常简单：

```less
#version 330 core
layout (location = 0) in vec3 aPos;

out vec3 TexCoords;

uniform mat4 projection;
uniform mat4 view;

void main()
{
    TexCoords = aPos;
    gl_Position = projection * view * vec4(aPos, 1.0);
}
```

**注意，顶点着色器中很有意思的部分是，我们将输入的位置向量作为输出给片元着色器的纹理坐标。片元着色器会将它作为输入来采样`samplerCube`：**

```less
#version 330 core
out vec4 FragColor;

in vec3 TexCoords;

uniform samplerCube skybox;

void main()
{    
    FragColor = texture(skybox, TexCoords);
}
```

片元着色器非常直观。我们将顶点属性的位置向量作为纹理的方向向量，并使用它从立方体贴图中采样纹理值。

有了立方体贴图纹理，渲染天空盒现在就非常简单了，我们只需要绑定立方体贴图纹理，skybox采样器就会自动填充上天空盒立方体贴图了。**绘制天空盒时，我们需要将它变为场景中的第一个渲染的物体，并且禁用深度写入。这样子天空盒就会永远被绘制在其它物体的背后了。**

```less
glDepthMask(GL_FALSE);
skyboxShader.use();
// ... 设置观察和投影矩阵
glBindVertexArray(skyboxVAO);
glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);
glDrawArrays(GL_TRIANGLES, 0, 36);
glDepthMask(GL_TRUE);
// ... 绘制剩下的场景
```

如果你运行一下的话你就会发现出现了一些问题。我们希望天空盒是以玩家为中心的，这样不论玩家移动了多远，天空盒都不会变近，让玩家产生周围环境非常大的印象。然而，当前的观察矩阵会旋转、缩放和位移来变换天空盒的所有位置，所以当玩家移动的时候，立方体贴图也会移动！我们希望移除观察矩阵中的位移部分，让移动不会影响天空盒的位置向量。

你可能还记得在[基础光照](https://learnopengl-cn.github.io/02 Lighting/02 Basic Lighting/)小节中，我们通过取4x4矩阵左上角的3x3矩阵来移除变换矩阵的位移部分。我们可以将观察矩阵转换为3x3矩阵（移除位移），再将其转换回4x4矩阵，来达到类似的效果。

```
glm::mat4 view = glm::mat4(glm::mat3(camera.GetViewMatrix()));
```

这将移除任何的位移，但保留旋转变换，让玩家仍然能够环顾场景。

有了天空盒，最终的效果就是一个看起来巨大的场景了。如果你在箱子周围转一转，你就能立刻感受到距离感，极大地提升了场景的真实度。最终的结果看起来是这样的：

![[cubemaps_skybox_result.png|img]]

试一试不同的天空盒，看看它们是怎样对场景的观感产生巨大影响的。

#### 优化

目前我们是首先渲染天空盒，之后再渲染场景中的其它物体。这样子能够工作，但不是非常高效。如果我们先渲染天空盒，我们就会对屏幕上的每一个像素运行一遍片元着色器，即便只有一小部分的天空盒最终是可见的。**可以使用提前深度测试(Early Depth Testing)轻松丢弃掉的片段能够节省我们很多宝贵的带宽。**

所以，**我们将会最后渲染天空盒，以获得轻微的性能提升。**这样子的话，深度缓冲就会填充满所有物体的深度值了，我们只需要在提前深度测试通过的地方渲染天空盒的片段就可以了，很大程度上减少了片元着色器的调用。问题是，天空盒只是一个1x1x1的立方体，它很可能会不通过大部分的深度测试，导致渲染失败。不用深度测试来进行渲染不是解决方案，因为天空盒将会复写场景中的其它物体。我们需要欺骗深度缓冲，让它认为天空盒有着最大的深度值1.0，只要它前面有一个物体，深度测试就会失败。

在[坐标系统](https://learnopengl-cn.github.io/01 Getting started/08 Coordinate Systems/)小节中我们说过，**透视除法**是在顶点着色器运行之后执行的，将gl_Position的`xyz`坐标除以w分量。我们又从[深度测试](https://learnopengl-cn.github.io/04 Advanced OpenGL/01 Depth testing/)小节中知道，相除结果的z分量等于顶点的深度值。使用这些信息，我们可以将输出位置的z分量等于它的w分量，让z分量永远等于1.0，这样子的话，当透视除法执行之后，z分量会变为`w / w = 1.0`。

```
void main()
{
    TexCoords = aPos;
    vec4 pos = projection * view * vec4(aPos, 1.0);
    gl_Position = pos.xyww;
}
```

最终的**标准化设备坐标**将永远会有一个等于1.0的z值：最大的深度值。结果就是天空盒只会在没有可见物体的地方渲染了（只有这样才能通过深度测试，其它所有的东西都在天空盒前面）。

我们还要改变一下深度函数，将它从默认的GL_LESS改为GL_LEQUAL。深度缓冲将会填充上天空盒的1.0值，所以我们需要保证天空盒在值小于或等于深度缓冲而不是小于时通过深度测试。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/6.1.cubemaps_skybox/cubemaps_skybox.cpp)找到优化后的源代码。

#### 环境映射

我们现在将整个环境映射到了一个纹理对象上了，能利用这个信息的不仅仅只有天空盒。通过使用环境的立方体贴图，我们可以给物体反射和折射的属性。**这样使用环境立方体贴图的技术叫做环境映射(Environment Mapping)，其中最流行的两个是反射(Reflection)和折射(Refraction)。**

##### 反射

反射这个属性表现为物体（或物体的一部分）反射它周围环境，即根据观察者的视角，物体的颜色或多或少等于它的环境。镜子就是一个反射性物体：它会根据观察者的视角反射它周围的环境。

反射的原理并不难。下面这张图展示了我们如何计算反射向量，并如何使用这个向量来从立方体贴图中采样：

![[cubemaps_reflection_theory.png|img]]

**我们根据观察方向向量I和物体的法向量N，来计算反射向量R。我们可以使用GLSL内建的reflect函数来计算这个反射向量。最终的R向量将会作为索引/采样立方体贴图的方向向量，返回环境的颜色值。最终的结果是物体看起来反射了天空盒。**

因为我们已经在场景中配置好天空盒了，创建反射效果并不会很难。我们将会改变箱子的片元着色器，让箱子有反射性：

```less
#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 Position;

uniform vec3 cameraPos;
uniform samplerCube skybox;

void main()
{             
    vec3 I = normalize(Position - cameraPos);
    vec3 R = reflect(I, normalize(Normal));
    FragColor = vec4(texture(skybox, R).rgb, 1.0);
}
```

我们先计算了观察/摄像机方向向量`I`，并使用它来计算反射向量`R`，之后我们将使用`R`来从天空盒立方体贴图中采样。注意，我们现在又有了片段的插值Normal和Position变量，所以我们需要更新一下顶点着色器。

```less
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 Normal;
out vec3 Position;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    Normal = mat3(transpose(inverse(model))) * aNormal;
    Position = vec3(model * vec4(aPos, 1.0));
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```

我们现在使用了一个法向量，所以我们将再次使用法线矩阵(Normal Matrix)来变换它们。Position输出向量是一个世界空间的位置向量。顶点着色器的这个Position输出将用来在片元着色器内计算观察方向向量。

因为我们使用了法线，你还需要更新一下[顶点数据](https://learnopengl.com/code_viewer.php?code=lighting/basic_lighting_vertex_data)，并更新属性指针。还要记得去设置cameraPos这个uniform。

接下来，我们在渲染箱子之前先绑定立方体贴图纹理：

```
glBindVertexArray(cubeVAO);
glBindTexture(GL_TEXTURE_CUBE_MAP, skyboxTexture);          
glDrawArrays(GL_TRIANGLES, 0, 36);
```

编译并运行代码，你将会得到一个像是镜子一样的箱子。周围的天空盒被完美地反射在箱子上。

![[cubemaps_reflection.png|img]]

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/6.2.cubemaps_environment_mapping/cubemaps_environment_mapping.cpp)找到完整的源代码。

当反射应用到一整个物体上（像是箱子）时，这个物体看起来就像是钢或者铬这样的高反射性材质。如果我们加载[模型加载](https://learnopengl-cn.github.io/03 Model Loading/03 Model/)小节中的纳米装模型，我们会得到一种整个套装都是使用铬做成的效果：

![[cubemaps_reflection_nanosuit.png|img]]

这看起来非常棒，但在现实中大部分的模型都不具有完全反射性。我们可以引入反射贴图(Reflection Map)，来给模型更多的细节。与漫反射和镜面光贴图一样，**反射贴图也是可以采样的纹理图像，它决定这片段的反射性。通过使用反射贴图，我们可以知道模型的哪些部分该以什么强度显示反射。**在本节的练习中，将由你来为我们之前创建的模型加载器中引入反射贴图，显著提升纳米装模型的细节。

##### 折射

环境映射的另一种形式是折射，它和反射很相似。折射是光线由于传播介质的改变而产生的方向变化。在常见的类水表面上所产生的现象就是折射，光线不是直直地传播，而是弯曲了一点。将你的半只胳膊伸进水里，观察出来的就是这种效果。

折射是通过[斯涅尔定律](https://en.wikipedia.org/wiki/Snell's_law)(Snell’s Law)来描述的，使用环境贴图的话看起来像是这样：

![[cubemaps_refraction_theory.png|img]]

同样，我们有一个观察向量I，一个法向量N，而这次是折射向量R。可以看到，观察向量的方向轻微弯曲了。弯折后的向量R将会用来从立方体贴图中采样。

折射可以使用GLSL的内建**refract函数**来轻松实现，**它需要一个法向量、一个观察方向和两个材质之间的折射率(Refractive Index)。**

折射率决定了材质中光线弯曲的程度，每个材质都有自己的折射率。一些最常见的折射率可以在下表中找到：

| 材质 | 折射率 |
| :--- | :----- |
| 空气 | 1.00   |
| 水   | 1.33   |
| 冰   | 1.309  |
| 玻璃 | 1.52   |
| 钻石 | 2.42   |

我们使用这些折射率来计算光传播的两种材质间的比值。在我们的例子中，光线/视线从**空气**进入**玻璃**（如果我们假设箱子是玻璃制的），所以比值为1.001.52=0.6581.001.52=0.658。

我们已经绑定了立方体贴图，提供了顶点数据和法线，并设置了摄像机位置的uniform。唯一要修改的就是片元着色器：
```c++ nums++
void main()
{             
    float ratio = 1.00 / 1.52;
    vec3 I = normalize(Position - cameraPos);
    vec3 R = refract(I, normalize(Normal), ratio);
    FragColor = vec4(texture(skybox, R).rgb, 1.0);
}
```

通过改变折射率，你可以创建完全不同的视觉效果。编译程序并运行，但结果并不是很有趣，因为我们只使用了一个简单的箱子，它不太能显示折射的效果，现在看起来只是有点像一个放大镜。对纳米装使用相同的着色器却能够展现出了我们期待的效果：一个类玻璃的物体。

![[cubemaps_refraction.png|img]]

你可以想象出有了光照、反射、折射和顶点移动的正确组合，你可以创建出非常漂亮的水。注意，如果要想获得物理上精确的结果，我们还需要在光线离开物体的时候再次折射，现在我们使用的只是单面折射(Single-side Refraction)，但它对大部分场合都是没问题的。

##### 动态环境贴图

现在我们使用的都是静态图像的组合来作为天空盒，看起来很不错，但它没有在场景中包括可移动的物体。我们一直都没有注意到这一点，因为我们只使用了一个物体。如果我们有一个镜子一样的物体，周围还有多个物体，镜子中可见的只有天空盒，看起来就像它是场景中唯一一个物体一样。

通过使用帧缓冲，我们能够为物体的6个不同角度创建出场景的纹理，并在每个渲染迭代中将它们储存到一个立方体贴图中。之后我们就可以使用这个（动态生成的）立方体贴图来创建出更真实的，包含其它物体的，反射和折射表面了。这就叫做动态环境映射(Dynamic Environment Mapping)，因为我们动态创建了物体周围的立方体贴图，并将其用作环境贴图。

虽然它看起来很棒，但它有一个很大的缺点：我们需要为使用环境贴图的物体渲染场景6次，这是对程序是非常大的性能开销。现代的程序通常会尽可能使用天空盒，并在可能的时候使用预编译的立方体贴图，只要它们能产生一点动态环境贴图的效果。虽然动态环境贴图是一个很棒的技术，但是要想在不降低性能的情况下让它工作还是需要非常多的技巧的。

## 高级数据

我们在OpenGL中大量使用缓冲来储存数据已经有很长时间了。操作缓冲其实还有更有意思的方式，而且使用纹理将大量数据传入着色器也有更有趣的方法。这一节中，我们将讨论一些更有意思的缓冲函数，以及我们该如何**使用纹理对象来储存大量的数据（纹理的部分还没有完成）**。

OpenGL中的缓冲只是一个管理特定内存块的对象，没有其它更多的功能了。在我们将它绑定到一个缓冲目标(Buffer Target)时，我们才赋予了其意义。当我们绑定一个缓冲到`GL_ARRAY_BUFFER`时，它就是一个顶点数组缓冲，但我们也可以很容易地将其绑定到`GL_ELEMENT_ARRAY_BUFFER`。OpenGL内部会为每个目标储存一个缓冲，并且会根据目标的不同，以不同的方式处理缓冲。

到目前为止，我们一直是调用`glBufferData`函数来填充缓冲对象所管理的内存，这个函数会分配一块内存，并将数据添加到这块内存中。如果我们将它的`data`参数设置为`NULL`，那么这个函数将只会分配内存，但不进行填充。这在我们需要**预留**(Reserve)特定大小的内存，之后回到这个缓冲一点一点填充的时候会很有用。

除了使用一次函数调用填充整个缓冲之外，我们也可以使用`glBufferSubData`，填充缓冲的特定区域。这个函数需要一个缓冲目标、一个偏移量、数据的大小和数据本身作为它的参数。这个函数不同的地方在于，我们可以提供一个偏移量，指定从**何处**开始填充这个缓冲。这能够让我们插入或者更新缓冲内存的某一部分。要注意的是，**缓冲需要有足够的已分配内存，所以对一个缓冲调用glBufferSubData之前必须要先调用glBufferData。**
```c++ nums++
glBufferSubData(GL_ARRAY_BUFFER, 24, sizeof(data), &data); // 范围： [24, 24 + sizeof(data)]
```
**将数据导入缓冲的另外一种方法是，请求缓冲内存的指针，直接将数据复制到缓冲当中。通过调用`glMapBuffer`函数，OpenGL会返回当前绑定缓冲的内存指针，供我们操作：**
```c++ nums++
float data[] = { 0.5f, 1.0f, -0.35f ... }; glBindBuffer(GL_ARRAY_BUFFER, buffer); // 获取指针 void *ptr = glMapBuffer(GL_ARRAY_BUFFER, GL_WRITE_ONLY); // 复制数据到内存 memcpy(ptr, data, sizeof(data)); // 记得告诉OpenGL我们不再需要这个指针了 glUnmapBuffer(GL_ARRAY_BUFFER);
```

当我们使用`glUnmapBuffer`函数，告诉OpenGL我们已经完成指针操作之后，OpenGL就会知道你已经完成了。在解除映射(Unmapping)之后，指针将会不再可用，并且如果OpenGL能够成功将您的数据映射到缓冲中，这个函数将会返回GL_TRUE。

如果要直接映射数据到缓冲，而不事先将其存储到临时内存中，glMapBuffer这个函数会很有用。比如说，你可以从文件中读取数据，并直接将它们复制到缓冲内存中。

### 分批顶点属性

通过使用`glVertexAttribPointer`，我们能够指定顶点数组缓冲内容的属性布局。在顶点数组缓冲中，我们对属性进行了交错(Interleave)处理，也就是说，我们将每一个顶点的位置、法线和/或纹理坐标紧密放置在一起。既然我们现在已经对缓冲有了更多的了解，我们可以采取另一种方式。

我们可以做的是，将每一种属性类型的向量数据打包(Batch)为一个大的区块，而不是对它们进行交错储存。与交错布局123123123123不同，我们将采用分批(Batched)的方式111122223333。

当从文件中加载顶点数据的时候，你通常获取到的是一个位置数组、一个法线数组和/或一个纹理坐标数组。我们需要花点力气才能将这些数组转化为一个大的交错数据数组。使用分批的方式会是更简单的解决方案，我们可以很容易使用glBufferSubData函数实现：
```c++ nums++
float positions[] = { ... }; float normals[] = { ... }; float tex[] = { ... }; // 填充缓冲 glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(positions), &positions); glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions), sizeof(normals), &normals); glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions) + sizeof(normals), sizeof(tex), &tex);
```
这样子我们就能直接将属性数组作为一个整体传递给缓冲，而不需要事先处理它们了。我们仍可以将它们合并为一个大的数组，再使用glBufferData来填充缓冲，但对于这种工作，使用glBufferSubData会更合适一点。

我们还需要更新顶点属性指针来反映这些改变：
```c++ nums++
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), 0); glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)(sizeof(positions))); glVertexAttribPointer( 2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)(sizeof(positions) + sizeof(normals)));
```
注意`stride`参数等于顶点属性的大小，因为下一个顶点属性向量能在3个（或2个）分量之后找到。

这给了我们设置顶点属性的另一种方法。使用哪种方法都不会对OpenGL有什么立刻的好处，它只是设置顶点属性的一种更整洁的方式。具体使用的方法将完全取决于你的喜好与程序类型。
### 复制缓冲
当你的缓冲已经填充好数据之后，你可能会想与其它的缓冲共享其中的数据，或者想要将缓冲的内容复制到另一个缓冲当中。glCopyBufferSubData能够让我们相对容易地从一个缓冲中复制数据到另一个缓冲中。这个函数的原型如下：

```c++ nums++
void glCopyBufferSubData(GLenum readtarget, GLenum writetarget, GLintptr readoffset,GLintptr writeoffset, GLsizeiptr size);
```

`readtarget`和`writetarget`参数需要填入复制源和复制目标的缓冲目标。比如说，我们可以将VERTEX_ARRAY_BUFFER缓冲复制到VERTEX_ELEMENT_ARRAY_BUFFER缓冲，分别将这些缓冲目标设置为读和写的目标。当前绑定到这些缓冲目标的缓冲将会被影响到。

但如果我们想读写数据的两个不同缓冲都为顶点数组缓冲该怎么办呢？我们不能同时将两个缓冲绑定到同一个缓冲目标上。正是出于这个原因，OpenGL提供给我们另外两个缓冲目标，叫做GL_COPY_READ_BUFFER和GL_COPY_WRITE_BUFFER。我们接下来就可以将需要的缓冲绑定到这两个缓冲目标上，并将这两个目标作为`readtarget`和`writetarget`参数。

接下来glCopyBufferSubData会从`readtarget`中读取`size`大小的数据，并将其写入`writetarget`缓冲的`writeoffset`偏移量处。下面这个例子展示了如何复制两个顶点数组缓冲：

```c++ nums++
float vertexData[] = { ... };
glBindBuffer(GL_COPY_READ_BUFFER, vbo1);
glBindBuffer(GL_COPY_WRITE_BUFFER, vbo2);
glCopyBufferSubData(GL_COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, sizeof(vertexData));
```

我们也可以只将`writetarget`缓冲绑定为新的缓冲目标类型之一：

```c++ nums++
float vertexData[] = { ... };
glBindBuffer(GL_ARRAY_BUFFER, vbo1);
glBindBuffer(GL_COPY_WRITE_BUFFER, vbo2);
glCopyBufferSubData(GL_ARRAY_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, sizeof(vertexData));
```

有了这些关于如何操作缓冲的额外知识，我们已经能够以更有意思的方式使用它们了。当你越深入OpenGL时，这些新的缓冲方法将会变得更加有用。在[下一节](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/08%20Advanced%20GLSL/)中，在我们讨论Uniform缓冲对象(Uniform Buffer Object)时，我们将会充分利用glBufferSubData。
### 高级GLSL
这一小节并不会向你展示非常先进非常酷的新特性，也不会对场景的视觉质量有显著的提高。但是，这一节会或多或少涉及GLSL的一些有趣的地方以及一些很棒的技巧，它们可能在今后会帮助到你。简单来说，它们就是在组合使用OpenGL和GLSL创建程序时的一些最好要知道的东西，和一些会让你生活更加轻松的特性。

我们将会讨论一些有趣的内建变量(Built-in Variable)，管理着色器输入和输出的新方式以及一个叫做Uniform缓冲对象(Uniform Buffer Object)的有用工具。
#### GLSL的内建变量
着色器都是最简化的，如果需要当前着色器以外地方的数据的话，我们必须要将数据传进来。我们已经学会使用顶点属性、uniform和采样器来完成这一任务了。然而，除此之外，GLSL还定义了另外几个以gl_为前缀的变量，它们能提供给我们更多的方式来读取/写入数据。我们已经在前面教程中接触过其中的两个了：顶点着色器的输出向量gl_Position，和片元着色器的gl_FragCoord。

我们将会讨论几个有趣的GLSL内建输入和输出变量，并会解释它们能够怎样帮助你。注意，我们将不会讨论GLSL中存在的所有内建变量，如果你想知道所有的内建变量的话，请查看OpenGL的wiki。

##### 顶点着色器变量
我们已经见过gl_Position了，它是顶点着色器的裁剪空间输出位置向量。如果你想在屏幕上显示任何东西，在顶点着色器中设置`gl_Position`是必须的步骤。这已经是它的全部功能了。

###### gl_PointSize
我们能够选用的其中一个图元是GL_POINTS，如果使用它的话，每一个顶点都是一个图元，都会被渲染为一个点。我们可以通过OpenGL的`glPointSize`函数来设置渲染出来的点的大小，但我们也可以在顶点着色器中修改这个值。

GLSL定义了一个叫做`gl_PointSize`输出变量，它是一个float变量，你可以使用它来**设置点的宽高（像素）**。在顶点着色器中修改点的大小的话，你就能对每个顶点设置不同的值了。

在顶点着色器中修改点大小的功能默认是禁用的，如果你需要启用它的话，你需要启用OpenGL的`GL_PROGRAM_POINT_SIZE`：
```c++ nums++
glEnable(GL_PROGRAM_POINT_SIZE);
```

一个简单的例子就是将点的大小设置为裁剪空间位置的z值，也就是顶点距观察者的距离。点的大小会随着观察者距顶点距离变远而增大。

```c++ nums++
void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);    
    gl_PointSize = gl_Position.z;    
}
```
结果就是，当我们远离这些点的时候，它们会变得更大：
![[Pasted image 20220929182106.png]]
你可以想到，对每个顶点使用不同的点大小，会在粒子生成之类的技术中很有意思。
###### gl_VertexID

gl_Position和gl_PointSize都是**输出变量**，因为它们的值是作为顶点着色器的输出被读取的。我们可以对它们进行写入，来改变结果。顶点着色器还为我们提供了一个有趣的**输入变量**，**我们只能对它进行读取**，它叫做`gl_VertexID`。

整型变量`gl_VertexID`储存了正在绘制顶点的当前ID。当（使用glDrawElements）进行索引渲染的时候，这个变量会存储正在绘制顶点的当前索引。当（使用glDrawArrays）不使用索引进行绘制的时候，这个变量会储存从渲染调用开始的已处理顶点数量。

虽然现在它没有什么具体的用途，但知道我们能够访问这个信息总是好的。
##### 片元着色器变量

在片元着色器中，我们也能访问到一些有趣的变量。GLSL提供给我们两个有趣的输入变量：gl_FragCoord和gl_FrontFacing。

###### gl_FragCoord

在讨论深度测试的时候，我们已经见过gl_FragCoord很多次了，因为gl_FragCoord的**z分量等于对应片段的深度值**。然而，我们也能使用它的x和y分量来实现一些有趣的效果。

gl_FragCoord的**x和y分量是片段的窗口空间(Window-space)坐标，其原点为窗口的左下角**。我们已经使用glViewport设定了一个800x600的窗口了，所以片段窗口空间坐标的x分量将在0到800之间，y分量在0到600之间。

通过利用片元着色器，我们可以根据片段的窗口坐标，计算出不同的颜色。gl_FragCoord的一个常见用处是用于对比不同片段计算的视觉输出效果，这在技术演示中可以经常看到。比如说，我们能够将屏幕分成两部分，在窗口的左侧渲染一种输出，在窗口的右侧渲染另一种输出。下面这个例子片元着色器会根据窗口坐标输出不同的颜色：

```c++ nums++
void main()
{             
    if(gl_FragCoord.x < 400)
        FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    else
        FragColor = vec4(0.0, 1.0, 0.0, 1.0);        
}
```

因为窗口的宽度是800。当一个像素的x坐标小于400时，它一定在窗口的左侧，所以我们给它一个不同的颜色。
![[074f17aaf47d4fe7654247f340c74103_MD5 1.png]]

我们现在会计算出两个完全不同的片元着色器结果，并将它们显示在窗口的两侧。举例来说，你可以将它用于测试不同的光照技巧。
###### gl_FrontFacing

片元着色器另外一个很有意思的输入变量是gl_FrontFacing。在[面剔除](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/04%20Face%20culling/)教程中，我们提到OpenGL能够根据顶点的环绕顺序来决定一个面是正向还是背向面。**如果我们不（启用GL_FACE_CULL来）使用面剔除，那么gl_FrontFacing将会告诉我们当前片段是属于正向面的一部分还是背向面的一部分**。举例来说，我们能够**对正向面计算出不同的颜色**。

gl_FrontFacing变量是一个bool，如果当前片段是正向面的一部分那么就是`true`，否则就是`false`。比如说，我们可以这样子创建一个立方体，在内部和外部使用不同的纹理：

```less
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D frontTexture;
uniform sampler2D backTexture;

void main()
{             
    if(gl_FrontFacing)
        FragColor = texture(frontTexture, TexCoords);
    else
        FragColor = texture(backTexture, TexCoords);
}
```

如果我们往箱子里面看，就能看到使用的是不同的纹理。

![[eab55a31c8a6a43cef14e4d56b2210de_MD5 1.png]]

注意，如果你开启了面剔除，你就看不到箱子内部的面了，所以现在再使用gl_FrontFacing就没有意义了。

###### gl_FragDepth

输入变量gl_FragCoord能让我们读取当前片段的窗口空间坐标，并获取它的深度值，但是它是一个只读(Read-only)变量。我们不能修改片段的窗口空间坐标，但实际上修改片段的深度值还是可能的。GLSL提供给我们一个叫做gl_FragDepth的输出变量，我们可以使用它来**在着色器内设置片段的深度值**。

要想设置深度值，我们直接写入一个0.0到1.0之间的float值到输出变量就可以了：

```
gl_FragDepth = 0.0; // 这个片段现在的深度值为 0.0
```

如果着色器没有写入值到gl_FragDepth，它会自动取用`gl_FragCoord.z`的值。

然而，由我们自己设置深度值有一个很大的缺点，只要我们在片元着色器中对gl_FragDepth进行写入，OpenGL就会（像[深度测试](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/01%20Depth%20testing/)小节中讨论的那样）禁用所有的提前深度测试(Early Depth Testing)。它被禁用的原因是，OpenGL无法在片元着色器运行**之前**得知片段将拥有的深度值，因为片元着色器可能会完全修改这个深度值。

在写入`gl_FragDepth`时，你就需要考虑到它所带来的性能影响。然而，从OpenGL 4.2起，我们仍可以对两者进行一定的调和，在片元着色器的顶部使用深度条件(Depth Condition)重新声明gl_FragDepth变量：

```
layout (depth_<condition>) out float gl_FragDepth; 
```

`condition`可以为下面的值：

![[Pasted image 20220929183849.png]]

通过将深度条件设置为`greater`或者`less`，OpenGL就能假设你只会写入比当前片段深度值更大或者更小的值了。这样子的话，当深度值比片段的深度值要小的时候，OpenGL仍是能够进行提前深度测试的。

下面这个例子中，我们对片段的深度值进行了递增，但仍然也保留了一些提前深度测试：

```less
#version 420 core // 注意GLSL的版本！
out vec4 FragColor;
layout (depth_greater) out float gl_FragDepth;

void main()
{             
    FragColor = vec4(1.0);
    gl_FragDepth = gl_FragCoord.z + 0.1;
}  
```

注意这个特性只在OpenGL 4.2版本或以上才提供。
##### 接口块
到目前为止，每当我们希望从顶点着色器向片元着色器发送数据时，我们都声明了几个对应的输入/输出变量。将它们一个一个声明是着色器间发送数据最简单的方式了，但**当程序变得更大时，你希望发送的可能就不只是几个变量了，它还可能包括数组和结构体。**

为了帮助我们管理这些变量，GLSL为我们提供了一个叫做接口块(Interface Block)的东西，来方便我们组合这些变量。**接口块的声明和struct的声明有点相像，不同的是，现在根据它是一个输入还是输出块(Block)，使用in或out关键字来定义的。**

```less
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out VS_OUT
{
    vec2 TexCoords;
} vs_out;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);    
    vs_out.TexCoords = aTexCoords;
}  
```

这次我们声明了一个叫做vs_out的接口块，它打包了我们希望发送到下一个着色器中的所有输出变量。这只是一个很简单的例子，但你可以想象一下，它能够帮助你管理着色器的输入和输出。当我们希望将着色器的输入或输出打包为数组时，它也会非常有用，我们将在[下一节](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/09%20Geometry%20Shader/)讨论几何着色器(Geometry Shader)时见到。

之后，我们还需要在下一个着色器，即片元着色器，中定义一个输入接口块。块名(Block Name)应该是和着色器中一样的（VS_OUT），但实例名(Instance Name)（顶点着色器中用的是vs_out）可以是随意的，但要避免使用误导性的名称，比如对实际上包含输入变量的接口块命名为vs_out。

```less
#version 330 core
out vec4 FragColor;

in VS_OUT
{
    vec2 TexCoords;
} fs_in;

uniform sampler2D texture;

void main()
{             
    FragColor = texture(texture, fs_in.TexCoords);   
}
```

只要两个接口块的名字一样，它们对应的输入和输出将会匹配起来。这是帮助你管理代码的又一个有用特性，它在几何着色器这样穿插特定着色器阶段的场景下会很有用。
##### Uniform缓冲对象
我们已经使用OpenGL很长时间了，学会了一些很酷的技巧，但也遇到了一些很麻烦的地方。比如说，当使用多于一个的着色器时，尽管大部分的uniform变量都是相同的，我们还是需要不断地设置它们，所以为什么要这么麻烦地重复设置它们呢？

OpenGL为我们提供了一个叫做Uniform缓冲对象(Uniform Buffer Object)的工具，**它允许我们定义一系列在多个着色器中相同的全局Uniform变量**。当使用Uniform缓冲对象的时候，我们只需要设置相关的uniform一次。当然，我们仍需要手动设置每个着色器中不同的uniform。并且创建和配置Uniform缓冲对象会有一点繁琐。

因为Uniform缓冲对象仍是一个缓冲，我们可以使用glGenBuffers来创建它，将它绑定到GL_UNIFORM_BUFFER缓冲目标，并将所有相关的uniform数据存入缓冲。在Uniform缓冲对象中储存数据是有一些规则的，我们将会在之后讨论它。首先，我们将使用一个简单的顶点着色器，将projection和view矩阵存储到所谓的Uniform块(Uniform Block)中：
```c++ nums++
#version 330 core
layout (location = 0) in vec3 aPos;

layout (std140) uniform Matrices
{
    mat4 projection;
    mat4 view;
};

uniform mat4 model;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```
在我们大多数的例子中，我们都会在每个渲染迭代中，对每个着色器设置projection和view Uniform矩阵。这是利用Uniform缓冲对象的一个非常完美的例子，因为现在我们只需要存储这些矩阵一次就可以了。

这里，我们声明了一个叫做Matrices的Uniform块，它储存了两个4x4矩阵。Uniform块中的变量可以直接访问，不需要加块名作为前缀。接下来，我们在OpenGL代码中将这些矩阵值存入缓冲中，每个声明了这个Uniform块的着色器都能够访问这些矩阵。

你现在可能会在想`layout (std140)`这个语句是什么意思。它的意思是说，当前定义的Uniform块对它的内容使用一个特定的内存布局。这个语句设置了Uniform块布局(Uniform Block Layout)。
#### Uniform块布局

Uniform块的内容是储存在一个缓冲对象中的，它实际上只是一块预留内存。因为这块内存并不会保存它具体保存的是什么类型的数据，我们还需要告诉OpenGL内存的哪一部分对应着着色器中的哪一个uniform变量。

假设着色器中有以下的这个Uniform块：

```
layout (std140) uniform ExampleBlock
{
    float value;
    vec3  vector;
    mat4  matrix;
    float values[3];
    bool  boolean;
    int   integer;
};
```

我们需要知道的是每个变量的大小（字节）和（从块起始位置的）偏移量，来让我们能够按顺序将它们放进缓冲中。每个元素的大小都是在OpenGL中有清楚地声明的，而且直接对应C++数据类型，其中向量和矩阵都是大的float数组。OpenGL没有声明的是这些变量间的间距(Spacing)。这允许硬件能够在它认为合适的位置放置变量。比如说，一些硬件可能会将一个vec3放置在float边上。不是所有的硬件都能这样处理，可能会在附加这个float之前，先将vec3填充(Pad)为一个4个float的数组。这个特性本身很棒，但是会对我们造成麻烦。

默认情况下，GLSL会使用一个叫做共享(Shared)布局的Uniform内存布局，共享是因为一旦硬件定义了偏移量，它们在多个程序中是**共享**并一致的。使用共享布局时，GLSL是可以为了优化而对uniform变量的位置进行变动的，只要变量的顺序保持不变。因为我们无法知道每个uniform变量的偏移量，我们也就不知道如何准确地填充我们的Uniform缓冲了。我们能够使用像是glGetUniformIndices这样的函数来查询这个信息，但这超出本节的范围了。

虽然共享布局给了我们很多节省空间的优化，但是我们需要查询每个uniform变量的偏移量，这会产生非常多的工作量。通常的做法是，不使用共享布局，而是使用std140布局。std140布局声明了每个变量的偏移量都是由一系列规则所决定的，这**显式地**声明了每个变量类型的内存布局。由于这是显式提及的，我们可以手动计算出每个变量的偏移量。

每个变量都有一个基准对齐量(Base Alignment)，它等于一个变量在Uniform块中所占据的空间（包括填充量(Padding)），这个基准对齐量是使用std140布局的规则计算出来的。接下来，对每个变量，我们再计算它的对齐偏移量(Aligned Offset)，它是一个变量从块起始位置的字节偏移量。一个变量的对齐字节偏移量**必须**等于基准对齐量的倍数。

布局规则的原文可以在OpenGL的Uniform缓冲规范[这里](http://www.opengl.org/registry/specs/ARB/uniform_buffer_object.txt)找到，但我们将会在下面列出最常见的规则。GLSL中的每个变量，比如说int、float和bool，都被定义为4字节量。每4个字节将会用一个`N`来表示。

![[Pasted image 20220929195806.png]]

和OpenGL大多数的规范一样，使用例子就能更容易地理解。我们会使用之前引入的那个叫做ExampleBlock的Uniform块，并使用std140布局计算出每个成员的对齐偏移量：

```
layout (std140) uniform ExampleBlock
{
                     // 基准对齐量       // 对齐偏移量
    float value;     // 4               // 0 
    vec3 vector;     // 16              // 16  (必须是16的倍数，所以 4->16)
    mat4 matrix;     // 16              // 32  (列 0)
                     // 16              // 48  (列 1)
                     // 16              // 64  (列 2)
                     // 16              // 80  (列 3)
    float values[3]; // 16              // 96  (values[0])
                     // 16              // 112 (values[1])
                     // 16              // 128 (values[2])
    bool boolean;    // 4               // 144
    int integer;     // 4               // 148
}; 
```

作为练习，尝试去自己计算一下偏移量，并和表格进行对比。使用计算后的偏移量值，根据std140布局的规则，我们就能使用像是glBufferSubData的函数将变量数据按照偏移量填充进缓冲中了。虽然std140布局不是最高效的布局，但它保证了内存布局在每个声明了这个Uniform块的程序中是一致的。

通过在Uniform块定义之前添加`layout (std140)`语句，我们告诉OpenGL这个Uniform块使用的是std140布局。除此之外还可以选择两个布局，但它们都需要我们在填充缓冲之前先查询每个偏移量。我们已经见过`shared`布局了，剩下的一个布局是`packed`。当使用紧凑(Packed)布局时，是不能保证这个布局在每个程序中保持不变的（即非共享），因为它允许编译器去将uniform变量从Uniform块中优化掉，这在每个着色器中都可能是不同的。

#### 使用Uniform缓冲

我们已经讨论了如何在着色器中定义Uniform块，并设定它们的内存布局了，但我们还没有讨论该如何使用它们。

首先，我们需要调用glGenBuffers，创建一个Uniform缓冲对象。一旦我们有了一个缓冲对象，我们需要将它绑定到GL_UNIFORM_BUFFER目标，并调用glBufferData，分配足够的内存。

```
unsigned int uboExampleBlock;
glGenBuffers(1, &uboExampleBlock);
glBindBuffer(GL_UNIFORM_BUFFER, uboExampleBlock);
glBufferData(GL_UNIFORM_BUFFER, 152, NULL, GL_STATIC_DRAW); // 分配152字节的内存
glBindBuffer(GL_UNIFORM_BUFFER, 0);
```

现在，每当我们需要对缓冲更新或者插入数据，我们都会绑定到uboExampleBlock，并使用glBufferSubData来更新它的内存。我们只需要更新这个Uniform缓冲一次，所有使用这个缓冲的着色器就都使用的是更新后的数据了。但是，如何才能让OpenGL知道哪个Uniform缓冲对应的是哪个Uniform块呢？

在OpenGL上下文中，定义了一些绑定点(Binding Point)，我们可以将一个Uniform缓冲链接至它。在创建Uniform缓冲之后，我们将它绑定到其中一个绑定点上，并将着色器中的Uniform块绑定到相同的绑定点，把它们连接到一起。下面的这个图示展示了这个：

![[faf50c6e6152b87c601e8dd8ab8723db_MD5 1.png]]

你可以看到，我们可以绑定多个Uniform缓冲到不同的绑定点上。因为着色器A和着色器B都有一个链接到绑定点0的Uniform块，它们的Uniform块将会共享相同的uniform数据，uboMatrices，前提条件是两个着色器都定义了相同的Matrices Uniform块。

为了将Uniform块绑定到一个特定的绑定点中，我们需要调用glUniformBlockBinding函数，它的第一个参数是一个程序对象，之后是一个Uniform块索引和链接到的绑定点。Uniform块索引(Uniform Block Index)是着色器中已定义Uniform块的位置值索引。这可以通过调用glGetUniformBlockIndex来获取，它接受一个程序对象和Uniform块的名称。我们可以用以下方式将图示中的Lights Uniform块链接到绑定点2：

```
unsigned int lights_index = glGetUniformBlockIndex(shaderA.ID, "Lights");   
glUniformBlockBinding(shaderA.ID, lights_index, 2);
```

注意我们需要对**每个**着色器重复这一步骤。
>从OpenGL 4.2版本起，你也可以添加一个布局标识符，显式地将Uniform块的绑定点储存在着色器中，这样就不用再调用glGetUniformBlockIndex和glUniformBlockBinding了。下面的代码显式地设置了Lights Uniform块的绑定点。

```
layout(std140, binding = 2) uniform Lights { ... };
```
接下来，我们还需要绑定Uniform缓冲对象到相同的绑定点上，这可以使用glBindBufferBase或glBindBufferRange来完成。

```
glBindBufferBase(GL_UNIFORM_BUFFER, 2, uboExampleBlock); 
// 或
glBindBufferRange(GL_UNIFORM_BUFFER, 2, uboExampleBlock, 0, 152);
```

glBindbufferBase需要一个目标，一个绑定点索引和一个Uniform缓冲对象作为它的参数。这个函数将uboExampleBlock链接到绑定点2上，自此，绑定点的两端都链接上了。你也可以使用glBindBufferRange函数，它需要一个附加的偏移量和大小参数，这样子你可以绑定Uniform缓冲的特定一部分到绑定点中。通过使用glBindBufferRange函数，你可以让多个不同的Uniform块绑定到同一个Uniform缓冲对象上。

现在，所有的东西都配置完毕了，我们可以开始向Uniform缓冲中添加数据了。只要我们需要，就可以使用glBufferSubData函数，用一个字节数组添加所有的数据，或者更新缓冲的一部分。要想更新uniform变量boolean，我们可以用以下方式更新Uniform缓冲对象：

```
glBindBuffer(GL_UNIFORM_BUFFER, uboExampleBlock);
int b = true; // GLSL中的bool是4字节的，所以我们将它存为一个integer
glBufferSubData(GL_UNIFORM_BUFFER, 144, 4, &b); 
glBindBuffer(GL_UNIFORM_BUFFER, 0);
```

同样的步骤也能应用到Uniform块中其它的uniform变量上，但需要使用不同的范围参数。
#### 一个简单的例子

所以，我们来展示一个真正使用Uniform缓冲对象的例子。如果我们回头看看之前所有的代码例子，我们不断地在使用3个矩阵：投影、观察和模型矩阵。在所有的这些矩阵中，只有模型矩阵会频繁变动。如果我们有多个着色器使用了这同一组矩阵，那么使用Uniform缓冲对象可能会更好。

我们会将投影和模型矩阵存储到一个叫做Matrices的Uniform块中。我们不会将模型矩阵存在这里，因为模型矩阵在不同的着色器中会不断改变，所以使用Uniform缓冲对象并不会带来什么好处。

```c++ nums++
#version 330 core
layout (location = 0) in vec3 aPos;

layout (std140) uniform Matrices
{
    mat4 projection;
    mat4 view;
};
uniform mat4 model;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```

这里没什么特别的，除了我们现在使用的是一个std140布局的Uniform块。我们将在例子程序中，显示4个立方体，每个立方体都是使用不同的着色器程序渲染的。这4个着色器程序将使用相同的顶点着色器，但使用的是不同的片元着色器，每个着色器会输出不同的颜色。

首先，我们将顶点着色器的Uniform块设置为绑定点0。注意我们需要对每个着色器都设置一遍。

```c++ nums++
unsigned int uniformBlockIndexRed    = glGetUniformBlockIndex(shaderRed.ID, "Matrices");
unsigned int uniformBlockIndexGreen  = glGetUniformBlockIndex(shaderGreen.ID, "Matrices");
unsigned int uniformBlockIndexBlue   = glGetUniformBlockIndex(shaderBlue.ID, "Matrices");
unsigned int uniformBlockIndexYellow = glGetUniformBlockIndex(shaderYellow.ID, "Matrices");  

glUniformBlockBinding(shaderRed.ID,    uniformBlockIndexRed, 0);
glUniformBlockBinding(shaderGreen.ID,  uniformBlockIndexGreen, 0);
glUniformBlockBinding(shaderBlue.ID,   uniformBlockIndexBlue, 0);
glUniformBlockBinding(shaderYellow.ID, uniformBlockIndexYellow, 0);
```

接下来，我们创建Uniform缓冲对象本身，并将其绑定到绑定点0：

```
unsigned int uboMatrices
glGenBuffers(1, &uboMatrices);

glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
glBufferData(GL_UNIFORM_BUFFER, 2 * sizeof(glm::mat4), NULL, GL_STATIC_DRAW);
glBindBuffer(GL_UNIFORM_BUFFER, 0);

glBindBufferRange(GL_UNIFORM_BUFFER, 0, uboMatrices, 0, 2 * sizeof(glm::mat4));
```

首先我们为缓冲分配了足够的内存，它等于glm::mat4大小的两倍。GLM矩阵类型的大小直接对应于GLSL中的mat4。接下来，我们将缓冲中的特定范围（在这里是整个缓冲）链接到绑定点0。

剩余的就是填充这个缓冲了。如果我们将投影矩阵的**视野**(Field of View)值保持不变（所以摄像机就没有缩放了），我们只需要将其在程序中定义一次——这也意味着我们只需要将它插入到缓冲中一次。因为我们已经为缓冲对象分配了足够的内存，我们可以使用glBufferSubData在进入渲染循环之前存储投影矩阵：

```
glm::mat4 projection = glm::perspective(glm::radians(45.0f), (float)width/(float)height, 0.1f, 100.0f);
glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
glBufferSubData(GL_UNIFORM_BUFFER, 0, sizeof(glm::mat4), glm::value_ptr(projection));
glBindBuffer(GL_UNIFORM_BUFFER, 0);
```

这里我们将投影矩阵储存在Uniform缓冲的前半部分。在每次渲染迭代中绘制物体之前，我们会将观察矩阵更新到缓冲的后半部分：

```c++ nums++
glm::mat4 view = camera.GetViewMatrix();           
glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
glBufferSubData(GL_UNIFORM_BUFFER, sizeof(glm::mat4), sizeof(glm::mat4), glm::value_ptr(view));
glBindBuffer(GL_UNIFORM_BUFFER, 0);
```

Uniform缓冲对象的部分就结束了。每个包含了Matrices这个Uniform块的顶点着色器将会包含储存在uboMatrices中的数据。所以，如果我们现在要用4个不同的着色器绘制4个立方体，它们的投影和观察矩阵都会是一样的。

```
glBindVertexArray(cubeVAO);
shaderRed.use();
glm::mat4 model;
model = glm::translate(model, glm::vec3(-0.75f, 0.75f, 0.0f));  // 移动到左上角
shaderRed.setMat4("model", model);
glDrawArrays(GL_TRIANGLES, 0, 36);        
// ... 绘制绿色立方体
// ... 绘制蓝色立方体
// ... 绘制黄色立方体 
```

唯一需要设置的uniform只剩model uniform了。在像这样的场景中使用Uniform缓冲对象会让我们在每个着色器中都剩下一些uniform调用。最终的结果会是这样的：

![[1c1b176bba5383b543154f60b183c081_MD5 1.png]]

因为修改了模型矩阵，每个立方体都移动到了窗口的一边，并且由于使用了不同的片元着色器，它们的颜色也不同。这只是一个很简单的情景，我们可能会需要使用Uniform缓冲对象，但任何大型的渲染程序都可能同时激活有上百个着色器程序，这时候Uniform缓冲对象的优势就会很大地体现出来了。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/8.advanced_glsl_ubo/advanced_glsl_ubo.cpp)找到uniform例子程序的完整源代码。

Uniform缓冲对象比起独立的uniform有很多好处。第一，一次设置很多uniform会比一个一个设置多个uniform要快很多。第二，比起在多个着色器中修改同样的uniform，在Uniform缓冲中修改一次会更容易一些。最后一个好处可能不会立即显现，如果使用Uniform缓冲对象的话，你可以在着色器中使用更多的uniform。OpenGL限制了它能够处理的uniform数量，这可以通过GL_MAX_VERTEX_UNIFORM_COMPONENTS来查询。当使用Uniform缓冲对象时，最大的数量会更高。所以，当你达到了uniform的最大数量时（比如再做骨骼动画(Skeletal Animation)的时候），你总是可以选择使用Uniform缓冲对象。

## 几何着色器
在顶点和片元着色器之间有一个可选的几何着色器(Geometry Shader)，**几何着色器的输入是一个图元（如点或三角形）的一组顶点。几何着色器可以在顶点发送到下一着色器阶段之前对它们随意变换。** 然而，几何着色器最有趣的地方在于，**它能够将（这一组）顶点变换为完全不同的图元，并且还能生成比原来更多的顶点。**
废话不多说，我们直接先看一个几何着色器的例子：

```c++ nums
#version 330 core
layout (points) in;
layout (line_strip, max_vertices = 2) out;

void main() {    
    gl_Position = gl_in[0].gl_Position + vec4(-0.1, 0.0, 0.0, 0.0); 
    EmitVertex();

    gl_Position = gl_in[0].gl_Position + vec4( 0.1, 0.0, 0.0, 0.0);
    EmitVertex();

    EndPrimitive();
}
```

在几何着色器的顶部，我们需要**声明从顶点着色器输入的图元类型**。这需要在in关键字前声明一个布局修饰符(Layout Qualifier)。这个输入布局修饰符可以从顶点着色器接收下列任何一个图元值：

-   `points`：绘制GL_POINTS图元时（1）。
-   `lines`：绘制GL_LINES或GL_LINE_STRIP时（2）
-   `lines_adjacency`：GL_LINES_ADJACENCY或GL_LINE_STRIP_ADJACENCY（4）
-   `triangles`：GL_TRIANGLES、GL_TRIANGLE_STRIP或GL_TRIANGLE_FAN（3）
-   `triangles_adjacency`：GL_TRIANGLES_ADJACENCY或GL_TRIANGLE_STRIP_ADJACENCY（6）

以上是能提供给glDrawArrays渲染函数的几乎所有图元了。如果我们想要将顶点绘制为GL_TRIANGLES，我们就要将输入修饰符设置为`triangles`。括号内的数字表示的是一个图元所包含的最小顶点数。

**接下来，我们还需要指定几何着色器输出的图元类型，这需要在out关键字前面加一个布局修饰符。** 和输入布局修饰符一样，输出布局修饰符也可以接受几个图元值：

-   `points`
-   `line_strip`
-   `triangle_strip`

有了这3个输出修饰符，我们就可以使用输入图元创建几乎任意的形状了。要生成一个三角形的话，我们将输出定义为`triangle_strip`，并输出3个顶点。

几何着色器同时希望我们**设置一个它最大能够输出的顶点数量**（如果你超过了这个值，OpenGL将不会绘制**多出的**顶点），这个也可以在out关键字的布局修饰符中设置。在这个例子中，我们将输出一个`line_strip`，并将最大顶点数设置为2个。

如果你不知道什么是**线条(Line Strip)** ：线条连接了一组点，形成一条连续的线，它最少要由两个点来组成。在渲染函数中每多加一个点，就会在这个点与前一个点之间形成一条新的线。在下面这张图中，我们有5个顶点：

![[ecc47098b868f5050024e98d984ec458_MD5 1.png]]

如果使用的是上面定义的着色器，那么这将只能输出一条线段，因为最大顶点数等于2。

为了生成更有意义的结果，我们需要某种方式来获取前一着色器阶段的输出。**GLSL提供给我们一个内建(Built-in)变量，在内部看起来（可能）是这样的：**

```c++ nums
in gl_Vertex
{
    vec4  gl_Position;
    float gl_PointSize;
    float gl_ClipDistance[];
} gl_in[];
```

这里，它被声明为一个接口块（Interface Block，我们在[上一节](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/08%20Advanced%20GLSL/)已经讨论过），它包含了几个很有意思的变量，其中最有趣的一个是gl_Position，它是和顶点着色器输出非常相似的一个向量。

要注意的是，它被声明为一个数组，因为大多数的渲染图元包含多于1个的顶点，而几何着色器的输入是一个图元的**所有**顶点。

有了之前顶点着色器阶段的顶点数据，我们就可以使用2个几何着色器函数，`EmitVertex`和`EndPrimitive`，来生成新的数据了。**几何着色器希望你能够生成并输出至少一个定义为输出的图元**。在我们的例子中，我们需要至少生成一个线条图元。

```c++ nums
void main() {
    gl_Position = gl_in[0].gl_Position + vec4(-0.1, 0.0, 0.0, 0.0); 
    EmitVertex();

    gl_Position = gl_in[0].gl_Position + vec4( 0.1, 0.0, 0.0, 0.0);
    EmitVertex();

    EndPrimitive();
}
```

**每次我们调用`EmitVertex`时，`gl_Position`中的向量会被添加到图元中来。当`EndPrimitive`被调用时，所有发射出的(Emitted)顶点都会合成为指定的输出渲染图元。** 在一个或多个`EmitVertex`调用之后重复调用EndPrimitive能够生成多个图元。在这个例子中，我们发射了两个顶点，它们从原始顶点位置平移了一段距离，之后调用了EndPrimitive，将这两个顶点合成为一个包含两个顶点的线条。

现在你（大概）了解了几何着色器的工作方式，你可能已经猜出这个几何着色器是做什么的了。它接受一个点图元作为输入，以这个点为中心，创建一条水平的线图元。如果我们渲染它，看起来会是这样的：

![[d7c183df267ab8884e8278588fca1ebd_MD5 1.png]]

目前还并没有什么令人惊叹的效果，但考虑到这个输出是通过调用下面的渲染函数来生成的，它还是很有意思的：

```
glDrawArrays(GL_POINTS, 0, 4);
```

虽然这是一个比较简单的例子，它的确向你展示了如何能够使用几何着色器来（动态地）生成新的形状。在之后我们会利用几何着色器创建出更有意思的效果，但现在我们仍将从创建一个简单的几何着色器开始。
### 使用几何着色器
为了展示几何着色器的用法，我们将会渲染一个非常简单的场景，我们只会在标准化设备坐标的z平面上绘制四个点。这些点的坐标是：

```c++ nums
float points[] = {
    -0.5f,  0.5f, // 左上
     0.5f,  0.5f, // 右上
     0.5f, -0.5f, // 右下
    -0.5f, -0.5f  // 左下
};
```

顶点着色器只需要在z平面绘制点就可以了，所以我们将使用一个最基本顶点着色器：

```c++ nums
#version 330 core
layout (location = 0) in vec2 aPos;

void main()
{
    gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0); 
}
```

直接在片元着色器中硬编码，将所有的点都输出为绿色：

```c++ nums
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(0.0, 1.0, 0.0, 1.0);   
}
```

为点的顶点数据生成一个VAO和一个VBO，然后使用glDrawArrays进行绘制：

```c++ nums
shader.use();
glBindVertexArray(VAO);
glDrawArrays(GL_POINTS, 0, 4);
```

结果是在黑暗的场景中有四个（很难看见的）绿点：![[Pasted image 20220930103831.png]]
但我们之前不是学过这些吗？是的，但是现在我们将会添加一个几何着色器，为场景添加活力。

出于学习目的，我们将会创建一个传递(Pass-through)几何着色器，它会接收一个点图元，并直接将它**传递**(Pass)到下一个着色器：
```c++ nums
#version 330 core
layout (points) in;
layout (points, max_vertices = 1) out;

void main() {    
    gl_Position = gl_in[0].gl_Position; 
    EmitVertex();
    EndPrimitive();
}
```

现在这个几何着色器应该很容易理解了，它只是将它接收到的顶点位置不作修改直接发射出去，并生成一个点图元。

和顶点与片元着色器一样，几何着色器也需要编译和链接，但这次在创建着色器时我们将会使用GL_GEOMETRY_SHADER作为着色器类型：

```c++ nums
geometryShader = glCreateShader(GL_GEOMETRY_SHADER);
glShaderSource(geometryShader, 1, &gShaderCode, NULL);
glCompileShader(geometryShader);  
...
glAttachShader(program, geometryShader);
glLinkProgram(program);
```

着色器编译的代码和顶点与片元着色器代码都是一样的。记得要检查编译和链接错误！

如果你现在编译并运行程序，会看到和下面类似的结果：

![[ae2eda5bd40326dd4f55b81bc8664920_MD5 1.png]]

这和没使用几何着色器时是完全一样的！我承认这是有点无聊，但既然我们仍然能够绘制这些点，所以几何着色器是正常工作的，现在是时候做点更有趣的东西了！
### 造几个房子
绘制点和线并没有那么有趣，所以我们会使用一点创造力，利用几何着色器在每个点的位置上绘制一个房子。要实现这个，我们可以将几何着色器的输出设置为`triangle_strip`，并绘制三个三角形：其中两个组成一个正方形，另一个用作房顶。

OpenGL中，**三角形带(Triangle Strip)** 是绘制三角形更高效的方式，它使用顶点更少。在第一个三角形绘制完之后，每个后续顶点将会在上一个三角形边上生成另一个三角形：每3个临近的顶点将会形成一个三角形。如果我们一共有6个构成三角形带的顶点，那么我们会得到这些三角形：(1, 2, 3)、(2, 3, 4)、(3, 4, 5)和(4, 5, 6)，共形成4个三角形。一个三角形带至少需要3个顶点，并会生成N-2个三角形。使用6个顶点，我们创建了6-2 = 4个三角形。下面这幅图展示了这点：
![[59d35d5aefa6dd504c9cb85c00aa597e_MD5 1.png]]

通过使用三角形带作为几何着色器的输出，我们可以很容易创建出需要的房子形状，只需要以正确的顺序生成3个相连的三角形就行了。下面这幅图展示了顶点绘制的顺序，蓝点代表的是输入点：

![[717a3bbe243b3e18f19cd8033eff3673_MD5 1.png]]

变为几何着色器是这样的：
```c++ nums
#version 330 core
layout (points) in;
layout (triangle_strip, max_vertices = 5) out;

void build_house(vec4 position)
{    
    gl_Position = position + vec4(-0.2, -0.2, 0.0, 0.0);    // 1:左下
    EmitVertex();   
    gl_Position = position + vec4( 0.2, -0.2, 0.0, 0.0);    // 2:右下
    EmitVertex();
    gl_Position = position + vec4(-0.2,  0.2, 0.0, 0.0);    // 3:左上
    EmitVertex();
    gl_Position = position + vec4( 0.2,  0.2, 0.0, 0.0);    // 4:右上
    EmitVertex();
    gl_Position = position + vec4( 0.0,  0.4, 0.0, 0.0);    // 5:顶部
    EmitVertex();
    EndPrimitive();
}

void main() {    
    build_house(gl_in[0].gl_Position);
}
```

这个几何着色器生成了5个顶点，每个顶点都是原始点的位置加上一个偏移量，来组成一个大的三角形带。最终的图元会被光栅化，然后片元着色器会处理整个三角形带，最终在每个绘制的点处生成一个绿色房子：

![[4baa2fd84346fc6abebc0ca554383df5_MD5 1.png]]

你可以看到，每个房子实际上是由3个三角形组成的——全部都是使用空间中一点来绘制的。这些绿房子看起来是有点无聊，所以我们会再给每个房子分配一个不同的颜色。为了实现这个，我们需要在顶点着色器中添加一个额外的顶点属性，表示颜色信息，将它传递至几何着色器，并再次发送到片元着色器中。

下面是更新后的顶点数据：

```
float points[] = {
    -0.5f,  0.5f, 1.0f, 0.0f, 0.0f, // 左上
     0.5f,  0.5f, 0.0f, 1.0f, 0.0f, // 右上
     0.5f, -0.5f, 0.0f, 0.0f, 1.0f, // 右下
    -0.5f, -0.5f, 1.0f, 1.0f, 0.0f  // 左下
};
```

然后我们更新顶点着色器，使用一个接口块将颜色属性发送到几何着色器中：

```
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec3 aColor;

out VS_OUT {
    vec3 color;
} vs_out;

void main()
{
    gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0); 
    vs_out.color = aColor;
}
```

接下来我们还需要在几何着色器中声明相同的接口块（使用一个不同的接口名）：

```
in VS_OUT {
    vec3 color;
} gs_in[];
```

因为几何着色器是作用于输入的一组顶点的，从顶点着色器发来输入数据总是会以数组的形式表示出来，即便我们现在只有一个顶点。
>我们并不是必须要用接口块来向几何着色器传递数据。如果顶点着色器发送的颜色向量是`out vec3 vColor`，我们也可以这样写：  
```c++ nums
in vec3 vColor[];
```
>然而，接口块在几何着色器这样的着色器中会更容易处理一点。实际上，几何着色器的输入能够变得非常大，将它们合并为一个大的接口块数组会更符合逻辑一点。

接下来我们还需要为下个片元着色器阶段声明一个输出颜色向量：

```c++ nums
out vec3 fColor;
```

**因为片元着色器只需要一个（插值的）颜色，发送多个颜色并没有什么意义。所以，fColor向量就不是一个数组，而是一个单独的向量。** 当发射一个顶点的时候，每个顶点将会使用最后在fColor中储存的值，来用于片元着色器的运行。对我们的房子来说，我们只需要在第一个顶点发射之前，使用顶点着色器中的颜色填充fColor一次就可以了。

```c++ nums
fColor = gs_in[0].color; // gs_in[0] 因为只有一个输入顶点
gl_Position = position + vec4(-0.2, -0.2, 0.0, 0.0);    // 1:左下  
EmitVertex();   
gl_Position = position + vec4( 0.2, -0.2, 0.0, 0.0);    // 2:右下
EmitVertex();
gl_Position = position + vec4(-0.2,  0.2, 0.0, 0.0);    // 3:左上
EmitVertex();
gl_Position = position + vec4( 0.2,  0.2, 0.0, 0.0);    // 4:右上
EmitVertex();
gl_Position = position + vec4( 0.0,  0.4, 0.0, 0.0);    // 5:顶部
EmitVertex();
EndPrimitive();  
```

所有发射出的顶点都将嵌有最后储存在fColor中的值，即顶点的颜色属性值。所有的房子都会有它们自己的颜色了：

![[cffd9e01b487dcf048b4ac1a8cc11162_MD5 1.png]]

仅仅是为了有趣，我们也可以假装这是冬天，将最后一个顶点的颜色设置为白色，给屋顶落上一些雪。

```
fColor = gs_in[0].color; 
gl_Position = position + vec4(-0.2, -0.2, 0.0, 0.0);    // 1:左下 
EmitVertex();   
gl_Position = position + vec4( 0.2, -0.2, 0.0, 0.0);    // 2:右下
EmitVertex();
gl_Position = position + vec4(-0.2,  0.2, 0.0, 0.0);    // 3:左上
EmitVertex();
gl_Position = position + vec4( 0.2,  0.2, 0.0, 0.0);    // 4:右上
EmitVertex();
gl_Position = position + vec4( 0.0,  0.4, 0.0, 0.0);    // 5:顶部
fColor = vec3(1.0, 1.0, 1.0);
EmitVertex();
EndPrimitive();  
```

最终结果看起来是这样的：

![[796b496f4f67bec9226f85f8c3de61ad_MD5 1.png]]

你可以将你的代码与[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/9.1.geometry_shader_houses/geometry_shader_houses.cpp)的OpenGL代码进行比对。

你可以看到，有了几何着色器，你甚至可以将最简单的图元变得十分有创意。因为这些形状是在GPU的超快硬件中动态生成的，这会比在顶点缓冲中手动定义图形要高效很多。因此，**几何缓冲对简单而且经常重复的形状来说是一个很好的优化工具，比如体素(Voxel)世界中的方块和室外草地的每一根草。**
### 爆破物体
尽管绘制房子非常有趣，但我们不会经常这么做。这也是为什么我们接下来要继续深入，来爆破(Explode)物体！虽然这也是一个不怎么常用的东西，但是它能向你展示几何着色器的强大之处。

当我们说**爆破**一个物体时，我们并不是指要将宝贵的顶点集给炸掉，我们是要**将每个三角形沿着法向量的方向移动一小段时间。效果就是，整个物体看起来像是沿着每个三角形的法线向量爆炸一样**。爆炸三角形的效果在纳米装模型上看起来像是这样的：
![[Pasted image 20220930162905.png]]
这样的几何着色器效果的一个好处就是，无论物体有多复杂，它都能够应用上去。

因为我们想要沿着三角形的法向量位移每个顶点，我们首先需要计算这个法向量。我们所要做的是**计算垂直于三角形表面的向量，仅使用我们能够访问的3个顶点。** 你可能还记得在[变换](https://learnopengl-cn.github.io/01%20Getting%20started/07%20Transformations/)小节中，我们使用叉乘来获取垂直于其它两个向量的一个向量。如果我们能够获取两个平行于三角形表面的向量a和b，我们就能够对这两个向量进行叉乘来获取法向量了。下面这个几何着色器函数做的正是这个，来使用3个输入顶点坐标来获取法向量：

```c++ nums
vec3 GetNormal()
{
   vec3 a = vec3(gl_in[0].gl_Position) - vec3(gl_in[1].gl_Position);
   vec3 b = vec3(gl_in[2].gl_Position) - vec3(gl_in[1].gl_Position);
   return normalize(cross(a, b));
}
```

这里我们使用减法获取了两个平行于三角形表面的向量a和b。因为两个向量相减能够得到这两个向量之间的差值，并且三个点都位于三角平面上，对任意两个向量相减都能够得到一个平行于平面的向量。注意，如果我们交换了cross函数中a和b的位置，我们会得到一个指向相反方向的法向量——这里的顺序很重要！

既然知道了如何计算法向量了，我们就能够创建一个explode函数了，它使用法向量和顶点位置向量作为参数。**这个函数会返回一个新的向量，它是位置向量沿着法线向量进行位移之后的结果**：

```c++ nums
vec4 explode(vec4 position, vec3 normal)
{
    float magnitude = 2.0;
    vec3 direction = normal * ((sin(time) + 1.0) / 2.0) * magnitude; 
    return position + vec4(direction, 0.0);
}
```

函数本身应该不是非常复杂。sin函数接收一个time参数，它根据时间返回一个-1.0到1.0之间的值。因为我们不想让物体**向内爆炸**(Implode)，我们将sin值变换到了[0, 1]的范围内。最终的结果会乘以normal向量，并且最终的direction向量会被加到位置向量上。

当使用我们的[模型加载器](https://learnopengl-cn.github.io/03%20Model%20Loading/01%20Assimp/)绘制一个模型时，爆破(Explode)效果的完整几何着色器是这样的：

```c++ nums
#version 330 core
layout (triangles) in;
layout (triangle_strip, max_vertices = 3) out;

in VS_OUT {
    vec2 texCoords;
} gs_in[];

out vec2 TexCoords; 

uniform float time;

vec4 explode(vec4 position, vec3 normal) { ... }

vec3 GetNormal() { ... }

void main() {    
    vec3 normal = GetNormal();

    gl_Position = explode(gl_in[0].gl_Position, normal);
    TexCoords = gs_in[0].texCoords;
    EmitVertex();
    gl_Position = explode(gl_in[1].gl_Position, normal);
    TexCoords = gs_in[1].texCoords;
    EmitVertex();
    gl_Position = explode(gl_in[2].gl_Position, normal);
    TexCoords = gs_in[2].texCoords;
    EmitVertex();
    EndPrimitive();
}
```

注意我们在发射顶点之前输出了对应的纹理坐标。

而且别忘了在OpenGL代码中设置time变量：

```
shader.setFloat("time", glfwGetTime());
```

最终的效果是，3D模型看起来随着时间不断在爆破它的顶点，在这之后又回到正常状态。虽然这并不是非常有用，它的确向你展示了几何着色器更高级的用法。你可以将你的代码和[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/9.2.geometry_shader_exploding/geometry_shader_exploding.cpp)完整的源码进行比较。
### 法向量可视化
在这一部分中，我们将使用几何着色器来实现一个真正有用的例子：显示任意物体的法向量。当编写光照着色器时，你可能会最终会得到一些奇怪的视觉输出，但又很难确定导致问题的原因。光照错误很常见的原因就是法向量错误，这可能是由于不正确加载顶点数据、错误地将它们定义为顶点属性或在着色器中不正确地管理所导致的。我们想要的是使用某种方式来检测提供的法向量是正确的。**检测法向量是否正确的一个很好的方式就是对它们进行可视化，几何着色器正是实现这一目的非常有用的工具。**

**思路**是这样的：我们首先不使用几何着色器正常绘制场景。然后再次绘制场景，但这次只显示通过几何着色器生成法向量。几何着色器接收一个三角形图元，并沿着法向量生成三条线——每个顶点一个法向量。伪代码看起来会像是这样：
```c++ nums
shader.use();
DrawScene();
normalDisplayShader.use();
DrawScene();
```

这次在几何着色器中，我们会**使用模型提供的顶点法线，而不是自己生成**，为了适配（观察和模型矩阵的）缩放和旋转，我们在将法线变换到观察空间坐标之前，先使用法线矩阵变换一次（几何着色器接受的位置向量是观察空间坐标，所以我们应该将法向量变换到相同的空间中）。这可以在顶点着色器中完成：

```c++ nums
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out VS_OUT {
    vec3 normal;
} vs_out;

uniform mat4 view;
uniform mat4 model;

void main()
{
    gl_Position = view * model * vec4(aPos, 1.0); 
    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    vs_out.normal = normalize(vec3(vec4(normalMatrix * aNormal, 0.0)));
}
```

变换后的观察空间法向量会以接口块的形式传递到下个着色器阶段。接下来，几何着色器会接收每一个顶点（包括一个位置向量和一个法向量），并在每个位置向量处绘制一个法线向量：

```c++ nums
#version 330 core
layout (triangles) in;
layout (line_strip, max_vertices = 6) out;

in VS_OUT {
    vec3 normal;
} gs_in[];

const float MAGNITUDE = 0.4;

uniform mat4 projection;

void GenerateLine(int index)
{
    gl_Position = projection * gl_in[index].gl_Position;
    EmitVertex();
    gl_Position = projection * (gl_in[index].gl_Position + vec4(gs_in[index].normal, 0.0) * MAGNITUDE);
    EmitVertex();
    EndPrimitive();
}

void main()
{
    GenerateLine(0); // 第一个顶点法线
    GenerateLine(1); // 第二个顶点法线
    GenerateLine(2); // 第三个顶点法线
}
```

像这样的几何着色器应该很容易理解了。**注意我们将法向量乘以了一个MAGNITUDE向量，来限制显示出的法向量大小**（否则它们就有点大了）。
			
因为法线的可视化通常都是用于调试目的，我们可以使用片元着色器，将它们显示为单色的线（如果你愿意也可以是非常好看的线）：

```c++ nums
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}
```

现在，首先使用普通着色器渲染模型，再使用特别的**法线可视化**着色器渲染，你将看到这样的效果：

![[141cfb53d59d8e3ee740d0306abd2d58_MD5 1.png]]

尽管我们的纳米装现在看起来像是一个体毛很多而且带着隔热手套的人，它能够很有效地帮助我们判断模型的法线是否正确。你可以想象到，这样的几何着色器也经常用于给物体添加毛发(Fur)。

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/9.3.geometry_shader_normals/normal_visualization.cpp)找到源码。

## 实例化
假设你有一个绘制了很多模型的场景，而大部分的模型包含的是同一组顶点数据，只不过进行的是不同的世界空间变换。想象一个充满草的场景：每根草都是一个包含几个三角形的小模型。你可能会需要绘制很多根草，最终在每帧中你可能会需要渲染上千或者上万根草。因为每一根草仅仅是由几个三角形构成，渲染几乎是瞬间完成的，但上千个渲染函数调用却会极大地影响性能。

如果我们需要渲染大量物体时，代码看起来会像这样：
```c++ nums
for(unsigned int i = 0; i < amount_of_models_to_draw; i++)
{
    DoSomePreparations(); // 绑定VAO，绑定纹理，设置uniform等
    glDrawArrays(GL_TRIANGLES, 0, amount_of_vertices);
}
```

如果像这样绘制模型的大量实例(Instance)，你很快就会因为绘制调用过多而达到性能瓶颈。与绘制顶点本身相比，使用`glDrawArrays`或`glDrawElements`函数告诉GPU去绘制你的顶点数据会消耗更多的性能，因为OpenGL在绘制顶点数据之前需要做很多准备工作（比如告诉GPU该从哪个缓冲读取数据，从哪寻找顶点属性，而且这些都是在相对缓慢的CPU到GPU总线(CPU to GPU Bus)上进行的）。所以，即便渲染顶点非常快，命令GPU去渲染却未必。

如果我们能够**将数据一次性发送给GPU，然后使用一个绘制函数让Open GL利用这些数据绘制多个物体，就会更方便了。这就是实例化(Instancing)。**

实例化这项技术能够让我们**使用一个渲染调用来绘制多个物体**，来节省每次绘制物体时CPU -> GPU的通信，它只需要一次即可。**如果想使用实例化渲染，我们只需要将`glDrawArrays`和`glDrawElements`的渲染调用分别改为`glDrawArraysInstanced`和`glDrawElementsInstanced`就可以了。这些渲染函数的**实例化**版本需要一个额外的参数，叫做实例数量(Instance Count)，它能够设置我们需要渲染的实例个数。** 这样我们只需要将必须的数据发送到GPU一次，然后使用一次函数调用告诉GPU它应该如何绘制这些实例。GPU将会直接渲染这些实例，而不用不断地与CPU进行通信。

这个函数本身并没有什么用。渲染同一个物体一千次对我们并没有什么用处，每个物体都是完全相同的，而且还在同一个位置。我们只能看见一个物体！处于这个原因，GLSL在顶点着色器中嵌入了另一个内建变量，`gl_InstanceID`。

在使用实例化渲染调用时，`gl_InstanceID`会从0开始，在每个实例被渲染时递增1。比如说，我们正在渲染第43个实例，那么顶点着色器中它的gl_InstanceID将会是42。因为每个实例都有唯一的ID，我们可以建立一个数组，将ID与位置值对应起来，将每个实例放置在世界的不同位置。

为了体验一下实例化绘制，我们将会在标准化设备坐标系中使用一个渲染调用，绘制100个2D四边形。我们会索引一个包含100个偏移向量的uniform数组，将偏移值加到每个实例化的四边形上。最终的结果是一个排列整齐的四边形网格：

![[d9a1484e38d71a59b41e8f34e8aa5906_MD5 1.png]]

每个四边形由2个三角形所组成，一共有6个顶点。每个顶点包含一个2D的标准化设备坐标位置向量和一个颜色向量。 下面就是这个例子使用的顶点数据，为了大量填充屏幕，每个三角形都很小：

```c++ nums
float quadVertices[] = {
    // 位置          // 颜色
    -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
     0.05f, -0.05f,  0.0f, 1.0f, 0.0f,
    -0.05f, -0.05f,  0.0f, 0.0f, 1.0f,

    -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
     0.05f, -0.05f,  0.0f, 1.0f, 0.0f,   
     0.05f,  0.05f,  0.0f, 1.0f, 1.0f                   
};  
```

片元着色器会从顶点着色器接受颜色向量，并将其设置为它的颜色输出，来实现四边形的颜色：

```c++ nums
#version 330 core
out vec4 FragColor;

in vec3 fColor;

void main()
{
    FragColor = vec4(fColor, 1.0);
}
```

到现在都没有什么新内容，但从顶点着色器开始就变得很有趣了：

```c++ nums
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec3 aColor;

out vec3 fColor;

uniform vec2 offsets[100];

void main()
{
    vec2 offset = offsets[gl_InstanceID];
    gl_Position = vec4(aPos + offset, 0.0, 1.0);
    fColor = aColor;
}
```

这里我们定义了一个叫做`offsets`的数组，它包含100个偏移向量。在顶点着色器中，我们会使用gl_InstanceID来索引offsets数组，获取每个实例的偏移向量。如果我们要实例化绘制100个四边形，仅使用这个顶点着色器我们就能得到100个位于不同位置的四边形。

当前，我们仍要设置这些偏移位置，我们会在进入渲染循环之前使用一个嵌套for循环计算：

```c++ nums
glm::vec2 translations[100];
int index = 0;
float offset = 0.1f;
for(int y = -10; y < 10; y += 2)
{
    for(int x = -10; x < 10; x += 2)
    {
        glm::vec2 translation;
        translation.x = (float)x / 10.0f + offset;
        translation.y = (float)y / 10.0f + offset;
        translations[index++] = translation;
    }
}
```

这里，我们创建100个位移向量，表示10x10网格上的所有位置。除了生成translations数组之外，我们还需要将数据转移到顶点着色器的uniform数组中：

```c++ nums
shader.use();
for(unsigned int i = 0; i < 100; i++)
{
    stringstream ss;
    string index;
    ss << i; 
    index = ss.str(); 
    shader.setVec2(("offsets[" + index + "]").c_str(), translations[i]);
}
```

在这一段代码中，我们将for循环的计数器i转换为一个string，我们可以用它来动态创建位置值的字符串，用于uniform位置值的索引。接下来，我们会对offsets uniform数组中的每一项设置对应的位移向量。

现在所有的准备工作都做完了，我们可以开始渲染四边形了。对于实例化渲染，我们使用`glDrawArraysInstanced`或`glDrawElementsInstanced`。因为我们使用的不是索引缓冲，我们会调用glDrawArrays版本的函数：

```c++ nums
glBindVertexArray(quadVAO);
glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);
```

`glDrawArraysInstanced`的参数和`glDrawArrays`完全一样，除了最后多了个参数用来设置需要绘制的实例数量。因为我们想要在10x10网格中显示100个四边形，我们将它设置为100.运行代码之后，你应该能得到熟悉的100个五彩的四边形。
### 实例化数组
虽然之前的实现在目前的情况下能够正常工作，但是如果我们要渲染远超过100个实例的时候（这其实非常普遍），我们最终会超过最大能够发送至着色器的uniform数据大小[上限](http://www.opengl.org/wiki/Uniform_(GLSL)#Implementation_limits)。它的一个代替方案是**实例化数组(Instanced Array)，它被定义为一个顶点属性（能够让我们储存更多的数据），仅在顶点着色器渲染一个新的实例时才会更新。**

使用顶点属性时，顶点着色器的每次运行都会让GLSL获取新一组适用于当前顶点的属性。而当我们将顶点属性定义为一个实例化数组时，顶点着色器就只需要对每个实例，而不是每个顶点，更新顶点属性的内容了。这允许我们对逐顶点的数据使用普通的顶点属性，而对逐实例的数据使用实例化数组。

为了给你一个实例化数组的例子，我们将使用之前的例子，并将偏移量uniform数组设置为一个实例化数组。我们需要在顶点着色器中再添加一个顶点属性：
```
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec3 aColor;
layout (location = 2) in vec2 aOffset;

out vec3 fColor;

void main()
{
    gl_Position = vec4(aPos + aOffset, 0.0, 1.0);
    fColor = aColor;
}
```

我们不再使用`gl_InstanceID`，现在不需要索引一个uniform数组就能够直接使用offset属性了。

因为实例化数组和position与color变量一样，都是顶点属性，我们还需要将它的内容存在顶点缓冲对象中，并且配置它的属性指针。我们首先将（上一部分的）translations数组存到一个新的缓冲对象中：

```
unsigned int instanceVBO;
glGenBuffers(1, &instanceVBO);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(glm::vec2) * 100, &translations[0], GL_STATIC_DRAW);
glBindBuffer(GL_ARRAY_BUFFER, 0);
```

之后我们还需要设置它的顶点属性指针，并启用顶点属性：

```
glEnableVertexAttribArray(2);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
glBindBuffer(GL_ARRAY_BUFFER, 0);   
glVertexAttribDivisor(2, 1);
```

这段代码很有意思的地方在于最后一行，我们调用了glVertexAttribDivisor。这个函数告诉了OpenGL该**什么时候**更新顶点属性的内容至新一组数据。它的第一个参数是需要的顶点属性，第二个参数是属性除数(Attribute Divisor)。默认情况下，属性除数是0，告诉OpenGL我们需要在顶点着色器的每次迭代时更新顶点属性。将它设置为1时，我们告诉OpenGL我们希望在渲染一个新实例的时候更新顶点属性。而设置为2时，我们希望每2个实例更新一次属性，以此类推。我们将属性除数设置为1，是在告诉OpenGL，处于位置值2的顶点属性是一个实例化数组。

如果我们现在使用glDrawArraysInstanced，再次渲染四边形，会得到以下输出：

![[d9a1484e38d71a59b41e8f34e8aa5906_MD5 1.png]]

这和之前的例子是完全一样的，但这次是使用实例化数组实现的，这让我们能够传递更多的数据到顶点着色器（只要内存允许）来用于实例化绘制。

为了更有趣一点，我们也可以使用gl_InstanceID，从右上到左下逐渐缩小四边形：

```
void main()
{
    vec2 pos = aPos * (gl_InstanceID / 100.0);
    gl_Position = vec4(pos + aOffset, 0.0, 1.0);
    fColor = aColor;
}
```

结果就是，第一个四边形的实例会非常小，随着绘制实例的增加，gl_InstanceID会越来越接近100，四边形也就越来越接近原始大小。像这样将实例化数组与gl_InstanceID结合使用是完全可行的。

![[f5207b4f73dbadb6514382a53b7f33b8_MD5 1.png]]

如果你还是不确定实例化渲染是如何工作的，或者想看看所有代码是如何组合起来的，你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/10.1.instancing_quads/instancing_quads.cpp)找到程序的源代码。

虽然很有趣，但是这些例子并不是实例化的好例子。是的，它们的确让你知道实例化是怎么工作的，但是我们还没接触到它最有用的一点：绘制巨大数量的相似物体。出于这个原因，我们将会在下一部分进入太空探险，见识实例化渲染真正的威力。
### 小行星带
想象这样一个场景，在宇宙中有一个大的行星，它位于小行星带的中央。这样的小行星带可能包含成千上万的岩块，在很不错的显卡上也很难完成这样的渲染。实例化渲染正是适用于这样的场景，因为所有的小行星都可以使用一个模型来表示。每个小行星可以再使用不同的变换矩阵来进行少许的变化。

为了展示实例化渲染的作用，我们首先会**不使用**实例化渲染，来渲染小行星绕着行星飞行的场景。这个场景将会包含一个大的行星模型，它可以在[这里](https://learnopengl-cn.github.io/data/planet.rar)下载，以及很多环绕着行星的小行星。小行星的岩石模型可以在[这里](https://learnopengl-cn.github.io/data/rock.rar)下载。

在代码例子中，我们将使用在[模型加载](https://learnopengl-cn.github.io/03%20Model%20Loading/01%20Assimp/)小节中定义的模型加载器来加载模型。

为了得到想要的效果，我们将会为每个小行星生成一个变换矩阵，用作它们的模型矩阵。变换矩阵首先将小行星位移到小行星带中的某处，我们还会加一个小的随机偏移值到这个偏移量上，让这个圆环看起来更自然一点。接下来，我们应用一个随机的缩放，并且以一个旋转向量为轴进行一个随机的旋转。最终的变换矩阵不仅能将小行星变换到行星的周围，而且会让它看起来更自然，与其它小行星不同。最终的结果是一个布满小行星的圆环，其中每一个小行星都与众不同。
```
unsigned int amount = 1000;
glm::mat4 *modelMatrices;
modelMatrices = new glm::mat4[amount];
srand(glfwGetTime()); // 初始化随机种子    
float radius = 50.0;
float offset = 2.5f;
for(unsigned int i = 0; i < amount; i++)
{
    glm::mat4 model;
    // 1. 位移：分布在半径为 'radius' 的圆形上，偏移的范围是 [-offset, offset]
    float angle = (float)i / (float)amount * 360.0f;
    float displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
    float x = sin(angle) * radius + displacement;
    displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
    float y = displacement * 0.4f; // 让行星带的高度比x和z的宽度要小
    displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
    float z = cos(angle) * radius + displacement;
    model = glm::translate(model, glm::vec3(x, y, z));

    // 2. 缩放：在 0.05 和 0.25f 之间缩放
    float scale = (rand() % 20) / 100.0f + 0.05;
    model = glm::scale(model, glm::vec3(scale));

    // 3. 旋转：绕着一个（半）随机选择的旋转轴向量进行随机的旋转
    float rotAngle = (rand() % 360);
    model = glm::rotate(model, rotAngle, glm::vec3(0.4f, 0.6f, 0.8f));

    // 4. 添加到矩阵的数组中
    modelMatrices[i] = model;
}  
```

这段代码看起来可能有点吓人，但我们只是将小行星的`x`和`z`位置变换到了一个半径为radius的圆形上，并且在半径的基础上偏移了-offset到offset。我们让`y`偏移的影响更小一点，让小行星带更扁平一点。接下来，我们应用了缩放和旋转变换，并将最终的变换矩阵储存在modelMatrices中，这个数组的大小是amount。这里，我们一共生成1000个模型矩阵，每个小行星一个。

在加载完行星和岩石模型，并编译完着色器之后，渲染的代码看起来是这样的：

```
// 绘制行星
shader.use();
glm::mat4 model;
model = glm::translate(model, glm::vec3(0.0f, -3.0f, 0.0f));
model = glm::scale(model, glm::vec3(4.0f, 4.0f, 4.0f));
shader.setMat4("model", model);
planet.Draw(shader);

// 绘制小行星
for(unsigned int i = 0; i < amount; i++)
{
    shader.setMat4("model", modelMatrices[i]);
    rock.Draw(shader);
}  
```

我们首先绘制了行星的模型，并对它进行位移和缩放，以适应场景，接下来，我们绘制amount数量的岩石模型。在绘制每个岩石之前，我们首先需要在着色器内设置对应的模型变换矩阵。

最终的结果是一个看起来像是太空的场景，环绕着行星的是看起来很自然的小行星带：

![[5ff05169a1b62c873b068882e779ab3b_MD5 1.png]]

这个场景每帧包含1001次渲染调用，其中1000个是岩石模型。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/10.2.asteroids/asteroids.cpp)找到源代码。

当我们开始增加这个数字的时候，你很快就会发现场景不再能够流畅运行了，帧数也下降很厉害。当我们将amount设置为2000的时候，场景就已经慢到移动都很困难的程度了。

现在，我们来尝试使用实例化渲染来渲染相同的场景。我们首先对顶点着色器进行一点修改：

```
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 2) in vec2 aTexCoords;
layout (location = 3) in mat4 instanceMatrix;

out vec2 TexCoords;

uniform mat4 projection;
uniform mat4 view;

void main()
{
    gl_Position = projection * view * instanceMatrix * vec4(aPos, 1.0); 
    TexCoords = aTexCoords;
}
```

我们不再使用模型uniform变量，改为一个mat4的顶点属性，让我们能够存储一个实例化数组的变换矩阵。然而，当我们顶点属性的类型大于vec4时，就要多进行一步处理了。顶点属性最大允许的数据大小等于一个vec4。因为一个mat4本质上是4个vec4，我们需要为这个矩阵预留4个顶点属性。因为我们将它的位置值设置为3，矩阵每一列的顶点属性位置值就是3、4、5和6。

接下来，我们需要为这4个顶点属性设置属性指针，并将它们设置为实例化数组：

```
// 顶点缓冲对象
unsigned int buffer;
glGenBuffers(1, &buffer);
glBindBuffer(GL_ARRAY_BUFFER, buffer);
glBufferData(GL_ARRAY_BUFFER, amount * sizeof(glm::mat4), &modelMatrices[0], GL_STATIC_DRAW);

for(unsigned int i = 0; i < rock.meshes.size(); i++)
{
    unsigned int VAO = rock.meshes[i].VAO;
    glBindVertexArray(VAO);
    // 顶点属性
    GLsizei vec4Size = sizeof(glm::vec4);
    glEnableVertexAttribArray(3); 
    glVertexAttribPointer(3, 4, GL_FLOAT, GL_FALSE, 4 * vec4Size, (void*)0);
    glEnableVertexAttribArray(4); 
    glVertexAttribPointer(4, 4, GL_FLOAT, GL_FALSE, 4 * vec4Size, (void*)(vec4Size));
    glEnableVertexAttribArray(5); 
    glVertexAttribPointer(5, 4, GL_FLOAT, GL_FALSE, 4 * vec4Size, (void*)(2 * vec4Size));
    glEnableVertexAttribArray(6); 
    glVertexAttribPointer(6, 4, GL_FLOAT, GL_FALSE, 4 * vec4Size, (void*)(3 * vec4Size));

    glVertexAttribDivisor(3, 1);
    glVertexAttribDivisor(4, 1);
    glVertexAttribDivisor(5, 1);
    glVertexAttribDivisor(6, 1);

    glBindVertexArray(0);
}  
```

注意这里我们将Mesh的VAO从私有变量改为了公有变量，让我们能够访问它的顶点数组对象。这并不是最好的解决方案，只是为了配合本小节的一个简单的改动。除此之外代码就应该很清楚了。我们告诉了OpenGL应该如何解释每个缓冲顶点属性的缓冲，并且告诉它这些顶点属性是实例化数组。

接下来，我们再次使用网格的VAO，这一次使用glDrawElementsInstanced进行绘制：

```
// 绘制小行星
instanceShader.use();
for(unsigned int i = 0; i < rock.meshes.size(); i++)
{
    glBindVertexArray(rock.meshes[i].VAO);
    glDrawElementsInstanced(
        GL_TRIANGLES, rock.meshes[i].indices.size(), GL_UNSIGNED_INT, 0, amount
    );
}
```

这里，我们绘制与之前相同数量amount的小行星，但是使用的是实例渲染。结果应该是非常相似的，但如果你开始增加amount变量，你就能看见实例化渲染的效果了。没有实例化渲染的时候，我们只能流畅渲染1000到1500个小行星。而使用了实例化渲染之后，我们可以将这个值设置为100000，每个岩石模型有576个顶点，每帧加起来大概要绘制5700万个顶点，但性能却没有受到任何影响！

![[791e2a298d81ad1054592365097b9128_MD5 1.png]]

上面这幅图渲染了10万个小行星，半径为`150.0f`，偏移量等于`25.0f`。你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/10.3.asteroids_instanced/asteroids_instanced.cpp)找到实例化渲染的代码。

在某些机器上，10万个小行星可能会太多了，所以尝试修改这个值，直到达到一个你能接受的帧率。

可以看到，在合适的环境下，实例化渲染能够大大增加显卡的渲染能力。正是出于这个原因，实例化渲染通常会用于渲染草、植被、粒子，以及上面这样的场景，基本上只要场景中有很多重复的形状，都能够使用实例化渲染来提高性能。
## 抗锯齿
在学习渲染的旅途中，你可能会时不时遇到模型边缘有锯齿的情况。这些锯齿边缘(Jagged Edges)的产生和光栅器将顶点数据转化为片段的方式有关。在下面的例子中，你可以看到，我们只是绘制了一个简单的立方体，你就能注意到它存在锯齿边缘了：

![[d7e996b08d53cd7c37a13324043dd0de_MD5 1.png]]

可能不是非常明显，但如果你离近仔细观察立方体的边缘，你就应该能够看到锯齿状的图案。如果放大的话，你会看到下面的图案：

![[82516b023b1b0226f660f860db4e4dc1_MD5 1.png]]

这很明显不是我们想要在最终程序中所实现的效果。你能够清楚看见形成边缘的像素。这种现象被称之为**走样(Aliasing)**。有很多种**抗锯齿（Anti-aliasing，也被称为反走样）** 的技术能够帮助我们缓解这种现象，从而产生更平滑的边缘。

最开始我们有一种叫做**超采样抗锯齿(Super Sample Anti-aliasing, SSAA)** 的技术，它会使用比正常分辨率更高的分辨率（即超采样）来渲染场景，当图像输出在帧缓冲中更新时，分辨率会被下采样(Downsample)至正常的分辨率。这些**额外的**分辨率会被用来防止锯齿边缘的产生。虽然它确实能够解决走样的问题，但是由于这样比平时要绘制更多的片段，它也会带来很大的性能开销。所以这项技术只拥有了短暂的辉煌。

然而，在这项技术的基础上也诞生了更为现代的技术，叫做**多重采样抗锯齿(Multisample Anti-aliasing, MSAA)** 。它借鉴了SSAA背后的理念，但却以更加高效的方式实现了抗锯齿。我们在这一节中会深度讨论OpenGL中内建的MSAA技术。
### 多重采样（MSAA）
为了理解什么是多重采样(Multisampling)，以及它是如何解决锯齿问题的，我们有必要更加深入地了解**OpenGL光栅器的工作方式**。

**光栅器是位于最终处理过的顶点之后到片元着色器之前所经过的所有的算法与过程的总和。** 光栅器会将一个图元的所有顶点作为输入，并将它转换为一系列的片段。顶点坐标理论上可以取任意值，但片段不行，因为它们受限于你窗口的分辨率。顶点坐标与片段之间几乎永远也不会有一对一的映射，所以光栅器必须以某种方式来决定每个顶点最终所在的片段/屏幕坐标。

![[15ac2bd64b2bb6cbf797d15350d08923_MD5 1.png]]

这里我们可以看到一个屏幕像素的网格，每个像素的中心包含有一个采样点(Sample Point)，它会被用来决定这个三角形是否遮盖了某个像素。图中红色的采样点被三角形所遮盖，在每一个遮住的像素处都会生成一个片段。虽然三角形边缘的一些部分也遮住了某些屏幕像素，但是这些像素的采样点并没有被三角形**内部**所遮盖，所以它们不会受到片元着色器的影响。

你现在可能已经清楚走样的原因了。完整渲染后的三角形在屏幕上会是这样的：

![[30e53c727214e45446f79ca88554a041_MD5 1.png]]

由于屏幕像素总量的限制，有些边缘的像素能够被渲染出来，而有些则不会。结果就是我们使用了不光滑的边缘来渲染图元，导致之前讨论到的锯齿边缘。

**多重采样所做的正是将单一的采样点变为多个采样点**（这也是它名称的由来）。我们不再使用像素中心的单一采样点，取而代之的是以特定图案排列的**4个子采样点(Subsample)**。我们将用这些子采样点来决定像素的遮盖度。当然，这也意味着颜色缓冲的大小会随着子采样点的增加而增加。

![[131cda125caafef0b84a47a9607e2044_MD5 1.png]]

上图的左侧展示了正常情况下判定三角形是否遮盖的方式。在例子中的这个像素上不会运行片元着色器（所以它会保持空白）。因为它的采样点并未被三角形所覆盖。上图的右侧展示的是实施多重采样之后的版本，每个像素包含有4个采样点。这里，只有两个采样点遮盖住了三角形。

**采样点的数量可以是任意的，更多的采样点能带来更精确的遮盖率。**

从这里开始多重采样就变得有趣起来了。我们知道三角形只遮盖了2个子采样点，所以下一步是决定这个像素的颜色。你的猜想可能是，我们对每个被遮盖住的子采样点运行一次片元着色器，最后将每个像素所有子采样点的颜色平均一下。在这个例子中，我们需要在两个子采样点上对被插值的顶点数据运行两次片元着色器，并将结果的颜色储存在这些采样点中。（幸运的是）这并**不是**它工作的方式，因为这本质上说还是需要运行更多次的片元着色器，会显著地降低性能。

**MSAA真正的工作方式**是，无论三角形遮盖了多少个子采样点，（每个图元中）每个像素只运行**一次**片元着色器。片元着色器所使用的顶点数据会插值到每个像素的**中心**，所得到的结果颜色会被储存在每个被遮盖住的子采样点中。当颜色缓冲的子样本被图元的所有颜色填满时，所有的这些颜色将会在每个像素内部平均化。因为上图的4个采样点中只有2个被遮盖住了，**这个像素的颜色将会是三角形颜色与其他两个采样点的颜色（在这里是无色）的平均值，最终形成一种淡蓝色。**

这样子做之后，颜色缓冲中所有的图元边缘将会产生一种更平滑的图形。让我们来看看前面三角形的多重采样会是什么样子：

![[edec1db30c43203c976f5a90b3a1708c_MD5 1.png]]

这里，每个像素包含4个子采样点（不相关的采样点都没有标注），蓝色的采样点被三角形所遮盖，而灰色的则没有。对于三角形的内部的像素，片元着色器只会运行一次，颜色输出会被存储到全部的4个子样本中。而在三角形的边缘，并不是所有的子采样点都被遮盖，所以片元着色器的结果将只会储存到部分的子样本中。根据被遮盖的子样本的数量，最终的像素颜色将由三角形的颜色与其它子样本中所储存的颜色来决定。

**简单来说，一个像素中如果有更多的采样点被三角形遮盖，那么这个像素的颜色就会更接近于三角形的颜色。** 如果我们给上面的三角形填充颜色，就能得到以下的效果：

![[f76d524dad2ac0bd5a0be47f902ab694_MD5 1.png]]

对于每个像素来说，越少的子采样点被三角形所覆盖，那么它受到三角形的影响就越小。三角形的不平滑边缘被稍浅的颜色所包围后，从远处观察时就会显得更加平滑了。

**不仅仅是颜色值会受到多重采样的影响，深度和模板测试也能够使用多个采样点。** 对深度测试来说，每个顶点的深度值会在运行深度测试之前被插值到各个子样本中。对模板测试来说，我们对每个子样本，而不是每个像素，存储一个模板值。当然，这也意味着深度和模板缓冲的大小会乘以子采样点的个数。

我们到目前为止讨论的都是多重采样抗锯齿的背后原理，光栅器背后的实际逻辑比目前讨论的要复杂，但你现在应该已经可以理解多重采样抗锯齿的大体概念和逻辑了。

(译者注： 如果看到这里还是对原理似懂非懂，可以简单看看知乎上[@文刀秋二](https://www.zhihu.com/people/edliu/answers)对抗锯齿技术的[精彩介绍](https://www.zhihu.com/question/20236638/answer/14438218))

#### OpenGL中的MSAA

如果我们想要在OpenGL中使用MSAA，我们必须要使用一个能在每个像素中存储大于1个颜色值的颜色缓冲（因为多重采样需要我们为每个采样点都储存一个颜色）。所以，我们需要一个新的缓冲类型，来存储特定数量的多重采样样本，它叫做多重采样缓冲(Multisample Buffer)。

大多数的窗口系统都应该提供了一个多重采样缓冲，用以代替默认的颜色缓冲。GLFW同样给了我们这个功能，我们所要做的只是**提示**(Hint) GLFW，我们希望使用一个包含N个样本的多重采样缓冲。这可以在创建窗口之前调用glfwWindowHint来完成。

```
glfwWindowHint(GLFW_SAMPLES, 4);
```

现在再调用glfwCreateWindow创建渲染窗口时，每个屏幕坐标就会使用一个包含4个子采样点的颜色缓冲了。GLFW会自动创建一个每像素4个子采样点的深度和样本缓冲。这也意味着所有缓冲的大小都增长了4倍。

现在我们已经向GLFW请求了多重采样缓冲，我们还需要调用glEnable并启用GL_MULTISAMPLE，来启用多重采样。在大多数OpenGL的驱动上，多重采样都是默认启用的，所以这个调用可能会有点多余，但显式地调用一下会更保险一点。这样子不论是什么OpenGL的实现都能够正常启用多重采样了。

```
glEnable(GL_MULTISAMPLE);
```

只要默认的帧缓冲有了多重采样缓冲的附件，我们所要做的只是调用glEnable来启用多重采样。因为多重采样的算法都在OpenGL驱动的光栅器中实现了，我们不需要再多做什么。如果现在再来渲染本节一开始的那个绿色的立方体，我们应该能看到更平滑的边缘：

![[c07fafca7ca803e093a95aa1d4f1cd04_MD5 1.png]]

这个箱子看起来的确要平滑多了，如果在场景中有其它的物体，它们也会看起来平滑很多。你可以在[这里](https://learnopengl.com/code_viewer.php?code=advanced/anti_aliasing_multisampling)找到这个简单例子的源代码。

#### 离屏MSAA（未学习）

由于GLFW负责了创建多重采样缓冲，启用MSAA非常简单。然而，如果我们想要使用我们自己的帧缓冲来进行离屏渲染，那么我们就必须要自己动手生成多重采样缓冲了。

有两种方式可以创建多重采样缓冲，将其作为帧缓冲的附件：纹理附件和渲染缓冲附件，这和在[帧缓冲](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/05%20Framebuffers/)教程中所讨论的普通附件很相似。

##### 多重采样纹理附件

为了创建一个支持储存多个采样点的纹理，我们使用glTexImage2DMultisample来替代glTexImage2D，它的纹理目标是GL_TEXTURE_2D_MULTISAPLE。

```
glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, tex);
glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE, samples, GL_RGB, width, height, GL_TRUE);
glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, 0);

```

它的第二个参数设置的是纹理所拥有的样本个数。如果最后一个参数为GL_TRUE，图像将会对每个纹素使用相同的样本位置以及相同数量的子采样点个数。

我们使用glFramebufferTexture2D将多重采样纹理附加到帧缓冲上，但这里纹理类型使用的是GL_TEXTURE_2D_MULTISAMPLE。

```
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D_MULTISAMPLE, tex, 0);
```

当前绑定的帧缓冲现在就有了一个纹理图像形式的多重采样颜色缓冲。

##### 多重采样渲染缓冲对象

和纹理类似，创建一个多重采样渲染缓冲对象并不难。我们所要做的只是在指定（当前绑定的）渲染缓冲的内存存储时，将glRenderbufferStorage的调用改为glRenderbufferStorageMultisample就可以了。

```
glRenderbufferStorageMultisample(GL_RENDERBUFFER, 4, GL_DEPTH24_STENCIL8, width, height);
```

函数中，渲染缓冲对象后的参数我们将设定为样本的数量，在当前的例子中是4。

##### 渲染到多重采样帧缓冲

渲染到多重采样帧缓冲对象的过程都是自动的。只要我们在帧缓冲绑定时绘制任何东西，光栅器就会负责所有的多重采样运算。我们最终会得到一个多重采样颜色缓冲以及/或深度和模板缓冲。因为多重采样缓冲有一点特别，我们不能直接将它们的缓冲图像用于其他运算，比如在着色器中对它们进行采样。

一个多重采样的图像包含比普通图像更多的信息，我们所要做的是缩小或者还原(Resolve)图像。多重采样帧缓冲的还原通常是通过glBlitFramebuffer来完成，它能够将一个帧缓冲中的某个区域复制到另一个帧缓冲中，并且将多重采样缓冲还原。

glBlitFramebuffer会将一个用4个屏幕空间坐标所定义的源区域复制到一个同样用4个屏幕空间坐标所定义的目标区域中。你可能记得在[帧缓冲](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/05%20Framebuffers/)教程中，当我们绑定到GL_FRAMEBUFFER时，我们是同时绑定了读取和绘制的帧缓冲目标。我们也可以将帧缓冲分开绑定至GL_READ_FRAMEBUFFER与GL_DRAW_FRAMEBUFFER。glBlitFramebuffer函数会根据这两个目标，决定哪个是源帧缓冲，哪个是目标帧缓冲。接下来，我们可以将图像位块传送(Blit)到默认的帧缓冲中，将多重采样的帧缓冲传送到屏幕上。

```python
glBindFramebuffer(GL_READ_FRAMEBUFFER, multisampledFBO);
glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);
glBlitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_COLOR_BUFFER_BIT, GL_NEAREST);
```

如果现在再来渲染这个程序，我们会得到与之前完全一样的结果：一个使用MSAA显示出来的橄榄绿色的立方体，而且锯齿边缘明显减少了：

![[c07fafca7ca803e093a95aa1d4f1cd04_MD5 1.png]]

你可以在[这里](https://learnopengl.com/code_viewer_gh.php?code=src/4.advanced_opengl/11.anti_aliasing_offscreen/anti_aliasing_offscreen.cpp)找到源代码。

但如果我们想要使用多重采样帧缓冲的纹理输出来做像是后期处理这样的事情呢？我们不能直接在片元着色器中使用多重采样的纹理。但我们能做的是将多重采样缓冲位块传送到一个没有使用多重采样纹理附件的FBO中。然后用这个普通的颜色附件来做后期处理，从而达到我们的目的。然而，这也意味着我们需要生成一个新的FBO，作为中介帧缓冲对象，将多重采样缓冲还原为一个能在着色器中使用的普通2D纹理。这个过程的伪代码是这样的：

```c++ nums
unsigned int msFBO = CreateFBOWithMultiSampledAttachments();
// 使用普通的纹理颜色附件创建一个新的FBO
...
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, screenTexture, 0);
...
while(!glfwWindowShouldClose(window))
{
    ...

    glBindFramebuffer(msFBO);
    ClearFrameBuffer();
    DrawScene();
    // 将多重采样缓冲还原到中介FBO上
    glBindFramebuffer(GL_READ_FRAMEBUFFER, msFBO);
    glBindFramebuffer(GL_DRAW_FRAMEBUFFER, intermediateFBO);
    glBlitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_COLOR_BUFFER_BIT, GL_NEAREST);
    // 现在场景是一个2D纹理缓冲，可以将这个图像用来后期处理
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    ClearFramebuffer();
    glBindTexture(GL_TEXTURE_2D, screenTexture);
    DrawPostProcessingQuad();  

    ... 
}
```

如果现在再实现[帧缓冲](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/05%20Framebuffers/)教程中的后期处理效果，我们就能够在一个几乎没有锯齿的场景纹理上进行后期处理了。如果施加模糊的核滤镜，看起来将会是这样：

![[2aa531f57844bfc8cbc5c8d0f639ddde_MD5 1.png]]

因为屏幕纹理又变回了一个只有单一采样点的普通纹理，像是**边缘检测**这样的后期处理滤镜会重新导致锯齿。为了补偿这一问题，你可以之后对纹理进行模糊处理，或者想出你自己的抗锯齿算法。

你可以看到，如果将多重采样与离屏渲染结合起来，我们需要自己负责一些额外的细节。但所有的这些细节都是值得额外的努力的，因为多重采样能够显著提升场景的视觉质量。当然，要注意，如果使用的采样点非常多，启用多重采样会显著降低程序的性能。在本节写作时，通常采用的是4采样点的MSAA。
### 自定义抗锯齿算法（未学习）

将一个多重采样的纹理图像不进行还原直接传入着色器也是可行的。GLSL提供了这样的选项，让我们能够对纹理图像的每个子样本进行采样，所以我们可以创建我们自己的抗锯齿算法。在大型的图形应用中通常都会这么做。

要想获取每个子样本的颜色值，你需要将纹理uniform采样器设置为sampler2DMS，而不是平常使用的sampler2D：

```
uniform sampler2DMS screenTextureMS;
```

使用texelFetch函数就能够获取每个子样本的颜色值了：

```
vec4 colorSample = texelFetch(screenTextureMS, TexCoords, 3);  // 第4个子样本
```

我们不会深入探究自定义抗锯齿技术的细节，这里仅仅是给你一点启发。
## 高级光照
在[光照](https://learnopengl-cn.github.io/02%20Lighting/02%20Basic%20Lighting/)小节中，我们简单地介绍了冯氏光照模型，它让我们的场景有了一定的真实感。虽然冯氏模型看起来已经很不错了，但是使用它的时候仍然存在一些细节问题，我们将在这一节里讨论它们。
### Blinn-Phong
**冯氏光照**不仅对真实光照有很好的近似，而且性能也很高。但是**它的镜面反射会在一些情况下出现问题，特别是物体反光度很低时，会导致大片（粗糙的）高光区域。下面这张图展示了当反光度为1.0时地板会出现的效果：

![[f294152517e752643473d5f097afe910_MD5 1.png]]

可以看到，**在镜面高光区域的边缘出现了一道很明显的断层。出现这个问题的原因是观察向量和反射向量间的夹角不能大于90度**。如果点积的结果为负数，镜面光分量会变为0.0。你可能会觉得，当光线与视线夹角大于90度时你应该不会接收到任何光才对，所以这不是什么问题。

然而，这种想法仅仅只适用于漫反射分量。当考虑漫反射光的时候，如果法线和光源夹角大于90度，光源会处于被照表面的下方，这个时候光照的漫反射分量的确是为0.0。但是，在考虑镜面高光时，我们测量的角度并不是光源与法线的夹角，而是**视线与反射光线向量的夹角**。看一下下面这两张图：

![[697bcb39e986f85172d42963b5c913ca_MD5 1.png]]

现在问题就应该很明显了。左图中是我们熟悉的冯氏光照中的反射向量，其中$\theta$角小于90度。而右图中，视线与反射方向之间的夹角明显大于90度，这种情况下镜面光分量会变为0.0。这在大多数情况下都不是什么问题，因为观察方向离反射方向都非常远。然而，当物体的反光度非常小时，它产生的镜面高光半径足以让这些相反方向的光线对亮度产生足够大的影响。在这种情况下就不能忽略它们对镜面光分量的贡献了。

1977年，James F. Blinn在冯氏着色模型上加以拓展，引入了Blinn-Phong着色模型。**Blinn-Phong模型与冯氏模型非常相似，但是它对镜面光模型的处理上有一些不同，让我们能够解决之前提到的问题。Blinn-Phong模型不再依赖于反射向量，而是采用了所谓的<font color="#ff0000">半程向量(Halfway Vector)</font>，即光线与视线夹角一半方向上的一个单位向量。当半程向量与法线向量越接近时，镜面光分量就越大。**

![[9d7bdd8db737d6e1a46b888efcfe70d5_MD5 1.png]]

**当视线正好与（现在不需要的）反射向量对齐时，半程向量就会与法线完美契合。所以当观察者视线越接近于原本反射光线的方向时，镜面高光就会越强。**

现在，不论观察者向哪个方向看，半程向量与表面法线之间的夹角都不会超过90度（除非光源在表面以下）。它产生的效果会与冯氏光照有些许不同，但是大部分情况下看起来会更自然一点，特别是低高光的区域。Blinn-Phong着色模型正是早期固定渲染管线时代时OpenGL所采用的光照模型。

**获取半程向量**的方法很简单，**只需要将光线的方向向量和观察向量加到一起，并将结果正规化(Normalize)就可以了**：
![[Pasted image 20220929171158.png]]
翻译成GLSL代码如下：

```less
vec3 lightDir   = normalize(lightPos - FragPos);
vec3 viewDir    = normalize(viewPos - FragPos);
vec3 halfwayDir = normalize(lightDir + viewDir);
```

接下来，**镜面光分量的实际计算只不过是对表面法线和半程向量进行一次约束点乘(Clamped Dot Product)，让点乘结果不为负，从而获取它们之间夹角的余弦值，之后我们对这个值取反光度次方：**

```less
float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess); 
vec3 specular = lightColor * spec;
```

除此之外Blinn-Phong模型就没什么好说的了，Blinn-Phong与冯氏模型唯一的区别就是，Blinn-Phong测量的是法线与半程向量之间的夹角，而冯氏模型测量的是观察方向与反射向量间的夹角。

在引入半程向量之后，我们现在应该就不会再看到冯氏光照中高光断层的情况了。下面两个图片展示的是两种方法在镜面光分量为0.5时的对比：

![[Pasted image 20220929173004.png]]

**除此之外，冯氏模型与Blinn-Phong模型也有一些细微的差别：半程向量与表面法线的夹角通常会小于观察与反射向量的夹角**。所以，**如果你想获得和冯氏着色类似的效果，就必须在使用Blinn-Phong模型时将镜面反光度设置更高一点。通常我们会选择冯氏着色时反光度分量的2到4倍。**

下面是冯氏着色反光度为8.0，Blinn-Phong着色反光度为32.0时的一个对比：

![[c1628de0a3b4cdf3a24aa2c4bd8bfd47_MD5 1.png]]

你可以看到，Blinn-Phong的镜面光分量会比冯氏模型更锐利一些。为了得到与冯氏模型类似的结果，你可能会需要不断进行一些微调，但Blinn-Phong模型通常会产出更真实的结果。

这里，我们使用了一个简单的片元着色器，让我们能够在冯氏反射与Blinn-Phong反射间进行切换：
```c++ nums++
void main()
{
    [...]
    float spec = 0.0;
    if(blinn)
    {
	    vec3 halfwayDir = normalize(lightDir + viewDir);  
        spec = pow(max(dot(normal, halfwayDir), 0.0), 16.0);
    }
    else
    {
        vec3 reflectDir = reflect(-lightDir, normal);
        spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);
    }
```
你可以在这里找到这个Demo的源代码。你可以按下B键来切换冯氏光照与Blinn-Phong光照。

### Gamma校正

> [!bug] 
> 本节暂未进行完全的重写，错误可能会很多。如果可能的话，请对照原文进行阅读。如果有报告本节的错误，将会延迟至重写之后进行处理。

当我们计算出场景中所有像素的最终颜色以后，我们就必须把它们显示在监视器上。过去，大多数监视器是阴极射线管显示器（CRT）。这些监视器有一个物理特性就是两倍的输入电压产生的不是两倍的亮度。输入电压产生约为输入电压的2.2次幂的亮度，这叫做监视器Gamma。

> [!NOTE] 
> Gamma也叫灰度系数，每种显示设备都有自己的Gamma值，都不相同，有一个公式：设备输出亮度 = 电压的Gamma次幂，任何设备Gamma基本上都不会等于1，等于1是一种理想的线性状态，这种理想状态是：如果电压和亮度都是在0到1的区间，那么多少电压就等于多少亮度。对于CRT，Gamma通常为2.2，因而，输出亮度 = 输入电压的2.2次幂，你可以从本节第二张图中看到Gamma2.2实际显示出来的总会比预期暗，相反Gamma0.45就会比理想预期亮，如果你讲Gamma0.45叠加到Gamma2.2的显示设备上，便会对偏暗的显示效果做到校正，这个简单的思路就是本节的核心

人类所感知的亮度恰好和CRT所显示出来相似的指数关系非常匹配。为了更好的理解所有含义，请看下面的图片：

![[af249af1a534d05690c444692a515b52_MD5 1.png]]

第一行是人眼所感知到的正常的灰阶，亮度要增加一倍（比如从0.1到0.2）你才会感觉比原来变亮了一倍（译注：我们在看颜色值从0到1（从黑到白）的过程中，亮度要增加一倍，我们才会感受到明显的颜色变化（变亮一倍）。打个比方：颜色值从0.1到0.2，我们会感受到一倍的颜色变化，而从0.4到0.8我们才能感受到相同程度（变亮一倍）的颜色变化。如果还是不理解，可以参考知乎的[答案](https://www.zhihu.com/question/27467127/answer/37602200)）。然而，当我们谈论光的物理亮度，比如光源发射光子的数量的时候，底部（第二行）的灰阶显示出的才是物理世界真实的亮度。如底部的灰阶显示，亮度加倍时返回的也是真实的物理亮度（译注：这里亮度是指光子数量和正相关的亮度，即物理亮度，前面讨论的是人的感知亮度；物理亮度和感知亮度的区别在于，物理亮度基于光子数量，感知亮度基于人的感觉，比如第二个灰阶里亮度0.1的光子数量是0.2的二分之一），但是由于这与我们的眼睛感知亮度不完全一致（对比较暗的颜色变化更敏感），所以它看起来有差异。

因为人眼看到颜色的亮度更倾向于顶部的灰阶，监视器使用的也是一种指数关系（电压的2.2次幂），所以物理亮度通过监视器能够被映射到顶部的非线性亮度；因此看起来效果不错（译注：CRT亮度是是电压的2.2次幂而人眼相当于2次幂，因此CRT这个缺陷正好能满足人的需要）。

监视器的这个非线性映射的确可以让亮度在我们眼中看起来更好，但**当渲染图像时，会产生一个问题：我们在应用中配置的亮度和颜色是基于监视器所看到的，这样所有的配置实际上是非线性的亮度/颜色配置。** 请看下图：
![[Pasted image 20220929213849.png]]
点线代表线性颜色/亮度值（译注：这表示的是理想状态，Gamma为1），实线代表监视器显示的颜色。如果我们把一个点线线性的颜色翻一倍，结果就是这个值的两倍。比如，光的颜色向量L=(0.5,0.0,0.0)代表的是暗红色。如果我们在线性空间中把它翻倍，就会变成(1.0,0.0,0.0)，就像你在图中看到的那样。然而，由于我们定义的颜色仍然需要输出的监视器上，监视器上显示的实际颜色就会是(0.218,0.0,0.0)。在这儿问题就出现了：当我们将理想中直线上的那个暗红色翻一倍时，在监视器上实际上亮度翻了4.5倍以上！

直到现在，我们还一直假设我们所有的工作都是在线性空间中进行的（译注：Gamma为1），但最终还是要把所有的颜色输出到监视器上，所以我们配置的所有颜色和光照变量从物理角度来看都是不正确的，在我们的监视器上很少能够正确地显示。出于这个原因，我们（以及艺术家）通常将光照值设置得比本来更亮一些（由于监视器会将其亮度显示的更暗一些），如果不是这样，在线性空间里计算出来的光照就会不正确。同时，还要记住，监视器所显示出来的图像和线性图像的最小亮度是相同的，它们最大的亮度也是相同的；只是中间亮度部分会被压暗。

因为所有中间亮度都是线性空间计算出来的（译注：计算的时候假设Gamma为1）监视器显以后，实际上都会不正确。当使用更高级的光照算法时，这个问题会变得越来越明显，你可以看看下图：![[Pasted image 20220929213951.png]]
**Gamma校正(Gamma Correction)的思路是在最终的颜色输出上应用监视器Gamma的倒数。** 回头看前面的Gamma曲线图，你会有一个短划线，它是监视器Gamma曲线的翻转曲线。我们在颜色显示到监视器的时候把每个颜色输出都加上这个翻转的Gamma曲线，这样应用了监视器Gamma以后最终的颜色将会变为线性的。我们所得到的中间色调就会更亮，所以虽然监视器使它们变暗，但是我们又将其平衡回来了。

我们来看另一个例子。还是那个暗红色(0.5,0.0,0.0)(0.5,0.0,0.0)。在将颜色显示到监视器之前，我们先对颜色应用Gamma校正曲线。线性的颜色显示在监视器上相当于降低了2.22.2次幂的亮度，所以倒数就是1/2.21/2.2次幂。Gamma校正后的暗红色就会成为(0.5,0.0,0.0)1/2.2=(0.5,0.0,0.0)0.45=(0.73,0.0,0.0)(0.5,0.0,0.0)1/2.2=(0.5,0.0,0.0)0.45=(0.73,0.0,0.0)。校正后的颜色接着被发送给监视器，最终显示出来的颜色是(0.73,0.0,0.0)2.2=(0.5,0.0,0.0)(0.73,0.0,0.0)2.2=(0.5,0.0,0.0)。你会发现使用了Gamma校正，监视器最终会显示出我们在应用中设置的那种线性的颜色。

> [!NOTE] 
> 2.2通常是是大多数显示设备的大概平均gamma值。基于gamma2.2的颜色空间叫做sRGB颜色空间。每个监视器的gamma曲线都有所不同，但是gamma2.2在大多数监视器上表现都不错。出于这个原因，游戏经常都会为玩家提供改变游戏gamma设置的选项，以适应每个监视器（译注：现在Gamma2.2相当于一个标准，后文中你会看到。但现在你可能会问，前面不是说Gamma2.2看起来不是正好适合人眼么，为何还需要校正。这是因为你在程序中设置的颜色，比如光照都是基于线性Gamma，即Gamma1，所以你理想中的亮度和实际表达出的不一样，如果要表达出你理想中的亮度就要对这个光照进行校正）。

**有两种在你的场景中应用gamma校正的方式：**

使用OpenGL内建的sRGB帧缓冲。 自己在片元着色器中进行gamma校正。 第一个选项也许是最简单的方式，但是我们也会丧失一些控制权。开启`GL_FRAMEBUFFER_SRGB`，可以告诉OpenGL每个后续的绘制命令里，在颜色储存到颜色缓冲之前先校正sRGB颜色。sRGB这个颜色空间大致对应于gamma2.2，它也是家用设备的一个标准。开启GL_FRAMEBUFFER_SRGB以后，每次片元着色器运行后续帧缓冲，OpenGL将自动执行gamma校正，包括默认帧缓冲。

开启`GL_FRAMEBUFFER_SRGB`简单的调用glEnable就行：
```
glEnable(GL_FRAMEBUFFER_SRGB);
```
自此，你渲染的图像就被进行gamma校正处理，你不需要做任何事情硬件就帮你处理了。有时候，你应该记得这个建议：**gamma校正将把线性颜色空间转变为非线性空间，所以在最后一步进行gamma校正是极其重要的。** 如果你在最后输出之前就进行gamma校正，所有的后续操作都是在操作不正确的颜色值。例如，如果你使用多个帧缓冲，你可能打算让两个帧缓冲之间传递的中间结果仍然保持线性空间颜色，只是给发送给监视器的最后的那个帧缓冲应用gamma校正。

第二个方法稍微复杂点，但同时也是我们对gamma操作有完全的控制权。**我们在每个相关片元着色器运行的最后应用gamma校正，所以在发送到帧缓冲前，颜色就被校正了。**
```c++ nums++
void main()
{
    // do super fancy lighting 
    [...]
    // apply gamma correction
    float gamma = 2.2;
    fragColor.rgb = pow(fragColor.rgb, 
    vec3(1.0/gamma));
}
```
最后一行代码，将fragColor的每个颜色元素应用有一个1.0/gamma的幂运算，校正片元着色器的颜色输出。

这个方法有个问题就是为了保持一致，你必须在片元着色器里加上这个gamma校正，所以如果你有很多片元着色器，它们可能分别用于不同物体，那么你就必须在每个着色器里都加上gamma校正了。一个更简单的方案是在你的渲染循环中引入后处理阶段，在后处理四边形上应用gamma校正，这样你只要做一次就好了。

这些单行代码代表了gamma校正的实现。不太令人印象深刻，但当你进行gamma校正的时候有一些额外的事情别忘了考虑。
#### sRGB纹理
因为监视器总是在sRGB空间中显示应用了gamma的颜色，无论什么时候当你在计算机上绘制、编辑或者画出一个图片的时候，你所选的颜色都是根据你在监视器上看到的那种。这实际意味着所有你创建或编辑的图片并不是在线性空间，而是在sRGB空间中（译注：**sRGB空间定义的gamma接近于2.2**），假如在你的屏幕上对暗红色翻一倍，便是根据你所感知到的亮度进行的，并不等于将红色元素加倍。

结果就是纹理编辑者，所创建的所有纹理都是在sRGB空间中的纹理，所以如果我们在渲染应用中使用这些纹理，我们必须考虑到这点。在我们应用gamma校正之前，这不是个问题，因为纹理在sRGB空间创建和展示，同样我们还是在sRGB空间中使用，从而不必gamma校正纹理显示也没问题。然而，现在我们是把所有东西都放在线性空间中展示的，纹理颜色就会变坏，如下图展示的那样：![[Pasted image 20220929215105.png]]
纹理图像实在太亮了，发生这种情况是因为，它们实际上进行了两次gamma校正！想一想，当我们基于监视器上看到的情况创建一个图像，我们就已经对颜色值进行了gamma校正，所以再次显示在监视器上就没错。由于我们在渲染中又进行了一次gamma校正，图片就实在太亮了。

为了修复这个问题，我们得确保纹理制作者是在线性空间中进行创作的。但是，由于大多数纹理制作者并不知道什么是gamma校正，并且在sRGB空间中进行创作更简单，这也许不是一个好办法。

另一个解决方案是**重校**，**或把这些sRGB纹理在进行任何颜色值的计算前变回线性空间。** 我们可以这样做：
```c++ nums++
float gamma = 2.2;
vec3 diffuseColor = pow(texture(diffuse, 
texCoords).rgb, vec3(gamma));
```
为每个sRGB空间的纹理做这件事非常烦人。幸好，**OpenGL给我们提供了另一个方案来解决我们的麻烦，这就是GL_SRGB和GL_SRGB_ALPHA内部纹理格式。**

如果我们在OpenGL中创建了一个纹理，把它指定为以上两种sRGB纹理格式其中之一，OpenGL将自动把颜色校正到线性空间中，这样我们所使用的所有颜色值都是在线性空间中的了。我们可以这样把一个纹理指定为一个sRGB纹理：

```
glTexImage2D(GL_TEXTURE_2D, 0, GL_SRGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, image);
```

如果你还打算在你的纹理中引入alpha元素，必究必须将纹理的内部格式指定为GL_SRGB_ALPHA。

因为不是所有纹理都是在sRGB空间中的所以当你把纹理指定为sRGB纹理时要格外小心。比如diffuse纹理，这种为物体上色的纹理几乎都是在sRGB空间中的。而为了获取光照参数的纹理，像specular贴图和法线贴图几乎都在线性空间中，所以如果你把它们也配置为sRGB纹理的话，光照就坏掉了。指定sRGB纹理时要当心。

**将diffuse纹理定义为sRGB纹理之后，你将获得你所期望的视觉输出，但这次每个物体都会只进行一次gamma校正。**
#### 衰减
在使用了gamma校正之后，另一个不同之处是光照衰减(Attenuation)。真实的物理世界中，光照的衰减和光源的距离的平方成反比。
```c++ nums++
float attenuation = 1.0 / (distance * distance);
```
然而，当我们使用这个衰减公式的时候，衰减效果总是过于强烈，光只能照亮一小圈，看起来并不真实。出于这个原因，我们使用在基本光照教程中所讨论的那种衰减方程，它给了我们更大的控制权，此外我们还可以使用**双曲线函数**：

```c++ nums++
float attenuation = 1.0 / distance;
```

双曲线比使用二次函数变体在不用gamma校正的时候看起来更真实，不过但我们开启gamma校正以后线性衰减看起来太弱了，符合物理的二次函数突然出现了更好的效果。下图显示了其中的不同：![[Pasted image 20220929215608.png]]
这种差异产生的原因是，光的衰减方程改变了亮度值，而且屏幕上显示出来的也不是线性空间，在监视器上效果最好的衰减方程，并不是符合物理的。想想平方衰减方程，如果我们使用这个方程，而且不进行gamma校正，显示在监视器上的衰减方程实际上将变成(1.0/distance2)<sup>2.2</sup>。若不进行gamma校正，将产生更强烈的衰减。这也解释了为什么双曲线不用gamma校正时看起来更真实，因为它实际变成了(1.0/distance)<sup>2.2</sup>=1.0/distance<sup>2.2</sup>。这和物理公式是很相似的。
>我们在基础光照教程中讨论的更高级的那个衰减方程在有gamma校正的场景中也仍然有用，因为它可以让我们对衰减拥有更多准确的控制权（不过，在进行gamma校正的场景中当然需要不同的参数）。

我创建的这个简单的demo场景，你可以在这里找到源码以及顶点和片元着色器。按下空格就能在有gamma校正和无gamma校正的场景进行切换，两个场景使用的是相同的纹理和衰减。这不是效果最好的demo，不过它能展示出如何应用所有这些技术。

**总而言之，gamma校正使你可以在线性空间中进行操作。因为线性空间更符合物理世界，大多数物理公式现在都可以获得较好效果，比如真实的光的衰减。你的光照越真实，使用gamma校正获得漂亮的效果就越容易。这也正是为什么当引进gamma校正时，建议只去调整光照参数的原因。**
### 阴影（未学习）
#### 阴影映射
> [!bug] 
> 本节暂未进行完全的重写，错误可能会很多。如果可能的话，请对照原文进行阅读。如果有报告本节的错误，将会延迟至重写之后进行处理。


![[Pasted image 20220929220011.png]]
阴影还是比较不好实现的，因为当前实时渲染领域还没找到一种完美的阴影算法。目前有几种近似阴影技术，但它们都有自己的弱点和不足，这点我们必须要考虑到。

视频游戏中较多使用的一种技术是阴影贴图（shadow mapping），效果不错，而且相对容易实现。阴影贴图并不难以理解，性能也不会太低，而且非常容易扩展成更高级的算法（比如 [[http://learnopengl.com/#!Advanced-Lighting/Shadows/Point-Shadows]]和 [[http://learnopengl.com/#!Advanced-Lighting/Shadows/CSM]]）。
**阴影映射(Shadow Mapping)** 背后的思路非常简单：我们以光的位置为视角进行渲染，我们能看到的东西都将被点亮，看不见的一定是在阴影之中了。假设有一个地板，在光源和它之间有一个大盒子。由于光源处向光线方向看去，可以看到这个盒子，但看不到地板的一部分，这部分就应该在阴影中了。![[Pasted image 20220929220233.png]]
这里的所有蓝线代表光源可以看到的fragment。黑线代表被遮挡的fragment：它们应该渲染为带阴影的。如果我们绘制一条从光源出发，到达最右边盒子上的一个片段上的线段或射线，那么射线将先击中悬浮的盒子，随后才会到达最右侧的盒子。结果就是悬浮的盒子被照亮，而最右侧的盒子将处于阴影之中。

我们希望得到射线第一次击中的那个物体，然后用这个最近点和射线上其他点进行对比。然后我们将测试一下看看射线上的其他点是否比最近点更远，如果是的话，这个点就在阴影中。对从光源发出的射线上的成千上万个点进行遍历是个极端消耗性能的举措，实时渲染上基本不可取。我们可以采取相似举措，不用投射出光的射线。我们所使用的是非常熟悉的东西：**深度缓冲**。

你可能记得在[[http://learnopengl.com/#!Advanced-OpenGL/Depth-testing]]教程中，在深度缓冲里的一个值是摄像机视角下，对应于一个片段的一个0到1之间的深度值。**如果我们从光源的透视图来渲染场景，并把深度值的结果储存到纹理中会怎样？通过这种方式，我们就能对光源的透视图所见的最近的深度值进行采样。** 最终，深度值就会显示从光源的透视图下见到的第一个片段了。**我们管储存在纹理中的所有这些深度值，叫做深度贴图（depth map）或阴影贴图。** ![[Pasted image 20220929220626.png]]
左侧的图片展示了一个定向光源（所有光线都是平行的）在立方体下的表面投射的阴影。通过储存到深度贴图中的深度值，我们就能找到最近点，用以决定片段是否在阴影中。我们使用一个来自光源的视图和投影矩阵来渲染场景就能创建一个深度贴图。这个投影和视图矩阵结合在一起成为一个T变换，它可以将任何三维位置转变到光源的可见坐标空间。

>定向光并没有位置，因为它被规定为无穷远。然而，为了实现阴影贴图，我们得从一个光的透视图渲染场景，这样就得在光的方向的某一点上渲染场景。

在右边的图中我们显示出同样的平行光和观察者。我们渲染一个点P处的片段，需要决定它是否在阴影中。我们先得使用T把P变换到光源的坐标空间里。既然点P是从光的透视图中看到的，它的z坐标就对应于它的深度，例子中这个值是0.9。使用点P在光源的坐标空间的坐标，我们可以索引深度贴图，来获得从光的视角中最近的可见深度，结果是点C，最近的深度是0.4。因为索引深度贴图的结果是一个小于点P的深度，我们可以断定P被挡住了，它在阴影中了。

**阴影映射由两个步骤组成：首先，我们渲染深度贴图，然后我们像往常一样渲染场景，使用生成的深度贴图来计算片段是否在阴影之中。** 听起来有点复杂，但随着我们一步一步地讲解这个技术，就能理解了。
#### 深度贴图
第一步我们需要生成一张深度贴图(Depth Map)。深度贴图是从光的透视图里渲染的深度纹理，用它计算阴影。因为我们需要将场景的渲染结果储存到一个纹理中，我们将再次需要帧缓冲。

首先，我们要为渲染的深度贴图创建一个帧缓冲对象：
```c++ nums++
GLuint depthMapFBO;
glGenFramebuffers(1, &depthMapFBO);
```
然后，创建一个2D纹理，提供给帧缓冲的深度缓冲使用：
```c++ nums++
const GLuint SHADOW_WIDTH = 1024, SHADOW_HEIGHT = 1024;

GLuint depthMap;
glGenTextures(1, &depthMap);
glBindTexture(GL_TEXTURE_2D, depthMap);
glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT, 
SHADOW_WIDTH, SHADOW_HEIGHT, 0, GL_DEPTH_COMPONENT, 
GL_FLOAT, NULL);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT); 
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
```

生成深度贴图不太复杂。因为我们只关心深度值，我们要把纹理格式指定为GL_DEPTH_COMPONENT。我们还要把纹理的高宽设置为1024：这是深度贴图的分辨率。

把我们把生成的深度纹理作为帧缓冲的深度缓冲：

```
glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthMap, 0);
glDrawBuffer(GL_NONE);
glReadBuffer(GL_NONE);
glBindFramebuffer(GL_FRAMEBUFFER, 0);
```

我们需要的只是在从光的透视图下渲染场景的时候深度信息，所以颜色缓冲没有用。然而，不包含颜色缓冲的帧缓冲对象是不完整的，所以我们需要显式告诉OpenGL我们不适用任何颜色数据进行渲染。我们通过将调用glDrawBuffer和glReadBuffer把读和绘制缓冲设置为GL_NONE来做这件事。

合理配置将深度值渲染到纹理的帧缓冲后，我们就可以开始第一步了：生成深度贴图。两个步骤的完整的渲染阶段，看起来有点像这样：

```
// 1. 首选渲染深度贴图
glViewport(0, 0, SHADOW_WIDTH, SHADOW_HEIGHT);
glBindFramebuffer(GL_FRAMEBUFFER, depthMapFBO);
glClear(GL_DEPTH_BUFFER_BIT);
ConfigureShaderAndMatrices();
RenderScene();
glBindFramebuffer(GL_FRAMEBUFFER, 0);

// 2. 像往常一样渲染场景，但这次使用深度贴图
glViewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
ConfigureShaderAndMatrices();
glBindTexture(GL_TEXTURE_2D, depthMap);
RenderScene();
```

这段代码隐去了一些细节，但它表达了阴影映射的基本思路。这里一定要记得调用glViewport。因为阴影贴图经常和我们原来渲染的场景（通常是窗口分辨率）有着不同的分辨率，我们需要改变视口（viewport）的参数以适应阴影贴图的尺寸。如果我们忘了更新视口参数，最后的深度贴图要么太小要么就不完整。
### 法线贴图
> [!bug] 
> 本节暂未进行完全的重写，错误可能会很多。如果可能的话，请对照原文进行阅读。如果有报告本节的错误，将会延迟至重写之后进行处理。

我们的场景中已经充满了多边形物体，其中每个都可能由成百上千平坦的三角形组成。我们以向三角形上附加纹理的方式来增加额外细节，提升真实感，隐藏多边形几何体是由无数三角形组成的事实。纹理确有助益，然而当你近看它们时，这个事实便隐藏不住了。现实中的物体表面并非是平坦的，而是表现出无数（凹凸不平的）细节。

例如，砖块的表面。砖块的表面非常粗糙，显然不是完全平坦的：它包含着接缝处水泥凹痕，以及非常多的细小的空洞。如果我们在一个有光的场景中看这样一个砖块的表面，问题就出来了。下图中我们可以看到砖块纹理应用到了平坦的表面，并被一个点光源照亮。
![[Pasted image 20220930193834.png]]
光照并没有呈现出任何裂痕和孔洞，完全忽略了砖块之间凹进去的线条；表面看起来完全就是平的。我们可以使用specular贴图根据深度或其他细节阻止部分表面被照的更亮，以此部分地解决问题，但这并不是一个好方案。我们需要的是某种可以告知光照系统给所有有关物体表面类似深度这样的细节的方式。

**如果我们以光的视角来看这个问题：是什么使表面被视为完全平坦的表面来照亮？答案会是表面的法线向量。** 以光照算法的视角考虑的话，只有一件事决定物体的形状，这就是垂直于它的法线向量。砖块表面只有一个法线向量，表面完全根据这个法线向量被以一致的方式照亮。如果每个fragment都是用自己的不同的法线会怎样？这样我们就可以根据表面细微的细节对法线向量进行改变；这样就会获得一种表面看起来要复杂得多的幻觉：

![[39696458dea52aeef68b6c6e27851c47_MD5 1.png]]

每个fragment使用了自己的法线，我们就可以让光照相信一个表面由很多微小的（垂直于法线向量的）平面所组成，物体表面的细节将会得到极大提升。这种**每个fragment使用各自的法线**，替代一个面上所有fragment使用同一个法线的技术叫做**法线贴图（normal mapping）或凹凸贴图（bump mapping）** 。应用到砖墙上，效果像这样：

![[8afdf78a701ddad81a76a709003fcf34_MD5 1.png]]

你可以看到细节获得了极大提升，开销却不大。因为我们只需要改变每个fragment的法线向量，并不需要改变所有光照公式。现在我们是**为每个fragment传递一个法线，不再使用插值表面法线**。这样光照使表面拥有了自己的细节。

为使法线贴图工作，我们需要**为每个fragment提供一个法线**。像diffuse贴图和specular贴图一样，**我们可以使用一个2D纹理来储存法线数据。2D纹理不仅可以储存颜色和光照数据，还可以储存法线向量。这样我们可以从2D纹理中采样得到特定纹理的法线向量。**

由于法线向量是个几何工具，而纹理通常只用于储存颜色信息，用纹理储存法线向量不是非常直接。如果你想一想，就会知道纹理中的颜色向量用r、g、b元素代表一个3D向量。类似的我们也可以将法线向量的x、y、z元素储存到纹理中，代替颜色的r、g、b元素。**法线向量的范围在-1到1之间，所以我们先要将其映射到0到1的范围：**

```c++ nums
vec3 rgb_normal = normal * 0.5 + 0.5; // 从 [-1,1] 转换至 [0,1]
```

将法线向量变换为像这样的RGB颜色元素，我们就能把根据表面的形状的fragment的法线保存在2D纹理中。教程开头展示的那个砖块的例子的法线贴图如下所示：

![[6285dbbb075d0c525e84b74771683ea9_MD5 1.png]]

这会是一种偏蓝色调的纹理（你在网上找到的几乎所有法线贴图都是这样的）。这是**因为所有法线的指向都偏向z轴（0, 0, 1）这是一种偏蓝的颜色**。法线向量从z轴方向也向其他方向轻微偏移，颜色也就发生了轻微变化，这样看起来便有了一种深度。例如，你可以看到在每个砖块的顶部，颜色倾向于偏绿，这是因为砖块的顶部的法线偏向于指向正y轴方向（0, 1, 0），这样它就是绿色的了。

在一个简单的朝向正z轴的平面上，我们可以用[这个diffuse纹理](https://learnopengl.com/img/textures/brickwall.jpg)和[这个法线贴图](https://learnopengl.com/img/textures/brickwall_normal.jpg)来渲染前面部分的图片。要注意的是这个链接里的法线贴图和上面展示的那个不一样。原因是**OpenGL读取的纹理的y（或V）坐标和纹理通常被创建的方式相反**。链接里的法线贴图的y（或绿色）元素是相反的（你可以看到绿色现在在下边）；如果你没考虑这个，光照就不正确了（译注：如果你现在不再使用SOIL了，那就不要用链接里的那个法线贴图，这个问题是SOIL载入纹理上下颠倒所致，它也会把法线在y方向上颠倒）。**加载纹理，把它们绑定到合适的纹理单元，然后使用下面的改变了的片元着色器来渲染一个平面：**

```c++ nums
uniform sampler2D normalMap;  

void main()
{           
    // 从法线贴图范围[0,1]获取法线
    normal = texture(normalMap, fs_in.TexCoords).rgb;
    // 将法线向量转换为范围[-1,1]
    normal = normalize(normal * 2.0 - 1.0);   

    [...]
    // 像往常那样处理光照
}
```

**这里我们将被采样的法线颜色从0到1重新映射回-1到1，便能将RGB颜色重新处理成法线，然后使用采样出的法线向量应用于光照的计算**。在例子中我们使用的是Blinn-Phong着色器。

通过慢慢随着时间慢慢移动光源，你就能明白法线贴图是什么意思了。运行这个例子你就能得到本教程开始的那个效果：

![[4d00f5adcc0e8c1e5cfb2ac08cc38fcc_MD5 1.png]]

你可以在这里找到这个简单demo的源代码及其顶点和片元着色器。

然而有个问题限制了刚才讲的那种法线贴图的使用。我们使用的那个法线贴图里面的所有法线向量都是指向正z方向的。上面的例子能用，是因为那个平面的表面法线也是指向正z方向的。可是，如果我们在表面法线指向正y方向的平面上使用同一个法线贴图会发生什么？


![[0240fe0e8da9729cff60ffd8903fd98c_MD5 1.png]]

光照看起来完全不对！发生这种情况是平面的表面法线现在指向了y，而采样得到的法线仍然指向的是z。结果就是光照仍然认为表面法线和之前朝向正z方向时一样；这样光照就不对了。下面的图片展示了这个表面上采样的法线的近似情况：

![[45f492df200e1f991f14c19d1510ad9b_MD5 1.png]]

你可以看到所有法线都指向z方向，它们本该朝着表面法线指向y方向的。一个可行方案是为每个表面制作一个单独的法线贴图。如果是一个立方体的话我们就需要6个法线贴图，但是如果模型上有无数的朝向不同方向的表面，这就不可行了（译注：实际上对于复杂模型可以把朝向各个方向的法线储存在同一张贴图上，你可能看到过不只是蓝色的法线贴图，不过用那样的法线贴图有个问题是你必须记住模型的起始朝向，如果模型运动了还要记录模型的变换，这是非常不方便的；此外就像作者所说的，如果把一个diffuse纹理应用在同一个物体的不同表面上，就像立方体那样的，就需要做6个法线贴图，这也不可取）。

另一个稍微有点难的解决方案是，**在一个不同的坐标空间中进行光照，这个坐标空间里，法线贴图向量总是指向这个坐标空间的正z方向；所有的光照向量都相对与这个正z方向进行变换。这样我们就能始终使用同样的法线贴图，不管朝向问题。这个坐标空间叫做切线空间（tangent space）。**
### 切线空间
**法线贴图中的法线向量定义在切线空间中，在切线空间中，法线永远指着正z方向。** 切线空间是位于三角形表面之上的空间：法线相对于单个三角形的本地参考框架。它就像法线贴图向量的本地空间；它们都被定义为指向正z方向，无论最终变换到什么方向。使用一个特定的矩阵我们就能将本地/切线空间中的法线向量转成世界或视图空 间下，使它们转向到最终的贴图表面的方向。

我们可以说，上个部分那个朝向正y的法线贴图错误的贴到了表面上。法线贴图被定义在切线空间中，所以一种解决问题的方式是计算出一种矩阵，把法线从切线空间变换到一个不同的空间，这样它们就能和表面法线方向对齐了：法线向量都会指向正y方向。**切线空间的一大好处是我们可以为任何类型的表面计算出一个这样的矩阵，由此我们可以把切线空间的z方向和表面的法线方向对齐。**

这种矩阵叫做**TBN矩阵**这三个字母分别代表**tangent、bitangent和normal向量**。这是建构这个矩阵所需的向量。要建构这样一个把切线空间转变为不同空间的变异矩阵，我们需要三个相互垂直的向量，它们沿一个表面的法线贴图对齐于：上、右、前；这和我们在[摄像机教程](https://learnopengl-cn.github.io/01%20Getting%20started/09%20Camera/)中做的类似。

已知**上向量是表面的法线向量。右和前向量是切线(Tagent)和副切线(Bitangent)向量**。下面的图片展示了一个表面的三个向量：

![[b6009cee5e0d1daa0be953697f9b6849_MD5 1.png]]

计算出切线和副切线并不像法线向量那么容易。从图中可以看到法线贴图的切线和副切线与纹理坐标的两个方向对齐。我们就是用到这个特性计算每个表面的切线和副切线的。需要用到一些数学才能得到它们；请看下图：![[312172ee4e46117ba51855417d1557be_MD5 1.png]]![[Pasted image 20220930202629.png]]
如果你对这些数学内容不理解也不用担心。当你知道我们可以用一个三角形的顶点和纹理坐标（因为纹理坐标和切线向量在同一空间中）计算出切线和副切线你就已经部分地达到目的了（译注：上面的推导已经很清楚了，如果你不明白可以参考任意线性代数教材，就像作者所说的记住求得切线空间的公式也行，不过不管怎样都得理解切线空间的含义）。
#### 手工计算切线和副切线

这个教程的demo场景中有一个简单的2D平面，它朝向正z方向。这次我们会**使用切线空间来实现法线贴图，所以我们可以使平面朝向任意方向，法线贴图仍然能够工作**。使用前面讨论的数学方法，我们来手工计算出表面的切线和副切线向量。

假设平面使用下面的向量建立起来（1、2、3和1、3、4，它们是两个三角形）：

```c++ nums
// positions
glm::vec3 pos1(-1.0,  1.0, 0.0);
glm::vec3 pos2(-1.0, -1.0, 0.0);
glm::vec3 pos3(1.0, -1.0, 0.0);
glm::vec3 pos4(1.0, 1.0, 0.0);
// texture coordinates
glm::vec2 uv1(0.0, 1.0);
glm::vec2 uv2(0.0, 0.0);
glm::vec2 uv3(1.0, 0.0);
glm::vec2 uv4(1.0, 1.0);
// normal vector
glm::vec3 nm(0.0, 0.0, 1.0);
```

我们先计算第一个三角形的边和deltaUV坐标：

```c++ nums
glm::vec3 edge1 = pos2 - pos1;
glm::vec3 edge2 = pos3 - pos1;
glm::vec2 deltaUV1 = uv2 - uv1;
glm::vec2 deltaUV2 = uv3 - uv1;
```

有了计算切线和副切线的必备数据，我们就可以开始写出来自于前面部分中的下列等式：

```c++ nums
GLfloat f = 1.0f / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);

tangent1.x = f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x);
tangent1.y = f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y);
tangent1.z = f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z);
tangent1 = glm::normalize(tangent1);

bitangent1.x = f * (-deltaUV2.x * edge1.x + deltaUV1.x * edge2.x);
bitangent1.y = f * (-deltaUV2.x * edge1.y + deltaUV1.x * edge2.y);
bitangent1.z = f * (-deltaUV2.x * edge1.z + deltaUV1.x * edge2.z);
bitangent1 = glm::normalize(bitangent1);  

[...] // 对平面的第二个三角形采用类似步骤计算切线和副切线
```

我们预先计算出等式的分数部分`f`，然后把它和每个向量的元素进行相应矩阵乘法。如果你把代码和最终的等式对比你会发现，这就是直接套用。最后我们还要进行标准化，来确保切线/副切线向量最后是单位向量。

因为一个三角形永远是平坦的形状，我们只需为每个三角形计算一个切线/副切线，它们对于每个三角形上的顶点都是一样的。**要注意的是大多数实现通常三角形和三角形之间都会共享顶点。这种情况下开发者通常将每个顶点的法线和切线/副切线等顶点属性平均化，以获得更加柔和的效果**。我们的平面的三角形之间分享了一些顶点，但是因为两个三角形相互并行，因此并不需要将结果平均化，但无论何时只要你遇到这种情况记住它就是件好事。

最后的切线和副切线向量的值应该是(1, 0, 0)和(0, 1, 0)，它们和法线(0, 0, 1)组成相互垂直的TBN矩阵。在平面上显示出来TBN应该是这样的：

![[50e6bf6106228ad3035b3fec454dd1d0_MD5 1.png]]

每个顶点定义了切线和副切线向量，我们就可以开始实现正确的法线贴图了。
#### 切线空间法线贴图/TBN矩阵

为让法线贴图工作，我们先得在着色器中创建一个TBN矩阵。我们先将前面计算出来的切线和副切线向量传给顶点着色器，作为它的属性：

```
#version 330 core
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 texCoords;
layout (location = 3) in vec3 tangent;
layout (location = 4) in vec3 bitangent;
```

在顶点着色器的main函数中我们**创建TBN矩阵**：TBN矩阵即将切线，副切线，法线按列排序得到的矩阵。

```
void main()
{
   [...]
   vec3 T = normalize(vec3(model * vec4(tangent,   0.0)));
   vec3 B = normalize(vec3(model * vec4(bitangent, 0.0)));
   vec3 N = normalize(vec3(model * vec4(normal,    0.0)));
   mat3 TBN = mat3(T, B, N)
}
```

我们先将所有TBN向量变换到我们所操作的坐标系中，现在是世界空间，我们可以乘以model矩阵。然后我们创建实际的TBN矩阵，直接把相应的向量应用到mat3构造器就行。注意，如果我们希望更精确的话就不要将TBN向量乘以model矩阵，而是使用法线矩阵，因为我们只关心向量的方向，不关心平移和缩放。

>从技术上讲，顶点着色器中无需副切线。所有的这三个TBN向量都是相互垂直的所以我们可以在顶点着色器中用T和N向量的叉乘，自己计算出副切线：vec3 B = cross(T, N);

现在我们有了TBN矩阵，如果来使用它呢？通常来说**⭐有两种方式使用它**，我们会把这两种方式都说明一下：

**1.  （更通用）我们直接使用TBN矩阵**，**这个矩阵可以把切线坐标空间的向量转换到世界坐标空间**。因此我们把它传给片元着色器中，把通过采样得到的法线坐标左乘上TBN矩阵，转换到世界坐标空间中，这样所有法线和其他光照变量就在同一个坐标系中了。
**2.  我们也可以使用TBN矩阵的逆矩阵(TBN矩阵的逆矩阵等于转置矩阵)**，**这个矩阵可以把世界坐标空间的向量转换到切线坐标空间**。因此我们使用这个矩阵左乘其他光照变量，把他们转换到切线空间，这样法线和其他光照变量再一次在一个坐标系中了。

**我们来看看第一种情况。** 我们从法线贴图采样得来的法线向量，是在切线空间表示的，尽管其他光照向量都是在世界空间表示的。把TBN传给片元着色器，我们就能将采样得来的切线空间的法线乘以这个TBN矩阵，将法线向量变换到和其他光照向量一样的参考空间中。这种方式随后所有光照计算都可以简单的理解。

把TBN矩阵发给片元着色器很简单：

```c++ nums
out VS_OUT {
    vec3 FragPos;
    vec2 TexCoords;
    mat3 TBN;
} vs_out;  

void main()
{
    [...]
    vs_out.TBN = mat3(T, B, N);
}
```

在片元着色器中我们用mat3作为输入变量：

```c++ nums
in VS_OUT {
    vec3 FragPos;
    vec2 TexCoords;
    mat3 TBN;
} fs_in;
```

有了TBN矩阵我们现在就可以更新法线贴图代码，引入切线到世界空间变换：

```c++ nums
normal = texture(normalMap, fs_in.TexCoords).rgb;
normal = normalize(normal * 2.0 - 1.0);   
normal = normalize(fs_in.TBN * normal);
```

因为最后的normal现在在世界空间中了，就不用改变其他片元着色器的代码了，因为光照代码就是假设法线向量在世界空间中。

**我们同样看看第二种情况。** 我们用TBN矩阵的逆矩阵将所有相关的世界空间向量转变到采样所得法线向量的空间：切线空间。TBN的建构还是一样，但我们在将其发送给片元着色器之前先要求逆矩阵：

```
vs_out.TBN = transpose(mat3(T, B, N));
```

**注意，这里我们使用transpose函数，而不是inverse函数。正交矩阵（每个轴既是单位向量同时相互垂直）的一大属性是一个正交矩阵的置换矩阵与它的逆矩阵相等。这个属性很重要因为逆矩阵的求得比求置换开销大；结果却是一样的。**

在片元着色器中我们不用对法线向量变换，但我们要把其他相关向量转换到切线空间，它们是lightDir和viewDir。这样每个向量还是在同一个空间（切线空间）中了。

```
void main()
{           
    vec3 normal = texture(normalMap, fs_in.TexCoords).rgb;
    normal = normalize(normal * 2.0 - 1.0);   

    vec3 lightDir = fs_in.TBN * normalize(lightPos - fs_in.FragPos);
    vec3 viewDir  = fs_in.TBN * normalize(viewPos - fs_in.FragPos);    
    [...]
}
```

第二种方法看似要做的更多，它还需要在片元着色器中进行更多的乘法操作，所以为何还用第二种方法呢？

**将向量从世界空间转换到切线空间有个额外好处，我们可以把所有相关向量在顶点着色器中转换到切线空间，不用在片元着色器中做这件事。** 这是可行的，因为lightPos和viewPos不是每个fragment运行都要改变，对于fs_in.FragPos，我们也可以在顶点着色器计算它的切线空间位置。**基本上，不需要把任何向量在片元着色器中进行变换，而第一种方法中就是必须的，因为采样出来的法线向量对于每个片元着色器都不一样。**

所以现在不是把TBN矩阵的逆矩阵发送给片元着色器，而是将切线空间的光源位置，观察位置以及顶点位置发送给片元着色器。这样我们就不用在片元着色器里进行矩阵乘法了。这是一个极佳的优化，因为顶点着色器通常比片元着色器运行的少。这也是为什么这种方法是一种更好的实现方式的原因。

```c++ nums
out VS_OUT {
    vec3 FragPos;
    vec2 TexCoords;
    vec3 TangentLightPos;
    vec3 TangentViewPos;
    vec3 TangentFragPos;
} vs_out;

uniform vec3 lightPos;
uniform vec3 viewPos;

[...]

void main()
{    
    [...]
    mat3 TBN = transpose(mat3(T, B, N));
    vs_out.TangentLightPos = TBN * lightPos;
    vs_out.TangentViewPos  = TBN * viewPos;
    vs_out.TangentFragPos  = TBN * vec3(model * vec4(position, 0.0));
}
```

在像素着色器中我们使用这些新的输入变量来计算切线空间的光照。因为法线向量已经在切线空间中了，光照就有意义了。

将法线贴图应用到切线空间上，我们会得到混合教程一开始那个例子相似的结果，但这次我们可以将平面朝向各个方向，光照一直都会是正确的：

```
glm::mat4 model;
model = glm::rotate(model, (GLfloat)glfwGetTime() * -10, glm::normalize(glm::vec3(1.0, 0.0, 1.0)));
glUniformMatrix4fv(modelLoc 1, GL_FALSE, glm::value_ptr(model));
RenderQuad();
```

看起来是正确的法线贴图：

![[f89a513fc10c90aa475bdc1b01c35b46_MD5 1.png]]

你可以在这里找到[源代码](http://www.learnopengl.com/code_viewer.php?code=advanced-lighting/normal_mapping)、[顶点](http://www.learnopengl.com/code_viewer.php?code=advanced-lighting/normal_mapping&type=vertex)和[像素](http://www.learnopengl.com/code_viewer.php?code=advanced-lighting/normal_mapping&type=fragment)着色器。
#### 复杂物体

我们已经说明了如何通过手工计算切线和副切线向量，来使用切线空间和法线贴图。幸运的是，计算这些切线和副切线向量对于你来说不是经常能遇到的事；大多数时候，在模型加载器中实现了一次就行了，我们是在使用了Assimp的那个加载器中实现的。

Assimp有个很有用的配置，在我们加载模型的时候调用`aiProcess_CalcTangentSpace`。当`aiProcess_CalcTangentSpace`应用到Assimp的`ReadFile`函数时，Assimp会为每个加载的顶点计算出柔和的切线和副切线向量，它所使用的方法和我们本教程使用的类似。

```
const aiScene* scene = importer.ReadFile(
    path, aiProcess_Triangulate | aiProcess_FlipUVs | aiProcess_CalcTangentSpace
);
```

我们可以通过下面的代码用Assimp获取计算出来的切线空间：

```
vector.x = mesh->mTangents[i].x;
vector.y = mesh->mTangents[i].y;
vector.z = mesh->mTangents[i].z;
vertex.Tangent = vector;
```

然后，你还必须更新模型加载器，用以从带纹理模型中加载法线贴图。wavefront的模型格式（.obj）导出的法线贴图有点不一样，Assimp的aiTextureType_NORMAL并不会加载它的法线贴图，而aiTextureType_HEIGHT却能，所以我们经常这样加载它们：

```
vector<Texture> specularMaps = this->loadMaterialTextures(
    material, aiTextureType_HEIGHT, "texture_normal"
);
```

当然，对于每个模型的类型和文件格式来说都是不同的。同样了解aiProcess_CalcTangentSpace并不能总是很好的工作也很重要。计算切线是需要根据纹理坐标的，有些模型制作者使用一些纹理小技巧比如镜像一个模型上的纹理表面时也镜像了另一半的纹理坐标；这样当不考虑这个镜像的特别操作的时候（Assimp就不考虑）结果就不对了。

运行程序，用新的模型加载器，加载一个有specular和法线贴图的模型，看起来会像这样：

![[a4e8dcc31eeae47e0abbe7cc3d130ae7_MD5 1.png]]

你可以看到在没有太多点的额外开销的情况下法线贴图难以置信地提升了物体的细节。

使用法线贴图也是一种提升你的场景的表现的重要方式。在使用法线贴图之前你不得不使用相当多的顶点才能表现出一个更精细的网格，但使用了法线贴图我们可以使用更少的顶点表现出同样丰富的细节。下图来自Paolo Cignoni，图中对比了两种方式：

![[7b4683188b78fc78d458fd470a6627b9_MD5 1.png]]

高精度网格和使用法线贴图的低精度网格几乎区分不出来。所以法线贴图不仅看起来漂亮，它也是一个将高精度多边形转换为低精度多边形而不失细节的重要工具。
#### 施密特正交化

关于法线贴图还有最后一个技巧要讨论，它可以在不必花费太多性能开销的情况下稍稍提升画质表现。

**当在更大的网格上计算切线向量的时候，它们往往有很大数量的共享顶点，当法向贴图应用到这些表面时将切线向量平均化通常能获得更好更平滑的结果。这样做有个问题，就是TBN向量可能会不能互相垂直，这意味着TBN矩阵不再是正交矩阵了。法线贴图可能会稍稍偏移，但这仍然可以改进。**

使用叫做**格拉姆-施密特正交化过程（Gram-Schmidt process）** 的数学技巧，我们可以对TBN向量进行重正交化，这样每个向量就又会重新垂直了。在顶点着色器中我们这样做：

```c++ nums
vec3 T = normalize(vec3(model * vec4(tangent, 0.0)));
vec3 N = normalize(vec3(model * vec4(normal, 0.0)));
// re-orthogonalize T with respect to N
T = normalize(T - dot(T, N) * N);
// then retrieve perpendicular vector B with the cross product of T and N
vec3 B = cross(T, N);

mat3 TBN = mat3(T, B, N)
```

这样稍微花费一些性能开销就能对法线贴图进行一点提升。
### 视差贴图(未学习)
**视差贴图(Parallax Mapping)技术和法线贴图差不多，但它有着不同的原则。** 和法线贴图一样视差贴图能够极大提升表面细节，使之具有深度感。它也是利用了视错觉，然而对深度有着更好的表达，与法线贴图一起用能够产生难以置信的效果。视差贴图和光照无关，我在这里是作为法线贴图的技术延续来讨论它的。需要注意的是在开始学习视差贴图之前强烈建议先对法线贴图，特别是切线空间有较好的理解。

**视差贴图属于位移贴图(Displacement Mapping)技术的一种，它对根据储存在纹理中的几何信息对顶点进行位移或偏移。** 一种实现的方式是比如有1000个顶点，根据纹理中的数据对平面特定区域的顶点的高度进行位移。这样的每个纹理像素包含了高度值纹理叫做**高度贴图**。一张简单的砖块表面的高度贴图如下所示：

![[f4de35e7d12f732fd87afcdac498b61f_MD5 1.png]]

**整个平面上的每个顶点都根据从高度贴图采样出来的高度值进行位移**，根据材质的几何属性平坦的平面变换成凹凸不平的表面。例如一个平坦的平面利用上面的高度贴图进行置换能得到以下结果：![[Pasted image 20220930210946.png]]

置换顶点有一个问题就是平面必须由很多顶点组成才能获得具有真实感的效果，否则看起来效果并不会很好。一个平坦的表面上有1000个顶点计算量太大了。我们能否不用这么多的顶点就能取得相似的效果呢？事实上，上面的表面就是用6个顶点渲染出来的（两个三角形）。上面的那个表面使用视差贴图技术渲染，位移贴图技术不需要额外的顶点数据来表达深度，它像法线贴图一样采用一种聪明的手段欺骗用户的眼睛。

**视差贴图背后的思想是修改纹理坐标使一个fragment的表面看起来比实际的更高或者更低，所有这些都根据观察方向和高度贴图**。为了理解它如何工作，看看下面砖块表面的图片：

这里粗糙的红线代表高度贴图中的数值的立体表达，向量V代表观察方向。如果平面进行实际位移，观察者会在点B看到表面。然而我们的平面没有实际上进行位移，观察方向将在点A与平面接触。**视差贴图的目的是，在A位置上的fragment不再使用点A的纹理坐标而是使用点B的。随后我们用点B的纹理坐标采样，观察者就像看到了点B一样。**

这个技巧就是描述如何从点A得到点B的纹理坐标。**视差贴图尝试通过对从fragment到观察者的方向向量V进行缩放的方式解决这个问题，缩放的大小是A处fragment的高度。所以我们将V的长度缩放为高度贴图在点A处H(A)采样得来的值。** 下图展示了经缩放得到的向量P：

![[5e2a42ac4c3d14b30c5eb6134a17ea3f_MD5 1.png]]

我们随后选出P以及这个向量与平面对齐的坐标作为纹理坐标的偏移量。这能工作是因为向量P是使用从高度贴图得到的高度值计算出来的，所以一个fragment的高度越高位移的量越大。

这个技巧在大多数时候都没问题，但点B是粗略估算得到的。当表面的高度变化很快的时候，看起来就不会真实，因为向量P最终不会和B接近，就像下图这样：

![[912d224bc1903ea441d2604748e76c5f_MD5 1.png]]

**视差贴图的另一个问题是，当表面被任意旋转以后很难指出从P获取哪一个坐标**。我们在视差贴图中使用了另一个坐标空间，这个空间P向量的x和y元素总是与纹理表面对齐。如果你看了法线贴图教程，你也许猜到了，我们实现它的方法，是的，我们还是**在切线空间中实现视差贴图**。

将fragment到观察者的向量V转换到切线空间中，经变换的P向量的x和y元素将于表面的切线和副切线向量对齐。由于切线和副切线向量与表面纹理坐标的方向相同，我们可以用P的x和y元素作为纹理坐标的偏移量，这样就不用考虑表面的方向了。

理论都有了，下面我们来动手实现视差贴图。
。。。待续
### HDR（未学习）
> [!bug] 
> 本节暂未进行完全的重写，错误可能会很多。如果可能的话，请对照原文进行阅读。如果有报告本节的错误，将会延迟至重写之后进行处理。

一般来说，当存储在帧缓冲(Framebuffer)中时，亮度和颜色的值是默认被限制在0.0到1.0之间的。这个看起来无辜的语句使我们一直将亮度与颜色的值设置在这个范围内，尝试着与场景契合。这样是能够运行的，也能给出还不错的效果。但是如果我们遇上了一个特定的区域，其中有多个亮光源使这些数值总和超过了1.0，又会发生什么呢？答案是这些片段中超过1.0的亮度或者颜色值会被约束在1.0，从而导致场景混成一片，难以分辨：

![[e8e16d186ca411c182170d1e9205b4fc_MD5 1.png]]

这是由于大量片段的颜色值都非常接近1.0，在很大一个区域内每一个亮的片段都有相同的白色。这损失了很多的细节，使场景看起来非常假。

解决这个问题的一个方案是减小光源的强度从而保证场景内没有一个片段亮于1.0。然而这并不是一个好的方案，因为你需要使用不切实际的光照参数。一个更好的方案是让颜色暂时超过1.0，然后将其转换至0.0到1.0的区间内，从而防止损失细节。

显示器被限制为只能显示值为0.0到1.0间的颜色，但是在光照方程中却没有这个限制。**通过使片段的颜色超过1.0，我们有了一个更大的颜色范围**，这也被称作**HDR(High Dynamic Range, 高动态范围)**。有了HDR，亮的东西可以变得非常亮，暗的东西可以变得非常暗，而且充满细节。

HDR原本只是被运用在摄影上，摄影师对同一个场景采取不同曝光拍多张照片，捕捉大范围的色彩值。这些图片被合成为HDR图片，从而综合不同的曝光等级使得大范围的细节可见。看下面这个例子，左边这张图片在被光照亮的区域充满细节，但是在黑暗的区域就什么都看不见了；但是右边这张图的高曝光却可以让之前看不出来的黑暗区域显现出来。

![[299d971fa42ce31155394e9c46fbce81_MD5 1.png]]

这与我们眼睛工作的原理非常相似，也是HDR渲染的基础。当光线很弱的啥时候，人眼会自动调整从而使过暗和过亮的部分变得更清晰，就像人眼有一个能自动根据场景亮度调整的自动曝光滑块。

HDR渲染和其很相似，我们允许用更大范围的颜色值渲染从而获取大范围的黑暗与明亮的场景细节，最后将所有HDR值转换成在[0.0, 1.0]范围的**LDR(Low Dynamic Range,低动态范围)**。转换HDR值到LDR值得过程叫做**色调映射(Tone Mapping)**，现在现存有很多的色调映射算法，这些算法致力于在转换过程中保留尽可能多的HDR细节。这些色调映射算法经常会包含一个选择性倾向黑暗或者明亮区域的参数。

在实时渲染中，HDR不仅允许我们超过LDR的范围[0.0, 1.0]与保留更多的细节，同时还让我们能够根据光源的**真实**强度指定它的强度。比如太阳有比闪光灯之类的东西更高的强度，那么我们为什么不这样子设置呢?(比如说设置一个10.0的漫亮度) 这允许我们用更现实的光照参数恰当地配置一个场景的光照，而这在LDR渲染中是不能实现的，因为他们会被上限约束在1.0。

因为显示器只能显示在0.0到1.0范围之内的颜色，我们肯定要做一些转换从而使得当前的HDR颜色值符合显示器的范围。简单地取平均值重新转换这些颜色值并不能很好的解决这个问题，因为明亮的地方会显得更加显著。我们能做的是用一个不同的方程与/或曲线来转换这些HDR值到LDR值，从而给我们对于场景的亮度完全掌控，这就是之前说的色调变换，也是HDR渲染的最终步骤。
### 泛光（未学习）
### 延迟着色法（未学习）
### SSAO
> [!bug] 
> 本节暂未进行完全的重写，错误可能会很多。如果可能的话，请对照原文进行阅读。如果有报告本节的错误，将会延迟至重写之后进行处理。

我们已经在前面的基础教程中简单介绍到了这部分内容：环境光照(Ambient Lighting)。环境光照是我们加入场景总体光照中的一个固定光照常量，它被用来模拟光的**散射(Scattering)**。在现实中，光线会以任意方向散射，它的强度是会一直改变的，所以间接被照到的那部分场景也应该有变化的强度，而不是一成不变的环境光。其中一种间接光照的模拟叫做**环境光遮蔽(Ambient Occlusion)**，它的原理是**通过将褶皱、孔洞和非常靠近的墙面变暗的方法近似模拟出间接光照**。这些区域很大程度上是被周围的几何体遮蔽的，光线会很难流失，所以这些地方看起来会更暗一些。站起来看一看你房间的拐角或者是褶皱，是不是这些地方会看起来有一点暗？

下面这幅图展示了在使用和不使用SSAO时场景的不同。特别注意对比褶皱部分，你会发现(环境)光被遮蔽了许多：
![[Pasted image 20221017223148.png]]
尽管这不是一个非常明显的效果，启用SSAO的图像确实给我们更真实的感觉，这些小的遮蔽细节给整个场景带来了更强的深度感。

环境光遮蔽这一技术会带来很大的性能开销，因为它还需要考虑周围的几何体。我们可以对空间中每一点发射大量光线来确定其遮蔽量，但是这在实时运算中会很快变成大问题。在2007年，Crytek公司发布了一款叫做**屏幕空间环境光遮蔽(Screen-Space Ambient Occlusion, SSAO)** 的技术，并用在了他们的看家作孤岛危机上。**这一技术使用了屏幕空间场景的深度而不是真实的几何体数据来确定遮蔽量**。这一做法相对于真正的环境光遮蔽不但速度快，而且还能获得很好的效果，使得它成为近似实时环境光遮蔽的标准。

SSAO背后的**原理**很简单：对于铺屏四边形(Screen-filled Quad)上的每一个片段，我们都会根据周边深度值计算一个**遮蔽因子(Occlusion Factor)**。这个遮蔽因子之后会被用来减少或者抵消片段的环境光照分量。遮蔽因子是通过采集片段周围球型核心(Kernel)的多个深度样本，并和当前片段深度值对比而得到的。高于片段深度值样本的个数就是我们想要的遮蔽因子。
![[Pasted image 20221017223204.png]]
上图中在几何体内灰色的深度样本都是高于片段深度值的，他们会增加遮蔽因子；几何体内样本个数越多，片段获得的环境光照也就越少。
很明显，渲染效果的质量和精度与我们采样的样本数量有直接关系。如果样本数量太低，渲染的精度会急剧减少，我们会得到一种叫做**波纹(Banding)** 的效果；如果它太高了，反而会影响性能。我们可以通过引入随机性到采样核心(Sample Kernel)的采样中从而减少样本的数目。通过随机旋转采样核心，我们能在有限样本数量中得到高质量的结果。然而这仍然会有一定的麻烦，因为随机性引入了一个很明显的噪声图案，我们将需要通过模糊结果来修复这一问题。下面这幅图片([John Chapman](http://john-chapman-graphics.blogspot.com/)的佛像)展示了波纹效果还有随机性造成的效果：
![[Pasted image 20221017223214.jpg]]
你可以看到，尽管我们在低样本数的情况下得到了很明显的波纹效果，引入随机性之后这些波纹效果就完全消失了。

Crytek公司开发的SSAO技术会产生一种特殊的视觉风格。因为使用的采样核心是一个球体，它导致平整的墙面也会显得灰蒙蒙的，因为核心中一半的样本都会在墙这个几何体上。下面这幅图展示了孤岛危机的SSAO，它清晰地展示了这种灰蒙蒙的感觉：
![[Pasted image 20221017223228.jpg]]
由于这个原因，我们将不会使用球体的采样核心，而使用一个沿着表面法向量的半球体采样核心。
![[Pasted image 20221017223235.png]]
通过在**法向半球体(Normal-oriented Hemisphere)** 周围采样，我们将不会考虑到片段底部的几何体.它消除了环境光遮蔽灰蒙蒙的感觉，从而产生更真实的结果。这个SSAO教程将会基于法向半球法和John Chapman出色的[SSAO教程](http://john-chapman-graphics.blogspot.com/2013/01/ssao-tutorial.html)。
### 样本缓冲
SSAO需要获取几何体的信息，因为我们需要一些方式来确定一个片段的遮蔽因子。对于每一个片段，我们将需要这些数据：

-   逐片段**位置**向量
-   逐片段的**法线**向量
-   逐片段的**反射颜色**
-   **采样核心**
-   用来旋转采样核心的随机旋转矢量

通过使用一个逐片段观察空间位置，我们可以将一个采样半球核心对准片段的观察空间表面法线。对于每一个核心样本我们会采样线性深度纹理来比较结果。采样核心会根据旋转矢量稍微偏转一点；我们所获得的遮蔽因子将会之后用来限制最终的环境光照分量。
![[Pasted image 20221017223435.png]]
由于SSAO是一种屏幕空间技巧，我们对铺屏2D四边形上每一个片段计算这一效果；也就是说我们没有场景中几何体的信息。我们能做的只是渲染几何体数据到屏幕空间纹理中，我们之后再会将此数据发送到SSAO着色器中，之后我们就能访问到这些几何体数据了。如果你看了前面一篇教程，你会发现这和延迟渲染很相似。这也就是说SSAO和延迟渲染能完美地兼容，因为我们已经存位置和法线向量到G缓冲中了。
在这个教程中，我们将会在一个简化版本的延迟渲染器([延迟着色法](https://learnopengl-cn.github.io/05%20Advanced%20Lighting/08%20Deferred%20Shading/)教程中)的基础上实现SSAO，所以如果你不知道什么是延迟着色法，请先读完那篇教程。
待续。。。

