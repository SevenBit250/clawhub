<template>
  <div class="publish-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ $t("skill.publish.title") }}</h1>
        <p class="page-desc">{{ $t("skill.publish.desc") }}</p>
      </div>

      <div class="publish-layout">
        <!-- Left: Form Fields -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">{{ $t("skill.publish.slug") }}</label>
            <a-input v-model:value="form.slug" :placeholder="$t('skill.publish.slug_placeholder')" size="large" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t("skill.publish.display_name") }}</label>
            <a-input v-model:value="form.displayName" :placeholder="$t('skill.publish.display_name_placeholder')" size="large" />
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

      <!-- Validation & License -->
      <div class="options-section">
        <div class="option-card">
          <h4 class="option-title">{{ $t("skill.publish.validation") }}</h4>
          <p class="validation-hint">{{ $t("skill.publish.slug_hint") }}</p>
        </div>

        <div class="option-card">
          <h4 class="option-title">{{ $t("skill.publish.license") }}</h4>
          <a-select v-model:value="form.license" :placeholder="$t('skill.publish.license_placeholder')" size="large" class="w-full">
            <a-select-option value="MIT">MIT</a-select-option>
            <a-select-option value="Apache-2.0">Apache-2.0</a-select-option>
            <a-select-option value="GPL-3.0">GPL-3.0</a-select-option>
            <a-select-option value="BSD-3-Clause">BSD-3-Clause</a-select-option>
            <a-select-option value="MPL-2.0">MPL-2.0</a-select-option>
            <a-select-option value="CC0-1.0">CC0-1.0</a-select-option>
            <a-select-option value="无">无</a-select-option>
          </a-select>
        </div>
      </div>

      <!-- Submit -->
      <div class="submit-section">
        <a-button size="large" @click="goBack">{{ $t("skill.publish.cancel") }}</a-button>
        <a-button type="primary" size="large" :loading="publishing" @click="handlePublish">
          {{ $t("skill.publish.publish") }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FolderOpenOutlined } from "@ant-design/icons-vue";

const router = useRouter();
const { token } = useAuth();
const api = useApi();

const form = ref({
  slug: "",
  displayName: "",
  version: "1.0.0",
  tags: "",
  license: "MIT",
});

const files = ref<FileList | null>(null);
const publishing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const fileCount = computed(() => files.value?.length || 0);
const hasFiles = computed(() => fileCount.value > 0);

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
    // Note: DragEvent doesn't have files property in all browsers
    // For full support, would need to use DataTransfer
  }
}

async function handlePublish() {
  if (!form.value.slug) {
    message.error("Slug is required");
    return;
  }
  if (!form.value.displayName) {
    message.error("Display name is required");
    return;
  }
  if (!token.value) {
    message.error("Please login first");
    return;
  }

  publishing.value = true;

  try {
    // First create the skill
    const skill = await api.post(
      "/skills",
      {
        slug: form.value.slug,
        displayName: form.value.displayName,
        summary: "",
        version: form.value.version,
        tags: form.value.tags ? form.value.tags.split(",").map((t) => t.trim()) : [],
        license: form.value.license,
      },
      { token: token.value }
    );

    message.success("Skill published successfully!");
    router.push(`/skills/${skill.slug}`);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to publish skill");
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

.validation-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
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
