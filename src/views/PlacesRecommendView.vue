<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import PlaceCard from '@/components/PlaceCard.vue';
import FlaticonIcon from '@/components/FlaticonIcon.vue';
import { placesData } from '@/data/mockData';
import { loadPublicCatalog, type PublicPlace } from '@/utils/loadPublicCatalog';
import { useRouter } from 'vue-router'
import { useDraftMeetingStore } from '@/stores/draftMeeting'

const selectedType = ref<string>('전체');
const searchQuery = ref<string>('');
const types = ['전체', '러닝', '산책', '관광'];

const filteredPlaces = computed(() => {
  const q = searchQuery.value && searchQuery.value.trim()
  if (!q) {
    return placesData.filter((place) => selectedType.value === '전체' || place.type === selectedType.value)
  }
  // If Fuse is prepared, use it; otherwise fallback to simple includes
  try {
    if (fuseIndex.value && typeof fuseIndex.value.search === 'function') {
      const res = fuseIndex.value.search(q)
      const ids = new Set(res.map((r: any) => r.item?.id ?? r.item))
      return placesData.filter((p) => ids.has(p.id) && (selectedType.value === '전체' || p.type === selectedType.value))
    }
  } catch (e) {
    // ignore
  }
  const ql = q.toLowerCase()
  return placesData.filter((place) => {
    const typeMatch = selectedType.value === '전체' || place.type === selectedType.value;
    const searchMatch =
      String(place.name).toLowerCase().includes(ql) ||
      String(place.description).toLowerCase().includes(ql) ||
      String(place.type).toLowerCase().includes(ql);
    return typeMatch && searchMatch;
  });
});

const fuseIndex = ref<any>(null)

watch(
  () => searchQuery.value,
  async (q) => {
    if (!q || !q.trim()) return
    if (fuseIndex.value) return
    try {
      const Fuse = (await import('fuse.js')).default
      fuseIndex.value = new Fuse(placesData, {
        keys: ['name', 'description', 'type'],
        threshold: 0.35,
        ignoreLocation: true,
      })
    } catch (e) {
      // fuse not installed — ignore and fallback to includes
      console.warn('Fuse.js not available, falling back to simple search')
      fuseIndex.value = null
    }
  },
)

const mapContainer = ref<HTMLDivElement | null>(null);
const kakaoMap = ref<any>(null);
const markerInstances = ref<any[]>([]);
const markerClusterer = ref<any>(null);
const showCluster = ref<boolean>(true);
const externalPlaces = ref<any[]>([]);
const showDatasets = ref({ travel: false, culture: false, leisure: false });
const kakaoAvailable = ref<boolean | null>(null);
const router = useRouter()
const draftStore = useDraftMeetingStore()

// --- AI 추천 카탈로그 (전체 지역 공공데이터) ---
const aiCatalog = ref<PublicPlace[]>([]);
const isCatalogLoading = ref(true);
const aiResults = ref<PublicPlace[]>([])
const isAISearching = ref(false)

// --- 팁 키워드 ---
type Tip = {
  id: string;
  icon: string;
  text: string;
  isLoading: boolean;
  error: string;
  results: PublicPlace[];
};

// 키워드 풀 — 필요하면 자유롭게 추가/수정 가능
const tipPool = [
  { icon: '🏃‍♂️', text: '빠르게 뛸 수 있는 평탄한 길' },
  { icon: '🚶‍♀️', text: '경치 좋은 한강변' },
  { icon: '📸', text: '인생샷을 담을 수 있는 관광지' },
  { icon: '🌅', text: '노을이 예쁜 전망 명소' },
  { icon: '☕', text: '분위기 좋은 카페 거리' },
  { icon: '🌳', text: '나무 그늘 많은 산책로' },
  { icon: '🛍️', text: '쇼핑하기 좋은 번화가' },
  { icon: '🎨', text: '조용히 둘러볼 수 있는 문화시설' },
  { icon: '🌊', text: '바다나 강이 보이는 야외 장소' },
  { icon: '🌙', text: '야경이 예쁜 곳' },
  { icon: '🐾', text: '반려동물과 함께 걷기 좋은 곳' },
  { icon: '👨‍👩‍👧', text: '아이와 함께 가기 좋은 나들이 장소' },
  { icon: '🚴', text: '자전거 타기 좋은 코스' },
  { icon: '🍜', text: '먹거리가 많은 골목' },
  { icon: '🏛️', text: '역사적인 분위기가 있는 곳' },
];

const createTip = (base: { icon: string; text: string }, index: number): Tip => ({
  id: `tip-${base.text}-${index}-${Date.now()}`,
  icon: base.icon,
  text: base.text,
  isLoading: false,
  error: '',
  results: [],
});

// 배열을 랜덤 셔플 (Fisher–Yates)
const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickRandomTips = (count = 3, excludeTexts: string[] = []) => {
  const available = tipPool.filter((t) => !excludeTexts.includes(t.text));
  const pool = available.length >= count ? available : tipPool; // 후보가 부족하면 전체 풀에서
  return shuffle(pool)
    .slice(0, count)
    .map((base, index) => createTip(base, index));
};

const tips = ref<Tip[]>(pickRandomTips(3));
const isReshuffling = ref(false);

const reshuffleTips = () => {
  isReshuffling.value = true;
  const currentTexts = tips.value.map((t) => t.text);
  tips.value = pickRandomTips(3, currentTexts);
  setTimeout(() => {
    isReshuffling.value = false;
  }, 300);
};

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

const buildSearchPrompt = (question: string) => {
  return [
    '당신은 장소 추천 어시스턴트입니다. 아래 제공된 카탈로그 안의 장소만 사용하세요.',
    `카탈로그:
${JSON.stringify(aiCatalog.value, null, 2)}`,
    `사용자 질의: ${question}`,
    '가장 잘 맞는 장소의 id들을 최대 6개 골라 JSON으로 추천하세요. 형식: {"recommendedIds":["id1","id2"]}',
  ].join('\n\n')
}

const runAIBasedSearch = async (q: string) => {
  if (!q || !q.trim()) return
  if (!aiCatalog.value.length) {
    alert('추천에 사용할 장소 카탈로그가 로드되지 않았습니다. 잠시 후 다시 시도하세요.')
    return
  }
  isAISearching.value = true
  aiResults.value = []
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY가 설정되지 않았습니다.')
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    const completion = await client.chat.completions.create({
      model: 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '한국어로 답하세요. 오직 제공된 카탈로그 내 항목만 사용하세요.' },
        { role: 'user', content: buildSearchPrompt(q) },
      ],
    })
    const content = completion.choices?.[0]?.message?.content ?? '{}'
    let parsed: { recommendedIds?: unknown } | null = null
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = null
    }
    const recommendedIds = Array.isArray(parsed?.recommendedIds)
      ? parsed?.recommendedIds
      : []
    const catalogMap = new Map(aiCatalog.value.map((p) => [String(p.id), p]))
    const matched = (recommendedIds as any[])
      .map((id) => catalogMap.get(String(id)))
      .filter((p): p is PublicPlace => Boolean(p))
    aiResults.value = matched.slice(0, 8)
    renderMarkers()
  } catch (err) {
    console.error('AI search error', err)
    alert((err && (err as Error).message) || 'AI 검색 중 오류가 발생했습니다.')
  } finally {
    isAISearching.value = false
  }
}

const runTipSearch = async (tip: Tip) => {
  if (tip.isLoading) return;

  tip.isLoading = true;
  tip.error = '';

  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_OPENAI_API_KEY가 설정되지 않았습니다.');
    if (!aiCatalog.value.length)
      throw new Error('아직 장소 데이터를 불러오는 중이에요. 잠시 후 다시 시도해주세요.');

    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

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

const onCreateMeeting = async (place: any) => {
  // Normalize place object to ensure Create view gets expected fields
  const normalized = {
    id: place.id ?? place.contentid ?? place.key ?? String(Date.now()),
    name: place.name ?? place.title ?? place.facltNm ?? '장소',
    image: place.image ?? place.thumbUrl ?? '',
    lat: place.lat ?? place.mapy ?? place.latitude ?? null,
    lng: place.lng ?? place.mapx ?? place.longitude ?? null,
    description: place.description ?? place.intro ?? place.addr1 ?? '',
  }
  console.debug('[PlacesRecommend] onCreateMeeting normalized:', normalized)
  draftStore.setDraft(normalized)
  // wait for a tick so store persists/reactivity settles, then navigate
  await (await import('vue')).nextTick()
  console.debug('[PlacesRecommend] draft set, navigating to create with query placeName=', String(normalized.name))
  router.push({ name: 'create', query: { placeName: String(normalized.name) } })
}

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
  // 초기 추천: 인기(평점) 기반 상위 장소를 보여줍니다.
  try {
    const topByRating = placesData
      .slice()
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6)
    aiResults.value = topByRating
    renderMarkers()
  } catch (e) {
    console.warn('initial popularity recommendation failed', e)
  }
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
            <input v-model="searchQuery" @keyup.enter="runAIBasedSearch(searchQuery)" type="text" placeholder="장소를 검색해보세요..." />
            <button class="search-btn" @click="runAIBasedSearch(searchQuery)" :disabled="isAISearching">
              <span v-if="isAISearching">검색 중...</span>
              <span v-else>추천</span>
            </button>
          </div>

        <!-- filter buttons removed per design request -->
      </div>
    </section>

    <!-- Map Section -->
    <section class="map-section">
      <h2><FlaticonIcon name="pin" :size="18" /> 추천 장소 지도</h2>
      <!-- map controls removed per design request -->
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
      <div v-if="(aiResults.length>0) || filteredPlaces.length > 0" class="places-grid">
        <PlaceCard
          v-for="place in (aiResults.length>0 ? aiResults : filteredPlaces)"
          :key="place.id"
          :place="place"
          @select="focusOnPlace"
          @create="onCreateMeeting"
        />
      </div>
      <div v-else class="no-results">
        <div v-if="isAISearching" class="empty-state">
          <span class="empty-icon"><FlaticonIcon name="search" :size="36" /></span>
          <h3>검색 중...</h3>
        </div>
        <div v-else class="empty-state">
          <span class="empty-icon"><FlaticonIcon name="search" :size="36" /></span>
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어를 시도해보세요.</p>
        </div>
      </div>
    </section>

    <!-- AI Tips Section -->
    <section class="tips-section">
      <div class="tips-header">
        <h2><FlaticonIcon name="idea" :size="18" /> 이런 장소는 어때요?</h2>
        <button class="reshuffle-btn" :disabled="isReshuffling" @click="reshuffleTips">
          🔄 다른 키워드 보기
        </button>
      </div>

      <p v-if="isCatalogLoading" class="catalog-loading-note">
        <span class="tip-spinner"></span> 추천에 쓸 장소 데이터를 불러오는 중이에요
      </p>

      <div class="tips-grid" :class="{ 'is-reshuffling': isReshuffling }">
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
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: #ff1493;
  box-shadow: 0 0 0 3px rgba(255, 20, 147, 0.1);
}

.search-box input::placeholder {
  color: #999;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box input {
  flex: 1;
  padding: 0.9rem 0.9rem 0.9rem 2.8rem;
  border-radius: 12px 0 0 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  pointer-events: none;
}

.search-btn {
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  border-radius: 0 12px 12px 0;
  cursor: pointer;
  margin-left: -1px;
}
.search-btn:disabled { opacity: 0.6; cursor: not-allowed }

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
  white-space: nowrap;
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
  flex-wrap: wrap;
  row-gap: 0.5rem;
}
.map-controls label {
  font-size: 0.9rem;
  color: #444;
  white-space: nowrap;
}
.map-controls input[type='checkbox'] {
  margin-right: 6px;
}

.map-controls .cluster-label {
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

.tips-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  position: relative;
}

.tips-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.reshuffle-btn {
  position: absolute;
  right: 0;
  border: 1px solid #ffd3e2;
  background: white;
  color: #b23b73;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.reshuffle-btn:hover:not(:disabled) {
  border-color: #ff69b4;
  background: #fff7fb;
}

.reshuffle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.catalog-loading-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #b23b73;
  margin: 0 0 1rem;
  text-align: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  align-items: start;
  transition: opacity 0.2s ease;
}

.tips-grid.is-reshuffling {
  opacity: 0.4;
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
  flex-wrap: wrap;
}

.tip-result-top strong {
  font-size: 0.88rem;
  color: #333;
  min-width: 0;
  overflow-wrap: break-word;
}

.tip-result-region {
  font-size: 0.68rem;
  font-weight: 700;
  color: #b23b73;
  background: #fff1f7;
  padding: 2px 6px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tip-result-desc {
  font-size: 0.78rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* ================= Responsive ================= */

/* 태블릿 */
@media (max-width: 1024px) {
  .places-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .tips-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .map-container {
    height: 240px;
  }
}

/* 모바일 */
@media (max-width: 768px) {
  .places-view {
    gap: 2rem;
  }

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

  .map-section {
    padding: 1.2rem;
  }

  .map-controls {
    gap: 0.5rem 0.9rem;
  }

  .map-controls .cluster-label {
    margin-left: 0;
  }

  .map-container {
    height: 200px;
  }

  .tips-section {
    padding: 1.5rem;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}

/* 작은 모바일 */
@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.3rem;
    flex-wrap: wrap;
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

  .map-section {
    padding: 1rem;
  }

  .map-controls {
    font-size: 0.85rem;
    gap: 0.4rem 0.7rem;
  }

  .map-controls label {
    font-size: 0.82rem;
  }

  .map-container {
    height: 180px;
  }

  .tips-section {
    padding: 1.2rem;
  }

  .tip-card {
    padding: 1.1rem;
  }

  .tip-icon {
    font-size: 2rem;
  }

  .tips-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .reshuffle-btn {
    position: static;
  }

  .tip-result-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
