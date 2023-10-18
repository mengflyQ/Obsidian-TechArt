---
title: Windows编程
aliases: []
tags: []
create_time: 2023-04-25 23:41
uid: 202304252341
banner: "[[Pasted image 20230512121530.png]]"
---

> [!NOTE] 龙书规定
> 为避免混淆，我们将使用大写字母“W”开头的 Windows 来表示视窗操作系统，而以小写字母“w”作为开头的 window 来代表 Windows 系统中的特定窗口。
# 0 概述
## 资源
在 Windows 系统中，多款应用程序可以并发运行。因此，像 CPU、内存乃至显示器屏幕这些硬件资源，都在多应用程序的共享范围之列。**为了防止多应用程序在无组织、无纪律的情况下访问或修改资源所引发的混乱，Windows 应用程序并不能直接访问硬件。** Windows 系统的主要任务之一就是管理当前正在运行中的实例化程序并为它们合理分配资源。因此，为避免我们编写的程序因某些操作而对其他运行中的应用产生不必要的影响，这些具体的执行过程都要交由 Windows 系统来加以处理。例如，要展示一个窗口，我们必须调用 Win32API 函数 `ShowWindow`, 而不能直接向显存中写入数据。
## 事件、消息队列、消息以及消息循环
凡是 Windows 应用程序就要依从**事件驱动编程模型( event-driven programming model )**。一般来讲，应用程序总会“坐等”某事的发生，即**事件(event)** 的发生。生成事件的方式多种多样，常见的例子有键盘按键、点击鼠标,或者是窗口的创建、调整大小、移动、关闭、最小化、最大化乃至“隐身( visible,即窗口变为不可见的状态)”。

当事件发生时，Windows 会向发生事件的应用程序发送相应的**消息(message)**，随后，该消息会被添加至此应用程序的**消息队列**(message queue，简言之，这是一种为应用程序存储消息的优先级队列)之中。应用程序会在**消息循环**(message loop)中不断地检测队列中的消息，在接收到消息之后，它会将此消息分派到相应窗口的**窗口过程**(window procedure)。(一个应用程序可能附有若干个窗口)。**每个窗口都有一个与之关联的名为窗口过程的函数** (窗口之间也能共享相同的窗口过程，因此，不一定要为每个窗口都编写独立的窗口过程)。我们实现的窗口过程函数中写有处理特定消息的代码。
比如，我们希望按下 Esc 键之后销毁窗口，此功能在窗口过程中可写作：
```c++ nums
case WM_KEYDOWN:
		if(wParam =VK ESCAPE)
			Destroywindow (ghMainWnd);
		return 0;
```

我们应将目标窗口不处理的消息转发至 Win32API 所提供的默认窗口过程 `DefWindowProc`,让它去完成相应处理。

简而言之，用户或应用程序的某些行为会产生事件。操作系统会为响应此事件的应用程序发送相关的消息。随后，该消息会被添加到目标应用程序的消息队列之中。由于应用程序会不断地检测队列中的消息，在接收到消息后，应用程序就会将它分派到对应窗口的窗口过程。最后，窗口过程会针对此消息执行相应的系列指令。
**下面这张图概括了事件驱动编程的模型。目前，我们只用关心一个窗口，所以只需要注意这棵树的中间即可。**
![[Pasted image 20230403215449.png]]
## 图形用户界面
大多数的 Windows 程序会以图形用户界面 (Graphical User Interface, GUI)的表现形式呈现在用户面前并供其使用。典型的 Windows 应用程序应具有一个主窗口、一个菜单栏、一个工具栏，当然，或许还会有一些其他类型的控件。
图A.2 所示的是一些常见的 GUI 元素。对于 Direct3D 游戏编程来说，我们往往用不到过于复杂的 GUI。事实上，在大多数情况下仅需一个主窗口即可，我们只是用它的工作区来渲染 3D 场景而已。
![[Pasted image 20230403220407.png]]
## Unicode
Unicode 标准以 16 位值来表示一个字符。这样一来，我们就能通过它庞大的字符集来表示国际字符以及一些其他的符号。

C++语言中以 `wchar_t` 类型的宽字符 (wide-character)来表示 Unicode 码。不论是在 32 位还是 64 位的 Windows 操作系统中，`wchar_t` 都是 16 位的字符类型。

**在使用宽字符时，我们必须为字符串字面值（string literal)冠以大写字母前缀 L, 例如：**
```c++ nums
const wchar_t* wcstrptr = L"Hello,World!";
```

前缀 **L** 会令编译器将字符串字面值作为宽字符串进行处理（即把 `char` 替换为 `wchar_t`)。

**还有一个需要重视的问题是，我们在处理宽字符时还需使用相应版本的字符串函数：**
1. 在获取宽字符串的长度时，应使用 `wcslen` 函数而非 `strlen` 函数；
2. 在复制宽字符串时，应以 `wcscpy` 函数代替 `strcpy`。
3. 在比较两个宽字符串时，该使用 `wcscmp` 函数而不是函数 `strcmp`。

这些宽字符版本的函数使用的也并不是 char 类型的指针，而是 `wchar_t` 类型的指针。不仅如此，C++标准库还专门提供了宽字符版本的字符串类 `std:: wstring` 中。Windows 头文件 `WinNT. H` 中亦有如下定义：
```c++ nums
typedef wchar_t WCHAR;//wc,I6位的UNICODE字符
```

# 1 基本的 Windows 应用程序
## 头文件、全局变量、函数声明
```c++
// 头文件
#include <windows.h>
```


```c++
// HWND类型的全局变量，它表示"某个窗口的句柄"
HWND ghMainWnd = 0;
```
**在 Windows 编程中，我们通常采用 Windows 系统在内部为每个对象维护的句柄来处理相应的对象。**
在这个示例中，我们使用的就是 Windows 系统为应用程序主窗口维护的 HWND 句柄。保留该窗口句柄的原因是，有许多 API 需要针对特定窗口进行处理，因此参数中也就少不了窗口句柄的身影，它们会据此对相应的窗口执行函数的功能。
例如，在调用 `Updatewindow` 时就需要传入 HWND 类型的参数，该函数会对此句柄所引用的窗口进行更新。如果我们不向 `Updatewindow` 函数传入句柄，它就无法知道要更新的窗口是哪一个。

```c++ nums
// 封装初始化Windows应用程序所需的代码。如果初始化成功，该函数返回true,否则返回false
bool InitWindowsApp(HINSTANCE instanceHandle, int show);

// 封装消息循环代码
int Run();

// 窗口过程会处理窗口所接收到的消息
LRESULT CALLBACK
WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);
```
## WinMain 函数  
Windous 编程中所用的 `WinMain` 函数，它相当于 C++中的 `main` 函数：  

```c++
int WINAPI 
WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR pCmdLine, int nCmdShow);
``` 

- `hInstance`：当前应用程序的实例句柄。这是一种识别与引用当前应用程序的方式。前面曾提到多个 Windows 应用程序并发运行的情况，此时，通过句柄就可以便捷地引用所需的应用程序。
- `hPrevInstance`： Win32 编程用不到此参数，将其值设为 0。
- `pCmdLine`：运行此程序所用的命令行参数字符串。
- `NCmdShow`：此参数指定了应用程序该如何显示。显示窗口的常用命令：
	- `SW_SHOW`： 按窗口当前的大小与位置显示出来 
	- `SW_SHOWMAXIMIZED`： 窗口最大化
	- `SW SHOWMINIMIZED`：最小化指定的窗口，并且激活在系统表中的顶层窗口
	- `SW_HIDE`：隐藏窗口并激活另一个窗口

	 对于窗口显示命令的完整列表：
|Value | 含义                                                         |
| :------------------------------------- | :----------------------------------------------------------- |
|**SW_HIDE** 0 |隐藏窗口并激活另一个窗口。|
| **SW_SHOWNORMAL** **SW_NORMAL** 1      |激活并显示窗口。如果窗口最小化或最大化，系统会将其还原到其原始大小和位置。首次显示窗口时，应用程序应指定此标志。|
| **SW_SHOWMINIMIZED** 2                 |激活窗口并将其显示为最小化窗口。|
|**SW_SHOWMAXIMIZED** **SW_MAXIMIZE** 3|激活窗口并显示最大化的窗口。|
| **SW_SHOWNOACTIVATE** 4                | 在其最近的大小和位置显示一个窗口。此值类似于 **SW_SHOWNORMAL**，但窗口未激活。 |
| **SW_SHOW** 5                          | 激活窗口并以当前大小和位置显示窗口。                         |
| **SW_MINIMIZE** 6                      | 最小化指定的窗口，并按 Z 顺序激活下一个顶级窗口。            |
| **SW_SHOWMINNOACTIVE** 7               | 将窗口显示为最小化窗口。此值类似于 **SW_SHOWMINIMIZED**，但窗口未激活。 |
| **SW_SHOWNA** 8                        | 以当前大小和位置显示窗口。此值类似于 **SW_SHOW**，但窗口未激活。 |
| **SW_RESTORE** 9                       | 激活并显示窗口。如果窗口最小化或最大化，系统会将其还原到其原始大小和位置。还原最小化窗口时，应用程序应指定此标志。 |
| **SW_SHOWDEFAULT** 10                  | 根据启动应用程序的程序传递给 [CreateProcess](https://learn.microsoft.com/zh-cn/windows/desktop/api/processthreadsapi/nf-processthreadsapi-createprocessa) 函数的 [STARTUPINFO](https://learn.microsoft.com/zh-cn/windows/desktop/api/processthreadsapi/ns-processthreadsapi-startupinfoa) 结构中指定的 **SW_**值设置显示状态。 |
| **SW_FORCEMINIMIZE** 11                | 即使拥有窗口的线程未响应，也会最小化窗口。仅当将窗口从不同的线程最小化时，才应使用此标志。 |

如果 `WinMain` 函数成功运行，那么在其终止时，它应当返回 `WM_QUIT` 消息的 `wParam` 成员（即退出值)。如果函数在退出时还未进入消息循环，那么它应该返回 0。WINAPI 标识符的定义为：
```c++ 
#define WINAPI _stdcall
```
它指明了函数的调用约定，关乎函数参数的入栈顺序等。
## WNDCLASS 结构体与实例注册  
WinMain 中我们调用了 `InitWindowsApp()` 函数，用以创建和初始化应用程序的主窗口，将应用程序实例的副本以及窗口的显示命令变量传入：
```c++
//WinMain函数中：
	if (InitWindowsApp(hInstance, nCmdShow))
		return 0;

//InitWindowsApp定义如下：
//如果初始化成功，返回 true ，否则返回 false。  
bool InitWindowsApp(HINSTANCE instanceHandle, int show) 
{......}
``` 

初始化窗口的第一步就是通过填写 WNDCLASS（window class 窗口类）结构体来描述窗口的基本属性。
定义如下：
```c++
typedef struct _WNDCLASS {
  UINT      style;  //指定了窗口类的样式
  WNDPROC   lpfnWndProc;  //指向与此 WNDCLASS 实例相关联的窗口过程函数的指针
  int       cbClsExtra;  //为当前应用分配额外的内存空间
  int       cbWndExtra;  //为当前应用分配额外的内存空间
  HINSTANCE hInstance;  //当前应用实例的句柄
  HICON     hIcon;  //以此窗口类创建的窗口指定一个图标的句柄
  HCURSOR   hCursor;  //指定在光标略过窗口工作区时所呈现的样式的句柄
  HBRUSH    hbrBackground;  //指定了窗口工作区的背景颜色
  LPCSTR    lpszMenuName;  //指定窗口的菜单
  LPCSTR    lpszClassName;  //指定所创窗口类结构体的名字
} WNDCLASS;

``` 

**`style`：指定了窗口类的样式。** 
```c++
// 使用的是 CS_HREDRAW 与 CS_VREDRAW 两种样式的组合。这两种位标志表示当工作区的宽度或高度发生改变时就重绘窗口。示例中对于各种样式的完整描述可参考 MSDN 库。
wc.Style = CS_HREDRAW | CS_VREDRAW;
```

**`lpfnWndProc`：指向与此 WNDCLASS 实例相关联的窗口过程函数的指针。** 基于此 WNDCLASS 实例创建的窗口都会用到这个窗口过程。这就是说，**若要创建两个采用同一窗口过程的窗口，仅需基于同一个 WNDCLASS 实例即可。如果希望以不同的窗口过程创建两个窗口，则需要为每个窗口都填写一个不同 NDCLASS 实例**。
```c++
wc.lpfnWndProc = WndProc;
```

**`cbClsExtra` 与 `cbWndExtra`：我们可以根据需求，借助这两个字段来为当前应用分配额外的内存空间。** 我们现在编写的程序不需要这额外的空间，因此将它们统统设置为 0。
```c++
wc.cbClsExtra = 0;
wc.cbWndExtra = 0;
```

**`hInstance`：该字段是当前应用实例的句柄。** 前面曾提到，应用程序实例的句柄最早是通过 WinMain 函数传进来的。
```c++
wc.hInstance = instanceHandle;
```

**`hIcon`：我们可以通过这个参数为以此窗口类创建的窗口指定一个图标的句柄。** 当然，我们可以使用自己设计的图标，但系统中也有一些内置的图标供我们选择，具体细节可参见 MSDN 库。
```c++
// 采用默认的应用程序图标：
wc.hIcon = LoadIcon(0, IDI_APPLICATION);
```

**`hCursor`：与 `hIcon` 相类似，我们可以借此指定在光标略过窗口工作区时所呈现的样式的句柄。** 同样，系统内置的光标资源也不少，详见 MSDN 库。
```c++
// 采用标准的“箭头”光标。
wc.hCursor = LoadCursor(0, IDC_ARROW);
```

**`hbrBackground`：该字段用来指出画刷 (brush)的句柄，以此指定了窗口工作区的背景颜色。** 其他内置的画刷类型，可参考 MSDN 库。
```c++
// 调用 Win32 函数 GetStockObject 返回了一个内置的白色画刷句柄。
wc.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH);
```
**`lpszMenuName`：指定窗口的菜单。** 由于应用程序中没有菜单，所以将它设为 0。

**`lpszClassName`：指定所创窗口类结构体的名字。** 有了这个名字，我们就可以在后续需要此窗口类结构体的时候方便地引用它。
```c++
// 这个我们可以随意填写，
wc.lpszClassName = L"BasicWndClass";
```


填写好一个 WNDCLASS 实例之后，为了使我们能够基于它来创建窗口还需要将它注册到 Windows 系统。通过 `RegisterClass` 函数就可实现这一点，它以指向欲注册的WNDCLASS 结构体的指针作为参数，若注册失败则返回 0。
```c++ nums
bool InitWindowsApp(HINSTANCE instanceHandle, int show)
{
	// 第一项任务便是通过填写WNDCLASS结构体，并根据其中描述的特征来创建一个窗口
	WNDCLASS wc;

	wc.style = CS_HREDRAW | CS_VREDRAW;
	wc.lpfnWndProc = WndProc;
	wc.cbClsExtra = 0;
	wc.cbWndExtra = 0; 
	wc.hInstance = instanceHandle; 
	wc.hIcon = LoadIcon(0, IDI_APPLICATION);
	wc.hCursor = LoadCursor(0, IDC_ARROW);
	wc.hbrBackground = (HBRUSH)GetStockObject(WHITE_BRUSH);
	wc.lpszMenuName = 0;
	wc.lpszClassName = L"BasicWndClass";


	// 下一步，我们要在Windows系统中为上述WNDCLASS注册一个实例，这样一来，即可据此创建窗口
	if (!RegisterClass(&wc))
	{
		MessageBox(0, L"RegisterClass FAILED", 0, 0);
		return false;
	}
	......
```
## 创建并显示窗口  

在将一个 WNDCLASS 实例注册给 Windows 系统之后，我们就可以根据这个窗口类的描述来创建窗口了。通过我们赋予已注册 WNDCLASS 实例的名称 `lpszClassName` 便能对它进行引用。我们现在利用 `Createwindow` 函数来创建窗口，下面是它的详细描述。

```c++ nums
HWND CreateWindow(
	LPCTSTR lpClassName,
	LPCTSTR lpWindowName,
	DWORD dwStyle,
	int x,
	int y,
	int nWidth,
	int nHeight,
	HWND hWndParent,
	HMENU hMenu,
	HANDLE hInstance,
	LPVOID lpParam
);
``` 
- `pClassName`: 存有我们欲创建窗口的属性的已注册 WNDCLASS 结构体的名。
- `lpwindowName`: 我们给窗口起的名称，它也将显示在窗口的标题栏中。
- `dwStyle`: 定义窗口的样式。`WS_OVERLAPPEDWINDOW` 是由 `WS_OVERLAPPED` (创建重叠窗口，一般具有标题栏和边框)、`WS_CAPTION` (具有一个标题栏的窗口)、`WS_SYSMENU` (标题栏中拥有系统菜单的窗口)、`WS_THICKFRAME` (使窗口具有可调整大小的边框)、`WS_MINIMIZEBOX` (具有最小化按钮的窗口)与 `WS_MAXIMIZEBOX` (具有最大化按钮的窗口)六种标志组合而成的，从字面上就能看出它们所描述的窗口特征。窗口样式的完整列表可参见 MSDN 库。
- `x`: 窗口左上角的初始位置在于屏幕坐标系中的 x 坐标。我们可以将此参数指定为 `CW_USEDEFAULT`, 使 Windows 系统自动选择一个适当的默认值。
- `y`：窗口左上角的初始位置在于屏幕坐标系中的 y 坐标。我们可以将此参数指定为 `CW_USEDEFAULT`, 使 Windows 系统自动选择一个适当的默认值。
- `nWidth`: 以像素为单位表示的窗口宽度。我们可以将其指定为 `CW_USEDEFAULT`, Windowsx 会自动选择适当的默认值。
- `nHeight`: 以像素为单位表示的窗口高度。我们可以将其指定为 `CW_USEDEFAULT`, Windows 会自动选择恰当的默认值。
- `hWndParent`: 所建窗口的父窗口句柄。由于我们创建的窗口不具有父窗口，因此将它设置为 0。
- `hMenu`: 菜单句柄。由于我们的程序无需菜单，因此将它设置为 0。
- `hInstance`: 与此窗口相关联的应用程序句柄。
- `lpParam`: 一个指向用户定义数据的指针，可用作 `WM_CREATE` 消息的 `lpParam` 参数。在 `Createwindow` 函数返回之前，会向待创建的窗口发送 `WM_CREATE` 消息。若要在窗口新建时执行某些操作（如初始化工作），则会处理 `WM_CREATE` 消息，而 `lpParam` 参数可传送处理过程中所用的数据。

> [!NOTE] 注意
> 我们指定的 (x, y)坐标即窗口（左上角)相对于屏幕坐标系左上角（原，点）的位置。在屏幕坐标系中，x 轴的正方向依旧是水平向右的方向，而 y 轴的正方向则是垂直向下的方向。图 A4 展示的正是这种坐标系，这被称为屏幕坐标系或屏幕空间。
> ![[Pasted image 20230404100059.png]]

`Createwindow` 函数返回的是它所创建窗口的句柄（类型为 HWND)。如果窗口创建失败，则句柄的值为 0（空句柄）。我们前面讲过，句柄是一种引用窗口的方式，它归于 Windows 系统管理。许多 API 的调用需要传入 HWND, 这样才能使函数找准要处理的窗口。
```c++ nums
ghMainWnd = 
		CreateWindow(
		L"BasicWndClass",	// 创建此窗口采用的是前面注册的WNDCLASS实例
		L"Win32 Basic",	// 窗口标题
		WS_OVERLAPPEDWINDOW, // 窗口的样式标志
		CW_USEDEFAULT,	// X坐标
		CW_USEDEFAULT,	// y坐标
		CW_USEDEFAULT,	// 窗口宽度
		CW_USEDEFAULT,	// 窗口高度
		0,	// 父窗口
		0,	// 菜单句柄
		instanceHandle,	// 应用程序实例句柄
		0);	// 可在此设置一些创建窗口所用的其他参数

	if (ghMainWnd == 0)
	{
		MessageBox(0, L"CreateWindow FAILED", 0, 0);
		return false;
	}
```

最后要介绍的是在 InitwindowsApp 函数中，为显示窗口而必须调用的两种函数。这首先调用的是 `ShowWindow` 函数，我们向它传递新建窗口的句柄，使它知道要显示的窗口是哪一个。除此之外，还要给它传入一个定义着窗口初次显示模式（例如最小化、最大化等）的整数值，这个值应当是 `WinMain` 函数的参数之一，即 `nCmdShow`。展示了窗口之后，我们还应对它刷新，执行 `UpdateWindow` 函数的目的就在于此；该函数的参数是欲更新窗口的句柄。

```c++
//尽管窗口已经创建完毕，但仍没有显示出来。因此，最后一步便是调用下面的两个函数，将刚刚创建的窗口展示出来并对它进行更新。可以看出，我们为这两个函数都传入了窗口句柄，这样一来，它们就知道需要展示以及更新的窗口是哪一个
	ShowWindow(ghMainWnd, show);
	UpdateWindow(ghMainWnd);
```

初始化工作到这里就完成了！返回 true 表示初始化成功
## 消息循环  
待初始化工作都完成之后，我们就可以开始着手程序的核心一消息循环。在我们所编写的基本 Windows 应用程序之中，消息循环被封装在一个名为 `Run` 的函数内。
```c++ nums
int Run()
{
	MSG msg = {0};

	//在获取M QUIT消息之前，该函数会一直保持循环。GetMessage函数只有在收到WM QUIT消息时才会返回0（fa1se),这会造成循环终止；而若发生错误，它便会返回-1。还需注意的一点是，在未有信息到来之时，GetMessage函数会令此应用程序线程进入休眠状态
	BOOL bRet = 1;
	while ((bRet = GetMessage(&msg, 0, 0, 0)) != 0)
	{
		if (bRet == -1)
		{
			MessageBox(0, L"GetMessage FAILED", L"Error", MB_OK);
			break;
		}
		else
		{
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}
	}
	
	return (int)msg.wParam;
}
```

`Run` 函数要做的第一件事就是为表示 Windows 消息的 MSG 类型创建一个名为 msg 的变量实例。该结构体的定义如下。

```c++ nums
typedef struct tagMSG {
	HWND hwnd;
	UINT message;
	WPARAM wParam;
	LPARAM lParam;
	DWORD time;
	POINT pt;
} MSG;
``` 
`hwnd`: 接收此消息的窗口过程所属窗口的句柄。
`message`: 用来识别消息的预定义常量值（如 `VM_QUIT`)。
`wParam`: 与此消息相关的额外信息，具体意义取决于特定的消息。
`lParam`: 与此消息相关的额外信息，具体意义取决于特定的消息。
`time`: 消息被发出的时间。
`Pt`：消息发出时，鼠标指针位于屏幕坐标系中的坐标 (x, y)

接下来，程序进入到消息循环部分。`GetMessage` 函数会从消息队列中检索消息，并根据截获的消息细节填写 msg 的参数。由于我们不对消息进行过滤，因此将 `GetMessage` 函数的剩余参数均设为0。
如果 `GetMessage` 函数发生错误，它将返回-1。若接收到 `M_QUIT` 消，息，`GetMessage` 函数将返回0，继而终止当前的消息循环。
如果 `GetMessage` 函数返回其他值，那么将继续执行下面的 `TranslateMessage` 与 `DispatchMessage` 两个函数。
- `TranslateMessage` 函数实现了键盘按键的转换，特别是将虚拟键消息转换为字符消息；
- `DispatchMessage` 函数则会把消息分派给相应的窗口过程。

如果应用程序根据 `WM_QUIT` 消息顺利退出，则 `WinMain` 函数将返回 `M_QUIT` 消息的参数 `wParam` (即退出代码)。

### 更灵活的消息循环
对于办公软件或网络浏览器等传统应用程序而言，游戏软件与之差别较大。一般来讲，**游戏程序采用的并非是坐等消息的模式，而是要时时进行更新。** 这便暴露出了一个问题，如果普通程序的消息队列中没有消息，那么函数 `GetMessage` 将使线程进入休眠状态并等待消息的到来。**在游戏程序中，如果没有要处理的 Windows 消息就应执行游戏的逻辑代码。** 
解决方法是以 `PeekMessage` 函数替代 `GetMessage` 函数。如果消息队列中并无消息，则 `PeekMessage` 函数将立即返回。这样一来，代码中的新式消息循环将变为：
```c++ nums
int Run()
{
	MSG msg = { 0 };
	
	while (msg.message != WM_QUIT)
	{
		//如果消息队列中有窗口消息则进行处理
		if (PeekMessage(&msg, 0, 0, 0, PM_REMOVE))
		{
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}
		//否则执行动画或游戏逻辑部分的代码
		else
		{
			gameplay();
		}
	}
return (int)msg.wParam;
}
```
实例化 msg 变量之后，我们将进入一个无限循环。在这里，首先要调用 API 函数 `PeekMessage`来检测消息队列，其参数的描述可参考 MSDN 库。若有消息，则返回 true 并对该消息进行处理。若没有消息，则 `PeekMessage` 函数返回 false, 然后执行我们编写的游戏逻辑代码。
## 窗口过程  
前文曾提到，我们在窗口过程中编写的代码是针对窗口接收到的消息而进行相应的处理。在本章这个基本的 Windows 应用程序之中，我们将窗口过程函数命名为 `WndProc`, 代码如下：
```c++
LRESULT CALLBACK
WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	// 处理一些特定的消息。注意，在处理完一个消息之后，我们应当返回0
	switch (msg)
	{
		// 在按下鼠标左键后，弹出一个消息框
	case WM_LBUTTONDOWN:
		MessageBox(0, L"Hello,World", L"Hello", MB_OK);
		return 0;
		//在按下Esc键后，销毁应用程序的主窗口
	case WM_KEYDOWN:
		if (wParam == VK_ESCAPE)
			DestroyWindow(ghMainWnd);
		return 0;

		//处理销毁消息的方法是发送退出消息，这样一来便会终止消息循环
	case WM_DESTROY:
		PostQuitMessage(0);
		return 0;
	}

	//将上面没有处理的消息转发给默认的窗口过程。注意，我们自己所编写的窗口过程一定要返回DefWindowProc函数的返回值
	return DefWindowProc(hWnd, msg, wParam, lParam);
}
```

此函数将返回一个 `LRESULT` 类型的值（它的定义是一个整数），表示该函数调用是否成功。`CALLBACK` 标识符指明这是一个**回调 (callback)函数**，意味着 Windows 系统会在此程序的代码空间之外调用该函数。就像我们在这个程序的源代码中所看到的, 我们从没有主动显式地调用过这个窗口过程, 这是因为 Windows 系统会在需要处理消息的时候自动为我们调用此窗口过程。  

**窗口过程的函数签名共有 4 个参数：**  
- `hWnd`: 接收此消息的窗口的句柄。
- `msg`: 标识特定消息的预定值。例如，窗口的退出消息被定义为 `M_QUIT`。前缀 WM 表示“窗口消息”(Window Message)。预定义的窗口消息有上百种，具体可参考 MSDN 库。
- `wParam`: 与具体消息相关的额外信息。
- `1 Param`: 与具体消息相关的额外信息。

**我们编写的窗口过程会处理 3 种消息**，分别是 `WM_LBUTTONDOWN`、`WM_KEYDOWN` 与 `WM_DESTROY`。
- 当用户在窗口的工作区点击鼠标左键时，便会发送一次 `WM_LBUTTONDOWN` 消息。
- 当有非键盘键被按下时，就会向具有当前焦点的窗口发送 `WM_KEYDOWN` 消息。
- 当窗口被销毁时，便会发送 `WM_DESTROY` 消息。

我们编写的处理代码也相当简单，当接收到 `WM_LBUTTONDOWN` 消息时就弹出一个打印着“Hello,World”字样的消息框：
```c++ nums
// 在按下鼠标左键后，弹出一个消息框
	case WM_LBUTTONDOWN:
		MessageBox(0, L"Hello,World", L"Hello", MB_OK);
		return 0;
```

当窗口收到 `WM_KEYDOWN` 消息时，我们就先检测用户按下的是否为 Esc 键。若果真如此，则通过 `DestroyWindow` 函数销毁应用程序主窗口。此时，传入窗口过程的 `wParam` 参数即为用户按下的特定键的**虚拟键代码**（virtual key code), 我们可以认为它是特定键的标识符。
Windows 头文件含有一系列用于确定按键的虚拟键代码。例如，通过检测虚拟键代码常量 `VK_ESCAPE`, 便可知晓用户按下的是否为 Esc 键。
```c++ nums
// 在按下Esc键后，销毁应用程序的主窗口
case WM_KEYDOWN:
		if (wParam == VK_ESCAPE)
			DestroyWindow(ghMainWnd);
		return 0;
```

上文曾提到，参数 `wParam` 与 `lParam` 都被用于指定特定消息的额外信息。对于 `WM_ KEYDOWN` 消息来讲，`wParam` 参数指示的是用户按下的虚拟键代码。MSDN 库为每一种 Windows 消息都罗列出了对应的 `wParam` 与 `lParam` 参数信息。
当窗口被销毁时，我们会以 `PostQuitMessage` 函数（该函数会终止消息循环)发出 `VM_ QUIT` 消息。
```c++ nums
	// 处理销毁消息的方法是发送退出消息，这样一来便会终止消息循环
	case WM_DESTROY:
		PostQuitMessage(0);
		return 0;
	}
```

在窗口过程的结尾，我们会调用另一个名为 `DefWindowProc` 的函数，这个函数是默认的窗口过程。在本章的基本 Windows 应用程序之中，**我们编写的窗口过程仅能处理 3 种消息，而窗口接收到的其他消息则都要交给 `DefWindowProc` 函数，由其中定义的默认方法来进行处理。** 比如说，该程序的窗口可能需要执行最小化、最大化、调整大小或关闭等操作，由于我们并不希望自行处理这些消息，所以这些功能就要交由默认的窗口过程来实现。
```c++ nums
//将上面没有处理的消息转发给默认的窗口过程。注意，我们自己所编写的窗口过程一定要返回DefWindowProc函数的返回值
	return DefWindowProc(hWnd, msg, wParam, lParam);
```
## 消息框函数  
 `MessageBox` 函数。在向用户展示信息以及为程序快速地获取输入这两方面，它为我们提供了一种极其捷便的途径。
 
 消息框函数的声明如下：
```c++
int MessageBox{
	HWND hWnd, // 该消息框所属窗口的句柄，可以指定为NULL
	LPCTSTR lpText, // 消息框中显示的文字
	LPCTSTR lpCaption, // 消息框种的标题文本
	UINT uType// 消息框的样式
};

``` 

`MessageBox` 函数的返回值依赖于所用消息框的具体类型。对于可能的返回值与消息框样式，可参考 MSDN 库。图 zhong所示的是一种带有“Yes”和“No”选项的消息框。
![[Pasted image 20230404103143.png]]

# 2 总结
1. 为了使用 Direct:3D, 我们必须创建具有一个主窗口的 Windows 应用程序，以此来渲染 3D 场景。而且，对于游戏类程序而言，应创建一种用于检测消息的特殊消息循环。如果有消息则对它们进行处理，否则就执行游戏逻辑。
2. 多个 Windows 应用程序可以同时运行，因此 Windows 操作系统必须管理这些程序所需资源，并将消息传递到相应的目标程序。当一个应用程序发生事件（键盘按键、点击鼠标、计时器等)时，就会有对应的消息发送至该应用程序的消息队列之中。
3. 每个 Windows 应用程序都有一个消息队列，用于存储该程序接收到的消息。应用程序的消息循环会不断检测队列中的消息，并将它们分发到相应的目标窗口过程。值得注意是，一款应用程序可能会拥有多个窗口。
4. 窗口过程是一种需要我们自行实现的特殊回调函数，当应用程序中的窗口收到消息，Windows 操作系统便会立即调用它。在窗口过程的内部，我们根据自己的需求为特定消息的处理而编写执行代码。如果我对某些消息没有特别的处理需求，则将它门转发到默认的窗口过程以默认方法进行处理。