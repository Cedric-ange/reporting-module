// ==================== MODULE TRAITEMENT PAR LOTS DE FICHIERS EXCEL GROSSISTE ====================

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const GrossisteETLTransformer = require('./grossiste-etl-transformer');

/**
 * Processeur de traitement par lots pour fichiers Excel grossiste
 * Permet de traiter plusieurs fichiers avec transformations ETL automatiques
 */
class BatchExcelProcessor {
  
  constructor() {
    this.etlTransformer = new GrossisteETLTransformer();
    this.batchResults = [];
  }

  /**
   * Traiter un dossier de fichiers Excel par lots
   * @param {String} folderPath - Chemin du dossier contenant les fichiers Excel
   * @param {Object} options - Options de traitement
   * @returns {Object} Résultat du traitement par lots
   */
  async processFolder(folderPath, options = {}) {
    try {
      if (!fs.existsSync(folderPath)) {
        return {
          success: false,
          error: 'Dossier non trouvé',
          folderPath: folderPath
        };
      }

      const files = fs.readdirSync(folderPath);
      const excelFiles = files.filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.xls')
      );

      if (excelFiles.length === 0) {
        return {
          success: false,
          error: 'Aucun fichier Excel trouvé dans le dossier',
          folderPath: folderPath
        };
      }

      const results = [];
      const errors = [];

      for (const file of excelFiles) {
        const filePath = path.join(folderPath, file);
        
        try {
          const fileResult = await this.processFile(filePath, options);
          results.push(fileResult);
        } catch (error) {
          errors.push({
            file: file,
            error: error.message,
            success: false
          });
        }
      }

      // Générer le rapport consolidé
      const consolidatedReport = this._generateConsolidatedReport(results, errors, folderPath);

      return {
        success: true,
        folderPath: folderPath,
        totalFiles: excelFiles.length,
        processedFiles: results.length,
        errorFiles: errors.length,
        results: results,
        errors: errors,
        consolidatedReport: consolidatedReport
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        folderPath: folderPath
      };
    }
  }

  /**
   * Traiter un fichier Excel individuel
   * @param {String} filePath - Chemin du fichier Excel
   * @param {Object} options - Options de traitement
   * @returns {Object} Résultat du traitement du fichier
   */
  async processFile(filePath, options = {}) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Valider la structure du fichier
      const validation = this.etlTransformer.validateExcelStructure(fileBuffer);
      if (!validation.isValid) {
        return {
          fileName: fileName,
          filePath: filePath,
          success: false,
          error: 'Structure de fichier invalide',
          validationErrors: validation.errors,
          validationWarnings: validation.warnings
        };
      }

      // Appliquer la transformation ETL
      const transformation = this.etlTransformer.transformExcelFile(fileBuffer, {
        fileName: fileName,
        ...options
      });

      if (!transformation.success) {
        return {
          fileName: fileName,
          filePath: filePath,
          success: false,
          error: 'Erreur lors de la transformation ETL',
          details: transformation.error
        };
      }

      return {
        fileName: fileName,
        filePath: filePath,
        success: true,
        data: transformation.data,
        statistics: transformation.statistics,
        metadata: transformation.metadata,
        validation: validation
      };

    } catch (error) {
      return {
        fileName: path.basename(filePath),
        filePath: filePath,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Traiter plusieurs fichiers spécifiques
   * @param {Array} filePaths - Liste des chemins de fichiers
   * @param {Object} options - Options de traitement
   * @returns {Object} Résultat du traitement par lots
   */
  async processFiles(filePaths, options = {}) {
    try {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return {
          success: false,
          error: 'Aucun fichier fourni'
        };
      }

      const results = [];
      const errors = [];

      for (const filePath of filePaths) {
        if (!fs.existsSync(filePath)) {
          errors.push({
            file: path.basename(filePath),
            filePath: filePath,
            error: 'Fichier non trouvé'
          });
          continue;
        }

        try {
          const fileResult = await this.processFile(filePath, options);
          results.push(fileResult);
        } catch (error) {
          errors.push({
            file: path.basename(filePath),
            filePath: filePath,
            error: error.message
          });
        }
      }

      const consolidatedReport = this._generateConsolidatedReport(results, errors);

      return {
        success: true,
        totalFiles: filePaths.length,
        processedFiles: results.length,
        errorFiles: errors.length,
        results: results,
        errors: errors,
        consolidatedReport: consolidatedReport
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport consolidé du traitement par lots
   * @private
   */
  _generateConsolidatedReport(results, errors, folderPath = null) {
    const successfulResults = results.filter(r => r.success);
    
    // Agréger toutes les données transformées
    const allTransformedData = successfulResults.flatMap(r => r.data);
    
    // Statistiques consolidées
    const consolidatedStats = {
      totalRows: allTransformedData.length,
      uniqueCities: new Set(allTransformedData.map(d => d.Ville)).size,
      uniqueGrossistes: new Set(allTransformedData.map(d => d.Grossiste)).size,
      totalVisits: allTransformedData.reduce((sum, d) => sum + (d['Personne approchée'] || 0), 0),
      totalSales: allTransformedData.reduce((sum, d) => sum + (d['Réalisation carton'] || 0), 0),
      averageAchievementRate: allTransformedData.length > 0 ? 
        allTransformedData.reduce((sum, d) => sum + (d['Taux de réalisation'] || 0), 0) / allTransformedData.length : 0
    };

    // Distribution par fichier
    const fileDistribution = successfulResults.map(r => ({
      fileName: r.fileName,
      rowCount: r.data.length,
      uniqueGrossistes: new Set(r.data.map(d => d.Grossiste)).size,
      totalSales: r.data.reduce((sum, d) => sum + (d['Réalisation carton'] || 0), 0),
      averageAchievementRate: r.data.reduce((sum, d) => sum + (d['Taux de réalisation'] || 0), 0) / r.data.length
    }));

    // Distribution par ville consolidée
    const cityDistribution = {};
    for (const data of allTransformedData) {
      const city = data.Ville;
      if (!cityDistribution[city]) {
        cityDistribution[city] = {
          city: city,
          rowCount: 0,
          totalSales: 0,
          totalVisits: 0
        };
      }
      cityDistribution[city].rowCount++;
      cityDistribution[city].totalSales += data['Réalisation carton'] || 0;
      cityDistribution[city].totalVisits += data['Personne approchée'] || 0;
    }

    return {
      summary: {
        folderPath: folderPath,
        processingDate: new Date().toISOString(),
        totalFilesProcessed: results.length,
        successfulProcessing: successfulResults.length,
        failedProcessing: errors.length,
        successRate: results.length > 0 ? (successfulResults.length / results.length) * 100 : 0
      },
      consolidatedStatistics: consolidatedStats,
      fileDistribution: fileDistribution,
      cityDistribution: Object.values(cityDistribution),
      qualityMetrics: {
        averageDataQuality: successfulResults.length > 0 ? 
          successfulResults.reduce((sum, r) => sum + (r.validation?.warnings?.length || 0), 0) / successfulResults.length : 0,
        filesWithWarnings: successfulResults.filter(r => r.validation?.warnings?.length > 0).length,
        filesWithoutWarnings: successfulResults.filter(r => !r.validation?.warnings || r.validation.warnings.length === 0).length
      },
      recommendations: this._generateBatchRecommendations(successfulResults, errors)
    };
  }

  /**
   * Générer des recommandations basées sur le traitement par lots
   * @private
   */
  _generateBatchRecommendations(successfulResults, errors) {
    const recommendations = [];
    
    if (errors.length > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `${errors.length} fichier(s) n'ont pas pu être traités`,
        actions: [
          'Vérifier la structure des fichiers en erreur',
          'Consulter les logs détaillés pour chaque fichier',
          'Corriger les problèmes de format Excel'
        ]
      });
    }
    
    const filesWithWarnings = successfulResults.filter(r => r.validation?.warnings?.length > 0);
    if (filesWithWarnings.length > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: `${filesWithWarnings.length} fichier(s) présentent des avertissements`,
        actions: [
          'Revoir les données dans les fichiers avec avertissements',
          'Vérifier les valeurs manquantes ou inhabituelles',
          'Normaliser les formats de données'
        ]
      });
    }
    
    const lowPerformanceFiles = successfulResults.filter(r => 
      r.statistics?.averageAchievementRate < 75
    );
    if (lowPerformanceFiles.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${lowPerformanceFiles.length} fichier(s) montrent une performance faible`,
        actions: [
          'Analyser les causes de la faible performance',
          'Envisager un coaching ciblé',
          'Revoir les objectifs assignés'
        ]
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: 'Traitement par lots effectué avec succès',
        actions: [
          'Les données sont prêtes pour l\'analyse',
          'Procéder à l\'export Power BI si nécessaire',
          'Programmer le prochain traitement par lots'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Exporter les résultats consolidés vers Excel
   * @param {Array} results - Résultats du traitement par lots
   * @param {String} outputPath - Chemin de sortie
   * @returns {Object} Résultat de l'export
   */
  exportConsolidatedResults(results, outputPath) {
    try {
      const successfulResults = results.filter(r => r.success);
      const allTransformedData = successfulResults.flatMap(r => r.data);
      
      if (allTransformedData.length === 0) {
        return {
          success: false,
          error: 'Aucune donnée à exporter'
        };
      }
      
      const workbook = xlsx.utils.book_new();
      
      // Feuille principale avec toutes les données consolidées
      const mainSheet = xlsx.utils.json_to_sheet(allTransformedData);
      xlsx.utils.book_append_sheet(workbook, mainSheet, 'Donnees_Consolidees');
      
      // Feuille de synthèse par fichier
      const fileSummary = successfulResults.map(r => ({
        Fichier: r.fileName,
        Lignes: r.data.length,
        Ville: r.data[0]?.Ville || 'N/A',
        Date: r.data[0]?.Date || 'N/A',
        Ventes_Totales: r.data.reduce((sum, d) => sum + (d['Réalisation carton'] || 0), 0),
        Taux_Realisation_Moyen: r.data.reduce((sum, d) => sum + (d['Taux de réalisation'] || 0), 0) / r.data.length
      }));
      const summarySheet = xlsx.utils.json_to_sheet(fileSummary);
      xlsx.utils.book_append_sheet(workbook, summarySheet, 'Synthese_Fichiers');
      
      // Sauvegarder le fichier
      xlsx.writeFile(workbook, outputPath);
      
      return {
        success: true,
        outputPath: outputPath,
        totalRows: allTransformedData.length,
        filesIncluded: successfulResults.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyser les patterns dans les fichiers traités
   * @param {Array} results - Résultats du traitement par lots
   * @returns {Object} Analyse des patterns
   */
  analyzePatterns(results) {
    const successfulResults = results.filter(r => r.success);
    const allTransformedData = successfulResults.flatMap(r => r.data);
    
    // Analyser les patterns temporels
    const dateGroups = this._groupBy(allTransformedData, 'Date');
    const temporalPatterns = Object.entries(dateGroups).map(([date, data]) => ({
      date: date,
      recordCount: data.length,
      totalSales: data.reduce((sum, d) => sum + (d['Réalisation carton'] || 0), 0),
      averageAchievementRate: data.reduce((sum, d) => sum + (d['Taux de réalisation'] || 0), 0) / data.length
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Analyser les patterns géographiques
    const cityGroups = this._groupBy(allTransformedData, 'Ville');
    const geographicPatterns = Object.entries(cityGroups).map(([city, data]) => ({
      city: city,
      recordCount: data.length,
      totalSales: data.reduce((sum, d) => sum + (d['Réalisation carton'] || 0), 0),
      averageAchievementRate: data.reduce((sum, d) => sum + (d['Taux de réalisation'] || 0), 0) / data.length,
      uniqueGrossistes: new Set(data.map(d => d.Grossiste)).size
    })).sort((a, b) => b.totalSales - a.totalSales);
    
    // Analyser les patterns de produits
    const productGroups = {};
    for (const data of allTransformedData) {
      const product = `${data['Categorie produit']} ${data.Format}`;
      if (!productGroups[product]) {
        productGroups[product] = {
          product: product,
          category: data['Categorie produit'],
          format: data.Format,
          sales: 0,
          achievements: []
        };
      }
      productGroups[product].sales += data['Réalisation carton'] || 0;
      productGroups[product].achievements.push(data['Taux de réalisation'] || 0);
    }
    
    const productPatterns = Object.values(productGroups).map(p => ({
      product: p.product,
      category: p.category,
      format: p.format,
      totalSales: p.sales,
      averageAchievementRate: p.achievements.reduce((sum, a) => sum + a, 0) / p.achievements.length
    })).sort((a, b) => b.totalSales - a.totalSales);
    
    return {
      temporal: temporalPatterns,
      geographic: geographicPatterns,
      product: productPatterns,
      insights: this._generatePatternInsights(temporalPatterns, geographicPatterns, productPatterns)
    };
  }

  /**
   * Générer des insights basés sur les patterns
   * @private
   */
  _generatePatternInsights(temporal, geographic, product) {
    const insights = [];
    
    // Insights temporels
    if (temporal.length > 1) {
      const firstPeriod = temporal[0];
      const lastPeriod = temporal[temporal.length - 1];
      const growth = lastPeriod.totalSales > 0 ? 
        ((lastPeriod.totalSales - firstPeriod.totalSales) / firstPeriod.totalSales) * 100 : 0;
      
      if (growth > 10) {
        insights.push({
          type: 'positive',
          category: 'temporal',
          message: `Tendance de croissance positive de ${Math.round(growth)}% sur la période`
        });
      } else if (growth < -10) {
        insights.push({
          type: 'negative',
          category: 'temporal',
          message: `Tendance de décroissance de ${Math.round(Math.abs(growth))}% sur la période`
        });
      }
    }
    
    // Insights géographiques
    if (geographic.length > 0) {
      const topCity = geographic[0];
      const bottomCity = geographic[geographic.length - 1];
      const ratio = topCity.totalSales / (bottomCity.totalSales || 1);
      
      insights.push({
        type: 'information',
        category: 'geographic',
        message: `La ville ${topCity.city} réalise ${Math.round(ratio)}x plus de ventes que ${bottomCity.city}`
      });
    }
    
    // Insights produits
    if (product.length > 0) {
      const topProduct = product[0];
      const bottomProduct = product[product.length - 1];
      
      insights.push({
        type: 'information',
        category: 'product',
        message: `Le produit ${topProduct.product} est le meilleur vendeur avec ${Math.round(topProduct.totalSales)} unités`
      });
    }
    
    return insights;
  }

  /**
   * Grouper les données par une clé
   * @private
   */
  _groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }
}

module.exports = BatchExcelProcessor;