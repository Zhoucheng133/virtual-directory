import { defineStore } from "pinia";
import { ref } from "vue";
import formData from "./formData";
import { message } from "ant-design-vue";

export default defineStore('mainData', ()=>{
  let onRunning=ref(false);
  
  const toggleRun=()=>{
    if(onRunning.value){
      // 停止运行
      onRunning.value=false;
    }else{
      // 运行服务
      if(formData().dir.length==0){
        message.error("映射目录不能为空!");
        return;
      }else if(formData().useLogin && (formData().username.length==0 || formData().password.length==0)){
        message.error("用户信息不能为空");
        return;
      }
      onRunning.value=true;
    }
  }

  return { onRunning, toggleRun };
})