<template>
  <div>
    <section class="bg-blue-500 text-white py-20">
      <div class="container text-center">
        <h1 class="text-5xl font-bold mb-4">Welcome to ClawHub</h1>
        <p class="text-xl mb-8">Discover and share amazing skills</p>
        <NuxtLink to="/skills" class="btn bg-white text-blue-600">Browse Skills</NuxtLink>
      </div>
    </section>

    <section class="container py-16">
      <h2 class="text-3xl font-bold mb-8 text-center">Featured Skills</h2>
      <div v-if="pending" class="text-center py-20">Loading...</div>
      <div v-else-if="error" class="text-center text-red-500 py-20">Failed to load skills</div>
      <div v-else class="grid grid-cols-3 gap-6">
        <div
          v-for="skill in skills"
          :key="skill.id"
          class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <NuxtLink :to="`/skills/${skill.slug}`">
            <h3 class="text-xl font-semibold mb-2">{{ skill.displayName }}</h3>
            <p class="text-gray-600 mb-4">{{ skill.summary || 'No description' }}</p>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>⭐ {{ skill.statsStars || 0 }}</span>
              <span>⬇️ {{ skill.statsDownloads || 0 }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const api = useApi()

const { data, pending, error } = await useAsyncData('featured-skills', () =>
  api.get<Array<{
    id: string
    slug: string
    displayName: string
    summary: string | null
    statsStars: number
    statsDownloads: number
  }>>('/skills?limit=6&sort=downloads')
)

const skills = computed(() => data.value || [])
</script>
