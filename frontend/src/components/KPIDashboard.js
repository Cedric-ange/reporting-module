import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Assessment as KPIIcon,
  TrendingUp,
  TrendingDown,
  Warning as AlertIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { KPIService } from '../services/AdvancedServices';

function KPIDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKPIs] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpiData, alertsData] = await Promise.all([
        KPIService.getGlobalKPIs(),
        KPIService.getAlerts()
      ]);

      setKPIs(kpiData.kpis);
      setAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Erreur récupération KPIs:', err);
      setError('Erreur lors de la récupération des KPIs');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 150) return '#4caf50'; // green
    if (rate >= 100) return '#2196f3'; // blue
    if (rate >= 75) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const getPerformanceLabel = (rate) => {
    if (rate >= 150) return 'Excellent';
    if (rate >= 100) return 'Atteint';
    if (rate >= 75) return 'Satisfaisant';
    return 'Insuffisant';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!kpis) {
    return (
      <Box p={3}>
        <Alert severity="info">Aucune donnée KPI disponible</Alert>
      </Box>
    );
  }

  const global = kpis.global || {};
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <KPIIcon /> Tableau de Bord KPIs
      </Typography>

      {/* Alertes */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <Box mb={3}>
          {criticalAlerts.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertIcon /> {criticalAlerts.length} alerte(s) critique(s) détectée(s)
            </Alert>
          )}
          {warningAlerts.length > 0 && (
            <Alert severity="warning">
              <WarningIcon /> {warningAlerts.length} avertissement(s) à surveiller
            </Alert>
          )}
        </Box>
      )}

      {/* KPIs Globaux */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Ventes Totales
              </Typography>
              <Typography variant="h4">
                {global.totalSales?.toFixed(1) || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                cartons
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Objectifs
              </Typography>
              <Typography variant="h4">
                {global.totalObjectives?.toFixed(1) || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                cartons
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Taux Réalisation
              </Typography>
              <Typography variant="h4" sx={{ color: getPerformanceColor(global.globalAchievementRate || 0) }}>
                {global.globalAchievementRate?.toFixed(1) || 0}%
              </Typography>
              <Chip 
                label={getPerformanceLabel(global.globalAchievementRate || 0)}
                size="small"
                sx={{ backgroundColor: getPerformanceColor(global.globalAchievementRate || 0), color: 'white' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Visites Totales
              </Typography>
              <Typography variant="h4">
                {global.totalVisits || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                personnes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance par Agent */}
      {kpis.byAgent && Object.keys(kpis.byAgent).length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Performance par Agent
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(kpis.byAgent).slice(0, 6).map(([agentId, agentData]) => (
              <Grid item xs={12} md={4} key={agentId}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {agentData.agentName}
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary">
                        Taux de réalisation
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Box flexGrow={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(agentData.achievementRate, 100)} 
                            sx={{ 
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getPerformanceColor(agentData.achievementRate)
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ ml: 2, minWidth: 50 }}>
                          {agentData.achievementRate?.toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary">
                        Ventes: {agentData.totalSales?.toFixed(1)} cartons
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Visites: {agentData.totalVisits}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Qualité des données */}
      {global.dataQuality && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Qualité des Données
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Complétude
                  </Typography>
                  <Typography variant="h6">
                    {global.dataQuality.completeness || 0}%
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Champs manquants
                  </Typography>
                  <Typography variant="h6" color={global.dataQuality.missingFields > 0 ? 'error' : 'textPrimary'}>
                    {global.dataQuality.missingFields || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Qualité globale
                  </Typography>
                  <Chip 
                    label={global.dataQuality.quality || 'unknown'}
                    color={global.dataQuality.quality === 'excellent' ? 'success' : 'default'}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Champs totaux
                  </Typography>
                  <Typography variant="h6">
                    {global.dataQuality.totalFields || 0}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Alertes détaillées */}
      {alerts.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Alertes et Recommandations
          </Typography>
          <Grid container spacing={2}>
            {alerts.slice(0, 5).map((alert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Alert 
                  severity={alert.type === 'critical' ? 'error' : 'warning'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    <strong>{alert.agentName || 'Système'}:</strong> {alert.message}
                  </Typography>
                  {alert.recommendation && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {alert.recommendation}
                    </Typography>
                  )}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default KPIDashboard;