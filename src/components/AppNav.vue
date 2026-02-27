<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="app-nav">
    <RouterLink to="/">Início</RouterLink>
    <RouterLink to="/owners">Titulares</RouterLink>
    <RouterLink to="/bank-accounts">Contas</RouterLink>
    <RouterLink to="/transactions">Transações</RouterLink>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ccc;
  margin-bottom: 1rem;
}

.app-nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.app-nav a.router-link-active {
  color: #42b883;
  font-weight: 700;
}
</style>
