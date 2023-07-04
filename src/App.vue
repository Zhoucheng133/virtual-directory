<template>
	<div id="app">
		<div class="dragArea"></div>
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
					<div>v1.0</div>
					<div class="toGit" @click="openGitee">Virtual Directory on Gitee</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
const {shell} = require('electron')
export default {
	data() {
		return {
			inputName:"",
			inputPass:"",
			secure:"all",
			inputPort:8081,
			inputPath:"",
			status:false,
			IPv4:"",
			IPv6:""
		}
	},
	methods: {
		openGitee(){
			shell.openExternal("https://gitee.com/Ryan-zhou/virtual-directory");
		},
		openLink(){
			shell.openExternal("http://"+this.IPv4+":"+this.inputPort);
		},
		copyIPv6(){
			if(this.IPv6!=""){
				this.doCopy("http://["+this.IPv6+"]:"+this.inputPort);
			}else{
				this.$error({
					title: '复制失败',
					content: '当前没有IPv6地址',
				});
			}
		},
		copyIPv4(){
			if(this.IPv4!=""){
				this.doCopy("http://"+this.IPv4+":"+this.inputPort);
			}else{
				this.$error({
					title: '复制失败',
					content: '当前没有IPv4地址',
				});
			}
		},
		doCopy(val) {
			this.$copyText(val).then(function () {
			}, function () {
				this.$error({
					title: '复制失败',
					content: '稍后重试',
				});
			})
		},
		serverButton(){
			if(this.status==false){
				if(this.inputPath==""){
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
				if(this.inputPort==null || this.inputPort<=1024){
					this.$error({
						title: '启动失败',
						content: '端口号不合法，输入大于1024的端口号',
					});
					return;
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
		serverOnResponse(event,val){
			if(val=="success"){
				this.status=true;
			}
		},
		getIpResponse(event,val1,val2){
			this.IPv4=val1[0];
			if(val2!=[]){
				const filteredArray = val2.filter(item => !item.startsWith("fe80"));
				this.IPv6=filteredArray[0];
			}
		},
		getDir(event,val){
			this.inputPath=val;
		},
		getIP(){
			ipcRenderer.send('getIP');
		},
		pickDir(){
			ipcRenderer.send("selectDir");
		},
		serverOn(path,port,username,password){
			ipcRenderer.send('serverOn', path,port,username,password);
		},
		serverOff(){
			ipcRenderer.send('serverOff');
		}
	},
	created() {
		ipcRenderer.on('serverOffResponse',this.serverOffResponse)
		ipcRenderer.on('serverOnResponse',this.serverOnResponse)
		ipcRenderer.on('getDir', this.getDir);
		ipcRenderer.on('getIpResponse', this.getIpResponse);

		ipcRenderer.send('getIP');
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
}
.end{
	font-size: 13px;
	padding-top: 40px;
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
.dragArea{
    position: fixed;
    top: 0;
    left: 0;
    height: 30px;
    width: 100%;
    -webkit-app-region: drag;
}
</style>