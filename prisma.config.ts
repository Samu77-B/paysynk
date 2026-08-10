import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use process.env (not env()) so `prisma generate` works on Vercel/CI
// without DATABASE_URL being present at install time.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
