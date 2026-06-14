const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemin vers la base de données
const DB_PATH = path.join(__dirname, '../../data/reporting.db');
const DATA_DIR = path.join(__dirname, '../../data');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('Initialisation de la base de données SQLite améliorée...');
console.log('Chemin:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erreur connexion base de données:', err);
    process.exit(1);
  } else {
    console.log('Base de données connectée avec succès');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Table des agents (existante)
    db.run(`CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_number VARCHAR(20) UNIQUE NOT NULL,
      agent_name VARCHAR(100) NOT NULL,
      city VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      agent_type VARCHAR(20) DEFAULT 'commando',
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des objectifs (améliorée)
    db.run(`CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      objective_type VARCHAR(20) DEFAULT 'commando',
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      daily_visits_boutique INTEGER DEFAULT 0,
      daily_visits_superette INTEGER DEFAULT 0,
      daily_visits_kiosque INTEGER DEFAULT 0,
      daily_visits_tablier INTEGER DEFAULT 0,
      daily_visits_pushcart INTEGER DEFAULT 0,
      weekly_sales_premium_16g INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )`);

    // Table des performances Commando
    db.run(`CREATE TABLE IF NOT EXISTS commando_performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      report_date DATE NOT NULL,
      city VARCHAR(100),
      visits_boutique INTEGER DEFAULT 0,
      visits_superette INTEGER DEFAULT 0,
      visits_kiosque INTEGER DEFAULT 0,
      visits_tablier INTEGER DEFAULT 0,
      visits_pushcart INTEGER DEFAULT 0,
      sales_premium_16g INTEGER DEFAULT 0,
      sales_premium_360g INTEGER DEFAULT 0,
      sales_excellence_900g INTEGER DEFAULT 0,
      sales_avoine_50g INTEGER DEFAULT 0,
      sales_avoine_400g INTEGER DEFAULT 0,
      comments TEXT,
      impressions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      UNIQUE(agent_id, report_date)
    )`);

    // Supprimer l'ancienne table grossiste_performances pour la recréer avec la nouvelle structure
    db.run(`DROP TABLE IF EXISTS grossiste_performances`, (err) => {
      if (err) {
        console.error('Erreur suppression table grossiste_performances:', err);
      } else {
        console.log('Table grossiste_performances supprimée pour mise à jour');
      }
      
      // Table des performances Activation Grossiste (mise à jour selon structure réelle Excel)
      db.run(`CREATE TABLE grossiste_performances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        report_date DATE NOT NULL,
        city VARCHAR(100),
        grossiste_name VARCHAR(200),
        personnes_approchees INTEGER DEFAULT 0,
        client_acheteur VARCHAR(200),
        realisation_carton INTEGER DEFAULT 0,
        gratuit_chapelet_sachet INTEGER DEFAULT 0,
        taux_realisation DECIMAL(5, 2) DEFAULT 0,
        objectif_vente_carton INTEGER DEFAULT 0,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        UNIQUE(agent_id, report_date, grossiste_name)
      )`, (err) => {
        if (err) {
          console.error('Erreur création table grossiste_performances:', err);
        } else {
          console.log('Table grossiste_performances créée avec nouvelle structure');
        }
      });
    });

    // Table des imports
    db.run(`CREATE TABLE IF NOT EXISTS import_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name VARCHAR(255) NOT NULL,
      import_type VARCHAR(20) DEFAULT 'commando',
      total_rows INTEGER DEFAULT 0,
      valid_rows INTEGER DEFAULT 0,
      invalid_rows INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      error_log TEXT,
      imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Base de données améliorée initialisée avec succès');
    
    // Exporter la base de données
    module.exports = db;
  });
}

module.exports = db;
