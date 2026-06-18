import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, MenuItem, TextField } from '@mui/material';
import { GrossisteService } from '../services/AdvancedServices'; // Notre service mis à jour

export default function GrossisteAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  // Filtres macro (à la place des anciens filtres par agent)
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');

  useEffect(() => {
    const fetchGrossisteData = async () => {
      try {
        setLoading(true);
        // Appel de notre nouvel endpoint global sans restriction d'agent
        const records = await GrossisteService.getPerformances({
          ville: villeFilter,
          grossiste: grossisteFilter
        });
        setData(records);
      } catch (err) {
        setError("Impossible de charger les données analytiques Grossiste.");
      } finally {
        setLoading(false);
      }
    };
    fetchGrossisteData();
  }, [villeFilter, grossisteFilter]);

  // Calculs d'indicateurs (KPIs) en temps réel sur les 735 lignes
  const totalObjectif = data.reduce((sum, row) => sum + (Number(row.objectif_carton) || 0), 0);
  const totalRealisation = data.reduce((sum, row) => sum + (Number(row.realisation_carton) || 0), 0);
  const globalTaux = totalObjectif > 0 ? ((totalRealisation / totalObjectif) * 100).toFixed(1) : 0;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        📈 Analyse Concrète du Canal Grossistes
      </Typography>

      {/* Barre de Filtres macro */}
      <Box display="flex" gap={2} my={3}>
        <TextField
          label="Filtrer par Ville"
          variant="outlined"
          size="small"
          value={villeFilter}
          onChange={(e) => setVilleFilter(e.target.value)}
          placeholder="Ex: Abidjan..."
        />
        {/* Ajoutez d'autres filtres si nécessaire */}
      </Box>

      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <>
          {/* Cartes KPI */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Typography color="textSecondary" variant="subtitle2">Objectif Total Global</Typography>
                  <Typography variant="h4" fontWeight="bold">{totalObjectif.toLocaleString()} Crt</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Typography color="textSecondary" variant="subtitle2">Réalisation Totale</Typography>
                  <Typography variant="h4" fontWeight="bold" color="green">{totalRealisation.toLocaleString()} Crt</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography color="textSecondary" variant="subtitle2">Taux d'Efficacité Global</Typography>
                  <Typography variant="h4" fontWeight="bold" color="orange">{globalTaux}%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tableau d'affichage des lignes réelles de Supabase */}
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Ville</TableCell>
                  <TableCell>Grossiste</TableCell>
                  <TableCell>Produit (Format)</TableCell>
                  <TableCell align="right">Objectif (Carton)</TableCell>
                  <TableCell align="right">Réalisation (Carton)</TableCell>
                  <TableCell align="right">Taux (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 50).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.date_vente).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{row.ville}</TableCell>
                    <TableCell>{row.grossiste}</TableCell>
                    <TableCell>{row.format_produit}</TableCell>
                    <TableCell align="right">{row.objectif_carton}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.realisation_carton}</TableCell>
                    <TableCell align="right" sx={{ color: row.taux_realisation >= 100 ? 'green' : 'orange' }}>
                      {Number(row.taux_realisation).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Affichage des 50 premières lignes sur {data.length} enregistrements trouvés dans Supabase.
          </Typography>
        </>
      )}
    </Box>
  );
}