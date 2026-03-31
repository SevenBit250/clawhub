<template>
  <div class="admin-user-detail">
    <a-spin :spinning="loading">
      <template v-if="user">
        <!-- Back Button -->
        <div class="back-section motion-up-12" :class="{ 'in': mounted }">
          <button class="back-btn" @click="router.back()">
            <ArrowLeftOutlined />
            <span>返回用户管理</span>
          </button>
        </div>

        <!-- User Header -->
        <div class="user-header-section motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
          <div class="user-header-card">
            <div class="user-header-top">
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
                <h1 class="user-name">{{ user.displayName || "未知用户" }}</h1>
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
          </div>
        </div>

        <!-- Role Management -->
        <div v-if="user.id !== currentUser?.id" class="role-section motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
          <h2 class="section-title">角色管理</h2>
          <div class="role-options">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              :class="['role-option', { 'role-option-active': user.role === role.value }]"
              :disabled="user.role === role.value"
              @click="handleRoleChange(role.value)"
            >
              <CrownOutlined v-if="role.value === 'admin'" class="role-icon" />
              <SafetyOutlined v-else-if="role.value === 'moderator'" class="role-icon" />
              <UserOutlined v-else class="role-icon" />
              <span>{{ role.label }}</span>
              <CheckOutlined v-if="user.role === role.value" class="check-icon" />
            </button>
          </div>
        </div>

        <div v-else class="self-notice motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
          <InfoCircleOutlined />
          <span>您不能修改自己的角色</span>
        </div>

        <!-- User Skills -->
        <div class="skills-section motion-up-16 motion-delay-3" :class="{ 'in': mounted }">
          <h2 class="section-title">拥有的技能</h2>
          <a-spin :spinning="skillsLoading">
            <div v-if="userSkills.length > 0" class="skills-grid">
              <router-link
                v-for="skill in userSkills"
                :key="skill.id"
                :to="`/skills/${skill.slug}`"
                class="skill-card"
              >
                <div class="skill-header">
                  <h3 class="skill-title">{{ skill.displayName }}</h3>
                  <span :class="['skill-badge', `skill-badge--${skill.moderationStatus}`]">
                    {{ getStatusLabel(skill.moderationStatus) }}
                  </span>
                </div>
                <p class="skill-summary">{{ skill.summary || "暂无描述" }}</p>
                <div class="skill-meta">
                  <CalendarOutlined />
                  <span>{{ formatDate(skill.createdAt) }}</span>
                </div>
              </router-link>
            </div>
            <div v-else class="empty-skills">
              <InboxOutlined class="empty-icon" />
              <p>该用户暂无技能</p>
            </div>
          </a-spin>
        </div>
      </template>

      <div v-else-if="!loading" class="error-state">
        <ExclamationCircleOutlined class="error-icon" />
        <p>用户不存在</p>
        <button class="back-btn" @click="router.back()">返回</button>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  CrownOutlined,
  SafetyOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";

const mounted = ref(false);
const loading = ref(true);
const skillsLoading = ref(true);

const route = useRoute();
const router = useRouter();
const { token, user: currentUser } = useAuth();
const api = useApi();

const userId = computed(() => route.params.id as string);

interface User {
  id: string;
  handle: string | null;
  displayName: string | null;
  email: string | null;
  image: string | null;
  role: "admin" | "moderator" | "user" | null;
  createdAt: Date;
}

interface Skill {
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  moderationStatus: "pending" | "active" | "hidden" | "removed";
  createdAt: Date;
}

const user = ref<User | null>(null);
const userSkills = ref<Skill[]>([]);

const roleOptions = [
  { value: "admin", label: "管理员" },
  { value: "moderator", label: "审核员" },
  { value: "user", label: "普通用户" },
];

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  await Promise.all([fetchUser(), fetchUserSkills()]);
});

async function fetchUser() {
  loading.value = true;
  try {
    // Try admin endpoint first
    const response = await api.get<{ items: User[] }>(`/api/v1/admin/users/batch?ids=${userId.value}`, { token: token.value });
    const items = response.items || [];
    if (items.length > 0) {
      user.value = items[0];
    } else {
      // Fallback to regular user endpoint
      user.value = await api.get<User>(`/api/v1/users/${userId.value}`);
    }
  } catch (error: any) {
    message.error(error.message || "Failed to fetch user");
  } finally {
    loading.value = false;
  }
}

async function fetchUserSkills() {
  skillsLoading.value = true;
  try {
    const response = await api.get<{ items: Skill[] }>(`/api/v1/users/${userId.value}/skills`, { token: token.value });
    userSkills.value = response.items || [];
  } catch (error: any) {
    // Skills endpoint might not exist or user has no skills
    userSkills.value = [];
  } finally {
    skillsLoading.value = false;
  }
}

function getRoleLabel(role: string | null): string {
  const labels: Record<string, string> = {
    admin: "管理员",
    moderator: "审核员",
    user: "普通用户",
  };
  return labels[role || "user"] || "普通用户";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "待审核",
    active: "已上线",
    hidden: "已隐藏",
    removed: "已驳回",
  };
  return labels[status] || status;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function handleRoleChange(newRole: string) {
  if (!user.value) return;

  try {
    await api.patch(`/api/v1/admin/users/${user.value.id}/role`, { role: newRole }, { token: token.value });
    message.success("角色更新成功");
    await fetchUser();
  } catch (error: any) {
    message.error(error.message || "角色更新失败");
  }
}
</script>

<style scoped>
.admin-user-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Back Section ─── */
.back-section {
  display: flex;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #52525c;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(228, 228, 231, 0.6);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.3);
  color: #27272a;
}

[data-theme="dark"] .back-btn {
  background: rgba(30, 35, 60, 0.6);
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .back-btn:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.35);
  color: #f1f5f9;
}

/* ─── User Header Card ─── */
.user-header-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.02);
  padding: 2rem;
}

[data-theme="dark"] .user-header-card {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.user-header-top {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.user-avatar-wrapper {
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 99999px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar-default {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 2rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #27272a;
  margin: 0 0 0.375rem 0;
}

[data-theme="dark"] .user-name {
  color: #f1f5f9;
}

.user-handle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  color: #71717a;
  margin: 0 0 0.25rem 0;
}

[data-theme="dark"] .user-handle {
  color: #64748b;
}

.user-email {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #a1a1aa;
  margin: 0;
}

[data-theme="dark"] .user-email {
  color: #71717a;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
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
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #71717a;
}

[data-theme="dark"] .meta-item {
  color: #64748b;
}

/* ─── Role Section ─── */
.role-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.02);
  padding: 1.5rem;
}

[data-theme="dark"] .role-section {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0 0 1rem 0;
}

[data-theme="dark"] .section-title {
  color: #f1f5f9;
}

.role-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-radius: 16px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #52525c;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.3);
}

.role-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-option-active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border-color: #2b7fff;
}

[data-theme="dark"] .role-option {
  background: rgba(0, 0, 0, 0.2);
  color: #94a3b8;
}

[data-theme="dark"] .role-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(43, 127, 255, 0.35);
}

[data-theme="dark"] .role-option-active {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: #93c5fd;
  border-color: #3b82f6;
}

.role-icon {
  font-size: 1rem;
}

.check-icon {
  margin-left: auto;
  font-size: 0.875rem;
}

/* ─── Self Notice ─── */
.self-notice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 16px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #ea580c;
}

[data-theme="dark"] .self-notice {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.self-notice .anticon {
  font-size: 1.25rem;
}

/* ─── Skills Section ─── */
.skills-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.02);
  padding: 1.5rem;
}

[data-theme="dark"] .skills-section {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skill-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(227, 227, 233, 0.4);
  text-decoration: none;
  transition: all 0.2s ease;
}

.skill-card:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.3);
  transform: translateY(-2px);
}

[data-theme="dark"] .skill-card {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .skill-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(43, 127, 255, 0.35);
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.skill-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
}

[data-theme="dark"] .skill-title {
  color: #f1f5f9;
}

.skill-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.skill-badge--pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.skill-badge--active {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.skill-badge--hidden {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
}

.skill-badge--removed {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

[data-theme="dark"] .skill-badge--pending {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fde68a;
}

[data-theme="dark"] .skill-badge--active {
  background: linear-gradient(135deg, #14532d 0%, #166534 100%);
  color: #86efac;
}

[data-theme="dark"] .skill-badge--hidden {
  background: linear-gradient(135deg, #581c87 0%, #6b21a8 100%);
  color: #d8b4fe;
}

[data-theme="dark"] .skill-badge--removed {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
  color: #fca5a5;
}

.skill-summary {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #52525c;
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

[data-theme="dark"] .skill-summary {
  color: #94a3b8;
}

.skill-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #71717a;
  margin-top: auto;
}

[data-theme="dark"] .skill-meta {
  color: #64748b;
}

.empty-skills {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-skills .empty-icon {
  font-size: 3rem;
  color: #d4d4d8;
  margin-bottom: 0.75rem;
}

[data-theme="dark"] .empty-skills .empty-icon {
  color: #52525b;
}

.empty-skills p {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #71717a;
  margin: 0;
}

[data-theme="dark"] .empty-skills p {
  color: #64748b;
}

/* ─── Error State ─── */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state p {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  color: #52525c;
  margin: 0 0 1.5rem 0;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .user-header-top {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-avatar-wrapper {
    width: 4rem;
    height: 4rem;
  }

  .role-badge {
    align-self: center;
  }

  .user-meta {
    justify-content: center;
  }

  .role-options {
    grid-template-columns: 1fr;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
