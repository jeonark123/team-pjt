<script setup lang="ts">
import { RouterLink } from 'vue-router'
import CommonIndex from '../components/common/index.vue'
</script>

<template>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">프로젝트 초기 세팅 완료</p>
      <h2>빠르게 시작할 수 있는 Vue 3 앱</h2>
      <p>
        라우팅, 공통 컴포넌트, 기본 스타일이 이미 정리된 상태라 바로 기능 구현을 이어갈 수 있습니다.
      </p>

      <div class="actions">
        <RouterLink class="primary" to="/about">프로젝트 소개</RouterLink>
        <a class="secondary" href="https://vuejs.org/" target="_blank" rel="noreferrer">Vue 문서</a>
      </div>
    </div>

    <CommonIndex />
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: center;
  min-height: 70vh;
}

.eyebrow {
  display: inline-block;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--color-background-soft);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.hero h2 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  line-height: 1.2;
  margin-bottom: 0.8rem;
}

.hero p {
  color: var(--color-text-muted);
  margin-bottom: 1.2rem;
}

.actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.actions a {
  padding: 0.75rem 1rem;
  border-radius: 999px;
  font-weight: 600;
}

.primary {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
}

.secondary {
  border: 1px solid var(--color-border);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
