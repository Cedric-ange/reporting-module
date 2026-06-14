import sys
import traceback
import pandas as pd

try:
    print("Analyzing header structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read without header
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze rows 3-7 for header structure
    print("=== ROWS 3-7 HEADER STRUCTURE ===")
    for i in range(3, min(8, len(df))):
        print(f"\n--- ROW {i} ---")
        # Get the non-null values with their column indices
        for j, val in enumerate(df.iloc[i]):
            if pd.notna(val):
                print(f"Col {j}: {val}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
