import type { Owner } from '@/entities'
import { createOwner } from '@/entities'
import type { OwnerRepository, BankAccountRepository } from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class OwnerUseCases {
  constructor(
    private ownerRepo: OwnerRepository,
    private bankAccountRepo: BankAccountRepository,
  ) {}

  getAll(): Owner[] {
    return this.ownerRepo.getAll()
  }

  getById(id: string): Owner | undefined {
    return this.ownerRepo.getById(id)
  }

  create(name: string): Owner {
    const owner = createOwner(name)
    this.ownerRepo.create(owner)
    return owner
  }

  update(owner: Owner): void {
    this.ownerRepo.update(owner)
  }

  delete(id: string): UseCaseResult {
    const accounts = this.bankAccountRepo.getByOwnerId(id)
    if (accounts.length > 0) {
      return {
        success: false,
        error: 'Não é possível excluir o titular pois existem contas vinculadas.',
      }
    }
    this.ownerRepo.delete(id)
    return { success: true }
  }
}
