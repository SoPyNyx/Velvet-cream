import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "./config.js";

const pool = new pg.Pool({connectionString: config.databaseUrl});
export const db = drizzle(pool);
export { pool };
