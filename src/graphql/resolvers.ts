import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { GraphQLError } from "graphql";
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

export { addUsernameResolver, retrieveProfileResolver, retrieveQuizesResolver, retrieveLeaderboardResolver }