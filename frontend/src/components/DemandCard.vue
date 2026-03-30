<template>
  <div class="demand-card">
    <div class="card-inner">
      <!-- Header: title + priority badge -->
      <div class="card-header">
        <h3 class="card-title">{{ demand.title || demand.name || `Demand #${index + 1}` }}</h3>
        <DemandBadge
          v-if="demand.priority"
          type="priority"
          :label="demand.priority"
        />
      </div>

      <!-- Description -->
      <p class="card-desc">
        {{ demand.description || demand.content || demand.summary || t("demands.no_description") }}
      </p>

      <!-- Footer: author + badges -->
      <div class="card-footer">
        <span v-if="demand.author || demand.owner" class="card-author">
          <UserOutlined class="author-icon" />
          {{ demand.author || demand.owner?.handle || demand.owner?.name || "" }}
        </span>
        <div class="card-tags">
          <DemandBadge v-if="demand.budget" type="budget" :label="demand.budget" />
          <DemandBadge v-if="demand.status" type="status" :label="demand.status" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserOutlined } from "@ant-design/icons-vue";
import DemandBadge from "./DemandBadge.vue";

defineProps<{
  demand: {
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    content?: string;
    summary?: string;
    author?: string;
    owner?: { handle?: string; name?: string };
    budget?: string;
    priority?: string;
    status?: string;
  };
  index: number;
}>();

const { t } = useI18n();
</script>

<style scoped>
/* ─── Card Shell ─── */
.demand-card {
  display: block;
  height: 100%;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 16px rgba(43, 127, 255, 0.06),
    0 2px 8px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease;
  cursor: default;
}

.demand-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(43, 127, 255, 0.25);
  box-shadow:
    0 12px 28px rgba(43, 127, 255, 0.12),
    0 4px 12px rgba(43, 127, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.demand-card:active {
  transform: translateY(-1px) scale(0.99);
  box-shadow:
    0 6px 16px rgba(43, 127, 255, 0.1),
    0 2px 6px rgba(43, 127, 255, 0.06);
}

/* ─── Card Inner ─── */
.card-inner {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ─── Header ─── */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
}

.card-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* ─── Description ─── */
.card-desc {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.25rem;
  line-height: 1.6;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* ─── Footer ─── */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.author-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .demand-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .demand-card:hover {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.35);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.35),
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .demand-card:active {
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .card-title {
  color: #f1f5f9;
}

[data-theme="dark"] .card-desc {
  color: #94a3b8;
}

[data-theme="dark"] .card-footer {
  border-top-color: rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .card-author {
  color: #64748b;
}
</style>
