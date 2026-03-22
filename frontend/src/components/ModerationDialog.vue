<template>
  <a-modal
    :open="open"
    :title="t('skill.moderation.title')"
    :width="900"
    @cancel="$emit('close')"
    centered
  >
    <div class="space-y-4">
      <!-- Skill Info -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold">{{ skill?.displayName }}</h3>
        <p class="text-gray-500">{{ skill?.slug }}</p>
        <p class="text-sm text-gray-400 mt-1">
          {{ t('skill.by_author', { author: ownerHandle || ownerDisplayName || t('souls.unknown_author') }) }}
        </p>
      </div>

      <!-- Files List -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium">{{ t('skill.version.files') }} ({{ files.length }})</h4>
          <a-button size="small" @click="handleDownload">
            <DownloadOutlined /> {{ t('skill.download_zip') }}
          </a-button>
        </div>
        <div class="border rounded-lg overflow-hidden">
          <div
            v-for="(file, index) in files"
            :key="file.path"
            class="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
            :class="{ 'bg-blue-50': selectedFileIndex === index }"
            @click="selectFile(index)"
          >
            <div class="flex items-center gap-2">
              <FileOutlined />
              <span class="text-sm">{{ file.path }}</span>
              <span class="text-xs text-gray-400">{{ formatSize(file.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- File Content Preview -->
      <div v-if="selectedFile">
        <h4 class="font-medium mb-2">{{ selectedFile.path }}</h4>
        <div class="border rounded-lg p-4 bg-gray-50 max-h-80 overflow-auto">
          <pre class="text-sm whitespace-pre-wrap">{{ fileContent }}</pre>
        </div>
      </div>

      <!-- Loading state for files -->
      <div v-if="loadingFiles" class="text-center py-4">
        <a-spin /> {{ t('skill.loading') }}
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <a-button @click="$emit('close')">{{ t('common.cancel') }}</a-button>
        <div class="flex gap-2">
          <a-button danger type="primary" @click="handleReject" :loading="actionLoading">
            {{ t('skill.moderation.reject') }}
          </a-button>
          <a-button type="primary" @click="handleApprove" :loading="actionLoading">
            {{ t('skill.moderation.approve') }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { FileOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const { t } = useI18n();

interface SkillFile {
  path: string;
  size: number;
  storageId?: string;
}

interface Skill {
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  ownerHandle: string | null;
  ownerDisplayName: string | null;
  files: SkillFile[];
}

const props = defineProps<{
  open: boolean;
  skill: Skill | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "approve", id: string): void;
  (e: "reject", id: string): void;
}>();

const { token } = useAuth();
const api = useApi();

const files = ref<SkillFile[]>([]);
const selectedFileIndex = ref<number | null>(null);
const fileContent = ref("");
const loadingFiles = ref(false);
const actionLoading = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const selectedFile = computed(() =>
  selectedFileIndex.value !== null ? files.value[selectedFileIndex.value] : null
);

const ownerHandle = computed(() => props.skill?.ownerHandle);
const ownerDisplayName = computed(() => props.skill?.ownerDisplayName);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.skill) {
      files.value = props.skill.files || [];
      selectedFileIndex.value = null;
      fileContent.value = "";
      if (files.value.length > 0) {
        selectFile(0);
      }
    }
  }
);

async function selectFile(index: number) {
  selectedFileIndex.value = index;
  const file = files.value[index];
  if (!file) return;

  // For now, just show placeholder since we need storage endpoint
  // In production, you'd fetch from /storage/:storageId
  if (file.storageId) {
    try {
      const content = await api.get(`/storage/${file.storageId}`, { token: token.value });
      fileContent.value = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    } catch {
      fileContent.value = `[File content not available: ${file.path}]`;
    }
  } else {
    fileContent.value = `[Binary file or storageId not available: ${file.path}]`;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function handleDownload() {
  if (!props.skill?.slug) return;
  window.open(`${API_BASE}/api/v1/download?slug=${props.skill.slug}`, "_blank");
}

function handleApprove() {
  if (!props.skill?.id) return;
  actionLoading.value = true;
  emit("approve", props.skill.id);
}

function handleReject() {
  if (!props.skill?.id) return;
  actionLoading.value = true;
  emit("reject", props.skill.id);
}
</script>
