<template>
  <div id="app">
    <!-- 拖拽区域 -->
    <div class="dragArea"></div>
    
  </div>
</template>

<script>
// import { ipcRenderer } from 'electron';

export default {
  name: 'App',
  methods: {
    
  },
}
</script>

<style>
.dragArea{
  position: fixed;
  top: 0;
  left: 0;
  height: 30px;
  width: 100%;
  -webkit-app-region: drag;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
