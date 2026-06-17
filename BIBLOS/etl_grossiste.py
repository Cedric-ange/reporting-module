import pandas as pd
import os
import glob

# --- CONFIGURATION DES CHEMINS ---
DOSSIER_SOURCE = "C:\BIBLOS\GROSSISTE" # Ajustez selon votre chemin
DOSSIER_OUTPUT = "C:\BIBLOS\OUTPUT"

os.makedirs(DOSSIER_OUTPUT, exist_ok=True)

def transformer_format_feuil1(file_path):
    print(f"   -> Format détecté : Horizontal (Feuil1)")
    df = pd.read_excel(file_path, sheet_name='Feuil1', header=None)
    
    # On garde vos colonnes de départ exactes
    positions_dates = [2, 29, 56, 83, 110, 137, 164]
    
    products = [
        {"name": "16G", "category": "Lait", "offset": 0, "gratuit_offset": 16},
        {"name": "360G", "category": "Lait", "offset": 1, "gratuit_offset": None},
        {"name": "900G", "category": "Lait", "offset": 2, "gratuit_offset": 17},
        {"name": "25KG Excell", "category": "Lait", "offset": 3, "gratuit_offset": None},
        {"name": "25KG Super", "category": "Lait", "offset": 4, "gratuit_offset": None},
        {"name": "50G", "category": "Flocon d'avoine", "offset": 5, "gratuit_offset": 18},
        {"name": "400G", "category": "Flocon d'avoine", "offset": 6, "gratuit_offset": None}
    ]
    
    result_data = []
    
    # On rend la boucle dynamique (de la ligne 8 jusqu'à la fin ou jusqu'à "TOTAL")
    for row_idx in range(8, len(df)):
        ville = df.iloc[row_idx, 0]
        grossiste = df.iloc[row_idx, 1]
        
        if pd.isna(ville) or str(ville).strip().upper() == "TOTAL":
            continue
            
        for start_col in positions_dates:
            if start_col >= len(df.columns): 
                continue
                
            # Lecture dynamique de la date depuis la ligne 3 (index 3)
            date_brute = df.iloc[3, start_col]
            if pd.isna(date_brute): 
                continue
            
            # Formater la date proprement
            date_obj = pd.to_datetime(str(date_brute).split()[0], errors='coerce')
            
            visits = df.iloc[row_idx, start_col + 7]
            client = df.iloc[row_idx, start_col + 8]
            affiche = df.iloc[row_idx, start_col + 19]
            
            visits_val = float(visits) if pd.notna(visits) else 0
            client_val = float(client) if pd.notna(client) else 0
            affiche_val = float(affiche) if pd.notna(affiche) else 0
            
            for i, product in enumerate(products):
                obj = df.iloc[row_idx, start_col + product["offset"]]
                real = df.iloc[row_idx, start_col + 9 + product["offset"]]
                
                obj_val = float(str(obj).replace(',', '.')) if pd.notna(obj) else 0
                real_val = float(str(real).replace(',', '.')) if pd.notna(real) else 0
                
                # Logique exacte de gratuité de votre script
                freebies = 0
                if product["gratuit_offset"] is not None:
                    free_col = start_col + product["gratuit_offset"]
                    if free_col < len(df.columns):
                        val_free = df.iloc[row_idx, free_col]
                        if pd.notna(val_free):
                            if isinstance(val_free, str):
                                if ',' in str(val_free):
                                    freebies = float(str(val_free).split(',')[0])
                                else:
                                    freebies = float(val_free)
                            else:
                                freebies = float(val_free)
                
                # Règle de non-duplication
                client_touche = client_val if i == 0 else 0
                affiche_final = affiche_val if i == 0 else 0
                visite_final = visits_val if i == 0 else 0
                
                rate = (real_val / obj_val * 100) if obj_val > 0 else 0
                
                row = {
                    "Date": date_obj,
                    "Ville": ville,
                    "Grossiste": grossiste,
                    "Categorie produit": product["category"],
                    "Format": product["name"],
                    "Objectif carton": obj_val,
                    "Réalisation carton": real_val,
                    "Taux de réalisation": round(rate, 2),
                    "Gratuité": freebies,
                    "Affiche": affiche_final,
                    "Personne approchée": int(visite_final),
                    "Personne touché (Client acheteur)": int(client_touche),
                    "Fichier_Source": os.path.basename(file_path) # Toujours utile pour tracer les erreurs
                }
                result_data.append(row)
                
    result_df = pd.DataFrame(result_data)
    result_df = result_df.fillna(0)
    return result_df


def transformer_format_journalier(file_path):
    print(f"   -> Format détecté : Feuilles Journalières")
    xls = pd.ExcelFile(file_path)
    result_data = []
    
    for feuille in xls.sheet_names:
        if "SYNTHÈSE" in feuille.upper() or "FEUIL" in feuille.upper():
            continue
            
        print(f"      - Traitement de la feuille : {feuille}")
        df = pd.read_excel(xls, sheet_name=feuille, header=None)
        
        entete = str(df.iloc[1, 1]) if len(df) > 1 and len(df.columns) > 1 else ""
        ville = entete.split('/')[0].strip() if '/' in entete else "VILLE_INCONNUE"
        
        # Pour les feuilles journalières (type Activations), structure adaptée
        for row_idx in range(7, min(27, len(df))):
            grossiste = df.iloc[row_idx, 1]
            if pd.isna(grossiste) or "TOTAL" in str(grossiste).upper():
                continue
                
            # À COMPLÉTER SELON LA STRUCTURE EXACTE DE VOS FEUILLES JOURNALIÈRES
            # Ceci est un squelette reprenant vos noms de colonnes stricts
            result_data.append({
                "Date": feuille, 
                "Ville": ville,
                "Grossiste": grossiste,
                "Categorie produit": "Mixte",
                "Format": "Structure Journalière",
                "Objectif carton": 0,
                "Réalisation carton": 0,
                "Taux de réalisation": 0,
                "Gratuité": 0,
                "Affiche": 0,
                "Personne approchée": 0,
                "Personne touché (Client acheteur)": 0,
                "Fichier_Source": os.path.basename(file_path)
            })
            
    return pd.DataFrame(result_data).fillna(0)


def main():
    print("🚀 Démarrage de l'ETL Grossiste (BIBLOS)...")
    fichiers = glob.glob(f"{DOSSIER_SOURCE}/*.xlsx")
    toutes_donnees = []
    
    if not fichiers:
        print(f"⚠️ Aucun fichier trouvé dans {DOSSIER_SOURCE}")
        return

    for fichier in fichiers:
        nom_fichier = os.path.basename(fichier)
        if nom_fichier.startswith("~"): continue
            
        print(f"\n🔄 Fichier en cours : {nom_fichier}")
        
        try:
            xls = pd.ExcelFile(fichier)
            if "Feuil1" in xls.sheet_names:
                df_propre = transformer_format_feuil1(fichier)
            else:
                df_propre = transformer_format_journalier(fichier)
                
            if df_propre is not None and not df_propre.empty:
                toutes_donnees.append(df_propre)
                
        except Exception as e:
            print(f"❌ Erreur sur {nom_fichier}: {str(e)}")

    if toutes_donnees:
        df_master = pd.concat(toutes_donnees, ignore_index=True)
        chemin_export = os.path.join(DOSSIER_OUTPUT, "BDD_GROSSISTE_MASTER.xlsx")
        
        print("\n⏳ Sauvegarde du fichier Master en cours...")
        df_master.to_excel(chemin_export, index=False)
        print(f"🎉 Terminé ! Base de données propre générée : {chemin_export}")
        print(f"📊 Total des lignes extraites : {len(df_master)}")
        print(f"💰 Somme totale de la Gratuité : {df_master['Gratuité'].sum()}")

if __name__ == "__main__":
    main()