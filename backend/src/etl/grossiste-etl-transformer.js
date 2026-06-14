// ==================== MODULE ETL GROSSISTE - TRANSFORMATION INTELLIGENTE ====================

const xlsx = require('xlsx');

/**
 * Transformateur ETL pour fichiers Excel Grossiste
 * Reproduit la logique de transformation Python analysée dans le dossier ETL GROSSISTE
 */
class GrossisteETLTransformer {
  
  constructor() {
    // Configuration des produits basée sur l'analyse Python
    this.products = [
      { name: "16G", category: "Lait", offset: 0 },
      { name: "360G", category: "Lait", offset: 1 },
      { name: "900G", category: "Lait", offset: 2 },
      { name: "25KG Excell", category: "Lait", offset: 3 },
      { name: "25KG Super", category: "Lait", offset: 4 },
      { name: "50G", category: "Flocon d'avoine", offset: 5 },
      { name: "400G", category: "Flocon d'avoine", offset: 6 }
    ];

    // Configuration des blocs de dates (basée sur l'analyse)
    this.dateBlocks = [
      { date: "2026-01-24", startCol: 2 },
      { date: "2026-01-26", startCol: 29 },
      { date: "2026-01-27", startCol: 56 },
      { date: "2026-01-28", startCol: 83 },
      { date: "2026-01-29", startCol: 110 },
      { date: "2026-01-30", startCol: 137 },
      { date: "2026-01-31", startCol: 164 }
    ];
  }

  /**
   * Point d'entrée principal pour la transformation ETL
   * @param {Buffer} fileBuffer - Buffer du fichier Excel
   * @param {Object} options - Options de transformation
   * @returns {Object} Résultat de la transformation
   */
  transformExcelFile(fileBuffer, options = {}) {
    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Lire les données brutes
      const rawData = this._readRawData(worksheet);
      
      // Appliquer la transformation ETL
      const transformedData = this._applyETLTransformation(rawData, options);
      
      // Générer les statistiques
      const statistics = this._generateStatistics(transformedData);
      
      return {
        success: true,
        data: transformedData,
        statistics: statistics,
        metadata: {
          sourceFile: options.fileName || 'unknown.xlsx',
          transformationDate: new Date().toISOString(),
          totalRows: transformedData.length,
          dateRange: this._getDateRange(transformedData)
        }
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
   * Lire les données brutes du fichier Excel
   * @private
   */
  _readRawData(worksheet) {
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    const data = [];
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : null);
      }
      data.push(rowData);
    }
    
    return data;
  }

  /**
   * Appliquer la transformation ETL principale
   * @private
   */
  _applyETLTransformation(rawData, options) {
    const resultData = [];
    
    // Lignes de données (8-12 dans l'analyse Python)
    const dataStartRow = 8;
    const dataEndRow = 12;
    
    for (let rowIdx = dataStartRow; rowIdx <= dataEndRow; rowIdx++) {
      if (rowIdx >= rawData.length) break;
      
      const ville = rawData[rowIdx][0];
      const grossiste = rawData[rowIdx][1];
      
      // Skip les lignes TOTAL ou vides
      if (!ville || ville === "TOTAL" || ville === null) continue;
      
      // Tracker pour les affiches par date (correction duplication)
      const affichePerDate = {};
      
      // Traiter chaque bloc de date
      for (const dateBlock of this.dateBlocks) {
        const dateObj = new Date(dateBlock.date);
        const startCol = dateBlock.startCol;
        
        // Obtenir les visites (colonne +7)
        const visitsCol = startCol + 7;
        const visits = this._getSafeValue(rawData, rowIdx, visitsCol, 0);
        
        // Obtenir la valeur affiche (colonne +19)
        const afficheCol = startCol + 19;
        const afficheValue = this._getSafeValue(rawData, rowIdx, afficheCol, 0);
        affichePerDate[dateObj.toISOString()] = afficheValue;
        
        // Traiter chaque produit pour cette date
        for (let i = 0; i < this.products.length; i++) {
          const product = this.products[i];
          
          // Colonne objectif
          const objCol = startCol + product.offset;
          const objective = this._getSafeValue(rawData, rowIdx, objCol, 0);
          
          // Colonne réalisation (+9 de l'objectif)
          const realCol = startCol + 9 + product.offset;
          const realization = this._getSafeValue(rawData, rowIdx, realCol, 0);
          
          // Calculer le taux de réalisation
          const achievementRate = this._calculateAchievementRate(objective, realization);
          
          // Gratuité avec gestion des virgules (correction ETL)
          const freebies = this._extractGratuiteWithCommaCorrection(rawData, rowIdx, startCol, i);
          
          // Affiche : seulement pour le premier produit de chaque date (correction duplication)
          const affiche = (i === 0) ? afficheValue : 0;
          
          // Créer la ligne transformée
          const transformedRow = {
            Date: dateObj,
            Ville: ville,
            Grossiste: grossiste,
            "Categorie produit": product.category,
            Format: product.name,
            "Objectif carton": objective,
            "Réalisation carton": realization,
            "Taux de réalisation": achievementRate,
            Gratuité: freebies,
            Affiche: affiche,
            "Personne approchée": parseInt(visits) || 0
          };
          
          resultData.push(transformedRow);
        }
      }
    }
    
    return resultData;
  }

  /**
   * Obtenir une valeur sécurisée depuis les données brutes
   * @private
   */
  _getSafeValue(rawData, row, col, defaultValue) {
    if (row >= rawData.length) return defaultValue;
    if (col >= rawData[row].length) return defaultValue;
    
    const value = rawData[row][col];
    if (value === null || value === undefined) return defaultValue;
    
    return value;
  }

  /**
   * Calculer le taux de réalisation avec logique ETL
   * @private
   */
  _calculateAchievementRate(objective, realization) {
    if (!objective || objective === 0) return 0;
    
    const rate = (realization / objective) * 100;
    
    // Arrondir à 2 décimales
    return Math.round(rate * 100) / 100;
  }

  /**
   * Extraire la gratuité avec correction des virgules (logique ETL Python)
   * @private
   */
  _extractGratuiteWithCommaCorrection(rawData, rowIdx, startCol, productIndex) {
    let freeCol;
    let freebies = 0;
    
    // Structure spécifique pour le premier bloc de dates
    if (startCol === 2) {
      // Mapping basé sur l'analyse Python
      if (productIndex === 0) freeCol = 18;      // 16G
      else if (productIndex === 2) freeCol = 19; // 900G
      else if (productIndex === 5) freeCol = 20; // 50G
      else freeCol = null;
    } else {
      // Pour les autres blocs de dates
      freeCol = startCol + 18 + productIndex;
    }
    
    if (freeCol !== null) {
      const rawValue = this._getSafeValue(rawData, rowIdx, freeCol, 0);
      freebies = this._parseValueWithCommaCorrection(rawValue);
    }
    
    return freebies;
  }

  /**
   * Parser une valeur avec correction des virgules
   * @private
   */
  _parseValueWithCommaCorrection(value) {
    if (value === null || value === undefined) return 0;
    
    let strValue = String(value);
    
    // Si la valeur contient une virgule, extraire la partie numérique avant
    if (strValue.includes(',')) {
      strValue = strValue.split(',')[0];
    }
    
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Générer les statistiques de la transformation
   * @private
   */
  _generateStatistics(transformedData) {
    if (!transformedData || transformedData.length === 0) {
      return { totalRows: 0 };
    }
    
    const stats = {
      totalRows: transformedData.length,
      uniqueCities: new Set(transformedData.map(d => d.Ville)).size,
      uniqueGrossistes: new Set(transformedData.map(d => d.Grossiste)).size,
      categories: [...new Set(transformedData.map(d => d["Categorie produit"]))],
      formats: [...new Set(transformedData.map(d => d.Format))],
      totalVisits: transformedData.reduce((sum, d) => sum + (d["Personne approchée"] || 0), 0),
      totalSales: transformedData.reduce((sum, d) => sum + (d["Réalisation carton"] || 0), 0),
      averageAchievementRate: this._calculateAverage(transformedData.map(d => d["Taux de réalisation"])),
      nonZeroAffiches: transformedData.filter(d => d.Affiche > 0).length,
      nonZeroGratuites: transformedData.filter(d => d.Grautéité > 0).length
    };
    
    return stats;
  }

  /**
   * Calculer une moyenne
   * @private
   */
  _calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  /**
   * Obtenir la plage de dates des données transformées
   * @private
   */
  _getDateRange(transformedData) {
    if (!transformedData || transformedData.length === 0) {
      return { min: null, max: null };
    }
    
    const dates = transformedData.map(d => new Date(d.Date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }

  /**
   * Valider la structure du fichier Excel avant transformation
   */
  validateExcelStructure(fileBuffer) {
    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = this._readRawData(worksheet);
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };
      
      // Vérifier le nombre minimum de lignes
      if (rawData.length < 13) {
        validation.errors.push("Le fichier doit contenir au moins 13 lignes");
        validation.isValid = false;
      }
      
      // Vérifier la présence des colonnes attendues
      if (rawData.length > 0 && rawData[0].length < 50) {
        validation.warnings.push("Le fichier semble avoir moins de colonnes que prévu");
      }
      
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Erreur de validation: ${error.message}`],
        warnings: []
      };
    }
  }
}

module.exports = GrossisteETLTransformer;