<template>
  <Loading v-if="stores().loading" />
  <Main v-else-if="stores().isLogin" />
  <Login v-else />
</template>

<script setup lang="ts">
import stores from './stores';
import Login from './components/Login.vue';
import Main from './components/Main.vue';
import Loading from './components/Loading.vue';
import { onMounted } from 'vue';

onMounted(()=>{
  stores().init();
})
</script>

<style>
body{
  margin: 0;
  height: auto !important;
  width: auto !important;
}
</style>