import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GrossisteService } from '../services/AdvancedServices';

export default function GrossisteDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const records = await GrossisteService.getPerformances();
        setData(records);
        setFilteredData(records);
      } catch (err) {
        setError("Impossible de charger les données analytiques de Supabase.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = data;
    if (villeFilter) {
      result = result.filter(row => row.ville?.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    if (grossisteFilter) {
      result = result.filter(row => row.grossiste?.toLowerCase().includes(grossisteFilter.toLowerCase()));
    }
    setFilteredData(result);
  }, [villeFilter, grossisteFilter, data]);

  // KPIs
  const totalObj = filteredData.reduce((sum, r) => sum + (Number(r.objectif_carton) || 0), 0);
  const totalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const tauxGlobal = totalObj > 0 ? ((totalReal / totalObj) * 100).toFixed(1) : 0;

  // Agrégation Recharts (Top Villes)
  const getChartData = () => {
    const aggregation = {};
    filteredData.forEach(row => {
      const key = row.ville || 'Inconnu';
      if (!aggregation[key]) {
        aggregation[key] = { name: key, Objectif: 0, Réalisation: 0 };
      }
      aggregation[key].Objectif += Number(row.objectif_carton) || 0;
      aggregation[key].Réalisation += Number(row.realisation_carton) || 0;
    });
    return Object.values(aggregation).slice(0, 8);
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (error) return <Box p={2}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#1a237e' }}>
        📊 Suivi d'Activité Grossistes
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Analyse consolidée basée sur les {data.length} lignes historiques de Supabase.
      </Typography>

      <Box display="flex" gap={2} mb={4} component={Paper} p={2} variant="outlined">
        <TextField
          label="Filtrer par ville"
          variant="outlined"
          size="small"
          value={villeFilter}
          onChange={(e) => setVilleFilter(e.target.value)}
          sx={{ width: 250 }}
        />
        <TextField
          label="Filtrer par grossiste"
          variant="outlined"
          size="small"
          value={grossisteFilter}
          onChange={(e) => setGrossisteFilter(e.target.value)}
          sx={{ width: 250 }}
        />
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #1976d2' }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">OBJECTIF TOTAL</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1976d2" mt={1}>
                {Math.round(totalObj).toLocaleString()} <span style={{ fontSize: 16 }}>Crt</span>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #388e3c' }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">RÉALISATION TOTALE</Typography>
              <Typography variant="h4" fontWeight="bold" color="#388e3c" mt={1}>
                {Math.round(totalReal).toLocaleString()} <span style={{ fontSize: 16 }}>Crt</span>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${tauxGlobal >= 100 ? '#2e7d32' : '#f57c00'}` }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">TAUX DE RÉALISATION</Typography>
              <Typography variant="h4" fontWeight="bold" color={tauxGlobal >= 100 ? '#2e7d32' : '#f57c00'} mt={1}>
                {tauxGlobal}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            📈 Comparatif Objectif vs Réalisation par Région (Cartons)
          </Typography>
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => Math.round(value).toLocaleString()} />
                <Legend />
                <Bar dataKey="Objectif" fill="#90caf9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Réalisation" fill="#4caf50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        📋 Registre des Ventes Grossistes
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Ville</TableCell>
              <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Grossiste</TableCell>
              <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Format</TableCell>
              <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Objectif</TableCell>
              <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Réalisation</TableCell>
              <TableCell align="right" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>Taux</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.slice(0, 100).map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{new Date(row.date_vente).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{row.ville}</TableCell>
                <TableCell>{row.grossiste}</TableCell>
                <TableCell>{row.format_produit}</TableCell>
                <TableCell align="right">{Math.round(row.objective_carton || row.objectif_carton)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Math.round(row.realisation_carton)}</TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  color: row.taux_realisation >= 100 ? '#2e7d32' : '#f57c00' 
                }}>
                  {Number(row.taux_realisation).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}