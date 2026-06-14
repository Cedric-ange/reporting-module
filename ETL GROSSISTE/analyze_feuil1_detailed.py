import pandas as pd
import sys

try:
    print("Analyzing Feuil1 structure in detail...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read Feuil1 without header
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze all rows with column structure
    print("\n=== COMPLETE STRUCTURE ANALYSIS ===")
    for i in range(len(df)):
        print(f"\n--- ROW {i} ---")
        non_null_count = 0
        for j in range(len(df.columns)):
            val = df.iloc[i, j]
            if pd.notna(val):
                non_null_count += 1
                if non_null_count <= 15:  # Show first 15 non-null values per row
                    print(f"  Col {j}: {val}")
        
        if non_null_count > 15:
            print(f"  ... ({non_null_count - 15} more values)")
        
        if non_null_count == 0:
            print("[EMPTY]")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
