import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
const pinia = createPinia();
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';

createApp(App).use(VuePlyr, {plyr: {}}).use(Antd).use(pinia).mount('#app');
