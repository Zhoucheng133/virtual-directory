<template>
	<div id="app">
		<button @click="test">测试按钮</button>
	</div>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
	methods: {
		test(){
			ipcRenderer.send('serverOn', "/Users/zhoucheng/Desktop/",4040);
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
