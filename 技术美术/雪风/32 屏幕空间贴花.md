![[9798068748243ca19f9d1c9558ce4f43_MD5.webp]]

本文将在 URP 管线下实现的屏幕空间贴花，URP 管线下的 VisualEffectGraph 粒子系统里提供了内置的 ForwardDecal，但是可惜本人的项目还是 webGL 端，使用 computeShader 不现实。而 URP 官方并未提供内置的 decal 组件，项目有一些需求就决定自己研究去实现了。  

![[e3d762828b6389807bc68aa7650d6982_MD5.webp]]

        本文算法并非本人原创，其算法原理是 colin 神的开源项目得来，（https://github.com/ColinLeung-NiloCat/UnityURPUnlitScreenSpaceDecalShader)

![[0d76676592ab7b11bf1b85b7e3e2cd2e_MD5.webp]]

         该算法的原理是通过相机到模型顶点发射多条射线。

然后每条射线的长度在乘一个屏幕深度图的系数，使得射线的终点最终是 “贴着” 场景的模型的表面分布，然后把射线的终点坐标作为新的坐标，然后去新的坐标为 decalSpace 取 xz2 个轴作为 U 方向和 V 方向，去采样贴图。

![[40a48c167069702e968d26c23ba399f7_MD5.webp]]

我们先在场景里创建一个 cube，这次是以 cube 为投射器进行的贴花制作。

**顶点着色器部分**，我们需要采样屏幕深度，故我们需要采样屏幕 uv，屏幕 uv 在之前的[文章](https://www.bilibili.com/read/cv6519977)已经讲了非常多遍，这里看代码即可，注意这里并未在顶点着色器里进行透除。

![[1b5172f98ca5323e6657b257395ba4f8_MD5.webp]]

然后，我们需要得到相机空间下的模型顶点坐标，直接使用 vp 矩阵把它转过来即可。取相机空间的顶点坐标的 z 值的负数，即为该顶点的线性深度（方便透除用）。然后我们把从相机位置 float3（0，0，0）到模型顶点位置的向量作为射线，把该射线转换到模型空间下。

![[302becfa4c5c3c3219f9df3702dfca58_MD5.webp]]

![[85de81da636d2f5834440cd2692e5e8e_MD5.webp]]

把射线从相机空间转换到模型空间下，使用了 V 的逆矩阵和 M 的逆矩阵进行计算，但是它是向量，所以得忽略掉平移矩阵，故 float4（posVS.xyz,0) 后面得取 0，而不是 1，然后把相机坐标从相机空间下转到模型空间下用于后续计算。

（额外话题）我们取到的模型空间下的射线，它是模型的顶点从模型坐标系转到相机坐标系下，然后忽略了平移矩阵后，又从相机坐标系转回模型坐标系。那有没有这种可能，只计算模型坐标系转到相机坐标系的平移矩阵，不用费力绕了一大圈又计算回来？我们可以自行推导该想法的正确性。

先说明下这里需要使用的矩阵。

![[89593d9d6b7481ac2d9d0f7e6fa33fda_MD5.webp]]

然后我们的射线 Ray 和模型顶点坐标 POS 的计算式如下

![[82ea6ddbb1d4bb995fd5ba2a9044bef8_MD5.webp]]

这里看似可以直接把对应的矩阵直接消掉

![[e7f60df99616295aa176add033e386fc_MD5.webp]]

不过真的可以吗？

而我们知道所有的缩放矩阵和平移矩阵都是可逆非正交阵，而所有的旋转矩阵是正交矩阵，对于可逆非正交阵来说是不支持矩阵的交换律！所以，该结果并不成立。

**片元着色器**，先采样屏幕深度。

![[6e836fd0d799c299a7686cab2ccbf30a_MD5.webp]]

然后我们将顶点着色器里计算好的射线进行透除，并计算出贴花空间的坐标。

![[f0a8188703a678473eb7a59f4cdad2de_MD5.webp]]

![[ba5d6dd684fa5d7bcbdab961c3a440da_MD5.webp]]

贴花空间的坐标 = 模型空间的相机坐标 + 模型空间的射线 * 屏幕深度。我们把它输出看看。

![[58f540638b23cb879701d24b514b4e9b_MD5.webp]]

它本质是和模型坐标系一致，不过它是沿着屏幕深度进行贴合，由于 cube 的边长是 1，轴心位置在 cube 中间，我们需要把轴心位置挪到边缘上，故我们需要增加 0.5，使得 x z 输出在（0，1）之间，输出 xz 两个轴看看，这就是我们需要的 uv。

![[a3c1eabb52aa6dc57a2ef9b4bc1baf22_MD5.webp]]

利用该 uv 进行贴图采样，设置一下混合模式，渲染队列我们需要把它丢到半透明队列里，还需要禁止合批，然后我们把颜色输出。发现除了片本身的地方，片外面还有额外的区域也被采样了，为了剔除额外的这部分，我们需要做一个 mask 去剔除。

GIF

![[693db89e06bbdc770ed0bf7375385ac5_MD5.webp]]

多余的部分没有剔除

由于 cube 的边长是 1，故我们只保留对轴心位置正负 0.5 米的范围即可，故去计算一个 mask。

![[4bd1d7724890f74ee9e8c80b84ef4999_MD5.webp]]

然后用 mask 去遮挡颜色，输出看看效果，看着 ok 了。

GIF

![[ef8e6c92307560643d98abf82b297656_MD5.webp]]

但是当我们移动 cube，它接触到墙角时，墙角边缘也会出现拉伸和变形，我们需要额外处理这种情况。

![[0ce2c22e14710e991967a12f0b2418f6_MD5.webp]]

边缘拉伸问题

观察垂直面的拉伸，垂直面的法线方向和水平片不一致，我们可以利用一阶偏导数去计算得到法线方向，但是 unityshader 的偏导数是在 shadermodle3.0 才支持的，这点要注意，下面是利用顶点坐标得到 X 和 Y 方向的偏导数，其值就是的副切线和切线方向，在利用右手定理，Y 叉乘 X 得到 Z，就是法线方向，标准化一下即可。

![[f5c8bcc31ba869af9b8ffc3da6d319b1_MD5.webp]]

为了测试下我们计算的法线是否正确，我们把它输出，如下图所示，能正常输出屏幕中图像的法线，不过由于是在片元着色器里对顶点计算出来的法线，并没有被线性插值，所以法线过渡都很硬。

GIF

![[393ed1772b4ffc1314577a623833caf7_MD5.webp]]

通过坐标去计算偏导数得到法线

在对 mask 进行处理，只有法线的 y 分量大于某个我们指定的值时，mask 才能为 1，否则为 0。

![[753938381d393a539ba33aeff927a538_MD5.webp]]

GIF

![[7560757c23be3ea6d0fc764355d7c442_MD5.webp]]

防止边缘拉伸

这时候就发现了当拉伸比较严重时，就会被直接裁掉，这个就是我们需要的效果。  

GIF

![[8371ed400060911d53131789268dcaf0_MD5.webp]]

最终效果就完成了，shader 还可以根据读者的需求进行修改，比如加 HDR 颜色控制来实现特效，设置要不要 a 通道去控制混合模式，要不要设置模板测试（比如玩家的身体你不希望被贴上贴花就可以自己设置模板通过条件让玩家身体上的模板测试失败），下面附上源码地址：https://wwa.lanzous.com/ihaL9fmhmde

**Shader 源码**

Shader "Unlit/Decal"

{

     Properties

    {

        _MainTex("MainTex",2D)="white"{}

        _BaseColor("BaseColor",Color)=(1,1,1,1)

        _EdgeStretchPrevent("EdgeStretchPrevent",Range(-1,1))=0

    }

    SubShader

    {

        Tags{

        "RenderPipeline"="UniversalRenderPipeline"

        "RenderType"="Overlay"

        "Queue"="Transparent-499"

        "DisableBatch"="True"

        }

        HLSLINCLUDE

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        CBUFFER_START(UnityPerMaterial)

        float4 _MainTex_ST;

        half4 _BaseColor;

        float _EdgeStretchPrevent;

        CBUFFER_END

        TEXTURE2D(_MainTex);

        SAMPLER(sampler_MainTex);

        TEXTURE2D(_CameraDepthTexture);

        SAMPLER(sampler_CameraDepthTexture);

         struct a2v

         {

             float4 positionOS:POSITION;

         };

         struct v2f

         {

             float4 positionCS:SV_POSITION;

             float4 SStexcoord:TEXCOORD;

             float3 cameraPosOS:TEXCOORD1;

             float4 cam2vertexRayOS:TEXCOORD2;

         };

        ENDHLSL

        pass

        {

            Blend SrcAlpha OneMinusSrcAlpha

        Tags{

        "LightMode"="UniversalForward"

        }

            HLSLPROGRAM

            #pragma vertex VERT

            #pragma fragment FRAG

            #pragma target 3.0

            v2f VERT(a2v i)

            {

                v2f o;

                o.positionCS=TransformObjectToHClip(i.positionOS.xyz);

                o.SStexcoord.xy=o.positionCS.xy*0.5+0.5*o.positionCS.w;

                #ifdef UNITY_UV_STARTS_AT_TOP

                o.SStexcoord.y=o.positionCS.w-o.SStexcoord.y;

                #endif

                o.SStexcoord.zw=o.positionCS.zw;

                float4 posVS=mul(UNITY_MATRIX_V,mul(UNITY_MATRIX_M,i.positionOS));// 得到相机空间顶点坐标

                o.cam2vertexRayOS.w=-posVS.z;// 相机空间下的 z 是线性深度，取负

                o.cam2vertexRayOS.xyz=mul(UNITY_MATRIX_I_M,mul(UNITY_MATRIX_I_V,float4(posVS.xyz,0))).xyz;// 忽略平移矩阵 当成向量处理

                o.cameraPosOS=mul(UNITY_MATRIX_I_M,mul(UNITY_MATRIX_I_V,float4(0,0,0,1))).xyz;// 计算模型空间下的相机坐标

                return o;

            }

            half4 FRAG(v2f i):SV_TARGET

            {

                float2 SSUV=i.SStexcoord.xy/i.SStexcoord.w;// 在片元里进行透除

                float SSdepth=LinearEyeDepth(SAMPLE_TEXTURE2D(_CameraDepthTexture,sampler_CameraDepthTexture,SSUV).x,_ZBufferParams);

                i.cam2vertexRayOS.xyz/=i.cam2vertexRayOS.w;// 在片元里进行透除

                float3 decalPos=i.cameraPosOS+i.cam2vertexRayOS.xyz*SSdepth;// 模型空间下的计算：相机坐标 + 相机朝着顶点的射线（已透除）* 相机空间的线性深度

                //return float4(decalPos,1);

                // 裁剪不需要的地方

                float mask=(abs(decalPos.x)<0.5?1:0)*(abs(decalPos.y)<0.5?1:0)*(abs(decalPos.z)<0.5?1:0);

                float3 decalNormal=normalize(cross(ddy(decalPos),ddx(decalPos)));

                //return float4(decalNormal,1);

                mask*=decalNormal.y>0.2*_EdgeStretchPrevent?1:0;// 边缘拉伸的防止阈值

                float2 YdecalUV=decalPos.xz+0.5;

                //return float4(YdecalUV,0,1);

                float4 tex=SAMPLE_TEXTURE2D(_MainTex,sampler_MainTex,YdecalUV)*mask;

                //tex.a=mask;

                return tex;

            }

            ENDHLSL

        }

    }

}