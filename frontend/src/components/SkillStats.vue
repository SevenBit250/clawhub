<template>
  <div class="skill-stats">
    <div class="stat-item" title="Downloads">
      <DownloadOutlined />
      <span class="stat-value">{{ formatCount(stats.downloads) }}</span>
    </div>
    <div class="stat-item" title="Stars">
      <StarFilled style="color: #faad14" />
      <span class="stat-value">{{ formatCount(stats.stars) }}</span>
    </div>
    <div class="stat-item" title="Installs">
      <CloudDownloadOutlined />
      <span class="stat-value">{{ formatCount(stats.installs) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DownloadOutlined, StarFilled, CloudDownloadOutlined } from "@ant-design/icons-vue";

defineProps<{
  stats: { downloads: number; stars: number; installs: number };
}>();

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}
</script>

<style scoped>
.skill-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-item .anticon {
  font-size: 1rem;
}

.stat-value {
  font-weight: 500;
  color: #374151;
}

:deep(.dark) .stat-item {
  color: #9ca3af;
}

:deep(.dark) .stat-value {
  color: #e5e7eb;
}
</style>
