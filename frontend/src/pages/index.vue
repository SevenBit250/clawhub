<template>
  <MotionBackground>
    <section class="hero">
      <!-- Hero Content -->
      <div class="hero-content">
        <!-- Title -->
        <h1 class="hero-title" :class="{ 'title-in': mounted }">
          {{ $t('home.hero.title') }}
        </h1>

        <!-- Subtitle -->
        <p class="hero-subtitle" :class="{ 'subtitle-in': mounted }">
          {{ $t('home.hero.subtitle') }}
        </p>

        <!-- Search pill (glassmorphism) -->
        <div class="search-pill-wrap" :class="{ 'search-in': mounted }">
          <div class="search-pill" :class="{ 'focused': searchFocused }">
            <SearchOutlined class="search-icon" :class="{ 'icon-active': searchFocused }" />
            <a-input
              v-model:value="searchQuery"
              :placeholder="$t('nav.search_placeholder')"
              class="hero-search"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
              @keyup.enter="handleSearch(searchQuery)"
            />
          </div>
        </div>

        <!-- CTA pill button (gradient) -->
        <!-- <div class="cta-wrap" :class="{ 'cta-in': mounted }">
          <router-link to="/skills" class="cta-btn">
            {{ $t('home.hero.browse') }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div> -->
      </div>
    </section>
  </MotionBackground>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { SearchOutlined } from "@ant-design/icons-vue";
import MotionBackground from "@/components/MotionBackground.vue";

const api = useApi();
const router = useRouter();
const searchQuery = ref("");
const mounted = ref(false);
const searchFocused = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

function handleSearch(value: string) {
  if (value.trim()) {
    router.push(`/skills?q=${encodeURIComponent(value.trim())}`);
  }
}
</script>

<style scoped>
.home-page {
  height: 100%;
}

/* ─── Hero ─── */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  overflow: hidden;
  padding: 2rem 1.5rem;
}

/* ─── Hero Content ─── */
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 720px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ─── Entrance Animations ─── */
.hero-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #27272a;
  margin: 0 0 1.25rem;
  opacity: 0;
  transform: translateY(24px) scale(0.96);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.title-in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.hero-subtitle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 400;
  line-height: 1.5;
  color: #52525c;
  margin: 0 0 2.5rem;
  opacity: 0;
  transform: translateY(20px) scale(0.96);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.subtitle-in {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 0.1s;
}

/* ─── Search Pill (Glassmorphism) ─── */
.search-pill-wrap {
  width: 100%;
  max-width: 672px;
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-in {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 0.18s;
}

.search-pill {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 24px;
  height: 64px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(237, 237, 237, 0.8);
  border-radius: 99999px;
  box-shadow:
    0 10px 15px -3px rgba(43, 127, 255, 0.1),
    0 4px 6px -4px rgba(43, 127, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  gap: 0.75rem;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-pill:hover {
  transform: translateY(-2px);
}

.search-pill.focused {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(43, 127, 255, 0.4);
  box-shadow:
    0 10px 15px -3px rgba(43, 127, 255, 0.15),
    0 4px 6px -4px rgba(43, 127, 255, 0.12);
  transform: translateY(-2px);
}

.search-icon {
  font-size: 1.25rem;
  color: #9f9fa9;
  flex-shrink: 0;
  transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-icon.icon-active {
  color: #2b7fff;
  transform: scale(1.1);
}

.hero-search {
  flex: 1;
}

:deep(.ant-input) {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  background: transparent;
  border: none;
  outline: none;
  border-radius: 0;
  box-shadow: none;
  color: #525257;
  padding: 0;
  line-height: 1;
  caret-color: #9f9fa9;
}

:deep(.ant-input)::placeholder {
  color: #9f9fa9;
}

/* 抑制 Ant Design 默认聚焦边框/阴影，由外层 search-pill 统一处理 */
:deep(.ant-input-affix-wrapper) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.ant-input-affix-wrapper):focus-within {
  background: rgba(255, 255, 255, 0.8) !important;
}

/* ─── CTA Pill Button (Gradient) ─── */
.cta-wrap {
  margin-top: 2rem;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-in {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.32s;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  color: #fff;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  line-height: 1;
  box-shadow:
    0 20px 25px -5px rgba(43, 127, 255, 0.3),
    0 8px 10px -6px rgba(43, 127, 255, 0.3);
  transition:
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    color 0.2s ease;
}

.cta-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 24px 30px -5px rgba(43, 127, 255, 0.35),
    0 10px 14px -6px rgba(43, 127, 255, 0.3);
  color: #fff;
}

.cta-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 10px 15px -3px rgba(43, 127, 255, 0.25),
    0 4px 6px -4px rgba(43, 127, 255, 0.2);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .hero-title {
  color: #f1f5f9;
}

[data-theme="dark"] .hero-subtitle {
  color: #94a3b8;
}

[data-theme="dark"] .search-pill {
  background: rgba(30, 35, 60, 0.6);
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .search-pill.focused {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(43, 127, 255, 0.5);
}

[data-theme="dark"] :deep(.ant-input) {
  color: #f1f5f9;
  caret-color: #64748b;
}

[data-theme="dark"] :deep(.ant-input)::placeholder {
  color: #64748b;
}

[data-theme="dark"] :deep(.ant-input-affix-wrapper) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

[data-theme="dark"] :deep(.ant-input-affix-wrapper):focus-within {
  background: rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .search-icon {
  color: #64748b;
}

[data-theme="dark"] .cta-btn {
  box-shadow:
    0 20px 25px -5px rgba(43, 127, 255, 0.4),
    0 8px 10px -6px rgba(43, 127, 255, 0.35);
}

[data-theme="dark"] .cta-btn:hover {
  box-shadow:
    0 24px 30px -5px rgba(43, 127, 255, 0.5),
    0 10px 14px -6px rgba(43, 127, 255, 0.4);
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .hero {
    min-height: calc(100vh - 100px);
    padding: 1.5rem 1rem;
  }

  .search-pill {
    height: 56px;
    padding: 0 20px;
  }

  .cta-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }

  .rings .ring-3 {
    display: none;
  }
}
</style>
