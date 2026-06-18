import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  TextField, MenuItem, Button, Divider, InputAdornment
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { CommandoService } from '../services/AdvancedServices';
import { 
  Storefront as StoreIcon, 
  Assessment as AssessmentIcon, 
  People as PeopleIcon, 
  Search as SearchIcon, 
  CardGiftcard as GiftIcon 
} from '@mui/icons-material';

const PIE_COLORS = ['#1976d2', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#e53935'];

export default function CommandoModule() {
  // --- ÉTATS DES FILTRES BI POUSSÉS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [metricFilter, setMetricFilter] = useState('Tous');

  // --- CONNECTEUR CACHE REACT QUERY ---
  const { data: rawResponse, isLoading, error } = useQuery({
    queryKey: ['commandoPerformances'],
    queryFn: () => CommandoService.getPerformances(),
  });

  // Sécurisation structurelle du flux brut des 14 605 lignes
  const data = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    if (rawResponse && Array.isArray(rawResponse.data)) return rawResponse.data;
    if (rawResponse && Array.isArray(rawResponse.performances)) return rawResponse.performances;
    return [];
  }, [rawResponse]);

  // --- EXTRACTION DYNAMIQUE DES LISTES DE FILTRES UNIQUE (DISTINCT) ---
  const uniqueVilles = useMemo(() => {
    const villes = data.map(r => r.ville).filter(Boolean);
    return [...new Set(villes)].sort();
  }, [data]);

  const uniqueAgents = useMemo(() => {
    const agents = data.map(r => r.agent_promoteur).filter(Boolean);
    return [...new Set(agents)].sort();
  }, [data]);

  const uniqueMetrics = useMemo(() => {
    const metrics = data.map(r => r.metric_category).filter(Boolean);
    return [...new Set(metrics)].sort();
  }, [data]);

  // --- MOTEUR DE FILTRAGE RÉACTIF MULTI-CRITÈRES ---
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(r => {
      if (!r) return false;

      // Filtre Recherche Globale (Commentaires / Impressions)
      const matchesSearch = searchQuery === '' || 
        (r.commentaires && r.commentaires.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.impressions && r.impressions.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtre Ville
      const matchesVille = !villeFilter || (r.ville && r.ville === villeFilter);

      // Filtre Agent
      const matchesAgent = !agentFilter || (r.agent_promoteur && r.agent_promoteur === agentFilter);

      // Filtre Catégorie de Métrique
      const matchesMetric = metricFilter === 'Tous' || (r.metric_category && r.metric_category === metricFilter);

      return matchesSearch && matchesVille && matchesAgent && matchesMetric;
    });
  }, [data, searchQuery, villeFilter, agentFilter, metricFilter]);

  // --- AGREGATIONS & CALCULS KPI DYNAMIQUES ---
  const kpiCounters = useMemo(() => {
    return filteredData.reduce((acc, r) => {
      const valRealise = parseFloat(r.realise) || 0;
      const cat = r.metric_category ? r.metric_category.trim() : '';

      if (cat.includes('Nombre de visite')) {
        acc.visites += valRealise;
      } else if (cat.includes('Vente en cartons')) {
        acc.ventes += valRealise;
      } else if (cat.includes('Gratuité')) {
        acc.gratuites += valRealise;
      } else if (cat.includes('Matériel') || cat.includes('Visibilité')) {
        acc.plv += valRealise;
      }
      return acc;
    }, { visites: 0, ventes: 0 gratuites: 0, plv: 0 });
  }, [filteredData]);

  // --- FORMATAGE DES DONNÉES DE DISTRIBUTION POUR LES GRAPHIQUES ---
  const chartDistributionData = useMemo(() => {
    const groups = {};
    filteredData.forEach(r => {
      const label = r.type_pdv_ou_produit || 'Autre';
      groups[label] = (groups[label] || 0) + (parseFloat(r.realise) || 0);
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const topAgentsData = useMemo(() => {
    const groups = {};
    filteredData.forEach(r => {
      const agent = r.agent_promoteur || 'Inconnu';
      groups[agent] = (groups[agent] || 0) + (parseFloat(r.realise) || 0);
    });

    return Object.entries(groups)
      .map(([name, volume]) => ({ name: name.substring(0, 12), volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 7);
  }, [filteredData]);

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">Erreur de chargement de l'infrastructure BI: {error.message}</Alert></Box>;

  return (
    <Box p={1}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon fontSize="large" /> Console BI Multi-Variables Commando Field
        </Typography>
      </Box>

      {/* Barre de filtrage BI multidimensionnelle */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth size="small" select label="Sélectionner une Ville" 
                value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)}
              >
                <MenuItem value="">Toutes les villes</MenuItem>
                {uniqueVilles.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth size="small" select label="Filtrer par Agent" 
                value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}
              >
                <MenuItem value="">Tous les agents</MenuItem>
                {uniqueAgents.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth size="small" select label="Dimension d'Analyse" 
                value={metricFilter} onChange={(e) => setMetricFilter(e.target.value)}
              >
                <MenuItem value="Tous">Toutes les variables (Vue Globale)</MenuItem>
                {uniqueMetrics.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth size="small" label="Recherche textuelle commentaires"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
          {(villeFilter || agentFilter || metricFilter !== 'Tous' || searchQuery) && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button size="small" variant="outlined" color="error" onClick={() => { setVilleFilter(''); setAgentFilter(''); setMetricFilter('Tous'); setSearchQuery(''); }}>
                Réinitialiser les dimensions de filtrage
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Compteurs Macro KPI */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderLeft: '5px solid #1976d2', bgcolor: '#f0f7ff' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">VISITES DÉPLOYÉES</Typography>
                <Typography variant="h5" fontWeight="bold" color="#0d47a1" mt={0.5}>{kpiCounters.visites.toLocaleString()}</Typography>
              </Box>
              <StoreIcon sx={{ fontSize: 32, color: '#1976d2', opacity: 0.4 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderLeft: '5px solid #2e7d32', bgcolor: '#f3fbf4' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">CARTONS VENDUS</Typography>
                <Typography variant="h5" fontWeight="bold" color="#1b5e20" mt={0.5}>{kpiCounters.ventes.toLocaleString()}</Typography>
              </Box>
              <AssessmentIcon sx={{ fontSize: 32, color: '#2e7d32', opacity: 0.4 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderLeft: '5px solid #ff9800', bgcolor: '#fffdf3' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">GRATUITÉS DISTRIBUÉES</Typography>
                <Typography variant="h5" fontWeight="bold" color="#e65100" mt={0.5}>{kpiCounters.gratuites.toLocaleString()}</Typography>
              </Box>
              <GiftIcon sx={{ fontSize: 32, color: '#ff9800', opacity: 0.4 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ borderLeft: '5px solid #9c27b0', bgcolor: '#fdf4ff' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">LIGNES IMPACTÉES</Typography>
                <Typography variant="h5" fontWeight="bold" color="#4a148c" mt={0.5}>{filteredData.length.toLocaleString()}</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 32, color: '#9c27b0', opacity: 0.4 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visualisations Avancées */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📊 Distribution Volumétrique de la Variable Sélectionnée</Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              {chartDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDistributionData} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" style={{ fontSize: 11 }} width={140} />
                    <ChartTooltip formatter={(v) => v.toLocaleString()} />
                    <Bar dataKey="value" fill="#1976d2" name="Volume Réalisé" radius={[0, 4, 4, 0]}>
                      {chartDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Box display="flex" alignItems="center" justifyContent="center" height="100%"><Typography color="textSecondary">Aucun indicateur disponible</Typography></Box>}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏆 Performance Top Agents (Volume)</Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              {topAgentsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAgentsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" style={{ fontSize: 10 }} />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="volume" fill="#4caf50" name="Unités consolidées" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Box display="flex" alignItems="center" justifyContent="center" height="100%"><Typography color="textSecondary">Aucun classement à établir</Typography></Box>}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Registre exhaustif Audit Commando */}
      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ p: 1, color: '#1a237e' }}>Registre Exhaustif d'Audit Commando Line-by-Line</Typography>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Agent</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Ville</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Indicateur / SKU</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Objectif</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Réalisé</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Taux</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Commentaires / Remarques Terrain</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(0, 100).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.agent_promoteur || 'N/A'}</TableCell>
                  <TableCell>{row.ville || 'N/A'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date_rapport}</TableCell>
                  <TableCell sx={{ color: '#666', fontSize: 11 }}>{row.metric_category}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>{row.type_pdv_ou_produit}</TableCell>
                  <TableCell align="right">{parseFloat(row.objectif) || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: parseFloat(row.realise) > 0 ? '#2e7d32' : 'inherit' }}>{parseFloat(row.realise) || 0}</TableCell>
                  <TableCell align="right" sx={{ color: '#e65100', fontWeight: 500 }}>{parseFloat(row.taux_realisation) ? `${parseFloat(row.taux_realisation).toFixed(1)}%` : '0%'}</TableCell>
                  <TableCell sx={{ fontSize: 11, maxWidth: 250, color: '#555', fontStyle: 'italic' }}>
                    {row.commentaires || row.impressions || '—'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée ne correspond aux critères de filtrage actuels.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, textIndent: 8, color: 'text.secondary' }}>
          Affichage des 100 premières lignes sur un total de {filteredData.length.toLocaleString()} entrées filtrées.
        </Typography>
      </Paper>
    </Box>
  );
}