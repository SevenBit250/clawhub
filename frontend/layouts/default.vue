<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <header class="header-nav">
        <nav class="container py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="text-xl font-bold">ClawHub</NuxtLink>
            <a-input-search
              v-model:value="searchQuery"
              placeholder="Search..."
              class="w-64"
              @search="handleSearch"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input-search>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/skills" class="nav-link">Skills</NuxtLink>
            <NuxtLink to="/souls" class="nav-link">Souls</NuxtLink>
            <a-dropdown :trigger="['click']">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="light" @click="setTheme('light')">
                    <BulbFilled /> Light
                  </a-menu-item>
                  <a-menu-item key="dark" @click="setTheme('dark')">
                    <BulbOutlined /> Dark
                  </a-menu-item>
                  <a-menu-item key="system" @click="setTheme('system')">
                    <DesktopOutlined /> System
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
              <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
              <a-button @click="handleLogout">Logout</a-button>
            </template>
            <template v-else>
              <a-button type="primary" @click="handleLogin">Login</a-button>
            </template>
          </div>
        </nav>
      </header>

      <main class="flex-1">
        <slot />
      </main>

      <footer class="footer py-8 mt-16">
        <div class="container text-center text-gray-500">
          ClawHub - Skill Marketplace
        </div>
      </footer>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { SearchOutlined, BulbFilled, BulbOutlined, DesktopOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const { isAuthenticated, logout } = useAuth();
const { effectiveTheme, antdTheme, setTheme, initTheme } = useTheme();
const router = useRouter();
const route = useRoute();
const searchQuery = ref("");

onMounted(() => {
  initTheme();
});

function handleLogin() {
  router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
}

async function handleLogout() {
  await logout();
  message.success("Logged out successfully");
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

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
</style>
