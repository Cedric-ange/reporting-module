import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Flag as ObjectiveIcon,
  TrendingUp as TrendIcon,
  Warning as AlertIcon,
  Lightbulb as RecommendationIcon
} from '@mui/icons-material';
import { ObjectiveService } from '../services/AdvancedServices';

function ObjectiveTracker() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [tabValue, setTabValue] = useState('dashboard');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ObjectiveService.getObjectivesDashboard();
      setDashboard(data.dashboard);
    } catch (err) {
      console.error('Erreur récupération dashboard objectifs:', err);
      setError('Erreur lors de la récupération du tableau de bord objectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 150) return '#4caf50';
    if (rate >= 100) return '#2196f3';
    if (rate >= 75) return '#ff9800';
    return '#f44336';
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

  if (!dashboard) {
    return (
      <Box p={3}>
        <Alert severity="info">Aucune donnée d'objectif disponible</Alert>
      </Box>
    );
  }

  const summary = dashboard.summary || {};
  const performanceOverview = dashboard.performanceOverview || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <ObjectiveIcon /> Suivi des Objectifs
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Tableau de Bord" value="dashboard" />
        <Tab label={`Alertes (${dashboard.alerts?.length || 0})`} value="alerts" />
        <Tab label={`Recommandations (${dashboard.recommendations?.length || 0})`} value="recommendations" />
      </Tabs>

      {/* Tableau de Bord */}
      {tabValue === 'dashboard' && (
        <Box>
          {/* Résumé */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Agents actifs
                  </Typography>
                  <Typography variant="h4">
                    {summary.totalAgents || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {summary.agentsWithObjectives || 0} avec objectifs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Taux de réalisation moyen
                  </Typography>
                  <Typography variant="h4" sx={{ color: getPerformanceColor(summary.averageAchievementRate || 0) }}>
                    {summary.averageAchievementRate?.toFixed(1) || 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Alertes actives
                  </Typography>
                  <Typography variant="h4" color={summary.totalAlerts > 0 ? 'error' : 'textPrimary'}>
                    {summary.totalAlerts || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {summary.criticalAlerts || 0} critiques
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    Couverture objectives
                  </Typography>
                  <Typography variant="h4">
                    {summary.agentsWithObjectives && summary.totalAgents ? 
                      ((summary.agentsWithObjectives / summary.totalAgents) * 100).toFixed(0) : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Performers */}
          {performanceOverview.topPerformers && performanceOverview.topPerformers.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                <TrendIcon /> Meilleurs Performeurs
              </Typography>
              <Grid container spacing={2}>
                {performanceOverview.topPerformers.map((performer, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {performer.agentName}
                        </Typography>
                        <Box mt={2}>
                          <Typography variant="body2" color="textSecondary">
                            Taux de réalisation
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#4caf50' }}>
                            {performer.achievementRate?.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Ventes: {performer.totalSales?.toFixed(1)} cartons
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Under Performers */}
          {performanceOverview.underPerformers && performanceOverview.underPerformers.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                <AlertIcon /> Agents sous-performants
              </Typography>
              <Grid container spacing={2}>
                {performanceOverview.underPerformers.map((performer, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card sx={{ borderLeft: '4px solid #f44336' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {performer.agentName}
                        </Typography>
                        <Box mt={2}>
                          <Typography variant="body2" color="textSecondary">
                            Taux de réalisation
                          </Typography>
                          <Typography variant="h4" sx={{ color: '#f44336' }}>
                            {performer.achievementRate?.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Objectif: {performer.totalObjectives?.toFixed(1)} cartons
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Alertes */}
      {tabValue === 'alerts' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Alertes et Notifications
          </Typography>
          {dashboard.alerts && dashboard.alerts.length > 0 ? (
            <List>
              {dashboard.alerts.map((alert, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AlertIcon color={alert.type === 'critical' ? 'error' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.agentName || 'Système'}
                    secondary={
                      <Box>
                        {alert.message}
                        <Chip 
                          label={alert.type}
                          size="small"
                          color={alert.type === 'critical' ? 'error' : 'warning'}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="success">Aucune alerte active - Tout va bien !</Alert>
          )}
        </Box>
      )}

      {/* Recommandations */}
      {tabValue === 'recommendations' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            <RecommendationIcon /> Recommandations
          </Typography>
          {dashboard.recommendations && dashboard.recommendations.length > 0 ? (
            <Grid container spacing={2}>
              {dashboard.recommendations.map((rec, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ 
                    borderLeft: `4px solid ${rec.priority === 'high' ? '#f44336' : rec.priority === 'medium' ? '#ff9800' : '#4caf50'}`
                  }}>
                    <CardContent>
                      <Chip 
                        label={rec.priority}
                        size="small"
                        color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'success'}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {rec.message}
                      </Typography>
                      {rec.actions && rec.actions.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Actions recommandées:
                          </Typography>
                          {rec.actions.map((action, actionIndex) => (
                            <Typography variant="body2" key={actionIndex} sx={{ ml: 2 }}>
                              • {action}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">Aucune recommandation pour le moment</Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ObjectiveTracker;