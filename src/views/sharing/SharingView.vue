<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'
import { useSharingStore } from '@/stores/sharing-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const authStore = useAuthStore()
const store = useSharingStore()
const router = useRouter()

const newEmail = ref('')
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteEmail = ref<string>()

if (!authStore.isDataOwner) {
  router.replace({ name: 'home' })
}

onMounted(() => store.loadAll())

async function handleAdd() {
  const email = newEmail.value.trim().toLowerCase()
  if (!email) return
  await store.addEmail(email)
  newEmail.value = ''
}

function confirmRemove(email: string) {
  pendingDeleteEmail.value = email
  confirmDialog.value?.open()
}

function handleRemove() {
  if (pendingDeleteEmail.value) {
    store.removeEmail(pendingDeleteEmail.value)
  }
}
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Compartilhar</h1>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <form class="flex gap-2 mb-6" @submit.prevent="handleAdd">
    <input
      v-model="newEmail"
      type="email"
      placeholder="Email para compartilhar"
      class="flex-1"
      required
    />
    <button type="submit" class="btn">Adicionar</button>
  </form>

  <table v-if="store.sharedEmails.length">
    <thead>
      <tr>
        <th>Email</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="email in store.sharedEmails" :key="email">
        <td>{{ email }}</td>
        <td>
          <div class="actions">
            <button type="button" class="btn-link danger" @click="confirmRemove(email)">
              Remover
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else-if="!store.loading">Nenhum email compartilhado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleRemove">
    Tem certeza que deseja remover o compartilhamento?
  </ConfirmDialog>
</template>
