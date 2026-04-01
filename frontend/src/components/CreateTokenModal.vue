<template>
	<a-modal
		:open="open"
		title="创建 API Token"
		@ok="handleOk"
		@cancel="handleCancel"
		:confirm-loading="loading"
		width="500px"
		:centered="true"
	>
		<a-form layout="vertical">
			<a-form-item label="Token 标签">
				<a-input
					v-model:value="labelValue"
					placeholder="如: CLI Token, My Laptop"
					:max-length="100"
					show-count
				/>
			</a-form-item>
		</a-form>
	</a-modal>
</template>

<script setup lang="ts">
	import { ref, watch } from "vue";
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
