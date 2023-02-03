import { FieldValue } from "firebase-admin/firestore"
import { FirebaseDataSource } from "../firebase/firestoreDatasource.js"
import { pubsub, QUIZ_UPDATED_NAME } from "../subscriptions/PubSub.js"


const adminRoutes = (app, cors, bodyParser) => {
  app.post('/add/quiz', cors, bodyParser, async (req, res) => {
    let firestoreDatasource = new FirebaseDataSource()
    console.log(req.body)
    await firestoreDatasource.firestore
      .collection(req.body.eventId)
      .doc(`quiz`)
      .set(req.body.quiz)
    res.sendStatus(200)
  })

  app.post('/add/quiz/live/question', cors, bodyParser, async (req, res) => {
    let firestoreDatasource = new FirebaseDataSource()
    console.log(req.body)
    await firestoreDatasource.firestore
      .collection(req.body.eventId)
      .doc(`quiz`)
      .update({
        questions: FieldValue.arrayUnion(req.body.question)
      })
    res.sendStatus(200)
  })

  app.post('/update/correct/answer', cors, bodyParser, async (req, res) => {
    let firestoreDatasource = new FirebaseDataSource()
    console.log(req.body)
    var response = await firestoreDatasource.firestore.collection(req.body.eventId).doc('quiz').get()
    if (response.exists) {
      var data = response.data()
      var questions = data.questions.map(question => {
        if (question.id == req.body.questionId) {
          question.correctAnswer = req.body.correctAnswerId
        }
        return question
      })
      console.log(questions)
      await firestoreDatasource.firestore
        .collection(req.body.eventId)
        .doc(`quiz`)
        .update({
          [`questions`]: questions
        })
      
      var correctUsers = await firestoreDatasource.firestore
        .collection('profiles')
        .where('answers', 'array-contains', { eventId: req.body.eventId, answerId: req.body.correctAnswerId, questionId: req.body.questionId })
        .get()
        correctUsers.docs.forEach( async (doc) => {
          var current = doc.data()
          var question = questions.find(question => question.id === req.body.questionId)
          console.log(`adding ${question.xp}xp to ${doc.id}`)
          await firestoreDatasource.setXp(doc.id, current.xp + question.xp)
        })
    }

    res.sendStatus(200)
  })
}

export { adminRoutes }

