import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
const pinia = createPinia()
import 'bootstrap-icons/font/bootstrap-icons.css'

createApp(App).use(pinia).mount('#app')
