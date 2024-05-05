<template>
  <div class="titleBar">
    <div class="fileName">{{ stores().preview.fileName }}</div>
    <div class="downloadButton">下载</div>
    <div class="closeButton" @click="closePreview"><i class="bi bi-x"></i></div>
  </div>
  <div class="previewMain">
    <vue-plyr v-if="stores().preview.type=='video'">
      <video controls crossorigin playsinline :src="stores().preview.link"></video>
    </vue-plyr>
    <vue-plyr v-else-if="stores().preview.type=='audio'">
      <audio controls crossorigin playsinline :src="stores().preview.link"></audio>
    </vue-plyr>
  </div>
</template>

<script setup>
import stores from '../stores';
const emit=defineEmits(['fadeOut'])
document.body.style.overflow = 'hidden';
const closePreview=()=>{
  emit('fadeOut');
  setTimeout(() => {
    stores().setPreview('', '');
  }, 200);
}
</script>

<style>
.plyr--audio{
  display: flex !important;
  justify-content: center !important;
}
.plyr{
  max-height: 80vh;
  max-width: 80vw;
}
</style>

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
  height: calc(100vh - 80px) ;
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