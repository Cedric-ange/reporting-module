/**
 * ETL Commando
 * Parse les fichiers bruts "REPORTING COMMANDO DE REFE. DETAILLANTS..." depuis DATA BIBLOS.
 * Chaque fichier contient des onglets par jour (Mercredi, jeudi, etc.) avec 57 colonnes.
 *
 * Structure des colonnes (index 0-based) :
 *   0: N° agent  |  1: Agent promoteur
 *   OBJECTIFS :
 *     2-6: Visites par PDV (Boutique, Superette, Kiosque, Tablier, Pushcart)
 *     7-11: Référencement par PDV
 *     12-16: Matériel visibilité (Affiche Premium, Affiche Excellence, Affiche Avoine, Hanger, Wobbler)
 *     17-21: Ventes en cartons (Premium 16g, Premium 360g, Excellence 900g, Avoine 50g, Avoine 400g)
 *   RÉALISATIONS :
 *     22-26: Visites par PDV
 *     27-31: Présence produits (Premium 16g, Premium 360g, Excellence 900g, Avoine 50g, Avoine 400g)
 *     32-36: Référencement par PDV
 *     37-41: Nouveau référencement par SKU
 *     42-46: Ventes en cartons
 *     47-51: Matériel visibilité
 *     52-54: Gratuits (Premium 16g, Excellence 900g, Avoine 50g)
 *     55: Commentaires  |  56: Impressions PDV
 *
 * Usage : node src/etl/commando-etl-importer.js ["<dossier source>"]
 */
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../../data/reporting.db');

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Math.round(v * 1000) / 1000;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : Math.round(n * 1000) / 1000;
}

function extractCity(fileName) {
  // For commando files: "BOUAKE - REPORTING ...", "SAN PEDRO - ..."
  const m = fileName.match(/^([A-ZÀ-Ü\s]+?)\s*[-–]\s*REPORTING/i);
  if (m) return m[1].trim();
  // For grossiste files that use commando format: city extracted from sheet content
  if (/GROSSISTE/i.test(fileName)) return 'UNKNOWN';
  const m2 = fileName.match(/^([A-ZÀ-Ü\s]+?)\s*[-–]/i);
  if (m2) return m2[1].trim();
  return 'INCONNU';
}

const MONTH_MAP = {
  'JANV': '01', 'JAN': '01', 'FEV': '02', 'FEVR': '02', 'FÉV': '02',
  'MAR': '03', 'MARS': '03', 'AVR': '04', 'AVRIL': '04',
  'MAI': '05', 'JUIN': '06', 'JUIL': '07', 'JUILL': '07',
  'AOUT': '08', 'AOÛT': '08', 'SEPT': '09', 'SEP': '09',
  'OCT': '10', 'NOV': '11', 'DEC': '12', 'DÉC': '12'
};

const MONTH_REGEX = /(\d{1,2})\s+(JANV?|FEVR?|FÉV|MARS?|AVR(?:IL)?|MAI|JUIN|JUILL?|AO[UÛ]T|SEPT?|OCT|NOV|D[EÉ]C)\b(?:\s+(\d{4}))?/;

// Day-of-week to ISO weekday (Mon=0 ... Sat=5, Dim=6)
const DAY_OFFSET = {
  'LUN': 0, 'LUND': 0, 'LUNDI': 0, 'LUINDI': 0,
  'MAR': 1, 'MARD': 1, 'MARDI': 1,
  'MER': 2, 'MERC': 2, 'MERCREDI': 2,
  'JEU': 3, 'JEUD': 3, 'JEUDI': 3,
  'VEN': 4, 'VEND': 4, 'VENDREDI': 4,
  'SAM': 5, 'SAME': 5, 'SAMEDI': 5, 'SAMEDII': 5,
  'DIM': 6, 'DIMA': 6, 'DIMANCHE': 6
};

function extractDateFromSheet(sheetName, rows) {
  const upper = sheetName.toUpperCase().trim();

  // 1) Explicit date in sheet name: "MER 04 FEV", "JEUDI 22 JANV"
  const dateMatch = upper.match(MONTH_REGEX);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = MONTH_MAP[dateMatch[2]] || '01';
    const year = dateMatch[3] || '2026';
    return `${year}-${month}-${day}`;
  }

  // 2) Try row 1 for "VILLE - DD MONTH YYYY" pattern
  for (const cell of (rows[1] || [])) {
    if (!cell) continue;
    const m = String(cell).toUpperCase().match(MONTH_REGEX);
    if (m) {
      const day = m[1].padStart(2, '0');
      const month = MONTH_MAP[m[2]] || '01';
      const year = m[3] || '2026';
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * For sheets without explicit dates, derive a date from the day-of-week name
 * and a reference Monday. Handles "Lundi S1" (week index suffix) patterns.
 */
function deriveDateFromDayName(sheetName, refMonday) {
  const upper = sheetName.toUpperCase().replace(/\s+/g, ' ').trim();

  // Check for week suffix (S1, S2, etc.)
  let weekOffset = 0;
  const weekMatch = upper.match(/S(\d+)/);
  if (weekMatch) weekOffset = (parseInt(weekMatch[1], 10) - 1) * 7;

  // Find day-of-week
  for (const [prefix, offset] of Object.entries(DAY_OFFSET)) {
    if (upper.startsWith(prefix)) {
      const d = new Date(refMonday);
      d.setDate(d.getDate() + offset + weekOffset);
      return d.toISOString().split('T')[0];
    }
  }
  // "Jr non travaillé" → skip
  return null;
}

function findDataStartRow(rows) {
  // Find the row containing "N°" in column 0 — data starts 2 rows after
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const val = (rows[i] || [])[0];
    if (val && String(val).trim() === 'N°') return i + 2;
  }
  return 7; // default
}

function parseSheet(rows, city, reportDate) {
  const records = [];
  const dataStartRow = findDataStartRow(rows);
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const agentNum = row[0];
    if (!agentNum) continue;
    if (/^total/i.test(String(agentNum).trim())) continue;
    const rawName = row[1] ? String(row[1]).trim() : null;
    if (rawName && (/^total/i.test(rawName) || /^synthèse/i.test(rawName))) continue;
    const name = rawName || `Agent ${agentNum} - ${city}`;

    // Prefix agent number with city to ensure uniqueness across regions
    const agentNumber = `${city}-${String(agentNum).trim()}`;
    records.push({
      agent_number: agentNumber,
      agent_name: name,
      report_date: reportDate,
      city: city,
      // Réalisations (cols 22-26)
      visits_boutique: toNum(row[22]),
      visits_superette: toNum(row[23]),
      visits_kiosque: toNum(row[24]),
      visits_tablier: toNum(row[25]),
      visits_pushcart: toNum(row[26]),
      // Ventes réalisées (cols 42-46)
      sales_premium_16g: toNum(row[42]),
      sales_premium_360g: toNum(row[43]),
      sales_excellence_900g: toNum(row[44]),
      sales_avoine_50g: toNum(row[45]),
      sales_avoine_400g: toNum(row[46]),
      // Commentaires
      comments: row[55] ? String(row[55]).trim() : null,
      impressions: row[56] ? String(row[56]).trim() : null,
      // Extra fields for verification
      _obj_visits_boutique: toNum(row[2]),
      _obj_visits_superette: toNum(row[3]),
      _obj_visits_kiosque: toNum(row[4]),
      _obj_visits_tablier: toNum(row[5]),
      _obj_visits_pushcart: toNum(row[6]),
      _ref_boutique: toNum(row[32]),
      _ref_superette: toNum(row[33]),
      _ref_kiosque: toNum(row[34]),
      _ref_tablier: toNum(row[35]),
      _ref_pushcart: toNum(row[36]),
      _new_ref_premium_16g: toNum(row[37]),
      _new_ref_premium_360g: toNum(row[38]),
      _new_ref_excellence_900g: toNum(row[39]),
      _new_ref_avoine_50g: toNum(row[40]),
      _new_ref_avoine_400g: toNum(row[41]),
      _mat_affiche_premium: toNum(row[47]),
      _mat_affiche_excellence: toNum(row[48]),
      _mat_affiche_avoine: toNum(row[49]),
      _mat_hanger: toNum(row[50]),
      _mat_wobbler: toNum(row[51]),
      _gratuit_premium_16g: toNum(row[52]),
      _gratuit_excellence_900g: toNum(row[53]),
      _gratuit_avoine_50g: toNum(row[54]),
      _presence_premium_16g: toNum(row[27]),
      _presence_premium_360g: toNum(row[28]),
      _presence_excellence_900g: toNum(row[29]),
      _presence_avoine_50g: toNum(row[30]),
      _presence_avoine_400g: toNum(row[31])
    });
  }
  return records;
}

// Reference Mondays for files without explicit dates, keyed by city
const REF_MONDAYS = {
  'SAN PEDRO': '2026-02-03',   // Week of Feb 3
  'MAN':       '2026-01-27',   // Week of Jan 27 (same as GROSSISTE 3)
  'KORHOGO':   '2026-01-20',   // Week of Jan 20 (multi-week file starts here)
  'GAGNOA':    '2026-01-20',   // Week of Jan 20
  'DALOA':     '2026-01-20',
  '_DEFAULT':  '2026-01-27'
};

function extractRecordsFromFile(filePath) {
  const fileName = path.basename(filePath);
  const city = extractCity(fileName);
  const wb = xlsx.readFile(filePath, { cellDates: true });
  let allRecords = [];

  // Skip "Synthèse" and summary sheets
  const daySheets = wb.SheetNames.filter(n => {
    const lower = n.toLowerCase().trim();
    return !lower.includes('synthèse') && !lower.includes('total') &&
           !lower.includes('recap') && !lower.includes('dashbord') &&
           !lower.includes('dashboard');
  });

  // First pass: detect if any sheet has an explicit date
  let hasExplicitDates = false;
  for (const sheetName of daySheets) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
    if (extractDateFromSheet(sheetName, rows)) { hasExplicitDates = true; break; }
  }

  const refMonday = REF_MONDAYS[city.toUpperCase()] || REF_MONDAYS['_DEFAULT'];

  for (const sheetName of daySheets) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });

    // Try explicit date first
    let reportDate = extractDateFromSheet(sheetName, rows);

    // Fall back to day-name derivation if no explicit dates in this file
    if (!reportDate && !hasExplicitDates) {
      reportDate = deriveDateFromDayName(sheetName, refMonday);
    }

    if (!reportDate) {
      console.warn(`  [SKIP] ${sheetName} - date non détectée`);
      continue;
    }

    // Detect city override from row content (for multi-city files like KORHOGO S1-S5)
    let sheetCity = city;
    for (let r = 1; r <= 3; r++) {
      const cell = (rows[r] || [])[0] || (rows[r] || [])[1];
      if (cell) {
        const s = String(cell).trim().toUpperCase();
        const cityMatch = s.match(/^(GAGNOA|DALOA|BOUAKE|BOUAKÉ|KORHOGO|MAN|SAN PEDRO|ABIDJAN|YAMOUSSOUKRO|BONDOUKOU|ABENGOUROU|BOUAFLE|BOUAFLÉ)/);
        if (cityMatch) {
          sheetCity = cityMatch[1].trim();
          break;
        }
      }
    }

    const records = parseSheet(rows, sheetCity, reportDate);
    allRecords = allRecords.concat(records);
  }
  return allRecords;
}

function ensureAgentAndInsert(db, rec) {
  return new Promise((resolve, reject) => {
    // Find or create agent
    db.get('SELECT id FROM agents WHERE agent_number = ?', [rec.agent_number], (err, agent) => {
      if (err) return reject(err);
      const doInsert = (agentId) => {
        const sql = `INSERT INTO commando_performances
          (agent_id, report_date, city, visits_boutique, visits_superette, visits_kiosque,
           visits_tablier, visits_pushcart, sales_premium_16g, sales_premium_360g,
           sales_excellence_900g, sales_avoine_50g, sales_avoine_400g, comments, impressions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(agent_id, report_date) DO UPDATE SET
            city=excluded.city, visits_boutique=excluded.visits_boutique,
            visits_superette=excluded.visits_superette, visits_kiosque=excluded.visits_kiosque,
            visits_tablier=excluded.visits_tablier, visits_pushcart=excluded.visits_pushcart,
            sales_premium_16g=excluded.sales_premium_16g, sales_premium_360g=excluded.sales_premium_360g,
            sales_excellence_900g=excluded.sales_excellence_900g, sales_avoine_50g=excluded.sales_avoine_50g,
            sales_avoine_400g=excluded.sales_avoine_400g, comments=excluded.comments,
            impressions=excluded.impressions`;
        db.run(sql, [
          agentId, rec.report_date, rec.city,
          rec.visits_boutique, rec.visits_superette, rec.visits_kiosque,
          rec.visits_tablier, rec.visits_pushcart,
          rec.sales_premium_16g, rec.sales_premium_360g, rec.sales_excellence_900g,
          rec.sales_avoine_50g, rec.sales_avoine_400g,
          rec.comments, rec.impressions
        ], (err2) => err2 ? reject(err2) : resolve());
      };

      if (agent) return doInsert(agent.id);

      // Create agent
      db.run(
        `INSERT INTO agents (agent_number, agent_name, city, agent_type, status)
         VALUES (?, ?, ?, 'commando', 'active')`,
        [rec.agent_number, rec.agent_name, rec.city],
        function(err3) {
          if (err3) {
            // Might already exist via concurrent insert
            db.get('SELECT id FROM agents WHERE agent_number = ?', [rec.agent_number], (e, a) => {
              if (e || !a) return reject(err3);
              doInsert(a.id);
            });
          } else {
            doInsert(this.lastID);
          }
        }
      );
    });
  });
}

function ensureTables(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_number VARCHAR(20) UNIQUE NOT NULL, agent_name VARCHAR(100) NOT NULL,
        city VARCHAR(100), phone VARCHAR(20), email VARCHAR(100),
        agent_type VARCHAR(20) DEFAULT 'commando', status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS commando_performances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL, report_date DATE NOT NULL, city VARCHAR(100),
        visits_boutique INTEGER DEFAULT 0, visits_superette INTEGER DEFAULT 0,
        visits_kiosque INTEGER DEFAULT 0, visits_tablier INTEGER DEFAULT 0, visits_pushcart INTEGER DEFAULT 0,
        sales_premium_16g INTEGER DEFAULT 0, sales_premium_360g INTEGER DEFAULT 0,
        sales_excellence_900g INTEGER DEFAULT 0, sales_avoine_50g INTEGER DEFAULT 0,
        sales_avoine_400g INTEGER DEFAULT 0, comments TEXT, impressions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_id, report_date),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )`, (err) => err ? reject(err) : resolve());
    });
  });
}

async function run(sourceDir) {
  const dir = sourceDir || path.join(__dirname, '../../../DATA BIBLOS');
  if (!fs.existsSync(dir)) {
    console.error('Dossier source introuvable:', dir);
    process.exit(1);
  }
  // Match commando files + grossiste files 3 & 5 (which use commando format)
  const files = fs.readdirSync(dir).filter(f =>
    /\.xlsx?$/i.test(f) && (/COMMANDO/i.test(f) || /GROSSISTE.*INDUST\s*[35]/i.test(f))
  );
  if (files.length === 0) {
    console.error('Aucun fichier Commando trouvé dans', dir);
    process.exit(1);
  }

  console.log(`\n=== ETL COMMANDO — ${files.length} fichier(s) ===\n`);

  const db = new sqlite3.Database(DB_PATH);
  await ensureTables(db);

  let totalRecords = 0;
  for (const file of files) {
    try {
      const records = extractRecordsFromFile(path.join(dir, file));
      for (const rec of records) {
        await ensureAgentAndInsert(db, rec);
      }
      totalRecords += records.length;
      console.log(`  ${file}\n    -> ${records.length} ligne(s)`);
    } catch (e) {
      console.error(`  ${file} -> ERREUR: ${e.message}`);
    }
  }

  db.close();
  console.log(`\nImport Commando terminé : ${totalRecords} ligne(s) depuis ${files.length} fichier(s).\n`);
}

module.exports = { extractRecordsFromFile, parseSheet, extractCity, extractDateFromSheet };

if (require.main === module) {
  run(process.argv[2]).catch(e => { console.error(e); process.exit(1); });
}
