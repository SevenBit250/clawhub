<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <header class="header-nav">
        <nav class="container nav-inner">
          <!-- Logo -->
          <router-link to="/" class="logo-link">
            <img src="@/assets/logo.png" alt="ClawHub" class="logo-img" />
            <span class="logo-text">{{ $t("nav.clawhub") }}</span>
          </router-link>

          <!-- Nav -->
          <div class="nav-group">
            <router-link to="/" custom v-slot="{ isActive, navigate }">
              <div class="nav-pill" :class="{ 'nav-pill-active': isActive }" @click="navigate">
                {{ $t("nav.home") }}
              </div>
            </router-link>
            <router-link to="/skills" custom v-slot="{ isActive, navigate }">
              <div class="nav-pill" :class="{ 'nav-pill-active': isActive }" @click="navigate">
                {{ $t("nav.skills") }}
              </div>
            </router-link>
            <router-link to="/souls" custom v-slot="{ isActive, navigate }">
              <div class="nav-pill" :class="{ 'nav-pill-active': isActive }" @click="navigate">
                {{ $t("nav.souls") }}
              </div>
            </router-link>
            <router-link to="/demands" custom v-slot="{ isActive, navigate }">
              <div class="nav-pill" :class="{ 'nav-pill-active': isActive }" @click="navigate">
                {{ $t("nav.demands") }}
              </div>
            </router-link>

            <!-- Language Switcher -->
            <a-dropdown :trigger="['click']">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="en" @click="switchLocale('en')">
                    <GlobalOutlined /> English
                  </a-menu-item>
                  <a-menu-item key="zh" @click="switchLocale('zh')">
                    <GlobalOutlined /> 中文
                  </a-menu-item>
                </a-menu>
              </template>
              <button type="button" class="nav-icon-btn lang-toggle">
                <GlobalOutlined />
              </button>
            </a-dropdown>

            <!-- Theme Toggle -->
            <a-dropdown :trigger="['click']">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="light" @click="setTheme('light')">
                    <BulbOutlined /> {{ $t("nav.theme.light") }}
                  </a-menu-item>
                  <a-menu-item key="dark" @click="setTheme('dark')">
                    <BulbFilled /> {{ $t("nav.theme.dark") }}
                  </a-menu-item>
                  <a-menu-item key="system" @click="setTheme('system')">
                    <DesktopOutlined /> {{ $t("nav.theme.system") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <button type="button" class="nav-icon-btn theme-toggle">
                <BulbOutlined v-if="effectiveTheme === 'light'" />
                <BulbFilled v-else-if="effectiveTheme === 'dark'" />
                <DesktopOutlined v-else />
              </button>
            </a-dropdown>

            <template v-if="isAuthenticated">
              <a-dropdown :trigger="['click']">
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="dashboard" @click="router.push('/dashboard')">
                      {{ $t("nav.dashboard") }}
                    </a-menu-item>
                    <a-menu-item key="logout" @click="handleLogout">
                      {{ $t("nav.logout") }}
                    </a-menu-item>
                  </a-menu>
                </template>
                <button type="button" class="user-pill">
                  <div class="user-avatar-wrapper">
                    <img
                      v-if="user?.image"
                      :src="user.image"
                      :alt="userDisplayName"
                      class="user-avatar"
                    />
                    <div v-else class="user-avatar user-avatar-default">
                      <UserOutlined />
                    </div>
                  </div>
                  <span class="user-name">{{ userDisplayName }}</span>
                </button>
              </a-dropdown>
            </template>
            <template v-else>
              <button type="button" class="login-btn" @click="handleLogin">
                {{ $t("nav.login") }}
              </button>
            </template>
          </div>
        </nav>
      </header>

      <main class="main-scroll">
        <div class="main-content">
          <slot />
          <footer class="page-footer">
            <div class="container text-center text-gray-500">
              {{ $t("footer.brand") }}
            </div>
          </footer>
        </div>
      </main>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { BulbFilled, BulbOutlined, DesktopOutlined, GlobalOutlined, UserOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/plugins/i18n";

const { isAuthenticated, logout, user } = useAuth();
const userDisplayName = computed(() => user.value?.displayName || user.value?.name || user.value?.handle || "User");
const { effectiveTheme, antdTheme, setTheme, initTheme } = useTheme();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const LOCALE_KEY = "locale-preference";

function loadLocale() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "zh") {
      i18n.global.locale.value = saved;
    }
  }
}

function switchLocale(lang: 'zh' | 'en') {
  i18n.global.locale.value = lang;
  localStorage.setItem(LOCALE_KEY, lang);
}

onMounted(() => {
  initTheme();
  loadLocale();
});

function handleLogin() {
  router.push(`/auth/callback?redirect=${encodeURIComponent(route.fullPath)}`);
}

async function handleLogout() {
  await logout();
  message.success(t("messages.logged_out"));
}
</script>

<style scoped>
/* ─── Global Scroll Layout ─── */
.min-h-screen {
  min-height: 100vh;
}

.main-scroll {
  padding-top: 4.5rem;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  /* Custom scrollbar styles */
  scrollbar-width: thin;
  scrollbar-color: rgba(159, 159, 169, 0.3) transparent;
  scroll-behavior: smooth;
}

/* Webkit scrollbar (Chrome, Safari, Edge) */
.main-scroll::-webkit-scrollbar {
  width: 8px;
}

.main-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.main-scroll::-webkit-scrollbar-thumb {
  background: rgba(159, 159, 169, 0.3);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.main-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(159, 159, 169, 0.5);
  background-clip: content-box;
}

/* Dark theme scrollbar */
[data-theme="dark"] .main-scroll {
  scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
}

[data-theme="dark"] .main-scroll::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  background-clip: content-box;
}

[data-theme="dark"] .main-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
  background-clip: content-box;
}

/* ─── Nav Group ─── */
.nav-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ─── Nav Pill ─── */
.nav-pill {
  padding: 0.5rem 1.25rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: #52525c;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
  user-select: none;
}

.nav-pill:hover {
  color: #27272a;
}

/* Active state — solid Dodger Blue with colored shadow */
.nav-pill-active {
  background: #2b7fff;
  color: #fff;
  box-shadow:
    0 10px 15px -3px rgba(43, 127, 255, 0.3),
    0 4px 6px -4px rgba(43, 127, 255, 0.3);
  transform: translateY(0);
}

.nav-pill-active:hover {
  background: #2b7fff;
  color: #fff;
  opacity: 0.92;
}

/* ─── Logo ─── */
.logo-link {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.logo-link:hover {
  opacity: 0.85;
}

.logo-img {
  height: 4rem;
  width: auto;
}

.logo-text {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 900;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
}

/* ─── Icon Buttons ─── */
.nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  border-radius: 99999px;
  color: #52525c;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
}

.nav-icon-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #27272a;
}

/* ─── User Pill ─── */
.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #27272a;
  border: 1px solid rgba(228, 228, 231, 0.6);
  background: rgba(255, 255, 255, 0.8);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-pill:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(43, 127, 255, 0.3);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.user-pill:active {
  transform: translateY(0) scale(0.98);
}

.user-avatar-wrapper {
  position: relative;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 99999px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.08);
}

.user-avatar-default {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.875rem;
}

.user-name {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Login Button ─── */
.login-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.5rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #3f3f46;
  border: 1px solid rgba(228, 228, 231, 0.6);
  background: rgba(255, 255, 255, 0.8);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(43, 127, 255, 0.4);
  color: #27272a;
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.08);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .nav-pill {
  color: #94a3b8;
}

[data-theme="dark"] .nav-pill:hover {
  color: #f1f5f9;
}

[data-theme="dark"] .nav-pill-active {
  background: #2b7fff;
  opacity: 0.95;
}

[data-theme="dark"] .nav-pill-active:hover {
  opacity: 0.85;
}

[data-theme="dark"] .nav-icon-btn {
  color: #94a3b8;
}

[data-theme="dark"] .nav-icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

[data-theme="dark"] .login-btn {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.2);
  color: #f1f5f9;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .login-btn:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.4);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ─── User Pill Dark Theme ─── */
[data-theme="dark"] .user-pill {
  color: #f1f5f9;
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(30, 35, 60, 0.6);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .user-pill:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.35);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.25);
}

[data-theme="dark"] .user-avatar {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3);
}

/* ─── Page Footer (inside main scroll) ─── */
.main-content {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 4.5rem);
}

.page-footer {
  margin-top: auto;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(237, 237, 237, 0.4);
}

[data-theme="dark"] .page-footer {
  border-top-color: rgba(99, 102, 241, 0.12);
}
</style>
