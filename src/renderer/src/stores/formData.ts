import { defineStore } from "pinia";
import { ref, watch } from "vue";

export default defineStore('formData', ()=>{
  let easyMode=ref(false);
  let port=ref(8081);
  let dir=ref("");
  let write=ref(true);
  let read=ref(true);
  let del=ref(true);
  let useLogin=ref(false);
  let username=ref("");
  let password=ref("");

  watch(read, (newVal)=>{
    if(!newVal){
      del.value=false;
      easyMode.value=true;
    }
  })
  watch(easyMode, (newVal)=>{
    if(newVal){
      read.value=false;
      write.value=true;
      del.value=false;
    }else{
      read.value=true;
    }
  })

  return { easyMode, port, dir, write, read, del, useLogin, username, password };
})