import shutil
import os

# Chemins des fichiers
source_file = r'C:\Users\angec\Downloads\SAN PEDRO - REPORTING COMMANDO DE REFE. DETAILLANTS LAIT & FLOC. AVOINE (1).xlsx'
dest_file = r'C:\Users\angec\reporting-module\backend\templates\template_original.xlsx'

# Créer le dossier templates s'il n'existe pas
os.makedirs(r'C:\Users\angec\reporting-module\backend\templates', exist_ok=True)

# Copier le fichier original
shutil.copy(source_file, dest_file)

print(f"Template original copié: {dest_file}")
print("Le fichier original avec en-têtes, couleurs et formules intactes est utilisé")