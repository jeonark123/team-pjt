<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import PlaceChatBot from '@/components/PlaceChatBot.vue';
import FlaticonIcon from '@/components/FlaticonIcon.vue';

const showSidebar = ref(false);
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
            <span class="nav-label">홈</span>
          </RouterLink>
          <RouterLink to="/places" class="nav-item">
            <span class="nav-icon"><FlaticonIcon name="map" :size="18" /></span>
            <span class="nav-label">장소추천</span>
          </RouterLink>
          <RouterLink to="/community" class="nav-item">
            <span class="nav-icon"><FlaticonIcon name="group" :size="18" /></span>
            <span class="nav-label">동행게시판</span>
          </RouterLink>
          <RouterLink to="/create" class="nav-item nav-cta">
            <span class="nav-icon"><FlaticonIcon name="plus" :size="18" /></span>
            <span class="nav-label">모임만들기</span>
          </RouterLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <RouterView />
      </main>

      <!-- Right Sidebar -->
      <aside class="right-sidebar">
        <div class="notice-section">
          <h3><FlaticonIcon name="sparkles" :size="16" /> 공지사항</h3>
          <div class="notice-item">
            <p class="notice-title">
              <FlaticonIcon name="sparkles" :size="14" /> AI 모임 추천<br />시작!
            </p>
            <p class="notice-time">오늘</p>
          </div>
          <div class="notice-item">
            <p class="notice-title">
              <FlaticonIcon name="sun" :size="14" /> 날씨 기반<br />활동 가이드
            </p>
            <p class="notice-time">어제</p>
          </div>
        </div>

        <div class="weather-section">
          <div class="weather-header">
            <h3>날씨 정보 제안</h3>
            <span class="weather-tag">오늘</span>
          </div>
          <p class="weather-summary">현재 서울은 맑음, 야외 활동하기 좋은 날씨입니다.</p>
          <ul class="weather-list">
            <li>기온: 24°C</li>
            <li>체감: 26°C</li>
            <li>강수 확률: 10%</li>
          </ul>
          <button class="weather-btn">추천 활동 보기</button>
        </div>

        <div class="ai-section">
          <div class="ai-header">
            <span class="ai-icon"><FlaticonIcon name="idea" :size="18" /></span>
            <h3>AI 어시스턴트</h3>
          </div>
          <p class="ai-text">당신에게 딱 맞는<br />모임을 찾아드려요!</p>
          <button class="ai-btn"><FlaticonIcon name="chat" :size="16" /> 대화 시작</button>
        </div>
      </aside>

      <PlaceChatBot />
    </div>

    <footer class="footer">
      <p>© 2024 Local Mate. 모두를 위한 똑똑한 커뮤니티</p>
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
  max-width: 1800px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
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
  min-width: 120px;
}

.logo-img {
  height: 40px;
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
  justify-self: center;
  width: min(100%, 560px);
  position: relative;
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
  background: #fff5fa;
  transform: scale(1.05);
}

.profile-btn {
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
}

/* Layout */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: 1.5rem;
  flex: 1;
  max-width: 1800px;
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
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: #333;
  border-radius: 10px;
  transition: all 0.3s;
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-item:hover {
  background: rgba(255, 20, 147, 0.08);
  color: #ff1493;
}

.nav-item .nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

/* Right Sidebar */
.right-sidebar {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 80px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.ai-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 1px solid #f0e0ff;
}

.ai-btn {
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.ai-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);
}

.notice-section h3 {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notice-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f9f9f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid #ffb6c1;
}

.notice-item:hover {
  background: rgba(255, 20, 147, 0.08);
  transform: translateX(4px);
}

.weather-section {
  background: #f9f5ff;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #f0e0ff;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.weather-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.weather-tag {
  background: #fff0ff;
  color: #c71585;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}

.weather-summary {
  margin: 0 0 1rem;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

.weather-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.8;
}

.weather-list li {
  display: flex;
  justify-content: space-between;
}

.weather-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  background: #fff;
  color: #c71585;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.weather-btn:hover {
  background: #ffeeff;
}

.notice-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notice-time {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #888;
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

  .right-sidebar {
    display: none;
  }

  .sidebar-toggle {
    display: block;
  }

  .header-content {
    gap: 0.75rem;
  }

  .search-box {
    max-width: 200px;
  }

  .main-content {
    padding: 1.5rem;
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
    flex: 1;
    max-width: 150px;
  }

  .search-box input {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .header-actions {
    gap: 0.25rem;
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
