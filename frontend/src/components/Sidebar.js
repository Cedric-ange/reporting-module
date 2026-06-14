import React, { useState, useEffect } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

export default function Sidebar({ stats, open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Tableau de Bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Gestion Agents', icon: <PeopleIcon />, path: '/agents' },
    { text: 'Performances', icon: <AssessmentIcon />, path: '/performances' },
    { text: 'Import Excel', icon: <CloudUploadIcon />, path: '/import' },
    { text: 'Export Excel', icon: <CloudDownloadIcon />, path: '/export' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1976d2',
          color: 'white',
          zIndex: 1200
        },
      }}
      open
    >
      <Box sx={{ overflow: 'hidden' }}>
        <Toolbar sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          py: 2,
          bgcolor: 'rgba(255,255,255,0.1)'
        }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
            Reporting Commercial
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip 
              label={`${stats.agents || 0} Agents`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            />
            <Chip 
              label={`${stats.performances || 0} Perf.`} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            />
          </Box>
        </Toolbar>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <List sx={{ py: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1,
                mx: 2,
                borderRadius: 2,
                py: 2,
                px: 3,
                bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)'
                },
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                },
                '& .MuiListItemText-root': {
                  color: 'white'
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Base de données: Opérationnelle
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 1 }}>
            Template: Original intact
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}