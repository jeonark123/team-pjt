<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useMeetingStore } from '@/stores/meeting'
import MeetingCard from '@/components/MeetingCard.vue'
import FlaticonIcon from '@/components/FlaticonIcon.vue';
import { useRecommendedPlaces } from '@/composables/useRecommendedPlaces';

const { recommendedPlaces, lastQuery, clearRecommendedPlaces, openChat } = useRecommendedPlaces();

const mapContainer = ref<HTMLDivElement | null>(null);
const kakaoMap = ref<any>(null);
const markerInstances = ref<any[]>([]);
const isMapReady = ref(false);
const isGeocoding = ref(false);
const selectedPlaceId = ref<string | number | null>(null);
const unresolvedPlaceIds = ref<Set<string | number>>(new Set());

type Marker = { id: string | number };

const defaultPlaces = [
  {
    id: 'local-1',
    name: '한강공원',
    type: '러닝',
    rating: 4.8,
    icon: '🏞️',
    lat: 37.525,
    lng: 126.93,
  },
  {
    id: 'local-2',
    name: '남산타워',
    type: '관광',
    rating: 4.9,
    icon: '🗼',
    lat: 37.552,
    lng: 126.988,
  },
  {
    id: 'local-3',
    name: '선릉숲길',
    type: '산책',
    rating: 4.7,
    icon: '🌲',
    lat: 37.505,
    lng: 127.063,
  },
  {
    id: 'local-4',
    name: '강남역',
    type: '쇼핑',
    rating: 4.4,
    icon: '🛍️',
    lat: 37.497,
    lng: 127.028,
  },
];

const meetingStore = useMeetingStore()
// show top 3 latest meetings on home
const meetings = computed(() => meetingStore.meetings.slice(0, 3))

// 대화가 한 번이라도 있었는지 (질문 기록 기준)
const hasChatted = computed(() => lastQuery.value.length > 0);

// 최대 4개만 노출
const displayedPlaces = computed(() => recommendedPlaces.value.slice(0, 4));

// 카드에 보여줄 목록: 대화했으면 AI 추천, 아니면 기본 큐레이션
const activePlaces = computed(() => (hasChatted.value ? displayedPlaces.value : defaultPlaces));

const clearMarkers = () => {
  markerInstances.value.forEach((marker) => marker.setMap(null));
  markerInstances.value = [];
};

const addMarker = (
  kakao: any,
  map: any,
  lat: number,
  lng: number,
  label: string,
  id: string | number,
) => {
  const markerPosition = new kakao.maps.LatLng(lat, lng);
  const marker = new kakao.maps.Marker({ map, position: markerPosition });
  (marker as any).__placeId = id;

  const infowindow = new kakao.maps.InfoWindow({
    content: `<div class="kakao-marker-content"><span class="marker-emoji">📍</span><span>${label}</span></div>`,
  });
  kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
  kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
  kakao.maps.event.addListener(marker, 'click', () => {
    selectedPlaceId.value = id;
    map.setCenter(markerPosition);
  });

  markerInstances.value.push(marker);
  return marker;
};

// 카드 목록(AI 추천 또는 기본 목록)을 지도에 렌더링. 좌표 없으면 주소 지오코딩.
const renderMarkersForPlaces = (list: any[]) => {
  const kakao = (window as any).kakao;
  if (!kakao || !kakaoMap.value) return;

  clearMarkers();
  unresolvedPlaceIds.value = new Set();
  if (!list.length) return;

  const bounds = new kakao.maps.LatLngBounds();
  let hasBounds = false;
  const geocoder = kakao.maps.services ? new kakao.maps.services.Geocoder() : null;
  const needsGeocode: any[] = [];

  list.forEach((place) => {
    if (typeof place.lat === 'number' && typeof place.lng === 'number') {
      addMarker(kakao, kakaoMap.value, place.lat, place.lng, place.name, place.id);
      bounds.extend(new kakao.maps.LatLng(place.lat, place.lng));
      hasBounds = true;
    } else if (place.address) {
      needsGeocode.push(place);
    } else {
      unresolvedPlaceIds.value.add(place.id);
    }
  });

  if (hasBounds) kakaoMap.value.setBounds(bounds);

  if (needsGeocode.length) {
    if (!geocoder) {
      needsGeocode.forEach((place) => unresolvedPlaceIds.value.add(place.id));
      return;
    }

    isGeocoding.value = true;
    let remaining = needsGeocode.length;

    needsGeocode.forEach((place) => {
      geocoder.addressSearch(place.address, (result: any[], status: string) => {
        remaining -= 1;
        if (remaining <= 0) isGeocoding.value = false;

        if (status !== kakao.maps.services.Status.OK || !result[0]) {
          unresolvedPlaceIds.value.add(place.id);
          return;
        }

        const lat = Number(result[0].y);
        const lng = Number(result[0].x);
        addMarker(kakao, kakaoMap.value, lat, lng, place.name, place.id);

        const position = new kakao.maps.LatLng(lat, lng);
        bounds.extend(position);
        kakaoMap.value.setBounds(bounds);
      });
    });
  }
};

const initializeMap = (retries = 10) => {
  const kakao = (window as any).kakao;
  const container = mapContainer.value;

  if (!kakao || !kakao.maps || !container) {
    // SDK가 아직 로드되기 전이면 잠깐 뒤 재시도 (초기 진입 시 흔한 타이밍 이슈 대응)
    if (retries > 0) {
      setTimeout(() => initializeMap(retries - 1), 300);
    }
    return;
  }

  const options = {
    center: new kakao.maps.LatLng(37.531, 126.986),
    level: 7,
  };

  const map = new kakao.maps.Map(container, options);
  kakaoMap.value = map;
  isMapReady.value = true;
  renderMarkersForPlaces(activePlaces.value);
};

const focusPlace = (place: any) => {
  selectedPlaceId.value = place.id;

  const kakao = (window as any).kakao;
  if (!kakao || !kakaoMap.value) return;

  if (typeof place.lat === 'number' && typeof place.lng === 'number') {
    const center = new kakao.maps.LatLng(place.lat, place.lng);
    kakaoMap.value.setCenter(center);
    kakaoMap.value.setLevel && kakaoMap.value.setLevel(5);
    return;
  }

  // 좌표가 아직 지오코딩 중이거나 실패한 경우, 해당 마커를 찾아 이동
  const marker = markerInstances.value.find((m) => (m as any).__placeId === place.id);
  if (marker) {
    kakaoMap.value.setCenter(marker.getPosition());
    kakaoMap.value.setLevel && kakaoMap.value.setLevel(5);
  }
};

// 추천 결과가 바뀔 때마다 지도 갱신
watch(activePlaces, async (list) => {
  selectedPlaceId.value = null;
  await nextTick();
  if (isMapReady.value) renderMarkersForPlaces(list);
});

onMounted(() => {
  initializeMap();
});

onUnmounted(() => {
  clearMarkers();
});
</script>

<template>
  <div class="home-view">
    <!-- Hero Banner -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text-block">
          <h1>오늘의 우연이<br />특별한 인연이 되도록</h1>
          <p>AI가 당신의 취향을 연결합니다<br />여행과 모임, 새로운 만남을 지금 시작해보세요</p>
        </div>
        <div class="cta-buttons">
          <RouterLink to="/create" class="btn btn-pink">
            <span class="btn-icon">＋</span>
            모임 만들기
          </RouterLink>
          <RouterLink to="/community" class="btn btn-outline">모임 찾기</RouterLink>
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
          <button v-if="hasChatted" class="see-all clear-btn" @click="clearRecommendedPlaces">
            초기화
          </button>
          <RouterLink v-else to="/places" class="see-all">더보기 ></RouterLink>
        </div>

        <!-- 대화한 적 있음: 추천 결과 최대 4개 -->
        <template v-if="hasChatted">
          <p class="ai-query-note" aria-live="polite">"{{ lastQuery }}"에 대한 추천이에요</p>

          <div v-if="displayedPlaces.length" class="places-grid">
            <div
              v-for="place in displayedPlaces"
              :key="place.id"
              class="place-card"
              :class="{ 'is-selected': selectedPlaceId === place.id }"
              tabindex="0"
              role="button"
              @click="focusPlace(place)"
              @keydown.enter="focusPlace(place)"
            >
              <span v-if="unresolvedPlaceIds.has(place.id)" class="unresolved-badge"
                >위치 확인 불가</span
              >
              <span v-else class="map-badge">📍 지도에서 보기</span>
              <div class="place-icon">📍</div>
              <h3>{{ place.name }}</h3>
              <p class="place-type">{{ place.region }}</p>
              <p class="place-rating">{{ place.description }}</p>
            </div>
          </div>

          <!-- 질문은 했지만 매칭된 장소가 없을 때 -->
          <div v-else class="empty-state">
            <p class="empty-icon">🔍</p>
            <p class="empty-title">조건에 맞는 장소를 못 찾았어요</p>
            <p class="empty-desc">지역이나 분위기를 다르게 말해보시면 더 잘 찾아드릴게요.</p>
            <button class="empty-cta" @click="openChat">챗봇에게 다시 물어보기</button>
          </div>
        </template>

        <!-- 대화한 적 없음: 대체 UI -->
        <div v-else class="empty-state">
          <p class="empty-icon">💬</p>
          <p class="empty-title">아직 추천받은 장소가 없어요</p>
          <p class="empty-desc">
            우측 하단 챗봇에게 원하는 지역과 분위기를 알려주면<br />딱 맞는 장소를 골라드려요.
          </p>
          <button class="empty-cta" @click="openChat">챗봇에게 물어보기</button>
        </div>
      </section>

      <!-- Right: Map Section -->
      <section class="map-section">
        <div class="map-section-header">
          <h2><FlaticonIcon name="pin" :size="18" /> 추천 장소 지도</h2>
          <span v-if="isGeocoding" class="geocoding-note">
            <span class="spinner"></span> 위치 확인 중
          </span>
        </div>

        <div class="map-container">
          <div ref="mapContainer" class="map"></div>
          <div v-if="!isMapReady" class="map-loading">
            <span class="spinner"></span> 지도를 불러오는 중이에요
          </div>
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
        <MeetingCard v-for="meeting in meetings" :key="meeting.id" :meeting="meeting" />
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
  background: linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 100%);
  border-radius: 16px;
  min-height: 300px;
}

.hero-content {
  margin-left: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.hero-text-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-content h1 {
  font-size: 3rem;
  margin: 0;
  color: #333;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.01em;
}

.hero-content p {
  font-size: 1rem;
  color: #555;
  margin: 0;
  line-height: 1.5;
  font-weight: 800;
}

.cta-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.btn {
  padding: 0.7rem 1.4rem;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  text-align: center;
}

.btn-icon {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.btn-pink {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
}

.btn-pink:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.3);
}

.btn-outline {
  background: white;
  color: #ff69b4;
  border: 2px solid #ff69b4;
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
  gap: 1.75rem;
  margin-top: 1.25rem;
}

/* Places Section */
.places-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
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
  color: #ff1493;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.see-all:hover {
  color: #ff69b4;
}

.ai-query-note {
  font-size: 0.8rem;
  color: #b23b73;
  margin: -0.5rem 0 0.75rem;
}

.places-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.place-card {
  position: relative;
  background: linear-gradient(135deg, #ffe4ec 0%, #fff5f8 100%);
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #ffb6c1;
  animation: card-in 0.2s ease-out;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.place-card:hover {
  transform: translateY(-3px);
  border-color: #ff69b4;
}

.place-card:focus-visible {
  outline: 3px solid #ff69b4;
  outline-offset: 2px;
}

.place-card.is-selected {
  border-color: #ff1493;
  background: linear-gradient(135deg, #ffd6e6 0%, #fff0f5 100%);
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.2);
}

.map-badge,
.unresolved-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  white-space: nowrap;
}

.map-badge {
  background: rgba(255, 255, 255, 0.85);
  color: #b23b73;
}

.unresolved-badge {
  background: rgba(120, 120, 120, 0.12);
  color: #777;
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
  color: #ff69b4;
  margin: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  border: 2px dashed #ffd3e2;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff7fb 0%, #fffdfd 100%);
}

.empty-icon {
  font-size: 1.8rem;
  margin: 0 0 0.5rem;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.4rem;
}

.empty-desc {
  font-size: 0.82rem;
  color: #7a5d6d;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.empty-cta {
  border: none;
  border-radius: 999px;
  padding: 0.6rem 1.3rem;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 20, 147, 0.3);
}

/* Map Section */
.map-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
}

.map-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.map-section-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.geocoding-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #b23b73;
  font-weight: 600;
}

.map-container {
  position: relative;
  width: 100%;
  height: 280px;
  background: white;
  border: 2px solid #ffe4ec;
  border-radius: 10px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
  display: block;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #fff7fb;
  color: #b23b73;
  font-size: 0.85rem;
  font-weight: 600;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #ffd3e2;
  border-top-color: #ff1493;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Meetings Section */
.meetings-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-top: 1.25rem;
}

.meetings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.meeting-card {
  background: linear-gradient(135deg, #fff5f8 0%, #ffe4ec 100%);
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid #ffb6c1;
  transition: all 0.3s;
}

.meeting-card:hover {
  transform: translateY(-3px);
  border-color: #ff69b4;
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
  background: #ffb6c1;
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
  color: #ff1493;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.join-btn {
  width: 100%;
  padding: 0.6rem;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
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
    gap: 1.25rem;
  }

  .hero {
    padding: 1.25rem;
    margin-top: 2rem;
  }

  .main-grid {
    gap: 1.25rem;
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

  .place-icon {
    font-size: 1.5rem;
  }

  .meetings-grid {
    gap: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .place-card,
  .spinner {
    animation: none !important;
    transition: none !important;
  }
}
</style>
