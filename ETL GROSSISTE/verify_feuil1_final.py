import pandas as pd

# Read the corrected file
result_df = pd.read_excel('C:/Users/angec/feuil1_final_corrected.xlsx')

print("=== VERIFICATION OF CORRECTIONS ===")
print(f"Total rows: {len(result_df)}")
print(f"Columns: {list(result_df.columns)}")
print()
print("=== STATISTICS ===")
print(f"Non-zero personne touché: {(result_df['Personne touché (Client acheteur)'] > 0).sum()}")
print(f"Non-zero affiches: {(result_df['Affiche'] > 0).sum()}")
print(f"Non-zero personnes approchées: {(result_df['Personne approchée'] > 0).sum()}")
print(f"Zero values total: {(result_df == 0).sum().sum()}")
print()

print("=== SAMPLE DATA - BONDOUKOU TAHIROU AMADOU ===")
sample = result_df[(result_df['Ville'] == 'BONDOUKOU') & 
                    (result_df['Grossiste'] == 'TAHIROU AMADOU')].head(14)
print(sample[['Date', 'Format', 'Personne approchée', 'Personne touché (Client acheteur)', 'Affiche']].to_string())

print("\n=== CHECKING LOGIC FOR ONE DATE ===")
date_sample = result_df[(result_df['Ville'] == 'BONDOUKOU') & 
                        (result_df['Grossiste'] == 'TAHIROU AMADOU') & 
                        (result_df['Date'] == pd.to_datetime('2026-01-24'))]
print(f"Products for 2026-01-24:")
for idx, row in date_sample.iterrows():
    print(f"  {row['Format']}: Personne touché={row['Personne touché (Client acheteur)']}, Affiche={row['Affiche']}")
