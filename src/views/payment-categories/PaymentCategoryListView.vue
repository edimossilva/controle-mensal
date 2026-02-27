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
  <h1>Categorias de Pagamento</h1>
  <RouterLink to="/payment-categories/new" class="btn">Nova Categoria</RouterLink>

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
          <RouterLink :to="`/payment-categories/${category.id}/edit`">Editar</RouterLink>
          <button type="button" class="btn-link danger" @click="confirmDelete(category.id)">
            Excluir
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma categoria cadastrada.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.color-badge {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
}

.btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.5rem;
}

.danger {
  color: #e74c3c;
}

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}
</style>
