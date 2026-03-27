<template>
  <div class="publish-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ $t("skill.edit.title") }}</h1>
        <p class="page-desc">{{ skill?.displayName }}</p>
      </div>

      <div v-if="loading" class="text-center py-20">{{ t('skill.loading') }}</div>
      <div v-else-if="error" class="text-center py-20 text-red-500">{{ error }}</div>
      <template v-else>
        <div class="publish-layout">
          <!-- Left: Form Fields -->
          <div class="form-section">
            <div class="form-group">
              <label class="form-label">{{ $t("skill.publish.display_name") }}</label>
              <a-input v-model:value="form.displayName" size="large" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t("skill.publish.version") }}</label>
              <a-input v-model:value="form.version" placeholder="1.0.0" size="large" />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t("skill.publish.tags") }}</label>
              <a-input v-model:value="form.tags" :placeholder="$t('skill.publish.tags_placeholder')" size="large" />
            </div>
          </div>

          <!-- Right: Upload Area -->
          <div class="upload-section">
            <div class="upload-card" @dragover.prevent @drop.prevent="handleDrop">
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
        </div>

        <!-- Validation & Changelog -->
        <div class="options-section">
          <div class="option-card">
            <h4 class="option-title">{{ $t("skill.publish.validation") }}</h4>
            <ul class="validation-list">
              <li :class="{ done: form.displayName }">
                <CheckCircleOutlined v-if="form.displayName" />
                <CiCircleOutlined v-else />
                {{ $t("skill.publish.display_name") }} {{ $t("skill.publish.is_required") }}
              </li>
              <li :class="{ done: hasFiles }">
                <CheckCircleOutlined v-if="hasFiles" />
                <CiCircleOutlined v-else />
                {{ $t("skill.publish.add_file") }}
              </li>
              <li :class="{ done: hasSkillMd }">
                <CheckCircleOutlined v-if="hasSkillMd" />
                <CiCircleOutlined v-else />
                SKILL.md {{ $t("skill.publish.is_required") }}
              </li>
            </ul>
          </div>

          <div class="option-card">
            <h4 class="option-title">{{ $t("skill.publish.changelog") }}</h4>
            <a-textarea
              v-model:value="form.changelog"
              :placeholder="$t('skill.publish.changelog_placeholder')"
              :rows="3"
              class="w-full"
            />
          </div>
        </div>

        <!-- Submit -->
        <div class="submit-section">
          <a-button size="large" @click="goBack">{{ $t("skill.publish.cancel") }}</a-button>
          <a-button type="primary" size="large" :loading="publishing" @click="handleResubmit">
            {{ $t("skill.edit.resubmit") }}
          </a-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FolderOpenOutlined, CheckCircleOutlined, CiCircleOutlined } from "@ant-design/icons-vue";

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

function extractTagsAsString(tags: Record<string, string> | string[] | null | undefined): string {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  if (typeof tags === "object") return Object.values(tags).join(", ");
  return "";
}

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  files.value = target.files;
}

function handleDrop(e: DragEvent) {
  const items = e.dataTransfer?.items;
  if (items) {
    const allFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) allFiles.push(file);
      }
    }
  }
}

onMounted(async () => {
  try {
    const data = await api.get<{
      skill: typeof skill.value;
      latestVersion: { version: string; changelog: string } | null;
    }>(`/api/v1/skills/${slug}`, { token: token.value });

    if (data.skill) {
      skill.value = data.skill;

      // Prefill form from skill data
      form.value.displayName = data.skill.displayName || "";
      form.value.tags = extractTagsAsString(data.skill.tags);

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
  if (!form.value.displayName) {
    message.error("Display name is required");
    return;
  }
  if (!files.value || files.value.length === 0) {
    message.error("Add at least one file");
    return;
  }
  const hasSkillMd = Array.from(files.value).some((f) => f.name === "SKILL.md");
  if (!hasSkillMd) {
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
      displayName: form.value.displayName,
      version: form.value.version,
      changelog: form.value.changelog,
      tags: form.value.tags ? form.value.tags.split(",").map((t) => t.trim()) : [],
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    const fileArray = Array.from(files.value);
    for (const file of fileArray) {
      const path = (file as any).webkitRelativePath || file.name;
      formData.append("files", file, path);
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
  padding: 2rem 0 4rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0 0 0.5rem;
}

.page-desc {
  color: var(--color-text-secondary);
  margin: 0;
}

.publish-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.upload-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-card {
  width: 100%;
  padding: 2.5rem 2rem;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  text-align: center;
  transition: all 0.2s;
}

.upload-card:hover {
  border-color: var(--color-primary);
}

.upload-icon {
  font-size: 3rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.upload-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 0.5rem;
}

.upload-info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.25rem;
}

.upload-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

.upload-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-background);
  color: var(--color-foreground);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.upload-status {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0.75rem 0 0;
}

.options-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.option-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.option-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.validation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.validation-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.validation-list li.done {
  color: #52c41a;
}

.validation-list li :deep(.anticon) {
  font-size: 1rem;
}

.w-full {
  width: 100%;
}

.submit-section {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .publish-layout,
  .options-section {
    grid-template-columns: 1fr;
  }
}
</style>
