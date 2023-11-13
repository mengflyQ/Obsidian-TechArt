---
title: Pytorch精粹
uid: "202311111641"
create_time: 2023-11-11 16:39
reference: 
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

在线性代数中，向量范数是将向量映射到标量的函数 $f$ （即求大小）。

给定任意向量 $x$，向量范数要满足一些属性：
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

### 03 线性回归的实现
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
    dataset = data.TensorDataset(*data_arrays)
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

在 PyTorch 中，全连接层在 `Linear` 类中定义。值得注意的是，我们将两个参数传递到 `nn.Linear` 中。第一个指定输入特征形状，即2，第二个指定输出特征形状，输出特征形状为单个标量，因此为1。

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
### 04 图像分类数据集 Fashion-MNIST
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

### 05 Softmax 回归的实现
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

