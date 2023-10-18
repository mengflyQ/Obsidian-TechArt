[Physically Based Rendering Algorithms In Unity - Jordan Stevens (jordanstevenstechart.com)](https://www.jordanstevenstechart.com/physically-based-rendering)


## 1、是什么让 PBR 物理化？

在过去的三四年里，我们对周围世界的理解以及它在科学 / 数学上的运作方式有了突飞猛进的发展。这种理解部分导致了渲染技术领域的巨大突破。站在巨人的背上，聪明的工程师已经能够就光线、视野、表面法线以及这三者如何相互作用得出一些严肃的结论。大多数这些突破都围绕着 BRDF（双向反射分布函数）的概念，以及固有的能量守恒。

为了了解光和你的视点如何与表面相互作用，必须首先了解表面本身。当光线照射在完美光滑的表面上时，它会以几乎完美的方式从该表面反射。当光与我们所说的粗糙表面相互作用时，它不会以类似的方式反射。这可以用微面的存在来解释。

![[0ffb8d7e0f69b6e67109d1a5d66c9fd2_MD5.jpg]]

当我们观察一个物体时，我们必须假设它的表面不是完全光滑的，而是由许多非常小的面组成，每个面都可能是一个完美的镜面反射器。这些微面的法线必须分布在光滑表面的法线上。微平面法线与光滑表面法线的不同程度取决于表面的粗糙度。表面越粗糙，破坏镜面高光的可能性就越大。因此，较粗糙的表面具有更大且看起来更暗的镜面高光。光滑的表面会导致镜面高光压缩，因为光线的反射比以前更完美。

现在回到 BRDF。双向反射率分布函数 (BRDF) 是描述表面反射率的函数。有几种不同的 BRDF 模型 / 算法，其中许多不是基于物理的算法。对于被认为是基于物理的 BRDF，它必须是能量守恒的。能量守恒指出，一个表面反射的光总量小于该表面接收到的光总量。从表面反射的光永远不会比它与我们之前讨论的所有这些微面相互作用之前更强烈。 BRDF 算法具有比其他算法更复杂的着色模型。这个着色模型在技术上是一个整体的 3 个部分：正态分布函数、几何阴影函数和菲涅耳函数。他们一起构成了这个算法，我们稍后将对其进行分解：

![[63c9cfa9fbe5fb5d5ea17a846b6273b8_MD5.png]]

要了解 BRDF，理解构成 BRDF 的 3 个函数非常重要。让我们依次点击每一个来制作一个适合我们的着色模型。

## 2、PBR 着色器的属性是什么？

在大多数 PBR 着色模型中，通常会看到一些相同的属性以某种格式影响它们。现代 PBR 方法中最重要的两个属性是平滑度（或粗糙度）和金属度。如果这两个值都在 0..1 之间，则它们的效果最好。构建 PBR 着色器有许多不同的方法，其中一些允许使用 BRDF 模型来获得更多效果，例如 Disney 的 PBR Pipeline，每种效果都由特定属性驱动。

让我们开始构建我们的属性，如果你现在还没有查看我关于在 Unity 中编写着色器的页面，那将是阅读并阅读该内容的好时机。

```
Shader "Physically-Based-Lighting" {
    Properties { 
    _Color ("Main Color", Color) = (1,1,1,1)                    //diffuse Color
    _SpecularColor ("Specular Color", Color) = (1,1,1,1)        //Specular Color (Not Used)
    _Glossiness("Smoothness",Range(0,1)) = 1                    //My Smoothness
    _Metallic("Metalness",Range(0,1)) = 0                    //My Metal Value 

    }
    SubShader {
	Tags {
            "RenderType"="Opaque"  "Queue"="Geometry"
        } 
        Pass {
            Name "FORWARD"
            Tags {
                "LightMode"="ForwardBase"
            }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #define UNITY_PASS_FORWARDBASE
            #include "UnityCG.cginc"
            #include "AutoLight.cginc"
            #include "Lighting.cginc"
            #pragma multi_compile_fwdbase_fullshadows 
            #pragma target 3.0

float4 _Color;
float4 _SpecularColor;
float _Glossiness;
float _Metallic;
```

这里我们在 Unity Shader 中定义了我们的公共变量，稍后会添加更多内容，但这是一个好的开始。属性下面是我们着色器的初始化结构。随着我们继续添加更多功能，稍后将参考 #pragma 指令。

## 3、顶点程序

我们的顶点程序与在 Unity 中编写着色器 教程中生成的程序极为相似 。我们需要的关键元素是关于顶点的法线、切线和双切线信息，因此确保将它们包含在我们的顶点程序中：

```
struct VertexInput {
    float4 vertex : POSITION;       //local vertex position
    float3 normal : NORMAL;         //normal direction
    float4 tangent : TANGENT;       //tangent direction 
    float2 texcoord0 : TEXCOORD0;   //uv coordinates
    float2 texcoord1 : TEXCOORD1;   //lightmap uv coordinates
};

struct VertexOutput {
    float4 pos : SV_POSITION;              //screen clip space position and depth
    float2 uv0 : TEXCOORD0;                //uv coordinates
    float2 uv1 : TEXCOORD1;                //lightmap uv coordinates

//below we create our own variables with the texcoord semantic. 
    float3 normalDir : TEXCOORD3;          //normal direction 
    float3 posWorld : TEXCOORD4;          //normal direction 
    float3 tangentDir : TEXCOORD5;
    float3 bitangentDir : TEXCOORD6;
    LIGHTING_COORDS(7,8)                   //this initializes the unity lighting and shadow
    UNITY_FOG_COORDS(9)                    //this initializes the unity fog
};

VertexOutput vert (VertexInput v) {
     VertexOutput o = (VertexOutput)0;           
     o.uv0 = v.texcoord0;
     o.uv1 = v.texcoord1;
     o.normalDir = UnityObjectToWorldNormal(v.normal);
     o.tangentDir = normalize( mul( _Object2World, float4( v.tangent.xyz, 0.0 ) ).xyz );
     o.bitangentDir = normalize(cross(o.normalDir, o.tangentDir) * v.tangent.w);
     o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
     o.posWorld = mul(_Object2World, v.vertex);
     UNITY_TRANSFER_FOG(o,o.pos);
     TRANSFER_VERTEX_TO_FRAGMENT(o)
     return o;
}
```

## 4、片段程序

在我们的片段程序中，将要定义一组变量，以便稍后在算法中使用：

```
float4 frag(VertexOutput i) : COLOR {

//normal direction calculations
     float3 normalDirection = normalize(i.normalDir);

     float3 lightDirection = normalize(lerp(_WorldSpaceLightPos0.xyz, _WorldSpaceLightPos0.xyz
 - i.posWorld.xyz,_WorldSpaceLightPos0.w));

     float3 lightReflectDirection = reflect( -lightDirection, normalDirection );

     float3 viewDirection = normalize(_WorldSpaceCameraPos.xyz - i.posWorld.xyz);

     float3 viewReflectDirection = normalize(reflect( -viewDirection, normalDirection ));

     float3 halfDirection = normalize(viewDirection+lightDirection); 

     float NdotL = max(0.0, dot( normalDirection, lightDirection ));

     float NdotH =  max(0.0,dot( normalDirection, halfDirection));

     float NdotV =  max(0.0,dot( normalDirection, viewDirection));

     float VdotH = max(0.0,dot( viewDirection, halfDirection));

     float LdotH =  max(0.0,dot(lightDirection, halfDirection));
 
     float LdotV = max(0.0,dot(lightDirection, viewDirection)); 

     float RdotV = max(0.0, dot( lightReflectDirection, viewDirection ));

     float attenuation = LIGHT_ATTENUATION(i);

     float3 attenColor = attenuation * _LightColor0.rgb;
```

根据 Unity Shader Tutorial 中的描述，以上是我们将使用 Unity 提供的数据构建的变量 。当我们开始构建 BRDF 时，这些变量将在着色器中重复使用。

## 5、粗糙度

在我的方法中，重新映射了粗糙度。我这样做的原因更多是个人喜好，因为我发现重新映射到下面的粗糙度会产生更多的物理结果。

```
float roughness = 1- (_Glossiness * _Glossiness);   // 1 - smoothness*smoothness
roughness = roughness * roughness;
```

## 6、金属度

更多的工作。在 PBR 着色器中使用 Metallic 时有很多问题。你会发现没有任何算法能解释它，所以我们完全以不同的格式包含它。

金属度是一个控制值，用于确定一种材料是介电材料（非金属，即金属度 = 0）还是金属（金属度 = 1）材料。因此，为了让 Metallic 值以正确的方式影响我们的着色器，我们将把它插入我们的漫反射颜色并让它驱动我们的镜面反射颜色。由于金属不会显示任何漫反射，因此它将具有完全黑色的漫反射反照率，而其实际的镜面反射颜色将改变以反射物体的表面。见下面代码：

```
float3 diffuseColor = _Color.rgb * (1-_Metallic) ;
float3 specColor = lerp(_SpecularColor.rgb, _Color.rgb, _Metallic * 0.5);
```

## 7、着色器的核心

下面是我们将要构建的基本着色器格式。请注意注释，因为它们将有助于组织和告知我们将在何处插入代码。

```
Shader "Physically-Based-Lighting" {
    Properties { 
    _Color ("Main Color", Color) = (1,1,1,1)                    //diffuse Color
    _SpecularColor ("Specular Color", Color) = (1,1,1,1)        //Specular Color (Not Used)
    _Glossiness("Smoothness",Range(0,1)) = 1                    //My Smoothness
    _Metallic("Metalness",Range(0,1)) = 0                    //My Metal Value 

// future shader properties will go here!! Will be referred to as Shader Property Section
    }

    SubShader {
	Tags {
            "RenderType"="Opaque"  "Queue"="Geometry"
        } 
        Pass {
            Name "FORWARD"
            Tags {
                "LightMode"="ForwardBase"
            }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #define UNITY_PASS_FORWARDBASE
            #include "UnityCG.cginc"
            #include "AutoLight.cginc"
            #include "Lighting.cginc"
            #pragma multi_compile_fwdbase_fullshadows 
            #pragma target 3.0

float4 _Color;
float4 _SpecularColor;
float _Glossiness;
float _Metallic;

//future public variables will go here! Public Variables Section

struct VertexInput {
    float4 vertex : POSITION;       //local vertex position
    float3 normal : NORMAL;         //normal direction
    float4 tangent : TANGENT;       //tangent direction 
    float2 texcoord0 : TEXCOORD0;   //uv coordinates
    float2 texcoord1 : TEXCOORD1;   //lightmap uv coordinates
};

struct VertexOutput {
    float4 pos : SV_POSITION;              //screen clip space position and depth
    float2 uv0 : TEXCOORD0;                //uv coordinates
    float2 uv1 : TEXCOORD1;                //lightmap uv coordinates

//below we create our own variables with the texcoord semantic. 
    float3 normalDir : TEXCOORD3;          //normal direction 
    float3 posWorld : TEXCOORD4;          //normal direction 
    float3 tangentDir : TEXCOORD5;
    float3 bitangentDir : TEXCOORD6;
    LIGHTING_COORDS(7,8)                   //this initializes the unity lighting and shadow
    UNITY_FOG_COORDS(9)                    //this initializes the unity fog
};

VertexOutput vert (VertexInput v) {
     VertexOutput o = (VertexOutput)0;           
     o.uv0 = v.texcoord0;
     o.uv1 = v.texcoord1;
     o.normalDir = UnityObjectToWorldNormal(v.normal);
     o.tangentDir = normalize( mul( _Object2World, float4( v.tangent.xyz, 0.0 ) ).xyz );
     o.bitangentDir = normalize(cross(o.normalDir, o.tangentDir) * v.tangent.w);
     o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
     o.posWorld = mul(_Object2World, v.vertex);
     UNITY_TRANSFER_FOG(o,o.pos);
     TRANSFER_VERTEX_TO_FRAGMENT(o)
     return o;
}    

//helper functions will go here!!! Helper Function Section

//algorithms we build will be placed here!!! Algorithm Section

float4 frag(VertexOutput i) : COLOR {

//normal direction calculations
     float3 normalDirection = normalize(i.normalDir);

     float3 lightDirection = normalize(lerp(_WorldSpaceLightPos0.xyz, _WorldSpaceLightPos0.xyz - i.posWorld.xyz,_WorldSpaceLightPos0.w));

     float3 lightReflectDirection = reflect( -lightDirection, normalDirection );

     float3 viewDirection = normalize(_WorldSpaceCameraPos.xyz - i.posWorld.xyz);

     float3 viewReflectDirection = normalize(reflect( -viewDirection, normalDirection ));

     float3 halfDirection = normalize(viewDirection+lightDirection); 

     float NdotL = max(0.0, dot( normalDirection, lightDirection ));

     float NdotH =  max(0.0,dot( normalDirection, halfDirection));

     float NdotV =  max(0.0,dot( normalDirection, viewDirection));

     float VdotH = max(0.0,dot( viewDirection, halfDirection));

     float LdotH =  max(0.0,dot(lightDirection, halfDirection));
 
     float LdotV = max(0.0,dot(lightDirection, viewDirection)); 

     float RdotV = max(0.0, dot( lightReflectDirection, viewDirection ));

     float attenuation = LIGHT_ATTENUATION(i);

     float3 attenColor = attenuation * _LightColor0.rgb;

     float roughness = 1- (_Glossiness * _Glossiness);   // 1 - smoothness*smoothness
     
     roughness = roughness * roughness;

     float3 diffuseColor = _Color.rgb * (1-_Metallic) ;
    
     float3 specColor = lerp(_SpecularColor.rgb, _Color.rgb, _Metallic * 0.5);
      
    //future code will go here!    Fragment Section

     return float4(1,1,1,1);
}
ENDCG
}
}
FallBack "Legacy Shaders/Diffuse"
}
```

当附加到 Unity 中的材质时，上面的代码应该创建一个白色对象。我们将通过在属性部分中放置属性、在变量部分中放置变量、在帮助函数部分中放置辅助函数、在算法部分中放置算法以及在片段部分中实现着色器代码来扩展此着色器。让我们开始。

## 8、什么是正态分布函数？

正态分布函数是构成我们的 BRDF 着色器的三个关键元素之一。NDF 统计地描述了表面上微平面法线的分布。对于我们的使用，NDF 用作加权函数来缩放反射的亮度（镜面反射）。将 NDF 视为表面的基本几何属性是很重要的。让我们开始在我们的着色器中添加一些算法，以便可以可视化 NDF 产生的效果。

我们要做的第一件事是构建一个算法。为了可视化算法，我们将覆盖返回的浮点数。

```
float3 SpecularDistribution = specColor;

//the algorithm implementations will go here

return float4(float3(1,1,1) * SpecularDistribution.rgb,1);
```

以下部分的格式如下。在算法部分编写算法后，您将在上述位置实现算法。当你实现一个新的算法时，只需将上面激活的算法注释掉，产生的效果将仅基于当前未注释的算法。别担心，我们稍后会清理它，并为你提供一种在 Unity 内部轻松切换算法的方法，无需进一步说明。

让我们从简单的 Blinn-Phong 方法开始。

## 8、Blinn-Phong NDF

![[762873df0b499ce6dec24e48aa12fccd_MD5.jpg]]

Phong 镜面反射的 Blinn 近似是作为 Phong 镜面模型的优化而创建的。Blinn 决定生成法线向量和半向量的点积比计算每帧光的反射向量要快。这些算法确实产生了非常不同的结果，Blinn 比 Phong 更柔和。

```
float BlinnPhongNormalDistribution(float NdotH, float specularpower, float speculargloss){
    float Distribution = pow(NdotH,speculargloss) * specularpower;
    Distribution *= (2+specularpower) / (2*3.1415926535);
    return Distribution;
}
```

Blinn-Phong 不被认为是物理上正确的算法，但它仍会产生可靠的镜面高光，可用于特定的艺术意图。将上述算法放在算法部分，将下面的代码放在片段部分。

```
SpecularDistribution *=  BlinnPhongNormalDistribution(NdotH, _Glossiness,  max(1,_Glossiness * 40));
```

如果你为着色器指定平滑度值，应该会看到对象将具有描绘正态分布（镜面反射）的白色高光，而对象的其余部分将为黑色。这就是我们将继续运行的方式，以便我们可以轻松地测试我们的着色器。上面实现中的 值 40 只是为了让我可以提供高范围的功能，但它肯定不是每个人的最佳值。

## 9、Phong NDF

![[7881a4c4e4deb3f240f48661dc67832c_MD5.jpg]]

```
float PhongNormalDistribution(float RdotV, float specularpower, float speculargloss){
    float Distribution = pow(RdotV,speculargloss) * specularpower;
    Distribution *= (2+specularpower) / (2*3.1415926535);
    return Distribution;
}
```

Phong 算法是另一种非物理算法，但它产生的结果比上述 Blinn 近似要精细得多。下面是一个示例实现：

```
SpecularDistribution *=  PhongNormalDistribution(RdotV, _Glossiness, max(1,_Glossiness * 40));
```

与 Blinn-Phong 方法一样，不要纠结于 40 这个值。

## 10、贝克曼 NDF

![[0d90efe2bf79788695eb5ffe02cfbf49_MD5.jpg]]

Beckman 正态分布函数是一个更高级的函数，它考虑了我们的粗糙度值。考虑到粗糙度，以及我们的法线和半方向之间的点积，我们可以准确地近似法线在整个表面上的分布。

```
float BeckmannNormalDistribution(float roughness, float NdotH) {
    float roughnessSqr = roughness*roughness;
    float NdotHSqr = NdotH*NdotH;
    return max(0.000001,(1.0 / (3.1415926535*roughnessSqr*NdotHSqr*NdotHSqr))
* exp((NdotHSqr-1)/(roughnessSqr*NdotHSqr)));
}
```

该算法的实现非常简单。

```
SpecularDistribution *=  BeckmannNormalDistribution(roughness, NdotH);
```

需要注意的重要一点是贝克曼模型如何处理对象的表面。如上图所示，Beckman 模型随着平滑度值的变化缓慢，直到某个点显着收紧高光。随着表面平滑度的增加，镜面高光聚集在一起，从艺术角度产生非常令人愉悦的粗糙到平滑值。这种行为对早期粗糙度值的粗糙金属非常有利，随着光滑度值的增加，对塑料也非常有利。

## 11、高斯 NDF

![[0d90efe2bf79788695eb5ffe02cfbf49_MD5.jpg]]

高斯正态分布模型不像其他一些模型那样受欢迎，因为它倾向于产生比在更高平滑度值下所期望的更柔和的镜面高光。从艺术的角度来看，这可能是可取的，但对其真正的物理性质存在争议。

```
float GaussianNormalDistribution(float roughness, float NdotH) {
    float roughnessSqr = roughness*roughness;
	float thetaH = acos(NdotH);
    return exp(-thetaH*thetaH/roughnessSqr);
}
```

该算法的实现类似于其他正态分布函数的实现，依赖于表面的粗糙度以及正态向量和半向量的点积。

```
SpecularDistribution *=  GaussianNormalDistribution(roughness, NdotH);
```

## 11、GGX NDF

![[0a947403a5da17b515f3159b3757e801_MD5.jpg]]

GGX 是当今使用的最流行的算法之一，如果不是最流行的话。大多数现代应用程序都依赖它来实现其几个 BRDF 功能。GGX 由 Bruce Walter 和 Kenneth Torrance 开发。他们 论文中的许多算法 都是一些更流行的算法。

```
float GGXNormalDistribution(float roughness, float NdotH) {
    float roughnessSqr = roughness*roughness;
    float NdotHSqr = NdotH*NdotH;
    float TanNdotHSqr = (1-NdotHSqr)/NdotHSqr;
    return (1.0/3.1415926535) * sqr(roughness/(NdotHSqr * (roughnessSqr + TanNdotHSqr)));
}
```

它的实现遵循其他方法。

```
SpecularDistribution *=  GGXNormalDistribution(roughness, NdotH);
```

GGX 算法的镜面高光非常紧凑和热，同时仍然保持我们球表面的平滑分布。这是为什么 GGX 算法更适合在金属表面上复制镜面反射失真的一个主要示例。

## 12、特罗布里奇 - 赖茨 NDF

![[cf7c7335ec0a0f99ac05b9e33ebe18ee_MD5.jpg]]

Trowbridge-Reitz 方法是在与 GGX 相同的论文中开发的，并且产生了与 GGX 算法非常相似的结果。主要的显着差异是物体的极端边缘具有比 GGX 更平滑的高光，后者在掠射角处衰减更严重。

```
float TrowbridgeReitzNormalDistribution(float NdotH, float roughness){
    float roughnessSqr = roughness*roughness;
    float Distribution = NdotH*NdotH * (roughnessSqr-1.0) + 1.0;
    return roughnessSqr / (3.1415926535 * Distribution*Distribution);
}
```

像往常一样，Trowbridge-Reitz 公式依赖于粗糙度以及法线和半向量的点积。

```
SpecularDistribution *=  TrowbridgeReitzNormalDistribution(NdotH, roughness);
```

## 13、Trowbridge-Reitz 各向异性 NDF

![[706ae6740046476917ab46f19d52c0bc_MD5.jpg]]

各向异性 NDF 函数产生各向异性的正态分布。这使我们能够创建模拟拉丝金属和其他精细刻面 / 各向异性表面的表面效果。对于这个函数，我们需要在属性和公共变量部分添加一个变量。

我们的财产：

```
_Anisotropic("Anisotropic",  Range(-20,1)) = 0
```

我们的变量：

```
float _Anisotropic;
float TrowbridgeReitzAnisotropicNormalDistribution(float anisotropic, float NdotH, float HdotX, float HdotY){

    float aspect = sqrt(1.0h-anisotropic * 0.9h);
    float X = max(.001, sqr(1.0-_Glossiness)/aspect) * 5;
    float Y = max(.001, sqr(1.0-_Glossiness)*aspect) * 5;
    
    return 1.0 / (3.1415926535 * X*Y * sqr(sqr(HdotX/X) + sqr(HdotY/Y) + NdotH*NdotH));
}
```

各向异性和各向同性方法之间的区别之一是切线和副法线数据处理正态分布方向的必要性。该图像的各向异性值为 1。

```
SpecularDistribution *=  TrowbridgeReitzAnisotropicNormalDistribution(_Anisotropic,NdotH, 
dot(halfDirection, i.tangentDir), 
dot(halfDirection,  i.bitangentDir));
```

## 14、Ward 各向异性 NDF

![[729153f8dd315d6a06ef7a70d6377453_MD5.jpg]]

各向异性 BRDF 的 Ward 方法产生的结果与 Trowbridge-Reitz 方法截然不同。镜面高光要柔和得多，并且随着表面的平滑度越来越快消散。

```
float WardAnisotropicNormalDistribution(float anisotropic, float NdotL,
 float NdotV, float NdotH, float HdotX, float HdotY){
    float aspect = sqrt(1.0h-anisotropic * 0.9h);
    float X = max(.001, sqr(1.0-_Glossiness)/aspect) * 5;
 	float Y = max(.001, sqr(1.0-_Glossiness)*aspect) * 5;
    float exponent = -(sqr(HdotX/X) + sqr(HdotY/Y)) / sqr(NdotH);
    float Distribution = 1.0 / (4.0 * 3.14159265 * X * Y * sqrt(NdotL * NdotV));
    Distribution *= exp(exponent);
    return Distribution;
}
```

与 Trowbridge-Reitz 方法一样，Ward 算法需要切线和双切线数据，但也依赖于法线和光照的点积，以及法线和我们视点的点积。

```
SpecularDistribution *=  WardAnisotropicNormalDistribution(_Anisotropic,NdotL, NdotV, NdotH, 
dot(halfDirection, i.tangentDir), 
dot(halfDirection,  i.bitangentDir));
```

## 15、什么是几何阴影算法？

几何阴影函数（GSF）用于描述由于微面的自阴影行为而导致的光衰减。这种近似模拟了在给定点微面相互遮挡或光在多个微面上反弹的概率。在这些概率期间，光在到达视点之前会失去能量。为了准确地生成 GSF，必须对粗糙度进行采样以确定微平面分布。有几个函数不包括粗糙度，虽然它们仍然产生可靠的结果，但它们不适合用于采样粗糙度的函数那么多的用例。

几何阴影函数对于 BRDF 能量守恒至关重要。如果没有 GSF，BRDF 可以反射的光能比它接收的更多。微面 BRDF 方程的一个关键部分涉及有效表面积（由将光能从 L 反射到 V 的表面区域所覆盖的面积）与微面表面的总表面积之间的比率。如果不考虑遮蔽和遮蔽，则活动区域可能会超过总面积，这可能导致 BRDF 不保存能量，在某些情况下会非常大。

```
float GeometricShadow = 1;

//the algorithm implementations will go here

 return float4(float3(1,1,1) * GeometricShadow,1);
```

为了预览 GSF 函数，让我们将此代码放在我们的正态分布函数之上。该格式的工作方式与我们实现 NDF 函数的方式非常相似。

## 16、隐式 GSF

![[6adce0857305eca01514b37664773e3f_MD5.jpg]]

隐式 GSF 是几何阴影背后的逻辑基础。

```
float ImplicitGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs =  (NdotL*NdotV);       
	return Gs;
}
```

通过将法线和光的点积乘以法线和我们的视点的点积，我们可以准确地描绘出光如何根据我们的观点影响物体的表面。

```
GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
```

## 17、阿希赫敏 - 雪莉 GSF

![[5ba77f1888d4814e264cf04e4add8b8a_MD5.jpg]]

Ashikhmin-Shirley GSF 专为与各向异性正态分布函数一起使用而设计，为各向异性效果提供了良好的基础。

```
float AshikhminShirleyGSF (float NdotL, float NdotV, float LdotH){
	float Gs = NdotL*NdotV/(LdotH*max(NdotL,NdotV));
	return  (Gs);
}
```

该模型产生的微面阴影非常微妙，如右图所示。

```
GeometricShadow *= AshikhminShirleyGSF (NdotL, NdotV, LdotH);
```

## 18、Ashikhmin-Premoze GSF

![[0378276ec0417b0d2cf6133dc4804a85_MD5.jpg]]

与 Ashikhmin-Shirley 方法不同，Ashikhmin-Premoze GSF 设计用于各向同性 NDF。与 Ashikhmin-Shirley 一样，这是一个非常微妙的 GSF。

```
float AshikhminPremozeGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs = NdotL*NdotV/(NdotL+NdotV - NdotL*NdotV);
	return  (Gs);
}
GeometricShadow *= AshikhminPremozeGeometricShadowingFunction (NdotL, NdotV);
```

## 19、杜尔 GSF

![[68648e4581717dc03ddd8c9160c183b8_MD5.jpg]]

Duer 提出了下面的 GSF 函数来解决我们稍后将介绍的 Ward GSF 函数中发现的镜面反射问题。Duer GSF 产生与上述 Ashikhmin-Shirley 相似的结果，但更适合各向同性 BRDF，或非常轻微的各向异性 BRDF。

```
float DuerGeometricShadowingFunction (float3 lightDirection,float3 viewDirection, 
float3 normalDirection,float NdotL, float NdotV){
    float3 LpV = lightDirection + viewDirection;
    float Gs = dot(LpV,LpV) * pow(dot(LpV,normalDirection),-4);
    return  (Gs);
}
GeometricShadow *= DuerGeometricShadowingFunction (lightDirection, viewDirection, normalDirection, NdotL, NdotV);
```

## 20、诺依曼 GSF

![[c209f26b907956f8e4695d5ecd3d6ef2_MD5.jpg]]

Neumann-Neumann GSF 是适用于各向异性正态分布的 GSF 的另一个示例。它基于视图方向或光线方向中的较大者产生更明显的几何阴影。

```
float NeumannGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs = (NdotL*NdotV)/max(NdotL, NdotV);       
	return  (Gs);
}
GeometricShadow *= NeumannGeometricShadowingFunction (NdotL, NdotV);
```

## 21、克勒门 GSF

![[5f6028ac5dd1a100eceb2a9869dff47d_MD5.jpg]]

Kelemen GSF 提供了一种适当节能的 GSF。与之前的大多数机型不同，几何阴影的比例不是恒定的，而是随着视角的变化而变化。这是 Cook-Torrance 几何阴影函数的极端近似。

```
float KelemenGeometricShadowingFunction (float NdotL, float NdotV, 
float LdotV, float VdotH){
	float Gs = (NdotL*NdotV)/(VdotH * VdotH); 
	return   (Gs);
}
GeometricShadow *= KelemenGeometricShadowingFunction (NdotL, NdotV, LdotV,  VdotH);
```

## 22、改良的 Kelemen GSF

![[b324094fae7a4b05bcbf8b42a2030d11_MD5.jpg]]

这是库克 - 托伦斯的 Kelemen 近似的修改形式。它已被修改以产生按粗糙度分布的 Keleman GSF。

```
float ModifiedKelemenGeometricShadowingFunction (float NdotV, float NdotL,
 float roughness) {
	float c = 0.797884560802865;    // c = sqrt(2 / Pi)
	float k = roughness * roughness * c;
	float gH = NdotV  * k +(1-k);
	return (gH * gH * NdotL);
}
GeometricShadow *=  ModifiedKelemenGeometricShadowingFunction (NdotV, NdotL, roughness );
```

## 23、库克 - 托伦斯 GSF

![[c41639eeab776b068fdada31664e35a7_MD5.jpg]]

Cook-Torrance GSF 旨在解决几何衰减的三种情况。第一种情况说明光被反射而没有干扰，而第二种情况说明一些反射光在反射后被阻挡，第三种情况说明一些光在到达下一个微平面之前被阻挡。为了计算这些情况，我们使用下面的 Cook-Torrance GSF。

```
float CookTorrenceGeometricShadowingFunction (float NdotL, float NdotV, 
float VdotH, float NdotH){
	float Gs = min(1.0, min(2*NdotH*NdotV / VdotH, 
2*NdotH*NdotL / VdotH));
	return  (Gs);
}
GeometricShadow *= CookTorrenceGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
```

## 24、Ward GSF

![[e92e8c81f5b4586e03c6e4da4bc5539f_MD5.jpg]]

Ward GSF 是一种强化的隐式 GSF。Ward 使用这种方法来加强正态分布函数。它特别适用于从不同视角突出表面上的各向异性带。

```
float WardGeometricShadowingFunction (float NdotL, float NdotV, 
float VdotH, float NdotH){
	float Gs = pow( NdotL * NdotV, 0.5);
	return  (Gs);
}
GeometricShadow *= WardGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
```

## 25、库尔特 GSF

![[f3e5b8465fd130498bf5472877659c86_MD5.jpg]]

Kurt GSF 是各向异性 GSF 的另一个例子。该模型旨在帮助控制基于表面粗糙度的各向异性表面的分布。该模型旨在节省能量，特别是沿掠射角。

```
float KurtGeometricShadowingFunction (float NdotL, float NdotV, 
float VdotH, float roughness){
	float Gs =  NdotL*NdotV/(VdotH*pow(NdotL*NdotV, roughness));
	return  (Gs);
}
GeometricShadow *= KurtGeometricShadowingFunction (NdotL, NdotV, VdotH, roughness);
```

## 26、基于 Smith 的几何阴影函数

基于史密斯的 GSF 被广泛认为比其他 GSF 更准确，并且考虑了正态分布的粗糙度和形状。这些函数需要处理两个部分才能计算 GSF。

![[ef460b93fbfbdf668abf5c76f2a2a09f_MD5.jpg]]

## 27、沃尔特等人的 GSF

![[efc73b3826a6b0df23f5fd9940f7e0ba_MD5.jpg]]

GGX GSF 的常见形式， Walter 等人创建此函数以与任何 NDF 一起使用。沃尔特等人。认为 GSF“对 BSDF [双向散射分布函数] 的形状影响相对较小，除了接近掠射角或非常粗糙的表面，但需要保持能量守恒。” 考虑到这一点，他们创建了一个尊重这一原则的 GSF，使用粗糙度作为 GSF 的驱动力。

```
float WalterEtAlGeometricShadowingFunction (float NdotL, float NdotV, float alpha){
    float alphaSqr = alpha*alpha;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;

    float SmithL = 2/(1 + sqrt(1 + alphaSqr * (1-NdotLSqr)/(NdotLSqr)));
    float SmithV = 2/(1 + sqrt(1 + alphaSqr * (1-NdotVSqr)/(NdotVSqr)));


	float Gs =  (SmithL * SmithV);
	return Gs;
}
GeometricShadow *= WalterEtAlGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 28、史密斯 - 贝克曼 GSF

![[c9358fdccdc08e95412889be10271d9a_MD5.jpg]]

Walter 等人最初是为与 Beckman NDF 一起使用而创建的。推测它是与 Phong NDF 一起使用的合适 GSF。

```
float BeckmanGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float roughnessSqr = roughness*roughness;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;


    float calulationL = (NdotL)/(roughnessSqr * sqrt(1- NdotLSqr));
    float calulationV = (NdotV)/(roughnessSqr * sqrt(1- NdotVSqr));


    float SmithL = calulationL < 1.6 ? (((3.535 * calulationL)
 + (2.181 * calulationL * calulationL))/(1 + (2.276 * calulationL) + 
(2.577 * calulationL * calulationL))) : 1.0;
    float SmithV = calulationV < 1.6 ? (((3.535 * calulationV) 
+ (2.181 * calulationV * calulationV))/(1 + (2.276 * calulationV) +
 (2.577 * calulationV * calulationV))) : 1.0;


	float Gs =  (SmithL * SmithV);
	return Gs;
}
GeometricShadow *= BeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 29、GGX GSF

![[f651294c75b9bd3bf89f0fca77bacd04_MD5.jpg]]

这是对 Walter 等人的重构。GSF 算法通过将 GSF 乘以 NdotV/NdotV。

```
float GGXGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float roughnessSqr = roughness*roughness;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;


    float SmithL = (2 * NdotL)/ (NdotL + sqrt(roughnessSqr +
 ( 1-roughnessSqr) * NdotLSqr));
    float SmithV = (2 * NdotV)/ (NdotV + sqrt(roughnessSqr + 
( 1-roughnessSqr) * NdotVSqr));


	float Gs =  (SmithL * SmithV);
	return Gs;
}
GeometricShadow *= GGXGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 30、石里克 GSF

![[8ae9bee1bb0cb72753535824f746b24f_MD5.jpg]]

Schlick 已经对 Smith GSF 进行了几种近似，这些近似值也可以应用于其他 Smith GSF。这是 Smith GSF 的基线 Schlick 近似：

```
float SchlickGeometricShadowingFunction (float NdotL, float NdotV, float roughness) {
    float roughnessSqr = roughness*roughness;


	float SmithL = (NdotL)/(NdotL * (1-roughnessSqr) + roughnessSqr);
	float SmithV = (NdotV)/(NdotV * (1-roughnessSqr) + roughnessSqr);


	return (SmithL * SmithV); 
}
GeometricShadow *= SchlickGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 31、石里克 - 贝克曼 GSF

![[2901414ab75573b47349133a7b50d616_MD5.jpg]]

这是贝克曼函数的石里克近似。它的工作原理是将粗糙度乘以 2/PI 的平方根，而不是计算，我们只是预先计算为 0.797884 .....

```
float SchlickBeckmanGeometricShadowingFunction (float NdotL, float NdotV,
 float roughness){
    float roughnessSqr = roughness*roughness;
    float k = roughnessSqr * 0.797884560802865;


    float SmithL = (NdotL)/ (NdotL * (1- k) + k);
    float SmithV = (NdotV)/ (NdotV * (1- k) + k);


	float Gs =  (SmithL * SmithV);
	return Gs;
}
GeometricShadow *= SchlickBeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 32、石里克 - GGX GSF

![[b0895a8eec821d052ec025f0e3e1ea4c_MD5.jpg]]

GGX 的 Schlick 近似值只是将我们的粗糙度值除以 2。

```
float SchlickGGXGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float k = roughness / 2;


    float SmithL = (NdotL)/ (NdotL * (1- k) + k);
    float SmithV = (NdotV)/ (NdotV * (1- k) + k);


	float Gs =  (SmithL * SmithV);
	return Gs;
}
GeometricShadow *= SchlickGGXGeometricShadowingFunction (NdotL, NdotV, roughness);
```

## 33、菲涅耳函数

![[a7c4775fab527e75af844ecd7a0b1af3_MD5.jpg]]

菲涅尔效应以首先描述它的法国物理学家奥古斯丁 - 让 · 菲涅尔的名字命名。这种效应表明，表面上的反射强度取决于视点。以掠射角观察的表面上的反射量增加。为了将菲涅耳效果包含到我们的着色器中，我们需要在多个地方使用它。首先我们需要考虑漫反射，然后我们需要考虑 BRDF 菲涅耳效应。

为了适当地计算菲涅耳，我们需要考虑法向入射角和掠射角。我们将在下面使用粗糙度来计算可以传递给菲涅尔函数的漫反射菲涅尔反射入射。为了计算这一点，我们使用菲涅耳的 Schlick 近似的一个版本。菲涅耳的 Schlick 近似构造为：

```
schlick = x + (1-x) * pow(1-dotProduct,5);
```

这个函数可以进一步近似为：

```
mix(x,1,pow(1-dotProduct,5));
```

这种近似在某些 GPU 上可能更快。你可以切换上面的 x 和 1 来反转近似值，我们将在下面这样做来计算我们的漫反射。

```
float MixFunction(float i, float j, float x) {
	 return  j * x + i * (1.0 - x);
}

float SchlickFresnel(float i){
    float x = clamp(1.0-i, 0.0, 1.0);
    float x2 = x*x;
    return x2*x2*x;
}

//normal incidence reflection calculation
float F0 (float NdotL, float NdotV, float LdotH, float roughness){
    float FresnelLight = SchlickFresnel(NdotL); 
    float FresnelView = SchlickFresnel(NdotV);
    float FresnelDiffuse90 = 0.5 + 2.0 * LdotH*LdotH * roughness;
    return  MixFunction(1, FresnelDiffuse90, FresnelLight) * MixFunction(1, FresnelDiffuse90, FresnelView);
}
```

## 34、石里克菲涅耳

Schlick 的菲涅耳方程近似可能是他最著名的近似之一。菲涅耳效应的这种近似允许我们计算掠射角的反射率。

```
float3 SchlickFresnelFunction(float3 SpecularColor,float LdotH){
    return SpecularColor + (1 - SpecularColor)* SchlickFresnel(LdotH);
}
FresnelFunction *=  SchlickFresnelFunction(specColor, LdotH);
```

下一个算法依赖于要传递的特定值而不是高光颜色。这个新值是折射率。IOR 是一个无量纲数，用于描述光通过表面的速度。要启用此功能，我们必须向着色器添加一个新属性和变量。

```
_Ior("Ior",  Range(1,4)) = 1.5
```

上面的代码属于着色器属性部分，而下面的行应该与公共变量部分中的其他变量一起放置。

```
float _Ior;
float SchlickIORFresnelFunction(float ior ,float LdotH){
    float f0 = pow(ior-1,2)/pow(ior+1, 2);
    return f0 + (1-f0) * SchlickFresnel(LdotH);
}
FresnelFunction *=  SchlickIORFresnelFunction(_Ior, LdotH);
```

## 35、球面高斯菲涅耳

Spherical-Gaussian Fresnel 函数产生与 Schlicks Approximation 非常相似的结果。唯一的区别是功率来自球面高斯计算。

```
float SphericalGaussianFresnelFunction(float LdotH,float SpecularColor) {	
  float power = ((-5.55473 * LdotH) - 6.98316) * LdotH;
  return SpecularColor + (1 - SpecularColor) * pow(2,power);
}
FresnelFunction *= SphericalGaussianFresnelFunction(LdotH, specColor);
```

## 36、PBR 着色器结合算法

现在我们有了 NDF、GSF 和 Fresnel 函数的多个版本，我们需要将它们组合在一起，以便我们可以看到生成的 BRDF PBR 着色器在运行中。组合这些算法的格式非常简单：将算法相乘，然后除以 4 * NdotL * NdotV。

```
float3 specularity = (SpecularDistribution * FresnelFunction * GeometricShadow) / (4 * (  NdotL * NdotV));
```

组合算法后，只需将该值添加到你的漫反射颜色中，就可以了。

```
float3 lightingModel = (diffuseColor + specularity);
lightingModel *= NdotL;
float4 finalDiffuse = float4(lightingModel * attenColor,1);
return finalDiffuse;
```

## 37、Unity 光照信息

为了对环境进行采样，需要在 Unity 和着色器中执行一些重要步骤。首先，在你的场景中添加一个反射探针并烘焙它。然后你会想把这个函数添加到你的着色器中：

```
UnityGI GetUnityGI(float3 lightColor, float3 lightDirection, float3 normalDirection,float3 viewDirection, 
float3 viewReflectDirection, float attenuation, float roughness, float3 worldPos){
 //Unity light Setup ::
    UnityLight light;
    light.color = lightColor;
    light.dir = lightDirection;
    light.ndotl = max(0.0h,dot( normalDirection, lightDirection));
    UnityGIInput d;
    d.light = light;
    d.worldPos = worldPos;
    d.worldViewDir = viewDirection;
    d.atten = attenuation;
    d.ambient = 0.0h;
    d.boxMax[0] = unity_SpecCube0_BoxMax;
    d.boxMin[0] = unity_SpecCube0_BoxMin;
    d.probePosition[0] = unity_SpecCube0_ProbePosition;
    d.probeHDR[0] = unity_SpecCube0_HDR;
    d.boxMax[1] = unity_SpecCube1_BoxMax;
    d.boxMin[1] = unity_SpecCube1_BoxMin;
    d.probePosition[1] = unity_SpecCube1_ProbePosition;
    d.probeHDR[1] = unity_SpecCube1_HDR;
    Unity_GlossyEnvironmentData ugls_en_data;
    ugls_en_data.roughness = roughness;
    ugls_en_data.reflUVW = viewReflectDirection;
    UnityGI gi = UnityGlobalIllumination(d, 1.0h, normalDirection, ugls_en_data );
    return gi;
}
```

可以从片段程序内部调用此函数，它将生成可用于对环境进行采样的适当数据。

```
UnityGI gi =  GetUnityGI(_LightColor0.rgb, lightDirection, 
normalDirection, viewDirection, viewReflectDirection, attenuation, 1- _Glossiness, i.posWorld.xyz);

    float3 indirectDiffuse = gi.indirect.diffuse.rgb ;
    float3 indirectSpecular = gi.indirect.specular.rgb;
```

要使用这些值，我们需要将它们添加到我们的最终输出中，如下所示，替换我们已经放置在着色器中的一两行。这将允许我们在以允许环境数据可见的方式设置属性时对环境进行采样：

```
float grazingTerm = saturate(roughness + _Metallic);
float3 unityIndirectSpecularity =  indirectSpecular * FresnelLerp(specColor,grazingTerm,NdotV) * 
max(0.15,_Metallic) * (1-roughness*roughness* roughness);

float3 lightingModel = (diffuseColor + specularity +(unityIndirectSpecularity *_UnityLightingContribution));
```

## 38、调试算法

为了调试我们的算法，可以利用 Unity 在着色器中为材质属性添加切换的能力。

```
[Toggle] _ENABLE_NDF ("Normal Distribution Enabled?", Float) = 0
	[Toggle] _ENABLE_G ("Geometric Shadow Enabled?", Float) = 0
	[Toggle] _ENABLE_F ("Fresnel Enabled?", Float) = 0
	[Toggle] _ENABLE_D ("Diffuse Enabled?", Float) = 0
```

这些切换将在切换时启用或禁用着色器关键字。有关更多信息，请查看 此页面。

```
#ifdef _ENABLE_NDF_ON
 	 return float4(float3(1,1,1)* SpecularDistribution,1);
    #endif
    #ifdef _ENABLE_G_ON 
 	 return float4(float3(1,1,1) * GeometricShadow,1) ;
    #endif
    #ifdef _ENABLE_F_ON 
 	 return float4(float3(1,1,1)* FresnelFunction,1);
    #endif
    #ifdef _ENABLE_D_ON 
 	 return float4(float3(1,1,1)* diffuseColor,1);
    #endif
```

此设置将允许你在着色器中的不同效果之间切换，以便可以自行调试效果。

## 40、创建允许选择算法的着色器

通过使用关键字枚举的强大功能，可以创建在算法之间轻松切换的能力，而无需进行所有注释代码操作。关键字枚举有 9 个关键字的限制，所以我必须在我的切换逻辑中发挥创意。

```
[KeywordEnum(BlinnPhong,Phong,Beckmann,Gaussian,GGX,TrowbridgeReitz,TrowbridgeReitzAnisotropic, Ward)] _NormalDistModel("Normal Distribution Model;", Float) = 0
	[KeywordEnum(AshikhminShirley,AshikhminPremoze,Duer,Neumann,Kelemen,ModifiedKelemen,Cook,Ward,Kurt)]_GeoShadowModel("Geometric Shadow Model;", Float) = 0

[KeywordEnum(None,Walter,Beckman,GGX,Schlick,SchlickBeckman,SchlickGGX, Implicit)]_SmithGeoShadowModel("Smith Geometric Shadow Model; None if above is Used;", Float) = 0

[KeywordEnum(Schlick,SchlickIOR, SphericalGaussian)]_FresnelModel("Normal Distribution Model;", Float) = 0
//Normal Distribution Function/Specular Distribution----------------------------------------------------- 

           
	#ifdef _NORMALDISTMODEL_BLINNPHONG 
		 SpecularDistribution *=  BlinnPhongNormalDistribution(NdotH, _Glossiness,  max(1,_Glossiness * 40));
 	#elif _NORMALDISTMODEL_PHONG
		 SpecularDistribution *=  PhongNormalDistribution(RdotV, _Glossiness, max(1,_Glossiness * 40));
 	#elif _NORMALDISTMODEL_BECKMANN
		 SpecularDistribution *=  BeckmannNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_GAUSSIAN
		 SpecularDistribution *=  GaussianNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_GGX
		 SpecularDistribution *=  GGXNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_TROWBRIDGEREITZ
		 SpecularDistribution *=  TrowbridgeReitzNormalDistribution(NdotH, roughness);
 	#elif _NORMALDISTMODEL_TROWBRIDGEREITZANISOTROPIC
		 SpecularDistribution *=  TrowbridgeReitzAnisotropicNormalDistribution(_Anisotropic,NdotH, dot(halfDirection, i.tangentDir), dot(halfDirection,  i.bitangentDir));
	#elif _NORMALDISTMODEL_WARD
	 	 SpecularDistribution *=  WardAnisotropicNormalDistribution(_Anisotropic,NdotL, NdotV, NdotH, dot(halfDirection, i.tangentDir), dot(halfDirection,  i.bitangentDir));
	#else
		SpecularDistribution *=  GGXNormalDistribution(roughness, NdotH);
	#endif

	 //Geometric Shadowing term----------------------------------------------------------------------------------
	#ifdef _SMITHGEOSHADOWMODEL_NONE
	 	#ifdef _GEOSHADOWMODEL_ASHIKHMINSHIRLEY
			GeometricShadow *= AshikhminShirleyGeometricShadowingFunction (NdotL, NdotV, LdotH);
	 	#elif _GEOSHADOWMODEL_ASHIKHMINPREMOZE
			GeometricShadow *= AshikhminPremozeGeometricShadowingFunction (NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_DUER
			GeometricShadow *= DuerGeometricShadowingFunction (lightDirection, viewDirection, normalDirection, NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_NEUMANN
			GeometricShadow *= NeumannGeometricShadowingFunction (NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_KELEMAN
			GeometricShadow *= KelemenGeometricShadowingFunction (NdotL, NdotV, LdotH,  VdotH);
	 	#elif _GEOSHADOWMODEL_MODIFIEDKELEMEN
			GeometricShadow *=  ModifiedKelemenGeometricShadowingFunction (NdotV, NdotL, roughness);
	 	#elif _GEOSHADOWMODEL_COOK
			GeometricShadow *= CookTorrenceGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
	 	#elif _GEOSHADOWMODEL_WARD
			GeometricShadow *= WardGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
	 	#elif _GEOSHADOWMODEL_KURT
			GeometricShadow *= KurtGeometricShadowingFunction (NdotL, NdotV, VdotH, roughness);
	 	#else 
 			GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
 		#endif
	////SmithModelsBelow
	////Gs = F(NdotL) * F(NdotV);
  	#elif _SMITHGEOSHADOWMODEL_WALTER
		GeometricShadow *= WalterEtAlGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_BECKMAN
		GeometricShadow *= BeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_GGX
		GeometricShadow *= GGXGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_SCHLICK
		GeometricShadow *= SchlickGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_SCHLICKBECKMAN
		GeometricShadow *= SchlickBeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_SCHLICKGGX
		GeometricShadow *= SchlickGGXGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_IMPLICIT
		GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
	#else
		GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
 	#endif
	 //Fresnel Function-------------------------------------------------------------------------------------------------

	#ifdef _FRESNELMODEL_SCHLICK
		FresnelFunction *=  SchlickFresnelFunction(specColor, LdotH);
	#elif _FRESNELMODEL_SCHLICKIOR
		FresnelFunction *=  SchlickIORFresnelFunction(_Ior, LdotH);
	#elif _FRESNELMODEL_SPHERICALGAUSSIAN
		FresnelFunction *= SphericalGaussianFresnelFunction(LdotH, specColor);
 	#else
		FresnelFunction *=  SchlickIORFresnelFunction(_Ior, LdotH);	
 	#endif
```

现在，当你从 Unity 的下拉列表中选择关键字时，它将更改活动算法。有了这个，你的着色器应该很好用。我建议复制粘贴下面的着色器代码，以便你可以全面了解完整的着色器，以防着色器混乱。

## 41、完整的 PBR 着色器代码

```
Shader "Physically-Based-Lighting" {
    Properties {
	_Color ("Main Color", Color) = (1,1,1,1)
	_SpecularColor ("Specular Color", Color) = (1,1,1,1)
	_SpecularPower("Specular Power", Range(0,1)) = 1
	_SpecularRange("Specular Gloss",  Range(1,40)) = 0
	_Glossiness("Smoothness",Range(0,1)) = 1
	_Metallic("Metallicness",Range(0,1)) = 0
	_Anisotropic("Anisotropic",  Range(-20,1)) = 0
	_Ior("Ior",  Range(1,4)) = 1.5
	_UnityLightingContribution("Unity Reflection Contribution", Range(0,1)) = 1
	[KeywordEnum(BlinnPhong,Phong,Beckmann,Gaussian,GGX,TrowbridgeReitz,TrowbridgeReitzAnisotropic, Ward)] _NormalDistModel("Normal Distribution Model;", Float) = 0
	[KeywordEnum(AshikhminShirley,AshikhminPremoze,Duer,Neumann,Kelemen,ModifiedKelemen,Cook,Ward,Kurt)]_GeoShadowModel("Geometric Shadow Model;", Float) = 0
	[KeywordEnum(None,Walter,Beckman,GGX,Schlick,SchlickBeckman,SchlickGGX, Implicit)]_SmithGeoShadowModel("Smith Geometric Shadow Model; None if above is Used;", Float) = 0
	[KeywordEnum(Schlick,SchlickIOR, SphericalGaussian)]_FresnelModel("Normal Distribution Model;", Float) = 0
	[Toggle] _ENABLE_NDF ("Normal Distribution Enabled?", Float) = 0
	[Toggle] _ENABLE_G ("Geometric Shadow Enabled?", Float) = 0
	[Toggle] _ENABLE_F ("Fresnel Enabled?", Float) = 0
	[Toggle] _ENABLE_D ("Diffuse Enabled?", Float) = 0
    }
    SubShader {
	Tags {
            "RenderType"="Opaque"  "Queue"="Geometry"
        } 
        Pass {
            Name "FORWARD"
            Tags {
                "LightMode"="ForwardBase"
            }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #define UNITY_PASS_FORWARDBASE
            #include "UnityCG.cginc"
            #include "AutoLight.cginc"
            #include "Lighting.cginc"
            #pragma multi_compile_fwdbase_fullshadows
            #pragma multi_compile _NORMALDISTMODEL_BLINNPHONG _NORMALDISTMODEL_PHONG _NORMALDISTMODEL_BECKMANN _NORMALDISTMODEL_GAUSSIAN _NORMALDISTMODEL_GGX _NORMALDISTMODEL_TROWBRIDGEREITZ _NORMALDISTMODEL_TROWBRIDGEREITZANISOTROPIC _NORMALDISTMODEL_WARD
            #pragma multi_compile _GEOSHADOWMODEL_ASHIKHMINSHIRLEY _GEOSHADOWMODEL_ASHIKHMINPREMOZE _GEOSHADOWMODEL_DUER_GEOSHADOWMODEL_NEUMANN _GEOSHADOWMODEL_KELEMAN _GEOSHADOWMODEL_MODIFIEDKELEMEN _GEOSHADOWMODEL_COOK _GEOSHADOWMODEL_WARD _GEOSHADOWMODEL_KURT 
            #pragma multi_compile _SMITHGEOSHADOWMODEL_NONE _SMITHGEOSHADOWMODEL_WALTER _SMITHGEOSHADOWMODEL_BECKMAN _SMITHGEOSHADOWMODEL_GGX _SMITHGEOSHADOWMODEL_SCHLICK _SMITHGEOSHADOWMODEL_SCHLICKBECKMAN _SMITHGEOSHADOWMODEL_SCHLICKGGX _SMITHGEOSHADOWMODEL_IMPLICIT
            #pragma multi_compile _FRESNELMODEL_SCHLICK _FRESNELMODEL_SCHLICKIOR _FRESNELMODEL_SPHERICALGAUSSIAN
            #pragma multi_compile  _ENABLE_NDF_OFF _ENABLE_NDF_ON
            #pragma multi_compile  _ENABLE_G_OFF _ENABLE_G_ON
            #pragma multi_compile  _ENABLE_F_OFF _ENABLE_F_ON
            #pragma multi_compile  _ENABLE_D_OFF _ENABLE_D_ON
            #pragma target 3.0
            
float4 _Color;
float4 _SpecularColor;
float _SpecularPower;
float _SpecularRange;
float _Glossiness;
float _Metallic;
float _Anisotropic;
float _Ior;
float _NormalDistModel;
float _GeoShadowModel;
float _FresnelModel;
float _UnityLightingContribution;

struct VertexInput {
    float4 vertex : POSITION;       //local vertex position
    float3 normal : NORMAL;         //normal direction
    float4 tangent : TANGENT;       //tangent direction 
    float2 texcoord0 : TEXCOORD0;   //uv coordinates
    float2 texcoord1 : TEXCOORD1;   //lightmap uv coordinates
};

struct VertexOutput {
    float4 pos : SV_POSITION;              //screen clip space position and depth
    float2 uv0 : TEXCOORD0;                //uv coordinates
    float2 uv1 : TEXCOORD1;                //lightmap uv coordinates

//below we create our own variables with the texcoord semantic. 
    float3 normalDir : TEXCOORD3;          //normal direction 
    float3 posWorld : TEXCOORD4;          //normal direction 
    float3 tangentDir : TEXCOORD5;
    float3 bitangentDir : TEXCOORD6;
    LIGHTING_COORDS(7,8)                   //this initializes the unity lighting and shadow
    UNITY_FOG_COORDS(9)                    //this initializes the unity fog
};

VertexOutput vert (VertexInput v) {
     VertexOutput o = (VertexOutput)0;           
     o.uv0 = v.texcoord0;
     o.uv1 = v.texcoord1;
     o.normalDir = UnityObjectToWorldNormal(v.normal);
     o.tangentDir = normalize( mul( _Object2World, float4( v.tangent.xyz, 0.0 ) ).xyz );
     o.bitangentDir = normalize(cross(o.normalDir, o.tangentDir) * v.tangent.w);
     o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
     o.posWorld = mul(_Object2World, v.vertex);
     UNITY_TRANSFER_FOG(o,o.pos);
     TRANSFER_VERTEX_TO_FRAGMENT(o)
     return o;
}

UnityGI GetUnityGI(float3 lightColor, float3 lightDirection, float3 normalDirection,float3 viewDirection, float3 viewReflectDirection, float attenuation, float roughness, float3 worldPos){
 //Unity light Setup ::
    UnityLight light;
    light.color = lightColor;
    light.dir = lightDirection;
    light.ndotl = max(0.0h,dot( normalDirection, lightDirection));
    UnityGIInput d;
    d.light = light;
    d.worldPos = worldPos;
    d.worldViewDir = viewDirection;
    d.atten = attenuation;
    d.ambient = 0.0h;
    d.boxMax[0] = unity_SpecCube0_BoxMax;
    d.boxMin[0] = unity_SpecCube0_BoxMin;
    d.probePosition[0] = unity_SpecCube0_ProbePosition;
    d.probeHDR[0] = unity_SpecCube0_HDR;
    d.boxMax[1] = unity_SpecCube1_BoxMax;
    d.boxMin[1] = unity_SpecCube1_BoxMin;
    d.probePosition[1] = unity_SpecCube1_ProbePosition;
    d.probeHDR[1] = unity_SpecCube1_HDR;
    Unity_GlossyEnvironmentData ugls_en_data;
    ugls_en_data.roughness = roughness;
    ugls_en_data.reflUVW = viewReflectDirection;
    UnityGI gi = UnityGlobalIllumination(d, 1.0h, normalDirection, ugls_en_data );
    return gi;
}

//---------------------------
//helper functions
float MixFunction(float i, float j, float x) {
	 return  j * x + i * (1.0 - x);
} 
float2 MixFunction(float2 i, float2 j, float x){
	 return  j * x + i * (1.0h - x);
}   
float3 MixFunction(float3 i, float3 j, float x){
	 return  j * x + i * (1.0h - x);
}   
float MixFunction(float4 i, float4 j, float x){
	 return  j * x + i * (1.0h - x);
} 
float sqr(float x){
	return x*x; 
}
//------------------------------

//------------------------------------------------
//schlick functions
float SchlickFresnel(float i){
    float x = clamp(1.0-i, 0.0, 1.0);
    float x2 = x*x;
    return x2*x2*x;
}
float3 FresnelLerp (float3 x, float3 y, float d)
{
	float t = SchlickFresnel(d);	
	return lerp (x, y, t);
}

float3 SchlickFresnelFunction(float3 SpecularColor,float LdotH){
    return SpecularColor + (1 - SpecularColor)* SchlickFresnel(LdotH);
}

float SchlickIORFresnelFunction(float ior,float LdotH){
    float f0 = pow((ior-1)/(ior+1),2);
    return f0 +  (1 - f0) * SchlickFresnel(LdotH);
}
float SphericalGaussianFresnelFunction(float LdotH,float SpecularColor)
{	
	float power = ((-5.55473 * LdotH) - 6.98316) * LdotH;
    return SpecularColor + (1 - SpecularColor)  * pow(2,power);
}

//-----------------------------------------------

//-----------------------------------------------
//normal incidence reflection calculation
float F0 (float NdotL, float NdotV, float LdotH, float roughness){
// Diffuse fresnel
    float FresnelLight = SchlickFresnel(NdotL); 
    float FresnelView = SchlickFresnel(NdotV);
    float FresnelDiffuse90 = 0.5 + 2.0 * LdotH*LdotH * roughness;
   return  MixFunction(1, FresnelDiffuse90, FresnelLight) * MixFunction(1, FresnelDiffuse90, FresnelView);
}

//-----------------------------------------------

//-----------------------------------------------
//Normal Distribution Functions

float BlinnPhongNormalDistribution(float NdotH, float specularpower, float speculargloss){
    float Distribution = pow(NdotH,speculargloss) * specularpower;
    Distribution *= (2+specularpower) / (2*3.1415926535);
    return Distribution;
}
float PhongNormalDistribution(float RdotV, float specularpower, float speculargloss){
    float Distribution = pow(RdotV,speculargloss) * specularpower;
    Distribution *= (2+specularpower) / (2*3.1415926535);
    return Distribution;
}

float BeckmannNormalDistribution(float roughness, float NdotH)
{
    float roughnessSqr = roughness*roughness;
    float NdotHSqr = NdotH*NdotH;
    return max(0.000001,(1.0 / (3.1415926535*roughnessSqr*NdotHSqr*NdotHSqr))* exp((NdotHSqr-1)/(roughnessSqr*NdotHSqr)));
}

float GaussianNormalDistribution(float roughness, float NdotH)
{
    float roughnessSqr = roughness*roughness;
	float thetaH = acos(NdotH);
    return exp(-thetaH*thetaH/roughnessSqr);
}

float GGXNormalDistribution(float roughness, float NdotH)
{
    float roughnessSqr = roughness*roughness;
    float NdotHSqr = NdotH*NdotH;
    float TanNdotHSqr = (1-NdotHSqr)/NdotHSqr;
    return (1.0/3.1415926535) * sqr(roughness/(NdotHSqr * (roughnessSqr + TanNdotHSqr)));
//    float denom = NdotHSqr * (roughnessSqr-1)

}

float TrowbridgeReitzNormalDistribution(float NdotH, float roughness){
    float roughnessSqr = roughness*roughness;
    float Distribution = NdotH*NdotH * (roughnessSqr-1.0) + 1.0;
    return roughnessSqr / (3.1415926535 * Distribution*Distribution);
}

float TrowbridgeReitzAnisotropicNormalDistribution(float anisotropic, float NdotH, float HdotX, float HdotY){
	float aspect = sqrt(1.0h-anisotropic * 0.9h);
	float X = max(.001, sqr(1.0-_Glossiness)/aspect) * 5;
 	float Y = max(.001, sqr(1.0-_Glossiness)*aspect) * 5;
    return 1.0 / (3.1415926535 * X*Y * sqr(sqr(HdotX/X) + sqr(HdotY/Y) + NdotH*NdotH));
}

float WardAnisotropicNormalDistribution(float anisotropic, float NdotL, float NdotV, float NdotH, float HdotX, float HdotY){
    float aspect = sqrt(1.0h-anisotropic * 0.9h);
    float X = max(.001, sqr(1.0-_Glossiness)/aspect) * 5;
 	float Y = max(.001, sqr(1.0-_Glossiness)*aspect) * 5;
    float exponent = -(sqr(HdotX/X) + sqr(HdotY/Y)) / sqr(NdotH);
    float Distribution = 1.0 / ( 3.14159265 * X * Y * sqrt(NdotL * NdotV));
    Distribution *= exp(exponent);
    return Distribution;
}
//--------------------------

//-----------------------------------------------
//Geometric Shadowing Functions

float ImplicitGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs =  (NdotL*NdotV);       
	return Gs;
}

float AshikhminShirleyGeometricShadowingFunction (float NdotL, float NdotV, float LdotH){
	float Gs = NdotL*NdotV/(LdotH*max(NdotL,NdotV));
	return  (Gs);
}

float AshikhminPremozeGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs = NdotL*NdotV/(NdotL+NdotV - NdotL*NdotV);
	return  (Gs);
}

float DuerGeometricShadowingFunction (float3 lightDirection,float3 viewDirection, float3 normalDirection,float NdotL, float NdotV){
    float3 LpV = lightDirection + viewDirection;
    float Gs = dot(LpV,LpV) * pow(dot(LpV,normalDirection),-4);
    return  (Gs);
}

float NeumannGeometricShadowingFunction (float NdotL, float NdotV){
	float Gs = (NdotL*NdotV)/max(NdotL, NdotV);       
	return  (Gs);
}

float KelemenGeometricShadowingFunction (float NdotL, float NdotV, float LdotH, float VdotH){
//	float Gs = (NdotL*NdotV)/ (LdotH * LdotH);           //this
	float Gs = (NdotL*NdotV)/(VdotH * VdotH);       //or this?
	return   (Gs);
}

float ModifiedKelemenGeometricShadowingFunction (float NdotV, float NdotL, float roughness)
{
	float c = 0.797884560802865; // c = sqrt(2 / Pi)
	float k = roughness * roughness * c;
	float gH = NdotV  * k +(1-k);
	return (gH * gH * NdotL);
}

float CookTorrenceGeometricShadowingFunction (float NdotL, float NdotV, float VdotH, float NdotH){
	float Gs = min(1.0, min(2*NdotH*NdotV / VdotH, 2*NdotH*NdotL / VdotH));
	return  (Gs);
}

float WardGeometricShadowingFunction (float NdotL, float NdotV, float VdotH, float NdotH){
	float Gs = pow( NdotL * NdotV, 0.5);
	return  (Gs);
}

float KurtGeometricShadowingFunction (float NdotL, float NdotV, float VdotH, float alpha){
	float Gs =  (VdotH*pow(NdotL*NdotV, alpha))/ NdotL * NdotV;
	return  (Gs);
}

//SmithModelsBelow
//Gs = F(NdotL) * F(NdotV);

float WalterEtAlGeometricShadowingFunction (float NdotL, float NdotV, float alpha){
    float alphaSqr = alpha*alpha;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;
    float SmithL = 2/(1 + sqrt(1 + alphaSqr * (1-NdotLSqr)/(NdotLSqr)));
    float SmithV = 2/(1 + sqrt(1 + alphaSqr * (1-NdotVSqr)/(NdotVSqr)));
	float Gs =  (SmithL * SmithV);
	return Gs;
}

float BeckmanGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float roughnessSqr = roughness*roughness;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;
    float calulationL = (NdotL)/(roughnessSqr * sqrt(1- NdotLSqr));
    float calulationV = (NdotV)/(roughnessSqr * sqrt(1- NdotVSqr));
    float SmithL = calulationL < 1.6 ? (((3.535 * calulationL) + (2.181 * calulationL * calulationL))/(1 + (2.276 * calulationL) + (2.577 * calulationL * calulationL))) : 1.0;
    float SmithV = calulationV < 1.6 ? (((3.535 * calulationV) + (2.181 * calulationV * calulationV))/(1 + (2.276 * calulationV) + (2.577 * calulationV * calulationV))) : 1.0;
	float Gs =  (SmithL * SmithV);
	return Gs;
}

float GGXGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float roughnessSqr = roughness*roughness;
    float NdotLSqr = NdotL*NdotL;
    float NdotVSqr = NdotV*NdotV;
    float SmithL = (2 * NdotL)/ (NdotL + sqrt(roughnessSqr + ( 1-roughnessSqr) * NdotLSqr));
    float SmithV = (2 * NdotV)/ (NdotV + sqrt(roughnessSqr + ( 1-roughnessSqr) * NdotVSqr));
	float Gs =  (SmithL * SmithV) ;
	return Gs;
}

float SchlickGeometricShadowingFunction (float NdotL, float NdotV, float roughness)
{
    float roughnessSqr = roughness*roughness;
	float SmithL = (NdotL)/(NdotL * (1-roughnessSqr) + roughnessSqr);
	float SmithV = (NdotV)/(NdotV * (1-roughnessSqr) + roughnessSqr);
	return (SmithL * SmithV); 
}

float SchlickBeckmanGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float roughnessSqr = roughness*roughness;
    float k = roughnessSqr * 0.797884560802865;
    float SmithL = (NdotL)/ (NdotL * (1- k) + k);
    float SmithV = (NdotV)/ (NdotV * (1- k) + k);
	float Gs =  (SmithL * SmithV);
	return Gs;
}

float SchlickGGXGeometricShadowingFunction (float NdotL, float NdotV, float roughness){
    float k = roughness / 2;
    float SmithL = (NdotL)/ (NdotL * (1- k) + k);
    float SmithV = (NdotV)/ (NdotV * (1- k) + k);
	float Gs =  (SmithL * SmithV);
	return Gs;
}

//--------------------------

float4 frag(VertexOutput i) : COLOR {

//normal direction calculations
     float3 normalDirection = normalize(i.normalDir);
	 float3 viewDirection = normalize(_WorldSpaceCameraPos.xyz - i.posWorld.xyz);
     float shiftAmount = dot(i.normalDir, viewDirection);
	 normalDirection = shiftAmount < 0.0f ? normalDirection + viewDirection * (-shiftAmount + 1e-5f) : normalDirection;

//light calculations
	 float3 lightDirection = normalize(lerp(_WorldSpaceLightPos0.xyz, _WorldSpaceLightPos0.xyz - i.posWorld.xyz,_WorldSpaceLightPos0.w));
	 float3 lightReflectDirection = reflect( -lightDirection, normalDirection );
	 float3 viewReflectDirection = normalize(reflect( -viewDirection, normalDirection ));
     float NdotL = max(0.0, dot( normalDirection, lightDirection ));
     float3 halfDirection = normalize(viewDirection+lightDirection); 
     float NdotH =  max(0.0,dot( normalDirection, halfDirection));
     float NdotV =  max(0.0,dot( normalDirection, viewDirection));
     float VdotH = max(0.0,dot( viewDirection, halfDirection));
     float LdotH =  max(0.0,dot(lightDirection, halfDirection)); 
     float LdotV = max(0.0,dot(lightDirection, viewDirection)); 
     float RdotV = max(0.0, dot( lightReflectDirection, viewDirection ));
     float attenuation = LIGHT_ATTENUATION(i);
     float3 attenColor = attenuation * _LightColor0.rgb;
     
     //get Unity Scene lighting data
     UnityGI gi =  GetUnityGI(_LightColor0.rgb, lightDirection, normalDirection, viewDirection, viewReflectDirection, attenuation, 1- _Glossiness, i.posWorld.xyz);
     float3 indirectDiffuse = gi.indirect.diffuse.rgb ;
	 float3 indirectSpecular = gi.indirect.specular.rgb;

	 //diffuse color calculations
	 float roughness = 1-(_Glossiness * _Glossiness);
	 roughness = roughness * roughness;
     float3 diffuseColor = _Color.rgb * (1.0 - _Metallic) ;
 	 float f0 = F0(NdotL, NdotV, LdotH, roughness);
	 diffuseColor *= f0;
	 diffuseColor+=indirectDiffuse;
	 


	//Specular calculations

	 float3 specColor = lerp(_SpecularColor.rgb, _Color.rgb, _Metallic * 0.5);

	 float3 SpecularDistribution = specColor;
	 float GeometricShadow = 1;
	 float3 FresnelFunction = specColor;

	 //Normal Distribution Function/Specular Distribution----------------------------------------------------- 

           
	#ifdef _NORMALDISTMODEL_BLINNPHONG 
		 SpecularDistribution *=  BlinnPhongNormalDistribution(NdotH, _Glossiness,  max(1,_Glossiness * 40));
 	#elif _NORMALDISTMODEL_PHONG
		 SpecularDistribution *=  PhongNormalDistribution(RdotV, _Glossiness, max(1,_Glossiness * 40));
 	#elif _NORMALDISTMODEL_BECKMANN
		 SpecularDistribution *=  BeckmannNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_GAUSSIAN
		 SpecularDistribution *=  GaussianNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_GGX
		 SpecularDistribution *=  GGXNormalDistribution(roughness, NdotH);
 	#elif _NORMALDISTMODEL_TROWBRIDGEREITZ
		 SpecularDistribution *=  TrowbridgeReitzNormalDistribution(NdotH, roughness);
 	#elif _NORMALDISTMODEL_TROWBRIDGEREITZANISOTROPIC
		 SpecularDistribution *=  TrowbridgeReitzAnisotropicNormalDistribution(_Anisotropic,NdotH, dot(halfDirection, i.tangentDir), dot(halfDirection,  i.bitangentDir));
	#elif _NORMALDISTMODEL_WARD
	 	 SpecularDistribution *=  WardAnisotropicNormalDistribution(_Anisotropic,NdotL, NdotV, NdotH, dot(halfDirection, i.tangentDir), dot(halfDirection,  i.bitangentDir));
	#else
		SpecularDistribution *=  GGXNormalDistribution(roughness, NdotH);
	#endif

	 //Geometric Shadowing term----------------------------------------------------------------------------------
	#ifdef _SMITHGEOSHADOWMODEL_NONE
	 	#ifdef _GEOSHADOWMODEL_ASHIKHMINSHIRLEY
			GeometricShadow *= AshikhminShirleyGeometricShadowingFunction (NdotL, NdotV, LdotH);
	 	#elif _GEOSHADOWMODEL_ASHIKHMINPREMOZE
			GeometricShadow *= AshikhminPremozeGeometricShadowingFunction (NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_DUER
			GeometricShadow *= DuerGeometricShadowingFunction (lightDirection, viewDirection, normalDirection, NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_NEUMANN
			GeometricShadow *= NeumannGeometricShadowingFunction (NdotL, NdotV);
	 	#elif _GEOSHADOWMODEL_KELEMAN
			GeometricShadow *= KelemenGeometricShadowingFunction (NdotL, NdotV, LdotH,  VdotH);
	 	#elif _GEOSHADOWMODEL_MODIFIEDKELEMEN
			GeometricShadow *=  ModifiedKelemenGeometricShadowingFunction (NdotV, NdotL, roughness);
	 	#elif _GEOSHADOWMODEL_COOK
			GeometricShadow *= CookTorrenceGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
	 	#elif _GEOSHADOWMODEL_WARD
			GeometricShadow *= WardGeometricShadowingFunction (NdotL, NdotV, VdotH, NdotH);
	 	#elif _GEOSHADOWMODEL_KURT
			GeometricShadow *= KurtGeometricShadowingFunction (NdotL, NdotV, VdotH, roughness);
	 	#else 
 			GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
 		#endif
	////SmithModelsBelow
	////Gs = F(NdotL) * F(NdotV);
  	#elif _SMITHGEOSHADOWMODEL_WALTER
		GeometricShadow *= WalterEtAlGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_BECKMAN
		GeometricShadow *= BeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_GGX
		GeometricShadow *= GGXGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_SCHLICK
		GeometricShadow *= SchlickGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_SCHLICKBECKMAN
		GeometricShadow *= SchlickBeckmanGeometricShadowingFunction (NdotL, NdotV, roughness);
 	#elif _SMITHGEOSHADOWMODEL_SCHLICKGGX
		GeometricShadow *= SchlickGGXGeometricShadowingFunction (NdotL, NdotV, roughness);
	#elif _SMITHGEOSHADOWMODEL_IMPLICIT
		GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
	#else
		GeometricShadow *= ImplicitGeometricShadowingFunction (NdotL, NdotV);
 	#endif
	 //Fresnel Function-------------------------------------------------------------------------------------------------

	#ifdef _FRESNELMODEL_SCHLICK
		FresnelFunction *=  SchlickFresnelFunction(specColor, LdotH);
	#elif _FRESNELMODEL_SCHLICKIOR
		FresnelFunction *=  SchlickIORFresnelFunction(_Ior, LdotH);
	#elif _FRESNELMODEL_SPHERICALGAUSSIAN
		FresnelFunction *= SphericalGaussianFresnelFunction(LdotH, specColor);
 	#else
		FresnelFunction *=  SchlickIORFresnelFunction(_Ior, LdotH);	
 	#endif

 	#ifdef _ENABLE_NDF_ON
 	 return float4(float3(1,1,1)* SpecularDistribution,1);
    #endif
    #ifdef _ENABLE_G_ON 
 	 return float4(float3(1,1,1) * GeometricShadow,1) ;
    #endif
    #ifdef _ENABLE_F_ON 
 	 return float4(float3(1,1,1)* FresnelFunction,1);
    #endif
	#ifdef _ENABLE_D_ON 
 	 return float4(float3(1,1,1)* diffuseColor,1);
    #endif

	 //PBR
	 float3 specularity = (SpecularDistribution * FresnelFunction * GeometricShadow) / (4 * (  NdotL * NdotV));
     float grazingTerm = saturate(roughness + _Metallic);
	 float3 unityIndirectSpecularity =  indirectSpecular * FresnelLerp(specColor,grazingTerm,NdotV) * max(0.15,_Metallic) * (1-roughness*roughness* roughness);

     float3 lightingModel = ((diffuseColor) + specularity + (unityIndirectSpecularity *_UnityLightingContribution));
     lightingModel *= NdotL;
     float4 finalDiffuse = float4(lightingModel * attenColor,1);
     UNITY_APPLY_FOG(i.fogCoord, finalDiffuse);
     return finalDiffuse;
}
ENDCG
}
}
FallBack "Legacy Shaders/Diffuse"
}
```

原文链接：[Unity3D 物理渲染算法研究 — BimAnt](http://www.bimant.com/blog/unity3d-pbr-algorithms-study/)