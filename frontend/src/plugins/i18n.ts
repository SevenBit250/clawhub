import { createI18n } from "vue-i18n";
import en from "../../locales/en.json";
import zh from "../../locales/zh.json";

function getInitialLocale(): string {
  // Check cookie first (server-side style)
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/locale=([^;]+)/);
    if (match) return match[1];
  }
  // Client-side: check localStorage
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("locale-preference");
    if (saved === "en" || saved === "zh") return saved;
  }
  return "en";
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages: {
    en,
    zh,
  },
});

export default i18n;
