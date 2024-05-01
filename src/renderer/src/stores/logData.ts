import { defineStore } from "pinia";
import { ref } from "vue";
import dayjs from 'dayjs'

export default defineStore('logStore', ()=>{
  interface Log{
    time: string,
    content: string,
  }
  let log=ref<Log[]>([]);
  let ip=ref("");

  const initLog=()=>{
    log.value.push({
      time: dayjs(new Date()).format("HH:mm"),
      content: "初始化成功"
    })
  }

  const addLog=(val: string)=>{
    log.value.push({
      time: dayjs(new Date()).format("HH:mm"),
      content: val,
    })
  }

  const setIP=(val: string)=>{
    ip.value=val;
    addLog("本机地址: "+ip.value);
  }

  return { log, initLog, addLog, setIP, ip };
})