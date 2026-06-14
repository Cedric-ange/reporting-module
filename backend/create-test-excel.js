const xlsx = require('xlsx');
const fs = require('fs');

// Créer des données de test au format Excel attendu par ETL
const testData = [
  {
    'N°': '001',
    'Date rapport': '2026-06-14',
    'VILLE': 'Abidjan',
    'GROSSISTE': 'Grossiste Test ETL',
    'personnes approchées': 50,
    'Client acheteur': 'Client Test A',
    'Réalisation (carton)': 25,
    'Gratuit (chapelet & sachet)': 10,
    'Taux de réalisation': 0.75,
    'Objectif de vente (carton)': 30,
    'Commentaires': 'Test import ETL depuis Excel'
  },
  {
    'N°': '001',
    'Date rapport': '2026-06-15',
    'VILLE': 'Abidjan',
    'GROSSISTE': 'Grossiste Test ETL 2',
    'personnes approchées': 75,
    'Client acheteur': 'Client Test B',
    'Réalisation (carton)': 40,
    'Gratuit (chapelet & sachet)': 15,
    'Taux de réalisation': 0.8,
    'Objectif de vente (carton)': 50,
    'Commentaires': 'Deuxième test import ETL'
  }
];

// Créer le fichier Excel
const worksheet = xlsx.utils.json_to_sheet(testData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Grossiste');

// Ajuster la largeur des colonnes
worksheet['!cols'] = [
  { wch: 10 },  // N°
  { wch: 15 },  // Date rapport
  { wch: 15 },  // VILLE
  { wch: 20 },  // GROSSISTE
  { wch: 20 },  // personnes approchées
  { wch: 15 },  // Client acheteur
  { wch: 18 },  // Réalisation (carton)
  { wch: 22 },  // Gratuit (chapelet & sachet)
  { wch: 18 },  // Taux de réalisation
  { wch: 22 },  // Objectif de vente (carton)
  { wch: 30 }   // Commentaires
];

// Sauvegarder le fichier
const filePath = 'D:\\reporting-module\\test_etl_import.xlsx';
xlsx.writeFile(workbook, filePath);

console.log('Fichier Excel de test créé:', filePath);
console.log('Données de test prêtes pour import ETL');