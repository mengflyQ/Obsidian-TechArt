[【如何将原神的角色导入Unity】全网最细致教程，全程干货。不使用任何收费插件，使用Spring Bone对头发和衣服进行物理模拟。_原神 (bilibili.com)](https://www.bilibili.com/video/BV1G34y127e6/?spm_id_from=333.337.search-card.all.click&vd_source=9d1c0e05a6ea12167d6e82752c7bc22a)
# 原神模型导入Unity

### 三、pmx 转 fbx

我们下载下来后，模型的格式是`pmx`，  

![[36ad736dc34fe0c30d1a2a09b9e2e020_MD5.png]]

我们需要把它转为`fbx`格式才能导入`Unity`中使用。`pmx`转`fbx`可以通过`Blender`来转，刚好我之前自学了`Blender`，也写过几篇`Blender`配合`Unity`的文章，大家感兴趣的可以看看：  

#### 2、Cats 插件下载与安装

`Blender`是开源免费的，轻量又强大，易于上手，很适合个人独立开发者学习和使用，它具有丰富的插件生态，就像`VSCode`一样，我们这里要将`pmx`转为`fbx`格式，就需要用到一个`Cats`插件。  
`Cats`插件自身也是开源的，我们直接从`GitHub`上下载。  
地址：[https://github.com/GiveMeAllYourCats/cats-blender-plugin](https://github.com/GiveMeAllYourCats/cats-blender-plugin)  
如下，点击`Cats Blender Plugin`，下载下来的是一个`zip`文件，  

![[59eb10b97bc43a571a7462ea59b0159f_MD5.png]]

  
现在我们打开`Blender`，然后点击菜单`Edit / Preferences`，打开偏好设置窗口，  

![[616d44d4f2c7cfe1a4c3b93769c07b4e_MD5.png]]

  
点击`Add ons`，然后点击`install`按钮，  

![[ad507abfb16b861a0176833bd31e101f_MD5.png]]

  
然后选择我们刚刚下载的`Cats`插件文件，点击`Install Add-on`，  

![[13f26a08fb89fe8e809b921b3b64b661_MD5.png]]

  
安装完毕后，记得勾选上它，（如果你没勾选，插件就是禁用状态的）  

![[681ea35959fa143e8ea5d970ad709571_MD5.png]]

  
现在，我们就可以在编辑区的侧边栏那里看到`CATS`插件了，（注：侧边栏显示和隐藏的快捷键是`N`）  

![[1e7055e0cb198620f206785d3e9d3fc2_MD5.gif]]

#### 3、导入 pmx 模型

我们在`CATS`插件中点击`Import Model`按钮，  

![[a97c69547f79cc83344a3838b0401288_MD5.png]]

  
然后选择`pmx`文件，点击`Import Any Model`按钮，  

![[d2eb775efaef14fc123e617e1a37affe_MD5.png]]

  
此时导进来的模型的材质有问题，是这样子的，  

![[b450a231cfe27ad1ce25aa3d4062cde7_MD5.png]]

#### 4、修复材质问题

我们打开侧边栏的`Misc`，然后点击`Shadeless`（即使用卡通材质），  

![[5c344c157ff1190ca8c5ebbee9a313e6_MD5.png]]

  
此时我们就可以看到正常显示了，  

![[8290f2d4e3ba22622d940279bc5c643f_MD5.png]]

  
看下细节  

![[2eb05662c3e0a3f9c201310ef5ee6204_MD5.png]]

  

![[348aa37b621f82bba8d08bb5fdca3f15_MD5.png]]

#### 5、修复模型：Fix [Model](https://so.csdn.net/so/search?q=Model&spm=1001.2101.3001.7020)

我们可以看到，模型的节点命名并不是按照`Unity`骨骼映射的英文命名，  

![[41c4033c724e41de37ded455d5304ca1_MD5.png]]

  
我们点击`CATS`插件的`Fix Model`按钮，即可自动进行修复，除此之外，它还会帮我们删除多余无用的骨骼，将使用同一张贴图的节点合并为一个`Mesh`并重命名为`Body`等，  

![[6604993ffb0484af2bd04c3e25c28898_MD5.png]]

  
修复后可以看到变成英文命名了，  

![[e14a5fe17b1f511c9f3f1b8320966c61_MD5.png]]

#### 6、导出 fbx

点击`CATS`插件的`Export Model`按钮，即可导出`fbx`文件，  

![[d821d4c499fe0c904c9078bda4d86dcb_MD5.png]]

  
建议导出`fbx`文件放在`pmx`文件同级目录中，  

![[465e190f59ba42ac162e67a75b3a5e15_MD5.png]]

  
如下，  

![[cc3716ad6226fa20c9efea28b5994a6f_MD5.png]]

### 四、Unity 部分

#### 1、导入 fbx 和贴图

我们上面的`fbx`文件和`tex`文件夹（里面是贴图）一起拷贝到`Unity`工程中，（如果你没有拷贝`tex`文件夹，在`Unity`中显示的就是白模）  

![[0b464c745679b59eb0e2241279aafe6f_MD5.png]]

  
此时我们把模型拖入场景中，看到的效果是这样的，  

![[5bb43960fd8cdce25d738011734f4019_MD5.png]]

#### 2 提取材质
![[Pasted image 20230807170534.png]]
#### 3、卡通渲染

卡通渲染不像 `PBR`那样有标准流程和衡量准则，可以说卡通渲染是人们主观审美 + 现实环境抽象的结合，不同人对卡通渲染的理解理念不同，不过随着卡通渲染的不断发展，也形成了一套固定思路。

##### 3.1、简单粗暴，使用 Unlit/Texture

最粗暴的方式就是直接使用`Unlit`材质，在贴图上表现出卡通效果。  
我们把材质球的`shader`全部改成`Unlit/Texture`（也就是无光照模型，直接显示贴图纹理），  

![[bd64269e3c7cb9ebf2781fa5f78f3cf4_MD5.png]]

  
效果如下：  

![[26d074d923b4ea9b4ede8d97ae08a1c5_MD5.gif]]

  
当然，这过于简单了，缺点很明显，没有光照效果。

##### 3.2、基于光照的卡通渲染

我们对比看下原神游戏中的画面效果，是一种次时代卡通效果。我们可以看到，它是有光照效果的，太阳在右侧，人物面朝太阳方向时，光照面会有高光，背面会有阴影；当背朝太阳时则相反。  

![[3167c14c7f56fc00493f84c1a6f1f7fe_MD5.gif]]

  
我们需要考虑光照，也就是基于光照模型的卡通渲染。

##### 3.3、UnityToonShader 项目

基于光照模型的卡通渲染，我在`GitHub`上找到了一个项目，地址：[https://github.com/Sorumi/UnityToonShader](https://github.com/Sorumi/UnityToonShader)  
如果你访问不了`GitHub`，可以访问我的`CODE CHINA`，我已将它`Fork`过来了，  

![[91f283da82951250aa3a289df5c392e0_MD5.png]]

  

![[dab8b0544358130dc17aa44e2b461b35_MD5.png]]

##### 3.4、ToonMultiStepShader.shader

进入上面这个项目的`Assets/Shaders`目录，可以看到一些`shader`脚本，我使用的是这个`ToonMultiStepShader.shader`，  

![[efc696ea4461e43d86fa87a1aed15138_MD5.png]]

  
`shader`代码如下：

```
Shader "Toon/Basic/MultiSteps"
{
    Properties
    {
        // 颜色
        _Color ("Color", Color) = (1, 1, 1, 1)
        _HColor ("Highlight Color", Color) = (0.8, 0.8, 0.8, 1.0)
        _SColor ("Shadow Color", Color) = (0.2, 0.2, 0.2, 1.0)
        
        // 贴图
        _MainTex ("Main Texture", 2D) = "white" { }
        
        // 渐变
        _ToonSteps ("Steps of Toon", range(1, 9)) = 2
        _RampThreshold ("Ramp Threshold", Range(0.1, 1)) = 0.5
        _RampSmooth ("Ramp Smooth", Range(0, 1)) = 0.1
        
        // 镜面
        _SpecColor ("Specular Color", Color) = (0.5, 0.5, 0.5, 1)
        _SpecSmooth ("Specular Smooth", Range(0, 1)) = 0.1
        _Shininess ("Shininess", Range(0.001, 10)) = 0.2
        
        // 边缘
        _RimColor ("Rim Color", Color) = (0.8, 0.8, 0.8, 0.6)
        _RimThreshold ("Rim Threshold", Range(0, 1)) = 0.5
        _RimSmooth ("Rim Smooth", Range(0, 1)) = 0.1
    }
    
    SubShader
    {
        Tags { "RenderType" = "Opaque" }
        
        CGPROGRAM
        
        #pragma surface surf Toon addshadow fullforwardshadows exclude_path:deferred exclude_path:prepass
        #pragma target 3.0
        // 基础色
        fixed4 _Color;
        // 高光颜色
        fixed4 _HColor;
        // 阴影色
        fixed4 _SColor;
        // 主贴图
        sampler2D _MainTex;
        // 渐变阈值
        float _RampThreshold;
        // 渐变平滑度
        float _RampSmooth;
        // 渐变阶数
        float _ToonSteps;
        // 镜面平滑度
        float _SpecSmooth;
        // 光滑度
        fixed _Shininess;
        // 边缘颜色
        fixed4 _RimColor;
        // 边缘阈值
        fixed _RimThreshold;
        // 边缘光滑度
        float _RimSmooth;
        
        struct Input
        {
            float2 uv_MainTex;
            float3 viewDir;
        };
        
        // 线性阶跃
        float linearstep(float min, float max, float t)
        {
            return saturate((t - min) / (max - min));
        }
        
        inline fixed4 LightingToon(SurfaceOutput s, half3 lightDir, half3 viewDir, half atten)
        {
            half3 normalDir = normalize(s.Normal);
            half3 halfDir = normalize(lightDir + viewDir);
            
            float ndl = max(0, dot(normalDir, lightDir));
            float ndh = max(0, dot(normalDir, halfDir));
            float ndv = max(0, dot(normalDir, viewDir));
            
            // 平滑阶跃
            float diff = smoothstep(_RampThreshold - ndl, _RampThreshold + ndl, ndl);
            float interval = 1 / _ToonSteps;
            // float ramp = floor(diff * _ToonSteps) / _ToonSteps;
            float level = round(diff * _ToonSteps) / _ToonSteps;
            float ramp ;
            if (_RampSmooth == 1)
            {
                ramp = interval * linearstep(level - _RampSmooth * interval * 0.5, level + _RampSmooth * interval * 0.5, diff) + level - interval;
            }
            else
            {
                ramp = interval * smoothstep(level - _RampSmooth * interval * 0.5, level + _RampSmooth * interval * 0.5, diff) + level - interval;
            }
            ramp = max(0, ramp);
            ramp *= atten;
            
            _SColor = lerp(_HColor, _SColor, _SColor.a);
            float3 rampColor = lerp(_SColor.rgb, _HColor.rgb, ramp);
            
            // 镜面
            float spec = pow(ndh, s.Specular * 128.0) * s.Gloss;
            spec *= atten;
            spec = smoothstep(0.5 - _SpecSmooth * 0.5, 0.5 + _SpecSmooth * 0.5, spec);
            
            // 边缘
            float rim = (1.0 - ndv) * ndl;
            rim *= atten;
            rim = smoothstep(_RimThreshold - _RimSmooth * 0.5, _RimThreshold + _RimSmooth * 0.5, rim);
            
            fixed3 lightColor = _LightColor0.rgb;
            
            fixed4 color;
            fixed3 diffuse = s.Albedo * lightColor * rampColor;
            fixed3 specular = _SpecColor.rgb * lightColor * spec;
            fixed3 rimColor = _RimColor.rgb * lightColor * _RimColor.a * rim;
            
            color.rgb = diffuse + specular + rimColor;
            color.a = s.Alpha;
            return color;
        }
        
        // 表面着色器
        void surf(Input IN, inout SurfaceOutput o)
        {
            fixed4 mainTex = tex2D(_MainTex, IN.uv_MainTex);
            o.Albedo = mainTex.rgb * _Color.rgb;
            
            o.Alpha = mainTex.a * _Color.a;
            
            o.Specular = _Shininess;
            o.Gloss = mainTex.a;
        }
        
        ENDCG
        
    }
    FallBack "Diffuse"
}
```

将其导入`Unity`工程中，  

![[c1684bfc960eb7e1bd96d7d7218906e2_MD5.png]]

##### 3.5、材质球设置

把材质球的`shader`改为`Toon/Basic/MultiSteps`，如下  

![[71f3ea40e13a72b0ca08366e10a3e157_MD5.png]]

  
调整一下高光、阴影、渐变阈值、镜面、边缘等参数，  

![[1944d866816e29ea0fafa4a3e4c2402e_MD5.png]]

##### 3.6、效果演示

效果如下，我们在修改太阳光方向，观察不同角度的效果，  

![[939bd0c28bae2abae588ebba2ef080ed_MD5.gif]]

![[80414693c0ea94327dfb39aeafc2ced8_MD5.gif]]

#### 4、添加动画

我们要给角色添加动画，加入你现在已有一些人形骨骼动画，想套用在原神的模型上，怎么弄呢？我来教你~

##### 4.1、人形动画资源获取

假设你手头上没有人形动画，这个时候，我就要推荐你一个高级网站了：`Mixamo`，地址：[https://www.mixamo.com/](https://www.mixamo.com/)

`Mixamo`是`Adobe`旗下的一个产品，可以上传静态人形模型文件，在网站上绑定人形模板动画，并可以下载绑定动画后的模型文件。

我之前有写过一篇文章专门介绍这个网站：[《在线免费角色动画网站：mixamo》](https://blog.csdn.net/linxinfa/article/details/103798826)  

![[903c94b1bb1d3eae5777062c46fe8153_MD5.gif]]

  
我们选择一个喜欢的动作，比如我选这个  

![[7ec38626435bd50ecd1a6338a7940400_MD5.gif]]

点击`Download`按钮，  

![[a8ed1f6f24a54fe09fe3ec4dfce397eb_MD5.png]]

格式选择`FBX`，不要包含网格（选`Without Skin）`，然后点击`DOWNLOAD`，  

![[a5dfc80f527fa421a6d786540ca9024c_MD5.png]]

  
这样我们就得到了一个含动画的`fbx`文件，  

![[b62051e9a1e86bd9f2b2ab3b059a937b_MD5.png]]

##### 4.2、设置人形动画

我们把动画`fbx`文件导入`Unity`中，如下  

![[f8e012ce9dab66525c93a6668be52d42_MD5.png]]

选中动画`fbx`文件，在`Inspector`窗口中点击`Rig`，把`Animation Type`设置为`Humanoid`，然后点击`Apply`，  

![[4d3cb7f099fb4131ef7693a5d763cd03_MD5.png]]

此时我们点击`Configure`，可以看到人形动画`Avatar`的绑定信息，  

![[a9068c58c663f359d0c9c100671c095e_MD5.png]]

如下  

![[0c206fe54dfa700b3a80378a694e750a_MD5.png]]

同样的，把我们原神的`fbx`模型的`Animation Type`也改为`Humanoid`，  

![[71d27596c8c13976e09d8c5e0a9fa7fb_MD5.png]]

同样点击`Configure`按钮，检查一下`Avatar`，  

![[7807e608adea5d202c70e0e0c06c93c6_MD5.png]]

##### 4.3、添加 Animator 动画

最后一步，把动画文件拖给模型父节点，此时会自动挂一个`Animator`组件，我们设置一下`Avatar`对象，如下  

![[b04f95e0ff772af94a9ce5694e1d7da7_MD5.gif]]

  
注意，如果要让动画循环播放，需要把动画的`Loop Time`勾选上，如下  

![[58ba5f11668a28555d9991a636e83abd_MD5.gif]]

##### 4.4、运行效果

加个背景图，运行效果如下，  

![[d5d17bfdc8f08ffd2ff596a6de896540_MD5.gif]]

  
`emmmm`，还是少一点效果，我们加上泛光屏幕后处理，如下  

![[000583e1f8dff4328904855180717fa7_MD5.png]]

  

![[3fbe3998e227135b3223d4e3cb894e77_MD5.gif]]

注：关于屏幕后处理，我在之前一些文章中与讲到，可以看我之前的文章：  
[《【游戏仿真实验】使用 Unity 仿真电视机光学三原色显示画面，我是要成为海贼王的男人》](https://blog.csdn.net/linxinfa/article/details/119845923)  
[《Unity 后处理（图像优化特效技术），实现影视级别的镜头效果，辅助标签：PostProcessing》](https://blog.csdn.net/linxinfa/article/details/108283232)

好了，剩下的就是大家自由发挥了，添加一些其他动画，进行组合、控制。  
关于`Animator`动画控制，我之前写过相关教程，推荐大家看下，[《Unity 动画状态机 Animator 使用》](https://blog.csdn.net/linxinfa/article/details/94392971)

### 四、Demo 工程下载

本文`Demo`工程我已上传到`CODE CHINA`，感兴趣的同学可自行下载学习，  
地址：[https://codechina.csdn.net/linxinfa/MiHoYoModelTest](https://codechina.csdn.net/linxinfa/MiHoYoModelTest)  

![[22d3b14898cef5e6a13a9afcc077403a_MD5.png]]

  

![[a0f3e4d4c69816140aa05ab6252c7e00_MD5.png]]

### 五、完毕

好啦，就到这里吧~  
我是林新发：[https://blog.csdn.net/linxinfa](https://blog.csdn.net/linxinfa)  
原创不易，若转载请注明出处，感谢大家~  
喜欢我的可以点赞、关注、收藏，如果有什么技术上的疑问，欢迎留言或私信~