<template>
  <div class="body">
    <a-upload-dragger
      v-model:fileList="upload().fileList"
      name="file"
      :multiple="true"
      :action="upload().uploadURL()"
      :showUploadList="false"
      @drop="drag().drop"
    >
      <p class="ant-upload-drag-icon">
        <inbox-outlined></inbox-outlined>
      </p>
      <p class="ant-upload-text">将文件拖拽到这里上传</p>
      <p class="ant-upload-hint">
        支持多文件
      </p>
    </a-upload-dragger>
  </div>
</template>

<script setup>
import upload from '../stores/upload';
import { InboxOutlined } from '@ant-design/icons-vue';
import drag from '../stores/drag';
const closePreview=()=>{
  drag().drop();
}
</script>

<style>
:where(.css-dev-only-do-not-override-16pw25h).ant-upload-wrapper .ant-upload-drag .ant-upload-btn{
  width: calc(100vw - 60px) !important;
  height: calc(100vh - 60px) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}
</style>

<style scoped>
.ant-upload-text{
  margin-left: 100px !important;
  margin-right: 100px !important;
}
.body{
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
}
</style>