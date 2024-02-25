---
title: 《Unity Primer》
aliases: []
tags: []
create_time: 2023-06-02 22:33
uid: 202306022233
banner: "[[Pasted image 20230602223746.png]]"
---


# 零、工作原理
## 反射机制

> [!NOTE] 反射
> 1. 程序正在运行时，可以查看其它程序集或者自身的元数据。一个运行的程序查看本身或者其它程序的元数据的行为就叫做反射
> 2. 在程序运行时，通过反射可以得到其它程序集或者自己程序集中代码的各种信息，比如类，函数，变量，对象等等我们可以实例化它们，执行它们，操作它们

**Unity 开发的本质就是在 Unity 引擎的基础上，利用反射和引擎提供的各种功能进行的拓展开发。**

**场景中对象的本质是什么？**
GameObject 类对象是 Unity 引擎提供给我们的，作为场景中所有对象的根本。
在游戏场景中出现一个对象，不管是图片、模型、音效、摄像机等等都是依附于 GameObject 对象。
拟人化记忆: GameObject 就是没有剧本的演员。

除了 **Transform** 这个表示位置的**标配脚本**外，我们可以为这个演员 (GameObject）关联各种剧本（脚本 )，让它按照我们剧本中 (代码逻辑中)的命令来处理事情
**而为演员添加剧本的这个过程，就是在利用反射 new 一个新的剧本对象和演员 (GameObject)对象进行关联，让其按我们的命令做事。**
![[Pasted image 20230603122307.png]]


Unity 场景文件（. unity）它的本质就是一个配置文件
Unity 有一套自己识别处理它的机制，本质就是把场景对象相关信息读取出来，通过反射来创建各个对象关联各个脚本对象
![[Pasted image 20230603123624.png|650]]

## 预制体（Prefab）和资源包导入导出
预制体和资源包用于保存数据，方便数据管理，如果更改预制资源，则任何场景中的所有预制资源实例都将以相同的方式更改。
在播放模式下，预制体和实例之间的关系已断开。

# 一、脚本基础
## 1 创建规则
 1. 类名和文件名必须一致, 不然不能挂载 (因为反射机制创建对象，会通过文件名去找 Type)
 2. 建议不要使用中文名命名
 3. 没有特殊需求不用管命名空间
 4. 创建的脚本默认继承 MonoBehavior

默认脚本内容路径：`Editor\DataResources\ScriptTemplates`

7. 脚本之间的关系：
![[Pasted image 20230604101859.png|700]]

![[Pasted image 20230604101922.png]]
## 2 特性
特性可以组合在一个 `[]` 中，逗号分隔

`[ExecuteAlways]`：令脚本在编辑模式下运行
`[RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]`：自动添加需要的组件作为依赖项。
`[CreateAssetMenu (menuName ="Rendering/CreateCustomRenderPipeline")]`：该标签会让你在 Project 下右键->Create 菜单中添加一个新的子菜单
`[DisallowMultipleComponent]`：不允许在一个对象上挂相同组件
## 3 Inspector 窗口
### 可编辑的变量

> [!NOTE] 
> 1. Inspector 窗口中的变量关联的就是对象的成员变量，运行时改变他们就是在改变成员变量 
>2. 拖拽到 Gameobject 对象后，再改变脚本代码中变量默认值，界面上不会改变 
>3. 运行中修改的信息不会保存

 1. Inspector 显示的可编辑内容就是脚本的成员变量

2. **public 成员变量可直接显示编辑**
   加上特性 `[HideInInspector]` 后不可显示编辑
```cs
[HideInInspector]  
public int i;
```

1. **private 和 protected 成员变量无法显示和编辑**
   加上**强制序列化字段特性 `[serializeField]`** 后可以编辑。所谓序列化就是把一个对象保存到一个文件或数据库字段中去。
```cs
[SerializeField]
private int z;
```

> [!NOTE] 序列化与反序列化
>1. 序列化是将对象转换为二进制流的过程。把内存中的数据（类的对象数据）存储到硬盘上。
>2. 反序列化是将二进制流转换为对象的过程。把硬盘上的数据读取到内存（类的对象数据）中
>3. 序列化主要解决对象的传输问题。

4. 大部分类型都能显示编辑，**不支持字典 Dictionary 和自定义类类型变量。**
加上序列化 `[Serializable]` 特性后可以显示自定义类类型
```cs
[Serializable]
public class Person
{
    public int age;
    public string name;
}
```

### 窗口排版
1. 分组说明特性 Header：为成员分组
`[Header ("分组说明")]`

```cs
 [Header("基础属性")] 
public int age;
public string name;

[Header("进阶属性")]
public float height;
public float weight;
```
![[Pasted image 20230603143748.png]]

2. 鼠标悬停注释 Tooltip ：为变量添加说明
`Tooltip (“说明内容")]

 3. 间隔特性 Space：让两个字段间出现间隔
`[Space ()]`

4. 修饰数值的滑条范围 Range
   `[Range (最小值, 最大值)]`

5. 多行显示字符串，默认不写参数显示 3 行，写参数就是对应行
`[Multiline (行数)]`

6. 滚动条显示多行 字符串，默认不写参数就是超过 3 行显示滚动条
`[TextArea (3，4)]`：最少显示 3 行，最多 4 行，超过 4 行就显示滚动条

7. 为变量添加快捷方法 contextMenuItem 
   - 参数 1 显示按钮名
   - 参数 2 方法名不能有参数
   `[contextMenuItem ("显示按钮名"，“方法名")]`
```cs
[ContextMenuItem("重置钱","ResetMoney")]
public int money;

private void ResetMoney()
{
    money = 0;
}
```
 右键可以查看方法：  ![[Pasted image 20230603144613.png]]

8. 为方法添加特性能够在 Inspector 中执行 ContextMenu
   `[ContextMenu ("测试函数")]`
```cs
[ContextMenu("哈哈哈哈")]
private void TestFun()
{
   print("哈哈哈哈");
}
```
在脚本上可以调用该方法：
![[Pasted image 20230603144922.png]]

## 4 生命周期函数
游戏的本质就是一个死循环（Tick），每一次循环处理游戏逻辑就会更新一次画面，一帧就是执行一次循环。
Unity 底层已经帮助我们做好了死循环，我们需要学习 Unity 的生命周期函数，利用它做好的规则来执行我们的游戏逻辑就行了。

> [!NOTE] 生命周期函数的概念
> - 所有继承 MonoBehavior 的脚本最终都会挂载到 Gameobject 游戏对象上
> - 生命周期函数就是该脚本对象依附的 Gameobject 对象从出生到消亡整个生命周期中会**通过反射自动调用的一些特殊函数**
>- Unity 帮助我们记录了一个 Gameobject 对象依附了哪些脚本，会自动的得到这些对象，通过反射去执行生命周期函数
>- 生命周期函数并不是 MonoBehavio 基类中的成员，Unity 帮助我们记录了场景上的所有 GameObjgct 对象以及各个关联的脚本对象，在游戏执行的特定时机 (对象创建时，失活激活时，帧更新时)它会通过函数名反射得到脚本对象中对应的生命周期函数，然后再这些特定时机执行他们

- 生命周期函数的访问修饰符一般为 private 和 protected（默认为private）
- 因为不需要再外部自己调用生命周期函数都是 Unity 自己帮助我们调用的 
- 支持继承多态

>常用的生命周期函数：
![[Pasted image 20230603132450.png]] 
```cs
//当对象(自己找个类对象)被创建时，才会调用该生命周期函数
//类似构造函数，一个对象只会调用一次
void Awake()

//依附的GameObject对象每次激活时调用（打勾）
//想要当一个对象被激活时进行一些逻辑处理,就可以写在这个函数
void OnEnable()

// 对象Awake后，第一次帧更新之前调用，一个对象只会调用一次
void Start()

//进行物理帧更新  
//固定间隔执行，间隔时间可以设置  
void FixedUpdate()C

// 逻辑帧执行，每帧执行
// 处理游戏核心逻辑更新
void Update()

// 每帧执行，于Update之后执行（速度相同）
//一般用来处理摄像机位置更新相关内容的
//Update和LateUpdate之间，Unity会处理动画相关的更新，如果将摄像机放在Update中更新，可能会造成渲染上的问题
void LateUpdate()

//依附的GameObject对象每次失活时调用（去掉勾）
//想要当一个对象失活时进行一些逻辑处理,就可以写在这个函数
void OnDisable()

//当对象被销毁时调用(衣服的GameObject对象被删除时调用)
//一般用来做一些资源的释放
void OnDestroy()
```

**激活对象**：![[Pasted image 20230603133828.png]]
`
**设置物理帧固定时间步长：**
![[Pasted image 20230603134654.png]]

## 5 随机数

Unity 当中的 Random 类和 cs 中的 Random 类不同。
使用 cs 自带随机数加上 System. 就可以  

```cs title:Unity中的随机数
//随机数 int 重载规则是左包含，右不包含 [)
int randomNum = Random.Range(0, 100);

//float 重载规则是左右都包含 []
float randomNum = Random.Range(0.0f, 100.0f);
```

```cs title:cs中的随机数
System.Random r = new System.Random();  
r.Next(); //生成一个非负的随机数  
r.Next(100); //生成[0,99)的随机数 
```

## 6 委托/事件
[[《CS Primer》#八、委托 delegate]] 
Unity 的委托和 cs 的 Action 委托使用方法类似
```cs title:Unity自带委托
UnityAction ac1 = () => { print("test1"); };  //无参无返回值  
  
UnityAction<string> ac2 = (str) => { print("test2");};//有参无返回值
```

使用 cs 自带委托加上 System. 就可以  
```cs title:cs自带委托  
System.Action ac1 = () => { print("test1"); }; //无参无返回值  
System.Action<int,float> ac2 = (i,f)=> { print("test2"); };//有参无返回值  
  
System.Func<string> ac3 = () => { return "test3"; };//无参有返回值  
System.Func<int, float, string> ac4 = (i, f) => { return "test3"; };//有参有返回值
```

事件：和 cs 一样
```cs title:事件
public event UnityAction clickEvent;
```

自定义事件类继承 `UnityEvent`：
```cs
[Serializable]  
public class EventVector3 : UnityEvent<Vector3>  //<Vector3> 是该事件的参数
{  

}
```
![[Pasted image 20230725105715.png]]
## 7 数学 Mathf 

Math 是中封装好的用于数学计算的工具**类**，位于 system 命名空间中
**Mathf** 是 unity 中封装好的用于数学计算的工具**结构体**，位于 UnityEngine 命名空间中，Mathf 更适合游戏开发，功能更多

### 常用运算函数
`PI`
`Abs` 取绝对值
`CeilToInt`  向上取整
`FloorToInt` 向下取整
`RoundToInt` 四舍五入
`Clamp` 钳制
`Max` 最大值
`Min` 最小值
`Pow` 幂
`Sqrt` 平方根
`IsPowerOfTwo` 判断一个数是否是 2 的 n 次方
`Sign` 判断正负数，返回 1/-1

`Lerp` 线性插值
`Vector3.SLerp` 球形插值
```cs lerp
//Lerp原理
result = （1-t）start + t * end; //t为插值系数，取值范围为0~1

//用法
result  = Mathf.Lerp(start,end,t);

//每帧改变 start 的值—变化速度先快后慢，位置无限接近，但是不会得到 end 位置 
start = Mathf.Lerp ( start，10，Time.deltaTime);

//每帧改变 t 的值—变化速度匀速，位置每帧接近，当 t>=1 时，得到结果
time += Time.deltaTime;
result = Mathf.Lerp(start,10,time);

//用Slerp，让物体围绕一个点旋转
C.position = Vector3.slerp(Vector3.right * 10，Vector3.forward * 10,time);

```
### 三角函数
```cs
//弧度转角度  
float radian = Mathf.PI;  
float angle = radian * Mathf.Rad2Deg; //Deg:degree 度  
  
//角度转弧度  
radian = angle * Mathf.Deg2Rad;


//Mathf中的三角函数，传入的参数需要是弧度
float sinValue = Mathf.Sin(30 * Mathf.Deg2Rad); //注意角度转成弧度

//反三角函数得到的结果也是弧度
float arcSinValue = Mathf.Asin(0.5f);
```

### 向量
```cs title:Vector3
//Vector3的初始化
Vector3 v1 = new Vector3();
v1.x = 10;
v1.y = 10;
v1.z = 10;

Vector3 v2 = new Vector3(10, 10, 10);

//对应世界空间位置
Vector3 v3 = Vector3.zero; // (0, 0, 0)
Vector3 v4 = Vector3.one; // (1, 1, 1)
Vector3 v5 = Vector3.right; // (1, 0, 0)
Vector3 v6 = Vector3.left; // (-1, 0, 0)
Vector3 v7 = Vector3.up; // (0, 1, 0)
Vector3 v8 = Vector3.down; // (0, -1, 0)
Vector3 v9 = Vector3.forward; // (0, 0, 1)
Vector3 v10 = Vector3.back; // (0, 0, -1)

//计算点之间的距离
Vector3.Distance(v1, v2);

//向量模长
v1.magnitude

//单位向量
v1.normalized

//点乘
Vector3.Dot  //gameplay中点乘可以用来判断目标物体的前后方向
//叉乘
Vector3.Cross //gameplay中点乘可以用来得到两个向量之间的左右位置关系

//线性插值
Vector3.Lerp
//球形插值
Vector3.SLerp 

```
![[Pasted image 20230610205842.png|700]]
### 欧拉角
[[01 三维旋转#欧拉角]]

**一共有 3 种欧拉角：俯仰角 (Pitch)、偏航角 (Yaw)和滚转角 (Roll)**
inspector 界面上显示的 Rotation 的 XYZ 值都是欧拉角
Untiy 欧拉角常用顺规：YXZ（Yaw-pitch-Roll）

**使用欧拉角的两个缺点：**
1. 同一旋转表示不唯一，即欧拉角绕一个轴旋转 90° 和 450°结果是一样的
2. X 轴达到 90 度时会产生万向节死锁
**使用四元数可以解决这两个问题，四元数的旋转转换为欧拉角后可以发现对应的欧拉角范围为（-180~180），不会出现欧拉角的缺点一。**
### 四元数
[[01 三维旋转#四元数]]
**四元数构成**
一个四元数包含一个标量和一个 3D 向量 $[ v,w]$
其中 $v$  为 3D 向量, $w$ 为标量，即 $[(x, y, z),w]$

**对于给定的任意一个四元数: 表示 3D 空间中的一个旋转量**

> [!NOTE] 轴-角对
> 在 3D 空间中，任意旋转都可以表示绕着某个轴旋转一个旋转角得到
> 注意: 该轴是**局部空间**中的**任意一个轴**

对于给定旋转，假设为绕着 $n$ 轴，旋转$β$度，$n$ 轴为$(x, y, z)$那么可以构成四元数为
四元数 $Q= [\sin (β/2)*n,\cos (β/2)]$
四元数 $Q= [ \sin (β/2) *x, \sin (β/2) *y, \sin (β/2) *z,\cos (β/2)]$
**四元数 $Q$ 则表示绕着轴 $n$，旋转$β$度的旋转量**

#### Unity 中的四元数
```cs title:Unity中的四元数初始化方法
//方法一：
//绕轴（3，4，5）旋转30度，注意要转弧度
Quaternion q = new Quaternion(Mathf.Sin(30/2 * Mathf.Deg2Rad)*3, Mathf.Sin(30/2 * Mathf.Deg2Rad)*4, Mathf.Sin(30/2 * Mathf.Deg2Rad)*5,Mathf.Cos(30/2 * Mathf.Deg2Rad));  

//方法二：更方便！推荐！
//绕轴（3，4，5）旋转30度  
Quaternion q2 = Quaternion.AngleAxis(30, new Vector3(3,4,5));

//创建一个立方体  
GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);  
obj.transform.rotation = q;  //结果可直接赋给rotation

```

> [!warning] 
> 我们一般不会直接通过四元数的 w, x, y, z 进行修改，直接赋值给 `.transform.rotation` 即可 

#### 四元数/欧拉角转换
```cs
//欧拉角转四元数
Quaternion.Euler(x,y,z)

//四元数转欧拉角
Quaternion q;
q.eulerAngles
```
#### 四元数常用方法
##### 单位四元数
单位四元数表示没有旋转量（角位移）
当角度为 0 或者 360 度时对于给定轴都会得到单位四元数
$[(0, 0,0),1]$ 和 $[(0, 0, 0),1]$ 都是单位四元数，表示没有旋转量
```cs
//将rotation改为了（0，0，0）
obj.transform.rotation = Quaternion.identity; 

//创建一个位置和角度都为0的对象
GameObject objClone = Instantiate(obj, Vector3.zero, Quaternion.identity);
```

##### 四元数插值
四元数中同样提供如同 Vector3 的插值运算 `Lerp` 和 `Slerp`
在四元数中 `Lerp` 和 `Slerp` 只有一些细微差别由于算法不同
- `Slerp` 的效果会好一些
- `Lerp` 的效果相比 `Slerp` 更快但是如果，旋转范围较大则效果较差，所以**建议使用 Slerp 进行插值运算**
```cs
public Transform target;  //目标位置
public Transform A;  
public Transform B;  
public Quaternion start;  
  
public float time;  
void Start()  
{  
    start = B.transform.rotation;  
}  
  
void Update()  
{  
    //无限接近目标的旋转状态，先快后慢  
    A.transform.rotation = Quaternion.Slerp(A.transform.rotation, target.rotation, Time.deltaTime);  
    print(Time.deltaTime);  
  
    //匀速变化，time>=1到达目标  
    time += Time.deltaTime;  
    B.transform.rotation = Quaternion.Slerp(start, target.rotation, time);  
}
```

##### 向量方向转四元数
`LookRoataion` 方法可以将传入的**面朝向量**转换为对应的四元数角度信息

举例: 当人物面朝向（图中 A 的面朝向上方）想要改变时，只需要把目标面朝向（$\vec{AB}$）传入该函数，便可以得到目标四元数角度信息，之后将人物四元数角度信息改为得到的信息即可完成到转向。
![[Pasted image 20230610221358.png]]
```cs
//A看向B
Quaternion q = Quaternion.LookRotation(B.position - A.position);
A.rotation = q;
```

#### 四元数相乘
**四元数相乘代表旋转四元数**
```cs
 //绕y轴转30
 //注意旋转轴是局部空间的！
Quaternion q = Quaternion.AngleAxis(30,Vector3.up);
this.transform.rotation *= q;

//每帧绕 Vector3.forward 旋转 1 度
this.transform.rotation *= Quaternion.AngleAxis(1，Vector3.forward); 
```
#### 向量左乘四元数
**向量左乘四元数返回一个新向量**
可以将指定向量旋转对应四元数的旋转量，相当于**旋转向量**
```cs
Vector3 v = Vector3.forward;  
v = Quaternion.AngleAxis(45, Vector3.up) * v;
```

应用：比如在游戏中我们的技能向四周发射，只需要知道人物的面向向量，然后左乘四元数，就可以得到不同角度的向量。
## 8 坐标转换
### 坐标系
**世界坐标系**
```cs title:常用的世界空间坐标
this.transform.position;
this.transform.rotation;
this.transform.eulerAngles;
this.transform.lossyScale;
```

**局部坐标系**
```cs
//相对父对象的物体坐标系的位置本地坐标相对坐标T/
this.transform.localposition;
this.transform.localEulerAngles;
this.transform.localRotation;
this.transform.localscale;
//修改他们会是相对父对象物体坐标系的变化
```

**屏幕坐标系**
```cs
Input.mousePosition
Screen.width
Screen.height
```

**视口坐标系**
视口坐标系是与屏幕坐标系息息相关的，它是将 Game 视图的屏幕坐标系单位化，即左下角为 (0, 0)，右上角为 (1, 1)，z 轴坐标是相机的世界坐标中 z 轴坐标的负值。
注意这和观察坐标系（以摄像机为原点）不同！

### 局部/世界
```cs title:世界坐标转局部坐标
//世界坐标系的点转换为局部坐标系点（会受缩放影响）
//上图中的P即为Vector3.forward
this.transform.InverseTransformPoint(Vector3.forward);

//世界坐标系的向量转换为局部坐标系的向量
//不受缩放影响
this.transform.InverseTransformDirection(Vector3.forward);
//受缩放影响
this.transform.InverseTransformVector(Vector3.forward);
```
以下是从正 Y 轴向下看的视角，中间有一个 Cube 模型

![[Diagram.svg]]

世界坐标系的点 P (0，0，1)转换到局部空间，则 P 点坐标的 x，z 在局部空间为负数。
世界坐标系的向量 P（0，0，1）转换为局部空间，将左边的向量平移到右边，可以观察到该方向向量的 x 为负数，z 为证书

```cs title:局部坐标转世界坐标
//⭐点（受缩放影响）
print(this.transform.TransformPoint(Vector3.forward));  

//向量
//不受缩放影响
print(this.transform.TransformDirection(Vector3.forward));
//受缩放影响
print(this.transform.TransformDirection(Vector3.up));
```
其中**最重要的就是局部坐标系的点转世界坐标系的点**
比如现在玩家要在自己面前的 n 个单位前放一团火，这个时候我不用关心世界坐标系
通过相对于本地坐标系的位置转换为世界坐标系的点，进行特效的创建或者攻击范围的判断,

### 世界/屏幕

```cs title:坐标转换
//世界坐标转屏幕坐标
Vector3 screenPos = Camera.main.WorldToScreenPoint(this.transform.position);  //XY是屏幕坐标，Z轴是深度
print(screenPos);

//屏幕坐标转世界坐标
Vector3 worldPos = Camera.main.ScreenToWorldPoint(screenPos);
print(worldPos);
```

### 世界/视口
```cs
//世界坐标转视口坐标
Camera.main.worldToViewportPoint

//视口转世界
Camera.main.ViewportToworldPoint 
```

视口空间是标准化的、相对于摄像机的空间。视口左下角为 (0,0)，右上角为 (1,1)。z 位置为与摄像机的距离，采用世界单位。
### 视口/屏幕
```cs
//视口转屏幕
Camera.main.ViewportToScreenPoint

//屏幕转视口
Camera.main.screenToViewportPoint
```

# 二、重要组件和 API
## 0 MonoBehavior 基类
1. 创建的脚本默认都**继承 MonoBehaviour**，继承了它才能够挂载在 GameObject 
>当我们把脚本拖到 GameObject 上时，引擎会根据文件名通过反射得到对应的类，如果该类继承了 MonoBehaviour，则允许挂载。
2. 继承了 MonoBehavior 的脚本不能 new ，**只能挂载**！
3. 继承了 MonnBehavior 的脚本不要去写构造函数，因为我们不会去 new 它，写构造函数没有任何意义
4. 继承了 MonoBehavior 的脚本可以在一个对象上挂多个 (如果没有加 `DisallowMultipleComponent` 特性)
   ![[Pasted image 20230603130352.png]]
5. 继承 MonoBehavior 的类也可以再次被继承，遵循面向对象继承多态的规则

**不继承 MonoBehaviour 的类：**
1. 不能挂载在 GameObject 上
2. 想怎么写怎么写，如果要使用需要自己 new
3. **一般是单例模式的类（用于管理模块）或者数据结构类（ 用于存储数据）**
4. 不用保留默认出现的几个函数

> [!info] this
> this 代表脚本对象
> this.gameobject 代表脚本挂载的 GameObject 
> this.transform 代表脚本挂载的 GameObject 的位置信息
> 等价写法：this. gameobject.transform

### 调试打印
在 Unity 中打印信息的两种方式
```cs title:打印
//1.没有继承MonoBehaviour的类的时候，可以使用Debug.Log
Debug.Log("Awake Hello!");
Debug.LogError("Awake Error");
Debug.LogWarning("Awake Warning");  
//2. 继承了MonoBehaviour的类，可以使用线程方法print
print("Awake Hello!");
```

```cs title:调试画线
//画线段
//前两个参数为起点、终点
//向前方画一条线段：
Debug.DrawLine(this.transform.position,
               this.transform.position + this.transform.forward,
               Color.red);

//画射线
//前两个参数为起点、方向
Debug.DrawRay(this.transform.position,
               this.transform.forward,
               Color.red);
```


### 获取脚本挂载的对象
1. 获取依附的 Gameobject
2. 获取依附的 Gameobject 的位置信息
3. 获取脚本是否激活
```cs
public TestScript testScript;  //其他脚本
 
void Start()
{
    //1. 获取依附的GameObject
    print(this.gameObject.name);
    
    //2. 获取依附的GameObject的位置信息
    //得到对象位置信息
    print(this.transform.position);  //位置
    print(this.transform.eulerAngles);  //角度
    print(this.transform.lossyScale);  //缩放大小
    //等价写法：this.gameObject.transform
    
    //3. 获取脚本是否激活
    this.enabled = true;   //激活脚本
    this.enabled = false;  //禁用脚本
    
    //获取别的脚本对象依附的gameobject和transfrom位置信息
    print(testScript.gameObject.name);
    print(testScript.transform.position);
}
```

### 获取对象挂载的脚本
如何得到依附的 GameObject 对象上挂载的其它脚本?

1. **得到 GameObject 挂载的单个脚本**
```cs title:得到自己挂载的单个脚本 h:8
//根据脚本名获取，较少使用
TestScript t1 = this.GetComponent("TestScript") as TestScript; 

//根据Type获取
TestScript t2 = this.GetComponent(typeof(TestScript)) as TestScript;

//⭐根据泛型获取，建议使用，不用as
TestScript t3 = this.GetComponent<TestScript>();

//只要你能得到场景中对象或者对象依附的脚本，那你就可以获取到它所有信息
```

**安全的获取脚本**，加一个判断：
```cs
//方法一：
MyScript s1 = this.GetComponent<MyScript>();
if (s1 != null)
{
    s1.dosomething();
}

//方法二：
MyScript s2;
if(this.TryGetComponent<MyScript>(out s2))
{
    s2.dosomething();

//等价，这样写更简便
if(this.TryGetComponent<MyScript>(out MyScript s2))
{
    s2.dosomething();
}
```

2. **得到 GameObject 挂载的多个脚本** (不常用，通常我们不会将同一个脚本挂载两次在同一个 GameObject 上)
```cs
//方法一
MyScript[] scripts = this.GetComponents<MyScript>();

//方法二
List<MyScript> scriptList = new List<MyScript>(); //定义一个存放MyScript类型的List
this.GetComponents<MyScript>(scriptList); //将找到的结果存在List中
```

3. **得到 GameObject 子孙对象挂载的脚本**（默认会先找本 GameObject 对象是否挂载该脚本）
```cs
//得到子孙对象挂载的单个脚本：
MyScript s1 = this.GetComponentInChildren<MyScript>(); //如果脚本失活，则无法找到
MyScript s2 = this.GetComponentInChildren<MyScript>(true); //true表示即使脚本失活，也可以找到

//得到子孙对象挂载的多个脚本：
//方法一：
MyScript[] ss1 =  this.GetComponentsInChildren<MyScript>(true); 
//方法二：
List<MyScript> ss2 = new List<MyScript>();
this.GetComponentsInChildren<MyScript>(true, ss2);
```

4. **得到 GameObject 长辈（包括父，爷爷...）对象挂载的脚本**（默认会先找本 GameObject 对象是否挂载该脚本）
```cs
//得到单个脚本
MyScript s3 = this.GetComponentInParent<MyScript>();

//得到多个脚本
MyScript[] ss3 = this.GetComponentsInParent<MyScript>(true);
```

### 延迟函数
延迟函数就是**会延时执行的函数**，是 MonoBehaviour 基类中实现好的方法
我们可以**自己设定延时要执行的函数**和具体**延时的时间**

**`Invoke` 延迟执行函数**
参数一: 函数名字符串
参数二: 延迟时间以秒为单位

**`InvokeRepeating` 延迟重复执行函数**
参数一: 函数名字符串
参数二: 第一次执行的延迟时间
参数三: 之后每次执行的间隔时间

**注意:**
1. 延迟函数第一个参数传入的是函数名字符串
2. 延迟函数**不能直接执行有参数的函数（无法传参）**，可以包裹一层来执行（即在一个延迟函数中调用目标有参函数）。
3. 函数名**必须是该脚本上申明的函数**，可以包裹一层来执行
4. 脚本依附对象**失活**，延迟函数**可以继续执行**
5. 脚本依附对象**销毁**或者脚本移除，延迟函数**无法继续执行**
6. 可以配合 OnEnable 和 OnDIsable 生命周期函数使用

```cs
void Start()
{
    Invoke("TestFunc", 5.0f);
}

public void TestFunc()
{
    print("延时执行");
    
    paramFunc(2); //通过包裹一层来延迟执行paramFunc函数
}

public void paramFunc(int i)
{
    print("参数为" + i);
}

//5s后输出
//延时执行
//参数为2
```

配合周期函数使用：
```cs
private void QnEnable()
{
    //对象激活的生命周期函数中开启延迟(重复执行的延迟)
}

private void QnDisable()
{
    //对象失活的生命周期函数中停止延迟
}

```

**取消延迟函数**
1. 取消该脚本上所有延迟函数 `CancelInVoke()`
2. 取消指定延迟函数 `CancelInVoke("函数名")`

**判断是否有延迟函数**
`if(IsInVoking())`：针对所有延迟函数
`if(IsInVoking("函数名"))`：针对指定延迟函数


## 1 Object 类
**Object 是 Gameobject 的父类** 
- unity 里面的 Object 不是指的 cs 中的万物之父 object（cs 中的 object 命名空间是 system ）
- unity 里的 Object 命名空间是 UnityEngine ，也是继承万物之父的一个自定义类
## 2 GameObject 类
### 成员变量
```cs
//名字
print(this.gameObject.name);

//是否激活
print(this.gameObject.activeSelf);

//static
print(this.gameObject.isStatic);

//层级
print(this.gameObject.layer);

//标签
print(this.gameObject.tag);

//transform
print(this.transform.position);
```

### 静态方法

> [!warning] 
> 如果是继承 MonoBehaviour 的类，可以不加 `.GameObject` 前缀

#### 查找对象
得到某一个单个对象目前有 2 种方式
1. 是 public 从外部面板拖进行关联（推荐）
2.  通过 API 去找

以下方法通过 API 去找：
- 只能找到被激活的对象
- 如果场景中存在多个满足条件的对象 (比如同名、同 tag)，无法准确找到是谁

```cs
//创建几何体
//只要得到了一个Gameobject 对象我就可以得到它身上挂在的任何脚本信息
//通过obj.GetComponent来得到脚本信息
GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
obj.name = "球体";
obj.tag = "Player";

//1 查找单个对象
//通过对象名查找，效率低，需要遍历所有对象
GameObject obj2 = GameObject.Find("球体");
if (obj2 != null)
{
    print(obj2);
}

//通过tag查找象，需要遍历所有对象
GameObject obj3 = GameObject.FindWithTag("Player");
if (obj3 != null)
{
    print(obj3);
}

//找到场景中挂载的某一个脚本对象 ，效率太低，需要遍历所有对象，还要便利对象上挂载的脚本 
TestScript ts = GameObject.FindObjectOfType<TestScript>();

//2.查找多个对象（只能通过tag）
GameObject[] objs = GameObject.FindGameObjectsWithTag("Player");
```

#### 实例化对象（Clone）
实例化对象 (克隆对象)的方法
作用：根据一个对象创建出一个和它一模一样的对象
```cs
//准备克隆的GameObject
public GameObject obj;
void Start()
{
    //准备用来克隆的对象
    //1.直接是场景上的某个对象
    //2.可以是一个预设体对象
    GameObject objClone = GameObject.Instantiate(obj);
}
```

- 在调用 Instantiate()方法创建对象时，**接收 Instantiate()方法返回值的变量类型必须和传入参数的类型一致**，否则接收变量的值会为 null.
- 这是一个重载函数，支持任何 Object 类及其子类，可以传多个参数来设置初始的位置和父对象

#### 删除对象
`Destroy` 方法不会马上移除对象，一般情况下它会在下一帧时把这个对象移除并从内存中移除

```cs
//删除GameObject对象 
GameObject.Destroy(obj, 5);  //第二个参数可选，表示延迟几秒删除

//删除脚本对象
GameObject.Destroy(this);

//立即移除
//如果没有特殊需求，不用该方法，因为该方法不是异步的，可能会卡顿
GameObject.DestroyImmediate(obj);

//过场景不移除
//默认情况在切换场景时场景中对象都会被自动删除掉
//如果你希望某个对象过场景不被移除就使用该方法
//一般都是传依附的Gameobject对象
//比如下面这句代码的意思就是自己依附的Gameobject对象过场景不被删除
GameObject.DontDestroyOnLoad(this.gameObject);
```

### 成员方法

#### 创建GameObject
```cs
//创建空GameObject
GameObject obj1 = new GameObject(); //默认名字New Game Object
GameObject obj2 = new GameObject("物体"); //自定义名字
GameObject obj3 = new GameObject("物体", typeof(TestScript)); //自定义名字，添加脚本，可以添加多个
```

#### 添加/获取脚本
```cs
//为对象添加脚本
//继承MonoBehaviour的脚本是无法new的
//如果给GameObject对象动态添加继承MonoBehaviour的脚本，需要使用AddComponent方法
TestScript ts1 = obj1.AddComponent(typeof(TestScript)) as TestScript;
//⭐用泛型更方便，推荐！
TestScript script = obj1.AddComponent<TestScript>();
//通过返回值，可以得到脚本的信息，来进行一些处理

//获取脚本
TestScript ts2 = obj1.GetComponent<TestScript>();
```

#### 标签比较
```cs
 //标签比较
if (this.gameObject.CompareTag("Player"))
{
    
}
//显式字符串比较效率低下，建议改用‘CompareTag'
if (this.gameObject.tag == "Player")
{
}
```
#### 激活失活
```cs
 //设置激活失活
 obj1.SetActive(false);
```

#### 发送消息
以下方法不建议使用，效率比较低

通过广播或者发送消息的形式，让自己或者别人执行某些行为
```cs
void Start()
{
    //通知自己执行什么行为
    //命令自己去执行这个Test这个函数 会在自己身上挂载的所有脚本去找这个名字的函数
    //它会去找到自己身上所有的脚本有这个名字的函数去执行
    this.gameObject.SendMessage("TestFunc");
    this.gameObject.SendMessage("TestFunc1",10); //第二个参数可以传参
    
    //广播，让自己和自己的子对象执行函数
    this.gameObject.BroadcastMessage("TestFunc");
    
    //向父对象和自己发送消息并执行
    this.gameObject.SendMessageUpwards("TestFunc");
}

void TestFunc()
{
    print("Hello World!");
}

void TestFunc1(int i)
{
    print("Hello World!"+i);
}
```

## 3 Time 类
```cs title:游戏时间
void Update()
{
    //时间缩放比例 
    Time.timeScale = 0; //时间停止
    Time.timeScale = 1; //时间正常
    Time.timeScale = 2; //2倍速 
    
    //帧间隔时间（最近的两帧之间的时间间隔）主要用于计算位移
    //路程=速度*时间
    //受Scale影响的帧间隔时间
    print(Time.deltaTime);   //如果希望游戏暂停时就不动的，就是用deltaTime
    //不受Scale影响的帧间隔时间
    print(Time.unscaledDeltaTime); //如果希望游戏暂停时还能动的，就是用unscaledDeltaTime
    
    //游戏开始到现在的时间
    //受Scale影响
    print(Time.time);
    //不受Scale影响
    print(Time.unscaledTime);
    
    //游戏开始到现在跑了多少帧
    print(Time.frameCount);
}
```

```cs title:物理时间
private void FixedUpdate()
{
    //物理帧间隔时间
    //受Scale影响
    print(Time.fixedTime);
    
    //不受Scale影响
    print(Time.fixedUnscaledTime);
}
```

## 4 Transform 类
游戏对象（Gameobject）位移、旋转、缩放、父子关系、坐标转换等相关操作都由它处理，它是 unity 提供的极其重要的类
### Transform 和 GameObject 的区别

当我们使用 `Instantiate()` 创建 prefab 对象时，有如下两种方法，都可以创建出对象。区别在哪？
1. **使用 GameObject**![[Pasted image 20230723222136.png]]
```cs
//使用Gameobject
public class GameObjectTransformTesting : MonoBehaviour
{
    [serializeField] private Gameobject prefab;
    private void Update( ) 
    {
        if ( 工nput.GetKeyDown( Keycode.T)) 
        {
            Instantiate(prefab);
        }
    }
}

```
2. **使用 Transfrom**![[Pasted image 20230723222217.png]]
```cs
//使用Transform
public class GameObjectTransformTesting : MonoBehaviour
{
    [serializeField] private Transform prefab;
    private void Update( ) 
    {
        if ( 工nput.GetKeyDown( Keycode.T)) 
        {
            Instantiate(prefab);
        }
    }
}
```

注意：
1. 任何对象都必须有 Transform 组件
2. ⭐**我们可以使用 transform. gameobject 来获取 Gameobject 对象，也可以用 gameobject. transform 来获取 Transfrom 组件**
3. `Instantiate ()` 是泛型函数，参数填什么类型就返回什么类型 ![[Pasted image 20230723222635.png]]
**从第二点就可以看出来，它门可以相互转换，所以实际上用谁区别不大，都可以拿到我们想要的数据。**
通常我们会对对象进行位置变换，可以优先使用 Transfrom，这样就可以避免 gameobject. transfrom 这一步。
涉及对对象本身的设置，如激活、销毁，就优先用 gameobject。
```cs
public class GameObjectTransformTesting : MonoBehaviour
{
    [serializeField] private Transform prefab;
    //[serializeField] private Gameobject prefab;
    private void Update( ) 
    {
        if ( 工nput.GetKeyDown( Keycode.T)) 
        {
            Transform prefabTransform = Instantiate(prefab);
            //Gameobject prefabGameobject = Instantiate(prefab);
            prefabTransform.position = Vector3.zero;
            //prefabGameobject.transform.position = Vector3.zero;
            ...
        }
    }
}
```

### 位置
> [!NOTE] Inspector 面板上的 Transfrom 信息
> 对于父对象来说，positon 是世界空间位置
> 对于子对象来说，position 是相对于父对象的位置，即在父对象为原点的局部空间中位置
> 

```cs title:position
 //世界空间位置
print(this.transform.position);

//局部空间位置
print(this.transform.localPosition);

//position的赋值不能单独改变x,y,z，只能整体改变
//this.transform.position.x = 1; error！
this.transform.position = new Vector3(1, 1, 1);
this.transform.position = new Vector3(this.transform.position.x+100, this.transform.position.y, this.transform.position.z);

print(this.transform.forward); //局部空间的z轴方向，注意和Vector3.forward区分
print(this.transform.right);   //局部空间的x轴方向
print(this.transform.up);      //局部空间的y轴方向
```

> [!NOTE] 理解 this.transform.forward 和 Vector3.forward 的区别
> 现在新建一个物体，假设它的世界坐标系是这样的：（刚刚创建的物体本地坐标系也和世界坐标系重合）
> 
![[Pasted image 20230717115734.png]]
现在将物体绕 y 轴顺时针旋转一定角度。
![[Pasted image 20230717115742.png]]
**现在黑色坐标系是世界坐标系，红色坐标系是物体旋转后的本地坐标系**（因为是绕 y 轴转所以 y 轴不动，就不标红了）。
>
`this.transform.forward` 是指对象局部空间的朝向，即图中红 `Z`
`Vector3.forward` 是指向量 $(0,0,1)$，和图中黑 `Z` 方向一致
**这两个向量虽然指向的相对位置不同，但是得到的数值都是相对于世界坐标下的！**`this.transform.forward` 虽然是指对象局部空间的朝向，红 `Z` 在局部空间为 $(0,0,1)$，但我们得到的数值是转换到世界空间的数值！



### 位移
实现位移的四种方式：
![[Pasted image 20230605154644.png]]

需要联动 [[《Unity Primer》#5 Input 类]]
```cs title:位移 h:11,12
//理解坐标系下的位移计算公式
//路程–方向*速度*时间
//方式一：自己计算
//想要变化的就是 position
this.transform.position += this.transform.forward * (1 * Time.deltaTime);  //朝对象局部空间的z轴前进
this.transform.position += Vector3.forward * (1 * Time.deltaTime);  //朝世界空间Z轴前进

//方式二：API,一般使用前两种
//参数一:表示位移多少路程=方向*速度*时间
//参数二:表示相对哪个坐标系移动 ,默认该参数是自身局部空间Space.Self
this.transform.Translate(Vector3.forward*(1 * Time.deltaTime),Space.Self);  //始终朝向局部空间Z轴移动
this.transform.Translate(this.transform.forward*(1 * Time.deltaTime), Space.World); //始终朝向局部空间Z轴移动
this.transform.Translate(Vector3.forward*(1 * Time.deltaTime), Space.World); //始终朝向世界空间Z轴移动
this.transform.Translate(this.transform.forward(1 * Time.deltaTime), Space.Self);  //方向错误，因为this.transform.forward的值是世界空间下的，并不是(0,0,1)
```
### 角度和旋转
```cs title:角度
//和角度设置一样，不能单独设置x,y,z

//inspector界面上显示的Rotation是欧拉角
print(this.transform.eulerAngles); //该方法返回欧拉角,
print(this.transform.localEulerAngles);

print(this.transform.rotation);  //该方法返回四元数
print(this.transform.localRotation); 
```

```cs title:旋转
 void Update()
{
    //绕轴自转
    //方法一：
    //参数一：每帧旋转的角度
    //参数二：默认Space.Self
    this.transform.Rotate(new Vector3(0,10,0) * Time.deltaTime,Space.World);
    
    //方法二：
    //参数一：绕哪个轴旋转
    //参数二：是每帧转动的角度
    //参数三：默认Space.Self
    this.transform.Rotate(Vector3.up, 10 * Time.deltaTime, Space.World);
    this.transform.Rotate(Vector3.up, 10 * Time.deltaTime, Space.Self); 

    //绕点转
    //点，轴，旋转速度
    this.transform.RotateAround(Vector3.zero, Vector3.up, 10 * Time.deltaTime);
}
```

### 缩放和LookAt
```cs title:缩放
//相对世界坐标系的缩放大小只能得，不能改
print(this.transform.lossyScale); 

//相对局部坐标系(父对象)
this.transform.localScale  = new Vector3(1.0f, 1.0f, 1.0f);
//和角度设置一样，不能单独设置x,y,z

//Unity没有提供关于缩放的API，只能自己修改localScale
```

```cs title:LookAt
this.transform.LookAt(Vector3.zero); //看向点
this.transform.LookAt(obj); //看向一个对象，参数为对象的Transform
```

### 父子关系
#### 获取和设置父对象
```cs
//获取父对象
print(this.transform.parent.name);

//断绝父子关系
this.transform.parent = null;

//设置父对象
this.transform.parent = GameObject.Find("FatherObject").transform;

//通过API设置，差别主要是多了一个参数二
//参数一:我的父亲
//参数二:是否保留世界坐标的位置角度缩放信息
//true会保留世界，坐标下的状态和父对象进行计算得到本地坐标系的信息
//false不会保留，会直接把世界坐标系下的位置角度缩放直接赋值到本地坐标系下,通常会改变原位置
this.transform.SetParent(null); //断绝父子关系
this.transform.SetParent(GameObject.Find("FatherObject").transform,false); //设置父对象
this.transform.DetachChildren(); //和自己的所有儿子断绝关系，不会影响儿子和孙子的关系
```

#### 获取子对象
```cs
//按名字查找儿子
//只能找儿子，不能找孙子
//Find方法效率比GameObject.Find()高，前提要知道父亲是谁
//Find方法是能够找到失活的对象的! Gameobject相关的查找是不能找到失活对象的
print(this.transform.Find("Son").name);

print(this.transform.Find("Son/grandson").name);  //找到子对象的子对象

//遍历儿子
for (int i = 0; i < this.transform.childCount; i++) 
{
    //通过索引号找到特定的儿子
    print(this.transform.GetChild(i).name);
}
```

#### 儿子的操作
```cs
//判断是不是我的儿子
if (son.IsChildOf(this.transform))
{
}

//得到自己作为儿子的编号  sibling:兄弟姐妹
print(son.GetSiblingIndex());

//把自己设置为第一个儿子
son.SetAsFirstSibling();

//把自己设置为最后一个儿子
son.SetAsLastSibling();

//把自己设置为指定索引号的儿子，编号超出范围不会报错，自动设置会最后一个编号
son.SetSiblingIndex(5);

```

### 自定义拓展方法
1. 为 Transform 写一个**拓展方法**，可以将它的子对象按名字的长短进行排序改变他们的顺序名字短的在前面，名字长的在后面。
![[Pasted image 20230604162029.png]]
```cs title:tool.cs
//写一个Transfrom类的拓展方法
public static class Tools
{
    //为Transform添加一个拓展方法
    //可以将它的子对象按名字的长短进行排序改变他们的顺序，名字短的在前面，名字长的在后面
    public static void Sort(this Transform obj)
    {
        List<Transform> list = new List<Transform>();
        for (int i = 0; i < obj.childCount; i++) 
        {
            list.Add(obj.GetChild(i));
        }
        //这是根据名字长短进行排序利用的是list的排序
        list.Sort((a, b) =>
        {
            if(a.name.Length < b.name.Length)
                return -1;
            else if(a.name.Length > b.name.Length)
                return 1;
            else
                return 0;
        });
        
        //根据list中的排序结果重新设置每一个对象的索引编号
        for (int i = 0; i < list.Count; i++)
        {
            list[i].SetSiblingIndex(i);
        }
    }
}

//然后在父对象挂载的脚本中调用即可
void Start()
{
    this.transform.Sort();
} 
```

2. 请为 Transform 写一个拓展方法，传入一个名字查找子对象，即使是子对象的子对象也能查找到
```cs title:tool.cs
public static Transform CustomFind(this Transform father, string childName)
{
    //要找的子对象
    Transform target = null;
    //先从自己身上的子对象找
    target = father.Find(childName);
    if (target != null) 
        return target;
    
    //如果自己身上没有，就从自己的子对象的子对象找
    for (int i = 0; i < father.childCount; i++)
    {
        //递归
        target = father.GetChild(i).CustomFind(childName);
        if (target != null)
            return target;
    }

    return target;
}

//然后在父对象挂载的脚本中调用即可
print(this.transform.CustomFind("aaa").name);
```

## 5 Input 类
输入相关内容都写在 Update 中

### 鼠标键盘输入
```cs title:鼠标输入
//鼠标在屏幕上的位置
//屏幕坐标的原点是在屏幕的左下角，往右是x轴正方向，往上是Y轴正方向
//返回值是Vector3，但是只有x和y有值，z一直是0是，因为屏幕本来就是2D的不存在z轴
Input.mousePosition

//检测鼠标输入
//0左键 1右键 2中键

//按下Down
Input.GetMouseButtonDown(0)

//抬起Up
Input.GetMouseButtonUp(0)

//按住
Input.GetMouseButton(0)

//中键滚动
//它的返回值是（0，Y），返回值的Y -1往下滚  0没有滚  1往上滚
Input.mouseScrollDelta
```

```cs title:键盘输入
//键盘按下
//方法一(推荐)
Input.GetKeyDown(KeyCode.W) //本质上是按W时返回true


//方法二：传入字符串的重载
//只能传入小写字符串
Input.GetKeyDown("w")


//键盘抬起
Input.GetKeyUp(KeyCode.W)
    
//键盘按住
Input.GetKey(KeyCode.W)

```

```cs title:任意键
//任意键 按下
Input.anyKeyDown

//任意键 抬起
Input.anyKeyUp

//任意键 按下
Input.anyKey
```

### 默认轴输入
![[Pasted image 20230604213230.png]]
我们学习鼠标键盘输入主要是用来控制玩家，比如旋转位移等等，所以 unity 提供了更方便的方法来帮助我们控制对象的位移和旋转。
```cs title:默认轴输入
//鼠标AD按下时，返回-1到1之间的浮点值
//相当于得到这个值，就是我们的左右方向，用于控制左右移、旋转
Input.GetAxis("Horizontal")

//鼠标WS按下时，返回-1到1之间的浮点值
//相当于得到这个值，就是我们的上下方向，用于控制上下移、旋转
Input.GetAxis("Vertical")

//鼠标横向移动时，返回-1到1之间的浮点值
Input.GetAxis("Mouse X")

//鼠标纵向移动时，返回-1到1之间的浮点值
Input.GetAxis("Mouse Y")


//GetAxisRaw方法和GetAxis使用方式相同
//只不过它的返回值只会是-1,0,1不会有中间值
```

### 移动设备
```cs title:移动设备
//移动设备触摸相关
if (Input.touchCount > 0)
{
    Touch t1 = Input.touches[0];
    
    //位置
    print(t1.position);
    
    //相对上次位置的变化
    print(t1.deltaPosition);
}
//是否启用多点触控
Input.multiTouchEnabled = false;

//陀螺仪
//是否启用陀螺仪
Input.gyro.enabled = true;

//陀螺仪的旋转速度 
print(Input.gyro.rotationRate);

//陀螺仪的重力加速度向量
print(Input.gyro.gravity);

//陀螺仪 当前的旋转四元数
//比如用这个角度信息来控制场景上的一个3D物体受到重力影响
//手机怎么动它怎么动
print(Input.gyro.attitude);
```
### 手柄输入
```cs title:手柄输入
//得到连接的手柄的所有按钮名字
string[] strs = Input.GetJoystickNames();
        
//某一个手柄键按下
Input. GetButtonDown("Jump")
  
//某一个手柄键抬起
Input.GetButtonup("Jump"))

//某一个手柄键长按
Input.GetButton("Jump"))
```

## 6 Screen 类

### 静态属性
```cs
//当前设备屏幕分辨率
Resolution r = Screen.currentResolution;
print(r.width);
print(r.height);

//Game窗口宽高
print(Screen.width);
print(Screen.height);

//屏幕睡眠模式
Screen.sleepTimeout = SleepTimeout.NeverSleep;
Screen.sleepTimeout = SleepTimeout.SystemSetting;

//运行时是否全屏模式
Screen.fullScreen = true;

//窗口模式
//独占全屏FullscreenMode.ExclusiveFullscreen
//全屏窗口FullscreenMode.Fullscreenwindow
//最大化窗口FullscreenMode. Maximizedwindow
//窗口模式FullscreenMode.windowed
Screen.fullScreenMode = FullScreenMode.Windowed;

//移动设备屏幕转向相关
//允许自动旋转为左横向 Home键在左
Screen.autorotateToLandscapeLeft = true;
//允许自动旋转为右横向 Home键在右
Screen.autorotateToLandscapeRight = true;
//允许自动旋转到纵向 Home键在下
Screen.autorotateToPortrait = true;
//允许自动旋转到纵向倒着看 Home键在上
Screen.autorotateToPortraitUpsideDown = true;

//指定屏幕显示方向
Screen.orientation = ScreenOrientation.LandscapeLeft;
```
### 静态方法
```cs
//设置分辨率
Screen.SetResolution(1920, 1080, true); //第三个参数是是否全屏
```

## 8 场景
![[Pasted image 20230609131650.png|500]]

### 场景同步切换
```cs title:场景同步切换
//场景切换，指定的场景必须先在构建设置中加入
SceneManager.LoadScene("GameScene");
//旧版本代码
//Application.LoadIevel("GameScene");


//过场景不移除
//默认情况在切换场景时场景中对象都会被自动删除掉
//如果你希望某个对象过场景不被移除就使用该方法
//一般都是传依附的Gameobject对象
//比如下面这句代码的意思就是自己依附的Gameobject对象过场景不被删除
GameObject.DontDestroyOnLoad(this.gameObject);

//退出游戏
if( Input.GetKeyDown( Keycode.Escape) )
{
    //游戏打包后才起作用
    Application.Quit();
}

//当前场景判断
if (SceneManager.GetActiveScene().name == "StartMenu")  
{  
    //让开始面板显示  
    BeginPanel.Instance.ShowMe();  
}
```

### 场景异步切换
在切换场景时，Unity 会删除当前场景上所有对象，并且去加载下一个场景的相关信息
如果当前场景对象过多或者下一个场景对象过多，这个过程会非常的耗时会让玩家感受到卡顿，异步切换就是来解决该问题的，开一个子线程去加载，加载好后存入公共容器。

场景异步加载和资源异步加载几乎一致，有两种方式：
1. **通过事件回调函数异步加载**
```cs title:通过事件回调函数异步加载
private void Start()
{
    AsyncOperation ao =  SceneManager.LoadSceneAsync("Scenename");
    //当场景异步加载结束后就会自动调用该事件函数，我们如果希望在加载结束后做一些事情，那么就可以在该函数中，写处理逻辑
    
    //普通形式
    ao.completed += LoadOver;
    
    //等价，lambda表达式形式
    ao.completed += (a) =>
    {
       print("加载结束");
    };
}

private void LoadOver(AsyncOperation ao)
{
    print("加载结束");
}
```


2. **通过协程异步加载**
需要注意的是加载场景会把当前场景没有特别处理的对象都删除了，所以协程中的部分逻辑可能是执行不了的
解决思路：使用 `GameObject.DontDestroyOnLoad()` 方法让处理场景加载的脚本依附的对象过场景时不被移除
```cs
 private void Start()
{
    GameObject.DontDestroyOnLoad(this.gameObject);
    
    StartCoroutine(LoadScene("Scenename"));
}

IEnumerator LoadScene(string sceneName)
{
    //异步加载场景
    AsyncOperation ao = SceneManager.LoadSceneAsync(sceneName);
    
    GameObject.DontDestroyOnLoad(this.gameObject);
    
    yield return ao; //Unity自己知道该返回值意味着你在异步加载资源
    //Unity 会自己判断该场景是否加载完毕了,加载完毕过后才会继续执行后面的代码
    
    //加载完毕后执行其他逻辑
    print("加载结束"); //无法执行，因为切换场景后，上一场景中的所有对象都会被删除，该脚本自然无法继续执行。
                   
    //我们可以在Start()函数中使用GameObject.DontDestroyOnLoad方法，让该脚本依附的对象过场景不被删除!这样就可以正常执行
}
```

**协程的优点**是异步加载场景时我可以在加载的同时做一些别的逻辑 （写在 `yield return` 上面，通过事件回调函数异步加载的方法只能在加载结束后执行其他逻辑），**比如我们可以在异步加载过程中去更新进度条。**
```cs
while(!ao.isDone)
{
    print(ao.progress);
    yield return null;
}
//离开循环后就会认为场景加载结束
//可以把进度条顶满然后隐藏进度条
```

当然不是说必须用异步方法更新进度条（这种方法实际不准确），要根据你游戏的规则自己定义进度条变化的条件，根据需求选择，没有谁好谁坏：
```cs
yield return ao;
//场景加载结束更新 20%进度
//接着去加载场景中的其它信息
//比如
//动态加载怪物
//这时进度条再更新 20%
//动态加载场景模型
//这时就认为加载结束了进度条顶满
//隐藏进度条
```

他们的优缺点表现和资源异步加载也是一样的
1. 事件回调函数
优点: 写法简单，逻辑清晰
缺点: 只能加载完场景做一些事情不能再加载过程中处理逻辑
2. 协程异步加载
优点: 可以在加载过程中处理逻辑，比如进度条更新等
缺点: 写法较为麻烦，要通过协程

## 9 鼠标Cursor
```cs
//显示/隐藏鼠标
Cursor.visible = true;

//锁定鼠标，按ESC键解锁
// None 不锁定
// Locked 锁定鼠标会被限制在屏幕的中心点，并且会隐藏鼠标
// Confined 限制在窗口范围内
Cursor.lockState = CursorLockMode.Confined;

//参数一:光标图片
//参数二:偏移位置相对图片左上角
//参数三:平台支持的光标模式(硬件或软件)
Cursor.SetCursor(texture, new Vector2(0, 0), CursorMode.Auto);
```
## 10 LineRenderer
LineRenderer 是 Unity 提供的一个用于**画线**的组件，使用它我们可以在场景中绘制线段
一般可以用于
1. 绘制攻击范围 
2. 武器红外线 
3. 辅助功能 
4. 其它画线功能

![[Pasted image 20230611160618.png|450]]
### 组件功能
编辑模式：
![[Pasted image 20230611161700.png]]

![[Pasted image 20230611160703.png|450]]
![[Pasted image 20230611161227.png|450]]
使用受光影响的材质时，勾选 Generate Lighting Data
![[Pasted image 20230611161306.png|600]]
![[Pasted image 20230611161632.png]]
### 代码相关
所有参数都可以通过代码控制
```cs
//动态添加一个线段
GameObject line = new GameObject();
line.name = "Line";
LineRenderer lineRenderer = line.AddComponent<LineRenderer>();

//首尾相连
lineRenderer.loop = true;

//开始结束宽度
lineRenderer.startWidth = 1.0f;
lineRenderer.endWidth = 0.1f;

//开始结束颜色
lineRenderer.startColor = Color.white;
lineRenderer.endColor = Color.red;

//设置材质
lineRenderer.material = material;

//设置点，注意要先设置点的个数
lineRenderer.positionCount = 4;
lineRenderer.SetPosition(0, new Vector3(0, 0, 0));
lineRenderer.SetPosition(1, new Vector3(0, 10, 0));
lineRenderer.SetPosition(2, new Vector3(10, 10, 0));
lineRenderer.SetPosition(3, new Vector3(10, 0, 0));

//是否使用世界坐标
lineRenderer.useWorldSpace = false;
```
# 三、核心系统

## 2 音频系统 
常用格式：wav，mp3，ogg，aiff
### 属性设置
![[Pasted image 20230605155215.png|450]]
![[Pasted image 20230605155225.png]]
![[Pasted image 20230605155456.png]]
### 音频源 Audio Source
- 一个 Scene 内 Audio Source 只能有一个
- 一个 Gameobject 可以挂载多个音效源脚本 AudioSource
- 使用时要注意如果要挂载多个，那一定要自己管理他们，控制他们的播放停止，不然我们没有办法准确的获取谁是谁
![[Pasted image 20230605155715.png|500]]
![[Pasted image 20230605155803.png|450]]
![[Pasted image 20230605160059.png]]


**Spatial Blend**：设置 3D 音效，默认为 2D
**Volume Rolloff**：声音距离衰减

```cs title:代码控制
AudioSource audioSource;
void Start()
{
    audioSource = this.GetComponent<AudioSource>();
}

void Update()
{
    //控制播放停止
    if (Input.GetKeyDown(KeyCode.P))
    {
        //播放
        audioSource.Play();
        //audioSource.PlayDelayed(5); //延迟几秒后播放

    }
    if(Input.GetKeyDown(KeyCode.S))
    {
        //停止
        audioSource.Stop();
    }

    if (Input.GetKeyDown(KeyCode.Space))
    {
        //暂停
        audioSource.Pause();
        //audioSource.UnPause(); //关闭暂停，实际上再执行一次Pause方法也会关闭暂停
    }

    //检测音效播放完毕
    if(audioSource.isPlaying)
    {
        print("正在播放");
    }
    else
    {
        print("播放结束");
    }
}
```

**如何动态控制音效播放**
1. 直接在要播放音效的对象上挂载脚本控制播放
2. 实例化挂载了音效源脚本的对象
3. 用一个 Audio Clip 来控制播放不同的音效
```cs title:动态控制音效播放
public AudioClip clip;
void Start()
{
    AudioSource audioSource = this.GetComponent<AudioSource>();
    audioSource.clip = clip;
    audioSource.Play();
}
```

### 麦克风设备
```cs
// 获取设备麦克风信息
string[] strs = Microphone.devices;
for (int i = 0; i < strs.Length; i++) 
{
    print(strs[i]);
}

//开始录音
//参数一:设备名，传null使用默认设备
//参数二:超过录制长度后是否重头录制
//参数三:录制时长
//参数四:采样率
audioClip = Microphone.Start(null, false, 10, 44100);

//结束录音
Microphone.End(null);

//播放录制音频
AudioSource s = this.GetComponent<AudioSource>();
if (s == null)
{
    s = this.gameObject.AddComponent<AudioSource>();
}
s.clip = audioClip;
s.Play();

//获取音频数据用于存储或者传输  
//用于存储数组数据的长度=声道数*剪辑长度  
float[] f = new float[audioClip.channels * audioClip.samples];  
audioClip.GetData(f, 0);  
```

## 3 物理系统
### (1) 碰撞检测
物理信息的更新和 FixedTime 相关

> [!bug]  碰撞产生的必要条件：
> 
> - 两个物体都有碰撞器 Collider
> - 至少一个物体有刚体 Rigidbody

![[Pasted image 20230605124248.png]]

#### 刚体 Rigidbody

![[Pasted image 20230605124429.png]]

**插值运算：**
![[Pasted image 20230605125014.png|400]]

**碰撞检测：**
![[Pasted image 20230605125251.png]]
性能消耗关系
Continuous Dynamic > Continuous Speculativec > Continuous > Discrete

**约束：**
![[Pasted image 20230605125531.png]]
游戏中防止物体乱飞，可以这样设置：
![[Pasted image 20230610161032.png]]
#### 碰撞器 Collider

![[Pasted image 20230605125839.png]]
![[Pasted image 20230605130129.png]]

**异形物体使用多种碰撞器组合，刚体对象的子对象碰撞器信息参与碰撞检测（即我们可以给父对象添加刚体，碰撞器则添加到每个子对象上）**

**不常用的碰撞器：**
Mesh Colider网格碰撞器，根据网格生成碰撞体，消耗较大，较为精确
![[Pasted image 20230605131446.png]]

Wheel Colider 车轮碰撞器，用于汽车
Terrain Colider：地形碰撞器

#### 物理材质
让两个物体之间碰撞时表现出不同效果
右键 Create 
![[Pasted image 20230605132408.png|500]]
#### 碰撞检测函数
- **碰撞和触发响应函数属于特殊的生命周期函数，位于 FixedUpdate 和 Update 之间，也是通过反射调用**
- 如果是一个异形物体，刚体在父对象上，如果你想通过子对象上挂脚本检测碰撞是不行的必须挂载到这个刚体父对象上才行。
- 碰撞和触发器函数都可以写成虚函数，在子类去重写逻辑

![[Pasted image 20230605132917.png|350]]

#### 物理碰撞检测响应函数
```cs title:Collision类
//Collision类型的参数包含了碰到自己的对象的相关信息

//碰撞到的对象的碰撞器信息
collision.collider;

//碰撞对象的依附对象（GameObject）
collision.gameObject;

//碰撞对象的依附对象的位置信息
collision.transform;

//接触点点数量
collision.contactCount;

//接触点 坐标
ContactPoint[] pos = collision.contacts;

//只要得到碰撞道德对象的任意一个信息，就可以得到所有信息
collision.gameObject.GetComponent<>();
```

```cs title:碰撞相关的生命周期函数(检测响应函数)
//碰撞触发接触时会自动执行这个函数
private void OnCollisionEnter(Collision collision)
{
    print(this.name + "碰撞到了" + collision.gameObject.name);
}

//两个物体相互接触摩擦时会不停的调用该函数
 private void OnCollisionStay(Collision collision)
{
    print(this.name+"正在摩擦"+collision.gameObject.name);
}

 //碰撞结束分离时会自动执行的函数
private void OnCollisionExit(Collision collision)
{
    print("碰撞结束");
}
```


#### 触发器检测响应函数
勾选 IS Trigger
![[Pasted image 20230605134638.png]]

用法类似物理碰撞检测函数：
```cs
//第一次接触时
private void OnTriggerEnter(Collider other)
{
}

//接触过程中
private void OnTriggerStay(Collider other)
{
}

//接触结束
private void OnTriggerExit(Collider other)
{
}
```

#### 刚体加力
给刚体加力的目标就是让其有一个速度朝向某一个方向移动

##### 刚体添加力
```cs title:刚体添加力的方法
//1.首先应该获取刚体组件
rigidBody = this.GetComponent<Rigidbody>();

//2.添加力
//加力过后对象是否停止移动是由阻力决定的，没有阻力就不会停
//相对世界坐标
rigidBody.AddForce(Vector3.forward * 10,ForceMode.Acceleration); //力的模式
//相对本地坐标
rigidBody.AddRelativeForce(Vector3.forward * 10);


//3.添加扭矩力，让其旋转
//相对世界坐标
rigidBody.AddTorque(Vector3.up * 10);
//相对本地坐标
rigidBody.AddRelativeTorque(Vector3.up * 10);

//4.直接改变速度
//这个速度方向是相对于世界坐标系的
rigidBody.velocity = Vector3.forward * 5;

//5.模拟爆炸冲击波，只对该脚本挂载的对象起作用
//第一个参数是爆炸的中心点
//第二个参数是爆炸的半径
//第三个参数是爆炸的力
//第四个参数是爆炸的作用范围
rigidBody.AddExplosionForce(100,Vector3.zero,10,10);
```

##### 力的模式
上面添加力的方法其实有第二个参数，用来指定计算力的模式 `ForceMode`
```cs
rigidBody.AddForce(Vector3.forward * 10,ForceMode.Acceleration); 
```

动量定理 ： 
Ft =mv
V=Ft/m; 
F：力
t：时间 
m：质量
v：速度

四种模式：第二种模式比较符合真实
![[Pasted image 20230605153729.png]]
![[Pasted image 20230605153747.png]]
![[Pasted image 20230605153852.png]]
![[Pasted image 20230605153903.png]]
#### 刚体休眠
比如运行游戏后，Cube 落到平面上发生碰撞停下，此时编辑平面的角度，发现 Cube 并没有下落，因为此时 Cube 的刚体休眠了。再移动一下，才会唤醒
![[Pasted image 20230605154414.png]]

```cs title:主动唤醒
if(rigidBody.IsSleeping())
{
    rigidBody.WakeUp();
}
```
#### 力场脚本 Constant Force
更方便的添加力
![[Pasted image 20230605154007.png]]

### (2) 范围检测
游戏中**瞬时的攻击范围判断一般会使用范围检测**

1. 玩家在前方 5m 处释放一个地刺魔法，在此处范围内的对象将受到地刺伤害 
2. 玩家攻击，在前方 1 米圆形范围内对象都受到伤害

类似这种并没有实体物体只想要检测在指定某一范围是否让敌方受到伤害时，便可以使用范围判断。
简而言之，在指定位置进行范围判断我们可以得到处于指定范围内的对象，目的是对对象进行处理，比如受伤减血等等

> [!bug] 范围检测必备条件
> **想要被范围检测到的对象必须具备碰撞器**

注意点：
1. 范围检测相关 API 只有当执行该句代码时进行一次范围检测，它是瞬时的 
2. 范围检测相关 API 并不会真正产生个碰撞器，只是碰撞判断计算而已

#### 盒状范围检测
- **参数一：** 立方体中心点
- **参数二：** 立方体三边大小
- **参数三：** 立方体角度
- **参数四：** 检测指定 Layer （不填检测所有层)
- **参数五：** 是否忽略触发器 
    - UseGlobal 使用全局设置
        - 全局设置根据 Physics 中的设置来决定 ![[Pasted image 20230611164957.png|700]]
    -  Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** **在该范围内的触发器 (得到了对象触发器就可以得到对象的所有信息)**

```cs title:Physics.OverlapBox
Collider[] colliders = Physics.OverlapBox(
    Vector3.zero,
    Vector3.one, 
    Quaternion.AngleAxis(45,Vector3.up), 
    1<<LayerMask.NameToLayer("UI") | 1<<LayerMask.NameToLayer("Water"),
    //第四个参数用 | 继续添加就可以了
     QueryTriggerInteraction.UseGlobal);
        
for(int i=0;i<colliders.Length;i++)
{
    Debug.Log(colliders[i].gameObject.name); //打印触发器挂载的对象信息
}
```

另一个 API：`Physics.OverlapBoxNonAlloc`
参数区别：第三个参数传入一个`Collider[]`数组进行存储
返回值回值：碰撞到的碰撞器数量
```cs title:Physics.OverlapBoxNonAlloc
Collider[] colliders = new Collider[10]; //数组数量必须等于检测到的碰撞体数量  

//碰撞到的碰撞器数量
int num = Physics.OverlapBoxNonAlloc(
    Vector3.zero,
    Vector3.one,
    colliders,
    Quaternion.AngleAxis(45,Vector3.up), 
    1<<LayerMask.NameToLayer("UI") | 1<<LayerMask.NameToLayer("Water"),
     QueryTriggerInteraction.UseGlobal);

//如果碰撞到的碰撞器数量不为0，则执行代码
if(num != 0)  
{  
    for(int i = 0;i < num;i++)  
    {  
        Debug.Log(colliders[i].gameObject.name);  
    }  
}
```

> [!NOTE] 关于 Layer 编号
> ![[Pasted image 20230611164625.png|400]]
>- 通过名字得到层级编号可以使用 `LayerMask.NameToLayer` 方法
>- 我们需要通过编号左移 `<<` 构建二进制数，这样每一个编号的层级都是对应位为 1 的 2 进制数，我们通过位运算可以选择想要检测层级
>- 好处：一个 int 就可以表示所有想要检测的层级信息
>
> ![[Pasted image 20230611164535.png|700]]
>**也可以直接声明一个 LayerMask 类型的变量，可以开放到 inspector 方便方便调整，但使用位掩码方法更好。为什么？**

#### 球体范围检测
- **参数一：** 球体中心点
- **参数二：** 球半径
- **参数三：** 检测指定 Layer （不填检测所有层)
- **参数四：** 是否忽略触发器 
    - UseGlobal 使用全局设置
    - Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** **在该范围内的触发器 (得到了对象触发器就可以得到对象的所有信息)**

```cs title:Physics.OverlapSphere
Collider[] colliders = Physics.OverlapSphere(
            Vector3.zero,
            5,
            1 << LayerMask.NameToLayer("UI"), 
            QueryTriggerInteraction.UseGlobal);
        
for(int i=0;i<colliders.Length;i++)
{
    Debug.Log(colliders[i].gameObject.name); //打印触发器挂载的对象信息
}
```

另一个 API: `Physics.OverlapSphereNonAlloc`
返回值: 碰撞到的碰撞器数量
参数: 传入一个数组进行存储
```cs title:Physics.OverlapSphereNonAlloc
Collider[] colliders = new Collider[10]; //数组数量必须等于检测到的碰撞体数量  
  
//碰撞到的碰撞器数量  
int num = Physics.OverlapSphereNonAlloc(  
    Vector3.zero,  
    5,  
    colliders,  
    1<<LayerMask.NameToLayer("UI"),  
    QueryTriggerInteraction.UseGlobal);  
  
//如果碰撞到的碰撞器数量不为0，则执行代码  
if(num != 0)  
{  
    for(int i = 0;i < num;i++)  
        {  
            Debug.Log(colliders[i].gameObject.name);  
        }  
}
```

#### 胶囊范围检测
![[Pasted image 20230611172957.png|193]]
- **参数一：** 上半圆中心点（两个中心点确定胶囊体的位置）
- **参数二：** 下半圆中心点
- **参数三：** 半圆半径
- **参数四：** 检测指定 Layer （不填检测所有层)
- **参数五：** 是否忽略触发器 
    - UseGlobal 使用全局设置
    - Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** **在该范围内的触发器 (得到了对象触发器就可以得到对象的所有信息)
```cs title:Physics.OverlapCapsule
Collider[] colliders = Physics.OverlapCapsule(
            Vector3.zero,
            Vector3.up, 
            5,
            1 << LayerMask.NameToLayer("UI"), 
            QueryTriggerInteraction.UseGlobal);
        
for(int i=0;i<colliders.Length;i++)
{
    Debug.Log(colliders[i].gameObject.name); //打印触发器挂载的对象信息
}
```

**另一个 API**：`Physics.OverlapCapsuleNonAlloc`
返回值：碰撞到的碰撞器数量
参数：传入一个数组进行存储
```cs title:Physics.OverlapCapsuleNonAlloc
Collider[] colliders = new Collider[10]; //数组数量必须等于检测到的碰撞体数量  
        
//碰撞到的碰撞器数量
int num = Physics.OverlapCapsuleNonAlloc(
    Vector3.zero,
    Vector3.up,
    3,
    colliders,
    1 << LayerMask.NameToLayer("UI"),
    QueryTriggerInteraction.UseGlobal);

//如果碰撞到的碰撞器数量不为0，则执行代码
if(num != 0)  
{  
    for(int i = 0;i < num;i++)  
    {  
        Debug.Log(colliders[i].gameObject.name);  
    }  
}
```

### (3) 射线检测 

射线检测通过在指定点发射一个指定方向的射线，判断该射线与哪些碰撞器相交，得到对应对象。
#### 声明射线
- @ **指定起点方向的射线**
参数一： 起点 `ray.origin` 
参数二：方向 `ray.direction` (**不是两点决定射线方向，第二个参数直接就代表方向向量**)  

```cs title:指定起点方向的射线
//声明射线
//起点为坐标 (1,0,0)
//方向为世界坐标 z 轴正方向的射线 
Ray ray = new Ray(Vector3.right, Vector3.forward);
print(ray.origin); //起点
print(ray.direction); //方向
```

- @ **摄像机发出的射线**
```cs title:摄像机射线
Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
```

Physics 类中提供了很多进行射线检测的静态函数
他们有很多种重载类型我们只需要掌握核心的几个函数其它函数自然就明白什么意思了注意:
**射线检测也是瞬时的了执行代码时进行一次射线检测**
#### 检测是否相交
`Raycast` 射线投射

**进行射线检测如果碰撞到对象返回 true（只检测是否碰撞，得不到信息）**
- **参数一：** 射线（或直接传入射线起点和方向）
- **参数二：** 检测的最大距离，超出这个距离不检测
- **参数三：** 检测指定层级 (不填检测所有层)
- **参数四：** 是否忽略触发器 
    - UseGlobal 使用全局设置
    - Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** bool 当碰撞到对象时返回 true，没有返回 false
```cs title:Physics.Raycast
//声明射线
 Ray ray = new Ray(Vector3.right, Vector3.forward);

 if (Physics.Raycast(
     ray,
     1000,
     1 << LayerMask.NameToLayer("Default"),
     QueryTriggerInteraction.Ignore))
 {
     print("碰撞到了对象");
 }

//不声明直接传参
if (Physics.Raycast(
         Vector3.right,
         Vector3.forward,
         1000,
         1 << LayerMask.NameToLayer("Default"),
         QueryTriggerInteraction.Ignore))
 {
     print("碰撞到了对象");
 }
```

#### 获取相交的单个物体信息
**物体信息类 `RaycastHit`**：射线投射命中
![[Pasted image 20230611204141.png|500]]

- **参数一：** 射线（或直接传入射线起点和方向）
- **参数二：** `RaycastHit` 是结构体，是值类型。 unity 会通过 `out` 关键字，在函数内部处理得到的碰撞数据并返回到该参数中
- **参数三：** 距离
- **参数四：** 检测指定层级（不填检测所有层)
- **参数五：** 是否忽略触发器 
    - UseGlobal 使用全局设置
    - Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** bool 当碰撞到对象时返回 true，没有返回 false
```cs
//声明射线
Ray ray = new Ray(Vector3.right, Vector3.forward);

if (Physics.Raycast(
    ray,
    out RaycastHit hit,
    1000,
    1 << LayerMask.NameToLayer("Default"),
    QueryTriggerInteraction.Ignore))
{
    //碰撞器信息，得到了碰撞器就可以获取物体所有信息
    print(hit.collider.gameObject.name);

    //碰撞到的对象的位置
    print(hit.transform.position);
    
    //碰撞到对象离射线起点的距离
    print(hit.distance);
    
    //碰撞点，射线与物体相交的点
    print(hit.point);

    //碰撞点法线，射线与物体相交的点的法线
    print(hit.normal);

    //碰撞点uv坐标，射线与物体相交的点的uv坐标
    print(hit.textureCoord);

    //省略...
}

//不声明直接传参
if (Physics.Raycast(
    Vector3.right,
    Vector3.forward,
    out RaycastHit hit,
    1000,
    1 << LayerMask.NameToLayer("Default"),
    QueryTriggerInteraction.Ignore))
{...}
```

#### 获取相交的多个物体
可以得到碰撞到的多个对象，如果没有就是容量为 0 的数组

- **参数一：** 射线（或直接传入射线起点和方向）
- **参数二：** 检测的最大距离，超出这个距离不检测
- **参数三：** 检测指定层级 (不填检测所有层)
- **参数四：** 是否忽略触发器 
    - UseGlobal 使用全局设置
    - Collide 检测触发器
    - Ignore 忽略触发器
    - 不填默认使用 UseGlobal
- **返回值：** bool 当碰撞到对象时返回 true，没有返回 false

```cs title:Physics.RaycastAll
//声明射线
Ray ray = new Ray(Vector3.right, Vector3.forward);

RaycastHit[] hits = Physics.RaycastAll(
    ray,
    1000,
    1 << LayerMask.NameToLayer("Default"),
    QueryTriggerInteraction.Ignore);
    
for(int i = 0; i < hits.Length; i++)
{
    print(hits[i].collider.gameObject.name);
}


//不声明直接传参
RaycastHit[] hits = Physics.RaycastAll(
    Vector3.right,
    Vector3.forward,
    1000,
    1 << LayerMask.NameToLayer("Default"),
    QueryTriggerInteraction.Ignore);
```

#### 获取相交物体的数量
```cs title:Physics.RaycastNonAlloc
RaycastHit[] hits = new RaycastHit[10];
        
int num = Physics.RaycastNonAlloc(
    ray,
    hits,
    1000,
    1 << LayerMask.NameToLayer("Default"),
    QueryTriggerInteraction.Ignore);

for (int i = 0; i < num; i++) 
{
    print(hits[i].collider.gameObject.name);
}
```
# 四、协同程序
## 1 Unity 多线程
[[《CS Primer》#十四、多线程]]
Unity 是支持多线程的，只是线程是无法调用 Unity 主线程的 API（不常用）
注意: Unity 中的多线程要记得关闭（即便停止运行，线程仍会执行）

子线程可以执行一些可能导致主线程卡顿的算法计算（寻路、网络等算法），将结果放入公共容器，主线程取出使用。相反，主线程也可以将数据放入公共容器，子线程取出使用。

```cs
public class test : MonoBehaviour
{
    //声明一个子线程
    private Thread t;
    //公共容器
    private Queue<Vector3> queue = new Queue<Vector3>();

    private void Start()
    {
        t = new Thread(Test); //调用子线程函数
        t.Start();
    }

    private void Update()
    {
        if (queue.Count > 0)
        {
            //取公共容器的内容
            this.transform.Translate(queue.Dequeue());
        }
    }

    private void OnDestroy()
    {
        //Unity中的多线程要记得关闭
        t.Abort();
        t = null;
    }

    //子线程函数
    private void Test()
    {
        while (true)
        {
            //this.transform.Translate(Vector3.forward * Time.deltaTime);  //报错，因为子线程是无法调用Unity主线程的API的
            
            //将计算结果存入公共容器
            queue.Enqueue(new Vector3(1,2,3));
            Thread.Sleep(1000);
            print("test");
        }
    }
}
```

## 2 Unity 协程
**协同程序（Coroutine）简称协程**，继承 MonoBehavior 的类都可以开启协程函数
它是“假”的多线程，它**不是多线程**
**主要作用**：将代码分时执行，不卡主线程。简单理解，是把可能会让主线程卡顿的耗时的逻辑**分时分步执行**

**主要使用场景**
- 异步加载文件
- 异步下载文件
- 场景异步加载
- 批量创建时防止卡顿

**协程和线程的区别：**
- 子线程是独立的一个管道，和主线程并行执行
- 协程是在原线程之上开启，进行逻辑分时分步执行

**协程开启后**
- 组件和物体销毁，协程**不执行**
- 物体失活，协程**不执行**
- 脚本组件失活，协程**执行**

```cs title:协程
private void Start()
{
    //第二步:启动协程函数
    //可以同时执行多个协程函数
    Coroutine c1 = StartCoroutine(MyCoroutine(1,"hello"));
    Coroutine c2 = StartCoroutine(MyCoroutine(3,"test"));  
    Coroutine c3 = StartCoroutine(MyCoroutine(4,"hello"));
    
    //第三步:关闭协程函数
    StopAllCoroutines(); //关闭所有携程
    StopCoroutine(c1); //关闭指定携程
    
}

//第一步:声明协程函数
////协程函数2个关键点
//1-1 返回值为IEnumerator类型及其子类
//1-2 通过yield return返回值;
IEnumerator MyCoroutine(int i,string str)
{
        print(i);
        yield return new WaitForSeconds(5.0f); //等待5秒执行下面的代码，从而将代码分块执行
        print(str);
        yield return new WaitForSeconds(3.0f); //等待5秒执行下面的代码
        print(i);

        //主线程里是可以写死循环协程的，不会卡死，等待时间继续Tick
        while (true)
        {
            print("routine");
            yield return new WaitForSeconds(10.0f);
        }
}
```

[[《CS Primer》#用 yield return 语法糖实现迭代器]]

```cs title:yieldreturn不同内容的含义
//1.下一帧执行
yield return 数字;
yield return null;
//在Update和LateUpdate之间执行后面的代码

//2.等待指定秒后执行
yield return new waitForSeconds(秒);
//在update和LateUpdate之间执行后面的代码

//3.等待下一个固定物理帧更新时执行
yield return new waitForFixedUpdate();
//在FixedUpdate和碰撞检测相关函数之后执行后面的代码

//4.等待摄像机和GUI渲染完成后执行
yield return new waitForEndOfFrame(); 
//在LateUpdate之后的渲染相关处理完毕后之后执行后面的代码（主要会用来实现截图功能）

//5.一些特殊类型的对象比如异步加载相关函数返回的对象
//之后讲解异步加载资源异步加载场景网络加载时再讲解
//一般在update和LateUpdate之间执行

//6.跳出协程
yield break ;
```
## 3 协程原理
协程可以分成两部分
1. 协程函数本体 
2. 协程调度器

- 协程本体就是一个能够中间暂停返回的函数
- 协程调度器是 unity 内部实现的，会在对应的时机帮助我们继续执行协程函数
- **Unity 只实现了协程调度部分**
- **协程的本体本质上就是一个 cs 的迭代器方法**

**协程调度器**
继承 MonoBehavior 后开启协程
相当于是把一个协程函数（迭代器)放入 Unity 的协程调度器中帮助我们管理
具体的 yield return 后面的规则也是 Unity 定义的一些规则

```cs
//1. 协程函数本体
//如果我们不通过开启协程方法执行协程
//Unity 的协程调度器是不会帮助我们管理协程函数的 
//Test(); //不会执行
//Coroutine c = StartCoroutine(Test()); //会执行

//但是我们可以自己执行迭代器函数内容,起到相同效果
IEnumerator ie = Test();
ie.MoveNext(); //会执行函数中内容遇到yield return为止的逻辑
print(ie.Current); //返回yield return返回值

ie.MoveNext();
print(ie.Current);

ie.MoveNext();
print(ie.Current);

ie.MoveNext();
print(ie.Current);

//也可以用一个循环执行所有协程函数内容
//MoveNext 返回bool值代表着是否到了结尾(这个迭代器函数是否执行完毕)
while (ie.MoveNext())
{
    print(ie.Current);
}
```

总结：你可以简化理解迭代器函数
- cs 看到迭代器函数和 yield return 语法糖就会把原本是一个的函数变成"几部分"
- 我们可以通过迭代器，从上到下遍历这“几部分"进行执行
- 就达到了将一个函数中的逻辑分时执行的目的

**而协程调度器就是利用迭代器函数返回的内容来进行之后的处理**
比如 unity 中的协程调度器
根据 yield return 返回的内容决定了下一次在何时继续执行迭代器函数中的“下一部分"

**理论上来说我们可以利用迭代器函数的特点自己实现协程调度器来取代 unity 自带的调度器（一般自己不需要实现，唐老师课程作业中讲了具体做法）**


## 4 应用
### 协程计时器
```cs
  private void Start()
{
    Coroutine c = StartCoroutine(MyCoroutine());
}

IEnumerator MyCoroutine()
{
    int time = 0;
    while (true)
    {
        print(time+"s");
        ++time;
        yield return new WaitForSeconds(1.0f); //按s计时
    }
}
```

### 分时创建对象，防止批量处理卡顿
创建 100000 个 Cube，直接创建直接卡死，使用协程每帧生产 1000 个
```cs
private void Update()
{
    if (Input.GetKeyDown(KeyCode.Space))
    {
        StartCoroutine(CreateCube(100000));
    }
}

IEnumerator CreateCube(int num)
{
    for (int i = 0; i < num; i++)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.transform.position = new Vector3(UnityEngine.Random.Range(-100, 100), UnityEngine.Random.Range(-100, 100), UnityEngine.Random.Range(-100, 100));
        
        //每创建1000个Cube，就等下一帧
        if (i % 1000 == 0)
            yield return null;
    }
}
```

# 五、资源动态加载
## 1 文件夹路径获取
- @ **Assets 工程文件夹**

```cs title:路径获取
Application.dataPath  //获取到Assets文件夹的路径
//注意该方式获取到的路径一般情况下只在编辑模式下使用
//我们不会在实际发布游戏后还使用该路径，游戏发布过后该路径就不存在了│
```

- @ **Resources 资源文件夹**
> [!attention] 
> 需要在 Assets 下手动创建名为 Resources 的文件夹

```cs title:路径获取
//一般不获取，只能使用 Resources 相关 API 进行加载
//如果硬要获取可以用工程路径拼接(只在编辑模式下使用)
Application.dataPath + "/Resources"
```

**作用**：资源文件夹
- **需要通过 Resources 相关 API 动态加载的资源需要放在其中**
- 该文件夹下所有文件都会被打包出去
- 打包时 unity 会对其压缩加密
- 该文件夹打包后只读，只能通过 Resources 相关 API 加载
- 在一个工程当中  Resources 文件夹可以有多个（子文件夹中也可以有），通过 API 加载时，它会自己去这些同名的 Resources 文件夹中找资源。打包时所有 Resources 文件夹打包在一起


- @ **StreamingAssets 流动资源文件夹**
> [!attention] 
> 需要在 Assets 下手动创建名为 StreamingAssets 的文件夹

```cs title:路径获取
Application.streamingAssetsPath
```

**作用**：流文件夹
- 打包出去不会被压缩加密，可以任由我们摆布
- **移动平台只读**，PC 平台可读可写
- 可以**放入一些需要自定义动态加载的初始资源**

- @ **persistentDataPath 持久数据文件夹**

> [!attention] 
> 不需要自己创建

```cs title:路径获取
Application.persistentDataPath
```

**作用**：固定数据文件夹
- 所有平台都可读可写
- **一般用于放置动态下载或者动态创建的文件，游戏中创建或者获取的文件都放在其中**
- 常用来保存玩家数据和热更新

- @ Plugins 插件文件夹
> [!attention] 
> 需要在 Assets 下手动创建名为 Plugins 的文件夹

路径获取: 一般不获取

作用：插件文件夹
不同平台的插件相关文件放在其中，比如 ios 和 Android 平台 

- @ Editor 编辑器文件夹
> [!attention] 
> 需要在 Assets 下手动创建名为 Editor 的文件夹

```cs title:路径获取
//一般不获取
//如果硬要获取可以用工程路径拼接
Application.dataPath + "/Editor"
```

**作用**：编辑器文件夹
- 开发 unity 编辑器时，编辑器相关脚本放在该文件夹中
- 该文件夹中内容**不会被打包出去**

- @  Standard Assets 默认资源文件夹
高版本 Unity 没有这个文件夹了。

作用:
默认资源文件夹
一般 unity 自带资源都放在这个文件夹下
代码和资源优先被编译

## 2 Resources 资源同步加载

1. 通过代码动态加载 Resources 文件夹下指定路径资源 
2. **避免繁琐的拖拽操作**

常用资源类型
1. 预设体对象 GameObject 
2. 音效文件 AudioClip 
3. 文本文件  TextAsset 
4. 图片文件 Texture
5. 其它类型 2D 图片、动画文件、材质文件等等

**注意：**
- 预设体对象加载需要实例化
- 其它资源加载一般直接用
### 加载文件资源
```cs title:加载资源 h:7,13,20,33
public class test : MonoBehaviour
{
    public AudioSource audioSource;
    public Texture texture;
    private void Start()
    {
        //1. 预设体对象，想要创建在场景上，记得实例化
        //第一步：加载预设体的资源文件(本质上就是加载配置数据在内存中)
        Object obj1 = Resources.Load("filename"); //""中是预设体在Resources文件夹下的相对路径,不需要写拓展名后缀
        //第二步：实例化
        Instantiate(obj1); 
        
        //2. 音效文件
        //第一步：加载资源文件
        Object obj2 = Resources.Load("Music/filename");
        //第二步：使用数据，我们不需要实例化音效切片，我们只需要把数据赋值到正确的脚本上即可
        audioSource.clip = obj2 as AudioClip;
        audioSource.Play();
        
        //3. 文本文件
        //文本资源支持的格式
        //.txt
        //.xml
        //.bytes
        //.json
        //.html
        //.csv
        //...
        TextAsset ta = Resources.Load("Text/filename") as TextAsset;
        print(ta.text); //文本内容
        print(ta.bytes); //字节数据组
        
        //4. 图片文件
        texture = Resources.Load("Texture/filename") as Texture;
    }

    private void OnGUI()
    {
        //在GUI中绘制图片
        GUI.DrawTexture(new Rect(0, 0, 100, 100), texture);
    }
}
```

### 加载同名文件
`Resources. Load` 加载同名资源时无法准确（比如两个同名但是拓展名后缀（文件类型）不一样的文件，该方法无法区分），可以使用其他方法：
```cs ffile:加载指定文件
//填写第二个参数，指定类型
Resources.Load("filename", typeof(TextAsset)) as TextAsset;
```

```cs title:加载指定名字的所有资源
Object[] objs = Resources.LoadAll("filename");
foreach (Object item in objs)
{
    if (item is Texture)
    {
        
    }
    else if (item is TextAsset)
    {
        
    }
}
```

### 泛型方法（推荐！）
方便快捷，指定了类型
```cs
TextAsset ta2 = Resources.Load<TextAsset>("Text/Test"); //指定TextAsset类型
```

## 3 Resources 资源异步加载
同步加载中，如果我们加载过大的资源可能会造成程序卡顿
卡顿的原因就是从硬盘上把数据读取到内存中是需要进行计算的，越大的资源耗时越长，就会造成掉帧卡顿
异步加载就是**内部新开一个子线程进行资源加载（加载完后存入公共容器）**，不会造成主线程卡顿

> [!attention] 
> 异步加载不能马上得到加载的资源，至少要等一帧

**方法一：完成事件监听异步加载**
好处: 写法简单
坏处: 只能在资源加载结束后进行处理
“线性加载”

```cs title:通过异步加载中的完成事件监听使用加载的资源
public Texture  texture;

private void Start()
{
    //1. 通过异步加载中的完成事件监听 使用加载的资源
    //这句代码你可以理解Unity 在内部就会去开一个线程进行资源下载
    ResourceRequest resourceRequest = Resources.LoadAsync<Texture>("filename");
    //马上进行一个资源下载结束的一个事件函数监听
    resourceRequest.completed += LoadOver;

    //不能在这里直接使用resourceRequest.asset
}

private void LoadOver(AsyncOperation obj)
{
    print("加载结束");
    //asset是资源对象，加载完毕后就能得到它
    texture = (obj as ResourceRequest).asset as Texture;
}

private void OnGUI()
{
    if (texture != null)
    {
        GUI.DrawTexture(new Rect(0, 0, 100, 100), texture);
    }
}
```

**方法二：协程异步加载**
好处: 可以在协程中处理复杂逻辑，比如同时加载多个资源，比如进度条更新
坏处: 写法稍麻烦
“并行加载”

```cs title:通过协程使用加载的资源
public Texture  texture;

private void Start()
{
    //2.通过协程使用加载的资源
    StartCoroutine(Load());
}

IEnumerator Load()
{
    ResourceRequest resourceRequest = Resources.LoadAsync<Texture>("filename");

    yield return resourceRequest; //Unity自己知道该返回值意味着你在异步加载资源
    //Unity 会自己判断该资源是否加载完毕了,加载完毕过后才会继续执行后面的代码
    
    texture = resourceRequest.asset as Texture;
}

private void OnGUI()
{
    if (texture != null)
    {
        GUI.DrawTexture(new Rect(0, 0, 100, 100), texture);
    }
}
```

## 4 Resources 资源卸载
**Resources 重复加载资源会浪费内存吗 ?**
1.  Resources 加载一次资源过后，该资源就一直存放在内存中作为缓存
2. 第二次加载时发现缓存中存在该资源，会直接取出来进行使用，所以多次重复加载不会浪费内存
3. 但是会浪费性熊 (每次加载都会去查找取出，始终伴随一些性能消耗)

**卸载指定资源**：`Resources. UnloadAsset()` 
**注意:**
- 该方法**不能释放 Gameobject 对象**，因为它会用于实例化对象（即使是没有实例化的 Gameobject 对象也不能使用该方法卸载）
- 它**只能用于一些不需要实例化的内容**，比如图片和音效文本等等
- 一般情况下我们很少单独使用它
```cs

tex = Resources.Load<Texture>("filename");

Resources.UnloadAsset(tex); //卸载资源
tex = null;
```


**卸载未使用的资源**：`Resources.UnloadUnusedAssets()`
一般在过场景时和 GC 一起使用
```cs
Resources.UnloadUnusedAssets();
GC.Collect();
```


