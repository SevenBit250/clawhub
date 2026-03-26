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
        :class="['motion-up-12', { 'in': contentMounted }]"
        :style="{ transitionDelay: `${index * 0.02}s` }"
      />
    </div>

    <!-- Card View -->
    <div v-else class="card-grid">
      <SkillCard
        v-for="(skill, index) in skills"
        :key="skill.slug"
        :skill="skill"
        :class="['motion-up-12', { 'in': contentMounted }]"
        :style="{ transitionDelay: `${index * 0.02}s` }"
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
import { ref, watch, nextTick } from "vue";
import SkillListItem from "./SkillListItem.vue";
import SkillCard from "./SkillCard.vue";

const props = defineProps<{
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

const contentMounted = ref(false);

// Trigger animation when skills are loaded
watch(
  () => props.skills,
  (newSkills) => {
    if (newSkills && newSkills.length > 0) {
      // Reset first
      contentMounted.value = false;
      // Then trigger after next tick
      nextTick(() => {
        requestAnimationFrame(() => {
          contentMounted.value = true;
        });
      });
    }
  },
  { immediate: true }
);
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
</style>
