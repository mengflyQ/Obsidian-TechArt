# 工程文件结构
![[Pasted image 20230602225358.png]]
![[Pasted image 20230602225421.png]]

只要有 Assets 文件就可以打开，其他由 unity 自动生成。

# 基本操作
![[Pasted image 20230602231416.png]]

Move to view：ctrl+alt+F   ，让物体移动到 Scene 视角中心
Align with View：ctrl+shift+F，选中摄像机后使用，可以让摄像机视角变为 Scene 中的视角
V: 顶点吸附

# 资源类型
![[Pasted image 20230602232944.png|450]]
# 关闭脚本自动重新编译
1. Unity 的修改
Edit->Prefrence->Asset Pipeline
![[Pasted image 20230607161139.jpg]]

2. Rider 的修改
修改方法： Settings - Languages&Frameworks - Unity Engine - 取消勾选 Automatically refresh assets in Unity
![[Pasted image 20230607161142.jpg]]
3. 想要刷新的时候，手动 ctrl+r

# 模型
骨（骨骼)——非必须，有动作的模型才需要
肉（网格面片)——必须，决定了模型的轮廓
皮 (贴图)——必须，决定了模型的颜色效果

官方推荐使用 FBX 格式的模型文件其它格式虽然支持，但是不推荐
`. fbx/.dae/.3ds/.dxf/.obj`

详细看官方文档
![[Pasted image 20230609135746.png|500]]

**重点规则:**
**Unity 中模型面朝向朝模型坐标系的 Z 轴**
缩放大小单位要注意


# 打包
![[Pasted image 20230610193454.png|600]]
![[Pasted image 20230610193432.png]]


![[Pasted image 20230610194110.png]]

![[Pasted image 20230610194030.png]]

# 后处理
**添加 Bloom 效果**
1. 创建 Post-process Volume  
    直接 Create -> 3D Object -> Post-process Volume，如果使用了 3D 模板，则需要先安装后处理模块。
2. 将 Layer 设置为 Post-process

![[39a325a6efcb8f35acb0b6eabfb27bf3_MD5.webp]]

3. 创建 Profile

![[5ab22688ea075e23c5da3e7a8d3a158d_MD5.webp]]

4. 添加后处理效果  
    点击 Add effect...，选择 Unity -> Bloom。

![[bf9c2cdf8d6485f2bdd4ac86e3491cdb_MD5.webp]]

5. 调整 Bloom 参数

![[9a0b3eee2b319c3bd955c53c6e9bacd3_MD5.webp]]

_这里如果不选 Is Global 可以为局部场景添加后处理效果。_

6. 为相机创建 Post 层  
    点击 Add Component -> Rending -> Post-process Layer。

![[ef7d26d2d4e9a8c1e1c4e97baddb1614_MD5.webp]]

# 设置线性空间

![](1686829466971.png)


# UGUI 的 Pivot (颜色暗淡)位置移动/修改不了了 
![[Pasted image 20230616211600.png]]
发现工具条中，选中了 Center，所以无法操作了(Center ：根据提示的解释，位置锁定在中心了)，修改为 Pivot 即可
![[Pasted image 20230616211614.png]]


# built-in 升级 URP
window->rendering->Render pipleline converter


# 崩溃恢复
unit 有时会遇到 unity 崩溃后，辛辛苦苦做的场景就这么没了的情况，这种情况非常忧伤的，其实 unity 是提供了一种拯救场景的措施的；
**首先 unity 崩溃后不要重新打开 unity，切记，不然就之前的成果就找不回来了**；打开你的工程所在目录，找到 Temp 文件夹（该文件夹正常情况下在工程里是没有的，只有崩溃后才出现，重新打开 unity，该文件夹就会消失），在其中找到_Backupscenes 文件夹，然后打开_Backupscenes 文件夹，找到其中的 0. backup 文件，没错，就是它，将 backup 后缀改成a.unity，然后将文件存放到其他地方去（非 Temp 文件夹）。然后重新打开 unity，将a.unity 文件拖到 unity 中即可；
![[Pasted image 20230814230242.png]]
![[Pasted image 20230814230245.png]]