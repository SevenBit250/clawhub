<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">{{ t('dashboard.title') }}</h1>

    <div v-if="!isAuthenticated && loaded" class="text-center py-20">
      <p class="text-gray-600 mb-4">{{ t('dashboard.login_required') }}</p>
      <a-button type="primary" @click="handleLogin">{{ t('dashboard.login') }}</a-button>
    </div>
    <div v-else-if="!loaded" class="text-center py-20">{{ t('dashboard.loading') }}</div>
    <div v-else>
      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">{{ t('dashboard.my_skills') }}</h3>
          <p class="text-3xl font-bold">{{ mySkills?.length || 0 }}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">{{ t('dashboard.my_souls') }}</h3>
          <p class="text-3xl font-bold">{{ mySouls?.length || 0 }}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">{{ t('dashboard.stars_received') }}</h3>
          <p class="text-3xl font-bold">{{ totalStars || 0 }}</p>
        </div>
      </div>

      <!-- Pending Review Section (Admin/Moderator only) -->
      <div v-if="isModerator && pendingSkills.length" class="mb-8">
        <h2 class="text-xl font-semibold mb-4">{{ t('dashboard.pending_review') }} ({{ pendingSkills.length }})</h2>
        <div class="space-y-4">
          <div
            v-for="s in pendingSkills"
            :key="s.id"
            class="border border-orange-200 bg-orange-50 rounded-lg p-4 flex items-center justify-between"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{{ s.displayName }}</h3>
                <a-tag color="orange">{{ t('dashboard.pending_review') }}</a-tag>
              </div>
              <p class="text-sm text-gray-500">{{ s.slug }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ t('skill.by_author', { author: s.ownerDisplayName || s.ownerHandle || 'Unknown' }) }}
              </p>
            </div>
            <a-button type="primary" @click="openModeration(s)">Review</a-button>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">{{ t('dashboard.my_skills') }}</h2>
          <router-link to="/skills/create">
            <a-button type="primary">{{ t('dashboard.create_skill') }}</a-button>
          </router-link>
        </div>

        <div v-if="!mySkills?.length" class="text-center py-10 border rounded-lg">
          <p class="text-gray-500">{{ t('dashboard.no_skills') }}</p>
        </div>
        <div v-else class="space-y-3">
          <DashboardSkillItem
            v-for="s in mySkills"
            :key="s.id"
            :skill="s"
          />
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { message } from "ant-design-vue";
import ModerationDialog from "@/components/ModerationDialog.vue";
import DashboardSkillItem from "@/components/DashboardSkillItem.vue";

const { t } = useI18n();
const { isAuthenticated, token, loaded, getAuthUrl, user } = useAuth();
const api = useApi();

const mySkills = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  moderationStatus?: string;
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

onMounted(() => {
  if (token.value) {
    fetchData();
  }
});

watch(token, () => {
  if (token.value) {
    fetchData();
  }
});

watch(isModerator, () => {
  if (token.value && isModerator.value) {
    fetchData();
  }
});

const totalStars = computed(() =>
  (mySkills.value || []).reduce((sum: number, s: any) => sum + (s.statsStars || 0), 0)
);

async function handleLogin() {
  const url = await getAuthUrl();
  window.location.href = url;
}

async function openModeration(skill: typeof pendingSkills.value[number]) {
  // Fetch full skill details including files
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
