import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button, Chip 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, Cell, Line, ComposedChart
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { GrossisteService } from '../services/AdvancedServices';
import { Lightbulb as LightbulbIcon, AutoGraph as AutoGraphIcon } from '@mui/icons-material';

// --- FONCTION UTILITAIRE : CODE COULEUR DE PERFORMANCE BI ---
const getPerformanceColor = (rate) => {
  const currentRate = Number(rate) || 0;
  if (currentRate < 70) return { main: '#d32f2f', light: '#ffebee', label: 'Critique' };
  if (currentRate < 100) return { main: '#f57c00', light: '#fff3e0', label: 'En Alerte' };
  if (currentRate <= 115) return { main: '#2e7d32', light: '#e8f5e9', label: 'Atteint' };
  return { main: '#0288d1', light: '#e1f5fe', label: 'Surperformance' };
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
    // 5. Filtre Temporel
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

  // Extraction dynamique des SKUs uniques
  const uniqueProducts = useMemo(() => {
    return [...new Set(data.map(r => r?.format_produit).filter(Boolean))];
  }, [data]);

  // --- SÉCURISATION DU GRAPHIQUE EN CASCADE (WATERFALL) AGAINST TYPEERROR ---
  const waterfallData = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];
    
    const cityMap = {};
    filteredData.forEach(r => {
      if (!r || !r.ville) return;
      if (!cityMap[r.ville]) cityMap[r.ville] = 0;
      cityMap[r.ville] += (Number(r.realisation_carton) || 0) - (Number(r.objective_carton || r.objectif_carton) || 0);
    });

    const currentObj = filteredData.reduce((sum, r) => sum + (Number(r.objective_carton || r.objectif_carton) || 0), 0);
    const currentReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);

    let runningTotal = currentObj;
    const waterfall = [{ name: 'Obj. Initial', Valeur: runningTotal, Base: 0, Couleur: '#90caf9' }];

    Object.entries(cityMap).sort((a,b) => b[1] - a[1]).slice(0, 5).forEach(([city, value]) => {
      const prevTotal = runningTotal;
      runningTotal += value;
      waterfall.push({
        name: `${city}`,
        Valeur: Math.abs(value),
        Base: value >= 0 ? prevTotal : runningTotal,
        Couleur: value >= 0 ? '#4caf50' : '#f44336'
      });
    });

    waterfall.push({ name: 'Réel Global', Valeur: currentReal, Base: 0, Couleur: '#1a237e' });
    return waterfall;
  }, [filteredData]);

  // --- CONFORMITÉ DU CHRONO TEMPOREL ---
  const timelineData = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];
    const datesMap = {};
    filteredData.forEach(r => {
      if (!r) return;
      const rawDate = r.date_vente || r.date;
      const d = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : 'Indéfini';
      
      if (!datesMap[d]) datesMap[d] = { name: d, Objectif: 0, Réalisation: 0 };
      datesMap[d].Objectif += Number(r.objective_carton || r.objectif_carton) || 0;
      datesMap[d].Réalisation += Number(r.realisation_carton) || 0;
    });
    return Object.values(datesMap).slice(-12);
  }, [filteredData]);

  // --- CLASSEMENT PALMARÈS TOP / FLOP ---
  const rankingMetrics = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return { top: [], flop: [] };
    const grossistes = {};
    filteredData.forEach(r => {
      if (!r || !r.grossiste) return;
      if (!grossistes[r.grossiste]) {
        grossistes[r.grossiste] = { name: r.grossiste, ville: r.ville || 'Inconnue', obj: 0, real: 0 };
      }
      grossistes[r.grossiste].obj += Number(r.objective_carton || r.objectif_carton) || 0;
      grossistes[r.grossiste].real += Number(r.realisation_carton) || 0;
    });

    const sorted = Object.values(grossistes).map(g => {
      const taux = g.obj > 0 ? (g.real / g.obj) * 100 : 0;
      return { ...g, taux, color: getPerformanceColor(taux) };
    }).sort((a, b) => b.taux - a.taux);

    return {
      top: sorted.slice(0, 5),
      flop: [...sorted].reverse().slice(0, 5).filter(g => g.taux < 100)
    };
  }, [filteredData]);

  // Groupement standard par ville pour le graphique en barres principal
  const chartData = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];
    return Object.values(
      filteredData.reduce((acc, current) => {
        if (!current) return acc;
        const city = current.ville || 'Inconnue';
        if (!acc[city]) acc[city] = { name: city, Objectif: 0, Realisation: 0 };
        acc[city].Objectif += Number(current.objective_carton || current.objectif_carton) || 0;
        acc[city].Realisation += Number(current.realisation_carton) || 0;
        return acc;
      }, {})
    );
  }, [filteredData]);

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">Erreur de chargement: {error.message}</Alert></Box>;

  // Indices de performance
  const globalObj = filteredData.reduce((sum, r) => sum + (Number(r.objective_carton || r.objectif_carton) || 0), 0);
  const globalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const globalRate = globalObj > 0 ? (globalReal / globalObj) * 100 : 0;
  const perfBrute = getPerformanceColor(globalRate);

  const flawsCount = filteredData.filter(r => {
    const obj = Number(r.objective_carton || r.objectif_carton) || 0;
    const real = Number(r.realisation_carton) || 0;
    return obj > 0 ? (real / obj) * 100 < 100 : false;
  }).length;

  return (
    <Box p={1}>
      {/* En-tête */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoGraphIcon fontSize="large" /> Module Analytique Grossistes Advanced
        </Typography>
      </Box>

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
              <TextField fullWidth size="small" select label="Format Produit" value={produitFilter} onChange={(e) => setProduitFilter(e.target.value)}>
                <MenuItem value="">Tous les formats</MenuItem>
                {uniqueProducts.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Statut" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <MenuItem value="Tous">Toutes les performances</MenuItem>
                <MenuItem value="Surperformance">🔵 Surperformance (&gt; 115%)</MenuItem>
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
              <Typography variant="caption" fontWeight="bold" color="textSecondary">OBJECTIF IMPOSÉ AU SECTEUR</Typography>
              <Typography variant="h4" fontWeight="bold" color="#0d47a1" mt={1}>{Math.round(globalObj).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${perfBrute.main}`, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">VOLUME VENDU CONSOLIDÉ</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} mt={1}>{Math.round(globalReal).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${perfBrute.main}`, bgcolor: perfBrute.light, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">TAUX DE RÉALISATION MOYEN</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} mt={1}>{globalRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section des Graphiques BI */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📊 Suivi Temporel Réalisation vs Objectifs</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: 11 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Legend />
                  <Bar dataKey="Réalisation" name="Réalisation (Cartons)" fill="#1976d2" />
                  <Line type="monotone" dataKey="Objectif" name="Seuil Objectif" stroke="#f57c00" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📉 Écart Volumétrique en Cascade</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="name" style={{ fontSize: 10 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Bar dataKey="Valeur">
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Couleur} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Palmarès de Performance Établi */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏆 Distribution Géographique Top & Flops</Typography>
            
            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>🟢 Meilleurs Distributeurs (Top 5)</Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableBody>
                  {rankingMetrics.top.map((g, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                      <TableCell align="right">{Math.round(g.real).toLocaleString()} Crt</TableCell>
                      <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>🔴 Distributeurs Sous-Performants (&lt; 100%)</Typography>
            {rankingMetrics.flop.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {rankingMetrics.flop.slice(0, 3).map((g, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                        <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Écart: {Math.round(g.real - g.obj).toLocaleString()} Crt</TableCell>
                        <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">Tous les grossistes de ce secteur sécurisent à 100% leurs quotas.</Alert>
            )}
          </Paper>
        </Grid>

        {/* Diagnostic Dynamique */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon color="warning" /> Diagnostic Analytique
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box p={1.5} component={Paper} sx={{ borderLeft: `4px solid ${perfBrute.main}`, elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Analyse Contextuelle des Filtres</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Dans le périmètre sélectionné, la réalisation moyenne s'établit à <strong>{globalRate.toFixed(1)}%</strong>. Le statut global est désigné comme : <strong>{perfBrute.label}</strong>.
                </Typography>
              </Box>
              <Box p={1.5} component={Paper} sx={{ borderLeft: '4px solid #f57c00', elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Suivi des Risques</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Il y a actuellement <strong>{flawsCount}</strong> ligne(s) d'activité commerciale sous le seuil d'atteinte de quotas (100%).
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Journal des Ventes */}
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
                const rowStyle = getPerformanceColor(subRate);
                return (
                  <TableRow key={row.id || index} hover>
                    <TableCell>{row.date_vente ? new Date(row.date_vente).toLocaleDateString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell>{row.ville || 'N/A'}</TableCell>
                    <TableCell>{row.grossiste || 'N/A'}</TableCell>
                    <TableCell>{row.format_produit || 'N/A'}</TableCell>
                    <TableCell align="right">{subObj.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{subReal.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${subRate.toFixed(1)}%`} 
                        size="small" 
                        sx={{ bgcolor: rowStyle.light, color: rowStyle.main, fontWeight: 'bold' }} 
                      />
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