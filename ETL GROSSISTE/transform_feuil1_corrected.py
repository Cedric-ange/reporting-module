import pandas as pd
import sys

try:
    print("Correcting Feuil1 transformation...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze structure more carefully
    # From the analysis, I can see that for the first date (2026-01-24 starting at col 2):
    # Col 2: Objectif Lait 16G
    # Col 3: Objectif Lait 360G  
    # Col 4: Objectif Lait 900G
    # Col 5: Objectif Lait 25KG Excell
    # Col 6: Objectif Lait 25KG Super
    # Col 7: Objectif Flocon 50G
    # Col 8: Objectif Flocon 400G
    # Col 9: Visites (persons) - this is after objectives
    # Col 10: Client acheteur
    # Col 11: Réalisation Lait 16G
    # Col 18: Gratuit Lait 16G (or Affiche related)
    
    # Let me re-analyze the exact column positions from the structure
    # Looking at row 4 headers and row 8 data:
    # Col 2: "Objectif de vente (carton)" - first product objective
    # Col 9: "personnes approchées" - visits for first date
    # Col 10: "Client acheteur" - clients
    # Col 11: "Réalisation (carton)" - first product realization
    # Col 18: "Gratuit (chapelet & sachet)" - free items
    # Col 22: "Taux de réalisation" - achievement rate
    
    # So the structure per product per date is:
    # Objective column -> +7 = visits -> +8 = clients -> +9 = realization -> +16 = free -> +20 = rate
    
    # Define date blocks with their starting columns
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    # Products definition (7 products per date block)
    products = [
        {"category": "Lait", "format": "16G", "offset": 0},
        {"category": "Lait", "format": "360G", "offset": 1},
        {"category": "Lait", "format": "900G", "offset": 2},
        {"category": "Lait", "format": "25KG Excell", "offset": 3},
        {"category": "Lait", "format": "25KG Super", "offset": 4},
        {"category": "Flocon d'avoine", "format": "50G", "offset": 5},
        {"category": "Flocon d'avoine", "format": "400G", "offset": 6}
    ]
    
    result_data = []
    
    # Process data rows (8-12, excluding TOTAL row 13)
    for row_idx in range(8, 13):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        # Skip empty rows or TOTAL
        if pd.isna(ville) or ville == "TOTAL":
            continue
            
        # Process each date block
        for date_block in date_blocks:
            date_obj = pd.to_datetime(date_block["date"], format='%Y-%m-%d')
            start_col = date_block["start_col"]
            
            # Process each product
            for product in products:
                offset = product["offset"]
                
                # Calculate actual columns
                obj_col = start_col + offset  # Objective
                visits_col = start_col + 7   # Personnes approchées (same for all products in date block)
                client_col = start_col + 8   # Client acheteur
                real_col = start_col + 9 + offset  # Realization (offset + 9 from start)
                free_col = start_col + 16 + offset  # Gratuit
                rate_col = start_col + 20 + offset  # Taux de réalisation
                
                # For poster/affiche, need to check if it exists in the structure
                # From row 7, I see "Affiche" at specific columns like 21, 48, etc.
                # These seem to be at offset + 19 from objective for some products
                poster_col = start_col + 19 + offset  # Possible poster location
                
                # Extract values
                objective = df.iloc[row_idx, obj_col]
                if pd.isna(objective):
                    objective = 0
                
                visits = df.iloc[row_idx, visits_col]  # Same for all products
                if pd.isna(visits):
                    visits = 0
                
                realization = df.iloc[row_idx, real_col]
                if pd.isna(realization):
                    realization = 0
                
                freebies = df.iloc[row_idx, free_col]
                if pd.isna(freebies):
                    freebies = 0
                
                achievement_rate = df.iloc[row_idx, rate_col]
                if pd.isna(achievement_rate):
                    if objective > 0:
                        achievement_rate = (realization / objective) * 100
                    else:
                        achievement_rate = 0
                else:
                    achievement_rate = achievement_rate * 100 if achievement_rate < 10 else achievement_rate
                
                # Poster extraction - check if column exists and contains poster data
                posters = 0
                if poster_col < len(df.columns):
                    poster_val = df.iloc[row_idx, poster_col]
                    # From row 7, poster columns have "Affiche" as header
                    # From data, poster values seem to be in columns 21, 48, etc.
                    if pd.notna(poster_val) and poster_val > 0:
                        # Check if this looks like poster data vs other data
                        # Poster values are usually small integers
                        if isinstance(poster_val, (int, float)) and poster_val < 100:
                            posters = poster_val
                
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
                    "Personne approchée": int(visits)
                }
                result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to Excel
    excel_path = 'C:/Users/angec/feuil1_transformed_database.xlsx'
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main database sheet
        result_df.to_excel(writer, sheet_name='Base_Données', index=False)
        
        # Source sample for verification
        source_sample = df.iloc[8:12, :].copy()
        source_sample.to_excel(writer, sheet_name='Source_Échantillon', index=False, header=False)
    
    print(f"Excel file created: {excel_path}", file=sys.stderr)
    
    # Print detailed statistics
    print("\n=== TRANSFORMATION SUMMARY ===")
    print(f"Total rows: {len(result_df)}")
    print(f"Unique cities: {result_df['Ville'].nunique()}")
    print(f"Unique grossistes: {result_df['Grossiste'].nunique()}")
    print(f"Date range: {result_df['Date'].min()} to {result_df['Date'].max()}")
    print(f"Unique dates: {result_df['Date'].nunique()}")
    print(f"Categories: {list(result_df['Categorie produit'].unique())}")
    print(f"Formats: {list(result_df['Format'].unique())}")
    print(f"Total visits: {result_df['Personne approchée'].sum()}")
    print(f"Total sales: {result_df['Réalisation carton'].sum()}")
    print(f"Average achievement rate: {result_df['Taux de réalisation'].mean():.2f}%")
    print(f"Total posters: {result_df['Affiche'].sum()}")
    
    # Show sample
    print("\n=== SAMPLE DATA ===")
    print(result_df.head(15).to_string())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
