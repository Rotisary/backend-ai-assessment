import { config } from "../../config/env.js";
import * as marketService from "../market/market.service.js";
import * as ollamaService from "../ollama/ollama.service.js";
import type { OllamaGenerateResult } from "../../types/index.js";

export const buildPrompt = async (question: string): Promise<string> => {
  let context = "";
  const priceResult = await marketService.getPrice(config.defaultSymbol);

  if (!("error" in priceResult)) {
    context = `Current ${priceResult.symbol} price: ${priceResult.price}. `;
  }

  return context ? `${context}The user asks: ${question}` : question;
};

export const askQuestion = async (question: string): Promise<OllamaGenerateResult> => {
  const prompt = await buildPrompt(question);
  return ollamaService.generate(prompt);
};
