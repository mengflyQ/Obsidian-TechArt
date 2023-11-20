
# 1 前言

```python
if __name__ == "__main__":
    #Adding necessary input arguments
    parser = argparse.ArgumentParser(description='test')
    parser.add_argument('--input_path',default="input", type=str,help ='input files')
    parser.add_argument('--output_path',default = "output", type=str,help='result dir.')    
    args = parser.parse_args()
run()
```

代码解释：
*   设置 python 文件的 input_path，默认为该目录下的 input 文件夹
*   设置 python 文件的 output_path，默认为该目录下的 output 文件夹
*   也就是规定了输入来源和输出去向。

这个版块在 python 文件中还是比较经典的，**argparse 模块，其实质就是将相关参数进行设置。**

相对专业说法：
*   `argparse` 模块提供轻松编写用户友好的命令行接口。
*   程序定义它需要的参数，然后 `argparse` 将弄清如何从 `sys.argv` 解析出那些参数。
*   `argparse` 模块会自动生成帮助和使用手册，并在用户给程序传入无效参数时报出错误信息。

# 2. 使用方法

### 2.1 实例化 ArgumentParser

```python
# 实例化
# 创建一个 ArgumentParser 对象
# ArgumentParser 对象包含将命令行解析成 Python 数据类型所需的全部信息。
parser = argparse.ArgumentParser(description = 'test')
```

*    **description：** 大多数对 ArgumentParser 构造方法的调用都会使用 description= 关键字参数。这个参数简要**描述这个程度做什么以及怎么做**。在帮助消息中，这个描述会显示在命令行用法字符串和各种参数的帮助消息之间。

### 2.2 使用 add_argument() 函数添加参数 

```python
parser.add_argument('--input_path',default="input", type=str,help ='input files')
parser.add_argument('--output_path',default = "output", type=str,help='result dir.') 
```

*   这些调用指定 ArgumentParser 如何获取命令行字符串并将其转换为对象。 

### 2.3 add_argument() 方法定义如何解析命令行参数

 ```python
ArgumentParser.add_argument(name or flags...[, action][, nargs][, const][, default][, type][, choices][, required][, help][, metavar][, dest])
```

每个参数解析如下：
*   **name or flags ：**选项字符串的名字或者列表，例如 foo 或者 -f, --foo。
*   **action：** 命令行遇到参数时的动作，默认值是 store。
*   **store_const：**表示赋值为 const；
*   **append：**将遇到的值存储成列表，也就是如果参数重复则会保存多个值;
*   **append_const：**将参数规范中定义的一个值保存到一个列表；
*   **count：**存储遇到的次数；此外，也可以继承 argparse.Action 自定义参数解析；
*   **nargs :** 应该读取的命令行参数个数，可以是具体的数字，或者是? 号，当不指定值时对于 Positional argument 使用 default—对于 Optional argument 使用 const；或者是 * 号，表示 0 或多个参数；或者是 + 号表示 1 或多个参数。
*   **const-action** 和 **nargs** 所需要的常量值。
*   **default：** 不指定参数时的默认值。
*   **type：** 命令行参数应该被转换成的类型。
*   **choices：**参数可允许的值的一个容器。
*   **required：**可选参数是否可以省略 (仅针对可选参数)。
*   **help：**参数的帮助信息，当指定为 argparse.SUPPRESS 时表示不显示该参数的帮助信息.
*   **metavar：**在 usage 说明中的参数名称，对于必选参数默认就是参数名称，对于可选参数默认是全大写的参数名称.
*   **dest：** 解析后的参数名称，默认情况，对于可选参数选取最长的名称，中划线转换为下划线.

### 2.4 使用 parse_args 解析参数

ArgumentParser 通过`parse_args()` 方法解析参数。它将检查命令行，把每个参数转换为适当的类型然后调用相应的操作。在大多数情况下，这意味着一个简单的 Namespace 对象将从命令行解析出的属性构建：

```
# 解析参数
args = parser.parse_args()
print (args.echo)
```

# 3 案例实践：action 的可选参数 store_true 的作用

```python
parser.add_argument('--R0', action='store_true')
parser.add_argument('--R20', action='store_true')
parser.add_argument('--Final',default=True,action='store_true')
args = parser.parse_args()
if int(args.R0) + int(args.R20) + int(args.Final) == 0:
        assert False, 'Please activate one of the [R0, R20, Final] options using --[R0]'
elif int(args.R0) + int(args.R20) + int(args.Final) > 1:
        assert False, 'Please activate only ONE of the [R0, R20, Final] options'
```

直接在 Vscode 运行时，报错如下，需要指定相关触发，即输入 python xxx.py --R0 , 则 R0 True 

```
AssertionError: Please activate one of the [RO，R20，Final] options using --[RO0]


```

不想在终端输入控制，则可用 default = True，进行控制，得到的结果也是 True，主要便于 Bebug。

[Python Parser 的用法](https://www.jb51.net/article/212035.htm "Python Parser的用法")

[python argparse 中 action 的可选参数 store_true 的作用](https://blog.csdn.net/tsinghuahui/article/details/89279152 "python argparse中action的可选参数store_true的作用")

[python 之 parser 用法](https://zhuanlan.zhihu.com/p/467668951 "python之parser用法 ")