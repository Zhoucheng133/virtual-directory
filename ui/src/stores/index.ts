import axios from "axios";
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import * as CryptoJS from 'crypto-js';

import audioIcon from "../assets/fileIcons/audio.svg";
import btIcon from "../assets/fileIcons/bt.svg";
import folerIcon from "../assets/fileIcons/folder.svg";
import htmlIcon from "../assets/fileIcons/html.svg";
import imageIcon from "../assets/fileIcons/image.svg";
import pdfIcon from "../assets/fileIcons/pdf.svg";
import pptIcon from "../assets/fileIcons/ppt.svg";
import txtIcon from "../assets/fileIcons/txt.svg";
import unkownIcon from "../assets/fileIcons/unkown.svg";
import videoIcon from "../assets/fileIcons/video.svg";
import wordIcon from "../assets/fileIcons/word.svg";
import xlsIcon from "../assets/fileIcons/xls.svg";
import zipIcon from "../assets/fileIcons/zip.svg";

export default defineStore('index', ()=>{

  interface Data{
    id: string,
    isFile: boolean,
    isSelected: boolean,
    fileName: string,
    size: string,
    type: string
  }

  let path=ref<string[]>(['根目录']);
  let data=ref<Data[]>([]);
  const baseURL="http://127.0.0.1:8088";
  let isLogin=ref(false);
  let loading=ref(true);
  let userData=ref({
    username: "",
    password: ""
  });
  let selectedCount=ref(0);
  let allSelect=ref(false);

  const loginController=async (username: string, password: string)=>{
    const loginfeedback=await axios.get(baseURL+'/api/login', {
      params: {
        username: username,
        password: CryptoJS.SHA256(password).toString()
      }
    });
    if(loginfeedback.data){
      userData.value={
        username: username,
        password: password,
      }
      isLogin.value=true;
      return true;
    }
    return false;
  }

  const init=async ()=>{
    const needLogin=await axios.get(baseURL+'/api/needLogin');
    if(needLogin.data==false){
      isLogin.value=true;
    }else{
      const userData=localStorage.getItem('userData');
      if(userData){
        const jsonData=JSON.parse(userData);
        await loginController(jsonData.username, jsonData.password);
      }
    }
    loading.value=false;
  }

  const customSort=(a: any, b: any)=>{
    let i = 0;

    while (i < a.length && i < b.length) {
      const charA = a.charAt(i);
      const charB = b.charAt(i);

      if (charA !== charB) {
        if (isNaN(charA) || isNaN(charB)) {
          // 如果不是数字，则按照默认字符串比较规则排序
          return charA.localeCompare(charB);
        } else {
          // 如果是数字，则按照数字大小从小到大排序
          const numA = parseInt(a.substring(i), 10) || 0;
          const numB = parseInt(b.substring(i), 10) || 0;

          return numA - numB;
        }
      }

      i++;
    }
    return a.length - b.length;
  }

  const getData=async ()=>{
    const response=await axios.get(baseURL+'/api/getData', {
      params: {
        path: JSON.stringify(path.value.slice(1)),
        username: userData.value.username,
        password: CryptoJS.SHA256(userData.value.password).toString()
      }
    });
    // console.log(response.data);
    if(response.data.ok){
      data.value=response.data.data.sort((a: Data, b: Data)=>{
        if(a.isFile && !b.isFile){
          return 1;
        }else if(!a.isFile && b.isFile){
          return -1;
        }
        return customSort(a.fileName, b.fileName)
      });
    }
  }
  const getIconSrc=(item: Data)=>{
    if(!item.isFile){
      return folerIcon;
    }
    switch(item.type){
      case 'image':
        return imageIcon;
      case 'document':
        return wordIcon;
      case 'pdf':
        return pdfIcon;
      case 'audio':
        return audioIcon;
      case 'zip':
        return zipIcon;
      case 'ppt':
        return pptIcon;
      case 'txt':
        return txtIcon;
      case 'video':
        return videoIcon;
      case 'html':
        return htmlIcon;
      case 'xls':
        return xlsIcon;
      case 'bt':
        return btIcon;
    }
    return unkownIcon;
  }

  const openHandler=(item: Data)=>{
    if(item.isFile){
      // TODO 预览文件
    }else{
      // TODO 打开文件夹
      path.value.push(item.fileName);
      getData();
    }
  }

  watch(data, ()=>{
    selectedCount.value=0
    data.value.forEach(item=>{
      if(item.isSelected){
        selectedCount.value+=1;
      }else{
        allSelect.value=false;
      }
    })
  }, {deep: true})
  
  const allSelectToggle=()=>{
    
    if(!allSelect.value){
      data.value.forEach(item=>{
        item.isSelected=false;
      })
      // allSelect.value=false;
    }else{
      data.value.forEach(item=>{
        item.isSelected=true;
      }) // allSelect.value=true;
    }
  }

  return { path, data, isLogin, init, loginController, loading, getData, getIconSrc, selectedCount, allSelectToggle, allSelect, openHandler };
})