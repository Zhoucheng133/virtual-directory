<template>
  <div class="bg">
    <div class="logPanel">
      <div class="logItem" v-for="(item, index) in logData().log" :key="index">
        <div class="logContent">{{ item.content }}</div>
        <div class="logTime">{{ item.time }}</div>
      </div>
    </div>
    <div class="buttonArea" style="display: flex; justify-content: space-between;">
      <a-button @click="copyIP">复制服务地址</a-button>
      <a-button class="runButton" type="primary">启动服务</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import formData from '@renderer/stores/formData';
import logData from '@renderer/stores/logData';
import { onMounted } from 'vue';

const copyIP=()=>{
  navigator.clipboard.writeText(logData().ip+':'+formData().port);
}

onMounted(()=>{
  logData().initLog();
  window.electron.ipcRenderer.invoke('getIP').then((response)=>{
    logData().setIP(response);
  })
})
</script>

<style scoped>
.buttonArea{
  display: flex;
  align-items: center;
  margin-top: 20px;
}
.logTime{
  margin-left: auto;
}
.logItem{
  display: grid;
  grid-template-columns: auto 70px;
  font-size: 14px;
  color: grey;
  height: 30px;
  /* background-color: red; */
  align-items: center;
}
.logPanel{
  width: 100%;
  flex: 1;
  background-color: rgb(250, 250, 250);
  border-radius: 10px;
  overflow: auto;
  /* padding: 15px; */
  padding-top: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
.bg{
  width: 100%;
  user-select: none;
  display: flex;
  flex-direction: column;
  padding: 30px;
  padding-top: 20px;
  padding-bottom: 40px;
}
</style>