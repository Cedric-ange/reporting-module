# Module de Reporting Commercial

Application web modulaire pour la saisie et le suivi de données commerciales basée sur des fichiers Excel.

## 🚀 Fonctionnalités

- ✅ Saisie intuitive des données de reporting commercial
- ✅ Mode hors ligne avec localStorage
- ✅ Synchronisation automatique lors de la reconnexion
- ✅ Export/Import Excel
- ✅ Statistiques en temps réel
- ✅ Architecture modulaire pour intégration facile
- ✅ Design responsive

## 📋 Structure du projet

```
reporting-module/
├── backend/                 # API Node.js
│   ├── server.js           # Serveur principal
│   ├── package.json        # Dépendances backend
│   └── exports/            # Fichiers Excel exportés
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   │   └── DataForm.js # Formulaire de saisie
│   │   ├── services/       # Services
│   │   │   ├── DataService.js    # API backend
│   │   │   └── OfflineService.js  # Gestion hors ligne
│   │   ├── App.js          # Application principale
│   │   ├── index.js        # Point d'entrée
│   │   └── index.css       # Styles globaux
│   ├── public/             # Fichiers statiques
│   └── package.json        # Dépendances frontend
└── package.json            # Scripts du projet
```

## 🔧 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### Installation des dépendances

```bash
# Installer toutes les dépendances
npm run install:all
```

Ou séparément :

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 🚀 Lancement

### Mode développement (les deux serveurs)

```bash
npm run dev
```

Ou séparément :

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

L'application sera accessible sur :
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Mode production

```bash
# Construire le frontend
npm run build:frontend

# Démarrer le backend
npm run start:backend
```

## 📊 Structure des données

Le module suit la structure du fichier Excel original avec :

- **Informations agent**: Numéro, nom, ville
- **Visites par type de PDV**: Boutique, Superette, Kiosque, Tablier, Pushcart
- **Référencement**: Par type de PDV et par SKU
- **Matériel de visibilité**: Affiches, hangers, wobblers
- **Ventes**: Par produit (Biblos Lait Premium/Excellence, Flocons d'avoine)
- **Commentaires et impressions**

## 🔌 Intégration

### Comme module indépendant

Le module peut être utilisé comme application autonome ou intégré dans une application existante.

### Intégration dans une application React existante

1. Copier les composants et services
2. Adapter les styles CSS
3. Configurer les URLs de l'API
4. Personnaliser la structure des données si nécessaire

## 🌐 Déploiement

### GitHub
Le code sera poussé sur GitHub pour le versionnement.

### Supabase
Pour le déploiement backend et la base de données.

### Vercel
Pour le déploiement frontend.

## 🔄 Synchronisation

L'application supporte :
- **Mode hors ligne**: Sauvegarde locale dans localStorage
- **Synchronisation automatique**: Lors de la reconnexion
- **Export Excel**: Pour sauvegarder les données
- **Import Excel**: Pour restaurer les données

## 📝 Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier frontend :

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🤝 Contribution

Ce module est conçu pour être facilement extensible et personnalisable.

## 📄 Licence

MIT
