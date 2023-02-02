import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import bodyParser from "body-parser";
import cors from "cors";
import { verifyToken } from "./authentication/login.js";
import { GraphQLError } from "graphql";
import { FirebaseDataSource } from "./firebase/firestoreDatasource.js";
import { AppContext } from "./types/types.js";
import { addUsernameResolver, retrieveProfileResolver } from "./graphql/resolvers.js";
import { applicationDefault, initializeApp } from 'firebase-admin/app';

initializeApp({
  credential: applicationDefault(),
  projectId: 'clippy-hackathon'
})

const PORT = 4000;
const pubsub = new PubSub();

// Schema definition
const typeDefs = `#graphql
  type Query {
    profile: ProfileResponse
  }

  type Mutation {
    addUsername(username: String): SetUsernameResponse
  }

  type Subscription {
    numberIncremented: Int
  }

  # Profile
  type ProfileResponse {
    username: String
    xp: Int
  }

  type SetUsernameResponse {
    username: String
    error: String
  }
`;

// Resolver map
const resolvers = {
  Query: {
    profile: retrieveProfileResolver,
  },
  Mutation: {
    addUsername: addUsernameResolver
  },
  Subscription: {
    numberIncremented: {
      subscribe: () => pubsub.asyncIterator(["NUMBER_INCREMENTED"]),
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
      return { token: 'Test' }
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
  expressMiddleware(server, { context: async ({ req }) => {
    let context: AppContext = {
      dataSources: {
        firestore: new FirebaseDataSource()
      }
    }

    const token = req.headers.authorization || '';
    if (token) {
      const uid = await verifyToken(token)

      if (uid) {
        context.userId = uid
        return context
      } else {
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 }
          }
        })
      }
    } else {
      throw new GraphQLError('No authorization token provided', { 
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 }
        }
      })
    }
    
  } })
);

// Now that our HTTP server is fully set up, actually listen.
httpServer.listen(PORT, () => {
  console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`
  );
});

// In the background, increment a number every second and notify subscribers when it changes.
let currentNumber = 0;
function incrementNumber() {
  currentNumber++;
  pubsub.publish("NUMBER_INCREMENTED", { numberIncremented: currentNumber });
  setTimeout(incrementNumber, 1000);
}

// Start incrementing
// incrementNumber();