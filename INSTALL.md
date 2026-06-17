# Guide d'Installation Rapide

## Prérequis
- Node.js (v14 ou supérieur) installé
- npm ou yarn

## Installation

### Option 1: Scripts automatiques (Windows)

#### Installation
```bash
# Exécuter le script d'installation
install.bat
```

Ou avec PowerShell :
```powershell
.\install.ps1
```

#### Démarrage
```bash
# Exécuter le script de démarrage
start.bat
```

Ou avec PowerShell :
```powershell
.\start.ps1
```

### Option 2: Installation manuelle

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend (nouveau terminal)
```bash
cd frontend
npm install
npm start
```

## Accès à l'application

Une fois démarrée, l'application sera accessible sur :
- **Frontend**: http://localhost:3000
- **Backend**: http://

## Dépannage

### Problèmes d'installation

Si npm install échoue :
1. Vérifier que Node.js est installé : `node --version`
2. Essayer avec yarn : `yarn install`
3. Nettoyer le cache : `npm cache clean --force`

### Problèmes de démarrage

Si les serveurs ne démarrent pas :
1. Vérifier que les ports 3000 et 5000 sont disponibles
2. Arrêter d'autres processus utilisant ces ports
3. Vérifier les logs dans les terminaux

### Mode hors ligne

L'application fonctionne automatiquement en mode hors ligne si la connexion est perdue. Les données sont sauvegardées localement et synchronisées lors de la reconnexion.

## Prochaines étapes

Après avoir testé l'application localement :

1. **Pusher sur GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <votre-repo-github>
   git push -u origin main
   ```

2. **Déployer sur Supabase** (backend)
   - Créer un projet Supabase
   - Configurer la base de données
   - Déployer l'API

3. **Déployer sur Vercel** (frontend)
   - Connecter Vercel au repo GitHub
   - Configurer les variables d'environnement
   - Déployer
