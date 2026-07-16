<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useMeetingStore } from '@/stores/meeting'
import MeetingCard from '@/components/MeetingCard.vue'
import FlaticonIcon from '@/components/FlaticonIcon.vue'

const meetingStore = useMeetingStore()
const activeTab = ref('female')
const categories = [
  { id: 'female', name: '여자 모임', icon: 'group' },
  { id: 'male', name: '남자 모임', icon: 'group' },
  { id: 'mixed', name: '혼성 모임', icon: 'group' },
]
const filteredMeetings = computed(() => {
  return meetingStore.getMeetingsByCategory(activeTab.value as 'male' | 'female' | 'mixed')
})
</script>

<template>
  <div class="community-view">
    <!-- Header -->
    <section class="header-section">
      <h1>👥 동행 게시판</h1>
      <p>함께할 동행을 찾아보세요!</p>
    </section>

    <!-- Category Tabs -->
    <section class="tabs-section">
      <div class="tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['tab-btn', { active: activeTab === cat.id }]"
          @click="activeTab = cat.id"
        >
          <span class="tab-icon"><FlaticonIcon :name="cat.icon" :size="16" /></span>
          <span class="tab-label">{{ cat.name }}</span>
        </button>
      </div>
    </section>

    <!-- Meetings List -->
    <section class="meetings-section">
      <div v-if="filteredMeetings.length > 0" class="meetings-list">
        <MeetingCard v-for="meeting in filteredMeetings" :key="meeting.id" :meeting="meeting" />
      </div>
      <div v-else class="empty-state">
        <span class="empty-icon"><FlaticonIcon name="empty" :size="40" /></span>
        <h3>현재 이용 가능한 모임이 없습니다</h3>
        <p>새로운 모임을 만들어보세요!</p>
      </div>
    </section>

    <!-- Create Meeting CTA -->
    <section class="cta-section">
      <div class="cta-card">
        <div class="cta-icon"><FlaticonIcon name="sparkles" :size="28" /></div>
        <h3>새 모임을 만들어보세요!</h3>
        <p>당신의 관심사와 맞는 사람들을 찾아 함께 활동해보세요.</p>
        <RouterLink to="/create" class="cta-btn">모임 만들기</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.community-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  margin: 0;
}

/* Tabs Section */
.tabs-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.tabs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.6rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  color: #666;
}

.tab-btn:hover {
  border-color: #FF1493;
  color: #FF1493;
  background: #f9f9f9;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
  border-color: #FF1493;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  white-space: nowrap;
}

/* Meetings Section */
.meetings-section {
  min-height: 300px;
}

.meetings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3rem;
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

/* CTA Section */
.cta-section {
  margin-top: 1rem;
}

.cta-card {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%);
  padding: 2.5rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(255, 20, 147, 0.15);
}

.cta-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-card h3 {
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
  color: #333;
  font-weight: 700;
}

.cta-card p {
  font-size: 1rem;
  color: #555;
  margin: 0 0 1.5rem;
}

.cta-btn {
  display: inline-block;
  padding: 0.9rem 2rem;
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s;
}

.cta-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 20, 147, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 1.5rem;
  }

  .tabs-section {
    padding: 1rem;
  }

  .tab-btn {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    gap: 0.4rem;
  }

  .tab-label {
    display: none;
  }

  .cta-card {
    padding: 1.5rem;
  }

  .cta-card h3 {
    font-size: 1.2rem;
  }

  .cta-btn {
    padding: 0.8rem 1.6rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.3rem;
  }

  .header-section p {
    font-size: 0.9rem;
  }

  .tabs {
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
    border-radius: 8px;
  }

  .tab-icon {
    font-size: 1rem;
  }

  .cta-icon {
    font-size: 2rem;
  }

  .cta-card h3 {
    font-size: 1.1rem;
  }

  .cta-card p {
    font-size: 0.9rem;
  }
}
</style>
