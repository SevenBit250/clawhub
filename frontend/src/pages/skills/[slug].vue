<template>
  <div class="container py-8 max-w-5xl">
    <div v-if="pending" class="text-center py-20">{{ t('skill.loading') }}</div>
    <div v-else-if="error || !skill" class="text-center py-20">
      {{ t('skill.not_found') }}
    </div>
    <div v-else>
      <!-- Header -->
      <div class="flex items-start justify-between mb-8">
        <div>
          <h1 class="text-4xl font-bold mb-2">{{ skill.displayName }}</h1>
          <p class="text-gray-600 flex items-center gap-2 flex-wrap">
            <span>{{ t('skill.by_author', { author: owner?.handle || owner?.displayName || t('souls.unknown_author') }) }}</span>
            <span v-if="version">·</span>
            <span v-if="version">{{ t('skill.version.title', { version: version.version }) }}</span>
            <span v-if="version">·</span>
            <span v-if="version" class="text-gray-400">{{ new Date(version.createdAt).toLocaleDateString() }}</span>
            <a-button v-if="version?.changelog" type="link" size="small" @click="showChangelog = true" class="text-primary">
              {{ t('skill.changelog.view') }}
            </a-button>
          </p>
        </div>
        <div class="flex gap-3 items-center">
          <div class="flex gap-4 text-sm mr-4">
            <div class="text-center">
              <div class="font-semibold">{{ skill.stats?.downloads || 0 }}</div>
              <div class="text-gray-500 text-xs">{{ t('skill.stats.downloads') }}</div>
            </div>
            <div class="text-center">
              <div class="font-semibold">{{ skill.stats?.installs || 0 }}</div>
              <div class="text-gray-500 text-xs">{{ t('skill.stats.installs') }}</div>
            </div>
          </div>
          <a-button type="default" @click="toggleStar">
            <StarFilled :style="{ color: isStarred ? '#faad14' : 'inherit' }" />
            {{ starCount > 0 ? starCount : '' }}
          </a-button>
          <a-button type="primary" @click="showInstallDialog = true">
            <DownloadOutlined /> {{ t('skill.install') }}
          </a-button>
        </div>
      </div>

      <!-- Description -->
      <div class="border rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">{{ t('skill.description.title') }}</h2>
        <p class="text-gray-700 whitespace-pre-wrap">{{ skill.summary || t('skill.description.none') }}</p>
      </div>

      <!-- Comments Section -->
      <div class="border rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-6">{{ t('skill.comments.title') }}</h2>

        <div v-if="isAuthenticated" class="mb-6">
          <textarea
            v-model="newComment"
            :placeholder="t('skill.comments.placeholder')"
            class="w-full border rounded-lg p-3 mb-2"
            rows="3"
          />
          <a-button
            type="primary"
            @click="submitComment"
            :disabled="submitting || !newComment.trim()"
          >
            {{ submitting ? t('skill.comments.posting') : t('skill.comments.post') }}
          </a-button>
        </div>
        <div v-else class="mb-6 text-gray-500">
          {{ t('skill.comments.login_required') }}
        </div>

        <div v-if="commentsLoading" class="text-center py-4">{{ t('skill.comments.loading') }}</div>
        <div v-else-if="comments.length === 0" class="text-gray-500 text-center py-8">
          {{ t('skill.comments.empty') }}
        </div>
        <div v-else class="space-y-4">
          <div v-for="comment in comments" :key="comment.id" class="border-b border-gray-100 pb-4">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{{ comment.user?.displayName || comment.user?.handle || t('skill.comments.anonymous') }}</span>
                  <span class="text-gray-400 text-sm">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="text-gray-700">{{ comment.body }}</p>
              </div>
              <button
                v-if="user?.id === comment.userId"
                @click="deleteComment(comment.id)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                {{ t('skill.comments.delete') }}
              </button>
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
    >
      <div class="text-gray-700 whitespace-pre-wrap">{{ version.changelog }}</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { StarFilled, DownloadOutlined } from "@ant-design/icons-vue";
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

const data = ref<{
  skill: {
    id: string;
    slug: string;
    displayName: string;
    summary: string | null;
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
  try {
    data.value = await api.get(`/api/v1/skills/${slug}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skill";
  } finally {
    pending.value = false;
  }

  if (skill.value?.slug) {
    try {
      const starData = await api.get<{ ok: boolean; starred: boolean }>(
        `/api/v1/stars/${skill.value.slug}`,
        { token: token.value }
      );
      isStarred.value = starData.starred;
      starCount.value = skill.value?.stats?.stars || 0;
    } catch {
      // ignore
    }
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
});

async function toggleStar() {
  if (!isAuthenticated.value) {
    alert(t("skill.alerts.please_login"));
    return;
  }
  if (!skill.value?.slug) return;

  try {
    const result = await api.post<{ ok: boolean; starred: boolean }>(
      `/api/v1/stars/${skill.value.slug}`,
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
</script>
