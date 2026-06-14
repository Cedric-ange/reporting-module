import pandas as pd
import sys

try:
    print("Analyzing Feuil1 structure for 'personne touché' data...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Analyze row 4 headers to understand the structure
    print("=== ROW 4 HEADERS ANALYSIS ===", file=sys.stderr)
    for col_idx in range(len(df.columns)):
        val = df.iloc[4, col_idx]
        if pd.notna(val):
            print(f"Col {col_idx}: {val}")
    
    # Look for "personne touché" or similar in the headers
    print("\n=== SEARCHING FOR PERSONNE TOUCHÉ ===", file=sys.stderr)
    for row_idx in range(len(df)):
        for col_idx in range(len(df.columns)):
            val = df.iloc[row_idx, col_idx]
            if pd.notna(val) and isinstance(val, str):
                val_lower = val.lower()
                if 'personne' in val_lower or 'touché' in val_lower or 'touche' in val_lower:
                    print(f"Found at Row {row_idx}, Col {col_idx}: {val}")
    
    # Also look for client-related columns
    print("\n=== SEARCHING FOR CLIENT DATA ===", file=sys.stderr)
    for col_idx in [10, 37, 64, 91, 118, 145, 172, 199]:  # Possible client columns
        if col_idx < len(df.columns):
            val = df.iloc[4, col_idx]
            print(f"Col {col_idx}: {val}")
            
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
