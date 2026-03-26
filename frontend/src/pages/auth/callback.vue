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

// 手动解析 URL 参数（支持 hash fragment 和 query string）
function getQueryParam(param: string): string | null {
  // 先尝试从 query string 解析 (?code=xxx)
  let params = new URLSearchParams(window.location.search);
  let value = params.get(param);

  // 如果 query string 没有，尝试从 hash fragment 解析 (#code=xxx)
  if (!value && window.location.hash) {
    // 移除 # 号
    const hash = window.location.hash.substring(1);
    params = new URLSearchParams(hash);
    value = params.get(param);
  }

  return value;
}

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
    // 优先使用手动解析，其次使用 route.query
    const code = getQueryParam('code') || route.query.code as string;

    if (!code) {
      console.error('[Authing] No code found in URL');
      message.error("登录失败：未获取到授权码");
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    try {
      // handleRedirectCallback 会自动用 code 换 token并存入 SDK 内部存储
      await sdk.handleRedirectCallback();
      const state = await sdk.getLoginState();
      if (state) {
        // 通过后端换 JWT token
        await login(code);
      }
      // 优先从 URL 读取 redirect，兜底从 sessionStorage 读取
      const redirect =
        (route.query.redirect as string) ||
        sessionStorage.getItem(REDIRECT_KEY) ||
        "/";
      sessionStorage.removeItem(REDIRECT_KEY);
      window.location.replace(redirect);
    } catch (err) {
      console.error('[Authing] Login failed:', err);
      message.error("登录失败：" + (err as any)?.message || "未知错误");
      setTimeout(() => router.push('/'), 2000);
    }
    return;
  }

  // 直接发起 SSO 登录
  const redirect = (route.query.redirect as string) || "/";
  sessionStorage.setItem(REDIRECT_KEY, redirect);
  sdk.loginWithRedirect({ originalUri: redirect });
});
</script>
