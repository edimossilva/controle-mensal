import type { DocumentData, Firestore } from 'firebase/firestore'
import type { Owner } from '@/entities'
import type { OwnerRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(owner: Owner): DocumentData {
  return { id: owner.id, name: owner.name }
}

function deserialize(data: DocumentData): Owner {
  return { id: data.id as string, name: data.name as string }
}

export class FirestoreOwnerRepository
  extends FirestoreRepository<Owner>
  implements OwnerRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'owners', serialize, deserialize)
  }
}
