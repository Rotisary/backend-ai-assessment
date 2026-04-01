import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type { OllamaGenerateResult } from "../../types/index.js";

const { ollamaBaseUrl, ollamaModel, ollamaTimeoutMs } = config;

export async function ping(): Promise<boolean> {
  const url = `${ollamaBaseUrl}/api/tags`;
  logger.info("Ollama ping", { url });
  const start = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
    const resp = await fetch(url, { signal: controller.signal });
    const durationMs = Date.now() - start;

    if (!resp.ok) {
      const body = await resp.text();
      logger.warn("Ollama ping failed", {
        status: resp.status,
        durationMs,
        body: body.slice(0, 200),
      });
      return false;
    }

    logger.info("Ollama ping OK", { durationMs, model: ollamaModel });
    return true;
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    logger.warn("Ollama ping error", {
      durationMs,
      error,
      baseUrl: ollamaBaseUrl,
    });
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function generate(prompt: string): Promise<OllamaGenerateResult> {
  const url = `${ollamaBaseUrl}/api/generate`;
  const body = JSON.stringify({
    model: ollamaModel,
    prompt,
    stream: false,
  });
  logger.info("Ollama generate", {
    model: ollamaModel,
    promptLength: prompt?.length ?? 0,
  });
  const start = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    timeoutId = setTimeout(() => controller.abort(), ollamaTimeoutMs);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    const durationMs = Date.now() - start;
    const rawBody = await resp.text();

    if (!resp.ok) {
      logger.error("Ollama generate HTTP error", {
        status: resp.status,
        durationMs,
        body: rawBody.slice(0, 300),
      });
      return { error: `Ollama HTTP ${resp.status}: ${rawBody.slice(0, 200)}` };
    }

    let result: { response?: string; error?: string };
    try {
      result = JSON.parse(rawBody) as { response?: string; error?: string };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      logger.error("Ollama generate parse error", { durationMs, error });
      return { error: "Invalid JSON from Ollama" };
    }

    if (result.error) {
      logger.warn("Ollama returned error field", {
        error: result.error,
        durationMs,
      });
      return { error: result.error };
    }

    logger.info("Ollama generate OK", {
      model: ollamaModel,
      durationMs,
      responseLength: result.response?.length ?? 0,
    });

    return { response: result.response ?? "" };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    logger.error("Ollama generate request failed", {
      durationMs,
      error,
      baseUrl: ollamaBaseUrl,
    });
    return { error };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
