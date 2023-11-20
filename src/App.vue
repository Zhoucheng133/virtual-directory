<template>
	<div id="app">
		<div class="titleBar">
			<div class="dragArea" style="width: 100%;"></div>
			<div class="min" @click="winMin" v-if="sys!='macOS'"><a-icon type="minus" /></div>
			<div class="close" @click="winClose" v-if="sys!='macOS'"><a-icon type="close" /></div>
		</div>
		<div class="main">
			<div class="title">Virtual Directory</div>
			<div class="container">
				<div class="row">
					<div class="cell">
						本地目录
					</div>
				</div>
				<div class="row">
					<div class="cell">
						<a-input disabled v-model="inputPath"></a-input>
					</div>
					<div class="cell" style="padding-left: 10px;">
						<a-button @click="pickDir" :disabled="status">选取目录</a-button>
					</div>
				</div>
				<div class="row">
					<div class="cell">
						安全设置
					</div>
				</div>
				<div class="row">
					<div class="cell">
						<a-radio-group v-model="secure" :disabled="status" button-style="solid">
							<a-radio-button value="all">
								所有人
							</a-radio-button>
							<a-radio-button value="userOnly">
								仅指定用户
							</a-radio-button>
						</a-radio-group>
					</div>
				</div>
				<div class="row">
					<div class="cell">用户设置</div>
				</div>
				<div class="row1">
					<div class="cell" style="padding-right: 5px;">
						<a-input v-model="inputName" placeholder="用户名" :disabled="secure=='all'||status"></a-input>
					</div>
					<div class="cell" style="padding-left: 5px;">
						<a-input-password v-model="inputPass" placeholder="密码" :disabled="secure=='all'||status"></a-input-password>
					</div>
				</div>
				<div class="row1">
					<div class="cell">打开/复制链接</div>
				</div>
				<div class="row3">
					<div class="cell">
						<a-button-group>
							<a-button type="primary" :disabled="!status" style="width: 70px;" @click="openLink">打开</a-button>
							<a-button :disabled="!status" style="width: 115px;" @click="copyIPv4">复制IPv4链接</a-button>
							<a-button :disabled="!status" style="width: 115px;" @click="copyIPv6">复制IPv6链接</a-button>
						</a-button-group>
					</div>
				</div>
				<div class="row">
					<div class="cell">
						端口号
					</div>
				</div>
				<div class="row1">
					<div class="cell">
						<a-input-number v-model="inputPort" :disabled="status" style="width: 145px;"></a-input-number>
					</div>
					<div class="cell" style="padding-left: 5px;">
						<a-button :type="status==false?'primary':'danger'" block @click="serverButton">{{ status==false?'启动服务':'关闭服务' }}</a-button>
					</div>
				</div>
				<div class="end">
					<div>{{ version }}</div>
					<div><i class="bi bi-github toGit" @click="openGithub"></i></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
const {shell} = require('electron')
export default {
	beforeDestroy(){
      ipcRenderer.removeAllListeners('serverOffResponse');
      ipcRenderer.removeAllListeners('serverOnResponse');
      ipcRenderer.removeAllListeners('getDir');
      ipcRenderer.removeAllListeners('getIpResponse');
      ipcRenderer.removeAllListeners('getSysResponse');
    },
	data() {
		return {
			inputName:"",
			inputPass:"",
			secure:"all",
			inputPort:8081,
			inputPath:"",
			status:false,
			IPv4:"",
			IPv6:"",
			sys:"",
			version: '',

			isDestroyed: false,
		}
	},
	methods: {
		// 关闭窗口
		winClose(){
			ipcRenderer.send('winClose');
		},
		// 最小化窗口
		winMin(){
			ipcRenderer.send('winMin');
		},
		// 在Gitee中打开
		openGithub(){
			shell.openExternal('https://github.com/Zhoucheng133/virtual-directory');
		},
		// 打开链接
		openLink(){
			shell.openExternal("http://"+this.IPv4+":"+this.inputPort);
		},
		// 复制IPv6地址
		copyIPv6(){
			if(this.IPv6!=""&&this.IPv6!=undefined){
				this.doCopy("http://["+this.IPv6+"]:"+this.inputPort);
			}else{
				this.$error({
					title: '复制失败',
					content: '当前没有IPv6地址',
				});
			}
		},
		// 复制IPv4地址
		copyIPv4(){
			if(this.IPv4!=""&&this.IPv4!=undefined){
				this.doCopy("http://"+this.IPv4+":"+this.inputPort);
			}else{
				this.$error({
					title: '复制失败',
					content: '当前没有IPv4地址',
				});
			}
		},
		// 复制
		doCopy(val) {
			this.$copyText(val).then(function () {
			}, function () {
				this.$error({
					title: '复制失败',
					content: '稍后重试',
				});
			})
		},
		// 按下启动/关闭服务按钮
		serverButton(){
			if(this.status==false){
				if(this.inputPath=="" || this.inputPath==undefined || this.inputPath=="undefined"){
					this.$error({
						title: '启动失败',
						content: '没有选取目录',
					});
					return;
				}
				if(this.secure=="userOnly" && (this.inputName=="" || this.inputPass=="")){
					this.$error({
						title: '启动失败',
						content: '在指定用户模式下，用户名和密码不能为空',
					});
					return;
				}
				if(this.inputPort==null || this.inputPort<=1024 || this.inputPort=="" || this.inputPort==undefined || this.inputPort=="undefined"){
					this.$error({
						title: '启动失败',
						content: '端口号不合法，输入大于1024的端口号',
					});
					return;
				}
				if(this.sys=="Windows"){
					const regex = /^[A-Z]:\\$/;
					if (regex.test(this.inputPath)) {
						this.$error({
							title: '启动失败',
							content: 'Windows系统不能选择磁盘根目录',
						});
						return;
					}
					if(this.inputPath.startsWith("C:\\")){
						if(!this.inputPath.startsWith("C:\\Users")){
							this.$error({
								title: '启动失败',
								content: '不允许访问的目录',
							});
							return;
						}
					}
				}else{
					if(this.inputPath=="/"){
						this.$error({
							title: '启动失败',
							content: '不允许访问的目录',
						});
						return;
					}
				}
				var tmpName="";
				var tmpPass="";
				if(this.secure=="userOnly"){
					tmpName=this.inputName;
					tmpPass=this.inputPass;
				}
				this.serverOn(this.inputPath,this.inputPort,tmpName,tmpPass);
			}else{
				this.serverOff();
			}
		},
		// 初始化（如果存在）变量
		getValue(){
			if(localStorage.getItem("path")!=null){
				this.inputPath=localStorage.getItem("path");
			}
			if(localStorage.getItem("secureMode")!=null){
				this.secure=localStorage.getItem("secureMode");
			}
			if(localStorage.getItem("username")!=null){
				this.inputName=localStorage.getItem("username");
			}
			if(localStorage.getItem("password")!=null){
				this.inputPass=localStorage.getItem("password");
			}
			if(localStorage.getItem("port")!=null){
				this.inputPort=localStorage.getItem("port");
			}
		},
		// 关闭服务反馈
		serverOffResponse(event,val){
			if(val=="success"){
				this.status=false;
			}else{
				this.$error({
					title: '关闭服务失败',
					content: '你可以强行关闭此程序',
				});
			}
		},
		// 开启服务反馈
		serverOnResponse(event,val){
			if(this.isDestroyed)
				return;
			if(val=="success"){
				this.status=true;
				localStorage.setItem("path",this.inputPath);
				localStorage.setItem("secureMode",this.secure);
				localStorage.setItem("username",this.inputName);
				localStorage.setItem("password",this.inputPass);
				localStorage.setItem("port",this.inputPort);
			}else{
				this.$error({
					title: '启动服务失败',
					content: '可能是端口占用，你可以尝试修改其它端口号',
				});
			}
		},
		// 获取系统信息
		getSysResponse(event,val){
			this.sys=val;
		},
		// 获取IP地址反馈
		getIpResponse(event,val1,val2){
			this.IPv4=val1[0];
			if(val2!=[]){
				const filteredArray = val2.filter(item => !item.startsWith("fe80"));
				this.IPv6=filteredArray[0];
			}
		},
		// 获取地址反馈
		getDir(event,val){
			this.inputPath=val;
		},
		// 获取IP地址反馈
		getIP(){
			ipcRenderer.send('getIP');
		},
		// 请求选择目录
		pickDir(){
			ipcRenderer.send("selectDir");
		},
		// 请求启动服务
		serverOn(path,port,username,password){
			ipcRenderer.send('serverOn', path,port,username,password);
		},
		// 请求关闭服务
		serverOff(){
			ipcRenderer.send('serverOff');
		}
	},
	created() {
		ipcRenderer.on('serverOffResponse',this.serverOffResponse)
		ipcRenderer.on('serverOnResponse',this.serverOnResponse)
		ipcRenderer.on('getDir', this.getDir);
		ipcRenderer.on('getIpResponse', this.getIpResponse);
		ipcRenderer.on("getSysResponse",this.getSysResponse)

		ipcRenderer.send('getIP');
		ipcRenderer.send("getSys");

		this.getValue();
		this.version = process.env.VUE_APP_VERSION
		document.title="Virtual Directory";
	},
}
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
}
</style>

<style scoped>
.toGit:hover{
	color: #1890ff;
	cursor: pointer;
}
.toGit{
	transition: all ease-in-out .3s;
	width: auto;
}
.end{
	font-size: 13px;
	padding-top: 45px;
	color: gray;
}
.row3{
	padding-bottom: 5px;
	display: grid;
	grid-template-columns: 300px;
}
.cell{
	display: flex;
	align-items: center;
}
.row1{
	padding-bottom: 5px;
	display: grid;
	grid-template-columns: 150px 150px;
}
.row{
	padding-bottom: 5px;
	display: grid;
	grid-template-columns: 200px 100px;
}
.container{
	padding-top: 30px;
	display: grid;
}
.main{
	display: flex;
	flex-direction: column;
	align-items: center;
	user-select: none;
	padding-top: 30px;
}
.close:hover{
	background-color: rgb(200, 0, 0);
	color: white;
	cursor: pointer;
}
.min:hover{
	background-color: rgb(202, 202, 202);
	cursor: pointer;
}
.min{
	font-size: 17px;
	transition: all ease-in-out .2s;
	height: 100%;
	display: flex;
	justify-content: center;
	width: 40px;
	align-items: center;
}
.close{
	background-color: red;
	color: white;
	transition: all ease-in-out .2s;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 40px;
	font-size: 17px;
}
.dragArea{
	-webkit-app-region: drag;
	height: 30px;
}
.titleBar{
	display: flex;
	justify-content: flex-end;
	align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    height: 30px;
    width: 100%;
}
</style>