import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import AgentsModule from './modules/AgentsModule';
import CommandoModule from './modules/CommandoModule';
import GrossisteModule from './modules/GrossisteModule';
import PromoPaqueModule from './modules/PromoPaqueModule';
import ImportModule from './modules/ImportModule';
import ExportModule from './modules/ExportModule';
import Dashboard from './Dashboard';
import BiblosLogo from './components/BiblosLogo';
import axios from 'axios';

// Détection automatique de l'environnement (Local vs Vercel)
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http:///api' 
  : '/api';

const drawerWidth = 280;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState({ agents: 0, commando: 0, grossiste: 0, promoPaque: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    fetchStats();
    
    // Naviguer vers le dashboard au démarrage
    if (location.pathname === '/') {
      navigate('/dashboard');
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [location.pathname, navigate]);

  const fetchStats = async () => {
    try {
      // CORRECTION ICI : Utilisation de l'URL dynamique
      const response = await axios.get(`${API_BASE_URL}/health`);
      setStats(response.data.statistics);
    } catch (error) {
      console.log('Backend non disponible, utilisation du mode hors ligne');
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Gestion Agents', icon: <PeopleIcon />, path: '/agents' },
    { text: 'Reporting Commando', icon: <AssessmentIcon />, path: '/commando' },
    { text: 'Activation Grossiste', icon: <AssessmentIcon />, path: '/grossiste' },
    { text: 'Promo Pâque', icon: <AssessmentIcon />, path: '/promo-paque' },
    { text: 'Import Excel', icon: <CloudUploadIcon />, path: '/import' },
    { text: 'Export Excel', icon: <CloudDownloadIcon />, path: '/export' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        px: 2, 
        bgcolor: 'linear-gradient(135deg, #1976d2 0%, #4caf50 100%)', 
        color: 'white',
        height: 64,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BiblosLogo size={28} showText={false} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Biblos Track
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Chip 
            label={`${stats.agents || 0} Agents`} 
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              color: 'white',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          />
          <Chip 
            label={`${(stats.commando || 0) + (stats.grossiste || 0) + (stats.promoPaque || 0)} Perf.`} 
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              color: 'white',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          />
        </Box>
      </Toolbar>
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateX(4px)'
              },
              '&.Mui-selected': {
                bgcolor: 'linear-gradient(90deg, rgba(25, 118, 210, 0.15) 0%, rgba(25, 118, 210, 0.05) 100%)',
                borderLeft: '4px solid #1976d2',
                '&:hover': {
                  bgcolor: 'linear-gradient(90deg, rgba(25, 118, 210, 0.2) 0%, rgba(25, 118, 210, 0.1) 100%)',
                  transform: 'translateX(4px)'
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? '#1976d2' : '#616161',
              minWidth: 40
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  color: location.pathname === item.path ? '#1a237e' : '#424242'
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'linear-gradient(90deg, #1976d2 0%, #4caf50 100%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1200
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <BiblosLogo size={32} showText={true} variant="light" />
          </Box>
          <Chip 
            label={isOnline ? "En ligne" : "Hors ligne"}
            color={isOnline ? "success" : "error"}
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: isOnline ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
              color: isOnline ? '#2e7d32' : '#c62828',
              fontWeight: 500,
              bgcolor: 'white'
            }}
          />
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '80px',
          bgcolor: '#f5f5f5',
          ml: { md: `${drawerWidth}px` }
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard stats={stats} />} />
          <Route path="/agents" element={<AgentsModule />} />
          <Route path="/commando" element={<CommandoModule />} />
          <Route path="/grossiste" element={<GrossisteModule />} />
          <Route path="/promo-paque" element={<PromoPaqueModule />} />
          <Route path="/import" element={<ImportModule />} />
          <Route path="/export" element={<ExportModule />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;