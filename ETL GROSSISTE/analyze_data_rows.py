import sys
import traceback
import pandas as pd

try:
    print("Analyzing data rows...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read without header
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze rows 5-15 for actual data
    print("=== ROWS 5-15 DATA STRUCTURE ===")
    for i in range(5, min(15, len(df))):
        print(f"\n--- ROW {i} ---")
        # Get the non-null values with their column indices for first 50 columns
        non_null_count = 0
        for j in range(min(50, len(df.columns))):
            val = df.iloc[i, j]
            if pd.notna(val):
                print(f"Col {j}: {val}")
                non_null_count += 1
        if non_null_count == 0:
            print("[No data in first 50 columns]")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
