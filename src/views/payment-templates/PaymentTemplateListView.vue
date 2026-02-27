<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = usePaymentTemplateStore()
const ownerStore = useOwnerStore()
const categoryStore = usePaymentCategoryStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

onMounted(() => {
  store.loadAll()
  ownerStore.loadAll()
  categoryStore.loadAll()
})

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function categoryName(categoryId: string): string {
  return categoryStore.getById(categoryId)?.name ?? 'Desconhecida'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
    <h1>Modelos de Pagamento</h1>
    <RouterLink to="/payment-templates/new" class="btn">Novo Modelo</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.templates.length">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Categoria</th>
        <th>Titular</th>
        <th>Valor</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="template in store.templates" :key="template.id">
        <td>{{ template.name }}</td>
        <td>{{ categoryName(template.categoryId) }}</td>
        <td>{{ ownerName(template.ownerId) }}</td>
        <td>{{ formatCurrency(template.value) }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/payment-templates/${template.id}/edit`" class="btn-link">
              Editar
            </RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(template.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhum modelo cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
