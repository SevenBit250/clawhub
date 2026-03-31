<template>
  <div class="admin-dashboard">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card stat-card--blue motion-up-24" :class="{ 'in': mounted }">
        <div class="stat-icon stat-icon--blue">
          <ClockCircleOutlined />
        </div>
        <div class="stat-content">
          <p class="stat-label">待审核技能</p>
          <p class="stat-value">{{ stats.pendingSkillsCount }}</p>
        </div>
        <router-link to="/admin/skills?status=pending" class="stat-link">
          <ArrowRightOutlined />
        </router-link>
      </div>

      <div class="stat-card stat-card--green motion-up-20 motion-delay-1" :class="{ 'in': mounted }">
        <div class="stat-icon stat-icon--green">
          <CheckCircleOutlined />
        </div>
        <div class="stat-content">
          <p class="stat-label">已上线技能</p>
          <p class="stat-value">{{ stats.activeSkillsCount }}</p>
        </div>
        <router-link to="/admin/skills?status=active" class="stat-link">
          <ArrowRightOutlined />
        </router-link>
      </div>

      <div class="stat-card stat-card--purple motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
        <div class="stat-icon stat-icon--purple">
          <TeamOutlined />
        </div>
        <div class="stat-content">
          <p class="stat-label">总用户数</p>
          <p class="stat-value">{{ stats.totalUsersCount }}</p>
        </div>
        <router-link to="/admin/users" class="stat-link">
          <ArrowRightOutlined />
        </router-link>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section motion-up-16 motion-delay-3" :class="{ 'in': mounted }">
      <div class="section-header">
        <h2 class="section-title">最近活动</h2>
      </div>
      <div class="activity-list">
        <div
          v-for="log in stats.recentActivity"
          :key="log.targetId + log.action"
          class="activity-item"
        >
          <div class="activity-icon activity-icon--log">
            <HistoryOutlined />
          </div>
          <div class="activity-content">
            <p class="activity-action">{{ formatAction(log.action) }}</p>
            <p class="activity-meta">
              {{ log.targetType }}: {{ log.targetId?.slice(0, 8) }}...
            </p>
          </div>
          <div class="activity-time">
            {{ formatTime(log.createdAt) }}
          </div>
        </div>
        <div v-if="stats.recentActivity.length === 0" class="activity-empty">
          <p>暂无活动记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";

const mounted = ref(false);
const { token } = useAuth();
const api = useApi();

interface AdminStats {
  pendingSkillsCount: number;
  activeSkillsCount: number;
  totalUsersCount: number;
  recentActivity: Array<{
    action: string;
    targetType: string;
    targetId: string;
    actorUserId: string;
    createdAt: Date;
  }>;
}

const stats = ref<AdminStats>({
  pendingSkillsCount: 0,
  activeSkillsCount: 0,
  totalUsersCount: 0,
  recentActivity: [],
});

const loading = ref(true);

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  await fetchStats();
});

async function fetchStats() {
  loading.value = true;
  try {
    const response = await api.get<AdminStats>("/api/v1/admin/stats", { token: token.value });
    stats.value = response;
  } catch (error: any) {
    message.error(error.message || "Failed to fetch stats");
  } finally {
    loading.value = false;
  }
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    "skill.approve": "批准技能",
    "skill.reject": "驳回技能",
    "skill.hide": "隐藏技能",
    "skill.unhide": "取消隐藏",
    "user.updateRole": "更新用户角色",
  };
  return actionMap[action] || action;
}

function formatTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN");
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Stats Grid ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(227, 227, 233, 0.5);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-decoration: none;
}

.stat-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
}

[data-theme="dark"] .stat-card {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .stat-card:hover {
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon--blue {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.stat-icon--green {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.stat-icon--purple {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
}

[data-theme="dark"] .stat-icon--blue {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: #93c5fd;
}

[data-theme="dark"] .stat-icon--green {
  background: linear-gradient(135deg, #14532d 0%, #166534 100%);
  color: #86efac;
}

[data-theme="dark"] .stat-icon--purple {
  background: linear-gradient(135deg, #581c87 0%, #6b21a8 100%);
  color: #d8b4fe;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #71717a;
  margin: 0 0 0.25rem 0;
}

[data-theme="dark"] .stat-label {
  color: #94a3b8;
}

.stat-value {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #27272a;
  margin: 0;
}

[data-theme="dark"] .stat-value {
  color: #f1f5f9;
}

.stat-link {
  width: 2rem;
  height: 2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  color: #71717a;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.stat-link:hover {
  background: rgba(43, 127, 255, 0.1);
  color: #2b7fff;
}

[data-theme="dark"] .stat-link {
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
}

[data-theme="dark"] .stat-link:hover {
  background: rgba(43, 127, 255, 0.2);
  color: #60a5fa;
}

/* ─── Activity Section ─── */
.activity-section {
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

[data-theme="dark"] .activity-section {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
}

[data-theme="dark"] .section-title {
  color: #f1f5f9;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] .activity-item {
  background: rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.activity-icon--log {
  width: 2rem;
  height: 2rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

[data-theme="dark"] .activity-icon--log {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fde68a;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-action {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #27272a;
  margin: 0 0 0.125rem 0;
}

[data-theme="dark"] .activity-action {
  color: #f1f5f9;
}

.activity-meta {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #71717a;
  margin: 0;
}

[data-theme="dark"] .activity-meta {
  color: #94a3b8;
}

.activity-time {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #a1a1aa;
  white-space: nowrap;
}

[data-theme="dark"] .activity-time {
  color: #64748b;
}

.activity-empty {
  text-align: center;
  padding: 2rem;
  color: #71717a;
  font-size: 0.9375rem;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
