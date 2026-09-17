const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../database/db");
const { JWT_SECRET } = require("../middleware/auth");

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: rows[0].role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: rows[0].id, fullName: rows[0].full_name, email: rows[0].email, role: rows[0].role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { login };
