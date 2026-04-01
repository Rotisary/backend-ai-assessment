# Notes

## Market API choice
- Binance public REST API (price and klines). No API keys required.

## Design choices
- Stateless Express API with per-request validation using Zod.
- TypeScript modular structure with controllers, services, routes, and schemas.
- Short in-memory TTL cache for price and klines to reduce upstream latency.
- Timeouts on all upstream calls (market + Ollama) to avoid hanging requests.
- Rate limiting on `/api/ask` to reduce abuse and keep Ollama responsive.
- Structured logging through `nj-logger` (no console logging).

## Trade-offs
- In-memory cache is per-instance and resets on restart; I chose it for simplicity, zero external dependencies, and fast setup within the assessment scope.
- Rate limiting is per-instance without a shared store.
- No persistence layer, by design, to keep the service stateless.
- External calls are handled synchronously because users expect an immediate response; backgrounding them would complicate the flow without improving the user-facing latency for this use case.

## Extensions
- Add Redis for shared cache and rate-limit store.
- Add streaming responses from Ollama for large outputs.
- Add metrics and tracing (Prometheus, OpenTelemetry).
- Add background queue for long-running inference.
- Add async background processing for Ollama `/api/ask` calls that involve document processing.
- Add logging of running API endpoints.

## Nginx reverse proxy example
```nginx
server {
    listen 80;
    server_name your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 120s;
    }
}
```
