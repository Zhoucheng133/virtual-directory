<template>
	<div id="app">
		<button @click="serverOn">启动测试按钮</button>
		<button @click="serverOff">关闭测试按钮</button>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
	methods: {
		serverOn(){
			ipcRenderer.send('serverOn', "/Users/zhoucheng/Downloads",4040);
		},
		serverOff(){
			ipcRenderer.send('serverOff');
		}
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
