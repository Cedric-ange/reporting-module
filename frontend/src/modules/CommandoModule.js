import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import axios from 'axios';

function CommandoModule() {
  const [agents, setAgents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentObjectives, setAgentObjectives] = useState(null);
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
    fetchPerformances();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/agents');
      setAgents(response.data.data);
    } catch (error) {
      console.error('Erreur récupération agents:', error);
    }
  };

  const fetchPerformances = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/commando-performances');
      setPerformances(response.data.data);
    } catch (error) {
      console.error('Erreur récupération performances:', error);
    }
  };

  const handleDialogOpen = () => {
    setEditingPerformance(null);
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
    setSelectedAgent(null);
    setAgentObjectives(null);
    setDialogOpen(true);
  };

  const handleEdit = async (performance) => {
    setEditingPerformance(performance);
    setFormData({
      agent_id: performance.agent_id,
      report_date: performance.report_date,
      visits_boutique: performance.visits_boutique || 0,
      visits_superette: performance.visits_superette || 0,
      visits_kiosque: performance.visits_kiosque || 0,
      visits_tablier: performance.visits_tablier || 0,
      visits_pushcart: performance.visits_pushcart || 0,
      sales_premium_16g: performance.sales_premium_16g || 0,
      sales_premium_360g: performance.sales_premium_360g || 0,
      sales_excellence_900g: performance.sales_excellence_900g || 0,
      sales_avoine_50g: performance.sales_avoine_50g || 0,
      sales_avoine_400g: performance.sales_avoine_400g || 0,
      comments: performance.comments || '',
      impressions: performance.impressions || ''
    });
    
    // Charger les données de l'agent
    try {
      const agentResponse = await axios.get(`http://localhost:5000/api/agents/${performance.agent_id}`);
      setSelectedAgent(agentResponse.data.data);
      
      // Charger les objectifs de l'agent
      const objectivesResponse = await axios.get(`http://localhost:5000/api/agents/${performance.agent_id}/objectives`);
      if (objectivesResponse.data.data && objectivesResponse.data.data.length > 0) {
        setAgentObjectives(objectivesResponse.data.data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement données agent:', error);
    }
    
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette performance ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/commando-performances/${id}`);
        fetchPerformances();
      } catch (error) {
        console.error('Erreur suppression performance:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleAgentChange = async (agentId) => {
    setFormData({ ...formData, agent_id: agentId });
    
    if (agentId) {
      try {
        const agentResponse = await axios.get(`http://localhost:5000/api/agents/${agentId}`);
        setSelectedAgent(agentResponse.data.data);
        
        // Charger les objectifs de l'agent
        const objectivesResponse = await axios.get(`http://localhost:5000/api/agents/${agentId}/objectives`);
        if (objectivesResponse.data.data && objectivesResponse.data.data.length > 0) {
          setAgentObjectives(objectivesResponse.data.data[0]);
        } else {
          setAgentObjectives(null);
        }
      } catch (error) {
        console.error('Erreur chargement données agent:', error);
        setSelectedAgent(null);
        setAgentObjectives(null);
      }
    } else {
      setSelectedAgent(null);
      setAgentObjectives(null);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPerformance) {
        await axios.put(`http://localhost:5000/api/commando-performances/${editingPerformance.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/commando-performances', formData);
      }
      fetchPerformances();
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde performance:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const calculateTotalVisits = () => {
    return (formData.visits_boutique || 0) + (formData.visits_superette || 0) + (formData.visits_kiosque || 0) + (formData.visits_tablier || 0) + (formData.visits_pushcart || 0);
  };

  const calculateTotalSales = () => {
    return (formData.sales_premium_16g || 0) + (formData.sales_premium_360g || 0) + (formData.sales_excellence_900g || 0) + (formData.sales_avoine_50g || 0) + (formData.sales_avoine_400g || 0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Reporting Commando - Référents Détaillants
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, background: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                  Performances enregistrées
                </Typography>
                <Typography variant="body2" sx={{ color: '#757575' }}>
                  {performances.length} performance(s)
                </Typography>
              </Box>
              <Fab
                color="primary"
                aria-label="Ajouter"
                onClick={handleDialogOpen}
                size="medium"
                sx={{
                  bgcolor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  '&:hover': {
                    bgcolor: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 3
                }}
              >
                <AddIcon />
              </Fab>
            </Box>

            <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Ville</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Total Visites</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Total Ventes</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performances.map((performance) => (
                    <TableRow 
                      key={performance.id}
                      sx={{ 
                        '&:hover': { bgcolor: '#f5f5f5' },
                        transition: 'bgcolor 0.2s'
                      }}
                    >
                      <TableCell>{performance.report_date}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StoreIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight={500}>{performance.agent_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{performance.city || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            (performance.visits_boutique || 0) + 
                            (performance.visits_superette || 0) + 
                            (performance.visits_kiosque || 0) + 
                            (performance.visits_tablier || 0) + 
                            (performance.visits_pushcart || 0)
                          } 
                          size="small" 
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            (performance.sales_premium_16g || 0) + 
                            (performance.sales_premium_360g || 0) + 
                            (performance.sales_excellence_900g || 0) + 
                            (performance.sales_avoine_50g || 0) + 
                            (performance.sales_avoine_400g || 0)
                          } 
                          size="small" 
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(performance)} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(performance.id)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {performances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 6 }}>
                          <AssessmentIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            Aucune performance enregistrée
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Sélectionnez un agent et créez une nouvelle performance
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingPerformance ? 'Modifier la Performance Commando' : 'Nouvelle Performance Commando'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={formData.agent_id}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  label="Agent *"
                  required
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.agent_number} - {agent.agent_name} ({agent.city || 'Ville non définie'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedAgent && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  mb: 2
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Informations de l'agent : {selectedAgent.agent_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Chip label={`Ville: ${selectedAgent.city || 'Non définie'}`} size="small" />
                    <Chip label={`Tél: ${selectedAgent.phone || 'Non défini'}`} size="small" />
                    <Chip label={`Email: ${selectedAgent.email || 'Non défini'}`} size="small" />
                  </Box>
                  {agentObjectives && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, color: '#757575', fontSize: '0.875rem' }}>
                        Objectifs définis : {agentObjectives.period_start} au {agentObjectives.period_end}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`Boutique: ${agentObjectives.daily_visits_boutique || 0}`} size="small" color="info" />
                        <Chip label={`Superette: ${agentObjectives.daily_visits_superette || 0}`} size="small" color="info" />
                        <Chip label={`Kiosque: ${agentObjectives.daily_visits_kiosque || 0}`} size="small" color="info" />
                        <Chip label={`Tablier: ${agentObjectives.daily_visits_tablier || 0}`} size="small" color="info" />
                        <Chip label={`Pushcart: ${agentObjectives.daily_visits_pushcart || 0}`} size="small" color="info" />
                        <Chip label={`Ventes: ${agentObjectives.weekly_sales_premium_16g || 0}`} size="small" color="info" />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date du rapport *"
                InputLabelProps={{ shrink: true }}
                value={formData.report_date}
                onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon />
                Visites du Jour
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Boutique"
                value={formData.visits_boutique}
                onChange={(e) => setFormData({...formData, visits_boutique: parseInt(e.target.value) || 0})}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#1976d2' }}>🏪</Box> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Superette"
                value={formData.visits_superette}
                onChange={(e) => setFormData({...formData, visits_superette: parseInt(e.target.value) || 0})}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#9c27b0' }}>🏬</Box> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Kiosque"
                value={formData.visits_kiosque}
                onChange={(e) => setFormData({...formData, visits_kiosque: parseInt(e.target.value) || 0})}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#4caf50' }}>🏚️</Box> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Tablier"
                value={formData.visits_tablier}
                onChange={(e) => setFormData({...formData, visits_tablier: parseInt(e.target.value) || 0})}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#ff9800' }}>👕</Box> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Pushcart"
                value={formData.visits_pushcart}
                onChange={(e) => setFormData({...formData, visits_pushcart: parseInt(e.target.value) || 0})}
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#f44336' }}>🛒</Box> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Visites"
                value={calculateTotalVisits()}
                disabled
                InputProps={{ startAdornment: <Box sx={{ mr: 1, color: '#666' }}>📊</Box> }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Ventes de Produits
              </Typography>
            </Grid>

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
                label="Biblos Excellence 900g"
                value={formData.sales_excellence_900g}
                onChange={(e) => setFormData({...formData, sales_excellence_900g: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Flocons Avoine 50g"
                value={formData.sales_avoine_50g}
                onChange={(e) => setFormData({...formData, sales_avoine_50g: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Flocons Avoine 400g"
                value={formData.sales_avoine_400g}
                onChange={(e) => setFormData({...formData, sales_avoine_400g: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Ventes"
                value={calculateTotalSales()}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Commentaires"
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Impressions des PDV et des clients"
                value={formData.impressions}
                onChange={(e) => setFormData({...formData, impressions: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              bgcolor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.2s'
            }}
          >
            {editingPerformance ? 'Modifier' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CommandoModule;