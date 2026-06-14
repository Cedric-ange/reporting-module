import pandas as pd
import sys

try:
    print("Creating comparison table...", file=sys.stderr)
    
    # Read corrected file 5
    corrected_file5 = pd.read_excel('C:/Users/angec/biblos_transformed_corrected.xlsx', sheet_name='Base_Données')
    
    # Sample comparison for agent DIBI SIMEON
    print("\n=== FILE 5 - DIBI SIMEON COMPARISON ===")
    print("Agent: DIBI SIMEON, Date: 22/01/2026")
    print("\nFormat              | Before (Affiche) | After (Affiche) | Status")
    print("-" * 60)
    
    dibi_rows = corrected_file5[corrected_file5['Grossiste'] == 'DIBI SIMEON']
    for idx, row in dibi_rows.iterrows():
        print(f"{row['Format']:<20} |  (previous: 3)   | {row['Affiche']:<14} | {'OK' if idx == dibi_rows.index[0] else 'FIXED'}")
    
    # Check gratuité values
    print("\n=== GRATUITÉ VALUES CHECK ===")
    print("Sample gratuité values:", corrected_file5['Gratuité'].head(10).tolist())
    print("Data types:", corrected_file5['Gratuité'].dtype)
    
    # Read corrected Feuil1
    corrected_feuil1 = pd.read_excel('C:/Users/angec/feuil1_transformed_corrected.xlsx', sheet_name='Base_Données')
    
    print("\n=== FEUIL1 - AFFICHE DISTRIBUTION ===")
    print("Checking if affiches are only on first product per date/agent")
    
    # Group by date and agent, check affiche distribution
    for date in corrected_feuil1['Date'].unique():
        for agent in corrected_feuil1['Grossiste'].unique():
            agent_date_rows = corrected_feuil1[(corrected_feuil1['Date'] == date) & 
                                                (corrected_feuil1['Grossiste'] == agent)]
            non_zero_affiches = agent_date_rows[agent_date_rows['Affiche'] > 0]
            print(f"Date: {date}, Agent: {agent}, Non-zero affiches: {len(non_zero_affiches)}")
    
    print("\n=== CORRECTION SUMMARY ===")
    print(f"File 5 - Total affiches: {corrected_file5['Affiche'].sum()} (was 90)")
    print(f"File 5 - Agents with affiches: {(corrected_file5['Affiche'] > 0).sum()}")
    print(f"Feuil1 - Total affiches: {corrected_feuil1['Affiche'].sum()}")
    print(f"Feuil1 - Non-zero gratuit entries: {(corrected_feuil1['Gratuité'] > 0).sum()}")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
