import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRouter from "./routes/health.routes.ts";
import stocksRouter from "./routes/stock.routes.ts";
import authRouter from "./routes/auth.routes.ts";

const app = express();

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", healthRouter);
app.use("/api/v1", stocksRouter);
app.use("/api/v1", authRouter);

export default app;
