<template>
  <a-modal
    :open="open"
    :title="$t('skill.install_dialog.title')"
    :footer="null"
    @cancel="handleClose"
    width="640px"
    centered
  >
    <div class="space-y-6">
      <!-- Method 1: CLI Install -->
      <div>
        <h3 class="font-medium mb-3">
          <span class="text-primary mr-1">{{ $t('skill.install_dialog.method1') }}</span>
          {{ $t('skill.install_dialog.install_command') }}
        </h3>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono break-all">{{ installCommand }}</code>
          <a-button size="small" @click="copyToClipboard(installCommand)">
            <CopyOutlined /> {{ $t('skill.install_dialog.copy') }}
          </a-button>
        </div>
      </div>

      <!-- Method 2: Download ZIP -->
      <div>
        <h3 class="font-medium mb-3">
          <span class="text-primary mr-1">{{ $t('skill.install_dialog.method2') }}</span>
          {{ $t('skill.install_dialog.download_zip') }}
        </h3>
        <div class="text-center pt-2">
          <a-button type="primary" size="large" @click="handleDownload">
            <DownloadOutlined /> {{ $t('skill.install_dialog.download_zip') }}
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  open: boolean;
  slug: string;
  installCommand: string;
  downloadUrl: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function handleDownload() {
  window.open(props.downloadUrl, "_blank");
}

function handleClose() {
  emit("close");
}
</script>
