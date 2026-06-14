import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  AlertTitle,
  LinearProgress,
  Chip,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Validation as ValidationIcon
} from '@mui/icons-material';
import axios from 'axios';

function ImportModule() {
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('commando');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setValidationErrors([]);
    setPreviewMode(false);
  };

  const handleTypeChange = (event, newType) => {
    setImportType(newType);
    setResult(null);
    setValidationErrors([]);
    setPreviewMode(false);
  };

  const handleValidate = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier Excel');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', importType);

    try {
      // Utiliser l'endpoint ETL de validation
      const response = await axios.post('http://localhost:5000/api/etl/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      setValidationErrors(response.data.errors || []);
      setPreviewMode(true);
    } catch (error) {
      console.error('Erreur validation:', error);
      setValidationErrors([{
        row: 'Global',
        error: error.response?.data?.error || error.message || 'Erreur lors de la validation'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier Excel');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Utiliser l'endpoint ETL d'import
      const response = await axios.post(`http://localhost:5000/api/etl/import/${importType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      setPreviewMode(false);
    } catch (error) {
      console.error('Erreur import:', error);
      setValidationErrors([{
        row: 'Global',
        error: error.response?.data?.error || error.message || 'Erreur lors de l\'import'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateUrl = importType === 'commando' 
      ? 'http://localhost:5000/api/export/excel' 
      : 'http://localhost:5000/api/etl/export/grossiste';
    
    window.open(templateUrl, '_blank');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Import Excel - Normalisation Automatique
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon sx={{ color: '#4caf50' }} />
              Import de Données Excel
            </Typography>

            <ToggleButtonGroup
              value={importType}
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

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Sélectionner un Fichier Excel (.xlsx/.xls)
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </Button>

            {file && (
              <Box sx={{ mb: 2 }}>
                <Chip label={file.name} color="primary" size="small" />
                <Typography variant="body2" sx={{ mt: 1, color: '#757575' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={!file || loading}
                sx={{ flex: 1, bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
              >
                Valider
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!file || loading || (previewMode && validationErrors.length > 0)}
                sx={{ flex: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
              >
                Importer
              </Button>
            </Box>

            <Button
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<CloudDownloadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Télécharger Template Excel
            </Button>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Instructions d'Import
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              1. Sélectionnez le type (Commando ou Grossiste)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              2. Téléchargez le template Excel correspondant
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              3. Remplissez le fichier avec vos données
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#757575' }}>
              4. Cliquez sur "Valider" pour vérifier
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              5. Cliquez sur "Importer" pour sauvegarder
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Normalisation ETL</AlertTitle>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                Les données sont automatiquement normalisées : numéros, pourcentages, dates
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {previewMode && result && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Alert severity={result.invalid === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <AlertTitle>
                  Prévisualisation de Validation
                </AlertTitle>
                <Typography variant="body2">
                  Total: {result.total} | Valides: {result.valid} | Invalides: {result.invalid}
                </Typography>
              </Alert>

              {validationErrors && validationErrors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: '#f44336' }}>
                    Erreurs Détectées ({validationErrors.length})
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ligne</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Erreur</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationErrors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                              Ligne {error.row}
                            </TableCell>
                            <TableCell sx={{ color: '#d32f2f' }}>
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {result.invalid === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <AlertTitle>Validation Réussie</AlertTitle>
                  <Typography variant="body2">
                    Toutes les données sont valides. Cliquez sur "Importer" pour procéder.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
        )}

        {result && !previewMode && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Alert severity={result.summary?.inserted > 0 ? 'success' : 'error'} sx={{ mb: 2 }}>
                <AlertTitle>
                  Import Terminé
                </AlertTitle>
                <Typography variant="body2">
                  Total: {result.summary?.total || 0} | Insertés: {result.summary?.inserted || 0} | Échoués: {result.summary?.failed || 0}
                </Typography>
              </Alert>

              {result.insertionErrors && result.insertionErrors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: '#f44336' }}>
                    Erreurs d'Insertion ({result.insertionErrors.length})
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Donnée</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Erreur</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.insertionErrors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {JSON.stringify(error.data).substring(0, 50)}...
                            </TableCell>
                            <TableCell sx={{ color: '#d32f2f' }}>
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ImportModule;