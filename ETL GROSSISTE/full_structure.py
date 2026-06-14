import sys
import traceback
import pandas as pd

try:
    print("Reading complete structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read without header to see the raw structure
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Print first 10 rows completely
    print("=== FIRST 10 ROWS COMPLETE ===")
    for i in range(min(10, len(df))):
        print(f"\n--- ROW {i} ---")
        non_null = df.iloc[i].dropna()
        if len(non_null) > 0:
            print(non_null.to_string())
        else:
            print("[EMPTY]")
    
    # Also look at row 3 and 4 more specifically
    print("\n=== DETAILED ROWS 3-6 ===")
    for i in range(3, min(7, len(df))):
        print(f"\n--- ROW {i} ---")
        # Print first 30 columns
        row_slice = df.iloc[i, :30]
        print(row_slice.to_string())
        
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
