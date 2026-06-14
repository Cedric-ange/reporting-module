import pandas as pd
import sys

try:
    print("Transforming Feuil1 data to requested structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Date columns from header row (row 3)
    date_columns = {
        2: "2026-01-24",
        29: "2026-01-26", 
        56: "2026-01-27",
        83: "2026-01-28",
        110: "2026-01-29",
        137: "2026-01-30",
        164: "2026-01-31",
        191: "TOTAL"
    }
    
    # Product mapping from row 6-7
    # Row 6 has categories (Lait, Flocon d'avoine)
    # Row 7 has formats (16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G)
    
    # For each date block, the structure is:
    # - Objective: base_col + 0
    # - Persons approached: base_col + 7  
    # - Client buyer: base_col + 8
    # - Realization: base_col + 9
    # - Free items: base_col + 16
    # - Achievement rate: base_col + 20
    # - Poster: appears at base_col + 19 (Affiche)
    
    # Define product structure for first date block (columns 2-8)
    products_first_date = [
        {"col": 2, "category": "Lait", "format": "16G"},
        {"col": 3, "category": "Lait", "format": "360G"},
        {"col": 4, "category": "Lait", "format": "900G"},
        {"col": 5, "category": "Lait", "format": "25KG Excell"},
        {"col": 6, "category": "Lait", "format": "25KG Super"},
        {"col": 7, "category": "Flocon d'avoine", "format": "50G"},
        {"col": 8, "category": "Flocon d'avoine", "format": "400G"}
    ]
    
    result_data = []
    
    # Process data rows (8-12)
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        # Skip TOTAL row
        if pd.isna(ville) or ville == "TOTAL":
            continue
            
        # Process each date
        for base_col, date_str in date_columns.items():
            if date_str == "TOTAL":
                continue  # Skip TOTAL column for now
                
            date_obj = pd.to_datetime(date_str, format='%Y-%m-%d')
            
            # Process each product for this date
            for product in products_first_date:
                # Calculate column offsets for this date block
                col_offset = base_col - 2  # Normalize to first date block
                
                # Objective column
                obj_col = product["col"] + col_offset
                objective = df.iloc[row_idx, obj_col]
                if pd.isna(objective):
                    objective = 0
                
                # Realization column (base + 9 from objective)
                real_col = obj_col + 9
                realization = df.iloc[row_idx, real_col]
                if pd.isna(realization):
                    realization = 0
                
                # Achievement rate column (base + 20 from objective)
                rate_col = obj_col + 20
                achievement_rate = df.iloc[row_idx, rate_col]
                if pd.isna(achievement_rate):
                    if objective > 0:
                        achievement_rate = (realization / objective) * 100
                    else:
                        achievement_rate = 0
                else:
                    achievement_rate = achievement_rate * 100 if achievement_rate < 1 else achievement_rate
                
                # Free items column (base + 16 from objective)
                free_col = obj_col + 16
                freebies = df.iloc[row_idx, free_col]
                if pd.isna(freebies):
                    freebies = 0
                
                # Poster column (base + 19 from objective, when available)
                poster_col = obj_col + 19
                if poster_col < len(df.columns):
                    posters = df.iloc[row_idx, poster_col]
                    if pd.isna(posters):
                        posters = 0
                else:
                    posters = 0
                
                # Persons approached column (base + 7 from objective)
                persons_col = obj_col + 7
                persons = df.iloc[row_idx, persons_col]
                if pd.isna(persons):
                    persons = 0
                
                # Create row
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": product["category"],
                    "Format": product["format"],
                    "Objectif carton": objective,
                    "Réalisation carton": realization,
                    "Taux de réalisation": round(achievement_rate, 2),
                    "Gratuité": freebies,
                    "Affiche": posters,
                    "Personne approchée": int(persons)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_database.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main database sheet
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
        
        # Verification sheet
        verification_df = result_df.copy()
        verification_df.to_excel(writer, sheet_name='Vérification', index=False)
    
    print(f"Excel file created: {excel_path}", file=sys.stderr)
    
    # Print statistics
    print("\n=== TRANSFORMATION SUMMARY ===")
    print(f"Total rows: {len(result_df)}")
    print(f"Unique cities: {result_df['Ville'].nunique()}")
    print(f"Unique grossistes: {result_df['Grossiste'].nunique()}")
    print(f"Date range: {result_df['Date'].min()} to {result_df['Date'].max()}")
    print(f"Categories: {result_df['Categorie produit'].unique()}")
    print(f"Formats: {result_df['Format'].unique()}")
    print(f"Total visits: {result_df['Personne approchée'].sum()}")
    print(f"Total sales: {result_df['Réalisation carton'].sum()}")
    print(f"Average achievement rate: {result_df['Taux de réalisation'].mean():.2f}%")
    
    # Save verification report
    verification_report_path = 'C:/Users/angec/feuil1_verification_report.txt'
    with open(verification_report_path, 'w', encoding='utf-8') as f:
        f.write("=== FEUIL1 TRANSFORMATION VERIFICATION ===\n\n")
        f.write(f"Source: REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx\n")
        f.write(f"Sheet: Feuil1\n")
        f.write(f"Shape: {df.shape}\n\n")
        
        f.write("=== STRUCTURE ANALYSIS ===\n")
        f.write("Row 0: Title\n")
        f.write("Row 1: Subtitle\n")
        f.write("Row 2: Empty\n")
        f.write("Row 3: Headers (VILLE, GROSSISTE, dates: 24/01, 26/01, 27/01, 28/01, 29/01, 30/01, 31/01, TOTAL)\n")
        f.write("Row 4: Sub-headers (Objectif, persons, client, realization, gratuit, rate)\n")
        f.write("Row 5: Empty\n")
        f.write("Row 6: Product categories (Lait, Flocon d'avoine)\n")
        f.write("Row 7: Product formats (16G, 360G, 900G, 25KG Excell, 25KG Super, 50G, 400G)\n")
        f.write("Rows 8-12: Data by city/grossiste\n")
        f.write("Row 13: TOTAL\n\n")
        
        f.write("=== COLUMN MAPPING ===\n")
        f.write("For each date block:\n")
        f.write("  - Objective: base_col\n")
        f.write("  - Persons: base_col + 7\n")
        f.write("  - Realization: base_col + 9\n")
        f.write("  - Gratuit: base_col + 16\n")
        f.write("  - Achievement rate: base_col + 20\n")
        f.write("  - Poster: base_col + 19 (when available)\n\n")
        
        f.write("=== TRANSFORMATION STATISTICS ===\n")
        f.write(f"Total rows transformed: {len(result_df)}\n")
        f.write(f"Unique cities: {result_df['Ville'].nunique()}\n")
        f.write(f"Unique grossistes: {result_df['Grossiste'].nunique()}\n")
        f.write(f"Date range: {result_df['Date'].min()} to {result_df['Date'].max()}\n")
        f.write(f"Categories: {list(result_df['Categorie produit'].unique())}\n")
        f.write(f"Formats: {list(result_df['Format'].unique())}\n")
        f.write(f"Total visits: {result_df['Personne approchée'].sum()}\n")
        f.write(f"Total sales: {result_df['Réalisation carton'].sum()}\n")
        f.write(f"Average achievement rate: {result_df['Taux de réalisation'].mean():.2f}%\n\n")
        
        f.write("=== SAMPLE DATA ===\n")
        f.write(result_df.head(10).to_string())
    
    print(f"Verification report saved: {verification_report_path}", file=sys.stderr)
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
