import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button, Tooltip, Chip, Divider, LinearProgress 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Cell
} from 'recharts';
import { Download as DownloadIcon, Lightbulb as LightbulbIcon, AutoGraph as AutoGraphIcon } from '@mui/icons-material';

// Simulation ou Importation du service conforme à vos endpoints d'API logs
const fetchGrossistePerformances = async () => {
  const response = await fetch('/api/grossiste-performances');
  if (!response.ok) throw new Error('Erreur réseau');
  const result = await response.json();
  // Sécurisation : Si l'API renvoie un objet contenant le tableau, on l'extrait
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  if (result && Array.isArray(result.performances)) return result.performances;
  return [];
};

// --- FONCTION UTILITAIRE : CODE COULEUR DE PERFORMANCE ---
const getPerformanceColor = (rate) => {
  if (rate < 70) return { main: '#d32f2f', light: '#ffebee', label: 'Critique' };       
  if (rate < 100) return { main: '#f57c00', light: '#fff3e0', label: 'En Alerte' };     
  if (rate <= 115) return { main: '#2e7d32', light: '#e8f5e9', label: 'Atteint' };      
  return { main: '#0288d1', light: '#e1f5fe', label: 'Surperformance' };                
};

export default function GrossisteModule() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);

  // --- DÉCLARATION SÉCURISÉE DES FILTRES ---
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');
  const [produitFilter, setProduitFilter] = useState(''); // Correction de casse ici
  const [statutFilter, setStatutFilter] = useState('Tous');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const records = await fetchGrossistePerformances();
        // Double sécurité : on s'assure qu'on stocke un tableau valide quoi qu'il arrive
        const validatedRecords = Array.isArray(records) ? records : [];
        setData(validatedRecords);
        setFilteredData(validatedRecords);
      } catch (err) {
        setError("Erreur lors de la récupération des données de performance grossistes.");
      } finaly {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- MOTEUR DE FILTRAGE RÉACTIF ET MULTICRITÈRES ---
  useEffect(() => {
    if (!Array.isArray(data)) return;

    let result = [...data];

    if (villeFilter) {
      result = result.filter(r => r && r.ville && r.ville.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    if (grossisteFilter) {
      result = result.filter(r => r && r.grossiste && r.grossiste.toLowerCase().includes(grossisteFilter.toLowerCase()));
    }
    if (produitFilter) {
      result = result.filter(r => r && r.format_produit && r.format_produit.toLowerCase().includes(produitFilter.toLowerCase()));
    }
    if (statutFilter !== 'Tous') {
      result = result.filter(r => {
        if (!r) return false;
        const obj = Number(r.objectif_carton) || 0;
        const real = Number(r.realisation_carton) || 0;
        const rate = obj > 0 ? (real / obj) * 100 : 0;
        return getPerformanceColor(rate).label === statutFilter;
      });
    }

    setFilteredData(result);
  }, [villeFilter, grossisteFilter, produitFilter, statutFilter, data]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  // --- CALCUL DES MÉTRIQUES GLOBALES ---
  const globalObj = filteredData.reduce((sum, r) => sum + (Number(r.objectif_carton) || 0), 0);
  const globalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const globalRate = globalObj > 0 ? (globalReal / globalObj) * 100 : 0;
  const perfBrute = getPerformanceColor(globalRate);

  // Extraction dynamique des SKUs uniques de façon sécurisée
  const uniqueProducts = [...new Set(data.map(r => r?.format_produit).filter(Boolean))];

  // --- CONSTRUCTION DU GRAPHIQUE EN CASCADE (WATERFALL) ---
  const getWaterfallData = () => {
    const cityMap = {};
    filteredData.forEach(r => {
      if (!r || !r.ville) return;
      if (!cityMap[r.ville]) cityMap[r.ville] = 0;
      cityMap[r.ville] += (Number(r.realisation_carton) || 0) - (Number(r.objectif_carton) || 0);
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

  // --- TRAITEMENT DES DONNÉES TEMPORELLES CHRONOLOGIQUES ---
  const getTimelineData = () => {
    const datesMap = {};
    filteredData.forEach(r => {
      if (!r) return;
      const d = r.date_vente ? new Date(r.date_vente).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : 'Indéfini';
      if (!datesMap[d]) datesMap[d] = { name: d, Objectif: 0, Réalisation: 0 };
      datesMap[d].Objectif += Number(r.objectif_carton) || 0;
      datesMap[d].Réalisation += Number(r.realisation_carton) || 0;
    });
    return Object.values(datesMap).slice(-12);
  };

  // --- CLASSEMENT HONORIFIQUE TOP / FLOP ---
  const getGrossisteRanking = () => {
    const grossistes = {};
    filteredData.forEach(r => {
      if (!r || !r.grossiste) return;
      if (!grossistes[r.grossiste]) {
        grossistes[r.grossiste] = { name: r.grossiste, ville: r.ville || 'Inconnue', obj: 0, real: 0 };
      }
      grossistes[r.grossiste].obj += Number(r.objectif_carton) || 0;
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
    <Box p={2}>
      {/* En-tête de module */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoGraphIcon fontSize="large" /> Module Analytique Grossistes Advanced
          </Typography>
        </Box>
      </Box>

      {/* COMPOSANT DES FILTRES INTEGRÉ ET CORRIGÉ */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2}>
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

            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                size="small" 
                select 
                label="Format Produit (SKU)" 
                value={produitFilter} 
                onChange={(e) => setProduitFilter(e.target.value)} // Correction ici
              >
                <MenuItem value="">Tous les formats de produits</MenuItem>
                {uniqueProducts.map((product) => (
                  <MenuItem key={product} value={product}>{product}</MenuItem>
                ))}
              </TextField>
            </Grid>

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

      {/* Cartes KPI */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: '6px solid #1976d2', borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">OBJECTIF ATTENDU</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1976d2" sx={{ mt: 1 }}>{Math.round(globalObj).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: `6px solid ${perfBrute.main}`, borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">VOLUME VENDU</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} sx={{ mt: 1 }}>{Math.round(globalReal).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: `6px solid ${perfBrute.main}`, bgcolor: perfBrute.light, borderRadius: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="caption" fontWeight="bold">TAUX DE PÉNÉTRATION</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} sx={{ mt: 1 }}>{globalRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Graphiques */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📊 Suivi Temporel Réalisation vs Objectifs</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <ComposedChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: 11 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Legend />
                  <Bar dataKey="Réalisation" name="Réalisation (Cartons)" fill="#1976d2" />
                  <Line type="monotone" dataKey="Objectif" name="Seuil Objectif" stroke="#f57c00" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📉 Écart Volumétrique en Cascade</Typography>
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

      {/* Tableaux Top / Flop & Interprétation */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏆 Palmarès de Performance Établi</Typography>
            
            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>🟢 Top Distributeurs leaders</Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableBody>
                  {topGrossistes.map((g, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                      <TableCell align="right">{Math.round(g.real).toLocaleString()} Crt</TableCell>
                      <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>🔴 Flop Segments en Alerte</Typography>
            {flopGrossistes.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {flopGrossistes.slice(0, 3).map((g, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                        <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{Math.round(g.real - g.obj).toLocaleString()} Crt</TableCell>
                        <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">Tous les distributeurs actuels dépassent les 100%.</Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon color="warning" /> Interprétation & Diagnostics
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box p={1.5} component={Paper} sx={{ borderLeft: `4px solid ${perfBrute.main}` }}>
                <Typography variant="subtitle2" fontWeight="bold">Diagnostic d'Activité</Typography>
                <Typography variant="body2" color="textSecondary">
                  Performance du périmètre sélectionné évaluée à <strong>{globalRate.toFixed(1)}%</strong>, considérée comme <strong>{perfBrute.label}</strong>.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}