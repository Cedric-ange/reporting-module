import pandas as pd
import sys

try:
    print("Simplified Feuil1 transformation...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    result_data = []
    
    # Process row 8 only first
    row_idx = 8
    ville = df.iloc[row_idx, 0]
    grossiste = df.iloc[row_idx, 1]
    
    print(f"Processing: {ville} - {grossiste}", file=sys.stderr)
    
    # First date block
    start_col = 2
    date_obj = pd.to_datetime("2026-01-24")
    
    # Get shared values
    visits = df.iloc[row_idx, start_col + 7]
    client = df.iloc[row_idx, start_col + 8]
    affiche = df.iloc[row_idx, start_col + 19]
    
    print(f"Visits: {visits}, Client: {client}, Affiche: {affiche}", file=sys.stderr)
    
    # Process 7 products
    products = ["16G", "360G", "900G", "25KG Excell", "25KG Super", "50G", "400G"]
    categories = ["Lait", "Lait", "Lait", "Lait", "Lait", "Flocon d'avoine", "Flocon d'avoine"]
    
    for i in range(7):
        obj = df.iloc[row_idx, start_col + i]
        real = df.iloc[row_idx, start_col + 9 + i]
        
        obj_val = 0 if pd.isna(obj) else float(obj)
        real_val = 0 if pd.isna(real) else float(real)
        
        client_touche = float(client) if i == 0 and pd.notna(client) else 0
        affiche_val = float(affiche) if i == 0 and pd.notna(affiche) else 0
        visits_val = float(visits) if pd.notna(visits) else 0
        
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
            "Affiche": affiche_val,
            "Personne approchée": int(visits_val),
            "Personne touché (Client acheteur)": int(client_touche)
        }
        result_data.append(row)
    
    print(f"Generated {len(result_data)} rows", file=sys.stderr)
    
    # Create DataFrame and save
    result_df = pd.DataFrame(result_data)
    excel_path = 'C:/Users/angec/feuil1_test.xlsx'
    result_df.to_excel(excel_path, index=False)
    print(f"Test file created: {excel_path}", file=sys.stderr)
    print(result_df.to_string())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
