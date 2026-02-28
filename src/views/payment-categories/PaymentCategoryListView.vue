<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = usePaymentCategoryStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'categories'), {
  name: (c) => c.name.toLowerCase(),
  description: (c) => (c.description ?? '').toLowerCase(),
})

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
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Categorias de Pagamento</h1>
    <RouterLink to="/payment-categories/new" class="btn">Nova Categoria</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.categories.length">
    <thead>
      <tr>
        <th>Cor</th>
        <th :class="sortClass('name')" @click="sortBy('name')">Nome</th>
        <th :class="sortClass('description')" @click="sortBy('description')">Descricao</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="category in sortedItems" :key="category.id">
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
