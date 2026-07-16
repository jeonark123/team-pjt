<script setup lang="ts">
import { ref, computed } from 'vue';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: Tab[];
  activeTab?: string;
}

interface Emits {
  (e: 'update:activeTab', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: undefined,
});

const emit = defineEmits<Emits>();

const localActive = ref(props.activeTab || props.tabs[0]?.id || '');

const activeIndex = computed(() => {
  const idx = props.tabs.findIndex((t) => t.id === localActive.value);
  return idx === -1 ? 0 : idx;
});

const indicatorStyle = computed(() => ({
  width: `${100 / props.tabs.length}%`,
  transform: `translateX(${activeIndex.value * 100}%)`,
}));

const handleTabClick = (tabId: string) => {
  localActive.value = tabId;
  emit('update:activeTab', tabId);
};
</script>

<template>
  <div class="tab-container">
    <div class="tab-track">
      <div class="tab-indicator" :style="indicatorStyle"></div>
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

.tab-track {
  position: relative;
  display: flex;
  gap: 0.25rem;
  background: #f3f2f5;
  border-radius: 14px;
  padding: 0.35rem;
  margin-bottom: 1.5rem;
}

.tab-indicator {
  position: absolute;
  top: 0.35rem;
  left: 0.35rem;
  bottom: 0.35rem;
  width: calc(100% / 3 - 0.35rem);
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.06);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.tab-button {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  background: transparent;
  border: none;
  color: #8b8a94;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  font-size: 0.9rem;
  border-radius: 10px;
  white-space: nowrap;
}

.tab-button .tab-icon {
  font-size: 1.05rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.tab-button:hover:not(.active) {
  color: #4a4952;
}

.tab-button.active {
  color: var(--primary, #ff1f8f);
}

.tab-button.active .tab-icon {
  transform: scale(1.08);
}

.tab-content {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tab-track {
    border-radius: 12px;
    padding: 0.3rem;
  }

  .tab-indicator {
    border-radius: 9px;
  }

  .tab-button {
    padding: 0.55rem 0.6rem;
    font-size: 0.82rem;
    gap: 0.3rem;
    border-radius: 9px;
  }

  .tab-button .tab-icon {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .tab-button {
    padding: 0.5rem 0.4rem;
    font-size: 0.78rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-indicator,
  .tab-content,
  .tab-icon {
    transition: none !important;
    animation: none !important;
  }
}
</style>
