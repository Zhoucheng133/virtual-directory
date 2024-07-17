<template>
  <div class="bg">
    <div class="formView">
      <div class="title">端口</div>
      <a-input-number v-model:value="formData().port" :min="1000" :max="9999" style="margin-right: 20px;"  :disabled="mainData().onRunning"></a-input-number> 
      <div class="title">映射目录</div>
      <div style="display: flex; align-items: center;">
        <a-tooltip placement="bottom" :title="formData().dir">
          <a-input v-model:value="formData().dir" spellcheck="false" disabled></a-input>
        </a-tooltip>
        <a-button style="margin-left: 10px;" @click="formData().selectDir" :disabled="mainData().onRunning">浏览</a-button>
      </div>
      <div class="title">权限</div>
      <div style="display: flex; margin-top: 5px;">
        <a-checkbox v-model:checked="formData().write" :disabled="mainData().onRunning">写入</a-checkbox>
        <a-checkbox v-model:checked="formData().del" :disabled="mainData().onRunning">删除</a-checkbox>
      </div>
      <div class="title">需要登录</div>
      <div style="display: flex;">
        <a-switch v-model:checked="formData().useLogin" :disabled="mainData().onRunning"></a-switch>
        <div class="openLink" @click="setFTP">FTP设置</div>
      </div>
      <div class="title">用户名</div>
      <a-input v-model:value="formData().username" :disabled="!formData().useLogin || mainData().onRunning"></a-input>
      <div class="title">密码</div>
      <a-input-password v-model:value="formData().password" :disabled="!formData().useLogin || mainData().onRunning"></a-input-password>
    </div>
    <div class="ipPanel">
      <i class="bi bi-router"></i>
      {{ ip }}:{{ formData().port }}
      <div class="openLink" @click="openLink">打开链接</div>
    </div>
    <div class="buttonArea" style="display: flex; justify-content: space-between;">
      <a-button @click="copyIP">复制地址</a-button>
      <a-button class="runButton" type="primary" @click="mainData().toggleRun" :danger="mainData().onRunning ? true : false">
        {{ mainData().onRunning ? '停止服务' : '启动服务' }}
      </a-button>
    </div>
    <div class="info">
      <i class="bi bi-github" @click="toGithub"></i>
    </div>
    <a-modal v-model:open="ftpModal" title="FTP设置" @ok="okFTP" centered>
      <template #footer>
        <a-button key="submit" type="primary" @click="okFTP">完成</a-button>
      </template>
      <a-checkbox v-model:checked="formData().useFTP" :disabled="mainData().onRunning">启用FTP</a-checkbox>
      <div class="formView" style="margin-top: 10px">
        <div class="title">端口号</div>
        <div><a-input-number v-model:value="formData().ftpPort" :min="1000" :max="9999" style="margin-right: 20px;" :disabled="mainData().onRunning || !formData().useFTP"></a-input-number></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import formData from '@renderer/stores/formData';
import mainData from '@renderer/stores/mainData';
import { message } from 'ant-design-vue';
import { onMounted, ref } from 'vue';
const toGithub=()=>{
  window.open("https://github.com/Zhoucheng133/virtual-directory")
}
onMounted(()=>{
  const form=localStorage.getItem('form');
  if(form){
    const data=JSON.parse(form);
    formData().setForm(data);
  }
})
let ftpModal=ref(false)
const okFTP=()=>{
  ftpModal.value=false;
}
const setFTP=()=>{
  ftpModal.value=true;
}
const copyIP=()=>{
  navigator.clipboard.writeText(ip+':'+formData().port);
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
  window.electron.ipcRenderer.invoke('getIP').then((response)=>{
    ip.value=response
  })
})
</script>

<style scoped>
.bi-github{
  cursor: pointer;
}
.info{
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  /* cursor: pointer; */
}
.formView{
  display: grid;
  grid-template-columns: 70px auto;
  margin-bottom: 20px;
  align-items: center;
  grid-column-gap: 10px;
  grid-row-gap: 20px;
}
.buttonArea{
  display: flex;
  align-items: center;
  margin-top: 20px;
}
.openLink:hover{
  color: #3075ca;
}
.openLink{
  color: #4096ff;
  cursor: pointer;
  transition: color linear .2s;
  margin-left: auto;
}
.bi-router{
  margin-right: 10px;
  font-size: 20px;
}
.ipPanel{
  display: flex;
  align-items: center
}
.bg{
  width: 100%;
  padding: 30px;
  padding-top: 20px;
  user-select: none;
}
.bi-question{
  font-size: 20px;
}
</style>