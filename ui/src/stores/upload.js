import { defineStore } from "pinia";
import { ref } from "vue";
import * as CryptoJS from 'crypto-js';
import stores from ".";

export default defineStore('upload', ()=>{
  let fileList=ref([]);

  const uploadURL=()=>{
    return `${stores().baseURL}/api/upload?username=${stores().userData.username}&password=${CryptoJS.SHA256(stores().userData.password).toString()}&path=${JSON.stringify(stores().path.slice(1))}`;
  }
  
  return { fileList, uploadURL }

})