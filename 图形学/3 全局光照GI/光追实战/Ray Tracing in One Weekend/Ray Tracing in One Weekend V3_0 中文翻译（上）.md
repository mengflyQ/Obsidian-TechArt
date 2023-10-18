
## 写在前头:

本文翻译自版本 v3.0.1,

## 1. 概述

当大家提起 "光线追踪", 可能指的是很多不同的东西。我对这个词的描述是, **光线追踪就是一个路径追踪器**, 事实上大部分情况下这个词都是这个意思。

## 2. 输出你的图像

当你开始写渲染器的时候, 你首先要有办法看到你渲染的图像。最直接了当的方法就行把图像信息写入文件。问题是, 有那么多图片格式, 而且许多格式都挺复杂的。在一开始, 我常常使用最简单的 ppm 文件。这里引用 Wikipedia 上面的简明介绍:

![](https://pic2.zhimg.com/v2-d23bb56acdadb81f85b89d8fc74f48e1_r.jpg)

我们来写一下输出这种图片格式的 C++ 代码:

```c
#include <iostream>

int main() {
    const int image_width = 200;
    const int image_height = 100;

    std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";
    //从右往左
    for (int j = image_height-1; j >= 0; --j) 
    {
        //从上到下
        for (int i = 0; i < image_width; ++i) 
        {
            auto r = double(i) / image_width;
            auto g = double(j) / image_height;
            auto b = 0.2;
            
            int ir = static_cast<int>(255.999 * r);
            int ig = static_cast<int>(255.999 * g);
            int ib = static_cast<int>(255.999 * b);
            std::cout << ir << ' ' << ig << ' ' << ib << '\n';
        }
    }
}
```

代码里有一些我们要注意的事情:

1.  对于像素来说, 每一行是从左往右写入的。
2.  行从上开始往下写入的。
3.  通常我们把 RGB 通道的值限定在 0.0 到 1.0。我们之后计算颜色值的时候将使用一个动态的范围, 这个范围并不是 0 到 1。但是在使用这段代码输出图像之前, 我们将把颜色映射到 0 到 1。所以这部分输出图像代码不会改变。【译注: 这里挺重要的, 别忘了。忘掉这个在第一本书并不会出现任何问题, 直到第二本书前大半也没问题, 但是一到 cornell box 与光源的引入, 事情就糟糕了, 不少人都踩进去了, 详见 [issue-94](https://github.com/RayTracing/raytracing.github.io/issues/94)】
4.  下方的红色从左到右由黑边红, 左侧的绿色从上到下由黑到绿。红 + 绿变黄, 所以我们的右上角应该是黄的。

现在我们要把 cout 的输出流写入文件中。幸好我们有命令行操作符 > 来定向输出流。在 windows 操作系统中差不多这样的:

```c
build\Release\inOneWeekend.exe > image.ppm
```

在 Mac 或者 Linux 操作系统中, 大概是这个样子的

```c
build/inOneWeekend > image.ppm
```

打开我们输出的文件 (我是 Mac 系统, 我是用 ToyViewer 打开的, 你可以用你喜欢的任意看图软件来打开。如果你默认的看图软件(比如 windows 下的图片) 不支持 ppm 格式, 只要 Google 一下 "ppm viewer" 装个新的就行。)打开后的结果如下:

![](https://pic3.zhimg.com/v2-fb2906fa70e6a50c6814f52351d1d8d2_b.jpg)

好耶! 这便是图形学中的 "hello world" 了【吐槽：图形学的 hello world 不是三角形嘛】。如果你的图像看上去不是这样的, 用文本编辑器打开你的输出文件, 看看里面内容是啥样的。不出意外的话, 正确格式应该是这样的:

```c
P3
200 100
0 253 51
1 253 51
2 253 51
3 253 51
5 253 51
6 253 51
7 253 51
8 253 51
```

如果不是这样的, 你可能当中多了些空行或者类似的什么东西, 因此你的看图软件识别不出来。  
如果你想生成别的图像格式来代替基础的 PPM, 我强烈安利 [stb_image.h](https://github.com/nothings/stb/blob/master/stb_image.h), 你可以免费在 github 上获取。

## 2.1. 加入进度提示

在我们往下走之前, 我们先来加个输出的进度提示。对于查看一次长时间渲染的进度来说, 这不失为一种简便的做法。也可以通过这个进度来判断程序是否卡住或者进入一个死循环。  
我们的程序将图片信息写入标准输出流 (std::cout), 所以我们不能用这个流输出进度。我们换用错误输出流(std::cerr) 来输出进度:

```c
for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            auto r = double(i) / image_width;
            auto g = double(j) / image_height;
            auto b = 0.2;
            int ir = static_cast<int>(255.999 * r);
            int ig = static_cast<int>(255.999 * g);
            int ib = static_cast<int>(255.999 * b);
            std::cout << ir << ' ' << ig << ' ' << ib << '\n';
        }
    }
std::cerr << "\nDone.\n";
```

## 3. vec3 向量类

几乎所有的图形程序都使用类似的类来储存几何向量和颜色。在许多程序中这些向量是四维的 (对于位置或者几何向量来说是三维的齐次拓展, 对于颜色来说是 RGB 加透明通道)。对我们现在这个程序来说, 三维就足够了。我们用一个 `vec3` 类来储存所有的颜色, 位置, 方向, 位置偏移, 或者别的什么东西。一些人可能不太喜欢这样做, 因为全都用一个类, 没有限制, 写代码的时候难免会犯二, 比如你把颜色和位置加在一起。他们的想法挺好的, 但是我们想在避免明显错误的同时让代码量尽量的精简。所以这里就先一个类吧。【译注: 之后的书中有添加新的 color 类】

下面是我的 `vec3` 的头文件:

```c
#include <iostream>

class vec3 {
    public:
        vec3() : e{0,0,0} {}
        vec3(double e0, double e1, double e2) : e{e0, e1, e2} {}

        double x() const { return e[0]; }
        double y() const { return e[1]; }
        double z() const { return e[2]; }

        vec3 operator-() const { return vec3(-e[0], -e[1], -e[2]); }
        double operator[](int i) const { return e[i]; }
        double& operator[](int i) { return e[i]; }

        vec3& operator+=(const vec3 &v) {
            e[0] += v.e[0];
            e[1] += v.e[1];
            e[2] += v.e[2];
            return *this;
        }

        vec3& operator*=(const double t) {
            e[0] *= t;
            e[1] *= t;
            e[2] *= t;
            return *this;
        }

        vec3& operator/=(const double t) {
            return *this *= 1/t;
        }

        double length() const {
            return sqrt(length_squared());
        }

        double length_squared() const {
            return e[0]*e[0] + e[1]*e[1] + e[2]*e[2];
        }

        void write_color(std::ostream &out) {
            // Write the translated [0,255] value of each color component.
            out << static_cast<int>(255.999 * e[0]) << ' '
                << static_cast<int>(255.999 * e[1]) << ' '
                << static_cast<int>(255.999 * e[2]) << '\n';
        }

    public:
        double e[3];
};
```

我们使用双精度浮点 double, 但是有些光线追踪器使用单精度浮点 float。这里其实都行, 你喜欢哪个就用那个。头文件的第二部分包括一些向量操作工具函数:

```c
inline std::ostream& operator<<(std::ostream &out, const vec3 &v) {
    return out << v.e[0] << ' ' << v.e[1] << ' ' << v.e[2];
}

inline vec3 operator+(const vec3 &u, const vec3 &v) {
    return vec3(u.e[0] + v.e[0], u.e[1] + v.e[1], u.e[2] + v.e[2]);
}

inline vec3 operator-(const vec3 &u, const vec3 &v) {
    return vec3(u.e[0] - v.e[0], u.e[1] - v.e[1], u.e[2] - v.e[2]);
}

inline vec3 operator*(const vec3 &u, const vec3 &v) {
    return vec3(u.e[0] * v.e[0], u.e[1] * v.e[1], u.e[2] * v.e[2]);
}

inline vec3 operator*(double t, const vec3 &v) {
    return vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

inline vec3 operator*(const vec3 &v, double t) {
    return t * v;
}

inline vec3 operator/(vec3 v, double t) {
    return (1/t) * v;
}

inline double dot(const vec3 &u, const vec3 &v) {
    return u.e[0] * v.e[0]
         + u.e[1] * v.e[1]
         + u.e[2] * v.e[2];
}

inline vec3 cross(const vec3 &u, const vec3 &v) {
    return vec3(u.e[1] * v.e[2] - u.e[2] * v.e[1],
                u.e[2] * v.e[0] - u.e[0] * v.e[2],
                u.e[0] * v.e[1] - u.e[1] * v.e[0]);
}

inline vec3 unit_vector(vec3 v) {
    return v / v.length();
}
```

现在我们可以使用 vec3 类将我们的 main 函数改成这样啦:

```
#include "vec3.h"

#include <iostream>

int main() {
    const int image_width = 200;
    const int image_height = 100;

    std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";

    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            vec3 color(double(i)/image_width, double(j)/image_height, 0.2);
            color.write_color(std::cout);
        }
    }

    std::cerr << "\nDone.\n";
}
```

## 4. 光线, 简单摄像机, 以及背景

所有的光线追踪器都有个一个 ray 类, 我们假定光线的公式为 $\mathbf{p}(t) = \mathbf{a} + t \vec{\mathbf{b}}$ 。这里的 $\mathbf{p}$ 是三维射线上的一个点。 $\mathbf{a}$ 是射线的原点, $\vec{\mathbf{b}}$ 是射线的方向。类中的变量 $t$ 是一个实数 (代码中为 double 类型)。 $p(t)$ 接受任意的 $t$ 做为变量, 返回射线上的对应点。如果允许 $t$ 取负值你可以得到整条直线。对于一个正数 $t$ , 你只能得到原点前部分 $\mathbf{a}$ , 这常常被称为半条直线, 或者说射线。

![](https://pic3.zhimg.com/v2-0a13240fad9e360645339165054c4e62_r.jpg)

我在代码中使用复杂命名, 将函数 p(t) 扩写为 ray::at(t)【吐糟: 你之前版本中那个 ray::point_at_parameter(t) 才叫复杂】

```
#ifndef RAY_H
#define RAY_H

#include "vec3.h"

class ray {
    public:
        ray() {}
        ray(const vec3& origin, const vec3& direction)
            : orig(origin), dir(direction)
        {}

        vec3 origin() const { return orig; }
        vec3 direction() const { return dir; }

        vec3 at(double t) const {
            return orig + t*dir;
        }

    public:
        vec3 orig;
        vec3 dir;
};
#endif
```

现在我们再拐回来做我们的光线追踪器。光线追踪器的核心是从像素发射射线, 并计算这些射线得到的颜色。这包括如下的步骤:

1.  将射线从视点转化为像素坐标
2.  计算光线是否与场景中的物体相交
3.  如果有, 计算交点的颜色。在做光线追踪器的初期, 我会先弄个简单摄像机让代码能跑起来。我也会编写一个简单的 color(ray) 函数来返回背景颜色值 (一个简单的渐变色)。

在使用正方形的图像 Debug 时我时常会遇到问题, 因为我老是把 x 和 y 弄反。所以我坚持使用 200x100 这样长宽不等的图像。我会把视点 (或者说摄像机, 如果你认为它是个摄像机的话) 放在(0,0,0)。这里 y 轴向上, x 轴向右, 为了准守使用右手系的规范, 摄像机看向的方向为 z 轴的负方向。我会把发出射线的原点从图像的左下角开始沿着 xy 方向做增量直至遍历全图。注意我这里并没有将射线的向量设置为单位向量, 因为我认为这样代码会更加简单快捷。

![](https://pic4.zhimg.com/v2-d8d14f547542744c59ef7db86e510083_r.jpg)

下面是代码, 射线 r 现在只是近似的从各个像素的中心射出 (现在不必担心精度问题, 因为我们一会儿就会加入抗锯齿):

```
#include "ray.h"

#include <iostream>

vec3 ray_color(const ray& r) {
    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}

int main() {
    const int image_width = 200;
    const int image_height = 100;

    std::cout << "P3\n" << image_width << " " << image_height << "\n255\n";
    vec3 lower_left_corner(-2.0, -1.0, -1.0);
    vec3 horizontal(4.0, 0.0, 0.0);
    vec3 vertical(0.0, 2.0, 0.0);
    vec3 origin(0.0, 0.0, 0.0);
    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            auto u = double(i) / image_width;
            auto v = double(j) / image_height;
            ray r(origin, lower_left_corner + u*horizontal + v*vertical);
            vec3 color = ray_color(r);
            color.write_color(std::cout);
        }
    }

    std::cerr << "\nDone.\n";
}
```

ray_color(ray) 函数根据 y 值将蓝白做了个线性插值的混合, 我们这里把射线做了个单位化, 以保证 y 的取值范围 (-1.0<y<1.0)。因为我们使用 y 轴做渐变, 所以你可以看到这个蓝白渐变也是竖直的。  
我接下来使用了一个标准的小技巧将 y 的范围从 - 1.0 ≤ y ≤ 1.0 映射到了 0 ≤ y ≤ 1.0。这样 t=1.0 时就是蓝色, 而 t=0.0 时就是白色。在蓝白之间我想要一个混合效果 (blend)。现在我们采用的是线性混合(linear blend) 或者说线性插值(liner interpolation)。或者简称其为 lerp。一个 lerp 一般来说会是下面的形式:  
$\text{blendedValue} = (1-t)\cdot\text{startValue} + t\cdot\text{endValue}$  
当 t 从 0 到 1, 我们会渲染出这样的图像:

![](https://pic3.zhimg.com/v2-f16c3bad8439858002670f5ee582789e_b.jpg)

5. 加入球体

让我们为我们的光线追踪器加入一个物体吧! 人们通常使用的球体, 因为计算射线是否与球体相交是十分简洁明了的。回想一下我们中学时期学过的球体表面方程, 对于一个半径为 r 的球体来说, 有方程 $x^2 + y^2 + z^2 = R^2$ , 其中 (x,y,z) 是球面上的点。如果我们想要表示点 (x,y,z) 在球体的内部, 那便有方程 $x^2 + y^2 + z^2 < R^2$ , 类似的, 如果要表示球体外部的点, 则有 $x^2 + y^2 + z^2 > R^2$

如果球体的球心在 $(\mathbf{c}_x, \mathbf{c}_y, \mathbf{c}_z)$ , 那么这个式子就会变得丑陋一些:

$(x-\mathbf{c}_x)^2 + (y-\mathbf{c}_y)^2 + (z-\mathbf{c}_z)^2 = R^2$

在图形学中, 你总希望你方程里面所有东西都是用向量表达的, 这样我们就能用 vec3 这个类来存储所有的这些 xyz 相关的东西了。你也许会意识到, 对于到球面上的点 $\mathbf{P} = (x,y,z)$ 到球心 $\mathbf{c} = (\mathbf{c}_x,\mathbf{c}_y,\mathbf{c}_z)$ 的距离可以使用向量表示为 $(\mathbf{p} - \mathbf{c})$ , 于是就有

$(\mathbf{p} - \mathbf{c}) \cdot (\mathbf{p} - \mathbf{c}) = (x-\mathbf{c}_x)^2 + (y-\mathbf{c}_y)^2 + (z-\mathbf{c}_z)^2$

于是我们就能得到球面方程的向量形式:

 $(\mathbf{p} - \mathbf{c}) \cdot (\mathbf{p} - \mathbf{c}) = R^2$

我们可以将其解读为 "满足方程上述方程的任意一点 p 一定位于球面上"。我们还要知道射线 $p(t) = \mathbf{a} + t\vec{\mathbf{b}}$ 是否与球体相交。如果说它相交了, 那么肯定有一个 t 使直线上的点 p(t) 满足球面方程。所以我们先来计算满足条件的任意 t 值:

$(p(t) - \mathbf{c})\cdot(p(t) - \mathbf{c}) = R^2$

或者将 p(t) 展开为射线方程:

$(\mathbf{a} + t \vec{\mathbf{b}} - \mathbf{c}) \cdot (\mathbf{a} + t \vec{\mathbf{b}} - \mathbf{c}) = R^2$

好啦, 我们需要的代数部分就到这里。现在我们来展开表达式并移项, 得:

$t^2 \vec{\mathbf{b}}\cdot\vec{\mathbf{b}} + 2t \vec{\mathbf{b}} \cdot \vec{(\mathbf{a}-\mathbf{c})} + \vec{(\mathbf{a}-\mathbf{c})} \cdot \vec{(\mathbf{a}-\mathbf{c})} - R^2 = 0$

方程中的向量和半径 R 都是已知的常量, 唯一的未知数就是 t, 并且这个等式是关于 t 的一个一元二次方程, 就像你在高中数学课上【吐槽: ？？？】学到的那样。你可以用求根公式来判别交点个数, 为正则 2 个交点, 为负则无交点, 为 0 则一个交点。在图形学中, 代数与几何往往密切相关, 你看图:

![](https://pic3.zhimg.com/v2-5a3fbd572f05c511bc2cdf7fcd3df55a_r.jpg)

如果我们使用代码来求解, 并使用红色来表示射线击中我们放在 (0,0,-1) 的小球:

```
bool hit_sphere(const vec3& center, double radius, const ray& r) {
    vec3 oc = r.origin() - center;
    auto a = dot(r.direction(), r.direction());
    auto b = 2.0 * dot(oc, r.direction());
    auto c = dot(oc, oc) - radius*radius;
    auto discriminant = b*b - 4*a*c;
    return (discriminant > 0);
}

vec3 ray_color(const ray& r) {
    if (hit_sphere(vec3(0,0,-1), 0.5, r))
        return vec3(1, 0, 0);
    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

我们会得到:

![](https://pic4.zhimg.com/v2-73a372b979105344547ea89345970093_b.jpg)

现在我们啥都缺: 例如光照, 反射, 加入更多的物体, 但是我们离成功又近了一步! 现在你要注意我们其实求的是直线与球相交的解, t<0 的那些情况也计算进去了, 而我们只想要直线中一段射线的解。如果你将你的球心设置在 (0,0,1), 你会得到完全相同的结果。这不是一个特性 (feature)!【吐槽: 直接说 it's a bug 嘛】我们会在接下来的章节修复这个 bug。

## 6. 面法相与复数物体

为了来给球体着色, 首先我们来定义一下面法相。面法相应该是一种垂直于交点所在平面的三维向量。关于面法相我们存在两个设计抉择。首先是是否将其设计为单位向量, 这样对于着色器来说, 所以我会说 "yes!" 但是我并没有在代码里这么做, 这部分差异可能会导致一些潜在的 bug。所以记住, 这个是个人喜好, 大多数的人喜好使用单位法相。对于球体来说, 朝外的法相是直线与球的交点减去球心:

![](https://pic1.zhimg.com/v2-009e0ab00e758c137a5a9a6dbc639a8c_r.jpg)

说到底, 其实就是从球心到交点再向外延伸的那个方向。让我们把这部分转变成代码并开始着色。我们暂时还没有光源这样的东西, 所以让我们直接将法相值作为颜色输出吧。对于法相可视化来说, 我们常常将 xyz 分量的值先映射到 0 到 1 的范围 (假定 $vecN$ 是一个单位向量, 它的取值范围是 - 1 到 1 的), 再把它赋值给 rgb。对于法相来说, 光能判断射线是否与球体相交是不够的, 我们还需求出交点的坐标。在有两个交点的情况下, 我们选取最近的交点 smallest(t)。计算与可视化球的法向量的代码如下:

```
//main.cc 球体表面法相
double hit_sphere(const vec3& center, double radius, const ray& r) {
    vec3 oc = r.origin() - center;
    auto a = dot(r.direction(), r.direction());
    auto b = 2.0 * dot(oc, r.direction());
    auto c = dot(oc, oc) - radius*radius;
    auto discriminant = b*b - 4*a*c;
    if (discriminant < 0) {
        return -1.0;
    } else {
        return (-b - sqrt(discriminant) ) / (2.0*a);
    }
}

vec3 ray_color(const ray& r) {
    auto t = hit_sphere(vec3(0,0,-1), 0.5, r);
    if (t > 0.0) {
        vec3 N = unit_vector(r.at(t) - vec3(0,0,-1));
        return 0.5*vec3(N.x()+1, N.y()+1, N.z()+1);
    }
    vec3 unit_direction = unit_vector(r.direction());
    t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

这会得到下面的结果:

![](https://pic3.zhimg.com/v2-7b6105ac601399ee8171da1c3df9cf56_b.jpg)

我们再来回顾上面的直线方程:

```
//main.cc
vec3 oc = r.origin() - center;
auto a = dot(r.direction(), r.direction());
auto b = 2.0 * dot(oc, r.direction());
auto c = dot(oc, oc) - radius*radius;
auto discriminant = b*b - 4*a*c;
```

首先, 回想一下一个向量与自己的点积就是它的长度的平方 (都是 $x^2+y^2+z^2$ )  
其次, 注意其实我们的 `b` 有一个系数 2, 我们设 b=2h，有:

$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

$= \frac{-2h \pm \sqrt{(2h)^2 - 4ac}}{2a}$

$= \frac{-2h \pm 2\sqrt{h^2 - ac}}{2a}$

$= \frac{-h \pm \sqrt{h^2 - ac}}{a}$

所以射线与球体求交的代码其实可以简化成下面这样:

```
//main.cc
vec3 oc = r.origin() - center;
auto a = r.direction().length_squared();
auto half_b = dot(oc, r.direction());
auto c = oc.length_squared() - radius*radius;
auto discriminant = half_b*half_b - a*c;

if (discriminant < 0) {
    return -1.0;
} else {
    return (-half_b - sqrt(discriminant) ) / a;
}
```

好啦, 那么怎么在场景中渲染不止一个球呢? 很直接的我们想到使用一个 sphere 数组, 这里有个很简洁的好方法: 使用一个抽象类, 任何可能与光线求交的东西实现时都继承这个类, 并且让球以及球列表也都继承这个类。我们该给这个类起个什么样的名字呢? 叫它 object 好像不错但现在我们使用面向对象编程 (oop)。suface 是时常被翻牌, 但是如果我们想要体积体(volumes) 的话就不太适合了。hittable 又过于强调了自己的成员函数 hit。所以我哪个都不喜欢, 但是总得给它个名字的嘛, 那我就叫它 hittable:

hittable 类理应有个接受射线为参数的函数, 许多光线追踪器为了便利, 加入了一个区间 $t_{min}<t<t_{max}$ 来判断相交是否有效。对于一开始的光线来说, 这个 t 值总是正的, 但加入这部分对代码实现的一些细节有着不错的帮助。现在有个设计上的问题: 我们是否在每次计算求交的时候都要去计算法相? 但其实我们只需要计算离射线原点最近的那个交点的法相就行了, 后面的东西会被遮挡。接下来我会给出我的代码, 并将一些计算的结果存在一个结构体里, 来看, 这就是那个抽象类:

```
//hittable.h
#ifndef HITTABLE_H
#define HITTABLE_H

#include "ray.h"

struct hit_record {
    vec3 p;
    vec3 normal;
    double t;
};

class hittable {
    public:
        virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const = 0;
};

#endif
```

这是继承自它的 sphere 球体类:

```
//sphere.h
#ifndef SPHERE_H
#define SPHERE_H

#include "hittable.h"
#include "vec3.h"

class sphere: public hittable {
    public:
        sphere() {}
        sphere(vec3 cen, double r) : center(cen), radius(r) {};

        virtual bool hit(const ray& r, double tmin, double tmax, hit_record& rec) const;

    public:
        vec3 center;
        double radius;
};

bool sphere::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    vec3 oc = r.origin() - center;
    auto a = r.direction().length_squared();
    auto half_b = dot(oc, r.direction());
    auto c = oc.length_squared() - radius*radius;
    auto discriminant = half_b*half_b - a*c;

    if (discriminant > 0) {
        auto root = sqrt(discriminant);
        auto temp = (-half_b - root)/a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
            rec.normal = (rec.p - center) / radius;
            return true;
        }
        temp = (-half_b + root) / a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
            rec.normal = (rec.p - center) / radius;
            return true;
        }
    }
    return false;
}
#endif
```

好了, 让我们来谈谈第二个关于面法相设计上的问题吧， 那就是面法相的朝向问题。对于现在来说, 如果光线从球体外部击中球体, 那么法相也是朝外的, 与射线的方向相反 (不是数学意义上的严格相反, 只是大致逆着)。如果光线从内部射向球面时, 此时的面法相依然朝外, 与射线方向相同。相对的, 我们也可以总是让法相向量与射线方向相反, 即射线从外部射向球面, 法向量朝外, 射线从内部射向球面, 法向量向着球心。

![](https://pic4.zhimg.com/v2-f3be9d1529ba6a7d923f9c4e3533aba3_r.jpg)

在我们着色前, 我们需要仔细考虑一下采用上面哪种方式, 这对于双面材质来说至关重要。例如一张双面打印的 A4 纸, 或者玻璃球这样的同时具有内表面和外表面的物体。  
如果我们决定让法相永远朝外, 那在我们就得在射入的时候判断是从表面的哪一侧射入的, 我们可以简单的将光线与法相做点乘来判断。如果法相与光线方向相同, 那就是从内部击中内表面, 如果相反则是从外部击中外表面。【译注:  $dot(a,b) = cos\theta|a||b|$ 】

```
if (dot(ray_direction, outward_normal) > 0.0) {
    // ray is inside the sphere
    ...
} else {
    // ray is outside the sphere
    ...
}
```

  
如果我们永远让法相与入射方向相反, 我们就不用去用点乘来判断射入面是内侧还是外侧了, 但相对的, 我们需要用一个变量储存射入面的信息:

```
bool front_face;
if (dot(ray_direction, outward_normal) > 0.0) {
    // ray is inside the sphere
    normal = -outward_normal;
    front_face = false;
}
else {
    // ray is outside the sphere
    normal = outward_normal;
    front_face = true;
}
```

其实采取哪种策略, 关键在于你想把这部分放在着色阶段还是几何求交的阶段。【译注: 反正都要算的, v2.0 的时候是在着色阶段判别的, v3.0 把它放在了求交阶段】。在本书中我们我们的材质类型会比我们的几何图元类型多, 所以为了有更少的代码量, 我们会在几何部分先判别射入面是内侧还是外侧。这当然也是一种个人喜好。  
我们在结构体 hit_record 中加入 front_face 变量, 我们接下来还会弄一些动态模糊相关的事情 (Book2 chapter1), 所以我还会加入一个时间变量:

```
//hittable.h 加入时间与面朝向
ifndef HITTABLE_H
#define HITTABLE_H

#include "ray.h"

struct hit_record {
    vec3 p;
    vec3 normal;
    double t;
    bool front_face;

    inline void set_face_normal(const ray& r, const vec3& outward_normal) {
        front_face = dot(r.direction(), outward_normal) < 0;
        normal = front_face ? outward_normal :-outward_normal;
    }
};

class hittable {
    public:
        virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const = 0;
};
#endif
```

接下来我们在求交时加入射入面的判别:

```
//sphere.h 加入射入面判别
bool sphere::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    vec3 oc = r.origin() - center;
    auto a = r.direction().length_squared();
    auto half_b = dot(oc, r.direction());
    auto c = oc.length_squared() - radius*radius;
    auto discriminant = half_b*half_b - a*c;

    if (discriminant > 0) {
        auto root = sqrt(discriminant);
        auto temp = (-half_b - root)/a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
            vec3 outward_normal = (rec.p - center) / radius;
            rec.set_face_normal(r, outward_normal);
            return true;
        }
        temp = (-half_b + root) / a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
            vec3 outward_normal = (rec.p - center) / radius;
            rec.set_face_normal(r, outward_normal);
            return true;
        }
    }
    return false;
}
```

我们加入存放物体的列表

```
//hittable_list.h
#ifndef HITTABLE_LIST_H
#define HITTABLE_LIST_H

#include "hittable.h"
#include <memory>
#include <vector>

using std::shared_ptr;
using std::make_shared;

class hittable_list: public hittable {
    public:
        hittable_list() {}
        hittable_list(shared_ptr<hittable> object) { add(object); }

        void clear() { objects.clear(); }
        void add(shared_ptr<hittable> object) { objects.push_back(object); }

        virtual bool hit(const ray& r, double tmin, double tmax, hit_record& rec) const;

    public:
        std::vector<shared_ptr<hittable>> objects;
};

bool hittable_list::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    hit_record temp_rec;
    bool hit_anything = false;
    auto closest_so_far = t_max;

    for (const auto& object : objects) {
        if (object->hit(r, t_min, closest_so_far, temp_rec)) {
            hit_anything = true;
            closest_so_far = temp_rec.t;
            rec = temp_rec;
        }
    }

    return hit_anything;
}

#endif
```

## 6.1. 一些 C++ 的新特性

hittable_list 类用了两种 C++ 的特性: vector 和 shared_ptr, 如果你并不熟悉 C++, 你可能会感到有些困惑。  
`shared_ptr<type>` 是指向一些已分配内存的类型的指针。每当你将它的值赋值给另一个智能指针时, 物体的引用计数器就会 + 1。当智能指针离开它所在的生存范围 (例如代码块或者函数外), 物体的引用计数器就会 - 1。一旦引用计数器为 0, 即没有任何智能指针指向该物体时, 该物体就会被销毁  
一般来说, 智能指针首先由一个刚刚新分配好内存的物体来初始化:

```
shared_ptr<double> double_ptr = make_shared<double>(0.37);
shared_ptr<vec3>   vec3_ptr   = make_shared<vec3>(1.414214, 2.718281, 1.618034);
shared_ptr<sphere> sphere_ptr = make_shared<sphere>(vec3(0,0,0), 1.0);
```

`make_shared<thing>(thing_constructor_params ...)` 为指定的类型分配一段内存, 使用你指定的构造函数与参数来创建这个类, 并返回一个智能指针 `shared_ptr<thing>  `
使用 C++ 的 auto 类型关键字, 可以自动推断 `make_shared<type>` 返回的智能指针类型, 于是我们可以把上面的代码简化为:

```
auto double_ptr = make_shared<double>(0.37);
auto vec3_ptr   = make_shared<vec3>(1.414214, 2.718281, 1.618034);
auto sphere_ptr = make_shared<sphere>(vec3(0,0,0), 1.0);
```

我们在代码中使用智能指针的目的是为了能让多个几何图元共享一个实例 (举个栗子, 一堆不同球体使用同一个纹理材质), 并且这样内存管理比起普通的指针更加的简单方便。  
std::shared_ptr 在头文件 `<memory>` 中

```
#include<memory>
```

第二个你可能不太熟悉的 C++ 特性是 std::vector。这是一个类似数组的结构类型, 可以存储任意指定的类型。在上面的代码中, 我们将 hittable 类型的智能指针存入 vector 中, 随着 objects.push_back(object) 的调用, object 被存入 vector 的末尾, 同时 vector 的储存空间会自动增加。

std::vector 在头文件` <vector>` 中

```
#include<vector>
```

最后, 位于 hittable_list.h 文件开头部分的 using 语句告诉编译器, shared_ptr 与 make_shared 是来自 std 库的。这样我们在使用它们之前就不用每次都加上前缀 std::。

## 6.2. 常用的常数与工具

我们需要在头文件中定义一些常用的常数。目前为止我们只需要定义无穷。但是我们先把 pi 在这里定义好, 之后要用的。对于 pi 来说并没有什么跨平台的标准定义【译注: 这就是为什么不使用之前版本中 M_PI 宏定义的原因】, 所以我们自己来定义一下。我们在 rtweekend.h 中给出了一些未来常用的常数和函数:

```
//rtweekend.h
#ifndef RTWEEKEND_H
#define RTWEEKEND_H

#include <cmath>
#include <cstdlib>
#include <limits>
#include <memory>

// Usings

using std::shared_ptr;
using std::make_shared;

// Constants

const double infinity = std::numeric_limits<double>::infinity();
const double pi = 3.1415926535897932385;

// Utility Functions

inline double degrees_to_radians(double degrees) {
    return degrees * pi / 180;
}

inline double ffmin(double a, double b) { return a <= b ? a : b; }
inline double ffmax(double a, double b) { return a >= b ? a : b; }

// Common Headers

#include "ray.h"
#include "vec3.h"

#endif
```

以及这是更新后的 main 函数:

```
//main.cc
#include "rtweekend.h"

#include "hittable_list.h"
#include "sphere.h"

#include <iostream>
vec3 ray_color(const ray& r, const hittable& world) {
    hit_record rec;
    if (world.hit(r, 0, infinity, rec)) {
        return 0.5 * (rec.normal + vec3(1,1,1));
    }
    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}

int main() {
    const int image_width = 200;
    const int image_height = 100;

    std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";

    vec3 lower_left_corner(-2.0, -1.0, -1.0);
    vec3 horizontal(4.0, 0.0, 0.0);
    vec3 vertical(0.0, 2.0, 0.0);
    vec3 origin(0.0, 0.0, 0.0);

    hittable_list world;
    world.add(make_shared<sphere>(vec3(0,0,-1), 0.5));
    world.add(make_shared<sphere>(vec3(0,-100.5,-1), 100));

    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            auto u = double(i) / image_width;
            auto v = double(j) / image_height;
            ray r(origin, lower_left_corner + u*horizontal + v*vertical);

            vec3 color = ray_color(r, world);

            color.write_color(std::cout);
        }
    }

    std::cerr << "\nDone.\n";
}
```

这样我们就会得到一张使用法向作为球体颜色值的图片。当你想查看模型的特征细节与瑕疵时, 输出面法向作为颜色值不失为一种很好的方法。

![](https://pic3.zhimg.com/v2-c4e02ebc310fa0ab8102bf334c31a21e_b.jpg)

## 7. 反走样 (抗锯齿)

真实世界中的摄像机拍摄出来的照片是没有像素状的锯齿的。因为边缘像素是由背景和前景混合而成的。我们也可以在程序中简单的对每个边缘像素多次采样取平均达到类似的效果。我们这里不会使用分层采样。尽管我自己常常在我的程序里使用这种有争议的方法。对某些光线追踪器来说分层采样是很关键的部分, 但是对于我们写的这个小光线追踪器并不会有什么很大的提升, 只会让代码更加丑陋。我们会在这里将摄像机类抽象一下, 以便于后续能有一个更酷的摄像机。  
我们还需要一个能够返回真随机数的一个随机数生成器。默认来说这个函数应该返回 0≤r<1 的随机数。注意这个范围取不到 1 是很重要的。有时候我们能从这个特性中获得好处。  
一个简单的实现方法是, 使用 `<cstdlib>` 中的 rand() 函数。这个函数会返回 0 到 RAND_MAX 中的一个任意整数。我们将下面的一小段代码加到 rtweekend.h 中, 就能得到我们想要的随机函数了:

```
//rtweekend.h
#include <cstdlib>
...

inline double random_double() {
    // Returns a random real in [0,1).
    return rand() / (RAND_MAX + 1.0);
}

inline double random_double(double min, double max) {
    // Returns a random real in [min,max).
    return min + (max-min)*random_double();
}
```

传统 C++ 并没有随机数生成器, 但是新版 C++ 中的` <random>` 头实现了这个功能 (某些专家觉得这种方法不太完美)。如果你想使用这种方法, 你可以参照下面的代码:

```
//rtweekend.h
#include <functional>
#include <random>

inline double random_double() {
    static std::uniform_real_distribution<double> distribution(0.0, 1.0);
    static std::mt19937 generator;
    static std::function<double()> rand_generator =
        std::bind(distribution, generator);
    return rand_generator();
}
```

对于给定的像素, 我们发射多条射线进行多次采样。然后我们对颜色结果求一个平均值:

![](https://pic2.zhimg.com/v2-e54c77c97131c90f04a27e5a5de7ec55_r.jpg)

综上, 我们对我们的简单的轴对齐摄像机类进行了一次封装:

```
//camera.h
#ifndef CAMERA_H
#define CAMERA_H

#include "rtweekend.h"

class camera {
    public:
        camera() {
            lower_left_corner = vec3(-2.0, -1.0, -1.0);
            horizontal = vec3(4.0, 0.0, 0.0);
            vertical = vec3(0.0, 2.0, 0.0);
            origin = vec3(0.0, 0.0, 0.0);
        }

        ray get_ray(double u, double v) {
            return ray(origin, lower_left_corner + u*horizontal + v*vertical - origin);
        }

    public:
        vec3 origin;
        vec3 lower_left_corner;
        vec3 horizontal;
        vec3 vertical;
};
#endif
```

为了对多重采样的颜色值进行计算, 我们升级了 vec3::write_color()函数。我们不会在每次发出射线采样时都计算一个 0-1 之间的颜色值, 而是一次性把所有的颜色都加在一起, 然后最后只需要简单的一除 (除以采样点个数)。另外, 我们给头文件 rtweekend.h 加入了一个新函数 clamp(x,min,max), 用来将 x 限制在[min,max] 区间之中:

```
//rtweekend.h
inline double clamp(double x, double min, double max) {
    if (x < min) return min;
    if (x > max) return max;
    return x;
}
```

```
//vec3.h
...
#include "rtweekend.h"
...
void write_color(std::ostream &out, int samples_per_pixel) {
    // Divide the color total by the number of samples.
    auto scale = 1.0 / samples_per_pixel;
    auto r = scale * e[0];
    auto g = scale * e[1];
    auto b = scale * e[2];

    // Write the translated [0,255] value of each color component.
    out << static_cast<int>(256 * clamp(r, 0.0, 0.999)) << ' '
        << static_cast<int>(256 * clamp(g, 0.0, 0.999)) << ' '
        << static_cast<int>(256 * clamp(b, 0.0, 0.999)) << '\n';
}
```

main 函数也发生了变化:

```
//main.cc
int main() {
    const int image_width = 200;
    const int image_height = 100;
    const int samples_per_pixel = 100;

    std::cout << "P3\n" << image_width << " " << image_height << "\n255\n";

    hittable_list world;
    world.add(make_shared<sphere>(vec3(0,0,-1), 0.5));
    world.add(make_shared<sphere>(vec3(0,-100.5,-1), 100));
    camera cam;
    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            vec3 color(0, 0, 0);
            for (int s = 0; s < samples_per_pixel; ++s) {
                auto u = (i + random_double()) / image_width;
                auto v = (j + random_double()) / image_height;
                ray r = cam.get_ray(u, v);
                color += ray_color(r, world);
            }
            color.write_color(std::cout, samples_per_pixel);
        }
    }

    std::cerr << "\nDone.\n";
}
```

停, 放大放大再放大, 看啊, 每一个像素都是背景和前景的混合:

![](https://pic2.zhimg.com/v2-807248338e5835236f2c884fa9ed4105_r.jpg)

因为篇幅限制, 后半部分放在下篇文章，内容有:

[8. Diffuse Material 漫反射材质]  
[9. Metal 金属材质]  
[10. Dielectric 绝缘体材质]  
[11. Positionable Camera 可自定义位置的摄像机]  
[12. Defocus Blur 对焦模糊]  
[13. Where Next? 接下来学什么?]

[undefined](https://zhuanlan.zhihu.com/p/128685960)