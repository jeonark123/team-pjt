<script setup lang="ts">

import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PlaceChatBot from '@/components/PlaceChatBot.vue'
import FlaticonIcon from '@/components/FlaticonIcon.vue'

const showSidebar = ref(false)
const isChatbotOpen = ref(false)

const openChatbotFromEvent = () => {
  isChatbotOpen.value = true
}

onMounted(() => {
  window.addEventListener('open-chatbot', openChatbotFromEvent)
})

onUnmounted(() => {
  window.removeEventListener('open-chatbot', openChatbotFromEvent)
})
</script>

<template>
  <div id="app" class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <button class="sidebar-toggle" @click="showSidebar = !showSidebar">
          <FlaticonIcon name="menu" :size="20" />
        </button>

        <RouterLink to="/" class="logo">
          <img src="/logo.png" alt="Local Mate logo" class="logo-img" />
        </RouterLink>

        <div class="search-box" aria-hidden="true"></div>

        <div class="header-actions">
          <button class="icon-btn" title="알림"><FlaticonIcon name="bell" :size="18" /></button>
          <button class="icon-btn" title="채팅"><FlaticonIcon name="chat" :size="18" /></button>
          <button class="icon-btn profile-btn" title="프로필">
            <FlaticonIcon name="user" :size="18" />
          </button>
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- Sidebar Navigation -->
      <aside :class="['sidebar', { active: showSidebar }]">
        <nav class="nav">
          <RouterLink to="/" class="nav-item">
            <span class="nav-icon"><FlaticonIcon name="home" :size="18" /></span>
            <span class="nav-label">HOME</span>
          </RouterLink>
          <RouterLink to="/places" class="nav-item">
            <span class="nav-icon"><FlaticonIcon name="map" :size="18" /></span>
            <span class="nav-label">장소추천</span>
          </RouterLink>
          <RouterLink to="/community" class="nav-item">
            <span class="nav-icon"><FlaticonIcon name="group" :size="18" /></span>
            <span class="nav-label">동행게시판</span>
          </RouterLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <RouterView />
      </main>

      <!-- Mobile sidebar backdrop -->
      <div v-if="showSidebar" class="sidebar-backdrop" @click="showSidebar = false"></div>

      <PlaceChatBot :is-open="isChatbotOpen" @update:is-open="isChatbotOpen = $event" />
    </div>

    <footer class="footer">
      <p>© 2026 sunset. 가까운 거리에서, 더 가까운 인연을</p>
    </footer>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f9f9f9;
}

/* Header Styles */
.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: var(--container-max, 1200px);
  margin: 0 auto;
  padding: 0.8rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.sidebar-toggle {
  display: none;
  background: #fff5fa;
  border: 1px solid #ffe4ef;
  font-size: 1.5rem;
  cursor: pointer;
  color: #ff5ca8;
  padding: 0.5rem;
  border-radius: 10px;
}

.sidebar-toggle:hover {
  background: #ffeaf3;
  transform: translateY(-1px);
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 132px;
  margin-left: 0.4rem;
}

.logo-img {
  height: 52px;
  width: auto;
  display: block;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-box {
  flex: 1;
  min-width: 0;
  max-width: 560px;
  margin: 0 auto;
  position: relative;
  transform: translateX(0.35rem);
}

.search-box input {
  width: 100%;
  padding: 0.65rem 2.5rem 0.65rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: #f5f5f5;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #ff1493;
  background: white;
  box-shadow: 0 0 0 2px rgba(255, 20, 147, 0.1);
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-self: end;
  margin-left: auto;
  flex-shrink: 0;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #f0e0ea;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5ca8;
  box-shadow: 0 2px 6px rgba(255, 20, 147, 0.08);
}

.icon-btn:hover {
  background: linear-gradient(135deg, #ff1f8f 0%, #ff6bb7 100%);
  color: white;
  border-color: #ff5ca8;
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.24);
  transform: scale(1.05);
}

.profile-btn {
  background: #fff;
  color: #ff5ca8;
  border: 1px solid #f0e0ea;
  box-shadow: 0 2px 6px rgba(255, 20, 147, 0.08);
}

.profile-btn:hover {
  background: linear-gradient(135deg, #ff1f8f 0%, #ff6bb7 100%);
  color: white;
  border-color: #ff5ca8;
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.24);
  transform: scale(1.05);
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  flex: 1;
  max-width: var(--container-max, 1200px);
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem;
}

/* Sidebar */
.sidebar {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 0;
  height: fit-content;
  position: sticky;
  top: 80px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  text-decoration: none;
  color: #333;
  border-radius: 10px;
  transition: all 0.3s;
  font-weight: 600;
  font-size: 1rem;
}

.nav-item:hover {
  background: rgba(255, 20, 147, 0.08);
  color: #FF1493;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.12);
}

.nav-item:hover .nav-icon {
  background: #fff5fa;
  color: #ff5ca8;
}

.nav-item .nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff5fa;
  border-radius: 10px;
  color: #ff5ca8;
}

.nav-item.router-link-active {
  background: rgba(255, 20, 147, 0.15);
  color: #ff1493;
  border-left: 3px solid #ff1493;
  padding-left: calc(1rem - 3px);
}

.nav-item.router-link-active .nav-icon {
  background: #ff5ca8;
  color: white;
}

.nav-cta {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  margin: 1rem 0.5rem 0;
  border-radius: 10px;
}

.nav-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

.nav-icon {
  font-size: 1.3rem;
  min-width: 1.3rem;
}

.nav-label {
  font-size: 0.95rem;
}

.sidebar-footer {
  margin-top: 2rem;
  padding: 0 0.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.sidebar-info {
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.info-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  margin: 0 0 0.25rem;
}

.info-desc {
  font-size: 0.75rem;
  color: #888;
  margin: 0;
  line-height: 1.4;
}

/* Main Content */
.main-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}


/* Footer */
.footer {
  background: white;
  padding: 1.5rem;
  text-align: center;
  color: #888;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 1400px) {
  .layout {
    grid-template-columns: 170px 1fr 250px;
    gap: 1rem;
    padding: 1rem;
  }

  .search-box {
    max-width: 250px;
  }

  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .search-box {
    max-width: 220px;
  }

  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: block;
  }

  .search-box {
    display: none;
  }

  .header-content {
    padding: 0.5rem 1rem;
  }

  .logo-img {
    height: 44px;
  }

  .layout {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .sidebar {
    display: none;
    position: fixed;
    left: 0;
    top: 72px;
    bottom: 0;
    width: 260px;
    padding: 1rem;
    border-radius: 0 12px 12px 0;
    box-shadow: 0 12px 40px rgba(0,0,0,0.18);
    z-index: 200;
    background: white;
    transform: translateX(-8px);
    transition: transform 240ms ease;
  }

  .sidebar.active {
    display: block;
    transform: translateX(0);
  }

  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 1200px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .sidebar.active {
    display: block;
    position: fixed;
    left: 0;
    top: 60px;
    width: 200px;
    height: calc(100vh - 60px);
    border-radius: 0;
    z-index: 99;
    overflow-y: auto;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  }

}

@media (max-width: 768px) {
  .header-content {
    padding: 0.5rem 1rem;
    gap: 0.5rem;
  }

  .logo-text {
    display: none;
  }

  .search-box {
    display: none;
  }

  .header-actions {
    gap: 0.25rem;
    margin-left: auto;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    font-size: 0.95rem;
  }

  .main-content {
    padding: 1rem;
    border-radius: 12px;
  }

  .sidebar.active {
    width: 100%;
    border-radius: 0;
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 180;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .search-box {
    display: none;
  }

  .header-actions {
    gap: 0.2rem;
    margin-left: auto;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
  }

  .main-content {
    padding: 0.75rem;
  }
}
</style>
