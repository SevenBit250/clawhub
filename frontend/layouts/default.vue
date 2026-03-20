<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b">
      <nav class="container py-4 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="text-xl font-bold">ClawHub</NuxtLink>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-64 border rounded-full px-4 py-1.5 pl-9 text-sm"
              @keyup.enter="handleSearch"
            />
            <svg
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              @click="handleSearch"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/skills" class="hover:text-blue-500">Skills</NuxtLink>
          <NuxtLink to="/souls" class="hover:text-blue-500">Souls</NuxtLink>
          <template v-if="isAuthenticated">
            <NuxtLink to="/dashboard" class="hover:text-blue-500">Dashboard</NuxtLink>
            <button @click="handleLogout" class="btn btn-secondary">Logout</button>
          </template>
          <template v-else>
            <button @click="handleLogin" class="btn btn-primary">Login</button>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t py-8 mt-16">
      <div class="container text-center text-gray-500">
        ClawHub - Skill Marketplace
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const searchQuery = ref('')

function handleLogin() {
  router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
}

async function handleLogout() {
  await logout()
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
  }
}
</script>
