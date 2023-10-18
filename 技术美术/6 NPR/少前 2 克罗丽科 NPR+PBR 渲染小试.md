（本篇仅为个人学习记录。这个项目为边学习边实现的，写的时候把各种效果一股脑往上加，所以可能有些地方还不够完美或者不契合，自己还有待学习和改进，道阻且长啊。）

模型来自模之屋少前 2：追放手游官方账号

[专业模型创作分享社区_模之屋_PlayBox](https://www.aplaybox.com/u/636064186)

## **1. 贴图分析**

同样先从贴图分析开始，根据文件名可以看出 PBR 走的是金属度粗糙度工作流。

*   后缀为_d 的表示 BaseColor；
*   后缀为_n 的表示法线贴图；
*   后缀为_rmo 的表示三个通道分别为粗糙度、金属度、AO；
*   cloth.bmp、hd.png、Shiny.jpg 这三张分别为衣服、皮肤、头发的球面贴图
*   后缀为_b 的贴图不太清楚是做什么的，目前只知道 skin_b 贴图的 R 通道似乎是阴影遮罩，剩下的几个通道和 hair_b 贴图不知道作用，就没用上

![[1690372587481.png]]

## **2. 基础 PBR 实现**

PBR 的资料网上有很多，这里浅浅指个路

[凛冬与仓鼠：着色模型与 PBR 原理综述](https://zhuanlan.zhihu.com/p/388531181)[傻头傻脑亚古兽：Unity 的 URP 实现 PBR](https://zhuanlan.zhihu.com/p/517120906)

基础的 PBR 实现主要就是完成双向反射分布函数 (Bidirectional Reflectance Distribution Function, BRDF) 部分。Cook-Torrance BRDF 由漫反射和镜面反射（我更习惯称为高光）两个部分组成

$$f_r=k_df_{lambert}+k_sf_{cook-torrance} \\
$$

 其中 k_d 表示折射部分能量所占比重，k_s 表示反射部分能量所占比重。

$$f_{lambert}=\frac{c}{\pi} \\$$

$$f_{cook-torrance}=\frac{DFG}{4(\omega_o\cdot n)(\omega_i\cdot n)} \\$$

### 2.1 直接光照高光部分

高光部分主要由 DFG 三个函数以及分母上的标准化因子构成。

*   D：法线分布函数（Normal Distribution Function），描述微观表面上，表面法线对于表面面积的统计分布，受粗糙度影响

$$\alpha=roughness * roughness \\$$

$$NDF_{GGXTR}(n,h,\alpha)=\frac{\alpha^2}{\pi((n\cdot h)(\alpha^2-1)+1)^2} \\$$

```
float NormalDistributionFunc_GGX(float NdotH, float roughness) {
    //迪士尼原则中的 a
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;
    float num = a2;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;
    denom = PI * denom * denom;
    return num / denom;
}
```

*   F：菲涅尔方程（Fresnel Equation），描述不同角度下表面反射光线所占的比率

$$F_{Schlick}(h,v,F_0)=F_0+(1-F_0)(1-(h\cdot v))^5 \\$$

```
float3 Fresnel_Schlick(float VdotH, float3 F0) {
    return F0 + (1 - F0) * pow(1 - VdotH, 5);
}
```

*   G：几何函数（Geometry Function），描述微平面自遮挡比率，同时考虑视线方向的自遮挡和光线方向的自阴影，受粗糙度影响

$$\alpha=roughness*roughness \\$$

$$k=\frac{(\alpha+1)^2}{8} \\$$

 视线部分：

$$视线部分：G_V(n,v,k)=\frac{n\cdot v}{(n\cdot v)(1-k)+k} \\$$  
光线部分：

$$光线部分：G_L(n,l,k)=\frac{n\cdot l}{(n\cdot l)(1-k)+k} \\$$

  

$$G(n,v,l,k)=G_V(n,v,k)\cdot G_L(n,l,k) \\$$

```
float GeometryFunc_SchlickGGX(float NdotV, float NdotL, float roughness) {
    float a = roughness * roughness;
    float r = a + 1.0;
    float k = (r * r) / 8.0;
    float GV = NdotV / (NdotV * (1.0 - k) + k); //视线方向
    float GL = NdotL / (NdotL * (1.0 - k) + k); //光线方向
    return GV * GL;
}
```

根据以上公式可以算出直接光照高光部分

```
float dTerm = NormalDistributionFunc_GGX(NdotH, roughness);
float3 fTerm = Fresnel_Schlick(VdotH, F0);
float gTerm = GeometryFunc_SchlickGGX(NdotV, NdotL, roughness);
float3 directBRDFSpecFactor = dTerm * fTerm * gTerm / (4.0 * NdotV * NdotL);
```

效果展示

![[1690372587620.png]]

### **2.2 直接光照漫反射部分**

漫反射部分 k_d 由能量守恒得到，同时由于金属是没有漫反射的，所以需要乘上 (1 - metallic)

```
float3 Ks = fTerm;
float3 Kd = (1 - Ks) * (1 - metallic);
float3 diffuseColor = Kd * baseColor.xyz * occlusion;
```

正常来说漫反射部分应该还要除 $\pi$ 来规格化漫反射光，但是这里为了好看，就没进行规格化了，不然太暗了，毕竟已经是以结合 NPR 为目标，能量守恒什么的不遵守也罢（笑哭）

效果展示

![[1690372587687.png]]

### **2.3 间接光照高光部分**

以下部分内容参考如下：

[凛冬与仓鼠：IBL 综述](https://zhuanlan.zhihu.com/p/399849685)[URP 管线的自学 HLSL 之路 第三十七篇 造一个 PBR 的轮子](https://www.bilibili.com/read/cv7510082/)

间接光照的高光部分基本是通过基于图像的光照（Image-Based Lighting, IBL）计算。

间接光照高光部分计算公式如下：  

$$L_o(p,\omega_o)=\int_{\Omega}k_s\frac{DFG}{4(\omega_o\cdot n)(\omega_i\cdot n)}L_i(p,\omega_i)(n\cdot \omega_i)d\omega_i \\$$

可以看到高光部分依赖于 \ omega_i、视线方向、粗糙度、金属度等众多变量，这一步计算量极为庞大。Epic Games 提出分裂近似法（split sum approximation）来解决实时渲染的计算压力。

split sum 最终得出的结果是将上面的公式近似化简为：  

$$\int_{\Omega}L_i(p,\omega_i)d\omega_i*\int_{\Omega}f_r(p,\omega_i,\omega_o)(n\cdot \omega_i)d\omega_i \\$$

查看具体化简步骤请移步 [IBL 综述](https://zhuanlan.zhihu.com/p/399849685)

首先看 split sum 结果的前半部分。一般这里会假设法线方向 N = 反射方向 R = 观察方向 V，从而化简左半边的公式为（以离散形式表达）：  

$$\sum_k^N\frac{L_i(\omega_i^{(k)})(R\cdot \omega_i^{(k)})}{\sum_k^N(R\cdot \omega_i^{(k)})} \\$$

经过假设，这部分仅由反射方向 R 和粗糙度 roughness 决定。因此固定粗糙度，即可生成预滤波的 CubeMap。设定多个粗糙度等级，生成多个预滤波图。在使用时根据实际粗糙度进行三线性插值得到最终采样结果。

本文这里就直接使用 Unity 反射探针结果进行计算采样了，把采样到的颜色当成光照去进行计算，得到 split sum 结果的左半边。

```
//间接光高光 反射探针
float3 IndirSpeCube(float3 normalWS, float3 viewWS, float roughness, float AO) {
    float3 reflectDirWS = reflect(-viewWS, normalWS);
    roughness = roughness * (1.7 - 0.7 * roughness);
    float MidLevel = roughness * 6;
    float4 speColor = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflectDirWS, MidLevel);
    #if !defined(UNITY_USE_NATIVE_HDR)
    return DecodeHDREnvironment(speColor, unity_SpecCube0_HDR) * AO;
    #else
    return speColor.xyz*AO;
    #endif
}
```

接下来看 split sum 结果的后半部分，即 BRDF 项。后半部分的公式可以近似化简为 $F_0*scale+bias$ ，其中 scale 和 bias 都只取决于粗糙度 roughness 和 NdotV，因此可以将这两个变量存储在一张二维的 LUT 中，横轴表示 NdotV，纵轴表示粗糙度。具体推导过程详见本小节的参考链接。

![[1690372587817.png]]

本文使用的是模仿 Unity 的做法，用一个拟合函数计算了 LUT 里的数据，从而最终得到 split sum 结果的后半部分。

```
//间接高光 曲线拟合 放弃LUT采样而使用曲线拟合
float3 IndirSpeFactor(float roughness, float3 BRDFspe, float3 F0, float NdotV) {
    float smoothness = 1 - roughness;
    #ifdef UNITY_COLORSPACE_GAMMA
    float SurReduction=1-0.28*roughness,roughness;
    #else
    float SurReduction = 1 / (roughness * roughness + 1);
    #endif
    #if defined(SHADER_API_GLES)
    float Reflectivity=BRDFspe.x;
    #else
    float Reflectivity = max(max(BRDFspe.x, BRDFspe.y), BRDFspe.z);
    #endif
    half GrazingTSection = saturate(Reflectivity + smoothness);
    float Fre = Pow4(1 - NdotV); 
    return lerp(F0, GrazingTSection, Fre) * SurReduction;
}
​
float3 CalcBRDFSpeSection(float VdotH, float NdotV, float NdotL, float NdotH, float3 F0, float roughness) {
    float dTerm = NormalDistributionFunc_GGX(NdotH, roughness);
    float gTerm = GeometryFunc_SchlickGGX(NdotV, NdotL, roughness);
    float3 fTerm = Fresnel_Schlick(VdotH, F0);
    float3 specularFactor = dTerm * gTerm * fTerm / (4.0 * max(0.001, NdotV * NdotL));
    return specularFactor;
}
```

最终将 split sum 两部分相乘即可得到间接光照高光部分。

效果展示

![[1690372587866.png]]

### **2.4 间接光照漫反射部分**

间接光照漫反射部分使用了 Unity 球谐函数采样计算低频环境光照信息

```
float3 SH_IndirectionDiff(float3 normalWS)
{
    real4 SHCoefficients[7];
    SHCoefficients[0] = unity_SHAr;
    SHCoefficients[1] = unity_SHAg;
    SHCoefficients[2] = unity_SHAb;
    SHCoefficients[3] = unity_SHBr;
    SHCoefficients[4] = unity_SHBg;
    SHCoefficients[5] = unity_SHBb;
    SHCoefficients[6] = unity_SHC;
    float3 Color = SampleSH9(SHCoefficients, normalWS);
    return max(0, Color);
}
```

最终得到的间接光照漫反射颜色同样需要乘上 k_d 和 baseColor

```
float3 SHcolor = SH_IndirectionDiff(normalWS) * occlusion;
float3 IndirKS = Indir_Fresnel_Schlick(VdotH, F0, roughness);
float3 IndirKD = (1 - IndirKS) * (1 - metallic);
float3 IndirDiffuseColor = SHcolor * IndirKD * baseColor.xyz;
```

效果展示

![[1690372587933.png]]

至此，基础的 PBR 部分基本实现，将直接光照和间接光照整合起来的结果如下（为了强调高光，适当调整了一些高光强度）：

![[1690372587991.png]]

## **3. 皮肤渲染**

### **3.1 预积分次表面散射**

次表面散射相关的理论以及算法详见各位大佬的文章

[文刀秋二：基于物理着色（四）- 次表面散射](https://zhuanlan.zhihu.com/p/21247702)[Cutano：预积分皮肤渲染—次表面散射与高光反射](https://zhuanlan.zhihu.com/p/509057464?utm_id=0)

次表面散射简而言之就是入射光进入介质后，在介质中移动了一段距离，然后从有别于入射点的其他点位回到入射光一侧的空气中，成为漫反射。而光线在介质内传播时，会受到介质的影响而改变其颜色，进而影响到周围像素的着色。

为了描述不同频率的光在介质中传播多远后受到了何种程度的衰减，Diffusion profile 被提出。其作用是描述不同颜色的光分别能散射多远，如下图

![[1690372588116.png]]

由于 Diffusion profile 和高斯函数较为接近，可以使用一组高斯函数近似。

![[1690372588174.png]]

本文参考了 [Unity 实现 SSS 皮肤次表面散射](https://zhuanlan.zhihu.com/p/583108480)，使用 Burley normalized diffusion 来拟合 Diffusion profile，公式如下：  

$$R(r)=\frac{As}{8\pi r}(e^{-sr}+e^{-\frac{sr}{3}}) \\$$

生成的 Diffusion profile

![[1690372588242.png]]

获得了 Diffusion profile，接下来需要利用它生成 LUT 图。

《GPU Pro 2》中提出了预积分技术原理和实现：

![[1690372588303.png]]

经过[幽玄大佬对公式的推导和解读](https://zhuanlan.zhihu.com/p/56052015)，上图公式化为

$$D(\theta,r)=\frac{\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}}cos(\theta+x)\cdot R(2r\cdot sin(\frac{x}{2}))dx}{\int_{-\frac{\pi}{2}}^{\frac{\pi}{2}}R(2r\cdot sin(\frac{x}{2}))dx} \\$$

其中 $R(r,x)$ 为 Diffusion profile。此式中只有 $\theta$ 和 $r$ 是变量，通过事先求解这个积分式，即可得到预积分的皮肤 SSS LUT 如下图：

![[1690372588365.png]]

```
float4 Frag(Varyings input) : SV_Target
{
    float4 reslut = 1;
    float2 uv = input.texcoord;
    float cosTheta = uv.x * 2 - 1;
    float r = 1.0 / (max(0.00001, uv.y));
    float rad2deg = 57.29578;
    float theta = acos(cosTheta) * rad2deg;
    float3 totalWeights = 0.0;
    float3 totalLight = 0.0;
    int sampleCount = 128;
    float sampleAngle = (theta - 90.0);
    int stepSize = 180.0 / sampleCount;
    float3 S = _ShapeParam.rgb;
    float deg2rad = (PI / 180.0);
    for (int i = 0; i < sampleCount; i++)
    {
        float diffuse = saturate(cos(sampleAngle * deg2rad));
        float dAngle = abs(theta - sampleAngle);
        float sampleDist = abs(2.0f * r * sin(dAngle * 0.5f * deg2rad));
        float3 weights = EvalBurleyDiffusionProfile(sampleDist, S);
        totalWeights += weights;
        totalLight += diffuse * weights;
        sampleAngle += stepSize;
    }
    reslut.xyz = totalLight.xyz / totalWeights.xyz;
    return reslut;
}
```

SSS LUT 采样时需要一个二维坐标，横坐标为 NdotL，纵坐标为 $\frac{1}{r}$ ，其中 $\frac{1}{r}$ 中的 $r$ 表示该点处的曲率，例如在鼻尖、耳廓处曲率 $r$ 较小，$\frac{1}{r}$ 接近 1，在查找 SSS LUT 时会采样到透红的颜色；反之曲率较大的部位阴影过渡就较少。

至于曲率的计算，可以预先为模型表面生成一张描述曲率的贴图，使用时直接查表，也可以通过 fwidth() 实时计算。

![[1690372588426.png]]

```
float cuv = saturate(_CurveFactor * (length(fwidth(normalWS)) / length(fwidth(i.positionWS))));
float NoL = dot(normalWS, lightDir) * 0.5 + 0.5;       //[-1, 1] -> [0, 1]
NoL = clamp(NoL,_SkinSSSDarkBound,_SkinSSSBrightBound);       //钳制UV，防止采样到边缘
cuv = clamp(cuv,0.01,0.99);
// float3 skinShadowMap = SAMPLE_TEXTURE2D(_SkinShadowMap,sampler_SkinShadowMap,i.uv).rgb;    //采样皮肤阴影贴图（R通道表示AO，用于过度脖子和脸部，B通道可能是高光）
// NoL *= skinShadowMap.r;
float3 sssColor = SAMPLE_TEXTURE2D(_SSSLUTTex, sampler_SSSLUTTex, TRANSFORM_TEX(float2(NoL, cuv),_SSSLUTTex)).rgb * mainLight.color;
```

其中_SkinSSSDarkBound 和_SkinSSSBrightBound 用于钳制 UV 范围，防止采样到 LUT 边缘，造成采样颜色出错。同时这两个变量还可以一定程度上控制 LUT 上的采样范围，从而控制暗部和亮部的颜色。后缀为_b 的贴图猜测是阴影遮罩，但是使用在此处效果还不如不用，因此没用此贴图而直接计算了。

效果展示

![[1690372588547.png]]

### **3.2 双镜叶高光**

相比于前面 PBR 基础，这一部分网上资料不是很多，这里参考的

[[http://shihchinw.github.io/2015/12/realistic-human-skin-with-normalized-diffusion-ggx.html#ref.3]][[Dual lobe Specular)](https://blog.csdn.net/A13155283231/article/details/124228397|Unity 关于双叶高光 (Dual lobe Specular)]]

这里还需要再研究研究，代码来源自上面第二个链接

```
float3 DirectBDRF_DualLobeSpecular(float roughness, float3 F0, half3 normalWS, half3 lightDirWS, half3 viewDirWS, half mask, half lobeWeight)
{
    float3 halfDir = SafeNormalize(float3(lightDirWS) + float3(viewDirWS));
​
    float NoH = saturate(dot(normalWS, halfDir));
    half LoH = saturate(dot(lightDirWS, halfDir));
​
    float roughness2 = roughness * roughness;
    float roughness2MinusOne = roughness2 - 1.0;
    float normalizationTerm = roughness * 4.0 + 2.0;
​
    float d = NoH * NoH * roughness2MinusOne + 1.00001f;
    half nv = saturate(dot(normalWS, lightDirWS));
    half LoH2 = LoH * LoH;
    float sAO = saturate(-0.3f + nv * nv);
    sAO = lerp(pow(0.75, 8.00f), 1.0f, sAO);
    half SpecularOcclusion = sAO;
    half specularTermGGX = roughness2 / ((d * d) * max(0.1h, LoH2) * normalizationTerm);
    half specularTermBeckMann = (2.0 * (roughness2) / ((d * d) * max(0.1h, LoH2) * normalizationTerm)) * lobeWeight * mask;
    half specularTerm = (specularTermGGX / 2 + specularTermBeckMann) * SpecularOcclusion;
​
    float3 color = specularTerm * F0;
    return color;
}
```

针对皮肤部分，把默认的 PBR 高光替换为双镜叶高光

双镜叶高光（上）和默认 PBR 高光（下）对比

![[1690372589094.png]]

![[1690372589595.png]]

## **4. 面部渲染**

面部还是使用的 SDF 的方式，感觉看着比较顺眼

SDF 实现方式参考之前的原神面部 SDF 部分

[Calendula：原神 Toon 渲染练习](https://zhuanlan.zhihu.com/p/645367998)

与之不同的是，原神那边的脸部更偏向于比较 Hard 的明暗过渡，这里由于皮肤使用的 SSS LUT，过渡比较平滑，所以个人觉得脸部明暗过渡也应当柔和一点。

```
half4 SDF_L = SAMPLE_TEXTURE2D(_FaceSDF, sampler_FaceSDF,i.uv);
half4 SDF_R = SAMPLE_TEXTURE2D(_FaceSDF, sampler_FaceSDF,float2(1-i.uv.x,i.uv.y));
//物体空间的Forward向量和Right向量变换到世界空间中计算
float3 forwardDirWS = normalize(TransformObjectToWorldDir(float3(0.0,0.0,1.0)));
float3 rightDirWS = normalize(TransformObjectToWorldDir(float3(1.0,0.0,0.0)));
float3 lightDirWS = normalize(float3(mainLight.direction.x,0.0,mainLight.direction.z));    //不需要关注光线y方向，相当于把光线向量投影到xOz平面上
//判断光源在左还是在右（SDF贴图为光源在左侧，如光源在右侧需要调换采样坐标U）
float RdotL = dot(rightDirWS,lightDirWS);
//计算光源和正脸夹角，以SDF作为明暗分界，柔和过渡
float FdotL = dot(forwardDirWS,lightDirWS) * -0.5 + 0.5;
half4 appliedSDF = RdotL<0?SDF_L:SDF_R;
float bias = smoothstep(0-_FaceSoftShadow, 0+_FaceSoftShadow, appliedSDF.r-FdotL);
float3 skinShadowMap = SAMPLE_TEXTURE2D(_SkinShadowMap,sampler_SkinShadowMap,i.uv).rgb;    //采样皮肤阴影贴图（R通道表示AO，用于过渡脖子和脸部，B通道可能是高光）
bias *= skinShadowMap.r;
//以下为皮肤SSS，同_SHADERTYPE_SKIN，但用bias替换NoL
float cuv = saturate(_CurveFactor * (length(fwidth(normalWS)) / length(fwidth(i.positionWS))));
bias = clamp(bias,_SkinSSSDarkBound,_SkinSSSBrightBound);       //钳制UV，防止采样到边缘
cuv = clamp(cuv,0.01,0.99);
float3 sssColor = SAMPLE_TEXTURE2D(_SSSLUTTex, sampler_SSSLUTTex, TRANSFORM_TEX(float2(bias, cuv),_SSSLUTTex)).rgb * mainLight.color;
```

我个人感觉观感姑且是比硬过渡好那么一点的（笑哭）

![[1690372589650.png]]

![[1690372589757.png]]

这里可能会出现色彩断层，这是 SDF 图片压缩导致的，可以在 Import Settings 里选择高质量压缩，大小从原来正常质量压缩的 2MB 变为 4MB，还算可以接受？

![[1690372589824.png]]

![[1690372589880.png]]

此外，这里的 c_Charolic_FaceShadowMap 贴图的 R 通道是阴影遮罩，用于过渡脖子和脸部，G 通道全为 1 不知道有什么用，B 通道应该是脸颊和鼻尖高光，但是由于我这里用了 SDF，如果加上鼻尖高光的话就不太好看，所以就没有用上。

## **5. 眼睛渲染**

NPR 眼睛这边已经有大佬写过非常详细的文章了，这里指一波路，我这边就学习一下

[MIZI：二次元角色卡通渲染—眼睛篇](https://zhuanlan.zhihu.com/p/402861632)

首先是视差方法实现瞳孔折射

```
float3 viewDirOS = normalize(TransformWorldToObjectDir(viewDirWS));
float2 offset = _ParallaxHeight * viewDirOS.xy;
offset.y = -offset.y;
baseColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, TRANSFORM_TEX(i.uv+offset,_MainTex));
```

Matcap 的主要方法就是相机空间下的法线 xy 分量作为 UV 进行采样，同时为了修正相机旋转带来的采样偏移，使用视线向量叉乘相机空间下法向量进行修正。

```
float3 normalVS_MatCap = TransformWorldToViewNormal(normalWS, true);
float3 viewDirVS_MatCap = normalize(TransformWorldToView(i.positionWS));
float3 VcrossN = cross(viewDirVS_MatCap, normalVS_MatCap);
float2 matCapUV = float2(-VcrossN.y,VcrossN.x)*0.5+0.5;
float4 matCapColor = SAMPLE_TEXTURE2D(_EyeMatCap, sampler_EyeMatCap, matCapUV);
baseColor += matCapColor;
```

另外，由于我这里角色眼睛不接受阴影，在角色背光的时候可能亮度可能会有点高，可以根据角色 Forward 向量点乘光线向量的方式 Lerp 一下亮度，避免背光时眼睛过于突兀。

## **6. 球面贴图**

如第一节贴图分析里说的，官方配布的贴图里有几张是用作球面贴图的，针对皮肤，衣服和头发分别有一张球面贴图，其中皮肤的球面贴图时乘算，另外两张球面贴图是加算。球面贴图基本就是基于视线增加一些小细节。

设置球面贴图为 CubeMap，采样也是按照 CubeMap 的流程采样，最后区分一下乘算和加算就行了。

```
#if defined(_SPHEREMAP)
float3 normalVS = TransformWorldToViewNormal(normalWS, true);
float3 viewDirVS = normalize(TransformWorldToView(i.positionWS));
float3 uvwSphere = reflect(viewDirVS, normalVS);
half3 sph = SAMPLE_TEXTURECUBE(_SphereCube, sampler_SphereCube, uvwSphere).rgb;
#if defined(_SPHERECUBETYPE_ADD)
finalColor += sph;
#else
finalColor *= sph;
#endif
#endif
```

头发和装甲球面贴图应用前后对比，这里为装甲增加了一些类似于清漆的质感

![[1690372589931.png]]

![[1690372589993.png]]

皮肤球面贴图则是强调了皮肤和骨骼的立体感

![[1690372590071.png]]

![[1690372590136.png]]

## **7. 头发各向异性高光**

关于头发渲染，官方的贴图里有一张 c_Charolic_hair_spc 用于高光，但是可能是我的用法有误，那张贴图观感不是很好，正好我也想试一试头发的各向异性高光，于是便没用官方的那张贴图。

提到头发的各向异性高光，肯定会想到 KK 高光模型，即 Kajiya-Kay Model。这里放一张介绍 KK 模型必贴的图片。

![[1690372590246.png]]

与传统 Phong 模型不同，KK 模型使用 TsinH 作为因子，可以模拟出沿发丝方向的各向异性高光。当前，这样做的前提时保证头发的切线方向和发丝方向相同。

```
float TdotH = dot(Tangent, halfDir);
float sinTH = sqrt(1 - TdotH * TdotH);
float dirAtten = smoothstep(-1.0, 0.0, TdotH);
float3 specCol = dirAtten * pow(sinTH, _AnisotropicExponent) * _AnisotropicSpecIntensity;
```

保证头发的切线方向和发丝方向相同最简单的做法时在展 UV 的时候以纵向展开，类似于下图

![[1690372590318.png]]

一般情况下，若 UV 没有按此规律排列（如本文的模型），则需要使用 FlowMap/DirectionMap/TangentMap 来修正切线。

![[1690372590392.png]]

FlowMap 可以通过各种 DCC 工具生成。我这边最开始是使用 Substance Painter 画的，但是效果不是很好，最后是用 Krita 画的。

以下是我个人的踩坑记录。第一次画 FlowMap，不是很熟悉所以估计会有很多没必要的操作。

首先在 SP 里标注了发丝的方向，导出贴图作为基础图层，防止之后画 FlowMap 的时候方向有偏差。

![[1690372590455.png]]

在 Krita 中，打开笔刷编辑器，找到法线贴图笔刷，将倾斜选项改为 “笔画方向”，这样就可以画 FlowMap 了

![[1690372590936.png]]

我这里按照之前预先画的发丝方向，用 Tangent 笔刷涂了一下，得到的结果就是修正的 FlowMap。中间有些地方没有上色，是因为那些地方处于模型内侧，一般都看不到，所以就没管了（IPad 涂的，不会画画，涂的一言难尽（笑哭））

![[1690372591010.png]]

将 FlowMap 导入 Unity，记得需要取消勾选 sRGB

实际使用 FlowMap 时，需要将切线从图中提取出来。切线和法线一样范围在 [-1, 1]，所以从图片中提取时需要将其从[0, 1] 缩放到[-1, 1]。

```
float3 bakedTangent = SAMPLE_TEXTURE2D(_TangentMap, sampler_TangentMap, i.uv).rgb * 2 - 1;
bakedTangent = normalize(mul(bakedTangent, tangentToWorld));
```

同时，为了实现发丝效果，可以使用拉伸噪声图对切线沿法线方向做扰动，同时可适当调整噪声图的 Tiling，增加观感

![[1690372591058.png]]

```
float shift = SAMPLE_TEXTURE2D(_JitterMap, sampler_JitterMap, TRANSFORM_TEX(uv,_JitterMap));
bakedTangent = bakedTangent + shift * normalWS;
```

此时会发现，UV 横向展开的部分的发丝效果方向错误，如下图

![[1690372591137.png]]

这是由于此部分 UV 横向展开，导致采样噪声图的时候也是横向采样。我这里的解决方法比较简单粗暴，直接画一张 Mask 将纵向展开 UV 和横向展开 UV 的部分区分开来。

![[1690372591263.png]]

之后根据 Mask，针对横向展开的部分，在进行采样前对其 uv 旋转 90 度，这样就能采样到正确的噪声图。

```
float hairUVRotate = SAMPLE_TEXTURE2D(_HairUVRotateMask, sampler_HairUVRotateMask, i.uv);
float hairUVRotateMask = step(0.8, hairUVRotate);
float a = _AnisotropicDirection / 180 * 3.1415926;
float2x2 rotateMat = float2x2(cos(a), sin(a), -sin(a), cos(a));
float2 rotatedUV = mul(rotateMat, i.uv);
float2 uv = hairUVRotateMask > 0 ? rotatedUV : i.uv;
```

这个方法比较土，还增加了一次采样操作，肯定还有更优解，还得继续捣鼓捣鼓。

![[1690372591347.png]]

正面照

![[1690372591411.png]]

## **8. 刘海投影**

有关刘海投影，流朔大佬也给过一个简单易懂的实现方案，我这里也基本是基于这个方案实现的

[流朔：【Unity URP】卡通渲染中的刘海投影 · 改](https://zhuanlan.zhihu.com/p/416577141)

主要思想就是将头发沿光线方向偏移，再限制偏移后的头发在脸部区域。

至于刘海阴影颜色，由于我这里受到直接光、间接光、SSS LUT 等各种因素的影响，所以还是得用脸部材质重新画一遍脸部阴影。

![[1690372591482.png]]

![[1690372591787.png]]

## **9. 描边**

描边和前一篇原神 Toon 里一样，法线外扩的老方法，这里也不过多介绍了。看官方的实机里描边都是黑色，似乎没有针对各部位改变颜色。

[Calendula：原神 Toon 渲染练习](https://zhuanlan.zhihu.com/p/645367998)

![[1690372591854.png]]

至于边缘光，方法和原神那篇里一样，也不写了。但是一来 PBR 里多少也包含了菲涅尔项，再手动加上深度边缘光的话，总感觉画面有点出戏，最后还是不添加边缘光了。

## **10. 杂项**

*   Shader GUI

Shader GUI 用的是 [Jason Ma](https://www.zhihu.com/people/blackcat1312) 大佬的 LWGUI，用起来也比较简单上手难度不高。我这边当时是为了统一赋材质就没细分各个材质的 shader，而是把所有参数一股脑写在一个文件里用 Keyword 区分了。用 LWGUI 管理起来也比较方便

[[Light Weight Shader GUI)](https://github.com/JasonMa0012/LWGUI|LWGUI (Light Weight Shader GUI)]]

![[1690372592165.png]]

*   ToneMapping

总体来说 PBR 是低饱和度的，人物色彩没有官方实机演示里丰富，所以需要 ToneMapping 来保持颜色饱和度以及修复过曝区域，让画面更加适合卡通渲染之类的。这边也有挺多东西值得深挖的，但是目前我只是简单使用内置的 ToneMapping Mode 然后简单调了一下 Color Ajustments，这部分先挖个坑，以后有机会多研究研究。

![[1690372592228.png]]

## **11. 结语**

这一路做下来着实学习了不少知识，但是一些效果的实现还是得参考各位大佬的方案。自己还是得多看多学，提高专业水平，才能有更多更深的思考。