import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type {
  MarketKlinesResult,
  MarketKlinesSuccess,
  MarketPriceResult,
  MarketPriceSuccess,
} from "../../types/index.js";

const {
  binanceBaseUrl,
  defaultSymbol,
  marketTimeoutMs,
  marketPriceTtlMs,
  marketKlinesTtlMs,
} = config;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<MarketPriceSuccess | MarketKlinesSuccess>>();

const normalizeSymbol = (symbol?: string) =>
  String(symbol || defaultSymbol).trim().toUpperCase();

const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = <T extends MarketPriceSuccess | MarketKlinesSuccess>(
  key: string,
  value: T,
  ttlMs: number
) => {
  if (!ttlMs || ttlMs <= 0) return;
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export async function getPrice(symbol?: string): Promise<MarketPriceResult> {
  const resolvedSymbol = normalizeSymbol(symbol);
  const cacheKey = `price:${resolvedSymbol}`;
  const cached = getCache<MarketPriceSuccess>(cacheKey);

  if (cached) {
    logger.info("Market price cache hit", { symbol: resolvedSymbol });
    return cached;
  }

  const url = `${binanceBaseUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(
    resolvedSymbol
  )}`;
  logger.info("Market fetch price", { symbol: resolvedSymbol, baseUrl: binanceBaseUrl });
  const start = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    timeoutId = setTimeout(() => controller.abort(), marketTimeoutMs);
    const resp = await fetch(url, { signal: controller.signal });
    const durationMs = Date.now() - start;
    const rawBody = await resp.text();

    let data: { price?: string; symbol?: string; msg?: string; code?: number };
    try {
      data = JSON.parse(rawBody) as {
        price?: string;
        symbol?: string;
        msg?: string;
        code?: number;
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn("Market price JSON parse failed", {
        symbol: resolvedSymbol,
        durationMs,
        error,
      });
      return { error: "Invalid JSON from market API" };
    }

    if (!resp.ok) {
      logger.warn("Market price failed", {
        symbol: resolvedSymbol,
        status: resp.status,
        durationMs,
        code: data?.code,
        msg: data?.msg,
      });
      return { error: data?.msg || `HTTP ${resp.status}` };
    }

    const result: MarketPriceSuccess = {
      price: data.price ?? "",
      symbol: data.symbol ?? resolvedSymbol,
    };
    setCache(cacheKey, result, marketPriceTtlMs);
    logger.info("Market price OK", {
      symbol: result.symbol,
      price: result.price,
      durationMs,
    });
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    logger.error("Market price error", {
      symbol: resolvedSymbol,
      durationMs,
      error,
    });
    return { error };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function getKlines(
  symbol?: string,
  interval = "1h",
  limit = 24
): Promise<MarketKlinesResult> {
  const resolvedSymbol = normalizeSymbol(symbol);
  const resolvedInterval = String(interval).trim();
  const resolvedLimit = Math.min(Math.max(1, limit), 1500);
  const cacheKey = `klines:${resolvedSymbol}:${resolvedInterval}:${resolvedLimit}`;
  const cached = getCache<MarketKlinesSuccess>(cacheKey);

  if (cached) {
    logger.info("Market klines cache hit", {
      symbol: resolvedSymbol,
      interval: resolvedInterval,
      limit: resolvedLimit,
    });
    return cached;
  }

  const params = new URLSearchParams({
    symbol: resolvedSymbol,
    interval: resolvedInterval,
    limit: String(resolvedLimit),
  });
  const url = `${binanceBaseUrl}/api/v3/klines?${params}`;
  logger.info("Market fetch klines", {
    symbol: resolvedSymbol,
    interval: resolvedInterval,
    limit: resolvedLimit,
    baseUrl: binanceBaseUrl,
  });
  const start = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    timeoutId = setTimeout(() => controller.abort(), marketTimeoutMs);
    const resp = await fetch(url, { signal: controller.signal });
    const durationMs = Date.now() - start;
    const rawBody = await resp.text();

    let data: unknown;
    try {
      data = JSON.parse(rawBody) as unknown;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn("Market klines JSON parse failed", {
        symbol: resolvedSymbol,
        interval: resolvedInterval,
        durationMs,
        error,
      });
      return { error: "Invalid JSON from market API" };
    }

    if (!resp.ok) {
      const msg = typeof data === "object" && data ? (data as { msg?: string }).msg : String(data);
      logger.warn("Market klines failed", {
        symbol: resolvedSymbol,
        interval: resolvedInterval,
        status: resp.status,
        durationMs,
        msg,
      });
      return { error: msg || `HTTP ${resp.status}` };
    }

    if (!Array.isArray(data)) {
      logger.warn("Market klines unexpected format", {
        symbol: resolvedSymbol,
        interval: resolvedInterval,
        durationMs,
      });
      return { error: "Unexpected response format" };
    }

    const result: MarketKlinesSuccess = { klines: data, symbol: resolvedSymbol };
    setCache(cacheKey, result, marketKlinesTtlMs);
    logger.info("Market klines OK", {
      symbol: resolvedSymbol,
      interval: resolvedInterval,
      count: data.length,
      durationMs,
    });
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    logger.error("Market klines error", {
      symbol: resolvedSymbol,
      interval: resolvedInterval,
      durationMs,
      error,
    });
    return { error };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
