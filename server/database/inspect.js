require("dotenv").config();
const pool = require("./db");

async function inspect() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
  );
  console.log("Tables:", tables.rows);

  for (const t of tables.rows) {
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [t.table_name]
    );
    console.log(`\n${t.table_name}:`, cols.rows);
  }

  await pool.end();
}

inspect().catch(console.error);
