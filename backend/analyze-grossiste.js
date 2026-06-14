const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const grossisteFile = path.join(__dirname, '../DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx');

console.log('=== ANALYSE PRÉCISE DU FICHIER GROSSISTE ===\n');

try {
  const workbook = xlsx.readFile(grossisteFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('Feuille:', sheetName);
  
  // Lire les 5 premières lignes avec les en-têtes
  const range = xlsx.utils.decode_range(worksheet['!ref']);
  console.log('Plage:', worksheet['!ref']);
  
  // Extraire les données brutes
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
  
  console.log('\n=== 5 PREMIÈRES LIGNES DU FICHIER ===');
  rawData.forEach((row, idx) => {
    console.log(`\nLigne ${idx}:`);
    console.log(row.map((cell, i) => `Col ${i}: ${cell}`).join(' | '));
  });
  
  // Essayer sheet_to_json avec header: 1 pour ignorer la première ligne
  console.log('\n=== DONNÉES AVEC EN-TÊTES (header: 1) ===');
  const jsonData1 = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  console.log('Nombre de lignes:', jsonData1.length);
  if (jsonData1.length > 0) {
    console.log('Première ligne de données:', JSON.stringify(jsonData1[0], null, 2));
  }
  
  // Essayer sheet_to_json avec header: 2
  console.log('\n=== DONNÉES AVEC EN-TÊTES (header: 2) ===');
  const jsonData2 = xlsx.utils.sheet_to_json(worksheet, { header: 2, defval: null });
  console.log('Nombre de lignes:', jsonData2.length);
  if (jsonData2.length > 0) {
    console.log('Première ligne de données:', JSON.stringify(jsonData2[0], null, 2));
    console.log('Clés:', Object.keys(jsonData2[0]));
  }
  
  // Essayer sheet_to_json avec header: 3
  console.log('\n=== DONNÉES AVEC EN-TÊTES (header: 3) ===');
  const jsonData3 = xlsx.utils.sheet_to_json(worksheet, { header: 3, defval: null });
  console.log('Nombre de lignes:', jsonData3.length);
  if (jsonData3.length > 0) {
    console.log('Première ligne de données:', JSON.stringify(jsonData3[0], null, 2));
    console.log('Clés:', Object.keys(jsonData3[0]));
  }
  
  // Sauvegarder les résultats
  const analysis = {
    fileName: path.basename(grossisteFile),
    sheetName,
    rawDataFirst5Lines: rawData,
    jsonDataHeader1: jsonData1,
    jsonDataHeader2: jsonData2,
    jsonDataHeader3: jsonData3
  };
  
  const outputPath = path.join(__dirname, 'grossiste-detailed-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n💾 Analyse sauvegardée dans: ${outputPath}`);
  
} catch (error) {
  console.error('Erreur:', error.message);
}