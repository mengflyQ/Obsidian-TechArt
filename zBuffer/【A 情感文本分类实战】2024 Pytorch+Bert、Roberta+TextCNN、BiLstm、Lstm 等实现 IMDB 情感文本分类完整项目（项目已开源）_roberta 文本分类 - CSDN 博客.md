![](https://img-blog.csdnimg.cn/6089daa72d9c4ff8902d275b114284d2.jpeg)

🍊顶会的代码干净利索，借鉴其完成了以下工程

🍊本工程采用 [Pytorch 框架](https://so.csdn.net/so/search?q=Pytorch%E6%A1%86%E6%9E%B6&spm=1001.2101.3001.7020)，使用上游语言模型 + 下游网络模型的结构实现 IMDB 情感分析

🍊预训练大[语言模型](https://so.csdn.net/so/search?q=%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B&spm=1001.2101.3001.7020)可选择 Bert、Roberta

🍊下游网络模型可选择 BiLSTM、LSTM、TextCNN、GRU、Attention 以及其组合

🍊语言模型和网络模型扩展性较好，可以此为 BaseLine 再使用你的数据集，模型

🍊最终的准确率均在 90% 以上

🍊项目已开源，clone 下来再配个简单环境就能跑

🥳🥳🥳有小伙伴询问如何融合使用 Attention、LSTM+TextCNN 和 Lstm+TextCNN+Self-Attention 的网络模型，现源码已经重新上传（2023-03），大家可以揣摩一下是如何结合的，如此，对照类似的做法，推广到其他模型上

如果这篇文章对您有帮助，期待大佬们 Github 上给个⭐️⭐️⭐️

## 一、Introduction

### 1.1 网络架构图

该网络主要使用上游预训练模型 + 下游情感分类模型组成

![](https://img-blog.csdnimg.cn/00c5b759508d4228bf299519c49b563b.png)

### 1.2 快速使用

该项目已开源在 Github 上，地址为 [sentiment_analysis_Imdb](https://github.com/BeiCunNan/sentiment_analysis_Imdb "sentiment_analysis_Imdb")

![](https://img-blog.csdnimg.cn/direct/aa2cc3cc58f44fd28fd7f34adb01f2bc.png)

主要环境要求如下（环境不要太老基本没啥问题的）

![](https://img-blog.csdnimg.cn/e57e37bc6ee54bd2b30038312977d74e.png)

下载该项目后，配置相对应的环境，在 config.py 文件中选择所需的语言模型和神经网络模型如下图所示，运行 main.py 文件即可

![](https://img-blog.csdnimg.cn/3384f41ee3554f2ca42b96cd520355af.png)

###  1.3 工程结构

![](https://img-blog.csdnimg.cn/b8b25641c41c47669a58f06890ab6888.png)

*   logs  每次运行程序后的日志文件集合
*   config.py 全局配置文件
*   data.py 数据读取、数据清洗、数据格式转换、制作 DataSet 和 DataLoader
*   main.py 主函数，负责全流程项目运行，包括语言模型的转换，模型的训练和测试
*   model.py 神经网络模型的设计和读取

## 二、Config

看了很多论文源代码中都使用 parser 容器进行全局变量的配置，因此作者也照葫芦画瓢编写了 config.py 文件（适配的话一般只改 Base 部分）

```python
import argparse
import logging
import os
import random
import sys
import time
from datetime import datetime
 
import torch
 
 
def get_config():
    parser = argparse.ArgumentParser()
    '''Base'''
 
    parser.add_argument('--num_classes', type=int, default=2)
    parser.add_argument('--model_name', type=str, default='bert',
                        choices=['bert', 'roberta'])
    parser.add_argument('--method_name', type=str, default='fnn',
                        choices=['gru', 'rnn', 'bilstm', 'lstm', 'fnn', 'textcnn', 'attention', 'lstm+textcnn',
                                 'lstm_textcnn_attention'])
 
    '''Optimization'''
    parser.add_argument('--train_batch_size', type=int, default=4)
    parser.add_argument('--test_batch_size', type=int, default=16)
    parser.add_argument('--num_epoch', type=int, default=50)
    parser.add_argument('--lr', type=float, default=1e-5)
    parser.add_argument('--weight_decay', type=float, default=0.01)
 
    '''Environment'''
    parser.add_argument('--device', type=str, default='cpu')
    parser.add_argument('--backend', default=False, action='store_true')
    parser.add_argument('--workers', type=int, default=0)
    parser.add_argument('--timestamp', type=int, default='{:.0f}{:03}'.format(time.time(), random.randint(0, 999)))
 
    args = parser.parse_args()
    args.device = torch.device(args.device)
 
    '''logger'''
    args.log_name = '{}_{}_{}.log'.format(args.model_name, args.method_name,
                                          datetime.now().strftime('%Y-%m-%d_%H-%M-%S')[2:])
    if not os.path.exists('logs'):
        os.mkdir('logs')
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(logging.StreamHandler(sys.stdout))
    logger.addHandler(logging.FileHandler(os.path.join('logs', args.log_name)))
    return args, logger
```

## 三、Data

### 3.1 数据准备

首先需要下载 IMDB 数据集，并对其进行初步处理，其处理过程可参考一下文章 [IMDB 数据预处理](https://beicunnan.blog.csdn.net/article/details/127196715?spm=1001.2014.3001.5502 "IMDB数据预处理")

也可以直接从 Github 上获取已处理好的数据集，处理好的数据格式如下

![](https://img-blog.csdnimg.cn/7cdf7726e2174c7e8ae1bde93a7df380.png)

### 3.2 数据预处理

由于 IMDB 数据量非常庞大，使用全数据的训练时间非常长（算力好的小伙伴可忽略），因此这里使用 10% 的数据量进行训练

```python
data = pd.read_csv('datasets.csv', sep=None, header=0, encoding='utf-8', engine='python')
    len1 = int(len(list(data['labels'])) * 0.1)
    labels = list(data['labels'])[0:len1]
    sentences = list(data['sentences'])[0:len1]
    # split train_set and test_set
    tr_sen, te_sen, tr_lab, te_lab = train_test_split(sentences, labels, train_size=0.8)
```

### 3.3 制作 DataSet

划分训练集和测试集之后就可以制作自己的 DataSet

```python
# Dataset
    train_set = MyDataset(tr_sen, tr_lab, method_name, model_name)
    test_set = MyDataset(te_sen, te_lab, method_name, model_name)
```

MyDataset 的结构如下

*   使用 split 方法将每个单词提取出来作为后续 bertToken 的输入
*   后续制作 DataLoader 需要使用 collate_fn 函数因此需要重写__getitem__方法

```python
class MyDataset(Dataset):
    def __init__(self, sentences, labels, method_name, model_name):
        self.sentences = sentences
        self.labels = labels
        self.method_name = method_name
        self.model_name = model_name
        dataset = list()
        index = 0
        for data in sentences:
            tokens = data.split(' ')
            labels_id = labels[index]
            index += 1
            dataset.append((tokens, labels_id))
        self._dataset = dataset
 
    def __getitem__(self, index):
        return self._dataset[index]
 
    def __len__(self):
        return len(self.sentences)
```

### 3.4 制作 DataLoader

得到 DataSet 之后就可以制作 DataLoader 了

*   首先需要编写 my_collate 函数，该函数的功能是对每一个 batch 的数据进行处理
*   在这里的数据处理是将文本数据进行 Tokenizer 化作为后续 Bert 模型的输入
*   通过计算可得知 80% 句子的长度低于 320，因此将句子长度固定为 320，多截少补
*   partial 是 Python 偏函数，使用该函数后，my_collate 的输入参数只有一个 batch

```python
def my_collate(batch, tokenizer):
    tokens, label_ids = map(list, zip(*batch))
 
    text_ids = tokenizer(tokens,
                         padding=True,
                         truncation=True,
                         max_length=320,
                         is_split_into_words=True,
                         add_special_tokens=True,
                         return_tensors='pt')
    return text_ids, torch.tensor(label_ids)
```

```python
# DataLoader
    collate_fn = partial(my_collate, tokenizer=tokenizer)
    train_loader = DataLoader(train_set, batch_size=train_batch_size, shuffle=True, num_workers=workers,
                              collate_fn=collate_fn, pin_memory=True)
    test_loader = DataLoader(test_set, batch_size=test_batch_size, shuffle=True, num_workers=workers,
                             collate_fn=collate_fn, pin_memory=True)
```

到此我们就完成制作了 DataLoader，后续从 DataLoader 中可获取一个个 batch 经 Tokenizer 化后的数据

## 四、Language model

对于网络模型来说，只能接受数字数据类型，**因此我们需要建立一个语言模型，目的是将每个单词变成一个向量，每个句子变成一个矩阵**。关于语言模型，其已经发展历史非常悠久了（发展历史如下），**其中 Bert 模型是 Google 大神出的具有里程碑性质的模型，因此本篇博客也主要采用此模型**

![](https://img-blog.csdnimg.cn/0fef69e5e0474fd28d45598afa6b0717.png)

所用的模型都是通过 API 从  [Hugging Face 官网](https://huggingface.co/models?pipeline_tag=sentence-similarity&sort=downloads "Hugging Face官网") 中直接下载的

Hugging Face 中有非常多好用的语言模型，小伙伴们也可尝试其他模型

![](https://img-blog.csdnimg.cn/53bd5e762ef149b1a301ecba90fc9d39.png)

使用 AutoModel.from_pretrained 接口下载预训练模型

使用 AutoTokenizere.from_pretrained 接口下载预训练模型的分词器

```python
# Create model
        if args.model_name == 'bert':
            self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            self.input_size = 768
            base_model = AutoModel.from_pretrained('bert-base-uncased')
        elif args.model_name == 'roberta':
            self.tokenizer = AutoTokenizer.from_pretrained('roberta-base', add_prefix_space=True)
            self.input_size = 768
            base_model = AutoModel.from_pretrained('roberta-base')
        else:
            raise ValueError('unknown model')
```

下载创建好 Bert 之后，在训练和测试的时候，每次从 DataLoadr 中获取一个个经过 Tokenizer 分词之后 Batch 的数据，随后将其投放到语言模型中

*   ** input ：input 的数据是 Tokenizer 化后的数据如 {'input_id' : ~ , 'token_type_ids' : ~ , 'attention_mask' : ~}，** 是将里面的三个 dict 分成一个个独立的 dict，即 { 'input_id' : ~} ，{ 'token_type_ids' : ~} ，{ 'attention_mask' : ~}
*   raw_outputs 获取的是 Bert 的输出，Bert 的输出主要有四个，其中 last_hidden_state 表示的是最后一层隐藏层的状态，也就是每个单词的 Token 的集合

```python
raw_outputs = self.base_model(**inputs)
tokens = raw_outputs.last_hidden_state
```

**到此，上游语言模型全部结束，得到了一个个经过 Bert 后维度为`[batch 大小，句子长度，单词维度]` 的数据**

## 五、Neural network model

关于 RNN 的原理解释，小伙伴可以看以下文章

[【Deep Learning 7】RNN 循环神经网络](https://blog.csdn.net/ccaoshangfei/article/details/127513564?spm=1001.2014.3001.5501 "【Deep Learning 7】RNN循环神经网络")

### 5.1 RNN

Bilstm、lstm、gru 本质上来说都是属于 RNN 模型，因此我们就以 RNN 模型为例子看看上游任务的数据是如何进入到下游文本分类的

**RNN 输入参数**

*   input_size：每个单词维度
*   hidden_size：隐含层的维度（一般设置与句子长度一致）
*   num_layers：RNN 层数，默认是 1，单层 LSTM
*   bias：是否使用 bias
*   batch_first：默认为 False，如果设置为 True，则表示第一个维度表示的是 batch_size
*   dropout：随机失活，一般在最终分类器那块写层 Dropout，这里就不用了
*   bidirectional：是否使用 BiLSTM

 由于是情感分析文本二分类任务，因此还需要一个 FNN+Softmax 分类器进行分类预测

```python
class Rnn_Model(nn.Module):
    def __init__(self, base_model, num_classes, input_size):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        self.input_size = input_size
        self.Rnn = nn.RNN(input_size=self.input_size,
                          hidden_size=320,
                          num_layers=1,
                          batch_first=True)
        self.fc = nn.Sequential(nn.Dropout(0.5),
                                nn.Linear(320, 80),
                                nn.Linear(80, 20),
                                nn.Linear(20, self.num_classes),
                                nn.Softmax(dim=1))
        for param in base_model.parameters():
            param.requires_grad = (True)
```

 再来看看 RNN 的传播过程

 **RNN 输出参数**

output, (hn, cn) = lstm(inputs)

output_last = output[:,-1,:]

*   output：每个时间步输出
*   output_last：最后一个时间步隐藏层神经元输出，也就是最终的特征表示
*   hn：最后一个时间步隐藏层的状态
*   cn：最后一个时间步隐藏层的遗忘门值

由于我们用不到 hn 和 cn，因此直接使用_来代替

```python
def forward(self, inputs):
        
        # 上游任务
        raw_outputs = self.base_model(**inputs)
        cls_feats = raw_outputs.last_hidden_state
    
        # 下游任务
        outputs, _ = self.Rnn(cls_feats)
        outputs = outputs[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

 输出的 outputs 就是预测结果

### 5.2 GRU

其实熟悉了 RNN 网络模块之后，其他几个网络模块的也就非常好理解了

将 nn.RNN 修改为 nn.GRU

```python
class Gru_Model(nn.Module):
    def __init__(self, base_model, num_classes, input_size):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        self.input_size = input_size
        self.Gru = nn.GRU(input_size=self.input_size,
                          hidden_size=320,
                          num_layers=1,
                          batch_first=True)
        self.fc = nn.Sequential(nn.Dropout(0.5),
                                nn.Linear(320, 80),
                                nn.Linear(80, 20),
                                nn.Linear(20, self.num_classes),
                                nn.Softmax(dim=1))
        for param in base_model.parameters():
            param.requires_grad = (True)
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
 
        gru_output, _ = self.Gru(tokens)
        outputs = gru_output[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

### 5.3 LSTM

将 nn.RNN 修改为 nn.LSTM

```python
class Lstm_Model(nn.Module):
    def __init__(self, base_model, num_classes, input_size):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        self.input_size = input_size
        self.Lstm = nn.LSTM(input_size=self.input_size,
                            hidden_size=320,
                            num_layers=1,
                            batch_first=True)
        self.fc = nn.Sequential(nn.Dropout(0.5),
                                nn.Linear(320, 80),
                                nn.Linear(80, 20),
                                nn.Linear(20, self.num_classes),
                                nn.Softmax(dim=1))
        for param in base_model.parameters():
            param.requires_grad = (True)
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
        lstm_output, _ = self.Lstm(tokens)
        outputs = lstm_output[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

### 5.4 BILSTM

bilstm 与其他几个网络模型稍微有点不同，需要修改的地方有三处

*   将 nn.RNN 修改为 nn.LSTM
*   在 nn.LSTM 中添加 bidirectional=True
*   一个 BILSTM 是由两个 LSTM 组合而成的，因此 FNN 输入的维度也要乘 2，即 nn.Linear(320 * 2, 80)

```python
class BiLstm_Model(nn.Module):
    def __init__(self, base_model, num_classes, input_size):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        self.input_size = input_size
        # Open the bidirectional
        self.BiLstm = nn.LSTM(input_size=self.input_size,
                              hidden_size=320,
                              num_layers=1,
                              batch_first=True,
                              bidirectional=True)
        self.fc = nn.Sequential(nn.Dropout(0.5),
                                nn.Linear(320 * 2, 80),
                                nn.Linear(80, 20),
                                nn.Linear(20, self.num_classes),
                                nn.Softmax(dim=1))
        for param in base_model.parameters():
            param.requires_grad = (True)
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        cls_feats = raw_outputs.last_hidden_state
        outputs, _ = self.BiLstm(cls_feats)
        outputs = outputs[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

### 5.5 TextCNN

既然 RNN 可以做文本分类，那 CNN 呢？答案当然是可以的，早在 2014 年就出现了 TextCNN，原模型如下

![](https://img-blog.csdnimg.cn/a44bb796d08d4ab7b8aa12c451061bdc.png)

欸，看起来可能有点抽象，看另一篇解释该模型的图可能好理解多了

![](https://img-blog.csdnimg.cn/968c3a29e0ec412ba78cb4bc41d04fc3.png)

*   首先原句与卷积核分别为 [2，768]、[3,768]、[4,768] 且 channels 为 2 的 filtet 进行卷积运算得到 6 个一维向量
*   随后将每个一维向量中取出最大值，将这 6 个最大值拼接成 [6，2] 的 Tensor
*   最后进行常规的分类预测
*   注意 nn.ModuleList 的 Pytorch 代码技巧，ModuleList 可以理解为可存储卷积核的 List

```
class TextCNN_Model(nn.Module):
    def __init__(self, base_model, num_classes):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        for param in base_model.parameters():
            param.requires_grad = (True)
 
        # Define the hyperparameters
        self.filter_sizes = [2, 3, 4]
        self.num_filters = 2
        self.encode_layer = 12
 
        # TextCNN
        self.convs = nn.ModuleList(
            [nn.Conv2d(in_channels=1, out_channels=self.num_filters,
                       kernel_size=(K, self.base_model.config.hidden_size)) for K in self.filter_sizes]
        )
        self.block = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(self.num_filters * len(self.filter_sizes), self.num_classes),
            nn.Softmax(dim=1)
        )
 
    def conv_pool(self, tokens, conv):
        tokens = conv(tokens)
        tokens = F.relu(tokens)
        tokens = tokens.squeeze(3)
        tokens = F.max_pool1d(tokens, tokens.size(2))
        out = tokens.squeeze(2)
        return out
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state.unsqueeze(1)
        out = torch.cat([self.conv_pool(tokens, conv) for conv in self.convs],
                        1)
        predicts = self.block(out)
        return predicts
```

### 5.7 FNN

因为我们使用的是 Bert 模型，其模型本身是由 12 层 Transformer 组成，每层 Transformer 又由复杂的 Attention 网络组成，所以 Bert 模型本身就是一个非常好的网络模型，所以可能我不太需要加 RNN、CNN 这些操作，直接使用 FNN 或许也可以实现不错的效果（7.Result 部分的消融实验也证实了该想法）。

在讲解这个代码之前，不得不再次提起 Bert 的输出了，输入一个句子，Bert 的输出是

【CLS】token1 token 2 token3 token4 ... token n 【SEP】

token 表示每个输入单词的向量 ，【CLS】表示整个句子的向量，做 FNN 需要整个句子的输入，因此我们需要获取的是【CLS】。【CLS】是隐层 0 号位的数据，因此具体获取【CLS】的代码是

```
class Transformer(nn.Module):
    def __init__(self, base_model, num_classes, input_size):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        self.input_size = input_size
        self.linear = nn.Linear(base_model.config.hidden_size, num_classes)
        self.dropout = nn.Dropout(0.5)
        self.softmax = nn.Softmax()
        for param in base_model.parameters():
            param.requires_grad = (True)
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        cls_feats = raw_outputs.last_hidden_state[:, 0, :]
        predicts = self.softmax(self.linear(self.dropout(cls_feats)))
        return predicts
```

完整 FNN 网络模块代码如下 

```python
class Transformer_Attention(nn.Module):
    def __init__(self, base_model, num_classes):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        for param in base_model.parameters():
            param.requires_grad = (True)
 
        # Self-Attention
        self.key_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self.query_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self.value_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self._norm_fact = 1 / math.sqrt(self.base_model.config.hidden_size)
 
        self.block = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(768, 128),
            nn.Linear(128, 16),
            nn.Linear(16, num_classes),
            nn.Softmax(dim=1)
        )
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
 
        K = self.key_layer(tokens)
        Q = self.query_layer(tokens)
        V = self.value_layer(tokens)
        attention = nn.Softmax(dim=-1)((torch.bmm(Q, K.permute(0, 2, 1))) * self._norm_fact)
        attention_output = torch.bmm(attention, V)
        attention_output = torch.mean(attention_output, dim=1)
 
        predicts = self.block(attention_output)
        return predicts
```

### 5.8 Self-Attention

RNN 和 CNN 都介绍过了，那 Attention 机制怎么能少呢？

关于 Self-Attention 的细节，可以参考[这篇文章](https://blog.csdn.net/ccaoshangfei/article/details/128044362?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522167913774416800186524363%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fblog.%2522%257D&request_id=167913774416800186524363&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~rank_v31_ecpm-1-128044362-null-null.blog_rank_default&utm_term=Attention&spm=1018.2226.3001.4450 "这篇文章")

在这里，为了方便对着公式阅读代码，我将 Attention 的公式放置如下

![](https://latex.csdn.net/eq?Attention%28Q%2CK%2CV%29%3DSoftmax%28%5Cfrac%20%7BQ.%7BK%7D%5E%7BT%7D%7D%20%7B%5Csqrt%20%7Bd%7D%7D%29.V)

```
class Transformer_CNN_RNN(nn.Module):
    def __init__(self, base_model, num_classes):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        for param in base_model.parameters():
            param.requires_grad = (True)
 
        # Define the hyperparameters
        self.filter_sizes = [3, 4, 5]
        self.num_filters = 100
 
        # TextCNN
        self.convs = nn.ModuleList(
            [nn.Conv2d(in_channels=1, out_channels=self.num_filters,
                       kernel_size=(K, self.base_model.config.hidden_size)) for K in self.filter_sizes]
        )
 
        # LSTM
        self.lstm = nn.LSTM(input_size=self.base_model.config.hidden_size,
                            hidden_size=320,
                            num_layers=1,
                            batch_first=True)
 
        self.block = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(620, 128),
            nn.Linear(128, 16),
            nn.Linear(16, num_classes),
            nn.Softmax(dim=1)
        )
 
    def conv_pool(self, tokens, conv):
        # x -> [batch,1,text_length,768]
        tokens = conv(tokens)  # shape [batch_size, out_channels, x.shape[2] - conv.kernel_size[0] + 1, 1]
        tokens = F.relu(tokens)
        tokens = tokens.squeeze(3)  # shape [batch_size, out_channels, x.shape[2] - conv.kernel_size[0] + 1]
        tokens = F.max_pool1d(tokens, tokens.size(2))  # shape[batch, out_channels, 1]
        out = tokens.squeeze(2)  # shape[batch, out_channels]
        return out
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        cnn_tokens = raw_outputs.last_hidden_state.unsqueeze(1)  # shape [batch_size, 1, max_len, hidden_size]
        cnn_out = torch.cat([self.conv_pool(cnn_tokens, conv) for conv in self.convs],
                            1)  # shape  [batch_size, self.num_filters * len(self.filter_sizes]
        rnn_tokens = raw_outputs.last_hidden_state
        rnn_outputs, _ = self.lstm(rnn_tokens)
        rnn_out = rnn_outputs[:, -1, :]
        # cnn_out --> [batch,300]
        # rnn_out --> [batch,320]
        out = torch.cat((cnn_out, rnn_out), 1)
        predicts = self.block(out)
        return predict
```

### 5.9 TextCNN+LSTM

在这里，我先抛出一个问题，我们为什么要用 CNN 和 LSTM，它究竟有什么好处？

TextCNN 是使用了卷积机制，提取了文本中最关键的信息，也就是最具有区分性的信息，比如 5.5 中的 TextCNN 展示图，一个 7*5 如此大的矩阵，最终竟然只用 6*1 的向量就可表征了

而 LSTM 恰巧相反，它是不断地关注了时间序列中每个隐藏层状态，目的是挖掘出深藏的语义信息

因此，我们可以将 TextCNN 和 LSTM 结合起来，就像你考 CET6 阅读理解一样一样，既要抓取最显著的信息快速判断，又要细读文章内容，理解内含的语义信息，二者结合来便于判断

说了这么多，看看代码到底如何实现

```python
class Transformer_CNN_RNN_Attention(nn.Module):
    def __init__(self, base_model, num_classes):
        super().__init__()
        self.base_model = base_model
        self.num_classes = num_classes
        for param in base_model.parameters():
            param.requires_grad = (True)
 
        # Define the hyperparameters
        self.filter_sizes = [3, 4, 5]
        self.num_filters = 100
 
        # TextCNN
        self.convs = nn.ModuleList(
            [nn.Conv2d(in_channels=1, out_channels=self.num_filters,
                       kernel_size=(K, self.base_model.config.hidden_size)) for K in self.filter_sizes]
        )
 
        # LSTM
        self.lstm = nn.LSTM(input_size=self.base_model.config.hidden_size,
                            hidden_size=320,
                            num_layers=1,
                            batch_first=True)
        # Self-Attention
        self.key_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self.query_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self.value_layer = nn.Linear(self.base_model.config.hidden_size, self.base_model.config.hidden_size)
        self._norm_fact = 1 / math.sqrt(self.base_model.config.hidden_size)
 
        self.block = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(620, 128),
            nn.Linear(128, 16),
            nn.Linear(16, num_classes),
            nn.Softmax(dim=1)
        )
 
    def conv_pool(self, tokens, conv):
        # x -> [batch,1,text_length,768]
        tokens = conv(tokens)  # shape [batch_size, out_channels, x.shape[2] - conv.kernel_size[0] + 1, 1]
        tokens = F.relu(tokens)
        tokens = tokens.squeeze(3)  # shape [batch_size, out_channels, x.shape[2] - conv.kernel_size[0] + 1]
        tokens = F.max_pool1d(tokens, tokens.size(2))  # shape[batch, out_channels, 1]
        out = tokens.squeeze(2)  # shape[batch, out_channels]
        return out
 
    def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
        # Self-Attention
        K = self.key_layer(tokens)
        Q = self.query_layer(tokens)
        V = self.value_layer(tokens)
        attention = nn.Softmax(dim=-1)((torch.bmm(Q, K.permute(0, 2, 1))) * self._norm_fact)
        attention_output = torch.bmm(attention, V)
 
        # TextCNN
        cnn_tokens = attention_output.unsqueeze(1)  # shape [batch_size, 1, max_len, hidden_size]
        cnn_out = torch.cat([self.conv_pool(cnn_tokens, conv) for conv in self.convs],
                            1)  # shape  [batch_size, self.num_filters * len(self.filter_sizes]
 
        rnn_tokens = tokens
        rnn_outputs, _ = self.lstm(rnn_tokens)
        rnn_out = rnn_outputs[:, -1, :]
        # cnn_out --> [batch,300]
        # rnn_out --> [batch,320]
        out = torch.cat((cnn_out, rnn_out), 1)
        predicts = self.block(out)
        return predicts
```

### 5.10 Attention+LSTM+TextCNN

既然我们的网络模型同时加了 LSTM 和 TextCNN，那 Attention 怎么能少呢？

从 IO 角度来看 Self-Attention，它输入是什么尺寸的矩阵，输出也是什么尺寸的矩阵，因此一个简单的做法就是将 Bert 的输出，先放到 Attention 模块中，将 Attention 的输出放到后续的 Lstm 和 TexCNN

代码如下

```
def _train(self, dataloader, criterion, optimizer):
        train_loss, n_correct, n_train = 0, 0, 0
        # Turn on the train mode
        self.Mymodel.train()
        for inputs, targets in tqdm(dataloader, disable=self.args.backend, ascii='>='):
            inputs = {k: v.to(self.args.device) for k, v in inputs.items()}
            targets = targets.to(self.args.device)
            predicts = self.Mymodel(inputs)
            loss = criterion(predicts, targets)
 
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
 
            train_loss += loss.item() * targets.size(0)
            n_correct += (torch.argmax(predicts, dim=1) == targets).sum().item()
            n_train += targets.size(0)
 
        return train_loss / n_train, n_correct / n_train
```

## 六、Train and Test

最后就是编写对应的训练函数和测试函数啦

可能有些小伙伴不懂 tqdm 函数，它的功能就是能显示动态进度，如下图所示

![](https://img-blog.csdnimg.cn/c2d6417c247743869d88352985cd20d9.png)

**训练函数**

注意要开启训练模式，即 self.Mymodel.train()，如此有些层如 dropout 层参数可以进行更新

```
def _test(self, dataloader, criterion):
        test_loss, n_correct, n_test = 0, 0, 0
        # Turn on the eval mode
        self.Mymodel.eval()
 
        with torch.no_grad():
            for inputs, targets in tqdm(dataloader, disable=self.args.backend, ascii=' >='):
                inputs = {k: v.to(self.args.device) for k, v in inputs.items()}
                targets = targets.to(self.args.device)
                predicts = self.Mymodel(inputs)
                loss = criterion(predicts, targets)
 
                test_loss += loss.item() * targets.size(0)
                n_correct += (torch.argmax(predicts, dim=1) == targets).sum().item()
                n_test += targets.size(0)
 
        return test_loss / n_test, n_correct / n_test
```

**测试函数**

注意要开启验证模式，即 self.Mymodel.eval()，如此有些层如 dropout 参数不会更新了

```
# Get the best_loss and the best_acc
best_loss, best_acc = 0, 0
for epoch in range(self.args.num_epoch):
    train_loss, train_acc = self._train(train_dataloader, criterion, optimizer)
    test_loss, test_acc = self._test(test_dataloader, criterion)
    if test_acc > best_acc or (test_acc == best_acc and test_loss < best_loss):
          best_acc, best_loss = test_acc, test_loss
```

 最后在 run 函数中进行多次训练和获取最佳训练准确率

```
def _train(self, dataloader, criterion, optimizer):
        train_loss, n_correct, n_train = 0, 0, 0
 # Confusion matrix
        TP, TN, FP, FN = 0, 0, 0, 0
 # Turn on the train mode
        self.Mymodel.train()
        for inputs, targets in tqdm(dataloader, disable=self.args.backend, ascii='>='):
            inputs = {k: v.to(self.args.device) for k, v in inputs.items()}
            targets = targets.to(self.args.device)
            predicts = self.Mymodel(inputs)
            loss = criterion(predicts, targets)
 
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
 
            train_loss += loss.item() * targets.size(0)
            n_correct += (torch.argmax(predicts, dim=1) == targets).sum().item()
            n_train += targets.size(0)
 
            ground_truth = targets
            predictions = torch.argmax(predicts, dim=1)
            TP += torch.logical_and(predictions.bool(), ground_truth.bool()).sum().item()
            FP += torch.logical_and(predictions.bool(), ~ground_truth.bool()).sum().item()
            FN += torch.logical_and(~predictions.bool(), ground_truth.bool()).sum().item()
            TN += torch.logical_and(~predictions.bool(), ~ground_truth.bool()).sum().item()
 
        precision = TP / (TP + FP)
        recall = TP / (TP + FN)
        specificity = TN / (TN + FP)
        f1_score = 2 * precision * recall / (precision + recall)
 
        return train_loss / n_train, n_correct / n_train, precision, recall, specificity, f1_score
```

## **七、Result**

到了最快乐的炼丹时间，看看最终的效果怎么样

![](https://img-blog.csdnimg.cn/direct/a76831b3054a481e8bd5202498af48ae.png)

分析

*   总体表现看，ALT 效果最好，终究是缝合怪赢了
*   从 PLM 角度看，Roberta 较 Bert 好，不愧为升级版 Bert
*   FNN 效果也不错，这是由于 PLM 本身携带了大量的参数，模型已经足够复杂了
*   纯 TextCNN 的效果有点鸡肋，因为 CNN 主要关注局部而 RNN 关注全局。

## 八、Conclusion

目前该数据集的 SOTA 是使用 XLNet 模型跑的 96.21%，本模型只是用了 10% 的数据集 + 简单的网络架构 + 未调参就可以达到 93% 的准确率，效果还是不错的😁😁😁

![](https://img-blog.csdnimg.cn/2e94c1ecadb843db9b774c7155c4f472.png)

白嫖时，麻烦大佬们动动鼠标给个 star，这对我很重要🥰🥰🥰

## 九、Reference

[1]  Yoon Kim. 2014. [Convolutional Neural Networks for Sentence Classification](https://aclanthology.org/D14-1181 "Convolutional Neural Networks for Sentence Classification"). In _Proceedings of the 2014 Conference on Empirical Methods in Natural Language Processing (EMNLP)_, pages 1746–1751, Doha, Qatar. Association for Computational Linguistics.

[2] Vaswani, A. ,  Shazeer, N. ,  Parmar, N. ,  Uszkoreit, J. ,  Jones, L. , &  Gomez, A. N. , et al. (2017). Attention is all you need. arXiv.

## 十、Another question（2023-11）

汇总一些评论区或私信的一些问题

### Question 1：How to add precision，recall，specificity and f1_scall

在文本分类中一般是只使用 Accuracy 作为评判标准，因此其他的标准就没有放到开源代码中了，若想实现这些功能，在 train()、test() 中进行修改代码即可，在这里我以 train() 函数为例

现放上修改后完整的 train() 代码

```python
def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
        lstm_output, _ = self.Lstm(tokens)
 # Layer Normalization
        norm_lstm = nn.LayerNorm([lstm_output.shape[1], lstm_output.shape[2]], eps=1e-8).cuda()
        ln_lstm = norm_lstm(lstm_output)
        
        outputs = lstm_output[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

targets 就是真实的标签，那预测结果呢，是 predicts 吗？当然不是，因为 predicts 中是预测每条句子的情感类别是 positive 和 negative 分别概率是多少，比如一条句子的预测结果是【0.2,0.8】，那么我们需要将该句的判定结果为 0.8，也就是下标 1，所以 torch.argmax(predicts,dim=1) 才是真正的预测结果。

有了这两个之后，我们便可以计算混淆矩阵，**这里我使用了 logical_and 和 bool() 函数的技巧去实现它，而没有直接用各种库函数，目的是为了展示我是如何处理数据的**，这样如果大家想要有其他评判标准也可以**由此借鉴**。

### Question 2：Why run so slowly

在 config.py，设置的默认环境为 CPU，以及 train_batch_size 和 test_batch_size 都设置较小，目的是先跑通该程序，随后按自己资源配置来扩大 batch_size 以及将 cpu 改成 cuda 

![](https://img-blog.csdnimg.cn/f354e0f9f4e14cf1a0d1b9be18e8d4f2.png)

### Question 3：How to improve the acc on my dataset

可能很多小伙伴在用了自己的数据集后发现准确率可能停在 80%，我估计原因可能是：数据集质量（可进一步数据清理），参数调优问题

此外，也可以考虑融入更多的的模块，比如 Prompt learning、Contrastive learning，CapsuleNet，Dual learning。再或者采用性能更优质的预训练大语言模型，比如 Roberta-Large

也可以尝试最简单的模块，比如 Layer Normalization、Batch Normalization、新的激活函数等等

在这里我展示 Layer Normalization 的技巧模块

以下取自 LSTM 的网络部分，大家需要关注的是**#Layer Normalization 下的两行代码**

```
def forward(self, inputs):
        raw_outputs = self.base_model(**inputs)
        tokens = raw_outputs.last_hidden_state
        lstm_output, _ = self.Lstm(tokens)
 # Layer Normalization
        norm_lstm = nn.LayerNorm([lstm_output.shape[1], lstm_output.shape[2]], eps=1e-8).cuda()
        ln_lstm = norm_lstm(lstm_output)
        
        outputs = lstm_output[:, -1, :]
        outputs = self.fc(outputs)
        return outputs
```

###  Question 4: How to adapt to your own dataset？

想要适配自己数据集，比如一个新闻主题 6 分类，代码如何修改呢？

一个快速做法是首先保证数据集格式与 IMDB 格式一致

1）修改 config.py 文件中 num_classes 为 6

2）修改 data.py 文件中 max_length（文中已解释该变量）

关注本博客，后期推出融合**对偶理论、提示学习、对比学习、扩散模型**模块的文章，希望大家多多关注。（有做这块内容的小伙伴欢迎交流！）

祝大家都能炼丹顺利，早日 accept！！！✌🏻✌🏻✌🏻