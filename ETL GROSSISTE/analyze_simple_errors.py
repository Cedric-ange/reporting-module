import pandas as pd
import sys

try:
    print("Simple error analysis...", file=sys.stderr)
    
    # Analyze Feuil1
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Check gratuité values
    print("=== GRATUITÉ VALUES ===", file=sys.stderr)
    print("Row 8 gratuit columns (18-25):")
    for col in range(18, 25):
        val = df.iloc[7, col]
        print(f"  Col {col}: {val}")
    
    # Check affiche values  
    print("\n=== AFFICHE VALUES ===", file=sys.stderr)
    print("Row 8 potential affiche columns (21, 48, 75):")
    for col in [21, 48, 75]:
        if col < len(df.columns):
            val = df.iloc[7, col]
            print(f"  Col {col}: {val}")
    
    # Check transformed file
    print("\n=== TRANSFORMED FILE CHECK ===", file=sys.stderr)
    transformed_path = 'C:/Users/angec/feuil1_transformed_database.xlsx'
    df_trans = pd.read_excel(transformed_path, sheet_name='Base_Données')
    
    print("Sample gratuité values:", file=sys.stderr)
    print(df_trans['Gratuité'].head(10).tolist())
    
    print("Sample affiche values:", file=sys.stderr)
    print(df_trans['Affiche'].head(10).tolist())
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
