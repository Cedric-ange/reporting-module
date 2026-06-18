import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button, Chip 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { GrossisteService } from '../services/AdvancedServices';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';

// --- FONCTION UTILITAIRE : CODE COULEUR DE PERFORMANCE BI ---
const getPerformanceColor = (rate) => {
  if (rate < 70) return { main: '#d32f2f', light: '#ffebee', label: 'Critique' };       // Rouge
  if (rate < 100) return { main: '#f57c00', light: '#fff3e0', label: 'En Alerte' };     // Orange
  if (rate <= 115) return { main: '#2e7d32', light: '#e8f5e9', label: 'Atteint' };      // Vert
  return { main: '#0288d1', light: '#e1f5fe', label: 'Surperformance' };                // Bleu
};

export default function GrossisteModule() {
  // --- ÉTATS DES FILTRES MULTICRITÈRES ---
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');
  const [produitFilter, setProduitFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [temporelFilter, setTemporelFilter] = useState('Tous');

  const [filteredData, setFilteredData] = useState([]);

  // --- CONNECTEUR CACHE REACT QUERY ---
  const { data: rawResponse, isLoading, error } = useQuery({
    queryKey: ['grossistePerformances'],
    queryFn: () => GrossisteService.getPerformances(),
  });

  // Sécurisation structurelle du retour API
  const data = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    if (rawResponse && Array.isArray(rawResponse.data)) return rawResponse.data;
    if (rawResponse && Array.isArray(rawResponse.performances)) return rawResponse.performances;
    return [];
  }, [rawResponse]);

  // --- MOTEUR DE FILTRAGE SUR TOUTES LES VARIABLES ---
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // 1. Filtre par Ville / Région
    if (villeFilter) {
      result = result.filter(r => r && r.ville && r.ville.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    // 2. Filtre par Grossiste
    if (grossisteFilter) {
      result = result.filter(r => r && r.grossiste && r.grossiste.toLowerCase().includes(grossisteFilter.toLowerCase()));
    }
    // 3. Filtre par SKU / Format Produit
    if (produitFilter) {
      result = result.filter(r => r && r.format_produit && r.format_produit.toLowerCase() === produitFilter.toLowerCase());
    }
    // 4. Filtre par Niveau de Performance
    if (statutFilter !== 'Tous') {
      result = result.filter(r => {
        if (!r) return false;
        const obj = Number(r.objective_carton || r.objectif_carton) || 0;
        const real = Number(r.realisation_carton) || 0;
        const rate = obj > 0 ? (real / obj) * 100 : 0;
        return getPerformanceColor(rate).label === statutFilter;
      });
    }
    // 5. Filtre Temporel (Derniers 7 jours vs Derniers 30 jours)
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
  }, [villeFilter, grossisteFilter, produitFilter, statutFilter, temporelFilter, data]);

  // Extraction dynamique des SKUs uniques pour alimenter les listes déroulantes
  const uniqueProducts = useMemo(() => {
    return [...new Set(data.map(r => r?.format_produit).filter(Boolean))];
  }, [data]);

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">Erreur de chargement: {error.message}</Alert></Box>;

  // --- CALCULS DES INDICES BI CONSOLIDÉS ---
  const globalObj = filteredData.reduce((sum, r) => sum + (Number(r.objective_carton || r.objectif_carton) || 0), 0);
  const globalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const globalRate = globalObj > 0 ? (globalReal / globalObj) * 100 : 0;
  const perfBrute = getPerformanceColor(globalRate);

  // Groupement des données par ville pour le graphique Recharts
  const chartData = Object.values(
    filteredData.reduce((acc, current) => {
      const city = current.ville || 'Inconnue';
      if (!acc[city]) {
        acc[city] = { name: city, Objectif: 0, Realisation: 0 };
      }
      acc[city].Objectif += Number(current.objective_carton || current.objectif_carton) || 0;
      acc[city].Realisation += Number(current.realisation_carton) || 0;
      return acc;
    }, {})
  );

  // Liste des distributeurs en anomalie de commande
  const flaws = filteredData.filter(r => {
    const obj = Number(r.objective_carton || r.objectif_carton) || 0;
    const real = Number(r.realisation_carton) || 0;
    const rate = obj > 0 ? (real / obj) * 100 : 0;
    return rate < 100;
  });

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#1a237e' }}>
        Suivi d'Activité Grossistes
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Analyse de performance commerciale temps réel issue des pipelines Supabase.
      </Typography>

      {/* Barre de filtrage multi-critères */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" label="Ville / Région" value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" label="Grossiste" value={grossisteFilter} onChange={(e) => setGrossisteFilter(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Format Produit" value={produitFilter} onChange={(e) => setproduitFilter(e.target.value)}>
                <MenuItem value="">Tous les formats</MenuItem>
                {uniqueProducts.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Statut" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <MenuItem value="Tous">Toutes les performances</MenuItem>
                <MenuItem value="Surperformance">🟢 Surperformance (&gt; 115%)</MenuItem>
                <MenuItem value="Atteint">🟢 Objectif Atteint (100% - 115%)</MenuItem>
                <MenuItem value="En Alerte">🟡 En Alerte (70% - 99.9%)</MenuItem>
                <MenuItem value="Critique">🔴 Critique (&lt; 70%)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Période" value={temporelFilter} onChange={(e) => setTemporelFilter(e.target.value)}>
                <MenuItem value="Tous">Tout l'historique</MenuItem>
                <MenuItem value="7j">7 derniers jours</MenuItem>
                <MenuItem value="30j">30 derniers jours</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {(villeFilter || grossisteFilter || produitFilter || statutFilter !== 'Tous' || temporelFilter !== 'Tous') && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button size="small" color="secondary" onClick={() => { setVilleFilter(''); setGrossisteFilter(''); setProduitFilter(''); setStatutFilter('Tous'); setTemporelFilter('Tous'); }}>
                Réinitialiser les filtres
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* KPIs Métriques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #1976d2', bgcolor: '#f0f7ff' }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">OBJECTIF GLOBAL</Typography>
              <Typography variant="h4" fontWeight="bold" color="#0d47a1" mt={1}>{Math.round(globalObj).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #2e7d32', bgcolor: '#f3fbf4' }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">RÉALISATION GLOBALE</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1b5e20" mt={1}>{Math.round(globalReal).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${perfBrute.main}`, bgcolor: perfBrute.light }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">TAUX DE RÉALISATION</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} mt={1}>{globalRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique et Diagnostic */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Volumes de Distribution par Secteur</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="Objectif" fill="#b0bec5" />
                  <Bar dataKey="Realisation" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fafafa', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon color="warning" /> Diagnostic Analytique
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box p={2} component={Paper} sx={{ borderLeft: `4px solid ${perfBrute.main}`, elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Analyse Flash</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Dans le périmètre sélectionné, la réalisation s'établit à <strong>{globalRate.toFixed(1)}%</strong>. Le statut du segment est jugé : <strong>{perfBrute.label}</strong>.
                </Typography>
              </Box>
              <Box p={2} component={Paper} sx={{ borderLeft: '4px solid #f57c00', elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Suivi des Risques</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Il y a actuellement <strong>{flaws.length}</strong> ligne(s) d'activité commerciale sous le seuil d'atteinte de quotas (100%).
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tableau exhaustif */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Journal des Ventes Grossistes (Top 50)</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ville</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Grossiste</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Produit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Objectif</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Réalisation</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(0, 50).map((row, index) => {
                const subObj = Number(row.objective_carton || row.objectif_carton) || 0;
                const subReal = Number(row.realisation_carton) || 0;
                const subRate = subObj > 0 ? (subReal / subObj) * 100 : 0;
                return (
                  <TableRow key={row.id || index} hover>
                    <TableCell>{row.date_vente ? new Date(row.date_vente).toLocaleDateString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell>{row.ville || 'N/A'}</TableCell>
                    <TableCell>{row.grossiste || 'N/A'}</TableCell>
                    <TableCell>{row.format_produit || 'N/A'}</TableCell>
                    <TableCell align="right">{subObj.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{subReal.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${subRate.toFixed(1)}%`} size="small" sx={{ bgcolor: getPerformanceColor(subRate).light, color: getPerformanceColor(subRate).main, fontWeight: 'bold' }} />
                    </TableCell>
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