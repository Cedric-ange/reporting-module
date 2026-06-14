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

console.log('Initialisation de la base de données SQLite...');
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
    // Créer les tables
    db.run(`CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_number VARCHAR(20) UNIQUE NOT NULL,
      agent_name VARCHAR(100) NOT NULL,
      city VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      daily_visits_boutique INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      report_date DATE NOT NULL,
      visits_boutique INTEGER DEFAULT 0,
      sales_premium_16g INTEGER DEFAULT 0,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      UNIQUE(agent_id, report_date)
    )`);

    console.log('Base de données initialisée avec succès');
    
    // Exporter la base de données
    module.exports = db;
  });
}

module.exports = db;