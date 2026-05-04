// =============================================================================
// Taskify Backend API - Entry Point
// =============================================================================
// Express.js REST API server for the Taskify Kanban board application.
//
// Startup sequence:
//   1. Initialize database connection (Key Vault or env vars)
//   2. Register middleware (CORS, JSON parsing, error handling)
//   3. Mount route handlers
//   4. Start HTTP server
//
// Environment variables:
//   PORT                 - HTTP listen port (default: 3000)
//   AZURE_KEY_VAULT_URL  - Key Vault URI (empty = local mode)
//   CORS_ORIGIN          - Allowed CORS origin (default: *)
//   See CONFIGURATION.md for full list.
// =============================================================================

const express = require("express");
const cors = require("cors");
const { initializePool } = require("./services/database");
const { errorHandler } = require("./middleware/errorHandler");
const usersRouter = require("./routes/users");
const projectsRouter = require("./routes/projects");
const tasksRouter = require("./routes/tasks");
const commentsRouter = require("./routes/comments");

const PORT = parseInt(process.env.PORT || "3000", 10);

async function start() {
  // Initialize database connection
  await initializePool();

  const app = express();

  // ---------------------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------------------
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "X-User-Id"],
  }));
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------
  app.get("/api/health", async (req, res) => {
    try {
      const { getPool } = require("./services/database");
      await getPool().query("SELECT 1");
      res.json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api", tasksRouter);
  app.use("/api", commentsRouter);

  // ---------------------------------------------------------------------------
  // Error Handler (must be registered last)
  // ---------------------------------------------------------------------------
  app.use(errorHandler);

  // ---------------------------------------------------------------------------
  // Start Server
  // ---------------------------------------------------------------------------
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Taskify API listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error("Failed to start Taskify API:", err.message);
  process.exit(1);
});
