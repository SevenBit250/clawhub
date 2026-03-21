import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { i18n } from "./plugins/i18n";
import antdvPlugin from "./plugins/antdv";
import { message } from "ant-design-vue";
import "@/assets/css/main.css";

const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(antdvPlugin);

app.config.globalProperties.$message = message;

app.mount("#app");
