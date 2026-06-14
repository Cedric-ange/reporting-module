import pandas as pd

try:
    print("Verifying data integrity...")
    
    # Read source file
    file_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df_source = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # Read transformed file
    df_transformed = pd.read_excel('C:/Users/angec/feuil1_ultime_corrected.xlsx')
    
    print(f"Source shape: {df_source.shape}")
    print(f"Transformed shape: {df_transformed.shape}")
    
    # Calculate totals from source rows 8-12 (excluding row 13 TOTAL)
    source_rows = range(8, 13)
    
    date_blocks = [
        {"date": "2026-01-24", "start_col": 2},
        {"date": "2026-01-26", "start_col": 29},
        {"date": "2026-01-27", "start_col": 56},
        {"date": "2026-01-28", "start_col": 83},
        {"date": "2026-01-29", "start_col": 110},
        {"date": "2026-01-30", "start_col": 137},
        {"date": "2026-01-31", "start_col": 164}
    ]
    
    source_totals = {"objective": 0, "realization": 0, "visits": 0, "client": 0, "affiche": 0}
    
    for row_idx in source_rows:
        for date_block in date_blocks:
            start_col = date_block["start_col"]
            
            visits = df_source.iloc[row_idx, start_col + 7]
            if pd.notna(visits):
                source_totals["visits"] += float(visits)
            
            client = df_source.iloc[row_idx, start_col + 8]
            if pd.notna(client):
                source_totals["client"] += float(client)
            
            affiche = df_source.iloc[row_idx, start_col + 19]
            if pd.notna(affiche):
                source_totals["affiche"] += float(affiche)
            
            for i in range(7):
                obj = df_source.iloc[row_idx, start_col + i]
                if pd.notna(obj):
                    source_totals["objective"] += float(obj)
            
            for i in range(7):
                real = df_source.iloc[row_idx, start_col + 9 + i]
                if pd.notna(real):
                    source_totals["realization"] += float(real)
    
    # Calculate totals from transformed file
    transformed_totals = {
        "objective": df_transformed['Objectif carton'].sum(),
        "realization": df_transformed['Réalisation carton'].sum(),
        "visits": df_transformed['Personne approchée'].sum(),
        "client": df_transformed['Personne touché (Client acheteur)'].sum(),
        "affiche": df_transformed['Affiche'].sum()
    }
    
    print("\nSource totals (rows 8-12 only):")
    print(f"  Objective: {source_totals['objective']}")
    print(f"  Realization: {source_totals['realization']}")
    print(f"  Visits: {source_totals['visits']}")
    print(f"  Client: {source_totals['client']}")
    print(f"  Affiche: {source_totals['affiche']}")
    
    print("\nTransformed totals:")
    print(f"  Objective: {transformed_totals['objective']}")
    print(f"  Realization: {transformed_totals['realization']}")
    print(f"  Visits: {transformed_totals['visits']}")
    print(f"  Client: {transformed_totals['client']}")
    print(f"  Affiche: {transformed_totals['affiche']}")
    
    # Compare
    tolerance = 0.01
    match_obj = abs(source_totals['objective'] - transformed_totals['objective']) < tolerance
    match_real = abs(source_totals['realization'] - transformed_totals['realization']) < tolerance
    match_visits = abs(source_totals['visits'] - transformed_totals['visits']) < tolerance
    match_client = abs(source_totals['client'] - transformed_totals['client']) < tolerance
    match_affiche = abs(source_totals['affiche'] - transformed_totals['affiche']) < tolerance
    
    print("\nComparison:")
    print(f"Objective: {'MATCH' if match_obj else 'MISMATCH'} (diff: {abs(source_totals['objective'] - transformed_totals['objective'])})")
    print(f"Realization: {'MATCH' if match_real else 'MISMATCH'} (diff: {abs(source_totals['realization'] - transformed_totals['realization'])})")
    print(f"Visits: {'MATCH' if match_visits else 'MISMATCH'} (diff: {abs(source_totals['visits'] - transformed_totals['visits'])})")
    print(f"Client: {'MATCH' if match_client else 'MISMATCH'} (diff: {abs(source_totals['client'] - transformed_totals['client'])})")
    print(f"Affiche: {'MATCH' if match_affiche else 'MISMATCH'} (diff: {abs(source_totals['affiche'] - transformed_totals['affiche'])})")
    
    # Save detailed report
    with open('C:/Users/angec/data_integrity_verification.txt', 'w', encoding='utf-8') as f:
        f.write("=== DATA INTEGRITY VERIFICATION ===\n\n")
        f.write("Verification that transformation does NOT use TOTAL row\n\n")
        
        f.write("Source: REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx (Feuil1)\n")
        f.write("Transformed: feuil1_ultime_corrected.xlsx\n\n")
        
        f.write("=== SOURCE DATA ROWS USED ===\n")
        f.write("Rows 8-12 only (excluding row 13 TOTAL)\n")
        f.write(f"Row 13 value: {df_source.iloc[13, 0] if pd.notna(df_source.iloc[13, 0]) else 'N/A'}\n\n")
        
        f.write("=== TOTALS CALCULATED FROM SOURCE (rows 8-12) ===\n")
        f.write(f"Objective: {source_totals['objective']}\n")
        f.write(f"Realization: {source_totals['realization']}\n")
        f.write(f"Visits: {source_totals['visits']}\n")
        f.write(f"Client (Personne touché): {source_totals['client']}\n")
        f.write(f"Affiche: {source_totals['affiche']}\n\n")
        
        f.write("=== TOTALS FROM TRANSFORMED FILE ===\n")
        f.write(f"Objective: {transformed_totals['objective']}\n")
        f.write(f"Realization: {transformed_totals['realization']}\n")
        f.write(f"Visits: {transformed_totals['visits']}\n")
        f.write(f"Client (Personne touché): {transformed_totals['client']}\n")
        f.write(f"Affiche: {transformed_totals['affiche']}\n\n")
        
        f.write("=== COMPARISON RESULTS ===\n")
        f.write(f"Objective: {'PASS' if match_obj else 'FAIL'} (diff: {abs(source_totals['objective'] - transformed_totals['objective'])})\n")
        f.write(f"Realization: {'PASS' if match_real else 'FAIL'} (diff: {abs(source_totals['realization'] - transformed_totals['realization'])})\n")
        f.write(f"Visits: {'PASS' if match_visits else 'FAIL'} (diff: {abs(source_totals['visits'] - transformed_totals['visits'])})\n")
        f.write(f"Client: {'PASS' if match_client else 'FAIL'} (diff: {abs(source_totals['client'] - transformed_totals['client'])})\n")
        f.write(f"Affiche: {'PASS' if match_affiche else 'FAIL'} (diff: {abs(source_totals['affiche'] - transformed_totals['affiche'])})\n\n")
        
        f.write("=== CONCLUSION ===\n")
        if match_obj and match_real and match_visits and match_client and match_affiche:
            f.write("PASS - All totals match - Data integrity verified\n")
            f.write("PASS - Transformation correctly uses only rows 8-12 (excludes TOTAL row)\n")
            f.write("PASS - Data is accurate and complete\n")
        else:
            f.write("FAIL - Totals do not match - Review required\n")
        
        f.write("\n=== INDIVIDUAL AGENT VERIFICATION ===\n")
        for row_idx in source_rows:
            ville = df_source.iloc[row_idx, 0]
            grossiste = df_source.iloc[row_idx, 1]
            f.write(f"\nRow {row_idx}: {ville} - {grossiste}\n")
            
            agent_rows = df_transformed[(df_transformed['Ville'] == ville) & 
                                        (df_transformed['Grossiste'] == grossiste)]
            f.write(f"  Transformed rows count: {len(agent_rows)}\n")
            f.write(f"  Expected: 35 (7 products x 5 dates)\n")
            f.write(f"  Status: {'OK' if len(agent_rows) == 35 else 'ERROR'}")
    
    print("\nVerification report saved: data_integrity_verification.txt")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
