<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import { useOwnerStore } from '@/stores/owner-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useOwnerStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'owners'), {
  name: (o) => o.name.toLowerCase(),
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
    <h1 class="!mb-0">Titulares</h1>
    <RouterLink to="/owners/new" class="btn">Novo Titular</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.owners.length">
    <thead>
      <tr>
        <th :class="sortClass('name')" @click="sortBy('name')">Nome</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="owner in sortedItems" :key="owner.id">
        <td>{{ owner.name }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/owners/${owner.id}/edit`" class="btn-link">Editar</RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(owner.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhum titular cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
