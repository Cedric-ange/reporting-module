import React, { useState, useEffect } from 'react';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import BiblosLogo from './components/BiblosLogo';
import axios from 'axios';

const PIE_COLORS = ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a'];
const PRODUCT_COLORS = ['#1976d2', '#9c27b0', '#ff9800', '#4caf50', '#f44336'];

function Dashboard({ stats }) {
  const [commandoData, setCommandoData] = useState([]);
  const [grossisteData, setGrossisteData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmdRes, groRes] = await Promise.all([
          axios.get('http://localhost:5000/api/commando-performances').catch(() => ({ data: { data: [] } })),
          axios.get('http://localhost:5000/api/grossiste-performances').catch(() => ({ data: { data: [] } }))
        ]);
        setCommandoData(cmdRes.data.data || []);
        setGrossisteData(groRes.data.data || []);
      } catch (err) {
        console.error('Erreur chargement données dashboard:', err);
      }
    };
    fetchData();
  }, []);

  const performancesChartData = [
    { name: 'Commando', value: stats.commando || 0, fill: '#f5576c' },
    { name: 'Grossiste', value: stats.grossiste || 0, fill: '#4facfe' },
    { name: 'Promo Pâque', value: stats.promoPaque || 0, fill: '#43e97b' }
  ];

  const visitsData = (() => {
    if (commandoData.length === 0) return [];
    const totals = commandoData.reduce((acc, p) => {
      acc.boutique += p.visits_boutique || 0;
      acc.superette += p.visits_superette || 0;
      acc.kiosque += p.visits_kiosque || 0;
      acc.tablier += p.visits_tablier || 0;
      acc.pushcart += p.visits_pushcart || 0;
      return acc;
    }, { boutique: 0, superette: 0, kiosque: 0, tablier: 0, pushcart: 0 });
    return [
      { name: 'Boutique', value: totals.boutique },
      { name: 'Superette', value: totals.superette },
      { name: 'Kiosque', value: totals.kiosque },
      { name: 'Tablier', value: totals.tablier },
      { name: 'Pushcart', value: totals.pushcart }
    ].filter(d => d.value > 0);
  })();

  const salesData = (() => {
    if (commandoData.length === 0) return [];
    const totals = commandoData.reduce((acc, p) => {
      acc.premium16 += p.sales_premium_16g || 0;
      acc.premium360 += p.sales_premium_360g || 0;
      acc.excellence += p.sales_excellence_900g || 0;
      acc.avoine50 += p.sales_avoine_50g || 0;
      acc.avoine400 += p.sales_avoine_400g || 0;
      return acc;
    }, { premium16: 0, premium360: 0, excellence: 0, avoine50: 0, avoine400: 0 });
    return [
      { name: 'Premium 16g', ventes: totals.premium16 },
      { name: 'Premium 360g', ventes: totals.premium360 },
      { name: 'Excellence 900g', ventes: totals.excellence },
      { name: 'Avoine 50g', ventes: totals.avoine50 },
      { name: 'Avoine 400g', ventes: totals.avoine400 }
    ];
  })();

  const grossisteChartData = grossisteData.map(g => ({
    name: g.grossiste_name || `ID ${g.id}`,
    realisation: g.realisation_carton || 0,
    objectif: g.objectif_vente_carton || 0
  }));

  const recentActivities = [
    { id: 1, type: 'Système', description: 'Base de données opérationnelle', date: 'Maintenant' },
    { id: 2, type: 'Backend', description: 'API fonctionnelle sur port 5000', date: 'Maintenant' },
    { id: 3, type: 'Modules', description: '5 modules actifs', date: 'Maintenant' },
  ];

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BiblosLogo size={36} showText={true} />
      </Box>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, color: '#757575' }}>
        Tableau de bord de reporting commercial
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
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
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
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
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
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
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" component="div" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, fontWeight: 500 }}>
                    Performances Promo Pâque
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                    {stats.promoPaque || 0}
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
              '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
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
                    {(stats.commando || 0) + (stats.grossiste || 0) + (stats.promoPaque || 0)}
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

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Performances distribution bar chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Répartition des Performances
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performancesChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, 'Entrées']}
                />
                <Bar dataKey="value" name="Performances" radius={[8, 8, 0, 0]}>
                  {performancesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Visits by PDV type pie chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Visites par Type de PDV
            </Typography>
            {visitsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visitsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {visitsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [value, 'Visites']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#9e9e9e' }}>
                  Aucune donnée de visites disponible
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sales by product bar chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Ventes par Produit (Commando)
            </Typography>
            {salesData.some(d => d.ventes > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [value, 'Unités vendues']}
                  />
                  <Bar dataKey="ventes" name="Ventes" radius={[8, 8, 0, 0]}>
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#9e9e9e' }}>
                  Aucune donnée de ventes disponible
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Grossiste: Objectif vs Réalisation */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Grossiste — Objectif vs Réalisation
            </Typography>
            {grossisteChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={grossisteChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="objectif" name="Objectif (cartons)" fill="#90caf9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="realisation" name="Réalisation (cartons)" fill="#1976d2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#9e9e9e' }}>
                  Aucune donnée grossiste disponible
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Activities & System Status */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, background: 'white' }}>
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
                      sx={{ '&:hover': { bgcolor: '#f5f5f5' }, transition: 'bgcolor 0.2s' }}
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
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, background: 'white' }}>
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
                    5 actifs
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
                    React + Recharts
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
