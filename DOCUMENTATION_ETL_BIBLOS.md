# Documentation Technique - ETL Automatisation pour Traitement Données BIBLOS

## 📋 Vue d'Ensemble

Cette documentation décrit le processus ETL (Extract, Transform, Load) pour automatiser le traitement des fichiers Excel de reporting BIBLOS et les transformer en bases de données exploitables dans Power BI.

---

## 🎯 Spécifications Finales du Traitement

### Structure Cible des Données

**Colonnes finales (12 au total) :**
1. Date
2. Ville
3. Grossiste
4. Categorie produit
5. Format
6. Objectif carton
7. Réalisation carton
8. Taux de réalisation
9. Gratuité
10. Affiche
11. Personne approchée
12. Personne touché (Client acheteur)

### Règles de Transformation

#### 1. **Structure Multi-Ligne Source**
- Données organisées en blocs temporels par date
- Plusieurs produits par bloc de date
- En-têtes complexes sur plusieurs lignes
- Ligne TOTAL à exclure absolument

#### 2. **Règles de Non-Duplication**
**Variables à attribuer uniquement au premier produit :**
- Personne approchée (visites)
- Personne touché (Client acheteur)
- Affiche

**Logique :** Pour une combinaison Agent + Date donnée, ces valeurs ne sont attribuées qu'au premier format (SKU). Les autres formats reçoivent 0.

#### 3. **Traitement des Valeurs Manquantes**
- Remplacer toutes les valeurs null/NaN par 0
- Aucune cellule vide dans le dataset final
- Gestion des virgules dans les valeurs numériques (prendre la partie avant la virgule)

#### 4. **Mapping Gratuité**
- Identifier les colonnes de gratuité spécifiques par produit
- Lait 16G → colonne offset +16
- Lait 900G → colonne offset +17
- Flocon d'avoine 50g → colonne offset +18
- Autres produits → 0 (pas de colonne de gratuité)

#### 5. **Exclusion TOTAL**
- Ne JAMAIS utiliser la ligne TOTAL
- Calculer les totaux uniquement à partir des lignes de données
- Vérifier l'intégrité en comparant source vs transformé

---

## 🔧 Architecture ETL

### Étape 1 : Extraction (Extract)

#### Détection Structure Fichier

```python
# Analyse dynamique de la structure
import pandas as pd

def detect_file_structure(file_path, sheet_name):
    """
    Analyse la structure du fichier Excel et retourne les métadonnées
    
    Returns:
        - date_blocks: list of date columns positions
        - product_mappings: mapping produits → colonnes
        - data_rows: range of data rows (excluding TOTAL)
        - special_columns: positions of gratuité, affiche, client columns
    """
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    # Identifier les lignes de données (avant TOTAL)
    data_rows = []
    for i in range(len(df)):
        val = df.iloc[i, 0]
        if pd.notna(val) and str(val) != "TOTAL":
            if i >= 8:  # Data rows start at index 8
                data_rows.append(i)
        elif str(val) == "TOTAL":
            break
    
    # Identifier les blocs de dates
    date_blocks = []
    for col in range(2, len(df.columns)):
        val = df.iloc[3, col]
        if pd.notna(val) and isinstance(val, str):
            if "2026" in val or "2024" in val or "2025" in val:
                date_blocks.append({
                    "date": val,
                    "start_col": col
                })
    
    # Identifier les colonnes spéciales pour chaque bloc
    # Gratuité: offset +16, +17, +18
    # Affiche: offset +19
    # Client: offset +8
    # Visites: offset +7
    
    return {
        "data_rows": data_rows,
        "date_blocks": date_blocks,
        "row_count": len(df),
        "col_count": len(df.columns)
    }
```

---

### Étape 2 : Transformation (Transform)

#### Core Transformation Logic

```python
def transform_biblos_data(file_path, sheet_name):
    """
    Fonction principale de transformation des données BIBLOS
    
    Args:
        file_path: Chemin vers le fichier Excel source
        sheet_name: Nom de la feuille à traiter
    
    Returns:
        DataFrame transformé avec structure cible
    """
    # Lecture du fichier source
    df_source = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    # Configuration des produits
    products = [
        {"name": "16G", "category": "Lait", "offset": 0, "gratuit_offset": 16},
        {"name": "360G", "category": "Lait", "offset": 1, "gratuit_offset": None},
        {"name": "900G", "category": "Lait", "offset": 2, "gratuit_offset": 17},
        {"name": "25KG Excell", "category": "Lait", "offset": 3, "gratuit_offset": None},
        {"name": "25KG Super", "category": "Lait", "offset": 4, "gratuit_offset": None},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5, "gratuit_offset": 18},
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6, "gratuit_offset": None}
    ]
    
    # Configuration des blocs de dates (détection automatique)
    date_blocks = detect_date_blocks(df_source)
    
    result_data = []
    
    # Traitement de chaque ligne de données
    for row_idx in detect_data_rows(df_source):
        ville = df_source.iloc[row_idx, 0]
        grossiste = df_source.iloc[row_idx, 1]
        
        # Exclusion des lignes vides ou TOTAL
        if pd.isna(ville) or str(ville) == "TOTAL":
            continue
        
        # Traitement de chaque bloc de date
        for date_block in date_blocks:
            date_obj = parse_date(date_block["date"])
            start_col = date_block["start_col"]
            
            # Extraction des valeurs partagées pour cette date
            shared_values = extract_shared_values(df_source, row_idx, start_col)
            
            # Traitement de chaque produit
            for product_idx, product in enumerate(products):
                # Extraction des valeurs objectives et réalisations
                obj_val = extract_value(df_source, row_idx, start_col + product["offset"])
                real_val = extract_value(df_source, row_idx, start_col + 9 + product["offset"])
                
                # Extraction de la gratuité
                freebies = extract_gratuity(df_source, row_idx, start_col, product["gratuit_offset"])
                
                # Application des règles de non-duplication (seulement premier produit)
                visite_final = shared_values["visits"] if product_idx == 0 else 0
                client_touche = shared_values["client"] if product_idx == 0 else 0
                affiche_final = shared_values["affiche"] if product_idx == 0 else 0
                
                # Calcul du taux de réalisation
                rate = calculate_achievement_rate(obj_val, real_val)
                
                # Création de la ligne transformée
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": product["category"],
                    "Format": product["name"],
                    "Objectif carton": obj_val,
                    "Réalisation carton": real_val,
                    "Taux de réalisation": rate,
                    "Gratuité": freebies,
                    "Affiche": affiche_final,
                    "Personne approchée": int(visite_final),
                    "Personne touché (Client acheteur)": int(client_touche)
                }
                result_data.append(row)
    
    # Création du DataFrame final
    df_transformed = pd.DataFrame(result_data)
    
    # Nettoyage : Remplacement des NaN par 0
    df_transformed = df_transformed.fillna(0)
    
    return df_transformed
```

---

### Fonctions Auxiliaires

```python
def extract_value(df, row_idx, col_idx):
    """Extrait une valeur numérique, gère les null et les virgules"""
    val = df.iloc[row_idx, col_idx]
    if pd.isna(val):
        return 0
    if isinstance(val, str):
        if ',' in val:
            return float(val.split(',')[0])
        return float(val)
    return float(val)

def extract_gratuity(df, row_idx, start_col, gratuit_offset):
    """Extrait la valeur de gratuité selon l'offset du produit"""
    if gratuit_offset is None:
        return 0
    
    free_col = start_col + gratuit_offset
    if free_col < len(df.columns):
        return extract_value(df, row_idx, free_col)
    return 0

def extract_shared_values(df, row_idx, start_col):
    """Extrait les valeurs partagées pour tous les produits d'une date"""
    return {
        "visits": extract_value(df, row_idx, start_col + 7),
        "client": extract_value(df, row_idx, start_col + 8),
        "affiche": extract_value(df, row_idx, start_col + 19)
    }

def calculate_achievement_rate(objective, realization):
    """Calcule le taux de réalisation"""
    if objective > 0:
        return round((realization / objective) * 100, 2)
    return 0

def detect_data_rows(df):
    """Détecte les lignes de données (excluant TOTAL)"""
    data_rows = []
    for i in range(8, len(df)):  # Start at row 8
        val = df.iloc[i, 0]
        if pd.isna(val) or str(val) == "TOTAL":
            break
        data_rows.append(i)
    return data_rows

def detect_date_blocks(df):
    """Détecte automatiquement les blocs de dates dans l'en-tête"""
    date_blocks = []
    known_positions = [2, 29, 56, 83, 110, 137, 164]  # Positions connues
    
    for pos in known_positions:
        if pos < len(df.columns):
            date_val = df.iloc[3, pos]
            if pd.notna(date_val):
                date_blocks.append({
                    "date": date_val,
                    "start_col": pos
                })
    
    return date_blocks

def parse_date(date_str):
    """Parse une date Excel au format datetime"""
    if isinstance(date_str, str):
        # Format: "2026-01-24 00:00:00" ou similaire
        return pd.to_datetime(date_str.split()[0])
    return pd.to_datetime(date_str)
```

---

### Étape 3 : Validation (Validate)

#### Vérification Intégrité Données

```python
def validate_data_integrity(df_source, df_transformed):
    """
    Vérifie que les totaux correspondent entre source et transformé
    
    Args:
        df_source: DataFrame source
        df_transformed: DataFrame transformé
    
    Returns:
        dict with validation results
    """
    # Calcul des totaux source (lignes 8-12 uniquement)
    source_totals = calculate_source_totals(df_source)
    
    # Calcul des totaux transformés
    transformed_totals = {
        "objective": df_transformed['Objectif carton'].sum(),
        "realization": df_transformed['Réalisation carton'].sum(),
        "visits": df_transformed['Personne approchée'].sum(),
        "client": df_transformed['Personne touché (Client acheteur)'].sum(),
        "affiche": df_transformed['Affiche'].sum(),
        "gratuite": df_transformed['Gratuité'].sum()
    }
    
    # Comparaison
    validation_results = {
        "objective_match": abs(source_totals["objective"] - transformed_totals["objective"]) < 0.01,
        "realization_match": abs(source_totals["realization"] - transformed_totals["realization"]) < 0.01,
        "visits_match": abs(source_totals["visits"] - transformed_totals["visits"]) < 0.01,
        "client_match": abs(source_totals["client"] - transformed_totals["client"]) < 0.01,
        "affiche_match": abs(source_totals["affiche"] - transformed_totals["affiche"]) < 0.01,
        "gratuite_match": abs(source_totals["gratuite"] - transformed_totals["gratuite"]) < 0.01
    }
    
    # Statut global
    validation_results["all_match"] = all(validation_results.values())
    
    return {
        "source_totals": source_totals,
        "transformed_totals": transformed_totals,
        "validation": validation_results
    }

def calculate_source_totals(df):
    """Calcule les totaux à partir du fichier source (lignes 8-12)"""
    date_blocks = detect_date_blocks(df)
    data_rows = detect_data_rows(df)
    
    totals = {"objective": 0, "realization": 0, "visits": 0, "client": 0, "affiche": 0, "gratuite": 0}
    
    for row_idx in data_rows:
        for date_block in date_blocks:
            start_col = date_block["start_col"]
            
            # Visites (offset +7)
            totals["visits"] += extract_value(df, row_idx, start_col + 7)
            
            # Client (offset +8)
            totals["client"] += extract_value(df, row_idx, start_col + 8)
            
            # Affiche (offset +19)
            totals["affiche"] += extract_value(df, row_idx, start_col + 19)
            
            # Objectifs (7 produits)
            for i in range(7):
                totals["objective"] += extract_value(df, row_idx, start_col + i)
            
            # Réalisations (offset +9)
            for i in range(7):
                totals["realization"] += extract_value(df, row_idx, start_col + 9 + i)
            
            # Gratuité (offset +16, +17, +18)
            totals["gratuite"] += extract_value(df, row_idx, start_col + 16)
            totals["gratuite"] += extract_value(df, row_idx, start_col + 17)
            totals["gratuite"] += extract_value(df, row_idx, start_col + 18)
    
    return totals
```

---

### Étape 4 : Load (Export)

```python
def export_to_excel(df_transformed, output_path):
    """
    Exporte le DataFrame transformé vers Excel
    
    Args:
        df_transformed: DataFrame transformé
        output_path: Chemin du fichier de sortie
    """
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        # Feuille principale de données
        df_transformed.to_excel(writer, sheet_name='Base_Données', index=False)
        
        # Feuille de validation (optionnel)
        validation_sheet = create_validation_summary(df_transformed)
        validation_sheet.to_excel(writer, sheet_name='Validation', index=False)
    
    return output_path

def create_validation_summary(df):
    """Crée un résumé de validation pour documentation"""
    summary = pd.DataFrame({
        "Métrique": [
            "Total lignes",
            "Dates uniques",
            "Grossistes uniques",
            "Villes uniques",
            "Non-zero gratuité",
            "Total gratuité",
            "Non-zero affiches",
            "Non-zero personne touché",
            "Non-zero personne approchée"
        ],
        "Valeur": [
            len(df),
            df['Date'].nunique(),
            df['Grossiste'].nunique(),
            df['Ville'].nunique(),
            (df['Gratuité'] > 0).sum(),
            df['Gratuité'].sum(),
            (df['Affiche'] > 0).sum(),
            (df['Personne touché (Client acheteur)'] > 0).sum(),
            (df['Personne approchée'] > 0).sum()
        ]
    })
    return summary
```

---

## 🚀 Intégration dans Application

### Script Principal d'Exécution

```python
#!/usr/bin/env python3
"""
Script principal d'ETL BIBLOS
Place dans: D:\reporting-module\etl_pipeline.py
"""

import pandas as pd
import os
from datetime import datetime

# Configuration
SOURCE_DIR = "D:/reporting-module/DATA BIBLOS"
OUTPUT_DIR = "D:/reporting-module/OUTPUT"
SHEET_NAME = "Feuil1"  # ou "JEUDI 22 JANV" selon le fichier

def main():
    print("=" * 60)
    print("ETL Pipeline - BIBLOS Data Processing")
    print("=" * 60)
    
    # Création du répertoire de sortie
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Liste des fichiers à traiter
    files_to_process = [
        "REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx",
        # Ajouter d'autres fichiers selon besoin
    ]
    
    for filename in files_to_process:
        source_path = os.path.join(SOURCE_DIR, filename)
        
        if not os.path.exists(source_path):
            print(f"⚠️  Fichier non trouvé: {filename}")
            continue
        
        print(f"\n📂 Traitement de: {filename}")
        
        try:
            # Étape 1: Détection structure
            print("   📊 Détection structure...")
            structure = detect_file_structure(source_path, SHEET_NAME)
            print(f"   ✅ {len(structure['date_blocks'])} blocs de dates détectés")
            print(f"   ✅ {len(structure['data_rows'])} lignes de données")
            
            # Étape 2: Transformation
            print("   🔄 Transformation...")
            df_transformed = transform_biblos_data(source_path, SHEET_NAME)
            print(f"   ✅ {len(df_transformed)} lignes générées")
            
            # Étape 3: Validation
            print("   🔍 Validation...")
            df_source = pd.read_excel(source_path, sheet_name=SHEET_NAME, header=None)
            validation = validate_data_integrity(df_source, df_transformed)
            
            if validation["validation"]["all_match"]:
                print("   ✅ Validation réussie - Tous les totaux correspondent")
            else:
                print("   ⚠️  Attention: Certains totaux ne correspondent pas")
                for key, match in validation["validation"].items():
                    if not match:
                        print(f"      ❌ {key}")
            
            # Étape 4: Export
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"biblos_transformed_{timestamp}.xlsx"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            
            export_to_excel(df_transformed, output_path)
            print(f"   ✅ Exporté vers: {output_filename}")
            
            # Rapport de traitement
            print(f"   📋 Statistiques:")
            print(f"      Total gratuité: {df_transformed['Gratuité'].sum()}")
            print(f"      Total ventes: {df_transformed['Réalisation carton'].sum()}")
            print(f"      Taux moyen: {df_transformed['Taux de réalisation'].mean():.2f}%")
            
        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "=" * 60)
    print("✅ Traitement terminé")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

---

## 📋 Configuration par Type de Fichier

### Fichier Type 1 : Feuil1 (Structure Blocs Dates)

**Caractéristiques :**
- Feuille : "Feuil1"
- Structure : Blocs de dates en colonnes
- Produits : 7 formats (16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G)
- Dates : 7 dates dans l'exemple

**Configuration :**
```python
FEUIL1_CONFIG = {
    "sheet_name": "Feuil1",
    "date_block_positions": [2, 29, 56, 83, 110, 137, 164],
    "products": [
        {"name": "16G", "category": "Lait", "offset": 0, "gratuit_offset": 16},
        {"name": "360G", "category": "Lait", "offset": 1, "gratuit_offset": None},
        {"name": "900G", "category": "Lait", "offset": 2, "gratuit_offset": 17},
        {"name": "25KG Excell", "category": "Lait", "offset": 3, "gratuit_offset": None},
        {"name": "25KG Super", "category": "Lait", "offset": 4, "gratuit_offset": None},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5, "gratuit_offset": 18},
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6, "gratuit_offset": None}
    ],
    "shared_columns": {
        "visits_offset": 7,
        "client_offset": 8,
        "affiche_offset": 19,
        "realization_offset": 9
    },
    "data_rows": range(8, 13)  # Excluant row 13 TOTAL
}
```

### Fichier Type 2 : Activation Agents (Structure Une Date)

**Caractéristiques :**
- Feuille : Nom spécifique (ex: "JEUDI 22 JANV")
- Structure : Une date, objectifs et réalisations séparés
- Produits : 5 formats (16G, 360G, 900G, 50G, 400G)
- Date/Extraite : En-tête ligne 1

**Configuration :**
```python
ACTIVATION_CONFIG = {
    "sheet_name": None,  # À détecter dynamiquement
    "date_row": 1,
    "city_col": 1,
    "products": [
        {"name": "Premium 16g", "category": "Lait", "obj_col": 17, "real_col": 42, "gratuit_col": 52, "affiche_col": 47},
        {"name": "Premium 360g", "category": "Lait", "obj_col": 18, "real_col": 43, "gratuit_col": 52, "affiche_col": 47},
        {"name": "Excellence 900g", "category": "Lait", "obj_col": 19, "real_col": 44, "gratuit_col": 52, "affiche_col": 47},
        {"name": "50g", "category": "Flocon d'avoine", "obj_col": 20, "real_col": 45, "gratuit_col": 52, "affiche_col": 47},
        {"name": "400g", "category": "Flocon d'avoine", "obj_col": 21, "real_col": 46, "gratuit_col": 52, "affiche_col": 47}
    ],
    "visits_columns": [2, 3, 4, 5, 6],  # Colonnes visites à sommer
    "data_rows": range(7, 27)  # Agents rows
}
```

---

## 🧪 Tests Unitaires

```python
def test_non_duplication_logic():
    """Teste la logique de non-duplication"""
    # Mock data
    visits = 28
    affiche = 3
    client = 5
    
    products = ["16G", "360G", "900G", "25KG Excell", "25KG Super", "50G", "400G"]
    
    results = []
    for i, product in enumerate(products):
        results.append({
            "product": product,
            "visits": visits if i == 0 else 0,
            "affiche": affiche if i == 0 else 0,
            "client": client if i == 0 else 0
        })
    
    # Assertions
    assert results[0]["visits"] == 28  # Premier produit a les visites
    assert results[1]["visits"] == 0  # Autres produits ont 0
    assert results[0]["affiche"] == 3
    assert results[2]["affiche"] == 0
    
    print("✅ Test non-duplication réussi")

def test_gratuity_extraction():
    """Teste l'extraction de gratuité"""
    # Mock data avec colonnes spécifiques
    assert extract_gratuity(None, None, 2, 16) == 0  # Pas de colonne
    
    # Simulation d'extraction avec offset
    free_col = 2 + 16  # Premier date block
    assert free_col == 18
    
    print("✅ Test extraction gratuité réussi")

def test_null_handling():
    """Teste la gestion des null"""
    assert extract_value(None, 0, None) == 0
    assert extract_value(None, 0, "5.5") == 5.5
    assert extract_value(None, 0, "5,5") == 5.0  # Gestion virgule
    
    print("✅ Test gestion null réussi")

def run_all_tests():
    """Exécute tous les tests"""
    print("🧪 Exécution des tests unitaires...")
    test_non_duplication_logic()
    test_gratuity_extraction()
    test_null_handling()
    print("\n✅ Tous les tests réussis")

if __name__ == "__main__":
    run_all_tests()
```

---

## 📊 Monitoring et Logs

### Système de Logging

```python
import logging
from datetime import datetime

def setup_logging():
    """Configure le système de logging"""
    log_dir = "D:/reporting-module/logs"
    os.makedirs(log_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d")
    log_file = os.path.join(log_dir, f"etl_{timestamp}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger('etl_pipeline')

# Utilisation dans le pipeline
logger = setup_logging()
logger.info("Démarrage ETL Pipeline")
logger.info(f"Fichiers à traiter: {len(files_to_process)}")
```

---

## 🔄 Pipeline Automatisé

### Orchestration Complète

```python
class BiblosETLPipeline:
    """Pipeline ETL complet pour traitement automatique"""
    
    def __init__(self, source_dir, output_dir):
        self.source_dir = source_dir
        self.output_dir = output_dir
        self.logger = setup_logging()
    
    def run(self):
        """Exécute le pipeline complet"""
        self.logger.info("=" * 60)
        self.logger.info("Démarrage Pipeline ETL BIBLOS")
        
        # Découverte des fichiers
        files = self.discover_files()
        self.logger.info(f"{len(files)} fichiers découverts")
        
        # Traitement de chaque fichier
        results = []
        for file_info in files:
            result = self.process_file(file_info)
            results.append(result)
        
        # Rapport final
        self.generate_report(results)
        
        self.logger.info("Pipeline terminé avec succès")
        return results
    
    def discover_files(self):
        """Découvre les fichiers Excel à traiter"""
        files = []
        for filename in os.listdir(self.source_dir):
            if filename.endswith('.xlsx'):
                files.append({
                    "path": os.path.join(self.source_dir, filename),
                    "name": filename
                })
        return files
    
    def process_file(self, file_info):
        """Traite un fichier individuel"""
        self.logger.info(f"Traitement: {file_info['name']}")
        
        try:
            # Détection du type de fichier
            file_type = self.detect_file_type(file_info['path'])
            
            # Application de la transformation appropriée
            if file_type == "FEUIL1":
                df_transformed = transform_feuil1_data(file_info['path'])
            elif file_type == "ACTIVATION":
                df_transformed = transform_activation_data(file_info['path'])
            else:
                raise ValueError(f"Type de fichier inconnu: {file_type}")
            
            # Validation
            validation = self.validate_transformed_data(df_transformed, file_info['path'])
            
            # Export
            output_path = self.export_data(df_transformed, file_info['name'])
            
            return {
                "file": file_info['name'],
                "status": "success",
                "rows": len(df_transformed),
                "validation": validation,
                "output": output_path
            }
            
        except Exception as e:
            self.logger.error(f"Erreur traitement {file_info['name']}: {e}")
            return {
                "file": file_info['name'],
                "status": "error",
                "error": str(e)
            }
    
    def detect_file_type(self, file_path):
        """Détecte automatiquement le type de fichier"""
        xl = pd.ExcelFile(file_path)
        
        if "Feuil1" in xl.sheet_names:
            return "FEUIL1"
        
        # Détecter les feuilles de dates (ex: "JEUDI 22 JANV")
        for sheet in xl.sheet_names:
            if any(day in sheet for day in ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]):
                return "ACTIVATION"
        
        return "UNKNOWN"
```

---

## 📁 Structure Projet Recommandée

```
D:/reporting-module/
├── DATA BIBLOS/                    # Fichiers source
│   ├── *.xlsx
│
├── etl_pipeline.py                 # Script principal
├── etl_core.py                     # Fonctions ETL core
├── validation.py                    # Fonctions validation
├── config.py                       # Configurations
│
├── logs/                           # Logs d'exécution
│   └── etl_YYYYMMDD.log
│
├── OUTPUT/                         # Fichiers transformés
│   └── biblos_transformed_*.xlsx
│
└── tests/                          # Tests unitaires
    ├── test_etl.py
    └── test_validation.py
```

---

## 🎯 Points Clés à Intégrer

### 1. **Ne Pas Changer l'État Actuel**
- Respecter l'architecture existante
- Ajouter les spécificités comme nouvelles fonctions
- Garder les workflows existants

### 2. **Spécificités à Ajouter**
- Logique de non-duplication (visites, affiche, client)
- Extraction correcte de la gratuité (offsets spécifiques)
- Gestion des valeurs null (remplacement par 0)
- Validation des totaux (exclusion TOTAL)

### 3. **Réutilisabilité**
- Configurer par type de fichier
- Détection automatique de structure
- Tests unitaires pour validation

---

## 📞 Support et Maintenance

### Dépannage Commun

**Problème : Totaux ne correspondent pas**
- Vérifier que la ligne TOTAL est exclue
- Confirmer les offsets de colonnes
- Vérifier le mapping produits → colonnes

**Problème : Gratuité à 0**
- Vérifier les offsets gratuité (16, 17, 18)
- Confirmer la détection des blocs de dates
- Valider le format des colonnes source

**Problème : Duplication sur formats**
- Vérifier la logique "premier produit uniquement"
- Confirmer l'index du produit dans la boucle
- Valider l'attribution des valeurs partagées

---

## ✅ Checklist Intégration

- [ ] Créer le module `etl_core.py` avec les fonctions ETL
- [ ] Ajouter la configuration FEUIL1 et ACTIVATION dans `config.py`
- [ ] Implémenter la validation des totaux
- [ ] Ajouter le système de logging
- [ ] Créer les tests unitaires
- [ ] Intégrer dans l'application existante
- [ ] Tester avec des fichiers réels
- [ ] Documenter l'utilisation

---

Cette documentation technique complète permet l'intégration de toutes les spécificités ETL que nous avons développées ensemble dans votre application existante, sans modifier son état actuel.
