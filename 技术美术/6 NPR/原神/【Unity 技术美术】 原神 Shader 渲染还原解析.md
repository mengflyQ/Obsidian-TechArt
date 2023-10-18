## **声明**

**本文章内的资源及贴图均来自网络，如有侵权，立即删除！！仅作为学习交流使用，切勿商用！**

## **前言**

**复刻了原神 Shader 很久了。最近效果终于让我觉得满意了一些 ，今天来说一下个人理解下的解析**

![[57a8d20eb45a8ef4ecc00e237af02044_MD5.jpg]]

重新播放

## **Shader 分析**

**首先说一下 Shader 的分析 ，个人理解下 整个 shader 一共包含一下几个部分**

![[57d85b9f2fa11e92b4484a91460fd07f_MD5.jpg]]

如上图所示，个人理解下 原神的 shader 流程一共有这么多，这里先 Po 一下原神的几张贴图，然后我们接下来逐一分析

## 贴图分析

这里暂时不表述这些贴图的用途。后面会说到

![[b585c7d1478d36565b256e2ff4bc81d4_MD5.jpg]]

## 通用. 基础颜色

基础颜色这里算得上是比较核心的地方了。其原理主要是用 DiffuseColor * RampColor 来实现

### DiffuseColor

DiffuseColor 实际上就是上面的 Diffuse 贴图，这个没什么好说的 直接拿来用就好了

### RampColor

要用到的贴图有

![[d8035c51f55772085e7b20fcf93fa3ba_MD5.jpg]]

这里实际上是 DiffuseColor 核心的地方

引入一下我参考的文章 这里有说到 Ramp 的计算

[雪羽：原神角色渲染 Shader 分析还原](https://zhuanlan.zhihu.com/p/360229590)

这张贴图里有十条 Ramp，分为上下各五条 分别对应白天和晚上（据我理解，原神的角色和光照无关，全靠 Ramp 贴图来实现变化）

我们先来分析一下 RampRange 这张贴图在原神原本 MaterialMap 贴图的 Alpha 通道里，我们通过把他转成线性再吸色只会 可以区分到（实际上也是雪羽大佬提到的） 从灰度 1.0~0.0 之间的材质 ramp 区分如下

灰度 1.0 ： 皮肤质感 / 头发质感（头发的部分是没有皮肤的）

灰度 0.7： 丝绸 / 丝袜

灰度 0.5 ： 金属 / 金属投影

灰度 0.3 ： 软的物体

灰度 0.0 ：硬的物体

上述雪羽大佬提到的方法是采样十次这张贴图 然后根据不同灰度进行材质区分，但是实际上我有一个更好的方案（毕竟采样十次贴图这个开销我是无法接受的，虽然实时采样只有 5 次）

我们先来回忆一下，我们通常采样 ramp 的方法是: **tex2d(_RampMap,float2(HalfLambert,0.5));**

上述采样方式里 **0.5** 为我们自定义的值，其意思为我们要在 Ramp 贴图 Y 轴向的中心为采样点进行横向采样，实际上就是说我们要在一个 **0.0~1.0** 之内取值来表示我们要采样的横向坐标点，那么我们如果想要在一张贴图上采样 5 条 Ramp 也就是说我们的取值分别是 (**0.0**,**0.25**,**0.5**,**0.75**,**1.0**) 这样我们才能分别采样到 5 从下往上的五条 ramp 贴图

细心的同学可能已经发现了，我们需要的取值范围就刚好和上述 RampRange 贴图的值基本是相同的，那么就由此推断，实际上我们就可以利用这张贴图一次性采样 5 条 ramp ，这里可能不太理解同学要好好脑部一下

具体公式为 : **tex2d(_RampMap,HalfLambert,RampRangeMap);**

**OK 既然我们知道了如何采样，那么再看一下 他的 ramp 和我们平时用的 ramp 的区别**

![[8f6a6de48019b46848090794d1f85c16_MD5.jpg]]

这是我们一般使用的 Ramp 贴图 其明暗交界线居中 这是因为 HalfLmabert 的取值范围的从**背光处到向光处**的值为 0.0~1.0 所以通常使用这种方法的时候 明暗交界线的取值应该在 **0.5** 的位置，这样明暗交界线才处于垂直于灯光的法线上，，

说完了我们通常做法 再看看原神的 ramp 是什么样的

![[23cb57b5ccd376b311506204ad879295_MD5.png]]

我们发现了 他的明暗交界线全在右边，这样做的好处是可以最大化利用这个 ramp 的像素，而且可以做到超出最右边像素的部分会产生一个硬边，这样卡通感觉就出来了。 毕竟 受光面几乎是一个颜色，所以我们之前的方案实际上就出了问题。那么这样的 ramp 该怎么采样呢 其实很简单

我们只需要把 halfLambert 的值从 0.0~1.0 压缩到 0.0~0.5 -1.0 什么意思呢 就是 0.5 ~1.0 这里的值变成 1.0 只保留 0.0~0.5 这段渐变 写法如下

**halfLambert = smoothstep(0.0,0.5,halfLambert);**

这样 0.5 以上的值统一变成了 1.0 而且还保留了我们可以有渐变的部分，然后 1.0 这部分统一采样了 ramp 最右边的那个像素

然后我们还需要只采样上面 5 行作为白天 或者采样下面武行作为晚上 这样的话就需要修改我们 Y 轴的采样范围

**采样上半部分 ：tex2d(_RampMap,HalfLambert,RampRangeMap* 0.45 + 0.55);**

**采样下半部分 ：tex2d(_RampMap,HalfLambert,RampRangeMap* 0.45);**

这样就把 Y 轴的 0.0~1.0 分别映射到了 0.5~0.95 和 0.0~0.45 这里是为了采样的时候尽量处于 ramp 的中心 避免像素溢出

这样我们就完成了 ramp 的采样

**其实仔细想想 背光面和投影 实际上是同一个东西，都是光照不到的地方，所以我们直接引入阴影也是合情合理的**

**然后看上面的贴图，有个 Lightmap 贴图，实际上就是角色身上的固定阴影，所以他也是阴影的一部分，那么我们把可以把他们结合一下**

**我的做法是 首先把实时投影和固定阴影相乘 这样 所有的固定阴影都带有实时阴影了。方便后面调用这个整体的阴影，又因为上图原始 Lightmap 是个 0.0~0.5 的值 相乘之后还需要再 *2 把他映射到 0.0~1.0**

**parameter.b *= smoothstep(0.1,0.5,shadow) * 2;**

**我这里把实时阴影的 0.5 以上的值滤掉了 这样可以避免一些阴影误差 （我这里 lightmap 把他放到了 Parameter 的 B 通道里）**

**那么整体 RampColor 的采样过程如下**

```
float3 NPR_Base_Ramp (float NdotL,float Night,float4 parameter) {
        float halfLambert = smoothstep(0.0,0.5,NdotL) * parameter.b;
        
        /* 
        Skin = 1.0
        Silk = 0.7
        Metal = 0.5
        Soft = 0.3
        Hand = 0.0
        */
            if (Night > 0.0)
            {
                return SAMPLE_TEXTURE2D(_RampTex, sampler_RampTex, float2(halfLambert, parameter.a * 0.45 + 0.55)).rgb;//因为分层材质贴图是一个从0-1的一张图 所以可以直接把他当作采样UV的Y轴来使用 
                //又因为白天需要只采样Ramp贴图的上半段，所以把他 * 0.45 + 0.55来限定范围 (范围 0.55 - 1.0)
            }
            else
            {
                return SAMPLE_TEXTURE2D(_RampTex, sampler_RampTex, float2(halfLambert, parameter.a * 0.45)).rgb;//因为晚上需要只采样Ramp贴图的上半段，所以把他 * 0.45来限定范围(其中如果采样0.5的话 会被上面的像素所影响)
            }

    }
```

**然后我们再把 RampColor * Diffuse 就可以得到整个 Albedo 的颜色了**

**我是分界线 ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ 我是分界线**

## **通用. 高光**

**高光是由两部分组成的 分别是高光和金属 先看贴图**

![[8b06d4929427682d78f0df59d7627493_MD5.jpg]]

**这里主要使用这两张贴图 Glossiness 主要负责控制高光范围 Specular 主要负责控制高光形状，至于金属贴图我后面一点再讲**

### SpecularColor

关于高光 这里主要使用的是 SD 的 blinnPhong 的高光计算方法，大家有机会也可以去翻他的源码

```
float3 NPR_Base_Specular(float NdotL,float NdotH ,float3 normalDir,float3 baseColor,float4 parameter)//优化掉了金属贴图 {
        float Ks = 0.04;
        float  SpecularPow = exp2(0.5 * parameter.r * 11.0 + 2.0);//这里乘以0.5是为了扩大高光范围
        float  SpecularNorm = (SpecularPow+8.0) / 8.0;
        float3 SpecularColor = baseColor * parameter.g;
        float SpecularContrib = baseColor * (SpecularNorm * pow(NdotH, SpecularPow));

        //原神的金属贴图（这里我使用了一种拟合曲线来模拟）
        float MetalDir = normalize(mul(UNITY_MATRIX_V,normalDir));
        float MetalRadius = saturate(1 - MetalDir) * saturate(1 + MetalDir);
        float MetalFactor = saturate(step(0.5,MetalRadius)+0.25) * 0.5 * saturate(step(0.15,MetalRadius) + 0.25) * lerp(_MetalIntensity * 5,_MetalIntensity * 10,parameter.b);
        
        float3 MetalColor = MetalFactor * baseColor * step(0.95,parameter.r);
        return SpecularColor * (SpecularContrib  * NdotL* Ks * parameter.b + MetalColor);
    }
```

  
上述代码中 **parameter.g** 实际上就是 **Specular 贴图** 大家可以仔细分析一下这些代码

### MetalColor

**这里重点就是金属部分了，**

我理解中原神的方案是 **Glossiness 贴图** 中值为 1.0 的部分划分为金属 所以我这里做了如下处理

**parameter.r 为 Glossiness 贴图**  
float3 MetalColor = MetalFactor * baseColor * step(0.95,parameter.r);

这样我只会拿到金属部分的颜色

然后把金属部分的颜色和高光相加 得到最终的高光颜色

**原神原本金属部分的贴图是下面这样的，是一种应该使用了 matcap 的采样方式去采样的这张贴图**

**也就是上述代码的 MetalFactor 的值 把他乘以 diffuse 得到一个金属的颜色，**

**同理 上面高光也是乘以 diffuse 得到一个高光的颜色，因为不与环境做反应 不能使用_LightColor 作为高光颜色**

![[ba4158b113aa69c78497c3cd6df3a5a9_MD5.jpg]]

后来我转念一想，这张贴图如此简单为何不使用代码来代替 于是就有了上述代码

**float MetalDir = normalize(mul(UNITY_MATRIX_V,normalDir));**

**float MetalRadius = saturate(1 - MetalDir) * saturate(1 + MetalDir);**

**float MetalFactor = saturate(step(0.5,MetalRadius)+0.25) * 0.5 * saturate(step(0.15,MetalRadius) + 0.25)；**

**这部分是为了模拟这张贴图, 原理是我使用 matcap 采样时候的 uv 将他左右部分进行 step 然后就有了一个中间 1.0 两侧 0.0 的一些值，然后再去把他进行一些灰度处理，以最大化还原 MetalMap 的效果**

**后面的** * lerp(_MetalIntensity * 5,_MetalIntensity * 10,parameter.b); **是我为了增强高光反应做的一些妥协（本着参数越少越好的规则）**

**Ks 也是 SD 代码里的 具体算法是为什么 咱也不知道**

**我是分界线 ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ 我是分界线**

## **通用. 边缘光**

**边缘光咱就不细说了吧 原神本来的边缘光方案应该深度边缘光具体可以参考雪羽大佬 po 出来的那个链接 我这里也贴一下**

[Jason Ma：【JTRP】屏幕空间深度边缘光 Screen Space Depth Rimlight](https://zhuanlan.zhihu.com/p/139290492)

**我直接上菲尼尔边缘光的做法**

```
float3 NPR_Base_RimLight(float NdotV,float NdotL,float3 baseColor) {
        return (1 - smoothstep(_RimRadius,_RimRadius + 0.03,NdotV)) * _RimIntensity * (1 - (NdotL * 0.5 + 0.5 )) * baseColor;
    }
```

**我是分界线 ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ 我是分界线**

## 通用. 自发光

自发光也比较简单，具体就是**自发光 mask** 乘以 **Diffuse** 然后再给个强度

然后原神的角色自发光都有闪烁的效果 我这边就直接加上了

```
float3 NPR_Emission(float4 baseColor) {
        return baseColor.a * baseColor * _EmissionIntensity * abs((frac(_Time.y * 0.5) - 0.5) * 2);
    }
```

**我是分界线 ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ 我是分界线**

## **通用（最终合成）**

**凑齐了上面导图里的通用部分的条件，我们这里最终输出**

**实际上就是把上述条件全部相加就可以了 不过其中要注意一点，为了符合 blinnPhong 的守恒，越是金属的东西 diffuse 越暗，所以这里要特殊处理一下，具体看下面代码**

```
float3 NPR_Function_Base (float NdotL,float NdotH,float NdotV,float3 normalDir,float4 baseColor,float4 parameter,Light light,float Night)
    {
       

        float3 RampColor = NPR_Base_Ramp (NdotL,Night,parameter);
        float3 Albedo = baseColor * RampColor;
        float3 Specular = NPR_Base_Specular(NdotL,NdotH,normalDir,baseColor,parameter);
        float3 RimLight = NPR_Base_RimLight(NdotV,NdotL,baseColor) * parameter.b;
        float3 Emission = NPR_Emission(baseColor);
        float3 finalRGB = Albedo* (1 - step(0.95,parameter.r)) + Specular + RimLight + Emission;
        return finalRGB;
    }
```

**至此 我们就完成了身体部分的 shader 了**

**我是分界线 ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ 我是分界线**

## **头发. 高光**

**所以为什么要单独把头发部分拿出来呢**

**是因为头发的高光部分要进行单独处理**

**头发贴图包含了除头发以外，还有金属以及其他的 发带什么的 ，所以他其实总的来说还是要适用于上面通用部分的 shader，所以我们这边要单独给头发部分增加高光**

![[7ce4480e826c5cae63a46c0bcab52ba4_MD5.jpg]]

这张是头发的 **Glossiness 贴图 我实际上忘记了黑色部分是被我 PS 拉黑的还是原本就是黑的，就当他是黑的把**

**黑色部分其实都是头发，所以 我们可以直接把他单独抠出来做高光**

**float HariSpecRadius = 0.25;_// 这里可以控制头发的反射范围_**  
**float HariSpecDir = normalize(mul(UNITY_MATRIX_V,normalDir)) * 0.5 + 0.5;**  
**float3 HariSpecular = smoothstep(HariSpecRadius,HariSpecRadius + 0.1,1 - HariSpecDir) * smoothstep(HariSpecRadius,HariSpecRadius + 0.1,HariSpecDir) *NdotL;_// 利用屏幕空间法线_**

_**这是头发部分高光的整体算法**_

_我是使用了**屏幕空间法线** 然后把_**_左右两端进行了_smoothstep**_**处理**，使得左右两边为黑色，中间为白色 这样就可以单独增强中间部分来达到我们单独高光的目的_

_**那么有人肯定要问了，为啥不用 NdotH 来计算呢，，主要是因为 NdotH 在头上表现为一个圆圈，这样我如果俯视看头发，就会发现高光被剪切了，这显然不是我想要的，所以这里使用了一个别的办法，让高光始终正对着我们，以表现最好的视觉效果**_

_**所以头发部分就是，头发高光 + 通用. 高光 来达成最终的高光 所以最终代码如下**_

```
float3 NPR_Function_Hair (float NdotL,float NdotH,float NdotV,float3 normalDir,float3 viewDir,float3 baseColor,float4 parameter,Light light,float Night) {

        
        float3 RampColor = NPR_Base_Ramp (NdotL,Night,parameter);
        float3 Albedo = baseColor * RampColor;
        
        float HariSpecRadius = 0.25;//这里可以控制头发的反射范围
        float HariSpecDir = normalize(mul(UNITY_MATRIX_V,normalDir)) * 0.5 + 0.5;
        float3 HariSpecular = smoothstep(HariSpecRadius,HariSpecRadius + 0.1,1 - HariSpecDir) * smoothstep(HariSpecRadius,HariSpecRadius + 0.1,HariSpecDir) *NdotL;//利用屏幕空间法线 

        
        float3 Specular = NPR_Base_Specular(NdotL,NdotH,normalDir,baseColor,parameter) + HariSpecular * _HairSpecularIntensity * 10 * parameter.g * step(parameter.r,0.1);
        // float3 Metal =  NPR_Base_Metal(normalDir,parameter,baseColor);
        float3 RimLight = NPR_Base_RimLight(NdotV,NdotL,baseColor);
        float3 finalRGB = Albedo* (1 - parameter.r) + Specular  + RimLight;
        return finalRGB;
    }
```

**其实可以改一下代码 让控制头发范围的方式和上面金属贴图拟合曲线的方式一样，不过我在写这篇文章的时候还没有改，所以先这样**

## **脸部**

**脸部阴影的控制方法具体参考我另一篇帖子，后续我会在这里再详解一遍**

**下面这个链接的代码还是有一点点小问题，不过思路是没错的具体代码我会在这边贴出来**

[世界：Unity 着色器《原神》面部平滑阴影解决思路](https://zhuanlan.zhihu.com/p/402037562)

这里主要说一下 脸部和上述是一样的，因为是阴影，所以也是要使用它来采样 ramp 图，然后脸部我做了一些调整，我将使用脸部阴影贴图的 R 和 G 把 G 通道左右水平翻转，这样能解决灯光方向在左边的时候出现了脸部苹果肌位置的黑色不正确阴影

**具体代码如下**

```
float3 NPR_Function_face (float NdotL,float4 baseColor,float4 parameter,Light light,float Night) {
        

        float3 Up = float3(0.0,1.0,0.0);
        float3 Front = unity_ObjectToWorld._12_22_32;
        float3 Right = cross(Up,Front);
        float switchShadow  = dot(normalize(Right.xz), normalize(light.direction.xz)) < 0;
        float FaceShadow = lerp(1 - parameter.g,1 - parameter.r,switchShadow.r); //这里必须使用双通道来反转阴影贴图 因为需要让苹果肌那里为亮的
        float FaceShadowRange = dot(normalize(Front.xz), normalize(light.direction.xz));
        float lightAttenuation = 1 - smoothstep(FaceShadowRange - 0.05,FaceShadowRange + 0.05,FaceShadow);


        float3 rampColor = NPR_Base_Ramp(lightAttenuation * light.shadowAttenuation,Night,parameter);//这里的脸部参数贴图的Alpha必须是1
        return baseColor.rgb * rampColor ;
    }
```

这里要注意一点，因为我们的脸部必定是皮肤，所以他的 **RampRange 值 必定为 1.0**

**因为脸部是没有固定阴影的 其实我自己也画了一个， 所以这里额外使用了阴影乘了进去**

**OK 接下来我们就可以写个宏 再根据不同情况使用 Base、face、hari 这三个最终输出**

## **描边**

**描边我这边就不说了，就普通的双 pass 描边，我也没什么更好的东西，大家都一样**

## 工具

**这里再提一句 ramp 贴图的生成方式，我之前和知乎上的** **” 小天才 “ 共同开发了一个 ramp 生成工具 在他的知乎帖子里有源码**

[小天才：Unity 工具 - 离线制作 Ramp 图](https://zhuanlan.zhihu.com/p/433859091)

**然后面部 SDF 生成工具我也贴一下 橘子猫大佬的工具**

[橘子猫：如何快速生成混合卡通光照图](https://zhuanlan.zhihu.com/p/356185096)

## 视频效果预览

[技术美术 Demo - 原神角色渲染（优化重制版）_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Yr4y1k7kT#reply5786782800)

## **至此 就全部结束了，希望大家多多点赞评论支持 祝大家 天天周末！！！！！**