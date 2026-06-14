import sys
import traceback
import pandas as pd

try:
    print("Analyzing data structure in detail...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read starting from row 3
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=3)
    
    # Get basic info
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    # Look at first few rows completely
    print("\n=== ROW 0 (First data row) ===")
    print(df.iloc[0].to_string())
    
    print("\n=== ROW 1 (Second data row) ===")
    print(df.iloc[1].to_string())
    
    # Look at column structure around dates
    print("\n=== COLUMNS AROUND FIRST DATE ===")
    for i in range(2, min(15, len(df.columns))):
        col_name = df.columns[i]
        val = df.iloc[0, i]
        print(f"Col {i} ({col_name}): {val}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
