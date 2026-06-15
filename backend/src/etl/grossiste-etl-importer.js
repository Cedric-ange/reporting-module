/**
 * ETL Grossiste (format pivot Feuil1)
 * Parse les fichiers "REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST*.xlsx"
 * au format pivot : ligne = VILLE/GROSSISTE, colonnes = blocs de dates (27 cols/date).
 *
 * Structure d'un bloc de date (offset depuis startCol) :
 *   0-6: Objectif de vente (carton) — 7 produits (16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G)
 *   7-8: (vide, vide)
 *   9: personnes approchées
 *   10: Client acheteur
 *   11-17: Réalisation (carton) — 7 produits
 *   18-20: Gratuit (Lait 16G, Lait 900G, Flocon 50g)
 *   21: Affiche
 *   22-28: Taux de réalisation — 7 produits
 *
 * Usage : node src/etl/grossiste-etl-importer.js ["<dossier source>"]
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

function toDateString(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number') {
    const d = xlsx.SSF ? xlsx.SSF.parse_date_code(v) : null;
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const parsed = new Date(v);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function detectDateBlocks(row3) {
  const blocks = [];
  for (let col = 2; col < row3.length; col++) {
    const val = row3[col];
    if (!val) continue;
    const dateStr = toDateString(val);
    if (dateStr) {
      blocks.push({ date: dateStr, startCol: col });
    }
  }
  return blocks;
}

function parseSheetPivot(rows) {
  // Row 3: VILLE | GROSSISTE | date1 ... | date2 ...
  // Row 4: headers — "Objectif de vente (carton)" | "personnes approchées" | "Client acheteur" | "Réalisation (carton)" | "Gratuit" | "Taux de réalisation"
  // Row 8+: data (VILLE | GROSSISTE | values...)
  const row3 = rows[3] || [];
  const dateBlocks = detectDateBlocks(row3);
  if (dateBlocks.length === 0) return [];

  const records = [];
  // Data rows start at index 8
  for (let i = 8; i < rows.length; i++) {
    const row = rows[i] || [];
    const ville = row[0];
    const grossiste = row[1];
    if (!ville || !grossiste) continue;
    const villeStr = String(ville).trim();
    const grossisteStr = String(grossiste).trim();
    if (!villeStr || /^total/i.test(villeStr)) continue;

    for (const block of dateBlocks) {
      const sc = block.startCol;
      // Sum objectifs across products (cols sc+0 to sc+6)
      const objectifTotal = toNum(row[sc]) + toNum(row[sc + 1]) + toNum(row[sc + 2]) +
                            toNum(row[sc + 3]) + toNum(row[sc + 4]) + toNum(row[sc + 5]) + toNum(row[sc + 6]);
      // Sum réalisations across products (cols sc+11 to sc+17)
      const realisationTotal = toNum(row[sc + 11]) + toNum(row[sc + 12]) + toNum(row[sc + 13]) +
                               toNum(row[sc + 14]) + toNum(row[sc + 15]) + toNum(row[sc + 16]) + toNum(row[sc + 17]);
      // Sum gratuits (cols sc+18 to sc+20)
      const gratuitTotal = toNum(row[sc + 18]) + toNum(row[sc + 19]) + toNum(row[sc + 20]);

      const personnesApprochees = toNum(row[sc + 9]);
      const clientAcheteur = row[sc + 10] !== null && row[sc + 10] !== undefined ? String(row[sc + 10]).trim() : '';

      // Taux de réalisation moyen (cols sc+22 to sc+28)
      let tauxCount = 0, tauxSum = 0;
      for (let t = 22; t <= 28; t++) {
        const v = toNum(row[sc + t]);
        if (v > 0) { tauxSum += v; tauxCount++; }
      }
      const tauxRealisation = tauxCount > 0 ? Math.round((tauxSum / tauxCount) * 100) / 100 : 0;

      // Only add if there's meaningful data
      if (objectifTotal > 0 || realisationTotal > 0 || personnesApprochees > 0) {
        records.push({
          report_date: block.date,
          city: villeStr,
          grossiste_name: grossisteStr,
          personnes_approchees: personnesApprochees,
          client_acheteur: clientAcheteur,
          realisation_carton: Math.round(realisationTotal),
          gratuit_chapelet_sachet: Math.round(gratuitTotal),
          taux_realisation: tauxRealisation,
          objectif_vente_carton: Math.round(objectifTotal),
          comments: null
        });
      }
    }
  }
  return records;
}

function extractRecordsFromFile(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames[0]; // Always Feuil1
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
  return parseSheetPivot(rows);
}

function upsert(db, rec) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO grossiste_performances
      (report_date, city, grossiste_name, personnes_approchees, client_acheteur,
       realisation_carton, gratuit_chapelet_sachet, taux_realisation, objectif_vente_carton, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(report_date, city, grossiste_name) DO UPDATE SET
        personnes_approchees=excluded.personnes_approchees, client_acheteur=excluded.client_acheteur,
        realisation_carton=excluded.realisation_carton, gratuit_chapelet_sachet=excluded.gratuit_chapelet_sachet,
        taux_realisation=excluded.taux_realisation, objectif_vente_carton=excluded.objectif_vente_carton`;
    db.run(sql, [
      rec.report_date, rec.city, rec.grossiste_name, rec.personnes_approchees,
      rec.client_acheteur, rec.realisation_carton, rec.gratuit_chapelet_sachet,
      rec.taux_realisation, rec.objectif_vente_carton, rec.comments
    ], (err) => err ? reject(err) : resolve());
  });
}

function ensureTable(db) {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS grossiste_performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER, report_date DATE NOT NULL, city VARCHAR(100),
      grossiste_name VARCHAR(200) NOT NULL,
      personnes_approchees INTEGER DEFAULT 0, client_acheteur VARCHAR(200),
      realisation_carton INTEGER DEFAULT 0, gratuit_chapelet_sachet INTEGER DEFAULT 0,
      taux_realisation DECIMAL(5,2) DEFAULT 0, objectif_vente_carton INTEGER DEFAULT 0,
      comments TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(report_date, city, grossiste_name)
    )`, (err) => err ? reject(err) : resolve());
  });
}

async function run(sourceDir) {
  const dir = sourceDir || path.join(__dirname, '../../../DATA BIBLOS');
  if (!fs.existsSync(dir)) {
    console.error('Dossier source introuvable:', dir);
    process.exit(1);
  }
  // Only Feuil1-format files (exclude files 3 and 5 which are commando-format)
  const files = fs.readdirSync(dir).filter(f =>
    /GROSSISTE/i.test(f) && /\.xlsx?$/i.test(f) && !/INDUST\s*[35]\.xlsx$/i.test(f)
  );
  if (files.length === 0) {
    console.error('Aucun fichier Grossiste (format pivot) trouvé dans', dir);
    process.exit(1);
  }

  console.log(`\n=== ETL GROSSISTE — ${files.length} fichier(s) ===\n`);

  const db = new sqlite3.Database(DB_PATH);
  await ensureTable(db);

  let totalRecords = 0;
  for (const file of files) {
    try {
      const records = extractRecordsFromFile(path.join(dir, file));
      for (const rec of records) {
        await upsert(db, rec);
      }
      totalRecords += records.length;
      console.log(`  ${file}\n    -> ${records.length} ligne(s)`);
    } catch (e) {
      console.error(`  ${file} -> ERREUR: ${e.message}`);
    }
  }

  db.close();
  console.log(`\nImport Grossiste terminé : ${totalRecords} ligne(s) depuis ${files.length} fichier(s).\n`);
}

module.exports = { extractRecordsFromFile, parseSheetPivot, detectDateBlocks };

if (require.main === module) {
  run(process.argv[2]).catch(e => { console.error(e); process.exit(1); });
}
