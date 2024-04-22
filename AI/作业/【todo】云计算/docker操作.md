
# 演示如何构建 Docker file 以生成 image（见 part1）
![[Pasted image 20240422152122.png|749]]

```shell
mkdir my-nginx # 创建文件夹
cd my-nginx  # 进入文件夹
touch dockerfile # 创建dockerfile文件
vi dockerfile # 打开

#vi操作
按i键进入插入模式，输入
ESC进入命令行模式，:wq保存

sodu su #进入管理员模式
docker image build -t my-nginx . #创建image,注意末尾的.
```

# 示例：将镜像推送到 Dockerhub（见 part3）
![[Pasted image 20240422152717.png]]
```shell
docker login #登录dockerhub liuke101 liuke1999
docker image tag my-nginx liuke101/my-nginx
docker push liuke101/my-nginx
docker run -d --name my-nginx liuke101/my-nginx # 容器运行
docker ps -a # 查看所有容器
exit #退出容器
```
# 示例：创建 Docker 卷（见 part2）
![[Pasted image 20240422152905.png]] ![[Pasted image 20240422152925.png]]

1. 创建 volume
```shell
docker volume create myvolume # 创建volume
docker volume ls # 查看是否创建
```

![[Pasted image 20240422165828.png]]

2. 该命令将启动一个名为 my-ubuntu 的容器，将 my_volume 卷挂载到容器的 /app/data 目录。
```
docker run -itd -v my_volume:/usr/dir --name my-ubuntu ubuntu:latest
```
![[Pasted image 20240422170139.png]]
这些

3. 进入 my-ubuntu 容器的 bash shell 中，可以与容器进行交互并执行各种命令
![[Pasted image 20240422170211.png]]

4. 进入 my-ubuntu容器的/usr/dir，在该容器中运行 Unbutu命令创建一个 text 文件
   ![[Pasted image 20240422170421.png]]

5. 重新运行容器，可以发现上一步创建的文件还在
   ![[Pasted image 20240422170621.png]]



# 示例：创建 Docker 网络（见 part2）
创建几个用户定义的网络，并自动分配子网地址
```
docker network create net1
```
![[Pasted image 20240422171057.png]]

创建并运行两个容器，连接到不同网络
```
docker run -d --name --network net1 my_container1
docker run -d --name --network net2 my_container2
```
![[Pasted image 20240422172547.png]]
![[Pasted image 20240422172646.png]]
