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
					<div>
						<svg class="toGit" @click="openGithub" width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4ZM0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z" fill="#000000"/><path fill-rule="evenodd" clip-rule="evenodd" d="M19.1833 45.4716C18.9898 45.2219 18.9898 42.9973 19.1833 38.798C17.1114 38.8696 15.8024 38.7258 15.2563 38.3667C14.437 37.828 13.6169 36.1667 12.8891 34.9959C12.1614 33.8251 10.5463 33.64 9.89405 33.3783C9.24182 33.1165 9.07809 32.0496 11.6913 32.8565C14.3044 33.6634 14.4319 35.8607 15.2563 36.3745C16.0806 36.8883 18.0515 36.6635 18.9448 36.2519C19.8382 35.8403 19.7724 34.3078 19.9317 33.7007C20.1331 33.134 19.4233 33.0083 19.4077 33.0037C18.5355 33.0037 13.9539 32.0073 12.6955 27.5706C11.437 23.134 13.0581 20.2341 13.9229 18.9875C14.4995 18.1564 14.4485 16.3852 13.7699 13.6737C16.2335 13.3589 18.1347 14.1343 19.4734 16.0001C19.4747 16.0108 21.2285 14.9572 24.0003 14.9572C26.772 14.9572 27.7553 15.8154 28.5142 16.0001C29.2731 16.1848 29.88 12.7341 34.5668 13.6737C33.5883 15.5969 32.7689 18.0001 33.3943 18.9875C34.0198 19.9749 36.4745 23.1147 34.9666 27.5706C33.9614 30.5413 31.9853 32.3523 29.0384 33.0037C28.7005 33.1115 28.5315 33.2855 28.5315 33.5255C28.5315 33.8856 28.9884 33.9249 29.6465 35.6117C30.0853 36.7362 30.117 39.948 29.7416 45.247C28.7906 45.4891 28.0508 45.6516 27.5221 45.7347C26.5847 45.882 25.5669 45.9646 24.5669 45.9965C23.5669 46.0284 23.2196 46.0248 21.837 45.8961C20.9154 45.8103 20.0308 45.6688 19.1833 45.4716Z" fill="#000000"/></svg>
					</div>
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