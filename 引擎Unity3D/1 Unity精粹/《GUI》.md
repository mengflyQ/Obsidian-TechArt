---
title: GUI
aliases: []
tags: []
create_time: 2023-06-07 23:35
uid: 202306072335
banner: "[[diablo-iv-beta-vendor-3.png]]"
---

# 九宫格 UI 理论
**相对屏幕位置 ScreenPos：**
![[Pasted image 20230607232730.png]]
widgetPos. x = ScreenPos + widgetCenterPos + offsetPos;

**控件中心点位置 widgetCenterPos：**
cw 是控件自身的宽度
ch 是控件自身的高度
![[Pasted image 20230608080527.png|850]]

最后通过操作偏移位置 offset 来摆放 UI
# GUI
## 1 原理及作用
**IMGUI**  （Immediate Mode Graphical User Interface）即时模式图形化交互界面
IMGUI 在 Unity 中一般简称为 GUI，它是一个代码驱动的 UI 系统

作用：
1. 作为程序员的调试工具，创建游戏内调试工具
2. 为脚本组件创建自定义检视面板
3. 创建新的编辑器窗口和工具以拓展 Unity 本身（一般用作内置游戏工具）
4. 用于进行 Unity 内置编辑器，调试工具编辑工具等等相关开发，**不适合用它为玩家制作 UI 功能**

**GUI 的工作原理**：在继承 MonoBehaviour 的脚本中的特殊函数里，调用 GUI 提供的方法，类似生命周期函数。
```cs
private void OnGUI()
{
    
}
```
1. 它**每帧执行**相当于是用于专门绘制 GUI 界面的函数 
2. 一般只在其中执行 GUI 相关界面绘制和操作逻辑 
3. 该函数**在 OnDisable 之前 LateUpdate 之后执行** 
4. 只要是继承 Mono 的脚本都可以在 OnGUI 中绘制 GUI

**缺点**
- 重复工作量繁多
- 控件（widget）绘制相关代码很多
- 最大缺点: 必须运行时才能去查看结果（不能所见即所得，通过 `[ExecuteAlways]` 特性解决），不支持分辨率自适应


## 2 重要参数

> [!warning] 
> GUI 的屏幕原点是左上角

**GUI 控件绘制的共同点：**
1. 他们都是 GUI 公共类中提供的静态函数直接调用即可 
2. 他们的参数都大同小异
    - 位置参数: Rect  （xy 位置 wh 尺寸）
    - 显示文本: string 
    - 图片信息: Texture 
    - 参数综合信息: GUIContent 
    - 参数自定义样式: GUIStyle 
3. **每一种控件都有多种重载，都是各个参数的排列组合必备的参数内容，是位置信息和显示信息**


## 3 Label 标签
![[Pasted image 20230607151421.png|700]]
![[Pasted image 20230607151337.png|450]]

```cs
public Texture texture;  

//骷髅
public Rect rect1;  

//小黄脸
public Rect rect2;  
public GUIContent content2;

public GUIStyle style;

private void OnGUI()  
{
    //1.文本
    GUI.Label(new Rect(0,0,100,20),"Hello World"); //text，传位置信息也可以直接声明公共变量Rect，如下：
    
    //2.图片
    GUI.Label(rect1, texture);  
    
    //3.文本+图片
    //GUIContent可以控制text,image,tooltip
    GUI.Label(rect2,content2);
    Debug.Log(GUI.tooltip);  //获取当前鼠标或者键盘选中的GUI控件对应的tooltip信息


    //4.自定义格式，第三个参数传入GUIStyle
    GUI.Label(new Rect(0,0,100,20),"Hello World",style);
}
```


## 4 Button 按钮
自定义格式：
![[Pasted image 20230607151820.png|450]]


```cs
public Rect rect;  
public GUIContent content;  
public GUIStyle style;

void OnGUI()  
{
    //鼠标按下松开为一次点击
    //无style参数时，使用默认style
    if (GUI.Button(rect, content, style))  //判断是否点击
    {  
        //处理按钮点击逻辑
        print("Button Clicked");  
    }
    
    //鼠标长按
    if(GUI.RepeatButton(rect, content, style))  
    {  
        print("Button Clicked");  
    }
}
```

## 5 Toggle 开关
Toggle 意为（两种状态之间）切换

```cs
//设置方法类似上面的按钮，多一个点击选中的判断，我们要自己声明一个bool值
public bool isSelect;  
  
public Rect rect;  
public GUIContent content;  
public GUIStyle style;

void OnGUI()  
{
    isSelect = GUI.Toggle(rect, isSelect, "Toggle");
    isSelect = GUI.Toggle(rect, isSelect, content,style);
}
```

排版攻略：
1. 修改固定宽高 fixedwidth 和 fixedHeight
2. 修改从 GUIStyle 边缘到内容起始处的空间 padding


![[2022306071646.gif]]
```cs title: 基于 Toggle 实现多选框
public bool isSelect;  
public Rect rect;  
private int nowSelIndex = 0;

void OnGUI()  
{
    //基于Toggle实现多选框
    if (GUI.Toggle(new Rect(0, 60, 100, 30), nowSelIndex == 1, "选项一"))
    {
        nowSelIndex = 1;
    }

    ;
    if (GUI.Toggle(new Rect(0, 90, 100, 30), nowSelIndex == 2, "选项二"))
    {
        nowSelIndex = 2;
    }

    if (GUI.Toggle(new Rect(0, 120, 100, 30), nowSelIndex == 3, "选项三"))
    {
        nowSelIndex = 3;
    }
}
    
```

## 6 输入框和拖动条
![[Pasted image 20230607210356.png]]

```cs
private string inputStr = "";
private string password = "";   
private float nowValue = 0.5f;
public GUIStyle thumbStyle; //滑块样式
//输入框
//比较特别是的第三个参数，最大输入长度
inputStr = GUI.TextField (new Rect (0,0,100,50), inputStr, 5); 

//密码输入,输入全被*遮盖
password = GUI.PasswordField(new Rect(100,0,100,50), password, '*');

//水平拖动条
nowValue = GUI.HorizontalSlider(new Rect(200, 0, 100, 100), nowValue,0.0f,1.0f);
//带风格的拖动条，多一个style参数
nowvalue = GUI.HorizontalSlider(new Rect(200, 0, 100, 100),, nowvalue, minValue, maxValue,style,thumbStyle); //默认的style时滑动条的style，滑块style要自己声明

//竖直拖动条GUI.VerticalSlider()
```

## 7 图片绘制和 Box 框
![[Pasted image 20230607212445.png]]
```cs title:GUI.DrawTexture
public Rect texPos;
public Texture texture;

public ScaleMode scaleMode; //可切换三种缩放模式
//scaleAndCrop:通过宽高比来计算图片，但是会进行裁剪
//ScaleToFit:会自动根据宽高比进行计算，不会拉变形，会一直保持图片完全显示的状态
//stretchToFill:始终填充满你传入的 Rect范围

public bool alphaBlend ;    //默认为true使用alpha透明通道

private void OnGUI()
{
    GUI.DrawTexture(texPos, texture,scaleMode,alphaBlend);
}
```

简单的 Box 边框，没特殊功能
![[Pasted image 20230607212756.png]]
```cs title:GUI.Box
GUI.Box(new Rect(0,0,100,100),"123");
```

## 8 工具栏和选择网格
工具栏特点，多个按钮只能同时选择一个
![[Pasted image 20230607215332.png]]

```cs title:GUI.Toolbar
private int toolbarIndex = 0;
private string[] toolbarInfos = {"选项一", "选项二", "选项三"};
private void OnGUI()
{
    toolbarIndex = GUI.Toolbar(new Rect(0,0,300,30),toolbarIndex,toolbarInfos);
    switch (toolbarIndex)
    {
        case 0:
            break;
        case 1:
            break;
        case 2:
            break;
    }
}
```

选择网格和工具栏具有相同的特点，相对 toolbar 多了一个参数 xCount，**代表水平方向最多显示的按钮数量。**

当 xCount 为 3 时，和上面 toolbar 绘制的 ui 一样。
![[Pasted image 20230607215332.png]]
当 xCount 为 2 时：
![[Pasted image 20230607215701.png]]
当 xCount 为 1 时：
![[Pasted image 20230607215722.png]]
```cs title:GUI.SelectionGrid
private int selGridIndex = 0;
private string[] selGridInfos = {"选项一", "选项二", "选项三"};
private void OnGUI()
{
    selGridIndex = GUI.SelectionGrid(new Rect(0, 50, 300, 30), selGridIndex, selGridInfos,3);
}
```
## 9 滚动视图和分组
**分组**
- 用于批量控制控件位置
- 可以理解为包裹着的控件加了一个父对象
- 可以通过控制分组来控制包裹控件的位置
```cs title:GUI.BeginGroup
public Rect groupPos;  

private void OnGUI()  
{
    //批量控制控件位置
    GUI.BeginGroup(groupPos);
    GUI.Button(new Rect(0,0,100,50),"按钮1");
    GUI.Button(new Rect(0,50,100,50),"按钮2");
    GUI.EndGroup();
}
```

**滚动视图：**
![[Pasted image 20230607222051.png]]

```cs title:GUI.BeginScrollView
public Rect uiPos;
public Vector2 scrollPos;
public Rect viewPos;

private void OnGUI()
{
    GUI.BeginScrollView(uiPos, scrollPos, viewPos);
    GUI.Button(new Rect(0,0,100,50),"按钮1");
    GUI.Button(new Rect(0,50,100,50),"按钮2");
    GUI.EndScrollView ();
}
```

## 10 窗口
就是单独的一个窗口，在绘制窗口的函数中写 UI 代码，以窗口的左上角为原点
![[202306072241.gif]]
```cs title:GUI.Window
public Rect windowPos;
   
private void OnGUI()
{
   //参数一：窗口唯一ID，
   //委托参数是用于绘制窗口用的函数，传入即可
   GUI.Window(1,new Rect(100,100,200,150),DrawWindow,"窗口1");
   GUI.Window (2, new Rect (400,100,200,150), DrawWindow,"窗口 2");

   //可拖动窗口
   //1.位置赋值
   //2.绘制函数调用GUI.DragWindow();
   windowPos = GUI.Window(3,windowPos,DrawWindow,"拖动窗口");

}

private void DrawWindow(int id)
{
   switch (id)
   {
       case 1:
           GUI.Button(new Rect(0,0,50,50),"按钮");
           break;
       case 2:
           GUI.Box(new Rect(0,0,100,100),"123");
           break;
       case 3:
           //传入Rect参数的重载作用
           //决定窗口中哪一部分位置可以被拖动
           //默认不填,就是无参重载,默认窗口的所有位置都能被拖动
           GUI.DragWindow();  
           
           //传参限制可拖动位置，可以实现只能通过拖动顶栏移动窗口
           //GUI.DragWindow(new Rect(0,0,100,20));  
           break;
   }
}
```

**模态窗口**
- 可以让窗口外的其它控件无法点击
- 你可以理解该窗口在最上层，其它按钮都点击不到了，只能点击该窗口上控件
```cs title:GUI.ModalWindow
GUI.ModalWindow(2,new Rect(400,100,200,150),DrawWindow,"模态窗口");
```

## 11 颜色和皮肤
```cs title:设置颜色
//全局着色，同时影响背景和字体，不常用
GUI.color = Color.blue;
      
GUI.contentColor = Color.green;     //文本颜色
GUI.backgroundColor = Color.yellow; //背景颜色
GUI.Button(new Rect(100, 100, 100, 100), "按钮1");
      
GUI.contentColor = Color.white;  //设置白色就可以恢复原色
GUI.backgroundColor = Color.white;
GUI.Button(new Rect(300, 300, 100, 100), "按钮2");
```

右键创建 GUI Skin，相当于 GUI style 的集合体，支持修改所有控件样式。
可以在这里面修改，通过代码传给 UI 控件。
![[Pasted image 20230607225608.png|400]]

```cs title:设置皮肤
public GUISkin guiSkin;

private void OnGUI()
{
  GUI.skin = guiSkin;
  GUI.Button(new Rect(100,100,100,100),"按钮1");
  
  GUI.skin = null;  //恢复默认皮肤
  GUI.Button(new Rect(300,300,100,100),"按钮2");
}
```
## 12 布局 GUILayout
不需要传 Rect 位置参数，自动布局，主要用于编辑器开发（编辑器 UI 排列比较整齐简单）, 不适合作为游戏 UI

![[Pasted image 20230607230430.png]]
```cs
GUILayout.BeginArea(new Rect(100,100,50,50));   //也可以使用group等统一管理位置
GUILayout.Button("123");
GUILayout.Button("123");
GUILayout.Button("123142");
GUILayout.Button("阿斯顿123142");
GUILayout.EndArea();
```

使用布局选项：


```cs title:布局选项
GUILayout.Button("123",GUILayout.Width(300)); //布局选项作为第二个参数传入


//布局选项：
//控件的固定宽高
GUILayout.Width(300);
GUILayout.Height(200);
//允许控件的最小宽高
GUILayout.MinWidth(50);
GUILayout.MinHeight(50);
//允许控件的最大宽高
GUILayout.MaxWidth(100);
GUILayout.MaxHeight(100);
//允许或禁止水平拓展
GUILayout.ExpandWidth(true);    //允许
GUILayout.ExpandHeight(false);  //禁止
```

## 13 自适应
![[Pasted image 20230608080626.png|350]]

# UGUI
UGUI 是 Unity 引擎内自带的 UI 系统官方称之为: Unity Ul
是目前 Unity 商业游戏开发中使用最广泛的 UI 系统开发解决方案
它是基于 Unity 游戏对象的 UI 系统，**只能用来做游戏 UI 功能，不能用于开发 Unity 编辑器中内置的用户界面**
![[Pasted image 20230616154516.png]]

## 1 六大基础组件

**Canvas 对象上依附的:**
`Rect Transform`：UI 对象位置锚点控制组件，主要用于控制位置和对其方式 
`Canvas`：画布组件，主要用于渲染 UI 控件 
`Canvas Scaler`：画布分辨率自适应组件，主要用于分辨率自适应  
`Graphic Raycaster`：射线事件交互组件，主要用于控制射线响应相关  

**EventSystem 对象上依附的:**
`Event System` ：玩家输入事件响应系统，主要用于监听玩家操作 
`Standalone Input Module` ：独立输入模块组件，主要用于监听玩家操作 

### Rect Transform
**UI 对象位置锚点控制组件，主要用于控制位置和对其方式** 

Rect Transform 意思是矩形变换
**是专门用于处理 UI 元素位置大小相关的组件**

- **RectTransform 继承于 Transform**，Transform 组件只处理位置、角度、缩放
- **RectTransform 在此基础上加入了矩形相关，将 UI 元素当做一个矩形来处理加入了中心点、锚点、长宽等属性**，其目的是更加方便的控制其大小以及分辨率自适应中的位置适应。

![[Pasted image 20230616211120.png]]

![[Pasted image 20230616210849.png]]


- @ Pivot：Pivot 轴心点默认为（0.5，0.5）
- 轴心点是旋转的中心（通过调节 Rotation. z 来旋转控件）
- 和锚点配合控制位置
![[Pasted image 20230616204627.png]]

- @ Anchors：Anchors 轴心点默认为（0.5，0.5）
![[Pasted image 20230616205128.png]]
### Canvas 
**画布组件，主要用于渲染 UI 控件** 
![[Pasted image 20230616160418.png]]
- 它是 UGUI 中所有 UI 元素能够被显示的根本
- 它主要负责渲染自己的所有 UI 子对象
- 如果 UI 控件对象不是 Canvas 的子对象，那么控件将不能被渲染
- 我们可以通过修改 Canvas 组件上的参数修改渲染方式
- 场景中可以有多个 Canvas 对象，可以分别管理不同画布的渲染方式，分辨率适应方式等等参数。**如果没有特殊需求，—般情况场景上一个 Canvas 即可。**

#### RenderMode 渲染模式
![[Pasted image 20230616160333.png]]
##### Screen Space - Overlay
覆盖模式，UI 始终显示在场景内容前方

![[Pasted image 20230616160500.png]]

##### Screen Space - Camera
摄像机模式，3D 物体可以显示在 UI 之前

![[Pasted image 20230616160834.png|700]]

1. 不建议使用 Main Camera，避免场景模型遮挡 UI。
2. **使用一个单独的 Camera（后文称之为 UI Camera） 负责渲染 UI。**
    - 主摄像机 Depth 保持默认的-1，UI Camera 的 Depth 要大于-1（深度较大的绘制在深度较小的上方）
    - 主摄像机 Culling Mask 取消勾选 UI
    - UI Camera 的 Culling Mask 只选择 UI，**Clear Flags**设置为 Depth Only（只画该层，背景透明，这样才不会让 UI 遮挡后面的内容）
3. 如果需要在 UI 上显示 3D 模型，直接在 Canvas 上创建即可，Layer 要设置成 UI
4. 通过设置 Sorting Layer，也可以对 Canvas 进行排序，后面的层覆盖前面的层。
5. Order in Layer，适用于相同 Layer 中进行排序

##### Screen Space - Camera
3D 模式，可以把 UI 对象像 3D 物体一样处理，常用于 VR 或者 AR
![[Pasted image 20230616163024.png|350]]
![[Pasted image 20230616162932.png]]

**Event Camera**：用于处理 UI 事件的摄像机（ 如果不设置，不能正常注册 UI 事件）

### Canvas Scaler 
**画布缩放控制器，用于画布分辨率自适应的组件  

它主要负责在不同分辨率下 UI 控件大小自适应
**它并不负责位置，位置由之后的 Rect Transform 组件负责**

**提供了三种用于分辨率自适应的模式**（按需选择）
1. Constant Pixel Size（恒定像素模式)∶
无论屏幕大小如何，U 始终保持相同像素大小

2. <mark style="background: #ADCCFFA6;">Scale With Screen Size (随屏幕尺寸缩放模式)∶</mark>
根据屏幕尺寸进行缩放，随着屏幕尺寸放大缩小

3. Constant Physical Size（恒定物理模式)：
无论屏幕大小和分辨率如何，UI 元素始终保持相同物理大小

#### 分辨率
1. **屏幕分辨率**——当前设备的分辨率，编辑器下 Game 窗口中 Stats 可以查看到
![[Pasted image 20230616164340.png]]
2. **参考分辨率** Reference Resolution——在 Scale With Screen Size 缩放模式中出现的关键参数，参与分辨率自适应的计算
3. **画布宽高和缩放系数**——分辨率自适应会改变的参数，通过屏幕分辨率和参考分辨率计算而来。选中 Canvas 对象后在 Rect Transform 组件中看到的宽高和缩放系数
```
//分辨率为（x,y）,则：
Width * Scale. x = 分辨率x
Height * Scale. y = 分辨率y
```

4. **分辨率大小自适应**——通过一定的算法以屏幕分辨率和参考分辨率参与计算得出缩放系数该结果会影响所有 UI 控件的缩放大小

#### UI Scale Mode UI 缩放模式
重点：
![[Pasted image 20230616172357.png]]
![[Pasted image 20230616171748.png]]
##### Constant Pixel Size 恒定像素模式 
**无论屏幕大小如何，U 始终保持相同像素大小**
它不会让 UI 控件进行分辨率大小自适应
会让 UI 控件始终保持设置的尺寸大小显示
**一般在进行游戏开发<mark style="background: #FF5582A6;">极少使用这种模式</mark>，除非通过代码计算来设置缩放系数**

![[Pasted image 20230616163416.png]]
- **Scale Factor: 缩放系数**，按此系数缩放画布中的所有 UI 元素 
- **Reference Pixels Per Unit：单位参考像素**，多少像素对应 Unity 中的一个单位（**默认一个单位为 100 像素**)，图片设置中的 Pixels Per Unit 设置，会和该参数一起参与计算

Set Native Size：恢复 Source Image 的原始尺寸，结果需要经过计算：
![[Pasted image 20230616165546.png|500]]
![[Pasted image 20230616165421.png]]


##### Scale With Screen Size  随屏幕尺寸缩放模式
**根据屏幕尺寸进行缩放，随着屏幕尺寸放大缩小，<mark style="background: #FF5582A6;">最常用</mark>**

![[Pasted image 20230616164147.png]]

- **Reference Resolution ：参考分辨率** (PC 常用 1920x1080，手机端也要适配对应分辨率，一般由美术人员决定)。缩放模式下的所有匹配模式都会基于参考分辨率进行自适应计算
- **Screen Match Mode：屏幕匹配模式**，当前屏幕分辨率宽高比不适应参考分辨率时，用于分辨率大小自适应的匹配模式。
    - 有三种模式：**最常使用的是 Match Width Or Height 模式，套路如下：**
![[Pasted image 20230616171748.png]]

- <mark style="background: #FF5582A6;">三种模式的详细解释</mark>
    1. <mark style="background: #D2B3FFA6;">Expand</mark>: 水平或垂直**拓展画布**区域，会根据宽高比的变化来放大缩小画布，可能有黑边： ![[Pasted image 20230616171229.png|300]] ![[Pasted image 20230616170712.png|500]] ![[Pasted image 20230616170854.png|500]]
    2. <mark style="background: #D2B3FFA6;">Shrink</mark>: 水平或垂直**裁剪画布**区域，会根据宽高比的变化来放大缩小画布，可能会裁剪  ![[Pasted image 20230616171328.png|500]]
     3. <mark style="background: #D2B3FFA6;">Match Width Or Height</mark>: **以宽高或者二者的平均值**作为参考来缩放画布区域（常用）![[Pasted image 20230616171520.png|450]] ![[Pasted image 20230616171534.png|500]] ![[Pasted image 20230616171554.png]]

##### Constant Physical Size 恒定物理模式 
无论屏幕大小和分辨率如何，UI 元素始终保持相同物理大小
 
![[Pasted image 20230616164157.png]]

**DPI: （Dots Per Inch，每英寸点数）图像每英寸长度内的像素点数**
Physical Unit：物理单位，使用的物理单位种类
Falback Screen DPI：备用 DPI，当找不到设备 DPI 时，使用此值 Default Sprite DPI: 默认图片 DPI

![[Pasted image 20230616172726.png]]
![[Pasted image 20230616172735.png]] ![[Pasted image 20230616172936.png]]

##### World 世界模式
![[Pasted image 20230616173212.png]]

![[Pasted image 20230616173244.png]]

### Graphic Raycaster 
Graphic Raycaster 意思是图形射线投射器（不是基于碰撞器，而是基于图形）
- **用于检测 UI 输入事件**
- 主要负责通过射线检测玩家和 UI 元素的交互，判断是否点击到了 UI 元素

![[Pasted image 20230616173440.png]]
**lgnore Reversed Graphics**: 是否忽略反转图形
- ? 反转指的是将控件的 Rect Transfrom 中的 Rotation 属性的 x 或 y 轴旋转 180 度
**Blocking Objects**: 射线被哪些类型的碰撞器阻挡 (在覆盖渲染模式 Screen Space - Overlay 下无效) 
**Blocking Mask**: 射线被哪些层级的碰撞器阻挡（在覆盖渲染模式下无效)

**演示：**
在一个 Button 控件前分别放一个 3D object（Cube） 和 2D object（Sprite），这两个 object 都要添加碰撞器，如下：
![[Pasted image 20230616175144.png]]
- 当 Blocking Objects 为 None 时，可以点击到 button
- 当 Blocking Objects 为 2D 时，右边点不到 button
- 当 Blocking Objects 为 3D 时，左边点不到 button
- 当 Blocking Objects 为 all 时，两边都点不到 button

### Event System
Event System 意思是事件系统
**玩家输入事件响应系统，主要用于监听玩家操作** 
![[Pasted image 20230616202924.png]]
- **它是用于管理玩家的输入事件并分发给各 UI 控件**
- 它是事件逻辑处理模块，**所有的 UI 事件都通过 EventSystem 组件中轮询检测并做相应的执行**
- 它类似一个中转站，和许多模块一起共同协作，如果没有它，所有点击、拖曳等等行为都不会被响应

`First Selected`: 首先选择的游戏对象，可以设置游戏一开始的默认选择 
`Send Navigation Events`: 是否允许导航事件（开启后可以通过键盘控制移动/按下/取消，wasd 移动，空格/回车选择)
`Drag Threshold`: 拖拽操作的阈值（移动多少像素的距离才算开始拖拽)

### Standalone Input Module
**独立输入模块组件，主要用于监听玩家操作** 
![[Pasted image 20230616203659.png]]
- 它主要针对处理鼠标/键盘/控制器/触屏的输入
- 输入的事件通过 Event System 进行分发
- **它依赖于 Event System 组件，他们两缺一不可**

**和 Input Manager 中的设置绑定，一般不会进行修改：**
`Horizontal Axis`: 水平轴按钮对应的热键名 (该名字对应 Input 管理器) 
`Vertical Axis`: 垂直轴按钮对应的热键名（该名字对应 Input 管理器)
`Submit Button`: 提交（确定)按钮对应的热建名（该名字对应 Input 管理器) 
`Cancel Button`: 取消按钮对应的热建名 (该名字对应 Input 管理器)

`Input Actions Per Second`: 每秒允许键盘/控制器输入的数量 
`Repeat Delay`: 每秒输入操作重复率生效前的延迟时间
`ForceModule Active`: 是否强制模块处于激活状态

### 代码获取组件属性
```cs
//因为Transform是RectTransform父类，所以可以强转为RectTransform
print(((RectTransform)this.transform).sizeDelta);

//等价
print((this.transform as RectTransform).sizeDelta);
```

## 2 三大基础控件
### Image
![[Pasted image 20230616213350.png]]
- 是 UGUI 中用于显示精灵图片（Sprite）的关键组件
- 除了背景图等大图用 RawImage，一般都使用 Image 来显示 UI 中的图片元素
![[Pasted image 20230616213356.png]]

- @ **控件显示顺序**：根据在 Canvas 下的层级，越后面的优先级越高:
![[Pasted image 20230616213645.png]]

- @ **Raycast Taget 示例**：在 Button 控件前加一个 Image 控件
    - 默认勾选，重叠部分无法点击 Button
    - 取消勾选，重叠部分可以点击 Button
![[Pasted image 20230616214219.png]]

- @ **ImageType 图片类型**
![[Pasted image 20230616215522.png]]

![[Pasted image 20230616220250.png]]
- Simple：只用于固定尺寸的图片，美术出什么尺寸就用什么尺寸
- Sliced 切片模式：拉伸常用，需要设置图片边框 border
- Tiled-平铺模式：重复平铺中央部分，可以设置图片边框 border
- Filled-填充模式：效果较多，可以做血条 cd 等效果


**设置图片边框 border 的步骤：**
1. 找到图片，点击 SpriteEditor：
![[Pasted image 20230616214956.png|450]]
2. 拉动绿色线，将图片分割成九宫格区域。当拉伸图片时，横向拉伸只会拉伸竖向的中间一排，竖向拉伸只会拉伸横向的中间一排。四角不会发生拉伸
![[Pasted image 20230616215136.png|500]]

#### 代码获取 Image 属性
```cs title:代码获取Image属性
//修改当前Image控件的SourceImage
//图片必须放在Resources文件夹
Image img = this.GetComponent<Image>();
img.sprite = Resources.Load<Sprite>( "EmojiOne");
```

### Text
有两个版本
- Text (TMP)，基于 TextMeshPro
- Text (Legacy)，旧版
#### Text (TMP)
```cs
public TMP_Text text;  //声明
```
#### Text (Legacy)
![[Pasted image 20230616222442.png|450]]
![[Pasted image 20230616222359.png]]
#### 代码控制文本内容
```cs title:代码控制文本内容
//Text(TMP)
TextMeshPro text = this.GetComponent<TextMeshPro>();  
text.text = "Hello World";

//Text(Legacy)
Text txt = this.GetComponent<Text>();
txt.text ="Helloworld;
```

### RawImage
RawImage 是原始图像组件
**是 UGUI 中用于显示任何纹理图片的关键组件**

**和 Image 的区别：**
- 一般 RawImage **用于显示大图 (背景图、不需要打入图集的图片、网络下载的图等等)**。Image 则用于显示一些小的 UI 元素。
- RawImage 支持各种 Texture Type，Image 必须使用 Sprite

![[Pasted image 20230616223059.png]]
![[Pasted image 20230616223338.png]]
#### 代码控制 Texture
```cs title:代码控制Texture
RawImage img = this.GetComponent<RawImage>();
img.texture = Resources.Load<Texture>( "EmojiOne");
```

## 3 组合控件
### Button 按钮
**按钮组件**
是 UGUI 中用于处理玩家按钮相关交互的关键组件
![[Pasted image 20230616223909.png|450]]

![[Pasted image 20230616223923.png]]

![[Pasted image 20230616224314.png]]

![[Pasted image 20230616232905.png]]

>1. Navigation 要联动 Event System：
> ![[Pasted image 20230616232956.png|500]]
>2. Explicit 指定周边控件：
> ![[Pasted image 20230616233516.png|500]]
>3. 导航连线：
> ![[Pasted image 20230616233439.png|350]]

#### 代码控制 button 属性
```cs title:代码控制button
Button btn = this.GetComponent<Button>();  
btn.interactable = true;  
btn.transition = Selectable.Transition.ColorTint;
...
```

#### 监听点击事件
点击事件是在按钮区域按下抬起一次就算一次点击
监听点击事件有两种方式：
1. 拖拽对象
![[Pasted image 20230616234235.png]]
只显示脚本上的 public 方法

2. 代码添加
```cs
void Start()
    {
        Button button = GetComponent<Button>();
        
        //添加监听，原理就是委托
        button.onClick.AddListener(ClickButton); 
        //也可以使用lambda表达式
        button.onClick.AddListener(() =>
        {
            print("另一种方式ClickButton");
        });
        
        //移除监听
        button.onClick.RemoveListener(ClickButton);
        
        //移除所有监听
        button.onClick.RemoveAllListeners();
    }

    public void ClickButton()
    {
        print("ClickButton");
    }
```

### 异形按钮
**异形即形状不规则**
普通的 Button 是根据矩形区域来响应点击，当我们使用带有透明部分的图片时，如图，点击透明区域也会响应，我们只想要不透明部分作为 button
![[Pasted image 20230618194912.png]]

#### 方法一：添加子对象
按钮之所以能够响应点击，主要是根据图片矩形范围进行判断的
它的范围判断是**自下而上**的，意思是如果有子对象 Button，点击子对象 Button 的矩形范围也会让上面的 button 响应，那么我们就可运用多个透明图拼凑不规则图形作为按钮，子对象用于进行射线检测

如下图，先用一个 Image 作为背景图，然后修改各个 Button 按钮的矩形范围，拼出大致区域即可。
![[Pasted image 20230618201317.png]]

![[Pasted image 20230618201241.png]]

#### 方法二：通过代码改变图片的透明度响应阈值
1. 第一步: 修改图片参数开启 Read/ write Enabled 开关，会增大内存消耗
2. 第二步: 通过代码修改图片的响应阈值

```cs
public Image image;

private void Start()
{
    //该参数含义: 指定一个像素必须具有的最小 alpha 值，以便能够认为射线命中了图片。
    //说人话: 当像素点 alpha 值小于了该值就不会被射线检测了
    image.alphaHitTestMinimumThreshold = 0.1f;
}
```
### Toggle 开关
**开关组件**
是 UGUI 中用于处理玩家**单选框多选框相关交互的关键组件**
开关组件**默认是多选框**
>可以**通过配合 ToggleGroup 组件制作为单选框**（单选框就是多个框只能同时选择其中的一个）
>1. canvas 下创建一个空 object 命名为 GroupObject，添加 ToggleGroup 组件，然后将多个 Toggle 作为其子对象（Allow Switch Off 即是否允许所有选项都为关闭状态）![[Pasted image 20230617231302.png]] ![[Pasted image 20230617231207.png]]
>2. 每个 Toggle 的 Group 都设置为 GroupObject ![[Pasted image 20230617231154.png]]

默认创建的 Toggle 由 4 个对象组成
- 父对象：Toggle 组件依附
- 子对象：背景图 (必备)、选中图 (必备)、说明文字 (可选)

![[Pasted image 20230617230340.png|400]]

Interactable、Transition、Navigation 设置和 Button 一致
![[Pasted image 20230617230510.png]]

#### 代码控制
```cs
Toggle toggle = this.GetComponent<Toggle>();  
toggle.isOn = true;  
  
ToggleGroup toggleGroup = this.GetComponent<ToggleGroup>();  
toggleGroup.allowSwitchOff = true;  
  
//通过迭代器便利的到处于选中状态的 Toggle  
foreach (Toggle item in toggleGroup.ActiveToggles())  
{  
print(item.name);  
}
```

#### 监听点击事件
点击事件是在按钮区域按下抬起一次就算一次点击
监听点击事件有两种方式：
1. 拖拽对象，注意选择的函数必须有 bool 形参，表示打开和关闭
![[Pasted image 20230617232706.png]]

1. 代码添加
```cs
void Update()  
{  
Toggle toggle = GetComponent<Toggle>();  
tog.onValueChanged.AddListener(ChangeValue);  
}  
  
//必须传bool形参  
public void ChangeValue(bool isOn)  
{  
print("状态改变" + isOn);  
}
```


### InputField  输入字段
**输入字段组件**
是 UGUI 中用于**处理玩家文本输入相关交互**的关键组件

默认创建的 InputField 由 3 个对象组成
父对象：InputField 组件依附对象，以及同时在其上挂载了一个 Image 作为背景图
子对象：文本显示组件 (必备)、默认显示文本组件 (必备)

#### InputField (TMP)
```cs
public TMP_InputField inputField;  //声明
```
#### InputField (Legacy)
![[Pasted image 20230617233548.png]]

**Content Type：**
![[Pasted image 20230617233722.png|450]]

```cs
InputField input = this.GetComponent<InputField>();print(input.text);
input.text = "123123123123";
```

### Slider 滑动条
**滑动条组件**
是 UGUI 中用于处理滑动条相关交互的关键组件

默认创建的 Slider 由 4 组对象组成
父对象：Slider 组件依附的对象
子对象：背景图、进度图、滑动块三组对象

![[Pasted image 20230617234615.png]]

![[Pasted image 20230617234645.png|450]]
![[Pasted image 20230617234657.png]]

```cs
Slider slider = GetComponent<Slider>();
slider. value += 0.01f;
```

### Scrollbar 滚动条
**滚动条组件**

是 UGUI 中**用于处理滚动条相关交互**的关键组件

默认创建的 scrollbar 由 2 组对象组成
父对象：Scrollbar 组件依附的对象子对象
滚动块对象：**一般情况下我们不会单独使用滚动条，都是配合 ScrollView 滚动视图来使用**

![[Pasted image 20230617235146.png]]
### ScrollView 滚动视图
**滚动视图组件**
是 UGUI 中**用于处理滚动视图相关交互**的关键组件

默认创建的 ScrollRect 由 4 组对象组成
父对象：ScrollRect 组件依附的对象，还有一个 Image 组件最为背景图
子对象：
Viewport 控制**滚动视图可视范围**和 Content **控制内容范围** （内部控件都放在 Content 下面 ）
Scrollbar Horizontal 水平滚动条
Scrollbar Vertical 垂直滚动条

![[Pasted image 20230617235616.png|400]]
![[Pasted image 20230617235604.png]]

### DrawDown 下拉列表
**下拉列表（下拉选单)组件**
是 UGUI 中**用于处理下拉列表相关交互**的关键组件

默认创建的 DropDown 由 4 组对象组成
父对象：DropDown 组件依附的对象还有一个 Image 组件作为背景图
子对象：
Label 是当前选项描述 
Arrow 右侧小箭头
Template 下拉列表选单

#### DrawDown (TMP)

#### DrawDown (Legacy)
![[Pasted image 20230618001017.png|350]]
![[Pasted image 20230618000758.png|500]]


```cs
 Dropdown dropdown = GetComponent<Dropdown>();
print(dropdown.value);

print(dropdown.options[dropdown.value].text);
dropdown.options.Add(new Dropdown.OptionData("新增选项"));
```

## 4 自动布局组件
虽然 UGUI 的 RectTransform 已经非常方便的可以帮助我们快速布局，但 UGUI 中还提供了很多可以帮助我们对 UI 控件进行自动布局的组件，他们可以帮助我们**自动的设置 UI 控件的位置和大小等**

**自动布局的工作方式**：自动布局控制组件 + 布局元素 = 自动布局 

**自动布局控制组件**：unity 提供了很多用于自动布局的管理性质的组件用于布局
**布局元素**： 具备布局属性的对象们，这里主要是指具备 RectTransform 的 UI 组件

> [!quote] 布局属性
> **要参与自动布局的布局元素必须包含布局属性，布局属性主要有以下几条**
> `Minmum width`: 该布局元素应具有的最小宽度
> `Minmum height`: 该布局元素应具有的最小高度
> 
> `Preferred width`: 在分配额外可用宽度之前，此布局元素应具有的宽度
> `Preferred height`: 在分配额外可用高度之前，此布局元素应具有的高度。
> 
> `Flexible width`: 此布局元素应相对于其同级而填充的额外可用宽度的相对量 
> `Flexible height`: 此布局元素应相对于其同级而填充的额外可用高度的相对量
> 
> **在进行自动布局时都会通过计算布局元素中的这 6 个属性得到控件的大小位置**
> - ! **一般情况下我们不会去手动修改他们**，但是如果你有这些需求，可以手动添加一个 `LayoutElement` 组件，可以修改这些布局属性。
> ![[Pasted image 20230618205443.png]]
> >控件 Insepctor 最下方可以查看布局属性
> 
> 在布局时，**布局元素大小设置的基本规则：**
> 1. 首先分配最小大小 `Minmum width` 和 `Minmum height`
> 2. 如果父类容器中有足够的可用空间，则分配 `Preferred width` 和 `Preferred height`
> 3. 如果上面两条分配完成后还有额外空间，则分配 `Flexible width` 和 `Flexible height`
> 
> 一般情况下布局元素的这些属性都是 0，但是特定的 UI 组件依附的对象布局属性会被改变，比如 Image 和 Text

#### 水平垂直组件
**组件名**：Horizontal Layout Group 和 Vertical Layout Group
**将子对象并排或者竖直的放在一起**

通常将组件给父对象，那么子对象就会自动布局，如图，红色 Image 作为父对象，其他颜色 Image 作为子对象，父对象添加 Horizontal Layout Group 组件：
![[Pasted image 20230618210116.png]] ![[6a7sd15a1da.gif|500]]

![[Pasted image 20230618210413.png]]
参数相关:
Padding: 左右上下边缘偏移位置
Spacing: 子对象之间的间距
ChildAlignment: 九宫格对其方式
Control Child size: 是否控制子对象的宽高
Use child Scale: 在设置子对象大小和布局时，是否考虑子对象的缩放
child Force Expand: 是否强制子对象拓展以填充额外可用空间

#### 网格布局组件
**组件名**: Grid Layout Group
**将子对象当成一个个的格子设置他们的大小和位置**
![[6a7sd15a1da 1.gif|550]]
![[Pasted image 20230618211335.png]]
参数相关:
Padding: 左右上下边缘偏移位置 
Cell size: 每个格子的大小 
Spacing: 格子间隔
Start Corner: 第一个元素所在位置 (4 个角)
Start Axis: 沿哪个轴放置元素：Horizontal 水平放置满换行，Vertical 竖直放置满换列 
Child Alignment: 格子对其方式（9 宫格)
Constraint: 行列约束
Flexible: 灵活模式，根据容器大小自动适应 
Fixed column Count: 固定列数
Fixed Row Count: 固定行数

#### 内容大小适配器
**组件名**: Content size Fitter
它可以**自动的调整 RectTransform 的长宽来让组件自动设置大小**
一般在 Text 上使用或者配合其它布局组件一起使用

![[Pasted image 20230618212411.png]]
参数相关
Horizontal Fit: 如何控制宽度 
Vertical Fit: 如何控制高度
Unconstrained: 不根据布局元素伸展
Min size: 根据布局元素的最小宽高度来伸展
Preferred Size: 根据布局元素的偏好宽度来伸展宽度。

**常用情景，背包动态扩容**
![[Pasted image 20230618211900.png]]
为 Content 添加一个网格布局组件，然后不断添加 Image ，我们发现，随着 Image 数量增多，Content 的 Rect 高度并没有增加，这就导致，滚轮无法查看所有格子：
![[6a7sd15a1dafasf.gif]]
我们只需为 Content 添加内容大小适配器，将 Verticla Fit 设置为 Preferred Size，就可以了：
![[6a7sd15a1dafasf4.gif]]
#### 宽高比适配器
组件名: Aspect Ratio Fitter

让布局元素按照一定比例来调整自己的大小，使布局元素在父对象内部根据父对象大小进行适配
![[Pasted image 20230618212719.png]]
参数相关:
Aspect Mode: 适配模式, 如果调整矩形大小来实施宽高比
None: 不让矩形适应宽高比
width Controls Height: 根据宽度自动调整高度 
Height Controls width: 根据高度自动调整宽度
Fit In Parent: 自动调整宽度、高度、位置和锚点，使矩形适应父项的矩形，同时保持宽高比，会出现黑边
Envelope Parent: 自动调整宽度、高度、位置和锚点，使矩形覆盖父项的整个区域，同时保持宽高比，会出现“裁剪
Aspect Ratio: 宽高比; 宽除以高的比值

## 5  图集 (需要补一下 Unity 核心)
UGUI 和 NGUI 使用上最大的不同是：NGUI 使用前就要打图集，UGUI 可以再之后再打图集
**打图集的目的就是减少 Drawcall 提高性能**，我们可以通过打图集，将小图合并成大图，将本应 n 次的 Drawcall 变成 1 次 Drawcall 来提高性能。

### Sprite Packer
**Sprite Packer (精灵包装器，可以通过 Unity 自带图集工具生成图集)**
Edit->Project Setting->Editor
![[Pasted image 20230618001804.png]]

1. **Disabled**: 默认设置, 不会打包图集
2. **Enabled For Build（常用）**: Unity 仅在构建时打包图集，在编辑器模式下不会打包
3. **Always Enabled（常用）**: Unity 在构建时打包图集，在编辑模式下运行前会打包图集

### 图集参数
创建图集：create->2D->Sprite Atlas
![[Pasted image 20230618141523.png|500]]
图集打包后，不要让外部部件插入其中，这样会增加 drawcall

```cs
//加载图集注意:需要引用命名空间  
SpriteAtlas sa = Resources.Load<SpriteAtlas>( "MyAlas");  
//从图集中加载指定名字的小图  
sa.GetSprite("bk");
```

## 6 UI 事件接口
 
目前所有的控件都只提供了常用的事件监听列表
**如果想做一些类似长按，双击，拖拽等功能是无法制作的，或者想让 Image 和 Text, RawImage 三大基础控件能够响应玩家输入也是无法制作的**
而事件接口就是用来处理类似问题，让所有控件都能够添加更多的事件监听来处理对应的逻辑

**常用事件接口：**
`IPointerEnterHandler` - `OnPointerEnter` -当指针进入对象时调用 (鼠标进入) 
`IPointerExitHandler` - `OnPointerExit` -当指针退出对象时调用 (鼠标离开)
`IPointerDownHandler` - `OnPointerDown` -在对象上按下指针时调用  (按下)
`IPointerUpHandler` - `OnPointerUp` -松开指针时调用（在指针正在点击的游戏对象上调用)（抬起）
`IPointerClickHandler` - `OnPointerclick` -在同一对象上按下再松开指针时调用 (点击)

`IBeginDragHandler` - `OnBeginDrag` -即将开始拖动时在拖动对象上调用 (开始拖拽）
`IDragHandler` - `OnDrag` - 发生拖动时在拖动对象上调用 (拖拽中)
`IEndDragHandler` - `OnEndDrag` -拖动完成时在拖动对象上调用 (结束拖拽)

![[Pasted image 20230618142218.png]]

### 使用方法
1. 继承 MonoBehavior 的脚本继承对应的事件接口，引用命名空间 
2. 实现接口中的内容
3. 将该脚本挂载到想要监听自定义事件的 UI 控件上 
```cs
//需要什么接口就继承什么
public class Test : MonoBehaviour, IPointerEnterHandler, IPointerClickHandler
{
    //实现接口内容
    public void OnPointerEnter(PointerEventData eventData)
    {
        print("鼠标进入");
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        print("鼠标点击");
    }
}
```
### PointerEventData
上面实现的接口内容都有一个 `PointerEventData` 类型的参数
父类: `BaseEventData` 

`pointerId`: 鼠标左右中键点击鼠标的 ID ，通过它可以判断左中右键点击，对一个 ID 分别为-1，-2，-3
`position`: 当前指针位置 (屏幕坐标系)
`pressPosition`: 按下的时候指针的位置 delta: 指针移动增量
`clickCount`: 连击次数 clickTime: 点击时间
`pressEventCamera`: 最后一个 `onPointerPress` 按下事件关联的摄像机 
`enterEvetnCamera`: 最后一个 `onPointerEnter` 进入事件关联的摄像机

```cs title:使用方法
public void OnPointerClick(PointerEventData eventData)
{
    print("鼠标点击");

    //获取鼠标点击ID
    print(eventData.pointerId);
}
```

### EventTrigger 
事件触发器是 EventTrigger 组件
它是一个集成了上节课中学习的所有事件接口的脚本，它可以让我们更方便的为控件添加事件监听

直接在 UI 控件上添加 EventTrigger 即可：
![[Pasted image 20230618143456.png]]

**使用方法：**
1. 直接拖脚本关联，注意传入的函数参数为 BaseEventData 类型
![[Pasted image 20230618143557.png]]

```cs
public void TestPointerEnter(BaseEventData eventData)
    {
        //如果想获取其他信息，就转换成PointerEventData类型
        PointerEventData pointerEventData = eventData as PointerEventData;
        print("鼠标进入" +  pointerEventData.position);
    }
```

2. 代码关联
```cs
//声明事件
EventTrigger.Entry entry = new EventTrigger.Entry();

//设置事件类型
entry.eventID = EventTriggerType.PointerEnter;

//设置回调函数
entry.callback.AddListener((data)=>{ Debug.Log("鼠标进入"); });

//添加事件
eventTrigger.triggers.Add(entry);
```


## 7 屏幕坐标转 UI 坐标
`RectTransformUtility` 公共类是一个 `RectTransform` 的辅助类主要用于进行一些坐标的转换等等操作，其中对于我们目前来说最重要的函数是将屏幕空间上的点，转换成 UI 本地坐标下的点

方法:
`RectTransformUtility. ScreenPointToLocalPointInRectangle`
**参数一**：相对父对象
**参数二**：屏幕点
**参数三**：摄像机
**参数四**：最终得到的点
一般配合拖拽事件使用

![[Pasted image 20230618144851.png]]
![[Pasted image 20230618145514.png]]
将以下脚本挂在给子对象，可以通过鼠标拖动 image 子对象相对于父对象移动
```cs
public class Test : MonoBehaviour , IDragHandler
{
    public void OnDrag(PointerEventData eventData)
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            this.transform.parent as RectTransfor,
            eventData.position,
            eventData.enterEventCamera,
            out Vector2 localPoint);
        
        this.transform.localPosition = localPoint;
    }
}
```

## 9 Mask 遮罩
实现遮罩效果的关键组件时 Mask 组件
通过**在父对象上添加 Mask 组件**即可遮罩其子对象

注意:
1. 想要被遮罩的 Image 需要勾选 Maskable
2. 只要父对象添加了 Mask 组件，那么所有的 UI 子对象都会被遮罩
3. 遮罩父对象图片的制作，不透明的地方显示，透明的地方被遮罩

 遮罩前： ![[Pasted image 20230618150128.png]]
 使用遮罩： ![[Pasted image 20230618150119.png]]

## 10 模型和粒子显示在 UI 之前
### 方法一：直接用摄像机渲染 3D 物体
Canvas 的渲染模式：摄像机模式和世界 (3D)模式都可以让模型显示在 UI 之前（(Z 轴在 UI 元素之前即可)
注意:
1. 摄像机模式时建议用专门的摄像机渲染 UI 相关 
2. 面板上的 3D 物体建议也用 UI 摄像机进行渲染

![[#Screen Space - Camera]]

### 方法二：渲染在 RT 上，通过 RawImage 显示

专门使用一个摄像机渲染 3D 模型，将其渲染内容输出到 Render Texture 上，类似小地图的制作方式
再将渲染的图显示在 UI 上
该方式不管 canvas 的渲染模式是哪种都可以使用

 ![[Pasted image 20230618151231.png|500]]
1. 创建一个专用摄像机，将想要渲染的模型单独设置一个 Layer，将摄像机的 CullingMask 设置为该 Layer，之渲染该模型
2. Create->RenderTexture，将创建的 RT 传给摄像机
3. Canvas 下创建一个 RawImage（RawImage 支持各种 Texture Type），将 RT 传过去就可以了。

### 方法三：粒子系统 Order in Layer
 
**粒子系统也可以使用方法一和方法二，同时有一个单独的方法：**
canvas 和粒子系统都有一个层级排序选项，通过修改粒子系统的序号，让值大于 Canvas，即可实现忽略 z 轴，粒子始终显示在 UI 前
![[Pasted image 20230618151821.png|500]]

![[Pasted image 20230618151734.png|550]]

## 11 CanvasGroup
为面板父对象添加 CanvasGroup 组件即可同时控制一组 Canvas
常用于整体控制一个面板的淡入淡出或者整体禁用

![[Pasted image 20230618212954.png]]
参数相关:
Alpha: 整体透明度控制
Interactable: 整体启用禁用设置 
Blocks Raycasts: 整体射线检测设置
Ignore Parent Groups: 是否忽略父级 CanvasGroup 的作用

## 12 常用插件
DoTween—缓动插件，可以制作一些缓动效果

TextMeshPro: 一文本网格插件，可以制作更多的特效文字
## 13 实战

![[Pasted image 20230724215213.png]]



# ShaderGUI
**ShaderGUI 分为两种，一种是 Drawer 一种是 GUI，当然可以把 GUI 集成后用 Drawer 的形式写。**
这里主要说的是  GUI，因为 Drawer 有很多限制，例如修改 RenderType 的时候就很麻烦。
回到 GUI。大部分 GUI 继承自两个类，**`ShaderGUI & BaseShaderGUI`**（可以去 Unity 里翻翻，记得改成 all）。前者是自己造轮子，后者是根据前者的基础上造好了一些轮子（如果是在 Lit 基础上魔改的，用 BaseShaderGUI 方便一些）这里主要是抄作业

另外一点就是参考默认 lit. shader 的时候会发现**CustomEditor**里面是一个**namespace**，所以其实也可以写成**CustomEditor “namespace. name”**的形式

**再有一点，Drawer 和 GUI 是分开的独立的，互不影响。如果需要影响的话，有一个 base. OnGUI 可以达到 Drawer 和 GUI 混用**

## 一、Drawer
Unity 为用户提供了基础类：`MaterialPropertyDrawer`，专门**用于快速实现自定义材质面板**的目的。

### 常用的属性特性

`[Space]` 单行空格
`[Space (5)]` 五行空格
`[Header (name)]`  标题名
`[HideInInSpector]`：在 InSpector 面板隐藏
`[NoScaleOffset]`：隐藏纹理的 Tiling 和 Offset
`[Normal]`：检测是否为 NormalMap
`[HDR]`：指示纹理或颜色属性使用[高动态范围 (HDR)](https://docs.unity3d.com/cn/2022.3/Manual/HDR.html) 值。
`[Gamma]`：指示浮点数或矢量属性使用 sRGB 值
![[1 ShaderLab#颜色空间和颜色/矢量着色器数据]]

`[MainTexture]` ：将纹理设置为主纹理，默认情况 Unity 会将属性名为 `_MainTex` 的纹理设置为主纹理。如果 Shader 中有多个该命令，只有第一个命令会生效 
```cs title:脚本访问主纹理
public Texture texture;
void Start()
{
    Material.mat = GetConponent<Renderer>().material;
    mat.material = texture;
}
```

-  `[MainColor]`：将属性设置为主颜色，默认情况 Unity 会将名为 `_Color` 的纹理设置为主纹理。如果 Shader 中有多个该命令，只有第一个命令会生效 
```cs title:脚本访问主颜色
public Texture texture;
void Start()
{
    Material.mat = GetConponent<Renderer>().material;
    mat.color = color.red;
}
```

`[PerRendererData]`：指示纹理属性将来自每渲染器数据，形式为 [MaterialPropertyBlock](https://docs.unity3d.com/cn/2022.3/ScriptReference/MaterialPropertyBlock.html)。材质 Inspector 会将这些属性显示为只读。

### 不同类型的 DrawerClass
![[Pasted image 20230615172023.png]]
在编写 Shader 的时候，DrawerClass 需要写在对应属性之前的“`[]`”中，类别的后缀名称“Drawer”不需要添加，因为 Unity 在编辑的时候会自动添加。


6. IntRange（整数滑动条）
`[IntRange]_Alpha("Alpha",Range(0,255)) = 0`

7. Space（垂直间隔）
`[Space]_Prop1("Prop1",Float) = 0`
也可以加数字增大间隔
`[Space(50)]_Prop2("Prop2",Float) = 0`

8. Header（标题头）
`[Header(Title)]_Title("Title",Float) = 0`

9. PowerSlider（指数式的滑动条）
`[PowerSlider(3.0)]_Shininess("Shininess",Range(0,1)) = 0`

10. Enum（枚举）
`[Enum(Zero,0,One,1,Two,2,Three,3)] _Number ("Number", Float) = 0`

11. KeywordEnum（枚举）
`[KeywordEnum(None,Add,Multiply)]_Overlay("OverLay Mode",Float) = 0`
KeywordEnum 和 Enum 使用上有些不同，区别在于 KeywordEnum 类似于 if-else，同时在 shader 代码中需要处理


#### Toggle 和 ToggleOff
**将 float 类型的数据以开关的形式在材质属性面板上显示，数值只能设置为 0 或 1，0 为关闭，1 为开启。**
当 Toggle 开启，Shader 关键词会被 Unity 默认设置为 `property name_ON`
当 ToggleOff 开启，Shader 关键词会被 Unity 默认设置为 `property name_OFF`

注意：关键词的所有字母必须大写。

```c title:使用方法
//1、声明Property，格式为：[ToggleOff] VarName("Display", Int) = 0/1
Properties
{
    [Toggle] _EnableColor_Attr("_EnableColorAttr", Int) = 1
    //[ToggleOff] _EnableColor_Attr("_EnableColorAttr", Int) = 1
}


// 2、声明关键词ShaderFeature，格式为: #progma shader_feature VARNAME_ON/OFF
#pragma shader_feature _ENABLECOLOR_ATTR_On
//#pragma shader_feature _ENABLECOLOR_ATTR_OFF


// 3、使用，直接用 #if defined(VARNAME_ON/OFF)
#if defined(_ENABLECOLOR_ATTR_ON)
//#if defined(_ENABLECOLOR_ATTR_OFF)
...
#endif
```

除了使用 Unity 默认的关键词，也可以自定义一个特殊的关键词，例如：
```c
[Toggle (ENABLE_FANCY)] _Fancy ( "Fancy? " ,Float) = 0
```
括号内的名称 ENABLE_FANCY 即为自定义的 Shader 关键词。

#### Enum
枚举（Enum）将 float 类型的数据以下拉列表的形式在材质属性面板上显示，Unity 为用户提供了一些内置的枚举类，例如 BlendMode、CillMode、CompareFunction，举个例子：
![[Pasted image 20221020200242.png|400]]
```c
Properties  
{  
    ......
    [Enum(UnityEngine.Rendering.BlendMode)]  
    _BlendSrc("混合源乘子",int) = 0  
    [Enum(UnityEngine.Rendering.BlendMode)]  
    _BlendOst("混合目标乘子",int) = 0  
    [Enum(UnityEngine.Rendering.BlendOp)]  
    _BlendOp("混合算符",int) = 0  
}
Pass  
{
......
BlendOp [_BlendOp]        //可自定义混合运算符  
Blend [_BlendSrc] [_BlendOst]   //可自定义混合模式
}
```

这是 Unity 内置的所有混合系数的枚举类，默认值为 0 表示选择第一个混合系数，默认值为 1 表示选择第二个混合系数，
以此类推。最终在材质面板上的显示效果如图 11-1 所示，这些选项就是 Shader 中可以使用的所有混合系数。
![[Pasted image 20230615172846.png|450]]

当然，用户也可以自己定义枚举的名称／数值对，但是一个枚举最多只能自定义 7 个名称／数值对。举个例子：
```cs
[Enum (Off, 0，On, 1)] _Zwrite ( "ZWrite", Float) = 0
```
上述例子定义的枚举为“是否深度写入”，括号内为定义的名称／数值对，序号 0 对应 Off，序号 1 对应 On，中间用符号“，”间隔开。默认为序号 0，也就是 Off。

#### KeywordEnum
关键词枚举（KeywordEnum）跟普通的枚举类似，也是将 float 类型的数据以下拉列表的形式在材质属性面板上显示，**只不过关键词枚举会有与之对应的 Shader 关键词**，在 Shader 中通过 `#pragma shader_feature` 或 `#pragma multi_compile ` 指令可以开启或者关闭某一部分 Shader 代码。

Shader 关键词格式为：`property name_enum name`，属性名称+“下画线”+枚举名称，所有英文必须大写，并且最多支持 9 个关键词。举个例子：
```c
[KeywordEnum(None,Add,Multiply)] _Overlay("Overlay mode", Float) = 0
```
括号内的 None，Add，Multiply 是定义的 3 个枚举名称，中间用逗号隔开。默认值为 0，表示默认使用 None。这三个选项所对应的 Shader 关键词分别为：`_OVERLAY_NONE`、`_OVERLAY_ADD` 和 `_OVERLAY_MULTIPLY`。

定义如下：
![[ff2ec5c9a828a57966b774f66e3c89b4_MD5.png]]

使用如下：
![[26594b2b6e750ca51a90aa2b193aeb79_MD5.png]]

#### 在编译指令中定义关键词
定义了 `ToggleDrawer` 或者 `KeywordEnumDrawer` 之后，如果想要正常使用，还需要在编译指令中声明 Shader 关键词。例如，上面定义的 None、Add、Multiply 关键词枚举，在编译指令中的代码如下：

```c
#pragma shader_feature _OVERLAY_NONE _OVERLAY_ADD _OVERLAY_MULTIPLY
```

不同关键词之间需要用空格间隔开。
另外，也可以使用另一种编译指令定义关键词，代码如下：

```c
#pragma multi_compile _OVERLAY_NONE _OVERLAY_ADD _OVERLAY_MULTIPLY
```

**虽然表面上看似通过一个 Shader 文件实现了不同种情况，但是 Unity 会自动将不同情况编译成不同版本的 Shader 文件，这些不同版本的 Shader 文件被称为 Shader 变体（Variants），上述编译指令中包含三个 Shader 变体**。

假设再添加一个指令：
```c
#pragma shader_feature _INVERT_ON
```
本指令包含 Toggle 的关闭与开启两种情况，所以 Unity 最终会编译出 2×3=6 个 Shader 变体。因此在使用大量 shader feature 或 multi compile 指令的时候，无形之中会产生大量的 Shader 变体文件。

**两种不同编译指令之间的区别如下：**
（1）shader_feature：只会为材质使用到的关键词生成变体，没有使用到的关键词不会生成变体，**因此无法在运行的时候通过脚本切换效果**。
（2）multi_compile：会为所有关键词生成变体，因此**可以在运行的时候通过脚本切换效果**。

在 Shader 文件的属性设置面板中可以查看到本 Shader 生成的变体数量，如图 11-2 所示，通过开启“Skip unused shader_features”选项可以只查看使用关键词的变体数量，也可以关闭“Skip unused shader_features”选项查看所有关键词的变体数量。如果需要确定具体的关键词是哪些，可以单击“Show”查看。
![[Pasted image 20230615175748.png]]


### 内置枚举 UI 汇总
ZWriteMode 是没有内置的，实际上也只有 on 和 off 两个状态，所以用 Toogle 其实也可以，这里是直接用 `[Enum(Off, 0, On, 1)]` 这样的写法声明了个新的自定义 Enum 

想要知道 unity 还有哪些 shader 里可以用的 Attributes 可以看看 MaterialPropertyDrawer. cs 这个文件，或者继承 MaterialPropertyDrawer 后自己写一个。

![[Pasted image 20230622155106.jpg]]

```cs title:CustomEnum
public enum CustomEnum
{
    Enum1 = 0,
    Enum2 = 1,
    Enum3 = 2
}
```

```cs
Shader "Mya/EnumTest"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        
        [Header(Custom)]
        [Enum(CustomEnum)]  _CustomEnum ("CustomEnum", Float) = 1

        [Header(Option)]
        [Enum(UnityEngine.Rendering.BlendOp)]  _BlendOp  ("BlendOp", Float) = 0
        [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend ("SrcBlend", Float) = 1
        [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend ("DstBlend", Float) = 0
        [Enum(Off, 0, On, 1)]_ZWriteMode ("ZWriteMode", float) = 1
        [Enum(UnityEngine.Rendering.CullMode)]_CullMode ("CullMode", float) = 2
        [Enum(UnityEngine.Rendering.CompareFunction)]_ZTestMode ("ZTestMode", Float) = 4
        [Enum(UnityEngine.Rendering.ColorWriteMask)]_ColorMask ("ColorMask", Float) = 15

        [Header(Stencil)]
        [Enum(UnityEngine.Rendering.CompareFunction)]_StencilComp ("Stencil Comparison", Float) = 8
        [IntRange]_StencilWriteMask ("Stencil Write Mask", Range(0,255)) = 255
        [IntRange]_StencilReadMask ("Stencil Read Mask", Range(0,255)) = 255
        [IntRange]_Stencil ("Stencil ID", Range(0,255)) = 0
        [Enum(UnityEngine.Rendering.StencilOp)]_StencilPass ("Stencil Pass", Float) = 0
        [Enum(UnityEngine.Rendering.StencilOp)]_StencilFail ("Stencil Fail", Float) = 0
        [Enum(UnityEngine.Rendering.StencilOp)]_StencilZFail ("Stencil ZFail", Float) = 0

    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            BlendOp [_BlendOp]
            Blend [_SrcBlend] [_DstBlend]
            ZWrite [_ZWriteMode]
            ZTest [_ZTestMode]
            Cull [_CullMode]
            ColorMask [_ColorMask]

            Stencil
            {
                Ref [_Stencil]
                Comp [_StencilComp]
                ReadMask [_StencilReadMask]
                WriteMask [_StencilWriteMask]
                Pass [_StencilPass]
                Fail [_StencilFail]
                ZFail [_StencilZFail]
            }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG. cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos (v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // sample the texture
                fixed4 col = tex2D(_MainTex, i.uv);
                return col;
            }
            ENDCG
        }
    }
}

```


```cs
using System;
using UnityEngine;
using UnityEditor;

public class XXX : ShaderGUI
{
    // OnGuI 接收的两个参数 ：
    MaterialEditor materialEditor;//当前材质面板
    MaterialProperty[] materialProperty;//当前shader的properties
    Material targetMat;//绘制对象材质球

    // 折叠栏
    private bool m_GUITest = true;

    // 主要实现逻辑
    public override void OnGUI(MaterialEditor materialEditor, MaterialProperty[] properties)
    {
        this.materialEditor = materialEditor; // 当前编辑器
        this.materialProperty = properties;   // 用到的变量
        this.targetMat = materialEditor.target as Material; // 当前材质球

        show(); // 使用下面这个 show函数
    }
    void show()
    {
        #region Shader属性
        // Shader里面的属性，FindProperty 就是从shader里找这个属性
        MaterialProperty _MainTex = FindProperty("_MainTex", materialProperty);
        MaterialProperty _MainColor = FindProperty("_MainColor", materialProperty);
        MaterialProperty _Range = FindProperty("_Range", materialProperty);
        MaterialProperty _Float = FindProperty("_Float", materialProperty);
        MaterialProperty _Red = FindProperty("_Red", materialProperty);
        #endregion

        #region GUI名称
        // GUI名称
        GUIContent mainTex = new GUIContent("主贴图");
        GUIContent mainColor = new GUIContent("主贴图染色");
        GUIContent range = new GUIContent ("测试用 Range");
        GUIContent float1 = new GUIContent("测试用Float");
        GUIContent red = new GUIContent("红色");
        #endregion

        #region GUI折叠
        // 供折叠使用
        m_GUITest = EditorGUILayout.BeginFoldoutHeaderGroup(m_GUITest, "GUI折叠");
        if (m_GUITest)
        {
            // 显示图片用
            materialEditor.TexturePropertySingleLine(mainTex, _MainTex, _MainColor);
                EditorGUI.indentLevel++;
                materialEditor.ShaderProperty(_Range, range);
                materialEditor.ShaderProperty(_Float, float1);
                EditorGUI.indentLevel--;
        }
        #endregion

        // 开关
        EditorGUI.BeginChangeCheck ();
        EditorGUI.showMixedValue = _Red.hasMixedValue;
        var _RED_ON = EditorGUILayout.Toggle(red, _Red.floatValue == 1);
        if (EditorGUI.EndChangeCheck())
            _Red.floatValue = _RED_ON ? 1 : 0;
        EditorGUI.showMixedValue = false;
        // 打开开关之后的效果
        if (_Red.floatValue == 1)
        {
            targetMat.EnableKeyword("_RED_ON");
                EditorGUI.indentLevel++;
                GUILayout.Label("已启用变体 _RED_ON");
                EditorGUI.indentLevel--;
        }
        else
        {
            targetMat.DisableKeyword("_RED_ON");
        }
        
        EditorGUILayout.Space(20);
        // Render Queue
        materialEditor.RenderQueueField(); 
    }
}
```
## 二、CustomEditor GUI

待补充...


我们使用 `CustomEditor` 来扩展材质面板，声明在 Shader 最下方。
> `CustomEditor`：可为着色器定义一个 CustomEditor。如果执行了此操作，Unity 将查找具有此名称并能扩展 ShaderGUI 的类。如果找到，则使用此着色器的所有材质都将使用此 ShaderGUI

我们要在 `Editor` 文件夹创建一个指定的 `CustomShaderGUI.cs` 脚本
```c
CustomEditor "CustomShaderGUI.cs"
```

该类**继承 `ShaderGUI` 并重载 `OnGUI` 方法来扩展材质编辑器**。

ShaderGUI 通过 shader 中的 CustonEditor 关联 UI 脚本，Unity 会调用 OnGUI 来绘制面板， **UI 脚本必须放入 Editor 文件夹中.**

```cs
public class TestGUI : ShaderGUI
{
	//OnGUI接收两个参数：
    MaterialEditor materialEditor;//当前材质面板
    MaterialProperty[] properties;//当前shader的properties

    Material targetMat;//绘制对象材质球
    string[] keyWords;//当前shader keywords
    
    Public override void OnGUI(MaterialEditor materialEditor, MaterialProperty[] properties)
    {
        this.MaterialEditor = materialEditor;
        this.MaterialProperty = properties;
        this.targetMat = materialEditor.target as Material;
        this.keyWords = targetMat.shaderKeywords;
        //关键字是否存在可以判断分支的开启状态
        show();
    }
    
    void show(){
        GUILayout.Label(“Hello Word”);
    }

}
```

![[7c9deaa843b7d9b2b2c3270779012a2c_MD5.png]]

_我们开启自定义 UI 显示以后，默认 UI 将会失效。_  

### 贴图单行显示

`FindProperty` 会根据属性名称 ID 去查找 material Properties 中包含的相应属性，Content 是一个显示 Lable, 它包含了属性名称，属性数值和属性 Tips。最后用 materialEditor 绘制单行贴图 UI

**参数一**：propertyname 材质属性的名称
**参数二**：properties 可用材质属性的数组
**参数三**：propertylsmandatory 如果为 true，则如果没有找到 propertyName 属性，此方法将抛出异常。

```cs
//显示贴图
MaterialProperty _CubeMap= FindProperty(“_CubeMap”, materialProperties, true);

GUIContent content = new GUIContent(_CubeMap.displayName, _CubeMap.textureValue, “cube Map”);//tips 是说明文字，鼠标悬停属性名称时显示
materialEditor.TexturePropertySingleLine(content, _CubeMap);
```

![[2936ec0ef4505833aa6d51546d970848_MD5.png]]

  
添加调色给这张图, 在原有属性下方查找到颜色，GUI 容器还是使用 cubemap 的, 这时 color 就会出现在 cubemap 之后单行显示。

```cs
MaterialProperty tint = FindProperty (“_Color”, materialProperties, true);
//modification
materialEditor.TexturePropertySingleLine(content, _CubeMap, tint);//重载方法
//添加缩放偏移属性显示
//EditorGUI.indentLevel是将绘制的元素进行头部位置偏移
EditorGUI.indentLevel++;
//添加贴图缩放
materialEditor.TextureScaleOffsetProperty(_CubeMap);
EditorGUI.indentLevel--;
//偏移后须将头部位置归位，即便在属性列表末端也需要。
```

![[38d98d0bcb87e266ed15ad6b913f20a0_MD5.png]]

### 法线单行显示，无贴图隐藏滑竿

```cs
MaterialProperty _Normal = FindProperty(“Normal”, materialProperties,true);
MaterialProperty _NormalStrength= null;
//如果有贴图让容器包括强度绘制，没贴图不绘制强度
If(_Normal.textureValue != null)
{
	_NormalStrength = FindProperty(“_NormalStrength”, materialproperties, true);
}

materialEditor.TexturePropertySingleLine(MakeGUIContent(_Normal), _Normal, _NormalStrength );

//自定义绘制 content 方法
GUIContent MakeGUICOntent(MaterialProperty m){
	GUIContent content = new GUIContent(m.displayName, m.textureValue, “”);
Return content;
}
```

![[c15abbbdf66858de8afe9ab275868012_MD5.png]]

![[fa217d21b9cc784271e34dacd5b3197e_MD5.png]]

### 贴图特殊设置提示

在默认 attribute 中我们使用法线贴图时会提示我们当前传入图片是否是法线，我们可以借鉴这一功能定义我们自己需要设置的内容作为提示显示出来。

```cs
MaterialProperty _Tex2 = FindProperty("_Tex2", properties);
materialEditor.TextureProperty(_Tex2, "Tex 2");

if (_Tex2 != null && _Tex2.textureValue.wrapMode != TextureWrapMode.Clamp)
{
	setClamp = materialEditor.HelpBoxWithButton(new GUIContent("贴图需要clamp模式"), new GUIContent("设置")); //setClamp : bool
}
```

![[222151b3539e6faf843b96590fd115a5_MD5.gif]]

```cs
//当我们修改状态以后可以对离线资源进行同步设置
if(setClamp){
    setClamp = false;
    string path = AssetDatabase.GetAssetPath(_Tex2.textureValue);
    TextureImporter textureImporter = AssetImporter.GetAtPath(path) as TextureImporter;
    textureImporter.warpMode = TexturWrapMode.Clamp;
    textureImporter.SaveAndReimport();
}
```

![[4365c9eb40c7e9564164559c72ebf64b_MD5.gif]]

### UI 界面变更检查

现在是在 OnGUI 中每帧重复执行所有方法 (并不是每帧重绘制)，我们应当是 material 属性改变以后在执行内部方法赋值 shader。

```cs
void SetKeyWord(string keyword, bool enable)
    {
        if(enable){
            targetMat.EnableKeyword(keyword);
        }
        else
        {
            targetMat.DisableKeyword(keyword);

        }
    }

EditorGUI.BeginChangeCheck();//需要检查的位置之前放置
materialEditor.TexturePropertySingleLine(MakeGUIContent(_Metallic), _Metallic, _Metal);
If(EditorGUI.EndChangeCheck())//有修改返回ture
{
	SetKeyWord(_Metallic.name.ToUpper() + "_ON", _Metallic.textureValue != null);
}
```

![[2318ba91681f552da97bc6736e230faf_MD5.png]]

![[8b085b56ec15cbeeea62fe93ae15f434_MD5.png]]

```cs
//也可以根据 debug 来查看 keyword 是否成功
targetMat.IsKeywordEnabled(string)
```

### 根据条件隐藏显示所属 UI 控件

```cs
//设置列表显示关键字
public enum LAYER_COUNT
{
    _LAYERCOUNT_ONE, _LAYERCOUNT_TWO, _LAYERCOUNT_THREE
}

public LAYER_COUNT LC;
public void SetKeyWorld(LAYER_COUNT settings) {
           switch (settings)
        {
            case LAYER_COUNT._LAYERCOUNT_ONE:
                targetMat.DisableKeyword(LAYER_COUNT._LAYERCOUNT_THREE.ToString());
                targetMat.DisableKeyword(LAYER_COUNT._LAYERCOUNT_TWO.ToString());
                targetMat.EnableKeyword(LAYER_COUNT._LAYERCOUNT_ONE.ToString());
                break;
            case LAYER_COUNT._LAYERCOUNT_TWO:
                targetMat.DisableKeyword (LAYER_COUNT._LAYERCOUNT_ONE.ToString ());
                targetMat.DisableKeyword(LAYER_COUNT._LAYERCOUNT_THREE.ToString());
                targetMat.EnableKeyword(LAYER_COUNT._LAYERCOUNT_TWO.ToString());
                break;
            case LAYER_COUNT._LAYERCOUNT_THREE:
                targetMat.DisableKeyword(LAYER_COUNT._LAYERCOUNT_ONE.ToString());
                targetMat.DisableKeyword(LAYER_COUNT._LAYERCOUNT_TWO.ToString());
                targetMat.EnableKeyword(LAYER_COUNT._LAYERCOUNT_THREE.ToString());
                break;
        }

    }
```

我们将 enum 控件绘制在最顶端，根据修改去赋值 shader

```cs
EditorGUI.BeginChangeCheck();
LC = (LAYER_COUNT)EditorGUILayout.EnumPopup("LayerCount", LC);
if (EditorGUI.EndChangeCheck()) { 
        SetKeyWorld(LC);	
}
```

![[3173a3dd4a1e65e8ddc95c18a3952730_MD5.png]]

![[36a37e9485c5e538c2970bf3d6e26e39_MD5.png]]

因为我们设置了分支关键字，shader 内会根据关键字走相应流程。我们可以将不被使用的流程属性隐藏。

![[be95405ef6aeca6b9db35edddcf0c5a7_MD5.gif]]

![[4a7d3a24518cf0e8840b72e5960bc410_MD5.gif]]

### 折叠组

和上一步的实现类似区别在于使用一个带有折叠判断的控件绘制, 可以使用 FoldoutHeaderGroup 或 Foldut

```cs
isFoldut = EditorGUILayout.BeginFoldoutHeaderGroup(isFoldut, "Group 01");
if (isFoldut)
{
    //TODO
}
EditorGUILayout.EndFoldoutHeaderGroup();
```

![[7449c1a5fcb835adaf7c7845c5dfcb27_MD5.gif]]

### 可调节 min max 的滑动条

节省控件位置或者更直观的表达时使用，中间以 0 为例，左区间是 [minLimit, 0] 右[0, maxLimit]

左右区间是可以被动态修改的

```cs
EditorGUILayout.MinMaxSlider(ref minVal, ref maxVal, minLimit, maxLimit);
```

![[377de902a4d3ad548a715b0159317bd0_MD5.gif]]

### 控件容器 Rect

在界面中每一个控件都可以定制长宽。x，y 0 点在左上角

![[f9b6c3c6b01d719e3f4e0372c2fd727d_MD5.png]]

  

![[328032c1a6abcc378000b8efa977042b_MD5.png]]

如果我们手动设置 rect，那样以后排板将会很痛苦。

```cs
//获取上一个Rect
//Rect eST = GUILayoutUtility.GetLastRect();
Rect e;

if (Event. current. type == EventType. Repaint){
    e = GUILayoutUtility.GetLastRect();
}
```

判断执行事件是为了避免获取失效。

我们用一个 silder 来控制一个 box 的长短，使其 100% 时填充满 inspector 宽。

```cs
slider =  EditorGUILayout.Slider(slider, 0, 1);
GUI.backgroundColor =  Color.green;
GUILayout.Box(new GUIContent(), GUILayout.Width(slider*e.width));
```

![[e8eb2a7285e194b61e01ab9116042ab4_MD5.gif]]


# SimpleShaderGUI（插件）

最近抽空学习并弄了一个通用的 Shader GUI，你可以使用他轻松的组织你的 shader 属性。他非常的方便，并且兼容 Unity 内置的属性样式例如 [Header ()]、[Space]、[Toggle]、[Enum] 等

在介绍如何使用前，先感谢那些大佬无私的奉献，让我少走了很多弯路，参考已放在文章最后。

## 目录

1.  URP Shader 模板
2.  使用 SimpleShaderGUI
3.  折叠属性
4.  切换属性
5.  纹理属性
6.  向量属性
7.  范围属性
8.  兼容于扩展
9.  工程
10.  参考

## 1. URP Shader 模板

众所周知，目前 Unity 没有提供创建 URP Shader 的模板，在编写 URP shader 时需要建一个 UnlitShader，然后在对其进行修改。

我在这里编写了一个 URP Shader 模板，你可以通过右键 Create->Shader->URP Shader 来创建他，该模板具有基础的 URP 格式，并使用了我自定义的 ShaderGUI，你可以通过修改 CustomShaderGUI/Editor/Template/URPShader 来修改这么模板

模板的创建使用了[雨松大佬的方法](https://www.xuanyusong.com/archives/3732)

![[4ee2ec6f75f2474aaadb4e98bdd530d7_MD5.gif]]

## 2. 使用 SimpleShaderGUI

使用时只需要在 Shader 最后添加 ShaderGUI 的引用 Scarecrow. SimpleShaderGUI，之后像使用 Unity 内置的属性绘制一样就可以，下面将说明目前的属性有哪些

![[966717cc548efc2f7b7562bd9fb1dd3b_MD5.png]]

Unity 自带的属性绘制可以参考以下文章

[【Unity Shader】自定义材质面板的小技巧](https://blog.csdn.net/candycat1992/article/details/51417965) [喵喵 Mya：Shader 面板上常用的一些内置 Enum](https://zhuanlan.zhihu.com/p/93194054)

在使用该 ShaderGUI 时，如果你的属性中包含以下俩个属性_SrcBlend、_DstBlend。将会自动在材质顶部生成不透明和半透明的切换按钮

![[94cc68aa35c11c82d749ca6a7e5b802e_MD5.png]]

## 3. 折叠属性

折叠页使用了 World 标签的形式，使用这种方式可以轻松的制作和管理嵌套折叠页 (之前还考虑使用标签语言的方式，但发现太麻烦了就弃用了...)

![[861d61308f18ef896f6cf942f61f3bea_MD5.jpg]]

```
//foldoutLevel      折叠页等级，折叠页最低等级为1级(默认1级折叠页)
        //foldoutStyle      折叠页外观样式(默认第一种)，目前有3种 1 大折叠页样式， 2 中折叠页样式, 3 小折叠页样式
        //foldoutToggleDraw 折叠页 复选框是否绘制， 0 不绘制 , 1绘制 
        //foldoutOpen       折叠页初始展开状态，    0 折叠， 1展开
        //showList          填写任意数量的选项，当其中一个选项被选中时，该控件会被渲染
        public FoldoutDrawer(float foldoutLevel = 1, float foldoutStyle = 1, float foldoutToggleDraw = 0, float foldoutOpen = 1, params string[] showList)
```

1.  **foldoutLevel 折叠页等级:** 就像 World 一样，你可以选择折叠页的等级，级别低 (数字大) 的就会被嵌套在级别高的折叠页中
2.  **foldoutStyle 折叠页外观样式:** 目前一共有三种样式，通过 1~3 进行选择
3.  **foldoutToggleDraw 是否绘制复选框:** 控制复选框是否被绘制 0 不绘制， 1 绘制
4.  **foldoutOpen 折叠页初始展开状态:** 0 折叠， 1 展开
5.  **showList 显示项列表:** 该属性配合切换属性进行使用，当列表中任意一个选项被选中时该折叠页 (以及折叠页里的属性) 将会被绘制，否则将不绘制

![[08a4d7a0bd3222e123ebb856cc6a6809_MD5.jpg]]

**特别需要注意的是折叠页显示的名字必须以_Foldout 结尾，他只起表示作用，属性为 float。属性的初始值 0 为禁用折叠页，1 为启用折叠页**

当勾选复选框时，将会对材质设置关键字 **大写属性名_ON**，你可以使用他进行一些操作，例如

![[5e80ffa77b2beccde834b0980d821620_MD5.webp]]

showList 将会和切换属性一起说明

**3.1 跳出折叠页**

如果你想将内容跳出当前折叠页，你可以使用 [Foldout_Out]

```
public Foldout_Out(float foldoutLevel = 1)
```

foldoutLevel 跳出折叠页等级: 比如你的属性在 3 级折叠页中，你可以选择跳到 2 级或者 1 级，例如将颜色属性跳出 2 级折叠页

![[bec36c29d34892780d70ed0b0415aeca_MD5.gif]]

**4. 切换属性**

切换属性它可以控制你指定的属性显示或隐藏，他与折叠页不同，折叠页只是把属性折叠起来。在介绍切换属性前，先了解一下他的工作原理

切换属性一共有两种控件，一个是复选框 [Toggle_Switch]、另一个是菜单栏 [Enum_Switch]。我们有一个选项池，用来存储被选中的选项。当复选框被勾选、或者菜单栏某个选项被选中都会向选项池里添加该选项。其他属性需要输入他显示的选项列表，当他显示列表中的选项至少有一个存在选项池里，该属性将会被显示出来。如下图

![[022bd850241f5576f169c45ec1a125bd_MD5.jpg]]

如上图，颜色 1 属性会不显示、颜色 2 属性将会显示出来，接下来来了解下切换控件吧

**4.1 复选框切换**

他和 Unity 的 [Toggle] 一样，只是名称需要换成[Toggle_Switch]

![[f400abc347da3eeed1f7287d0abfa507_MD5.jpg]]

![[58a55d8637634ddee7f5895bd735bd80_MD5.jpg]]

选中时会设置 **大写属性名_ON** 的关键字，如上就会设置 TOGGLE1_ON

**4.2 菜单栏切换**

他和 Unity 的 [Enum] 一样 (只是目前不支持直接输入枚举), 需要名称换成[Enum_Switch]

你需要对他进行传参 (任意多)，该参数表示菜单栏中的选项

![[2397a234baa7ddba9b513f3ce0ff4ee6_MD5.jpg]]

![[0c52f1ddc30f18653044fc7f38a173b6_MD5.jpg]]

选中会设置 **大写属性名_大写选项名** 的关键字，如上就会设置 **_ENUM1_ENUM2**

**4.3 显示控件**

对于一般的属性使用 [Switch] 来进行属性的显示切换，但对于已经使用绘制的属性来说 (例如折叠页、纹理、向量等) 在属性最后面的 showList 就是他的显示列表

下面来看下 [Switch] 的使用

![[2588712904f9b7dde277f69bcdac2f11_MD5.jpg]]

![[f5723f5a37a5868d4809865a6cec3e94_MD5.gif]]

但是对于折叠页那样的属性，已经使用了 [Foldout] 绘制，所以他不能使用 [Switch] 来进行切换。不过我在参数的最后面留有了显示列表的接口 (showList) 提供使用，其他属性也是一样的。当折叠页不显示时，他里面的所有东西也会不显示。当参数为空时他将一直显示

![[003dbfe6e18e6ec002893d23e93cefdf_MD5.jpg]]

![[3bb56a0296d6ac690eadedde37ae03d6_MD5.webp]]

他的自由度非常高，你甚至可以通过以下方式来控制使用纹理的数量

![[194e41d1ba0786f1d6b98c521bb51f42_MD5.jpg]]

![[863ea8cc16362472b5dbfe3bfff01a55_MD5.gif]]

**4.4 注意!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!**

**在使用该切换控件时有两点需要特别注意，当然你可能不知道意味着什么，当你出了问题时会想起来的**

1.  **切换控件一定要在使用该选项的属性前面 (在属性列表中把他放在前面)，因为只有记录了该控件的选项你才能使用该选项**
2.  **切换控件一定要比使用该选项的属性优先显示，出于某些骚操作，你可能会将切换控件和显示属性放在两个不同的折叠页中，当切换控件被折叠时，依然不会记录选中的选项**

**一般是不会有问题的，这是考虑某些极端的骚操作所留下来的问题，当你遇到问题时，看看是不是犯了这两个错误**

**5. 纹理属性**

这里提供了一个单行纹理的显示方式，并且纹理后面可以选择跟一个属性

```
//addProName    要在纹理后面绘制属性的名字
//showList      填写任意数量的选项，当其中一个选项被选中时，该控件会被渲染
public TexDrawer(string addProName, params string[] showList)
```

*   addProName 纹理后面要显示属性的名字
*   showList 显示选项列表，当任意一个被选中时，该属性将会显示

![[38abc1f9fd524893e995b07175ce09dc_MD5.jpg]]

![[02164397a33b7d0125089faadd98b224_MD5.jpg]]

使用 [NoScaleOffset] 就可以不显示缩放属性

**6. 向量属性**

这里把[喵爷控制方向的属性整合 (搬(抄)) 了过来](https://zhuanlan.zhihu.com/p/97256929)

```
//showList      填写任意数量的选项，当其中一个选项被选中时，该控件会被渲染
public Vector3Drawer (params string[] showList)
```

![[b19a96b37f21a1096242011f17827f3e_MD5.png]]

![[01ae48d06ea268ec35ef44958e421614_MD5.gif]]

使用时你需要选中一个物体，然后再点击 Set。他将会设置一个世界空间下的向量

需要注意的是如果你想使用该向量来计算光照，你应该使用该向量的相反数

![[917748b8a51dea55179177c0ad0419a9_MD5.jpg]]

**7. 范围属性**

该属性会生成一个范围的滑块控件，在你向指定某一个范围时会很有用

```
//showList      填写任意数量的选项，当其中一个选项被选中时，该控件会被渲染
public RangeDrawer(params string[] showList)
```

![[610a7492671d8d8035e68a1c2abbdfc0_MD5.png]]

![[cd5e00cc0c3ee6b03037267428f5e995_MD5.gif]]

**8. 兼容于扩展**

该 ShaderGUI 使用的是 Unity 2020.2.3f1c1 制作的，其他版本没有测试，在制作时发现 SceneView. onSceneGUIDelegate 在新版将被弃用，所以使用的是 SceneView. duringSceneGui。如果你在旧版的 unity 中使用报这个错误，你可以将其替换回来。

如果你想要拓展自己的属性绘制方法，直接继承 MaterialPropertyDrawer 就好。并不会造成冲突。如果想使用切换控件来控制自己属性的显示，你可以参考 PropertyGUI_Texture. cs 来看如何使用他

如果你想要学习这方面的知识，你可以直接查看代码，里面的注释我已经写的非常详细

**9. 工程**

*   暂时放在了网盘里，注意这里不会及时更新，建议去 github 下载最新版本

链接：[https://pan.baidu.com/s/17-vVMD4tY8x554T8NumquQ](https://pan.baidu.com/s/17-vVMD4tY8x554T8NumquQ)

提取码：7cyz

*   工程更新到了我的 Github

[https://github.com/Straw1997/UnityCustomShaderGUI](https://github.com/Straw1997/UnityCustomShaderGUI)

*   unitypackage 下载地址

[Releases · Straw1997/UnityCustomShaderGUI](https://github.com/Straw1997/UnityCustomShaderGUI/releases)

**10. 参考**

*   [喵刀 Hime：LWGUI：不写一行 GUI 自定义 Unity ShaderGUI](https://zhuanlan.zhihu.com/p/129289103)
*   [unity3d-jp/UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)
*   [喵喵 Mya：[自定义 shader 面板] 在 SceneView 中绘制一个控制灯光方向的操纵杆]( https://zhuanlan.zhihu.com/p/97256929 )
*   [喵喵 Mya：Shader 面板上常用的一些内置 Enum](https://zhuanlan.zhihu.com/p/93194054)
*   [Unity Shader GUI 学习](https://blog.csdn.net/enk_2/article/details/109236874)
*   [Unity3D 研究院编辑器之创建 Lua 脚本模板（十六） | 雨松 MOMO 程序研究院](https://www.xuanyusong.com/archives/3732)