import axios from 'axios';

// Détection automatique de l'environnement (Local vs Vercel)
// CORRECTION ICI : On utilise le nom API_BASE_URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '/api' 
  : '/api';

class DataService {
  // Exporter les données en Excel
  static async exportToExcel(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/export/excel`, { data });
      return response.data;
    } catch (error) {
      console.error('Erreur export Excel:', error);
      throw error;
    }
  }

  // Importer un fichier Excel
  static async importFromExcel(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/import/excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur import Excel:', error);
      throw error;
    }
  }

  // Importer des données JSON
  static async importFromJSON(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/import/excel`, { data });
      return response.data;
    } catch (error) {
      console.error('Erreur import JSON:', error);
      throw error;
    }
  }

  // Synchroniser les données avec le serveur
  static async syncData(localData, lastSync) {
    try {
      const response = await axios.post(`${API_BASE_URL}/sync`, {
        localData,
        lastSync
      });
      return response.data;
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      throw error;
    }
  }

  // Vérifier la santé du serveur
  static async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erreur health check:', error);
      return null;
    }
  }

  // Télécharger un fichier exporté
  static downloadFile(filename) {
    window.open(`${API_BASE_URL}/download/${filename}`, '_blank');
  }
}

export default DataService;