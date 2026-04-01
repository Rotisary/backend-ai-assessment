import type { Request, Response } from "express";
import * as ollamaService from "../ollama/ollama.service.js";

export const getHealth = async (_req: Request, res: Response) => {
  const ollamaReachable = await ollamaService.ping();
  return res.json({
    ok: true,
    ollama: ollamaReachable ? "reachable" : "unreachable",
  });
};
