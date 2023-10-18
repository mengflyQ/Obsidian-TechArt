# 位置编码 Positional Encoding
导语：Transformer 是最新的处理序列到序列问题的架构，单纯由 self-attention 组成，其优良的可并行性以及可观的表现提升，让它在 NLP 领域中大受欢迎，GPT-3 以及 BERT 都是基于 Transformer 实现的。鉴于 Transformer 在 NLP 问题上的优异表现，也有越来越多人将其改编引入到了 CV 领域。

Transformer 具体的原理我在这里就不做深入解释了，推荐看这篇文章，这位大佬已经讲得很详细了，而且通俗易懂。

[川陀学者：Attention 机制详解（二）——Self-Attention 与 Transformer](https://zhuanlan.zhihu.com/p/47282410)

这边我主要介绍一下其中一个我个人刚开始学习 Transformer 时，感觉问题比较多的一个模块 - **Positional Encoding.**

![[1683383583186.png]]

## 什么是 Positional Encoding ？为什么 Transformer 需要 Positional Enconding?

在任何一门语言中，词语的位置和顺序对句子意思表达都是至关重要的。传统的 RNN 模型在处理句子时，以**序列的模式逐个处理句子中的词语**，这使得词语的顺序信息在处理过程中被天然的保存下来了，并不需要额外的处理。

而对于 Transformer 来说，由于句子中的词语都是**同时进入网络进行处理，顺序信息在输入网络时就已丢失**。因此，Transformer 是需要额外的处理来告知每个词语的相对位置的。其中的一个解决方案，就是论文中提到的 Positional Encoding，将**能表示位置信息的编码添加到输入中，让网络知道每个词的位置和顺序。**

一句话概括，**Positional Encoding 就是句子中词语相对位置的编码，让 Transformer 保留词语的位置信息。**

## 怎么样去做 Positional Encoding？

要表示位置信息，首先出现在脑海里的一个点子可能是，给句子中的每个词赋予一个相位，也就是 $[0, 1]$ 中间的一个值，第一个词是 0，最后一个词是 1，中间的词在 0 到 1 之间取值。

这是个符合直觉的想法，但是这样会不会有什么问题呢？

其中一个问题在于，你并不知道每个句子中词语的个数是多少，这会导致每个词语之间的间隔变化是不一致的。而对于一个句子来说，每个词语之间的间隔都应该是具有相同含义的。

那，为了保证每个词语的间隔含义一致，我们是不是可以给每个词语添加一个线性增长的时间戳呢？比如说第一个词是 0，第二词是 1，以此类推，第 N 个词的位置编码是 N。

这样其实也会有问题。同样，我们并不知道一个句子的长度，如果训练的句子很长的话，这样的编码是不合适的。 另外，这样训练出来的模型，在泛化性上是有一定问题的。

因此，理想状态下，编码方式应该要满足以下几个条件，

*   **对于每个位置的词语，它都能提供一个独一无二的编码**
*   **词语之间的间隔对于不同长度的句子来说，含义应该是一致的**
*   **能够随意延伸到任意长度的句子**

文章提出了一种简单且有效的编码能够满足以上所有条件。

## 公式表达

![[1683383583245.png]]
$\displaystyle\text{where}\omega_k=\frac{1}{10000^{2k/d}}$

t 表示当前词语在句子中的位置， $\vec{p_t} \in R^d$ 表示的是该词语对应的位置编码， $d$ 表示的是编码的维度。

$\vec{p_t} = \begin{bmatrix} \sin({\omega_1}.t)\\ \cos({\omega_1}.t)\\ \\ \sin({\omega_2}.t)\\ \cos({\omega_2}.t)\\ \\ \vdots\\ \\ \sin({\omega_{d/2}}.t)\\ \cos({\omega_{d/2}}.t) \end{bmatrix}_{d \times 1}$

从公式可以看出，其实一个词语的位置编码是由不同频率的余弦函数函数组成的，从低位到高位，余弦函数对应的频率由 $1$ 降低到了 $\frac{1}{10000}$ ，按照论文中的说法，也就是，波长从 $2\pi$ 增加到了 $10000 \cdot 2\pi$ 。

## 直观理解

为什么这样简单的 sines 和 cosines 的组合可以表达位置信息呢？一开始的确有点难理解。别着急，这边举个二进制的例子就明白了。可以观察一下下面这个表，我们将数字用二进制表示出来。可以发现，每个比特位的变化率是不一样的，越低位的变化越快，红色位置 0 和 1 每个数字会变化一次，而黄色位，每 8 个数字才会变化一次。

![[1683383583323.png]]

不同频率的 sines 和 cosines 组合其实也是同样的道理，通过调整三角函数的频率，我们可以实现这种低位到高位的变化，这样的话，位置信息就表示出来了。

![[1683383583393.png]]

![[1683383583460.png]]

## 代码实现

```
class PositionalEncoding(nn.Module):

    def __init__(self, d_model, max_len=5000):
        super(PositionalEncoding, self).__init__()       
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        #pe.requires_grad = False
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:x.size(0), :]
```

## 参考资料

[Transformer Architecture: The Positional Encoding](https://kazemnejad.com/blog/transformer_architecture_positional_encoding/)[http://nlp.seas.harvard.edu/2018/04/03/attention.html](http://nlp.seas.harvard.edu/2018/04/03/attention.html)[http://vandergoten.ai/2018-09-18-attention-is-all-you-need/](http://vandergoten.ai/2018-09-18-attention-is-all-you-need/)