<template>
  <div>
    这是登陆页面: {{ num }}
    <button @click="test">测试</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

let num=ref(0);
const test=()=>{
  num.value+=1;
}

</script>