import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue';
import { createPinia } from 'pinia';
const pinia = createPinia();
import 'bootstrap-icons/font/bootstrap-icons.css';

createApp(App).use(Antd).use(pinia).mount('#app');