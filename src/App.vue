<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PlaceChatBot from '@/components/PlaceChatBot.vue';
import FlaticonIcon from '@/components/FlaticonIcon.vue';

const showSidebar = ref(false);
const isChatbotOpen = ref(false);

const openChatbotFromEvent = () => {
  isChatbotOpen.value = true;
};

onMounted(() => {
  window.addEventListener('open-chatbot', openChatbotFromEvent);
});

onUnmounted(() => {
  window.removeEventListener('open-chatbot', openChatbotFromEvent);
});
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
  background: #f7f7f9;
}

/* ================= Header ================= */
.header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #ececef;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.sidebar-toggle {
  display: none;
  background: #f3f2f5;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4a4952;
  padding: 0.5rem;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: #ebeaee;
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
  height: 44px;
  width: auto;
  display: block;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ff1f8f 0%, #ff62aa 100%);
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
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f3f2f5;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #ff1f8f;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 31, 143, 0.1);
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
  gap: 0.4rem;
  align-items: center;
  justify-self: end;
  margin-left: auto;
  flex-shrink: 0;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: #f3f2f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4952;
}

.icon-btn:hover {
  background: #ff1f8f;
  color: white;
  transform: translateY(-1px);
}

.profile-btn {
  background: #f3f2f5;
  color: #4a4952;
}

.profile-btn:hover {
  background: #ff1f8f;
  color: white;
}

/* ================= Layout ================= */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  flex: 1;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem;
}

/* ================= Sidebar ================= */
.sidebar {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  height: fit-content;
  position: sticky;
  top: 80px;
  border: 1px solid #ececef;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  text-decoration: none;
  color: #6b6a74;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.92rem;
}

.nav-item:hover {
  background: #f3f2f5;
  color: #26232b;
}

.nav-item:hover .nav-icon {
  color: #ff1f8f;
}

.nav-item .nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #a3a2ab;
  transition: color 0.2s ease;
}

.nav-item.router-link-active {
  background: #fff0f7;
  color: #ff1f8f;
}

.nav-item.router-link-active .nav-icon {
  color: #ff1f8f;
}

.nav-cta {
  background: linear-gradient(135deg, #ff1f8f 0%, #ff62aa 100%);
  color: white;
  margin-top: 0.5rem;
  border-radius: 12px;
}

.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 31, 143, 0.25);
}

.nav-icon {
  font-size: 1.3rem;
  min-width: 1.3rem;
}

.nav-label {
  font-size: 0.92rem;
}

.sidebar-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #ececef;
}

.sidebar-info {
  padding: 0.75rem 0.9rem;
  margin-bottom: 0.5rem;
}

.info-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #26232b;
  margin: 0 0 0.25rem;
}

.info-desc {
  font-size: 0.75rem;
  color: #a3a2ab;
  margin: 0;
  line-height: 1.4;
}

/* ================= Main Content ================= */
.main-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #ececef;
}

/* ================= Footer ================= */
.footer {
  background: white;
  padding: 1.5rem;
  text-align: center;
  color: #a3a2ab;
  border-top: 1px solid #ececef;
  font-size: 0.85rem;
}

/* ================= Responsive ================= */
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
    width: 220px;
    height: calc(100vh - 60px);
    border-radius: 0;
    z-index: 99;
    overflow-y: auto;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
    border: none;
    border-right: 1px solid #ececef;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
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

  .logo-img {
    height: 36px;
  }

  .search-box {
    display: none;
  }

  .header-actions {
    gap: 0.25rem;
    margin-left: auto;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
    font-size: 0.95rem;
  }

  .main-content {
    padding: 1.25rem;
    border-radius: 14px;
  }

  .sidebar.active {
    width: 100%;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.5rem;
    gap: 0.4rem;
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
    padding: 1rem;
  }
}
</style>
