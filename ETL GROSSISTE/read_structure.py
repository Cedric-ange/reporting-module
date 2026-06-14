import sys
import traceback
import pandas as pd

try:
    print("Reading data structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read starting from row 3 (0-indexed, so row 3 is the 4th row)
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=3)
    print(f"Shape after using row 3 as header: {df.shape}", file=sys.stderr)
    print(f"Columns: {list(df.columns[:20])}", file=sys.stderr)
    
    # Print first 10 rows
    print("\n=== FIRST 10 ROWS ===")
    print(df.head(10).to_string())
    
    # Print data types
    print("\n=== DATA TYPES ===")
    print(df.dtypes)
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
