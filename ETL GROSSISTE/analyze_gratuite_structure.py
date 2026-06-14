import pandas as pd

try:
    print("Analyzing gratuité columns structure in detail...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    print("=== GRATUITÉ COLUMNS STRUCTURE ===", file=sys.stderr)
    
    # From row 7 (format headers), look for gratuit-related columns
    print("Row 7 headers showing gratuité positions:", file=sys.stderr)
    
    # First date block (start_col=2)
    print("\nFirst date block (24/01/2026):", file=sys.stderr)
    for col in range(18, 22):  # Columns around gratuité
        val = df.iloc[7, col]
        print(f"  Col {col}: {val}")
    
    # Check row 8 data for these columns
    print("\nRow 8 data (BONDOUKOU TAHIROU AMADOU):", file=sys.stderr)
    for col in range(18, 22):
        val = df.iloc[8, col]
        print(f"  Col {col}: {val}")
    
    # Check pattern across date blocks
    print("\n=== GRATUITÉ COLUMNS ACROSS DATE BLOCKS ===", file=sys.stderr)
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29}
    ]
    
    for date_block in date_blocks:
        start_col = date_block["start_col"]
        print(f"\nDate {date_block['date']} (start_col={start_col}):", file=sys.stderr)
        for col in range(start_col + 18, start_col + 22):
            if col < len(df.columns):
                header = df.iloc[7, col]
                value = df.iloc[8, col]
                print(f"  Col {col}: Header='{header}', Value={value}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
