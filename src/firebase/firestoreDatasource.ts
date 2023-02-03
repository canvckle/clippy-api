import { FieldValue, getFirestore } from 'firebase-admin/firestore'

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

  async retrieveLeaderboard() {
    return await this.firestore.collection(this.profilesCollection).orderBy('xp').limit(25).get()
  }

  async setUsername(uid: string, username: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).set({
      username: username
    }, { merge: true })
  }
  
  async setXp(uid: string, xp: number) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).set({
      xp: xp
    }, { merge: true })
  }

  async answerQuestion(uid: string, eventId: string, questionId: string, answerId: string) {
    return await this.firestore.collection(this.profilesCollection).doc(uid).update({
      answers: FieldValue.arrayUnion({ eventId, questionId, answerId })
    })
  }
}