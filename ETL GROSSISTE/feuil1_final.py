import pandas as pd
import sys

try:
    print("Final Feuil1 correction with personne touché...", file=sys.stderr)
    
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
    
    products = ["16G", "360G", "900G", "25KG Excell", "25KG Super", "50G", "400G"]
    categories = ["Lait", "Lait", "Lait", "Lait", "Lait", "Flocon d'avoine", "Flocon d'avoine"]
    
    result_data = []
    
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        if pd.isna(ville) or str(ville) == "TOTAL":
            continue
        
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"])
            start_col = date_block["start_col"]
            
            # Get shared values for this date
            visits = df.iloc[row_idx, start_col + 7]
            client = df.iloc[row_idx, start_col + 8]
            affiche = df.iloc[row_idx, start_col + 19]
            
            visits_val = float(visits) if pd.notna(visits) else 0
            client_val = float(client) if pd.notna(client) else 0
            affiche_val = float(affiche) if pd.notna(affiche) else 0
            
            # Process each product
            for i in range(7):
                obj = df.iloc[row_idx, start_col + i]
                real = df.iloc[row_idx, start_col + 9 + i]
                
                obj_val = float(obj) if pd.notna(obj) else 0
                real_val = float(real) if pd.notna(real) else 0
                
                # Client touché and affiche: only first product
                client_touche = client_val if i == 0 else 0
                affiche_final = affiche_val if i == 0 else 0
                
                # Calculate rate
                rate = (real_val / obj_val * 100) if obj_val > 0 else 0
                
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": categories[i],
                    "Format": products[i],
                    "Objectif carton": obj_val,
                    "Réalisation carton": real_val,
                    "Taux de réalisation": round(rate, 2),
                    "Gratuité": 0,
                    "Affiche": affiche_final,
                    "Personne approchée": int(visits_val),
                    "Personne touché (Client acheteur)": int(client_touche)
                }
                result_data.append(row)
    
    print(f"Generated {len(result_data)} rows", file=sys.stderr)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_corrected.xlsx'
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
    
    print(f"Final file created: {excel_path}", file=sys.stderr)
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero personne touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}")
    print(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
    
    # Show sample
    print("\n=== SAMPLE DATA ===")
    print(result_df.head(10).to_string())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
