书接上文：

[陈泽日天：Ray Tracing: The Next Week V3.0 中文翻译（上）](https://zhuanlan.zhihu.com/p/129372723)

## **6. 图片纹理映射（贴图）**

我们之前使用射入点 p 来映射 (原文 to index) 类似大理石那样程序生成的纹理。我们也能读取一张图片, 并将一个 2D $(u,v)$ 的坐标系映射在图片上。  
使用 $(u,v)$ 坐标的一个直接的想法是将 u 与 v 调整比例后取整, 然后将其对应到像素坐标 $(i,j)$ 上, 这很糟糕, 因为这样每次图片分辨率发生变化时, 我们都要修改代码。所以相对的, 图形学界中广泛认可的非官方标准之一是采用纹理坐标系代替图像坐标系。即使用 $[0,1]$ 的小数来表示图像中的位置。举例来说, 对于一张宽度为 $N_x$ 高度为 $N_y$ 的图像中的像素 $(i,j)$ , 其像素坐标系下的坐标为:

 $u = \frac{i}{N_x-1}$

$v = \frac{j}{N_y-1}$

对于一个 `hittable` 来说, 我们还需要在 `hit record` 中加入 u 和 v 的记录。对于椭圆来说, uv 的计算是基于经度和纬度的的, 换句话说, 是基于球面坐标的。所以当我们有一个球面坐标 $(\theta,\phi)$ ， 我们只需要按比例转化一下就能得到 uv 坐标。如果 $\theta$ 是朝下距离极轴的角度, $\phi$ 是绕极轴旋转的角度, 将其映射到 $[0,1]$ 的过程为:

$u = \frac{\phi}{2\pi}$

$v = \frac{\theta}{\pi}$

为了计算 $\theta$ 和 $\phi$ , 对于任意给出的球面上的射入点, 将球面坐标系转化为直角坐标系的方程为:

 $x = \cos(\phi) \cos(\theta)$

 $y = \sin(\phi) \cos(\theta)$

$z = \sin(\theta)$

我们现在只要把它倒过来就行, 因为我们可爱的 `<cmath>` 库函数 `atan2()` 的关系, 给出任意一个角度的 sine 和 cosine 值, 我们就能得到这个角的角度值。 所以我们可以像这样传入 x, y 的值 ( $\sin(\theta)$ 与 $\cos(\theta)$ 相除抵消得到 $\tan(\theta)$ ):

 $\phi = \text{atan2}(y, x)$

atan2 函数的返回值范围为 $-\pi$ 到 $\pi$ _【译注: 即返回弧度 (radius)】_所以我们这里还要小心一下。

相对的, 求角 $\theta$ 更为简单直接:

$\theta = \text{asin}(z)$

函数返回值范围为 $-\pi/2$ 到 $\pi/2$

所以对于一个球体来说, $(u,v)$ 坐标的计算是由一个工具函数完成的, 该函数假定输入参数为单位圆上的点, 所以我们传入参数时需要注意一下:

```
//sphere.h , in function hit
get_sphere_uv((rec.p-center)/radius, rec.u, rec.v);
```

工具函数的具体实现为:

```
//sphere.h
void get_sphere_uv(const vec3& p, double& u, double& v) {
    auto phi = atan2(p.z(), p.x());
    auto theta = asin(p.y());
    u = 1-(phi + pi) / (2*pi);
    v = (theta + pi/2) / pi;
}
```

现在我们还需要新建一个 texture 类来存放图片。我现在将使用我最喜欢的图像工具库 [stb_image.h](https://github.com/nothings/stb/blob/master/stb_image.h)。它将图片信息读入一个无符号字符类型 (unsigned char) 的大数组中。unsigned char(8bit, 0~255)的值即为 RGBs 中表示明暗的 0~255。

```
#include "texture.h"

class image_texture : public texture {
    public:
        image_texture() {}
        image_texture(unsigned char *pixels, int A, int B)
            : data(pixels), nx(A), ny(B) {}

        ~image_texture() {
            delete data;
        }

        virtual vec3 value(double u, double v, const vec3& p) const {
            // If we have no texture data, then always emit cyan (as a debugging aid).
            if (data == nullptr)
                return vec3(0,1,1);

            auto i = static_cast<int>((  u)*nx);
            auto j = static_cast<int>((1-v)*ny-0.001);

            if (i < 0) i = 0;
            if (j < 0) j = 0;
            if (i > nx-1) i = nx-1;
            if (j > ny-1) j = ny-1;

            auto r = static_cast<int>(data[3*i + 3*nx*j+0]) / 255.0;
            auto g = static_cast<int>(data[3*i + 3*nx*j+1]) / 255.0;
            auto b = static_cast<int>(data[3*i + 3*nx*j+2]) / 255.0;

            return vec3(r, g, b);
        }

    public:
        unsigned char *data;
        int nx, ny;
};
```

使用这样的数组来储存图像十分的基础。感谢 [stb_image.h](https://github.com/nothings/stb/blob/master/stb_image.h), 导入图片变得异常简单, 只需在 `main.cc` 中包含函数头 `stb_image.h`:

```
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
```

![](https://pic3.zhimg.com/v2-ffb463eb4976b6821a5b9c9a6cbe7382_r.jpg)

我们 earthmap.jpg 中从读取数据 (这张图是我从网上随便找的 -- 这里你使用任何图片都行, 最好符合球体的投影标准), 并将它部署给一个漫反射材质, 代码如下:

```
hittable_list earth() {
    int nx, ny, nn;
    unsigned char* texture_data = stbi_load("earthmap.jpg", &nx, &ny, &nn, 0);

    auto earth_surface =
        make_shared<lambertian>(make_shared<image_texture>(texture_data, nx, ny));
    auto globe = make_shared<sphere>(vec3(0,0,0), 2, earth_surface);

    return hittable_list(globe);
}
```

我们现在开始感受 texture 类的魅力了: 我们现在可以将任意一种类的纹理 (贴图, 大理石) 运用到 lambertian 材质上, 并且 lambertian 材质并不需要关心其输入的是图片还是其他的什么。  
如果你想测试的话, 我们先应用这个球, 然后暂时修改 `ray_color` 函数, 使其只返回 attenuation 的值, 你会得到下面的结果:

![](https://pic1.zhimg.com/v2-163856bfe8d26d93856016aaa80e7a4c_r.jpg)

## 7. 矩形和光源

我们首先来做一个发射光线的材质。我们需要加入一个发射函数 (我们可以把这部分内容加在 `hit_record` 里 —— 只是设计上的品味不同罢了)。就像背景区域一样, 这个材质只要指定自己发射的光线的颜色, 并且不用考虑任何反射折射的问题。所以它很简单:

```
class diffuse_light : public material  {
    public:
        diffuse_light(shared_ptr<texture> a) : emit(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            return false;
        }

        virtual vec3 emitted(double u, double v, const vec3& p) const {
            return emit->value(u, v, p);
        }

    public:
        shared_ptr<texture> emit;
};
```

为了不去给每个不是光源的材质实现 `emitted()` 函数, 我这里并不使用纯虚函数, 并让函数默认返回黑色:

```
class material {
    public:
+        virtual vec3 emitted(double u, double v, const vec3& p) const {
+            return vec3(0,0,0);
+        }

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const = 0;
};
```

接下来我们想要一个纯黑的背景, 并让所有光线都来自于我们的光源材质。要实现它, 我们得在 `ray_color` 函数中加入一个背景色的变量, 然后注意由 `emitted` 函数产生的新的颜色值。_【思考一个简单场景, 里面只有几个物体和一个光源, 有助于理解这段递归】_

```
vec3 ray_color(const ray& r, const vec3& background, const hittable& world, int depth) {
        hit_record rec;

        // If we've exceeded the ray bounce limit, no more light is gathered.
        if (depth <= 0)
            return vec3(0,0,0);

        // If the ray hits nothing, return the background color.
        if (!world.hit(r, 0.001, infinity, rec))
            return background;

        ray scattered;
        vec3 attenuation;
        vec3 emitted = rec.mat_ptr->emitted(rec.u, rec.v, rec.p);
        if (!rec.mat_ptr->scatter(r, rec, attenuation, scattered))
            return emitted;

        return emitted + attenuation * ray_color(scattered, background, world, depth-1);
    }
 ...

    int main() {
        ...
        const vec3 background(0,0,0);
        ...
                    color += ray_color(r, background, world, max_depth);
        ...
    }
```

现在我们来加入一些矩形。在建模人为环境时使用矩形会很方便。我超喜欢用轴对齐的矩形因为他们很简单 (我们接下来会加入实例(instance) 的功能, 待会就可以旋转这些矩形)。  
首先将一个矩形放在 xy 平面, 通常我们使用一个 z 值来定义这样的平面。举例来说, $z = k$ 。一个轴对齐的矩形是由 $x=x_0$ , $x=x_1$ , $y=y_0$ , 以及 $y=y_1$ 这四条直线构成的。

![](https://pic3.zhimg.com/v2-218518d832d1d1be9f60e040c493fdce_r.jpg)

为了判断光线是否与这样的矩形相交, 我们先来判断射线击中平面上的哪个点。回想一下射线方程 $p(t) = \mathbf{a} + t \cdot \vec{\mathbf{b}}$ , 其中射线的 z 值又由平面 $z(t) = \mathbf{a}_z + t \cdot \vec{\mathbf{b}}_z$ 决定。合并整理我们将获得当 $z=k$ 时 t 的值

 $t = \frac{k-\mathbf{a}_z}{\vec{\mathbf{b}}_z}$

一旦我们求出 t, 我们就能将其带入求解 x 和 y 的等式

$x = \mathbf{a}_x + t \cdot \vec{\mathbf{b}}_x$

$y = \mathbf{a}_y + t \cdot \vec{\mathbf{b}}_y$

如果 $x_0 < x < x_1$ 与 $y_0 < y < y_1$ , 那么射线就击中了这个矩形。

我们的 `xy_rect` 类是这样的：

```
class xy_rect: public hittable {
        public:
            xy_rect() {}

            xy_rect(double _x0, double _x1, double _y0, double _y1, double _k, shared_ptr<material> mat)
                : x0(_x0), x1(_x1), y0(_y0), y1(_y1), k(_k), mp(mat) {};

            virtual bool hit(const ray& r, double t0, double t1, hit_record& rec) const;

            virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
                output_box =  aabb(vec3(x0,y0, k-0.0001), vec3(x1, y1, k+0.0001));
                return true;
            }

        public:
            shared_ptr<material> mp;
            double x0, x1, y0, y1, k;
};
```

hit 函数是这样的:

```
bool xy_rect::hit(const ray& r, double t0, double t1, hit_record& rec) const {
        auto t = (k-r.origin().z()) / r.direction().z();
        if (t < t0 || t > t1)
            return false;
        auto x = r.origin().x() + t*r.direction().x();
        auto y = r.origin().y() + t*r.direction().y();
        if (x < x0 || x > x1 || y < y0 || y > y1)
            return false;
        rec.u = (x-x0)/(x1-x0);
        rec.v = (y-y0)/(y1-y0);
        rec.t = t;
        vec3 outward_normal = vec3(0, 0, 1);
        rec.set_face_normal(r, outward_normal);
        rec.mat_ptr = mp;
        rec.p = r.at(t);
        return true;
    }
```

如果我们把一个矩形设置为光源:

```
hittable_list simple_light() {
        hittable_list objects;

        auto pertext = make_shared<noise_texture>(4);
        objects.add(make_shared<sphere>(vec3(0,-1000, 0), 1000, make_shared<lambertian>(pertext)));
        objects.add(make_shared<sphere>(vec3(0,2,0), 2, make_shared<lambertian>(pertext)));

        auto difflight = make_shared<diffuse_light>(make_shared<constant_texture>(vec3(4,4,4)));
        objects.add(make_shared<sphere>(vec3(0,7,0), 2, difflight));
        objects.add(make_shared<xy_rect>(3, 5, 1, 3, -2, difflight));

        return objects;
    }
```

我们会得到:

![](https://pic4.zhimg.com/v2-8fe3e1a75c14758f82889671249d3a17_r.jpg)

注意现在光比 $(1,1,1)$ 还要亮, 所以这个亮度足够它去照亮其他东西了。  
同样的我们在做一些球型光源

![](https://pic1.zhimg.com/v2-46653b52f9776230539a5866ede479f0_r.jpg)

现在让我们加入剩下的两个轴, 并完成著名的 Cornell Box。  
xz 和 yz 平面是这样的:_【实话说这样写代码有些冗余了】_

```
class xz_rect: public hittable {
        public:
            xz_rect() {}

            xz_rect(double _x0, double _x1, double _z0, double _z1, double _k, shared_ptr<material> mat)
                : x0(_x0), x1(_x1), z0(_z0), z1(_z1), k(_k), mp(mat) {};

            virtual bool hit(const ray& r, double t0, double t1, hit_record& rec) const;

            virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
                output_box =  aabb(vec3(x0,k-0.0001,z0), vec3(x1, k+0.0001, z1));
                return true;
            }

        public:
            shared_ptr<material> mp;
            double x0, x1, z0, z1, k;
    };

    class yz_rect: public hittable {
        public:
            yz_rect() {}

            yz_rect(double _y0, double _y1, double _z0, double _z1, double _k, material *mat)
                : y0(_y0), y1(_y1), z0(_z0), z1(_z1), k(_k), mp(mat) {};

            virtual bool hit(const ray& r, double t0, double t1, hit_record& rec) const;

            virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
                output_box =  aabb(vec3(k-0.0001, y0, z0), vec3(k+0.0001, y1, z1));
                return true;
            }

        public:
            shared_ptr<material> mp;
            double y0, y1, z0, z1, k;
    };
```

当然 hit 函数也和之前一样:

```
bool xz_rect::hit(const ray& r, double t0, double t1, hit_record& rec) const {
        auto t = (k-r.origin().y()) / r.direction().y();
        if (t < t0 || t > t1)
            return false;
        auto x = r.origin().x() + t*r.direction().x();
        auto z = r.origin().z() + t*r.direction().z();
        if (x < x0 || x > x1 || z < z0 || z > z1)
            return false;
        rec.u = (x-x0)/(x1-x0);
        rec.v = (z-z0)/(z1-z0);
        rec.t = t;
        vec3 outward_normal = vec3(0, 1, 0);
        rec.set_face_normal(r, outward_normal);
        rec.mat_ptr = mp;
        rec.p = r.at(t);
        return true;
    }

    bool yz_rect::hit(const ray& r, double t0, double t1, hit_record& rec) const {
        auto t = (k-r.origin().x()) / r.direction().x();
        if (t < t0 || t > t1)
            return false;
        auto y = r.origin().y() + t*r.direction().y();
        auto z = r.origin().z() + t*r.direction().z();
        if (y < y0 || y > y1 || z < z0 || z > z1)
            return false;
        rec.u = (y-y0)/(y1-y0);
        rec.v = (z-z0)/(z1-z0);
        rec.t = t;
        vec3 outward_normal = vec3(1, 0, 0);
        rec.set_face_normal(r, outward_normal);
        rec.mat_ptr = mp;
        rec.p = r.at(t);
        return true;
    }
```

让我们做五堵墙壁, 并点亮这个盒子:

```
hittable_list cornell_box() {
        hittable_list objects;

        auto red = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.65, 0.05, 0.05)));
        auto white = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.73, 0.73, 0.73)));
        auto green = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.12, 0.45, 0.15)));
        auto light = make_shared<diffuse_light>(make_shared<constant_texture>(vec3(15, 15, 15)));

        objects.add(make_shared<yz_rect>(0, 555, 0, 555, 555, green));
        objects.add(make_shared<yz_rect>(0, 555, 0, 555, 0, red));
        objects.add(make_shared<xz_rect>(213, 343, 227, 332, 554, light));
        objects.add(make_shared<xz_rect>(0, 555, 0, 555, 0, white));
        objects.add(make_shared<xy_rect>(0, 555, 0, 555, 555, white));
        objects.add(make_shared<xz_rect>(0, 555, 0, 555, 555, white));
        return objects;
    }
```

下面是新的摄像机的参数:

```
const auto aspect_ratio = double(image_width) / image_height;
...
vec3 lookfrom(278, 278, -800);
vec3 lookat(278,278,0);
vec3 vup(0,1,0);
auto dist_to_focus = 10.0;
auto aperture = 0.0;
auto vfov = 40.0;

camera cam(lookfrom, lookat, vup, vfov, aspect_ratio, aperture, dist_to_focus, 0.0, 1.0);
```

我们会得到如下的结果: 【这里书有些问题, 在 hit 时设定了法向, 就不需要再 flip 了】

![](https://pic3.zhimg.com/v2-12910a90f2c51333d4950f7a45ae5b16_b.jpg)

这看上去都是噪点, 因为光太小了。我们还有一个问题: 一些墙壁的朝向反了。我们还没有让漫反射材质的正反两面有相同的表现。但 cornell box 的内外部是不同的模式。一个矩形物体的正面往往是 (1, 0, 0), (0, 1, 0), 或者 (0, 0, 1) 这几个方向。我们需要一种翻转矩形朝向的方法。所以让我们来一个新的 hittable 类吧, 别得啥都不干, 专门用来翻转正反面。

```
class flip_face : public hittable {
        public:
            flip_face(shared_ptr<hittable> p) : ptr(p) {}

            virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
                if (!ptr->hit(r, t_min, t_max, rec))
                    return false;

                rec.front_face = !rec.front_face;
                return true;
            }

            virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
                return ptr->bounding_box(t0, t1, output_box);
            }

        public:
            shared_ptr<hittable> ptr;
    };
```

这是生成一个 cornell box 的代码:

```
hittable_list cornell_box() {
        hittable_list objects;

        auto red = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.65, 0.05, 0.05)));
        auto white = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.73, 0.73, 0.73)));
        auto green = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.12, 0.45, 0.15)));
        auto light = make_shared<diffuse_light>(make_shared<constant_texture>(vec3(15, 15, 15)));



+        objects.add(make_shared<flip_face>(make_shared<yz_rect>(0, 555, 0, 555, 555, green)));
        objects.add(make_shared<yz_rect>(0, 555, 0, 555, 0, red));
        objects.add(make_shared<xz_rect>(213, 343, 227, 332, 554, light));
+        objects.add(make_shared<flip_face>(make_shared<xz_rect>(0, 555, 0, 555, 555, white)));
+        objects.add(make_shared<xz_rect>(0, 555, 0, 555, 0, white));
+        objects.add(make_shared<flip_face>(make_shared<xy_rect>(0, 555, 0, 555, 555, white)));
        return objects;
    }
```

看呀:

![](https://pic2.zhimg.com/v2-8534646fe898a1e27ed457835e1e1745_b.jpg)

## 8. 实例

Cornell Box 里面一般都有两个相对墙面有些角度的长方体。首先我们先把轴对齐的长方体图元做出来。每个长方体是由 6 个平面构成的:

```
class box: public hittable  {
    public:
        box() {}
        box(const vec3& p0, const vec3& p1, shared_ptr<material> ptr);

        virtual bool hit(const ray& r, double t0, double t1, hit_record& rec) const;

        virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
            output_box = aabb(box_min, box_max);
            return true;
        }

    public:
        vec3 box_min;
        vec3 box_max;
        hittable_list sides;
};

box::box(const vec3& p0, const vec3& p1, shared_ptr<material> ptr) {
    box_min = p0;
    box_max = p1;

    sides.add(make_shared<xy_rect>(p0.x(), p1.x(), p0.y(), p1.y(), p1.z(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<xy_rect>(p0.x(), p1.x(), p0.y(), p1.y(), p0.z(), ptr)));

    sides.add(make_shared<xz_rect>(p0.x(), p1.x(), p0.z(), p1.z(), p1.y(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<xz_rect>(p0.x(), p1.x(), p0.z(), p1.z(), p0.y(), ptr)));

    sides.add(make_shared<yz_rect>(p0.y(), p1.y(), p0.z(), p1.z(), p1.x(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<yz_rect>(p0.y(), p1.y(), p0.z(), p1.z(), p0.x(), ptr)));
}

bool box::hit(const ray& r, double t0, double t1, hit_record& rec) const {
    return sides.hit(r, t0, t1, rec);
}

class box: public hittable  {
    public:
        box() {}
        box(const vec3& p0, const vec3& p1, shared_ptr<material> ptr);

        virtual bool hit(const ray& r, double t0, double t1, hit_record& rec) const;

        virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
            output_box = aabb(box_min, box_max);
            return true;
        }

    public:
        vec3 box_min;
        vec3 box_max;
        hittable_list sides;
};

box::box(const vec3& p0, const vec3& p1, shared_ptr<material> ptr) {
    box_min = p0;
    box_max = p1;

    sides.add(make_shared<xy_rect>(p0.x(), p1.x(), p0.y(), p1.y(), p1.z(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<xy_rect>(p0.x(), p1.x(), p0.y(), p1.y(), p0.z(), ptr)));

    sides.add(make_shared<xz_rect>(p0.x(), p1.x(), p0.z(), p1.z(), p1.y(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<xz_rect>(p0.x(), p1.x(), p0.z(), p1.z(), p0.y(), ptr)));

    sides.add(make_shared<yz_rect>(p0.y(), p1.y(), p0.z(), p1.z(), p1.x(), ptr));
    sides.add(make_shared<flip_face>(
        make_shared<yz_rect>(p0.y(), p1.y(), p0.z(), p1.z(), p0.x(), ptr)));
}

bool box::hit(const ray& r, double t0, double t1, hit_record& rec) const {
    return sides.hit(r, t0, t1, rec);
}
```

现在我们可以加入两个长方体了 (但是没有旋转的角度)

```
objects.add(make_shared<box>(vec3(130, 0, 65), vec3(295, 165, 230), white));
objects.add(make_shared<box>(vec3(265, 0, 295), vec3(430, 330, 460), white));
```

现在有:

![](https://pic2.zhimg.com/v2-023774eba33871b6135c2df476aacfb1_b.jpg)

现在我们有了这两个长方体, 为了让它看上去更加接近**正宗**的 Cornell Box, 我们还需要让他旋转一下。在光线追踪中, 我们时常使用**实例 (instance)** 来完成这个工作。实例是一种经过旋转过或者平移等操作的几何图元。在光线追踪中, 这其实很简单。我们并不需要去移动任何东西。相对的, 我们只需将射线。举例来说, 想象一个**平移**操作, 我们可以将位于原点的粉红色盒子所有的组成部分的的 x 值 + 2, 或者就把盒子放在那里, 然后在 hit 函数中, 相对的将射线的原点 - 2。(这也是我们在 ray tracing 中惯用的做法)_【译注: 射线原点 - 2 计算出 hit record 后, 得到是左边盒子, 最后还要将计算结果 + 2, 才能获得正确的射入点 (右边盒子)】_

![](https://pic4.zhimg.com/v2-f38a962c426b20212585be2f969b81df_r.jpg)

你把刚刚的这个操作当成是平移还是坐标系的转换都行, 随你的喜好。移动 hittable 类的 translate 的代码如下

```
class translate : public hittable {
    public:
        translate(shared_ptr<hittable> p, const vec3& displacement)
            : ptr(p), offset(displacement) {}

        virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const;
        virtual bool bounding_box(double t0, double t1, aabb& output_box) const;

    public:
        shared_ptr<hittable> ptr;
        vec3 offset;
};

bool translate::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    ray moved_r(r.origin() - offset, r.direction(), r.time());
    if (!ptr->hit(moved_r, t_min, t_max, rec))
        return false;

    rec.p += offset;
    rec.set_face_normal(moved_r, rec.normal);

    return true;
}

bool translate::bounding_box(double t0, double t1, aabb& output_box) const {
    if (!ptr->bounding_box(t0, t1, output_box))
        return false;

    output_box = aabb(
        output_box.min() + offset,
        output_box.max() + offset);

    return true;
}
```

旋转就没有那么容易理解或列出算式了。一个常用的图像技巧是将所有的旋转都当成是绕 xyz 轴旋转。首先, 让我们绕 z 轴旋转。这样只会改变 xy 而不会改变 z 值。  

![](https://pic2.zhimg.com/v2-fbb493f5c284b552bb5760a6bfaa8ee5_r.jpg)

这里包含了一些三角几何. 我这里就不展开了。你要知道这其实很简单, 并不需要太多的几何知识, 你能在任何一本图形学的教材或者课堂笔记中找到它。绕 z 轴逆时针旋转的公式如下:

$x' = \cos(\theta) \cdot x - \sin(\theta) \cdot y$

$y' = \sin(\theta) \cdot x + \cos(\theta) \cdot y$

这个公式的伟大之处在于它对任何 $\theta$ 都成立, 你完全不用去考虑什么象限啊或者别的类似的东西。如果要顺时针旋转, 只需把 $\theta$ 改成 $-\theta$ 即可。来, 回想一下 $\cos(\theta) = \cos(-\theta)$ 和 $\sin(-\theta) = -\sin(\theta)$ , 所以逆运算的公式很简单。

类似的, 绕 y 轴旋转 (也正是我们相对这两个长方体做的事情) 的公式如下:

 $x' = \cos(\theta) \cdot x + \sin(\theta) \cdot z$

$z' = -\sin(\theta) \cdot x + \cos(\theta) \cdot z$

绕 x 轴旋转的公式如下:

$y' = \cos(\theta) \cdot y - \sin(\theta) \cdot z$

$z' = \sin(\theta) \cdot y + \cos(\theta) \cdot z$

  
和平移变换不同, 旋转时表面法向也发生了变化。所以在计算完 hit 函数后我们还要重新计算法向量。幸好对于旋转来说, 我们对法向量使用相同的公式变换一下即可。如果你加入了缩放 (Scale), 那么这下事情就复杂多了。点击[我们的网页](https://in1weekend.blogspot.com/)了解详细信息。

对一个绕 y 轴的旋转变换来说, 我们有:

```
class rotate_y : public hittable {
    public:
        rotate_y(shared_ptr<hittable> p, double angle);

        virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const;
        virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
            output_box = bbox;
            return hasbox;
        }

    public:
        shared_ptr<hittable> ptr;
        double sin_theta;
        double cos_theta;
        bool hasbox;
        aabb bbox;
};
```

加上构造函数:

```
rotate_y::rotate_y(hittable *p, double angle) : ptr(p) {
    auto radians = degrees_to_radians(angle);
    sin_theta = sin(radians);
    cos_theta = cos(radians);
    hasbox = ptr->bounding_box(0, 1, bbox);

    vec3 min( infinity,  infinity,  infinity);
    vec3 max(-infinity, -infinity, -infinity);

    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            for (int k = 0; k < 2; k++) {
                auto x = i*bbox.max().x() + (1-i)*bbox.min().x();
                auto y = j*bbox.max().y() + (1-j)*bbox.min().y();
                auto z = k*bbox.max().z() + (1-k)*bbox.min().z();

                auto newx =  cos_theta*x + sin_theta*z;
                auto newz = -sin_theta*x + cos_theta*z;

                vec3 tester(newx, y, newz);

                for (int c = 0; c < 3; c++) {
                    min[c] = ffmin(min[c], tester[c]);
                    max[c] = ffmax(max[c], tester[c]);
                }
            }
        }
    }

    bbox = aabb(min, max);
}
```

以及 hit 函数:

```
bool rotate_y::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    vec3 origin = r.origin();
    vec3 direction = r.direction();

    origin[0] = cos_theta*r.origin()[0] - sin_theta*r.origin()[2];
    origin[2] = sin_theta*r.origin()[0] + cos_theta*r.origin()[2];

    direction[0] = cos_theta*r.direction()[0] - sin_theta*r.direction()[2];
    direction[2] = sin_theta*r.direction()[0] + cos_theta*r.direction()[2];

    ray rotated_r(origin, direction, r.time());

    if (!ptr->hit(rotated_r, t_min, t_max, rec))
        return false;

    vec3 p = rec.p;
    vec3 normal = rec.normal;

    p[0] =  cos_theta*rec.p[0] + sin_theta*rec.p[2];
    p[2] = -sin_theta*rec.p[0] + cos_theta*rec.p[2];

    normal[0] =  cos_theta*rec.normal[0] + sin_theta*rec.normal[2];
    normal[2] = -sin_theta*rec.normal[0] + cos_theta*rec.normal[2];

    rec.p = p;
    rec.set_face_normal(rotated_r, normal);

    return true;
}
```

并且修改一下生成 cornell box 的 Cornell 函数:

```
shared_ptr<hittable> box1 = make_shared<box>(vec3(0, 0, 0), vec3(165, 330, 165), white);
box1 = make_shared<rotate_y>(box1,  15);
box1 = make_shared<translate>(box1, vec3(265,0,295));
objects.add(box1);

shared_ptr<hittable> box2 = make_shared<box>(vec3(0,0,0), vec3(165,165,165), white);
box2 = make_shared<rotate_y>(box2, -18);
box2 = make_shared<translate>(box2, vec3(130,0,65));
objects.add(box2);
```

最后得到:

![](https://pic1.zhimg.com/v2-756cb3e39f6e665d7b57a1eeb2ca18d4_b.jpg)

## 9. 体积体

给光线追踪器加入烟 / 雾 / 水汽是一件很不错的事情。这些东西常常被称为体积体 (volumes) 或者可参与介质 (participating media)。次表面散射(sub surface scatter, SSS) 是另一个不错的特性, 有点像物体内部的浓雾。加入这部分内容会导致代码结构的混乱。因为体积体和平面表面是完全不同的两种东西。但我们有一个可爱的小技巧: 将体积体表示为一个随机表面。一团烟雾在其实可以用一个概率上不确定在什么位置的平面来代替。当你看到代码后, 你就会更有感觉了。  
首先让我们来生成一个固定密度的体积体。光线可以在体积体内部发生散射, 也可以像图中的中间那条射线一样直接穿过去。体积体越薄越透明, 直接穿过去的情况就越有可能会发生。光线在体积体中直线传播所经过的距离也决定了光线采用图中哪种方式通过体积体。

![](https://pic2.zhimg.com/v2-bedd710b1d812c5c0a6c284aec1b11a1_r.jpg)

当光线射入体积体时, 它可能在任意一点发生散射。体积体越浓, 越可能发生散射。在任意微小的距离差 $\Delta L$ 发生散射的概率如下:  
$\text{probability} = C \cdot \Delta L$  
其中 $C$ 是体积体的光学密度比例常数。 经过了一系列不同的等式运算, 你将会随机的得到一个光线发生散射的距离值。如果根据这个距离来说, 散射点在体积体外, 那么我们认为没有相交, 不调用 `hit` 函数。对于一个静态的体积体来说, 我们只需要他的密度 C 和边界。我会用另一个 hittable 物体来表示体积体的边界:

```
class constant_medium : public hittable {
    public:
        constant_medium(shared_ptr<hittable> b, double d, shared_ptr<texture> a)
            : boundary(b), neg_inv_density(-1/d)
        {
            phase_function = make_shared<isotropic>(a);
        }

        virtual bool hit(const ray& r, double t_min, double t_max, hit_record& rec) const;

        virtual bool bounding_box(double t0, double t1, aabb& output_box) const {
            return boundary->bounding_box(t0, t1, output_box);
        }

    public:
        shared_ptr<hittable> boundary;
        shared_ptr<material> phase_function;
        double neg_inv_density;
};
```

对于散射的方向来说, 我们采用各项同性 (isotropic) 的随机单位向量大法

```
class isotropic : public material {
    public:
        isotropic(shared_ptr<texture> a) : albedo(a) {}

        virtual bool scatter(
            const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered
        ) const {
            scattered = ray(rec.p, random_in_unit_sphere(), r_in.time());
            attenuation = albedo->value(rec.u, rec.v, rec.p);
            return true;
        }

    public:
        shared_ptr<texture> albedo;
};
```

hit 函数如下:

```
bool constant_medium::hit(const ray& r, double t_min, double t_max, hit_record& rec) const {
    // Print occasional samples when debugging. To enable, set enableDebug true.
    const bool enableDebug = false;
    const bool debugging = enableDebug && random_double() < 0.00001;

    hit_record rec1, rec2;

    if (!boundary->hit(r, -infinity, infinity, rec1))
        return false;

    if (!boundary->hit(r, rec1.t+0.0001, infinity, rec2))
        return false;

    if (debugging) std::cerr << "\nt0=" << rec1.t << ", t1=" << rec2.t << '\n';

    if (rec1.t < t_min) rec1.t = t_min;
    if (rec2.t > t_max) rec2.t = t_max;

    if (rec1.t >= rec2.t)
        return false;

    if (rec1.t < 0)
        rec1.t = 0;

    const auto ray_length = r.direction().length();
    const auto distance_inside_boundary = (rec2.t - rec1.t) * ray_length;
    const auto hit_distance = neg_inv_density * log(random_double());

    if (hit_distance > distance_inside_boundary)
        return false;

    rec.t = rec1.t + hit_distance / ray_length;
    rec.p = r.at(rec.t);

    if (debugging) {
        std::cerr << "hit_distance = " <<  hit_distance << '\n'
                  << "rec.t = " <<  rec.t << '\n'
                  << "rec.p = " <<  rec.p << '\n';
    }

    rec.normal = vec3(1,0,0);  // arbitrary
    rec.front_face = true;     // also arbitrary
    rec.mat_ptr = phase_function;

    return true;
}
```

我们一定要小心与边界相关的逻辑, 因为我们要确保当射线原点在体积体内部时, 光线依然会发生散射。在云中, 光线反复发生散射, 这是一种很常见的现象。  
另外, 上述代码只能确保射线只会射入体积体一次, 之后再也不进入体积体的情况。换句话说, 它假定体积体的边界是一个凸几何体。所以这个狭义的实现只对球体或者长方体这样的物体生效。但是对于当中有洞的那种形状, 如甜甜圈就不行了。写一个能处理任意形状的实现是完全可行的, 但我们把这部分内容留给我们的读者作为练习。  
如果我们将两个长方体替换为烟和雾 (深色与浅色的粒子) 并使用一个更大的灯光 (同时更加昏暗以至于不会炸了这个场景) 让场景更快的融合在一起。

```
hittable_list cornell_smoke() {
    hittable_list objects;

    auto red = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.65, 0.05, 0.05)));
    auto white = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.73, 0.73, 0.73)));
    auto green = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.12, 0.45, 0.15)));
    auto light = make_shared<diffuse_light>(make_shared<constant_texture>(vec3(7, 7, 7)));

    objects.add(make_shared<flip_face>(make_shared<yz_rect>(0, 555, 0, 555, 555, green)));
    objects.add(make_shared<yz_rect>(0, 555, 0, 555, 0, red));
    objects.add(make_shared<xz_rect>(113, 443, 127, 432, 554, light));
    objects.add(make_shared<flip_face>(make_shared<xz_rect>(0, 555, 0, 555, 555, white)));
    objects.add(make_shared<xz_rect>(0, 555, 0, 555, 0, white));
    objects.add(make_shared<flip_face>(make_shared<xy_rect>(0, 555, 0, 555, 555, white)));

    shared_ptr<hittable> box1 = make_shared<box>(vec3(0,0,0), vec3(165,330,165), white);
    box1 = make_shared<rotate_y>(box1,  15);
    box1 = make_shared<translate>(box1, vec3(265,0,295));

    shared_ptr<hittable> box2 = make_shared<box>(vec3(0,0,0), vec3(165,165,165), white);
    box2 = make_shared<rotate_y>(box2, -18);
    box2 = make_shared<translate>(box2, vec3(130,0,65));

    objects.add(
        make_shared<constant_medium>(box1, 0.01, make_shared<constant_texture>(vec3(0,0,0))));
    objects.add(
        make_shared<constant_medium>(box2, 0.01, make_shared<constant_texture>(vec3(1,1,1))));

    return objects;
}
```

我们会得到:

![](https://pic1.zhimg.com/v2-dc0e109f216f2aa5f488b9bfcc74d050_b.jpg)

## 10. 一个测试所有新特性的场景

让我们把所有东西放在一起吧! 使用一个薄雾盖住所有东西, 并加入一个蓝色的次表面反射球体 (这种说法不太清楚, 实际上次表面材质就是在电介质内部填充体积体)。现在这个渲染器的最大局限就是没有阴影光线。但是因此我们能不花代价的得到散焦和次表面。这是一把设计上的双刃剑。

```
hittable_list final_scene() {
    hittable_list boxes1;
    auto ground =
        make_shared<lambertian>(make_shared<constant_texture>(vec3(0.48, 0.83, 0.53)));

    const int boxes_per_side = 20;
    for (int i = 0; i < boxes_per_side; i++) {
        for (int j = 0; j < boxes_per_side; j++) {
            auto w = 100.0;
            auto x0 = -1000.0 + i*w;
            auto z0 = -1000.0 + j*w;
            auto y0 = 0.0;
            auto x1 = x0 + w;
            auto y1 = random_double(1,101);
            auto z1 = z0 + w;

            boxes1.add(make_shared<box>(vec3(x0,y0,z0), vec3(x1,y1,z1), ground));
        }
    }

    hittable_list objects;

    objects.add(make_shared<bvh_node>(boxes1, 0, 1));

    auto light = make_shared<diffuse_light>(make_shared<constant_texture>(vec3(7, 7, 7)));
    objects.add(make_shared<xz_rect>(123, 423, 147, 412, 554, light));

    auto center1 = vec3(400, 400, 200);
    auto center2 = center1 + vec3(30,0,0);
    auto moving_sphere_material =
        make_shared<lambertian>(make_shared<constant_texture>(vec3(0.7, 0.3, 0.1)));
    objects.add(make_shared<moving_sphere>(center1, center2, 0, 1, 50, moving_sphere_material));

    objects.add(make_shared<sphere>(vec3(260, 150, 45), 50, make_shared<dielectric>(1.5)));
    objects.add(make_shared<sphere>(
        vec3(0, 150, 145), 50, make_shared<metal>(vec3(0.8, 0.8, 0.9), 10.0)
    ));

    auto boundary = make_shared<sphere>(vec3(360, 150, 145), 70, make_shared<dielectric>(1.5));
    objects.add(boundary);
    objects.add(make_shared<constant_medium>(
        boundary, 0.2, make_shared<constant_texture>(vec3(0.2, 0.4, 0.9))
    ));
    boundary = make_shared<sphere>(vec3(0, 0, 0), 5000, make_shared<dielectric>(1.5));
    objects.add(make_shared<constant_medium>(
        boundary, .0001, make_shared<constant_texture>(vec3(1,1,1))));

    int nx, ny, nn;
    auto tex_data = stbi_load("earthmap.jpg", &nx, &ny, &nn, 0);
    auto emat = make_shared<lambertian>(make_shared<image_texture>(tex_data, nx, ny));
    objects.add(make_shared<sphere>(vec3(400,200, 400), 100, emat));
    auto pertext = make_shared<noise_texture>(0.1);
    objects.add(make_shared<sphere>(vec3(220,280, 300), 80, make_shared<lambertian>(pertext)));

    hittable_list boxes2;
    auto white = make_shared<lambertian>(make_shared<constant_texture>(vec3(0.73, 0.73, 0.73)));
    int ns = 1000;
    for (int j = 0; j < ns; j++) {
        boxes2.add(make_shared<sphere>(vec3::random(0,165), 10, white));
    }

    objects.add(make_shared<translate>(
        make_shared<rotate_y>(
            make_shared<bvh_node>(boxes2, 0.0, 1.0), 15),
            vec3(-100,270,395)
        )
    );

    return objects;
}
```

每个像素点采样 10,000 次, 得到下图的结果:

![](https://pic1.zhimg.com/v2-460d12c611ba27f071c9977864c6a2d0_r.jpg)

现在你可以合上这本书, 开始生成属于你自己的炫酷图片! 在 [https://in1weekend.blogspot.com/](https://in1weekend.blogspot.com/) 获取后续阅读内容和新特性, 如果你在阅读过程中遇到了问题, 或对本书有什么看法或评价, 或者想分享你的炫酷图片, 欢迎发送邮件到 [ptrshrl@gmail.com](mailto:ptrshrl@gmail.com)

## 译者后记

到这里我的翻译工作就暂时告一段落啦。不得不说，使用不多的代码量，就能得到如此漂亮的图片，也正是这个系列教程的魅力所在吧！（虽然渲染有够慢的）

在翻译的过程中我也收获了不少，发现自己能读懂和翻出来让别人能看懂完全是两码事。也是真切的体会到了翻译不易。这是我第一次翻，肯定存在不少的纰漏与错误，还请大家见谅，并期待您的批评指正。

翻译的过程中我发现了不少原书的错误：虽然基本都是 typo error 与版本更替导致的问题，不过也着实让我过了把提 issue 的瘾。另外仓库的几位 contributor 都很友好，热心解答了我的问题。

![](https://pic1.zhimg.com/v2-350055772dabc433a6990f95eb1d90d8_r.jpg)

这里还有个小插曲，我不知道 axis 的复数形式是 axes，当时搜索也没搜到这个结果，于是闹出了这样的笑话:

![](https://pic3.zhimg.com/v2-1ca9903af5863a598cc0ff659affbf2e_r.jpg)

我暂时不打算阅读并翻译 book3， 一来可能是被它的标题 “The rest of your life” 吓到了，据说难度陡增，二来我现在的时间也不是很充裕，还是先老老实实回去看 RTR4 吧，先看光追难免有些不务正业了。如果有机会的话，我还是很乐意翻完这个系列的。

好啦，再见！祝各位生活愉快！