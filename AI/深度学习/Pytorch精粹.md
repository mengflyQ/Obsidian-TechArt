---
title: Pytorch精粹
uid: "202311111641"
create_time: 2023-11-11 16:39
reference: 
banner: "[[Pasted image 20231111164335.png]]"
banner_lock: true
---

# 1 数据操作
## 01 入门
```python
import torch
```

- **张量（tensor）** 表示一个由数值组成的数组，这个数组可能有多个维度。 
    - 具有一个轴的张量对应数学上的_向量_（vector）； 
    - 具有两个轴的张量对应数学上的_矩阵_（matrix）；
    - 具有两个轴以上的张量没有特殊的数学名称。
    - 张量中的每个值都称为张量的 _元素_（element）

- 使用 `arange` 创建一个**行向量** `x`。这个行向量包含以0开始的前12个整数，范围为 $[0,12)$，它们默认创建为整数。也可指定创建类型为浮点数。
```python
x = torch.arange(12)
// tensor([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11])
```

- 张量（沿每个轴的长度）的形状：
```python
x.shape
//torch.Size([12])
```

- 张量的大小（size）：即张量中元素的总数，即形状的所有元素乘积
```python
X = x.reshape(3, 4)
//tensor([[ 0,  1,  2,  3],
//        [ 4,  5,  6,  7],
 //       [ 8,  9, 10, 11]])
```

不需要通过手动指定每个维度来改变形状。也就是说，如果我们的目标形状是（高度,宽度），那么在知道宽度后，高度会被自动计算得出，不必我们自己做除法。在上面的例子中，为了获得一个3行的矩阵，我们手动指定了它有3行和4列。幸运的是，我们可以通过 `-1` 来调用此自动计算出维度的功能。即我们可以用 `x.reshape(-1,4)` 或 `x.reshape(3,-1)` 来取代 `x.reshape(3,4)`。 

- 创建一个形状为（2,3,4）的张量，指定初始值
```python
torch.zeros((2, 3, 4))

tensor([[[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]],

        [[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]]])
```

```python
torch.ones((2, 3, 4))

tensor([[[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]],

        [[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]]])
```

- **通过从某个特定的概率分布中随机采样来得到张量中每个元素的值。** 例如，当我们构造数组来作为神经网络中的参数时，我们通常会随机初始化参数的值。以下代码创建一个形状为（3,4）的张量。**其中的每个元素都从均值为0、标准差为1的标准高斯分布（正态分布）中随机采样。**

```python
torch.randn(3, 4)

tensor([[-0.0135,  0.0665,  0.0912,  0.3212],
        [ 1.4653,  0.1843, -1.6995, -0.3036],
        [ 1.7646,  1.0450,  0.2457, -0.7732]])
```

- **通过提供包含数值的 Python 列表（或嵌套列表），来为所需张量中的每个元素赋予确定值**。在这里，最外层的列表对应于轴0，内层的列表对应于轴1。
```python
torch.tensor([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])

tensor([[2, 1, 4, 3],
        [1, 2, 3, 4],
        [4, 3, 2, 1]])
```

## 02 运算符
对于任意具有相同形状的张量，常见的标准算术运算符（`+`、`-`、`*`、`/` 和 `**`）都可以被升级为**按元素运算**。我们可以在同一形状的任意两个张量上调用按元素操作。在下面的例子中，我们使用逗号来表示一个具有5个元素的元组，其中每个元素都是按元素操作的结果。
```python
x = torch.tensor([1.0, 2, 4, 8])
y = torch.tensor([2, 2, 2, 2])
x + y, x - y, x * y, x / y, x ** y  # **运算符是求幂运算

(tensor([ 3.,  4.,  6., 10.]),
 tensor([-1.,  0.,  2.,  6.]),
 tensor([ 2.,  4.,  8., 16.]),
 tensor([0.5000, 1.0000, 2.0000, 4.0000]),
 tensor([ 1.,  4., 16., 64.]))
```

```python``` pyth n ```ython``` python ```python``` python ```python
```
``` ` ppython ``
```
``` `````python```python```python```python```python```python```python```python```python````python```python```python```python```python```python```python```python```python```python```python```python```py
python``` ```
ython```python
```
python```python```python```python```python```python
``````
```
```ython``` py `hon```python``
```
```
```
on ```python``` python ```python```python```python```python```pyton```python```python```python```python```python```python```python```python```pythonhhon``` python ```python``` python ```python``` python ```python``` python ```python``` python ```python``` python ```pyth
```
```
```
```
```
```
```
``` ```
```
```
```
```
```
```
```
```