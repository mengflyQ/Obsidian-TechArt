书接上文:

[陈泽日天：Ray Tracing in One Weekend V3.0 中文翻译](https://zhuanlan.zhihu.com/p/128582904)

## 8. 漫反射材质

既然我们已经有了物体的类和多重采样, 我们不妨再加入一些逼真的材质吧。我们先从漫反射材质开始。设计上的问题又来了: 我们是把材质和物体设计成两个类, 这样就可以将材质赋值给物体类的成员变量, 还是说让它们紧密结合, 这对于使用几何信息来生成纹理的程序来说是很便利的 。我们会采取将其分开的做法——实际上大多数的渲染器都是这样做的——但是记得注意的确是有两种设计方法的。  
漫反射材质不仅仅接受其周围环境的光线, 还会在散射时使光线变成自己本身的颜色。光线射入漫反射材质后, 其反射方向是随机的。所以如果我们为下面这两个漫发射的球射入三条光线, 光线都会有不同的反射角度:

![](https://pic2.zhimg.com/v2-f61ad9d024071668f27db1fc248abcf5_r.jpg)

并且大部分的光线都会被吸收, 而不是被反射。表面越暗, 吸收就越有可能发生。我们使用任意的算法生成随机的反射方向, 就能让其看上去像一个粗糙不平的漫反射材质。这里我们采用最简单的算法就能得到一个理想的漫反射表面 (其实是懒得写 lambertian 所以用了一个数学上近似的方法)。  
(读者 Vassillen Chizhov 提供了这个方法, 虽然并不是精确意义上的 lambert。我们会在章节最后提精确的 lambertian 表达式, 而其并不会很复杂)  
好, 现在有两个单位球相切于点 p, 这两个球体的球心为 $(p+\vec{N})$ 和 $(p-\vec{N})$ , $\vec{N}$ 是球体表面的法向量。球心为 $(p-\vec{N})$ 的那个球在表面的内部, 球心为 $(p+\vec{N})$ 的球在表面的外部。选择和光线原点位于表面同一侧的那个单位球, 并从球中随机选取一点 $s$ , 向量 $(s-p)$ 就是我们要求的反射光线的方向:

![](https://pic3.zhimg.com/v2-45d8ee02fefda11052daf78be9ace252_r.jpg)

我们需要一个算法来生成球体内的随机点。我们会采用最简单的做法: 否定法 (rejection method)。首先, 在一个 xyz 取值范围为 - 1 到 + 1 的单位立方体中选取一个随机点, 如果这个点在球外就重新生成直到该点在球内:

```
//vec3.h
class vec3 {
  public:
    ...
    inline static vec3 random() {
        return vec3(random_double(), random_double(), random_double());
    }

    inline static vec3 random(double min, double max) {
        return vec3(random_double(min,max), random_double(min,max), random_double(min,max));
    }
```

```
//vec3.h
vec3 random_in_unit_sphere() {
    while (true) {
        auto p = vec3::random(-1,1);
        if (p.length_squared() >= 1) continue;
        return p;
    }
}
```

然后使用我们新的生成随机随机反射方向的函数来更新一下我们的 ray_color() 函数:

```
//main.cc
vec3 ray_color(const ray& r, const hittable& world) {
    hit_record rec;

    if (world.hit(r, 0, infinity, rec)) {
        vec3 target = rec.p + rec.normal + random_in_unit_sphere();
        return 0.5 * ray_color(ray(rec.p, target - rec.p), world);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

这里还有个潜在的问题: 注意 ray_color 函数是一个递归函数。那么递归终止的条件是什么呢? 当它没有击中任何东西。但是, 在某些条件下, 达到这个终止条件的时间会非常长, 长到足够爆了函数栈【译注: 想象一下一条光线在一个镜子材质的密封的盒子 (并不吸收光线) 中反复折射, 永无尽头】。为了避免这种情况的发生, 我们使用一个变量 depth 限制递归层数。当递归层数达到限制值时我们终止递归, 返回黑色:【译注: 可以试试返回纯红(1,0,0), 然后渲染一下, 大致看一下是哪里在不停的发生散射】

```
//main.cc
vec3 ray_color(const ray& r, const hittable& world, int depth) {
    hit_record rec;

    // If we've exceeded the ray bounce limit, no more light is gathered.
    if (depth <= 0)
        return vec3(0,0,0);

    if (world.hit(r, 0, infinity, rec)) {
        vec3 target = rec.p + rec.normal + random_in_unit_sphere();
        return 0.5 * ray_color(ray(rec.p, target - rec.p), world, depth-1);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
...
int main() {
    const int image_width = 200;
    const int image_height = 100;
    const int samples_per_pixel = 100;
    const int max_depth = 50;

    ...
    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            vec3 color(0, 0, 0);
            for (int s = 0; s < samples_per_pixel; ++s) {
                auto u = (i + random_double()) / image_width;
                auto v = (j + random_double()) / image_height;
                ray r = cam.get_ray(u, v);
               color += ray_color(r, world, max_depth);
            }
            color.write_color(std::cout, samples_per_pixel);
        }
    }

    std::cerr << "\nDone.\n";
}
```

我们会得到:

![](https://pic3.zhimg.com/v2-01259cbd92f891d2db907a773d51e7aa_b.jpg)

注意球下面是有影子的。这个图片非常的暗, 但是我们的球在散射的时候只吸收了一半的能量。如果你看不见这个阴影, 别担心, 我们现在来修复一下。现实世界中的这个球明显是应该更加亮一些的。这是因为所有的看图软件都默认图像已经经过了伽马校正 (gamma corrected)。即在图片存入字节之前, 颜色值发生了一次转化。这么做有许多好处, 但这并不是我们这里所讨论的重点。我们使用 "gamma 2" 空间, 就意味着最终的颜色值要加上指数 $1/gamma$ , 在我们的例子里就是 ½, 即开平方根:

```
//vec3.h
void write_color(std::ostream &out, int samples_per_pixel) {
    // Divide the color total by the number of samples and gamma-correct
    // for a gamma value of 2.0.
    auto scale = 1.0 / samples_per_pixel;
    auto r = sqrt(scale * e[0]);
    auto g = sqrt(scale * e[1]);
    auto b = sqrt(scale * e[2]);

    // Write the translated [0,255] value of each color component.
    out << static_cast<int>(256 * clamp(r, 0.0, 0.999)) << ' '
        << static_cast<int>(256 * clamp(g, 0.0, 0.999)) << ' '
        << static_cast<int>(256 * clamp(b, 0.0, 0.999)) << '\n';
}
```

好了, 现在看上去更灰了, 如我们所愿:

![](https://pic4.zhimg.com/v2-f0ab33e768ac857087b5e2547f47b8b3_b.jpg)

这里还有个不太重要的潜在 bug。有些物体反射的光线会在 t=0 时再次击中自己。然而由于精度问题, 这个值可能是 t=-0.000001 或者是 t=0.0000000001 或者任意接近 0 的浮点数。所以我们要忽略掉 0 附近的一部分范围, 防止物体发出的光线再次与自己相交。【译注: 小心自相交问题】  

```
//main.cc
if (world.hit(r, 0.001, infinity, rec)) {
```

这样我们就能避免阴影痤疮 (shadow ance) 的产生。是滴, 这种现象的确是叫这个名字。  
拒绝法生成的点是单位球体积内的的随机点, 这样生成的向量大概率上会和法线方向相近, 并且极小概率会沿着入射方向反射回去。这个分布律的表达式有一个 $\cos^3 (\phi)$ 的系数, 其中 $\phi$ 是反射光线距离法向量的夹角。这样当光线从一个离表面很小的角度射入时, 也会散射到一片很大的区域, 对最终颜色值的影响也会更低。  
然而, 事实上的 lambertian 的分布律并不是这样的, 它的系数是 $\cos (\phi)$ 。真正的 lambertian 散射后的光线距离法相比较近的概率会更高, 但是分布律会更加均衡。这是因为我们选取的是单位球面上的点。我们可以通过在单位球内选取一个随机点, 然后将其单位化来获得该点。【译注: 然而下面的代码却用了极坐标的形式】

```
//vec3.h
vec3 random_unit_vector() {
    auto a = random_double(0, 2*pi);
    auto z = random_double(-1, 1);
    auto r = sqrt(1 - z*z);
    return vec3(r*cos(a), r*sin(a), z);
}
```

![](https://pic4.zhimg.com/v2-2a37ce5c0bb8e7e3f51cd3f947ce4f8f_r.jpg)

我们使用新函数 random_unit_vector() 替换现存的 random_unit_sphere():

```
//main.cc
vec3 ray_color(const ray& r, const hittable& world, int depth) {
    hit_record rec;

    // If we've exceeded the ray bounce limit, no more light is gathered.
    if (depth <= 0)
        return vec3(0,0,0);

    if (world.hit(r, 0.001, infinity, rec)) {
        vec3 target = rec.p + rec.normal + random_unit_vector();
        return 0.5 * ray_color(ray(rec.p, target - rec.p), world, depth-1);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

我们会得到这样的图片, 和之前很相像:

![](https://pic3.zhimg.com/v2-cc4cdd3d687349fa0d472a701f541cfe_b.jpg)

我们的场景太简单, 区分这两种方法是比较难的。但你应该能够注意到视觉上的一些差异:  
1. 阴影部分少了  
2. 大球和小球都变亮了  
这些变化都是由散射光线的单位规整化引起的, 现在更少的光线会朝着发现方向散射。对于漫发射的物体来说, 他们会变得更亮。因为更多光线朝着摄像机反射。对于阴影部分来说, 更少的光线朝上反射, 所以小球下方的大球区域会变得更加明亮。  
这本书很长一段时间都采用的是先前的版本, 直到后来有一天大家发现它其实只是理想 lambertian 漫发射的近似, 其并不正确。这个错误在本书中留存了那么长时间, 主要是因为:  
1. 概率分布的数学证明算错了  
2. 视觉上来说, 并不能直接看出 $\cos (\phi)$ 的概率分配是我们所需要的  
因为大家日常生活中的物体都是发生了完美的漫反射, 所以我们很难养成对光照下物体是如何表现的视觉直觉。  
为了便于大家理解, 简单来说两种方法都选取了一个随机方向的向量, 不过一种是从单位球体内取的, 其长度是随机的, 另一种是从单位球面上取的, 长度固定为单位向量长度。为什么要采取单位球面并不是能很直观的一眼看出。  
另一种具有启发性的方法是, 直接从入射点开始选取一个随机的方向, 然后再判断是否在法向量所在的那个半球。在使用 lambertian 漫发射模型前, 早期的光线追踪论文中大部分使用的都是这个方法:

```
//vec3.h
vec3 random_in_hemisphere(const vec3& normal) {
    vec3 in_unit_sphere = random_in_unit_sphere();
    if (dot(in_unit_sphere, normal) > 0.0) // In the same hemisphere as the normal
        return in_unit_sphere;
    else
        return -in_unit_sphere;
}
```

将我们的新函数套入 ray_color() 函数:

```
//vec3.h
vec3 ray_color(const ray& r, const hittable& world, int depth) {
    hit_record rec;

    // If we've exceeded the ray bounce limit, no more light is gathered.
    if (depth <= 0)
        return vec3(0,0,0);

    if (world.hit(r, 0.001, infinity, rec)) {
        vec3 target = rec.p + random_in_hemisphere(rec.normal);
        return 0.5 * ray_color(ray(rec.p, target - rec.p), world, depth-1);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

我们会得到如下的图片:

![](https://pic4.zhimg.com/v2-733c6ea8353952f6f50e33a1990c8a67_b.jpg)

我们的场景会随着本书的深入会变得越来越复杂。这里鼓励大家在之后都试一下这几种不同的漫反射渲染法。大多数场景都会有许多的漫反射材质。你可以从中培养出你对这几种方法的敏感程度。

## 9. 金属材质

如果我们想让不同的物体能拥有不同的材质, 我们又面临着一个设计上的抉择。我们可以设计一个宇宙无敌大材质, 这个材质里面有数不胜数的参数和材质类型可供选择。这样其实也不错, 但我们还可以设计并封装一个抽象的材质类。我反正喜欢后面一种, 对于我们的程序来说, 一个材质类应该封装两个功能进去:  
1. 生成散射后的光线 (或者说它吸收了入射光线)  
2. 如果发生散射, 决定光线会变暗多少 (attenuate)  
下面来看一下这个抽象类:

```
//material.h
class material {
    public:
        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const = 0;
};
```

我们在函数中使用 hit_record 作为传入参数, 就可以不用传入一大堆变量了。当然如果你想传一堆变量进去的话也行。这也是个人喜好。当然物体和材质还要能够联系在一起。在 C++ 中你只要告诉编译器, 我们在 `hit_record` 里面存了个材质的指针。

```
//hittable.h
#ifndef HITTABLE_H
#define HITTABLE_H

#include "rtweekend.h"

class material;

struct hit_record {
    vec3 p;
    vec3 normal;
    shared_ptr<material> mat_ptr;
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

光线会如何与表面交互是由具体的材质所决定的。hit_record 在设计上就是为了把一堆要传的参数给打包在了一起。当光线射入一个表面 (比如一个球体), hit_record 中的材质指针会被球体的材质指针所赋值, 而球体的材质指针是在 main() 函数中构造时传入的。当 color()函数获取到 hit_record 时, 他可以找到这个材质的指针, 然后由材质的函数来决定光线是否发生散射, 怎么散射。

所以我们必须在球体的构造函数和变量区域中加入材质指针, 以便之后传给 `hit_record`。见下面的代码:

```
class sphere: public hittable {
    public:
        sphere() {}
+        sphere(vec3 cen, double r, shared_ptr<material> m)
+            : center(cen), radius(r), mat_ptr(m) {};

        virtual bool hit(const ray& r, double tmin, double tmax, hit_record& rec) const;

    public:
        vec3 center;
        double radius;
+        shared_ptr<material> mat_ptr;
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
            vec3 outward_normal = (rec.p - center) / radius;
            rec.set_face_normal(r, outward_normal);
            rec.mat_ptr = mat_ptr;
            return true;
        }
        temp = (-half_b + root) / a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = r.at(rec.t);
            vec3 outward_normal = (rec.p - center) / radius;                
            rec.set_face_normal(r, outward_normal);
+            rec.mat_ptr = mat_ptr;
            return true;
        }
    }
    return false;
}
```

对于我们之前写过的 Lambertian(漫反射)材质来说, 这里有两种理解方法, 要么是光线永远发生散射, 每次散射衰减至 R, 要么是光线并不衰减, 转而物体吸收 (1-R) 的光线。你也可以当成是这两种的结合。于是我们可以写出 Lambertian 的材质类:

```
//material.h
class lambertian : public material {
    public:
        lambertian(const vec3& a) : albedo(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            vec3 scatter_direction = rec.normal + random_unit_vector();
            scattered = ray(rec.p, scatter_direction);
            attenuation = albedo;
            return true;
        }

    public:
        vec3 albedo;
};
```

注意我们也可以让光线根据一定的概率 p 发生散射【译注: 若判断没有散射, 光线直接消失】, 并使光线的衰减率 (代码中的 attenuation) 为 $albedo/p$ 。随你的喜好来。  
对于光滑的金属材质来说, 光线是不会像漫反射那样随机散射的, 而是产生反射。关键是: 对于一个金属状的镜子, 光线具体是怎么反射的呢? 向量数学是我们的好朋友:  

![](https://pic3.zhimg.com/v2-8029e9a049925eeec08d6884d44de012_r.jpg)

  
反射方向的向量如图所示为 $\vec{V}+2\vec{B}$ , 其中我们规定向量 $\vec{N}$ 是单位向量, 但 $\vec{V}$ 不一定是。向量 B 的长度应为 $\vec{V}\cdot\vec{N}$ , 因为向量 $\vec{V}$ 与向量 $\vec{N}$ 的方向相反, 这里我们需要再加上一个负号, 于是有:

```
//vec3.h
vec3 reflect(const vec3& v, const vec3& n) {
    return v - 2*dot(v,n)*n;
}
```

金属材质使用上面的公式来计算反射方向:

```
//material.h
class metal : public material {
    public:
        metal(const vec3& a) : albedo(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            vec3 reflected = reflect(unit_vector(r_in.direction()), rec.normal);
            scattered = ray(rec.p, reflected);
            attenuation = albedo;
            return (dot(scattered.direction(), rec.normal) > 0);
        }

    public:
        vec3 albedo;
};
```

我们还需要修改一下 color 函数:

```
//main.cc
vec3 ray_color(const ray& r, const hittable& world, int depth) {
    hit_record rec;

    // If we've exceeded the ray bounce limit, no more light is gathered.
    if (depth <= 0)
        return vec3(0,0,0);

    if (world.hit(r, 0.001, infinity, rec)) {
        ray scattered;
        vec3 attenuation;
        if (rec.mat_ptr->scatter(r, rec, attenuation, scattered))
            return attenuation * ray_color(scattered, world, depth-1);
        return vec3(0,0,0);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto t = 0.5*(unit_direction.y() + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}
```

现在我们给场景加入一些金属球:

```
//main.cc
int main() {
    const int image_width = 200;
    const int image_height = 100;
    const int samples_per_pixel = 100;
    const int max_depth = 50;

    std::cout << "P3\n" << image_width << " " << image_height << "\n255\n";

    hittable_list world;

    world.add(make_shared<sphere>(
        vec3(0,0,-1), 0.5, make_shared<lambertian>(vec3(0.7, 0.3, 0.3))));

    world.add(make_shared<sphere>(
        vec3(0,-100.5,-1), 100, make_shared<lambertian>(vec3(0.8, 0.8, 0.0))));

    world.add(make_shared<sphere>(vec3(1,0,-1), 0.5, make_shared<metal>(vec3(0.8, 0.6, 0.2))));
    world.add(make_shared<sphere>(vec3(-1,0,-1), 0.5, make_shared<metal>(vec3(0.8, 0.8, 0.8))));

    camera cam;
    for (int j = image_height-1; j >= 0; --j) {
        std::cerr << "\rScanlines remaining: " << j << ' ' << std::flush;
        for (int i = 0; i < image_width; ++i) {
            vec3 color(0, 0, 0);
            for (int s = 0; s < samples_per_pixel; ++s) {
                auto u = (i + random_double()) / image_width;
                auto v = (j + random_double()) / image_height;
                ray r = cam.get_ray(u, v);
                color += ray_color(r, world, max_depth);
            }
            color.write_color(std::cout, samples_per_pixel);
        }
    }

    std::cerr << "\nDone.\n";
}
```

我们就能得到这样的图片:

![](https://pic1.zhimg.com/v2-02f0718b49ea2f298ca637e70f1e2ae4_b.jpg)

我们还可以给反射方向加入一点点随机性, 只要在算出反射向量后, 在其终点为球心的球内随机选取一个点作为最终的终点:  
当然这个球越大, 金属看上去就更加模糊 (fuzzy, 或者说粗糙)。所以我们这里引入一个变量来表示模糊的程度 (fuzziness)(所以当 fuzz=0 时不会产生模糊)。如果 fuzz, 也就是随机球的半径很大, 光线可能会散射到物体内部去。这时候我们可以认为物体吸收了光线。

```
//material.h
class metal : public material {
    public:
        metal(const vec3& a, double f) : albedo(a), fuzz(f < 1 ? f : 1) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            vec3 reflected = reflect(unit_vector(r_in.direction()), rec.normal);
            scattered = ray(rec.p, reflected + fuzz*random_in_unit_sphere());
            attenuation = albedo;
            return (dot(scattered.direction(), rec.normal) > 0);//dot<0我们认为吸收
        }

    public:
        vec3 albedo;
        double fuzz;
};
```

我们可以将模糊值设置为 0.3 和 1.0, 图片会变成这样:

![](https://pic4.zhimg.com/v2-e362c4148c81abe70ebefa2d089c3eef_b.jpg)

## 10. 绝缘体材质

透明的材料, 例如水, 玻璃, 和钻石都是绝缘体。当光线击中这类材料时, 一条光线会分成两条, 一条发生反射, 一条发生折射。我们会采取这样的策略: 每次光线与物体相交时, 要么反射要么折射, 一次只发生一种情况, 随机选取。反正最后采样次数多, 会给这些结果取个平均值。  
折射部分是最难去 debug 的部分。我常常一开始让所有的光线只发生折射来调试。在这个项目中, 我加入了两个这样的玻璃球, 并且得到下图 (我还没教你怎么弄出这样的玻璃球, 你先往下读, 一会儿你就知道了):

![](https://pic3.zhimg.com/v2-e61f5ce6422cdb6fd13190900fc30896_b.jpg)

这图看上去是对的么? 玻璃球在现实世界中看上去和这差不多。但是, 其实这图不对。玻璃球应该会翻转上下, 也不会有这种奇怪的黑圈。我输出了图片中心的一条光线来 debug, 发现它完全错了, 你调试的时候也可以这样来。  
折射法则是由 Snell 法则定义的:

 $\eta \cdot \sin\theta = \eta' \cdot \sin\theta'$

$\theta$ 与 $\theta'$ 是入射光线与折射光线距离法相的夹角, $\eta$ 与 $\eta'$ (读作 eta 和 eta prime) 是介质的折射率 (规定空气为 1.0, 玻璃为 1.3-1.7, 钻石为 2.4), 如图:

![](https://pic1.zhimg.com/v2-4f08d1085c6bc318a23e135512b6def0_r.jpg)

为了解出折射光线的方向, 我们需要解出 $\sin\theta$ :

 $\sin\theta' = \frac{\eta}{\eta'} \cdot \sin\theta$

在折射介质部分有射线光线 $\mathbf{R'}$ 与法向量 $\mathbf{N'}$ , 它们的夹角为 $\theta'$ 。我们可以把光线 $\mathbf{R'}$ 分解成垂直和水平与法向量 $\mathbf{N'}$ 的两个向量:

$\mathbf{R'} = \mathbf{R'}_{\parallel} + \mathbf{R'}_{\bot}$

如果要解出这两个向量, 有:

$\mathbf{R'}_{\parallel} = \frac{\eta}{\eta'} (\mathbf{R} + \cos\theta \mathbf{N})$

$\mathbf{R'}_{\bot} = -\sqrt{1 - |\mathbf{R'}_{\parallel}|^2} \mathbf{N}$

你可以自己推导, 证明。我们这里先直接拿来当结论用了。这本书有些别的地方也是, 并不需要你完全会证明。【译注: 自己推推也没坏处】

然后我们来解 $\cos\theta$ , 下面是著名的点乘的公式定义:

$\mathbf{A} \cdot \mathbf{B} = |\mathbf{A}| |\mathbf{B}| \cos\theta$

如果我们将 $\mathbf{A}$ 与 $\mathbf{B}$ 归一化为单位向量:

$\mathbf{A} \cdot \mathbf{B} = \cos\theta$

于是我们可以这样表达垂直的那个向量:

$\mathbf{R'}_{\parallel} = \frac{\eta}{\eta'} (\mathbf{R} + (\mathbf{-R} \cdot \mathbf{N}) \mathbf{N})$

根据上述公式, 我们就能写出计算折射光线 $\mathbf{R'}$ 的函数:

```
//vec3.h
vec3 refract(const vec3& uv, const vec3& n, double etai_over_etat) {
    auto cos_theta = dot(-uv, n);
    vec3 r_out_parallel =  etai_over_etat * (uv + cos_theta*n);
    vec3 r_out_perp = -sqrt(1.0 - r_out_parallel.length_squared()) * n;
    return r_out_parallel + r_out_perp;
}
```

一个只会发生折射的绝缘体材质为:

```
//material.h
class dielectric : public material {
    public:
        dielectric(double ri) : ref_idx(ri) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            attenuation = vec3(1.0, 1.0, 1.0);
            double etai_over_etat;
            if (rec.front_face) {
                etai_over_etat = 1.0 / ref_idx;
            } else {
                etai_over_etat = ref_idx;
            }

            vec3 unit_direction = unit_vector(r_in.direction());
            vec3 refracted = refract(unit_direction, rec.normal, etai_over_etat);
            scattered = ray(rec.p, refracted);
            return true;
        }

        double ref_idx;
};
```

![](https://pic4.zhimg.com/v2-368925cc729af1d7d580d5b92fc8f2e3_b.jpg)

现在看上去图好像不太对, 这是因为当光线从高折射律介质射入低折射率介质时, 对于上述的 Snell 方程可能没有实解【 $\sin\theta>1$ 】。这时候就不会发生折射, 所以就会出现许多小黑点。我们回头看一下 snell 法则的式子:

$\sin\theta' = \frac{\eta}{\eta'} \cdot \sin\theta$

如果光线从玻璃 ( $\eta = 1.5$ ) 射入空气 ( $\eta = 1.0$ )

$\sin\theta' = \frac{1.5}{1.0} \cdot \sin\theta$

又因为 $\sin\theta'$ 是不可能比 1 大的, 所以一旦这种情况发生了:

 $\frac{1.5}{1.0} \cdot \sin\theta > 1.0$

那就完蛋了, 方程无解了。所以我们认为光线无法发生折射的时候, 他发生了反射:

```
//material.h
if(etai_over_etat * sin_theta > 1.0) {
    // Must Reflect
    ...
}
else {
    // Can Refract
    ...
}
```

这里所有的光线都不发生折射, 转而发生了反射。因为这种情况常常在实心物体的内部发生, 所以我们称这种情况被称为 "全内反射"。这也当你浸入水中时, 你发现水与空气的交界处看上去像一面镜子的原因。  
我们可以用三角函数解出 sin_theta

$\sin\theta = \sqrt{1 - \cos^2\theta}$

其中的 cos_theta 为  
$\cos\theta = \mathbf{R} \cdot \mathbf{N}$

```
//material.h
double cos_theta = ffmin(dot(-unit_direction, rec.normal), 1.0);
double sin_theta = sqrt(1.0 - cos_theta*cos_theta);
if(etai_over_etat * sin_theta > 1.0) {
    // Must Reflect
    ...
}
else {
    // Can Refract
    ...
}
```

一个在可以偏折的情况下总是偏折, 其余情况发生反射的绝缘体材质为:

```
//material.h
class dielectric : public material {
    public:
        dielectric(double ri) : ref_idx(ri) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            attenuation = vec3(1.0, 1.0, 1.0);
            double etai_over_etat = (rec.front_face) ? (1.0 / ref_idx) : (ref_idx);

            vec3 unit_direction = unit_vector(r_in.direction());
            double cos_theta = ffmin(dot(-unit_direction, rec.normal), 1.0);
            double sin_theta = sqrt(1.0 - cos_theta*cos_theta);
            if (etai_over_etat * sin_theta > 1.0 ) {
                vec3 reflected = reflect(unit_direction, rec.normal);
                scattered = ray(rec.p, reflected);
                return true;
            }

            vec3 refracted = refract(unit_direction, rec.normal, etai_over_etat);
            scattered = ray(rec.p, refracted);
            return true;
        }

    public:
        double ref_idx;
};
```

这里的光线衰减率为 1——就是不衰减, 玻璃表面不吸收光的能量。如果我们使用下面的参数:

```
main.cc
world.add(make_shared<sphere>(
    vec3(0,0,-1), 0.5, make_shared<lambertian>(vec3(0.1, 0.2, 0.5))));

world.add(make_shared<sphere>(
    vec3(0,-100.5,-1), 100, make_shared<lambertian>(vec3(0.8, 0.8, 0.0))));

world.add(make_shared<sphere>(vec3(1,0,-1), 0.5, make_shared<metal>(vec3(0.8, 0.6, 0.2), 0.0)));
world.add(make_shared<sphere>(vec3(-1,0,-1), 0.5, make_shared<dielectric>(1.5)));
```

我们会得到:

![](https://pic2.zhimg.com/v2-7484d6b5ddb4744f741747ac725e7749_b.jpg)

现实世界中的玻璃, 发生折射的概率会随着入射角而改变——从一个很狭窄的角度去看玻璃窗, 它会变成一面镜子。这个式子又丑又长, 好在我们有个数学上近似的等式, 它是由 Christophe Schlick 提出的:

```
double schlick(double cosine, double ref_idx) {
    auto r0 = (1-ref_idx) / (1+ref_idx);
    r0 = r0*r0;
    return r0 + (1-r0)*pow((1 - cosine),5);
}
```

下面就是我们完整版的玻璃材质:

```
//material.h
class dielectric : public material {
    public:
        dielectric(double ri) : ref_idx(ri) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            attenuation = vec3(1.0, 1.0, 1.0);
            double etai_over_etat = (rec.front_face) ? (1.0 / ref_idx) : (ref_idx);

            vec3 unit_direction = unit_vector(r_in.direction());
            double cos_theta = ffmin(dot(-unit_direction, rec.normal), 1.0);
            double sin_theta = sqrt(1.0 - cos_theta*cos_theta);
            if (etai_over_etat * sin_theta > 1.0 ) {
                vec3 reflected = reflect(unit_direction, rec.normal);
                scattered = ray(rec.p, reflected);
                return true;
            }
            double reflect_prob = schlick(cos_theta, etai_over_etat);
            if (random_double() < reflect_prob)
            {
                vec3 reflected = reflect(unit_direction, rec.normal);
                scattered = ray(rec.p, reflected);
                return true;
            }
            vec3 refracted = refract(unit_direction, rec.normal, etai_over_etat);
            scattered = ray(rec.p, refracted);
            return true;
        }

    public:
        double ref_idx;
};
```

这里有个简单又好用的 trick, 如果你将球的半径设为负值, 形状看上去并没什么变化, 但是法相全都翻转到内部去了。所以就可以用这个特性来做出一个通透的玻璃球:【把一个小球套在大球里, 光线发生两次折射, 于是负负得正, 上下不会颠倒】

```
world.add(make_shared<sphere>(vec3(0,0,-1), 0.5, make_shared<lambertian>(vec3(0.1, 0.2, 0.5))));
world.add(make_shared<sphere>(
    vec3(0,-100.5,-1), 100, make_shared<lambertian>(vec3(0.8, 0.8, 0.0))));
world.add(make_shared<sphere>(vec3(1,0,-1), 0.5, make_shared<metal>(vec3(0.8, 0.6, 0.2), 0.3)));
world.add(make_shared<sphere>(vec3(-1,0,-1), 0.5, make_shared<dielectric>(1.5)));
world.add(make_shared<sphere>(vec3(-1,0,-1), -0.45, make_shared<dielectric>(1.5)));
```

就有:

![](https://pic1.zhimg.com/v2-1c249bd477ba8b2aeb5f49d845486fbc_b.jpg)

## 11. 可自定义位置的摄像机

摄像机总是和绝缘体一样难以 debug。所以我总是一步步搭建我的摄像机类。首先, 我们使摄像机能调整其视野范围 (field of view, fov)。fov 是你的视角。因为我们的图片不是方的, 所以垂直和水平的 fov 值是不同的。我总是使用垂直方向的 fov。并且我总是使用角度制来传参, 在构造函数中再将其转化为弧度——这也是我的个人喜好。  
首先我让射线从原点射向 $z=-1$ 平面。我们当然也可以让其射向 $z=-2$ 的平面, 或者其他的什么值都行, 反正 h 和这个距离 d 是成比例的。

![](https://pic1.zhimg.com/v2-d8f93c297ec72b9e072535b4f6dcb9c8_b.jpg)

显然, $h = \tan(\frac{\theta}{2})$ 。我们的摄像机类现在变成:

```
//camera.h
class camera {
    public:
        camera(
            double vfov, // top to bottom, in degrees
            double aspect
        ) {
            origin = vec3(0.0, 0.0, 0.0);

            auto theta = degrees_to_radians(vfov);
            auto half_height = tan(theta/2);
            auto half_width = aspect * half_height;

            lower_left_corner = vec3(-half_width, -half_height, -1.0);

            horizontal = vec3(2*half_width, 0.0, 0.0);
            vertical = vec3(0.0, 2*half_height, 0.0);
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
```

当我们使用一个 cam(90, double(image_width)/image_height) 的摄像机去拍下面的球:

```
auto R = cos(pi/4);
hittable_list world;
world.add(make_shared<sphere>(vec3(-R,0,-1), R, make_shared<lambertian>(vec3(0, 0, 1))));
world.add(make_shared<sphere>(vec3( R,0,-1), R, make_shared<lambertian>(vec3(1, 0, 0))));
```

我们会得到:

![](https://pic4.zhimg.com/v2-a5ee444b1b746b41d932c4fc403d6ee3_b.jpg)

为了能将我们的摄像机设置在任意位置, 我们先来给这个位置点起个名字。我们管摄像机所在的这个位置叫做 lookfrom, 我们看向的点叫做 lookat(如果你不想用世界坐标下的点, 想用向量来表示这个方向的话也完全 ok)。  
我们还需要一个变量去描述摄像机的倾斜程度, 或者说摄像机绕着轴 lookfrom - lookat 旋转的角度【想象下图中红色平面绕这个轴旋转】。就好比你站直了, 但是你的头还是可以左右转动。为了去描述这个倾斜程度, 我们需要一个向量来指定摄像机坐标系的正上方方向 (up vector)。这里注意: 这个向量就在视线方向正交投影过来的那个平面上:

![](https://pic3.zhimg.com/v2-aade90f2e3cab80e0d37eb824e87d602_r.jpg)

我们可以使用任意的方向向量, 将其投影到上图的平面中来获得摄像机的 up vector。我这里给他起名叫 vup 向量。经过一系列的点乘操作, 我们会有完整的 u,v,w 三个向量来描述摄像机的旋向【这里要结合着代码看与下面的图片看】。

![](https://pic4.zhimg.com/v2-c981ba8338f9688cc36c7f0e4a8861eb_r.jpg)

注意 vup, v, w 处于同一平面内。和先前我们的摄像机面对着 - Z 方向一样, 修改后的任意视角摄像机面对着 - w 方向。记得使用世界坐标系的上方向向量 (0,1,0)(不是一定要用这个向量) 指定 vup。这样会比较方便, 并且你的摄像机镜头会保持水平。如果你想试试那些奇怪的摄像角度, 你可以放心大胆的传入别的值。

```
class camera {
    public:
        camera(
            vec3 lookfrom, vec3 lookat, vec3 vup,
            double vfov, // top to bottom, in degrees
            double aspect
        ) {
            origin = lookfrom;
            vec3 u, v, w;

            auto theta = degrees_to_radians(vfov);
            auto half_height = tan(theta/2);
            auto half_width = aspect * half_height;
            w = unit_vector(lookfrom - lookat);
            u = unit_vector(cross(vup, w));
            v = cross(w, u);

            lower_left_corner = origin - half_width*u - half_height*v - w;

            horizontal = 2*half_width*u;
            vertical = 2*half_height*v;
        }

        ray get_ray(double s, double t) {
            return ray(origin, lower_left_corner + s*horizontal + t*vertical - origin);
        }

    public:
        vec3 origin;
        vec3 lower_left_corner;
        vec3 horizontal;
        vec3 vertical;
};
```

现在我们就可以改变我们的视角了:

```
//main.cc
const auto aspect_ratio = double(image_width) / image_height;
...
camera cam(vec3(-2,2,1), vec3(0,0,-1), vup, 90, aspect_ratio);
```

我们会得到:  

![](https://pic4.zhimg.com/v2-3a76513e86c48fc03887ee41abb03b53_b.jpg)

然后我们在改变一下 fov:【这里缩小了 fov】  

![](https://pic1.zhimg.com/v2-3b1f9d7c41cfdf7c32c4452f82e80d48_b.jpg)

## 12. 散焦模糊

终于到了我们最后的特性了: 散焦模糊 (defocus blur)。基本上所有的摄影师都它叫景深 (depth of field)。所以你和你朋友聊天的时候可别提什么 defocus blur 啊。

现实世界中的摄像机产生对焦模糊的原因是因为他们需要一个很大的孔, 而不是一个针眼大小的小孔来聚集光线。这会导致所有的东西都被散焦了。但如果我们在孔内加入一块透镜, 在一段距离内的所有物体都会被对焦。你可以这样来想象透镜: 所有的光线从同一点分散射出, 击中透镜后又聚焦在图像传感器上的一个点上。  
在现实世界中的相机中, 物体在哪里被聚焦是由透镜距离成像平面与聚焦平面这两个平面的距离所决定的。当你改变对焦设置时, 相机中的这个透镜位置就会发生改变 (你手机上的摄像头也是这个原理, 只不过透镜不动, 改成了成像传感器动)。快门光圈(aperture) 是一个孔, 它控制这块透镜应该多大比较好。如果你需要更多的光线, 你的这个快门光圈就大一点, 景深也会随之加大。对于一个虚拟的摄像机来说, 我们只需要一个传感器就够了。所以我们只需要传入快门光圈的大小就行【即透镜大小】。

现实世界中的摄像机的透镜组是很复杂的。但对于我们写代码来说, 我们只需要模拟上述的顺序: 图像传感器, 透镜, 快门, 然后射出光线, 最后记得翻转图片 (进过透镜成像会被上下翻转)。图形学中人们常常使用一块薄片透镜近似模拟:

![](https://pic3.zhimg.com/v2-08cf2fde8d40da8c84f80f9fec833a0e_r.jpg)

但是我们根本不用模拟任何摄像机内部的东西, 对于我们渲染摄像机外的物体来说, 这些都没必要。我们只要从一个虚拟的透镜范围中发射光线到我们的摄像机平面就能模拟了, 这个透镜与平面的距离成为焦距 (focus_dist)

![](https://pic3.zhimg.com/v2-5d7653d4521c1fff2fde0d4195a0caaa_r.jpg)

之前我们所有的光线都是从 lookfrom 发出的, 但现在加入了散焦模糊, 所有光线都从内部的一个虚拟透镜发出, 经过 lookfrom 点, 这个透镜的半径越大, 图像就越模糊。你可以认为之前的摄像机, 这个半径为 0。

```
//vec3.h 从一个单位小圆盘射出光线
vec3 random_in_unit_disk() {
    while (true) {
        auto p = vec3(random_double(-1,1), random_double(-1,1), 0);
        if (p.length_squared() >= 1) continue;
        return p;
    }
}
```

下面给出完整的 camera 类

```
class camera {
    public:
        camera(
            vec3 lookfrom, vec3 lookat, vec3 vup,
            double vfov, // top to bottom, in degrees
            double aspect, double aperture, double focus_dist
        ) {
            origin = lookfrom;
            lens_radius = aperture / 2;

            auto theta = degrees_to_radians(vfov);
            auto half_height = tan(theta/2);
            auto half_width = aspect * half_height;

            w = unit_vector(lookfrom - lookat);
            u = unit_vector(cross(vup, w));
            v = cross(w, u);
            lower_left_corner = origin
                              - half_width * focus_dist * u
                              - half_height * focus_dist * v
                              - focus_dist * w;

            horizontal = 2*half_width*focus_dist*u;
            vertical = 2*half_height*focus_dist*v;
        }

        ray get_ray(double s, double t) {
            vec3 rd = lens_radius * random_in_unit_disk();
            vec3 offset = u * rd.x() + v * rd.y();

            return ray(
                origin + offset,
                lower_left_corner + s*horizontal + t*vertical - origin - offset
           );
        }

    public:
        vec3 origin;
        vec3 lower_left_corner;
        vec3 horizontal;
        vec3 vertical;
        vec3 u, v, w;
        double lens_radius;
};
```

我们使用一个大大的快门光圈:

```
//main.cc
const auto aspect_ratio = double(image_width) / image_height;
...
vec3 lookfrom(3,3,2);
vec3 lookat(0,0,-1);
vec3 vup(0,1,0);
auto dist_to_focus = (lookfrom-lookat).length();
auto aperture = 2.0;

camera cam(lookfrom, lookat, vup, 20, aspect_ratio, aperture, dist_to_focus);
```

就有:

![](https://pic3.zhimg.com/v2-8d5daba641a0c74f8af90cd9b47f9e42_b.jpg)

## 13. 接下来学什么？

首先我们把书的封面图——许多许多的随机球渲染出来:

```
//main.cc
hittable_list random_scene() {
    hittable_list world;

    world.add(make_shared<sphere>(
        vec3(0,-1000,0), 1000, make_shared<lambertian>(vec3(0.5, 0.5, 0.5))));

    int i = 1;
    for (int a = -11; a < 11; a++) {
        for (int b = -11; b < 11; b++) {
            auto choose_mat = random_double();
            vec3 center(a + 0.9*random_double(), 0.2, b + 0.9*random_double());
            if ((center - vec3(4, 0.2, 0)).length() > 0.9) {
                if (choose_mat < 0.8) {
                    // diffuse
                    auto albedo = vec3::random() * vec3::random();
                    world.add(
                        make_shared<sphere>(center, 0.2, make_shared<lambertian>(albedo)));
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

    world.add(
        make_shared<sphere>(vec3(-4, 1, 0), 1.0, make_shared<lambertian>(vec3(0.4, 0.2, 0.1))));

    world.add(
        make_shared<sphere>(vec3(4, 1, 0), 1.0, make_shared<metal>(vec3(0.7, 0.6, 0.5), 0.0)));

    return world;
}

int main() {
    ...
    auto world = random_scene();

    vec3 lookfrom(13,2,3);
    vec3 lookat(0,0,0);
    vec3 vup(0,1,0);
    auto dist_to_focus = 10.0;
    auto aperture = 0.1;

    camera cam(lookfrom, lookat, vup, 20, aspect_ratio, aperture, dist_to_focus);
    ...
}
```

我们会得到:

![](https://pic2.zhimg.com/v2-7483e528431ca10622ddd31ce8ebbba9_r.jpg)

你可能会发现玻璃球没有阴影, 使得他们看上去像漂浮在空中似得。这不是 bug(你在现实世界中很少有机会见到真正的玻璃球, 它们看起来的确就是这样的)。玻璃球下的那个作为地板的大球仍然能被那么多光线击中, 因为光线并不会被玻璃球阻挡，经由玻璃球的折射最终射向天空【the sky is re-ordered rather than blocked. 感谢评论区

[@Kanichiyaoba](https://www.zhihu.com/people/856b6df519cc357183c37adbab3dc988)

的翻译解答】。

现在你拥有一个 coooool 毙了的光线追踪器了! 那接下来我该何去何从呢?【标 * 为

[下本书](https://oxine.github.io/Graphic/Ray-tracing-the-next-week/)

中的内容】

1. 光照。你可以使用阴影光线来显式实现这部分, 也可以使用产生光线的材质来隐式实现 *。

2. 偏移散射光线, 然后降低这些光线的权重来消除偏移。这两种都行。硬要说的话, 我偏向后者一点点。【我猜这句话是在说消除自相交所导致的阴影 即 Shadow Ance, 如果有人知道这是在说什么请教教我吧！】

3. 加入三角形。大部分模型都是三角网格。模型的 IO 部分是最恶心的, 基本上所有人都不想自己写, 都去找别人的代码用。

4. 表面纹理 *。这可以让你像贴墙纸一样把图片贴到物体上去。实现起来也很简单。

5. 固体纹理 *。可以参见 Ken Perlin 的在线代码, Andrew Kensler 的 blog 中也有关于这部分的信息。

6. 体积体 (volumes 即雾等)* 与其他介质。很 Cool, 但是会改变你的代码构筑。我喜欢把体积体也设计成 hittable 的子类, 根据其密度来随机决定光线是否与其相交。使用这个方法, 你的渲染器甚至不用知道你渲的是体积体就渲出来了。

7. 并行优化。使用不同的随机种子, 把你的代码复制上 N 份跑在 N 个核心上, 然后再求平均值。你可以分层来完成这部分工作, 比如分成 N/2 对, 每次平均求出 N/4 的图片, 然后在对这些对之间求平均值。这应该用不了多少代码【

[试试 CUDA 吧](https://devblogs.nvidia.com/accelerated-ray-tracing-cuda/)

】。

记得把你渲染出的炫酷图片发给我! 祝你愉快!