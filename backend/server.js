const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const database = require('./src/database/database-functions');

// Importer les nouveaux modules ETL et KPI
const GrossisteETLTransformer = require('./src/etl/grossiste-etl-transformer');
const GrossisteKPICalculator = require('./src/analytics/grossiste-kpi-calculator');
const PowerBIExporter = require('./src/export/powerbi-exporter');
const ObjectiveTracker = require('./src/analytics/objective-tracker');
const BatchExcelProcessor = require('./src/etl/batch-processor');
const ETLDataValidator = require('./src/validation/etl-data-validator');

const app = express();
const PORT = process.env.PORT || 5000;

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
// Détection de l'environnement Vercel
const IS_VERCEL = process.env.NODE_ENV === 'production';

// Dossiers dynamiques (/tmp sur Vercel, local sur votre PC)
const EXPORT_DIR = IS_VERCEL ? '/tmp/exports' : path.join(__dirname, 'exports');
const TEMPLATE_DIR = IS_VERCEL ? '/tmp/templates' : path.join(__dirname, 'templates');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Gestion sécurisée du fichier Excel
const ORIGINAL_EXCEL = IS_VERCEL 
  ? path.join(__dirname, 'template_original.xlsx') 
  : path.join('C:', 'Users', 'angec', 'Downloads', 'SAN PEDRO - REPORTING COMMANDO DE REFE. DETAILLANTS LAIT & FLOC. AVOINE (1).xlsx');

const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'template_original.xlsx');

// Création sécurisée des dossiers sans faire crasher Vercel
try {
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATE_DIR)) fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (error) {
  console.warn("⚠️ Création de dossiers ignorée (comportement normal sur Vercel)");
}

// Copier le fichier Excel original comme template s'il existe (Uniquement en local)
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

// Récupérer tous les agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await database.agents.getAllAgents();
    res.json({ success: true, data: agents, count: agents.length });
  } catch (error) {
    console.error('Erreur récupération agents:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des agents' });
  }
});

// Créer un agent
app.post('/api/agents', async (req, res) => {
  try {
    const agentData = req.body;
    
    // Vérifier si le numéro d'agent existe déjà
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

// Récupérer un agent par ID
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

// Mettre à jour un agent
app.put('/api/agents/:id', async (req, res) => {
  try {
    const agent = await database.agents.updateAgent(parseInt(req.params.id), req.body);
    res.json({ success: true, data: agent, message: 'Agent mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l\'agent' });
  }
});

// Supprimer un agent
app.delete('/api/agents/:id', async (req, res) => {
  try {
    const result = await database.agents.deleteAgent(parseInt(req.params.id));
    res.json({ success: true, message: 'Agent supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression agent:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'agent' });
  }
});

// Créer un objectif
app.post('/api/objectives', async (req, res) => {
  try {
    const objective = await database.objectives.createObjective(req.body);
    res.json({ success: true, data: objective, message: 'Objectif créé avec succès' });
  } catch (error) {
    console.error('Erreur création objectif:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'objectif' });
  }
});

// Récupérer les objectifs d'un agent
app.get('/api/agents/:id/objectives', async (req, res) => {
  try {
    const objectives = await database.objectives.getAgentObjectives(parseInt(req.params.id));
    res.json({ success: true, data: objectives, count: objectives.length });
  } catch (error) {
    console.error('Erreur récupération objectifs:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des objectifs' });
  }
});

// Mettre à jour un objectif
app.put('/api/objectives/:id', async (req, res) => {
  try {
    const objective = await database.objectives.createObjective(req.body);
    res.json({ success: true, data: objective, message: 'Objectif mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour objectif:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l\'objectif' });
  }
});

// ==================== MODULE 3 : IMPORT EXCEL ====================

// Télécharger le template Excel
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

// Importer un fichier Excel
app.post('/api/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucun fichier fourni' 
      });
    }

    const importRecord = await database.imports.createImportRecord({
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
      
      return res.status(400).json({ 
        success: false,
        error: 'Le fichier Excel est vide' 
      });
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
        summary: {
          totalRows: validationResult.totalRows,
          validRows: validationResult.validRows,
          invalidRows: validationResult.invalidRows
        }
      });
    }

    res.json({ 
      success: true, 
      data: validationResult.importedData,
      count: validationResult.importedData.length,
      message: `${validationResult.importedData.length} rapport(s) importé(s) avec succès`,
      warnings: validationResult.warnings,
      summary: {
        totalRows: validationResult.totalRows,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows
      }
    });
    
  } catch (error) {
    console.error('Erreur import Excel:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'import Excel: ' + error.message 
    });
  }
});

// Importer un fichier Excel pour reporting grossiste
app.post('/api/import/excel/grossiste', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const importRecord = await database.imports.createImportRecord({
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

      return res.status(400).json({
        success: false,
        error: 'Le fichier Excel est vide'
      });
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
        summary: {
          totalRows: validationResult.totalRows,
          validRows: validationResult.validRows,
          invalidRows: validationResult.invalidRows
        }
      });
    }

    res.json({
      success: true,
      data: validationResult.importedData,
      count: validationResult.importedData.length,
      message: `${validationResult.importedData.length} rapport(s) grossiste importé(s) avec succès`,
      warnings: validationResult.warnings,
      summary: {
        totalRows: validationResult.totalRows,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows
      }
    });

  } catch (error) {
    console.error('Erreur import Excel grossiste:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import Excel grossiste: ' + error.message
    });
  }
});

// ==================== MODULE 4 : EXPORT EXCEL ====================

// Exporter les données en Excel
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
    
    res.json({ 
      success: true, 
      filename: filename,
      message: 'Fichier Excel généré avec succès',
      count: performances.length
    });
    
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
  }
});

// Télécharger un fichier exporté
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(EXPORT_DIR, filename);
    
    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

// ==================== FONCTIONS UTILITAIRES ====================

async function validateAndImportExcelData(data) {
  const results = {
    isValid: true,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    warnings: [],
    importedData: []
  };

  if (!Array.isArray(data) || data.length === 0) {
    results.isValid = false;
    results.errors.push({
      global: true,
      message: 'Le fichier est vide ou n\'est pas un tableau valide'
    });
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
      if (importedRow) {
        results.importedData.push(importedRow);
      }
    }

    if (validation.warnings.length > 0) {
      results.warnings.push(...validation.warnings);
    }
  }

  results.isValid = results.errors.length === 0;
  return results;
}

async function validateRowForImport(row, rowIndex) {
  const errors = [];
  const warnings = [];
  const rowNumber = rowIndex + 2; 

  const agentNumber = row['N°'] || row['N'];
  if (!agentNumber || agentNumber === '' || agentNumber === null) {
    errors.push({
      row: rowNumber,
      field: 'N°',
      value: agentNumber,
      message: 'Le numéro d\'agent est obligatoire'
    });
  } else {
    const agent = await database.agents.getAgentByNumber(String(agentNumber));
    if (!agent) {
      errors.push({
        row: rowNumber,
        field: 'N°',
        value: agentNumber,
        message: `L'agent avec le numéro ${agentNumber} n'existe pas dans la base de données. Veuillez d'abord créer cet agent.`
      });
    }
  }

  const reportDate = row['Date rapport'] || row['Date'];
  if (!reportDate || reportDate === '' || reportDate === null) {
    errors.push({
      row: rowNumber,
      field: 'Date rapport',
      value: reportDate,
      message: 'La date du rapport est obligatoire'
    });
  } else {
    const dateObj = new Date(reportDate);
    if (isNaN(dateObj.getTime())) {
      errors.push({
        row: rowNumber,
        field: 'Date rapport',
        value: reportDate,
        message: 'La date du rapport n\'est pas valide'
      });
    }
  }

  Object.entries(row).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      errors.push({
        row: rowNumber,
        field: key,
        value: value,
        message: `Formule Excel détectée dans "${key}". Les formules ne sont pas autorisées. Veuillez utiliser des valeurs statiques.`
      });
    }
  });

  const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '');
  if (!hasData) {
    warnings.push({
      row: rowNumber,
      field: 'Ligne',
      value: 'vide',
      message: 'Cette ligne ne contient aucune donnée'
    });
  }

  return { errors, warnings };
}

async function importRowToDatabase(row) {
  try {
    const agent = await database.agents.getAgentByNumber(String(row['N°']));
    if (!agent) return null;

    const reportDate = row['Date rapport'] || row['Date'];
    
    const performanceData = {
      agent_id: agent.id,
      report_date: reportDate,
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
  
  const synthesis = {
    totalRapports: data.length,
    totalAgents: [...new Set(data.map(d => d.agent_id))].length,
    totalVisits: data.reduce((sum, item) => sum + (parseInt(item.visits_boutique) || 0) + (parseInt(item.visits_superette) || 0) + (parseInt(item.visits_kiosque) || 0) + (parseInt(item.visits_tablier) || 0) + (parseInt(item.visits_pushcart) || 0), 0),
    totalSales: data.reduce((sum, item) => sum + (parseInt(item.sales_premium_16g) || 0) + (parseInt(item.sales_premium_360g) || 0) + (parseInt(item.sales_excellence_900g) || 0) + (parseInt(item.sales_avoine_50g) || 0) + (parseInt(item.sales_avoine_400g) || 0), 0),
    generatedAt: new Date().toISOString()
  };
  
  return [synthesis];
}

// ==================== NOUVEAUX MODULES : COMMANO ET GROSSISTE ====================

app.get('/api/commando-performances', async (req, res) => {
  try {
    const { agent_id, date_from, date_to } = req.query;
    const performances = await database.commando.getCommandoPerformances(agent_id, date_from, date_to);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/commando-performances', async (req, res) => {
  try {
    const performance = await database.commando.createCommandoPerformance(req.body);
    res.json({ success: true, data: performance, message: 'Créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.put('/api/commando-performances/:id', async (req, res) => {
  try {
    const performance = await database.commando.updateCommandoPerformance(req.params.id, req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.delete('/api/commando-performances/:id', async (req, res) => {
  try {
    await database.commando.deleteCommandoPerformance(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/grossiste-performances', async (req, res) => {
  try {
    const { agent_id, date_from, date_to } = req.query;
    const performances = await database.grossiste.getGrossistePerformances(agent_id, date_from, date_to);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/grossiste-performances', async (req, res) => {
  try {
    const performance = await database.grossiste.createGrossistePerformance(req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.put('/api/grossiste-performances/:id', async (req, res) => {
  try {
    const performance = await database.grossiste.updateGrossistePerformance(req.params.id, req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.delete('/api/grossiste-performances/:id', async (req, res) => {
  try {
    await database.grossiste.deleteGrossistePerformance(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

// ==================== MODULE PROMO PÂQUE ====================

app.get('/api/promo-paque-performances', async (req, res) => {
  try {
    const { enseigne, date_from, date_to } = req.query;
    const performances = await database.promoPaque.getPromoPaquePerformances(enseigne, date_from, date_to);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/promo-paque-performances', async (req, res) => {
  try {
    const performance = await database.promoPaque.createPromoPaquePerformance(req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.put('/api/promo-paque-performances/:id', async (req, res) => {
  try {
    const performance = await database.promoPaque.updatePromoPaquePerformance(req.params.id, req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.delete('/api/promo-paque-performances/:id', async (req, res) => {
  try {
    await database.promoPaque.deletePromoPaquePerformance(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/promo-paque-performances/export/excel', async (req, res) => {
  try {
    const { enseigne, date_from, date_to } = req.query;
    const performances = await database.promoPaque.getPromoPaquePerformances(enseigne, date_from, date_to);

    const excelData = performances.map(p => ({
      'Date': p.report_date,
      'Enseigne': p.enseigne,
      'PDV': p.pdv,
      'Contacts objectif': p.contacts_objectif,
      'Contacts réalisé': p.contacts_realise,
      'Acheteurs objectif': p.acheteurs_objectif,
      'Acheteurs réalisé': p.acheteurs_realise,
      'Biblos Lait Premium 16g': p.real_premium_16g,
      'Biblos Lait Premium 360g': p.real_premium_360g,
      'Biblos Lait Excellence 900g': p.real_excellence_900g,
      "Biblos Avoine 50g": p.real_avoine_50g,
      "Biblos Avoine 400g": p.real_avoine_400g,
      'Biblos 3 en 1 Café au lait': p.real_3en1_cafe,
      'Gratuité Premium 16g': p.gratuite_premium_16g,
      'Gratuité Avoine': p.gratuite_avoine,
      'Gratuité 3 en 1': p.gratuite_3en1,
      'Goodies 1': p.goodies1,
      'Goodies 2': p.goodies2,
      'Goodies 3': p.goodies3,
      'Goodies 4': p.goodies4,
      'Commentaires': p.comments
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Promo Paque');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    res.setHeader('Content-Disposition', `attachment; filename="promo-paque-export-${timestamp}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

// ==================== MODULE GROSSISTE EXCEL IMPORT/EXPORT ====================

const grossisteExcelEndpoints = require('./grossiste-excel-endpoints');
grossisteExcelEndpoints.registerEndpoints(app, database, { TEMPLATE_DIR: TEMPLATE_DIR });

// ==================== NOUVEAUX ENDPOINTS ETL ET KPI ====================

const etlTransformer = new GrossisteETLTransformer();
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

    res.json({
      success: true,
      data: transformation.data,
      statistics: transformation.statistics,
      metadata: transformation.metadata,
      warnings: validation.warnings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/grossiste/kpi/global', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    res.json({ success: true, kpis: kpiCalculator.calculateAllKPIs(performances) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/grossiste/kpi/agent/:agentId', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances(parseInt(req.params.agentId));
    if (!performances || performances.length === 0) return res.status(404).json({ success: false });
    res.json({ success: true, kpis: kpiCalculator.calculateAgentKPIs(performances) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/grossiste/alerts', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const kpis = kpiCalculator.calculateAllKPIs(performances);
    res.json({
      success: true,
      alerts: kpis.alerts,
      alertCount: kpis.alerts.length,
      criticalAlerts: kpis.alerts.filter(a => a.type === 'critical').length,
      warningAlerts: kpis.alerts.filter(a => a.type === 'warning').length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/grossiste/analytics', async (req, res) => {
  try {
    const { period, city } = req.query;
    let performances = await database.grossiste.getGrossistePerformances();
    
    if (city) performances = performances.filter(p => p.city === city);
    if (period) {
      const [startDate, endDate] = period.split(',');
      performances = performances.filter(p => {
        const date = new Date(p.report_date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    
    const kpis = kpiCalculator.calculateAllKPIs(performances);
    const analytics = {
      ...kpis,
      statisticalAnalysis: {
        performanceDistribution: _calculatePerformanceDistribution(performances),
        correlationVisitsSales: _calculateCorrelation(performances, 'personnes_approchees', 'total_sales'),
        topPerformers: _getTopPerformers(performances, 5),
        underPerformers: _getUnderPerformers(performances, 5)
      }
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

function _calculatePerformanceDistribution(performances) {
  const rates = performances.map(p => {
    const sales = (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
                  (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    const objective = p.objective_carton || 0;
    return objective > 0 ? (sales / objective) * 100 : 0;
  });
  
  return {
    excellent: rates.filter(r => r >= 150).length,
    good: rates.filter(r => r >= 100 && r < 150).length,
    satisfactory: rates.filter(r => r >= 75 && r < 100).length,
    poor: rates.filter(r => r >= 50 && r < 75).length,
    critical: rates.filter(r => r < 50).length
  };
}

function _calculateCorrelation(performances, field1, field2) {
  const pairs = performances.map(p => ({
    x: p[field1] || 0,
    y: (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
       (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0)
  }));
  
  if (pairs.length < 2) return { correlation: 0, message: 'Pas assez de données' };
  
  const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / pairs.length;
  const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / pairs.length;
  
  let numerator = 0, denominatorX = 0, denominatorY = 0;
  for (const pair of pairs) {
    const dx = pair.x - meanX, dy = pair.y - meanY;
    numerator += dx * dy;
    denominatorX += dx * dx;
    denominatorY += dy * dy;
  }
  
  const correlation = denominatorX > 0 && denominatorY > 0 ? numerator / Math.sqrt(denominatorX * denominatorY) : 0;
  return {
    correlation: Math.round(correlation * 1000) / 1000,
    strength: Math.abs(correlation) > 0.7 ? 'forte' : Math.abs(correlation) > 0.3 ? 'modérée' : 'faible',
    direction: correlation > 0 ? 'positive' : 'négative'
  };
}

function _getTopPerformers(performances, limit) {
  const agentGroups = performances.reduce((groups, p) => {
    if (!groups[p.agent_id]) groups[p.agent_id] = { agentId: p.agent_id, agentName: p.agent_name, totalSales: 0, objectives: 0 };
    groups[p.agent_id].totalSales += (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
                                     (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    groups[p.agent_id].objectives += (p.objective_carton || 0);
    return groups;
  }, {});
  for (const a in agentGroups) agentGroups[a].achievementRate = agentGroups[a].objectives > 0 ? (agentGroups[a].totalSales / agentGroups[a].objectives) * 100 : 0;
  return Object.values(agentGroups).sort((a, b) => b.achievementRate - a.achievementRate).slice(0, limit);
}

function _getUnderPerformers(performances, limit) {
  const agentGroups = performances.reduce((groups, p) => {
    if (!groups[p.agent_id]) groups[p.agent_id] = { agentId: p.agent_id, agentName: p.agent_name, totalSales: 0, objectives: 0 };
    groups[p.agent_id].totalSales += (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
                                     (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    groups[p.agent_id].objectives += (p.objective_carton || 0);
    return groups;
  }, {});
  for (const a in agentGroups) agentGroups[a].achievementRate = agentGroups[a].objectives > 0 ? (agentGroups[a].totalSales / agentGroups[a].objectives) * 100 : 0;
  return Object.values(agentGroups).filter(a => a.achievementRate < 100).sort((a, b) => a.achievementRate - b.achievementRate).slice(0, limit);
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
    if (!exportResult.success) return res.status(500).json({ success: false, error: 'Erreur', details: exportResult.error });
    
    res.json({
      success: true,
      filename: exportResult.filename,
      scriptPath: exportResult.scriptPath,
      dataCount: exportResult.dataCount,
      downloadUrl: `/api/download/powerbi/${exportResult.filename}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/download/powerbi/:filename', (req, res) => {
  try {
    const filepath = path.join(powerBIExporter.exportDir, req.params.filename);
    if (fs.existsSync(filepath)) res.download(filepath);
    else res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

app.get('/api/download/powerquery/:filename', (req, res) => {
  try {
    const scriptPath = path.join(powerBIExporter.exportDir, req.params.filename);
    if (fs.existsSync(scriptPath)) res.download(scriptPath);
    else res.status(404).json({ error: 'Script non trouvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// ==================== ENDPOINTS SUIVI DES OBJECTIFS ====================

app.get('/api/objectives/analysis', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1);
    res.json({ success: true, analysis: objectiveTracker.analyzePerformanceVsObjectives(performances, objectives) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/objectives/dashboard', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1);
    res.json({ success: true, dashboard: objectiveTracker.getObjectiveDashboard(performances, objectives) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/objectives/alerts', async (req, res) => {
  try {
    const { agent_id } = req.query;
    let performances = await database.grossiste.getGrossistePerformances();
    let objectives = await database.objectives.getActiveObjectivesForAgent(1);
    
    if (agent_id) {
      performances = performances.filter(p => p.agent_id === parseInt(agent_id));
      objectives = objectives.filter(obj => obj.agent_id === parseInt(agent_id));
    }
    
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    res.json({
      success: true,
      alerts: analysis.alerts,
      criticalAlerts: analysis.alerts.filter(a => a.type === 'critical').length,
      warningAlerts: analysis.alerts.filter(a => a.type === 'warning').length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/objectives/recommendations', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1);
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({ success: true, recommendations: analysis.recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/objectives/agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const performances = await database.grossiste.getGrossistePerformances(agentId);
    const objectives = await database.objectives.getActiveObjectivesForAgent(agentId);
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({
      success: true,
      analysis: analysis.byAgent[agentId] || null,
      alerts: analysis.alerts.filter(a => a.agentId === String(agentId))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

// ==================== ENDPOINTS TRAITEMENT PAR LOTS ====================

app.post('/api/grossiste/batch/process-folder', async (req, res) => {
  try {
    res.json(await batchProcessor.processFolder(req.body.folderPath, req.body.options));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/grossiste/batch/process-files', async (req, res) => {
  try {
    res.json(await batchProcessor.processFiles(req.body.filePaths, req.body.options));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/grossiste/batch/analyze-patterns', async (req, res) => {
  try {
    res.json({ success: true, patterns: batchProcessor.analyzePatterns(req.body.results) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/grossiste/batch/export-consolidated', async (req, res) => {
  try {
    const finalOutputPath = req.body.outputPath || path.join(EXPORT_DIR, `batch-consolidated-${Date.now()}.xlsx`);
    res.json(batchProcessor.exportConsolidatedResults(req.body.results, finalOutputPath));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

// ==================== ENDPOINTS VALIDATION ENRICHIE ETL ====================

app.post('/api/validation/etl/validate-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    res.json(etlDataValidator.validateWithETLRules(req.file.buffer, { fileName: req.file.originalname }));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.post('/api/validation/quick', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const quickValidation = etlDataValidator.quickValidate(req.file.buffer);
    res.json({ success: true, validation: quickValidation, canProceed: quickValidation.canProceed });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

app.get('/api/validation/etl/check-database', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const validationResult = { isValid: true, score: 100, warnings: [] };

    for (const perf of performances) {
      const sales = (perf.real_sales_premium_16g || 0) + (perf.real_sales_premium_360g || 0) + 
                    (perf.real_sales_excellence_900g || 0) + (perf.real_sales_avoine_50g || 0) + (perf.real_sales_avoine_400g || 0);
      const objective = perf.objective_carton || 0;
      if (objective > 0 && (sales / objective) * 100 > 500) {
        validationResult.warnings.push({ message: `Taux inhabituel pour l'agent ${perf.agent_id}` });
      }
    }

    validationResult.score = Math.max(0, 100 - (validationResult.warnings.length * 5));
    res.json({ success: true, validation: validationResult, databaseHealth: validationResult.score >= 80 ? 'good' : 'needs_attention' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur' });
  }
});

// ============ ETL Endpoints (Import/Export PowerBI) ============

const etlMiddleware = require('./src/etl/etl-middleware');

app.post('/api/etl/import/:type', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    const { type } = req.params;
    if (!['commando', 'grossiste'].includes(type)) return res.status(400).json({ success: false, error: 'Type invalide' });

    // Remplacement du chemin local par UPLOADS_DIR sécurisé
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
      } catch (error) {
        errors.push({ data: row, error: error.message });
      }
    }
    res.json({ success: true, summary: { inserted, failed: errors.length }, errors: result.errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/etl/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await etlMiddleware.exportToExcel(type, req.query);

    if (!result.success) return res.status(400).json(result);

    const fileName = `PowerBI_Export_${type}_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);

    // On utilise notre EXPORT_DIR sécurisé (sans essayer de le recréer avec fs.mkdirSync ici)
    xlsx.writeFile(result.workbook, filePath);

    res.download(filePath, fileName, (err) => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/etl/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier' });
    
    // Remplacement du chemin local par UPLOADS_DIR sécurisé
    const tempFilePath = path.join(UPLOADS_DIR, `temp_validate_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const result = await etlMiddleware.importExcel(tempFilePath, req.body.type);
    fs.unlinkSync(tempFilePath);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DÉMARRAGE DU SERVEUR ====================

// Vercel n'aime pas app.listen() qui bloque le processus. 
// On exporte l'app pour Vercel, et on l'écoute seulement si on est en local.
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend local démarré sur le port ${PORT}`);
  });
}

// Obligatoire pour que Vercel puisse lire le fichier
module.exports = app;