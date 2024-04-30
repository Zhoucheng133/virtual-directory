import { defineStore } from "pinia";
import { ref } from "vue";
import dayjs from 'dayjs'

export default defineStore('logStore', ()=>{
  interface Log{
    time: string,
    content: string,
  }
  let log=ref<Log[]>([]);

  const initLog=()=>{
    log.value.push({
      time: dayjs(new Date()).format("YYYY-MM-DD hh:mm"),
      content: "初始化成功"
    })
  }

  return { log, initLog };
})