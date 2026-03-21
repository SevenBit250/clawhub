<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchSession } = useAuth();

onMounted(async () => {
  await fetchSession();
});

useHead({
  script: [
    {
      innerHTML: `
        (function() {
          try {
            // Theme
            var saved = localStorage.getItem('theme-preference');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var isDark = saved === 'dark' || (saved === 'system' && prefersDark) || (!saved && prefersDark);
            if (isDark) {
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.setAttribute('data-theme', 'light');
            }
            // Locale - pass to server via cookie
            var locale = localStorage.getItem('locale-preference');
            if (locale === 'zh') {
              document.cookie = 'locale=zh;path=/';
            }
          } catch (e) {}
        })()
      `,
      type: "text/javascript",
    },
  ],
});
</script>
