import { Router } from "express";
import { askRouter } from "../modules/ask/ask.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { marketRouter } from "../modules/market/market.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(marketRouter);
apiRouter.use(askRouter);
