import sys
import traceback
import pandas as pd

try:
    print("Analyzing file 5 in detail...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    
    # Read without header to see the complete structure
    df = pd.read_excel(file_path, sheet_name='JEUDI 22 JANV', header=None)
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    # Print all rows completely to understand the structure
    print("\n=== ALL ROWS COMPLETE ===")
    for i in range(len(df)):
        print(f"\n--- ROW {i} ---")
        non_null = df.iloc[i].dropna()
        if len(non_null) > 0:
            print(non_null.to_string())
        else:
            print("[EMPTY]")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
