import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import loginRoute from "./routes/login";
import { attachSocket } from "./socket";

const app = express();

// CORS middleware
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

// REST routes
app.use("/api", loginRoute);

const httpServer = http.createServer(app);
attachSocket(httpServer);

const PORT = Number(process.env.PORT || 4000);
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
