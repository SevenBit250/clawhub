<template>
  <div class="container py-8">
    <div v-if="pending" class="text-center py-20">Loading...</div>
    <div v-else-if="error || !skill" class="text-center py-20">
      Skill not found
    </div>
    <div v-else>
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-4xl font-bold mb-2">{{ skill.displayName }}</h1>
          <p class="text-gray-600">by {{ skill.owner?.handle || skill.owner?.displayName || 'Unknown' }}</p>
        </div>
        <div class="flex gap-4">
          <button @click="toggleStar" class="btn btn-secondary">
            {{ isStarred ? '⭐ Starred' : '☆ Star' }}
          </button>
          <button class="btn btn-primary">Install</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-8">
        <div class="col-span-2">
          <div class="border rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Description</h2>
            <p class="text-gray-700">{{ skill.summary || 'No description available' }}</p>
          </div>

          <div v-if="version" class="border rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Version {{ version.version }}</h2>
              <span class="text-gray-500">{{ new Date(version.createdAt).toLocaleDateString() }}</span>
            </div>
            <div>
              <p>{{ version.changelog }}</p>
            </div>

            <div v-if="version.files?.length" class="mt-6">
              <h3 class="font-semibold mb-2">Files</h3>
              <ul class="space-y-2">
                <li v-for="file in version.files" :key="file.path" class="flex items-center gap-2">
                  <span class="text-gray-600">{{ file.path }}</span>
                  <span class="text-sm text-gray-400">({{ formatSize(file.size) }})</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div class="border rounded-lg p-6 sticky top-4">
            <h3 class="font-semibold mb-4">Stats</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Downloads</span>
                <span class="font-medium">{{ skill.statsDownloads || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Stars</span>
                <span class="font-medium">{{ skill.statsStars || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Installs</span>
                <span class="font-medium">{{ skill.statsInstallsCurrent || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()
const { isAuthenticated } = useAuth()
const route = useRoute()
const slug = route.params.slug as string

const { data, pending, error } = await useAsyncData(
  `skill-${slug}`,
  () => api.get<{
    skill: {
      id: string
      slug: string
      displayName: string
      summary: string | null
      statsDownloads: number
      statsStars: number
      statsInstallsCurrent: number
      badges: Record<string, unknown> | null
      owner: { handle: string | null; displayName: string | null } | null
    }
    version: {
      version: string
      changelog: string
      createdAt: string
      files: Array<{ path: string; size: number }>
    } | null
  }>(`/skills/${slug}`)
)

const skill = computed(() => data.value?.skill)
const version = computed(() => data.value?.version)
const isStarred = ref(false)

function toggleStar() {
  if (!isAuthenticated.value) {
    alert('Please login first')
    return
  }
  isStarred.value = !isStarred.value
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
