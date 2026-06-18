import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button 
} from '@mui/material'; // <-- Le composant "Chip" inutile a été retiré ici
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'; // <-- L'import "Legend" inutile a été retiré ici
import { useQuery } from '@tanstack/react-query';
import { CommandoService } from '../services/AdvancedServices';
import { Storefront as StoreIcon, Assessment as AssessmentIcon, LocalMall as ProductIcon } from '@mui/icons-material';

const PIE_COLORS = ['#1976d2', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
const PRODUCT_COLORS = ['#1a237e', '#1565c0', '#42a5f5', '#66bb6a', '#e53935'];

export default function CommandoModule() {
  // --- ÉTATS DES FILTRES ---
  const [villeFilter, setVilleFilter] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');
  const [temporelFilter, setTemporelFilter] = useState('Tous');

  const [filteredData, setFilteredData] = useState([]);

  // --- CONNECTEUR CACHE REACT QUERY VIA LE SERVICE CENTRALISÉ ---
  const { data: rawResponse, isLoading, error } = useQuery({
    queryKey: ['commandoPerformances'],
    queryFn: () => CommandoService.getPerformances(),
  });
  useEffect(() => {
  if (rawResponse) {
    console.log("📊 Structure brute reçue pour Commando :", rawResponse);
    console.log("Est-ce un tableau ? :", Array.isArray(rawResponse));
  }
}, [rawResponse]);

  // Sécurisation structurelle du retour API
  const data = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    if (rawResponse && Array.isArray(rawResponse.data)) return rawResponse.data;
    if (rawResponse && Array.isArray(rawResponse.performances)) return rawResponse.performances;
    return [];
  }, [rawResponse]);

  // --- MOTEUR DE FILTRAGE RÉACTIF ---
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // 1. Filtre par Ville
    if (villeFilter) {
      result = result.filter(r => r && r.ville && r.ville.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    // 2. Filtre par Commune
    if (communeFilter) {
      result = result.filter(r => r && r.commune && r.commune.toLowerCase().includes(communeFilter.toLowerCase()));
    }
    // 3. Filtre Temporel
    if (temporelFilter !== 'Tous') {
      const now = new Date();
      result = result.filter(r => {
        if (!r) return false;
        const recordDate = new Date(r.date_vente || r.date);
        const diffTime = Math.abs(now - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (temporelFilter === '7j') return diffDays <= 7;
        if (temporelFilter === '30j') return diffDays <= 30;
        return true;
      });
    }

    setFilteredData(result);
  }, [villeFilter, communeFilter, temporelFilter, data]);

  // --- CALCULS DES INDICES GLOBAUX SUR LES DONNÉES FILTRÉES ---
  const totals = useMemo(() => {
    return filteredData.reduce((acc, r) => {
      // Somme Visites
      acc.boutique += Number(r.visits_boutique) || 0;
      acc.superette += Number(r.visits_superette) || 0;
      acc.kiosque += Number(r.visits_kiosque) || 0;
      acc.tablier += Number(r.visits_tablier) || 0;
      acc.pushcart += Number(r.visits_pushcart) || 0;
      
      // Somme Ventes
      acc.p16 += Number(r.sales_premium_16g) || 0;
      acc.p360 += Number(r.sales_premium_360g) || 0;
      acc.e900 += Number(r.sales_excellence_900g) || 0;
      acc.a50 += Number(r.sales_avoine_50g) || 0;
      acc.a400 += Number(r.sales_avoine_400g) || 0;

      return acc;
    }, { boutique: 0, superette: 0, kiosque: 0, tablier: 0, pushcart: 0, p16: 0, p360: 0, e900: 0, a50: 0, a400: 0 });
  }, [filteredData]);

  const totalVisitsGlobal = totals.boutique + totals.superette + totals.kiosque + totals.tablier + totals.pushcart;
  const totalSalesGlobal = totals.p16 + totals.p360 + totals.e900 + totals.a50 + totals.a400;

  // Formater les données des graphiques
  const pieVisitsData = [
    { name: 'Boutique', value: totals.boutique },
    { name: 'Superette', value: totals.superette },
    { name: 'Kiosque', value: totals.kiosque },
    { name: 'Tablier', value: totals.tablier },
    { name: 'Pushcart', value: totals.pushcart }
  ].filter(d => d.value > 0);

  const barSalesData = [
    { name: 'Premium 16g', ventes: totals.p16 },
    { name: 'Premium 360g', ventes: totals.p360 },
    { name: 'Excellence 900g', ventes: totals.e900 },
    { name: 'Avoine 50g', ventes: totals.a50 },
    { name: 'Avoine 400g', ventes: totals.a400 }
  ];

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">Erreur de chargement: {error.message}</Alert></Box>;

  return (
    <Box p={1}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon fontSize="large" /> Module Reporting Commando Field
        </Typography>
      </Box>

      {/* Barre de filtrage multi-critères */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Filtrer par Ville" value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Filtrer par Commune" value={communeFilter} onChange={(e) => setCommuneFilter(e.target.value)} /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" select label="Période" value={temporelFilter} onChange={(e) => setTemporelFilter(e.target.value)}>
                <MenuItem value="Tous">Tout l'historique</MenuItem>
                <MenuItem value="7j">7 derniers jours</MenuItem>
                <MenuItem value="30j">30 derniers jours</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {(villeFilter || communeFilter || temporelFilter !== 'Tous') && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button size="small" color="secondary" onClick={() => { setVilleFilter(''); setCommuneFilter(''); setTemporelFilter('Tous'); }}>
                Réinitialiser les filtres
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cartes KPI */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #1976d2', bgcolor: '#f0f7ff' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">TOTAL DES VISITES TERRAIN</Typography>
                <Typography variant="h4" fontWeight="bold" color="#0d47a1" mt={1}>{totalVisitsGlobal.toLocaleString()}</Typography>
              </Box>
              <StoreIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #2e7d32', bgcolor: '#f3fbf4' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">TOTAL DES UNITÉS VENDUES</Typography>
                <Typography variant="h4" fontWeight="bold" color="#1b5e20" mt={1}>{totalSalesGlobal.toLocaleString()}</Typography>
              </Box>
              <ProductIcon sx={{ fontSize: 40, color: '#2e7d32', opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #ff9800', bgcolor: '#fffdf3' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">LIGNES DE RAPPORT ACTIVES</Typography>
                <Typography variant="h4" fontWeight="bold" color="#e65100" mt={1}>{filteredData.length}</Typography>
              </Box>
              <AssessmentIcon sx={{ fontSize: 40, color: '#ff9800', opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section des Graphiques analytiques */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏪 Typologie des Points de Vente Visités</Typography>
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {pieVisitsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieVisitsData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieVisitsData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Typography variant="body2" color="textSecondary">Aucune donnée disponible</Typography>}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📦 Volumes de Ventes par SKU Produit</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: 11 }} angle={-10} textAnchor="end" height={45} />
                  <YAxis />
                  <ChartTooltip formatter={(v) => v.toLocaleString()} />
                  <Bar dataKey="ventes" name="Unités vendues">
                    {barSalesData.map((entry, index) => <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Registre exhaustif Commando */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Registre des Rapports de Visite Commando (Top 50)</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ville</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Commune / Secteur</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Visites</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Ventes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(0, 50).map((row, index) => {
                const subVisits = (row.visits_boutique || 0) + (row.visits_superette || 0) + (row.visits_kiosque || 0) + (row.visits_tablier || 0) + (row.visits_pushcart || 0);
                const subSales = (row.sales_premium_16g || 0) + (row.sales_premium_360g || 0) + (row.sales_excellence_900g || 0) + (row.sales_avoine_50g || 0) + (row.sales_avoine_400g || 0);
                return (
                  <TableRow key={row.id || index} hover>
                    <TableCell>{row.date ? new Date(row.date).toLocaleDateString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell>{row.ville || 'N/A'}</TableCell>
                    <TableCell>{row.commune || 'N/A'} {row.secteur ? ` - ${row.secteur}` : ''}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{subVisits}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{subSales}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}