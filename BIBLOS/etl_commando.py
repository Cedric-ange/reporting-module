import pandas as pd
import numpy as np
import os
import glob
import re

# --- CONFIGURATION DES CHEMINS ---
DOSSIER_SOURCE = r"C:\BIBLOS\DATA COMMANDO" 
DOSSIER_OUTPUT = r"C:\BIBLOS\OUTPUT"

os.makedirs(DOSSIER_OUTPUT, exist_ok=True)

def extraire_ville(nom_fichier):
    """Extrait la ville située au début du nom du fichier."""
    match = re.match(r"^([A-Z\s]+)\s*-", nom_fichier)
    if match:
        return match.group(1).strip()
    return nom_fichier.split(' ')[0].strip().upper()

def transformer_fichier_commando(file_path):
    nom_fichier = os.path.basename(file_path)
    ville = extraire_ville(nom_fichier)
    
    print(f"\n🔄 Transformation Commando : {nom_fichier}")
    xls = pd.ExcelFile(file_path)
    donnees_fichier = []
    
    for feuille in xls.sheet_names:
        if any(mot in feuille.upper() for mot in ["SYNTHÈSE", "SYNTHESE", "RECAP", "DASHBORD", "TOTAL", "NON TRAVAILLÉ", "FEUIL"]):
            continue
            
        print(f"   -> Traitement de la feuille : {feuille}")
        df_brut = pd.read_excel(xls, sheet_name=feuille, header=None)
        
        # 1. Trouver la ligne d'en-tête principale (celle avec N° et Agent)
        idx_main = None
        for i in range(min(15, len(df_brut))):
            if any(isinstance(val, str) and 'AGENT' in val.upper() for val in df_brut.iloc[i].values):
                idx_main = i
                break
                
        if idx_main is None:
            continue
            
        # 2. CAPTURE DES 3 NIVEAUX D'EN-TÊTES
        l1 = df_brut.iloc[idx_main - 1].ffill().fillna('')
        l2 = df_brut.iloc[idx_main].ffill().fillna('')
        l3 = df_brut.iloc[idx_main + 1].fillna('')

        colonnes_propres = []
        agent_trouve = False
        no_trouve = False
        
        for c1, c2, c3 in zip(l1, l2, l3):
            c1_str, c2_str, c3_str = str(c1).strip(), str(c2).strip(), str(c3).strip()
            c1_up, c2_up = c1_str.upper(), c2_str.upper()
            
            # Attribuer les noms standards une seule fois (évite les doublons liés aux fusions de cellules)
            if ("AGENT" in c2_up or "NOM" in c2_up) and not agent_trouve:
                colonnes_propres.append("Agent promoteur")
                agent_trouve = True
            elif ("N°" in c2_up or "NO" == c2_up) and not no_trouve:
                colonnes_propres.append("N°")
                no_trouve = True
                
            # Identifier les colonnes de métriques (Objectif vs Réalisé)
            elif "OBJECTIF" in c1_up or "REALISATION" in c1_up or "RÉALISATION" in c1_up:
                type_mesure = "Objectif" if "OBJECTIF" in c1_up else "Réalisé"
                colonnes_propres.append(f"{type_mesure}|{c2_str}|{c3_str}")
                
            # Autres colonnes (Commentaires, etc.)
            else:
                col_name = c2_str if c2_str and c2_str.lower() != 'nan' else c3_str
                colonnes_propres.append(col_name)

        # 3. DÉDUPLICATION DES COLONNES (C'est ce qui corrige l'erreur 'dtype')
        cols_uniques = []
        vus = {}
        for c in colonnes_propres:
            if not c or c.lower() == 'nan':
                c = "Vide"
            if c in vus:
                vus[c] += 1
                cols_uniques.append(f"{c}_{vus[c]}")
            else:
                vus[c] = 0
                cols_uniques.append(c)

        # Appliquer les colonnes dédupliquées
        df_data = df_brut.iloc[idx_main + 2:].copy()
        df_data.columns = cols_uniques
        
        # Nettoyage des lignes vides ou "Total"
        if "Agent promoteur" in df_data.columns:
            df_data = df_data.dropna(subset=["Agent promoteur"])
            df_data = df_data[~df_data["Agent promoteur"].astype(str).str.upper().str.contains("TOTAL")]
        
        # 4. Ajout des métadonnées
        df_data.insert(0, 'JOUR', feuille.strip())
        df_data.insert(0, 'Date', feuille.strip())
        df_data.insert(0, 'Ville', ville)

        # 5. UNPIVOT (Melt)
        cols_melt = [c for c in df_data.columns if '|' in c]
        cols_id = [c for c in df_data.columns if c not in cols_melt]
        
        if not cols_melt:
            continue
            
        df_melted = pd.melt(df_data, id_vars=cols_id, value_vars=cols_melt, value_name='Valeur')
        
        # Séparer la super-colonne en 3 vraies colonnes
        df_melted[['Type_Mesure', 'Metric_Category', 'Type de PDV']] = df_melted['variable'].str.split('|', expand=True)
        df_melted = df_melted.drop(columns=['variable'])
        
        # 6. PIVOT
        index_pivot = [c for c in df_melted.columns if c not in ['Type_Mesure', 'Valeur']]
        
        # FIX CRITIQUE: Remplacer les valeurs vides par des chaînes de caractères dans l'index 
        # pour empêcher le pivot_table de supprimer des lignes contenant des cellules vides (ex: Commentaires)
        df_melted[index_pivot] = df_melted[index_pivot].fillna("")
        
        df_pivot = df_melted.pivot_table(
            index=index_pivot,
            columns='Type_Mesure',
            values='Valeur',
            aggfunc='first'
        ).reset_index()

        df_pivot.columns.name = None
        
        # 7. Calculs additionnels
        if 'Objectif' in df_pivot.columns and 'Réalisé' in df_pivot.columns:
            df_pivot['Objectif'] = pd.to_numeric(df_pivot['Objectif'], errors='coerce').fillna(0)
            df_pivot['Réalisé'] = pd.to_numeric(df_pivot['Réalisé'], errors='coerce').fillna(0)
            df_pivot['Taux de réalisation'] = np.where(
                df_pivot['Objectif'] > 0, 
                df_pivot['Réalisé'] / df_pivot['Objectif'], 
                0
            )

        donnees_fichier.append(df_pivot)
        
    if not donnees_fichier:
        return None
        
    return pd.concat(donnees_fichier, ignore_index=True)

def main():
    print("🚀 Démarrage de l'ETL Commando...")
    fichiers = glob.glob(f"{DOSSIER_SOURCE}/*.xlsx")
    toutes_donnees = []
    
    for fichier in fichiers:
        if os.path.basename(fichier).startswith("~"): continue
        try:
            df_propre = transformer_fichier_commando(fichier)
            if df_propre is not None:
                toutes_donnees.append(df_propre)
        except Exception as e:
            print(f"❌ Erreur sur {os.path.basename(fichier)}: {str(e)}")

    if toutes_donnees:
        df_master = pd.concat(toutes_donnees, ignore_index=True)
        chemin_export = os.path.join(DOSSIER_OUTPUT, "BDD_COMMANDO_DYNAMIQUE.xlsx")
        
        # Réorganiser les colonnes proprement (s'assurer qu'elles existent avant)
        cols_debut = ['N°', 'Agent promoteur', 'Ville', 'Date', 'JOUR', 'Metric_Category', 'Type de PDV', 'Objectif', 'Réalisé', 'Taux de réalisation']
        cols_debut_exist = [c for c in cols_debut if c in df_master.columns]
        cols_fin = [c for c in df_master.columns if c not in cols_debut_exist]
        
        df_master = df_master[cols_debut_exist + cols_fin]

        df_master.to_excel(chemin_export, index=False)
        print(f"🎉 Base de données générée : {chemin_export}")
        print(f"📊 Nombre total de lignes extraites : {len(df_master)}")

if __name__ == "__main__":
    main()