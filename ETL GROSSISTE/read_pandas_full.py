import sys
import traceback
import pandas as pd

try:
    print("Starting detailed pandas read...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    
    # Read the sheet with all data
    df = pd.read_excel(file_path, sheet_name='JEUDI 22 JANV', header=None)
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    # Print all rows
    print("=== ALL DATA ===")
    print(df.to_string())
        
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
