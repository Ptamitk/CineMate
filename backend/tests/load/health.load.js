const target = process.env.TARGET_URL || "http://localhost:5000/health";
const concurrency = Number(process.env.CONCURRENCY || 50);
const rounds = Number(process.env.ROUNDS || 20);
const p95MaxMs = Number(process.env.P95_MAX_MS || 1000);
const p99MaxMs = Number(process.env.P99_MAX_MS || 2000);

const run = async () => {
  const started = Date.now();
  let ok = 0;
  let fail = 0;
  let total = 0;
  const latencies = [];

  for (let round = 0; round < rounds; round += 1) {
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        const requestStarted = Date.now();
        try {
          const response = await fetch(target);
          total += 1;
          if (response.ok) ok += 1;
          else fail += 1;
        } catch {
          total += 1;
          fail += 1;
        }
        latencies.push(Date.now() - requestStarted);
      })
    );
  }

  latencies.sort((a, b) => a - b);
  const percentile = (ratio) =>
    latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * ratio))] || 0;

  const p50Ms = percentile(0.5);
  const p95Ms = percentile(0.95);
  const p99Ms = percentile(0.99);

  const summary = {
    target,
    total,
    ok,
    fail,
    successRate: total ? Number(((ok / total) * 100).toFixed(2)) : 0,
    durationMs: Date.now() - started,
    p50Ms,
    p95Ms,
    p99Ms,
    limits: { p95MaxMs, p99MaxMs },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (fail > 0 || p95Ms > p95MaxMs || p99Ms > p99MaxMs) {
    process.exitCode = 1;
  }
};

run();
