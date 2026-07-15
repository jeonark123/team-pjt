<script setup lang="ts">
import { useMeetingStore } from '@/stores/meeting'
import FlaticonIcon from '@/components/FlaticonIcon.vue'

interface Meeting {
  id: number
  title: string
  category: 'male' | 'female' | 'mixed'
  location: string
  date: string
  time: string
  participants: number
  maxParticipants: number
  description: string
  weather: string
  difficulty: string
  image: string
  createdAt: string
}

const props = defineProps<{
  meeting: Meeting
}>()

const meetingStore = useMeetingStore()

const handleJoin = () => {
  const success = meetingStore.joinMeeting(props.meeting.id)
  if (success) {
    alert('모임에 참가했습니다!')
  } else {
    alert('더 이상 참가할 수 없습니다.')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
}

const getGenderLabel = (category: string) => {
  switch (category) {
    case 'male':
      return '남자 모임'
    case 'female':
      return '여자 모임'
    case 'mixed':
      return '혼성 모임'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'male':
      return '#4A90E2'
    case 'female':
      return '#FF69B4'
    case 'mixed':
      return '#9B59B6'
  }
}
</script>

<template>
  <div class="meeting-card">
    <div class="card-header" :style="{ borderLeftColor: getCategoryColor(meeting.category) }">
      <div class="header-info">
        <span class="gender-badge" :style="{ background: getCategoryColor(meeting.category) }">{{
          getGenderLabel(meeting.category)
        }}</span>
        <span class="difficulty-badge" :class="meeting.difficulty">{{ meeting.difficulty }}</span>
      </div>
      <div class="emoji"><FlaticonIcon name="sparkles" :size="20" /></div>
    </div>

    <div class="card-content">
      <h3>{{ meeting.title }}</h3>

      <div class="info-row">
        <span class="icon"><FlaticonIcon name="pin" :size="16" /></span>
        <span>{{ meeting.location }}</span>
      </div>

      <div class="info-row">
        <span class="icon"><FlaticonIcon name="calendar" :size="16" /></span>
        <span>{{ formatDate(meeting.date) }} {{ meeting.time }}</span>
      </div>

      <div class="info-row">
        <span class="icon"><FlaticonIcon name="sun" :size="16" /></span>
        <span>{{ meeting.weather }}</span>
      </div>

      <p class="description">{{ meeting.description }}</p>

      <div class="participants-info">
        <span class="participants">
          <FlaticonIcon name="group" :size="14" /> {{ meeting.participants }}/{{ meeting.maxParticipants }}명
        </span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (meeting.participants / meeting.maxParticipants) * 100 + '%' }"></div>
        </div>
      </div>

      <button
        class="btn-join"
        @click="handleJoin"
        :disabled="meeting.participants >= meeting.maxParticipants"
      >
        <span v-if="meeting.participants < meeting.maxParticipants">참가하기</span>
        <span v-else>모임 가득 참</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.meeting-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border-left: 4px solid;
}

.meeting-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(255, 20, 147, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--bg-light) 0%, rgba(255, 182, 193, 0.3) 100%);
}

.header-info {
  display: flex;
  gap: 0.5rem;
}

.gender-badge,
.difficulty-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.difficulty-badge {
  background: var(--text-dark);
}

.emoji {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 20, 147, 0.1);
  color: #ff5ca8;
}

.card-content {
  padding: 1.5rem;
}

.card-content h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: var(--text-dark);
  line-height: 1.3;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  color: var(--text-light);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #fff5fa;
  color: #ff5ca8;
}

.description {
  margin: 1rem 0;
  font-size: 0.9rem;
  color: var(--text-light);
  line-height: 1.4;
}

.participants-info {
  margin: 1rem 0;
  padding: 0.8rem;
  background: var(--bg-light);
  border-radius: 8px;
}

.participants {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
  transition: width 0.3s;
}

.btn-join {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.8rem;
}

.btn-join:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

.btn-join:disabled {
  background: var(--text-light);
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .card-content {
    padding: 1rem;
  }

  .card-content h3 {
    font-size: 1rem;
  }
}
</style>
