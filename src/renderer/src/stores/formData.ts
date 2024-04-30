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
  watch([easyMode, port, dir, write, read, del, useLogin, username, password], ()=>{
    localStorage.setItem("form", JSON.stringify({
      easyMode: easyMode.value,
      port: port.value,
      dir: dir.value,
      write: write.value,
      read: read.value,
      del: del.value,
      useLogin: useLogin.value,
      username: username.value,
      password: password.value
    }));
  })

  const setForm=(val:any)=>{
    easyMode.value=val.easyMode;
    port.value=val.port;
    dir.value=val.dir;
    write.value=val.write;
    read.value=val.read;
    del.value=val.del;
    useLogin.value=val.useLogin;
    username.value=val.username;
    password.value=val.password;
  }

  return { easyMode, port, dir, write, read, del, useLogin, username, password, setForm };
})