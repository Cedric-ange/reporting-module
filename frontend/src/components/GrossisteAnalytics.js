import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, 
  MenuItem, TextField, Button 
} from '@mui/material';
import { GrossisteService } from '../services/AdvancedServices';

export default function GrossisteAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  
  // --- ÉTATS DES FILTRES MULTICRITÈRES ---
  const [villeFilter, setVilleFilter] = useState('');
  const [grossisteFilter, setGrossisteFilter] = useState('');
  const [produitFilter, setProduitFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [temporelFilter, setTemporelFilter] = useState('Tous'); // Filtre temporel initialisé

  // Chargement initial des données depuis le Service Grossiste
  useEffect(() => {
    const fetchGrossisteData = async () => {
      try {
        setLoading(true);
        const response = await GrossisteService.getPerformances();
        
        // Sécurisation de la structure de retour de l'API
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
        console.error("Erreur de chargement analytique:", err);
        setError("Impossible de charger les données analytiques Grossiste.");
      } finally {
        setLoading(false);
      }
    };
    fetchGrossisteData();
  }, []);

  // --- MOTEUR DE FILTRAGE RÉACTIF SUR TOUTES LES VARIABLES ---
  useEffect(() => {
    if (!Array.isArray(data)) return;

    let result = [...data];

    // 1. Filtre par Ville / Région
    if (villeFilter) {
      result = result.filter(r => r && r.ville && r.ville.toLowerCase().includes(villeFilter.toLowerCase()));
    }
    // 2. Filtre par Nom du Grossiste
    if (grossisteFilter) {
      result = result.filter(r => r && r.grossiste && r.grossiste.toLowerCase().includes(grossisteFilter.toLowerCase()));
    }
    // 3. Filtre par SKU / Format Produit
    if (produitFilter) {
      result = result.filter(r => r && r.format_produit && r.format_produit.toLowerCase() === produitFilter.toLowerCase());
    }
    // 4. Filtre par Niveau de Performance (Statut)
    if (statutFilter !== 'Tous') {
      result = result.filter(r => {
        if (!r) return false;
        const taux = Number(r.taux_realisation) || 0;
        if (statutFilter === 'Atteint') return taux >= 100;
        if (statutFilter === 'Alerte') return taux < 100;
        return true;
      });
    }
    // 5. Filtre Temporel Réactif (Derniers 7 jours vs Derniers 30 jours)
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

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  // --- CALCULS DES INDICATEURS (KPIs) SUR LE PÉRIMÈTRE FILTRÉ ---
  const totalObjectif = filteredData.reduce((sum, row) => sum + (Number(row.objectif_carton) || 0), 0);
  const totalRealisation = filteredData.reduce((sum, row) => sum + (Number(row.realisation_carton) || 0), 0);
  const tauxGlobal = totalObjectif > 0 ? (totalRealisation / totalObjectif) * 100 : 0;

  // Extraction dynamique des formats de produits uniques pour le filtre
  const uniqueProducts = [...new Set(data.map(r => r?.format_produit).filter(Boolean))];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
        Analyse Globale Grossistes (Supabase Cloud)
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Indicateurs calculés en temps réel sur l'ensemble de l'activité des distributeurs.
      </Typography>

      {/* BARRE DE FILTRAGE MULTICRITÈRES SYNCHRONISÉE */}
      <Card sx={{ mb: 4, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* Filtre Ville */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Rechercher une ville"
                value={villeFilter}
                onChange={(e) => setVilleFilter(e.target.value)}
              />
            </Grid>
            {/* Filtre Grossiste */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Nom du grossiste"
                value={grossisteFilter}
                onChange={(e) => setGrossisteFilter(e.target.value)}
              />
            </Grid>
            {/* Filtre Produit */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                select
                label="Format Produit"
                value={produitFilter}
                onChange={(e) => setProduitFilter(e.target.value)}
              >
                <MenuItem value="">Tous les formats</MenuItem>
                {uniqueProducts.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {/* Filtre Statut Performance */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                select
                label="Performance"
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
              >
                <MenuItem value="Tous">Toutes les performances</MenuItem>
                <MenuItem value="Atteint">🟢 Objectif Atteint (≥ 100%)</MenuItem>
                <MenuItem value="Alerte">🔴 En Alerte (&lt; 100%)</MenuItem>
              </TextField>
            </Grid>
            {/* Filtre Temporel Réactif */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                select
                label="Période"
                value={temporelFilter}
                onChange={(e) => setTemporelFilter(e.target.value)}
              >
                <MenuItem value="Tous">Tout l'historique</MenuItem>
                <MenuItem value="7j">7 derniers jours</MenuItem>
                <MenuItem value="30j">30 derniers jours</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Bouton pour réinitialiser rapidement les filtres actifs */}
          {(villeFilter || grossisteFilter || produitFilter || statutFilter !== 'Tous' || temporelFilter !== 'Tous') && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button 
                size="small" 
                color="secondary" 
                onClick={() => {
                  setVilleFilter('');
                  setGrossisteFilter('');
                  setProduitFilter('');
                  setStatutFilter('Tous');
                  setTemporelFilter('Tous');
                }}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* CARTES INDICATEURS CLÉS (KPIS) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '5px solid #1e88e5' }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">OBJECTIF TOTAL DU SÉGMENT</Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#0d47a1' }}>
                {Math.round(totalObjectif).toLocaleString()} Crt
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '5px solid #43a047' }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">RÉALISATION GLOBALE</Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: '#1b5e20' }}>
                {Math.round(totalRealisation).toLocaleString()} Crt
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: tauxGlobal >= 100 ? '#e8f5e9' : '#fff3e0', borderLeft: `5px solid ${tauxGlobal >= 100 ? '#43a047' : '#fb8c00'}` }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" fontWeight="bold">TAUX DE RÉALISATION MOYEN</Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold', color: tauxGlobal >= 100 ? '#1b5e20' : '#e65100' }}>
                {tauxGlobal.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABLEAU DES DONNÉES FILTRÉES */}
      {filteredData.length === 0 ? (
        <Alert severity="info">Aucun enregistrement ne correspond aux critères de filtrage sélectionnés.</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="tableau grossiste">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date Vente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ville / Région</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Grossiste</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Format Produit</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Objectif (Carton)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Réalisation (Carton)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 50).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.date_vente ? new Date(row.date_vente).toLocaleDateString('fr-FR') : 'Indéfinie'}</TableCell>
                    <TableCell>{row.ville || 'N/A'}</TableCell>
                    <TableCell>{row.grossiste || 'N/A'}</TableCell>
                    <TableCell>{row.format_produit || 'N/A'}</TableCell>
                    <TableCell align="right">{Number(row.objectif_carton || 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(row.realisation_carton || 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: Number(row.taux_realisation) >= 100 ? 'green' : 'orange', fontWeight: 'bold' }}>
                      {Number(row.taux_realisation || 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Affichage des 50 premières lignes sur {filteredData.length} enregistrements filtrés.
          </Typography>
        </>
      )}
    </Box>
  );
}