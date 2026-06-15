#!/usr/bin/env node
/**
 * Script principal : exécute les 3 ETL (Commando, Grossiste, Promo Pâque)
 * puis affiche un rapport de vérification et exporte les données en Excel.
 *
 * Usage : node src/etl/run-all-imports.js ["<dossier source>"]
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');

const DB_PATH = path.join(__dirname, '../../data/reporting.db');
const EXPORT_DIR = path.join(__dirname, '../../exports');
const SOURCE_DIR = process.argv[2] || path.join(__dirname, '../../../DATA BIBLOS');

function runScript(script, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(60));
  try {
    const output = execSync(`node "${script}" "${SOURCE_DIR}"`, {
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(output);
    return true;
  } catch (e) {
    console.error(`ERREUR ${label}:`, e.stderr || e.message);
    return false;
  }
}

function query(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function exportToExcel(data, sheetName, filePath) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  xlsx.writeFile(wb, filePath);
}

async function verifyAndExport() {
  const db = new sqlite3.Database(DB_PATH);

  console.log('\n' + '='.repeat(60));
  console.log('  RAPPORT DE VÉRIFICATION');
  console.log('='.repeat(60));

  // --- Agents ---
  const agents = await query(db, 'SELECT * FROM agents ORDER BY city, agent_number');
  console.log(`\n[AGENTS] ${agents.length} agent(s)`);
  const agentsByCity = {};
  agents.forEach(a => {
    agentsByCity[a.city] = (agentsByCity[a.city] || 0) + 1;
  });
  Object.entries(agentsByCity).forEach(([city, count]) => {
    console.log(`  ${city}: ${count} agent(s)`);
  });

  // --- Commando ---
  const commando = await query(db, `
    SELECT cp.*, a.agent_name, a.agent_number, a.city as agent_city
    FROM commando_performances cp
    JOIN agents a ON cp.agent_id = a.id
    ORDER BY cp.report_date, a.city, a.agent_number
  `);
  console.log(`\n[COMMANDO] ${commando.length} ligne(s) de performances`);
  const cmdByDate = {};
  commando.forEach(r => { cmdByDate[r.report_date] = (cmdByDate[r.report_date] || 0) + 1; });
  Object.entries(cmdByDate).sort().forEach(([date, count]) => {
    console.log(`  ${date}: ${count} ligne(s)`);
  });
  const cmdByCity = {};
  commando.forEach(r => { cmdByCity[r.city || r.agent_city] = (cmdByCity[r.city || r.agent_city] || 0) + 1; });
  console.log('  Par ville:');
  Object.entries(cmdByCity).sort().forEach(([city, count]) => {
    console.log(`    ${city}: ${count}`);
  });

  // Totaux ventes
  let totalVisits = 0, totalSales = 0;
  commando.forEach(r => {
    totalVisits += (r.visits_boutique || 0) + (r.visits_superette || 0) + (r.visits_kiosque || 0) +
                   (r.visits_tablier || 0) + (r.visits_pushcart || 0);
    totalSales += (r.sales_premium_16g || 0) + (r.sales_premium_360g || 0) + (r.sales_excellence_900g || 0) +
                  (r.sales_avoine_50g || 0) + (r.sales_avoine_400g || 0);
  });
  console.log(`  Total visites: ${totalVisits}`);
  console.log(`  Total ventes (cartons): ${totalSales}`);

  // --- Grossiste ---
  const grossiste = await query(db, 'SELECT * FROM grossiste_performances ORDER BY report_date, city');
  console.log(`\n[GROSSISTE] ${grossiste.length} ligne(s) de performances`);
  const groByDate = {};
  grossiste.forEach(r => { groByDate[r.report_date] = (groByDate[r.report_date] || 0) + 1; });
  Object.entries(groByDate).sort().forEach(([date, count]) => {
    console.log(`  ${date}: ${count} ligne(s)`);
  });
  let groTotalObj = 0, groTotalReal = 0;
  grossiste.forEach(r => {
    groTotalObj += r.objectif_vente_carton || 0;
    groTotalReal += r.realisation_carton || 0;
  });
  console.log(`  Total objectifs: ${groTotalObj} cartons`);
  console.log(`  Total réalisations: ${groTotalReal} cartons`);

  // --- Promo Pâque ---
  const promo = await query(db, 'SELECT * FROM promo_paque_performances ORDER BY report_date, enseigne, pdv');
  console.log(`\n[PROMO PÂQUE] ${promo.length} ligne(s) de performances`);
  const promoByEnseigne = {};
  promo.forEach(r => { promoByEnseigne[r.enseigne] = (promoByEnseigne[r.enseigne] || 0) + 1; });
  Object.entries(promoByEnseigne).sort().forEach(([ens, count]) => {
    console.log(`  ${ens}: ${count} ligne(s)`);
  });
  const promoByDate = {};
  promo.forEach(r => { promoByDate[r.report_date] = (promoByDate[r.report_date] || 0) + 1; });
  Object.entries(promoByDate).sort().forEach(([date, count]) => {
    console.log(`  ${date}: ${count}`);
  });

  // --- Export Excel ---
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

  if (commando.length > 0) {
    const cmdExport = commando.map(r => ({
      'N° Agent': r.agent_number,
      'Agent': r.agent_name,
      'Date': r.report_date,
      'Ville': r.city || r.agent_city,
      'Visites Boutique': r.visits_boutique,
      'Visites Superette': r.visits_superette,
      'Visites Kiosque': r.visits_kiosque,
      'Visites Tablier': r.visits_tablier,
      'Visites Pushcart': r.visits_pushcart,
      'Ventes Premium 16g': r.sales_premium_16g,
      'Ventes Premium 360g': r.sales_premium_360g,
      'Ventes Excellence 900g': r.sales_excellence_900g,
      'Ventes Avoine 50g': r.sales_avoine_50g,
      'Ventes Avoine 400g': r.sales_avoine_400g,
      'Commentaires': r.comments || '',
      'Impressions': r.impressions || ''
    }));
    exportToExcel(cmdExport, 'Commando', path.join(EXPORT_DIR, 'export_commando.xlsx'));
    console.log(`\n  -> Exporté: exports/export_commando.xlsx (${cmdExport.length} lignes)`);
  }

  if (grossiste.length > 0) {
    const groExport = grossiste.map(r => ({
      'Date': r.report_date,
      'Ville': r.city,
      'Grossiste': r.grossiste_name,
      'Objectif (cartons)': r.objectif_vente_carton,
      'Réalisation (cartons)': r.realisation_carton,
      'Taux réalisation': r.taux_realisation,
      'Personnes approchées': r.personnes_approchees,
      'Client acheteur': r.client_acheteur,
      'Gratuit (chapelet/sachet)': r.gratuit_chapelet_sachet,
    }));
    exportToExcel(groExport, 'Grossiste', path.join(EXPORT_DIR, 'export_grossiste.xlsx'));
    console.log(`  -> Exporté: exports/export_grossiste.xlsx (${groExport.length} lignes)`);
  }

  if (promo.length > 0) {
    const promoExport = promo.map(r => ({
      'Date': r.report_date,
      'Enseigne': r.enseigne,
      'PDV': r.pdv,
      'Contacts Objectif': r.contacts_objectif,
      'Contacts Réalisé': r.contacts_realise,
      'Acheteurs Objectif': r.acheteurs_objectif,
      'Acheteurs Réalisé': r.acheteurs_realise,
      'Ventes Premium 16g': r.real_premium_16g,
      'Ventes Premium 360g': r.real_premium_360g,
      'Ventes Excellence 900g': r.real_excellence_900g,
      'Ventes Avoine 50g': r.real_avoine_50g,
      'Ventes Avoine 400g': r.real_avoine_400g,
      'Ventes 3en1 Café': r.real_3en1_cafe,
      'Gratuit Premium 16g': r.gratuite_premium_16g,
      'Gratuit Avoine': r.gratuite_avoine,
      'Gratuit 3en1': r.gratuite_3en1,
      'Goodies 1': r.goodies1,
      'Goodies 2': r.goodies2,
      'Goodies 3': r.goodies3,
      'Goodies 4': r.goodies4,
      'Commentaires': r.comments || ''
    }));
    exportToExcel(promoExport, 'Promo Paque', path.join(EXPORT_DIR, 'export_promo_paque.xlsx'));
    console.log(`  -> Exporté: exports/export_promo_paque.xlsx (${promoExport.length} lignes)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  RÉSUMÉ FINAL');
  console.log('='.repeat(60));
  console.log(`  Agents:              ${agents.length}`);
  console.log(`  Commando:            ${commando.length} performances`);
  console.log(`  Grossiste:           ${grossiste.length} performances`);
  console.log(`  Promo Pâque:         ${promo.length} performances`);
  console.log(`  TOTAL:               ${commando.length + grossiste.length + promo.length} enregistrements`);
  console.log('='.repeat(60));

  db.close();
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     IMPORT ETL — 3 BASES (Commando, Grossiste, Promo)  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Source: ${SOURCE_DIR}`);

  // Run the 3 ETL scripts
  const scripts = [
    { path: path.join(__dirname, 'commando-etl-importer.js'), label: '1. ETL COMMANDO' },
    { path: path.join(__dirname, 'grossiste-etl-importer.js'), label: '2. ETL GROSSISTE' },
    { path: path.join(__dirname, 'promo-paque-etl-importer.js'), label: '3. ETL PROMO PÂQUE' },
  ];

  for (const s of scripts) {
    runScript(s.path, s.label);
  }

  // Verify and export
  await verifyAndExport();
}

main().catch(e => { console.error(e); process.exit(1); });
