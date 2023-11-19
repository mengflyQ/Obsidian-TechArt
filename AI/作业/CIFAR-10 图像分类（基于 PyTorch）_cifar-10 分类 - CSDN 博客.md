#### 文章目录

*   *   [数据集介绍](#_2)
    *   [图像分类步骤](#_12)
    *   *   [数据加载及预处理](#_22)
        *   [定义网络](#_93)
        *   [定义损失函数和优化器](#_125)
        *   [训练网络](#_132)
        *   *   [在 CPU 训练](#CPU_139)
            *   [在 GPU 训练](#GPU_219)
    *   [References](#References_288)

### 数据集介绍

**CIFAR-10** 是一个常用的**彩色**图片数据集，它有 **10** 个类别: ‘airplane’, ‘automobile’, ‘bird’, ‘cat’, ‘deer’, ‘dog’, ‘frog’, ‘horse’, ‘ship’, ‘truck’。每张图片都是  $3\times32\times32$ ，也即 **3通道（RGB）彩色图片，分辨率为$32\times32$。

该数据集共有 60000 张彩色图像，这些图像是 `32*32`，分为 10 个类，每类 6000 张图。这里面有 **50000 张用于训练**，构成了 5 个训练批，每一批 10000 张图；另外 10000 用于测试，单独构成一批。测试批的数据里，取自 10 类中的每一类，每一类随机取 1000 张。抽剩下的就随机排列组成了训练批。注意一个训练批中的各类图像并不一定数量相同，总的来看训练批，每一类都有 5000 张图。

下图是下载 [CIFAR-10 数据集](http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz)并解压后得到的文件  

![[b0a2c5237823bf773a6f444de5e77958_MD5.jpg]]

  
下图是 **CIFAR-10 数据集**的各个文件的介绍  

![[9b0e97d9c60248c08b02dacd8f53a0e2_MD5.png]]

  
关于数据集的介绍部分，网上有很多的资料，在此不再多说，直接上重点~~

### [图像分类](https://so.csdn.net/so/search?q=%E5%9B%BE%E5%83%8F%E5%88%86%E7%B1%BB&spm=1001.2101.3001.7020)步骤

下面我们来尝试实现对 CIFAR-10 数据集的分类，步骤如下:

1.  使用 torchvision 加载并预处理 CIFAR-10 数据集
2.  定义网络
3.  定义损失函数和优化器
4.  训练网络并更新网络参数
5.  测试网络

#### 数据加载及预处理

注：基本环境要求：python 3.6， [pytorch](https://so.csdn.net/so/search?q=pytorch&spm=1001.2101.3001.7020) 0.4.1（更新的版本应该也可以），[完整代码](https://github.com/chenyuntc/pytorch-book/tree/master/chapter2-%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8)已给出。

```python
import torchvision as tv
import torchvision.transforms as transforms
from torchvision.transforms import ToPILImage
show = ToPILImage() # 可以把Tensor转成Image，方便可视化

# 第一次运行程序torchvision会自动下载CIFAR-10数据集，
# 大约160M，需花费一定的时间，
# 如果已经下载有CIFAR-10，可通过root参数指定

# 定义对数据的预处理
transform = transforms.Compose([
        transforms.ToTensor(), # 转为Tensor
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)), # 归一化 先将输入归一化到(0,1)，再使用公式”(x-mean)/std”，将每个元素分布到(-1,1) 
                             ])                    

# 训练集（因为torchvision中已经封装好了一些常用的数据集，包括CIFAR10、MNIST等，所以此处可以这么写 tv.datasets.CIFAR10()）
trainset = tv.datasets.CIFAR10(
                    root='DataSet/',   # 将下载的数据集压缩包解压到当前目录的DataSet目录下
                    train=True, 
                    download=False,    # 如果之前没手动下载数据集，这里要改为True
                    transform=transform)

trainloader = t.utils.data.DataLoader(
                    trainset, 
                    batch_size=4,
                    shuffle=True, 
                    num_workers=2)

# 测试集
testset = tv.datasets.CIFAR10(
                    'DataSet/',
                    train=False, 
                    download=False,   # 如果之前没手动下载数据集，这里要改为True 
                    transform=transform)

testloader = t.utils.data.DataLoader(
                    testset,
                    batch_size=4, 
                    shuffle=False,
                    num_workers=2)

classes = ('plane', 'car', 'bird', 'cat',
           'deer', 'dog', 'frog', 'horse', 'ship', 'truck')
```

其中，**Dataset 对象**是一个**数据集**，可以按**下标**访问，返回形如 (data, label) 的**元组**数据，如下：

```python
(data, label) = trainset[66]  
data.size()   # 验证某一张图片的维度 —— 3*32*32
print(classes[label]) # label是一个0-9的数字
# (data + 1) / 2是为了还原被归一化的数据 （这部分计算是可以推算出来的）
show((data + 1) / 2).resize((100, 100))
```

上面测试代码的输出为：  

![[fa1415eb34f9aec7447d3d77fe9576d6_MD5.jpg]]

  
定义好 **Dataset** 后，我们还要为每个 Dataset 定义一个 **Dataloader**，Dataloader 是一个**可迭代的对象**，它将 dataset 返回的每一条数据**拼接**成一个 **batch**，并提供**多线程加速优化**和**数据打乱等**操作。当程序对 dataset 的所有数据遍历完一遍之后，相应的对 Dataloader 也完成了一次**迭代**，如下：

```python
dataiter = iter(trainloader)   # trainloader is a DataLoader Object 
images, labels = dataiter.next() # 返回4张图片及标签   images,labels都是Tensor    images.size()= torch.Size([4, 3, 32, 32])     lables = tensor([5, 6, 3, 8])
print(' '.join('%11s'%classes[labels[j]] for j in range(4)))
show(tv.utils.make_grid((images+1)/2)).resize((400,100))
```

上面测试代码的输出为：  

![[484171ca20261c77d8577cd965075e15_MD5.jpg]]

  
上面的两段测试代码（关于 **Dataset** 和 **Dataloader**）只是为了让我们对 pytorch 的**数据加载及预处理**部分先有一个基本的熟悉。

#### 定义网络

这是一个比较简单的**图像分类**任务，直接用比较简单的网络即可得到较好的结果，此处用 **LeNet 网络**来进行图像分类，LeNet 网络的定义如下：  
注：对这部分不太懂的可先参考这篇[博客](https://blog.csdn.net/ft_sunshine/article/details/91388812)

```python
import torch.nn as nn
import torch.nn.functional as F

class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 6, 5) 
        self.conv2 = nn.Conv2d(6, 16, 5)  
        self.fc1   = nn.Linear(16*5*5, 120)  
        self.fc2   = nn.Linear(120, 84)
        self.fc3   = nn.Linear(84, 10)  # 最后是一个十分类，所以最后的一个全连接层的神经元个数为10

    def forward(self, x): 
        x = F.max_pool2d(F.relu(self.conv1(x)), (2, 2)) 
        x = F.max_pool2d(F.relu(self.conv2(x)), 2) 
        x = x.view(x.size()[0], -1)  # 展平  x.size()[0]是batch size
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)        
        return x


net = Net()
print(net)
```

"print(net)" 的输出为：（这就是整个网路的结构）  

![[0c5922f74f3bbf213e89a78540d2f90d_MD5.jpg]]

#### 定义损失函数和优化器

```
from torch import optim
criterion = nn.CrossEntropyLoss() # 交叉熵损失函数
optimizer = optim.SGD(net.parameters(), lr=0.001, momentum=0.9)
```

#### 训练网络

所有网络的训练流程都是类似的，不断地执行如下流程：

*   输入数据
*   前向传播 + 反向传播
*   更新参数

##### 在 CPU 训练

```python
t.set_num_threads(4)
for epoch in range(2):  
    
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):   # i 第几个batch     data：一个batch中的数据
        
        # 输入数据
        inputs, labels = data   # images：batch大小为4     labels：batch大小为4
        
        # 梯度清零
        optimizer.zero_grad()
        
        # forward + backward 
        outputs = net(inputs)
        loss = criterion(outputs, labels)
        loss.backward()   
        
        # 更新参数 
        optimizer.step()
        
        # 打印log信息
        # loss 是一个scalar,需要使用loss.item()来获取数值，不能使用loss[0]
        running_loss += loss.item()
        if i % 2000 == 1999: # 每2000个batch打印一下训练状态
            print('[%d, %5d] loss: %.3f' \
                  % (epoch+1, i+1, running_loss / 2000))
            running_loss = 0.0
print('Finished Training')
```

输出如下：  

![[da194faf8575442d61aa4f9eb368cf9b_MD5.jpg]]

  
此处仅训练了 2 个 epoch（遍历完一遍数据集称为一个 epoch），来看看网络有没有效果。将测试图片输入到网络中，计算它的 label，然后与实际的 label 进行比较。

```
dataiter = iter(testloader)
images, labels = dataiter.next() # 一个batch返回4张图片
print('实际的label: ', ' '.join(\
            '%08s'%classes[labels[j]] for j in range(4)))
# show(tv.utils.make_grid(images / 2 - 0.5)).resize((400,100))
show(tv.utils.make_grid((images+1) / 2 )).resize((400,100))
```

输出如下：  

![[f911eb45692408a9550cef4870a9b83c_MD5.jpg]]

  
接着计算网络预测的 label：

```
images.shape
# 计算图片在每个类别上的分数
outputs = net(images)   # images 4张图片的数据
# 得分最高的那个类
_, predicted = t.max(outputs.data, 1)   # 1是维度参数，返回值为两个，一个为最大值，另一个为最大值的索引

print('预测结果: ', ' '.join('%5s'\
            % classes[predicted[j]] for j in range(4)))
```

输出如下：  

![[001bf8a28a5cfefe8000d237f0e51071_MD5.jpg]]

  
已经可以看出效果，准确率 50%，但这只是一部分的图片，再来看看在整个测试集上的效果。

```
correct = 0 # 预测正确的图片数
total = 0 # 总共的图片数

# 由于测试的时候不需要求导，可以暂时关闭autograd，提高速度，节约内存
with t.no_grad():
    for data in testloader:      # data是个tuple
        images, labels = data    # image和label 都是tensor 
        outputs = net(images)
        _, predicted = t.max(outputs, 1)
        total += labels.size(0)    # labels tensor([3, 8, 8, 0])            labels.size: torch.Size([4])
        correct += (predicted == labels).sum()

print('10000张测试集中的准确率为: %d %%' % (100 * correct / total))
```

输出如下：  

![[58acc4bf4cd73a78170ca80c44b65006_MD5.png]]

  
训练的准确率远比随机猜测 (准确率 10%) 好，证明网络确实学到了东西。

##### 在 GPU 训练

就像把 Tensor 从 CPU 转到 GPU 一样，模型也可以类似地从 CPU 转到 GPU。

```
dataiter = iter(testloader)
images, labels = dataiter.next() # 一个batch返回4张图片

net_gpu = Net()
net_gpu.cuda()
device = t.device("cuda:0" if t.cuda.is_available() else "cpu")
device
images = images.to(device)
labels = labels.to(device)
output = net_gpu(images)
output = output.to(device)
loss= criterion(output,labels)

loss
```

![[b90dd1045bde1e39d087529c1870e2c9_MD5.png]]

```
for epoch in range(2):  
    
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):   # i 第几个batch     data：一个batch中的数据
        
        # 输入数据
        inputs, labels = data   # images：大小为4   labels：大小为4
        
        inputs = inputs.to(device)
        labels = labels.to(device)
        
        # 梯度清零
        optimizer.zero_grad()
        
        # forward + backward 
        outputs = net_gpu(inputs)
        
        outputs = outputs.to(device)
        
        loss = criterion(outputs, labels)
        loss.backward()   
        
        # 更新参数 
        optimizer.step()
        
        # 打印log信息
        # loss 是一个scalar,需要使用loss.item()来获取数值，不能使用loss[0]
        running_loss += loss.item()
        if i % 2000 == 1999: # 每2000个batch打印一下训练状态
            print('[%d, %5d] loss: %.3f' \
                  % (epoch+1, i+1, running_loss / 2000))
            running_loss = 0.0
print('Finished Training')
```

![[f55d80e4d52baf807a534ee4f40a0c49_MD5.png]]

  
如果发现在 GPU 上并没有比 CPU 提速很多，实际上是因为网络比较小，GPU 没有完全发挥自己的真正实力。

对 PyTorch 的基础介绍至此结束。总结一下，本节主要包含以下内容。

1.  Tensor: 类似 Numpy 数组的数据结构，与 Numpy 接口类似，可方便地互相转换。
2.  autograd/: 为 tensor 提供自动求导功能。
3.  nn: 专门为神经网络设计的接口，提供了很多有用的功能 (神经网络层，损失函数，优化器等)。
4.  神经网络训练: 以 CIFAR-10 分类为例演示了神经网络的训练流程，包括数据加载、网络搭建、训练及测试。

通过本文的学习，相信读者可以体会出 PyTorch 具有接口简单、使用灵活等特点。

### References

*   [http://www.cs.toronto.edu/~kriz/cifar.html](http://www.cs.toronto.edu/~kriz/cifar.html)
*   [https://www.cnblogs.com/cloud-ken/p/8456878.html](https://www.cnblogs.com/cloud-ken/p/8456878.html)
*   [https://github.com/chenyuntc/pytorch-book](https://github.com/chenyuntc/pytorch-book)
*   《深度学习框架—PyTorch 入门与实践》——陈云