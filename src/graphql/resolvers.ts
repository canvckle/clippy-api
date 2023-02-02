import { DocumentSnapshot } from "firebase-admin/firestore";
import { AppContext, ProfileResponse, SetUsernameResponse } from "../types/types";

/*
  Query Resolvers
*/
const retrieveProfileResolver = async (parent, _, context: AppContext, info) => {
  try { 
    const response: DocumentSnapshot<ProfileResponse> = await context.dataSources.firestore.retrieveProfile(context.userId)
    if (response.exists) {
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



export { addUsernameResolver, retrieveProfileResolver }