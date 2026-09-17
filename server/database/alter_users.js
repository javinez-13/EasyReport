require("dotenv").config();
const pool = require("./db");

async function run() {
  try {
    console.log("Updating database schema safely...");
    
    // Add missing authentication columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(50),
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // Populate username for existing user(s) so required unique constraint can be applied
    await pool.query(`
      UPDATE users SET username = 'admin' WHERE email = 'admin@barangay.gov.ph' AND (username IS NULL OR username = '');
    `);

    // Ensure any remaining rows without username get a fallback before making it unique/not null
    await pool.query(`
      UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL OR username = '';
    `);

    console.log("Database schema updated safely without data loss.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

run();
