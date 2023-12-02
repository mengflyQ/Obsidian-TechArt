---
title: 《CS Primer》
aliases: []
tags: []
create_time: 2023-05-26 12:41
uid: 202305261241
banner: "[[Pasted image 20230526124440.png]]"
---


# 零、特性
## 1 预处理器指令
编译器是一种翻译程序
它用于将源语言程序翻译为目标语言程序
- 源语言程序: 某种程序设计语言写成的, 比如 C#、C、C++、Java 等语言写的程序
- 目标语言程序: 二进制数表示的伪机器代码写的程序

预处理器指令指导编译器在实际编译开始之前对信息进行预处理
预处理器指令都是以`#`开始
预处理器指令不是语句，所以它们不以分号 `;` 结束

```cs title:折叠代码
#region 折叠块名字
... //代码
#endregion
```

```cs 
#define  //定义一个符号，类似一个没有值的变量
#undef //取消define定义的符号，让其失效

//两者都是写在脚本文件最前面
//一般配合if指令使用或配合特性
```

```cs
#if
#elif  //即elseif
#else
#endif
//和if语句规则一样，一般配合#define定义的符号使用
//用于告诉编译器进行编译代码的流程控制
```

```cs
#warning
#error
//告诉编译器是报警告还是报错误
//一般还是配合if使用
```

```cs title:案例
#define tag1
#define tag2
#undef tag2

#if tag1
    Console.WriteLine("Hello world!");  //执行
#elif tag2
    Console.WriteLine("Hi world!");     //不执行
#else 
    Console.WriteLine("Exit!");
#endif
```
## 2 控制台方法
```cs title:打印输入输出
Console.Write("xxx"); // 打印，不自动空行
Console.WriteLine("xxx"); // 打印，自动空行
Console.ReadLine(); //等待直到用户按下回车，一次读入一行。
Console.ReadKey();  // 等待用户按下任意键，一次读入一个字符。

Console.ReadKey(true).KeyChar; 
//Console 类的一个静态方法，它读取当前控制台上的任意键盘输入。参数 true 表示在读取输入后不显示读入的字符，如果是 false 则会显示读入的字符。
//返回值是 ConsoleKeyInfo 类型，包含了该字符的 KeyChar 属性（即按下的按键字符），以及关于按键是否有控制字符等其他信息。

Console.KeyAvailable //判断有无键盘输入，如果有则为true
```

```cs title:其他方法
//1.清空
Console.Clear();  

//2. 设置控制台大小
//注意：
//1.先设置窗口大小，在设置缓冲区大小
//2.缓冲区大小不能小于窗口大小
//3.窗口大小不能大于控制台的最大尺寸
Console.SetWindowSize(50,40);  // 设置窗口大小
Console.SetBufferSize(1000, 1000); // 设置缓冲区大小（可打印内容区域的宽高）

//3.设置光标的位置
//控制台左上角为原点，右侧是x轴正方向，下方是Y轴正方向，它是一个平面二维坐标系
//注意:
//1.边界问题
//2.横纵距离单位不同 1y = 2x 视觉上的
Console.SetCursorPosition(10,5);

//4.设置颜色相关
//文字颜色设置
Console.ForegroundColor = ConsoleColor.Red;
//背景颜色设置
Console.BackgroundColor = ConsoleColor.White;

//5.光标显隐
Console.CursorVisible = false;

//6.关闭控制台
Environment.Exit(0);
```

## 3 Path 类

用于操作路径

```cs
static void Main(string[] args)
{
    string str = @"C:\Users\22625\Desktop\1.txt";
    //快速获得文件名，输出：1.txt
    Console.WriteLine(Path.GetFileName(str));
    //只获得扩展名，输出：.txt
    Path.GetExtension(str);
    //不包含扩展名，输出：1
    Path.GetFileNameWithoutExtension(str)
   	//文件目录，输出：C:\Users\22625\Desktop
   	Path.GetDirectoryName(str);
    //文件全路径
    Path.GetFullPath(str);
    //链接两个字符串作为路径
    Path.Combine(@"C:\Users\22625\Desktop\","1.txt")
    ......
}
```

## 4 垃圾回收 GC
垃圾回收, 英文简写 GC (Garbage Collector)

垃圾回收的过程是在遍历堆 (Heap)上动态分配的所有对象，通过识别它们是否被引用来确定哪些对象是垃圾，哪些对象仍要被使用。
所谓的垃圾就是没有被任何变量，对象引用的内容。垃圾就需要被回收释放，

垃圾回收有很多种算法，比如
- 引用计数 (Reference Counting)
- 标记清除 (Mark Sweep)
- 标记整理 (Mark Compact)
- 复制集合 (Copy collection)

**GC 只负责堆 (Heap)内存的垃圾回收，引用类型都是存在堆 (Heap)中的，所以它的分配和释放都通过垃圾回收机制来管理
栈 (Stack)上的内存是由系统自动管理的，值类型在栈 (Stack)中分配内存的。他们有自己的生命周期，不用对他们进行管理，会自动分配和释放**

**CS 中内存回收机制的大概原理:**
0 代内存 1 代内存 2 代内存
**代的概念:** 
1. 代是垃圾回收机制使用的一种算法 (分代算法)
2. 新分配的对象都会被配置在第 0 代内存中
3. 每次分配都可能会进行垃圾回收以释放内存 (0 代内存满时)

- 在一次内存回收过程开始时，垃圾回收器会认为堆中全是垃圾，会进行以下两步
    1. 标记对象从根（静态字段、方法参数）开始检查引用对象（引用类型，比如类、数组），标记后为可达对象，未标记为不可达对象，不可达对象就认为是垃圾
    2. 搬迁对象压缩堆 (挂起执行托管代码线程), 释放未标记的对象，搬迁可达对象，修改引用地址

- 大对象总被认为是第二代内存，目的是减少性能损耗，提高性能
- 不会对大对象进行搬迁压缩（85080 字节 (83kb）以上的对象为大对象）
![](1684809112351.png)  

```cs title:手动垃圾回收
// 一般情况下，我们不会频繁调用、
// 都是在Loading过场景时，才调用
CG.Collect();
``` 

## 5 类型转换

我们要求等号两边参与运算的操作数必须一致，如果不一致，满足下列条件会发生转换。

### 隐式类型转换
- 低精度可以转换成高精度
- char→整数（有符号、无符号）→float→double $\nrightarrow$ decimal
- char→整数（有符号、无符号）→decimal
- string 和 bool 不参与隐式转换规则
- 有符号 $\nrightarrow$ 无符号
- 无符号→有符号（精度低到高）
### 显式（强制）类型转换
#### 括号强转
用于将高精度转换位低精度

```cs
//double->int 强制类型转换（显式类型转换）
double a =(int)b;

//如果n1/n2有一个是double类型则整个式子提升为double类型：
//全int：输出结果d=3
int n1 = 10;
int n2 = 3;
double d = n1 / n2;
Console.WriteLine(d);

//将n1改为double类型：输出d=3.333...
double d = n1*1.0 / n2;  //n1*1.0将n1转换为double类型
Console.WriteLine(d);
```
#### Convert 类型转换

- 如果两个变量类型不兼容，比如 string 与 int 或 string 与 double，可以使用 Convert 函数进行转换。
-  string 字符串的内容必须为要转换的类型。

`Convert.ToInt32()`
`Convert.ToDouble()`
...
```cs string a = "123";
string a = "123";  //但是只能转换int，如果a=”123abc“或“6.5”则会异常
int b = Convert.ToInt32(a);
Console.WriteLine(b);
```

#### .Parse 类型转换

效果同 Convert:

`int.Parse()`
`double.Parse()`
```cs
string a = "123"; 
int b = int.Parse(a);
//double b = double.Parse(a)
```

#### .TryParse 类型转换

`int.TryParse()`

```cs
int a = 0;
bool b = int.TryParse("123", out a);
//尝试将”123“转换为int类型，如果成功就将转换后的123赋值给a，并返回true给b。如果失败则返回false给b，a赋值为0。
Console.WriteLine(b);
Console.WriteLine(a);
```
## 6 命名空间
**概念：** 命名空间是用来组织和重用代码的

**作用：** 就像是一个工具包，类就像是一件一件的工具，都是申明在命名空间中的

1. 不同命名空间中相互使用需要引用命名空间（`using namespace;`）或指明出处（`namespace.test ()`）
2. 不同命名空间中允许有同名类
3. 命名空间可以嵌套命名
# 一、变量和类型
## 内置类型

**值类型：** 无符号整形，有符号整形，浮点数 char bool enum 结构体

**引用类型：** string 类, 自定义类, 集合类，object 类，接口，委托，数组

值类型和引用类型**区别：**
1. 值类型和引用类型在内存上存储的地方不一样。
2. 在传递值类型和传递引用类型的时候，传递的方式不一样。值类型我们称之为值传递，引用类型我们称之为引用传递。
3. 值类型的值存储在内存的**栈**中 (系统自动回收，小而快)，引用类型的值存储在内存的**堆**中（手动释放，大而慢）
![image-20220623150217728|650](image-20220623150217728.png)
- @ 引用类型的数据存在堆中，栈中只存一个地址指向堆中存储的数据
```cs
//原始变量
int a = 1;                   //值类型
int[] arr1 = { 1, 2, 3, 4 }; //引用类型

//新增变量
int b = a;         //值传递
int[] arr2 = arr1; // 引用传递

//修改新增变量
b = 5; 
arr2[0] = 5;
            
//结果
//值传递：b是a的一个拷贝，修改b的值，不会改变a的值
// 引用传递：arr2是arr1的一个引用，修改arr2，会改变arr1
Console.WriteLine(a);       //输出1
Console.WriteLine(arr1[0]); //输出5
```
### 值类型

|有符号整数类型   |描述|范围| 默认值 |
|----|----|----|-----|
| sbyte | 8 位有符号整数类型 | -128 到 127 | 0 |
| short |16 位有符号整数类型| -32,768 到 32,767 | 0 |
|int| 32 位有符号整数类型 | -2,147,483,648 到 2,147,483,647 | 0 |
|long| 64 位有符号整数类型 | -9,223,372,036,854,775,808 到 9,223,372,036,854,775,807 | 0L |

|无符号整数| 描述 | 范围 | 默认值 |
|----|----|----|-----|
| byte | 8 位无符号整数 | 0 到 255 | 0 |
| ushort | 16 位无符号整数类型 | 0 到 65,535 | 0 |
| uint | 32 位无符号整数类型 | 0 到 4,294,967,295 | 0 |
| ulong | 64 位无符号整数类型 | 0 到 18,446,744,073,709,551,615 | 0 |

|浮点数|描述| 范围 | 默认值 |
|----|----|----|-----|
| float | 32 位单精度浮点型 | -3.4 x 1038 到 + 3.4 x 1038 | 0.0F |
| double | 64 位双精度浮点型 | (+/-) 5.0 x 10-324 到 (+/-) 1.7 x 10308 | 0.0D |
|decimal| 128 位精确的十进制值，28-29 有效位数 | (-7.9 x 1028 到 7.9 x 1028) / 100 到 28 | 0.0M |

|其他类型| 描述 | 范围 | 默认值 |
|----|----|----|-----|
| char | 16 位 Unicode 字符 | U +0000 到 U +ffff | '\0' |
| bool |8 位布尔值| True 或 False | False |

1. c# 中的小数默认为 double 类型，所以声明 float 时末尾加 f (或大写 F)显示表示 ：
```cs
float a = 0.1654646f;
```
2.  `sizeof()` 返回**值类型**变量的大小（字节）
3. **保留指定小数位数**
```cs
//语法：
//{变量：0.00}  保留两位
double n1 = 3.33333;
Console.WriteLine($"{n1:0.00}");

输出：3.33
```

### 引用类型

|C# 类型关键字|. NET 类型|
|---|---|
|object|System. Object|
|string|System. String|
|dynamic |System. Object|

在上表中，左侧列中的每个类型关键字（dynamic 除外）都是相应 .NET 类型的别名。它们是可互换的。例如，以下声明声明了相同类型的变量： 
```cs
int a = 123;
System.Int32 b = 123;
```

### 结构体 struct

```cs
 public struct Person
{
    public string _name;  //字段前要加_，用来区分变量
    public int _age;
    public char _gender;
    
    void Speak()
    {
    ...
    }
}
```

 > [!summary] 结构体和类的区别
>**概述：**
> 1. 结构体和类最大的区别是在存储空间上的，因为结构体是值，类是引用，因此他们的存储位置一个在栈上，一个在堆上，
>2. 结构体和类在使用上很类似，结构体甚至可以用面向对象的思想来形容一类对象。
>3. 结构体具备着面向对象思想中封装的特性，但是它**不具备继承和多态的特性，由于结构体不具备继承的特性，所以它不能够使用 protected 访问修饰符**
>4. 特别的，结构体可以继承接口，因为接口是行为的抽象
>
>
>**细节：**
>1. 结构体是值类型，类是引用类型
>6. 结构体存在栈中，类存在堆中
>7. 结构体成员不能使用 protected 访问修饰符，而类可以
>8. 结构体成员变量声明不能指定初始值，而类可以
>9. 结构体不能声明无参的构造函数，而类可以
>10. 结构体申明有参构造函数后，无参构造不会被顶掉
>11. 结构体不能申明析构函数，而类可以
>12. 结构体不能被继承, 而类可以
>13. 结构体需要在构造函数中初始化所有成员变量，而类随意
>14. 结构体不能被静态 static 修饰 (不存在静态结构体)，而类可以
>15. 结构体不能在自己内部申明和自已一样的结构体变量, 而类可以

> [!info] 如何选择结构体和类
>1. 想要用继承和多态时，使用类，比如玩家、怪物等等
>2. 对象是数据集合时，优先考虑结构体，比如位置、坐标等等
>3. 从值类型和引用类型赋值时的区别上去考虑，比如经常被赋值传递的对象，并且改变赋值对象，原对象不想跟着变化时，就用结构体。比如坐标、向量、旋转等等

### string
```cs
// 字符串本质是char数组
string str = "test";
Console.WriteLine(str[0]);

// 转为char数组
char[] chars = str.ToCharArray();
Console.WriteLine(chars[0]);
```
#### 具有值类型特征
string 虽然是引用类型，但他有值类型的特征，每次重新赋值或拼接时会分配新的内存空间。
```c++
string str1 = "123"
string str2 = str1;

//若改变str2, str1不会发生改变,str2会在堆中重新分配空间
str2 = "321";
//因此，频繁对string赋值会产生内存垃圾
```
![[Pasted image 20230526153510.png|350]]

#### 字符串类型拼接方式
1. "+" "+="号，不能用其他运算符
2. `string. Format ("待拼接的内容",内容 1,内容 2，......)`
   使用占位符 `{数字}` 控制拼接顺序
```cs
string s = string.Format("我是{0},我今年{1}岁,我喜欢{2}","小明","16","玩游戏");
Console.WriteLine(s);

// 等价
Console.WriteLine(string.Format("我是{0},我今年{1}岁,我喜欢{2}","小明","16","玩游戏"));
```
3. `$` 替代 `string.format()` 
   原先赋值需要占位符和变量，当需要拼接多个变量会造成语句过长等不易理解问题，`$` 可以把字符串中的变量 `{}` 包含起来达到识别变量的目的 `$"{id}"`；也支持表达式，使用 `$"{(你的表达式)}"`
```cs
var k = "a";  
var a0 = "User";  
var a1 = "Id";  
var a2 = 5;  
  
var ccb = $"select * from {a0} where {a1}={a2}";
//等价
var ccc = string.Format("select * from {0} where {1} = {2}", a0, a1, a2);
```
#### 字符串方法
##### 查找字符位置
```cs title:IndexOf查找字符位置
// 尽管搜索方向不一样，但是字符下标依然从左向右加1，从0开始。

// 正向查找字符位置 从左到右
string str = "这是一句话";
int index1 = str.IndexOf("是");  //返回字符"e"在字符串中的索引，若查不到则返回-1

// 反向查找字符位置 从右到左
int index2 = str.LastIndexOf("是");

```
##### 移除字符
```cs title:Remove移除指定位置后的字符
string str = "这是一句话";

//单参数
str = str.Remove(2);  //注意string的很多方法不会改变原字符串，都要存在一个新的字符串中或者重新赋值
Console.WriteLine(str);
//输出：这是


//指定两个参数进行移除
str = str.Remove(1,3);
Console.WriteLine(str);
//输出：这话
```
##### 替换字符
```cs title:Replace替换字符
string str = "这是一句话";
str = str.Replace("一句话", "歌词");
Console.WriteLine(str);
//输出：这是歌词
```
##### 大小写转换
```cs
string str = "abcdefg";
str = str.ToUpper();  //转大写
Console.WriteLine(str);
//输出ABCDEFG

str = str.ToLower();  //转小写
```
##### 字符串截取
```cs title:Substringj截取字符串
string str = "abcdefg";

//截取从指定位置开始之后的字符串
//单参数
str = str.Substring(2);
//输出cdefg

//双参数指定范围
str = str.Substring(1,3);
//输出bcd
```
##### 字符串切割
```cs title:Split切割字符串
string str = "a|b|c|d|e|f|g";

string[] strs = str.Split(new char[] { '|' }); //指定切割符号
for(int i = 0; i < strs.Length; i++) 
{
    Console.WriteLine(strs[i]);
}


//输出：
a
b
c
d
e
f
g
```

#### StringBuilder
- **用于处理字符串的公共类**
- **主要解决的问题**：**修改字符串而不创建新的对象,** 需要频繁修改和拼接的字符串可以使用它，可以提升性能
- 使用前需要引用命名空间 `using System.Text;`
```cs
using System.Text;

//初始化，直接指明内容
StringBuilder str = new StringBuilder("0123456");
//StringBuilder str = new StringBuilder("0123456",100); 使用第二个参数可以指定初始容量
Console.WriteLine(str.ToString());

//StringBuilder会自动扩容
//获得容量
Console.WriteLine(str.Capacity);
//获得字符长度
Console.WriteLine(str.Length);

//增
str.Append(' ');
str.AppendFormat("{0}{1}", 7, 8);

//删
str.Remove(0, 10);
str.Clear();

//改
str[0] = 'a';

//查
Console.WriteLine(str[0]);

//插
str.Insert(0, "test");

//替换
str.Replace("1", "A");

// 判断相等
if(str.Equals("A")) { }

```

**string 和 StringBuilder 的区别**
1. string 相对 StringBuilder 更容易产生垃圾，每次修改拼接都会产生垃圾
2. string 相对 StringBuilder 更加灵活因为它提供了更多的方法供使用

**如何选择？**
1. 需要频繁修改拼接的字符串可以使用 StringBuilder
2. 需要使用 string 独特的一些方法来处理一些特殊逻辑时可以使用 string

> [!NOTE] 如何优化内存
>内存优化从两个方面去解答
>1. 如何节约内存
>2. 如何尽量少的 GC (垃圾回收)？
>
>答案：
   > -   少 new 对象少产生垃圾
>    -   合理使用 static
>      - 合理使用 string 和 stringbuilder


###  万物之父 Object 类
关键字：`object`

**概念：**
object 是**所有类型的基类**，它是一个类 (引用类型)

**作用：**
1. 可以利用里氏替换原则，用 object 容器装所有对象
2. 可以用来表示不确定类型，作为函数参数类型

#### 用法
```cs title:object类
// 上文讲过的里氏替换
Father f = new Son();
if (f is Son)
{
    (f as Son).Speak();
}

//使用object类
//引用类型
object o = new Son();
if (o is Son)
{
    (o as Son).Speak();
}

//值类型
object o2 = 10.0f;     //装箱
float f2 = (float)o2;  //拆箱，强转

//string
object ostr = "123123";
string str1 = ostr.ToString();
string str2 = ostr as string; //建议引用类型都用as的方式

//数组
object oarr = new int[10];
int[] arr1 = (int[])oarr;
int[] arr2 = oarr as int[];


public class Father
{
    
}

public class Son : Father
{
    public void Speak()
    {
        Console.WriteLine("Hello world!");
    }
}
```

#### 装箱拆箱
**发生条件**
1. 用 object 存值类型（装箱)
2. 再把 object 转为值类型 (拆箱)

**装箱**
- 把值类型用引用类型存储，如 `object o = 10.0f;`
- 栈内存会迁移到堆内存中

**拆箱**
- 把引用类型存储的值类型取出来，如 `float f = (float)o;`
- 堆内存会迁移到栈内存中

**好处:** 不确定类型时可以方便参数的存储和传递
**坏处:** 存在内存迁移，增加性能消耗
#### object 的方法
![](1684809113607.png)  

##### 静态方法
1.  `Equals`： 判断两个对象是否相等
最终的判断权，交给左侧对象的 Equals 方法，
不管值类型引用类型都会按照左侧对象 Equals 方法的规则来进行比较

2.  `ReferenceEquals`：比较两个对象是否是相同的引用，主要是用来比较引用类型的对象。值类型对象返回值始终是 false。
##### 成员方法
1. 普通方法 `GetType`
- 该方法在反射相关知识点中是非常重要的方法，之后我们会具体的讲解这里返回的 Type 类型。
- 该方法的主要作用就是获取对象运行时的类型 Type,
- 通过 Type 结合反射相关知识点可以做很多关于对象的操作。

2. 普通方法 `Memberwiseclone`
- 该方法用于获取对象的浅拷贝对象，口语化的意思就是会返回一个新的对象, 但是新对象中的引用变量会和老对象中一致。

##### 虚方法
1.  `Equals`
- 默认实现还是比较两者是否为同一个引用，即相当于 `ReferenceEquals`。
- 但是微软在所有值类型的基类 `system. ValueType` 中重写了该方法, 用来比较值相等。
- 我们也可以重写该方法，定义自己的比较相等的规则
 
2.  `GetHashcode`
- 该方法是获取对象的哈希码
- 一种通过算法算出的，表示对象的唯一编码，不同对象哈希码有可能一样，具体值根据
- 我们可以通过重写该函数来自己定义对象的哈希码算法，正常情况下，我们使用的极少

3.  `ToString`
- 该方法用于返回当前对象代表的字符串，我们可以重写它定义我们自己的对象转字符串规则，
- 该方法非常常用。当我们调用打印方法时，默认使用的就是对象的 Tostring 方法后打印出来的内容。

## 特殊类型
### 常量

```cs
const 变量类型 变量名 = 值
const int a = 1；
```

- ? 常量是特殊的静态 static？
- **const (常量)可以理解为特殊的 static (静态)**
- **相同点**
他们都可以通过类名点出使用
- **不同点**
    1. const 必须初始化，不能修改， static 没有这个规则
    2. const 只能修饰变量、static 可以修饰很多
    3. const 一定是写在访问修饰符后面的，static 没有这个要求
### 随机数

```cs
//1. 创建能够产生随机数的对象
Random r = new Random();
//2. 让产生随机数的这个对象调用方法来产生随机数
r.Next(); //生成一个非负的随机数  
r.Next(100); //生成[0,99)的随机数  
r.Next(5,100); //生成[5,99)的随机数
```

### 枚举

```cs title:声明枚举
// 声明枚举
public enum 枚举名
{
    值1, //默认值为0，后面依次递增
    值2,
    值3,
    ......
    值n  //最后一个逗号可加可不加
}

```

- 枚举通常声明到 namespace 的下面，class 的外面，表示这个命名空间下，所有的类都可以使用这个枚举。
- 不可以在函数中声明

```cs title:枚举搭配switch使用：
namespace ConsoleApp1
{
    enum EPlayer
    {
        singer,
        writer,
        teacher,
        student
    }
    
    internal class Program
    {
        static void Main(string[] args)
        {
            EPlayer Player1 = EPlayer.singer; //定义枚举变量
            
            switch (Player1)
            {
                case EPlayer.singer:
                    ...
                    break;
                case EPlayer.student:
                    ...
                    break;
                default:
                    break;
            }
        }
    } 
}
```

```cs title:枚举类型转换
EPlayer Player = EPlayer.singer;  
// 枚举转int  
int i = (int)Player;  
// int转枚举  
Player = 0;  
// 枚举转string  
string str = Player.ToString();  
// string转枚举  
Player = (EPlayer)Enum.Parse(typeof(EPlayer), "teacher"); // 注意第二个变量值必须是枚举声明中的成员
```

### 数组
数组**声明后不可以改变长度**，若想在原数组的基础上进行收缩，需要新建一个数组，将值复制到新数组。
#### 一维数组
```cs title:一维数组的声明
int[] nums;  //只声明不初始化
int[] nums = new int[5]; //全部为默认值0

// 以下方式等价
int[] nums = new int[]{1,2,3,4,5};
int[] nums = new int[5]{1,2,3,4,5};
int[] nums = {1,2,3,4,5};
```

```cs title:一维数组方法
int len = nums.Lenght()  //数组长度
```

```cs title:增加和减少数组中的元素
//增加数组中的元素
int[] array = { 1, 2, 3, 4, 5 };
int[] array1 = new int[10];
for (int i = 0; i < array.Length; i++)
{
    array1[i] = array[i];
}
array = array1;  //最后将新数组赋值给旧数组

//遍历打印array结果为
//1，2，3，4，5，0，0，0，0，0

//j减少数组中的元素
int[] array = {1,2,3,4,5,6,7,8,9,10};
int[] array2 = new int[5];
for (int i = 0; i < array2.Length; i++)
{
    array2[i] = array[i];
}
array = array2;

//遍历打印array结果为
//1，2，3，4，5

``` 

#### 二维数组
```cs title:二维数组的声明
int[,] nums;  //只声明不初始化
int[,] nums = new int[3,3]; //全部为默认值0

// 以下方式等价
int[,] nums = new int[,]{{1,1,1},
                           {2,2,2},
                           {3,3,3}};
                           
int[,] nums = new int[3,3]{{1,1,1},
                           {2,2,2},
                           {3,3,3}};
                           
int[,] nums = {{1,1,1},
               {2,2,2},
               {3,3,3}};
```

```cs title:二维数组方法
nums.GetLength(0) //获取行数
nums.GetLength(1) //获取列数
```
#### 交错数组
不常用，和二维数组的区别在于，每行的列数可以不同
```cs   title:交错数组的声明
int[][] arr1;
int[][] arr2 = new int[3][];


int[][] arr3 = new int[][]
            {
                new int[] { 1 },
                new int[] { 1, 2 },
                new int[] { 1, 2, 3 }
            };
            
int[][] arr4 = new int[3][]
            {
                new int[] { 1 },
                new int[] { 1, 2 },
                new int[] { 1, 2, 3 }
            };
            
int[][] arr5 = 
            {
                new int[] { 1 },
                new int[] { 1, 2 },
                new int[] { 1, 2, 3 }
            };
```


```c++ title:交错数组方法
nums.GetLength(0) //获取行数
nums[0].Length(1) //获取某一行的列数
```
## 集合类（Collection）

集合（Collection）类是专门用于数据存储和检索的类。这些类提供了对栈（stack）、队列（queue）、列表（list）和哈希表（hash table）的支持。大多数集合类实现了相同的接口。

集合（Collection）类服务于不同的目的，如为元素动态分配内存，基于索引访问列表项等等。**这些类创建 Object 类的对象的集合**。在 C# 中，Object 类是所有数据类型的基类。
 
下面是各种常用的 **System. Collection** 命名空间的类：

### ArrayList （动态数组）
**ArrayList 和数组的区别**
ArrayList：长度可以随意改变，可以存储任意类型的数据
数组：长度不可变，类型单一

每次集合中实际包含的元素个数 (count)超过了可以包含的元素的个数 (capcity)的时候，集合就会向内存中申请**多开辟一倍**的空间，来保证集合的长度一直够用。

ArrayList 中的元素都存储为 `object` 类型（可以存储任何类型数据），存在装箱拆箱的损耗，所以 ArrayList 尽量少用。**用 List 即可！**

```cs
ArrayList array = new ArrayList();

//增
array.Add(1); //添加单个元素：list.Add();
array.Add(2.1);
array.Add(true);
array.Add("张三");

array.AddRange(new int[] { 1, 2, 3, 4, 5 });  //添加集合：list.AddRange();
array.insert(1,"李四"); //插入指定位置

//删
array.Remove("张三"); //指定删除单个元素
array.RemoveAt(0); //根据指定位置单个元素
array.RemoveRange(0，n); //（从下标0开始删除n个）
array.Clear(); //清空所有元素

//查
array[0];  //按下标查找
array.Contains("张三"); //查看元素是否存在

// 尽管搜索方向不一样，但是字符下标依然从左向右加1，从0开始。
array.IndexOf("张三");      //从左往右查找，找到返回下标，找不到返回-1
array.LastIndexOf("张三");  //从右往左查找，找到返回下标，找不到返回-1

//改
array[0] = "李四"; //通过下标改
array.Sort(); //升序排列
array.Reverse(); //反转

```

```cs title:遍历
array.Count;   //元素数量

//使用迭代器遍历
foreach (var item in array)
{
    Console.WriteLine(array[item]);
}
```
### Stack
栈，先进后出

```cs
Stack stack = new Stack();

//压栈  
stack.Push("1");  
  
//出栈  
stack.Pop();

//查
//栈无法查看指定位置的元素,只能查看栈顶的内容  
s = stack.Peek(); //注意只是查看，不是出栈  
stack.Contains("1"); //查看元素是否存在于栈中  
stack.Count; //栈的长度

//改
stack.Clear(); //清空栈  
```

```cs title:遍历
//栈不能使用[]访问，所以无法使用for循环遍历，一般使用foreach
foreach (var item in stack)
{
    Console.WriteLine(item);
}

//另一种方式
//将队列转换为object数组
object[] array = stack.ToArray();
for(int i =0;i<array.Length;i++)
{
    Console.WriteLine(array[i]);
}

//循环出栈
while (stack.Count>0)
{
    object p = stack.Pop();
}
```
### Queue
队列，先进先出
```cs 
Queue queue = new Queue();

//入队
queue.Enqueue("1");   、
//出队
queue.Dequeue();

//查
queue.Peek();  //查看队列头元素但不会移除  
queue.Contains("1"); //查看队列中是否包含某个元素  
queue.Count;//队列长度  

//改
queue.Clear();  //清空队列  
```

```cs title:遍历
//队列不能使用[]访问，所以无法使用for循环遍历，一般使用foreach
foreach (var item in queue)
{
    Console.WriteLine(item);
}

//另一种方式
//将队列转换为object数组
object[] array = queue.ToArray();
for(int i =0;i<array.Length;i++)
{
    Console.WriteLine(array[i]);
}

//循环出队
while (queue.Count > 0)  
{  
    object v5 = queue.Dequeue();  
}
```

### Hashtable
哈希表（又称散列表），键值对
```cs title:增删查改
Hashtable hashtable = new Hashtable();

//增：键不能相同  
hashtable.Add(1, "value1");  
hashtable.Add("key", "value2");  
hashtable.Add(true, "value3");、

//删
hashtable.Remove(1);   //根据键删除  
hashtable.Clear();

//查
hashtable["2"];  //根据键查找值，如果键不存在，返回 null  
hashtable.ContainsKey("key");  //判断是否包含某个键  
hashtable.ContainsValue("value4");  //判断是否包含某个值  
hashtable.Count; //获取键值对数量  

//改
hashtable["key"] = "value4";  //根据键修改
```

```cs title:遍历
//遍历所有键
ICollection keys = hashtable.Keys;  //获取键的集合
foreach (var item in keys) 
{
    Console.WriteLine(item);
}

//遍历所有值
ICollection values = hashtable.Values; //获取值的集合
foreach (var item in values)
{
    Console.WriteLine(item);
}

//键值对一起遍历
foreach (DictionaryEntry item in hashtable)
{
    Console.WriteLine(item.Key + ":" + item.Value);
}

//迭代器遍历
IEnumerator enumerator1 = hashtable.GetEnumerator();
while (enumerator1.MoveNext())
{
    DictionaryEntry item = (DictionaryEntry)enumerator1.Current;
    Console.WriteLine(item.Key + ":" + item.Value);
}

IDictionaryEnumerator enumerator2 = hashtable.GetEnumerator();
while (enumerator2.MoveNext())
{
    Console.WriteLine(enumerator2.Key + ":" + enumerator2.Value);
}
```

## 泛型数据结构类
泛型数据结构类和集合类区别：
1. 泛型数据结构类可以**指定泛型类型**，避免了装箱拆箱的性能损耗
2. 集合类数据类型都是 Object 类型，有装箱拆箱的性能损耗
### List<>

本质是一个**可变类型的泛型数组**，和 ArrayList 主要区别在于可以指定泛型类型，避免了装箱拆箱的性能损耗
 
```cs title:增删查改
List<int> list = new List<int>();

//增

list.Add(1);//添加单个元素
list.AddRange(new int[] { 2, 3, 4 });//添加集合
list.Insert(1, 66);//插入指定位置

//删
list.Remove("张三"); //指定删除单个元素
list.RemoveAt(0); //根据指定位置单个元素
list.RemoveRange(0，n); //（从下标0开始删除n个）
list.Clear(); //清空所有元素

//查
list[0];  //按下标查找
list.Contains(1); //查看元素是否存在
list.Count;   //list长度
// 尽管搜索方向不一样，但是字符下标依然从左向右加1，从0开始。
list.IndexOf(1);      //从左往右查找，找到返回下标，找不到返回-1
list.LastIndexOf(1);  //从右往左查找，找到返回下标，找不到返回-1

//改
list[0] = 1; //通过下标改
list.Reverse(); //反转
```

```cs title:遍历
//使用迭代器遍历
foreach (var item in list)  
{  
    Console.WriteLine(item);  
}  
  
//for循环遍历  
for (int i = 0; i < list.Count; i++)  
{  
    Console.WriteLine(list[i]);  
}
```

#### List 的排序
内置变量一般通过 Sort 方法进行进行排序，自定义类则需要自己写方法。
```cs
list.Sort(); //升序排列
```
##### 自定义类的排序

1. 继承 `IComparable<Item>` 接口
2. 实现接口的方法 `CompareTo(Item other)` 方法

```cs title:自定义类的排序
class Item : IComparable<Item> //继承IComparable接口
{
    public int money;
    
    public Item(int money)
    {
        this.money = money;
    }

    public int CompareTo(Item other)  //实现接口的方法
    {
        //返回值的含义
        // <0：放在传入对象的前面
        // =0：保持当前的位置不变
        // >0：放在传入对象的后面
        
        //可以简单理解传入对象的位置就是0
        //返回负数就放在它的左边，也就是前面
        //返回正数就放在它的右边，也就是后面
        
        //以下实现类的升序排序
        if (this.money > other.money) //如果当前对象的money大于传入对象的money
        {
            return 1; //返回正数，放在传入对象的后面
        }
        else if (this.money == other.money) //如果当前对象的money等于传入对象的money
        {
            return 0; //返回0，保持当前位置不变
        }
        else //如果当前对象的money小于传入对象的money
        {
            return -1; //返回负数，放在传入对象的前面
        }
    }
}

class Program
{
    static void Main(string[] args)
    {
        //自定义类的排序
        List<Item> itemList = new List<Item>();
        
        itemList.Add(new Item(10));
        itemList.Add(new Item(25));
        itemList.Add(new Item(13));
        itemList.Add(new Item(40));
        itemList.Sort();
        
        for(int i =0;i<itemList.Count;i++)
        {
            Console.WriteLine(itemList[i].money);
        }
    }
}

//输出
//10
//13
//25
//40
```
##### 通过委托函数排序
```cs

class Item
{
    public int money;
    
    public Item(int money)
    {
        this.money = money;
    }
}


class Program
{
    static void Main(string[] args)
    {
        //自定义类的排序
        List<Item> itemList = new List<Item>();
        
        itemList.Add(new Item(10));
        itemList.Add(new Item(25));
        itemList.Add(new Item(13));
        itemList.Add(new Item(40));
        itemList.Sort(SortItem);   //传入一个委托,委托的参数为两个对象,返回值为int
        // 也可以使用匿名函数简化
        // itemList.Sort((Item a, Item b) => {  if (a.money > b.money)
        //     {
        //         return 1;
        //     }
        //     else if (a.money == b.money)
        //     {
        //         return 0;
        //     }
        //     else
        //     {
        //         return -1;
        //     }     });  
        
        for(int i =0;i<itemList.Count;i++)
        {
            Console.WriteLine(itemList[i].money);
        }
        
        //以下实现类的升序排序
        static int SortItem(Item a, Item b)
        {
            //传入的两个对象为列表中的两个对象
            //进行两两的比较,用左边的和右边的条件比较
            //返回值规则和之前一样, 0做标准,负数在左（前),正数在右（后)
            if (a.money > b.money)
            {
                return 1;
            }
            else if (a.money == b.money)
            {
                return 0;
            }
            else
            {
                return -1;
            }    
        }
    }
}

//输出
//10
//13
//25
//40
```
### Dictionary<>
字典，可以将 `Dictionary` 理解为拥有**泛型的 `Hashtable`**，它也是基于键的哈希代码组织起来的键/值对，**键值对类型从 Hashtable 的 object 变为了可以自己制定的泛型**

```cs title:增删查改
Dictionary<int,string> dictionary = new Dictionary<int, string>();

//增：键不能相同  
dictionary.Add(1, "one");

//删：根据键删除 
dictionary.Remove(1);
dictionary.Clear();

//查
string v1 = dictionary[1];  //通过建获取值如果，不存在会抛出异常

//通过TryGetValue获取值
string v2;
if (dictionary.TryGetValue(1, out v2))
{
    //存在
}

dictionary.ContainsValue("one")  //判断是否包含某个键  
dictionary.ContainsKey(1)  //判断是否包含某个值  
dictionary.Count  //获取键值对数量  

//改
dictionary[1] = "ONE";  //根据键修改
```

```cs title:遍历
//遍历所有键
foreach (int key in dictionary.Keys)
{
    Console.WriteLine(key);
}

//遍历所有值
foreach (string value in dictionary.Values)
{
    Console.WriteLine(value);
}

//键值对一起遍历
foreach (KeyValuePair<int, string> item in dictionary)
{
    int key = item.Key;
    string value = item.Value;
}

//迭代器遍历
IEnumerator<KeyValuePair<int, string>> enumerator = dictionary.GetEnumerator();
while (enumerator.MoveNext())
{
    KeyValuePair<int, string> item = enumerator.Current;
    int key = item.Key;
    string value = item.Value;
}
```

### LinkedList<> 和 LinkedListNode<>
`LinkedList` 本质是一个**可变类型的泛型双向链表**
`LinkedListNode` 是**链表节点类**

```cs title:增删查改
LinkedList<int> linkedList = new LinkedList<int>();  
LinkedListNode<int> first = linkedList.First; //获取头节点  
LinkedListNode<int> last = linkedList.Last; //获取尾节点  
  
//增  
linkedList.AddLast(1); //尾部添加  
linkedList.AddFirst(2); //头部添加  
linkedList.AddAfter(first, 3); //指定节点后添加  
linkedList.AddBefore(first, 4); //指定节点前添加  
  
//删  
linkedList.Remove(1); //删除指定元素  
linkedList.RemoveFirst(); //删除头部元素  
linkedList.RemoveLast(); //删除尾部元素  
linkedList.Remove(first); //删除指定节点  
linkedList.Clear(); //清空链表  
  
//查  
linkedList.Contains(1); //是否包含指定元素  
LinkedListNode<int> node1 = linkedList.Find(1); //查找指定元素  
LinkedListNode<int> node2 = linkedList.FindLast(1); //查找最后一个指定元素

//改  
//要先得到再改，得到节点，再改变其中的值  
LinkedListNode<int> node3 = linkedList.Find(1);  
node3.Value = 2;
```

```cs title:b遍历
//通过foreach遍历
foreach (var item in linkedList)
{
    Console.WriteLine(item);
}

//通过节点遍历 
//从头到尾
LinkedListNode<int> first = linkedList.First;
while (first != null)
{
    Console.WriteLine(node.Value);
    node = node.Next;
} 

//从尾到头
LinkedListNode<int> last = linkedList.Last;
while (last != null)
{
    Console.WriteLine(node4.Value);
    node4 = node4.Previous;
}
```

### Stack<>
栈，先进后出

```cs
Stack<int> stack = new Stack<int>();

//压栈  
stack.Push("1");  
  
//出栈  
stack.Pop();

//查
//栈无法查看指定位置的元素,只能查看栈顶的内容  
s = stack.Peek(); //注意只是查看，不是出栈  
stack.Contains("1"); //查看元素是否存在于栈中  
stack.Count; //栈的长度

//改
stack.Clear(); //清空栈  
```

```cs title:遍历
//栈不能使用[]访问，所以无法使用for循环遍历，一般使用foreach
foreach (var item in stack)
{
    Console.WriteLine(item);
}

//另一种方式
//将队列转换为object数组
object[] array = stack.ToArray();
for(int i =0;i<array.Length;i++)
{
    Console.WriteLine(array[i]);
}

//循环出栈
while (stack.Count>0)
{
    object p = stack.Pop();
}
```
### Queue<>
队列，先进先出
```cs 
Queue<int> queue = new Queue<int>();

//入队
queue.Enqueue("1");   、
//出队
queue.Dequeue();

//查

queue.Peek();  //查看队列头元素但不会移除  
queue.Contains("1"); //查看队列中是否包含某个元素  
queue.Count;//队列长度  

//改
queue.Clear();  //清空队列  
```

```cs title:遍历
//队列不能使用[]访问，所以无法使用for循环遍历，一般使用foreach
foreach (var item in queue)
{
    Console.WriteLine(item);
}

//另一种方式
//将队列转换为object数组
object[] array = queue.ToArray();
for(int i =0;i<array.Length;i++)
{
    Console.WriteLine(array[i]);
}

//循环出队
while (queue.Count > 0)  
{  
    object v5 = queue.Dequeue();  
}
```

# 二、函数（方法）

```cs
pubilc static 返回值类型 函数名（参数列表）
{
	函数体;
}
//public：访问修饰符
//static：静态的
//返回值类型：如果不需要写返回值，写void
//方法名：Pascal 每个单词首字母都大写
//参数列表：完成这个方法所必须要提供给这个方法的条件
    
 public static int GetMax(int n1, int n2)
{
    return n1> n2 ? n1 : n2;
}
```

## ref 和 out 参数  
#ref #out
他们使用的方式和效果都是一样：
1. **解决值类型和引用类型在函数内部改值**
2. 重新声明能够影响外部传入的变量，让其也被修改（使传入的参数在函数外也修改 ）


**ref 和 out 的区别：**  
1. ref 传入的变量 (参数) 必须初始化，out 不用。  
2. out 传入的变量必须在内部赋值，ref 不用。  

```cs title:ref参数
static void ChangeValue (int a)
{
    a = 20;
}

int b = 10
ChangeValue(b); 
//因为值传递的原因，b的值没有改变，我们想让b被改成20可以使用ref：

//参数前添加 ref 修饰符 
static void ChangeValue (ref int a)
{
    a=20;
}
int b = 10
ChangeValue(b);
//b改变为20 在函数内修改传入参数 传入的参数在外部也会修改

``` 

如果你在一个方法中，返回多个相同类型的值的时候，可以考虑返回一个数组。
但是，如果返回多个不同类型的值的时候，返回数组就不行了，那么这个时候，
我们可以考虑使用 out 参数。**out 参数就侧重于在一个方法中可以返回多个不同类型的值。**

```cs title:out参数
public static void Test(int[]nums,out int max.out int min,out int sum,out float avr)
//out int max写到形参列表中
{
    max = nums[0];
    min = nums[1];
    sum = 0;
    avr = sum / nums.Length;
}

//外部调用：
Test（nums,out max,out min,out sun,out avr）;
```

## params 可变参数

- 可以输入不定的多个参数，并把这些参数存入数组。将实参列表中跟可变参数数组类型一致的元素都当做数组的元素去处理。
- 在函数参数中只能最多出现一个 `params` 关键字且一定在形参列表最后  

```cs
// 未使用可变参数：
 static void Main(string[] args)
{
    int[] s = { 100, 80, 95 };
    Test("张三", s);   //主要区别再第二个参数这里
    Console.ReadKey();
}

public static void Test (string name, int[] score)
{
    int sum = 0;
    for(int i=0;i<score.Length;i++)
    {
        sum += score[i];
    }
    Console.WriteLine($"{name}这次考试总成绩是{sum}");
}

//改用params后：
 static void Main(string[] args)
{
   // int[] s = { 100, 80, 95 };
    Test("张三", 100, 80, 95); //可变长度，可以增加其他成绩
    Console.ReadKey();
}

public static void Test (string name, params int[] score)
{
    int sum = 0;
    for(int i=0;i<score.Length;i++)
    {
        sum += score[i];
    }
    Console.WriteLine($"{name}这次考试总成绩是{sum}");
}
```
## 可选参数
**有参数默认值的参数一般称为可选参数**
作用是当调用函数时可以不传入参数，不传就会使用默认值作为参数的值
```cs
static void Speak (string str == "hello")
{
    Console.WriteLine (str);
}
```
- 支持多个参数默认值
- 可选参数必须写在普通参数后面
## 函数重载

概念：方法的重载指的就是**方法的名称相同，但是参数不同**。
**参数不同，分为三种情况**
1. 如果参数的个数相同，那么参数的类型就不能相同。
2. 果参数的类型相同，那么参数的个数就不能相同。
3. 参数顺序不同

```cs
public static void M (int n1,int n2)
{
    int result = n1 + n2;
}

public static double M(double d1,double d2)
{
    return d1 + d2;
}

public static void M(int n1,int n2,int n3)
{
    int result = n1 + n2 + n3;
}

public static string M(string s1,string s2)
{
    return s1 + s2;
}
```

# 三、表达式和运算符
## 转义字符
1. 换行 `\n`  ：(windows 操作系统只认识 `\r\n`，不认识 `\n`)
2. 英文半角双引号：`\"\"`  中文半角可以直接打印出
3. 一个 Tab 空格: `\t`
4. 警报音：`\a`
5. 退格：`\b`
6. 斜杠：`\\ `
7.  `@` ：取消转义符的作用（用来存路径）/将字符串按照原格式输出

```cs
string a = @"C：\mycode\a\文件.txt";
```

## 逻辑运算符
逻辑与：&&
逻辑或：||
逻辑非：！

运算符优先级：
1. **非**优先级最高
2. 逻辑**与**优先级大于逻辑**或**
3. **逻辑与**、**逻辑或**优先级**低**于算术运算符和条件运算符
## 位运算符
位运算符主要用数值类型进行计算，将数值转换为 2 进制，在进行位运算

1. 位与：&
对位运算，有 0 则 0
```cs
int a = 1; //001
int b = 5; //101
int c = a & b;
//得 c = 1  //001
```

2. 位或：|
对位运算，有 1 则 1

3. 异或：^
对位运算，相同为 0，不同为 1

4. 位取反：~
对位运算，0 变 1，1 变 0
5. 左移：<<
6. 右移：>>
让一个数的 2 进制数进行左移和右移
- 左移几位，右侧就加几个 0
```c++
a = 5; // 101
c = a << 5 
// 1位 1010
// 2位 10100
// 3位 101000
// 4位 1010000
// 5位 10100000 = 160
```
- 右移几位，右侧去掉几个数
```cs
a = 5;  // 101
c = a >> 2;
// 1位 10
// 2位 1
```

## 运算符重载

> [!success] 可重载运算符
> 算数运算符： + - * / % ++ --  
>
逻辑运算符： ！  
>
位运算符： & | ^ ~ << >>  
>
条件运算符: < <= > >= == !=  

> [!error] 不可重载运算符
> 
逻辑运算符 ： && || [ ] () . = ?:  

**作用**
让自定义类和结构体，能够使用运算符

使用关键字 `operator`

**特点**
1. 一定是一个公共的静态方法 `public static` 
2. 返回值写在 `operator` 前
3. 逻辑处理自定义
   
**注意**
1. 条件运算符需要成对实现（比如 `==` 和 `!=` 必须成对实现）
2. 一个符号可以多个重载
3. 不能使用 `ref` 和 `out`

```cs title:语法
public static 返回类型 operator 运算符(参数列表)
```

```cs title:案例
Point p1 = new Point();
p1.x =1;
p1.y =1;
Point p2 = new Point();
p2.x= 2;
p2.y = 2;
Point p3 =p1 + p2; //使用重载的+
Console.WriteLine(p3.x);

class Point
{
    public int x;
    public int y;

    public static Point operator +(Point p1, Point p2)
    {
        Point p = new Point();
        p.x = p1.x + p2.x;
        p.y = p1.y + p2.y;
        return p;
    }
}
```

# 四、语句（控制流）

## 异常捕获

增加代码健壮性：哪行代码有可能出现异常，就 try 它。

语法：

```cs
try
{
    //可能出现异常的代码；
}
catch
{
    //出现异常后要执行的代码；
    //catch(Exception e)具体报错跟踪，通过e得到具体的错误信息
}
finally
{
    // （可选）最后执行的代码，不管有没有出错都会执行
}
//如果无异常，则catch内代码不会执行。如果出现异常，则后续代码不再执行，而是跳到catch的代码。（try-catch中间不能有其他代码）
// 注意三个语句后面不需要加;
```

我们使用编辑器自动实现一些函数时，IDE 会自动添加
```cs
private void Awake()
{
    throw new NotImplementedException();
}
```
意思是说明该方法未实现，如果运行会抛出异常。
##  foreach 循环

foreach 循环用于列举出集合中所有的元素，foreach 语句中的表达式由关键字 in 隔开的两个项组成。

in 右边的项是集合名，in 左边的项是变量名，用来存放该集合中的每个元素。

**该循环的运行过程**如下：每一次循环时，从集合中取出一个新的元素值。放到只读变量中去，如果括号中的整个表达式返回值为 true，foreach 块中的语句就能够执行。

一旦集合中的元素都已经被访问到，整个表达式的值为 false，控制流程就转入到 foreach 块后面的执行语句。

**foreach 语句经常与数组一起使用**，在 C# 语言中提供了 foreach 语句**遍历数组中的元素**，具体的语法形式如下。

```cs
foreach(数据类型 变量名 in 数组名)
{
  //语句块；
}

```

这里变量名的数据类型必须与数组的数据类型相兼容。

在 foreach 循环中，如果要输出数组中的元素，不需要使用数组中的下标，直接输出变量名即可。

**foreach 语句仅能用于数组、字符串或集合类数据类型。**

【实例】在 Main 方法中创建一个 double 类型的数组，并在该数组中存入 5 名学生的考试成绩，计算总成绩和平均成绩。
根据题目要求，使用 foreach 语句实现该功能，代码如下。
```cs

class Program
{
    static void Main(string[] args)
    {
        double[] points = { 80, 88, 86, 90, 75.5 };
        double sum = 0;
        double avg = 0;
        foreach(double point in points)
        {
            sum = sum + point;
        }
        avg = sum / points.Length;
        Console.WriteLine("总成绩为：" + sum);
        Console.WriteLine("平均成绩为：" + avg);
    }
}
```

在计算平均成绩时，通过数组的 Length 属性即可得到数组中元素的个数，使用总成绩除以元素的个数即为结果。

执行上面的语句，效果如下图所示。

![求总成绩和平均成绩](4-1Z320162532159.gif)

从上面的执行效果可以看出，在使用 foreach 语句时可以免去使用下标的麻烦，这也给遍历数组中的元素带来很多方便。

## 表达式主体成员 =>
通过表达式主体定义，可采用非常简洁的可读形式提供成员的实现。**只要任何支持的成员（如方法或属性）的逻辑包含单个表达式，就可以使用表达式主体定义**。表达式主体定义具有下列常规语法：
```cs
member => expression;
```
表达式主体定义可用于以下类型成员：
- [方法](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#methods)
- [只读属性](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#read-only-properties)
- [属性](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#properties)
- [构造函数](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#constructors)
- [终结器](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#finalizers)
- [索引器](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/expression-bodied-members#indexers)

### return 单句时可以用 `=>` 代替
```cs
public string Name
{
    get => "lk";
    set => Name = value;
}

public int Add(int a, int b) => a + b;

//注意和lambda表达式中的=>用法不同，后者可以用大括号包含完整逻辑
(参数列表)=>{ 函数逻辑 }
```

### 只读属性
只读属性可以将 `get` 访问器作为 expression-bodied 成员实现。在这种情况下，既不使用 `get` 访问器关键字，也不使用 `return` 关键字。

```cs
public string Name => locationName;
//相当于
public string Name { get=>locationName; }
```


# 五、面向对象 OOP
## 1 类 class

```cs
语法：
public class 类名
{
	字段;
	属性;
	方法;
}

//规范:每写一个类要新建一个类文件
```

```cs
//类：
public class Person
{
    public string _name;
    public int _age;
    public string _gender;

    public void CHLSS()
    {
        Console.WriteLine($"我叫{this._name},我今年{this._age}岁了，我性别是{this._gender}。");
//this:表示当前这个类的对象。类是不占内存的，而对象是占内存的。
    }
}

//类调用：
static void Main(string[] args)
{
    //类的实例化，使用关键字 new.
    Person sunQuan = new Person();
    sunQuan._name = "孙权";
    sunQuan._age = 23;
    sunQuan._gender = "男";
    sunQuan.CHLSS();

    // 以下都是空对象，没有申请堆空间，不可以访问成员变量和成员函数
    Person p1;  
    Person p2 = null; //等价
}
```

- 可以在类中声明一个和自己相同类型的成员变量，但**不能对类内部它进行实例化**

```cs
class person
{
    Person girlfriend;
    Person girlfriend = new Person(); //error!
    
    Person[] boyfriend;
}
```
- 成员变量的默认初始值
    - 值类型，数字类型默认为 0，bool 类型默认为 false
    - 引用类型，默认为 null
    - `default（类型）` 得到该类型的默认值

### 嵌套类
内部类，类中的类
```cs
Person p = new Person();
Person.Body body = new Person.Body(); // 实例化时指出外部类

class Person
{
    //人
    public int age;
    public string name;
    public Body body;
    
    public class Body
    {
        //身体
        Arm leftArm;
        public class Arm
        {
            //手臂
        }
    }
}
```
### 分部类 partial 
把一个类分成几部分申明

**关键字**：`partial`
 
**作用**
1. 分部描述一个类
2. 增加程序的拓展性

**注意**
1. 分部类可以写在多个脚本文件中，数据共享
2. 分部类的访问修饰符要一致
3. 分部类中不能有重复成员

```cs title:分布类
//可以理解为将Person类分开，两部分共同组成Person类，数据共享
public partial class  Person
{ }
public partial class  Person
{ }
```

**分部方法**：将方法的声明和实现分离

**特点**
1. 不能加访问修饰符，默认private
2. 只能在分部类中声明
3. 返回值只能是 void
4. 可以有参数但不用 out 关键字
```cs
public partial class  Person
{
    public bool sex;
    partial void Speak(); // 声明
}


public partial class Person
{
    public int number;

    partial void Speak() //实现
    {
        // 逻辑
    }
}
```
### 密封类 sealed 
**关键字**：`sealed `

密封类不能被继承，但可以继承其他父类

加强面向对象程序设计的规范性、结构性、安全性

```cs
public sealed class Person : Test
{ }
```

#### 密封方法
**概念**：用密封关键字 `sealed` 修饰的重写函数
**作用**：让虚方法或者抽象方法之后不能再被子类重写
**特点**：和 `override` 一起出现

```cs
public sealed overide void Eat()
{ }
```

## 2 访问修饰符
1. 不显式声明访问修饰符，则默认为 private
2. 分类：
`public`：公开的，可被类的内部外部访问（**可访问**可以理解为**可读写**）

`private`：私有的，只能在当前类的内部访问

`protected`：受保护的，只能在当前类的内部以及该类的子类中访问

`internal`：只能在当前项目中访问，在本项目中和 public 权限一样

`protected internal`：protected+internal

- 能够修饰类的访问修饰符：public，internal
- 子类的访问权限不能高于父类的访问权限，会暴露父类的成员
## 3 成员属性 get set
#get #set
1. **用于保护成员变量**  
2. **为成员属性的获取和赋值添加逻辑处理**  
3. **解决访问修饰符的局限性**
    - 访问修饰符只能同时控制读写，不能单独控制
    - 通过令属性的 get 或 set 为 private，可以让成员变量**在外部只能读不能写**或**只能写不能读**
4. **get 和 set 可以只有一个**
    - 既有 get ()也有 set ()我们诚之为可读可写属性。
    - 只有 get ()没有 set ()我们称之为只读属性
    - 没有 get ()只有 set ()我们称之为只写属性
```cs
//set（）源码：
public void set_Name(string value)
{
    this._name = value;
}

//get（）源码：
public string get_Name
{
    return this._name;
}
```

```cs title:用法
public class Person
{
    private int _age; //字段在类中必须是私有的，如果想访问只能通过成员属性！
    
    //属性必须是公有的，可以外部访问 
    public int Age   
    {
        //输出属性的值的时候，会执行get方法
        get { return _age; }
        
        //给属性赋值的时候，首先会执行set方法
        //value关键字用于表示外部传入的值
        set 
        { 
            //添加额外条件起到限定作用
            if（value < 0 || value > 100）
            {
                value = 0;
            }
            //默认功能
            _age = value; 
        }
    }
    
     public void CHLSS()
    {
       	//调用属性this.Age，执行get方法
        Console.WriteLine($"我今年{this.Age}岁了");
    }
}

//对类调用：
static void Main(string[] args)
{
    Person sunQuan = new Person();
    sunQuan.Age = "10";   //调用属性sunQuan.Age，执行Set（）方法
    sunQuan.CHLSS();
}
```

```cs title:新写法
public int Age { get => _age; set => _age = value; }
```

5. **get 和 set 可以加访问修饰符**
- 默认不加，会使用属性声明时的访问权限
- 加的访问修饰符要低于属性的访问权限
- 不能让 get 和 set 的访问权限都低于属性的权限
```cs
public int age
{
    get { return _age }

    private set { _age = value }  // 给set加private，那么该属性只能读不能写
}
```

6. **自动属性**
```cs
public int age
{
    get;
    private set;
}
```
- 没有在 get 和 set 中写逻辑的需求时，可以使用自动属性。
- get set 仍可以添加 private。一般用于外部能读不能写的情况

## 4 静态 static 
#static
1. 在非静态类中，既可以有实例成员（非静态），也可以有静态成员。
2. 在调用实例成员的时候，需要使用**对象名. 实例成员**;
3. 在调用静态成员的时候，需要使用**类名. 静态成员名**;

```cs
public class Person
{
    public void M1()
    {
        Console.WriteLine("非静态");
    }
    public static void M2()
    {
        Console.WriteLine("静态");
    }
}


//调用实例成员
Person p = new Person();
p.M1(); //实例方法

//p.M2();  报错
Person.M2();  //静态方法

```

**总结：** 
- **静态函数中，只能访问静态成员，不允许访问实例成员。**
- 实例函数中，既可以使用静态成员，也可以使用实例成员。
- **静态类**中只允许有静态成员，不能被实例化（适合作为工具类）。
- **静态构造函数**，用于初始化静态变量
    - 静态类和普通类中都可以有静态构造函数
    - 不能使用访问修饰符
    - 不能有参数
    - 只会自动调用一次
```cs title:静态构造函数
class Test
{
    public static int a = 100;
    // 静态构造函数
    static Test()
    {
        a = 200;    
    }
    
    // 普通构造函数
    public Test()
    {}
}
```


**什么时候使用：** 
1)、如果你想要你的类当做一个"工具类"去使用，这个时候可以考虑将类写成静态的。
2)、静态类在整个项目中资源共享。静态类存放在**堆栈静态存储区域**，只有在程序全部结束之后，静态类才会释放资源。

**const (常量)可以理解为特殊的 static (静态)**
- **相同点**
他们都可以通过类名点出使用
- **不同点**
    1. const 必须初始化，不能修改， static 没有这个规则
    2. const 只能修饰变量、static 可以修饰很多
    3. const 一定是写在访问修饰符后面的，static 没有这个要求

## 5 拓展方法
概念：为现有**非静态变量类型**添加新方法

**作用**
1. 提升程序拓展性
2. 不需要再对象中重新写方法
3. 不需要继承来添加方法
4. 为别人封装的类型写额外的方法

**特点**
1. 一定是写在静态类中
2.  一定是个静态函数
3. 第一个参数为拓展目标
4. 第一个参数用 this 修饰

```cs title:语法
访问修饰符 static 返回值 函数名(this 拓展类名 参数名，参数类型 参数名,参数类型 参数名....)
```

```cs
int i =10;
i.SpeakValue(); //int类型的拓展方法,i作为value值传入函数


static class Tools
{
    // 拓展方法写在静态类中
    public static void SpeakValue(this int value)
    {
        //拓展的方法的逻辑
        Console.WriteLine( value);
    }
}
```

也可以为类类型添加拓展方法，当拓展方法名和类成员函数重名时，只会调用类成员函数。

例：Unity 拓展 Transfrom 类判断朝向
```cs h:8
public static class ExtensionMethod
{
    private static float s_DotThreshold = 0.5f;
    //this是要扩展的类，
    //逗号之后，第二个参数是扩展方法的参数
    
    //夹角小于60°，返回true
    public static bool IsFacingTarget(this Transform transform, Transform target)
    {
        Vector3 direction = (target.position - transform.position).normalized;
        float dot = Vector3.Dot(direction, transform.forward);  
        return dot>s_DotThreshold; 
    }
}

//调用
transform.IsFacingTarget(m_attackTarget.transform)
```
## 6 构造函数

**作用**：在实例化对象时（new 时），会调用用于初始化的函数，如果不写默认存在一个无参构造函数。

**构造函数是一个特殊的方法：**
1)、构造函数没有返回值，连 void 也不能写。
2)、构造函数的名称必须跟类名一样。
3)、没有特殊需求时，修饰符一般是 public


- **构造函数是可以有重载的。**
- 重载之后会失去默认的无参构造函数，如果需要可以显式声明以下
- 特殊写法 （构造函数的继承）较少使用  
    - 在构造函数后添加 : `this (指定的重载参数)  `
    - 可以实现**执行该构造函数前执行 this 指定的构造函数**  

```cs
public class Person
{
    //构造函数
    public Person()
    {
        ...
    }
    
    //构造函数的重载
    public Person(string name,int age)
    {
        this.Name = name;
        this.Age = age; 
    }
    
    public Person(string name,int age,string gender)
    {
        this.Name = name;
        this.Age = age; 
        this.Gender = gender;
    }

    public Person(string name,int age,string gender):this()
    {
        this.Name = name;
        this.Age = age; 
        this.Gender = gender;
    }
	

    //析构函数
    //当引用类型的堆内存被回收时，会调用该函数  
    //c#中有自动垃圾回收机制GC，所以几乎不使用析构函数  
    ~Person（）
    {
        //手动回收内存
    }
    
    private string _name;
    public string Name
    {
        get { return _name; }        
        set { _name = value; }
    }

    private int _age;  
    public int Age 
    {
        get { return _age; }   
        set { _age = value; }
    }

    private string _gender;
    public string Gender
    {
        get { return _gender; }
        set { _gender = value; }
    }
}

 class Program
{
    static void Main(string[] args)
    {
        Person p1 = new Person("孙权",10,"男"); //初始化
        Person p2 = new Person("孙尚香",10); //重载
    }
}
```

**类当中会有一个默认的无参数的构造函数**，当你写一个新的构造函数之后，不管是有参数的还是无参数的，那个默认的无参数的构造函数都被干掉了。

### new 关键字
`Person p=new Person ();`
new 帮助我们做了 3 件事儿：
1)、在内存中开辟一块空间
2)、在开辟的空间中创建对象
3)、调用对象的构造函数进行初始化对象

### this 关键字
1)、代表当前类的对象
2)、在类当中显示的调用本类的构造函数  : this 

```cs
 //构造函数
public Person(string name,int age,string gender)
{
    this.Name = name;
    this.Age = age; 
    this.Gender = gender;
}

//：this（name,age,""）再次调用构造函数，可以省区该函数中的数据
public Person(string name,int age)：this（name,age,""）
{
    //this.Name = name;
    //this.Age = age; 
}
```

## 7 索引器
**作用：** 让对象可以像数组一样通过索引访问其中元素，使程序看起来更直观，更容易编写。
**语法：** 
```cs title:语法
访问修饰符 返回值 this[参数类型 参数名, 参数类型 参数名, ......] // 注意这里是中括号[]
{
    //内部的写法和规则和索引器相同
    get{}
    set{}
}
```

```cs title:用法
public class Person
{
    private string _name;
    private int _age;
    private Person[] _friend; // 类数组，也可以是用二维数组

    public Person this[int index] //索引器
    {
        get
        {
            return _friend[index];
        }
        set
        {
             _friend[index] = value;
        }
    }
}


// 使用索引器
Person p = new Person();  
p[0] = new Person();  
p[1] = new Person();
```

索引器 this 函数中的 get 和 set 可以写逻辑，this 函数支持重载

## 8 继承

```cs
//父类（基类)
public class Person

//子类（派生类）：
public class Student : Person
```

### 特性

1. 子类继承了父类的属性和方法，**不能继承父类 `private` 字段和构造函数。**

2. **单根性**（子类只能有一个父类）和**传递性** (子类可以间接继承父类的父类))

3. 子类成员函数和父类的**同名**时，会把父类的隐藏掉。（不建议写同名成员）

![image-20220623161508887](image-20220623161508887.png)

加 new 之后不再警告

```cs
public new void SayHello() 
{}
```

4. 子类对象可以调用父类中的成员，但是父类对象永远都只能调用自己的成员。
5. 当申明一个子类对象时，**先执行父类的构造函数，再执行子类的构造函数**
    - 父类的无参构造很重要，子类实例化时默认自动调用的是父类的无参构造，所以如果父类无参构造被顶掉，会报错！
    - 子类可以通过 `base` 关键字代表父类调用父类构造

### base 关键字
#base
子类写的成员函数和父类的**同名**时，会把父类的隐藏掉。

**`base` 关键字用于从派生类中访问基类的成员：**
- 调用基类上已被 overide的方法。
- 指定创建派生类实例时应调用的基类构造函数。
- 基类访问只能在**构造函数、实例方法或实例属性访问器**中进行。

```cs
//1. 在派生类中调用基类方法。
public class BaseClass
{
    protected string _className = "BaseClass";
    public virtual void PrintName()
    {
        Console.WriteLine("Class Name: {0}", _className);
    }
}
class DerivedClass : BaseClass
{
    public string _className = "DerivedClass";
    public override void PrintName()
    {
        Console.Write("The BaseClass Name is {0}");
        //调用基类方法
        base.PrintName();
        Console.WriteLine("This DerivedClass is {0}", _className);
    }
}

//2. 在派生类中调用基类构造函数。
public class BaseClass
{
    int num;
    public BaseClass()
    {
        Console.WriteLine("in BaseClass()");
    }
    public BaseClass(int i)
    {
        num = i;
        Console.WriteLine("in BaseClass(int {0})", num);
    }
}
public class DerivedClass : BaseClass
{
    // 该构造器调用  BaseClass.BaseClass()
    public DerivedClass()
        : base()
    {
    }
    // 该构造器调用 BaseClass.BaseClass(int i)
    public DerivedClass(int i)
        : base(i)
    {

```

### 里氏替换原则

**概念：**
任何父类出现的地方，子类都可以替代

**语法表现**：父类容器装子类对象, 因为子类对象包含了父类的所有内容

**作用：**
方便进行对象存储和管理

```cs
//假设Student类是Person类的子类
 static void Main(string[] args)
{
    //里氏替换，父类容器装子类对象
    Person p = new Student();

    //如果父类中装的是子类对象，那么可以将这个父类强转为子类对象
    Student ss = (Student)p;
    ss.StudentSayHello();
}
```

### is as 关键字
#is #as
`is`：判断一个对象是否是指定的类对象，如果能够转换，则返回一个 true，否则返回一个 false
`as`：将一个对象转换为指定的类对象，如果能够转换则转换为指定的类对象，否则返回一个 null

```cs title:is和as的用法
//假设Student类是Person类的子类
static void Main(string[] args)
{
    Person p = new Student();
    
    //is的用法
    if (p is Teacher)
    {
        Student ss = (Student)p;
        ss.StudentSayHello();
    }
    else
    {
        Console.WriteLine("转换失败");
    }
    
    //as的用法
    Student ss = ss as Student;  
    ss.StudentSayHello();
    
    (ss as Student).StudentSayHello(); //等价
}
```

```cs title:游戏中的应用
//假设Gameobject是其他游戏类的基类，里氏替换如下：
Gameobject player = new Player();  
Gameobject monster = new Monster();  
Gameobject boss = new Boss();  

//使用父类数组来管理子类
Gameobject[] objects = new Gameobject[] { new Player(), new Monster(), new Boss() };

//判断各自使用的逻辑
for (int i = 0; i < objects.Length; i++)
{
    if( objects[i] is Player )
    {
        (objects[i] as Player) . PlayerAtk();
    }
    
    else if( objects[i] is Monster )
    {
        (objects[i] as Monster). MonsterAtk() ;
    }
    
    else if (objects[i] is Boss)
    {
        ...
    }
    
}
```

##  10 多态
多态按字面的意思就是“多种状态”
让继承同一父类的子类们在执行相同方法时有不同的表现 (状态)

**主要目的**
同一父类的对象执行相同行为 (方法)有不同的表现

**解决的问题**
让同一个对象有唯一行为的特征

**多态有两种：**
- 编译时多态（函数重载，开始就写好的）
- 运行时多态（重写父类虚函数、抽象函数、接口）

### 虚函数 virtual

**当父类中的方法需要实现, 将父类的方法标记为虚方法，使用关键字 `virtual`**，这个函数**可以**被子类重写。
**子类的方法使用关键字 `override`**。

```cs
 class Program
    {
        static void Main(string[] args)
        {
            //真的鸭子嘎嘎叫，木头鸭子吱吱叫，橡皮鸭子唧唧叫
            ReadDuck rd = new ReadDuck();
            WoodDuck wd = new WoodDuck();
            XPDuck xd = new XPDuck();

            ReadDuck[] ducks = { rd, wd, xd };
            for (int i = 0;i < ducks.Length;i++)
            {
                ducks[i].jiao();
            }

        }
    }
    
    //父类
    public class ReadDuck
    {
        public virtual void jiao()
        {
            Console.WriteLine("真的鸭子嘎嘎叫");
        }
    }

    //子类
    public class WoodDuck : ReadDuck
    {
        public override void jiao()
        {
            Console.WriteLine("木头鸭子吱吱叫");
        }
    }
    public class XPDuck : ReadDuck
    {
        public override void jiao()
        {
            Console.WriteLine("橡皮鸭子唧唧叫");
        }
    }
```

### 抽象类 abstract 
被抽象关键字 `abstract` 修饰的类
**当父类中的方法不知道如何去实现的时候，可以考虑将父类写成抽象类，将方法写成抽象方法。**

**特点:**
1. 不能被实例化，其他封装特性都有
2. 可以包含抽象方法（即纯虚函数）
3. 继承抽象类必须重写其抽象方法

```cs
static void Main(string[] args)
{
    //狗会叫，猫也会叫
    //Animal a = new Animal();  抽象类或接口无法创建对象
    Animal dog = new Dog();
    dog.jiao();
    Animal cat = new Cat();
    cat.jiao();
}

//加abstract
public abstract class Animal
{
	public abstract void jiao();  //抽象方法不写方法体
}

public class Dog: Animal
{
	public override void jiao()
	{
    	Console.WriteLine("狗会叫");
	}
}
public class Cat : Animal
{
	public override void jiao()
	{
   	 	Console.WriteLine("猫也会叫");
	}
}
```

1. 抽象成员必须标记为 `abstract`, 并且不能有任何实现。
2. 抽象成员必须在抽象类中。
3. 抽象类不能被实例化
4. 子类继承抽象类后，必须把父类中的所有抽象成员都重写。（除非子类也是一个抽象类，则可以不重写）
5. 抽象成员的访问修饰符不能是 `private`
6. 在抽象类中可以包含实例成员。并且抽象类的实例成员可以不被子类实现
7. 抽象类是有构造函数的。虽然不能被实例化。
8. 如果父类的抽象方法中有参数，那么。继承这个抽象父类的子类在重写父类的方法的时候必须传入对应的参数。
9. 如果抽象父类的抽象方法中有返回值，那么子类在重写这个抽象方法的时候也必须要传入返回值。

**使用时机：**
1. 如果父类中的方法有默认的实现，并且父类需要被实例化，这时可以考虑将父类定义成一个普通类，用虚方法来实现多态。
2. 如果父类中的方法没有默认实现，父类也不需要被实例化，则可以将该类定义为抽象类。


> [!summary] 抽象类和接口
> 相同点：
>1. 都可以被继承
>2. 都不能直接实例化
>3. 都可以包含方法申明
>4. 子类必须实现未实现的方法
>5. 都遵循里氏替换原则
>
>不同点：
>1. 抽象类中可以有构造函数; 接口中不能
>2. 抽象类只能被单一继承; 接口可以被继承多个
>3. 抽象类中可以有成员变量; 接口中不能
>4. 抽象类中可以申明成员方法，虚方法，抽象方法，静态方法; 接口中只能声明没有实现的抽象方法
>5. 抽象类方法可以使用访问修饰符; 接口中建议不写，默认 public

> [!summary] 如何选择抽象类和接口
> 1. 表示对象的用抽象类，表示行为拓展的用接口
>2. 不同对象拥有的共同行为，我们往往可以使用接口来实现

## 11 面向对象七大原则  
![[6be61eb7b87ada15753dc35768da4317_MD5.png]]


七大原则总体要实现的目标是: **高内聚、低耦合**，使程序模块的可重用性、移植性增强

- **高内聚低耦合：**
    - 从类角度来看，高内聚低耦合要求减少类内部对其他类的调用
    - 从功能块来看，高内聚低耦合要求减少模块之间的交互复杂度


1. **单一职责原则 SRP (Single Responsibility Principle)**
类被修改的几率很大，因此应该专注于单一的功能。如果把多个功能放在同一个类中，功能之间就形成了关联，改变其中一个功能，有可能中止另个功能。举例: 假设程序、策划、美术三个工种是三个类，他们应该各司其职，在程序世界中只应该做自己应该做的事情。

2. **开闭原则 OCP (Open-Closed Principle)**
对拓展开放，对修改关闭
拓展开放: 模块的行为可以被拓展从而满足新的需求
修改关闭: 不允许修改模块的源代码（或者尽量使修改最小化)
举例: 继承就是最典型的开闭原则的体现，可以通过添加新的子类和重写父类的方法来实现

3. **里氏替换原则 LSP (Liskov Substitution Principle)**
任何父类出现的地方，子类都可以替代
举例: 用父类容器装载子类对象，因为子类对象包含了父类的所有内容

4. **依赖倒转原则 DIP (Dependence Inversion Principle)**
要依赖于抽象，不要依赖于具体的实现
 ![[756ed87732dfe143814d6c3bc38a8766_MD5.png]]

>玩家对象的开枪不依赖于具体种类的开枪，而是依赖于抽象的接口

5. **迪米特法则 LoP (Law of Demeter)又称最少知识原则**
一个对象应当对其它对象尽可能少的了解不要和陌生人说话
举例: 一个对象中的成员，要尽可能少的直接和其它类建立关系，目的是降低耦合性

6. **接口分离原则 ISP (Interface Segregation Principle)**
不应该强迫别人依赖他们不需要使用的方法。
一个接口不需要提供太多的行为，一个接口应该尽量只提供一个对外的功能，让别人去选择需要实现什么样的行为，而不是把所有的行为都封装到一个接口当中
举例: 飞行接口、走路接口、跑步接口等等虽然都是移动的行为但是我们应该把他们分为一个一个单独的接口，让别人去选择使用

7. **合成复用原则 CRP (Composite Reuse Principle)**
尽量使用对象组合，而不是继承来达到复用的目的。
**继承关系是强耦合，组合关系是低耦合**
举例: 脸应该是眼镜、鼻子、嘴巴、耳朵的组合，而不是依次的继承，角色和装备也应该是组合，而不是继承
注意: 不能盲目的使用合成复用原则，要在遵循迪米特原则的前提下

**如何使用这些原则**
在开始做项目之前，整理 UML 类图时先按自己的想法把需要的类整理出来再把七大原则截图放在旁边，基于七大原则去，优化整理自己的设计
整体目标就是: 高内聚，低耦合

# 六、接口 interface

接口是行为的抽象规范

**关键字**：`interface`

**接口声明的规范**
1. 不包含成员变量
2. 只包含方法、属性索引器、事件
3. 成员不能被实现
4. 成员可以不用写访问修饰符，不能是私有的
5. 接口不能继承类，但是可以继承另一个接口
  
**接口的使用规范**
1. 类可以继承多个接口
2. 类继承接口后，必须实现接口中所有成员


**特点:**
1. 它和类的声明类似
2. 接口是用来继承的
3. 接口不能被实例化，但是可以作为容器存储对象

```cs title:语法
public interface 接口名称（通常以I开头，如ICompute）
{
    接口成员；
}
```

### 接口的使用
类可以继承 1 个类，多个接口
继承了接口后，必须实现其中的内容，并且必须是 public 的
```cs
//接口
interface IFly
{
    string name { get; set; }

    int this[int index] { get; set; }

    event Action doSomthing;

    void Fly();
}


// 父类
public class Animal { }

//继承父类和接口
public class Person : Animal, IFly
{
    public string name { get; set; }

    public int this[int index]
    {
        get
        {
            return 0;
        }
        set
        {
        }
    }

    public event Action doSomthing;

    //实现的接口函数，可以作为虚函数继承
    public virtual void Fly()
    {

    }

//接口存储子类
static void Main(string[] args)
{
    //IFly f = new IFly();  //error
    IFly f = new Person();  // 里氏替换原则
}

```

![[f52e612d29b16288c18c4f4639d55bc5_MD5.svg]]

- 并不是所有动物都会飞，所以 Fly 放在动物父类中不合适，可以单独作为一个接口。
- 接口可以作为容器存储所以继承 Fly 的子类

### 接口可以继承接口
相当于将接口行为合并  

- 接口继承接口时，不需要实现
- 待类继承接口后，类自己去实现所有内容

### 隐式实现接口

**隐式实现接口成员是将接口的所有成员以 public 访问修饰符修饰。**

使用隐式方式来实现接口 ICompute 的成员，以计算机专业的学生类 (ComputerMajor) 实现 ICompute 接口，为其添加英语 (English)、编程 (Programming)、数据库 (Database) 学科成绩属性，代码如下。

```cs
class ComputerMajor : ICompute
{
    public int Id { get; set; }     //隐式的实现接口中的属性
    public string Name { get; set; }    //隐式实现接口中的属性
    public double English { get; set; }
    public double Programming { get; set; }
    public double Database { get; set; }
    public void Avg()       //隐式实现接口中的方法
    {
        double avg = (English + Programming + Database) / 3;
        Console.WriteLine("平均分：" + avg);
    }
    public void Total()
    {
        double sum = English + Programming + Database;
        Console.WriteLine("总分为：" + sum);
    }
}

```

在 Main 方法中调用该实现类的成员，代码如下。

```cs
class Program
{
    static void Main(string[] args)
    {
        ComputerMajor computerMajor = new ComputerMajor();
        computerMajor.Id = 1;
        computerMajor.Name = "李明";
        computerMajor.English = 80;
        computerMajor.Programming = 90;
        computerMajor.Database = 85;
        Console.WriteLine("学号：" + computerMajor.Id);
        Console.WriteLine("姓名：" + computerMajor.Name);
        Console.WriteLine("成绩信息如下：");
        computerMajor.Total();
        computerMajor.Avg();
    }
}
```

执行上面的代码，效果如下图所示。

![使用隐式方式实现接口成员](4-1Z3221P219338.gif)

### 显式实现接口

**显式实现接口是指在实现接口时所实现的成员名称前含有接口名称作为前缀。**

主要用于实现不同接口中的同名函数的不同表现

**使用显式实现接口的成员不能再使用修饰符修饰**，即 public、abstract、virtual、 override 等。

```cs
class ComputerMajor : ICompute
{
    public double English { get; set; }
    public double Programming { get; set; }
    public double Database { get; set; }
    int ICompute.Id { get; set; }           //显示实现接口中的属性
    string ICompute.Name { get; set; }      //显示实现接口中的属性
    void ICompute.Total()                   //显示实现接口中的方法
    {
        double sum = English + Programming + Database;
        Console.WriteLine ("总分数：" + sum);
    }
    void ICompute.Avg ()
    {
        double avg = (English + Programming + Database) / 3;
        Console.WriteLine("平均分为：" + avg);
    }
}
```

从上面的代码可以看出，在使用显式方式实现接口中的成员时，所有成员都会加上接口名称 ICompute 作为前缀，并且不加任何修饰符。

在 Main 方法中调用实现类中的成员, 代码如下

```cs
class Program
{
    static void Main(string[] args)
    {
        ComputerMajor computerMajor = new ComputerMajor();
        ICompute compute = computerMajor;       //创建接口的实例
        compute.Id = 1;
        compute.Name = "李明";
        computerMajor.English = 80;
        computerMajor.Programming = 90;
        computerMajor.Database = 85;
        Console.WriteLine("学号：" + compute.Id);
        Console.WriteLine("姓名：" + compute.Name);
        Console.WriteLine("成绩信息如下：");
        compute.Total();
        compute.Avg();
    }
}
```

执行上面的代码，效果与上图一致。从调用的代码可以看出，在调用显式方式实现接口的成员时，必须使用接口的实例来调用，而不能使用实现类的实例来调用。

# 七、泛型 generic
- 泛型实现了类型参数化，达到代码重用目的
- 通过类型参数化来实现同一份代码上操作多种类型
- 泛型相当于类型占位符
- 定义类或方法时使用替代符代表变量类型/当真正使用类或者方法时再具体指定类型

1. 不同类型对象的相同逻辑处理就可以选择泛型
2. 使用泛型可以一定程度避免装箱拆箱
```cs title:举例:优化ArrayList
//实现一个可指定类型的ArrayList,这样可以避免使用Object类型的装箱拆箱操作
class ArrayList<T>
{
    private T[] array;

    public void Add(T value)
    {
        
    }
    //其他方法略...
}
```

## 1 泛型类和泛型接口

```cs title:语法
class 类名<泛型占位字母>
interface 接口名<泛型占位字母>
```

```cs title:泛型类
class TestClass<T>
{
    public T value;
}

class Program
{
    static void Main(string[] args)
    {
        TestClass<int> t1 = new TestClass<int>();
        t1.value = 1;
        TestClass<string> t2 = new TestClass<string>();
        t2.value = "test";
    }
}


//泛型占位字母可以有多个，用逗号分开
class TestClass2<T1, T2, T3, T4>
{
    public T1 valu1;
    public T2 valu2;
    public T3 valu3;
    public T4 valu4;
}
```

```cs title:泛型接口
interface IInterface<T>  
{  
    T value { get; set; }  
}  
  
class Test : IInterface<int>  
{  
    public int value { get; set; }  
}
```
## 2 泛型方法（函数）

```cs title:语法
函数名<泛型占位字母>(参数列表)
```

### 普通类中的泛型方法
```cs title:普通类中的泛型方法
class Test  //注意这是普通类
{
    public void Func1<T>(T value)
    {
        //传值
        Console.WriteLine(value);
    }
    
    public void Func2<T>(T value)
    {
        //可以使用泛型类型做逻辑处理
        T t = default(T);  //不确定泛型类型时获取默认值可以使用 default(占位字符)
    }
    
    public void Func3<T>(T value)
    {
        //可以作为返回值
        return default(T);
    }
    
    public void Func3<T1,T2,T3>(T1 value1,T2 value2,T3 value3)
    {
        //泛型占位字母可以有多个，用逗号分开
    }
}

class Program
{
    static void Main(string[] args)
    {
        Test t = new Test();
        t.Func1<int>(1);
    }
}
```

### 泛型类中的泛型方法
```cs title:泛型类中的泛型方法
class Test<T> //注意这是泛型类
{
    public T value;


    //注意这里传入的T是Test类指定的,而不是该函数的泛型,所以这个函数不是泛型函数
    public void Func1(T t)
    {
        value = t;
        Console.WriteLine(value);
    }

    //这里的K是泛型函数的泛型，所以Func2是泛型函数
    public void Func2<K>(K k)
    {
        Console.WriteLine(k);
    }
}

class Program
{
    static void Main(string[] args)
    {
        Test<int> t = new Test<int>();
        t.Func1(1);  //由于Func1不是泛型,所以这里的形参必须是int类型
        t.Func2<string>("test"); //Func2是泛型，所以可以指定类型
    }
}
```
## 3 泛型约束
#where
**让泛型的类型有一定的限制**
关键字:`where`

**泛型约束一共有 6 种**
1. 值类型
`where 泛型占位字母:struct`
2. 引用类型
`where 泛型占位字母:class`
3. 存在无参公共构造函数
`where 泛型占位字母: new ()`
4. 某个类本身或者其派生类
`where 泛型占位字母: 类名`
5. 某个接口的派生类型
`where 泛型占位字母: 接口名`
6. 另一个泛型类型本身或者派生类型
`where 泛型占位字母: 另一个泛型字母`

![[Pasted image 20230530224846.png|500]]
>这里泛型约束使用了值类型，当泛型使用 string（引用类型）时报错

```cs title:可以同时指定多个约束，使用逗号
class Test<T> where T : class, new()
{
    ...
}
```

```cs title:多个泛型同时指定约束
class Test<T,K> where T : class where K : struct
{
    ...
}
```


# 八、委托 delegate
- **委托是函数的容器**
- 可以理解为表示函数的变量类型
- 用来存储、传递函数
- 委托的本质是一个类，用来定义函数 (方法)的类型 (返回值和参数的类型)
- 不同的函数必须对应和各自"格式"—致的委托
- 支持泛型

关键字 `delegate`

写在哪里?
可以申明在 namespace 和 class 语句块中，更多的写在 namespace 中

```cs title:语法:
//简单记忆委托语法就是函数申明语法前面加一个 delegate 关键字
访问修饰符 delegate 返回值 委托名 (参数列表);
```

## 1 委托的使用
```cs
//声明了一个委托，用来存储无返回值，函数参数为string类型的函数
public delegate void MyDelegate(string message);

class Program
{
    static void Main(string[] args)
    {
        //实例化一个委托对象（只传入函数名）
        MyDelegate del = new MyDelegate(DelegateMethod);
        MyDelegate del = DelegateMethod; //等价的简化写法
        
        //调用委托对象，这里会调用DelegateMethod函数
        del.Invoke("Hello World");
        del("Hello World"); //等价的简化写法
    }

    static void DelegateMethod(string message)
    {
        Console.WriteLine(message);
    }
}
```

## 2 委托作为类的成员/函数参数

```cs
public delegate void MyDelegate(string message); //声明一个委托类型


public class DelegateClass
{
    //作为类的成员
    public MyDelegate del;

    //作为函数的参数
    public void TestFunc(MyDelegate del)
    {
        string str = "Hello World";
        del(str);
    }
}

class Program
{
    static void Main(string[] args)
    {
        DelegateClass dc = new DelegateClass();  //先实例化DelegateClass
        dc.del = DelegateMethod; //再实例化委托del
        
        dc.del.Invoke("Hello World");  //调用委托对象，这里会调用DelegateMethod函数
        dc.del("Hello World"); //等价的简化写法
    }

    static void DelegateMethod(string message)
    {
        Console.WriteLine(message);
    }
}
```

## 3 多播委托
多播的意思是**委托变量可以存储多个函数**

`+=` 追加委托
`-=` 移除委托
`= null` 清空委托
```cs
public delegate void MyDelegate(string message); //声明一个委托类型

class Program
{
    static void Main(string[] args)
    {
        MyDelegate del = null;  //声明一个委托变量
        del += DelegateMethod1; // += 追加委托
        del += DelegateMethod2; // += 追加委托

        //del -= DelegateMethod1; // -= 移除委托
        //del = null;             // = null 清空委托
        //del = DelegateMethod1;  //🚨弊端：这样会清空之前追加的委托，只保留=后的委托

        if (del != null)
        {
            del("Hello World"); //调用委托
        }
    }

    static void DelegateMethod1(string message)
    {
        Console.WriteLine("第一个"+message);
    }
    
    static void DelegateMethod2(string message)
    {
        Console.WriteLine("第二个"+message);
    }
}

//结果：
//第一个Hello World
//第二个Hello World

```


## 4 内置委托类型
Action 和 Func 的区别是有无返回值
Action 无返回值
Func 有返回值
### Action
`Action`：无参**无返回值。**
`Action<>`：有参**无返回值**，支持 0~16 个参数

```cs title:源码
public delegate void Action();
public delegate void Action<in T>(T obj);
```

```cs title:用法
class Program
{
    static void Main(string[] args)
    {
        Action action1 = TestFunc1;
        Action<string> action2 = TestFunc2;
    }

    //无参无返回值
    static void TestFunc1()
    {
    }
    
    //有参无返回值
    static void TestFunc2(string s)
    {
    }
}
```
### Func
`Func<>`：无参**有返回值**
`Func<，>`：有参**有返回值**，支持 0~16 个参数

```cs title:源码
public delegate TResult Func<out TResult>(); //无参有返回值，TResult为返回值

public delegate TResult Func<in T, out TResult>(T arg); //可以传入多个参数
```

```cs title:用法
class Program
{
    static void Main(string[] args)
    {
        Func<int> func1 = TestFunc1;
        Func<int, string> func2 = TestFunc2;

        Console.WriteLine(func1());
        Console.WriteLine(func2(100));  
    }
    
    //无参有返回值
    static int TestFunc1()
    {
        return 1;
    }
    
    //有参有返回值
    static string TestFunc2(int i)
    {
        return i.ToString();
    }
}
```

## 5 案例
一家三口，妈妈做饭，爸爸妈妈和孩子都要吃饭
用委托模拟做饭—>开饭—>吃饭的过程
```cs
namespace MyNamespace;

public abstract class Person
{
    public abstract void Eat();
}

public class Mother : Person
{
    public Action beginEat;  //Action委托
    
    public override void Eat()
    {
        Console.WriteLine("妈妈吃饭");
    }
    
    public void Cook()
    {
        Console.WriteLine("妈妈做饭");
        Console.WriteLine("饭做好了");
        
        if (beginEat != null)
        {
            beginEat();   //调用委托
        }
    } 
}

public class Father : Person
{
    public override void Eat()
    {
        Console.WriteLine("爸爸吃饭");
    }
}

public class Child : Person
{
    public override void Eat()
    {
        Console.WriteLine("孩子吃饭");
    }
}

class Program
{
    static void Main(string[] args)
    {
        Mother mother = new Mother();
        Father father = new Father();
        Child child = new Child();
        
        
        mother.beginEat += father.Eat;
        mother.beginEat += child.Eat;
        mother.beginEat += mother.Eat;
        
        mother.Cook();
    }
}

//输出：
//妈妈做饭
//饭做好了
//爸爸吃饭
//孩子吃饭
//妈妈吃饭
```

## 6 协变逆变（不常用）
**协变 `out`:** 遵循里氏替换原则，父类的泛型委托可以装子类的泛型委托
**逆变 `in`**：逆着来，子类的泛型委托可以装父类的泛型委托

- **协变和逆变是用来修饰泛型的**
- **用于在泛型中修饰泛型字母的，只能在泛型接口和泛型委托中使用**

### 作用
用 `out` 修饰的泛型**只能作为返回值** 
用 `in` 修饰的泛型**只能作为参数** `
```cs

delegate T MyDelegate1<out T>();

delegate void MyDelegate2<in T>(T t);
    
class Father
{
    public Father()
    {
        Console.WriteLine("Father");
    }
}

class Son : Father
{
    public Son()
    {
        Console.WriteLine("Son");
    }
}

class Program
{
    static void Main(string[] args)
    {
        //协变 父类总是能被子类替换
        //父类的泛型委托可以装子类的泛型委托
        MyDelegate1<Son> son1 = () => { return new Son(); };

        MyDelegate1<Father> fathrer1 = son1;
        
        Father f = fathrer1(); //实际上返回的是son1里面装的函数
        
        //逆变 父类总是能被子类替换
        //子类的泛型委托可以装父类的泛型委托
        MyDelegate2<Father> fathrer2 = (value) => {  };
        
        MyDelegate2<Son> son2 = fathrer2;
        
        Son s = new Son(); //实际上返回的是father2里面装的函数
    }
}

```

# 九、事件 event
## 使用事件将逻辑和视觉代码分离
使用事件意味着说我可以让一件事发生而不关心是谁订阅了它，事件模型中有 publishers 和 subscribers，其中 publishers 触发事件，所有的 subscribers 都会收到事件被触发的通知。因为 **publishers 并不关心是谁订阅了它，之后又发生了什么，所以使用事件模型可以使我们的代码解耦**

![[6bd258fb8a085e4a5f7e2bb56aadef7a_MD5.png|500]]

通常我们不希望逻辑代码与视觉代码耦合在一起，**我们希望不管有没有视觉组件，逻辑都能够单独运行，而视觉组件只关心逻辑代码运行时造成的具体的视觉变化**

![[e6f02ebd69b652045c9266b8df4813c1_MD5.png|500]]

## 事件的使用
- 事件是基于委托的存在
- 事件是委托的安全包裹
- 让委托的使用更具有安全性
- 事件是一种特殊的变量类型

**语法:**
```cs
访问修饰符 event 委托类型 事件名;
```

**事件的使用:**
1. 事件是作为成员变量存在于类中
2. 委托怎么用，事件就怎么用

**事件相对于委托的区别:**
1. **不能在<mark style="background: #FF5582A6;">类外部</mark>使用 `=`  赋值，但可以在类外追加减少 `+=`   `-=` 委托**
2. 不能在类外部调用
3. 事件只能作为成员存在于类和接口以及结构体中，而委托可以作为临时变量在函数中使用。

> [!question] 为什么使用事件？
> 1. 防止外部随意置空委托
>2. 防止外部随意调用委托
>3. 事件相当于对委托进行了一次封装让其更加安全

```cs
namespace MyNamespace;

class Test
{
    public event Action myEvent;  //声明一个事件，事件的类型是委托类型，这里是Action

    public Test()
    {
        //事件的使用方法和委托一样
        myEvent = null;
        myEvent += TestFunc1;
        myEvent += TestFunc2;
        
        myEvent();
    }

    public void TestFunc1()
    {
        Console.WriteLine("TestFunc1");
    }
    
    public void TestFunc2()
    {
        Console.WriteLine("TestFunc2");
    }
}

class Program
{
    static void Main(string[] args)
    {
        Test t = new Test();
        
        t.myEvent = null; //error！事件不能在类外赋值
        t.myEvent += t.TestFunc1; //正确, 可以追加减少委托
        
        t.myEvent(); //error！事件不能在类外调用
    }
}
//输出
//TestFunc1
//TestFunc2



```
## EventHandler
是一个多播委托类型
```cs
//定义：
//@sender: 引发事件的对象
//@e: 传递的参数
public delegate void EventHandler(object sender, EventArgs e);

//使用
public event EventHandler m_event;  //修改自定义委托类型为EventHandler
```

```cs
public class TestingEvents : MonoBehaviour
{
    public event EventHandler OnSpacePressed;
    
    private void Start()
    {
        OnSpacePressed += Testing_OnSpacePressed; //订阅事件
    }

    private void Testing_OnSpacePressed(object sender, EventArgs e)
    {
        Debug.Log("Space Pressed");
    }

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            //若没有订阅，OnSpacePressed 的值是 null
            //EventArgs 我们这里不需要传参数，所以使用 EventArgs.Empty
            OnSpacePressed?.Invoke(this, EventArgs.Empty);
        }
    }
}
```
行游戏，按下空格，我们就可以看到该事件触发的函数。

现在我们都是在同一个脚本、同一个类中去触发和监听事件，但**使用事件模型的好处是我们可以从其他地方去监听**，所以接下来我们新创建一个脚本 TestingEventSubscriber. cs，将上面的监听事件的过程放到这个脚本中

```cs
// TestingEventSubscriber.cs中
using System;
using UnityEngine;

public class TestingEventSubscriber : MonoBehaviour
{
    private void Start()
    {
        TestingEvents testingEvents = GetComponent<TestingEvents>();
        testingEvents.OnSpacePressed += TestingEvents_OnSpacePressed;
    }

    private void TestingEvents_OnSpacePressed(object sender, EventArgs e)
    {
        Debug.Log("Space Pressed");
    }
}
// TestingEvents.cs中
using System;
using UnityEngine;

public class TestingEvents : MonoBehaviour
{
    public event EventHandler OnSpacePressed;
    
    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            OnSpacePressed?.Invoke(this, EventArgs.Empty);
        }
    }
}
```
将脚本挂载到同一个物体上，运行游戏，按下空格，和之前的效果相同
###  参数 `EventArgs e`
EventHandler 的另一个参数 EventArgs e 可以通过事件传递更多信息，**要使用 EventArgs，我们首先需要使用泛型，然后定义一个派生自 EventArgs 的类**，比如这里我们想要传递一个 int 类型的 spaceCount 记录按下空格的次数，在调整了 EventArgs 之后两个脚本如下

```cs h:25-30,41
// TestingEventSubscriber.cs中
using System;
using UnityEngine;

public class TestingEventSubscriber : MonoBehaviour
{
    private void Start()
    {
        TestingEvents testingEvents = GetComponent<TestingEvents>();
        testingEvents.OnSpacePressed += TestingEvents_OnSpacePressed;
    }

    private void TestingEvents_OnSpacePressed(object sender, TestingEvents.OnSpacePressEventArgs e)
    {
        Debug.Log("Space Pressed" + e.spaceCount);
    }
}

// TestingEvents.cs中
using System;
using UnityEngine;

public class TestingEvents : MonoBehaviour
{
    public event EventHandler<OnSpacePressEventArgs> OnSpacePressed;
    public class OnSpacePressEventArgs : EventArgs
    {
        public int spaceCount;
    }
    private int _spaceCount;
    
    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            spaceCount++;
            OnSpacePressed?.Invoke(this, new OnSpacePressEventArgs { spaceCount = _spaceCount });
        }
    }
}
```

运行游戏，可以看到控制台显示出了按下空格的次数


# 十、匿名函数
- 顾名思义，就是没有名字的函数
- 匿名函数的使用主要是配合委托和事件进行使用
- **脱离委托和事件是不会使用匿名函数的**

```cs title:语法
//以下两种方法等价：

//delegate 委托匿名方法
delegate(参数列表)
{
    //函数逻辑
}

//Lambda 表达式
(参数列表)=>{ 函数逻辑 }

```

**何时使用?**
1. 函数中传递委托参数时
2. 作为函数返回值
3. 委托或事件赋值时

**匿名函数的缺点：**
添加到委托或事件容器中后不记录，无法使用 `-=` 指定移除

## 使用方法
```cs 
//Action无参数无返回值
Action action1 = delegate() { Console.WriteLine("Hello World!"); };   //这里的匿名函数只是声明
Action action1 = () => { Console.WriteLine("Hello World!"); };  //Lambda 表达式
action1(); //这里才是调用

//Action有参数无返回值
Action<string> action2 = delegate(string name) { Console.WriteLine("Hello " + name); };
Action<string> action2 = (string name) => { Console.WriteLine("Hello " + name); };  //Lambda 表达式
action2("World!");

//Func无参数有返回值
Func<string> func1 = delegate() { return "Hello World!"; };
Func<string> func1 = ()=> { return "Hello World!"; }; //Lambda 表达式
Console.WriteLine(func1());

//Func有参数有返回值
Func<string, string> func2 = delegate(string name) { return "Hello " + name; };
Func<string, string> func2 = (string name) => { return "Hello " + name; };//Lambda 表达式
Console.WriteLine(func2("World!"));

//输出
//Hello World!
//Hello World!
//Hello World!
//Hello World!

```

```cs title:作为参数传递\作为函数返回值
class Test
{
    public Action action;
    
    //作为参数传递
    public void Dosomething(int a, Action fun)
    {
        Console.WriteLine(a);
        fun();
    }
    
    //作为函数返回值
    public Action GetFun()
    {
        return delegate { Console.WriteLine("Hello World!"); };
    }
}

class Program
{
    static void Main(string[] args)
    {
        Test t = new Test();
        
        //作为参数传递
        t.Dosomething(100,delegate { Console.WriteLine("Hello World!"); });
        
        //作为函数返回值
        Action ac = t.GetFun();
        ac();
        t.GetFun()();  //等价于上面两行代码，一步到位
    }
}
```

## 闭包
闭包：**内层的函数可以引用包含在它外层的函数的变量，即使外层函数的执行已经终止**

注意：**该变量提供的值并非变量创建时的值，而是在父函数范围内的最终值。**

```cs
class Test
{
    public event Action action;

    public Test()
    {
        int value = 10;
        
        action = () =>
        {
            Console.WriteLine(value);  //形成了闭包，改变了value的生命周期，直到action为null时value才会被释放。
        };
        
        for(int i =0;i<10;i++)
        {
            action += () =>
            {
                Console.WriteLine(i); //形成了闭包，i最终值为10，所以会打印10个10
            };
        }
    }
    
    public void DoSomthing()
    {
        action();
    }

    
}
class Program
{
    static void Main(string[] args)
    {
        Test t = new Test();
        t.DoSomthing();
    }
}
```
# 十一、反射和特性
## 程序集和元数据
**程序集**是经由编译器编译得到的，供进一步编译执行的那个中间产物，在 windows 系统中，它一般表现为**后缀为 `.dll` (库文件）或者是 `.exe` (可执行文件)** 的格式
程序集就是我们写的一个代码集合，我们现在写的所有代码最终都会被编译器翻译为一个程序集供别人使用，比如一个代码库文件 (d11)或者一个可执行文件 (exe)

**元数据（metadata）** 就是用来描述数据的数据，这个概念不仅仅用于程序上，在别的领域也有元数据。
**程序中的类，类中的函数、变量等等信息就是程序的元数据**，有关程序以及类型的数据被称为元数据，它们**保存在程序集中**。
## 反射 Type
程序正在运行时，可以查看其它程序集或者自身的元数据。**一个运行的程序查看本身或者其它程序的元数据的行为就叫做反射**
在程序运行时，通过反射可以得到其它程序集或者自己程序集代码的各种信息/类，函数，变量，对象等等，实例化它们，执行它们，操作它们

**反射的作用**
因为反射可以在程序编译后获得信息，所以它提高了程序的拓展性和灵活性
1. 程序运行时得到所有元数据，包括元数据的特性
2. 程序运行时，实例化对象，操作对象
3. 程序运行时创建新对象，用这些对象执行任务

 
  **Type （类的信息类）**
- 它是反射功能的基础!  
- 它是访问元数据的主要方式。  
- 使用 Type 的成员获取有关类型声明的信息  
- 有关类型的成员（如构造函数、方法、**字段**、属性和类的事件)

> [!question] 字段
> 字段 (Field) 就是类的成员变量!


> [!info] Title
> 反射常用于跨文件获取数据，此案例只是为了演示功能，所以将所有代码放在一个文件中

```cs title: 获取Type
using System.Reflection;

namespace MyNamespace;

class Test
{
    private int i = 1;
    public int j = 0;
    public string str = "123";

    public Test()
    {
        
    }

    public Test(int i)
    {
        this.i = i;
    }

    public Test(int i, string str) : this(i)
    {
        this.str = str;
    }
    
    public void Speak()
    {
        Console.WriteLine(i);
    }
}

class Program
{
    static void Main(string[] args)
    {
        int a = 42;
        //⭐获取Type的三种方法，三种方法都指向堆中的同一个对象
        //1.Object类中的GetType方法
        Type t1 = a.GetType();
        //2.通过typeof关键字
        Type t2 = typeof(int);
        //3. 通过类的名字，类名必须包含命名空间
        Type t3 = Type.GetType("System.Int32");
        
        //⭐得到类的程序集信息
        Console.WriteLine(t1.Assembly);
        Console.WriteLine(t2.Assembly);
        Console.WriteLine(t3.Assembly);
        
        ...
    }
}

```

- @ 以下代码都在 Main 函数中
### 获取类中的所有成员
```cs title:获取类中的所有公共成员
Type t4 = typeof(Test); //获取Test类的Type对象
MemberInfo[] members = t4.GetMembers();  //获取Test类中的所有成员,需要引用命名空间using System.Reflection;
for (int i = 0; i < members.Length; i++)
{
    Console.WriteLine(members[i]);
    //输出如下：
    //Void Speak()                     //Test类中的方法
    //System.Type GetType()            //Object类中的方法
    //System.String ToString()         //Object类中的方法
    //Boolean Equals(System.Object)    //Object类中的方法
    //Int32 GetHashCode()              //Object类中的方法
    //Void .ctor()                     //Test类构造函数
    //Void .ctor(Int32)                //Test类构造函数
    //Void .ctor(Int32, System.String) //Test类构造函数
    //Int32 j                          //Test类中的成员变量
    //System.String str                //Test类中的成员变量
}
```
### 获取构造函数
```cs title:获取类的公共构造函数并调用
//1.获取所有构造函数
ConstructorInfo[] ctors = t4.GetConstructors();
for (int i = 0; i < ctors.Length; i++)
{
    Console.WriteLine(ctors[i]);
}

//2.获取其中一个构造函数并执行
//得构造函数传入Type数组，数组中内容按顺序是参数类型
//执行构造函数传入object数组，表示按顺序传入的参数
//2.1 得到无参构造
ConstructorInfo info1 = t4.GetConstructor(new Type[0]);
//执行无参构造函数
Test obj = info1.Invoke(null) as Test;//获得Test类的对象obj，无参构造函数传null
Console.WriteLine(obj.j);  //通过obj即可访问到Test类中的成员变量
//2.2 得到有参构造
ConstructorInfo info2 = t4.GetConstructor(new Type[] {typeof(int)});
obj = info2.Invoke(new object[] { 2 }) as Test;
Console.WriteLine(obj.str);

ConstructorInfo info3 = t4.GetConstructor(new Type[] {typeof(int), typeof(string)});
obj = info3.Invoke(new object[] { 3, "456" }) as Test;
```

### 获取类的公共成员变量

```cs title:获取类的公共成员变量
//1.获取所有成员变量
FieldInfo[] fields = t4.GetFields();
for (int i = 0; i < fields.Length; i++)
{
    Console.WriteLine(fields[i]);
}

//2.获取指定成员变量
FieldInfo infoJ = t4.GetField("j");
Console.WriteLine(infoJ); //返回Int32 J

//3.通过反射获取和设置对象的值
Test test = new Test();
test.j = 99;
test.str = "222";
//3.1 通过反射 获取对象的某个变量的值
Console.WriteLine(infoJ.GetValue(test)); //返回99 
//3.2 通过反射 设置指定对象的某个变量的值
infoJ.SetValue(test, 100);
Console.WriteLine(test.j); //返回100

```

### 获取类的成员方法
```cs title:获取类的成员方法
//使用Type类中的GetMethod方法
//GetMethod方法传入方法名，返回MethodInfo(方法的反射信息)对象
Type strType = typeof(string);
//如果存在方法重载，用Type数组表示参数类型
//1. 获取string类的所有方法
MethodInfo[] methods = strType.GetMethods();
for(int i =0; i < methods.Length; i++)
{
    Console.WriteLine(methods[i]);
}

//2. 获取String类的Substring方法，调用该方法
MethodInfo subStr = strType.GetMethod
    ("Substring",new Type[] { typeof(int), typeof(int) }); 
//注意：如果是静态方法，Invoke的第一个参数传null即可
string str = "Hello World";
//第一个参数相当于，是哪个对象要执行这个成员方法
object result = subStr.Invoke(str, new object[] { 0, 5 }); //调用Substring方法
Console.WriteLine(result); //输出Hello
```

### 其他
得枚举
`GetEnumName`
`GetEnumNames`

得事件
`GetEvent` 
`GetEvents`

得接口
`GetInterface`
`GetInterfaces`

得属性
`GetProperty`
`GetPropertys`


### 判断一个类型的对象是否可以让另一个类型为自己分配空间
```cs
//父类装子类
//是否可以从某一个类型的对象为自己分配空间
Type fatherType = typeof(Father);
Type sonType = typeof(Son);

if (fatherType.IsAssignableFrom(sonType))
{
    print("可以装");
    Father f = Activator.CreateInstance(sonType) as Father;
    print(f);  //输出Son
}
else
{
    Debug.Log("不可以装");
}
```

### 通过反射获取泛型类型
```cs
List<string> list = new List<string>();
Type listType = list.GetType();

Type[] types = listType.GetGenericArguments(); //GetGenericArguments()方法
print(types[0]);  //返回string 

Dictionary<string, float> dic = new Dictionary<string, float>();
Type dicType = dic.GetType();
types = dicType.GetGenericArguments();
print(types[0]); //0对应第一个泛型类型，返回string
print(types[1]); //1对应第二个泛型类型，返回float
```

## Activator 动态实例化

```cs
//1.获得要创建实例的类的类名
var className = " (命名空间 namespace).ClassName";

//2.得到当前类的类型
var classType = Type.GetType (className);
//或者
var classType = typeof (className);

//3.创建实例化类的参数数组
var args = new object[] { object1, object2, object3...};

//4. 使用 Activator 实例化类
var classInstance = Activator.CreateInstance (classType, args);
```

`Activator.CreateInstance` 方法的第一个参数是要创建的类型，第二个参数是可选的，用于指定构造函数的参数。如果要创建的类型没有默认构造函数，那么必须传递构造函数所需的参数。如果要创建的类型有默认构造函数，那么第二个参数可以为空。
此外，`Activator.CreateInstance` 方法返回的是 `object` 类型，需要进行强制类型转换。


```cs
//4.使用 Activator 实例化类
//或者
var classInstance = classType.InvokeMember ("", BindingFlags. CreateInstance, null, null, null);
```

`InvokeMember` 方法的第一个参数是空字符串，因为我们要调用的是构造函数，而不是方法、属性或字段。
第二个参数是 `BindingFlags. CreateInstance` 标志，表示创建对象实例；
第三个参数是绑定器，用于指定成员查找的方式；第四个参数是目标对象，因为我们要创建的是对象实例，所以目标对象为 null；第五个参数是构造函数参数，用于传递给构造函数的参数

```cs
//5.得到要执行的方法
var method = classType.GetMethod ("MathodName");

//6.执行方法
return method.Invoke (classInstance, null);
//或
return  classType .InvokeMember ("MathodName", BindingFlags. InvokeMethod | BindingFlags. Public | BindingFlags. Instance, null, classInstance , null);
```

`Invoke` 和 `InvokeMember` 都是反射中用于调用方法的方法，但它们有一些区别：
- 参数列表不同：`Invoke` 方法的第二个参数是 `object[]` 类型的数组，用于传递方法的参数；而 `InvokeMember` 方法的第三个参数是 `BindingFlags` 枚举类型，用于指定方法的访问权限、搜索方式等信息。
- 访问权限不同：`Invoke` 方法可以调用 public、protected、private 等所有访问权限的方法，而 `InvokeMember` 方法需要指定对应的 `BindingFlags`，才能调用对应访问权限的方法。
- 安全性不同：`Invoke` 方法可以执行非托管代码，因此需要受到安全性限制；而 `InvokeMember` 方法只能执行托管代码，因此相对更安全。

## 特性 Attribute
1. 特性是一种**允许我们向程序的程序集添加元数据的语言结构，它是用于保存程序结构信息的某种特殊类型的类**
2. 特性提供功能强大的方法以将声明信息与代码 （类型、方法、属性等）相关联。特性与程序实体关联后，即可**在运行时使用反射查询特性信息**
3. 特性的目的是**告诉编译器把程序结构的某组元数据嵌入程序集中**，它可以放置在几乎所有的声明中 (类、变量、函数等等申明)

说人话:
- 特性本质是个类
- 我们可以**利用特性类为元数据添加额外信息**，比如一个类、成员变量、成员方法等等为他们添加更多的额外信息
- 之后可以通过反射来获取这些额外信息

**基本语法:**
```
[特性名(参数列表)]
```
- 本质上就是在调用特性类的构造函数
- 可以写在类、函数、变量、函数参数前，表示为他们添加了额外的信息

### 自定义特性和使用
```cs h:1,20,49
//1. 自定义特性
//继承特征基类Attribute
//类名的末尾必须带Attribute
class MyCustomAttribute : Attribute
{
    //特性中的成员，一般根据需求来写，这些作为元数据的额外信息
    public string info;
    
    public MyCustomAttribute(string info)
    {
        this.info = info;
    }
    
    public void TestFun()
    {
        Console.WriteLine("特性的方法");
    }
}

//2. 使用特性，注意这里去掉了自定义特性末尾的Attribute
[MyCustom("用于计算的类")]
class MyClass
{
    [MyCustom("成员变量")]
    public int value;
    [MyCustom("成员函数")]
    public void TestFun([MyCustom("函数参数")]int a)
    {
        
    }
}


class Program
{
    static void Main(string[] args)
    {
        MyClass mc = new MyClass();
        Type t = mc.GetType();
        
        //判断是否使用了某个特性
        //参数一：特性的类型
        //参数二：是否搜索继承链（属性和特性忽略此参数）
        if(t.IsDefined(typeof(MyCustomAttribute),false))
        {
            Console.WriteLine("该类型应用了MyCustom特性"); //输出：该类型应用了MyCustom特性
        }
        
        //3. 通过反射来获取这些额外信息
        object[] array = t.GetCustomAttributes(true);
        for(int i=0; i<array.Length; i++)
        {
            MyCustomAttribute mca = array[i] as MyCustomAttribute;
            if(mca!=null)
            {
                Console.WriteLine(mca.info);  //输出：用于计算的类
                mca.TestFun(); //输出：特性的方法
            }
        }
    }
}
```

### 限制自定义特性的使用范围
通过**为特性类加特性**限制其使用范围

参数一: `AttributeTargets` 特性能用在哪些地方
参数二: `AllowMultiple` 是否允许多个特性实例用在同一个目标上
参数三: `Inherited` 特性是否能被派生类和重写成员继承
```cs h:3 e:21,24,26,27
//第一个参数：指明MyCutom特性类只能用在类和结构体上，故后面用于成员变量，成员函数，函数参数的特性都会报错
//第二个参数：不允许多个实例用在同一目标
[AttributeUsage(AttributeTargets.Class|AttributeTargets.Struct,AllowMultiple = true,Inherited = true)]
class MyCustomAttribute : Attribute
{
    //特性中的成员，一般根据需求来写，这些作为元数据的额外信息
    public string info;
    
    public MyCustomAttribute(string info)
    {
        this.info = info;
    }
    
    public void TestFun()
    {
        Console.WriteLine("特性的方法");
    }
}

[MyCustom("用于计算的类1")]
[MyCustom("用于计算的类2")] //error!不允许多个实例用在同一目标！
class MyClass
{
    [MyCustom("成员变量")] //error！
    public int value;
    [MyCustom("成员函数")]  //error！
    public void TestFun([MyCustom("函数参数")]int a) //error！
    {
        
    }
}
```

### 内置特性
#### 过时特性 
关键字：  `Obsolete`
- 用于提示用户使用的方法等成员已经过时，建议使用新方法
- **一般加在函数前**的特性

```cs
class TestClass
{
    //参数一:调用过时方法时提示的内容
    //参数二:true-使用该方法时会报错 false-使用该方法时直接警告
    [Obsolete("该方法已经过时，请使用Speak方法",false)]
    public void OldSpeak()
    {
        Console.WriteLine("OldSpeak");
    }
    
    public void Speak()
    {
        Console.WriteLine("Speak");
    }
}
```

使用过时方法会报错或者警告：
![[Pasted image 20230602202716.png|650]]

#### 调用者信息特性
**哪个文件调用?**
`CallerFilePath` 特性
 
**哪一行调用?**
`CallerLineNumber` 特性

**哪个函数调用?**
`CallerMemberName` 特性

需要引用命名空间 `using System. Runtime. CompilerServices;`
**一般作为函数参数的特性**

```cs
class TestClass
{
    public void SpeakCall(
        string str,
        [CallerFilePath]string filePath ="",
        [CallerLineNumber]int linNumber = 0,
        [CallerMemberName]string memberName = "")
    {
        Console.WriteLine(str);
        Console.WriteLine(filePath);
        Console.WriteLine(linNumber);
        Console.WriteLine(memberName);
    }
}

class program
{
    static void Main(string[] args)
    {
        TestClass testClass = new TestClass();
        testClass.SpeakCall("hello world");
    }
}

//输出
//hello world
//C:\Users\LiuKe\RiderProjects\ConsoleApp1\ConsoleApp1\Program.cs
//21
//Main

```

#### 条件编译特性
关键字： `Conditional`
它会和预处理指令  `#define` 配合使用
需要引用命名空同 `using System. Diagnostics`; 

主要可以用在一些调试代码上
有时想执行有时不想执行的代码

```cs
#define Func  //没有这个宏定义，Func()函数不会被编译
using System.Diagnostics;

namespace MyNamespace;


class Program
{
    [Conditional("Func")]
    static void Func()
    {
        Console.WriteLine("Hello World!");
    }

    static void Main(string[] args)
    {
        Func(); //若没有宏定义，则不会执行
    }
}
```
#### 外部 DLL 包函数特性
关键字： `DllImport`
用来标话非.Net (C#)的函数，表明该函数在一个外部的 DLL 中定义.
一般用来调用 c 或者 c++的 DLL 包写好的方法
需要引用命名空间 `using System. Runtime. InteropServices
```cs
[DllImport("Test.dll")]
public static extern int Add(int a, int b);  //使用Test.dll包里的方法
```

# 十二、枚举器和迭代器
- 迭代器 (iterator）有时又称光标（cursor)是程序设计的软件设计模式
- 迭代器模式提供一个方法顺序访问一个聚合对象中的各个元素，而又不暴露其内部的标识
- 在表现效果上看
    - 是可以在容器对象 (例如链表或数组)上遍历访问的接口
    - 设计人员无需关心容器对象的内存分配的实现细节
    - 可以用 foreach 遍历的类，都是实现了迭代器的

## 标准迭代器的实现方法
关键接口: `IEnumerator` , `IEnumerable`
命名空间:` using system. collections;`
可以通过同时继承 `IEnumerable` 和 `IEnumerator` 实现其中的方法

`foreach` 本质：
```cs title:使用迭代器实现List数据结构
class CustomList : IEnumerable,IEnumerator
{
    private int[] list;

    public CustomList()
    {
        list = new int[] { 1, 2, 3, 4, 5 };
    }
    
    //从-1开始的光标，用于表示当前遍历到的位置
    private int position = -1;
    
    public IEnumerator GetEnumerator()
    {
        Reset();
        return this; 
    }

    //移动光标
    public bool MoveNext()
    {
        //先将光标向后移动一位
        ++position;
        //如果position的值大于等于数组的长度，说明已经遍历完了
        return position < list.Length;
    }

    //reset是重置光标位置一般写在获取IEnumerator对象这个函数中//用于第一次重置光标位置
    public void Reset()
    {
       position = -1;
    }

    //返回当前光标所在位置的元素
    public object Current
    {
        get
        {
            return list[position];
        }
    }
}

class Program
{
    static void Main(string[] args)
    {
        CustomList list = new CustomList();
        //foreach本质
        //1.先获取in后面list对象的 IEnumerator(通过GetEnumerator方法来获取IEnumerator对象)
        //2.执行得到这个IEnumerator对象中的 MoveNext方法
        //3.只要MoveNext方法的返回值时true就会去得到current, 然后赋值给item
        foreach (int item in list)
        {
            Console.WriteLine(item);
        }
    }
}
```

## 用 yield return 语法糖实现迭代器
` yield return` 是 cs 提供的一个**语法糖**，也称**糖衣语法**
语法糖主要作用就是将复杂逻辑简单化，可以增加程序的可读性从而减少程序代码出错的机会
关键接口: `IEnumerable`
命名空间: `using System. collections;`

让想要通过 `foreach` 遍历的自定义类实现接口中的方法 `GetEnumerator` 即可

**使用 yield return 实现和上一节相同的功能：**
```cs
class CustomList : IEnumerable
{
    private int[] list;

    public CustomList()
    {
        list = new int[] { 1, 2, 3, 4, 5 };
    }


    public IEnumerator GetEnumerator()
    {
        for (int i = 0; i < list.Length; i++)
        {
            //yield关键字 配合迭代器使用
            //可以理解为暂时返回，保留当前的状态，一会还会再回来
            yield return list[i];
        }

        //等价于
        //yield return list[0];
        //yield return list[1];
        //yield return list[2];
        //yield return list[3];
        //yield return list[4];
    }
}

class Program
{
    static void Main(string[] args)
    {
        CustomList list = new CustomList();
        
        foreach (int item in list)
        {
            Console.WriteLine(item);
        }
    }
}
```

```cs title:泛型
class CustomList<T> : IEnumerable
{
    private T[] list;

    public CustomList(params T[] list)
    {
        this.list = list;
    }

    public IEnumerator GetEnumerator()
    {
        for (int i = 0; i < list.Length; i++)
        {
            //yield关键字 配合迭代器使用
            //可以理解为暂时返回，保留当前的状态，一会还会再回来
            yield return list[i];
        }
        
        //等价于
        //yield return list[0];
        //yield return list[1];
        //yield return list[2];
        //yield return list[3];
        //yield return list[4];
    }
}

class Program
{
    static void Main(string[] args)
    {
        CustomList<int> list = new CustomList<int>(1,2,3,4,5);
        foreach (int item in list)
        {
            Console.WriteLine(item);
        }
    }
}
```
# 十三、特殊语法
## 1 var 隐式类型
var 是一种特殊的变量类型，它可以用**来表示任意类型的变量**

注意:
1. var 不能作为类的成员，**只能用于临时变量声明**，也就是**一般写在函数语句块**中
2. var 必须初始化

```cs
var i = 5;
var array = new int[] { 1, 2, 3, 4, 5 };
var list = new List<int>();
```

## 2 匿名类型
**匿名类型**：
var 变量可以声明为自定义的匿名类型
```cs title:匿名类型
var v = new{age =10,name="John"};
Console.WriteLine(v.age);
Console.WriteLine(v.name);
```
## 3 设置对象初始值
声明对象时，可以通过直接写**大括号 `{}` 的形式初始化公共成员变量和属性
```cs
class Person
{
    public int money;
    public string Name { get; set; }
    public int Age { get; set; }
}

class Program
{
    static void Main(string[] args)
    {
        Person p = new Person { money = 100, Age = 10, Name = "Tom" };
    }
}
```
## 4 设置集合初始值
申明集合对象时，也可以通过**大括号**直接初始化内部属性
```cs
class Person
{
    public int money;
    public string Name { get; set; }
    public int Age { get; set; }
}

class Program
{
    static void Main(string[] args)
    {
        int[] array2 = new int[3]{1,2,3};

        List<int> list = new List<int>() { 1, 2, 3, 4, 5 };
        
        List<Person> people = new List<Person>()
        {
            new Person{Age = 100},
            new Person{Age = 200,Name = "Test"},
            new Person { money = 100, Age = 10, Name = "Tom" }
        };
    }
}
```


## 5 可空类型
1. 值类型是不能赋值为空 （null）的
2. 声明时在值类型后面加 `?` 可以赋值为空
```
   int？ c = null
```

3. 判断是否为空 `.HasValue`
```cs
if (c.HasValue)
{
    Console.WriteLine(c);
    Console.WriteLine(c.Value);  
}
else
{
    Console.WriteLine("null");
}
```

4. 安全获取可空类型值
```cs
int? d = null;
//如果为空，默认返回值类型的默认值
Console.WriteLine(d.GetValueOrDefault());
//也可以指定一个默认值
Console.WriteLine(d.GetValueOrDefault(5));
```

**语法糖：自动判断是否为`null`**
```cs
object o = "hello world";
if(o!=null)
{
    Console.WriteLine(o.ToString());
}

//语法糖：自动判断是否为空,如果为空则不执行，如果不为空则执行
Console.WriteLine(o?.ToString()); //等价
```

## 6 空合并操作符 ?? 
左边值 ?? 右边值
- 如果左边值为 null 就返回右边值，否则返回左边值
- 只要是可以为 null 的类型都能用
```cs
int? b = null;

int a = b ?? 100; //空合并操作符
int a = b == null ? 100 : b.value; //等价
```

## 7 内插字符串 $
关键符号: `$`
用 `$` 来构造字符串，让字符串中可以拼接变量
```cs
string name = "Hello world!";
Console.WriteLine($"好好学习，{name}"); 
```

# 十四、多线程
**进程是资源分配的最小单位，线程是 CPU 调度的最小单位**

![[Pasted image 20230611103909.png]]
**进程 (Process）**是计算机中的程序关于某数据集合上的一次运行活动
是系统进行资源分配和调度的基本单位，是操作系统结构的基础

说人话: 
- 打开一个应用程序就是在操作系统上开启了一个进程
- 进程之间可以相互独立运行，互不干扰
- 进程之间也可以相互访问、操作


![[Pasted image 20230611103916.png|311]]
**线程**是操作系统能够进行CPU运算调度的最小单位。
- 它被包含在进程之中，是进程中的实际运作单位
- 一条线程指的是进程中一个单一顺序的控制流，一个进程中可以并发多个线程
- 我们目前写的程序都在主线程中

简单理解线程:
就是代码从上到下运行的一条“管道”

**什么是多线程？**
我们可以通过代码开启新的线程
可以以同时运行代码的多条“管道”就叫多线程

## 线程类 Thread
需要引用命名空间 `using System.Threading;`

```cs
//1.声明一个子线程
//注意线程执行的代码需要封装到一个函数中(执行委托)
Thread t = new Thread(TestFunc);

//2.启动线程
t.Start();

//3.设置为后台线程
//当前台线程都结束了的时候,整个程序也就结束了,即使还有后台线程正在运行
//后台线程不会防止应用程序的进程被终止掉
//如果不设置为后台线程可能导致进程无法正常关闭
t.IsBackground = true;

//4.关闭释放一个线程
//如果开启的线程中不是死循环，是能够结束的逻辑，那么不用刻意的去关闭它
////如果是死循环想要中止这个线程有两种方式
//4.1-死循环中bool标识，让while(true)改为while(false)
//4.2-通过线程提供的方法(注意在.Net core版本中无法中止会报错)
t.Abort();
t = null;

//5.线程休眠，单位ms
//在哪个线程里执行，就让哪个线程休眠
Thread.Sleep(1000);
```

多个线程使用的内存是共享的，都属于该应用程序 (进程)
所以要注意，当多线程同时操作同一片内存区域时可能会出问题，可以通过**加锁**的形式避免问题

当我们在多个线程当中想要访问同样的东西进行逻辑处理时，为了避免不必要的逻辑顺序执行的差错
`lock (引用类型对象)`

```cs
static object obj = new object(); //引用类型

lock(obj)
{
    //逻辑1
}

lock(obj)
{
    //逻辑2 
}
```

**多线程对于我们的意义**
可以用多线程专门处理一些复杂耗时，影响主线成流畅度的逻辑，比如寻路、网络通信等等，副线程算完再拿到主线程使用

