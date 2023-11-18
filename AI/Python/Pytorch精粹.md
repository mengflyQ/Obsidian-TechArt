---
title: Pytorch精粹
uid: "202311111641"
create_time: 2023-11-11 16:39
reference:
  - http://zh.d2l.ai/index.html
  - https://www.bilibili.com/list/1567748478?sid=358497&spm_id_from=333.999.0.0&desc=1&oid=289532467&bvid=BV1if4y147hS
banner: "[[Pasted image 20231111164335.png]]"
banner_lock: true
---

# 一、基础
## 1 数据操作
### 01 张量
```python
import torch
```

- 深度学习存储和操作数据的主要接口是张量（n维数组）。它提供了各种功能，包括基本数学运算、广播、索引、切片、内存节省和转换其他 Python 对象。

- **张量（tensor）** 表示一个由数值组成的数组，这个数组可能有多个维度。 
    - 具有一个轴的张量对应数学上的**向量（vector）**； 
    - 具有两个轴的张量对应数学上的**矩阵（matrix）**；
    - 具有两个轴以上的张量没有特殊的数学名称。
    - 张量中的每个值都称为张量的 **元素（element）**

- 使用 `arange` 创建一个**行向量** `x`。这个行向量包含以0开始的前12个整数，范围为 $[0,12)$，它们默认创建为整数。也可指定创建类型为浮点数。
```python
x = torch.arange(12)
###
tensor([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11])
```

- 张量（沿每个轴的长度）的形状：
```python
x.shape
###
torch.Size([12])
```

- 张量的大小（size）：即张量中元素的总数，即形状的所有元素乘积
```python
X = x.reshape(3, 4)
###
tensor([[ 0,  1,  2,  3],
       [ 4,  5,  6,  7],
        [ 8,  9, 10, 11]])
```

不需要通过手动指定每个维度来改变形状。也就是说，如果我们的目标形状是（高度,宽度），那么在知道宽度后，高度会被自动计算得出，不必我们自己做除法。在上面的例子中，为了获得一个3行的矩阵，我们手动指定了它有3行和4列。幸运的是，我们可以**通过 `-1` 来调用此自动计算出维度的功能**。即我们可以用 `x.reshape(-1,4)` 或 `x.reshape(3,-1)` 来取代 `x.reshape(3,4)`。 

- 创建一个形状为（2,3,4）的张量，指定初始值
```python
torch.zeros((2, 3, 4))
###
tensor([[[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]],

        [[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]]])
```

```python
torch.ones((2, 3, 4))
###
tensor([[[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]],

        [[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]]])
```

- **通过从某个特定的概率分布中随机采样来得到张量中每个元素的值。** 例如，当我们构造数组来作为神经网络中的参数时，我们通常会随机初始化参数的值。以下代码创建一个形状为（3,4）的张量。**其中的每个元素都从均值为0、标准差为1的标准高斯分布（正态分布）中随机采样。**

```python
torch.randn(3, 4) #torch.randn函数用于创建一个具有随机值的张量
###
tensor([[-0.0135,  0.0665,  0.0912,  0.3212],
        [ 1.4653,  0.1843, -1.6995, -0.3036],
        [ 1.7646,  1.0450,  0.2457, -0.7732]])
```

- **通过提供包含数值的 Python 列表（或嵌套列表），来为所需张量中的每个元素赋予确定值**。在这里，最外层的列表对应于轴0，内层的列表对应于轴1。
```python
torch.tensor([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
###
tensor([[2, 1, 4, 3],
        [1, 2, 3, 4],
        [4, 3, 2, 1]])
```

### 02 运算符
对于**任意具有<mark style="background: #FF5582A6;">相同形状</mark>的张量，常见的标准算术运算符（`+`、`-`、`*`、`/` 和 `**`）都可以被升级为**按元素运算**。

在下面的例子中，我们使用逗号来表示一个具有5个元素的元组，其中每个元素都是按元素操作的结果。
```python
x = torch.tensor([1.0, 2, 4, 8])
y = torch.tensor([2, 2, 2, 2])
x + y
x - y
x * y
x / y
x ** y  # **运算符是求幂运算
torch.exp(x) # 按元素求幂
```

可以把**多个张量连结**（concatenate）在一起，把它们端对端地叠起来形成一个更大的张量。我们只需要提供张量列表，并给出沿哪个轴连结。 
下面的例子分别演示了当我们沿行（轴-0，形状的第一个元素） 和按列（轴-1，形状的第二个元素）连结两个矩阵时，会发生什么情况。我们可以看到，第一个输出张量的轴-0长度（6）是两个输入张量轴-0长度的总和（3+3）；第二个输出张量的轴-1长度（8）是两个输入张量轴-1长度的总和（4+4）。
```python
X = torch.arange(12, dtype=torch.float32).reshape((3,4))
Y = torch.tensor([[2.0, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
torch.cat((X, Y), dim=0), torch.cat((X, Y), dim=1)
###
(tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [ 2.,  1.,  4.,  3.],
         [ 1.,  2.,  3.,  4.],
         [ 4.,  3.,  2.,  1.]]),
 tensor([[ 0.,  1.,  2.,  3.,  2.,  1.,  4.,  3.],
         [ 4.,  5.,  6.,  7.,  1.,  2.,  3.,  4.],
         [ 8.,  9., 10., 11.,  4.,  3.,  2.,  1.]]))
```

**逻辑运算符**也是按元素运算
```python
X == Y
###
tensor([[False,  True, False,  True],
        [False, False, False, False],
        [False, False, False, False]])
```

对张量中的所有元素进行**求和**，会产生一个单元素张量。
```python
X.sum()
###
tensor(66.)
```

### 03 广播
在上面的部分是在相同形状的两个张量上执行按元素操作。在某些情况下，**即使<mark style="background: #FF5582A6;">形状不同</mark>，我们仍然可以通过调用广播机制（broadcasting mechanism）来执行按元素操作**。

**这种机制的工作方式如下：**
1. 通过适当复制元素来扩展一个或两个数组，以便在转换之后，两个张量具有相同的形状；
2. 对生成的数组执行按元素操作。

**在大多数情况下，我们将沿着数组中长度为1的轴进行广播，如下例子：**
```python
a = torch.arange(3).reshape((3, 1))
b = torch.arange(2).reshape((1, 2))
###
(tensor([[0],
         [1],
         [2]]),

tensor([[0, 1]]))
```

由于 `a` 和 `b` 分别是 $3×1$ 和 $1×2$ 矩阵，如果让它们相加，它们的形状不匹配。我们将两个矩阵**广播**为一个更大的 $3×2$ 矩阵，如下所示：矩阵 `a` 将复制列，矩阵 `b` 将复制行，然后再按元素相加。  

```python
a + b
###
tensor([[0, 1],
        [1, 2],
        [2, 3]])
```

### 04 索引和切片
就像在任何其他 Python 数组中一样，**张量中的元素可以通过索引访问**。与任何 Python 数组一样：第一个元素的索引是0，最后一个元素索引是-1；可以指定范围以包含第一个元素和最后一个之前的元素。
[[Python基础#切片语法]]

如下所示，我们可以用 `[-1]` 选择最后一个元素，可以用 `[1:3]` 选择第二个和第三个元素：
```python
X[-1], X[1:3]
```

除读取外，我们还可以通过指定索引来将元素写入矩阵。

如果我们想为多个元素赋值相同的值，我们只需要索引所有元素，然后为它们赋值。例如，`[0:2, :]` 访问第1行和第2行，其中“:”代表沿轴1（列）的所有元素。虽然我们讨论的是矩阵的索引，但这也适用于向量和超过2个维度的张量。
```python
X[0:2, :] = 12
###
X=tensor([[12., 12., 12., 12.],
        [12., 12., 12., 12.],
        [ 8.,  9., 10., 11.]])
```

### 05 节省内存
运行一些操作可能会导致为新结果分配内存。例如，如果我们用 `Y = X + Y`，我们将取消引用 `Y` 指向的张量，而是指向新分配的内存处的张量。

这可能是不可取的，原因有两个：
1. 首先，我们不想总是不必要地分配内存。在机器学习中，我们可能有数百兆的参数，并且在一秒内多次更新所有参数。通常情况下，我们希望原地执行这些更新；
2. 如果我们不原地更新，其他引用仍然会指向旧的内存位置，这样我们的某些代码可能会无意中引用旧的参数。

幸运的是，**执行原地操作**非常简单。我们可以**使用切片表示法将操作的结果分配给先前分配的数组，例如 `Y[:] = <expression>`**。为了说明这一点，我们首先创建一个新的矩阵 `Z`，其形状与另一个 `Y` 相同，使用 `zeros_like` 来分配一个全0的块。
```python
Z = torch.zeros_like(Y)
print('id(Z):', id(Z)) #Python的id()函数返回内存中引用对象的确切地址。
Z[:] = X + Y
print('id(Z):', id(Z))

#id(Z): 140327634811696
#id(Z): 140327634811696
```

如果在后续计算中没有重复使用`X`， 我们也可以使用`X[:] = X + Y`或`X += Y`来减少操作的内存开销。

```python
before = id(X)
X += Y
id(X) == before
#True
```

### 06 转换为其他 Python 对象
将Pytorch定义的张量转换为 NumPy 张量（`ndarray`）很容易，反之也同样容易。 torch 张量和 numpy 数组将共享它们的底层内存，就地操作更改一个张量也会同时更改另一个张量。
```python
A = X.numpy()
B = torch.tensor(A)
type(A), type(B)

# (numpy.ndarray, torch.Tensor) 
```

要将大小为1的张量转换为 Python 标量，我们可以调用 `item` 函数或 Python 的内置函数进行类型转换。

```python
a = torch.tensor([3.5])
a, a.item(), float(a), int(a)
#(tensor([3.5000]), 3.5, 3.5, 3)
```

## 2 数据预处理
在 Python 中常用的数据分析工具中，我们通常使用 `pandas` 软件包进行数据预处理。像庞大的 Python 生态系统中的许多其他扩展包一样，`pandas` 可以与张量兼容

### 01 读取数据集
## 读取CSV
创建一个数据集合存入CSV
```python
import os

os.makedirs(os.path.join('..', 'data'), exist_ok=True)
data_file = os.path.join('..', 'data', 'house_tiny.csv')
with open(data_file, 'w') as f:
    f.write('NumRooms,Alley,Price\n')  # 列名
    f.write('NA,Pave,127500\n')  # 每行表示一个数据样本
    f.write('2,NA,106000\n')
    f.write('4,NA,178100\n')
    f.write('NA,NA,140000\n')
```

![[Pasted image 20231111173516.png|350]]
调用 `read_csv()` 函数即可读取改 CSV 文件
```python
import pandas as pd

data = pd.read_csv(data_file)
print(data)

#输出,最左边一排是自动生成的序号，不是数据
   NumRooms Alley   Price
0       NaN  Pave  127500
1       2.0   NaN  106000
2       4.0   NaN  178100
3       NaN   NaN  140000
```

## Dataset
获取数据及其 label


## DataLoader
### 02 处理缺失值
注意，“`NaN`”项代表缺失值。为了处理缺失的数据，典型的方法包括**插值法**和**删除法**，其中插值法用一个替代值弥补缺失值，而删除法则直接忽略缺失值。**在这里，我们将考虑插值法。**

通过位置索引 `iloc`，我们将 `data`（上节中的 CSV 数据，5 行 3 列） 分成 `inputs` 和 `outputs`，其中前者为 `data` 的前两列，而后者为 `data` 的最后一列。
```python
inputs, outputs = data.iloc[:, 0:2], data.iloc[:, 2]
#此时input为
   NumRooms Alley
0       NaN  Pave
1       2.0   NaN
2       4.0   NaN
3       NaN   NaN

#output为
0    127500.0
1    106000.0
2    178100.0
3    140000.0
4         NaN
Name: Price, dtype: float64
```

对于 `inputs` 中缺少的数值，我们用同一列的均值替换“NaN”项。

```python
inputs = inputs.fillna(inputs.mean())
print(inputs)

#输出
   NumRooms Alley
0       3.0  Pave
1       2.0   NaN
2       4.0   NaN
3       3.0   NaN
```

对于 `inputs` 中的类别值或离散值，我们将“NaN”视为一个类别。由于“Alley”列只接受两种类型的类别值“Pave”和“NaN”， `pandas` 可以自动将此列转换为两列“Alley_Pave”和“Alley_nan”。“Alley”列为“Pave”的行会将“Alley_Pave”的值设置为1，“Alley_nan”的值设置为0。缺少“Alley”列的行会将“Alley_Pave”和“Alley_nan”分别设置为0和1。 
```python
inputs = pd.get_dummies(inputs, dummy_na=True)
print(inputs)
###
   NumRooms  Alley_Pave  Alley_nan
0       3.0           1          0
1       2.0           0          1
2       4.0           0          1
3       3.0           0          1
```

### 03 转换为张量格式
现在 `inputs` 和 `outputs` 中的所有条目都是数值类型，它们可以转换为张量格式, 使用 `to_numpy`。当数据采用张量格式后，可以通过张量函数来进一步操作。  
```python
import torch

X = torch.tensor(inputs.to_numpy(dtype=float))
y = torch.tensor(outputs.to_numpy(dtype=float))
X, y

###
(tensor([[3., 1., 0.],
         [2., 0., 1.],
         [4., 0., 1.],
         [3., 0., 1.]], dtype=torch.float64),
 tensor([127500., 106000., 178100., 140000.], dtype=torch.float64))
```

## 3 线性代数

> [!info] 约定
> - 列向量是向量的默认方向。在数学中，向量可以写为：$\mathbf{x}=\begin{bmatrix}x_1\\x_2\\\vdots\\x_n\end{bmatrix}$
> - 尽管单个向量的默认方向是列向量，但在表示表格数据集的矩阵中，将每个数据样本作为矩阵中的行向量更为常见。这种约定将支持常见的深度学习实践。例如，沿着张量的最外轴，我们可以访问或遍历小批量的数据样本。

### 01 标量
标量由只有一个元素的张量表示
```python
x = torch.tensor(3.0)
y = torch.tensor(2.0)

x + y, x * y, x / y, x**y

# (tensor(5.), tensor(6.), tensor(1.5000), tensor(9.))
```
### 02 向量

向量可以被视为标量值组成的列表。人们通过一维张量表示向量。一般来说，张量可以具有任意长度，取决于机器的内存限制。

```python
x = torch.arange(4) 
# tensor([0, 1, 2, 3])

#使用下标引用向量的任意元素
x[3] 
# tensor(3)
```
#### 点积
```python
x = tensor([0., 1., 2., 3.])
y = tensor([1., 1., 1., 1.])

torch.dot(x, y) = tensor(6.))
```

注意，我们也可以通过执行按元素乘法，然后进行求和来表示两个向量的点积：
```python
torch.sum(x * y)
```

![[Pasted image 20231111205452.png]]

### 03 长度、维度和形状

> [!NOTE] 维度
> 维度（dimension）这个词在不同上下文时往往会有不同的含义，这经常会使人感到困惑。为了清楚起见，我们在此明确一下： 
> - 向量或轴的维度被用来表示向量或轴的长度，即向量或轴的元素数量。
>  - 张量的维度用来表示张量具有的轴数。在这个意义上，张量的某个轴的维数就是这个轴的长度。

- **向量的长度**通常称为向量的**维度（dimension）**。
    - 与普通的 Python 数组一样，我们可以通过调用 Python 的内置 `len()` 函数来访问张量的长度。
- **形状（shape）是一个元素组**，列出了**张量沿每个轴的长度（维数）**。对于只有一个轴的张量，形状只有一个元素。
    - 当用张量表示一个向量（只有一个轴）时，我们也可以通过 `.shape` 属性访问向量的长度。
### 04 矩阵
当调用函数来实例化张量时， 我们可以通过指定两个分量 $m$ 和 $n$ 来创建一个形状为 $m×n$ 的矩阵。
```python
A = np.arange(20).reshape(5, 4)
###
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  5.,  6.,  7.],
       [ 8.,  9., 10., 11.],
       [12., 13., 14., 15.],
       [16., 17., 18., 19.]])
```

- **矩阵的转置**：`A.T`
#### 矩阵-向量积
在代码中使用张量表示矩阵-向量积，我们使用 `mv` 函数。当我们为矩阵 `A` 和向量 `x` 调用 `torch.mv(A, x)` 时，会执行矩阵-向量积。注意，`A` 的列维数（沿轴 1 的长度）必须与 `x` 的维数（其长度）相同。 
```python
torch.mv(A, x)
```

#### 矩阵-矩阵积
##### torch.mul ()

*   `torch.mul(a, b)` 是矩阵 a 和 b `对应位相乘`
*   `torch.mul(a, b)中a和b的维度相等`，但是，对应维度上的数字可以不同，可以用利用广播机制扩展到相同的形状，再进行点乘操作

```python
# 比如a的维度是(1, 2)，b的维度是(1, 2)，返回的仍是(1, 2)的矩阵
>>> a = torch.rand(1, 2)
>>> b = torch.rand(1, 2)
>>> torch.mul(a, b)  # 返回 1*2 的tensor

# 乘列向量
>>> a = torch.ones(3,4) 
>>> a
tensor([[1., 1., 1., 1.],
       [1., 1., 1., 1.],
       [1., 1., 1., 1.]])
>>> b = torch.Tensor([1,2,3]).reshape((3,1))
>>> b
tensor([[1.],
       [2.],
       [3.]])
>>> torch.mul(a, b)
tensor([[1., 1., 1., 1.],
       [2., 2., 2., 2.],
       [3., 3., 3., 3.]])
```

##### torch.mm ()

*   `torch.mm(a, b)` 是矩阵 a 和 b 矩阵相乘，比如 a 的维度是 (3, 4)，b 的维度是 (4, 2)，返回的就是 (3, 2) 的矩阵 
* torch.mm (a, b)**针对二维矩阵**

```python
>>> a = torch.ones(3,4)
>>> b = torch.ones(4,2)
>>> torch.mm(a, b)
tensor([[4., 4.],
        [4., 4.],
        [4., 4.]])
```

`mm()是mutmul()的简称？`

##### torch.matmul ()

*   `torch.matmul(a, b)` 也是一种类似于矩阵相乘操作的 tensor 联乘操作，一般是高维矩阵 a 和 b 相乘，但是它可以利用 python 中的广播机制，处理一些维度不同的 tensor 结构进行相乘操作。

###### 3.1 输入都是二维

*   当输入都是二维时，就是普通的矩阵乘法，和`tensor.mm()` 函数用法相同。  
    
    ![[eeb7173e2f99224584f25504227c0685_MD5.png]]
###### 3.2 输入都是三维

*   下面看一个两个都是 3 维的例子：  
    
    ![[4ce698041329917ba1df09b3f9ae9d5f_MD5.png]]
    
    将 b 的第 0 维 1broadcast 成 2 提出来，后两维做矩阵乘法即可。

###### 3.3 输入的维度不同

*   当输入有多维时，把多出的一维作为 batch 提出来，其他部分做矩阵乘法。  
    
    ![[e78d4960fb31324a695d44fc9d98f086_MD5.png]]
    
*   再看一个复杂一点的，是官网的例子：  
    
    ![[c444f333ec274e2816b2f839e2404f43_MD5.png]]
    
    首先把 a 的第 0 维 2 作为 batch 提出来，则 a 和 b 都可看作三维。再把 a 的 1broadcat 成 5，提取公因式 5。（这样说虽然不严谨，但是便于理解。）然后 a 剩下 (3,4)，b 剩下 (4,2)，做矩阵乘法得到 (3,2)。

### 05 张量

张量（本小节中的“张量”指代数对象）是描述具有任意数量轴的 $n$ 维数组的通用方法。例如，向量是一阶张量，矩阵是二阶张量。

```python
X = torch.arange(24).reshape(2, 3, 4)
###
tensor([[[ 0,  1,  2,  3],
         [ 4,  5,  6,  7],
         [ 8,  9, 10, 11]],

        [[12, 13, 14, 15],
         [16, 17, 18, 19],
         [20, 21, 22, 23]]])
```

#### 张量算法
给定具有相同形状的任意两个张量，任何按元素二元运算的结果都将是相同形状的张量。例如，将两个相同形状的矩阵相加，会在这两个矩阵上执行元素加法。
```python
A = torch.arange(20, dtype=torch.float32).reshape(5, 4)
B = A.clone()  # 通过分配新内存，将A的一个副本分配给B
### 
A 
(tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [12., 13., 14., 15.],
         [16., 17., 18., 19.]]),
###  
A + B 
tensor([[ 0.,  2.,  4.,  6.],
         [ 8., 10., 12., 14.],
         [16., 18., 20., 22.],
         [24., 26., 28., 30.],
         [32., 34., 36., 38.]]))

```

两个矩阵的按元素乘法称为阿达马积（Hadamard product）：
$$\mathbf{A}\odot\mathbf{B}=\begin{bmatrix}a_{11}b_{11}&a_{12}b_{12}&\ldots&a_{1n}b_{1n}\\a_{21}b_{21}&a_{22}b_{22}&\ldots&a_{2n}b_{2n}\\\vdots&\vdots&\ddots&\vdots\\a_{m1}b_{m1}&a_{m2}b_{m2}&\ldots&a_{mn}b_{mn}\end{bmatrix}$$
```python
A * B = tensor([[  0.,   1.,   4.,   9.],
        [ 16.,  25.,  36.,  49.],
        [ 64.,  81., 100., 121.],
        [144., 169., 196., 225.],
        [256., 289., 324., 361.]])
```

将张量乘以或加上一个标量不会改变张量的形状，其中张量的每个元素都将与标量相加或相乘。
```python
a = 2
X = torch.arange(24).reshape(2, 3, 4)
###
a + X
(tensor([[[ 2,  3,  4,  5],
          [ 6,  7,  8,  9],
          [10, 11, 12, 13]],

         [[14, 15, 16, 17],
          [18, 19, 20, 21],
          [22, 23, 24, 25]]]),

### 
(a * X).shape
 torch.Size([2, 3, 4]))
```

#### 降维
##### 求和
计算张量元素的总和, 张量可以为任意形状
**默认情况下，调用求和函数会沿所有的轴降低张量的维度，使它变为一个标量。**

```python
x = torch.arange(4, dtype=torch.float32)

###
x
(tensor([0., 1., 2., 3.])
###
x.sum()
tensor(6.))
```

**我们还可以指定张量沿哪一个轴来通过求和降低维度**。以矩阵为例，为了通过求和所有行的元素来降维（轴0，即 x 轴），可以在调用函数时指定 `axis=0`。**由于输入矩阵沿0轴降维以生成输出向量，因此行的维数在输出形状中消失。**（在水平方向将矩阵压扁。）
```python
A  = (tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [12., 13., 14., 15.],
         [16., 17., 18., 19.]]),
         
###
A_sum_axis0 = A.sum(axis=0) #沿0轴（x轴）求和
(tensor([40., 45., 50., 55.])

 ###
A_sum_axis0, A_sum_axis0.shape
torch.Size([4]))
```

同理，指定 `axis=1` 将通过汇总所有列的元素降维（轴1，即 y 轴）。因此，列的的维数在输出形状中消失。（在竖直方向将矩阵压扁）
```python
###
A_sum_axis1 = A.sum(axis=1)
(tensor([ 6.,
          22.,
          38.,
          54.,
          70.])
 
###
A_sum_axis1, A_sum_axis1.shape
torch.Size([5]))
```

沿着行和列对矩阵求和，等价于对矩阵的所有元素进行求和
```python
A.sum(axis=[0, 1])  # 结果和A.sum()相同
###
tensor(190.)
```

可以指定保持在原始张量的轴数 `keepdim=True`，而不折叠求和的维度:
```python
X = torch.tensor([[1.0, 2.0, 3.0],
                  [4.0, 5.0, 6.0]]) #形状为（2, 3），二维
X.sum(0) # tensor([5., 7., 9.])  形状为(3,)，降维到1维
X.sum(0, keepdim=True)  # tensor([[5., 7., 9.]])  形状为（1, 3） ，仍是二维

X.sum(1) #tensor([ 6., 15.])  形状为(2,)，降维到1维
X.sum(1, keepdim=True)
# tensor([[ 6.],
#        [15.]])
#  形状为（2, 1），仍是二维
```
##### 求平均
 - 调用 `mean()` 函数来计算任意形状张量的平均值。
- 通过将总和除以元素总数来计算平均值。
```python
A.mean()
#等价
A.sum() / A.numel()
```

计算平均值的函数也可以沿指定轴降低张量的维度。
```python
A.mean(axis=0)

A.sum(axis=0) / A.shape[0]
```

#### 非降维求和
```python
A  = (tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [12., 13., 14., 15.],
         [16., 17., 18., 19.]]),
```

有时在调用函数来计算总和或均值时保持轴数不变会很有用。

```python
sum_A = A.sum(axis=1, keepdims=True)
###
tensor([[ 6.],
        [22.],
        [38.],
        [54.],
        [70.]])
```

例如，由于 `sum_A` 在对每行进行求和后仍保持两个轴，我们可以通过广播将 `A` 除以 `sum_A`。 
```python
A / sum_A

###
tensor([[0.0000, 0.1667, 0.3333, 0.5000],
        [0.1818, 0.2273, 0.2727, 0.3182],
        [0.2105, 0.2368, 0.2632, 0.2895],
        [0.2222, 0.2407, 0.2593, 0.2778],
        [0.2286, 0.2429, 0.2571, 0.2714]])
```

如果我们想沿某个轴计算 `A` 元素的累积总和，比如 `axis=0`（按行计算），可以调用 `cumsum` 函数。此函数不会沿任何轴降低输入张量的维度。 
```python
A.cumsum(axis=0)

###
tensor([[ 0.,  1.,  2.,  3.],
        [ 4.,  6.,  8., 10.], #原来的第一行+第二行
        [12., 15., 18., 21.], #第第一行+第二行+第三行
        [24., 28., 32., 36.], #以此类推...
        [40., 45., 50., 55.]])
```

### 06 范数
**线性代数中最有用的一些运算符是范数（norm）。非正式地说，向量的范数是表示一个向量有多大。** 这里考虑的大小（size）概念不涉及维度，而是分量的大小。

**在线性代数中，向量范数是将向量映射到标量的函数 $f$ （即求大小）。**

**给定任意向量 $x$，向量范数要满足一些属性：**
- 性质一：如果我们按常数因子 $\alpha$ 缩放向量的所有元素，其范数也会按相同常数因子的绝对值缩放：$$
f(\alpha\mathbf{x})=|\alpha|f(\mathbf{x})
$$
- 性质二：是熟悉的三角不等式：$$
f(\mathbf{x}+\mathbf{y})\leq f(\mathbf{x})+f(\mathbf{y})
$$
- 性质三：范数必须是非负的，这是有道理的。因为在大多数情况下，任何东西的最小的_大小_是0。 
$$
f(\mathbf{x})\geq0
$$ 
- 性质四：要求范数最小为 0，当且仅当向量全由 0 组成。$$
\forall i,[\mathbf{x}]_i=0\Leftrightarrow f(\mathbf{x})=0.
$$
范数听起来很像距离的度量。欧几里得距离和毕达哥拉斯定理中的非负性概念和三角不等式可能会给出一些启发。**事实上，欧几里得距离是一个 $L_2$ 范数： 假设 $n$ 维向量 $x$ 中的元素是 $x_1,\ldots,x_n$，其 $L_2$ 范数是向量元素平方和的平方根：**
$$\|\mathbf{x}\|_2=\sqrt{\sum_{i=1}^nx_i^2},$$

其中，在 $L_2$ 范数中常常省略下标 $2$，也就是说 $‖x‖$ 等同于 $‖x‖_2$。在代码中，我们可以按如下方式计算向量的 $L_2$ 范数。
```python
u = torch.tensor([3.0, -4.0])
torch.norm(u)

###
tensor(5.)
```

深度学习中更经常地使用 $L_2$ 范数的平方，也会经常遇到 **$L_1$ 范数，它表示为向量元素的绝对值之和：**
```python
torch.abs(u).sum()
###
tensor(7.)
```

这些范数都是 $L_p$ 范数的特例：$\displaystyle\|\mathbf{x}\|_p=\left(\sum_{i=1}^n|x_i|^p\right)^{1/p}$

类似于向量的 $L_2$ 范数，**矩阵 $\mathbf{X}\in\mathbb{R}^{m\times n}$ 的 Frobenius 范数（Frobenius norm）是矩阵元素平方和的平方根：**
$$
\|\mathbf{X}\|_F=\sqrt{\sum_{i=1}^m\sum_{j=1}^nx_{ij}^2}
$$
Frobenius 范数满足向量范数的所有性质，它就像是矩阵形向量的 $L_2$ 范数。调用以下函数将计算矩阵的 Frobenius 范数。
```python
torch.norm(torch.ones((4, 9)))

###
tensor(6.)
```

#### 范数和目标
在深度学习中，我们经常试图解决优化问题： 最大化分配给观测数据的概率; 最小化预测和真实观测之间的距离。用向量表示物品（如单词、产品或新闻文章），以便最小化相似项目之间的距离，最大化不同项目之间的距离。 **目标，或许是深度学习算法最重要的组成部分（除了数据），通常被表达为范数。**

## 4 微积分
在深度学习中，我们“训练”模型，不断更新它们，使它们在看到越来越多的数据时变得越来越好。通常情况下，变得更好意味着最小化一个损失函数（loss function），即一个衡量“模型有多糟糕”这个问题的分数。最终，我们真正关心的是生成一个模型，它能够在从未见过的数据上表现良好。但“训练”模型只能将模型与我们实际能看到的数据相拟合。

**因此，我们可以将拟合模型的任务分解为两个关键问题：**
- _优化_（optimization）：用模型拟合观测数据的过程；
- _泛化_（generalization）：数学原理和实践者的智慧，能够指导我们生成出有效性超出用于训练的数据集本身的模型。

### 梯度
梯度是一个向量，其分量是多变量函数相对于其所有变量的偏导数。

我们可以连结一个多元函数**对其所有变量的偏导数**，以得到该函数的梯度（gradient）**向量**。具体而言，设函数 $f:\mathbb{R}^n\to\mathbb{R}$ 的输入是一个 $n$ 维向量 $\mathbf{x}=[x_1, x_2,\ldots, x_n]^\top$，并且输出是一个标量。函数 $f(x)$ 相对于 $x$ 的梯度是一个包含 $n$ 个偏导数的向量:
$$
\nabla_{\mathbf{x}}f(\mathbf{x})=\left[\frac{\partial f(\mathbf{x})}{\partial x_1},\frac{\partial f(\mathbf{x})}{\partial x_2},\ldots,\frac{\partial f(\mathbf{x})}{\partial x_n}\right]^\top,
$$
其中 $\nabla_{\mathbf{x}}f(\mathbf{x})$ 通常在没有歧义时被 $\nabla f(\mathbf{x})$ 取代

![[Pasted image 20231111213813.png]]

### 链式法则
然而，上面方法可能很难找到梯度。这是因为在深度学习中，多元函数通常是复合（composite）的，所以难以应用上述任何规则来微分这些函数。幸运的是，**链式法则可以被用来微分复合函数。**

让我们先考虑单变量函数。假设函数 $:y=f(u)$ 和 $u=g(x)$ 都是可微的，根据链式法则：
$$
\frac{dy}{dx}=\frac{dy}{du}\frac{du}{dx}.
$$
现在考虑一个更一般的场景，即函数具有任意数量的变量的情况。假设可微分函数 $y$ 有变量 $u_1,u_2,...,u_3$，其中每个可微分函数 $u_i$ 都有变量 $x_1,x_2,...,x_3$。注意，$y$ 是 $x_1,x_2,...,x_3$ 的函数。对于任意 $i=1,2,\ldots,n$，链式法则给出：
$$
\begin{aligned}\frac{\partial y}{\partial x_i}&=\frac{\partial y}{\partial u_1}\frac{\partial u_1}{\partial x_i}+\frac{\partial y}{\partial u_2}\frac{\partial u_2}{\partial x_i}+\cdots+\frac{\partial y}{\partial u_m}\frac{\partial u_m}{\partial x_i}\end{aligned}
$$
### 自动微分
Pytorch通过自动计算导数，即自动微分（automatic differentiation）来加快求导。实际中，根据设计好的模型，系统会构建一个计算图（computational graph），来跟踪计算是哪些数据通过哪些操作组合起来产生输出。自动微分使系统能够随后**反向传播梯度**。这里，_反向传播_（backpropagate）意味着跟踪整个计算图，填充关于每个参数的偏导数。

#### 例子

例子：$y=2\mathbf{x}^\top\mathbf{x}$ 关于列向量 $x$ 求导

```python
x = tensor([0., 1., 2., 3.])
```

**在我们计算 $y$ 关于 $x$ 的梯度之前，需要一个地方来存储梯度**。重要的是，我们不会在每次对一个参数求导时都分配新的内存。因为我们经常会成千上万次地更新相同的参数，每次都分配新的内存可能很快就会将内存耗尽。
>注意，一个标量函数关于向量 $x$ 的梯度是向量，并且与 $x$ 具有相同的形状。

```python
#将张量设置为需要梯度计算，这意味着在进行反向传播时，该张量的梯度将被计算和更新。
x.requires_grad_(True)  # 等价于x=torch.arange(4.0,requires_grad=True)

###
x.grad = None  # 默认值是None
```

现在计算 $y$。
```python
y = 2 * torch.dot(x, x)

###
tensor(28., grad_fn=<MulBackward0>)
```

`x` 是一个长度为4的向量，计算 `x` 和 `x` 的点积（等于 $\mathbf{x}^\top\mathbf{x}$），得到了我们赋值给 `y` 的标量输出。接下来，**通过调用反向传播函数来自动计算 `y` 关于 `x` 每个分量的梯度，并打印这些梯度。**

```python
y.backward()

###
x.grad = tensor([ 0.,  4.,  8., 12.])
```

函数 $y$ 关于 $x$ 的梯度应为 $4x$，快速验证这个梯度计算是否正确
```python
x.grad == 4 * x

###
tensor([True, True, True, True])
```

如果要继续计算 `x` 的另一个函数，要记得清空梯度
```python
# 在默认情况下，PyTorch会累积梯度，我们需要清除之前的值
x.grad.zero_()
```

#### 非标量变量的反向传播
当 `y` 不是标量时，向量 `y` 关于向量 `x` 的导数的最自然解释是一个矩阵。对于高阶和高维的 `y` 和 `x`，求导的结果可以是一个高阶张量。

然而，虽然这些更奇特的对象确实出现在高级机器学习中（包括深度学习中）， **但当调用向量的反向计算时，我们通常会试图计算一批训练样本中每个组成部分的损失函数的导数。这里，我们的目的不是计算微分矩阵，而是单独计算批量中每个样本的偏导数之和。**
```python
# 对非标量调用backward需要传入一个gradient参数，该参数指定微分函数关于self的梯度。
# 本例只想求偏导数的和，所以传递一个1的梯度是合适的
x.grad.zero_()
y = x * x
# 等价于y.backward(torch.ones(len(x)))
y.sum().backward()

###
x.grad = tensor([0., 2., 4., 6.])
```

#### 分离计算
有时，我们希望将某些计算移动到记录的计算图之外。例如，假设 `y` 是作为 `x` 的函数计算的，而 `z` 则是作为 `y` 和 `x` 的函数计算的。想象一下，我们想计算 `z` 关于 `x` 的梯度，但由于某种原因，希望将 `y` 视为一个常数，并且只考虑到 `x` 在 `y` 被计算后发挥的作用。

这里可以分离 `y` 来返回一个新变量 `u`，该变量与 `y` 具有相同的值，但丢弃计算图中如何计算 `y` 的任何信息。换句话说，梯度不会向后流经 `u` 到 `x`。因此，下面的反向传播函数计算 `z=u*x` 关于 `x` 的偏导数，同时将 `u` 作为常数处理，而不是 `z=x*x*x` 关于 `x` 的偏导数。 
```python
x.grad.zero_()
y = x * x
u = y.detach() # 分离y，将上一行的乘积赋给新变量u
z = u * x # 此时u不再是x*x,而只是一个乘积

z.sum().backward() 
x.grad == u # z=u*x 对x求导等于u。如果不分离y，这里应该是3x^2

###
tensor([True, True, True, True])
```

由于记录了 `y` 的计算结果，我们可以随后在 `y` 上调用反向传播，得到 `y=x*x` 关于的 `x` 的导数，即 `2*x`。
```python
x.grad.zero_()

y.sum().backward()
x.grad == 2 * x

###
tensor([True, True, True, True])
```

#### Python 控制流的梯度计算
使用自动微分的一个好处是： 即使构建函数的计算图需要通过 Python 控制流（例如，条件、循环或任意函数调用），我们仍然可以计算得到的变量的梯度。

在下面的代码中，`while` 循环的迭代次数和 `if` 语句的结果都取决于输入 `a` 的值。 
```python
def f(a):
    b = a * 2
    while b.norm() < 1000:
        b = b * 2
    if b.sum() > 0:
        c = b
    else:
        c = 100 * b
    return c
```

让我们计算梯度。

```python
a = torch.randn(size=(), requires_grad=True)
#size=()表示创建一个标量（0维张量）
d = f(a)
d.backward()
```

我们现在可以分析上面定义的 `f` 函数。请注意，它在其输入 `a` 中是分段线性的。换言之，对于任何 `a`，存在某个常量标量 `k`，使得 `f(a)=k*a`，其中 `k` 的值取决于输入 `a`，因此可以用 `d/a` 验证梯度是否正确。

```python
a.grad == d / a

###
tensor(True)
```

### torch.no_grad()
`torch.no_grad()` 是一个上下文管理器，用于指定在其范围内的代码块中不进行梯度计算。
在某些情况下，我们可能只是希望使用模型进行推理或评估，而不需要计算梯度。这时，可以使用 `torch.no_grad()` 来关闭梯度计算，从而减少内存消耗并提高代码的执行效率。

```python
import torch

# 定义模型和输入
model = torch.nn.Linear(10, 1)
inputs = torch.randn(1, 10)

# 使用torch.no_grad()上下文管理器进行推理
with torch.no_grad():
    outputs = model(inputs)
    print(outputs)
```

在上述示例中，`torch.no_grad()` 上下文管理器包裹的代码块中，模型的输出 `outputs` 会被计算出来，但不会计算梯度，因此不会对模型的参数进行更新。
## 5 概率
简单地说，机器学习就是做出预测。

- 我们可以从概率分布中采样。
- 我们可以使用联合分布、条件分布、Bayes定理、边缘化和独立性假设来分析多个随机变量。
- 期望和方差为概率分布的关键特征的概括提供了实用的度量形式。

## 6 查阅文档
- **查找模块中的所有函数和类**
为了知道模块中可以调用哪些函数和类，可以调用 `dir` 函数。例如，我们可以查询随机数生成模块中的所有属性：

```python
import torch
print(dir(torch.distributions))

###
['AbsTransform', 'AffineTransform', 'Bernoulli', 'Beta', 'Binomial', 'CatTransform', 'Categorical', 'Cauchy', 'Chi2'......
```

通常可以忽略以“`__`”（双下划线）开始和结束的函数，它们是Python中的特殊对象， 或以单个“`_`”（单下划线）开始的函数，它们通常是内部函数。 根据剩余的函数名或属性名，我们可能会猜测这个模块提供了各种生成随机数的方法， 包括从均匀分布（`uniform`）、正态分布（`normal`）和多项分布（`multinomial`）中采样。

- **查找特定函数和类的用法**
有关如何使用给定函数或类的更具体说明，可以调用 `help` 函数。例如，我们来查看张量 `ones` 函数的用法。
```python
help(torch.ones)
```

在 Jupyter 记事本中，我们可以使用 `?` 指令在另一个浏览器窗口中显示文档。例如，`list?` 指令将创建与 `help(list)` 指令几乎相同的内容，并在新的浏览器窗口中显示它。此外，如果我们使用两个问号，如 `list??`，将显示实现该函数的 Python 代码。

# 二、线性神经网络
## 1 线性回归
- 线性回归是对 n 维输入的加权，外加偏差
- 使用均方损失来衡量预测值和真实值的差异
- 线性回归有解析（只适合于简单模型，以后学的都没有解析解）
- 线性回归可以看做是单层神经网络
### 01 基本元素
**回归（regression）是能为一个或多个自变量与因变量之间关系建模的一类方法**。在自然科学和社会科学领域，回归经常用来表示输入和输出之间的关系。

在机器学习领域中的大多数任务通常都与预测（prediction）有关。 **当我们想预测一个数值时，就会涉及到回归问题**。 常见的例子包括：预测价格（房屋、股票等）、预测住院时间（针对住院病人等）、 预测需求（零售销量等）。 但不是所有的预测都是回归问题。

---

为了解释线性回归，我们举一个实际的例子： 我们希望根据房屋的**面积**和**房龄**来估算**价格**。为了开发一个能预测房价的模型，我们需要收集一个真实的数据集。这个数据集包括了房屋的销售价格、面积和房龄。 

对应的机器学习的术语：
- 该数据集称为**训练数据集**（training data set） 或训练集（training set）。
- 每行数据（比如一次房屋交易相对应的数据）称为**样本**（sample），也可以称为数据点（data point）或数据样本（data instance）。
- 试图预测的目标（比如预测房屋价格）称为**标签**（label）或目标（target）。
- 预测所依据的自变量（面积和房龄）称为**特征**（feature）或协变量（covariate）。

**超参数**：可以调整但不在训练过程中更新的参数称为超参数（hyperparameter），如下面提到的学习率、num_epochs。
**调参**（hyperparameter tuning）是选择超参数的过程。

### 02 矢量化加速
在训练我们的模型时，我们经常希望能够同时处理整个小批量的样本。为了实现这一点，需要我们对计算进行矢量化，从而利用线性代数库，而不是在 Python 中编写开销高昂的 for 循环。

```python
n = 10000
a = torch.ones([n])
b = torch.ones([n])

# 使用for循环，按元素相加，耗时'0.16749 sec'
c = torch.zeros(n)
timer = Timer()
for i in range(n):
    c[i] = a[i] + b[i]

# 使用重载的+运算符，计算按元素的和。耗时'0.00042 sec'
d = a + b
```

第二种方法比第一种方法快得多。矢量化代码通常会带来数量级的加速。

## 2 线性回归的实现
- 我们可以使用 PyTorch 的高级 API 更简洁地实现模型。
- 在PyTorch中，`data`模块提供了数据处理工具，`nn`模块定义了大量的神经网络层和常见损失函数。
- 我们可以通过 `_` 结尾的方法将参数替换，从而初始化参数。

#### (1) 生成数据集
为了简单起见，我们将根据带有噪声的线性模型构造一个人造数据集。我们的任务是使用这个有限样本的数据集来恢复这个模型的参数。我们将使用低维数据，这样可以很容易地将其可视化。 
在下面的代码中，我们生成一个包含1000个样本的数据集，每个样本包含从标准正态分布中采样的2个特征。我们的合成数据集是一个 1000X2 的矩阵。
我们使用线性模型参数：权重 $\mathbf{w}=[2,-3.4]^\top$、偏置 $b=4.2$ 和噪声项 $\epsilon$ 生成**数据集 X**及其**标签 y:**
$$
\mathbf{y}=\mathbf{X}\mathbf{w}+b+\epsilon.
$$
噪声项 $\epsilon$ 可以视为模型预测和标签时的**潜在观测误差**。在这里我们认为标准假设成立，即 $\epsilon$ 服从均值为0的正态分布。为了简化问题，我们将标准差设为0.01。下面的代码生成合成数据集。

```python
# 生成合成数据集和标签
def synthetic_data(w, b, num_examples):
    """生成y=Xw+b+噪声"""

    # 生成数据集X：服从正态分布的随机特征矩阵X，形状为(num_examples, len(w))
    X = torch.normal(0, 1, (num_examples, len(w)))
    
    # 生成标签y
    y = torch.matmul(X, w) + b
    
    # 引入噪声，生成服从正态分布的随机噪声矩阵，形状与y相同，并将其加到y上
    y += torch.normal(0, 0.01, y.shape)

    # 返回数据集X和标签y（真实值）
    # -1用于自动计算维度，相当于（n，1），即转换为列向量
    return X, y.reshape((-1, 1))
```

```python
import numpy as np
import torch
from torch.utils import data
from d2l import torch as d2l

true_w = torch.tensor([2, -3.4]) # 定义真实的权重
true_b = 4.2 # 定义真实的偏置

# 生成合成数据集和标签
# features中的每一行都包含一个二维数据样本
# labels中的每一行都包含一维标签值（一个标量），作为真实值
features, labels = synthetic_data(true_w, true_b, 1000)
```
#### (2) 读取数据集 `data_iter`
我们可以调用框架中现有的 API 来读取数据。我们将 `features` 和 `labels` 作为 API 的参数传递，并通过数据迭代器指定 `batch_size`。此外，布尔值 `is_train` 表示是否希望数据迭代器对象在每个迭代周期内打乱数据。 

当我们运行迭代时，我们会连续地获得不同的小批量，直至遍历完整个数据集。

```python
def load_array(data_arrays, batch_size, is_train=True):  #@save
    """构造一个PyTorch数据迭代器"""
    dataset = data.c(*data_arrays)
    return data.DataLoader(dataset, batch_size, shuffle=is_train)

batch_size = 10
data_iter = load_array((features, labels), batch_size)
```

为了验证是否正常工作，让我们读取并打印第一个小批量样本。我们使用 `iter` 构造 Python 迭代器，并使用 `next` 从迭代器中获取第一项。
```python
next(iter(data_iter))

###
[tensor([[-1.3116, -0.3062],
         [-1.5653,  0.4830],
         [-0.8893, -0.9466],
         [-1.2417,  1.6891],
         [-0.7148,  0.1376],
         [-0.2162, -0.6122],
         [ 2.4048, -0.3211],
         [-0.1516,  0.4997],
         [ 1.5298, -0.2291],
         [ 1.3895,  1.2602]]),
 tensor([[ 2.6073],
         [-0.5787],
         [ 5.6339],
         [-4.0211],
         [ 2.3117],
         [ 5.8492],
         [10.0926],
         [ 2.1932],
         [ 8.0441],
         [ 2.6943]])]
```
#### (3) 定义模型 `net()`
定义模型，将模型的输入和参数同模型的输出关联起来

**对于标准深度学习模型，我们可以使用框架的预定义好的层。这使我们只需关注使用哪些层来构造模型，而不必关注层的实现细节。** 
我们首先定义一个模型变量 `net`，它是一个 `Sequential（顺序）` 类的实例。 `Sequential` 类将多个层串联在一起。当给定输入数据时，`Sequential` 实例将数据传入到第一层，然后将第一层的输出作为第二层的输入，以此类推。 
>在下面的例子中，我们的模型只包含一个层（全连接层），因此实际上不需要 `Sequential`。但是由于以后几乎所有的模型都是多层的，在这里使用 `Sequential` 会让你熟悉“标准的流水线”。
![[singleneuron.svg]]

**`nn.Linear` 定义一个全连接层**：在 PyTorch 中，全连接层在 `Linear` 类中定义。
- 第一个参数：指定输入特征形状，即2，
- 第二个参数：指定输出特征形状，输出特征形状为单个标量，因此为1。

```python
# nn是神经网络的缩写
from torch import nn

net = nn.Sequential(nn.Linear(2, 1))
```

#### (4) 初始化模型参数
在使用 `net` 之前，我们需要初始化模型参数。如在线性回归模型中的权重和偏置。 **Pytorch通常有预定义的方法来初始化参数**。

正如我们在构造 `nn.Linear` 时指定输入和输出尺寸一样，现在我们能直接访问参数以设定它们的初始值。
- 我们通过 `net[0]` 选择网络中的第一个图层
- 然后使用 `weight.data` 和 `bias.data` 方法访问参数。
- 我们还可以使用替换方法 `normal_` 和 `fill_` 来重写参数值。

在这里，我们指定每个权重参数应该从均值为 0、标准差为 0.01 的正态分布中随机采样，偏置参数将初始化为零。
```python
net[0].weight.data.normal_(0, 0.01)
net[0].bias.data.fill_(0)

###
tensor([0.])
```

在初始化参数之后，我们的任务是更新这些参数，直到这些参数足够拟合我们的数据。每次更新都需要计算损失函数关于模型参数的梯度。有了这个梯度，我们就可以向减小损失的方向更新每个参数。
>因为手动计算梯度很枯燥而且容易出错，所以没有人会手动计算梯度。我们使用自动微分来计算梯度。

#### (5) 定义损失函数 `loss()`
因为需要计算损失函数的梯度，所以我们应该先定义损失函数

这里损失函数采用**均方误差（MSE，mean square error）**
计算**均方误差**使用的是 `MSELoss` 类，也称为平方 $L_2$ 范数。默认情况下，它返回所有样本损失的平均值。
```python
loss = nn.MSELoss()
```

#### (6) 定义优化算法 `SGD`
小批量：mini-batch
随机梯度下降：SGD，Stochastic Gradient Descent

线性回归有解析解。**尽管线性回归有解析解，但本书中的其他模型却没有**。所以我们选择使用更通用的小批量随机梯度下降。

在每一步中，使用从数据集中随机抽取的一个小批量，然后根据参数计算损失的梯度。 接下来，朝着减少损失的方向更新我们的参数。

**小批量随机梯度下降算法**是一种优化神经网络的标准工具， PyTorch 在 `optim` 模块中实现了该算法的许多变种。当我们实例化一个 `SGD` 实例时，我们要指定优化的参数 （可通过 `net.parameters()` 从我们的模型中获得）以及优化算法所需的超参数字典。小批量随机梯度下降只需要设置学习速率 `lr` 值（每一步更新的大小由学习速率 `lr` 决定），这里设置为0.03。

```python
trainer = torch.optim.SGD(net.parameters(), lr=0.03)
```

#### (7) 训练
通过 Pytorch 的高级 API 来实现我们的模型只需要相对较少的代码。我们不必单独分配参数、不必定义我们的损失函数，也不必手动实现小批量随机梯度下降。当我们需要更复杂的模型时，高级 API 的优势将大大增加。当我们有了所有的基本组件，训练过程代码与我们从零开始实现时所做的非常相似。 

- 在每个迭代周期里，我们将完整遍历一次数据集（`train_data`），不停地从中获取一个小批量的输入和相应的标签。
- **对于每一个小批量，我们会进行以下步骤:**
    - 通过调用 `net(X)` 生成预测值并计算损失 `l`（前向传播）。
    - 通过进行反向传播来计算梯度
    - 通过调用优化器来更新模型参数。

为了更好的衡量训练效果，我们计算每个迭代周期后的损失，并打印它来监控训练过程。

```python
num_epochs = 3 #迭代次数

# 迭代指定次数的epoch，每次都要完整遍历一次数据集
for epoch in range(num_epochs):
    # 遍历数据集的每个小批量样本，直到完整遍历一次数据集
    for X, y in data_iter: #特征矩阵X和标签y（真实值）
        # 使用网络模型net(X)生成预测值，和真实值y带入损失函数计算损失
        l = loss(net(X), y)
        
        # 梯度清零，防止梯度累积
        trainer.zero_grad()
        # 反向传播计算梯度
        l.backward()
        
        # 使用优化器更新模型参数
        trainer.step()
    
    # 计算每个迭代周期整个训练集上的损失函数值，用来监控训练过程
    l = loss(net(features), labels) 
    # 打印当前epoch的序号和损失函数值
    print(f'epoch {epoch + 1}, loss {l:f}')

###
epoch 1, loss 0.000248
epoch 2, loss 0.000103
epoch 3, loss 0.000103
```

下面我们比较生成数据集的真实参数和通过有限数据训练获得的模型参数。要访问参数，我们首先从 `net` 访问所需的层，然后读取该层的权重和偏置。我们估计得到的参数与生成数据的真实参数非常接近。

```python
w = net[0].weight.data
print('w的估计误差：', true_w - w.reshape(true_w.shape))
b = net[0].bias.data
print('b的估计误差：', true_b - b)

###
w的估计误差： tensor([-0.0010, -0.0003])
b的估计误差： tensor([-0.0003])
```
## 3 图像分类数据集 Fashion-MNIST
MNIST 数据集 ([LeCun _et al._, 1998]( http://zh.d2l.ai/chapter_references/zreferences.html#id90 "LeCun, Y., Bottou, L., Bengio, Y., Haffner, P., & others. (1998). Gradient-based learning applied to document recognition. Proceedings of the IEEE, 86(11), 2278–2324.")) 是图像分类中广泛使用的数据集之一，但作为基准数据集过于简单。我们将使用类似但更复杂的 Fashion-MNIST 数据集 ([Xiao _et al._, 2017]( http://zh.d2l.ai/chapter_references/zreferences.html#id189 "Xiao, H., Rasul, K., & Vollgraf, R. (2017). Fashion-mnist: a novel image dataset for benchmarking machine learning algorithms. arXiv preprint arXiv: 1708.07747."))。
Fashion-MNIST 是一个服装分类数据集，由10个类别的图像组成。我们将在后续章节中使用此数据集来评估各种分类算法。
#### 读取数据集
我们可以通过框架中的内置函数将 Fashion-MNIST 数据集下载并读取到内存中。

```python
import torch
import torchvision
from torch.utils import data
from torchvision import transforms
from d2l import torch as d2l

d2l.use_svg_display()

# 通过ToTensor实例将图像数据从PIL类型变换成32位浮点数格式，
# 并除以255使得所有像素的数值均在0～1之间
trans = transforms.ToTensor()
mnist_train = torchvision.datasets.FashionMNIST(
    root="../data", train=True, transform=trans, download=True)
mnist_test = torchvision.datasets.FashionMNIST(
    root="../data", train=False, transform=trans, download=True)
#train=True：训练数据集
#transform=trans：转换成张量
#download=True 下载
```

Fashion-MNIST 由10个类别的图像组成，每个类别由训练数据集（train dataset）中的6000张图像和测试数据集（test dataset）中的1000张图像组成。
因此，训练集和测试集分别包含60000和10000张图像。测试数据集不会用于训练，只用于评估模型性能。
```python
len(mnist_train), len(mnist_test)
###
(60000, 10000)
```

每个输入图像的高度和宽度均为28像素。数据集由灰度图像组成，其通道数为1。**为了简洁起见，本书将高度 $h$ 像素、宽度 $w$ 像素图像的形状记为 $h×w$ 或 $(h,w)$ **
```python
mnist_train[0][0].shape

###
torch.Size([1, 28, 28])
```

Fashion-MNIST 中包含的10个类别，分别为 t-shirt（T 恤）、trouser（裤子）、pullover（套衫）、dress（连衣裙）、coat（外套）、sandal（凉鞋）、shirt（衬衫）、sneaker（运动鞋）、bag（包）和 ankle boot（短靴）。**以下函数用于在数字标签索引及其文本名称之间进行转换**
```python
def get_fashion_mnist_labels(labels):  
    """返回Fashion-MNIST数据集的文本标签"""
    text_labels = ['t-shirt', 'trouser', 'pullover', 'dress', 'coat',
                   'sandal', 'shirt', 'sneaker', 'bag', 'ankle boot']
    return [text_labels[int(i)] for i in labels]
```

我们现在可以创建一个函数来可视化这些样本。
```python
def show_images(imgs, num_rows, num_cols, titles=None, scale=1.5):  #@save
    """绘制图像列表"""
    figsize = (num_cols * scale, num_rows * scale)
    _, axes = d2l.plt.subplots(num_rows, num_cols, figsize=figsize)
    axes = axes.flatten()
    for i, (ax, img) in enumerate(zip(axes, imgs)):
        if torch.is_tensor(img):
            # 图片张量
            ax.imshow(img.numpy())
        else:
            # PIL图片
            ax.imshow(img)
        ax.axes.get_xaxis().set_visible(False)
        ax.axes.get_yaxis().set_visible(False)
        if titles:
            ax.set_title(titles[i])
    return axes
```

以下是训练数据集中前几个样本的图像及其相应的标签。
```python
X, y = next(iter(data.DataLoader(mnist_train, batch_size=18)))
show_images(X.reshape(18, 28, 28), 2, 9, titles=get_fashion_mnist_labels(y));
```
![[output_image-classification-dataset_e45669_83_0.svg]]
#### 读取小批量
为了使我们在读取训练集和测试集时更容易，我们使用内置的数据迭代器，数据迭代器是获得更高性能的关键组件。依靠实现良好的数据迭代器，利用高性能计算来避免减慢训练过程。

`DataLoader` 每次都会读取一小批量数据，大小为 `batch_size`。通过内置数据迭代器，我们可以随机打乱了所有样本，从而无偏见地读取小批量。

```python
batch_size = 256

def get_dataloader_workers():  #@save
    """使用4个进程来读取数据"""
    return 4

train_iter = data.DataLoader(mnist_train, batch_size, shuffle=True,num_workers=get_dataloader_workers())
```

我们看一下读取训练数据所需的时间。
```python
timer = d2l.Timer()
for X, y in train_iter:
    continue
f'{timer.stop():.2f} sec'

###
'3.37 sec'
```

#### 整合所有组件
现在我们定义 `load_data_fashion_mnist` 函数，**用于获取和读取 Fashion-MNIST 数据集。这个函数返回训练集和验证集的数据迭代器（迭代器用于按小批量读取一遍完整数据 `for X, y in train_iter`）**。此外，这个函数还接受一个可选参数 `resize`，用来将图像大小调整为另一种形状。
```python
def load_data_fashion_mnist(batch_size, resize=None):  #@save
    """下载Fashion-MNIST数据集，然后将其加载到内存中"""
    trans = [transforms.ToTensor()]
    if resize:
        trans.insert(0, transforms.Resize(resize))
    trans = transforms.Compose(trans)
    mnist_train = torchvision.datasets.FashionMNIST(
        root="../data", train=True, transform=trans, download=True)
    mnist_test = torchvision.datasets.FashionMNIST(
        root="../data", train=False, transform=trans, download=True)
    return (data.DataLoader(mnist_train, batch_size, shuffle=True,
                            num_workers=get_dataloader_workers()),
            data.DataLoader(mnist_test, batch_size, shuffle=False,
                            num_workers=get_dataloader_workers()))
```

下面，我们通过指定 `resize` 参数来测试 `load_data_fashion_mnist` 函数的图像大小调整功能。

```python
train_iter, test_iter = load_data_fashion_mnist(32, resize=64)
for X, y in train_iter:
    print(X.shape, X.dtype, y.shape, y.dtype)
    break
    
###
torch.Size([32, 1, 64, 64]) torch.float32 torch.Size([32]) torch.int64
```

我们现在已经准备好使用Fashion-MNIST数据集，便于下面的章节调用来评估各种分类算法。

## 4 Softmax 回归的实现
#### 从回归到分类
![[Pasted image 20231112205941.png]]
- 回归估计的是一个连续值
- 分类预测一个离散类别

通常，机器学习实践者用分类这个词来描述两个有微妙差别的问题： 
1. 我们只对样本的“**硬性”类别**感兴趣，即**属于哪个类别**；
2. 我们希望得到“**软性”类别**，即得到**属于每个类别的概率**。 
这两者的界限往往很模糊。其中的一个原因是：**即使我们只关心硬类别，我们仍然使用软类别的模型。**

**Softmax 函数具有以下特征：**
- softmax 函数的输出是 0.0 到 1.0 之间的实数。  
- **softmax 函数的输出总和为 1 是 softmax 函数的一个重要性质，正因为有了这个性质，可以把 softmax 函数的输出解释为 “概率”。**  
- 数组 a 中元素的大小关系和输出 y 中元素的大小关系一致，**即使用了 softmax 函数，各个元素之间的大小关系也不会改变。**
- 尽管 softmax 是一个非线性函数，但 softmax 回归的输出仍然由输入特征的仿射变换决定。因此，softmax 回归是一个线性模型（linear model）。

####  (1) 数据集
使用 Fashion-MNIST 数据集，并保持批量大小为256。
```python
import torch
from torch import nn
from d2l import torch as d2l

batch_size = 256
train_iter, test_iter = d2l.load_data_fashion_mnist(batch_size)
```

#### (2) 定义模型 `net()`，初始化模型参数
和之前线性回归的例子一样，这里的每个样本都将用固定长度的向量表示。原始数据集中的每个样本都是28×28的图像。**本节将展平每个图像，把它们看作长度为784的向量**。在后面的章节中，我们将讨论能够利用图像空间结构的特征，但现在我们**暂时只把每个像素位置看作一个特征。**
**在 softmax 回归中，我们的输出与类别一样多**。因为我们的数据集有**10个类别，所以网络输出维度为10**。因此，权重将构成一个 $784×10$ 的矩阵，偏置将构成一个 $1×10$ 的行向量。与线性回归一样，我们将使用正态分布初始化我们的权重 `W`，偏置初始化为0。

**Softmax 回归的输出层是一个全连接层**。因此，为了实现我们的模型，我们**只需在 `Sequential` 中添加一个带有10个输出的全连接层**。同样，在这里 `Sequential` 并不是必要的，但它是实现深度模型的基础。我们仍然以均值0和标准差0.01随机初始化权重。

```python
# PyTorch不会隐式地调整输入的形状。因此，我们在线性层前定义了展平层（flatten），来调整网络输入的形状
net = nn.Sequential(nn.Flatten(), nn.Linear(784, 10))
#nn.Flatten()用于将输入的多维张量展平为一维张量，这里用于将输入的图像展平为一维向量。
#nn.Linear(784, 10)定义了一个线性层，输入维度为784，输出维度为10，这里用于将展平后的图像向量映射为10个类别的得分。


#如果是线性层，则对其权重进行正态分布初始化。
def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, std=0.01)

#将init_weights函数应用到net的每一层，从而实现对权重的初始化。
net.apply(init_weights); 
```

#### (3) 定义损失函数 `loss()`
Softmax 函数：
$$
\hat{y}_j=\frac{\exp(o_j)}{\sum_k\exp(o_k)}
$$
$exp (x)$ 是表示 $e^x$ 的指数函数。上表示假设输出层共有 $k$ 个神经元，计算第 $j$ 个神经元的输出 $y_k$。 $softmax$ 函数的分子是输入信号 $o_j$ 的指数函数，分母是所有输入信号的指数函数的和。  

原函数分子分母会发生上溢，这种情况下无法得到明确定义的交叉熵值。解决方法：改成下面的函数
$$
\hat{y}_j=\frac{\exp(o_j-\max(o_k))}{\sum_k\exp(o_k-\max(o_k))}
$$

改成这样后在反向传播时会返回 NAN, 因此尽管我们要计算指数函数，但我们最终在计算交叉熵损失时会取它们的对数。通过将 softmax 和交叉熵结合在一起，可以避免反向传播过程中可能会困扰我们的数值稳定性问题。

$$
\begin{aligned}
\log\left(\hat{y}_j\right)& =\log\left(\frac{\exp(o_j-\max(o_k))}{\sum_k\exp(o_k-\max(o_k))}\right)  \\
&=\log\left(\exp(o_j-\max(o_k))\right)-\log\left(\sum_k\exp(o_k-\max(o_k))\right) \\
&=o_j-\max(o_k)-\log\left(\sum_k\exp(o_k-\max(o_k))\right).
\end{aligned}
$$
我们也希望保留传统的 softmax 函数，以备我们需要评估通过模型输出的概率。**但是，我们没有将 softmax 概率传递到损失函数中，而是在交叉熵损失函数中传递未规范化的预测，并同时计算 softmax 及其对数，这是一种类似 [“LogSumExp技巧”](https://en.wikipedia.org/wiki/LogSumExp)的聪明方式。**

```python
loss = nn.CrossEntropyLoss(reduction='none')
```

![[《鱼书》#交叉熵]]
#### (4) 优化算法 SGD
在这里，我们**使用学习率为0.1的小批量随机梯度下降作为优化算法**。这与我们在线性回归例子中的相同，这说明了优化器的普适性。

```python
trainer = torch.optim.SGD(net.parameters(), lr=0.1)
```
#### (5) 分类精度
给定预测概率分布 `y_hat`，当我们必须输出硬性预测（即属于哪个类别）时，我们**通常选择预测概率最高的类。**

**当预测与标签分类`y`一致时，即是正确的。 分类精度即正确预测数量与总预测数量之比。** 虽然直接优化精度可能很困难（因为精度的计算不可导）， 但**精度通常是我们最关心的性能衡量标准，我们在训练分类器时几乎总会关注它。**

为了计算精度，我们执行以下操作。首先，如果 `y_hat`（预测值）是矩阵，那么**假定第二个维度存储每个类的预测分数**。我们使用 `argmax` 获得每行中最大元素的索引来获得预测类别。然后我们将预测类别与真实 `y` 元素进行比较。由于等式运算符“`==`”对数据类型很敏感，因此我们将 `y_hat` 的数据类型转换为与 `y` 的数据类型一致。结果是一个包含0（错）和1（对）的张量。最后，我们求和会**得到正确预测的数量。**
```python
def accuracy(y_hat, y): 
    """计算预测正确的数量"""
    if len(y_hat.shape) > 1 and y_hat.shape[1] > 1:
        y_hat = y_hat.argmax(axis=1)
    cmp = y_hat.type(y.dtype) == y
    return float(cmp.type(y.dtype).sum())
```

**同样，对于任意数据迭代器 `data_iter` 可访问的数据集，我们可以评估在任意模型 `net` 的精度。**
```python
def evaluate_accuracy(net, data_iter):  #@save
    """计算在指定数据集上模型的精度"""
    if isinstance(net, torch.nn.Module):
        net.eval()  # 将模型设置为评估模式
    metric = Accumulator(2)  # 正确预测数、预测总数
    with torch.no_grad():
        for X, y in data_iter:
            metric.add(accuracy(net(X), y), y.numel()) # 正确预测数、预测总数添加到metric
            #numel()方法返回张量中元素的总数
    return metric[0] / metric[1] ## 正确预测数/预测总数 = 精度
```

**这里定义一个实用程序类 `Accumulator`，用于对多个变量进行累加。** 在上面的 `evaluate_accuracy` 函数中，我们在 `Accumulator` 实例中创建了2个变量，分别用于存储正确预测的数量和预测的总数量。当我们遍历数据集时，两者都将随着时间的推移而累加。

```python
class Accumulator:  #@save
    """在n个变量上累加"""
    def __init__(self, n):
        self.data = [0.0] * n

    def add(self, *args):
        self.data = [a + float(b) for a, b in zip(self.data, args)]

    def reset(self):
        self.data = [0.0] * len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]
```
#### (6) 训练
在我们看过线性回归实现， softmax 回归的训练过程代码应该看起来非常眼熟。
在这里，我们重构训练过程的实现以使其可重复使用。首先，我们定义一个函数来训练一个迭代周期。**请注意，`updater` 是更新模型参数的常用函数，它接受批量大小作为参数。它可以是 `d2l.sgd` 函数，也可以是框架的内置优化函数。**

```python
def train_epoch_ch3(net, train_iter, loss, updater):  #@save
    """训练模型一个迭代周期（定义见第3章）"""
    # 将模型设置为训练模式
    if isinstance(net, torch.nn.Module):
        net.train()
    # 训练损失总和、训练准确度总和、样本数
    metric = Accumulator(3)
    for X, y in train_iter:
        # 计算梯度并更新参数
        y_hat = net(X)
        l = loss(y_hat, y)
        if isinstance(updater, torch.optim.Optimizer):
            # 使用PyTorch内置的优化器和损失函数
            updater.zero_grad()
            l.mean().backward()
            updater.step()
        else:
            # 使用定制的优化器和损失函数
            l.sum().backward()
            updater(X.shape[0])
        metric.add(float(l.sum()), accuracy(y_hat, y), y.numel())
    # 返回训练损失和训练精度
    return metric[0] / metric[2], metric[1] / metric[2]
```

在展示训练函数的实现之前，我们定义一个在动画中绘制数据的实用程序类`Animator`， 它能够简化本书其余部分的代码。
```python
class Animator:  #@save
    """在动画中绘制数据"""
    def __init__(self, xlabel=None, ylabel=None, legend=None, xlim=None,
                 ylim=None, xscale='linear', yscale='linear',
                 fmts=('-', 'm--', 'g-.', 'r:'), nrows=1, ncols=1,
                 figsize=(3.5, 2.5)):
        # 增量地绘制多条线
        if legend is None:
            legend = []
        d2l.use_svg_display()
        self.fig, self.axes = d2l.plt.subplots(nrows, ncols, figsize=figsize)
        if nrows * ncols == 1:
            self.axes = [self.axes, ]
        # 使用lambda函数捕获参数
        self.config_axes = lambda: d2l.set_axes(
            self.axes[0], xlabel, ylabel, xlim, ylim, xscale, yscale, legend)
        self.X, self.Y, self.fmts = None, None, fmts

    def add(self, x, y):
        # 向图表中添加多个数据点
        if not hasattr(y, "__len__"):
            y = [y]
        n = len(y)
        if not hasattr(x, "__len__"):
            x = [x] * n
        if not self.X:
            self.X = [[] for _ in range(n)]
        if not self.Y:
            self.Y = [[] for _ in range(n)]
        for i, (a, b) in enumerate(zip(x, y)):
            if a is not None and b is not None:
                self.X[i].append(a)
                self.Y[i].append(b)
        self.axes[0].cla()
        for x, y, fmt in zip(self.X, self.Y, self.fmts):
            self.axes[0].plot(x, y, fmt)
        self.config_axes()
        display.display(self.fig)
        display.clear_output(wait=True)
```

接下来我们实现一个**训练函数**，它会在 `train_iter` 访问到的训练数据集上训练一个模型 `net`。该训练函数将会运行多个迭代周期（由 `num_epochs` 指定）。在每个迭代周期结束时，利用 `test_iter` 访问到的测试数据集对模型进行评估。我们将利用 `Animator` 类来可视化训练进度。
```python
def train_ch3(net, train_iter, test_iter, loss, num_epochs, updater):  #@save
    """训练模型（定义见第3章）"""
    animator = Animator(xlabel='epoch', xlim=[1, num_epochs], ylim=[0.3, 0.9], legend=['train loss', 'train acc', 'test acc'])
    for epoch in range(num_epochs):
        train_metrics = train_epoch_ch3(net, train_iter, loss, updater) #训练损失和训练精度
        test_acc = evaluate_accuracy(net, test_iter)  #计算在指定数据集上模型的精度
        animator.add(epoch + 1, train_metrics + (test_acc,))
    train_loss, train_acc = train_metrics
    assert train_loss < 0.5, train_loss
    assert train_acc <= 1 and train_acc > 0.7, train_acc
    assert test_acc <= 1 and test_acc > 0.7, test_acc
```

接下来我们调用训练函数来训练模型。
```python
num_epochs = 10
d2l.train_ch3(net, train_iter, test_iter, loss, num_epochs, trainer)
```

![[output_softmax-regression-concise_75d138_66_0.svg]]

# 三、多层感知机
## 1 激活函数
- 多层感知机在输出层和输入层之间增加一个或多个全连接隐藏层，并通过激活函数转换隐藏层的输出。
- 常用的激活函数包括ReLU函数、sigmoid函数和tanh函数。

**激活函数**（activation function）通过计算加权和并加上偏置来确定神经元是否应该被激活，它们将输入信号转换为输出的可微运算。大多数激活函数都是非线性的。**激活函数的输出称作活性值**：
由于激活函数是深度学习的基础，下面简要介绍一些常见的激活函数。
```python
import torch
from d2l import torch as d2l
```
### RELU 函数
最受欢迎的激活函数是**修正线性单元（Rectified linear unit，ReLU）**，因为它实现简单，同时在各种预测任务中表现良好。
ReLU 提供了一种非常简单的非线性变换。给定元素 $x$，ReLU 函数被定义为该元素与 0 的最大值：
$$
ReLU(x)=\max(x,0)
$$ 
通俗地说，ReLU 函数通过将相应的活性值设为0，仅保留正元素并丢弃所有负元素。如图所示，激活函数是分段线性的。
```python
x = torch.arange(-8.0, 8.0, 0.1, requires_grad=True)
y = torch.relu(x) #ReLU函数
y.backward(torch.ones_like(x), retain_graph=True) #对ReLU求导
```

![[output_mlp_76f463_21_0.svg|327]]![[output_mlp_76f463_36_0.svg|340]]
当输入为负时，ReLU 函数的导数为0，而当输入为正时，ReLU 函数的导数为1。注意，当输入值精确等于0时，ReLU 函数不可导。在此时，我们默认使用左侧的导数，即当输入为0时导数为0。**我们可以忽略这种情况，因为输入可能永远都不会是0。**

**使用 ReLU 的原因是，它求导表现得特别好**：要么让参数消失，要么让参数通过。这使得优化表现得更好，并且 ReLU 减轻了困扰以往神经网络的**梯度消失**问题。

**注意，ReLU 函数有许多变体**，包括参数化 ReLU（Parameterized ReLU，pReLU） 函数 ([He _et al._, 2015]( http://zh.d2l.ai/chapter_references/zreferences.html#id59 "He, K., Zhang, X., Ren, S., & Sun, J. (2015). Delving deep into rectifiers: surpassing human-level performance on imagenet classification. Proceedings of the IEEE international conference on computer vision (pp. 1026–1034)."))。该变体为 ReLU 添加了一个线性项，因此即使参数是负的，某些信息仍然可以通过：
$$pReLU (x)=\max (x, 0)+\alpha \min(0,x)$$
### Sigmoid 函数
对于一个定义域在 $\mathbb{R}$ 中的输入， sigmoid 函数将输入变换为区间 $(0, 1)$ 上的输出。因此，sigmoid 通常称为**挤压函数**（squashing function）： 它将范围 $(-inf, inf)$ 中的任意输入压缩到区间 $(0, 1)$ 中的某个值：
$$
\operatorname{sigmoid}(x) = \frac{1}{1 + \exp(-x)}
$$
当人们逐渐关注到到基于梯度的学习时， sigmoid 函数是一个自然的选择，因为它是一个平滑的、可微的阈值单元近似。 
- 当我们想要将输出视作二元分类问题的概率时， sigmoid 仍然被广泛用作输出单元上的激活函数 （sigmoid 可以视为 softmax 的特例）。
- sigmoid 在隐藏层中已经较少使用，它在大部分时候被更简单、更容易训练的 ReLU 所取代。


```python
y = torch.sigmoid(x) #sigmoid函数

# 清除以前的梯度
x.grad.data.zero_()
y.backward(torch.ones_like(x),retain_graph=True) #导数
```
![[output_mlp_76f463_51_0.svg]] 
>注意，当输入接近 0 时，sigmoid 函数接近线性变换。

**sigmoid 函数的导数**为下面的公式：
$$
\frac{d}{dx} \operatorname{sigmoid}(x) = \frac{\exp(-x)}{(1 + \exp(-x))^2} = \operatorname{sigmoid}(x)\left(1-\operatorname{sigmoid}(x)\right).
$$
sigmoid 函数的导数图像如下所示。注意，当输入为0时，sigmoid 函数的导数达到最大值0.25；而输入在任一方向上越远离0点时，导数越接近0。

![[output_mlp_76f463_66_0.svg]]当sigmoid函数的输入很大或是很小时，它的梯度都会消失**。 此外，当反向传播通过许多层时，除非我们在刚刚好的地方， 这些地方sigmoid函数的输入接近于零，否则整个乘积的梯度可能会消失。 当我们的网络有很多层时，除非我们很小心，否则在某一层可能会切断梯度。 事实上，这个问题曾经困扰着深度网络的训练。 **因此，更稳定的ReLU系列函数已经成为从业者的默认选择**（虽然在神经科学的角度看起来不太合理）。 ^rb6csu

### tanh 函数
与 sigmoid 函数类似， **tanh(双曲正切)函数**也能将其输入压缩转换到区间(-1, 1)上。 tanh 函数的公式如下：
$$
\operatorname{tanh}(x) = \frac{1 - \exp(-2x)}{1 + \exp(-2x)}
$$

![[output_mlp_76f463_81_0.svg]]
注意，当输入在0附近时，tanh 函数接近线性变换。函数的形状类似于 sigmoid 函数，不同的是 tanh 函数关于坐标系原点中心对称。

tanh 函数的导数是：
$$
\frac{d}{dx} \operatorname{tanh}(x) = 1 - \operatorname{tanh}^2(x)
$$
tanh函数的导数图像如下所示。 当输入接近0时，tanh函数的导数接近最大值1。 与我们在sigmoid函数图像中看到的类似， 输入在任一方向上越远离0点，导数越接近0。

```python
y = torch.tanh(x)

# 清除以前的梯度
x.grad.data.zero_()
y.backward(torch.ones_like(x),retain_graph=True) #倒数
```

![[output_mlp_76f463_96_0.svg]]

## 2 多层感知机的实现
- 对于相同的分类问题，多层感知机的实现与 softmax 回归的实现相同，只是多层感知机的实现里增加了带有激活函数的隐藏层。

为了与之前softmax回归（ [3.6节](http://zh.d2l.ai/chapter_linear-networks/softmax-regression-scratch.html#sec-softmax-scratch) ） 获得的结果进行比较， 我们将继续使用Fashion-MNIST图像分类数据集 （ [3.5节](http://zh.d2l.ai/chapter_linear-networks/image-classification-dataset.html#sec-fashion-mnist)）。
```python
import torch
from torch import nn
from d2l import torch as d2l

batch_size = 256
train_iter, test_iter = d2l.load_data_fashion_mnist(batch_size)
```

### 定义模型 `net()`

回想一下，Fashion-MNIST 中的每个图像由 $28×28=784$ 个灰度像素值组成。所有图像共分为 $10$ 个类别。忽略像素之间的空间结构，我们可以将每个图像视为具有 $784$ 个输入特征和 $10$ 个类的简单分类数据集。
**首先，我们将实现一个具有单隐藏层的多层感知机，它包含 $256$ 个隐藏单元**。注意，我们可以将这两个变量都视为**超参数**。**通常，我们选择 $2$ 的若干次幂作为层的宽度。因为内存在硬件中的分配和寻址方式，这么做往往可以在计算上更高效。** 

与 softmax 回归的实现相比，唯一的区别是我们添加了2个全连接层（之前我们只添加了1个全连接层）。
- 第一层是隐藏层，它包含256个隐藏单元，并使用了 ReLU 激活函数。
- 第二层是输出层。

```python
net = nn.Sequential(nn.Flatten(),
                    nn.Linear(784, 256),
                    nn.ReLU(), #激活函数
                    nn.Linear(256, 10))

def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, std=0.01)

net.apply(init_weights);
```
### 训练
训练过程的实现与我们实现 softmax 回归时完全相同，可以直接调用 `d2l` 包的 `train_ch3` 函数（参见 [3.6节](http://zh.d2l.ai/chapter_linear-networks/softmax-regression-scratch.html#sec-softmax-scratch) ），将迭代周期数设置为10，并将学习率设置为0.1。
这种模块化设计使我们能够将与模型架构有关的内容独立出来。

```python
batch_size, lr, num_epochs = 256, 0.1, 10
loss = nn.CrossEntropyLoss(reduction='none') #损失函数：交叉熵损失
trainer = torch.optim.SGD(net.parameters(), lr=lr) #优化算法

train_iter, test_iter = d2l.load_data_fashion_mnist(batch_size)
d2l.train_ch3(net, train_iter, test_iter, loss, num_epochs, trainer)
```

## 3 模型选择、欠拟合和过拟合
- **过拟合（overfitting）**：将模型在训练数据上拟合的比在潜在分布中更接近的现象称为，用于对抗过拟合的技术称为**正则化（regularization）**。 
    - 在实验中调整模型架构或超参数时会发现： 如果有足够多的神经元、层数和训练迭代周期，模型最终可以在训练集上达到完美的精度，此时测试集的准确性却下降了。
- **训练误差（training error）**：模型在训练数据集上计算得到的误差
- **泛化误差（generalization error）**：模型应用在同样从原始样本的分布中抽取的无限多数据样本时，模型误差的期望。
    - 我们永远不能准确地计算出泛化误差。这是因为无限多的数据样本是一个虚构的对象。**在实际中，我们只能通过将模型应用于一个独立的测试集来估计泛化误差**，该测试集由随机选取的、未曾在训练集中出现的数据样本构成。

- **独立同分布假设**：在我们目前已探讨、并将在之后继续探讨的监督学习情景中，我们假设训练数据和测试数据都是从相同的分布中独立提取的。这通常被称为**独立同分布假设**（i.i.d. assumption），这意味着对数据进行采样的过程没有进行“记忆”。换句话说，抽取的第2个样本和第3个样本的相关性，并不比抽取的第2个样本和第200万个样本的相关性更强。
    - 有时候我们即使轻微违背独立同分布假设，模型仍将继续运行得非常好。
    - 有些违背独立同分布假设的行为肯定会带来麻烦
    - 当我们训练模型时，我们试图找到一个能够尽可能拟合训练数据的函数。但是如果它执行地“太好了”，而不能对看不见的数据做到很好泛化，就会导致过拟合。这种情况正是我们想要避免或控制的。深度学习中有许多启发式的技术旨在防止过拟合。

### 模型复杂性
 
模型复杂性由什么构成是一个复杂的问题。一个模型是否能很好地泛化取决于很多因素。例如，具有更多参数的模型可能被认为更复杂，参数有更大取值范围的模型可能更为复杂。**通常对于神经网络，我们认为需要更多训练迭代的模型比较复杂，而需要早停（early stopping）的模型（即较少训练迭代周期）就不那么复杂。**
- 统计学家认为，能够轻松解释任意事实的模型是复杂的，而表达能力有限但仍能很好地解释数据的模型可能更有现实用途。
- 如果一个理论能拟合数据，且有具体的测试可以用来证明它是错误的，那么它就是好的。

### 模型选择
在机器学习中，我们通常在**评估几个候选模型后选择最终的模型**。 这个过程叫做**模型选择**。
例如，训练多层感知机模型时，我们可能希望比较具有不同数量的隐藏层、不同数量的隐藏单元以及不同的激活函数组合的模型。 **为了确定候选模型中的最佳模型，我们通常会使用验证集。**
#### 验证集
**原则上，在我们确定所有的超参数之前，我们不希望用到测试集。** 如果我们在模型选择过程中使用测试数据，可能会有过拟合测试数据的风险，那就麻烦大了。
>如果我们过拟合了训练数据，还可以在测试数据上的评估来判断过拟合。但是如果我们过拟合了测试数据，我们又该怎么知道呢？

**因此，我们决不能依靠测试数据进行模型选择**。 然而，**我们也不能仅仅依靠训练数据来选择模型，因为我们无法估计训练数据的泛化误差。**

在实际应用中，情况变得更加复杂。 虽然理想情况下我们只会使用测试数据一次， 以评估最好的模型或比较一些模型效果，但现实是测试数据很少在使用一次后被丢弃。 **我们很少能有充足的数据来对每一轮实验采用全新测试集。**

**解决此问题的常见做法是将我们的数据分成三份**，除了训练和测试数据集之外，还**增加一个验证数据集（validation dataset），也叫验证集（validation set）**。但现实是验证数据和测试数据之间的边界模糊得令人担忧。除非另有明确说明，**否则在这本书的实验中，我们实际上是在使用应该被正确地称为训练数据和验证数据的数据集，并没有真正的测试数据集。因此，书中每次实验报告的准确度都是验证集准确度，而不是测试集准确度。**

#### K 折折交叉验证
**当训练数据稀缺时，我们甚至可能无法提供足够的数据来构成一个合适的验证集。这个问题的一个流行的解决方案是采用 K 折交叉验证。**
这里，原始训练数据被分成 K 个不重叠的子集。然后执行 K 次模型训练和验证，每次在 K−1个子集上进行训练，并在剩余的一个子集（在该轮中没有用于训练的子集）上进行验证。最后，通过对 K 次实验的结果取平均来估计训练和验证误差。
### 欠拟合/过拟合

当我们比较训练和验证误差时，我们要注意两种常见的情况。
1. **训练误差和验证误差都很严重，但它们之间仅有一点差距。** 
    - 如果模型不能降低训练误差，这可能意味着模型过于简单（即表达能力不足），无法捕获试图学习的模式。
    - 此外，由于我们的训练和验证误差之间的泛化误差很小，我们有理由相信可以用一个更复杂的模型降低训练误差。这种现象被称为**欠拟合**（underfitting）。
2. **训练误差明显低于验证误差时要小心，这表明严重的过拟合（overfitting）**。注意，过拟合并不总是一件坏事。特别是在深度学习领域，众所周知，最好的预测模型在训练数据上的表现往往比在保留（验证）数据上好得多。**最终，我们通常更关心验证误差，而不是训练误差和验证误差之间的差距。**

**是否过拟合或欠拟合可能取决于模型复杂性和可用训练数据集的大小**。
- **模型复杂性**：高阶多项式函数比低阶多项式函数复杂得多。高阶多项式的参数较多，模型函数的选择范围较广。因此在固定训练数据集的情况下，**高阶多项式函数相对于低阶多项式的训练误差应该始终更低（最坏也是相等）** 。**事实上，当数据样本包含了 x  的不同值时，函数阶数等于数据样本数量的多项式函数可以完美拟合训练集。**
![[capacity-vs-error.svg]] 
>模型复杂度对欠拟合和过拟合的影响
- **数据集大小**： **训练数据集中的样本越少，我们就越有可能（且更严重地）过拟合**。随着训练数据量的增加，泛化误差通常会减小，一般来说更多的数据不会有什么坏处。对于固定的任务和数据分布，模型复杂性和数据集大小之间通常存在关系。 给出更多的数据，我们可能会尝试拟合一个更复杂的模型。 能够拟合更复杂的模型可能是有益的。 如果没有足够的数据，简单的模型可能更有用。 对于许多任务，深度学习只有在有数千个训练样本时才优于线性模型。 

## 4 正则化模型-对抗过拟合
本节我们将介绍一些**正则化模型**的技术。 **我们总是可以通过去收集更多的训练数据来缓解过拟合。但这可能成本很高，耗时颇多，或者完全超出我们的控制，因而在短期内不可能做到**。 
假设我们已经拥有尽可能多的高质量数据，我们便可以将重点放在正则化技术上。

在多项式回归的例子（ [4.4节](http://zh.d2l.ai/chapter_multilayer-perceptrons/underfit-overfit.html#sec-model-selection)）中，我们可以通过调整拟合多项式的阶数来限制模型的容量。实际上，限制特征的数量是缓解过拟合的一种常用技术。然而，简单地丢弃特征对这项工作来说可能过于生硬。
仅仅通过简单的限制特征数量（在多项式回归中体现为限制阶数），可能仍然使模型在过简单和过复杂中徘徊，我们需要一个**更细粒度的工具来调整函数的复杂性，使其达到一个合适的平衡位置**。
### 范数与权重衰减

> [!NOTE] 约定
> 在这本书中，我们将默认使用简单的启发式方法，即在深层网络的所有层上应用权重衰减。

在训练参数化机器学习模型时， **_权重衰减_（weight decay）是最广泛使用的正则化的技术**之一，它通常也被称为 $L_2$ 正则化。这项技术通过函数与零的距离来衡量函数的复杂度

- 正则化是处理过拟合的常用方法：**在训练集的损失函数中加入惩罚项，以降低学习到的模型的复杂度。**
- 保持模型简单的一个特别的选择是使用 $L_2$ 惩罚的权重衰减。这会导致学习算法更新步骤中的权重衰减。

- 权重衰减功能在深度学习框架的优化器中提供。
由于权重衰减在神经网络优化中很常用，深度学习框架为了便于我们使用权重衰减，将权重衰减集成到优化算法中，以便与任何损失函数结合使用。此外，这种集成还有计算上的好处，允许在不增加任何额外的计算开销的情况下向算法中添加权重衰减。由于更新的权重衰减部分仅依赖于每个参数的当前值，因此优化器必须至少接触每个参数一次。

在下面的代码中，我们在**实例化优化器时直接通过 `weight_decay` 指定 weight decay 超参数**。**默认情况下，PyTorch 同时衰减权重和偏移。** 这里我们只为权重设置了 `weight_decay`，所以偏置参数 $b$ 不会衰减。
```python h:9
def train_concise(wd): #wd为衰减参数
    net = nn.Sequential(nn.Linear(num_inputs, 1))
    for param in net.parameters():
        param.data.normal_()
    loss = nn.MSELoss(reduction='none')
    num_epochs, lr = 100, 0.003
    # 偏置参数没有衰减
    trainer = torch.optim.SGD([
        {"params":net[0].weight,'weight_decay': wd},
        {"params":net[0].bias}], lr=lr)
    animator = d2l.Animator(xlabel='epochs', ylabel='loss', yscale='log',
                            xlim=[5, num_epochs], legend=['train', 'test'])
    for epoch in range(num_epochs):
        for X, y in train_iter:
            trainer.zero_grad()
            l = loss(net(X), y)
            l.mean().backward()
            trainer.step()
        if (epoch + 1) % 5 == 0:
            animator.add(epoch + 1,
                         (d2l.evaluate_loss(net, train_iter, loss),
                          d2l.evaluate_loss(net, test_iter, loss)))
    print('w的L2范数：', net[0].weight.norm().item())
```

```python
#禁用权重衰减，
train_concise(0)
#w的L2范数： 13.727912902832031

#开启权重衰减
train_concise(3
#的L2范数： 0.3890590965747833
```

### 暂退法（Dropout）
- 暂退法在前向传播过程中，计算每一内部层的同时丢弃一些神经元。
- 暂退法可以避免过拟合，它通常与控制权重向量的维数和大小结合使用的。
- 暂退法将活性值ℎ替换为具有期望值ℎ的随机变量。
- 暂退法仅在训练期间使用。

暂退法在前向传播过程中，计算每一内部层的同时注入噪声，这已经成为训练神经网络的常用技术。

这种方法之所以被称为暂退法，因为我们**从表面上看是在训练过程中丢弃（drop out）一些神经元**。在整个训练过程的**每一次迭代中，标准暂退法包括在计算下一层之前将当前层中的一些节点置零。**

关键的挑战就是如何注入这种噪声。一种想法是以一种无偏向（unbiased）的方式注入噪声。这样在固定住其他层时，每一层的期望值等于没有噪音时的值。

回想一下带有1个隐藏层和5个隐藏单元的多层感知机。当我们将暂退法应用到隐藏层，以 $p$ 的概率将隐藏单元置为零时，结果可以看作一个只包含原始神经元子集的网络。
如图，删除了ℎ2和ℎ5，因此输出的计算不再依赖于ℎ2或ℎ5，并且它们各自的梯度在执行反向传播时也会消失。这样，输出层的计算不能过度依赖于ℎ1,…,ℎ5的任何一个元素

![[dropout2.svg]]

**通常，我们在测试时不用暂退法。给定一个训练好的模型和一个新的样本，我们不会丢弃任何节点，因此不需要标准化。** 然而也有一些例外：一些研究人员在测试时使用暂退法，用于估计神经网络预测的“不确定性”： 如果通过许多不同的暂退法遮盖后得到的预测结果都是一致的，那么我们可以说网络发挥更稳定。

对于深度学习框架的高级 API，我们只需在每个全连接层之后添加一个 `Dropout` 层，将暂退概率作为唯一的参数传递给它的构造函数。在训练时，`Dropout` 层将根据指定的暂退概率随机丢弃上一层的输出（相当于下一层的输入）。**在测试时，`Dropout` 层仅传递数据。**

```python
net = nn.Sequential(nn.Flatten(),
        nn.Linear(784, 256),
        nn.ReLU(),
        # 在第一个全连接层之后添加一个dropout层
        nn.Dropout(dropout1),
        nn.Linear(256, 256),
        nn.ReLU(),
        # 在第二个全连接层之后添加一个dropout层
        nn.Dropout(dropout2),
        nn.Linear(256, 10))

def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, std=0.01)

net.apply(init_weights);
```

接下来，我们对模型进行训练和测试。
```python
trainer = torch.optim.SGD(net.parameters(), lr=lr)
d2l.train_ch3(net, train_iter, test_iter, loss, num_epochs, trainer)
```

![[output_dropout_1110bf_96_0.svg]]

## 5 数值稳定性和模型初始化
**初始化方案的选择在神经网络学习中起着举足轻重的作用，它对保持数值稳定性至关重要。**  此外，这些初始化方案的选择可以与非线性激活函数的选择有趣的结合在一起。我们选择哪个函数以及如何初始化参数可以决定优化算法收敛的速度有多快。糟糕选择可能会导致我们在训练时遇到梯度爆炸或梯度消失。

### 梯度爆炸/梯度消失
**梯度爆炸**（gradient exploding）： 参数更新过大，破坏了模型的稳定收敛；
**梯度消失**（gradient vanishing）： 参数更新过小，在每次更新时几乎不会移动，导致模型无法学习。
- 梯度消失示例：Sigmoid 函数导数图像如下
![[Pytorch精粹#^rb6csu]]

### 打破对称性
- 梯度消失和梯度爆炸是深度网络中常见的问题。在参数初始化时需要非常小心，以确保梯度和参数可以得到很好的控制。
- 需要用启发式的初始化方法来确保初始梯度既不太大也不太小。
- ReLU激活函数缓解了梯度消失问题，这样可以加速收敛。
- 随机初始化是保证在进行优化前打破对称性的关键。

**神经网络设计中的另一个问题是其参数化所固有的对称性**。假设我们有一个简单的多层感知机，它有一个隐藏层和两个隐藏单元。在这种情况下，我们可以对第一层的权重 $W^{(1)}$ 进行重排列，并且同样对输出层的权重进行重排列，可以获得相同的函数。第一个隐藏单元与第二个隐藏单元没有什么特别的区别。**换句话说，我们在每一层的隐藏单元之间具有排列对称性。**
假设输出层将上述两个隐藏单元的多层感知机转换为仅一个输出单元。想象一下，如果我们将隐藏层的所有参数初始化为 $\mathbf{W}^{(1)} = c$， $c$ 为常量，会发生什么？ 在这种情况下，在前向传播期间，两个隐藏单元采用相同的输入和参数，产生相同的激活，该激活被送到输出单元。在反向传播期间，根据参数 $\mathbf{W}^{(1)}$ 对输出单元进行微分，得到一个梯度，其元素都取相同的值。因此，在基于梯度的迭代（例如，小批量随机梯度下降）之后， $\mathbf{W}^{(1)}$ 的所有元素仍然采用相同的值。这样的迭代永远不会打破对称性，**我们可能永远也无法实现网络的表达能力。隐藏层的行为就好像只有一个单元**。**请注意，虽然小批量随机梯度下降不会打破这种对称性，但暂退法正则化可以。**

虽然小批量随机梯度下降不会打破这种对称性，但暂退法正则化可以。
### 参数初始化
解决（或至少减轻）上述问题的一种方法是进行参数初始化，优化期间的注意和适当的正则化也可以进一步提高稳定性。
#### 默认初始化
在前面的部分中，前文我们多次使用正态分布来初始化权重值。**如果我们不指定初始化方法，框架将使用默认的随机初始化方法，对于中等难度的问题，这种方法通常很有效。**
#### Xavier 初始化
略
- Xavier初始化表明，对于每一层，输出的方差不受输入数量的影响，任何梯度的方差不受输出数量的影响。

深度学习框架通常实现十几种不同的启发式方法。此外，参数初始化一直是深度学习基础研究的热点领域。其中包括专门用于参数绑定（共享）、超分辨率、序列模型和其他情况的启发式算法。

# 四、深度学习计算
## 1 层和块
- 一个块可以由许多层组成；一个块可以由许多块组成。
- 块可以包含代码。
- 块负责大量的内部处理，包括参数初始化和反向传播。
- 层和块的顺序连接由 `Sequential` 块处理。

对于多层感知机而言，整个模型及其组成层都是这种架构： 整个模型接受原始输入（特征），生成输出（预测），并包含一些参数（所有组成层的参数集合）。同样，每个单独的层接收输入（由前一层提供），生成输出（到下一层的输入），并且具有一组可调参数，这些参数根据从下一层反向传播的信号进行更新。
为了实现这些复杂的网络，我们引入了神经网络**块**的概念。 **块（block）可以描述单个层、由多个层组成的组件或整个模型本身。** 使用块进行抽象的一个好处是可以将一些块组合成更大的组件，这一过程通常是递归的，如 [图5.1.1](http://zh.d2l.ai/chapter_deep-learning-computation/model-construction.html#fig-blocks) 所示。通过定义代码来按需生成任意复杂度的块，我们可以通过简洁的代码实现复杂的神经网络。
![[blocks.svg]]
>多个层被组合成块，形成更大的模型

**从编程的角度来看，块由类（class）表示。它的任何子类都必须定义一个将其输入转换为输出的前向传播函数，并且必须存储任何必需的参数。** 注意，有些块不需要任何参数。 **最后，为了计算梯度，块必须具有反向传播函数。在定义我们自己的块时，由于自动微分提供了一些后端实现，我们只需要考虑前向传播函数和必需的参数。**

在构造自定义块之前，我们先回顾一下多层感知机的代码。下面的代码生成一个网络，其中包含一个具有256个单元和 **ReLU 激活函数**的**全连接隐藏层**，然后是一个具有10个隐藏单元且**不带激活函数**的**全连接输出层**。


```python
import torch
from torch import nn
from torch.nn import functional as F

net = nn.Sequential(nn.Linear(20, 256), nn.ReLU(), nn.Linear(256, 10))

X = torch.rand(2, 20)
net(X)
```

在这个例子中，我们通过实例化 `nn.Sequential` 来构建我们的模型，层的执行顺序是作为参数传递的。 **简而言之，`nn.Sequential` 定义了一种特殊的 `Module`，即在 PyTorch 中表示一个块的类，它维护了一个由 `Module` 组成的有序列表。** 注意，**两个全连接层都是 `Linear` 类的实例， `Linear` 类本身就是 `Module` 的子类。** 
另外，到目前为止，我们一直在通过 `net(X)` 调用我们的模型来获得模型的输出。这实际上是 `net.__call__(X)` 的简写。 **这个前向传播函数非常简单： 它将列表中的每个块连接在一起，将每个块的输出作为下一个块的输入。**
### 自定义块
**每个块必须提供的基本功能：**
1. 将输入数据作为其前向传播函数的参数。
2. 通过前向传播函数来生成输出。请注意，输出的形状可能与输入的形状不同。例如，我们上面模型中的第一个全连接的层接收一个20维的输入，但是返回一个维度为256的输出。
3. 计算其输出关于输入的梯度，可通过其反向传播函数进行访问。通常这是**自动发生**的。
4. 存储和访问前向传播计算所需的参数。
5. 根据需要初始化模型参数。

在下面的代码片段中，我们从零开始编写一个块。它包含一个多层感知机，其具有256个隐藏单元的隐藏层和一个10维输出层。**注意，下面的 `MLP` 类继承了表示块的类 `nn.Module`。我们的实现只需要提供我们自己的构造函数（Python 中的 `__init__` 函数）和前向传播函数。**
注意，除非我们实现一个新的运算符，否则我们不必担心反向传播函数或参数初始化，系统将自动生成这些。

```python
class MLP(nn.Module):
    # 用模型参数声明层。这里，我们声明两个全连接的层
    def __init__(self):
        # 调用MLP的父类Module的构造函数来执行必要的初始化。
        # 这样，在类实例化时也可以指定其他函数参数，例如模型参数params（稍后将介绍）
        super().__init__()
        self.hidden = nn.Linear(20, 256)  # 全连接隐藏层
        self.out = nn.Linear(256, 10)  # 全连接输出层

    # 定义模型的前向传播，即如何根据输入X返回所需的模型输出
    def forward(self, X):
        # 注意，这里我们使用ReLU的函数版本，其在nn.functional模块中定义。
        # 这里隐藏层使用relu激活函数，输出层不使用激活函数，最后只需要输出最终计算结果
        return self.out(F.relu(self.hidden(X)))
```

```python
net = MLP()
net(X)

###
tensor([[ 0.0669,  0.2202, -0.0912, -0.0064,  0.1474, -0.0577, -0.3006,  0.1256, -0.0280,  0.4040],
        [ 0.0545,  0.2591, -0.0297,  0.1141,  0.1887,  0.0094, -0.2686,  0.0732, -0.0135,  0.3865]], grad_fn=<AddmmBackward0>)
```

块的一个主要优点是它的多功能性。我们可以子类化块以创建层（如全连接层的类）、整个模型（如上面的 `MLP` 类）或具有中等复杂度的各种组件。

### 顺序快
现在我们可以更仔细地看看 `Sequential` 类是如何工作的， **`Sequential` 的设计是为了把其他模块串起来**。
为了构建我们自己的简化的 `MySequential`，我们只需要定义两个关键函数：
1. 一种将块逐个追加到列表中的函数；
2. 一种前向传播函数，用于将输入按追加块的顺序传递给块组成的“链条”。

下面的 `MySequential` 类提供了与默认 `Sequential` 类相同的功能。
```python
class MySequential(nn.Module):
    # 每个模块逐个添加到有序字典 _modules 中
    def __init__(self, *args):
        super().__init__()
        for idx, module in enumerate(args):
            # 这里，module是Module子类的一个实例。我们把它保存在'Module'类的成员
            # 变量_modules中。_module的类型是OrderedDict
            self._modules[str(idx)] = module

    # 前向传播函数被调用时，每个添加的块都按照它们被添加的顺序执行。
    def forward(self, X):
        # OrderedDict保证了按照成员添加的顺序遍历它们
        for block in self._modules.values():
            X = block(X)
        return X
```

> [!question] 为什么使用 `_modules` 存储 module 而不是自己定义一个 Python 列表？
> `_modules` 的主要优点是： 在模块的参数初始化过程中，系统知道在 `_modules` 字典中查找需要初始化参数的子块。

现在可以使用我们的 `MySequential` 类重新实现多层感知机。
```python
net = MySequential(nn.Linear(20, 256), nn.ReLU(), nn.Linear(256, 10))
net(X)

###
tensor([[ 2.2759e-01, -4.7003e-02,  4.2846e-01, -1.2546e-01,  1.5296e-01, 1.8972e-01,  9.7048e-02,  4.5479e-04, -3.7986e-02,  6.4842e-02],
        [ 2.7825e-01, -9.7517e-02,  4.8541e-01, -2.4519e-01, -8.4580e-02, 2.8538e-01,  3.6861e-02,  2.9411e-02, -1.0612e-01,  1.2620e-01]],
       grad_fn=<AddmmBackward0>)
```

### 在前向传播函数中执行代码

`Sequential` 类使模型构造变得简单，允许我们组合新的架构，而不必定义自己的类。 **然而，并不是所有的架构都是简单的顺序架构。当需要更强的灵活性时，我们需要定义自己的块**。
例如，我们可能希望在前向传播函数中执行 Python 的控制流。此外，我们可能希望执行任意的数学运算，而不是简单地依赖预定义的神经网络层。

到目前为止， 我们网络中的所有操作都对网络的激活值及网络的参数起作用。 然而，**有时我们可能希望合并既不是上一层的结果也不是可更新参数的项， 我们称之为常数参数**
例如，我们需要一个计算函数 $f(\mathbf{x},\mathbf{w}) = c \cdot \mathbf{w}^\top \mathbf{x}$ 的层，其中 $x$ 是输入，$w$ 是参数，$c$ 是是某个在优化过程中没有更新的指定常量。因此我们实现了一个 `FixedHiddenMLP` 类，如下所示：

```python
class FixedHiddenMLP(nn.Module):
    def __init__(self):
        super().__init__()
        
        # 不计算梯度的随机权重参数。因此其在训练期间保持不变
        self.rand_weight = torch.rand((20, 20), requires_grad=False)

        self.linear = nn.Linear(20, 20)

    def forward(self, X):
        X = self.linear(X)
        # 使用创建的常量参数以及relu和mm函数
        X = F.relu(torch.mm(X, self.rand_weight) + 1)
        # 复用全连接层。这相当于两个全连接层共享参数
        X = self.linear(X)
        # 控制流
        # 注意，此操作可能不会常用于在任何实际任务中， 我们只展示如何将任意代码集成到神经网络计算的流程中。
        while X.abs().sum() > 1:
            X /= 2
        return X.sum()
```

```python
net = FixedHiddenMLP()
net(X)

###
tensor(0.1862, grad_fn=<SumBackward0>)
```

### 嵌套块
我们可以混合搭配各种组合块的方法。在下面的例子中，我们以一些想到的方法嵌套块。
```python
# 块中有两个层
class NestMLP(nn.Module):
    def __init__(self):
        super().__init__()
        # 层1
        self.net = nn.Sequential(nn.Linear(20, 64), nn.ReLU(),
                                 nn.Linear(64, 32), nn.ReLU())
        # 层2
        self.linear = nn.Linear(32, 16)

    def forward(self, X):
        return self.linear(self.net(X))

# 顺序快组合所有块
chimera = nn.Sequential(NestMLP(), nn.Linear(16, 20), FixedHiddenMLP())
chimera(X)
```

## 2 参数管理
在选择了架构并设置了超参数后，我们就进入了训练阶段。此时，我们的目标是找到使损失函数最小化的模型参数值。经过训练后，我们将需要使用这些参数来做出未来的预测。
此外，有时我们希望提取参数，以便在其他环境中复用它们，将模型保存下来，以便它可以在其他软件中执行，或者为了获得科学的理解而进行检查。
之前的介绍中，我们只依靠深度学习框架来完成训练的工作，而忽略了操作参数的具体细节。本节，我们将介绍以下内容：
- 访问参数，用于调试、诊断和可视化；
- 参数初始化；
- 在不同模型组件间共享参数。

我们首先看一下具有单隐藏层的多层感知机。

```python
import torch
from torch import nn

net = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 1))
X = torch.rand(size=(2, 4))
net(X)

###
tensor([[-0.0970],
        [-0.0827]], grad_fn=<AddmmBackward0>)
```

### 参数访问
我们从已有模型中访问参数。 **当通过 `Sequential` 类定义模型时，我们可以通过索引来访问模型的任意层**。这就像模型是一个列表一样，每层的参数都在其属性中。

如下所示，我们可以**检查第二个全连接层的参数。**

```python
print(net[2].state_dict())

###
OrderedDict([('weight', tensor([[-0.0427, -0.2939, -0.1894,  0.0220, -0.1709, -0.1522, -0.0334, -0.2263]])), ('bias', tensor([0.0887]))])
```

输出的结果告诉我们一些重要的事情： 首先，这个全连接层包含两个参数，分别是该层的权重和偏置。两者都存储为单精度浮点数（float32）。注意，参数名称允许唯一标识每个参数，即使在包含数百个层的网络中也是如此。

#### 目标参数
**注意，每个参数都表示为参数类的一个实例。要对参数执行任何操作，首先我们需要访问底层的数值**。有几种方法可以做到这一点。有些比较简单，而另一些则比较通用。 
下面的代码从第二个全连接层（即第三个神经网络层）提取偏置，提取后返回的是一个参数类实例，并进一步**访问该参数的值**。

```python
print(type(net[2].bias))
print(net[2].bias)
print(net[2].bias.data)

###
<class 'torch.nn.parameter.Parameter'>
Parameter containing:
tensor([0.0887], requires_grad=True)
tensor([0.0887])
```

参数是复合的对象，包含值、梯度和额外信息。这就是我们需要显式参数值的原因。

除了值之外，我们还可以**访问每个参数的梯度**。在上面这个网络中，由于我们还没有调用反向传播，所以参数的梯度处于初始状态。

```python
net[2].weight.grad == None

###
True
```

#### 一次性访问所有参数
当我们处理更复杂的块（例如，嵌套块）时，情况可能会变得特别复杂，因为我们需要递归整个树来提取每个子块的参数。

下面，我们将通过演示来**比较访问第一个全连接层的参数和访问所有层。**

```python
# 访问第一个全连接层
print(*[(name, param.shape) for name, param in net[0].named_parameters()])
###
('weight', torch.Size([8, 4])) ('bias', torch.Size([8]))

#访问所有层
print(*[(name, param.shape) for name, param in net.named_parameters()])
###
('0.weight', torch.Size([8, 4])) ('0.bias', torch.Size([8])) ('2.weight', torch.Size([1, 8])) ('2.bias', torch.Size([1]))
```

>自动给权重和编制编号 `x.`

这为我们提供了另一种访问网络参数的方式，如下所示。

```python
net.state_dict()['2.bias'].data

tensor([0.0887])
```

#### 从嵌套块收集参数
如果我们将多个块相互嵌套，参数命名约定是如何工作的？

我们首先定义一个生成块的函数（可以说是“块工厂”），然后将这些块组合到更大的块中。
```python
def block1():
    return nn.Sequential(nn.Linear(4, 8), nn.ReLU(),
                         nn.Linear(8, 4), nn.ReLU())

def block2():
    net = nn.Sequential()
    for i in range(4):
        # 在这里嵌套
        net.add_module(f'block {i}', block1())
    return net

rgnet = nn.Sequential(block2(), nn.Linear(4, 1))
rgnet(X)

###
tensor([[0.2596],
        [0.2596]], grad_fn=<AddmmBackward0>)
```

设计了网络后，我们看看它是如何工作的。
```python
print(rgnet)

###
Sequential(
  (0): Sequential(
    (block 0): Sequential(
      (0): Linear(in_features=4, out_features=8, bias=True)
      (1): ReLU()
      (2): Linear(in_features=8, out_features=4, bias=True)
      (3): ReLU()
    )
    (block 1): Sequential(
      (0): Linear(in_features=4, out_features=8, bias=True)
      (1): ReLU()
      (2): Linear(in_features=8, out_features=4, bias=True)
      (3): ReLU()
    )
    (block 2): Sequential(
      (0): Linear(in_features=4, out_features=8, bias=True)
      (1): ReLU()
      (2): Linear(in_features=8, out_features=4, bias=True)
      (3): ReLU()
    )
    (block 3): Sequential(
      (0): Linear(in_features=4, out_features=8, bias=True)
      (1): ReLU()
      (2): Linear(in_features=8, out_features=4, bias=True)
      (3): ReLU()
    )
  )
  (1): Linear(in_features=4, out_features=1, bias=True)
)
```

因为层是分层嵌套的，所以我们也可以像通过嵌套列表索引一样访问它们。下面，我们访问第一个主要的块中、第二个子块的第一层的偏置项。

```python
rgnet[0][1][0].bias.data

###
tensor([ 0.1999, -0.4073, -0.1200, -0.2033, -0.1573,  0.3546, -0.2141, -0.2483])
```

### 参数初始化
深度学习框架提供默认随机初始化，也允许我们创建自定义初始化方法，满足我们通过其他规则实现初始化权重。

**默认情况下，PyTorch 会根据一个范围均匀地初始化权重和偏置矩阵，这个范围是根据输入和输出维度计算出的。 PyTorch 的 `nn.init` 模块提供了多种预置初始化方法。**
#### 内置初始化
让我们首先调用内置的初始化器。下面的代码**将所有权重参数初始化为标准差为0.01的高斯随机变量，且将偏置参数设置为0。**

```python
def init_normal(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, mean=0, std=0.01)
        nn.init.zeros_(m.bias)
net.apply(init_normal)
net[0].weight.data[0], net[0].bias.data[0]

###
(tensor([-0.0214, -0.0015, -0.0100, -0.0058]), tensor(0.))
```

我们还可以**将所有参数初始化为给定的常数，比如初始化为1。**
```python
def init_constant(m):
    if type(m) == nn.Linear:
        nn.init.constant_(m.weight, 1)
        nn.init.zeros_(m.bias)
net.apply(init_constant)
net[0].weight.data[0], net[0].bias.data[0]

###
(tensor([1., 1., 1., 1.]), tensor(0.))
```


我们还可以**对某些块应用不同的初始化方法**。例如，下面我们使用 **Xavier 初始化**方法初始化第一个神经网络层，然后将第三个神经网络层初始化为常量值42。

```python
def init_xavier(m):
    if type(m) == nn.Linear:
        nn.init.xavier_uniform_(m.weight)
def init_42(m):
    if type(m) == nn.Linear:
        nn.init.constant_(m.weight, 42)

net[0].apply(init_xavier)
net[2].apply(init_42)
print(net[0].weight.data[0])
print(net[2].weight.data)

###
tensor([ 0.5236,  0.0516, -0.3236,  0.3794])
tensor([[42., 42., 42., 42., 42., 42., 42., 42.]])
```

#### 自定义初始化
有时，深度学习框架没有提供我们需要的初始化方法。在下面的例子中，我们使用以下的分布为任意权重参数 $w$ 定义初始化方法：
$$
\begin{split}\begin{aligned}
    w \sim \begin{cases}
        U(5, 10) & \text{ 可能性 } \frac{1}{4} \\
            0    & \text{ 可能性 } \frac{1}{2} \\
        U(-10, -5) & \text{ 可能性 } \frac{1}{4}
    \end{cases}
\end{aligned}\end{split}
$$
同样，我们实现了一个 `my_init` 函数来应用到 `net`。

```python
def my_init(m):
    if type(m) == nn.Linear:
        print("Init", *[(name, param.shape)
                        for name, param in m.named_parameters()][0])
        nn.init.uniform_(m.weight, -10, 10)
        m.weight.data *= m.weight.data.abs() >= 5

net.apply(my_init)
net[0].weight[:2]

###
Init weight torch.Size([8, 4])
Init weight torch.Size([1, 8])

tensor([[5.4079, 9.3334, 5.0616, 8.3095],
        [0.0000, 7.2788, -0.0000, -0.0000]], grad_fn=<SliceBackward0>)
```

注意，我们始终可以直接设置参数。

```python
net[0].weight.data[:] += 1
net[0].weight.data[0, 0] = 42
net[0].weight.data[0]

###
tensor([42.0000, 10.3334,  6.0616,  9.3095])
```

### 参数绑定
有时我们希望在多个层间共享参数： **我们可以定义一个稠密层，然后使用它的参数来设置另一个层的参数。**

```python
# 我们需要给共享层一个名称，以便可以引用它的参数
shared = nn.Linear(8, 8)
net = nn.Sequential(nn.Linear(4, 8), nn.ReLU(),
                    shared, nn.ReLU(),
                    shared, nn.ReLU(),
                    nn.Linear(8, 1))
net(X)
# 检查参数是否相同
print(net[2].weight.data[0] == net[4].weight.data[0])

# 确保它们实际上是同一个对象，而不只是有相同的值
net[2].weight.data[0, 0] = 100 #修改2的时候，也会修改4
print(net[2].weight.data[0] == net[4].weight.data[0])

###
tensor([True, True, True, True, True, True, True, True])
tensor([True, True, True, True, True, True, True, True])
```

**这个例子表明第三个和第五个神经网络层的参数是绑定的。它们不仅值相等，而且由相同的张量表示**。因此，如果我们改变其中一个参数，另一个参数也会改变。 

这里有一个问题：**当参数绑定时，梯度会发生什么情况？ 答案是由于模型参数包含梯度，因此在反向传播期间第二个隐藏层 （即第三个神经网络层）和第三个隐藏层（即第五个神经网络层）的梯度会加在一起。**
## 3 延后初始化
到目前为止，我们忽略了建立网络时需要做的以下这些事情：
- 我们定义了网络架构，但没有指定输入维度。
- 我们添加层时没有指定前一层的输出维度。
- 我们在初始化参数时，甚至没有足够的信息来确定模型应该包含多少参数。

有些读者可能会对我们的代码能运行感到惊讶。 毕竟，深度学习框架无法判断网络的输入维度是什么。 **这里的诀窍是框架的延后初始化（defers initialization）， 即直到数据第一次通过模型传递时，框架才会动态地推断出每个层的大小。**

**在以后，当使用卷积神经网络时，由于输入维度（即图像的分辨率）将影响每个后续层的维数，有了该技术将更加方便。现在我们在编写代码时无须知道维度是什么就可以设置参数，这种能力可以大大简化定义和修改模型的任务。** 

## 4 自定义层
深度学习成功背后的一个因素是神经网络的灵活性： 我们可以用创造性的方式组合不同的层，从而设计出适用于各种任务的架构。
有时我们会遇到或要自己发明一个现在在深度学习框架中还不存在的层。在这些情况下，必须构建自定义层。本节将展示如何构建自定义层。

### 不带参数的层
首先，我们构造一个没有任何参数的自定义层。回忆一下在 [5.1节](http://zh.d2l.ai/chapter_deep-learning-computation/model-construction.html#sec-model-construction)对块的介绍，这应该看起来很眼熟。

下面的 `CenteredLayer` 类要从其输入中减去均值。要构建它，我们只需继承 `nn.Module` 基础层类并实现前向传播功能。

```python
import torch
import torch.nn.functional as F
from torch import nn


class CenteredLayer(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, X):
        return X - X.mean()
```

让我们向该层提供一些数据，验证它是否能按预期工作。
```python
layer = CenteredLayer()
layer(torch.FloatTensor([1, 2, 3, 4, 5]))

###
tensor([-2., -1.,  0.,  1.,  2.])
```

现在，我们可以将层作为组件合并到更复杂的模型中。

```python
net = nn.Sequential(nn.Linear(8, 128), CenteredLayer())
```

作为额外的健全性检查，我们可以在向该网络发送随机数据后，检查均值是否为0。由于我们处理的是浮点数，因为存储精度的原因，我们仍然可能会看到一个非常小的非零数。
```python
Y = net(torch.rand(4, 8))
Y.mean()

###
tensor(7.4506e-09, grad_fn=<MeanBackward0>)
```

### 带参数的层
下面我们继续定义具有参数的层，**这些参数可以通过训练进行调整**。
**我们可以使用内置函数来创建参数，这些函数提供一些基本的管理功能。比如管理访问、初始化、共享、保存和加载模型参数。这样做的好处之一是：我们不需要为每个自定义层编写自定义的序列化程序。**

现在，让我们实现自定义版本的全连接层。回想一下，该层需要两个参数，一个用于表示权重，另一个用于表示偏置项。在此实现中，我们使用 ReLU 激活函数。该层需要**输入参数**：`in_units` 和 `units`，分别**表示输入数和输出数**。
```python
class MyLinear(nn.Module):
    def __init__(self, in_units, units):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(in_units, units))
        self.bias = nn.Parameter(torch.randn(units,))
    def forward(self, X):
        linear = torch.matmul(X, self.weight.data) + self.bias.data
        return F.relu(linear)
    
```

接下来，我们实例化 `MyLinear` 类并访问其模型参数。

```python
linear = MyLinear(5, 3)
linear.weight

###
Parameter containing:
tensor([[ 0.1775, -1.4539,  0.3972],
        [-0.1339,  0.5273,  1.3041],
        [-0.3327, -0.2337, -0.6334],
        [ 1.2076, -0.3937,  0.6851],
        [-0.4716,  0.0894, -0.9195]], requires_grad=True)
```

我们可以使用自定义层直接执行前向传播计算。

```python
linear(torch.rand(2, 5))

###
tensor([[0., 0., 0.],
        [0., 0., 0.]])
```

我们还可以使用自定义层构建模型，就像使用内置的全连接层一样使用自定义层。

```python
net = nn.Sequential(MyLinear(64, 8), MyLinear(8, 1))
net(torch.rand(2, 64))

###
tensor([[0.],
        [0.]])
```

## 5 读写文件
有时我们希望保存训练的模型，以备将来在各种环境中使用（比如在部署中进行预测）。此外，**当运行一个耗时较长的训练过程时，最佳的做法是定期保存中间结果，以确保在服务器电源被不小心断掉时，我们不会损失几天的计算结果**。因此，现在是时候学习如何加载和存储权重向量和整个模型了。

### 保存和加载向量

对于**单个张量**，我们可以直接调用 `load` 和 `save` 函数分别读写它们。这两个函数都要求我们提供一个名称，`save` 要求将要保存的变量作为输入。

```python
import torch
from torch import nn
from torch.nn import functional as F

x = torch.arange(4)
torch.save(x, 'x-file')
```

我们现在可以将存储在文件中的数据读回内存。

```python
x2 = torch.load('x-file')

###
tensor([0, 1, 2, 3])
```

我们可以存储一个**张量列表**，然后把它们读回内存。
```python
y = torch.zeros(4)
torch.save([x, y],'x-files')

x2, y2 = torch.load('x-files')
(x2, y2)
```

我们甚至可以写入或读取**从字符串映射到张量的字典**。当我们要读取或写入模型中的所有权重时，这很方便。
```python
mydict = {'x': x, 'y': y}
torch.save(mydict, 'mydict')

mydict2 = torch.load('mydict')
mydict2
```

### 加载和保存模型参数
保存单个权重向量（或其他张量）确实有用，但是如果我们想保存整个模型，并在以后加载它们，单独保存每个向量则会变得很麻烦。毕竟，我们可能有数百个参数散布在各处。
因此，**深度学习框架提供了内置函数来保存和加载整个网络**。需要注意的一个重要细节是，这将**保存模型的参数而不是保存整个模型**。例如，如果我们有一个3层多层感知机，我们需要单独指定架构。因为模型本身可以包含任意代码，所以模型本身难以序列化。**因此，为了恢复模型，我们需要用代码生成架构，然后从磁盘加载参数。**

让我们从熟悉的多层感知机开始尝试一下。

```python
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden = nn.Linear(20, 256)
        self.output = nn.Linear(256, 10)

    def forward(self, x):
        return self.output(F.relu(self.hidden(x)))

net = MLP()
X = torch.randn(size=(2, 20))
Y = net(X)
```

接下来，我们将模型的参数存储在一个叫做“mlp.params”的文件中。
```python
torch.save(net.state_dict(), 'mlp.params')
```

**为了恢复模型，我们实例化了原始多层感知机模型的一个备份。这里我们不需要随机初始化模型参数，而是直接读取文件中存储的参数。**

```python
clone = MLP()
clone.load_state_dict(torch.load('mlp.params'))
clone.eval()

###
MLP(
  (hidden): Linear(in_features=20, out_features=256, bias=True)
  (output): Linear(in_features=256, out_features=10, bias=True)
)
```

由于两个实例具有相同的模型参数，在输入相同的 `X` 时，两个实例的计算结果应该相同。让我们来验证一下。

```python
Y_clone = clone(X)
Y_clone == Y

###
tensor([[True, True, True, True, True, True, True, True, True, True],
        [True, True, True, True, True, True, True, True, True, True]])
```

## 6 GPU

我们先看看如何使用单个 NVIDIA GPU 进行计算。首先，确保至少安装了一个 NVIDIA GPU。然后，下载 [NVIDIA驱动和CUDA](https://developer.nvidia.com/cuda-downloads) 并按照提示设置适当的路径。当这些准备工作完成，就可以使用 `nvidia-smi` 命令来**查看显卡信息**。

```
!nvidia-smi
```

**在 PyTorch 中，每个数组都有一个设备（device），我们通常将其称为环境（context）**。默认情况下，所有变量和相关的计算都分配给 CPU。有时环境可能是 GPU。当我们跨多个服务器部署作业时，事情会变得更加棘手。通过智能地将数组分配给环境，我们可以最大限度地减少在设备之间传输数据的时间。例如，当在带有 GPU 的服务器上训练神经网络时，我们通常希望模型的参数在 GPU 上。

要运行此部分中的程序，至少需要两个 GPU。注意，对大多数桌面计算机来说，这可能是奢侈的，但在云中很容易获得。例如可以使用 AWS EC2的多 GPU 实例。本书的其他章节大都不需要多个 GPU，而**本节只是为了展示数据如何在不同的设备之间传递。**

### 计算设备
我们可以指定用于存储和计算的设备，如 CPU 和 GPU。**默认情况下，张量是在内存中创建的，然后使用 CPU 计算它。**

在 PyTorch 中，CPU 和 GPU 可以用 `torch.device('cpu')` 和 `torch.device('cuda')` 表示。应该注意的是，`cpu` 设备意味着所有物理 CPU 和内存，这意味着 PyTorch 的计算将尝试使用所有 CPU 核心。然而，`gpu` 设备只代表一个卡和相应的显存 i。如果有多个 GPU，我们使用 `torch.device(f'cuda:{i}')` 来表示第 $i$ 块 GPU（ $i$ 从0开始）。另外，`cuda:0` 和 `cuda` 是等价的。

```python
import torch
from torch import nn

torch.device('cpu'), torch.device('cuda'), torch.device('cuda:1')

###
(device(type='cpu'), device(type='cuda'), device(type='cuda', index=1))
```

我们可以查询可用 gpu 的数量。
```python
torch.cuda.device_count()
```

现在我们定义了两个方便的函数，这两个函数允许我们在不存在所需所有 GPU 的情况下运行代码。
```python
def try_gpu(i=0):  
    """如果存在，则返回gpu(i)，否则返回cpu()"""
    if torch.cuda.device_count() >= i + 1:
        return torch.device(f'cuda:{i}')
    return torch.device('cpu')

def try_all_gpus():  #@save
    """返回所有可用的GPU，如果没有GPU，则返回[cpu(),]"""
    devices = [torch.device(f'cuda:{i}')
             for i in range(torch.cuda.device_count())]
    return devices if devices else [torch.device('cpu')]

try_gpu(), try_gpu(10), try_all_gpus()

(device(type='cuda', index=0),
 device(type='cpu'),
 [device(type='cuda', index=0), device(type='cuda', index=1)])
```
### 张量与 GPU
我们可以查询张量所在的设备。默认情况下，张量是在 CPU 上创建的。

```python
x = torch.tensor([1, 2, 3])
x.device

###
device(type='cpu')
```

**需要注意的是，无论何时我们要对多个项进行操作，它们都必须在同一个设备上。** 例如，如果我们对两个张量求和，我们需要确保两个张量都位于同一个设备上，否则框架将不知道在哪里存储结果，甚至不知道在哪里执行计算。

### 存储在 GPU 上
有几种方法可以在GPU上存储张量。 例如，**我们可以在创建张量时指定存储设备**。接 下来，我们在第一个`gpu`上创建张量变量`X`。 在GPU上创建的张量只消耗这个GPU的**显存**。 我们可以使用`nvidia-smi`命令查看显存使用情况。 一般来说，我们需要确保不创建超过GPU显存限制的数据。

```python
X = torch.ones(2, 3, device=try_gpu())

###
tensor([[1., 1., 1.],
        [1., 1., 1.]], device='cuda:0')
```

假设我们至少有两个 GPU，下面的代码将在第二个 GPU 上创建一个随机张量。

```python
Y = torch.rand(2, 3, device=try_gpu(1))

tensor([[0.4860, 0.1285, 0.0440],
        [0.9743, 0.4159, 0.9979]], device='cuda:1')
```

### 复制
如果我们要计算 `X + Y`，我们需要决定在哪里执行这个操作。例如，如 图所示，我们可以将 `X` 传输到第二个 GPU 并在那里执行操作。 不要简单地 `X` 加上 `Y`，因为这会导致异常，运行时引擎不知道该怎么做：它在同一设备上找不到数据会导致失败。由于 `Y` 位于第二个 GPU 上，所以我们需要将 `X` 移到那里，然后才能执行相加运算。

![[copyto.svg]]
>复制数据以在同一设备上执行操作

```python
Z = X.cuda(1)
print(X)
print(Z)

###
tensor([[1., 1., 1.],
        [1., 1., 1.]], device='cuda:0')
tensor([[1., 1., 1.],
        [1., 1., 1.]], device='cuda:1')
```

现在数据在同一个GPU上（`Z`和`Y`都在），我们可以将它们相加。
```python
Y + Z

###
tensor([[1.4860, 1.1285, 1.0440],
        [1.9743, 1.4159, 1.9979]], device='cuda:1')
```

假设变量 `Z` 已经存在于第二个 GPU 上。如果我们还是调用 `Z.cuda(1)` 会发生什么？ 它将返回 `Z`，而不会复制并分配新内存。

```python
Z.cuda(1) is Z

###
True
```

### 
人们使用 GPU 来进行机器学习，因为 GPU 相对运行速度快。**但是在设备（CPU、GPU 和其他机器）之间传输数据比计算慢得多**。这也使得并行化变得更加困难，**因为我们必须等待数据被发送（或者接收），然后才能继续进行更多的操作**。这就是为什么拷贝操作要格外小心。
根据经验，多个小操作比一个大操作糟糕得多。此外，一次执行几个操作比代码中散布的许多单个操作要好得多。如果一个设备必须等待另一个设备才能执行其他操作，那么这样的操作可能会阻塞。

**最后，当我们打印张量或将张量转换为NumPy格式时， 如果数据不在内存中，框架会首先将其复制到内存中， 这会导致额外的传输开销。 更糟糕的是，它现在受制于全局解释器锁，使得一切都得等待Python完成。**

不经意地移动数据可能会显著降低性能。一个典型的错误如下：计算 GPU 上每个小批量的损失，并在命令行中将其报告给用户（或将其记录在 NumPy `ndarray` 中）时，将触发全局解释器锁，从而使所有 GPU 阻塞。最好是为 GPU 内部的日志分配内存，并且只移动较大的日志。

### 神经网络与 GPU

类似地，神经网络模型可以指定设备。下面的代码**将模型参数放在 GPU 上。**

```python
net = nn.Sequential(nn.Linear(3, 1))
net = net.to(device=try_gpu())
```

在接下来的几章中，我们将看到更多关于如何在 GPU 上运行模型的例子，因为它们将变得更加计算密集。

**当输入为GPU上的张量时，模型将在同一GPU上计算结果。**

```python
net(X)

###
tensor([[-0.4275],
        [-0.4275]], device='cuda:0', grad_fn=<AddmmBackward0>)
```

让我们确认模型参数存储在同一个GPU上。
```python
net[0].weight.data.device

###
device(type='cuda', index=0)
```

**总之，只要所有的数据和参数都在同一个设备上， 我们就可以有效地学习模型**。 在下面的章节中，我们将看到几个这样的例子。