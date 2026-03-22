<template>
  <div class="container py-8 max-w-5xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-1">{{ t('skills.title') }} ({{ total }})</h1>
      <p class="text-gray-500">{{ t('skills.subtitle') }}</p>
    </div>

    <!-- Search & Filters -->
    <SkillsFilters
      v-model:view-mode="viewMode"
      :sort-options="sortOptions"
      :placeholder="t('skills.search_placeholder')"
      @update:sort="handleSortChange"
      @update:search="handleSearchChange"
    >
      <template #filters>
        <a-button
          :type="filterHighlighted ? 'primary' : 'default'"
          size="small"
          @click="filterHighlighted = !filterHighlighted"
        >
          {{ t('skills.filter.highlighted') }}
        </a-button>
      </template>
    </SkillsFilters>

    <!-- Skills List -->
    <SkillsList
      :skills="skills"
      :view-mode="viewMode"
      :pending="pending"
      :error="error"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import SkillsFilters from "@/components/SkillsFilters.vue";
import SkillsList from "@/components/SkillsList.vue";

const { t } = useI18n();

const api = useApi();

const sortBy = ref("updated");
const searchQuery = ref("");
const filterHighlighted = ref(false);
const viewMode = ref<"list" | "card">("list");

const sortOptions = computed(() => [
  { value: "updated", label: t("skills.sort.updated") },
  { value: "downloads", label: t("skills.sort.downloads") },
  { value: "stars", label: t("skills.sort.stars") },
  { value: "installs", label: t("skills.sort.installs") },
]);

const data = ref<{
  items: Array<{
    slug: string;
    displayName: string;
    summary: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  }>;
  total: number;
  nextCursor: string | null;
} | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

async function fetchSkills() {
  pending.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      limit: "20",
      sort: sortBy.value,
    });
    if (searchQuery.value) {
      params.set("q", searchQuery.value);
    }
    const res = await api.get<{ items: Array<{ slug: string; displayName: string; summary: string | null; stats: { downloads: number; stars: number; installs: number }; badges: Record<string, unknown> | null; owner: { handle: string | null; displayName: string | null } | null }>; total: number; nextCursor: string | null }>(`/api/v1/skills?${params}`);
    data.value = res;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skills";
  } finally {
    pending.value = false;
  }
}

function handleSortChange(newSort: string) {
  sortBy.value = newSort;
  fetchSkills();
}

function handleSearchChange(newSearch: string) {
  searchQuery.value = newSearch;
  fetchSkills();
}

onMounted(fetchSkills);

const skills = computed(() => data.value?.items || []);
const total = computed(() => data.value?.total || 0);
</script>
