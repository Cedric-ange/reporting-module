import pandas as pd
import sys

try:
    print("Creating visual verification guide...", file=sys.stderr)
    
    # Read source file
    source_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx'
    df_source = pd.read_excel(source_path, sheet_name='JEUDI 22 JANV', header=None)
    
    # Read transformed file
    transformed_path = 'C:/Users/angec/biblos_transformed_database.xlsx'
    df_transformed = pd.read_excel(transformed_path, sheet_name='Base_Données')
    
    # Create visual verification guide
    verification_guide_path = 'C:/Users/angec/guide_verification_visuelle.txt'
    
    with open(verification_guide_path, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("GUIDE DE VÉRIFICATION VISUELLE - TRANSFORMATION BIBLOS\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📋 INSTRUCTIONS POUR VÉRIFIER MANUELLEMENT\n\n")
        f.write("1. Ouvrez le fichier source: REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST 5.xlsx\n")
        f.write("2. Allez dans la feuille 'JEUDI 22 JANV'\n")
        f.write("3. Suivez les exemples ci-dessous pour vérifier la transformation\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("EXEMPLE 1: VÉRIFICATION AGENT DIBI SIMEON\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📍 DANS LE FICHIER SOURCE:\n")
        f.write("- Allez à la LIGNE 8 (c'est la ligne 8, pas la ligne 7)\n")
        f.write("- Regardez la COLONNE 1: Vous devriez voir 'DIBI SIMEON'\n\n")
        
        f.write("Valeurs à vérifier dans le fichier source:\n")
        f.write(f"  • Cellule A8 (L8C1): {df_source.iloc[7, 1]}\n")
        f.write(f"  • Cellule C8 (L8C2): {df_source.iloc[7, 2]} (Boutique)\n")
        f.write(f"  • Cellule D8 (L8C3): {df_source.iloc[7, 3]} (Superette)\n")
        f.write(f"  • Cellule E8 (L8C4): {df_source.iloc[7, 4]} (Kiosque)\n")
        f.write(f"  • Cellule F8 (L8C5): {df_source.iloc[7, 5]} (Tablier)\n")
        f.write(f"  • Cellule G8 (L8C6): {df_source.iloc[7, 6]} (Pushcart)\n")
        f.write(f"  • Cellule R8 (L8C17): {df_source.iloc[7, 17]} (Obj Lait 16g)\n")
        f.write(f"  • Cellule S8 (L8C18): {df_source.iloc[7, 18]} (Obj Lait 360g)\n")
        f.write(f"  • Cellule T8 (L8C19): {df_source.iloc[7, 19]} (Obj Lait 900g)\n")
        f.write(f"  • Cellule AP8 (L8C42): {df_source.iloc[7, 42]} (Réa Lait 16g)\n")
        f.write(f"  • Cellule AQ8 (L8C43): {df_source.iloc[7, 43]} (Réa Lait 360g)\n")
        f.write(f"  • Cellule AR8 (L8C44): {df_source.iloc[7, 44]} (Réa Lait 900g)\n")
        f.write(f"  • Cellule AV8 (L8C47): {df_source.iloc[7, 47]} (Affiches)\n")
        f.write(f"  • Cellicle BA8 (L8C52): {df_source.iloc[7, 52]} (Gratuits)\n\n")
        
        f.write("📊 DANS LE FICHIER TRANSFORMÉ:\n")
        f.write("- Ouvrez: biblos_transformed_database.xlsx\n")
        f.write("- Allez dans la feuille 'Base_Données'\n")
        f.write("- Cherchez les lignes avec 'DIBI SIMEON' dans la colonne Grossiste\n\n")
        
        f.write("Valeurs transformées à vérifier:\n")
        dibi_rows = df_transformed[df_transformed['Grossiste'] == 'DIBI SIMEON']
        for idx, row in dibi_rows.iterrows():
            f.write(f"\n  Ligne {idx + 2}:\n")
            f.write(f"  • Date: {row['Date'].strftime('%d/%m/%Y')}\n")
            f.write(f"  • Ville: {row['Ville']}\n")
            f.write(f"  • Grossiste: {row['Grossiste']}\n")
            f.write(f"  • Catégorie: {row['Categorie produit']}\n")
            f.write(f"  • Format: {row['Format']}\n")
            f.write(f"  • Objectif: {row['Objectif carton']}\n")
            f.write(f"  • Réalisation: {row['Réalisation carton']}\n")
            f.write(f"  • Taux: {row['Taux de réalisation']}%\n")
            f.write(f"  • Gratuité: {row['Gratuité']}\n")
            f.write(f"  • Affiche: {row['Affiche']}\n")
            f.write(f"  • Personnes approchées: {row['Personne approchée']}\n")
        
        f.write("\n✅ CALCULS À VÉRIFIER MANUELLEMENT:\n")
        f.write(f"  • Total visites: {df_source.iloc[7, 2]} + {df_source.iloc[7, 3]} + {df_source.iloc[7, 4]} + {df_source.iloc[7, 5]} + {df_source.iloc[7, 6]} = {df_source.iloc[7, 2] + df_source.iloc[7, 3] + df_source.iloc[7, 4] + df_source.iloc[7, 5] + df_source.iloc[7, 6]}\n")
        f.write(f"  • Taux Lait 16g: ({df_source.iloc[7, 42]} / {df_source.iloc[7, 17]}) × 100 = {(df_source.iloc[7, 42] / df_source.iloc[7, 17]) * 100 if df_source.iloc[7, 17] > 0 else 0}%\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("EXEMPLE 2: VÉRIFICATION AGENT KONATE MARIAM\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📍 DANS LE FICHIER SOURCE:\n")
        f.write("- Allez à la LIGNE 16\n")
        f.write("- Regardez la COLONNE 1: Vous devriez voir 'KONATE MARIAM'\n\n")
        
        f.write("Valeurs clés à vérifier:\n")
        f.write(f"  • Cellule A16 (L16C1): {df_source.iloc[15, 1]}\n")
        f.write(f"  • Cellule R16 (L16C17): {df_source.iloc[15, 17]} (Obj Lait 16g)\n")
        f.write(f"  • Cellule AP16 (L16C42): {df_source.iloc[15, 42]} (Réa Lait 16g)\n")
        f.write(f"  • Cellule AV16 (L16C47): {df_source.iloc[15, 47]} (Affiches)\n")
        f.write(f"  • Cellule BA16 (L16C52): {df_source.iloc[15, 52]} (Gratuits)\n\n")
        
        f.write("📊 DANS LE FICHIER TRANSFORMÉ:\n")
        f.write("- Cherchez 'KONATE MARIAM' dans la colonne Grossiste\n\n")
        
        mariam_rows = df_transformed[df_transformed['Grossiste'] == 'KONATE MARIAM']
        f.write("Valeurs transformées:\n")
        for idx, row in mariam_rows.iterrows():
            f.write(f"\n  {row['Categorie produit']} - {row['Format']}:\n")
            f.write(f"  • Objectif: {row['Objectif carton']}\n")
            f.write(f"  • Réalisation: {row['Réalisation carton']}\n")
            f.write(f"  • Taux: {row['Taux de réalisation']}%\n")
        
        f.write("\n✅ CALCULS À VÉRIFIER:\n")
        f.write(f"  • Taux Lait 16g: ({df_source.iloc[15, 42]} / {df_source.iloc[15, 17]}) × 100 = {(df_source.iloc[15, 42] / df_source.iloc[15, 17]) * 100 if df_source.iloc[15, 17] > 0 else 0}%\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("RÉCAPITULATIF DES VÉRIFICATIONS\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("Pour chaque agent, vérifiez:\n")
        f.write("1. ✓ Nom de l'agent identique dans source et transformé\n")
        f.write("2. ✓ Objectifs (colonnes 17-21 source → colonne Objectif carton)\n")
        f.write("3. ✓ Réalisations (colonnes 42-46 source → colonne Réalisation carton)\n")
        f.write("4. ✓ Taux de réalisation calculé correctement\n")
        f.write("5. ✓ Somme des visites (colonnes 2-6 source → Personne approchée)\n")
        f.write("6. ✓ Affiches (colonne 47 source → colonne Affiche)\n")
        f.write("7. ✓ Gratuits (colonne 52 source → colonne Gratuité)\n\n")
        
        f.write("📊 STATISTIQUES GLOBALES:\n")
        f.write(f"  • Total agents dans source: {len([agent for agent in df_source.iloc[7:27, 1] if pd.notna(agent) and agent != 'TOTAL '])}\n")
        f.write(f"  • Total agents transformés: {df_transformed['Grossiste'].nunique()}\n")
        f.write(f"  • Total lignes transformées: {len(df_transformed)}\n")
        f.write(f"  • Total visites source: {sum([df_source.iloc[i, 2] + df_source.iloc[i, 3] + df_source.iloc[i, 4] + df_source.iloc[i, 5] + df_source.iloc[i, 6] for i in range(7, 27) if pd.notna(df_source.iloc[i, 1]) and df_source.iloc[i, 1] != 'TOTAL '])}\n")
        f.write(f"  • Total visites transformé: {df_transformed['Personne approchée'].sum()}\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("🎯 CONCLUSION\n")
        f.write("=" * 80 + "\n\n")
        f.write("Si toutes les vérifications ci-dessus sont correctes,\n")
        f.write("alors la transformation est VALIDÉE et alignée avec la source.\n\n")
        f.write("Vous pouvez utiliser le fichier 'biblos_transformed_database.xlsx'\n")
        f.write("en toute confiance pour votre analyse Power BI.\n")
    
    print(f"Visual verification guide created: {verification_guide_path}", file=sys.stderr)
    
    print("\n=== VÉRIFICATION VISUELLE TERMINÉE ===")
    print("Fichiers créés:")
    print("1. biblos_transformed_database.xlsx (format Excel comme demandé)")
    print("2. guide_verification_visuelle.txt (instructions pas à pas)")
    print("3. PRESENTATION_TRANSFORMATION.md (présentation détaillée)")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
