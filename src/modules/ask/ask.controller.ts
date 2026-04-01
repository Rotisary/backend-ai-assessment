import type { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import { askBodySchema } from "./ask.schema.js";
import * as askService from "./ask.service.js";

export const ask = async (req: Request, res: Response) => {
  const parsed = askBodySchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn("Ask validation failed", { issues: parsed.error.issues.length });
    return res.status(400).json({ error: "Missing or invalid 'question' in body" });
  }

  const result = await askService.askQuestion(parsed.data.question);

  if ("error" in result) {
    logger.warn("Ask Ollama failed", { error: result.error });
    return res.status(502).json({ error: result.error, answer: null });
  }

  return res.json({ answer: result.response });
};
