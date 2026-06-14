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

// Dossier pour stocker les fichiers Excel
const EXPORT_DIR = path.join(__dirname, 'exports');
const TEMPLATE_DIR = path.join(__dirname, 'templates');
const ORIGINAL_EXCEL = path.join('C:', 'Users', 'angec', 'Downloads', 'SAN PEDRO - REPORTING COMMANDO DE REFE. DETAILLANTS LAIT & FLOC. AVOINE (1).xlsx');
const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'template_original.xlsx');

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATE_DIR)) {
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}

// Copier le fichier Excel original comme template s'il existe
if (fs.existsSync(ORIGINAL_EXCEL) && !fs.existsSync(TEMPLATE_FILE)) {
  try {
    fs.copyFileSync(ORIGINAL_EXCEL, TEMPLATE_FILE);
    console.log('Template Excel original copié avec succès');
  } catch (error) {
    console.error('Erreur lors de la copie du template:', error);
  }
}

// Routes générales
app.get('/api/health', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({ 
      status: 'OK', 
      message: 'API de reporting opérationnelle avec base de données SQLite',
      database: 'SQLite opérationnelle',
      statistics: {
        agents: stats.agents,
        performances: stats.total,
        commando: stats.commando,
        grossiste: stats.grossiste
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
    // Pour simplifier, nous allons juste créer un nouvel objectif au lieu de mettre à jour
    // Cette fonctionnalité peut être étendue plus tard
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
    const templatePath = path.join(TEMPLATE_DIR, 'template_original.xlsx');
    
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, 'template_reporting_original.xlsx');
    } else if (fs.existsSync(ORIGINAL_EXCEL)) {
      // Utiliser directement le fichier original s'il existe dans Downloads
      res.download(ORIGINAL_EXCEL, 'template_reporting_original.xlsx');
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Template Excel non trouvé. Veuillez placer le fichier Excel original dans le dossier Downloads.' 
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

    // Lire le fichier Excel
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

    // Valider et traiter les données
    const validationResult = await validateAndImportExcelData(jsonData);

    // Mettre à jour le record d'import
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

    // Lire le fichier Excel
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

    // Valider et traiter les données grossiste
    const grossisteEndpoints = require('./grossiste-excel-endpoints');
    const validationResult = await grossisteEndpoints.validateAndImportGrossisteExcelData(jsonData, database);

    // Mettre à jour le record d'import
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
    
    // Récupérer les données selon les filtres
    const performances = await database.getAllPerformances(filters || {});
    
    if (!performances || performances.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à exporter' });
    }

    // Transformer les données pour le format Excel
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

    // Créer le workbook
    const workbook = xlsx.utils.book_new();
    
    // Créer la feuille principale
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Données');
    
    // Créer la feuille de synthèse
    const synthesisData = calculateSynthesis(performances);
    const synthesisSheet = xlsx.utils.json_to_sheet(synthesisData);
    xlsx.utils.book_append_sheet(workbook, synthesisSheet, 'Synthèse');
    
    // Générer le fichier
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

  // Valider chaque ligne et importer dans la base de données
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
  const rowNumber = rowIndex + 2; // +2 pour les en-têtes Excel (ligne 0 + en-tête ligne 1)

  // Vérifier l'agent
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

  // Vérifier la date
  const reportDate = row['Date rapport'] || row['Date'];
  if (!reportDate || reportDate === '' || reportDate === null) {
    errors.push({
      row: rowNumber,
      field: 'Date rapport',
      value: reportDate,
      message: 'La date du rapport est obligatoire'
    });
  } else {
    // Vérifier si la date est valide
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

  // Vérifier les formules Excel
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

  // Vérifier que la ligne n'est pas vide
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

// Endpoint pour les performances Commando
app.get('/api/commando-performances', async (req, res) => {
  try {
    const { agent_id, date_from, date_to } = req.query;
    const performances = await database.commando.getCommandoPerformances(agent_id, date_from, date_to);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    console.error('Erreur récupération performances commando:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des performances commando' });
  }
});

app.post('/api/commando-performances', async (req, res) => {
  try {
    const performance = await database.commando.createCommandoPerformance(req.body);
    res.json({ success: true, data: performance, message: 'Performance commando créée avec succès' });
  } catch (error) {
    console.error('Erreur création performance commando:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la performance commando' });
  }
});

app.put('/api/commando-performances/:id', async (req, res) => {
  try {
    const performance = await database.commando.updateCommandoPerformance(req.params.id, req.body);
    res.json({ success: true, data: performance, message: 'Performance commando mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour performance commando:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la performance commando' });
  }
});

app.delete('/api/commando-performances/:id', async (req, res) => {
  try {
    const result = await database.commando.deleteCommandoPerformance(req.params.id);
    res.json({ success: true, message: 'Performance commando supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression performance commando:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la performance commando' });
  }
});

// Endpoint pour les performances Grossiste
app.get('/api/grossiste-performances', async (req, res) => {
  try {
    const { agent_id, date_from, date_to } = req.query;
    const performances = await database.grossiste.getGrossistePerformances(agent_id, date_from, date_to);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    console.error('Erreur récupération performances grossiste:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des performances grossiste' });
  }
});

app.post('/api/grossiste-performances', async (req, res) => {
  try {
    const performance = await database.grossiste.createGrossistePerformance(req.body);
    res.json({ success: true, data: performance, message: 'Performance grossiste créée avec succès' });
  } catch (error) {
    console.error('Erreur création performance grossiste:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la performance grossiste' });
  }
});

app.put('/api/grossiste-performances/:id', async (req, res) => {
  try {
    const performance = await database.grossiste.updateGrossistePerformance(req.params.id, req.body);
    res.json({ success: true, data: performance, message: 'Performance grossiste mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour performance grossiste:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la performance grossiste' });
  }
});

app.delete('/api/grossiste-performances/:id', async (req, res) => {
  try {
    const result = await database.grossiste.deleteGrossistePerformance(req.params.id);
    res.json({ success: true, message: 'Performance grossiste supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression performance grossiste:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la performance grossiste' });
  }
});

// ==================== MODULE GROSSISTE EXCEL IMPORT/EXPORT ====================

// Charger les endpoints Excel pour grossiste
const grossisteExcelEndpoints = require('./grossiste-excel-endpoints');
grossisteExcelEndpoints.registerEndpoints(app, database, { TEMPLATE_DIR: TEMPLATE_DIR });

// ==================== NOUVEAUX ENDPOINTS ETL ET KPI ====================

// Initialiser les modules ETL et KPI
const etlTransformer = new GrossisteETLTransformer();
const kpiCalculator = new GrossisteKPICalculator();
const powerBIExporter = new PowerBIExporter();
const objectiveTracker = new ObjectiveTracker();
const batchProcessor = new BatchExcelProcessor();
const etlDataValidator = new ETLDataValidator();

// Endpoint pour la transformation ETL avancée
app.post('/api/grossiste/etl/transform', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Valider la structure du fichier
    const validation = etlTransformer.validateExcelStructure(req.file.buffer);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Structure de fichier invalide',
        details: validation.errors
      });
    }

    // Appliquer la transformation ETL
    const transformation = etlTransformer.transformExcelFile(req.file.buffer, {
      fileName: req.file.originalname
    });

    if (!transformation.success) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la transformation ETL',
        details: transformation.error
      });
    }

    res.json({
      success: true,
      data: transformation.data,
      statistics: transformation.statistics,
      metadata: transformation.metadata,
      warnings: validation.warnings
    });

  } catch (error) {
    console.error('Erreur transformation ETL:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la transformation ETL: ' + error.message
    });
  }
});

// Endpoint pour obtenir les KPIs globaux
app.get('/api/grossiste/kpi/global', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const kpis = kpiCalculator.calculateAllKPIs(performances);
    
    res.json({
      success: true,
      kpis: kpis
    });
  } catch (error) {
    console.error('Erreur calcul KPIs globaux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des KPIs globaux'
    });
  }
});

// Endpoint pour obtenir les KPIs d'un agent spécifique
app.get('/api/grossiste/kpi/agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const performances = await database.grossiste.getGrossistePerformances(agentId);
    
    if (!performances || performances.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune performance trouvée pour cet agent'
      });
    }
    
    const kpis = kpiCalculator.calculateAgentKPIs(performances);
    
    res.json({
      success: true,
      kpis: kpis
    });
  } catch (error) {
    console.error('Erreur calcul KPIs agent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des KPIs agent'
    });
  }
});

// Endpoint pour obtenir les alertes et recommandations
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
    console.error('Erreur récupération alertes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes'
    });
  }
});

// Endpoint pour l'analyse statistique avancée
app.get('/api/grossiste/analytics', async (req, res) => {
  try {
    const { period, city, product } = req.query;
    
    // Récupérer les performances avec filtres
    let performances = await database.grossiste.getGrossistePerformances();
    
    // Appliquer les filtres
    if (city) {
      performances = performances.filter(p => p.city === city);
    }
    
    if (period) {
      const [startDate, endDate] = period.split(',');
      performances = performances.filter(p => {
        const date = new Date(p.report_date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    
    // Calculer les KPIs avancés
    const kpis = kpiCalculator.calculateAllKPIs(performances);
    
    // Enrichir avec des métriques statistiques
    const analytics = {
      ...kpis,
      statisticalAnalysis: {
        performanceDistribution: _calculatePerformanceDistribution(performances),
        correlationVisitsSales: _calculateCorrelation(performances, 'personnes_approchees', 'total_sales'),
        topPerformers: _getTopPerformers(performances, 5),
        underPerformers: _getUnderPerformers(performances, 5)
      }
    };
    
    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Erreur analyse statistique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse statistique'
    });
  }
});

// Fonctions utilitaires pour l'analyse statistique
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
  // Calcul simplifié de corrélation
  const pairs = performances.map(p => ({
    x: p[field1] || 0,
    y: (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
       (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0)
  }));
  
  if (pairs.length < 2) return { correlation: 0, message: 'Pas assez de données' };
  
  const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / pairs.length;
  const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / pairs.length;
  
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (const pair of pairs) {
    const dx = pair.x - meanX;
    const dy = pair.y - meanY;
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
    if (!groups[p.agent_id]) {
      groups[p.agent_id] = {
        agentId: p.agent_id,
        agentName: p.agent_name,
        totalSales: 0,
        achievementRate: 0,
        objectives: 0
      };
    }
    const sales = (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
                  (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    groups[p.agent_id].totalSales += sales;
    groups[p.agent_id].objectives += (p.objective_carton || 0);
    return groups;
  }, {});
  
  for (const agentId in agentGroups) {
    const agent = agentGroups[agentId];
    agent.achievementRate = agent.objectives > 0 ? (agent.totalSales / agent.objectives) * 100 : 0;
  }
  
  return Object.values(agentGroups)
    .sort((a, b) => b.achievementRate - a.achievementRate)
    .slice(0, limit);
}

function _getUnderPerformers(performances, limit) {
  const agentGroups = performances.reduce((groups, p) => {
    if (!groups[p.agent_id]) {
      groups[p.agent_id] = {
        agentId: p.agent_id,
        agentName: p.agent_name,
        totalSales: 0,
        achievementRate: 0,
        objectives: 0
      };
    }
    const sales = (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
                  (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0);
    groups[p.agent_id].totalSales += sales;
    groups[p.agent_id].objectives += (p.objective_carton || 0);
    return groups;
  }, {});
  
  for (const agentId in agentGroups) {
    const agent = agentGroups[agentId];
    agent.achievementRate = agent.objectives > 0 ? (agent.totalSales / agent.objectives) * 100 : 0;
  }
  
  return Object.values(agentGroups)
    .filter(a => a.achievementRate < 100)
    .sort((a, b) => a.achievementRate - b.achievementRate)
    .slice(0, limit);
}

// Endpoint pour l'export Power BI avec transformations ETL
app.post('/api/grossiste/export/powerbi', async (req, res) => {
  try {
    const { filters } = req.body;
    
    // Récupérer les performances avec filtres
    let performances = await database.grossiste.getGrossistePerformances();
    
    // Appliquer les filtres
    if (filters) {
      if (filters.agent_id) {
        performances = performances.filter(p => p.agent_id === filters.agent_id);
      }
      if (filters.city) {
        performances = performances.filter(p => p.city === filters.city);
      }
      if (filters.date_from) {
        performances = performances.filter(p => new Date(p.report_date) >= new Date(filters.date_from));
      }
      if (filters.date_to) {
        performances = performances.filter(p => new Date(p.report_date) <= new Date(filters.date_to));
      }
    }
    
    if (!performances || performances.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à exporter'
      });
    }
    
    // Exporter avec transformations Power BI
    const exportResult = powerBIExporter.exportToPowerBIFormat(performances, {
      filters: filters || {},
      exportDate: new Date().toISOString()
    });
    
    if (!exportResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'export Power BI',
        details: exportResult.error
      });
    }
    
    res.json({
      success: true,
      filename: exportResult.filename,
      scriptPath: exportResult.scriptPath,
      dataCount: exportResult.dataCount,
      statistics: exportResult.statistics,
      message: 'Export Power BI généré avec succès',
      downloadUrl: `/api/download/powerbi/${exportResult.filename}`
    });
    
  } catch (error) {
    console.error('Erreur export Power BI:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export Power BI: ' + error.message
    });
  }
});

// Endpoint pour télécharger un fichier Power BI exporté
app.get('/api/download/powerbi/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(powerBIExporter.exportDir, filename);
    
    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur téléchargement Power BI:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

// Endpoint pour télécharger le script Power Query
app.get('/api/download/powerquery/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const scriptPath = path.join(powerBIExporter.exportDir, filename);
    
    if (fs.existsSync(scriptPath)) {
      res.download(scriptPath);
    } else {
      res.status(404).json({ error: 'Script non trouvé' });
    }
  } catch (error) {
    console.error('Erreur téléchargement script Power Query:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

// ==================== ENDPOINTS SUIVI DES OBJECTIFS ====================

// Endpoint pour l'analyse performance vs objectifs
app.get('/api/objectives/analysis', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1); // Récupérer tous les objectifs
    
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Erreur analyse objectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des objectifs'
    });
  }
});

// Endpoint pour le tableau de bord des objectifs
app.get('/api/objectives/dashboard', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1); // Récupérer tous les objectifs
    
    const dashboard = objectiveTracker.getObjectiveDashboard(performances, objectives);
    
    res.json({
      success: true,
      dashboard: dashboard
    });
  } catch (error) {
    console.error('Erreur tableau de bord objectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du tableau de bord'
    });
  }
});

// Endpoint pour les alertes objectives
app.get('/api/objectives/alerts', async (req, res) => {
  try {
    const { agent_id } = req.query;
    
    let performances = await database.grossiste.getGrossistePerformances();
    let objectives = await database.objectives.getActiveObjectivesForAgent(1); // Récupérer tous les objectifs
    
    // Filtrer par agent si spécifié
    if (agent_id) {
      performances = performances.filter(p => p.agent_id === parseInt(agent_id));
      objectives = objectives.filter(obj => obj.agent_id === parseInt(agent_id));
    }
    
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({
      success: true,
      alerts: analysis.alerts,
      alertCount: analysis.alerts.length,
      criticalAlerts: analysis.alerts.filter(a => a.type === 'critical').length,
      warningAlerts: analysis.alerts.filter(a => a.type === 'warning').length
    });
  } catch (error) {
    console.error('Erreur alertes objectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes'
    });
  }
});

// Endpoint pour les recommandations objectives
app.get('/api/objectives/recommendations', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    const objectives = await database.objectives.getActiveObjectivesForAgent(1); // Récupérer tous les objectifs
    
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({
      success: true,
      recommendations: analysis.recommendations,
      recommendationCount: analysis.recommendations.length,
      priorityBreakdown: {
        high: analysis.recommendations.filter(r => r.priority === 'high').length,
        medium: analysis.recommendations.filter(r => r.priority === 'medium').length,
        low: analysis.recommendations.filter(r => r.priority === 'low').length
      }
    });
  } catch (error) {
    console.error('Erreur recommandations objectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des recommandations'
    });
  }
});

// Endpoint pour l'analyse objectives d'un agent spécifique
app.get('/api/objectives/agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    
    const performances = await database.grossiste.getGrossistePerformances(agentId);
    const objectives = await database.objectives.getActiveObjectivesForAgent(agentId);
    
    const analysis = objectiveTracker.analyzePerformanceVsObjectives(performances, objectives);
    
    res.json({
      success: true,
      agentId: agentId,
      agentName: performances.length > 0 ? performances[0].agent_name : 'Unknown',
      analysis: analysis.byAgent[agentId] || null,
      alerts: analysis.alerts.filter(a => a.agentId === String(agentId)),
      recommendations: analysis.recommendations.filter(r => r.agentId === String(agentId))
    });
  } catch (error) {
    console.error('Erreur analyse agent objectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des objectifs de l\'agent'
    });
  }
});

// ==================== ENDPOINTS TRAITEMENT PAR LOTS ====================

// Endpoint pour traiter un dossier de fichiers Excel par lots
app.post('/api/grossiste/batch/process-folder', async (req, res) => {
  try {
    const { folderPath, options } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: 'Chemin du dossier requis'
      });
    }
    
    const result = await batchProcessor.processFolder(folderPath, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erreur traitement par lots dossier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par lots: ' + error.message
    });
  }
});

// Endpoint pour traiter plusieurs fichiers spécifiques par lots
app.post('/api/grossiste/batch/process-files', async (req, res) => {
  try {
    const { filePaths, options } = req.body;
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste des fichiers requise'
      });
    }
    
    const result = await batchProcessor.processFiles(filePaths, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erreur traitement par lots fichiers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par lots: ' + error.message
    });
  }
});

// Endpoint pour analyser les patterns dans les résultats de traitement par lots
app.post('/api/grossiste/batch/analyze-patterns', async (req, res) => {
  try {
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'Résultats de traitement requis'
      });
    }
    
    const patterns = batchProcessor.analyzePatterns(results);
    
    res.json({
      success: true,
      patterns: patterns
    });
    
  } catch (error) {
    console.error('Erreur analyse patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des patterns: ' + error.message
    });
  }
});

// Endpoint pour exporter les résultats consolidés
app.post('/api/grossiste/batch/export-consolidated', async (req, res) => {
  try {
    const { results, outputPath } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'Résultats de traitement requis'
      });
    }
    
    const defaultOutputPath = path.join(EXPORT_DIR, `batch-consolidated-${Date.now()}.xlsx`);
    const finalOutputPath = outputPath || defaultOutputPath;
    
    const exportResult = batchProcessor.exportConsolidatedResults(results, finalOutputPath);
    
    res.json(exportResult);
    
  } catch (error) {
    console.error('Erreur export consolidé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export consolidé: ' + error.message
    });
  }
});

// ==================== ENDPOINTS VALIDATION ENRICHIE ETL ====================

// Endpoint pour la validation enrichie avec règles ETL
app.post('/api/validation/etl/validate-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const validationResults = etlDataValidator.validateWithETLRules(req.file.buffer, {
      fileName: req.file.originalname
    });

    res.json(validationResults);

  } catch (error) {
    console.error('Erreur validation ETL:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation ETL: ' + error.message
    });
  }
});

// Endpoint pour la validation rapide avant import
app.post('/api/validation/quick', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const quickValidation = etlDataValidator.quickValidate(req.file.buffer);

    res.json({
      success: true,
      validation: quickValidation,
      canProceed: quickValidation.canProceed
    });

  } catch (error) {
    console.error('Erreur validation rapide:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation rapide: ' + error.message
    });
  }
});

// Endpoint pour valider les règles ETL sur les données existantes
app.get('/api/validation/etl/check-database', async (req, res) => {
  try {
    const performances = await database.grossiste.getGrossistePerformances();
    
    // Validation des données existantes
    const validationResult = {
      isValid: true,
      score: 100,
      errors: [],
      warnings: [],
      info: []
    };

    // Vérifier les agents sans objectifs
    const objectives = await database.objectives.getActiveObjectivesForAgent(1);
    const agentsWithObjectives = new Set(objectives.map(obj => obj.agent_id));
    
    for (const perf of performances) {
      if (!agentsWithObjectives.has(perf.agent_id)) {
        validationResult.warnings.push({
          field: 'objective_assignment',
          message: `Agent ${perf.agent_id} (${perf.agent_name}) sans objectif assigné`,
          severity: 'warning'
        });
      }
    }

    // Vérifier les taux de réalisation irréalistes
    for (const perf of performances) {
      const sales = (perf.real_sales_premium_16g || 0) + (perf.real_sales_premium_360g || 0) + 
                    (perf.real_sales_excellence_900g || 0) + (perf.real_sales_avoine_50g || 0) + (perf.real_sales_avoine_400g || 0);
      const objective = perf.objective_carton || 0;
      
      if (objective > 0) {
        const rate = (sales / objective) * 100;
        if (rate > 500) {
          validationResult.warnings.push({
            field: 'achievement_rate',
            message: `Taux de réalisation inhabituel: ${Math.round(rate)}% pour l'agent ${perf.agent_id}`,
            severity: 'warning'
          });
        }
      }
    }

    validationResult.score = 100 - (validationResult.warnings.length * 5);
    validationResult.score = Math.max(0, validationResult.score);

    res.json({
      success: true,
      validation: validationResult,
      databaseHealth: validationResult.score >= 80 ? 'good' : 'needs_attention'
    });

  } catch (error) {
    console.error('Erreur validation base de données:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation de la base de données'
    });
  }
});

// ============ ETL Endpoints (Import/Export PowerBI) ============

const etlMiddleware = require('./src/etl/etl-middleware');

/**
 * POST /api/etl/import/:type
 * Importer et normaliser un fichier Excel vers la base de données
 */
app.post('/api/etl/import/:type', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const { type } = req.params;
    if (!['commando', 'grossiste'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type non supporté. Utilisez "commando" ou "grossiste"'
      });
    }

    // Sauvegarder le fichier temporairement
    const tempFilePath = path.join(__dirname, 'uploads', `temp_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Importer et normaliser avec ETL
    const result = await etlMiddleware.importExcel(tempFilePath, type);

    // Supprimer le fichier temporaire
    fs.unlinkSync(tempFilePath);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Insérer les données normalisées dans la base de données
    let inserted = 0;
    let errors = [];

    for (const row of result.data) {
      try {
        if (type === 'commando') {
          await database.commando.createCommandoPerformance(row);
          inserted++;
        } else if (type === 'grossiste') {
          await database.grossiste.createGrossistePerformance(row);
          inserted++;
        }
      } catch (error) {
        errors.push({
          data: row,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Import et normalisation réussis',
      summary: {
        total: result.total,
        valid: result.valid,
        invalid: result.invalid,
        inserted,
        failed: errors.length
      },
      errors: result.errors,
      insertionErrors: errors
    });

  } catch (error) {
    console.error('Erreur ETL import:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/etl/export/:type
 * Exporter les données de la base de données vers Excel (format PowerBI)
 */
app.get('/api/etl/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['commando', 'grossiste'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type non supporté. Utilisez "commando" ou "grossiste"'
      });
    }

    const filters = {
      agentId: req.query.agentId || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null
    };

    const result = await etlMiddleware.exportToExcel(type, filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Générer le nom du fichier
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `PowerBI_Export_${type}_${timestamp}.xlsx`;
    const filePath = path.join(__dirname, 'exports', fileName);

    // Créer le dossier exports s'il n'existe pas
    if (!fs.existsSync(path.join(__dirname, 'exports'))) {
      fs.mkdirSync(path.join(__dirname, 'exports'));
    }

    // Écrire le fichier
    xlsx.writeFile(result.workbook, filePath);

    // Envoyer le fichier
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Erreur envoi fichier:', err);
      }
      // Supprimer le fichier après envoi
      fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Erreur ETL export:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/etl/validate
 * Valider un fichier Excel avant import (prévisualisation)
 */
app.post('/api/etl/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const { type } = req.body;
    if (!type || !['commando', 'grossiste'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type non supporté. Utilisez "commando" ou "grossiste"'
      });
    }

    // Sauvegarder le fichier temporairement
    const tempFilePath = path.join(__dirname, 'uploads', `temp_validate_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Valider et normaliser avec ETL
    const result = await etlMiddleware.importExcel(tempFilePath, type);

    // Supprimer le fichier temporaire
    fs.unlinkSync(tempFilePath);

    res.json(result);

  } catch (error) {
    console.error('Erreur ETL validation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
  console.log(`Base de données SQLite opérationnelle`);
  console.log(`Modules disponibles: Agents, Commando, Grossiste, Import Excel, Export Excel`);
  console.log(`Nouvelles fonctionnalités ETL: Transformation intelligente, KPIs avancés, Export Power BI, Suivi objectifs`);
  console.log(`Fonctionnalités avancées: Traitement par lots, Validation enrichie, Analyse statistique`);
  console.log(`Template Excel original: ${ORIGINAL_EXCEL}`);
});

module.exports = app;
