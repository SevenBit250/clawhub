<template>
  <MotionBackground>
    <div class="skills-page">
      <!-- Page hero header -->
      <div class="page-hero">
        <h1 class="page-title motion-up-24" :class="{ 'in': mounted }">
          {{ t('skills.title') }}
          <span class="title-count">({{ total }})</span>
        </h1>
        <p class="page-subtitle motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
          {{ t('skills.subtitle') }}
        </p>
      </div>

    <!-- Search & Filters -->
    <div class="filters-wrap motion-up-12" :class="{ 'in': mounted }">
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
    </div>

    <!-- Skills List -->
    <div class="skills-list-wrap">
      <SkillsList
        :skills="skills"
        :view-mode="viewMode"
        :pending="pending"
        :error="error"
      />
    </div>
  </div>
</MotionBackground>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import SkillsFilters from "@/components/SkillsFilters.vue";
import SkillsList from "@/components/SkillsList.vue";
import MotionBackground from "@/components/MotionBackground.vue";

const { t } = useI18n();

const api = useApi();
const route = useRoute();

const sortBy = ref((route.query.sort as string) || "updated");
const searchQuery = ref((route.query.q as string) || "");
const filterHighlighted = ref(false);
const viewMode = ref<"list" | "card">("list");
const mounted = ref(false);

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
    const res = await api.get<{
      items: Array<{
        slug: string; displayName: string; summary: string | null;
        stats: { downloads: number; stars: number; installs: number };
        badges: Record<string, unknown> | null;
        owner: { handle: string | null; displayName: string | null } | null;
      }>;
      total: number; nextCursor: string | null;
    }>(`/api/v1/skills?${params}`);
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

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  fetchSkills();
});

watch(
  () => route.query,
  () => {
    sortBy.value = (route.query.sort as string) || "updated";
    searchQuery.value = (route.query.q as string) || "";
    fetchSkills();
  }
);

const skills = computed(() => data.value?.items || []);
const total = computed(() => data.value?.total || 0);
</script>

<style scoped>
.skills-page {
  position: relative;
  min-height: calc(100vh - 120px);
  padding: 2rem 1.5rem 4rem;
  overflow: hidden;
}

/* ─── Page Hero Header ─── */
.page-hero {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto 2rem;
  padding-top: 1rem;
}

.page-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #27272a;
  margin: 0 0 0.75rem;
}

.title-count {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.6em;
  margin-left: 0.25em;
}

.page-subtitle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 400;
  line-height: 1.5;
  color: #6b7280;
  margin: 0;
}

/* ─── Filters ─── */
.filters-wrap {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto 2rem;
}

/* ─── Skills List ─── */
.skills-list-wrap {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto;
}

.filters-in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .page-title {
  color: #f1f5f9;
}

[data-theme="dark"] .title-count {
  color: #475569;
}

[data-theme="dark"] .page-subtitle {
  color: #64748b;
}
</style>
