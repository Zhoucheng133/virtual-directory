<template>
  <div class="mainPage" ref="mainPageRef">
    <div class="fixedArea">
      <div class="head" :style="{width: pageWidth-20+'px'}">
        <div class="pathItem" v-for="(item, index) in stores().path" :key="index" :style="{marginLeft: index==0 ? '10px' : '0'}" @click="stores().toDir(item)">
          <i class="bi bi-arrow-right-short" v-if="index!=0"></i><div class="pathText" :style="{fontWeight: index==stores().path.length-1 ? 'bold' : 'normal', color: index==stores().path.length-1 ? '#1677ff' : 'grey'}">{{ item }}</div>
        </div>
      </div>
      <div class="opHead" :style="{width: pageWidth-20+'px'}">
        <a-dropdown-button type="primary">
          上传
          <template #overlay>
          <a-menu>
            <a-menu-item key="1">
              上传文件夹
            </a-menu-item>
          </a-menu>
        </template>
        </a-dropdown-button>
        <div class="newFolderButton">新建文件夹</div>
        <div :class="stores().selectedCount!=0?'delButton':'delButton_disabled'">删除</div>
      </div>
      <div class="selectText" :style="{width: pageWidth-20+'px'}">
        已选择 {{ stores().selectedCount }} 个项目
      </div>
      <div class="tableHead" :style="{width: pageWidth-20+'px'}">
        <div class="tableHeadItem" style="justify-content: center; display: flex;">
          <a-checkbox @change="stores().allSelectToggle" v-model:checked="stores().allSelect" style="margin-right: 7px;">全选</a-checkbox>
        </div>
        <div class="tableHeadItem">文件名称</div>
        <div class="tableHeadItem">大小</div>
      </div>
    </div>
    <div class="content">
      <div v-for="(item, index) in stores().data" :key="index" @click="stores().openHandler(item)">
        <a-dropdown :trigger="['contextmenu']">
          <div :class="stores().data[index].isSelected ? 'tableSelected' : 'tableGrid'">
            <div class="tableItem" style="justify-content: center; display: flex;">
              <a-checkbox v-model:checked="stores().data[index].isSelected"></a-checkbox>
            </div>
            <div class="tableItem">
              <img :src="stores().getIconSrc(item)" width="25px" draggable="false">
            </div>
            <div class="tableItem">{{ item.fileName }}</div>
            <div class="tableItem">{{ item.isFile ? item.size: '' }}</div>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item key="1">打开</a-menu-item>
              <a-menu-divider />
              <a-menu-item key="2"><i class="bi bi-download" style="margin-right: 10px;"></i>下载</a-menu-item>
              <a-menu-divider />
              <a-menu-item key="3"><i class="bi bi-pen" style="margin-right: 10px;"></i>重命名</a-menu-item>
              <a-menu-item key="4"><i class="bi bi-trash3" style="margin-right: 10px;"></i>删除</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>
  <div :class="previewIn ? 'preview':'previewOut'" v-if="stores().preview.type!=''">
    <Preview @fadeOut="fadeOutPreview" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import stores from '../stores';
import Preview from './Preview.vue';
const mainPageRef=ref(null);
const pageWidth=ref(1000);
let previewIn=ref(true);
const fadeOutPreview=()=>{
  previewIn.value=false;
  setTimeout(() => {
    previewIn.value=true;
  }, 300);
  document.body.style.overflow = 'auto';
}
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
@keyframes fadeIn {
  0%{
    opacity: 0;
  }
  100%{
    opacity: 1;
  }
}
@keyframes fadeOut {
  0%{
    opacity: 1;
  }
  100%{
    opacity: 0;
  }
}
.previewOut{
  animation: fadeOut .2s linear forwards;
}
.preview{
  animation: fadeIn .2s linear forwards;
}
.preview, .previewOut{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}
.delButton_disabled{
  color: grey;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.delButton:hover{
  color: darkred;
}
.delButton{
  color: red;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.newFolderButton:hover{
  color: #0f5cc7;
}
.newFolderButton{
  color: #1677ff;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.opHead{
  display: flex;
  align-items: center;
}
.tableItem{
  font-size: 14px;
}
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
  /* border: 1px solid pink; */
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
  cursor: pointer;
  /* border: 1px solid green; */
}
.tableHead{
  display: grid;
  grid-template-columns: 100px auto 100px;
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
  transition: color linear .2s;
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