import { PubSub } from "graphql-subscriptions"
import { FirebaseDataSource } from "../firebase/firestoreDatasource"

export interface DataSources {
  firestore: FirebaseDataSource
}

export interface AppContext {
  userId?: string
  dataSources: DataSources
  pubSub: PubSub
}

// Add Username
export interface SetUsernameResponse {
  username?: string
  error?: string
}

export interface ProfileResponse {
  username?: string
  xp?: number
}