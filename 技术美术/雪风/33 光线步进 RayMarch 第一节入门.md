        光线步进 RayMarch，它是与光栅化完全不同的思路，是一种全新的图像绘制思路，它是从相机为起点发射多条射线，然后检测该射线是否与模型 “相交”，然后计算出” 交点 “，把所有的“交点” 收集起来，就能得出该模型的形状，在进一步就可以计算光照等信息。

![[54d9bfb51b2f6a61b1fc25bb46d3f871_MD5.webp]]

光线步进示意图

        **有向距离场 SDF**(SignedDistanceField)，他是描述的是当前点距离模型表面的距离，当该点在模型内部为负，在模型外部为正，在模型表面时为 0，这篇文章（http://blog.sina.com.cn/s/blog_760e11a901013g6y.html）有详细的介绍。本专栏将会实现最简单的球形 SDF，和一个甜甜圈 SDF。熟练使用 VisualEffectGraph 的读者应该也知道这个节点用来生成约束粒子的力。当然，我们也可以自己烘焙特定模型网格的 SDF，但它不在本篇讨论范围内。

![[1968178d61a1077e62b1cd23a1d8fb1c_MD5.webp]]

**利用偏导数求法线**，对于给定函数的某个点，它的 3 个的偏导数可以由下图公式求出。

![[fb7662b67fd25f9c4042ff32e2ab2d06_MD5.webp]]

在 unity 里面，给定一个 SDF 函数 f（x），则可以利用上公式求出该函数在 pos 点的三个偏导数，组合起来的向量就是该点的法线。由于 shader 里没有Δx，Δy，Δz，我们使用了一个较小的数值 0.01 去代替Δx，Δy，Δz 来进行计算得出近似偏导数值，这样得到近似法线。

![[e848883c8eb3a945892ed82d528dd4c9_MD5.webp]]

顶点着色器里很简单，正常计算顶点和传 uv。

片段着色器里，我们要构造一个发射射线的 “相机空间 “，一个放置球，计算光照的世界空间。

**第一步，构造发射射线的 "相机空间"。**

为了方便计算，我定义的这个” 相机空间 “是使用左手坐标系，这和 unity 自带的相机坐标系不一致，请读者注意！

![[d398d1b01f9e4486858f719bbcb212d1_MD5.webp]]

我使用屏幕 uv（也就是模型的 uv）把它从（0-1）重映射到（-1，1），作为 x 和 y 轴，同时考虑到屏幕的宽纵比进行矫正。深度方向 Z 我定义了长度为 2，这样就得到了一个边长为 2 的正方体，如下图所示。

![[12dc192b40fcd6c538ca07dd02cf17b1_MD5.webp]]

从该坐标系的原点（即相机坐标点）开始，向着深度为 2 的 uv 发射多条射线。这样我们就可以得到 “相机空间” 下的射线方向 rayVS，如下图代码所示。随后我们需要把这个射线转换到世界坐标系下进行计算。

![[111f2b5442984e340ea0bd6d2075d0b6_MD5.webp]]

**第二步，构造从 “相机空间” 到世界空间的旋转矩阵。**

![[88c3a00f467945d1d89e79c64bb01293_MD5.webp]]

随后我们构造一个矩阵把 "相机空间" 的射线转换到世界空间，和《入门精要》的广告牌技术很类似，矩阵变换相关的之前的专栏文章说了太多遍了，读者直接看下图的源码的注释吧。

![[4aafd61760ea38d597fb149fa59470f7_MD5.webp]]

这样，我们就计算出了世界空间的射线了。  

**第三步，写一个球形 SDF 函数。**

![[725eb5c6b4eec12f91fa22adf9e89311_MD5.webp]]

输入一个 float3 的坐标，返回一个该点距离球表面的距离，非常简单。

**第四步，定义获取法线的函数。**

![[10e0d506fd9c2c3a96a87bfaac9d2c28_MD5.webp]]

根据前文的偏导数公式直接计算得到法线，非常简单。

**第五步，步进求交点。**

![[7d2e100e523a5d899337d7023d0a7f92_MD5.webp]]

该算法的计算方式很取巧，沿着射线方向，初始位置为 p0，计算出 p0 距离球的表面距离为 dis1，然后初始位置沿着射线方向前进 dis1 的距离到达 p1 位置；再次计算 p1 位置距离球表面的距离为 dis2，然后 p1 位置沿着射线方向前进 dis2 的距离到达 p2 位置；再次计算 p2 位置距离球表面的距离为 dis2，然后 p2 位置沿着射线方向前进 dis2 的距离到达 p3 位置......

这样不停迭代，我们取的位置会越来越逼近球的表面，当某个时刻 dis 的值极小时，代码里我定义的 0.02，我们就近似认为当前位置就是球的表面位置。当然还有一种情况就是射线本身就不和球相交，无论多少遍都找不到一个点，它到球表面的距离小于 0.02，所以我们要设置最大步进距离，代码如下。

![[7623d0e85712307824215505a69cc789_MD5.webp]]

经过上面的循环后，我们得到的结果要么是取到了球表面的坐标，要么没找到点，设置个条件去判断，我们只对找到了球表面的坐标进行计算，我们先计算一下它的法线，然后把它输出到屏幕看看。

![[17f51d2314b8edc0194f3a0e681108fb_MD5.webp]]

![[52b971426aa7bb8529dbb994fc804b81_MD5.webp]]

球的法线就被我们绘制出来了，看起来效果还不错。我们在进行半兰伯特光照计算呢？这里我们直接获取场景里的光照（当然你也可以自定义一个光照方向）。

![[0f7e49c71c9fd7a8eb46c4199027a757_MD5.webp]]

GIF

![[1b5b4252c6f82873ee8ea0c3e3c20a1d_MD5.webp]]

这样，一个简单的 RayMarch 效果就完成了。

我们把球形的 SDF 换成一个其他的 SDF 会如何呢？我们把上面的球 SDF 换成一个甜甜圈进行计算，下面是甜甜圈的 SDF。为了方便切换不同的 SDF，我定义了个中间函数 getSDFdis（）。

![[2ed74b1acf7898ebe042403ac2d96134_MD5.webp]]

我们分别输出甜甜圈的法线和半兰伯特光照看看。

GIF

![[fe5d39d2f59d4ad6d5b57a41e4b8bafd_MD5.webp]]

![[b184827417d0117206a3015a86283dfd_MD5.webp]]

法线

我们还可以混合一下球形 SDF 和甜甜圈 SDF，随着时间变换进行 lerp 会发生什么？

![[2346a630690e882bd765e902a5f5a177_MD5.webp]]

GIF

![[39998d982766b3174ef925182046192b_MD5.webp]]

法线

GIF

![[263793db4ce0395756eb126bb1e90a75_MD5.webp]]

半兰伯特

看着有点像在搞颜色了，我还做了一个菱形体和甜甜圈混合的效果，感觉怪有意思的 2333

GIF

![[bc8c5486c5024394cb32f508b1d5e495_MD5.webp]]

这里有一篇文章里有很多 sdf 的公式，有兴趣可以看看。（https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm）  

在写个 rendererfeature 去全屏绘制即可。

工程源码如下：

https://wwa.lanzous.com/iSY2Afp06sj

卡渲交流群：950138189，欢迎喜欢研究卡通渲染的大佬入驻~

Shader "WX/URP/RayMarchDrawSphere"

{

    Properties

    {

        //_MainTex("MainTex",2D)="white"{}

        //_BaseColor("BaseColor",Color)=(1,1,1,1)

    }

    SubShader

    {

        Tags{

        "RenderPipeline"="UniversalRenderPipeline"

        }

        HLSLINCLUDE

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

         struct a2v

         {

             float4 positionOS:POSITION;

             float2 texcoord:TEXCOORD;

         };

         struct v2f

         {

             float4 positionCS:SV_POSITION;

             float2 texcoord:TEXCOORD;

         };

         // 球形 SDF

         float sdfPhere(in float3 pos)

         {

          return length(pos)-1;

         }

         // 甜甜圈托马斯环 SDF

         float sdfTorus(in float3 p)

        {

            float2 t=float2(1,0.4);// 定义内径外径

            //t.x*=abs(sin(_Time.y));

            //t.y*=abs(cos(_Time.y) );

         float2 q = float2(length(p.xz)-t.x,p.y);

         return length(q)-t.y;

         }

         // 菱形体 SDF

         float sdfOctahedron(in float3 p)

         {

          p = abs(p);

          return (p.x+p.y+p.z-2)*0.57735027;

          }

         float getSDFdis(float3 pos)

         {

          //return sdfPhere(pos); 计算球形 sdf

          //return sdfTorus(pos);// 计算托马斯 sdf

          //return lerp(sdfTorus(pos),sdfPhere(pos),abs(sin(_Time.y)));// 混合 2 个 sdf

          return lerp(sdfTorus(pos),sdfOctahedron(pos),abs(sin(_Time.y)));// 混合菱形和甜甜圈

         }

         float3 getNormal(in float3 pos)

         {

          // 计算三个方向的偏导数

          float dx=(getSDFdis(pos+float3(0.01,0,0))-getSDFdis(pos))/0.01;

          float dy=(getSDFdis(pos+float3(0,0.01,0))-getSDFdis(pos))/0.01;

          float dz=(getSDFdis(pos+float3(0,0,0.01))-getSDFdis(pos))/0.01;

          return normalize(float3(dx,dy,dz));

         }

         float3 draw(in float3 camPos,float3 ray)

         {

          float distanceTotal=0;

          float3 marchPos=0;

          for(int i=0;i<64;i++)

          {

          marchPos=camPos+ray*distanceTotal;// 当前射线步进的位置

          float dis=getSDFdis(marchPos);// 该位置距离球表面的距离

          if(distanceTotal>20||dis<0.02)break;// 如果步进的总距离超过 20 说明没找到球表面退出循环

          // 或者步进点到球表面距离小于 0.02，说明找到球表面了，退出循环

          distanceTotal+=dis;// 每次步进就增加一个 dis 的距离

          }

          // 循环结束输出的 distanceTotal 要么是找到了球表面，要么是超过最大距离也没找到

            float3 color=0;

            if(distanceTotal<10)

            {

            float3 normal=getNormal(marchPos);

            //color=normal;

            float3 LightDir=normalize(GetMainLight().direction);

            color=dot(normal,LightDir)*0.5+0.5;

            }

          return color;

         }

        ENDHLSL

        pass

        {

            ZWrite Off ZTest Always  

        Tags{

         "LightMode"="UniversalForward"

         "RenderType"="Overlay"

            }

            HLSLPROGRAM

            #pragma vertex VERT

            #pragma fragment FRAG

            v2f VERT(a2v i)

            {

                v2f o;

                o.positionCS=TransformObjectToHClip(i.positionOS.xyz);

                o.texcoord=i.texcoord;

                return o;

            }

            half4 FRAG(v2f i):SV_TARGET

            {

                float aspect=_ScreenParams.y/_ScreenParams.x;// 屏幕宽纵比

                float2 uv=i.texcoord*2-1;

                uv.y*=aspect;

                float3 rayVS=normalize(float3(uv,2));

                float3 camPosWS=_WorldSpaceCameraPos;

                // 计算 “相机空间” 的三个轴的朝向

                float3 VScoordZ=-normalize(camPosWS);// 相机空间 Z 轴

                float3 VScoordX=cross(float3(0,1,0),VScoordZ);// 左手定理判断叉乘方向；世界空间和我们构建的 “相机空间” 是左手坐标系

                float3 VScoordY=cross(VScoordZ,VScoordX);// 左手定理判断叉乘方向

                float3x3 VS2WSmatrix={VScoordX,VScoordY,VScoordZ};

                VS2WSmatrix=transpose(VS2WSmatrix);// 转换成列向量

                float3 rayWS=mul(VS2WSmatrix,rayVS);// 计算出世界空间的射线方向

                float3 color=draw(camPosWS,rayWS);

                return float4(color,1);

            }

            ENDHLSL

        }

    }

}