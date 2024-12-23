<template>
  <div class="titleBar">
    <div class="dragArea"></div>
    <div class="minButton" @click="minApp" v-if="isWin">
      <i class="bi bi-dash"></i>
    </div>
    <div class="closeButton" @click="closeApp" v-if="isWin">
      <i class="bi bi-x"></i>
    </div>
  </div>
  <a-config-provider :locale="zhCN">
    <div class="mainPage">
      <PageContent class="pageComponent" />
    </div>
  </a-config-provider>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageContent from './components/PageContent.vue';
import zhCN from "ant-design-vue/es/locale/zh_CN";
const closeApp=()=>{
  window.electron.ipcRenderer.send("closeApp");
}
const minApp=()=>{
  window.electron.ipcRenderer.send("minApp");
}

let isWin=ref(false);

onMounted(() => {
  window.electron.ipcRenderer.invoke('getSys').then((response)=>{
    if(response=='Windows'){
      isWin.value=true;
    }
  })
})

</script>

<style>
body{
  margin: 0;
}
</style>

<style scoped>
.pageComponent{
  flex: 1;
  height: calc(100vh - 30px);
}
.mainPage{
  display: flex;
}
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