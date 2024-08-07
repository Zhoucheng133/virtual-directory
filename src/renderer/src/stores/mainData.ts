import { defineStore } from "pinia";
import { ref } from "vue";
import formData from "./formData";
import { message } from "ant-design-vue";

export default defineStore('mainData', ()=>{
  let onRunning=ref(false);
  
  const toggleRun=async ()=>{
    if(onRunning.value){
      // 停止运行
      onRunning.value=false;
      window.electron.ipcRenderer.invoke('stopServer');
    }else{
      // 运行服务
      const ok = await window.electron.ipcRenderer.invoke('checkPath', formData().dir);
      if(!ok){
        message.error("映射目录不合法");
        return;
      }
      if(formData().dir.length==0){
        message.error("映射目录不能为空!");
        return;
      }else if(formData().useLogin && (formData().username.length==0 || formData().password.length==0)){
        message.error("用户信息不能为空");
        return;
      }
      if(formData().useLogin){
        window.electron.ipcRenderer.invoke('runServer', 
          formData().port, 
          formData().dir, 
          formData().username, 
          formData().password, 
          formData().read, 
          formData().write, 
          formData().del, 
          formData().useDAV, 
        )
      }else{
        window.electron.ipcRenderer.invoke('runServer', 
          formData().port, 
          formData().dir, 
          '', 
          '', 
          formData().read, 
          formData().write, 
          formData().del, 
          formData().useDAV, 
        )
      }
      onRunning.value=true;
    }
  }

  return { onRunning, toggleRun };
})