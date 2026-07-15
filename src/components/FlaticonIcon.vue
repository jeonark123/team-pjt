<script setup lang="ts">
interface Props {
  name: string
  size?: number
  color?: string
}

withDefaults(defineProps<Props>(), {
  size: 20,
  color: 'currentColor',
})

const iconMap: Record<string, string> = {
  menu: 'fi-sr-menu-burger',
  search: 'fi-sr-search',
  bell: 'fi-sr-bell',
  chat: 'fi-sr-comment-alt',
  user: 'fi-sr-user',
  home: 'fi-sr-home',
  map: 'fi-sr-marker',
  group: 'fi-sr-users',
  plus: 'fi-sr-plus',
  sparkles: 'fi-sr-stars',
  sun: 'fi-sr-sun',
  pin: 'fi-sr-map-marker',
  calendar: 'fi-sr-calendar',
  clock: 'fi-sr-clock-three',
  write: 'fi-sr-edit',
  idea: 'fi-sr-lightbulb',
  camera: 'fi-sr-camera',
  walk: 'fi-sr-walking',
  check: 'fi-sr-check',
  empty: 'fi-sr-box',
  star: 'fi-sr-star',
}

const getIconClass = (name: string) => iconMap[name] || 'fi-sr-star'
</script>

<template>
  <i
    class="flaticon-icon"
    :class="getIconClass(name)"
    :style="{ fontSize: `${size}px`, color }"
    aria-hidden="true"
  />
</template>

<style scoped>
.flaticon-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  line-height: 1;
}
</style>
