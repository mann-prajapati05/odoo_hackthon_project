import "dotenv/config";
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: String(process.env.PGPASSWORD ?? ""),
  database: process.env.PGDATABASE || "postgres",
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL client error", error);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
