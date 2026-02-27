import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './assets/main.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth-store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

router.beforeEach((to) => {
  if (to.meta.public) return true
  if (!authStore.user) return { name: 'login' }
  return true
})

authStore.listenToAuthState().then(() => {
  app.mount('#app')
})
