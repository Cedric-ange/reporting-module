import pandas as pd

try:
    print("Correcting Feuil1 with proper gratuité extraction...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    # Products with their gratuité column offsets from start_col
    # Offset +16 = Lait 16G gratuit
    # Offset +17 = Lait 900G gratuit
    # Offset +18 = Flocon 50g gratuit
    # Others = no gratuité column
    products = [
        {"name": "16G", "category": "Lait", "offset": 0, "gratuit_offset": 16},
        {"name": "360G", "category": "Lait", "offset": 1, "gratuit_offset": None},
        {"name": "900G", "category": "Lait", "offset": 2, "gratuit_offset": 17},
        {"name": "25KG Excell", "category": "Lait", "offset": 3, "gratuit_offset": None},
        {"name": "25KG Super", "category": "Lait", "offset": 4, "gratuit_offset": None},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5, "gratuit_offset": 18},
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6, "gratuit_offset": None}
    ]
    
    result_data = []
    
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        if pd.isna(ville) or str(ville) == "TOTAL":
            continue
        
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"])
            start_col = date_block["start_col"]
            
            # Get shared values
            visits = df.iloc[row_idx, start_col + 7]
            client = df.iloc[row_idx, start_col + 8]
            affiche = df.iloc[row_idx, start_col + 19]
            
            visits_val = float(visits) if pd.notna(visits) else 0
            client_val = float(client) if pd.notna(client) else 0
            affiche_val = float(affiche) if pd.notna(affiche) else 0
            
            # Process each product
            for i, product in enumerate(products):
                obj = df.iloc[row_idx, start_col + product["offset"]]
                real = df.iloc[row_idx, start_col + 9 + product["offset"]]
                
                obj_val = float(obj) if pd.notna(obj) else 0
                real_val = float(real) if pd.notna(real) else 0
                
                # Get gratuité
                freebies = 0
                if product["gratuit_offset"] is not None:
                    free_col = start_col + product["gratuit_offset"]
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
                
                # Client touché and affiche: only first product
                client_touche = client_val if i == 0 else 0
                affiche_final = affiche_val if i == 0 else 0
                visite_final = visits_val if i == 0 else 0
                
                # Calculate rate
                rate = (real_val / obj_val * 100) if obj_val > 0 else 0
                
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": product["category"],
                    "Format": product["name"],
                    "Objectif carton": obj_val,
                    "Réalisation carton": real_val,
                    "Taux de réalisation": round(rate, 2),
                    "Gratuité": freebies,
                    "Affiche": affiche_final,
                    "Personne approchée": int(visite_final),
                    "Personne touché (Client acheteur)": int(client_touche)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    print(f"Total rows: {len(result_df)}", file=sys.stderr)
    print(f"Non-zero gratuité: {(result_df['Gratuité'] > 0).sum()}", file=sys.stderr)
    print(f"Total gratuité: {result_df['Gratuité'].sum()}", file=sys.stderr)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_final_definitive.xlsx'
    result_df.to_excel(excel_path, index=False)
    
    print(f"File created: {excel_path}", file=sys.stderr)
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero gratuité: {(result_df['Gratuité'] > 0).sum()}")
    print(f"Total gratuité sum: {result_df['Gratuité'].sum()}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
