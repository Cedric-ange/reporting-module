import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

export default function GrossisteImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 1. Gérer la sélection du fichier Excel
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult(null); // Réinitialise les anciens messages d'erreur ou succès
    }
  };

  // 2. Envoyer le fichier de manière indépendante au Backend
  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Endpoint mis en conformité avec l'architecture dédiée aux Grossistes
      const response = await axios.post('/api/grossiste/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Gestion dynamique du nombre de lignes insérées renvoyé par le serveur
      const insertedCount = response.data.insertedCount ?? response.data.count ?? 0;

      setResult({ 
        type: 'success', 
        message: `✅ Importation réussie ! ${insertedCount} lignes d'activité grossiste insérées avec succès.` 
      });
      setFile(null); // Vide le sélecteur de fichier après le succès
    } catch (error) {
      console.error("Erreur lors de l'importation ETL Grossiste :", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Une erreur est survenue lors du traitement du fichier.";
      setResult({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, border: '1px dashed #1976d2', borderRadius: 3, bgcolor: '#fbfcfd', maxWidth: 500, mt: 3, mx: 'auto', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
        Espace Importation Grossiste
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
        Sélectionnez et chargez votre fichier consolidé d'activité commerciale Grossiste directement dans Supabase.
      </Typography>

      {/* Bouton de sélection de fichier personnalisé */}
      <Button
        variant="outlined"
        component="label"
        fullWidth
        startIcon={<UploadFileIcon />}
        sx={{ mb: 3, textTransform: 'none', py: 1.5, borderStyle: file ? 'solid' : 'dashed' }}
      >
        <Box component="span" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {file ? file.name : "Choisir le fichier Excel Grossiste"}
        </Box>
        <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
      </Button>

      {/* Bouton de soumission */}
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        onClick={handleImport}
        disabled={!file || loading}
        startIcon={loading ? null : <CloudUploadIcon />}
        sx={{ textTransform: 'none', py: 1.2, fontWeight: 'bold' }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Lancer l'Importation sur Supabase"}
      </Button>

      {/* Affichage des retours utilisateurs */}
      {result && (
        <Alert severity={result.type} sx={{ mt: 3, borderRadius: 2 }}>
          {result.message}
        </Alert>
      )}
    </Box>
  );
}