---
title: 【译】Unity 中的 GPU 光线追踪 - 第 1 部分
aliases: 
tags: 
create_time: 2023-07-11 18:39
uid: 202307111839
banner: "[[Pasted image 20230711183753.png]]"
---

【原文】[GPU Ray Tracing in Unity – Part 1](http://three-eyed-games.com/2018/05/03/gpu-ray-tracing-in-unity-part-1/)


这真是一个充满激情的光线追踪时代。最新的技术进步，如 AI 加速降噪、微软在 DirectX 12 中宣布原生支持，以及 Peter Shirley 以自愿支付方式发布他的书籍，都表明光线追踪终于有机会获得广泛认可。虽然现在谈论革命的开始可能还为时过早，但学习并积累关于这个主题的知识确实是个好主意。

在本文中，我们将使用 Unity 中的计算着色器从零开始编写一个非常简单的光线追踪器。我们将使用 C# 编写脚本，使用 HLSL 编写着色器。

## 光线追踪理论

首先，我想快速回顾一下基本的光线追踪理论。如果你已经熟悉这部分内容，请随意跳过。

让我们考虑一下现实世界中照片是如何产生的——虽然过于简化，但对于渲染来说应该足够了。一切都始于光源发射光子。光子沿直线飞行，直到撞到表面，此时光子被反射或折射，并在减去一些被表面吸收的能量后继续前进。最终，一些光子会击中相机的图像传感器，从而产生最终图像。光线追踪基本上是模拟这些步骤来创建逼真的图像。

实际上，只有很小一部分光源发射的光子会击中相机。因此，**应用亥姆霍兹互易原理，计算通常是反向进行的：与其从光源发射光子，不如从相机发射光线进入场景，经过反射或折射，最终击中光源。**

我们将要构建的光线追踪器基于 Turner Whitted 于 1980 年发表的一篇论文。我们将能够模拟硬阴影和完美反射。它还可以作为实现更高级效果的基础，如折射、漫反射全局光照、光泽反射和柔和阴影。

## 基本设置

首先，创建一个新的 Unity 项目。新建一个 C# 脚本 RayTracingMaster.cs 和一个计算着色器 RayTracingShader.compute。在 C# 脚本中填写一些基本代码：

```cs
using UnityEngine;

public class RayTracingMaster : MonoBehaviour
{
    public ComputeShader RayTracingShader;

    private RenderTexture _target;

    private void OnRenderImage(RenderTexture source, RenderTexture destination)
    {
        Render(destination);
    }

    private void Render(RenderTexture destination)
    {
        // Make sure we have a current render target
        InitRenderTexture();

        // Set the target and dispatch the compute shader
        RayTracingShader.SetTexture(0, "Result", _target);
        int threadGroupsX = Mathf.CeilToInt(Screen.width / 8.0f);
        int threadGroupsY = Mathf.CeilToInt(Screen.height / 8.0f);
        RayTracingShader.Dispatch(0, threadGroupsX, threadGroupsY, 1);

        // Blit the result texture to the screen
        Graphics.Blit(_target, destination);
    }

    private void InitRenderTexture()
    {
        if (_target == null || _target.width != Screen.width || _target.height != Screen.height)
        {
            // Release render texture if we already have one
            if (_target != null)
                _target.Release();

            // Get a render target for Ray Tracing
            _target = new RenderTexture(Screen.width, Screen.height, 0,
                RenderTextureFormat.ARGBFloat, RenderTextureReadWrite.Linear);
            _target.enableRandomWrite = true;
            _target.Create();
        }
    }
}
```

OnRenderImage 函数会在 Unity 的相机完成渲染后自动调用。为了进行渲染，我们首先创建一个合适尺寸的渲染目标，并告知计算着色器。这里的 0 是计算着色器内核函数的索引——我们只有一个。

接下来，我们调度着色器。这意味着我们正在告诉 GPU 使用若干个线程组执行我们的着色器代码。每个线程组由在着色器本身中设置的若干线程组成。线程组的大小和数量可以在最多三个维度中指定，这使得将计算着色器应用于任意维度问题变得简单。在我们的例子中，**我们希望为渲染目标的每个像素生成一个线程。在 Unity 计算着色器模板中定义的默认线程组大小为 `[numthreads(8,8,1)]`，所以我们将坚持使用这个大小，并为每个 8×8 像素生成一个线程组**。最后，我们使用 Graphics.Blit 将结果写入屏幕。

现在让我们试一试。将 RayTracingMaster 组件添加到场景中的相机（这对于调用 OnRenderImage 很重要），分配计算着色器并进入播放模式。你应该能看到 Unity 计算着色器模板的输出，呈现为一个美丽的三角形分形图案。

## 相机

既然我们可以在屏幕上显示内容，那么现在让我们生成一些相机光线。由于 Unity 为我们提供了一个完全可用的相机，我们将使用计算出的矩阵来实现这一点。首先，在着色器上设置矩阵。在 RayTracingMaster.cs 脚本中添加以下几行代码：

```c
private Camera _camera;
private void Awake() {
    _camera = GetComponent<Camera>();
}
private void SetShaderParameters() {
    RayTracingShader.SetMatrix("_CameraToWorld", _camera.cameraToWorldMatrix);
    RayTracingShader.SetMatrix("_CameraInverseProjection", _camera.projectionMatrix.inverse);
}
```

在渲染之前，从 OnRenderImage 调用 SetShaderParameters。

在着色器中，我们定义矩阵，一个 Ray 结构以及一个用于构造的函数。请注意，在 HLSL 中，与 C# 不同，函数或变量声明需要在使用之前出现。对于每个屏幕像素的中心，我们计算光线的起点和方向，并将后者作为颜色输出。以下是完整的着色器：

```c
#pragma kernel CSMain

RWTexture2D<float4> Result;
float4x4 _CameraToWorld;
float4x4 _CameraInverseProjection;

struct Ray
{
    float3 origin;
    float3 direction;
};

Ray CreateRay(float3 origin, float3 direction)
{
    Ray ray;
    ray.origin = origin;
    ray.direction = direction;
    return ray;
}

Ray CreateCameraRay(float2 uv)
{
    // Transform the camera origin to world space
    float3 origin = mul(_CameraToWorld, float4(0.0f, 0.0f, 0.0f, 1.0f)).xyz;
    
    // Invert the perspective projection of the view-space position
    float3 direction = mul(_CameraInverseProjection, float4(uv, 0.0f, 1.0f)).xyz;
    // Transform the direction from camera to world space and normalize
    direction = mul(_CameraToWorld, float4(direction, 0.0f)).xyz;
    direction = normalize(direction);

    return CreateRay(origin, direction);
}

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
    // Get the dimensions of the RenderTexture
    uint width, height;
    Result.GetDimensions(width, height);

    // Transform pixel to [-1,1] range
    float2 uv = float2((id.xy + float2(0.5f, 0.5f)) / float2(width, height) * 2.0f - 1.0f);

    // Get a ray for the UVs
    Ray ray = CreateCameraRay(uv);

    // Write some colors
    Result[id.xy] = float4(ray.direction * 0.5f + 0.5f, 1.0f);
}
```

尝试在检查器中旋转相机，你应该会看到 “彩色天空” 相应地发生变化。

现在让我们用一个实际的天空盒替换这些颜色。在我的示例中，我使用了 HDRI Haven 的 Cape Hill，当然你可以使用任何你喜欢的天空盒。下载并将其拖放到 Unity 中。在导入设置中，如果你下载的分辨率高于 2048，请记得提高最大分辨率。现在在脚本中添加一个公共纹理 SkyboxTexture，在检查器中分配纹理，并通过在 SetShaderParameters 函数中添加以下代码将其设置到着色器上：

```
RayTracingShader.SetTexture(0, "_SkyboxTexture", SkyboxTexture);
```

在着色器中，定义纹理和相应的采样器，以及我们将在一分钟后使用的 π 常数：

```
Texture2D<float4> _SkyboxTexture;
SamplerState sampler_SkyboxTexture;
static const float PI = 3.14159265f;
```

现在，我们将不再将方向作为颜色输出，而是采样天空盒。为此，我们将笛卡尔方向向量转换为球坐标，并将其映射到纹理坐标。用以下代码替换 CSMain 的最后一部分：

```c
// Sample the skybox and write it
float theta = acos(ray.direction.y) / -PI;
float phi = atan2(ray.direction.x, -ray.direction.z) / -PI * 0.5f;
Result[id.xy] = _SkyboxTexture.SampleLevel(sampler_SkyboxTexture, float2(phi, theta), 0);
```

## 追踪

到目前为止，一切顺利。现在我们将进行实际的光线追踪。在数学上，我们将计算光线与场景几何体的交点，并存储击中参数（位置、法线和沿光线的距离）。如果我们的光线击中多个物体，我们将选择最近的一个。让我们在着色器中定义结构体 RayHit：

```c
struct RayHit
{
    float3 position;
    float distance;
    float3 normal;
};

RayHit CreateRayHit()
{
    RayHit hit;
    hit.position = float3(0.0f, 0.0f, 0.0f);
    hit.distance = 1.#INF;
    hit.normal = float3(0.0f, 0.0f, 0.0f);
    return hit;
}
```

通常，场景由许多三角形组成，但我们将从简单的开始：与无限地面平面和一些球体求交！

### 地面平面

与 y=0 的无限平面求交是相当简单的。不过，我们只接受正光线方向上的交点，并拒绝任何不比潜在的先前交点更近的交点。

在 HLSL 中，默认情况下，参数是按值传递的，而不是按引用传递，因此我们只能处理副本，而无法将更改传播给调用函数。我们用 inout 限定符传递 RayHit bestHit，以便能够修改原始结构。以下是着色器代码：

```cs
void IntersectGroundPlane(Ray ray, inout RayHit bestHit) {
    // Calculate distance along the ray where the ground plane is intersected
    float t = -ray.origin.y / ray.direction.y;
    if (t > 0 && t < bestHit.distance)
    {
        bestHit.distance = t;
        bestHit.position = ray.origin + t * ray.direction;
        bestHit.normal = float3(0.0f, 1.0f, 0.0f);
    }
}
```

为了使用它，让我们添加一个 Trace 函数框架（我们将在一会儿对其进行扩展）：

```c
RayHit Trace(Ray ray)
{
    RayHit bestHit = CreateRayHit();
    IntersectGroundPlane(ray, bestHit);
    return bestHit;
}
```

此外，我们需要一个基本的着色函数。同样，我们用 inout 传递 Ray——当我们讨论反射时，稍后会对其进行修改。为了调试目的，如果击中了几何体，我们返回法线，否则回退到我们的天空盒采样代码：

```c
float3 Shade(inout Ray ray, RayHit hit) {
    if (hit.distance < 1.#INF)
    {
        // Return the normal
        return hit.normal * 0.5f + 0.5f;
    }
    else
    {
        // Sample the skybox and write it
        float theta = acos(ray.direction.y) / -PI;
        float phi = atan2(ray.direction.x, -ray.direction.z) / -PI * 0.5f;
        return _SkyboxTexture.SampleLevel(sampler_SkyboxTexture, float2(phi, theta), 0).xyz;
    }
}
```

我们将在 CSMain 中使用这两个函数。如果还没有删除天空盒采样代码，请删除它，并添加以下代码来追踪光线并为击中处进行着色：

```
// Trace and shade
RayHit hit = Trace(ray);
float3 result = Shade(ray, hit);
Result[id.xy] = float4(result, 1);
```

### 球体

一个平面并不是世界上最令人兴奋的东西，所以让我们立刻添加一个球体。线 - 球交点的数学公式可以在维基百科上找到。这次有两个光线击中候选点：入射点 p1 - p2 和出射点 p1 + p2。我们将首先检查入射点，仅当另一个点无效时才使用出射点。在我们的例子中，球体被定义为一个包含位置（xyz）和半径（w）的 float4。以下是代码：
![[Diagram 2.svg]]
```c
void IntersectSphere(Ray ray, inout RayHit bestHit, float4 sphere) {
    // Calculate distance along the ray where the sphere is intersected
    float3 d = ray.origin - sphere.xyz;
    float p1 = -dot(ray.direction, d);
    float p2sqr = p1 * p1 - dot(d, d) + sphere.w * sphere.w;
    if (p2sqr < 0)
        return;
    float p2 = sqrt(p2sqr);
    float t = p1 - p2 > 0 ? p1 - p2 : p1 + p2;
    if (t > 0 && t < bestHit.distance)
    {
        bestHit.distance = t;
        bestHit.position = ray.origin + t * ray.direction;
        bestHit.normal = normalize(bestHit.position - sphere.xyz);
    }
}
```

要添加一个球体，只需从 Trace 调用这个函数，例如:

```cs
// Add a floating unit sphere
IntersectSphere(ray, bestHit, float4(0, 3.0f, 0, 1.0f));
```

## 抗锯齿

当前方法存在一个问题：我们只测试每个像素的中心，所以你可以在结果中看到严重的锯齿效果（可怕的 “锯齿状”）。为了解决这个问题，**我们将对每个像素进行多次光线追踪。每条光线在像素区域内获得一个随机偏移。为了保持可接受的帧率，我们进行逐步采样，这意味着如果相机没有移动，我们将在每帧中对每个像素追踪一条光线，并随着时间平均结果。每次相机移动（或其他参数如视场、场景几何或场景光照发生变化时），我们需要重新开始。**

让我们创建一个非常简单的图像效果着色器，用于将多个结果相加。将你的着色器命名为 AddShader，确保第一行为 Shader "Hidden/AddShader"。在 Cull Off ZWrite Off ZTest Always 之后添加 Blend SrcAlpha OneMinusSrcAlpha 以启用 Alpha 混合。接下来，用以下代码替换默认的 frag 函数：

```cs
float _Sample;
float4 frag (v2f i) : SV_Target
{
    return float4(tex2D(_MainTex, i.uv).rgb, 1.0f / (_Sample + 1.0f));
}
```

这个着色器现在只会以 1 的不透明度绘制第一个样本，接下来是 1/2，然后是 1/3，以此类推，平均所有具有相等贡献的样本。

在脚本中，我们仍然需要计算样本数并使用新创建的图像效果着色器：

```cs
private uint _currentSample = 0;
private Material _addMaterial;
```

在 InitRenderTexture 中重建渲染目标时，还应将 _currentSamples 重置为 0，并添加一个检测相机变换更改的 Update 函数：

```cs
private void Update() {
    if (transform.hasChanged)
    {
        _currentSample = 0;
        transform.hasChanged = false;
    }
}
```

要使用我们的自定义着色器，我们需要初始化一个材质，告诉它当前样本并在 Render 函数中将其用于屏幕上的涂抹：

```cs
// Blit the result texture to the screen
if (_addMaterial == null)
    _addMaterial = new Material(Shader.Find("Hidden/AddShader"));
_addMaterial.SetFloat("_Sample", _currentSample);
Graphics.Blit(_target, destination, _addMaterial);
_currentSample++;
```

现在我们进行了逐步采样，但仍然始终使用像素中心。在计算着色器中，定义一个 `float2 _PixelOffset`，并在 CSMain 中使用它，而不是硬 `float2(0.5f, 0.5f)` 偏移。回到脚本中，在 SetShaderParameters 中创建一个随机偏移：

```
RayTracingShader.SetVector("_PixelOffset", new Vector2(Random.value, Random.value));
```

如果你移动相机，你应该会看到图像仍然显示锯齿状，但如果你站在原地几帧，它会很快消失。以下是我们所做的好事的并排比较：

![[45adfc783b0aa75359bae1ce21b28b33_MD5.jpg]]

## 反射

现在我们的光线追踪器的基础工作已经完成，所以我们可以开始处理实际将光线追踪与其他渲染技术区分开来的一些花哨事物。完美反射是我们列表上的第一项。这个想法很简单：每当我们击中表面时，根据您可能还记得的学校中的反射定律（入射角 = 反射角）反射光线，减少其能量，并重复，直到我们击中天空、耗尽能量或在固定数量的最大反弹之后。

在着色器中，为光线添加一个 float3 energy，并在 CreateRay 函数中将其初始化为 `ray.energy = float3(1.0f, 1.0f, 1.0f)`。光线在所有颜色通道上以完整的吞吐量开始，并将随每次反射而减小。

现在，我们将执行最多 8 次追踪（原始光线加上 7 次反弹），并将 Shade 函数调用的结果相加，但乘以光线的能量。举个例子，假设一束光线已经反射一次，失去了 34 的能量。现在它继续前行，击中天空，所以我们只将天空击中的能量的 14 传递给像素。将您的 CSMain 调整为如下所示，替换以前的 Trace 和 Shade 调用：

```
// Trace and shade
float3 result = float3(0, 0, 0);
for (int i = 0; i < 8; i++)
{
    RayHit hit = Trace(ray);
    result += ray.energy * Shade(ray, hit);
    if (!any(ray.energy))
        break;
}
```

我们的 Shade 函数现在还负责更新能量并生成反射光线，所以这里 inout 变得很重要。要更新能量，我们执行与表面的镜面颜色的逐元素乘法。例如，金子的镜面反射率大约为 float3(1.0f, 0.78f, 0.34f)，所以它将反射 100% 的红光，78% 的绿光，但只有 34% 的蓝光，使反射具有独特的金色色调。小心不要让这些值中的任何一个超过 1，因为你会从无处创造出能量。此外，反射率通常比你想象的要低。参见例如 Naty Hoffman 的 Physics and Math of Shading 幻灯片 64 中的一些值。

HLSL 有一个内置的功能，可以使用给定的法线反射光线，这非常棒。由于浮点数的不精确，可能会发生反射光线被反射到的表面所阻挡的情况。为了防止这种自遮挡，我们将沿着法线方向偏移一点位置。下面是新的 Shade 函数:

```c
float3 Shade(inout Ray ray, RayHit hit) {
    if (hit.distance < 1.#INF)
    {
        float3 specular = float3(0.6f, 0.6f, 0.6f);
        // Reflect the ray and multiply energy with specular reflection
        ray.origin = hit.position + hit.normal * 0.001f;
        ray.direction = reflect(ray.direction, hit.normal);
        ray.energy *= specular;
        // Return nothing
        return float3(0.0f, 0.0f, 0.0f);
    }
    else
    {
        // Erase the ray's energy - the sky doesn't reflect anything
        ray.energy = 0.0f;
        // Sample the skybox and write it
        float theta = acos(ray.direction.y) / -PI;
        float phi = atan2(ray.direction.x, -ray.direction.z) / -PI * 0.5f;
        return _SkyboxTexture.SampleLevel(sampler_SkyboxTexture, float2(phi, theta), 0).xyz;
    }
}
```

您可能希望通过将天空框与一个大于 1 的因子相乘来稍微增加天空框的强度。现在使用 Trace 函数。将一些球体放入循环中，你会得到这样的结果:

![[e84d907223deac416f04c29a0396f2f2_MD5.jpg]]

## 平行光

因此，我们可以追踪类似镜面的反射，这使我们能够渲染光滑的金属表面，但对于非金属，我们还需要另一种东西：漫反射。简而言之，金属只会反射带有它们镜面颜色的入射光，而非金属允许光折射到表面，散射并以带有它们反照率颜色的随机方向离开。在通常假设的理想兰伯特表面的情况下，概率与指定方向与表面法线之间的角度的余弦成正比。关于这个话题的更深入讨论可以在这里找到。

首先，为了开始实现漫反射光照，让我们在 RayTracingMaster 脚本中添加一个公共的 Light DirectionalLight，并将场景的定向光指定给它。您可能还想在 Update 函数中检测光源的变换变化，就像我们已经为相机的变换做的那样。现在将以下几行添加到您的 SetShaderParameters 函数中：

```c
Vector3 l = DirectionalLight.transform.forward;
RayTracingShader.SetVector("_DirectionalLight", new Vector4(l.x, l.y, l.z, DirectionalLight.intensity));
```

回到着色器中，定义 `float4 _DirectionalLight`。在 Shade 函数中，在镜面颜色下面定义漫反射颜色：

```c
float3 albedo = float3(0.8f, 0.8f, 0.8f);
```

将之前的黑色返回值替换为简单的漫反射着色：

```c
// Return a diffuse-shaded color
return saturate(dot(hit.normal, _DirectionalLight.xyz) * -1) * _DirectionalLight.w * albedo;
```

请记住，点积定义为 a⋅b=||a|| ||b||cosθ。由于我们的两个向量（法线和光线方向）都是单位长度，点积正是我们所需要的：夹角的余弦值。光线和光线指向相反的方向，因此对于正面照明，点积返回 -1 而不是 1。我们需要翻转符号以弥补这一点。最后，我们饱和这个值（即将其限制在 [0,1] 范围内），以防止负能量。

为了让定向光产生阴影，我们将追踪一个阴影光线。它从所讨论的表面位置开始（再次使用非常小的位移以避免自阴影），并指向光线来自的方向。如果有任何东西阻挡了通往无穷远的道路，我们将不使用任何漫反射光。在漫反射返回语句之前添加这些行：

```c
// Shadow test ray
bool shadow = false;
Ray shadowRay = CreateRay(hit.position + hit.normal * 0.001f, -1 * _DirectionalLight.xyz);
RayHit shadowHit = Trace(shadowRay);
if (shadowHit.distance != 1.#INF)
{
    return float3(0.0f, 0.0f, 0.0f);
}
```

现在我们可以追踪一些带有硬阴影的光泽塑料球！将镜面设为 0.04，反照率设为 0.8 可以得到以下图像：

![[48cf8066b137f81588d070873cb25e4e_MD5.jpg]]

## 场景和材料

作为今天的高潮，让我们创建一些更复杂且丰富多彩的场景！为了提高灵活性，我们将在 C# 中定义场景，而不是在着色器中硬编码一切。

首先，我们将在着色器中扩展 RayHit 结构。与其在 Shade 函数中全局定义材质属性，我们将为每个对象定义它们，并将它们存储在 RayHit 中。向结构添加 float3 albedo 和 float3 specular，并在 CreateRayHit 中将它们初始化为 float3(0.0f, 0.0f, 0.0f)。**同时调整 Shade 函数以使用来自 hit 的这些值**，而不是硬编码的值。

为了在 CPU 和 GPU 上建立对球体的共同理解，同时在着色器和 C# 脚本中定义一个 Sphere 结构。在着色器方面，它是这样的：

```c
struct Sphere
{
    float3 position;
    float radius;
    float3 albedo;
    float3 specular;
};
```

在着色器中，我们需要使 IntersectSphere 函数使用我们的自定义结构，而不是 float4。这很简单：

```c
void IntersectSphere(Ray ray, inout RayHit bestHit, Sphere sphere) {
    // Calculate distance along the ray where the sphere is intersected
    float3 d = ray.origin - sphere.position;
    float p1 = -dot(ray.direction, d);
    float p2sqr = p1 * p1 - dot(d, d) + sphere.radius * sphere.radius;
    if (p2sqr < 0)
        return;
    float p2 = sqrt(p2sqr);
    float t = p1 - p2 > 0 ? p1 - p2 : p1 + p2;
    if (t > 0 && t < bestHit.distance)
    {
        bestHit.distance = t;
        bestHit.position = ray.origin + t * ray.direction;
        bestHit.normal = normalize(bestHit.position - sphere.position);
        bestHit.albedo = sphere.albedo;
        bestHit.specular = sphere.specular;
    }
}
```

在 IntersectGroundPlane 函数中设置 bestHit.albedo 和 bestHit.specular 以调整其材质。

接下来，定义 `StructuredBuffer<Sphere> _Spheres`。这是 CPU 存储构成场景的所有球体的地方。从您的 Trace 函数中删除所有硬编码的球体，并添加以下行：

```c
// Trace spheres
uint numSpheres, stride;
_Spheres.GetDimensions(numSpheres, stride);
for (uint i = 0; i < numSpheres; i++)
    IntersectSphere(ray, bestHit, _Spheres[i]);
```

现在我们将用一些生命填充场景。回到 C#，让我们添加一些公共参数来控制球体的放置和实际的计算缓冲区：

```c
public Vector2 SphereRadius = new Vector2(3.0f, 8.0f);
public uint SpheresMax = 100;
public float SpherePlacementRadius = 100.0f;
private ComputeBuffer _sphereBuffer;
```

在 OnEnable 中设置场景，并在 OnDisable 中释放缓冲区。这样，每次启用组件时都会生成一个随机场景。SetUpScene 函数将尝试在一定的半径内放置球体，并拒绝那些将与已存在的球体相交的球体。一半的球体是金属的（黑色反照率，彩色镜面），另一半是非金属的（彩色反照率，4% 镜面）：

```c
private void OnEnable()
{
    _currentSample = 0;
    SetUpScene();
}

private void OnDisable()
{
    if (_sphereBuffer != null)
        _sphereBuffer.Release();
}

private void SetUpScene()
{
    List<Sphere> spheres = new List<Sphere>();

    // Add a number of random spheres
    for (int i = 0; i < SpheresMax; i++)
    {
        Sphere sphere = new Sphere();

        // Radius and radius
        sphere.radius = SphereRadius.x + Random.value * (SphereRadius.y - SphereRadius.x);
        Vector2 randomPos = Random.insideUnitCircle * SpherePlacementRadius;
        sphere.position = new Vector3(randomPos.x, sphere.radius, randomPos.y);

        // Reject spheres that are intersecting others
        foreach (Sphere other in spheres)
        {
            float minDist = sphere.radius + other.radius;
            if (Vector3.SqrMagnitude(sphere.position - other.position) < minDist * minDist)
                goto SkipSphere;
        }

        // Albedo and specular color
        Color color = Random.ColorHSV();
        bool metal = Random.value < 0.5f;
        sphere.albedo = metal ? Vector3.zero : new Vector3(color.r, color.g, color.b);
        sphere.specular = metal ? new Vector3(color.r, color.g, color.b) : Vector3.one * 0.04f;

        // Add the sphere to the list
        spheres.Add(sphere);

    SkipSphere:
        continue;
    }

    // Assign to compute buffer
    _sphereBuffer = new ComputeBuffer(spheres.Count, 40);
    _sphereBuffer.SetData(spheres);
}
```

new ComputeBuffer(spheres.Count, 40) 中的神奇数字 40 是我们缓冲区的跨距，即内存中一个球体的字节大小。要计算它，计算 Sphere 结构中的浮点数的数量并将其乘以 float 的字节大小（4 字节）。最后，在 SetShaderParameters 函数中为着色器设置缓冲区：

```c
RayTracingShader.SetBuffer(0, "_Spheres", _sphereBuffer);
```

## 结果

恭喜您！您现在拥有一个功能强大的 GPU 驱动的 Whitted 光线追踪器，能够渲染一个平面和许多具有镜面反射的球体，简单的漫反射光照和硬阴影。完整的源代码可以在 Bitbucket 上找到。尝试玩转球体放置参数，欣赏美丽的景色：

![[1701c85455a2db6d21ff556c6457397e_MD5.jpg]]

![[43a4cd75fa9c5b68e6d72ac4cfb30f5f_MD5.jpg]]

接下来是什么？ 我们今天取得了相当多的成果，但仍有很多领域需要探索：漫反射全局光照、光泽反射、柔和阴影、非不透明材质的折射，以及显然是使用三角形网格而非球体。在下一篇文章中，我们将把 Whitted 光线追踪器扩展为路径追踪器，以征服上述的一些现象。

感谢您花时间阅读这篇文章！敬请关注，后续文章正在筹备中。

