require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const pool = require("./db");

async function main() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_picture TEXT
  `);
  console.log("Ensured users.profile_picture column exists");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
