export interface Owner {
  id: string
  name: string
}

export function createOwner(name: string): Owner {
  return {
    id: crypto.randomUUID(),
    name,
  }
}
