<template>
  <span class="demand-badge" :class="`badge-${type}`">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  type: "priority" | "budget" | "status";
  label: string;
}>();
</script>

<style scoped>
.demand-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Priority badge - orange tint */
.badge-priority {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid rgba(251, 191, 36, 0.3);
  box-shadow: 0 1px 3px rgba(251, 191, 36, 0.2);
}

/* Budget badge - blue tint */
.badge-budget {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.15);
}

/* Status badge - soft gray */
.badge-status {
  background: rgba(255, 255, 255, 0.6);
  color: #525257;
  border: 1px solid rgba(228, 228, 231, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .badge-priority {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fef3c7;
  border-color: rgba(251, 191, 36, 0.2);
}

[data-theme="dark"] .badge-budget {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.4) 0%, rgba(29, 78, 216, 0.3) 100%);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.2);
}

[data-theme="dark"] .badge-status {
  background: rgba(30, 35, 60, 0.5);
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.12);
}
</style>
