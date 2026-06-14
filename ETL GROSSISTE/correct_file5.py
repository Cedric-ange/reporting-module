import pandas as pd
import sys

try:
    print("Correcting File 5 transformation...", file=sys.stderr)
    
    file5_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    df5 = pd.read_excel(file5_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Extract date and city
    date_city = df5.iloc[1, 1]
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
    
    # Track affiche per agent
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
            
            # Freebies (col 52) - fix comma values
            freebies = df5.iloc[i, 52]
            if pd.isna(freebies):
                freebies = 0
            elif isinstance(freebies, str):
                if ',' in str(freebies):
                    freebies = float(str(freebies).split(',')[0])
                else:
                    freebies = float(freebies)
            else:
                freebies = float(freebies)
            
            # Affiche: only for first product
            affiche = 0
            if j == 0:
                affiche = affiche_per_agent[agent_name]
            
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
    
    # Create DataFrame
    result_df_file5 = pd.DataFrame(result_data_file5)
    
    # Save to Excel
    excel_path_file5 = 'C:/Users/angec/biblos_transformed_corrected.xlsx'
    
    with pd.ExcelWriter(excel_path_file5, engine='openpyxl') as writer:
        result_df_file5.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Corrected File 5 Excel created: {excel_path_file5}", file=sys.stderr)
    print(f"Total rows: {len(result_df_file5)}")
    print(f"Non-zero affiches: {(result_df_file5['Affiche'] > 0).sum()}")
    print(f"Non-zero gratuites: {(result_df_file5['Gratuité'] > 0).sum()}")
    
    # Show sample
    print("\n=== SAMPLE DATA ===")
    print(result_df_file5.head(10).to_string())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
