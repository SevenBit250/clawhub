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
    <div v-if="viewMode === 'list'" class="list-container">
      <SkillListItem
        v-for="(skill, index) in skills"
        :key="skill.slug"
        :skill="skill"
        :style="{ animationDelay: `${index * 60}ms` }"
        class="list-item-enter"
      />
    </div>

    <!-- Card View -->
    <div v-else class="card-grid">
      <SkillCard
        v-for="(skill, index) in skills"
        :key="skill.slug"
        :skill="skill"
        :style="{ animationDelay: `${index * 60}ms` }"
        class="card-item-enter"
      />
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
import SkillListItem from "./SkillListItem.vue";
import SkillCard from "./SkillCard.vue";

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
</script>

<style scoped>
/* ─── Card Grid ─── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* ─── List Container ─── */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── Staggered Enter Animations ─── */
.card-item-enter {
  opacity: 0;
  animation: card-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.list-item-enter {
  opacity: 0;
  animation: card-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
