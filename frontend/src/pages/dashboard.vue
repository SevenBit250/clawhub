<template>
  <MotionBackground>
    <div class="dashboard-page">
      <!-- Page hero header -->
      <div class="page-hero">
        <h1 class="page-title motion-up-24" :class="{ 'in': mounted }">
          {{ t('dashboard.title') }}
        </h1>
        <p v-if="isAuthenticated" class="page-subtitle motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
          {{ t('dashboard.welcome_back') || '欢迎回来' }}
        </p>
      </div>

      <!-- Login Required State -->
      <div v-if="!isAuthenticated && loaded" class="login-required">
        <div class="login-card motion-up-12" :class="{ 'in': mounted }">
          <div class="login-icon">🔐</div>
          <h2 class="login-title">{{ t('dashboard.login_required') }}</h2>
          <p class="login-description">{{ t('dashboard.login_hint') || '请登录以查看您的控制台' }}</p>
          <a-button type="primary" size="large" class="login-button" @click="handleLogin">
            {{ t('dashboard.login') }}
          </a-button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="!loaded" class="loading-state">
        <a-spin size="large" />
      </div>

      <!-- Main Dashboard Content -->
      <div v-else class="dashboard-content">
        <!-- Stats Cards -->
        <section class="stats-section">
          <div
            v-for="(stat, index) in statsData"
            :key="stat.key"
            class="stat-card"
            :class="[`stat-card--${stat.key}`, 'motion-up-12', { 'in': contentMounted }]"
            :style="{ transitionDelay: `${index * 0.08}s` }"
          >
            <div class="stat-icon">
              <component :is="stat.icon" />
            </div>
            <div class="stat-content">
              <p class="stat-label">{{ stat.label }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </div>
        </section>

        <!-- Pending Review Section (Admin/Moderator only) -->
        <section v-if="isModerator && pendingSkills.length" class="pending-section">
          <div class="section-header motion-up-12" :class="{ 'in': contentMounted }">
            <h2 class="section-title">
              {{ t('dashboard.pending_review') }}
              <span class="section-count">{{ pendingSkills.length }}</span>
            </h2>
          </div>
          <div class="pending-list">
            <div
              v-for="(s, index) in pendingSkills"
              :key="s.id"
              class="pending-card motion-up-12"
              :class="{ 'in': contentMounted }"
              :style="{ transitionDelay: `${(index + 3) * 0.08}s` }"
            >
              <div class="pending-info">
                <div class="pending-header">
                  <h3 class="pending-name">{{ s.displayName }}</h3>
                  <span class="pending-badge">{{ t('dashboard.pending_review') }}</span>
                </div>
                <p class="pending-slug">/ {{ s.slug }}</p>
                <div class="pending-author">
                  <UserOutlined />
                  <span>{{ s.ownerDisplayName || s.ownerHandle || 'Unknown' }}</span>
                </div>
              </div>
              <a-button type="primary" class="review-button" @click="openModeration(s)">
                {{ t('dashboard.review') || '审核' }}
              </a-button>
            </div>
          </div>
        </section>

        <!-- My Skills Section -->
        <section class="skills-section">
          <div class="section-header motion-up-12" :class="{ 'in': contentMounted }">
            <h2 class="section-title">{{ t('dashboard.my_skills') }}</h2>
            <router-link to="/skills/create">
              <a-button type="primary" class="create-button">
                <template #icon>
                  <PlusOutlined />
                </template>
                {{ t('dashboard.create_skill') }}
              </a-button>
            </router-link>
          </div>

          <div v-if="!mySkills?.length" class="empty-state motion-up-12" :class="{ 'in': contentMounted }">
            <div class="empty-icon">📦</div>
            <h3 class="empty-title">{{ t('dashboard.no_skills') }}</h3>
            <p class="empty-description">{{ t('dashboard.no_skills_hint') || '创建您的第一个技能包开始吧' }}</p>
            <router-link to="/skills/create">
              <a-button type="primary" size="large">
                {{ t('dashboard.create_first_skill') || '创建第一个技能' }}
              </a-button>
            </router-link>
          </div>

          <div v-else class="skills-list">
            <DashboardSkillItem
              v-for="(s, index) in mySkills"
              :key="s.id"
              :skill="s"
              class="motion-up-12"
              :class="{ 'in': contentMounted }"
              :style="{ transitionDelay: `${(index + 4) * 0.04}s` }"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Moderation Dialog -->
    <ModerationDialog
      :open="showModerationDialog"
      :skill="selectedSkillForModeration"
      @close="showModerationDialog = false"
      @approve="handleModerationApprove"
      @reject="handleModerationReject"
    />
  </MotionBackground>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import { UserOutlined, PlusOutlined } from "@ant-design/icons-vue";
import { ToolOutlined, ClusterOutlined, StarFilled } from "@ant-design/icons-vue";
import ModerationDialog from "@/components/ModerationDialog.vue";
import DashboardSkillItem from "@/components/DashboardSkillItem.vue";
import MotionBackground from "@/components/MotionBackground.vue";

const { t } = useI18n();
const { isAuthenticated, token, loaded, getAuthUrl, user } = useAuth();
const api = useApi();

const mounted = ref(false);
const contentMounted = ref(false);

const mySkills = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  moderationStatus?: string;
  stats?: { downloads: number; stars: number; installs: number };
}>>([]);
const mySouls = ref<Array<{ id: string; slug: string; displayName: string }>>([]);
const pendingSkills = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  ownerHandle: string | null;
  ownerDisplayName: string | null;
}>>([]);

const showModerationDialog = ref(false);
const selectedSkillForModeration = ref<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  ownerHandle: string | null;
  ownerDisplayName: string | null;
  files: Array<{ path: string; size: number; storageId?: string }>;
} | null>(null);

const isModerator = computed(() => {
  const role = user.value?.role;
  return role === "admin" || role === "moderator";
});

const totalStars = computed(() =>
  (mySkills.value || []).reduce((sum: number, s) => sum + (s.stats?.stars || 0), 0)
);

const statsData = computed(() => [
  {
    key: "skills",
    label: t('dashboard.my_skills'),
    value: mySkills.value?.length || 0,
    icon: ToolOutlined,
  },
  {
    key: "souls",
    label: t('dashboard.my_souls'),
    value: mySouls.value?.length || 0,
    icon: ClusterOutlined,
  },
  {
    key: "stars",
    label: t('dashboard.stars_received'),
    value: totalStars.value || 0,
    icon: StarFilled,
  },
]);

async function fetchData() {
  if (!token.value) {
    mySkills.value = [];
    mySouls.value = [];
    pendingSkills.value = [];
    return;
  }

  try {
    const res = await api.get<{ skills: Array<{ id: string; slug: string; displayName: string; summary: string | null }> }>("/users/me/skills", { token: token.value });
    mySkills.value = res?.skills || [];
  } catch {
    mySkills.value = [];
  }

  try {
    const res = await api.get<{ souls: Array<{ id: string; slug: string; displayName: string }> }>("/users/me/souls", { token: token.value });
    mySouls.value = res?.souls || [];
  } catch {
    mySouls.value = [];
  }

  if (isModerator.value) {
    try {
      const res = await api.get<{ items: typeof pendingSkills.value }>("/api/v1/admin/skills/pending", { token: token.value });
      pendingSkills.value = res?.items || [];
    } catch {
      pendingSkills.value = [];
    }
  }
}

function triggerAnimations() {
  nextTick(() => {
    requestAnimationFrame(() => {
      contentMounted.value = true;
    });
  });
}

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  if (token.value) {
    fetchData();
  }
});

watch(token, (newToken) => {
  if (newToken) {
    fetchData();
  }
});

watch([mySkills, mySouls, pendingSkills], () => {
  triggerAnimations();
}, { immediate: true });

watch(isModerator, () => {
  if (token.value && isModerator.value) {
    fetchData();
  }
});

async function handleLogin() {
  const url = await getAuthUrl();
  window.location.href = url;
}

async function openModeration(skill: typeof pendingSkills.value[number]) {
  try {
    const res = await api.get<{
      skill: { id: string; slug: string; displayName: string; summary: string | null };
      latestVersion: { files: Array<{ path: string; size: number }> } | null;
      owner: { handle: string | null; displayName: string | null };
    }>(`/api/v1/skills/${skill.slug}`, { token: token.value });

    selectedSkillForModeration.value = {
      id: skill.id,
      slug: skill.slug,
      displayName: skill.displayName,
      summary: skill.summary,
      ownerHandle: skill.ownerHandle,
      ownerDisplayName: skill.ownerDisplayName,
      files: res.latestVersion?.files || [],
    };
    showModerationDialog.value = true;
  } catch {
    message.error("Failed to load skill details");
  }
}

async function handleModerationApprove(id: string) {
  try {
    await api.post(`/api/v1/admin/skills/${id}/approve`, {}, { token: token.value });
    message.success("Skill approved");
    showModerationDialog.value = false;
    pendingSkills.value = pendingSkills.value.filter(s => s.id !== id);
  } catch {
    message.error("Failed to approve skill");
  }
}

async function handleModerationReject(id: string) {
  try {
    await api.post(`/api/v1/admin/skills/${id}/reject`, {}, { token: token.value });
    message.success("Skill rejected");
    showModerationDialog.value = false;
    pendingSkills.value = pendingSkills.value.filter(s => s.id !== id);
  } catch {
    message.error("Failed to reject skill");
  }
}

</script>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
   Dashboard Page
   ───────────────────────────────────────────────────────────────────────────── */

.dashboard-page {
  position: relative;
  padding: 2rem 1.5rem 4rem;
}

/* ─── Page Hero Header ─── */
.page-hero {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto 2rem;
  padding-top: 1rem;
}

.page-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #27272a;
  margin: 0 0 0.75rem;
}

.page-subtitle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 400;
  line-height: 1.5;
  color: #6b7280;
  margin: 0;
}

/* ─── Login Required State ─── */
.login-required {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  max-width: 1024px;
  margin: 0 auto;
}

.login-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 3rem 3.5rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 16px rgba(43, 127, 255, 0.06),
    0 2px 6px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  max-width: 400px;
  width: 100%;
}

.login-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

.login-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #27272a;
  margin: 0 0 0.75rem;
}

.login-description {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 2rem;
  line-height: 1.6;
}

.login-button {
  height: 48px;
  padding: 0 2rem;
  border-radius: 99999px;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  border: none;
  box-shadow:
    0 8px 16px rgba(43, 127, 255, 0.25),
    0 4px 8px rgba(43, 127, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.login-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 12px 24px rgba(43, 127, 255, 0.35),
    0 6px 12px rgba(43, 127, 255, 0.2);
}

.login-button:active {
  transform: translateY(0) scale(0.98);
}

/* ─── Loading State ─── */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* ─── Dashboard Content ─── */
.dashboard-content {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto;
}

/* ─── Stats Section ─── */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.04),
    0 1px 3px rgba(43, 127, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(43, 127, 255, 0.25);
  box-shadow:
    0 8px 20px rgba(43, 127, 255, 0.1),
    0 3px 8px rgba(43, 127, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-card--skills .stat-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2b7fff;
}

.stat-card--souls .stat-icon {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #a855f7;
}

.stat-card--stars .stat-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #f59e0b;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
  font-weight: 500;
}

.stat-value {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* ─── Section Header ─── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-count {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 99999px;
}

.create-button {
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 99999px;
  font-weight: 600;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  border: none;
  box-shadow:
    0 4px 12px rgba(43, 127, 255, 0.2),
    0 2px 6px rgba(43, 127, 255, 0.12);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.create-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 20px rgba(43, 127, 255, 0.3),
    0 4px 10px rgba(43, 127, 255, 0.18);
}

/* ─── Pending Review Section ─── */
.pending-section {
  margin-bottom: 2.5rem;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pending-card {
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(253, 230, 138, 0.3) 100%);
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border: 1px solid rgba(251, 191, 36, 0.25);
  box-shadow:
    0 2px 8px rgba(251, 191, 36, 0.08),
    0 1px 3px rgba(251, 191, 36, 0.05);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease;
}

.pending-card:hover {
  transform: translateX(6px);
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.65) 0%, rgba(253, 230, 138, 0.45) 100%);
  box-shadow:
    0 6px 16px rgba(251, 191, 36, 0.12),
    0 3px 8px rgba(251, 191, 36, 0.08);
}

.pending-info {
  flex: 1;
  min-width: 0;
}

.pending-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}

.pending-name {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #27272a;
  margin: 0;
}

.pending-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 99999px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.pending-slug {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0 0 0.25rem;
}

.pending-author {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #6b7280;
}

.pending-author .anticon {
  font-size: 0.875rem;
}

.review-button {
  height: 40px;
  padding: 0 1.5rem;
  border-radius: 99999px;
  font-weight: 600;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  box-shadow:
    0 4px 12px rgba(245, 158, 11, 0.25),
    0 2px 6px rgba(245, 158, 11, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.review-button:hover {
  transform: scale(1.05);
  box-shadow:
    0 6px 18px rgba(245, 158, 11, 0.35),
    0 3px 10px rgba(245, 158, 11, 0.2);
}

/* ─── Skills Section ─── */
.skills-section {
  margin-bottom: 2rem;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── Empty State ─── */
.empty-state {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  border: 2px dashed rgba(148, 163, 184, 0.3);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem;
}

.empty-description {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 2rem;
}

/* ─── Animations ─── */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .page-title {
  color: #f1f5f9;
}

[data-theme="dark"] .page-subtitle {
  color: #64748b;
}

[data-theme="dark"] .login-card,
[data-theme="dark"] .stat-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .login-card:hover,
[data-theme="dark"] .stat-card:hover {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.35);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.3),
    0 3px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .login-title,
[data-theme="dark"] .stat-value {
  color: #f1f5f9;
}

[data-theme="dark"] .login-description,
[data-theme="dark"] .stat-label {
  color: #94a3b8;
}

[data-theme="dark"] .section-title {
  color: #f1f5f9;
}

[data-theme="dark"] .pending-card {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.3) 0%, rgba(146, 64, 14, 0.2) 100%);
  border-color: rgba(251, 191, 36, 0.2);
}

[data-theme="dark"] .pending-card:hover {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.4) 0%, rgba(146, 64, 14, 0.3) 100%);
}

[data-theme="dark"] .pending-name {
  color: #f1f5f9;
}

[data-theme="dark"] .pending-slug {
  color: #475569;
}

[data-theme="dark"] .pending-author {
  color: #94a3b8;
}

[data-theme="dark"] .empty-state {
  background: rgba(30, 35, 60, 0.4);
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .empty-title {
  color: #94a3b8;
}

[data-theme="dark"] .empty-description {
  color: #64748b;
}

[data-theme="dark"] .stat-card--skills .stat-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.15) 100%);
}

[data-theme="dark"] .stat-card--souls .stat-icon {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(192, 132, 252, 0.15) 100%);
}

[data-theme="dark"] .stat-card--stars .stat-icon {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(250, 204, 21, 0.15) 100%);
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .dashboard-page {
    padding: 1.5rem 1rem 3rem;
  }

  .pending-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-button {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .create-button {
    width: 100%;
  }
}
</style>
