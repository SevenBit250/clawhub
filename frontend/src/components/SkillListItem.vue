<template>
  <router-link
    :to="`/skills/${skill.slug}`"
    class="skill-item"
  >
    <div class="item-inner">
      <!-- Left: title + meta -->
      <div class="item-left">
        <div class="item-title-row">
          <h3 class="item-title">{{ skill.displayName }}</h3>
          <span class="item-slug">/ {{ skill.slug }}</span>
          <a-tag v-if="skill.badges?.highlighted" class="badge-highlighted">
            <StarFilled /> {{ t('skills.badge.highlighted') }}
          </a-tag>
        </div>
        <p class="item-desc">
          {{ skill.summary || t('skills.no_description') }}
        </p>
        <div class="item-meta">
          <UserOutlined />
          <span>{{ skill.owner?.displayName || skill.owner?.handle || t('skills.unknown_author') }}</span>
        </div>
      </div>

      <!-- Right: stats -->
      <div class="item-right">
        <SkillStats :stats="skill.stats" />
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { UserOutlined, StarFilled } from "@ant-design/icons-vue";
import SkillStats from "./SkillStats.vue";

defineProps<{
  skill: {
    slug: string;
    displayName: string;
    summary: string | null;
    stats: { downloads: number; stars: number; installs: number };
    badges: Record<string, unknown> | null;
    owner: { handle: string | null; displayName: string | null } | null;
  };
}>();

const { t } = useI18n();
</script>

<style scoped>
/* ─── Item Shell ─── */
.skill-item {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.04),
    0 1px 3px rgba(43, 127, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    border-color 0.3s ease;
  cursor: pointer;
}

.skill-item:hover {
  transform: translateY(-2px) scale(1.005);
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(43, 127, 255, 0.2);
  box-shadow:
    0 8px 20px rgba(43, 127, 255, 0.1),
    0 3px 8px rgba(43, 127, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.skill-item:active {
  transform: translateY(0) scale(0.998);
  box-shadow:
    0 4px 12px rgba(43, 127, 255, 0.08),
    0 2px 4px rgba(43, 127, 255, 0.04);
}

/* ─── Inner Layout ─── */
.item-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  gap: 1.5rem;
}

.item-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.item-right {
  flex-shrink: 0;
}

/* ─── Title Row ─── */
.item-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.item-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #27272a;
  margin: 0;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.item-slug {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #c4c4cc;
  font-weight: 400;
  flex-shrink: 0;
}

/* ─── Highlighted Badge ─── */
.badge-highlighted {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.5rem;
  border-radius: 99999px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid rgba(251, 191, 36, 0.3);
  flex-shrink: 0;
}

/* ─── Description ─── */
.item-desc {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* ─── Meta ─── */
.item-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #9ca3af;
}

.item-meta .anticon {
  font-size: 0.875rem;
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .skill-item {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .skill-item:hover {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.35);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.3),
    0 3px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .item-title {
  color: #f1f5f9;
}

[data-theme="dark"] .item-slug {
  color: #475569;
}

[data-theme="dark"] .item-desc {
  color: #94a3b8;
}

[data-theme="dark"] .item-meta {
  color: #64748b;
}

[data-theme="dark"] .badge-highlighted {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fef3c7;
  border-color: rgba(251, 191, 36, 0.2);
}
</style>
