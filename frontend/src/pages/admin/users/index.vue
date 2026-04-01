<template>
  <div class="admin-users">
    <!-- Search -->
    <div class="search-section motion-up-16" :class="{ 'in': mounted }">
      <a-input
        v-model:value="searchQuery"
        placeholder="搜索用户名、邮箱或 handle..."
        allow-clear
        size="large"
        class="search-input"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>
    </div>

    <!-- Users List -->
    <div class="users-section motion-up-20 motion-delay-1" :class="{ 'in': mounted }">
      <a-spin :spinning="loading">
        <div v-if="filteredUsers.length > 0" class="users-list">
          <div
            v-for="user in paginatedUsers"
            :key="user.id"
            class="user-card"
          >
            <div class="user-header">
              <div class="user-avatar-wrapper">
                <img
                  v-if="user.image"
                  :src="user.image"
                  :alt="user.displayName || user.handle"
                  class="user-avatar"
                />
                <div v-else class="user-avatar user-avatar-default">
                  <UserOutlined />
                </div>
              </div>

              <div class="user-info">
                <h3 class="user-name">
                  {{ user.displayName || user.handle || "未知用户" }}
                </h3>
                <p v-if="user.handle" class="user-handle">@{{ user.handle }}</p>
                <p v-if="user.email" class="user-email">{{ user.email }}</p>
              </div>

              <span :class="['role-badge', `role-badge--${user.role || 'user'}`]">
                {{ getRoleLabel(user.role) }}
              </span>
            </div>

            <div class="user-meta">
              <div class="meta-item">
                <CalendarOutlined />
                <span>注册于: {{ formatDate(user.createdAt) }}</span>
              </div>
            </div>

            <div class="user-actions">
              <a-dropdown :trigger="['click']">
                <button class="role-btn">
                  <SettingOutlined />
                  <span>更改角色</span>
                  <DownOutlined />
                </button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item
                      v-for="role in roleOptions"
                      :key="role.value"
                      :disabled="role.value === user.role"
                      @click="handleRoleChange(user.id, role.value)"
                    >
                      <CrownOutlined v-if="role.value === 'admin'" />
                      <SafetyOutlined v-else-if="role.value === 'moderator'" />
                      <UserOutlined v-else />
                      <span>{{ role.label }}</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>

              <router-link :to="`/admin/users/${user.id}`" class="detail-link">
                <EyeOutlined />
                <span>详情</span>
              </router-link>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <SearchOutlined class="empty-icon" />
          <p>没有找到匹配的用户</p>
        </div>
      </a-spin>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
      <a-pagination
        v-model:current="currentPage"
        :total="filteredUsers.length"
        :page-size="pageSize"
        :show-size-changer="false"
        show-quick-jumper
        :show-total="(total: number) => `共 ${total} 条`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  DownOutlined,
  CrownOutlined,
  SafetyOutlined,
  EyeOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";

const mounted = ref(false);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = 12;

const { token, user: currentUser } = useAuth();
const api = useApi();

interface User {
  id: string;
  handle: string | null;
  displayName: string | null;
  email: string | null;
  image: string | null;
  role: "admin" | "moderator" | "user" | null;
  createdAt: Date;
}

const users = ref<User[]>([]);

const roleOptions = [
  { value: "admin", label: "管理员" },
  { value: "moderator", label: "审核员" },
  { value: "user", label: "普通用户" },
];

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value;
  }

  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(query) ||
      u.handle?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
  );
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUsers.value.slice(start, end);
});

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  await fetchUsers();
});

async function fetchUsers() {
  loading.value = true;
  try {
    const response = await api.get<{ items: User[] }>("/api/v1/admin/users", { token: token.value });
    users.value = response.items || [];
  } catch (error: any) {
    message.error(error.message || "Failed to fetch users");
  } finally {
    loading.value = false;
  }
}

function getRoleLabel(role: string | null): string {
  const labels: Record<string, string> = {
    admin: "管理员",
    moderator: "审核员",
    user: "用户",
  };
  return labels[role || "user"] || "用户";
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function handleRoleChange(userId: string, newRole: string) {
  // Prevent self role change
  if (userId === currentUser.value?.id) {
    message.warning("不能修改自己的角色");
    return;
  }

  try {
    await api.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole }, { token: token.value });
    message.success("角色更新成功");
    await fetchUsers();
  } catch (error: any) {
    message.error(error.message || "角色更新失败");
  }
}

watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.admin-users {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Search Section ─── */
.search-section {
  max-width: 480px;
}

.search-input {
  border-radius: 99999px !important;
}

/* ─── Users Section ─── */
.users-section {
  min-height: 200px;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.user-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.02);
  padding: 1.25rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.user-card:hover {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.03);
}

[data-theme="dark"] .user-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .user-card:hover {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.user-header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
}

.user-avatar-wrapper {
  width: 3rem;
  height: 3rem;
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
  font-size: 1.25rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #27272a;
  margin: 0 0 0.125rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .user-name {
  color: #f1f5f9;
}

.user-handle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #71717a;
  margin: 0 0 0.125rem 0;
}

[data-theme="dark"] .user-handle {
  color: #64748b;
}

.user-email {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #a1a1aa;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .user-email {
  color: #71717a;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.role-badge--admin {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.role-badge--moderator {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.role-badge--user {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
}

[data-theme="dark"] .role-badge--admin {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fde68a;
}

[data-theme="dark"] .role-badge--moderator {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: #93c5fd;
}

[data-theme="dark"] .role-badge--user {
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  color: #d1d5db;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .user-meta {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #71717a;
}

[data-theme="dark"] .meta-item {
  color: #64748b;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
}

.role-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #52525c;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #27272a;
}

[data-theme="dark"] .role-btn {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .role-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #52525c;
  background: rgba(43, 127, 255, 0.1);
  border: none;
  text-decoration: none;
  transition: all 0.2s ease;
}

.detail-link:hover {
  background: rgba(43, 127, 255, 0.15);
  color: #2b7fff;
}

[data-theme="dark"] .detail-link {
  color: #94a3b8;
  background: rgba(43, 127, 255, 0.15);
}

[data-theme="dark"] .detail-link:hover {
  background: rgba(43, 127, 255, 0.25);
  color: #60a5fa;
}

/* ─── Empty State ─── */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  color: #d4d4d8;
  margin-bottom: 1rem;
}

[data-theme="dark"] .empty-icon {
  color: #52525b;
}

.empty-state p {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  color: #71717a;
  margin: 0;
}

[data-theme="dark"] .empty-state p {
  color: #64748b;
}

/* ─── Pagination ─── */
.pagination-section {
  display: flex;
  justify-content: center;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .users-list {
    grid-template-columns: 1fr;
  }

  .user-actions {
    width: 100%;
  }

  .role-btn,
  .detail-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
