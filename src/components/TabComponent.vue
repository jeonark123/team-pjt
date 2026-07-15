<script setup lang="ts">
import { ref } from 'vue'

interface Tab {
  id: string
  label: string
  icon: string
}

interface Props {
  tabs: Tab[]
  activeTab?: string
}

interface Emits {
  (e: 'update:activeTab', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: undefined,
})

const emit = defineEmits<Emits>()

const localActive = ref(props.activeTab || props.tabs[0]?.id || '')

const handleTabClick = (tabId: string) => {
  localActive.value = tabId
  emit('update:activeTab', tabId)
}
</script>

<template>
  <div class="tab-container">
    <div class="tab-buttons">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: localActive === tab.id }]"
        @click="handleTabClick(tab.id)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
    <div class="tab-content">
      <slot :activeTab="localActive"></slot>
    </div>
  </div>
</template>

<style scoped>
.tab-container {
  width: 100%;
}

.tab-buttons {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--text-light);
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.tab-button .tab-icon {
  font-size: 1.2rem;
}

.tab-button:hover {
  color: var(--primary);
}

.tab-button.active {
  color: var(--primary);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tab-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .tab-button .tab-icon {
    font-size: 1rem;
  }
}
</style>
