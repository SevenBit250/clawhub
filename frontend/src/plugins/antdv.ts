import type { App } from "vue";
import { message, theme } from "ant-design-vue";

export { message, theme };

export default {
  install(app: App) {
    // Components are auto-registered by unplugin-vue-components
    // This plugin only exports utilities
  },
};
