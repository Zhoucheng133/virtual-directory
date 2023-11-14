<template>
  <div id="app">
    <div class="test">
      <a-button @click="test">测试</a-button>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'App',
  methods: {
    test(){
      ipcRenderer.send('testServer');
    }
  },
}
</script>

<style>
.test{
  display: flex;
  justify-content: center;
  align-items: center;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
