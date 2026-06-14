import pandas as pd
import sys

try:
    print("Transforming file 5 data to requested structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    df = pd.read_excel(file_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Extract date and city from row 1
    date_city = df.iloc[1, 1]  # "SAN PEDRO/ 22/01/2026"
    print(f"Original date_city: '{date_city}'", file=sys.stderr)
    
    # Extract city (everything before first slash)
    slash_pos = date_city.find('/')
    city = date_city[:slash_pos].strip()
    
    # Extract date (everything after first slash)
    date_str = date_city[slash_pos+1:].strip()  # "22/01/2026"
    print(f"Extracted date_str: '{date_str}'", file=sys.stderr)
    
    date_formatted = pd.to_datetime(date_str, format='%d/%m/%Y')
    
    # Product mapping based on columns 17-21 (objectifs) and 42-46 (réalisations)
    products = {
        17: {"category": "Lait", "format": "Premium 16g"},
        18: {"category": "Lait", "format": "Premium 360g"}, 
        19: {"category": "Lait", "format": "Excellence 900g"},
        20: {"category": "Flocon d'avoine", "format": "50g"},
        21: {"category": "Flocon d'avoine", "format": "400g"}
    }
    
    result_data = []
    
    # Process each agent row (rows 7-26)
    for i in range(7, 27):
        agent_name = df.iloc[i, 1]
        
        # Skip if empty or TOTAL row
        if pd.isna(agent_name) or agent_name == "TOTAL ":
            continue
            
        # Calculate total visits (sum of columns 2-6)
        total_visits = 0
        for col in [2, 3, 4, 5, 6]:
            val = df.iloc[i, col]
            if pd.notna(val):
                total_visits += val
        
        # Process each product
        for obj_col, product_info in products.items():
            category = product_info["category"]
            format_name = product_info["format"]
            
            # Get objective (column 17-21)
            objective = df.iloc[i, obj_col]
            if pd.isna(objective):
                objective = 0
            
            # Get realization (column 42-46 corresponds to same product)
            real_col = obj_col + 25  # 17->42, 18->43, etc.
            realization = df.iloc[i, real_col]
            if pd.isna(realization):
                realization = 0
            
            # Calculate achievement rate
            if objective > 0:
                achievement_rate = (realization / objective) * 100
            else:
                achievement_rate = 0
            
            # Get freebies (column 52)
            freebies = df.iloc[i, 52]
            if pd.isna(freebies):
                freebies = 0
            
            # Get posters (sum of columns 12-14 for posters, but let's use column 47-49 which are poster counts)
            posters = df.iloc[i, 47]  # Affiche Biblos Lait Premium
            if pd.isna(posters):
                posters = 0
            
            # Create row
            row = {
                "Date": date_formatted,
                "Ville": city,
                "Grossiste": agent_name,  # Using agent name as grossiste
                "Categorie produit": category,
                "Format": format_name,
                "Objectif carton": objective,
                "Réalisation carton": realization,
                "Taux de réalisation": round(achievement_rate, 2),
                "Gratuité": freebies,
                "Affiche": posters,
                "Personne approchée": int(total_visits)
            }
            result_data.append(row)
    
    # Create DataFrame
    result_df = pd.DataFrame(result_data)
    
    # Save to CSV
    output_path = 'C:/Users/angec/biblos_database_result.csv'
    result_df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Database saved to {output_path}", file=sys.stderr)
    
    # Save statistics to file
    stats_path = 'C:/Users/angec/biblos_statistics.txt'
    with open(stats_path, 'w', encoding='utf-8') as f:
        f.write("=== TRANSFORMATION STATISTICS ===\n\n")
        f.write(f"Total rows: {len(result_df)}\n")
        f.write(f"Unique agents: {result_df['Grossiste'].nunique()}\n")
        f.write(f"Date range: {result_df['Date'].min()} to {result_df['Date'].max()}\n")
        f.write(f"Categories: {list(result_df['Categorie produit'].unique())}\n")
        f.write(f"Formats: {list(result_df['Format'].unique())}\n")
        f.write(f"Total visits: {result_df['Personne approchée'].sum()}\n")
        f.write(f"Total sales: {result_df['Réalisation carton'].sum()}\n")
        f.write(f"Average achievement rate: {result_df['Taux de réalisation'].mean():.2f}%\n")
        f.write(f"\n=== AGENTS LIST ===\n")
        f.write(f"\n".join(result_df['Grossiste'].unique()))
    
    print(f"Statistics saved to {stats_path}", file=sys.stderr)
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
