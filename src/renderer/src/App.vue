<!-- <script setup lang="ts">
const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script> -->

<template>
  Hello!
  <button @click="close">关闭</button>
</template>


<script setup lang="ts">
const close=()=>{
  window.electron.ipcRenderer.send('close');
}
</script>