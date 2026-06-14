import sys
import traceback
import pandas as pd

try:
    print("Reading another file for comparison...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Get sheet names first
    xls = pd.ExcelFile(file_path)
    print(f"Sheet names: {xls.sheet_names}", file=sys.stderr)
    
    # Read each sheet
    for sheet_name in xls.sheet_names:
        print(f"\n=== SHEET: {sheet_name} ===")
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        print(f"Shape: {df.shape}")
        print("First 50 rows:")
        print(df.head(50).to_string())
        
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
