<template>
  <MotionBackground>
    <div class="publish-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title motion-up-24" :class="{ 'in': mounted }">
            {{ $t("skill.update") }}
          </h1>
          <span v-if="skill?.slug" class="page-slug motion-up-24 motion-delay-1" :class="{ 'in': mounted }">
            {{ skill.slug }}
          </span>
        </div>

        <div v-if="loading" class="text-center py-20">{{ t('skill.loading') }}</div>
        <div v-else-if="error" class="text-center py-20 text-red-500">{{ error }}</div>
        <template v-else>
          <!-- Upload Area -->
          <div class="upload-section motion-up-16 motion-delay-1" :class="{ 'in': mounted }">
            <div
              class="glass-card upload-card"
              :class="{ 'upload-card-active': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="upload-icon">
                <FolderOpenOutlined />
              </div>
              <h3 class="upload-title">{{ $t("skill.publish.drop_folder") }}</h3>
              <p class="upload-info">
                {{ fileCount }} {{ $t("skill.publish.files") }} · {{ formatSize(totalSize) }}
              </p>
              <p class="upload-hint">{{ $t("skill.publish.hint") }}</p>
              <button class="upload-btn" @click="triggerUpload">
                {{ $t("skill.publish.choose_folder") }}
              </button>
              <input
                ref="fileInput"
                type="file"
                webkitdirectory
                multiple
                style="display: none"
                @change="handleFileSelect"
              />
              <p v-if="!hasFiles" class="upload-status">{{ $t("skill.publish.no_files") }}</p>
            </div>
          </div>

          <!-- Version & Changelog -->
          <div class="options-section">
            <div class="glass-card option-card motion-up-12 motion-delay-2" :class="{ 'in': mounted }">
              <h4 class="option-title">{{ $t("skill.publish.version") }}</h4>
              <a-input
                v-model:value="form.version"
                placeholder="1.0.0"
                size="large"
                class="glass-input"
              />
            </div>

            <div class="glass-card option-card motion-up-12 motion-delay-3" :class="{ 'in': mounted }">
              <h4 class="option-title">{{ $t("skill.publish.changelog") }}</h4>
              <a-textarea
                v-model:value="form.changelog"
                :placeholder="$t('skill.publish.changelog_placeholder')"
                :rows="3"
                class="glass-input"
              />
            </div>
          </div>

          <!-- Validation -->
          <div class="validation-section">
            <ul class="validation-list">
              <li :class="{ done: hasFiles }">
                <CheckCircleOutlined v-if="hasFiles" class="check-icon done" />
                <CiCircleOutlined v-else class="check-icon" />
                {{ $t("skill.publish.add_file") }}
              </li>
              <li :class="{ done: hasSkillMd }">
                <CheckCircleOutlined v-if="hasSkillMd" class="check-icon done" />
                <CiCircleOutlined v-else class="check-icon" />
                SKILL.md {{ $t("skill.publish.is_required") }}
              </li>
            </ul>
          </div>

          <!-- Submit -->
          <div class="submit-section motion-up-12 motion-delay-4" :class="{ 'in': mounted }">
            <button class="btn-cancel" @click="goBack">
              {{ $t("skill.publish.cancel") }}
            </button>
            <button class="btn-publish" :disabled="publishing" @click="handleResubmit">
              <span v-if="!publishing">{{ $t("skill.update") }}</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </MotionBackground>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FolderOpenOutlined, CheckCircleOutlined, CiCircleOutlined } from "@ant-design/icons-vue";
import MotionBackground from "@/components/MotionBackground.vue";

const route = useRoute();
const router = useRouter();
const { token } = useAuth();
const { t } = useI18n();
const api = useApi();

const slug = route.params.slug as string;

const skill = ref<{
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  tags: Record<string, string>;
  moderationStatus: string;
} | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const mounted = ref(false);
const isDragging = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true;
  });
});

const form = ref({
  displayName: "",
  version: "",
  tags: "",
  changelog: "",
});

const files = ref<FileList | null>(null);
const publishing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const fileCount = computed(() => files.value?.length || 0);
const hasFiles = computed(() => fileCount.value > 0);
const hasSkillMd = computed(() =>
  Array.from(files.value || []).some((f) => f.name === "SKILL.md")
);

const totalSize = computed(() => {
  if (!files.value) return 0;
  let total = 0;
  for (let i = 0; i < files.value.length; i++) {
    total += files.value[i].size;
  }
  return total;
});

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  files.value = target.files;
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  files.value = e.dataTransfer?.files || null;
}

onMounted(async () => {
  try {
    const data = await api.get<{
      skill: typeof skill.value;
      latestVersion: { version: string; changelog: string } | null;
    }>(`/api/v1/skills/${slug}`, { token: token.value });

    if (data.skill) {
      skill.value = data.skill;

      // Prefill version and changelog from latest version
      if (data.latestVersion) {
        form.value.version = data.latestVersion.version;
        form.value.changelog = data.latestVersion.changelog || "";
      } else {
        form.value.version = "1.0.0";
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load skill";
  } finally {
    loading.value = false;
  }
});

async function handleResubmit() {
  if (!files.value || files.value.length === 0) {
    message.error("Add at least one file");
    return;
  }
  const hasSkillMdFile = Array.from(files.value).some((f) => f.name === "SKILL.md");
  if (!hasSkillMdFile) {
    message.error("SKILL.md is required");
    return;
  }
  if (!token.value) {
    message.error("Please login first");
    return;
  }

  publishing.value = true;

  try {
    const payload = {
      displayName: skill.value?.displayName || "",
      version: form.value.version,
      changelog: form.value.changelog,
      tags: form.value.tags ? form.value.tags.split(",").map((t) => t.trim()) : [],
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    const fileArray = Array.from(files.value);
    const rawPaths = fileArray.map(f => (f as any).webkitRelativePath || f.name);

    // Strip common prefix directory (e.g., "skill-folder/" from all files)
    let prefixToStrip = "";
    if (rawPaths.length > 0) {
      const firstSlash = rawPaths[0].indexOf('/');
      if (firstSlash > 0) {
        const firstSegment = rawPaths[0].substring(0, firstSlash);
        if (rawPaths.every(p => p.startsWith(firstSegment + '/'))) {
          prefixToStrip = firstSegment + '/';
        }
      }
    }

    for (const file of fileArray) {
      const rawPath = (file as any).webkitRelativePath || file.name;
      const finalPath = prefixToStrip ? rawPath.substring(prefixToStrip.length) : rawPath;
      formData.append("files", file, finalPath);
    }

    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
    const response = await fetch(`${API_BASE}/api/v1/skills/${slug}/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Failed to update skill" }));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    message.success(t("skill.edit.success"));
    router.push(`/skills/${slug}`);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to update skill");
  } finally {
    publishing.value = false;
  }
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.publish-page {
  padding: 2rem 1.5rem 4rem;
}

.container {
  max-width: 1024px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #27272a;
  margin: 0;
}

.page-slug {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #9ca3af;
}

/* ─── Glass Card ─── */
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 16px rgba(43, 127, 255, 0.06),
    0 2px 6px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(43, 127, 255, 0.1),
    0 4px 10px rgba(43, 127, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* ─── Upload Section ─── */
.upload-section {
  display: flex;
  align-items: stretch;
  margin-bottom: 1.5rem;
}

.upload-card {
  width: 100%;
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.upload-card-active {
  border-color: rgba(43, 127, 255, 0.5);
  background: rgba(255, 255, 255, 0.75);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 3.5rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.upload-card:hover .upload-icon {
  transform: scale(1.1) rotate(5deg);
}

.upload-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #27272a;
  margin: 0 0 0.5rem;
}

.upload-info {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
}

.upload-hint {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0 0 1.25rem;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.5rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #3b82f6;
  border: 1.5px solid rgba(43, 127, 255, 0.3);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.upload-btn:hover {
  transform: translateY(-2px) scale(1.02);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(43, 127, 255, 0.5);
  box-shadow: 0 4px 12px rgba(43, 127, 255, 0.15);
}

.upload-btn:active {
  transform: translateY(0) scale(0.98);
}

.upload-status {
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 1rem 0 0;
}

/* ─── Options Section ─── */
.options-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.option-card {
  padding: 1.5rem;
}

.option-title {
  font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #27272a;
  margin: 0 0 1rem;
}

/* ─── Glass Input ─── */
.glass-input {
  --ant-button-bg: rgba(255, 255, 255, 0.8);
}

.glass-input :deep(.ant-input),
.glass-input :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  border-radius: 16px !important;
  box-shadow:
    0 2px 8px rgba(43, 127, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.glass-input :deep(.ant-input:focus),
.glass-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: rgba(43, 127, 255, 0.5) !important;
  box-shadow:
    0 0 0 3px rgba(43, 127, 255, 0.1),
    0 4px 12px rgba(43, 127, 255, 0.08) !important;
}

.glass-input :deep(.ant-input-textarea textarea) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0.75rem 1rem;
}

.glass-input :deep(.ant-input-textarea) {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  border-radius: 16px !important;
}

/* ─── Validation Section ─── */
.validation-section {
  margin-bottom: 2rem;
}

.validation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.validation-list li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.875rem;
  color: #9ca3af;
  transition: color 0.2s ease;
}

.validation-list li.done {
  color: #16a34a;
}

.check-icon {
  font-size: 1rem;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-icon.done {
  transform: scale(1.1);
}

/* ─── Submit Section ─── */
.submit-section {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  height: 48px;
  padding: 0 2rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(43, 127, 255, 0.3);
  transform: translateY(-2px);
}

.btn-publish {
  height: 48px;
  padding: 0 2.5rem;
  border-radius: 99999px;
  font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
  border: none;
  cursor: pointer;
  box-shadow:
    0 8px 16px rgba(43, 127, 255, 0.25),
    0 4px 8px rgba(43, 127, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-publish:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 12px 24px rgba(43, 127, 255, 0.35),
    0 6px 12px rgba(43, 127, 255, 0.2);
}

.btn-publish:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-publish:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Dark Theme ─── */
[data-theme="dark"] .page-title {
  color: #f1f5f9;
}

[data-theme="dark"] .page-slug {
  color: #64748b;
}

[data-theme="dark"] .glass-card {
  background: rgba(30, 35, 60, 0.5);
  border-color: rgba(99, 102, 241, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .glass-card:hover {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.25);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .upload-title {
  color: #f1f5f9;
}

[data-theme="dark"] .upload-info {
  color: #94a3b8;
}

[data-theme="dark"] .upload-hint,
[data-theme="dark"] .upload-status {
  color: #64748b;
}

[data-theme="dark"] .upload-btn {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(30, 35, 60, 0.6);
}

[data-theme="dark"] .upload-btn:hover {
  background: rgba(40, 45, 80, 0.7);
  border-color: rgba(96, 165, 250, 0.5);
}

[data-theme="dark"] .option-title {
  color: #f1f5f9;
}

[data-theme="dark"] .glass-input :deep(.ant-input),
[data-theme="dark"] .glass-input :deep(.ant-input-affix-wrapper) {
  background: rgba(30, 35, 60, 0.6) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
  color: #f1f5f9;
}

[data-theme="dark"] .glass-input :deep(.ant-input:focus),
[data-theme="dark"] .glass-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: rgba(43, 127, 255, 0.5) !important;
}

[data-theme="dark"] .glass-input :deep(.ant-input-textarea) {
  background: rgba(30, 35, 60, 0.6) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
}

[data-theme="dark"] .validation-list li {
  color: #64748b;
}

[data-theme="dark"] .validation-list li.done {
  color: #4ade80;
}

[data-theme="dark"] .btn-cancel {
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(30, 35, 60, 0.5);
}

[data-theme="dark"] .btn-cancel:hover {
  background: rgba(40, 45, 80, 0.6);
  border-color: rgba(43, 127, 255, 0.3);
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .options-section {
    grid-template-columns: 1fr;
  }

  .submit-section {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-publish {
    width: 100%;
    justify-content: center;
  }
}
</style>
