import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";

const app = express();
// Set the port this microservice will run on
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use( 
  "/trpc",
  trpcExpress.createExpressMiddleware({
    // Pass in our router
    router: appRouter,
    // createContext runs on every incoming request. It builds the "ctx" object we use in our routes.
    createContext: ({ req }) => {
      const authHeader = req.headers.authorization;

      // We look at the HTTP headers of the incoming request.
      // We are looking for an "authorization" header.
      if (authHeader) {
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : authHeader;
        if (token) return { token };
      }

      return {};
    },
  }),
);

// Start the Express server and listen for incoming traffic
app.listen(PORT, () => {
  console.log(`Primary Backend API listening on http://localhost:${PORT}`);
});
