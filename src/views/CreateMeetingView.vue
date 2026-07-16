<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { ref, onMounted } from 'vue';
import { placesData } from '@/data/mockData';
import { useRouter, useRoute } from 'vue-router';
import { useMeetingStore } from '@/stores/meeting';
import { useDraftMeetingStore } from '@/stores/draftMeeting';
import FlaticonIcon from '@/components/FlaticonIcon.vue';

const router = useRouter();
const meetingStore = useMeetingStore();
const route = useRoute();
const draftStore = useDraftMeetingStore();

const formData = ref({
  title: '',
  category: 'female' as 'male' | 'female' | 'mixed',
  location: '',
  date: '',
  time: '',
  maxParticipants: 10,
  description: '',
  difficulty: '초급' as '초급' | '중급' | '상급',
});

const selectedPlaceId = ref<number | null>(null);
const selectedCoords = ref<{ lat: number; lon: number } | null>(null);
const placeQuery = ref('');
const suggestions = ref<any[]>([]);
const placeInput = ref<HTMLInputElement | null>(null);
const dropdownStyle = ref<any>({});

onMounted(() => {
  const placeName = (route.query.placeName || route.query.place) as string | undefined;
  if (placeName && placeName.trim()) {
    const name = String(placeName);
    placeQuery.value = name;
    formData.value.location = name;
    // if a draft with coords exists, use it
    const d = draftStore.draft;
    if (d && d.lat != null && d.lng != null) {
      selectedCoords.value = { lat: Number(d.lat), lon: Number(d.lng) };
    }
    // try to match a local place to set selectedPlaceId
    const match = placesData.find((p) => p.name === name);
    if (match) selectedPlaceId.value = match.id;
    // update dropdown position in case UI needs it
    setTimeout(updateDropdownPosition, 0);
  }
});

const updateDropdownPosition = () => {
  const el = placeInput.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  dropdownStyle.value = {
    position: 'fixed',
    top: `${r.bottom + 6}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    zIndex: 9999,
  };
};
window.addEventListener('resize', updateDropdownPosition);
window.addEventListener('scroll', updateDropdownPosition, true);

const onPlaceInput = (q: string) => {
  placeQuery.value = q;
  suggestions.value = [];
  if (!q || q.trim().length < 1) return;
  const ql = q.toLowerCase();
  // show local matches only (no full list on empty input)
  suggestions.value = placesData.filter((p) => p.name.toLowerCase().includes(ql)).slice(0, 8);
  // update dropdown position
  setTimeout(updateDropdownPosition, 0);
  // if no local suggestions, try Kakao keyword search
  if (suggestions.value.length === 0) {
    const kakao = (window as any).kakao;
    if (kakao && kakao.maps && kakao.maps.services) {
      const ps = new kakao.maps.services.Places();
      ps.keywordSearch(q, (data: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          suggestions.value = data.slice(0, 8).map((d: any) => ({
            name: d.place_name,
            lat: Number(d.y),
            lon: Number(d.x),
            source: 'kakao',
          }));
        }
      });
    }
  }
};

const pickSuggestion = (p: any) => {
  if (p.source === 'kakao') {
    // remote suggestion: no local id
    selectedPlaceId.value = null;
    selectedCoords.value = { lat: p.lat, lon: p.lon };
    formData.value.location = p.name;
    placeQuery.value = p.name;
    suggestions.value = [];
  } else {
    selectedPlaceId.value = p.id;
    formData.value.location = p.name;
    selectedCoords.value = p.lat && p.lng ? { lat: p.lat, lon: p.lng } : null;
    placeQuery.value = p.name;
    suggestions.value = [];
  }
};

const clearSelection = () => {
  selectedPlaceId.value = null;
  selectedCoords.value = null;
};

const checkWeatherForCoords = async (
  lat: number,
  lon: number,
  dateStr: string,
  timeStr?: string,
) => {
  const key = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!key) {
    console.warn('VITE_OPENWEATHER_KEY missing');
    return { ok: true };
  }
  try {
    // Try 5-day / 3-hour forecast first (more precise for specific times)
    const targetDate = timeStr
      ? new Date(`${dateStr}T${timeStr}:00`)
      : new Date(`${dateStr}T00:00:00`);
    const targetTs = Math.floor(targetDate.getTime() / 1000);

    const fcRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${key}`,
    );
    if (fcRes.ok) {
      const fc = await fcRes.json();
      const list = fc.list || [];
      if (list.length > 0) {
        // find nearest forecast entry
        let nearest: any = null;
        let bestDiff = Infinity;
        for (const it of list) {
          const diff = Math.abs(it.dt - targetTs);
          if (diff < bestDiff) {
            bestDiff = diff;
            nearest = it;
          }
        }
        // if nearest entry is within 6 hours, use it
        if (nearest && bestDiff <= 6 * 3600) {
          const weatherMain =
            (nearest.weather && nearest.weather[0] && nearest.weather[0].main) || '';
          const weatherDesc =
            (nearest.weather && nearest.weather[0] && nearest.weather[0].description) || '';
          const pop = nearest.pop || 0;
          const rain =
            nearest.rain && (nearest.rain['3h'] || nearest.rain['1h'])
              ? nearest.rain['3h'] || nearest.rain['1h']
              : 0;
          const snow =
            nearest.snow && (nearest.snow['3h'] || nearest.snow['1h'])
              ? nearest.snow['3h'] || nearest.snow['1h']
              : 0;
          const wind = nearest.wind && nearest.wind.speed ? nearest.wind.speed : 0;
          const hasRain = weatherMain.toLowerCase().includes('rain') || rain > 0;
          const hasSnow = weatherMain.toLowerCase().includes('snow') || snow > 0;
          const isThunder = weatherMain.toLowerCase().includes('thunder');
          const summary = `${weatherDesc}${nearest.main && nearest.main.temp ? ', ' + Math.round(nearest.main.temp) + '°C' : ''}`;
          const bad = isThunder || (hasRain && (pop >= 0.5 || rain >= 5)) || hasSnow || wind >= 15;
          return { ok: !bad, summary, hasRain, hasSnow, pop, wind };
        }
      }
    }

    // Fallback: use One Call daily forecast (for dates beyond 5 days or if forecast unavailable)
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${key}`,
    );
    if (!res.ok) return { ok: true };
    const data = await res.json();
    const daily = data.daily || [];
    const target = new Date(dateStr + 'T00:00:00');
    for (const d of daily) {
      const dt = new Date(d.dt * 1000);
      if (
        dt.getUTCFullYear() === target.getUTCFullYear() &&
        dt.getUTCMonth() === target.getUTCMonth() &&
        dt.getUTCDate() === target.getUTCDate()
      ) {
        const weatherMain = (d.weather && d.weather[0] && d.weather[0].main) || '';
        const weatherDesc = (d.weather && d.weather[0] && d.weather[0].description) || '';
        const hasRain = 'rain' in d || weatherMain.toLowerCase().includes('rain');
        const hasSnow = 'snow' in d || weatherMain.toLowerCase().includes('snow');
        const pop = d.pop || 0;
        const summary = `${weatherDesc}${d.temp ? ', ' + Math.round(d.temp.day) + '°C' : ''}`;
        return { ok: !(hasRain || hasSnow || pop >= 0.5), summary, hasRain, hasSnow, pop };
      }
    }
    return { ok: true };
  } catch (e) {
    console.error('checkWeatherForCoords error', e);
    return { ok: true };
  }
};

// --- Warning modal state & helper ---
const showWarningModal = ref(false);
const warningTitle = ref('');
const warningBody = ref('');
let warningResolver: ((proceed: boolean) => void) | null = null;
const showWarning = (title: string, body: string) => {
  warningTitle.value = title;
  warningBody.value = body;
  showWarningModal.value = true;
  return new Promise<boolean>((resolve) => {
    warningResolver = resolve;
  });
};
const onWarningConfirm = () => {
  showWarningModal.value = false;
  if (warningResolver) warningResolver(true);
  warningResolver = null;
};
const onWarningCancel = () => {
  showWarningModal.value = false;
  if (warningResolver) warningResolver(false);
  warningResolver = null;
};
// --- Duplicate-check modal state & helper ---
const showDuplicateModal = ref(false);
const duplicateMatches = ref<any[]>([]);
let duplicateResolver: ((proceed: boolean) => void) | null = null;
const showDuplicate = (matches: any[]) => {
  duplicateMatches.value = matches;
  showDuplicateModal.value = true;
  return new Promise<boolean>((resolve) => {
    duplicateResolver = resolve;
  });
};
const onDuplicateConfirm = () => {
  showDuplicateModal.value = false;
  if (duplicateResolver) duplicateResolver(true);
  duplicateResolver = null;
};
const onDuplicateCancel = () => {
  showDuplicateModal.value = false;
  if (duplicateResolver) duplicateResolver(false);
  duplicateResolver = null;
};
const isDev = !!import.meta.env.DEV;

// (success modal removed - creation proceeds immediately on confirm)

const geocodeOWM = async (query: string) => {
  const key = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${key}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: data[0].lat, lon: data[0].lon };
  } catch (e) {
    console.error('geocodeOWM error', e);
    return null;
  }
};

const handleSubmit = async () => {
  // if no place selected from list, use free text input
  if (selectedPlaceId.value === null) {
    formData.value.location = placeQuery.value;
  }

  if (!formData.value.title || !formData.value.location || !formData.value.date) {
    alert('필수 항목을 입력해주세요');
    return;
  }

  // Check for similar existing meetings
  const all = meetingStore.getAllMeetings();
  const qTitle = formData.value.title.trim().toLowerCase();
  const qLoc = formData.value.location.trim().toLowerCase();
  const qDate = formData.value.date;
  const similar = all.filter((m) => {
    const t = (m.title || '').toLowerCase();
    const l = (m.location || '').toLowerCase();
    // similarity rules: exact title contains OR same location and same date
    return (
      (t && qTitle && (t.includes(qTitle) || qTitle.includes(t))) ||
      (l === qLoc && m.date === qDate)
    );
  });
  if (similar.length > 0) {
    const proceed = await showDuplicate(similar);
    if (!proceed) return;
  }

  // If user selected a place from local JSON or selected remote suggestion (has coords), use its coords to check weather
  let weatherText = '확인되지 않음';
  if (selectedPlaceId.value !== null) {
    const p = placesData.find((x) => x.id === selectedPlaceId.value);
    if (p && p.lat && p.lng) {
      const w = await checkWeatherForCoords(p.lat, p.lng, formData.value.date, formData.value.time);
      if (w && w.ok === false) {
        const kind = w.hasRain ? '비' : w.hasSnow ? '눈' : '강수';
        const title = '예상 악천후가 감지되었습니다';
        const body = `예상: ${w.summary || kind} — 이 날 ${kind}이 올 수 있습니다. 그래도 모임을 생성하시겠습니까?`;
        const proceed = await showWarning(title, body);
        if (!proceed) return;
      }
      weatherText = w && w.summary ? w.summary : '확인되지 않음';
    }
  } else if (selectedCoords.value) {
    const w = await checkWeatherForCoords(
      selectedCoords.value.lat,
      selectedCoords.value.lon,
      formData.value.date,
      formData.value.time,
    );
    if (w && w.ok === false) {
      const kind = w.hasRain ? '비' : w.hasSnow ? '눈' : '강수';
      const title = '예상 악천후가 감지되었습니다';
      const body = `예상: ${w.summary || kind} — 이 날 ${kind}이 올 수 있습니다. 그래도 모임을 생성하시겠습니까?`;
      const proceed = await showWarning(title, body);
      if (!proceed) return;
    }
    weatherText = w && w.summary ? w.summary : '확인되지 않음';
  } else {
    // no selected place or coords -> try geocoding free text
    if (placeQuery.value && placeQuery.value.trim().length > 0) {
      const geo = await geocodeOWM(placeQuery.value.trim());
      if (geo) {
        const w = await checkWeatherForCoords(
          geo.lat,
          geo.lon,
          formData.value.date,
          formData.value.time,
        );
        if (w && w.ok === false) {
          const kind = w.hasRain ? '비' : w.hasSnow ? '눈' : '강수';
          const title = '예상 악천후가 감지되었습니다';
          const body = `예상: ${w.summary || kind} — 이 날 ${kind}이 올 수 있습니다. 그래도 모임을 생성하시겠습니까?`;
          const proceed = await showWarning(title, body);
          if (!proceed) return;
        }
        weatherText = w && w.summary ? w.summary : '확인되지 않음';
      }
    }
  }

  // At this point: weatherText is determined and any warning flow handled.
  // Save meeting immediately (if user confirmed warning earlier, showWarning already resolved)
  meetingStore.addMeeting({
    title: formData.value.title,
    category: formData.value.category,
    location: formData.value.location,
    date: formData.value.date,
    time: formData.value.time,
    maxParticipants: formData.value.maxParticipants,
    description: formData.value.description,
    weather: weatherText,
    difficulty: formData.value.difficulty,
    image: '🎯',
  });

  // debug: log last meeting saved
  try {
    const stored = JSON.parse(localStorage.getItem('meetings') || '[]');
    console.log('Stored meetings last:', stored[0]);
  } catch (e) {}

  router.push('/community');
};
</script>

<template>
  <div class="create-meeting-view">
    <!-- Header -->
    <section class="header-section">
      <h1><FlaticonIcon name="sparkles" :size="24" /> 새 모임 만들기</h1>
      <p>함께할 사람들과의 특별한 순간을 시작하세요!</p>
    </section>

    <!-- Warning Modal -->
    <div v-if="showWarningModal" class="wm-backdrop">
      <div class="wm-card">
        <div class="wm-header">
          <div class="wm-icon">⚠️</div>
          <div class="wm-title">{{ warningTitle }}</div>
        </div>
        <div class="wm-body">{{ warningBody }}</div>
        <div class="wm-actions">
          <button class="wm-btn cancel" @click="onWarningCancel">취소</button>
          <button class="wm-btn confirm" @click="onWarningConfirm">그래도 생성</button>
        </div>
      </div>

      <!-- success modal removed -->
    </div>

    <!-- Duplicate check modal -->
    <div v-if="showDuplicateModal" class="wm-backdrop">
      <div class="wm-card">
        <div class="wm-header">
          <div class="wm-icon">🔎</div>
          <div class="wm-title">비슷한 모임이 있습니다</div>
        </div>
        <div class="wm-body">
          <p>이미 비슷한 모임이 존재합니다. 아래 모임을 확인해보시겠어요?</p>
          <ul>
            <li v-for="m in duplicateMatches" :key="m.id" style="margin: 8px 0">
              <strong>{{ m.title }}</strong>
              <div style="font-size: 0.95rem; color: #666; margin-top: 4px">
                {{ m.location }} · {{ m.date }} {{ m.time }} —
                <a :href="`/community?highlight=${m.id}`" style="color: #ff1493; margin-left: 6px"
                  >모임 보기</a
                >
              </div>
            </li>
          </ul>
        </div>
        <div class="wm-actions">
          <button class="wm-btn cancel" @click="onDuplicateCancel">취소</button>
          <button class="wm-btn confirm" @click="onDuplicateConfirm">그래도 생성</button>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- Basic Info Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon"><FlaticonIcon name="write" :size="20" /></span>
          <h2>기본 정보</h2>
        </div>

        <div class="form-group">
          <label>모임 제목 *</label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="예: 일요일 아침 한강 조깅"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>모임 분류 *</label>
            <select v-model="formData.category" required>
              <option value="female">👩 여자 모임</option>
              <option value="male">👨 남자 모임</option>
              <option value="mixed">👥 혼성 모임</option>
            </select>
          </div>
          <div class="form-group">
            <label>난이도 *</label>
            <select v-model="formData.difficulty" required>
              <option>초급</option>
              <option>중급</option>
              <option>상급</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Location & Date Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon"><FlaticonIcon name="pin" :size="20" /></span>
          <h2>위치 & 일시</h2>
        </div>

        <div class="form-group autocomplete">
          <label>장소 *</label>
          <input
            ref="placeInput"
            v-model="placeQuery"
            @input="onPlaceInput(($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="검색어를 입력하면 장소가 표시됩니다 (예: 여의도 한강공원)"
          />
          <ul v-if="suggestions.length" class="suggestions-list" :style="dropdownStyle">
            <li v-for="(s, idx) in suggestions" :key="idx" @click="pickSuggestion(s)">
              {{ s.name }}
            </li>
          </ul>
          <div v-if="selectedPlaceId !== null" class="selected-place">
            <div class="place-preview">
              <div class="emoji">{{ placesData.find((x) => x.id === selectedPlaceId)?.image }}</div>
              <div class="info">
                <div class="name">{{ placesData.find((x) => x.id === selectedPlaceId)?.name }}</div>
                <div class="desc">
                  {{ placesData.find((x) => x.id === selectedPlaceId)?.description }}
                </div>
                <button type="button" @click="clearSelection">직접 입력으로 변경</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>날짜 *</label>
            <input v-model="formData.date" type="date" required />
          </div>
          <div class="form-group">
            <label>시간 *</label>
            <input v-model="formData.time" type="time" required />
          </div>
        </div>
      </div>

      <!-- Details Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon"><FlaticonIcon name="group" :size="20" /></span>
          <h2>상세 정보</h2>
        </div>

        <div class="form-group">
          <label>최대 참가인원</label>
          <input v-model.number="formData.maxParticipants" type="number" min="2" max="50" />
        </div>

        <div class="form-group">
          <label>모임 설명</label>
          <textarea
            v-model="formData.description"
            placeholder="모임에 대해 자세히 설명해주세요. (예: 페이스, 복장, 특별한 요청사항 등)"
            rows="5"
          ></textarea>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="form-actions">
        <button type="submit" class="btn-submit">
          <FlaticonIcon name="sparkles" :size="16" /> 모임 만들기
        </button>
        <button
          v-if="isDev"
          type="button"
          class="btn-preview"
          @click.prevent="
            showWarning(
              '예상 악천후가 감지되었습니다',
              '예상: 많은 비 — 이 날 비가 올 수 있습니다. 그래도 모임을 생성하시겠습니까?',
            )
          "
          style="margin-left: 12px"
        >
          경고 미리보기
        </button>
      </div>
    </form>

    <!-- Tips Section -->
    <section class="tips-section">
      <h3><FlaticonIcon name="idea" :size="18" /> 모임 작성 팁</h3>
      <div class="tips-list">
        <div class="tip-item">
          <span class="tip-number">1</span>
          <p>명확한 제목으로 더 많은 사람들을 모을 수 있어요!</p>
        </div>
        <div class="tip-item">
          <span class="tip-number">2</span>
          <p>상세한 설명은 참가자들의 신뢰를 높입니다.</p>
        </div>
        <div class="tip-item">
          <span class="tip-number">3</span>
          <p>정확한 시간과 위치로 혼선을 없애세요.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.create-meeting-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
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
  margin: 0;
}

/* Form Container */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

/* Form Section */
.form-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  font-size: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #ff1493;
  font-weight: 600;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.6rem;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.9rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: white;
  color: #333;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #999;
}

.selected-place {
  margin-top: 0.75rem;
}
.place-preview {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.place-preview .emoji {
  font-size: 1.8rem;
}
.place-preview .name {
  font-weight: 700;
}
.place-preview .desc {
  color: #666;
  font-size: 0.9rem;
}

.autocomplete {
  position: relative;
}

.autocomplete .suggestions-list {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  max-height: 220px;
  overflow: auto;
  z-index: 40;
  padding: 0;
  margin: 0;
  list-style: none;
}
.autocomplete .suggestions-list li {
  padding: 0.7rem 1rem;
  cursor: pointer;
}
.autocomplete .suggestions-list li:hover {
  background: #fff5f8;
}
.selected-place button {
  margin-top: 0.5rem;
  background: transparent;
  border: 1px solid #ffd6e7;
  color: #ff1493;
  padding: 6px 8px;
  border-radius: 6px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff1493;
  box-shadow: 0 0 0 3px rgba(255, 20, 147, 0.1);
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF1493' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.9rem center;
  background-size: 1.2em;
  padding-right: 2.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.btn-submit {
  padding: 1.1rem 3rem;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.2);
}

.btn-submit:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(255, 20, 147, 0.3);
}

.btn-submit:active {
  transform: translateY(-1px);
}

.btn-preview {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed #ffb6c1;
  background: #fff;
  color: #ff1493;
  font-weight: 700;
}

/* Tips Section */
.tips-section {
  background: linear-gradient(135deg, #ffe4ec 0%, #fff5f8 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid #ffb6c1;
}

.tips-section h3 {
  margin: 0 0 1.5rem;
  font-size: 1.2rem;
  color: #333;
  font-weight: 600;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.tip-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.tip-item p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 1024px) {
  .form-container {
    max-width: 100%;
  }

  .form-section {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.8rem;
    font-size: 0.9rem;
  }

  .btn-submit {
    padding: 1rem 2rem;
    font-size: 0.95rem;
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

  .form-section {
    padding: 1rem;
  }

  .section-header {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .section-icon {
    font-size: 1.3rem;
  }

  .section-header h2 {
    font-size: 1.05rem;
  }

  .form-group label {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.7rem;
    font-size: 0.9rem;
  }

  .btn-submit {
    padding: 0.9rem 1.8rem;
    font-size: 0.9rem;
  }

  .tips-section h3 {
    font-size: 1.05rem;
  }

  .tip-item p {
    font-size: 0.9rem;
  }
}

/* Warning modal styles */
.wm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}
.wm-card {
  width: 420px;
  max-width: calc(100% - 32px);
  background: white;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}
.wm-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f5f5f5;
}
.wm-icon {
  font-size: 26px;
}
.wm-title {
  font-weight: 800;
  color: #333;
  font-size: 1.05rem;
}
.wm-body {
  padding: 18px 20px;
  color: #444;
  line-height: 1.5;
  font-size: 0.975rem;
}
.wm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 12px 16px 20px;
}
.wm-btn {
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}
.wm-btn.cancel {
  background: #fff;
  color: #666;
  border: 1px solid #eee;
}
.wm-btn.confirm {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: #fff;
}
.wm-btn.confirm:hover {
  transform: translateY(-2px);
}

/* Success modal styles */
/* success modal removed */
</style>
