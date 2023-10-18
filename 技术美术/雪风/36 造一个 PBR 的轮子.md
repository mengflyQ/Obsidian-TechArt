![[81dababcc6f229f75c632e77fa74140e_MD5.webp]]

官方 LITshader 和我的轮子近乎一样

作为一个 Bridge 重度用户，我在使用 hdrp 管线完全离不开它了，自带的上万个扫描级材质贴图，大大降低了 SP/SD 里绘制制作周期，当然它也可以当作 SD/SP 的素材进行二次编辑。随着我想在 URP 管线里充分使用 Bridge 的资源，URP 自带的 LIT 无法充分利用 Mask 图（它会额外多一次 AO 的采样的开销），这对于性能来说不太划算，我更希望的是像 hdrp 那样直接读取；还有个原因是我希望在后续能自由拓展 LITshader 的功能，目前 URP 不支持表面着色器虽然 Colin 神已经开源了一个 URP 的表面着色器（https://github.com/ColinLeung-NiloCat/UnityURP-SurfaceShaderSolution）有兴趣的可以去看看，但是表面着色器又和第一个原因冲突了。至此，打算自己造一个能直接使用 Bridge 的 PBR 的轮子，甚至后续支持 bridge 的基于 PBR 的 NPRshader 开发。

![[83ffb1d2b4c314d1772b423f16865340_MD5.webp]]

URP 有多一次 AO 的采样

本次轮子的效果如下：  

1. 本 PBR 轮子效果近乎和 LITshader 的效果一直，自认为高达 90% 的相似度，下图读者可以区分出哪个是手写的，哪个是官方的么？

![[483282e8d6cc5654d50e5e2c28d54c94_MD5.webp]]

2. 本 PBR 轮子尽量不增加新的功能，只保证基础效果一致，其他的 pass 比如 depthonly 的 pass，shadowcaster 的 pass 或者对 lightmap 的采样就交给读者去自己实现，方便读者自我拓展功能，或者把它作为 URP 的 shader 源码的学习资料。

3. 只有 3 张贴图，一张纹理，一张 mask，一张法线。mask 图遵守 HDRP 的规则（即 Bridge 的导出规则），R 通道为金属，G 通道为 AO，A 为光滑度。

![[a4024c976de7f55d95df9afe6545490c_MD5.webp]]

![[ff2b429e0c919e219d2566855e386513_MD5.webp]]

注意！本篇文章只注重实践，不会涉及 PBR 的各个公式的原理推导，想要了解的网上一大堆文章和论文或者书籍；PBR 的理论部分也不会在本文里讲到，入门精要的理论部分就讲得很好。

核心方程如下，它分为 2 大部分，漫反射部分和高光部分。

![[7aa7ca88e8ba495890025af498dafc09_MD5.webp]]

在 unity 里对直接光照（直射光，点光源，聚光灯）和间接光照（反射探针灯光探针）的处理也不太一样：直接光照的计算和上式基本一致；间接光照则利用了各种 trick，各种预计算和近似拟合来达到我们想要的效果。

![[44c75908fb932daa7f4a9fdd711e7bca_MD5.png]]

**直射光照部分：**  

**1. 高光**

**1.1 法线分布函数 GGX(Normal Distribution Function)**，即核心方程的 D 项，它是描述微观法线 N 和半角向量 H 的趋同性比重。

![[4c2c265c019a52e8525c009fa9a7a22c_MD5.webp]]

我们在 unity 里定义该函数，非常简单，照着公式写即可。

![[039487d1d0fba4624e5edb7a9c59b470_MD5.webp]]

它的效果如下，随着粗糙度的变化而变化。

GIF

![[2a5dbcff95d27a40c82fb9169f099c62_MD5.webp]]

我们把粗糙度换成贴图后，它的效果如下。

GIF

![[a948f6c30a03b17e9317d3dc625376ba_MD5.webp]]

**1.2 几何函数** **G**，(**Geometry function)****,** 即核心方程的 G 项，它是描述入射射线（即光照方向）和出射射线（视线方向）被自己的微观几何形状遮挡的比重。

![[343748608e09f086d0b465f3094a4997_MD5.webp]]

G 项是由 2 个几乎一样的子项相乘得来，故我们可以先定义子项的函数。

![[d650b0d0175c2d9c1518995dea4c4d43_MD5.webp]]

再去定义真正的 G 项，把 NL 和 NV 代入子项，相乘即可。

![[9d45ed969427c08c978214c6288c809e_MD5.webp]]

注意这里的 K 系数，在直射光和间接光的计算方式略有不同，代码里是直接光的，而间接光的 K=pow（roughness，2）/2, 这里要注意。

GIF

![[7bcc2f2a909c548e431b87ce62265e0f_MD5.webp]]

随着粗糙度的变化

而我们把粗糙度换成贴图后，效果如下。

GIF

![[df5ee504f070b83edcf0d43e794180d5_MD5.webp]]

**1.3 菲涅尔函数 F(Fresnel equation)**, 即核心方程的 F 项，如下图所示。

![[b2f142ce984a1d6f713ed1b771db5a26_MD5.webp]]

但是由于我们需要的法线方向并不是模型本身的宏观法线 n，而是经过 D 项筛选通过的微观法线 H，故需把 N 改成 H。

![[b6ff66677d023c727c4f1202519c2d22_MD5.webp]]

后来 unity 对它进行了优化 (https://link.zhihu.com/?target=http%3A//filmicworlds.com/blog/optimizing-ggx-shaders-with-dotlh/)，视线方向 V 换成了 L，如下所示，这是我们所使用的函数。  

![[c622a640e21fc44aa3fa26f7f04f2d78_MD5.webp]]

其中的 5 次方计算量比较大，把它变成自然对数函数进行计算可以节省计算量，后续文章里所有的 5 次方计算都可以换算成对数计算。

![[df012714ba3298cd903f3969dca97b73_MD5.webp]]

故最终，我们的菲涅尔函数如下。

![[a9549b5a3f8f86b7e0906dea940e93ef_MD5.webp]]

我们把它输出看看，效果和平时简单的菲涅尔不太一样，但是它是正确的。

GIF

![[1473c1974eb6b4b17fbbe64a0ace98b3_MD5.webp]]

**1.4 直接光的高光部分**：我们把 D,G,F 代入公式，先计算出高光部分。注意这里经过半球积分后会乘 PI，不要丢了；注意这里并未再次乘 KS，因为 KS=F，已经计算过了一次不需要重复计算。

![[2900df3fe3021c45025ea923cba1bf69_MD5.webp]]

直接光_高光部分

GIF

![[433480a9e5f7ddfacb73687bfd2e1973_MD5.webp]]

**2. 漫反射**

漫反射就超级简单了，本质就是 NdotL，计算出 KD。这里要注意由于分母带了 PI，而半球积分后会乘 PI, 两者就约掉了这就没有写。

![[b7d19d8bc75ad550e9bc4c044d06c137_MD5.webp]]

我们把漫反射和高光反射加起来，也就是整个直接光的结果输出，效果如下，至此，直接光完毕。

GIF

![[1f5ca02c15104d36567e4a1a4ec05178_MD5.webp]]

![[cc19eeba62210b806fd1ed578501feb9_MD5.png]]

**间接光照部分：**

**1. 漫反射和球谐函数**

 间接光照的漫反射本质是对光照探针进行采样，这里有篇文章讲得很好（https://mp.weixin.qq.com/s/dW6Kz_jyS503QTtLnyK6og）

这部分我是抄的 urp 的 Lighting.hlsl 的源码，代码如下。

![[337689a58ee42a6f5aee8ef3eacf3537_MD5.webp]]

我们把它输出，它是取的最近的 4 个光照探针的值得到的结果。

GIF

![[655de1636b4c6f99e87e3016299c806d_MD5.webp]]

得到颜色后，再通过计算间接光照的菲涅尔函数得到 KD, 其计算如下图。

![[24aa1ccfa5a44a5dbe4edcda1855dfa5_MD5.webp]]

GIF

![[ea03c51a84895f1cb38a4ae2342345ee_MD5.webp]]

**2. 高光反射和 IBL**

间接光照的高光反射本质是对于反射探针（360 全景相机）拍的一张图进行采样，把采样到的颜色当成光照去进行计算，这种光照称为基于图像的光照 IBL（Image-Based Lighting），前面的漫反射也是 IBL，关于 IBL 有非常复杂的理论，本人才疏学浅就不展开了。

![[2d1d1e3cffdd90e3ed03bbc375620a41_MD5.webp]]

这张全景相机拍的图是 cube 类型，我们先计算反射射线的方向对 cube 进行采样。我们还需要根据不同的粗糙度进行采样不同的模糊度，粗糙度需要修改一下曲线去拟合，它并非线性；模糊度从 0-6 总共 7 个模糊等级，算法我是参考 URP 的源码 imageBasedLighting.hlsl 和 Lighting.hlsl 改改写写的。

![[da67c89115118c294d079d942ec7b29e_MD5.webp]]

我们把得到的反射探针的图像输出，效果如下。

GIF

![[a357bbaac1e346ed9dbaf6c54445293a_MD5.webp]]

我们还需要计算一个间接高光的影响因子，一般来说是按照一张现成的 LUT 图像进行采样，采样 UV 的 U 方向为 NdotV，V 方向为粗糙度来得到我们需要的影响因子。

![[e279b14c0c1dec437ba298cff78a92fb_MD5.webp]]

LUT，它的采样过程耗费性能不在考虑

但是采样贴图的过程非常耗，unity 使用的曲线拟合去得到结果，其计算函数如下。计算过程也是白嫖的 Lighting.hlsl 的写法。

![[0ebfa0be487158de88dbe279d24e57f6_MD5.webp]]

我们把间接光照和 factor 相乘输出，环境高光的强度就很弱了。

![[c498b11dadef5cde4a6801f5c8c4146e_MD5.webp]]

最后，把全部间接光输出，效果如下。  

GIF

![[3ebc01d0094ebca85d0b538779cebc82_MD5.webp]]

全部间接光

![[cc19eeba62210b806fd1ed578501feb9_MD5.png]]

最终把全部直接光和间接光加起来，输出，就是我们需要的最终结果。从 Bridge 里拉一个模型出来，丢上贴图，丢上一个官方的 lit shader 和自己写的 pbr shader，对比图如下，近乎一模一样的效果（当然自己写的多了个 AO 有一些小的差异）。

GIF

![[45e342c0ad4e3b67e9b7800d5b4ae2b4_MD5.webp]]

喜欢卡渲的大佬欢迎入驻群聊 950138189。

Git 工程地址：https://github.com/NiceTimeJob/PBR_URP

参考文章如下：

https://zhuanlan.zhihu.com/p/68025039

https://zhuanlan.zhihu.com/p/33464301

**函数库源码**

#ifndef PBR_Function_INCLUDE

#define PBR_Function_INCLUDE

         //D 项 法线微表面分布函数 

         float D_Function(float NdotH,float roughness)

         {

             float a2=roughness*roughness;

             float NdotH2=NdotH*NdotH;

             // 直接根据公式来

             float nom=a2;// 分子

             float denom=NdotH2*(a2-1)+1;// 分母

             denom=denom*denom*PI;

             return nom/denom;

         }

         //G 项子项

         float G_section(float dot,float k)

         {

             float nom=dot;

             float denom=lerp(dot,1,k);

             return nom/denom;

         }

         //G 项

         float G_Function(float NdotL,float NdotV,float roughness)

         {

             float k=pow(1+roughness,2)/8;

             float Gnl=G_section(NdotL,k);

             float Gnv=G_section(NdotV,k);

             return Gnl*Gnv;

         }

         //F 项 直接光

         real3 F_Function(float HdotL,float3 F0)

         {

             float Fre=exp2((-5.55473*HdotL-6.98316)*HdotL);

             return lerp(Fre,1,F0);

         }

         //F 项 间接光

         real3 IndirF_Function(float NdotV,float3 F0,float roughness)

         {

             float Fre=exp2((-5.55473*NdotV-6.98316)*NdotV);

             return F0+Fre*saturate(1-roughness-F0);

         }

         // 间接光漫反射 球谐函数 光照探针

         real3 SH_IndirectionDiff(float3 normalWS)

         {

             real4 SHCoefficients[7];

             SHCoefficients[0]=unity_SHAr;

             SHCoefficients[1]=unity_SHAg;

             SHCoefficients[2]=unity_SHAb;

             SHCoefficients[3]=unity_SHBr;

             SHCoefficients[4]=unity_SHBg;

             SHCoefficients[5]=unity_SHBb;

             SHCoefficients[6]=unity_SHC;

             float3 Color=SampleSH9(SHCoefficients,normalWS);

             return max(0,Color);

         }

         // 间接光高光 反射探针

         real3 IndirSpeCube(float3 normalWS,float3 viewWS,float roughness,float AO)

         {

             float3 reflectDirWS=reflect(-viewWS,normalWS);

             roughness=roughness*(1.7-0.7*roughness);//Unity 内部不是线性 调整下拟合曲线求近似

             float MidLevel=roughness*6;// 把粗糙度 remap 到 0-6 7 个阶级 然后进行 lod 采样

             float4 speColor=SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0,reflectDirWS,MidLevel);// 根据不同的等级进行采样

             #if !defined(UNITY_USE_NATIVE_HDR)

             return DecodeHDREnvironment(speColor,unity_SpecCube0_HDR)*AO;// 用 DecodeHDREnvironment 将颜色从 HDR 编码下解码。可以看到采样出的 rgbm 是一个 4 通道的值，最后一个 m 存的是一个参数，解码时将前三个通道表示的颜色乘上 xM^y，x 和 y 都是由环境贴图定义的系数，存储在 unity_SpecCube0_HDR 这个结构中。

             #else

             return speColor.xyz*AO;

             #endif

         }

         // 间接高光 曲线拟合 放弃 LUT 采样而使用曲线拟合

         real3 IndirSpeFactor(float roughness,float smoothness,float3 BRDFspe,float3 F0,float NdotV)

         {

             #ifdef UNITY_COLORSPACE_GAMMA

             float SurReduction=1-0.28*roughness,roughness;

             #else

             float SurReduction=1/(roughness*roughness+1);

             #endif

             #if defined(SHADER_API_GLES)//Lighting.hlsl 261 行

             float Reflectivity=BRDFspe.x;

             #else

             float Reflectivity=max(max(BRDFspe.x,BRDFspe.y),BRDFspe.z);

             #endif

             half GrazingTSection=saturate(Reflectivity+smoothness);

            float Fre=Pow4(1-NdotV);//lighting.hlsl 第 501 行 

             //float Fre=exp2((-5.55473*NdotV-6.98316)*NdotV);//lighting.hlsl 第 501 行 它是 4 次方 我是 5 次方 

             return lerp(F0,GrazingTSection,Fre)*SurReduction;

         }

#endif

![[8ee97bf9bbc88681364c992db823a9c4_MD5.png]]

**Shader 源码**

Shader "WX/URP/PBR"

{

    Properties

    {

    _BaseColor("BaseColor",Color)=(1,1,1,1)

        _BaseMap("MainTex",2D)="white"{}

        [NoScaleOffset]_MaskMap("MaskMap",2D)="white"{}

        [NoScaleOffset][Normal]_NormalMap("NormalMap",2D)="Bump"{}

        _NormalScale("NormalScale",Range(0,1))=1

    }

    SubShader

    {

        Tags{

        "RenderPipeline"="UniversalRenderPipeline"

        }

        HLSLINCLUDE

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

        #include "PbrFunction.hlsl"

        CBUFFER_START(UnityPerMaterial)

        float4 _BaseMap_ST;

        real4 _BaseColor;

        float _NormalScale;

        CBUFFER_END

        TEXTURE2D(_BaseMap);    SAMPLER(sampler_BaseMap);

        TEXTURE2D(_MaskMap);    SAMPLER(sampler_MaskMap);

        TEXTURE2D(_NormalMap);  SAMPLER(sampler_NormalMap);

         struct a2v

         {

             float4 positionOS:POSITION;

             float4 normalOS:NORMAL;

             float2 texcoord:TEXCOORD;

             float4 tangentOS:TANGENT;

             float2 lightmapUV:TEXCOORD2;// 一般来说是 2uv 是 lightmap 这里取 3uv 比较保险

         };

         struct v2f

         {

             float4 positionCS:SV_POSITION;

             float4 texcoord:TEXCOORD;

             float4 normalWS:NORMAL;

             float4 tangentWS:TANGENT;

             float4 BtangentWS:TEXCOORD1;

         };

        ENDHLSL

        pass

        {

        Tags{

         "LightMode"="UniversalForward"

         "RenderType"="Opaque"

            }

            HLSLPROGRAM

            #pragma vertex VERT

            #pragma fragment FRAG

            v2f VERT(a2v i)

            {

                v2f o;

                o.positionCS=TransformObjectToHClip(i.positionOS.xyz);

                o.texcoord.xy=TRANSFORM_TEX(i.texcoord,_BaseMap);

                o.texcoord.zw=i.lightmapUV;

                o.normalWS.xyz=normalize(TransformObjectToWorldNormal(i.normalOS.xyz));

                o.tangentWS.xyz=normalize(TransformObjectToWorldDir(i.tangentOS.xyz));

                o.BtangentWS.xyz=cross(o.normalWS.xyz,o.tangentWS.xyz)*i.tangentOS.w*unity_WorldTransformParams.w;

                float3 posWS=TransformObjectToWorld(i.positionOS.xyz);

                o.normalWS.w=posWS.x;

                o.tangentWS.w=posWS.y;

                o.BtangentWS.w=posWS.z;

                return o;

            }

            real4 FRAG(v2f i):SV_TARGET

            {                

                // 法线部分得到世界空间法线

                float4 nortex=SAMPLE_TEXTURE2D(_NormalMap,sampler_NormalMap,i.texcoord.xy);

                float3 norTS=UnpackNormalScale(nortex,_NormalScale);

                norTS.z=sqrt(1-saturate(dot(norTS.xy,norTS.xy)));

                float3x3 T2W={i.tangentWS.xyz,i.BtangentWS.xyz,i.normalWS.xyz};

                T2W=transpose(T2W);

                float3 N=NormalizeNormalPerPixel(mul(T2W,norTS));

                //return float4(N,1);

                // 计算一些可能会用到的杂七杂八的东西

                float3 positionWS=float3(i.normalWS.w,i.tangentWS.w,i.BtangentWS.w);

                real3 Albedo=SAMPLE_TEXTURE2D(_BaseMap,sampler_BaseMap,i.texcoord.xy).xyz*_BaseColor.xyz;

                float4 Mask=SAMPLE_TEXTURE2D(_MaskMap,sampler_MaskMap,i.texcoord.xy);

                float Metallic=Mask.r;

                float AO=Mask.g;

                float smoothness=Mask.a;

                float TEMProughness=1-smoothness;// 中间粗糙度

                float roughness=pow(TEMProughness,2);// 粗糙度

                float3 F0=lerp(0.04,Albedo,Metallic);

                Light mainLight=GetMainLight();

                float3 L=normalize(mainLight.direction);

                float3 V=SafeNormalize(_WorldSpaceCameraPos-positionWS);

                float3 H=normalize(V+L);

                float NdotV=max(saturate(dot(N,V)),0.000001);// 不取 0 避免除以 0 的计算错误

                float NdotL=max(saturate(dot(N,L)),0.000001);

                float HdotV=max(saturate(dot(H,V)),0.000001);

                float NdotH=max(saturate(dot(H,N)),0.000001);

                float LdotH=max(saturate(dot(H,L)),0.000001);

    // 直接光部分

                float D=D_Function(NdotH,roughness);

                //return D;

                float G=G_Function(NdotL,NdotV,roughness);

                //return G;

                float3 F=F_Function(LdotH,F0);

                //return float4(F,1);

                float3 BRDFSpeSection=D*G*F/(4*NdotL*NdotV);

                float3 DirectSpeColor=BRDFSpeSection*mainLight.color*NdotL*PI;

                //return float4(DirectSpeColor,1);

                // 高光部分完成 后面是漫反射

                float3 KS=F;

                float3 KD=(1-KS)*(1-Metallic);

                float3 DirectDiffColor=KD*Albedo*mainLight.color*NdotL;// 分母要除 PI 但是积分后乘 PI 就没写

                //return float4(DirectDiffColor,1);

                float3 DirectColor=DirectSpeColor+DirectDiffColor;

                //return float4(DirectColor,1);

    // 间接光部分

                float3 SHcolor=SH_IndirectionDiff(N)*AO;

                float3 IndirKS=IndirF_Function(NdotV,F0,roughness);

                float3 IndirKD=(1-IndirKS)*(1-Metallic);

                float3 IndirDiffColor=SHcolor*IndirKD*Albedo;

                //return float4(IndirDiffColor,1);

                // 漫反射部分完成 后面是高光

                float3 IndirSpeCubeColor=IndirSpeCube(N,V,roughness,AO);

                //return float4(IndirSpeCubeColor,1);

                float3 IndirSpeCubeFactor=IndirSpeFactor(roughness,smoothness,BRDFSpeSection,F0,NdotV);

                float3 IndirSpeColor=IndirSpeCubeColor*IndirSpeCubeFactor;

                //return float4(IndirSpeColor,1);

                float3 IndirColor=IndirSpeColor+IndirDiffColor;

                //return float4(IndirColor,1);

                // 间接光部分计算完成

                float3 Color=IndirColor+DirectColor;

                return float4(Color,1);

            }

            ENDHLSL

        }

    }

}