import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  People,
  Assessment,
  CloudUpload,
  TrendingUp
} from '@mui/icons-material';
import BiblosLogo from './components/BiblosLogo';

function Dashboard({ stats }) {
  const recentActivities = [
    { id: 1, type: 'Système', description: 'Base de données opérationnelle', date: 'Maintenant' },
    { id: 2, type: 'Backend', description: 'API fonctionnelle sur port 5000', date: 'Maintenant' },
    { id: 3, type: 'Modules', description: '4 modules actifs', date: 'Maintenant' },
  ];

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BiblosLogo size={36} showText={true} />
      </Box>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, color: '#757575' }}>
        Tableau de bord de reporting commercial
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: 6
              },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" component="div" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, fontWeight: 500 }}>
                    Total Agents
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                    {stats.agents || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <People sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: 6
              },
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" component="div" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, fontWeight: 500 }}>
                    Performances Commando
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                    {stats.commando || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Assessment sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: 6
              },
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" component="div" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, fontWeight: 500 }}>
                    Performances Grossiste
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                    {stats.grossiste || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CloudUpload sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: 6
              },
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" component="div" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, fontWeight: 500 }}>
                    Total Performances
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                    {(stats.commando || 0) + (stats.grossiste || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              boxShadow: 3,
              background: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
              Activités Récentes
            </Typography>
            <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow 
                      key={activity.id}
                      sx={{ 
                        '&:hover': { bgcolor: '#f5f5f5' },
                        transition: 'bgcolor 0.2s'
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>{activity.type}</TableCell>
                      <TableCell sx={{ color: '#616161' }}>{activity.description}</TableCell>
                      <TableCell sx={{ color: '#757575', fontSize: '0.875rem' }}>{activity.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              boxShadow: 3,
              background: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
              Statut du Système
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: '#4caf50' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.75rem', mb: 0.5 }}>
                    Base de données
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    Opérationnelle
                  </Typography>
                  <LinearProgress variant="determinate" value={100} sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#e8f5e9', '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#4caf50' } }} />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: '#2196f3' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.75rem', mb: 0.5 }}>
                    Backend
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1565c0' }}>
                    Prêt
                  </Typography>
                  <LinearProgress variant="determinate" value={100} sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#2196f3' } }} />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: '#ff9800' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.75rem', mb: 0.5 }}>
                    Modules
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#ef6c00' }}>
                    4 actifs
                  </Typography>
                  <LinearProgress variant="determinate" value={100} sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#fff3e0', '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#ff9800' } }} />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: '#9c27b0' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.75rem', mb: 0.5 }}>
                    Frontend
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
                    React
                  </Typography>
                  <LinearProgress variant="determinate" value={100} sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#f3e5f5', '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: '#9c27b0' } }} />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;