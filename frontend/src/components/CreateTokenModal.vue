<template>
	<a-modal
		:open="open"
		title="创建 API Token"
		@ok="handleOk"
		@cancel="handleCancel"
		:confirm-loading="loading"
		width="500px"
		:centered="true"
		wrapClassName="create-token-modal-wrap"
	>
		<div class="create-token-modal-content">
			<!-- Info Section -->
			<div class="token-info">
				<div class="token-icon">
					<KeyOutlined />
				</div>
				<div class="token-desc">
					<p>API Token 用于 CLI 工具访问 ClawHub 技能市场</p>
					<p>创建后请妥善保管，Token 将一直有效直到手动撤销</p>
				</div>
			</div>

			<!-- Form -->
			<a-form layout="vertical" class="token-form">
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

			<!-- Warning -->
			<div class="token-warning">
				<WarningOutlined />
				<span>Token 具有完整访问权限，请勿分享给他人</span>
			</div>
		</div>
	</a-modal>
</template>

<script setup lang="ts">
	import { ref, watch } from "vue";
	import { message } from "ant-design-vue";
	import { KeyOutlined, WarningOutlined } from "@ant-design/icons-vue";

	const props = defineProps<{
		open: boolean;
	}>();

	const emit = defineEmits<{
		(e: "update:open", value: boolean): void;
		(e: "confirm", label: string): void;
	}>();

	const labelValue = ref("CLI Token " + new Date().toLocaleDateString());
	const loading = ref(false);

	watch(() => props.open, (isOpen) => {
		if (isOpen) {
			labelValue.value = "CLI Token " + new Date().toLocaleDateString();
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
			emit("update:open", false);
		} finally {
			loading.value = false;
		}
	}

	function handleCancel() {
		labelValue.value = "";
		emit("update:open", false);
	}
</script>

<style>
	/* ─── Content ─── */
	.create-token-modal-content {
		padding: 0.5rem 0;
	}

	/* ─── Token Info Section ─── */
	.create-token-modal-content .token-info {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, rgba(219, 234, 254, 0.3) 0%, rgba(191, 219, 254, 0.2) 100%);
		border-radius: 16px;
		border: 1px solid rgba(43, 127, 255, 0.15);
	}

	.create-token-modal-content .token-icon {
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

	.create-token-modal-content .token-desc {
		flex: 1;
	}

	.create-token-modal-content .token-desc p {
		font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
		font-size: 0.8125rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
	}

	.create-token-modal-content .token-desc p:first-child {
		font-weight: 600;
		color: #27272a;
		margin-bottom: 0.25rem;
	}

	/* ─── Form ─── */
	.create-token-modal-content .token-form {
		margin-bottom: 1rem;
	}

	.create-token-modal-content .token-form .ant-form-item {
		margin-bottom: 0;
	}

	.create-token-modal-content .token-form .ant-form-item-label > label {
		font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: #27272a;
	}

	.create-token-modal-content .token-form .ant-input {
		/* border-radius: 12px; */
		/* border: 1px solid rgba(148, 163, 184, 0.2); */
		border: none;
		background: rgba(255, 255, 255, 0.8);
		box-shadow: none;
		transition: all 0.2s ease;
	}

	.create-token-modal-content .token-form .ant-input:hover {
		border-color: rgba(43, 127, 255, 0.3);
		background: rgba(255, 255, 255, 0.9);
	}

	.create-token-modal-content .token-form .ant-input:focus {
		border-color: #155dfc;
		box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.1);
		background: rgba(255, 255, 255, 0.95);
	}

	.create-token-modal-content .token-form .ant-input::placeholder {
		color: #9ca3af;
	}

	/* Input with count (textarea-like) */
	.create-token-modal-content .token-form .ant-input-data-count {
		border-radius: 12px;
	}

	.create-token-modal-content .token-form .ant-input-data-count .ant-input {
		border-radius: 12px;
	}

	.create-token-modal-content .token-form .ant-input-data-count .ant-input-count {
		color: #9ca3af;
		font-size: 0.75rem;
	}

	/* ─── Warning ─── */
	.create-token-modal-content .token-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(251, 146, 60, 0.1);
		border-radius: 12px;
		border: 1px solid rgba(251, 146, 60, 0.2);
	}

	.create-token-modal-content .token-warning .anticon {
		font-size: 1rem;
		color: #f97316;
		flex-shrink: 0;
	}

	.create-token-modal-content .token-warning span {
		font-family: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
		font-size: 0.8125rem;
		color: #c2410c;
	}

	/* ─── Modal Styles ─── */
	.create-token-modal-wrap .ant-modal-content {
		border-radius: 24px;
		overflow: hidden;
	}

	.create-token-modal-wrap .ant-modal-header {
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: none;
	}

	.create-token-modal-wrap .ant-modal-title {
		font-family: 'Archivo', 'PingFang SC', 'Microsoft YaHei', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: #27272a;
	}

	.create-token-modal-wrap .ant-modal-body {
		padding: 0 1.5rem 1.5rem;
	}

	.create-token-modal-wrap .ant-modal-footer {
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid rgba(148, 163, 184, 0.2);
	}

	.create-token-modal-wrap .ant-btn-primary {
		height: 40px;
		padding: 0 1.5rem;
		border-radius: 99999px;
		font-weight: 600;
		background: linear-gradient(135deg, #155dfc 0%, #4f39f6 100%);
		border: none;
		box-shadow:
			0 4px 12px rgba(43, 127, 255, 0.25),
			0 2px 6px rgba(43, 127, 255, 0.15);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.create-token-modal-wrap .ant-btn-primary:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 8px 20px rgba(43, 127, 255, 0.35),
			0 4px 10px rgba(43, 127, 255, 0.2);
	}

	.create-token-modal-wrap .ant-btn-primary.loading {
		opacity: 0.7;
		transform: none;
	}

	.create-token-modal-wrap .ant-btn-default {
		height: 40px;
		padding: 0 1.5rem;
		border-radius: 99999px;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(148, 163, 184, 0.3);
		color: #6b7280;
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.create-token-modal-wrap .ant-btn-default:hover {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(148, 163, 184, 0.4);
		color: #27272a;
		transform: translateY(-1px);
	}

	/* ─── Dark Theme ─── */
	[data-theme="dark"] .create-token-modal-content .token-info {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.1) 100%);
		border-color: rgba(43, 127, 255, 0.25);
	}

	[data-theme="dark"] .create-token-modal-content .token-icon {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(96, 165, 250, 0.15) 100%);
		color: #60a5fa;
	}

	[data-theme="dark"] .create-token-modal-content .token-desc p {
		color: #94a3b8;
	}

	[data-theme="dark"] .create-token-modal-content .token-desc p:first-child {
		color: #e2e8f0;
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-form-item-label > label {
		color: #e2e8f0;
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-input {
		background: rgba(40, 45, 80, 0.6);
		border-color: rgba(99, 102, 241, 0.15);
		color: #e2e8f0;
		box-shadow: none;
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-input:hover {
		border-color: rgba(43, 127, 255, 0.35);
		background: rgba(50, 55, 90, 0.7);
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-input:focus {
		border-color: #60a5fa;
		box-shadow: 0 0 0 3px rgba(43, 127, 255, 0.15);
		background: rgba(60, 65, 100, 0.8);
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-input::placeholder {
		color: #64748b;
	}

	[data-theme="dark"] .create-token-modal-content .token-form .ant-input-data-count .ant-input-count {
		color: #64748b;
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-modal-title {
		color: #f1f5f9;
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-modal-footer {
		border-top-color: rgba(99, 102, 241, 0.2);
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-btn-primary {
		box-shadow:
			0 4px 12px rgba(43, 127, 255, 0.4),
			0 2px 6px rgba(0, 0, 0, 0.3);
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-btn-primary:hover {
		box-shadow:
			0 8px 20px rgba(43, 127, 255, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.4);
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-btn-default {
		background: rgba(30, 35, 60, 0.5);
		border-color: rgba(99, 102, 241, 0.2);
		color: #94a3b8;
	}

	[data-theme="dark"] .create-token-modal-wrap .ant-btn-default:hover {
		background: rgba(40, 45, 80, 0.6);
		border-color: rgba(43, 127, 255, 0.35);
		color: #e2e8f0;
	}
</style>
