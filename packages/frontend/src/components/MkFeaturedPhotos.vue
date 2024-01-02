<template>
<div v-if="meta" :class="$style.root" :style="{ backgroundImage: `url(${ meta.backgroundImageUrl })` }"></div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Yanki from 'misskey-js';
import * as os from '@/os';

const meta = ref<Yanki.entities.DetailedInstanceMetadata>();

os.api('meta', { detail: true }).then(gotMeta => {
	meta.value = gotMeta;
});
</script>

<style lang="scss" module>
.root {
	background-position: center;
	background-size: cover;
}
</style>
