const db = require('./database'); // Connexion PostgreSQL Supabase

// Fonctions pour les agents
const agentFunctions = {
  getAllAgents: async () => {
    const res = await db.query('SELECT * FROM agents ORDER BY agent_name');
    return res.rows;
  },

  getAgentById: async (id) => {
    const res = await db.query('SELECT * FROM agents WHERE id = $1', [id]);
    return res.rows[0];
  },

  getAgentByNumber: async (number) => {
    const res = await db.query('SELECT * FROM agents WHERE agent_number = $1', [number]);
    return res.rows[0];
  },

  createAgent: async (agent) => {
    const sql = `INSERT INTO agents (agent_number, agent_name, city, phone, email, agent_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const res = await db.query(sql, [agent.agent_number, agent.agent_name, agent.city, agent.phone, agent.email, agent.agent_type || 'commando']);
    return res.rows[0];
  },

  updateAgent: async (id, agent) => {
    const sql = `UPDATE agents SET agent_number = $1, agent_name = $2, city = $3, phone = $4, email = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`;
    const res = await db.query(sql, [agent.agent_number, agent.agent_name, agent.city, agent.phone, agent.email, id]);
    return res.rows[0];
  },

  deleteAgent: async (id) => {
    const res = await db.query('DELETE FROM agents WHERE id = $1', [id]);
    return { deleted: res.rowCount > 0 };
  }
};

// Fonctions pour les objectifs
const objectiveFunctions = {
  createObjective: async (objective) => {
    const sql = `INSERT INTO objectives (agent_id, objective_type, period_start, period_end, daily_visits_boutique, daily_visits_superette, daily_visits_kiosque, daily_visits_tablier, daily_visits_pushcart, weekly_sales_premium_16g) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
    const res = await db.query(sql, [objective.agent_id, objective.objective_type || 'commando', objective.period_start, objective.period_end, objective.daily_visits_boutique, objective.daily_visits_superette, objective.daily_visits_kiosque, objective.daily_visits_tablier, objective.daily_visits_pushcart, objective.weekly_sales_premium_16g]);
    return res.rows[0];
  },

  getAgentObjectives: async (agentId) => {
    const res = await db.query('SELECT * FROM objectives WHERE agent_id = $1 ORDER BY period_start DESC', [agentId]);
    return res.rows;
  }
};

// Fonctions pour les performances Commando
const commandoFunctions = {
  createCommandoPerformance: async (performance) => {
    const sql = `INSERT INTO commando_performances (agent_id, report_date, city, visits_boutique, visits_superette, visits_kiosque, visits_tablier, visits_pushcart, sales_premium_16g, sales_premium_360g, sales_excellence_900g, sales_avoine_50g, sales_avoine_400g, comments, impressions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;
    const res = await db.query(sql, [
      performance.agent_id, performance.report_date, performance.city, 
      performance.visits_boutique || 0, performance.visits_superette || 0, 
      performance.visits_kiosque || 0, performance.visits_tablier || 0, 
      performance.visits_pushcart || 0, performance.sales_premium_16g || 0, 
      performance.sales_premium_360g || 0, performance.sales_excellence_900g || 0, 
      performance.sales_avoine_50g || 0, performance.sales_avoine_400g || 0, 
      performance.comments, performance.impressions
    ]);
    return res.rows[0];
  },

  getCommandoPerformances: async (agentId = null, dateFrom = null, dateTo = null) => {
    let sql = 'SELECT cp.*, a.agent_name, a.agent_number FROM commando_performances cp JOIN agents a ON cp.agent_id = a.id WHERE 1=1';
    const params = [];
    let idx = 1;
    
    if (agentId) { sql += ` AND cp.agent_id = $${idx++}`; params.push(agentId); }
    if (dateFrom) { sql += ` AND cp.report_date >= $${idx++}`; params.push(dateFrom); }
    if (dateTo) { sql += ` AND cp.report_date <= $${idx++}`; params.push(dateTo); }
    
    sql += ' ORDER BY cp.report_date DESC, cp.city';
    const res = await db.query(sql, params);
    return res.rows;
  },

  getCommandoPerformanceById: async (id) => {
    const res = await db.query('SELECT * FROM commando_performances WHERE id = $1', [id]);
    return res.rows[0];
  },

  updateCommandoPerformance: async (id, performance) => {
    const sql = `UPDATE commando_performances SET city = $1, visits_boutique = $2, visits_superette = $3, visits_kiosque = $4, visits_tablier = $5, visits_pushcart = $6, sales_premium_16g = $7, sales_premium_360g = $8, sales_excellence_900g = $9, sales_avoine_50g = $10, sales_avoine_400g = $11, comments = $12, impressions = $13 WHERE id = $14 RETURNING *`;
    const res = await db.query(sql, [
      performance.city, performance.visits_boutique || 0, performance.visits_superette || 0, 
      performance.visits_kiosque || 0, performance.visits_tablier || 0, performance.visits_pushcart || 0, 
      performance.sales_premium_16g || 0, performance.sales_premium_360g || 0, performance.sales_excellence_900g || 0, 
      performance.sales_avoine_50g || 0, performance.sales_avoine_400g || 0, performance.comments, performance.impressions, id
    ]);
    return res.rows[0];
  },

  deleteCommandoPerformance: async (id) => {
    const res = await db.query('DELETE FROM commando_performances WHERE id = $1', [id]);
    return { deleted: res.rowCount > 0 };
  }
};

// Fonctions pour les performances Grossiste
const grossisteFunctions = {
  createGrossistePerformance: async (performance) => {
    const sql = `INSERT INTO grossiste_performances (agent_id, report_date, city, grossiste_name, personnes_approchees, client_acheteur, realisation_carton, gratuit_chapelet_sachet, taux_realisation, objectif_vente_carton, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
    const res = await db.query(sql, [
      performance.agent_id, performance.report_date, performance.city, performance.grossiste_name, 
      performance.personnes_approchees || 0, performance.client_acheteur || '', performance.realisation_carton || 0, 
      performance.gratuit_chapelet_sachet || 0, performance.taux_realisation || 0, performance.objectif_vente_carton || 0, performance.comments
    ]);
    return res.rows[0];
  },

  getGrossistePerformances: async (agentId = null, dateFrom = null, dateTo = null) => {
    let sql = 'SELECT gp.*, a.agent_name, a.agent_number FROM grossiste_performances gp JOIN agents a ON gp.agent_id = a.id WHERE 1=1';
    const params = [];
    let idx = 1;
    
    if (agentId) { sql += ` AND gp.agent_id = $${idx++}`; params.push(agentId); }
    if (dateFrom) { sql += ` AND gp.report_date >= $${idx++}`; params.push(dateFrom); }
    if (dateTo) { sql += ` AND gp.report_date <= $${idx++}`; params.push(dateTo); }
    
    sql += ' ORDER BY gp.report_date DESC, gp.grossiste_name';
    const res = await db.query(sql, params);
    return res.rows;
  },

  getGrossistePerformanceById: async (id) => {
    const res = await db.query('SELECT * FROM grossiste_performances WHERE id = $1', [id]);
    return res.rows[0];
  },

  updateGrossistePerformance: async (id, performance) => {
    const sql = `UPDATE grossiste_performances SET city = $1, grossiste_name = $2, personnes_approchees = $3, client_acheteur = $4, realisation_carton = $5, gratuit_chapelet_sachet = $6, taux_realisation = $7, objectif_vente_carton = $8, comments = $9 WHERE id = $10 RETURNING *`;
    const res = await db.query(sql, [
      performance.city, performance.grossiste_name, performance.personnes_approchees || 0, 
      performance.client_acheteur || '', performance.realisation_carton || 0, performance.gratuit_chapelet_sachet || 0, 
      performance.taux_realisation || 0, performance.objectif_vente_carton || 0, performance.comments, id
    ]);
    return res.rows[0];
  },

  deleteGrossistePerformance: async (id) => {
    const res = await db.query('DELETE FROM grossiste_performances WHERE id = $1', [id]);
    return { deleted: res.rowCount > 0 };
  }
};

// Fonctions pour les performances Promo Pâque
const promoPaqueFunctions = {
  createPromoPaquePerformance: async (performance) => {
    const sql = `INSERT INTO promo_paque_performances (report_date, enseigne, pdv, contacts_objectif, contacts_realise, acheteurs_objectif, acheteurs_realise, real_premium_16g, real_premium_360g, real_excellence_900g, real_avoine_50g, real_avoine_400g, real_3en1_cafe, gratuite_premium_16g, gratuite_avoine, gratuite_3en1, goodies1, goodies2, goodies3, goodies4, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`;
    const res = await db.query(sql, [
      performance.report_date, performance.enseigne, performance.pdv, performance.contacts_objectif || 0,
      performance.contacts_realise || 0, performance.acheteurs_objectif || 0, performance.acheteurs_realise || 0,
      performance.real_premium_16g || 0, performance.real_premium_360g || 0, performance.real_excellence_900g || 0,
      performance.real_avoine_50g || 0, performance.real_avoine_400g || 0, performance.real_3en1_cafe || 0,
      performance.gratuite_premium_16g || 0, performance.gratuite_avoine || 0, performance.gratuite_3en1 || 0,
      performance.goodies1 || 0, performance.goodies2 || 0, performance.goodies3 || 0, performance.goodies4 || 0, performance.comments
    ]);
    return res.rows[0];
  },

  getPromoPaquePerformances: async (enseigne = null, dateFrom = null, dateTo = null) => {
    let sql = 'SELECT * FROM promo_paque_performances WHERE 1=1';
    const params = [];
    let idx = 1;

    if (enseigne) { sql += ` AND enseigne = $${idx++}`; params.push(enseigne); }
    if (dateFrom) { sql += ` AND report_date >= $${idx++}`; params.push(dateFrom); }
    if (dateTo) { sql += ` AND report_date <= $${idx++}`; params.push(dateTo); }

    sql += ' ORDER BY report_date DESC, enseigne, pdv';
    const res = await db.query(sql, params);
    return res.rows;
  },

  getPromoPaquePerformanceById: async (id) => {
    const res = await db.query('SELECT * FROM promo_paque_performances WHERE id = $1', [id]);
    return res.rows[0];
  },

  updatePromoPaquePerformance: async (id, performance) => {
    const sql = `UPDATE promo_paque_performances SET report_date = $1, enseigne = $2, pdv = $3, contacts_objectif = $4, contacts_realise = $5, acheteurs_objectif = $6, acheteurs_realise = $7, real_premium_16g = $8, real_premium_360g = $9, real_excellence_900g = $10, real_avoine_50g = $11, real_avoine_400g = $12, real_3en1_cafe = $13, gratuite_premium_16g = $14, gratuite_avoine = $15, gratuite_3en1 = $16, goodies1 = $17, goodies2 = $18, goodies3 = $19, goodies4 = $20, comments = $21 WHERE id = $22 RETURNING *`;
    const res = await db.query(sql, [
      performance.report_date, performance.enseigne, performance.pdv, performance.contacts_objectif || 0,
      performance.contacts_realise || 0, performance.acheteurs_objectif || 0, performance.acheteurs_realise || 0,
      performance.real_premium_16g || 0, performance.real_premium_360g || 0, performance.real_excellence_900g || 0,
      performance.real_avoine_50g || 0, performance.real_avoine_400g || 0, performance.real_3en1_cafe || 0,
      performance.gratuite_premium_16g || 0, performance.gratuite_avoine || 0, performance.gratuite_3en1 || 0,
      performance.goodies1 || 0, performance.goodies2 || 0, performance.goodies3 || 0, performance.goodies4 || 0, performance.comments, id
    ]);
    return res.rows[0];
  },

  deletePromoPaquePerformance: async (id) => {
    const res = await db.query('DELETE FROM promo_paque_performances WHERE id = $1', [id]);
    return { deleted: res.rowCount > 0 };
  }
};

// Fonctions pour les imports
const importFunctions = {
  createImportRecord: async (record) => {
    const sql = `INSERT INTO imports (file_name, import_type, total_rows, valid_rows, invalid_rows, status, error_log) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const res = await db.query(sql, [
      record.file_name, record.import_type || 'commando', record.total_rows || 0, 
      record.valid_rows || 0, record.invalid_rows || 0, record.status || 'pending', record.error_log
    ]);
    return res.rows[0];
  },

  getImportRecords: async () => {
    const res = await db.query('SELECT * FROM imports ORDER BY created_at DESC');
    return res.rows;
  }
};

// Exporter toutes les fonctions
module.exports = {
  agents: agentFunctions,
  objectives: objectiveFunctions,
  commando: commandoFunctions,
  grossiste: grossisteFunctions,
  promoPaque: promoPaqueFunctions,
  imports: importFunctions,
  
  // Fonctions utilitaires
  getStats: async () => {
    const [agentsRes, commandoRes, grossisteRes, promoPaqueRes] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM agents'),
      db.query('SELECT COUNT(*) as count FROM commando_performances'),
      db.query('SELECT COUNT(*) as count FROM grossiste_performances'),
      db.query('SELECT COUNT(*) as count FROM promo_paque_performances')
    ]);

    const agents = parseInt(agentsRes.rows[0].count) || 0;
    const commando = parseInt(commandoRes.rows[0].count) || 0;
    const grossiste = parseInt(grossisteRes.rows[0].count) || 0;
    const promoPaque = parseInt(promoPaqueRes.rows[0].count) || 0;

    return { agents, commando, grossiste, promoPaque, total: commando + grossiste + promoPaque };
  }
};