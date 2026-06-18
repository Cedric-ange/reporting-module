const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Erreur de connexion à PostgreSQL:', err.stack);
  }
  console.log('✅ Connecté avec succès à la base de données PostgreSQL (Supabase)');
  release();
});

// =========================================================================
// 1. ENDPOINTS ET PIPELINES ANALYTIQUES GROSSISTES
// =========================================================================

app.get('/api/grossiste-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM grossiste_performances ORDER BY date_vente DESC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des données Grossiste:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/grossiste/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
    }

    const fileName = req.file.originalname;
    let city = 'INCONNU';
    const match = fileName.match(/^([A-ZÀ-Ü\s]+?)\s*[-–]/i);
    if (match) {
      city = match[1].trim();
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const client = await pool.connect();
    let insertedRows = 0;

    try {
      await client.query('BEGIN');

      for (const row of rawData) {
        if (!row['Grossiste'] && !row['Distributeur']) continue;

        let rawDate = row['Date'] || row['Date Vente'];
        let formattedDate = new Date().toISOString().split('T')[0];
        if (rawDate) {
          const parsedDate = new Date(rawDate);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
          }
        }

        const queryText = `
          INSERT INTO grossiste_performances 
          (date_vente, ville, grossiste, format_produit, objective_carton, realisation_carton, taux_realisation)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const obj = parseFloat(row['Objectif']) || parseFloat(row['Objectif (Crt)']) || 0;
        const real = parseFloat(row['Réalisation']) || parseFloat(row['Réalisé (Crt)']) || 0;
        const taux = obj > 0 ? (real / obj) * 100 : 0;

        const values = [
          formattedDate,
          row['Ville'] || row['Région'] || city,
          row['Grossiste'] || row['Distributeur'] || 'N/A',
          row['Produit'] || row['Format'] || row['Format Produit'] || 'N/A',
          obj,
          real,
          taux
        ];

        await client.query(queryText, values);
        insertedRows++;
      }

      await client.query('COMMIT');
      res.json({ success: true, message: `${insertedRows} lignes grossistes synchronisées avec Supabase.` });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Échec critique de la routine ETL Grossiste:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 2. ENDPOINTS COMMANDO - FLUX TOTAL & VARIABLES POUR FILTRES DIFFÉRENCIÉS
// =========================================================================
app.get('/api/commando-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    // Sélection de TOUTES les dimensions analytiques sans restriction
    const queryResult = await client.query(`
      SELECT 
        id, 
        numero_agent, 
        agent_promoteur, 
        ville, 
        date_rapport, 
        jour_semaine, 
        metric_category, 
        type_pdv_ou_produit, 
        objectif, 
        realise, 
        taux_realisation, 
        commentaires, 
        impressions 
      FROM commando_performances 
      ORDER BY date_rapport DESC, id ASC
    `);
    client.release();

    // Formatage unifié des dates sans décalage horaire
    const rows = queryResult.rows.map(row => {
      let cleanDate = 'N/A';
      if (row.date_rapport) {
        const d = new Date(row.date_rapport);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          cleanDate = `${year}-${month}-${day}`;
        }
      }
      return {
        ...row,
        date_rapport: cleanDate
      };
    });

    // Retour du flux brut à 100% (success: true et tableau direct)
    res.json({ success: true, data: rows });

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction complète des données Commando:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ROUTE D'IMPORTATION AUTOMATIQUE BULK
app.get('/api/commando/import-local', async (req, res) => {
  try {
    const excelPath = path.join(__dirname, 'BDD_COMMANDO_DYNAMIQUE.xlsx');

    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({ 
        success: false, 
        error: `Le fichier source 'BDD_COMMANDO_DYNAMIQUE.xlsx' est introuvable.` 
      });
    }

    console.log('🔄 Lecture de l\'Excel Commando local...');
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawData.length === 0) {
      return res.json({ success: true, message: "Le fichier Excel sélectionné est vu comme vide." });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE commando_performances');

      console.log(`🚀 Bulk Insert de ${rawData.length} lignes...`);

      const values = [];
      let valueIndex = 1;
      const valueLines = [];

      for (const row of rawData) {
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

      await client.query('COMMIT');
      res.json({ success: true, message: `${valueLines.length} lignes Commando injectées en base.` });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Échec de la routine :', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 3. ENDPOINTS SECONDAIRES & SYSTÈME
// =========================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'CONNECTED', timestamp: new Date() });
});

app.get('/api/agents', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM agents ORDER BY id ASC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors du chargement de la table agents:', error);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Biblos Track exécuté avec succès sur le port ${PORT}`);
});