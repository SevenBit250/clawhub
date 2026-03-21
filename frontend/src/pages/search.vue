<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">{{ t('search.title') }}</h1>

    <div class="mb-8">
      <div class="relative">
        <input
          v-model="searchInput"
          type="text"
          :placeholder="t('search.input_placeholder')"
          class="w-full border rounded-lg px-4 py-3 text-lg pl-12"
          @keyup.enter="doSearch"
        />
        <svg
          class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <div v-if="pending" class="text-center py-20">
      {{ t('search.loading') }}
    </div>

    <div v-else-if="error" class="text-center text-red-500 py-20">
      {{ error }}
    </div>

    <div v-else-if="results.length === 0 && searchInput.trim().length > 0" class="text-center py-20 text-gray-500">
      {{ t('search.no_results', { query: searchInput }) }}
    </div>

    <div v-else-if="results.length > 0" class="space-y-4">
      <div
        v-for="result in results"
        :key="result.id"
        class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
      >
        <router-link :to="`/skills/${result.slug}`" class="block">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-semibold">{{ result.displayName }}</h3>
            <span class="text-sm text-gray-500">{{ t('search.score_label') }} {{ result.score.toFixed(2) }}</span>
          </div>
          <p class="text-gray-600 mb-4">{{ result.summary || t('search.no_description') }}</p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ t('search.by_author', { owner: result.ownerHandle || result.ownerName || t('souls.unknown_author') }) }}</span>
            <div class="flex gap-4">
              <span>⭐ {{ result.statsStars || 0 }}</span>
              <span>⬇️ {{ result.statsDownloads || 0 }}</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-500">
      {{ t('search.empty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const api = useApi();

const searchInput = ref((route.query.q as string) || "");
const results = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  ownerHandle: string | null;
  ownerName: string | null;
  statsStars: number;
  statsDownloads: number;
  score: number;
}>>([]);
const pending = ref(false);
const error = ref<string | null>(null);

async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    results.value = [];
    return;
  }

  pending.value = true;
  error.value = null;

  try {
    const response = await api.get<{
      results: typeof results.value;
      query: string;
    }>(`/search?q=${encodeURIComponent(q)}`);
    results.value = response.results;
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("errors.search_failed");
    results.value = [];
  } finally {
    pending.value = false;
  }
}

onMounted(() => {
  if (searchInput.value) {
    doSearch();
  }
});
</script>
