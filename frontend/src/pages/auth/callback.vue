<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Authing } from "@authing/web";
import { message } from "ant-design-vue";

const router = useRouter();
const route = useRoute();
const { loginWithAuthing } = useAuth();
const api = useApi();

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
    try {
      // handleRedirectCallback 会自动用 code 换 token并存入 SDK 内部存储
      await sdk.handleRedirectCallback();
      const state = await sdk.getLoginState();

      if (state) {
        // 获取用户信息并调用后端 checkUser
        const userInfo = await sdk.getUserInfo() as any;

        // 检查是否获取到用户信息
        if (!userInfo || userInfo.code) {
          throw new Error(userInfo?.message || '获取用户信息失败');
        }

        // 调用后端创建/获取用户并获取 JWT token
        const result = await api.post<{
          token: string;
          expiresAt: string;
          user: {
            id: string;
            name: string | null;
            email: string | null;
            handle: string | null;
            image: string | null;
            role: string | null;
          };
        }>('/auth/checkUser', {
          authingUserId: userInfo.sub || userInfo._id || userInfo.userId, // Authing 用户唯一 ID
          name: userInfo.nickname || userInfo.username || userInfo.name,
          email: userInfo.email,
          picture: userInfo.photo || userInfo.picture || userInfo.avatar,
        });

        // 保存 token 和用户信息
        loginWithAuthing(result.user, result.token);
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
