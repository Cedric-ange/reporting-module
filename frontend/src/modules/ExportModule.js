import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  AlertTitle,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  TrendingUp as PowerBIcon
} from '@mui/icons-material';
import axios from 'axios';

function ExportModule() {
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    type: 'commando',
    agent_id: '',
    date_from: '',
    date_to: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/agents');
      setAgents(response.data.data || []);
    } catch (error) {
      console.error('Erreur récupération agents:', error);
    }
  };

  const handleTypeChange = (event, newType) => {
    setFilters({ ...filters, type: newType });
    setResult(null);
  };

  const handleFilterChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };

  const handleExport = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Utiliser l'endpoint ETL d'export
      const params = {};
      if (filters.agent_id) params.agentId = filters.agent_id;
      if (filters.date_from) params.dateFrom = filters.date_from;
      if (filters.date_to) params.dateTo = filters.date_to;

      const response = await axios.get(`/api/etl/export/${filters.type}`, {
        params,
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BiblosTrack_Export_${filters.type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResult({
        success: true,
        message: 'Export réussi au format PowerBI',
        fileName: `BiblosTrack_Export_${filters.type}_${new Date().toISOString().split('T')[0]}.xlsx`
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Erreur lors de l\'export'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Export Excel - Format PowerBI Optimisé
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudDownloadIcon sx={{ color: '#2196f3' }} />
              Configuration de l'Export
            </Typography>

            <ToggleButtonGroup
              value={filters.type}
              exclusive
              onChange={handleTypeChange}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="commando" sx={{ px: 3 }}>
                Commando
              </ToggleButton>
              <ToggleButton value="grossiste" sx={{ px: 3 }}>
                Grossiste
              </ToggleButton>
            </ToggleButtonGroup>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Agent (optionnel)</InputLabel>
                  <Select
                    value={filters.agent_id}
                    onChange={handleFilterChange('agent_id')}
                    label="Agent (optionnel)"
                  >
                    <MenuItem value="">Tous les agents</MenuItem>
                    {agents.map(agent => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.agent_name} ({agent.agent_number})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date Début (optionnel)"
                  InputLabelProps={{ shrink: true }}
                  value={filters.date_from}
                  onChange={handleFilterChange('date_from')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date Fin (optionnel)"
                  InputLabelProps={{ shrink: true }}
                  value={filters.date_to}
                  onChange={handleFilterChange('date_to')}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={handleExport}
              disabled={loading}
              fullWidth
              sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
              startIcon={<PowerBIcon />}
            >
              {loading ? 'Export en cours...' : 'Exporter au Format PowerBI'}
            </Button>

            {loading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Génération du fichier Excel PowerBI en cours...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Format PowerBI
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              <strong>Dimensions (clés) :</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, pl: 1, color: '#757575' }}>
              • Agent_ID, Agent_Name
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, pl: 1, color: '#757575' }}>
              • Report_Date, City
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, pl: 1, color: '#757575' }}>
              • Grossiste_Name (si applicable)
            </Typography>

            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              <strong>Mesures (valeurs) :</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, pl: 1, color: '#757575' }}>
              • Visits, Sales
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, pl: 1, color: '#757575' }}>
              • Réalisations, Taux
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, pl: 1, color: '#757575' }}>
              • Objectifs
            </Typography>

            <Divider sx={{ my: 2 }} />
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Optimisé PowerBI</AlertTitle>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                Structure plate prête pour l'import direct dans PowerBI
              </Typography>
            </Alert>

            <Chip 
              icon={<PowerBIcon />} 
              label="PowerBI Ready" 
              color="primary" 
              size="small"
              sx={{ mb: 2 }}
            />
          </Paper>
        </Grid>

        {result && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Alert severity={result.success ? 'success' : 'error'}>
                <AlertTitle>
                  {result.success ? 'Export Réussi' : 'Erreur'}
                </AlertTitle>
                <Typography variant="body2">
                  {result.message}
                </Typography>
                {result.fileName && (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Fichier : {result.fileName}
                  </Typography>
                )}
              </Alert>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ExportModule;