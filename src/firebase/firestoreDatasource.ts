import { DocumentSnapshot, FieldValue, getFirestore } from 'firebase-admin/firestore'
import { ProfileResponse } from '../types/types'

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
    var response = await this.firestore.collection(eventId).doc(this.quizDocument).get()
    if (response.exists) {
      var data = response.data()
      var questions = data.questions.map(question => {
        if (question.id == questionId) {
          var options = question.options.map(option => {
            if (option.id == answerId) {
              if (option.hasOwnProperty('totalAnswers')) {
                option.totalAnswers = ++option.totalAnswers
              }
              else {
                option.totalAnswers = 1
              }
            }
            return option
          })
          console.log(options)
          question.options = options
        }
        return question
      })
      console.log(questions)
      await this.firestore.collection(eventId).doc(this.quizDocument)
        .update({
          [`questions`]: questions
        })
    }

    return await this.firestore.collection(this.profilesCollection).doc(uid).update({
      answers: FieldValue.arrayUnion({ eventId, questionId, answerId })
    })
  }
}