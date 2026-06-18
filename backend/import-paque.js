const { Pool } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connexion directe au pool PostgreSQL de Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runPromoPaqueETL() {
  // ⚠️ REMPLACE PAR LE NOM EXACT DE TON FICHIER EXCEL PRÉSENT DANS LE BACKEND
  const excelName = 'BDD_PROMO_DYNAMIQUE.xlsx'; 
  const excelPath = path.join(__dirname, excelName);

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Erreur : Le fichier Excel '${excelName}' est introuvable à la racine du backend.`);
    process.exit(1);
  }

  console.log(`🔄 1. Lecture du fichier Excel : ${excelName}...`);
  const workbook = xlsx.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`📊 ${rawData.length} lignes détectées dans le fichier.`);

  const client = await pool.connect();
  let insertedRows = 0;

  try {
    await client.query('BEGIN');

    // Optionnel : Décommente la ligne ci-dessous si tu veux vider la table avant l'import
    // await client.query('TRUNCATE TABLE promo_paque_performances');

    console.log('🚀 2. Injection des données dans Supabase...');

    for (const row of rawData) {
      // Ignore les lignes vides ou incomplètes
      if (!row['Enseigne'] && !row['PDV']) continue;

      // Gestion et formatage de la date
      let formattedDate = new Date().toISOString().split('T')[0];
      if (row['Date'] || row['Date du rapport']) {
        const parsedDate = new Date(row['Date'] || row['Date du rapport']);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0];
        }
      }

      const queryText = `
        INSERT INTO promo_paque_performances 
        (report_date, enseigne, pdv, contacts_objectif, contacts_realise, acheteurs_objectif, acheteurs_realise, real_premium_16g, real_premium_360g, real_excellence_900g, real_avoine_50g, real_avoine_400g, real_3en1_cafe, gratuite_premium_16g, gratuite_avoine, gratuite_3en1, goodies1, goodies2, goodies3, goodies4, comments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `;

      const values = [
        formattedDate,
        row['Enseigne'] || 'N/A',
        row['PDV'] || row['Magasin'] || 'N/A',
        parseInt(row['Contacts Objectif']) || parseInt(row['Contacts objectif']) || 0,
        parseInt(row['Contacts Réalisé']) || parseInt(row['Contacts réalisé']) || 0,
        parseInt(row['Acheteurs Objectif']) || parseInt(row['Acheteurs objectif']) || 0,
        parseInt(row['Acheteurs Réalisé']) || parseInt(row['Acheteurs réalisé']) || 0,
        parseInt(row['Lait Premium 16g']) || 0,
        parseInt(row['Lait Premium 360g']) || 0,
        parseInt(row['Lait Excellence 900g']) || 0,
        parseInt(row['Avoine 50g']) || 0,
        parseInt(row['Avoine 400g']) || 0,
        parseInt(row['3 en 1 Café au lait']) || 0,
        parseInt(row['Gratuité Premium 16g']) || 0,
        parseInt(row['Gratuité Avoine']) || 0,
        parseInt(row['Gratuité 3 en 1']) || 0,
        parseInt(row['Goodies 1']) || 0,
        parseInt(row['Goodies 2']) || 0,
        parseInt(row['Goodies 3']) || 0,
        parseInt(row['Goodies 4']) || 0,
        row['Commentaires'] || row['Comments'] || null
      ];

      await client.query(queryText, values);
      insertedRows++;
    }

    await client.query('COMMIT');
    console.log(`\n✅ TOUT EST ALIGNÉ : ${insertedRows} lignes Promo Pâque poussées sur Supabase !`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur critique lors de l\'injection :', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runPromoPaqueETL();