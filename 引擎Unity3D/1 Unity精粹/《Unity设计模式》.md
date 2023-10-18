---
title: 《Unity设计模式》
aliases: []
tags: []
create_time: 2023-06-18 23:29
uid: 202306182329
banner: "![[]]"
---


# 单例模式介绍

单例模式是程序开发中很常用的一种设计模式。有时候为了节省内存资源、保证数据内容的一致性，对某些类要求**只能创建一个实例**，这就是单例模式。**在 unity 中，一些充当管理者的脚本就很适合使用单例模式，比如 UI 管理、事件管理，他们一般都是唯一存在的。**

## 实现思路

通常要获取类的实例，是通过 new 的方式，new 一次就获取一个类的实例，并且我们可以在任何地方 new。**但是频繁地创建实例会给内存造成很大的压力，对于有些类，我们只需用到它的一个实例就够了**，这个时候单例模式就派上了用场。那我们要怎样保证一个类只能被 new 一次呢？

**前提条件：**  
1. **首先要保证在 xxx 类的外部不能使用 new xxx() 的方式来获取该类的实例。** 我们可以给 xxx 类的构造方法私有化，这样就确保在类的外部无法不停地通过 new 创建多个对象。那么这时我们**只能从该类内部产生对象**，**该类实例的引用就可以成为该类的一个成员变量** ，等待在类的内部被实例化。（什么是类的实例的引用？比如 Person 类，Person person=new Person(); new Person() 得到该类的实例， person 是该类实例的引用）
2. 构造方法一旦私有化，外部就不可访问，只能**提供一个公共的方法来获取该类的实例**，而且这个方法不能是实例调用的方法（不能够通过创建该类的实例调用此方法），所以应该是一个**静态方法**。
3. 因为我们要通过单例类向外提供的公共静态方法来获取该类的实例，所以**该类实例的引用也要定义成静态**，才能被静态方法访问到。

因此接下来我们只用考虑如何在类的内部只实例化一次对象。

**单例模式的实现分为饿汉模式与懒汉模式。**  
根据刚刚介绍的思路，我们用代码来分别实现。

## 饿汉模式

```cs
public class Singleton
{
    //类一加载的时候，就创建对象，而且只会创建一次对象，这样就能保证实例唯一
    private static Singleton instance = new Singleton();
    private Singleton(){}
    //我这里用静态属性替代静态方法来实现外界对该类实例的访问。 
    public static Singleton Instance
    {
        get
        {
            return instance;
        }       
    }
}
```

<mark style="background: #FF5582A6;">饿汉模式</mark>：**这个类饥渴难耐地想要被实例化**。这个类被加载时，就会自动实例化这个类。
1. 它是线程安全的。
2. 不过这个可能会导致该类的实例过早地被加载出来，从而占据内存空间。

CodeMonkey 写的一种实现方法：限制单个Player
```cs
public class Player : MonoBehaviour
{
    public static Player Instance { get;private set;}


    private void Awake()
    {
        if (Instance != null)
        {
            Debug.LogError("There is more than one Player instance");
        }
        Instance = this;
    }
}

```
## 懒汉模式

### 经典版

```cs
public class Singleton
{
    private static Singleton instance;

    private Singleton(){}

    public static Singleton Instance
    {
        get
        {
            if (instance == null)
                instance = new Singleton();
            return instance;
        }       
    }
}
```

<mark style="background: #FF5582A6;">懒汉模式</mark>：**该类的实例懒得一开始就被加载，只有别人伸手要了，它才会出动。** 这个时候，只有我们第一次调用 Singleton.Instance 去获取该类的实例时才会被实例化。也就是**需要使用时才会创建实例**。  
不是线程安全的。可能出现两个线程同时去获取 instance 实例，且此时 instance 仍为 null，那么就会出现两个线程分别创建了 instance，违反了单例规则。

### 多线程加锁版

```cs
public class Singleton
{
    private static Singleton instance;
    private static readonly object locker = new object();
    private Singleton(){}

    public static Singleton Instance
    {
        get
        {
            lock (locker) {
                if (instance == null)
                    instance = new Singleton();
                return instance;
            }            
        }       
    }
}
```

**通过把 locker 锁住可以挂起其他线程，保证只有当前一个线程能够执行 lock 包裹的代码块**。执行完毕后，之前挂起的其他线程中又会有一个线程被唤醒，执行 lock 内的代码，但是这个时候 instance 变量已经在第一次就被实例化了，所以它会直接返回之前创建好的那个实例，这就**解决了懒汉模式线程不安全的问题。**  
不过这么写仍有一个**弊端**：我只需要在第一次创建实例时才用加锁，因为之后想获取该类的实例就直接返回创建好的那个实例了，无需再次 lock，造成性能消耗。

### 加锁改进版

```cs
public class Singleton
{
    private static Singleton instance;
    private static readonly object locker = new object();
    private Singleton(){}

    public static Singleton Instance
    {
        get
        {
            if (instance == null)
            {
                lock (locker)
                {
                    if (instance == null)
                        instance = new Singleton();                    
                }
            }
            return instance;
        }       
    }
}
```

使用了两个条件判断语句。  
内层的 if 保证了第一次获取 instance 只能有一个线程进入[实例化对象](https://so.csdn.net/so/search?q=%E5%AE%9E%E4%BE%8B%E5%8C%96%E5%AF%B9%E8%B1%A1&spm=1001.2101.3001.7020)的语句块，其他同时进入的线程要先被锁住，等到对象实例化完毕后再释放，但这时 instance 已经被创建好了，因此不会重复创建实例，而是直接执行 return instance。  
外层的 if 保证只有第一次获取 instance 才需要加锁，因为此时还未创建实例，要避免线程安全问题。之后再次获取就直接执行 return instance，节省了加锁的性能开销。

## 单例基类

一个项目中可能会有多个类需要应用到单例模式，如果每个类都重复写一遍单例的思路，会显得很繁琐。**为了提高代码的复用性，我们可以把单例的思路封装成一个基类，然后让需要实现单例模式的类继承这个单例基类**。  
那基类的 instance 类型要设成什么呢？我们要保证这个类型能够适配任何类型，因此需要用上泛型来实现。

### 普通单例基类

**基于懒汉模式：**
```cs
public class SingletonBase<T> where T : new()
{
    private static T instance;
    private static readonly object locker = new object();
    public static T Instance
    {
        get
        {
            if (instance == null)
            {
                lock (locker)
                {
                    if (instance == null)
                        instance = new T();
                }
            }
            return instance;
        }
    }
}
```

几个注意点：

1.  我们要用 where T:new() 对泛型做个约束，保证是能够被实例化的类型。
2.  这里没有设置私有构造器是因为这个基类要用于继承，那么设置私有构造器就没有意义了。虽然这种单例类仍然可以通过 new 的方式不停地创建实例。但实际上我们看到一个类是单例模块时也不会闲着没事干去随便实例化。

### 继承自 MonoBehaviour 的单例基类（手动添加到游戏对象上）

unity 中的游戏脚本要继承自 MonoBehaviour，然后可以去调用如 Start()，Update() 之类的一些生命周期函数和 MonoBehaviour 类提供的一些函数。**继承自 MonoBehaviour 的类不能通过 new 的方式去实例化**。而是**先把脚本手动拖给游戏物体或者调用 AddComponent 方法附加给游戏物体**，之后 unity 会自动帮我们实例化。所以这个时候不能使用刚刚介绍的单例基类。我们要创建一个继承于 MonoBehaviour 的单例基类，那么继承于该基类的类也会继承于 MonoBehaviour 。

类似于饿汉模式：

```cs
public class SingletonMonoBase<T> : MonoBehaviour where T:MonoBehaviour
{
    private static T instance;
    public static T Instance
    {
        get
        {
            return instance;
        }
    }
    protected virtual void Awake() {
        
        if (instance != null)
        {
            Destroy(gameObject);
        }       
        else
        {
            instance = this as T;
        }
        
    }
}
```

注：  
1）此单例基类的 Awake 方法要设成 **protected 虚方法**，便于它的子类去重写进行功能拓展。不过子类重写了 Awake 必须要在方法的第一行调用 base.Awake()，否则会把基类 Awake 的单例功能覆盖掉。  
2）T 的约束不再是一个能实例化的类，而是 MonoBehaviour 或者 SingletonMonoBase  
3）当 instance 不为空时销毁游戏物体是为了保证一个继承于此单例基类的脚本无法挂在多个游戏物体上，保证当前场景只有唯一的这个脚本。不过我们在手动添加脚本时也要注意**不能将一个单例模块加到多个物体上**，否则可能会销毁我们原本不想销毁的物体。  
4）这里用类似饿汉模式的写法是便于将 “判断一个单例脚本有没挂载到多个物体上” 的逻辑放到脚本生命周期函数 Awake 里执行，直接通过**判断实例有无重复来保证在脚本初始化时就生成单例**。如果用懒汉模式 “有需则用” 的思想不大好保证一个单例脚本只能挂在一个物体上，就算有实现方法（比如查找场景中有几个这种脚本）也肯定没有饿汉模式来得简单。

继承于此单例基类的脚本示例：

```cs
//虽然这个类没继承 MonoBehaviour ，但是它的父类继承了
public class SingleTest : SingletonMonoBase<SingleTest> {
//如果要扩展父类的 Awake 方法要这么写
    protected override void Awake() {
        base.Awake();      
    }
    public void Test() {
        print(gameObject.name);
    }
}
```

用于调用单例的脚本（此脚本我挂到了一个名叫 Manager 的物体上：

```
public class GameController : MonoBehaviour
{
    void Start() {
        SingleTest.Instance.Test();
    }
}
```

注：这里我把逻辑写在了 Start 方法里而不是 Awake 是因为 unity 脚本的执行顺序是随机的，可能 GameController 的 Awake 比 SingleTest 的 Awake 先执行，那么这个时候 **SingleTest 的实例还未初始化**，直接调用它的方法会报空引用异常！！！虽然可以手动在 Edit-> Project Settings->Script Execution Order 中调整脚本执行顺序，不过显然会比较麻烦！

**一般来说，一个单例模块会挂在一个空物体上。** 我把单例脚本挂在一个 GameObject 上，然后运行程序：  

![[57d7c082e2c1d3d5a0ceea069468dcc3_MD5.png]]

![[acbcc4d9edd9dff2068e043427b36f2d_MD5.png]]

但是如果我不小心将这个脚本挂到两个物体上：  

![[2e2e1e6b7fe027d69393979f10db9e11_MD5.png]]

  
运行结果：  

![[954298b2e6555e2abfbfbfea8fe2a437_MD5.png]]

可以看到同样挂载 SingletTest 脚本的 GameObject 物体被销毁了。这是因为此时 Main Camera 中的 SingleTest 先执行了 Awake ，创建了一个单例。然后等到 GameObject 中的 SingleTest 执行 Awake 时，因为 instance 已经存在，所以会销毁脚本挂载的游戏物体。尽管此时场景中确实只有一个 SingleTest 实例，但我们的本意是让这个单例脚本挂在我们创建的一个空物体 GameObject 上。因此，**继承于这种单例基类的脚本需要我们人为地保证只有一个游戏物体挂载了这个脚本**。

不过一般来说，充当管理者的脚本要作用于全局，也就是切换场景时这个脚本不能被销毁，脚本所挂载的物体不能被销毁。如果要实现这个需求，需要对继承于此单例基类的脚本进行修改，比如：

```
public class SingleTest : SingletonMonoBase<SingleTest> {
    protected override void Awake() {
        base.Awake();
        DontDestroyOnLoad(gameObject);
    }
   public void Test() {
        print(gameObject.name);
    }
}
```

如果在你的游戏中，所有的单例模块全是无法销毁的管理者，你甚至可以把 DontDestroyOnLoad 写在单例基类的 Awake 方法中，提高代码复用性。

但是这种手动添加到游戏对象上的单例个人感觉不是很好用。原因如下：  
1）手动添加可能会因疏忽而出错，比如不小心把单例模块挂到多个物体上。  
2）可能得考虑脚本执行顺序（Awake 顺序）的问题。

### 继承自 MonoBehaviour 的单例基类（自动添加到游戏对象上）

调用此单例基类的子类时会将子类的脚本挂在自动创建的物体上，无需我们手动挂载。  
基于懒汉模式：

```
public class SingletonAutoMonoBase<T> : MonoBehaviour where T:MonoBehaviour
{
    private static T instance;
    public static T Instance
    {
        get
        {
            if (instance == null)
            {
                GameObject obj = new GameObject();
                obj.name = typeof(T).ToString();
                DontDestroyOnLoad(obj);//这行代码根据实际需求决定是否写在基类中
                instance = obj.AddComponent<T>();
            }
            return instance;
        }
    }
}
```

另外，我把物体无法销毁写在了基类中，如果在实际项目中有些单例模块需要过场景销毁，那么 DontDestroyOnLoad 要写在每个子类里。  
创建一个脚本继承此单例基类：

```
public class AutoSingleTest : SingletonAutoMonoBase<AutoSingleTest>
{    
    public void Test() {
        print(gameObject.name);
    }
}
```

然后在另一个脚本去获取 instance （此脚本需要手动添加到游戏对象中）：

```
public class GameController : MonoBehaviour
{
    void Start() {
        AutoSingleTest.Instance.Test();
    }
}
```

![[1f35edcd368e1c8c5493437d49f5af78_MD5.png]]

未运行程序前的面板：  

![[8a05138da9e0c699ff314a2b5f001d1d_MD5.png]]

接下来运行程序：  

![[09343734f29d64ebe1a578b5995a492f_MD5.png]]

  
程序自动帮我们创建了一个不可销毁游戏物体 AutoSingleTest ，并且挂载了 AutoSingleTest 脚本。不像前一种单例基类，还要手动把单例基类的子类挂到一个物体上。而且这种实现方式还保证了一个单例脚本只挂载到一个物体上。

以上便是三种单例基类的用法，具体用哪个根据实际需求来定。对于那些管理器对象，一般使用普通的单例基类就能满足需求。希望本篇博客大家有所帮助！🌹



# 解耦合
我正在开发一款模拟经营类游戏，这一类游戏往往结构都非常的复杂，从底层到上层包含了许许多多的内容，简单罗列一下，它大概可以分为底层系统、全局游戏系统、子游戏系统三个部分。

*   **底层系统**  
    底层系统包含了和游戏逻辑无关的支持部分，比如输入系统、资源系统、音效和粒子特效管理系统、UI 管理系统、场景加载系统等等。
*   **全局游戏系统**  
    和游戏逻辑弱相关的全局系统、比如时间系统、地形系统、寻路系统、AI 系统等等。
*   **上层游戏系统**  
    也就是与游戏逻辑直接相关的部分，包括玩家代理系统、天气系统、日期系统、昼夜变化系统、种植系统、养殖系统、建造系统、任务系统、剧情对话系统等等。

我被这些憨批系统们折磨了很久很久。人会秃顶确实是原因的，精神上，每天都在和这些系统以及它们的 bug 斗智斗勇，物理上，被一个 bug 折磨了好几个小时没有办法时只能挠头。以至于每天晚上都在做噩梦，我梦见了一个怪物，那个怪物就像是一个用各类组织和躯体缝合出来的一个可怕的怪人、我问怪物你是谁，它说，我是你写的代码。

![](https://pic3.zhimg.com/v2-d886a39cb644085346d3b326096d386a_r.jpg)

在不断的精神折磨下，我尝试找到了一些救赎之道，其中最令我困顿的就是耦合问题，所以来写一篇简单的文章总结一下，本文所采用的语法为 C#。

## **1. 关于耦合**

耦合几乎是不可避免的，无论如何编码都会存在耦合，只是程度问题而已。有些耦合属于正常的代码交互，不会产生危害。所以为了甄别这些问题，就要理解耦合的起因以及了解什么时候它们会产生危害。

### **1.1 单向耦合与双向耦合**

我觉得对耦合最好的定义其实是依赖关系，当一个对象依赖另外一个对象而存在的时候，就可以理解为耦合。既然如此，可以很轻松的推断出耦合是可以单向的，因为对象 A 依赖对象 B 并不意味着 B 也会依赖 A。

有个学生叫汤姆，他喜欢上了同年级的另外一个学生小美。可以用代码描述如下：

```
static void Main(string[] args){

    舔狗 汤姆 = new 舔狗("汤姆", 23);
    女神 小美 = new 女神("小美", 23);
    汤姆.喜欢(小美);
}
```

在上述案例中，汤姆使用了方法 `喜欢`，参数为一个 `女神` 类的对象，可见 `舔狗` 类是具有这样的一个方法的。

```
public class 舔狗{
    //..other methods
    
    public void 喜欢(女神 someone){
        // do something here..
    }	
}
```

这里就开始产生耦合了，因为舔狗类是依赖于女神类而存在的，如果删除女神类的话，那么舔狗类的部分方法比如 `喜欢` 就会出现定义错误。但是删除舔狗类却不会对女神类产生影响，因为女神类并没有应对于舔狗类的方法，这就是单向的耦合。

不过如果我们也给女神类追加一个新的方法，比如 `pua`，那么女神类也会依赖舔狗类而存在，两者就是互相依赖的。

```
public class 女神{
	//.. other methods
    
	public void pua(舔狗 someone){
	    //.. do something here
	}
}
```

这样问题就更加严重了，因为删除任何一方对另外一方来说都是致命打击。两者就死死的绑定着，这就是双向耦合，那么一般来说，我们肯定希望耦合尽量不发生，即使不可避免的发生，也应该是单向耦合。

### **1.2 子类和父类的耦合**

父类和子类之间存在着继承关系，所以它们有着天然的耦合关系，而继承的意义是什么呢？本质上其实是为了避免方法定义太多重复的方法。所以子类继承父类，就等于把父类的函数全部重新定义一遍。并支持系统以父类的身份来访问子类。但是当子类继承链过长的时候，就比较麻烦了。

青蛙是一种两栖类的动物，小时候的青蛙是蝌蚪。为了描述它们的关系，不妨先定义一个动物类，它具有一个呼吸的方法。

```
public abstract class 动物{
    // ..other methods
    
    public abstract void 呼吸();
}
```

蝌蚪是需要实现呼吸方法的，而蝌蚪是利用鳃来呼吸的。

```
public class 蝌蚪: 动物{
    // ..other properties
    private 鳃 _鳃;
    
    // ..other methods
    public void 呼吸(){
	_鳃.呼吸();
    }
}
```

而当我们用青蛙继承蝌蚪的时候，也会同时继承它的鳃，但显然青蛙是用肺来呼吸的，虽然我们避免了一堆函数重定义，但是有些用不上的东西也被继承了。

```
public class 青蛙: 蝌蚪{
    // ..other properties
    private 肺 _肺;
    
    // ..other methods
    public void 呼吸(){
	_肺.呼吸();
    }
}
```

难办哦，而现实情况中则是青蛙会在成年之后会退化掉蝌蚪时的鳃，但是静态类编程语言没有办法动态修改自己的内存空间。当你实例化 `青蛙` 的时候，即使没有创建鳃的实体，依然会为其分配一块空白的内存空间，这就是继承链过长的危害之一。

### **1.3 不加限制的使用单例模式的后果**

单例模式，指的是一个类只能创建一个实例，如果你希望在最高耦合度代码大赛中获得第一名的话，那么单例模式应该是你致胜小妙招里的头号选择。

![](https://pic1.zhimg.com/v2-94f65fcd3c79ccc33c432d7c7535557c_r.jpg)

单例模式的意义其实并不在于一个类只能创建一个实例，因为创建几个实例完全是自己定义的。它主要的意义是让这个实例以静态对象的形式挂在自己的类名之下，其他对象可以直接通过全局来访问它。

赛博小张是未来世界的一个程序员，尽管人类已经实现了冷核发电技术、但是小张依然要 996，不过我们先抛开这些悲伤的话题，来聊点工作上的问题。

赛博小张要负责机器人的代码编写，你知道这些烧钱的机器都是那些猛的批爆的神级大佬研发的牛逼玩意，所以他们封装的很完善，你只需要调用就可以了，这个机器人需要编写好几个模块来进行驱动，包括引擎、腿、手臂、还有视觉系统啥的。小张自己也不太懂，反正就调包就可以了，即插即用嘛。

因为机器人肯定只有两个手臂和两条腿、一个引擎和一个视觉系统，所以这些都可以用单例模式来整, 于是小张开干了。

```
public class 引擎{
    public static 引擎 instance;
    // ..other code here
}
public class 手臂{
    public static 手臂 instance_L;
    public static 手臂 instance_R;
    // ..other code here
}
public class 腿{
    public static 腿 instance_L;
    public static 腿 instance_R;
    // ..other code here
}
public class 视觉系统{
    public static 视觉系统 instance;
    // ..other code here
}
//..other modules
```

还行，事情到这里还是很正常的。要运行机器人，首先要启动所有的组件，所以小张开始编写启动代码了。

```
public class Robot_XiaoZhang{
    public void run(){
        /* 启动机器人 */
        
        引擎.instance.run();
        手臂.instance_L.run();
        手臂.instance_R.run();
        腿.instance_L.run();
        腿.instance_R.run();
        // other modules run..
    }
}
```

但是启动之前还应该先检查引擎的能量是否足够才对

```
public void run(){
    /* 启动机器人 */
	
	if(!引擎.instance.hasFullEnergy){
        Console.WriteLine("能量不足");
        return;
    }
    // other code here
}
```

当然，对组件自身的安全检查也是必不可少的。

```
public void run(){
    /* 启动机器人 */
	
    if(引擎.instance.hasError){
	Console.WriteLine("引擎损坏");
	return;
    }
    // 检查其他组件是否完好..
    
    if(!引擎.instance.hasFullEnergy){
	Console.WriteLine("能量不足");
        return;
    }
    // other code here..
}
```

当然，接着我们可以编写机器人运动的代码，运动的代码需要事先检查腿部是否完好，然后控制腿部进行运动，当然，腿部机械也得访问视觉系统以免遇到什么障碍，等等，它们都应该受限于能源系统，所以也得访问一下能源系统！

事情似乎朝着一个不可控的方向发展了，最终，在小张的不懈努力之下，这个 robot 脚本变成了一个超级庞大的屎山，任何新的需求都必须按照这个屎山的标准来编写，这个脚本形成了非常庞大的技术壁垒，以至于只有小张本人才能勉强看懂写了些啥。大家都以为这个玩意很高端，只有小张能弄。

但是好景不长，后来公司要替换其中的一些组件，引擎和一些乱七八糟的组件全给换了，结果这里的一堆代码都失效了。好在机智的小张已经提桶跑路了，没有给到分区技术主管问责的机会。

![](https://pic3.zhimg.com/v2-515457895ef11b3449e97c468ef08b7e_r.jpg)

对于很多非服务性结构的实体对象来说，以全局的形式去访问它可以非常便捷，但是这也是在将整个系统绑定到各个局部的组件，任何一次单例的访问都是一次绑定，多次绑定之后会使得整个系统再也离不开这些单例对象，形成一种牵一发而动全身的境地。

所以使用单例应当十分谨慎，最好确保只有服务性的功能或者那些真正全局性的功能通过单例来访问。

### **1.4 关于耦合起因的总结**

所以发现了吗？当一个系统明确的引用另外一个系统的同时，就会出现耦合，所以耦合是必不可少的，但是高度的耦合会使得整个系统失去重构的活性。不仅如此，如果纯粹的功能逻辑与组织性业务代码高度耦合，那么代码的复用性就会降低。所以这里总结一些简单的规范去尽量的避免这样的情况发生，提升代码的品质。

## **2. 关于解耦**

我们来围绕游戏开发这个主题来讲解一些实际的情景，此处仍然采用 C# 和 Unity 作为案例。

咳咳咳，所谓高内聚、低耦合，本质上就是降低代码的相互依赖性，然后它其实有一些固定的解决方案，比如下面要说到的组件模式、生产者消费者模型、服务定位模式。它们都在解耦，受限于语法描述，它们的方法有所不同，但是本质上都是在降低代码之间的连接成本。

让我们从一个简单的案例来说明一下什么是降低连接成本，假设我们要渲染一个道具栏的格子，它只需要渲染道具的图标和数量即可。所以这个道具栏渲染器肯定会有两个基本组件，一个 `Image` 组件和一个 `Text` 组件。如下图所示：

```
public class ItemRenderer: MonoBehaviour{

    public Text text;
    public Image image;
}
```

然后道具信息大概是这样的：

```
public struct Item{
    public Sprite sprite;
    public int count;
}
```

一方是渲染器，一方是数据。如何组织交互代码呢？你可以把 `Item` 交给 `ItemRenderer`：

```
public class ItemRenderer: MonoBehaviour{

    public Text text;
    public Image image;
    
    public void render(Item item){
        /* render item */
        
	image.sprite = item.sprite;
        text.text = item.count.ToString();
    }
}
```

看起来不错，不过也可以把 `ItemRenderer` 交给 `Item` 去处理：

```
public struct Item{
    public Sprite sprite;
    public int count;
    
    public void render(ItemRenderer render){
        /* render item */
        
        render.text.text = count.ToString();
        render.image.sprite = sprite;
    }
}
```

把 `Item` 交给 `ItemRenderer`，会使得 `ItemRenderer` 被耦合到 `Item`，这样一来，这个渲染器就会受限于 `Item`，一旦数据失效或者被调整，这个渲染器也会同时被调整。反过来也是一样的，而且渲染器的调整比数据更为频繁。

但我们肯定希望两者都是可活动的，所以正确的做法就是，由一个上级对象来负责交互。

```
public class UpperObject{
    
    public void renderItem(Item item, ItemRenderer renderer){
        /* render item */
	
	renderer.text.text = item.count.ToString();
	renderer.image.sprite = item.sprite;
    }
}
```

现实中的情况，往往渲染器和数据都非常复杂，它们可能都是一个巨大的对象，想象一下两个或者多个这样巨大的对象交互在一起会有多么的复杂。虽然这些对象本身很复杂，内容体量比较大，但是它们的交互却非常简单。而使得它们耦合的最关键的因素就是这些交互代码。所以我们不妨将这些交互代码专门的提取出来，形成一个上级控制对象，就可以使得两个对象之间不再产生硬性的联系，如果我们要更换一个新的渲染器，则只需要修改交互代码即可。

这就是我们所谓的弱化连接，当然，说的专业点就是低耦合。

### **2.1 用组件模式代替长继承链或巨型对象**

还记得之前说的青蛙的案例吗？长继承链的问题其实会导致一些复杂继承结构的系统变得非常臃肿，其实在游戏中有很多典型的案例，假设要做一个 ACT 类型的游戏，里面肯定会有一堆敌人，有的敌人会使用剑、有的敌人会释放魔法。但是它们都可以被攻击，所以我们可以编写一个关于怪物的基类，`EnemyBase`，然后编写两个具体的对象 `EnemySword` 和 `EnemyMagic`，它们的关系如下图所示：

![](https://pic3.zhimg.com/v2-c663d317d69fa0d32a9ddea47a3343a2_r.jpg)

如果就这么简单还好，但其实现实情况中往往会比较复杂，比如我们肯定还希望有一个敌人它既可以用剑、也可以释放魔法，无论是从何处继承，它都会产生代码的冗余。

而组件模式逐渐替代了这种长继承链或者类似的需求产生的巨型对象，组件模式认为 Sword 或者 Magic 这样的功能应该形成一个单独的组件，独立于它的宿主类。

如果真的实现了一个 `EnemySword` 类，它的结构应该是两个部分，第一它继承了 `EnemyBase`，使得它拥有一些敌人的基础信息。其次它实现了剑部分的代码，这部分代码本质上是没有必要和 `EnemySword` 这个具体对象耦合的。它可以变成一个独立的组件，叫做 `SwordOwner`。然后任何需要这个组件的对象挂载这个组件即可。

这样一来，代码的复用性和容错率就大大提高了。那么 Unity 就是围绕组件模式构建了整个引擎的基础功能，包括物理组件中的刚体组件、碰撞器组件等。

**剑的部分就是代码的实现，而挂载剑这个行为就是代码的访问。围绕实现和访问两个要素是贯穿整个解耦合的核心线索。**

### **2.2 生产者消费者模型**

生产者消费者模型是一种典型的基于队列的分布式模型，它的意义倒不是对代码进行解耦，而是对工作负载进行解耦。生产者消费者模型经常出现于爬虫系统或者消息系统中，我们且以爬虫系统作为一个案例来进行简单的说明。

假设我们要爬取一个网站的图片，这个网站有数个页面、每个页面下都会有很多的图片。我们可以编写一个简单的爬虫，先从主页爬取图片链接然后再从链接中下载图片到本地。这种做法没什么问题，但是如果要加快爬取的速度（不考虑风控情况下的理论速度），我们就得考虑分解这个爬虫，其实链接的爬取速度是很快的，因为它就是一段字符串，然而图片爬取相对较慢。可以分解的话，我们应该保留少部分的算力用以应对链接爬取，让更多的算力来爬取图片。

遇到这种情况，我们通常以队列来进行解耦，队列是一个多线程容器，对于它来说，有两种基本行为就是放入和拿去，在生产者消费者模型中，将元素放入队列的叫做生产者，将元素拿出队列的叫做消费者。

![](https://pic3.zhimg.com/v2-c5d318d52d034277c0130b3a45b460ba_r.jpg)

这样一来，我们可以将原本是一个处理逻辑中的两个对象拆解开，使其运行于不同的线程或者不同的机器中。为什么要拆开呢？因为生产者和消费者的工作压力不同，生产者的工作压力也许很大，也许很小，消费者同理，但是两者的工作压力只要是有悬殊的差别，就十分适合用生产者消费者模型来进行处理。

对于爬虫的案例来说，生产者就是不断爬取链接地址的爬虫，而消费者就是读取地址下载图片的爬虫。一般来说，爬取链接的地址的爬虫工作压力较低，数量很少，往往只有一台机器。而爬取图片的爬虫工作压力较大，数量较多，往往有多台机器。所以生产者消费者模型在爬虫案例下也可以称之为主从机模型。

如果主从机都部署在本地的话，那么两者其实可以运行于不同的线程之中，通过普通队列来进行解耦。而如果主从机并不部署在本地，而是部署在不同的云服务器中，我们则可以通过一些数据库来进行解耦，比如 Redis，Redis 数据库在各类现代化云服务中都承担着网络中间件的职责，经常出现于各类分布式系统中。

联系前面我们说到的访问和实现，你会发现，对于生产者和消费者，它们互不清楚彼此所处理的数据将从何而来，去向何方。在这个案例中，生产者所爬取的图片链接只是放到队列里，至于这些链接是如何处理的它并不关心，同理，对于消费者来说，拿到链接只是负责爬取，至于链接是手动输入的，还是从哪里被集中推送的都无所谓，访问和实现是相互独立的。

### **2.3 观察者模式**

观察者模式有点类似于生产者消费者模型，但是仍然有不少区别。如果我们的游戏有一个成就系统，玩家可以实现很多的成就，比如击杀 10000 名敌人之类的。这个玩意本身的逻辑很简单，但是如果你真的在击杀敌人之后给一个数字 + 1 的话，我觉得这太蠢了，因为我们会有一堆跟击杀敌人相关的东西，比如你正在做一个任务，任务需要你击杀 10 名敌人，也许游戏的新手教程会通过你是否击杀了一名敌人来确保后续的内容可以展开。

你会发现，你的这个行为有太多对象会关注，但它又不会一直关注。这种情况下就比较适合于观察者模式登场了，它也可以叫做发布订阅模式，或者同步事件队列。和生产者消费者模型不同的地方有两点

*   观察者模式是具有发布订阅机制的，也就是说，观察者并不会一直存在着，也许你完成了某个成就之后，这个成就就不再关注下一次行为的发生了，而生产者消费者模型并不具有此类特性。
*   观察者模式往往是同步的，而生产者消费者模型则一定是异步模型（因为同步的生产者消费者模型理论上完全丧失了构建它的意义）

实现观察者模式其实非常简单，它就是一个特殊的全局消息系统，任何行为都可以发送一条消息，比如你击杀了一名敌人，你可以在敌人死亡的同时通过消息系统来广播一条消息。

```
public static class GameAPI{
    public static void broadcast(GameMessage message){
	//广播一条消息
        //..other code here
    }
}
```

想象一下微信讨论群吧，你肯定加入了很多微信群。但是这里的微信群只关注一种消息，假设某个敌人死亡了，然后它死亡的函数中发送了一条**敌人死亡的消息**，那么我们会在专门监听敌人死亡的微信群里有没有人，一看，这个群里有三个人：

*   **成就系统 - 击杀 10000 名敌人**
*   **任务 - 击杀 10 名敌人**
*   **新手教程 - 击杀一名敌人**

那么我们就可以执行这三个人的处理函数，如果某个对象不需要再监听这个消息，它就从这个群里退出即可。这套系统在 C# 中其实有一个天然的实现，叫做 `event` 关键字。你可以将你的委托绑定于这个关键字来实现一个监听的群。

```
public class 微信群{

    public event Action<GameMessage> eventHandle;
    public void register(Action<GameMessage> handle){
	/* 注册一个消息监听函数到该群 */
		
	this.eventHandle += handle;
    }
    public void unregister(Action<GameMessage> handle){
	/* 从该群注销一个消息监听 */
		
	this.eventHandle -= handle;
    }
    public void send(GameMessage msg){
	/* 向该群发送一条消息 */
		
	this.eventHandle?.Invoke();
    }
}
```

是不是很简单，然后你只需要维护一组这样的群即可。

```
public class 微信{

    public class Dictionary<GameMessageType, 微信群> groupList;
    // ..other code here
}
```

观察者模式对行为的触发和监听进行了解耦，那么理论上，几乎所有的代码都可以通过观察者模式来进行解耦，但是这样效率会低很多很多。所以我们需要进行简单的甄别，比如玩家的血量发生变化时，是否需要通过观察者模式来进行解耦？

```
public class Player{
    public const int maxHealth = 100;
    private int health;		// 玩家的血量
    public void composeHealth(int adder){
        /* 回复或者减少玩家的血量 */
	
	this.health = Math.Clamp(health + adder, 0, maxHealth);
		
	/* 广播一条玩家血量变化的消息 */
	GameMessage msg = new GameMessage(GameMessageType.PLAYER_HEALTH_CHANGED, health);
	GameAPI.broadcast(msg);
    }
    //..other code here
}
```

有哪些对象会关注玩家的血量变化呢？比如 UI 系统中的血条渲染，或者有一些怪物会通过观察玩家血量的变化做出对应的行为逻辑。但是别忘了，观察者模式也可以叫做发布订阅模式，理论上来说，它是针对那些动态切换自己状态的监听系统准备的，比如 UI 系统中的血条渲染，任何时刻玩家都需要渲染自己的血条，甚至于血条不显示时，你也可以传输数据给它。理论上来说，这个行为逻辑贯穿了从游戏的生命周期开始到结束。对于这种常驻监听来说，直接在 `composeHealth` 函数中实现它最好，这种解耦是不必要的。

再次联系到访问和实现这个核心线索，在这个案例中，实现指的是在了解到玩家的血量变化时，游戏中的其他对象需要做出什么反应，而访问指的就是，是由谁来驱动这些系统进行逻辑的处理。

### **2.4 面向接口编程 / 桥接模式**

**接口 (Interface)**，一个在语法层面被支持的解耦型模式，它可以被称之为接口模式或者桥接模式。它是一种属于相对底层的模式，因而大部分时候我们在探讨接口时甚至不再讨论这个模式本身，而在于什么时候，什么情境下使用它会更加方便合理。

接口描述了一组函数的签名，而没有具体的实现。那么换而言之，如果一个接口只有一个函数的话，它和一个委托无异，所以如果一个接口仅有一个函数，我们可以用委托来进行代替。

![](https://pic3.zhimg.com/v2-b7c7163aceca6e7d5d7c83aa7e8199d6_r.jpg)

接口的使用情景非常多，这也是为什么它成为了一个被语法层面支持的模式（包括观察者模式也是一样），我列举几种我遇到的比较合适的情况。

**渲染和逻辑强相关的情况下可以通过接口来规避逻辑和渲染耦合**

很多模拟经营类游戏中都有建造类玩法，而建造这种行为，它是一个渲染和逻辑强相关的部分。假设我们进入了建造模式，然后能够通过鼠标来移动建造指示器，通过检查目标位置是否能够放置建筑（是否有其他建造器挤占了这个位置）来改变指示器的外观（比如切换为红色表示此处不可建造，绿色表示为此处可以建造），除此之外，还有一堆杂七杂八的 UI 元素、比如建造消耗提示、一些文本提示 UI、全局屏幕特效之类的。

在渲染和逻辑是强相关的情况下，渲染会和逻辑绑定的十分紧密。这个时候接口就很适合将建造模式的渲染需求描述出来

```
public interface IBuilderRenderer{
    /* 建造器的渲染需求 */
	
    string opertionTip{set;}						// 操作提示(比如按下A确认)
    bool isBuildableNow{set;}						// 标记此处是否可以建造
    void onPosMoved(Vector2Int pos);					// 当建造位置移动时触发
    void onBuildConfirm(Vector2Int pos);				// 在目标位置确认建造时触发粒子特效
    //..other methods here
}
```

这样一来的话，两者自身的代码就会很好的被隔离开，而且这两个部分完全可以由不同的人来进行开发。无论渲染端如何进行变化和改进，它都不会影响到建造逻辑，同理建造逻辑怎么变化，也不会影响渲染的处理。

**底层插件容易发生变动的情况**

记得在之前写关于输入控制器部分的时候，也提到过关于桥接模式，目前 Unity 有旧版的 Input 全局对象和 InputSystem 两种不同的输入系统。那么对于上层逻辑来说，控制器的变化会使得上层逻辑也发生变化。比如获取鼠标位置的 API 改变了，这就比较难受，所以可以增加一个虚拟控制器对象来桥接上层逻辑和底层实现。

```
public interface IVirtualInput{
    /* 虚拟控制器 */
    
    bool jump{get;}					// 玩家跳跃按键
    bool fire{get;}					// 玩家开火按键
    // other methods here..
}
```

对于上层游戏逻辑来说，只需要轮询控制器来做出对应的动作即可。

```
public void Update(){
    /* 轮询输入事件并进行对应的处理 */

    if(vin.jump){
	
	jump();
    }else if(vin.fire){
	
	fire();
    }
}
```

而对于底层逻辑来说，可以通过不同的方法实现这个虚拟控制器，比如使用旧版本的 Input 可以这样做。

```
public class GameInput: IVirtualInput{
    public bool jump => Input.GetKeyDown(KeyCode.Space);
    public bool fire => Input.GetMouseButtonDown(0);
}
```

当然，我并不是说输入系统容易发生变化，只是用于举例，如果底层插件发生了变动，要想现有的系统不随着你使用的插件而产生变化，就可以通过接口来进行桥接。

**宽松的管理末端和统一的交互模式**

在游戏中肯定都会有一些主角和各类对象交互的需求，这种行为，往往是主角的碰撞器遇到了一个触发器之后弹出一个交互提示符，比如玩家走到一个建筑门前，会弹出一个 “进入” 的提示符。然后主角按下某个按键后可以进入，对于这种元素来说，它的实现端是多种多样的，它有可能是一个设备、一个怪物、一个 Npc、一个建筑等等。互动逻辑也千差万别，但是都通过同一个单位来进行访问，所以这种情况就非常适合接口去进行处理。

Unity 借助 C# 的反射模式支持从 `GetComponent` 函数来获取对象，比如我们可以编写一个可交互对象接口

```
public interface IInteractable{

    void onTouch();
    void onDistouch();
    void onInteract();
}
```

然后在可交互对象扫描器中的碰撞检测中处理任何实现了这个单位的对象。

```
public void OnTriggerEnter2D(Collider2D other){
    /* 检测到触发器碰撞体 */
	
    IInteractable entity;
    if((entity = other.gameObject.GetComponent<IInteractable>()) != null){
	/* 编写对应的处理函数来处理IInteractable */
        
        // other code here
    }
}
```

这样一来，任何携带能够被扫描器扫描的单位只要实现了 IInteractable 就可以被自动交互了。

### **2.5 服务定位模式**

服务定位模式就是将单例模式以接口的形式构建起来，主要的区别有两个，第一是通过接口将实现和访问隔离，第二就是固定访问代码，以免其他访问代码受到实现层的干扰，我们通过一个简单的案例来说明服务定位模式。

游戏中肯定会有很多文本，而文本一般可以分为两个大类，第一类数量较少，为系统性文本。也是每个游戏绝对会有的部分。第二类数量较多，为剧情文本，具体则根据游戏是否有剧情元素来决定。

此处可以设计一套针对系统性文本，比如菜单项，系统配置项等文本内容的支持热更新的系统。方法很简单，既然系统性文本数量较少，那我们可以直接通过枚举的方式来全部列出来。

```
public enum SystemText{
    /* 枚举所有的系统性文本 */

    GAME_START,
    GAME_END,
    // ..other operations
    MENU_MAIN,
    MENU_CONFIG,
    // ..other menu items
}
```

它们对应了一段文本，然后我们可以建立起一个临时的字典来维护这组文本，以便于进行热切换。

```
public class SystemTextMaintainer{
    public Dictionary<SystemText, string> texts;
    
    public void setText(SystemText key, string value){
	/* 覆盖或者追加一个新的键值对 */
		
	if(texts.ContainsKey(key)){
	    texts[key] = value;
	}else{
	    texts.Add(key, value);
	}
    }
    public string getText(SystemText key){
        /* 如果key不存在，则直接返回key的enum文本 */
        
        if(texts.ContainsKey(key)){
            return texts[key];
        }
        return key.ToString();
    }
}
```

然后我们可以构建一个 JSON 文件，通过解析这个 JSON 文件来覆写整个 `SystemTextMaintainer` 中的数据。

```
{
    "GAME_START":"游戏开始",
    "GAME_END":"游戏结束",
    //..
    "MENU_MAIN":"主菜单",
    "MENU_CONFIG":"配置"
    //..
}
```

当然，也可以准备一个英文的版本。

```
{
    "GAME_START":"start game",
    "GAME_END":"game over",
    //..
    "MENU_MAIN":"main menu",
    "MENU_CONFIG":"config menu"
    //..
}
```

如果直接使用单例模式的话，我们可以直接从 `SystemTextMaintainer` 创建一个实例并让其他单位来直接访问这个单例。

```
public class SystemTextMaintainer{
    public static SystemTextMaintainer instance;
    //..other code here
}
```

但是这样会给自己埋坑，最好是通过接口来隔离访问与实现。尤其是这种全局服务性代码实体。方式有两种，第一种是构建一个接口。

```
public interface TextProvider{
    
    string get(SystemText name);
}
```

这种写法比较简单，但是访问端会麻烦点。还有一种写法比较麻烦，但是访问端会简单些。

```
public static class TextProvider{
    
    public static Func<SystemText, string> getter{get;set;}
    public static string GAME_START => getter(SystemText.GAME_START);
    public static string GAME_NED => getter(SystemText.GAME_END);
    //..
    public static string MENU_MAIN => getter(SystemText.MENU_MAIN);
    public static string MENU_CONFIG => getter(SystemText.MENU_CONFIG);
    //..
}
```

这样，任何访问端需要使用到的时候直接通过 TextProvider 来访问即可，如下所示

```
public void test(){
    //..
    text.text = TextProvider.GAME_START;
    //..
}
```

这就是服务定位模式的一种具体手段，它通过 `TextProvider` 隔开了访问与实现，甚至于 `TextProvider` 自己也不知道服务端到底是谁，它只是用于定位而已。而我们只需要在游戏初始化的时候，将 `SystemTextMaintainer` 的 `getText` 函数赋值给 `TextProvider` 的 `getter` 字段即可。游戏在任何时候都可以进行文本热切换，不会影响到任何访问端。

## **3. 解耦合的总结**

解耦合的中心思想就是分割实现与访问，说法可以随便切换，比如分割实现与数据传输，但是它的核心仍然是将相关代码聚拢到一起，避免不相关代码的高度耦合。

在这里稍微叠个甲，我知道这篇文章一发出来就会有很多人来喷，来骂，认为我没写过多少代码却一直在谈模式。我从 2015 年开始自学代码，一直是以实战主义为主，写到今天也算是有 7、8 年了。写过桌面程序、AndroidAPP、网站前后端、区块链、深度学习、编译器、游戏、着色器。研究过. NET 的 IL 代码，Lua 和 Python 的底层实现，学过大多数主流的语言和各类数据库。甚至大学时代接单的时候接到过在 MC6800 芯片上的汇编指令集写一个冒泡排序算法。当然，比我厉害的大神肯定比比皆是，不胜枚举。

我希望大家开喷之前认真的读完文章，如果你觉得文章内容是有问题的，最好的解决方法是离开，如果关注我了可以取关，没有关注我的可以屏蔽拉黑。然后实在是忍不住了再开始喷，感谢！

列举了一堆解耦合的方法之后，还有人认为我是过度解耦合，是一种愚蠢的表现。这种你就没有办法，主题就是解耦合我不说解耦合我难道讲怎么在最高耦合度大赛里获取第一名的小技巧？文章也不看，直接先设个前提，然后直接下定论，无语了。