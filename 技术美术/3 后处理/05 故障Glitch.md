---
title: 故障Glitch
aliases: 
tags: 
create_time: 2023-07-22 17:41
uid: 202307221741
banner: "[[1ccf2fbd50ec1b0bff73725e95e3ba02_MD5.gif]]"
---

故障艺术（Glitch Art），作为赛博朋克（Cyberpunk）艺术风格的核心元素之一，是一种是将数字设备的软硬件故障引起的破碎变形图像，经过艺术加工而成的一种先锋视觉艺术表现形式。近年来，故障艺术已经成为了赛博朋克风格的电影和游戏作品中主要的艺术风格之一。

# 1 RGB 颜色分离故障（RGB Split Glitch）

RGB 颜色分离故障（RGB Split Glitch），也称颜色偏移故障（Color Shift Glitch），是故障艺术中比较常见的表达形式之一。

**实现思路：
1. RGB 三通道采用不同的 uv 偏移值进行分别采样。
2. 一般而言，会在 RGB 三个颜色通道中，选取一**个通道采用原始 uv 值，另外两个通道进行 uv 抖动后再进行采样**。

一个经过性能优化的实现版本 Shader 代码如下：
```c
float randomNoise(float x, float y)
{
    return frac(sin(dot(float2(x, y), float2(12.9898, 78.233))) * 43758.5453);
}
        
float4 frag(Varyings i) : SV_Target
{
    float splitIntensity = randomNoise(_TimeX,2)* _SplitIntensity;
    float4 colorR = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x+splitIntensity,i.uv.y));
    float4 colorG = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x,i.uv.y));
    float4 colorB = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x-splitIntensity,i.uv.y));
    
    return float4(colorR.r,colorG.g,colorB.b,1);
}
```

上述代码中的 randomNoise 函数在之前的文章[《高品质后处理：十种图像模糊算法的总结与实现》](https://zhuanlan.zhihu.com/p/125744132)的粒状模糊（Grainy Blur）中有提到一个简化版的实现。本文在则采用了基于 frac 方法（返回输入数值的小数部分）和三角函数，配合 dot 方法的封装实现。

上述代码，得到的渲染表现如下：

![[1906c75509099ec4095ccb777851dbd0_MD5.gif]]


另外，可以基于三角函数和 pow 方法控制抖动的间隔、幅度，以及抖动的曲线：

```c
float4 frag(Varyings i) : SV_Target
{
    //基于三角函数和pow方法控制抖动
    float splitIntensity = (1.0 + sin(_Time.y * 6.0)) * 0.5;
     splitIntensity *= 1.0 + sin(_Time.y * 16.0) * 0.5;
     splitIntensity *= 1.0 + sin(_Time.y * 19.0) * 0.5;
     splitIntensity *= 1.0 + sin(_Time.y * 27.0) * 0.5;
     splitIntensity = pow(splitIntensity, _Amplitude);
    splitIntensity*= (0.05*_SplitIntensity);

    float3 finalColor;
    finalColor.r = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x+splitIntensity,i.uv.y)).r;
    finalColor.g = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x,i.uv.y)).g;
    finalColor.b = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_BlitTexture, float2(i.uv.x-splitIntensity,i.uv.y)).b;
    finalColor *= (1.0 - splitIntensity * 0.5);
    
    return float4(finalColor.rgb,1);
}
```

得到的渲染表现如下：

![[a47d6a5237f86cf7eab650ac1d4ff90c_MD5.webp]]

另外，在 XPL（X-PostProcessing-Library）中供实现了 5 种不同版本的 Glitch RGB Split 后处理特效，以满足不同情形下 RGB 颜色抖动风格的需要。除了上文提到了两种，剩余三种的更多细节，篇幅原因这里就不展开了。以下整理了一个汇总列表，若有需要，可以直接转到 XPL 查看具体渲染表现以及源码:

*   **GlitchRGBSplitV1 :** [https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplit](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplit)  
    
*   **GlitchRGBSplitV2 :** [https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV2](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV2)  
    
*   **GlitchRGBSplitV3 :** [https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV3](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV3)  
    
*   **GlitchRGBSplitV4 :** [https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV4](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV4)  
    
*   **GlitchRGBSplitV5 :** [https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV5](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchRGBSplitV5)  
    

其中 GlitchRGBSplitV1 和 GlitchRGBSplitV3 具有相对而言较丰富可调参数：

![[70d6f4a7a66007deea412e12609642d3_MD5.png]]

![[f4840e9640589bbcbbd3c3c385e81157_MD5.png]]

以下是其中的一些效果图：

![[36796e5589263cc42812d421011dc2c6_MD5.gif]]

![[19719f9292fad59a1193be71cb118e90_MD5.webp]]

# 2 错位图块故障（Image Block Glitch）

**核心要点：生成随机强度且横纵交错的图块，随后基于图块的强度，进行 uv 的抖动采样，并可以加上 RGB Split 等元素提升渲染表现。**

![[954f6fca25cd56786ffbf45af22b1a97_MD5.png]]

## 2.1 基础版本的错位图块故障（Image Block Glitch）

**第一步，基于 uv 和噪声函数生成方格块**。
可以使用 floor 方法（对输入参数向下取整）以及低成本的噪声生成函数 randomNoise 进行实现，代码仅需一句：

```c
half2 block = randomNoise(floor(i.texcoord * _BlockSize));
```

基于这句代码可以生成随机强度的均匀 Block 图块：

![[3dd6454386d54e915634b801feecd602_MD5.gif]]

**第二步，基于第一步得到的均匀 Block 图块强度值做强度的二次筛选，增加随机性**，代码如下：

```
half displaceNoise = pow(block.x, 8.0) * pow(block.x, 3.0);
```

得到的图块强度值如下：

![[4e011097d288b0981c686ac13edecfaf_MD5.gif]]

**第三步，将经过强度二次筛选的 Block 图块强度值，作为噪声强度的系数，分别对 G 和 B 颜色通道进行采样**。实现如下：

```
half ColorR = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord).r;
half ColorG = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord + float2(displaceNoise * 0.05 * randomNoise(7.0), 0.0)).g;
half ColorB = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord - float2(displaceNoise * 0.05 * randomNoise(13.0), 0.0)).b;

return half4(ColorR, ColorG, ColorB, 1.0);
```

可以得到如下基础的错位图块故障（Image Block Glitch）的渲染表现：

![[82cc960375e7cc06da5b80035a402138_MD5.gif]]

## 2.2 结合 RGB Split 的错位图块故障（Image Block Glitch）

另外，也可以加上 RGB Split 的元素，得到更丰富的渲染表现，实现代码如下：

```c
inline float randomNoise(float2 seed)
{
    return frac(sin(dot(seed * floor(_Time.y * _Speed), float2(17.13, 3.71))) * 43758.5453123);
}

inline float randomNoise(float seed)
{
    return randomNoise(float2(seed, 1.0));
}

half4 Frag(VaryingsDefault i) : SV_Target
{
    half2 block = randomNoise(floor(i.texcoord * _BlockSize));

    float displaceNoise = pow(block.x, 8.0) * pow(block.x, 3.0);
    float splitRGBNoise = pow(randomNoise(7.2341), 17.0);
    float offsetX = displaceNoise - splitRGBNoise * _MaxRGBSplitX;
    float offsetY = displaceNoise - splitRGBNoise * _MaxRGBSplitY;

    float noiseX = 0.05 * randomNoise(13.0);
    float noiseY = 0.05 * randomNoise(7.0);
    float2 offset = float2(offsetX * noiseX, offsetY* noiseY);

    half4 colorR = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord);
    half4 colorG = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord + offset);
    half4 colorB = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord - offset);

    return half4(colorR.r , colorG.g, colorB.z, (colorR.a + colorG.a + colorB.a));
}
```

对应的渲染表现如下：

![[b7c4d08e6eaa11feb414a73365d6906d_MD5.gif]]

实现的完整源代码可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV4)

## 2.3 进阶版的错位图块故障（Image Block Glitch）

**进阶版的 Image Block Glitch，核心要点在于双层 blockLayer 的生成，以及配合噪声生成函数 randomNoise 进行双层强度的二次筛选**，对应的实现代码如下：

```
float2 blockLayer1 = floor(uv * float2(_BlockLayer1_U, _BlockLayer1_V));
float2 blockLayer2 = floor(uv * float2(_BlockLayer2_U, _BlockLayer2_V));

float lineNoise1 = pow(randomNoise(blockLayer1), _BlockLayer1_Indensity);
float lineNoise2 = pow(randomNoise(blockLayer2), _BlockLayer2_Indensity);
float RGBSplitNoise = pow(randomNoise(5.1379), 7.1) * _RGBSplit_Indensity;
float lineNoise = lineNoise1 * lineNoise2 * _Offset  - RGBSplitNoise;
```

上述代码可以得到更加丰富的 Block 图块强度：

![[bbf73a52b2e2627f1ec7383f718dbb56_MD5.gif]]

最后，基于此 Block 强度进行 RGB 通道的分别采样，可以得到更加多样的错位图块故障（Image Block Glitch）渲染表现：

![[eb4e64bd3b56a883324096f52c48f6c6_MD5.gif]]

上述完整的实现代码可见：

[X-PostProcessing/GlitchImageBlock](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlock)

此版本的 Image Block Glitch 参数也较为丰富，可以根据需要，调出各种风格的 Image Block 渲染表现：

![[600e4e5f23954a67b913c978a5923f9c_MD5.png]]

同样，在 XPL（X-PostProcessing-Library）中分别实现了 4 种不同版本的 Glitch Image Block 后处理特效，以满足不同情形下的需要。部分算法的源码实现链接上文中已经有贴出一部分，这里是一个汇总列表:

*   **Glitch Image Block V1**：[https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlock](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlock)  
    
*   **Glitch Image Block V2**：[https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV2](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV2)  
    
*   **Glitch Image Block V3**：[https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV3](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV3)  
    
*   **Glitch Image Block V4**：[https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV4](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchImageBlockV4)  
    

# 三、错位线条故障（Line Block Glitch）

错位线条故障（Line Block Glitch）具有较强的表现力，在 Glitch 系列特效中的出镜率也较高。

![[33f3d1f07de647fdf54edd7cbfec03cc_MD5.jpg]]

![[c4da48f7d229f5e0da72fb6b0a7b3b1f_MD5.gif]]

该算法的实现思路在于随机宽度线条的生成。我们一步一步来，先从生成均匀宽度线条开始：

```
float trunc(float x, float num_levels) {
    return floor(x * num_levels) / num_levels;
}

//生成随机强度梯度线条
float truncTime = trunc(_TimeX, 4.0);       
float uv_trunc = randomNoise(trunc(uv.yy, float2(8, 8)) + 100.0 * truncTime);
```

基于 trunc 函数以及 randomNoise 函数，配合上述调用代码，即可得到如下均匀宽度线条：

![[745f354e05c90734db777ea4f2b60b0b_MD5.webp]]

接着，使用如下代码，将均匀渐变线条转为随机梯度的等宽线条：

```
float uv_randomTrunc = 6.0 * trunc(_TimeX, 24.0 * uv_trunc);
```

![[38ca4492d69a970d3a85f95a63cf2184_MD5.gif]]

然后，将随机梯度的等宽线条，经过多次 randomNoise 操作，转换为随机梯度的非等宽线条：

```
//生成随机梯度的非等宽线条
float blockLine_random = 0.5 * randomNoise(trunc(uv.yy + uv_randomTrunc, float2(8 * _LinesWidth, 8 * _LinesWidth)));
blockLine_random += 0.5 * randomNoise(trunc(uv.yy + uv_randomTrunc, float2(7, 7)));
blockLine_random = blockLine_random * 2.0 - 1.0;    
blockLine_random = sign(blockLine_random) * saturate((abs(blockLine_random) - _Amount) / (0.4));
blockLine_random = lerp(0, blockLine_random, _Offset);
```

可以得到如下的渲染表现：

![[1d5933318bd765449a78074d631efbdb_MD5.gif]]

接着，通过随机梯度的非等宽线条，去抖动 uv 采样生成源色调的 blockLine Glitch：

```
// 生成源色调的blockLine Glitch
float2 uv_blockLine = uv;
uv_blockLine = saturate(uv_blockLine + float2(0.1 * blockLine_random, 0));
float4 blockLineColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, abs(uv_blockLine));
```

对应的渲染表现如下：

![[6d707d5c912fdc90b49823b42f69a352_MD5.gif]]

最终，将 RGB 颜色转换到 YUV 空间，进行色度（Chrominance）和浓度（Chroma）的偏移，得到最终的渲染表现：

```
// 将RGB转到YUV空间，并做色调偏移
// RGB -> YUV
float3 blockLineColor_yuv = rgb2yuv(blockLineColor.rgb);
// adjust Chrominance | 色度
blockLineColor_yuv.y /= 1.0 - 3.0 * abs(blockLine_random) * saturate(0.5 - blockLine_random);
// adjust Chroma | 浓度
blockLineColor_yuv.z += 0.125 * blockLine_random * saturate(blockLine_random - 0.5);
float3 blockLineColor_rgb = yuv2rgb(blockLineColor_yuv);

// 与源场景图进行混合
float4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.texcoord);
return lerp(sceneColor, float4(blockLineColor_rgb, blockLineColor.a), _Alpha);
```

最终的渲染表现如下：

![[c4da48f7d229f5e0da72fb6b0a7b3b1f_MD5.gif]]

除了水平方向的 Line Block，竖直方向的表现也独具特色:

![[3a2eb6501d892167432f112e5765d8af_MD5.gif]]

当然，也可以将上述渲染效果与原始场景图进行插值混合，得到不同强度的渲染表现。

XPL 中实现的错位线条故障（Line Block Glitch）后处理，有 7 个可供定制调节的参数：

![[479422cc2ae0bbaaca54c2c564dbd45a_MD5.png]]

错位线条故障（Line Block Glitch）的完整的源代码实现可见：

[X-PostProcessing/GlitchLineBlock](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchLineBlock)

# 四、图块抖动故障（Tile Jitter Glitch）

图块抖动故障 (Tile Jitter Glitch) 模拟了屏幕信号的块状抖动故障。

![[8e80db9cd6c2eb790d6783401d574c9e_MD5.gif]]

其核心算法思路在于基于 uv 的分层抖动。可以采用取余数的形式（fmod(x,y) 方法可返回 x/y 的余数）来对 uv 进行分层，且对于层内的 uv 数值，进行三角函数形式的抖动。

核心实现 Shader 代码如下：

```
#if USING_FREQUENCY_INFINITE
        strength = 1;
    #else
        strength = 0.5 + 0.5 * cos(_Time.y * _Frequency);
    #endif
    if(fmod(uv.y * _SplittingNumber, 2) < 1.0)
    {
        #if JITTER_DIRECTION_HORIZONTAL
            uv.x += pixelSizeX * cos(_Time.y * _JitterSpeed) * _JitterAmount * strength;
        #else
            uv.y += pixelSizeX * cos(_Time.y * _JitterSpeed) * _JitterAmount * strength;
        #endif
    }
```

上述代码经过计算后，得到的 uv 强度值如下：

![[34e233886ef29834c8075e4edaef860d_MD5.gif]]

得到上述分块抖动的 uv 后，便可以作为 uv 输入，对最终的场景图进行采样：

```
half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, uv);
```

![[dad44f1ebbf6d8629a9da347a3fea980_MD5.webp]]

上图为左右抖动的表现，这边也有上下抖动的表现，以及左右分层 + 上下抖动，左右分层 + 左右抖动的各种不同表现：

![[05afb087fddd13f0257235b5ac653c75_MD5.gif]]

![[d5f2432b2fe78992b7471ec2f012e4cd_MD5.gif]]

![[993dae159b51a7a90954372d33146099_MD5.gif]]

图块抖动故障 (Glitch Tile Jitter) 后处理特效可调的参数同样也比较丰富，XPL 内实现的此特效的可调参数面板如下：

![[9cfbabfda8d6372f89861999abfcd8ac_MD5.png]]

图块抖动故障 (Glitch Tile Jitter) 完整的实现源代码可见：

[X-PostProcessing/GlitchTileJitter](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchTileJitter)

# 五、扫描线抖动故障（Scan Line Jitter Glitch）

扫描线抖动故障（Scan Line Jitter Glitch）算法较简单，但是得到的渲染表现却非常具有冲击力：

![[1d11a164bc81bbd71e8d8f2934dd76ba_MD5.gif]]

一个比较直接的实现是直接对横向或者纵向 UV 进行基于 noise 的抖动，Shader 实现代码如下：

```
float randomNoise(float x, float y)
{
    return frac(sin(dot(float2(x, y), float2(12.9898, 78.233))) * 43758.5453);
}

half4 Frag_Horizontal(VaryingsDefault i): SV_Target
{

    float jitter = randomNoise(i.texcoord.y, _Time.x) * 2 - 1;
    jitter *= step(_ScanLineJitter.y, abs(jitter)) * _ScanLineJitter.x;

    half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, frac(i.texcoord + float2(jitter, 0)));

    return sceneColor;
}
```

得到的渲染表现如下：

![[d6ddbb95bea30283d6e732608b63f3a4_MD5.gif]]

也可以从竖直方向进行 uv 的抖动：

![[65e914ce3054ea79e91e997b9d68c811_MD5.gif]]

扫描线抖动故障（Scan Line Jitter Glitch）完整的实现源代码可见:

[X-PostProcessing/GlitchScanLineJitter](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchScanLineJitter)

# 六、数字条纹故障（Digital Stripe Glitch）

数字条纹故障（Digital Stripe Glitch）同样是出镜率较高的 Glitch 系后处理特效之一。例如在《赛博朋克 2077》的 gameplay 中，就可以到它的身影：

![[c42515bf2b3a70431c20dde973b0c306_MD5.jpg]]

图 《赛博朋克 2077》中的数字条纹故障（Digital Stripe Glitch）特效 @ CD Projekt

数字条纹故障（Digital Stripe Glitch）需在 Runtime 层完成 noise Texture 的生成，然后传入 GPU 中进行最终的运算和渲染呈现。

Runtime 的核心思路为基于随机数进行随机颜色条纹贴图的生成，实现代码如下：

```
for (int y = 0; y < _noiseTexture.height; y++)
{
    for (int x = 0; x < _noiseTexture.width; x++)
    {
        //随机值若大于给定strip随机阈值，重新随机颜色
        if (UnityEngine.Random.value > stripLength)
        {
            color = XPostProcessingUtility.RandomColor();
        }
        //设置贴图像素值
        _noiseTexture.SetPixel(x, y, color);
    }
}
```

生成的图片如下：

![[853bdd08b64f02c1d148a9a914a3a06d_MD5.png]]

Shader 层面的实现则分为两个主要部分，分别是 uv 偏移，以及可选的基于废弃帧的插值不足：

```
half4 Frag(VaryingsDefault i): SV_Target
{
    // 基础数据准备
     half4 stripNoise = SAMPLE_TEXTURE2D(_NoiseTex, sampler_NoiseTex, i.texcoord);
     half threshold = 1.001 - _Indensity * 1.001;

    // uv偏移
    half uvShift = step(threshold, pow(abs(stripNoise.x), 3));
    float2 uv = frac(i.texcoord + stripNoise.yz * uvShift);
    half4 source = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, uv);
 #ifndef NEED_TRASH_FRAME
        return source;
 #endif

    // 基于废弃帧插值
    half stripIndensity = step(threshold, pow(abs(stripNoise.w), 3)) * _StripColorAdjustIndensity;
    half3 color = lerp(source, _StripColorAdjustColor, stripIndensity).rgb;
    return float4(color, source.a);
}
```

得到的不进行废弃帧插值的渲染表现如下：

![[49d153e2ec84b931cedeced70a5575b0_MD5.gif]]

进行废弃帧插值的渲染表现如下。除了下图中采用的类似反色的偏移颜色，也可以实现出基于 RGB 颜色随机，或者进行颜色空间转换后的色度校正后的偏移颜色：

![[b5411a7a84de99a1c407e1acab181b00_MD5.gif]]

数字条纹故障（Digital Stripe Glitch）后处理完整的实现源码可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchDigitalStripe)

# 七、模拟噪点故障（Analog Noise Glitch）

![[8ed3ebfbdfe1cc98cff9d38b7ee7a3e9_MD5.webp]]

模拟噪点故障（Analog Noise Glitch）的主要思路，在于用 noise 去扰动原先场景图的颜色值。一种常规实现的核心代码如下：

```
float noiseX = randomNoise(_TimeX * _Speed + i.texcoord / float2(-213, 5.53));
float noiseY = randomNoise(_TimeX * _Speed - i.texcoord / float2(213, -5.53));
float noiseZ = randomNoise(_TimeX * _Speed + i.texcoord / float2(213, 5.53));

sceneColor.rgb += 0.25 * float3(noiseX,noiseY,noiseZ) - 0.125;
```

需要注意，0.25 * float3(noiseX,noiseY,noiseZ) - 0.125 这句代码中的系数 0.25 和 - 0.125 的作用，是让 noise 扰动后的画面的平均亮度和原先场景场景图相同，不能省略。但 0.25 和 0.125 两个系数可以进行合适的等幅度缩放，相对比例不变即可。

通过以上代码，可以得到如下带非均匀噪声的渲染表现：

![[1c2765a3978bf7c75209c8c44c1f9729_MD5.gif]]

另外，还可以加入 greyScale 灰度抖动，当某一刻的随机强度值大于亮度抖动阈值时，将原先的 RGB 颜色对应的 luminance 强度，呈现出黑白灰度的表现。

```
half luminance = dot(noiseColor.rgb, fixed3(0.22, 0.707, 0.071));
if (randomNoise(float2(_TimeX * _Speed, _TimeX * _Speed)) > _LuminanceJitterThreshold)
{
    noiseColor = float4(luminance, luminance, luminance, luminance);
}
```

最终，将 noise 扰动和随机灰度抖动两个特性相结合，得到 Glitch Analog Noise 最终的渲染表现：

![[44cc9296374935cd97a807a3617eb900_MD5.gif]]

模拟噪点故障（Analog Noise Glitch）完整的实现源码可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchAnalogNoise)

# 八、屏幕跳跃故障（Screen Jump Glitch）

![[518cb54c6962b0c556486a4c53eb7846_MD5.gif]]

屏幕跳跃故障（Screen Jump Glitch）的算法原理在于取经过时间校正后的 uv 数值的小数部分，并于原始 uv 插值，得到均匀梯度式扰动屏幕空间 uv，再用此 uv 进行采样即可得到跳动画面的表现。核心实现 Shader 代码如下：

```
half4 Frag_Vertical(VaryingsDefault i): SV_Target
{

    float jump = lerp(i.texcoord.y, frac(i.texcoord.y + _JumpTime), _JumpIndensity);        
    half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, frac(float2(i.texcoord.x, jump)));   
    return sceneColor;
}
```

其中，扰动后的 uv 强度分布，随时间变化的数值如下：

![[d0f7a1f0d15b1e2baa9a208e660af938_MD5.gif]]

基于此 uv 进行采样，得到的渲染表现如下：

![[8ac0a8e5d5eb62e831d70bebf6183d30_MD5.webp]]

以上为竖直方向的阶梯式 uv 采样，当然，我们也可以进行水平方向的阶梯式采样：

```
half4 Frag_Horizontal(VaryingsDefault i): SV_Target
{       
    float jump = lerp(i.texcoord.x, frac(i.texcoord.x + _JumpTime), _JumpIndensity);    
    half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, frac(float2(jump, i.texcoord.y)));       
    return sceneColor;
}
```

水平方向的阶梯式采样，得到的渲染表现如下：

![[c75560ef3fbe81b8dc1c11f0657f91ab_MD5.gif]]

屏幕跳跃故障（Screen Jump Glitch）详细的实现源码可见：

[X-PostProcessing/GlitchScreenJump](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchScreenJump)

## 九、屏幕抖动故障（Screen Shake Glitch）

![[5899ddf6a1dc75919c2a00243f87fe3f_MD5.gif]]

类似上文的 Screen Jump，Screen Shake 屏幕抖动的算法原理也在于对屏幕空间 uv 的抖动，但不同的是，Screen Shake 屏幕抖动需采用 noise 噪声函数来随机扰动 uv，而不是均匀梯度式的形式。核心实现代码如下：

```
half4 Frag_Horizontal(VaryingsDefault i): SV_Target
{
    float shake = (randomNoise(_Time.x, 2) - 0.5) * _ScreenShake;

    half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, frac(float2(i.texcoord.x + shake, i.texcoord.y)));

    return sceneColor;
}
```

得到扰动 uv 的可视化强度值如下：

![[15a101a11585009d6aa27389d99ea197_MD5.gif]]

渲染表现则如下：

![[3227c4df253e50eb3b18ffd94480465b_MD5.gif]]

同样，也可以做竖直方向的抖动：

```
half4 Frag_Vertical(VaryingsDefault i): SV_Target
{

    float shake = (randomNoise(_Time.x, 2) - 0.5) * _ScreenShake;

    half4 sceneColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, frac(float2(i.texcoord.x, i.texcoord.y + shake)));

    return sceneColor;
}
```

![[c00451c49df353295832e6aa4a2b2285_MD5.gif]]

屏幕抖动故障（Screen Shake Glitch）完整的实现源码可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchScreenShake)

# 十、波动抖动故障（Wave Jitter Glitch）

波动抖动故障（Wave Jitter Glitch）相较于上述的 9 种 Glitch 算法而言，用到了更为复杂的噪声生成函数。

![[80fc307b6e840047d14cb3552c831354_MD5.gif]]

## 10.1 噪声生成函数库 XNoiseLibrary

对此，XPL 参考了 [paper《Simplex noise demystified 》](http://www.itn.liu.se//~stegu/simplexnoise/simplexnoise.pdf)、[webgl-noise 库](https://github.com/ashima/webgl-noise)和 [NoiseShader 库](https://github.com/keijiro/NoiseShader)，实现一个单文件版的多维度噪声生成库 **[[XNoiseLibrary](https://github.com/QianMo/X-PostProcessing-Library/blob/master/Assets/X-PostProcessing/Shaders/XNoiseLibrary.hlsl)]**。

XNoiseLibrary 具有如下三种类型的 Noise 噪声生成函数：

*   2D/3D/4D Simplex Noise  
    
*   2D/3D textureless classic Noise  
    
*   Re-oriented 4 / 8-Point BCC Noise  
    

XNoiseLibrary 的优势在于使用较为方便，直接 include 单个文件 XNoiseLibrary.hlsl 即可进行其中封装的多版本噪声函数的调用。

XNoiseLibrary 的实现源码可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/blob/master/Assets/X-PostProcessing/Shaders/XNoiseLibrary.hlsl)

## 10.2 波动抖动故障（Wave Jitter Glitch）的实现算法

OK，回到我们的波动抖动故障（Wave Jitter Glitch）后处理中来。

波动抖动故障（Wave Jitter Glitch）后处理的核心思路是用双层的 noise 实现波浪形扭动 uv，核心代码如下：

```
float uv_y = i.texcoord.y * _Resolution.y;
float noise_wave_1 = snoise(float2(uv_y * 0.01, _Time.y * _Speed * 20)) * (strength * _Amount * 32.0);
float noise_wave_2 = snoise(float2(uv_y * 0.02, _Time.y * _Speed * 10)) * (strength * _Amount * 4.0);
float noise_wave_x = noise_wave_1 / _Resolution.x;
float uv_x = i.texcoord.x + noise_wave_x;

float4 color = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, float2(uv_x, i.texcoord.y));
```

若是单层的 noise 波浪，表现力会稍弱，具体表现如下：

![[8f22dc6e6b952797f643e31f25aa795b_MD5.gif]]

而双层的 noise 波浪，表现力更强，具体表现如下：

![[46f551688659a115896e2d2833dbf3a6_MD5.gif]]

所以 XPL 中的 Wave Jitter 实现，采用了双层的形式。

有了基于双层 noise 的 Wave Jitter Glitch 表现，还可以加上 RGB Split 算法，进一步提升表现力：

```
float4 Frag_Horizontal(VaryingsDefault i): SV_Target
{
    half strength = 0.0;
    #if USING_FREQUENCY_INFINITE
        strength = 1;
    #else
        strength = 0.5 + 0.5 *cos(_Time.y * _Frequency);
    #endif

    // Prepare UV
    float uv_y = i.texcoord.y * _Resolution.y;
    float noise_wave_1 = snoise(float2(uv_y * 0.01, _Time.y * _Speed * 20)) * (strength * _Amount * 32.0);
    float noise_wave_2 = snoise(float2(uv_y * 0.02, _Time.y * _Speed * 10)) * (strength * _Amount * 4.0);
    float noise_wave_x = noise_wave_1 * noise_wave_2 / _Resolution.x;
    float uv_x = i.texcoord.x + noise_wave_x;

    float rgbSplit_uv_x = (_RGBSplit * 50 + (20.0 * strength + 1.0)) * noise_wave_x / _Resolution.x;

    // Sample RGB Color
    half4 colorG = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, float2(uv_x, i.texcoord.y));
    half4 colorRB = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, float2(uv_x + rgbSplit_uv_x, i.texcoord.y));

    return  half4(colorRB.r, colorG.g, colorRB.b, colorRB.a + colorG.a);
}
```

得到的渲染表现如下：

![[37aa0df86a6071ef320435b0d538be58_MD5.gif]]

当然，除了横向的 Wave Jitter，纵向的 Wave Jitter 也具有不错的效果：

![[bb3ae5779a380fe3a0a3637fd1815446_MD5.gif]]

波动抖动故障（Wave Jitter Glitch）后处理特效可调参数也比较丰富，XPL 内实现的此特效的可调参数面板如下：

![[2b23d0a946ddfe02e4c2ca1a0372dd92_MD5.png]]

波动抖动故障（Wave Jitter Glitch）详细的实现源码，可见：

[QianMo/X-PostProcessing-Library](https://github.com/QianMo/X-PostProcessing-Library/tree/master/Assets/X-PostProcessing/Effects/GlitchWaveJitter)

# 总结

故障艺术追求 “故障” 带来的独特美感。近年来，故障艺术已经成为了赛博朋克风格电影和游戏作品中的核心艺术风格之一。而随着各种相关影视作品和游戏作品的不断发布，故障艺术的表现风格也引起了电商、综艺、快消等行业的广泛效仿。

在看完上述十种不同的故障艺术算法后，我们可以提炼一下，若要在屏幕空间实现故障艺术风格的渲染表现，算法核心在于四点：

*   **噪声函数的选择**：噪声函数是生成各式的干扰信号的源头。  
    
*   **uv 抖动方式的选择**：将噪声函数作用于屏幕空间 uv 后，基于新的 uv 进行采样，以产生故障的抖动表现。  
    
*   **采样通道的选择**：对 RGB 分别采样，或者选取特定通道进行采样，以实现多种风格的故障表现。  
    
*   **颜色空间的转换**：善用 YUV、CMY、HSV、YIQ、YCbCr 、YC1C2 等空间与 RGB 空间之间的转换，以实现多种风格的故障表现。  
    

熟知上述四种故障艺术的算法要点，加上一点创意，配合周边算法，则可以创造出更多富有表现力的故障艺术特效。

## Reference

[1] Jackson R. The Glitch Aesthetic[J]. 2011. [https://scholarworks.gsu.edu/cgi/viewcontent.cgi?article=1081&context=communication_theses](https://scholarworks.gsu.edu/cgi/viewcontent.cgi?article=1081&context=communication_theses)

[2] den Heijer E. Evolving glitch art[C]//International Conference on Evolutionary and Biologically Inspired Music and Art. Springer, Berlin, Heidelberg, 2013: 109-120

[3] [https://en.wikipedia.org/wiki/Cyberpunk](https://en.wikipedia.org/wiki/Cyberpunk)

[4] [https://github.com/keijiro/KinoGlitch](https://github.com/keijiro/KinoGlitch)

[5] [https://github.com/ashima/webgl-noise](https://github.com/ashima/webgl-noise)

[6] [https://github.com/keijiro/NoiseShader](https://github.com/keijiro/NoiseShader)

[7] [https://wallpaperswise.com/new-20-blade-runner-wallpapers/](https://wallpaperswise.com/new-20-blade-runner-wallpapers/)

[8] [http://www.itn.liu.se/](http://www.itn.liu.se/)\~stegu/simplexnoise/simplexnoise.pdf

[9] 题图来自《Cyberpunk 2077》