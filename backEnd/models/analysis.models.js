import { query } from '../config/db.config.js';

/**
 * Analysis data-access layer (PostgreSQL).
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapAnalysis(row) {
  return {
    id: row.id,
    _id: row.id, // kept so older frontend code that reads _id still works
    resumeName: row.resume_name,
    resumeFile: row.resume_file,
    resumeAsset: row.resume_asset,
    jobDescription: row.job_description,
    score: row.score,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.result !== undefined && { result: row.result }),
    ...(row.resume_text !== undefined && { resumeText: row.resume_text })
  };
}

export async function createAnalysis({
  userId, resumeName, resumeText, resumeFile, resumeAsset, jobDescription, score, result, source
}) {
  const { rows } = await query(
    `INSERT INTO analyses
       (user_id, resume_name, resume_text, resume_file, resume_asset, job_description, score, result, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, resume_name, resume_file, resume_asset, job_description, score, source, created_at, updated_at`,
    [
      userId,
      resumeName ? String(resumeName).slice(0, 160) : null,
      resumeText,
      resumeFile ? JSON.stringify(resumeFile) : null,
      resumeAsset ? JSON.stringify(resumeAsset) : null,
      jobDescription ? String(jobDescription).slice(0, 12000) : null,
      Math.round(score),
      JSON.stringify(result),
      source || 'gemini'
    ]
  );
  return mapAnalysis(rows[0]);
}

export async function listAnalysesByUser(userId, limit = 20) {
  const { rows } = await query(
    `SELECT id, resume_name, resume_file, resume_asset, job_description, score, source, created_at, updated_at
     FROM analyses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows.map(mapAnalysis);
}

export async function findAnalysisById(analysisId, userId) {
  if (!UUID_PATTERN.test(String(analysisId))) {
    return null;
  }
  const { rows } = await query(
    `SELECT id, resume_name, resume_text, resume_file, resume_asset, job_description,
            score, result, source, created_at, updated_at
     FROM analyses
     WHERE id = $1 AND user_id = $2`,
    [analysisId, userId]
  );
  return rows[0] ? mapAnalysis(rows[0]) : null;
}
