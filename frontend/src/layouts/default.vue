<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <header class="header-nav">
        <nav class="container py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <router-link to="/" class="text-xl font-bold">{{ $t("nav.clawhub") }}</router-link>
          </div>
          <div class="flex items-center gap-2">
            <router-link to="/" class="nav-btn" active-class="nav-btn-active">
              {{ $t("nav.home") }}
            </router-link>
            <router-link to="/skills" class="nav-btn" active-class="nav-btn-active">
              {{ $t("nav.skills") }}
            </router-link>
            <router-link to="/souls" class="nav-btn" active-class="nav-btn-active">
              {{ $t("nav.souls") }}
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
              <a-button type="text" class="nav-btn lang-toggle">
                <template #icon>
                  <GlobalOutlined />
                </template>
              </a-button>
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
              <a-button type="text" class="nav-btn theme-toggle">
                <template #icon>
                  <BulbOutlined v-if="effectiveTheme === 'light'" />
                  <BulbFilled v-else-if="effectiveTheme === 'dark'" />
                  <DesktopOutlined v-else />
                </template>
              </a-button>
            </a-dropdown>

            <template v-if="isAuthenticated">
              <a-button type="text" class="nav-btn">
                <router-link to="/dashboard">{{ $t("nav.dashboard") }}</router-link>
              </a-button>
              <a-button type="text" class="nav-btn" @click="handleLogout">{{ $t("nav.logout") }}</a-button>
            </template>
            <template v-else>
              <a-button type="text" class="nav-btn" @click="handleLogin">{{ $t("nav.login") }}</a-button>
            </template>
          </div>
        </nav>
      </header>

      <main class="flex-1">
        <slot />
      </main>

      <footer class="footer py-1.5">
        <div class="container text-center text-gray-500">
          {{ $t("footer.brand") }}
        </div>
      </footer>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { BulbFilled, BulbOutlined, DesktopOutlined, GlobalOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/plugins/i18n";

const { isAuthenticated, logout } = useAuth();
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
  router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
}

async function handleLogout() {
  await logout();
  message.success(t("messages.logged_out"));
}
</script>

<style scoped>
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-btn:hover {
  color: var(--color-foreground);
  background: var(--color-hover);
}

.nav-btn-active {
  color: var(--color-primary);
  font-weight: 500;
}

.nav-btn-active:hover {
  color: var(--color-primary);
}
</style>
