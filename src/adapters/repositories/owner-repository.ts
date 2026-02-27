import type { Owner } from '@/entities'
import type { OwnerRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:owners'

export class LocalStorageOwnerRepository
  extends LocalStorageRepository<Owner>
  implements OwnerRepository
{
  constructor() {
    super(STORAGE_KEY)
  }
}
