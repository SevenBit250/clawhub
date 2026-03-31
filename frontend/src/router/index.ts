import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/pages/index.vue"),
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: () => import("@/pages/auth/callback.vue"),
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
  {
    path: "/demands",
    name: "demands",
    component: () => import("@/pages/demands/index.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/layouts/admin.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: () => import("@/pages/admin/index.vue"),
      },
      {
        path: "skills",
        name: "admin-skills",
        component: () => import("@/pages/admin/skills/index.vue"),
      },
      {
        path: "skills/:slug",
        name: "admin-skill-detail",
        component: () => import("@/pages/admin/skills/[slug].vue"),
      },
      {
        path: "users",
        name: "admin-users",
        component: () => import("@/pages/admin/users/index.vue"),
      },
      {
        path: "users/:id",
        name: "admin-user-detail",
        component: () => import("@/pages/admin/users/[id].vue"),
      },
    ],
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
