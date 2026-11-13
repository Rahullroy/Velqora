import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool = null;

/**
 * Returns the shared PostgreSQL connection pool.
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database is not connected yet.');
  }
  return pool;
}

/**
 * Runs a parameterised SQL query (always use $1, $2... placeholders, never string concatenation).
 */
export function query(text, params) {
  return getPool().query(text, params);
}

/**
 * Connects to PostgreSQL and creates the tables if they do not exist.
 * Exits with a clear message if the connection fails.
 */
const connectDB = async () => {
    const hasSeparateVars = Boolean(process.env.DB_HOST);
  if (!hasSeparateVars && !process.env.DATABASE_URL) {
    throw new Error('Set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME or DATABASE_URL in backEnd/.env.');
  }

  const connectionOptions = hasSeparateVars
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    : { connectionString: process.env.DATABASE_URL };

  pool = new pg.Pool({
    ...connectionOptions,
    // Set DATABASE_SSL=true for hosted databases (Neon, Supabase, Render). Leave false for local.
    ssl: process.env.DATABASE_SSL === 'true' ? true : false,
    max: 10,
    connectionTimeoutMillis: 10_000
  });

  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL error:', error.message);
  });

  try {
    const { rows } = await pool.query('SELECT current_database() AS db');
    console.log(`PostgreSQL connected: ${rows[0].db}`);

    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database tables are ready.');
  } catch (error) {
    throw new Error(
      `Could not connect to PostgreSQL: ${error.message}\n` +
      'Check that PostgreSQL is running and that DATABASE_URL in backEnd/.env has the right user, password and database name.'
    );
  }
};

export default connectDB;
