"""
Module ETL Core pour traitement BIBLOS
Place dans: D:/reporting-module/etl_core.py
"""

import pandas as pd
import numpy as np
from datetime import datetime


# =====================================================
# FONCTIONS D'EXTRACTION
# =====================================================

def extract_value(df, row_idx, col_idx):
    """
    Extrait une valeur numérique, gère les null et les virgules
    
    Args:
        df: DataFrame source
        row_idx: Index de la ligne
        col_idx: Index de la colonne
    
    Returns:
        Valeur numérique (float) ou 0
    """
    val = df.iloc[row_idx, col_idx]
    if pd.isna(val):
        return 0
    if isinstance(val, str):
        if ',' in val:
            return float(val.split(',')[0])
        return float(val)
    return float(val)


def extract_gratuity(df, row_idx, start_col, gratuit_offset):
    """
    Extrait la valeur de gratuité selon l'offset du produit
    
    Args:
        df: DataFrame source
        row_idx: Index de la ligne
        start_col: Colonne de départ du bloc de date
        gratuit_offset: Offset de la colonne de gratuité
    
    Returns:
        Valeur de gratuité
    """
    if gratuit_offset is None:
        return 0
    
    free_col = start_col + gratuit_offset
    if free_col < len(df.columns):
        return extract_value(df, row_idx, free_col)
    return 0


def extract_shared_values(df, row_idx, start_col):
    """
    Extrait les valeurs partagées pour tous les produits d'une date
    
    Args:
        df: DataFrame source
        row_idx: Index de la ligne
        start_col: Colonne de départ du bloc de date
    
    Returns:
        dict with visits, client, affiche values
    """
    return {
        "visits": extract_value(df, row_idx, start_col + 7),
        "client": extract_value(df, row_idx, start_col + 8),
        "affiche": extract_value(df, row_idx, start_col + 19)
    }


def calculate_achievement_rate(objective, realization):
    """
    Calcule le taux de réalisation
    
    Args:
        objective: Valeur objective
        realization: Valeur réalisée
    
    Returns:
        Taux de réalisation en %
    """
    if objective > 0:
        return round((realization / objective) * 100, 2)
    return 0


def detect_data_rows(df):
    """
    Détecte les lignes de données (excluant TOTAL)
    
    Args:
        df: DataFrame source
    
    Returns:
        list of row indices
    """
    data_rows = []
    for i in range(8, len(df)):  # Start at row 8
        val = df.iloc[i, 0]
        if pd.isna(val) or str(val) == "TOTAL":
            break
        data_rows.append(i)
    return data_rows


def detect_date_blocks(df):
    """
    Détecte automatiquement les blocs de dates dans l'en-tête
    
    Args:
        df: DataFrame source
    
    Returns:
        list of date blocks with start_col
    """
    date_blocks = []
    known_positions = [2, 29, 56, 83, 110, 137, 164]
    
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
    """
    Parse une date Excel au format datetime
    
    Args:
        date_str: Date en string ou datetime
    
    Returns:
        datetime object
    """
    if isinstance(date_str, str):
        return pd.to_datetime(date_str.split()[0])
    return pd.to_datetime(date_str)


# =====================================================
# FONCTIONS DE TRANSFORMATION
# =====================================================

def transform_feuil1_data(file_path, sheet_name="Feuil1"):
    """
    Transforme un fichier Feuil1 selon les spécifications BIBLOS
    
    Args:
        file_path: Chemin vers le fichier Excel
        sheet_name: Nom de la feuille
    
    Returns:
        DataFrame transformé
    """
    from config import FEUIL1_CONFIG
    
    # Lecture du fichier source
    df_source = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    products = FEUIL1_CONFIG["products"]
    date_blocks = detect_date_blocks(df_source)
    data_rows = detect_data_rows(df_source)
    
    result_data = []
    
    # Traitement de chaque ligne de données
    for row_idx in data_rows:
        ville = df_source.iloc[row_idx, 0]
        grossiste = df_source.iloc[row_idx, 1]
        
        if pd.isna(ville) or str(ville) == "TOTAL":
            continue
        
        # Traitement de chaque bloc de date
        for date_block in date_blocks:
            date_obj = parse_date(date_block["date"])
            start_col = date_block["start_col"]
            
            # Extraction des valeurs partagées
            shared_values = extract_shared_values(df_source, row_idx, start_col)
            
            # Traitement de chaque produit
            for product_idx, product in enumerate(products):
                obj_val = extract_value(df_source, row_idx, start_col + product["offset"])
                real_val = extract_value(df_source, row_idx, start_col + 9 + product["offset"])
                freebies = extract_gratuity(df_source, row_idx, start_col, product["gratuit_offset"])
                
                # Application des règles de non-duplication
                visite_final = shared_values["visits"] if product_idx == 0 else 0
                client_touche = shared_values["client"] if product_idx == 0 else 0
                affiche_final = shared_values["affiche"] if product_idx == 0 else 0
                
                rate = calculate_achievement_rate(obj_val, real_val)
                
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
    
    # Création du DataFrame
    df_transformed = pd.DataFrame(result_data)
    
    # Remplacement des NaN par 0
    df_transformed = df_transformed.fillna(0)
    
    return df_transformed


def transform_activation_data(file_path, sheet_name=None):
    """
    Transforme un fichier d'activation agents
    
    Args:
        file_path: Chemin vers le fichier Excel
        sheet_name: Nom de la feuille (ou None pour auto-détection)
    
    Returns:
        DataFrame transformé
    """
    from config import ACTIVATION_CONFIG
    
    # Détection de la feuille si non spécifiée
    if sheet_name is None:
        xl = pd.ExcelFile(file_path)
        sheet_name = xl.sheet_names[0]  # Prendre la première feuille
    
    df_source = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    products = ACTIVATION_CONFIG["products"]
    visits_columns = ACTIVATION_CONFIG["visits_columns"]
    data_rows = ACTIVATION_CONFIG["data_rows"]
    
    # Extraction date et ville
    date_city = df_source.iloc[1, 1]
    slash_pos = date_city.find('/')
    city = date_city[:slash_pos].strip()
    date_str = date_city[slash_pos+1:].strip()
    date_formatted = pd.to_datetime(date_str, format='%d/%m/%Y')
    
    result_data = []
    
    # Traitement de chaque ligne d'agent
    for row_idx in data_rows:
        agent_name = df_source.iloc[row_idx, 1]
        
        if pd.isna(agent_name) or agent_name == "TOTAL ":
            continue
        
        # Calcul total visites
        total_visits = 0
        for col in visits_columns:
            val = df_source.iloc[row_idx, col]
            if pd.notna(val):
                total_visits += val
        
        # Get affiche
        affiche_value = extract_value(df_source, row_idx, 47)
        
        # Traitement de chaque produit
        for product_idx, product in enumerate(products):
            category = product["category"]
            format_name = product["name"]
            
            objective = extract_value(df_source, row_idx, product["obj_col"])
            realization = extract_value(df_source, row_idx, product["real_col"])
            freebies = extract_value(df_source, row_idx, product["gratuit_col"])
            
            # Application règles non-duplication
            affiche = affiche_value if product_idx == 0 else 0
            visits = total_visits if product_idx == 0 else 0
            
            rate = calculate_achievement_rate(objective, realization)
            
            row = {
                "Date": date_formatted,
                "Ville": city,
                "Grossiste": agent_name,
                "Categorie produit": category,
                "Format": format_name,
                "Objectif carton": objective,
                "Réalisation carton": realization,
                "Taux de réalisation": rate,
                "Gratuité": freebies,
                "Affiche": affiche,
                "Personne approchée": int(visits),
                "Personne touché (Client acheteur)": 0
            }
            result_data.append(row)
    
    df_transformed = pd.DataFrame(result_data)
    df_transformed = df_transformed.fillna(0)
    
    return df_transformed


# =====================================================
# FONCTIONS DE VALIDATION
# =====================================================

def validate_data_integrity(df_source, df_transformed):
    """
    Vérifie que les totaux correspondent entre source et transformé
    
    Args:
        df_source: DataFrame source
        df_transformed: DataFrame transformé
    
    Returns:
        dict with validation results
    """
    source_totals = calculate_source_totals(df_source)
    
    transformed_totals = {
        "objective": df_transformed['Objectif carton'].sum(),
        "realization": df_transformed['Réalisation carton'].sum(),
        "visits": df_transformed['Personne approchée'].sum(),
        "client": df_transformed['Personne touché (Client acheteur)'].sum(),
        "affiche": df_transformed['Affiche'].sum(),
        "gratuite": df_transformed['Gratuité'].sum()
    }
    
    validation_results = {
        "objective_match": abs(source_totals["objective"] - transformed_totals["objective"]) < 0.01,
        "realization_match": abs(source_totals["realization"] - transformed_totals["realization"]) < 0.01,
        "visits_match": abs(source_totals["visits"] - transformed_totals["visits"]) < 0.01,
        "client_match": abs(source_totals["client"] - transformed_totals["client"]) < 0.01,
        "affiche_match": abs(source_totals["affiche"] - transformed_totals["affiche"]) < 0.01,
        "gratuite_match": abs(source_totals["gratuite"] - transformed_totals["gratuite"]) < 0.01
    }
    
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
            
            totals["visits"] += extract_value(df, row_idx, start_col + 7)
            totals["client"] += extract_value(df, row_idx, start_col + 8)
            totals["affiche"] += extract_value(df, row_idx, start_col + 19)
            
            for i in range(7):
                totals["objective"] += extract_value(df, row_idx, start_col + i)
            
            for i in range(7):
                totals["realization"] += extract_value(df, row_idx, start_col + 9 + i)
            
            totals["gratuite"] += extract_value(df, row_idx, start_col + 16)
            totals["gratuite"] += extract_value(df, row_idx, start_col + 17)
            totals["gratuite"] += extract_value(df, row_idx, start_col + 18)
    
    return totals


# =====================================================
# FONCTIONS D'EXPORT
# =====================================================

def export_to_excel(df_transformed, output_path, include_validation=True):
    """
    Exporte le DataFrame transformé vers Excel
    
    Args:
        df_transformed: DataFrame transformé
        output_path: Chemin du fichier de sortie
        include_validation: Inclure feuille de validation
    """
    from config import OUTPUT_SHEET_NAME, VALIDATION_SHEET_NAME, TARGET_COLUMNS
    
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        # Feuille principale
        df_transformed[TARGET_COLUMNS].to_excel(writer, sheet_name=OUTPUT_SHEET_NAME, index=False)
        
        if include_validation:
            validation_sheet = create_validation_summary(df_transformed)
            validation_sheet.to_excel(writer, sheet_name=VALIDATION_SHEET_NAME, index=False)
    
    return output_path


def create_validation_summary(df):
    """Crée un résumé de validation"""
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


# =====================================================
# DÉTECTION AUTOMATIQUE DU TYPE DE FICHIER
# =====================================================

def detect_file_type(file_path):
    """
    Détecte automatiquement le type de fichier
    
    Args:
        file_path: Chemin vers le fichier Excel
    
    Returns:
        "FEUIL1", "ACTIVATION", ou "UNKNOWN"
    """
    xl = pd.ExcelFile(file_path)
    
    if "Feuil1" in xl.sheet_names:
        return "FEUIL1"
    
    for sheet in xl.sheet_names:
        if any(day in sheet for day in ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]):
            return "ACTIVATION"
    
    return "UNKNOWN"


def transform_file(file_path):
    """
    Fonction principale de transformation avec détection automatique
    
    Args:
        file_path: Chemin vers le fichier Excel
    
    Returns:
        DataFrame transformé ou None si erreur
    """
    try:
        file_type = detect_file_type(file_path)
        
        if file_type == "FEUIL1":
            return transform_feuil1_data(file_path)
        elif file_type == "ACTIVATION":
            return transform_activation_data(file_path)
        else:
            print(f"Type de fichier non supporté: {file_type}")
            return None
            
    except Exception as e:
        print(f"Erreur transformation {file_path}: {e}")
        return None
