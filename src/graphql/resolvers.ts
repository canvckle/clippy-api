import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { GraphQLError } from "graphql";
import { pubsub, QUIZ_UPDATED_NAME } from "../subscriptions/PubSub.js";
import { AppContext, ProfileResponse, SetUsernameResponse } from "../types/types";

/*
  Query Resolvers
*/
const retrieveProfileResolver = async (parent, _, context: AppContext, info) => {
  try { 
    const response: DocumentSnapshot<ProfileResponse> = await context.dataSources.firestore.retrieveProfile(context.userId)
    if (response.exists) {
      if (!response.data().xp) {
        await context.dataSources.firestore.setXp(context.userId, 0)
      }
      return response.data()
    } else {
      return {}
    }
  } catch (error) {
    let errorResponse: SetUsernameResponse = {
      error: error
    }
    return errorResponse
  }
}

const retrieveQuizesResolver = async (parent, { eventId }, context: AppContext, info) => {
  try {
    const response: DocumentSnapshot<ProfileResponse> = await context.dataSources.firestore.retrieveQuizes(eventId)
    if (response.exists) {
      return response.data()
    } else {
      return {}
    }
  } catch (error) {
    throw new GraphQLError('Failed to retrieve quizes')
  }
}

const retrieveLeaderboardResolver = async (parent, _, context: AppContext, info) => {
  try {
    const response: DocumentData[] = await (await context.dataSources.firestore.retrieveLeaderboard()).docs.map(doc => doc.data())
    return response
  } catch (error) {
    throw new GraphQLError('Failed to retrieve quizes')
  }
}

/*
  Mutation Resolvers
*/
const addUsernameResolver = async (parent, { username }, context: AppContext, info) => {
  try {
    await context.dataSources.firestore.setUsername(context.userId, username)
    let setUsernameResponse: SetUsernameResponse = {
      username: username
    }
    return setUsernameResponse
  } catch (error) {
    let errorResponse: SetUsernameResponse = {
      error: error
    }
    return errorResponse
  }
}

const answerQuestionResolver = async (parent, { eventId, questionId, answerId }, context: AppContext, info) => {
  try {
    await context.dataSources.firestore.answerQuestion(context.userId, eventId, questionId, answerId)
    return { eventId, questionId, answerId }
  } catch (error) {
    console.log(error)
    return {}
  }
}

const setXpResolver = async (parent, { xp }, context: AppContext, info) => {
  try {
    const response = await context.dataSources.firestore.retrieveProfile(context.userId)
    if (response.exists) {
      var currentXp = response.data().xp
      await context.dataSources.firestore.setXp(context.userId, currentXp + xp)
      return { xp: currentXp + xp }
    } else {
      return { xp }
    }
  } catch (error) {
    console.log(error)
    return {}
  }
}

/*
  Subscripition Resolvers
*/

const quizQuestionUpdatedResolver = async (parent, { eventId }, context: AppContext, info) => {
  // console.log(context)
  await context.dataSources.firestore.firestore.collection(eventId).doc(`quiz`).onSnapshot(docSnapshot => {
    console.log(docSnapshot.data())
    context.pubSub.publish(QUIZ_UPDATED_NAME, {
      quizQuestionUpdated: docSnapshot.data()
    })
  }, err => {
    console.log('error')
    console.log(err)
  })

  return context.pubSub.asyncIterator([QUIZ_UPDATED_NAME])
}

export { setXpResolver, answerQuestionResolver, quizQuestionUpdatedResolver, addUsernameResolver, retrieveProfileResolver, retrieveQuizesResolver, retrieveLeaderboardResolver }