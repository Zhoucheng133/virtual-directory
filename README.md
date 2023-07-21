# Virtual Directory

## 经过测试的系统
-  macOS 13.4
-  Windows 11

## 效果图

![在macOS上的效果图](_demo/shotcut_macOS.png)

## 使用说明

- 一般步骤：
  1. 打开软件选择需要分享的目录，**注意Windows系统不要选择磁盘的根目录**
  2. 选择是否要添加访问权限，即需要登录之后才能进行访问和操作，**如果你需要在公网中访问务必选择此项**
  3. （如果选择了需要账户密码登录使用）设定用户名和密码
  4. 输入合适的端口号，默认为`8081`，**注意不是所有的端口号都能使用**
  5. 点击`启动服务`
  6. 在局域网内可以通过`IPv4`地址访问到虚拟目录网站，如果你开通了公网服务，在防火墙允许的情况下也可以在公网中通过`IPv6`地址访问到

- 有无互联网连接的区别：

  |                          | 有互联网连接 | 无互联网连接 |
  | ------------------------ | ------------ | ------------ |
  | 启动服务                 | ✅            | ✅            |
  | 在局域网内浏览文件和目录 | ✅            | ✅            |
  | 在局域网内打开文件       | ✅*           | ✅*           |
  | 对不同文件展现不同图标   | ✅            | ❌            |
  | 上传文件                 | ✅            | ❌            |
  | 删除文件                 | ✅            | ❌            |
  | 新建文件夹               | ✅            | ❌            |
  | 重命名文件               | ✅            | ❌            |

  注：

  \* 打开浏览器支持的文件，根据不同浏览器支持范围不同，常见的视频、图片、音频、文本等都可以在浏览器端打开

## 目前最新版本
v2.0 (2023/7/21)

## 更新日志
- ### v2.0.1 (测试中)
  - 支持上传多个文件

- ### v2.0 (2023/7/21)
  - 增加上传文件的功能
  - 增加删除文件的功能
  - 增加重命名文件/文件夹功能
  - 修改样式表的一些bug
  - 添加右键菜单
  - 弹窗适配移动端

- ### v1.0.5 (2023/7/12)
  - 完善浏览器端界面
  - 浏览器端界面添加了很多文件图标

- ### v1.0.4 (2023/7/8)
  - 完善启动判定
  - 增加对Apple Silicon的支持

- ### v1.0.3 (2023/7/7)
  - 避免Windows用户选中系统文件夹
  - 避免macOS用户选中根目录
  - 解决重复调用函数的问题
  - 在macOS上点击红色按钮修改为退出（原先为关闭窗口）

- ### v1.0.2 (2023/7/6)
  - 解决下载文件名乱码的问题
  - 解决下载文件时无法获取文件大小和剩余时间的问题
  - 增加记住上一次输入的功能

- ### v1.0.1 (2023/7/5)
  - 增加图标
  - 改进Windows界面
  - 对IPv6不支持的情况做提示
  - 启动失败提示

- ### v1.0 (2023/7/5)
  - 第一个版本

## 关于代码
使用Electron 13和Vue 2开发，使用到的库：

- Ant design (UI库)
- Bootstrap (图标库)
- Axios (网络请求)
- Element (UI库)
- base-64 (登录授权加密)

## 一些注意事项
- 如果你需要在公网中访问，**不要设置常用的端口号**，例如`8080`，可能会导致无法访问
- 如果你需要在公网中访问，**确保你的互联网环境支持在公网中访问**，一般来说需要支持IPv6的网络
- 如果你需要在公网中访问，一些路由器或者你的电脑会使用防火墙拦截，**不要完全开放防火墙**，务必确保连接的安全性
- 本项目可能存在一定问题，欢迎提出问题和指正
- 如果你想要根据本项目进行二次开发，请保证你的二次开发也是开源项目

## 关于配置
如果你希望在自己的电脑中配置该项目，以下为操作步骤：

1. 安装`node`，推荐版本为`node@14.18`或者`node@16`
2. 使用命令行进入到项目文件夹
3. 输入命令：
   ```bash
   npm install
   ```
   如果你更喜欢使用`yarn`，首先确保你已经安装了`yarn`，然后在命令行中输入：
   ```bash
   yarn install
   ```
4. 接着输入命令来运行(`serve`)或生成(`build`)：
   ```bash
   npm run electron:serve
   npm run electron:build
   ```
   或者`yarn`：
   ```bash
   yarn run electron:serve
   yarn run electron:build
   ```