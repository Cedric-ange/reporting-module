const xlsx = require('xlsx');
const database = require('../database/database-functions');

/**
 * Module ETL pour la normalisation des données Excel → Base de données
 * et l'export Base de données → Excel (format PowerBI)
 */

class ETLMiddleware {
  constructor() {
    this.mappings = {
      commando: {
        'N°': 'agent_number',
        'Date rapport': 'report_date',
        'VILLE': 'city',
        'BOUTIQUE': 'visits_boutique',
        'SUPERETTE': 'visits_superette',
        'KIOSQUE': 'visits_kiosque',
        'TABLIER': 'visits_tablier',
        'PUSH CART': 'visits_pushcart',
        'Ventes Biblos Premium 16g': 'sales_premium_16g',
        'Ventes Biblos Premium 360g': 'sales_premium_360g',
        'Ventes Excellence 900g': 'sales_excellence_900g',
        'Ventes Flocons Avoine 50g': 'sales_avoine_50g',
        'Ventes Flocons Avoine 400g': 'sales_avoine_400g',
        'Commentaires': 'comments',
        'Impressions': 'impressions'
      },
      grossiste: {
        'N°': 'agent_number',
        'Date rapport': 'report_date',
        'VILLE': 'city',
        'GROSSISTE': 'grossiste_name',
        'personnes approchées': 'personnes_approchees',
        'Client acheteur': 'client_acheteur',
        'Réalisation (carton)': 'realisation_carton',
        'Gratuit (chapelet & sachet)': 'gratuit_chapelet_sachet',
        'Taux de réalisation': 'taux_realisation',
        'Objectif de vente (carton)': 'objectif_vente_carton',
        'Commentaires': 'comments'
      }
    };
  }

  /**
   * Normaliser une ligne de données Excel selon le type
   */
  normalizeRow(row, type) {
    const mapping = this.mappings[type];
    if (!mapping) {
      throw new Error(`Type ${type} non supporté pour la normalisation`);
    }

    const normalized = {};
    const errors = [];

    Object.entries(mapping).forEach(([excelKey, dbKey]) => {
      const value = row[excelKey] !== undefined ? row[excelKey] : null;
      
      if (value !== null && value !== '') {
        // Normalisation des valeurs numériques
        if (['visits_boutique', 'visits_superette', 'visits_kiosque', 'visits_tablier', 'visits_pushcart',
             'sales_premium_16g', 'sales_premium_360g', 'sales_excellence_900g', 'sales_avoine_50g', 'sales_avoine_400g',
             'personnes_approchees', 'realisation_carton', 'gratuit_chapelet_sachet', 'objectif_vente_carton'].includes(dbKey)) {
          normalized[dbKey] = this.parseNumber(value);
        } else if (dbKey === 'taux_realisation') {
          normalized[dbKey] = this.parsePercentage(value);
        } else if (dbKey === 'report_date') {
          normalized[dbKey] = this.parseDate(value);
        } else {
          normalized[dbKey] = String(value).trim();
        }
      }
    });

    return { normalized, errors };
  }

  /**
   * Parser un nombre
   */
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Parser un pourcentage
   */
  parsePercentage(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[%]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num / 100;
    }
    return 0;
  }

  /**
   * Parser une date Excel
   */
  parseDate(value) {
    if (typeof value === 'number') {
      // Date Excel sérielle
      const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
      return excelDate.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return value; // Garder la valeur originale si elle est déjà au bon format
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Importer et normaliser un fichier Excel
   */
  async importExcel(filePath, type) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
      
      // Normaliser chaque ligne
      const normalizedData = [];
      const errors = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Vérifier si la ligne contient des données
        const hasData = Object.values(row).some(v => v !== null && v !== '');
        if (!hasData) continue;
        
        try {
          const { normalized, rowErrors } = this.normalizeRow(row, type);
          
          // Récupérer l'agent_id depuis le numéro d'agent
          if (normalized.agent_number) {
            const agent = await database.agents.getAgentByNumber(String(normalized.agent_number));
            if (agent) {
              normalized.agent_id = agent.id;
              delete normalized.agent_number;
              normalizedData.push(normalized);
            } else {
              errors.push({
                row: i + 1,
                error: `Agent avec numéro ${normalized.agent_number} non trouvé`,
                data: normalized
              });
            }
          }
          
          if (rowErrors.length > 0) {
            errors.push({ row: i + 1, errors: rowErrors });
          }
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error.message,
            data: row
          });
        }
      }
      
      return {
        success: true,
        data: normalizedData,
        errors,
        total: rawData.length,
        valid: normalizedData.length,
        invalid: errors.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Exporter les données de la base de données vers Excel (format PowerBI)
   */
  async exportToExcel(type, filters = {}) {
    try {
      let data = [];
      
      if (type === 'commando') {
        data = await database.commando.getCommandoPerformances(
          filters.agentId,
          filters.dateFrom,
          filters.dateTo
        );
      } else if (type === 'grossiste') {
        data = await database.grossiste.getGrossistePerformances(
          filters.agentId,
          filters.dateFrom,
          filters.dateTo
        );
      } else {
        throw new Error(`Type ${type} non supporté pour l'export`);
      }
      
      // Transformer les données pour PowerBI (format plat, normalisé)
      const powerbiData = data.map(row => {
        const powerbiRow = {
          // Dimensions (clés)
          'Agent_ID': row.agent_id,
          'Agent_Number': row.agent_number || '',
          'Agent_Name': row.agent_name || '',
          'Report_Date': row.report_date,
          'City': row.city || '',
          
          // Mesures (valeurs)
        };
        
        if (type === 'commando') {
          powerbiRow['Metric_Type'] = 'Visits';
          powerbiRow['Metric_Category'] = 'Boutique';
          powerbiRow['Metric_Value'] = row.visits_boutique || 0;
          powerbiRow['Comments'] = row.comments || '';
        } else if (type === 'grossiste') {
          powerbiRow['Grossiste_Name'] = row.grossiste_name || '';
          powerbiRow['Personnes_Approchees'] = row.personnes_approchees || 0;
          powerbiRow['Client_Acheteur'] = row.client_acheteur || '';
          powerbiRow['Realisation_Carton'] = row.realisation_carton || 0;
          powerbiRow['Gratuit_Chapelet_Sachet'] = row.gratuit_chapelet_sachet || 0;
          powerbiRow['Taux_Realisation'] = row.taux_realisation || 0;
          powerbiRow['Objectif_Vente_Carton'] = row.objectif_vente_carton || 0;
        }
        
        return powerbiRow;
      });
      
      // Créer le fichier Excel
      const worksheet = xlsx.utils.json_to_sheet(powerbiData);
      
      // Largeur des colonnes auto
      const columnWidths = Object.keys(powerbiData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = columnWidths;
      
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'PowerBI_Export');
      
      return {
        success: true,
        workbook,
        count: powerbiData.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ETLMiddleware();