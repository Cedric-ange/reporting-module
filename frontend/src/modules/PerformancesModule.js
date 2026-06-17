import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Fab
} from '@mui/material';
import {
  Save as SaveIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';

function PerformancesModule() {
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    agent_id: '',
    report_date: new Date().toISOString().split('T')[0],
    visits_boutique: 0,
    visits_superette: 0,
    visits_kiosque: 0,
    visits_tablier: 0,
    visits_pushcart: 0,
    sales_premium_16g: 0,
    sales_premium_360g: 0,
    sales_excellence_900g: 0,
    sales_avoine_50g: 0,
    sales_avoine_400g: 0,
    comments: '',
    impressions: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/agents');
      setAgents(response.data.data);
    } catch (error) {
      console.error('Erreur récupération agents:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/performances', {
        ...formData,
        agent_id: parseInt(formData.agent_id)
      });
      alert('Performance enregistrée avec succès');
      setFormData({
        agent_id: '',
        report_date: new Date().toISOString().split('T')[0],
        visits_boutique: 0,
        visits_superette: 0,
        visits_kiosque: 0,
        visits_tablier: 0,
        visits_pushcart: 0,
        sales_premium_16g: 0,
        sales_premium_360g: 0,
        sales_excellence_900g: 0,
        sales_avoine_50g: 0,
        sales_avoine_400g: 0,
        comments: '',
        impressions: ''
      });
    } catch (error) {
      console.error('Erreur sauvegarde performance:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Saisie des Performances
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Fab
                color="primary"
                aria-label="Enregistrer"
                onClick={handleSave}
                sx={{ float: 'right' }}
              >
                <SaveIcon />
              </Fab>
              <Typography variant="h6">
                Formulaire de Performance
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Agent *</InputLabel>
              <Select
                value={formData.agent_id}
                onChange={(e) => setFormData({...formData, agent_id: e.target.value})}
                required
              >
                <MenuItem value="">Sélectionner un agent</MenuItem>
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.agent_number} - {agent.agent_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Date du rapport *</InputLabel>
              <TextField
                type="date"
                fullWidth
                value={formData.report_date}
                onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </FormControl>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Visites par Type de PDV
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Boutique"
                  value={formData.visits_boutique}
                  onChange={(e) => setFormData({...formData, visits_boutique: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superette"
                  value={formData.visits_superette}
                  onChange={(e) => setFormData({...formData, visits_superette: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Kiosque"
                  value={formData.visits_kiosque}
                  onChange={(e) => setFormData({...formData, visits_kiosque: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tablier"
                  value={formData.visits_tablier}
                  onChange={(e) => setFormData({...formData, visits_tablier: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Pushcart"
                  value={formData.visits_pushcart}
                  onChange={(e) => setFormData({...formData, visits_pushcart: parseInt(e.target.value) || 0})}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Ventes par Produit
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Biblos Lait Premium 16g"
                  value={formData.sales_premium_16g}
                  onChange={(e) => setFormData({...formData, sales_premium_16g: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Biblos Lait Premium 360g"
                  value={formData.sales_premium_360g}
                  onChange={(e) => setFormData({...formData, sales_premium_360g: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Biblos Lait Excellence 900g"
                  value={formData.sales_excellence_900g}
                  onChange={(e) => setFormData({...formData, sales_excellence_900g: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Biblos Flocon d'avoine 50g"
                  value={formData.sales_avoine_50g}
                  onChange={(e) => setFormData({...formData, sales_avoine_50g: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Biblos Flocon d'avoine 400g"
                  value={formData.sales_avoine_400g}
                  onChange={(e) => setFormData({...formData, sales_avoine_400g: parseInt(e.target.value) || 0})}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Commentaires et Impressions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Commentaires"
                  value={formData.comments}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Impressions des PDV et des clients"
                  value={formData.impressions}
                  onChange={(e) => setFormData({...formData, impressions: e.target.value})}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="h6">
              Instructions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            1. Sélectionnez l'agent et la date du rapport<br />
            2. Remplissez les visites par type de PDV<br />
            3. Enregistrez les ventes par produit<br />
            4. Ajoutez vos commentaires et impressions du terrain<br />
            5. Les données seront sauvegardées dans la base de données SQLite
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PerformancesModule;