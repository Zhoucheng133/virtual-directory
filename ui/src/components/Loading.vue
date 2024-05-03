<template>
  <div class="bg">
    <loading-outlined style="margin-right: 10px;" /> Loading...
  </div>
</template>

<script lang="ts" setup>
import { LoadingOutlined } from '@ant-design/icons-vue';
</script>

<style>
body{
  margin: 0;
}
</style>

<style scoped>
.bg{
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
</style>