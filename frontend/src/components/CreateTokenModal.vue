<template>
	<a-modal
		:open="open"
		:title="null"
		:footer="null"
		@cancle="handleCancel"
		width="500px"
		:centered="true"
		:wrap-style="{ zIndex: 1000 }"
	>
		<div class="create-token-modal motion-up-12" :class="{ 'in': modalOpen }">
			<div class="modal-header">
				<h3 class="modal-title">创建 API Token</h3>
				<p class="modal-desc">为 CLI 工具创建持久访问令牌</p>
			</div>

			<a-form layout="vertical" class="modal-form">
				<a-form-item label="Token 标签">
					<a-input
						v-model:value="labelValue"
						placeholder="如: CLI Token, My Laptop"
						:max-length="100"
						show-count
						size="large"
					/>
				</a-form-item>
			</a-form>

			<div class="modal-actions">
				<a-button @click="handleCancel" size="large">取消</a-button>
				<a-button type="primary" @click="handleOk" size="large" :loading="loading">
					创建
				</a-button>
			</div>
		</div>
	</a-modal>
</template>

<script setup lang="ts">
	import { ref, watch, nextTick } from "vue";
	import { message } from "ant-design-vue";

	const props = defineProps<{
		open: boolean;
	}>();

	const emit = defineEmits<{
		(e: "update:open", value: boolean): void;
		(e: "confirm", label: string): void;
	}>();

	const labelValue = ref("CLI Token " + new Date().toLocaleDateString());
	const loading = ref(false);
	const modalOpen = ref(false);

	watch(() => props.open, (isOpen) => {
		if (isOpen) {
			labelValue.value = "CLI Token " + new Date().toLocaleDateString();
			nextTick(() => {
				requestAnimationFrame(() => {
					modalOpen.value = true;
				});
			});
		} else {
			modalOpen.value = false;
		}
	});

	async function handleOk() {
		if (!labelValue.value.trim()) {
			message.error("请输入 Token 标签");
			return;
		}

		loading.value = true;
		try {
			emit("confirm", labelValue.value.trim());
			labelValue.value = "";
			modalOpen.value = false;
			nextTick(() => {
				emit("update:open", false);
			});
		} catch {
			// error handled by caller
		} finally {
			loading.value = false;
		}
	}

	function handleCancel() {
		labelValue.value = "";
		modalOpen.value = false;
		nextTick(() => {
			emit("update:open", false);
		});
	}
</script>

<style scoped>
/* Override Ant Design modal styles */
:deep(.ant-modal-content) {
	background: transparent;
	box-shadow: none;
}

:deep(.ant-modal-body) {
	padding: 0;
}

:deep(.ant-modal-close) {
	display: none;
}

/* Modal Container */
.create-token-modal {
	background: rgba(255, 255, 255, 0.6);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-radius: 24px;
	padding: 2rem;
	border: 1px solid rgba(255, 255, 255, 0.8);
	box-shadow:
		0 8px 32px rgba(43, 127, 255, 0.12),
		0 2px 8px rgba(43, 127, 255, 0.06),
		inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.modal-header {
	margin-bottom: 1.5rem;
}

.modal-title {
	font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
	font-size: 1.25rem;
	font-weight: 700;
	color: #27272a;
	margin: 0 0 0.375rem;
}

.modal-desc {
	font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
}

.modal-form {
	margin-bottom: 1.5rem;
}

:deep(.modal-form .ant-form-item-label > label) {
	font-family: 'Manrope', sans-serif;
	font-weight: 500;
	font-size: 0.875rem;
	color: #374151;
}

:deep(.modal-form .ant-input) {
	border-radius: 12px;
	border: 1px solid rgba(148, 163, 184, 0.2);
	transition: all 0.3s ease;
}

:deep(.modal-form .ant-input:focus) {
	border-color: rgba(43, 127, 255, 0.4);
	box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.08);
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
}

.modal-actions .ant-btn {
	height: 44px;
	padding: 0 1.5rem;
	border-radius: 99999px;
	font-weight: 600;
	font-size: 0.9375rem;
}

.modal-actions .ant-btn:not(.ant-btn-primary) {
	background: rgba(255, 255, 255, 0.5);
	border: 1px solid rgba(148, 163, 184, 0.2);
	color: #374151;
	transition: all 0.3s ease;
}

.modal-actions .ant-btn:not(.ant-btn-primary):hover {
	background: rgba(255, 255, 255, 0.7);
	border-color: rgba(43, 127, 255, 0.2);
}

.modal-actions .ant-btn-primary {
	background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
	border: none;
	box-shadow:
		0 4px 12px rgba(43, 127, 255, 0.25),
		0 2px 6px rgba(43, 127, 255, 0.12);
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-actions .ant-btn-primary:hover {
	transform: translateY(-2px) scale(1.02);
	box-shadow:
		0 8px 20px rgba(43, 127, 255, 0.35),
		0 4px 10px rgba(43, 127, 255, 0.18);
}

/* Motion Animation */
.motion-up-12 {
	opacity: 0;
	transform: translateY(12px) scale(0.96);
	transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
		transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.motion-up-12.in {
	opacity: 1;
	transform: translateY(0) scale(1);
}

/* Dark Theme */
[data-theme="dark"] .create-token-modal {
	background: rgba(30, 35, 60, 0.5);
	border-color: rgba(99, 102, 241, 0.15);
	box-shadow:
		0 8px 32px rgba(0, 0, 0, 0.3),
		0 2px 8px rgba(0, 0, 0, 0.15),
		inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-theme="dark"] .modal-title {
	color: #f1f5f9;
}

[data-theme="dark"] .modal-desc {
	color: #94a3b8;
}

[data-theme="dark"] :deep(.modal-form .ant-form-item-label > label) {
	color: #cbd5e1;
}

[data-theme="dark"] :deep(.modal-form .ant-input) {
	background: rgba(30, 35, 60, 0.3);
	border-color: rgba(99, 102, 241, 0.2);
	color: #f1f5f9;
}

[data-theme="dark"] :deep(.modal-form .ant-input:focus) {
	border-color: rgba(43, 127, 255, 0.4);
	background: rgba(40, 45, 80, 0.4);
}

[data-theme="dark"] .modal-actions .ant-btn:not(.ant-btn-primary) {
	background: rgba(30, 35, 60, 0.4);
	border-color: rgba(99, 102, 241, 0.2);
	color: #cbd5e1;
}

[data-theme="dark"] .modal-actions .ant-btn:not(.ant-btn-primary):hover {
	background: rgba(40, 45, 80, 0.6);
	border-color: rgba(43, 127, 255, 0.3);
}
</style>
