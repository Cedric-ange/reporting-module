import pandas as pd
import sys

try:
    print("Analyzing gratuité and affiche data in detail...", file=sys.stderr)
    
    # Analyze Feuil1 file first
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    print("\n=== FEUIL1 GRATUITÉ ANALYSIS ===", file=sys.stderr)
    
    # Look for gratuité columns with comma values
    # From structure: gratuit columns are at start_col + 16 + offset
    # For first date block (start_col=2): gratuit at 2+16+0 = 18 for first product, etc.
    
    print("Analyzing row 8 (BONDOUKOU TAHIROU AMADOU):", file=sys.stderr)
    print(f"Col 18 (Gratuit 16G 24/01): {df.iloc[7, 18]}")
    print(f"Col 19 (Gratuit 360G 24/01): {df.iloc[7, 19]}")
    print(f"Col 20 (Gratuit 900G 24/01): {df.iloc[7, 20]}")
    print(f"Col 21 (Gratuit 25KG Excell 24/01): {df.iloc[7, 21]}")
    print(f"Col 35 (Gratuit first date block later): {df.iloc[7, 35]}")
    
    # Check for comma values
    print("\nSearching for comma values in gratuit columns...", file=sys.stderr)
    for row_idx in range(8, 13):
        for col_idx in range(18, 25):  # First date block gratuit columns
            val = df.iloc[row_idx, col_idx]
            if pd.notna(val):
                if isinstance(val, str) and ',' in str(val):
                    print(f"Comma value found at Row {row_idx+1}, Col {col_idx}: {val}")
    
    print("\n=== FEUIL1 AFFICHE ANALYSIS ===", file=sys.stderr)
    
    # Affiche columns from structure: start_col + 19 + offset
    # For first date: 2+19+0 = 21, 2+19+1 = 22, etc.
    
    print("Analyzing affiche columns in first date block:", file=sys.stderr)
    print(f"Col 21 (Affiche?): {df.iloc[7, 21]}")
    print(f"Col 48 (Affiche?): {df.iloc[7, 48]}")
    print(f"Col 75 (Affiche?): {df.iloc[7, 75]}")
    
    # Check row 7 headers for affiche positions
    print("\nRow 7 (format headers) - looking for 'Affiche':", file=sys.stderr)
    for col_idx in range(len(df.columns)):
        val = df.iloc[7, col_idx]
        if pd.notna(val) and isinstance(val, str) and 'Affiche' in str(val):
            print(f"Col {col_idx}: {val}")
    
    # Check data rows for affiche values
    print("\nLooking for affiche values in data rows:", file=sys.stderr)
    for row_idx in range(8, 13):
        for col_idx in [21, 48, 75]:  # Potential affiche columns
            val = df.iloc[row_idx, col_idx]
            if pd.notna(val) and val > 0:
                print(f"Row {row_idx+1}, Col {col_idx}: {val}")
    
    # Now analyze File 5
    print("\n=== FILE 5 ANALYSIS ===", file=sys.stderr)
    file5_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    df5 = pd.read_excel(file5_path, sheet_name='JEUDI 22 JANV', header=None)
    
    print("Analyzing gratuité column (Col 52) in File 5:", file=sys.stderr)
    for row_idx in range(7, 12):
        val = df5.iloc[row_idx, 52]
        if pd.notna(val):
            print(f"Row {row_idx+1}, Col 52: {val} (type: {type(val).__name__})")
    
    print("Analyzing affiche column (Col 47) in File 5:", file=sys.stderr)
    for row_idx in range(7, 12):
        val = df5.iloc[row_idx, 47]
        if pd.notna(val):
            print(f"Row {row_idx+1}, Col 47: {val} (type: {type(val).__name__})")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
