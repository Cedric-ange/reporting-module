import pandas as pd
import numpy as np
import os
import glob

# Ajouter cette ligne pour masquer l'avertissement de Pandas
pd.set_option('future.no_silent_downcasting', True)

# --- CONFIGURATION DES CHEMINS ---
DOSSIER_SOURCE = r"C:\BIBLOS\PROMOPAQUE" # Remplacez par le dossier de vos fichiers Promo
DOSSIER_OUTPUT = r"C:\BIBLOS\OUTPUT"

os.makedirs(DOSSIER_OUTPUT, exist_ok=True)

def transformer_fichier_promo(file_path):
    nom_fichier = os.path.basename(file_path)
    print(f"\n🔄 Transformation Promo : {nom_fichier}")
    
    xls = pd.ExcelFile(file_path)
    donnees_fichier = []
    
    for feuille in xls.sheet_names:
        # On ignore les feuilles de synthèse / récap
        if "RECAP" in feuille.upper() or "SYNTH" in feuille.upper():
            continue
            
        print(f"   -> Traitement de la feuille : {feuille}")
        df_brut = pd.read_excel(xls, sheet_name=feuille, header=None)
        
        # 1. Extraire la date intelligemment (souvent en haut à gauche)
        date_promo = feuille
        for i in range(min(5, len(df_brut))):
            row_vals = df_brut.iloc[i].astype(str).str.upper().values
            if "DATE" in row_vals:
                idx_date = list(row_vals).index("DATE")
                if idx_date + 1 < len(row_vals):
                    val_date = df_brut.iloc[i, idx_date + 1]
                    if pd.notna(val_date) and str(val_date).strip() != '':
                        # On s'assure d'avoir la date propre (sans l'heure si c'est un datetime)
                        if isinstance(val_date, pd.Timestamp):
                            date_promo = val_date.strftime('%Y-%m-%d')
                        else:
                            date_promo = str(val_date).strip()
                break
                
        # 2. Trouver la ligne principale (celle qui contient "OBJECTIFS")
        idx_main = None
        for i in range(min(10, len(df_brut))):
            if any(isinstance(val, str) and 'OBJECTIFS' in val.upper() for val in df_brut.iloc[i].values):
                idx_main = i
                break
                
        if idx_main is None:
            continue
            
        # L1: OBJECTIFS / REALISATIONS / TAUX DE REALISATION (remplissage vers la droite)
        l1 = df_brut.iloc[idx_main].ffill().fillna('')
        # L2: Catégories (Contacts, Acheteurs, Produits, Goodies...)
        l2 = df_brut.iloc[idx_main + 1].ffill().fillna('')
        # L3: Détails / SKU (Biblos Lait 16g, Flocon, etc.)
        l3 = df_brut.iloc[idx_main + 2].fillna('')
        
        colonnes_propres = []
        enseigne_trouve = False
        pdv_trouve = False
        
        for c1, c2, c3 in zip(l1, l2, l3):
            c1_str = str(c1).strip().upper()
            c2_str = str(c2).strip().replace('\n', ' ')
            c3_str = str(c3).strip().replace('\n', ' ')
            
            c2_up = c2_str.upper()
            
            # Identifiants fixes
            if "ENSEIGNE" in c2_up and not enseigne_trouve:
                colonnes_propres.append("Enseigne")
                enseigne_trouve = True
            elif "PDV" in c2_up and not pdv_trouve:
                colonnes_propres.append("Nom du PDV")
                pdv_trouve = True
            elif "COMMENTAIRE" in c2_up:
                colonnes_propres.append("Commentaires")
            elif "IMPRESSION" in c2_up:
                colonnes_propres.append("Impressions clients")
            
            # Variables à pivoter (Objectifs, Réalisé, Taux)
            elif "OBJECTIF" in c1_str or "REALISATION" in c1_str or "RÉALISATION" in c1_str or "TAUX" in c1_str:
                if "OBJECTIF" in c1_str: 
                    type_m = "Objectif"
                elif "TAUX" in c1_str: 
                    type_m = "Taux de réalisation"
                else: 
                    type_m = "Réalisé"
                
                cat = c2_str if c2_str and c2_str.lower() != 'nan' else "Général"
                detail = c3_str if c3_str and c3_str.lower() != 'nan' else cat
                
                # Création de la super-colonne (Type | Catégorie | Détail)
                colonnes_propres.append(f"{type_m}|{cat}|{detail}")
            else:
                colonnes_propres.append("A_IGNORER")
                
        # 3. Déduplication des colonnes (Sécurité)
        cols_uniques = []
        vus = {}
        for c in colonnes_propres:
            if c in vus and c != "A_IGNORER":
                vus[c] += 1
                cols_uniques.append(f"{c}_{vus[c]}")
            else:
                vus[c] = 0
                cols_uniques.append(c)
                
        df_data = df_brut.iloc[idx_main + 3:].copy()
        df_data.columns = cols_uniques
        
        # Filtre des colonnes inutiles
        df_data = df_data.loc[:, [c for c in df_data.columns if "A_IGNORER" not in c]]
        
        # Nettoyage des lignes (on supprime si l'enseigne est vide ou contient Total)
        if "Enseigne" in df_data.columns:
            df_data = df_data.dropna(subset=["Enseigne"])
            df_data = df_data[~df_data["Enseigne"].astype(str).str.upper().str.contains("TOTAL")]
            
        # 4. Ajout des Métadonnées
        df_data.insert(0, "Date", date_promo)
        df_data.insert(0, "Fichier_Source", nom_fichier)
        
        # 5. UNPIVOT (Melt)
        cols_melt = [c for c in df_data.columns if '|' in c]
        cols_id = [c for c in df_data.columns if c not in cols_melt]
        
        if not cols_melt: 
            continue
        
        df_melted = pd.melt(df_data, id_vars=cols_id, value_vars=cols_melt, value_name='Valeur')
        
        # Découpage de la super-colonne
        df_melted[['Type_Mesure', 'Catégorie_Métrique', 'Produit_ou_Détail']] = df_melted['variable'].str.split('|', expand=True)
        df_melted = df_melted.drop(columns=['variable'])
        
        # 6. PIVOT (Mettre Objectif, Réalisé et Taux côte à côte)
        index_pivot = [c for c in df_melted.columns if c not in ['Type_Mesure', 'Valeur']]
        df_melted[index_pivot] = df_melted[index_pivot].fillna("")
        
        df_pivot = df_melted.pivot_table(
            index=index_pivot,
            columns='Type_Mesure',
            values='Valeur',
            aggfunc='first'
        ).reset_index()
        
        df_pivot.columns.name = None
        
        # Nettoyage final des valeurs numériques
        for col in ['Objectif', 'Réalisé', 'Taux de réalisation']:
            if col in df_pivot.columns:
                df_pivot[col] = pd.to_numeric(df_pivot[col], errors='coerce').fillna(0)
            else:
                df_pivot[col] = 0
                
        donnees_fichier.append(df_pivot)
        
    if not donnees_fichier:
        return None
        
    return pd.concat(donnees_fichier, ignore_index=True)

def main():
    print("🚀 Démarrage de l'ETL Promo...")
    fichiers = glob.glob(f"{DOSSIER_SOURCE}/*.xlsx")
    toutes_donnees = []
    
    if not fichiers:
        print(f"⚠️ Aucun fichier Excel trouvé dans {DOSSIER_SOURCE}")
        return
    
    for fichier in fichiers:
        if os.path.basename(fichier).startswith("~"): continue
        try:
            df_propre = transformer_fichier_promo(fichier)
            if df_propre is not None:
                toutes_donnees.append(df_propre)
        except Exception as e:
            print(f"❌ Erreur sur {os.path.basename(fichier)}: {str(e)}")

    if toutes_donnees:
        df_master = pd.concat(toutes_donnees, ignore_index=True)
        chemin_export = os.path.join(DOSSIER_OUTPUT, "BDD_PROMO_DYNAMIQUE.xlsx")
        
        # Organisation esthétique des colonnes
        cols_debut = ['Date', 'Enseigne', 'Nom du PDV', 'Catégorie_Métrique', 'Produit_ou_Détail', 'Objectif', 'Réalisé', 'Taux de réalisation']
        cols_debut_exist = [c for c in cols_debut if c in df_master.columns]
        cols_fin = [c for c in df_master.columns if c not in cols_debut_exist]
        
        df_master = df_master[cols_debut_exist + cols_fin]

        df_master.to_excel(chemin_export, index=False)
        print(f"🎉 Base de données générée avec succès : {chemin_export}")
        print(f"📊 Nombre total de lignes générées : {len(df_master)}")

if __name__ == "__main__":
    main()