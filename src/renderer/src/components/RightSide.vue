<template>
  <div class="bg">
    <div class="logPanel">
      <div class="logItem" v-for="(item, index) in logData().log" :key="index">
        <div class="logContent">{{ item.content }}</div>
        <div class="logTime">{{ item.time }}</div>
      </div>
    </div>
    <a-button class="runButton" type="primary">启动服务</a-button>
  </div>
</template>

<script setup lang="ts">
import logData from '@renderer/stores/logData';
import { onMounted } from 'vue';

onMounted(()=>{
  logData().initLog();
})
</script>

<style scoped>
.logTime{
  margin-left: auto;
}
.logItem{
  display: grid;
  grid-template-columns: auto 70px;
  font-size: 14px;
}
.runButton{
  margin-top: 20px;
}
.logPanel{
  width: 100%;
  flex: 1;
  background-color: rgb(250, 250, 250);
  border-radius: 10px;
  overflow: auto;
  padding: 20px;
}
.bg{
  width: 100%;
  user-select: none;
  display: flex;
  flex-direction: column;
  padding: 30px;
  padding-top: 20px;
  padding-bottom: 40px;
}
</style>