<template>
  <div class="motion-background">
    <div class="bg-gradient"></div>
    <div class="rings" aria-hidden="true">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="ring ring-3" v-if="showThirdRing"></div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showThirdRing?: boolean;
}>();
</script>

<style scoped>
.motion-background {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ─── Background Gradient ─── */
.bg-gradient {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    154deg,
    #eef6ff 0%,
    rgba(238, 242, 255, 0.3) 50%,
    #faf5ff 100%
  );
  pointer-events: none;
}

/* ─── Decorative Rings ─── */
.rings {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.ring {
  position: absolute;
  border-radius: 99999px;
  border: 1.5px solid rgba(190, 219, 255, 0.5);
}

.ring-1 {
  width: 350px;
  height: 350px;
  left: -8%;
  top: 5%;
  animation: ring-float 12s ease-in-out infinite;
}

.ring-2 {
  width: 500px;
  height: 500px;
  right: -10%;
  top: 15%;
  animation: ring-float 12s ease-in-out infinite 2s;
}

.ring-3 {
  width: 700px;
  height: 700px;
  left: -5%;
  bottom: -10%;
  animation: ring-float 12s ease-in-out infinite 4s;
}

@keyframes ring-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .bg-gradient {
  background: linear-gradient(
    154deg,
    #0f1729 0%,
    rgba(15, 15, 45, 0.6) 50%,
    #1a0f2e 100%
  );
}

[data-theme="dark"] .ring {
  border-color: rgba(43, 127, 255, 0.12);
}
</style>
