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

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erreur connexion base de données:', err);
      } else {
        console.log('Base de données connectée avec succès');
        this.initializeDatabase();
      }
    });
  }

  initializeDatabase() {
    // Activer les clés étrangères
    this.run("PRAGMA foreign_keys = ON");
    
    // Créer les tables
    this.createTables();
    
    console.log('Base de données initialisée avec succès');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  createTables() {
    const tables = [
      // Table agents
      `CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_number VARCHAR(20) UNIQUE NOT NULL,
        agent_name VARCHAR(100) NOT NULL,
        city VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table objectifs
      `CREATE TABLE IF NOT EXISTS objectives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        daily_visits_boutique INTEGER DEFAULT 0,
        daily_visits_superette INTEGER DEFAULT 0,
        daily_visits_kiosque INTEGER DEFAULT 0,
        daily_visits_tablier INTEGER DEFAULT 0,
        daily_visits_pushcart INTEGER DEFAULT 0,
        weekly_sales_premium_16g INTEGER DEFAULT 0,
        weekly_sales_premium_360g INTEGER DEFAULT 0,
        weekly_sales_excellence_900g INTEGER DEFAULT 0,
        weekly_sales_avoine_50g INTEGER DEFAULT 0,
        weekly_sales_avoine_400g INTEGER DEFAULT 0,
        monthly_references INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )`,
      
      // Table performances
      `CREATE TABLE IF NOT EXISTS performances (
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
      )`,
      
      // Table imports
      `CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name VARCHAR(255) NOT NULL,
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_rows INTEGER DEFAULT 0,
        valid_rows INTEGER DEFAULT 0,
        invalid_rows INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        error_log TEXT,
        imported_by VARCHAR(100)
      )`
    ];

    tables.forEach(tableSQL => {
      this.run(tableSQL).catch(err => console.error('Erreur création table:', err));
    });

    // Créer des index pour optimiser les performances
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_performances_agent_date ON performances(agent_id, report_date)',
      'CREATE INDEX IF NOT EXISTS idx_objectives_agent_period ON objectives(agent_id, period_start, period_end)'
    ];

    indexes.forEach(indexSQL => {
      this.run(indexSQL).catch(err => console.error('Erreur création index:', err));
    });
  }

  // === MÉTHODES AGENTS ===

  async createAgent(agentData) {
    try {
      const result = await this.run(
        `INSERT INTO agents (agent_number, agent_name, city, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          agentData.agent_number,
          agentData.agent_name,
          agentData.city || null,
          agentData.phone || null,
          agentData.email || null,
          agentData.status || 'active'
        ]
      );
      return this.getAgentById(result.lastID);
    } catch (error) {
      throw error;
    }
  }

  async getAgentById(id) {
    return this.get('SELECT * FROM agents WHERE id = ?', [id]);
  }

  async getAgentByNumber(agentNumber) {
    return this.get('SELECT * FROM agents WHERE agent_number = ?', [agentNumber]);
  }

  async getAllAgents() {
    return this.all('SELECT * FROM agents WHERE status = "active" ORDER BY agent_name');
  }

  async updateAgent(id, agentData) {
    await this.run(
      `UPDATE agents 
       SET agent_name = ?, city = ?, phone = ?, email = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        agentData.agent_name,
        agentData.city || null,
        agentData.phone || null,
        agentData.email || null,
        agentData.status || 'active',
        id
      ]
    );
    return this.getAgentById(id);
  }

  async deleteAgent(id) {
    await this.run('UPDATE agents SET status = "deleted" WHERE id = ?', [id]);
  }

  // === MÉTHODES OBJECTIFS ===

  async createObjective(objectiveData) {
    const result = await this.run(
      `INSERT INTO objectives (
        agent_id, period_start, period_end,
        daily_visits_boutique, daily_visits_superette, daily_visits_kiosque,
        daily_visits_tablier, daily_visits_pushcart,
        weekly_sales_premium_16g, weekly_sales_premium_360g, weekly_sales_excellence_900g,
        weekly_sales_avoine_50g, weekly_sales_avoine_400g,
        monthly_references, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        objectiveData.agent_id,
        objectiveData.period_start,
        objectiveData.period_end,
        objectiveData.daily_visits_boutique || 0,
        objectiveData.daily_visits_superette || 0,
        objectiveData.daily_visits_kiosque || 0,
        objectiveData.daily_visits_tablier || 0,
        objectiveData.daily_visits_pushcart || 0,
        objectiveData.weekly_sales_premium_16g || 0,
        objectiveData.weekly_sales_premium_360g || 0,
        objectiveData.weekly_sales_excellence_900g || 0,
        objectiveData.weekly_sales_avoine_50g || 0,
        objectiveData.weekly_sales_avoine_400g || 0,
        objectiveData.monthly_references || 0,
        'active'
      ]
    );
    return this.getObjectiveById(result.lastID);
  }

  async getObjectiveById(id) {
    return this.get('SELECT * FROM objectives WHERE id = ?', [id]);
  }

  async getActiveObjectivesForAgent(agentId, date = new Date().toISOString().split('T')[0]) {
    return this.all(
      `SELECT * FROM objectives 
       WHERE agent_id = ? 
       AND status = 'active'
       AND ? >= period_start 
       AND ? <= period_end
       ORDER BY period_start DESC`,
      [agentId, date, date]
    );
  }

  async updateObjective(id, objectiveData) {
    await this.run(
      `UPDATE objectives 
       SET period_start = ?, period_end = ?,
           daily_visits_boutique = ?, daily_visits_superette = ?, daily_visits_kiosque = ?,
           daily_visits_tablier = ?, daily_visits_pushcart = ?,
           weekly_sales_premium_16g = ?, weekly_sales_premium_360g = ?, weekly_sales_excellence_900g = ?,
           weekly_sales_avoine_50g = ?, weekly_sales_avoine_400g = ?,
           monthly_references = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        objectiveData.period_start,
        objectiveData.period_end,
        objectiveData.daily_visits_boutique || 0,
        objectiveData.daily_visits_superette || 0,
        objectiveData.daily_visits_kiosque || 0,
        objectiveData.daily_visits_tablier || 0,
        objectiveData.daily_visits_pushcart || 0,
        objectiveData.weekly_sales_premium_16g || 0,
        objectiveData.weekly_sales_premium_360g || 0,
        objectiveData.weekly_sales_excellence_900g || 0,
        objectiveData.weekly_sales_avoine_50g || 0,
        objectiveData.weekly_sales_avoine_400g || 0,
        objectiveData.monthly_references || 0,
        id
      ]
    );
    return this.getObjectiveById(id);
  }

  // === MÉTHODES PERFORMANCES ===

  async createPerformance(performanceData) {
    try {
      const result = await this.run(
        `INSERT INTO performances (
          agent_id, report_date,
          visits_boutique, visits_superette, visits_kiosque, visits_tablier, visits_pushcart,
          ref_boutique, ref_superette, ref_kiosque, ref_tablier, ref_pushcart,
          poster_premium, poster_excellence, poster_avoine, hanger, wobbler,
          sales_premium_16g, sales_premium_360g, sales_excellence_900g, sales_avoine_50g, sales_avoine_400g,
          presence_premium_16g, presence_premium_360g, presence_excellence_900g, presence_avoine_50g, presence_avoine_400g,
          new_ref_premium_16g, new_ref_premium_360g, new_ref_excellence_900g, new_ref_avoine_50g, new_ref_avoine_400g,
          real_ref_boutique, real_ref_superette, real_ref_kiosque, real_ref_tablier, real_ref_pushcart,
          real_sales_premium_16g, real_sales_premium_360g, real_sales_excellence_900g, real_sales_avoine_50g, real_sales_avoine_400g,
          real_poster_premium, real_poster_excellence, real_poster_avoine, real_hanger, real_wobbler,
          free_premium_16g, free_excellence_900g, free_avoine_50g,
          comments, impressions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          performanceData.agent_id,
          performanceData.report_date,
          performanceData.visits_boutique || 0,
          performanceData.visits_superette || 0,
          performanceData.visits_kiosque || 0,
          performanceData.visits_tablier || 0,
          performanceData.visits_pushcart || 0,
          performanceData.ref_boutique || 0,
          performanceData.ref_superette || 0,
          performanceData.ref_kiosque || 0,
          performanceData.ref_tablier || 0,
          performanceData.ref_pushcart || 0,
          performanceData.poster_premium || 0,
          performanceData.poster_excellence || 0,
          performanceData.poster_avoine || 0,
          performanceData.hanger || 0,
          performanceData.wobbler || 0,
          performanceData.sales_premium_16g || 0,
          performanceData.sales_premium_360g || 0,
          performanceData.sales_excellence_900g || 0,
          performanceData.sales_avoine_50g || 0,
          performanceData.sales_avoine_400g || 0,
          performanceData.presence_premium_16g || 0,
          performanceData.presence_premium_360g || 0,
          performanceData.presence_excellence_900g || 0,
          performanceData.presence_avoine_50g || 0,
          performanceData.presence_avoine_400g || 0,
          performanceData.new_ref_premium_16g || 0,
          performanceData.new_ref_premium_360g || 0,
          performanceData.new_ref_excellence_900g || 0,
          performanceData.new_ref_avoine_50g || 0,
          performanceData.new_ref_avoine_400g || 0,
          performanceData.real_ref_boutique || 0,
          performanceData.real_ref_superette || 0,
          performanceData.real_ref_kiosque || 0,
          performanceData.real_ref_tablier || 0,
          performanceData.real_ref_pushcart || 0,
          performanceData.real_sales_premium_16g || 0,
          performanceData.real_sales_premium_360g || 0,
          performanceData.real_sales_excellence_900g || 0,
          performanceData.real_sales_avoine_50g || 0,
          performanceData.real_sales_avoine_400g || 0,
          performanceData.real_poster_premium || 0,
          performanceData.real_poster_excellence || 0,
          performanceData.real_poster_avoine || 0,
          performanceData.real_hanger || 0,
          performanceData.real_wobbler || 0,
          performanceData.free_premium_16g || 0,
          performanceData.free_excellence_900g || 0,
          performanceData.free_avoine_50g || 0,
          performanceData.comments || null,
          performanceData.impressions || null
        ]
      );
      return this.getPerformanceById(result.lastID);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        // Mise à jour si existe déjà
        const existing = await this.getPerformanceByAgentAndDate(
          performanceData.agent_id, 
          performanceData.report_date
        );
        if (existing) {
          return this.updatePerformanceByAgentAndDate(
            performanceData.agent_id,
            performanceData.report_date,
            performanceData
          );
        }
      }
      throw error;
    }
  }

  async getPerformanceById(id) {
    return this.get('SELECT * FROM performances WHERE id = ?', [id]);
  }

  async getPerformanceByAgentAndDate(agentId, date) {
    return this.get('SELECT * FROM performances WHERE agent_id = ? AND report_date = ?', [agentId, date]);
  }

  async updatePerformanceByAgentAndDate(agentId, date, performanceData) {
    await this.run(
      `UPDATE performances 
       SET 
         visits_boutique = ?, visits_superette = ?, visits_kiosque = ?, visits_tablier = ?, visits_pushcart = ?,
         ref_boutique = ?, ref_superette = ?, ref_kiosque = ?, ref_tablier = ?, ref_pushcart = ?,
         poster_premium = ?, poster_excellence = ?, poster_avoine = ?, hanger = ?, wobbler = ?,
         sales_premium_16g = ?, sales_premium_360g = ?, sales_excellence_900g = ?, sales_avoine_50g = ?, sales_avoine_400g = ?,
         presence_premium_16g = ?, presence_premium_360g = ?, presence_excellence_900g = ?, presence_avoine_50g = ?, presence_avoine_400g = ?,
         new_ref_premium_16g = ?, new_ref_premium_360g = ?, new_ref_excellence_900g = ?, new_ref_avoine_50g = ?, new_ref_avoine_400g = ?,
         real_ref_boutique = ?, real_ref_superette = ?, real_ref_kiosque = ?, real_ref_tablier = ?, real_ref_pushcart = ?,
         real_sales_premium_16g = ?, real_sales_premium_360g = ?, real_sales_excellence_900g = ?, real_sales_avoine_50g = ?, real_sales_avoine_400g = ?,
         real_poster_premium = ?, real_poster_excellence = ?, real_poster_avoine = ?, real_hanger = ?, real_wobbler = ?,
         free_premium_16g = ?, free_excellence_900g = ?, free_avoine_50g = ?,
         comments = ?, impressions = ?, updated_at = CURRENT_TIMESTAMP
       WHERE agent_id = ? AND report_date = ?`,
      [
        performanceData.visits_boutique || 0,
        performanceData.visits_superette || 0,
        performanceData.visits_kiosque || 0,
        performanceData.visits_tablier || 0,
        performanceData.visits_pushcart || 0,
        performanceData.ref_boutique || 0,
        performanceData.ref_superette || 0,
        performanceData.ref_kiosque || 0,
        performanceData.ref_tablier || 0,
        performanceData.ref_pushcart || 0,
        performanceData.poster_premium || 0,
        performanceData.poster_excellence || 0,
        performanceData.poster_avoine || 0,
        performanceData.hanger || 0,
        performanceData.wobbler || 0,
        performanceData.sales_premium_16g || 0,
        performanceData.sales_premium_360g || 0,
        performanceData.sales_excellence_900g || 0,
        performanceData.sales_avoine_50g || 0,
        performanceData.sales_avoine_400g || 0,
        performanceData.presence_premium_16g || 0,
        performanceData.presence_premium_360g || 0,
        performanceData.presence_excellence_900g || 0,
        performanceData.presence_avoine_50g || 0,
        performanceData.presence_avoine_400g || 0,
        performanceData.new_ref_premium_16g || 0,
        performanceData.new_ref_premium_360g || 0,
        performanceData.new_ref_excellence_900g || 0,
        performanceData.new_ref_avoine_50g || 0,
        performanceData.new_ref_avoine_400g || 0,
        performanceData.real_ref_boutique || 0,
        performanceData.real_ref_superette || 0,
        performanceData.real_ref_kiosque || 0,
        performanceData.real_ref_tablier || 0,
        performanceData.real_ref_pushcart || 0,
        performanceData.real_sales_premium_16g || 0,
        performanceData.real_sales_premium_360g || 0,
        performanceData.real_sales_excellence_900g || 0,
        performanceData.real_sales_avoine_50g || 0,
        performanceData.real_sales_avoine_400g || 0,
        performanceData.real_poster_premium || 0,
        performanceData.real_poster_excellence || 0,
        performanceData.real_poster_avoine || 0,
        performanceData.real_hanger || 0,
        performanceData.real_wobbler || 0,
        performanceData.free_premium_16g || 0,
        performanceData.free_excellence_900g || 0,
        performanceData.free_avoine_50g || 0,
        performanceData.comments || null,
        performanceData.impressions || null,
        agentId,
        date
      ]
    );
    return this.getPerformanceByAgentAndDate(agentId, date);
  }

  async getAllPerformances(filters = {}) {
    let sql = `SELECT p.*, a.agent_number, a.agent_name, a.city 
                FROM performances p 
                JOIN agents a ON p.agent_id = a.id 
                WHERE 1=1`;
    const params = [];
    
    if (filters.agent_id) {
      sql += ' AND p.agent_id = ?';
      params.push(filters.agent_id);
    }
    
    if (filters.date_from) {
      sql += ' AND p.report_date >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += ' AND p.report_date <= ?';
      params.push(filters.date_to);
    }
    
    sql += ' ORDER BY p.report_date DESC, a.agent_name';
    
    return this.all(sql, params);
  }

  // === MÉTHODES IMPORTS ===

  async createImportRecord(importData) {
    const result = await this.run(
      `INSERT INTO imports (file_name, total_rows, valid_rows, invalid_rows, status, error_log, imported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        importData.file_name,
        importData.total_rows || 0,
        importData.valid_rows || 0,
        importData.invalid_rows || 0,
        importData.status || 'pending',
        importData.error_log || null,
        importData.imported_by || 'system'
      ]
    );
    return this.getImportById(result.lastID);
  }

  async getImportById(id) {
    return this.get('SELECT * FROM imports WHERE id = ?', [id]);
  }

  async getAllImports() {
    return this.all('SELECT * FROM imports ORDER BY import_date DESC');
  }

  // === MÉTHODES UTILITAIRES ===

  async getStatistics() {
    const stats = {
      total_agents: 0,
      active_objectives: 0,
      total_performances: 0,
      performances_this_month: 0
    };
    
    stats.total_agents = (await this.get('SELECT COUNT(*) as count FROM agents WHERE status = "active"')).count;
    stats.active_objectives = (await this.get('SELECT COUNT(*) as count FROM objectives WHERE status = "active"')).count;
    stats.total_performances = (await this.get('SELECT COUNT(*) as count FROM performances')).count;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    stats.performances_this_month = (await this.get('SELECT COUNT(*) as count FROM performances WHERE report_date LIKE ?', [currentMonth + '%'])).count;
    
    return stats;
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();