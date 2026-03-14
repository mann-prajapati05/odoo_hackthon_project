import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const dbName = process.env.PGDATABASE || "core_inventory";
const dbNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

if (!dbNamePattern.test(dbName)) {
  throw new Error(
    "PGDATABASE contains invalid characters. Use letters, numbers, and underscores only."
  );
}

const adminPool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: String(process.env.PGPASSWORD ?? ""),
  database: "postgres",
});

const schemaPool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || "postgres",
  password: String(process.env.PGPASSWORD ?? ""),
  database: dbName,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../sql/init.sql");

const init = async () => {
  try {
    const exists = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (!exists.rows.length) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
    }

    const schemaSql = await fs.readFile(schemaPath, "utf8");
    await schemaPool.query(schemaSql);
    console.log("Created/verified IMS schema tables");
    console.log("Database initialization completed.");
  } catch (error) {
    if (error.message?.includes("SCRAM")) {
      console.error(
        "Failed to initialize database: PostgreSQL requires a valid password. Set PGPASSWORD in backend/.env and run again."
      );
    } else {
      console.error("Failed to initialize database", error.message);
    }
    process.exitCode = 1;
  } finally {
    await adminPool.end();
    await schemaPool.end();
  }
};

init();
