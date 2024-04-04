
## 一、前言

当我们跑[深度学习](https://so.csdn.net/so/search?q=%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0&spm=1001.2101.3001.7020)的代码时，有时会遇到上古的代码，环境比较老，是低版本的 CUDA，此时我们就需要多个 CUDA 版本，并能灵活切换。

本教程是针对已经[安装](https://so.csdn.net/so/search?q=%E5%AE%89%E8%A3%85&spm=1001.2101.3001.7020)一个 CUDA 后的环境，如果首次安装 CUDA 环境，可以查看我主页的[保姆级教程](https://blog.csdn.net/qq_50677040/article/details/132007886?spm=1001.2014.3001.5501)。

本文是在已有 CUDA11.2 的环境下安装 CUDA9.2。

## 二、安装 [CUDA](https://so.csdn.net/so/search?q=CUDA&spm=1001.2101.3001.7020)

### 1. 确定是否支持所需的 CUDA [版本](https://so.csdn.net/so/search?q=%E7%89%88%E6%9C%AC&spm=1001.2101.3001.7020)

1.1 右键 -> NVIDIA 控制面板  
或者直接在任务栏上点击 NVIDIA 控制面板  

![[0816cf96636d5ac85ae0e90ecd881f78_MD5.png]]

  

![[ff9027506b05338beb2d699f1c48cb9d_MD5.png]]

  
1.2 点击左下角系统信息  

![[bac42a0908fb65a68b78f86a27150bd7_MD5.png]]

  
1.3 选择组件，在 3D 设置的 NVCUDA64. dll 中可以看到最高可以支持的 CUDA 的版本，如下图，可以看出我能支持 11.2  

![[1468eb8a20c5b47adff53be234b3f830_MD5.png]]

  
所以在安装新版本的 CUDA 时，一定不能高于该版本，我需要的新环境的 CUDA 版本为 9.2，低于 11.2，可以安装。

### 2. 下载 CUDA

[CUDA 官方下载地址](https://developer.nvidia.com/cuda-downloads)

2.1 找到对应版本  

![[d642f3ae8c3804edf3cb7b6d3b2662f7_MD5.png]]

  

![[092553234244b11c65330949c1d806f4_MD5.png]]

  
2.2 下载完整文件  
WIndows -> x86_64 -> 10 -> exe (local)  
其中 exe (local) 是完整的安装文件，可以离线安装  
exe (network) 是在线安装

![[fa2e7d2cd18941ca2480fbe277a4489c_MD5.png]]

  
2.3 选择 Base Installer 下载  

![[636fd8fb7d060082a060333796f58a31_MD5.png]]

### 3. 安装 CUDA

3.1 双击 .exe 文件  
更改 CUDA 安装时缓存位置（默认为 C 盘，不更改也可以，但得与原先安装的 CUDA 的安装缓存位置不同，或者该位置为空）  

![[5041866210f6d8b452ecd0ba9f4a609c_MD5.png]]

  
耐心等待一会  

![[730f0ab12ad843e5a0dd8f5d776dab34_MD5.png]]

  
3.2 同意软件许可协议并继续  

![[f7cbd5b06df377cfb217db8b9c861a78_MD5.png]]

  
3.3 选择自定义安装  

![[695fbf4869be9d782caa6edc97e26cfe_MD5.png]]

  
3.4 勾选驱动程序组件  
由于之前已经安装过 CUDA，此时我们只需要选择 **CUDA** 即可  

![[fbe38c60d4f523dea2e8c4bcdfda981e_MD5.png]]

  
3.5 选择安装位置  
默认安装位置为 C 盘，可以自由选择安装到其他盘，但需要记住安装位置，后期会使用到  

![[d2588d0e7af16e1077964f376dce9c28_MD5.png]]

  
3.6 选择 I understand，并继续  

![[9d75a0da624b31fcab42c72c576d41a7_MD5.png]]

  
3.7 安装结束  

![[3fcc4dba268291ef4c6b03a7e25af22c_MD5.png]]

  

![[a98e00a2a3afbd9d3c6f32552173b5dc_MD5.png]]

### 4. 环境变量

安装 CUDA 时会自动配置环境变量，但如果没有自动配置，则需要手动配置

4.1 首先打开环境变量  
右键此电脑 -> 属性 -> 高级系统设置 -> 环境变量  

![[311cf052fce0af463b20e94d4992c0e7_MD5.png]]

  

![[574c507bdd31c36b44e72af4e39fadce_MD5.png]]

  

![[5c7c8d613876b6563f7e761c007bbe2c_MD5.png]]

4.2 检查环境变量  
可以看到在系统变量中多了 CUDA_PATH_V9_2 和 NVCUDASAMPLES9_2_ROOT 两个环境变量。如下图：

![[b8455820241c6b4c7c33b5b60e14cf2a_MD5.png]]

  

![[bd10b7b769b5e4cf71e3cc372593bf07_MD5.png]]

  
系统变量中的 CUDA_PATH 和 NVCUDASAMPLES_ROOT 两个环境变量也发生了改变，从原来的 v11.2 变成了原来的 v9.2。如下图：

![[ce449265ee67140b8d08202c953ee024_MD5.png]]

  

![[f06c4c86adad2e94ca068cd48dfb808e_MD5.png]]

在 Path 中多了两个变量  

![[7010c7068d1d5441c76a9cfae2f60e08_MD5.png]]

4.3 创建环境变量  
如果没有上述的环境变量，可以根据情况自己添加

4.3.1 在系统变量中，选择**新建**

**变量名：** CUDA_PATH_V9_2  
**值：** D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v9.2（CUDA Documentation 和 CUDA Development 的路径）

**变量名：** NVCUDASAMPLES9_2_ROOT  
**值：** D:\CUDA Documentation\NVIDIA Corporation\CUDA Samples\v9.2（Samples 的路径）

4.3.2 在系统变量中

选中 **CUDA_PATH** ，点击 **编辑**  
将值修改为 D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v9.2（CUDA Documentation 和 CUDA Development 的路径）

选中 **NVCUDASAMPLES_ROOT** ，点击 **编辑**  
将值修改为 D:\CUDA Documentation\NVIDIA Corporation\CUDA Samples\v9.2（Samples 的路径）

4.3.3 在系统变量的 **Path** 中，选择新建

依次加入以下路径：

**CUDA Documentation 和 CUDA Development 的路径下的 bin 文件夹：**  
D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v9.2\bin

**CUDA Documentation 和 CUDA Development 的路径下的 libnvvp 文件夹：**  
D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v9.2\libnvvp

记得添加完后一路点击确定保存

### 5. 验证安装

Win + R 打开命令行窗口，输入 nvcc -V，输出 CUDA 版本即为安装成功，如下图：

![[57497a334470160be94f122fd726f399_MD5.png]]

  
可以看到 CUDA 的版本已经变为了 9.2

## 三、安装 cudnn

### 1. 下载 cudnn

[cudnn 官方网址](https://developer.nvidia.com/rdp/cudnn-archive)

选择和自己 CUDA 匹配的 cudnn 版本下载  

![[ca88206d70f680faa4a271f073d7aa83_MD5.png]]

![[a5ced5a1ef34154b095338b55a6dd9ec_MD5.png]]

### 2. 替换文件

2.1 解压文件  
cudnn 下载后是一个压缩包，解压后有以下四个文件：

![[225473a68e9434b5afe7078605817d72_MD5.png]]

  
2.2 将文件复制到 **D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v9.2（CUDA Documentation 和 CUDA Development 的路径）**  

![[e567c35bbb3b65510478715d54cc1842_MD5.png]]

### 3. 验证 cudnn 是否安装成功

复制完后，在当前目录下进入 **extras -> demo_suite**，可以看到有 **bandwidthTest. exe** 和 **deviceQuery. exe**

![[3b5ff0f69edeeb5bde3bb3f821bd5e58_MD5.png]]

  
并在路径中输入 cmd 打开命令行窗口

![[6983119abead67416b099571948bce38_MD5.png]]

  
3.1 输入 **bandwidthTest. exe** 输出下图：

![[c5dadf0ad1294f16633821ef3482f6d4_MD5.png]]

  
3.2 输入 **deviceQuery. exe**，输出下图：  

![[29bdb9ee072d282fd5ff1fc612d24c9f_MD5.png]]

至此，新版本的 CUDA 与 cudnn 安装成功，可以使用该版本的 CUDA 进行 GPU 加速了

## 四、切换 CUDA 版本

安装完新版本的 CUDA 后，此时运行的环境为新版本的 CUDA，当我们需要切换为其他版本时，仅需要对环境变量进行修改即可

### 1. 切换版本

1.1 在系统变量的 **Path** 中，上移所需要切换的版本

![[17fad126146ca112513bac83ddba9bb8_MD5.png]]

  
将这两行变量置于最上方，并点击确定，如下图：  

![[7c1c6cf100cb40faa9084ce36a5a3446_MD5.png]]

  
1.2 修改 **CUDA_PATH** 的值

选中 **CUDA_PATH** ，点击 **编辑**  
将值修改为 D:\CUDA Documentation\NVIDIA GPU Computing Toolkit\CUDA\v11.2（CUDA Documentation 和 CUDA Development 的路径）  
如下图：  

![[fcbfd9196386922c68ae53faf84dcba9_MD5.png]]

![[09f272b326f88d104ce87df59071844f_MD5.png]]

![[8668fec943925812aaf1a4dbc2323372_MD5.png]]

  
1.3 修改 **NVCUDASAMPLES_ROOT** 的值  
选中 **NVCUDASAMPLES_ROOT** ，点击 **编辑**  
将值修改为 == D:\CUDA Documentation\NVIDIA Corporation\CUDA Samples\11.2（Samples 的路径）==  
如下图：  

![[56882f86b040c62005a2674488acecad_MD5.png]]

![[ec82f85c6b0ff3db3cd284e5bb2236f7_MD5.png]]

![[4dc488e231607279ed191d2b56246d30_MD5.png]]

  
记得添加完后一路点击确定保存！

### 2. 检查版本是否切换成功

Win + R 输入 cmd 打开命令行窗口，输入 nvcc -V

![[8cbb024c7137ffe6f6f77534e092e50c_MD5.png]]

  
可以看出 CUDA 版本又切回到了原来的 11.2