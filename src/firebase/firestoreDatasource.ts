import { getFirestore } from 'firebase-admin/firestore'

export class FirebaseDataSource {
  public firestore: FirebaseFirestore.Firestore
  private profilesCollection = 'profiles'
  private quizDocument = 'quiz'

  constructor() {
    this.firestore = getFirestore()
  }

  async retrieveProfile(uid: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).get()
  }

  async retrieveQuizes(eventId: string) {
    return await this.firestore.collection(eventId).doc(this.quizDocument).get()
  }

  async setUsername(uid: string, username: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).set({
      username: username
    }, { merge: true })
  }
}