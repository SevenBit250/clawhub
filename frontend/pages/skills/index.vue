<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">Skills</h1>

    <div class="flex gap-4 mb-8">
      <a-select
        v-model:value="sortBy"
        style="width: 200px"
        @change="handleSortChange"
      >
        <a-select-option value="updated">Recently Updated</a-select-option>
        <a-select-option value="downloads">Most Downloads</a-select-option>
        <a-select-option value="stars">Most Stars</a-select-option>
        <a-select-option value="installs">Most Installs</a-select-option>
      </a-select>
    </div>

    <a-spin v-if="pending" class="flex justify-center py-20" />
    <a-result
      v-else-if="error"
      status="error"
      title="Failed to load skills"
      class="py-20"
    />
    <div v-else class="grid grid-cols-3 gap-6">
      <a-card
        v-for="skill in skills"
        :key="skill.id"
        hoverable
        class="skill-card"
      >
        <NuxtLink :to="`/skills/${skill.slug}`">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-semibold">{{ skill.displayName }}</h3>
            <a-tag v-if="skill.badges?.highlighted" color="gold">
              <StarFilled /> Highlighted
            </a-tag>
          </div>
          <p class="text-gray-600 mb-4 line-clamp-2">
            {{ skill.summary || "No description" }}
          </p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>by {{ skill.owner?.handle || skill.owner?.displayName || "Unknown" }}</span>
            <div class="flex gap-3">
              <span><StarFilled style="color: #faad14" /> {{ skill.statsStars || 0 }}</span>
              <span><DownloadOutlined /> {{ skill.statsDownloads || 0 }}</span>
            </div>
          </div>
        </NuxtLink>
      </a-card>
    </div>

    <div
      v-if="!skills.length && !pending"
      class="text-center py-20 text-gray-500"
    >
      No skills found
    </div>
  </div>
</template>

<script setup lang="ts">
import { StarFilled, DownloadOutlined } from "@ant-design/icons-vue";

const api = useApi();
const route = useRoute();
const router = useRouter();

const sortBy = ref((route.query.sort as string) || "updated");

function handleSortChange() {
  router.push({ query: { sort: sortBy.value } });
}

const { data, pending, error } = await useAsyncData(
  () => `skills-${sortBy.value}`,
  () =>
    api.get<
      Array<{
        id: string;
        slug: string;
        displayName: string;
        summary: string | null;
        statsStars: number;
        statsDownloads: number;
        badges: Record<string, unknown> | null;
        owner: { handle: string | null; displayName: string | null } | null;
      }>
    >(`/skills?limit=20&sort=${sortBy.value}`)
);

const skills = computed(() => data.value || []);
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
</style>
