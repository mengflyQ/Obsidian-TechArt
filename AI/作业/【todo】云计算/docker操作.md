
# 演示如何构建 Docker file 以生成 image（见 part1）
![[Pasted image 20240422152122.png|749]]
Hi, Professor, I'm Ke Liu, and I'm going to show you how to use Docker.
In the first part, I'll show how to build a Docker file to generate the image


```shell
sudo su #  Firstly, getting root privileges
mkdir my-nginx #  then, Creating work Folder
cd my-nginx  #  and  Going to folder
touch dockerfile #  Create a dockerfile file in the working folder
vi dockerfile # Use vi to open the dockerfile, and enter the contents of the dockfile

#vi操作
按i键进入插入模式，输入
ESC进入命令行模式，:wq保存


docker image build -t my-nginx . #Finally we can create the docker image with the command
```


![[Pasted image 20240422215005.png]]
# 示例：将镜像推送到 Dockerhub（见 part3）
In the second part, I will push the image created above to Dockerhub
![[Pasted image 20240422152717.png]]
Sorry, I realised that the above command to get root privileges was wrong, I'll retype the command，Then log in
```shell

docker login #First log in to dockerhub liuke101 liuke1999
docker image tag my-nginx liuke101/my-nginx #Next a new tag is added for the image and then the image can be pushed to Dockehub
docker push liuke101/my-nginx 
docker run -d --name my-nginx liuke101/my-nginx # We can run the container
docker ps -a # We can view all containers
exit #finnaly,You can exit the container when you're done using it
```

![[Pasted image 20240422215125.png]]
# 示例：创建 Docker 卷（见 part2）
![[Pasted image 20240422152905.png]] ![[Pasted image 20240422152925.png]]
In the third part, I will demonstrate how to create and use Docker volumes

1. 创建 volume
```shell
docker volume create my_volume #Firstly, Creating a volume named volume1.
docker volume ls # To see if volume1 has been created
```

![[Pasted image 20240422165828.png]]

2. Then use the docker run command, which will start a container named my-ubuntu and mount the volume1  to the container's /app/data directory.
```
docker run -itd -v my_volume:/usr/dir --name my-ubuntu ubuntu:latest
```
![[Pasted image 20240422170139.png]]
这些

1. 进入 my-ubuntu 容器的 bash shell 中，可以与容器进行交互并执行各种命令
2. Enter the my-ubuntu container's bash shell to interact with the container and execute various commands
![[Pasted image 20240422170211.png]]

1. 进入 my-ubuntu容器的/usr/dir，在该容器中运行 Unbutu命令创建一个 text 文件
2. Go to /usr/dir of the my-ubuntu container and run the Unbutu command to create a text file in that container
   ![[Pasted image 20240422170421.png]]

1. 重新运行容器，可以发现上一步创建的文件还在。实现了容器数据的持久化存储。
2. Re-run the container and you can find that the files created in the previous step are still there. That is to say, the persistent storage of container data is implemented.
   ![[Pasted image 20240422170621.png]]


![[Pasted image 20240422224518.png]]
# 示例：创建 Docker 网络（见 part2）
最后一部分，我将展示如何创建 Docker 网络
创建几个用户定义的网络，并自动分配子网地址
In the last part, I'll show how to create Docker networks
We can use the create command to create several user-defined networks with automatically assigned subnet addresses
```
docker network create net1
```
![[Pasted image 20240422171057.png]]
We can view all network
```
docker network ls
```

After that you can run the container and connect to the network
```
docker run --network net1--name my_container1
docker run --network net2--name my_container2
```
![[Pasted image 20240422172547.png]]
![[Pasted image 20240422172646.png]]


The next step is to be able to communicate with the network between containers


![[Pasted image 20240422222430.png]]