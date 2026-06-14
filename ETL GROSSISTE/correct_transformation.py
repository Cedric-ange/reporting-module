import pandas as pd
import sys

try:
    print("Correcting transformation with gratuité and affiche fixes...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze the correct column structure from the CSV
    # From the analysis, I can see that for each date block:
    # - Products: 7 formats (cols 2-8 for first date)
    # - Then persons: col 9
    # - Then client: col 10  
    # - Then realization: cols 11-17 (7 products)
    # - Then special columns: col 18 (Lait 16G), col 19 (Lait 900G), col 20 (Flocon 50g), col 21 (Affiche)
    # - Then next date block starts at col 22, etc.
    
    # Looking at the structure more carefully from row 9:
    # Col 2-8: 16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G (objectives)
    # Col 11-17: 16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G (realizations)
    # Col 18: Lait 16G (gratuit for Lait 16G)
    # Col 19: Lait 900G (gratuit for Lait 900G)
    # Col 20: Flocon d'avoine 50g (gratuit for Flocon 50g)
    # Col 21: Affiche (affiche count)
    
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    # Product definitions with their categories and gratuit mappings
    products = [
        {"name": "16G", "category": "Lait", "offset": 0, "gratuit_offset": 0},  # gratuit at start + 18 + 0
        {"name": "360G", "category": "Lait", "offset": 1, "gratuit_offset": None},  # no specific gratuit column
        {"name": "900G", "category": "Lait", "offset": 2, "gratuit_offset": 1},  # gratuit at start + 18 + 1
        {"name": "25KG Excell", "category": "Lait", "offset": 3, "gratuit_offset": None},
        {"name": "25KG Super", "category": "Lait", "offset": 4, "gratuit_offset": None},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5, "gratuit_offset": 2},  # gratuit at start + 18 + 2
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6, "gratuit_offset": None}
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
            
            # Get visits and achievement rate (shared for all products in date block)
            visits_col = start_col + 7
            rate_col = start_col + 20  # general achievement rate column
            
            visits = df.iloc[row_idx, visits_col]
            if pd.isna(visits):
                visits = 0
            
            # Get affiche value (col 21 for first date block, should be +27 for subsequent blocks)
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
                
                # Gratuité column (if exists for this product)
                freebies = 0
                if product["gratuit_offset"] is not None:
                    free_col = start_col + 18 + product["gratuit_offset"]
                    freebies = df.iloc[row_idx, free_col]
                    # Fix: if it's a string with comma, extract the numeric part
                    if isinstance(freebies, str):
                        if ',' in str(freebies):
                            # Take the first part before comma
                            freebies = float(str(freebies).split(',')[0])
                        else:
                            freebies = float(freebies) if freebies else 0
                    elif pd.notna(freebies):
                        freebies = float(freebies)
                    else:
                        freebies = 0
                
                # Affiche: only for first product of each date, others get null/0
                affiche = 0
                if i == 0:  # First product
                    affiche = affiche_per_date[date_obj]
                else:
                    affiche = 0
                
                # Achievement rate (use general column or calculate)
                achievement_rate = df.iloc[row_idx, rate_col]
                if pd.isna(achievement_rate):
                    if objective > 0:
                        achievement_rate = (realization / objective) * 100
                    else:
                        achievement_rate = 0
                else:
                    achievement_rate = achievement_rate * 100 if achievement_rate < 10 else achievement_rate
                
                # Create row
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
    
    print(f"Corrected Excel file created: {excel_path}", file=sys.stderr)
    
    # Print verification
    print("\n=== CORRECTION SUMMARY ===")
    print(f"Total rows: {len(result_df)}")
    print(f"Total non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
    print(f"Total non-zero gratuites: {(result_df['Gratuité'] > 0).sum()}")
    
    # Check sample
    print("\n=== SAMPLE DATA ===")
    sample = result_df.head(15)
    print(sample.to_string())
    
    # Now do the same for File 5
    print("\n=== CORRECTING FILE 5 ===", file=sys.stderr)
    
    file5_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    df5 = pd.read_excel(file5_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Extract date and city from row 1
    date_city = df5.iloc[1, 1]  # "SAN PEDRO/ 22/01/2026"
    slash_pos = date_city.find('/')
    city = date_city[:slash_pos].strip()
    date_str = date_city[slash_pos+1:].strip()
    date_formatted = pd.to_datetime(date_str, format='%d/%m/%Y')
    
    products_file5 = {
        17: {"category": "Lait", "format": "Premium 16g"},
        18: {"category": "Lait", "format": "Premium 360g"}, 
        19: {"category": "Lait", "format": "Excellence 900g"},
        20: {"category": "Flocon d'avoine", "format": "50g"},
        21: {"category": "Flocon d'avoine", "format": "400g"}
    }
    
    result_data_file5 = []
    
    # Track affiche per agent - only assign to first product
    affiche_per_agent = {}
    
    # Process each agent row (rows 7-26)
    for i in range(7, 27):
        agent_name = df5.iloc[i, 1]
        
        if pd.isna(agent_name) or agent_name == "TOTAL ":
            continue
            
        # Calculate total visits
        total_visits = 0
        for col in [2, 3, 4, 5, 6]:
            val = df5.iloc[i, col]
            if pd.notna(val):
                total_visits += val
        
        # Get affiche value (col 47)
        affiche_value = df5.iloc[i, 47]
        if pd.isna(affiche_value):
            affiche_value = 0
        affiche_per_agent[agent_name] = affiche_value
        
        # Process each product
        for j, (obj_col, product_info) in enumerate(products_file5.items()):
            category = product_info["category"]
            format_name = product_info["format"]
            
            objective = df5.iloc[i, obj_col]
            if pd.isna(objective):
                objective = 0
            
            real_col = obj_col + 25
            realization = df5.iloc[i, real_col]
            if pd.isna(realization):
                realization = 0
            
            # Achievement rate
            if objective > 0:
                achievement_rate = (realization / objective) * 100
            else:
                achievement_rate = 0
            
            # Freebies (col 52)
            freebies = df5.iloc[i, 52]
            if pd.isna(freebies):
                freebies = 0
            # Fix: handle comma values
            if isinstance(freebies, str) and ',' in str(freebies):
                freebies = float(str(freebies).split(',')[0])
            elif isinstance(freebies, str):
                freebies = float(freebies) if freebies else 0
            else:
                freebies = float(freebies) if pd.notna(freebies) else 0
            
            # Affiche: only for first product
            affiche = 0
            if j == 0:
                affiche = affiche_per_agent[agent_name]
            else:
                affiche = 0
            
            row = {
                "Date": date_formatted,
                "Ville": city,
                "Grossiste": agent_name,
                "Categorie produit": category,
                "Format": format_name,
                "Objectif carton": objective,
                "Réalisation carton": realization,
                "Taux de réalisation": round(achievement_rate, 2),
                "Gratuité": freebies,
                "Affiche": affiche,
                "Personne approchée": int(total_visits)
            }
            result_data_file5.append(row)
    
    # Create DataFrame for file 5
    result_df_file5 = pd.DataFrame(result_data_file5)
    
    # Save to Excel
    excel_path_file5 = 'C:/Users/angec/biblos_transformed_corrected.xlsx'
    
    with pd.ExcelWriter(excel_path_file5, engine='openpyxl') as writer:
        result_df_file5.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Corrected File 5 Excel created: {excel_path_file5}", file=sys.stderr)
    
    print("\n=== FILE 5 CORRECTION SUMMARY ===")
    print(f"Total rows: {len(result_df_file5)}")
    print(f"Total non-zero affiches: {(result_df_file5['Affiche'] > 0).sum()}")
    print(f"Total non-zero gratuites: {(result_df_file5['Gratuité'] > 0).sum()}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
