---
title: 3 Renderer Feature
aliases: []
tags: []
create_time: 2023-07-02 14:00
uid: 202307021400
banner: "[[Pasted image 20230702140512.png]]"
---

> [!NOTE] 简称
> 下文 Renderer Feature 简称为 RF
> RenderTexture 简称RT


1.  介绍 [URP Renderer Feature | Universal RP | 14.0.8 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/urp-renderer-feature.html)
2.  使用 [Example: How to create a custom rendering effect using the Render Objects Renderer Feature | Universal RP | 14.0.8 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/containers/how-to-custom-effect-render-objects.html)

Render Feature 是一种 Asset，用于向 URP 渲染器添加额外的 Render Pass 并配置其行为。

以下 Render Feature在 URP 中可用：
- [Render Objects 渲染对象](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-features/renderer-feature-render-objects.html)
- [Screen Space Ambient Occlusion  屏幕空间环境光遮蔽](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/post-processing-ssao.html)
- [Decal 贴花](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-feature-decal.html)
- [Screen Space Shadows 屏幕空间阴影](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-feature-screen-space-shadows.html)
- [Full Screen Pass 全屏Pass](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-features/renderer-feature-full-screen-pass.html)

# Render Objects RF
[Render Objects Renderer Feature | Universal RP | 14.0.8 --- 渲染对象渲染器功能](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-features/renderer-feature-render-objects.html)
![[Pasted image 20230702103753.png|500]]
URP 在 DrawOpaqueObjects 和 DrawTransparentObjects Pass 中绘制对象。您可能需要在帧渲染的不同点绘制对象，或者以其他方式解释和写入渲染数据（如 depth 和 stencil）。
Render Objects RF 允许通过特定的重载（overides）在指定的图层、指定的时间来自定义 Draw Objects。

## 透视效果 X-Ray
**实战**：当角色在GameObjects后面时，用不同的材质绘制角色轮廓。
![[character-goes-behind-object.gif]]

使用两个 Render Objects RF（命名为 RF1 和 RF2）：一个用于绘制不被遮挡的颜色，另一个用于绘制被遮挡颜色
1. 创建一个 Layer，命名为 Character
2. 将要渲染的 object 分配给该层，然后将 RF1 的 LayerMask 也设置为该层
3. 创建 Red 材质和 Blue 材质。Object 给与 Red 材质，然后Overides->Blue 材质
4. 我们要实现当角色位于其他游戏对象之后时，渲染器功能才会使用 Blue 材质渲染角色。可以通过深度测试来实现，Depth->DepthTest 设置为 Greater，这样在该 Layer 下深度大的物体绘制在前面。

**当模型复杂时，这样设置可能会发生自透视：**
![[character-depth-test-greater.gif|449]]

### 创建额外的 RF 避免自透视
RF1 的 Event 属性默认为 AfterRenderingOpaques ，Event 属性定义 Unity 从 Render Object RF 注入渲染过程的注入点。在该 RF1 进行渲染之前已经进行了不透明物体的渲染，并将深度值写入了深度缓冲区。执行 RF1 时，Unity 使用“深度测试”属性中指定的条件执行深度测试。

1. Universal Renderer 的 Filtering > Opaque Layer Mask，清除 Character 层旁边的复选标记。![[Pasted image 20230702110513.png|500]]
2. 现在 Unity 不会渲染角色，除非它在游戏对象后面。（因为 RF1 相当于加了一次渲染，虽然渲染器设置的不对该层物体渲染，但是当 RF1 的 Event 触发后，就增加了一次对该层物体的渲染。由于深度测试是 Greater，Zbuffer 默认是无限大，所以在遮挡物体意外是无法通过深度测试的，所以不显示。只有在遮挡物体后面才能通过，显示为 Blue） ![[Pasted image 20230702110612.png|160]]
3. 添加 RF2（虽然都是默认的 Event 条件，但 RF2 执行顺序在 RF1 之后），LayerMask 选择 Character 层，可以发现，都被渲染为 red（RF1 选择了 Equal 作为深度测试条件，所以此时深度缓冲区都是较大值。新建的 RF2 默认是 Less Equal，渲染时与上次 RF1 渲染的重合部分深度相等，上次未显示部位深度小于无限大，所以物体通过深度测试，以本身的 Red 颜色显示出来）![[Pasted image 20230702113031.png]]
4. 关闭 RF1 的深度写入，那么当 RF2 渲染时，遮挡物后面由于角色深度小于遮挡物，不通过测试，所以不会覆盖 RF1 绘制的 Blue。遮挡物外面通过测试，显示为 Red。这样就完成了！![[character-goes-behind-object 1.gif]]

# Full Screen RF
![[Pasted image 20230702134053.png|450]]
**Full Screen PF 允许在预定义的注入点（injection point）注入全屏渲染 Pass，以创建全屏效果。** 

- **Pass Material**：影响全屏 pass 的材质，必须为 Fullscreen Shader Graph 创建的材质。
[[4 后处理#自定义后处理]]
- **Injection Point 注入点：**
    1. **Before Rendering Transparents**：渲染透明体之前，在 skybox pass 之后和 transparents pass 之前添加效果。
    2. **Before Rendering Post Processing**: 渲染后处理前：在 Transparent Pass 之后和 post-processing pass 之前添加效果。
    3. **After Rendering Post Processing**：渲染后处理后：在 post-processing pass 之后和 AfterRendering pass 之前添加效果。

- **Requirements 要求：** 选择以下一个或多个 Pass 以供 RF 使用：  
    - **Depth**：添加 depth prepass（深度预处理） 以启用深度值的使用。 
    - **Normal**: 启用法线矢量数据的使用。
    - **Color**: 将屏幕的颜色数据复制到着色器内部的 `_BlitTexture` 纹理。
    - **Motion**: 启用运动矢量的使用 

## 手写 Full Screen shader 材质
```cs
Shader "CustomPostProcessing/ColorBlit"
{
    Properties {}

    SubShader
    {
        Tags
        {
            "RenderPipeline" = "UniversalPipeline"
            "RenderType"="Opaque"
        }
        
        LOD 100
        ZWrite Off Cull Off
        
        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        CBUFFER_START(UnityPerMaterial)
        
        CBUFFER_END

        TEXTURE2D_X(_BlitTexture);
        SAMPLER(sampler_BlitTexture);
        float _Intensity;
        
        struct Attributes
        {
            uint vertexID : SV_VertexID;
        };

        struct Varyings
        {
            float4 positionCS : SV_POSITION;
            float2 uv : TEXCOORD0;
        };
        ENDHLSL

        Pass
        {
            Name "ColorBlit"
            Tags
            {
                "LightMode" = "UniversalForward"
            }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            Varyings vert(Attributes i)
            {
                Varyings o = (Varyings)0;
                o.positionCS = GetFullScreenTriangleVertexPosition(i.vertexID);
                o.uv = GetFullScreenTriangleTexCoord(i.vertexID);

                return o;
            }

            float4 frag(Varyings i) : SV_Target
            {
                float4 color = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, i.uv);
                return color * float4(0, _Intensity, 0, 1.0);
            }
            ENDHLSL
        }
    }
}
```
# Decal RF
![[Pasted image 20230702102255.png]]

**创建步骤：**
1. URP Renderer 添加 Decal RF
2. 创建一个材质，并为其指定 `Shader Graphs/Decal` 着色器。添加贴图 ![[Pasted image 20230702100652.png|350]]
3. 右键创建贴画投影仪对象 Rendering->Decal Projector
4. 另一种 Decal 的方式：直接创建一个 Quad 当做贴花

**RF设置：**
![[Pasted image 20230702101203.png]]
- **Technique：**
    - **自动（Automatic）**：Unity 根据构建平台自动选择渲染技术。
    - **贴花缓冲区（DBuffer）**：Unity 将贴花渲染到**贴花缓冲区（DBuffer）** 中。在不透明渲染期间，Unity 将 DBuffer 的内容覆盖在不透明对象的顶部。
        - **Surface Data：**
            - Albedo：贴花会影响 BaseColor 和自发光颜色
            - Albedo Normal：贴花会影响基础颜色、自发光颜色和法线。
            - Albedo Normal MAOS：贴花会影响基础颜色、自发光颜色、法线、金属度值、光滑度值和环境光遮蔽值。
        - **限制：**
            - 该技术需要DepthNormal预处理，这使得该技术在实现基于瓦片的渲染的GPU上效率较低。
            - 此技术不适用于粒子和地形细节
    - **屏幕空间（Screen Space）**：使用 Unity 从深度纹理重建的法线**在不透明对象之后渲染贴花**。Unity 将贴花渲染为不透明网格顶部的网格。此技术仅支持法线混合。
        - Normal Blend：
            - Low：Unity在重建法线时获取一个深度样本。
            - Medium：获取三个深度样本
            - High：获取五个深度样本

**注意：**
1. 贴花投影在透明曲面上不起作用。
2. 不支持 SRP Batcher，因为它们使用了 Material property blocks。为了减少绘制调用的数量，可以使用 GPU Instancing 将贴花批处理在一起。如果场景中的贴花使用相同的“材质”，并且“材质”已启用“启用 GPU 实例化”属性，则 Unity 会实例化材质并减少绘制调用的次数。
3. 若要减少贴花所需的材质数量，请将多个贴花纹理放入一个纹理（图集）中。使用贴花投影仪上的 UV 偏移特性来确定要显示图集的哪个部分。


# 自定义 URP
## beginCameraRendering 事件 
Unity 在每帧中渲染每个激活的 Camera 之前引发一个 `beginCameraRendering` 事件。
>如果相机处于失活状态（去掉勾），Unity 不会为此相机引发 `beginCameraRendering` 事件。

订阅此事件的方法时，可以在 Unity 渲染 Camera 之前执行自定义逻辑（比如将额外的 Camera 渲染为 RT，以及将这些纹理用于平面反射或监视摄影机视图等效果。）
[RenderPipelineManager](https://docs.unity3d.com/ScriptReference/Rendering.RenderPipelineManager.html) 类中的其他事件提供了更多自定义 URP 的方法。

**如何为 `beginCameraRendering` 事件订阅方法？**
将下面的脚本拖放到一个 gameobject 即可使用：
```cs
public class URPCallbackExample : MonoBehaviour
{
    //依附的GameObject对象每次激活时调用（打勾）
    private void OnEnable()
    {
        //订阅方法
        //添加 WriteLogMessage 作为 RenderPipelineManager.beginCameraRendering 事件的委托
        RenderPipelineManager.beginCameraRendering += WriteLogMessage;
    }

    //依附的GameObject对象每次失活时调用（去掉勾）
    private void OnDisable()
    {
        //移除 WriteLogMessage 作为 RenderPipelineManager.beginCameraRendering 事件的委托
        RenderPipelineManager.beginCameraRendering -= WriteLogMessage;
    }
    
    // 当此方法是 RenderPipeline.beginCameraRendering 事件的委托时，Unity 每次引发 beginCameraRendering 事件时都会调用此方法
    void WriteLogMessage(ScriptableRenderContext context, Camera camera)
    {
        Debug.Log($"Beginning rendering the camera: {camera.name}");
    }
}
```

## 自定义 Render Feature
视频：[Unlocking The Power Of Unity's Scriptable Render Pipeline - YouTube](https://www.youtube.com/watch?v=9fa4uFm1eCE)
教程：[Custom Renderer Features | Cyanilux](https://www.cyanilux.com/tutorials/custom-renderer-features/)


> [!NOTE] Blit
>block transfer (块传输)， **blit 操作是将源纹理复制到目标纹理的过程。**

> [!bug] 
> 避免在 URP 项目中使用 [ Rendering.CommandBuffer.Blit](https://docs.unity3d.com/2022.1/Documentation/ScriptReference/Rendering.CommandBuffer.Blit.html) API。
> **应该使用使用 [Blitter](https://docs.unity3d.com/Packages/com.unity.render-pipelines.core@14.0/api/UnityEngine.Rendering.Blitter.html) API **

```cs
Blitter.BlitCameraTexture(cmd, src,dest,material,passindex); 
//1 使用BlitTexture方法将src传入_BlitTexture纹理，源码：
//s_PropertyBlock.SetVector(BlitShaderIDs._BlitScaleBias, scaleBias);  
//s_PropertyBlock.SetTexture(BlitShaderIDs._BlitTexture, source);

//2 材质渲染结果输出到dest，并将dest设为渲染目标
```

**渲染时，我们需要确保不会对同一纹理/目标进行读取和写入，因为这可能会导致“意外行为”（引用 `CommandBuffer.Blit` 文档）。因此，如果源/目的地需要相同，我们实际上需要使用两个 blit，中间有一个额外的目标。**

- @ **`CustomRenderFeature` 自定义 RF**
1. **`Create` ：Unity 对以下事件调用此方法：**
    - 首次加载 RF 时
    - 在 RF 的 Inspector 中更改属性时
    - 启用或禁用 RF 时
2. **`AddRenderPasses` ：Unity 每台相机每帧调用一次此方法**。使用此方法可以将 `ScriptableRenderPass` 实例注入到可编程的渲染器中。

- @ **`CustomRenderPass` 自定义 Render Pass**
    1. **`OnCameraSetup`：在渲染相机之前调用之前被调用。** 它可用于配置 Render Target 和它们的 Clear State，还可以创建临时渲染目标纹理。当为空时，该 Render Pass 将渲染到活动相机的 Render Target。（不要调用 CommandBuffer.SetRenderTarget. 而应该是 `ConfigureTarget` 和 `ConfigureClear`）
    2. **`Configure`**:在执行RenderPass之前调用，功能同OnCameraSetup
    3. **`Execute`：每帧执行，在这里实现渲染逻辑。** 使用 ` ScriptableRenderContext` 发出绘制命令或执行命令缓冲区。不必调用 submit 指令，渲染管线将在管线中的特定点调用它。
        1. `ProfilingSampler`：CPU 和 GPU 分析采样器的包装器。将此与 `ProfileScope` 一起使用可以评测一段代码。标记 Profiling 后，可在 FrameDebugger 中直接查看标记 Profiling 的对象
        2. `DrawRenderer`：批量绘制对象
    4. **`OnCameraCleanup`** ：相机堆栈中的所有相机都会调用，释放创建的资源
    5. `OnFinishCameraStackRendering`：渲染完相机堆栈中的最后一个相机后调用一次，释放创建的资源

```cs file:RF模板
public class CustomRenderFeature : ScriptableRendererFeature
{
    class CustomRenderPass : ScriptableRenderPass
    {
        // 在执行 render pass 之前被调用。
        public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
        {
        }

        // 每帧执行，这里可以实现渲染逻辑
        public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
        {
            //CPU和GPU分析采样器的包装器。将此与ProfileScope一起使用可以评测一段代码。
            //标记Profiling后，可在FrameDebugger中直接查看标记Profiling的对象
            ProfilingSampler mProfilingSampler = new ProfilingSampler("Test1");
            //获取新的命令缓冲区并为其指定一个名称
            
            CommandBuffer cmd = CommandBufferPool.Get("Test1 Cmd");
            
            //ProfilingScope
            using (new ProfilingScope(cmd, mProfilingSampler))
            {
                
                //执行命令缓冲区中的命令
                context.ExecuteCommandBuffer(cmd);
                
                //释放命令缓冲区
                CommandBufferPool.Release(cmd);
            }
        }
        // 清理在此render pass执行期间创建的所有已分配资源。
        public override void OnCameraCleanup(CommandBuffer cmd)
        {
        }
    }

    CustomRenderPass m_ScriptablePass;

    /// <inheritdoc/>
    public override void Create()
    {
        //创建CustomRenderPass实例
        m_ScriptablePass = new CustomRenderPass();

        // 配置render pass插入的位置
        m_ScriptablePass.renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
    }

    // 这里你可以在渲染器中插入一个或多个render pass
    // 在每个摄像机设置一次渲染器时调用此方法。
    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
    {
        //入队渲染队列
        renderer.EnqueuePass(m_ScriptablePass);
    }
}
```

### 案例
本例中 RF 将镜头光斑绘制为一个 Quad 上的纹理，这里我将两个类分开了。

```cs
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class CustomRenderFeature : ScriptableRendererFeature
{
    private CustomRenderPass _customRenderPass;
    public Material material;
    public Mesh mesh;
    
    public override void Create()
    {
        _customRenderPass = new CustomRenderPass(material, mesh);
        
        //更改渲染顺序，在渲染天空盒之后渲染自定义渲染pass，这样天空盒就不会覆盖渲染的光斑了
        _customRenderPass.renderPassEvent = RenderPassEvent.AfterRenderingSkybox;
    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
    {
        if(material!=null && mesh!=null)
        {
            renderer.EnqueuePass(_customRenderPass);
        }
    }
}

```


```cs
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class CustomRenderPass : ScriptableRenderPass
{
    private Material _material;
    private Mesh _mesh;

    public CustomRenderPass(Material material, Mesh mesh)
    {
        _material = material;
        _mesh = mesh;
    }
        
    public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
    {
        //获取新的命令缓冲区并为其指定一个名称
        CommandBuffer cmd = CommandBufferPool.Get(name: "CustomRenderPass");
        
        //获取相机
        Camera camera = renderingData.cameraData.camera;
        //设置投影矩阵，以便 Unity 在屏幕空间中绘制四边形
        cmd.SetViewProjectionMatrices(Matrix4x4.identity, Matrix4x4.identity);
        //比例变量，使用摄像机纵横比作为 y 坐标
        Vector3 scale = new Vector3(1, camera.aspect, 1);
        //在Light的屏幕空间位置为每个Light绘制一个四边形。
        foreach (VisibleLight visibleLight in renderingData.lightData.visibleLights)
        {
            Light light = visibleLight.light;
            
            //将每个光源的位置从世界转换为viewport空间
            Vector3 position = camera.WorldToViewportPoint(light.transform.position) * 2 - Vector3.one;
            //将quad的 z 坐标设置为 0，以便 Uniy 将它们绘制在同一平面上。
            position.z = 0; 
            
            //绘制quad
            cmd.DrawMesh(_mesh, Matrix4x4.TRS(position,Quaternion.identity, scale), _material, 0, 0);
        }
        
        //执行命令缓冲区中的命令
        context.ExecuteCommandBuffer(cmd);
            
        //释放命令缓冲区
        CommandBufferPool.Release(cmd);
    }
}
```

# RTHandle 系统

> [!NOTE] Title
> 本质上是一种特殊类型的 RT，它会随着摄像机大小自动缩放，从而在使用不同相机进行那个渲染时获得更好的性能和更少的内存消耗

Render Target 管理是任何渲染管道的重要组成部分。在复杂的渲染管道中，有许多相互依赖的 Rendr Pass 使用许多不同的 RT，因此重要的是要有一个可维护和可扩展的系统，以便轻松管理内存。 
最大的问题之一是当渲染管道使用许多不同的摄影机，每个摄影机都有自己的分辨率时。例如，离屏摄像头或实时反射探针。在这种情况下，如果系统为每个摄影机独立分配 RT，则内存总量将增加到无法管理的级别。
这对于使用许多中间 RT 的复杂渲染管道来说尤其糟糕。Unity 可以使用临时临时渲染纹理 temporary render textures，但不幸的是，它们不适合这种情况，因为只有当新渲染纹理使用完全相同的属性和分辨率时，临时渲染纹理才能重用内存。这意味着，当使用两种不同的分辨率进行渲染时，Unity 使用的内存总量是所有分辨率的总和。
为了解决渲染纹理内存分配的这些问题，Unity 的 SRP 包含了 RTHandle 系统。
## RTHandle 基本原理
RTHandle 系统是 Unity 的 [RenderTexture](https://docs.unity3d.com/ScriptReference/RenderTexture.html) API 之上的一个抽象层，可以自动 RT 管理。可以可以在使用各种分辨率的摄影机之间重用 RT。

 RTHandle 系统基础：
1. 您不再为自己分配具有固定分辨率的 RT。相反，您可以使用与给定全屏分辨率下的**比例（scale）** 来声明渲染纹理。RTHandle 系统仅为整个渲染管道分配一次纹理，以便可以将其重新用于不同的摄影机。
2. 现在有了 **reference size** （参考尺寸）的概念。这是应用程序用于渲染的分辨率。**您有责任在渲染管道以特定分辨率渲染每个摄影机之前声明它**。有关如何执行此操作的信息，请参阅 [Updating the RTHandle system](https://docs.unity3d.com/Packages/com.unity.render-pipelines.core@14.0/manual/rthandle-system-fundamentals.html#updating-the-rthandle-system)。
3. 在内部，RTHandle 系统跟踪您声明的最大 reference size。它将其用作渲染纹理的实际大小。最大 reference size 是最大大小。
4. 每次声明新的 reference size 用于渲染，RTHandle 系统都会检查它是否大于当前记录的最大 reference size。如果是，RTHandle 系统会在内部重新分配所有 RT 以适应新的大小，并用新的大小替换最大的 reference size。
5. **RTHandleSystem 还允许您分配具有固定大小的纹理。在这种情况下，RTHandle 系统不再重新分配纹理。这允许您对 RTHandle 系统管理的自动调整大小的纹理和常规固定大小的纹理一致地使用 RTHandle-API。**

这个过程的一个例子如下：分配 main color buffer 时，它使用 1 的比例，因为它是全屏纹理。您希望以屏幕的分辨率进行渲染。四分之一分辨率 transparency pass 的 downscaled buffer 将对 x 轴和 y 轴使用 0.5 的比例。**在内部，RTHandle 系统使用最大 reference size 乘以为 RT 声明的比例来分配渲染纹理**。之后，在每次“摄影机”渲染之前，您会告诉系统当前的 reference size。基于此和所有纹理的缩放因子（scaling factor），RTHandle 系统会确定是否需要重新分配渲染纹理。如上所述，如果新 reference size 大于当前最大 reference size，则 RTHandle 系统会重新分配所有渲染纹理。通过这样做，RTHandle 系统最终会为所有 RT 提供稳定的最大分辨率，这很可能是主摄影机的分辨率。 
**关键是渲染纹理的实际分辨率不一定与当前视口相同：它可以更大**。当您使用 RTHandles 编写渲染器时，这会产生影响， [Using the RTHandle system](https://docs.unity3d.com/Packages/com.unity.render-pipelines.core@14.0/manual/rthandle-system-using.html) 对此进行了解释。

## 使用方法

新接口：
1.  `ScriptableRenderer.cameraColorTargetHandle`
2. 通过以下辅助函数，可以使用 `RTHandle` 系统创建和使用临时RT ( 舍弃 GetTemporaryRT 方法 )RT
    - `RenderingUtils.ReAllocateIfNeeded`
    - `ShadowUtils.ShadowRTReAllocateIfNeeded`
3. `cameraDepthTarget` 属性必须与 `cameraColorTarget` 属性分开。
4. 如果渲染目标在应用程序的生存期内没有更改，使用 `RTHandles.Alloc` 方法分配 `RTHandle` 目标。
5. 如果渲染目标是全屏纹理，这意味着其分辨率与屏幕分辨率匹配或只是屏幕分辨率的一小部分，请使用诸如 `Vector2D.one` 之类的缩放因子来支持动态缩放。

```cs file:示例
public class CustomPass : ScriptableRenderPass
{
    RTHandle m_Handle;
    // 然后使用RTHandles，Color和Depth属性必须分开
    RTHandle m_DestinationColor;
    RTHandle m_DestinationDepth;

    void Dispose()
    {
        m_Handle?.Release();
    }

    public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
    {
        var desc = renderingData.cameraData.cameraTargetDescriptor;
        desc.depthBufferBits = 0;
        //分配RTHandle
        RenderingUtils.ReAllocateIfNeeded(
            ref m_Handle,
            desc,
            FilterMode.Point,
            TextureWrapMode.Clamp,
            name: "_CustomPassHandle");
    }

    public override void OnCameraCleanup(CommandBuffer cmd)
    {
        m_DestinationColor = null;
        m_DestinationDepth = null;
    }

    public void Setup(RTHandle destinationColor, RTHandle destinationDepth)
    {
        m_DestinationColor = destinationColor;
        m_DestinationDepth = destinationDepth;
    }

    public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
    {
        CommandBuffer cmd = CommandBufferPool.Get();
        
        //设置渲染目标
        CoreUtils.SetRenderTarget(
            cmd, 
            m_DestinationColor, 
            m_DestinationDepth,
            clearFlag, 
            clearColor);
        
        context.ExecuteCommandBuffer(cmd);
        CommandBufferPool.Release(cmd);
    }
}

```

# 自定义后处理
URP 包括后处理效果的集成实现。如果使用 URP，则无需安装用于后期处理效果的额外软件包。URP 与 [Post Processing Stack v2](https://docs.unity3d.com/Packages/com.unity.postprocessing@latest/index.html) 包不兼容。
URP 使用 [Volume](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/Volumes.html) 框架进行后期处理效果。

[Effect List | Universal RP | 14.0.8 --- 效果列表|通用RP | 14.0.8 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/EffectList.html)

## 配置
1. Main Camera->Rendering->勾选 Post processing
2. 右键 > 创建 Volume->创建 Profile 
3. 通过 Add Override 添加后处理效果
 ![[Pasted image 20230702141356.png|450]]
- **Mode**
    - Global：影响所有 camera
    - Local：影响碰撞器边界内的 camera  ![[Pasted image 20230702143135.png|450]]
- **Weight：** 对场景的影响程度。URP 将此乘数应用于它使用“摄影机位置”和“混合距离”计算的值。
- Priority：URP 使用此值来确定在多个 Volumes 对 Scene 具有同等影响时使用的 Volumes。URP 首先使用优先级较高的卷。
- Profile：配置文件，通过 Add Overide 添加的后处理配置都保存在这 

在运行时，URP 会遍历场景中连接到活动游戏对象的所有已启用的 Volumes 组件，并确定每个 Volumes 对最终场景设置的贡献。URP 使用“摄影机位置”和 Volumes 组件属性来计算贡献。URP 对所有 Volumes 中具有非零贡献的值进行**插值**，以计算最终特性值。  

---

**移动设备注意：**
后期处理效果可能会占用大量 frame time。如果你在移动设备上使用 URP，默认情况下，这些效果是最“mobile-frendly”的：
- Bloom（禁用**High Quality Filtering**）
- Chromatic Aberration 色差（翻译：多彩的像差）
- Color Grading 颜色分级
- Lens Distortion 透镜畸变
- Vignette 暗角
- depth-of field 景深，对低端设备使用高斯 Gaussian 景深。对于控制台和桌面平台，使用 Bokeh 景深。
- anti-aliasing 抗锯齿，对于移动平台 Unity 使用 FXAA。

---

**HDR 输出（我的显示器不支持）：**
   [High Dynamic Range (HDR) Output | Universal RP | 14.0.8 --- 高动态范围（HDR）输出](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/post-processing/hdr-output.html)
高动态范围内容比标准清晰度内容具有更宽的色域和更大的亮度范围。URP 可以为支持该功能的显示器输出 HDR 内容。

激活 HDR 步骤：
1. URP Asset->Quality->HDR
2.  Edit > Project Settings > Player >Other Settings ->Allow HDR Display Output (默认关闭)

## Fullscreen Shader Graph
URP 允许使用 FullScreenPass RF 创建自定义后处理效果
必须创建 Fullscreen Shader Graph 才能创建自定义后处理效果。

1. Create -> Shader Graph -> URP -> Fullscreen Shader Graph
2. 添加 **URP Sample Buffer** 节点
3. **Source Buffer** 选择 **BlitSource**
   ![[Pasted image 20230702145615.png|329]]
4. 自定义一些后处理算法后，保存并创建 **Material** 
5. 然后将创建的材质添加到 FullPassScreen RF 中的 **Pass Material** 即可

## Volume 扩展


Ubershader 负责处理 Volume 设置

试试 Alloc 来创建 RT ，再创建临时RT ![[Pasted image 20230731143810.png]]
![[Pasted image 20230731144249.png]]
![[Pasted image 20230731144321.png]]

Volume 传入Execute
![[Pasted image 20230731144009.png]]
访问变量 ![[Pasted image 20230731144150.png]]

乒乓blit
![[Pasted image 20230731144433.png]]

RT 存入 shader
![[Pasted image 20230731144506.png]]
将 Volume 同步变量传入 shader
![[Pasted image 20230731144802.png]]

