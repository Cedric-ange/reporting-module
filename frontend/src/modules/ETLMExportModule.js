import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import axios from 'axios';

function ETLMExportModule() {
  const [type, setType] = useState('grossiste');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setResult(null);
  };

  const handleExport = async () => {
    setLoading(true);
    setResult(null);

    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    try {
      const response = await axios.get(`http:///api/etl/export/${type}`, {
        params,
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PowerBI_Export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResult({
        success: true,
        message: 'Export réussi'
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setResult({
        success: false,
        message: 'Erreur lors de l\'export'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Export ETL - Base de Données → Excel (PowerBI)
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DownloadIcon sx={{ color: '#2196f3' }} />
              Configuration de l'Export
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type de Données</InputLabel>
              <Select
                value={type}
                onChange={handleTypeChange}
                label="Type de Données"
              >
                <MenuItem value="commando">Commando</MenuItem>
                <MenuItem value="grossiste">Activation Grossiste</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Date Début (optionnel)"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Date Fin (optionnel)"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={handleExport}
              disabled={loading}
              fullWidth
              sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
              startIcon={<DownloadIcon />}
            >
              {loading ? 'Export en cours...' : 'Exporter vers Excel PowerBI'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Format PowerBI
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              Les données exportées sont normalisées au format suivant :
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              • Dimensions (clés) : Agent_ID, Agent_Name, Report_Date, City
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              • Mesures (valeurs) : Ventas, Visits, etc.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              • Structure plate pour PowerBI (facile à importer)
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ color: '#1976d2' }}>
              <strong>Note :</strong> Le fichier est prêt à être importé directement dans PowerBI pour créer des tableaux de bord.
            </Typography>
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
              </Alert>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ETLMExportModule;