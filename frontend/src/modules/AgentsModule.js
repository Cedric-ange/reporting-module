import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Fab,
  Divider,
  Avatar,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  GpsFixed as TargetIcon
} from '@mui/icons-material';
import axios from 'axios';

function AgentsModule() {
  const [agents, setAgents] = useState([]);
  const [tabValue, setTabValue] = useState('agents');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [objectivesDialogOpen, setObjectivesDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [formData, setFormData] = useState({
    agent_number: '',
    agent_name: '',
    city: '',
    phone: '',
    email: ''
  });
  const [objectiveForm, setObjectiveForm] = useState({
    period_start: '',
    period_end: '',
    daily_visits_boutique: 0,
    daily_visits_superette: 0,
    daily_visits_kiosque: 0,
    daily_visits_tablier: 0,
    daily_visits_pushcart: 0,
    weekly_sales_premium_16g: 0
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

  const handleDialogOpen = () => {
    setEditingAgent(null);
    setFormData({
      agent_number: '',
      agent_name: '',
      city: '',
      phone: '',
      email: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_number: agent.agent_number,
      agent_name: agent.agent_name,
      city: agent.city || '',
      phone: agent.phone || '',
      email: agent.email || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      try {
        await axios.delete(`/api/agents/${id}`);
        fetchAgents();
      } catch (error) {
        console.error('Erreur suppression agent:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingAgent) {
        await axios.put(`/api/agents/${editingAgent.id}`, formData);
      } else {
        await axios.post('/api/agents', formData);
      }
      fetchAgents();
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde agent:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleObjectivesDialog = async (agent) => {
    setSelectedAgent(agent);
    setObjectivesDialogOpen(true);
    
    // Récupérer les objectifs existants de l'agent
    try {
      const response = await axios.get(`/api/agents/${agent.id}/objectives`);
      if (response.data.data && response.data.data.length > 0) {
        const latestObjective = response.data.data[0];
        setObjectiveForm({
          period_start: latestObjective.period_start || '',
          period_end: latestObjective.period_end || '',
          daily_visits_boutique: latestObjective.daily_visits_boutique || 0,
          daily_visits_superette: latestObjective.daily_visits_superette || 0,
          daily_visits_kiosque: latestObjective.daily_visits_kiosque || 0,
          daily_visits_tablier: latestObjective.daily_visits_tablier || 0,
          daily_visits_pushcart: latestObjective.daily_visits_pushcart || 0,
          weekly_sales_premium_16g: latestObjective.weekly_sales_premium_16g || 0
        });
        setObjectives(response.data.data);
      } else {
        setObjectiveForm({
          period_start: '',
          period_end: '',
          daily_visits_boutique: 0,
          daily_visits_superette: 0,
          daily_visits_kiosque: 0,
          daily_visits_tablier: 0,
          daily_visits_pushcart: 0,
          weekly_sales_premium_16g: 0
        });
        setObjectives([]);
      }
    } catch (error) {
      console.error('Erreur récupération objectifs:', error);
    }
  };

  const handleSaveObjectives = async () => {
    try {
      await axios.post('/api/objectives', {
        agent_id: selectedAgent.id,
        ...objectiveForm
      });
      setObjectivesDialogOpen(false);
      alert('Objectifs définis avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      alert('Erreur lors de la sauvegarde des objectifs');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Gestion des Agents
      </Typography>

      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          boxShadow: 3,
          background: 'white',
          mb: 3
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 48
              },
              '& .Mui-selected': {
                color: '#1976d2'
              }
            }}
          >
            <Tab label="Liste des Agents" value="agents" />
            <Tab label="Objectifs des Agents" value="objectives" />
          </Tabs>
        </Box>

        {tabValue === 'agents' && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
                  Liste des Agents
                </Typography>
                <Typography variant="body2" sx={{ color: '#757575' }}>
                  {agents.length} agent(s) enregistré(s)
                </Typography>
              </Box>
              <Fab
                color="primary"
                aria-label="Ajouter"
                onClick={handleDialogOpen}
                sx={{
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '10%' }}>N°</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '25%' }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '15%' }}>Ville</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '15%' }}>Téléphone</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '20%' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242', width: '15%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent, index) => (
                    <TableRow 
                      key={agent.id}
                      sx={{ 
                        '&:hover': { bgcolor: '#f5f5f5' },
                        transition: 'bgcolor 0.2s'
                      }}
                    >
                      <TableCell>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea', fontSize: '0.875rem' }}>
                          {agent.agent_number?.charAt(0) || 'A'}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#212121' }}>{agent.agent_name}</TableCell>
                      <TableCell sx={{ color: '#616161' }}>{agent.city || '-'}</TableCell>
                      <TableCell sx={{ color: '#616161' }}>{agent.phone || '-'}</TableCell>
                      <TableCell sx={{ color: '#616161' }}>{agent.email || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleEdit(agent)} 
                          sx={{ 
                            color: '#1976d2',
                            '&:hover': { bgcolor: '#e3f2fd', transform: 'scale(1.1)' },
                            transition: 'all 0.2s'
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => { setTabValue('objectives'); handleObjectivesDialog(agent); }} 
                          sx={{ 
                            color: '#9c27b0',
                            '&:hover': { bgcolor: '#f3e5f5', transform: 'scale(1.1)' },
                            transition: 'all 0.2s'
                          }}
                        >
                          <TargetIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(agent.id)} 
                          sx={{ 
                            color: '#f44336',
                            '&:hover': { bgcolor: '#ffebee', transform: 'scale(1.1)' },
                            transition: 'all 0.2s'
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {agents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 6 }}>
                          <PersonIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            Aucun agent enregistré
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Commencez par ajouter votre premier agent
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {tabValue === 'objectives' && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 2 }}>
                Sélectionner un agent pour définir ses objectifs
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = agents.find(a => a.id === e.target.value);
                    if (agent) handleObjectivesDialog(agent);
                  }}
                  label="Agent"
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.agent_number} - {agent.agent_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedAgent && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Objectifs de {selectedAgent.agent_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#757575' }}>
                    {selectedAgent.city || 'Ville non définie'}
                  </Typography>
                </Box>
                <Button
                  onClick={() => {
                    setObjectiveForm({
                      period_start: '',
                      period_end: '',
                      daily_visits_boutique: 0,
                      daily_visits_superette: 0,
                      daily_visits_kiosque: 0,
                      daily_visits_tablier: 0,
                      daily_visits_pushcart: 0,
                      weekly_sales_premium_16g: 0
                    });
                    setObjectivesDialogOpen(true);
                  }}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    bgcolor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    '&:hover': {
                      bgcolor: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Nouvel Objectif
                </Button>
              </Box>
            )}

            {selectedAgent && objectives.length > 0 && (
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Période</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Boutique</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Superette</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Kiosque</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>Ventes Hebdo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {objectives.map((objective) => (
                      <TableRow 
                        key={objective.id}
                        sx={{ 
                          '&:hover': { bgcolor: '#f5f5f5' },
                          transition: 'bgcolor 0.2s'
                        }}
                      >
                        <TableCell>
                          {objective.period_start} au {objective.period_end}
                        </TableCell>
                        <TableCell>{objective.daily_visits_boutique || 0}</TableCell>
                        <TableCell>{objective.daily_visits_superette || 0}</TableCell>
                        <TableCell>{objective.daily_visits_kiosque || 0}</TableCell>
                        <TableCell>{objective.weekly_sales_premium_16g || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAgent ? 'Modifier l\'Agent' : 'Créer un Nouvel Agent'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="N° Agent *"
                value={formData.agent_number}
                onChange={(e) => setFormData({...formData, agent_number: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom Agent *"
                value={formData.agent_name}
                onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
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
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.2s'
            }}
          >
            {editingAgent ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={objectivesDialogOpen} onClose={() => setObjectivesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Définir les Objectifs pour {selectedAgent?.agent_name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Début de période *"
                InputLabelProps={{ shrink: true }}
                value={objectiveForm.period_start}
                onChange={(e) => setObjectiveForm({...objectiveForm, period_start: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fin de période *"
                InputLabelProps={{ shrink: true }}
                value={objectiveForm.period_end}
                onChange={(e) => setObjectiveForm({...objectiveForm, period_end: e.target.value})}
                required
              />
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Objectifs de Visites (par jour)
            </Typography>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Boutique"
                value={objectiveForm.daily_visits_boutique}
                onChange={(e) => setObjectiveForm({...objectiveForm, daily_visits_boutique: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Superette"
                value={objectiveForm.daily_visits_superette}
                onChange={(e) => setObjectiveForm({...objectiveForm, daily_visits_superette: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Kiosque"
                value={objectiveForm.daily_visits_kiosque}
                onChange={(e) => setObjectiveForm({...objectiveForm, daily_visits_kiosque: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Objectifs de Ventes (par semaine)
            </Typography>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Biblos Lait Premium 16g"
                value={objectiveForm.weekly_sales_premium_16g}
                onChange={(e) => setObjectiveForm({...objectiveForm, weekly_sales_premium_16g: parseInt(e.target.value) || 0})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Button 
            onClick={() => setObjectivesDialogOpen(false)}
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
            onClick={handleSaveObjectives} 
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              bgcolor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              '&:hover': {
                bgcolor: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.2s'
            }}
          >
            Définir les Objectifs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AgentsModule;