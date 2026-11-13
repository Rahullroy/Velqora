/**
 * Validates mandatory environment variables at startup so problems show up
 * immediately with a clear message instead of failing later during a request.
 */
export function validateEnvironment() {
  const missing = ['JWT_SECRET'].filter((key) => !process.env[key]);
  if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    missing.push('DB_HOST (or DATABASE_URL)');
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  }

  const secret = process.env.JWT_SECRET;
  if (secret.length < 32 || secret.toLowerCase().startsWith('change-this')) {
    throw new Error('JWT_SECRET is too weak. Use a random string of at least 32 characters (see README for the command).');
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your-')) {
    console.warn('WARNING: GEMINI_API_KEY is not set. Resume analysis will fail until you add it.');
  }

  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const cloudinarySet = cloudinaryVars.filter((key) => process.env[key] && !process.env[key].startsWith('your-'));
  if (cloudinarySet.length > 0 && cloudinarySet.length < cloudinaryVars.length) {
    console.warn('WARNING: Cloudinary is only partly configured (needs all 3 variables). File upload to Cloudinary is disabled.');
  }
}
