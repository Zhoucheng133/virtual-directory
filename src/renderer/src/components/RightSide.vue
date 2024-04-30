<template>
  <div class="bg">
    <div class="logPanel">

    </div>
    <a-button class="runButton" type="primary">启动服务</a-button>
  </div>
</template>

<style scoped>
.runButton{
  margin-top: 20px;

}
.logPanel{
  width: 100%;
  flex: 1;
  background-color: rgb(250, 250, 250);
  border-radius: 10px;
}
.bg{
  width: 100%;
  user-select: none;
  display: flex;
  flex-direction: column;
  padding: 30px;
  padding-top: 20px;
  padding-bottom: 40px;
}
</style>