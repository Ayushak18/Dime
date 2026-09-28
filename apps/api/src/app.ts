import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1", healthRouter);

export default app;
