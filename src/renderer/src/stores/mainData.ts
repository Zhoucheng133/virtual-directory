import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore('mainData', ()=>{
  let onRunning=ref(false);
  
  const toggleRun=()=>{
    if(onRunning.value){
      // 停止运行
      onRunning.value=false;
    }else{
      // 运行服务
      onRunning.value=true;
    }
  }

  return { onRunning, toggleRun };
})