import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/pages/index.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/pages/login.vue"),
  },
  {
    path: "/search",
    name: "search",
    component: () => import("@/pages/search.vue"),
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/pages/dashboard.vue"),
  },
  {
    path: "/skills",
    name: "skills",
    component: () => import("@/pages/skills/index.vue"),
  },
  {
    path: "/skills/create",
    name: "skill-create",
    component: () => import("@/pages/skills/create.vue"),
  },
  {
    path: "/skills/:slug",
    name: "skill-detail",
    component: () => import("@/pages/skills/[slug].vue"),
  },
  {
    path: "/skills/:slug/edit",
    name: "skill-edit",
    component: () => import("@/pages/skills/edit.vue"),
  },
  {
    path: "/souls",
    name: "souls",
    component: () => import("@/pages/souls/index.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
