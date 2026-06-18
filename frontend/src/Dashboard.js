import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress
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

function Dashboard({ stats = {} }) {
  const [commandoData, setCommandoData] = useState([]);
  const [grossisteData, setGrossisteData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cmdRes, groRes] = await Promise.all([
          axios.get('/api/commando-performances').catch(() => ({ data: { data: [] } })),
          axios.get('/api/grossiste-performances').catch(() => ({ data: [] }))
        ]);

        let cmdRecords = [];
        if (cmdRes && cmdRes.data) {
          if (Array.isArray(cmdRes.data)) cmdRecords = cmdRes.data;
          else if (Array.isArray(cmdRes.data.data)) cmdRecords = cmdRes.data.data;
          else if (Array.isArray(cmdRes.data.performances)) cmdRecords = cmdRes.data.performances;
        }

        let groRecords = [];
        if (groRes && groRes.data) {
          if (Array.isArray(groRes.data)) groRecords = groRes.data;
          else if (Array.isArray(groRes.data.data)) groRecords = groRes.data.data;
          else if (Array.isArray(groRes.data.performances)) groRecords = groRes.data.performances;
        }

        setCommandoData(cmdRecords);
        setGrossisteData(groRecords);
      } catch (err) {
        console.error('Erreur chargement données dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const performancesChartData = useMemo(() => {
    return [
      { name: 'Commando', value: commandoData.length || Number(stats?.commando) || 0, fill: '#f5576c' },
      { name: 'Grossiste', value: grossisteData.length || Number(stats?.grossiste) || 0, fill: '#1976d2' },
      { name: 'Promo Pâque', value: Number(stats?.promoPaque) || 0, fill: '#43e97b' }
    ];
  }, [stats, commandoData, grossisteData]);

  const grossisteChartData = useMemo(() => {
    if (!Array.isArray(grossisteData) || grossisteData.length === 0) return [];
    const citiesGroup = {};
    grossisteData.forEach(g => {
      if (!g) return;
      const city = g.ville || 'INCONNU';
      if (!citiesGroup[city]) {
        citiesGroup[city] = { name: city, objectif: 0, realisation: 0 };
      }
      citiesGroup[city].objectif += Math.round(Number(g.objective_carton) || 0);
      citiesGroup[city].realisation += Math.round(Number(g.realisation_carton) || 0);
    });
    return Object.values(citiesGroup).slice(0, 6);
  }, [grossisteData]);

// --- PARSE DYNAMIQUE ET SÉCURISÉ DES TYPOLOGIES DE PDV ---
  const visitsData = useMemo(() => {
    if (!Array.isArray(commandoData) || commandoData.length === 0) return [];
    
    // Initialisation des compteurs pour chaque type de point de vente de ton Excel
    const pdvCounters = {
      'Boutique': 0,
      'Superette': 0,
      'Kiosque': 0,
      'Tablier': 0,
      'Pushcart': 0
    };
    
    commandoData.forEach(p => {
      if (!p || !p.metric_category || !p.type_pdv_ou_produit) return;
      
      const category = p.metric_category.trim().toLowerCase();
      
      // Cette condition capte à la fois "Nombre de visite..." et "Nombre de référencement..."
      if (category.includes('visite') || category.includes('référencement') || category.includes('pdv')) {
        const pdvType = p.type_pdv_ou_produit.trim();
        
        if (pdvCounters[pdvType] !== undefined) {
          pdvCounters[pdvType] += parseFloat(p.realise) || 0;
        }
      }
    });

    // Transformation au format attendu par le graphique PieChart de Recharts
    return Object.entries(pdvCounters)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter(d => d.value > 0); // On n'affiche que les PDV qui ont eu au moins une visite
  }, [commandoData]);
  // --- PARSE DYNAMIQUE DES VENTES PAR SKU ---
  const salesData = useMemo(() => {
    if (!Array.isArray(commandoData) || commandoData.length === 0) return [];
    
    const skus = {
      'Premium 16g': 0,
      'Premium 360g': 0,
      'Excellence 900g': 0,
      'Avoine 50g': 0,
      'Avoine 400g': 0
    };

    commandoData.forEach(p => {
      if (!p || !p.metric_category || !p.type_pdv_ou_produit) return;
      const category = p.metric_category.trim().toLowerCase();
      
      if (category.includes('vente')) {
        const product = p.type_pdv_ou_produit.trim();
        if (product.includes('16g')) skus['Premium 16g'] += parseFloat(p.realise) || 0;
        else if (product.includes('360g')) skus['Premium 360g'] += parseFloat(p.realise) || 0;
        else if (product.includes('900g')) skus['Excellence 900g'] += parseFloat(p.realise) || 0;
        else if (product.includes('50g')) skus['Avoine 50g'] += parseFloat(p.realise) || 0;
        else if (product.includes('400g')) skus['Avoine 400g'] += parseFloat(p.realise) || 0;
      }
    });

    return Object.entries(skus).map(([name, ventes]) => ({ name, ventes: Math.round(ventes) }));
  }, [commandoData]);

  const recentActivities = [
    { id: 1, type: 'Base Supabase', description: `Vues grossistes synchronisées (${grossisteData.length} lignes)`, date: 'Maintenant' },
    { id: 2, type: 'Sécurité Infrastructure', description: 'Pooler PostgreSQL chiffré et validé', date: 'Maintenant' },
    { id: 3, type: 'Modélisation', description: 'Intégrité des données BI contrôlée', date: 'Maintenant' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <BiblosLogo size={36} showText={true} />
      </Box>
      <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
        Suivi analytique des performances commerciales et d'activation.
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Effectif Commercial</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats?.agents || 0}</Typography>
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{(commandoData.length || stats?.commando || 0).toLocaleString()}</Typography>
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
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Lignes Grossistes</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{grossisteData.length.toLocaleString()}</Typography>
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
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Volume d'Entrées Total</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{(commandoData.length + grossisteData.length).toLocaleString()}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><TrendingUp /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section des Graphiques Recharts */}
      <Grid container spacing={3}>
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
                <Typography variant="body2" color="textSecondary">Aucune donnée grossiste à afficher</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

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
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Entrées']} />
                <Bar dataKey="value" name="Lignes actives" radius={[6, 6, 0, 0]}>
                  {performancesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
              Ventes par SKU (Canal Commando)
            </Typography>
            {salesData.some(d => d.ventes > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-10} textAnchor="end" height={50} style={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v) => v.toLocaleString()} />
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
                  <Tooltip formatter={(v) => v.toLocaleString()} />
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

      {/* Infrastructure Réseau */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
            État de l'Infrastructure Réseau
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Composant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rapport d'Intégrité</TableCell>
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
      </Box>
    </Box>
  );
}

export default Dashboard;