import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getFirestoreInstance } from '@/adapters/firebase/firebase-firestore'
import { FirestoreSharingRepository } from '@/adapters/repositories/firestore-sharing-repository'
import { useAuthStore } from './auth-store'

export const useSharingStore = defineStore('sharing', () => {
  const sharedEmails = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getOwnerUid(): string | null {
    const authStore = useAuthStore()
    if (!authStore.isDataOwner || !authStore.user) return null
    return authStore.user.uid
  }

  async function loadAll(): Promise<void> {
    const ownerUid = getOwnerUid()
    if (!ownerUid) return

    loading.value = true
    error.value = null
    try {
      const repo = new FirestoreSharingRepository(getFirestoreInstance())
      sharedEmails.value = await repo.getSharedEmails(ownerUid)
    } catch (e) {
      error.value = 'Erro ao carregar emails compartilhados.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function addEmail(email: string): Promise<void> {
    const ownerUid = getOwnerUid()
    if (!ownerUid) return

    error.value = null
    try {
      const repo = new FirestoreSharingRepository(getFirestoreInstance())
      await repo.addSharedEmail(ownerUid, email)
      sharedEmails.value.push(email)
    } catch (e) {
      error.value = 'Erro ao adicionar email.'
      console.error(e)
    }
  }

  async function removeEmail(email: string): Promise<void> {
    const ownerUid = getOwnerUid()
    if (!ownerUid) return

    error.value = null
    try {
      const repo = new FirestoreSharingRepository(getFirestoreInstance())
      await repo.removeSharedEmail(ownerUid, email)
      sharedEmails.value = sharedEmails.value.filter((e) => e !== email)
    } catch (e) {
      error.value = 'Erro ao remover email.'
      console.error(e)
    }
  }

  return { sharedEmails, loading, error, loadAll, addEmail, removeEmail }
})
