import pandas as pd

try:
    result_df = pd.read_excel('C:/Users/angec/feuil1_final_definitive.xlsx')
    
    with open('C:/Users/angec/feuil1_definitive_report.txt', 'w', encoding='utf-8') as f:
        f.write("=== FEUIL1 DEFINITIVE CORRECTION REPORT ===\n\n")
        f.write(f"Total rows: {len(result_df)}\n")
        f.write(f"Non-zero gratuité: {(result_df['Gratuité'] > 0).sum()}\n")
        f.write(f"Total gratuité sum: {result_df['Gratuité'].sum()}\n")
        f.write(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}\n")
        f.write(f"Non-zero personne touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}\n")
        f.write(f"Non-zero personne approchée: {(result_df['Personne approchée'] > 0).sum()}\n\n")
        
        f.write("=== SAMPLE DATA - BONDOUKOU TAHIROU AMADOU ===\n")
        sample = result_df[(result_df['Ville'] == 'BONDOUKOU') & 
                           (result_df['Grossiste'] == 'TAHIROU AMADOU')].head(14)
        f.write(sample[['Date', 'Format', 'Gratuité', 'Affiche', 'Personne approchée', 'Personne touché (Client acheteur)']].to_string())
        
        f.write("\n\n=== GRATUITÉ DISTRIBUTION ===\n")
        f.write("Products with non-zero gratuité:\n")
        non_zero_grat = result_df[result_df['Gratuité'] > 0]
        for idx, row in non_zero_grat.head(20).iterrows():
            f.write(f"  {row['Date']} - {row['Format']}: {row['Gratuité']}\n")
    
    print("Report created: feuil1_definitive_report.txt")
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero gratuité: {(result_df['Gratuité'] > 0).sum()}")
    print(f"Total gratuité sum: {result_df['Gratuité'].sum()}")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
