SE
[Amplify Shader Editor 1.8.9.012.unitypackage_免费高速下载|百度网盘-分享无限制 (baidu.com)](https://pan.baidu.com/s/1xEPdaZxlO5tgyJV6iJm1qA?pwd=ea6y)
[Amplify Shader Editor手册(中文版)](https://blog.csdn.net/DebuggerPrisonBreak/article/details/85863719?csdn_share_tail=%7B%22type%22%3A%22blog%22%2C%22rType%22%3A%22article%22%2C%22rId%22%3A%2285863719%22%2C%22source%22%3A%22weixin_45532761%22%7D)
#### 导入 ASE 包

![[f3f9315d439f2cf23ca4c577bde76cea_MD5 1.webp]]

或者直接拖拽到 Projects 窗口下的的 Assets 文件中，全部一键导入

![[6e80998d06f18d327b6058d5bb649911_MD5 1.webp]]

#### 基础界面了解

![[1f32446287aa8542cd389ed022b92b67_MD5 1.webp]]

打开 canvas 即可进入基础界面

![[891be26a168e528012352418f20ce08f_MD5 1.webp]]

都是熟悉的单词，看看就好，后面用多就记住了

![[55966892d8a91fe06a2e8529f5a31080_MD5 1.webp]]

看到中间的窗口，最上方

![[d7ac2ee3ae813367ab1517caab28bcfc_MD5 1.webp]]

从左到右依次是

1. 创建并应用 shader 至材质

2. 自动保存

3. 在默认的 shader 编辑器打开 shader 文件

4.5. 分享节点，屏幕拍照

6. 节点屏幕居中

7. 关注主节点

8. 删除未被连接的多余节点

自己想跟着学的话可以直接进大佬的群，里面有资料。
下面是一些常用节点

![[e87c2810ab7515b4f0a558b8267bd081_MD5 1.webp]]
# 自定义函数
creat -> Amplify Shader Function
![[Pasted image 20221003202058.png]]

# 节点
## 常规
**Register Local Var** : 存放输出值（注意命名）
![[Pasted image 20221005165543.png|200]]
**Get Local Var** ：获取register存放的值，左上角选择
![[Pasted image 20221005165637.png|200]]
**Append**：用于附加通道
![[Pasted image 20221007163537.png|200]]
**Component Mask**: 可以设置来屏蔽某个通道
![[Pasted image 20221007165041.png|300]]
**Split**：将数据分解为单个组件
**Polar Coordinates**：极坐标
![[Pasted image 20221007171302.png|300]]
**Switch**： 添加开关
![[Pasted image 20221024170121.png|300]]
![[Pasted image 20221024170137.png]]
设置面板可以设置多种模式
![[Pasted image 20221024170347.png|300]]
**Face：** 如果渲染的图面面向相机，则 Face 节点输出正值 1;如果渲染图面背对相机，则输出负值 **-1**。
代码写法可以进去shader中参考，unity有相应接口
![[Pasted image 20221101171544.png]]
## clip（x）
通常，我们会在片元着色器中使用 clip 函数来进行透明度测试。
参数： 裁剪时使用的标量或矢量条件。
描述： 如果给定参数的任何一个分量是负数，就会舍弃当前像素的输出颜色。

```c
//原型
void clip(x)
{
	if(any(x < 0))
		discard;
}


//ASE中的实现
//x输入一个背景纹理，aplha一般输入噪声纹理，threshold意为阈值
void clip(x，alpha，threshold)
{
	if(any(alpha < threshold))
		discard;
}
```

**ASE中的clip节点**![[Pasted image 20221004001252.png]]![[Pasted image 20221004000228.png|300]]
裁剪条件：Alpha - Threshold < 0
对应透明度测试代码段中的`clip(texColor.a - _Cutoff)`，即对噪声纹理的采样结果和控制消融程度的阈值比较，如果小于阈值，就裁剪掉。
## step(x, y)
```c
void step(float x,float y)
{
	if(x<=y)
		return 1;
	else
		return 0;
}
```
描述：如果x小于等于y，则返回1![[Pasted image 20221004111854.png]]
## subtract(x, y)
对应通道执行减法，x-y
## remap
重映射，如图将(-1,1)范围映射为（0.2，1）![[Pasted image 20221006210852.png|300]]
**Tau**：2PI
power: 几次幂
Negate：对输入值取反
Split：将输入数据分解成xyz组件

**sin cos tan**：![[Pasted image 20221003190129.png]]![[Pasted image 20221003190311.png]]
以sin函数为例，根据函数图像，小于0的值被截为0，所以显示成黑色。白色区域由黑到白再到黑，对应着sin函数值的变化。

---
**Fract**：返回标量或矢量的小数
**Floor**：对输入参数向下取整。
**divide**：除以
![[Pasted image 20221003191651.png]]
uv乘4后，fract图x分量视为0~4，取小数部分，即实现分成四块的0~1
floor函数向下取整，0~1部分取为0，显示为黑色。1~4取为1

---

**step(x,y)**=>if(x<=y)，则输出1，否则输出0
**lerp(x,y,a)** =>插值： x*(1-a) + y*a
**exp(x)**
**length(v)**
**distance(v1,v2)**：两点之间的欧几里德距离![[Pasted image 20221003192605.png]]

---

**discard**：丢弃像素
```c
//在片段着色器中
if(input.uv > 0.5)
	dicard;
```
**saturate**:控制在（0，1）
**clamp（x,y,z）**:x<y,返回y。x>z,返回z
##  光照
### Light Color
Light Color节点输出light color 色信息。RGB通道不包含光色，而是光色和光强度之间相乘的结果。
![[Pasted image 20221017233722.png]]
Light Color节点输出light color 色信息。RGB通道不包含光色，而是光色和光强度之间相乘的结果。
Port	Description	Type
RGBA	返回原始的浅色矢量.	Color
Color	返回光色乘以光强度，该光强度对应于“光色”矢量的RGB通道.	Vector 3
Intensity	返回光强度，它对应于“光色”矢量的Alpha通道.	Float
### Light Attenuation
灯光衰减节点包含Unity的灯光和阴影信息。如果使用定向光，则返回对象被直接照明或处于阴影状态的白色和黑色区域，这些区域会根据定向光设置而相应地更改。对于点光源和点光源，它还包含根据范围设置而变化的光的平滑衰减信息。在任何情况下都不包含光强度或颜色信息，因此通常与包含两者的“ 光色”节点一起使用时，它会变得更加有用。它仅在进行某种自定义照明时很有用，因此，如果**将“ 灯光模型”设置为“ 自定义照明”，则仅在可用节点菜单中可见该节点**，如果该节点恰好在其外部，则显示警告。
![[Pasted image 20221017233909.png]]
注1：为简单起见，当光强度为零时，衰减也为零。
注意2：此节点仅应用于通过“表面输出”节点与“ 自定义照明”输入端口建立的连接。
![[Pasted image 20221017233839.png]]
# 颜色
![[Pasted image 20221024173206.png|300]]

# 双Pass
## 自定义模板
![[TA101_作业_温斯顿的能量盾_8.jpg]]
如上图，打开Unlit的代码
![[Pasted image 20221101162207.png|300]]
在文件管理器中复制一份Unlit.shader并重命名为Unlit2Pass.shader
![[Pasted image 20221101162253.png]]
注意这里也要修改一下：
![[Pasted image 20221101162317.png]]
这样右键Create->Amplify Shader->Templates中就可以使用自定义的模板来创建shader，节点的shader Type也可以选择
![[Pasted image 20221101162630.png]]
这样还没结束，我们需要打开这个模板的代码，将其中的Pass再复制一份，注意设一直不同的pass名字，并根据需求设置Zwrite，Cull等参数
![[Pasted image 20221101163517.png]]
这样保存后ASE重新选择该模板，出现了两个Pass
![[Pasted image 20221101163412.png]]
![[TA101_作业_温斯顿的能量盾_9.jpg]]
# 外部引用
![[Pasted image 20221101193643.png|300]]
# 自定义代码
Custom Expression
![[Pasted image 20221101193752.png]]