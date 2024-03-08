---
title: 02 Bloom
aliases: []
tags: []
create_time: 2023-07-22 17:36
uid: 202307221736
banner: "[[Pasted image 20230702141013.png]]"
---

# Bloom

Bloom 是一种屏幕后处理效果，使亮度较高的区域向周围扩散，产生柔和的光晕效果
## 实现原理

**思路：**
1. 根据一个设定阈值提取图像中较亮区域，把它们存储到一张 RT 中
2. 利用模糊算法对这张纹理进行模糊处理
3. 与原图混合/叠加
![[Pasted image 20221209110919.png]]

## Unity 实现
![[1 4.gif]]

**脚本部分思路：**
-   定义 shader 中的相关参数
-   高斯模糊迭代次数
-   高斯模糊范围（blurSpread）
-   下采样系数（downSample，downSample 控制渲染纹理大小）
-   阈值：`luminanceThreshold`

-   **shader 部分思路**
-   使用 4 个 pass 完成 bloom 效果，对应 bloom 的实现步骤
-   pass1：提取亮部区域
-   pass2：实现竖直方向的高斯模糊
-   pass3：实现水平方向的高斯模糊
-   pass4：模糊后的高亮区域的 RT 作为纹理属性传给 shader，叠加到原图


### 脚本
-   OnRenderImage 函数部分
-   OnRenderImage 是官方提供的函数，可以使用这个函数获取当前的屏幕图像（得到渲染纹理）
-   实现内容：
-   检查材质的可用性（valid）
-   将阈值传入材质
-   定义 rtW、rtH 变量，作为屏幕的实际宽度、高度
-   创建一块大小小于原屏幕分辨率的缓冲区 buffer0

-   将滤波模式改为双线性滤波

-   调用“Graphics. Blit”方法 pass1 提取图像中较亮的区域
-   用 for 循环对图像进行高斯模糊处理

-   shader 中传入高斯模糊范围
-   定义第二个缓冲区 buffer1
-   调用“Graphics. Blit”方法进行竖直方向的高斯模糊
-   调用“ReleaseTemporary”方法释放缓冲区 buffer0（为了让模糊后的结果存入 buffer1，再用 buffer1 覆盖 buffer0，重新分配 buffer1，这样一来每次模糊使用的都是上次模糊做完的结果）
-   用同样的思路完成水平方向的高斯模糊
-   迭代后的 buffer0 的结果就是我们需要的结果

-   将模糊后的 buffer0 作为纹理传入 shader
-   用“Graphics. Blit”方法调用最后一个 pass，将模糊后的图像和原图混合叠加，作为最终结果输出

```c fold
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DS_Bloom : PostEffectsBase
{
    //定义使用的shader和材质
    public Shader bloomShader;
    private Material bloomMaterial = null;

    public Material material
    {
        get
        {
            bloomMaterial = CheckShaderAndCreateMaterial(bloomShader,bloomMaterial); 
            //调用PostEffectsBase基类中的函数，检查shader并且创建材质
            return bloomMaterial;
        }
    }
    
    //定义shader中的参数
    [Range(0, 4)] public int iterations = 3;//高斯模糊迭代次数
    [Range(0.2f, 3.0f)] public float blurSpread = 0.6f;//高斯模糊范围
    [Range(1,8)] public int downSample = 2;//下采样，缩放系数
    [Range(0.0f, 4.0f)] public float luminanceThreshold = 0.6f;//阈值
    
    //调用OnRenderImage函数来实现Bloom
    private void OnRenderImage(RenderTexture src, RenderTexture dest)
    {
        if (material != null) 
        {
            material.SetFloat("_LuminanceThreshold", luminanceThreshold);//传入阈值
            
            //src.width和hight代表屏幕图像的宽度和高度
            int rtW = src.width / downSample;//得到渲染纹理的宽度
            int rtH = src.height / downSample;//得到渲染纹理的高度
            
            //创建一块分辨率小于原屏幕的缓冲区：buffer0
            RenderTexture buffer0 = RenderTexture.GetTemporary(rtW,rtH,0);
            buffer0.filterMode = FilterMode.Bilinear;//滤波模式为双线性
            
            //用Blit方法调用shader中的第一个pass，提取图像中较亮的区域
            Graphics.Blit(src, buffer0, material, 0);//结果存在buffer0
            
            //迭代进行高斯模糊
            for (int i = 0; i <iterations; i++)
            {
                material.SetFloat("_BlurSize", 1.0f + i * blurSpread);//传入模糊半径
                
                //定义第二个缓冲区：buffer1
                RenderTexture buffer1 = RenderTexture.GetTemporary(rtW, rtH, 0);
                
                //用Blit方法调用shader中的第二个pass，进行竖直方向的高斯模糊
                Graphics.Blit(buffer0, buffer1, material, 1);
                
                //释放缓冲区buffer0，将buffer1的赋值给buffer，并重新分配buffer1
                RenderTexture.ReleaseTemporary(buffer0);
                buffer0 = buffer1;
                buffer1 = RenderTexture.GetTemporary(rtW, rtH, 0);
                
                //用Blit方法调用shader中的第三个pass，进行水平方向的高斯模糊
                Graphics.Blit(buffer0, buffer1, material, 2);
                
                //原理同上次释放，故技重施
                RenderTexture.ReleaseTemporary(buffer0);
                buffer0 = buffer1;
                
                //迭代完成后，buffer0 的结果就是高斯模糊后的结果
            }
            
            // 将完成高斯模糊后的结果 buffer0 传递给材质中的_Bloom 纹理属性
            material.SetTexture("_Bloom", buffer0);
            
            //用Blit方法调用shader中的第四个pass，完成混合
            Graphics.Blit(src, dest, material, 3);//dest是最终输出
            
            //最后记得释放临时缓冲区
            RenderTexture.ReleaseTemporary(buffer0);
        }
        else
        {
            Graphics.Blit(src, dest);
        }
    }
}

```

### shader 

-   **整理一下其中需要注意的几点**
-   **亮度如何获取？**
    -   亮度计算公式
-   **较亮区域如何提取？**
    -   采样后获取亮度值，再减去阈值，最后用 clamp 截取
-   **如何对竖直/水平方向进行高斯模糊？**
    -   在顶点着色器中计算 uv
-   **在 vertex shader 中计算的好处：**
    -   计算量 (次数)少（一般情况下顶点数量<像素数量）
    -   在顶点着色器中计算纹理坐标可以减少运算提高性能
    -   而且由于顶点到片元的插值是线性的，因此不会影响纹理坐标的计算结果


# Bloom  Mask 
之前实现的 Bloom 是对全屏作用，我们想要对局部作用，就要进行遮罩。
方法：
①用 Alpha 通道
-   参考：[https://blog.csdn.net/SnoopyNa2Co3/article/details/88075047](https://blog.csdn.net/SnoopyNa2Co3/article/details/88075047)
②用 SRP 渲染一张 Mask 图
③用 Command-Buffer
④用模板测试
⑤ 直接用 Mask 图（简单情况下）
## Alpha 通道
**思路：利用 alpha 值Lerp插值来选取 bloom 的区域**

在原 shader 的基础上，增加这个 mask 函数，并修改 pass 3 即最终叠加图像的片元着色器：
```cs
//src为原图颜色 color为叠加后颜色        
//for bloom mask
fixed4 mask(fixed4 src,fixed4 color)
{
    return lerp(src,color,1.0-src.a);
}

fixed4 fragBloom(v2fBloom i) : SV_Target {
    //return tex2D(_Bloom, i.uv.zw);//for debug 仅输出处理后图像
    fixed4 orgin_img = tex2D(_MainTex, i.uv.xy); 
    fixed4 blur_img = tex2D(_Bloom, i.uv.zw);
    fixed4 result=orgin_img+blur_img;
    return mask(orgin_img,result);//原图与模糊图叠加
}
```
$lerp (a, b, w)$ 根据 $w$ 返回 $a$ 到 b 之间的插值，由此可见当 w=0 时返回a.当 w = 1时返回b.

即渲染纹理中，alpha=1 的部分将输出原图像，而 alpha=0 的部分将输出叠加后的 bloom 图像
## 模板测试
核心就是在渲染时，使用 depth buffer
- 通过深度图绘制 bloomRT
- 缺点: 深度带来的问题

## SRP RenderFeature
设置 Layer 渲染

# GodRay 效果
-   使用**径向模糊**代替高斯模糊，模拟光线往某个方向扩散的效果，实现很简单，将高斯 Bloom 中的模糊 pass 改成径向模糊即可。
![[Pasted image 20221209114329.png]]

