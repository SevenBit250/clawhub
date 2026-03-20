<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchSession } = useAuth()

onMounted(async () => {
  await fetchSession()
})
</script>
