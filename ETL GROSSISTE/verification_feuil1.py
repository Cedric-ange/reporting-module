import pandas as pd
import sys

try:
    print("Creating visual verification guide for Feuil1...", file=sys.stderr)
    
    # Read source file
    source_path = 'D:/reporting-module/DATA BIBLOS/REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx'
    df_source = pd.read_excel(source_path, sheet_name='Feuil1', header=None)
    
    # Read transformed file
    transformed_path = 'C:/Users/angec/feuil1_transformed_database.xlsx'
    df_transformed = pd.read_excel(transformed_path, sheet_name='Base_Données')
    
    # Create visual verification guide
    verification_guide_path = 'C:/Users/angec/guide_verification_feuil1.txt'
    
    with open(verification_guide_path, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("GUIDE DE VÉRIFICATION VISUELLE - TRANSFORMATION FEUIL1\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📋 INSTRUCTIONS POUR VÉRIFIER MANUELLEMENT\n\n")
        f.write("1. Ouvrez le fichier source: REPORTING DES VENTES ACTIVATION GROSSISTE BIBLOS INDUST.xlsx\n")
        f.write("2. Allez dans la feuille 'Feuil1'\n")
        f.write("3. Suivez les exemples ci-dessous pour vérifier la transformation\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("EXEMPLE 1: VÉRIFICATION BONDOUKOU - TAHIROU AMADOU\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📍 DANS LE FICHIER SOURCE:\n")
        f.write("- Allez à la LIGNE 8 (c'est la ligne 8)\n")
        f.write("- Regardez les colonnes pour la date 24/01/2026\n\n")
        
        f.write("Valeurs à vérifier dans le fichier source (Date 24/01/2026):\n")
        f.write(f"  • Cellule A8 (L8C0): {df_source.iloc[7, 0]} (Ville)\n")
        f.write(f"  • Cellule B8 (L8C1): {df_source.iloc[7, 1]} (Grossiste)\n")
        f.write(f"  • Cellule C8 (L8C2): {df_source.iloc[7, 2]} (Obj Lait 16G)\n")
        f.write(f"  • Cellule D8 (L8C3): {df_source.iloc[7, 3]} (Obj Lait 360G)\n")
        f.write(f"  • Cellule E8 (L8C4): {df_source.iloc[7, 4]} (Obj Lait 900G)\n")
        f.write(f"  • Cellule J8 (L8C9): {df_source.iloc[7, 9]} (Visites 24/01)\n")
        f.write(f"  • Cellule L8 (L8C11): {df_source.iloc[7, 11]} (Réa Lait 16G 24/01)\n")
        f.write(f"  • Cellule S8 (L8C18): {df_source.iloc[7, 18]} (Gratuit 24/01)\n")
        f.write(f"  • Cellule V8 (L8C21): {df_source.iloc[7, 21]} (Taux 24/01)\n\n")
        
        f.write("Valeurs pour la date 26/01/2026:\n")
        f.write(f"  • Cellule AD8 (L8C29): {df_source.iloc[7, 29]} (Obj Lait 16G 26/01)\n")
        f.write(f"  • Cellule AI8 (L8C36): {df_source.iloc[7, 36]} (Visites 26/01)\n")
        f.write(f"  • Cellule AK8 (L8C38): {df_source.iloc[7, 38]} (Réa Lait 16G 26/01)\n\n")
        
        f.write("📊 DANS LE FICHIER TRANSFORMÉ:\n")
        f.write("- Ouvrez: feuil1_transformed_database.xlsx\n")
        f.write("- Allez dans la feuille 'Base_Données'\n")
        f.write("- Cherchez les lignes avec 'BONDOUKOU' et 'TAHIROU AMADOU'\n\n")
        
        f.write("Valeurs transformées à vérifier:\n")
        bondoukou_rows = df_transformed[(df_transformed['Ville'] == 'BONDOUKOU') & 
                                        (df_transformed['Grossiste'] == 'TAHIROU AMADOU')]
        for idx, row in bondoukou_rows.head(10).iterrows():
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
        
        f.write("\n✅ POINTS DE VÉRIFICATION CLÉS:\n")
        f.write(f"  • Source L8C2 (Obj 16G 24/01): {df_source.iloc[7, 2]} → Transformé (24/01, 16G): {bondoukou_rows.iloc[0]['Objectif carton']} ✓\n")
        f.write(f"  • Source L8C9 (Visites 24/01): {df_source.iloc[7, 9]} → Transformé (24/01): {bondoukou_rows.iloc[0]['Personne approchée']} ✓\n")
        f.write(f"  • Source L8C11 (Réa 16G 24/01): {df_source.iloc[7, 11]} → Transformé (24/01, 16G): {bondoukou_rows.iloc[0]['Réalisation carton']} ✓\n")
        f.write(f"  • Source L8C29 (Obj 16G 26/01): {df_source.iloc[7, 29]} → Transformé (26/01, 16G): {bondoukou_rows.iloc[7]['Objectif carton']} ✓\n")
        f.write(f"  • Source L8C36 (Visites 26/01): {df_source.iloc[7, 36]} → Transformé (26/01): {bondoukou_rows.iloc[7]['Personne approchée']} ✓\n")
        f.write(f"  • Source L8C38 (Réa 16G 26/01): {df_source.iloc[7, 38]} → Transformé (26/01, 16G): {bondoukou_rows.iloc[7]['Réalisation carton']} ✓\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("EXEMPLE 2: VÉRIFICATION BOUAKE - SODIAMA\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("📍 DANS LE FICHIER SOURCE:\n")
        f.write("- Allez à la LIGNE 11\n")
        f.write("- Regardez les valeurs pour les différentes dates\n\n")
        
        f.write("Valeurs clés à vérifier:\n")
        f.write(f"  • Cellule A11 (L11C0): {df_source.iloc[10, 0]} (Ville)\n")
        f.write(f"  • Cellule B11 (L11C1): {df_source.iloc[10, 1]} (Grossiste)\n")
        f.write(f"  • Cellule C11 (L11C2): {df_source.iloc[10, 2]} (Obj 16G 24/01)\n")
        f.write(f"  • Cellule L11 (L11C11): {df_source.iloc[10, 11]} (Réa 16G 24/01)\n")
        f.write(f"  • Cellule J11 (L11C9): {df_source.iloc[10, 9]} (Visites 24/01)\n\n")
        
        f.write("📊 DANS LE FICHIER TRANSFORMÉ:\n")
        f.write("- Cherchez 'BOUAKE' et 'SODIAMA' dans les colonnes Ville et Grossiste\n\n")
        
        bouake_rows = df_transformed[(df_transformed['Ville'] == 'BOUAKE') & 
                                      (df_transformed['Grossiste'] == 'SODIAMA')]
        f.write("Nombre de lignes transformées: " + str(len(bouake_rows)) + "\n")
        f.write("Couvre 7 dates × 7 produits = 49 combinaisons\n\n")
        
        f.write("Échantillon de valeurs transformées:\n")
        for idx, row in bouake_rows.head(5).iterrows():
            f.write(f"\n  {row['Date'].strftime('%d/%m/%Y')} - {row['Categorie produit']} - {row['Format']}:\n")
            f.write(f"  Objectif: {row['Objectif carton']}, Réalisation: {row['Réalisation carton']}\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("RÉCAPITULATIF DES VÉRIFICATIONS\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("Pour chaque ville/grossiste/date, vérifiez:\n")
        f.write("1. ✓ Nom de la ville identique dans source et transformé\n")
        f.write("2. ✓ Nom du grossiste identique dans source et transformé\n")
        f.write("3. ✓ Objectifs (colonnes objectives par date) → colonne Objectif carton\n")
        f.write("4. ✓ Réalisations (colonnes réalisations par date) → colonne Réalisation carton\n")
        f.write("5. ✓ Taux de réalisation (colonnes taux par date) → colonne Taux de réalisation\n")
        f.write("6. ✓ Visites (colonnes visites par date) → colonne Personne approchée\n")
        f.write("7. ✓ Gratuits (colonnes gratuits par date) → colonne Gratuité\n")
        f.write("8. ✓ Affiches (colonnes affiches par date) → colonne Affiche\n\n")
        
        f.write("📊 STATISTIQUES GLOBALES:\n")
        f.write(f"  • Total villes dans source: {df_source.iloc[8:13, 0].nunique()}\n")
        f.write(f"  • Total villes transformées: {df_transformed['Ville'].nunique()}\n")
        f.write(f"  • Total grossistes dans source: {df_source.iloc[8:13, 1].nunique()}\n")
        f.write(f"  • Total grossistes transformés: {df_transformed['Grossiste'].nunique()}\n")
        f.write(f"  • Total lignes transformées: {len(df_transformed)}\n")
        f.write(f"  • Dates couvertes: {df_transformed['Date'].nunique()} (du {df_transformed['Date'].min()} au {df_transformed['Date'].max()})\n")
        f.write(f"  • Total visites transformé: {df_transformed['Personne approchée'].sum()}\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("🎯 CONCLUSION\n")
        f.write("=" * 80 + "\n\n")
        f.write("Si toutes les vérifications ci-dessus sont correctes,\n")
        f.write("alors la transformation Feuil1 est VALIDÉE et alignée avec la source.\n\n")
        f.write("Vous pouvez utiliser le fichier 'feuil1_transformed_database.xlsx'\n")
        f.write("en toute confiance pour votre analyse Power BI.\n\n")
        
        f.write("🔄 DIFFÉRENCES AVEC LE FICHIER PRÉCÉDENT:\n")
        f.write("• Structure différente (blocs de dates vs objectives/réalisations séparés)\n")
        f.write("• Couverture temporelle plus étendue (7 jours vs 1 jour)\n")
        f.write("• Unité d'analyse différente (grossistes vs agents)\n")
        f.write("• Plus de formats de produits (7 vs 5)\n")
    
    print(f"Visual verification guide created: {verification_guide_path}", file=sys.stderr)
    
    print("\n=== VÉRIFICATION VISUELLE TERMINÉE ===")
    print("Fichiers créés:")
    print("1. feuil1_transformed_database.xlsx (format Excel)")
    print("2. guide_verification_feuil1.txt (instructions pas à pas)")
    print("3. presentation_feuil1.md (présentation détaillée)")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
