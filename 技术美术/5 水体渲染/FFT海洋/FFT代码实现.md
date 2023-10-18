
![[24b43e36aaf530e9c13d673ed4789c92_MD5.jpg]]

对于实现的话就比较简单了，只需要照着公式抄一遍就可以了。在本次实现中我们将使用 Compute Shader 在计算频谱和 FFT。为了理清思路和便于 debug，整个工程代码写得比较野蛮 == 其中很多计算是可以放到一起的，也创建了很多的 RenderTexture(实际并用不了那么多)，同时还使用了比较大的数据类型等。
# 高斯随机数
首先我们需要先生成高斯随机数

```c
//计算高斯随机变量
[numthreads(8, 8, 1)]
void ComputeGaussianRandom(uint3 id: SV_DispatchThreadID) {
    float2 g = gaussian(id.xy);

    GaussianRandomRT[id.xy] = float4(g, 0, 0);
}

//计算高斯随机数
float2 gaussian(float2 id) {
    //均匀分布随机数
    rngState = wangHash(id.y * N + id.x);
    float x1 = rand();
    float x2 = rand();

    x1 = max(1e-6f, x1);
    x2 = max(1e-6f, x2);
    //计算两个相互独立的高斯随机数
    float g1 = sqrt(-2.0f * log(x1)) * cos(2.0f * PI * x2);
    float g2 = sqrt(-2.0f * log(x1)) * sin(2.0f * PI * x2);

    return float2(g1, g2);
}
//随机种子
uint wangHash(uint seed) {
    seed = (seed ^ 61) ^(seed >> 16);
    seed *= 9;
    seed = seed ^(seed >> 4);
    seed *= 0x27d4eb2d;
    seed = seed ^(seed >> 15);
    return seed;
}
//计算均匀分布随机数[0,1)
float rand() {
    // Xorshift算法
    rngState ^= (rngState << 13);
    rngState ^= (rngState >> 17);
    rngState ^= (rngState << 5);
    return rngState / 4294967296.0f;;
}
```

我们将使用 wangHash 来生成随机数种子，然后使用 Xorshift 算法来生成均匀分布的随机数。可以参考这里 [Quick And Easy GPU Random Numbers In D3D11](http://www.reedbeta.com/blog/quick-and-easy-gpu-random-numbers-in-d3d11/#wide-and-deep) , 然后对得到均匀分布的随机数，通过 Box-Muller 转换，将得到高斯随机数

$r_0=sin(2\pi u_0)\sqrt{-2log(u_1)}$

$r_1=cos(2\pi u_0)\sqrt{-2log(u_1)}$

$u_0$ 和 $u_1$ 是两个相互独立的均匀分布的随机数， $r_0$ 和 $r_1$ 是两个相互独立的高斯随机数。可参考这里 [GPU Gems 3 :Chapter 37](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch37.html) 。

随机数只需要计算一次就好了，然后我们在计算高度频谱

# 计算高度频谱
```c
//生成高度频谱
[numthreads(8, 8, 1)]
void CreateHeightSpectrum(uint3 id: SV_DispatchThreadID) {
    float2 k = float2(2.0f * PI * id.x / N - PI, 2.0f * PI * id.y / N - PI);

    float2 gaussian = GaussianRandomRT[id.xy].xy;

    float2 hTilde0 = gaussian * sqrt(abs(phillips(k) * DonelanBannerDirectionalSpreading(k)) / 2.0f);
    float2 hTilde0Conj = gaussian * sqrt(abs(phillips(-k) * DonelanBannerDirectionalSpreading(-k)) / 2.0f);
    hTilde0Conj.y *= -1.0f;

    float omegat = dispersion(k) * Time;
    float c = cos(omegat);
    float s = sin(omegat);
    
    float2 h1 = complexMultiply(hTilde0, float2(c, s));
    float2 h2 = complexMultiply(hTilde0Conj, float2(c, -s));

    float2 HTilde = h1 + h2;

    HeightSpectrumRT[id.xy] = float4(HTilde, 0, 0);
}
```

## phillips 谱

```c
//计算phillips谱
float phillips(float2 k) {
    float kLength = length(k);
    kLength = max(0.001f, kLength);
    // kLength = 1;
    float kLength2 = kLength * kLength;
    float kLength4 = kLength2 * kLength2;

    float windLength = length(WindAndSeed.xy);
    float  l = windLength * windLength / G;
    float l2 = l * l;

    float damping = 0.001f;
    float L2 = l2 * damping * damping;

    //phillips谱
    return  A * exp(-1.0f / (kLength2 * l2)) / kLength4 * exp(-kLength2 * L2);
}
```

## Donelan-Banner 方向拓展

```c
//Donelan-Banner方向拓展
float DonelanBannerDirectionalSpreading(float2 k) {
    float betaS;
    float omegap = 0.855f * G / length(WindAndSeed.xy);
    float ratio = dispersion(k) / omegap;

    if (ratio < 0.95f)
    {
        betaS = 2.61f * pow(ratio, 1.3f);
    }
    if(ratio >= 0.95f && ratio < 1.6f)
    {
        betaS = 2.28f * pow(ratio, -1.3f);
    }
    if(ratio > 1.6f)
    {
        float epsilon = -0.4f + 0.8393f * exp(-0.567f * log(ratio * ratio));
        betaS = pow(10, epsilon);
    }
    float theta = atan2(k.y, k.x) - atan2(WindAndSeed.y, WindAndSeed.x);

    return betaS / max(1e-7f, 2.0f * tanh(betaS * PI) * pow(cosh(betaS * theta), 2));
}
float dispersion(float2 k) {
    return sqrt(G * length(k));
}
```

这里并没有什么好说的，基本就是照着公式抄 

得到了高度频谱，就可以使用他来计算我们的偏移频谱

# 计算偏移频谱
```c
//生成偏移频谱
[numthreads(8, 8, 1)]
void CreateDisplaceSpectrum(uint3 id: SV_DispatchThreadID)
{
    float2 k = float2(2 * PI * id.x / N - PI, 2 * PI * id.y / N - PI);
    k /= max(0.001f, length(k));
    float2 HTilde = HeightSpectrumRT[id.xy].xy;

    float2 KxHTilde = complexMultiply(float2(0, -k.x), HTilde);
    float2 kzHTilde = complexMultiply(float2(0, -k.y), HTilde);

    DisplaceXSpectrumRT[id.xy] = float4(KxHTilde, 0, 0);
    DisplaceZSpectrumRT[id.xy] = float4(kzHTilde, 0, 0);
}
```

至此就得到了我们想要的所有频谱，然后分别来对他们进行 FFT 就可以了

# FFT
```c
//横向FFT计算,只针对第m-1阶段，最后一阶段需要特殊处理
[numthreads(8, 8, 1)]
void FFTHorizontal(uint3 id: SV_DispatchThreadID)
{
    int2 idxs = id.xy;
    idxs.x = floor(id.x / (Ns * 2.0f)) * Ns + id.x % Ns;
    float angle = 2.0f * PI * (id.x / (Ns * 2.0f));
    float2 w = float2(cos(angle), sin(angle));

    float2 x0 = InputRT[idxs].xy;
    float2 x1 = InputRT[int2(idxs.x + N * 0.5f, idxs.y)].xy;

    float2 output = x0 + float2(w.x * x1.x - w.y * x1.y, w.x * x1.y + w.y * x1.x);
    OutputRT[id.xy] = float4(output, 0, 0);
}
```

这里只截取了一个，对于最后一个阶段和纵向 FFT，代码大同小异，其实也可以写到一起。

# 生成偏移纹理
当 FFT 计算完后，就可以生成我们的偏移纹理，这里使用了几个参数来控制他的偏移程度。

```c
//生成偏移纹理
[numthreads(8, 8, 1)]
void TextureGenerationDisplace(uint3 id: SV_DispatchThreadID)
{
    float y = length(HeightSpectrumRT[id.xy].xy) / (N * N) * HeightScale;//高度
    float x = length(DisplaceXSpectrumRT[id.xy].xy) / (N * N) * Lambda;//x轴偏移
    float z = length(DisplaceZSpectrumRT[id.xy].xy) / (N * N) * Lambda;//z轴偏移
    
    HeightSpectrumRT[id.xy] = float4(y, y, y, 0);
    DisplaceXSpectrumRT[id.xy] = float4(x, x, x, 0);
    DisplaceZSpectrumRT[id.xy] = float4(z, z, z, 0);
    DisplaceRT[id.xy] = float4(x, y, z, 0);
}
```

# 计算法线和泡沫
最后根据偏移纹理，来计算法线和泡沫，计算方法就和我们上一节所讲的那样。

```c
//生成法线和泡沫纹理
[numthreads(8, 8, 1)]
void TextureGenerationNormalBubbles(uint3 id: SV_DispatchThreadID)
{
    //计算法线
    float uintLength = OceanLength / (N - 1.0f);//两点间单位长度
    //获取当前点，周围4个点的uv坐标
    uint2 uvX1 = uint2((id.x - 1.0f + N) % N, id.y);
    uint2 uvX2 = uint2((id.x + 1.0f + N) % N, id.y);
    uint2 uvZ1 = uint2(id.x, (id.y - 1.0f + N) % N);
    uint2 uvZ2 = uint2(id.x, (id.y + 1.0f + N) % N);

    //以当前点为中心，获取周围4个点的偏移值
    float3 x1D = DisplaceRT[uvX1].xyz;//在x轴 第一个点的偏移值
    float3 x2D = DisplaceRT[uvX2].xyz;//在x轴 第二个点的偏移值
    float3 z1D = DisplaceRT[uvZ1].xyz;//在z轴 第一个点的偏移值
    float3 z2D = DisplaceRT[uvZ2].xyz;//在z轴 第二个点的偏移值

    //以当前点为原点，构建周围4个点的坐标
    float3 x1 = float3(x1D.x - uintLength, x1D.yz);//在x轴 第一个点的坐标
    float3 x2 = float3(x2D.x + uintLength, x2D.yz);//在x轴 第二个点的坐标
    float3 z1 = float3(z1D.xy, z1D.z - uintLength);//在z轴 第一个点的坐标
    float3 z2 = float3(z1D.xy, z1D.z + uintLength);//在z轴 第二个点的坐标

    //计算两个切向量
    float3 tangentX = x2 - x1;
    float3 tangentZ = z2 - z1;

    //计算法线
    float3 normal = normalize(cross(tangentZ, tangentX));


    //计算泡沫
    float3 ddx = x2D - x1D;
    float3 ddz = z2D - z1D;
    //雅可比行列式
    float jacobian = (1.0f + ddx.x) * (1.0f + ddz.z) - ddx.z * ddz.x;

    jacobian = saturate(max(0, BubblesThreshold - saturate(jacobian)) * BubblesScale);

    NormalRT[id.xy] = float4(normal, 0);
    BubblesRT[id.xy] = float4(jacobian, jacobian, jacobian, 0);
}
```

# 着色
这样我们就有了所有的数据，接下来进行渲染就可以了。**在顶点着色器根据偏移纹理 进行顶点偏移**。片源着色器就进行了简单的灯光计算，如果想要更真实的物理效果可以参考这篇论文 Real-time Realistic Ocean Lighting using Seamless Transitions from Geometry to BRDF

```c
v2f vert(appdata v)
            {
                v2f o;
                o.uv = TRANSFORM_TEX(v.uv, _Displace);
                float4 displcae = tex2Dlod(_Displace, float4(o.uv, 0, 0));
                v.vertex += float4(displcae.xyz, 0);
                o.pos = UnityObjectToClipPos(v.vertex);
                
                o.worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                return o;
            }
            
            fixed4 frag(v2f i): SV_Target
            {
                fixed3 normal = UnityObjectToWorldNormal(tex2D(_Normal, i.uv).rgb);
                fixed bubbles = tex2D(_Bubbles, i.uv).r;
                
                fixed3 lightDir = normalize(UnityWorldSpaceLightDir(i.worldPos));
                fixed3 viewDir = normalize(UnityWorldSpaceViewDir(i.worldPos));
                fixed3 reflectDir = reflect(-viewDir, normal); 
                // reflectDir *= sign(reflectDir.y);
                
                //采样反射探头
                half4 rgbm = UNITY_SAMPLE_TEXCUBE_LOD(unity_SpecCube0, reflectDir, 0);
                half3 sky = DecodeHDR(rgbm, unity_SpecCube0_HDR);
                
                //菲涅尔
                fixed fresnel = saturate(_FresnelScale + (1 - _FresnelScale) * pow(1 - dot(normal, viewDir), 5));
                
                half facing = saturate(dot(viewDir, normal)); 
                fixed3 oceanColor = lerp(_OceanColorShallow, _OceanColorDeep, facing);
                
                fixed3 ambient = UNITY_LIGHTMODEL_AMBIENT.rgb;
                //泡沫颜色
                fixed3 bubblesDiffuse = _BubblesColor.rbg * _LightColor0.rgb * saturate(dot(lightDir, normal));
                //海洋颜色
                fixed3 oceanDiffuse = oceanColor * _LightColor0.rgb * saturate(dot(lightDir, normal));
                fixed3 halfDir = normalize(lightDir + viewDir);
                fixed3 specular = _LightColor0.rgb * _Specular.rgb * pow(max(0, dot(normal, halfDir)), _Gloss);
                
                fixed3 diffuse = lerp(oceanDiffuse, bubblesDiffuse, bubbles);
                
                fixed3 col = ambient + lerp(diffuse, sky, fresnel) + specular ;
                
                return fixed4(col, 1);
            }
```

逻辑代码并没有粘，因为他实在是太简单了.....

源码已经上传到了 Github 上，如果有什么理解或错误的地方，望大佬告诉我.....

[Straw1997/FFTOcean](https://github.com/Straw1997/FFTOcean)