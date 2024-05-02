import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore('index', ()=>{
  let path=ref<string[]>(['根目录', '测试目录1', '测试目录2', '测试目录3', '测试目录4']);

  return { path };
})