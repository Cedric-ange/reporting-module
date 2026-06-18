const { Pool } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la connexion directe à Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "TA_CHAINE_DE_CONNEXION_SUPABASE",
  ssl: { rejectUnauthorized: false }
});

async function runTransactionelETL() {
  const excelPath = path.join(__dirname, 'BDD_COMMANDO_DYNAMIQUE.xlsx');

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Erreur : Le fichier '${excelPath}' est introuvable.`);
    process.exit(1);
  }

  console.log('🔄 1. Lecture de l\'Excel Source...');
  const workbook = xlsx.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`📊 ${rawData.length} entrées brutes détectées.`);

  // --- ALGORITHME DE PIVOT TRANSACTIONNEL (STYLE GROSSISTE) ---
  console.log('🧠 2. Transformation et regroupement des dimensions terrain...');
  
  // Clé unique de regroupement : Date + Agent + Ville
  const dailyRegistry = {};

  for (const row of rawData) {
    if (!row['Metric_Category'] || !row['Type de PDV']) continue;

    let formattedDate = new Date().toISOString().split('T')[0];
    if (row['Date']) {
      const parsedDate = new Date(row['Date']);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toISOString().split('T')[0];
      }
    }

    const agent = row['Agent promoteur'] || 'Inconnu';
    const ville = row['Ville'] || 'Inconnu';
    const jour = row['JOUR'] || '';
    const numAgent = row['N°'] ? String(row['N°']) : 'N/A';
    
    const key = `${formattedDate}_${agent}_${ville}`;

    if (!dailyRegistry[key]) {
      dailyRegistry[key] = {
        metadata: { numAgent, agent, ville, date: formattedDate, jour },
        visites: 0,
        plv: 0,
        transactions: [] // Contiendra la liste des ventes et gratuités uniques
      };
    }

    const category = String(row['Metric_Category']).trim();
    const item = String(row['Type de PDV']).trim();
    const valRealise = parseFloat(row['Réalisé']) || 0;
    const valObjectif = parseFloat(row['Objectif']) || 0;
    const valTaux = parseFloat(row['Taux de réalisation']) || 0;
    const comment = row['Commentaires'] ? String(row['Commentaires']) : null;
    const impression = row['Impressions des PDV et des clients'] ? String(row['Impressions des PDV et des clients']) : null;

    // A. Si c'est une visite terrain, on la cumule globalement pour la journée de cet agent
    if (category.includes('Nombre de visite')) {
      dailyRegistry[key].visites += valRealise;
    } 
    // B. Si c'est de la PLV ou du Matériel, on le cumule globalement pour la journée
    else if (category.includes('Matériel') || category.includes('Visibilité')) {
      dailyRegistry[key].plv += valRealise;
    }
    // C. Si c'est de la vente ou de la gratuité, on crée un enregistrement produit dédié
    else {
      dailyRegistry[key].transactions.push({
        category,
        item,
        objectif: valObjectif,
        realise: valRealise,
        taux: valTaux,
        commentaires: comment || impression
      });
    }
  }

  // --- PRÉPARATION DES LIGNES FINALES À INJECTER ---
  const finalRowsToInsert = [];

  Object.values(dailyRegistry).forEach(({ metadata, visites, plv, transactions }) => {
    // Si l'agent n'a fait que des visites ou de la PLV sans ventes ce jour-là
    if (transactions.length === 0) {
      finalRowsToInsert.push({
        ...metadata,
        category: 'Visites / Activations Générales',
        item: 'Synthèse Terrain',
        objectif: 0,
        realise: 0,
        taux: 0,
        visites,
        plv,
        commentaires: null
      });
    } else {
      // On boucle sur ses ventes de produits
      transactions.forEach((tx, idx) => {
        finalRowsToInsert.push({
          ...metadata,
          category: tx.category,
          item: tx.item,
          objectif: tx.objectif,
          realise: tx.realise,
          taux: tx.taux,
          // CRUCIAL : On met la donnée globale UNIQUEMENT sur la 1ère ligne de l'agent, et 0 sur les autres !
          visites: idx === 0 ? visites : 0,
          plv: idx === 0 ? plv : 0,
          commentaires: tx.commentaires
        });
      });
    }
  });

  console.log(`✨ Transformation terminée : Réduction intelligente à ${finalRowsToInsert.length} lignes transactionnelles.`);

  // --- INJECTION DIRECTE DANS POSTGRESQL ---
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🗑️ 3. Vidage de la table...');
    await client.query('TRUNCATE TABLE commando_performances');

    console.log('🚀 4. Lancement de l\'insertion par paquets de 500...');
    const chunkSize = 500;
    
    for (let i = 0; i < finalRowsToInsert.length; i += chunkSize) {
      const chunk = finalRowsToInsert.slice(i, i + chunkSize);
      const values = [];
      const valueLines = [];
      let valueIndex = 1;

      for (const row of chunk) {
        values.push(
          row.numAgent,
          row.agent,
          row.ville,
          row.date,
          row.jour,
          row.category,
          row.item,
          row.objectif,
          row.realise,
          row.taux,
          row.commentaires,
          row.visites, // Écrit comme un entier direct en base
          row.plv      // Écrit comme un entier direct en base
        );

        valueLines.push(`($${valueIndex}, $${valueIndex+1}, $${valueIndex+2}, $${valueIndex+3}, $${valueIndex+4}, $${valueIndex+5}, $${valueIndex+6}, $${valueIndex+7}, $${valueIndex+8}, $${valueIndex+9}, $${valueIndex+10}, $${valueIndex+11}, $${valueIndex+12})`);
        valueIndex += 13;
      }

      if (valueLines.length > 0) {
        // ATTENTION : Pour exécuter ce script, assure-toi d'avoir préalablement ajouté les deux colonnes 
        // 'visites_terrain' et 'plv_posee' dans ta table via l'éditeur SQL de Supabase (ALTER TABLE)
        const bulkQuery = `
          INSERT INTO commando_performances 
          (numero_agent, agent_promoteur, ville, date_rapport, jour_semaine, metric_category, type_pdv_ou_produit, objectif, realise, taux_realisation, commentaires, visites_terrain, plv_posee)
          VALUES ${valueLines.join(', ')}
        `;
        await client.query(bulkQuery, values);
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ TOUT EST ALIGNÉ : Base de données mise à jour au format Transactionnel !`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur critique d\'injection :', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runTransactionelETL();