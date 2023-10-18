**anaconda 包管理器和环境管理器，强烈建议食用**

# 1. 下载

官网下载太慢可选用镜像下载

官网下载：

[Anaconda | Individual Edition](https://www.anaconda.com/products/individual)

![[1681482602970.png]]

镜像下载：

[Index of /anaconda/archive/ | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/)

![[1681482603037.png]]

# 2. 安装

傻瓜式安装，一直下一步即可安装完成

![[1681482603076.png]]

![[1681482603163.png]]

可以选择 All users

![[1681482603198.png]]

可自定义路径

![[1681482603232.png]]

不选择添加环境变量

![[1681482603276.png]]

![[1681482603323.png]]

![[1681482603358.png]]

![[1681482603418.png]]

# 3. 配置环境变量

```
D:\Anaconda
D:\Anaconda\Scripts
```

将如上路径添加到系统 path，不会的参考下面步骤

电脑右键选择属性，选择高级系统设置

![[1681482603458.png]]

点击环境变量

![[1681482603495.png]]

选择系统变量 path，点击编辑

![[1681482603560.png]]

点击新建

![[1681482603672.png]]

**提醒以下，环境变量真的不能忘记了**

# 4. 检验

检查是否安装成功

```
conda --version
conda info
```

![[1681482603722.png]]

# 5. 增加国内下载源

[anaconda | 镜像站使用帮助 | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/help/anaconda/)

Anaconda 镜像使用帮助可供了解

用户目录下没有. condarc 文件，先执行 `conda config --set show_channel_urls yes` 生成该文件之后再修改，选择方式二可以不进行此操作

方式一 、修改用户目录下的. condarc 文件

.condarc 文件路径如：`C:\Users\10264\.condarc`，自己的路径对号入座

用如下内容替换. condarc 文件内容
![[Pasted image 20230414231057.png]]


# 6. 查看所有虚拟环境

```
conda env list
```

![[1681482603836.png]]

# 7. 创建虚拟环境

jupyter notebook 是好用的交互式编辑器

cudnn 是用于深度神经网络的 GPU 加速库

这里直接都安装到 noti 虚拟环境中

```
conda create -n noti jupyter notebook
```

noti 是虚拟环境的名字，jupyter notebook 是第三方库

# 8. 切换虚拟环境

```
activate noti
```

切换到名为 noti 的虚拟环境中

![[1681482603907.png]]

# 9. 其他命令

如下命令自行按需索取吧

*   conda list：查看环境中的所有包
*   conda install XXX：安装 XXX 包
*   conda remove XXX：删除 XXX 包
*   conda env list：列出所有环境
*   conda create -n XXX：创建名为 XXX 的环境
*   conda create -n env_name jupyter notebook ：创建虚拟环境
*   activate noti（或 source activate noti）：启用 / 激活环境
*   conda env remove -n noti：删除指定环境
*   deactivate（或 source deactivate）：退出环境
*   jupyter notebook ：打开 Jupyter Notebook
*   conda config --remove-key channels ：换回默认源

最后祝大家都能安装成功


**删除虚拟环境**
假设你的环境名字叫: octopus
```
conda remove -n octopus --all
```


**复制环境**: [[16条消息) 复制Anaconda虚拟环境_conda 复制环境_马大哈先生的博客-CSDN博客](https://blog.csdn.net/qq_37764129/article/details/102496746|(16条消息) 复制Anaconda虚拟环境_conda 复制环境_马大哈先生的博客-CSDN博客]]

# 10 Pytorch

安装 Anaconda：[Index of /anaconda/archive/ | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/?C=M&O=D)
Pytorch 环境创建：
```python nums
conda create -n pytorch Python=3.11.3
```

![[Pasted image 20230414225103.png]]
输入图中的命令行即可