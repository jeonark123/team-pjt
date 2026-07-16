<script setup lang="ts">
interface Place {
  id: number
  name: string
  type: string
  distance: string
  difficulty: string
  image: string
  description: string
  rating: number
  reviews: number
  lat?: number
  lng?: number
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
  } catch (e) {
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
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin: 0.8rem 0;
}

.tag {
  display: inline-block;
  padding: 0.35rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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
  margin-top: 0.5rem;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

@media (max-width: 768px) {
  .place-card {
    flex-direction: row;
  }

  .place-image {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .place-content {
    padding: 1rem;
  }
}
</style>
