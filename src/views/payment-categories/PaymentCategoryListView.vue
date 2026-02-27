<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = usePaymentCategoryStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

onMounted(() => store.loadAll())

function confirmDelete(id: string) {
  pendingDeleteId.value = id
  confirmDialog.value?.open()
}

function handleDelete() {
  if (pendingDeleteId.value) {
    store.remove(pendingDeleteId.value)
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Categorias de Pagamento</h1>
    <RouterLink to="/payment-categories/new" class="btn">Nova Categoria</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.categories.length">
    <thead>
      <tr>
        <th>Cor</th>
        <th>Nome</th>
        <th>Descricao</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="category in store.categories" :key="category.id">
        <td>
          <span class="color-badge" :style="{ backgroundColor: category.color }" />
        </td>
        <td>{{ category.name }}</td>
        <td>{{ category.description ?? '-' }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/payment-categories/${category.id}/edit`" class="btn-link">
              Editar
            </RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(category.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma categoria cadastrada.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
