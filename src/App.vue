<script setup lang="ts">
import AppNav from '@/components/AppNav.vue'
</script>

<template>
  <div class="app-shell">
    <AppNav />
    <main class="container">
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

.container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  width: 100%;
  flex: 1;
}
</style>
