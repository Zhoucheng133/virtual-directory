<template>
  <div class="bg">
    <div class="ipPanel">
      <i class="bi bi-router"></i>
      {{ ip }}:{{ formData().port }}
    </div>
    <div class="openLink" @click="openLink">打开链接</div>
    <div class="buttonArea" style="display: flex; justify-content: space-between;">
      <a-button @click="copyIP">复制地址</a-button>
      <a-button class="runButton" type="primary" @click="mainData().toggleRun" :danger="mainData().onRunning ? true : false">
        {{ mainData().onRunning ? '停止服务' : '启动服务' }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import formData from '@renderer/stores/formData';
import logData from '@renderer/stores/logData';
import mainData from '@renderer/stores/mainData';
import { message } from 'ant-design-vue';
import { onMounted, ref } from 'vue';

const copyIP=()=>{
  navigator.clipboard.writeText(logData().ip+':'+formData().port);
  message.success("复制成功！");
}
let ip=ref('');
const openLink=()=>{
  if(mainData().onRunning){
    window.open(`http://localhost:${formData().port}`)
    console.log(`http:localhost:${formData().port}`);
    
  }else{
    message.info("服务没有在运行")
  }
}

onMounted(()=>{
  logData().initLog();
  window.electron.ipcRenderer.invoke('getIP').then((response)=>{
    ip.value=response
  })
})
</script>

<style scoped>
.openLink:hover{
  color: #3075ca;
}
.openLink{
  margin-top: 20px;
  color: #4096ff;
  cursor: pointer;
  transition: color linear .2s;
}
.bi-router{
  margin-right: 10px;
  font-size: 20px;
}
.ipPanel{
  display: flex;
}
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