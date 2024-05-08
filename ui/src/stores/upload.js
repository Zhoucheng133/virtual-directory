import { defineStore } from "pinia";
import { ref, watch } from "vue";
import * as CryptoJS from 'crypto-js';
import stores from ".";
import axios from "axios";
import { message } from "ant-design-vue";

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

  const pushIntoFileList=(newObj)=>{
    const index = fileList.value.findIndex(obj => obj.name === newObj.name && obj.size === newObj.size);
    if (index !== -1) {
      fileList.value[index] = newObj;
    } else {
      // 如果不存在，将新对象添加到数组中
      fileList.value.push(newObj);
    }
  }

  const uploadFiles=(formData)=>{
    axios.post(dirUploadURL(formData.get("paths")), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        const fileData={
          name: formData.get('files').name,
          percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
          status: "uploading",
          size: formData.get('files').size
        }
        pushIntoFileList(fileData)
      }
    }).then((response)=>{
      if(response.data.ok){
        const fileData={
          name: formData.get('files').name,
          percentage: 100,
          status: "done",
          size: formData.get('files').size
        }
        pushIntoFileList(fileData)
      }else{
        const fileData={
          name: formData.get('files').name,
          percentage: 0,
          status: "err",
          size: formData.get('files').size
        }
        pushIntoFileList(fileData)
      }
    })
  }

  watch(fileList,(newVal)=>{
    if(newVal.every(item => item.status == 'done')){
      stores().getData();
      message.success("上传成功");
    }
  }, {deep: true})
  
  return { fileList, uploadURL, handleDirChange }

})