import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import branding from '../config/branding';

const BiblosLogo = ({ size = 32, showText = true, variant = 'default' }) => {
  const colors = {
    default: {
      gradient: 'linear-gradient(135deg, #1976d2 0%, #4caf50 100%)',
      textColor: '#1976d2'
    },
    light: {
      gradient: 'linear-gradient(135deg, #42a5f5 0%, #66bb6a 100%)',
      textColor: '#42a5f5'
    },
    dark: {
      gradient: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
      textColor: '#1a237e'
    }
  };

  const theme = colors[variant] || colors.default;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TrendingUp 
        sx={{ 
          fontSize: size,
          color: theme.textColor,
          background: theme.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }} 
      />
      {showText && (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            fontSize: size * 0.5,
            background: theme.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {branding.name}
        </Typography>
      )}
    </Box>
  );
};

export default BiblosLogo;