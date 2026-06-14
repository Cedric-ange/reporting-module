const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join('..', 'DATA BIBLOS');

// Fonction pour analyser un fichier Excel avec plus de détails
function analyzeExcelFileDetailed(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir la plage de la feuille
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    console.log(`Plage de la feuille: ${range.s.r}-${range.e.r} lignes, ${range.s.c}-${range.e.c} colonnes`);
    
    // Lire les données brutes de la feuille
    const rawData = [];
    for (let row = range.s.r; row <= Math.min(range.e.r, 10); row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      rawData.push(rowData);
    }
    
    // Essayer de trouver les en-têtes en cherchant une ligne avec du texte
    let headerRow = -1;
    for (let row = 0; row < Math.min(rawData.length, 5); row++) {
      const nonNullCount = rawData[row].filter(cell => cell !== null && cell !== '').length;
      if (nonNullCount > 3) {
        headerRow = row;
        break;
      }
    }
    
    console.log(`Ligne d'en-têtes détectée: ${headerRow}`);
    
    // Si on a trouvé des en-têtes
    let headers = [];
    let dataStartRow = 0;
    
    if (headerRow >= 0) {
      headers = rawData[headerRow].map((cell, index) => cell || `Colonne_${index}`);
      dataStartRow = headerRow + 1;
    }
    
    // Obtenir les données avec les en-têtes corrects
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
    
    return {
      file: path.basename(filePath),
      sheet: sheetName,
      totalRows: jsonData.length,
      headerRow: headerRow,
      headers: headers,
      rawData: rawData.slice(0, 5),
      sampleData: jsonData.slice(0, 3),
      range: worksheet['!ref']
    };
    
  } catch (error) {
    return {
      file: path.basename(filePath),
      error: error.message
    };
  }
}

// Analyser un fichier de chaque type
const commandoFile = path.join(dataDir, 'SAN PEDRO - REPORTING COMMANDO DE REFE. DETAILLANTS LAIT & FLOC. AVOINE (1).xlsx');
const grossisteFile = path.join(dataDir, 'REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx');

console.log('=== ANALYSE DÉTAILLÉE DES FICHIERS EXCEL ===\n');

console.log('\n📄 FICHIER COMMANDO:');
const commandoAnalysis = analyzeExcelFileDetailed(commandoFile);
console.log(JSON.stringify(commandoAnalysis, null, 2));

console.log('\n\n📄 FICHIER GROSSISTE:');
const grossisteAnalysis = analyzeExcelFileDetailed(grossisteFile);
console.log(JSON.stringify(grossisteAnalysis, null, 2));

// Sauvegarder l'analyse
const analysis = {
  commando: commandoAnalysis,
  grossiste: grossisteAnalysis
};

const outputPath = path.join(__dirname, 'excel-detailed-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
console.log(`\n💾 Analyse sauvegardée dans: ${outputPath}`);
