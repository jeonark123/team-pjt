<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, onMounted } from 'vue'
import FlaticonIcon from '@/components/FlaticonIcon.vue'

const mapContainer = ref<HTMLDivElement | null>(null)
const kakaoMap = ref<any>(null)
const markerInstances = ref<any[]>([])

const places = [
  { id: 1, name: '한강공원', type: '러닝', rating: 4.8, icon: '🏞️', lat: 37.525, lng: 126.93 },
  { id: 2, name: '남산타워', type: '관광', rating: 4.9, icon: '🗼', lat: 37.552, lng: 126.988 },
  { id: 3, name: '선릉숲길', type: '산책', rating: 4.7, icon: '🌲', lat: 37.505, lng: 127.063 },
  { id: 4, name: '강남역', type: '쇼핑', rating: 4.4, icon: '🛍️', lat: 37.497, lng: 127.028 },
]

const meetings = [
  { id: 1, title: '일요일 한강 조깅 함께해요!', location: '여의도 한강공원', date: '7월 21일 (일)', time: '07:00', category: '👩', participants: '5/10' },
  { id: 2, title: '남산 산책 모임', location: '남산', date: '7월 22일 (월)', time: '18:00', category: '👩', participants: '3/8' },
  { id: 3, title: '강남 쇼핑 & 카페투어', location: '강남역', date: '7월 20일 (토)', time: '14:00', category: '👩', participants: '7/12' },
]

const mapLocations = [
  { name: '한강공원', lat: 37.525, lng: 126.93, icon: '🏃' },
  { name: '남산타워', lat: 37.552, lng: 126.988, icon: '🗼' },
  { name: '강남역', lat: 37.497, lng: 127.028, icon: '🛍️' },
]

const initializeMap = () => {
  const kakao = (window as any).kakao
  const container = mapContainer.value

  if (!kakao || !container) {
    return
  }

  const options = {
    center: new kakao.maps.LatLng(37.531, 126.986),
    level: 7,
  }

  const map = new kakao.maps.Map(container, options)
  kakaoMap.value = map

  mapLocations.forEach((loc) => {
    const markerPosition = new kakao.maps.LatLng(loc.lat, loc.lng)
    const marker = new kakao.maps.Marker({ map, position: markerPosition })
    const infowindow = new kakao.maps.InfoWindow({ content: `<div class="kakao-marker-content"><span class="marker-emoji">${loc.icon}</span><span>${loc.name}</span></div>` })
    kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker))
    kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close())
    markerInstances.value.push(marker)
  })
}

const focusPlace = (place: any) => {
  const kakao = (window as any).kakao
  if (!kakao || !kakaoMap.value || !place) return
  if (place.lat && place.lng) {
    const center = new kakao.maps.LatLng(place.lat, place.lng)
    kakaoMap.value.setCenter(center)
    kakaoMap.value.setLevel && kakaoMap.value.setLevel(5)
  }
}

onMounted(() => {
  initializeMap()
})
</script>

<template>
  <div class="home-view">
    <!-- Hero Banner -->
    <section class="hero">
      <div class="hero-content">
        <h1>진짜 연결을 위한<br/>새로운 커뮤니티</h1>
        <p>혼자가 아니야, 함께 해요!<br/>관광 동행 및 새로운 만남</p>
        <div class="cta-buttons">
          <RouterLink to="/create" class="btn btn-pink">지금 시작하기</RouterLink>
          <RouterLink to="/community" class="btn btn-outline">이용 가이드</RouterLink>
        </div>
      </div>
      <div class="hero-image">
        <img src="/hero-image.png" alt="Hero illustration" class="hero-image-img" />
      </div>
    </section>

    <!-- Main Grid Layout -->
    <div class="main-grid">
      <!-- Left: Places Section -->
      <section class="places-section">
        <div class="section-title">
          <h2><FlaticonIcon name="sparkles" :size="18" /> AI 추천 장소</h2>
          <RouterLink to="/places" class="see-all">더보기 ></RouterLink>
        </div>
        <div class="places-grid">
          <div v-for="place in places" :key="place.id" class="place-card" @click="focusPlace(place)">
            <div class="place-icon"><FlaticonIcon name="star" :size="18" /></div>
            <h3>{{ place.name }}</h3>
            <p class="place-type">{{ place.type }}</p>
            <p class="place-rating">⭐ {{ place.rating }}</p>
          </div>
        </div>
      </section>

      <!-- Right: Map Section -->
      <section class="map-section">
        <h2><FlaticonIcon name="pin" :size="18" /> 추천 장소 지도</h2>
        <div class="map-container">
        <div ref="mapContainer" class="map"></div>
      </div>
      </section>
    </div>

    <!-- Meeting Board Section (No Tabs) -->
    <section class="meetings-section">
      <div class="section-title">
        <h2><FlaticonIcon name="group" :size="18" /> 동행 게시판</h2>
        <RouterLink to="/community" class="see-all">더보기 ></RouterLink>
      </div>
      <div class="meetings-grid">
        <div v-for="meeting in meetings" :key="meeting.id" class="meeting-card">
          <div class="card-header">
            <span class="category">{{ meeting.category }}</span>
            <span class="category-label">여자 모임</span>
          </div>
          <h3>{{ meeting.title }}</h3>
          <div class="meeting-details-grid">
            <div class="detail">
              <span class="icon"><FlaticonIcon name="pin" :size="14" /></span>
              <span>{{ meeting.location }}</span>
            </div>
            <div class="detail">
              <span class="icon"><FlaticonIcon name="calendar" :size="14" /></span>
              <span>{{ meeting.date }}</span>
            </div>
            <div class="detail">
              <span class="icon"><FlaticonIcon name="clock" :size="14" /></span>
              <span>{{ meeting.time }}</span>
            </div>
          </div>
          <div class="participants"><FlaticonIcon name="group" :size="14" /> {{ meeting.participants }}</div>
          <button class="join-btn">참가하기</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%);
  border-radius: 16px;
  min-height: 300px;
}

.hero-content {
  margin-left: 2rem;
}

.hero-content h1 {
  font-size: 3rem;
  margin: 0 0 0.9rem;
  color: #333;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.01em;
}

.hero-content p {
  font-size: 1rem;
  color: #555;
  margin: 0 0 1rem;
  line-height: 1.5;
  font-weight: 800;}

.cta-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.65rem 1.3rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  display: inline-block;
  text-align: center;
}

.btn-pink {
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
}

.btn-pink:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.3);
}

.btn-outline {
  background: white;
  color: #FF69B4;
  border: 2px solid #FF69B4;
}

.btn-outline:hover {
  background: rgba(0, 0, 0, 0.05);
}

.hero-image {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.hero-image-img {
  width: 100%;
  max-width: 420px;
  height: 400px;
  object-fit: cover;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Places Section */
.places-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.see-all {
  color: #FF1493;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
}

.see-all:hover {
  color: #FF69B4;
}

.places-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.place-card {
  background: linear-gradient(135deg, #FFE4EC 0%, #FFF5F8 100%);
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #FFB6C1;
}

.place-card:hover {
  transform: translateY(-3px);
  border-color: #FF69B4;
}

.place-icon {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.place-card h3 {
  font-size: 0.9rem;
  margin: 0 0 0.25rem;
  color: #333;
  font-weight: 600;
}

.place-type {
  font-size: 0.75rem;
  color: #666;
  margin: 0 0 0.3rem;
}

.place-rating {
  font-size: 0.8rem;
  color: #FF69B4;
  margin: 0;
  font-weight: 600;
}

/* Map Section */
.map-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.map-section h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: #333;
  font-weight: 600;
}

.map-container {
  width: 100%;
  height: 280px;
  background: white;
  border: 2px solid #FFE4EC;
  border-radius: 10px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
  display: block;
}

/* Meetings Section */
.meetings-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.meetings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.meeting-card {
  background: linear-gradient(135deg, #FFF5F8 0%, #FFE4EC 100%);
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid #FFB6C1;
  transition: all 0.3s;
}

.meeting-card:hover {
  transform: translateY(-3px);
  border-color: #FF69B4;
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.15);
}

.card-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.category {
  font-size: 1.2rem;
}

.category-label {
  background: #FFB6C1;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.meeting-card h3 {
  font-size: 0.9rem;
  margin: 0 0 0.7rem;
  color: #333;
  font-weight: 600;
  line-height: 1.3;
}

.meeting-details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.7rem;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.detail .icon {
  display: inline-block;
  width: 1rem;
}

.participants {
  font-size: 0.85rem;
  color: #FF1493;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.join-btn {
  width: 100%;
  padding: 0.6rem;
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .places-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .meetings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .home-view {
    gap: 1rem;
  }

  .hero {
    padding: 1rem;
  }

  .hero-content h1 {
    font-size: 1.5rem;
  }

  .hero-content p {
    font-size: 0.85rem;
  }

  .cta-buttons {
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .places-section,
  .map-section,
  .meetings-section {
    padding: 1rem;
  }

  .places-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .meetings-grid {
    grid-template-columns: 1fr;
  }

  .map-container {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 1.3rem;
  }

  .hero-image {
    height: 150px;
  }

  .character {
    font-size: 2.5rem;
  }

  .place-icon {
    font-size: 1.5rem;
  }

  .meetings-grid {
    gap: 0.75rem;
  }
}
</style>
