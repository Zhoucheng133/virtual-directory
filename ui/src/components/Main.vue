<template>
  <div class="mainPage" ref="mainPageRef">
    <div class="fixedArea">
      <div class="head" :style="{width: pageWidth-20+'px'}">
        <div class="pathItem" v-for="(item, index) in stores().path" :key="index" :style="{marginLeft: index==0 ? '10px' : '0'}">
          <i class="bi bi-arrow-right-short" v-if="index!=0"></i><div class="pathText" :style="{fontWeight: index==stores().path.length-1 ? 'bold' : 'normal', color: index==stores().path.length-1 ? '#1677ff' : 'grey'}">{{ item }}</div>
        </div>
      </div>
      <div class="opHead" :style="{width: pageWidth-20+'px'}">

      </div>
      <div class="selectText" :style="{width: pageWidth-20+'px'}">
        已选择 {{ stores().selectedCount }} 个项目
      </div>
      <div class="tableHead" :style="{width: pageWidth-20+'px'}">
        <div class="tableHeadItem"></div>
        <div class="tableHeadItem"></div>
        <div class="tableHeadItem">文件名称</div>
        <div class="tableHeadItem">大小</div>
      </div>
    </div>
    <div class="content">
      <div  v-for="(item, index) in stores().data" :key="index" :class="stores().data[index].isSelected ? 'tableSelected' : 'tableGrid'">
        <div class="tableItem" style="justify-content: center; display: flex;">
          <a-checkbox v-model:checked="stores().data[index].isSelected"></a-checkbox>
        </div>
        <div class="tableItem">
          <img :src="stores().getIconSrc(item)" width="30px" draggable="false">
        </div>
        <div class="tableItem">{{ item.fileName }}</div>
        <div class="tableItem">{{ item.isFile ? item.size: '' }}</div>
      </div>
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
.selectText{
  height: 30px;
  display: flex;
  align-items: center;
}
.fixedArea{
  position: fixed;
  top: 0;
  background-color: white;
  z-index: 10;
}
.tableSelected{
  background-color: rgb(245, 245, 245);
}
.tableGrid:hover, .tableSelected:hover{
  background-color: rgb(240, 240, 240);
}
.opHead{
  /* position: fixed; */
  /* top: 50px; */
  border: 1px solid pink;
  height: 40px;
  background-color: white;
  z-index: 10;
}
.content{
  margin-top: 160px;
}
.tableGrid, .tableSelected{
  display: grid;
  grid-template-columns: 50px 50px auto 100px;
  height: 40px;
  align-items: center;
  border-radius: 10px;
  transition: background-color linear .2s;
  /* border: 1px solid green; */
}
.tableHead{
  display: grid;
  grid-template-columns: 50px 50px auto 100px;
  /* max-width: 1000px; */
  /* position: fixed; */
  height: 30px;
  align-items: center;
  /* border: 1px solid blue; */
  background-color: white;
  /* top: 90px; */
  /* z-index: 10; */
  border-bottom: 1px solid lightgrey;
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
  /* position: fixed; */
  height: 50px;
  /* background-color: red; */
  /* border: 1px solid; */
  max-width: 1000px;
  display: flex;
  align-items: center;
  overflow: auto;
  /* border: 1px solid red; */
  background-color: white;
  /* top: 0; */
  z-index: 10;
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
  /* padding: 10px; */
  padding-left: 10px;
  padding-right: 10px;
  max-width: 1000px;
  margin: auto;
  user-select: none;
  padding-bottom: 20px;
  /* height: 200px; */
  /* background-color: red; */
}
</style>