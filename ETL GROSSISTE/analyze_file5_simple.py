import sys
import traceback
import pandas as pd

try:
    print("Analyzing file 5 simple approach...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    
    # Read without header
    df = pd.read_excel(file_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Print specific cells to understand structure
    print("Row 1, Col 1:", df.iloc[1, 1])
    print("Row 4, Col 2:", df.iloc[4, 2])
    print("Row 4, Col 22:", df.iloc[4, 22])
    
    # Look for patterns in row 5-10
    print("\n=== ROWS 5-10 SAMPLE CELLS ===")
    for i in range(5, min(10, len(df))):
        print(f"Row {i}:")
        for j in [0, 1, 2, 22, 55, 56]:
            val = df.iloc[i, j]
            print(f"  Col {j}: {val}")
    
    # Try to find product names
    print("\n=== SEARCHING FOR PRODUCT NAMES ===")
    for i in range(len(df)):
        for j in range(min(20, len(df.columns))):
            val = df.iloc[i, j]
            if pd.notna(val) and isinstance(val, str):
                val_upper = val.upper()
                if "LAIT" in val_upper or "FLOCON" in val_upper or "AVOINE" in val_upper:
                    print(f"Found at Row {i}, Col {j}: {val}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    traceback.print_exc()
