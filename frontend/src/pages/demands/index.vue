<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">{{ t("demands.title") }}</h1>

    <div v-if="pending" class="text-center py-20">{{ t("demands.loading") }}</div>
    <div v-else-if="error" class="text-center text-red-500 py-20">
      {{ t("demands.failed") }}
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(demand, index) in demands"
        :key="demand.id || index"
        class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
      >
        <h3 class="text-lg font-semibold mb-2">{{ demand.title || demand.name || `Demand #${index + 1}` }}</h3>
        <p class="text-gray-600 mb-4 line-clamp-3">{{ demand.description || demand.content || demand.summary || "" }}</p>
        <div v-if="demand.author || demand.owner" class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ demand.author || demand.owner?.handle || demand.owner?.name || "" }}</span>
        </div>
        <div v-if="demand.budget || demand.priority || demand.status" class="flex items-center gap-2 mt-3">
          <span v-if="demand.budget" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{{ demand.budget }}</span>
          <span v-if="demand.priority" class="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">{{ demand.priority }}</span>
          <span v-if="demand.status" class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{{ demand.status }}</span>
        </div>
      </div>
    </div>

    <div v-if="!demands.length && !pending" class="text-center py-20 text-gray-500">
      {{ t("demands.no_demands") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const { t } = useI18n();
const api = useApi();

interface Demand {
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

const data = ref<{ items?: Demand[]; demands?: Demand[] }>({});
const pending = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    data.value = await api.get("/api/v1/demands");
  } catch {
    error.value = "failed";
  } finally {
    pending.value = false;
  }
});

const demands = computed(() => data.value?.items || data.value?.demands || []);
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
