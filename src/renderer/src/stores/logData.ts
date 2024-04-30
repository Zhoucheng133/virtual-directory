import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore('logStore', ()=>{
  let log=ref("");

  return { log };
})