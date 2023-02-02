import { getFirestore } from 'firebase-admin/firestore'

export class FirebaseDataSource {
  private firestore: FirebaseFirestore.Firestore
  private profilesCollection = 'profiles'

  constructor() {
    this.firestore = getFirestore()
  }

  async retrieveProfile(uid: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).get()
  }

  async setUsername(uid: string, username: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).set({
      username: username
    }, { merge: true })
  }
}