
> [!NOTE] Title
> Unity： UV 坐标原点为左下角
> UE：UV 坐标原点为左上角

# 遮罩
## 1 UV 坐标系转换成笛卡尔直角坐标系
```cs
float4 frag(Varyings i) : SV_Target  
{  
    i.uv = (i.uv - 0.5)*2;
    //或
    i.uv = i.uv * 2 - 1;
}
```
![[Pasted image 20221215123919.png]]
![[Pasted image 20221215123942.png]]
## 2 圆形遮罩
**简单方法：**
笛卡尔坐标系求据中心的距离, 用 length 或 distance 函数即可
![[Pasted image 20230804173348.png]]

**方法一：**
![[Pasted image 20221215130852.png]]
不能用 power 节点代替 multiply，因为 power 节点不支持负数运算，小于 0 的数都会被 clamp 到0。

**方法二：**
![[Pasted image 20221215131923.png]]
UE 材质中的 Sine 函数，取值范围是-1~1，周期为 1（不是 2pai）。
![[Pasted image 20221215131719.png|]]

**方形遮罩**使用这两个节点相乘即可：
![[Pasted image 20221215142944.png]]

**方法三：SphereMask**
![[Pasted image 20221215132224.png]]

**RadialGradientExponential（指数径向渐变）**函数
![[Pasted image 20230118202614.jpg]] ![[Pasted image 20230118202557.jpg]]
**UV（矢量 2）（UVs (Vector 2)）**
用于控制渐变所在的位置及其涵盖 0-1 空间的程度。

**中心点（矢量 2）（CenterPosition (Vector2)）**
基于 0-1 的渐变中心位置偏移。

**半径（标量）（Radius (Scalar)）**
源自中心的径向渐变的大小。默认值 0.5 使渐变边缘位于纹理空间边缘附近。

**密度（标量）（Density (Scalar)）**
调整此函数所产生的渐变的硬度。这个数值越大，意味着渐变越清晰。

**反转密度（布尔值）（Invert Density (Boolean)）**
对于渐变，将白色反转为黑色，并将黑色反转为白色。

**DiamondGradient（钻石型渐变）**
![[Pasted image 20230118202708.jpg]] ![[Pasted image 20230118202702.jpg]]
**衰减（标量）（Falloff (Scalar)）**
通过控制渐变从白色变为黑色的速度，提高渐变对比度。
## 3 线性遮罩
![[Pasted image 20221215133043.png]]
![[Pasted image 20221215133053.png]]
![[Pasted image 20221215145815.png]]


# 扫线

![[2023771458.gif|300]]

```c
float flow=saturate(pow(1-abs(frac(i.positionWS.y*0.3-_Time.y*0.2)-0.5),10)*0.3);  
float4 flowcolor=flow*_FlowLightColor;
```



# 法线
##  多面显示
xyz 面分别显示对应图片，此时-x-y-z 面颜色值为-1黑色
![[Pasted image 20221003172541.png|300]] ![[Pasted image 20221003172610.png]]
六面显示 ![[Pasted image 20221003174221.png]]
# 噪音算法
## 白噪音
方法一：floor
![[Pasted image 20221024171946.png]]
方法二：frac
![[Pasted image 20221024172429.png]]

## 动态噪音
使用了两种算法，区别仅在于输出值
#### RandomNoise float1
![[Pasted image 20221024220434.png]]
#### RandomNoise vector2
![[Pasted image 20221024220602.png]]
### 噪音
![[Pasted image 20221024221000.png]]

# 拟合曲线
可以使用一些软件，比如 GeoGebra 可以自己定义几个点，软件来生成对应的函数。