# Configuration ETL BIBLOS

"""
Configuration pour le traitement automatique des fichiers BIBLOS
Place dans: D:/reporting-module/config.py
"""

import os

# Répertoires
SOURCE_DIR = "D:/reporting-module/DATA BIBLOS"
OUTPUT_DIR = "D:/reporting-module/OUTPUT"
LOG_DIR = "D:/reporting-module/logs"

# Configuration Feuil1 (Structure blocs dates)
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

# Configuration Activation Agents (Structure une date)
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
    "data_rows": range(7, 27)  # Agents rows (excluant TOTAL à la fin)
}

# Colonnes cibles de la base de données
TARGET_COLUMNS = [
    "Date",
    "Ville",
    "Grossiste",
    "Categorie produit",
    "Format",
    "Objectif carton",
    "Réalisation carton",
    "Taux de réalisation",
    "Gratuité",
    "Affiche",
    "Personne approchée",
    "Personne touché (Client acheteur)"
]

# Règles de transformation
TRANSFORMATION_RULES = {
    "exclude_total_row": True,
    "non_duplication_columns": ["Personne approchée", "Affiche", "Personne touché (Client acheteur)"],
    "replace_null_with_zero": True,
    "handle_comma_in_numbers": True,
    "validate_totals": True
}

# Configuration validation
VALIDATION_CONFIG = {
    "tolerance": 0.01,
    "check_fields": ["Objective", "Realization", "Visits", "Client", "Affiche", "Gratuite"],
    "fail_on_mismatch": False  # Continue même si validation échoue, mais loggue
}

# Fichiers à traiter automatiquement (pattern matching)
FILE_PATTERNS = [
    "REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST*.xlsx",
    "REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.2.xlsx"
]

# Sortie
OUTPUT_FILENAME_TEMPLATE = "biblos_transformed_{timestamp}.xlsx"
OUTPUT_SHEET_NAME = "Base_Données"
VALIDATION_SHEET_NAME = "Validation"
