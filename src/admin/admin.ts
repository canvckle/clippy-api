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
}

export { adminRoutes }

