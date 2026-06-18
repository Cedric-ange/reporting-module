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
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import axios from 'axios';

const emptyForm = {
  report_date: new Date().toISOString().split('T')[0],
  enseigne: '',
  pdv: '',
  contacts_objectif: 0,
  contacts_realise: 0,
  acheteurs_objectif: 0,
  acheteurs_realise: 0,
  real_premium_16g: 0,
  real_premium_360g: 0,
  real_excellence_900g: 0,
  real_avoine_50g: 0,
  real_avoine_400g: 0,
  real_3en1_cafe: 0,
  gratuite_premium_16g: 0,
  gratuite_avoine: 0,
  gratuite_3en1: 0,
  goodies1: 0,
  goodies2: 0,
  goodies3: 0,
  goodies4: 0,
  comments: ''
};

const numericFields = [
  { key: 'contacts_objectif', label: 'Contacts objectif' },
  { key: 'contacts_realise', label: 'Contacts réalisé' },
  { key: 'acheteurs_objectif', label: 'Acheteurs objectif' },
  { key: 'acheteurs_realise', label: 'Acheteurs réalisé' },
  { key: 'real_premium_16g', label: 'Lait Premium 16g' },
  { key: 'real_premium_360g', label: 'Lait Premium 360g' },
  { key: 'real_excellence_900g', label: 'Lait Excellence 900g' },
  { key: 'real_avoine_50g', label: 'Avoine 50g' },
  { key: 'real_avoine_400g', label: 'Avoine 400g' },
  { key: 'real_3en1_cafe', label: '3 en 1 Café au lait' },
  { key: 'gratuite_premium_16g', label: 'Gratuité Premium 16g' },
  { key: 'gratuite_avoine', label: 'Gratuité Avoine' },
  { key: 'gratuite_3en1', label: 'Gratuité 3 en 1' },
  { key: 'goodies1', label: 'Goodies 1' },
  { key: 'goodies2', label: 'Goodies 2' },
  { key: 'goodies3', label: 'Goodies 3' },
  { key: 'goodies4', label: 'Goodies 4' }
];

function PromoPaqueModule() {
  const [performances, setPerformances] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchPerformances();
  }, []);

  const fetchPerformances = async () => {
    try {
      const response = await axios.get('/api/promo-paque-performances');
      if (response.data && Array.isArray(response.data.data)) {
        setPerformances(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération performances promo pâque:', error);
    }
  };

  const handleDialogOpen = () => {
    setEditingPerformance(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (performance) => {
    setEditingPerformance(performance);
    const next = { ...emptyForm };
    Object.keys(emptyForm).forEach((key) => {
      next[key] = performance[key] !== undefined && performance[key] !== null ? performance[key] : emptyForm[key];
    });
    setFormData(next);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
      try {
        await axios.delete(`/api/promo-paque-performances/${id}`);
        fetchPerformances();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.enseigne || !formData.pdv) {
      alert('Veuillez renseigner au moins l\'Enseigne et le PDV');
      return;
    }
    try {
      if (editingPerformance) {
        await axios.put(`/api/promo-paque-performances/${editingPerformance.id}`, formData);
      } else {
        await axios.post('/api/promo-paque-performances', formData);
      }
      fetchPerformances();
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', mb: 3 }}>
        Reporting Campagne Promo Pâque
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Lignes Promo Pâque enregistrées ({performances.length})
              </Typography>
              <Fab color="primary" aria-label="Ajouter" onClick={handleDialogOpen} size="medium">
                <AddIcon />
              </Fab>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Enseigne</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>PDV</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contacts (réal./obj.)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Acheteurs (réal./obj.)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performances.map((performance) => (
                    <TableRow key={performance.id} hover>
                      <TableCell>{performance.report_date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{performance.enseigne}</TableCell>
                      <TableCell>{performance.pdv}</TableCell>
                      <TableCell>
                        {performance.contacts_realise || 0} / {performance.contacts_objectif || 0}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight="bold">
                            {performance.acheteurs_realise || 0} / {performance.acheteurs_objectif || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(performance)} color="primary" size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(performance.id)} color="error" size="small">
                          <DeleteIcon fontSize="small" />
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
                            Aucune ligne Promo Pâque enregistrée
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
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          {editingPerformance ? 'Modifier la ligne Promo Pâque' : 'Nouvelle ligne Promo Pâque'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Date du rapport *"
                InputLabelProps={{ shrink: true }}
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Enseigne *"
                value={formData.enseigne}
                onChange={(e) => setFormData({ ...formData, enseigne: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="PDV (magasin) *"
                value={formData.pdv}
                onChange={(e) => setFormData({ ...formData, pdv: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Contacts, acheteurs, réalisations produits & goodies
              </Typography>
            </Grid>

            {numericFields.map((field) => (
              <Grid item xs={6} sm={3} key={field.key}>
                <TextField
                  fullWidth
                  type="number"
                  label={field.label}
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Commentaires"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            {editingPerformance ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PromoPaqueModule;