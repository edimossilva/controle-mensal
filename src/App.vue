<script setup lang="ts">
import AppNav from '@/components/AppNav.vue'
import NotificationToast from '@/components/NotificationToast.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav />
    <main class="max-w-5xl mx-auto px-6 py-8 w-full flex-1">
      <RouterView />
    </main>
    <NotificationToast />
  </div>
</template>
