import * as dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer, request } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { pubsub, QUIZ_UPDATED_NAME } from './subscriptions/PubSub.js'
import bodyParser from "body-parser";
import cors from "cors";
import { verifyToken } from "./authentication/login.js";
import { GraphQLError } from "graphql";
import { FirebaseDataSource } from "./firebase/firestoreDatasource.js";
import { AppContext } from "./types/types.js";
import {
  addUsernameResolver,
  answerQuestionResolver,
  quizQuestionUpdatedResolver,
  retrieveLeaderboardResolver,
  retrieveProfileResolver,
  retrieveQuizesResolver,
} from "./graphql/resolvers.js";
import { initializeApp } from "firebase-admin/app";
import pkg from "firebase-admin";
import { adminRoutes } from "./admin/admin.js";
const { credential } = pkg;

initializeApp({
  credential: credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  projectId: "clippy-hackathon",
});

const PORT = process.env.PORT || 4000;

// Schema definition
const typeDefs = `#graphql
  type Query {
    profile: ProfileResponse
    quiz(eventId: String!): Quiz
    leaderboard: [ProfileResponse]
  }

  type Mutation {
    addUsername(username: String!): SetUsernameResponse
    answerQuestion(eventId: String! questionId: String!, answerId: String!): AnswerQuestionResponse
  }

  type Subscription {
    quizQuestionUpdated(eventId: String!): Quiz
  }

  type AnswerQuestionResponse {
    eventId: String
    questionId: String
    answerId: String
  }

  # Profile
  type ProfileResponse {
    username: String
    xp: Int
    answers: [Answers]
  }

  type Answers {
    answerId: String
    eventId: String
    questionId: String
  }

  type SetUsernameResponse {
    username: String
    error: String
  }

  # Picks
  enum EventState {
    PREGAME
    LIVE
    FINAL
  }

  type QuizMetadata {
    name: String!
    eventState: EventState!
  }

  type QuizOption {
    id: ID!
    name: String!
    totalAnswers: Int
  }

  type QuizQuestion {
    id: ID!
    name: String!
    options: [QuizOption]!
    correctAnswer: ID
    xp: Int!
    answerTime: Int
  }

  type Quiz {
    id: ID!
    metadata: QuizMetadata!
    questions: [QuizQuestion]!
  }
`;

// Resolver map
const resolvers = {
  Query: {
    profile: retrieveProfileResolver,
    quiz: retrieveQuizesResolver,
    leaderboard: retrieveLeaderboardResolver
  },
  Mutation: {
    addUsername: addUsernameResolver,
    answerQuestion: answerQuestionResolver
  },
  Subscription: {
    quizQuestionUpdated: {
      subscribe: quizQuestionUpdatedResolver,
    },
    
  },
};

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    context: async (ctx, msg, args) => {
      let context: AppContext = {
        pubSub: pubsub,
        dataSources: {
          firestore: new FirebaseDataSource(),
        },
      };
      const token = ctx.connectionParams['Authorization'] as string || "";

      if (token) {
        const uid = await verifyToken(token);
        console.log(uid)
        if (uid) {
          context.userId = uid;
          return context;
        } else {
          return {}
        }
      } else {
        return {}
      }
    },
    schema,
  },
  wsServer
);

// Set up ApolloServer.
const server = new ApolloServer<AppContext>({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      
      let context: AppContext = {
        pubSub: pubsub,
        dataSources: {
          firestore: new FirebaseDataSource(),
        },
      };
      var isIntroSpection = false

      const token = req.headers.authorization || "";

      if (req.body.operationName === "IntrospectionQuery") {
        isIntroSpection = true
      }

      if (token) {
        const uid = await verifyToken(token);

        if (uid) {
          context.userId = uid;
          return context;
        } else {
          if (isIntroSpection) {
            return context
          }
          throw new GraphQLError("User is not authenticated", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        }
      } else {
        if (isIntroSpection) {
          return context
        }
        throw new GraphQLError("No authorization token provided", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 401 },
          },
        });
      }
    },
  })
);

adminRoutes(app, cors<cors.CorsRequest>(), bodyParser.json())

// Now that our HTTP server is fully set up, actually listen.
httpServer.listen(PORT, () => {
  console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`
  );
});
