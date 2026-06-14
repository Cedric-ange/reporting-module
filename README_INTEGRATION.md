# Guide d'Intégration ETL BIBLOS

## 📋 Contenu

Ce guide explique comment intégrer les fonctions ETL BIBLOS dans votre application existante.

---

## 🚀 Installation Rapide

### 1. Fichiers Ajoutés

Les fichiers suivants ont été créés dans `D:\reporting-module\` :

1. **DOCUMENTATION_ETL_BIBLOS.md** - Documentation technique complète
2. **config.py** - Configurations par type de fichier
3. **etl_core.py** - Module ETL avec toutes les fonctions

### 2. Dépendances Requises

```bash
pip install pandas openpyxl numpy
```

---

## 🔧 Intégration Étape par Étape

### Étape 1 : Ajouter les Modules

Placez simplement les fichiers dans votre projet :
- `config.py`
- `etl_core.py`

Ces modules sont autonomes et ne modifient pas votre code existant.

### Étape 2 : Importer les Fonctions

Dans votre code existant :

```python
import sys
sys.path.append('D:/reporting-module')

from etl_core import transform_file, export_to_excel, validate_data_integrity
from config import SOURCE_DIR, OUTPUT_DIR, TARGET_COLUMNS
```

### Étape 3 : Utiliser dans Votre Application

#### Option A : Appel Direct

```python
from etl_core import transform_file, export_to_excel
import os

file_path = "D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx"

# Transformation
df_transformed = transform_file(file_path)

if df_transformed is not None:
    # Export
    output_path = "D:/reporting-module/OUTPUT/biblos_transformed.xlsx"
    export_to_excel(df_transformed, output_path)
    print(f"✅ Transformé: {output_path}")
else:
    print("❌ Erreur de transformation")
```

#### Option B : Traitement par Lot

```python
from etl_core import transform_file, export_to_excel
from config import SOURCE_DIR, OUTPUT_DIR
import os

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Traiter tous les fichiers
for filename in os.listdir(SOURCE_DIR):
    if filename.endswith('.xlsx'):
        file_path = os.path.join(SOURCE_DIR, filename)
        
        df = transform_file(file_path)
        
        if df is not None:
            output_filename = f"transformed_{filename}"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            export_to_excel(df, output_path)
            print(f"✅ {filename} → {output_filename}")
```

---

## 🎯 Fonctions Clés Disponibles

### `transform_file(file_path)`

Transforme un fichier Excel automatiquement selon son type.

**Args:**
- `file_path`: Chemin vers le fichier Excel

**Returns:**
- DataFrame transformé ou None en cas d'erreur

**Exemple:**
```python
from etl_core import transform_file

df = transform_file("D:/path/to/file.xlsx")
print(f"{len(df)} lignes générées")
```

### `export_to_excel(df, output_path)`

Exporte le DataFrame vers Excel.

**Args:**
- `df`: DataFrame à exporter
- `output_path`: Chemin de sortie

**Exemple:**
```python
from etl_core import export_to_excel

export_to_excel(df, "output.xlsx")
```

### `validate_data_integrity(df_source, df_transformed)`

Valide que les totaux correspondent.

**Args:**
- `df_source`: DataFrame source
- `df_transformed`: DataFrame transformé

**Returns:**
- dict avec résultats de validation

**Exemple:**
```python
from etl_core import validate_data_integrity
import pandas as pd

df_source = pd.read_excel("source.xlsx", header=None, sheet_name="Feuil1")
validation = validate_data_integrity(df_source, df)

if validation["validation"]["all_match"]:
    print("✅ Validation réussie")
else:
    print("⚠️ Problème de validation")
```

---

## 📋 Spécificités Incluses

### 1. Non-Duplication

Les variables suivantes ne sont attribuées qu'au premier produit :
- Personne approchée (visites)
- Personne touché (Client acheteur)
- Affiche

### 2. Gratuité Correctement Extraite

Mapping spécifique par produit :
- Lait 16G → colonne offset +16
- Lait 900G → colonne offset +17
- Flocon d'avoine 50g → colonne offset +18
- Autres → 0

### 3. Gestion des Null

Toutes les valeurs null/NaN sont remplacées par 0.

### 4. Exclusion TOTAL

La ligne TOTAL est automatiquement exclue du traitement.

### 5. Validation Totale

Comparaison automatique des totaux source vs transformé.

---

## 🔧 Configuration Personnalisée

### Modifier les Configurations

Éditez `config.py` pour ajuster :

```python
# Changer les répertoires
SOURCE_DIR = "votre/path/source"
OUTPUT_DIR = "votre/path/output"

# Ajouter de nouveaux produits dans FEUIL1_CONFIG
FEUIL1_CONFIG["products"].append({
    "name": "NouveauFormat",
    "category": "Lait",
    "offset": 7,
    "gratuit_offset": 19
})
```

---

## 🧪 Tests

Exécuter les tests pour vérifier :

```python
from etl_core import transform_file
import pandas as pd

# Test 1
file_path = "D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx"
df = transform_file(file_path)

print(f"Test transformation: {'PASS' if len(df) > 0 else 'FAIL'}")
print(f"Nombre de lignes: {len(df)}")
print(f"Total gratuité: {df['Gratuité'].sum()}")
```

---

## 📊 Intégration avec Power BI

### Fichier de Sortie

Le fichier Excel généré contient :
- **Feuille "Base_Données"** : Les données transformées
- **Feuille "Validation"** : Résumé des statistiques

### Importation Power BI

1. Ouvrir Power BI Desktop
2. Données → Obtenir des données → Excel
3. Sélectionner le fichier transformé
4. Choisir la feuille "Base_Données"
5. Créer vos visualisations

---

## 🚨 Résolution de Problèmes

### Erreur "Worksheet not found"

**Cause:** Mauvais nom de feuille
**Solution:** Le détecteur automatique gère cela, ou spécifiez manuellement dans config.py

### Gratuité à 0

**Cause:** Offset de colonne incorrect
**Solution:** Vérifier les offsets dans config.py (doivent être 16, 17, 18)

### Totaux ne correspondent pas

**Cause:** Ligne TOTAL incluse
**Solution:** Vérifier que detect_data_rows() s'arrête avant TOTAL

---

## 📞 Support

### Questions Fréquentes

**Q: Comment traiter un nouveau format de fichier ?**
A: Ajouter une nouvelle configuration dans config.py et créer une nouvelle fonction de transformation.

**Q: Puis-je modifier les colonnes cibles ?**
A: Oui, modifiez TARGET_COLUMNS dans config.py.

**Q: Comment automatiser le traitement hebdomadaire ?**
A: Utilisez un planificateur de tâches (Task Scheduler Windows) pour exécuter le script.

---

## ✅ Checklist Intégration

- [ ] Fichiers copiés dans D:/reporting-module/
- [ ] Dépendances installées (pandas, openpyxl, numpy)
- [ ] Configuration vérifiée (chemins corrects)
- [ ] Test avec fichier réel effectué
- [ ] Validation des totaux confirmée
- [ ] Import Power BI réussi

---

## 🎉 Conclusion

Les modules `config.py` et `etl_core.py` sont prêts à être intégrés dans votre application existante sans modification de son état actuel. Toutes les spécificités ETL développées ensemble y sont incluses.

Pour toute question, consultez `DOCUMENTATION_ETL_BIBLOS.md` pour la documentation technique complète.
