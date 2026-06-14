import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon
} from '@mui/icons-material';
import { ETLService } from '../services/AdvancedServices';

function ETLValidator() {
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [transformResult, setTransformResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setTransformResult(null);
      setError(null);
    }
  };

  const handleQuickValidate = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await ETLService.quickValidate(file);
      setValidationResult(result);
    } catch (err) {
      console.error('Erreur validation rapide:', err);
      setError('Erreur lors de la validation rapide');
    } finally {
      setLoading(false);
    }
  };

  const handleFullValidation = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await ETLService.validateFile(file);
      setValidationResult(result);
      setShowDetails(true);
    } catch (err) {
      console.error('Erreur validation complète:', err);
      setError('Erreur lors de la validation complète');
    } finally {
      setLoading(false);
    }
  };

  const handleTransform = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    // D'abord valider
    try {
      setLoading(true);
      setError(null);

      const validationResult = await ETLService.validateFile(file);
      
      if (!validationResult.isValid) {
        setValidationResult(validationResult);
        setLoading(false);
        return;
      }

      // Si validation OK, procéder à la transformation
      const transformData = await ETLService.transformExcelFile(file);
      setTransformResult(transformData);
      setValidationResult(validationResult);
    } catch (err) {
      console.error('Erreur transformation:', err);
      setError('Erreur lors de la transformation ETL');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#2196f3';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Acceptable';
    return 'Insuffisant';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <UploadIcon /> Validation et Transformation ETL
      </Typography>

      {/* Zone d'upload */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              type="file"
              onChange={handleFileChange}
              InputProps={{
                accept: '.xlsx,.xls'
              }}
              helperText="Sélectionnez un fichier Excel grossiste"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleQuickValidate}
              disabled={!file || loading}
            >
              Validation Rapide
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleFullValidation}
              disabled={!file || loading}
              color="primary"
            >
              Validation Complète
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Résultats de validation */}
      {validationResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Résultats de Validation
            </Typography>
            {validationResult.isValid && (
              <Button
                variant="contained"
                color="success"
                onClick={handleTransform}
                disabled={loading}
              >
                Transformer le fichier
              </Button>
            )}
          </Box>

          {/* Score de validation */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Score de validation
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress 
                variant="determinate" 
                value={validationResult.score} 
                sx={{ 
                  flexGrow: 1,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(validationResult.score)
                  }
                }}
              />
              <Typography variant="h6" sx={{ minWidth: 100, color: getScoreColor(validationResult.score) }}>
                {validationResult.score.toFixed(0)}%
              </Typography>
              <Chip 
                label={getScoreLabel(validationResult.score)}
                sx={{ backgroundColor: getScoreColor(validationResult.score), color: 'white' }}
              />
            </Box>
          </Box>

          {/* Conformité ETL */}
          {validationResult.etlCompliance && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Conformité ETL
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Chip label={`Global: ${validationResult.etlCompliance.overall}`} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Chip label={`Structure: ${validationResult.etlCompliance.structure}`} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Chip label={`Qualité: ${validationResult.etlCompliance.dataQuality}`} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Chip label={`Règles ETL: ${validationResult.etlCompliance.etlRules}`} />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Erreurs et avertissements */}
          {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
            <Box mb={3}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography>
                    Détails ({validationResult.errors.length} erreurs, {validationResult.warnings.length} avertissements)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {validationResult.errors.map((err, index) => (
                    <Alert severity="error" key={index} sx={{ mb: 1 }}>
                      <ErrorIcon /> {err.field}: {err.message}
                    </Alert>
                  ))}
                  {validationResult.warnings.map((warn, index) => (
                    <Alert severity="warning" key={index} sx={{ mb: 1 }}>
                      <WarningIcon /> {warn.field}: {warn.message}
                    </Alert>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* Recommandations */}
          {validationResult.recommendations && validationResult.recommendations.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recommandations
              </Typography>
              {validationResult.recommendations.map((rec, index) => (
                <Alert 
                  key={index}
                  severity={rec.type === 'success' ? 'success' : rec.type === 'critical' ? 'error' : 'info'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    {rec.message}
                  </Typography>
                  {rec.actions && (
                    <Box mt={1}>
                      <Typography variant="caption" color="textSecondary">
                        Actions:
                      </Typography>
                      {rec.actions.map((action, actionIndex) => (
                        <Typography variant="caption" key={actionIndex} sx={{ ml: 2 }}>
                          • {action}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Résultats de transformation */}
      {transformResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <SuccessIcon /> Transformation ETL réussie !
          </Alert>

          <Typography variant="h6" gutterBottom>
            Statistiques de la transformation
          </Typography>
          
          {transformResult.statistics && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Lignes transformées
                    </Typography>
                    <Typography variant="h4">
                      {transformResult.statistics.totalRows || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Villes uniques
                    </Typography>
                    <Typography variant="h4">
                      {transformResult.statistics.uniqueCities || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Grossistes uniques
                    </Typography>
                    <Typography variant="h4">
                      {transformResult.statistics.uniqueGrossistes || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total ventes
                    </Typography>
                    <Typography variant="h4">
                      {transformResult.statistics.totalSales?.toFixed(1) || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Aperçu des données transformées */}
          {transformResult.data && transformResult.data.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Aperçu des données transformées (5 premières lignes)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Ville</TableCell>
                      <TableCell>Grossiste</TableCell>
                      <TableCell>Produit</TableCell>
                      <TableCell>Objectif</TableCell>
                      <TableCell>Réalisation</TableCell>
                      <TableCell>Taux (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transformResult.data.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.Date}</TableCell>
                        <TableCell>{row.Ville}</TableCell>
                        <TableCell>{row.Grossiste}</TableCell>
                        <TableCell>{row.Format}</TableCell>
                        <TableCell>{row['Objectif carton']?.toFixed(2)}</TableCell>
                        <TableCell>{row['Réalisation carton']?.toFixed(2)}</TableCell>
                        <TableCell>{row['Taux de réalisation']?.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" sx={{ mt: 2 }}>
                Total: {transformResult.data.length} lignes transformées
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default ETLValidator;