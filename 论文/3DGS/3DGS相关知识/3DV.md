3dv: [3D Gaussian Splatting Tutorial - 3DV 2024 (youtube.com)](https://www.youtube.com/watch?v=X5KrYh7xcHk) 
资料：[3D Gaussian Splatting (3dgstutorial.github.io)](https://3dgstutorial.github.io/)

会议： [International Conference on 3D Vision 2024 - International Conference on 3D Vision 2024 (3dvconf.github.io)](https://3dvconf.github.io/2024/)


# 动机
从图像和视频中重建三维世界
1. 探索（从新颖视图重新渲染）
2. 2.了解（3D Tracking、三维视频编辑等）

理想的 3D 表示：
- 准确
- 快速
- 高效内存
- 实用：易于集成到框架中

高斯泼溅：
1. PSNR 与 MipNeRF360 相当。
2. 每秒 100+ 帧，训练时间少于 1 小时。
3. 可在移动设备上渲染（< 6GB VRAM）。
4. 在不同的图形框架上实现多种功能。
a. 格式：易于标准化（. ply 文件）。


# 相关工作

基于 Mesh的表示：
- 利用多视图立体( Multi-View Stereo, MVS)估算几何形状
- 修正三角形 Mesh中的错误（极具挑战性）
- 通过学习忽略它们来修复它们：
    - Deep Blending [Hedman 2018]
    - Stable View Synthesis [Riegler 2020]

神经辐射场：
- NeRF 存在训练和渲染速度慢的问题：
    - DVGO [Sun 2022]
    - Instant-NGP [Müller 2022]
    - Plenoxels [Fridovich-Keil and Yu 2022]
    - TensoRF [Chen and Xu 2022]


基于点的表示：
![[Pasted image 20240424144304.png]]

# 背景

传统的基于点的图形：**曲面泼溅Surface Splatting** - Zwicker et al. 2001(EWA – Elliptical Weighted Average)
- 将定向点（surfaceels）视为曲面上纹理函数的离散样本。
- 高斯重构核用于恢复连续信号。
- 这样，我们就可以在屏幕空间中对其进行采样。
![[Pasted image 20240424144705.png|322]]

该算法的重要成果有
1. 将摄像头移近，缩放点，使物体没有孔洞。
2. 倾斜的法线以椭圆的形式出现，因此我们可以创建更好的边缘。
3. 可独立处理每个样本


点云的最新进展
- **可微分曲面泼溅Differentiable Surface Splatting** [Yifan ‘19]  表明这一过程是端到端可微分的。
- 3DGS 在很大程度上受到了这一工作流程的启发，并在此基础上进行了改进

![[Pasted image 20240424145637.png]]
>曲面泼溅 VS 体积泼溅


如何在屏幕空间中混合点？
每个点的不透明度，允许我们使点消失
![[Pasted image 20240424145822.png]]

# 3D 高斯的优点
初始化：
- No Multi-View-Stereo -> SfM
- SfM points -> No Normals
- 从各向同性高斯（isotropic Gaussians）开始
- 甚至可以从随机初始化开始

质量
- 复杂的几何图形（如薄结构、植被等）更注重体积而非曲面

如何渲染：
1. 排序： 根据深度进行排序
2. Splat：计算投影后的高斯形状
3. 混合：alpha 混合

# 优化

如何优化协方差矩阵？
- 并非所有对称矩阵都是协方差矩阵。梯度更新很容易使它们失效。![[Pasted image 20240424150245.png]]
- 对于任何旋转和缩放，这都是一个有效的协方差矩阵
- 由于 R 不能很好地优化，所以我们使用四元数

我们是如何从 5 FPS 提升到 100+ FPS，训练时间从 18 小时降低至 40 分钟的？
1. Tiling:将图像分割成 16x16 块 - 帮助线程协同工作。
2. Single global sort: GPU 可快速分类数百万个基元。

# 应用
长期：稳健、高效、动态的 3D 重建

短期：VfX，零售 - 电子商务，3D 视频编辑

# 局限与进步
1. 用于密集化的手工启发式（Handcrafted heuristics）算法
2. 由于基于平均值的排序，会出现 popping 伪影
3. 内存占用大（需要优化）
- 3DGS: 350 - 700MB ( 3-6m of Gaussians )
- MipNeRF360: 8.6MB


# 总结
高斯拼接技术快速、高效、准确、实用。但这并不意味着它没有局限性。
这种效率将如何引导新思路、新应用和解决辐射场的基本问题？