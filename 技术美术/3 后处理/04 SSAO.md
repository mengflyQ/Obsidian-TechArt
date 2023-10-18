
# 4.2 SSAO（不懂，后续补上）

日常生活中我们可以看到在角落里，光线很难到达的地方会很暗（缝隙、角落等等），这里就引申出来了 AO  

## AO  

环境光遮蔽，全称 Ambient Occlusion，是计算机图形学中的一种着色和渲染技术，模拟光线达到物体的能力的粗略的全局方法，描述光线到达物体表面的能力。  

![](1678971269015.png)  

## SSAO  

屏幕空间环境光遮蔽，全称 Screen Space Ambient Occlusion，一种用于计算机图形中实时实现近似环境光遮蔽效果的渲染技术。通过获取像素的深度缓冲、法线缓冲以及像素坐标来计算实现，来近似的表现物体在间接光下产生的阴影。  

![](1678971269063.png)  

### SSAO 历史  

AO 这项技术最早是在 Siggraph 2002 年会上由 ILM（工业光魔）的技术主管 Hayden Landis 所展示，当时就被叫做 Ambient Occlusion。  

2007 年，Crytek 公司发布了一款叫做屏幕空间环境光遮蔽（Screen-Space Ambient Occlusion，SSAO）的技术，并用在了他们的看家作孤岛危机上  

### SSAO 原理  

![](1678971269099.png)  

第一步：获取深度、法线缓冲（很重要）  

*   深度：用来计算像素在屏幕空间中的坐标值，把每一个像素的位置反推出来。整个屏幕算完之后，再利用深度值，把整一个 3D 场景反向展现出来，每一个像素和其他像素之间的关系。  
    

*   法线：推出法线半球随机向量。  
    

AO 核心：for 循环  

*   每一次 for 循环都会在法线半球中获取一个随机向量，根据这个向量我们会求出它对应的深度值，然后跟我们当前的深度值做比较，如果大于直接舍去，小于的话我们认为有遮蔽，算进加权中，最后我们合成 AO，然后再加上一些后期处理优化效果。  
    

### 深度缓冲  

![](1678971269136.png)  

上面的图片中，越黑的地方离相机越近，越白离相机越远。  

深度缓冲的目的：得到场景中物体与相机的远近关系。  

### 法线缓冲  

![](1678971269186.png)  

法线缓冲用于获得法线推出法线半球，我们需要获得法线半球的空间，我们的随机向量需要转换到法线半球空间中才能得到正确的值。  

这两个我们需要在相机中设置，才能得到其 Buffer 的值。  

### 法线半球  

![](1678971269225.png)  

图中的像素值的排列是有点不太正常的，是因为这是俯视视角，我们正常在屏幕中看到可能就是一个平面，这里就是理解下每个像素是带有深度的。每个像素求完法线后会根据随机向量求出切线，然后再求出空间。  

*   因为从相机开始到像素，模拟出一条向量，是在相机空间中的。  
    

*   我们利用法线和随机向量构建出一个法线半球空间。  
    

*   然后把相机空间中的向量转化到这个半球空间里，再加上随机向量，就可以得出像素对应的位置。  
    

法线半球目的：在随机采样的时候替我们做一个转化操作，让我们正确地求出边上这些随机像素值的坐标。  

不用全球的原因是，避免采样浪费，而且如果用全球可能还会导致平整墙面都显得灰蒙蒙的。  

## SSAO 算法实现  

### 获取深度&法线缓冲数据  

```
private void Start(){
	cam = this.GetComponent();
    cam.depthTextureMode = cam.depthTextureMode | DepthTextureMode.DepthNormals;
} 
``` 

*   获取相机的组件  


*   深度纹理模式调整成带深度和带法线的。  
    

![](1678971269263.png)  

*   这里的 UV 是屏幕空间的 UV  
    

*   ![](1678971269299.png)  
    

注意：  

*   此案例中使用的 Unity 版本为 Unity 2019.3.5f1  
    

*   场景中的项目为透视模式  
    

*   相机渲染路径为 Forward，如果设置为 Deferred 延迟渲染，则会由对应的 g-buffer 生成，在 shader 中作为全局变量访问。  
    

*   使用 OnRenderImage ()来处理后期，进而实现 SSAO  
    

### 重建相机空间坐标  

![](1678971269337.png)  

![](1678971269377.png)  

至此，我们已经获得了相机空间中的像素坐标。  

### 构建法向量正交基  

![](1678971269442.png)  

切线和副切线的求法是：  

*   法线（已经归一化）和随机向量进行点乘，得到一个投影在法线方向的一个标量 a。  
    

*   使用法线（已经归一化）进行向量和标量的乘法，得到一个法线方向上的向量 a。  
    

*   使用随机向量 randvec 减去向量 a，得到切线。  
    

*   最后使用 Cross 叉乘法线和切线得到副切线，完成一组正交基的构建（两两点乘等于 0，即两两垂直~）。  
    

### AO 采样核心  

![](1678971269481.png)  

其中，_SampleKernelArray[i]是在 C #中计算的随机值 ，然后其实随机值影响的是切向量的方向  

*   ![](1678971269517.png)  
    

*   法向量不变，切向量改变，则意味着正交基（TBN 矩阵）就发生了改变。因此 mul (_SampleKernelArray[i]. xyz, TBN)的值就变得更加随机了（Because 随机数组 * 随机变化影响下的随机正交基矩阵 = 更加随机化的向量）  
    

*   _SampleKernalRadius 是影响半球半径的因素  
    

*   ![](1678971269575.png)  
    

*   randomPos = viewPos + randomVec * _SampleKernalRedius  
    

*   ![](1678971269627.png)  
    

*   由于之前在样本相对相机的方向时取得是 CameraInvProjection，这回再取反：  
    

*   ![](1678971269668.png)  
    

*   经过反推得到 rscreenPos，其中还经过了范围的映射变化，映射到了屏幕的 0-1 空间中  
    

*   最后会通过 rscreenPos 来采样_CameraDepthNormalsTextrue，并计算转化至屏幕空间后对应的深度值，然后拿这个和 linear01Depth 进行比较，如果 randomDepth>=linear01Depth，则说明对 AO 有贡献，进而加权。  
    

*   ![](1678971269718.png)  
    

这里添加一些对细节的理解：  

_ProjectionParams 是一个存有不同意义的 xyzw 分量的一个投影参数向量，其中 x 是 1.0（或 –1.0，如果当前使用翻转投影矩阵进行渲染），y 是相机的近平面，z 是相机的远平面，并且 w 是 1/FarPlane。  

那么，代码中有一处是这么用的：  

![](1678971269754.png)  

我们知道 screenPos 计算出来的结果是 xy 分量变化，zw 分量不变。ndcPos 又做了一定的映射处理，使得 xy 分量最终保持在[0,1]范围，z 分量跟远近平面和原始的模型空间中的 z 坐标有关，w 分量本来是-z，经过 ComputeScreenPos 处理后保持-z 不变，但经过 ndcPos (归一化)处理后变成了常数1。  

![](1678971269789.png)  

另外，从上面的公式可以看出，投影以后的屏幕坐标的 x/y 分量，都跟 3D 空间 camera space 的 z 坐标有关。举例来说，x 分量为 ![](1678971270112.png) 。camera space 3D 空间中，对于相同的 x，如果 z（深度）越大，投影变换以后的 x 分量越靠近 0。"近大远小"的透视效果，就是这么算出来的~  

Unity shader 里面，要获取投影矩阵，有两个变量：unity_CameraProjection (float4x4) 和 UNITY_MATRIX_P (float4x4)。需要注意的是，这两个矩阵的内容实际上不一样。unity_CameraProjection，跟前面分析的矩阵是一样的。而 UNITY_MATRIX_P，经过分析测试，实际上是这样的一个矩阵：  

![](1678971270148.png)  

这个矩阵也是能用的，算出来的结果需要做一些额外的变换才能够跟 unity_CameraProjection 一样变成正常的 clip space 计算。具体为啥在 shader 里要增加这个内置变量，可能是为了一些兼容性吧，我也没完全弄明白。  

如果想要把一个 camera space 的向量，从 camera space 映射到 clip space / screen space，需要采取的操作是：用投影矩阵 (unity_CameraProjection) 去乘那个向量 (向量的齐次坐标 w 分量为 0)，然后只保留 x\y 分量。从下面的公式可以看出，这实际上计出来的是点 (x, y, z, 1) 和 (0,0, z, 1) 投影空间的向量 (未做透视除法)。那么把这个计算结果做一个归一化，就可以得到方向向量投影到屏幕上的结果向量。  

![](1678971270182.png)  

首先将屏幕空间坐标经过透视除法转换到 NDC 空间中，将 screenPos 的 xy 分量[0, w]转化为[0,1]，进而再映射到[-1,1]的范围里。对于 zw 分量的变化就是 z 分量未知，w 分量变为 1，然后映射后仍旧是1。  

float4 ndcPos = (o.screenPos / o.screenPos. w) * 2 - 1;  

然后将屏幕像素对应在摄像机远平面（Far plane）的点转换到剪裁空间（Clip space）。因为在 NDC 空间中远平面上的点的 z 分量为 1，所以可以直接乘以摄像机的 Far 值来将其转换到剪裁空间（实际就是反向透视除法）。  

float far = _ProjectionParams. z;  

float3 clipVec = float3 (ndcPos. x, ndcPos. y, 1.0) * far;  

接着通过逆投影矩阵（Inverse Projection Matrix）将点转换到观察空间（View space）。  

float3 o.viewVec = mul (unity_CameraInvProjection, clipVec. xyzz). xyz;  

已知在观察空间中摄像机的位置一定为（0，0，0），所以从摄像机指向远平面上的点的向量就是其在观察空间中的位置。  

将向量乘以线性深度值，得到在深度缓冲中储存的值的观察空间位置。  

float depth = UNITY_SAMPLE_DEPTH (tex2Dproj (_CameraDepthTexture, i.screenPos));  

float3 viewPos = i.viewVec * Linear01Depth (depth);  

到这里可能会有疑惑——为什么非得要把点放到远平面去呢？  

Unity 中的观察线性深度（Eye depth）就是顶点在观察空间（View space）中的 z 分量，范围在[0，Far]，而 01 线性深度（01 depth）就是观察线性深度通过除以摄像机远平面重新映射到[0，1]区间所得到的值。  

那么可以回答上面的问题，一个点的深度信息，放到远平面之后经过 Linear01Depth 函数可以重新回到[0,1]的范围。因此上面在求 clipVec 的时候会有“将 z 分量置为 1，然后乘以 far”的操作。  

## SSAO 效果改进  

### 1. 随机正交基  

![](1678971270229.png)  

### 2. AO 累加平滑优化  

![](1678971270266.png)  

其中 x 值是我们控制的_RangeStrength，如果 randomDepth 和 linearDepth 的差值的绝对值大于我们设定的阈值，那么认为是天空（无穷远），就不需要遮蔽了，就当做和模型同样深度即可（range 为0）。  

同样，同一个平面上的像素可能有时离得近了，会出现 AO，所以加入：  

![](1678971270303.png)  

AO 权重：  

只要 1、2、3 点深度值比我们要求的像素要小，我们认为对 AO 都有贡献（非 0 即 1）。  

然后我们根据随机向量的长度值变化来做一个（0-0.2 区间的）smoothstep  

越远离当前像素的，权重小一点。  

越靠近当前像素的，权重大一点。  

![](1678971270353.png)  

AO 现在包含：  

*   range ——指当前像素深度和法向半球算得深度的差值大于某个阈值时，AO 则立即变为 0，否则就是正常计算 selfCheck * weight（非 0 即 1）。  
    

*   selfCheck——自阴影，当前像素的深度值大于某个阈值时，在法向半球算得深度值上+1，否则+0。这个其实是想让法向半球算得深度比当前像素的深度值要大，让这个点附近的某些像素深度比当前像素大，不要贡献 AO（记住，只有小于当前像素深度的其他像素才能对当前像素贡献 AO）。  
    

*   weight——权重，我们使用随机向量的长度作为因子来控制权重的大小，距离当前像素越远，对当前像素的影响越小。  
    

### 3. 模糊  

![](1678971270403.png)  

## 比对模型烘焙 AO  

![](1678971270441.png)  

### 方式一：三维建模软件烘焙 AO  

优点：  

1、单一物体可控性强（通过单一物体的材质球上的 AO 纹理贴图），可以控制单一物体的 AO 的强弱；  

2、弥补场景烘焙的细节，整体场景的烘焙（包含 AO 信息），并不能完全包含单一物体细节上的 AO，而通过三维建模软件烘焙到纹理的方式，增加物体的 AO 细节；  

3、不影响其（Unity 场景中）静态或者动态；  

缺点：  

1、操作较其他方式繁琐，需要对模型进行 UW 处理，再进行烘焙到纹理；  

2、不利于整体场景的整合（如 3DMax 烘焙到纹理，只能选择单一物体，针对整体场景的处理工作量巨大）；  

3、增加 AO 纹理贴图，不利于资源优化（后期可通过 shader 把通道利用起来整合资源）；  

4、只有物体本身具有 AO 信息，获取物体之间的 AO 信息工作量巨大（不是不可能）。  

### 方式二：游戏引擎烘焙 AO（Unity3D Lighting）  

优点：  

1、操作简易，整体场景的烘焙，包含 AO 的选择；  

2、不受物体本身的 UW 影响，Unity 通过 Generate Lightmap UVs 生成模型第二个纹理坐标数据；  

3、可生成场景中物体与物体之间的 AO 信息；  

缺点：  

1、缺少单一物体的细节（可调整参数提高烘焙细节，但换之将增加烘焙纹理数量和尺寸，以及烘焙时间）；  

2、受物体是否静态影响，动态物体无法进行烘焙，获得 AO 信息；  

3、其实相当于拿 CPU 的内存去换计算量。  

### 方式三：SSAO  

优点：  

1、不依赖场景的复杂度，其效果质量依赖于最终图片像素大小（屏幕分辨率）；  

2、实时计算，可用于动态场景；  

3、可控性强，灵活性强，操作简单；  

缺点：  

1、性能消耗较之上述 2 种方式更多，计算非常昂贵；  

2、AO 质量上要比较离线式烘焙（上述 2 种）不佳（理论上）。  

## SSAO 性能消耗  

![](1678971270488.png)  

### AO 核心采样消耗说明  

本案例 SSAO 算法中，主要核心为计算 AO 随机法向半球的采用点，并加以半段计算 AO 权值。  

1、使用 For 结构代码进行半球随机向量的采用，If、For 等对于 GPU 计算性能上并不友好（For 循环可能会打破并行计算）；  

![](1678971270525.png)  

2、采用数的数量（上图中的 SampleKernelCount，针对 For 循环的次数），过低的采用数得不到好的结果；以 64 为例，1334x750 的分辨率，每个像素计算循环 64 次，合计 1334*750*64 次 AO 核心计算；  

3、循环体重的采样，同样以 64 为例，每个像素计算需要采样 64 次来求得屏幕深度值法线值（着色器里面采样是很耗性能的）。  

![](1678971270562.png)  

### 滤波采样消耗说明  

![](1678971270617.png)  

纵向和横向各做一次 Blit  

在工程中有一段这样的代码是关于计算 64 次采样中法向半球的随机向量的计算  

![](1678971270661.png)  

顶点着色器中重点部分：  

![](1678971270708.png)  

## 课程参考链接：  

【环境遮罩之 SSAO 原理】 [https://zhuanlan.zhihu.com/p/46633896](https://zhuanlan.zhihu.com/p/46633896)  

【游戏后期特效第四发--屏幕空间环境光遮蔽（SSAO）】 [https://zhuanlan.zhihu.com/p/25038820](https://zhuanlan.zhihu.com/p/25038820)  

[https://www.iquilezles.org/www/articles/ssao/ssao.htm](https://www.iquilezles.org/www/articles/ssao/ssao.htm)  

【learnopengl-cn】 [https://learnopengl-cn.github.io/05%20Advanced%20Lighting/09%20SSAO/](https://learnopengl-cn.github.io/05%20Advanced%20Lighting/09%20SSAO/)  

【屏幕空间环境光遮蔽（SSAO）算法的实现】 [https://blog.csdn.net/qq_39300235/article/details/102460405](https://blog.csdn.net/qq_39300235/article/details/102460405)  

【Unity Shader-Ambient Occlusion 环境光遮蔽】 [https://blog.csdn.net/puppet](https://blog.csdn.net/puppet) master/article/details/82929708  

【SSAO 与深度重构】 [https://wiki.jikexueyuan.com/project/modern-opengl-tutorial/tutorial46.html](https://wiki.jikexueyuan.com/project/modern-opengl-tutorial/tutorial46.html)  

【Ambient Occlusion（AO）使用指南】 [https://zhuanlan.zhihu.com/p/150431414](https://zhuanlan.zhihu.com/p/150431414)  

【图形和滤波】 [http://www.ruanyifeng.com/blog/2017/12/image-and-wave-filters.html](http://www.ruanyifeng.com/blog/2017/12/image-and-wave-filters.html)  

【双边滤波】 [https://blog.csdn.net/puppet_master/article/details/83066572](https://blog.csdn.net/puppet_master/article/details/83066572)  

## 小作业  

### 实现 SSAO 效果  

![](1678971270769.png)  

SSAO-Sample Kernel 半径调整时，动图效果如下：  

![](1678971270824.png)  

整理一些代码中比较核心的地方：  

### 生成采样核心  

在 OnRenderImage 开始前我们首先要做的，就是生成采样核心。每个核心中的样本将会被用来偏移观察空间片元位置从而采样周围的几何体，如果没有变化采样核心，我们将需要大量的样本来获得真实的结果。通过引入一个随机的转动到采样核心中，我们可以很大程度上减少这一数量。  

```
private void GenerateAOSampleKernel()
{
        if (SampleKernelCount == sampleKernelList.Count)
            return;
        sampleKernelList.Clear();
        for (int i = 0; i < SampleKernelCount; i++)
        {
            var vec = new Vector4(Random.Range(-1.0f, 1.0f), Random.Range(-1.0f, 1.0f), Random.Range(0, 1.0f), 1.0f);
            vec.Normalize();
            var scale = (float)i / SampleKernelCount;
            //使分布符合二次方程曲线
            scale = Mathf.Lerp(0.1f, 1.0f, scale * scale);
            //后面给向量乘一个scale是为了让生成的随机采样点更靠近当前片元，这样得到的采样点更有意义
            vec *= scale;
            sampleKernelList.Add(vec);
        }
}

``` 

根据[这篇文章](https://zhuanlan.zhihu.com/p/164992374)，我们可知上面的代码中引入了一个变量 scale，这是为了让生成的随机采样点更靠近当前片元。  

相关的数学描述如下:  

![](1678971271092.png)  

曲线反应的函数是  

Distance (i)=g (i). x2+g (i). y2+g (i). z2​(1)

  

其中有  

g (i)={0.1+0.9∗(SampleKernelCounti​) 2}∗vec (2)

  

我们认为公式 (2)中 vec 的系数为 scale，因此有：  

scale=0.1+0.9∗(SampleKernelCounti​) 2 (3)

  

其中公式 (3)也可以被转化成 Lerp 函数的形式：  

scale=0.1∗(1−SampleKernelCount2i2​)+1.0∗(SampleKernelCounti​) 2 (4)

  

当公式 (4)转换成 Lerp 函数，其因子是

scale2

，最终又重新赋值给 scale：  

 ```
 scale = Mathf.Lerp(0.1f, 1.0f, scale * scale);

``` 

因此可以认为，最终与 vec 相乘的 scale 是一个二次方程图像。  

当我们调整 Sample Kernel Count 的时候，可以发现虽然由于随机采样会让阴影时刻变化，但是在 Count 数量由小到大变化的整体过程中，阴影（也就是我们的采样点范围）会在宏观上来看是减少的，是越来越靠近当前像素的。  

Count 为最小值： Count 为最大值：  

![](1678971271126.png)  

原来的 vec 的各个分量本身就是在 0~1 之间的浮点数，乘上一个二次函数上取到的平滑的 0~1 之间的浮点数，这样就使得采样点更接近片段点了，如上图所示效果确实是这样。  

## 使用其他 AO 算法进行对比  

我选择的其他 AO 算法是——HBAO（Horizon-Based Ambient Occlusion）和 GTAO（Ground Truth Ambient Occlusion）  

![](1678971271442.png)  

### HBAO 篇  

HBAO 是在后处理阶段，逐像素构建半球面。采用蒙特卡洛采样计算像素对应物体坐标点的 AO 值。下图是 nvddia 官方给出的 HBAO 实现流程。  

![](1678971271493.png)  

根据算法介绍我们知道，需要重建对应点坐标和法线，计算 AO 再进行模糊处理，最终和原始图像合并得到最终效果。以下是 HBAO 基于 u3d 前向渲染的实现。  

#### 屏幕空间坐标重建  

 下图中θ为相机的 fov, 均是分析对应 p 屏幕空间的 y 坐标（其中 v0, v1, v2 对应 uv 值中的 v 映射至-1~1）。  

![](1678971271551.png)  

 对应代码如下：  

 ```
		var tanHalfFovY = Mathf.Tan(mCamera.fieldOfView * 0.5f * Mathf.Deg2Rad);
		var tanHalfFovX = tanHalfFovY * ((float)mCamera.pixelWidth / mCamera.pixelHeight);

    	//计算相机空间:x = (2* u - 1) * tanHalfFovX * depth  (2u - 1将坐标映射到-1,1)
		mMaterial.SetVector(ShaderProperties.UV2View, 
    	new Vector4(2 * tanHalfFovX, 2 * tanHalfFovY, -tanHalfFovX, -tanHalfFovY));


``` ```
inline float3 FetchViewPos(float2 uv)
{
        float depth = LinearEyeDepth(FetchDepth(uv));
        return float3((uv * _UV2View.xy + _UV2View.zw) * depth, depth);
}

``` 

#### 计算 HBAO  

上面已经介绍了半球某一特定方向上切片遮挡的计算方法，接下来使用蒙特卡洛积分，采样半球不同方向上的切片的遮挡，模拟 HBAO 积分结果。  

为了避免明显的交错感，每次采样时进行一次随机，让采样方向产生一点偏移。如下图所示：  

![](1678971271848.png)  

随机算法采用了 [the book of shader 11](https://thebookofshaders.com/11/) 中提到的 value-nosie。  

```
inline float random(float2 uv) {
    return frac(sin(dot(uv.xy, float2(12.9898, 78.233))) * 43758.5453123);
}

``` 

下图时使用 python matplotlib 库生成的 value-nosie 的噪声图。  

![](1678971271891.png)  

以下则是使用蒙特卡洛方法计算 HBAO 的主要代码  

 ```
 for (int i = 0; i < DIRECTION; ++i)
    {
        float angle = delta * (float(i) + rnd);
        float cos, sin;
        sincos(angle, sin, cos);
        float2 dir = float2(cos, sin);
        float rayPixel = 1;
        float top = _AngleBias;
        UNITY_UNROLL
        for(int j = 0; j < STEPS; ++j)
        {
            float2 stepUV = round(rayPixel * dir) * _TexelSize.xy + input.uv;
            float3 stepViewPos = FetchViewPos(stepUV);
            ao += SimpleAO(viewPos, stepViewPos, normal, top);
            rayPixel += stepSize;
        }
    }
    ao /= STEPS * DIRECTION;

``` 

#### 室内  

![](1678971271954.png)  

调整 HBAO 力度，最小值->最大值：  

![](1678971272002.png)  

#### 室外  

![](1678971272089.png)  

调整 HBAO 力度，最小值->最大值：  

![](1678971272127.png)  

个人感觉，HBAO 在处理倒角部分的阴影的时候效果挺显著的。  

### GTAO 篇  

GTAO 具体原理还需要多多揣摩，可以挪步观看[这篇文章](https://zhuanlan.zhihu.com/p/145339736)，可以说是 SSAO 的一种进化版本。  

限于篇幅，原理先不多赘述，以后慢慢填充在这里。我们直接来看效果~  

#### 室外  

SSAO 开启：  

![](1678971272179.png)  

GTAO 开启：  

![](1678971272298.png)  

可以发现 GTAO 的效果比 SSAO 要更自然一些，SSAO 感觉比较硬。  

看一下动图  

调整 SSAO 力度，最小值->最大值:  

![](1678971272362.png)  

调整 GTAO 力度，最小值->最大值:  

![](1678971272414.png)  

个人认为，在比较大的室外场景中，GTAO 在处理遮蔽问题上略胜一筹。  

#### 室内  

但是在物件比较多的场景下：  

SSAO 开启：  

![](1678971272573.png)  

我们看远处书架这里，SSAO 处理效果看起来会比 GTAO 更精细一点（实际上可能不是）：  

SSAO 的处理可以明显看到有一些阴影分层感  

![](1678971272679.png)  

GTAO 开启：  

![](1678971272764.png)  

远处感觉直接压暗了：  

![](1678971273102.png)  

不知道为什么，GTAO 在处理室内的时候力度增加会非常地暗。  

调整了一下亮度，但感觉还是略微有点失真：  

![](1678971273416.png)  

我看了 AO 图，还算正常（处理细节感觉比 SSAO 强，感觉特别接近真实场景）：  

![](1678971273466.png)  

RO 图  

![](1678971273681.png)  

法线图  

![](1678971273786.png)  

做一个总结吧（借鉴了某个知乎大佬的话）：  

GTAO 其实是 HBAO 的一个变种, 由于 SSAO 计算时对半径内的采样不看遮挡关系，导致会“过黑”， HBAO 则是针对当前采样方向在固定步长下，寻找一个最大的权重影响点。这就使得凹凸的表面上的遮挡不会像 SSAO 那么“平均”。但是问题在于，比采样点“低”的临近采样点，也会对 AO 做出贡献。这就需要你的场景是否有这种足够的微观程度，不然用了只是徒增性能开销。  

个人的测试中，HBAO 在室内的细节遮蔽方面效果很好，GTAO 在室外效果不错，SSAO 处于平庸的位置。  

### 参考链接  

HBAO (屏幕空间的环境光遮蔽) [https://zhuanlan.zhihu.com/p/103683536](https://zhuanlan.zhihu.com/p/103683536)  

UE4 Mobile GTAO 实现 (HBAO 续) [https://zhuanlan.zhihu.com/p/145339736](https://zhuanlan.zhihu.com/p/145339736)  

Ambient Occlusion (AO)使用指南 [https://zhuanlan.zhihu.com/p/150431414](https://zhuanlan.zhihu.com/p/150431414)  

Ground-Truth Ambient Occlusion [https://zhuanlan.zhihu.com/p/150178776](https://zhuanlan.zhihu.com/p/150178776)
owMapping 解决了分布描述不准的问题
