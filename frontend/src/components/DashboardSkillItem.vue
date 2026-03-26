<template>
  <router-link
    :to="skill.moderationStatus === 'removed' ? `/skills/${skill.slug}/edit` : `/skills/${skill.slug}`"
    class="skill-item"
    :class="{ 'skill-item--disabled': skill.moderationStatus === 'pending' }"
  >
    <div class="item-inner">
      <div class="item-left">
        <div class="item-title-row">
          <h3 class="item-title">{{ skill.displayName }}</h3>
          <span class="item-slug">/ {{ skill.slug }}</span>
          <span v-if="skill.moderationStatus === 'pending'" class="item-badge item-badge--pending">
            {{ t('dashboard.pending_review') }}
          </span>
          <span v-if="skill.moderationStatus === 'removed'" class="item-badge item-badge--rejected">
            {{ t('dashboard.rejected') }}
          </span>
        </div>
        <p v-if="skill.moderationStatus === 'pending'" class="item-hint item-hint--warning">
          {{ t('dashboard.pending_hint') }}
        </p>
        <p v-if="skill.moderationStatus === 'removed'" class="item-hint item-hint--error">
          {{ t('dashboard.rejected_hint') }}
        </p>
      </div>
      <div class="item-right">
        <SkillStats :stats="skill.stats || { downloads: 0, stars: 0, installs: 0 }" />
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import SkillStats from "./SkillStats.vue";

defineProps<{
  skill: {
    slug: string;
    displayName: string;
    summary: string | null;
    moderationStatus?: string;
    stats?: { downloads: number; stars: number; installs: number };
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
}

.skill-item:hover {
  transform: translateY(-2px) scale(1.005);
  background: rgba(255, 255, 255, 0.75);
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

.skill-item--disabled {
  opacity: 0.7;
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

/* ─── Status Badges ─── */
.item-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 99999px;
  font-size: 0.6875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.item-badge--pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.item-badge--rejected {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #b91c1c;
}

/* ─── Status Hints ─── */
.item-hint {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  margin: 0;
}

.item-hint--warning {
  color: #d97706;
}

.item-hint--error {
  color: #dc2626;
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

[data-theme="dark"] .item-badge--pending {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fef3c7;
}

[data-theme="dark"] .item-badge--rejected {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: #fecaca;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .item-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-right {
    width: 100%;
  }
}
</style>
