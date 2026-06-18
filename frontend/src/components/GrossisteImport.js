import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

export default function GrossisteImport() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 1. Récupérer la liste des agents au chargement
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents');
        setAgents(response.data);
      } catch (error) {
        console.error("Erreur de récupération des agents", error);
      }
    };
    fetchAgents();
  }, []);

  // 2. Gérer la sélection du fichier
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResult(null); // On réinitialise le message précédent
  };

  // 3. Envoyer le fichier et l'agent au Backend
  const handleImport = async () => {
    if (!file || !selectedAgent) return;

    setLoading(true);
    setResult(null);

    // Pour envoyer un fichier + du texte, on utilise un objet FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', selectedAgent);

    try {
      const response = await axios.post('/api/import/grossiste', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({ type: 'success', message: response.data.message });
      setFile(null); // On vide le champ fichier après succès
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Erreur lors de l'importation";
      setResult({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px dashed grey', borderRadius: 2, bgcolor: 'background.paper', maxWidth: 500, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Importer des Performances Grossiste
      </Typography>

      <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
        <InputLabel id="agent-select-label">Sélectionner l'Agent</InputLabel>
        <Select
          labelId="agent-select-label"
          value={selectedAgent}
          label="Sélectionner l'Agent"
          onChange={(e) => setSelectedAgent(e.target.value)}
        >
          {agents.map((agent) => (
            <MenuItem key={agent.id} value={agent.id}>
              {agent.agent_name} ({agent.agent_number})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        component="label"
        fullWidth
        startIcon={<UploadFileIcon />}
        sx={{ mb: 2 }}
      >
        {file ? file.name : "Choisir le fichier Excel Grossiste"}
        <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
      </Button>

      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        onClick={handleImport}
        disabled={!file || !selectedAgent || loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Lancer l'Importation ETL"}
      </Button>

      {result && (
        <Alert severity={result.type} sx={{ mt: 2 }}>
          {result.message}
        </Alert>
      )}
    </Box>
  );
}