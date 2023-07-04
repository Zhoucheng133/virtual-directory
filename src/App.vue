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
					<div class="cell">
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
						<a-radio-group v-model="secure" :disabled="status">
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
					<div class="cell">
						<a-input v-model="inputName" placeholder="用户名" :disabled="secure=='all'||status"></a-input>
					</div>
					<div class="cell">
						<a-input v-model="inputPass" placeholder="密码" :disabled="secure=='all'||status"></a-input>
					</div>
				</div>
				
				<div class="row">
					<div class="cell">
						端口号
					</div>
				</div>
				<div class="row1">
					<div class="cell">
						<a-input-number v-model="inputPort"></a-input-number>
					</div>
					<div class="cell">
						<a-button :type="status==false?'primary':'danger'" block @click="serverButton">{{ status==false?'启动服务':'关闭服务' }}</a-button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
	data() {
		return {
			inputName:"",
			inputPass:"",
			secure:"all",
			inputPort:8081,
			inputPath:"",
			status:false,
		}
	},
	methods: {
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
			}
		},
		serverOnResponse(event,val){
			if(val=="success"){
				this.status=true;
			}
		},
		getDir(event,val){
			this.inputPath=val;
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
.cell{
	/* border: 1px solid; */
	display: flex;
	padding-left: 10px;
	align-items: center;
}
.row1{
	padding-bottom: 5px;
	display: grid;
	grid-template-columns: 150px 150px;
}
.row{
	/* padding-top: 5px; */
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