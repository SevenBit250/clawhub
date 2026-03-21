import { useLocalStorage, useDark, useToggle } from "@vueuse/core";
import { theme } from "ant-design-vue";

type ThemeMode = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

export function useTheme() {
  const preference = useLocalStorage<ThemeMode>("theme-preference", "system");
  const isDark = useDark({
    storageKey: "theme-preference",
  });

  const systemPreference = ref<EffectiveTheme>("light");

  const effectiveTheme = computed<EffectiveTheme>(() => {
    if (preference.value === "system") {
      return systemPreference.value;
    }
    return preference.value;
  });

  const antdTheme = computed(() => ({
    algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#3b82f6",
      borderRadius: 8,
    },
  }));

  function detectSystemPreference(): EffectiveTheme {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function updateSystemPreference() {
    systemPreference.value = detectSystemPreference();
  }

  function setTheme(mode: ThemeMode) {
    preference.value = mode;
    if (mode === "dark") {
      isDark.value = true;
    } else if (mode === "light") {
      isDark.value = false;
    }
  }

  function toggleTheme() {
    if (preference.value === "light") {
      setTheme("dark");
    } else if (preference.value === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  }

  function initTheme() {
    if (typeof window === "undefined") return;

    systemPreference.value = detectSystemPreference();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateSystemPreference);

    if (preference.value === "system") {
      isDark.value = systemPreference.value === "dark";
      document.documentElement.setAttribute("data-theme", systemPreference.value);
    } else if (preference.value === "dark") {
      isDark.value = true;
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      isDark.value = false;
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  watch(
    effectiveTheme,
    (themeValue) => {
      if (typeof window === "undefined") return;
      document.documentElement.setAttribute("data-theme", themeValue);
    },
    { immediate: true }
  );

  return {
    preference,
    effectiveTheme,
    isDark,
    antdTheme,
    setTheme,
    toggleTheme,
    initTheme,
  };
}
