<template>
  <a-card class="mb-4" :bordered="true">
    <div class="mb-4">
      <a-input
        v-model:value="searchQuery"
        :placeholder="placeholder"
        allow-clear
        @change="debouncedSearch"
      >
        <template #prefix>
          <SearchOutlined class="text-gray-400" />
        </template>
      </a-input>
    </div>
    <div class="flex items-center gap-3">
      <slot name="filters" />
      <a-divider v-if="$slots.filters" type="vertical" class="my-0" />
      <a-select
        v-model:value="sortBy"
        style="width: 160px"
        size="small"
        @change="handleSortChange"
      >
        <a-select-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </a-select-option>
      </a-select>
      <div class="flex-1" />
      <a-button-group size="small">
        <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="$emit('update:viewMode', 'list')">
          <UnorderedListOutlined />
        </a-button>
        <a-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="$emit('update:viewMode', 'card')">
          <AppstoreOutlined />
        </a-button>
      </a-button-group>
    </div>
  </a-card>
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

function handleSortChange() {
  router.push({ query: { ...route.query, sort: sortBy.value } });
  emit("update:sort", sortBy.value);
}

let searchTimer: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.push({ query: { ...route.query, q: searchQuery.value || undefined } });
    emit("update:search", searchQuery.value);
  }, 300);
}

watch(() => route.query, (query) => {
  sortBy.value = (query.sort as string) || "updated";
  searchQuery.value = (query.q as string) || "";
});
</script>
