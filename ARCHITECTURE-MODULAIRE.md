# Architecture Modulaire - Module de Reporting Commercial

## 📐 Structure Modulaire

L'application est divisée en 4 modules distincts :

### Module 1 : Gestion des Agents et Objectifs
**Responsabilités :**
- Création d'agents (numéro, nom, ville, contact)
- Définition des objectifs par agent et par période
- Modification/suppression d'agents
- Affectation d'objectifs de visites, ventes, référencement

**Données gérées :**
- Informations agent (id, numéro, nom, ville, téléphone, email)
- Objectifs (visites/jour, ventes/semaine, référencement/mois)
- Périodes de validité des objectifs

### Module 2 : Performances et Activités
**Responsabilités :**
- Saisie des performances quotidiennes
- Enregistrement des visites par type de PDV
- Saisie des ventes par produit
- Commentaires et impressions des PDV
- Suivi des réalisations vs objectifs

**Données gérées :**
- Performances quotidiennes (visites, ventes, matériel)
- Commentaires terrain
- Impressions PDV
- Statut de progression vs objectifs

### Module 3 : Import Excel avec Template
**Responsabilités :**
- Téléchargement du template Excel pour les agences
- Import des fichiers Excel remplis par les agences
- Validation des données importées
- Gestion des erreurs d'import

**Fonctionnalités :**
- Template Excel standardisé
- Validation stricte des données
- Messages d'erreur détaillés
- Correction et réimport possible

### Module 4 : Export Excel
**Responsabilités :**
- Export des données stockées en format Excel
- Filtres par période, agent, ville
- Format identique au fichier Excel original
- Synthèses et statistiques

**Options d'export :**
- Export complet
- Export par période
- Export par agent
- Export par ville

## 🗄️ Base de Données

### SQLite (Local)
- Base de données locale opérationnelle
- Tables : agents, objectifs, performances, commentaires
- Facile à migrer vers Supabase
- Sauvegarde et restauration possibles

### Schéma de la Base de Données

```sql
-- Table agents
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_number VARCHAR(20) UNIQUE NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table objectifs
CREATE TABLE objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    daily_visits INTEGER DEFAULT 0,
    weekly_sales INTEGER DEFAULT 0,
    monthly_references INTEGER DEFAULT 0,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Table performances
CREATE TABLE performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    report_date DATE NOT NULL,
    
    -- Visites par type PDV
    visits_boutique INTEGER DEFAULT 0,
    visits_superette INTEGER DEFAULT 0,
    visits_kiosque INTEGER DEFAULT 0,
    visits_tablier INTEGER DEFAULT 0,
    visits_pushcart INTEGER DEFAULT 0,
    
    -- Référencement
    ref_boutique INTEGER DEFAULT 0,
    ref_superette INTEGER DEFAULT 0,
    ref_kiosque INTEGER DEFAULT 0,
    ref_tablier INTEGER DEFAULT 0,
    ref_pushcart INTEGER DEFAULT 0,
    
    -- Matériel visibilité
    poster_premium INTEGER DEFAULT 0,
    poster_excellence INTEGER DEFAULT 0,
    poster_avoine INTEGER DEFAULT 0,
    hanger INTEGER DEFAULT 0,
    wobbler INTEGER DEFAULT 0,
    
    -- Ventes par produit
    sales_premium_16g INTEGER DEFAULT 0,
    sales_premium_360g INTEGER DEFAULT 0,
    sales_excellence_900g INTEGER DEFAULT 0,
    sales_avoine_50g INTEGER DEFAULT 0,
    sales_avoine_400g INTEGER DEFAULT 0,
    
    -- Présence produits
    presence_premium_16g INTEGER DEFAULT 0,
    presence_premium_360g INTEGER DEFAULT 0,
    presence_excellence_900g INTEGER DEFAULT 0,
    presence_avoine_50g INTEGER DEFAULT 0,
    presence_avoine_400g INTEGER DEFAULT 0,
    
    -- Nouveau référencement
    new_ref_premium_16g INTEGER DEFAULT 0,
    new_ref_premium_360g INTEGER DEFAULT 0,
    new_ref_excellence_900g INTEGER DEFAULT 0,
    new_ref_avoine_50g INTEGER DEFAULT 0,
    new_ref_avoine_400g INTEGER DEFAULT 0,
    
    -- Référencement réalisé
    real_ref_boutique INTEGER DEFAULT 0,
    real_ref_superette INTEGER DEFAULT 0,
    real_ref_kiosque INTEGER DEFAULT 0,
    real_ref_tablier INTEGER DEFAULT 0,
    real_ref_pushcart INTEGER DEFAULT 0,
    
    -- Ventes réalisées
    real_sales_premium_16g INTEGER DEFAULT 0,
    real_sales_premium_360g INTEGER DEFAULT 0,
    real_sales_excellence_900g INTEGER DEFAULT 0,
    real_sales_avoine_50g INTEGER DEFAULT 0,
    real_sales_avoine_400g INTEGER DEFAULT 0,
    
    -- Matériel réalisé
    real_poster_premium INTEGER DEFAULT 0,
    real_poster_excellence INTEGER DEFAULT 0,
    real_poster_avoine INTEGER DEFAULT 0,
    real_hanger INTEGER DEFAULT 0,
    real_wobbler INTEGER DEFAULT 0,
    
    -- Gratuits
    free_premium_16g INTEGER DEFAULT 0,
    free_excellence_900g INTEGER DEFAULT 0,
    free_avoine_50g INTEGER DEFAULT 0,
    
    -- Commentaires
    comments TEXT,
    impressions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE(agent_id, report_date)
);

-- Table imports
CREATE TABLE imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL,
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    error_log TEXT,
    imported_by VARCHAR(100)
);
```

## 🎯 Flux de Données

```
1. Module Agents
   ↓
   Création agent + Définition objectifs
   ↓
   Base de données SQLite

2. Module Performances  
   ↓
   Saisie quotidienne par agent
   ↓
   Base de données SQLite

3. Module Import
   ↓
   Template Excel → Rempli par agences → Import avec validation
   ↓
   Base de données SQLite

4. Module Export
   ↓
   Extraction données SQLite
   ↓
   Fichier Excel format original
```

## 📱 Interface Utilisateur

### Navigation Principale
- 📋 **Gestion Agents** : Module 1
- 📊 **Performances** : Module 2
- 📥 **Import Excel** : Module 3
- 📤 **Export Excel** : Module 4
- 📈 **Tableau de Bord** : Vue synthétique

### Module 1 : Gestion Agents
- Liste des agents avec filtres
- Formulaire création/modification
- Définition des objectifs par période
- Vue des objectifs actifs

### Module 2 : Performances
- Sélection agent + date
- Formulaire de saisie quotidien
- Comparaison objectifs vs réalisations
- Commentaires et impressions

### Module 3 : Import Excel
- Téléchargement template
- Upload fichier rempli
- Validation et import
- Gestion des erreurs

### Module 4 : Export Excel
- Sélection filtres (période, agent, ville)
- Aperçu des données
- Export en format Excel
- Téléchargement fichier
