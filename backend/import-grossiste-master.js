const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg');

// REMPLACEZ DIRECTEMENT PAR VOTRE CHAÎNE SUPABASE ICI :
const CONFIG_DATABASE_URL = "postgresql://postgres.ididzabqgmnfgruryuev:Welcome$$12345!@aws-0-eu-west-3.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: CONFIG_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige généralement le SSL en direct
});

async function runMigration() {
  const filePath = path.join(__dirname, 'BDD_GROSSISTE_MASTER.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable. Placez 'BDD_GROSSISTE_MASTER.xlsx' dans : ${__dirname}`);
    process.exit(1);
  }

  console.log("⚡ Lecture du fichier Master Grossiste...");
  const workbook = xlsx.readFile(filePath);
  
  const sheetName = workbook.SheetNames.find(n => /ACTIVITE/i.test(n)) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(worksheet);
  console.log(`📊 ${rows.length} lignes détectées dans l'onglet "${sheetName}".`);

  // Connexion directe
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log("📥 Injection propre dans Supabase en cours...");

    let insertedCount = 0;

    for (const row of rows) {
      const dateRaw = row['Date'];
      if (!dateRaw) continue;

      let formattedDate;
      if (typeof dateRaw === 'number') {
        formattedDate = new Date((dateRaw - 25569) * 86400 * 1000).toISOString().split('T')[0];
      } else {
        formattedDate = new Date(dateRaw).toISOString().split('T')[0];
      }

      const ville = row['Ville'] || 'INCONNU';
      const grossiste = row['Grossiste'] || 'INCONNU';
      const categorie = row['Categorie produit'] || row['Catégorie produit'] || null;
      const format = row['Format'] || null;
      
      const objectif = parseFloat(row['Objectif carton']) || 0;
      const realisation = parseFloat(row['Réalisation carton']) || 0;
      const taux = parseFloat(row['Taux de réalisation']) || 0;
      const gratuite = parseFloat(row['Gratuité']) || 0;
      const affiche = parseInt(row['Affiche']) || 0;
      const approchee = parseInt(row['Personne approchée']) || 0;
      const touche = parseInt(row['Personne touché (Client acheteur)']) || 0;
      const source = row['Fichier_Source'] || 'BDD_GROSSISTE_MASTER.xlsx';

      const queryText = `
        INSERT INTO grossiste_performances 
        (date_vente, ville, grossiste, categorie_produit, format_produit, objectif_carton, realisation_carton, taux_realisation, gratuite, affiche, personne_approchee, personne_touche, fichier_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      const values = [
        formattedDate, ville, grossiste, categorie, format, 
        objectif, realisation, taux, gratuite, affiche, approchee, touche, source
      ];

      await client.query(queryText, values);
      insertedCount++;

      if (insertedCount % 100 === 0) {
        console.log(`⏳ En cours : ${insertedCount} lignes insérées...`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ Base de données initialisée ! ${insertedCount} lignes injectées proprement.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erreur lors de la migration :", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();