import pandas as pd

try:
    print("Testing Feuil1 correction step by step...")
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Test with one row
    row_idx = 8  # First data row
    ville = df.iloc[row_idx, 0]
    grossiste = df.iloc[row_idx, 1]
    start_col = 2  # First date block
    
    print(f"Processing: {ville} - {grossiste}")
    
    # Get client value
    client_col = start_col + 8
    client = df.iloc[row_idx, client_col]
    print(f"Client (col {client_col}): {client}")
    
    # Get affiche value
    affiche_col = start_col + 19
    affiche = df.iloc[row_idx, affiche_col]
    print(f"Affiche (col {affiche_col}): {affiche}")
    
    # Get visits
    visits_col = start_col + 7
    visits = df.iloc[row_idx, visits_col]
    print(f"Visits (col {visits_col}): {visits}")
    
    print("Step-by-step test passed!")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
