import { spawnSync } from "node:child_process";

const attempts = 4;
const waitMs = 12_000;

for (let i = 1; i <= attempts; i += 1) {
  console.log(`prisma migrate deploy (attempt ${i}/${attempts})`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status === 0) process.exit(0);
  if (i < attempts) {
    console.log(
      `Migrate failed (exit ${result.status}). Retrying in ${waitMs / 1000}s — Neon often holds Prisma's advisory lock after a cold start or overlapping deploy.`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

process.exit(1);
