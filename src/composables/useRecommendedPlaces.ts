// src/composables/useRecommendedPlaces.ts
import { ref } from 'vue';

export interface AiPlace {
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
}

const recommendedPlaces = ref<AiPlace[]>([]);
const lastQuery = ref('');
const isChatOpen = ref(false); // HomeView에서 챗봇을 열어달라고 요청할 때 씀

export function useRecommendedPlaces() {
  const setRecommendedPlaces = (places: AiPlace[], query = '') => {
    recommendedPlaces.value = places;
    lastQuery.value = query;
  };
  const clearRecommendedPlaces = () => {
    recommendedPlaces.value = [];
    lastQuery.value = '';
  };
  const openChat = () => {
    isChatOpen.value = true;
  };

  return {
    recommendedPlaces,
    lastQuery,
    isChatOpen,
    setRecommendedPlaces,
    clearRecommendedPlaces,
    openChat,
  };
}
