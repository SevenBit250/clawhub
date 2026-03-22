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
      <SkillListItem
        v-for="skill in skills"
        :key="skill.slug"
        :skill="skill"
      />
    </div>

    <!-- Card View -->
    <div v-else class="grid grid-cols-3 gap-6">
      <SkillCard
        v-for="skill in skills"
        :key="skill.slug"
        :skill="skill"
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
