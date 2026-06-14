import pandas as pd
import sys

try:
    print("Correcting Feuil1 transformation with personne touché (client acheteur) logic...", file=sys.stderr)
    
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
        
        # Track per date: client acheteur (personne touché) and affiche - only assign to first product
        client_per_date = {}
        affiche_per_date = {}
        
        # Process each date block
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"], format='%Y-%m-%d')
            start_col = date_block["start_col"]
            
            # Get visits and client
            visits_col = start_col + 7  # Personnes approchées
            client_col = start_col + 8   # Client acheteur (personne touché)
            
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
            
            # Get affiche value (col 21 for first date block, +27 each block)
            affiche_col = start_col + 19
            affiche_value = df.iloc[row_idx, affiche_col]
            if pd.isna(affiche_value):
                affiche_value = 0
            else:
                affiche_value = float(affiche_value)
            
            client_per_date[date_obj] = client
            affiche_per_date[date_obj] = affiche_value
            
            # Process each product
            for i, product in enumerate(products):
                # Objective column
                obj_col = start_col + product["offset"]
                objective = df.iloc[row_idx, obj_col]
                if pd.isna(objective):
                    objective = 0
                else:
                    objective = float(objective)
                
                # Realization column
                real_col = start_col + 9 + product["offset"]
                realization = df.iloc[row_idx, real_col]
                if pd.isna(realization):
                    realization = 0
                else:
                    realization = float(realization)
                
                # Gratuité: check special columns (18-20 for first block)
                freebies = 0
                if start_col == 2:  # First date block special structure
                    if i == 0:  # 16G gratuit
                        free_col = 18
                    elif i == 2:  # 900G gratuit
                        free_col = 19
                    elif i == 5:  # 50G gratuit
                        free_col = 20
                    
                    if free_col < len(df.columns):
                        freebies = df.iloc[row_idx, free_col]
                        if pd.notna(freebies):
                            if isinstance(freebies, str) and ',' in str(freebies):
                                freebies = float(str(freebies).split(',')[0])
                            else:
                                freebies = float(freebies)
                else:
                    # For other date blocks
                    free_col = start_col + 18 + i if (start_col + 18 + i) < len(df.columns) else None
                    if free_col and free_col < len(df.columns):
                        freebies = df.iloc[row_idx, free_col]
                        if pd.notna(freebies):
                            if isinstance(freebies, str) and ',' in str(freebies):
                                freebies = float(str(freebies).split(',')[0])
                            else:
                                freebies = float(freebies)
                
                # Client acheteur (personne touché): only for first product
                client_touche = 0
                if i == 0:
                    client_touche = client_per_date[date_obj]
                
                # Affiche: only for first product  
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
                    "Personne approchée": int(visits),
                    "Personne touché (Client acheteur)": int(client_touche)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_corrected.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Final corrected Feuil1 Excel created: {excel_path}", file=sys.stderr)
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero personnes touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}")
    print(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
    
    # Show sample
    print("\n=== SAMPLE DATA ===")
    print(result_df.head(10).to_string())
    
    # Save verification report
    with open('C:/Users/angec/feuil1_correction_verification.txt', 'w', encoding='utf-8') as f:
        f.write("=== FEUIL1 FINAL CORRECTION VERIFICATION ===\n\n")
        f.write("Column 'Personne touché (Client acheteur)' added\n")
        f.write("Logic: Same as affiche - only first product per agent/date gets the value\n")
        f.write("All null values replaced with 0\n\n")
        f.write(f"Total rows: {len(result_df)}\n")
        f.write(f"Non-zero personne touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}\n")
        f.write(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}\n")
        f.write(f"Zero values count: {(result_df == 0).sum().sum()}")
    
    print("Verification report created: feuil1_correction_verification.txt", file=sys.stderr)
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
