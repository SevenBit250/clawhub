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
        <div v-else class="space-y-4">
          <div
            v-for="s in mySkills"
            :key="s.id"
            class="border rounded-lg p-4 flex items-center justify-between"
            :class="{ 'opacity-60': s.moderationStatus === 'pending' }"
          >
            <router-link :to="`/skills/${s.slug}`" class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{{ s.displayName }}</h3>
                <a-tag v-if="s.moderationStatus === 'pending'" color="orange">
                  {{ t('dashboard.pending_review') }}
                </a-tag>
              </div>
              <p class="text-sm text-gray-500">{{ s.slug }}</p>
              <p v-if="s.moderationStatus === 'pending'" class="text-xs text-orange-500 mt-1">
                {{ t('dashboard.pending_hint') }}
              </p>
            </router-link>
            <router-link :to="`/skills/${s.slug}/edit`">
              <a-button type="default">{{ t('dashboard.edit') }}</a-button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";

const { t } = useI18n();
const { isAuthenticated, token, loaded, getAuthUrl } = useAuth();
const api = useApi();

const mySkills = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  moderationStatus?: string;
}>>([]);
const mySouls = ref<Array<{ id: string; slug: string; displayName: string }>>([]);

async function fetchData() {
  if (!token.value) {
    mySkills.value = [];
    mySouls.value = [];
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

const totalStars = computed(() =>
  (mySkills.value || []).reduce((sum: number, s: any) => sum + (s.statsStars || 0), 0)
);

async function handleLogin() {
  const url = await getAuthUrl();
  window.location.href = url;
}
</script>
