// =============================================================================
// Taskify Agent - Entry Point
// =============================================================================
// Background agent that polls the task_jobs table for pending jobs and
// dispatches them to the appropriate processor. Uses SELECT FOR UPDATE
// SKIP LOCKED for safe concurrent job claiming.
// =============================================================================

const { Pool } = require("pg");
const { processDecompose } = require("./processors/decompose");

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "3000", 10);
const API_URL = process.env.API_URL || "http://api:3000";

const pool = new Pool({
  host: process.env.PGHOST || "db",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "taskify",
  port: parseInt(process.env.PGPORT || "5432", 10),
});

async function pollJobs() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Claim one pending job atomically
    const { rows } = await client.query(
      `SELECT * FROM task_jobs
       WHERE status = 'pending'
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (rows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const job = rows[0];
    console.log(`[agent] Claimed job ${job.id} (type: ${job.job_type}) for task ${job.task_id}`);

    // Mark as processing
    await client.query(
      "UPDATE task_jobs SET status = 'processing' WHERE id = $1",
      [job.id]
    );
    await client.query("COMMIT");

    // Dispatch to processor
    try {
      let result;
      if (job.job_type === "decompose") {
        result = await processDecompose(job, API_URL, pool);
      } else {
        result = { error: `Unknown job type: ${job.job_type}` };
      }

      // Mark complete
      await pool.query(
        "UPDATE task_jobs SET status = 'complete', result = $1, completed_at = NOW() WHERE id = $2",
        [JSON.stringify(result), job.id]
      );
      console.log(`[agent] Job ${job.id} completed successfully`);
    } catch (err) {
      // Mark failed
      await pool.query(
        "UPDATE task_jobs SET status = 'failed', result = $1, completed_at = NOW() WHERE id = $2",
        [JSON.stringify({ error: err.message }), job.id]
      );
      console.error(`[agent] Job ${job.id} failed:`, err.message);
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[agent] Poll error:", err.message);
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`[agent] Starting Taskify Agent (poll interval: ${POLL_INTERVAL}ms)`);
  console.log(`[agent] API URL: ${API_URL}`);

  // Wait for DB to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query("SELECT 1");
      console.log("[agent] Database connected");
      break;
    } catch {
      retries--;
      console.log(`[agent] Waiting for database... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (retries === 0) {
    console.error("[agent] Could not connect to database");
    process.exit(1);
  }

  // Start polling
  setInterval(pollJobs, POLL_INTERVAL);
  pollJobs(); // Run immediately on startup
}

main();
