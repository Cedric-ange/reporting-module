const { Pool } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connexion directe à Supabase en utilisant tes variables d'environnement
const CONFIG_DATABASE_URL = "postgresql://postgres.ididzabqgmnfgruryuev:Welcome$$12345!@aws-0-eu-west-3.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: CONFIG_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige généralement le SSL en direct
});

async function runETL() {
  const excelPath = path.join(__dirname, 'BDD_COMMANDO_DYNAMIQUE.xlsx');

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Erreur : Le fichier '${excelPath}' est introuvable.`);
    process.exit(1);
  }

  console.log('🔄 1. Lecture du fichier Excel Commando...');
  const workbook = xlsx.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`📊 ${rawData.length} lignes détectées dans l'Excel.`);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🗑️ 2. Nettoyage de la table commando_performances...');
    await client.query('TRUNCATE TABLE commando_performances');

    console.log('🚀 3. Injection des données par paquets (Slices de 500 lignes)...');
    
    // On découpe par paquets de 500 lignes pour ne JAMAIS dépasser la limite de paramètres SQL
    const chunkSize = 500; 
    for (let i = 0; i < rawData.length; i += chunkSize) {
      const chunk = rawData.slice(i, i + chunkSize);
      const values = [];
      const valueLines = [];
      let valueIndex = 1;

      for (const row of chunk) {
        if (!row['Metric_Category'] || !row['Type de PDV']) continue;

        let formattedDate = new Date().toISOString().split('T')[0];
        if (row['Date']) {
          const parsedDate = new Date(row['Date']);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
          }
        }

        values.push(
          row['N°'] ? String(row['N°']) : 'N/A',
          row['Agent promoteur'] || 'Inconnu',
          row['Ville'] || 'Inconnu',
          formattedDate,
          row['JOUR'] || '',
          row['Metric_Category'],
          row['Type de PDV'],
          parseFloat(row['Objectif']) || 0,
          parseFloat(row['Réalisé']) || 0,
          parseFloat(row['Taux de réalisation']) || 0,
          row['Commentaires'] ? String(row['Commentaires']) : null,
          row['Impressions des PDV et des clients'] ? String(row['Impressions des PDV et des clients']) : null
        );

        valueLines.push(`($${valueIndex}, $${valueIndex+1}, $${valueIndex+2}, $${valueIndex+3}, $${valueIndex+4}, $${valueIndex+5}, $${valueIndex+6}, $${valueIndex+7}, $${valueIndex+8}, $${valueIndex+9}, $${valueIndex+10}, $${valueIndex+11})`);
        valueIndex += 12;
      }

      if (valueLines.length > 0) {
        const bulkQuery = `
          INSERT INTO commando_performances 
          (numero_agent, agent_promoteur, ville, date_rapport, jour_semaine, metric_category, type_pdv_ou_produit, objectif, realise, taux_realisation, commentaires, impressions)
          VALUES ${valueLines.join(', ')}
        `;
        await client.query(bulkQuery, values);
      }
      console.log(`   🔹 Index ${i} à ${Math.min(i + chunkSize, rawData.length)} synchronisé...`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ SUCCÈS TOTAL : La base de données Supabase a été mise à jour !`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur critique pendant l\'injection SQL:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runETL();