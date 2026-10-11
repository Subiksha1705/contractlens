import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { getEnv } from "../env";

import { ensureTablesExist } from "./init";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const env = getEnv();
  const sql = neon(env.DATABASE_URL);
  dbInstance = drizzle(sql, { schema });
  
  // Asynchronously ensure schema is initialized
  ensureTablesExist().catch((err) => {
    console.warn("Schema initialization error:", err);
  });

  return dbInstance;
}

