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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

function ETLMImportModule() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('grossiste');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setPreview(null);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setResult(null);
    setPreview(null);
  };

  const handleValidate = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await axios.post('http:///api/etl/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(response.data);
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`http:///api/etl/import/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      setPreview(null);
    } catch (error) {
      console.error('Erreur import:', error);
      alert('Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Import ETL - Normalisation Excel → Base de Données
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon sx={{ color: '#4caf50' }} />
              Sélection du Fichier Excel
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

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Sélectionner un Fichier Excel (.xlsx)
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

            <Box sx={{ display: 'flex', gap: 1 }}>
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
                disabled={!file || loading || (preview && preview.invalid > 0)}
                sx={{ flex: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
              >
                Importer
              </Button>
            </Box>

            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Instructions ETL
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              1. Sélectionnez le type de données (Commando ou Grossiste)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              2. Uploadez votre fichier Excel rempli
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              3. Cliquez sur "Valider" pour vérifier les données
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
              4. Cliquez sur "Importer" pour normaliser et insérer dans la base
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ color: '#1976d2' }}>
              <strong>Note :</strong> Les données sont automatiquement normalisées selon la structure de la base de données pour PowerBI.
            </Typography>
          </Paper>
        </Grid>

        {preview && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Alert severity={preview.invalid > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                <AlertTitle>
                  Résultat de la Validation
                </AlertTitle>
                <Typography variant="body2">
                  Total: {preview.total} | Valides: {preview.valid} | Invalides: {preview.invalid}
                </Typography>
              </Alert>

              {preview.errors && preview.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, color: '#f44336' }}>
                    Erreurs de Normalisation ({preview.errors.length})
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
                        {preview.errors.map((error, idx) => (
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

              {preview.invalid === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <AlertTitle>Validation Réussie</AlertTitle>
                  <Typography variant="body2">
                    Toutes les données peuvent être importées. Cliquez sur "Importer" pour procéder.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
        )}

        {result && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Alert severity={result.summary.inserted > 0 ? 'success' : 'error'} sx={{ mb: 2 }}>
                <AlertTitle>
                  Import Terminé
                </AlertTitle>
                <Typography variant="body2">
                  Total: {result.summary.total} | Insertés: {result.summary.inserted} | Échoués: {result.summary.failed}
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

export default ETLMImportModule;