import {
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

export class FirestoreSharingRepository {
  constructor(private readonly db: Firestore) {}

  async resolveDataOwnerUid(email: string): Promise<string | null> {
    const snap = await getDoc(doc(this.db, 'shares', email))
    if (!snap.exists()) return null
    return (snap.data().ownerUid as string) ?? null
  }

  async getSharedEmails(ownerUid: string): Promise<string[]> {
    const snap = await getDocs(collection(this.db, 'users', ownerUid, 'sharedEmails'))
    return snap.docs.map((d) => d.id)
  }

  async addSharedEmail(ownerUid: string, email: string): Promise<void> {
    const batch = writeBatch(this.db)
    batch.set(doc(this.db, 'users', ownerUid, 'sharedEmails', email), { email })
    batch.set(doc(this.db, 'shares', email), { ownerUid })
    await batch.commit()
  }

  async removeSharedEmail(ownerUid: string, email: string): Promise<void> {
    const batch = writeBatch(this.db)
    batch.delete(doc(this.db, 'users', ownerUid, 'sharedEmails', email))
    batch.delete(doc(this.db, 'shares', email))
    await batch.commit()
  }
}
