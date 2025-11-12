<script setup>
const themes = [
  {
    name: 'light',
    nameText: 'Світла',
    icon: 'tabler-sun-high',
  },
  {
    name: 'dark',
    nameText: 'Темна',
    icon: 'tabler-moon-stars',
  },
  {
    name: 'system',
    nameText: 'Системна',
    icon: 'tabler-device-desktop-analytics',
  },
]
</script>

<template>
  <ThemeSwitcher :themes="themes" />
</template>
