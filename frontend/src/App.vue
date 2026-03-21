<template>
  <a-config-provider :theme="antdTheme">
    <div class="min-h-screen flex flex-col" :data-theme="effectiveTheme">
      <AppLayout>
        <router-view />
      </AppLayout>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppLayout from "@/layouts/default.vue";

const { fetchSession } = useAuth();
const { effectiveTheme, antdTheme, initTheme } = useTheme();

onMounted(async () => {
  initTheme();
  await fetchSession();
});
</script>
