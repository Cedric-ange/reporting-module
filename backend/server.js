const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Connexion PostgreSQL conservée pour le module Grossiste
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =========================================================================
// 1. CANAL GROSSISTES (INCHANGÉ - LIT SUPABASE)
// =========================================================================
app.get('/api/grossiste-performances', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM grossiste_performances ORDER BY date_vente DESC');
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// =========================================================================
// 2. CANAL COMMANDO AUTOMATIQUE (LIT LE FICHIER EXCEL LOCAL DIRECTEMENT)
// =========================================================================
app.get('/api/commando-performances', async (req, res) => {
  try {
    // Chemin absolu vers ton fichier Excel Commando mis à la source du backend
    const excelPath = path.join(__dirname, 'BDD_COMMANDO_DYNAMIQUE.xlsx');
    
    // Lecture du fichier local en direct
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const aggregated = {};

    // Pivot algorithmique instantané en mémoire vive
    rawRows.forEach(row => {
      let rawDate = row['Date'];
      let formattedDate = 'N/A';
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0];
        }
      }

      const key = `${formattedDate}_${row['Ville']}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          id: Math.random().toString(36).substr(2, 9),
          date: formattedDate,
          ville: row['Ville'] || 'Inconnu',
          commune: row['Ville'] || 'Inconnu',
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

      const category = row['Metric_Category'];
      const item = row['Type de PDV'];
      const valRealise = parseFloat(row['Réalisé']) || 0;

      // Distribution Visites
      if (category === 'Nombre de visite / Type de PDV') {
        if (item === 'Boutique') aggregated[key].visits_boutique += valRealise;
        if (item === 'Superette') aggregated[key].visits_superette += valRealise;
        if (item === 'Kiosque') aggregated[key].visits_kiosque += valRealise;
        if (item === 'Tablier') aggregated[key].visits_tablier += valRealise;
        if (item === 'Pushcart') aggregated[key].visits_pushcart += valRealise;
      }

      // Distribution Ventes (SKUs)
      if (category === 'Vente en cartons') {
        if (item === 'Biblos Lait Premium 16g') aggregated[key].sales_premium_16g += valRealise;
        if (item === 'Biblos Lait Premium 360g') aggregated[key].sales_premium_360g += valRealise;
        if (item === 'Biblos Lait Excellence 900g') aggregated[key].sales_excellence_900g += valRealise;
        if (item === "Biblos Flocon d'avoine 50g") aggregated[key].sales_avoine_50g += valRealise;
        if (item === "Biblos Flocon d'avoine 400g") aggregated[key].sales_avoine_400g += valRealise;
      }
    });

    // Renvoie le tableau condensé directement au frontend
    res.json({ success: true, data: Object.values(aggregated) });

  } catch (error) {
    console.error('❌ Erreur ETL Commando local:', error);
    res.status(500).json({ success: false, error: 'Impossible de lire le fichier Excel Commando.' });
  }
});

// =========================================================================
// 3. FONCTIONS SYSTÈME
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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Biblos Track autonome actif sur le port ${PORT}`);
});