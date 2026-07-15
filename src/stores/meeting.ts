import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockMeetings } from '@/data/mockData'

export interface Meeting {
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

export const useMeetingStore = defineStore('meeting', () => {
  const meetings = ref<Meeting[]>(
    JSON.parse(localStorage.getItem('meetings') || JSON.stringify(mockMeetings))
  )

  const addMeeting = (meeting: Omit<Meeting, 'id' | 'participants' | 'createdAt'>) => {
    const newMeeting: Meeting = {
      id: Math.max(...meetings.value.map(m => m.id), 0) + 1,
      ...meeting,
      participants: 1,
      createdAt: new Date().toISOString(),
    }
    meetings.value.unshift(newMeeting)
    saveMeetings()
    return newMeeting
  }

  const getMeetingsByCategory = (category: 'male' | 'female' | 'mixed') => {
    return meetings.value.filter(m => m.category === category)
  }

  const saveMeetings = () => {
    localStorage.setItem('meetings', JSON.stringify(meetings.value))
  }

  const joinMeeting = (meetingId: number) => {
    const meeting = meetings.value.find(m => m.id === meetingId)
    if (meeting && meeting.participants < meeting.maxParticipants) {
      meeting.participants++
      saveMeetings()
      return true
    }
    return false
  }

  const getAllMeetings = () => {
    return meetings.value
  }

  const getMeetingById = (id: number) => {
    return meetings.value.find(m => m.id === id)
  }

  return {
    meetings,
    addMeeting,
    getMeetingsByCategory,
    joinMeeting,
    getAllMeetings,
    getMeetingById,
  }
})
