这是一个入门机器学习和深度学习的小项目，以 fashion-mnist 数据为基础。分别利用机器学习 (随机森林) 和深度学习 (多层感知机 / 卷积神经网络) 方法进行训练。完整的包含**数据读取, 数据处理，训练, 验证，loss 曲线的绘制，训练过程的可视化，模型推理，混淆矩阵的计算, 特征图可视化**等
[DLLXW/Fashion-MNIST](https://github.com/DLLXW/Fashion-MNIST)

### 数据集介绍

Fashion-mnist 可以看作经典 MNIST 数据的加强版，号称计算机视觉领域的 Hello, World，这里暂不作过多介绍。下面是数据集的 github 链接：

[zalandoresearch/fashion-mnist](https://github.com/zalandoresearch/fashion-mnist)

用于训练的图片有 6w 张，用于验证的图片有 1w 张，每一个样本是一张 28x28 像素的图像。总共 10 中服饰类别。所以问题是一个 10 分类的问题

![](https://pic3.zhimg.com/v2-2d62e04481b3e274119d68ae896600f2_r.jpg)

### 训练随机森林模型

首先利用机器学习方法来进行一下该分类任务, 这里选取随机森林.

需要提前安装的库为: sklearn

准备数据:

事实上很多机器学习库都已经集成了该数据集，也就是说可以在代码里面直接导入，但这里推荐自己手动下载下来。到上面的 github 链接页面，找到:

![](https://pic3.zhimg.com/v2-78bf80f891f48d0eb2b94e627d13b506_r.jpg)

下载数据集并且解压到自己的目录下

譬如我的数据格式组织如下：

![](https://pic3.zhimg.com/v2-d2a9b1cc2941c55734191c385e4b1c26_b.jpg)

数据集都解压到了 raw 文件夹。下面是实现用随机森林训练，验证，并且打印多分类混淆矩阵和分类信息的代码。

```c++ python
import os
import numpy as np
from time import time
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.metrics import multilabel_confusion_matrix
'''
该函数是用于处理fashion mnist数据的函数，因为原始是用ubyte格式保存，通过这个函数获得的训练数据形状为
(60000,784),60000行，每一行代表一个图片数据，784列，每一列代表一个像素，因为图片的大小是28x28=784
这也是机器学习方法的惯用套路:数据统一格式：(样本数，每个样本特征数)。这样，每次输入算法的就为一行数据，也就是一个样本。
而输出（也即标签）为(60000,)也就是60000维的列向量，每一个数代表该样本的类型

'''
def load_mnist(path, kind='train'):
    import os
    import gzip
    import numpy as np
    labels_path = os.path.join(path,'%s-labels-idx1-ubyte'% kind)
    images_path = os.path.join(path,'%s-images-idx3-ubyte'% kind)
    with open(labels_path, 'rb') as lbpath:
        labels = np.frombuffer(lbpath.read(), dtype=np.uint8,
                               offset=8)
    with open(images_path, 'rb') as imgpath:
        images = np.frombuffer(imgpath.read(), dtype=np.uint8,
                               offset=16).reshape(len(labels), 784)
    return images, labels

#主函数
def main():
    #这里的路径改需要该为自己的数据所在路径
    X_train, y_train = load_mnist('fashionmnist_data/FashionMNIST/raw', kind='train')#处理训练数据
    X_test, y_test = load_mnist('fashionmnist_data/FashionMNIST/raw', kind='t10k')#处理测试数据
    #print(X_train.shape,y_train.shape)#可以打印训练数据的形状(60000, 784) (60000,)
    #使用机器学习算法来分类，首先选取随机森林算法
    #构建随机森林分类器,括号里面那些都是超参数，可以自己调节，俗称调参
    clf = RandomForestClassifier(bootstrap=True, oob_score=True, criterion='gini')
    clf.fit(X_train,y_train)#训练
    #打印分类信息
    print('.................打印分类结果的信息.............')
    print(classification_report(y_test, clf.predict(X_test)))
    ##利用scikit-learn自带的库计算多分类混淆矩阵
    mcm = multilabel_confusion_matrix(y_test, clf.predict(X_test))#mcm即为混淆矩阵
    #通过混淆矩阵可以得到tp,tn,fn,fp
    tp = mcm[:, 1, 1]
    tn = mcm[:, 0, 0]
    fn = mcm[:, 1, 0]
    fp = mcm[:, 0, 1]
    print('......................打印混淆矩阵................')
    print(mcm)

if __name__ == '__main__':
    main()
```

**这里稍微解释下多分类的混淆矩阵**，对于二分类很好理解，多分类的混淆矩阵其实也是在二分类的基础上进行的，基本思想是：当研究其中的一类时，其余的各个类别都当做负类。

上面随机森林是一个经典的机器学习算法，以此作为例子对 fashion-mnist 数据集进行了分类。如果想换成其它的模型，也很容易，只需要简单的修改上面的几行代码。

### Pytorch 构建多层感知机和卷积神经网络进行分类

下面介绍一下如何构建一个多层的神经网络 (多层感知机 MLP) 以及卷积神经网络来进行分类。这里用 pytorch 进行构建。这里给出的网络的构建代码，完整代码请参考 github

```python
#这里其实是构建一个最简单经典的神经网络
class MLP(nn.Module):
    def __init__(self):
        super(MLP, self).__init__()
        self.fc1 = nn.Linear(784, 2000) #784表示输入神经元数量,2000表示这一层输出神经元数量
        self.fc2 = nn.Linear(2000, 1000)#第二层
        self.fc3 = nn.Linear(1000, 500)#第三层
        self.fc4 = nn.Linear(500, 100)
        self.fc5 = nn.Linear(100, 10)#最后一层直接输出10个类别的概率

    def forward(self, x):
        x = x.view(-1, 28*28)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.relu(self.fc3(x))
        x = F.relu(self.fc4(x))
        x = self.fc5(x)
        return F.log_softmax(x, dim=1)  #最后一层softmax输出分类概率
#这里构建了一个简单的CNN网络，
#这里直接参考了"https://blog.csdn.net/m0_37306360/article/details/79309849"的构建网络代码
class CNN(nn.Module):
    def __init__(self):
        super(CNN, self).__init__()
        #这里nn.Sequential是常常使用的pytorch构建模型的方案，把卷积，BN,激活放在一起
        #比如第一个卷积，BN,激活合起来我们叫做conv1
        self.conv1 = nn.Sequential(  # 输入图片(1, 28, 28)
            nn.Conv2d(
                in_channels=1, # 输入通道数，若图片为RGB则为3通道
                out_channels=32, # 输出通道数，即多少个卷积核一起卷积
                kernel_size=3, # 卷积核大小
                stride=1, # 卷积核移动步长
                padding=1, # 边缘增加的像素，使得得到的图片长宽没有变化
            ),# 输入(1, 28, 28)图片经过了二维卷积变为(32, 28, 28)
            nn.BatchNorm2d(32),#这一步是BatchNorm
            nn.ReLU(inplace=True),#激活层
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(32, 32, 3, 1, 1), # (32, 28, 28)
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2), # 池化层 (32, 14, 14)
        )
        self.conv3 = nn.Sequential(# (32, 14, 14)
            nn.Conv2d(32, 64, 3, 1, 1),# (64, 14, 14)
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
        )
        self.conv4 = nn.Sequential(
            nn.Conv2d(64, 64, 3, 1, 1),# (64, 14, 14)
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),# (64, 7, 7)
        )
        self.out = nn.Sequential(
            nn.Dropout(p = 0.5), # Dropout用于抑制过拟合，随机使得一定比例的神经元失效
            nn.Linear(64 * 7 * 7, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p = 0.5),
            nn.Linear(512, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p = 0.5),
            nn.Linear(512, 10),
        )
    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.conv4(x)
        x = x.view(x.size(0), -1) # (batch_size, 64*7*7)
        x = self.out(x)
        return F.log_softmax(x, dim=1)  #output
```

### 模型训练 / 验证

下面给出训练 / 验证部分代码，**主要分为训练的参数设置; 数据集加载；训练过程和验证过程; 利用 tensorboard 实现训练过程的可视化，网络结构可视化等。**

```python
def main():
    # parser是训练和测试的一些参数设置，如果default里面有数值，则默认用它，
    # 要修改可以修改default，也可以在命令行输入
    parser = argparse.ArgumentParser(description='PyTorch MNIST Example')
    parser.add_argument('--model', default='CNN',#这里选择你要训练的模型
                        help='CNN or MLP')
    parser.add_argument('--batch-size', type=int, default=128, metavar='N',
                        help='input batch size for training (default: 64)')
    parser.add_argument('--test-batch-size', type=int, default=1000, metavar='N',
                        help='input batch size for testing (default: 1000)')
    parser.add_argument('--epochs', type=int, default=1, metavar='N',
                        help='number of epochs to train (default: 10)')
    parser.add_argument('--lr', type=float, default=0.01, metavar='LR',
                        help='learning rate (default: 0.01)')
    parser.add_argument('--momentum', type=float, default=0.5, metavar='M',
                        help='SGD momentum (default: 0.5)')
    parser.add_argument('--no-cuda', action='store_true', default=False,
                        help='disables CUDA training')
    parser.add_argument('--seed', type=int, default=1, metavar='S',
                        help='random seed (default: 1)')
    parser.add_argument('--log-interval', type=int, default=50, metavar='N',
                        help='how many batches to wait before logging training status')
    parser.add_argument('--save-model', action='store_true', default=True,
                        help='For Saving the current Model')
    parser.add_argument('--save_dir', default='output/',#模型保存路径
                        help='dir saved models')
    args = parser.parse_args()
    #torch.cuda.is_available()会判断电脑是否有可用的GPU,没有则用cpu训练
    use_cuda = not args.no_cuda and torch.cuda.is_available()

    torch.manual_seed(args.seed)

    device = torch.device("cuda" if use_cuda else "cpu")

    kwargs = {'num_workers': 1, 'pin_memory': True} if use_cuda else {}
    train_loader = torch.utils.data.DataLoader(
        datasets.FashionMNIST('./fashionmnist_data/', train=True, download=True,
                       transform=transforms.Compose([
                           transforms.ToTensor(),
                           transforms.Normalize((0.1307,), (0.3081,))
                       ])),
        batch_size=args.batch_size, shuffle=True, **kwargs)
    test_loader = torch.utils.data.DataLoader(
        datasets.FashionMNIST('./fashionmnist_data/', train=False, transform=transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,))
        ])),
        batch_size=args.test_batch_size, shuffle=True, **kwargs)

    writer=SummaryWriter()#用于记录训练和测试的信息:loss,acc等
    if args.model=='CNN':
        model = CNN().to(device)#CNN() or MLP
    if args.model=='MLP':
        model = MLP().to(device)#CNN() or MLP
    optimizer = optim.SGD(model.parameters(), lr=args.lr, momentum=args.momentum)   #optimizer存储了所有parameters的引用，每个parameter都包含gradient
    scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=[12, 24], gamma=0.1)   #学习率按区间更新
    model.train()
    log_loss=0
    log_acc=0
    for epoch in range(1, args.epochs + 1):
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = F.nll_loss(output, target)  # negative log likelihood loss(nll_loss), sum up batch cross entropy
            loss.backward()
            optimizer.step()  # 根据parameter的梯度更新parameter的值
            # 这里设置每args.log_interval个间隔打印一次训练信息，同时进行一次验证，并且将验证(测试)的准确率存入writer
            if batch_idx % args.log_interval == 0:
                print('Train Epoch: {} [{}/{} ({:.0f}%)]\tLoss: {:.6f}'.format(
                    epoch, batch_idx * len(data), len(train_loader.dataset),
                           100. * batch_idx / len(train_loader), loss.item()))
                #下面是模型验证过程
                model.eval()
                test_loss = 0
                correct = 0
                with torch.no_grad():  # 无需计算梯度
                    for data, target in test_loader:
                        data, target = data.to(device), target.to(device)
                        output = model(data)
                        test_loss += F.nll_loss(output, target, reduction='sum').item()  # sum up batch loss
                        pred = output.argmax(dim=1, keepdim=True)  # get the index of the max log-probability
                        correct += pred.eq(target.view_as(pred)).sum().item()
                test_loss /= len(test_loader.dataset)
                writer.add_scalars('loss', {'train_loss':loss,'val_loss':test_loss},global_step=log_acc)
                writer.add_scalar('val_accuracy', correct / len(test_loader.dataset), global_step=log_acc)
                log_acc += 1
                print('\nTest set: Average loss: {:.4f}, Accuracy: {}/{} ({:.0f}%)\n'.format(
                    test_loss, correct, len(test_loader.dataset),
                    100. * correct / len(test_loader.dataset)))
                model.train()
    if (args.save_model):#保存训练好的模型
        if not os.path.exists(args.save_dir):
            os.makedirs(args.save_dir)
        torch.save(model.state_dict(), os.path.join(args.save_dir,args.model+".pt"))
    writer.add_graph(model, (data,))# 将模型结构保存成图，跟踪数据流动
    writer.close()
```

### 模型推理

首先说明说明叫推理 (infer): 前面我们已经训练好了模型，同时也已经保存好了我们的模型（xxx.pt）。同时我们还在训练的过程中就验证(测试) 了我们的模型训练效果；

**现在我们有了一张新图片，需要送给模型，让模型判断是属于哪个类别，这个过程就叫做模型的 infer。**

所以推理的前提是需要**从保存的模型里面加载模型，同时要注意的是我们之前保存的只是模型的权重，并未保存模型的结构，所以还得导入前面定义的模型结构，然后将这些权重附着在网络的结构 (骨架) 之上。**

```python
#
import torch
import cv2
from PIL import Image
from deep_learning import MLP,CNN #
from torchvision import datasets, transforms
#
model=CNN()#这里可选CNN(),要看你前面训练的是哪个
device=torch.device('cuda')#用cpu进行推理
model=model.to(device)
model.load_state_dict(torch.load('mnist_model.pt'))
model.eval()#这一步很重要，这是告诉模型我们要验证，而不是训练
#--------以上就是推理之前模型的导入--------
class_dic={0:"T恤",1:"裤子",2:"套头衫",3:"连衣裙",4:"外套",5:"凉鞋",6:"衬衫",7:"运动鞋",8:"包",9:"靴子"}
data_transforms = transforms.Compose([
    #transforms.ToTensor() convert a PIL image to tensor (HWC) in range [0,255] to a
    #torch.Tensor(CHW)in the range [0.0,1.0]
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,))
    ])
img=Image.open('test_image.jpg')#用于推理的图片
image=data_transforms(img)#预处理，转成tensor同时正则化
image=image.unsqueeze(0)#[1,28,28]->[1,1,28,28]
output = model(image.to(device))
pred = output.argmax(dim=1, keepdim=True)#
cls=pred.item()#输出在0~10之间代表10个类别
print(class_dic[cls])
```

最后贴上一些模型训练可视化的效果图

![](https://pic1.zhimg.com/v2-c597489aa8b4a73ee22d32ffe59727d4_r.jpg)

![](https://pic2.zhimg.com/v2-e538fa9dd1b0f7dce6eea77e03fd122d_r.jpg)

完整项目已经上传 github

[DLLXW/Fashion-MNIST](https://github.com/DLLXW/Fashion-MNIST)

在 readme 里面有使用说明！！！希望大家素质三连


# 调参
[机器学习：调整kNN的超参数 - 何永灿 - 博客园 (cnblogs.com)](https://www.cnblogs.com/volcao/p/9085363.html)

# 数据集的均值和标准差
## MNIST：

```text
transforms.Normalize((0.1307,), (0.3081,)) # mnist的均值和标准差 训练集
transforms.Normalize((0.1326,), (0.3106,)) # mnist的均值和标准差 测试集
```

```c++
 # 加载训练和测试数据
    train_loader = torch.utils.data.DataLoader(
        datasets.FashionMNIST('./fashionmnist_data/',
                              train=True, download=True,
                              transform=transforms.Compose(
                                  [transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])),
        batch_size=args.batch_size,
        shuffle=True, **kwargs)
```
## CIFAR-10:

Pytorch 使用以下值

```
transforms.Normalize ((0.5,), (0.5,))
```