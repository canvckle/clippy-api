import { FirebaseDataSource } from "../firebase/firestoreDatasource.js"


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
    }
    
    res.sendStatus(200)
  })
}

export { adminRoutes }

