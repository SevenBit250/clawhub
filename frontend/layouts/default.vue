<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <header class="header-nav">
        <nav class="container py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="text-xl font-bold">{{ $t('nav.clawhub') }}</NuxtLink>
            <a-input-search
              v-model:value="searchQuery"
              :placeholder="$t('nav.search_placeholder')"
              class="w-64"
              @search="handleSearch"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input-search>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/skills" class="nav-link">{{ $t('nav.skills') }}</NuxtLink>
            <NuxtLink to="/souls" class="nav-link">{{ $t('nav.souls') }}</NuxtLink>

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
              <a-button type="text" class="lang-toggle">
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
                    <BulbFilled /> {{ $t('nav.theme.light') }}
                  </a-menu-item>
                  <a-menu-item key="dark" @click="setTheme('dark')">
                    <BulbOutlined /> {{ $t('nav.theme.dark') }}
                  </a-menu-item>
                  <a-menu-item key="system" @click="setTheme('system')">
                    <DesktopOutlined /> {{ $t('nav.theme.system') }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="text" class="theme-toggle">
                <template #icon>
                  <BulbFilled v-if="effectiveTheme === 'light'" />
                  <BulbOutlined v-else-if="effectiveTheme === 'dark'" />
                  <DesktopOutlined v-else />
                </template>
              </a-button>
            </a-dropdown>

            <template v-if="isAuthenticated">
              <NuxtLink to="/dashboard" class="nav-link">{{ $t('nav.dashboard') }}</NuxtLink>
              <a-button @click="handleLogout">{{ $t('nav.logout') }}</a-button>
            </template>
            <template v-else>
              <a-button type="primary" @click="handleLogin">{{ $t('nav.login') }}</a-button>
            </template>
          </div>
        </nav>
      </header>

      <main class="flex-1">
        <slot />
      </main>

      <footer class="footer py-8 mt-16">
        <div class="container text-center text-gray-500">
          {{ $t('footer.brand') }}
        </div>
      </footer>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { SearchOutlined, BulbFilled, BulbOutlined, DesktopOutlined, GlobalOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { i18n } from "~/plugins/i18n";

const { isAuthenticated, logout } = useAuth();
const { effectiveTheme, antdTheme, setTheme, initTheme } = useTheme();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const searchQuery = ref("");

const LOCALE_KEY = "locale-preference";

function loadLocale() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "zh") {
      i18n.global.locale.value = saved;
    }
  }
}

function switchLocale(lang: string) {
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

function handleSearch(value: string) {
  if (value.trim()) {
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }
}
</script>

<style scoped>
.nav-link {
  color: var(--color-foreground);
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--color-primary);
}

.theme-toggle,
.lang-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
</style>
