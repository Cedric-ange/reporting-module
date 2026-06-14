import sys
import traceback
import pandas as pd

try:
    print("Reading main file in detail...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read the first sheet with proper headers
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    print(f"Shape: {df.shape}", file=sys.stderr)
    
    # Try to find where the actual data starts by looking for non-null values
    print("=== ANALYZING STRUCTURE ===")
    for i in range(min(10, len(df))):
        row_data = df.iloc[i]
        non_null_count = row_data.notna().sum()
        print(f"Row {i}: {non_null_count} non-null values")
        if non_null_count > 0:
            print(f"  First few values: {row_data.dropna().head().tolist()}")
    
    # Print column headers if they exist
    print("\n=== COLUMN ANALYSIS ===")
    for i in range(min(10, len(df))):
        first_val = df.iloc[i, 0]
        if pd.notna(first_val) and isinstance(first_val, str):
            print(f"Row {i}, Col 0: {first_val}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
