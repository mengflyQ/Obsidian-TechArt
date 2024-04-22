
# 演示如何构建 Docker file 以生成 image（见 part1）
![[Pasted image 20240422152122.png|749]]

```shell
mkdir mainfolder //创建文件夹
cd mainfolder  //进入文件夹
touch dockerfile //创建dockerfile文件
vi dockerfile //打开

//vi操作
按i键进入插入模式，输入
ESC进入命令行模式，:wq保存

docker image build -t mainfolder . //创建image,注意末尾的.
```

![[Pasted image 20240422155636.png]]

# 示例：将镜像推送到 Dockerhub（见 part3）
![[Pasted image 20240422152717.png]]
```
docker login //登录dockerhub liuke101 liuke1999

```
# 示例：创建 Docker 卷（见 part2）
![[Pasted image 20240422152905.png]] ![[Pasted image 20240422152925.png]]


# 示例：创建 Docker 网络（见 part2）