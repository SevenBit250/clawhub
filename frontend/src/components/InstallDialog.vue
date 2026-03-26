<template>
  <a-modal
    :open="open"
    :title="$t('skill.install_dialog.title')"
    :footer="null"
    @cancel="handleClose"
    width="580px"
    centered
    class="install-dialog-modal"
  >
    <div class="install-dialog-content">
      <!-- Method 1: CLI Install -->
      <div class="install-method">
        <div class="method-header">
          <div class="method-icon">
            <ConsoleSqlOutlined />
          </div>
          <div class="method-info">
            <h3 class="method-title">
              <span class="method-badge">{{ $t('skill.install_dialog.method1') }}</span>
              {{ $t('skill.install_dialog.install_command') }}
            </h3>
            <p class="method-desc">{{ $t('skill.install_dialog.cli_hint') }}</p>
          </div>
        </div>
        <div class="command-block">
          <div class="command-header">
            <span class="command-label">Terminal</span>
            <button class="copy-btn" @click="copyToClipboard(installCommand)" :class="{ 'copied': copied }">
              <CheckOutlined v-if="copied" />
              <CopyOutlined v-else />
              <span>{{ copied ? $t('skill.install_dialog.copied') : $t('skill.install_dialog.copy') }}</span>
            </button>
          </div>
          <pre class="command-code"><code v-html="highlightedCommand"></code></pre>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider">
        <span>{{ $t('skill.install_dialog.or') }}</span>
      </div>

      <!-- Method 2: Download ZIP -->
      <div class="download-method">
        <div class="method-header">
          <div class="method-icon method-icon--download">
            <DownloadOutlined />
          </div>
          <div class="method-info">
            <h3 class="method-title">
              <span class="method-badge method-badge--secondary">{{ $t('skill.install_dialog.method2') }}</span>
              {{ $t('skill.install_dialog.download_zip') }}
            </h3>
            <p class="method-desc">{{ $t('skill.install_dialog.zip_hint') }}</p>
          </div>
        </div>
        <a-button type="primary" size="large" class="download-btn" @click="handleDownload">
          <DownloadOutlined />
          {{ $t('skill.install_dialog.download_zip') }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { CopyOutlined, CheckOutlined, DownloadOutlined, ConsoleSqlOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const props = defineProps<{
  open: boolean;
  slug: string;
  installCommand: string;
  downloadUrl: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const copied = ref(false);

// Syntax highlighting for shell commands
function highlightCommand(cmd: string): string {
  // Escape HTML first
  let escaped = cmd
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight commands (first word before space or at start)
  escaped = escaped.replace(/^(\s*)(export\s+)?(\S+)/gm, (match, leadingSpace, exp, cmd) => {
    return `${leadingSpace || ''}${exp || ''}<span class="hl-command">${cmd}</span>`;
  });

  // Highlight environment variables: export VAR=...
  escaped = escaped.replace(/(export\s+)(\w+)(=)/g, '$1<span class="hl-var">$2</span><span class="hl-operator">$3</span>');

  // Highlight quoted strings
  escaped = escaped.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="hl-string">"$1"</span>');
  escaped = escaped.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, "<span class='hl-string'>'$1'</span>");

  // Highlight special characters like &&, |, >
  escaped = escaped.replace(/(&&|\|\||\|)/g, '<span class="hl-operator">$1</span>');

  return escaped;
}

const highlightedCommand = computed(() => highlightCommand(props.installCommand));

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    message.success("Copied to clipboard!");
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    message.error("Failed to copy");
  }
}

function handleDownload() {
  window.open(props.downloadUrl, "_blank");
}

function handleClose() {
  emit("close");
}
</script>

<style scoped>
/* ─── Dialog Content ─── */
.install-dialog-content {
  padding: 0.5rem 0;
}

/* ─── Install Method ─── */
.install-method {
  margin-bottom: 0;
}

.method-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.method-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2b7fff;
  font-size: 1.25rem;
}

.method-icon--download {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #a855f7;
}

.method-info {
  flex: 1;
  min-width: 0;
}

.method-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #27272a;
  margin: 0 0 0.375rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.method-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 99999px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.method-badge--secondary {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
}

.method-desc {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* ─── Command Block ─── */
.command-block {
  background: #1e1e2e;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.1);
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.command-label {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Manrope', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
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

.command-code {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #cdd6f4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.command-code code {
  font-family: inherit;
}

/* Syntax highlighting */
:deep(.hl-command) {
  color: #89b4fa;
  font-weight: 600;
}

:deep(.hl-var) {
  color: #f9e2af;
  font-weight: 500;
}

:deep(.hl-string) {
  color: #a6e3a1;
}

:deep(.hl-operator) {
  color: #89dceb;
}

/* ─── Divider ─── */
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #9ca3af;
  font-family: 'Manrope', sans-serif;
  font-size: 0.8125rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent);
}

/* ─── Download Method ─── */
.download-method {
  text-align: center;
}

.download-method .method-header {
  justify-content: center;
}

.download-method .method-info {
  text-align: left;
}

.download-btn {
  height: 48px;
  padding: 0 2rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  border: none;
  box-shadow:
    0 8px 20px rgba(43, 127, 255, 0.3),
    0 4px 10px rgba(43, 127, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.download-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 12px 28px rgba(43, 127, 255, 0.4),
    0 6px 14px rgba(43, 127, 255, 0.25);
}

.download-btn:active {
  transform: translateY(0) scale(0.98);
}

.download-btn .anticon {
  margin-right: 0.5rem;
}

/* ─── Dark Theme ─── */
:deep(.install-dialog-modal .ant-modal-content) {
  border-radius: 24px;
  overflow: hidden;
}

:deep(.install-dialog-modal .ant-modal-header) {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: none;
}

:deep(.install-dialog-modal .ant-modal-title) {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #27272a;
}

:deep(.install-dialog-modal .ant-modal-body) {
  padding: 0 1.5rem 1.5rem;
}

:deep(.install-dialog-modal .ant-modal-close) {
  top: 1.25rem;
  right: 1.25rem;
}

[data-theme="dark"] .method-title {
  color: #f1f5f9;
}

[data-theme="dark"] .method-desc {
  color: #94a3b8;
}

[data-theme="dark"] .divider {
  color: #64748b;
}

[data-theme="dark"] .divider::before,
[data-theme="dark"] .divider::after {
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent);
}

[data-theme="dark"] :deep(.install-dialog-modal .ant-modal-title) {
  color: #f1f5f9;
}

[data-theme="dark"] .download-btn {
  box-shadow:
    0 8px 20px rgba(43, 127, 255, 0.4),
    0 4px 10px rgba(43, 127, 255, 0.3);
}

[data-theme="dark"] .download-btn:hover {
  box-shadow:
    0 12px 28px rgba(43, 127, 255, 0.5),
    0 6px 14px rgba(43, 127, 255, 0.35);
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .method-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .method-info {
    text-align: center;
  }

  .method-title {
    justify-content: center;
  }

  .download-method .method-info {
    text-align: center;
  }

  .command-code {
    font-size: 0.8125rem;
    padding: 0.875rem 1rem;
  }
}
</style>
