<script setup lang="ts">
import { ref, computed } from 'vue'
import PlaceCard from '@/components/PlaceCard.vue'
import { placesData } from '@/data/mockData'

const selectedType = ref<string>('전체')
const searchQuery = ref<string>('')
const types = ['전체', '러닝', '산책', '관광']

const filteredPlaces = computed(() => {
  return placesData.filter(place => {
    const typeMatch = selectedType.value === '전체' || place.type === selectedType.value
    const searchMatch =
      place.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return typeMatch && searchMatch
  })
})
</script>

<template>
  <div class="places-view">
    <!-- Header Section -->
    <section class="header-section">
      <h1>🎯 장소 추천</h1>
      <p>공공데이터 기반 AI가 당신에게 딱 맞는 장소를 추천해드려요!</p>

      <div class="search-filter">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="장소를 검색해보세요..." />
        </div>

        <div class="filter-buttons">
          <button
            v-for="type in types"
            :key="type"
            :class="['filter-btn', { active: selectedType === type }]"
            @click="selectedType = type"
          >
            {{ type }}
          </button>
        </div>
      </div>
    </section>

    <!-- Places Grid -->
    <section class="results-section">
      <div v-if="filteredPlaces.length > 0" class="places-grid">
        <PlaceCard v-for="place in filteredPlaces" :key="place.id" :place="place" />
      </div>
      <div v-else class="no-results">
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어를 시도해보세요.</p>
        </div>
      </div>
    </section>

    <!-- AI Tips Section -->
    <section class="tips-section">
      <h2>💡 이런 장소는 어때요?</h2>
      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-icon">🏃‍♂️</div>
          <p class="tip-text">"빠르게 뛸 수 있는 평탄한 길"</p>
          <button class="tip-btn">추천 받기</button>
        </div>
        <div class="tip-card">
          <div class="tip-icon">🚶‍♀️</div>
          <p class="tip-text">"경치 좋은 한강변"</p>
          <button class="tip-btn">추천 받기</button>
        </div>
        <div class="tip-card">
          <div class="tip-icon">📸</div>
          <p class="tip-text">"인생샷을 담을 수 있는 관광지"</p>
          <button class="tip-btn">추천 받기</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.places-view {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* Header Section */
.header-section {
  text-align: center;
}

.header-section h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
  color: #333;
  font-weight: 700;
}

.header-section p {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem;
}

.search-filter {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: stretch;
}

.search-box {
  position: relative;
  max-width: 100%;
}

.search-box input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.search-box input:focus {
  outline: none;
  border-color: #FF1493;
  box-shadow: 0 0 0 3px rgba(255, 20, 147, 0.1);
}

.search-box input::placeholder {
  color: #999;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
}

.filter-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-btn {
  padding: 0.7rem 1.4rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  color: #666;
  font-size: 0.95rem;
}

.filter-btn:hover {
  border-color: #FF1493;
  color: #FF1493;
  background: #f9f9f9;
}

.filter-btn.active {
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
  border-color: #FF1493;
}

/* Results Section */
.results-section {
  min-height: 300px;
}

.places-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.empty-state p {
  color: #666;
  margin: 0;
}

/* Tips Section */
.tips-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.tips-section h2 {
  text-align: center;
  font-size: 1.3rem;
  margin: 0 0 1.5rem;
  color: #333;
  font-weight: 600;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  background: linear-gradient(135deg, #FFE4EC 0%, #FFF5F8 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #FFB6C1;
}

.tip-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(255, 20, 147, 0.15);
  border-color: #FF69B4;
}

.tip-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.tip-text {
  font-size: 0.95rem;
  color: #333;
  margin: 0 0 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.tip-btn {
  padding: 0.6rem 1.4rem;
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.tip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .places-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 1.5rem;
  }

  .places-grid {
    grid-template-columns: 1fr;
  }

  .search-filter {
    gap: 1rem;
  }

  .filter-buttons {
    gap: 0.5rem;
  }

  .filter-btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }

  .tips-section {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.3rem;
  }

  .header-section p {
    font-size: 0.9rem;
  }

  .search-box input {
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    font-size: 0.95rem;
  }

  .filter-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }

  .tip-icon {
    font-size: 2rem;
  }
}
</style>
