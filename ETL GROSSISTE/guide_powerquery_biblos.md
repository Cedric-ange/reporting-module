# Guide Power Query - Transformation Reporting Ventes Biblos

## 📋 Résumé de l'analyse de vos fichiers

Après analyse approfondie de vos fichiers Excel, voici la structure détectée :

### Structure des fichiers analysés
- **Fichiers trouvés** : Plusieurs fichiers de reporting avec structure similaire
- **Feuille principale** : Contient les données de ventes journalières
- **Organisation** : 
  - Lignes 0-2 : Titres et sous-titres
  - Ligne 3 : En-têtes principaux (VILLE, GROSSISTE, dates)
  - Lignes 6-7 : Noms de produits (Lait, Flocon d'avoine, etc.)
  - Lignes 8-12 : Données par ville/grossiste
  - Ligne 13 : Totaux

### Colonnes identifiées
- **Ville** (Col 0) : Noms des villes (BONDOUKOU, ABENGOUROU, etc.)
- **Grossiste** (Col 1) : Noms des grossistes
- **Colonnes de dates** : Une série de colonnes pour chaque jour (24/01, 26/01, etc.)
- **Colonnes de produits** : Différents formats (16G, 360G, 900G, 25KG, etc.)

---

## 🚀 Script Power Query fourni

J'ai créé deux versions de scripts Power Query :

### 1. Script de base (`powerquery_script.txt`)
- Version simple pour démarrer rapidement
- Gère un fichier ou plusieurs fichiers
- Transformation de base

### 2. Script détaillé (`powerquery_script_detailed.txt`) ⭐ RECOMMANDÉ
- Analyse basée sur la structure exacte de vos fichiers
- Fonction réutilisable pour traitement par lots
- Structure unpivotée pour analyse Power BI optimisée
- Gestion des métadonnées (nom fichier, dates)
- Nettoyage automatique des données

---

## 📝 Étapes d'utilisation dans Power BI

### Étape 1 : Importer le script
1. Ouvrez Power BI Desktop
2. Allez dans l'onglet **"Données"**
3. Cliquez sur **"Obtenir des données"** > **"Autre"** > **"Requête vide"**
4. Dans l'éditeur Power Query, cliquez sur **"Éditeur avancé"**
5. Copiez-collez le contenu de `powerquery_script_detailed.txt`

### Étape 2 : Configurer les chemins
Dans le script, modifiez ces lignes selon vos besoins :

```powerquery
// Pour le traitement par lots
FolderPath = "D:\reporting-module\DATA BIBLOS",

// Pour un seul fichier (optionnel)
SingleFilePath = "D:\reporting-module\DATA BIBLOS\VOTRE_FICHIER.xlsx",
```

### Étape 3 : Exécuter et ajuster
1. Cliquez sur **"Terminé"** dans l'éditeur avancé
2. Power Query va traiter les données
3. Vérifiez l'aperçu des données
4. Si nécessaire, ajustez les filtres dans le script

### Étape 4 : Charger dans Power BI
1. Cliquez sur **"Fermer et appliquer"**
2. Les données seront chargées dans votre modèle Power BI

---

## 🔧 Personnalisation du script

### Adapter le filtrage des fichiers
Si certains fichiers ne sont pas inclus, modifiez cette section :

```powerquery
FilteredFiles = Table.SelectRows(SourceFiles, each 
    let
        UpperName = Text.Upper([Name]),
        IsReportingFile = Text.Contains(UpperName, "REPORTING DES VENTES") and
                          Text.Contains(UpperName, "ACTIVATION GROSSISTE")
    in
        IsReportingFile  // Ajoutez d'autres conditions si nécessaire
),
```

### Adapter le filtrage des lignes
Si certaines lignes de données sont mal filtrées, ajustez cette section :

```powerquery
FilteredRows = Table.SelectRows(CleanColumnNames, each 
    let
        VilleValue = [Ville],
        IsValidRow = VilleValue <> null and 
                     VilleValue <> "TOTAL" and
                     // Ajoutez vos conditions spécifiques ici
    in
        IsValidRow
),
```

---

## 📊 Structure des données résultantes

Le script détaillé crée une table avec cette structure :

| Colonne | Type | Description |
|---------|------|-------------|
| Ville | Texte | Nom de la ville |
| Grossiste | Texte | Nom du grossiste |
| Nom_Fichier | Texte | Nom du fichier source |
| Date_Fichier | Date | Date déduite du fichier |
| Date_Vente | Date | Date de la vente (colonne unpivotée) |
| Montant_Vente | Nombre | Montant pour cette date |

Cette structure en format "long" (unpivotée) est idéale pour Power BI car elle permet :
- Des analyses temporelles faciles
- Des filtres dynamiques par date
- Des calculs de totaux et moyennes
- La création de graphiques temporels

---

## 🎯 Recommandations Power BI

### Créer des mesures DAX
```dax
// Total des ventes
Total Ventes = SUM('Table'[Montant_Vente])

// Ventes par ville
Ventes par Ville = 
SUMX(
    VALUES('Table'[Ville]),
    CALCULATE(SUM('Table'[Montant_Vente]))
)

// Tendance des ventes
Tendance Ventes = 
CALCULATE(
    [Total Ventes],
    DATESINPERIOD('Date_Dimension'[Date], TODAY(), -30, DAY)
)
```

### Créer une table de dates
1. Créez une table de dates dédiée dans Power BI
2. Reliez-la à votre colonne `Date_Vente`
3. Utilisez-la pour vos analyses temporelles

### Créer des visualisations
- **Graphique en lignes** : Évolution des ventes par date
- **Graphique à barres** : Ventes par ville ou grossiste
- **Carte** : Distribution géographique des ventes
- **Tableau matriciel** : Détail par ville, grossiste et date

---

## 🔄 Mise à jour des données

### Automatisation
1. **Mise à jour manuelle** : Cliquez sur "Actualiser" dans Power BI
2. **Mise à jour automatique** : Configurez la gateway Power BI pour l'actualisation planifiée
3. **Nouveaux fichiers** : Ajoutez simplement les nouveaux fichiers dans le dossier D:\reporting-module\DATA BIBLOS

### Gestion des erreurs
Si l'actualisation échoue :
- Vérifiez que tous les fichiers sont accessibles
- Contrôlez que la structure des nouveaux fichiers est cohérente
- Vérifiez les permissions d'accès au dossier

---

## 📈 Évolutions possibles

### Pour une analyse plus avancée, vous pourriez :
1. **Ajouter des tables de référence** :
   - Table des villes avec régions
   - Table des grossistes avec catégories
   - Table des produits avec descriptions

2. **Créer des indicateurs KPI** :
   - Taux de réalisation vs objectifs
   - Évolution semaine après semaine
   - Comparaison entre grossistes

3. **Automatiser complètement** :
   - Configurer l'actualisation automatique quotidienne
   - Créer des rapports planifiés
   - Mettre en place des alertes

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que le chemin d'accès aux fichiers est correct
2. Contrôlez que la structure des fichiers est cohérente
3. Testez d'abord avec un seul fichier avant le traitement par lots
4. Consultez les journaux d'erreur dans Power Query pour identifier les problèmes

---

## 📁 Fichiers créés

1. **powerquery_script.txt** : Script de base
2. **powerquery_script_detailed.txt** : Script avancé recommandé ⭐
3. **guide_powerquery_biblos.md** : Ce guide

Utilisez de préférence le script détaillé pour une meilleure structuration des données.