import pandas as pd
import sys

try:
    print("Correcting Feuil1 with personne touché - simplified version...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Date blocks
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    # Products
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
    
    print(f"Processing data rows 8-12...", file=sys.stderr)
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        if pd.isna(ville) or str(ville) == "TOTAL":
            print(f"Skipping row {row_idx}: {ville}", file=sys.stderr)
            continue
        
        print(f"Processing: {ville} - {grossiste}", file=sys.stderr)
        
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"], format='%Y-%m-%d')
            start_col = date_block["start_col"]
            
            # Get shared values
            visits_col = start_col + 7
            client_col = start_col + 8
            affiche_col = start_col + 19
            
            visits = df.iloc[row_idx, visits_col]
            if pd.isna(visits):
                visits = 0
            else:
                visits = float(visits)
            
            client = df.iloc[row_idx, client_col]
            if pd.isna(client):
                client = 0
            else:
                client = float(client)
            
            affiche = df.iloc[row_idx, affiche_col]
            if pd.isna(affiche):
                affiche = 0
            else:
                affiche = float(affiche)
            
            # Process each product
            for i, product in enumerate(products):
                obj_col = start_col + product["offset"]
                real_col = start_col + 9 + product["offset"]
                
                objective = df.iloc[row_idx, obj_col]
                if pd.isna(objective):
                    objective = 0
                else:
                    objective = float(objective)
                
                realization = df.iloc[row_idx, real_col]
                if pd.isna(realization):
                    realization = 0
                else:
                    realization = float(realization)
                
                # Gratuité (simplified)
                freebies = 0
                
                # Client touché: first product only
                client_touche = client if i == 0 else 0
                
                # Affiche: first product only
                affiche_val = affiche if i == 0 else 0
                
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
                    "Affiche": affiche_val,
                    "Personne approchée": int(visits),
                    "Personne touché (Client acheteur)": int(client_touche)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    print(f"Total rows generated: {len(result_df)}", file=sys.stderr)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_corrected.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Final corrected Feuil1 created: {excel_path}", file=sys.stderr)
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero personne touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}")
    print(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
