## 写在前头:

本书为 PeterShirley 的 Ray tracing 入门教学系列的第二本。当前版本 v3.0。本书在第一本的基础上加入了一些新的特性, 如贴图, 光源, 烟雾等, 其中最主要的部分是使用 BVH 加速与程序生成的柏林噪声贴图, 占了整本书篇幅的一半。和之前一样, 如果你遇到什么问题, 欢迎在评论区留言。如果是翻译上的问题, 请[查看原文自救](https://raytracing.github.io/books/RayTracingTheNextWeek.html)。另外本书的柏林噪声部分写的其实挺糟糕的，建议配合其他资料学习。

目录:  
[1. Overview 概述]  
[2. Motion Blur 动态模糊]  
[3. Bounding Volume Hierarchies 层次包围盒]  
[4. Solid Texture 固体贴图]  
[5. Perlin Noise 柏林噪声]  
[6. Image Texture Mapping 图像纹理映射]  
[7. Rectangles and Lights 矩形和光源]  
[8. instance 实例]  
[9. volumes 体积体]  
[10. A Scene Testing All New Features 一个测试所有新特性的场景]  
[译者后记]

## 1. 概述

在 [Ray Tracing In One Weekend](https://raytracing.github.io/books) 中, 你实现了一个暴力的光线路径追踪器。在本部分中, 我们将加入纹理, 体积体 (例如烟雾), 矩形, 实例, 光源, 并用 BVH 来包裹我们的物体。当你完成这些后, 你将拥有一个“真正的” 光线追踪器。  
在光线追踪方面, 具有启发性的一点是, 许多人 (包括作者本人) 相信大多数用来优化的代码只会让程序更复杂, 而并不会提升太多的运行速度。我在这本迷你书中将采取最简单直接的方式来实现代码。如果你想看复杂的优化版本, 请点击[这里](https://in1weekend.blogspot.com/)。并且我在这里建议读者不要自己过早的去优化。如果说程序在执行时间上来看并没有太大的变化, 那么它就并不需要你去优化。直到最后所有的功能都被实现前, 你可以一直就这样往里面添加代码。  
本书中最难的两部分是 BVH 和柏林噪声贴图。所以我将标题取名为 “一周” 而不是像上一本一样的“一个周末”。如果你想一个周末搞定这本书, 那么你可以把这两个部分留到最后。这本书中提到的概念, 各章节的顺序并不是很重要, 没有 BVH 和柏林噪声贴图你仍然能渲染出属于自己漂亮的 Cornell Box!

![](https://pic3.zhimg.com/v2-c25e15927f1db7d76454545171bae936_b.jpg)

## 1.1 致谢

感谢 Becker 对草稿的许多建设性意见。感谢 Matthew Heimlich 指出一个严重的动态模糊的错误。感谢 Andrew Kensler, Thiago Ize, and Ingo Wald 对 ray-AABB 测试的建议。 感谢 David Hart and Grue Debry 对细节补完上的帮助。 感谢 Jean Buckley 的编辑, 感谢 Dan Drummond 修复代码 bug, 感谢 Steve Hollasch and Trevor David Black 将本书翻译为 Markdeep 并挪到该[网页](https://raytracing.github.io/books/RayTracingTheNextWeek.html)上。

## 2. 动态模糊

当你在做光线追踪时, 想要更好的出图质量就意味着更多的程序运行时间。例如上一本书中的反射部分和镜头散焦模糊中, 你需要对每个像素进行多重采样。当你决定在这条路上走得更深一些时, 好消息来了: 几乎所有的特效都能这样暴力实现。动态模糊也是属于能这样实现的特效之一。想象一个真实世界的摄像机, 在快门打开的时间间隔中, 摄像机和物体都有可能移动。那拍出来的结果肯定是这个运动过程每一帧的平均值, 或者说, 一团糊了。我们可以用随机的方法在不同时间发射多条射线来模拟快门的打开。只要物体在那个时间处于其正确的位置, 那么我们就能得出这条光线在那个时间点的精确平均值。这就是为什么随机光追看上去很简单的原因。  
一个基础的思路是, 在快门打开时, 随着时间变化随机生成光线, 并同时发出射线与模型相交。一般来说我们让摄像机和物体同时运动, 并让每一条射线都拥有自己存在的一个时间点。这样光线追踪器的 “引擎” 就能确定, 对于指定的某条光线来说, 在该时刻, 物体到底在哪儿。求射线与球相交的部分写法和之前并没有太多区别。  
为了实现刚刚的思路, 我们首先要让每条光线都能储存自己所在的时刻, 就像这样:

```
class ray {
    public:
        ray() {}
+        ray(const vec3& origin, const vec3& direction, double time = 0.0)
+            : orig(origin), dir(direction), tm(time)
+        {}

        vec3 origin() const { return orig; }
        vec3 direction() const { return dir; }
+        double time() const { return tm; }

        vec3 at(double t) const {
            return orig + t*dir;
        }

    public:
        vec3 orig;
        vec3 dir;
+        double tm;
};
```

现在我们需要让摄像机在 time1 到 time2 的时间段中随机生成射线。光线的生成时刻是让 camera 类自己来运算追踪呢, 还是说可以让用户来自行指定光线在哪个时刻生成比较好呢? 当出现这样的疑问时, 我喜欢让构造函数更加复杂, 同时调用起来会更加简单。所以我让 camera 类来储存着两个变量。但这只是我的个人喜好。camera 类并不需要太多修改, 因为现在它不会动, 只会在一个时间段内发出射线。  

```
class camera {
    public:
        camera(
            vec3 lookfrom, vec3 lookat, vec3 vup,
            double vfov, // top to bottom, in degrees
+            double aspect, double aperture, double focus_dist, double t0 = 0, double t1 = 0
        ) {
            origin = lookfrom;
            lens_radius = aperture / 2;
+            time0 = t0;
+            time1 = t1;
            auto theta = degrees_to_radians(vfov);
            auto half_height = tan(theta/2);
            auto half_width = aspect * half_height;

            w = unit_vector(lookfrom - lookat);
            u = unit_vector(cross(vup, w));
            v = cross(w, u);

            lower_left_corner = origin
                              - half_width*focus_dist*u
                              - half_height*focus_dist*v
                              - focus_dist*w;

            horizontal = 2*half_width*focus_dist*u;
            vertical = 2*half_height*focus_dist*v;
        }

        ray get_ray(double s, double t) {
            vec3 rd = lens_radius * random_in_unit_disk();
            vec3 offset = u * rd.x() + v * rd.y();
+            return ray(
+                origin + offset,
+                lower_left_corner + s*horizontal + t*vertical - origin - offset,
+                random_double(time0, time1)
+            );
        }

    public:
        vec3 origin;
        vec3 lower_left_corner;
        vec3 horizontal;
        vec3 vertical;
        vec3 u, v, w;
        double lens_radius;
+        double time0, time1;  // shutter open/close times
};
```

我们还需要一个运动中的物体。我建立了一个新的 sphere 类, 让它的球心在 `time0` 到 `time1` 的时间段内从 `center0` 线性运动到 `center1`。超出这个时间段, 这个球心依然在动, _【译注：就是说在做线性插值的时候 t 可以大于 1.0 也可以小于 0】_, 所以这里的两个时间变量和摄像机快门的开关时刻并不需要一一对应。

```
class moving_sphere : public hittable {
    public:
        moving_sphere() {}
        moving_sphere(
            vec3 cen0, vec3 cen1, double t0, double t1, double r, shared_ptr<material> m)
            : center0(cen0), center1(cen1), time0(t0), time1(t1), radius(r), mat_ptr(m)
        {};

        virtual bool hit(const ray& r, double tmin, double tmax, hit_record& rec) const;

        vec3 center(double time) const;

    public:
        vec3 center0, center1;
        double time0, time1;
        double radius;
        shared_ptr<material> mat_ptr;
};

vec3 moving_sphere::center(double time) const{
    return center0 + ((time - time0) / (time1 - time0))*(center1 - center0);
}
```

另外一种让球随着时间动起来的方法是, 取代先前新建一个动态球类的做法, 只留一个球类, 让所有的球都动起来, 只是那些静止的球起点与终点位置相同。我在第一种方案和第二种方案间反复很跳。所以就请你们自己根据自己的喜好来选择吧。球与光线求交的代码几乎没有改变: 只要把 `center` 改成一个插值函数 `center(time)` 就行了

```
bool moving_sphere::hit(
    const ray& r, double t_min, double t_max, hit_record& rec) const {
+    vec3 oc = r.origin() - center(r.time());
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
+            vec3 outward_normal = (rec.p - center(r.time())) / radius;
            rec.set_face_normal(r, outward_normal);
            rec.mat_ptr = mat_ptr;
            return true;
        }

        temp = (-half_b + root) / a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
+            vec3 outward_normal = (rec.p - center(r.time())) / radius;
            rec.set_face_normal(r, outward_normal);
            rec.mat_ptr = mat_ptr;
            return true;
        }
    }
    return false;
}
```

请确保你的材质在运算光线散射时, 散射光线与入射光线所存在的时间点相同。

```
class lambertian : public material {
    public:
        lambertian(const vec3& a) : albedo(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            vec3 scatter_direction = rec.normal + random_unit_vector();
+            scattered = ray(rec.p, scatter_direction, r_in.time());
            attenuation = albedo;
            return true;
        }

        vec3 albedo;
};
```

下面的代码是在上本书结尾处最终场景的例子上加以改动, 使其中漫反射材质的球动起来。(想象一下摄像机的快门在 time0 时打开, 在 time1 时关闭) 每个球的中心在 time0 到 time1 的时间段内从原始位置 $\mathbf{C}$ 线性运动到 $\mathbf{C} + (0, r/2, 0)$ , 其中 r 是 [0,1) 之间的随机数。

```
hittable_list random_scene() {
    hittable_list world;

    world.add(make_shared<sphere>(
        vec3(0,-1000,0), 1000, make_shared<lambertian>(vec3(0.5, 0.5, 0.5))));

    int i = 1;
    for (int a = -10; a < 10; a++) {
        for (int b = -10; b < 10; b++) {
            auto choose_mat = random_double();
            vec3 center(a + 0.9*random_double(), 0.2, b + 0.9*random_double());
            if ((center - vec3(4, .2, 0)).length() > 0.9) {
                if (choose_mat < 0.8) {
                    // diffuse
                    auto albedo = vec3::random() * vec3::random();
                    world.add(make_shared<moving_sphere>(
                        center, center + vec3(0, random_double(0,.5), 0), 0.0, 1.0, 0.2,
                        make_shared<lambertian>(albedo)));
                } else if (choose_mat < 0.95) {
                    // metal
                    auto albedo = vec3::random(.5, 1);
                    auto fuzz = random_double(0, .5);
                    world.add(
                        make_shared<sphere>(center, 0.2, make_shared<metal>(albedo, fuzz)));
                } else {
                    // glass
                    world.add(make_shared<sphere>(center, 0.2, make_shared<dielectric>(1.5)));
                }
            }
        }
    }

    world.add(make_shared<sphere>(vec3(0, 1, 0), 1.0, make_shared<dielectric>(1.5)));
    world.add(make_shared<sphere>(
        vec3(-4, 1, 0), 1.0, make_shared<lambertian>(vec3(0.4, 0.2, 0.1))));
    world.add(make_shared<sphere>(
        vec3(4, 1, 0), 1.0, make_shared<metal>(vec3(0.7, 0.6, 0.5), 0.0)));

    return world;
}
```

并使用以下的摄像机参数:

```
const auto aspect_ratio = double(image_width) / image_height;
...
vec3 lookfrom(13,2,3);
vec3 lookat(0,0,0);
vec3 vup(0,1,0);
auto dist_to_focus = 10.0;
auto aperture = 0.0;

camera cam(lookfrom, lookat, vup, 20, aspect_ratio, aperture, dist_to_focus, 0.0, 1.0);
```

你将会得到类似下面的结果:

![](https://pic2.zhimg.com/v2-52e1894de917447810291ad004c97535_r.jpg)

## 3. 层次包围盒

这部分是书中最难, 也是与我们正在写的光线追踪器关联最深的一部分。我把这部分放在这么前面, 是因为它改写了 `hittable` 的部分代码, 程序运行起来更加的快了。而且当我们后面添加三角形和箱子类的时候, 我们也不必回来改写 `hittable` 了。  
光线的求交运算一直是光线追踪器的主要时间瓶颈, 并且运行时间与场景中的物体数量线性相关。使用遍历反复查找同一个模型会有许多多余的计算, 所以我们应该用二叉搜索的方法来加速查找。我们对每个模型都射出了成千上万的射线, 我们可以对模型的排序进行模拟, 每一次光线求交都是一个亚线性 (subliner) 的查找_【译注: 亚线性指参数的指数小于 1, 即不到线性, 平衡查找树的时间复杂度为 O(log2(n))】_。最常见的两种排序方法是 1) 按空间分割_【译注: 如 KD 树、八叉树】_2) 按物体分割。后者一般来说实现起来更简单并且对大多数模型来说运行速度都不错。  
包围盒的核心思想是去找到一个能包围所有物体的盒子。举例来说, 假设你计算了一个包围 10 个物体的大球, 那么任何射不到这个大球的射线, 它都射不到球里面的那 10 个物体。反之亦然, 如果射线碰到大球了, 那么它和里面那 10 个物体都有可能发生关系。所以包围盒的代码看上去总是这样的:

```
if (ray hits bounding object)
    return whether ray hits bounded objects
else
    return false
```

记住, 我们的核心思想是把很多很多物体分割为子集。我们并不划分屏幕或者是空间。每个物体都只在一个包围盒里面, 并且这些包围盒还可以重叠。  
为了做到每次光线求交都是一个亚线性的查找, 我们需要用包围盒构建出层级 (hierarchical)。举个例子, 如果我们把一堆物体分成两队, 红队和蓝队, 并使用方方正正的包围盒来包围他们, 你将看到如下场景:

![](https://pic1.zhimg.com/v2-ddddcb29cc32a8f5dd6e59fe8f874084_r.jpg)

注意蓝盒子和红盒子现在都在紫盒子里面, 他们可以重合, 并且无序 —— 他们都平平等等的躺在紫盒子的肚子里。所以图片里右边的那颗树并没有什么左子树右子树的概念_【译注: 作者这里只是想强调他们属于同一层, 地位平等。等待会实际写这个二叉查找树的时候还是会有左子树右子树的】_, 这两个分支是同级的。代码看起来是这样的:

```
if(hits purple)
    hit0 = hits blue enclosed objects
    hit1 = hits red enclosed objects
    if(hit0 or hit1)
        return true and info of closer hit
return false
```

  
为了能使上述代码良好的跑起来, 我们需要好好规划一下怎么分堆。还得想想怎么去检测光线和包围盒相交。求交计算一定要高效, 并且包围盒要尽量密集。很对大多数模型来说, 轴对齐的包围盒比其他种类的包围盒效果更好。但是当你遇到更复杂的模型种类时, 你就先别想着用这种方法了。  
从现在开始, 我们会把轴对齐的包围盒叫成矩形平行管道 (讲真的, 这才是他本来该有的精确描述), 或者还是叫他 **AABB** 吧 。你想用啥方法去算光线和 AABB 是否相交都行。我们现在只要能判断我们能不能射中这个 AABB 就行了。和击中那些会在屏幕上显示出来的物体时不同, 射线与 AABB 求交并不需要去获取那些法向啊交点啊这些东西, AABB 不需要在屏幕上渲染出来。  
大多数人采用一个叫**堆叠法 (slab)** 的方法。显然一个 n 维的 AABB 盒是由 n 个平行线所截的区间的重叠拼出来的区域 _【译注: 这里看图就行了, 别看字】_, 我们管这个叫 "slab"。一个区间就是两个端点间的距离。比如对于 x, 3<x<5, 或者更加简洁的 $x \in(3,5)$ 。在二维的情况下, 两段区间重叠的部分就是一个二维的 AABB(一个矩形):

![](https://pic2.zhimg.com/v2-00428d9e4f0b83e72552759836e311b9_r.jpg)

对于检测射线是否射入一段区间来说, 我们首先要看看射线有没有射入这个区间的边界。还是拿二维来举例子, 这是光线变量 t0, t1。(在光线和目标平面平行的情况下, 因为并没有交点, 这两个变量将未定义)

![](https://pic1.zhimg.com/v2-c13320c49f1bd37b84370b6a8a1a9318_r.jpg)

在三维的情况下, 这些射入的边界不再是一条线, 而是一个平面。 这两个边界平面的方程分别是 $x=x_0$ 和 $x=x_1$ 。那么怎样来计算射线和平面相交呢? 让我们回想一下上一本书中我们给出的, 点 p 关于参数 t 的方程

$p(t) = A + t·B$

这个等式用在三个坐标轴上都行, 比如

 $x(t) = A_x + t·B_x$

然后我们把这个方程和平面方程 $x=x_0$ 联立, 使得存在一个值 t, 满足下面方程:

$x_0 = A_x + t_0·B_x$

我们稍稍变下形:

$t_0=\frac{x_0-A_x}{B_x}$

同理, 对于 $x_1$ 的那个平面来说:

$t_1=\frac{x_1-A_x}{B_x}$

把这个 1D 的等式运用到我们 AABB 求交运算的关键是, 你需要把 n 个维度的 t 区间重叠在一起。举例来说, 在 2D 情况下, 绿色的 t 区间和蓝色的 t 区间发生重叠的情况如下:

![](https://pic4.zhimg.com/v2-65bd39b93d98813a5d5a068d0030e78b_r.jpg)

_【译注: 这张图挺好的, 上面的那条射线, 蓝色与绿色部分没有重叠, 很自然的就没有穿过这个 AABB 矩形, 下面那条射线发生了重叠, 说明射线同时传过了蓝色区域和绿色区域, 即穿过了 AABB 矩形。注意对每一个维度来说, 这里我们解出来的 t0, t1 都表示直线上一个固定的点的位置, 所以我们可以自然地按照维度拆分计算, 然后在通过 t 这个统一的标识进行求交运算】_

用代码表示 "区间们是否重叠" 看上去会是这样:

```
compute(tx0, tx1)
compute(ty0, ty1)
return overlap?( (tx0, tx1), (ty0, ty1))
```

这看上去真是简洁! 而且放到 3D 的情况下依旧适用, 所以大家都爱堆叠法:

```
compute(tx0, tx1)
compute(ty0, ty1)
compute(tz0, tz1)
return overlap?( (tx0, tx1), (ty0, ty1), (tz0, tz1))
```

当然我们还要对它做一些限制, 这会使它看上去没有一开始那么简洁。首先, 假设射线从 $x$ 轴负方向射入, 这样前面 `compute` 的这个区间 $(t_x0,t_x1)$ 就会反过来了, e.g. $(7, 3)$ 。第二, 除数为零时我们会得到无穷, 如果射线的原点就在这个堆叠的边界上, 我们就会得到 **NaN**。不同的光线追踪器的 AABB 部分解决上述问题的方法多种多样。(这里还有一些矢量平行加速的方面比如 SIMD, 我们本书中不讨论。如果你想走得更远些, 使用这种方法加速的话, [Ingo Wald 的论文](http://www.sci.utah.edu/~wald/PhD/wald_phd.pdf)将是个不错的选择)。对我们来说, 这并不是一个运算的主要瓶颈。所以直接让我们用最快捷最简单的方式搞起来吧! 首先我们来看看需要计算的这些区间。

$t_x0 = \frac{x_0-A_x}{B_x}$

$t_x1 = \frac{x_1-A_x}{B_x}$

我们的麻烦是一些射线恰好 $B_x = 0$ , 这样就会有除数为 0 的错误。一些光线在堆叠的里面, 一些不在。浮点 0 在 IEEE 工程标准下是有正负号的。好消息是, 在 $x_0$ 到 $x_1$ 区间内, $t_x0$ 与 $t_x1$ 要么同为 $\infty$ 要么同为 $-\infty$ 。所以使用 min 与 max 函数就能得到正确的结果:

$t_x0 = min(\frac{x_0-A_x}{B_x},\frac{x_1-A_x}{B_x})$

$t_x1 = max(\frac{x_0-A_x}{B_x},\frac{x_1-A_x}{B_x})$

现在只剩下分母 $B_x = 0$ 并且 $x_0 - A_x = 0$ 和 $x_1 - A_x = 0$ 这两个分子之一为零的特殊情况了。这样我们会得到一个 **NaN**_【译注: 0/0 = NaN】_。这种情况我们认为他射中了或者没射中这个区域都行。我们过会儿再来解决这个问题。

现在让我们先来看看 `overlap` 函数, 假设我们能保证区间没有被倒过来 (即第一个值比第二个值小), 在这种情况下我们 `return true`, 那么一个计算 $(d,D)$ 和 $(e,E)$ 的重叠区间 $(f,F)$ 的函数看上去是这样的:

```
bool overlap(d, D, e, E, f, F)
    f = max(d, e)
    F = min(D, E)
    return (f < F)
```

如果这里出现了任何的 **NaN**, 比较结果都会 return false, 所有如果考虑到那些擦边的情况, 我们要保证我们的包围盒有一些内间距 (而且我们也许理应这么做, 因为在光线追踪中所有的情况最终都会发生)。把三个维度都写在一个循环中并传入时间间隔 $t_min$ , $t_max$ 我们得到:

```
#include "rtweekend.h"

class aabb {
    public:
        aabb() {}
        aabb(const vec3& a, const vec3& b) { _min = a; _max = b;}

        vec3 min() const {return _min; }
        vec3 max() const {return _max; }

        bool hit(const ray& r, double tmin, double tmax) const {
            for (int a = 0; a < 3; a++) {
                auto t0 = ffmin((_min[a] - r.origin()[a]) / r.direction()[a],
                                (_max[a] - r.origin()[a]) / r.direction()[a]);
                auto t1 = ffmax((_min[a] - r.origin()[a]) / r.direction()[a],
                                (_max[a] - r.origin()[a]) / r.direction()[a]);
                tmin = ffmax(t0, tmin);
                tmax = ffmin(t1, tmax);
                if (tmax <= tmin)
                    return false;
            }
            return true;
        }

        vec3 _min;
        vec3 _max;
};
```

注意我们把 `cmath` 内置的 `fmax()` 函数换成了我们自己的 `ffmax()`(在 rtweekend 中定义)。这样会更快一点， 因为我们自己写的函数并不需要考虑到 NaN 和其他的异常情况。来自皮克斯的 Andrew Kensler 在阅读我的这个求交方法时做了一些试验, 并提出了一个自己的版本。这个版本在大多数编译器上都运行的非常好。所以我采用了这个方法作为我们接下来要使用的方法。

```
//Andrew Kensler's hit method
//可以看到在上面的基础上略去了一些重复计算, 优化了不少
inline bool aabb::hit(const ray& r, double tmin, double tmax) const {
    for (int a = 0; a < 3; a++) {
        auto invD = 1.0f / r.direction()[a];
        auto t0 = (min()[a] - r.origin()[a]) * invD;
        auto t1 = (max()[a] - r.origin()[a]) * invD;
        if (invD < 0.0f)
            std::swap(t0, t1);
        tmin = t0 > tmin ? t0 : tmin;
        tmax = t1 < tmax ? t1 : tmax;
        if (tmax <= tmin)
            return false;
    }
    return true;
}
```

现在我们需要加入一个函数来计算这些包裹着 hittable 类的包围盒。然后我们将做一个层次树。在这个层次树中, 所有的图元, 比如球体, 都会在树的最底端 (叶子节点)。这个函数返回值是一个 bool 因为不是所有的图元都有包围盒的 (_**e.g**_ 无限延伸的平面)。另外, 物体会动, 所以他还要接收 `time1` 和 `time2`, 包围盒会把在这个时间区间内运动的物体完整的包起来。

```
class hittable {
    public:
        virtual bool hit(
            const ray& r, double t_min, double t_max, hit_record& rec) const = 0;
+        virtual bool bounding_box(double t0, double t1, aabb& output_box) const = 0;
};
```

对一个 `sphere` 类来说, 求包围盒真的太简单了:

```
bool sphere::bounding_box(double t0, double t1, aabb& output_box) const {
    output_box = aabb(
        center - vec3(radius, radius, radius),
        center + vec3(radius, radius, radius));
    return true;
}
```

对于 `moving_sphere`, 我们先求球体在 $t_0$ 时刻的包围盒, 再求球体在 $t_1$ 时刻的包围盒, 然后再计算这两个盒子的包围盒:

```
bool moving_sphere::bounding_box(double t0, double t1, aabb& output_box) const {
    aabb box0(
        center(t0) - vec3(radius, radius, radius),
        center(t0) + vec3(radius, radius, radius));
    aabb box1(
        center(t1) - vec3(radius, radius, radius),
        center(t1) + vec3(radius, radius, radius));
    output_box = surrounding_box(box0, box1);
    return true;
}
```

对于 `hittable_list` 来说, 我们可以在构造函数中就进行包围盒的运算, 或者在程序运行时计算。我喜欢在运行时计算, 因为这些包围盒的计算一般只有在 BVH 构造时才会被调用。

```
bool hittable_list::bounding_box(double t0, double t1, aabb& output_box) const {
    if (objects.empty()) return false;

    aabb temp_box;
    bool first_box = true;

    for (const auto& object : objects) {
        if (!object->bounding_box(t0, t1, temp_box)) return false;
        output_box = first_box ? temp_box : surrounding_box(output_box, temp_box);
        first_box = false;
    }

    return true;
}
```

我们需要一个 `surrounding_box` 函数来计算包围盒的包围盒。

```
aabb surrounding_box(aabb box0, aabb box1) {
    vec3 small(ffmin(box0.min().x(), box1.min().x()),
               ffmin(box0.min().y(), box1.min().y()),
               ffmin(box0.min().z(), box1.min().z()));
    vec3 big  (ffmax(box0.max().x(), box1.max().x()),
               ffmax(box0.max().y(), box1.max().y()),
               ffmax(box0.max().z(), box1.max().z()));
    return aabb(small,big);
}
```

BVH 也应该是 `hittable` 的一员, 就像 `hittable_list` 类那样。BVH 虽然是个容器, 但也能对于问题 “这条光线射中你了么?” 做出回答。一个设计上的问题是, 我们是为树和树的节点设计两个不同的类呢, 还是用一个类加上指针来搞定。我是一个类搞定派, 所以这个类会是这样:

```
//bvh.h
class bvh_node : public hittable {
    public:
        bvh_node();

        bvh_node(hittable_list& list, double time0, double time1)
            : bvh_node(list.objects, 0, list.objects.size(), time0, time1)
        {}

        bvh_node(
            std::vector<shared_ptr<hittable>>& objects,
            size_t start, size_t end, double time0, double time1);

        virtual bool hit(const ray& r, double tmin, double tmax, hit_record& rec) const;
        virtual bool bounding_box(double t0, double t1, aabb& output_box) const;

    public:
        shared_ptr<hittable> left;
        shared_ptr<hittable> right;
        aabb box;
};

bool bvh_node::bounding_box(double t0, double t1, aabb& output_box) const {
    output_box = box;
    return true;
}
```

注意我们的子节点指针是 `hittable*`, 所以这个指针可以指向所有的 `hittable` 类。例如节点 `bvh_node`， 或者是 `sphere`, 或者是其他各种各样的图元。  
`hit` 函数也是十分的直接明了: 检查这个节点的 box 是否被击中, 如果是的话, 那就对这个节点的子节点进行判断。_【译注: 对于二叉树来说, 这样的递归结构相信大家并不陌生】_

```
//这段代码比起V2.0时简洁了不少
bool bvh_node::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    if (!box.hit(r, t_min, t_max))
        return false;

    bool hit_left = left->hit(r, t_min, t_max, rec);
    bool hit_right = right->hit(r, t_min, hit_left ? rec.t : t_max, rec);

    return hit_left || hit_right;
}
```

任何高效的数据结构, 例如 BVH, 最复杂的部分就是如何去构建他。我们会在构造函数里完成。 对于 BVH 来说, 很酷的一点是当你不断地把 `bvh_node` 中的物体分割成两个子集的同时, hit 函数也会跟着执行。如果说你分割的算法很好, 两个孩子的包围盒都比其父节点的包围盒要小, 那么自然 hit 函数也会运行的很好。但是这样只是快, 并不正确, 我将在正确和快直接做取舍, 在每次分割时我沿着一个轴把物体列表分成两半。我将采用最简单直接的分割原则:  
1. 随机选取一个轴来分割  
2. 使用库函数 `sort()` 对图元进行排序  
3. 对半分, 每个子树分一半的物体  
物体分割过程递归执行, 当数组传入时只剩下两个元素时, 我在两个子树节点各放一个, 并结束递归。为了使遍历算法平滑, 并且不去检查空指针, 当只有一个元素时, 我将其重复的放在每一个子树里。想象一下有三个元素, 然后仔细的一步步递归一遍有助你理解算法, 但我这里先提一下, 之后我们会优化整个算法。现在代码是这样的:

```
#include <algorithm>
...

bvh_node::bvh_node(
    std::vector<shared_ptr<hittable>>& objects,
    size_t start, size_t end, double time0, double time1
) {
    int axis = random_int(0,2);
    auto comparator = (axis == 0) ? box_x_compare
                    : (axis == 1) ? box_y_compare
                                  : box_z_compare;

    size_t object_span = end - start;

    if (object_span == 1) {
        left = right = objects[start];
    } else if (object_span == 2) {
        if (comparator(objects[start], objects[start+1])) {
            left = objects[start];
            right = objects[start+1];
        } else {
            left = objects[start+1];
            right = objects[start];
        }
    } else {
        std::sort(objects.begin() + start, objects.begin() + end, comparator);

        auto mid = start + object_span/2;
        left = make_shared<bvh_node>(objects, start, mid, time0, time1);
        right = make_shared<bvh_node>(objects, mid, end, time0, time1);
    }

    aabb box_left, box_right;

    if (  !left->bounding_box (time0, time1, box_left)
       || !right->bounding_box(time0, time1, box_right)
    )
        std::cerr << "No bounding box in bvh_node constructor.\n";

    box = surrounding_box(box_left, box_right);
}
```

这边做了一个物体是否有包围盒的检查, 是为了防止你把一些如无限延伸的平面这样没有包围盒的东西传进去当参数。我们现在并没有这样的图元, 所以在你手动添加这样的图元之前, 这个 `std::cerr` 并不会被执行。  
现在我们需要实现 `std::sort()` 使用的比较函数。我们先判断是哪个轴, 然后对应的为我们的比较器赋值。

```
inline bool box_compare(const shared_ptr<hittable> a, const shared_ptr<hittable> b, int axis) {
    aabb box_a;
    aabb box_b;

    if (!a->bounding_box(0,0, box_a) || !b->bounding_box(0,0, box_b))
        std::cerr << "No bounding box in bvh_node constructor.\n";

    return box_a.min().e[axis] < box_b.min().e[axis];
}

bool box_x_compare (const shared_ptr<hittable> a, const shared_ptr<hittable> b) {
    return box_compare(a, b, 0);
}

bool box_y_compare (const shared_ptr<hittable> a, const shared_ptr<hittable> b) {
    return box_compare(a, b, 1);
}

bool box_z_compare (const shared_ptr<hittable> a, const shared_ptr<hittable> b) {
    return box_compare(a, b, 2);
}
```

_【译注: 使用方法：在 random_scene() 函数最后 return static_cast<hittable_list>(make_shared<bvh_node>(world,0,1));】_

## 4. 纹理

在图形学中, 纹理贴图常常意味着一个将颜色赋予物题表面的一个过程。这个过程可以是纹理生成代码, 或者是一张图片, 或者是两者的结合。我们首先来使用颜色作为贴图。大多数程序员把静态 rgb 颜色和贴图写成两个不同的类, 以此来区分两者, 但我更加喜欢下面的做法, 因为这样就可以把任何颜色弄成一张贴图, 十分的 great。

```
#include "rtweekend.h"

class texture {
    public:
        virtual vec3 value(double u, double v, const vec3& p) const = 0;
};

class constant_texture : public texture {
    public:
        constant_texture() {}
        constant_texture(vec3 c) : color(c) {}

        virtual vec3 value(double u, double v, const vec3& p) const {
            return color;
        }

    public:
        vec3 color;
};
```

我们需要更新 `hit_record` 结构体来储存击中点的 uv 信息:

```
struct hit_record {
    vec3 p;
    vec3 normal;
    shared_ptr<material> mat_ptr;
    double t;
+    double u;
+    double v;
    bool front_face;
    ...
```

把 vec3 的颜色换成一个纹理指针, 你将得到一个纹理材质。

```
class lambertian : public material {
    public:
        lambertian(shared_ptr<texture> a) : albedo(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            vec3 scatter_direction = rec.normal + random_unit_vector();
            scattered = ray(rec.p, scatter_direction, r_in.time());
            attenuation = albedo->value(rec.u, rec.v, rec.p);
            return true;
        }

    public:
        shared_ptr<texture> albedo;
};
```

在之前一个 lambert 材质是这样的:

```
...make_shared<lambertian>(vec3(0.5, 0.5, 0.5))
```

现在我们把 `vec3(...)` 换成 `make_shared<constant_texture>(vec3(...))`

```
...make_shared<lambertian>(make_shared<constant_texture>(vec3(0.5, 0.5, 0.5)))
```

我们可以使用 sine 和 cosine 函数周期性的变化来做一个棋盘格纹理。如果我们在三个维度都乘上这个周期函数, 就会形成一个 3D 的棋盘格模型。

```
class checker_texture : public texture {
    public:
        checker_texture() {}
        checker_texture(shared_ptr<texture> t0, shared_ptr<texture> t1): even(t0), odd(t1) {}

        virtual vec3 value(double u, double v, const vec3& p) const {
            auto sines = sin(10*p.x())*sin(10*p.y())*sin(10*p.z());
            if (sines < 0)
                return odd->value(u, v, p);
            else
                return even->value(u, v, p);
        }

    public:
        shared_ptr<texture> odd;
        shared_ptr<texture> even;
};
```

这些奇偶格的指针可以指向一个静态纹理, 也可以指向一些程序生成的纹理。这就是 Pat Hanrahan 在 1980 年代提出的着色器网络的核心思想。  
如果我们把这个纹理贴在我们 `random_scene()` 函数里底下那个大球上:

```
auto checker = make_shared<checker_texture>(
    make_shared<constant_texture>(vec3(0.2, 0.3, 0.1)),
    make_shared<constant_texture>(vec3(0.9, 0.9, 0.9))
);

world.add(make_shared<sphere>(vec3(0,-1000,0), 1000, make_shared<lambertian>(checker)));
```

就有:

![](https://pic2.zhimg.com/v2-bb9182ea1929308c14f338279b160dc5_r.jpg)

如果我们添加一个新场景:

```
hittable_list two_spheres() {
    hittable_list objects;

    auto checker = make_shared<checker_texture>(
        make_shared<constant_texture>(vec3(0.2, 0.3, 0.1)),
        make_shared<constant_texture>(vec3(0.9, 0.9, 0.9))
    );

    objects.add(make_shared<sphere>(vec3(0,-10, 0), 10, make_shared<lambertian>(checker)));
    objects.add(make_shared<sphere>(vec3(0, 10, 0), 10, make_shared<lambertian>(checker)));

    return objects;
}
```

使用以下的摄像机参数

```
const auto aspect_ratio = double(image_width) / image_height;
...
vec3 lookfrom(13,2,3);
vec3 lookat(0,0,0);
vec3 vup(0,1,0);
auto dist_to_focus = 10.0;
auto aperture = 0.0;

camera cam(lookfrom, lookat, vup, 20, aspect_ratio, aperture, dist_to_focus, 0.0, 1.0);
```

我们将得到:

![](https://pic1.zhimg.com/v2-e08241f5d691ad8c1d51175719dd12b8_r.jpg)

## 5. 柏林噪声

为了得到一个看上去很 cool 的纹理, 大部分人使用柏林噪声 (Perlin noise)。柏林噪声是以它的发明者 Ken Perlin 命名的。柏林噪声并不会得到以下的白噪声:

![](https://pic4.zhimg.com/v2-45cd6131b8e1aa8dcfda4980ffc48dbf_r.jpg)

取而代之的是一些类似模糊后的白噪声:

![](https://pic4.zhimg.com/v2-8d4c01409d351da943de11ddc36c8893_r.jpg)

柏林噪声的关键特点是可复现性。如果输入的是同一个三维空间中的点, 他的输出值总是相同的。柏林噪声的另一个特点是它实现起来简单快捷。所以通常来说我们拿柏林噪声来做一些 hack 的事情。我会在 Andrew Kensler 的描述下逐步的实现这些 hack 的事情。  
我们可以用一个随机生成的三维数组铺满 (tile) 整个空间, 你会得到明显重复的区块:

![](https://pic4.zhimg.com/v2-801c8744e8603e20409a2c7a48479ecf_r.jpg)

不使用瓷砖贴图的方法, 让我们用哈希表去完成他, 代码如下:

```
class perlin {
    public:
        perlin() {
            ranfloat = new double[point_count];
            for (int i = 0; i < point_count; ++i) {
                ranfloat[i] = random_double();
            }

            perm_x = perlin_generate_perm();
            perm_y = perlin_generate_perm();
            perm_z = perlin_generate_perm();
        }

        ~perlin() {
            delete[] ranfloat;
            delete[] perm_x;
            delete[] perm_y;
            delete[] perm_z;
        }

        double noise(const vec3& p) const {
            auto u = p.x() - floor(p.x());
            auto v = p.y() - floor(p.y());
            auto w = p.z() - floor(p.z());

            auto i = static_cast<int>(4*p.x()) & 255;
            auto j = static_cast<int>(4*p.y()) & 255;
            auto k = static_cast<int>(4*p.z()) & 255;

            return ranfloat[perm_x[i] ^ perm_y[j] ^ perm_z[k]];
        }

    private:
        static const int point_count = 256;
        double* ranfloat;
        int* perm_x;
        int* perm_y;
        int* perm_z;

        static int* perlin_generate_perm() {
            auto p = new int[point_count];

            for (int i = 0; i < perlin::point_count; i++)
                p[i] = i;

            permute(p, point_count);

            return p;
        }

        static void permute(int* p, int n) {
            for (int i = n-1; i > 0; i--) {
                int target = random_int(0, i);
                int tmp = p[i];
                p[i] = p[target];
                p[target] = tmp;
            }
        }
};
```

现在让我们来生成一个纹理, 使用范围为 0 到 1 的一个 float 变量来制造灰度图:

```
#include "perlin.h"

class noise_texture : public texture {
    public:
        noise_texture() {}

        virtual vec3 value(double u, double v, const vec3& p) const {
            return vec3(1,1,1) * noise.noise(p);
        }

    public:
        perlin noise;
};
```

我们可以把纹理运用在一些球上:

```
hittable_list two_perlin_spheres() {
    hittable_list objects;

    auto pertext = make_shared<noise_texture>();
    objects.add(make_shared<sphere>(vec3(0,-1000, 0), 1000, make_shared<lambertian>(pertext)));
    objects.add(make_shared<sphere>(vec3(0, 2, 0), 2, make_shared<lambertian>(pertext)));

    return objects;
}
```

并使用和之前相同的摄像机参数:

```
const auto aspect_ratio = double(image_width) / image_height;
...
vec3 lookfrom(13,2,3);
vec3 lookat(0,0,0);
vec3 vup(0,1,0);
auto dist_to_focus = 10.0;
auto aperture = 0.0;

camera cam(lookfrom, lookat, vup, 20, aspect_ratio, aperture, dist_to_focus, 0.0, 1.0);
```

如我们所愿, 我们成功的使用哈希生成了下面的图案:

![](https://pic4.zhimg.com/v2-ffbb7bf9ec9ef52c9f543f15a52565fb_r.jpg)

为了让它看上去更加平滑, 我们可以采用线性插值:

```
inline double trilinear_interp(double c[2][2][2], double u, double v, double w) {
    auto accum = 0.0;
    for (int i=0; i < 2; i++)
        for (int j=0; j < 2; j++)
            for (int k=0; k < 2; k++)
                accum += (i*u + (1-i)*(1-u))*
                         (j*v + (1-j)*(1-v))*
                         (k*w + (1-k)*(1-w))*c[i][j][k];

    return accum;
}

class perlin {
    public:
        ...
        double noise(const vec3& p) const {
            auto u = p.x() - floor(p.x());
            auto v = p.y() - floor(p.y());
            auto w = p.z() - floor(p.z());
            int i = floor(p.x());
            int j = floor(p.y());
            int k = floor(p.z());
            double c[2][2][2];

            for (int di=0; di < 2; di++)
                for (int dj=0; dj < 2; dj++)
                    for (int dk=0; dk < 2; dk++)
                        c[di][dj][dk] = ranfloat[
                            perm_x[(i+di) & 255] ^
                            perm_y[(j+dj) & 255] ^
                            perm_z[(k+dk) & 255]
                        ];

            return trilinear_interp(c, u, v, w);
        }
        ...
    }
```

我们会得到:

![](https://pic1.zhimg.com/v2-62109dd5b223a9253fa5648788c77954_r.jpg)

嗯, 现在看上去更好了, 但是还是能明显的看出来有格子的痕迹。其中的一部分是马赫带 (Mach bands), 是由线性变化的颜色构成的有名的视觉感知效果。这里我们使用一个标准的解法：用 hermite cube 来平滑差值。

```
class perlin (
    public:
        ...
        double noise(const vec3& p) const {
            auto u = p.x() - floor(p.x());
            auto v = p.y() - floor(p.y());
            auto w = p.z() - floor(p.z());
            u = u*u*(3-2*u);
            v = v*v*(3-2*v);
            w = w*w*(3-2*w);

            int i = floor(p.x());
            int j = floor(p.y());
            int k = floor(p.z());
            ...
```

这样看起来就更加平滑了:

![](https://pic1.zhimg.com/v2-15d23edd0c12695edbfe196b25323f38_r.jpg)

现在这个球看上去变化的频率太低了, 没什么花纹, 我们加入一个 `scale` 变量让它更快的发生变化:

```
class noise_texture : public texture {
    public:
        noise_texture() {}
        noise_texture(double sc) : scale(sc) {}

        virtual vec3 value(double u, double v, const vec3& p) const {
+            return vec3(1,1,1) * noise.noise(scale * p);
        }

    public:
        perlin noise;
        double scale;
};
```

会得到:

![](https://pic2.zhimg.com/v2-d2e10e0b6269432efa1d15dc7a587f3d_r.jpg)

现在看上去还是有一点格子的感觉, 也许是因为这方法的最大值和最小值总是精确地落在了整数的 x/y/z 上, Ken Perlin 有一个十分聪明的 trick, 在网格点使用随机的单位向量替代 float(即梯度向量), 用点乘将 min 和 max 值推离网格点, 所以我们首先要把 random floats 改成 random vectors。这些梯度向量可以是任意合理的不规则方向的集合, 所以我干脆使用单位向量作为梯度向量:

```
class perlin {
    public:
        perlin() {
            ranvec = new vec3[point_count];

            for (int i = 0; i < point_count; ++i) {
                ranvec[i] = unit_vector(vec3::random(-1,1));
            }

            perm_x = perlin_generate_perm();
            perm_y = perlin_generate_perm();
            perm_z = perlin_generate_perm();
        }

        ~perlin() {
            delete[] ranvec;
            delete[] perm_x;
            delete[] perm_y;
            delete[] perm_z;
        }
    ...
    private:
        vec3* ranvec;
        int* perm_x;
        int* perm_y;
        int* perm_z;
        ...
}
```

现在的 `Perlin` 类如下:

```
class perlin {
    public:
        ...
        double noise(const vec3& p) const {
            auto u = p.x() - floor(p.x());
            auto v = p.y() - floor(p.y());
            auto w = p.z() - floor(p.z());
            int i = floor(p.x());
            int j = floor(p.y());
            int k = floor(p.z());
            vec3 c[2][2][2];

            for (int di=0; di < 2; di++)
                for (int dj=0; dj < 2; dj++)
                    for (int dk=0; dk < 2; dk++)
                        c[di][dj][dk] = ranvec[
                            perm_x[(i+di) & 255] ^
                            perm_y[(j+dj) & 255] ^
                            pexm_z[(k+dk) & 255]
                        ];

            return perlin_interp(c, u, v, w);
        }
        ...
    }
```

插值部分的代码看上去比之前复杂了一些:

```
class perlin {
    ...
    private:
        ...
        inline double perlin_interp(vec3 c[2][2][2], double u, double v, double w) {
            auto uu = u*u*(3-2*u);
            auto vv = v*v*(3-2*v);
            auto ww = w*w*(3-2*w);
            auto accum = 0.0;

            for (int i=0; i < 2; i++)
                for (int j=0; j < 2; j++)
                    for (int k=0; k < 2; k++) {
                        vec3 weight_v(u-i, v-j, w-k);
                        accum += (i*uu + (1-i)*(1-uu))
                               * (j*vv + (1-j)*(1-vv))
                               * (k*ww + (1-k)*(1-ww))
                               * dot(c[i][j][k], weight_v);
                    }

            return accum;
        }
    ...
}
```

柏林插值的输出结果有可能是负数, 这些负数在伽马校正时经过开平方跟 `sqrt()` 会变成 NaN。我们将输出结果映射到 0 与 1 之间。

```
class noise_texture : public texture {
    public:
        noise_texture() {}
        noise_texture(double sc) : scale(sc) {}

        virtual vec3 value(double u, double v, const vec3& p) const {
+            return vec3(1,1,1) * 0.5 * (1.0 + noise.noise(scale * p));
        }

    public:
        perlin noise;
        double scale;
};
```

最终我们得到一个让人满意的结果:

![](https://pic3.zhimg.com/v2-1486a7bf9d8f9a5bf30913422c597176_r.jpg)

使用多个频率相加得到复合噪声是一种很常见的做法, 我们常常称之为扰动 (turbulence), 是一种由多次噪声运算的结果相加得到的产物。

```
class perlin {
    ...
    public:
        ...
        double turb(const vec3& p, int depth=7) const {
            auto accum = 0.0;
            vec3 temp_p = p;
            auto weight = 1.0;

            for (int i = 0; i < depth; i++) {
                accum += weight*noise(temp_p);
                weight *= 0.5;
                temp_p *= 2;
            }

            return fabs(accum);
        }
        ...
```

这里的 `fabs()` 是 `math.h` 里的求绝对值的函数。  
直接使用 turb 函数来产生纹理, 会得到一个看上去像伪装网一样的东西:

![](https://pic4.zhimg.com/v2-3956bdbbadae95ca33e31047336bdc27_r.jpg)

然而扰动函数通常是间接使用的, 在程序生成纹理这方面的 "hello world" 是一个类似大理石的纹理。基本思路是让颜色与 sine 函数的值成比例, 并使用扰动函数去调整相位 (平移了 sin(x) 中的 x), 使得带状条纹起伏波荡。修正我们直接使用扰动 turb 或者噪声 noise 给颜色赋值的方法， 我们会得到一个类似大理石的纹理:

```
class noise_texture : public texture {
    public:
        noise_texture() {}
        noise_texture(double sc) : scale(sc) {}

        virtual vec3 value(double u, double v, const vec3& p) const {
+            return vec3(1,1,1) * 0.5 * (1 + sin(scale*p.z() + 10*noise.turb(p)));
        }

    public:
        perlin noise;
        double scale;
};
```

最终得到:  

![](https://pic1.zhimg.com/v2-20b702c94384e41bad3fa71b072fcd10_r.jpg)

篇幅有限，后半部分在这里：

[陈泽日天：Ray Tracing: The Next Week V3.0 中文翻译（下）](https://zhuanlan.zhihu.com/p/129745508)