import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDraftMeetingStore = defineStore('draftMeeting', () => {
  const initial = JSON.parse(localStorage.getItem('draftMeeting') || 'null')
  const draft = ref<any | null>(initial)

  const setDraft = (place: any) => {
    draft.value = place
    try {
      localStorage.setItem('draftMeeting', JSON.stringify(place))
    } catch (e) {}
  }

  const clearDraft = () => {
    draft.value = null
    try {
      localStorage.removeItem('draftMeeting')
    } catch (e) {}
  }

  return { draft, setDraft, clearDraft }
})
