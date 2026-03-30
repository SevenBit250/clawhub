<template>
  <a-spin v-if="pending" class="flex justify-center py-20" />
  <a-result
    v-else-if="error"
    status="error"
    :title="t('demands.failed')"
    class="py-20"
  />
  <template v-else-if="demands.length">
    <div class="demands-grid">
      <DemandCard
        v-for="(demand, index) in demands"
        :key="demand.id || index"
        :demand="demand"
        :index="index"
        :class="['motion-up-12', { 'in': contentMounted }]"
        :style="{ transitionDelay: `${index * 0.03}s` }"
      />
    </div>
  </template>
  <div
    v-else
    class="text-center py-20 text-gray-500"
  >
    {{ t("demands.no_demands") }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import DemandCard from "./DemandCard.vue";

export interface Demand {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  summary?: string;
  author?: string;
  owner?: { handle?: string; name?: string };
  budget?: string;
  priority?: string;
  status?: string;
}

const props = defineProps<{
  demands: Demand[];
  pending: boolean;
  error: string | null;
}>();

const { t } = useI18n();

const contentMounted = ref(false);

watch(
  () => props.demands,
  (newDemands) => {
    if (newDemands && newDemands.length > 0) {
      contentMounted.value = false;
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
.demands-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .demands-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (max-width: 640px) {
  .demands-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
