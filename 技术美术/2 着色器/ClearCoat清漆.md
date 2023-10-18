

## **ClearCoat 清漆**

传统的 PBR 可以很好地模拟出各项同性的单层表面的光照模型，但是对于多层材质就很难模拟出。比如常见的清漆效果 (ClearCoat)。

![](1683732887501.png)

以下图片是一个对比:

![](1683732887582.png)

为了模拟这种清漆效果，可以再原 PBR 的基础上加一个二级高光，但要保证能量守恒，那么能量守恒公式可以这么描述:

![](1683732887926.png)

对于清漆材质，物体的表面分为两部分，上面的一部分是 ClearCoatLayer 下面的部分是 BaseLayer，一束光入射到表面，一部分光直接反射出去 (ClearCoat 高光，且忽略这部分光的漫反射), 另一部分进入 BaseLayer，再分为漫反射与 GGX 高光反射出去。

![](1683732888003.png)

那么现在要解决的问题就是: 有多少光进入了 BaseLayer？ 为了解决这个问题，引入了两个参数，ClearCoatRoughness 用来描述清漆表面的粗糙度以及 ClearCoatIntensity 用来描述清漆反射的强度。清漆表面的菲尼尔反射部分属于 ClearCoatLayer 的能量，剩下的进入 BaseLayer。用公式描述:

![](1683732888106.png)

ClearCoat 高光用 GGX 来描述，因为 GGX 中有 Fresnel 部分就不用额外在额外乘以菲尼尔项了。公式可以简化为:

![](1683732888268.png)

对于直接光部分的代码

```
//Diffuse为直接光漫反射,Specular为直接光高光
float3 DirectLight = (Diffuse + Specular)*NL *Radiance;
float F_ClearCoat = F_FrenelSchlick(HV,0.04)*_ClearCoat;
float3 Specular_ClearCoat = Specular_GGX(N,L,H,V,NV,NL,HV,_RoughnessClearCoat,0.04)*_ClearCoat;
//保证能量守恒
DirectLight = DirectLight * (1-F_ClearCoat) + Specular_ClearCoat;
```

对于间接光部分的代码

```
//Diffuse_Indirect为间接光漫反射,Specular_Indirect为间接光高光
IndirectLight = (Diffuse_Indirect + Specular_Indirect);
float3 Specular_Indirect_ClearCoat = SpecularIndirect(N,V,_RoughnessClearCoat,0.04)*_ClearCoat;
float3 F_IndirectLight_ClearCoat = FresnelSchlickRoughness(NV,0.04,_RoughnessClearCoat)*_ClearCoat;
//保证能量守恒
IndirectLight = IndirectLight*(1-F_IndirectLight_ClearCoat) +Specular_Indirect_ClearCoat;
```

最后结果:

![](1683732888347.png)

完整代码连接:

[https://github.com/ipud2/Unity-Basic-Shader/blob/master/%E5%85%89%E7%85%A7%E6%A8%A1%E5%9E%8B/ClearCoat.shader](https://github.com/ipud2/Unity-Basic-Shader/blob/master/%E5%85%89%E7%85%A7%E6%A8%A1%E5%9E%8B/ClearCoat.shader)
