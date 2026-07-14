<template>
  <section class="about">
    <h2>프로젝트 소개</h2>
    <p>이 프로젝트는 Vue 3와 TypeScript 기반으로 빠르게 개발을 시작할 수 있도록 초기 세팅한 예시입니다.</p>

    <div class="cards">
      <article>
        <h3>라우터</h3>
        <p>홈과 소개 페이지가 기본으로 연결되어 있습니다.</p>
      </article>
      <article>
        <h3>공통 UI</h3>
        <p>재사용 가능한 공통 컴포넌트 구조를 바로 확장할 수 있습니다.</p>
      </article>
      <article>
        <h3>스타일</h3>
        <p>기본 레이아웃과 색상 토큰이 정리되어 있습니다.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about {
  max-width: 900px;
  margin: 0 auto;
}

.about h2 {
  margin-bottom: 0.7rem;
}

.about > p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.cards article {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-background-soft);
}

.cards h3 {
  margin-bottom: 0.4rem;
}

@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
