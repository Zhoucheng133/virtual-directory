import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import * as CryptoJS from 'crypto-js';

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

  return { path, data, isLogin, init, loginController, loading };
})