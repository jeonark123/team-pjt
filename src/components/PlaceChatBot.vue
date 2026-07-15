<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import OpenAI from 'openai';

type Place = {
  id: string;
  name: string;
  region: string;
  category: string;
  tags: string[];
  description: string;
  address: string;
};

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  places?: Place[];
};

const input = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const places = ref<Place[]>([]);
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! 데이트나 모임에 어울리는 장소를 추천해드릴게요. 원하는 지역, 분위기, 인원수를 말해주시면 바로 맞춰드릴게요 ✨',
  },
]);

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const isOpen = ref(true);
const quickPrompts = ['서울에서 첫 데이트 코스 추천해줘'];

const placeMap = computed(() => new Map(places.value.map((place) => [place.id, place])));

const selectQuickPrompt = (prompt: string) => {
  input.value = prompt;
};

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
    // 공공데이터 포맷: response.body.items.item
    const nested = dataset?.response?.body?.items?.item;
    if (nested) return Array.isArray(nested) ? nested : [nested];
    // 다른 구조 예시
    if (Array.isArray(dataset.result?.items)) return dataset.result.items;
    if (Array.isArray(dataset.data)) return dataset.data;
    return [];
  };

  try {
    const responses = await Promise.all(regionFiles.map((file) => fetch(file.path)));
    const datasets = await Promise.all(
      responses.map(async (response, idx) => {
        if (!response.ok) {
          console.warn('Failed to fetch', regionFiles[idx].path, response.status);
          return null;
        }
        try {
          return await response.json();
        } catch (e) {
          console.warn('Invalid JSON:', regionFiles[idx].path, e);
          return null;
        }
      }),
    );

    const itemsWithLabel = datasets
      .map((dataset: any, index: number) => {
        const items = extractItems(dataset);
        if (!items || items.length === 0) {
          console.warn('No items extracted from', regionFiles[index].path, dataset);
        }
        return (items || []).map((item: any) => ({ item, label: regionFiles[index].label }));
      })
      .flat();

    const publicPlaces: Place[] = itemsWithLabel.slice(0, 160).map(({ item, label }) => ({
      id: `public-${item.contentid ?? item.CONTENTID ?? item.id ?? item.title ?? Math.random().toString(36).slice(2)}`,
      name: item.title ?? item.name ?? item.facltNm ?? '이름 없음',
      region: label,
      category: '공공데이터',
      tags: ['공공데이터', '추천지향'],
      description:
        item.addr1 ?? item.description ?? item.intro ?? '공공데이터 기반 추천 장소입니다.',
      address: item.addr1 ?? item.addr ?? item.주소 ?? '주소 정보 없음',
    }));

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

  return [
    '당신은 데이트와 모임 장소를 추천하는 한국어 챗봇입니다.',
    '반드시 아래 public/data 폴더의 JSON 파일에 있는 장소만 참고하고, 데이터에 없는 장소를 만들어내지 마세요.',
    '답변은 따뜻하고 자연스럽게, 한두 문장으로 요약하되 추천 이유를 함께 적어주세요.',
    `public/data 카탈로그:
${JSON.stringify(places.value, null, 2)}`,
    `대화 맥락:
${JSON.stringify(recentContext, null, 2)}`,
    `사용자 질문: ${question}`,
    '반드시 JSON만 답하세요. 형식은 {"reply":"...","recommendedIds":["id1","id2"]} 입니다.',
  ].join('\n\n');
};

const handleSubmit = async () => {
  const question = input.value.trim();
  if (!question) return;

  messages.value.push({ id: Date.now(), role: 'user', text: question });
  input.value = '';
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (!apiKey) {
      throw new Error('VITE_OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    // 프론트 번들에 API 키가 노출될 수 있으므로, 실서비스 배포 시에는 서버리스 프록시를 고려하세요.
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

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
      .map((id) => placeMap.value.get(String(id)))
      .filter((place): place is Place => Boolean(place));

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: reply,
      places: recommendedPlaces,
    });
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: '잠시 추천을 준비하기 어려웠어요. 잠시 후 다시 시도해 주세요. 지역과 분위기만 알려주셔도 더 잘 맞춰드릴게요.',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="chatbot-shell">
    <button class="chatbot-toggle" @click="isOpen = !isOpen">
      {{ isOpen ? '✕' : '💬' }}
    </button>

    <section v-if="isOpen" class="chatbot-card">
      <div class="chatbot-header">
        <div>
          <p class="eyebrow">Local Mate AI</p>
          <h3>장소 추천 챗봇</h3>
        </div>
        <p class="subtitle">데이트·모임에 어울리는 장소를 자연스럽게 추천해드려요.</p>
      </div>

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

      <div class="messages" aria-live="polite">
        <div v-for="message in messages" :key="message.id" :class="['message', message.role]">
          <div class="bubble-label">
            <span class="avatar">{{ message.role === 'user' ? '나' : 'AI' }}</span>
            <span>{{ message.role === 'user' ? '나' : '로컬 메이트' }}</span>
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
              <p class="address">{{ place.address }}</p>
            </article>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>

      <form class="composer" @submit.prevent="handleSubmit">
        <input v-model="input" type="text" placeholder="예: 서울에서 첫 데이트 장소 추천해줘" />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '전송 중...' : '전송' }}
        </button>
      </form>
    </section>
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
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #f25ea6 0%, #ff7eb3 100%);
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(242, 94, 166, 0.24);
  transition: transform 0.2s ease;
}

.chatbot-toggle:hover {
  transform: translateY(-2px);
}

.chatbot-card {
  width: min(92vw, 380px);
  max-height: min(82vh, 640px);
  margin-top: 10px;
  border: 1px solid rgba(240, 145, 184, 0.24);
  border-radius: 24px;
  padding: 16px;
  background: linear-gradient(180deg, #fffdfd 0%, #fcf8fb 100%);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
}

.chatbot-header {
  margin-bottom: 10px;
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
  margin: 0 0 4px;
  font-size: 1.08rem;
  color: #2d2331;
}

.subtitle {
  margin: 0;
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

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
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
}

.bubble-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4fa3, #ff7eb3);
  color: white;
  font-size: 0.78rem;
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

.composer button {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f25ea6 0%, #ff7eb3 100%);
  color: white;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(242, 94, 166, 0.16);
}
</style>
