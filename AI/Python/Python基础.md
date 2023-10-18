# 一、基础部分
BIF就是Built-in Functions，内置函数

input() 接收用户的输入
```python nums
temp = input("请输入一个数字")  
print(temp)
```

随机数 random 模块
```python nums
import random					#导入
random.randint (a, b)			#随机a ~b 之间的整数
```
##  数据类型
1. **整数**
长度不受限制

2. **浮点数**

精确计算浮点数：`decimal`

```python
import decimal
a = decimal.Decimal('0.1')
```

**E 记法**（科学计数法）  
E的意思是指数，指底数为10，E后边的数字就是10的多少次幂。
例如，15 000等于1.5×10 000，也就是1.5×10<sup>4</sup>，E 记法写成1.5e4。

3. **复数**
x = 1 + 2j 用浮点数存储  
**获取实部**：`real`

```python
>>>x.real
1.0
```

**获取虚部**：`imag`

```python
>>>x.imag
2.0
```
4. **类型转换**
`int(x)`： 转换成整数
`float(x)`：转成浮点数  
`str()`：转换成一个字符串：
`complex(re, im)`： 转成复数
`type()`：获取变量的类型，
更建议使用 `isinstance()`这个 BIF 来判断变量的类型。
`isinstance()`函数有两个参数：第一个是待确定类型的数据；第二个是指定一个数据类型。它会根据两个参数返回一个布尔类型的值，True表示类型一致，False表示类型不一致。举个例子：
```python nums
>>> a = "小甲鱼"
>>> isinstance(a, str)
True
>>> isinstance(520, float)
False
>>> isinstance(520, int)
True
```

4. **算术操作符**： +　-　*　/　%　**　//
`x // y`： 地板除法，向下取整（等同于其他语言中的 floor）
`%`：取余
`divmod(x, y)`： 返回 (x // y, x % y)  
`abs(x)` ： 绝对值（如果是复数，返回模）  
`pow(x, y)`：计算 x^y  
`x ** y`：计算 x^y  

5. **布尔类型**

**`True`**：1 == True  
**`False`**：0 == False

定义为 False 的对象：None 和 False  
值为 0 的数字类型：0， 0.0， 0j， Decimal(0), Fraction(0, 1)  
空的序列和集合：’’, (), [], {}, set(), range(0)

6. **逻辑运算符**
and：与
or：或
not：非
```python nums
# 特殊语法 
5 > 3 < 4
5 > 3 and 3 < 4 # 等价
# 输出：true
```

**Python 中任何对象都能直接进行真值测试**  

**短路逻辑** or and  
从左往右，只有当第一个操作数的值无法确定逻辑运算的结果时，才对第二个操作数进行求值。

7. **运算符优先级** 

![[1680774386163.png]] 

`+, -, *, /, //, %` > 比较运算符 > 逻辑运算符  
not > and > or

## 分支结构

### 断言
`assert` 关键字翻译过来就是“断言”，当这个关键字后边的条件为假的时候，程序自动崩溃并抛出 AssertionError 异常。
```python nums
assert 3 < 4
# AssertionErroor
```
一般来说，可以用它在程序中置入检查点，当需要确保程序中的某个条件一定为真才能让程序正常工作的话，assert关键字就非常有用了。
### if   

```python nums
if condition:
		statement(s)
```


```python nums
if condition:
		statement(s)
else:
		statement(s)
```


```python nums
if condition1:
		statement(s)
elif condition2:
		statement(s)
elif condition3:
		statement(s)
...
```


```python nums
if condition1:
		statement(s)
elif condition2:
		statement(s)
elif condition3:
		statement(s)
...
else:
		statement(s)
```

**三元操作符**
```python nums
# 语法
条件成立时执行的语句 if condition else 条件不成立时执行的语句

# 原形式
if x< y:
		small =x
else:
		small =y

# 三元运算符的形式
small = x if x<y else y

```
## 循环结构

### while
```python nums
while condition:
		statement(s)
```

### for

```python nums
for 变量 in 可迭代对象:
		statement(s)
```
**可迭代对象**就是指那些元素可以被单独提取出来的对象，如目前最熟悉的字符串，像“FishC”就是由“F”“i”“s”“h”“C”五个字符元素构成的。那么，for循环语句每执行一次就会从该字符串（可迭代对象）中拿出其中一个字符，然后存放到变量中。
```python nums
>>>for each in 'FishC':
		print(each)
# 输出
F
i
s
h
C
```

通过for语句来实现打印1+2+3+4+…+100
```python nums
# 错误，因为100不是可迭代对象
sum=0
for i in 100:
		sum+=i
		print (sum)
	

for i in range(10):		#range(10)是左闭右开区间[0, 10)
	print(i)
```

`range()`是一个BIF函数，它可以为指定的整数生成一个数字序列（可迭代对象）
```python nums
# 注：list是将可迭代对象以列表的形式展示出来。

range(stop) # 生成[0,stop)的数字序列
# 例如 print(list(range(5))) 打印结果为 [0, 1, 2, 3, 4]

range(start, stop)  #生成[start,stop)的数字序列
# 例如 print(list(range(1,5))) 打印结果为[1, 2, 3, 4]

range(start, stop, step) #允许指定步长step（每个元素的间隔），这个步长除了可以是正整数，还可以是负整数：
# 例如list(range(0, 10, 2))，打印结果为[0, 2, 4, 6, 8]
# list(range(0, -10, -2))，打印结果为[0, -2, -4, -6, -8]

```
### break
终止当前循环，跳出循环

### continue
跳出本轮循环并开始下一轮循环（这里要注意的是：在开始下一轮循环之前，会先测试循环条件）。
### else
while 和 for 循环后面也可以跟 else，表示当条件不成立的时候执行的内容
```python nums
while 条件:
		循环体
else:
		条件不成立时执行的内容
		
for 变量 in 可迭代对象:
		循环体
else:
		条件不成立时执行的内容
```
正常境况下 else 不用写，因为本身条件不成立的时候就会结束循环执行后面的内容，但使用 break 时可能会不同：在 else 前面写 break，当 break 触发时不会执行 else 中的内容。
# 二、列表/元组/字符串
## 列表 list
变量类型为 `<class 'list'>` 
列表类似数组，但**可以存放不同类型的变量**

### 创建列表
格式：中括号（数据之间用逗号分隔）
```python nums
r = [1, 2, 3, 4, 5, '上山打老虎']
```

元素：1，2，3，4，5，‘上山打老虎’  
下标：0，1，2，3，4 ，5  
下标：-6，-5，-4，-3，-2，-1

### 删除元素

`remove()`：删除一个元素  
注意：
1.  如果列表中存在多个匹配的元素，只会删除第一个；
2.  如果指定的元素不存在，那么程序就会报错。

`pop()`：删除并返回最后一个元素  
`clear()`：清空列表

`del` 语句
```python nums
# 删除某个（些）元素
eggs = ["鸡蛋", "鸭蛋", "鹅蛋", "铁蛋"]  
del eggs[0]  
print(eggs)
#输出：['鸭蛋', '鹅蛋', '铁蛋']

# 删除变量
del eggs  
print(eggs)
# 报错：name 'eggs' is not defined
```

### 切片语法
用一个冒号隔开两个索引值，左边是开始位置，右边是结束位置。
**注意：结束位置上的元素是不包含的**
如果为空，左边默认为列表第一个位置，右边默认为列表最后一个位置
```python nums
>>> r[0:3]
[1, 2, 3]

>>> r[:3]
[1, 2, 3]

>>> r[3:6]
[4, 5, '上山打老虎']

>>> r[3:]
[4, 5, '上山打老虎']


>>> r[-6:]	#从-6到-1
[1, 2, 3, 4, 5, '上山打老虎']

>>> r[:-1]	#从-6到-1
[1, 2, 3, 4, 5]

>>> r[:]	#整个列表
[1, 2, 3, 4, 5, '上山打老虎']

```

**引入步长**，默认值为1
```python nums
>>> r[0:6:2] #指定步长2
[1, 3, 5]

>>> r[::2] #整个列表，指定步长2
>>> r[::-1] #翻转整个列表

```

> [!NOTE] 
> **列表切片并不会修改列表自身的组成结构和数据，它其实是为列表创建一个新的拷贝（副本）并返回。**

**例外的，`del` 语句可以使用列表切片，直接作用于原始列表**
```python nums
>>> del r[::2]
>>> r
[2, 4, 6, 8]
```

为切片后的列表赋值也会作用于原始列表
```python nums
>>> r[0:2] = ['一','二']  
>>> r
['一', '二', 3, 4, 5, '上山打老虎']
```

### 添加元素

**`append()`**：列表末尾添加一个元素，在列表末尾 （只支持一个参数）
**`extend()`**：列表末尾添加另一个列表（支持多个参数）

```python nums
>>> s = [1, 2, 3, 4, 5]
>>> s[len(s):] = [6]				#和s.append(6)相同
>>> s
[1, 2, 3, 4, 5, 6]
>>> s[len(s):] = [7, 8, 9]			#和s.extend([7,8,9])相同
>>> s
[1, 2, 3, 4, 5, 6, 7, 8, 9]
```

**`insert(a, b)`**：指定位置插入一个元素（第一个参数：位置下标，第二个参数：元素值）

```python nums
>>> s = [1, 3, 4, 5]
>>> s.insert(1, 2)
>>> s
[1, 2, 3, 4, 5]

# 第一个参数支持负数，表示与列表末尾的相对距离
>>> number.insert(-1, 8.5)
>>> number
[0, 1, 2, 3, 4, 5, 6, 7, 8, 8.5, 9]
```
### 获取元素
`len()` 函数获取列表长度
`random.choice()` 随机获取一个元素
```python nums
# 通过索引值
>>> eggs = ["鸡蛋", "鸭蛋", "鹅蛋", "铁蛋"]
>>> eggs[0]
'鸡蛋'
>>> eggs[3]
'铁蛋'

# 获取列表最后一个元素
>>> eggs[len(eggs)-1] # len()函数获取列表长度
>>> eggs[-1] # 直接获取
'铁蛋'

# random.choice()随机获取一个元素
>>> random.choice(eggs) # 直接获取

# 列表中还可以包含另一个列表，如果要获取内部子列表的某个元素，应该使用两次索引：
>>> eggs =['鸡蛋'，'铁蛋'，['天鹅蛋'，'企鹅蛋'，'加拿大鹅蛋']，'鸭蛋']
>>>eggs [2] [2]
'加拿大鹅蛋'
```

### 常用操作符
**比较**：当列表包含多个元素的时候，默认是从第一个元素开始比较，只要有一个 PK 赢了，就算整个列表赢了。字符串比较也是同样的道理（字符串比较的是每一个字符对应的 ASCII 码值的大小）。

**加法**：也叫**连接操作符**，它允许把多个列表对象合并在一起，其实就相当于 `extend()` 方法实现的效果。**一般情况下建议使用 `extend()` 方法来扩展列表**，因为这样显得更为规范和专业。另外，**连接操作符并不能实现列表添加新元素的操作（只能是列表和列表相加）**：
```python nums
>>> list1 = [123, 456]
>>> list2 = [234, 123]
>>> list3 = list1 + list2
>>> list3
[123, 456, 234, 123]
```

**乘法**：又称**重复操作符**，重复列表内所有元素若干次
```python nums
>>> list1 = ["FishC"]
>>> list1 * 3
['FishC', 'FishC', 'FishC']
```

**in 和 not in（成员关系操作符）**：在不在列表
```python nums
>>> list1 = ["小猪", "小猫", ["小甲鱼", "小乌龟"], "小狗"]
>>> "小甲鱼" in list1
False
>>> "小乌龟" not in list1 
True #可见in和not in只能判断一个层次的成员关系
```

在开发中，有时候需要去除列表中重复的数据，只要利用好 in 和 not in，就可以巧妙地实现：

```python nums
>>> old_list=['西班牙'，'葡萄牙'，'葡萄牙'，'牙买加'，'匈牙利]
>>> new_list = []
>>> for each in old_list:
			if each not in new_list:
				new_list.append (each)
>>>print (new_list)
['西班牙'，'葡萄牙'，'牙买加'，'匈牙利']

```

### 常用方法
`count()`：统计某个元素在列表中出现的次数：
```python nums
>>> list1 = [1, 1, 2, 3, 5, 8, 13, 21]
>>> list1.count(1)
2
```

`index()`：返回某个元素在列表中第一次出现的索引值
```python nums
>>> list1.index(1)
0

# 可以限定查找的范围：
>>> start = list1.index(1) + 1
>>> stop = len(list1)
>>> list1.index(1, start, stop)
1
```

`reverse()`：将整个列表原地翻转：
```python nums
>>> list1 = [1, 1, 2, 3, 5, 8, 13, 21]
>>> list1.reverse()
[21, 13, 8, 5, 3, 2, 1, 1]
```

`sort()`：对列表元素**从小到大**排序：
   ```python nums
>>> list1 = [8, 9, 3, 5, 2, 6, 10, 1, 0]
>>> list1.sort()
>>> list1
[0, 1, 2, 3, 5, 6, 8, 9, 10]
   ```

**从大到小排序：**
1. 先调用 sort()方法，然后调用 reverse()方法原地翻转
2. `sort()` 这个方法有三个参数，语法形式为：`sort(func, key, reverse)`
func 和 key 参数用于设置排序的算法和关键字，默认是使用归并排序
reverse 参数默认为 False，表示不颠倒顺序（世界上 sort 的默认形式也可以写成`sort(reverse=False)`）。因此，只需要把 False 改为 True，列表就相当于从大到小排序：
```python nums
>>> list1 = [8, 9, 3, 5, 2, 6, 10, 1, 0]
>>> list1.sort(reverse=True)
>>> list1
[10, 9, 8, 6, 5, 3, 2, 1, 0]
```


`copy()` ：拷贝一个列表 浅拷贝（shallow copy）


### 嵌套列表（创建二维列表，也就是矩阵）


```python nums
>>> matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
>>> matrix[0]				#第一行
[1, 2, 3]
>>> matrix[1][1]			#第二行第二列
```

### is 运算符（同一性运算符） 
**检验两个变量是否指向同一个对象**

①

```python nums
>>> A = [0] * 3
>>> for i in range(3):
				A[i] = [0] *3				# √
>>> A
[[0, 0, 0], [0, 0, 0], [0, 0, 0]]

>>> A[0] is A[1]
False
```

![[1680774386314.png]]

②

```python nums
>>> B = [[0] * 3] *3						#× 有bug
>>> B
[[0, 0, 0], [0, 0, 0], [0, 0, 0]]

>>> B[0] is B[1]
True
```

![[1680774386396.png]] 


### 浅拷贝和深拷贝

`y = x` ： （引用）当 x 改变，y 也改变  
`y = x.copy()` ： 拷贝整个列表（浅拷贝）当 x 改变，y 不改变  
`y = x[:]`

**浅拷贝**：只拷贝了外层的对象，当包含嵌套列表时，只是引用

**copy 模块**:

**浅拷贝**：copy()

```python nums
>>> import copy
>>> x = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
>>> y = copy.copy(x)
```

**深拷贝**：deepcopy()

```python nums
>>> import copy
>>> x = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
>>> y = copy.deepcopy(x)
```

### 列表推导式

```python nums
>>> oho = [1, 2, 3, 4, 5]
>>> oho = [i * 2 for i in oho]
>>> oho
[2, 4, 6, 8, 10]
```

**（1）**

```python nums
[expression for target in iterable]
```

**`ord()`** : 将字符转换为对应的 Unicode 编码  

```python nums
>>> code = [ord(c) for c in 'FishC']
>>> code
[70, 105, 115, 104, 67]
```

```python nums
>>> matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
>>> col2 = [row[1] for row in matrix]
>>> col2
[2, 5, 8]
>>> diag = [matrix[i][i] for i in range(len(matrix))]
>>> diag
[1, 5, 9]
```

**改变列表内容时，用 for 循环和列表推导式是不完全一样的。**  
**for 循环**：通过迭代，逐个修改原列表中的元素。  
**列表推导式**：直接创建一个新的列表，再赋值给原来的变量。

**创建嵌套列表**：

```python nums
s = [[0] * 3 for i in range(3)]
```

**（2）**

```python nums
[expression for target in iterable if condition]
```

eg：

```python nums
>>> even = [i for i in range(10) if i % 2 == 0]
>>> even
[0, 2, 4, 6, 8]
```

**（3）**

```python nums
[expression for target in iterable1
for target in iterable2
...
for target in iterableN]
```

**（4）**

```python nums
[expression for target in iterable1 if condition1
for target in iterable2 if condition2
...
for target in iterableN if conditionN]
```

## 元组 tuple
类型为`<class 'tuple'>`
元组和列表的最大区别是：**元组只可读，不可写**。
### 创建和访问元组
**1、创建**
元组和列表，除了不可改变这个显著特征之外，还有一个明显的区别：创建列表用的是中括号，而**创建元组大部分时候使用的是小括号（小括号可省略，逗号才是关键）**：

```python nums
tuple = (1, 2, 3, 4, 5, 6, 7, 8)
```

**2、访问**
访问方式与列表相同
```python nums
>>> tuple[1]
2
>>> tuple[5:]
(6, 7, 8)
```

**元组的标识符号：逗号**
```python nums
>>> tuple1 = (520)
>>> type(tuple1)
<class 'int'>

# 在元素后面添加一个逗号（,）来实现类型识别
>>> tuple1 = (520,)
>>> type(tuple1)
<class 'tuple'> 

# 不写小括号也可以识别出类型
>>> tuple2 = 520,
>>> tuple1 == tuple2
True
>>> tuple3 = 1, 2, 3, 4, 5
>>> type(tuple3)
<class 'tuple'>

#逗号（,）才是关键，小括号只是起到补充的作用
>>> 8 * (8)
64
>>> 8 * (8,)
(8, 8, 8, 8, 8, 8, 8, 8)

```


**创建空列表**：`temp = []`  
**创建空元组**：`temp = ()`  
**创建只有一个元素的元组**：eg：`tuple = (1,)` 或者`tuple = 1,`
### 更新和删除
**1、更新**
所谓的更新并不是修改元组自身，因为元组只可读不可写，可以利用切片语法为元组创建一个新的拷贝（副本）。旧的元组一旦失去了变量的引用，就会被 Python 的垃圾回收机制释放掉。
```python nums
>>> temp = (3, 4, 6, 7)
>>> temp = temp[:2] + (5,) + temp[2:]		# (5,) 括号，逗号，缺一不可
>>> temp
(3, 4, 5, 6, 7)
```

```python nums
# 使用id函数查看id值
temp = (3, 4, 6, 7)  
print(id(temp))  
temp = temp[:2] + (5,) + temp[2:]  
print(id(temp))

#从返回值可以看出，这两个temp并不是同一个对象
#1785625602912
#1785625519552
```

补充：`id()` 函数用于返回指定对象的唯一 id 值，这个 id 值可以理解为现实生活中的身份证，在同一生命周期中，Python 确保每个对象的 id 值是唯一的。

**2、删除**  
删除整个元组：`del`

```python nums
del temp
```

在日常开发中，很少使用 del 去删除整个元组，因为 Python 的垃圾回收机制会在某个对象不再被使用的时候自动进行清理。

## 字符串
- 在一些编程语言中，字符和字符串是两个不同的概念，但在 Python 中，只有字符串这一个概念。
- 字符串 string 必须用 `' '` 或者 `" "` 表示
- 字符串只可读不可写，可以使用切片语法生成拷贝
- 字符串变量支持中文

1. 字符串的特殊赋值写法
```python nums
// 特殊赋值写法
x = 3  
y = 5  
x,y = y, x  
print(x, y)
```

2. 字符串运算
```python nums
# 字符串加法
print('520'+'1314')
#输出
#5201314

# 字符串乘法
print("1" * 5)
#输出
#11111
```

3. 转义字符 `\` 防止引号冲突

4. **原始字符串**
```python nums
print("D:\three\two\one") # 错误，\斜杠被认为是转义字符  
print( "D:\\three\\two\\one" ) # 正确  
print(r"D:\three\two\one") #在引号前添加 r 或 R，称为原始字符串，原始字符串是为了解决ascii字符和正则表达式特殊字符间的冲突而产生的。

#输出
#D:	hree	wo\one
#D:\three\two\one
#D:\three\two\one
```

在使用字符串时需要注意的一点是：无论是否为原始字符串，都不能以反斜杠作为结尾（注：反斜杠放在字符串的末尾表示该字符串还没有结束，换行继续的意思）

5. 换行
```python nums
# \n换行转义字符
print("1\n2\n3")
#输出
#1
#2
#3

# 更好的方法：长字符串，三引号（单引号双引号均可）
print("""1  
2  
3""")
#输出
#1
#2
#3
```
**`
### 字符串方法

> [!NOTE] 提示
> 1. 只要涉及字符串修改的方法，并不是修改原字符串，而是返回字符串修改后的一个拷贝。

**字符串拼接的三种方法：**
•　简单字符串连接时，直接使用加号（+），例如：`full_name = prefix + name`。
•　复杂的，尤其有格式化需求时，使用格式化操作符（%）进行格式化连接，例如：`result = "result is %s:%d" % (name, score)`。
使用格式化的方法对字符串进行拼接：
 ```python nums
>>> str1 = "一支穿云箭，千军万马来相见；"
>>> str2 = "两副忠义胆，刀山火海提命现。"
>>> "%s%s" % (str1, str2)
'一支穿云箭，千军万马来相见；两副忠义胆，刀山火海提命现。'
```

•　当有大量字符串拼接，尤其发生在循环体内部时，使用字符串的 join()方法无疑是最棒的，例如：`result = "".join(iterator)`。

![[Pasted image 20230408204717.jpg]]
![[Pasted image 20230408204720.jpg]]
### 字符串格式化
格式化字符串，就是按照统一的规格去输出一个字符串。
#### format()
format()方法接收位置参数和关键字参数，二者均传递到一个名为 replacement 的字段。而这个 replacement 字段在字符串内用大括号 {} 表示。
**①位置参数**  
```python nums
>>> "{0} love {1}.{2}".format("I","FishC","com")
'I love FishC.com'
```

**②关键字参数**  
```python nums
>>> "{a} love {b}.{c}".format(a="I",b="FishC",c="com")
'I love FishC.com'
```

如果将位置参数和关键字参数综合在一起使用，那么位置参数必须在关键字参数之前

```python nums
>>> "{0} love {b}.{c}".format("I", b="FishC", c="com")
'I love FishC.com'
```

特别的
用多一层大括号包起来打印大括号：
```python nums
>>> "{{0}}".format("不打印")
'{0}'
```

```python nums
>>> "{0}：{1:.2f}".format("圆周率", 3.14159)
'圆周率：3.14'
```
可以看到，位置参数{1}跟平常有些不同，后边多了个冒号。在替换域中，冒号表示格式化符号的开始，“.2”的意思是四舍五入到保留两位小数点，而 f 的意思是浮点数，所以按照格式化符号的要求打印出了3.14。

#### 格式化操作符%
当%的左右均为数字的时候，它表示求余数的操作；但当它出现在字符中的时候，它表示的是格式化操作符。

##### 字符串格式化符号
| **符号** | **说明**                                   |
| -------- | ------------------------------------------ |
| %c       | 格式化字符及其 ASCII 码                    |
| %s       |格式化字符串|
| %d       |格式化整数|
| %o       |格式化无符号八进制数|
| %x       |格式化无符号十六进制数 |
| %X       |格式化无符号十六进制数（大写）|
| %f       | 格式化浮点数字，可指定小数点后的精度       |
| %e       | 用科学计数法格式化浮点数                   |
| %E       | 作用同 %e，用科学计数法格式化浮点数        |
| %g       | 根据值的大小决定使用 %f 或 %e              |
| %G       | 作用同 %g，根据值的大小决定使用 %f 或者 %E |


  ```python nums
# 例子
>>> '%c' % 97
'a'
>>> '%c%c%c%c%c' % a
'FishC'
>>> '%d转换为八进制是：%o' % (123, 123)
'123转换为八进制是：173'
>>> '%f用科学计数法表示为：%e' % (149500000, 149500000)
'149500000.000000用科学计数法表示为：1.495000e+08'

# 进制转换
print('十进制 -> 十六进制 : %d -> 0x%x' % (num, num))
print('十进制 -> 八进制 : %d -> 0o%o' % (num, num))
print('十进制 -> 二进制 : %d ->' % (num), bin(num))
```


##### 格式化操作符辅助命令
| **符号** | **说明**                                                   |
| -------- | ---------------------------------------------------------- |
| m.n      | m 是显示的最小总宽度，n 是小数点后的位数                   |
| -        | 用于左对齐                                                 |
| +        | 在正数前面显示加号（+）                                    |
| #        |在八进制数前面显示 '0o'，在十六进制数前面显示 '0x' 或 '0X'|
| 0        | 显示的数字前面填充 '0' 取代空格                            |

```python nums
>>> '%5.1f' % 27.658
' 27.7'
>>> '%.2e' % 27.658
'2.77e+01'
>>> '%10d' % 5
'         5'
>>> '%-10d' % 5
'5         '
>>> '%010d' % 5
'0000000005'
>>> '%#X' % 100
'0X64'
```
#### 转义字符
|符号|说明|
| -------- | -------------------- |
|\'|单引号|
| \"       |双引号|
| \a       |发出系统响铃声|
| \b       |退格符|
| \n       | 换行符               |
| \t       | 横向制表符（TAB）    |
| \v       |纵向制表符|
| \r       |回车符|
| \f       |换页符|
| \o       | 八进制数代表的字符   |
| \x       | 十六进制数代表的字符 |
| \0       | 表示一个空字符       |
| \\       |反斜杠|


## 序列

**列表、元组和字符串的共同点：**
- 都可以通过索引得到每一个元素  
- 默认索引值总是从 0 开始  
- 可以通过切片的方式得到一个范围内的元素的集合  
- 有很多共同的操作符（重复操作符、拼接操作符、成员关系操作符）
**他们统称为序列**

### 序列方法
注： `[iterable]` 表示可迭代参数

**`list([iterable])`** ：把一个可迭代对象转换为列表 ,参数可以为空
**`tuple([iterable])`** ：把一个可迭代对象转换为元组  
**`str(obj)`** ：把 obj 对象转换为字符串  
**`len(sub)`** ：返回 sub 对象的长度  
**`max()`** ：返回序列或者参数集合中的最大值，要保证序列或者参数的数据类型统一
**`min()`** ：返回序列或者参数集合中的最小值，要保证序列或者参数的数据类型统一
**`sum(iterable[, start])`** ： 返回序列 iterable 和可选参数 start（表示从该值开始加起，默认值是0） 的总和 

**`sorted(iterable, key=None, reverse=False)`** ： 从小到大排序  
列表的内建方法 sort()是实现列表原地排序；而 sorted()是返回一个排序后的新列表。

**`reversed(sequence)`** ： 实现效果跟列表的内建方法 reverse()一致。
列表的内建方法是原地翻转，而 reversed()是返回一个翻转后的迭代器对象。
使用 `list(reversed(sequence))` 可以打印该对象


**`enumerate(iterable)`** ： 生成由二元组（二元组就是元素数量为2的元组）构成的一个迭代对象，每个二元组由可迭代参数的索引号及其对应的元素组成.
使用 `list(enumerate(iterable))` 可以打印该对象

**`zip(iter1[,iter2[...]])`** ：返回由各个可迭代参数组成的元组（返回迭代器对象）.
使用 `list(zip(iter1[,iter2[...]]))`  可以打印该对象
```python nums
# list([iterable])
>>> b = list("FishC")
>>> b
['F', 'i', 's', 'h', 'C']
>>> c = list((1, 1, 2, 3, 5, 8, 13))
>>> c
[1, 1, 2, 3, 5, 8, 13]

# len(sub)
>>> str1 = "I love fishc.com"
>>> len(str1)
16

# max()
>>> list1 = [1, 18, 13, 0, -98, 34, 54, 76, 32]
>>> max(list1)
76
>>> str1 = "I love fishc.com"
>>> max(str1)
'v'
>>> max(5, 8, 1, 13, 5, 29, 10, 7)
29

# sum(iterable[, start])
>>> tuple1 = 1, 2, 3, 4, 5
>>> sum(tuple1)
15
>>> sum(tuple1, 10)
25

# reversed(sequence)
>>> numbers = [32, 35, 76, 29, 4, 0, -56, 17]
>>> reversed(numbers) #返回迭代器
<list_reverseiterator object at 0x026DAFD0>
>>> list(reversed(numbers)) 
[17, -56, 0, 4, 29, 76, 35, 32]

# enumerate(iterable)
>>> enumerate(numbers)
<enumerate object at 0x0271BC28>
>>> list(enumerate(numbers))
[(0, 32), (1, 35), (2, 76), (3, 29), (4, 4), (5, 0), (6, -56), (7, 17)]

# zip(iter1[,iter2[...]])
>>> a = [1, 2, 3, 4, 5, 6]
>>> b = [4, 5, 6, 7]
>>> zip(a, b)
<zip object at 0x0271BC28>
>>> list(zip(a, b))
[(1, 4), (2, 5), (3, 6), (4, 7)]
```

# 三、函数
**定义函数**：

```python nums
def  函数名(参数):
	...
```

**调用**： 函数名 (参数)  
```python nums
>>> def add(num1, num2):
		num = num1 + num2
		print(num)
>>> add(2, 3)
```

**返回值（return）**  
```python nums
>>> def add(num1, num2):
		return (num1 + num2)
>>> print(add(2, 3))
```

- 在 Python 中，并不需要定义函数的返回值类型，函数可以返回不同类型的值；而如果没有返回值，则默认返回 None。
- 如果返回了多个值，Python 默认是以元组的形式进行打包。
- 也可以利用列表将多种类型的值打包到一块儿再返回。
## 1 函数文档
```python nums
def func(i):  
"""  
函数文档  
"""  
return i+1 

print(func(1)) 
# 打印：2

```
函数开头的几行字符串并不会被打印出来，但它将作为函数的一部分存储起来。这个字符串称为函数文档，它的功能与代码注释是一样的。

函数的文档字符串可以通过特殊属性 `_ _doc_ _` 获取，可以通过 help()函数来查看函数的文档：
```python nums
print(func.__doc__) 
# 打印：
# 函数文档

help(func)

# 打印：
#Help on function func in module __main__:
#
#func(i)
#    函数文档
```

## 2 关键字参数和默认参数

**位置参数、关键字参数**
- 在调用函数的时候，位置参数必须在关键字参数的前面
```python nums
def test(num1, num2):  
print(num1 + "大于" + num2)  
  
test("1", "2")  #位置参数，实参和形参位置一一对应
test(num2='2', num1='1') #关键字参数，传入实参时明确指定形参的变量名，其特点就是参数之间不存在先后顺序

#打印结果都为
#1大于2
```

**默认参数**：在定义函数时就给到的参数  
- 在定义函数的时候，位置参数必须在默认参数的前面
```python nums
>>> def SaySome(name = "小甲鱼", words = "让编程改变世界！"):
		print(name + '-->' + words)
>>> SaySome()
#小甲鱼-->让编程改变世界！
```

**收集参数（可变参数）**：实参个数不确定，在参数前加 ` * ` 
```python nums
>>> def test(*params):
		print('参数的长度是：', len(params))
		print('第二个参数是：', params[1])
>>> test(1, 'Percy', 9.99, 7, 5)
#参数的长度是： 5
#第二个参数是： Percy
```
- 收集参数前面的星号 `*` 起到的作用称为“打包”操作，通俗的理解就是**将多个参数打包成一个元组的形式进行存储**。
- 两个星号 `**` 的收集参数表示为将参数们**打包成字典**的形式，传递给函数的任意数量的 key=value 实参会被打包进一个字典中
```python nums
>>>def test(**params):
   print("有%d个参数"% len (params))
   print("它们分别是: ", params)
   
>>>test(a=1, b=2,c=3, d=4, e=5)

有5个参数
它们分别是:{ 'd': 4, 'e' : 5，'b': 2, 'c': 3, 'a' : 1}
```
- 如果在收集参数后面还需要指定其他参数，那么在调用函数的时候就应该使用关键参数来指定，否则 Python 就都会把实参都纳入到收集参数中。
- 建议大家如果定义的函数中带有收集参数，那么可以将其他参数设置为默认参数
- 星号 `*` 和`**`在形参中的作用是“打包”，而在实参中的作用则相反，起到“解包”的作用。“解包”操作也适用于其他的序列类型。
```python nums
num = (1, 2, 3, 4, 5)  
print(num)  
print(*num)
#(1, 2, 3, 4, 5)
#1 2 3 4 5

>>>def test(**params):
   print("有%d个参数"% len (params))
   print("它们分别是: ", params)
>>> a = {"one":1, "two":2, "three":3}
>>> test(**a)
有 3 个参数
它们分别是： {'three': 3, 'one': 1, 'two': 2}
```

## 3 函数和过程

**函数（function）**：有返回值  
**过程（procedure）**：是简单、特殊并且没有返回值的

**python 只有函数，没有过程。**

## 4 作用域
### global 关键字
Python使用屏蔽（shadowing）的手段对全局变量进行“保护”：**一旦函数内部试图直接修改全局变量，Python 就会在函数内部创建一个名字一模一样的局部变量代替**，这样修改的结果只会影响到局部变量，而全局变量则丝毫不变。
```python nums
>>>count =5
>>>def myFun():
count =10
print (count)
>>>myFun ( )
10
>>>count
5
```

某些时候我们需要在函数内部改变全局变量：在函数内使用 `global` 关键字，可以**将函数内的局部变量变为全局变量**
```python nums
>>>count =5
>>>def myFun ( :
global countcount = 10
print (count)
>>>myFun()
10
>>>count
10
```
###  内嵌函数
Python的函数定义是支持嵌套的，也就是**允许在函数内部定义另一个函数**，这种函数称为内嵌函数或者内部函数。

```python nums
def function1():
	print('function1()被调用')
	def function2():
		print('function2()被调用')
	function2()
	return
```

注意：  
- 内部函数`function2()`整个作用域都在外部函数`function1()`之内。  
- 只能在`function1()`中调用`function2()`，在`function1()`之外，不能调用`function2()`。
- 在嵌套函数中，内部函数可以引用外部函数的局部变量：


> [!NOTE] LEGB 原则
> 名字一样、作用域不同的变量引用，Python 引入了 LEGB 原则进行规范，变量的查找顺序依次就是 L→E→G→B：
> •　L-Local：函数内的名字空间。
>•　E-Enclosing function locals：嵌套函数中外部函数的名字空间。
•　G-Global：函数定义所在模块的名字空间。
•　B-Builtin：Python内置模块的名字空间。

###  闭包

Python中的闭包从表现形式上定义为：如果在一个内部函数里对外部作用域（但不是在全局作用域）的变量进行引用（简言之：就是在嵌套函数的环境下，内部函数引用了外部函数的局部变量），那么内部函数就会被认为是闭包。

```python nums
>>>def funx(x):
	  def funY(y):
		  return x * y
    return funY
    
>>>temp =funx(8)
>>>temp (5)
40
```

- **不能在外部函数以外的地方对内部函数进行调用**
- 在闭包中，外部函数的局部变量对应内部函数的局部变量，事实上相当于之前讲的全局变量与局部变量的对应关系，**在内部函数中，只能对外部函数的局部变量进行访问，但不能进行修改**。
- 闭包概念的引入是为了尽可能地避免使用全局变量，闭包允许将函数与其所操作的某些数据（环境）关联起来，这样外部函数就为内部函数构成了一个封闭的环境。

**`nonlocal` 关键字**：表明这不是一个局部变量，使用方式与 global 一样：
```python nums
>>>def funX():
   x = 5
   def funY()∶
       nonlocal x
       x = x + 1
       return x
    return funY
>>>temp = funx()
>>>temp ()
6
```

### 装饰器 decorator

> [!NOTE] 语法糖（Syntactic sugar）
> 语法糖（Syntactic sugar），就是在计算机语言中添加的某种语法，这种语法对语言的功能没有影响，但是更方便程序员使用。语法糖让程序更加简洁，有更高的可读性。

装饰器（decorator）的功能：将被装饰的函数当作参数传递给与装饰器对应的函数（名称相同的函数），并返回包装后的被装饰的函数。
```python nums
def log(func):  
		def wrapper():  
			print("开始调用eat()函数...")  
			func()  
			print("结束调用eat()函数...")  
		return wrapper  
  
  
def eat():  
print("开始吃了")  
  
eat = log(eat)
eat()

#开始调用eat()函数...
#开始吃了
#结束调用eat()函数...
```

这个 eat = log(eat)看着总有些别扭，能不能改善一下呢？Python 因此发明了“@语法糖”来解决这个问题。
```python nums
def log(func):  
		def wrapper():  
			print("开始调用eat()函数...")  
			func()  
			print("结束调用eat()函数...")  
		return wrapper  
  
@log
def eat():  
print("开始吃了")  

eat()

#开始调用eat()函数...
#开始吃了
#结束调用eat()函数...
```
这样就省去了手动将 eat()函数传递给 log()再将返回值重新赋值的步骤。

## 5 函数式编程
### lambda 表达式

普通形式的函数：
```python nums
>>> def ds(x):
	   return 2* ×+1
>>>ds(5)
11
```

运用 `lambda` 关键字，创建匿名函数
基本语法是使用冒号（:）分隔函数的参数及返回值：冒号的左边放置函数的参数，如果有多个参数，使用逗号（,）分隔即可；冒号右边是函数的返回值。
```python nums
>>> lambda x : 2 * x + 1
<function <lambda> at 0x031AAF58>
>>> g = lambda x : 2 * x + 1
>>> g(5)
```


**lambda 表达式的作用：**  
1. Python 写一些执行脚本时，使用 `lambda` 就可以省下定义函数过程，`lambda` 使代码更加精简。  
2. 对于一些比较抽象并且整个程序执行下来只需要调用一两次的函数，使用`lambda`不需要考虑命名问题。  
3. 简化代码的可读性。

### filter() 过滤器
`filter()`函数是一个**过滤器**，它的作用就是在海量的数据里面提取出有用的信息。

`filter(function or None, iterable) --> filter object`

`filter()` 这个内置函数有两个参数：第一个参数可以是一个函数也可以是 None
- 如果是一个函数的话，则将第二个可迭代对象里的每一个元素作为函数的参数进行计算，把返回 True 的值筛选出来；
- 如果为 None，则直接将第二个参数中为 True 的值筛选出来。

```python nums
#第一个参数是None
>>> filter(None, [1, 0, False, True])
<filter object at 0x034CE0A0>
>>> list(filter(None, [1, 0, False, True]))
[1, True]

##第一个参数是函数
>>> def odd(x):
	return x % 2

>>> temp = range(10)
>>> show = filter(odd, temp)
>>> list(show)
[1, 3, 5, 7, 9]

#结合`lambda`关键字，修改代码
>>> list(filter(lambda x : x % 2, range(10)))
[1, 3, 5, 7, 9]
```


### map() 映射

`map(func, *iterables) --> map object`

`map()`这个内置函数有两个参数，一个函数和一个可迭代对象，将可迭代对象的每一个元素作为函数的参数进行运算加工，直到可迭代序列每个元素都加工完毕，返回所有加工后的元素构成的新序列。

```python nums
>>> list(map(lambda x : x * 2, range(10)))
[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
```

`map()`的第二个参数是收集参数，支持多个可迭代对象。map()会从所有可迭代对象中依次取一个元素组成一个元组，然后将元组传递给 func。注意：如果可迭代对象的长度不一致，则以较短的迭代结束为止。
```python nums
>>> list(map(lambda x, y : x + y, [1, 3, 5], [10, 30, 50, 66, 88]))
[11, 33, 55]
```
## 6 递归
Python 3出于“善意的保护”，对递归深度默认是有限制的，**自行设置递归的深度限制方法如下：**
```python nums
>>> import sys
>>> sys.setrecursionlimit(10000)  # 将递归深度限制设置为一万层
```

符合以下两个条件：  
1. 有调用函数自身的行为  
2. 有一个正确的返回条件（停止的条件）

eg：求 n 的阶乘

```python nums
def factorial(n):
    if n == 1:
        return 1
    else:
        return n * factorial(n - 1)

num = int(input('请输入一个正整数：'))
print(num, '的阶乘是：', factorial(num))
```

运行：

```python nums
请输入一个正整数：5
5 的阶乘是： 120
```

**eg：斐波那契数列**  
①运用迭代

```python nums
>>> def fab1(n):
	a = [1, 1]
	for i in range(n - 2):
		result = a[i] + a[i + 1]
		a.append(result)
	print(a.pop())

>>> fab1(12)
```

②运用递归

```python nums
>>> def fab2(n):
	if n < 1:
		return 0
	elif n == 1:
		return 1
	elif n == 2:
		return 1
	else:
		return fab2(n - 1) + fab2(n - 2)

>>> fab2(12)
```

递归所占内存空间大，运算慢

**eg：求解汉诺塔**

```python nums
>>> def hanoi(n, x, y, z):
	if n == 1:
		print(x, '->', z)
	else:
		hanoi(n - 1, x, z, y)# 将前n-1个盘子从x移动到y上
		print(x, '->', z)# 将最底下的最后一个盘子从x移动到z上
		hanoi(n - 1, y, x, z)# 将y上的n-1个盘子从y移动到z上

>>> hanoi(3, 'x', 'y', 'z')
x -> z
x -> y
z -> y
x -> z
y -> x
y -> z
x -> z
```

# 四、字典/集合

## 1 字典（dict）
Python的字典又称**哈希**（hash）、关系数组

**字典是Python中唯一的映射类型**
映射类型区别于序列类型，序列类型以数组的形式存储，通过索引的方式来获取相应位置的值，一般索引值与对应位置存储的数据是毫无关系的。

### 创造和访问字典
- **关键符号：**{}  
- 由“**键**”和“**值**”共同构成，每一对键值组合称为“**项**”，中间由`:`连接。
- 字典的**键必须独一无二**（如果同一个键被赋值两次，后一个值会覆盖前面的值），但值则不必。**值可以取任何数据类型，但必须是不可变的**，如字符串、数或元组（列表不可以）。
- **访问字典**里的值与访问序列类似，只需要把相应的键放入**方括号**即可。
- 有别于序列，字典不支持拼接（`+`）和重复（`*`）操作

1. 要声明一个空字典，直接用大括号即可：
```python nums
>>> dict1 = {'李宁':'一切皆有可能', '耐克':'Just do it',  '鱼C工作室':'让编程改变世界'}
>>> print('鱼C工作室的口号是：', dict1['鱼C工作室'])
鱼C工作室的口号是： 让编程改变世界
```

2. 也可以使用 dict()内置函数来创建字典：
使用很多小括号的原因是 dict()函数的参数可以是一个序列（但不能是多个），所以要打包成一个元组（或列表）序列。
```python nums
>>> dict1 = dict((('F', 70), ('i', 105), ('s', 115), ('h', 104), ('C', 67)))
>>> dict1
{'F': 70, 'i': 105, 's': 115, 'h': 104, 'C': 67}
```

3. 还可以通过提供具有映射关系的参数来创建字典
```python nums
>>> dict1 = dict(F=70, i=105, s=115, h=104, C=67)
>>> dict1
{'F': 70, 'i': 105, 's': 115, 'h': 104, 'C': 67}
```

4. 还有一种创建方法是直接给字典的键赋值，如果键已存在，则改写键对应的值；如果键不存在，则创建一个新的键并赋值：
```python nums
>>> dict1
{'F': 70, 'i': 105, 's': 115, 'h': 104, 'C': 67}
>>> dict1['x'] = 88
>>> dict1
{'F': 70, 'i': 105, 's': 115, 'h': 104, 'C': 67, 'x': 88}
```


```python nums
# 以下方法创建相同的字典
>>> a = dict(one=1, two=2, three=3)
>>> b = {'one': 1, 'two': 2, 'three': 3}
>>> c = dict(zip(['one', 'two', 'three'], [1, 2, 3]))
>>> d = dict([('two', 2), ('one', 1), ('three', 3)])
>>> e = dict({'three': 3, 'one': 1, 'two': 2})
```

### 字典方法
#### 创建字典
**`fromkeys(seq[, value])`**：创建并返回一个新的字典，它有两个参数；第一个参数是字典的键；第二个参数是可选的，是传入键对应的值，如果不提供，那么默认是None。

```python nums
>>> dict1 = {}
>>> dict1.fromkeys((1, 2, 3))
{1: None, 2: None, 3: None}

>>> dict2 = {}
>>> dict2.fromkeys((1, 2, 3), 'Number')
{1: 'Number', 2: 'Number', 3: 'Number'}

>>> dict3 = {}
>>> dict3.fromkeys((1, 2, 3), ("one", "two", "three"))
{1: ('one', 'two', 'three'), 2: ('one', 'two', 'three'), 3: ('one', 'two',
'three')}
```

#### 访问字典
**`keys()`**：返回字典中的键
**`values()`**：返回字典中所有的值
**`items()`**：返回字典中所有的键值对（也就是项）
**`get(key[, default])`**：提供了更宽松的方式去访问字典项，当键不存在的时候，get()方法并不会报错，只是默默地返回了一个 None，表示啥都没找到。如果希望找不到数据时返回指定的值，那么可以在第二个参数设置对应的默认返回值： 
**`setdefault(key[, default])`**：与 get() 类似，但在字典中找不到相应的键时会自动添加键值对，默认值是 None，可以设置第二个参数。

```python nums
dict1 = {"James": "小前锋", "Kobe": "得分后卫", "Yaoming": "中锋"}  
print(dict1.keys())  
print(dict1.values())  
print(dict1.items())  
print(dict1.get("James"))  
print(dict1.get("Durant")) # 键不存在返回None

#返回
#dict_keys(['James', 'Kobe', 'Yaoming'])
#dict_values(['小前锋', '得分后卫', '中锋'])
#dict_items([('James', '小前锋'), ('Kobe', '得分后卫'), ('Yaoming', '中锋')])
#小前锋
#None
```

**如果不知道一个键是否在字典中，可以用成员资格操作符来判断。**（`in` 和 `not in`）

```python nums
>>> 3 in dict1
True
>>> 4 in dict2
False
```

#### 其他操作
**`clear()`**：清空字典  
**`copy()`**：浅拷贝整个字典  
**`pop(key[, default])`**：给定键，弹出对应的值 
**`popitem()`**：弹出一项（键和值） 字典没有一定的顺序，可以理解为随机弹出  
**`update()`**：更新，可以修改值

```python nums
>>> pets = {"米奇":"老鼠", "汤姆":"猫", "小白":"猪"}
>>> pets.update(小白="狗")
>>> pets
{'米奇': '老鼠', '汤姆': '猫', '小白': '狗'}
```

## 2 集合（set）

**集合里的元素具有唯一性，自动清除重复的数据  
集合是无序的**
### 创建和访问集合
**（1）创建：**  
1. 直接把一堆元素用 “`{}`” 括起来
在Python 3里，如果用大括号括起一堆数字但没有体现出映射关系，那么Python就会认为这堆数据是一个集合而不是映射。
```python nums
>>> num = {1, 2, 3, 4, 4, 5, 5}
>>> num
{1, 2, 3, 4, 5}
```

2. 使用 `set()` 工厂函数

```python nums
>>> set1 = set([1, 3, 5, 7, 9])
>>> set1
{1, 3, 5, 7, 9}
```

**（2）访问集合中的值：**  
可以使用`for`把集合中的数据一个个读取出来  
可以通过`in`和`not in`判断一个元素是否在集合中已经存在

### 集合方法
`add()` 可以为集合添加元素
`remove()` 可以删除集合中已知的元素：
```python nums
>>> num
{1, 2, 3, 4, 5}
>>> num.add(6)
>>> num
{1, 2, 3, 4, 5, 6}
>>> num.remove(5)
>>> num
{1, 2, 3, 4, 6}
```
| **集合（s）. 方法名**             | **等价符号** | **方法说明**                                                 |
| -------------------------------- | ------------ | ------------------------------------------------------------ |
| s.issubset (t)                    | s <= t       | 子集测试（允许不严格意义上的子集）：s 中所有的元素都是 t 的成员 |
|                                  | s < t        | 子集测试（严格意义上）：s != t 而且 s 中所有的元素都是 t 的成员 |
| s.issuperset (t)                  | s >= t       | 超集测试（允许不严格意义上的超集）：t 中所有的元素都是 s 的成员 |
|                                  | s > t        | 超集测试（严格意义上）：s != t 而且 t 中所有的元素都是 s 的成员 |
| s.union (t)                       | s \| t       | 合并操作：s "或" t 中的元素                                  |
| s.intersection (t)                | s & t        | 交集操作：s "与" t 中的元素                                  |
| s.difference                     | s - t        | 差分操作：在 s 中存在，在 t 中不存在的元素                   |
| s.symmetric_difference (t)        | s ^ t        | 对称差分操作：s "或" t 中的元素，但不是 s 和 t 共有的元素    |
| s.copy ()                         |              | 返回 s 的拷贝（浅复制）                                      |
| **以下方法仅适用于可变集合**     |              |                                                              |
| s.update                         | s \|= t      | 将 t 中的元素添加到 s 中                                     |
| s.intersection_update (t)         | s &= t       | 交集修改操作：s 中仅包括 s 和 t 中共有的成员                 |
| s.difference_update (t)           | s -= t       | 差修改操作：s 中包括仅属于 s 但不属于 t 的成员               |
|s.symmetric_difference_update (t)| s ^= t       | 对称差分修改操作：s 中包括仅属于 s 或仅属于 t 的成员         |
| s.add (obj)                       |              | 加操作：将 obj 添加到 s                                      |
|s.remove (obj)|              | 删除操作：将 obj 从 s 中删除，如果 s 中不存在 obj，将引发异常 |
|s.discard (obj)|              |丢弃操作：将 obj 从 s 中删除，如果 s 中不存在 obj，也没事儿|                       |              | 弹出操作：移除并返回 s 中的任意一个元素                      |  | s.clear ()                        |              | 清除操作：清除 s 中的所有元素                                |  | s.pop()|              |弹出操作：移除并返回 s 中的任意一个元素|  | s.pop ()                          |              | 弹出操作：移除并返回 s 中的任意一个元素                      |  | s.clear ()                        |              | 清除操作：清除 s 中的所有元素                                |
|s.pop()|  |弹出操作：移除并返回 s 中的任意一个元素|
|s.clear()|  |清除操作：清除 s 中的所有元素|


### 不可变集合
有时候希望集合中的数据具有稳定性，也就是说，像元组一样，**不能随意地增加或删除集合中的元素**。那么可以定义成不可变集合，这里使用的是`frozenset()`函数，就是把元素给 frozen（冰冻）起来：

**`frozenset()`**：创建一个不可变集合

```python nums
>>> num2 = frozenset([1, 2, 3, 4, 5])
>>> num2.add(0)
Traceback (most recent call last):
  File "<pyshell#12>", line 1, in <module>
    num2.add(0)
AttributeError: 'frozenset' object has no attribute 'add'
```
# 五、文件操作

## 打开文件
使用 `open()`这个内置函数来打开文件并返回文件对象
```python nums
open(file, mode = 'r', buffering = -1, encoding = None, errors = None, newline = None, closefd=True, opener=None)
```

第一个参数是传入的**文件名**，如果只有文件名，不带路径的话，那么 Python 会在当前文件夹中去找到该文件并打开；
第二个参数指定**文件打开模式**
![[Pasted image 20230409204531.jpg]]
注意：需要写入文件，请确保之前的打开模式有'w'或'a'，'w'模式写入文件，此前的文件内容会被全部删除，如果要在原来的内容上追加，一定要使用'a'模式打开文件。

## 文件对象的方法
打开文件并取得文件对象之后，就可以利用文件对象的一些方法对文件进行读取、修改等操作。
![[Pasted image 20230409204914.jpg]]
Python 拥有垃圾收集机制，会在文件对象的引用计数降至零的时候自动关闭文件，所以在 Python 编程里，如果忘记关闭文件并不会造成内存泄漏那么危险的结果。
但并不是说就可以不要关闭文件，**如果对文件进行了写入操作，那么应该在完成写入之后关闭文件**。因为 Python 可能会缓存写入的数据，如果中途发生类似断电之类的事故，那些缓存的数据根本就不会写入到文件中。所以，为了安全起见，要养成使用完文件后立刻关闭的好习惯。
`read()` 是以字节为单位读取，如果不设置参数，那么会全部读取出来，文件指针指向文件末尾。
`tell()` 方法可以告诉你当前文件指针的位置：
`seek()`方法可以调整文件指针的位置。
`readline()` 方法用于在文件中读取一整行，就是从文件指针的位置向后读取，直到遇到换行符（`\n`）结束：

从一个文件里读取字符串非常简单，但如果想要读取出数值，那就需要多费点儿周折。因为无论是 `read()` 方法还是 `readline()` 方法，都是返回一个字符串，**如果希望从字符串里提取出数值，可以使用 `int()` 函数或 `float()` 函数把类似'123'或'3.14'这类字符串强制转换为具体的数值。**


**将文件存入列表 list：**
```python nums
f = open(r"C:\Users\22625\Desktop\test.txt")  #内容为123
print(list(f))
#打印： ['123']
```

**读取文本文件中的每一行：** 文件对象自身支持迭代，直接使用 for 语句把内容迭代读取出来即可：
```python nums
>>> f.seek (0,o)0
>>>for each_line in f:
print(each_line)

```

## OS/OS. path 模块
**模块**是就是我们的源代码文件，其后缀名是`.py`。  
模块可以被别的程序引入，以使用该模块中的函数等功能。
使用`import` 语句导入模块
```python nums
>>> import random
>>> random.randint(0, 9)
3
```


**OS：Operating System 操作系统**  

对于文件系统的访问，Python 一般是通过 OS 模块来实现的。Python 是跨平台的语言，也就是说，同样的源代码在不同的操作系统不需要修改就可以同样实现。有了 OS 模块，不需要关心什么操作系统下使用什么模块，OS 模块会帮你选择正确的模块并调用。

**OS模块中关于文件／目录常用的函数使用方法**
![[Pasted image 20230409210058.jpg]]


**OS. path 模块中关于路径常用的函数使用方法**
![[Pasted image 20230409211600.jpg]]

## pickle 模块
pickle 翻译为泡菜

pickle 模块就可以非常容易**地将列表、字典这类复杂数据类型存储为文件**。它几乎可以把所有 Python 的对象都转化为二进制的形式存放，这个过程称为**pickling（打包，存入）**，那么从二进制形式转换回对象的过程称为**unpickling（打开包裹，读取）**。

### pickling
```python nums
>>> import pickle								# 导入
>>> my_list = [123, 3.14, 'Percy', ['another list']]
>>> pickle_file = open('my_list.pkl', 'wb')			# 创建并打开文件
>>> pickle.dump(my_list, pickle_file)				# 把数据导入文件
>>> pickle_file.close()							# 关闭文件
```
这里希望把这个列表永久保存起来（保存成文件），**打开的文件一定要以二进制的形式打开**，**后缀名倒是可以随意**，不过既然是使用 pickle 保存，为了今后容易记忆，**建议还是使用.pkl 或.pickle**。
使用 `dump` 方法来保存数据，完成后记得保存，与操作普通文本文件一样。

程序执行之后 E 盘会出现一个 my_list.pkl 文件，用记事本打开之后显示乱码（因为它保存的是二进制形式）
![[Pasted image 20230409212745.jpg]]
### unpickling
使用的时候只需用二进制模式先把文件打开，然后用load()把数据加载进来：
```python nums
>>> pickle_file = open('my_list.pkl', 'rb')			# 打开文件
>>> my_list2 = pickle.load(pickle_file)				# 加载文件中的数据
>>> my_list2
[123, 3.14, 'Percy', ['another list']]
```
利用pickle模块，不仅可以保存列表，事实上pickle还可以保存任何你能想象得到的东西。
# 六、异常处理

## 1 标准异常总结

|Python标准异常总结|  |
| --------------------- | ------------------------------------------------------------ |
|AssertionError|断言语句（assert）失败|
| AttributeError        | 尝试访问未知的对象属性                                       |
| EOFError              | 用户输入文件末尾标志 EOF（Ctrl+d）                            |
| FloatingPointError    | 浮点计算错误                                                 |
| GeneratorExit         | generator.close ()方法被调用的时候                            |
| ImportError           | 导入模块失败的时候                                           |
| IndexError            | 索引超出序列的范围                                           |
| KeyError              | 字典中查找一个不存在的关键字                                 |
| KeyboardInterrupt     | 用户输入中断键（Ctrl+c）                                     |
| MemoryError           | 内存溢出（可通过删除对象释放内存）                           |
| NameError             | 尝试访问一个不存在的变量                                     |
| NotImplementedError   | 尚未实现的方法                                               |
| OSError               | 操作系统产生的异常（例如打开一个不存在的文件）               |
| OverflowError         | 数值运算超出最大限制                                         |
| ReferenceError        | 弱引用（weak reference）试图访问一个已经被垃圾回收机制回收了的对象 |
| RuntimeError          | 一般的运行时错误                                             |
| StopIteration         | 迭代器没有更多的值                                           |
| SyntaxError           | Python 的语法错误                                             |
| IndentationError      | 缩进错误                                                     |
| TabError              | Tab 和空格混合使用                                            |
| SystemError           | Python 编译器系统错误                                         |
| SystemExit            | Python 编译器进程被关闭                                       |
| TypeError             | 不同类型间的无效操作                                         |
| UnboundLocalError     | 访问一个未初始化的本地变量（NameError 的子类）                |
| UnicodeError          | Unicode 相关的错误（ValueError 的子类）                        |
| UnicodeEncodeError    | Unicode 编码时的错误（UnicodeError 的子类）                    |
| UnicodeDecodeError    | Unicode 解码时的错误（UnicodeError 的子类）                    |
| UnicodeTranslateError | Unicode 转换时的错误（UnicodeError 的子类）                    |
| ValueError            | 传入无效的参数                                               |
| ZeroDivisionError     | 除数为零                                                     |

## 2 内置异常类的层次结构
BaseException  
+-- SystemExit  
+-- KeyboardInterrupt  
+-- GeneratorExit  
+-- Exception  
      +-- StopIteration  
      +-- ArithmeticError  
      |    +-- FloatingPointError  
      |    +-- OverflowError  
      |    +-- ZeroDivisionError  
      +-- AssertionError  
      +-- AttributeError  
      +-- BufferError  
      +-- EOFError  
      +-- ImportError  
      +-- LookupError  
      |    +-- IndexError  
      |    +-- KeyError  
      +-- MemoryError  
      +-- NameError  
      |    +-- UnboundLocalError  
      +-- OSError  
      |    +-- BlockingIOError  
      |    +-- ChildProcessError  
      |    +-- ConnectionError  
      |    |    +-- BrokenPipeError  
      |    |    +-- ConnectionAbortedError  
      |    |    +-- ConnectionRefusedError  
      |    |    +-- ConnectionResetError  
      |    +-- FileExistsError  
      |    +-- FileNotFoundError  
      |    +-- InterruptedError  
      |    +-- IsADirectoryError  
      |    +-- NotADirectoryError  
      |    +-- PermissionError  
      |    +-- ProcessLookupError  
      |    +-- TimeoutError  
      +-- ReferenceError  
      +-- RuntimeError  
      |    +-- NotImplementedError  
      +-- SyntaxError  
      |    +-- IndentationError  
      |         +-- TabError  
      +-- SystemError  
      +-- TypeError  
      +-- ValueError  
      |    +-- UnicodeError  
      |         +-- UnicodeDecodeError  
      |         +-- UnicodeEncodeError  
      |         +-- UnicodeTranslateError  
      +-- Warning  
           +-- DeprecationWarning  
           +-- PendingDeprecationWarning  
           +-- RuntimeWarning  
           +-- SyntaxWarning  
           +-- UserWarning  
           +-- FutureWarning  
           +-- ImportWarning  
           +-- UnicodeWarning  
           +-- BytesWarning  
           +-- ResourceWarning

## 3 异常捕获 try 语句
可以通过捕获这些异常，并纠正这些错误。
异常捕获可以使用 try 语句来实现，任何出现在 try 语句范围内的异常都会被及时捕获到。try 语句有两种实现形式：一种是 `try-except`；另一种是 `try-finally`。

**注意：`try` 语句检测范围一旦出现异常，剩下的语句将不会被执行！**
### try-except语句
语法结构如下：
```python nums
try:
		检测范围
except Exception[as reason]:  #[as reason]是可选项
		出现异常（Exception）后处理代码
```

```python nums
f = open('我为什么是一个文档.txt')
     print(f.read())
     f.close()
     
# 如果该文档不存在就会报错：
Traceback (most recent call last):
  File "C:\Users\22625\Desktop\LearnPython\1.py", line 1, in <module>
    f = open('我为什么是一个文档.txt')
        ^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '我为什么是一个文档.txt'
```

显然这样的用户体验不好，因此可以这么修改：

```python nums
try:  
		f = open('我为什么是一个文档.txt')  
		print(f.read())  
		f.close()  
except OSError:  
		print('文件打开的过程中出错啦T_T')

#如果该文档不存在就会报错：
文件打开的过程中出错啦T_T
```

从程序员的角度来看，导致 OSError 异常的原因有很多（如 FileExistsError、FileNotFoundError、PermissionError 等），所以可能会更在意错误的具体内容，这里可以使用 as 把具体的错误信息给打印出来：
```python nums
try:  
		f = open('我为什么是一个文档.txt')  
		print(f.read())  
		f.close()  
except OSError as reason:  
		print('文件打开的过程中出错的原因是：'+str(reason))
		
#如果该文档不存在就会报错：
文件打开的过程中出错的原因是：[Errno 2] No such file or directory: '我为什么是一个文档.txt'
```

#### 针对不同异常设置多个except  
一个try语句可以和多个except语句搭配，分别对感兴趣的异常进行检测处理：

```python nums
try:  
		f = open('我是一个不存在的文档.txt')  
		print(f.read())  
		f.close()  
except OSError as reason:  
		print('文件出错啦T_T\n错误原因是:' + str(reason))  
except TypeError as reason:  
		print('类型出错啦T_T\n错误原因是:' + str(reason))
```
#### 对多个异常统一处理
except后面还可以跟着多个异常，然后对这些异常进行统一的处理：
```python nums
try:
	    sum = 1 + '1'
	    f = open('文件1.txt')
	    print(f.read())
	    f.close()
except (OSError, TypeError):
		print('出错啦！！')
```
#### 捕获所有异常
如果无法确定要对哪一类异常进行处理，只是希望在 try 语句块里一旦出现任何异常，可以给用户一个“看得懂”的提醒，那么可以这么做：

```python nums
try:  
		f = open('我是一个不存在的文档.txt')  
		print(f.read())  
		f.close()  
except:  
		print('出错啦!')
```

不过通常不建议这么做，因为它会隐藏所有程序员未想到并且未做好处理准备的错误，例如，当用户通过 Ctrl+C 快捷键强制终止程序，却会被解释为 KeyboardInterrupt 异常。

### try-finally 语句
语法结构如下：
```python nums
try:
	检测范围
except Exception[as reason]:
	出现异常（Exception）后处理代码
finally:
	无论如何都会被执行的代码
```

如果确实存在一个名为“我是一个不存在的文档.txt”的文件，`open()` 函数正常返回文件对象，但异常却发生在成功打开文件后的 `sum = 1 + '1'` 语句上。此时 Python 将直接跳到 `except` 语句，也就是说，文件打开了，但关闭文件的命令却被跳过了。
```python nums
try:  
		f = open('我是一个不存在的文档.txt')  
		print(f.read()) 
		sum = 1 + '1' 
		f.close()  
except:  
		print('出错啦!')
```

**为了实现像这种“就算出现异常，但也不得不执行的收尾工作（如在程序崩溃前保存用户文档）”，引入了 finally 来扩展 try：**

```python nums
try:
    f = open('文件1.txt', 'w')
    print(f.read())
    sum = 1 + '1'
except:
    print('出错啦!')
finally:
	   f.close()
```

如果try语句块中没有出现任何运行时错误，会跳过except语句块执行finally语句块的内容。如果出现异常，则会先执行except语句块的内容再执行finally语句块的内容。总之，finally语句块中的内容就是确保无论如何都将被执行的内容。
## 4 抛出异常 raise 语句
自己抛出一个异常，抛出的异常还可以带参数，表示异常的解释：
**`raise`语句**

```python nums
>>> raise ZeroDivisionError('除数为零的异常')
Traceback (most recent call last):
  File "<pyshell#2>", line 1, in <module>
    raise ZeroDivisionError('除数为零的异常')
ZeroDivisionError: 除数为零的异常
```

## 5  else 语句

else 语句还能够与异常处理进行搭配，实现方法与循环语句搭配差不多：**只要try语句块里没有出现任何异常，那么就会执行else语句块里的内容**。

```python nums
try:
    print(int('123'))
except ValueError as reason:
    print('出错啦！')
else:
    print('没有任何异常')
```

##  6 with 语句

即要打开文件又要关闭文件，还要关注异常处理，有点烦琐，所以 Python 提供了一个 with 语句，利用这个语句抽象出文件操作中频繁使用的 try/except/finally 相关的细节。对文件操作使用 with 语句，将大大减少代码量，而且再也不用担心出现文件打开了忘记关闭的问题了（**with 会自动帮助关闭文件**）。

```python nums
try:
    with open('文件1.txt', 'w') as f:
        for each_line in f:
            print(each_line)
except OSError as reason:
    print('出错啦！！', reason)
```

有了with语句，就再也不用担心忘记关闭文件了。
# 七、类和对象

**对象 = 属性 + 方法**

**定义一个类**：`class`关键字  
Python 中的**类名约定以大写字母开头, 函数用小写字母开头。**

**面向对象的特征（Object Oriented）：**  
a. 封装：信息隐蔽技术  
b. 继承：子类自动共享父类之间数据和方法的机制  
c. 多态：不同对象对同一方法响应不同的行动
```python nums
class Turtle:  
		# Python中的类名约定以大写字母开头  
		# 特征的描述称为属性，在代码层面来看其实就是变量
		color = 'green'  
		weight = 10  
		legs = 4  
		
		# 方法实际就是函数，通过调用这些函数来完成某些工作  
		def climb(self):  
			print("我正在很努力的向前爬...")  
  
		def run(self):  
			print("我正在飞快的向前跑...")  

#类的实例化
tt = Turble()

##调用方法
tt.climb()
我正在很努力的向前爬...
```
## 1 面向对象编程

**（1）`self`**：Python 的 `self` 相当于 C++ 的`this`指针

由同一个类可以生成无数个对象，这些对象长得都很相似，因为他们都是来源于同一个类的属性和方法，当一个对象的方法被调用的时候，**对象会将自身作为第一个参数传给 `self` 参数**，接收到 `self` 的时候，Python 就知道是哪一个对象在调用方法了。
asd 

eg：

```python nums
>>> class Ball:
    def setName(self, name):
        self.name = name
    def talk(self):
        print('我是%s' % self.name)
            
>>> a = Ball()
>>> a.setName('足球')
>>> b = Ball()
>>> b.setName('篮球')
>>> a.talk()
我是足球
>>> b.talk()
我是篮球
```

**（2）构造函数 `__init__()` 

通常把 `__init__()` 方法称为构造函数，`__init__()` 方法的魔力体现在只要实例化一个对象，这个方法就会在对象被创建时自动调用（在 C++里也可以看到类似的东西，叫“构造函数”）。
其实，实例化对象时是可以传入参数的，这些参数会自动传入`__init__()`方法中，可以通过重写这个方法来自定义对象的初始化操作。

```python nums
__init__(self)
__init__(self, param1, param2...)
```


```python nums
>>> class Ball:
    def __init__(self, name):
        self.name = name
    def talk(self):
        print('我是%s' % self.name)

>>> a = Ball('羽毛球')
>>> a.talk()
我是羽毛球
```

**（3）公有和私有**

默认来说，对象的属性和方法都是公有的，可以通过 `.` 操作符进行访问。  

为了实现类似私有变量的特征，Python内部采用了一种叫Name Mangling（名字改编）的技术，在 Python 中**定义私有变量只需要在变量名或函数名前加上 “`__`” 两个下划线**
```python nums
class Person:  
__name = "LiuKe"  
  
P = Person()  
p.__name
# 无法访问私有变量
NameError: name 'p' is not defined. Did you mean: 'P'?
```

只能从内部访问：
```python nums
class Person:  
def __init__(self, name):  
self.__name = name  
  
def getName(self):  
return self.__name  
  
  
p = Person("LiuKe")  
print(p.getName())

#访问成功，打印：
LiuKe
```

但是认真琢磨一下这个技术的名字：name mangling（名字改编），那就不难发现其实 Python 只是动了一下手脚，把两个下画线开头的变量进行了改名而已。
实际上在外部使用“`_类名_ _变量名`”即可访问两个下画线开头的私有变量了：
```python nums
print(p._Person__name)
#打印
LiuKe
```

Python 目前的私有机制其实是**伪私有**，Python 的类是没有权限控制的，所有变量都是可以被外部调用的。

## 2 继承

子类可以继承父类的属性和方法

**1、定义一个子类：**

```python nums
class 子类(父类):
```


```python nums
import random as r

class Fish:
    def __int__(self):
        self.x = r.randint(0, 10)
        self.y = r.randint(0, 10)

    def move(self):
        self.x -= 1
        print('我的位置是：', self.x, self.y)

class Goldfish(Fish):
    pass

class Carp(Fish):
    pass

class Salmon(Fish):
pass
```

运行：

```python nums
>>> fish = Goldfish()
>>> fish.__int__()
>>> fish.move()
我的位置是： 7 9
```

注意：  
如果子类中定义与父类同名的方法或者属性，则会自动覆盖父类对应的方法或属性。

**2、当子类中与父类同名的方法或属性覆盖掉父类中的方法或属性，但又想引用父类中的方法或属性时，我们可以采用以下两种方法：**

**a. 调用未绑定的父类方法  
b. 使用 super 函数**

### 调用未绑定的父类方法

```python nums
import random as r

class Fish:
    def __init__(self):
        self.x = r.randint(0, 10)
        self.y = r.randint(0, 10)

    def move(self):
        self.x -= 1
        print('我的位置是：', self.x, self.y)

class Goldfish(Fish):
    pass

class Carp(Fish):
    pass

class Salmon(Fish):
    pass

class Shark(Fish):
    def __init__(self):
        Fish.__init__(self) 
#这里需要注意的是，这个self并不是父类Fish的实例对象，而是子类Shark的实例对象，所以，这里说的未绑定是指并不需要绑定父类的实例对象，使用子类的实例对象代替即可。
        self.hungry = True

    def eat(self):
        if self.hungry == True:
            print('我饿了！我要吃饭！')
            self.hungry = False
        else:
            print('我好撑！吃不下了！')
```

### 使用 super 函数
方法和上述方法等效，但是**更推荐这一种方法**

**super 函数能够自动找到基类的方法，而且还传入了 self 参数：**
```python nums
import random as r

class Fish:
    def __init__(self):
        self.x = r.randint(0, 10)
        self.y = r.randint(0, 10)

    def move(self):
        self.x -= 1
        print('我的位置是：', self.x, self.y)

class Goldfish(Fish):
    pass

class Carp(Fish):
    pass

class Salmon(Fish):
    pass

class Shark(Fish):
    def __init__(self):
        super().__init__()
        self.hungry = True

    def eat(self):
        if self.hungry == True:
            print('我饿了！我要吃饭！')
            self.hungry = False
        else:
            print('我好撑！吃不下了！')
```

super 函数的“超级”之处在于：不需要明确给出任何基类的名字，它会自动找出所有基类以及对应的方法。由于不用给出基类的名字，这就意味着如果需要改变类继承关系，只要改变 class 语句里的父类即可，而不必在大量代码中去修改所有被继承的方法。

## 3 多重继承

定义一个子类：

```python nums
class DerivedClassName(Base1, Base2, Base3):
	…
```

注意：尽量避免使用多重继承！

## 5 组合

把类的实例化放在新的类里面，就把旧的类组合进去了。

```python nums
class Turtle:
    def __init__(self, x):
        self.num = x

class Fish:
    def __init__(self, y):
        self.num = y

class Pool:
    def __init__(self, x, y):
        self.turtle = Turtle(x)
        self.fish = Fish(y)

    def print_num(self):
        print('水池中有%d只乌龟，%d条鱼。' % (self.turtle.num, self.fish.num))
```

运行：

```python nums
>>> p = Pool(1, 5)
>>> p.print_num()
水池中有1只乌龟，5条鱼。
```

## 6 类、类对象和实例对象
```python nums
>>>class C:
   count = 0
>>> a = c()
>>> b =C ()
>>> c = C()
>>> print(a.count, b.count, c.count)
0 0 0
>>> c.count +=10
>>> print(a.count,b.count,c.count)
0 0 10
>>> C.count +=100
>>> print (a.count,b.count,c.count)
100 100 10

```
从上面的例子可以看出，对实例对象c的count属性进行赋值后，就相当于覆盖了类对象C的count属性，如图11-1所示，如果没有赋值覆盖，那么引用的是类对象的count属性。

![[1680774432595.png]]

需要注意的是，**类中定义的属性是静态变量，也就是相当于 C 语言中加上 static 关键字声明的变量，类的属性是与类对象进行绑定，并不会依赖任何它的实例对象。**

如果实例化对象的属性和类的方法名相同，属性会覆盖掉方法。
```python nums
>>> class C:
    def x(self):
    print ( 'x-man ' ) 
>>> C= C()
>>> c.x()
X-man
>>>C.x =1
>>>c.x
1
>>>c.x()
Traceback (most recent call last) :
File "<pyshell#8>",line 1, in <module>
    c.x()
TypeError: 'int' object is not callable

```
为了避免名字上的冲突，编写代码时应该遵守一些约定俗成的规矩：

•　类的定义要“少吃多餐”，不要试图在一个类里边定义出所有能想到的特性和方法，应该利用继承和组合机制来进行扩展。

•　用不同的词性命名，如属性名用名词、方法名用动词，并使用骆驼命名法。骆驼式命名法（CamelCase）又称驼峰命名法，是电脑程式编写时的一套命名规则（惯例）。

## 7 绑定

Python 严格要求**方法需要有实例才能被调用**，这种限制就是 Python 所谓的绑定概念。

```python nums
>>> class CC:
	def setXY(self, x, y):
		self.x = x
		self.y = y
	def printXY(self):
		print(self.x, self.y)

		
>>> dd = CC()
# 可以使用__dict__查看对象所拥有的属性
# _ _dict_ _属性由一个字典组成，字典中仅有实例对象的属性，不显示类属性和特殊属性，键表示的是属性名，值表示属性相应的数据值。
>>> dd.__dict__
{}
>>> CC.__dict__
mappingproxy({'__module__': '__main__', 'setXY': <function CC.setXY at 0x041B0FA0>, 'printXY': <function CC.printXY at 0x041B8028>, '__dict__': <attribute '__dict__' of 'CC' objects>, '__weakref__': <attribute '__weakref__' of 'CC' objects>, '__doc__': None})
```

未给实例对象`dd`赋值时，`dd`的属性是一个空字典。类对象`CC`的属性中包含实例化对象的属性，不显示类属性和特殊属性。

```python nums
>>> dd.setXY(4, 5)
>>> dd.__dict__
{'x': 4, 'y': 5}
>>> CC.__dict__
mappingproxy({'__module__': '__main__', 'setXY': <function CC.setXY at 0x041B0FA0>, 'printXY': <function CC.printXY at 0x041B8028>, '__dict__': <attribute '__dict__' of 'CC' objects>, '__weakref__': <attribute '__weakref__' of 'CC' objects>, '__doc__': None})
```

给实例对象`dd`赋值后，dd 的属性仅属于`dd`对象，类对象`CC`中不存在`x`和`y`。

```python nums
>>> del CC
>>> ee = CC()
Traceback (most recent call last):
  File "<pyshell#15>", line 1, in <module>
    ee = CC()
NameError: name 'CC' is not defined
>>> dd.printXY()
4 5
```

**删掉类实例`CC`，不能再实例化类`CC`，但实例对象`dd`依旧能调用类`CC`中的方法。因为类中定义的属性和方法都是静态变量，就算类对象被删除了，它们依然是存放在内存中的**。只有当程序被退出的时候，这个变量才会被释放。

## 8 类和对象相关的 BIF
### 检查
**1、`issubclass(class, classinfo)`**

检查`class`是否是`classinfo`的一个子类，是，返回`True`，否，返回`False`。  
注意：  
1. 这种检查是非严格性的检查，一个类被认为是其自身的子类。  
2. `classinfo` 可以是类对象组成的元组，只要 `class` 是其中任何一个候选类的子类，则返回 `True`。如果第二个参数不是类或者由类对象组成的元组，会抛出一个 `TypeError` 异常。

**2、`isinstance(object, classinfo)`**

检查实例对象 `object` 是否是类 `classinfo` 的实例对象，是，返回 `True`，否，返回 `False`。  
注意：  
1. 如果 `object` 是 `classinfo` 的子类的一个实例，也符合条件。
2. `classinfo` 可以是类对象组成的元组，只要 `object` 是其中任何一个候选类的实例对象，则返回 `True`。  
3. 如果第一个参数不是对象，则永远返回 `False`。  
4. 如果第二个参数不是类或者由类对象组成的元组，会抛出一个 `TypeError` 异常。
### 访问对象的属性
attr 即 attribute 的缩写，属性的意思

**3、`hasattr(object, name)`**

测试对象 `object` 是否有指定的属性 `name`，`name` 为字符串格式。

**4、`getattr(object, name[, default])`**

返回对象`object`中指定的属性`name`的值，`default`是当属性`name`不存在时返回的参数。若没有设置default参数，则抛出ArttributeError异常。

**5、`setattr(object, name, value)`**

设置对象`object`中指定的属性`name`的值为`value`，如果属性`name`不存在，会新建一个属性并给它赋值。

**6、`delattr(object, name)`**

删除对象`object`中指定的属性`name`，如果属性`name`不存在，则抛出`AttributeError`异常。

**7、`property(fget=None, fset=None, fdel=None, doc=None)`**

通过属性设置属性。

`property()`返回一个可以设置属性的属性，当然如何设置属性还是需要人为来写代码。第一个参数是获得属性的方法名（例子中是 `getSize`），第二个参数是设置属性的方法名（例子中是 `setSize`），第三个参数是删除属性的方法名（例子中是 `delSize`）。

```python nums
>>> class C:
	def __init__(self, size=10):
		self.size = size
	def getSize(self):
		return self.size
	def setSize(self, value):
		self.size = value
	def delSize(self):
		del self.size
	x = property(getSize, setSize, delSize)

	
>>> c = C()
>>> c.x				# 调用 property第一个参数getSize方法
>>> c.x = 20			# 调用 property第二个参数setSize方法
>>> c.x
>>> del c.x			# 调用 property第三个参数delSize方法
>>> c.x
Traceback (most recent call last):
  File "<pyshell#18>", line 1, in <module>
    c.x
  File "<pyshell#11>", line 5, in getSize
    return self.size
AttributeError: 'C' object has no attribute 'size'
```
property ()有什么作用呢？举个例子，在上面的例子中，为用户提供 setSize 方法名来设置 size 属性，并提供 getSize 方法名来获取属性。但是有一天你心血来潮，突然想对程序进行大改，就可能需要把 setSize 和 getSize 修改为 setXSize 和 getXSize，那就不得不修改用户调用的接口，这样的体验非常不好。

有了 property ()，所有问题就迎刃而解了，因为像上面例子中一样，为用户访问 size 属性只提供了 x 属性。无论内部怎么改动，只需要相应地修改 property ()的参数，用户仍然只需要去操作 x 属性即可，没有任何影响。

很神奇是吧？想知道它是如何工作的？学完下一节就明白了。

# 八、魔法方法

## 1 魔法方法详解

[https://fishc.com.cn/forum.php?mod=viewthread&tid=48793&extra=page%3D1%26filter%3Dtypeid%26typeid%3D403](https://fishc.com.cn/forum.php?mod=viewthread&tid=48793&extra=page=1&filter=typeid&typeid=403)

<table cellspacing="0"><tbody><tr><td width="30%"><div align="center"><strong>魔法方法</strong></div></td><td><div align="center"><strong>含义</strong></div></td></tr><tr><td><br></td><td><div align="left"><div align="center"><font color="#ff0000"><strong>基本的魔法方法</strong></font></div></div></td></tr><tr><td>__new__(cls[, ...])</td><td>1. __new__ 是在一个对象实例化的时候所调用的第一个方法<br>2. 它的第一个参数是这个类，其他的参数是用来直接传递给 __init__ 方法<br>3. __new__ 决定是否要使用该 __init__ 方法，因为 __new__ 可以调用其他类的构造方法或者直接返回别的实例对象来作为本类的实例，如果 __new__ 没有返回实例对象，则 __init__ 不会被调用<br>4. __new__ 主要是用于继承一个不可变的类型比如一个 tuple 或者 string</td></tr><tr><td>__init__(self[, ...])</td><td>构造器，当一个实例被创建的时候调用的初始化方法</td></tr><tr><td>__del__(self)</td><td>析构器，当一个实例被销毁的时候调用的方法</td></tr><tr><td>__call__(self[, args...])</td><td>允许一个类的实例像函数一样被调用：x (a, b) 调用 x.__call__(a, b)</td></tr><tr><td>__len__(self)</td><td>定义当被 len () 调用时的行为</td></tr><tr><td>__repr__(self)</td><td>定义当被 repr () 调用时的行为</td></tr><tr><td>__str__(self)</td><td>定义当被 str () 调用时的行为</td></tr><tr><td>__bytes__(self)</td><td>定义当被 bytes () 调用时的行为</td></tr><tr><td>__hash__(self)</td><td>定义当被 hash () 调用时的行为</td></tr><tr><td>__bool__(self)</td><td>定义当被 bool () 调用时的行为，应该返回 True 或 False</td></tr><tr><td>__format__(self, format_spec)</td><td>定义当被 format () 调用时的行为</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>有关属性</strong></font></div></td></tr><tr><td>__getattr__(self, name)</td><td>定义当用户试图获取一个不存在的属性时的行为</td></tr><tr><td>__getattribute__(self, name)</td><td>定义当该类的属性被访问时的行为</td></tr><tr><td>__setattr__(self, name, value)</td><td>定义当一个属性被设置时的行为</td></tr><tr><td>__delattr__(self, name)</td><td>定义当一个属性被删除时的行为</td></tr><tr><td>__dir__(self)</td><td>定义当 dir () 被调用时的行为</td></tr><tr><td>__get__(self, instance, owner)</td><td>定义当描述符的值被取得时的行为</td></tr><tr><td>__set__(self, instance, value)</td><td>定义当描述符的值被改变时的行为</td></tr><tr><td>__delete__(self, instance)</td><td>定义当描述符的值被删除时的行为</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>比较操作符</strong></font></div></td></tr><tr><td>__lt__(self, other)</td><td>定义小于号的行为：x &lt; y 调用 x.__lt__(y)</td></tr><tr><td>__le__(self, other)</td><td>定义小于等于号的行为：x &lt;= y 调用 x.__le__(y)</td></tr><tr><td>__eq__(self, other)</td><td>定义等于号的行为：x == y 调用 x.__eq__(y)</td></tr><tr><td>__ne__(self, other)</td><td>定义不等号的行为：x != y 调用 x.__ne__(y)</td></tr><tr><td>__gt__(self, other)</td><td>定义大于号的行为：x &gt; y 调用 x.__gt__(y)</td></tr><tr><td>__ge__(self, other)</td><td>定义大于等于号的行为：x &gt;= y 调用 x.__ge__(y)</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>算数运算符</strong></font></div></td></tr><tr><td>__add__(self, other)</td><td>定义加法的行为：+</td></tr><tr><td>__sub__(self, other)</td><td>定义减法的行为：-</td></tr><tr><td>__mul__(self, other)</td><td>定义乘法的行为：*</td></tr><tr><td>__truediv__(self, other)</td><td>定义真除法的行为：/</td></tr><tr><td>__floordiv__(self, other)</td><td>定义整数除法的行为：//</td></tr><tr><td>__mod__(self, other)</td><td>定义取模算法的行为：%</td></tr><tr><td>__divmod__(self, other)</td><td>定义当被 divmod () 调用时的行为</td></tr><tr><td>__pow__(self, other[, modulo])</td><td>定义当被 power () 调用或 ** 运算时的行为</td></tr><tr><td>__lshift__(self, other)</td><td>定义按位左移位的行为：&lt;&lt;</td></tr><tr><td>__rshift__(self, other)</td><td>定义按位右移位的行为：&gt;&gt;</td></tr><tr><td>__and__(self, other)</td><td>定义按位与操作的行为：&amp;</td></tr><tr><td>__xor__(self, other)</td><td>定义按位异或操作的行为：^</td></tr><tr><td>__or__(self, other)</td><td>定义按位或操作的行为：|</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>反运算</strong></font></div></td></tr><tr><td>__radd__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rsub__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rmul__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rtruediv__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rfloordiv__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rmod__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rdivmod__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rpow__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rlshift__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rrshift__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rand__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__rxor__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td>__ror__(self, other)</td><td>（与上方相同，当左操作数不支持相应的操作时被调用）</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>增量赋值运算</strong></font></div></td></tr><tr><td>__iadd__(self, other)</td><td>定义赋值加法的行为：+=</td></tr><tr><td>__isub__(self, other)</td><td>定义赋值减法的行为：-=</td></tr><tr><td>__imul__(self, other)</td><td>定义赋值乘法的行为：*=</td></tr><tr><td>__itruediv__(self, other)</td><td>定义赋值真除法的行为：/=</td></tr><tr><td>__ifloordiv__(self, other)</td><td>定义赋值整数除法的行为：//=</td></tr><tr><td>__imod__(self, other)</td><td>定义赋值取模算法的行为：%=</td></tr><tr><td>__ipow__(self, other[, modulo])</td><td>定义赋值幂运算的行为：**=</td></tr><tr><td>__ilshift__(self, other)</td><td>定义赋值按位左移位的行为：&lt;&lt;=</td></tr><tr><td>__irshift__(self, other)</td><td>定义赋值按位右移位的行为：&gt;&gt;=</td></tr><tr><td>__iand__(self, other)</td><td>定义赋值按位与操作的行为：&amp;=</td></tr><tr><td>__ixor__(self, other)</td><td>定义赋值按位异或操作的行为：^=</td></tr><tr><td>__ior__(self, other)</td><td>定义赋值按位或操作的行为：|=</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>一元操作符</strong></font></div></td></tr><tr><td>__pos__(self)</td><td>定义正号的行为：+x</td></tr><tr><td>__neg__(self)</td><td>定义负号的行为：-x</td></tr><tr><td>__abs__(self)</td><td>定义当被 abs () 调用时的行为</td></tr><tr><td>__invert__(self)</td><td>定义按位求反的行为：~x</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>类型转换</strong></font></div></td></tr><tr><td>__complex__(self)</td><td>定义当被 complex () 调用时的行为（需要返回恰当的值）</td></tr><tr><td>__int__(self)</td><td>定义当被 int () 调用时的行为（需要返回恰当的值）</td></tr><tr><td>__float__(self)</td><td>定义当被 float () 调用时的行为（需要返回恰当的值）</td></tr><tr><td>__round__(self[, n])</td><td>定义当被 round () 调用时的行为（需要返回恰当的值）</td></tr><tr><td>__index__(self)</td><td>1. 当对象是被应用在切片表达式中时，实现整形强制转换<br>2. 如果你定义了一个可能在切片时用到的定制的数值型, 你应该定义 __index__<br>3. 如果 __index__ 被定义，则 __int__ 也需要被定义，且返回相同的值</td></tr><tr><td></td><td><div align="center"><font color="#ff0000"><strong>上下文管理（with 语句）</strong></font></div></td></tr><tr><td>__enter__(self)</td><td>1. 定义当使用 with 语句时的初始化行为<br>2. __enter__ 的返回值被 with 语句的目标或者 as 后的名字绑定</td></tr><tr><td>__exit__(self, exc_type, exc_value, traceback)</td><td>1. 定义当一个代码块被执行或者终止后上下文管理器应该做什么<br>2. 一般被用来处理异常，清除工作或者做一些代码块执行完毕之后的日常工作</td></tr><tr><td></td><td><div align="center"><strong><font color="#ff0000">容器类型</font></strong></div></td></tr><tr><td>__len__(self)</td><td>定义当被 len () 调用时的行为（返回容器中元素的个数）</td></tr><tr><td>__getitem__(self, key)</td><td>定义获取容器中指定元素的行为，相当于 self[key]</td></tr><tr><td>__setitem__(self, key, value)</td><td>定义设置容器中指定元素的行为，相当于 self[key] = value</td></tr><tr><td>__delitem__(self, key)</td><td>定义删除容器中指定元素的行为，相当于 del self[key]</td></tr><tr><td>__iter__(self)</td><td>定义当迭代容器中的元素的行为</td></tr><tr><td>__reversed__(self)</td><td>定义当被 reversed () 调用时的行为</td></tr><tr><td>__contains__(self, item)</td><td>定义当使用成员测试运算符（in 或 not in）时的行为</td></tr></tbody></table>  

## 2 构造和析构

*   魔法方法总是被双下划线包围，例如：`__init__` 方法
*   魔法方法的 "魔力" 体现在它们总能够在适当的时候被自动调用

**（1）`__init__(self[, ...])`**  
在需要对对象进行初始化操作时，才会用到。  
没有 return

**（2）`__new__(cls[, ...])`**  
实例化对象时，第一个被调用的方法。它与其他魔法方法不同，它的第一个参数不是 `self` 而是这个类(cls)，而其他的参数会直接传递给 `_ _init_ _()` 方法。
`_ _new_ _()`方法需要返回一个实例对象，通常是 cls 这个类实例化的对象，当然也可以返回其他对象。
`_ _new_ _()`方法平时很少去重写它，一般让Python用默认的方案执行就可以了。**但是有一种情况需要重写这个魔法方法，就是当继承一个不可变的类型的时候，它的特性就显得尤为重要了。**

```python nums
>>> class CapStr(str):
	def __new__(cls, string):
		string = string.upper()
		return str.__new__(cls, string)

	
>>> a = CapStr('Love')
>>> a
'LOVE'
```

这里的 `CapStr` 是要继承 `str`，但是 `CapStr` 又要把输入的字符串变成大写，`str` 没有这个性质，它是不能改变的，类 `CapStr` 就成了继承 `str` 且能把输入变大写的类

这里返回 str._ _new_ _(cls, string)这种做法是值得推崇的，只需要重写我们关注的那部分内容，然后其他的琐碎东西交给 Python 的默认机制去完成就可以了，毕竟它们出错的概率要比我们自己写小得多。

**（3）`__del__(self)`**  
析构器。  
当对象将要被销毁的时候，这个方法就会被调用。  
并非 `del x` 就相当于自动调用 `x.__del__()`，`__del__` 方法是当垃圾回收机制回收这个对象的时候调用的。  

```python nums
>>> class C:
	def __init__(self):
		print('我是__init__方法，我被调用了！')
	def __del__(self):
		print('我是__del__方法，我被调用了！')

		
>>> c1 = C()
我是__init__方法，我被调用了！
>>> c2 = c1
>>> c3 = c2
>>> del c3
>>> del c2
>>> del c1
我是__del__方法，我被调用了！
```

要删除所有的实例化对象时，才会被调用 `__del__` 方法。

## 3 算术运算
### 工厂函数
Python 2.2以后，对类和类型进行了统一，做法就是将`int()`、`float()`、`str()`、`list()`、`tuple()`这些BIF转换为工厂函数：

```python nums
>>> type(len)
<class 'builtin_function_or_method'>
>>> type(int)
<class 'type'>
>>> type(dir)
<class 'builtin_function_or_method'>
>>> type(list)
<class 'type'>
```
看到没有，普通的 BIF 应该是`<class 'builtin_function_or_method'>`，而工厂函数则是`<class 'type'>`。大家有没有觉得这个<class 'type'>很眼熟，在哪里看过？没错，其实就是一个类：
```python nums
>>>class c:
pass
>>>type(C)
<class 'type'>
```
**所谓的工厂函数，其实就是一个类对象。当调用它们的时候，事实上就是创建一个相应的实例对象：**
```python nums
>>> a = int('123')
>>> b = int('345')
>>> a + b
468
```

### 常见的算术运算
Python的魔法方法还提供了自定义对象的数值处理，**通过对下面这些魔法方法的重写**，可以**自定义任何对象间的算术运算**。
![[Pasted image 20230413211900.jpg]]

```python nums
class New_int(int):  
def __add__(self, other):  
return int.__sub__(self, other)  
  
def __sub__(self, other):  
return int.__add__(self, other)  
  
a = New_int(3)  
b = New_int(5)  
print(a + b)  
print(a - b)

#我们重写了魔法方法，让add实现减法，sub实现加法
-2
8
```

### 反运算
![[Pasted image 20230413212506.jpg]]
### 一元操作符
Python 支持的一元操作符：`_ _neg_ _()` 表示正号行为；`_ _pos_ _()` 表示定义负号行为；而 `_ _abs_ _()` 表示定义 `abs()` 函数（取绝对值）被调用时的行为；`_ _invert_ _()` 表示定义按位取反的行为。

## 4 属性访问
- 通常可以通过点`.`操作符的形式去访问对象的属性
- 还介绍了一个名为 `property()`函数的用法，这个 `property()`使得我们可以用属性去访问属性
- 属性访问相关的魔法方法：
![[Pasted image 20230413213006.jpg]]

## 5 描述符

描述符就是将某种特殊类型的类的实例指派给另一个类的属性。
特殊类型的类称为**描述符类**，就是类中定义以下三种方法中的任意一个的类：
![[Pasted image 20230413214940.jpg]]
1. 当访问 x 属性的时候，Python 会自动调用描述符的 `_ _get_ _()` 方法：
`self` 是描述符类自身的实例；
`instance` 是这个描述符的拥有者所在的类的实例，在这里也就是 Test 类的实例；
`owner` 是这个描述符的拥有者所在的类本身。
2. 对 x 属性进行赋值操作的时候，Python 会自动调用 `_ _set_ _()` 方法，前两个参数与 `_ _get_ _()` 方法是一样的，最后一个参数 `value` 是等号右边的值。
3.  del 操作也是同样的道理：
```python nums
>>> class MyDecriptor:

	def __get__(self, instance, owner):
		print('getting...', self, instance, owner)

	def __set__(self, instance, value):
		print('setting...', self, instance, value)

	def __delete__(self, instance):
		print('deleting...', self, instance)

		
>>> class Test:
	x = MyDecriptor()

	
>>> t = Test()
>>> t.x
getting... <__main__.MyDecriptor object at 0x03CE2760> <__main__.Test object at 0x03FF6040> <class '__main__.Test'>
>>> t.x = '美少女'
setting... <__main__.MyDecriptor object at 0x03CE2760> <__main__.Test object at 0x03FF6040> 美少女
>>> del t.x
deleting... <__main__.MyDecriptor object at 0x03CE2760> <__main__.Test object at 0x03FF6040>
```

**Property 的原理：**
先看一下之前的 property 方法：通过属性设置属性。
`property(fget=None, fset=None, fdel=None, doc=None)`

`property()` 返回一个可以设置属性的属性，当然如何设置属性还是需要人为来写代码。第一个参数是获得属性的方法名（例子中是 `getSize`），第二个参数是设置属性的方法名（例子中是 `setSize`），第三个参数是删除属性的方法名（例子中是 `delSize`）。

```python nums
>>> class C:
	def __init__(self, size=10):
		self.size = size
	def getSize(self):
		return self.size
	def setSize(self, value):
		self.size = value
	def delSize(self):
		del self.size
	x = property(getSize, setSize, delSize)

	
>>> c = C()
>>> c.x				# 调用 property第一个参数getSize方法
>>> c.x = 20			# 调用 property第二个参数setSize方法
>>> c.x
>>> del c.x			# 调用 property第三个参数delSize方法
>>> c.x
Traceback (most recent call last):
  File "<pyshell#18>", line 1, in <module>
    c.x
  File "<pyshell#11>", line 5, in getSize
    return self.size
AttributeError: 'C' object has no attribute 'size'
```

property 事实上就是一个描述符类，我们可以重写 MyProperty 类（作用与 Property 相同）：

```python nums
>>> class MyProperty:
	def __init__(self, fget=None, fset=None, fdel=None):
		self.fget = fget
		self.fset = fset
		self.fdel = fdel
		
	def __get__(self, instance, owner):
		return self.fget(instance)
	
	def __set__(self, instance, value):
		self.fset(instance, value)
		
	def __delete__(self, instance):
		self.fdel(instance)

		
>>> class C:
	def __init__(self):
		self.s = None
		
	def getS(self):
		return self.s
	
	def setS(self, value):
		self.s = value
		
	def delS(self):
		del self.S
		
	x = MyProperty(getS, setS, delS)
```

运行：

```python nums
>>> c = C()
>>> c.s = '美少女'
>>> c.s
'美少女'
>>> del c.s
>>> c.s
Traceback (most recent call last):
  File "<pyshell#52>", line 1, in <module>
    c.s
AttributeError: 'C' object has no attribute 's'
```

结果与 Property 相同

## 6 定制容器

**协议（Protocols）**

与其他编程语言中的接口很相似，它规定你哪些方法必须要定义。然而，在 Python 中的协议就显得不那么正式。事实上，在 Python 中，协议更像是一种指南。
这有点像 Python 极力推崇的[[[鸭子类型（duck typing）,《零基础入门学习Python》（第一版）,Python交流,鱼C论坛 - Powered by Discuz! (fishc.com.cn|鸭子类型]]](https://fishc.com.cn/thread-51471-1-1.html))：当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子。Python 就是这样，并不会严格地要求一定要怎样去做，而是靠着自觉和经验把事情做好。

**容器类型的协议**
在 Python 中，像序列类型（如列表、元组、字符串）或映射类型（如字典）都属于容器类型。本节来讲定制容器，那就必须知道与定制容器有关的一些协议：

*   如果说你希望定制的容器是不可变的话，你只需要定义 `__len__()` 和 `__getitem__()` 方法。

*   如果你希望定制的容器是可变的话，除了 `__len__()` 和 `__getitem__()` 方法，你还需要定义 `__setitem__()` 和 `__delitem__()` 两个方法。
    
    **容器类型**
    ![[Pasted image 20230413222154.jpg]]

编写一个不可改变的自定义列表，要求记录列表中每个元素被访问的次数:
代码：

```python nums
class CountList:
    def __init__(self, *args):
        self.values = [x for x in args]
        self.count = {}.fromkeys(range(len(self.values)), 0)
    
    def __len__(self):
        return len(self.values)

    def __getitem__(self, key):
        self.count[key] += 1
        return self.values[key]
```

运行：

```python nums
>>> c1 = CountList(1, 3, 5, 7, 9)
>>> c2 = CountList(2, 4, 6, 8, 10)
>>> c1[4]
>>> c2[0]
>>> c1[4] + c2[3]
>>> c1.count
{0: 0, 1: 0, 2: 0, 3: 0, 4: 2}
>>> c2.count
{0: 1, 1: 0, 2: 0, 3: 1, 4: 0}
```

## 7 迭代器
迭代的意思类似于循环，每一次重复的过程被称为一次迭代的过程，而**每一次迭代得到的结果会被用来作为下一次迭代的初始值**。
**提供迭代方法的容器称为迭代器**，通常接触的迭代器有序列（如列表、元组、字符）、字典等，它们都支持迭代的操作。
```python nums
#举例：使用for语句进行迭代
>>>for i in "FishC" :
   print (i)
F
i
s
h
C

```
关于迭代，Python提供了两个BIF：
**`iter()`**  ：对于一个容器对象调用 `iter()` 就可以得到迭代器  
**`next()`**  ：迭代器返回下一个值（如果迭代器没有值可以返回了，那么就会抛出一个 `StopIteration` 的异常）

```python nums
>>> string = 'FishC'
>>> it = iter(string)
>>> next(it)
'F'
>>> next(it)
'i'
>>> next(it)
's'
>>> next(it)
'h'
>>> next(it)
'C'
>>> next(it)
Traceback (most recent call last):
  File "<pyshell#7>", line 1, in <module>
    next(it)
StopIteration
```

所以，利用这两个 BIF，可以分析出**for 循环的原理：**

```python nums
>>> string = 'FishC'
>>> it = iter(string)
>>> while True:
	try:
		each = next(it)
	except StopIteration:
		break
	print(each)

	
F
i
s
h
C
```

**迭代器的魔法方法：**

`__iter__()`  ：一个容器如果是迭代器，那就必须实现 `_ _iter_ _()` 魔法方法，这个方法实际上就是返回迭代器本身。
`__next__()`：决定了迭代的规则

**eg：斐波那契数列**

```python nums
>>> class Fibs:
	def __init__(self, n=10):
		self.a = 0
		self.b = 1
		self.n = n
	def __iter__(self):
		return self
	def __next__(self):
		self.a, self.b = self.b, self.a + self.b
		if self.a > self.n:
			raise StopIteration			# 用raise语句来引发一个异常
		return self.a

	
>>> fibs = Fibs()
>>> for each in fibs:
	print(each)

	

>>> fibs = Fibs(50)
>>> for each in fibs:
	print(each)
```

## 8 生成器

迭代器的一种实现，生成器的发明一方面是为了使得Python更为简洁，因为，迭代器需要我们去定义一个类和实现相关的方法，而**生成器则只需要在普通的函数中加上一个yield语句即可**。
另一个更重要的方面，生成器的发明使得 Python 模仿**协同程序**的概念得以实现。所谓协同程序，就是可以运行的独立函数调用，函数可以暂停或者挂起，并在需要的时候从程序离开的地方继续或者重新开始。

对于调用一个普通的 Python 函数，一般是从函数的第一行代码开始执行，结束于 return 语句、异常或者函数所有语句执行完毕。一旦函数将控制权交还给调用者，就意味着全部结束。函数中做的所有工作以及保存在局部变量中的数据都将丢失。再次调用这个函数时，一切都将从头创建。

**Python 是通过生成器来实现类似于协同程序的概念：生成器可以暂时挂起函数，并保留函数的局部变量等数据，然后再次调用它的时候，从上次暂停的位置继续执行下去。**

**生成器**：在普通的函数中加入 `yield` 语句。

**协同程序**：  
可以运行的独立函数调用，函数可以暂停或者挂起，并在需要的时候从程序离开的地方继续或者重新开始。


```python nums
>>> def myGen():
	print("生成器被执行！")
	yield 1
	yield 2

	
>>> g = myGen()
>>> next(g)
生成器被执行！
1
>>> next(g)
2
>>> next(g)
Traceback (most recent call last):
  File "<pyshell#60>", line 1, in <module>
    next(g)
StopIteration #当函数结束时，一个StopIteration异常就会被抛出。

#由于Python的for循环会自动调用next()方法和处理StopIteration异常，所以for循环当然也是可以对生成器产生作用的：
>>> for i in myGen():
	print(i)

生成器被执行！
1
2
```

eg：斐波那契数列

```python nums
>>> def fibs():
	a = 0
	b = 1
	while True:
		a, b = b, a + b
		yield a

		
>>> for each in fibs():
	if each > 20:
		break
	print(each, end = ' ')

	
1 1 2 3 5 8 13
```
## 9 生成器表达式
*   **列表推导式**：

```python nums
>>> [i*i for i in range(10)]
[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

#相当于普通代码：
list1 = []
for i in range (10):
    list1.append(i * i)
```
居然只需要一个语句就可以直接计算0~9各个数的平方值，然后还放到了列表里面，太神奇了！
其实，列表推导式（list comprehensions）也叫列表解析，灵感取自函数式编程语言 Haskell，它是一个非常有用和灵活的工具，可以用来动态地创建列表。

*   **字典推导式**：

```python nums
>>> b = {i : i % 2 == 0 for i in range(10)}
>>> b
{0: True, 1: False, 2: True, 3: False, 4: True, 5: False, 6: True, 7: False, 8: True, 9: False}
```

*   **集合推导式**：

```python nums
>>> c = {i for i in [1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 4, 3, 1]}
>>> c
{1, 2, 3, 4, 5, 6, 7, 8}
```

*   **生成器推导式**：

```python nums
>>> d = (i for i in range(10) if i % 2 == 0)
>>> d
<generator object <genexpr> at 0x03C06290>
>>> next(d)
>>> next(d)
>>> for each in d:
	print(each)
```

如果将生成器表达式作为函数的参数使用的话，可以直接写推导式，而不必加小括号：
```python nums
>>> sum((i for i in range(10) if i % 2 == 0))
>>> sum(i for i in range(10) if i % 2 == 0)
```

一对括号、两对括号，都可以！一对括号更加简洁！

# 九、模块

模块就是平时写的任何代码，保存的每一个.py 结尾的文件，都是一个独立的模块。

模块的主要作用：
- 封装组织 Python 的代码
- 实现代码的重用
## 1 命名空间
命名空间（namespace）表示标识符（identifier）的可见范围。一个标识符可在多个命名空间中定义，它在不同命名空间中的含义是互不相干的。

在 Python 中，每个模块都会维护一个独立的命名空间，应该将模块名加上，才能够正常使用模块中的函数：
```python nums
>>> hello.hi()
Hi everyone, I love FishC.com!
```


## 2 导入模块
（1）`import 模块名`  ：直接使用 import，但是在调用模块中的函数的时候，需要加上模块的命名空间。
```python nums
import p13_1
print ("32摄氏度= %.2f华氏度"% p13_1.c2f(32))
print ("99华氏度= %.2f摄氏度" % p13_1.f2c(99))

```

（2）`from 模块名 import 函数名`  ：这种导入方法会直接将模块的命名空间覆盖进来，所以调用的时候也就不需要再加上命名空间了：
```python nums
from p13_1 import c2f,f2c
print ("32摄氏度= %.2f华氏度" % c2f(32))
print("99华氏度=%.2f摄氏度"% f2c(99))
```
强烈要求大家**不要使用这种方法**，因为这样做会使得命名空间的优势荡然无存，一不小心还会陷入名字混乱的局面。

（3）`import 模块名 as 新名字`：第三种方法结合了前两种的优势，使用这种方法可以给导入的命名空间起一个新的名字：
```python nums
import p13_1 as tc
print ("32摄氏度= %.2f华氏度"% tc.c2(32))
print("99华氏度=%.2f摄氏度"% tc.2c(99))
```

## 3  `__name__ == '__main__'`
在阅读代码时，会发现很多代码中都有 `if _ _name_ _ =='_ _main_ _'` 这行语句，这句话意思就是判断模块是作为程序运行还是导入到其他模块中

在主程序中使用`__name__`变量：

```
>>> __name__
'__main__'
```

在模块中使用`__name__`变量：得到模块名

```
>>> import random as r
>>> r.__name__
'random'
```

只有单独运行该模块时才会执行 test()函数，其他模板导入该模板则不会执行。
```python nums
#test1.py
def c2f(cel):
    fah = cel * 1.8 + 32
    return fah
def f2c(fah) :
    cel = (fah - 32) / 1.8
    return cel
def test():
    print("测试，О摄氏度=%.2f华氏度"% c2f(0))
    print("测试，0华氏度=%.2f摄氏度"%f2c(0))

if__name__ == '__main__':
    test ()


#test2.py
import test1 as tc
print ("32摄氏度=%.2f华氏度"% tc.c2f(32))
print ("99华氏度= %.2f摄氏度" % tc.f2c(99))
# 不会执行test1.py中的test
```
## 搜索路径
Python 模块的导入需要一个路径搜索的过程。例如导入一个名为 hello 的模块，Python 会在预定义好的搜索路径中寻找一个名为 hello.py 的模块文件：如果有，则导入；如果没有，则导入失败。

而这个搜索路径，就是一组目录，可以通过 sys 模块中的 path 变量显示出来（不同机器上显示的路径信息可能不一样）：

搜索路径其实是一个列表，系统有默认的搜索路径列表。  
可以选择创建一个文件夹来保存你写的模块，但需要在搜索路径列表中添加这个文件夹的所在位置。  
添加可以采用`append()`方法。

## 5 包（package）

创建一个包：  
（1）创建一个文件夹，用于存放相关的模块，文件夹的名字即包的名字；  
（2）在文件夹中创建一个`__init__.py`的模块文件，内容可以为空；  
（3）将相关的模块放入文件夹中。

在第（2）步中，必须在每一个包目录下建立一个`_ _init_ _.py` 模块，可以是一个空文件，也可以写一些初始化代码。这是 Python 的规定，用来告诉 Python 将该目录当成一个包来处理。

导入时：`import 包名.模块名`
## 五、Python 标准库

Python 标准库中包含一般任务所需要的模块

快速了解一个模块：

（1）`print(模块名.__doc__)`

```
>>> import timeit
>>> print(timeit.__doc__)
			# 得到balabala一大堆...（这里省略）
>>> dir(timeit)
['Timer', '__all__', '__builtins__', '__cached__', '__doc__', '__file__', '__loader__', '__name__', '__package__', '__spec__', '_globals', 'default_number', 'default_repeat', 'default_timer', 'dummy_src_name', 'gc', 'itertools', 'main', 'reindent', 'repeat', 'sys', 'template', 'time', 'timeit']
>>> timeit.__all__
['Timer', 'timeit', 'repeat', 'default_timer']			# 可以被外部调用的
```

*   当使用`from timeit import *`这种方法导入：导入的参数只有`timeit.__all__`中的参数，其他参数不导入。

```
>>> from timeit import *
>>> Timer
<class 'timeit.Timer'>
>>> gc
Traceback (most recent call last):
  File "<pyshell#8>", line 1, in <module>
    gc
NameError: name 'gc' is not defined
```

*   `__file__`：指明该模块源代码所在位置

```
>>> import timeit
>>> timeit.__file__
'C:\\Users\\zhuya\\AppData\\Local\\Programs\\Python\\Python38-32\\lib\\timeit.py'
```

（2）`help(模块名)`

```
>>> help(timeit)
			# 得到balabala一大堆...（这里省略）
```