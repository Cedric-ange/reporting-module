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
  Card,
  CardContent
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

function GrossisteModule() {
  const [agents, setAgents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [formData, setFormData] = useState({
    agent_id: '',
    report_date: new Date().toISOString().split('T')[0],
    city: '',
    grossiste_name: '',
    personnes_approchees: 0,
    client_acheteur: '',
    realisation_carton: 0,
    gratuit_chapelet_sachet: 0,
    taux_realisation: 0,
    objectif_vente_carton: 0,
    comments: ''
  });

  const metrics = [
    { key: 'personnes_approchees', name: 'Personnes Approchées', color: '#1976d2' },
    { key: 'realisation_carton', name: 'Réalisation (Carton)', color: '#9c27b0' },
    { key: 'gratuit_chapelet_sachet', name: 'Gratuit (Chapelet & Sachet)', color: '#4caf50' },
    { key: 'taux_realisation', name: 'Taux de Réalisation (%)', color: '#ff9800' },
    { key: 'objectif_vente_carton', name: 'Objectif de Vente (Carton)', color: '#f44336' }
  ];

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
      const response = await axios.get('http://localhost:5000/api/grossiste-performances');
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
      city: '',
      grossiste_name: '',
      personnes_approchees: 0,
      client_acheteur: '',
      realisation_carton: 0,
      gratuit_chapelet_sachet: 0,
      taux_realisation: 0,
      objectif_vente_carton: 0,
      comments: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (performance) => {
    setEditingPerformance(performance);
    setFormData({
      agent_id: performance.agent_id,
      report_date: performance.report_date,
      city: performance.city || '',
      grossiste_name: performance.grossiste_name || '',
      personnes_approchees: performance.personnes_approchees || 0,
      client_acheteur: performance.client_acheteur || '',
      realisation_carton: performance.realisation_carton || 0,
      gratuit_chapelet_sachet: performance.gratuit_chapelet_sachet || 0,
      taux_realisation: performance.taux_realisation || 0,
      objectif_vente_carton: performance.objectif_vente_carton || 0,
      comments: performance.comments || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette performance ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/grossiste-performances/${id}`);
        fetchPerformances();
      } catch (error) {
        console.error('Erreur suppression performance:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.agent_id || !formData.grossiste_name) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const dataToSave = {
        ...formData
      };

      if (editingPerformance) {
        await axios.put(`http://localhost:5000/api/grossiste-performances/${editingPerformance.id}`, dataToSave);
      } else {
        await axios.post('http://localhost:5000/api/grossiste-performances', dataToSave);
      }
      fetchPerformances();
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde performance:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Reporting Activation Grossiste
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Performances Grossistes enregistrées ({performances.length})
              </Typography>
              <Fab
                color="primary"
                aria-label="Ajouter"
                onClick={handleDialogOpen}
                size="medium"
              >
                <AddIcon />
              </Fab>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Ville</TableCell>
                    <TableCell>Grossiste</TableCell>
                    <TableCell>Réalisation</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performances.map((performance) => (
                    <TableRow key={performance.id}>
                      <TableCell>{performance.report_date}</TableCell>
                      <TableCell>{performance.agent_name}</TableCell>
                      <TableCell>{performance.city || '-'}</TableCell>
                      <TableCell>{performance.grossiste_name || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight="bold">
                            {performance.realisation_carton || 0} cartons
                          </Typography>
                        </Box>
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
                        <Box sx={{ py: 4 }}>
                          <StoreIcon sx={{ fontSize: 48, color: '#999', mb: 1 }} />
                          <Typography variant="body1" color="text.secondary">
                            Aucune performance grossiste enregistrée
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
          {editingPerformance ? 'Modifier la Performance Grossiste' : 'Nouvelle Performance Grossiste'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({...formData, agent_id: e.target.value})}
                  label="Agent *"
                  required
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.agent_number} - {agent.agent_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom du Grossiste *"
                value={formData.grossiste_name}
                onChange={(e) => setFormData({...formData, grossiste_name: e.target.value})}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon />
                Métriques d'Activation Grossiste
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <TextField
                    fullWidth
                    type="number"
                    label="Personnes Approchées"
                    value={formData.personnes_approchees}
                    onChange={(e) => setFormData({...formData, personnes_approchees: parseInt(e.target.value) || 0})}
                    InputProps={{
                      sx: { 
                        '& input': { 
                          color: '#1976d2',
                          fontWeight: 'bold'
                        } 
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Acheteur"
                value={formData.client_acheteur}
                onChange={(e) => setFormData({...formData, client_acheteur: e.target.value})}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <TextField
                    fullWidth
                    type="number"
                    label="Réalisation (Carton)"
                    value={formData.realisation_carton}
                    onChange={(e) => setFormData({...formData, realisation_carton: parseInt(e.target.value) || 0})}
                    InputProps={{
                      sx: { 
                        '& input': { 
                          color: '#9c27b0',
                          fontWeight: 'bold'
                        } 
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <TextField
                    fullWidth
                    type="number"
                    label="Gratuit (Chapelet & Sachet)"
                    value={formData.gratuit_chapelet_sachet}
                    onChange={(e) => setFormData({...formData, gratuit_chapelet_sachet: parseInt(e.target.value) || 0})}
                    InputProps={{
                      sx: { 
                        '& input': { 
                          color: '#4caf50',
                          fontWeight: 'bold'
                        } 
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <TextField
                    fullWidth
                    type="number"
                    label="Objectif de Vente (Carton)"
                    value={formData.objectif_vente_carton}
                    onChange={(e) => setFormData({...formData, objectif_vente_carton: parseInt(e.target.value) || 0})}
                    InputProps={{
                      sx: { 
                        '& input': { 
                          color: '#f44336',
                          fontWeight: 'bold'
                        } 
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <TextField
                    fullWidth
                    type="number"
                    label="Taux de Réalisation (%)"
                    value={formData.taux_realisation}
                    onChange={(e) => setFormData({...formData, taux_realisation: parseFloat(e.target.value) || 0})}
                    InputProps={{
                      sx: { 
                        '& input': { 
                          color: '#ff9800',
                          fontWeight: 'bold'
                        } 
                      }
                    }}
                    inputProps={{ step: 0.01, max: 100 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
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
              bgcolor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)',
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

export default GrossisteModule;
