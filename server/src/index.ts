import path from "path";
import { fileURLToPath } from "url";
import express from "express";

import app from "./app";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../../client/dist")));

// Handle React routes
app.use((_, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

const port = Number(process.env.PORT || 3000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error starting server");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
