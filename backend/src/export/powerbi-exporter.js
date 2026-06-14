// ==================== MODULE EXPORT POWER BI AVEC TRANSFORMATIONS ETL ====================

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Exportateur Power BI avec transformations ETL intégrées
 * Basé sur les scripts Power Query générés dans l'analyse ETL Python
 */
class PowerBIExporter {
  
  constructor() {
    this.exportDir = path.join(__dirname, '../../exports/powerbi');
    this.ensureExportDirectory();
  }

  ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Exporter les données avec transformations ETL pour Power BI
   * @param {Array} data - Données brutes de la base de données
   * @param {Object} options - Options d'export
   * @returns {Object} Résultat de l'export
   */
  exportToPowerBIFormat(data, options = {}) {
    try {
      // Appliquer les transformations ETL
      const transformedData = this._applyPowerBITransformations(data, options);
      
      // Créer le workbook Excel avec structure optimisée Power BI
      const workbook = this._createPowerBIWorkbook(transformedData, options);
      
      // Générer le nom de fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `powerbi-export-${timestamp}.xlsx`;
      const filepath = path.join(this.exportDir, filename);
      
      // Sauvegarder le fichier
      xlsx.writeFile(workbook, filepath);
      
      // Générer le script Power Query
      const powerQueryScript = this._generatePowerQueryScript(transformedData, options);
      const scriptPath = path.join(this.exportDir, `powerbi-script-${timestamp}.txt`);
      fs.writeFileSync(scriptPath, powerQueryScript);
      
      return {
        success: true,
        filename: filename,
        filepath: filepath,
        scriptPath: scriptPath,
        dataCount: transformedData.length,
        statistics: this._generateExportStatistics(transformedData),
        powerBIReady: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * Appliquer les transformations ETL spécifiques Power BI
   * @private
   */
  _applyPowerBITransformations(data, options) {
    const transformedData = [];
    
    for (const item of data) {
      // Transformation unpivot (format long pour Power BI)
      const products = [
        { category: 'Lait', format: 'Premium 16g', sales: item.real_sales_premium_16g || 0, objective: item.objective_carton || 0 },
        { category: 'Lait', format: 'Premium 360g', sales: item.real_sales_premium_360g || 0, objective: item.objective_carton || 0 },
        { category: 'Lait', format: 'Excellence 900g', sales: item.real_sales_excellence_900g || 0, objective: item.objective_carton || 0 },
        { category: "Flocon d'avoine", format: '50g', sales: item.real_sales_avoine_50g || 0, objective: item.objective_carton || 0 },
        { category: "Flocon d'avoine", format: '400g', sales: item.real_sales_avoine_400g || 0, objective: item.objective_carton || 0 }
      ];
      
      for (const product of products) {
        if (product.sales > 0 || product.objective > 0) {
          const achievementRate = product.objective > 0 ? (product.sales / product.objective) * 100 : 0;
          
          transformedData.push({
            // Métadonnées Power BI
            Date_Rapport: item.report_date,
            Annee: new Date(item.report_date).getFullYear(),
            Mois: new Date(item.report_date).getMonth() + 1,
            Trimestre: Math.floor(new Date(item.report_date).getMonth() / 3) + 1,
            Semaine: this._getWeekNumber(new Date(item.report_date)),
            
            // Dimensions
            Ville: item.city,
            Region: this._deriveRegion(item.city),
            Agent_ID: item.agent_id,
            Agent_Nom: item.agent_name,
            Grossiste_Nom: item.grossiste_name,
            
            // Dimensions produit
            Categorie_Produit: product.category,
            Format_Produit: product.format,
            SKU: `${product.category}_${product.format}`.replace(/\s+/g, '_'),
            
            // Mesures
            Ventes_Carton: product.sales,
            Objectif_Carton: product.objective,
            Taux_Realisation_Pourcent: Math.round(achievementRate * 100) / 100,
            
            // KPIs additionnels
            Visites: item.personnes_approchees || 0,
            Affiches_Posees: item.affiche || 0,
            Gratuits_Offerts: item.gratuit_chapelet_sachet || 0,
            
            // Indicateurs de performance
            Performance_Level: this._categorizePerformance(achievementRate),
            Target_Achieved: achievementRate >= 100,
            Above_Target: achievementRate >= 150
          });
        }
      }
    }
    
    return transformedData;
  }

  /**
   * Créer un workbook Excel optimisé pour Power BI
   * @private
   */
  _createPowerBIWorkbook(transformedData, options) {
    const workbook = xlsx.utils.book_new();
    
    // Feuille principale de données (format unpivoté)
    const mainSheet = xlsx.utils.json_to_sheet(transformedData);
    xlsx.utils.book_append_sheet(workbook, mainSheet, 'Donnees_Principales');
    
    // Feuille de référence des villes
    const citiesSheet = this._createCitiesReferenceSheet(transformedData);
    xlsx.utils.book_append_sheet(workbook, citiesSheet, 'Ref_Villes');
    
    // Feuille de référence des produits
    const productsSheet = this._createProductsReferenceSheet(transformedData);
    xlsx.utils.book_append_sheet(workbook, productsSheet, 'Ref_Produits');
    
    // Feuille de référence des agents
    const agentsSheet = this._createAgentsReferenceSheet(transformedData);
    xlsx.utils.book_append_sheet(workbook, agentsSheet, 'Ref_Agents');
    
    // Feuille de calendrier
    const calendarSheet = this._createCalendarSheet(transformedData);
    xlsx.utils.book_append_sheet(workbook, calendarSheet, 'Calendrier');
    
    // Feuille de métadonnées
    const metadataSheet = this._createMetadataSheet(transformedData, options);
    xlsx.utils.book_append_sheet(workbook, metadataSheet, 'Metadonnees');
    
    return workbook;
  }

  /**
   * Créer la feuille de référence des villes
   * @private
   */
  _createCitiesReferenceSheet(data) {
    const cities = [...new Set(data.map(d => d.Ville))];
    const cityData = cities.map(city => ({
      Ville: city,
      Region: this._deriveRegion(city),
      Zone: this._deriveZone(city),
      Active: true
    }));
    
    return xlsx.utils.json_to_sheet(cityData);
  }

  /**
   * Créer la feuille de référence des produits
   * @private
   */
  _createProductsReferenceSheet(data) {
    const products = [...new Set(data.map(d => d.SKU))];
    const productData = products.map(sku => {
      const item = data.find(d => d.SKU === sku);
      return {
        SKU: sku,
        Categorie: item?.Categorie_Produit || '',
        Format: item?.Format_Produit || '',
        Type: item?.Categorie_Produit === 'Lait' ? 'Produit Laitier' : 'Produit Céréales',
        Active: true
      };
    });
    
    return xlsx.utils.json_to_sheet(productData);
  }

  /**
   * Créer la feuille de référence des agents
   * @private
   */
  _createAgentsReferenceSheet(data) {
    const agents = [...new Set(data.map(d => d.Agent_ID))];
    const agentData = agents.map(agentId => {
      const item = data.find(d => d.Agent_ID === agentId);
      return {
        Agent_ID: agentId,
        Agent_Nom: item?.Agent_Nom || '',
        Ville: item?.Ville || '',
        Region: item?.Region || '',
        Active: true
      };
    });
    
    return xlsx.utils.json_to_sheet(agentData);
  }

  /**
   * Créer la feuille de calendrier
   * @private
   */
  _createCalendarSheet(data) {
    const dates = [...new Set(data.map(d => d.Date_Rapport))];
    const calendarData = dates.map(dateStr => {
      const date = new Date(dateStr);
      return {
        Date: dateStr,
        Annee: date.getFullYear(),
        Mois: date.getMonth() + 1,
        Nom_Mois: this._getMonthName(date.getMonth()),
        Trimestre: Math.floor(date.getMonth() / 3) + 1,
        Semaine: this._getWeekNumber(date),
        Jour_Semaine: date.getDay(),
        Nom_Jour: this._getDayName(date.getDay()),
        Est_Weekend: date.getDay() === 0 || date.getDay() === 6
      };
    }).sort((a, b) => new Date(a.Date) - new Date(b.Date));
    
    return xlsx.utils.json_to_sheet(calendarData);
  }

  /**
   * Créer la feuille de métadonnées
   * @private
   */
  _createMetadataSheet(data, options) {
    const metadata = {
      Export_Date: new Date().toISOString(),
      Data_Period_Start: data.length > 0 ? data[0].Date_Rapport : '',
      Data_Period_End: data.length > 0 ? data[data.length - 1].Date_Rapport : '',
      Total_Rows: data.length,
      Unique_Cities: new Set(data.map(d => d.Ville)).size,
      Unique_Agents: new Set(data.map(d => d.Agent_ID)).size,
      Unique_Products: new Set(data.map(d => d.SKU)).size,
      Data_Source: 'SQLite Database via ETL Transformation',
      PowerBI_Optimized: true,
      Format: 'Unpivoted (Long Format)',
      Transformation_Types: [
        'Unpivot Products',
        'Date Decomposition',
        'Performance Categorization',
        'Region Derivation',
        'Calendar Generation'
      ]
    };
    
    const metadataArray = Object.entries(metadata).map(([key, value]) => ({
      Propriete: key,
      Valeur: Array.isArray(value) ? value.join(', ') : String(value)
    }));
    
    return xlsx.utils.json_to_sheet(metadataArray);
  }

  /**
   * Générer le script Power Query pour Power BI
   * @private
   */
  _generatePowerQueryScript(data, options) {
    const script = `// Script Power Query généré automatiquement pour l'export ETL
// Basé sur les transformations analysées dans le dossier ETL GROSSISTE

let
    // === ÉTAPE 1: CHARGEMENT DES DONNÉES ===
    Source = Excel.Workbook(File.Contents("${path.join(this.exportDir, 'powerbi-export-latest.xlsx')}"), null, true),
    Donnees_Principales_Sheet = Source{[Item="Donnees_Principales",Kind="Sheet"]}[Data],
    
    // === ÉTAPE 2: TYPES DE DONNÉES ===
    ChangedType = Table.TransformTypes(
        Donnees_Principales_Sheet,
        type table [
            Date_Rapport = date,
            Annee = Int32.Type,
            Mois = Int32.Type,
            Trimestre = Int32.Type,
            Semaine = Int32.Type,
            Ville = text,
            Region = text,
            Agent_ID = Int32.Type,
            Agent_Nom = text,
            Grossiste_Nom = text,
            Categorie_Produit = text,
            Format_Produit = text,
            SKU = text,
            Ventes_Carton = number,
            Objectif_Carton = number,
            Taux_Realisation_Pourcent = number,
            Visites = Int32.Type,
            Affiches_Posees = Int32.Type,
            Gratuits_Offerts = number,
            Performance_Level = text,
            Target_Achieved = logical,
            Above_Target = logical
        ]
    ),
    
    // === ÉTAPE 3: FILTRAGE ET NETTOYAGE ===
    FilteredRows = Table.SelectRows(ChangedType, each [Ventes_Carton] <> null or [Objectif_Carton] <> null),
    RemovedDuplicates = Table.Distinct(FilteredRows),
    
    // === ÉTAPE 4: CRÉATION DE RELATIONS ===
    // Relation avec Calendrier
    MergedWithCalendar = Table.NestedJoin(
        RemovedDuplicates,
        {"Date_Rapport"},
        Calendrier,
        {"Date"},
        "CalendarData",
        JoinKind.LeftOuter
    ),
    
    // === ÉTAPE 5: CALCULS AVANCÉS ===
    AddedCalculations = Table.AddColumn(
        MergedWithCalendar,
        "Ventes_Mensuelles",
        each List.Sum(Table.SelectRows(RemovedDuplicates, (OT) => 
            OT[Date_Rapport] >= Date.StartOfMonth([Date_Rapport]) and 
            OT[Date_Rapport] <= Date.EndOfMonth([Date_Rapport])
        )[Ventes_Carton])
    ),
    
    // === ÉTAPE 6: TRI ET ORGANISATION ===
    SortedRows = Table.Sort(AddedCalculations, {{"Date_Rapport", Order.Descending}}),
    
    // === RÉSULTAT FINAL ===
    FinalData = SortedRows
in
    FinalData

// === TABLES DE RÉFÉRENCE ===

// Table Calendrier
Calendrier =
let
    Source = Excel.Workbook(File.Contents("${path.join(this.exportDir, 'powerbi-export-latest.xlsx')}"), null, true),
    Calendrier_Sheet = Source{[Item="Calendrier",Kind="Sheet"]}[Data],
    ChangedType = Table.TransformTypes(Calendrier_Sheet, type table [
        Date = date,
        Annee = Int32.Type,
        Mois = Int32.Type,
        Trimestre = Int32.Type,
        Semaine = Int32.Type
    ])
in
    ChangedType

// Table Villes
Ref_Villes =
let
    Source = Excel.Workbook(File.Contents("${path.join(this.exportDir, 'powerbi-export-latest.xlsx')}"), null, true),
    Villes_Sheet = Source{[Item="Ref_Villes",Kind="Sheet"]}[Data]
in
    Villes_Sheet

// Table Produits  
Ref_Produits =
let
    Source = Excel.Workbook(File.Contents("${path.join(this.exportDir, 'powerbi-export-latest.xlsx')}"), null, true),
    Produits_Sheet = Source{[Item="Ref_Produits",Kind="Sheet"]}[Data]
in
    Produits_Sheet

// Table Agents
Ref_Agents =
let
    Source = Excel.Workbook(File.Contents("${path.join(this.exportDir, 'powerbi-export-latest.xlsx')}"), null, true),
    Agents_Sheet = Source{[Item="Ref_Agents",Kind="Sheet"}][Data]
in
    Agents_Sheet

// === MESURES DAX SUGGÉRÉES ===
/*
// Copier ces mesures dans Power BI Desktop:

Total Ventes = SUM('Donnees_Principales'[Ventes_Carton])
Total Objectifs = SUM('Donnees_Principales'[Objectif_Carton])
Taux Réalisation Global = DIVIDE([Total Ventes], [Total Objectifs]) * 100
Total Visites = SUM('Donnees_Principales'[Visites])

// Ventes par période
Ventes MTD = CALCULATE([Total Ventes], DATESMTD('Calendrier'[Date]))
Ventes YTD = CALCULATE([Total Ventes], DATESYTD('Calendrier'[Date]))

// Performance par agent
Performance Agent = DIVIDE(
    SUM('Donnees_Principales'[Ventes_Carton]),
    SUM('Donnees_Principales'[Objectif_Carton])
) * 100

// Tendance
Tendance Ventes = 
VAR CurrentPeriod = [Total Ventes]
VAR PreviousPeriod = CALCULATE([Total Ventes], DATEADD('Calendrier'[Date], -1, MONTH))
RETURN
    DIVIDE(CurrentPeriod - PreviousPeriod, PreviousPeriod) * 100
*/`;
    
    return script;
  }

  /**
   * Fonctions utilitaires pour les transformations
   * @private
   */
  
  _getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }

  _deriveRegion(city) {
    const regions = {
      'ABIDJAN': 'District Autonome',
      'SAN PEDRO': 'Bas-Sassandra',
      'BONDOUKOU': 'Comoé',
      'KORHOGO': 'Savanes',
      'BOUAKE': 'Vallée du Bandama',
      'GAGNOA': 'Gôh-Djiboua',
      'MAN': 'Tonkpi',
      'DALOA': 'Sassandra-Marahoué',
      'YAMOUSSOUKRO': 'Lacs'
    };
    return regions[city?.toUpperCase()] || 'Autre';
  }

  _deriveZone(city) {
    const zones = {
      'ABIDJAN': 'Zone Urbaine',
      'SAN PEDRO': 'Zone Portuaire',
      'BONDOUKOU': 'Zone Frontalière',
      'KORHOGO': 'Zone Nord'
    };
    return zones[city?.toUpperCase()] || 'Zone Standard';
  }

  _categorizePerformance(rate) {
    if (rate >= 150) return 'Excellent';
    if (rate >= 100) return 'Atteint';
    if (rate >= 75) return 'Satisfaisant';
    if (rate >= 50) return 'Faible';
    return 'Critique';
  }

  _getMonthName(monthIndex) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthIndex];
  }

  _getDayName(dayIndex) {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[dayIndex];
  }

  _generateExportStatistics(data) {
    return {
      totalRows: data.length,
      dateRange: {
        min: data.length > 0 ? data[0].Date_Rapport : null,
        max: data.length > 0 ? data[data.length - 1].Date_Rapport : null
      },
      uniqueCities: new Set(data.map(d => d.Ville)).size,
      uniqueAgents: new Set(data.map(d => d.Agent_ID)).size,
      uniqueProducts: new Set(data.map(d => d.SKU)).size,
      totalSales: data.reduce((sum, d) => sum + d.Ventes_Carton, 0),
      averageAchievementRate: data.length > 0 ? 
        data.reduce((sum, d) => sum + d.Taux_Realisation_Pourcent, 0) / data.length : 0
    };
  }
}

module.exports = PowerBIExporter;