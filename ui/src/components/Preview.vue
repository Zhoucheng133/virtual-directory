<template>
  <div class="titleBar">
    <div class="fileName">{{ stores().preview.fileName }}</div>
    <div class="downloadButton">下载</div>
    <div class="closeButton" @click="closePreview"><i class="bi bi-x"></i></div>
  </div>
  <div class="previewMain">
    
  </div>
</template>

<script setup lang="ts">
import stores from '../stores';
const emit=defineEmits(['fadeOut'])
const closePreview=()=>{
  emit('fadeOut');
  setTimeout(() => {
    stores().setPreview('', '');
  }, 200);
}
</script>

<style scoped>
.closeButton{
  margin-left: 10px;
  font-size: 25px;
  cursor: pointer;
}
.previewMain{
  display: flex;
  align-items: center;
  justify-content: center;
}
.downloadButton:hover{
  background-color: #0f5cc7;
}
.downloadButton{
  margin-left: auto;
  background-color: #1677ff;
  color: white;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color linear .2s;
}
.fileName{
  font-size: 16px;
}
.titleBar{
  user-select: none;
  padding-left: 20px;
  padding-right: 50px;
  height: 50px;
  display: flex;
  align-items: center;
}
</style>