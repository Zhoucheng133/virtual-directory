<template>
  <Main v-if="isLogin" />
  <Login v-else />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Login from './components/Login.vue';
import Main from './components/Main.vue';
let isLogin=ref(false);
const userData=localStorage.getItem("userData");
if(userData){

}else{
  
}
</script>