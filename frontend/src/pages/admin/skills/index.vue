<template>
  <div class="admin-skills">
    <!-- Filters -->
    <div class="filters-section motion-up-16" :class="{ 'in': mounted }">
      <div class="filter-tabs">
        <button
          v-for="filter in statusFilters"
          :key="filter.key"
          class="filter-tab"
          :class="{ 'filter-tab-active': activeFilter === filter.key }"
          @click="setFilter(filter.key)"
        >
          {{ filter.label }}
          <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
        </button>
      </div>

      <div class="filter-actions">
        <a-input
          v-model:value="searchQuery"
          placeholder="搜索技能名称或 slug..."
          allow-clear
          class="search-input"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </div>
    </div>

    <!-- Skills List -->
    <div class="skills-section motion-up-20 motion-delay-1" :class="{ 'in': mounted }">
      <a-spin :spinning="loading">
        <div v-if="filteredSkills.length > 0" class="skills-list">
          <div
            v-for="skill in paginatedSkills"
            :key="skill.id"
            class="skill-card"
          >
            <div class="skill-header">
              <router-link :to="`/skills/${skill.slug}`" class="skill-title-link">
                <h3 class="skill-title">{{ skill.displayName }}</h3>
              </router-link>
              <span :class="['skill-badge', `skill-badge--${skill.moderationStatus}`]">
                {{ getStatusLabel(skill.moderationStatus) }}
              </span>
            </div>

            <p class="skill-summary">{{ skill.summary || "暂无描述" }}</p>

            <div class="skill-meta">
              <div class="skill-author">
                <UserOutlined />
                <span>{{ skill.ownerDisplayName || skill.ownerHandle || "未知用户" }}</span>
              </div>
              <div class="skill-date">
                <CalendarOutlined />
                <span>{{ formatDate(skill.createdAt) }}</span>
              </div>
            </div>

            <div v-if="skill.moderationReason" class="skill-reason">
              <ExclamationCircleOutlined />
              <span>{{ skill.moderationReason }}</span>
            </div>

            <div class="skill-actions">
              <template v-if="skill.moderationStatus === 'pending'">
                <button
                  class="action-btn action-btn--approve"
                  @click="handleAction('approve', skill.id)"
                >
                  <CheckOutlined />
                  <span>通过</span>
                </button>
                <button
                  class="action-btn action-btn--reject"
                  @click="handleAction('reject', skill.id)"
                >
                  <CloseOutlined />
                  <span>驳回</span>
                </button>
              </template>
              <template v-else-if="skill.moderationStatus === 'active'">
                <button
                  class="action-btn action-btn--hide"
                  @click="handleAction('hide', skill.id)"
                >
                  <EyeInvisibleOutlined />
                  <span>隐藏</span>
                </button>
              </template>
              <template v-else-if="skill.moderationStatus === 'hidden'">
                <button
                  class="action-btn action-btn--unhide"
                  @click="handleAction('unhide', skill.id)"
                >
                  <EyeOutlined />
                  <span>显示</span>
                </button>
              </template>
              <template v-else-if="skill.moderationStatus === 'removed'">
                <button
                  class="action-btn action-btn--approve"
                  @click="handleAction('approve', skill.id)"
                >
                  <UndoOutlined />
                  <span>恢复</span>
                </button>
              </template>

              <router-link :to="`/admin/skills/${skill.slug}`" class="action-link">
                <SettingOutlined />
                <span>详情</span>
              </router-link>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <SearchOutlined class="empty-icon" />
          <p>没有找到匹配的技能</p>
        </div>
      </a-spin>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section motion-up-16 motion-delay-2" :class="{ 'in': mounted }">
      <a-pagination
        v-model:current="currentPage"
        :total="filteredSkills.length"
        :page-size="pageSize"
        :show-size-changer="false"
        show-quick-jumper
        :show-total="(total: number) => `共 ${total} 条`"
      />
    </div>

    <!-- Reject Modal -->
    <a-modal
      v-model:open="rejectModalVisible"
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
          <a-button @click="rejectModalVisible = false">取消</a-button>
          <a-button type="primary" danger html-type="submit">确认驳回</a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  UndoOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";

const mounted = ref(false);
const loading = ref(true);
const searchQuery = ref("");
const activeFilter = ref<string>("all");
const currentPage = ref(1);
const pageSize = 10;

const rejectModalVisible = ref(false);
const rejectReason = ref("");
const selectedSkillId = ref<string | null>(null);

const { token } = useAuth();
const api = useApi();

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

const skills = ref<Skill[]>([]);

const statusFilters = computed(() => [
  { key: "all", label: "全部" },
  { key: "pending", label: "待审核" },
  { key: "active", label: "已上线" },
  { key: "hidden", label: "已隐藏" },
  { key: "removed", label: "已驳回" },
]);

const filteredSkills = computed(() => {
  let result = skills.value;

  // Status filter
  if (activeFilter.value !== "all") {
    result = result.filter((s) => s.moderationStatus === activeFilter.value);
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.displayName.toLowerCase().includes(query) ||
        s.slug.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query)
    );
  }

  return result;
});

const totalPages = computed(() => Math.ceil(filteredSkills.value.length / pageSize));

const paginatedSkills = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredSkills.value.slice(start, end);
});

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  await fetchSkills();
});

async function fetchSkills() {
  loading.value = true;
  try {
    // Fetch all skills from admin endpoint
    const response = await api.get<{ items: Skill[] }>("/api/v1/admin/skills", { token: token.value });
    skills.value = response.items || [];
  } catch (error: any) {
    console.error("Failed to fetch skills:", error);
    message.error(error.message || "Failed to fetch skills");
  } finally {
    loading.value = false;
  }
}

function setFilter(filter: string) {
  activeFilter.value = filter;
  currentPage.value = 1;
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
    month: "short",
    day: "numeric",
  });
}

async function handleAction(action: string, skillId: string) {
  selectedSkillId.value = skillId;

  switch (action) {
    case "approve":
      await executeAction(`/api/v1/admin/skills/${skillId}/approve`, "POST");
      break;
    case "reject":
      rejectModalVisible.value = true;
      break;
    case "hide":
      await executeAction(`/api/v1/admin/skills/${skillId}/hide`, "POST");
      break;
    case "unhide":
      await executeAction(`/api/v1/admin/skills/${skillId}/unhide`, "POST");
      break;
  }
}

async function confirmReject() {
  if (!selectedSkillId.value) return;
  await executeAction(`/api/v1/admin/skills/${selectedSkillId.value}/reject`, "POST", {
    reason: rejectReason.value,
  });
  rejectModalVisible.value = false;
  rejectReason.value = "";
}

async function executeAction(endpoint: string, method: string, body?: any) {
  try {
    await api.request(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      token: token.value,
    });
    message.success("操作成功");
    await fetchSkills();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
}

watch(activeFilter, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.admin-skills {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Filters Section ─── */
.filters-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
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

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.3);
}

.filter-tab-active {
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow:
    0 6px 16px rgba(43, 127, 255, 0.25),
    0 2px 4px rgba(43, 127, 255, 0.15);
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 99999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-tab-active .filter-count {
  background: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .filter-tab {
  background: rgba(30, 35, 60, 0.6);
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .filter-tab:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.35);
}

[data-theme="dark"] .filter-count {
  background: rgba(255, 255, 255, 0.1);
}

.filter-actions {
  flex: 1;
  max-width: 320px;
}

.search-input {
  border-radius: 99999px !important;
}

/* ─── Skills Section ─── */
.skills-section {
  min-height: 200px;
}

.skills-list {
  display: grid;
  gap: 1rem;
}

.skill-card {
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
}

.skill-card:hover {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.03);
}

[data-theme="dark"] .skill-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .skill-card:hover {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.skill-title-link {
  text-decoration: none;
}

.skill-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  transition: color 0.2s ease;
}

.skill-title-link:hover .skill-title {
  color: #2b7fff;
}

[data-theme="dark"] .skill-title {
  color: #f1f5f9;
}

[data-theme="dark"] .skill-title-link:hover .skill-title {
  color: #60a5fa;
}

.skill-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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
  font-size: 0.9375rem;
  color: #52525c;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
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
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.skill-author,
.skill-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #71717a;
}

[data-theme="dark"] .skill-author,
[data-theme="dark"] .skill-date {
  color: #64748b;
}

.skill-reason {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 8px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #ea580c;
  margin-bottom: 0.75rem;
}

[data-theme="dark"] .skill-reason {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.skill-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn--approve {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.action-btn--approve:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}

.action-btn--reject {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

.action-btn--reject:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.action-btn--hide {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
}

.action-btn--hide:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.25);
}

.action-btn--unhide {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.action-btn--unhide:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #52525c;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-link:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #27272a;
}

[data-theme="dark"] .action-link {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .action-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
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

/* ─── Modal ─── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    max-width: none;
  }

  .skill-actions {
    width: 100%;
  }

  .action-btn,
  .action-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
