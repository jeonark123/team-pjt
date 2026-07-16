<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
// OpenAI is imported dynamically to avoid bundling/node-runtime errors in the browser.
import { useRecommendedPlaces } from '@/composables/useRecommendedPlaces';

const { setRecommendedPlaces, isChatOpen } = useRecommendedPlaces();

type Place = {
  id: string;
  name: string;
  region: string;
  category: string;
  tags: string[];
  description: string;
  address: string;
  lat?: number;
  lng?: number;
  rating?: number;
  type?: string;
};

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  places?: Place[];
  time: string;
};

const props = defineProps<{ isOpen?: boolean }>();
const emit = defineEmits<{ (e: 'update:isOpen', value: boolean): void }>();

const input = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const places = ref<Place[]>([]);
const isOpen = computed({
  get: () => props.isOpen ?? false,
  set: (value: boolean) => emit('update:isOpen', value),
});
const unreadCount = ref(0);
const showScrollButton = ref(false);

const messagesEl = ref<HTMLDivElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

const formatTime = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! 데이트나 모임에 어울리는 장소를 추천해드릴게요. 원하는 지역, 분위기, 인원수를 말해주시면 바로 맞춰드릴게요 ✨',
    time: formatTime(),
  },
]);

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

// 지역별 최대 개수 (전체 카탈로그 크기 조절용)
const PER_REGION_LIMIT = 40;

// 사용자 질문에서 지역 키워드 감지용
const REGION_KEYWORDS = ['서울', '부산', '광주', '전라', '대전', '충청', '구미', '경북'];

const placeMap = computed(() => new Map(places.value.map((place) => [place.id, place])));

// 실제 로드된 지역 목록으로 퀵 프롬프트를 동적으로 구성
const availableRegions = computed(() => {
  const set = new Set(places.value.map((place) => place.region));
  return Array.from(set);
});

const quickPrompts = computed(() =>
  availableRegions.value.length
    ? availableRegions.value.map((region) => `${region}에서 데이트 코스 추천해줘`)
    : ['서울에서 첫 데이트 코스 추천해줘'],
);

const selectQuickPrompt = (prompt: string) => {
  input.value = prompt;
  inputEl.value?.focus();
};

// --- 스크롤 관리 ---
const isNearBottom = () => {
  const el = messagesEl.value;
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
};

const scrollToBottom = (smooth = true) => {
  const el = messagesEl.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  showScrollButton.value = false;
};

const handleScroll = () => {
  showScrollButton.value = !isNearBottom();
};

watch(
  () => messages.value.length,
  async () => {
    const shouldStick = isNearBottom();
    await nextTick();
    if (shouldStick) {
      scrollToBottom();
    } else {
      showScrollButton.value = true;
    }
  },
);

watch(isLoading, async (loading) => {
  if (loading) {
    await nextTick();
    if (isNearBottom()) scrollToBottom();
  }
});

// --- 열기/닫기 ---
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    unreadCount.value = 0;
    nextTick(() => {
      scrollToBottom(false);
      inputEl.value?.focus();
    });
  }
};

watch(isChatOpen, (open) => {
  if (open) {
    isOpen.value = true;
    unreadCount.value = 0;
    nextTick(() => {
      scrollToBottom(false);
      inputEl.value?.focus();
    });
    isChatOpen.value = false; // 한 번 열고 나면 리셋 (재사용 가능하게)
  }
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// --- 장소 데이터 로드 ---
const loadPlaces = async () => {
  const regionFiles = [
    { label: '서울', path: '/data/서울/서울_관광지.json' },
    { label: '서울', path: '/data/서울/서울_쇼핑.json' },
    { label: '서울', path: '/data/서울/서울_문화시설.json' },
    { label: '부산', path: '/data/부산/부산_관광지.json' },
    { label: '부산', path: '/data/부산/부산_쇼핑.json' },
    { label: '부산', path: '/data/부산/부산_문화시설.json' },
    { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_관광지.json' },
    { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_쇼핑.json' },
    { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_문화시설.json' },
    { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_관광지.json' },
    { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_쇼핑.json' },
    { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_문화시설.json' },
    { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_관광지.json' },
    { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_쇼핑.json' },
    { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_문화시설.json' },
  ];

  const extractItems = (dataset: any): any[] => {
    if (!dataset) return [];
    if (Array.isArray(dataset)) return dataset;
    if (Array.isArray(dataset.items)) return dataset.items;
    const nested = dataset?.response?.body?.items?.item;
    if (nested) return Array.isArray(nested) ? nested : [nested];
    if (Array.isArray(dataset.result?.items)) return dataset.result.items;
    if (Array.isArray(dataset.data)) return dataset.data;
    return [];
  };

  try {
    const responses = await Promise.all(regionFiles.map((file) => fetch(file.path)));
    const datasets = await Promise.all(
      responses.map(async (response, idx) => {
        const regionFile = regionFiles[idx];
        if (!response.ok) {
          console.warn('Failed to fetch', regionFile?.path, response.status);
          return null;
        }
        try {
          return await response.json();
        } catch (e) {
          console.warn('Invalid JSON:', regionFile?.path, e);
          return null;
        }
      }),
    );

    const itemsWithLabel = datasets
      .map((dataset: any, index: number) => {
        const items = extractItems(dataset);
        const regionFile = regionFiles[index];
        if (!items || items.length === 0) {
          console.warn('No items extracted from', regionFile?.path, dataset);
        }
        return (items || []).map((item: any) => ({ item, label: regionFile?.label ?? '알 수 없음' }));
      })
      .flat();

    // 지역별로 그룹핑 후, 지역마다 최대 PER_REGION_LIMIT개씩만 남기고 합침
    const grouped = new Map<string, { item: any; label: string }[]>();
    itemsWithLabel.forEach(({ item, label }) => {
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push({ item, label });
    });

    const balancedItems = Array.from(grouped.values()).flatMap((group) =>
      group.slice(0, PER_REGION_LIMIT),
    );

    const publicPlaces: Place[] = balancedItems.map(({ item, label }) => {
      const rawRating = item.overallRating ?? item.avgRating ?? item.rating;
      const rawType = item.type ?? item.cat1 ?? item.lclsSystm2;

      return {
        id: `public-${item.contentid ?? item.CONTENTID ?? item.id ?? item.title ?? Math.random().toString(36).slice(2)}`,
        name: item.title ?? item.name ?? item.facltNm ?? '이름 없음',
        region: label,
        category: '공공데이터',
        tags: ['공공데이터', '추천지향'],
        rating: rawRating !== undefined ? Number(rawRating) : undefined,
        type: rawType !== undefined ? String(rawType) : undefined,
        description:
          item.addr1 ?? item.description ?? item.intro ?? '공공데이터 기반 추천 장소입니다.',
        address: item.addr1 ?? item.addr ?? item.주소 ?? '주소 정보 없음',
        lat: item.mapy ? Number(item.mapy) : undefined,
        lng: item.mapx ? Number(item.mapx) : undefined,
      };
    });

    places.value = publicPlaces;
  } catch (e) {
    console.error('loadPlaces error', e);
    places.value = [];
  }
};

onMounted(() => {
  loadPlaces();
});

const buildPrompt = (question: string) => {
  const recentContext = messages.value.slice(-6).map((message) => ({
    role: message.role,
    content: message.text,
  }));

  const mentionedRegion = REGION_KEYWORDS.find((keyword) => question.includes(keyword));
  const filteredPlaces = mentionedRegion
    ? places.value.filter((place) => place.region.includes(mentionedRegion))
    : places.value;

  return [
    '당신은 데이트와 모임 장소를 추천하는 한국어 챗봇입니다.',
    '반드시 아래 public/data 폴더의 JSON 파일에 있는 장소만 참고하고, 데이터에 없는 장소를 만들어내지 마세요.',
    '답변은 따뜻하고 자연스럽게, 한두 문장으로 요약하되 추천 이유를 함께 적어주세요.',
    `public/data 카탈로그:
${JSON.stringify(filteredPlaces, null, 2)}`,
    `대화 맥락:
${JSON.stringify(recentContext, null, 2)}`,
    `사용자 질문: ${question}`,
    '반드시 JSON만 답하세요. 형식은 {"reply":"...","recommendedIds":["id1","id2"]} 입니다.',
  ].join('\n\n');
};

const findPlaceById = (id: unknown): Place | undefined => {
  const s = String(id);
  let p = placeMap.value.get(s);
  if (p) return p;
  p = placeMap.value.get(`public-${s}`);
  if (p) return p;
  const n = Number(s);
  if (!Number.isNaN(n)) {
    p = placeMap.value.get(String(n)) || placeMap.value.get(`public-${n}`);
    if (p) return p;
  }
  p = places.value.find((pl) => String(pl.id).endsWith(s));
  if (p) return p;
  return undefined;
};

const handleSubmit = async () => {
  const question = input.value.trim();
  if (!question || isLoading.value) return;

  messages.value.push({ id: Date.now(), role: 'user', text: question, time: formatTime() });
  input.value = '';
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

    const completion = await client.chat.completions.create({
      model: 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국어로 답하고, 오직 제공된 public/data 폴더의 JSON 파일 안에 있는 장소만 추천해야 합니다. 답변은 따뜻하고 자연스러운 톤으로, 반드시 JSON 객체만 반환하세요.',
        },
        {
          role: 'user',
          content: buildPrompt(question),
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? '{}';

    let parsed: { reply?: string; recommendedIds?: unknown } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }

    const reply = parsed?.reply || content;
    const recommendedIds = Array.isArray(parsed?.recommendedIds)
      ? parsed.recommendedIds.filter(
          (id: unknown) => typeof id === 'string' || typeof id === 'number',
        )
      : [];

    const recommendedPlaces = recommendedIds
      .map((id) => findPlaceById(id))
      .filter((place): place is Place => Boolean(place));

    const unmatched = recommendedIds.filter((id) => !findPlaceById(id));
    if (unmatched.length) console.warn('Unmatched recommendedIds:', unmatched);

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: reply,
      places: recommendedPlaces,
      time: formatTime(),
    });

    // HomeView가 볼 수 있도록 공유 상태에 반영
    if (recommendedPlaces.length) {
      setRecommendedPlaces(recommendedPlaces, question);
    }

    if (!isOpen.value) unreadCount.value += 1;
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: '잠시 추천을 준비하기 어려웠어요. 잠시 후 다시 시도해 주세요. 지역과 분위기만 알려주셔도 더 잘 맞춰드릴게요.',
      time: formatTime(),
    });
    if (!isOpen.value) unreadCount.value += 1;
  } finally {
    isLoading.value = false;
    nextTick(() => inputEl.value?.focus());
  }
};
</script>

<template>
  <div class="chatbot-shell">
    <button
      class="chatbot-toggle"
      @click="toggleChat"
      :aria-expanded="isOpen"
      aria-label="장소 추천 챗봇 열기/닫기"
    >
      <span v-if="!isOpen">💬</span>
      <span v-else>✕</span>
      <span v-if="!isOpen && unreadCount > 0" class="badge">{{
        unreadCount > 9 ? '9+' : unreadCount
      }}</span>
    </button>

    <transition name="pop">
      <section v-if="isOpen" class="chatbot-card">
        <div class="chatbot-header">
          <div class="header-text">
            <p class="eyebrow">Local Mate AI</p>
            <h3>장소 추천 챗봇</h3>
          </div>
          <span class="status-dot" title="온라인"></span>
        </div>
        <p class="subtitle">데이트·모임에 어울리는 장소를 자연스럽게 추천해드려요.</p>

        <div class="quick-prompts" v-if="!messages.some((message) => message.role === 'user')">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="quick-prompt"
            @click="selectQuickPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>

        <div class="messages-wrap">
          <div class="messages" ref="messagesEl" @scroll="handleScroll" aria-live="polite">
            <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
              <div class="bubble-label">
                <span class="avatar" :class="message.role">{{
                  message.role === 'user' ? '나' : 'AI'
                }}</span>
                <span class="label-name">{{ message.role === 'user' ? '나' : '로컬 메이트' }}</span>
                <span class="label-time">{{ message.time }}</span>
              </div>
              <p class="bubble-text">{{ message.text }}</p>

              <div v-if="message.places?.length" class="place-list">
                <article v-for="place in message.places" :key="place.id" class="place-card">
                  <div class="place-card-top">
                    <h4>{{ place.name }}</h4>
                    <span class="pill">{{ place.region }}</span>
                  </div>
                  <p class="meta">{{ place.category }}</p>
                  <p class="tags">{{ place.tags.join(' · ') }}</p>
                  <p>{{ place.description }}</p>
                  <p class="address">📍 {{ place.address }}</p>
                </article>
              </div>
            </div>

            <div v-if="isLoading" class="message assistant typing-row">
              <div class="bubble-label">
                <span class="avatar assistant">AI</span>
                <span class="label-name">로컬 메이트</span>
              </div>
              <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </div>

          <transition name="fade">
            <button v-if="showScrollButton" class="scroll-to-bottom" @click="scrollToBottom()">
              ↓ 새 메시지
            </button>
          </transition>
        </div>

        <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>

        <form class="composer" @submit.prevent="handleSubmit">
          <input
            ref="inputEl"
            v-model="input"
            type="text"
            placeholder="예: 서울에서 첫 데이트 장소 추천해줘"
            :disabled="isLoading"
          />
          <button type="submit" :disabled="isLoading || !input.trim()">
            {{ isLoading ? '전송 중' : '전송' }}
          </button>
        </form>
      </section>
    </transition>
  </div>
</template>

<style scoped>
.chatbot-shell {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1100;
}

.chatbot-toggle {
  position: relative;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #f25ea6 0%, #ff7eb3 100%);
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(242, 94, 166, 0.24);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.chatbot-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(242, 94, 166, 0.3);
}

.chatbot-toggle:focus-visible {
  outline: 3px solid #ffb8d6;
  outline-offset: 3px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ff3b5c;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fffdfd;
}

.chatbot-card {
  width: min(92vw, 380px);
  max-height: min(82vh, 640px);
  margin-top: 10px;
  border: 1px solid rgba(240, 145, 184, 0.24);
  border-radius: 24px;
  padding: 16px;
  background: linear-gradient(180deg, #fffdfd 0%, #fcf8fb 100%);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
}

.pop-enter-active {
  animation: pop-in 0.18s ease-out;
  transform-origin: bottom right;
}
.pop-leave-active {
  animation: pop-in 0.14s ease-in reverse;
  transform-origin: bottom right;
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.chatbot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #e45b96;
  text-transform: uppercase;
}

.chatbot-header h3 {
  margin: 0;
  font-size: 1.08rem;
  color: #2d2331;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #38c977;
  margin-top: 6px;
  box-shadow: 0 0 0 3px rgba(56, 201, 119, 0.15);
}

.subtitle {
  margin: 0 0 10px;
  color: #7a5d6d;
  font-size: 0.9rem;
  line-height: 1.45;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.quick-prompt {
  border: 1px solid #f3dce7;
  background: #fff7fb;
  color: #8a4f6f;
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-prompt:hover {
  border-color: #f0c5d6;
  background: #fff3f8;
}

.messages-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
  scroll-behavior: smooth;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(255, 79, 163, 0.2);
  border-radius: 999px;
}

.message {
  padding: 10px 12px;
  border-radius: 16px;
  line-height: 1.55;
  white-space: pre-wrap;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.03);
  animation: rise-in 0.18s ease-out;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.label-name {
  flex: 1;
}

.label-time {
  font-weight: 500;
  color: #a58a97;
  font-size: 0.72rem;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: white;
  font-size: 0.78rem;
}

.avatar.assistant {
  background: linear-gradient(135deg, #ff4fa3, #ff7eb3);
}

.avatar.user {
  background: linear-gradient(135deg, #7687ff, #93a3ff);
}

.bubble-text {
  margin: 0;
  font-size: 0.95rem;
}

.message.user {
  background: linear-gradient(135deg, #fef2f7 0%, #fff7fb 100%);
  color: #7a2d57;
  margin-left: 10px;
  border: 1px solid rgba(242, 94, 166, 0.08);
}

.message.assistant {
  background: linear-gradient(135deg, #f8faff 0%, #fcfdff 100%);
  color: #2d3b5a;
  margin-right: 10px;
  border: 1px solid rgba(118, 135, 255, 0.08);
}

.typing-row {
  padding-bottom: 12px;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 2px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b9c0ff;
  animation: bounce 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.scroll-to-bottom {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #f0c5d6;
  background: white;
  color: #b23b73;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.place-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.place-card {
  border: 1px solid #f1e7ee;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.96);
}

.place-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.place-card h4 {
  margin: 0;
  font-size: 0.95rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 8px;
  background: #fff1f7;
  color: #b23b73;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.meta,
.tags,
.address {
  margin: 2px 0;
  font-size: 0.82rem;
  color: #6b5b67;
}

.error-box {
  margin-top: 10px;
  padding: 8px 10px;
  background: #fff0f0;
  color: #b42318;
  border-radius: 10px;
  font-size: 0.9rem;
}

.composer {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.composer input {
  flex: 1;
  border: 1px solid #ecdfe7;
  border-radius: 999px;
  padding: 10px 12px;
  font-size: 0.92rem;
  outline: none;
  background: #fffdfd;
}

.composer input:focus {
  border-color: #f25ea6;
  box-shadow: 0 0 0 3px rgba(242, 94, 166, 0.12);
}

.composer input:disabled {
  opacity: 0.6;
}

.composer button {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f25ea6 0%, #ff7eb3 100%);
  color: white;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(242, 94, 166, 0.16);
  transition: opacity 0.2s ease;
}

.composer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .message,
  .chatbot-toggle,
  .pop-enter-active,
  .pop-leave-active,
  .typing-dots span {
    animation: none !important;
    transition: none !important;
  }
}
</style>
