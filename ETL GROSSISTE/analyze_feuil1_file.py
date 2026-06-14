import pandas as pd
import sys

try:
    print("Analyzing the main file with Feuil1...", file=sys.stderr)
    
    # Analyze the main file without number
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Get sheet names first
    xls = pd.ExcelFile(file_path)
    print(f"Sheet names: {xls.sheet_names}", file=sys.stderr)
    
    # Read Feuil1
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    # Analyze structure
    print("\n=== DETAILED ROW ANALYSIS ===")
    for i in range(min(15, len(df))):
        print(f"\n--- ROW {i} ---")
        non_null_values = []
        for j in range(min(30, len(df.columns))):
            val = df.iloc[i, j]
            if pd.notna(val):
                non_null_values.append(f"Col {j}: {val}")
        
        if non_null_values:
            for val in non_null_values:
                print(val)
        else:
            print("[EMPTY]")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
