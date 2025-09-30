// Import required packages
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json()); // Built-in JSON parser

// ✅ Connect to MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',       // your MySQL username (XAMPP default: 'root')
  password: '',       // your MySQL password (XAMPP default: empty)
  database: 'rest_appi' // your database name
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// ✅ GET route for testing server reachability
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// ✅ Create user endpoint with validation and exact timestamp
app.post('/users', (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth } = req.body;

  // Check empty body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body is empty or invalid JSON" });
  }

  // Required fields validation
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "First name, last name, and email are required." });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  // Phone number validation: exactly 10 digits
  const phoneRegex = /^[0-9]{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
  }

  const created_at = new Date();

  // Insert user into database
  const sql = `INSERT INTO users (first_name, last_name, email, phone, date_of_birth)
               VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [first_name, last_name, email, phone, date_of_birth], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Email already exists." });
      }
      console.error('Insert error:', err);
      return res.status(500).json({ error: "Database error" });
    }

    // Return the newly created user + timestamp
    db.query(`SELECT * FROM users WHERE id = ?`, [result.insertId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const user = rows[0];
      user.created_at = created_at; // add exact time
      res.status(201).json(user);
    });
  });
});

// ✅ GET all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// ✅ Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
