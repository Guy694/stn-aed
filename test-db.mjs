import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'stn_aed',
  port: parseInt(process.env.DB_PORT || '3306')
});

async function run() {
  try {
    const [rows] = await pool.execute('SELECT id FROM satun_district_polygon LIMIT 1');
    console.log("districts OK:", rows);
  } catch (err) {
    console.error("districts ERROR:", err.message);
  }
}
run();
