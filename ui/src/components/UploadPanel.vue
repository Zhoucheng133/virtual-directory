<template>
  <div class="panel" :style="{height: panelHeight+'px'}">
    <div class="titlebar" @click="togglePanel">
      <div>上传列表</div>
      <div class="arrowIcon">
        <i class="bi bi-arrow-up-short" v-if="panelHeight==50"></i>
        <i class="bi bi-arrow-down-short" v-else></i>
      </div>
    </div>
    <div class="content">
      <div class="item" v-for="(item, index) in upload().fileList" :key="index">
      <!-- <div class="item" v-for="(item, index) in testList" :key="index"> -->
        <div class="name">
          <div class="nameText">{{ item.name }}</div>
          <div class="size">{{ sizeCal(item) }}</div>
        </div>
        <div class="statusIcon">
          <i class="bi bi-check-circle" v-if="item.status=='done'"></i>
          <i class="bi bi-arrow-up-circle"v-else></i>
        </div>
        <div class="progress" v-if="item.status!='done'" :style="{width: item.percent+'%'}"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import upload from '../stores/upload';
let panelHeight=ref(50);
const formatFileSize=(bytes)=>{
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
const sizeCal=(item)=>{
  return item.status!='done' ? `${formatFileSize(item.size*item.percent/100)} | ${formatFileSize(item.size)}` : `${formatFileSize(item.size)}`
}
const togglePanel=()=>{
  if(panelHeight.value==50){
    panelHeight.value=400;
  }else{
    panelHeight.value=50;
  }
}
</script>

<style>
::-webkit-scrollbar{
  width: 5px;
}
::-webkit-scrollbar-thumb{
  background-color: lightgrey;
}
</style>

<style scoped>
.content{
  /* overflow-y: overlay; */
  overflow-y: auto;
  height: 350px;
}
.size{
  font-size: 11px;
  margin-top: 5px;
  color: rgb(160, 160, 160);
}
.progress{
  position: absolute;
  height: 50px;
  top: 0;
  left: 0;
  background-color: #edf5ff;
  transition: all ease-in-out .2s;
}
.statusIcon{
  display: flex;
  justify-content: center;
  font-size: 16px;
  z-index: 10;
}
.nameText{
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
}
.name{
  overflow: hidden;
  width: 100%;
  /* line-height: 50px; */
  z-index: 10;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.item{
  width: 100%;
  position:relative;
  height: 50px;
  display: grid;
  grid-template-columns: auto 50px;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
}
.arrowIcon{
  margin-left: auto;
  font-size: 24px;
}
.titlebar{
  height: 51px;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  font-size: 16px;
  cursor: pointer;
}
.panel{
  width: 300px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
  z-index: 10;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
  transition: all cubic-bezier(0.4, 0, 0.2, 1) .3s;
}
</style>