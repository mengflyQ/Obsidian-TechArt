**注：tensorflow-2.10 后 GPU 版本不支持 windows，使用低于等于 2.10 的版本或者用 VM、WSL 的 Linux 版本**

本机安装：cuda11.8.0+cudnn8.6.0+python3.9+tensorflow-gpu-2.10.0

在安装 TensorFlow GPU 版本之前，你需要确保满足以下要求：

1.  适配的 GPU 设备（NVIDIA® GPU）。
2.  安装兼容的 CUDA® 版本。
3.  安装兼容的 cuDNN® 版本。

以下是安装 TensorFlow GPU 的步骤：  
1、安装 CUDA Toolkit：[CUDA Toolkit 下载链接](https://developer.nvidia.com/cuda-toolkit-archive)  
a. 前往 NVIDIA 官网下载适合你的操作系统的 CUDA Toolkit 安装文件。（cuda_11.8.0_522.06_windows）  
b. 执行安装文件并按照提示进行安装。确保将 CUDA 安装路径添加到系统环境变量中。  
2、安装 cuDNN：[Build from source on Windows | TensorFlow](https://tensorflow.google.cn/install/source_windows?hl=en)

![[f75e951bfd502fbd3c62279140370d03_MD5.jpg]]

![[90a943f7e7478400ee9d804de6dba4b5_MD5.jpg]]

  
a. 前往 NVIDIA 开发者网站下载与安装的 CUDA 版本兼容的 cuDNN 版本。[cuDNN 官网地址](https://developer.nvidia.com/rdp/cudnn-archive)

(cudnn-windows-x86_64-8.6.0.163_cuda11-archive)

![[46666a50b815d39308ada83f8f26682a_MD5.jpg]]

  
b. 解压下载的 cuDNN 文件并将其中的文件复制到 CUDA 安装路径对应的文件夹中。  
3、创建虚拟环境（可选）：  
a. 打开命令行工具。  
b. 运行以下命令创建虚拟环境（可选）：

```
conda create -n myenv  # 创建名为 myenv 的虚拟环境
conda activate myenv # 激活虚拟环境
```

4、安装 TensorFlow GPU 版本：  
a. 在虚拟环境中，命令安装 TensorFlow GPU ，但是各种坑

```
#conda install tensorflow-gpu=2.6 #版本略低，且组件包有冲突
#conda install tensorflow=2.12.0 #无法检测已安装的CUDA驱动
#pip install tensorflow==2.12.0 -i https://pypi.tuna.tsinghua.edu.cn/simple/ 
#无法识别GPU，尝试安装tensorflow-directml-plugin
#pip install tensorflow-directml-plugin -i https://pypi.tuna.tsinghua.edu.cn/simple 可识别intel，nvidia不行
```

**Note:**GPU support on native-Windows is only available for 2.10 or earlier versions, starting in TF 2.11, CUDA build is not supported for Windows. For using TensorFlow GPU on Windows, you will need to build/install TensorFlow in WSL2 or use tensorflow-cpu with TensorFlow-DirectML-Plugin

注意：本机 Windows 上的 GPU 支持仅适用于 2.10 或更早版本，从 TF 2.11 开始，Windows 不支持 CUDA 构建。要在 Windows 上使用 TensorFlow GPU，您需要在 WSL 2 中构建 / 安装 TensorFlow，或者将 tensorflow-cpu 与 TensorFlow-DirectML-Plugin 一起使用

最后降低版本，安装 2.10.0

```
pip install tensorflow-gpu==2.10.0 -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

5、验证安装：  
a. 在 Python 交互界面中运行以下代码验证 TensorFlow GPU 版本是否安装成功：

```
import tensorflow as tf
print(tf.__version__)
print(tf.test.is_built_with_cuda())
print(tf.config.list_physical_devices())
```

动态申请使用

```
config = tf.compat.v1.ConfigProto()
config.gpu_options.allow_growth = True
session = tf.compat.v1.InteractiveSession(config=config)
with tf.compat.v1.Session(config=config) as sess:
     model
```

报错：Could not locate zlibwapi. dll. Please make sure it is in your library path

进入 [NVIDIA Installation Guide 官网](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#install-zlib-windows)但没发现下载链接，查到 [zlibwapi_x64.dll : Free .DLL download.](https://www.dllme.com/dll/files/zlibwapi_x64) 最下面可以下载，注意 32 位和 64 位，下载好后将 zlibwapi_x64. dll 放入到 CUDA_PATH\v11.8\bin 下，文件名需要改为 zlibwapi. dll

参考：

[TensorFlow-GPU 和 Keras-GPU 安装，显卡、cuda、cudnn 版本匹配问题（vs code 远程连接服务器）](https://blog.csdn.net/qq_44853023/article/details/130930704)

[tensorflow-gpu, cudnn, cuda 的版本对应关系](https://tensorflow.google.cn/install/source?hl=en)

[老王：Windows10 下成功安装 Tensorflow-GPU 过程（GTX 3060）](https://zhuanlan.zhihu.com/p/430245798?utm_id=0)

[超详细的 CUDA 安装教程_OldWang 学人工智能的博客 - CSDN 博客](https://blog.csdn.net/qq_43497966/article/details/131220381)

[tensorflow-GPU 版本安装，RTX3060_tensorflowgpu 安装_qq_42095950 的博客 - CSDN 博客](https://blog.csdn.net/qq_42095950/article/details/131424678)

[Anaconda 配置 tensorflow-gpu2.6.0 环境，提供几个常用包匹配版本_anaconda 与 tensorflow 相匹配的版本_m0_60804625 的博客 - CSDN 博客](https://blog.csdn.net/m0_60804625/article/details/131788972)

[最精简：windows 环境安装 tensorflow-gpu-2.10.1](https://www.xjx100.cn/news/238151.html?action=onClick)

[tensorflow 使用显卡 gpu 进行训练详细教程_tensorflow 用 gpu 训练_一枚爱吃大蒜的程序员的博客 - CSDN 博客](https://blog.csdn.net/qiqi_ai_/article/details/128950971)

[玺悦：Tensorflow2.x 在多 GPU 上对数据集进行训练具体操作](https://zhuanlan.zhihu.com/p/635067821)