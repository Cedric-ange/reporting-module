import pandas as pd
import sys

try:
    print("Correcting Feuil1 transformation...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Date blocks with their starting columns
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    # Product definitions with categories
    products = [
        {"name": "16G", "category": "Lait", "offset": 0},
        {"name": "360G", "category": "Lait", "offset": 1},
        {"name": "900G", "category": "Lait", "offset": 2},
        {"name": "25KG Excell", "category": "Lait", "offset": 3},
        {"name": "25KG Super", "category": "Lait", "offset": 4},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5},
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6}
    ]
    
    result_data = []
    
    # Process data rows (8-12)
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        if pd.isna(ville) or ville == "TOTAL":
            continue
        
        # Track affiche per date per agent - only assign to first product
        affiche_per_date = {}
        
        # Process each date block
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"], format='%Y-%m-%d')
            start_col = date_block["start_col"]
            
            # Get visits
            visits_col = start_col + 7
            visits = df.iloc[row_idx, visits_col]
            if pd.isna(visits):
                visits = 0
            
            # Get affiche value (col 21 for first date, then +27 each block)
            affiche_col = start_col + 19
            affiche_value = df.iloc[row_idx, affiche_col]
            if pd.isna(affiche_value):
                affiche_value = 0
            affiche_per_date[date_obj] = affiche_value
            
            # Process each product
            for i, product in enumerate(products):
                # Objective column
                obj_col = start_col + product["offset"]
                objective = df.iloc[row_idx, obj_col]
                if pd.isna(objective):
                    objective = 0
                
                # Realization column
                real_col = start_col + 9 + product["offset"]
                realization = df.iloc[row_idx, real_col]
                if pd.isna(realization):
                    realization = 0
                
                # Gratuité: check columns 18-20 for first date block
                # Based on analysis, gratuit columns are at start + 18, 19, 20
                freebies = 0
                if start_col == 2:  # First date block has special gratuit structure
                    if i == 0:  # 16G
                        free_col = 18
                    elif i == 2:  # 900G
                        free_col = 19
                    elif i == 5:  # 50G
                        free_col = 20
                    
                    if free_col < len(df.columns):
                        freebies = df.iloc[row_idx, free_col]
                        if pd.notna(freebies):
                            if isinstance(freebies, str):
                                if ',' in str(freebies):
                                    freebies = float(str(freebies).split(',')[0])
                                else:
                                    freebies = float(freebies)
                            else:
                                freebies = float(freebies)
                else:
                    # For other date blocks, gratuit columns are at start + 18-20 + offset
                    free_col = start_col + 18 + i if (start_col + 18 + i) < len(df.columns) else None
                    if free_col:
                        freebies = df.iloc[row_idx, free_col]
                        if pd.notna(freebies):
                            if isinstance(freebies, str):
                                if ',' in str(freebies):
                                    freebies = float(str(freebies).split(',')[0])
                                else:
                                    freebies = float(freebies)
                            else:
                                freebies = float(freebies)
                
                # Affiche: only for first product of each date
                affiche = 0
                if i == 0:
                    affiche = affiche_per_date[date_obj]
                
                # Achievement rate
                rate_col = start_col + 20
                achievement_rate = df.iloc[row_idx, rate_col]
                if pd.isna(achievement_rate):
                    if objective > 0:
                        achievement_rate = (realization / objective) * 100
                    else:
                        achievement_rate = 0
                else:
                    achievement_rate = achievement_rate * 100 if achievement_rate < 10 else achievement_rate
                
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": product["category"],
                    "Format": product["name"],
                    "Objectif carton": objective,
                    "Réalisation carton": realization,
                    "Taux de réalisation": round(achievement_rate, 2),
                    "Gratuité": freebies,
                    "Affiche": affiche,
                    "Personne approchée": int(visits)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_corrected.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Corrected Feuil1 Excel created: {excel_path}", file=sys.stderr)
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
    print(f"Non-zero gratuites: {(result_df['Gratuité'] > 0).sum()}")
    
    # Show sample
    print("\n=== SAMPLE DATA ===")
    sample = result_df.head(15)
    print(sample.to_string())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
