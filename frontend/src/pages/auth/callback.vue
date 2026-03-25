<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Authing } from "@authing/web";
import { message } from "ant-design-vue";

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

const domain = import.meta.env.VITE_AUTHING_DOMAIN as string;
const appId = import.meta.env.VITE_AUTHING_APP_ID as string;
const userPoolId = import.meta.env.VITE_AUTHING_USER_POOL_ID as string;
const redirectUri =
  (import.meta.env.VITE_AUTHING_REDIRECT_URI as string) ||
  `${window.location.origin}/auth/callback`;

const sdk = new Authing({
  domain,
  appId,
  userPoolId,
  redirectUri,
});

const REDIRECT_KEY = "auth_redirect_uri";

onMounted(async () => {
  // 如果是 Authing 回调，处理 code
  if (sdk.isRedirectCallback()) {
    try {
      // handleRedirectCallback 会自动用 code 换 token并存入 SDK 内部存储
      await sdk.handleRedirectCallback();
      const state = await sdk.getLoginState();
      if (state) {
        // 从 SDK 获取 code，通过后端换 JWT token
        const code = route.query.code as string;
        if (code) {
          await login(code);
        }
      }
      // 优先从 URL 读取 redirect，兜底从 sessionStorage 读取
      const redirect =
        (route.query.redirect as string) ||
        sessionStorage.getItem(REDIRECT_KEY) ||
        "/";
      sessionStorage.removeItem(REDIRECT_KEY);
      window.location.replace(redirect);
    } catch {
      message.error("登录失败，请重试");
      window.location.replace("/");
    }
    return;
  }

  // 直接发起 SSO 登录
  const redirect = (route.query.redirect as string) || "/";
  sessionStorage.setItem(REDIRECT_KEY, redirect);
  sdk.loginWithRedirect({ originalUri: redirect });
});
</script>
