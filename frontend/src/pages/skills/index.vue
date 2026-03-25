<template>
  <div class="skills-page">
    <!-- Page background -->
    <div class="bg-gradient"></div>
    <div class="rings" aria-hidden="true">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
    </div>

    <!-- Page hero header -->
    <div class="page-hero">
      <h1 class="page-title" :class="{ 'title-in': mounted }">
        {{ t('skills.title') }}
        <span class="title-count">({{ total }})</span>
      </h1>
      <p class="page-subtitle" :class="{ 'subtitle-in': mounted }">
        {{ t('skills.subtitle') }}
      </p>
    </div>

    <!-- Search & Filters -->
    <div class="filters-wrap" :class="{ 'filters-in': mounted }">
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
    <SkillsList
      :skills="skills"
      :view-mode="viewMode"
      :pending="pending"
      :error="error"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import SkillsFilters from "@/components/SkillsFilters.vue";
import SkillsList from "@/components/SkillsList.vue";

const { t } = useI18n();

const api = useApi();

const sortBy = ref("updated");
const searchQuery = ref("");
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

/* ─── Background Gradient ─── */
.bg-gradient {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    154deg,
    #eef6ff 0%,
    rgba(238, 242, 255, 0.3) 50%,
    #faf5ff 100%
  );
  pointer-events: none;
}

/* ─── Decorative Rings ─── */
.rings {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ring {
  position: absolute;
  border-radius: 99999px;
  border: 1.5px solid rgba(190, 219, 255, 0.5);
}

.ring-1 {
  width: 400px;
  height: 400px;
  left: -5%;
  top: 10%;
  animation: ring-float 12s ease-in-out infinite;
}

.ring-2 {
  width: 600px;
  height: 600px;
  right: -8%;
  top: 30%;
  animation: ring-float 12s ease-in-out infinite 3s;
}

@keyframes ring-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

/* ─── Page Hero Header ─── */
.page-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 640px;
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
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.title-in {
  opacity: 1;
  transform: translateY(0);
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
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.1s;
}

.subtitle-in {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Filters ─── */
.filters-wrap {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto 2rem;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.18s;
}

.filters-in {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .bg-gradient {
  background: linear-gradient(
    154deg,
    #0f1729 0%,
    rgba(15, 15, 45, 0.6) 50%,
    #1a0f2e 100%
  );
}

[data-theme="dark"] .ring {
  border-color: rgba(43, 127, 255, 0.12);
}

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
