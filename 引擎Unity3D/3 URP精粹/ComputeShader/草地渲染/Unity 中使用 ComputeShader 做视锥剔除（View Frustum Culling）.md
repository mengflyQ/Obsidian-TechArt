[Unity中使用ComputeShader做视锥剔除（View Frustum Culling） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/376801370)
## 为什么要做视锥剔除

在很多的开放性世界的游戏中，场景中往往会有大量的植被与建筑，然而由于视角有限，在屏幕上并不会显示出所有地图上的物体，只能显示出视锥体内的物体。如下图，场景中有很多的小树，但是最终显示在屏幕上的只有视锥体内的小树。

![[5acd2c2be5959f9cc4d3ce549177ddff_MD5.jpg]]

如果我们不做任何的操作，那么场景中**所有的**小树对应数据（顶点，三角面）都会通过 CPU 提交 DrawCall 传递到 GPU 中，并且参与到顶点着色器的计算中，如果有几何着色器同样也会参与到其中的计算，然后才会做剔除的操作。也就是说，**一大堆我们其实并看不见的物体依旧在 Rendering Pipeline 中耗费着大量的计算，造成了不必要的消耗**。

并且由于 GPU 没有单个物体的概念，全部都是顶点和面，因此剔除的效率并不高。比如我有一个人物模型，有上万个顶点和面，那么 CPU 要剔除它时就需要将所有的顶点和面都计算一遍，来看留下哪些和剔除哪些顶点和面。但是如果我们能够使用一个**包围盒**把这个模型包起来，那么只需要计算包围盒的几个顶点即可判断出是否剔除这个模型。

针对上面这些问题，我们可以使用视锥剔除来进行优化。当然了，除此之外还有遮挡剔除（例如 Hiz）等方案可以进行更进一步的优化。

先上效果图，以防读者跑掉。简单的视锥剔除后的效果如下：

![[d8d7f3b84df779e0de837c069ecb981a_MD5.gif]]

![[e860fb2b1ea3ea26dde09e2bf835558a_MD5.gif]]

Demo 地址：

[https://github.com/luckyWjr/ComputeShaderDemo](https://github.com/luckyWjr/ComputeShaderDemo)

## 视锥剔除原理

前面我们说了，所有看不见的物体，也就是视锥体外的物体都会被传入到 GPU 中做计算。那么如果我们能够在 CPU 阶段就抛弃这些视锥体外的物体，不就可以大大降低传入到 GPU 中的数据了。

那么问题的核心就是怎么判断物体是否在视锥体内或者外。前面也说了一个物体可能非常的复杂有成千上万的顶点和面，因此我们往往会给每个物体定义一个包围盒或者包围球，这样问题就简化为**如何判断包围盒或者包围球和视锥体的内外关系**。

那么我们来看看怎么判断我们的包围盒是否在视锥体内，二维下的示意图如下：

![[c351f290da490ff13ca9235289ed3e10_MD5.jpg]]

很明显我们应该将 ABD 三个物体的数据提交给 GPU，而把 C 剔除掉。那么这个判断逻辑怎么来的呢？首先我们可以通过判断包围盒的每个**顶点与视锥体的关系**来判断整个包围盒与视锥体的关系。其中我们可以**把视锥体看作是六个面的集合，如果一个点都在六个面的背面，那么这个点就在视锥体内**。但是如果包围盒有任何一个顶点在视锥体内，我们就当做 AABB 属于在视锥体内的话，那么对于物体 D（比如一面墙）的 AABB 明显不适用，它的所有顶点都不在视锥体内，但是我们依旧需要渲染它。此时我们需要逆向思维，即**若包围盒的所有顶点都在视锥体的某个面外，那么我们认为这个物体是要被剔除的**。例如 C 的所有顶点都在右边那个面外，需要剔除，D 的所有顶点并没有全部在某个面外因此保留。

理解了原理之后我们接下来要做的就是怎么用代码实现它，在以往这部分的逻辑会在 CPU 进行，并且还会事先使用例如**八叉树**的形式来对场景进行划分，比如我某个节点对应的包围盒在视锥体外，那么该节点下的所有子节点必然也都在视锥体外，从而节省了大量的计算。对于在 CPU 上进行的剔除操作（视锥剔除，遮挡剔除等）我们称之为 **CPU Culling**。

但是在当今的 GPGPU 当中，我们可以使用 Compute Shader 来完成物体级别的剔除，这种剔除方式我们称之为 **GPU Culling**。本文要介绍的就是其中一种使用 Compute Shader 来实现视锥剔除的方法，简单来说就是利用 cs，在 GPU 端判断物体的包围盒和视锥体的关系。

有关 ComputeShader 的基础可以参考之前的文章：

[王江荣：Unity 中 ComputeShader 的基础介绍与使用](https://zhuanlan.zhihu.com/p/368307575)

## Graphics.DrawMeshInstancedIndirect

Unity 的 [GPU instancing](https://docs.unity3d.com/Manual/GPUInstancing.html) 技术可以帮助我们使用少量的 draw call 绘制大量相同材质的物体，例如场景中的植被，因此我们才能够绘制很多小树从而保持着不错的帧率。

而我们要用 cs 来进行 culling 判断的话，必然要将这成千上万个物体的包围盒信息传入到 cs 中，然后再由 cs 把不被剔除的物体传回到 CPU，最终绘制出来。其中大量数据在 CPU 与 GPU 的传递就会造成很大的性能问题，特别在手机端传输带宽受限的情况下肯定是无法承受的。

而 DrawMeshInstancedIndirect 方法可以为我们很好的解决这样的问题，官方有一段说明如下：

This is useful if you want to populate all of the instance data from the GPU, and the CPU does not know the number of instances to draw (for example, when performing GPU culling).

也就是说使用该方法，我们可以把在显存里面的数据直接 Draw 到渲染管线中，而不是传统的从 CPU 发送数据。也就是说可以把 cs 处理后的结果直接放到渲染管线当中，而不用再传递到 CPU 端。

本文的例子也是在官方文档提供的代码基础上进行修改的（可惜的是官方没给我们做好 Culling 操作）：

[https://docs.unity3d.com/ScriptReference/Graphics.DrawMeshInstancedIndirect.html](https://docs.unity3d.com/ScriptReference/Graphics.DrawMeshInstancedIndirect.html)

拷贝文档中的代码到工程中，选择自己喜欢的一个 Mesh，即可得到和文章最开始的图片一样的效果。接下来我们要做的就是添砖加瓦，实现一个简单的视锥剔除效果。

## 视锥体六个面的定义

视锥剔除的核心就是如何判断包围盒与视锥体的关系，前面我们说了判断的方法为：若包围盒的所有顶点都在视锥体的某个面外，那么我们认为这个物体是要被剔除的。那么我们首先要定义出视锥体的六个面。

我们知道**平面方程**为：

Ax+By+Cz+D=0

其中 xyz 代表平面上的一点，ABC 为平面法线，D 的值后面介绍。这样我们即可以使用一个四维向量 Vector4=(A,B,C,D) 来表示一个平面。

例如假设有个平面平行于 xz 平面且正面向上，那么其法线即为 (0,1,0)，因此 A=0，B=1，C=0。若该平面过点(0,5,0)，那么 x=0，y=5，z=0，可解得 D=-5。因此过点(0,5,0) 法线为 (0,1,0) 的平面方程为 0x+1y+0z-5=0，用向量表示即为(0,1,0,-5)。

我们可以发现其中 D=-(Ax+By+Cz)，而 Ax+By+Cz 的值正是 (A,B,C) 与(x,y,z)的点乘结果，因此 **D 的值即为平面法线和平面内任意一点的点乘结果取负**。

这样我们可以得到第一个函数：

```
//一个点和一个法向量确定一个平面
public static Vector4 GetPlane(Vector3 normal, Vector3 point) {
    return new Vector4(normal.x, normal.y, normal.z, -Vector3.Dot(normal, point));
}
```

视锥体的六个面我们简单的用左右上下远近来称呼，其中远近两个面的法线我们可以通过 Camera.transform.forward 来获得，其他四个面的法线怎么求呢？因为透视相机的左右上下四个面肯定都过相机本身，因此 Camera.transform.position 就是四个面上的一点，而三点可以确定一个平面，我们只需要再求出远平面（或近平面）的四个端点，这样对于上下左右四个面中的任何一个面的法线我们都可以利用远平面的某两个点和相机本身（一共三个点）通过向量的**叉乘**来获取。

如果对点乘叉乘不是很了解的话，可以参考：

[王江荣：向量运算与应用](https://zhuanlan.zhihu.com/p/362035810)

三点确定一个平面的方法如下：

```
//三点确定一个平面
public static Vector4 GetPlane(Vector3 a, Vector3 b, Vector3 c) {
    Vector3 normal = Vector3.Normalize(Vector3.Cross(b - a, c - a));
    return GetPlane(normal, a);
}
```

视锥体远平面的计算方式如下：

```
//获取视锥体远平面的四个点
public static Vector3[] GetCameraFarClipPlanePoint(Camera camera)
{
    Vector3[] points = new Vector3[4];
    Transform transform = camera.transform;
    float distance = camera.farClipPlane;
    float halfFovRad = Mathf.Deg2Rad * camera.fieldOfView * 0.5f;
    float upLen = distance * Mathf.Tan(halfFovRad);
    float rightLen = upLen * camera.aspect;
    Vector3 farCenterPoint = transform.position + distance * transform.forward;
    Vector3 up = upLen * transform.up;
    Vector3 right = rightLen * transform.right;
    points[0] = farCenterPoint - up - right;//left-bottom
    points[1] = farCenterPoint - up + right;//right-bottom
    points[2] = farCenterPoint + up - right;//left-up
    points[3] = farCenterPoint + up + right;//right-up
    return points;
}
```

比较简单，就不过多说了，camera.aspect = width/height ，视锥体的 yz 横切面如下图：

![[3f545b3df5b7a156d8adebe09e971c29_MD5.jpg]]

对 FOV 和 aspect 实在不了解，可参考下面链接的文末介绍：

[王江荣：视图变换和投影变换及其对应变换矩阵（右手坐标系）](https://zhuanlan.zhihu.com/p/362713511)

有了上述这些点的坐标，我们就可以得到视锥体的所有面了，代码如下：

```
//获取视锥体的六个平面
public static Vector4[] GetFrustumPlane(Camera camera)
{
    Vector4[] planes = new Vector4[6];
    Transform transform = camera.transform;
    Vector3 cameraPosition = transform.position;
    Vector3[] points = GetCameraFarClipPlanePoint(camera);
    //顺时针
    planes[0] = GetPlane(cameraPosition, points[0], points[2]);//left
    planes[1] = GetPlane(cameraPosition, points[3], points[1]);//right
    planes[2] = GetPlane(cameraPosition, points[1], points[0]);//bottom
    planes[3] = GetPlane(cameraPosition, points[2], points[3]);//up
    planes[4] = GetPlane(-transform.forward, transform.position + transform.forward * camera.nearClipPlane);//near
    planes[5] = GetPlane(transform.forward, transform.position + transform.forward * camera.farClipPlane);//far
    return planes;
}
```

需要注意的就是顶点的顺序，**在 Unity 中顺时针代表正面**。

## 点与面的关系

面有了，那么如果判断一个点是在这个面的正面还是背面呢？我们先来看一个二维的示意图，如下：

![[6fe6fac91cbde6b112cabad39e0a633f_MD5.jpg]]

我们假设图中平面的法线为 (nx,ny,nz)，由于 O(ox,oy,oz) 在平面上，那么就可以求出平面方程中 D 的值为：-(nx*ox+ny*oy+nz*oz)。如果我们把 A(ax,ay,az)带入这个平面方程，可得：nx*ax+ny*ay+nz*az-(nx*ox+ny*oy+nz*oz)，提取一下可得 nx*(ax-ox)+ny*(ay-oy)+nz*(az-oz)，不就是法向量 n 与向量 OA 的点乘，因为点乘的另一层函数是两个向量的模乘以夹角的余弦值，因为若点在平面的正面其与法线的夹角必然在 0-90° 之间，因此对应的余弦值肯定在 0-1 之间，因此法向量 n 与向量 OA 的点乘的结果必然大于 0。

同理可得出结论，假设一个平面为 (a,b,c,d)，给定任意一个点 (x,y,z)，若：

ax+by+cz+d>0 则点在平面外  
ax+by+cz+d=0 则点在平面上  
ax+by+cz+d<0 则点在平面内

用代码来表示的话即为：

```
bool IsOutsideThePlane(float4 plane, float3 pointPosition) {
    if(dot(plane.xyz, pointPosition) + plane.w > 0)
        return true;
    return false;
}
```

注：这一部分判断到时候要在 cs 里做，所以不再是 c# 代码了。

## CPU 与 GPU 传递的数据

前面我们说了我们要从 CPU 把所有物体的包围盒信息传递到 cs 中去做视锥剔除判断，但是由于我们的物体虽然都是同一个 Mesh，但是其大小位置旋转可能都不相同，也就是说每个包围盒的顶点的世界坐标都要在 CPU 先通过一系列的运算才能得到。我们可不可以把这些运算也丢到 cs 中呢？当然可以。

大部分情况下，我们相同的物体肯定是相同的包围盒，也就是说在 **Object Space** 中，这些物体的包围盒信息都是相同的，我们可以如下图两个点来描述一个包围盒，其中包围盒的中心就是物体的中心。

![[1bd1c694809a80b89e3337617b84d228_MD5.jpg]]

那么包围盒八点顶点的坐标即为：

float3(boundMin));  
float3(boundMax));  
float3(boundMax.x, boundMax.y, boundMin.z));  
float3(boundMax.x, boundMin.y, boundMax.z));  
float3(boundMax.x, boundMin.y, boundMin.z));  
float3(boundMin.x, boundMax.y, boundMax.z));  
float3(boundMin.x, boundMax.y, boundMin.z));  
float3(boundMin.x, boundMin.y, boundMax.z));

至于 boundMin 以及 boundMax 的取值多少合适呢？我们可以借助 Unity 的 **BoxCollider** 组件来量一下，如下图：

![[7e9400cdcc06749626e209507b80917e_MD5.jpg]]

例如我要绘制这个树，那么它的 boundMin 应该为 (-1.5, 0, -1.5)，而 boundMax 为 (1.5, 7, 1.5)。

接下来怎么把它们转换到 **World Space** 呢？我们只需要使用每个物体从自身坐标转到世界坐标的变换矩阵（localToWorldMatrix）与它们相乘即可，这个矩阵可以通过下面方法来得到：

```
Matrix4x4 localToWorldMatrix = Matrix4x4.TRS(position, quaternion, scale)
```

这样我们就可以在 cs 中计算出每个物体对应的包围盒八个顶点的世界坐标了，并且这样计算出来的包围盒属于 OBB 而非 AABB。

然后我们就可以利用 c# 的 **ComputeBuffer** 将所有物体的 localToWorldMatrix 传递到 cs 的 **StructuredBuffer** 中。

注：在 cs 中不能使用 Buffer<float4x4> 来接收变换矩阵，会有如下报错：

elements of typed buffers and textures must fit in four 32-bit quantities at kernel

当然除了变换矩阵之外，我们还需要传入视锥体六个面的信息用于做剔除判断，以及物体总数的信息，防止越界。

好了，有了这些信息后，我们就可以在 cs 里判断哪些物体是在视椎体之外的。这里还存在着最后一个问题，就是怎么得到保留下来的这些数据，这里我们可以使用 [AppendStructuredBuffer](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/sm5-object-appendstructuredbuffer) 来处理。作为 cs 里面的**输出 Buffer**，我们可以使用其 **Append** 方法，往里面添加我们要输出的数据。

完整的 cs 代码如下：

```
#pragma kernel ViewPortCulling

uint instanceCount;
StructuredBuffer<float4x4> input;
float4 planes[6];
AppendStructuredBuffer<float4x4> cullresult;

bool IsOutsideThePlane(float4 plane, float3 pointPosition)
{
    if(dot(plane.xyz, pointPosition) + plane.w > 0)
        return true;
    return false;
}

[numthreads(640,1,1)]
void ViewPortCulling (uint3 id : SV_DispatchThreadID)
{
    if(id.x >= instanceCount)
        return;
    float4x4 info = input[id.x];
	
    float3 boundMin = float3(-1.5, 0, -1.5);
    float3 boundMax = float3(1.5, 7, 1.5);
    float4 boundVerts[8];//AABB8个顶点坐标
    boundVerts[0] = mul(info, float4(boundMin, 1));
    boundVerts[1] = mul(info, float4(boundMax, 1));
    boundVerts[2] = mul(info, float4(boundMax.x, boundMax.y, boundMin.z, 1));
    boundVerts[3] = mul(info, float4(boundMax.x, boundMin.y, boundMax.z, 1));
    boundVerts[6] = mul(info, float4(boundMax.x, boundMin.y, boundMin.z, 1));
    boundVerts[4] = mul(info, float4(boundMin.x, boundMax.y, boundMax.z, 1));
    boundVerts[5] = mul(info, float4(boundMin.x, boundMax.y, boundMin.z, 1));
    boundVerts[7] = mul(info, float4(boundMin.x, boundMin.y, boundMax.z, 1));

    //如果8个顶点都在某个面外，则肯定在视锥体外面
    for (int i = 0; i < 6; i++)
    {
	for(int j = 0; j < 8; j++)
	{
	    float3 boundPosition = boundVerts[j].xyz;

	    if(!IsOutsideThePlane(planes[i], boundPosition))
		break;
	    if(j == 7)
		return;
	}
    }
    cullresult.Append(info);
}
```

然后我们在 c# 端给 cs 传入需要的数据即可。这里需要注意的是 cs 中的 AppendStructuredBuffer 对应到 c# 中的 ComputeShader 时，其 ComputeBufferType 为 [ComputeBufferType.Append](https://docs.unity3d.com/ScriptReference/ComputeBufferType.Append.html)，并且每次更新数据时需要使用 [SetCounterValue](https://docs.unity3d.com/ScriptReference/ComputeBuffer.SetCounterValue.html) 方法来初始化，最后也是将其传入到渲染用到 Shader 当中。

修改后的 C# 代码如下：

```
public class ExampleClass : MonoBehaviour {

    ......
    public ComputeShader compute;
    ComputeBuffer localToWorldMatrixBuffer;
    ComputeBuffer cullResult;
    List<Matrix4x4> localToWorldMatrixs = new List<Matrix4x4>();
    int kernel;
    Camera mainCamera;

    void Start()
    {
        kernel = compute.FindKernel("ViewPortCulling");
        mainCamera = Camera.main;
        cullResult = new ComputeBuffer(instanceCount, sizeof(float) * 16, ComputeBufferType.Append);
        ......
    }

    void Update() {
        ......
        Vector4[] planes = CullTool.GetFrustumPlane(mainCamera);

        compute.SetBuffer(kernel, "input", localToWorldMatrixBuffer);
        cullResult.SetCounterValue(0);
        compute.SetBuffer(kernel, "cullresult", cullResult);
        compute.SetInt("instanceCount", instanceCount);
        compute.SetVectorArray("planes", planes);
        compute.Dispatch(kernel, 1 + (instanceCount / 640), 1, 1);
        instanceMaterial.SetBuffer("positionBuffer", cullResult);

        Graphics.DrawMeshInstancedIndirect(instanceMesh, subMeshIndex, instanceMaterial,
            new Bounds(Vector3.zero, new Vector3(100.0f, 100.0f, 100.0f)), argsBuffer);
    }
    
    void UpdateBuffers() {
        ......
        if(localToWorldMatrixBuffer != null)
            localToWorldMatrixBuffer.Release();

        localToWorldMatrixBuffer = new ComputeBuffer(instanceCount, 16 * sizeof(float));
        localToWorldMatrixs.Clear();
        for(int i = 0; i < instanceCount; i++) {
            ......
            localToWorldMatrixs.Add(Matrix4x4.TRS(position, Quaternion.identity, new Vector3(size, size, size)));
        }
        localToWorldMatrixBuffer.SetData(localToWorldMatrixs);
        ......
    }

    void OnDisable() {
        localToWorldMatrixBuffer?.Release();
        localToWorldMatrixBuffer = null;

        cullResult?.Release();
        cullResult = null;
        ......
    }
}
```

最后我们只需要修改下官方例子中 Shader 的代码即可，因为简化，没有使用旋转的物体，因此 localToWorldMatrix 矩阵中的 **._14_24_34** 代表的即是物体世界坐标下的位置信息，**._11** 代表的就是缩放的信息。

修改后的 shader 代码如下：

```
Shader "Instanced/InstancedShader" {
    Properties {
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
    }
    SubShader {

        Pass {
            ......
 #if SHADER_TARGET >= 45
	    StructuredBuffer<float4x4> positionBuffer;
 #endif
            ......
            v2f vert (appdata_full v, uint instanceID : SV_InstanceID)
            {
 #if SHADER_TARGET >= 45
                float4x4 data = positionBuffer[instanceID];
 #else
                float4x4 data = 0;
 #endif
                float3 localPosition = v.vertex.xyz * data._11;
                float3 worldPosition = data._14_24_34 + localPosition;
                float3 worldNormal = v.normal;
                ......
            }
            ......
            ENDCG
        }
    }
}
```

这样我们就实现了一个简单的 View Frustum Culling，有什么写的不好地方欢迎大佬们指点迷津~

## BUG 修复

上面的 Demo 中在剔除时会发现视椎体外面还是会有部分**残留**，这里感谢

[@榛果和阿柴](https://www.zhihu.com/people/69f4f715b692efaf87f72e50562fa22d)

帮忙解决了这个问题。

问题的原因在于调用 DrawMeshInstancedIndirect 时，argsBuffer 里面代表渲染数量的值依旧是剔除前的 instanceCount 值。比如说我们要渲染 10000 棵树，剔除后只剩 888 棵能看见，那么 DrawMeshInstancedIndirect 里的数量就应该是 888，而不是 10000。

那么怎么获取剔除后的数量呢？cullResult.count 是不对的，它的值永远是它初始化时的大小。这里我们可以使用 [CopyCount](https://docs.unity3d.com/ScriptReference/ComputeBuffer.CopyCount.html) 方法来获取：

```
ComputeBuffer.CopyCount(ComputeBuffer src, ComputeBuffer dst, int dstOffsetBytes)
```

它可以将某个 append 或 consume 类型的 ComputeBuffer 的实际长度写入到另一个 ComputeBuffer 里，其中 dstOffsetBytes 为偏移的位置。因此我们可以把 cullResult 里的实际数量写到 argsBuffer 中，而由于 argsBuffer 中的第二个参数才是存的数量，所以给它偏移一个 unit 的字节大小。

修改后的代码如下：

```
void Update() {
    ...

    //获取实际要渲染的数量
    ComputeBuffer.CopyCount(cullResult, argsBuffer, sizeof(uint));

    Graphics.DrawMeshInstancedIndirect(instanceMesh, subMeshIndex, instanceMaterial, new Bounds(Vector3.zero, new Vector3(100.0f, 100.0f, 100.0f)), argsBuffer);
}

void UpdateBuffers() {
    ......
    argsBuffer.SetData(args);
}
```

这样在旋转 Camera 的时候就不会出现残留了，如下：

![[222c66647dfcea05af33500e9b4b3ade_MD5.gif]]

修改后还可以发现帧率得到了明显的提升，对比如下：

![[893b635908d3571f914e1c40412a8aad_MD5.jpg]]

![[40e957f443e67fc907ba4c094568f94b_MD5.jpg]]