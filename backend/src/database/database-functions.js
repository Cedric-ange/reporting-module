const db = require('./database-enhanced');

// Fonctions pour les agents
const agentFunctions = {
  getAllAgents: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM agents ORDER BY agent_name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getAgentById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM agents WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getAgentByNumber: (number) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM agents WHERE agent_number = ?', [number], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  createAgent: (agent) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO agents (agent_number, agent_name, city, phone, email, agent_type) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(sql, [agent.agent_number, agent.agent_name, agent.city, agent.phone, agent.email, agent.agent_type || 'commando'], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...agent });
      });
    });
  },

  updateAgent: (id, agent) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE agents SET agent_number = ?, agent_name = ?, city = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(sql, [agent.agent_number, agent.agent_name, agent.city, agent.phone, agent.email, id], function(err) {
        if (err) reject(err);
        else resolve({ id, ...agent });
      });
    });
  },

  deleteAgent: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM agents WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }
};

// Fonctions pour les objectifs
const objectiveFunctions = {
  createObjective: (objective) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO objectives (agent_id, objective_type, period_start, period_end, daily_visits_boutique, daily_visits_superette, daily_visits_kiosque, daily_visits_tablier, daily_visits_pushcart, weekly_sales_premium_16g) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [objective.agent_id, objective.objective_type || 'commando', objective.period_start, objective.period_end, objective.daily_visits_boutique, objective.daily_visits_superette, objective.daily_visits_kiosque, objective.daily_visits_tablier, objective.daily_visits_pushcart, objective.weekly_sales_premium_16g], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...objective });
      });
    });
  },

  getAgentObjectives: (agentId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM objectives WHERE agent_id = ? ORDER BY period_start DESC', [agentId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Fonctions pour les performances Commando
const commandoFunctions = {
  createCommandoPerformance: (performance) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO commando_performances (agent_id, report_date, city, visits_boutique, visits_superette, visits_kiosque, visits_tablier, visits_pushcart, sales_premium_16g, sales_premium_360g, sales_excellence_900g, sales_avoine_50g, sales_avoine_400g, comments, impressions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [
        performance.agent_id, 
        performance.report_date, 
        performance.city, 
        performance.visits_boutique || 0, 
        performance.visits_superette || 0, 
        performance.visits_kiosque || 0, 
        performance.visits_tablier || 0, 
        performance.visits_pushcart || 0, 
        performance.sales_premium_16g || 0, 
        performance.sales_premium_360g || 0, 
        performance.sales_excellence_900g || 0, 
        performance.sales_avoine_50g || 0, 
        performance.sales_avoine_400g || 0, 
        performance.comments, 
        performance.impressions
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...performance });
      });
    });
  },

  getCommandoPerformances: (agentId = null, dateFrom = null, dateTo = null) => {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT cp.*, a.agent_name, a.agent_number FROM commando_performances cp JOIN agents a ON cp.agent_id = a.id';
      const params = [];
      
      if (agentId) {
        sql += ' WHERE cp.agent_id = ?';
        params.push(agentId);
      }
      
      if (dateFrom) {
        sql += agentId ? ' AND cp.report_date >= ?' : ' WHERE cp.report_date >= ?';
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += (agentId || dateFrom) ? ' AND cp.report_date <= ?' : ' WHERE cp.report_date <= ?';
        params.push(dateTo);
      }
      
      sql += ' ORDER BY cp.report_date DESC, cp.city';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getCommandoPerformanceById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM commando_performances WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updateCommandoPerformance: (id, performance) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE commando_performances SET city = ?, visits_boutique = ?, visits_superette = ?, visits_kiosque = ?, visits_tablier = ?, visits_pushcart = ?, sales_premium_16g = ?, sales_premium_360g = ?, sales_excellence_900g = ?, sales_avoine_50g = ?, sales_avoine_400g = ?, comments = ?, impressions = ? WHERE id = ?`;
      db.run(sql, [
        performance.city, 
        performance.visits_boutique || 0, 
        performance.visits_superette || 0, 
        performance.visits_kiosque || 0, 
        performance.visits_tablier || 0, 
        performance.visits_pushcart || 0, 
        performance.sales_premium_16g || 0, 
        performance.sales_premium_360g || 0, 
        performance.sales_excellence_900g || 0, 
        performance.sales_avoine_50g || 0, 
        performance.sales_avoine_400g || 0, 
        performance.comments, 
        performance.impressions, 
        id
      ], function(err) {
        if (err) reject(err);
        else resolve({ id, ...performance });
      });
    });
  },

  deleteCommandoPerformance: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM commando_performances WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }
};

// Fonctions pour les performances Grossiste
const grossisteFunctions = {
  createGrossistePerformance: (performance) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO grossiste_performances (agent_id, report_date, city, grossiste_name, personnes_approchees, client_acheteur, realisation_carton, gratuit_chapelet_sachet, taux_realisation, objectif_vente_carton, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [
        performance.agent_id, 
        performance.report_date, 
        performance.city, 
        performance.grossiste_name, 
        performance.personnes_approchees || 0, 
        performance.client_acheteur || '', 
        performance.realisation_carton || 0, 
        performance.gratuit_chapelet_sachet || 0, 
        performance.taux_realisation || 0, 
        performance.objectif_vente_carton || 0, 
        performance.comments
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...performance });
      });
    });
  },

  getGrossistePerformances: (agentId = null, dateFrom = null, dateTo = null) => {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT gp.*, a.agent_name, a.agent_number FROM grossiste_performances gp JOIN agents a ON gp.agent_id = a.id';
      const params = [];
      
      if (agentId) {
        sql += ' WHERE gp.agent_id = ?';
        params.push(agentId);
      }
      
      if (dateFrom) {
        sql += agentId ? ' AND gp.report_date >= ?' : ' WHERE gp.report_date >= ?';
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += (agentId || dateFrom) ? ' AND gp.report_date <= ?' : ' WHERE gp.report_date <= ?';
        params.push(dateTo);
      }
      
      sql += ' ORDER BY gp.report_date DESC, gp.grossiste_name';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getGrossistePerformanceById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM grossiste_performances WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updateGrossistePerformance: (id, performance) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE grossiste_performances SET city = ?, grossiste_name = ?, personnes_approchees = ?, client_acheteur = ?, realisation_carton = ?, gratuit_chapelet_sachet = ?, taux_realisation = ?, objectif_vente_carton = ?, comments = ? WHERE id = ?`;
      db.run(sql, [
        performance.city, 
        performance.grossiste_name, 
        performance.personnes_approchees || 0, 
        performance.client_acheteur || '', 
        performance.realisation_carton || 0, 
        performance.gratuit_chapelet_sachet || 0, 
        performance.taux_realisation || 0, 
        performance.objectif_vente_carton || 0, 
        performance.comments, 
        id
      ], function(err) {
        if (err) reject(err);
        else resolve({ id, ...performance });
      });
    });
  },

  deleteGrossistePerformance: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM grossiste_performances WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }
};

// Fonctions pour les imports
const importFunctions = {
  createImportRecord: (record) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO import_records (file_name, import_type, total_rows, valid_rows, invalid_rows, status, error_log) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [
        record.file_name, 
        record.import_type || 'commando', 
        record.total_rows || 0, 
        record.valid_rows || 0, 
        record.invalid_rows || 0, 
        record.status || 'pending', 
        record.error_log
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...record });
      });
    });
  },

  getImportRecords: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM import_records ORDER BY imported_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Exporter toutes les fonctions
module.exports = {
  agents: agentFunctions,
  objectives: objectiveFunctions,
  commando: commandoFunctions,
  grossiste: grossisteFunctions,
  imports: importFunctions,
  
  // Fonctions utilitaires
  getStats: () => {
    return new Promise((resolve, reject) => {
      Promise.all([
        new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM agents', (err, row) => err ? rej(err) : res(row.count))),
        new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM commando_performances', (err, row) => err ? rej(err) : res(row.count))),
        new Promise((res, rej) => db.get('SELECT COUNT(*) as count FROM grossiste_performances', (err, row) => err ? rej(err) : res(row.count)))
      ]).then(([agents, commando, grossiste]) => {
        resolve({ agents, commando, grossiste, total: commando + grossiste });
      }).catch(reject);
    });
  }
};
