# UniversalFragmentPBR

一、梳理 UniversalFragmentPBR 函数的功能分布和代码结构。
二、通用 PBR 算法剖析
三、ClearCoatPBR 算法剖析

## 函数功能分布和代码结构

首先来分析下 UniversalFragmentPBR 函数展开后的功能框架，主要有两大块：数据准备、光照计算

### 数据准备

数据准备又分成 6 个部分。

1、“高光开关” 状态切换
2、初始化通用 BRDF 数据
3、初始化 “ClearCoat” 的 BRDF 数据
4、定义 shadowMask
5、获取主光源数据
6、定义 SSAO 下的 lightColor 和 occlusion
7、混合 BakedGI 和 realtimeShadow

#### 1 高光开关状态切换
这个很简单，仅仅是面板上高光开关状态的切换。
```c
#if defined(_SPECULARHIGHLIGHTS_OFF)
bool specularHighlightsOff = true;
#else
bool specularHighlightsOff = false;
#endif
```

#### 2 初始化通用 BRDF 数据
所谓通用，就是适合大部分的 PBR 材质，这里是相对 ClearCoatPBR 而言的。代码中使用 `InitializeBRDFData` 函数，这些和 BRDF 计算相关的变量，具体含义后面会细说。

```c
// 初始化BRDF的数据
BRDFData brdfData;
// NOTE: can modify "surfaceData"...
InitializeBRDFData(surfaceData, brdfData);

//初始化以下结构体
struct BRDFData
{
    half3 albedo; //反照率
    half3 diffuse; //漫反射颜色
    half3 specular;//高光颜色
    half reflectivity; //反射率
    half perceptualRoughness; //直观的粗糙度
    half roughness;//粗糙度
    half roughness2;//粗糙度平方
    half grazingTerm; //掠射角项

    // 我们保存一些不变的 BRDF 项，这样就不必在灯光循环中重新计算
    // Take a look at DirectBRDF function for detailed explaination.
    half normalizationTerm;     // roughness * 4.0 + 2.0
    half roughness2MinusOne;    // roughness^2 - 1.0
};
```

#### 3 初始化 ClearCoat BRDF 数据
 ClearCoat（双层材质，底层为基础材质，上层为清漆材质）材质的 BRDF 算法，可以渲染被清漆包裹着的双层材质感觉，例如车漆。使用 `InitializeBRDFDataClearCoat` 函数初始化 BRDF 数据。

```c
// 初始化“CLEARCOAT_PBR”的BRDF数据
BRDFData CreateClearCoatBRDFData(SurfaceData surfaceData, inout BRDFData brdfData)
{
    BRDFData brdfDataClearCoat = (BRDFData)0;

    #if defined(_CLEARCOAT) || defined(_CLEARCOATMAP)
    // base brdfData is modified here, rely on the compiler to eliminate dead computation by InitializeBRDFData()
    InitializeBRDFDataClearCoat(surfaceData.clearCoatMask, surfaceData.clearCoatSmoothness, brdfData, brdfDataClearCoat);
    #endif

    return brdfDataClearCoat;
}
```

#### 4 定义 shadowMask
增加了 shadowMask 属性，作为阴影蒙版，用来剔除不想要的阴影。因为它在旧的着色器中不存在，为了确保向后兼容性，我们必须做好分支判断。

```c
half4 CalculateShadowMask(InputData inputData)
{
    // To ensure backward compatibility we have to avoid using shadowMask input, as it is not present in older shaders
    #if defined(SHADOWS_SHADOWMASK) && defined(LIGHTMAP_ON)
    half4 shadowMask = inputData.shadowMask;
    #elif !defined (LIGHTMAP_ON)
    half4 shadowMask = unity_ProbesOcclusion;
    #else
    half4 shadowMask = half4(1, 1, 1, 1);
    #endif

    return shadowMask;
}
```

#### 5 计算 AO 因子因子

 SSAO 

```c
AmbientOcclusionFactor CreateAmbientOcclusionFactor(float2 normalizedScreenSpaceUV, half occlusion)
{
    AmbientOcclusionFactor aoFactor = GetScreenSpaceAmbientOcclusion(normalizedScreenSpaceUV);

    aoFactor.indirectAmbientOcclusion = min(aoFactor.indirectAmbientOcclusion, occlusion);
    return aoFactor;
}
```

#### 6  获取主光源数据
新版本使用 `GetMainLight` 函数封装了主光源的方向、颜色、衰减等数据。

```c
// 获取主光源数据
 Light mainLight = GetMainLight(inputData, shadowMask, aoFactor);
```


#### 7 混合 BakedGI 和 realtimeShadow

使用 `MixRealtimeAndBakedGI` 函数来混合全局光照和阴影。

```c
//AO不需要参与GI计算，而是在下面的光照计算中完成
MixRealtimeAndBakedGI(mainLight, inputData.normalWS, inputData.bakedGI);
```

### 光照计算

数据准备好后，进入 PBR 光照计算，我们都知道，PBR 光照最终颜色由 4 部分组成。

**最终颜色 = 直接光漫反射 + 直接光高光反射 + 间接光（GI）漫反射 + 间接光（GI）高光反射**

**代码中分成了间接光和直接光 2 个部分，而直接光又可以分 3 个部分，如下所示：**
1. GI（间接光）计算
2. 直接光计算
    - 主光光照计算
    - 额外像素光照计算
    - 额外顶点光照计算

下面来分步说明：

#### 1. 获取灯光信息
```cs
LightingData CreateLightingData(InputData inputData, SurfaceData surfaceData)
{
    LightingData lightingData;

    lightingData.giColor = inputData.bakedGI;
    lightingData.emissionColor = surfaceData.emission;
    lightingData.vertexLightingColor = 0;
    lightingData.mainLightColor = 0;
    lightingData.additionalLightsColor = 0;

    return lightingData;
}
```
#### 2 GI（间接光）计算

使用 `GlobalIllumination` 函数用来计算 GI 间接光的 BRDF。

```
lightingData.giColor = GlobalIllumination(
    brdfData, 
    brdfDataClearCoat, 
    surfaceData.clearCoatMask,
    inputData.bakedGI, aoFactor.indirectAmbientOcclusion,
    inputData.positionWS,
    inputData.normalWS, inputData.viewDirectionWS,
    inputData.normalizedScreenSpaceUV);
```

#### 3 直接光计算

##### 主光光照计算

`LightingPhysicallyBased` 函数用来计算主光的 BRDF

```c
lightingData.mainLightColor = LightingPhysicallyBased(
    brdfData, brdfDataClearCoat,
    mainLight,
    inputData.normalWS, inputData.viewDirectionWS,
    surfaceData.clearCoatMask, specularHighlightsOff);
```

##### 额外像素光照计算

URP 版本中，所有光照计算都被放在一个 pass 中，并且可以遍历每一盏额外灯，将他们的光照贡献相加。

```c
#if defined(_ADDITIONAL_LIGHTS)
    uint pixelLightCount = GetAdditionalLightsCount();

    #if USE_FORWARD_PLUS
    for (uint lightIndex = 0; lightIndex < min(URP_FP_DIRECTIONAL_LIGHTS_COUNT, MAX_VISIBLE_LIGHTS); lightIndex++)
    {
        FORWARD_PLUS_SUBTRACTIVE_LIGHT_CHECK

        Light light = GetAdditionalLight(lightIndex, inputData, shadowMask, aoFactor);

    #ifdef _LIGHT_LAYERS
        if (IsMatchingLightLayer(light.layerMask, meshRenderingLayers))
    #endif
        {
            lightingData.additionalLightsColor += LightingPhysicallyBased(brdfData, brdfDataClearCoat, light,
                                                                          inputData.normalWS, inputData.viewDirectionWS,
                                                                          surfaceData.clearCoatMask, specularHighlightsOff);
        }
    }
    #endif

    LIGHT_LOOP_BEGIN(pixelLightCount)
        Light light = GetAdditionalLight(lightIndex, inputData, shadowMask, aoFactor);

    #ifdef _LIGHT_LAYERS
        if (IsMatchingLightLayer(light.layerMask, meshRenderingLayers))
    #endif
        {
            lightingData.additionalLightsColor += LightingPhysicallyBased(brdfData, brdfDataClearCoat, light,
                                                                          inputData.normalWS, inputData.viewDirectionWS,
                                                                          surfaceData.clearCoatMask, specularHighlightsOff);
        }
    LIGHT_LOOP_END
    #endif
```

##### 额外顶点光照

然后是额外的顶点光照。

```c
#if defined(_ADDITIONAL_LIGHTS_VERTEX)
    lightingData.vertexLightingColor += inputData.vertexLighting * brdfData.diffuse;
    #endif

```


**梳理完 UniversalFragmentPBR 函数，总结下和 BuildIn 版本的不同：**

**1、增加 ClearCoatPBR 材质**

**2、增加 ShadowMask 功能**

**3、增加 SSAO 效果**

**4、额外光不需要单独 pass**

**5、可以遍历每盏额外光**

# 通用 PBR 算法剖析 (待更新)

> [!NOTE]
> 以下为作者的旧版本
> 

接下来，我们在上述框架基础上，将通用 PBR 代码部分拎出来，可以分成以下 4 部分：
1. BRDF 数据初始化
2. 间接光（GI）计算
3. 主光光照计算
4. 额外光光照计算

## BRDF 数据初始化

进入 InitializeBRDFData 函数，根据高光流和金属流的不同而初始化 reflectivity（反射率）、oneMinusReflectivity（1 - 反射率）、brdfDiffuse（漫反射颜色）、brdfSpecular（高光颜色）、其他参数，接下来一个一个分析。

```c
inline void InitializeBRDFData(half3 albedo, half metallic, half3 specular, half smoothness, inout half alpha, out BRDFData outBRDFData)
{
//如果设置高光流
#ifdef _SPECULAR_SETUP
    // 反射率
    // 将specular转成单通道（高光值和反射率成正比）
    half reflectivity = ReflectivitySpecular(specular);
    // 反射率取反
    half oneMinusReflectivity = half(1.0) - reflectivity;
    // specular颜色取反得到漫反射
    half3 brdfDiffuse = albedo * oneMinusReflectivity;
    // 高光颜色直接和金属度挂钩（此时_Metallic没有暴露，直接传值给了specular）
    half3 brdfSpecular = specular;
    
// 如果设置金属流
#else
    // 1 - 反射率
    half oneMinusReflectivity = OneMinusReflectivityMetallic(metallic); 
    // 反射率（金属度和反射率成正比）
    half reflectivity = half(1.0) - oneMinusReflectivity; 
    // metallic越弱，Reflectivity越小，oneMinusReflectivity就越大
    // 漫反射颜色越接近albedo本身，反之越暗
    half3 brdfDiffuse = albedo * oneMinusReflectivity;
    // 高光颜色
    // kDieletricSpec = half4(0.04, 0.04, 0.04, 1.0 - 0.04)
    // 非金属的反射系数普遍为0.04，可以理解为高光颜色是0.04
    // 金属的反射颜色为金属自身颜色
    // 所以metallic越强，反射颜色为自身颜色，反之为0.04
    half3 brdfSpecular = lerp(kDieletricSpec.rgb, albedo, metallic);
#endif
    
    // 初始化BRDF数据
    InitializeBRDFDataDirect(albedo, brdfDiffuse, brdfSpecular, reflectivity, oneMinusReflectivity, smoothness, alpha, outBRDFData);
}
```
### reflectivity（反射率）

高光流中，reflectivity 直接取 specular 三个分量中的最大值（ES2.0 是取 r 分量），这是因为高光越强反射率越大，所以我们认为他们的关系是呈正比线性的。

```
half ReflectivitySpecular1(half3 specular) {
    #if defined(SHADER_API_GLES)// 如果是OpenGL ES2.0，则返回specular的r分量
        return specular.r; // r通道-因为大多数金属要么是单色的，要么带有微红或淡黄色
    #else// 如果是更高配置，则返回specular分量最大值
        return max(max(specular.r, specular.g), specular.b);
    #endif
}
```

金属流中，是先计算 oneMinusReflectivity，reflectivity 是 1-oneMinusReflectivity 得到的。所以我们着重看下面 oneMinusReflectivity 的实现。

```
half reflectivity = 1.0 - oneMinusReflectivity;
```

### oneMinusReflectivity（1 - 反射率）

高光流中，oneMinusReflectivity 直接取反即可。

```
half oneMinusReflectivity = 1.0 - reflectivity;
```

金属流中，metallic 越强，反射率越大，反射率的取值区间在 [dielectricSpec, 1]，其中 dielectricSpec = 0.04（Unity 将非金属的反射率统一在 4%），所以通过 metallic 在非金属和金属之间插值，就能得到最终反射率，即

reflectivity = lerp(dielectricSpec, 1, metallic)

然后 1 - reflectivity 就等于 oneMinusReflectivity，推导过程见注释。


### brdfDiffuse（漫反射颜色）

高光流中，specular 贴图存储着金属的高光颜色（非金属高光颜色基本都是灰黑），而金属是没有漫反射的（所以金属漫反射颜色为黑色），非金属才有漫反射颜色。这里 1-specular 后得到的是非金属的漫反射 + 吸收的光，乘以反照率后，得到漫反射颜色。而金属的 albedo 为 0，所以最终漫反射颜色也是 0

```
half3 brdfDiffuse = albedo * (half3(1.0h, 1.0h, 1.0h) - specular);
```

金属流中，非金属的反射率固定为 0.04，而金属的反射率由 metalic 决定，漫反射 = 反射率 * 漫反射颜色。其实这里是使用 metallic 在 [albedo, 0.04] 间做插值再乘以 albedo 来得到漫反射颜色。

```
half3 brdfDiffuse = albedo * oneMinusReflectivity;
```

**4、brdfSpecular（高光颜色）**

高光流中，高光颜色就是 specular（非金属也可以给高光颜色）

```
half3 brdfSpecular = specular;// specular = _Metallic.rrr;
```

金属流中，金属的物理性质：金属性越强，高光越接近本身颜色，金属性越弱，高光越接近 RGB 为 0.04 的黑色。所以 metallic 越强，反射颜色为自身颜色，反之为 kDieletricSpec.rgb = half3(0.04, 0.04, 0.04)。其实这里是使用 metallic 在 [0.04, albedo] 间做插值来得到高光颜色。

```
half3 brdfSpecular = lerp(kDieletricSpec.rgb, albedo, metallic);
```

**5、其他参数**

其他参数在 InitializeBRDFDataDirect 函数中计算，具体计算见注释。至于为什么需要这些参数，后面用到时会详细说明。

```
inline void InitializeBRDFDataDirect(half3 diffuse, half3 specular, half reflectivity, half oneMinusReflectivity, half smoothness, inout half alpha, out BRDFData outBRDFData) {
    outBRDFData.diffuse = diffuse;//漫反射颜色
    outBRDFData.specular = specular;//高光颜色
    outBRDFData.reflectivity = reflectivity;//反射率

    outBRDFData.perceptualRoughness = PerceptualSmoothnessToPerceptualRoughness(smoothness);// perceptualRoughness = 1 - smoothness
    outBRDFData.roughness           = max(PerceptualRoughnessToRoughness(outBRDFData.perceptualRoughness), HALF_MIN_SQRT);// roughness = perceptualRoughness^2
    outBRDFData.roughness2          = max(outBRDFData.roughness * outBRDFData.roughness, HALF_MIN);// roughness2 = roughness^2
    outBRDFData.grazingTerm         = saturate(smoothness + reflectivity);// 掠射颜色项
    outBRDFData.normalizationTerm   = outBRDFData.roughness * 4.0h + 2.0h;
    outBRDFData.roughness2MinusOne  = outBRDFData.roughness2 - 1.0h;

    // 如果定义了AlphaBlend
    #ifdef _ALPHAPREMULTIPLY_ON
        outBRDFData.diffuse *= alpha;
        alpha = alpha * oneMinusReflectivity + reflectivity;
    #endif
}
```

这里只先说明一下 grazingTerm（掠射颜色项）。什么是掠射？光从一种介质向另一种介质传播，入射角接近于 90 度时称为掠射，也就是说当视线和片元法线接近垂直的时候，片元上的光传播到摄像机就称为掠射，而菲涅尔效应也刚好是这样的，也就是说掠射越强，菲涅尔效应越强，而这里的 grazingTerm 是掠射颜色，可以理解为菲尼尔反射的颜色。代码中 grazingTerm=smoothness+reflectivity，说明金属度、光滑度、高光强度都和掠射颜色成正相关，越光滑的金属，它的菲涅尔反射越亮，这和物理世界的规则是一样的。

## 间接光（GI）计算

间接光（GI）= 间接光（GI）漫反射 + 间接光（GI）镜面反射

我们分间接光（GI）漫反射和间接光（GI）镜面反射两部分来说明。

在这之前先计算一下 fresnelTerm（菲涅尔项），之后会用到，注意这里的菲涅尔不是 PBR 高光项的菲涅尔项，这里没加入 F0 和 F90，而 Pow4 而非 Pow5 应该是个经验值。

```
half3 reflectVector = reflect(-viewDirectionWS, normalWS);//反射向量
    half NoV = saturate(dot(normalWS, viewDirectionWS));
    half fresnelTerm = Pow4(1.0 - NoV);// 菲涅尔项（没有加入F0和F90的计算）
```

**1、 间接光（GI）漫反射**

漫反射 = bakedGI（烘焙光照） *AO（环境闭塞） * albedo（颜色纹理）

漫反射的逻辑很清晰，3 个参数直接相乘即可。bakedGI 通过采样 LightMap 或者 SH 而来，AO 通过采样 occlusionMap 或者 SSAO 而来，albedo 通过采样颜色贴图而来。

```
half3 indirectDiffuse = bakedGI * occlusion * brdfData.diffuse;
```

**2、间接光（GI）镜面反射（IBL）**

镜面反射 = indirectSpecular（采样环境贴图）*AO*specularAlbedo（高光反照率）

间接光的镜面反射是 PBR 计算的 IBL（image-based lighting 基于图像的光照）部分，是丰富光照细节的重要手段。我们将 indirectSpecular（采样环境贴图）*AO 算第一部分，specularAlbedo（高光反照率）算第二部分。

**（1）indirectSpecular（采样环境贴图）* AO**

通过 GlossyEnvironmentReflection 函数来实现，具体思路是：通过 roughness 去计算 CubeMap 的 MipLevel，然后采样对应 Level 的 CubeMap，最后将其解码，并乘以 AO。

```
half3 GlossyEnvironmentReflection1(half3 reflectVector, half perceptualRoughness, half occlusion) {
    // 如果打开环境反射开关
    #if !defined(_ENVIRONMENTREFLECTIONS_OFF)
        // 通过r * (1.7 - 0.7 * r) * mipMapCount，计算得到MipLevel
        // 最终返回 r * UNITY_SPECCUBE_LOD_STEPS
        // 其中 #define UNITY_SPECCUBE_LOD_STEPS 6
        half mip = PerceptualRoughnessToMipmapLevel(perceptualRoughness);
        // 采样对应mipLevel的CubeMap
        half4 encodedIrradiance = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflectVector, mip);

    // 如果允许HDR，则无需解码，反之则要解码。
    #if defined(UNITY_USE_NATIVE_HDR) || defined(UNITY_DOTS_INSTANCING_ENABLED)
        half3 irradiance = encodedIrradiance.rgb;
    #else
        // 因为CubeMap包含HDR（亮度超过1了），所以必须解码成RGB格式
        half3 irradiance = DecodeHDREnvironment(encodedIrradiance, unity_SpecCube0_HDR);
    #endif

        return irradiance * occlusion;
    #endif // GLOSSY_REFLECTIONS

        return _GlossyEnvironmentColor.rgb * occlusion;
}
```

由于 roughness 和 MipLevel 不是线性关系，所以要通过一个公式去计算他们之间的非线性关系，Unity 给出了一个近似算法：

，其中$r * (1.7 - 0.7 * r) * mipMapCount，其中r = 1 - smoothness$

这也正是 PerceptualRoughnessToMipmapLevel 函数的实现。

```
real PerceptualRoughnessToMipmapLevel(real perceptualRoughness, uint mipMapCount)
    {
        perceptualRoughness = perceptualRoughness * (1.7 - 0.7 * perceptualRoughness);

        return perceptualRoughness * mipMapCount;
    }
```

然后使用返回值作为 MipLevel 采样 CubeMap

```
// 采样对应mipLevel的CubeMap
half4 encodedIrradiance = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflectVector, mip);
```

这时候采样出的颜色值是超过 1 的，因为 CubeMap 包含 HDR，所以如果禁用 HDR 的话，必须要对其解码。

```
half3 irradiance = DecodeHDREnvironment(encodedIrradiance, unity_SpecCube0_HDR);
```

最终将解码后的像素颜色乘以 AO，并返回

```
return irradiance * occlusion;
```

**（2）specularAlbedo（高光反照率）**

高光反照率由 “镜面反射衰减” 和“镜面反射遮罩”相乘。使用 EnvironmentBRDFSpecular 函数实现。

（高光反照率）反射衰减反射遮罩$specularAlbedo（高光反照率）=reduction(反射衰减)*mask(反射遮罩)$

**镜面反射衰减：**

先来看衰减，Unity 使用了公式：

其中$reduction = \frac{1}{roughness^2+1}其中roughness = perceptualRoughness^2$

所以最终公式是 $reduction = \frac{1}{perceptualRoughness^4+1}$

对应函数曲线图如下，当粗糙度在 [0， 1] 间变化时，衰减从 1 逐渐变化到 0.5，并且 0.4 以下的光滑基本都没有衰减。

![[431897aa5219b6645ed49d6781bd8ccd_MD5.jpg]]

对应代码如下：

```
float surfaceReduction = 1.0 / (brdfData.roughness2 + 1.0);// 镜面反射IBL的衰减
```

**镜面反射遮罩**

再来说反射遮罩，Unity 使用菲涅尔值插值 specular（高光颜色）和 grazingTerm（掠射颜色）作为反射的黑白遮罩，由于掠射颜色和 smoothness 相关，所以粗糙度是可以影响反射遮罩的，越粗糙，反射遮罩越黑，导致最终的镜面反射越弱。

代码如下，使用菲涅尔插值，最终和衰减相乘，得到 specularAlbedo（高光反照率）

```
// 镜面反射在不同角度下的过度(使用菲涅尔)
    // 使用菲涅尔插值 “高光颜色” 和 “grazing掠射颜色”
    // 其中brdfData.grazingTerm = saturate(smoothness + reflectivity)
    return surfaceReduction * lerp(brdfData.specular, brdfData.grazingTerm, fresnelTerm);
```

最终将他们相乘

镜面反射 = indirectSpecular（采样环境贴图）*AO*specularAlbedo（高光反照率）

得到 GI 镜面反射后，再加上 GI 漫反射，得到完整的 GI 光照。

**URP_PBR 和 BuildIn_PBR 的 GI 部分除了代码结构，算法上并无太大区别。**

**（三）、主光光照计算**

主光光照使用 LightingPhysicallyBased 函数来实现。主光作为精确光源，我们按照精确光源的渲染方程走，而主光光照的 BRDF 项分为 “漫反射 BRDF” 和“高光反射 BRDF”。

即：主光 BRDF = 漫反射 BRDF + 高光反射 BRDF

将主光 BRDF 乘以 LightColor 和 NdotL，就是出射辐射率了，即如下公式：

精确主光源的渲染方程：

$L_{o}=\pi*BRDF_{mainLight}*C_{mainLight}*(n\cdot l)$

**1、主光漫反射**

在 BuildIn_PBR 中，主光漫反射使用的是 DisneyBRDF 中的漫反射光照模型。而在 URP_PBR 中，使用的是 LambertBRDF 光照模型。所以效果会稍逊，特别是掠射角随着粗糙度会有明暗边的细节丢失了。

漫反射项 BRDF 公式：

$BRDF_{Lambert}=\frac{Cdiffuse}{\pi}$

但是代码中并没有除以 PI ，这在最后会说明。

```
half3 brdf = brdfData.diffuse;
```

**2、主光高光反射**

高光反射使用 DirectBRDFSpecular 函数实现。

高光项 BRDF 公式：

$f_{spec}=\frac{DFG}{4(n\cdot l)(n\cdot v)}$

其中 D 是法线分布函数，F 是菲涅尔反射函数，G 是阴影遮挡函数。

通常又将 （）$\frac{G}{（n\cdot l）(n\cdot v)}$ 作为可见项 $V$

最终 $f_{spec}=\frac{DFV}{4}$

D 项依然使用 GGX 法线分布函数，公式如下：

$D_{GGX}=\frac{roughness^2}{\pi((roughness^2-1)(n\cdot h)^2+1)^2}$

V 项使用改进后的 Cook-Torrance 可见性函数，公式如下，其中 roughness+0.5 是为了加入粗糙度的干预，使粗糙度可以影响法线遮挡，越粗糙，可见微面元被遮挡的可能性越大，可见性是越低的。这也是 Unity 自己改进的算法。

$V = \frac{1}{(l\cdot h)^2(roughness+0.5)}$

F 项在 URP 版本的高光项中并没有乘入。可能官方觉得直接光可以不加入菲涅尔反射，因为间接光里已经加入了菲涅尔效果。

合并所有项，最终 BRDFspec = roughness^2 / (NdotH^2 * (roughness^2 - 1) + 1 )^2 * (LdotH^2 * (roughness + 0.5) * 4.0)

进一步化简，(roughness + 0.5) * 4.0 = roughness * 4.0 + 2.0，使用 brdfData.normalizationTerm = roughness * 4.0 + 2.0 变量代入得到

BRDFspec = roughness^2 / (NdotH^2 * (roughness^2 - 1) + 1 )^2 * (LdotH^2 * brdfData.normalizationTerm)

代码套入上面化简公式即可。

```
float3 halfDir = SafeNormalize(float3(lightDirectionWS) + float3(viewDirectionWS));
    float NdotH = saturate(dot(normalWS, halfDir));
    half LdotH = saturate(dot(lightDirectionWS, halfDir));
    
    // GGX法线分布函数D项分母（没有算平方）
    float d = NdotH * NdotH * brdfData.roughness2MinusOne + 1.00001f;
    // CookTorrance可见性V项的分母
    half LdotH2 = LdotH * LdotH;
    // 最终高光项
    half specularTerm = brdfData.roughness2 / ((d * d) * max(0.1h, LdotH2) * brdfData.normalizationTerm);
```

注意：D 项中分母有 $\pi$ ，但是代码中却没除以 $\pi$ ，结合漫反射 BRDF 也没除以 $\pi$ ，原因是：

漫反射 BRDF 和高光反射 BRDF 均在分母含有 $\pi$ ，而总公式是要乘以 $\pi$ 的，最后刚好抵消，所以在计算中干脆不除，减少计算量，公式如下所示：

$L_{o}=\pi*(\frac{BRDF_{diffuse}}{\pi}+\frac{BRDF_{specular}}{\pi})*C_{mainLight}*(n\cdot l)$

最终将总的 BRDF 乘以 lightColor 和 NdotL（这里的 radiance 命名有点歧义，因为 radiance 是应该包含 BRDF 的，也就是说最后返回的才是 radiance）得到主光光照。

```
half NdotL = saturate(dot(normalWS, lightDirectionWS));
    half3 radiance = lightColor * (lightAttenuation * NdotL);// 直接光的辐射率（其实乘以BRDF才是真正的辐射率）

    return brdf * radiance; // 直接光的辐射率Lo
```

**URP 版本和 BuildIn 版本的直接光算法区别：**

**1、URP 版本的 diffuseTerm 使用 LambertBRDF 光照模型，而 BuildIn 使用 DesinyBRDF 光照模型。**

**2、URP 版本的 specularTerm 里的 F 项为 1，BuildIn 版本使用 Schlick 菲涅尔公式实现 F 项。**

**3、URP 版本的 V 项使用改进后的 Cook-Torrance 函数，并且加入了 roughness 干预，BuildIn 版本使用 SmithJoint 函数。**

**（四）、额外光光照计算**

额外光照计算又分成 “额外像素光照” 和“额外顶点光照”

**1、额外像素光照**

额外灯的 BRDF 算法和主光是一样的，不一样的只是灯光颜色、方向、衰减，所以只需获得额外灯的这些属性即可。

Unity 首先通过额外灯的索引，遍历所有额外灯，并获得每盏灯的属性。

```
// 像素灯的数量
        uint pixelLightCount = GetAdditionalLightsCount();
        // 
        for (uint lightIndex = 0u; lightIndex < pixelLightCount; ++lightIndex)
        {
            // 获得灯光颜色、方向、衰减、阴影衰减
            Light light = GetAdditionalLight(lightIndex, inputData.positionWS, shadowMask);

            ............

        }
```

如果定义了 SSAO，将灯光颜色乘以 AO，重新赋值 lightColor

```
#if defined(_SCREEN_SPACE_OCCLUSION)
    light.color *= aoFactor.directAmbientOcclusion;
#endif
```

最后使用统一的 BRDF 函数 “LightingPhysicallyBased()” 计算额外灯的 Lo

```
// 额外灯的Lo
        color += LightingPhysicallyBased1(brdfData, brdfDataClearCoat,
        light,
        inputData.normalWS, inputData.viewDirectionWS,
        surfaceData.clearCoatMask, specularHighlightsOff);
```

**2、额外顶点光照**

顶点光照在顶点着色器中计算，通过 VertexLighting 函数，同样是遍历每盏顶点灯，然后获得灯光属性，只是最后不做 BRDF 计算，而是进行简单的 Lambert 处理。

```
half3 VertexLighting(float3 positionWS, half3 normalWS)
{
    half3 vertexLightColor = half3(0.0, 0.0, 0.0);
 #ifdef _ADDITIONAL_LIGHTS_VERTEX
    uint lightsCount = GetAdditionalLightsCount();
    for (uint lightIndex = 0u; lightIndex < lightsCount; ++lightIndex)
    {
        Light light = GetAdditionalLight(lightIndex, positionWS);
        half3 lightColor = light.color * light.distanceAttenuation;
        vertexLightColor += LightingLambert(lightColor, light.direction, normalWS);
    }
#endif

    return vertexLightColor;
}
```

将顶点光照和漫反射颜色相乘。

```
#ifdef _ADDITIONAL_LIGHTS_VERTEX
        color += inputData.vertexLighting * brdfData.diffuse;
    #endif
```

最后将所有项相加，整个通用 PBR 流程走完。

第一篇就先到这儿，下一篇分享 ClearCoatPBR 的算法流程。


# 一、PBR 工作流
工作中，会有很多美术同学提出疑问，高光流和金属流如何选择，他们的异同点到底是什么，遵循 PBR 的美术制作流程又到底是怎样的。在进行 ClearCoatPBR 的剖析前，我们先聊一聊 PBR 的这两个工作流，并且结合上一篇文章的 InitializeBRDFData 函数，根据不同工作流的选择，分析其中的参数赋值。

**1、金属和非金属的光照特性**

首先我们知道一束光打在物体上，一部分直接被反射（高光反射），一部分被吸收，一部分被折射到内部后又从物体表面射出（漫反射，包括次表面反射），一部分折射到内部后从物体另一个表面射出（透射）。一般材质，我们忽略透射，只考虑前三者，即：

总光照 = 漫反射 + 高光反射 + 吸收

自然界的物质根据光照特性大体可以分为金属和非金属。

金属的光照特性是：漫反射率基本为 0，所以漫反射颜色也为 0（黑色），所以总光照 = 高光反射 + 吸收，那么高光反射到底占总光照的多少呢，我们使用 reflctivity（高光反射率）* 总光照来获得，reflctivity 在 [70%，100%]。而高光颜色总是偏金属本身的颜色，例如黄金的高光颜色是金黄色，白银的高光颜色是灰色，黄铜的高光颜色是黄色。

**金属：漫反射率 = 0，漫反射颜色 = 黑，高光反射率 = reflctivity，高光颜色 = 自身颜色**

非金属的光照特性是：高光反射率在 4% 左右（高光颜色几乎为黑色 0），而漫反射很强，漫反射颜色 =（1-reflctivity）*albedo，其中 1-reflctivity 等于 “漫反射 + 吸收” 的光照比例，再乘以 diffuse 后就是漫反射颜色。

**非金属：漫反射率 = 1-reflctivity，漫反射颜色 = 自身颜色，高光反射率 = 0.04，高光颜色 = 灰黑**

**2、PBR 工作流分析**

然后来看 PBR，PBR 的核心也是将物体分成了金属和非金属两类，除了漫反射和高光反射外，还增加了 roughness 属性，它可以控制高光的扩散程度，roughness 越大，高光越散。

我们都知道 PBR 流程分为：

“Metal-Roughness”（金属度 - 粗糙度）流程

“Specular-Glossiness”（高光反射 - 光泽度）流程

接下来我们分别说明两个流程里用到的贴图。（除了公用的 AO、Normal、Emission 等）

![[f2cb97c58a08caa135b771b4a8b2066a_MD5.jpg]]

**（1）、“Metal-Roughness”（金属度 - 粗糙度）流程**

**（a）BaseColor (基础色贴图)**

包含了 “金属的高光反射颜色” 和“非金属的漫反射颜色”，相当于将金属和非金属的可见色杂糅在一起了。

**（b）Roughness (粗糙度贴图)**

粗糙度是一张灰度图，取值范围 [0 ,1]，越靠近 1，越粗糙，它会影响高光的扩散程度。

**（c）Metallic (金属度贴图)**

金属度也是一张灰度图，取值范围 [0 ,1]，越靠近 1，金属属性越强，反之越弱。使用 Metallic 换算成 Reflectivity（Metallic 越强，Reflectivity 就越强，这两者可以认为是等价的，算法中 Metallic = Reflectivity）。

**（2）、“Specular-Glossiness”（高光反射 - 光泽度）流程**

**（a）Diffuse (漫反射贴图)**

包含了金属和非金属的漫反射颜色，其中金属的漫反射颜色为 0，所以是黑色的。

**（b）glossiness (光滑度贴图)**

就是粗糙度图的取反。

**（c）Specular (高光反射贴图)**

包含了金属和非金属的高光颜色，其中非金属的高光颜色很弱，所以是灰黑色的。使用 Specular 换算成 Reflectivity（Specular 越强，Reflectivity 就越强，这两者也可以认为是等价的，算法中 Reflectivity 取了 Specular 三通道中的最大值）。

**总结：这两种工作流实质上是将光照信息以不同的方式整合，存储在不同形式的贴图里**。

**在 Metal-Roughness 流程里，最明显的优势就是它的贴图非常省，总共只使用了五个通道。但它的问题在于，为了节约通道，它默认非金属的高光反射率等于 0.04，这从一定程度上限制了我们的设计发挥。**

**在 Specular-Glossiness 流程里，它还能单独调节非金属的高光颜色和反射率，但这导致它不得不使用两张 RGB 图，造成了一定程度上的存储压力。**

**最终将 Metallic 和 Specular 都转换成 Reflctivity，统一了两个工作流。**

**3、InitializeBRDFData 函数分析**

然后我们回顾上篇中的 InitializeBRDFData 函数，看下在不同工作流中的参数初始化。

如果选择高光流：

reflectivity 和 specular 成正比（高光颜色 3 通道中取最大值，保证反射最强烈）。

漫反射颜色使用 1-specular 得到非金属的漫反射率，乘以 albedo（实为 diffuse 颜色），得到非金属的漫反射颜色（金属的 diffuse 为 0，最终相乘还是 0）。

高光颜色由 specular 外部控制。

```
// 如果设置高光流
    #ifdef _SPECULAR_SETUP
        // 反射率
        half reflectivity = ReflectivitySpecular1(specular);
        // 反射率取反
        half oneMinusReflectivity = 1.0 - reflectivity;
        // 漫反射颜色
        half3 brdfDiffuse = albedo * (half3(1.0h, 1.0h, 1.0h) - specular);
        // 高光颜色
        half3 brdfSpecular = specular;// 高光颜色
```

如果选择金属流：

reflectivity 和 metallic 成正比，只不过取值范围在（0.04, 1），所以使用 metallic 在其间插值即可。

漫反射率和 metallic 成反比，所以使用 metallic 在（1， 0.04）间插值，注意取值范围是反过来的，所以使用 oneMinusReflectivity * albedo（baseColor）

高光反射率和 metallic 成正比，所以使用 metallic 代替高光反射率去插值（非金属 specular 和金属 specular 间插值）

```
// 如果设置金属流
    #else
        half oneMinusReflectivity = OneMinusReflectivityMetallic1(metallic);// 1 - 反射率
        half reflectivity = 1.0 - oneMinusReflectivity;// 反射率（金属度和反射率成正比）
        // metallic越弱，Reflectivity越小，oneMinusReflectivity就越大
        // 漫反射颜色越接近albedo本身，反之越暗
        half3 brdfDiffuse = albedo * oneMinusReflectivity;
        // 高光颜色
        // kDieletricSpec = half4(0.04, 0.04, 0.04, 1.0 - 0.04)
        // 非金属的反射系数普遍为0.04，可以理解为高光颜色是0.04
        // 金属的反射颜色为金属自身颜色
        // 所以metallic越强，反射颜色为自身颜色，反之为0.04
        half3 brdfSpecular = lerp(kDieletricSpec.rgb, albedo, metallic);
```

# 二、ClearCoatPBR

ClearCoat（清漆）材质，可以实现基础层 + 清漆层的双层材质效果，比如车漆、打蜡木地板、镀膜材料等等。基础层由通用 PBR 算法实现，清漆层由 ClearCoatPBR 算法实现，最后将两个层混合在一起，就可以实现双层材质的效果。UE4 在很早就内置了清漆材质（至少 3 年了），Unity 直到 2020 版本才有这个功能，需要使用 complexLit 着色器才能开启。接下来我们看下代码内部的实现。

Unity 使用 InitializeBRDFDataClearCoat 函数实现，分 3 步走：

1、ClearCoatBRDF 参数初始化

2、GI 间接光计算

3、直接光计算

**1、ClearCoatBRDF 参数初始化**

ClearCoatBRD 中的粗糙度（perceptualRoughness）需要重新赋值，根据平台不同，算法也不同，下面分移动端和非移动端来说明。

**（1）移动端**

移动端的参数和基础层的 BRDF 的参数算法是一样的。由于清漆是非金属，所以高光反射率为 0.04，高光颜色也是 0.04

```
// 清漆层的属性
    outBRDFData.diffuse             = kDielectricSpec.aaa; // 清漆的漫反射颜色 0.96
    outBRDFData.specular            = kDielectricSpec.rgb;//清漆的高光反射颜色 0.04
    outBRDFData.reflectivity        = kDielectricSpec.r;// 清漆的高光反射率 0.04

    outBRDFData.perceptualRoughness = PerceptualSmoothnessToPerceptualRoughness(clearCoatSmoothness);// 1 - clearCoatSmoothness
    outBRDFData.roughness           = max(PerceptualRoughnessToRoughness(outBRDFData.perceptualRoughness), HALF_MIN_SQRT);// perceptualRoughness^2
    outBRDFData.roughness2          = max(outBRDFData.roughness * outBRDFData.roughness, HALF_MIN);// roughness^2
    outBRDFData.normalizationTerm   = outBRDFData.roughness * 4.0h + 2.0h;
    outBRDFData.roughness2MinusOne  = outBRDFData.roughness2 - 1.0h;
    outBRDFData.grazingTerm         = saturate(clearCoatSmoothness + kDielectricSpec.x);// 掠射颜色
```

**（2）非移动端**

而在非移动端下，重新计算了 perceptualRoughness，具体算法见注释。并重新赋值了其他属性。

```
// 非移动端
#if !defined(SHADER_API_MOBILE)
    // Modify Roughness of base layer using coat IOR
    // CLEAR_COAT_IOR = 1.5
    // CLEAR_COAT_IETA = 1.0 / CLEAR_COAT_IOR  // IETA是eta的倒数
    half ieta                        = lerp(1.0h, CLEAR_COAT_IETA, clearCoatMask);
    half coatRoughnessScale          = Sq(ieta);// ieta^2
    // real RoughnessToVariance(real roughness)
    // {
    //     return 2.0 / Sq(roughness) - 2.0;
    // }
    // sigma = 2.0 / perceptualRoughness^4 - 2.0
    half sigma                       = RoughnessToVariance(PerceptualRoughnessToRoughness(baseBRDFData.perceptualRoughness));

    // perceptualRoughness = sqrt(sqrt(2.0 / sigma * coatRoughnessScale + 2.0));
    baseBRDFData.perceptualRoughness = RoughnessToPerceptualRoughness(VarianceToRoughness(sigma * coatRoughnessScale));

    // 重新计算其他属性
    baseBRDFData.roughness          = max(PerceptualRoughnessToRoughness(baseBRDFData.perceptualRoughness), HALF_MIN_SQRT);
    baseBRDFData.roughness2         = max(baseBRDFData.roughness * baseBRDFData.roughness, HALF_MIN);
    baseBRDFData.normalizationTerm  = baseBRDFData.roughness * 4.0h + 2.0h;
    baseBRDFData.roughness2MinusOne = baseBRDFData.roughness2 - 1.0h;
#endif
```

然后初始化 specular，使用 clearCoatMask 插值计算清漆的最终高光颜色。

```
baseBRDFData.specular = lerp(baseBRDFData.specular, ConvertF0ForClearCoat151(baseBRDFData.specular), clearCoatMask);
```

其中 ConvertF0ForClearCoat15 函数如下，根据不同平台，计算出的清漆高光颜色。具体算法见注释。

```
half3 ConvertF0ForClearCoat151(half3 f0) {
#if defined(SHADER_API_MOBILE)
    //return saturate(f0 * (f0 * 0.526868 + 0.529324) - 0.0482256)
    return ConvertF0ForAirInterfaceToF0ForClearCoat15Fast(f0);
#else
    //return saturate(-0.0256868 + f0 * (0.326846 + (0.978946 - 0.283835 * f0) * f0))
    return ConvertF0ForAirInterfaceToF0ForClearCoat15(f0);
#endif
}
```

**2、GI 间接光计算**

ClearCoat 的 GI 间接光只有 “GI 高光反射”，没有 “GI 漫反射”，漫反射使用基础层的。

GI 高光反射和基础层是一样的，通过采样 CubeMap，并根据其 MipLevel 来控制粗糙度，所以还是使用 GlossyEnvironmentReflection 函数实现。

```
// 清漆层的IBL（GI高光反射）
half3 coatIndirectSpecular = GlossyEnvironmentReflection(reflectVector, brdfDataClearCoat.perceptualRoughness, occlusion);
```

高光衰减和遮罩使用 EnvironmentBRDFClearCoat 函数，算法也和基础层一样。最后将高光颜色 * 衰减，得到最终高光颜色。（函数中第一句代码不用写，写了也没地引用，这串代码是在 EnvironmentBRDFSpecular 函数中计算的，官方也不是十全十美啊，这么明显的代码冗余）。

```
// 清漆层GI漫反射
half3 EnvironmentBRDFClearCoat(BRDFData brdfData, half clearCoatMask, half3 indirectSpecular, half fresnelTerm) {
    float surfaceReduction = 1.0 / (brdfData.roughness2 + 1.0);
    return indirectSpecular * EnvironmentBRDFSpecular(brdfData, fresnelTerm) * clearCoatMask;
}
```

接着计算清漆层的菲涅尔反射。

```
// 清漆层的菲涅尔反射
half coatFresnel = kDielectricSpec.x + kDielectricSpec.a * fresnelTerm;
```

最终混合基础层的 GI

```
// 混合基础层和清漆层的GI
return color * (1.0 - coatFresnel * clearCoatMask) + coatColor;
```

**3、直接光计算**

直接光也只有 “直接光高光反射”，漫反射使用基础层的。

和基础层的高光项算法一致，使用 DirectBRDFSpecular 函数实现。

```
half brdfCoat = kDielectricSpec.r * DirectBRDFSpecular1(brdfDataClearCoat, normalWS, lightDirectionWS, viewDirectionWS);
```

然后计算菲涅尔反射。

```
half NoV = saturate(dot(normalWS, viewDirectionWS));
// 清漆层的F项
half coatFresnel = kDielectricSpec.x + kDielectricSpec.a * Pow4(1.0 - NoV);
```

最后混合基础层的高光。

```
// 混合清漆层和基础层的高光
brdf = brdf * (1.0 - clearCoatMask * coatFresnel) + brdfCoat * clearCoatMask;
```

至此，2020 版本的 PBR 代码剖析完毕。欢迎大家留言区讨论并指正错误。