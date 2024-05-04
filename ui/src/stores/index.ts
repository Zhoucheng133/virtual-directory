import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import * as CryptoJS from 'crypto-js';

export default defineStore('index', ()=>{

  interface Data{
    id: string,
    isFile: boolean,
    isSelected: boolean,
    fileName: string,
    size: string,
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

  return { path, data, isLogin, init, loginController, loading, getData };
})