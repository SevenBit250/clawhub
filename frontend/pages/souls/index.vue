<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">Souls</h1>

    <div v-if="pending" class="text-center py-20">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500 py-20">
      Failed to load souls
    </div>
    <div v-else class="grid grid-cols-3 gap-6">
      <div
        v-for="soul in souls"
        :key="soul.id"
        class="border rounded-lg p-6 hover:shadow-lg transition-shadow"
      >
        <NuxtLink :to="`/souls/${soul.slug}`">
          <h3 class="text-xl font-semibold mb-2">{{ soul.displayName }}</h3>
          <p class="text-gray-600 mb-4 line-clamp-2">{{ soul.summary || 'No description' }}</p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>by {{ soul.owner?.handle || soul.owner?.displayName || 'Unknown' }}</span>
            <span>⭐ {{ soul.statsStars || 0 }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div v-if="!souls.length && !pending" class="text-center py-20 text-gray-500">
      No souls found
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi()

const { data, pending, error } = await useAsyncData('souls', () =>
  api.get<Array<{
    id: string
    slug: string
    displayName: string
    summary: string | null
    statsStars: number
    owner: { handle: string | null; displayName: string | null } | null
  }>>('/souls?limit=20')
)

const souls = computed(() => data.value || [])
</script>
