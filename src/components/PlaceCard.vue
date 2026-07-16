<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Place {
  id: string | number;
  name: string;
  type?: string;
  distance?: string;
  difficulty?: string;
  image?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  lat?: number;
  lng?: number;
  region?: string;
  category?: string;
  tags?: string[];
  address?: string;
}

const { place } = defineProps<{ place: Place }>();
const emit = defineEmits<{
  (e: 'select', place: Place): void;
  (e: 'create', place: Place): void;
}>();

const createMeeting = (e: Event) => {
  e.stopPropagation();
  emit('create', place);
};

const emojiForPlace = (place: Place) => {
  const hay =
    `${place.type || ''} ${place.name || ''} ${(place.tags || []).join(' ')}`.toLowerCase();
  if (hay.includes('러닝') || hay.includes('런') || hay.includes('마라톤')) return '🏃‍♂️';
  if (hay.includes('산책') || hay.includes('트레일') || hay.includes('숲')) return '🌲';
  if (hay.includes('관광') || hay.includes('여행') || hay.includes('관람')) return '📸';
  if (hay.includes('레포츠') || hay.includes('레저') || hay.includes('레저스')) return '🏄‍♂️';
  if (hay.includes('쇼핑') || hay.includes('몰') || hay.includes('상점') || hay.includes('마켓'))
    return '🛍️';
  if (hay.includes('데이트') || hay.includes('커플')) return '💘';
  if (hay.includes('자전거') || hay.includes('바이크')) return '🚴‍♀️';
  return '📍';
};

const renderStars = (rating: number | null) => {
  if (rating == null) return '';
  const filled = Math.round(Math.max(0, Math.min(5, rating)));
  const stars = Array.from({ length: 5 })
    .map((_, i) => (i < filled ? '★' : '☆'))
    .join('');
  return stars;
};

// 빈 문자열('')까지 걸러내는 헬퍼
const hasValue = (v: any) => v !== null && v !== undefined && String(v).trim() !== '';

// ===== 태그 (카테고리 / 난이도) - 항상 2개 렌더링되도록 fallback =====
const getTypeLabel = (p: any) => {
  return hasValue(p?.type) ? p.type : hasValue(p?.category) ? p.category : '일반';
};

const getDifficultyLabel = (p: any) => {
  return hasValue(p?.difficulty) ? p.difficulty : '전체';
};

// ===== 통계 (거리 / 평점 / 리뷰) =====
const getDistance = (p: any) => {
  const v = p?.distance ?? p?.dist ?? p?.distanceText;
  return hasValue(v) ? v : '정보 없음';
};

const getRating = (p: any): number | null => {
  const r = p?.rating ?? p?.score ?? p?.avgRating ?? p?.overallRating;
  if (!hasValue(r)) return null;
  const n = Number(r);
  if (Number.isNaN(n)) return null;
  return Math.round(n * 10) / 10;
};

const getReviews = (p: any): number => {
  const r = p?.reviews ?? p?.reviewCount ?? p?.totalCount ?? p?.reviewsCount;
  if (!hasValue(r)) return 0;
  const n = Number(r);
  return Number.isNaN(n) ? 0 : n;
};
</script>

<template>
  <div class="place-card" @click="emit('select', place)">
    <div class="place-image">
      <span class="image-emoji">{{ emojiForPlace(place) }}</span>
    </div>
    <div class="place-content">
      <h3>{{ place.name || '이름 없는 장소' }}</h3>
      <p class="description">{{ place.description || '설명이 등록되지 않았습니다.' }}</p>
      <div class="tags">
        <span class="tag type">{{ getTypeLabel(place) }}</span>
        <span class="tag difficulty" :class="getDifficultyLabel(place)">{{
          getDifficultyLabel(place)
        }}</span>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="label">거리</span>
          <span class="value">{{ getDistance(place) }}</span>
        </div>
        <div class="stat">
          <span class="label">평점</span>
          <span class="value">
            <template v-if="getRating(place) !== null">
              <span class="stars">{{ renderStars(getRating(place)) }}</span>
              <span class="score">{{ getRating(place) }}</span>
            </template>
            <template v-else>평점 없음</template>
          </span>
        </div>
        <div class="stat">
          <span class="label">리뷰</span>
          <span class="value">{{ getReviews(place) }}개</span>
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
  padding: 0;
  font-size: 3rem;
}

.place-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-emoji {
  font-size: 3.6rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  line-clamp: 2;
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

/* ⭐ 별점 전용 스타일 - 별과 숫자를 세로로 분리해서 "..." 잘림 방지 */
.stars {
  display: block;
  font-size: 0.72rem;
  letter-spacing: -1px;
  line-height: 1.2;
  white-space: nowrap;
}

.score {
  display: block;
  font-size: 0.8rem;
  margin-top: 2px;
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
  margin-top: auto;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

@media (max-width: 1024px) {
  .place-content {
    padding: 1.2rem;
  }
}

@media (max-width: 640px) {
  .place-card {
    flex-direction: row;
  }

  .place-image {
    width: 110px;
    height: auto;
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
    line-clamp: 1;
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

  .stars {
    font-size: 0.62rem;
  }

  .score {
    font-size: 0.72rem;
  }

  .btn-primary {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

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
