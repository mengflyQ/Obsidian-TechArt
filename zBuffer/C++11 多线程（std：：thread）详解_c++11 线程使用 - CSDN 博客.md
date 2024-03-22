注：此教程以 Visual Studio 2019 [Version](https://so.csdn.net/so/search?q=Version&spm=1001.2101.3001.7020) 16.10.3 （MSVC 19.29.30038.1） 为标准，大多数内容参照 [cplusplus.com](http://cplusplus.com/reference/) 里的解释  
此文章允许转载，但请标明出处（https://blog.csdn.net/sjc_0910/article/details/118861539）

前方高能：本文字数接近 2 万

#### 文章目录

*   [线程？进程？多线程？](#_7)
*   *   *   *   [什么是多线程？](#_8)
            *   [进程与线程的区别](#_13)
*   [C++11 的 std::thread](#C11stdthread_25)
*   *   [std::thread 常用成员函数](#stdthread_27)
    *   *   *   [构造 & 析构函数](#_28)
            *   [常用成员函数](#_37)
    *   [举个栗子](#_46)
    *   *   *   [例一：thread 的基本使用](#thread_47)
            *   [例二：thread 执行有参数的函数](#thread_83)
            *   [例三：thread 执行带有引用参数的函数](#thread_120)
    *   [注意事项](#_222)
*   [C++11 中的 std::atomic 和 std::mutex](#C11stdatomicstdmutex_228)
*   *   [为什么要有 atomic 和 mutex](#atomicmutex_230)
    *   [std::mutex](#stdmutex_260)
    *   *   [例四：std::mutex 的使用](#stdmutex_262)
        *   [mutex 的常用成员函数](#mutex_290)
    *   [std::atomic](#stdatomic_297)
    *   *   [例五：std::atomic 的使用](#stdatomic_300)
        *   *   [代码解释](#_327)
        *   [std::atomic 常用成员函数](#stdatomic_335)
        *   *   [构造函数](#_336)
            *   [常用成员函数](#_344)
*   [C++11 中的 std::async](#C11stdasync_347)
*   *   *   [为什么大多数情况下使用 async 而不用 thread](#asyncthread_349)
        *   [std::async 参数](#stdasync_352)
        *   *   [std::launch 强枚举类（enum class）](#stdlaunchenum_class_358)
        *   [例六：std::async 的使用](#stdasync_366)
*   [C++11 中的 std::future](#C11stdfuture_399)
*   *   *   [例七：使用 std::future 获取线程的返回值](#stdfuture_401)
        *   *   [代码解释](#_429)
        *   [std::future 常用成员函数](#stdfuture_431)
        *   *   [构造 & 析构函数](#_432)
            *   [常用成员函数](#_439)
        *   [std::future_status 强枚举类](#stdfuture_status_446)
        *   [为啥要有 void 特化的 std::future？](#voidstdfuture_448)
        *   *   [例八：void 特化 std::future](#voidstdfuture_450)
*   [C++11 中的 std::promise](#C11stdpromise_474)
*   *   *   [例九：引用传递返回值](#_484)
        *   [std::promise 到底是啥](#stdpromise_512)
        *   *   [例十：std::future 的值不能改变，那么如何利用引用传递返回值](#stdfuture_515)
        *   [std::promise 常用成员函数](#stdpromise_528)
        *   *   [构造 & 析构函数](#_529)
            *   [常用成员函数](#_537)
        *   [例十一：std::promise 的使用](#stdpromise_542)
*   [C++11 中的 std::this_thread](#C11stdthis_thread_572)
*   *   *   [std::this_thread 常用函数](#stdthis_thread_575)
        *   [例十二：std::this_thread 中常用函数的使用](#stdthis_thread_583)
*   [结尾](#_627)

## 线程？进程？[多线程](https://so.csdn.net/so/search?q=%E5%A4%9A%E7%BA%BF%E7%A8%8B&spm=1001.2101.3001.7020)？

##### 什么是多线程？

百度百科中的解释：

多线程（multithreading），是指从软件或者硬件上实现多个线程并发执行的技术。具有多线程能力的计算机因有硬件支持而能够在同一时间执行多于一个线程，进而提升整体处理性能。  
在一个程序中，这些独立运行的程序片段叫作 “线程”（Thread），利用它编程的概念就叫作 “多线程处理”。

##### 进程与线程的区别

定义：

进程是正在运行的程序的实例，而线程是是进程中的实际运作单位。

区别：

*   一个程序有且只有一个进程，但可以拥有至少一个的线程。
*   不同进程拥有不同的地址空间，互不相关，而不同线程共同拥有相同进程的地址空间。

看了上述介绍，你应该明白进程与线程的区别了。什么，还不明白？下面这幅图应该能让你搞清楚：  

![](https://img-blog.csdnimg.cn/20210717195132759.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3NqY18wOTEw,size_16,color_FFFFFF,t_70)

  
（自己画的图，不好看请见谅）

## C++11 的 std::thread

在 C 中已经有一个叫做 pthread 的东西来进行多线程编程，但是并不好用 ~（如果你认为句柄、回调式编程很实用，那请当我没说）~，所以 c++11 标准库中出现了一个叫作 std::thread 的东西。

### std::thread 常用成员函数

##### 构造 & [析构函数](https://so.csdn.net/so/search?q=%E6%9E%90%E6%9E%84%E5%87%BD%E6%95%B0&spm=1001.2101.3001.7020)

<table><thead><tr><th>函数</th><th>类别</th><th>作用</th></tr></thead><tbody><tr><td>thread() noexcept</td><td>默认构造函数</td><td>创建一个线程，<br>什么也不做</td></tr><tr><td>template &lt;class Fn, class… Args&gt;<br>explicit thread(Fn&amp;&amp; fn, Args&amp;&amp;… args)</td><td>初始化构造函数</td><td>创建一个线程，<br>以<code>args</code>为参数<br>执行<code>fn</code>函数</td></tr><tr><td>thread(const thread&amp;) = delete</td><td>复制构造函数</td><td>（已删除）</td></tr><tr><td>thread(thread&amp;&amp; x) noexcept</td><td>移动构造函数</td><td>构造一个与<code>x</code><br>相同的对象, 会破坏<code>x</code>对象</td></tr><tr><td>~thread()</td><td>析构函数</td><td>析构对象</td></tr></tbody></table>

##### 常用成员函数

<table><thead><tr><th>函数</th><th>作用</th></tr></thead><tbody><tr><td>void join()</td><td>等待线程结束并清理资源（会阻塞）</td></tr><tr><td>bool joinable()</td><td>返回线程是否可以执行 join 函数</td></tr><tr><td>void detach()</td><td>将线程与调用其的线程分离，彼此独立执行（此函数必须在线程创建时立即调用，且调用此函数会使其不能被 join）</td></tr><tr><td>std::thread::id get_id()</td><td>获取线程 id</td></tr><tr><td>thread&amp; operator=(thread &amp;&amp;rhs)</td><td>见移动构造函数<br>（如果对象是 joinable 的，那么会调用<code>std::terminate()</code>结果程序）</td></tr></tbody></table>

### 举个栗子

##### 例一：thread 的基本使用

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
using namespace std;
void doit() { cout << "World!" << endl; }
int main() {
	// 这里的线程a使用了 C++11标准新增的lambda函数
	// 有关lambda的语法，请参考我之前的一篇博客
	// https://blog.csdn.net/sjc_0910/article/details/109230162
	thread a([]{
		cout << "Hello, " << flush;
	}), b(doit);
	a.join();
	b.join();
	return 0;
}
```

输出结果：

```
Hello, World!
```

或者是

```
World!
Hello,
```

那么，为什么会有不同的结果呢？  
这就是多线程的特色！

多线程运行时是以异步方式执行的，与我们平时写的同步方式不同。异步方式可以同时执行多条语句。

在上面的例子中，我们定义了 2 个 thread，这 2 个 thread 在执行时并不会按照一定的顺序。打个比方，2 个 thread 执行时，就好比赛跑，谁先跑到终点，谁就先执行完毕。

##### 例二：thread 执行有参数的函数

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
using namespace std;
void countnumber(int id, unsigned int n) {
	for (unsigned int i = 1; i <= n; i++);
	cout << "Thread " << id << " finished!" << endl;
}
int main() {
	thread th[10];
	for (int i = 0; i < 10; i++)
		th[i] = thread(countnumber, i, 100000000);
	for (int i = 0; i < 10; i++)
		th[i].join();
	return 0;
}
```

你的输出**有可能**是这样

```
Thread 2 finished!Thread 3 finished!
Thread 7 finished!
Thread 5 finished!

Thread 8 finished!
Thread 4 finished!
Thread 6 finished!
Thread 0 finished!
Thread 1 finished!
Thread 9 finished!
```

注意：我说的是有可能。你的运行结果可能和我的不一样，这是正常现象，在上一个例子中我们分析过原因。

这个例子中我们在创建线程时向函数传递了一些参数，但如果要传递引用参数呢？是不是像这个例子中直接传递就行了？让我们来看看第三个例子：

##### 例三：thread 执行带有引用参数的函数

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
using namespace std;
template<class T> void changevalue(T &x, T val) {
	x = val;
}
int main() {
	thread th[100];
	int nums[100];
	for (int i = 0; i < 100; i++)
		th[i] = thread(changevalue<int>, nums[i], i+1);
	for (int i = 0; i < 100; i++) {
		th[i].join();
		cout << nums[i] << endl;
	}
	return 0;
}
```

如果你尝试编译这个程序，那你的编译器一定会报错

```
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(55): error C2672: “std::invoke”: 未找到匹配的重载函数
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(61): note: 查看对正在编
译的函数 模板 实例化“unsigned int std::thread::_Invoke<_Tuple,0,1,2>(void *) noexcept”的引用
        with
        [
            _Tuple=_Tuple
        ]
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(66): note: 查看对正在编 
译的函数 模板 实例化“unsigned int (__cdecl *std::thread::_Get_invoke<_Tuple,0,1,2>(std::integer_sequence<size_t,0,1,2>) noexcept)(void *) noexcept”的引用
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(89): note: 查看对正在编
译的函数 模板 实例化“void std::thread::_Start<void(__cdecl &)(T &,T),int&,_Ty>(_Fn,int &,_Ty &&)”的引用
        with
        [
            T=int,
            _Ty=int,
            _Fn=void (__cdecl &)(int &,int)
        ]
main.cpp(11): note: 查看对正在编译的函数 模板 实例化“std::thread::thread<void(__cdecl &)(T &,T),int&,int,0>(_Fn,int &,int &&)” 
的引用
        with
        [
            T=int,
            _Fn=void (__cdecl &)(int &,int)
        ]
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): error C2893: 未能使
函数模板“unknown-type std::invoke(_Callable &&,_Ty1 &&,_Types2 &&...) noexcept(<expr>)”专用化
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\type_traits(1589): note: 参见“std::invoke”的声明
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): note: 用下列模板参 
数:
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): note: “_Callable=void (__cdecl *)(T &,T)”
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): note: “_Ty1=int”   
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): note: “_Types2={int}”
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\thread(51): error C2780: “unknown-type std::invoke(_Callable &&) noexcept(<expr>)”: 应输入 1 个参数，却提供了 3 个
E:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30037\include\type_traits(1583): note: 参见“std::invoke”的声明
```

这是怎么回事呢？原来 thread 在传递参数时，是以右值传递的：

```
template <class Fn, class... Args>
explicit thread(Fn&& fn, Args&&... args)
```

划重点：`Args&&... args`  
很明显的右值引用，那么我们该如何传递一个左值呢？`std::ref`和`std::cref`很好地解决了这个问题。  
`std::ref` 可以包装按引用传递的值。  
`std::cref` 可以包装按 const 引用传递的值。  
针对上面的例子，我们可以使用以下代码来修改：

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
using namespace std;
template<class T> void changevalue(T &x, T val) {
	x = val;
}
int main() {
	thread th[100];
	int nums[100];
	for (int i = 0; i < 100; i++)
		th[i] = thread(changevalue<int>, ref(nums[i]), i+1);
	for (int i = 0; i < 100; i++) {
		th[i].join();
		cout << nums[i] << endl;
	}
	return 0;
}
```

这次编译可以成功通过，你的程序输出的结果应该是这样的：

```
...
```

（中间省略了一堆数）

### 注意事项

*   线程是在 thread 对象被定义的时候开始执行的，而不是在调用 join 函数时才执行的，调用 join 函数只是阻塞等待线程结束并回收资源。
*   分离的线程（执行过 detach 的线程）会在调用它的线程结束或自己结束时释放资源。
*   线程会在函数运行完毕后自动释放，不推荐利用其他方法强制结束线程，可能会因资源未释放而导致内存泄漏。
*   **没有执行`join`或`detach`的线程在程序结束时会引发异常**

## C++11 中的 std::atomic 和 std::mutex

我们现在已经知道如何在 c++11 中创建线程，那么如果多个线程需要操作同一个变量呢？

### 为什么要有 atomic 和 mutex

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
using namespace std;
int n = 0;
void count10000() {
	for (int i = 1; i <= 10000; i++)
		n++;
}
int main() {
	thread th[100];
	// 这里偷了一下懒，用了c++11的foreach结构
	for (thread &x : th)
		x = thread(count10000);
	for (thread &x : th)
		x.join();
	cout << n << endl;
	return 0;
}
```

我的 2 次输出结果分别是：

我们的输出结果应该是 1000000，可是为什么实际输出结果比 1000000 小呢？  
在上文我们分析过多线程的执行顺序——同时进行、无次序，所以这样就会导致一个问题：多个线程进行时，如果它们同时操作同一个变量，那么肯定会出错。为了应对这种情况，c++11 中出现了`std::atomic`和`std::mutex`。

### std::mutex

`std::mutex`是 C++11 中最基本的互斥量，一个线程将 mutex 锁住时，其它的线程就不能操作 mutex，直到这个线程将 mutex 解锁。根据这个特性，我们可以修改一下上一个例子中的代码：

#### 例四：std::mutex 的使用

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
#include <mutex>
using namespace std;
int n = 0;
mutex mtx;
void count10000() {
	for (int i = 1; i <= 10000; i++) {
		mtx.lock();
		n++;
		mtx.unlock();
	}
}
int main() {
	thread th[100];
	for (thread &x : th)
		x = thread(count10000);
	for (thread &x : th)
		x.join();
	cout << n << endl;
	return 0;
}
```

执行了好几次，输出结果都是 1000000，说明正确。

#### mutex 的常用成员函数

（这里用`mutex`代指`对象`）

<table><thead><tr><th>函数</th><th>作用</th></tr></thead><tbody><tr><td>void lock()</td><td>将 mutex 上锁。<br>如果 mutex 已经被其它线程上锁，<br>那么会阻塞，直到解锁；<br>如果 mutex 已经被同一个线程锁住，<br>那么会产生死锁。</td></tr><tr><td>void unlock()</td><td>解锁 mutex，释放其所有权。<br>如果有线程因为调用 lock() 不能上锁而被阻塞，则调用此函数会将 mutex 的主动权随机交给其中一个线程；<br>如果 mutex 不是被此线程上锁，那么会引发未定义的异常。</td></tr><tr><td>bool try_lock()</td><td>尝试将 mutex 上锁。<br>如果 mutex 未被上锁，则将其上锁并返回 true；<br>如果 mutex 已被锁则返回 false。</td></tr></tbody></table>

### std::atomic

mutex 很好地解决了多线程资源争抢的问题，但它也有缺点：太…… 慢…… 了……  
以例四为标准，我们定义了 100 个 thread，每个 thread 要循环 10000 次，每次循环都要加锁、解锁，这样固然会浪费很多的时间，那么该怎么办呢？接下来就是 atomic 大展拳脚的时间了。

#### 例五：std::atomic 的使用

根据 atomic 的定义，我又修改了例四的代码：

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
// #include <mutex> //这个例子不需要mutex了
#include <atomic>
using namespace std;
atomic_int n = 0;
void count10000() {
	for (int i = 1; i <= 10000; i++) {
		n++;
	}
}
int main() {
	thread th[100];
	for (thread &x : th)
		x = thread(count10000);
	for (thread &x : th)
		x.join();
	cout << n << endl;
	return 0;
}
```

输出结果：1000000，正常

##### 代码解释

可以看到，我们只是改动了 n 的类型（`int`->`std::atomic_int`），其他的地方一点没动，输出却正常了。  
有人可能会问了：这个`std::atomic_int`是个什么玩意儿？其实，`std::atomic_int`只是`std::atomic<int>`的别名罢了。  
atomic，本意为原子，官方 ~（我不确定是不是官方，反正继续解释就对了）~ 对其的解释是

原子操作是最小的且不可并行化的操作。

这就意味着即使是多线程，也要像同步进行一样**同步操作** atomic 对象，从而省去了 mutex 上锁、解锁的时间消耗。

#### std::atomic 常用成员函数

##### 构造函数

对，atomic 没有显式定义析构函数

<table><thead><tr><th>函数</th><th>类型</th><th>作用</th></tr></thead><tbody><tr><td>atomic() noexcept = default</td><td>默认构造函数</td><td>构造一个 atomic 对象（未初始化，可通过 atomic_init 进行初始化）</td></tr><tr><td>constexpr atomic(T val) noexcept</td><td>初始化构造函数</td><td>构造一个 atomic 对象，用<code>val</code>的值来初始化</td></tr><tr><td>atomic(const atomic&amp;) = delete</td><td>复制构造函数</td><td>（已删除）</td></tr></tbody></table>

##### 常用成员函数

atomic 能够直接当作普通变量使用，成员函数貌似没啥用，所以这里就不列举了，想搞明白的[点这里](http://cplusplus.com/reference/atomic/atomic/) ~（英语渣慎入，不过程序猿中应该没有英语渣吧）~

## C++11 中的 std::async

注：std::async 定义在`future`头文件中。

#### 为什么大多数情况下使用 async 而不用 thread

thread 可以快速、方便地创建线程，但在 async 面前，就是小巫见大巫了。  
async 可以根据情况选择同步执行或创建新线程来异步执行，当然也可以手动选择。对于 async 的返回值操作也比 thread 更加方便。

#### std::async 参数

不同于 thread，async 是一个函数，所以没有成员函数。

<table><thead><tr><th>重载版本</th><th>作用</th></tr></thead><tbody><tr><td>template &lt;class Fn, class… Args&gt;<br>&nbsp;&nbsp;future&lt;typename result_of&lt;Fn(Args…)&gt;::type&gt;<br>&nbsp;&nbsp;&nbsp;&nbsp;async (Fn&amp;&amp; fn, Args&amp;&amp;… args)</td><td>异步或同步（根据操作系统而定）以 args 为参数执行 fn<br>同样地，传递引用参数需要<code>std::ref</code>或<code>std::cref</code></td></tr><tr><td>template &lt;class Fn, class… Args&gt;<br>&nbsp;&nbsp;future&lt;typename result_of&lt;Fn(Args…)&gt;::type&gt;<br>&nbsp;&nbsp;&nbsp;&nbsp;async (launch policy, Fn&amp;&amp; fn, Args&amp;&amp;… args);</td><td>异步或同步（根据<code>policy</code>参数而定（见下文））以 args 为参数执行 fn，引用参数同上</td></tr></tbody></table>

##### std::launch 强枚举类（enum class）

std::launch 有 2 个枚举值和 1 个特殊值：

<table><thead><tr><th>标识符</th><th>实际值（以 Visual Studio 2019 为标准）</th><th>作用</th></tr></thead><tbody><tr><td>枚举值：launch::async</td><td>0x1（1）</td><td>异步启动</td></tr><tr><td>枚举值：launch::deferred</td><td>0x2（2）</td><td>在调用 future::get、future::wait 时同步启动（std::future 见后文）</td></tr><tr><td>特殊值：launch::async | launch::defereed</td><td>0x3（3）</td><td>同步或异步，根据操作系统而定</td></tr></tbody></table>

#### 例六：std::async 的使用

暂且不管它的返回值 std::future 是啥，先举个例再说。

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
#include <future>
using namespace std;
int main() {
	async(launch::async, [](const char *message){
		cout << message << flush;
	}, "Hello, ");
	cout << "World!" << endl;
	return 0;
}
```

你的编译器可能会给出一条警告：

```
warning C4834: 放弃具有 "nodiscard" 属性的函数的返回值
```

这是因为编译器不想让你丢弃 async 的返回值 std::future，不过在这个例子中不需要它，忽略这个警告就行了。  
你的输出结果：

```
Hello, World!
```

不过如果你输出的是

```
World!
Hello,
```

也别慌，正常现象，多线程嘛！反正我执行了好几次也没出现这个结果。

## C++11 中的 std::future

我们已经知道如何使用 async 来异步或同步执行任务，但如何获得函数的返回值呢？这时候，async 的返回值 std::future 就派上用场了。

#### 例七：使用 std::future 获取线程的返回值

在之前的所有例子中，我们创建线程时调用的函数都没有返回值，但如果调用的函数有返回值呢？

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
// #include <thread> // 这里我们用async创建线程
#include <future> // std::async std::future
using namespace std;

template<class ... Args> decltype(auto) sum(Args&&... args) {
	// C++17折叠表达式
	// "0 +"避免空参数包错误
	return (0 + ... + args);
}

int main() {
	// 注：这里不能只写函数名sum，必须带模板参数
	future<int> val = async(launch::async, sum<int, int, int>, 1, 10, 100);
	// future::get() 阻塞等待线程结束并获得返回值
	cout << val.get() << endl;
	return 0;
}
```

输出：

##### 代码解释

我们定义了一个函数 sum，它可以计算多个数字的和，之后我们又定义了一个对象`val`，它的类型是`std::future<int>`，这里的`int`代表这个函数的返回值是 int 类型。在创建线程后，我们使用了 future::get() 来**阻塞**等待线程结束并获取其返回值。至于 sum 函数中的折叠表达式（fold expression），不是我们这篇文章的重点。

#### std::future 常用成员函数

##### 构造 & 析构函数

<table><thead><tr><th>函数</th><th>类型</th><th>作用</th></tr></thead><tbody><tr><td>future() noexcept</td><td>默认构造函数</td><td>构造一个空的、无效的 future 对象，但可以<strong>移动分配</strong>到另一个 future 对象</td></tr><tr><td>future(const future&amp;) = delete</td><td>复制构造函数</td><td>（已删除）</td></tr><tr><td>future (future&amp;&amp; x) noexcept</td><td>移动构造函数</td><td>构造一个与<code>x</code>相同的对象并破坏<code>x</code></td></tr><tr><td>~future()</td><td>析构函数</td><td>析构对象</td></tr></tbody></table>

##### 常用成员函数

<table><thead><tr><th>函数</th><th>作用</th></tr></thead><tbody><tr><td>一般：T get()<br>当类型为引用：R&amp; future&lt;R&amp;&gt;::get()<br>当类型为 void：void future::get()</td><td>阻塞等待线程结束并获取返回值。<br>若类型为 void，则与<code>future::wait()</code>相同。<br><strong>只能调用一次。</strong></td></tr><tr><td>void wait() const</td><td>阻塞等待线程结束</td></tr><tr><td>template &lt;class Rep, class Period&gt;<br>&nbsp;&nbsp;future_status wait_for(const chrono::duration&lt;Rep,Period&gt;&amp; rel_time) const;</td><td>阻塞等待<code>rel_time</code>（<code>rel_time</code>是一段时间），<br>若在这段时间内线程结束则返回<code>future_status::ready</code><br>若没结束则返回<code>future_status::timeout</code><br>若 async 是以<code>launch::deferred</code>启动的，则<strong>不会阻塞</strong>并立即返回<code>future_status::deferred</code></td></tr><tr><td><a href="http://cplusplus.com/reference/chrono/duration/" rel="nofollow">不知道 std::chrono::duration 的点这里</a></td><td></td></tr></tbody></table>

#### std::future_status 强枚举类

见上文`future::wait_for`解释

#### 为啥要有 void 特化的 std::future？

std::future 的作用并不只有获取返回值，它还可以检测线程是否已结束、阻塞等待，所以对于返回值是 void 的线程来说，future 也同样重要。

##### 例八：void 特化 std::future

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <future>
using namespace std;
void count_big_number() {
	// C++14标准中，可以在数字中间加上单
	// 引号 ' 来分隔数字，使其可读性更强
	for (int i = 0; i <= 10'0000'0000; i++);
}
int main() {
	future<void> fut = async(launch::async, count_big_number);
	cout << "Please wait" << flush;
	// 每次等待1秒
	while (fut.wait_for(chrono::seconds(1)) != future_status::ready)
		cout << '.' << flush;
	cout << endl << "Finished!" << endl;
	return 0;
}
```

如果你运行一下这个代码，你也许就能搞懂那些软件的加载画面是怎么实现的。

## C++11 中的 std::promise

在上文，我们已经讲到如何获取 async 创建线程的返回值。不过在某些特殊情况下，我们可能需要使用 thread 而不是 async，那么如何获得 thread 的返回值呢？  
如果你尝试这么写，那么你的编译器肯定会报错：

```
std::thread th(func);
std::future<int> return_value = th.join();
```

还记得之前我们讲的 thread 成员函数吗？thread::join() 的返回值是 void 类型，所以你不能通过 join 来获得线程返回值。那么 thread 里有什么函数能获得返回值呢？  
答案是：没有。  
惊不惊喜？意不意外？thread 竟然不能获取返回值！难道 thread 真的就没有办法返回点什么东西吗？如果你真是那么想的，那你就太低估 C++ 了。一些聪明的人可能已经想到解决办法了：可以通过传递引用的方式来获取返回值。

#### 例九：引用传递返回值

这个例子中我们先不牵扯多线程的问题。假如你写一个函数，需要返回 3 个值，那你会怎么办呢？vector？嵌套 pair？不不不，都不需要，3 个引用参数就可以了。

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
using namespace std;
constexpr long double PI = 3.14159265358979323846264338327950288419716939937510582097494459230781640628;
// 给定圆的半径r，求圆的直径、周长及面积
void get_circle_info(double r, double &d, double &c, double &s) {
	d = r * 2;
	c = PI * d;
	s = PI * r * r;
}
int main() {
	double r;
	cin >> r;
	double d, c, s;
	get_circle_info(r, d, c, s);
	cout << d << ' ' << c << ' ' <<  s << endl;
	return 0;
}
```

输入 5，输出：

```
10 31.4159 78.5398
```

如果你和我输出有一些误差，是正常现象，不同编译器、不同机器处理精度也有所不同

#### std::promise 到底是啥

promise 实际上是 std::future 的一个包装，在讲解 future 时，我们并没有牵扯到改变 future 值的问题，但是如果使用 thread 以引用传递返回值的话，就必须要改变 future 的值，那么该怎么办呢？  
实际上，future 的值不能被改变，但你可以通过 promise 来创建一个拥有特定值的 future。什么？没听懂？好吧，那我就举个例子：

##### 例十：std::future 的值不能改变，那么如何利用引用传递返回值

```
constexpr int a = 1;
```

现在，把常量当成 future，把 a 当作一个 future 对象，那我们想拥有一个值为 2 的 future 对象该怎么办？  
很简单：

```
constexpr int a = 1;
constexpr int b = 2;
```

这样，我们就不用思考如何改动 a 的值，直接创建一个新常量就能解决问题了。  
promise 的原理就是这样，不改变已有 future 的值，而是创建新的 future 对象。什么？还没听懂？好吧，记住这句话：

future 的值不能改变，promise 的值可以改变。

#### std::promise 常用成员函数

##### 构造 & 析构函数

<table><thead><tr><th>函数</th><th>类型</th><th>作用</th></tr></thead><tbody><tr><td>promise()</td><td>默认构造函数</td><td>构造一个空的 promise 对象</td></tr><tr><td>template &lt;class Alloc&gt; promise(allocator_arg_t aa, const Alloc&amp; alloc)</td><td>构造函数</td><td>与默认构造函数相同，但使用特定的内存分配器<code>alloc</code>构造对象</td></tr><tr><td>promise (const promise&amp;) = delete</td><td>复制构造函数</td><td>（已删除）</td></tr><tr><td>promise (promise&amp;&amp; x) noexcept</td><td>移动构造函数</td><td>构造一个与<code>x</code>相同的对象并破坏<code>x</code></td></tr><tr><td>~promise()</td><td>析构函数</td><td>析构对象</td></tr></tbody></table>

##### 常用成员函数

<table><thead><tr><th>函数</th><th>作用</th></tr></thead><tbody><tr><td>一般：<br>void set_value (const T&amp; val)<br>void set_value (T&amp;&amp; val)<br>当类型为引用：void promise&lt;R&amp;&gt;::set_value (R&amp; val)<br>当类型为 void：void promise::set_value (void)</td><td>设置 promise 的值并将共享状态设为 ready（将 future_status 设为 ready）<br>void 特化：只将共享状态设为 ready</td></tr><tr><td>future get_future()</td><td>构造一个 future 对象，其值与 promise 相同，status 也与 promise 相同</td></tr></tbody></table>

#### 例十一：std::promise 的使用

以例七中的代码为基础加以修改：

```
// Compiler: MSVC 19.29.30038.1
// C++ Standard: C++17
#include <iostream>
#include <thread>
#include <future> // std::promise std::future
using namespace std;

template<class ... Args> decltype(auto) sum(Args&&... args) {
	return (0 + ... + args);
}

template<class ... Args> void sum_thread(promise<long long> &val, Args&&... args) {
	val.set_value(sum(args...));
}

int main() {
	promise<long long> sum_value;
	thread get_sum(sum_thread<int, int, int>, ref(sum_value), 1, 10, 100);
	cout << sum_value.get_future().get() << endl;
	get_sum.join(); // 感谢评论区 未来想做游戏 的提醒
	return 0;
}
```

输出：

## C++11 中的 std::this_thread

上面讲了那么多关于创建、控制线程的方法，现在该讲讲关于线程控制自己的方法了。  
在`<thread>`头文件中，不仅有 std::thread 这个类，而且还有一个 std::this_thread 命名空间，它可以很方便地让线程对自己进行控制。

#### std::this_thread 常用函数

std::this_thread 是个命名空间，所以你可以使用`using namespace std::this_thread;`这样的语句来展开这个命名空间，不过我不建议这么做。

<table><thead><tr><th>函数</th><th>作用</th></tr></thead><tbody><tr><td>std::thread::id get_id() noexcept</td><td>获取当前线程 id</td></tr><tr><td>template&lt;class Rep, class Period&gt;<br>void sleep_for(const std::chrono::duration&lt;Rep, Period&gt;&amp; sleep_duration )</td><td>等待<code>sleep_duration</code>（<code>sleep_duration</code>是一段时间）</td></tr><tr><td>void yield() noexcept</td><td><strong>暂时</strong>放弃线程的执行，将主动权交给其他线程<br>（放心，主动权还会回来）</td></tr></tbody></table>

#### 例十二：std::this_thread 中常用函数的使用

```
#include <iostream>
#include <thread>
#include <atomic>
using namespace std;
atomic_bool ready = 0;
// uintmax_t ==> unsigned long long
void sleep(uintmax_t ms) {
	this_thread::sleep_for(chrono::milliseconds(ms));
}
void count() {
	while (!ready) this_thread::yield();
	for (int i = 0; i <= 20'0000'0000; i++);
	cout << "Thread " << this_thread::get_id() << " finished!" << endl;
	return;
}
int main() {
	thread th[10];
	for (int i = 0; i < 10; i++)
		th[i] = thread(::count);
	sleep(5000);
	ready = true;
	cout << "Start!" << endl;
	for (int i = 0; i < 10; i++)
		th[i].join();
	return 0;
}
```

我的输出：

```
Start!
Thread 8820 finished!Thread 6676 finished!

Thread 13720 finished!
Thread 3148 finished!
Thread 13716 finished!
Thread 16424 finished!
Thread 14228 finished!
Thread 15464 finished!
Thread 3348 finished!
Thread 6804 finished!
```

你的输出几乎不可能和我一样，不仅是多线程并行的问题，而且每个线程的 id 也可能不同。

## 结尾

这篇文章到这里就结束了 (说不定以后还会写个 c++20 的`std::jthread`讲解）。 **感谢各位在评论区提出的建议。** 这是我第一篇接近 2 万字的文章。其实我刚开始写这篇文章时，也没想到这篇文章会吸引这么多人看，评论里还会有很多的好评，并且还上过一次热榜：  

![](https://img-blog.csdnimg.cn/20210720100157836.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3NqY18wOTEw,size_16,color_FFFFFF,t_70)

  
~（厚颜无耻地给自己点赞）~  
又入选过 C/C++ 领域内容榜：  

![](https://img-blog.csdnimg.cn/20210720100512112.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3NqY18wOTEw,size_16,color_FFFFFF,t_70)

  
这着实是出乎我的意料的。在此也感谢评论区里各位的好评，我就不一一回复了。  
如果你觉得这篇文章有不对、不标准之处，也可以在评论区里说一下，感谢支持。