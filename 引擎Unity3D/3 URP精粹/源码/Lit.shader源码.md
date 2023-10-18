
> [!NOTE] 版本
> Unity2022.3.0f1c1：URP14.0

# SubShader
Lit. shader 只有一个 SubShader，SubShader 的 Tags 如下：

```c
Tags  
{  
    "RenderType" = "Opaque"  
    "RenderPipeline" = "UniversalPipeline"  
    "UniversalMaterialType" = "Lit"  
    "IgnoreProjector" = "True"  
}
```

SubShader 需要添加 `"RenderPipeline" = "UniversalPipeline"` 标签，告诉 Unity 当前 SubShader 需要在 URP 运行。
>如果想要一个 Shader 既可以在 URP 也可以在 Builtin 运行，可以加一个 SubShader，或者通过 FallBack 指令回到适配的 Shader。

```c
FallBack "Hidden/Universal Render Pipeline/FallbackError"  //显示错误紫色
CustomEditor "UnityEditor.Rendering.Universal.ShaderGUI.LitShader" //ShaderGUI
```

# Pass

### ForwardLit
前向渲染 Pass，在一个 Pass 中计算所有光照，包括全局光照 GI，自发光 Emission，雾效 Fog。

```c file:ForwardLit
Pass
{
    //Lightmode 标签 与 UniversalRenderPipeline.cs 中设置的 ShaderPassName 匹配
    //在SRP创建的Unlit Shader（SRPDefaultUnlit） 即便Pass中没有 Lightmode 标签也可以在URP中正常渲染。即Unlit shader可以不加 Lightmode 标签 
    Name "ForwardLit"
    Tags
    {
        "LightMode" = "UniversalForward"
    }

    // -------------------------------------
    // Render State Commands
    Blend[_SrcBlend][_DstBlend], [_SrcBlendAlpha][_DstBlendAlpha]
    ZWrite[_ZWrite]
    Cull[_Cull]
    AlphaToMask[_AlphaToMask]

    HLSLPROGRAM
    #pragma target 2.0

    // -------------------------------------
    // Shader Stages
    #pragma vertex LitPassVertex
    #pragma fragment LitPassFragment

    // -------------------------------------
    // 材质属性关键词 Material Keywords

    //对应材质inspector面板中的设置
    //例如：添加NormalMap就会传入_NORMALMAP关键词
    #pragma shader_feature_local _NORMALMAP 
    #pragma shader_feature_local _PARALLAXMAP 
    #pragma shader_feature_local _RECEIVE_SHADOWS_OFF 
    #pragma shader_feature_local _ _DETAIL_MULX2 _DETAIL_SCALED
    #pragma shader_feature_local_fragment _SURFACE_TYPE_TRANSPARENT
    #pragma shader_feature_local_fragment _ALPHATEST_ON
    #pragma shader_feature_local_fragment _ _ALPHAPREMULTIPLY_ON _ALPHAMODULATE_ON
    #pragma shader_feature_local_fragment _EMISSION
    #pragma shader_feature_local_fragment _METALLICSPECGLOSSMAP
    #pragma shader_feature_local_fragment _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
    #pragma shader_feature_local_fragment _OCCLUSIONMAP
    #pragma shader_feature_local_fragment _SPECULARHIGHLIGHTS_OFF
    #pragma shader_feature_local_fragment _ENVIRONMENTREFLECTIONS_OFF
    #pragma shader_feature_local_fragment _SPECULAR_SETUP
    
    // -------------------------------------
    // 通用管线关键词 Universal Pipeline keywords
    // 对应Universal Render Pipeline Asset和Lighting中的设置
    #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
    #pragma multi_compile _ _ADDITIONAL_LIGHTS_VERTEX _ADDITIONAL_LIGHTS
    #pragma multi_compile _ EVALUATE_SH_MIXED EVALUATE_SH_VERTEX
    #pragma multi_compile_fragment _ _ADDITIONAL_LIGHT_SHADOWS
    #pragma multi_compile_fragment _ _REFLECTION_PROBE_BLENDING
    #pragma multi_compile_fragment _ _REFLECTION_PROBE_BOX_PROJECTION
    #pragma multi_compile_fragment _ _SHADOWS_SOFT
    #pragma multi_compile_fragment _ _SCREEN_SPACE_OCCLUSION
    #pragma multi_compile_fragment _ _DBUFFER_MRT1 _DBUFFER_MRT2 _DBUFFER_MRT3
    #pragma multi_compile_fragment _ _LIGHT_LAYERS
    #pragma multi_compile_fragment _ _LIGHT_COOKIES
    #pragma multi_compile _ _FORWARD_PLUS
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/RenderingLayers.hlsl"
    
    // -------------------------------------
    // Unity定义的关键词 Unity defined keywords
    // 对应Lighting中的设置
    #pragma multi_compile _ LIGHTMAP_SHADOW_MIXING
    #pragma multi_compile _ SHADOWS_SHADOWMASK
    #pragma multi_compile _ DIRLIGHTMAP_COMBINED
    #pragma multi_compile _ LIGHTMAP_ON
    #pragma multi_compile _ DYNAMICLIGHTMAP_ON
    #pragma multi_compile_fragment _ LOD_FADE_CROSSFADE
    #pragma multi_compile_fog
    #pragma multi_compile_fragment _ DEBUG_DISPLAY
    
    // -------------------------------------
    // GPU Instancing
    #pragma multi_compile_instancing
    #pragma instancing_options renderinglayer
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DOTS.hlsl"

    // -------------------------------------
    // 变量声明、顶点函数和片元函数都在包含文件中
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitForwardPass.hlsl"
    ENDHLSL
}

```

#### LitForwardPass. hlsl
##### 顶点输入输出结构体
```c file:顶点输入结构体
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

struct Attributes
{
    float4 positionOS   : POSITION;
    float3 normalOS     : NORMAL;
    float4 tangentOS    : TANGENT;
    float2 texcoord     : TEXCOORD0;
    float2 staticLightmapUV   : TEXCOORD1; //静态光照贴图
    float2 dynamicLightmapUV  : TEXCOORD2; //动态光照贴图
    UNITY_VERTEX_INPUT_INSTANCE_ID //GPU Instancing获取实例ID
};
```

```c file:顶点输出结构体
struct Varyings
{
    float2 uv                       : TEXCOORD0;
    float3 positionWS               : TEXCOORD1;
    float3 normalWS                 : TEXCOORD2;
    half4  tangentWS                : TEXCOORD3;  // xyz:切线分量, w: 切线方向
    half4  fogFactorAndVertexLight   : TEXCOORD5; // 雾系数和顶点光照，x: fogFactor, yzw: vertex light
    half   fogFactor                 : TEXCOORD5; // 雾系数
    float4 shadowCoord              : TEXCOORD6;
    half3  viewDirTS                : TEXCOORD7;
    DECLARE_LIGHTMAP_OR_SH(staticLightmapUV, vertexSH, 8);//光照贴图纹理坐标，光照贴图名称，球谐光照名称，纹理坐标索引
    float2  dynamicLightmapUV : TEXCOORD9; // Dynamic lightmap UVs

    float4  positionCS               : SV_POSITION; //齐次裁剪空间顶点坐标
    
    UNITY_VERTEX_INPUT_INSTANCE_ID //GPU Instancing获取实例ID
    UNITY_VERTEX_OUTPUT_STEREO //用于VR平台的宏定义
};
```

##### InitializeInputData 函数
```c file:InitializeInputData函数
void InitializeInputData(Varyings input, half3 normalTS, out InputData inputData)
{
    inputData = (InputData)0; //初始化

    //世界空间顶点
#if defined(REQUIRES_WORLD_SPACE_POS_INTERPOLATOR)
    inputData.positionWS = input.positionWS;
#endif
    
    //世界空间观察向量
    half3 viewDirWS = GetWorldSpaceNormalizeViewDir(input.positionWS);

//------------------------------------------------------------------------
    //⭐NormalMap处理步骤：
    //TBN矩阵
#if defined(_NORMALMAP) || defined(_DETAIL)
    float sgn = input.tangentWS.w;      // should be either +1 or -1
    float3 bitangent = sgn * cross(input.normalWS.xyz, input.tangentWS.xyz);
    half3x3 tangentToWorld = half3x3(input.tangentWS.xyz, bitangent.xyz, input.normalWS.xyz);

    #if defined(_NORMALMAP)
    inputData.tangentToWorld = tangentToWorld;
    #endif
    //使用TBN矩阵将法线转换到世界空间
    inputData.normalWS = TransformTangentToWorld(normalTS, tangentToWorld);
#else
    inputData.normalWS = input.normalWS;
#endif
    //将法线标准化
    inputData.normalWS = NormalizeNormalPerPixel(inputData.normalWS);
    inputData.viewDirectionWS = viewDirWS;
    
//--------------------------------------------------------------------
    //⭐获取阴影坐标
#if defined(REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR) //如果需要顶点阴影坐标
    inputData.shadowCoord = input.shadowCoord;
#elif defined(MAIN_LIGHT_CALCULATE_SHADOWS) //如果主光开启了计算阴影
    //传入世界空间顶点坐标得到阴影坐标
    inputData.shadowCoord = TransformWorldToShadowCoord(inputData.positionWS);
#else
    inputData.shadowCoord = float4(0, 0, 0, 0);
#endif

//--------------------------------------------------------------------
#ifdef _ADDITIONAL_LIGHTS_VERTEX //当额外灯光选择了逐顶点光照
    //保存雾系数和顶点光照
    inputData.fogCoord = InitializeInputDataFog(float4(input.positionWS, 1.0), input.fogFactorAndVertexLight.x); 
    inputData.vertexLighting = input.fogFactorAndVertexLight.yzw; 
#else
    //只保存雾系数
    inputData.fogCoord = InitializeInputDataFog(float4(input.positionWS, 1.0), input.fogFactor);
#endif

//--------------------------------------------------------------------
#if defined(DYNAMICLIGHTMAP_ON)
    //调用SAMPLE_GI宏定义得到全局光照（球谐函数）
    inputData.bakedGI = SAMPLE_GI(input.staticLightmapUV, input.dynamicLightmapUV, input.vertexSH, inputData.normalWS);
#else
    inputData.bakedGI = SAMPLE_GI(input.staticLightmapUV, input.vertexSH, inputData.normalWS);
#endif

    inputData.normalizedScreenSpaceUV = GetNormalizedScreenSpaceUV(input.positionCS);
    inputData.shadowMask = SAMPLE_SHADOWMASK(input.staticLightmapUV);

    #if defined(DEBUG_DISPLAY)
    #if defined(DYNAMICLIGHTMAP_ON)
    inputData.dynamicLightmapUV = input.dynamicLightmapUV;
    #endif
    #if defined(LIGHTMAP_ON)
    inputData.staticLightmapUV = input.staticLightmapUV;
    #else
    inputData.vertexSH = input.vertexSH;
    #endif
    #endif
}
```

```c file:将法线标准化的函数
//普通的normalize
float3 NormalizeNormalPerVertex(float3 normalWS)
{
    return normalize(normalWS);
}

//兼容长度为0的向量
float3 NormalizeNormalPerPixel(float3 normalWS)
{
    //使用XYZ法线映射编码，我们偶尔采样接近零长度的法线，导致Inf/NaN
    #if defined(UNITY_NO_DXT5nm) && defined(_NORMALMAP)
        return SafeNormalize(normalWS);
    #else
        return normalize(normalWS);
    #endif
}
```

```c file:传入世界空间顶点坐标得到阴影坐标
float4 TransformWorldToShadowCoord(float3 positionWS)
{
#ifdef _MAIN_LIGHT_SHADOWS_CASCADE //如果开启了级联阴影
    half cascadeIndex = ComputeCascadeIndex(positionWS); //获取级联索引
#else
    half cascadeIndex = half(0.0);
#endif
    //根据级联索引获取对应的阴影坐标
    float4 shadowCoord = mul(_MainLightWorldToShadow[cascadeIndex], float4(positionWS, 1.0));

    return float4(shadowCoord.xyz, 0);
}
```

##### 顶点着色器函数
```c
Varyings LitPassVertex(Attributes input)
{
    Varyings output = (Varyings)0; //初始化

    UNITY_SETUP_INSTANCE_ID(input); //GPU Instancing获取实例ID
    UNITY_TRANSFER_INSTANCE_ID(input, output); //将实例ID从输入结构体传递到输出结构体
    UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output); //用于VR平台的宏定义

    //获取顶点位置信息
    VertexPositionInputs vertexInput = GetVertexPositionInputs(input.positionOS.xyz);

    // normalWS and tangentWS已经标准化
    // this is required to avoid skewing the direction during interpolation
    // also required for per-vertex lighting and SH evaluation
    VertexNormalInputs normalInput = GetVertexNormalInputs(input.normalOS, input.tangentOS);

    //计算顶点光照
    half3 vertexLight = VertexLighting(vertexInput.positionWS, normalInput.normalWS);

    //计算雾系数
    half fogFactor = 0;
    #if !defined(_FOG_FRAGMENT)
        fogFactor = ComputeFogFactor(vertexInput.positionCS.z);
    #endif
    
    //得到纹理坐标
    output.uv = TRANSFORM_TEX(input.texcoord, _BaseMap);

    // 保存法线切线信息
    output.normalWS = normalInput.normalWS;
#if defined(REQUIRES_WORLD_SPACE_TANGENT_INTERPOLATOR) || defined(REQUIRES_TANGENT_SPACE_VIEW_DIR_INTERPOLATOR)
    real sign = input.tangentOS.w * GetOddNegativeScale();
    half4 tangentWS = half4(normalInput.tangentWS.xyz, sign);
#endif
#if defined(REQUIRES_WORLD_SPACE_TANGENT_INTERPOLATOR)
    output.tangentWS = tangentWS;
#endif


#if defined(REQUIRES_TANGENT_SPACE_VIEW_DIR_INTERPOLATOR)
    //世界空间观察方向
    half3 viewDirWS = GetWorldSpaceNormalizeViewDir(vertexInput.positionWS);
    //切线空间观察方向
    half3 viewDirTS = GetViewDirectionTangentSpace(tangentWS, output.normalWS, viewDirWS);
    output.viewDirTS = viewDirTS;
#endif

    //OUTPUT_LIGHTMAP_UV()宏得到光照贴图纹理坐标lightmapUV
    OUTPUT_LIGHTMAP_UV(input.staticLightmapUV, unity_LightmapST, output.staticLightmapUV);
#ifdef DYNAMICLIGHTMAP_ON
    output.dynamicLightmapUV = input.dynamicLightmapUV.xy * unity_DynamicLightmapST.xy + unity_DynamicLightmapST.zw;
#endif
    //OUTPUT_SH宏得到顶点球谐光照
    OUTPUT_SH(output.normalWS.xyz, output.vertexSH);

    //保存雾系数和顶点光照
#ifdef _ADDITIONAL_LIGHTS_VERTEX
    output.fogFactorAndVertexLight = half4(fogFactor, vertexLight);
#else
    output.fogFactor = fogFactor;
#endif

#if defined(REQUIRES_WORLD_SPACE_POS_INTERPOLATOR)
    output.positionWS = vertexInput.positionWS;
#endif

#if defined(REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR)
    output.shadowCoord = GetShadowCoord(vertexInput);
#endif

    output.positionCS = vertexInput.positionCS;

    return output;
}
```

###### 获取顶点位置和法线信息

```cs file:Core.hlsl：顶点位置/法线输入结构体
struct VertexPositionInputs
{
    float3 positionWS; 
    float3 positionVS; 
    float4 positionCS; 
    float4 positionNDC;
};

struct VertexNormalInputs
{
    real3 tangentWS;
    real3 bitangentWS;
    float3 normalWS;
};

//输入模型空间坐标，得到其他空间坐标
VertexPositionInputs GetVertexPositionInputs(float3 positionOS)
{
    VertexPositionInputs input;
    input.positionWS = TransformObjectToWorld(positionOS);
    input.positionVS = TransformWorldToView(input.positionWS);
    input.positionCS = TransformWorldToHClip(input.positionWS);

    float4 ndc = input.positionCS * 0.5f;
    input.positionNDC.xy = float2(ndc.x, ndc.y * _ProjectionParams.x) + ndc.w;
    input.positionNDC.zw = input.positionCS.zw;

    return input;
}


//输入模型空间法线，获得世界法线，其他分量只是简单填充
VertexNormalInputs GetVertexNormalInputs(float3 normalOS)
{
    VertexNormalInputs tbn;
    tbn.tangentWS = real3(1.0, 0.0, 0.0);
    tbn.bitangentWS = real3(0.0, 1.0, 0.0);
    tbn.normalWS = TransformObjectToWorldNormal(normalOS);
    return tbn;
}

//输入模型空间法线和切线，获取TBN分量
VertexNormalInputs GetVertexNormalInputs(float3 normalOS, float4 tangentOS)
{
    VertexNormalInputs tbn;

    // 兼容mikktsSpace.在片元处提取法线时只进行归一化
    real sign = real(tangentOS.w) * GetOddNegativeScale();
    tbn.normalWS = TransformObjectToWorldNormal(normalOS);
    tbn.tangentWS = real3(TransformObjectToWorldDir(tangentOS.xyz));
    tbn.bitangentWS = real3(cross(tbn.normalWS, float3(tbn.tangentWS))) * sign;
    return tbn;
}
```
###### 计算顶点光照
```cs file:Lighting.hlsl:计算顶点光照
half3 VertexLighting(float3 positionWS, half3 normalWS)
{
    half3 vertexLightColor = half3(0.0, 0.0, 0.0);

//当开启额外灯光并将其设置为顶点光照
#ifdef _ADDITIONAL_LIGHTS_VERTEX
    uint lightsCount = GetAdditionalLightsCount(); //获取所有额外灯光数量

    //遍历所有灯光并累加颜色
    LIGHT_LOOP_BEGIN(lightsCount)
        Light light = GetAdditionalLight(lightIndex, positionWS);
        half3 lightColor = light.color * light.distanceAttenuation;
        vertexLightColor += LightingLambert(lightColor, light.direction, normalWS);
    LIGHT_LOOP_END
#endif

    return vertexLightColor;
}

```
###### 计算雾系数
```cs file:Core.hlsl:计算雾系数
real ComputeFogFactor(float zPositionCS)
{
    //由于OpenGL和Direct3D保存深度值的范围不同
    //使用UNITY_Z_0_FAR_FROM_CLIPSPACE()宏针对不哦她那个平台重新映射深度值的范围
    float clipZ_0Far = UNITY_Z_0_FAR_FROM_CLIPSPACE(zPositionCS); 
    
    return ComputeFogFactorZ0ToFar(clipZ_0Far);
}

real ComputeFogFactorZ0ToFar(float z)
    {
    //当使用线性雾
    #if defined(FOG_LINEAR) 
    // factor = (end-z)/(end-start) = z * (-1/(end-start)) + (end/(end-start))
    float fogFactor = saturate(z * unity_FogParams.z + unity_FogParams.w);
    return real(fogFactor);

    //当使用指数雾
    #elif defined(FOG_EXP) || defined(FOG_EXP2)
    // factor = exp(-(density*z)^2)
    // -density * z computed at vertex
    return real(unity_FogParams.x * z);
    #else
        return real(0.0);
    #endif
}
```

###### 光照贴图和球谐光照宏定义

```c file:lighting.hlsl:光照贴图和球谐光照宏定义
//如果使用了光照贴图
#if defined(LIGHTMAP_ON) 
    //该宏用于声明光照贴图的纹理坐标
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) float2 lmName : TEXCOORD##index
    //该宏用于计算光照贴图的纹理坐标（就是一个正常的uv计算）
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT) OUT.xy = lightmapUV.xy * lightmapScaleOffset.xy + lightmapScaleOffset.zw;
    //空定义
    #define OUTPUT_SH(normalWS, OUT) 

//否则使用球谐光照
#else
    //该宏用于声明球谐光照贴图的纹理坐标
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) half3 shName : TEXCOORD##index
    //空定义
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT)
    //该宏用于计算球谐光照
    #define OUTPUT_SH(normalWS, OUT) OUT.xyz = SampleSHVertex(normalWS)
#endif
```
###### 获取阴影坐标
```c file:Shadows.hlsl:获取阴影坐标
float4 GetShadowCoord(VertexPositionInputs vertexInput)
{
#if defined(_MAIN_LIGHT_SHADOWS_SCREEN) && !defined(_SURFACE_TYPE_TRANSPARENT)
    return ComputeScreenPos(vertexInput.positionCS);
#else
    return TransformWorldToShadowCoord(vertexInput.positionWS);
#endif
}
```

##### 片元着色器函数
```c
void LitPassFragment(
    Varyings input
    , out half4 outColor : SV_Target0
#ifdef _WRITE_RENDERING_LAYERS
    , out float4 outRenderingLayers : SV_Target1
#endif
)
{
    UNITY_SETUP_INSTANCE_ID(input); //GPU Instancing获取实例ID
    UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input); //用于VR平台的宏定义

    //视察贴图
#if defined(_PARALLAXMAP)
#if defined(REQUIRES_TANGENT_SPACE_VIEW_DIR_INTERPOLATOR)
    half3 viewDirTS = input.viewDirTS;
#else
    half3 viewDirWS = GetWorldSpaceNormalizeViewDir(input.positionWS);
    half3 viewDirTS = GetViewDirectionTangentSpace(input.tangentWS, input.normalWS, viewDirWS);
#endif
    ApplyPerPixelDisplacement(viewDirTS, input.uv);
#endif

    //表面数据结构体
    SurfaceData surfaceData;
    //初始化
    InitializeStandardLitSurfaceData(input.uv, surfaceData);

#ifdef LOD_FADE_CROSSFADE
    LODFadeCrossFade(input.positionCS);
#endif
    
    //声明InputData结构体
    InputData inputData;
    //初始化
    InitializeInputData(input, surfaceData.normalTS, inputData);
    SETUP_DEBUG_TEXTURE_DATA(inputData, input.uv, _BaseMap);

#ifdef _DBUFFER
    ApplyDecalToSurfaceData(input.positionCS, surfaceData, inputData);
#endif

    //SurfaceData结构体和InputData结构体最终要传入UniversalFragmentPBR函数中
    //经过一系列内置函数最终计算出颜色
    half4 color = UniversalFragmentPBR(inputData, surfaceData);
    
    //将渲染颜色与三种类型的雾效进行混合
    color.rgb = MixFog(color.rgb, inputData.fogCoord);
    //计算透明度
    color.a = OutputAlpha(color.a, IsSurfaceTypeTransparent(_Surface));

    outColor = color;

#ifdef _WRITE_RENDERING_LAYERS
    uint renderingLayers = GetMeshRenderingLayer();
    outRenderingLayers = float4(EncodeMeshRenderingLayer(renderingLayers), 0, 0, 0);
#endif
}
```

```cs
struct SurfaceData
{
    half3 albedo;
    half3 specular;
    half  metallic;
    half  smoothness;
    half3 normalTS;
    half3 emission;
    half  occlusion;
    half  alpha;
    half  clearCoatMask;
    half  clearCoatSmoothness;
};
```
### ShadowCaster
阴影投射 Pass，计算灯光的阴影贴图
```cs
Pass
{
    Name "ShadowCaster"
    Tags
    {
        "LightMode" = "ShadowCaster"
    }

    // -------------------------------------
    // Render State Commands
    ZWrite On
    ZTest LEqual
    ColorMask 0  //只保存阴影信息，不需要颜色绘制
    Cull[_Cull]

    HLSLPROGRAM
    #pragma target 2.0

    // -------------------------------------
    // Shader Stages
    #pragma vertex ShadowPassVertex
    #pragma fragment ShadowPassFragment

    // -------------------------------------
    // Material Keywords
    // 计算阴影贴图会用到透明度裁切属性
    #pragma shader_feature_local_fragment _ALPHATEST_ON 
    #pragma shader_feature_local_fragment _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A

    //--------------------------------------
    // GPU Instancing
    #pragma multi_compile_instancing
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DOTS.hlsl"

    // -------------------------------------
    // Universal Pipeline keywords

    // -------------------------------------
    // Unity defined keywords
    #pragma multi_compile_fragment _ LOD_FADE_CROSSFADE 

    // This is used during shadow map generation to differentiate between directional and punctual light shadows, as they use different formulas to apply Normal Bias
    #pragma multi_compile_vertex _ _CASTING_PUNCTUAL_LIGHT_SHADOW

    // -------------------------------------
    // Includes
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/Shaders/ShadowCasterPass.hlsl"
    ENDHLSL
}
```
#### ShadowCasterPass. hlsl
```c
//这些变量在应用阴影法线偏移时使用，并由UnityEngine.Rendering.Universal.ShadowUtils.SetupShadowCasterConstantBuffer在com.unity.render-pipelines.universal/Runtime/ShadowUtils.cs中设置
float3 _LightDirection; //对于方向灯，_LightDirection在应用阴影法线偏移时使用。
float3 _LightPosition; //对于聚光灯和点光源，_LightPosition用于计算实际的光方向，因为它在每个阴影投射几何顶点是不同的。

struct Attributes
{
    float4 positionOS   : POSITION;
    float3 normalOS     : NORMAL;    //用于法线偏移
    float2 texcoord     : TEXCOORD0; //用于采样透明贴图
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings
{
    float2 uv           : TEXCOORD0;
    float4 positionCS   : SV_POSITION;
};

//获得齐次裁剪空间下的阴影坐标
float4 GetShadowPositionHClip(Attributes input)
{
    float3 positionWS = TransformObjectToWorld(input.positionOS.xyz);
    float3 normalWS = TransformObjectToWorldNormal(input.normalOS);

#if _CASTING_PUNCTUAL_LIGHT_SHADOW
    float3 lightDirectionWS = normalize(_LightPosition - positionWS);
#else
    float3 lightDirectionWS = _LightDirection;
#endif

    float4 positionCS = TransformWorldToHClip(ApplyShadowBias(positionWS, normalWS, lightDirectionWS));

//反向Z方式Z-Fighting
#if UNITY_REVERSED_Z
    positionCS.z = min(positionCS.z, UNITY_NEAR_CLIP_VALUE);
#else
    positionCS.z = max(positionCS.z, UNITY_NEAR_CLIP_VALUE);
#endif

    return positionCS;
}

Varyings ShadowPassVertex(Attributes input)
{
    Varyings output;
    UNITY_SETUP_INSTANCE_ID(input);

    output.uv = TRANSFORM_TEX(input.texcoord, _BaseMap);
    output.positionCS = GetShadowPositionHClip(input);
    return output;
}

half4 ShadowPassFragment(Varyings input) : SV_TARGET
{
    //透明度裁剪
    Alpha(SampleAlbedoAlpha(input.uv, TEXTURE2D_ARGS(_BaseMap, sampler_BaseMap)).a, _BaseColor, _Cutoff);

#ifdef LOD_FADE_CROSSFADE
    LODFadeCrossFade(input.positionCS);
#endif

    return 0;
}
```

```cs file:Shadow.hlsl:得到偏移后的阴影坐标
float3 ApplyShadowBias(float3 positionWS, float3 normalWS, float3 lightDirection)
{
    //_ShadowBias：x值是Depth Bias深度偏移，y是Normal Bias法线偏移
    //这两个值从灯光属性中设置
    //URP也可以在URPAsset中对除了点光源以外的所有灯光统一设置
    
    //得到背向灯光的暗面
    float invNdotL = 1.0 - saturate(dot(lightDirection, normalWS));
    //相乘得到法线方向的偏移程度
    float scale = invNdotL * _ShadowBias.y;

    //阴影世界空间坐标沿着灯光方向偏移
    positionWS = lightDirection * _ShadowBias.xxx + positionWS;
    //再沿着法线偏移
    positionWS = normalWS * scale.xxx + positionWS;
    return positionWS;
}
```

### GBUFFER
延迟渲染

### DepthOnly
计算摄像机的深度信息
```cs
Pass
{
    Name "DepthOnly"
    Tags
    {
        "LightMode" = "DepthOnly"
    }

    // -------------------------------------
    // Render State Commands
    ZWrite On
    ColorMask R  //深度图只需要R通道
    Cull[_Cull]

    HLSLPROGRAM
    #pragma target 2.0

    // -------------------------------------
    // Shader Stages
    #pragma vertex DepthOnlyVertex
    #pragma fragment DepthOnlyFragment

    // -------------------------------------
    // Material Keywords
    // 计算深度图会用到透明度裁切属性
    #pragma shader_feature_local_fragment _ALPHATEST_ON
    #pragma shader_feature_local_fragment _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A

    // -------------------------------------
    // Unity defined keywords
    #pragma multi_compile_fragment _ LOD_FADE_CROSSFADE

    //--------------------------------------
    // GPU Instancing
    #pragma multi_compile_instancing
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DOTS.hlsl"

    // -------------------------------------
    // Includes
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/Shaders/DepthOnlyPass.hlsl"
    ENDHLSL
}
```
#### DepthOnlyPass. hlsl

```c file:DepthOnlyPass.hlsl
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
#if defined(LOD_FADE_CROSSFADE)
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/LODCrossFade.hlsl"
#endif

struct Attributes
{
    float4 position     : POSITION;
    float2 texcoord     : TEXCOORD0;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings
{
    float2 uv           : TEXCOORD0;
    float4 positionCS   : SV_POSITION;
    UNITY_VERTEX_INPUT_INSTANCE_ID
    UNITY_VERTEX_OUTPUT_STEREO
};

Varyings DepthOnlyVertex(Attributes input)
{
    Varyings output = (Varyings)0;
    UNITY_SETUP_INSTANCE_ID(input);
    UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

    output.uv = TRANSFORM_TEX(input.texcoord, _BaseMap);
    output.positionCS = TransformObjectToHClip(input.position.xyz);
    return output;
}

half DepthOnlyFragment(Varyings input) : SV_TARGET
{
    UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
    //透明度裁剪
    Alpha(SampleAlbedoAlpha(input.uv, TEXTURE2D_ARGS(_BaseMap, sampler_BaseMap)).a, _BaseColor, _Cutoff);

#ifdef LOD_FADE_CROSSFADE
    LODFadeCrossFade(input.positionCS);
#endif
    //返回深度
    return input.positionCS.z;
}
```
### DepthNormals
绘制 `_CameraNormalsTexture` 纹理时使用
```cs
// This pass is used when drawing to a _CameraNormalsTexture texture
Pass
{
    Name "DepthNormals"
    Tags
    {
        "LightMode" = "DepthNormals"
    }

    // -------------------------------------
    // Render State Commands
    ZWrite On
    Cull[_Cull]

    HLSLPROGRAM
    #pragma target 2.0

    // -------------------------------------
    // Shader Stages
    #pragma vertex DepthNormalsVertex
    #pragma fragment DepthNormalsFragment

    // -------------------------------------
    // Material Keywords
    #pragma shader_feature_local _NORMALMAP
    #pragma shader_feature_local _PARALLAXMAP
    #pragma shader_feature_local _ _DETAIL_MULX2 _DETAIL_SCALED
    #pragma shader_feature_local_fragment _ALPHATEST_ON
    #pragma shader_feature_local_fragment _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A

    // -------------------------------------
    // Unity defined keywords
    #pragma multi_compile_fragment _ LOD_FADE_CROSSFADE

    // -------------------------------------
    // Universal Pipeline keywords
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/RenderingLayers.hlsl"

    //--------------------------------------
    // GPU Instancing
    #pragma multi_compile_instancing
    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DOTS.hlsl"

    // -------------------------------------
    // Includes
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitDepthNormalsPass.hlsl"
    ENDHLSL
}
```

### Meta
将材质的 Albedo 和 Emission 属性传递给 Unity 的烘焙系统，从而保证物体能够被准确计算出间接照明。因此只有 Shader 中带 MetaPass，物体才能烘焙出光照贴图，并且只有在烘焙光照贴图是，MetaPass 才会被执行。
```cs
// This pass it not used during regular rendering, only for lightmap baking.
    Pass
    {
        Name "Meta"
        Tags
        {
            "LightMode" = "Meta"
        }

        // -------------------------------------
        // Render State Commands
        Cull Off  //烘焙需要考虑到物体背面，因此关闭Cull

        HLSLPROGRAM
        #pragma target 2.0

        // -------------------------------------
        // Shader Stages
        #pragma vertex UniversalVertexMeta
        #pragma fragment UniversalFragmentMetaLit

        // -------------------------------------
        // Material Keywords
        #pragma shader_feature_local_fragment _SPECULAR_SETUP
        #pragma shader_feature_local_fragment _EMISSION
        #pragma shader_feature_local_fragment _METALLICSPECGLOSSMAP
        #pragma shader_feature_local_fragment _ALPHATEST_ON
        #pragma shader_feature_local_fragment _ _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
        #pragma shader_feature_local _ _DETAIL_MULX2 _DETAIL_SCALED
        #pragma shader_feature_local_fragment _SPECGLOSSMAP
        #pragma shader_feature EDITOR_VISUALIZATION

        // -------------------------------------
        // Includes
        #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
        #include "Packages/com.unity.render-pipelines.universal/Shaders/LitMetaPass.hlsl"

        ENDHLSL
    }
```

#### UniversalMetaPass. hlsl
```cs file:UniversalMetaPass.hlsl
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/MetaInput.hlsl"

struct Attributes
{
    float4 positionOS   : POSITION;
    float3 normalOS     : NORMAL;
    float2 uv0          : TEXCOORD0; //模型uv
    float2 uv1          : TEXCOORD1; //静态光照贴图uv
    float2 uv2          : TEXCOORD2; //动态光照（实时GI）贴图uv
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings
{
    float4 positionCS   : SV_POSITION;
    float2 uv           : TEXCOORD0;
#ifdef EDITOR_VISUALIZATION
    float2 VizUV        : TEXCOORD1;
    float4 LightCoord   : TEXCOORD2;
#endif
};

Varyings UniversalVertexMeta(Attributes input)
{
    Varyings output = (Varyings)0;
    //获取齐次裁剪空间顶点位置
    output.positionCS = UnityMetaVertexPosition(input.positionOS.xyz, input.uv1, input.uv2);
    output.uv = TRANSFORM_TEX(input.uv0, _BaseMap);
#ifdef EDITOR_VISUALIZATION
    UnityEditorVizData(input.positionOS.xyz, input.uv0, input.uv1, input.uv2, output.VizUV, output.LightCoord);
#endif
    return output;
}

half4 UniversalFragmentMeta(Varyings fragIn, MetaInput metaInput)
{
#ifdef EDITOR_VISUALIZATION
    metaInput.VizUV = fragIn.VizUV;
    metaInput.LightCoord = fragIn.LightCoord;
#endif

    return UnityMetaFragment(metaInput);
}
#endif

```

```cs file:获取齐次裁剪空间顶点位置
float4 UnityMetaVertexPosition(float3 vertex, float2 uv1, float2 uv2, float4 lightmapST, float4 dynlightmapST)
{
#ifndef EDITOR_VISUALIZATION
    if (unity_MetaVertexControl.x)  //x分量表示使用uv1作为光栅化坐标
    {
        vertex.xy = uv1 * lightmapST.xy + lightmapST.zw;
        // OpenGL right now needs to actually use incoming vertex position,
        // so use it in a very dummy way
        vertex.z = vertex.z > 0 ? REAL_MIN : 0.0f;
        //REAL_MIN表示无线接近于0的数值
    }
    if (unity_MetaVertexControl.y) //x分量表示使用uv2作为光栅化坐标
    {
        vertex.xy = uv2 * dynlightmapST.xy + dynlightmapST.zw;
        // OpenGL right now needs to actually use incoming vertex position,
        // so use it in a very dummy way
        vertex.z = vertex.z > 0 ? REAL_MIN : 0.0f;
    }
    return TransformWorldToHClip(vertex);
#else
    return TransformObjectToHClip(vertex);
#endif
}
```
### Universal2D
使用 2D 渲染器绘制物体时调用，不需要进行光照计算

```cs
Pass
{
    Name "Universal2D"
    Tags
    {
        "LightMode" = "Universal2D"
    }

    // -------------------------------------
    // Render State Commands
    Blend[_SrcBlend][_DstBlend]
    ZWrite[_ZWrite]
    Cull[_Cull]

    HLSLPROGRAM
    #pragma target 2.0

    // -------------------------------------
    // Shader Stages
    #pragma vertex vert
    #pragma fragment frag

    // -------------------------------------
    // Material Keywords
    //透明度裁剪
    #pragma shader_feature_local_fragment _ALPHATEST_ON
    #pragma shader_feature_local_fragment _ALPHAPREMULTIPLY_ON

    #include_with_pragmas "Packages/com.unity.render-pipelines.universal/ShaderLibrary/DOTS.hlsl"

    // -------------------------------------
    // Includes
    #include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/Shaders/Utils/Universal2D.hlsl"
    ENDHLSL
}
```

#### Universal2D. hlsl
```cs file:Universal2D.hlsl

struct Attributes
{
    float4 positionOS       : POSITION;
    float2 uv               : TEXCOORD0;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings
{
    float2 uv        : TEXCOORD0;
    float4 vertex : SV_POSITION;
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

Varyings vert(Attributes input)
{
    Varyings output = (Varyings)0;

    UNITY_SETUP_INSTANCE_ID(input);
    UNITY_TRANSFER_INSTANCE_ID(input, output);

    VertexPositionInputs vertexInput = GetVertexPositionInputs(input.positionOS.xyz);
    output.vertex = vertexInput.positionCS;
    output.uv = TRANSFORM_TEX(input.uv, _BaseMap);

    return output;
}

half4 frag(Varyings input) : SV_Target
{
    UNITY_SETUP_INSTANCE_ID(input);
    half2 uv = input.uv;
    half4 texColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, uv);
    half3 color = texColor.rgb * _BaseColor.rgb;
    half alpha = texColor.a * _BaseColor.a;
    //透明度裁切
    AlphaDiscard(alpha, _Cutoff);

    //是否开启透明度预乘
#ifdef _ALPHAPREMULTIPLY_ON
    color *= alpha;
#endif
    return half4(color, alpha);
}

```

