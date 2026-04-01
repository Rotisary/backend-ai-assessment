export type ErrorResult = { error: string };

export type MarketPriceSuccess = { price: string; symbol: string };
export type MarketPriceResult = MarketPriceSuccess | ErrorResult;

export type MarketKlinesSuccess = { klines: unknown[]; symbol: string };
export type MarketKlinesResult = MarketKlinesSuccess | ErrorResult;

export type OllamaGenerateResult = { response: string } | ErrorResult;
