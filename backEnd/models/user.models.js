import { query } from '../config/db.config.js';

/**
 * User data-access layer (PostgreSQL).
 */
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at
  };
}

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, password_hash, last_login_at, created_at`,
    [name, email, passwordHash]
  );
  return mapUser(rows[0]);
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, last_login_at, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return mapUser(rows[0]);
}

export async function touchLastLogin(userId) {
  await query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [userId]);
}
