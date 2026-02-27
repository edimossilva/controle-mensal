<script setup lang="ts">
import { ref } from 'vue'

const dialogRef = ref<HTMLDialogElement>()
const emit = defineEmits<{ confirm: [] }>()

function open() {
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
}

function handleConfirm() {
  emit('confirm')
  close()
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialogRef">
    <p><slot>Tem certeza que deseja excluir?</slot></p>
    <div class="dialog-actions">
      <button type="button" @click="close">Cancelar</button>
      <button type="button" class="danger" @click="handleConfirm">Excluir</button>
    </div>
  </dialog>
</template>

<style scoped>
dialog {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 300px;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
