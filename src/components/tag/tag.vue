<!-- // Tag component -->
<script setup lang="ts">
defineProps<{
  label?: string
  class?: string
}>()
</script>
<template>
	<div class="bg-gray-400 items-center justify-center rounded-full w-fit p-2 text-sm" :class="class">
		<span class="text-white">{{ label }}</span>
	</div>
</template>
