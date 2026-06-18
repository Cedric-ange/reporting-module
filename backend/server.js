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

// Configuration CORS complète
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuration de Multer pour stocker temporairement les fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuration de la connexion PostgreSQL (Supabase Cloud Pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Erreur de connexion à PostgreSQL:', err.stack);
  }
  console.log('✅ Connecté avec succès à la base de données PostgreSQL (Supabase)');
  release();
});

// =========================================================================
// 1. ENDPOINTS ET PIPELINES ANALYTIQUES GROSSISTES (EXISTANTS ET SÉCURISÉS)
// =========================================================================

// Récupération globale des données analytiques Grossiste
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

// Pipeline ETL d'importation Excel Grossiste autonome
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
          (date_vente, ville, grossiste, format_produit, objectif_carton, realisation_carton, taux_realisation)
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
// 2. ENDPOINTS ET PIVOT ANALYTIQUE COMMANDO (SÉCURISÉ SUPABASE)
// =========================================================================

app.get('/api/commando-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    const queryResult = await client.query('SELECT * FROM commando_performances ORDER BY date_rapport DESC');
    client.release();

    const rawRows = queryResult.rows;
    const aggregated = {};

    rawRows.forEach(row => {
      const formattedDate = row.date_rapport ? new Date(row.date_rapport).toISOString().split('T')[0] : 'N/A';
      const key = `${formattedDate}_${row.ville}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          id: row.id,
          date: formattedDate,
          ville: row.ville,
          commune: row.ville,
          secteur: 'Terrain',
          visits_boutique: 0,
          visits_superette: 0,
          visits_kiosque: 0,
          visits_tablier: 0,
          visits_pushcart: 0,
          sales_premium_16g: 0,
          sales_premium_360g: 0,
          sales_excellence_900g: 0,
          sales_avoine_50g: 0,
          sales_avoine_400g: 0
        };
      }

      const category = row.metric_category;
      const item = row.type_pdv_ou_produit;
      const valRealise = parseFloat(row.realise) || 0;

      if (category === 'Nombre de visite / Type de PDV') {
        if (item === 'Boutique') aggregated[key].visits_boutique += valRealise;
        if (item === 'Superette') aggregated[key].visits_superette += valRealise;
        if (item === 'Kiosque') aggregated[key].visits_kiosque += valRealise;
        if (item === 'Tablier') aggregated[key].visits_tablier += valRealise;
        if (item === 'Pushcart') aggregated[key].visits_pushcart += valRealise;
      }

      if (category === 'Vente en cartons') {
        if (item === 'Biblos Lait Premium 16g') aggregated[key].sales_premium_16g += valRealise;
        if (item === 'Biblos Lait Premium 360g') aggregated[key].sales_premium_360g += valRealise;
        if (item === 'Biblos Lait Excellence 900g') aggregated[key].sales_excellence_900g += valRealise;
        if (item === "Biblos Flocon d'avoine 50g") aggregated[key].sales_avoine_50g += valRealise;
        if (item === "Biblos Flocon d'avoine 400g") aggregated[key].sales_avoine_400g += valRealise;
      }
    });

    res.json({ success: true, data: Object.values(aggregated) });

  } catch (error) {
    console.error('❌ Erreur critique lors du pivot algorithmique Commando:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ROUTE D'IMPORTATION AUTOMATIQUE DEPUIS LE FICHIER EXCEL LOCAL VERS SUPABASE
app.get('/api/commando/import-local', async (req, res) => {
  try {
    const excelPath = path.join(__dirname, 'BDD_COMMANDO_DYNAMIQUE.xlsx');

    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({ 
        success: false, 
        error: `Le fichier source 'BDD_COMMANDO_DYNAMIQUE.xlsx' est introuvable à la racine.` 
      });
    }

    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const client = await pool.connect();
    let insertedRows = 0;

    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE commando_performances');

      for (const row of rawData) {
        if (!row['Metric_Category'] || !row['Type de PDV']) continue;

        let formattedDate = new Date().toISOString().split('T')[0];
        if (row['Date']) {
          const parsedDate = new Date(row['Date']);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
          }
        }

        const queryText = `
          INSERT INTO commando_performances 
          (numero_agent, agent_promoteur, ville, date_rapport, jour_semaine, metric_category, type_pdv_ou_produit, objectif, realise, taux_realisation, commentaires, impressions)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        const values = [
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
        ];

        await client.query(queryText, values);
        insertedRows++;
      }

      await client.query('COMMIT');
      res.json({ success: true, message: `${insertedRows} lignes Commando synchronisées avec succès depuis l'Excel local.` });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Échec de la routine automatique locale Commando:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 3. ENDPOINTS SECONDAIRES & SYSTÈME (MANAGEMENT ET SANTÉ)
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
    res.status(500).json({ error: 'Erreur interne de récupération des effectifs' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Biblos Track exécuté avec succès sur le port ${PORT}`);
});