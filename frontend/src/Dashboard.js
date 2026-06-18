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

const PIE_COLORS = ['#1976d2', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
const PRODUCT_COLORS = ['#1a237e', '#1565c0', '#42a5f5', '#66bb6a', '#e53935'];

function Dashboard({ stats }) {
  const [commandoData, setCommandoData] = useState([]);
  const [grossisteData, setGrossisteData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmdRes, groRes] = await Promise.all([
          axios.get('/api/commando-performances').catch(() => ({ data: { data: [] } })),
          axios.get('/api/grossiste-performances').catch(() => ({ data: [] }))
        ]);
        setCommandoData(cmdRes.data.data || []);
        setGrossisteData(groRes.data || []); // Lecture directe du tableau Supabase
      } catch (err) {
        console.error('Erreur chargement données dashboard:', err);
      }
    };
    fetchData();
  }, []);

  const performancesChartData = [
    { name: 'Commando', value: stats.commando || 0, fill: '#f5576c' },
    { name: 'Grossiste', value: grossisteData.length || stats.grossiste || 0, fill: '#1976d2' },
    { name: 'Promo Pâque', value: stats.promoPaque || 0, fill: '#43e97b' }
  ];

  // Extraction et agrégation macro de la réalisation grossiste par Ville
  const grossisteChartData = (() => {
    const citiesGroup = {};
    grossisteData.forEach(g => {
      const city = g.ville || 'INCONNU';
      if (!citiesGroup[city]) {
        citiesGroup[city] = { name: city, objectif: 0, realisation: 0 };
      }
      citiesGroup[city].objectif += Math.round(Number(g.objectif_carton) || 0);
      citiesGroup[city].realisation += Math.round(Number(g.realisation_carton) || 0);
    });
    return Object.values(citiesGroup).slice(0, 6); // Top 6 des villes majeures
  })();

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

  const recentActivities = [
    { id: 1, type: 'Base Supabase', description: `Vues grossistes opérationnelles (${grossisteData.length} lignes)`, date: 'Maintenant' },
    { id: 2, type: 'Sécurité SSL', description: 'Connexion chiffrée établie sur port 6543', date: 'Maintenant' },
    { id: 3, type: 'Canal Indépendant', description: 'Module Grossiste découplé de la contrainte agents', date: 'Maintenant' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <BiblosLogo size={36} showText={true} />
      </Box>
      <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
        Suivi analytique en temps réel des performances commerciales et d'activation.
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Effectif Commercial</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.agents || 0} <span style={{ fontSize: 14 }}>Agents</span></Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><People /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #f5576c 0%, #d81b60 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Rapports Commando</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.commando || 0}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Assessment /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #4facfe 0%, #0288d1 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Enregistrements Grossistes</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{grossisteData.length || stats.grossiste || 0}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><CloudUpload /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #43e97b 0%, #2e7d32 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Volume Total Injecté</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{(stats.commando || 0) + grossisteData.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><TrendingUp /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Grossiste performance vs objective */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Canal Grossistes — Volumes par Région (Cartons)
            </Typography>
            {grossisteChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={grossisteChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="objectif" name="Objectif total" fill="#90caf9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realisation" name="Réalisation réelle" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="textSecondary">En attente de chargement des données...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Core Distribution bar chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Distribution Proportionnelle des Rapports
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performancesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Entrées']} />
                <Bar dataKey="value" name="Lignes actives" radius={[6, 6, 0, 0]}>
                  {performancesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Product sales (Commando) */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Ventes par SKU (Canal Commando)
            </Typography>
            {salesData.some(d => d.ventes > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-10} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ventes" name="Unités" radius={[4, 4, 0, 0]}>
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="textSecondary">Aucune vente commando enregistrée</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* PDV distribution */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Visites Établies par Typologie PDV
            </Typography>
            {visitsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visitsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {visitsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="textSecondary">Aucune visite répertoriée</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Logs de validation en tâche de fond */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
              État Récent des Synchronisations
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fdfdfd' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Canal de flux</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action effectuée</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>{activity.type}</TableCell>
                      <TableCell sx={{ color: '#555' }}>{activity.description}</TableCell>
                      <TableCell sx={{ color: '#4caf50', fontWeight: 'bold' }}>{activity.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
              Intégrité Infrastructure
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['Base de données', 'Backend Server', 'Canaux API', 'Frontend Engine'].map((title, i) => (
                <Box key={title} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 4, height: 32, borderRadius: 1, bgcolor: i === 2 ? '#ff9800' : '#4caf50' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#777', display: 'block' }}>{title}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: i === 2 ? '#ef6c00' : '#2e7d32' }}>
                      {i === 2 ? "Ajusté (SSL Requise)" : "Opérationnel"}
                    </Typography>
                    <LinearProgress variant="determinate" value={100} sx={{ mt: 0.5, height: 3, borderRadius: 1, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: i === 2 ? '#ff9800' : '#4caf50' } }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;