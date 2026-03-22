<template>
  <router-link
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
</template>

<script setup lang="ts">
import { StarFilled, UserOutlined } from "@ant-design/icons-vue";

defineProps<{
  skill: {
    slug: string;
    displayName: string;
    summary: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  };
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
