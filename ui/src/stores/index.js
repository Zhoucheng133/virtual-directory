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
import { Modal, message } from "ant-design-vue";

export default defineStore('index', ()=>{

  let path=ref(['根目录']);
  let data=ref([]);
  const baseURL="http://127.0.0.1:8088";
  let isLogin=ref(false);
  let loading=ref(true);
  let userData=ref({
    username: "",
    password: ""
  });
  let selectedCount=ref(0);
  let allSelect=ref(false);
  let preview=ref({
    item: {},
    link: '',
  });

  const loginController=async (username, password)=>{
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

  const customSort=(a, b)=>{
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
    if(response.data.ok){
      data.value=response.data.data.sort((a, b)=>{
        if(a.isFile && !b.isFile){
          return 1;
        }else if(!a.isFile && b.isFile){
          return -1;
        }
        return customSort(a.fileName, b.fileName)
      });
    }
  }
  const getIconSrc=(item)=>{
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

  const openHandler=(item)=>{
    if(item.isFile){
      preview.value.link=`${baseURL}/api/getFile?username=${userData.value.username}&password=${CryptoJS.SHA256(userData.value.password).toString()}&path=${JSON.stringify([...path.value, item.fileName].slice(1))}`;
      preview.value.item=item;
    }else{
      path.value.push(item.fileName);
      getData();
    }
  }

  const toDir=(item)=>{
    const index=path.value.indexOf(item);
    path.value.splice(index+1);
    getData();
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

  const setPreview=(type, item)=>{
    preview.value={
      item: item,
      link: '',
    };
  }

  const mainDownload=()=>{
    let selectedList=[];
    data.value.forEach(item=>{
      if(item.isSelected){
        selectedList.push(item.fileName);
      }
    })
    if(selectedList.length==1){
      downloadHandler(selectedList[0]);
    }else{
      multiDownload(selectedList);
    }
  }

  const multiDownload=(items)=>{
    window.location.href=`${baseURL}/api/multidownload?username=${userData.value.username}&password=${CryptoJS.SHA256(userData.value.password).toString()}&path=${JSON.stringify([...path.value].slice(1))}&files=${JSON.stringify(items)}`;
  }

  const downloadHandler=(item)=>{
    if(item.isFile){
      window.location.href=`${baseURL}/api/download?username=${userData.value.username}&password=${CryptoJS.SHA256(userData.value.password).toString()}&path=${JSON.stringify([...path.value, item.fileName].slice(1))}`;
    }else{
      multiDownload([item])
    }
  }

  const renameHandler=(oldName, newName)=>{
    axios.post(baseURL+"/api/rename", null, {
      params: {
        path: JSON.stringify(path.value.slice(1)),
        oldName: oldName,
        newName: newName,
        username: userData.value.username,
        password: CryptoJS.SHA256(userData.value.password).toString()
      }
    }).then((response)=>{
      if(response.data.ok){
        message.success("重命名成功");
        getData();
      }else{
        message.error(`重命名失败: ${response.data.data}`);
      }
    })
  }

  const newFolderHandler=(name)=>{
    axios.post(baseURL+'/api/newFolder', null, {
      params: {
        path: JSON.stringify(path.value.slice(1)),
        name: name,
        username: userData.value.username,
        password: CryptoJS.SHA256(userData.value.password).toString()
      }
    }).then((response)=>{
      if(response.data.ok){
        message.success("新建文件夹成功");
        getData();
      }else{
        message.error(`新建文件夹失败: ${response.data.data}`);
      }
    })
  }

  const delHandler=(items)=>{
    Modal.confirm({
      title: "确定要删除这个(些)文件/文件夹吗",
      content: '这是一个不可撤销的操作',
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk(){
        let selectedList=[];
        if(items==undefined){
          data.value.forEach(item=>{
            if(item.isSelected){
              selectedList.push(item.fileName);
            }
          })
        }
        
        axios.post(baseURL+'/api/del', null, {
          params: {
            path: JSON.stringify(path.value.slice(1)),
            items: items==undefined ? JSON.stringify(selectedList) : JSON.stringify([items.fileName]),
            username: userData.value.username,
            password: CryptoJS.SHA256(userData.value.password).toString()
          }
        }).then(async (response)=>{
          if(response.data.ok){
            message.success("删除成功");
            await getData();
            selectedCount.value=0;
            allSelect.value=false;
            data.value.forEach(item=>{
              item.selected=false;
            })
          }else{
            message.error(`删除失败: ${response.data.data}`);
          }
        })
      },
      okCancel(){},
    })
    
  }

  return {
    path, 
    data, 
    isLogin, 
    init, 
    loginController, 
    loading, 
    getData, 
    getIconSrc, 
    selectedCount, 
    allSelectToggle, 
    allSelect, 
    openHandler, 
    toDir, 
    preview, 
    setPreview, 
    downloadHandler, 
    mainDownload, 
    renameHandler,
    newFolderHandler,
    delHandler
  };
})