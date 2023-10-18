## 项目来源：

# 使用项目

从 github 下下来整个课程的文件，文件结构如上所示。

打开 **visual studio**--> **继续但无需代码** --> **文件** --> **新建** --> **从现有代码创建项目** --> 项目类型选择 **Visual C++**--> 项目文件位置选择**对应课时的文件夹**，项目名称随意，点击下一步 --> 项目类型选择**控制台应用程序**，点击完成。

按上述方法生成第一课时的项目，运行该项目后，整个工程如下所示：

![](1672644085403.png)

首先说明，该项目尽量不使用第三方库，仅有一个 tgaimage 用于构造和读写 tga 文件。

其中 output.tga 就是我们的输出文件。tga 可以当作是一个图形文件格式，需要专门的 tga 查看器。友情提示：WPS 可以打开 tga 文件。

# 第一课 Bresenham 画线算法：

**1. 绘制一条简单的线段**

我们在最开始能用到的唯一功能就是**对一个像素点着色image.set(x,y,color)**。让我们思考怎样在 (x0, y0) 和 (x1, y1) 之间绘制线段？一种简单的想法如下：

```cpp
void line(int x0, int y0, int x1, int y1, TGAImage &image, TGAColor color) {
    for (float t=0.; t<1.; t+=.1) {
        //t为步长，每次增加t*(x1-x0)或者t*(y1-y0)
        int x = x0*(1.-t) + x1*t;
        int y = y0*(1.-t) + y1*t;
        image.set(x, y, color);
    }
}
int main(int argc, char** argv) {
    TGAImage image(100, 100, TGAImage::RGB);
    line(13, 20, 80, 40, image, white);
    image.flip_vertically();
    image.write_tga_file("output.tga");
    return 0;
}
```

用一个变量 t (从 0 开始增加，步长为 0.1) ，将 (x0, y0) 到 (x1, y1) 用 10 个点表示了出来：

![](1672644085459.png)

显然这并不是我们想要的结果 ，我们要的是线段，不是离散的点啊！！。

有的小伙伴会想了：“那我们把 t 的步长降低也许就可以得到一条线段了？”，不错，我们来试试把 t 的步长从 0.1 改为 0.01，开始绘制：

![](1672644085528.png)

嗯！不错，得到了一条线段。但是我们仔细思考一下，这种方式效率高吗？我们现在需要绘制的线段是从 (13,20) 到 (80,40) ，也就是说理论上我们只需要 x 坐标从 13 增加到 80，在对应的 y 坐标上着色，就可以绘制完整个线段，一共需要对 80-13+1=68 个点着色，而不是现在这样，绘制了 100 次。

**2. 换一种思路再来**

小伙伴们突然想起来：“那我们用 x 做循环控制变量，让它从 13 增加到 80 就行了呀！”，没有错！来试试吧：

```cpp
void line(int x0, int y0, int x1, int y1, TGAImage& image, TGAColor color) {
    for (int x = x0; x <= x1; x++) {
        float t = (x - x0) / (float)(x1 - x0);
        int y = y0 * (1. - t) + y1 * t;
        image.set(x, y, color);
    }
}
```

这次 for 循环中，用 x 坐标作循环控制变量，每次循环算出对应的 y 值，遍历完 x0 到 x1 中的点，也就完成了线段的绘制：

![](1672644085569.png)

继续思考现在的画线算法存在什么问题？画线的效率目前来说比较满意了，那么画线一定能正确吗？让我们看看下面这种情况：

```cpp
line(13, 20, 80, 40, image, white); //线段A
line(20, 13, 40, 80, image, red); //线段B
line(80, 40, 13, 20, image, red);//线段C
```

此时程序绘制出的结果：

这次绘制的结果和你预想的一样吗？

![](1672644085626.png)

我们能从这张图看出两个问题：

1.  线段 C 怎么没见？
2.  线段 B（图中红线）怎么断断续续的？

**3. 改正画线算法中的错误**

先思考第一个问题，我们发现线段 C 和线段 A 实际上是重合的，但是线段 C 是后绘制的，应该把线段 A 覆盖掉才对。再看看 line 函数发现问题所在，目前我们写的 line 函数只能处理 x1>=x0 的情况 。进行改正：

```cpp
if (x0 > x1) { //当x0>x1时，调换两个点的坐标
	std::swap(x0, x1);
	std::swap(y0, y1);
}
```

然后考虑第二个问题，线段 B 不是连续的。聪明的小伙伴这时马上想到，我们现在是用的坐标 x 作循环控制，当线段的斜率 k>1 时（Δy>Δx），x 增加 1，y 可能增加 2,3... 导致了线段不连续。发现问题了就要解决问题，一个简单的想法就是，当线段斜率 k>1 了，我们就把它放倒，即斜率变成 1/k。在程序中的实现就是对调一个点的 x 和 y 坐标。

![](1672644085670.png)

不过思考问题一定要全面，我们还需要同时考虑斜率 k<-1 的情况，不过情况类似，不再说明。

```cpp
void line(int x0, int y0, int x1, int y1, TGAImage& image, TGAColor color) {
	bool steep = false; //标记当前斜率的绝对值是否大于1
	if (std::abs(x0 - x1) < std::abs(y0 - y1)) {
		//斜率绝对值>1了，此时将线段端点各自的x,y坐标对调。
		std::swap(x0, y0);
		std::swap(x1, y1);
		steep = true;
	}
	if (x0 > x1) {  //x0>x1时，对线段端点坐标进行对调
		std::swap(x0, x1);
		std::swap(y0, y1);
	}
	for (int x = x0; x <= x1; x++) {
		float t = (x - x0) / (float)(x1 - x0);
		int y = y0 * (1. - t) + y1 * t;
		if (steep) {
			//如果线段是斜率大于1的，那么线段上的点原本坐标应该是(y,x)
			image.set(y, x, color);
		}
		else {
			image.set(x, y, color);
		}
	}
}
```

激动人心的时刻到了：

![](1672644085713.png)

哇哦，nice，和我们预想的效果一样了！(๑•̀ㅂ•́) ✧。到这里，画线算法可以告一段落了，不过还可以对代码进行优化，具体可以参照项目来源地址[第一课 画线](https://link.zhihu.com/?target=https%3A//github.com/ssloy/tinyrenderer/wiki/Lesson-1%3A-Bresenham%25E2%2580%2599s-Line-Drawing-Algorithm)

# 第二课 渲染一个漂亮的模型线框：

这一课的项目中多了 obj 文件夹，我们所用到的模型文件就放在这里。

既然我们知道怎么画线了，那给我们一些点的坐标，把它们连起来，岂不是就有了一幅画！（虽然比较简陋）

看下代码文件，本节课还多了 model.h 和 model.cpp。主要实现了对 obj 文件的读取操作，定义了 model 类。

```cpp
class Model {
private:
	std::vector<Vec3f> verts_;
	std::vector<std::vector<int> > faces_;
public:
	Model(const char *filename);
	~Model();
	int nverts();
	int nfaces();
	Vec3f vert(int i);
	std::vector<int> face(int idx);
};
```

简单看一下 model 类，**里面有两个私有字段 verts_和 faces_，分别保存了 obj 文件中的顶点坐标信息和模型面的顶点信息**。然后还有几个公开的方法，可以返回模型的顶点数，面数，以及对 verts 和 faces 的访问。

现在我们来打开 obj 文件，看看到底存了些啥。

右键 african_head.obj，打开方式选择具有编码功能的源代码（文本）编辑器。

```cpp
v -0.000581696 -0.734665 -0.623267
v 0.000283538 -1 0.286843
v -0.117277 -0.973564 0.306907
...
# 1258 vertices

vt  0.532 0.923 0.000
vt  0.535 0.917 0.000
vt  0.542 0.923 0.000
...
# 1339 texture vertices

vn  0.001 0.482 -0.876
vn  -0.001 0.661 0.751
vn  0.136 0.595 0.792
...
# 1258 vertex normals

g head
s 1
f 24/1/24 25/2/25 26/3/26
f 24/1/24 26/3/26 23/4/23
f 28/5/28 29/6/29 30/7/30
...
# 2492 faces
```

在这节课里，我们只介绍 v 和 f，vt 和 vn 留到之后再来介绍。

obj 文件中的 [v 0.1 0.2 0.3] 表示了一个顶点的世界坐标 (x,y,z)，有多少行就表示有多少个顶点信息。

[f 24/1/24 25/2/25 26/3/26] 表示了模型中的一个三角面，众所周知，一个三角形由三个点构成。所有的 f 都有三组数据，每一组的第一个数据保存的就是顶点的信息，即该面的三个点分别是序号为 24，25 和 26 的这三个点。


好，让我们看看程序代码：

这一节的流程也很清楚：从磁盘上加载 `.obj` 文件 → 按行分析 `.obj` 文件 → 构建 model → 循环 model 中的每个三角形 → 连接三角形的三条边 → 渲染出图

上诉流程的前三步已经被原作者封装好了，我们直接把[源码](https://github.com/skychx/toyRenderer/tree/day02-line-drawing-algorithm/tinyrenderer)里的 `model.h` 和 `model.cpp` 拖到主工程里就可以了，感兴趣的人可以看一下源码实现，非常简单，在一个 `while` 循环里一直 `readline` 就可以了，因为和图形学关系不大，我这里就略过了。

最后的画三角形的代码如下，关键步骤我已经用注释标注了：

```cpp
int main(int argc, char** argv) {
    //命令行控制方式和代码方式构造model
    //构造模型(obj文件路径)
    if (2==argc) {
        model = new Model(argv[1]);
    } else {
        model = new Model("obj/african_head.obj");
    }
    //构造tga(宽，高，指定颜色空间)
    TGAImage image(width, height, TGAImage::RGB);

	//循环每个三角形面
    for (int i=0; i<model->nfaces(); i++) 
    {
        //创建face数组用于保存一个face的三个顶点坐标:face[0]~face[2]
        std::vector<int> face = model->face(i);

        // 循环三角形三个顶点，每两个顶点连一条线
        for (int j=0; j<3; j++) 
        {
            //顶点v0
            Vec3f v0 = model->vert(face[j]);
            //顶点v1
            Vec3f v1 = model->vert(face[(j+1)%3]);

            // 因为模型空间取值范围是 [-1, 1]^3，我们要把模型坐标平移到屏幕坐标中 
           //视口变换：先缩放到屏幕大小，再将原点平移至屏幕左下角
           //分解步骤：x0 = v0.x * width/2 + width/2，以下为简化后的形式
            int x0 = (v0.x+1.)*width/2.;
            int y0 = (v0.y+1.)*height/2.;
            int x1 = (v1.x+1.)*width/2.;
            int y1 = (v1.y+1.)*height/2.;
            //画线
            line(x0,y0, x1,y1, image, white);
        }
    }

    //tga默认原点在左上角，现需要指定为左下角，所以进行竖直翻转
    image.flip_vertically();
    image.write_tga_file("output.tga");
    delete model;
    return 0;
}```

代码主要干了三件事：

1.  读取了模型文件。还记得 model 里的 verts_和 faces_俩兄弟吗？前者存储了模型文件中的顶点坐标，后者存储了模型面包含的顶点信息。
2.  遍历模型的所有面，遍历过程中用一个 face 数组记录下三个顶点的信息。然后去 verts_中查找对应序号（faces_中存储的顶点序号是对应的序号 - 1，方便下标访问）。
3.  一个面有三个点，我们将其两两组合，再调用我们的画线算法，一个线框模型就渲染好了。不过在画线之前，我们需要进行一个视口转换。
[[101#视口变换]]

好，原理都懂了，看看效果吧：

![](1672644085839.png)


# 第三课 绘制三角形 + 平面着色

思考一下，给定一个三角形，我们怎么对其着色呢？想想我们现有的方法 image.set() 和 line()，一个可以对点着色，一个可以用来画线。
最简单的绘制：传入三个顶点，两两画线
![[Pasted image 20230105105913.png]]
```c++
void triangle(Vec2i t0, Vec2i t1, Vec2i t2, TGAImage &image,TGAColor color)
{
    line(t0.x,t0.y,t1.x,t1.y, image, color);
    line(t1.x, t1.y, t2.x, t2.y, image, color);
    line(t2.x, t2.y, t0.x, t0.y, image, color);
}
...
	Vec2i t0 = Vec2i(10,70);
	Vec2i t1 = Vec2i(50, 160);
	Vec2i t2 = Vec2i(70, 80);
	triangle(t0, t1, t2, image, red);
```
## 传统方法：扫线

那一个面是由什么组成的？没错，就是线。聪明的小伙伴反应过来了：我们可以在三角形区域内画很多线，就把三角形填充上了。

好的，既然提出了方法，那就着手实现这个方法！

**三角形绘制**

![](1672644085970.png)

如上图这样一个三角形，我们怎么去用线填充呢？首先我们喜欢的肯定是用水平线或者竖直线去填充这个三角形，因为算法简单。

那我们就假定用横线去填充，也就是说有 n 条线段水平排列在三角形内部：

![](1672644086018.png)

显然，如果填充完，n 的数值应该是三角形的最高点减去最低点 y1-y2。也就是说循环会从 n=y2 开始，执行到 n=y1。线段的 y 坐标确定了，现在来看怎么找 x。

由初中的相似可以知道，n 条线段左边的端点 x,y 满足 $\frac{x-x_2}{x_1-x_2}= \frac{y-y_2}{y_1-y_2}$ 

可是，右边的端点怎么办呢？

聪明的小伙伴又举手了， ‍：可以把三角形分成上下两个区域，这样右边端点的 x 也可以用公式求得了。

不错，让我们看看：

![](1672644086080.png)

因为要对上下分别计算，我们需要先对三角形的三个顶点按照 y 的大小排序，计算出整个三角形的高度差 toytal_height。然后用变量 i 从 0 增长到 total_height，判断当前的高度是在三角形的上半部分还是下半部分，并分别应用各自部分的计算公式得出左右端点的 x。有了左右端点的 x,y，终于可以调用 line() 对像素着色了。

```cpp
//绘制三角形(坐标1，坐标2，坐标3，tga指针，颜色)
void triangle(Vec2i t0, Vec2i t1, Vec2i t2, TGAImage& image, TGAColor color) {
    //三角形面积为0
    if (t0.y == t1.y && t0.y == t2.y) return;
    //根据y的大小对坐标进行排序,t0~t2的y值依次增加
    if (t0.y > t1.y) std::swap(t0, t1);
    if (t0.y > t2.y) std::swap(t0, t2);
    if (t1.y > t2.y) std::swap(t1, t2);
    int total_height = t2.y - t0.y; //高度差

    //以高度差作为循环控制变量，此时不需要考虑斜率，因为着色完后每行都会被填充
    for (int i = 0; i < total_height; i++) 
    {
        //根据t1将三角形分割为上下两部分
        bool second_half = i > t1.y - t0.y || t1.y == t0.y; //上半部分为ture，下半部分为false
        int segment_height = second_half ? t2.y - t1.y : t1.y - t0.y;   //得到上半部分或下半部分的高度

        float alpha = (float)i / total_height;  //当前高度在总高度的占比
        float beta = (float)(i - (second_half ? t1.y - t0.y : 0)) / segment_height; //上半部分高度占比或下半部分高度占比

        //计算A,B两点的坐标
        Vec2i A = t0 + (t2 - t0) * alpha;
        Vec2i B = second_half ? t1 + (t2 - t1) * beta : t0 + (t1 - t0) * beta;

        if (A.x > B.x) std::swap(A, B);
        //根据A,B和当前高度对tga着色
        for (int j = A.x; j <= B.x; j++) {
            image.set(j, t0.y + i, color);
        }
    }
}
```

让我们试试效果

```cpp
int main(int argc, char** argv) {
    TGAImage image(200, 200, TGAImage::RGB);
	Vec2i t0[3] = { Vec2i(10, 70),   Vec2i(50, 160),  Vec2i(70, 80) };
	Vec2i t1[3] = { Vec2i(180, 50),  Vec2i(150, 1),   Vec2i(70, 180) };
	Vec2i t2[3] = { Vec2i(180, 150), Vec2i(120, 160), Vec2i(130, 180) };
triangle(t0[0], t0[1], t0[2], image, red);
triangle(t1[0], t1[1], t1[2], image, green);
triangle(t2[0], t2[1], t2[2], image, blue);
	image.flip_vertically();
	image.write_tga_file("output.tga");
    return 0;
}
```
![[Pasted image 20230105111701.png]]
很好，三角形绘制得很完美！（后续还会介绍一种三角形绘制方法）

## 平面着色
我们已经知道如何用三角形框绘制一个模型，接下来，用随机色来填充它们吧！下面的代码有助于我们看到代码是如何填充三角形的：

```cpp
for(int i=0;i<model->nfaces();i++)
    {
        std::vector<int> face = model->face(i);
	       Vec2i screen_coords[3];  //屏幕坐标
        for(int j =0; j<3;j++)
        {
            Vec3f v = model->vert(face[j]);
            screen_coords[j] = Vec2i((v.x + 1.) * width / 2., (v.y + 1.) * height / 2.);
        }
        
        triangle(screen_coords[0], screen_coords[1], screen_coords[2], image, TGAColor(rand() % 255, rand() % 255, rand() % 255, 255));
    }
```

![[Pasted image 20230105113155.png|300]]
让我们去掉这些滑稽的颜色，加一些灯光上去。

**我们需要光照方向（从点指向光源）和法线方向（三角形两条边叉乘获得）**



模型的制作，会规定好顶点的顺序，使得模型的每一个面的法向量朝向模型外部。法向量示意图：

![](1672644086636.png)

图中圆形表示一个球，黄色箭头表示光照方向。因为我们规定了三角面的点的顺序，使得模型所有面的法向量都朝外，这时我们可以观察到在蓝色虚线左边是面向光的一侧，法向量与光照负方向夹角小于 90°，被照亮；而虚线右边是背光的一侧，法向量与光照负方向夹角大于 90°，处于黑暗中。（也就是**背面裁剪**）


开始码代码：

```cpp
for (int i=0; i<model->nfaces(); i++) {
    std::vector<int> face = model->face(i);
    Vec2i screen_coords[3];
    Vec3f world_coords[3];   //新加入一个数组用于存放三个顶点的世界坐标
    for (int j=0; j<3; j++) {
        Vec3f v = model->vert(face[j]);
        screen_coords[j] = Vec2i((v.x*0.8+1.)*width/2., (v.y*0.8+1.)*height/2.);
        world_coords[j]  = v;//世界坐标    即模型坐标
    }
    //用世界坐标计算法向量
    Vec3f n = (world_coords[2]-world_coords[0])^(world_coords[1]-world_coords[0]);
    n.normalize();
    float intensity = n*light_dir;//光照强度=法向量*光照方向   即法向量和光照方向重合时，亮度最高
    //强度小于0，说明平面朝向为内  即背面裁剪
    if (intensity>0) {
        triangle(screen_coords[0], screen_coords[1], screen_coords[2], image, TGAColor(intensity*255, intensity*255, intensity*255, 255));
    }
}
```


![](1672644086692.png)

虽然我们好像是能够见到一个人形了，，但是怎么总感觉哪里怪怪的。。

啊，，这眼睛，，啊，，这嘴巴。。咋回事啊？

用 vs 打开 obj 文件，给大家揭秘一下：

![](1672644086861.png)

好家伙，原来眼睛和嘴巴里都有一层内腔，，，模型渲染的时候把内腔给渲染上，覆盖掉了本来的嘴巴和眼睛。。。至于为什么会有内腔，我不太了解，但是我想应该是为了整个模型的封闭性吧。

应该想办法让外表面的渲染永远不会被内腔覆盖！

怎么判断哪个表面在里面，哪个表面在外面呢？

# 第四课 zbuffer

渲染的时候，判断平面的距离是否是最小的那一个，是的话就渲染上去。

咋一听上去，好像不错，但是这样子判断整个平面的距离。如果说，两个平面是相交的怎么办？

![](1672644086989.png)

比如这两个相互穿插的三角形，你能说哪个三角形离我们更近吗？

聪明的小伙伴这次想了一会：既然判断**平面**的距离不行，，那我们逐**像素**去判断距离总行了吧！

嗯，虽然会更耗费性能，但是能得到正确的结果！

也就是说，现在我们的三角形绘制函数会在绘制每一个像素的时候，记录下当前像素离我们眼睛的距离，当出现两个像素位置重合时，我们去比较一下两个像素的距离，谁离我们近就渲染谁。

## 其他三角形绘制方法

这次我们用另外一种方式来填充一个三角形，至于为什么换方法了，稍后就知道了。

![](1672644087020.png)

对于上图的三角形，我们找到三角形的最低点和最高点，最左点和最右点，画一个矩形包括住这个三角形，叫做 **Bounding box**（图中灰色矩形）。

然后，遍历 **Bounding box** 中的每一个像素点，判断像素是否在三角形内部，在内部的话，我们就渲染它，否则不管。

这里的关键就在于怎么判断一个点是否在三角形内部，而办法呢，不止一种。

小伙伴们经过一段时间的讨论，想出了各种各样的方法，我们简单列出如下几种办法：

1.  将 A,B,C 都与 P 连线，然后判断与 P 构成的三角形面积之和，是否等于三角形的面积。
2.  将 A,B,C 都与 P 连线，然后判断与 P 构成的三角形在 P 点的三个角之和是否为 360°。

![](1672644087049.png)

**3. 按照顺序算出** $\vec{AB}\times\vec{AP},\vec{BC}\times\vec{BP},\vec{CA}\times\vec{CP}$，若所得三个向量同向，则在三角形内部。


![](1672644087111.png)

若我们规定朝向屏幕里为负，则 $\vec{AB}\times\vec{AP}$方向为负，同理 $\vec{BC}\times\vec{BP}$和 $\vec{CA}\times\vec{CP}$的方向也为负，所以 P 在三角形内部。

因为向量的叉积实际表明了两个向量的位置关系，比如 $\vec{AB}\times\vec{AP}$ 为负，就说明了 $\vec{AP}$在 $\vec{AB}$的右侧，即 P 点在 $\vec{AB}$\右侧。同理，P 也在 $\vec{BC},\vec{CA}$右侧，即在三角形内部。

当 P 出现在三角形外部时，就不满足 P 在三个向量同一侧。

4. 看 $\vec{AP}$ 是否能表示为 $u\vec{AB}+v\vec{AC}$，且 满足 $u>0,v>0,$$u+v<1$

![](1672644087156.png)

图中蓝色 P'和橙色 P''分别代表了$u+v>1$ 和 $v<0$ 的情况，均在三角形外部。

方法有了，那我们选择一种来实现吧

鉴于程序的效率，我们应当采用第三种或者第四种。当然，第四种最后提出来，那肯定选它无误了。hhh，机智（换一种方法绘制三角形的原因马上就告诉你！）。

对于第四种方法，我们可以得出如下等式：

$\begin{cases} u\vec{AB}_x+v\vec{AC}_x +\vec{PA}_x = 0\\ u\vec{AB}_y+v\vec{AC}_y +\vec{PA}_y = 0\\ \end{cases}$

写成矩阵形式也就是：

![[Pasted image 20230105120523.png]]
聪明的小伙伴，马上就想到了，这相当于是 $\begin{bmatrix}u&v&1\end{bmatrix}$与后面两个向量垂直啊！

所以，**后面两个向量的叉积应该等于$k\begin{bmatrix}u&v&1\end{bmatrix}$** 。轻而易举地求出了 u 和 v。

而 $\vec{AP} =u\vec{AB}+v\vec{AC}$等价于 $P = (1-u-v)A +uB+vC$

所以，约束条件就变成了 1-u-v，u，v 都为正。而这种表示方法也就是 P 点对于三角形 ABC 的**重心坐标** (1-u-v, u, v)。开始编码：

```cpp
//计算重心坐标
Vec3f barycentric(Vec3f A, Vec3f B, Vec3f C, Vec3f P) {
    Vec3f s[2];
    //解读：
    //s[0]存储AC，AB，PA的x分量
    //s[1]存储AC，AB，PA的y分量
    //s[2]存储AC，AB，PA的z分量
    for (int i=2; i--; ) {
        s[i][0] = C[i]-A[i];
        s[i][1] = B[i]-A[i];
        s[i][2] = A[i]-P[i];
    }
    //[u,v,1]和[AB,AC,PA]对应的x和y向量都垂直，所以叉乘
    Vec3f u = cross(s[0], s[1]);
    //三点共线时，会导致u[2]为0，此时返回(-1,1,1)
    if (std::abs(u[2])>1e-2)
        //若1-u-v，u，v全为大于0的数，表示点在三角形内部
        return Vec3f(1.f-(u.x+u.y)/u.z, u.y/u.z, u.x/u.z);
    return Vec3f(-1,1,1);
}
```

注意其中的特殊情况就是两个向量的叉积，第三位是 0，此时表示点在三角形的边上，这种情况看作在内部还是外部由小伙伴们自己定义。

**—————————所以呢？重心坐标有什么好处吗？—————————**

有了重心坐标，我们可以对像素点 P 的纹理，光照强度，zbuffer 等等进行插值运算。

不过呢，这一课我们暂时还不会用插值运算来计算颜色，我们还是用第三课学到的**平面着色**。

但是，我们本节课所寻找的，如何**逐像素标记点到我们眼睛的距离**，就有了解决办法！

让我们先定义 zbuffer，因为是逐像素存储距离，所以需要创建一个 width*height 大小的数组，然后初始化给一些很小的值。

```cpp
//创建zbuffer，大小为画布大小
    float *zbuffer = new float[width*height];
//初始化zbuffer，设定一个很小的值
    for (int i=width*height; i--; zbuffer[i] = -std::numeric_limits<float>::max());
```

这里需要说明，因为我们的摄像机（眼睛）的坐标是 (0,0,z)，在 z 轴上，所以当两个点在我们的视角中重合时，实际上只需要比较两个点的 z 值大小就行。

那么，梳理下新的光栅化思路：枚举一个包围盒中所有的像素，找到在三角形内的像素，计算该像素的重心坐标。如果有分量是负数，那这个像素就不再三角形内。

```cpp
// 重心坐标绘制三角形(坐标数组，zbuffer指针，tga指针，颜色)
void triangle(Vec3f *pts, float *zbuffer, TGAImage &image, TGAColor color)
{
    Vec2f bboxmin(std::numeric_limits<float>::max(), std::numeric_limits<float>::max());
    Vec2f bboxmax(-std::numeric_limits<float>::max(), -std::numeric_limits<float>::max());
    Vec2f clamp(image.get_width() - 1, image.get_height() - 1);

    // 确定Bounding box
    // bboxmin[0] bboxmax[0] 存box的x范围
    // bboxmin[1] bboxmax[1] 存box的y范围
    for(int i=0; i<3; i++)
    {
	    for(int j=0; j<2; j++)
	    {
            //这里的[]都是重载运算符，[0]表示x分量，[1]表示y分量
            bboxmin[j] = std::max(0.f, std::min(bboxmin[j], pts[i][j]));
            bboxmax[j] = std::min(clamp[j], std::max(bboxmax[j], pts[i][j]));
	    }
    }
    Vec3f P;

    //遍历边框中的每一个点
    for(P.x=bboxmin.x; P.x<=bboxmax.x; P.x++)
    {
        for (P.y = bboxmin.y; P.y <= bboxmax.y; P.y++)
        {
            // 计算重心
            Vec3f bc_screen = barycentric(pts[0], pts[1], pts[2], P);

            // 重心坐标有一个负值，说明点在三角形外
            if (bc_screen.x < 0 || bc_screen.y < 0 || bc_screen.z < 0) continue;

            // 计算zbuffer
            // 用重心坐标乘三角形三个顶点的 z 值，插值出当前我们要绘制像素的 z 值
            P.z = 0;
            for(int i=0; i<3; i++)
            {
                P.z += pts[i][2] * bc_screen[i];
            }

            // 如果该像素z值大于Zbuffer中存的z值，则更新z值并绘制该像素
            if(zbuffer[int(P.x+P.y*width)]<P.z)
            {
                zbuffer[int(P.x + P.y * width)] = P.z;
                image.set(P.x, P.y, color);
            }
        }
    }
}
```

这里，计算像素 zbuffer 的时候，使用重心坐标对其插值。

让我们 run 一下程序:

![](1672644087201.png)

OHHHHHHHHHHHHHH！！！！！！再次欢呼！！


# 第五课 透视投影
![[Pasted image 20230105165112.jpg]]
图中列出了矩阵中各个数负责的变换功能，还剩p和q不知道干什么用，让我们来研究研究。

我们假设现在不做任何线性变换和平移，仅仅变动p和q的值，看看会发生什么。
![[Pasted image 20230105165127.png]]
可以看出，这个变换和**缩放**有点像，但是缩放得到是一个常系数 k ，而不是 1/2x+1 这样的变量。既然x,y坐标都乘上了 1/2x+1 ，也就是说随着x的增加（假设x>0），点的坐标"缩放"地越厉害！
![[Pasted image 20230105165240.jpg]]
透视不就是这么一种变换吗？随着距离的增加，我们看到的物体就被缩放得越小。

**三维空间**

有了二维空间的理论，到了三维只是对上述内容的扩展，就不再说明。

当然，三维空间中对应的齐次坐标就会被扩展到四维，下面放出几种变换：

**缩放**： $\begin{bmatrix} a & 0 & 0 & 0\\ 0 & b & 0 & 0\\ 0 & 0 & c & 0\\ 0 & 0 & 0 & 1\\ \end{bmatrix} \begin{bmatrix} x\\ y\\ z\\ 1\\ \end{bmatrix} = \begin{bmatrix} ax\\ by\\ cz\\ 1 \end{bmatrix}$

**平移**： $\begin{bmatrix} 1 & 0 & 0 & m\\ 0 & 1 & 0 & n\\ 0 & 0 & 1 & o\\ 0 & 0 & 0 & 1\\ \end{bmatrix} \begin{bmatrix} x\\ y\\ z\\ 1\\ \end{bmatrix} = \begin{bmatrix} x+m\\ y+n\\ z+o\\ 1 \end{bmatrix}$

**绕 y 轴旋转：** $\begin{bmatrix} cosθ & 0 & sinθ & 0\\ 0 & 1 & 0 & 0\\ -sinθ & 0 & cosθ & 0\\ 0 & 0 & 0 & 1\\ \end{bmatrix} \begin{bmatrix} x\\ y\\ z\\ 1\\ \end{bmatrix} = \begin{bmatrix} cosθ\cdot x+sinθ\cdot z\\ y\\ -sinθ\cdot x+cosθ\cdot z\\ 1 \end{bmatrix}$

**透视**： $\begin{bmatrix} 1 & 0 & 0 & 0\\ 0 & 1 & 0 & 0\\ 0 & 0 & 1 & 0\\ 0 & 0 & r & 1\\ \end{bmatrix} \begin{bmatrix} x\\ y\\ z\\ 1\\ \end{bmatrix} = \begin{bmatrix} x\\ y\\ z\\ 1+zr \end{bmatrix} \equiv \begin{bmatrix} \frac{x}{1+zr}\\ \frac{y}{1+zr}\\ \frac{z}{1+zr}\\ 1 \end{bmatrix}$

因为摄像机在 z 轴上，所以物体应该按照 z 轴进行缩放，所以是最后一行的第三列有值。

那么 $r$r 应该取多少呢？我们现在知道 $r$r 应该是取决于摄像机和模型之间的距离的，已知一个点 P=(x, y, z)，我们想把它投影回平面 z=0，摄像机位于 z 轴一点 (0, 0, c)：
![[Pasted image 20230105192903.png]]
三角形 ABC 和 ODC 是相似的，可以得出：|AB|/|AC| = |OD| /|OC|，即 x/(c-z) = x'/c，变换一下顺序：![[Pasted image 20230105192920.png]]
对 CPB 和 CP'D 做同样的操作，很容易得出下边的表达式：![[Pasted image 20230105192927.png]]


对比 $\begin{bmatrix} \frac{x}{1+zr}\\ \frac{y}{1+zr}\\ \frac{z}{1+zr}\\ 1 \end{bmatrix}$，可以得出透视矩阵中的 $r=-\frac{1}{c}$

**透视矩阵**： $\begin{bmatrix} 1 & 0 & 0 & 0\\ 0 & 1 & 0 & 0\\ 0 & 0 & 1 & 0\\ 0 & 0 & -\frac{1}{c} & 1\\ \end{bmatrix}$，**其中我们规定了投影平面在 z=0，且摄像机在 (0,0,c)。**

关于矩阵的分析到这里就差不多了，下面开始编码。

首先，因为多了齐次坐标的转换，矩阵变换，所以更新了原先代码里的 geometry.h 和 geometry.cpp，使我们现在能够进行更多的矩阵和向量运算。

```cpp
//初始化透视矩阵
Matrix Projection = Matrix::identity(4);
//初始化视角矩阵
Matrix ViewPort   = viewport(width/8, height/8, width*3/4, height*3/4);
//投影矩阵[3][2]=-1/c，c为相机z坐标
Projection[3][2] = -1.f/camera.z;
```

这里不仅有**透视矩阵**，还定义了**视角矩阵**。视角矩阵就是把我们之前手动将 (-1,1) 映射到 (0,width) 用一个矩阵操作来代替了，通过缩放和平移来实现。

```cpp
//视角矩阵*投影矩阵*坐标
screen_coords[j] = m2v(ViewPort * Projection * v2m(v));
```

其中 v2m()是用来将向量 (vector) 变成矩阵(matrix)，也就是我们提到的**齐次坐标**。m2v() 和它为互逆操作。

还要注意一点由于矩阵的乘法没有交换律，也就是说 $AB\ne BA$ （通常情况），所以这里的 ViewPort * Projection *v2m(v) 不能调换顺序。

现在代码做的变换顺序是先对向量做了齐次化，然后用一个透视矩阵对其进行变换，最后通过视角矩阵定位到某个像素。

**补充**：坐标的 z 信息可以用来表示深度，经过透视变换后 $z_p$$\frac{z}{1-\frac{z}{c}}=\frac{1}{\frac{1}{z}-\frac{1}{c}}$ 。我们会限制 z 的范围，如设定近平面和远平面，所以 $z_p$ 在 z 的定义域内是单调的，不会影响 zbuffer。

运行代码：

![](1672644118935.png)

这就对了，看上去有立体感了！！b（￣▽￣）d　

等等！！不对劲，我们之前不都是黑白的吗？怎么突然有颜色了？？

**UV 纹理**

还记得笔记上半部分提到的 obj 文件中有 vt 吗，vt 记录的就是纹理的 **UV 坐标**。
```c++
v -0.000581696 -0.734665 -0.623267
v 0.000283538 -1 0.286843
v -0.117277 -0.973564 0.306907
...
# 1258 vertices

vt  0.532 0.923 0.000
vt  0.535 0.917 0.000
vt  0.542 0.923 0.000
...
# 1339 texture vertices

vn  0.001 0.482 -0.876
vn  -0.001 0.661 0.751
vn  0.136 0.595 0.792
...
# 1258 vertex normals

g head
s 1
f 24/1/24 25/2/25 26/3/26
f 24/1/24 26/3/26 23/4/23
f 28/5/28 29/6/29 30/7/30
...
# 2492 faces
```

![](1672644118991.png)

经常玩游戏的小伙伴肯定见过这种贴图，这就是一个人脸的 UV 贴图。我们模型上的每个面的记录形如 f x/y/z x/y/z x/y/z 每一组的 x 记录了顶点的坐标序号，y 保存的就是纹理 UV 坐标，z 是顶点法向量。

所以在绘制三角形的时候，我们把像素对应的 UV 值找到，就可以着上对应的颜色。

但是对于模型的每一个面，**我们只有三个顶点有其对应的 UV 坐标，三角面内部可没有，怎么确定内部的 UV 呢？通过插值获得**

```cpp
Vec3i A   =   t0  + Vec3f(t2-t0  )*alpha;
Vec3i B   = second_half ? t1  + Vec3f(t2-t1  )*beta : t0  + Vec3f(t1-t0  )*beta;
//计算UV
Vec2i uvA =   uv0 +  (uv2-uv0)*alpha;    //第一次插值
Vec2i uvB = second_half ? uv1 +      (uv2-uv1)*beta : uv0 +      (uv1-uv0)*beta;
//保证B在A的右边
if (A.x > B.x) { std::swap(A, B); }// std::swap(uvA, uvB);}
   //用横坐标作为循环控制，对这一行进行着色
   for (int j=A.x; j<=B.x; j++) {
       //计算当前点在AB之间的比例
       float phi = B.x==A.x ? 1. : (float)(j-A.x)/(float)(B.x-A.x);
       //计算出当前点的坐标,A，B保存了z轴信息
       Vec3i   P = Vec3f(A) + Vec3f(B-A)*phi;
       Vec2i uvP =     uvA +   (uvB-uvA)*phi;  //第二次插值
```

按照我们一开始的三角形横线扫描填充绘制，需要用到两次插值计算，代码注释部分。

当然，提到插值，小伙伴有没有想起来上半部分提到的 bounding box 填充三角形，我们计算了点的重心坐标，而重心坐标可是用于插值的一个好东西！

有能力的小伙伴，可以试着用 bounding box 的方法来绘制三角形并进行坐标和 UV 的插值。

# 第六课 移动视角

推导：[[LearnOpenGL#Look At(观察矩阵）]]

```cpp
//朝向矩阵，变换矩阵
//更改摄像机视角=更改物体位置和角度，操作为互逆矩阵
//摄像机变换是先旋转再平移，所以物体需要先平移后旋转，且都是逆矩阵
Matrix lookat(Vec3f eye, Vec3f center, Vec3f up) {
    //计算出z，根据z和up算出x，再算出y
    Vec3f z = (eye - center).normalize();
    Vec3f x = (up ^ z).normalize();
    Vec3f y = (z ^ x).normalize();
    Matrix rotation = Matrix::identity(4);
    Matrix translation = Matrix::identity(4);
    //***矩阵的第四列是用于平移的。因为观察位置从原点变为了center，所以需要将物体平移-center***
    for (int i = 0; i < 3; i++) {
        rotation[i][3] = -center[i];
    }
    //正交矩阵的逆 = 正交矩阵的转置
    //矩阵的第一行即是现在的x
    //矩阵的第二行即是现在的y
    //矩阵的第三行即是现在的z
    //***矩阵的三阶子矩阵是当前视线旋转矩阵的逆矩阵***
    for (int i = 0; i < 3; i++) {
        rotation[0][i] = x[i];
        rotation[1][i] = y[i];
        rotation[2][i] = z[i];
    }
    //这样乘法的效果是先平移物体，再旋转
    Matrix res = rotation*translation;
    return res;
}
```

现在我们设定摄像机位置为 (2,1,3)，center 为 (0,0,0)，然后渲染：

![](1672644119750.png)

好的，摄像机终于不再总是在人脸正方向了。

不对，不对，不对。

细心的小伙伴又看出了问题，为什么这次渲染的模型，不再有棱角了？？表面看上去很光滑。

不错，不错，能看出来问题。原因在于本节课的代码加入了对光照强度的插值，也就是**高洛德着色**方式了。

```cpp
//计算A,B两点的光照强度
float ityA =               ity0 +   (ity2-ity0)*alpha;
float ityB = second_half ? ity1 +   (ity2-ity1)*beta : ity0 +   (ity1-ity0)*beta;
```

同样，经过了两次线性插值。

```cpp
//计算当前需要绘制点P的坐标，光照强度
Vec3i    P = Vec3f(A) +  Vec3f(B-A)*phi;
float ityP =    ityA  + (ityB-ityA)*phi;
ityP = std::min(1.f, std::abs(ityP)+0.01f);
```

这样一个平面就不再是一个光照强度了，而是根据三个顶点的光照强度进行插值，于是消除了边界上的跳变。

**完整代码：**
```c++
#include <vector>
#include <iostream>
#include <cmath>
#include <limits>
#include "tgaimage.h"
#include "model.h"
#include "geometry.h"
#include <algorithm>

const int width = 800;
const int height = 800;
const int depth = 255;

Model *model = NULL;
int* zbuffer = NULL;

//定义光照位置
Vec3f LightDir = Vec3f(0, -1, -1).normalize();
//摄像机位置
Vec3f ViewDir(2,1,3);
//焦点位置
Vec3f center(0, 0, 0);
// 定义一个up向量用于计算摄像机的x向量
Vec3f up(0, 1, 0);

//朝向矩阵，变换矩阵
//更改摄像机视角=更改物体位置和角度，操作为互逆矩阵
//摄像机变换是先旋转再平移，所以物体需要先平移后旋转，且都是逆矩阵
Matrix lookat(Vec3f ViewDir, Vec3f center,Vec3f up)
{
    //计算出z，根据z和up算出x，再算出y
    Vec3f z = (ViewDir - center).normalize();
    Vec3f x = (up ^ z).normalize();
    Vec3f y = (z ^ x).normalize();

    Matrix rotation = Matrix::identity(4);
    Matrix translation = Matrix::identity(4);

	//矩阵的第四列是用于平移的。因为观察位置从原点变为了center，所以需要将物体平移-center
    for(int i = 0;i<3;i++)
    {
        translation[i][3] = -center[i];
    }

    for(int i = 0; i < 3;i++)
    {
        rotation[0][i] = x[i];
        rotation[1][i] = y[i];
        rotation[2][i] = z[i];
    }

    Matrix LookAt = rotation * translation;
    return LookAt;
}

//视角矩阵
//将物体x，y坐标(-1,1)转换到屏幕坐标(100,700)    1/8width~7/8width
//zbuffer(-1,1)转换到0~255
Matrix viewport(int x, int y, int w, int h)
{
    Matrix m = Matrix::identity(4);
    //第4列表示平移信息
    m[0][3] = x + w / 2.f;
    m[1][3] = y + h / 2.f;
    m[2][3] = depth / 2.f;

	//对角线表示缩放信息
    m[0][0] = w / 2.f;
    m[1][1] = h / 2.f;
    m[2][2] = depth / 2.f;
    return m;
}

//绘制三角形(坐标1，坐标2，坐标3，顶点光照强度1，顶点光照强度2，顶点光照强度3，tga指针，zbuffer)
void triangle(Vec3i t0, Vec3i t1, Vec3i t2, float ity0, float ity1, float ity2, Vec2i uv0, Vec2i uv1, Vec2i uv2, float dis0, float dis1, float dis2, TGAImage& image, int* zbuffer) {
    //三角形面积为0
    if (t0.y == t1.y && t0.y == t2.y) return;
    //根据y的大小对坐标进行排序,t0~t2的y值依次增加
    if (t0.y > t1.y)
    {
        std::swap(t0, t1);
        std::swap(uv0, uv1);
        std::swap(ity0, ity1);
    }
    if (t0.y > t2.y)
    {
        std::swap(t0, t2);
        std::swap(uv0, uv2);
        std::swap(ity0, ity2);
    }
	if (t1.y > t2.y) 
    {
        std::swap(t1, t2);
        std::swap(uv1, uv2);
        std::swap(ity1, ity2);
    }

	int total_height = t2.y - t0.y; //高度差

    //以高度差作为循环控制变量，此时不需要考虑斜率，因为着色完后每行都会被填充
    for (int i = 0; i < total_height; i++) 
    {
        //根据t1将三角形分割为上下两部分
        bool second_half = i > t1.y - t0.y || t1.y == t0.y; //上半部分为ture，下半部分为false
        int segment_height = second_half ? t2.y - t1.y : t1.y - t0.y;   //得到上半部分或下半部分的高度

        float alpha = (float)i / total_height;  //当前高度在总高度的占比
        float beta = (float)(i - (second_half ? t1.y - t0.y : 0)) / segment_height; //上半部分高度占比或下半部分高度占比

        // 插值计算A、B坐标
        // A表示t0与t2之间的点
        // B表示t0与t1之间的点
        Vec3i A = t0 + Vec3f(t2 - t0) * alpha;
        Vec3i B = second_half ? t1 + Vec3f(t2 - t1) * beta : t0 + Vec3f(t1 - t0) * beta;

        // 插值计算UV
        Vec2i uvA = uv0 + (uv2 - uv0) * alpha;
        Vec2i uvB = second_half ? uv1 + (uv2 - uv1) * beta : uv0 + (uv1 - uv0) * beta;

        // 插值计算A、B的光照强度
        float ityA = ity0 + (ity2 - ity0) * alpha;
        float ityB = second_half ? ity1 + (ity2 - ity1) * beta : ity0 + (ity1 - ity0) * beta;

        //插值计算距离（用于光照衰减）
        float disA = dis0 + (dis2 - dis0) * alpha;
        float disB = second_half ? dis1 + (dis2 - dis1) * beta : dis0 + (dis1 - dis0) * beta;

    	// 保证B在A的右边
        if (A.x > B.x)
        {
            std::swap(A, B);
            std::swap(ityA, ityB);
        }

        //用横坐标作为循环控制，对这一行进行着色
        for (int j = A.x; j <= B.x; j++) 
        {
            //计算当前点在AB之间的比例
            float phi = B.x == A.x ? 1. : (float)(j - A.x) / (float)(B.x - A.x);

            //再次插值计算
            Vec3i P = Vec3f(A) + Vec3f(B - A) * phi;
            Vec2i uvP = uvA + (uvB - uvA) * phi;
            float ityP = ityA + (ityB - ityA) * phi;
            ityP = std::min(1.f, std::abs(ityP) + 0.01f);
            float disP = disA + (disB - disA) * phi;

            // 计算当前zbuffer下标=P.x+P.y*width
            int idx = P.x + P.y * width;
            //边界限制
            if (P.x >= width || P.y >= height || P.x < 0 || P.y < 0) continue;
            if(P.x < width && P.y < height)
            {
                // 当前点的z大于zbuffer信息，覆盖掉，并更新zbuffer
                if (zbuffer[idx] < P.z) 
                {
                    zbuffer[idx] = P.z;
                    TGAColor color = model->diffuse(uvP);
                    image.set(P.x, P.y, TGAColor(color.bgra[2], color.bgra[1], color.bgra[0]) * ityP * (20.f / std::pow(disP, 2.f)));
                    //image.set(P.x, P.y, TGAColor(255,255,255)* ityP);
                }
            }
        }
    }
}


int main(int argc, char** argv)
{
    //获取模型文件
    if (2 == argc) {
     model = new Model(argv[1]);
    } else {
     model = new Model("obj/african_head.obj");
    }

    // 创建zbuffer，大小为画布大小
    zbuffer = new int[width * height];
    // 初始化zbuffer，设定一个很小的值
    for (int i = 0; i < width * height; i++) {
        //初始化zbuffer
        zbuffer[i] = std::numeric_limits<int>::min();
    }

    //绘制
    {
        // M：模型空间->世界空间:不需要变化，这里模型空间=世界空间,为了便于理解设定为单位矩阵
        Matrix M_Model = Matrix::identity(4);
        // V：世界空间->观察空间
        Matrix M_View = lookat(ViewDir, center, up);
        // P:观察空间->裁剪空间
        Matrix M_Projection = Matrix::identity(4);
    	// 投影矩阵[3][2]=-1/c，c为相机z坐标
    	M_Projection[3][2] = -1.f / ViewDir.z;

    // 视口变换: 裁剪空间->屏幕空间(未完成)
		// 注意此时xyzw分量还没有执行透视除法(除以w分量)，所以此时还没有转换到屏幕空间
		// 对裁剪坐标执行透视除法后就能变换到标准化设备坐标（NDC），此时才是转换到了屏幕空间。
        Matrix ViewPort = viewport(width / 8, height / 8, width * 3 / 4, height * 3 / 4);

        TGAImage image(width, height, TGAImage::RGB);
        //以模型面为循环控制变量
        for (int i = 0; i < model->nfaces(); i++)
        {
            std::vector<int> face = model->face(i);
            Vec3f screen_coords[3];
            float intensity[3];
            float distance[3];

            for (int j = 0; j < 3; j++)
            {
                Vec3f v = model->vert(face[j]);
                
                // 【变换】！
                screen_coords[j] = Vec3f(ViewPort * M_Projection * M_View * M_Model * Matrix(v));
                intensity[j] = model->norm(i, j) * LightDir;

                Matrix model2View = M_View * M_Model * Matrix(v);
                Vec3f new_v = Vec3f(model2View);  //观察空间中模型的位置
                distance[j] = std::pow((std::pow(new_v.x - ViewDir.x, 2.0f) + std::pow(new_v.y - ViewDir.y, 2.0f) + std::pow(new_v.z - ViewDir.z, 2.0f)), 0.5f);
            }

            Vec2i uv[3];
            for(int k=0; k<3; k++)
            {
                uv[k] = model->uv(i, k);
            }
            triangle(screen_coords[0], screen_coords[1], screen_coords[2], intensity[0], intensity[1], intensity[2], uv[0], uv[1], uv[2], distance[0], distance[1], distance[2], image, zbuffer);
        }
        // tga默认原点在左上角，现需要指定为左下角，所以进行竖直翻转
        image.flip_vertically();
        image.write_tga_file("output.tga");
    }

    // 输出zbuffer
    {
        TGAImage zbimage(width, height, TGAImage::GRAYSCALE);
        for (int i = 0; i < width; i++) {
            for (int j = 0; j < height; j++) {
                zbimage.set(i, j, TGAColor(zbuffer[i + j * width]));
            }
        }
        zbimage.flip_vertically();
        zbimage.write_tga_file("zbuffer.tga");
    }
    
	delete model;
    delete[] zbuffer;
	return 0;
}


```
# 第七课 shader（着色器）

由于 main.cpp 现在实在过于臃肿，我们把对顶点的变换，像素的着色等统一放到 our_gl.cpp 中。我们主要把整个渲染过程分成了顶点变换和着色两个部分，也就是我们常常听到的**顶点着色器**和**片元着色器**。

```cpp
//高洛德着色器
struct GouraudShader : public IShader {
    //顶点着色器会将数据写入varying_intensity
    //片元着色器从varying_intensity中读取数据
    Vec3f varying_intensity; 
    mat<2, 3, float> varying_uv;
    //接受两个变量，(面序号，顶点序号)
    virtual Vec4f vertex(int iface, int nthvert) {
        //根据面序号和顶点序号读取模型对应顶点，并扩展为4维 
        Vec4f gl_Vertex = embed<4>(model->vert(iface, nthvert));
        varying_uv.set_col(nthvert, model->uv(iface, nthvert));
        //变换顶点坐标到屏幕坐标（视角矩阵*投影矩阵*变换矩阵*v）
        mat<4, 4, float> uniform_M = Projection * ModelView;
        mat<4, 4, float> uniform_MIT = (Projection * ModelView).invert_transpose();
        gl_Vertex = Viewport* uniform_M *gl_Vertex;
        //计算光照强度（顶点法向量*光照方向）
        Vec3f normal = proj<3>(embed<4>(model->normal(iface, nthvert))).normalize();
        varying_intensity[nthvert] = std::max(0.f, model->normal(iface, nthvert) *light_dir); // get diffuse lighting intensity
        return gl_Vertex;
    }
    //根据传入的重心坐标，颜色，以及varying_intensity计算出当前像素的颜色
    virtual bool fragment(Vec3f bar, TGAColor &color) {
        Vec2f uv = varying_uv * bar;
        TGAColor c = model->diffuse(uv);
        float intensity = varying_intensity*bar;
        color = c*intensity; 
        return false;                              
    }
};
```

现在把上一节中的几个变换矩阵，还有像素着色的部分提取出来，成了这里的两个方法

virtual Vec4f vertex(int iface,int nthvert)

virtual bool fragment(Vec3f bar, TGAColor &color)

vertex() 主要负责顶点的坐标变换，fragment() 负责计算颜色。

分下下面代码：

```cpp
//实例化高洛德着色
GouraudShader shader;
for (int i=0; i<model->nfaces(); i++) {
    Vec4f screen_coords[3];
    for (int j=0; j<3; j++) {
        //通过顶点着色器读取模型顶点
        //变换顶点坐标到屏幕坐标（视角矩阵*投影矩阵*变换矩阵*v） ***其实并不是真正的屏幕坐标，因为没有除以最后一个分量
        //计算光照强度
        screen_coords[j] = shader.vertex(i, j);
    }
    //遍历完3个顶点，一个三角形光栅化完成
    //绘制三角形，triangle内部通过片元着色器对三角形着色
    triangle(screen_coords, shader, image, zbuffer);
}
```

首先实例化了我们刚写好的 shader，然后再循环读取模型的每个面的时候，我们调用了 vertex()，在顶点着色器中完成了顶点的坐标变换，记录每个顶点的 uv 坐标，并且计算出了三个顶点的光照强度。

然后我们开始绘制三角形，调用 triangle()，下面是 triangle 核心部分：

```cpp
for (P.x=bboxmin.x; P.x<=bboxmax.x; P.x++) {
        for (P.y=bboxmin.y; P.y<=bboxmax.y; P.y++) {
            //计算重心坐标
            Vec3f c = barycentric(proj<2>(pts[0]/pts[0][3]), proj<2>(pts[1]/pts[1][3]), proj<2>(pts[2]/pts[2][3]), proj<2>(P));
 float z_P = (pts[0][2]/ pts[0][3])*c.x + (pts[0][2] / pts[1][3]) *c.y + (pts[0][2] / pts[2][3]) *c.z;
 int frag_depth = std::max(0, std::min(255, int(z_P+.5)));
 if (c.x<0 || c.y<0 || c.z<0 || zbuffer.get(P.x, P.y)[0]>frag_depth) continue;
 //调用片元着色器计算当前像素颜色
 bool discard = shader.fragment(c, color);
 if (!discard) {
 //zbuffer
 zbuffer.set(P.x, P.y, TGAColor(frag_depth));
 //为像素设置颜色
 image.set(P.x, P.y, color);
 }
 }
 }
```

这里先不管其他的细节，代码大体上实现就是先计算了重心坐标，然后计算了 zbuffer，然后调用了 fragment() 计算颜色。

这里传入的参数是 c 重心坐标，用于插值计算颜色，color 为返回的颜色。

片元着色器收到重心坐标后，会把 vertex 中记录的三个顶点的 uv 坐标根据重心坐标做一个插值运算，得到一个新的 uv 坐标，并取得 uv 贴图上对应坐标的颜色。

最后为像素着色。

好了，到这里，如何把之前的各种变换和插值给抽取出来写成 shader，我们就都清楚了。

但是由于这一课给的顶点变换部分的源代码有点奇怪（其实是为了透视插值矫正，这个问题有点麻烦，这里不展开，可参考[图形学 - 关于透视矫正插值那些事](https://zhuanlan.zhihu.com/p/403259571)），所以我在自己的代码中添加了一些注释帮助小伙伴们理解。

就比如 vertex() 中返回的仍然是一个齐次坐标，即是一个 Vec4f 的变量，这时候的 x,y 还需要除以最后一个分量，才是实际上在屏幕上像素的坐标。

```cpp
virtual Vec4f vertex(int iface, int nthvert){
    Vec4f gl_Vertex = embed<4>(model->vert(iface, nthvert));
    ...
    gl_Vertex = Viewport* uniform_M *gl_Vertex;
    ...
    return gl_Vertex;
}
```

所以在绘制三角形，判断边界以及计算重心的时候，都除以了最后一个分量。

```cpp
//这里pts除以了最后一个分量，实现了透视中的缩放，所以作为边界框
bboxmin[j] = std::min(bboxmin[j], pts[i][j]/pts[i][3]);
 bboxmax[j] = std::max(bboxmax[j], pts[i][j]/pts[i][3]);

//c为当前P对应的重心坐标
//这里pts除以了最后一个分量，实现了透视中的缩放，所以用于判断P是否在三角形内
Vec3f c = barycentric(proj<2>(pts[0]/pts[0][3]), proj<2>(pts[1]/pts[1][3]), proj<2>(pts[2]/pts[2][3]), proj<2>(P));
```

这里，原作者还给出了几个 shader 的实现的方案，我都放到代码里了，小伙伴们可以切换不同的 shader 渲染看看区别。

![](1672644119829.png)

小伙伴们一路走下来，弄清楚每行代码干了什么，那么对于整个图形的光栅化过程就算是基本了解了。

**————补充————**

关于阴影的实现：由于原项目所在 github 的图片加载不出来，所以没有继续实现了，不过下面给出了实现思路。

目前我们的渲染器实现的明暗变化仅仅体现在表面的凹凸上，导致有些地方应该被遮挡形成阴影的地方并没有变得黑暗。比如这张图里，光线方向如黄色箭头所示，应该会导致红色部分产生阴影才对，而图中的明暗全部来自纹理和表面与光线角度的关系。

![](1672644119887.png)

实现方法：可以在光线视角生成一个 zuffer，这样我们就知道了那些地方会被遮挡，可以给这部分的像素减去一定量的值，使其变得更加黑暗。

感兴趣的小伙伴可以去[原项目地址](https://link.zhihu.com/?target=https%3A//github.com/ssloy/tinyrenderer/wiki/Lesson-0%3A-getting-started)查看，或者自己动手实现一下。

下一步提高，可以观看闫令琪大神的视频进行学习，可以得到更深入的理解。

[GAMES101 - 现代计算机图形学入门 - 闫令琪_哔哩哔哩_bilibili](https://link.zhihu.com/?target=https%3A//www.bilibili.com/video/BV1X7411F744)

完结撒花。