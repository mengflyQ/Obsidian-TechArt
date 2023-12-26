
# 废弃！不适合 cuda12 版本
#### Tensorflow-gpu 保姆级安装教程（Win11, Anaconda3，Python3.9）


### 前言

`CPU`版本和`GPU`版本的区别主要在于**运行速度**，`GPU`版本运行速度更快，所以如果电脑显卡支持`cuda`，推荐安装`gpu`版本的。

*   **CPU 版本**，无需额外准备，`CPU`版本一般电脑都可以安装，无需额外准备显卡的内容，（`如果安装CPU版本请参考网上其他教程！`）
    
*   **GPU 版本**，需要提前下载 `cuda` 和 `cuDNN`。（`本文为GPU版本安装教程。`）
    

### Tensorflow-gpu 版本安装的准备工作

**重要的事说三遍：**

**安装前** **一定** 要查看自己电脑的**环境配置**，然后**查询**`Tensorflow-gpu`、`Python`、 `cuda` 、 `cuDNN` 版本关系，要 一 一对应！

**安装前** **一定** 要查看自己电脑的**环境配置**，然后**查询**`Tensorflow-gpu`、`Python`、 `cuda` 、 `cuDNN` 版本关系，要 一 一对应！

**安装前** **一定** 要查看自己电脑的**环境配置**，然后**查询**`Tensorflow-gpu`、`Python`、 `cuda` 、 `cuDNN` 版本关系，要 一 一对应！

[Tensorflow-gpu 与 Python、 cuda、cuDNN 版本关系查询](https://tensorflow.google.cn/install/source_windows?hl=en#gpu)

![[1f8922fc54cc68e49746cbc27082244d_MD5.png]]

我的**安装环境**为：

<table><thead><tr><th>操作系统</th><th>显卡</th><th>Python</th></tr></thead><tbody><tr><td>win11</td><td>NVIDIA GeForce RTX2050</td><td>3.9.13</td></tr></tbody></table>

我的`tensorflow-gpu` **安装版本**为：

<table><thead><tr><th>tensorflow-gpu</th><th>cuda</th><th>cuDNN</th></tr></thead><tbody><tr><td>tensorflow-gpu 2.7.0</td><td>cuda 11.5.2</td><td>cuDNN 8.3.2</td></tr></tbody></table>

**注：** 我这个对应关系是在网上查询别人安装成功的案例，**不要自己随意组合**，不然很容易安装失败，或者就按官网查询的组合安装，安装过程是一样的！

### (一)、查看电脑的显卡：

1）、右键`此电脑`→右键选`管理`→`设备管理器`→`显示适配器`  
主要看独显：`GeForce RTX 2050`

![[a36145a5e8165955d9e1417ca9aa42be_MD5.png]]

可以看到点击出现了`NVIDIA GeForce ...`，即你的电脑**显卡**型号。

*   如果有出现，那就表示可以使用`Tensorflow-gpu`版本，如果没有的就只能老老实实安装 CPU 版咯。
*   然后可以去 NIVIDIA 官网[查询一下自己电脑显卡的算力：https://developer.nvidia.com/cuda-gpus](https://developer.nvidia.com/cuda-gpus)，建议**算力 >=3.5** 安装。

![[1c4f84e11fa7ff8f2b7f9ed3ffff6104_MD5.png]]

我的型号没有查到，NVIDIA 近几年显卡的算力一般是够的。

2）、右键`显卡`→`属性`→`驱动程序`，可以查看显卡的驱动程序：

![[a6e705769ef961ff2260b2c18b71a2ea_MD5.png]]

3）、查看 GPU 驱动版本，也就是我们 “CUDA Version”，Windows 11 版本中一般是 12.0 版本，键盘上同时按`win` +`r`，输入`cmd`，打开命令窗口，在命令窗口输入：

```
nvidia-smi
```

![[7ad0e3e3b648b77abd467be1c1de271b_MD5.png]]

### (二) 、Anaconda 的安装

安装`tensorflow`提前安装好`Anaconda`。这里我也不重点介绍了，我之前也重点详细地写过相关文章:  
[Anaconda 安装 - 超详细版 (2023)](https://blog.csdn.net/weixin_43412762/article/details/129599741)

`Anaconda`安装成功后，进入下面`tensorflow`的安装！

后面`tensorflow`的安装可成**三步：**

1.  `cuda`的安装
2.  `cuDNN`的神经网络加速库安装
3.  配置环境变量

### (三)、cuda 下载和安装

下载`cuda`和`cuDNN`。在官网上下载对应的`cuda`和`cuDNN`，版本可以**低于**上面查到的`CUDA`版本但**不能高于**电脑支持的版本。

*   cuda 下载地址：[CUDA Toolkit Archive | NVIDIA Developer](https://developer.nvidia.com/cuda-toolkit-archive)；
*   cudnn 下载地址：[cuDNN Archive | NVIDIA Developer](https://developer.nvidia.com/rdp/cudnn-archive)。

1)、下载：

我下载的是`CUDA Toolkit 11.5.2`, 点击前面的 `CUDA Toolkit 11.5.2`  

![[38ffdf2c009673fe83a8218f1fa58067_MD5.png]]

选择相应的系统、版本等选项，点击 Download 下载：  

![[a0491b223129fb20221f7f5a402ece0d_MD5.png]]

  
2）、安装

a、 双击安装包，此时会出现一个提示框，让你选择**临时解压位置**（该位置的内容在你安装完 cuda 之后会自动删除），这里**默认即可**，点击 ok。

![[5f4b93f14255cdc7707f8ab32bb1b512_MD5.png]]

b、点击同意并继续：

![[442f9edae0eaaf201d3441fb4f2ffe33_MD5.png]]

c、完成上一步后，选择自定义，然后点下一步：

![[245d18966e1bd308360e36c2aac0ba74_MD5.png]]

d、完成上一步，这里 **CUDA 一定要勾选**上，下面的可选可不选，对后续没有影响。

*   在组件 CUDA 一栏中，取消勾选 Visual Studio Integration（因为我们并没有使用 Visual Stduio 环境，即使勾选上了也会安装失败）

![[d1db58bb88d7358c837cc9e9c3d561e5_MD5.png]]

*   在 Driver components 一栏比较 Display Driver 的新版本和当前版本的信息。
    *   若当前版本**高于**新版本，则**取消勾选** Display Driver；
    *   若当前版本**低于**新版本，则保留默认安装信息即可，否则电脑会死机或者卡顿，甚至可能蓝屏。！！！

![[6d5b5d0990c70a8f5c61b43535308a93_MD5.png]]

e、这个安装位置可以自己改。要截图**记录**一下你装到哪里了，后面要用到！我选择了默认安装位置。

![[dc44e4ac5ec7e6625a83a7b63ea08dc0_MD5.png]]

f、正在安装

![[310e5f13e14f428701b7d4c05e181a52_MD5.png]]

g、安装成功！

![[df7cbfd9c7721ce0afbf8bc8ee73c102_MD5.png]]

点击关闭即可！

![[7903a15a286f544036054beeadfb116d_MD5.png]]

**检查环境变量**：

完成安装后，检查一下环境变量是否存在，一般安装完成会自动配置好环境变量，若是没有，则需手动配置，具体过程如下。

1.  打开 **电脑属性**，找到 **高级系统设置**，选择 **环境变量** 打开。
    
2.  查看是否有以下**系统变量**，没有则需要自行添加，对应图片上的名称和值，配置你电脑`CUDA`安装所在的位置。
    

![[852e034e9cbc6e341c342ebc456981d5_MD5.png]]

3.  打开系统变量的 **Path**，查看是否有一下两条内容，若没有则需自行添加，一定要配置对安装的位置。

![[8eb81995b7fdfbdb6cc73c0d91d4414a_MD5.png]]

配置好环境变量后，我们检查下 CUDA 是否安装成功。

4.  打开 cmd，输入以下命令查看 CUDA 是否安装成功（二选一）  
    如果不能显示以下信息，则说明安装失败。

```
nvcc -V
nvcc --version
```

![[025563f95a209e056b1da9ee209a01dc_MD5.png]]

*   还可以查看 CUDA 设置的环境变量。

```
set cuda
```

![[faea849b727fb3fd54c63384dc37cf5e_MD5.png]]

*   我们还可以搜索 CUDA 的安装目录，找到 “nvcc.exe” 文件。

![[630604b6ddb03c22a2384592abad94a3_MD5.png]]

CUDA 的安装就结束了，接下来下载解压 cuDNN 文件。

### (四)、cudnn 下载安装

`CUDA`并不是实现`GPU`的神经网络加速库，如果希望针对的是神经网络进行加速，我们还需要安装`cuDNN`神经网络加速库。

*   `cuDNN`并非是应用程序，而是几个文件包，下载后把它复制到`CUDA` 的目录下即可。  
    下载地址：[cuDNN Archive | NVIDIA Developer](https://developer.nvidia.com/rdp/cudnn-archive)。
    
*   第一次单击下载时，会让你先注册登录，然后再进行下载，注册过程认真填写内容就没问题，此处略过，接下来进入下载环节。
    

1)、下载：

下载对应版本的`cuDNN`。这里选择的是`cuDNN v8.3.2 for CUDA 11.5`。

![[1a96f5d5d1e4d1d3382b946fcfb00767_MD5.png]]

2.  、下载解压好安装包后，我们解压可以看到有四个文件：  
    
    ![[e9da514069c46f5c54d067d93ed39c7a_MD5.png]]
    

3）、教程的这一步要格外注意！

*   要将`cudnn`文件中的对应文件夹下的所有**文件复制** 到对应的**安装目录**中，
*   而 **不是** 把`cudnn`文件中的文件夹复制过去。eg：复制的不是`cudnn`中的`bin`文件夹，而是`bin`文件夹下的**所有文件**。（有重复的文件是正常的，覆盖掉就好！）

![[cd19d52ec4ad80ca1cc46c8dd42306ee_MD5.png]]

1.  打开`cudnn`文件中的`bin`文件夹，将该文件夹中所有的 文件 **复制粘贴** 到`CUDA\v11.5\bin`文件夹中：

![[5733cc1b6946dc079de103fd601015fa_MD5.png]]

2.  打开`cudnn`文件中的`include`文件夹，将该文件夹中所有的 文件 **复制粘贴** 到`CUDA\v11.5\include`文件夹中：

![[f0b9fe52bb36493ff0f72c5512f0f486_MD5.png]]

3.  打开`cudnn`文件中的`lib`文件夹，将该文件夹中所有的 文件 **复制粘贴** 到`CUDA\v11.5\lib\x64`文件夹中：

![[cbe1ff3ea969b21236d68f5cd01a4f8f_MD5.png]]

4.  打开`cudnn`文件中的剩下的文件， **复制粘贴** 到`CUDA\v11.5`文件夹中：

![[b513e611f2f854db3e376f91085bf246_MD5.png]]

  
`cuDNN`其实就是`CUDA`的一个补丁而已，专为深度学习运算进行优化的，然后我们再添加环境变量！继续往下走。

### (五)、配置环境变量

1.  、打开系统变量的`Path`，在系统变量的`path`路径下添加以下路径：（具体要根据自己的安装路径下做调整）

```
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.5\bin
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.5\libnvvp
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.5
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.5\lib\x64
```

添加好后是这样的：

![[dd32855be9500699a4b3854ccff86204_MD5.png]]

2)、配置好环境后，我们需要验证环境变量是否配置成功：

打开`cmd`，进入自己 CUDA 的安装下路径`...\CUDA\v11.5\extras\demo_suite`：, 我是**默认路径**，所以我的是：

```
cd \Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.5\extras\demo_suite
```

然后分别执行以下两个命令：

```
.\bandwidthTest.exe
.\deviceQuery.exe
```

![[07556a7aebcd7b5c8d13c85e6242cf7b_MD5.png]]

  

![[a02c84c3aeb794a2fe0de30cb67fbcd2_MD5.png]]

如果`Result`都为`PASS`的话则配置成功！

3）、都安装好之后，我们可以继续输入`nvidia-smi`查看`CUDA`的信息，然后根据安装版本的信息再去实现其他的库（环境）安装和使用！

```
nvidia-smi
```

![[c2fb76cb8ebe906a18fc246d906d840e_MD5.png]]

如图所示，可以看到驱动的版本是`527.41`；最高支持的`CUDA`版本是`12.0`版本。

### (六)、创建 tensorflow 环境

我这里是使用`Anaconda`（如果选择这一步，就不需要额外下载`python`，以及各种常用工具包，它会打包下载好）

1）、打开`anaconda prompt`

![[63083402502c0883a4076ad2d47f45a0_MD5.png]]

2）、创建`tensorflow`环境，输入命令：`conda create -n tensorflow python=3.9`，表示创建一个名字为`tensorflow`的环境，这个环境用的`python`版本是`3.9`版本的，如果默认创建，会在`C盘`！

[w11 下载 anaconda 在 d 盘，新建的虚拟环境总是在 c 盘怎么解决](https://blog.csdn.net/weixin_48373309/article/details/127830801?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522168006455716800227426932%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=168006455716800227426932&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-1-127830801-null-null.142%5Ev76%5Epc_new_rank,201%5Ev4%5Eadd_ask,239%5Ev2%5Einsert_chatgpt&utm_term=anaconda%E5%88%9B%E5%BB%BA%E8%99%9A%E6%8B%9F%E7%8E%AF%E5%A2%83d%E7%9B%98&spm=1018.2226.3001.4187)

```
conda create -n tensorflow python=3.9
```

![[0c02ed58393130265dc69b848e97c80c_MD5.png]]

3）、创建成功后，输入命令：`conda env list`，可以看到`tensorflow`环境已经创建，星号为当前所在环境（基础环境`base`）。

```
conda env list
```

![[f831784f5f6ee467e0d76335239f9ff6_MD5.png]]

4）、进入环境，输入命令：`activate tensorflow`，就可以进入`tensorflow`环境中

```
conda activate tensorflow
```

![[51f0451bbe6eed57236fff9514d2a55f_MD5.png]]

如果要退出环境，输入:

```
conda deactivate
```

5）、因为我的`conda`环境在 D 盘中，所以将路径改了以下。如果`anaconda`安装的时候是默认路径，这一步不需要。

```
d:
cd \WorkSoftware\Install\Anaconda3\envs\tensorflow\
```

![[5610ea3a37290cee6639ddd5e97b1ece_MD5.png]]

6）、 安装指定版本的`tensorflow-gpu`，，我安装的是`2.7.0`，根据你自己的配套版本安装，输入命令：

```
pip install tensorflow-gpu==2.7.0 -i  https://pypi.mirrors.ustc.edu.cn/simple
```

![[7cad07aebac68d2c5431e11496fef086_MD5.png]]

  
无报错结束应该是装好了。

7）、打开`python`环境，导入`tensorflow`包进行测试 ，查看`tensorflow`的版本信息, 输入命令：

```
import tensorflow as tf
```

*   如果导入包有以下报错（没有报错请忽略！）：

```
(tensorflow) C:\Users\Rmzh>python
Python 3.9.16 | packaged by conda-forge | (main, Feb  1 2023, 21:28:38) [MSC v.1929 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> import tensorflow as tf
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\__init__.py", line 41, in <module>
    from tensorflow.python.tools import module_util as _module_util
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\python\__init__.py", line 41, in <module>
    from tensorflow.python.eager import context
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\python\eager\context.py", line 33, in <module>
    from tensorflow.core.framework import function_pb2
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\core\framework\function_pb2.py", line 16, in <module>
    from tensorflow.core.framework import attr_value_pb2 as tensorflow_dot_core_dot_framework_dot_attr__value__pb2
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\core\framework\attr_value_pb2.py", line 16, in <module>
    from tensorflow.core.framework import tensor_pb2 as tensorflow_dot_core_dot_framework_dot_tensor__pb2
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\core\framework\tensor_pb2.py", line 16, in <module>
    from tensorflow.core.framework import resource_handle_pb2 as tensorflow_dot_core_dot_framework_dot_resource__handle__pb2
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\core\framework\resource_handle_pb2.py", line 16, in <module>
    from tensorflow.core.framework import tensor_shape_pb2 as tensorflow_dot_core_dot_framework_dot_tensor__shape__pb2
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\tensorflow\core\framework\tensor_shape_pb2.py", line 36, in <module>
    _descriptor.FieldDescriptor(
  File "D:\WorkSoftware\Install\Anaconda3\envs\tensorflow\lib\site-packages\google\protobuf\descriptor.py", line 561, in __new__
    _message.Message._CheckCalledFromGeneratedFile()
TypeError: Descriptors cannot not be created directly.
If this call came from a _pb2.py file, your generated code is out of date and must be regenerated with protoc >= 3.19.0.If you cannot immediately regenerate your protos, some other possible workarounds are:
 1. Downgrade the protobuf package to 3.20.x or lower.
 2. Set PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python (but this will use pure-Python parsing and will be much slower).

More information: https://developers.google.com/protocol-buffers/docs/news/2022-05-06#python-updates
```

*   解决上述报错，输入`exit()`退出`python`环境导入以下包：

```
pip install protobuf==3.19.0 -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn
```

然后重新进入`python` 环境，查看`tensorflow`的版本信息, 输入命令：

```
import tensorflow as tf
tf.__version__
```

![[00229bf65b0a94406a59a380daa1ab70_MD5.png]]

退出`tensorflow`环境：

```
conda deactivate
```

![[944a70bf6a50b83071304f0fcc26c60f_MD5.png]]

  
同时，`conda`控制台是默认打开`base`环境的，如果想管理这一设置

```
conda config --set auto_activate_base false / true
```

### (七)、测试 Tensorflow-gpu 是否安装成功

1.  打开`Anaconda`，选择`tensorflow`环境，打开`spyder`，第一次打开需要安装`Spyder`，直接点下方的`install`即可。

![[3f79e5512f2c1caf6f058dca4a5e2f39_MD5.png]]

2.  输入以下测试代码：

```
import tensorflow as tf

print(tf.__version__)
print(tf.test.gpu_device_name())
print(tf.config.experimental.set_visible_devices)
print('GPU:', tf.config.list_physical_devices('GPU'))
print('CPU:', tf.config.list_physical_devices(device_type='CPU'))
print(tf.config.list_physical_devices('GPU'))
print(tf.test.is_gpu_available())
# 输出可用的GPU数量
print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))
# 查询GPU设备
```

![[898c05c5533c4b887c7e7bea588e1dcf_MD5.png]]

*   出现了当前环境`tensorflow`的版本以及一些其他信息，我的版本是`2.7.0`，
*   如果下面出现了`True`， 那就表明我们的`tensorflow-gpu` 已经成功的安装好并且能够正常使用了！

3.  下面来测试一下`GPU`的运算速度吧！

```
import tensorflow as tf
import timeit
 
#指定在cpu上运行
def cpu_run():
    with tf.device('/cpu:0'):
        cpu_a = tf.random.normal([10000, 1000])
        cpu_b = tf.random.normal([1000, 2000])
        c = tf.matmul(cpu_a, cpu_b)
    return c
 
#指定在gpu上运行 
def gpu_run():
    with tf.device('/gpu:0'):
        gpu_a = tf.random.normal([10000, 1000])
        gpu_b = tf.random.normal([1000, 2000])
        c = tf.matmul(gpu_a, gpu_b)
    return c

cpu_time = timeit.timeit(cpu_run, number=10)
gpu_time = timeit.timeit(gpu_run, number=10)
print("cpu:", cpu_time, "  gpu:", gpu_time)
```

![[fcb8eba97ef20bbd56753e2397fa3deb_MD5.png]]

*   可以看到`gpu`的速度比`cpu`还是要快上不少的!
*   对于机器学习中神经网络模型的训练来说，可以大幅度加快我们的训练进程帮我们节约许多时间，还是十分不错的！

### 卸载重装

如果安装出错可以卸载重装：  
[tensorflow-gpu 卸载](https://blog.csdn.net/weixin_43412762/article/details/129868620)

**注：个人安装过程，仅供学习参考，如有不足，欢迎指正！**