import { Router } from "express";
import { getKlines, getPrice } from "./market.controller.js";

export const marketRouter = Router();

marketRouter.get("/market/price", getPrice);
marketRouter.get("/market/klines", getKlines);
