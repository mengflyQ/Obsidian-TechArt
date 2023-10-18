---
title: "{{title}}"
create_time: "{{date:YYYY-MM-DD HH:mm}}"
uid: "{{date:YYYYMMDDHHmm}}"
reference: []
banner: "[[Pasted image 20230711183814.png]]"
banner_header: 
banner_lock: true
---
【原文】 [GPU Path Tracing in Unity – Part 3](http://three-eyed-games.com/2019/03/18/gpu-path-tracing-in-unity-part-3/)
今天，我们将迈出一大步。我们将超越迄今为止我们所追踪的纯粹的球形结构和无限平面，并引入三角形——现代计算机图形学的精髓，整个虚拟世界所包含的元素。如果你想接着我们上次的进展，可以使用第二部分的代码。我们今天要完成的代码可以在这里找到。让我们开始吧！

## 三角形

三角形的定义很简单：它只是一个由三个相连的顶点组成的列表，每个顶点都存储着它的位置以及稍后的法线。从你的视角来看，顶点的绕行顺序决定了你是在看正面还是背面。传统上，逆时针的绕行顺序被认为是 “正面”。

首先，我们需要能够判断一条光线是否击中一个三角形，以及在哪里。一种非常受欢迎的（当然不是唯一的）确定光线与三角形相交的算法是由托马斯 · 阿克宁 - 默勒（Tomas Akenine-Möller）和本 · 特伦布尔（Ben Trumbore）在 1997 年提出的。你可以在这篇论文《快速、最小存储光线 - 三角形相交》中阅读所有详细信息。

论文中的代码可以很容易地移植到 HLSL 着色器代码中：

```
static const float EPSILON = 1e-8;
bool IntersectTriangle_MT97(Ray ray, float3 vert0, float3 vert1, float3 vert2,
    inout float t, inout float u, inout float v)
{
    // find vectors for two edges sharing vert0
    float3 edge1 = vert1 - vert0;
    float3 edge2 = vert2 - vert0;
    // begin calculating determinant - also used to calculate U parameter
    float3 pvec = cross(ray.direction, edge2);
    // if determinant is near zero, ray lies in plane of triangle
    float det = dot(edge1, pvec);
    // use backface culling
    if (det < EPSILON)
        return false;
    float inv_det = 1.0f / det;
    // calculate distance from vert0 to ray origin
    float3 tvec = ray.origin - vert0;
    // calculate U parameter and test bounds
    u = dot(tvec, pvec) * inv_det;
    if (u < 0.0 || u > 1.0f)
        return false;
    // prepare to test V parameter
    float3 qvec = cross(tvec, edge1);
    // calculate V parameter and test bounds
    v = dot(ray.direction, qvec) * inv_det;
    if (v < 0.0 || u + v > 1.0f)
        return false;
    // calculate t, ray intersects triangle
    t = dot(edge2, qvec) * inv_det;
    return true;
}
```

要使用此函数，您需要一条光线和三角形的三个顶点。返回值会告诉您三角形是否被击中。如果击中，将计算出三个额外的值：t 描述了沿着光线到击中点的距离，u / v 是指定三角形上击中点位置的三个重心坐标中的两个（最后一个可以计算为 w = 1 - u - v）。如果你还不了解重心坐标，可以阅读 Scratchapixel 上的一篇优秀解释文章。

现在我们来追踪一个硬编码的单个三角形！找到着色器的 Trace 函数，然后添加以下代码片段：

```
// Trace single triangle
float3 v0 = float3(-150, 0, -150);
float3 v1 = float3(150, 0, -150);
float3 v2 = float3(0, 150 * sqrt(2), -150);
float t, u, v;
if (IntersectTriangle_MT97(ray, v0, v1, v2, t, u, v))
{
    if (t > 0 && t < bestHit.distance)
    {
        bestHit.distance = t;
        bestHit.position = ray.origin + t * ray.direction;
        bestHit.normal = normalize(cross(v1 - v0, v2 - v0));
        bestHit.albedo = 0.00f;
        bestHit.specular = 0.65f * float3(1, 0.4f, 0.2f);
        bestHit.smoothness = 0.9f;
        bestHit.emission = 0.0f;
    }
}
```

如前所述，t 存储了沿着光线的距离，我们可以直接使用它来计算击中点。对于正确的反射，法线是很重要的，可以使用任意两个三角形边的叉积来获得。进入播放模式，欣赏您的第一个自我追踪的三角形：

![[4acfe028df058fd83f996e9d40b61c76_MD5.jpg]]

练习：尝试使用重心坐标而不是距离来计算位置。如果你做得对，光滑的三角形看起来和之前一模一样。

## 三角形网格

我们已经克服了第一个障碍，但追踪完整的三角形网格又是另一回事。我们首先需要了解一些关于网格的基本知识。如果您已经熟悉这方面的知识，可以跳过下一段。

在计算机图形学中，网格由许多缓冲区定义，最重要的是顶点缓冲区和索引缓冲区。顶点缓冲区是一个 3D 向量列表，描述了每个顶点在对象空间中的位置（这意味着当您平移、旋转或缩放对象时，这些值不需要更改 - 它们在运行时使用矩阵乘法从对象空间转换到世界空间）。索引缓冲区是一个整数列表，它们是指向顶点缓冲区的索引。每三个索引组成一个三角形。例如，如果索引缓冲区是 [0,1,2,0,2,3]，那么有两个三角形：第一个三角形由顶点缓冲区中的第一个、第二个和第三个顶点组成，而第二个三角形由第一个、第三个和第四个顶点组成。索引缓冲区因此也定义了前面提到的绕行顺序。除了顶点和索引缓冲区外，额外的缓冲区可以为每个顶点添加信息。最常见的额外缓冲区存储法线、纹理坐标（称为纹理坐标或简单的 UV）和顶点颜色。

## 使用游戏对象

我们需要做的第一件事是实际了解应该成为光线追踪过程一部分的游戏对象。最简单的解决方案是使用 FindObjectOfType<MeshRenderer>()，但我们将采用更灵活、更快的方法。让我们添加一个新的组件 RayTracingObject：

```
using UnityEngine;
[RequireComponent(typeof(MeshRenderer))]
[RequireComponent(typeof(MeshFilter))]
public class RayTracingObject : MonoBehaviour
{
    private void OnEnable()
    {
        RayTracingMaster.RegisterObject(this);
    }
    private void OnDisable()
    {
        RayTracingMaster.UnregisterObject(this);
    }
}
```

我们希望在光线追踪中使用该组件，并负责将它们注册到 RayTracingMaster。在主类中添加这些函数：

```
private static bool _meshObjectsNeedRebuilding = false;
private static List<RayTracingObject> _rayTracingObjects = new List<RayTracingObject>();
public static void RegisterObject(RayTracingObject obj) {
    _rayTracingObjects.Add(obj);
    _meshObjectsNeedRebuilding = true;
}
public static void UnregisterObject(RayTracingObject obj) {
    _rayTracingObjects.Remove(obj);
    _meshObjectsNeedRebuilding = true;
}
```

到目前为止，一切都好 - 我们知道要追踪哪些对象。现在来到了最艰难的部分：我们即将从 Unity 的网格（矩阵、顶点和索引缓冲区，还记得吗？）收集所有数据，将它们放入我们自己的数据结构，并将它们上传到 GPU，以便着色器可以使用它们。让我们从 C# 端的主类开始，用我们的数据结构和缓冲区定义：

```
struct MeshObject
{
    public Matrix4x4 localToWorldMatrix;
    public int indices_offset;
    public int indices_count;
}
private static List<MeshObject> _meshObjects = new List<MeshObject>();
private static List<Vector3> _vertices = new List<Vector3>();
private static List<int> _indices = new List<int>();
private ComputeBuffer _meshObjectBuffer;
private ComputeBuffer _vertexBuffer;
private ComputeBuffer _indexBuffer;
```

… 然后让我们在着色器中做同样的事情。你现在已经习惯了，不是吗？ 我们的数据结构已经就位，所以现在我们可以用实际的数据来填充它们。我们将所有网格的所有顶点收集到一个大的 List<Vector3> 中，所有索引收集到一个大的 List<int > 中。虽然对于顶点来说这没有问题，但我们需要调整索引，以便它们仍然指向我们大缓冲区中的适当顶点。例如，假设到目前为止我们已经添加了价值 1000 个顶点的对象，现在我们要添加一个简单的立方体网格。第一个三角形可能由索引 [0,1,2] 组成，但是由于在我们开始添加立方体顶点之前，我们的缓冲区中已经有了 1000 个顶点，所以我们需要移动索引，从而变成[1000,1001,1002]。以下是代码中的示例：

```
private void RebuildMeshObjectBuffers()
{
    if (!_meshObjectsNeedRebuilding)
    {
        return;
    }
    _meshObjectsNeedRebuilding = false;
    _currentSample = 0;
    // Clear all lists
    _meshObjects.Clear();
    _vertices.Clear();
    _indices.Clear();
    // Loop over all objects and gather their data
    foreach (RayTracingObject obj in _rayTracingObjects)
    {
        Mesh mesh = obj.GetComponent<MeshFilter>().sharedMesh;
        // Add vertex data
        int firstVertex = _vertices.Count;
        _vertices.AddRange(mesh.vertices);
        // Add index data - if the vertex buffer wasn't empty before, the
        // indices need to be offset
        int firstIndex = _indices.Count;
        var indices = mesh.GetIndices(0);
        _indices.AddRange(indices.Select(index => index + firstVertex));
        // Add the object itself
        _meshObjects.Add(new MeshObject()
        {
            localToWorldMatrix = obj.transform.localToWorldMatrix,
            indices_offset = firstIndex,
            indices_count = indices.Length
        });
    }
    CreateComputeBuffer(ref _meshObjectBuffer, _meshObjects, 72);
    CreateComputeBuffer(ref _vertexBuffer, _vertices, 12);
    CreateComputeBuffer(ref _indexBuffer, _indices, 4);
}
```

在 OnRenderImage 函数中调用 RebuildMeshObjectBuffers，并且不要忘记在 OnDisable 中释放新的缓冲区。下面是我在上面的代码中使用的两个辅助函数，使缓冲区处理更加简便：

```
private static void CreateComputeBuffer<T>(ref ComputeBuffer buffer, List<T> data, int stride)
    where T : struct
{
    // Do we already have a compute buffer?
    if (buffer != null)
    {
        // If no data or buffer doesn't match the given criteria, release it
        if (data.Count == 0 || buffer.count != data.Count || buffer.stride != stride)
        {
            buffer.Release();
            buffer = null;
        }
    }
    if (data.Count != 0)
    {
        // If the buffer has been released or wasn't there to
        // begin with, create it
        if (buffer == null)
        {
            buffer = new ComputeBuffer(data.Count, stride);
        }
        // Set data on the buffer
        buffer.SetData(data);
    }
}
private void SetComputeBuffer(string name, ComputeBuffer buffer)
{
    if (buffer != null)
    {
        RayTracingShader.SetBuffer(0, name, buffer);
    }
}
```

很好，我们有了缓冲区，并且它们已经填充了所需的数据！现在我们只需要告诉着色器。在 SetShaderParameters 中，添加以下代码（而且，多亏了我们的新辅助函数，你还可以在此过程中缩短球体缓冲区的代码）：

```
SetComputeBuffer("_Spheres", _sphereBuffer);
SetComputeBuffer("_MeshObjects", _meshObjectBuffer);
SetComputeBuffer("_Vertices", _vertexBuffer);
SetComputeBuffer("_Indices", _indexBuffer);
```

呼。这很繁琐，但看看我们刚刚做了什么：我们收集了所有网格的内部数据（矩阵、顶点和索引），将它们放入一个简洁且简单的结构中，并将其发送到了 GPU，现在 GPU 已经迫不及待地想要利用这些数据了。

## 追踪网格

不要让 GPU 等待。我们已经在着色器中有了追踪单个三角形的代码，而网格实际上只是其中的一部分。这里唯一的新内容是我们使用矩阵将顶点从对象空间转换为世界空间，使用内置函数 mul（用于乘法）。矩阵包含对象的平移、旋转和缩放。它是 4×4 的，因此我们需要一个 4d 向量来进行乘法运算。前三个分量（x，y，z）来自我们的顶点缓冲区。我们将第四个分量（w）设置为 1，因为我们处理的是一个点。如果它是一个方向，我们将在那里放置一个 0 以忽略矩阵中的任何平移和缩放。困惑？阅读这个教程至少八次。以下是着色器代码：

```
void IntersectMeshObject(Ray ray, inout RayHit bestHit, MeshObject meshObject)
{
    uint offset = meshObject.indices_offset;
    uint count = offset + meshObject.indices_count;
    for (uint i = offset; i < count; i += 3)
    {
        float3 v0 = (mul(meshObject.localToWorldMatrix, float4(_Vertices[_Indices[i]], 1))).xyz;
        float3 v1 = (mul(meshObject.localToWorldMatrix, float4(_Vertices[_Indices[i + 1]], 1))).xyz;
        float3 v2 = (mul(meshObject.localToWorldMatrix, float4(_Vertices[_Indices[i + 2]], 1))).xyz;
        float t, u, v;
        if (IntersectTriangle_MT97(ray, v0, v1, v2, t, u, v))
        {
            if (t > 0 && t < bestHit.distance)
            {
                bestHit.distance = t;
                bestHit.position = ray.origin + t * ray.direction;
                bestHit.normal = normalize(cross(v1 - v0, v2 - v0));
                bestHit.albedo = 0.0f;
                bestHit.specular = 0.65f;
                bestHit.smoothness = 0.99f;
                bestHit.emission = 0.0f;
            }
        }
    }
}
```

我们距离真正看到所有这些操作只有一步之遥。让我们稍微调整一下 Trace 函数，并添加追踪网格对象的功能：

```
RayHit Trace(Ray ray)
{
    RayHit bestHit = CreateRayHit();
    uint count, stride, i;
    // Trace ground plane
    IntersectGroundPlane(ray, bestHit);
    // Trace spheres
    _Spheres.GetDimensions(count, stride);
    for (i = 0; i < count; i++)
    {
        IntersectSphere(ray, bestHit, _Spheres[i]);
    }
    // Trace mesh objects
    _MeshObjects.GetDimensions(count, stride);
    for (i = 0; i < count; i++)
    {
        IntersectMeshObject(ray, bestHit, _MeshObjects[i]);
    }
    return bestHit;
}
```

## 结果

就是这样！让我们添加一些简单的网格（Unity 的原始网格工作得很好），为它们添加一个 RayTracingObject 组件，观察神奇的效果。不要使用任何详细的网格（超过几百个三角形）！我们的着色器缺少适当的优化，如果你过分了，每个像素追踪一个样本可能需要几秒甚至几分钟的时间。结果是，您的 GPU 驱动程序将被系统杀死，Unity 可能会崩溃，您的计算机需要重新启动。

![[8550c82de6890082a7e44385e5b1cf82_MD5.jpg]]

请注意，我们的网格不是平滑的，而是平面着色的。由于我们尚未将顶点的法线上传到缓冲区，因此我们需要使用叉积分别获得每个三角形的法线，而不能在三角形区域内进行插值。在本教程系列的下一部分中，我们将解决这个问题。

为了好玩，我从 Morgan McGuire 的存档中下载了斯坦福兔子，并使用 Blender 的 decimate 修饰符将其减少到 431 个三角形。您可以在着色器的 IntersectMeshObject 函数中玩弄光线设置和硬编码的材质。这是一个具有漂亮柔和阴影和微妙漫反射 GI 的 Grafitti Shelter 的电介质兔子：

![[54c5579f9e8f4383c69fba6dc89ea966_MD5.jpg]]

... 以及在 Cape Hill 强烈的定向光下的金属兔子，投射出一些类似迪斯科的光点在地板上：

![[ea39ed85e2d33f7e2215339551b655f0_MD5.jpg]]

... 以及两只小兔子躲在一个巨大的岩石苏珊下，在 Kiara 9 黄昏的蓝天下（通过检查索引偏移是否为 0，我为第一个对象硬编码了一个备选材质）：

![[9b96c550cfb1350823865cc621985c54_MD5.jpg]]

## 接下来是什么？

第一次在自己的光线追踪器中看到真实的网格是很酷的，不是吗？今天我们处理了相当多的数据，学习了 Möller-Trumbore 交点算法，并将所有内容集成到 Unity 的 GameObject 中以便可以立即使用。我们还看到了光线追踪的美丽之处：只要集成了新的交点，所有炫酷的效果（软阴影、高光和漫反射全局光照等）都能正常工作。

渲染光泽兔子花了很长时间，我仍然不得不对结果进行一些轻微的过滤，以消除最明显的噪声。为了克服这个问题，场景通常被组织成一个空间结构，如网格、kD 树或包围盒层次结构，这大大加快了大型场景的渲染速度。

但首先要解决的问题是修复法线，使我们的网格（即使是低多边形）看起来比现在更平滑。在对象移动时自动更新矩阵以及实际连接到 Unity 材质（而不仅仅是一个硬编码的材质）也听起来是个好主意。我们将在本教程系列的下一部分解决这些问题。

感谢您坚持到这里，我们在第四部分再见！