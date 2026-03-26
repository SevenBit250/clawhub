import { Authing } from "@authing/web";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  handle: string | null;
  displayName: string | null;
  image: string | null;
  bio: string | null;
  role: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loaded: boolean;
}

const authState = reactive<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  loaded: false,
});

// Restore token synchronously on module load (before first render)
const savedToken = localStorage.getItem("auth_token");
if (savedToken) {
  authState.token = savedToken;
  authState.isAuthenticated = true;
}

// Authing SDK instance
const authingDomain = import.meta.env.VITE_AUTHING_DOMAIN as string;
const authingAppId = import.meta.env.VITE_AUTHING_APP_ID as string;
const authingUserPoolId = import.meta.env.VITE_AUTHING_USER_POOL_ID as string;
const authingRedirectUri =
  (import.meta.env.VITE_AUTHING_REDIRECT_URI as string) ||
  `${window.location.origin}/auth/callback`;

const authingSdk = new Authing({
  domain: authingDomain,
  appId: authingAppId,
  userPoolId: authingUserPoolId,
  redirectUri: authingRedirectUri,
});

export function useAuth() {
  const api = useApi();

  function setAuth(user: User, token: string) {
    authState.token = token;
    authState.user = user;
    authState.isAuthenticated = true;
    localStorage.setItem("auth_token", token);
  }

  async function login(code: string) {
    const result = await api.get<{
      token: string;
      user: User;
    }>(`/auth/callback?code=${code}`);

    setAuth(result.user, result.token);

    return result;
  }

  async function logout() {
    if (authState.token) {
      await api.post("/auth/logout", {}, { token: authState.token });
    }
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
    localStorage.removeItem("auth_token");
    // 调用 Authing 登出并跳转
    authingSdk.logoutWithRedirect();
  }

  async function fetchSession() {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      authState.user = null;
      authState.isAuthenticated = false;
      authState.loaded = true;
      return null;
    }

    authState.token = token;

    try {
      const result = await api.get<{ user: User | null }>("/auth/session", { token });
      if (result.user) {
        authState.user = result.user;
        authState.isAuthenticated = true;
      } else {
        authState.token = null;
        authState.user = null;
        authState.isAuthenticated = false;
        localStorage.removeItem("auth_token");
      }
    } catch {
      authState.token = null;
      authState.user = null;
      authState.isAuthenticated = false;
      localStorage.removeItem("auth_token");
    }

    authState.loaded = true;
    return authState.user;
  }

  async function getAuthUrl() {
    const result = await api.get<{ url: string }>("/auth/url");
    return result.url;
  }

  function loginWithAuthing(user: User, token: string) {
    setAuth(user, token);
  }

  return {
    user: computed(() => authState.user),
    token: computed(() => authState.token),
    isAuthenticated: computed(() => authState.isAuthenticated),
    loaded: computed(() => authState.loaded),
    login,
    logout,
    fetchSession,
    getAuthUrl,
    loginWithAuthing,
  };
}
