<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <!-- Admin Header -->
      <header class="admin-header">
        <div class="admin-header-inner">
          <!-- Logo & Back -->
          <div class="header-left">
            <router-link to="/" class="back-link">
              <ArrowLeftOutlined />
              <span>{{ $t("nav.clawhub") }}</span>
            </router-link>
            <div class="header-divider"></div>
            <h1 class="admin-title">Admin Panel</h1>
          </div>

          <!-- Right Actions -->
          <div class="header-right">
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
              <button type="button" class="icon-btn">
                <BulbOutlined v-if="effectiveTheme === 'light'" />
                <BulbFilled v-else-if="effectiveTheme === 'dark'" />
                <DesktopOutlined v-else />
              </button>
            </a-dropdown>

            <!-- User Dropdown -->
            <a-dropdown :trigger="['click']">
              <template #overlay>
                <a-menu>
                  <a-menu-item key="dashboard" @click="router.push('/dashboard')">
                    <DashboardOutlined /> {{ $t("nav.dashboard") }}
                  </a-menu-item>
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined /> {{ $t("nav.logout") }}
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
          </div>
        </div>
      </header>

      <!-- Admin Layout -->
      <div class="admin-layout">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar">
          <nav class="sidebar-nav">
            <router-link to="/admin" class="nav-item" :class="{ 'nav-item-active': route.path === '/admin' || route.path === '/admin/' }">
              <DashboardOutlined />
              <span>仪表盘</span>
            </router-link>

            <router-link to="/admin/skills" class="nav-item" :class="{ 'nav-item-active': route.path.startsWith('/admin/skills') }">
              <AppstoreOutlined />
              <span>技能管理</span>
            </router-link>

            <router-link to="/admin/users" class="nav-item" :class="{ 'nav-item-active': route.path.startsWith('/admin/users') }">
              <TeamOutlined />
              <span>用户管理</span>
            </router-link>
          </nav>

          <!-- Role Badge -->
          <div class="role-badge">
            <CrownOutlined v-if="isAdmin" />
            <SafetyOutlined v-else />
            <span>{{ user?.role === 'admin' ? 'Admin' : 'Moderator' }}</span>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="admin-main">
          <div class="admin-content">
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import {
  ArrowLeftOutlined,
  BulbFilled,
  BulbOutlined,
  DesktopOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/plugins/i18n";

const { isAuthenticated, logout, user, loaded, fetchSession } = useAuth();
const userDisplayName = computed(() => user.value?.displayName || user.value?.name || user.value?.handle || "User");
const isAdmin = computed(() => user.value?.role === "admin");
const isMod = computed(() => user.value?.role === "admin" || user.value?.role === "moderator");
const { effectiveTheme, antdTheme, setTheme, initTheme } = useTheme();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const mounted = ref(false);

// Admin access check
watch([isAuthenticated, loaded, user], () => {
  if (loaded.value) {
    if (!isAuthenticated.value) {
      router.push("/auth/callback?redirect=" + encodeURIComponent(route.fullPath));
    } else if (!isMod.value) {
      router.push("/");
    }
  }
}, { immediate: true });

onMounted(async () => {
  initTheme();

  // Fetch session if not loaded
  if (!loaded.value) {
    await fetchSession();
  }

  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

async function handleLogout() {
  await logout();
  message.success(t("messages.logged_out"));
}
</script>

<style scoped>
/* ─── Global ─── */
.min-h-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faff 0%, #faf5ff 50%, #fef7f0 100%);
}

[data-theme="dark"] .min-h-screen {
  background: linear-gradient(135deg, #0f1729 0%, #1a0f2e 50%, #1a1a2e 100%);
}

/* ─── Admin Header ─── */
.admin-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(227, 227, 233, 0.6);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
}

[data-theme="dark"] .admin-header {
  background: rgba(15, 23, 42, 0.7);
  border-bottom-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.admin-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #52525c;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-link:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #27272a;
}

[data-theme="dark"] .back-link {
  color: #94a3b8;
}

[data-theme="dark"] .back-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

.header-divider {
  width: 1px;
  height: 1.25rem;
  background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.4), transparent);
}

[data-theme="dark"] .header-divider {
  background: linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.admin-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ─── Icon Button ─── */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 99999px;
  color: #52525c;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  background: transparent;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #27272a;
}

[data-theme="dark"] .icon-btn {
  color: #94a3b8;
}

[data-theme="dark"] .icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
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
    0 1px 2px rgba(0, 0, 0, 0.06);
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

.user-avatar-wrapper {
  position: relative;
  width: 1.75rem;
  height: 1.75rem;
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
  font-size: 0.75rem;
}

.user-name {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Admin Layout ─── */
.admin-layout {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem;
  gap: 1.5rem;
  min-height: calc(100vh - 5rem);
}

/* ─── Sidebar ─── */
.admin-sidebar {
  width: 12rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 32px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .admin-sidebar {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #52525c;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #27272a;
}

.nav-item-active {
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  color: #fff;
  box-shadow:
    0 8px 16px rgba(43, 127, 255, 0.25),
    0 2px 4px rgba(43, 127, 255, 0.15);
}

.nav-item .anticon {
  font-size: 1.125rem;
}

[data-theme="dark"] .nav-item {
  color: #94a3b8;
}

[data-theme="dark"] .nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

[data-theme="dark"] .nav-item-active {
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  color: #fff;
  box-shadow:
    0 8px 16px rgba(43, 127, 255, 0.35),
    0 2px 4px rgba(43, 127, 255, 0.2);
}

/* ─── Role Badge ─── */
.role-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
  box-shadow:
    0 4px 12px rgba(251, 191, 36, 0.2),
    0 2px 4px rgba(251, 191, 36, 0.1);
}

[data-theme="dark"] .role-badge {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fde68a;
  box-shadow:
    0 4px 12px rgba(251, 191, 36, 0.15),
    0 2px 4px rgba(251, 191, 36, 0.1);
}

.role-badge .anticon {
  font-size: 0.875rem;
}

/* ─── Main Content ─── */
.admin-main {
  flex: 1;
  min-width: 0;
}

.admin-content {
  padding: 0.5rem 0;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
    padding: 1rem;
  }

  .admin-sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .sidebar-nav {
    flex-direction: row;
    flex: 1;
  }

  .nav-item {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .role-badge {
    display: none;
  }

  .admin-title {
    font-size: 1rem;
  }

  .back-link span {
    display: none;
  }
}
</style>
