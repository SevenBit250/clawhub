<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">{{ t('skills.title') }}</h1>

    <div class="flex gap-4 mb-8">
      <a-select
        v-model:value="sortBy"
        style="width: 200px"
        @change="handleSortChange"
      >
        <a-select-option value="updated">{{ t('skills.sort.updated') }}</a-select-option>
        <a-select-option value="downloads">{{ t('skills.sort.downloads') }}</a-select-option>
        <a-select-option value="stars">{{ t('skills.sort.stars') }}</a-select-option>
        <a-select-option value="installs">{{ t('skills.sort.installs') }}</a-select-option>
      </a-select>
    </div>

    <a-spin v-if="pending" class="flex justify-center py-20" />
    <a-result
      v-else-if="error"
      status="error"
      :title="t('skills.failed')"
      class="py-20"
    />
    <div v-else class="grid grid-cols-3 gap-6">
      <a-card
        v-for="skill in skills"
        :key="skill.slug"
        hoverable
        class="skill-card"
      >
        <router-link :to="`/skills/${skill.slug}`">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-semibold">{{ skill.displayName }}</h3>
            <a-tag v-if="skill.badges?.highlighted" color="gold">
              <StarFilled /> {{ t('skills.badge.highlighted') }}
            </a-tag>
          </div>
          <p class="text-gray-600 mb-4 line-clamp-2">
            {{ skill.summary || t('skills.no_description') }}
          </p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ skill.owner?.handle || skill.owner?.displayName || t('skills.unknown_author') }}</span>
            <div class="flex gap-3">
              <span><StarFilled style="color: #faad14" /> {{ skill.stats?.stars || 0 }}</span>
              <span><DownloadOutlined /> {{ skill.stats?.downloads || 0 }}</span>
            </div>
          </div>
        </router-link>
      </a-card>
    </div>

    <div
      v-if="!skills.length && !pending"
      class="text-center py-20 text-gray-500"
    >
      {{ t('skills.no_skills') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { StarFilled, DownloadOutlined } from "@ant-design/icons-vue";

const { t } = useI18n();

const api = useApi();
const route = useRoute();
const router = useRouter();

const sortBy = ref((route.query.sort as string) || "updated");

function handleSortChange() {
  router.push({ query: { sort: sortBy.value } });
}

const data = ref<{
  items: Array<{
    slug: string;
    displayName: string;
    summary: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  }>;
  nextCursor: string | null;
} | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

async function fetchSkills() {
  pending.value = true;
  error.value = null;
  try {
    const res = await api.get<{ items: Array<{ slug: string; displayName: string; summary: string | null; stats: { downloads: number; stars: number; installs: number }; badges: Record<string, unknown> | null; owner: { handle: string | null; displayName: string | null } | null }>; nextCursor: string | null }>(`/api/v1/skills?limit=20&sort=${sortBy.value}`);
    data.value = res;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skills";
  } finally {
    pending.value = false;
  }
}

onMounted(fetchSkills);

watch(sortBy, fetchSkills);

const skills = computed(() => data.value?.items || []);
</script>

<style scoped>
.skill-card {
  height: 100%;
}

.skill-card :deep(.ant-card-body) {
  padding: 1.5rem;
}

.text-gray-600 {
  color: var(--color-text-secondary);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
