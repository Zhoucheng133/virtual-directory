import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore('index', ()=>{

  interface data{
    id: string,
    isFile: boolean,
    isSelected: boolean,
    fileName: string,
    size: number,
  }

  let path=ref<string[]>(['根目录', '测试目录1', '测试目录2', '测试目录3', '测试目录4']);
  let data=ref<data[]>([]);
  
  const getData=()=>{

  }

  getData();

  return { path, data };
})