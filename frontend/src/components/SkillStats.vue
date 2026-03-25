<template>
  <div class="skill-stats">
    <div class="stat-item" title="Downloads">
      <DownloadOutlined />
      <span class="stat-value">{{ formatCount(stats.downloads) }}</span>
    </div>
    <div class="stat-item" title="Stars">
      <StarFilled class="star-icon" />
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
  gap: 0.875rem;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #9ca3af;
  font-size: 0.8125rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 500;
  transition: color 0.2s ease;
}

.stat-item .anticon {
  font-size: 0.875rem;
}

.star-icon {
  color: #fbbf24;
}

.stat-value {
  color: #6b7280;
  font-weight: 600;
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .stat-item {
  color: #64748b;
}

[data-theme="dark"] .stat-value {
  color: #94a3b8;
}

[data-theme="dark"] .skill-stats .anticon {
  opacity: 0.8;
}
</style>
