
# 空引用异常
![[Pasted image 20230603150831.png]]
通常是因为引用没有赋予对象
![[Pasted image 20230603150906.png]]


# WebGL
## 构建后运行报错
Unable to parse Build/Output. framework. js. gz! This can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with HTTP Response Header "Content-Encoding: gzip" present. Check browser Console and Devtools Network tab to debug
![[Pasted image 20230606172742.png]]
解决办法：PlayerSetting->Player->Publishing Setting

把 DecomPression Fallback 勾选上

![[df9c070f38ea98465d61c671777f94a9_MD5.png]]

这个时候发布出来就能正常运行，但是它不是全屏的：