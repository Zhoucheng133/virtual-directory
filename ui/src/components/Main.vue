<template>
  <div class="mainPage" ref="mainPageRef">
    <div class="head" :style="{width: pageWidth-20+'px'}">
      <div class="pathItem" v-for="(item, index) in stores().path" :key="index" :style="{marginLeft: index==0 ? '10px' : '0'}">
        <i class="bi bi-arrow-right-short" v-if="index!=0"></i><div class="pathText" :style="{fontWeight: index==stores().path.length-1 ? 'bold' : 'normal', color: index==stores().path.length-1 ? '#1677ff' : 'grey'}">{{ item }}</div>
      </div>
    </div>
    <div class="tableHead" :style="{width: pageWidth-20+'px'}">
      <div class="tableHeadItem"></div>
      <div class="tableHeadItem"></div>
      <div class="tableHeadItem">文件名称</div>
      <div class="tableHeadItem">大小</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import stores from '../stores';
const mainPageRef:any=ref(null);
const pageWidth=ref(1000);
window.onresize=()=>{
  pageWidth.value=mainPageRef.value.offsetWidth;
}
onMounted(()=>{
  stores().getData();
})
</script>

<style>
body{
  margin: 0;
}
</style>

<style scoped>
.tableHead{
  display: grid;
  grid-template-columns: 50px 50px auto 100px;
  /* max-width: 1000px; */
  position: fixed;
  margin-top: 50px;
  height: 30px;
  align-items: center;
  border: 1px solid blue;
}
.pathText:hover{
  color: #1677ff !important;
}
.pathText{
  transition: all linear .2s;
  cursor: pointer;
}
.pathItem{
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.pageTitle{
  display: flex;
  align-items: center;
}
.head{
  position: fixed;
  height: 50px;
  /* background-color: red; */
  /* border: 1px solid; */
  max-width: 1000px;
  display: flex;
  align-items: center;
  overflow: auto;
  border: 1px solid red;
}
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar:hover{
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background-color: white;
  border-radius: 2.5px;
}
::-webkit-scrollbar-thumb {
  background-color: rgb(240, 240, 240);
  border-radius: 2.5px;
}
::-webkit-scrollbar-thumb:hover{
  background-color: grey;
}
.mainPage{
  padding: 10px;
  max-width: 1000px;
  margin: auto;
  user-select: none;
  /* height: 200px; */
  /* background-color: red; */
}
</style>