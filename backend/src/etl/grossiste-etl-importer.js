const transformer = require('./grossiste-etl-transformer');
const database = require('../database/database-functions');

class GrossisteETLImporter {
  
  /**
   * Traite le fichier brut et l'insère dans PostgreSQL
   * @param {Buffer} buffer - Le fichier Excel
   * @param {Object} options - Contient l'agentId envoyé par l'interface web
   */
  async processAndImport(buffer, options = {}) {
    try {
      // 1. Vérification de l'agent
      const agentId = options.agentId;
      if (!agentId) {
        return { success: false, error: "Un agent doit être sélectionné pour importer ce fichier." };
      }

      // 2. Transformation des données (le Python en JS)
      const transformedData = transformer.transform(buffer, { agentId });

      if (transformedData.length === 0) {
        return { success: false, error: "Aucune donnée valide trouvée dans le fichier Excel." };
      }

      // 3. Insertion dans Supabase (PostgreSQL)
      let importedCount = 0;
      let errors = [];

      for (const perf of transformedData) {
        try {
          // Appel à notre nouvelle fonction asynchrone connectée à Supabase
          await database.grossiste.createGrossistePerformance(perf);
          importedCount++;
        } catch (dbError) {
          console.error("Erreur d'insertion ligne:", dbError);
          errors.push(`Erreur sur ${perf.grossiste_name} le ${perf.report_date} : ${dbError.message}`);
        }
      }

      // 4. Bilan de l'import
      return {
        success: importedCount > 0,
        message: `${importedCount} performances importées avec succès.`,
        importedCount: importedCount,
        errors: errors.length > 0 ? errors : null
      };

    } catch (error) {
      console.error('ETL Import Error:', error);
      return {
        success: false,
        error: `Erreur fatale lors de l'importation: ${error.message}`
      };
    }
  }
}

module.exports = new GrossisteETLImporter();