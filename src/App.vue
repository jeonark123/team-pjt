<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">T</span>
        <div>
          <h1>Team Project</h1>
          <p>Vue 3 + TypeScript starter</p>
        </div>
      </div>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-weight: 700;
}

.brand h1 {
  font-size: 1rem;
  font-weight: 700;
}

.brand p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  color: var(--color-text);
  transition: background-color 0.2s ease;
}

nav a:hover,
nav a.router-link-exact-active {
  background: var(--color-background-soft);
}

.content {
  flex: 1;
  padding: 2rem;
}

@media (max-width: 720px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .content {
    padding: 1.25rem;
  }
}
</style>
