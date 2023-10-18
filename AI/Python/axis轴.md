
# 误解
❌axis=1 表示列，axis=0 表示行。

接下来，今天就让我们彻彻底底的搞清楚 Python 中 axis 到底应该怎么用！

我们先来看几个 pandas 中常用函数中的 axis。

这里讨论的 axis 主要是 numpy 中定义的 axis，pandas 基于 numpy，保留了 numpy 对 axis 的用法。

_1、drop 删除函数_

```python
DataFrame.drop(labels=None, axis=0, index=None, columns=None, level=None, inplace=False, errors='raise')
# axis{0 or ‘index’, 1 or ‘columns’}, default 0
```

drop 函数的 axis 默认为 0，表示删除行。

_2、mean 均值函数_

```python
DataFrame.mean(axis=None, skipna=None, level=None, numeric_only=None, **kwargs)
# axis{index (0), columns (1)}
```

mean 函数的 axis 默认为 None，在实际执行 mean 函数时如果不填写 axis，则会按 axis=0 执行计算每一列的均值。

_3、concat 合并函数_

```python
pandas.concat(objs, axis=0, join='outer', ignore_index=False, keys=None, levels=None, names=None, verify_integrity=False, sort=False, copy=True)
# axis{0/’index’, 1/’columns’}, default 0
```

concat 函数的 axis 默认为 0，表示纵向合并数据。

下面，我们来看看这些函数实现时具体的结果。

先导入需要用到的包~

```python
import numpy as np
import pandas as pd
```

首先，我们[[https://mp.weixin.qq.com/s?__biz=MzIwMTQ3MTY0MA==&mid=2247485177&idx=1&sn=7eeaddc22d67c7425e57b0ce4211c072&scene=21#wechat_redirect]]。

```python
# 构造一个DataFrame格式的数据
data = [[1,2,3],
        [4,5,6],
        [7,8,9],
        [10,11,12]]
data = pd.DataFrame(data,index = ['a','b','c','d'],columns=['one','two','three'])
```

![[1683277185384.png]]

我们看一下 drop 函数的实现效果。

*   axis=0

![[1683277185428.png]]

*   axis=1

![[1683277185467.png]]

可以看到，在 drop 函数中 axis=0 和 axis=1 确实分别对应着行和列，axis=0 删除了行，axis=1 删除了列，官方文档有如下类似的说明：

![[1683277185517.png]]

官网文档这里的说明其实会让人产生 axis=0 就是行，axis=1 就是列的误解。

# 解析
我们再来看一下 mean 函数（求轴的平均值）的实现效果。

*   axis=0

![[1683277185566.png]]

*   axis=1

![[1683277185601.png]]

神奇的事情发生了！！！可以看到，mean 函数的 axis=0 并不是对行进行求取均值而是对列进行求取均值，axis=1 也不是对列进行求取均值，而是对行进行求取均值。

那么，到底我们应该怎么理解 axis 呢？

![[1683277185677.png]]

言归正传，axis 是对数组层级的刻画，对 axis 正确的理解，就像他的名字一样——‘轴’，即 **axis 表示的是沿着哪一个轴的方向**。这一点对于理解 axis 很重要，也很容易被忽视，axis 本身是指数组的轴，在执行不同的函数时，具体的操作是沿着轴的方向进行的。axis 的取值取决于数据的维度，如果数据是一维数组那么 axis 只有 0，如果数据是二维的，那么 axis 可以取 0 和 1，如果数据是三维的，那么 axis 就可以取 0、1 和 2。

![[1683277185780.png]]

具体的，以常用的二维数据为例：

*   **axis=0 表示沿着列的方向，做逐行的操作**
*   **axis=1 表示沿着行的方向，做逐列的操作**

这里会有一点绕，特别是去理解 drop 函数中的 axis，很多人一开始没有办法理解和接受。我们再回过头理解一下 drop 函数。

*   axis=1，drop 函数删除列

![[1683277185829.png]]

drop 函数删除数据列的时候需要指定列名（比如指定删除 ONE 这一列），我们设置 axis=1，这表示：对于 ONE 这列，遍历所有索引（index），沿着水平方向对数据执行 drop 操作。

**可以理解为先选列，再按行执行操作，如果删除多列就会稍微好理解一点。**

*   axis=0，drop 函数删除行

![[1683277185866.png]]

同样如果我们要删除行，我们要指定好要删除的行名（比如指定删除 a 这一行），我们设置 axis=0，这表示：对于 a 这一行，遍历所有的列（columns）, 我们沿着垂直方向对数据执行 drop 操作。

**可以理解为先选行，再按列执行操作，如果删除多行就会稍微好理解一点。**

mean 函数和 concat 函数中的 axis 相对会好理解一点。当设置 axis=0，就表示沿着 0 轴即列进行处理，对应的便是 mean 计算每一列的均值，concat 进行上下纵向合并；当设置 axis=1，就表示沿着 1 轴即行进行处理，对应的便是 mean 计算每一行的均值，concat 进行左右横向合并。

最后~ 再提一下 concat 函数中 axis 的使用。

concat 函数是 pandas 下的一个合并数据的函数，axis=0 表示纵向合并（沿着 0 轴方向），axis=1 表示横向合并（沿着 1 轴方向），关于 concat 具体的使用，我之前有和 merge、append 这些 pandas 下的函数一起写过，这里就偷个懒不写啦，有兴趣的小伙伴可以看这篇文章 [[http://mp.weixin.qq.com/s?__biz=MzIwMTQ3MTY0MA==&mid=2247485257&idx=1&sn=8066a4d50c91c8bd0a852159d68733b7&chksm=96ec24bea19bada82e489d7e738558979a88e33fbe44dcab7ad2712e930bc9f045e35b4b7227&scene=21#wechat_redirect]]。