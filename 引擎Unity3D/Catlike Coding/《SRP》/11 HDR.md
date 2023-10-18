![[Pasted image 20230626170511.png]]
## 11｜HDR
![[Pasted image 20230626173430.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/11.HDR.1620983559339.png "UWA")

### 11.1 HDR

目前为止我们渲染摄像机时一直使用的是低动态颜色范围（Low Dynamic Range，LDR），这是默认设置，所有颜色通道都被限制在[0，1]内，即使在着色器中生成超出此范围的结果，GPU也会在存储颜色时限制它们。通过帧调试器检测每个Draw Call的渲染目标类型，普通相机的目标描述为B8G8R8A8_SRGB。这意味着它是一个RGBA缓冲区，每个通道有8位，因此每个像素是32位。此外RGB通道存储在sRGB色彩空间中，当在线性色彩空间工作时，GPU在读取和写入缓冲区时会自动在两个空间转换，渲染完成后，缓冲区将结果发送到显示器，显示器将其解释为sRGB颜色数据。

动态范围的含义是指最高的和最低的亮度值之间的比值，真实世界里一个场景中最亮（比如太阳光）和最暗（比如影子）的区域范围可以非常大，这些范围远超过图像或显示器能够显示的范围，显示器的颜色缓冲每个通道精度是8位，意味着只能使用256种不同亮度来表示真实世界所有亮度，但高动态范围（High Dynamic Range，HDR）使用了远超过8位的精度来记录亮度信息，从而可以更精确地反映最真实的光照环境。尽管最后还是需要把信息转换到显示设备使用的LDR内，但可以使用色调映射（Tone Mapping）技术来控制这个转换过程，不仅做到了亮的物体可以非常亮，暗的物体可以非常暗，同时又可以看到两者之间的细节。

**11.1.1 HDR反射探针**

HDR渲染需要HDR渲染目标。这不仅适用于普通摄像机，也适用于反射探针。反射探针是否包含HDR数据或LDR数据可以通过其HDR切换选项进行控制，该选项默认启用。
![[Pasted image 20230626173436.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/1.1620801650970.png "UWA")

当反射探针使用HDR时，它可以包含高强度的颜色，这些颜色大部分是它捕获的镜面反射颜色。可以通过它们在场景中造成的反射间接观察它们。不完美的反射会削弱探针的颜色，这使得HDR值更容易观察，下图是启用和禁用HDR的反射对比。
![[Pasted image 20230626173437.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/2.1620801674747.png "UWA")
![[Pasted image 20230626173439.png]]
​

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/3.1620801690500.png "UWA")

**11.1.2 HDR相机**

摄像机组件也带有HDR配置选项，但它本身不做任何事情，可以将其设置为Off或者Use Graphics Settings，如果设置为Use Graphics Settings仅表示相机允许HDR渲染，但是否使用HDR渲染由渲染管线决定，如果管线允许，场景就会被渲染到一个HDR的图像缓冲中，这个缓冲的精度范围可以远远超过0~1，最后可以通过色调映射屏幕后处理技术把HDR图像转换到LDR图像进行显示。
![[Pasted image 20230626173442.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/4.1620801715996.png "UWA")

​1. 我们在CustomRenderPipelineAsset脚本中添加一个切换开关来控制渲染管线是否允许使用HDR，并在管线实例化的时候作为构造参数传入。

```
 //HDR设置  
   
 [SerializeField]  
 bool allowHDR = true;  
 //重写抽象方法，需要返回一个RenderPipeline实例对象  
 protected override RenderPipeline CreatePipeline()   
 {  
     return new CustomRenderPipeline(allowHDR, useDynamicBatching, useGPUInstancing, useSRPBatcher, useLightsPerObject, shadows, postFXSettings);  
 }
```

2. 在CustomRenderPipeline脚本中跟踪它，并传递给每个相机的渲染器。

```
bool allowHDR;  
public CustomRenderPipeline(bool allowHDR, bool useDynamicBatching, bool useGPUInstancing, bool useSRPBatcher, bool useLightsPerObject, ShadowSettings shadowSettings, PostFXSettings postFXSettings)  
{   
    this.allowHDR = allowHDR;  
    ...   
}  
protected override void Render(ScriptableRenderContext context, Camera[] cameras)  
{  
    foreach (Camera camera in cameras)  
    {  
        renderer.Render(context, camera, allowHDR, useDynamicBatching, useGPUInstancing, useLightsPerObject, shadowSettings, postFXSettings);  
    }   
}
```

3. 在CameraRenderer脚本中也追踪它，相机是否使用HDR渲染由相机组件自身是否启用和获取到的渲染管线是否允许HDR来共同决定。

 
```
bool useHDR;  
 public void Render(ScriptableRenderContext context, Camera camera, bool allowHDR, bool useDynamicBatching, bool useGPUInstancing, bool useLightsPerObject,ShadowSettings shadowSettings, PostFXSettings postFXSettings)  
 {   
     ...  
     if (!Cull(shadowSettings.maxDistance))   
     {  
         return;   
     }  
     useHDR = allowHDR && camera.allowHDR;  
     ...   
 }
```

**11.1.3 HDR渲染纹理**

HDR渲染与后处理相结合才有意义，因为我们无法更改最终帧缓冲区格式。因此当我们在CameraRenderer的Setup中创建自己的中间帧缓冲区时，我们将在启用HDR的时候使用默认的HDR 格式，而不是针对LDR的常规默认格式。

```
 buffer.GetTemporaryRT(frameBufferId, camera.pixelWidth, camera.pixelHeight,32, FilterMode.Bilinear,   
 useHDR ? RenderTextureFormat.DefaultHDR : RenderTextureFormat.Default);

```
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/5.1620801894782.png "UWA")
![[Pasted image 20230626173501.png]]
帧调试器中显示默认的HDR格式为R16G16B16A16_SFloat，意味着它是每个通道16位的 RGBA 缓冲区，因此每个像素是 64 位，是LDR缓冲区大小的两倍。在这种情况下，每个值都是线性空间中有符号的float类型，而不是限制到0~1的范围。当逐步查看Draw Call时会感觉场景在进行屏幕后处理之前，看起来比后处理之后的屏幕最终图像要暗一些，如下图所示，前面一张是后处理之前的图像，第二张是最终图像。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/6.1620801922756.png "UWA")

​![[Pasted image 20230626173504.png]]

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/7.1620801937146.png "UWA")
![[Pasted image 20230626173505.png]]
这是因为在线性空间中，Unity会把输入纹理设置为sRGB模式，这种情况下，硬件在对纹理采样时会自动将其转换到线性空间中，并且GPU会在Shader写入颜色缓冲前自动进行伽马校正或是保持线性在后面进行伽马校正，这取决于当前渲染的配置。如果开启了HDR，渲染就会使用一个浮点精度的缓冲，这些缓冲有足够精度不需要我们进行任何伽马校正，此时所有的混合和屏幕后处理都是在线性空间下进行的，当渲染完成后要写入显示设备的后备缓冲区（Back Buffer）时，再进行一次最后的伽马校正。如果没有使用HDR，那么Unity就会把缓冲设置为sRGB格式，这种格式的缓冲就像一个普通的纹理一样，在写入缓冲前需要进行伽马校正，在读取缓冲时需要进行一次解码操作。
![[Pasted image 20230626173509.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/9.1620897441674.png "UWA")

​**11.1.4 HDR后处理**

1. 此时结果看起来没什么变化，因为一旦渲染到LDR目标中，就会被限制到[0，1]之间，Bloom看起来会亮一点，但也不会亮太多，因为颜色在预滤波后也会被限制到[0，1]，因此我们需要在HDR中执行后处理，在CameraRenderer.Render方法调用postFXStack.Setup时传递是否使用后处理的参数。

```
postFXStack.Setup(context, camera, postFXSettings, useHDR);
```

2. 在PostFXStack中跟踪该值，并在DoBloom方法中进行判断以使用合适的纹理格式。

```
 bool useHDR;  
 public void Setup(ScriptableRenderContext context, Camera camera, PostFXSettings settings, bool useHDR)  
 {   
     this.useHDR = useHDR;  
     ...   
 }  
 void DoBloom(int sourceId)   
 {  
     ...  
     RenderTextureFormat format = useHDR ? RenderTextureFormat.DefaultHDR : RenderTextureFormat.Default;  
     ...   
 }
```

HDR和LDR下面Bloom效果的区别可能差别很大，也可能不明显，这取决于场景的明亮程度。通常将Bloom阈值设为1，这时只有HDR颜色起作用，这样辉光颜色对于显示屏来说就太亮了。
![[Pasted image 20230626173517.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/9.1620802047450.png "UWA")

​**11.1.5 HDR荧光闪烁问题**

HDR可以产生比周围环境明亮得多的小图像区域，当这些区域大小大约是一个像素大小或更小时，它们可以大幅改变相对大小，并在移动过程中突然出现或消失，但是这会导致出现一种荧光闪烁的效果，当Bloom后处理特效也被应用时会导致频繁闪烁。
![[Pasted image 20230626173519.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/11.1620897441805.png "UWA")

1. 完全解决此问题不太可能，我们可以在预滤波的过程中更主动地模糊图像去淡化闪烁，在PostFXSettings.cs的BloomSettings中添加这么一个控制淡化的切换开关，并在面板中勾选启用。

```
 //淡化闪烁   
   public bool fadeFireflies;
```

2. 为此我们需要添加一个BloomPrefilterFireflies Pass处理闪烁问题，先在Pass枚举中定义它，然后在DoBloom方法中根据切换开关使用合适的预滤波Pass。

```
Draw(sourceId, bloomPrefilterId, bloom.fadeFireflies ? Pass.BloomPrefilterFireflies : Pass.BloomPrefilter);
```

3. 淡化荧光闪烁最直接的办法是将预滤波Pass的2*2下采样滤波变成一个6*6的盒型滤波，可以使用9个样本做到这一点，再平均之前的Bloom阈值单独应用到每个样本。为此在PostFXStackPasses.hlsl中定义一个BloomPrefilterFirefliesPassFragment片元函数，并给着色器添加一个名为Bloom Prefilter Fireflies的Pass。
![[Pasted image 20230626173528.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/12.1620897441870.png "UWA")

```
​float4 BloomPrefilterFirefliesPassFragment (Varyings input) : SV_TARGET   
{  
    float3 color = 0.0;  
    float2 offsets[] =    
    {  
        float2(0.0, 0.0),  
        float2(-1.0, -1.0), float2(-1.0, 1.0), float2(1.0, -1.0), float2(1.0, 1.0),  
        float2(-1.0, 0.0), float2(1.0, 0.0), float2(0.0, -1.0), float2(0.0, 1.0)  
    };  
   
    for (int i = 0; i < 9; i++)   
    {  
        float3 c =GetSource(input.screenUV + offsets[i] * GetSourceTexelSize().xy * 2.0).rgb;  
        c = ApplyBloomThreshold(c);  
   
        color += c;   
    }  
    color *= 1.0 / 9.0;  
   
    return float4(color, 1.0);  
}  
   
Pass   
{   
    Name "Bloom Prefilter Fireflies"  
    HLSLPROGRAM   
      #pragma target 3.5  
      #pragma vertex DefaultPassVertex  
      #pragma fragment BloomPrefilterFirefliesPassFragment  
    ENDHLSL   
}

```
4. 但这样还不足以解决问题，非常亮的像素会分布在更大区域，为了淡化闪烁我们将根据颜色亮度使用加权平均值来解决。颜色亮度是其感知到的亮度，我们要使用源码库Color.hlsl文件中定义的Luminance方法，其原理如下。

样本权重为：
![[Pasted image 20230626173536.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/12.1620802337077.png "UWA")

​其中l为Luminance（发光亮度）。因此，对于亮度 0，权重为1，亮度为1，权重为 1/2、3为 1/4、7为 1/8等等。
![[Pasted image 20230626173540.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/13.1620802361366.png "UWA")

​最后将样本总和除以这些权重的总和。这有效地将荧光闪烁的亮度分散到所有其它样本中。如果其它样本是黑暗的，闪烁就会淡化。例如，0、0、0 和 10 的加权平均值为：
![[Pasted image 20230626173541.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/14.1620802383892.png "UWA")

```
​#include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Color.hlsl"  
   
float4 BloomPrefilterFirefliesPassFragment (Varyings input) : SV_TARGET   
{  
    float3 color = 0.0;  
    float weightSum = 0.0;  
    ...  
    for (int i = 0; i < 9; i++)   
    {  
        ...  
        float w = 1.0 / (Luminance(c) + 1.0);  
        color += c * w;  
        weightSum += w;  
    }   
    color /= weightSum;  
    return float4(color, 1.0);  
}
```

5. 由于在初始预滤波后执行高斯模糊，因此我们可以跳过紧邻中心的四个样本，将样本数量从9个减少到5个。
![[Pasted image 20230626173547.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/16.1620897442126.png "UWA")

```
float4 BloomPrefilterFirefliesPassFragment (Varyings input) : SV_TARGET   
{  
    ...   
    float2 offsets[] =   
    {  
        float2(0.0, 0.0),  
        float2(-1.0, -1.0), float2(-1.0, 1.0), float2(1.0, -1.0), float2(1.0, 1.0)    
    };  
   
    for (int i = 0; i < 5; i++)   
    {  
        ...  
    }  
        ...  
}
```

这会将单像素闪烁变成“×”形状的图案，并在预滤波步骤中将单像素水平或垂直线分割成两条单独的线，但在第一个模糊步骤之后，这些图案就消失了。
![[Pasted image 20230626173552.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/16.1620802647461.png "UWA")

这并不能完全消除荧光闪烁，但会降低荧光的强度使其不易观察出来，除非将Bloom强度的设置远大于1。
![[Pasted image 20230626173554.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/17.1620802675597.png "UWA")

---

### 11.2 Bloom散射

现在我们有了HDR Bloom，让我们考虑一个更现实的应用。相机并不完美，它们的镜头不能正确聚焦所有光线，一部分光线散射到更大的区域，这就有点像我们目前的Bloom效果。如果相机越好，则散射得越少，与我们的Bloom效果最大区别是散射不增加光线，只是散射光线，散射在视觉上可能从轻微的光芒到覆盖整个图像的薄雾。眼睛也是不完美的，光线以复杂的方式散射到眼睛里面，它发生在所有入射光的情况下，但只有当它很亮的时候才比较明显，例如在黑暗中观察一个明亮的灯光时。下图是相机里Bloom引起的散射效果。
![[Pasted image 20230626173557.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/18.1620802719621.png "UWA")

**11.2.1 Bloom 模式**

1. 现在我们将支持经典的Additive和基于能量守恒的散射Bloom，在PostFXSettings脚本的BloomSettings结构体中为这些模式添加一个枚举选项，并添加一个滑块控制光线散射的程度。

```
 public enum Mode { Additive, Scattering }  
   
   public Mode mode;  
   [Range(0f, 1f)]  
   
   public float scatter;
```
![[Pasted image 20230626173603.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/19.1620802773232.png "UWA")

2. 在PostFXStackPasses.hlsl中将BloomCombinePassFragment方法重命名为BloomAddPassFragment，然后再拷贝一份命名为BloomScatterPassFragment，它只是在最后根据Bloom强度在高分辨率和低分辨率源纹理数据之间进行插值而不是相加。因此0散射量意味着只使用最低的Bloom金字塔级别，1散射量表示仅使用最高Bloom金字塔级别。在0.5时连续的4个级别的最终贡献为0.5、0.25、0.125和0.125。

```
float4 BloomAddPassFragment (Varyings input) : SV_TARGET   
{  
    ...  
}  
float4 BloomScatterPassFragment(Varyings input) : SV_TARGET  
{   
    ...  
    return float4(lerp(highRes, lowRes, _BloomIntensity), 1.0);  
}
```

3. 在着色器中对相应的Pass做出修改。

 
```
Pass    
 {  
     Name "Bloom Add"  
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment BloomAddPassFragment  
     ENDHLSL  
 }  
   
 Pass   
 {  
     Name "Bloom Scatter"     
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment BloomScatterPassFragment  
     ENDHLSL  
 }
```

4. 在PostFXStack.DoBloom方法中使用合适的Pass，在BloomScatter模式下，我们将使用光线散射的程度，而不是1。

 
```
enum Pass   
 {  
    BloomHorizontal,  
    BloomVertical,  
    BloomAdd,  
    BloomScatter,  
    BloomPrefilter,  
    BloomPrefilterFireflies,  
    Copy  
 }  
 void DoBloom(int sourceId)   
 {  
    ...  
    buffer.SetGlobalFloat(bloomBucibicUpsamplingId, bloom.bicubicUpsampling ? 1f : 0f);  
    Pass combinePass;  
    if (bloom.mode == PostFXSettings.BloomSettings.Mode.Additive)  
    {   
        combinePass = Pass.BloomAdd;  
        buffer.SetGlobalFloat(bloomIntensityId, 1f);   
    }  
    else   
    {  
        combinePass = Pass.BloomScatter;  
        buffer.SetGlobalFloat(bloomIntensityId, bloom.scatter);  
    }   
    if (i > 1)  
    {   
        buffer.ReleaseTemporaryRT(fromId - 1);  
        toId -= 5;  
        for (i -= 1; i > 0; i--)  
        {   
            buffer.SetGlobalTexture(fxSource2Id, toId + 1);  
            Draw(fromId, toId, combinePass);  
             ...  
        }   
    }  
    else   
    {  
        buffer.ReleaseTemporaryRT(bloomPyramidId);   
    }  
    buffer.SetGlobalFloat(bloomIntensityId, bloom.intensity);  
    buffer.SetGlobalTexture(fxSource2Id, sourceId);  
    Draw(fromId, BuiltinRenderTextureType.CameraTarget, combinePass);  
    ...   
}
```

散射Bloom不会使图像变亮，也有可能会变暗，能量守恒并不是完美的，因为高斯滤波被限制在图像的边缘，这意味着边缘像素的贡献被放大。虽然我们可以弥补这一点，但不用这么做，因为它通常不是很不明显。

**11.2.2 散射限制**

1. 因为0和1的散射值消除了除一个金字塔级别以外的所有值，所以使用这些值是没有意义的。我们将散射程度调节滑块限制在[0.05，0.95]，这使得默认值0无效，我们初始化为0.7，与URP和HDRP使用的默认散射值相同。

 
```
public struct BloomSettings    
 {  
     ...   
     [Range(0.05f, 0.95f)]  
     public float scatter;   
 }  
 [SerializeField]  
 BloomSettings bloom = new BloomSettings    
 {  
     scatter = 0.7f   
 };

```
2. 大于1的Bloom强度不适合散射Bloom，因为那样会增加光线，我们在DoBloom方法中的散射模式下将其也限制在0.95以下。

 
```
void DoBloom(int sourceId)   
 {  
     ...   
     float finalIntensity;  
     if (bloom.mode == PostFXSettings.BloomSettings.Mode.Additive)  
     {   
         combinePass = Pass.BloomAdd;  
         buffer.SetGlobalFloat(bloomIntensityId, 1f);  
         finalIntensity = bloom.intensity;  
     }  
     else  
     {  
         combinePass = Pass.BloomScatter;  
         buffer.SetGlobalFloat(bloomIntensityId, bloom.scatter);  
         finalIntensity = Mathf.Min(bloom.intensity, 0.95f);  
     }  
     ...  
     buffer.SetGlobalFloat(bloomIntensityId, finalIntensity);  
     ...   
}
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/20.1620803488895.png "UWA")
![[Pasted image 20230626173628.png]]
**11.2.3 阈值**

散射模式的Bloom效果远比叠加模式的Bloom效果好，通常用于低强度，就像真实的相机一样，在非常亮的光线下，即所有的光线都被散射，Bloom效果才明显。虽然这不现实，但仍可以使用阈值来消除较暗像素的散射，这可以在使用更强Bloom效果时保持图像清晰。但是这会消除光线，从而使图像变暗。
![[Pasted image 20230626173630.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/21.1620803520575.png "UWA")

​1. 我们要补偿丢失的散射光，通过创建一个Bloom Scatter Final Pass，用于散射Bloom的最终绘制。拷贝BloomScatterPassFragment片元函数并命名为BloomScatterFinalPassFragment，区别是它通过添加高分辨率原始图像的光线，然后减去应用了Bloom阈值的它，再将缺失的光线添加到低分辨率原始图像中。这不是一个完美的方案，它不是加权平均值，忽略了因为闪烁淡化而失去的光线，但足够接近，并没有为原始图像增加光线。

```
float4 BloomScatterFinalPassFragment(Varyings input) : SV_TARGET  
{  
    ...  
    float3 highRes = GetSource2(input.screenUV).rgb;  
    lowRes += highRes - ApplyBloomThreshold(highRes);  
    return float4(lerp(highRes, lowRes, _BloomIntensity), 1.0);  
}  
   
Pass   
{   
    Name "Bloom Scatter Final"  
    HLSLPROGRAM   
      #pragma target 3.5  
      #pragma vertex DefaultPassVertex  
      #pragma fragment BloomScatterFinalPassFragment  
     ENDHLSL  
 }
```

2. 调整DoBloom方法，使用BloomScatterFinal Pass用于散射Bloom的最终绘制。

```
enum Pass   
{  
    BloomHorizontal,  
    BloomVertical,  
    BloomAdd,  
    BloomScatter,  
    BloomScatterFinal,  
    ...  
}  
    
void DoBloom(int sourceId)  
{  
    ...  
    Pass combinePass, finalPass;  
    float finalIntensity;  
    if (bloom.mode == PostFXSettings.BloomSettings.Mode.Additive)  
    {   
        combinePass = finalPass = Pass.BloomAdd;  
        buffer.SetGlobalFloat(bloomIntensityId, 1f);  
        finalIntensity = bloom.intensity;   
    }  
    else   
    {  
        combinePass = Pass.BloomScatter;  
        finalPass = Pass.BloomScatterFinal;  
        buffer.SetGlobalFloat(bloomIntensityId, bloom.scatter);  
        finalIntensity = Mathf.Min(bloom.intensity, 0.95f);  
    }  
    ...  
    Draw(fromId, BuiltinRenderTextureType.CameraTarget,finalPass);  
    buffer.ReleaseTemporaryRT(fromId);  
    buffer.EndSample("Bloom");   
}
```

![[Pasted image 20230626173646.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/22.1620803940229.png "UWA")

---

### **11.3 色调映射（Tone Mapping）**

尽管我们可以在HDR中渲染，但常规摄像机的最终帧缓冲区始终为LDR。因此颜色通道在1时被切断，最终图像的白点还是1。非常亮的颜色最终看起来与那些完全饱和的颜色没有什么不同。此时，我们需要将光照结果从HDR转换为显示器能够正常显示的LDR，这一过程通常称为色调映射（Tone Mapping)。

**11.3.1 额外的Post FX步骤**

1. 在Bloom之后我们添加一个新的后处理特效步骤用来进行色调映射，在PostFXStack脚本中添加一个DoToneMapping方法，最初源纹理数据拷贝到相机目标。
```

 void DoToneMapping(int sourceId)   
 {  
     Draw(sourceId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
 }

```
2. 我们需要调整DoBloom方法，创建一个新的全分辨率临时渲染纹理作为Bloom处理后的图像的渲染目标，且让该方法返回一个bool值，用来判断Bloom特效是否成功绘制，而不是在跳过效果时直接绘制到相机的目标。。

 
```
int bloomResultId = Shader.PropertyToID("_BloomResult");  
 bool DoBloom(int sourceId)   
 {  
    //buffer.BeginSample("Bloom");  
    PostFXSettings.BloomSettings bloom = settings.Bloom;  
    int width = camera.pixelWidth / 2, height = camera.pixelHeight / 2;  
    if (bloom.maxIterations == 0 || bloom.intensity <= 0f || height < bloom.downscaleLimit * 2 || width < bloom.downscaleLimit * 2)  
    {  
        //Draw(sourceId, BuiltinRenderTextureType.CameraTarget, Pass.Copy);  
        //buffer.EndSample("Bloom");  
   
        return false;  
    }  
    buffer.BeginSample("Bloom");  
    ...  
    buffer.SetGlobalTexture(fxSource2Id, sourceId);  
    buffer.GetTemporaryRT(bloomResultId, camera.pixelWidth, camera.pixelHeight, 0,  
    FilterMode.Bilinear, format);  
    Draw(fromId, bloomResultId, finalPass);  
    buffer.ReleaseTemporaryRT(fromId);  
    buffer.EndSample("Bloom");  
    return true;  
 }
```

3. 调整Render方法，使其在执行Bloom后执行色调映射，并释放不再使用的渲染纹理，否则直接使用源纹理执行色调映射。

 
```
public void Render(int sourceId)   
 {  
    if (DoBloom(sourceId))   
    {  
        DoToneMapping(bloomResultId);  
        buffer.ReleaseTemporaryRT(bloomResultId);   
    }  
    else   
    {  
        DoToneMapping(sourceId);   
    }  
    context.ExecuteCommandBuffer(buffer);   
        buffer.Clear();  
 }
```

**11.3.2 色调映射模式**

色调映射有多种算法实现，我们将支持几种常用的方法，在PostFXSettings脚本中添加ToneMappingSettings相关配置结构。

 [
```
System.Serializable]  
   
 public struct ToneMappingSettings   
 {   
    public enum Mode { None }  
    public Mode mode;  
   
 }  
 [SerializeField]  
   
 ToneMappingSettings toneMapping = default;  
 public ToneMappingSettings ToneMapping => toneMapping;
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/23.1620804309307.png "UWA")
![[Pasted image 20230626173708.png]]
**11.3.3 Reinhard**

色调映射的目的是降低图像的亮度，以便其它均匀的白色区域显示各种颜色，从而揭示其它丢失的细节。这就像当你的眼睛适应一个突然明亮的环境，直到你能再次清楚地看到的这个过程。但是，我们不想均匀地缩小整个图像，因为那样会使较暗的颜色难以区分，用过度亮度换来曝光不足。因此，我们需要一个非线性转换，它不会减少暗值太多，但会减少很多高值。在极端情况下，0保持为0，接近无穷大的值减少到1。一个简单的函数可以完成这点，即c/(1+c)，其中c是一个颜色通道。这个函数被称为形式最简单的Reinhard色调映射，它最初是由Mark Reinhard提出的，但他将其应用于亮度，而我们将其应用于每个单独的颜色通道。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/24.1620804364848.png "UWA")
![[Pasted image 20230626173711.png]]
​1. 在ToneMappingSettings结构体的Mode枚举中添加该选项，枚举将从-1开始，Reinhard值为0。

 
```
public enum Mode    
 {  
     None = -1,  
     Reinhard   
 }

```
2. 在着色器中定义Tone Mapping Reinhard Pass和ToneMappingReinhardPassFragment片元函数，这里的实现我们主要套用c/(1+ c)这个公式进行色调映射即可。注意这里由于精度限制，非常大的值可能会出错，因此在执行色调映射之前，对颜色值进行限制，限制为60可以避免我们将支持的所有模式的任何潜在问题。

 
```
Pass    
 {  
     Name "Tone Mapping Reinhard"  
     HLSLPROGRAM  
       #pragma target 3.5  
       #pragma vertex DefaultPassVertex  
       #pragma fragment ToneMappingReinhardPassFragment  
     ENDHLSL   
 }  
float4 ToneMappingReinhardPassFragment(Varyings input) : SV_TARGET  
{   
     float4 color = GetSource(input.screenUV);  
     color.rgb = min(color.rgb, 60.0);  
     color.rgb /= color.rgb + 1.0;  
     return color;  
}

```
3. 在Pass枚举中添加新Pass对应的名字，然后调整DoTonemapping方法，如果枚举值小于0，则进行简单的数据拷贝，如果切换到了Reinhard选项，则应用Reinhard色调映射。

 
```
void DoToneMapping(int sourceId)   
 {  
     PostFXSettings.ToneMappingSettings.Mode mode = settings.ToneMapping.mode;  
     Pass pass = mode < 0 ? Pass.Copy : Pass.ToneMappingReinhard;  
     Draw(sourceId, BuiltinRenderTextureType.CameraTarget, pass);  
 }
```

下图是散射Bloom模式下没有色调映射和Reinhard色调映射的对比图。

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/25.1620804502146.png "UWA")
![[Pasted image 20230626173720.png]]
​![[Pasted image 20230626173721.png]]

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/26.1620804520036.png "UWA")

**11.3.4 Neutral**

Reinhard色调映射的白点理论上是无限的，但可以进行调整，以便更早达到最大值，从而削弱调整效果，替代公式为：
![[Pasted image 20230626173724.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/27.1620804817089.png "UWA")

其中w就是白点。
![[Pasted image 20230626173726.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/28.1620804841764.png "UWA")

​我们可以为此添加一个配置选项，但Reinhard并不是我们可以唯一使用的函数，一个更有趣的应用是：
![[Pasted image 20230626173728.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/29.1620804865042.png "UWA")

​其中x是输入颜色通道，其它值是配置曲线的常数。最终颜色是：
![[Pasted image 20230626173730.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/30.1620804884035.png "UWA")

​其中c是颜色通道，e是曝光误差，w是白点，它可以生成一个s型曲线，其底部区域从黑色向上弯曲到中间的线形部分，最后以肩部区域在接近白色时变平为结束。Neutral色调映射只是做了范围的重新映射，对颜色的色彩和饱和度影响很小。它是由John Hable设计，首次用于《神秘海域2》。
![[Pasted image 20230626173738.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/31.1620804905187.png "UWA")

​URP和HDRP使用此函数的变体，有自己的配置值，白点值为 5.3，但它们也使用白色缩放比例进行曝光误差，因此最终的曲线是：

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/32.1620804926828.png "UWA")
![[Pasted image 20230626173742.png]]
​这就导致有效白点约为4.035，它用于中性色调映射选项，可通过源码库文件中的NeutralTonemap方法进行使用。
![[Pasted image 20230626173745.png]]
![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/33.1620804945291.png "UWA")

​1. 为Neutral色调映射模式添加一个枚举项，放在None的后面。

 
```
public enum Mode    
 {  
     None = -1,  
     Neutral,  
     Reinhard   
 }
```

2. 定义一个Tone Mapping Neutral Pass和ToneMappingNeutralPassFragment片元函数，这里主要调用NeutralTonemap方法进行Neutral色调映射。

```
Pass    
{  
    Name "Tone Mapping Neutral"  
    HLSLPROGRAM  
      #pragma target 3.5  
      #pragma vertex DefaultPassVertex  
      #pragma fragment ToneMappingNeutralPassFragment  
     ENDHLSL  
}  
float4 ToneMappingNeutralPassFragment(Varyings input) : SV_TARGET  
{   
    float4 color = GetSource(input.screenUV);  
    color.rgb = min(color.rgb, 60.0);  
    color.rgb /= color.rgb + 1.0;  
    return color;  
}

```
3. 调整DoToneMapping方法中的Pass调用。

 
```
void DoToneMapping(int sourceId)   
 {  
     PostFXSettings.ToneMappingSettings.Mode mode = settings.ToneMapping.mode;  
     Pass pass = mode < 0 ? Pass.Copy : Pass.ToneMappingNeutral + (int)mode;  
     Draw(sourceId, BuiltinRenderTextureType.CameraTarget, pass);  
 }
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/34.1620805064041.png "UWA")
![[Pasted image 20230626173755.png]]
**11.3.5 ACES**

最后支持的一个色调映射模式是ACES，URP和HDRP也使用该模式。ACES 是Academy Color Encoding System的简写，它用于交换数字图像文件、管理颜色工作流，创建主要交付和存档的全球标准，我们只使用Unity实现的色调映射方法。它比Neutral色调映射对比度更强，对实际的色彩和饱和度也有影响。这个色调映射也比较好用，它不需要用户输入任何东西就会有标准电影效果。

1. 首先添加ACES枚举项。

 
```
public enum Mode    
 {  
     None = -1,   
     ACES,  
     Neutral,  
     Reinhard  
 }
```

2. 定义Tone Mapping ACES Pass和ToneMappingACESPassFragment片元函数，调用源码库中的AcesTonemap方法进行ACES色调映射。该方法的颜色传参必须位于ACES颜色空间中，我们可以调用unity_to_ACES方法进行转换。

```
float4 ToneMappingACESPassFragment(Varyings input) : SV_TARGET  
{  
    float4 color = GetSource(input.screenUV);  
    color.rgb = min(color.rgb, 60.0);  
    color.rgb = AcesTonemap(unity_to_ACES(color.rgb));   
    return color;  
}  
   
Pass   
{  
    Name "Tone Mapping ACES"  
    HLSLPROGRAM  
      #pragma target 3.5  
      #pragma vertex DefaultPassVertex  
      #pragma fragment ToneMappingACESPassFragment  
    ENDHLSL  
 }
```

3. 最后调整DoToneMapping方法的Pass调用。

 
```
void DoToneMapping(int sourceId)   
 {  
     PostFXSettings.ToneMappingSettings.Mode mode = settings.ToneMapping.mode;  
     Pass pass = mode < 0 ? Pass.Copy : Pass.ToneMappingACES + (int)mode;  
     Draw(sourceId, BuiltinRenderTextureType.CameraTarget, pass);  
 }
```

![loading](https://uwa-edu.oss-cn-beijing.aliyuncs.com/35.1620805195719.png "UWA")
![[Pasted image 20230626173812.png]]
ACES与其它模式最明显的区别是，它为非常明亮的颜色增加了色调变化，将它们推向白色。当相机或眼睛被太多的光线淹没时，也会发生这种情况。结合Bloom，现在很清楚哪些表面最亮。此外ACES色调映射会使较暗的颜色稍有减少，从而增强对比度。