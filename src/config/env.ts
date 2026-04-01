import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3002),
  OLLAMA_BASE_URL: z.string().trim().min(1).default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().trim().min(1).default("llama3.2"),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  BINANCE_BASE_URL: z.string().trim().min(1).default("https://api.binance.com"),
  MARKET_SYMBOL: z.string().trim().min(1).default("BTCUSDT"),
  MARKET_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MARKET_PRICE_TTL_MS: z.coerce.number().int().nonnegative().default(5000),
  MARKET_KLINES_TTL_MS: z.coerce.number().int().nonnegative().default(30000),
  ASK_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  ASK_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${details}`);
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const env = parsed.data;

export const config = {
  port: env.PORT,
  ollamaBaseUrl: trimTrailingSlash(env.OLLAMA_BASE_URL),
  ollamaModel: env.OLLAMA_MODEL,
  ollamaTimeoutMs: env.OLLAMA_TIMEOUT_MS,
  binanceBaseUrl: trimTrailingSlash(env.BINANCE_BASE_URL),
  defaultSymbol: env.MARKET_SYMBOL,
  marketTimeoutMs: env.MARKET_TIMEOUT_MS,
  marketPriceTtlMs: env.MARKET_PRICE_TTL_MS,
  marketKlinesTtlMs: env.MARKET_KLINES_TTL_MS,
  askRateLimitWindowMs: env.ASK_RATE_LIMIT_WINDOW_MS,
  askRateLimitMax: env.ASK_RATE_LIMIT_MAX,
};

export type Config = typeof config;
