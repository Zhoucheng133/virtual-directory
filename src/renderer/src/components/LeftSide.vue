<template>
  <div class="bg">
    <a-form :label-col="{ style: { width: '70px' } }">
      <a-form-item label="简易模式">
        <div style="display: flex; align-items: center;">
          <a-switch v-model:checked="formData().easyMode" style="margin-right: 20px;" disabled></a-switch>
          <a-tooltip placement="bottom" title="简易模式下只能从客户端上传文件到本机">
            <i class="bi bi-question"></i>
          </a-tooltip>
        </div>
      </a-form-item>
      <a-form-item label="端口设置">
        <a-input-number v-model:value="formData().port" :min="1000" :max="9999" style="margin-right: 20px;"  :disabled="mainData().onRunning"></a-input-number> 
      </a-form-item>
      <a-form-item label="映射目录">
        <div style="display: flex; align-items: center;">
          <a-tooltip placement="bottom" :title="formData().dir">
            <a-input v-model:value="formData().dir" spellcheck="false" disabled></a-input>
          </a-tooltip>
          <a-button style="margin-left: 10px;" @click="formData().selectDir" :disabled="mainData().onRunning">浏览</a-button>
        </div>
      </a-form-item>
      <a-form-item label="设置权限">
        <div style="display: flex; flex-direction: column; margin-top: 5px;">
          <a-checkbox v-model:checked="formData().read" disabled>读取</a-checkbox>
          <a-checkbox v-model:checked="formData().write" disabled>写入</a-checkbox>
          <a-checkbox v-model:checked="formData().del" disabled>删除</a-checkbox>
        </div>
      </a-form-item>
      <a-form-item label="需要登陆">
        <a-switch v-model:checked="formData().useLogin" :disabled="mainData().onRunning"></a-switch>
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="formData().username" :disabled="!formData().useLogin || mainData().onRunning"></a-input>
      </a-form-item>
      <a-form-item label="密码">
        <a-input-password v-model:value="formData().password" :disabled="!formData().useLogin || mainData().onRunning"></a-input-password>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import formData from '@renderer/stores/formData';
import mainData from '@renderer/stores/mainData';
import { onMounted } from 'vue';
onMounted(()=>{
  const form=localStorage.getItem('form');
  if(form){
    const data=JSON.parse(form);
    formData().setForm(data);
  }
})
</script>

<style scoped>
.bg{
  width: 100%;
  padding: 30px;
  padding-top: 20px;
  user-select: none;
}
.bi-question{
  font-size: 20px;
}
</style>