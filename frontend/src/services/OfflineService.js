class OfflineService {
  // Clé de stockage localStorage
  private static readonly REPORTS_KEY = 'reporting_reports';
  private static readonly LAST_SYNC_KEY = 'reporting_last_sync';
  private static readonly SETTINGS_KEY = 'reporting_settings';

  // Sauvegarder les rapports
  static saveReports(reports) {
    try {
      localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde rapports:', error);
      return false;
    }
  }

  // Récupérer les rapports
  static getReports() {
    try {
      const reports = localStorage.getItem(this.REPORTS_KEY);
      return reports ? JSON.parse(reports) : [];
    } catch (error) {
      console.error('Erreur récupération rapports:', error);
      return [];
    }
  }

  // Supprimer tous les rapports
  static clearReports() {
    try {
      localStorage.removeItem(this.REPORTS_KEY);
      return true;
    } catch (error) {
      console.error('Erreur suppression rapports:', error);
      return false;
    }
  }

  // Sauvegarder la date de dernière synchronisation
  static setLastSync(date) {
    try {
      localStorage.setItem(this.LAST_SYNC_KEY, date);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde last sync:', error);
      return false;
    }
  }

  // Récupérer la date de dernière synchronisation
  static getLastSync() {
    try {
      return localStorage.getItem(this.LAST_SYNC_KEY);
    } catch (error) {
      console.error('Erreur récupération last sync:', error);
      return null;
    }
  }

  // Sauvegarder les paramètres
  static saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde settings:', error);
      return false;
    }
  }

  // Récupérer les paramètres
  static getSettings() {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Erreur récupération settings:', error);
      return {};
    }
  }

  // Vérifier si le navigateur supporte localStorage
  static isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obtenir l'espace de stockage utilisé
  static getStorageUsage() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return {
        used: total,
        usedKB: (total / 1024).toFixed(2),
        usedMB: (total / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Erreur calcul stockage:', error);
      return { used: 0, usedKB: '0', usedMB: '0' };
    }
  }

  // Nettoyer les anciennes données (plus de 30 jours)
  static cleanupOldData() {
    try {
      const reports = this.getReports();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate > thirtyDaysAgo;
      });

      if (filteredReports.length !== reports.length) {
        this.saveReports(filteredReports);
        return reports.length - filteredReports.length;
      }

      return 0;
    } catch (error) {
      console.error('Erreur nettoyage données:', error);
      return 0;
    }
  }
}

export default OfflineService;
