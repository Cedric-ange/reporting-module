const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join('..', 'DATA BIBLOS');

// Fonction pour analyser un fichier Excel
function analyzeExcelFile(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtenir les en-têtes
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
    
    if (jsonData.length > 0) {
      const headers = Object.keys(jsonData[0]);
      const firstRow = jsonData[0];
      
      return {
        file: path.basename(filePath),
        sheet: sheetName,
        totalRows: jsonData.length,
        headers: headers,
        sampleRow: firstRow,
        allData: jsonData.slice(0, 5) // Premier 5 lignes comme exemple
      };
    }
    
    return {
      file: path.basename(filePath),
      error: 'Fichier vide ou invalide'
    };
  } catch (error) {
    return {
      file: path.basename(filePath),
      error: error.message
    };
  }
}

// Analyser tous les fichiers Excel
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.xlsx'));

console.log('=== ANALYSE DES FICHIERS EXCEL ===\n');

const analyses = files.map(file => {
  const filePath = path.join(dataDir, file);
  return analyzeExcelFile(filePath);
});

// Afficher les résultats
analyses.forEach(analysis => {
  console.log(`\n📄 Fichier: ${analysis.file}`);
  
  if (analysis.error) {
    console.log(`❌ Erreur: ${analysis.error}`);
  } else {
    console.log(`📊 Feuille: ${analysis.sheet}`);
    console.log(`📈 Total lignes: ${analysis.totalRows}`);
    console.log(`🏷️  Colonnes (${analysis.headers.length}):`);
    analysis.headers.forEach((header, index) => {
      console.log(`   ${index + 1}. ${header}`);
    });
    console.log(`\n📋 Exemple de ligne:`);
    console.log(JSON.stringify(analysis.sampleRow, null, 2));
  }
  
  console.log('\n' + '='.repeat(80));
});

// Sauvegarder l'analyse dans un fichier JSON
const outputPath = path.join(__dirname, 'excel-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(analyses, null, 2));
console.log(`\n💾 Analyse sauvegardée dans: ${outputPath}`);
