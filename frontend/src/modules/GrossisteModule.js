{/* Barre Avancée de Filtrage Multicritères */}
<Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', bgcolor: '#ffffff' }}>
  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
    <Grid container spacing={2}>
      
      {/* 1. Filtre par Ville / Région (Saisie prédictive ou libre) */}
      <Grid item xs={12} sm={3}>
        <TextField 
          fullWidth 
          size="small" 
          label="Filtrer par Ville / Région" 
          placeholder="Ex: Abidjan, Bouaké..."
          value={villeFilter} 
          onChange={(e) => setVilleFilter(e.target.value)} 
          clearable
        />
      </Grid>

      {/* 2. Filtre par Distributeur / Grossiste */}
      <Grid item xs={12} sm={3}>
        <TextField 
          fullWidth 
          size="small" 
          label="Filtrer par Grossiste" 
          placeholder="Ex: Établissement Kouadio..."
          value={grossisteFilter} 
          onChange={(e) => setGrossisteFilter(e.target.value)} 
        />
      </Grid>

      {/* 3. Filtre par Format Produit (SKU extrait dynamiquement de Supabase) */}
      <Grid item xs={12} sm={3}>
        <TextField 
          fullWidth 
          size="small" 
          select 
          label="Format Produit (SKU)" 
          value={produitFilter} 
          onChange={(e) => setproduitFilter(e.target.value)}
        >
          <MenuItem value="">Tous les formats de produits</MenuItem>
          {uniqueProducts.map((product) => (
            <MenuItem key={product} value={product}>
              {product}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* 4. Filtre par Alerte de Performance (Code Couleur BI) */}
      <Grid item xs={12} sm={3}>
        <TextField 
          fullWidth 
          size="small" 
          select 
          label="Niveau de Performance" 
          value={statutFilter} 
          onChange={(e) => setStatutFilter(e.target.value)}
        >
          <MenuItem value="Tous">Toutes les performances</MenuItem>
          <MenuItem value="Surperformance">
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0288d1' }} />
              🔵 Surperformance (&gt; 115%)
            </Box>
          </MenuItem>
          <MenuItem value="Atteint">
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2e7d32' }} />
              🟢 Objectif Atteint (100% - 115%)
            </Box>
          </MenuItem>
          <MenuItem value="En Alerte">
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f57c00' }} />
              🟡 En Alerte (70% - 99.9%)
            </Box>
          </MenuItem>
          <MenuItem value="Critique">
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d32f2f' }} />
              🔴 Critique (&lt; 70%)
            </Box>
          </MenuItem>
        </TextField>
      </Grid>

    </Grid>

    {/* Optionnel : Bouton de réinitialisation rapide si des filtres sont actifs */}
    {(villeFilter || grossisteFilter || produitFilter || statutFilter !== 'Tous') && (
      <Box display="flex" justifyContent="flex-end" mt={1.5}>
        <Button 
          size="small" 
          color="secondary" 
          onClick={() => {
            setVilleFilter('');
            setGrossisteFilter('');
            setproduitFilter('');
            setStatutFilter('Tous');
          }}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Effacer tous les filtres actifs
        </Button>
      </Box>
    )}
  </CardContent>
</Card>