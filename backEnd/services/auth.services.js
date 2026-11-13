import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, touchLastLogin } from '../models/user.models.js';
import { normalizeEmail, validateCredentials } from '../utils/validation.utils.js';

export function createAccessToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser({ name, email, password }) {
  const validationError = validateCredentials({ name, email, password }, true);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await createUser({
      name: String(name).trim().slice(0, 80),
      email: normalizedEmail,
      passwordHash
    });
  } catch (dbError) {
    // 23505 = unique violation (two sign-ups with the same email at the same moment)
    if (dbError.code === '23505') {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }
    throw dbError;
  }

  const token = createAccessToken(user);
  return { user: sanitizeUser(user), token };
}

export async function authenticateUser({ email, password }) {
  const validationError = validateCredentials({ email, password }, false);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByEmail(normalizeEmail(email));
  const isValidPassword = user && (await bcrypt.compare(password, user.passwordHash));

  if (!isValidPassword) {
    const error = new Error('Email or password is incorrect.');
    error.statusCode = 401;
    throw error;
  }

  await touchLastLogin(user.id);

  const token = createAccessToken(user);
  return { user: sanitizeUser(user), token };
}

