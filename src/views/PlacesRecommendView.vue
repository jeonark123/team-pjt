<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import OpenAI from 'openai';
import PlaceCard from '@/components/PlaceCard.vue';
import FlaticonIcon from '@/components/FlaticonIcon.vue';
import { placesData } from '@/data/mockData';
import { loadPublicCatalog, type PublicPlace } from '@/utils/loadPublicCatalog';

const selectedType = ref<string>('전체');
const searchQuery = ref<string>('');
const types = ['전체', '러닝', '산책', '관광'];

const filteredPlaces = computed(() => {
  return placesData.filter((place) => {
    const typeMatch = selectedType.value === '전체' || place.type === selectedType.value;
    const searchMatch =
      place.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    return typeMatch && searchMatch;
  });
});

const mapContainer = ref<HTMLDivElement | null>(null);
const kakaoMap = ref<any>(null);
const markerInstances = ref<any[]>([]);
const markerClusterer = ref<any>(null);
const showCluster = ref<boolean>(true);
const externalPlaces = ref<any[]>([]);
const showDatasets = ref({ travel: false, culture: false, leisure: false });
const kakaoAvailable = ref<boolean | null>(null);

// --- AI 추천 카탈로그 (전체 지역 공공데이터) ---
const aiCatalog = ref<PublicPlace[]>([]);
const isCatalogLoading = ref(true);

type Tip = {
  id: string;
  icon: string;
  text: string;
  isLoading: boolean;
  error: string;
  results: PublicPlace[];
};

const tips = ref<Tip[]>([
  {
    id: 'tip-1',
    icon: '🏃‍♂️',
    text: '빠르게 뛸 수 있는 평탄한 길',
    isLoading: false,
    error: '',
    results: [],
  },
  { id: 'tip-2', icon: '🚶‍♀️', text: '경치 좋은 한강변', isLoading: false, error: '', results: [] },
  {
    id: 'tip-3',
    icon: '📸',
    text: '인생샷을 담을 수 있는 관광지',
    isLoading: false,
    error: '',
    results: [],
  },
]);

const buildTipPrompt = (question: string) => {
  return [
    '당신은 러닝, 산책, 관광 등 활동에 어울리는 장소를 추천하는 한국어 어시스턴트입니다.',
    '반드시 아래 카탈로그에 있는 장소만 참고하고, 카탈로그에 없는 장소를 만들어내지 마세요.',
    `카탈로그:
${JSON.stringify(aiCatalog.value, null, 2)}`,
    `요청: ${question}`,
    '카탈로그에서 가장 잘 맞는 장소를 최대 4개 골라주세요.',
    '반드시 JSON만 답하세요. 형식은 {"reply":"...","recommendedIds":["id1","id2"]} 입니다.',
  ].join('\n\n');
};

const runTipSearch = async (tip: Tip) => {
  if (tip.isLoading) return;

  tip.isLoading = true;
  tip.error = '';

  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY가 설정되지 않았습니다.');
    if (!aiCatalog.value.length)
      throw new Error('아직 장소 데이터를 불러오는 중이에요. 잠시 후 다시 시도해주세요.');

    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const completion = await client.chat.completions.create({
      model: 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국어로 답하고, 오직 제공된 카탈로그 안에 있는 장소만 추천해야 합니다. 반드시 JSON 객체만 반환하세요.',
        },
        { role: 'user', content: buildTipPrompt(tip.text) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? '{}';
    let parsed: { reply?: string; recommendedIds?: unknown } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const recommendedIds = Array.isArray(parsed?.recommendedIds)
      ? parsed.recommendedIds.filter(
          (id: unknown) => typeof id === 'string' || typeof id === 'number',
        )
      : [];

    const catalogMap = new Map(aiCatalog.value.map((p) => [p.id, p]));
    const matched = recommendedIds
      .map((id: unknown) => catalogMap.get(String(id)))
      .filter((p): p is PublicPlace => Boolean(p))
      .slice(0, 4);

    tip.results = matched;
    if (!matched.length) tip.error = '조건에 맞는 장소를 찾지 못했어요. 다시 시도해보세요.';

    renderMarkers();
  } catch (err) {
    tip.error = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.';
  } finally {
    tip.isLoading = false;
  }
};

// --- 지도 ---
const toMarkersSource = (p: any) => {
  if (typeof p.lat === 'number' && typeof p.lng === 'number')
    return { name: p.name || p.title || '장소', lat: p.lat, lng: p.lng };
  // 방문자 데이터 필드: mapy(위도), mapx(경도)
  if (p.mapy && p.mapx)
    return { name: p.title || p.name || '장소', lat: Number(p.mapy), lng: Number(p.mapx) };
  return null;
};

const renderMarkers = () => {
  const kakao = (window as any).kakao;
  if (!kakao || !kakaoMap.value) return;

  markerInstances.value.forEach((m) => m.setMap && m.setMap(null));
  markerInstances.value = [];
  if (markerClusterer.value && markerClusterer.value.clear) {
    try {
      markerClusterer.value.clear();
    } catch (e) {
      markerClusterer.value = null;
    }
    markerClusterer.value = null;
  }

  const sources: any[] = [];
  placesData.forEach((p: any) => {
    if (p.lat && p.lng) sources.push({ name: p.name, lat: p.lat, lng: p.lng });
  });
  externalPlaces.value.forEach((p) => {
    const s = toMarkersSource(p);
    if (s) sources.push(s);
  });
  // 팁 카드에서 나온 AI 추천 결과도 지도에 반영
  tips.value.forEach((tip) => {
    tip.results.forEach((p) => {
      const s = toMarkersSource(p);
      if (s) sources.push(s);
    });
  });

  const createdMarkers: any[] = [];
  sources.forEach((s) => {
    const pos = new kakao.maps.LatLng(s.lat, s.lng);
    const marker = new kakao.maps.Marker({ position: pos });
    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:6px">${s.name}</div>`,
    });
    kakao.maps.event.addListener(marker, 'mouseover', () =>
      infowindow.open(kakaoMap.value, marker),
    );
    kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
    createdMarkers.push(marker);
  });

  if (showCluster.value && kakao.maps && kakao.maps.MarkerClusterer) {
    try {
      markerClusterer.value = new kakao.maps.MarkerClusterer({
        map: kakaoMap.value,
        markers: createdMarkers,
        averageCenter: true,
        minLevel: 7,
      });
    } catch (e) {
      createdMarkers.forEach((m) => m.setMap(kakaoMap.value));
    }
  } else {
    createdMarkers.forEach((m) => m.setMap(kakaoMap.value));
  }

  markerInstances.value = createdMarkers;
};

const focusOnPlace = (place: any) => {
  const kakao = (window as any).kakao;
  if (!kakao || !kakaoMap.value) return;
  const s = toMarkersSource(place);
  if (!s) return;
  const center = new kakao.maps.LatLng(s.lat, s.lng);
  kakaoMap.value.setCenter(center);
  kakaoMap.value.setLevel && kakaoMap.value.setLevel(5);
};

const initializeMap = () => {
  const kakao = (window as any).kakao;
  const container = mapContainer.value;
  if (!kakao || !container) return;

  const options = { center: new kakao.maps.LatLng(37.531, 126.986), level: 7 };
  kakaoMap.value = new kakao.maps.Map(container, options);
  renderMarkers();
};

const fetchDataset = async (fileName: string) => {
  try {
    const res = await fetch(`/data/${fileName}`);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.items || (json.items && json.items.item) || json;
    return Array.isArray(items) ? items : items.item || [];
  } catch (err) {
    return [];
  }
};

const loadDatasets = async () => {
  const promises: Promise<any[]>[] = [];
  if (showDatasets.value.travel) promises.push(fetchDataset('서울_여행코스.json'));
  if (showDatasets.value.culture) promises.push(fetchDataset('서울_문화시설.json'));
  if (showDatasets.value.leisure) promises.push(fetchDataset('서울_레포츠.json'));

  const results = await Promise.all(promises);
  externalPlaces.value = results.flat();
  renderMarkers();
};

onMounted(async () => {
  initializeMap();
  setTimeout(() => {
    kakaoAvailable.value = !!(window as any).kakao;
  }, 1500);

  isCatalogLoading.value = true;
  aiCatalog.value = await loadPublicCatalog();
  isCatalogLoading.value = false;
});

watch(
  showDatasets,
  () => {
    loadDatasets();
  },
  { deep: true },
);
</script>

<template>
  <div class="places-view">
    <!-- Header Section -->
    <section class="header-section">
      <h1><FlaticonIcon name="map" :size="24" /> 장소 추천</h1>
      <p>공공데이터 기반 AI가 당신에게 딱 맞는 장소를 추천해드려요!</p>

      <div class="search-filter">
        <div class="search-box">
          <span class="search-icon"><FlaticonIcon name="search" :size="16" /></span>
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

    <!-- Map Section -->
    <section class="map-section">
      <h2><FlaticonIcon name="pin" :size="18" /> 추천 장소 지도</h2>
      <div class="map-controls">
        <label><input type="checkbox" v-model="showDatasets.travel" /> 여행코스</label>
        <label><input type="checkbox" v-model="showDatasets.culture" /> 문화시설</label>
        <label><input type="checkbox" v-model="showDatasets.leisure" /> 레포츠</label>
        <label style="margin-left: 12px"
          ><input type="checkbox" v-model="showCluster" /> 클러스터링 사용</label
        >
      </div>
      <div class="map-container">
        <div ref="mapContainer" class="map"></div>
      </div>
    </section>
    <div v-if="kakaoAvailable === false" class="map-error">
      <p>
        지도 로드를 실패했습니다 — 브라우저 확장(애드블록/프라이버시) 또는 네트워크가
        dapi.kakao.com을 차단하고 있을 수 있습니다.
      </p>
      <p>
        해결: 확장 비활성화 또는
        <a href="https://dapi.kakao.com" target="_blank" rel="noreferrer">dapi.kakao.com 허용</a> 후
        새로고침하세요.
      </p>
    </div>

    <section class="results-section">
      <div v-if="filteredPlaces.length > 0" class="places-grid">
        <PlaceCard
          v-for="place in filteredPlaces"
          :key="place.id"
          :place="place"
          @select="focusOnPlace"
        />
      </div>
      <div v-else class="no-results">
        <div class="empty-state">
          <span class="empty-icon"><FlaticonIcon name="search" :size="36" /></span>
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어를 시도해보세요.</p>
        </div>
      </div>
    </section>

    <!-- AI Tips Section -->
    <section class="tips-section">
      <h2><FlaticonIcon name="idea" :size="18" /> 이런 장소는 어때요?</h2>
      <p v-if="isCatalogLoading" class="catalog-loading-note">
        <span class="tip-spinner"></span> 추천에 쓸 장소 데이터를 불러오는 중이에요
      </p>

      <div class="tips-grid">
        <div v-for="tip in tips" :key="tip.id" class="tip-card">
          <div class="tip-icon">{{ tip.icon }}</div>
          <p class="tip-text">"{{ tip.text }}"</p>

          <button
            class="tip-btn"
            :disabled="tip.isLoading || isCatalogLoading"
            @click="runTipSearch(tip)"
          >
            <span v-if="tip.isLoading"><span class="tip-spinner"></span> 찾는 중</span>
            <span v-else-if="tip.results.length">다시 추천받기</span>
            <span v-else>추천 받기</span>
          </button>

          <p v-if="tip.error" class="tip-error">{{ tip.error }}</p>

          <div v-if="tip.results.length" class="tip-results">
            <div
              v-for="place in tip.results"
              :key="place.id"
              class="tip-result-card"
              tabindex="0"
              role="button"
              @click="focusOnPlace(place)"
              @keydown.enter="focusOnPlace(place)"
            >
              <div class="tip-result-top">
                <strong>{{ place.name }}</strong>
                <span class="tip-result-region">{{ place.region }}</span>
              </div>
              <p class="tip-result-desc">{{ place.description }}</p>
            </div>
          </div>
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
  border-color: #ff1493;
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
  border-color: #ff1493;
  color: #ff1493;
  background: #f9f9f9;
}

.filter-btn.active {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border-color: #ff1493;
}

/* Results Section */
.results-section {
  min-height: 300px;
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
  border: 2px solid #ffe4ec;
  border-radius: 10px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
  display: block;
}

.map-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: center;
}
.map-controls label {
  font-size: 0.9rem;
  color: #444;
}
.map-controls input[type='checkbox'] {
  margin-right: 6px;
}

.map-controls label[style] {
  margin-left: 12px;
}

.map-error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff1f3;
  border: 1px solid #ffd6e7;
  border-radius: 8px;
  color: #6b2236;
}
.map-error a {
  color: #b80f57;
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
  margin: 0 0 0.75rem;
  color: #333;
  font-weight: 600;
}

.catalog-loading-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #b23b73;
  margin: 0 0 1rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.tip-card {
  background: linear-gradient(135deg, #ffe4ec 0%, #fff5f8 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid #ffb6c1;
}

.tip-card:hover {
  box-shadow: 0 8px 20px rgba(255, 20, 147, 0.15);
  border-color: #ff69b4;
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
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.tip-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

.tip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tip-spinner {
  width: 11px;
  height: 11px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: tip-spin 0.7s linear infinite;
}

.catalog-loading-note .tip-spinner {
  border: 2px solid #ffd3e2;
  border-top-color: #ff1493;
}

@keyframes tip-spin {
  to {
    transform: rotate(360deg);
  }
}

.tip-error {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #b42318;
}

.tip-results {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;
}

.tip-result-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #ffd3e2;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tip-result-card:hover {
  border-color: #ff69b4;
  transform: translateY(-2px);
}

.tip-result-card:focus-visible {
  outline: 3px solid #ff69b4;
  outline-offset: 2px;
}

.tip-result-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.tip-result-top strong {
  font-size: 0.88rem;
  color: #333;
}

.tip-result-region {
  font-size: 0.68rem;
  font-weight: 700;
  color: #b23b73;
  background: #fff1f7;
  padding: 2px 6px;
  border-radius: 999px;
  white-space: nowrap;
}

.tip-result-desc {
  font-size: 0.78rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
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
