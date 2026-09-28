import { Router } from "express";

const router = Router();

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 227.52 },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 511.14 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 168.32 },
];

router.get("/stocks", (_req, res) => {
  res.json({ status: "ok", data: stocks });
});

export default router;
