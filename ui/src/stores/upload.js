import { defineStore } from "pinia";
import { ref } from "vue";
import * as CryptoJS from 'crypto-js';
import stores from ".";
import axios from "axios";

export default defineStore('upload', ()=>{
  let fileList=ref([]);

  const uploadURL=()=>{
    return `${stores().baseURL}/api/upload?username=${stores().userData.username}&password=${CryptoJS.SHA256(stores().userData.password).toString()}&path=${JSON.stringify(stores().path.slice(1))}&isDir=false`;
  }

  const dirUploadURL=(path)=>{
    return `${stores().baseURL}/api/upload?username=${stores().userData.username}&password=${CryptoJS.SHA256(stores().userData.password).toString()}&path=${JSON.stringify([...stores().path.slice(1), path])}&isDir=true`;
  }

  const handleDirChange=(event)=>{
    for (let i = 0; i < event.target.files.length; i++) {
      if(event.target.files[i].name.startsWith(".")){
        continue;
      }
      var formData = new FormData();
      formData.append('files', event.target.files[i]);
      formData.append('paths', event.target.files[i].webkitRelativePath);
      uploadFiles(formData);
      console.log(formData.get("paths"));
    }
  }

  const uploadFiles=(formData)=>{
    axios.post(dirUploadURL(formData.get("paths")), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }
  
  return { fileList, uploadURL, handleDirChange }

})