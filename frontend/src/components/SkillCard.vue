<template>
  <a-card
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
        <SkillStats :stats="skill.stats" />
      </div>
    </router-link>
  </a-card>
</template>

<script setup lang="ts">
import { StarFilled } from "@ant-design/icons-vue";
import SkillStats from "./SkillStats.vue";

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
</script>

<style scoped>
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
