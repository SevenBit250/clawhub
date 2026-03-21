import { defineNuxtPlugin } from "#imports";
import {
  Button,
  Input,
  Select,
  Card,
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Tag,
  Space,
  Spin,
  Result,
  message,
  ConfigProvider,
  theme,
} from "ant-design-vue";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ConfigProvider);
  nuxtApp.vueApp.use(Button);
  nuxtApp.vueApp.use(Input);
  nuxtApp.vueApp.use(Select);
  nuxtApp.vueApp.use(Card);
  nuxtApp.vueApp.use(Layout);
  nuxtApp.vueApp.use(Menu);
  nuxtApp.vueApp.use(Dropdown);
  nuxtApp.vueApp.use(Avatar);
  nuxtApp.vueApp.use(Tag);
  nuxtApp.vueApp.use(Space);
  nuxtApp.vueApp.use(Spin);
  nuxtApp.vueApp.use(Result);

  return {
    provide: {
      message,
      theme,
    },
  };
});
