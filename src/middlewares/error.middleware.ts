import type { ErrorRequestHandler } from "express";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error("Unhandled error", { error: err?.message });

  if ((err as { type?: string })?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  return res.status(500).json({ error: "Internal server error" });
};
