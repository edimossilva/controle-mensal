import { ref } from 'vue'
import { defineStore } from 'pinia'
import { signInWithGoogle, signOutUser, onAuthStateChange } from '@/adapters/firebase/firebase-auth'
import { getFirestoreInstance } from '@/adapters/firebase/firebase-firestore'
import {
  initializeRepositories,
  clearRepositories,
} from '@/adapters/repositories/repository-provider'

interface AuthUser {
  uid: string
  displayName: string | null
  photoURL: string | null
  email: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(true)

  function listenToAuthState(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChange(async (firebaseUser) => {
        if (firebaseUser) {
          user.value = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
          }
          const db = getFirestoreInstance()
          await initializeRepositories(db, firebaseUser.uid)
        } else {
          user.value = null
          clearRepositories()
        }
        loading.value = false
        resolve()
      })
    })
  }

  async function signIn(): Promise<void> {
    await signInWithGoogle()
  }

  async function signOut(): Promise<void> {
    await signOutUser()
    user.value = null
    clearRepositories()
  }

  return { user, loading, listenToAuthState, signIn, signOut }
})
