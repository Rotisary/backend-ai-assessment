import type { Request, Response } from "express";
import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { klinesQuerySchema, priceQuerySchema } from "./market.schema.js";
import * as marketService from "./market.service.js";

export const getPrice = async (req: Request, res: Response) => {
  const parsed = priceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    logger.warn("Market price validation failed", { issues: parsed.error.issues.length });
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const symbol = String(parsed.data.symbol || config.defaultSymbol).toUpperCase();
  const result = await marketService.getPrice(symbol);

  if ("error" in result) {
    return res.status(502).json({ error: result.error });
  }

  return res.json(result);
};

export const getKlines = async (req: Request, res: Response) => {
  const parsed = klinesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    logger.warn("Market klines validation failed", { issues: parsed.error.issues.length });
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const symbol = String(parsed.data.symbol || config.defaultSymbol).toUpperCase();
  const interval = String(parsed.data.interval || "1h");
  const limit = typeof parsed.data.limit === "number" ? parsed.data.limit : 24;
  const result = await marketService.getKlines(symbol, interval, limit);

  if ("error" in result) {
    return res.status(502).json({ error: result.error });
  }

  return res.json(result);
};
