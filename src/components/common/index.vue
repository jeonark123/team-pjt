<template>
  <div class="panel">
    <div class="panel-card">
      <h3>준비된 기본 요소</h3>
      <ul>
        <li>Vue Router</li>
        <li>TypeScript 설정</li>
        <li>공통 컴포넌트 구조</li>
        <li>기본 스타일 시스템</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  justify-content: center;
}

.panel-card {
  width: 100%;
  max-width: 360px;
  padding: 1.3rem;
  border-radius: 1.25rem;
  background: white;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.panel-card h3 {
  margin-bottom: 0.7rem;
}

.panel-card ul {
  padding-left: 1rem;
  color: var(--color-text-muted);
}

.panel-card li + li {
  margin-top: 0.35rem;
}
</style>
