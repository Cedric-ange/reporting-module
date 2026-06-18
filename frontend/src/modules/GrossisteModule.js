import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button, Chip, LinearProgress 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, Line, ComposedChart, Cell
} from 'recharts';
import { GrossisteService } from '../services/AdvancedServices';
import { Lightbulb as LightbulbIcon, AutoGraph as AutoGraphIcon } from '@mui/icons-material';

// --- FONCTION UTILITAIRE : CODE COULEUR DE PERFORMANCE BI ---
const getPerformanceColor = (rate) => {
  if (rate < 70) return { main: '#d32f2f', light: '#ffebee', label: 'Critique' };       // Rouge
  if (rate < 100) return { main: '#f57c00', light: '#fff3e0', label: 'En Alerte' };     // Orange
  if (rate <= 115) return { main: '#2e7d32', light: '#e8f5e9', label: 'Atteint' };      // Vert
  return { main: '#0288d1', light: '#e1f5fe', label: 'Surperformance' };                // Bleu
};

export default function GrossisteModule() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);

  // --- ÉTATS DES FILTRES ---
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');
  const [produitFilter, setProduitFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');

  // Chargement initial des données depuis le Service
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await GrossisteService.getPerformances();
        
        // Sécurisation de la structure du retour d'API (tableau vs objet enveloppé)
        let records = [];
        if (Array.isArray(response)) {
          records = response;
        } else if (response && Array.isArray(response.data)) {
          records = response.data;
        } else if (response && Array.isArray(response.performances)) {
          records = response.performances;
        }
        
        setData(records);
        setFilteredData(records);
      } catch (err) {
        console.error("Erreur de chargement:", err);
        setError("Erreur lors de la récupération des données de performance grossistes.");
      } finally { // <-- Correction syntaxique de "finaly" ici !
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- MOTEUR DE FILTRAGE SUR TOUTES LES VARIABLES ---
  useEffect(() => {
    if (!Array.isArray(data)) return;

    let result = [...data];

    // 1. Filtre textuel par ville / région
    if (villeFilter) {
      result = result.filter(r => r && r.ville && r.ville.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    // 2. Filtre textuel par nom du grossiste
    if (grossisteFilter) {
      result = result.filter(r => r && r.grossiste && r.grossiste.toLowerCase().includes(grossisteFilter.toLowerCase()));
    }
    // 3. Filtre de sélection par SKU / Format Produit
    if (produitFilter) {
      result = result.filter(r => r && r.format_produit && r.format_produit.toLowerCase() === produitFilter.toLowerCase());
    }
    // 4. Filtre BI par niveau de performance
    if (statutFilter !== 'Tous') {
      result = result.filter(r => {
        if (!r) return false;
        const obj = Number(r.objective_carton || r.objectif_carton) || 0;
        const real = Number(r.realisation_carton) || 0;
        const rate = obj > 0 ? (real / obj) * 100 : 0;
        return getPerformanceColor(rate).label === statutFilter;
      });
    }

    setFilteredData(result);
  }, [villeFilter, grossisteFilter, produitFilter, statutFilter, data]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  // --- CALCULS DES MÉTRIQUES AGREGÉES ---
  const globalObj = filteredData.reduce((sum, r) => sum + (Number(r.objective_carton || r.objectif_carton) || 0), 0);
  const globalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const globalRate = globalObj > 0 ? (globalReal / globalObj) * 100 : 0;
  const perfBrute = getPerformanceColor(globalRate);

  // Extraction propre des SKUs pour alimenter le menu déroulant du filtre
  const uniqueProducts = [...new Set(data.map(r => r?.format_produit).filter(Boolean))];

  // --- GRAPHIQUE EN CASCADE (WATERFALL) FILTRÉ ---
  const getWaterfallData = () => {
    const cityMap = {};
    filteredData.forEach(r => {
      if (!r || !r.ville) return;
      if (!cityMap[r.ville]) cityMap[r.ville] = 0;
      cityMap[r.ville] += (Number(r.realisation_carton) || 0) - (Number(r.objective_carton || r.objectif_carton) || 0);
    });

    let runningTotal = globalObj;
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

    waterfall.push({ name: 'Réel Global', Valeur: globalReal, Base: 0, Couleur: '#1a237e' });
    return waterfall;
  };

  // --- FILTRE TEMPOREL DYNAMIQUE (Parcours des ventes filtrées) ---
  const getTimelineData = () => {
    const datesMap = {};
    filteredData.forEach(r => {
      if (!r) return;
      // Normalisation de la date pour le regroupement
      const rawDate = r.date_vente || r.date;
      const d = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : 'Indéfini';
      
      if (!datesMap[d]) datesMap[d] = { name: d, Objectif: 0, Réalisation: 0 };
      datesMap[d].Objectif += Number(r.objective_carton || r.objectif_carton) || 0;
      datesMap[d].Réalisation += Number(r.realisation_carton) || 0;
    });
    // Retourne les 12 dernières dates triées chronologiquement
    return Object.values(datesMap).slice(-12);
  };

  // --- CLASSEMENT PALMARÈS TOP / FLOP ---
  const getGrossisteRanking = () => {
    const grossistes = {};
    filteredData.forEach(r => {
      if (!r || !r.grossiste) return;
      if (!grossistes[r.grossiste]) {
        grossistes[r.grossiste] = { name: r.grossiste, ville: r.ville || 'Inconnue', obj: 0, real: 0 };
      }
      grossistes[r.grossiste].obj += Number(r.objective_carton || r.objectif_carton) || 0;
      grossistes[r.grossiste].real += Number(r.realisation_carton) || 0;
    });

    return Object.values(grossistes).map(g => {
      const taux = g.obj > 0 ? (g.real / g.obj) * 100 : 0;
      return { ...g, taux, color: getPerformanceColor(taux) };
    }).sort((a, b) => b.taux - a.taux);
  };

  const grossisteRanked = getGrossisteRanking();
  const topGrossistes = grossisteRanked.slice(0, 5);
  const flopGrossistes = [...grossisteRanked].reverse().slice(0, 5).filter(g => g.taux < 100);

  return (
    <Box p={1}>
      {/* En-tête */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoGraphIcon fontSize="large" /> Module Analytique Grossistes Advanced
        </Typography>
      </Box>

      {/* COMPOSANT DES FILTRES INTÉGRÉS ET SYNCHRONISÉS */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2}>
            
            {/* Filtre Ville */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                label="Filtrer par Ville / Région" 
                placeholder="Ex: Abidjan, Bouaké..."
                value={villeFilter} 
                onChange={(e) => setVilleFilter(e.target.value)} 
              />
            </Grid>

            {/* Filtre Nom Grossiste */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                label="Filtrer par Grossiste" 
                placeholder="Ex: Établissement Kouadio..."
                value={grossisteFilter} 
                onChange={(e) => setGrossisteFilter(e.target.value)} 
              />
            </Grid>

            {/* Filtre SKU Produit */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                select 
                label="Format Produit (SKU)" 
                value={produitFilter} 
                onChange={(e) => setProduitFilter(e.target.value)}
              >
                <MenuItem value="">Tous les formats de produits</MenuItem>
                {uniqueProducts.map((product) => (
                  <MenuItem key={product} value={product}>{product}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Filtre Alertes de Performance */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                select 
                label="Niveau de Performance" 
                value={statutFilter} 
                onChange={(e) => setStatutFilter(e.target.value)}
              >
                <MenuItem value="Tous">Toutes les performances</MenuItem>
                <MenuItem value="Surperformance">🔵 Surperformance (&gt; 115%)</MenuItem>
                <MenuItem value="Atteint">🟢 Objectif Atteint (100% - 115%)</MenuItem>
                <MenuItem value="En Alerte">🟡 En Alerte (70% - 99.9%)</MenuItem>
                <MenuItem value="Critique">🔴 Critique (&lt; 70%)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Bouton de Réinitialisation Globale */}
          {(villeFilter || grossisteFilter || produitFilter || statutFilter !== 'Tous') && (
            <Box display="flex" justifyContent="flex-end" mt={1.5}>
              <Button 
                size="small" 
                color="secondary" 
                onClick={() => {
                  setVilleFilter('');
                  setGrossisteFilter('');
                  setProduitFilter('');
                  setStatutFilter('Tous');
                }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Effacer tous les filtres actifs
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cartes Indicateurs KPI Réactifs */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: '6px solid #1976d2', borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">OBJECTIF SUR PÉRIMÈTRE FILTRÉ</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1976d2" sx={{ mt: 1 }}>{Math.round(globalObj).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: `6px solid ${perfBrute.main}`, borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">VOLUME VENDU CONSOLIDÉ</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} sx={{ mt: 1 }}>{Math.round(globalReal).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: `6px solid ${perfBrute.main}`, bgcolor: perfBrute.light, borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">TAUX DE RÉALISATION MOYEN</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} sx={{ mt: 1 }}>{globalRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section des Graphiques BI Réactifs */}
      <Grid container spacing={3} mb={4}>
        {/* Suivi Chronologique Dynamique */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📊 Suivi Temporel Réalisation vs Objectifs (Sélection Filtrée)</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <ComposedChart data={getTimelineData()}>
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

        {/* Analyse d'Écart Waterfall */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📉 Écart Volumétrique en Cascade par Zone</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={getWaterfallData()}>
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="name" style={{ fontSize: 10 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Bar dataKey="Valeur">
                    {getWaterfallData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Couleur} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bloc Décisionnel : Top/Flop & Diagnostic */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏆 Palmarès de Performance du Secteur</Typography>
            
            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>🟢 Leaders Actifs</Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableBody>
                  {topGrossistes.map((g, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                      <TableCell align="right">{Math.round(g.real).toLocaleString()} Crt</TableCell>
                      <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>🔴 Segments sous les objectifs (&lt; 100%)</Typography>
            {flopGrossistes.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {flopGrossistes.slice(0, 3).map((g, idx) => (
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
              <Alert severity="success">Tous les distributeurs de ce périmètre dépassent les 100% d'objectifs.</Alert>
            )}
          </Paper>
        </Grid>

        {/* Diagnostic Contextuel Réactif */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon color="warning" /> Interprétation & Diagnostic IA
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box p={1.5} component={Paper} sx={{ borderLeft: `4px solid ${perfBrute.main}`, elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Analyse Flash du Filtrage</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Pour la sélection en cours, la performance moyenne s'établit à <strong>{globalRate.toFixed(1)}%</strong>. Le statut du segment est jugé : <strong>{perfBrute.label}</strong>.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}