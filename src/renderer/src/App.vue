<!-- <script setup lang="ts">
const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script> -->

<template>
  <div class="titleBar">
    <div class="dragArea"></div>
    <div class="minButton">
      <i class="bi bi-dash" @click="minApp"></i>
    </div>
    <div class="closeButton" @click="closeApp">
      <i class="bi bi-x"></i>
    </div>
  </div>
</template>


<script setup lang="ts">
const closeApp=()=>{
  window.electron.ipcRenderer.send("closeApp");
}
const minApp=()=>{
  window.electron.ipcRenderer.send("minApp");
}
</script>

<style>
body{
  margin: 0;
}
</style>

<style scoped>
.minButton:hover{
  background-color: rgb(240, 240, 240);
}
.minButton{
  height: 30px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: background-color linear .2s;
}
.closeButton:hover{
  background-color: rgb(230, 0, 0);
  color: white;
}
.closeButton{
  height: 30px;
  width: 40px;
  /* background-color: red; */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  transition: background-color linear .2s;
}
.dragArea{
  flex: 1;
  height: 30px;
  -webkit-app-region: drag;
}
.titleBar{
  width: 100vw;
  height: 30px;
  display: flex;
  justify-content: flex-end;
}
</style>