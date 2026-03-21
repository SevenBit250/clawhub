<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ $t('home.hero.title') }}</h1>
        <p class="hero-subtitle">{{ $t('home.hero.subtitle') }}</p>
        <div class="hero-actions">
          <router-link to="/skills" class="btn-primary">
            {{ $t('home.hero.browse') }}
            <span class="btn-arrow">→</span>
          </router-link>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="deco-ring ring-1"></div>
        <div class="deco-ring ring-2"></div>
        <div class="deco-ring ring-3"></div>
      </div>
    </section>

    <!-- Featured Section -->
    <section class="featured">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ $t('home.featured.title') }}</h2>
          <router-link to="/skills" class="section-link">
            {{ $t('home.featured.view_all') || 'View all' }}
            <span>→</span>
          </router-link>
        </div>

        <a-spin v-if="pending" class="flex justify-center py-20" />
        <a-result
          v-else-if="error"
          status="error"
          :title="$t('home.skills.failed')"
          class="py-20"
        />
        <div v-else class="skills-grid">
          <router-link
            v-for="skill in skills"
            :key="skill.id"
            :to="`/skills/${skill.slug}`"
            class="skill-card"
          >
            <div class="skill-icon">
              <FileTextOutlined />
            </div>
            <div class="skill-info">
              <h3 class="skill-name">{{ skill.displayName }}</h3>
              <p class="skill-desc line-clamp-2">
                {{ skill.summary || $t('home.skills.no_description') }}
              </p>
            </div>
            <div class="skill-stats">
              <span class="stat">
                <StarFilled style="color: #faad14" />
                {{ skill.statsStars || 0 }}
              </span>
              <span class="stat">
                <DownloadOutlined />
                {{ skill.statsDownloads || 0 }}
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { StarFilled, DownloadOutlined, FileTextOutlined } from "@ant-design/icons-vue";

const api = useApi();

const data = ref<Array<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  statsStars: number;
  statsDownloads: number;
}> | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    data.value = await api.get("/skills?limit=6&sort=downloads");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skills";
  } finally {
    pending.value = false;
  }
});

const skills = computed(() => data.value || []);
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* Hero Section */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 6rem 2rem;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 640px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-foreground);
  margin: 0 0 1rem;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin: 0 0 2.5rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--color-foreground);
  color: var(--color-background);
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.btn-arrow {
  transition: transform 0.2s;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

/* Hero Decoration */
.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.deco-ring {
  position: absolute;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  opacity: 0.5;
}

.ring-1 {
  width: 400px;
  height: 400px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-2 {
  width: 600px;
  height: 600px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-3 {
  width: 800px;
  height: 800px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

[data-theme="dark"] .deco-ring {
  opacity: 0.15;
}

/* Featured Section */
.featured {
  padding: 4rem 0 6rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.section-link:hover {
  color: var(--color-primary);
}

/* Skills Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .skills-grid {
    grid-template-columns: 1fr;
  }
}

.skill-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.2s;
}

.skill-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.skill-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-hover);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.skill-info {
  flex: 1;
  margin-bottom: 1rem;
}

.skill-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 0.5rem;
}

.skill-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.skill-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero {
    min-height: 50vh;
    padding: 4rem 1.5rem;
  }
}
</style>
