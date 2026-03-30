<template>
  <MotionBackground>
    <div class="demands-page">
      <!-- Page hero header -->
      <div class="page-hero">
        <h1 class="page-title motion-up-24" :class="{ 'in': mounted }">
          {{ t('demands.title') }}
          <span class="title-count">({{ total }})</span>
        </h1>
        <p class="page-subtitle motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
          {{ t('demands.subtitle') }}
        </p>
      </div>

      <!-- Search -->
      <div class="filters-wrap motion-up-12" :class="{ 'in': mounted }">
        <div class="search-pill" :class="{ 'focused': searchFocused }">
          <SearchOutlined class="search-icon" :class="{ 'icon-active': searchFocused }" />
          <a-input
            v-model:value="searchQuery"
            :placeholder="t('demands.search_placeholder')"
            allow-clear
            class="filters-search"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
            @change="debouncedSearch"
          />
        </div>
      </div>

      <!-- Demands List -->
      <div class="demands-list-wrap">
        <DemandsList
          :demands="filteredDemands"
          :pending="pending"
          :error="error"
        />
      </div>
    </div>
  </MotionBackground>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { SearchOutlined } from "@ant-design/icons-vue";
import MotionBackground from "@/components/MotionBackground.vue";
import DemandsList from "@/components/DemandsList.vue";
import type { Demand } from "@/components/DemandsList.vue";

const { t } = useI18n();
const api = useApi();

const data = ref<{ items?: Demand[]; demands?: Demand[] }>({});
const pending = ref(true);
const error = ref<string | null>(null);
const mounted = ref(false);
const searchFocused = ref(false);
const searchQuery = ref("");

async function fetchDemands() {
  pending.value = true;
  error.value = null;
  try {
    data.value = await api.get("/api/v1/demands");
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("demands.failed");
  } finally {
    pending.value = false;
  }
}

const allDemands = computed(() => data.value?.items || data.value?.demands || []);
const total = computed(() => allDemands.value.length);

const filteredDemands = computed(() => {
  if (!searchQuery.value.trim()) return allDemands.value;
  const q = searchQuery.value.toLowerCase();
  return allDemands.value.filter((d) => {
    return (
      (d.title || d.name || "").toLowerCase().includes(q) ||
      (d.description || d.content || d.summary || "").toLowerCase().includes(q) ||
      (d.author || d.owner?.handle || d.owner?.name || "").toLowerCase().includes(q)
    );
  });
});

let searchTimer: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    // search handled by computed, no route update needed for demands
  }, 300);
}

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
  fetchDemands();
});
</script>

<style scoped>
.demands-page {
  position: relative;
  padding: 2rem 1.5rem 4rem;
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

/* ─── Search Pill ─── */
.filters-wrap {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto 2rem;
}

.search-pill {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 99999px;
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.06),
    0 1px 3px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  gap: 0.625rem;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-pill.focused {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.3);
  box-shadow:
    0 4px 12px rgba(43, 127, 255, 0.1),
    0 2px 6px rgba(43, 127, 255, 0.06);
  transform: translateY(-1px);
}

.search-icon {
  font-size: 1rem;
  color: #9f9fa9;
  flex-shrink: 0;
  transition: color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-icon.icon-active {
  color: #2b7fff;
  transform: scale(1.05);
}

.filters-search {
  flex: 1;
}

:deep(.ant-input-affix-wrapper) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
}

:deep(.ant-input) {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
  font-size: 0.9375rem !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  color: #525257 !important;
  padding: 0 !important;
  box-shadow: none !important;
  caret-color: #9f9fa9 !important;
}

:deep(.ant-input)::placeholder {
  color: #9f9fa9 !important;
}

/* ─── Demands List ─── */
.demands-list-wrap {
  position: relative;
  z-index: 1;
  max-width: 1024px;
  margin: 0 auto;
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

[data-theme="dark"] .search-pill {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .search-pill.focused {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.35);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .search-icon {
  color: #64748b;
}

[data-theme="dark"] .search-icon.icon-active {
  color: #60a5fa;
}

[data-theme="dark"] :deep(.ant-input) {
  color: #f1f5f9 !important;
  caret-color: #64748b !important;
}

[data-theme="dark"] :deep(.ant-input)::placeholder {
  color: #64748b !important;
}
</style>
