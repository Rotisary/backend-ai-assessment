import express from "express";
import cors from "cors";
import { requestLogger } from "./utils/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "64kb" }));
  app.use(requestLogger());

  app.use("/api", apiRouter);

  app.use(errorMiddleware);

  return app;
};
