import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Container, Alert 
} from '@mui/material'; // <-- 'Lands' a été retiré proprement ici
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon, 
  Assessment as AssessmentIcon, Storefront as StoreIcon, Campaign as CampaignIcon,
  CloudUpload as CloudUploadIcon, FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

// Importation des composants modules
import Dashboard from './Dashboard';
import GrossisteModule from './modules/GrossisteModule';
import CommandoModule from './modules/CommandoModule';

const drawerWidth = 240;

function NavigationContent() {
  const location = useLocation();
  const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Gestion Agents', icon: <PeopleIcon />, path: '/agents' },
    { text: 'Reporting Commando', icon: <AssessmentIcon />, path: '/commando' },
    { text: 'Activation Grossiste', icon: <StoreIcon />, path: '/grossiste' },
    { text: 'Promo Pâque', icon: <CampaignIcon />, path: '/promo-paque' },
    { text: 'Import Excel', icon: <CloudUploadIcon />, path: '/import' },
    { text: 'Export Excel', icon: <FileDownloadIcon />, path: '/export' }
  ];

  return (
    <List>
      {menuItems.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
            <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({ agents: 0, commando: 0, grossiste: 0, promoPaque: 0 });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [agentsRes, commandoRes, grossisteRes] = await Promise.all([
          axios.get('/api/agents').catch(() => ({ data: [] })),
          axios.get('/api/commando-performances').catch(() => ({ data: { data: [] } })),
          axios.get('/api/grossiste-performances').catch(() => ({ data: [] }))
        ]);

        let cmdLength = 0;
        if (commandoRes && commandoRes.data) {
          if (Array.isArray(commandoRes.data)) cmdLength = commandoRes.data.length;
          else if (Array.isArray(commandoRes.data.data)) cmdLength = commandoRes.data.data.length;
        }

        let grossisteLength = Array.isArray(grossisteRes.data) ? grossisteRes.data.length : 0;

        setDashboardStats({
          agents: Array.isArray(agentsRes.data) ? agentsRes.data.length : 0,
          commando: cmdLength,
          grossiste: grossisteLength,
          promoPaque: 0
        });
      } catch (err) {
        console.error('Erreur initialisation stats BI:', err);
        setError('Impossible de synchroniser le monitoring centralisé.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: '#1976d2', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
          <Typography variant="h6" noWrap component="div" fontWeight="bold">Biblos Track Pro — BI Monitor</Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}><Toolbar /><Divider /><NavigationContent /></Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open><Toolbar /><Divider /><NavigationContent /></Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
        {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard stats={dashboardStats} />} />
            <Route path="/grossiste" element={<GrossisteModule />} />
            <Route path="/commando" element={<CommandoModule />} />
            <Route path="*" element={<Box p={3}><Typography variant="body1" color="textSecondary">Ce module ou cette vue est en cours de traitement infrastructurel.</Typography></Box>} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default App;