upyter Notebook 确保 IPython 内核可用，但是您必须手动添加具有其他版本的 Python 或虚拟环境的内核。首先，您需要激活虚拟环境。接下来，安装 ipykernel，它为 Jupyter 提供 IPython 内核：

```c++
pip install --user ipykernel
```

接下来，您可以通过输入以下内容将虚拟环境添加到 Jupyter：

```c++
python -m ipykernel install --user --name=mypytorch
```

如果打印

```c++
Installed kernelspec mypytorch in /home/user/.local/share/jupyter/kernels/mypytorch
```

说明已经成功了。