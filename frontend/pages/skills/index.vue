<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">Skills</h1>

    <div class="flex gap-4 mb-8">
      <select v-model="sortBy" class="border rounded-lg px-4 py-2">
        <option value="updated">Recently Updated</option>
        <option value="downloads">Most Downloads</option>
        <option value="stars">Most Stars</option>
        <option value="installs">Most Installs</option>
      </select>
    </div>

    <div v-if="pending" class="text-center py-20">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500 py-20">
      Failed to load skills
    </div>
    <div v-else class="grid grid-cols-3 gap-6">
      <div
        v-for="skill in skills"
        :key="skill.id"
        class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
      >
        <NuxtLink :to="`/skills/${skill.slug}`">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-xl font-semibold">{{ skill.displayName }}</h3>
            <span v-if="skill.badges?.highlighted" class="text-yellow-500">⭐</span>
          </div>
          <p class="text-gray-600 mb-4 line-clamp-2">{{ skill.summary || 'No description' }}</p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>by {{ skill.owner?.handle || skill.owner?.displayName || 'Unknown' }}</span>
            <div class="flex gap-3">
              <span>⭐ {{ skill.statsStars || 0 }}</span>
              <span>⬇️ {{ skill.statsDownloads || 0 }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div v-if="!skills.length && !pending" class="text-center py-20 text-gray-500">
      No skills found
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()
const route = useRoute()

const sortBy = ref((route.query.sort as string) || 'updated')

const { data, pending, error } = await useAsyncData(
  () => `skills-${sortBy.value}`,
  () => api.get<Array<{
    id: string
    slug: string
    displayName: string
    summary: string | null
    statsStars: number
    statsDownloads: number
    badges: Record<string, unknown> | null
    owner: { handle: string | null; displayName: string | null } | null
  }>>(`/skills?limit=20&sort=${sortBy.value}`)
)

const skills = computed(() => data.value || [])
</script>
