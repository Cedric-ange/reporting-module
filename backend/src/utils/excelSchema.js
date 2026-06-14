// Schéma de validation strict basé sur la structure Excel exacte
const EXCEL_SCHEMA = {
  // Structure des colonnes attendue
  columns: {
    A: { header: 'N°', type: 'number', required: true, validation: (value) => Number.isInteger(value) && value > 0 },
    B: { header: 'Agent promoteur', type: 'string', required: true, validation: (value) => typeof value === 'string' && value.trim().length > 0 },
    C: { header: 'Boutique (visites objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    D: { header: 'Superette (visites objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    E: { header: 'Kiosque (visites objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    F: { header: 'Tablier (visites objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    G: { header: 'Pushcart (visites objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    H: { header: 'Boutique (référencement objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    I: { header: 'Superette (référencement objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    J: { header: 'Kiosque (référencement objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    K: { header: 'Tablier (référencement objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    L: { header: 'Pushcart (référencement objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    M: { header: 'Affiche Biblos Lait Prémium 16g & 360g (objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    N: { header: 'Affiche Biblos Lait Excellence (objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    O: { header: "Affiche Biblos Flocons d' Avoine (objectifs)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    P: { header: 'Hanger (objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    Q: { header: 'Wobbler (objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    R: { header: 'Biblos Lait Premium 16g (ventes objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    S: { header: 'Biblos Lait Premium 360g (ventes objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    T: { header: 'Biblos Lait Excellence 900g (ventes objectifs)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    U: { header: "Biblos Flocon d'avoine 50g (ventes objectifs)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    V: { header: "Biblos Flocon d'avoine 400g (ventes objectifs)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    W: { header: 'Boutique (visites réalisations)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    X: { header: 'Superette (visites réalisations)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    Y: { header: 'Kiosque (visites réalisations)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    Z: { header: 'Tablier (visites réalisations)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AA: { header: 'Pushcart (visites réalisations)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AB: { header: 'Biblos Lait Premium 16g (présence)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AC: { header: 'Biblos Lait Premium 360g (présence)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AD: { header: 'Biblos Lait Excellence 900g (présence)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AE: { header: "Biblos Flocon d'avoine 50g (présence)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AF: { header: "Biblos Flocon d'avoine 400g (présence)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AG: { header: 'Boutique (référencement réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AH: { header: 'Superette (référencement réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AI: { header: 'Kiosque (référencement réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AJ: { header: 'Tablier (référencement réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AK: { header: 'Pushcart (référencement réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AL: { header: 'Biblos Lait Premium 16g (nouveau référencement)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AM: { header: 'Biblos Lait Premium 360g (nouveau référencement)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AN: { header: 'Biblos Lait Excellence 900g (nouveau référencement)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AO: { header: "Biblos Flocon d'avoine 50g (nouveau référencement)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AP: { header: "Biblos Flocon d'avoine 400g (nouveau référencement)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AQ: { header: 'Biblos Lait Premium 16g (ventes réalisées)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AR: { header: 'Biblos Lait Premium 360g (ventes réalisées)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AS: { header: 'Biblos Lait Excellence 900g (ventes réalisées)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AT: { header: "Biblos Flocon d'avoine 50g (ventes réalisées)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AU: { header: "Biblos Flocon d'avoine 400g (ventes réalisées)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AV: { header: 'Affiche Biblos Lait Prémium 16g & 360g (réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AW: { header: 'Affiche Biblos Lait Excellence (réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AX: { header: "Affiche Biblos Flocons d' Avoine (réalisé)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AY: { header: 'Hanger (réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    AZ: { header: 'Wobbler (réalisé)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    BA: { header: 'Biblos Lait Premium 16g (gratuits)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    BB: { header: 'Biblos Lait Excellence 900g (gratuits)', type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    BC: { header: "Biblos Flocon d'avoine 50g (gratuits)", type: 'number', required: false, validation: (value) => Number.isInteger(value) && value >= 0 },
    BD: { header: 'Commentaires', type: 'string', required: false, validation: (value) => typeof value === 'string' },
    BE: { header: 'Impressions des PDV et des clients', type: 'string', required: false, validation: (value) => typeof value === 'string' }
  },

  // Ville autorisées (pour validation)
  allowedCities: [
    'SAN PEDRO',
    'ABIDJAN',
    'YAMOUSSOUKRO',
    'BOUAKE',
    'KORHOGO',
    'DALOA',
    'MAN',
    'SAN-PEDRO'
  ],

  // Types de PDV autorisés
  allowedPDVTypes: ['Boutique', 'Superette', 'Kiosque', 'Tablier', 'Pushcart'],

  // Produits autorisés
  allowedProducts: [
    'Biblos Lait Premium 16g',
    'Biblos Lait Premium 360g',
    'Biblos Lait Excellence 900g',
    "Biblos Flocon d'avoine 50g",
    "Biblos Flocon d'avoine 400g"
  ]
};

// Fonction de validation principale
function validateExcelRow(row, rowIndex) {
  const errors = [];
  const warnings = [];

  // Validation des champs obligatoires
  if (!EXCEL_SCHEMA.columns.A.validation(row['N°'])) {
    errors.push({
      row: rowIndex,
      field: 'N°',
      message: 'Le numéro d\'agent est obligatoire et doit être un entier positif',
      value: row['N°']
    });
  }

  if (!EXCEL_SCHEMA.columns.B.validation(row['Agent promoteur'])) {
    errors.push({
      row: rowIndex,
      field: 'Agent promoteur',
      message: 'Le nom de l\'agent est obligatoire',
      value: row['Agent promoteur']
    });
  }

  // Validation de la ville si présente
  if (row['VILLE'] && !EXCEL_SCHEMA.allowedCities.includes(row['VILLE'].toUpperCase().trim())) {
    warnings.push({
      row: rowIndex,
      field: 'VILLE',
      message: `Ville non reconnue. Villes autorisées: ${EXCEL_SCHEMA.allowedCities.join(', ')}`,
      value: row['VILLE']
    });
  }

  // Validation des champs numériques
  const numericFields = Object.entries(EXCEL_SCHEMA.columns).filter(([_, config]) => config.type === 'number');
  numericFields.forEach(([key, config]) => {
    const value = row[config.header];
    if (value !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push({
          row: rowIndex,
          field: config.header,
          message: `La valeur doit être un nombre entier`,
          value: value
        });
      } else if (!config.validation(numValue)) {
        errors.push({
          row: rowIndex,
          field: config.header,
          message: `La valeur n'est pas valide pour ce champ`,
          value: value
        });
      }
    }
  });

  // Vérification des formules Excel (ne doivent pas être importées telles quelles)
  Object.values(row).forEach((value, index) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      errors.push({
        row: rowIndex,
        field: `Colonne ${index + 1}`,
        message: 'Les formules Excel ne sont pas autorisées. Utilisez les valeurs calculées.',
        value: value
      });
    }
  });

  return { errors, warnings };
}

// Fonction de validation du fichier entier
function validateExcelFile(data) {
  const results = {
    isValid: true,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    warnings: [],
    validatedData: []
  };

  if (!Array.isArray(data) || data.length === 0) {
    results.isValid = false;
    results.errors.push({
      global: true,
      message: 'Le fichier est vide ou n\'est pas un tableau valide'
    });
    return results;
  }

  results.totalRows = data.length;

  // Valider chaque ligne
  data.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based index pour les messages
    const validation = validateExcelRow(row, rowIndex);

    if (validation.errors.length > 0) {
      results.invalidRows++;
      results.errors.push(...validation.errors);
    } else {
      results.validRows++;
      results.validatedData.push(normalizeRow(row));
    }

    if (validation.warnings.length > 0) {
      results.warnings.push(...validation.warnings);
    }
  });

  results.isValid = results.errors.length === 0;
  return results;
}

// Normaliser les données pour la base de données
function normalizeRow(row) {
  const normalized = {
    agentNumber: row['N°'],
    agentName: row['Agent promoteur']?.trim(),
    city: row['VILLE']?.trim(),
    
    // Objectifs visites
    visitsBoutique: Number(row['Boutique (visites objectifs)']) || 0,
    visitsSuperette: Number(row['Superette (visites objectifs)']) || 0,
    visitsKiosque: Number(row['Kiosque (visites objectifs)']) || 0,
    visitsTablier: Number(row['Tablier (visites objectifs)']) || 0,
    visitsPushcart: Number(row['Pushcart (visites objectifs)']) || 0,
    
    // Objectifs référencement
    refBoutique: Number(row['Boutique (référencement objectifs)']) || 0,
    refSuperette: Number(row['Superette (référencement objectifs)']) || 0,
    refKiosque: Number(row['Kiosque (référencement objectifs)']) || 0,
    refTablier: Number(row['Tablier (référencement objectifs)']) || 0,
    refPushcart: Number(row['Pushcart (référencement objectifs)']) || 0,
    
    // Objectifs matériel
    posterPremium: Number(row['Affiche Biblos Lait Prémium 16g & 360g (objectifs)']) || 0,
    posterExcellence: Number(row['Affiche Biblos Lait Excellence (objectifs)']) || 0,
    posterAvoine: Number(row["Affiche Biblos Flocons d' Avoine (objectifs)"]) || 0,
    hanger: Number(row['Hanger (objectifs)']) || 0,
    wobbler: Number(row['Wobbler (objectifs)']) || 0,
    
    // Objectifs ventes
    salesPremium16g: Number(row['Biblos Lait Premium 16g (ventes objectifs)']) || 0,
    salesPremium360g: Number(row['Biblos Lait Premium 360g (ventes objectifs)']) || 0,
    salesExcellence900g: Number(row['Biblos Lait Excellence 900g (ventes objectifs)']) || 0,
    salesAvoine50g: Number(row["Biblos Flocon d'avoine 50g (ventes objectifs)"]) || 0,
    salesAvoine400g: Number(row["Biblos Flocon d'avoine 400g (ventes objectifs)"]) || 0,
    
    // Réalisations visites
    realVisitsBoutique: Number(row['Boutique (visites réalisations)']) || 0,
    realVisitsSuperette: Number(row['Superette (visites réalisations)']) || 0,
    realVisitsKiosque: Number(row['Kiosque (visites réalisations)']) || 0,
    realVisitsTablier: Number(row['Tablier (visites réalisations)']) || 0,
    realVisitsPushcart: Number(row['Pushcart (visites réalisations)']) || 0,
    
    // Présence produits
    presencePremium16g: Number(row['Biblos Lait Premium 16g (présence)']) || 0,
    presencePremium360g: Number(row['Biblos Lait Premium 360g (présence)']) || 0,
    presenceExcellence900g: Number(row['Biblos Lait Excellence 900g (présence)']) || 0,
    presenceAvoine50g: Number(row["Biblos Flocon d'avoine 50g (présence)"]) || 0,
    presenceAvoine400g: Number(row["Biblos Flocon d'avoine 400g (présence)"]) || 0,
    
    // Référencement réalisé
    realRefBoutique: Number(row['Boutique (référencement réalisé)']) || 0,
    realRefSuperette: Number(row['Superette (référencement réalisé)']) || 0,
    realRefKiosque: Number(row['Kiosque (référencement réalisé)']) || 0,
    realRefTablier: Number(row['Tablier (référencement réalisé)']) || 0,
    realRefPushcart: Number(row['Pushcart (référencement réalisé)']) || 0,
    
    // Nouveau référencement
    newRefPremium16g: Number(row['Biblos Lait Premium 16g (nouveau référencement)']) || 0,
    newRefPremium360g: Number(row['Biblos Lait Premium 360g (nouveau référencement)']) || 0,
    newRefExcellence900g: Number(row['Biblos Lait Excellence 900g (nouveau référencement)']) || 0,
    newRefAvoine50g: Number(row["Biblos Flocon d'avoine 50g (nouveau référencement)"]) || 0,
    newRefAvoine400g: Number(row["Biblos Flocon d'avoine 400g (nouveau référencement)"]) || 0,
    
    // Ventes réalisées
    realSalesPremium16g: Number(row['Biblos Lait Premium 16g (ventes réalisées)']) || 0,
    realSalesPremium360g: Number(row['Biblos Lait Premium 360g (ventes réalisées)']) || 0,
    realSalesExcellence900g: Number(row['Biblos Lait Excellence 900g (ventes réalisées)']) || 0,
    realSalesAvoine50g: Number(row["Biblos Flocon d'avoine 50g (ventes réalisées)"]) || 0,
    realSalesAvoine400g: Number(row["Biblos Flocon d'avoine 400g (ventes réalisées)"]) || 0,
    
    // Matériel réalisé
    realPosterPremium: Number(row['Affiche Biblos Lait Prémium 16g & 360g (réalisé)']) || 0,
    realPosterExcellence: Number(row['Affiche Biblos Lait Excellence (réalisé)']) || 0,
    realPosterAvoine: Number(row["Affiche Biblos Flocons d' Avoine (réalisé)"]) || 0,
    realHanger: Number(row['Hanger (réalisé)']) || 0,
    realWobbler: Number(row['Wobbler (réalisé)']) || 0,
    
    // Gratuits
    freePremium16g: Number(row['Biblos Lait Premium 16g (gratuits)']) || 0,
    freeExcellence900g: Number(row['Biblos Lait Excellence 900g (gratuits)']) || 0,
    freeAvoine50g: Number(row["Biblos Flocon d'avoine 50g (gratuits)"]) || 0,
    
    // Commentaires
    comments: row['Commentaires']?.trim() || '',
    impressions: row['Impressions des PDV et des clients']?.trim() || '',
    
    // Calculs automatiques
    totalVisits: (Number(row['Boutique (visites réalisations)']) || 0) +
                (Number(row['Superette (visites réalisations)']) || 0) +
                (Number(row['Kiosque (visites réalisations)']) || 0) +
                (Number(row['Tablier (visites réalisations)']) || 0) +
                (Number(row['Pushcart (visites réalisations)']) || 0),
    
    totalSales: (Number(row['Biblos Lait Premium 16g (ventes réalisées)']) || 0) +
               (Number(row['Biblos Lait Premium 360g (ventes réalisées)']) || 0) +
               (Number(row['Biblos Lait Excellence 900g (ventes réalisées)']) || 0) +
               (Number(row["Biblos Flocon d'avoine 50g (ventes réalisées)"]) || 0) +
               (Number(row["Biblos Flocon d'avoine 400g (ventes réalisées)"]) || 0),
    
    totalReferences: (Number(row['Boutique (référencement réalisé)']) || 0) +
                    (Number(row['Superette (référencement réalisé)']) || 0) +
                    (Number(row['Kiosque (référencement réalisé)']) || 0) +
                    (Number(row['Tablier (référencement réalisé)']) || 0) +
                    (Number(row['Pushcart (référencement réalisé)']) || 0),
    
    createdAt: new Date().toISOString(),
    synced: false
  };

  return normalized;
}

module.exports = {
  EXCEL_SCHEMA,
  validateExcelRow,
  validateExcelFile,
  normalizeRow
};
