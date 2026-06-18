if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">Erreur de chargement: {error.message}</Alert></Box>;

  // Indices de performance
  const globalObj = filteredData.reduce((sum, r) => sum + (Number(r.objective_carton || r.objectif_carton) || 0), 0);
  const globalReal = filteredData.reduce((sum, r) => sum + (Number(r.realisation_carton) || 0), 0);
  const globalRate = globalObj > 0 ? (globalReal / globalObj) * 100 : 0;
  const perfBrute = getPerformanceColor(globalRate);

  const flawsCount = filteredData.filter(r => {
    const obj = Number(r.objective_carton || r.objectif_carton) || 0;
    const real = Number(r.realisation_carton) || 0;
    return obj > 0 ? (real / obj) * 100 < 100 : false;
  }).length;

  return (
    <Box p={1}>
      {/* En-tête */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoGraphIcon fontSize="large" /> Module Analytique Grossistes Advanced
        </Typography>
      </Box>

      {/* Barre de filtrage multi-critères */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" label="Ville / Région" value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" label="Grossiste" value={grossisteFilter} onChange={(e) => setGrossisteFilter(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Format Produit" value={produitFilter} onChange={(e) => setProduitFilter(e.target.value)}>
                <MenuItem value="">Tous les formats</MenuItem>
                {uniqueProducts.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Statut" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <MenuItem value="Tous">Toutes les performances</MenuItem>
                <MenuItem value="Surperformance">🔵 Surperformance (&gt; 115%)</MenuItem>
                <MenuItem value="Atteint">🟢 Objectif Atteint (100% - 115%)</MenuItem>
                <MenuItem value="En Alerte">🟡 En Alerte (70% - 99.9%)</MenuItem>
                <MenuItem value="Critique">🔴 Critique (&lt; 70%)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2.4}>
              <TextField fullWidth size="small" select label="Période" value={temporelFilter} onChange={(e) => setTemporelFilter(e.target.value)}>
                <MenuItem value="Tous">Tout l'historique</MenuItem>
                <MenuItem value="7j">7 derniers jours</MenuItem>
                <MenuItem value="30j">30 derniers jours</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {(villeFilter || grossisteFilter || produitFilter || statutFilter !== 'Tous' || temporelFilter !== 'Tous') && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button size="small" color="secondary" onClick={() => { setVilleFilter(''); setGrossisteFilter(''); setProduitFilter(''); setStatutFilter('Tous'); setTemporelFilter('Tous'); }}>
                Réinitialiser les filtres
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* KPIs Métriques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: '5px solid #1976d2', bgcolor: '#f0f7ff' }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">OBJECTIF IMPOSÉ AU SECTEUR</Typography>
              <Typography variant="h4" fontWeight="bold" color="#0d47a1" mt={1}>{Math.round(globalObj).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${perfBrute.main}`, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">VOLUME VENDU CONSOLIDÉ</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} mt={1}>{Math.round(globalReal).toLocaleString()} Crt</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: `5px solid ${perfBrute.main}`, bgcolor: perfBrute.light, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">TAUX DE RÉALISATION MOYEN</Typography>
              <Typography variant="h4" fontWeight="bold" color={perfBrute.main} mt={1}>{globalRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section des Graphiques BI */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📊 Suivi Temporel Réalisation vs Objectifs</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: 11 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Legend />
                  <Bar dataKey="Réalisation" name="Réalisation (Cartons)" fill="#1976d2" />
                  <Line type="monotone" dataKey="Objectif" name="Seuil Objectif" stroke="#f57c00" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>📉 Écart Volumétrique en Cascade</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="name" style={{ fontSize: 10 }} />
                  <YAxis style={{ fontSize: 11 }} />
                  <ChartTooltip formatter={(v) => Math.round(v).toLocaleString()} />
                  <Bar dataKey="Valeur">
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.Couleur} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Palmarès de Performance Établi */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2 }}>🏆 Distribution Géographique Top & Flops</Typography>
            
            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>🟢 Meilleurs Distributeurs (Top 5)</Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableBody>
                  {rankingMetrics.top.map((g, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                      <TableCell align="right">{Math.round(g.real).toLocaleString()} Crt</TableCell>
                      <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>🔴 Distributeurs Sous-Performants (&lt; 100%)</Typography>
            {rankingMetrics.flop.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {rankingMetrics.flop.slice(0, 3).map((g, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{g.name} ({g.ville})</TableCell>
                        <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Écart: {Math.round(g.real - g.obj).toLocaleString()} Crt</TableCell>
                        <TableCell align="right"><Chip size="small" label={`${g.taux.toFixed(1)}%`} sx={{ bgcolor: g.color.main, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">Tous les grossistes de ce secteur sécurisent à 100% leurs quotas.</Alert>
            )}
          </Paper>
        </Grid>

        {/* Diagnostic Dynamique */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fafafa', height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon color="warning" /> Diagnostic Analytique
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box p={1.5} component={Paper} sx={{ borderLeft: `4px solid ${perfBrute.main}`, elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Analyse Contextuelle des Filtres</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Dans le périmètre sélectionné, la réalisation moyenne s'établit à <strong>{globalRate.toFixed(1)}%</strong>. Le statut global est désigné comme : <strong>{perfBrute.label}</strong>.
                </Typography>
              </Box>
              <Box p={1.5} component={Paper} sx={{ borderLeft: '4px solid #f57c00', elevation: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold">Suivi des Risques</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Il y a actuellement <strong>{flawsCount}</strong> ligne(s) d'activité commerciale sous le seuil d'atteinte de quotas (100%).
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Journal des Ventes */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Journal des Ventes Grossistes (Top 50)</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ville</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Grossiste</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Produit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Objectif</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Réalisation</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Taux (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(0, 50).map((row, index) => {
                const subObj = Number(row.objective_carton || row.objectif_carton) || 0;
                const subReal = Number(row.realisation_carton) || 0;
                const subRate = subObj > 0 ? (subReal / subObj) * 100 : 0;
                const rowStyle = getPerformanceColor(subRate);
                return (
                  <TableRow key={row.id || index} hover>
                    <TableCell>{row.date_vente ? new Date(row.date_vente).toLocaleDateString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell>{row.ville || 'N/A'}</TableCell>
                    <TableCell>{row.grossiste || 'N/A'}</TableCell>
                    <TableCell>{row.format_produit || 'N/A'}</TableCell>
                    <TableCell align="right">{subObj.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{subReal.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${subRate.toFixed(1)}%`} 
                        size="small" 
                        sx={{ bgcolor: rowStyle.light, color: rowStyle.main, fontWeight: 'bold' }} 
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}