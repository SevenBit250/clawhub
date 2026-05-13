<template>
  <MotionBackground class="home-page-wrapper">
    <section class="hero">
      <!-- Hero Content -->
      <div class="hero-content">
        <!-- Title -->
        <h1 class="hero-title motion-up-24" :class="{ 'in': mounted }">
          {{ $t('home.hero.title') }}
        </h1>

        <!-- Subtitle -->
        <p class="hero-subtitle motion-up-20 motion-delay-2" :class="{ 'in': mounted }">
          <!-- {{ $t('home.hero.subtitle') }} -->
        </p>

        <!-- Usage Instructions (Terminal Style) -->
        <div class="command-box-wrap motion-up-16 motion-delay-3" :class="{ 'in': mounted }">
          <div class="command-header">
            <div class="header-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <span class="header-title">复制这段话到AI中来配置技能市场</span>
            <button class="copy-btn" @click="copyCommand" :class="{ 'copied': copied }">
              <CheckOutlined v-if="copied" />
              <CopyOutlined v-else />
              <span class="copy-text">{{ copied ? '已复制' : '点击复制' }}</span>
            </button>
          </div>
          <div class="command-content">
            <div class="command-line">
              <span class="command">{{ terminalContent }}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  </MotionBackground>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import MotionBackground from "@/components/MotionBackground.vue";

const mounted = ref(false);
const copied = ref(false);

// TODO: Add terminal content
const terminalContent = " \
使用 clawhub -V 命令检查一下clawhub工具是否安装了, 若未安装则使用 npm install clawhub@latest 命令安装它； \
安装完成后，使用 clawhub -V 命令检查安装是否成功； \
若安装失败，则告知用户，若成功则进行下一步；\
使用 export CLAWHUB_REGISTRY=https://skillhub.claws.keylights.tech:8443 && clawhub install kls-skill-manager 命令安装这个技能 \
安装完成后告知用户并说明使用方法。\
";

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(terminalContent);
    copied.value = true;
    message.success("Copied to clipboard!");
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    message.error("Failed to copy");
  }
}
</script>

<style scoped>
/* ─── Home Page Wrapper ─── */
.home-page-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* ─── Hero ─── */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
}

/* ─── Hero Content ─── */
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ─── Hero Title ─── */
.hero-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #27272a;
  margin: 0 0 1.25rem;
}

/* ─── Hero Subtitle ─── */
.hero-subtitle {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 400;
  line-height: 1.5;
  color: #52525c;
  margin: 0 0 2.5rem;
}

/* ─── Command Box (Terminal Style) ─── */
.command-box-wrap {
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #1e1e2e;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red {
  background: #ff5f56;
}

.dot-yellow {
  background: #ffbd2e;
}

.dot-green {
  background: #27c93f;
}

.header-title {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.copy-btn .anticon {
  font-size: 0.8125rem;
}

.copy-text {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
}

.command-content {
  background: #1e1e2e;
  border-radius: 0 0 12px 12px;
  padding: 1rem 1.25rem;
  overflow: hidden;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.command-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: 1.6rem;
}

.command-line--blank {
  min-height: 0.5rem;
}

.prompt {
  color: #22c55e;
  font-weight: 600;
  flex-shrink: 0;
}

.command {
  color: #cdd6f4;
  text-align: left;
}

/* ─── CTA Pill Button (Gradient) ─── */
.cta-wrap {
  margin-top: 0;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-in {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.32s;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  color: #fff;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  line-height: 1;
  box-shadow:
    0 20px 25px -5px rgba(43, 127, 255, 0.3),
    0 8px 10px -6px rgba(43, 127, 255, 0.3);
  transition:
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    color 0.2s ease;
}

.cta-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 24px 30px -5px rgba(43, 127, 255, 0.35),
    0 10px 14px -6px rgba(43, 127, 255, 0.3);
  color: #fff;
}

.cta-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 10px 15px -3px rgba(43, 127, 255, 0.25),
    0 4px 6px -4px rgba(43, 127, 255, 0.2);
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .hero-title {
  color: #f1f5f9;
}

[data-theme="dark"] .hero-subtitle {
  color: #94a3b8;
}

[data-theme="dark"] .command-header {
  background: #181825;
}

[data-theme="dark"] .command-content {
  background: #181825;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .cta-btn {
  box-shadow:
    0 20px 25px -5px rgba(43, 127, 255, 0.4),
    0 8px 10px -6px rgba(43, 127, 255, 0.35);
}

[data-theme="dark"] .cta-btn:hover {
  box-shadow:
    0 24px 30px -5px rgba(43, 127, 255, 0.5),
    0 10px 14px -6px rgba(43, 127, 255, 0.4);
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .hero {
    min-height: calc(100vh - 100px);
    padding: 1.5rem 1rem;
  }

  .cta-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }

  .command-content {
    padding: 0.875rem 1rem;
  }

  .command-line {
    font-size: 0.8125rem;
  }

  .rings .ring-3 {
    display: none;
  }
}
</style>
