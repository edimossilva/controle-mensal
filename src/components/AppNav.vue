<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await authStore.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="bg-bg-subtle border-b border-border sticky top-0 z-100 backdrop-blur-[12px]">
    <div class="max-w-5xl mx-auto px-6 flex items-center gap-8 h-14">
      <RouterLink to="/" class="text-base font-bold tracking-[0.04em] text-primary no-underline shrink-0">
        CM
      </RouterLink>
      <div class="flex items-center gap-1 overflow-x-auto flex-1">
        <RouterLink to="/owners" class="nav-link">Titulares</RouterLink>
        <RouterLink to="/bank-accounts" class="nav-link">Contas</RouterLink>
        <RouterLink to="/transactions" class="nav-link">Transacoes</RouterLink>
        <RouterLink to="/payment-categories" class="nav-link">Categorias</RouterLink>
        <RouterLink to="/payment-templates" class="nav-link">Modelos</RouterLink>
        <RouterLink to="/payments" class="nav-link">Pagamentos</RouterLink>
        <RouterLink to="/payment-batches" class="nav-link">Lotes</RouterLink>
        <RouterLink v-if="authStore.isDataOwner" to="/sharing" class="nav-link">
          Compartilhar
        </RouterLink>
      </div>
      <div v-if="authStore.user" class="flex items-center gap-2 shrink-0 ml-auto">
        <img
          v-if="authStore.user.photoURL"
          :src="authStore.user.photoURL"
          :alt="authStore.user.displayName ?? 'Avatar'"
          class="w-7 h-7 rounded-full"
          referrerpolicy="no-referrer"
        />
        <span class="text-[0.8125rem] text-text-secondary whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
          {{ authStore.user.displayName }}
        </span>
        <button
          class="px-2 py-1 text-xs font-medium text-text-muted bg-transparent border border-border rounded-sm cursor-pointer whitespace-nowrap transition-colors duration-[120ms] hover:text-danger hover:border-danger"
          @click="handleSignOut"
        >
          Sair
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
@reference "../assets/main.css";

.nav-link {
  @apply px-[0.7rem] py-[0.35rem] text-[0.8125rem] font-medium text-text-muted no-underline
         rounded-sm whitespace-nowrap transition-[color,background] duration-[120ms];
}

.nav-link:hover {
  @apply text-text-secondary bg-surface-hover;
}

.nav-link.router-link-active {
  @apply text-primary bg-primary-dim;
}
</style>
