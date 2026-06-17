// Service pour les nouvelles fonctionnalités ETL et KPIs
import axios from 'axios';

const API_BASE_URL = '/api';

export const ETLService = {
  // Transformation ETL avancée
  async transformExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/grossiste/etl/transform`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  // Validation enrichie
  async validateFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/validation/etl/validate-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  async quickValidate(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/validation/quick`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  async checkDatabaseValidation() {
    const response = await axios.get(`${API_BASE_URL}/validation/etl/check-database`);
    return response.data;
  }
};

export const KPIService = {
  // KPIs globaux
  async getGlobalKPIs() {
    const response = await axios.get(`${API_BASE_URL}/grossiste/kpi/global`);
    return response.data;
  },

  // KPIs par agent
  async getAgentKPIs(agentId) {
    const response = await axios.get(`${API_BASE_URL}/grossiste/kpi/agent/${agentId}`);
    return response.data;
  },

  // Alertes
  async getAlerts() {
    const response = await axios.get(`${API_BASE_URL}/grossiste/alerts`);
    return response.data;
  },

  // Analyse statistique avancée
  async getAnalytics(filters = {}) {
    const response = await axios.get(`${API_BASE_URL}/grossiste/analytics`, { params: filters });
    return response.data;
  }
};

export const ObjectiveService = {
  // Analyse performance vs objectifs
  async getObjectivesAnalysis() {
    const response = await axios.get(`${API_BASE_URL}/objectives/analysis`);
    return response.data;
  },

  // Tableau de bord objectifs
  async getObjectivesDashboard() {
    const response = await axios.get(`${API_BASE_URL}/objectives/dashboard`);
    return response.data;
  },

  // Alertes objectives
  async getObjectivesAlerts(agentId = null) {
    const params = agentId ? { agent_id: agentId } : {};
    const response = await axios.get(`${API_BASE_URL}/objectives/alerts`, { params });
    return response.data;
  },

  // Recommandations
  async getRecommendations() {
    const response = await axios.get(`${API_BASE_URL}/objectives/recommendations`);
    return response.data;
  },

  // Analyse par agent
  async getAgentObjectiveAnalysis(agentId) {
    const response = await axios.get(`${API_BASE_URL}/objectives/agent/${agentId}`);
    return response.data;
  }
};

export const BatchProcessingService = {
  // Traitement d'un dossier
  async processFolder(folderPath, options = {}) {
    const response = await axios.post(`${API_BASE_URL}/grossiste/batch/process-folder`, {
      folderPath,
      options
    });
    return response.data;
  },

  // Traitement de fichiers spécifiques
  async processFiles(filePaths, options = {}) {
    const response = await axios.post(`${API_BASE_URL}/grossiste/batch/process-files`, {
      filePaths,
      options
    });
    return response.data;
  },

  // Analyse des patterns
  async analyzePatterns(results) {
    const response = await axios.post(`${API_BASE_URL}/grossiste/batch/analyze-patterns`, {
      results
    });
    return response.data;
  },

  // Export consolidé
  async exportConsolidatedResults(results, outputPath = null) {
    const response = await axios.post(`${API_BASE_URL}/grossiste/batch/export-consolidated`, {
      results,
      outputPath
    });
    return response.data;
  }
};

export const PowerBIService = {
  // Export Power BI
  async exportToPowerBI(filters = {}) {
    const response = await axios.post(`${API_BASE_URL}/grossiste/export/powerbi`, {
      filters
    });
    return response.data;
  },

  // Télécharger fichier Power BI
  async downloadPowerBIFile(filename) {
    const response = await axios.get(`${API_BASE_URL}/download/powerbi/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Télécharger script Power Query
  async downloadPowerQueryScript(filename) {
    const response = await axios.get(`${API_BASE_URL}/download/powerquery/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};