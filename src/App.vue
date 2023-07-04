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
						<a-button @click="pickDir">选取目录</a-button>
					</div>
				</div>
				<div class="row">
					<div class="cell">
						安全设置
					</div>
				</div>
				<div class="row">
					<div class="cell">
						<a-radio-group v-model="secure">
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
						<a-input v-model="inputName" placeholder="用户名" :disabled="secure=='all'"></a-input>
					</div>
					<div class="cell">
						<a-input v-model="inputPass" placeholder="密码" :disabled="secure=='all'"></a-input>
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
						<a-button type="primary" block>启动服务</a-button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
	methods: {
		getDir(event,val){
			this.inputPath=val;
		},
		pickDir(){
			ipcRenderer.send("selectDir");
		},
		serverOn(){
			ipcRenderer.send('serverOn', "/Users/zhoucheng/Downloads",4040,"","");
		},
		serverOff(){
			ipcRenderer.send('serverOff');
		}
	},
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
	created() {
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