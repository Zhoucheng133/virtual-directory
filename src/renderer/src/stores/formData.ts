import { defineStore } from "pinia";
import { ref, watch } from "vue";

export default defineStore('formData', ()=>{
  let port=ref(8081);
  let dir=ref("");
  let write=ref(true);
  let read=ref(true);
  let del=ref(true);
  let useLogin=ref(false);
  let username=ref("");
  let password=ref("");
  let useDAV=ref(false);

  watch([port, dir, write, read, del, useLogin, username, password, useDAV], ()=>{
    localStorage.setItem("form", JSON.stringify({
      port: port.value,
      dir: dir.value,
      write: write.value,
      read: read.value,
      del: del.value,
      useLogin: useLogin.value,
      username: username.value,
      password: password.value,
      useDAV: useDAV.value,
    }));
  })

  const selectDir=()=>{
    window.electron.ipcRenderer.invoke('selectDir').then((response)=>{
      dir.value=response;
    })
  };

  const setForm=(val:any)=>{
    port.value=val.port;
    dir.value=val.dir;
    write.value=val.write;
    read.value=val.read;
    del.value=val.del;
    useLogin.value=val.useLogin;
    username.value=val.username;
    password.value=val.password;
    useDAV.value=val.useDAV;
  }
  return { port, dir, write, read, del, useLogin, username, password, setForm, selectDir, useDAV };
})