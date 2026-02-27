<script setup lang="ts">
import AppNav from '@/components/AppNav.vue'
</script>

<template>
  <AppNav />
  <main class="container">
    <RouterView />
  </main>
</template>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
