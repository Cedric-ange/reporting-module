// Configuration du branding Biblos Track
export const branding = {
  name: 'Biblos Track',
  slogan: 'Reporting Commercial Intelligent',
  
  // Couleurs principales
  colors: {
    primary: '#1976d2',      // Bleu Material Design
    secondary: '#4caf50',    // Vert Material Design
    accent: '#ff9800',       // Orange Material Design
    error: '#f44336',        // Rouge Material Design
    success: '#4caf50',      // Vert Material Design
    warning: '#ff9800',      // Orange Material Design
    info: '#2196f3',         // Bleu Material Design
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #1976d2 0%, #4caf50 100%)',
    dark: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
    light: 'linear-gradient(135deg, #42a5f5 0%, #66bb6a 100%)',
    accent: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
  },
  
  // Icônes
  icon: 'TrendingUp',
  iconColor: '#1976d2',
  
  // Thème
  theme: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4caf50',
      light: '#66bb6a',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
  },
  
  // Typography
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    heading: {
      fontWeight: 600,
    },
  },
  
  // Layout
  drawerWidth: 280,
  appBarHeight: 64,
  
  // URLs
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    health: '/api/health',
    agents: '/api/agents',
    commando: '/api/commando-performances',
    grossiste: '/api/grossiste-performances',
    objectives: '/api/objectives',
    etlImport: '/api/etl/import',
    etlExport: '/api/etl/export',
    etlValidate: '/api/etl/validate',
  },
  
  // Features
  features: {
    etl: true,
    powerbi: true,
    offline: false,
    analytics: true,
    objectives: true,
  },
};

export default branding;