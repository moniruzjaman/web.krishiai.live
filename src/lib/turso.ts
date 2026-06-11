/**
 * Turso (LibSQL) Database Helper for KrishiAI
 *
 * Edge-native SQLite database:
 *   - Free tier: 9GB storage, 1B reads/month, 25M writes/month
 *   - No project pausing (unlike Supabase free tier)
 *   - Low latency from Vercel serverless (edge-native)
 *
 * Required env vars (optional — graceful fallback if not set):
 *   TURSO_DATABASE_URL  — e.g. libsql://your-db-name-your-org.turso.io
 *   TURSO_AUTH_TOKEN    — authentication token from Turso dashboard
 *
 * If not configured, diagnosis history and feedback are not persisted.
 */

import { createClient, type Client } from '@libsql/client';

// ─── Singleton Turso client ────────────────────────────────────
let _tursoClient: Client | null = null;

export function hasTurso(): boolean {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function getTursoClient(): Client | null {
  if (_tursoClient) return _tursoClient;
  if (!hasTurso()) return null;

  _tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return _tursoClient;
}

// ─── Schema initialization (auto-creates tables) ───────────────
let _schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (_schemaInitialized) return;
  const db = getTursoClient();
  if (!db) return;

  try {
    // Diagnoses — stores each diagnosis result
    await db.execute(`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        crop TEXT NOT NULL,
        disease_name TEXT,
        disease_name_bn TEXT,
        confidence TEXT,
        confidence_pct INTEGER DEFAULT 0,
        severity TEXT,
        biotic_abiotic TEXT,
        cause_type TEXT,
        etl_exceeded INTEGER DEFAULT 0,
        provider TEXT,
        symptoms TEXT,
        infected_part TEXT,
        gate_results TEXT,
        ipm_recommendations TEXT,
        chemical_options TEXT,
        weather_snapshot TEXT,
        district TEXT,
        image_attached INTEGER DEFAULT 0,
        elapsed_ms INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_diagnoses_crop ON diagnoses(crop)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_diagnoses_district ON diagnoses(district)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_diagnoses_created ON diagnoses(created_at)`);

    // Diagnosis feedback — user approval/rejection of diagnosis
    await db.execute(`
      CREATE TABLE IF NOT EXISTS diagnosis_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diagnosis_id INTEGER,
        session_id TEXT NOT NULL,
        crop TEXT NOT NULL,
        disease_name TEXT,
        approved INTEGER DEFAULT 0,
        user_comment TEXT,
        correct_diagnosis TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id)
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_session ON diagnosis_feedback(session_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_created ON diagnosis_feedback(created_at)`);

    // Outbreak reports — crowd-sourced disease outbreak tracking
    await db.execute(`
      CREATE TABLE IF NOT EXISTS outbreak_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district TEXT NOT NULL,
        crop TEXT NOT NULL,
        disease_name TEXT NOT NULL,
        reporter_hash TEXT,
        confirmed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_outbreaks_district ON outbreak_reports(district)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_outbreaks_crop ON outbreak_reports(crop)`);

    // Analytics state — single-row table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analytics_state (
        id TEXT PRIMARY KEY DEFAULT 'main',
        total_visits INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        updated_at TEXT
      )
    `);

    await db.execute(`INSERT OR IGNORE INTO analytics_state (id) VALUES ('main')`);

    _schemaInitialized = true;
  } catch (err: any) {
    console.error('Turso schema init error:', err?.message || err);
  }
}

// ─── Save a diagnosis ──────────────────────────────────────────
export async function saveDiagnosis(entry: {
  session_id: string;
  crop: string;
  disease_name?: string;
  disease_name_bn?: string;
  confidence?: string;
  confidence_pct?: number;
  severity?: string;
  biotic_abiotic?: string;
  cause_type?: string;
  etl_exceeded?: boolean;
  provider?: string;
  symptoms?: string;
  infected_part?: string;
  gate_results?: string;
  ipm_recommendations?: string;
  chemical_options?: string;
  weather_snapshot?: string;
  district?: string;
  image_attached?: boolean;
  elapsed_ms?: number;
}): Promise<number | null> {
  const db = getTursoClient();
  if (!db) return null;

  try {
    await ensureSchema();
    const result = await db.execute({
      sql: `INSERT INTO diagnoses (session_id, crop, disease_name, disease_name_bn, confidence, confidence_pct,
            severity, biotic_abiotic, cause_type, etl_exceeded, provider, symptoms, infected_part,
            gate_results, ipm_recommendations, chemical_options, weather_snapshot, district, image_attached, elapsed_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entry.session_id || '',
        entry.crop || 'unknown',
        entry.disease_name || null,
        entry.disease_name_bn || null,
        entry.confidence || null,
        entry.confidence_pct || 0,
        entry.severity || null,
        entry.biotic_abiotic || null,
        entry.cause_type || null,
        entry.etl_exceeded ? 1 : 0,
        entry.provider || null,
        entry.symptoms || null,
        entry.infected_part || null,
        entry.gate_results || null,
        entry.ipm_recommendations || null,
        entry.chemical_options || null,
        entry.weather_snapshot || null,
        entry.district || null,
        entry.image_attached ? 1 : 0,
        entry.elapsed_ms || 0,
      ],
    });
    return Number(result.lastInsertRowid);
  } catch (err: any) {
    console.error('Turso saveDiagnosis error:', err?.message || err);
    return null;
  }
}

// ─── Save diagnosis feedback ───────────────────────────────────
export async function saveDiagnosisFeedback(entry: {
  diagnosis_id?: number;
  session_id: string;
  crop: string;
  disease_name?: string;
  approved: boolean;
  user_comment?: string;
  correct_diagnosis?: string;
}): Promise<number | null> {
  const db = getTursoClient();
  if (!db) return null;

  try {
    await ensureSchema();
    const result = await db.execute({
      sql: `INSERT INTO diagnosis_feedback (diagnosis_id, session_id, crop, disease_name, approved, user_comment, correct_diagnosis)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entry.diagnosis_id || null,
        entry.session_id || '',
        entry.crop || 'unknown',
        entry.disease_name || null,
        entry.approved ? 1 : 0,
        entry.user_comment || null,
        entry.correct_diagnosis || null,
      ],
    });
    return Number(result.lastInsertRowid);
  } catch (err: any) {
    console.error('Turso saveDiagnosisFeedback error:', err?.message || err);
    return null;
  }
}

// ─── Get disease statistics ────────────────────────────────────
export async function getDiseaseStats(days: number = 30): Promise<{
  topCrops: Array<{ crop: string; count: number }>;
  topDiseases: Array<{ diseaseName: string; count: number }>;
  byDistrict: Array<{ district: string; count: number }>;
  approvedRate: number;
  totalDiagnoses: number;
}> {
  const db = getTursoClient();
  const empty = { topCrops: [], topDiseases: [], byDistrict: [], approvedRate: 0, totalDiagnoses: 0 };
  if (!db) return empty;

  try {
    await ensureSchema();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [cropsRes, diseasesRes, districtRes, feedbackRes, totalRes] = await Promise.all([
      db.execute({ sql: `SELECT crop, COUNT(*) as count FROM diagnoses WHERE created_at >= ? GROUP BY crop ORDER BY count DESC LIMIT 20`, args: [since] }),
      db.execute({ sql: `SELECT disease_name, COUNT(*) as count FROM diagnoses WHERE created_at >= ? AND disease_name IS NOT NULL GROUP BY disease_name ORDER BY count DESC LIMIT 20`, args: [since] }),
      db.execute({ sql: `SELECT district, COUNT(*) as count FROM diagnoses WHERE created_at >= ? AND district IS NOT NULL GROUP BY district ORDER BY count DESC LIMIT 20`, args: [since] }),
      db.execute({ sql: `SELECT CAST(SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) as rate FROM diagnosis_feedback WHERE created_at >= ?`, args: [since] }),
      db.execute({ sql: `SELECT COUNT(*) as total FROM diagnoses WHERE created_at >= ?`, args: [since] }),
    ]);

    return {
      topCrops: cropsRes.rows.map(r => ({ crop: String(r.crop), count: Number(r.count) })),
      topDiseases: diseasesRes.rows.map(r => ({ diseaseName: String(r.disease_name), count: Number(r.count) })),
      byDistrict: districtRes.rows.map(r => ({ district: String(r.district), count: Number(r.count) })),
      approvedRate: feedbackRes.rows[0] ? Number(feedbackRes.rows[0].rate) * 100 : 0,
      totalDiagnoses: totalRes.rows[0] ? Number(totalRes.rows[0].total) : 0,
    };
  } catch (err: any) {
    console.error('Turso getDiseaseStats error:', err?.message || err);
    return empty;
  }
}
