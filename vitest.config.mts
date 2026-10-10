import { defineConfig } from "vitest/config";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/contractlens_test";
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
