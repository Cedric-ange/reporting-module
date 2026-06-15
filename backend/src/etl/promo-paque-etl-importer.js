/**
 * ETL Promo Pâque
 * Lit les fichiers source non structurés "PromoPaque_*.xlsx" / "PromoRattrapage_*.xlsx"
 * (onglets "JOUR n") et charge les lignes par jour / enseigne / PDV dans la table
 * promo_paque_performances.
 *
 * Usage : node src/etl/promo-paque-etl-importer.js ["<dossier source>"]
 * Par défaut, le dossier source est ../../DATA BIBLOS (à la racine du dépôt).
 */
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../../data/reporting.db');

// Index 0-based des colonnes (colonne Excel - 1)
const COL = {
  enseigne: 1,            // B
  pdv: 2,                 // C
  contacts_objectif: 3,   // D
  acheteurs_objectif: 4,  // E
  contacts_realise: 18,   // S
  acheteurs_realise: 19,  // T
  real_premium_16g: 20,   // U
  real_premium_360g: 21,  // V
  real_excellence_900g: 22, // W
  real_avoine_50g: 23,    // X
  real_avoine_400g: 24,   // Y
  real_3en1_cafe: 25,     // Z
  gratuite_premium_16g: 26, // AA
  gratuite_avoine: 27,    // AB
  gratuite_3en1: 28,      // AC
  goodies1: 29,           // AD
  goodies2: 30,           // AE
  goodies3: 31,           // AF
  goodies4: 32,           // AG
  comments: 33            // AH
};

const NUMERIC_KEYS = [
  'contacts_objectif', 'contacts_realise', 'acheteurs_objectif', 'acheteurs_realise',
  'real_premium_16g', 'real_premium_360g', 'real_excellence_900g',
  'real_avoine_50g', 'real_avoine_400g', 'real_3en1_cafe',
  'gratuite_premium_16g', 'gratuite_avoine', 'gratuite_3en1',
  'goodies1', 'goodies2', 'goodies3', 'goodies4'
];

function toNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function toDateString(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  // Sérial Excel
  if (typeof v === 'number') {
    const d = xlsx.SSF ? xlsx.SSF.parse_date_code(v) : null;
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const parsed = new Date(v);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function parseSheet(rows) {
  // Date du jour : ligne Excel 2 (index 1), colonne C (index 2)
  const reportDate = toDateString(rows[1] && rows[1][2]);
  if (!reportDate) return [];

  const records = [];
  // Les données PDV commencent à la ligne Excel 5 (index 4)
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i] || [];
    const enseigne = row[COL.enseigne];
    const pdv = row[COL.pdv];
    if (!enseigne || !pdv) continue;
    const pdvStr = String(pdv).trim();
    if (!pdvStr || /^total/i.test(pdvStr) || /^total/i.test(String(enseigne).trim())) continue;

    const rec = {
      report_date: reportDate,
      enseigne: String(enseigne).trim(),
      pdv: pdvStr,
      comments: row[COL.comments] ? String(row[COL.comments]).trim() : null
    };
    NUMERIC_KEYS.forEach((key) => { rec[key] = toNumber(row[COL[key]]); });
    records.push(rec);
  }
  return records;
}

function extractRecordsFromFile(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  let records = [];
  wb.SheetNames.filter((n) => /^jour\s*\d+/i.test(n.trim())).forEach((name) => {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    records = records.concat(parseSheet(rows));
  });
  return records;
}

function upsert(db, rec) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO promo_paque_performances
      (report_date, enseigne, pdv, contacts_objectif, contacts_realise, acheteurs_objectif, acheteurs_realise,
       real_premium_16g, real_premium_360g, real_excellence_900g, real_avoine_50g, real_avoine_400g, real_3en1_cafe,
       gratuite_premium_16g, gratuite_avoine, gratuite_3en1, goodies1, goodies2, goodies3, goodies4, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(report_date, enseigne, pdv) DO UPDATE SET
        contacts_objectif=excluded.contacts_objectif, contacts_realise=excluded.contacts_realise,
        acheteurs_objectif=excluded.acheteurs_objectif, acheteurs_realise=excluded.acheteurs_realise,
        real_premium_16g=excluded.real_premium_16g, real_premium_360g=excluded.real_premium_360g,
        real_excellence_900g=excluded.real_excellence_900g, real_avoine_50g=excluded.real_avoine_50g,
        real_avoine_400g=excluded.real_avoine_400g, real_3en1_cafe=excluded.real_3en1_cafe,
        gratuite_premium_16g=excluded.gratuite_premium_16g, gratuite_avoine=excluded.gratuite_avoine,
        gratuite_3en1=excluded.gratuite_3en1, goodies1=excluded.goodies1, goodies2=excluded.goodies2,
        goodies3=excluded.goodies3, goodies4=excluded.goodies4, comments=excluded.comments`;
    db.run(sql, [
      rec.report_date, rec.enseigne, rec.pdv, rec.contacts_objectif, rec.contacts_realise,
      rec.acheteurs_objectif, rec.acheteurs_realise, rec.real_premium_16g, rec.real_premium_360g,
      rec.real_excellence_900g, rec.real_avoine_50g, rec.real_avoine_400g, rec.real_3en1_cafe,
      rec.gratuite_premium_16g, rec.gratuite_avoine, rec.gratuite_3en1, rec.goodies1, rec.goodies2,
      rec.goodies3, rec.goodies4, rec.comments
    ], (err) => (err ? reject(err) : resolve()));
  });
}

function ensureTable(db) {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS promo_paque_performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date DATE NOT NULL, enseigne VARCHAR(100) NOT NULL, pdv VARCHAR(200) NOT NULL,
      contacts_objectif INTEGER DEFAULT 0, contacts_realise INTEGER DEFAULT 0,
      acheteurs_objectif INTEGER DEFAULT 0, acheteurs_realise INTEGER DEFAULT 0,
      real_premium_16g DECIMAL(10,2) DEFAULT 0, real_premium_360g DECIMAL(10,2) DEFAULT 0,
      real_excellence_900g DECIMAL(10,2) DEFAULT 0, real_avoine_50g DECIMAL(10,2) DEFAULT 0,
      real_avoine_400g DECIMAL(10,2) DEFAULT 0, real_3en1_cafe DECIMAL(10,2) DEFAULT 0,
      gratuite_premium_16g DECIMAL(10,2) DEFAULT 0, gratuite_avoine DECIMAL(10,2) DEFAULT 0,
      gratuite_3en1 DECIMAL(10,2) DEFAULT 0, goodies1 INTEGER DEFAULT 0, goodies2 INTEGER DEFAULT 0,
      goodies3 INTEGER DEFAULT 0, goodies4 INTEGER DEFAULT 0, comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(report_date, enseigne, pdv)
    )`, (err) => (err ? reject(err) : resolve()));
  });
}

async function importFromBuffer(buffer, database) {
  const wb = xlsx.read(buffer, { cellDates: true });
  let records = [];
  wb.SheetNames.filter((n) => /^jour\s*\d+/i.test(n.trim())).forEach((name) => {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
    records = records.concat(parseSheet(rows));
  });
  for (const rec of records) {
    await database.promoPaque.createPromoPaquePerformance(rec);
  }
  return records;
}

async function run(sourceDir) {
  const dir = sourceDir || path.join(__dirname, '../../../DATA BIBLOS');
  if (!fs.existsSync(dir)) {
    console.error('Dossier source introuvable:', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => /^promo/i.test(f) && /\.xlsx?$/i.test(f));
  if (files.length === 0) {
    console.error('Aucun fichier Promo Pâque trouvé dans', dir);
    process.exit(1);
  }

  const db = new sqlite3.Database(DB_PATH);
  await ensureTable(db);

  let total = 0;
  for (const file of files) {
    try {
      const records = extractRecordsFromFile(path.join(dir, file));
      for (const rec of records) {
        // eslint-disable-next-line no-await-in-loop
        await upsert(db, rec);
      }
      total += records.length;
      console.log(`  ${file} -> ${records.length} ligne(s)`);
    } catch (e) {
      console.error(`  ${file} -> ERREUR: ${e.message}`);
    }
  }

  db.close();
  console.log(`Import Promo Pâque terminé : ${total} ligne(s) chargée(s) depuis ${files.length} fichier(s).`);
}

module.exports = { extractRecordsFromFile, parseSheet, importFromBuffer };

if (require.main === module) {
  run(process.argv[2]).catch((e) => { console.error(e); process.exit(1); });
}
