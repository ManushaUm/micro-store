const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'shopping_site',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

// Initialize DB schema
const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Users table created or exists');
  } catch (err) {
    console.error('Error creating users table', err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB
};
