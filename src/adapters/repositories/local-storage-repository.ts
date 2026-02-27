import type { Repository } from '@/usecases/ports'

export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  private readonly storageKey: string
  private readonly deserialize?: (raw: unknown) => T

  constructor(storageKey: string, deserialize?: (raw: unknown) => T) {
    this.storageKey = storageKey
    this.deserialize = deserialize
  }

  getAll(): T[] {
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return []

    const parsed: unknown[] = JSON.parse(raw)
    return this.deserialize ? parsed.map(this.deserialize) : (parsed as T[])
  }

  getById(id: string): T | undefined {
    return this.getAll().find((entity) => entity.id === id)
  }

  create(entity: T): void {
    const entities = this.getAll()
    entities.push(entity)
    this.persist(entities)
  }

  update(entity: T): void {
    const entities = this.getAll()
    const index = entities.findIndex((e) => e.id === entity.id)
    if (index !== -1) {
      entities[index] = entity
      this.persist(entities)
    }
  }

  delete(id: string): void {
    const entities = this.getAll().filter((e) => e.id !== id)
    this.persist(entities)
  }

  private persist(entities: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(entities))
  }
}
