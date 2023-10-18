![](1690255163824.png)

# 01:Create project 创建项目导入素材

创建项目使用 3D 再转 [URP](https://so.csdn.net/so/search?q=URP&spm=1001.2101.3001.7020)，，，，直接创建 URP，就没有办法把现有的项目升级到 URP

1.  package manager 安装 universal pipeline
    
    ![](1690255163903.png)
    
2.  添加渲染管线
    
    ![](1690255163998.png)
    
3.  项目设置
    
    ![](1690255164066.png)
    
    ![](1690255164166.png)
    

生成两个文件  

![](1690255164261.png)

  
UniversalRenderPipelineAsset ：用于设置渲染效果参数集合 htm  
UniversalRenderPipelineAsset_Renderer：定义渲染的方式（类型，形式）blog

![](1690255164360.png)

  
**插入素材时确保支持 LWRP 或 URP 渲染管线**

预制体的材质是粉色说明还没适配当前[渲染管线](https://so.csdn.net/so/search?q=%E6%B8%B2%E6%9F%93%E7%AE%A1%E7%BA%BF&spm=1001.2101.3001.7020)  

![](1690255164453.png)

![](1690255164520.png)

edit-render pipeline 往后点，第一个是全部素材升级到 urp，第二个是选中的素材，，一般用第一个  

![](1690255164620.png)

# 02:Build Level 尝试熟悉基本工具

![](1690255164689.png)

修改[天空盒](https://so.csdn.net/so/search?q=%E5%A4%A9%E7%A9%BA%E7%9B%92&spm=1001.2101.3001.7020)  

![](1690255164808.png)

  
修改草地渲染颜色  

![](1690255164883.png)

![](1690255164987.png)

![](1690255165087.png)

阴影  

![](1690255165164.png)

  
shadow 是 max distance 是在 50 距离内渲染阴影，，，也可以下面分级，分 2 级，在 8.4m 距离高精度渲染，41.6 内低精度渲染，，超出不渲染  
渲染质量开启 HDR，可选择抗锯齿  

![](1690255165248.png)

v 键按住移动物体自动吸附最近的顶点  
选中相机或者物体，，，在摁 ctrl shift F，自动将物体设置为你当前视角的位姿坐标。  

![](1690255165348.png)

分栏区分环境中的物体  

# 03:PolyBrush 发挥创意构建场景

使用 polybrush 修改地面 terrian，，  

![](1690255165420.png)

  

![](1690255165521.png)

刷上不同颜色表明设置不同位置的有不同的素材，功能  
刷素材的功能默认把复制的素材当成接触到的面的物体的子物体  
terrian 的面和顶点非常少，，，直接放大 ground 也没用，添加 plane 也没用，需要使用 probuilder 插件，可以创建多面片的平面  

![](1690255165632.png)

![](1690255165729.png)

  
将平面切割为三角形  
progrid 可以现实更多参考线，移动物体时，按照设置的默认移动距离  

![](1690255165822.png)

每次都移动设定的 0.2 距离  

# 04:Navigation 智能导航地图烘焙

地面需要设置哪里可以走哪里不能走，，，再 window-navigation 选项进行设置  

![](1690255165925.png)

  
蓝色区域能上  
选中树木设置 not walkable  
人物要设置 navigation，然后 navigation 修改人物 navigation 碰撞单位的大小  

![](1690255166036.png)

  

# 05:MouseManager 鼠标控制人物移动

想要点击控制，其实就是创建一个**事件**  
**通过创建一个事件，获取鼠标点击的 vector3 类型值，然后传递给事件指定的 gameobject 的 component 的 navmeshagent.destination 的目标地点**

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

[System.Serializable]
public class EventVector3 : UnityEvent<Vector3> { }  //继承了vector3类型
//这个class不是集成monobehaviour，需要被系统序列化才能在inspector现实出来

public class MouseManager : MonoBehaviour
{
    public EventVector3 OnMouseClicked;

    RaycastHit hitInfo;

    void Update() {
        SetCursorTexture();
        MouseControl();
    }

    void SetCursorTexture() {
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);//从屏幕点击位置创建射线

        if (Physics.Raycast(ray, out hitInfo))//创建raycast，获取hitInfo
        {

        }
    }

    void MouseControl() {
        if(Input.GetMouseButtonDown(0) && hitInfo.collider != null)   //点击鼠标左键是0并且点击的东西碰撞体不为空
        {
            if(hitInfo.collider.gameObject.CompareTag("Ground"))
                OnMouseClicked?.Invoke(hitInfo.point);//?.代表判断当前的事件是否为空，如果不为空，执行invoke启动传入事件这个坐标点
        }
    }
}
```

ScreenPointToRay 和 raycast 联合工作，就是摄像机那个锥体尖尖作为发射点，屏幕点击哪里，锥体大的那个面就产生一个点，出发点和这个点连成一条线，线与环境的交点就是想要的点。

![](1690255166137.png)

speed 移动速度  
angular speed 转动速度  
acceleration 加速度  
stopping distance 停止距离，，如果是近战武器就距离点击位置近一点停下来，意味着距离目的地 1m 的地方停下来，，，如果是长柄武器，可以停的位置远一点  
auto braking 自动刹车

# 06:SetCursor 设置鼠标指针

单例模式 [https://blog.csdn.net/qq_52855744/article/details/117755154](https://blog.csdn.net/qq_52855744/article/details/117755154)

什么是单例模式？  
答：单例模式（Singleton），也叫单子模式，是一种常用的软件设计模式。在应用这个模式时，单例对象的类必须保证只有一个实例存在。许多时候整个系统只需要拥有一个的全局对象，这样有利于我们协调系统整体的行为。比如在某个服务器程序中，该服务器的配置信息存放在一个文件中，这些配置数据由一个单例对象统一读取，然后服务进程中的其他对象再通过这个单例对象获取这些配置信息。这种方式简化了在复杂环境下的配置管理。  
什么时候用到？  
答：当游戏中的某一个游戏对象永远只有一个实例的时候，那么可以使用单例模式。

![](1690255166247.png)

  
所有自身变量的获取全部放到 awake 里面实现获取赋值，以免出现空引用  
PlayerController 挂在狗身上。  

![](1690255166371.png)

  
如果使用了单例，就不需要拖拽复制了，，，因此 mouseManager 脚本需要把 event 类删了，serializable 删掉，，删了就不能用 event 了，需要使用 action 方法

action 是返回值为 void 的内置委托类型，如果遇到这类委托可以直接使用无需自己定义

![](1690255166464.png)

创建单例，必须是 static 类型

单例模式调用，，，，就是：类名. Instance.action，这个 action 联想有闪电符号  

![](1690255166559.png)

  

![](1690255166659.png)

  
因为 Action 定义了类型是 Vector3，所以订阅了 action 委托的 MoveToTarget() 也必须是 Vector3  

![](1690255166725.png)

在 max size 还可以修改图标大小  

![](1690255166820.png)

  
设置鼠标图片

```
case "Ground":
    Cursor.SetCursor(target, new Vector2(16, 16), CursorMode.Auto);
//（图片，偏移值（因为鼠标照理说只有一个点的点击位置有效，需要设定这个点击的偏移量），模式自动）
    break;
```

# 07:Cinemachine & Post Processing 摄像机跟踪和后处理

![](1690255167046.png)

处理摄像机位置  
插入 virtual camera  

![](1690255167113.png)


# 08:Animator 动画控制器

![](1690255167478.png)

![](1690255167577.png)

![](1690255167669.png)

插入一个简单的 blend tree  

![](1690255167771.png)

  
点击 add motion field 添加新的运动，，，拖动 speed 滑条，会根据速度播放不同的动画  

![](1690255167858.png)

```c
private NavMeshAgent agent;

    private Animator anim;

    void Awake() {
        agent = GetComponent<NavMeshAgent>();
        anim = GetComponent<Animator>();//获取动画
    }

    void Start() {
        MouseManager.Instance.OnMouseClicked += MoveToTarget;
    }

    void Update() {
        SwitchAnimation();
    }

    void SwitchAnimation() {
        anim.SetFloat("Speed", agent.velocity.sqrMagnitude);//设置浮点数，，因为speed是浮点数
        //创建blend tree的时候会创建参数parameter，，这个parameter的名字就是这里的第一个参数
        //第二个是获取agent的速度，，因为速度是vector3，要通过velocity.sqrMagnitude转换成浮点数
    }
```

# 09:Shader Graph 遮挡剔除

![](1690255167952.png)

  
创建一个 shader graph，右键选中这个 shader graph 创建一个 material  

![](1690255168018.png)

创建一个 alpha 通道  
右键 - create node-Fresnel effect（一个光圈的效果）  

![](1690255168165.png)

如果希望创建一个可调整的光圈颜色 ，并且在 inspector 中可以查看，需要创建一个 color 参数，  
可以创建要给 multiply 节点，从而将颜色和 fresnel 效果相乘。  

![](1690255168269.png)

  
Dither 噪点，创建一个 float 类型来接到 Dither 上，然后连接到 Alpha 值，右下角就有效果了  

![](1690255168380.png)

  

![](1690255168477.png)

刚刚创建的两个参数都显示了  
保存 shader 要点这个按钮 save asset  

![](1690255168561.png)

  
urp 是可编辑渲染管线，党人物移动到树后面需要使用 shader 效果  

![](1690255168635.png)

add renderer fearture - renderer objects 添加渲染物体  

![](1690255168728.png)

  
创建一个 player 的 layer 层，这样这个渲染特点只对 player 层使用这个效果，在下方选中材质，应用深度选项，选择 greater（比当前深度更大就应用），去掉 writer depth  

![](1690255168831.png)

前后两个状态应用的材质不同，在前面的时候才不会自己遮挡自己，显示遮挡材质  
**人物移动到树后面，没有办法点击树后面的地面，因此需要修改遮挡问题：两个办法：**

1、所有树 - layer-Ignore raycast **取消射线遮挡**  

![](1690255168895.png)

  
2、关闭所有树的 mesh collider，如果爆装备是弹出物品， 有 collider 会弹

# 10:Enemy Set States 设置敌人的基本属性和状态

![](1690255168964.png)

  
确保人物身上有这个组件，因此在前面加一个 RequireCompoment，类型为 typeof，NavMeshAgent，，，拖拽到人物身上时，如果没有这个脚本，就自动添加这个组件  

![](1690255169029.png)

拖拽上去就自动添加了 navmeshagent  
点击敌人，敌人需要添加 box collider  
enemy 需要添加 layer 和 tag 用于遮挡剔除和点击操作  

# 11:Player Attack 实现攻击动画

![](1690255169124.png)

  
直接创建 Action 并注册，直接在注册到事件时写一个函数名，，，然后点击前面的灯泡，自动创建一个函数  
**人物移动到敌人面前，需要不断判断距离是否小于攻击距离，，不能直接用 while，需要用一个协程**

**yield return null 也可以写成 yield return 0 或 yield return 1，，作用是暂缓一帧，下一帧接着往下处理，后面的数字不起作用，无论是几，都是下一帧接着处理**

```cs
IEnumerator CaculateResult()
{
    for (int i = 0; i < 10000; i++)
    {
        //内部循环计算
        //在这里的yield会让改内部循环计算每帧执行一次，而不会等待10000次循环结束后再跳出
        //yield return null;
    }
    //如果取消内部的yield操作，仅在for循环外边写yield操作，则会执行完10000次循环后再结束，相当于直接调用了一个函数，而非协程。
    //yield return null;
}
```

选中函数名，按住 Ctrl + R 可以批量改名字  
创建好了协程之后，，，调整人物攻击动画，在 animator 中添加一个 trigger 变量，拖拽一个攻击动画进来，设置动画的转移 make transition  

![](1690255169222.png)

  
创建好了动画，在代码中根据 CD 时间和距离通过协程赋值 trigger 触发。

```cs
private void EventAttack(GameObject target)
    {
        if (target != null)
        {
            attackTarget = target;
            //打开协程
            StartCoroutine(MoveToAttackTarget());
        }
    }

    IEnumerator MoveToAttackTarget()
    {
        agent.isStopped = false;
        //lookat转向朝向攻击目标
        transform.LookAt(attackTarget.transform);

        //判断目标与人物的距离
        while(Vector3.Distance(attackTarget.transform.position, transform.position)>1)
        {
            agent.destination = attackTarget.transform.position;
            yield return null;
        }

        //用agent.isStopped判断是否真的停了。
        agent.isStopped = true;

        if (lastAttackTime < 0)
        {
            anim.SetTrigger("Attack");
            //重置冷却时间
            lastAttackTime = 0.5f;
        }
    }

//需要在设置agent的函数中修改isStopped为false，，否则走到敌人面前就不能再走动了
```

# 12:FoundPlayer 找到 Player 追击

![](1690255169310.png)

  

![](1690255169405.png)

可以查看很多输入方法，比如鼠标的 x、y 值  
设置敌人在视野范围内追踪 player，，如果用 distance 其实对于物体很多的时候消耗很大，不如使用触发器  

![](1690255169480.png)

  

![](1690255169588.png)

使用 foreach 和 Physics.OverlapSphere  
之后给 player 添加上碰撞体  

# 13Enemy Animator 设置敌人的动画控制器

预制体说明

original prefab：新建的 prefab 和原来的是独立的，无关的  
prefab variant：新建的 prefab 和原来的 prefab 部分关联。新建的 Prefab 是 variant，他可以有自己独立的属性。可以把共同属性作为原始的 prefab 然后拖过来形成性的 prefab 再添加新的属性。

对 player 新添加了一个 collider，但是之前由 player 创建的 prefab 没有这个，可以通过这个方法应用到 prefab 上产生变化，，或者直接重写 prefab  
可以在 GameObject 上对产生修改的组件应用到 Prefab，也可以直接重写 Overrides-Apply all  

![](1690255169675.png)

![](1690255169768.png)

![](1690255169877.png)

  
调整动画权重，权重为 1 基本上是覆盖，下面 additive 是叠加，，用多个层避免动画连的跟蜘蛛网一样

![](1690255169944.png)

关联脚本变量与动画控制参数，用于调整动画  

# 14: Patrol Randomly 随机巡逻点

```
//可视化显示一些范围，例如敌人的追击范围
    //只显示选中物体的gizmos
    private void OnDrawGizmosSelected() {
        Gizmos.color = Color.blue;
        Gizmos.DrawWireSphere(transform.position, sightRadius);
    }
```

![](1690255170029.png)

  
**unity 中 C# 使用乘法比除法开销小。**  

![](1690255170121.png)

设置了巡航，可能自动生成的巡航点路线上有东西会卡住模型运动。  

![](1690255170208.png)

![](1690255170291.png)

```c
void GetNewWayPoint()
    {
        remainLookAtTime = lookAtTime;
        float randomX = Random.Range(-patrolRange, patrolRange);
        float randomZ = Random.Range(-patrolRange, patrolRange);
        Vector3 randomPoint = new Vector3(guardPos.x + randomX, transform.position.y, guardPos.z + randomZ);

        NavMeshHit hit;
        wayPoint = NavMesh.SamplePosition(randomPoint, out hit, patrolRange, 1) ? hit.position : transform.position;
    }
```

# 15:CharacterStats 人物基本属性和数值

数值相关的文件，可以生成要给 Script Asset 文件，类似 pipeline asset 文件，存储一系列的资源数值  

![](1690255170379.png)

合理命名，看文件就知道是干什么

> [!NOTE] 关于脚本**是否要继承 MonoBehavior**
> 
> 
> 想这个问题前先考虑你的脚本是用来干嘛。是用来挂载到物体上的组件？还是普通类
> 如果只是用来定义class，**靠继承来管理 Enemy（敌人）类及其子类的各种数据，则不需要继承MonoBehaviour**。 
> 如果是写一个脚本组件，而且需要**挂到物体上使用的，那一定要继承MonoBehaviour**。所有通过组件扩展功能的都必然要继承MonoBehaviour，否则无法挂上去。
> 只要想清楚了每一个 class 属于功能组件还是单纯的、独立的类，就可以很好的处理这个问题。
> 能用单纯脚本实现的功能，尽量不要和Unity扯上关系，即避免继承MonoBehavior，保持纯粹性。
> 

关于 **ScriptableObject 类**

**1. 为什么某些情况下使用 MonoBehaviour 很不好：**

*   运行时刻修改了数据一退出就全部丢失了。
*   这个深有感触，目前都是靠 Copy Component Values 来解决，很麻烦。其实有这样的需求的时候大部分就说明这个脚本存储的是很多数据，就应该考虑使用 ScriptableObject，而不是 MonoBehaviour。说到底是因为这些对象不是 Assets
*   当实例化新的对象的时候，这个 MonoBehaviour 也在内存中多了一份实例，浪费空间
*   在场景和项目之间很难共享
*   在概念上就很难定义这种对象，明明是为了存储一些数据和设置等，但却要作为一个 Component 附着在 Gameobject 或 Prefab 上，不能独立存在

**2.ScriptableObject 是我们的 rescue！**

*   在内部实现上它仍然继承自 MonoBehaviour，但它不必附着在某个对象上作为一个 Component
*   我们也不能（当然初衷就是不愿意）把它赋给 Gameobject 或 Prefab
*   可以被 serialised，而且可以自动有类似 MonoBehavior 的面板，很方便
*   可以被放到. asset 文件中，也就是说我们可以自定义 asset 的类型。Unity 内置的 asset 资源有材质、贴图、音频等等，现在依靠 ScriptableObject 我们可以自定义新的资源类型，来存储我们自己的数据
*   可以解决某些多态问题

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

//在create菜单中创建一个子集菜单
[CreateAssetMenu(fileName = "New Data", menuName = "Character Stats/Data")]

public class CharactoreData_SO : ScriptableObject
{

}
```

![](1690255170448.png)

用这个流程，可以创建一个资源文件  

![](1690255170533.png)

![](1690255170599.png)

  
右侧图片上面的 Script 别忘了选择 CharacterData_SO  

![](1690255170669.png)

  
可以通过这一个 ScriptableObject 文件创建多个人物的数值文件，因为不是 MonoBehvaior，无法挂到物体上，所以需要单独写管理脚本，用于读取管理相关数值  

![](1690255170738.png)

可以创建继承 monobehavior 的脚本管理数值，并且可以发现能够读取 CharactorData_SO 的类型  
因为不希望逐级访问：CharacterStats.characterData.maxHealth，所以我们需要用 properties 属性方法

```cs
//这样通过CharacterData.MaxHealth可以直接读到characterData的数据
public class CharacterStats : MonoBehaviour
{
    public CharacterData_SO characterData;

    //如果不希望inspector赋值、希望有初始赋值、并且按照一定的规则取值赋值
    //如果只有get，意味着只可读，如果只有set，意味着只可写。如果都有就是可读可写
    public int MaxHealth 
    {
        get
        {
            if (characterData != null)
                return characterData.maxHealth;
            else return 0;
        }
        set
        {
            characterData.maxHealth = value;
        }
    }
    //通过CharacterData.MaxHealth直接读取asset的值，也可以通过CharacterData.MaxHealth=xx
    //直接给asset里面的值赋值，xx=value，value表示外部对这个属性的赋值
    //value是关键字，不是变量
}

//可以通过#region和#endregion标注出大块代码的作用，并且折叠起来
    #region Read from Data_SO
    public int MaxHealth 
    {
        get { if (characterData != null) return characterData.maxHealth; else return 0; }
        set { characterData.maxHealth = value; }
    }
    public int CurrentHealth
    {
        get { if (characterData != null) return characterData.currentHealth; else return 0; }
        set { characterData.currentHealth = value; }
    }

    public int BaseDefence
    {
        get { if (characterData != null) return characterData.baseDefense; else return 0; }
        set { characterData.baseDefense = value; }
    }

    public int CurrentDefence
    {
        get { if (characterData != null) return characterData.currentDefense; else return 0; }
        set { characterData.currentDefense = value; }
    }
    #endregion
```

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

//在create菜单中创建一个子集菜单
[CreateAssetMenu(fileName = "New Data", menuName = "Character Stats/Data")]

public class CharacterData_SO : ScriptableObject
{
    [Header("Stats Info")]
    public int maxHealth;
    public int currentHealth;
    public int baseDefense;
    public int currentDefense;
}
```

![](1690255170826.png)

类的特点

**这样的操作对于修改数值，只要去修改 asset 这个数值模板就行**

1.  **创建继承 ScriptableObject 的脚本**
2.  **依据该脚本创建数值模板 Asset**
3.  **创建继承 MonoBehavior 的脚本类用于读写数值模板，并且挂载到人物身上**
4.  **给该脚本赋值要读取的数值模板 Asset**
5.  **在物体 Manager 脚本编写代码创建读取数值模板的类变量，通过 GetComponent <读取数值模板的类>() 给该类赋值**
6.  **通过这个类读取写入数值模板**

![](1690255170898.png)

  

# 16:AttackData 攻击属性

同样创建攻击数值的 Asset 文件，  

![](1690255171001.png)

[HideInInspector]

可以保证 public 的变量在别的文件可以访问，但是 inspector 看不见  

![](1690255171068.png)

![](1690255171140.png)

![](1690255171232.png)

![](1690255171324.png)

# 17:Execute Attack 实现攻击数值计算

```cs
//需要计算攻击减掉防御，因此需要传入两个CharacterStats变量。
    public void TakeDamage(CharacterStats attacker, CharacterStats defender) {
        int damage = Mathf.Max(attacker.CurrentDamage() - defender.CurrentDefence, 1);//如果是攻击低于防御，则产生负数伤害，需要跟1比较，产生一个最低1点的伤害
    }

    private int CurrentDamage() {
        float coreDamage = UnityEngine.Random.Range(attackData.minDamage, attackData.maxDamage);
        if(isCritical)
        {
            coreDamage *= attackData.criticalMultiplier;
            Debug.Log("暴击" + coreDamage);
        }
        return (int)coreDamage;
    }
```

对于简单游戏，不会使用是否产生了碰撞而触发伤害，会在动画执行到某一时刻执行一个事件，事件调用一个函数方法触发伤害来计算生命值  

![](1690255171396.png)

  
在动画过程中的某一帧插入事件，事件选择需要触发的函数  

![](1690255171493.png)

**因为史莱姆是 fbx 包含了动画，所以是只读，无法编辑插入事件，需要手动复制一个动画出来才能编辑，选中 fbx 下面的动画 ctrl + D，复制一份就可以编辑了，需要在 Animator 窗口重新把之前的两个战斗 Animation 修改一下。**  

![](1690255171585.png)

直接把刚刚复制出来的拖拽过来就行

# 18:Guard & Dead 守卫状态和死亡状态

ScriptableObject 只要游戏不退出，数值会始终记录，，，运行试玩需要修改数字

```
if(Vector3.SqrMagnitude(guardPos-transform.position) <= agent.stoppingDistance)
{
    isWalk = false;
    transform.rotation = Quaternion.Lerp(transform.rotation, guardRotation,);
    //lerp函数后面有个t是标准化的数值，意味着从t-1逐渐转到对应角度。
}
//理论上 sqrMagnitude的开销比distance小

lerp源码
public static float Lerp(float a, float b, float t){
        return (b-a)*t;
}
```

guard 目标拉脱之后，回到位置，需要调整朝向。  

![](1690255171709.png)

  
死亡动画从任何状态都可以开始播放，因此从 any state 开始连接，，，另**外要取消勾选 can transistion to self，不然会持续播放**  

# 19: 泛型单例模式 Singleton

通过一个 GameManager 控制整个游戏流程，包括人物死亡带来的影响。  

![](1690255171801.png)

GameManager 默认齿轮图标  
在 GameManager 中 public 一些变量，方便其他脚本获取  
**这个脚本希望通过观察者模式反向注册的方法，在 player 在生成的时候，告诉 GameManager 它是 PlayerStats**  
游戏中的 Manger 都要是单例模式，这样只有一个， 方便访问  
因此要写一个泛型的单例模式，，，所有 Manager 都继承这个泛型单例，就很省事  

![](1690255171870.png)

创建泛型单例脚本，放在 Tools 文件夹

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
//需要在SingleTon后面加一个T，表示Type，传进来任何一个Type都行
//做一个约束，表示T继承SingleTon<T>类型，where是关键词
//我要创建一个泛型函数，但是里面的泛型不知道是什么，我要通过where进行约束
public class SingleTon<T> : MonoBehaviour where T : SingleTon<T>
{
    //这句话意味着SingleTon<T>继承MonoBehaviour
    //并且where限制传入的T必须是继承SingleTon<T>
}
```

虚函数的讲解

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

//做一个约束，传入的必须是SingleTon<T>
public class SingleTon<T> : MonoBehaviour where T : SingleTon<T>
{
    //自己的成员变量
    private static T instance;
    //外部可以读取赋值的变量
    public static T Instance
    {
        get { return instance; }
    }

    //使用protected表明只有继承这个类的类可以修改Awake函数，同时使用virtual关键字表明虚函数可以重写。
    //使用virtual时，调用的时候，实际调用的时继承类的版本
    protected virtual void Awake() {
        if(instance != null)
            Destroy(gameObject);
        else
            instance = (T)this;
        //无论哪个类继承，这句话都表明instance赋值是那个类的本体this
    }

    //player等通过该函数的调用，知晓manager是否初始化生成了
    //只有初始化了，才能在这个manager中获取数值等等，所以这个函数在泛型单例中都有
    public static bool IsInitialized
    {
        get { return instance != null; }
    }

    //如果场景中有多个单例模式，是需要销毁的。
    //当monoBehavior被销毁时，这个函数调用一次——即当游戏结束运行时-此函数被调用
    //如果子类继承后需要使用OnDestory销毁时候的方法，就可以直接重写这个函数
    protected virtual void OnDestroy() {
        //如果当前实例被销毁了
        if(instance == this)
        {
            instance = null;
        }
    }
}
```

**观察者模式 (事件的收发，例如课程中主角死亡后怪物的欢呼动画)  
装饰器模式 (也就是开发中我们往物体上挂载组件来拓展物体功能，目前 unity 是有这一套的框架了，不过如果后续要优化的话可能就要自己写了)  
其他还有一些像抽象工厂、模板模式等等因为自己理解不太够和在开发中遇到的不够就不细说**  
通常单例模式不希望在切换场景的时候被销毁，通常重写 Awake，使用 override 和 base 关键词

```cs
//[System.Serializable]
//public class EventVector3 : UnityEvent<Vector3> { }  //继承了vector3类型
//继承SingleTon<>类型，并传入了一个属于SingleTon类的子类MouseManager
public class MouseManager : SingleTon<MouseManager>
{
    //重写override
    protected override void Awake() {
        //base表示基于原有父类函数之上额外运行
        //意味着父类函数里面的东西都保留
        //然后可以额外添加内容
        base.Awake();
        DontDestroyOnLoad(this);
    }
```

# 附加：接口

接口的方式使用观察者订阅和广播的方法

接口：实现接口的任何类，必须拥有其所有的方法和属性，，作为交换，通过使用多态其他类可将实现类视作接口，接口不是类，不能有自己的实例  

![](1690255171961.png)

继承关系是 is-a，**接口使用实现关系，一个类实现一个接口**  
**接口通常在类外部声明，声明接口时，通常对每个接口使用一个脚本**  
**接口的声明通常在大写字母 I 开头后面跟另一个大写字母开头的名称**  
**接口通常描述实现类具备的某种功能，因此名称结尾多是 able**

```c
//实现IKillable接口的任何类，必须有一个与这个签名匹配的公共函数
public interface IKillalbe {
    void kill();
}
public interface IDamageble<T> {
    void Damage(T damageTaken);
}
//为了实现接口，类必须公开声明这个接口中存在的所有方法、属性、事件和所引起
```

接口允许跨多个类定义通用功能  
可以根据类实现的接口，对类的用于做出假设  
要实现接口，只需在类具有的任何继承之后添加一个逗号后跟接口的名称，如果类不是从其他类继承而来，就不需要逗号 \

可以从多个接口中实现多个特殊函数，，，只是因为不能继承多个类。  
**可以使用接口用于跨多个互不相关的类定义通用功能，例如车和墙都可破坏，但是继承同一个物体没有意义，但是继承一个接口含有 damage 函数就有意义**

```
public class Avatar : MonoBehavior, IKillable, IDamageable<float>
{
    //声明两个接口所需要的两个函数
    //函数主题与接口相互独立，可以自由书写
    public void kill() {
        //Do something fun
    }
    
    public void Damage(float damageTaken) {
        //Do something fun
    }
}
```

# 20:Observer Pattern 接口实现观察者模式的订阅和广播

接口的方式使用观察者订阅和广播的方法  
在 Tools 文件夹下面创建 IEndGameObserver 的 C# 脚本，I 表示接口

```c
//using那些命名空间也可以删掉
//class改成interface
//因为不是class，不需要继承monobehavior
public interface IEndGameObserver
{
    void EndNotify();
}
```

如果类实现接口的时候不重新声明或实现接口的函数，会提示报错  

![](1690255172067.png)

  
**流程：**

1.  **创建接口**
2.  **类订阅接口，编写接口函数实现**
3.  **Manager 创建列表和广播方法**
4.  **实现类在实例化的时候注册到 Manager 的列表，销毁的时候从列表删除**
5.  **一个物体在某个时刻触发 Manager 的广播方法，这样所有注册到 Manager 列表的实现类都受到了广播**

```c
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : SingleTon<GameManager>
{    
    //直接创建列表，用于收集接口
    public List<IEndGameObserver> endGameObservers = new List<IEndGameObserver>();
  
    public void AddObserver(IEndGameObserver observer) {
        endGameObservers.Add(observer);
    }
    public void RemoveObserver(IEndGameObserver observer) {
        endGameObservers.Remove(observer);
    }

    //如何广播呢？
    //遍历每一个订阅进来的实例，然后调用他们实现的接口方法
    public void NotifyObservers() {
        foreach(var observer in endGameObservers)
        {
            observer.EndNotify();
        }
    }
}
```

```cs
void Update() {
        isDead = characterStats.characterData.currentHealth == 0;
        //player如果死亡就调用manager的广播事件，广播告诉所有注册的enemy
        if (isDead)
            GameManager.Instance.NotifyObservers();
        SwitchAnimation();
        //每帧都剪掉时间增量
        lastAttackTime -= Time.deltaTime;
    }
```

```cs
void OnEnable()
    {
        GameManager.Instance.AddObserver(this);
    }

    //OnDisable与OnDestroy不一样，OnDisable是在销毁完成后执行
    void OnDisalbe()
    {
        GameManager.Instance.RemoveObserver(this);
    }

public void EndNotify()
    {
        //获胜动画
        //停止所有移动
        //停止Agent
        anim.SetBool("Win", true);
        playerDead = true;
        isChase = false;
        isWalk = false;
        isFollow = false;
        attackTarget = null;
        //如果不单独提出来重新同步一下动画参数，会因为前面update判断plaer死亡不在执行SwitchAnimation动画
        //因此一直播放Attack Layer的动画，但是Attack Layer是权重1的比例override第一层的动画
        //即便Base Layer是win的状态，依然无法播放win的动画
        anim.SetBool("Walk", isWalk);
        anim.SetBool("Chase", isChase);
        anim.SetBool("Follow", isFollow);
    }
```

**在这里遇到一个问题，如果在 OnEnable() 中注册，会报错，需要放到 Start 中，暂时不知道是哪里的问题**  
**报错说明没有找到 GameManager，无法注册到 GameManager**  
**应该设置为当场景加载好了，敌人加载好了，再注册到 GameManager**  
**OnEnable 在场景加载时才会用到**  

# 21:More Enemies 制作更多的敌人

如果每一个敌人都使用 Enemy Data Asset 的话，其实是共享数值  
需要通过 ScriptableObject 复制出多个数值文件

```c
public CharacterData_SO templateData;
    
    public CharacterData_SO characterData;

    private void Awake()
    {
        //如果当前模板数据不为空，意味着要调用这个数据了
        if (templateData != null)
            characterData = Instantiate(templateData);
    }
```

**Instantiate(Object original)**：克隆物体 original，其 Position 和 Rotation 取默认值，何为默认值呢？就是预制体的 position，这里的 position 是世界坐标，无父物体

创建一个乌龟敌人，所有的参数设置同前文，同样挂载 EnemyController  
可以直接复制动画 Animator 修改，也可以创建一个重写 Animator  

![](1690255172161.png)

![](1690255172264.png)

有个加号  

![](1690255172342.png)

直接选择需要重写的 Animator 拖进去就行  

![](1690255172403.png)

拖拽所有需要重写的动画进来  
**注意：override controller 不能修改动画内的已经放好的动画和逻辑，不然会改变生成它的那个动画 Animator**  

# 22:Setup Grunt 设置兽人士兵

因为动画不同，所以要设置不同的攻击逻辑，例如当 player 要穿过时，吧人物推开，然后在攻击  
Grunt 继承 EnemyController

```cs
public class Grunt : EnemyController
{
    [Header("Skill")]
    public float kickForce = 10;
    public void KickOff()
    {
        if(attackTarget != null)
        {
            transform.LookAt(attackTarget.transform);
            var targetStats = attackTarget.GetComponent<CharacterStats>();
            this.GetComponent<CharacterStats>().TakeDamage(characterStats, targetStats);

            //获得player相对敌人的方向并单位化
            Vector3 direction = attackTarget.transform.position - transform.position;
            direction.Normalize();

            //直接获取player的agent，让他停下，然后在让他的速度变为向量*力，反向推走player
            attackTarget.GetComponent<NavMeshAgent>().isStopped = true;
            attackTarget.GetComponent<NavMeshAgent>().velocity = direction * kickForce;
            attackTarget.GetComponent<Animator>().SetTrigger("Dizzy");
        }
    }
}
```

在兽人动画中添加额外的事件用于触发 KickOff(), 同时给人物加入 Dizzy 的眩晕动画，设置播放速度快一点  
**可以在 Animator 中直接创建触发逻辑的代码（状态机）**  

![](1690255172465.png)

  
可以直接在右侧添加行为  

![](1690255172544.png)

  
默认自带的状态机

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

//相当于自带一个状态机行为
public class StopAgent : StateMachineBehaviour
{
    //当前动画状态进入的时候执行一次
    // OnStateEnter is called when a transition starts and the state machine starts to evaluate this state
    //这个animator就是当前脚本挂在的物体身上的animator
    override public void OnStateEnter(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        animator.GetComponent<NavMeshAgent>().isStopped = true;
    }

    //动画持续播放过程中调用的方法
    //因为人物点一次攻击目标，就会把isStoped修改为false，所以要持续运行
    // OnStateUpdate is called on each Update frame between OnStateEnter and OnStateExit callbacks
    override public void OnStateUpdate(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        animator.GetComponent<NavMeshAgent>().isStopped = true;
    }
    //当前动画状态退出的时候执行一次
    // OnStateExit is called when a transition ends and the state machine finishes evaluating this state
    override public void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        animator.GetComponent<NavMeshAgent>().isStopped = false;
    }
    //实际移动产生的变化
    // OnStateMove is called right after Animator.OnAnimatorMove()
    //override public void OnStateMove(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that processes and affects root motion
    //}
    //IK人物
    // OnStateIK is called right after Animator.OnAnimatorIK()
    //override public void OnStateIK(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that sets up animation IK (inverse kinematics)
    //}
}
```

如果 player 把 enemy 杀死了，可能会报错，因为 enemy 死亡后，CharacterStates.Dead 在循环中会关闭 agent，但是 StopAgent 脚本中 OnStateUpdate 函数会一直 getComponent  
可以把死亡时候的函数取消 enemy 死亡关闭 agent 改为 enemy 死亡，agent 半径 = 0，从而避免挡住人物  

# 附加：扩展方法

P11  
通过扩展方法可以向类型添加功能，而不必创建 DriveType 或更改原始类型  
**扩展方法非常适用于需要向类添加功能，但是不能编辑类的情况**

*   例如我们无法访问 transform 的源码，但是我们想要使用函数轻松重置 Transform 的位置、旋转和缩放，最理想的情况可以将该函数放在 Transfrom 类中，但是我们无法添加到这个类，将这个类添加到派生类也没有意义

扩展方法必须放在**非泛型静态类**中，需要在参数中使用 this 关键字使其作为非静态方法

**简单来说，就是为一个修改不了的类添加更多自定义的静态方法**  
**使用的时候，只需要将其视为所扩展的类的成员**

```
public static class ExtensionMethods
{
    //this后跟要扩展的类，和随便一个变量名
    //第一个参数将是调用对象，因此当我们调用这个函数时，无需提供这个参数
    //第一个参数规定了这个方法属于哪个类，，，，，，当然也可以添加一些其他的参数
    public static void ResetTransformation(this transform trans) {
        trans.position = Vector3.zero;
        trans.localRotation = Quaternion.identity;
        trans.localScale = new Vector3(1,1,1);
    }
}
//尽管函数声明具有参数，但是调用时没有参数，参数隐式的成为了Transform实例
```

```
public class SomeClass: MonoBehavior
{
    void Start() {
        transform.ResetTransformation();
    }
}
```

# 23:Extension Method 扩展方法

如果 Player 跑到敌人后界面，发生的攻击不产生伤害  
**在现有的类、现有的函数延展一个方法，实现一个个性化的方法**  

![](1690255172612.png)

  
**任何扩展方法都不会继承任何类，并且合格扩展方法必须是一个静态类**

```
public static class ExtensionMethod
{
    public static bool IsFacingTarget(this Transform transform, Transform target) {
    }
}
```

![](1690255172685.png)

  
使用 Enemy 向前的向量 和 Enemy 指向 Player 的向量做 Dot 运算  

![](1690255172801.png)

```c
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public static class ExtensionMethod
{
    private const float dotThreshold = 0.5f;
    //函数名后面跟this后的第一个类就是要扩展的类，逗号隔开的才是函数的变量，在传入target的transform
    public static bool IsFacingTarget(this Transform transform, Transform target)
    {
        //获取Enemy指向Player的向量的单位向量
        var vectorToTarget = target.position - transform.position;
        vectorToTarget.Normalize();

        //点积获得角度投影的模场值，如果在0-1说明在前180°内，反之在后180°内，，，这里设置为>=0.5的角度范围内
        float dot = Vector3.Dot(transform.forward, vectorToTarget);

        return dot >= dotThreshold;
    }
}
```

```
void Hit()
    {
        //因为敌人是被动攻击，需要先判断身边有没有player，如果没有player可能会报错
        //还需要判断是否在前方，才能触发攻击
        if (attackTarget != null && transform.IsFacingTarget(attackTarget.transform))
        {
            var targetStats = attackTarget.GetComponent<CharacterStats>();

            targetStats.TakeDamage(characterStats, targetStats);
        }
    }
```

# 24:Setup Golem 设置石头人 Boss

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

public class Golem : EnemyController
{
    [Header("Skill")]
    public float kickForce = 25;
    public void KickOff()
    {
        if (attackTarget != null && transform.IsFacingTarget(attackTarget.transform))
        {
            var targetStats = attackTarget.GetComponent<CharacterStats>();

            transform.LookAt(attackTarget.transform);
            Vector3 direction = attackTarget.transform.position - transform.position;
            direction.Normalize();
            attackTarget.GetComponent<NavMeshAgent>().isStopped = true;
            attackTarget.GetComponent<NavMeshAgent>().velocity = direction * kickForce;
            attackTarget.GetComponent<Animator>().SetTrigger("Dizzy");
            targetStats.TakeDamage(characterStats, targetStats);
        }
    }
}
```

# 25:Throw Rocks 设置可以扔出的石头

Mesh Collider 用法

网格碰撞体 (Mesh Collider) 采用网格资源 (Mesh Asset) 并基于该网格构建其碰撞体 (Collider)。对于碰撞检测，这比将基元用于复杂网格要精确得多。**标记为 凸体 (Convex) 的网格碰撞体 (Mesh Collider) 可以与其他网格碰撞体 (Mesh Collider) 碰撞**。

<table><thead><tr><th>属性：</th><th>功能：</th></tr></thead><tbody><tr><td>为触发器 (is Trigger)</td><td>如果启用，此碰撞体 (Collider) 则用于触发事件，会由物理引擎忽略。</td></tr><tr><td>材质 (Material)</td><td>引用可确定此碰撞体 (Collider) 与其他碰撞体 (Collider) 的交互方式的物理材质 (Physics Material)。</td></tr><tr><td>网格 (Mesh)</td><td>对用于碰撞的网格的引用。</td></tr><tr><td>平滑球体碰撞 (Smooth Sphere Collisions)</td><td>启用此项时，会使碰撞网格法线平滑。应对平滑表面（例如没有硬边缘的丘陵地形）启用此项以使球体滚动更平滑。</td></tr><tr><td>凸体 (Convex)</td><td>如果启用，则此网格碰撞体 (Mesh Collider) 会与其他网格碰撞体 (Mesh Collider) 碰撞。凸体网格碰撞体 (Convex Mesh Collider) 限制为 255 个三角形。</td></tr></tbody></table>

**因为生成石头直接抛出的话，生成位置比较高，Player 可能距离比较远，所以很有可能直接扔到地上，所以需要加一个向上的速度**  
**同时为刚体添加一个瞬间施加的力，选用 impulse**  

![](1690255172884.png)

```
public class Rock : MonoBehaviour
{
    private Rigidbody rb;

    [Header("Basic Settings")]

    public float force;

    public GameObject target;
    private Vector3 direction;
    public bool isThrowed = false;

    private float time;

    private void Start()
    {
        //生成的时候获取刚体
        rb = GetComponent<Rigidbody>();
    }

    //自己写了一个用于8s后清除场景内的石头
    private void Update()
    {
        time += Time.deltaTime;
        if(time>8)
        {
            Destroy(this.gameObject);
        }
    }
    //生成的时候就要飞向目标
    public void FlyToTarget()
    {
        //很极限的情况，如果生成了石头，player跑了，需要处理一下
        if(target == null)
        {
            target = FindObjectOfType<PlayerController>().gameObject;
        }
        //在生成方向的时候添加一个向上的方向，让抛物线高一点，避免直接落到地上没有弧线。
        direction = (target.transform.position - transform.position + Vector3.up).normalized;
        rb.AddForce(direction * force, ForceMode.Impulse);
    }
}
```

**可以选择 Hierarchy 数的时候通过键盘左右方向键快速展开堆叠物体 child**

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

public class Golem : EnemyController
{
    [Header("Skill")]
    public float kickForce = 25;
    //创建一个变量拿到石头prefab
    public GameObject rockPrefab;
    [SerializeField]
    private GameObject rock;

    //找到举手的位置
    public Transform handPos；

    //生成石头
    public void GenerateRock()
    {
        //if(attackTarget != null)
        //{
            rock = Instantiate(rockPrefab, handPos.position, Quaternion.identity);
            StartCoroutine(RockWithHand());
        //}
    }
    
    //扔石头，，扔石头之前一直都开启协程，保证石头跟着手走
    public void ThrowRock()
    {
        rock.GetComponent<Rock>().isThrowed = true;
        StopCoroutine(RockWithHand());
        rock.GetComponent<Rock>().target = attackTarget;
        rock.GetComponent<Rock>().FlyToTarget();
    }

    IEnumerator RockWithHand()
    {
        while (!rock.GetComponent<Rock>().isThrowed)
        {
            rock.transform.position = handPos.position;
            rock.transform.rotation = handPos.rotation;
            yield return null;
        }
    }
}
```

# 26:Kick it Back 反击石头人

player 攻击石头能够反击石头人  
**创建枚举类型后 - 创建用于记录状态的变量也要是枚举类型**  
石头没有 CharacterStats 脚本，没有数值，因此需要在 CharacterStats 脚本重载 TakeDamage 函数，产生出伤害  
石头生成的时候如果人物已经死了，，依然要把石头扔出来，但是 player 死了，会广播信息，Golem 收到信息会修改 AttackTarget 为 null 并传给 Rock 的 Target，此时必须在 FlyToTarget 修改 Target 不管 Player 死没死都获取目标。

```
private void OnCollisionEnter(Collision other)
    {
        if(other.gameObject.CompareTag("Attackable"))
        {
            Instantiate(breakEffect, other.transform.position, Quaternion.identity);
            Instantiate(breakEffect, transform.position, Quaternion.identity);
            Destroy(gameObject);
            Destroy(other.gameObject);
        }
        switch(rockStates)
        {
            case RockStates.HitPlayer:
                //判断是否撞到了player同时判断player是否正好在两个反击石头的动作
                //如果撞到了但是没有反击石头动作，就打中player，否则反击
                if (other.gameObject.CompareTag("Player") && 
                    !other.gameObject.GetComponent<Animator>().GetCurrentAnimatorStateInfo(0).IsName("Attack Base") &&
                    !other.gameObject.GetComponent<Animator>().GetCurrentAnimatorStateInfo(0).IsName("Attack02"))
                {                   
                    other.gameObject.GetComponent<NavMeshAgent>().isStopped = true;
                    other.gameObject.GetComponent<NavMeshAgent>().velocity = (target.transform.position - transform.position).normalized * force;

                    other.gameObject.GetComponent<Animator>().SetTrigger("Dizzy");

                    //因为石头没有CharacterStats，所以CharacterStats脚本中的TakeDamage函数没有办法产生效果，因此需要重载这个函数
                    other.gameObject.GetComponent<CharacterStats>().TakeDamage(damage, target.GetComponent<CharacterStats>());

                    rockStates = RockStates.HitNothing;
                }
                break;
            case RockStates.HitEnemy:
                //GetComponent默认有一个静态bool用于标记是否获取组件成功
                if(other.gameObject.GetComponent<Golem>())
                {
                    //gameObject.GetComponent<Collider>().enabled = false;
                    //获取Golem的数值进行修改
                    var otherStats = other.gameObject.GetComponent<CharacterStats>();
                    otherStats.TakeDamage(damage, otherStats);
                    Instantiate(breakEffect,transform.position,Quaternion.identity);
                    Destroy(gameObject);
                }
                break;
            case RockStates.HitNothing:
                break;
        }
    }
```

Player 需要编写代码用于给 HitNothing 的石头添加力反推回去，修改石头的 HitEnemy 状态

刚体调用 update 最好调用 FixedUpdate，，因为调用的时间频率不同  
Update 和 FixedUpdate 的区别：

*   update 跟当前平台的帧数有关，而 FixedUpdate 是真实时间，所以处理物理逻辑的时候要把代码放在 FixedUpdate 而不是 Update。
*   **Update 是在每次渲染新的一帧的时候才会调用，也就是说，这个函数的更新频率和设备的性能有关以及被渲染的物体（可以认为是三角形的数量）。在性能好的机器上可能 fps 30，差的可能小些。这会导致同一个游戏在不同的机器上效果不一致，有的快有的慢。因为 Update 的执行间隔不一样了。**
*   而 **FixedUpdate，是在固定的时间间隔执行，不受游戏帧率的影响。有点想 Tick。所以处理 Rigidbody 的时候最好用 FixedUpdate。**

PS：FixedUpdate 的时间间隔可以在项目设置中更改，Edit->ProjectSetting->time 找到 Fixedtimestep。就可以修改了。

```
//如果石头扔出去了，并且速度很小，才认为什么都没有扔中
void FixedUpdate() {
        if (isThrowed && rb.velocity.sqrMagnitude < 1f)
        {
            rockStates = RockStates.HitNothing;
        }
    }
```

暂停的快捷键 ctrl + shift + p  

![](1690255172960.png)

用这个按钮逐帧播放  
当石头速度小于 1 时，会修改石头为 HitNothing 但是可能会有问题，需要给 Player 反击与 Golem 扔之前设置其 velocity 为 Vector.One  
另外人物会从石头上穿过去，需要添加 rigibody 组件，并且勾选 isKinematic 选项，否则会跟 NavMeshAgent 冲突，走到斜坡会调用 isGravity 往下

```
void Hit()
    {
     //可能存在飞过来的时候石头已经被销毁了，，但是再执行下去会报错，需要判断一下石头有没有被销毁
        if(attackTarget != null && attackTarget.CompareTag("Attackable"))
        {
            //这样不判断状态是否为HitNothing，，使得即便是空中飞过来的石头也可以回击
            if (attackTarget.GetComponent<Rock>())
            {
                attackTarget.GetComponent<Rock>().rockStates = Rock.RockStates.HitEnemy;
                attackTarget.GetComponent<Rigidbody>().velocity = Vector3.one;
                attackTarget.GetComponent<Rigidbody>().AddForce(transform.forward * 20, ForceMode.Impulse);
            }
        }
        else if(attackTarget != null)
        {
            var targetStats = attackTarget.GetComponent<CharacterStats>();

            targetStats.TakeDamage(characterStats, targetStats);
        }
        
    }
```

石头碰撞到物体后需要添加粒子破碎效果  

![](1690255173034.png)

生成时播放一次，Play on Awake  

![](1690255173133.png)

![](1690255173204.png)

![](1690255173303.png)

  
可以通过 GetCurrentAnimatorStateInfo 获取动画层里面的参数，获取第 0 层获取下面的正在播放的动画判断是否是 Jump

```
void Update() {
        //Press the space bar to tell the Animator to trigger the Jump Animation
        if (Input.GetKeyDown(KeyCode.Space))
        {
            m_Animator.SetTrigger("Jump");
        }
        //判断是否是第0层的Jump动画在播放
        //When entering the Jump state in the Animator, output the message in the console
        if (m_Animator.GetCurrentAnimatorStateInfo(0).IsName("Jump"))
        {
            Debug.Log("Jumping");
        }
    }
```

# 27:Health Bar 设置血条显示

创建 canvas  

![](1690255173404.png)

这个是覆盖屏幕的，不适合用于显示小怪血量  
需要选择世界坐标，并添加相机  

![](1690255173486.png)

  
我们希望能够在每个怪物头上都有这个生命条

![](1690255173565.png)

  
插入一个 package—2D Sprite，安装好就可以插入 2D 物体了  

![](1690255173701.png)

![](1690255173802.png)

  
再这个 Bar Holder 下再创建要给 Image，选择类型为 Filled 然后修改 Fill Method 为 Horizontal，就变成可以拖动的条了  

![](1690255173891.png)

  
创建要给脚本用于显示敌人血量，每个敌人都要挂载，为了避免每一次挂好脚本都要再给人物挂 GameObject，可以在脚本本身直接赋值  

![](1690255173980.png)

  
直接进入每个敌人的 Prefab 创建一个 HealthBar Point  
**摄像机和血条的更新都应该是人物移动后的下一帧再移动，这样的渲染模式比较适合 LateUpdate**

```
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class HealthBarUI : MonoBehaviour
{
    public GameObject healthUIPrefab;

    public Transform barPoint;

    public bool alwayVisible;

    public float visibleTime;

    public float timeLeft;

    Image healthSlider;

    Transform UIbar;
    //需要适中保持UI朝向摄像机，以为这跟摄像机的forward是反向的。。

    Transform cam;

    //需要注册到里面的Action
    CharacterStats currentStats;

    private void Awake()
    {
        currentStats = GetComponent<CharacterStats>();
        currentStats.UpdateHealthBarOnAttack += UpdateHealthBar;
    }

    private void OnEnable()
    {
        //获取环境中的相机的transform
        cam = Camera.main.transform;
        //除了这个UI可能还有其他UI，因此要遍历一下每一个canvas
        //因为只有一个Slime挂在了这个脚本
        //这个函数给每个canvas都创建了UIbar。。。有点问题？？不太实用？？
        foreach(var canvas in FindObjectsOfType<Canvas>())
        {
            if(canvas.renderMode == RenderMode.WorldSpace)
            {
                UIbar = Instantiate(healthUIPrefab, canvas.transform).transform;
                healthSlider = UIbar.GetChild(0).GetComponent<Image>();
                UIbar.gameObject.SetActive(alwayVisible);
            }
        }
    }

    private void UpdateHealthBar(int currentHealth, int maxHealth)
    {
        if (currentHealth <= 0)
            Destroy(UIbar.gameObject);

        UIbar.gameObject.SetActive(true);
        timeLeft = visibleTime;
        float silderPercent = (float)currentHealth / maxHealth;
        healthSlider.fillAmount = silderPercent;
    }

    //update是每一帧都执行，LateUpdate是上一帧渲染之后才执行
    private void LateUpdate()
    {
        if(UIbar != null)
        {
            UIbar.position = barPoint.position;
            UIbar.forward = -cam.forward;
            if(timeLeft<=0 && !alwayVisible)
            {
                UIbar.gameObject.SetActive(false);
            }
            else
            {
                timeLeft -= Time.deltaTime;
            }
        }
    }
}
```

还需要再 CharacterStats 里创建一个 Action，每一次产生血量变化都触发事件修改 UI

```
public event Action<int, int> UpdateHealthBarOnAttack;
//需要计算攻击减掉防御，因此需要传入两个CharacterStats变量。
    public void TakeDamage(CharacterStats attacker, CharacterStats defender)
    {
        int damage = Mathf.Max(attacker.CurrentDamage() - defender.CurrentDefence, 1);//如果是攻击低于防御，则产生负数伤害，需要跟1比较，产生一个最低1点的伤害
        CurrentHealth = Mathf.Max(CurrentHealth - damage, 0);

        if(attacker.isCritical)
        {
            //被暴击播放动画
            defender.GetComponent<Animator>().SetTrigger("Hit");
        }
        //TODO:update UI
        //问号的意思意味着判断订阅它的是否为空？
        UpdateHealthBarOnAttack?.Invoke(CurrentHealth, MaxHealth);
        //TODO:level up
    }
```

# 28:Player LevelUp 玩家升级系统

再 ScriptableObject 脚本里面重新更新一下 CharacterData_SO 的设计，包括经验升级  
敌人不用考虑升级相关的变量，不赋值即可，，人物也不用考虑 killPoint

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

//在create菜单中创建一个子集菜单
[CreateAssetMenu(fileName = "New Data", menuName = "Character Stats/Data")]

public class CharacterData_SO : ScriptableObject
{
    [Header("Stats Info")]
    public int maxHealth;
    public int currentHealth;
    public int baseDefense;
    public int currentDefense;
    [Header("Kill")]
    public int killPoint;

    [Header("Level")]
    public int currentLevel;
    public int maxLevel;
    //基础经验值，，，经验值越升级越难升级
    public int baseExp;
    public int currentExp;

    public float levelBuff;

    //用于每级经验提升需要的经验越来越多
    public float LevelMultiplier
    {
        //当前等级-1，，然后乘一个levelBuff，
        //例如升级1级+10%，升级2级+20%
        get { return 1 + (currentLevel - 1) * levelBuff; }
    }
    //创建函数，怪物死亡时更新经验值
    public void UpdateExp(int point)
    {
        currentExp += point;
        //如果大于当前每级经验条数值，就升级
        if(currentExp>= baseExp)
        {
            LevelUp();
        }
    }

    private void LevelUp()
    {
        //等级升级限制，，，保证等级始终在0和最大经验等级之间不会超过
        currentLevel = Mathf.Clamp(currentLevel + 1, 0, maxLevel);
        baseExp += (int)(baseExp * LevelMultiplier);
        maxHealth = (int)(maxHealth * LevelMultiplier);
        currentHealth = maxHealth; ;

        Debug.Log("LEVEL UP!" + currentLevel + "Max Health:" + maxHealth);
    }
}
```

敌人被攻击时判断是否增加经验

```
public void TakeDamage(CharacterStats attacker, CharacterStats defender) {
        int damage = Mathf.Max(attacker.CurrentDamage() - defender.CurrentDefence, 1);//如果是攻击低于防御，则产生负数伤害，需要跟1比较，产生一个最低1点的伤害
        CurrentHealth = Mathf.Max(CurrentHealth - damage, 0);

        if(attacker.isCritical)
        {
            //被暴击播放动画
            defender.GetComponent<Animator>().SetTrigger("Hit");
        }
        //TODO:update UI
        //问号的意思意味着判断订阅它的是否为空？
        UpdateHealthBarOnAttack?.Invoke(CurrentHealth, MaxHealth);
        //TODO:level up
        if(CurrentHealth == 0)
        {
            attacker.characterData.UpdateExp(characterData.killPoint);
        }
    }
    //函数重载
    public void TakeDamage(int damage, CharacterStats defender) {
        int rockdamage = Mathf.Max(damage - defender.CurrentDefence, 1);//如果是攻击低于防御，则产生负数伤害，需要跟1比较，产生一个最低1点的伤害
        CurrentHealth = Mathf.Max(CurrentHealth - rockdamage, 0);

        UpdateHealthBarOnAttack?.Invoke(CurrentHealth, MaxHealth);
        if (CurrentHealth <= 0)
        {
            GameManager.Instance.PlayerStats.characterData.UpdateExp(characterData.killPoint);
        }
    }
```

# 29:Player UI 添加玩家信息显示

![](1690255174075.png)

创建 Image 希望能够在左上角作为锚点  
按住 alt 和 shift 可以直接移动到左上角并设置左上角为锚点  

![](1690255174204.png)

  
UI 的 canvas 会根据屏幕尺寸、像素进行缩放，需要选 canvas scaler 调整缩放模式  

![](1690255174298.png)

![](1690255174357.png)

匹配宽度长度按照一样的权重  

![](1690255174455.png)

创建一个像样的 UI，添加脚本 HealthBarUI  

![](1690255174546.png)

```
public class PlayerHealthUI : MonoBehaviour
{
    Text levelText;
    Image healthSlider;
    Image expSlider;
    private void Awake() {
        levelText = transform.GetChild(2).GetComponent<Text>();
        healthSlider = transform.GetChild(0).GetChild(0).GetComponent<Image>();
        expSlider = transform.GetChild(1).GetChild(0).GetComponent<Image>();
    }

    private void Update() {
        //可以更改string显示格式，比如01 02，，，30，，，因此需要在ToString函数中访问重载
        levelText.text = "Level " + GameManager.Instance.PlayerStats.characterData.currentLevel.ToString("00");
        UpdateHealth();
        UpdateExp();
    }    
    void UpdateHealth() {
        //调用GameManager来获取player的数据
        float sliderPercent = (float)GameManager.Instance.PlayerStats.CurrentHealth / GameManager.Instance.PlayerStats.MaxHealth;
        healthSlider.fillAmount = sliderPercent;
    }

    void UpdateExp() {
        float expPercent = (float)GameManager.Instance.PlayerStats.characterData.currentExp / GameManager.Instance.PlayerStats.characterData.baseExp;
        expSlider.fillAmount = expPercent;
    }
}
```

**gameManager 非常有用，可以获取 player 的数据（前提是将 player 注册到 gameManager 了）**

# 30:Create Portal 创建传送门

通过 shader Graph 创建一个传送门  
可以在 shader Graph 创建有光的和没有光的 shader graph，lit 有光，unlit 无光  

![](1690255174656.png)

  

![](1690255174746.png)

![](1690255174840.png)

在 Shader Graph 中修改 main preview 为 quad  

![](1690255174924.png)

![](1690255175002.png)

位面效果  

![](1690255175097.png)

可以看作一套东西  

![](1690255175209.png)

![](1690255175294.png)

  
通过时间控制扭曲输出到 Voronoi 图在输出到 Emission 自发光  

![](1690255175361.png)

创建一个纹理，然后添加一个 Texture2D，创建一个中心到外渐变的遮罩 mashk，在添加一些颜色  

![](1690255175454.png)

  

![](1690255175551.png)

  
颜色不明显可以在 Shader Graph 中的 color 选择 HDR 模式  

![](1690255175638.png)

  
颜色不够强，就用 power 增强  

![](1690255175744.png)

  

![](1690255175808.png)

为了方便空物体被看见可以添加标识  

![](1690255175915.png)

代码逻辑，Portal 选择 Destination，意味着来到这个门就回到 Destination 那个点，例如 A 点，，此时在另一个 Portal 的 Destination 定义为 A 点，就是我们要去的那个点  
然后选择 Portal 选择 mesh convex 然后选择 is trigger 用于碰撞事件触发

# 附加：UV 学习

uv 是什么

![](1690255175984.png)

本身是没有纹理的，但是附上纹理就能看到东西了  

![](1690255176075.png)

映射到物体身上，如果是 512_512 就是一一映射，不是 512_512 就没办法映射。需要单位化映射  

![](1690255176180.png)

![](1690255176278.png)

  
渲染顺序如下  

![](1690255176364.png)

# 31:Transition 实现同场景内传送

场景如果灯光不亮，说明 PipelineSettings 没设置完整  

![](1690255176446.png)

同一个物体被灯光照亮限制了，只能被 4 个物体照亮，调高  
Scene 切换不要命名 SceneManager，因为 Unity 有个自带类叫这个名字，容易冲突  
场景加载一般用异步，放置卡顿和出错，同时还可以使用进度条  

![](1690255176533.png)

  
需要使用协程，因为 AsyncOperation 有个变量是 isDone，判断是否加载完了，从 0-90% 代表加载完了，最后 10% 是将场景启用

![](1690255176632.png)

```
public bool canTrans;

    //按下E传送
    private void Update() {
        if(Input.GetKeyDown(KeyCode.E) && canTrans)
        {
            //TODO:SceneController 传送
            //如果可以传送直接调用SceneController进行传送
            SceneController.Instance.TransitionToDestination(this);
        }
    }
```

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
//加载场景需要使用loadScene，需要使用这个命名空间
using UnityEngine.SceneManagement;

//获取TransitionPoint的场景名称和传送终点
//如果是同场景就不用加载,如果是异场景，需要异步加载
public class SceneController : SingleTon<SceneController>
{
    private GameObject player;

    //创建函数方法，加载一个TransitionPoint的参数用于传送
    public void TransitionToDestination(TransitionPoint transitionPoint) {
        switch(transitionPoint.transitionType)
        {
            case TransitionPoint.TransitionType.SameScene:
                //直接通过SceneManager获得激活了的场景名称，然后开启协程
                StartCoroutine(Transition(SceneManager.GetActiveScene().name, transitionPoint.DestinationTag));
                break;
            case TransitionPoint.TransitionType.DifferentScene:
                break;
        }
        //协程用于传送
        IEnumerator Transition(string sceneName,TransitionDestination.DestinationTag destinationTag) {
            player = GameManager.Instance.PlayerStats.gameObject;
            player.transform.SetPositionAndRotation(GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);
            yield return null;
        }
    }

    private TransitionDestination GetDestination(TransitionDestination.DestinationTag destinationTag) {
        //这个是一个数组
        //用于寻找场景中的所有含有TransitionDestination的物体，返回这个数组
        var entrances = FindObjectsOfType<TransitionDestination>();
        //遍历这个数组，找到和我传进来的tag一样的那个物体
        for(int i = 0;i< entrances.Length;i++)
        {
            //如果找到了有终点标签的那个就返回这个TransitionDestination
            if (entrances[i].destinationTag == destinationTag)
                return entrances[i];
        }
        return null;
    }
}
```

传送的时候需要关闭人物的 Agent 移动  


# 32:Different Scene 跨场景传送

设置 Portal 的 destination type 为 different Scene，destination tag 设置为 Enter，然后设置要去的目标场景的 Portal 的 DestinationPoint 的 destinationTag 为 enter  
场景转换，需要使用协程，并且 Api 选择异步加载场景 LoadSceneAsync

```cs
switch(transitionPoint.transitionType)
        {
            case TransitionPoint.TransitionType.SameScene:
                //直接通过SceneManager获得激活了的场景名称，然后开启协程
                StartCoroutine(Transition(SceneManager.GetActiveScene().name, transitionPoint.DestinationTag));
                break;
            case TransitionPoint.TransitionType.DifferentScene:
                //获取要传送场景的名字，
                StartCoroutine(Transition(transitionPoint.sceneName, transitionPoint.DestinationTag));
                break;
        }

        IEnumerator Transition(string sceneName,TransitionDestination.DestinationTag destinationTag)
        {
            //TODO:保存角色数值
            //判断是否是不同场景传送
            if(sceneName != SceneManager.GetActiveScene().name)
            {
                //基本的理解：我在这一帧是否需要等待什么事件完成
                //事件完成之后，执行yield return下面的命令
                yield return SceneManager.LoadSceneAsync(sceneName);
                //每一次传送好，需要把人物生成出来，经验血量任务记录背包等等都需要配套复制过来，然后加载到人物身上
                yield return Instantiate(playerPrefab, GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);
                //从协程中跳出去，中断协程
                yield break;
            }
            else
            {
                player = GameManager.Instance.PlayerStats.gameObject;
                playerAgent = player.GetComponent<NavMeshAgent>();
                playerAgent.enabled = false;
                player.transform.SetPositionAndRotation(GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);
                playerAgent.enabled = true;
                yield return null;
            }            
        }
```

因为 Build Setting 没有打开 Scene，从而传送失败  

![](1690255176736.png)

  
把两个 Scene 选中拖拽过来  

![](1690255176802.png)

  
直接传送会出错，因为新场景中没有 SceneController 等 Manager

```c
protected override void Awake()
    {
        base.Awake();
        DontDestroyOnLoad(this);
    }

if(sceneName != SceneManager.GetActiveScene().name)
{
    yield return SceneManager.LoadSceneAsync(sceneName);
    //加载完场景当前脚本的物体就消失了，没有办法执行后面的命令
    //所以加载完成场景告诉它不要删除当前这个物体，需要重写Override Awake
    yield return Instantiate(playerPrefab, GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);

    yield break;
}
```

**同理，MouseManager 和 GameManager 也要设置 DontDestroyOnLoad(this); 这样不需要再其他场景单独拖拽这些 Manager**  
**发现个小问题，OnDestroy 设置了 t，实际运行的时候不完全是准确的 t 就销毁物体了**  
**此时切换场景后无法移动，是因为 playerController 的 MoveToTarget 订阅了 MouseManager 的 OnMouseClicked，而 Player 在转换场景的时候，被销毁了，所以需要重新注册**

```c
private void OnEnable() {
        MouseManager.Instance.OnMouseClicked += MoveToTarget;
        MouseManager.Instance.OnEnemyClicked += EventAttack;
    }
    void Start() {
        //放到Start是为了从菜单加载游戏后在执行，，因为一开始要把人物设置为Disabled
        GameManager.Instance.RigisterPlayer(characterStats);
    }

    private void OnDisable() {
        if (!MouseManager.IsInitialized) return;
        MouseManager.Instance.OnMouseClicked -= MoveToTarget;
        MouseManager.Instance.OnEnemyClicked -= EventAttack;
    }
```

切换场景时，摄像机跟随也会丢失，需要通过 GameManager 在第一时间把 Player 的 LookAtPoint 传给 CinemaChine

```c
private CinemachineFreeLook followCamera;

public void RigisterPlayer(CharacterStats player)
    {
        PlayerStats = player;

        followCamera = FindObjectOfType<CinemachineFreeLook>();
        if(followCamera!=null)
        {
            followCamera.Follow = player.transform.GetChild(2);
            followCamera.LookAt = player.transform.GetChild(2);
        }
    }
```

# 33: Save Data 保存数据

切换场景时，player 再次生成了一份数据，我们需要修改逻辑让 player 从 template 拿到数据，然后从保存数据修改他，放到 CharacterData 里  
可以用 Json 配合二进制方法保存数据  
用 PlayerPrefs 配合 JsonUtility.ToJson，PlayerPrefs 是 Unity 引擎自带的存储数据的方法，在硬盘上产生数据  

![](1690255176909.png)

  
只有这三种数据类型，float，int，string

![](1690255177006.png)

  
我们通过 JsonUtility 将 ScriptableObject 转换为 Json

![](1690255177112.png)

![](1690255177245.png)

![](1690255177330.png)

![](1690255177429.png)

  
把 json 写的漂亮点。就是竖排格式

```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SaveManager : SingleTon<SaveManager>
{
    protected override void Awake() {
        base.Awake();
        DontDestroyOnLoad(this);
    }

    private void Update() {
        if(Input.GetKeyDown(KeyCode.S))
        {
            SavePlayerData();
        }

        if (Input.GetKeyDown(KeyCode.L))
        {
            LoadPlayerData();
        }
    }

    //用来保存读取数据
    public void SavePlayerData() {
        Save(GameManager.Instance.PlayerStats.characterData, GameManager.Instance.PlayerStats.characterData.name);
    }
    
    public void LoadPlayerData() {
        Load(GameManager.Instance.PlayerStats.characterData, GameManager.Instance.PlayerStats.characterData.name);
    }

    //为了提高灵活性，而不是只能接受CharacterData类型的文件，需要用ToJson把文件转换为Object
    //Object是所有类型的基类
    //无论是monobehavior还是ScriptableObjec都可以传进来
    public void Save(Object data,string key) {
        //协程json格式
        var jsonData = JsonUtility.ToJson(data,true);
        PlayerPrefs.SetString(key, jsonData);
        PlayerPrefs.Save();
    }

    public void Load(Object data, string key) {
        //从json写文件
        if(PlayerPrefs.HasKey(key))
        {
            //拿到PlayerPrefs里保存的key的值，写入data里
            JsonUtility.FromJsonOverwrite(PlayerPrefs.GetString(key), data);
        }
    }
}
```

```cs
IEnumerator Transition(string sceneName,TransitionDestination.DestinationTag destinationTag)
        {
            //TODO:保存角色数值
            SaveManager.Instance.SavePlayerData();
            //判断是否是不同场景传送
            if(sceneName != SceneManager.GetActiveScene().name)
            {
                //基本的理解：我在这一帧是否需要等待什么事件完成
                //事件完成之后，执行yield return下面的命令
                yield return SceneManager.LoadSceneAsync(sceneName);

                //加载完场景当前脚本的物体就消失了，没有办法执行后面的命令
                //所以加载完成场景告诉它不要删除当前这个物体，需要重写Override Awake

                //每一次传送好，需要把人物生成出来，经验血量任务记录背包等等都需要配套复制过来，然后加载到人物身上
                yield return Instantiate(playerPrefab, GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);

                //加载好了player再覆盖血量经验等
                SaveManager.Instance.LoadPlayerData();

                //从协程中跳出去，中断协程
                yield break;
            }
            else
            {
                player = GameManager.Instance.PlayerStats.gameObject;
                playerAgent = player.GetComponent<NavMeshAgent>();
                playerAgent.enabled = false;
                player.transform.SetPositionAndRotation(GetDestination(destinationTag).gameObject.transform.position, GetDestination(destinationTag).gameObject.transform.rotation);
                playerAgent.enabled = true;
                yield return null;
            }            
        }
```

# 34:Main Menu 制作主菜单

创建新场景，添加人物等，需要对人物解包，这样就不用因为 player 的修改而可能覆盖 prefab  
为了让菜单看起来更立体，同时还有后处理，需要设置 Canvas 为 Screen Space - Camera  

![](1690255177527.png)

  
先设置 Canvas 距离为 1，再改为世界坐标 World Space  

![](1690255177645.png)

按钮颜色

Unity Editor 下使用 Application.Quit() 为什么程序没有退出？  
**因为 Editor 下使用 UnityEditor.EditorApplication.isPlaying = false 结束退出，只有当工程打包编译后的程序使用 Application.Quit() 才奏效**

![](1690255177731.png)

  
可以这样设置为第一个默认选中的  
调整按钮选择的方向，比如只能上下选中，或者方向键左右选中  

![](1690255177827.png)

  
通常使用 GameManager 来寻找场景入口，因为从头到尾都没有被删除

```
public Transform GetEntrance()
    {
        foreach(var item in FindObjectsOfType<TransitionDestination>())
        {
            if(item.destinationTag == TransitionDestination.DestinationTag.ENTER)
            {
                return item.transform;
            }
        }
        return null;
    }
```

```cs
public void TransitionToFirstLevel()
    {
        StartCoroutine(LoadLevel("GameScene_01_Forest"));
    }

    IEnumerator LoadLevel(string scene)
    {
        //场景不为空，才传送
        if(scene != "")
        {
            yield return SceneManager.LoadSceneAsync(scene);
            yield return player = Instantiate(playerPrefab,GameManager.Instance.GetEntrance().position, GameManager.Instance.GetEntrance().rotation);

            //保存游戏
            SaveManager.Instance.SavePlayerData();
            yield break;
        }
    }
```

将各类 Manager 添加到第一个 Menu 场景，因为是单例模式，所以不用担心其他场景有，发现重复就删除了  
第二个继续游戏，需要在 SaveManager 中添加代码，用于记录保存的场景。

```
public class SaveManager : SingleTon<SaveManager>
{
    //初始设置键值
    string sceneName = "level";
    //设置一个property，返回playerPrefs搜索到的场景名字的value
    //通常property的名字一样，但是首字母大写
    public string SceneName { get { return PlayerPrefs.GetString(sceneName); } }
```

```
public void TransitionToLoadGame() {
        StartCoroutine(LoadLevel(SaveManager.Instance.SceneName));
    }
```

传送完人物后，让人物自己获得自己的 CharacterData 记录，自己 load

```
void Start() {
        //放到Start是为了从菜单加载游戏后在执行，，因为一开始要把人物设置为Disabled
        GameManager.Instance.RigisterPlayer(characterStats);
        SaveManager.Instance.LoadPlayerData();
    }
```

返回首页

```
private void Update() {
        if(Input.GetKeyDown(KeyCode.Escape))
        {
            SceneController.Instance.
        }
        if(Input.GetKeyDown(KeyCode.S))
        {
            SavePlayerData();
        }

        if (Input.GetKeyDown(KeyCode.L))
        {
            LoadPlayerData();
        }
    }
```

# 35:SceneFader 场景转换的渐入渐出

Timeline, 可以用来制作 castthing，比如一个场景触发，播放动画，播放过程玩家无法操作人物，播放指定动画，显示字母等  

![](1690255177938.png)

需要选中物体创建 timeline

![](1690255178024.png)

![](1690255178093.png)

  
拖拽物体到 timeline 左边的资源库，创建 animation track

![](1690255178185.png)

  
点击红色开始录制，选中物体的位置关键帧，

![](1690255178252.png)

  

![](1690255178319.png)

添加两帧就可以播放了

然后创建 Animation Track 因为 player 有 Animator，可以直接拖拽赋值，  

![](1690255178391.png)

  
然后把 player 动画拖到 timeline 上  

![](1690255178453.png)

![](1690255178533.png)

修改动画播放为 loop  
此时人物位置可能有问题，需要我们添加一个 override timeline 然后修改 player 位置  

![](1690255178622.png)

  

![](1690255178723.png)

  

![](1690255178816.png)

  
然后需要编写函数让他在点击开始游戏才播放动画，不然一点运行自动开始

```cs
//需要使用命名空间来操作Playables
using UnityEngine.Playables;

public class MainMenu : MonoBehaviour
{
    PlayableDirector PlayableDirector;
     private void Awake() {
        newGameBtn = transform.GetChild(1).GetComponent<Button>();
        continueBtn = transform.GetChild(2).GetComponent<Button>();
        quitBtn = transform.GetChild(3).GetComponent<Button>();

        //直接为quitBtn的自带的OnClick函数添加监听的函数，用于退出
        quitBtn.onClick.AddListener(QuitGame);
        //点击newGame先播放动画，再运行newGame函数
        newGameBtn.onClick.AddListener(PlayTimeline);
        continueBtn.onClick.AddListener(ContinueGame);

        //给PlayableDirector赋值
        director = FindObjectOfType<PlayableDirector>();
        //为动画播放结束的Action添加委托
        director.stopped += NewGame;
    }

    void PlayTimeline() {
        director.Play();
    }

    //obj为了跟director的Action配合使用
    void NewGame(PlayableDirector obj) {
        PlayerPrefs.DeleteAll();
        //转换场景
        //创建任务，
        SceneController.Instance.TransitionToFirstLevel();
    }
}
```

![](1690255178912.png)

  
**有闪电符号说明是 action**  
播放动画的时候关闭 EventSystem，用 Timeline 实现，删除 Active，然后 eventSystem 就自动灰了，播放完毕就可以用了  

![](1690255178975.png)

为切换场景的淡入淡出添加一个 Fade Canvas，插入 Image，在 image 位置哪里，按下 alt 选择拉伸到整个屏幕  

![](1690255179061.png)

，，，，，可以使用图片α值调整淡入淡出  
这里使用 Canvas 添加 Canvas Group 脚本 来实现  

![](1690255179153.png)

，α值调整，是否可以互动，是否阻挡射线  
需要把这个蒙版 Canvas 制作一个预制体，然后α0-1 再 1-0，就是淡入淡出  
一般类似这种伴随着一个事件同步运行的，都要使用协程实现

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class SceneFader : MonoBehaviour
{
    CanvasGroup canvasGroup;

    public float fadeInDuration;
    public float fadeOutDuration;

    private void Awake()
    {
        canvasGroup = GetComponent<CanvasGroup>();
        DontDestroyOnLoad(this);
    }

    IEnumerator FadeOutIn()
    {
        //直接返回两个协程
        yield return FadeOut(fadeOutDuration);
        yield return FadeIn(fadeInDuration);
    }

    //public是为了能够在SceneController中来实现场景相关的淡入淡出
    //淡出
    public IEnumerator FadeOut(float time)
    {
        while(canvasGroup.alpha<1)
        {
            //保证在指定时间范围内从0变1,一帧的时间/总共想要运行的时间 = 总共运行多少帧
            canvasGroup.alpha += Time.deltaTime / time;
            yield return null;
        }
    }
    //淡入
    public IEnumerator FadeIn(float time)
    {
        while (canvasGroup.alpha != 0)
        {
            //保证在指定时间范围内从0变1,一帧的时间/总共想要运行的时间 = 总共运行多少帧
            canvasGroup.alpha -= Time.deltaTime / time;
            yield return null;
        }
        //播放完销毁canvas
        Destroy(gameObject);
    }
}
```

```
IEnumerator LoadLevel(string scene)
    {
        //先生成prefab
        SceneFader fade = Instantiate(sceneFaderPrefab);
        //场景不为空，才传送
        if(scene != "")
        {
            yield return StartCoroutine(fade.FadeOut(2.5f));
            yield return SceneManager.LoadSceneAsync(scene);
            yield return player = Instantiate(playerPrefab,GameManager.Instance.GetEntrance().position, GameManager.Instance.GetEntrance().rotation);

            //保存游戏
            SaveManager.Instance.SavePlayerData();
            yield return StartCoroutine(fade.FadeIn(2.5f));
            yield break;
        }
    }
```

当人物死亡后，需要广播让 SceneController 也接收广播，因此 SceneController 需要继承 IEndGameObserver  

# 36:Build & Run 打包及运行

![](1690255179219.png)

1.  确认所有场景是否加载
2.  确认场景顺序，对于有些切换场景依靠标号很重要
3.  ![](1690255179287.png)
    
    这事不同的压缩方法
4.  ![](1690255179349.png)
    
5.  ![](1690255179450.png)
    
    屏幕模式，全屏或窗口
6.  other settings 中
    
    ![](1690255179557.png)
    
    可以选择 **ILCPP，可以是游戏大小更小，还可以防止反编译**
7.  build 前，需要清除存档文件，
    
    ![](1690255179640.png)