import { z } from "zod";

const queryString = z.preprocess((value) => {
  if (Array.isArray(value)) return value[0];
  return value;
}, z.string());

const symbolSchema = z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9]+$/)
  ).optional();

const intervalSchema = z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().min(1).max(10).regex(/^\d+(m|h|d|w|M)$/)
  ).optional();

const limitSchema = z.preprocess((value) => {
  if (Array.isArray(value)) value = value[0];
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().min(1).max(1500).optional());

export const priceQuerySchema = z.object({
  symbol: symbolSchema,
});

export const klinesQuerySchema = z.object({
  symbol: symbolSchema,
  interval: intervalSchema,
  limit: limitSchema,
});

export type PriceQuery = z.infer<typeof priceQuerySchema>;
export type KlinesQuery = z.infer<typeof klinesQuerySchema>;
