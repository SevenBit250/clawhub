<template>
  <router-link
    :to="skill.moderationStatus === 'removed' ? `/skills/${skill.slug}/edit` : `/skills/${skill.slug}`"
    class="skill-item"
    :class="{ 'opacity-60': skill.moderationStatus === 'pending' }"
  >
    <div class="flex items-start justify-between flex-1 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-lg font-semibold truncate">{{ skill.displayName }}</h3>
          <a-tag v-if="skill.moderationStatus === 'pending'" color="orange">
            {{ t('dashboard.pending_review') }}
          </a-tag>
          <a-tag v-if="skill.moderationStatus === 'removed'" color="red">
            {{ t('dashboard.rejected') }}
          </a-tag>
        </div>
        <p class="text-sm text-gray-500 mb-1">{{ skill.slug }}</p>
        <p v-if="skill.moderationStatus === 'pending'" class="text-xs text-orange-500">
          {{ t('dashboard.pending_hint') }}
        </p>
        <p v-if="skill.moderationStatus === 'removed'" class="text-xs text-red-500">
          {{ t('dashboard.rejected_hint') }}
        </p>
      </div>
      <div class="flex items-center gap-6 text-sm ml-4 shrink-0">
        <div class="text-center">
          <div class="font-medium">{{ skill.stats?.downloads || 0 }}</div>
          <div class="text-gray-400 text-xs">{{ t('skills.stats.downloads') }}</div>
        </div>
        <div class="text-center">
          <div class="font-medium">{{ skill.stats?.stars || 0 }}</div>
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
defineProps<{
  skill: {
    slug: string;
    displayName: string;
    summary: string | null;
    moderationStatus?: string;
    stats?: { downloads: number; stars: number; installs: number };
  };
}>();

const { t } = useI18n();
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
</style>
