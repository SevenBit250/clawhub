<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Authing } from "@authing/web";

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

onMounted(async () => {
  // 如果是 Authing 回调，处理 code
  if (sdk.isRedirectCallback()) {
    const redirect = (route.query.redirect as string) || "/";
    try {
      await sdk.handleRedirectCallback();
      const code = route.query.code as string;
      if (code) {
        await login(code);
      }
      router.push(redirect);
    } catch {
      router.push("/");
    }
    return;
  }

  // 直接发起 SSO 登录
  const redirect = (route.query.redirect as string) || "/";
  sdk.loginWithRedirect({ originalUri: redirect });
});
</script>
