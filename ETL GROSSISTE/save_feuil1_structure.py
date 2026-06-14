import pandas as pd
import sys

try:
    print("Saving Feuil1 complete structure...", file=sys.stderr)
    
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    
    # Read Feuil1 without header
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Save to CSV for analysis
    output_path = 'C:/Users/angec/feuil1_structure.csv'
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Data saved to {output_path}", file=sys.stderr)
    
    # Save detailed structure analysis
    with open('C:/Users/angec/feuil1_detailed_structure.txt', 'w', encoding='utf-8') as f:
        f.write(f"Shape: {df.shape}\n\n")
        f.write("=== ROW BY ROW ANALYSIS ===\n\n")
        for i in range(len(df)):
            f.write(f"Row {i}:\n")
            non_null_count = 0
            for j in range(len(df.columns)):
                val = df.iloc[i, j]
                if pd.notna(val):
                    f.write(f"  Col {j}: {val}\n")
                    non_null_count += 1
            if non_null_count == 0:
                f.write("  [EMPTY]\n")
            f.write("\n")
    
    print("Detailed structure saved to feuil1_detailed_structure.txt", file=sys.stderr)
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
