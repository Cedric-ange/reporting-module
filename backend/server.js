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
// 2. ENDPOINTS COMMANDO - FLUX TOTAL & VARIABLES POUR FILTRES
// =========================================================================

app.get('/api/commando-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    const queryResult = await client.query(`
      SELECT 
        id, numero_agent, agent_promoteur, ville, date_rapport, jour_semaine, 
        metric_category, type_pdv_ou_produit, objectif, realise, 
        taux_realisation, commentaires, impressions 
      FROM commando_performances 
      ORDER BY date_rapport DESC, id ASC
    `);
    client.release();

    const rows = queryResult.rows.map(row => {
      let cleanDate = 'N/A';
      if (row.date_rapport) {
        const d = new Date(row.date_rapport);
        if (!isNaN(d.getTime())) {
          cleanDate = d.toISOString().split('T')[0];
        }
      }
      return { ...row, date_rapport: cleanDate };
    });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Erreur extraction Commando:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 3. ENDPOINTS POUR LE MODULE PROMO PÂQUE (CRUD EN DIRECT & IMPORT EXCEL)
// =========================================================================

app.get('/api/promo-paque-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM promo_paque_performances ORDER BY report_date DESC, id DESC');
    client.release();
    
    const rows = result.rows.map(row => ({
      ...row,
      report_date: row.report_date ? new Date(row.report_date).toISOString().split('T')[0] : 'N/A'
    }));
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erreur récupération Promo Pâque:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/promo-paque/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier chargé.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const client = await pool.connect();
    let insertedRows = 0;

    try {
      await client.query('BEGIN');

      for (const row of rawData) {
        // Validation minimale pour s'assurer que la ligne est valide
        if (!row['Enseigne'] && !row['PDV']) continue;

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
      res.json({ success: true, message: `${insertedRows} lignes Promo Pâque poussées sur Supabase avec succès !` });

    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Échec de la routine d\'importation Promo Pâque:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/promo-paque-performances', async (req, res) => {
  try {
    const b = req.body;
    const client = await pool.connect();
    const queryText = `
      INSERT INTO promo_paque_performances 
      (report_date, enseigne, pdv, contacts_objectif, contacts_realise, acheteurs_objectif, acheteurs_realise, real_premium_16g, real_premium_360g, real_excellence_900g, real_avoine_50g, real_avoine_400g, real_3en1_cafe, gratuite_premium_16g, gratuite_avoine, gratuite_3en1, goodies1, goodies2, goodies3, goodies4, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `;
    const values = [b.report_date, b.enseigne, b.pdv, b.contacts_objectif, b.contacts_realise, b.acheteurs_objectif, b.acheteurs_realise, b.real_premium_16g, b.real_premium_360g, b.real_excellence_900g, b.real_avoine_50g, b.real_avoine_400g, b.real_3en1_cafe, b.gratuite_premium_16g, b.gratuite_avoine, b.gratuite_3en1, b.goodies1, b.goodies2, b.goodies3, b.goodies4, b.comments];
    
    await client.query(queryText, values);
    client.release();
    res.json({ success: true, message: 'Ligne Promo Pâque ajoutée avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/promo-paque-performances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const client = await pool.connect();
    const queryText = `
      UPDATE promo_paque_performances SET 
        report_date=$1, enseigne=$2, pdv=$3, contacts_objectif=$4, contacts_realise=$5, 
        acheteurs_objectif=$6, acheteurs_realise=$7, real_premium_16g=$8, real_premium_360g=$9, 
        real_excellence_900g=$10, real_avoine_50g=$11, real_avoine_400g=$12, real_3en1_cafe=$13, 
        gratuite_premium_16g=$14, gratuite_avoine=$15, gratuite_3en1=$16, goodies1=$17, 
        goodies2=$18, goodies3=$19, goodies4=$20, comments=$21
      WHERE id=$22
    `;
    const values = [b.report_date, b.enseigne, b.pdv, b.contacts_objectif, b.contacts_realise, b.acheteurs_objectif, b.acheteurs_realise, b.real_premium_16g, b.real_premium_360g, b.real_excellence_900g, b.real_avoine_50g, b.real_avoine_400g, b.real_3en1_cafe, b.gratuite_premium_16g, b.gratuite_avoine, b.gratuite_3en1, b.goodies1, b.goodies2, b.goodies3, b.goodies4, b.comments, id];
    
    await client.query(queryText, values);
    client.release();
    res.json({ success: true, message: 'Ligne Promo Pâque mise à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/promo-paque-performances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    await client.query('DELETE FROM promo_paque_performances WHERE id = $1', [id]);
    client.release();
    res.json({ success: true, message: 'Ligne Promo Pâque supprimée.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 4. ENDPOINTS SECONDAIRES & SYSTÈME
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