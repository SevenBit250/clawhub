<template>
  <MotionBackground>
    <div class="skill-detail-page">
      <div v-if="pending" class="loading-state" :class="{ 'fade-in': mounted }">
      <div class="loading-spinner"></div>
      <p>{{ t('skill.loading') }}</p>
    </div>
    <div v-else-if="error || !skill" class="error-state" :class="{ 'fade-in': mounted }">
      <p>{{ t('skill.not_found') }}</p>
    </div>
    <div v-else class="page-content">
      <!-- Header Card -->
      <div class="header-card glass-card motion-up-24" :class="{ 'in': contentReady }">
        <div class="header-top">
          <div class="title-section">
            <h1 class="skill-title">{{ skill.displayName }}</h1>
            <div class="skill-meta">
              <span class="meta-item">
                <UserOutlined class="meta-icon" />
                {{ owner?.handle || owner?.displayName || t('souls.unknown_author') }}
              </span>
              <span v-if="version" class="meta-item">
                <TagOutlined class="meta-icon" />
                v{{ version.version }}
              </span>
              <span v-if="version" class="meta-item">
                <CalendarOutlined class="meta-icon" />
                {{ new Date(version.createdAt).toLocaleDateString() }}
              </span>
              <a-button v-if="version?.changelog" type="link" size="small" @click="showChangelog = true" class="meta-changelog">
                <FileTextOutlined />
                {{ t('skill.changelog.view') }}
              </a-button>
            </div>
            <!-- Description inline -->
            <p class="skill-desc">{{ skill.summary || t('skill.description.none') }}</p>
          </div>

          <div class="header-actions">
            <!-- Stats Pill -->
            <div class="stats-pill">
              <div class="stat-item">
                <DownloadOutlined />
                <span>{{ formatCount(skill.stats?.downloads || 0) }}</span>
              </div>
              <div class="stat-item">
                <CloudDownloadOutlined />
                <span>{{ formatCount(skill.stats?.installs || 0) }}</span>
              </div>
              <div class="stat-item star">
                <StarFilled />
                <span>{{ formatCount(skill.stats?.stars || 0) }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <a-button
                class="action-btn star-btn"
                :class="{ 'starred': isStarred }"
                @click="toggleStar"
              >
                <StarFilled />
                <span v-if="starCount > 0">{{ starCount }}</span>
              </a-button>
              <a-button class="action-btn primary-btn" @click="showInstallDialog = true">
                <DownloadOutlined />
                {{ t('skill.install') }}
              </a-button>
              <a-button
                v-if="isOwner && skill.moderationStatus === 'removed'"
                class="action-btn edit-btn"
                @click="$router.push(`/skills/${skill.slug}/edit`)"
              >
                <EditOutlined />
                {{ t('skill.edit.title') }}
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments Card -->
      <div class="comments-card glass-card motion-up-24 motion-delay-1" :class="{ 'in': contentReady }">
        <div class="card-header">
          <h2 class="card-title">
            <MessageOutlined />
            {{ t('skill.comments.title') }}
          </h2>
        </div>
        <div class="card-body">
          <!-- Comment Input -->
          <div v-if="isAuthenticated" class="comment-input-wrap">
            <textarea
              v-model="newComment"
              :placeholder="t('skill.comments.placeholder')"
              class="comment-textarea"
              rows="3"
            />
            <a-button
              class="submit-btn"
              type="primary"
              @click="submitComment"
              :disabled="submitting || !newComment.trim()"
            >
              {{ submitting ? t('skill.comments.posting') : t('skill.comments.post') }}
            </a-button>
          </div>
          <div v-else class="login-prompt">
            <LockOutlined />
            {{ t('skill.comments.login_required') }}
          </div>

          <!-- Comments List -->
          <div v-if="commentsLoading" class="comments-loading">
            <a-spin />
          </div>
          <div v-else-if="comments.length === 0" class="comments-empty">
            <p>{{ t('skill.comments.empty') }}</p>
          </div>
          <div v-else class="comments-list">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-header">
                <div class="comment-author">
                  <Avatar class="author-avatar">{{ getInitials(comment.user) }}</Avatar>
                  <div class="author-info">
                    <span class="author-name">{{ comment.user?.displayName || comment.user?.handle || t('skill.comments.anonymous') }}</span>
                    <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                </div>
                <button
                  v-if="user?.id === comment.userId"
                  @click="deleteComment(comment.id)"
                  class="delete-btn"
                >
                  <DeleteOutlined />
                </button>
              </div>
              <p class="comment-body">{{ comment.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Install Dialog -->
    <InstallDialog
      :open="showInstallDialog"
      :slug="skill?.slug || ''"
      :install-command="cliInstallCommand"
      :download-url="cliDownloadUrl"
      @close="showInstallDialog = false"
    />

    <!-- Changelog Dialog -->
    <a-modal
      v-if="version?.changelog"
      :open="showChangelog"
      :title="t('skill.changelog.title')"
      :footer="null"
      @cancel="showChangelog = false"
      centered
      class="changelog-modal"
    >
      <div class="changelog-content">{{ version.changelog }}</div>
    </a-modal>
  </div>
</MotionBackground>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  StarFilled,
  DownloadOutlined,
  UserOutlined,
  TagOutlined,
  CalendarOutlined,
  FileTextOutlined,
  MessageOutlined,
  LockOutlined,
  DeleteOutlined,
  EditOutlined,
  CloudDownloadOutlined
} from "@ant-design/icons-vue";
import { Avatar } from "ant-design-vue";
import MotionBackground from "@/components/MotionBackground.vue";
import InstallDialog from "@/components/InstallDialog.vue";

const { t } = useI18n();

interface CommentUser {
  id: string;
  handle: string | null;
  displayName: string | null;
}

interface Comment {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  user: CommentUser | null;
}

const api = useApi();
const { isAuthenticated, token, user } = useAuth();
const route = useRoute();
const slug = route.params.slug as string;

const showInstallDialog = ref(false);
const showChangelog = ref(false);
const mounted = ref(false);
const contentReady = ref(false);

const data = ref<{
  skill: {
    id: string;
    slug: string;
    displayName: string;
    summary: string | null;
    moderationStatus: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  };
  latestVersion: {
    version: string;
    changelog: string;
    createdAt: number;
    files: Array<{ path: string; size: number }>;
  } | null;
  owner: {
    handle: string | null;
    displayName: string | null;
    image: string | null;
  } | null;
} | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const skill = computed(() => data.value?.skill);
const version = computed(() => data.value?.latestVersion);
const owner = computed(() => data.value?.owner);
const isOwner = computed(() => owner.value?.handle === user.value?.handle);

const isStarred = ref(false);
const starCount = ref(0);
const comments = ref<Comment[]>([]);
const commentsLoading = ref(true);
const newComment = ref("");
const submitting = ref(false);

// CLI commands
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
const CLI_SITE = import.meta.env.VITE_CLI_SITE || "https://clawhub.ai";

const cliInstallCommand = computed(() => `export CLAWHUB_REGISTRY="${CLI_SITE}" && npx clawhub@latest install ${skill.value?.slug}`);
const cliDownloadUrl = computed(() => `${API_BASE}/api/v1/download?slug=${skill.value?.slug}`);

onMounted(async () => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });

  try {
    data.value = await api.get(`/api/v1/skills/${slug}`, { token: token.value });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skill";
  } finally {
    pending.value = false;
  }

  // Check star status (only if authenticated and slug is valid)
  if (isAuthenticated.value && slug && slug !== 'new-slug') {
    try {
      const starData = await api.get<{ ok: boolean; starred: boolean }>(
        `/api/v1/stars/${slug}`,
        { token: token.value }
      );
      isStarred.value = starData.starred;
      starCount.value = skill.value?.stats?.stars || 0;
    } catch {
      // ignore
    }
  } else {
    // Set star count from skill data even if not authenticated
    starCount.value = skill.value?.stats?.stars || 0;
  }

  if (skill.value?.id) {
    try {
      const commentsData = await api.get<{ comments: Comment[] }>(
        `/skills/${skill.value.id}/comments`
      );
      comments.value = commentsData.comments;
    } catch {
      // ignore
    }
  }
  commentsLoading.value = false;

  // Trigger entrance animation after content is loaded
  requestAnimationFrame(() => {
    contentReady.value = true;
  });
});

async function toggleStar() {
  if (!isAuthenticated.value) {
    alert(t("skill.alerts.please_login"));
    return;
  }
  if (!slug || slug === 'new-slug') return;

  try {
    const result = await api.post<{ ok: boolean; starred: boolean }>(
      `/api/v1/stars/${slug}`,
      {},
      { token: token.value }
    );
    isStarred.value = result.starred;
    if (skill.value?.stats) {
      skill.value.stats.stars += result.starred ? 1 : -1;
      starCount.value = skill.value.stats.stars;
    }
  } catch (err) {
    console.error("Failed to toggle star:", err);
  }
}

async function submitComment() {
  if (!isAuthenticated.value || !skill.value?.id || !newComment.value.trim()) return;

  submitting.value = true;
  try {
    const result = await api.post<{ comment: Comment }>(
      `/skills/${skill.value.id}/comments`,
      { body: newComment.value.trim() },
      { token: token.value }
    );
    comments.value = [result.comment, ...comments.value];
    newComment.value = "";
  } catch (err) {
    console.error("Failed to post comment:", err);
  } finally {
    submitting.value = false;
  }
}

async function deleteComment(commentId: string) {
  if (!confirm(t("skill.confirm.delete_comment"))) return;

  try {
    await api.delete(`/comments/${commentId}`, { token: token.value });
    comments.value = comments.value.filter((c) => c.id !== commentId);
  } catch (err) {
    console.error("Failed to delete comment:", err);
  }
}

function formatDate(dateStr: string | number): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

function getInitials(commentUser: CommentUser | null): string {
  if (!commentUser) return "?";
  const name = commentUser.displayName || commentUser.handle;
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}
</script>

<style scoped>
.skill-detail-page {
  position: relative;
  padding: 2rem 1.5rem 4rem;
}

/* ─── Loading/Error States ─── */
.loading-state,
.error-state {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #6b7280;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(43, 127, 255, 0.1);
  border-top-color: #2b7fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Page Content ─── */
.page-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Glass Card Base ─── */
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow:
    0 4px 16px rgba(43, 127, 255, 0.06),
    0 2px 8px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* ─── Header Card ─── */
.header-card {
  padding: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.title-section {
  flex: 1;
  min-width: 0;
}

.skill-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #27272a;
  margin: 0 0 0.75rem;
}

.skill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-icon {
  font-size: 0.9rem;
  color: #9ca3af;
}

.meta-changelog {
  display: inline-flex;
  align-items: center;
  /* gap: 0.1rem; */
  height: auto;
  padding: 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
}

.meta-changelog:hover {
  color: #2b7fff;
}

.meta-changelog .anticon {
  font-size: 0.875rem;
}

/* Override Ant Design link padding */
:deep(.meta-changelog) {
  padding: 0;
  line-height: 1;
}

/* ─── Inline Description ─── */
.skill-desc {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #4b5563;
  margin: 1rem 0 0;
  white-space: pre-wrap;
}

/* ─── Stats Pill ─── */
.stats-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(237, 237, 237, 0.8);
  border-radius: 99999px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #6b7280;
}

.stat-item .anticon {
  font-size: 0.875rem;
}

.stat-item.star {
  color: #f59e0b;
}

.stat-item span {
  font-weight: 600;
}

/* ─── Action Buttons ─── */
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.875rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 42px;
  padding: 0 1.25rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(0);
}

.star-btn {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(237, 237, 237, 0.8);
  color: #6b7280;
}

.star-btn.starred {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: rgba(251, 191, 36, 0.4);
  color: #92400e;
}

.star-btn.starred .anticon {
  color: #f59e0b;
}

.primary-btn {
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  border: none;
  color: #fff;
  box-shadow:
    0 4px 12px rgba(43, 127, 255, 0.25),
    0 2px 6px rgba(43, 127, 255, 0.15);
}

.primary-btn:hover {
  box-shadow:
    0 6px 16px rgba(43, 127, 255, 0.3),
    0 3px 8px rgba(43, 127, 255, 0.2);
}

.edit-btn {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(237, 237, 237, 0.8);
}

/* ─── Comments Card ─── */
.comments-card {
  padding: 1.5rem 2rem;
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-title .anticon {
  padding: 1.5rem 2rem;
}

/* ─── Comment Input ─── */
.comment-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.comment-textarea {
  width: 100%;
  padding: 1rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(237, 237, 237, 0.8);
  border-radius: 16px;
  resize: vertical;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.comment-textarea:focus {
  outline: none;
  border-color: rgba(43, 127, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.08);
}

.comment-textarea::placeholder {
  color: #9ca3af;
}

.submit-btn {
  align-self: flex-end;
  height: 38px;
  padding: 0 1.25rem;
  border-radius: 99999px;
  font-weight: 600;
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background: rgba(243, 244, 246, 0.5);
  border-radius: 16px;
  font-size: 0.875rem;
  color: #6b7280;
}

/* ─── Comments List ─── */
.comments-loading,
.comments-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(237, 237, 237, 0.6);
  border-radius: 16px;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.comment-item:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(43, 127, 255, 0.15);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.author-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  border: none;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.author-name {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.comment-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.comment-body {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
}

/* ─── Changelog Modal ─── */
:deep(.changelog-modal .ant-modal-content) {
  border-radius: 20px;
}

:deep(.changelog-modal .ant-modal-header) {
  border-radius: 20px 20px 0 0;
  padding: 1.25rem 1.5rem;
}

:deep(.changelog-modal .ant-modal-body) {
  padding: 1.5rem;
}

.changelog-content {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #4b5563;
  white-space: pre-wrap;
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .glass-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .skill-title {
  color: #f1f5f9;
}

[data-theme="dark"] .meta-item {
  color: #94a3b8;
}

[data-theme="dark"] .meta-icon {
  color: #64748b;
}

[data-theme="dark"] .meta-changelog {
  color: #64748b;
}

[data-theme="dark"] .meta-changelog:hover {
  color: #60a5fa;
}

[data-theme="dark"] .skill-desc {
  color: #cbd5e1;
}

[data-theme="dark"] .stats-pill {
  background: rgba(40, 45, 80, 0.5);
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .stat-item {
  color: #94a3b8;
}

[data-theme="dark"] .star-btn {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(99, 102, 241, 0.2);
  color: #94a3b8;
}

[data-theme="dark"] .star-btn.starred {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fef3c7;
}

[data-theme="dark"] .edit-btn {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .card-title {
  color: #f1f5f9;
}

[data-theme="dark"] .comment-textarea {
  background: rgba(40, 45, 80, 0.5);
  border-color: rgba(99, 102, 241, 0.2);
  color: #e2e8f0;
}

[data-theme="dark"] .comment-textarea:focus {
  border-color: rgba(43, 127, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.12);
}

[data-theme="dark"] .comment-textarea::placeholder {
  color: #64748b;
}

[data-theme="dark"] .login-prompt {
  background: rgba(30, 35, 60, 0.4);
  color: #64748b;
}

[data-theme="dark"] .comment-item {
  background: rgba(30, 35, 60, 0.4);
  border-color: rgba(99, 102, 241, 0.12);
}

[data-theme="dark"] .comment-item:hover {
  background: rgba(40, 45, 80, 0.5);
  border-color: rgba(43, 127, 255, 0.25);
}

[data-theme="dark"] .author-name {
  color: #e2e8f0;
}

[data-theme="dark"] .comment-date {
  color: #64748b;
}

[data-theme="dark"] .comment-body {
  color: #cbd5e1;
}

[data-theme="dark"] .changelog-content {
  color: #cbd5e1;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    gap: 1.25rem;
  }

  .header-actions {
    align-items: flex-start;
    width: 100%;
  }

  .stats-pill {
    width: 100%;
    justify-content: center;
  }

  .action-buttons {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }

  .skill-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .ring-2,
  .ring-3 {
    display: none;
  }
}
</style>
