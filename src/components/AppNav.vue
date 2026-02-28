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
  <nav class="app-nav">
    <div class="nav-inner">
      <RouterLink to="/" class="brand">CM</RouterLink>
      <div class="nav-links">
        <RouterLink to="/owners">Titulares</RouterLink>
        <RouterLink to="/bank-accounts">Contas</RouterLink>
        <RouterLink to="/transactions">Transacoes</RouterLink>
        <RouterLink to="/payment-categories">Categorias</RouterLink>
        <RouterLink to="/payment-templates">Modelos</RouterLink>
        <RouterLink to="/payments">Pagamentos</RouterLink>
        <RouterLink to="/payment-batches">Lotes</RouterLink>
        <RouterLink v-if="authStore.isDataOwner" to="/sharing">Compartilhar</RouterLink>
      </div>
      <div v-if="authStore.user" class="user-section">
        <img
          v-if="authStore.user.photoURL"
          :src="authStore.user.photoURL"
          :alt="authStore.user.displayName ?? 'Avatar'"
          class="user-avatar"
          referrerpolicy="no-referrer"
        />
        <span class="user-name">{{ authStore.user.displayName }}</span>
        <button class="btn-signout" @click="handleSignOut">Sair</button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.app-nav {
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.nav-inner {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  height: 3.5rem;
}

.brand {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  flex: 1;
}

.nav-links a {
  padding: 0.35rem 0.7rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.nav-links a:hover {
  color: var(--color-text-secondary);
  background: var(--color-surface-hover);
}

.nav-links a.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-dim);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-left: auto;
}

.user-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
}

.user-name {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-signout {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.btn-signout:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
