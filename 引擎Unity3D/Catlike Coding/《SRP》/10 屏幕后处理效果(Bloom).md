![[Pasted image 20230626170453.png]]
## 10｜屏幕后处理效果（Bloom）
![[Pasted image 20230626172735.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/10.%E5%B1%8F%E5%B9%95%E5%90%8E%E5%A4%84%E7%90%86%20%EF%BC%88Bloom%EF%BC%89.1620983535177.png "UWA")

### 10.1 Post-FX Stack（已 yiqi）

屏幕后处理效果（Screen Post-Processing Effects）是游戏开发过程中实现屏幕特效的一种常用方法，通常指的是在渲染完整个场景得到屏幕图像后，再对这个图像进行一系列地操作，来实现各种屏幕特效。它可以为游戏画面添加更多的艺术效果，例如景深、运动模糊、Bloom等等，最终渲染到屏幕中的画面往往叠加了多种屏幕特效，就像栈（Stack）一样。Unity官方提供了一套Post-Processing Stack后处理框架和各种常用的屏幕特效供开发者使用，本节我们将自己搭建一套后处理框架，并实现最常用的Bloom屏幕特效。

**10.1.1 创建资产**

1. 一个项目中可能需要多个Post-FX栈配置，因此我们在Runtime子文件夹下创建一个PostFXSettings脚本，用它来创建PostFXSettings资产作为Post-FX栈的配置。
```cs
using UnityEngine;  
   
[CreateAssetMenu(menuName = "Rendering/Custom Post FX Settings")]  
public class PostFXSettings : ScriptableObject   
{   
}

```
2. 本节我们使用单个Post-FX栈，在CustomRenderPipelineAsset脚本中添加后效的资产配置，并在构建渲染管线实例时作为参数传递给管线。
```

 //后效资产配置  
 [SerializeField]  
 PostFXSettings postFXSettings = default;  
 protected override RenderPipeline CreatePipeline()  
 {  
    return new CustomRenderPipeline(useDynamicBatching, useGPUInstancing, useSRPBatcher, useLightsPerObject, shadows, postFXSettings);  
 }

```
3. 在CustomRenderPipeline脚本中获取并跟踪后效的配置，再在渲染的过程中传递给每个相机的渲染器。
```

PostFXSettings postFXSettings;  
public CustomRenderPipeline(bool useDynamicBatching, bool useGPUInstancing, bool useSRPBatcher, bool useLightsPerObject, ShadowSettings shadowSettings, PostFXSettings postFXSettings)  
{  
    this.shadowSettings = shadowSettings;  
    this.postFXSettings = postFXSettings;  
    ...  
}  
protected override void Render(ScriptableRenderContext context, Camera[] cameras)  
{  
    foreach (Camera camera in cameras)  
    {  
       renderer.Render(context, camera, useDynamicBatching, useGPUInstancing, useLightsPerObject, shadowSettings, postFXSettings);  
    }   
}

```
4. 在CameraRenderer脚本的Render方法中添加该后效配置的参数。
```

public void Render(ScriptableRenderContext context, Camera camera,  
bool useDynamicBatching, bool useGPUInstancing, bool useLightsPerObject,ShadowSettings shadowSettings, PostFXSettings postFXSettings)

```
5. 最后我们在Assets子文件夹下创建一个PostFXSettings资产，并分配给我们渲染管线的后效配置中。
![[Pasted image 20230626172754.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/1.1620790816364.png "UWA")

**10.1.2 栈对象**

1. 我们使用与Lighting和Shadows脚本相同的做法，创建一个PostFXStack.cs脚本来管理后处理效果栈，起初包含CommandBuffer、ScriptableRenderContext、Camera和PostFXSettings对象，并创建一个Setup方法初始化这些对象。
```

using UnityEngine;  
using UnityEngine.Rendering;  
public class PostFXStack  
{  
    const string bufferName = "Post FX";  
    CommandBuffer buffer = new CommandBuffer  
    {  
        name = bufferName  
    };  
    ScriptableRenderContext context;  
   
    Camera camera;  
    PostFXSettings settings;  
    public void Setup(ScriptableRenderContext context, Camera camera, PostFXSettings settings)  
    {  
        this.context = context;  
        this.camera = camera;  
        this.settings = settings;   
    }  
}

```
2. 然后添加一个bool字段用来指示后效栈是否为活动状态，如果PostFXSettings对象没有被配置，则应跳过后处理效果的渲染。
```

public bool IsActive => settings != null;

```
3. 新建一个Render方法用于渲染后处理特效，调用buffer.Blit方法完成对图像的处理并显示到屏幕上。第一个参数对应了源纹理，在屏幕后处理技术中，这个参数通常就是当前屏幕的渲染纹理或上一步处理后得到的渲染纹理。第二个参数是渲染目标，现在我们还没有编写用于处理图像的Shader，所以渲染目标设置为当前渲染相机的帧缓冲区。这里我们传递的是标识符，这些标识符可以以多种格式来提供。这里我们使用整数表示源纹理，使用BuiltinRenderTextureType.CameraTarget用作渲染目标，最后执行命令并清除命令缓冲区。
```

 public void Render(int sourceId)  
  {  
     buffer.Blit(sourceId, BuiltinRenderTextureType.CameraTarget);    
     context.ExecuteCommandBuffer(buffer);  
     buffer.Clear();  
  }

```
4. 接下来在CameraRenderer脚本中创建一个PostFXStack对象，并在Render方法中调用其Setup方法进行初始化。
```

 PostFXStack postFXStack = new PostFXStack();  
 public void Render(ScriptableRenderContext context, Camera camera, bool useDynamicBatching, bool useGPUInstancing, bool useLightsPerObject,ShadowSettings shadowSettings, PostFXSettings postFXSettings)  
 {  
     ...  
     lighting.Setup(context, cullingResults, shadowSettings, useLightsPerObject);  
     postFXStack.Setup(context, camera, postFXSettings);  
     ...   
 }

```
5. 目前我们始终是直接将图像渲染到帧缓冲区中，但我们没有对该缓冲区的控制权，只能写入它们。如果要为后处理特效栈提供源纹理，我们必须创建一个渲染纹理来作为摄像机的中间帧缓冲区，并把它设置为渲染目标，这要在Setup方法清除渲染目标之前进行该操作。
```

static int frameBufferId = Shader.PropertyToID("_CameraFrameBuffer");  
void Setup()  
{  
    context.SetupCameraProperties(camera);  
    //得到相机的clear flags  
    CameraClearFlags flags = camera.clearFlags;   
    if (postFXStack.IsActive)   
    {  
        buffer.GetTemporaryRT(frameBufferId, camera.pixelWidth, camera.pixelHeight,32, FilterMode.Bilinear, RenderTextureFormat.Default);  
        buffer.SetRenderTarget(frameBufferId,RenderBufferLoadAction.DontCare, RenderBufferStoreAction.Store);  
    }   
    ...  
}

```
6. 定义一个Cleanup方法用来释放用于后效的渲染纹理，将lighting的Cleanup调用也放在这里，然后在Render方法中提交渲染命令之前调用Cleanup方法。
```

public void Render(...)   
{  
    ...  
    //绘制Gizmos  
    DrawGizmos();  
   
    if (postFXStack.IsActive)  
    {   
        postFXStack.Render(frameBufferId);  
    }  
   
    Cleanup();  
   
    Submit();   
}  
void Cleanup()  
{  
    lighting.Cleanup();  
   
    if (postFXStack.IsActive)  
    {   
        buffer.ReleaseTemporaryRT(frameBufferId);  
    }   
}

```
现在渲染效果并没有什么变化，不过Frame Debugger中多出来了一个额外的绘制步骤，就是将渲染纹理的内容复制到相机的帧缓冲区中。
![[Pasted image 20230626172813.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/2.1620791239062.png "UWA")

7. 当渲染到中间帧缓冲区时，我们会给渲染纹理填充任意的数据，这在启用Frame Debugger时可以看到此情况。Unity会确保帧调试器在每帧开始时获得清理后的帧缓冲区，但当渲染到我们自己的纹理中时，我们会回避这个问题。它通常会导致我们在上一帧绘制的结果中继续绘制，但不能保证一定会这样做。如果摄像机的ClearFlags属性设置为Skybox或者Solid Color还好，因为保证可以完全覆盖旧的数据，颜色缓冲和深度缓冲都会被清除，但使用Depth only和Don't Clear是做不到的。因此当后处理特效栈被启用时，应当始终清除颜色和深度缓冲，我们在Setup方法中对相机的ClearFlags进行强制设置。
```cs

void Setup()  
{  
    context.SetupCameraProperties(camera);  
    //得到相机的ClearFlags  
    CameraClearFlags flags = camera.clearFlags;  
   
    if (postFXStack.IsActive)  
    {   
        if (flags > CameraClearFlags.Color)  
        {   
            flags = CameraClearFlags.Color;  
        }   
        ...  
    }   
    ...   
 }

```
**10.1.3 Gizmos**

1. 我们目前在同一时刻绘制了所有的Gizmos，但在后处理特效渲染前后Gizmos应该有一些显示区别，因此在CameraRenderer.Editor脚本中我们将DrawGizmos方法一分为二。
```

 // partial void DrawGizmos();  
 partial void DrawGizmosBeforeFX();  
 partial void DrawGizmosAfterFX();  
 //partial void DrawGizmos()   
 //{  
 // if (Handles.ShouldRenderGizmos())   
 // {  
 // context.DrawGizmos(camera, GizmoSubset.PreImageEffects);  
 // context.DrawGizmos(camera, GizmoSubset.PostImageEffects);  
 // }   
 //}  
 //绘制DrawGizmos  
   
 partial void DrawGizmosBeforeFX()  
 {   
    if (Handles.ShouldRenderGizmos())  
     {  
        context.DrawGizmos(camera, GizmoSubset.PreImageEffects);  
     }  
 }   
   
 partial void DrawGizmosAfterFX()  
 {   
     if (Handles.ShouldRenderGizmos())  
     {  
         context.DrawGizmos(camera, GizmoSubset.PostImageEffects);  
     }   
 }

2. 然后在Render方法中根据后处理特效渲染的前后分别渲染它们。

 //绘制Gizmos  
   
 DrawGizmosBeforeFX();  
 if (postFXStack.IsActive)   
 {  
     postFXStack.Render(frameBufferId);   
 }  
 DrawGizmosAfterFX();
```
![[Pasted image 20230626172824.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/3.1620791593794.png "UWA")
![[Pasted image 20230626172825.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/4.1620791607175.png "UWA")

图一是启用了后处理特效栈时的效果，图二是未启用的效果。我们可以发现当后处理特效栈处于启用状态时，3D Gizmos图标不再被物体遮挡，这是因为Scene视图依赖于我们不使用的原始帧缓冲区的深度数据，我们在后面会与后处理特效结合来覆盖深度。

**10.1.4 自定义绘制**

我们当前使用的Blit方法会绘制一个覆盖了整个屏幕空间的由两个三角形组成的四边形网格（这是原来的后处理的做法），但是我们可以通过创建一个将整个屏幕包括在内的大三角形获得相同的结果，超出屏幕部分会由GPU自行裁剪（下面有图），这样工作量会少一些，甚至不需要向GPU发送单个三角形网格，而且可以使用程序来生成它。

这样做的好处有两个：

第一个好处是顶点数量由6个减到了3个，最重要的是消除了四边形的两个三角形相交的对角线，会在渲染流水线的三角形遍历阶段检查每个像素是否被一个三角网格所覆盖。如果被覆盖就生成一个片元，由于四边形有两个三角形，因此沿着对角线重叠的片元将被渲染两次（如下图所示，红色区域片元会被渲染两次），导致渲染效率低下。

第二个好处是可以提高硬件缓存的命中率，两个三角形在光栅化的时候缺乏连贯性，导致缓存预测中断，而单个三角形可以更好地保持本地缓存的连贯性。
![[Pasted image 20230626172833.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/5.1620791667182.png "UWA")

1. 在Shaders子文件夹下创建PostFXStackPasses.hlsl文件用于进行图像的后期处理。期初定义一个Varyings结构体作为片元函数的输入结构，目前仅需包含裁剪空间的顶点坐标和屏幕空间的UV坐标。
```

#ifndef CUSTOM_POST_FX_PASSES_INCLUDED  
#define CUSTOM_POST_FX_PASSES_INCLUDED  
   
struct Varyings   
{  
    float4 positionCS : SV_POSITION;  
    float2 screenUV : VAR_SCREEN_UV;  
};  
   
#endif

```
2. 然后创建一个默认的顶点函数，使用顶点标识符作为参数，这是带有SV_VertexID语义的无符号整数。我们可以使用顶点标识ID生成固定的顶点位置和UV坐标。其中三角形顶点坐标分别为（-1，-1），（-1，3）和（3，-1）,为使可见的 UV 坐标覆盖0到1的范围，则对应的UV坐标为（0，0），（0，2）和（2，0），如下图所示。
![[Pasted image 20230626172846.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/6.1620791735673.png "UWA")
```

Varyings DefaultPassVertex (uint vertexID : SV_VertexID)   
{  
    Varyings output;  
    output.positionCS = float4(vertexID <= 1 ? -1.0 : 3.0,vertexID == 1 ? 3.0 : -1.0,0.0, 1.0);  
    output.screenUV = float2(vertexID <= 1 ? 0.0 : 2.0,vertexID == 1 ? 2.0 : 0.0);  
    return output;  
}

```
3. 创建一个用于拷贝的片元函数，最初返回UV坐标用于调试。
```

float4 CopyPassFragment (Varyings input) : SV_TARGET   
{  
    return float4(input.screenUV, 0.0, 1.0);  
}

```
4. 接下来创建PostFXStack.shader文件，我们保证所有的Pass不剔除任何面，同时也关闭深度写入，然后把Common.hlsl和PostFXStackPasses.hlsl文件include进来，目前只有一个用于拷贝的Pass，给该Pass中添加一个Name指令进行命名，该指令在同一着色器中组合多个Pass时很方便，在Frame Debugger中将使用Pass的命名代替数字序号，以便于观察。最后将Shader放在Hidden菜单中，这样为材质选择着色器时将作为隐藏项保留。

```
Shader "Hidden/Custom RP/Post FX Stack"   
{  
    SubShader  
    {  
        Cull Off  
   
        ZTest Always  
        ZWrite Off   
        HLSLINCLUDE  
          #include "../ShaderLibrary/Common.hlsl"  
          #include "PostFXStackPasses.hlsl"  
        ENDHLSL  
    Pass   
    {  
        Name "Copy"  
   
        HLSLPROGRAM  
          #pragma target 3.5  
          #pragma vertex DefaultPassVertex  
          #pragma fragment CopyPassFragment  
        ENDHLSL  
    }  
  }  
}
```

5. 回到PostFXSettings脚本中，我们定义2个字段用来获取渲染后处理特效时要使用的Shader和材质。其中材质不能与资产一起进行序列化，我们创建一个访问器在需要时动态创建并获取该材质，并将其设置为隐藏且不保存在项目中。而Shader则直接从外部手动链接到我们的资产中。
```

 [SerializeField]  
   
 Shader shader = default;  
   
 [System.NonSerialized]  
   
  Material material;  
    
  public Material Material  
  {   
      get  
      {   
          if (material == null && shader != null)  
          {   
              material = new Material(shader);  
              material.hideFlags = HideFlags.HideAndDontSave;   
          }  
          return material;   
      }  
  }

```
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/7.1620792456626.png "UWA")
![[Pasted image 20230626172859.png]]
6. 通过按名字找到指定Pass比数字序号方便，所以我们在PostFXStack脚本中创建一个Pass枚举，最初只包含Copy Pass。
```

 enum Pass   
 {  
     Copy   
 }
```

7. 现在我们可以定义自己的Draw方法，它需要三个参数，前两个是作为源和目标的渲染目标标识符，以指示从何处绘制到何处。第三个是一个Pass枚举参数。首先将_PostFXSource渲染纹理作用源纹理，再像之前那样将目标作为渲染目标。然后开始绘制三角形，这是通过调用命令缓冲区的DrawProcedural方法来完成的，它需要五个参数，前三个分别是未使用的矩阵、用于后处理特效的材质和指定的Pass。第四个参数指示我们要绘制的形状，这里用MeshTopology.Triangles表示绘制成三角形。第五个参数是我们想要多少个顶点，单个三角形就是3个。最后我们在Render方法中调用这个Draw方法来替换buffer.Blit方法。

```
int fxSourceId = Shader.PropertyToID("_PostFXSource");  
void Draw(RenderTargetIdentifier from, RenderTargetIdentifier to, Pass pass)  
{   
    buffer.SetGlobalTexture(fxSourceId, from);  
    buffer.SetRenderTarget(to, RenderBufferLoadAction.DontCare, RenderBufferStoreAction.Store);  
    buffer.DrawProcedural(Matrix4x4.identity, settings.Material, (int)pass,MeshTopology.Triangles, 3);  
}  
   
public void Render(int sourceId)  
{  
    Draw(sourceId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
    //buffer.Blit(sourceId, BuiltinRenderTextureType.CameraTarget);  
    context.ExecuteCommandBuffer(buffer);  
   
    buffer.Clear();  
}

```
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/8.1620792583871.png "UWA")
![[Pasted image 20230626172908.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/9.1620792609887.png "UWA")
![[Pasted image 20230626172911.png]]
8. 现在应该看到屏幕空间的UV坐标出现在了Scene视图和Game视图中，但反射探针中也能看到。但我们希望后处理特效应该使用在合适的相机中而不是其它任何地方，所以我们在PostFXStack.Setup方法中检查是否相机渲染Game或Scene视图，如果没有，则将后处理特效资产配置设为空，使得该相机停止渲染后处理特效。

```
this.settings = camera.cameraType <= CameraType.SceneView ? settings : null;

```
9. 除此之外，我们还想通过Scene窗口的下拉菜单中切换Post Processing选项来决定禁用或启用后处理特效，也可以同时打开多个Scene窗口，且这些窗口可以单独设置后处理特效的启用。但现在直接切换该Post Processing选项是不起作用的。想要支持此功能，首先把PostFXStack类改成局部类，然后新建一个用于编辑器的PostFXStack.Editor脚本，创建一个ApplySceneViewState方法用来检测我们是否在处理Scene视图相机，如果当前绘制的Scene视图的状态为禁用图像效果，我们则将后处理特效资产配置设为空，来停止对后处理特效的渲染。
![[Pasted image 20230626172916.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/10.1620792647797.png "UWA")

```
using UnityEditor;  
using UnityEngine;  
partial class PostFXStack  
{   
    partial void ApplySceneViewState();  
    
#if UNITY_EDITOR  
   
    partial void ApplySceneViewState()  
    {  
        if (camera.cameraType == CameraType.SceneView &&!SceneView.currentDrawingSceneView.sceneViewState.showImageEffects)  
        {   
            settings = null;  
        }   
    }  
    #endif  
}

10. 最后在PostFXStack.Setup方法的末尾调用该方法。

public partial class PostFXStack  
{  
    ...  
    public void Setup(ScriptableRenderContext context, Camera camera, PostFXSettings settings)  
    {   
        ...  
        ApplySceneViewState();   
    }  
}
```

**10.1.5 拷贝**

1. 我们通过让Copy Pass的片元函数返回不做任何后期处理的源纹理的颜色值来完成这个后处理特效栈。通过定义一个GetSource方法来对声明的源纹理进行采样并返回源颜色。
```

TEXTURE2D(_PostFXSource);  
SAMPLER(sampler_linear_clamp);  
float4 GetSource(float2 screenUV)   
{  
    return SAMPLE_TEXTURE2D(_PostFXSource, sampler_linear_clamp, screenUV);  
}  
float4 CopyPassFragment (Varyings input) : SV_TARGET   
{   
    return GetSource(input.screenUV);  
}

```
2. 因为我们的源渲染纹理没有Mipmap，所以可以用SAMPLE_TEXTURE2D_LOD替换SAMPLE_TEXTURE2D采样方法避开自动Mipmap的选择，并添加一个额外的参数强制选择0级别的Mipmap。
```

return SAMPLE_TEXTURE2D_LOD(_PostFXSource, sampler_linear_clamp, screenUV, 0);

```
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/11.1620793765390.png "UWA")
![[Pasted image 20230626172932.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/12.1620793785655.png "UWA")
![[Pasted image 20230626172934.png]]
3. 我们通过查看Game视图发现最终得到了正确的原始图像，但在某些情况下（通常在Scene视图中）它是倒置的，如上图所示。这取决于图形API以及源和目标的类型，因为某些图形API的屏幕坐标系之间存在着差异，例如OpenGL将屏幕的左下角作为窗口坐标的最小值，而DirectX则将屏幕的左上角作为窗口坐标的最小值。

可以通过判断_ProjectionParams向量的X分量是否为负数，然后手动翻转屏幕UV的Y坐标来解决这个问题。首先需要在UnityInput.hlsl中声明这个_ProjectionParams向量，然后在PostFXStackPasses.hlsl的默认顶点函数中翻转屏幕UV的Y坐标。
```

float4 _ProjectionParams;  
Varyings DefaultPassVertex (uint vertexID : SV_VertexID)   
{  
    ...   
    if (_ProjectionParams.x < 0.0)   
    {   
        output.screenUV.y = 1.0 - output.screenUV.y;  
    }   
    return output;  
}

```
![[Pasted image 20230626172939.png]]

### 10.2 Bloom 

Bloom是游戏开发中最常用的一种全屏后处理特效，它可以模拟真实相机的一种图像效果，让画面中较亮的区域扩散到周围区域中，造成一种朦胧的效果。

**10.2.1 Bloom金字塔**

Bloom的实现原理通常为：根据一个设定阈值提取图像中较亮区域，把它们存储到一张RT中，然后利用高斯模糊对这张纹理进行模糊处理，模糊图像会将明亮的像素渗入到较暗的像素，使其看起来会发光，以此模拟光线扩散的效果，然后将它和原图像进行混合得到最终效果。

**模糊图像的实现有很多种方法，例如均值模糊和中值模糊，以及常用的高斯模糊，不过它们大部分需要使用卷积操作。** 卷积操作一般是指使用一个卷积核（Kernel）对一张图像中的每个像素进行一系列操作。卷积核通常是一个四方形结构（例如2*2、3*3的方形区域），该区域内每个方格都有一个权重值。当对图像中某个像素进行卷积时，我们会把卷积核的中心位置放置于该像素上，翻转核之后再依次计算核中每个元素和其覆盖的图像像素值的乘积并求和，得到的结果就是该位置新的像素值。

一个最简单和最快的模糊图像的方法，就是将图像信息复制到一个宽和高只有原图像一半尺寸的另一个纹理中，Copy Pass的每个样本，最终在四个源像素之间进行采样，并使用双线性滤波平均2X2的像素块。下图是双线性降（下）采样`4*4`到`2*2`的原理图。

 什么是降（下）采样和上采样？

降（下）采样（DownSampling）意为缩小图像（以下统称下采样），生成图像的小尺寸缩略图。若图像尺寸为M*N，对其进行x倍的下采样时，则最终得到一个M/x、N/x尺寸的缩略图，将原图像x*x窗口内的图像编成一个像素，这个像素点的值就是窗口内所有像素的平均值或者最大值。与之对应的还有上采样（UpSampling），意为放大图像，一般采用内插值的方法，即在原有图像像素的基础上在像素点之间采用合适的插值算法插入新的元素。
![[Pasted image 20230626172949.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/14.1620793938436.png "UWA")

​下采样一次只会模糊一点。因此我们重复这个过程，逐步进行下采样，直到达到一个期望水平，从而有效地建立一个纹理金字塔。如下图是带有4个尺寸级别的纹理金字塔，每个级别的纹理尺寸都减半。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/15.1620793982195.png "UWA")
![[Pasted image 20230626172951.png]]
1. 我们需要跟踪后处理特效栈中的纹理，有多少张纹理取决于纹理金字塔有多少个级别，这也取决于原图像的大小。我们在PostFXStack脚本中定义一个最大金字塔级别字段，设置最多有16个纹理级别。

```
const int maxBloomPyramidLevels = 16;

```
2. 为了跟踪这些金字塔中的纹理，我们需要纹理标识符，使用_BloomPyramid0、BloomPyramid1等属性名称，但我们不需要明确地写下所有名称，相反，可以在构造方法中获取纹理标识符，并且只跟踪第一个标识符即可，因为Shader.PropertyToID只需按照请求新属性名称的顺序来分配标识符。这里我们只需要确保同时请求所有标识符，因为数字无论在编辑器还是构建中，其应用程序会话是固定的。
```

 //纹理标识符  
   
 int bloomPyramidId;  
 public PostFXStack()   
 {  
     bloomPyramidId = Shader.PropertyToID("_BloomPyramid0");    
     for (int i = 1; i < maxBloomPyramidLevels; i++)   
     {  
         Shader.PropertyToID("_BloomPyramid" + i);   
     }  
 }

```
3. 接下来定义一个DoBloom方法，用于将Bloom效果应用到传进来的源标识符（源图像）中。首先将摄像机的像素宽高尺寸都减半，然后选择默认渲染纹理格式。最初我们将源纹理数据复制到纹理金字塔中的第一个纹理中，并跟踪这些标识符。
```

 void DoBloom(int sourceId)   
 {  
     buffer.BeginSample("Bloom");    
     int width = camera.pixelWidth / 2, height = camera.pixelHeight / 2;  
     RenderTextureFormat format = RenderTextureFormat.Default;  
     int fromId = sourceId;  
     int toId = bloomPyramidId;  
     buffer.EndSample("Bloom");   
 }
```

4. 然后循环遍历所有金字塔级别，每次迭代都会先检查宽高尺寸是否到了不能再减半的尺寸（即小于1），如果是则终止循环。如果没有获得新的渲染纹理，我们进行申请获取，并将当前源纹理的数据复制到尺寸减半的下一级的渲染纹理中，然后下一级的纹理就作为了新的源纹理，并增加目标纹理标识符，然后再尺寸减半进行下一次迭代。迭代器变量i我们声明在外部，因为后面会用到。
```

 void DoBloom(int sourceId)   
 {  
     ...  
   
     int toId = bloomPyramidId;  
     int i;   
     for (i = 0; i < maxBloomPyramidLevels; i++)  
     {   
         if (height < 1 || width < 1)  
         {   
             break;  
         }  
         buffer.GetTemporaryRT(toId, width, height, 0, FilterMode.Bilinear, format);  
         Draw(fromId, toId, Pass.Copy);  
         fromId = toId;  
         toId += 1;  
         width /= 2;  
         height /= 2;   
     }  
     buffer.EndSample("Bloom");   
 }

```
5. 循环遍历完成后，将最后一级渲染纹理的图像数据拷贝到相机的渲染目标中，然后迭代器反向循环，用于释放我们所有声明的所有渲染纹理。
```

 void DoBloom(int sourceId)   
 {  
     ...  
     Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
     for (i -= 1; i >= 0; i--)  
     {  
         buffer.ReleaseTemporaryRT(bloomPyramidId + i);  
   
     }  
     buffer.EndSample("Bloom");   
 }

```
6. 最后在Render方法中使用我们的DoBloom方法替换测试用的Draw方法。
```

 public void Render(int sourceId)   
 {  
     //Draw(sourceId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
     DoBloom(sourceId);  
   
     context.ExecuteCommandBuffer(buffer);  
     buffer.Clear();  
  }
```

**10.2.2 可配置的Bloom**

现在我们的模糊次数过多，但最终的图像效果基本是一致的，可以通过Frame Debugger进行逐帧观察，可能模糊几次后就可以作为我们想要的最终图像结果了，所以我们希望模糊迭代次数是可以手动配置的，以便有些时候可以使其提前停止。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/16.1620895415340.png "UWA")
![[Pasted image 20230626173011.png]]
1. 可以通过两个方面做到这一点，首先是限制模糊迭代次数，其次是将下采样的纹理尺寸下限设置比较高的值。我们在PostFXSettings脚本中定义一个带有这两种配置选项的BloomSettings结构体，并公开显示在PostFXSettings的资产面板中用于手动调节。
```

 [System.Serializable]  
   
 public struct BloomSettings   
 {  
     [Range(0f, 16f)]  
     public int maxIterations;  
   
     [Min(1f)]  
     public int downscaleLimit;   
 }  
 [SerializeField]  
   
 BloomSettings bloom = default;  
 public BloomSettings Bloom => bloom;

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/17.1620794382903.png "UWA")

2. 在DoBloom方法中获取并使用上述的两个设置属性来限制自己。

 void DoBloom(int sourceId)   
 {  
     buffer.BeginSample("Bloom");  
     PostFXSettings.BloomSettings bloom = settings.Bloom;   
     ...  
     for (i = 0; i < bloom.maxIterations; i++, toId++)   
     {  
         if (height < bloom.downscaleLimit || width < bloom.downscaleLimit)  
         {   
             break;  
         }   
         ...  
     }  
     ...  
 }

```
**10.2.3 高斯滤波**

前面说到高斯模糊使用了卷积操作，它使用的卷积核名为高斯核，这是一个正方形大小的滤波核，其中每个元素的计算都是基于高斯方程：
![[Pasted image 20230626173105.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/18.1620895542368.png "UWA")

​其中δ是标准方差（一般取值为1），x和y分别对应了当前位置到卷积核中心的整数距离。要构建一个高斯核，只需要计算高斯核中各个位置对应的高斯值即可。为了保证滤波后的图像不会变暗，我们需要对高斯核中的权重进行归一化，即让每个权重除以所有权重的和，这样可以保证所有权重的和为1。通俗来说高斯滤波就是对整幅图像进行加权平均的过程，每一个像素点的值，都由其本身和邻域内的其它像素值经过加权平均后得到。因此高斯函数中的e前面的系数实际不会对结果有任何影响。高斯方程很好地模拟了邻域内每个像素对当前处理像素的影响程度：距离越近，影响越大，高斯核维度越高，模糊程度越大。

使用一个N*N的高斯核对图形进行卷积滤波，就需要N*N*W*H（W和H分别是图像的宽和高）次纹理采样，当N的大小不断增加时，采样次数会变多，好在我们可以把这个二维高斯函数拆分成两个一维函数，如下图所示。也就是说可以使用两个一维的高斯核先后进行滤波，它们得到的结果和直接使用二维高斯核是一样的。采样次数只需2*N*W*H次，且两个一维高斯核中包含了很多重复的权重，对于一个大小为5的一维高斯核，实际只需要记录3个权重值即可。
![[Pasted image 20230626173109.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/19.1620794514449.png "UWA")

​可拆分的二维高斯核是如何工作的？

可以通过一个对称的行矩阵乘以其转置矩阵来创建一个N*N的高斯核。
![[Pasted image 20230626173111.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/20.1620794550947.png "UWA")

使用2*2的高斯核进行下采样会产生非常块状的结果。使用较大的高斯核（例如9*9的高斯核）可以大大提高效果。如果我们将其与双线性下采样结合，会将其翻倍到18*18，这也是URP和HDRP将其应用到Bloom的原因。尽管此操作混合了 81 个样本，但我们可以拆分成两个一维的高斯核，这样单行和单列分别只有9个样本，也只需要18次采样。不过每次迭代都需要两次绘制，使用高斯核对图像进行高斯模糊需要使用两个Pass，一个Pass使用竖直方向的一维高斯核对图像进行滤波，另一个Pass则使用水平方向的一维高斯核。

1. 我们先从水平方向的Pass开始，在PostFXStackPasses.hlsl新建BloomHorizontalPassFragment片元函数，首先声明两个数组，一个存储了以当前UV坐标为中心的9个样本的相对偏移值，一个存储了对应样本的权重，从左侧开始的样本权重为0.01621622、0.05405405，、0.12162162和0.19459459，然后中心权重为0.22702703，另一侧权重则进行反转。因为我们同时进行下采样，所以在循环迭代中每个偏移步长都应是源纹素宽度的两倍。最后使用偏移后的UV对源纹理进行采样并把像素值和权重相乘后的结果进行叠加，并返回叠加后的滤波结果。
```

float4 _PostFXSource_TexelSize;  
   
float4 GetSourceTexelSize ()   
{  
    return _PostFXSource_TexelSize;  
}  
float4 BloomHorizontalPassFragment (Varyings input) : SV_TARGET   
{   
    float3 color = 0.0;  
    float offsets[] = {-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0};  
    float weights[] =    
    {  
        0.01621622, 0.05405405, 0.12162162, 0.19459459, 0.22702703,  
        0.19459459, 0.12162162, 0.05405405, 0.01621622  
    };  
    for (int i = 0; i < 9; i++)    
    {  
        float offset = offsets[i] * 2.0 * GetSourceTexelSize().x;  
        color += GetSource(input.screenUV + float2(offset, 0.0)).rgb * weights[i];  
    }   
    return float4(color, 1.0);  
}

```
这些权重值从何而来？

权重源自Pascal三角形，就是著名的杨辉三角_，_它是对二项式系数在三角形中的一种几何排列，它把二项式系数图形化，把组合数内在的一些代数性质直观地从图形中体现出来，是一种离散型的数与形的结合。对于适当的9*9高斯滤波，我们会选择三角形的第九行，即 1 8 28 56 70 56 28 8 1。但是这使得滤波边缘的样本的贡献太弱以至于无法察觉到，所以我们切换到第十三行并切断其边缘，到达66 220 495 792 924 792 495 220 66。这些数字的总和为 4070，因此将每个数字除以总和获得最终权重。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/21.1620895856371.jpg "UWA")
![[Pasted image 20230626173129.jpg]]
2. 在PostFXStack.shader中添加一个在水平方向的进行滤波的Pass，名字为"Bloom Horizontal"，并放在Copy Pass前面定义，作为该着色器的第一个Pass。
```

 Pass   
 {  
     Name "Bloom Horizontal"  
   
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment BloomHorizontalPassFragment  
     ENDHLSL   
 }

```
3. 在PostFXStack.cs的Pass枚举以相同的顺序添加声明新Pass的名字。
```

 enum Pass   
 {  
     BloomHorizontal,  
     Copy  
 }

```
4. 在DoBloom方法中进行下采样时使用BloomHorizontal Pass。
```

 //Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
 Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.BloomHorizontal);

```
5. 现在图像的模糊结果是基于水平拉伸的，我们复制BloomHorizontalPassFragment片元函数，命名为BloomVerticalPassFragment，我们在第一个Pass中已经进行了下采样， 这次我们保持相同的大小来进行竖直方向的高斯滤波，所以纹素大小的偏移量不应该翻倍。
```

float4 BloomVerticalPassFragment (Varyings input) : SV_TARGET   
{   
    float3 color = 0.0;  
    float offsets[] = {-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0};  
    float weights[] =    
    {  
        0.01621622, 0.05405405, 0.12162162, 0.19459459, 0.22702703,  
        0.19459459, 0.12162162, 0.05405405, 0.01621622   
    };  
    for (int i = 0; i < 9; i++)    
    {  
        float offset = offsets[i] * GetSourceTexelSize().y;  
        color += GetSource(input.screenUV + float2(0.0, offset)).rgb * weights[i];  
    }  
    return float4(color, 1.0);  
}

```
6. 在Shader中添加该Bloom Vertical Pass作为着色器的第二个Pass，然后脚本中枚举也添加新Pass的名字。
```

 Pass    
 {  
     Name "Bloom Vertical"  
   
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment BloomVerticalPassFragment  
     ENDHLSL  
 }  
 enum Pass  
 {   
     BloomHorizontal,  
     BloomVertical,  
     Copy  
 }

```
7. 现在我们需要在每个金字塔级别中间多走一步，为此还必须要保留其纹理标识符。可以通过将PostFXStack的构造函数的最大循环次数翻倍来做到这一点，由于我们尚未引入其它着色器属性名称，因此标识符将全部按顺序排列，否则需要重新启动 Unity。
```

 for (int i = 1; i < maxBloomPyramidLevels * 2; i++)   
 {  
     Shader.PropertyToID("_BloomPyramid" + i);   
 }

```
8. 在DoBloom方法中，在每个下采样步骤开始时目标标识符需要增加一个，所以我们每次迭代目标标识符应增加两步，第一步进行下采样和水平方向的高斯滤波，第二步进行竖直方向的高斯滤波。中间纹理可以放置在两者之间。首先水平方向绘制到中间纹理，然后再垂直绘制到渲染目标。当然最后我们还必须释放额外的渲染纹理。
![[Pasted image 20230626173214.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/22.1620896051445.png "UWA")
```

​void DoBloom(int sourceId)  
{   
    ...  
    int toId = bloomPyramidId + 1;  
    int i;  
    for (i = 0; i < bloom.maxIterations; i++)   
    {  
        ...   
        int midId = toId - 1;  
        buffer.GetTemporaryRT(midId, width, height, 0, FilterMode.Bilinear, format);  
        buffer.GetTemporaryRT(toId, width, height, 0, FilterMode.Bilinear, format);  
        Draw(fromId, midId, Pass.BloomHorizontal);  
        Draw(midId, toId, Pass.BloomVertical);   
        fromId = toId;  
        toId += 2;   
        width /= 2;  
        height /= 2;  
    }  
    Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.BloomHorizontal);  
    for (i -= 1; i >= 0; i--)   
    {  
        buffer.ReleaseTemporaryRT(fromId);  
        buffer.ReleaseTemporaryRT(fromId - 1);  
        fromId -= 2;  
    }   
    buffer.EndSample("Bloom");  
 }

```
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/23.1620797916587.png "UWA")
![[Pasted image 20230626173217.png]]
9. 现在我们的下采样滤波已经完成，看起来比简单的双线性滤波要好一些，代价是需要更多的纹理样本，但可以通过使用双线性滤波在高斯采样点之间以适当偏移量来减少样本数量，这样就可以将9个样本减少到5个。我们在BloomVerticalPassFragment片元函数中使用这个方法，偏移的两个方向将变为3.23076923和1.38461538，权重为0.07027027和0.31621622，但我们不能在BloomHorizontalPassFragment片元函数中执行此操作，因为我们已经在该Pass中使用了双线性滤波来进行下采样。其九个样本中每个样本的平均值为2*2源像素。
```

float4 BloomVerticalPassFragment (Varyings input) : SV_TARGET   
{   
    float3 color = 0.0;  
    float offsets[] =    
    {  
        -3.23076923, -1.38461538, 0.0, 1.38461538, 3.23076923  
    };  
    float weights[] =   
    {  
        0.07027027, 0.31621622, 0.22702703, 0.31621622, 0.07027027  
    };  
    for (int i = 0; i < 5; i++)   
    {  
         ...  
    }  
    return float4(color, 1.0);  
}

```
**10.2.4 叠加模糊**

使用Bloom金字塔的顶部作为最终图像产生统一的混合，但它看起来不像什么发光的东西。我们可以通过逐步向上采样回到金字塔底部，在一张图像中累积所有的级别来得到想要的结果。
![[Pasted image 20230626173225.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/24.1620896245807.png "UWA")

​1. 我们可以使用添加混合来组合两个图像，但要对我们所有的Pass通道使用相同的混合模式且添加第二个源纹理，所以我们在PostFXStack脚本中声明该源纹理着色器标识ID。

```
int fxSource2Id = Shader.PropertyToID("_PostFXSource2");
```

2. 在DoBloom方法中迭代完Bloom金字塔后不再直接绘制到相机目标中。相反地，释放上次迭代中用于水平方向绘制的渲染纹理，并将目标设置为用于水平方向绘制的低一个级别的纹理。

 
```
 //Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.BloomHorizontal);  
  buffer.ReleaseTemporaryRT(fromId - 1);  
  toId -= 5;

```
3. 当正向循环迭代结束时，我们进行反向循环迭代，将每个级别的结果作为第二个源，但这只能达到第一个级别，所以我们必须提前停止一步，最后将第二个源纹理的图像信息绘制到相机的渲染目标中。
```

 void DoBloom(int sourceId)  
 {  
     ...  
     for (i -= 1; i > 0; i--)  
     {   
         buffer.SetGlobalTexture(fxSource2Id, toId + 1);  
         Draw(fromId, toId, Pass.Copy);  
         buffer.ReleaseTemporaryRT(fromId);  
         buffer.ReleaseTemporaryRT(toId + 1);  
         fromId = toId;  
         toId -= 2;  
     }  
     buffer.SetGlobalTexture(fxSource2Id, sourceId);  
     Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
     buffer.ReleaseTemporaryRT(fromId);  
     buffer.EndSample("Bloom");   
 }
```

4. 在PostFXStackPasses.hlsl中声明第二个源纹理并定义用于采样该纹理的GetSource2方法。
```

TEXTURE2D(_PostFXSource2);  
float4 GetSource2(float2 screenUV)   
{  
    return SAMPLE_TEXTURE2D_LOD(_PostFXSource2, sampler_linear_clamp, screenUV, 0);  
}
```

5. 定义一个BloomCombinePassFragment片元函数，对两个源纹理进行采样并叠加。

```
float4 BloomCombinePassFragment (Varyings input) : SV_TARGET   
{  
   float3 lowRes = GetSource(input.screenUV).rgb;  
   float3 highRes = GetSource2(input.screenUV).rgb;  
   return float4(lowRes + highRes, 1.0);  
}
```

6. 定义新的Pass命名为BloomCombine，作为着色器的第三个Pass，并在脚本的枚举中添加该名字。

 
```
Pass   
 {  
     Name "Bloom Combine"  
    
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment BloomCombinePassFragment  
     ENDHLSL   
 }  
 enum Pass   
 {  
     BloomHorizontal,  
     BloomVertical,  
     BloomCombine,  
     Copy  
 }
```

7. 在DoBloom方法中上采样时使用新的BloomCombine Pass。

 
```
for (i -= 1; i > 0; i--)   
 {  
     buffer.SetGlobalTexture(fxSource2Id, toId + 1);  
     Draw(fromId, toId, Pass.BloomCombine);  
     ...  
 }  
   
 buffer.SetGlobalTexture(fxSource2Id, sourceId);  
 Draw(fromId, BuiltinRenderTextureType.CameraTarget, Pass.BloomCombine);
```

8. 我们的新方法仅在至少有两次迭代时才有效。如果我们最终只执行一次迭代，那么我们应该跳过整个上采样阶段，并且只需要释放用于第一次水平方向滤波的纹理。

```
void DoBloom(int sourceId)   
{  
    ...   
    if (i > 1)  
    {   
        buffer.ReleaseTemporaryRT(fromId - 1);  
        toId -= 5;  
        for (i -= 1; i > 0; i--)  
        {  
            ...  
        }   
    }  
    else  
    {  
        buffer.ReleaseTemporaryRT(bloomPyramidId);  
    }  
        ...  
}
```

9. 如果最终完全跳过Bloom，需要终止并执行Copy Pass来作为替代。

```
void DoBloom(int sourceId)  
{  
    buffer.BeginSample("Bloom");  
    PostFXSettings.BloomSettings bloom = settings.Bloom;  
    int width = camera.pixelWidth / 2, height = camera.pixelHeight / 2;  
    if (bloom.maxIterations == 0 ||height < bloom.downscaleLimit || width < bloom.downscaleLimit)  
    {  
        Draw(sourceId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
        buffer.EndSample("Bloom");  
        return;  
    }  
    ...  
}

```
**10.2.5 双三次滤波上采样**

虽然高斯滤波会产生平滑的结果，但我们在上采样时仍执行双线性滤波，这可能会使辉光显得像块状。这在原始图像中收缩较高的地方（尤其是在运动时）中最为明显。比如下图中黑色背景上的辉光更显得像块状。
![[Pasted image 20230626173255.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/25.1620798503508.png "UWA")

1. 我们可以通过切换到双三次滤波来平滑结果。对此虽然没有硬件支持，但我们可以使用源码库中Filtering.hlsl文件中定义的SampleTexture2DBicubic方法来解决。我们定义一个GetSourceBicubic方法，在里面调用SampleTexture2DBicubic方法，需要传递源纹理和采样器、屏幕UV坐标以及纹素尺寸_PostFXSource_TexelSize通过ZWXY排序的矢量。除此之外还有一个最大纹理坐标的参数，该参数为1，以及另一个未使用的参数，该参数可以为零。然后在BloomCombinePassFragment方法中采样第一个源纹理时使用双三次滤波进行上采样。
```

#include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Filtering.hlsl"  
float4 GetSourceBicubic (float2 screenUV)   
{  
    return SampleTexture2DBicubic(TEXTURE2D_ARGS(_PostFXSource, sampler_linear_clamp), screenUV,_PostFXSource_TexelSize.zwxy, 1.0, 0.0);  
}  
   
float4 BloomCombinePassFragment (Varyings input) : SV_TARGET   
{  
    float3 lowRes = GetSourceBicubic(input.screenUV).rgb;  
    float3 highRes = GetSource2(input.screenUV).rgb;  
    return float4(lowRes + highRes, 1.0);  
}
```

这样可以得到平滑的辉光。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/26.1620798590942.png "UWA")
![[Pasted image 20230626173304.png]]
​2. 双三次滤波上采样可以产生更好的结果，但需要四个带有权重的纹理样本或一个样本。通过定义一个bool字段来将双三次滤波上采样选项作为可选项，这在URP和HDRP中相当于高质量的Bloom切换选项。

```
bool _BloomBicubicUpsampling;  
float4 BloomCombinePassFragment (Varyings input) : SV_TARGET   
{  
    float3 lowRes;  
    if (_BloomBicubicUpsampling)   
    {  
        lowRes = GetSourceBicubic(input.screenUV).rgb;  
    }  
    else   
    {   
        lowRes = GetSource(input.screenUV).rgb;  
    }  
    ...  
}
```

3. 在PostFXSettings脚本的BloomSettings结构体中添加该切换开关。

 
```
public struct BloomSettings   
 {  
     ...   
     public bool bicubicUpsampling;  
 }
```

​![[Pasted image 20230626173321.png]]

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/27.1620798694733.png "UWA")

4. 然后在进行上采样之前，将切换开关的值传递到着色器中。

```
int bloomBucibicUpsamplingId = Shader.PropertyToID("_BloomBicubicUpsampling");  
void DoBloom(int sourceId)   
{  
    ...  
    buffer.SetGlobalFloat(bloomBucibicUpsamplingId, bloom.bicubicUpsampling ? 1f : 0f);  
    if (i > 1)   
    {  
        ...   
    }  
    ...   
}
```

**10.2.6 一半的分辨率**

由于所有的纹理采样和绘制，Bloom可能需要大量时间才能生成。一种简单的降低成本的方式是以一半的分辨率生成它，这将更改效果的外观，因为实际上相当于跳过了第一次迭代。

1. 首先，在决定跳过Bloom时，应该提前一步考虑，最初检查前应该将最低下限尺寸翻倍。
```

 if (bloom.maxIterations == 0 ||height < bloom.downscaleLimit * 2 || width < bloom.downscaleLimit * 2)  
 {  
     ...  
 }

```
2. 其次，需要为作为新的源纹理的半尺寸纹理声明渲染纹理，它不是Bloom金字塔一部分，因此我们要声明一个新的纹理标识符，我们将它用于预滤波步骤。

```
int bloomPrefilterId = Shader.PropertyToID("_BloomPrefilter");
```

3. 然后在DoBloom方法中，将源纹理信息拷贝到预滤波纹理，并将其作为Bloom金字塔的开始，同时将宽度和高度再次减半。在上采样之前我们不需要预滤波纹理，所以循环迭代后释放它。

```
 void DoBloom(int sourceId)   
 {  
     ...  
     RenderTextureFormat format = RenderTextureFormat.Default;  
     buffer.GetTemporaryRT(bloomPrefilterId, width, height, 0, FilterMode.Bilinear, format);  
     Draw(sourceId, bloomPrefilterId, Pass.Copy);  
     width /= 2;  
     height /= 2;  
   
     int fromId = bloomPrefilterId;  
     int toId = bloomPyramidId + 1;  
     int i;  
     for (i = 0; i < bloom.maxIterations; i++)  
     {  
         ...   
     }  
     buffer.ReleaseTemporaryRT(bloomPrefilterId);  
     ...  
 }
```

**10.2.7 阈值**

现在我们的Bloom效果适用于所有对象，让它们发光。通常我们需要设定一个阈值来提取图像中较亮的区域，对其进行模糊处理后模拟光线扩散的效果。但我们不能突然消除效果中的颜色，因为这会在逐渐过渡的地方引入尖锐的边界，相反应该将颜色乘以一个权重：
![[Pasted image 20230626173336.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/28.1620798865911.png "UWA")

​其中b为亮度，t是配置的阈值，我们使用最大的颜色RGB通道为b，阈值为0时结果总是为1，这将保持颜色不变，随着阈值增加，权重曲线会向下弯曲，在b<=t处为0。由于曲线的形状很像膝盖，它也被称为膝盖曲线。下面是阈值分别为0.25、0.5、0.75和1时的曲线。
![[Pasted image 20230626173339.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/29.1620798889815.png "UWA")

​该曲线在某个角度达到0，意味着虽然过渡比Clamp更平滑，但仍然有一个突然的终止点。我们可以通过改变权重来改变膝盖的形状。
![[Pasted image 20230626173341.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/30.1620896721421.png "UWA")
![[Pasted image 20230626173343.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/31.1620896721486.png "UWA")

其中k是膝盖，为0-1的滑动区间。下图是阈值为1，膝盖分别为0、0.25、0.5、0.15和1时的曲线。
![[Pasted image 20230626173344.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/32.1620798956836.png "UWA")

1. 将阈值和阈值拐点滑块添加到PostFXSettings脚本的Bloomsettings结构体中，将阈值视为Gamma值，因为它在视觉上更直观，在发送到GPU时必须将它转换到线性空间。
```

public struct BloomSettings   
{  
    ...   
    [Min(0f)]  
    public float threshold;  
   
    [Range(0f, 1f)]  
    public float thresholdKnee;   
}

2. 然后在PostFXStack脚本中声明阈值的着色器标识ID。并在Pass的枚举中添加一个BloomPrefilter。

 int bloomThresholdId = Shader.PropertyToID("_BloomThreshold");  
 enum Pass   
 {  
     BloomHorizontal,  
     BloomVertical,  
     BloomCombine,  
     BloomPrefilter,  
     Copy   
 }

```
3. 我们可以在CPU这边计算好权重公式的常数部分，放到向量的四个分量中使得后续在GPU计算更方便。我们后续会在新的BloomPrefilter Pass中使用它，所以也将初始Copy Pass替换为BloomPrefilter Pass，当图像大小减半时将阈值应用到平均的2*2像素中。
![[Pasted image 20230626173355.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/33.1620896757728.png "UWA")
```

​void DoBloom(int sourceId)  
{   
    ...  
    Vector4 threshold;  
    threshold.x = Mathf.GammaToLinearSpace(bloom.threshold);  
    threshold.y = threshold.x * bloom.thresholdKnee;  
    threshold.z = 2f * threshold.y;  
    threshold.w = 0.25f / (threshold.y + 0.00001f);  
    threshold.y -= threshold.x;  
    buffer.SetGlobalVector(bloomThresholdId, threshold);  
   
    RenderTextureFormat format = RenderTextureFormat.Default;  
    buffer.GetTemporaryRT(bloomPrefilterId, width, height, 0, FilterMode.Bilinear, format);  
    Draw(sourceId, bloomPrefilterId, Pass.BloomPrefilter);  
    ...  
}
```

4. 在PostFXStackPasses.hlsl中声明阈值向量定义一个ApplyBloomThreshold方法应用阈值，然后定义一个BloomPrefilterPassFragment片元函数调用该方法。

```
float4 _BloomThreshold;  
   
float3 ApplyBloomThreshold (float3 color)   
{  
    float brightness = Max3(color.r, color.g, color.b);  
    float soft = brightness + _BloomThreshold.y;  
    soft = clamp(soft, 0.0, _BloomThreshold.z);  
    soft = soft * soft * _BloomThreshold.w;  
    float contribution = max(soft, brightness - _BloomThreshold.x);  
    contribution /= max(brightness, 0.00001);  
    return color * contribution;  
}  
   
float4 BloomPrefilterPassFragment (Varyings input) : SV_TARGET   
{  
    float3 color = ApplyBloomThreshold(GetSource(input.screenUV).rgb);  
    return float4(color, 1.0);  
    }
```


5. 最后在PostFXStack.shader中添加一个Bloom Prefilter Pass作为着色器的第四个Pass。

 
```
Pass    
 {  
    Name "Bloom Prefilter"  
   
    HLSLPROGRAM  
      #pragma target 3.5  
      #pragma vertex DefaultPassVertex  
      #pragma fragment BloomPrefilterPassFragment  
    ENDHLSL  
 }
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/34.1620799215921.png "UWA")
![[Pasted image 20230626173411.png]]
**10.2.8 Bloom强度**

1. 最后我们在PostFXSettings脚本中添加一个用于调节Bloom强度的滑块。

 
```
[Min(0f)]  
   
 public float intensity;
```

2. 在DoBloom方法开始时进行检查，如果该强度值小于0则应跳过Bloom。

```
if (bloom.maxIterations == 0 || bloom.intensity <= 0f || height < bloom.downscaleLimit * 2 || width < bloom.downscaleLimit * 2)
```

3. 否则，定义Bloom强度的着色器标识ID，并将强度值传递给GPU，我们在混合图像时应使用它对低分辨率的图像进行加权，因此不需要再使用额外的Pass。除去绘制到相机渲染目标时，其它情况下强度应为1。

```
 int bloomIntensityId = Shader.PropertyToID("_BloomIntensity");  
 void DoBloom(int sourceId)   
 {  
     ...  
     buffer.SetGlobalFloat(bloomIntensityId, 1f);  
     if (i > 1)  
     {  
         ...   
     }  
     else   
     {  
         buffer.ReleaseTemporaryRT(bloomPyramidId);  
     }  
     buffer.SetGlobalFloat(bloomIntensityId, bloom.intensity);  
     ...   
}
```

4. 最后在PostFXStackPasses.hlsl声明Bloom强度属性，并在BloomCombinePassFragment方法中的低分辨率颜色乘以该强度值。

```
float _BloomIntensity;  
float4 BloomCombinePassFragment (Varyings input) : SV_TARGET   
{  
    ...  
    return float4(lowRes * _BloomIntensity + highRes, 1.0);  
}
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/35.1620799352732.png "UWA")![[Pasted image 20230626173422.png]]