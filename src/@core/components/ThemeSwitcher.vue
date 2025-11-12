<script setup>
import { ref, watch } from 'vue'
import { useConfigStore } from '@core/stores/config'

const props = defineProps({
  themes: {
    type: Array,
    required: true,
  },
})

const configStore = useConfigStore()
const selectedItem = ref([configStore.theme])

watch(() => configStore.theme, () => {
  selectedItem.value = [configStore.theme]
})
</script>

<template>
  <IconBtn color="rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity))">
    <VIcon :icon="props.themes.find(t => t.name === configStore.theme)?.icon" />

    <VTooltip activator="parent" open-delay="1000" scroll-strategy="close">
      <span class="text-capitalize">{{ configStore.theme }}</span>
    </VTooltip>

    <VMenu activator="parent" offset="12px" :width="180">
      <VList v-model:selected="selectedItem" mandatory>
        <VListItem
          v-for="t in props.themes"
          :key="t.name"
          :value="t.name"
          :prepend-icon="t.icon"
          color="primary"
          @click="configStore.theme = t.name"
        >
          <VListItemTitle class="text-capitalize">
            {{ t.nameText }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>
