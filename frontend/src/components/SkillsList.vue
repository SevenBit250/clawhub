<template>
  <a-spin v-if="pending" class="flex justify-center py-20" />
  <a-result
    v-else-if="error"
    status="error"
    :title="t('skills.failed')"
    class="py-20"
  />
  <template v-else-if="skills.length">
    <!-- List View -->
    <div v-if="viewMode === 'list'" class="space-y-3">
      <router-link
        v-for="skill in skills"
        :key="skill.slug"
        :to="`/skills/${skill.slug}`"
        class="skill-item"
      >
        <div class="flex items-start justify-between flex-1 min-w-0">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h3 class="text-lg font-semibold truncate">{{ skill.displayName }}</h3>
              <p class="text-gray-400 text-sm mb-2">/ {{ skill.slug }}</p>
              <a-tag v-if="skill.badges?.highlighted" color="gold" class="text-xs">
                <StarFilled /> {{ t('skills.badge.highlighted') }}
              </a-tag>
            </div>
            <p class="text-gray-600 text-sm line-clamp-1 mb-2">
              {{ skill.summary || t('skills.no_description') }}
            </p>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <UserOutlined />
              <span>{{ skill.owner?.handle || skill.owner?.displayName || t('skills.unknown_author') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-6 text-sm ml-4 shrink-0">
            <div class="text-center">
              <div class="font-medium">{{ formatCount(skill.stats?.downloads || 0) }}</div>
              <div class="text-gray-400 text-xs">{{ t('skills.stats.downloads') }}</div>
            </div>
            <div class="text-center">
              <div class="font-medium">{{ formatCount(skill.stats?.stars || 0) }}</div>
              <div class="text-gray-400 text-xs">{{ t('skills.stats.stars') }}</div>
            </div>
            <div class="text-center">
              <div class="font-medium">{{ skill.stats?.installs || 0 }}</div>
              <div class="text-gray-400 text-xs">{{ t('skills.stats.installs') }}</div>
            </div>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Card View -->
    <div v-else class="grid grid-cols-3 gap-6">
      <a-card
        v-for="skill in skills"
        :key="skill.slug"
        hoverable
        class="skill-card"
      >
        <router-link :to="`/skills/${skill.slug}`" class="skill-card-link">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ skill.displayName }}</h3>
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
  </template>
  <div
    v-else
    class="text-center py-20 text-gray-500"
  >
    {{ t('skills.no_skills') }}
  </div>
</template>

<script setup lang="ts">
import { StarFilled, UserOutlined, DownloadOutlined } from "@ant-design/icons-vue";

defineProps<{
  skills: Array<{
    slug: string;
    displayName: string;
    summary: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  }>;
  viewMode: "list" | "card";
  pending: boolean;
  error: string | null;
}>();

const { t } = useI18n();

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}
</script>

<style scoped>
.skill-item {
  display: block;
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  text-decoration: none;
  transition: all 0.2s;
  color: inherit;
}

.skill-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.skill-card {
  height: 100%;
}

.skill-card-link {
  text-decoration: none;
  color: inherit;
}

.skill-card :deep(.ant-card-body) {
  padding: 1.5rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
