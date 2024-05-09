import { defineStore } from "pinia";
import { ref, watch } from "vue";

export default defineStore('drag', ()=>{

  let onDrag=ref(false);
  
  const handleDragEnter=()=>{
    onDrag.value=true;
    console.log("in");
  }

  const handleDragLeave=(event)=>{
    event.preventDefault();
    console.log(event.clientX +": "+ event.clientY);
    if (event.clientX == 0 && event.clientY == 0) {
      onDrag.value = false;
      console.log("out");
    }
  }

  watch(onDrag, (newVal, oldVal)=>{
    if(newVal!=oldVal && newVal==true){
      document.body.style.overflowY = 'hidden';
    }else if(newVal!=oldVal && newVal==false){
      document.body.style.overflowY = 'auto';
    }
  })
  
  const drop=()=>{
    onDrag.value=false;
  }

  return { handleDragEnter, handleDragLeave, onDrag, drop }
})