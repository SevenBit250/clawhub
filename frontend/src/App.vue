<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <!-- Use default layout for non-admin routes -->
      <AppLayout v-if="!isAdminRoute">
        <router-view />
      </AppLayout>
      <!-- Admin routes use their own layout -->
      <router-view v-else />
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/layouts/default.vue";

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));

const { fetchSession } = useAuth();
const { effectiveTheme, antdTheme, initTheme } = useTheme();

onMounted(async () => {
  initTheme();
  await fetchSession();
});
</script>
