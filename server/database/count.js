require("dotenv").config();
const pool = require("./db");

async function count() {
  for (const t of ["users", "complaints", "residents", "hearings", "summons"]) {
    const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
    console.log(t, r.rows[0].c);
  }
  await pool.end();
}

count().catch(console.error);
