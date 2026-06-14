// ==================== MODULE GROSSISTE : IMPORT/EXPORT EXCEL ====================

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Fonction pour enregistrer les endpoints
function registerGrossisteEndpoints(app, database, config) {
  const TEMPLATE_DIR = config.TEMPLATE_DIR;
  
  // ==================== TÉLÉCHARGEMENT TEMPLATE GROSSISTE ====================
  
  app.get('/api/template/download/grossiste', (req, res) => {
    try {
      const templatePath = path.join(TEMPLATE_DIR, 'template_grossiste.xlsx');
      
      // Chercher d'abord dans le dossier DATA BIBLOS
      const dataBiblosTemplate = path.join('C:', 'Users', 'angec', 'Downloads', 'REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx');
      
      if (fs.existsSync(templatePath)) {
        res.download(templatePath, 'template_grossiste.xlsx');
      } else if (fs.existsSync(dataBiblosTemplate)) {
        // Utiliser directement le fichier original s'il existe
        res.download(dataBiblosTemplate, 'template_grossiste.xlsx');
        
        // Copier pour futur usage
        try {
          if (!fs.existsSync(TEMPLATE_DIR)) {
            fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
          }
          fs.copyFileSync(dataBiblosTemplate, templatePath);
          console.log('Template grossiste Excel original copié avec succès');
        } catch (error) {
          console.error('Erreur lors de la copie du template grossiste:', error);
        }
      } else {
        res.status(404).json({ 
          success: false, 
          error: 'Template Excel grossiste non trouvé. Veuillez placer un fichier "REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx" dans le dossier Downloads.' 
        });
      }
    } catch (error) {
      console.error('Erreur téléchargement template grossiste:', error);
      res.status(500).json({ success: false, error: 'Erreur lors du téléchargement du template grossiste' });
    }
  });
}

// ==================== FONCTIONS DE VALIDATION ET TRAITEMENT ====================

async function validateAndImportGrossisteExcelData(data, database) {
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
    const validation = await validateGrossisteRowForImport(row, rowIndex, database);

    if (validation.errors.length > 0) {
      results.invalidRows++;
      results.errors.push(...validation.errors);
    } else {
      results.validRows++;
      const importedRow = await importGrossisteRowToDatabase(row, database);
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

async function validateGrossisteRowForImport(row, rowIndex, database) {
  const errors = [];
  const warnings = [];
  const rowNumber = rowIndex + 2;

  const agentNumber = String(row['N°'] || row['N'] || row['Agent'] || row['Agent Number']);
  if (!agentNumber || agentNumber === '' || agentNumber === 'null') {
    errors.push({
      row: rowNumber,
      field: 'Agent/N°',
      value: agentNumber,
      message: 'Le numéro d\'agent est obligatoire'
    });
  } else {
    const agent = await database.agents.getAgentByNumber(agentNumber);
    if (!agent) {
      errors.push({
        row: rowNumber,
        field: 'Agent/N°',
        value: agentNumber,
        message: `L'agent avec le numéro ${agentNumber} n'existe pas dans la base de données. Veuillez d'abord créer cet agent.`
      });
    }
  }

  const grossisteName = row['Grossiste'] || row['Grossiste Name'];
  if (!grossisteName || grossisteName === '' || grossisteName === null) {
    errors.push({
      row: rowNumber,
      field: 'Grossiste',
      value: grossisteName,
      message: 'Le nom du grossiste est obligatoire'
    });
  }

  const reportDate = row['Date'] || row['Date rapport'];
  if (!reportDate || reportDate === '' || reportDate === null) {
    errors.push({
      row: rowNumber,
      field: 'Date',
      value: reportDate,
      message: 'La date du rapport est obligatoire'
    });
  } else {
    const dateObj = new Date(reportDate);
    if (isNaN(dateObj.getTime())) {
      errors.push({
        row: rowNumber,
        field: 'Date',
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
        message: `Formule Excel détectée dans "${key}". Les formules ne sont pas autorisées.`
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

async function importGrossisteRowToDatabase(row, database) {
  try {
    const agentNumber = String(row['N°'] || row['N'] || row['Agent'] || row['Agent Number']);
    const agent = await database.agents.getAgentByNumber(agentNumber);
    if (!agent) return null;

    const reportDate = row['Date'] || row['Date rapport'];
    const grossisteName = row['Grossiste'] || row['Grossiste Name'] || '';
    const city = row['Ville'] || row['City'] || '';
    
    const performanceData = {
      agent_id: agent.id,
      report_date: reportDate,
      city: city,
      grossiste_name: grossisteName,
      product_1_sales: Number(row['Biblos Lait Premium 16g'] || row['Product 1']) || 0,
      product_2_sales: Number(row['Biblos Lait Premium 360g'] || row['Product 2']) || 0,
      product_3_sales: Number(row['Biblos Lait Excellence 900g'] || row['Product 3']) || 0,
      product_4_sales: Number(row['Biblos Lait 25KG Excell'] || row['Product 4']) || 0,
      product_5_sales: Number(row['Biblos Lait 25KG Super'] || row['Product 5']) || 0,
      product_6_sales: Number(row['Biblos Flocon d\'avoine 50g'] || row['Product 6']) || 0,
      product_7_sales: Number(row['Biblos Flocon d\'avoine 400g'] || row['Product 7']) || 0,
      product_8_sales: 0,
      product_9_sales: 0,
      product_10_sales: 0,
      total_sales: Number(row['Total Ventes'] || row['Total']) || 0,
      comments: row['Commentaires'] || row['Comments'] || ''
    };

    return await database.grossiste.createGrossistePerformance(performanceData);
  } catch (error) {
    console.error('Erreur import grossiste row:', error);
    return null;
  }
}

// Exporter en tant qu'objet
module.exports = {
  registerEndpoints: registerGrossisteEndpoints,
  validateAndImportGrossisteExcelData: validateAndImportGrossisteExcelData
};
