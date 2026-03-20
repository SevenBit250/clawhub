<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">Dashboard</h1>

    <div v-if="!isAuthenticated && loaded" class="text-center py-20">
      <p class="text-gray-600 mb-4">Please login to view your dashboard</p>
      <button @click="handleLogin" class="btn btn-primary">Login</button>
    </div>
    <div v-else-if="!loaded" class="text-center py-20">Loading...</div>
    <div v-else>
      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">My Skills</h3>
          <p class="text-3xl font-bold">{{ mySkills?.length || 0 }}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">My Souls</h3>
          <p class="text-3xl font-bold">{{ mySouls?.length || 0 }}</p>
        </div>
        <div class="border rounded-lg p-6">
          <h3 class="text-gray-600 mb-2">Stars Received</h3>
          <p class="text-3xl font-bold">{{ totalStars || 0 }}</p>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">My Skills</h2>
          <NuxtLink to="/skills/create" class="btn btn-primary">
            Create Skill
          </NuxtLink>
        </div>

        <div v-if="!mySkills?.length" class="text-center py-10 border rounded-lg">
          <p class="text-gray-500">You haven't created any skills yet</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="s in mySkills"
            :key="s.id"
            class="border rounded-lg p-4 flex items-center justify-between"
          >
            <NuxtLink :to="`/skills/${s.slug}`" class="flex-1">
              <h3 class="font-medium">{{ s.displayName }}</h3>
              <p class="text-sm text-gray-500">{{ s.slug }}</p>
            </NuxtLink>
            <NuxtLink :to="`/skills/${s.slug}/edit`" class="btn btn-secondary">
              Edit
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, token, loaded, getAuthUrl } = useAuth()
const api = useApi()

const { data: mySkills } = await useAsyncData(
  'my-skills',
  () => token.value
    ? api.get<Array<{ id: string; slug: string; displayName: string; summary: string | null }>>('/users/me/skills', { token: token.value })
    : Promise.resolve([]),
  { watch: [token] }
)

const { data: mySouls } = await useAsyncData(
  'my-souls',
  () => token.value
    ? api.get<Array<{ id: string; slug: string; displayName: string }>>('/users/me/souls', { token: token.value })
    : Promise.resolve([]),
  { watch: [token] }
)

const totalStars = computed(() =>
  (mySkills.value || []).reduce((sum: number, s: any) => sum + (s.statsStars || 0), 0)
)

async function handleLogin() {
  const url = await getAuthUrl()
  window.location.href = url
}
</script>
