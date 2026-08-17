import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Disables strict SSL certificate validation
  },
});

pool.on("connect", () => {
  console.log("🗄️ Connected to PostgreSQL Database");
});

pool.on("error", (err) => {
  console.error("❌ Database Connection Error:", err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
