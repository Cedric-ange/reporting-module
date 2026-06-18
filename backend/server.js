const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const database = require('./src/database/database-functions');
const { Pool } = require('pg'); // Ajout du Pool PostgreSQL natif pour les requêtes à plat

// Importer les nouveaux modules ETL et KPI
const GrossisteETLTransformer = require('./src/etl/grossiste-etl-transformer');
const GrossisteKPICalculator = require('./src/analytics/grossiste-kpi-calculator');
const PowerBIExporter = require('./src/export/powerbi-exporter');
const ObjectiveTracker = require('./src/analytics/objective-tracker');
const BatchExcelProcessor = require('./src/etl/batch-processor');
const ETLDataValidator = require('./src/validation/etl-data-validator');
const grossisteImporter = require('./src/etl/grossiste-etl-importer');

const app = express();
// Force la bibliothèque 'pg' à accepter le SSL pour TOUTES les connexions (Pool global et modules internes)
process.env.PGSSLMODE = 'require';
const PORT = process.env.PORT || 5000;

// Configuration du pool global basé sur l'URL Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('sheet') || file.mimetype.includes('excel') || 
        file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel sont autorisés (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// ==================== CORRECTION VERCEL (Dossiers en lecture seule) ====================
const IS_VERCEL = process.env.NODE_ENV === 'production';

const EXPORT_DIR = IS_VERCEL ? '/tmp/exports' : path.join(__dirname, 'exports');
const TEMPLATE_DIR = IS_VERCEL ? '/tmp/templates' : path.join(__dirname, 'templates');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');

const ORIGINAL_EXCEL = IS_VERCEL 
  ? path.join(__dirname, 'template_original.xlsx') 
  : path.join('C:', 'Users', 'angec', 'Downloads', 'SAN PEDRO - REPORTING COMMANDO DE REFE. DETAILLANTS LAIT & FLOC. AVOINE (1).xlsx');

const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'template_original.xlsx');

try {
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATE_DIR)) fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (error) {
  console.warn("⚠️ Création de dossiers ignorée (comportement normal sur Vercel)");
}

if (!IS_VERCEL && fs.existsSync(ORIGINAL_EXCEL) && !fs.existsSync(TEMPLATE_FILE)) {
  try {
    fs.copyFileSync(ORIGINAL_EXCEL, TEMPLATE_FILE);
    console.log('Template Excel original copié avec succès');
  } catch (error) {
    console.error('Erreur lors de la copie du template:', error);
  }
}
// ====================================================================================

// Routes générales
app.get('/api/health', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({ 
      status: 'OK', 
      message: 'API de reporting opérationnelle avec base de données Supabase',
      database: 'PostgreSQL opérationnelle',
      statistics: {
        agents: stats.agents,
        performances: stats.total,
        commando: stats.commando,
        grossiste: stats.grossiste,
        promoPaque: stats.promoPaque
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ==================== MODULE 1 : GESTION AGENTS ET OBJECTIFS ====================

app.get('/api/agents', async (req, res) => {
  try {
    const agents = await database.agents.getAllAgents();
    res.json({ success: true, data: agents, count: agents.length });
  } catch (error) {
    console.error('Erreur récupération agents:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des agents' });
  }
});

app.post('/api/agents', async (req, res) => {
  try {
    const agentData = req.body;
    const existingAgent = await database.agents.getAgentByNumber(agentData.agent_number);
    if (existingAgent) {
      return res.status(400).json({ success: false, error: 'Un agent avec ce numéro existe déjà' });
    }
    const agent = await database.agents.createAgent(agentData);
    res.json({ success: true, data: agent, message: 'Agent créé avec succès' });
  } catch (error) {
    console.error('Erreur création agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'agent' });
  }
});

app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await database.agents.getAgentById(parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent non trouvé' });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    console.error('Erreur récupération agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'agent' });
  }
});

app.put('/api/agents/:id', async (req, res) => {
  try {
    const agent = await database.agents.updateAgent(parseInt(req.params.id), req.body);
    res.json({ success: true, data: agent, message: 'Agent mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l\'agent' });
  }
});

app.delete('/api/agents/:id', async (req, res) => {
  try {
    await database.agents.deleteAgent(parseInt(req.params.id));
    res.json({ success: true, message: 'Agent supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'agent' });
  }
});

app.post('/api/objectives', async (req, res) => {
  try {
    const objective = await database.objectives.createObjective(req.body);
    res.json({ success: true, data: objective, message: 'Objectif créé avec succès' });
  } catch (error) {
    console.error('Erreur création objectif:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'objectif' });
  }
});

app.get('/api/agents/:id/objectives', async (req, res) => {
  try {
    const objectives = await database.objectives.getAgentObjectives(parseInt(req.params.id));
    res.json({ success: true, data: objectives, count: objectives.length });
  } catch (error) {
    console.error('Erreur récupération objectifs:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des objectifs' });
  }
});

app.put('/api/objectives/:id', async (req, res) => {
  try {
    const objective = await database.objectives.createObjective(req.body);
    res.json({ success: true, data: objective, message: 'Objectif mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour objectif:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l\'objectif' });
  }
});


// ==================== NOUVELLE ROUTE : IMPORT AUTOMATIQUE GROSSISTE SANS AGENT ====================
app.post('/api/grossiste/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier transmis.' });
    }

    // Lecture du fichier Excel directement depuis le buffer mémoire
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find(n => /ACTIVITE/i.test(n)) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const client = await pool.connect();
    let insertedCount = 0;

    try {
      await client.query('BEGIN');

      for (const row of rows) {
        const dateRaw = row['Date'];
        if (!dateRaw) continue;

        let formattedDate;
        if (typeof dateRaw === 'number') {
          formattedDate = new Date((dateRaw - 25569) * 86400 * 1000).toISOString().split('T')[0];
        } else {
          formattedDate = new Date(dateRaw).toISOString().split('T')[0];
        }

        const queryText = `
          INSERT INTO grossiste_performances 
          (date_vente, ville, grossiste, categorie_produit, format_produit, objectif_carton, realisation_carton, taux_realisation, gratuite, affiche, personne_approchee, personne_touche, fichier_source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

        const values = [
          formattedDate,
          row['Ville'] || 'INCONNU',
          row['Grossiste'] || 'INCONNU',
          row['Categorie produit'] || row['Catégorie produit'] || null,
          row['Format'] || null,
          parseFloat(row['Objectif carton']) || 0,
          parseFloat(row['Réalisation carton']) || 0,
          parseFloat(row['Taux de réalisation']) || 0,
          parseFloat(row['Gratuité']) || 0,
          parseInt(row['Affiche']) || 0,
          parseInt(row['Personne approchée']) || 0,
          parseInt(row['Personne touché (Client acheteur)']) || 0,
          req.file.originalname || 'Upload_Frontend'
        ];

        await client.query(queryText, values);
        insertedCount++;
      }

      await client.query('COMMIT');
      res.json({ success: true, insertedCount });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("❌ Erreur API Nouvelle Importation Grossiste:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==================== ROUTE IMPORT ETL GROSSISTE ANCIENNE (Rétrocompatibilité) ====================
app.post('/api/import/grossiste', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier n'a été envoyé." });
    }
    const agentId = req.body.agentId;
    if (!agentId) {
      return res.status(400).json({ success: false, message: "Vous devez sélectionner un agent." });
    }

    console.log(`📥 Ancien endpoint: Réception d'un fichier Grossiste pour l'agent ID: ${agentId}`);
    const result = await grossisteImporter.processAndImport(req.file.buffer, { agentId: parseInt(agentId) });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Erreur critique route import ancienne:", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'import", error: error.message });
  }
});

// ==================== MODULE 3 : IMPORT EXCEL ====================

app.get('/api/template/download', (req, res) => {
  try {
    const templatePath = IS_VERCEL ? path.join(__dirname, 'template_original.xlsx') : path.join(TEMPLATE_DIR, 'template_original.xlsx');
    
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, 'template_reporting_original.xlsx');
    } else if (fs.existsSync(ORIGINAL_EXCEL)) {
      res.download(ORIGINAL_EXCEL, 'template_reporting_original.xlsx');
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Template Excel non trouvé. Assurez-vous que le fichier template_original.xlsx est dans le dossier backend.' 
      });
    }
  } catch (error) {
    console.error('Erreur téléchargement template:', error);
    res.status(500).json({ success: false, error: 'Erreur lors du téléchargement du template' });
  }
});

app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });

    await database.imports.createImportRecord({
      file_name: req.file.originalname,
      import_type: 'commando',
      status: 'processing',
      imported_by: 'api'
    });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });

    if (!jsonData || jsonData.length === 0) {
      await database.imports.createImportRecord({
        file_name: req.file.originalname,
        import_type: 'commando',
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        status: 'failed',
        error_log: 'Le fichier Excel est vide'
      });
      return res.status(400).json({ success: false, error: 'Le fichier Excel est vide' });
    }

    const validationResult = await validateAndImportExcelData(jsonData);

    await database.imports.createImportRecord({
      file_name: req.file.originalname,
      import_type: 'commando',
      total_rows: validationResult.totalRows,
      valid_rows: validationResult.validRows,
      invalid_rows: validationResult.invalidRows,
      status: validationResult.isValid ? 'completed' : 'failed',
      error_log: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
    });

    if (!validationResult.isValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Erreur de validation du fichier Excel',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        summary: validationResult.summary
      });
    }

    res.json({ 
      success: true, 
      data: validationResult.importedData,
      count: validationResult.importedData.length,
      message: `${validationResult.importedData.length} rapport(s) importé(s) avec succès`,
      warnings: validationResult.warnings,
      summary: validationResult.summary
    });
    
  } catch (error) {
    console.error('Erreur import Excel:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'import Excel: ' + error.message });
  }
});

app.post('/api/import/excel/grossiste', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });

    await database.imports.createImportRecord({
      file_name: req.file.originalname,
      import_type: 'grossiste',
      status: 'processing',
      imported_by: 'api'
    });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });

    if (!jsonData || jsonData.length === 0) {
      await database.imports.createImportRecord({
        file_name: req.file.originalname,
        import_type: 'grossiste',
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        status: 'failed',
        error_log: 'Le fichier Excel est vide'
      });
      return res.status(400).json({ success: false, error: 'Le fichier Excel est vide' });
    }

    const grossisteEndpoints = require('./grossiste-excel-endpoints');
    const validationResult = await grossisteEndpoints.validateAndImportGrossisteExcelData(jsonData, database);

    await database.imports.createImportRecord({
      file_name: req.file.originalname,
      import_type: 'grossiste',
      total_rows: validationResult.totalRows,
      valid_rows: validationResult.validRows,
      invalid_rows: validationResult.invalidRows,
      status: validationResult.isValid ? 'completed' : 'failed',
      error_log: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
    });

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation du fichier Excel grossiste',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        summary: validationResult.summary
      });
    }

    res.json({
      success: true,
      data: validationResult.importedData,
      count: validationResult.importedData.length,
      message: `${validationResult.importedData.length} rapport(s) grossiste importé(s) avec succès`,
      warnings: validationResult.warnings,
      summary: validationResult.summary
    });

  } catch (error) {
    console.error('Erreur import Excel grossiste:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'import Excel grossiste: ' + error.message });
  }
});

// ==================== MODULE 4 : EXPORT EXCEL ====================

app.post('/api/export/excel', async (req, res) => {
  try {
    const { filters } = req.body;
    const performances = await database.getAllPerformances(filters || {});
    
    if (!performances || performances.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à exporter' });
    }

    const excelData = performances.map(p => ({
      'N°': p.agent_number,
      'Agent promoteur': p.agent_name,
      'VILLE': p.city,
      'Date rapport': p.report_date,
      'Boutique (visites)': p.visits_boutique,
      'Superette (visites)': p.visits_superette,
      'Kiosque (visites)': p.visits_kiosque,
      'Tablier (visites)': p.visits_tablier,
      'Pushcart (visites)': p.visits_pushcart,
      'Biblos Lait Premium 16g (ventes)': p.real_sales_premium_16g,
      'Biblos Lait Premium 360g (ventes)': p.real_sales_premium_360g,
      'Biblos Lait Excellence 900g (ventes)': p.real_sales_excellence_900g,
      "Biblos Flocon d'avoine 50g (ventes)": p.real_sales_avoine_50g,
      "Biblos Flocon d'avoine 400g (ventes)": p.real_sales_avoine_400g,
      'Commentaires': p.comments,
      'Impressions des PDV et des clients': p.impressions
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Données');
    
    const synthesisData = calculateSynthesis(performances);
    const synthesisSheet = xlsx.utils.json_to_sheet(synthesisData);
    xlsx.utils.book_append_sheet(workbook, synthesisSheet, 'Synthèse');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `reporting-export-${timestamp}.xlsx`;
    const filepath = path.join(EXPORT_DIR, filename);
    
    xlsx.writeFile(workbook, filepath);
    
    res.json({ success: true, filename: filename, message: 'Fichier Excel généré avec succès', count: performances.length });
    
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
  }
});

app.get('/api/download/:filename', (req, res) => {
  try {
    const filepath = path.join(EXPORT_DIR, req.params.filename);
    if (fs.existsSync(filepath)) res.download(filepath);
    else res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ==================== FONCTIONS UTILITAIRES ====================

async function validateAndImportExcelData(data) {
  const results = { isValid: true, totalRows: 0, validRows: 0, invalidRows: 0, errors: [], warnings: [], importedData: [] };
  if (!Array.isArray(data) || data.length === 0) {
    results.isValid = false;
    results.errors.push({ global: true, message: 'Le fichier est vide ou n\'est pas un tableau valide' });
    return results;
  }
  results.totalRows = data.length;

  for (let index = 0; index < data.length; index++) {
    const row = data[index];
    const rowIndex = index + 1;
    const validation = await validateRowForImport(row, rowIndex);

    if (validation.errors.length > 0) {
      results.invalidRows++;
      results.errors.push(...validation.errors);
    } else {
      results.validRows++;
      const importedRow = await importRowToDatabase(row);
      if (importedRow) results.importedData.push(importedRow);
    }
    if (validation.warnings.length > 0) results.warnings.push(...validation.warnings);
  }
  results.isValid = results.errors.length === 0;
  results.summary = { totalRows: results.totalRows, validRows: results.validRows, invalidRows: results.invalidRows };
  return results;
}

async function validateRowForImport(row, rowIndex) {
  const errors = [];
  const warnings = [];
  const rowNumber = rowIndex + 2; 

  const agentNumber = row['N°'] || row['N'];
  if (!agentNumber) {
    errors.push({ row: rowNumber, field: 'N°', value: agentNumber, message: 'Le numéro d\'agent est obligatoire' });
  } else {
    const agent = await database.agents.getAgentByNumber(String(agentNumber));
    if (!agent) {
      errors.push({ row: rowNumber, field: 'N°', value: agentNumber, message: `L'agent numéro ${agentNumber} n'existe pas.` });
    }
  }

  const reportDate = row['Date rapport'] || row['Date'];
  if (!reportDate) {
    errors.push({ row: rowNumber, field: 'Date rapport', value: reportDate, message: 'La date du rapport est obligatoire' });
  } else if (isNaN(new Date(reportDate).getTime())) {
    errors.push({ row: rowNumber, field: 'Date rapport', value: reportDate, message: 'La date du rapport n\'est pas valide' });
  }

  Object.entries(row).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      errors.push({ row: rowNumber, field: key, value: value, message: `Formule Excel détectée dans "${key}".` });
    }
  });

  if (!Object.values(row).some(v => v !== null && v !== undefined && v !== '')) {
    warnings.push({ row: rowNumber, field: 'Ligne', value: 'vide', message: 'Cette ligne ne contient aucune donnée' });
  }
  return { errors, warnings };
}

async function importRowToDatabase(row) {
  try {
    const agent = await database.agents.getAgentByNumber(String(row['N°']));
    if (!agent) return null;

    const performanceData = {
      agent_id: agent.id,
      report_date: row['Date rapport'] || row['Date'],
      city: row['Ville'] || '',
      visits_boutique: Number(row['Boutique (visites)']) || 0,
      visits_superette: Number(row['Superette (visites)']) || 0,
      visits_kiosque: Number(row['Kiosque (visites)']) || 0,
      visits_tablier: Number(row['Tablier (visites)']) || 0,
      visits_pushcart: Number(row['Pushcart (visites)']) || 0,
      sales_premium_16g: Number(row['Biblos Lait Premium 16g (ventes)']) || 0,
      sales_premium_360g: Number(row['Biblos Lait Premium 360g (ventes)']) || 0,
      sales_excellence_900g: Number(row['Biblos Lait Excellence 900g (ventes)']) || 0,
      sales_avoine_50g: Number(row["Biblos Flocon d'avoine 50g (ventes)"]) || 0,
      sales_avoine_400g: Number(row["Biblos Flocon d'avoine 400g (ventes)"]) || 0,
      comments: row['Commentaires'] || '',
      impressions: row['Impressions des PDV et des clients'] || ''
    };
    return await database.commando.createCommandoPerformance(performanceData);
  } catch (error) {
    console.error('Erreur import row:', error);
    return null;
  }
}

function calculateSynthesis(data) {
  if (!data || data.length === 0) return [];
  return [{
    totalRapports: data.length,
    totalAgents: [...new Set(data.map(d => d.agent_id))].length,
    totalVisits: data.reduce((sum, item) => sum + (parseInt(item.visits_boutique) || 0) + (parseInt(item.visits_superette) || 0) + (parseInt(item.visits_kiosque) || 0) + (parseInt(item.visits_tablier) || 0) + (parseInt(item.visits_pushcart) || 0), 0),
    totalSales: data.reduce((sum, item) => sum + (parseInt(item.sales_premium_16g) || 0) + (parseInt(item.sales_premium_360g) || 0) + (parseInt(item.sales_excellence_900g) || 0) + (parseInt(item.sales_avoine_50g) || 0) + (parseInt(item.sales_avoine_400g) || 0), 0),
    generatedAt: new Date().toISOString()
  }];
}

// ==================== NOUVEAUX MODULES : COMMANDO ET GROSSISTE ====================

app.get('/api/commando-performances', async (req, res) => {
  try {
    res.json({ success: true, data: await database.commando.getCommandoPerformances(req.query.agent_id, req.query.date_from, req.query.date_to) });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/commando-performances', async (req, res) => {
  try { res.json({ success: true, data: await database.commando.createCommandoPerformance(req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.put('/api/commando-performances/:id', async (req, res) => {
  try { res.json({ success: true, data: await database.commando.updateCommandoPerformance(req.params.id, req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.delete('/api/commando-performances/:id', async (req, res) => {
  try { await database.commando.deleteCommandoPerformance(req.params.id); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/grossiste-performances', async (req, res) => {
  try { res.json({ success: true, data: await database.grossiste.getGrossistePerformances(req.query.agent_id, req.query.date_from, req.query.date_to) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/grossiste-performances', async (req, res) => {
  try { res.json({ success: true, data: await database.grossiste.createGrossistePerformance(req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.put('/api/grossiste-performances/:id', async (req, res) => {
  try { res.json({ success: true, data: await database.grossiste.updateGrossistePerformance(req.params.id, req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.delete('/api/grossiste-performances/:id', async (req, res) => {
  try { await database.grossiste.deleteGrossistePerformance(req.params.id); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

// ==================== MODULE PROMO PÂQUE ====================

app.get('/api/promo-paque-performances', async (req, res) => {
  try { res.json({ success: true, data: await database.promoPaque.getPromoPaquePerformances(req.query.enseigne, req.query.date_from, req.query.date_to) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/promo-paque-performances', async (req, res) => {
  try { res.json({ success: true, data: await database.promoPaque.createPromoPaquePerformance(req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.put('/api/promo-paque-performances/:id', async (req, res) => {
  try { res.json({ success: true, data: await database.promoPaque.updatePromoPaquePerformance(req.params.id, req.body) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.delete('/api/promo-paque-performances/:id', async (req, res) => {
  try { await database.promoPaque.deletePromoPaquePerformance(req.params.id); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/promo-paque-performances/export/excel', async (req, res) => {
  try {
    const performances = await database.promoPaque.getPromoPaquePerformances(req.query.enseigne, req.query.date_from, req.query.date_to);
    const excelData = performances.map(p => ({
      'Date': p.report_date, 'Enseigne': p.enseigne, 'PDV': p.pdv, 'Contacts objectif': p.contacts_objectif, 'Contacts réalisé': p.contacts_realise,
      'Acheteurs objectif': p.acheteurs_objectif, 'Acheteurs réalisé': p.acheteurs_realise, 'Biblos Lait Premium 16g': p.real_premium_16g,
      'Biblos Lait Premium 360g': p.real_premium_360g, 'Biblos Lait Excellence 900g': p.real_excellence_900g, 'Biblos Avoine 50g': p.real_avoine_50g,
      'Biblos Avoine 400g': p.real_avoine_400g, 'Biblos 3 en 1 Café au lait': p.real_3en1_cafe, 'Gratuité Premium 16g': p.gratuite_premium_16g,
      'Gratuité Avoine': p.gratuite_avoine, 'Gratuité 3 en 1': p.gratuite_3en1, 'Goodies 1': p.goodies1, 'Goodies 2': p.goodies2, 'Goodies 3': p.goodies3, 'Goodies 4': p.goodies4, 'Commentaires': p.comments
    }));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(excelData), 'Promo Paque');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="promo-paque-export-${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

// ==================== MODULE GROSSISTE EXCEL IMPORT/EXPORT ====================
const grossisteExcelEndpoints = require('./grossiste-excel-endpoints');
grossisteExcelEndpoints.registerEndpoints(app, database, { TEMPLATE_DIR });

// ==================== NOUVEAUX ENDPOINTS ETL ET KPI ====================
const etlTransformer = GrossisteETLTransformer;
const kpiCalculator = new GrossisteKPICalculator();
const powerBIExporter = new PowerBIExporter();
const objectiveTracker = new ObjectiveTracker();
const batchProcessor = new BatchExcelProcessor();
const etlDataValidator = new ETLDataValidator();

app.post('/api/grossiste/etl/transform', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const validation = etlTransformer.validateExcelStructure(req.file.buffer);
    if (!validation.isValid) return res.status(400).json({ success: false, details: validation.errors });
    const transformation = etlTransformer.transformExcelFile(req.file.buffer, { fileName: req.file.originalname });
    if (!transformation.success) return res.status(500).json({ success: false, details: transformation.error });
    res.json({ success: true, data: transformation.data, statistics: transformation.statistics, metadata: transformation.metadata, warnings: validation.warnings });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/grossiste/kpi/global', async (req, res) => {
  try { res.json({ success: true, kpis: kpiCalculator.calculateAllKPIs(await database.grossiste.getGrossistePerformances()) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/grossiste/kpi/agent/:agentId', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances(parseInt(req.params.agentId));
    if (!performances || performances.length === 0) return res.status(404).json({ success: false });
    res.json({ success: true, kpis: kpiCalculator.calculateAgentKPIs(performances) });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/grossiste/alerts', async (req, res) => {
  try {
    const kpis = kpiCalculator.calculateAllKPIs(await database.grossiste.getGrossistePerformances());
    res.json({ success: true, alerts: kpis.alerts, alertCount: kpis.alerts.length, criticalAlerts: kpis.alerts.filter(a => a.type === 'critical').length, warningAlerts: kpis.alerts.filter(a => a.type === 'warning').length });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/grossiste/analytics', async (req, res) => {
  try {
    const { period, city } = req.query;
    let performances = await database.grossiste.getGrossistePerformances();
    if (city) performances = performances.filter(p => p.city === city);
    if (period) {
      const [start, end] = period.split(',');
      performances = performances.filter(p => new Date(p.report_date) >= new Date(start) && new Date(p.report_date) <= new Date(end));
    }
    const kpis = kpiCalculator.calculateAllKPIs(performances);
    res.json({ success: true, analytics: { ...kpis, statisticalAnalysis: { performanceDistribution: _calculatePerformanceDistribution(performances), correlationVisitsSales: _calculateCorrelation(performances, 'personnes_approchees', 'total_sales'), topPerformers: _getTopPerformers(performances, 5), underPerformers: _getUnderPerformers(performances, 5) } } });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

function _calculatePerformanceDistribution(performances) {
  const rates = performances.map(p => {
    const sales = (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    return p.objective_carton > 0 ? (sales / p.objective_carton) * 100 : 0;
  });
  return { excellent: rates.filter(r => r >= 150).length, good: rates.filter(r => r >= 100 && r < 150).length, satisfactory: rates.filter(r => r >= 75 && r < 100).length, poor: rates.filter(r => r >= 50 && r < 75).length, critical: rates.filter(r => r < 50).length };
}

function _calculateCorrelation(performances, f1, f2) {
  const pairs = performances.map(p => ({ x: p[f1] || 0, y: (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0) }));
  if (pairs.length < 2) return { correlation: 0, message: 'Pas assez de données' };
  const mX = pairs.reduce((s, p) => s + p.x, 0) / pairs.length, mY = pairs.reduce((s, p) => s + p.y, 0) / pairs.length;
  let num = 0, denX = 0, denY = 0;
  for (const p of pairs) { const dx = p.x - mX, dy = p.y - mY; num += dx * dy; denX += dx * dx; denY += dy * dy; }
  const corr = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
  return { correlation: Math.round(corr * 1000) / 1000, strength: Math.abs(corr) > 0.7 ? 'forte' : Math.abs(corr) > 0.3 ? 'modérée' : 'faible', direction: corr > 0 ? 'positive' : 'négative' };
}

function _getTopPerformers(performances, limit) {
  const groups = performances.reduce((g, p) => {
    if (!g[p.agent_id]) g[p.agent_id] = { agentId: p.agent_id, agentName: p.agent_name, totalSales: 0, objectives: 0 };
    g[p.agent_id].totalSales += (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    g[p.agent_id].objectives += (p.objective_carton || 0);
    return g;
  }, {});
  for (const a in groups) groups[a].achievementRate = groups[a].objectives > 0 ? (groups[a].totalSales / groups[a].objectives) * 100 : 0;
  return Object.values(groups).sort((a, b) => b.achievementRate - a.achievementRate).slice(0, limit);
}

function _getUnderPerformers(performances, limit) {
  const groups = performances.reduce((g, p) => {
    if (!g[p.agent_id]) g[p.agent_id] = { agentId: p.agent_id, agentName: p.agent_name, totalSales: 0, objectives: 0 };
    g[p.agent_id].totalSales += (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    g[p.agent_id].objectives += (p.objective_carton || 0);
    return g;
  }, {});
  for (const a in groups) groups[a].achievementRate = groups[a].objectives > 0 ? (groups[a].totalSales / groups[a].objectives) * 100 : 0;
  return Object.values(groups).filter(a => a.achievementRate < 100).sort((a, b) => a.achievementRate - b.achievementRate).slice(0, limit);
}

app.post('/api/grossiste/export/powerbi', async (req, res) => {
  try {
    const { filters } = req.body;
    let performances = await database.grossiste.getGrossistePerformances();
    if (filters) {
      if (filters.agent_id) performances = performances.filter(p => p.agent_id === filters.agent_id);
      if (filters.city) performances = performances.filter(p => p.city === filters.city);
      if (filters.date_from) performances = performances.filter(p => new Date(p.report_date) >= new Date(filters.date_from));
      if (filters.date_to) performances = performances.filter(p => new Date(p.report_date) <= new Date(filters.date_to));
    }
    if (!performances || performances.length === 0) return res.status(400).json({ success: false, error: 'Aucune donnée' });
    const exportResult = powerBIExporter.exportToPowerBIFormat(performances, { filters: filters || {}, exportDate: new Date().toISOString() });
    res.json({ success: true, filename: exportResult.filename, scriptPath: exportResult.scriptPath, dataCount: exportResult.dataCount, downloadUrl: `/api/download/powerbi/${exportResult.filename}` });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/download/powerbi/:filename', (req, res) => {
  try {
    const filepath = path.join(powerBIExporter.exportDir, req.params.filename);
    if (fs.existsSync(filepath)) res.download(filepath);
    else res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) { res.status(500).json({ error: 'Erreur' }); }
});

app.get('/api/download/powerquery/:filename', (req, res) => {
  try {
    const scriptPath = path.join(powerBIExporter.exportDir, req.params.filename);
    if (fs.existsSync(scriptPath)) res.download(scriptPath);
    else res.status(404).json({ error: 'Script non trouvé' });
  } catch (error) { res.status(500).json({ error: 'Erreur' }); }
});

// ==================== ENDPOINTS SUIVI DES OBJECTIFS ====================

app.get('/api/objectives/analysis', async (req, res) => {
  try { res.json({ success: true, analysis: objectiveTracker.analyzePerformanceVsObjectives(await database.grossiste.getGrossistePerformances(), await database.objectives.getActiveObjectivesForAgent(1)) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/objectives/dashboard', async (req, res) => {
  try { res.json({ success: true, dashboard: objectiveTracker.getObjectiveDashboard(await database.grossiste.getGrossistePerformances(), await database.objectives.getActiveObjectivesForAgent(1)) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/objectives/alerts', async (req, res) => {
  try {
    let performances = await database.grossiste.getGrossistePerformances();
    let objectives = await database.objectives.getActiveObjectivesForAgent(1);
    if (req.query.agent_id) {
      performances = performances.filter(p => p.agent_id === parseInt(req.query.agent_id));
      objectives = objectives.filter(obj => obj.agent_id === parseInt(req.query.agent_id));
    }
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    res.json({ success: true, alerts: analysis.alerts, criticalAlerts: analysis.alerts.filter(a => a.type === 'critical').length, warningAlerts: analysis.alerts.filter(a => a.type === 'warning').length });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/objectives/recommendations', async (req, res) => {
  try { res.json({ success: true, recommendations: objectiveTracker.analyzePerformanceVsObjectives(await database.grossiste.getGrossistePerformances(), await database.objectives.getActiveObjectivesForAgent(1)).recommendations }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/objectives/agent/:agentId', async (req, res) => {
  try {
    const aId = parseInt(req.params.agentId);
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(await database.grossiste.getGrossistePerformances(aId), await database.objectives.getActiveObjectivesForAgent(aId));
    res.json({ success: true, analysis: analysis.byAgent[aId] || null, alerts: analysis.alerts.filter(a => a.agentId === String(aId)) });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

// ==================== ENDPOINTS TRAITEMENT PAR LOTS ====================

app.post('/api/grossiste/batch/process-folder', async (req, res) => {
  try { res.json(await batchProcessor.processFolder(req.body.folderPath, req.body.options)); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/grossiste/batch/process-files', async (req, res) => {
  try { res.json(await batchProcessor.processFiles(req.body.filePaths, req.body.options)); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/grossiste/batch/analyze-patterns', async (req, res) => {
  try { res.json({ success: true, patterns: batchProcessor.analyzePatterns(req.body.results) }); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/grossiste/batch/export-consolidated', async (req, res) => {
  try { res.json(batchProcessor.exportConsolidatedResults(req.body.results, req.body.outputPath || path.join(EXPORT_DIR, `batch-consolidated-${Date.now()}.xlsx`))); } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

// ==================== ENDPOINTS VALIDATION ENRICHIE ETL ====================

app.post('/api/validation/etl/validate-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    res.json(etlDataValidator.validateWithETLRules(req.file.buffer, { fileName: req.file.originalname }));
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.post('/api/validation/quick', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const quickValidation = etlDataValidator.quickValidate(req.file.buffer);
    res.json({ success: true, validation: quickValidation, canProceed: quickValidation.canProceed });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

app.get('/api/validation/etl/check-database', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const validationResult = { isValid: true, score: 100, warnings: [] };
    for (const perf of performances) {
      const sales = (perf.real_sales_premium_16g || 0) + (perf.real_sales_premium_360g || 0) + (perf.real_sales_excellence_900g || 0) + (perf.real_sales_avoine_50g || 0) + (perf.real_sales_avoine_400g || 0);
      if (perf.objective_carton > 0 && (sales / perf.objective_carton) * 100 > 500) {
        validationResult.warnings.push({ message: `Taux inhabituel pour l'agent ${perf.agent_id}` });
      }
    }
    validationResult.score = Math.max(0, 100 - (validationResult.warnings.length * 5));
    res.json({ success: true, validation: validationResult, databaseHealth: validationResult.score >= 80 ? 'good' : 'needs_attention' });
  } catch (error) { res.status(500).json({ success: false, error: 'Erreur' }); }
});

// ============ ETL Endpoints (Import/Export PowerBI) ============
const etlMiddleware = require('./src/etl/etl-middleware');

app.post('/api/etl/import/:type', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const { type } = req.params;
    if (!['commando', 'grossiste'].includes(type)) return res.status(400).json({ success: false, error: 'Type invalide' });

    const tempFilePath = path.join(UPLOADS_DIR, `temp_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    const result = await etlMiddleware.importExcel(tempFilePath, type);
    fs.unlinkSync(tempFilePath);

    if (!result.success) return res.status(400).json(result);

    let inserted = 0, errors = [];
    for (const row of result.data) {
      try {
        if (type === 'commando') await database.commando.createCommandoPerformance(row);
        else if (type === 'grossiste') await database.grossiste.createGrossistePerformance(row);
        inserted++;
      } catch (error) { errors.push({ data: row, error: error.message }); }
    }
    res.json({ success: true, summary: { inserted, failed: errors.length }, errors: result.errors });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/etl/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await etlMiddleware.exportToExcel(type, req.query);
    if (!result.success) return res.status(400).json(result);

    const fileName = `PowerBI_Export_${type}_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    xlsx.writeFile(result.workbook, filePath);
    res.download(filePath, fileName, () => { fs.unlinkSync(filePath); });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/etl/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const tempFilePath = path.join(UPLOADS_DIR, `temp_validate_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    const result = await etlMiddleware.importExcel(tempFilePath, req.body.type);
    fs.unlinkSync(tempFilePath);
    res.json(result);
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ==================== DÉMARRAGE DU SERVEUR ====================
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend local démarré sur le port ${PORT}`);
  });
}

module.exports = app;