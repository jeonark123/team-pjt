<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Place {
  id: string | number
  name: string
  // optional properties to allow multiple place shapes
  type?: string
  distance?: string
  difficulty?: string
  image?: string
  description?: string
  rating?: number
  reviews?: number
  lat?: number
  lng?: number
  region?: string
  category?: string
  tags?: string[]
  address?: string
}

const { place } = defineProps<{ place: Place }>()
const emit = defineEmits<{
  (e: 'select', place: Place): void
  (e: 'create', place: Place): void
}>()

const createMeeting = (e: Event) => {
  e.stopPropagation()
  emit('create', place)
}

const isImageUrl = (v: unknown) => {
  try {
    return /^(https?:)?\/\//.test(String(v))
  } catch {
    return false
  }
}
</script>

<template>
  <div class="place-card" @click="emit('select', place)">
    <div class="place-image">
      <template v-if="place.image && isImageUrl(place.image)">
        <img class="place-thumb" :src="place.image" :alt="place.name" @error="(e)=>{(e.target as HTMLImageElement).style.display='none'}" />
      </template>
      <template v-else>
        <span class="image-emoji">{{ place.image || '📍' }}</span>
      </template>
    </div>
    <div class="place-content">
      <h3>{{ place.name }}</h3>
      <p class="description">{{ place.description }}</p>
      <div class="tags">
        <span class="tag type">{{ place.type }}</span>
        <span class="tag difficulty" :class="place.difficulty">{{ place.difficulty }}</span>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="label">거리</span>
          <span class="value">{{ place.distance }}</span>
        </div>
        <div class="stat">
          <span class="label">평점</span>
          <span class="value">⭐ {{ place.rating }}</span>
        </div>
        <div class="stat">
          <span class="label">리뷰</span>
          <span class="value">{{ place.reviews }}개</span>
        </div>
      </div>
      <button class="btn-primary" @click.stop="createMeeting">여기서 모임 만들기</button>
    </div>
  </div>
</template>

<style scoped>
.place-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.1);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.place-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(255, 20, 147, 0.15);
}

.place-image {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary) 100%);
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.place-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.place-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.place-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--text-dark);
}

.description {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-light);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin: 0.8rem 0;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 0.35rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tag.type {
  background: var(--accent);
  color: white;
}

.tag.difficulty {
  color: white;
}

.tag.difficulty.하 {
  background: var(--success);
}

.tag.difficulty.중 {
  background: var(--warning);
}

.tag.difficulty.상 {
  background: var(--danger);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.stat {
  text-align: center;
  min-width: 0;
}

.stat .label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-light);
  margin-bottom: 0.3rem;
}

.stat .value {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-primary {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: auto; /* 콘텐츠 길이와 상관없이 버튼을 항상 카드 하단에 고정 */
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

/* 태블릿: 세로형 유지, 여백만 살짝 축소 */
@media (max-width: 1024px) {
  .place-content {
    padding: 1.2rem;
  }
}

/* 모바일: 가로형 카드로 전환 */
@media (max-width: 640px) {
  .place-card {
    flex-direction: row;
  }

  .place-image {
    width: 110px;
    height: auto; /* 부모(.place-card)의 stretch로 .place-content 높이에 맞춰짐 */
    flex-shrink: 0;
    font-size: 2.2rem;
  }

  .place-content {
    padding: 0.9rem;
  }

  .place-content h3 {
    font-size: 1rem;
    margin: 0 0 0.3rem;
  }

  .description {
    -webkit-line-clamp: 1;
    font-size: 0.8rem;
    margin: 0.3rem 0;
  }

  .tags {
    margin: 0.5rem 0;
    gap: 0.4rem;
  }

  .tag {
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
  }

  .stats {
    gap: 0.4rem;
    margin: 0.6rem 0;
    padding-top: 0.6rem;
  }

  .stat .label {
    font-size: 0.65rem;
    margin-bottom: 0.15rem;
  }

  .stat .value {
    font-size: 0.8rem;
  }

  .btn-primary {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

/* 아주 작은 폰: 리뷰 항목 숨기고 2열로 */
@media (max-width: 380px) {
  .place-image {
    width: 90px;
    font-size: 1.8rem;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat:last-child {
    display: none;
  }
}
</style>
