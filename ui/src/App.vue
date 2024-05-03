<template>
  <Main v-if="stores().isLogin" />
  <Login v-else />
</template>

<script setup lang="ts">
import stores from './stores';
import Login from './components/Login.vue';
import Main from './components/Main.vue';
import { onMounted } from 'vue';

onMounted(()=>{
  stores().init();
})
</script>