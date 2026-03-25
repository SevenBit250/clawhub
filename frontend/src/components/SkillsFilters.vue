<template>
  <div class="filters-bar">
    <!-- Search + Filter Row -->
    <div class="filters-row">
      <!-- Search pill -->
      <div class="search-pill" :class="{ 'focused': searchFocused }">
        <SearchOutlined class="search-icon" :class="{ 'icon-active': searchFocused }" />
        <a-input
          v-model:value="searchQuery"
          :placeholder="placeholder"
          allow-clear
          class="filters-search"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @change="debouncedSearch"
        />
      </div>

      <!-- Filter actions -->
      <div class="filter-actions">
        <slot name="filters" />

        <a-divider v-if="$slots.filters" type="vertical" class="my-0" />

        <!-- Sort select -->
        <a-select
          v-model:value="sortBy"
          class="sort-select"
          size="small"
          @change="handleSortChange"
        >
          <a-select-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </a-select-option>
        </a-select>

        <!-- View mode toggle -->
        <div class="view-toggle">
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn-active': viewMode === 'list' }"
            @click="$emit('update:viewMode', 'list')"
            :title="t('skills.view.list')"
          >
            <UnorderedListOutlined />
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn-active': viewMode === 'card' }"
            @click="$emit('update:viewMode', 'card')"
            :title="t('skills.view.card')"
          >
            <AppstoreOutlined />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { SearchOutlined, UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  viewMode: "list" | "card";
  sortOptions: Array<{ value: string; label: string }>;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:viewMode": ["list" | "card"];
}>();

const router = useRouter();
const route = useRoute();

const sortBy = ref((route.query.sort as string) || "updated");
const searchQuery = ref((route.query.q as string) || "");
const searchFocused = ref(false);

function handleSortChange() {
  router.push({ query: { ...route.query, sort: sortBy.value } });
}

let searchTimer: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.push({ query: { ...route.query, q: searchQuery.value || undefined } });
  }, 300);
}

watch(() => route.query, (query) => {
  sortBy.value = (query.sort as string) || "updated";
  searchQuery.value = (query.q as string) || "";
});
</script>

<style scoped>
/* ─── Filters Bar ─── */
.filters-bar {
  margin-bottom: 2rem;
}

/* ─── Row ─── */
.filters-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* ─── Search Pill ─── */
.search-pill {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  max-width: 480px;
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

/* ─── Filter Actions ─── */
.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ─── Sort Select ─── */
.sort-select {
  border-radius: 99999px !important;
}

:deep(.ant-select-selector) {
  border-radius: 99999px !important;
  border-color: rgba(228, 228, 231, 0.6) !important;
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(8px) !important;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
  font-size: 0.875rem !important;
  height: 36px !important;
  padding: 0 12px !important;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  transition: all 0.2s ease !important;
}

:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
  border-color: rgba(43, 127, 255, 0.4) !important;
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: rgba(43, 127, 255, 0.5) !important;
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
}

/* ─── View Toggle ─── */
.view-toggle {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(228, 228, 231, 0.5);
  border-radius: 99999px;
  padding: 3px;
  gap: 2px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 99999px;
  background: transparent;
  color: #9f9fa9;
  cursor: pointer;
  font-size: 0.875rem;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
}

.toggle-btn:hover {
  color: #52525c;
  background: rgba(0, 0, 0, 0.04);
}

.toggle-btn-active {
  background: #ffffff !important;
  color: #2b7fff !important;
  box-shadow:
    0 2px 6px rgba(43, 127, 255, 0.2),
    0 1px 3px rgba(43, 127, 255, 0.15);
  transform: scale(1.05);
}

.toggle-btn-active:hover {
  background: #ffffff !important;
  color: #2b7fff !important;
}

/* ─── Filters Search Input Override ─── */
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

:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input-affix-wrapper):focus-within {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* ─── Divider ─── */
:deep(.ant-divider) {
  border-color: rgba(228, 228, 231, 0.5) !important;
}

/* ─── Dark Theme ─── */
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

[data-theme="dark"] .view-toggle {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.12);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

[data-theme="dark"] .toggle-btn {
  color: #64748b;
}

[data-theme="dark"] .toggle-btn:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .toggle-btn-active {
  background: rgba(40, 45, 80, 0.8) !important;
  color: #60a5fa !important;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2) !important;
}

[data-theme="dark"] :deep(.ant-select-selector) {
  background: rgba(30, 35, 60, 0.5) !important;
  border-color: rgba(99, 102, 241, 0.15) !important;
  color: #f1f5f9 !important;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
}

[data-theme="dark"] :deep(.ant-select-selection-item) {
  color: #f1f5f9 !important;
}

[data-theme="dark"] :deep(.ant-select-arrow) {
  color: #64748b !important;
}

[data-theme="dark"] :deep(.ant-divider) {
  border-color: rgba(99, 102, 241, 0.12) !important;
}

[data-theme="dark"] :deep(.ant-input) {
  color: #f1f5f9 !important;
  caret-color: #64748b !important;
}

[data-theme="dark"] :deep(.ant-input)::placeholder {
  color: #64748b !important;
}
</style>
