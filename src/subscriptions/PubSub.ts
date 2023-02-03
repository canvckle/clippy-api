import { PubSub } from "graphql-subscriptions";
const QUIZ_UPDATED_NAME = "QUIZ_UPDATED";
const pubsub = new PubSub();

export { pubsub, QUIZ_UPDATED_NAME }
