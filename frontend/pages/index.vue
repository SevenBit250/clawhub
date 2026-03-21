<template>
  <div>
    <section class="hero-section">
      <div class="container text-center">
        <h1 class="text-5xl font-bold mb-4">Welcome to ClawHub</h1>
        <p class="text-xl mb-8">Discover and share amazing skills</p>
        <NuxtLink to="/skills">
          <a-button type="primary" size="large">Browse Skills</a-button>
        </NuxtLink>
      </div>
    </section>

    <section class="container py-16">
      <h2 class="text-3xl font-bold mb-8 text-center">Featured Skills</h2>
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
            <h3 class="text-xl font-semibold mb-2">{{ skill.displayName }}</h3>
            <p class="text-gray-600 mb-4 line-clamp-2">
              {{ skill.summary || "No description" }}
            </p>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span><StarFilled style="color: #faad14" /> {{ skill.statsStars || 0 }}</span>
              <span><DownloadOutlined /> {{ skill.statsDownloads || 0 }}</span>
            </div>
          </NuxtLink>
        </a-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { StarFilled, DownloadOutlined } from "@ant-design/icons-vue";

const api = useApi();

const { data, pending, error } = await useAsyncData(
  "featured-skills",
  () =>
    api.get<
      Array<{
        id: string;
        slug: string;
        displayName: string;
        summary: string | null;
        statsStars: number;
        statsDownloads: number;
      }>
    >("/skills?limit=6&sort=downloads")
);

const skills = computed(() => data.value || []);
</script>

<style scoped>
.hero-section {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-secondary) 100%
  );
  color: white;
  padding: 5rem 0;
}

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
