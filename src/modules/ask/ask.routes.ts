import { Router } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../../config/env.js";
import { ask } from "./ask.controller.js";

const askLimiter = rateLimit({
  windowMs: config.askRateLimitWindowMs,
  max: config.askRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const askRouter = Router();

askRouter.post("/ask", askLimiter, ask);
