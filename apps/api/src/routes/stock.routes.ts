import { Router } from "express";
import { getAllStocks } from "../services/stock.service.ts";

const router = Router();

router.get("/stocks", async (_req, res) => {
  const stocks = await getAllStocks();
  res.json({ status: "ok", data: stocks });
});

export default router;
