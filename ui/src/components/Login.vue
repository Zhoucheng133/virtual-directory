<template>
  <div class="bg">
    <div class="panel">
      <div class="title">登录</div>
      <div class="inputArea">
        <a-form layout="vertical">
          <a-form-item label="用户名">
            <a-input v-model:value="username"></a-input>
          </a-form-item>
          <a-form-item label="密码">
            <a-input-password v-model:value="password"></a-input-password>
          </a-form-item>
          <a-form-item>
            <a-checkbox v-model:checked="saveLogin">记住账户和密码</a-checkbox>
          </a-form-item>
        </a-form>
      </div>
      <div class="loginButton" @click="login">
        <i class="bi bi-arrow-right-short"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import stores from '../stores';
import { ref } from 'vue';

let username=ref("");
let password=ref("");
let saveLogin=ref(false);
document.title="虚拟目录: 登录";

const login=async ()=>{
  if(await stores().loginController(username.value, password.value)){
    if(saveLogin.value){
      localStorage.setItem("userData", JSON.stringify({
        username: username.value,
        password: password.value,
      }));
    }
    message.success("登录成功");
  }else{      
    message.error("用户名或者密码有误");
  }
}

</script>

<style>
.ant-form-item{
  margin-bottom: 10px;
}
</style>

<style scoped>
.loginButton:hover{
  background-color: #2967b2;
}
.loginButton{
  position: absolute;
  cursor: pointer;
  bottom: 0;
  right: 0;
  height: 50px;
  width: 50px;
  background-color: #4096ff;
  border-bottom-right-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: white;
  transition: background-color linear .2s;
}
.inputArea{
  height: calc(100% - 70px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.title{
  font-size: 24px;
  font-weight: bold;
}
.panel{
  user-select: none;
  width: 300px;
  height: 400px;
  border-radius: 10px;
  /* background-color: red; */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  background-color: white;
  position: relative;
}
.bg{
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #02AAB0;
  background: -webkit-linear-gradient(to right, #00CDAC, #02AAB0);
  background: linear-gradient(to right, #00CDAC, #02AAB0);
}
</style>