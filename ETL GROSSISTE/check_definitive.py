import pandas as pd

try:
    result_df = pd.read_excel('C:/Users/angec/feuil1_final_definitive.xlsx')
    
    print(f"Total rows: {len(result_df)}")
    print(f"Non-zero gratuité: {(result_df['Gratuité'] > 0).sum()}")
    print(f"Total gratuité sum: {result_df['Gratuité'].sum()}")
    print(f"Sample gratuité values: {result_df['Gratuité'].head(14).tolist()}")
    
    print("\n=== SAMPLE DATA ===")
    sample = result_df[(result_df['Ville'] == 'BONDOUKOU') & 
                       (result_df['Grossiste'] == 'TAHIROU AMADOU')].head(14)
    print(sample[['Date', 'Format', 'Gratuité', 'Affiche', 'Personne approchée']].to_string())
    
except Exception as e:
    print(f"ERROR: {e}")
