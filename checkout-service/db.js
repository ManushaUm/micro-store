const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'shopping_site',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Processing',
      items JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Orders table created or exists');
  } catch (err) {
    console.error('Error creating orders table', err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB
};
