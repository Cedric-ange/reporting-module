const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg'); // Gestionnaire PostgreSQL pour Supabase

// Configuration de la connexion Supabase via vos variables d'environnement existantes
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importGrossisteMaster() {
  // Chemin vers votre fichier Master placé dans un dossier ou à la racine
  const filePath = path.join(__dirname, '../../BDD_GROSSISTE_MASTER.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable à l'emplacement : ${filePath}`);
    return;
  }

  console.log("⚡ Lecture du fichier Master Grossiste...");
  const workbook = xlsx.readFile(filePath);
  
  // On cible la feuille d'activité
  const sheetName = workbook.SheetNames.find(n => /ACTIVITE/i.test(n) || /Sheet/i.test(n)) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Extraction des lignes au format JSON
  const rows = xlsx.utils.sheet_to_json(worksheet);
  console.log(`📊 ${rows.length} lignes détectées dans le fichier Excel.`);

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log("📥 Début de l'injection dans PostgreSQL Supabase...");

    let insertedCount = 0;

    for (const row of rows) {
      // Nettoyage et mappage des colonnes selon vos en-têtes Excel constatés
      const dateRaw = row['Date'];
      if (!dateRaw) continue; // Ignore les lignes vides sans date

      const date = new Date(dateRaw).toISOString().split('T')[0];
      const ville = row['Ville'] || null;
      const grossiste = row['Grossiste'] || null;
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
        (date, ville, grossiste, categorie_produit, format, objectif_carton, realisation_carton, taux_realisation, gratuite, affiche, personne_approchee, personne_touche, fichier_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      const values = [date, ville, grossiste, categorie, format, objectif, realisation, taux, gratuite, affiche, approchee, touche, source];
      await client.query(queryText, values);
      insertedCount++;
    }

    await client.query('COMMIT');
    console.log(`✅ Migration réussie ! ${insertedCount} lignes insérées avec succès sans contrainte d'agent.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erreur lors de l'injection des données :", error);
  } finally {
    client.release();
    await pool.end();
  }
}

importGrossisteMaster();