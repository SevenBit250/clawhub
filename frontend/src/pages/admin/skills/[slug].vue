<template>
  <div class="admin-skill-detail">
    <a-spin :spinning="loading">
      <template v-if="skill">
        <!-- Back Button -->
        <div class="back-section motion-up-12" :class="{ 'in': mounted }">
          <button class="back-btn" @click="router.back()">
            <ArrowLeftOutlined />
            <span>返回技能管理</span>
          </button>
        </div>

        <!-- Skill Header -->
        <div class="skill-header-section motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
          <div class="skill-header-card">
            <div class="skill-header-top">
              <div class="skill-info">
                <h1 class="skill-title">{{ skill.displayName }}</h1>
                <p class="skill-slug">{{ skill.slug }}</p>
              </div>
              <span :class="['skill-badge', `skill-badge--${skill.moderationStatus}`]">
                {{ getStatusLabel(skill.moderationStatus) }}
              </span>
            </div>

            <p class="skill-summary">{{ skill.summary || "暂无描述" }}</p>

            <div class="skill-meta">
              <div class="meta-item">
                <UserOutlined />
                <span>创建者: {{ skill.ownerDisplayName || skill.ownerHandle || "未知" }}</span>
              </div>
              <div class="meta-item">
                <CalendarOutlined />
                <span>创建于: {{ formatDate(skill.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <ClockCircleOutlined />
                <span>更新于: {{ formatDate(skill.updatedAt) }}</span>
              </div>
            </div>

            <div v-if="skill.moderationReason" class="moderation-reason">
              <ExclamationCircleOutlined />
              <span>
                <strong>审核原因:</strong> {{ skill.moderationReason }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
          <h2 class="section-title">审核操作</h2>
          <div class="actions-grid">
            <template v-if="skill.moderationStatus === 'pending'">
              <button class="action-btn action-btn--approve" @click="handleAction('approve')">
                <CheckOutlined />
                <span>通过审核</span>
              </button>
              <button class="action-btn action-btn--reject" @click="showRejectModal = true">
                <CloseOutlined />
                <span>驳回技能</span>
              </button>
              <button class="action-btn action-btn--hide" @click="handleAction('hide')">
                <EyeInvisibleOutlined />
                <span>隐藏技能</span>
              </button>
            </template>
            <template v-else-if="skill.moderationStatus === 'active'">
              <button class="action-btn action-btn--hide" @click="handleAction('hide')">
                <EyeInvisibleOutlined />
                <span>隐藏技能</span>
              </button>
              <button class="action-btn action-btn--reject" @click="showRejectModal = true">
                <CloseOutlined />
                <span>驳回技能</span>
              </button>
            </template>
            <template v-else-if="skill.moderationStatus === 'hidden'">
              <button class="action-btn action-btn--unhide" @click="handleAction('unhide')">
                <EyeOutlined />
                <span>显示技能</span>
              </button>
              <button class="action-btn action-btn--reject" @click="showRejectModal = true">
                <CloseOutlined />
                <span>驳回技能</span>
              </button>
            </template>
            <template v-else-if="skill.moderationStatus === 'removed'">
              <button class="action-btn action-btn--approve" @click="handleAction('approve')">
                <UndoOutlined />
                <span>恢复技能</span>
              </button>
            </template>

            <router-link :to="`/skills/${skill.slug}`" class="action-btn action-btn--view">
              <EyeOutlined />
              <span>查看技能</span>
            </router-link>
          </div>
        </div>

        <!-- Versions -->
        <div class="versions-section motion-up-16 motion-delay-3" :class="{ 'in': mounted }">
          <h2 class="section-title">版本历史</h2>
          <div class="versions-list">
            <a-spin :spinning="versionsLoading">
              <div v-if="versions.length > 0" class="version-items">
                <div
                  v-for="version in versions"
                  :key="version.id"
                  class="version-item"
                >
                  <div class="version-header">
                    <span class="version-number">{{ version.version }}</span>
                    <span v-if="version.tags" class="version-tags">
                      <span v-for="tag in version.tags" :key="tag" class="version-tag">{{ tag }}</span>
                    </span>
                  </div>
                  <p v-if="version.changelog" class="version-changelog">{{ version.changelog }}</p>
                  <p class="version-date">{{ formatDate(version.createdAt) }}</p>
                </div>
              </div>
              <div v-else class="empty-versions">
                <p>暂无版本记录</p>
              </div>
            </a-spin>
          </div>
        </div>
      </template>

      <div v-else-if="!loading" class="error-state">
        <ExclamationCircleOutlined class="error-icon" />
        <p>技能不存在或已被删除</p>
        <button class="back-btn" @click="router.back()">返回</button>
      </div>
    </a-spin>

    <!-- Reject Modal -->
    <a-modal
      v-model:open="showRejectModal"
      title="驳回技能"
      :footer="null"
      width="400px"
    >
      <a-form layout="vertical" @finish="confirmReject">
        <a-form-item label="驳回原因" name="reason">
          <a-textarea
            v-model:value="rejectReason"
            placeholder="请输入驳回原因..."
            :rows="4"
            :maxlength="500"
            show-count
          />
        </a-form-item>
        <div class="modal-actions">
          <a-button @click="showRejectModal = false">取消</a-button>
          <a-button type="primary" danger html-type="submit">确认驳回</a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  UndoOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";

const mounted = ref(false);
const loading = ref(true);
const versionsLoading = ref(true);
const showRejectModal = ref(false);
const rejectReason = ref("");

const route = useRoute();
const router = useRouter();
const { token } = useAuth();
const api = useApi();

const slug = computed(() => route.params.slug as string);

interface Skill {
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  moderationStatus: "pending" | "active" | "hidden" | "removed";
  moderationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerUserId: string;
  ownerHandle: string | null;
  ownerDisplayName: string | null;
}

interface SkillVersion {
  id: string;
  version: string;
  changelog: string | null;
  tags: string[] | null;
  createdAt: Date;
}

const skill = ref<Skill | null>(null);
const versions = ref<SkillVersion[]>([]);

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  await Promise.all([fetchSkill(), fetchVersions()]);
});

async function fetchSkill() {
  loading.value = true;
  try {
    const response = await api.get<Skill>(`/api/v1/skills/${slug.value}`);
    skill.value = response;
  } catch (error: any) {
    message.error(error.message || "Failed to fetch skill");
  } finally {
    loading.value = false;
  }
}

async function fetchVersions() {
  versionsLoading.value = true;
  try {
    const response = await api.get<{ items: SkillVersion[] }>(`/api/v1/skills/${slug.value}/versions`);
    versions.value = response.items || [];
  } catch (error: any) {
    // Versions endpoint might not exist, just ignore
    versions.value = [];
  } finally {
    versionsLoading.value = false;
  }
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function handleAction(action: string) {
  if (!skill.value) return;

  const endpointMap: Record<string, string> = {
    approve: `/api/v1/admin/skills/${skill.value.id}/approve`,
    hide: `/api/v1/admin/skills/${skill.value.id}/hide`,
    unhide: `/api/v1/admin/skills/${skill.value.id}/unhide`,
  };

  const endpoint = endpointMap[action];
  if (!endpoint) return;

  try {
    await api.post(endpoint, {}, { token: token.value });
    message.success("操作成功");
    await fetchSkill();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
}

async function confirmReject() {
  if (!skill.value) return;

  try {
    await api.post(`/api/v1/admin/skills/${skill.value.id}/reject`, {
      reason: rejectReason.value,
    }, { token: token.value });
    message.success("操作成功");
    showRejectModal.value = false;
    rejectReason.value = "";
    await fetchSkill();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
}
</script>

<style scoped>
.admin-skill-detail {
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

/* ─── Skill Header Card ─── */
.skill-header-card {
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

[data-theme="dark"] .skill-header-card {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.skill-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #27272a;
  margin: 0 0 0.375rem 0;
}

[data-theme="dark"] .skill-title {
  color: #f1f5f9;
}

.skill-slug {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9375rem;
  color: #71717a;
  margin: 0;
}

[data-theme="dark"] .skill-slug {
  color: #64748b;
}

.skill-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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
  font-size: 1rem;
  color: #52525c;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

[data-theme="dark"] .skill-summary {
  color: #94a3b8;
}

.skill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #71717a;
}

[data-theme="dark"] .meta-item {
  color: #64748b;
}

.moderation-reason {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 12px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #ea580c;
}

[data-theme="dark"] .moderation-reason {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

/* ─── Actions Section ─── */
.actions-section {
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

[data-theme="dark"] .actions-section {
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

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-btn--approve {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.action-btn--approve:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 16px rgba(22, 163, 74, 0.25);
}

.action-btn--reject {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

.action-btn--reject:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 16px rgba(220, 38, 38, 0.25);
}

.action-btn--hide {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
}

.action-btn--hide:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 16px rgba(147, 51, 234, 0.25);
}

.action-btn--unhide {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.action-btn--unhide:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25);
}

.action-btn--view {
  background: rgba(255, 255, 255, 0.8);
  color: #52525c;
  border: 1px solid rgba(228, 228, 231, 0.6);
}

.action-btn--view:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(43, 127, 255, 0.3);
}

[data-theme="dark"] .action-btn--view {
  background: rgba(30, 35, 60, 0.6);
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .action-btn--view:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.35);
}

/* ─── Versions Section ─── */
.versions-section {
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

[data-theme="dark"] .versions-section {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
}

.version-items {
  display: grid;
  gap: 0.75rem;
}

.version-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.version-item:hover {
  background: rgba(255, 255, 255, 0.7);
}

[data-theme="dark"] .version-item {
  background: rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .version-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.version-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-number {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #27272a;
}

[data-theme="dark"] .version-number {
  color: #f1f5f9;
}

.version-tags {
  display: flex;
  gap: 0.375rem;
}

.version-tag {
  padding: 0.125rem 0.5rem;
  background: rgba(43, 127, 255, 0.1);
  color: #2b7fff;
  border-radius: 99999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.version-changelog {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #52525c;
  margin: 0;
}

[data-theme="dark"] .version-changelog {
  color: #94a3b8;
}

.version-date {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #a1a1aa;
  margin: 0;
}

[data-theme="dark"] .version-date {
  color: #64748b;
}

.empty-versions {
  text-align: center;
  padding: 2rem;
  color: #71717a;
}

[data-theme="dark"] .empty-versions {
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

/* ─── Modal ─── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .skill-header-top {
    flex-direction: column;
  }

  .skill-badge {
    align-self: flex-start;
  }

  .actions-grid {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
