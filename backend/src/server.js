import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import logger from "./logger.js";
import { runAgent } from "./agent/agents.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "../../frontend/dist");

const allowedOrigins = [
//   "https://website-automation-agent-nine.vercel.app",
  "http://localhost:5173",

];

const app = express();
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

app.get("/api/config", (req, res) => {
  res.json({
    model: config.model,
    headless: config.headless,
    maxSteps: config.maxSteps,
    defaultUrl: config.defaultUrl,
    defaultGoal: config.defaultGoal,
  });
});

let isRunning = false;

app.get("/api/run", async (req, res) => {
  const url = req.query.url || config.defaultUrl;
  const goal = req.query.goal || config.defaultGoal;

  if (isRunning) {
    res.setHeader("Content-Type", "text/event-stream");
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "A run is already in progress. Please wait for it to finish.",
      })}\n\n`
    );
    return res.end();
  }
  isRunning = true;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  logger.info("Run requested", { url, goal });
  send({ type: "start", url, goal, model: config.model });

  try {
    const result = await runAgent({ url, goal, onEvent: send });
    send({ type: "finished", ...result });
  } catch (err) {
    logger.error("Run failed", err.message);
    send({ type: "error", message: err.message });
  } finally {
    isRunning = false;
    res.end();
  }
});

app.listen(config.port, () => {
  logger.ok(`Backend listening on http://localhost:${config.port}`);
  logger.info(`Model: ${config.model} | headless: ${config.headless}`);
});
