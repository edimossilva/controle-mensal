import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { signInWithGoogle, signOutUser, onAuthStateChange } from '@/adapters/firebase/firebase-auth'
import { getFirestoreInstance } from '@/adapters/firebase/firebase-firestore'
import {
  initializeRepositories,
  clearRepositories,
} from '@/adapters/repositories/repository-provider'
import { FirestoreSharingRepository } from '@/adapters/repositories/firestore-sharing-repository'

interface AuthUser {
  uid: string
  displayName: string | null
  photoURL: string | null
  email: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(true)
  const dataOwnerUid = ref<string | null>(null)

  const isDataOwner = computed(() => {
    if (!user.value) return false
    return dataOwnerUid.value === null || dataOwnerUid.value === user.value.uid
  })

  async function setupSession(firebaseUser: {
    uid: string
    displayName: string | null
    photoURL: string | null
    email: string | null
  }): Promise<void> {
    user.value = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      email: firebaseUser.email,
    }

    const db = getFirestoreInstance()
    let effectiveUid = firebaseUser.uid

    if (firebaseUser.email) {
      try {
        const sharingRepo = new FirestoreSharingRepository(db)
        const ownerUid = await sharingRepo.resolveDataOwnerUid(firebaseUser.email)
        if (ownerUid && ownerUid !== firebaseUser.uid) {
          dataOwnerUid.value = ownerUid
          effectiveUid = ownerUid
        } else {
          dataOwnerUid.value = null
        }
      } catch {
        dataOwnerUid.value = null
      }
    }

    await initializeRepositories(db, effectiveUid)
  }

  function listenToAuthState(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChange(async (firebaseUser) => {
        if (firebaseUser) {
          await setupSession(firebaseUser)
        } else {
          user.value = null
          dataOwnerUid.value = null
          clearRepositories()
        }
        loading.value = false
        resolve()
      })
    })
  }

  async function signIn(): Promise<void> {
    const firebaseUser = await signInWithGoogle()
    await setupSession(firebaseUser)
  }

  async function signOut(): Promise<void> {
    await signOutUser()
    user.value = null
    dataOwnerUid.value = null
    clearRepositories()
  }

  return { user, loading, dataOwnerUid, isDataOwner, listenToAuthState, signIn, signOut }
})
