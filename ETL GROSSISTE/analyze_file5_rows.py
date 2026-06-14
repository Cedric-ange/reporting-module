import sys
import traceback
import pandas as pd

try:
    print("Analyzing rows 5-30 of file 5...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    
    # Read without header
    df = pd.read_excel(file_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Analyze rows 5-30 in detail
    print("\n=== ROWS 5-30 DETAILED ANALYSIS ===")
    for i in range(5, min(30, len(df))):
        print(f"\n--- ROW {i} ---")
        non_null_values = []
        for j in range(len(df.columns)):
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
    traceback.print_exc()
