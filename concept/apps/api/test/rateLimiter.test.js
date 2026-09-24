const assert = require("node:assert/strict");
const test = require("node:test");
const http = require("node:http");

const { createApp } = require("../src");

async function withServer(run) {
  const app = createApp({
    healthCheck: (_req, res) => {
      res.json({ status: "ok" });
    },
  });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("rate limits the health endpoint and returns standard headers", async () => {
  const previousMax = process.env.RATE_LIMIT_MAX_REQUESTS;
  const previousWindow = process.env.RATE_LIMIT_WINDOW_MS;
  process.env.RATE_LIMIT_MAX_REQUESTS = "2";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";

  try {
    await withServer(async (baseUrl) => {
      const first = await fetch(`${baseUrl}/api/health`);
      const second = await fetch(`${baseUrl}/api/health`);
      const limited = await fetch(`${baseUrl}/api/health`);

      assert.equal(first.status, 200);
      assert.equal(second.status, 200);
      assert.equal(limited.status, 429);
      assert.equal(limited.headers.get("ratelimit-limit"), "2");
      assert.equal(limited.headers.get("ratelimit-remaining"), "0");
      assert.match(
        (await limited.json()).error.message,
        /too many requests/i
      );
    });
  } finally {
    if (previousMax === undefined) {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
    } else {
      process.env.RATE_LIMIT_MAX_REQUESTS = previousMax;
    }
    if (previousWindow === undefined) {
      delete process.env.RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  }
});

test("rate limits every path mounted below /api", async () => {
  const previousMax = process.env.RATE_LIMIT_MAX_REQUESTS;
  process.env.RATE_LIMIT_MAX_REQUESTS = "1";

  try {
    await withServer(async (baseUrl) => {
      const allowed = await fetch(`${baseUrl}/api/not-found`);
      const limited = await fetch(`${baseUrl}/api/not-found`);

      assert.equal(allowed.status, 404);
      assert.equal(limited.status, 429);
    });
  } finally {
    if (previousMax === undefined) {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
    } else {
      process.env.RATE_LIMIT_MAX_REQUESTS = previousMax;
    }
  }
});

