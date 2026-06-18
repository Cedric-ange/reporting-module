const { Pool } = require('pg');

// Initialisation unique et sécurisée du Pool avec gestion SSL pour le Pooler Supabase
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // <-- Requis pour valider la connexion chiffrée sur le port 6543
  }
});

// Écouteur pour capturer et logger proprement les erreurs de connexion inattendues
db.on('error', (err) => {
  console.error('❌ Erreur inattendue sur un client PostgreSQL en tâche de fond :', err.message);
});

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
    const sql = `UPDATE agents SET agent_number = $1, agent_name = $2, city = $3, phone = $4, email = $5, agent_type = $6 WHERE id = $7 RETURNING *`;
    const res = await db.query(sql, [agent.agent_number, agent.agent_name, agent.city, agent.phone, agent.email, agent.agent_type, id]);
    return res.rows[0];
  },

  deleteAgent: async (id) => {
    await db.query('DELETE FROM agents WHERE id = $1', [id]);
    return true;
  }
};

// Fonctions pour les objectifs
const objectiveFunctions = {
  getAgentObjectives: async (agentId) => {
    const res = await db.query('SELECT * FROM agent_objectives WHERE agent_id = $1 ORDER BY month DESC', [agentId]);
    return res.rows;
  },

  getActiveObjectivesForAgent: async (agentId) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const res = await db.query('SELECT * FROM agent_objectives WHERE agent_id = $1 AND month = $2', [agentId, currentMonth]);
    return res.rows;
  },

  createObjective: async (obj) => {
    const sql = `INSERT INTO agent_objectives (agent_id, month, target_visits, target_sales_cartons, product_category) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const res = await db.query(sql, [obj.agent_id, obj.month, obj.target_visits, obj.target_sales_cartons, obj.product_category]);
    return res.rows[0];
  }
};

// Fonctions pour les performances Commando
const commandoFunctions = {
  getCommandoPerformances: async (agentId, dateFrom, dateTo) => {
    let sql = 'SELECT cp.*, a.agent_name, a.agent_number FROM commando_performances cp JOIN agents a ON cp.agent_id = a.id WHERE 1=1';
    const params = [];
    
    if (agentId) {
      params.push(agentId);
      sql += ` AND cp.agent_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND cp.report_date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND cp.report_date <= $${params.length}`;
    }
    
    sql += ' ORDER BY cp.report_date DESC';
    const res = await db.query(sql, params);
    return res.rows;
  },

  createCommandoPerformance: async (perf) => {
    const sql = `INSERT INTO commando_performances 
      (agent_id, report_date, city, visits_boutique, visits_superette, visits_kiosque, visits_tablier, visits_pushcart, 
       sales_premium_16g, sales_premium_360g, sales_excellence_900g, sales_avoine_50g, sales_avoine_400g, comments, impressions) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;
    
    const res = await db.query(sql, [
      perf.agent_id, perf.report_date, perf.city, perf.visits_boutique || 0, perf.visits_superette || 0, 
      perf.visits_kiosque || 0, perf.visits_tablier || 0, perf.visits_pushcart || 0,
      perf.sales_premium_16g || 0, perf.sales_premium_360g || 0, perf.sales_excellence_900g || 0, 
      perf.sales_avoine_50g || 0, perf.sales_avoine_400g || 0, perf.comments || '', perf.impressions || ''
    ]);
    return res.rows[0];
  },

  updateCommandoPerformance: async (id, perf) => {
    const sql = `UPDATE commando_performances SET 
      report_date = $1, city = $2, visits_boutique = $3, visits_superette = $4, visits_kiosque = $5, 
      visits_tablier = $6, visits_pushcart = $7, sales_premium_16g = $8, sales_premium_360g = $9, 
      sales_excellence_900g = $10, sales_avoine_50g = $11, sales_avoine_400g = $12, comments = $13, impressions = $14 
      WHERE id = $15 RETURNING *`;
      
    const res = await db.query(sql, [
      perf.report_date, perf.city, perf.visits_boutique, perf.visits_superette, perf.visits_kiosque,
      perf.visits_tablier, perf.visits_pushcart, perf.sales_premium_16g, perf.sales_premium_360g,
      perf.sales_excellence_900g, perf.sales_avoine_50g, perf.sales_avoine_400g, perf.comments, perf.impressions, id
    ]);
    return res.rows[0];
  },

  deleteCommandoPerformance: async (id) => {
    await db.query('DELETE FROM commando_performances WHERE id = $1', [id]);
    return true;
  }
};

// Fonctions pour les performances Grossiste
const grossisteFunctions = {
  getGrossistePerformances: async (agentId, dateFrom, dateTo) => {
    let sql = 'SELECT * FROM grossiste_performances WHERE 1=1';
    const params = [];
    
    if (agentId) {
      params.push(agentId);
      sql += ` AND agent_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND date_vente >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND date_vente <= $${params.length}`;
    }
    
    sql += ' ORDER BY date_vente DESC';
    const res = await db.query(sql, params);
    return res.rows;
  },

  createGrossistePerformance: async (perf) => {
    const sql = `INSERT INTO grossiste_performances 
      (agent_id, date_vente, ville, grossiste, categorie_produit, format_produit, objectif_carton, realisation_carton, taux_realisation, gratuite, affiche, personne_approchee, personne_touche, fichier_source) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
      
    const res = await db.query(sql, [
      perf.agent_id || null, perf.date_vente, perf.ville, perf.grossiste, perf.categorie_produit, perf.format_produit,
      perf.objectif_carton || 0, perf.realisation_carton || 0, perf.taux_realisation || 0, perf.gratuite || 0,
      perf.affiche || 0, perf.personne_approchee || 0, perf.personne_touche || 0, perf.fichier_source || 'Manuel'
    ]);
    return res.rows[0];
  },

  updateGrossistePerformance: async (id, perf) => {
    const sql = `UPDATE grossiste_performances SET 
      date_vente = $1, ville = $2, grossiste = $3, categorie_produit = $4, format_produit = $5, 
      objectif_carton = $6, realisation_carton = $7, taux_realisation = $8, gratuite = $9, 
      affiche = $10, personne_approchee = $11, personne_touche = $12 
      WHERE id = $13 RETURNING *`;
      
    const res = await db.query(sql, [
      perf.date_vente, perf.ville, perf.grossiste, perf.categorie_produit, perf.format_produit,
      perf.objectif_carton, perf.realisation_carton, perf.taux_realisation, perf.gratuite,
      perf.affiche, perf.personne_approchee, perf.personne_touche, id
    ]);
    return res.rows[0];
  },

  deleteGrossistePerformance: async (id) => {
    await db.query('DELETE FROM grossiste_performances WHERE id = $1', [id]);
    return true;
  }
};

// Fonctions pour la Promo Pâque
const promoPaqueFunctions = {
  getPromoPaquePerformances: async (enseigne, dateFrom, dateTo) => {
    let sql = 'SELECT * FROM promo_paque_performances WHERE 1=1';
    const params = [];
    
    if (enseigne) {
      params.push(enseigne);
      sql += ` AND enseigne = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      sql += ` AND report_date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      sql += ` AND report_date <= $${params.length}`;
    }
    
    sql += ' ORDER BY report_date DESC';
    const res = await db.query(sql, params);
    return res.rows;
  },

  createPromoPaquePerformance: async (perf) => {
    const sql = `INSERT INTO promo_paque_performances 
      (report_date, enseigne, pdv, contacts_objectif, contacts_realise, acheteurs_objectif, acheteurs_realise, 
       real_premium_16g, real_premium_360g, real_excellence_900g, real_avoine_50g, real_avoine_400g, real_3en1_cafe, 
       gratuite_premium_16g, gratuite_avoine, gratuite_3en1, goodies1, goodies2, goodies3, goodies4, comments) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`;
      
    const res = await db.query(sql, [
      perf.report_date, perf.enseigne, perf.pdv, perf.contacts_objectif || 0, perf.contacts_realise || 0,
      perf.acheteurs_objectif || 0, perf.acheteurs_realise || 0, perf.real_premium_16g || 0, perf.real_premium_360g || 0,
      perf.real_excellence_900g || 0, perf.real_avoine_50g || 0, perf.real_avoine_400g || 0, perf.real_3en1_cafe || 0,
      perf.gratuite_premium_16g || 0, perf.gratuite_avoine || 0, perf.gratuite_3en1 || 0, perf.goodies1 || 0,
      perf.goodies2 || 0, perf.goodies3 || 0, perf.goodies4 || 0, perf.comments || ''
    ]);
    return res.rows[0];
  },

  updatePromoPaquePerformance: async (id, perf) => {
    const sql = `UPDATE promo_paque_performances SET 
      report_date = $1, enseigne = $2, pdv = $3, contacts_objectif = $4, contacts_realise = $5, 
      acheteurs_objectif = $6, acheteurs_realise = $7, real_premium_16g = $8, real_premium_360g = $9, 
      real_excellence_900g = $10, real_avoine_50g = $11, real_avoine_400g = $12, real_3en1_cafe = $13, 
      gratuite_premium_16g = $14, gratuite_avoine = $15, gratuite_3en1 = $16, goodies1 = $17, 
      goodies2 = $18, goodies3 = $19, goodies4 = $20, comments = $21 WHERE id = $22 RETURNING *`;
      
    const res = await db.query(sql, [
      perf.report_date, perf.enseigne, perf.pdv, perf.contacts_objectif, perf.contacts_realise,
      perf.acheteurs_objectif, perf.acheteurs_realise, perf.real_premium_16g, perf.real_premium_360g,
      perf.real_excellence_900g, perf.real_avoine_50g, perf.real_avoine_400g, perf.real_3en1_cafe,
      perf.gratuite_premium_16g, perf.gratuite_avoine, perf.gratuite_3en1, perf.goodies1,
      perf.goodies2, perf.goodies3, perf.goodies4, perf.comments, id
    ]);
    return res.rows[0];
  },

  deletePromoPaquePerformance: async (id) => {
    await db.query('DELETE FROM promo_paque_performances WHERE id = $1', [id]);
    return true;
  }
};

// Fonctions pour l'historique d'importation
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

// Exporter toutes les fonctions et l'instance du pool
module.exports = {
  db, // Exportation optionnelle pour requêtes directes
  agents: agentFunctions,
  objectives: objectiveFunctions,
  commando: commandoFunctions,
  grossiste: grossisteFunctions,
  promoPaque: promoPaqueFunctions,
  imports: importFunctions,
  
  getStats: async () => {
    const [agentsRes, commandoRes, grossisteRes, promoPaqueRes] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM agents'),
      db.query('SELECT COUNT(*) as count FROM commando_performances'),
      db.query('SELECT COUNT(*) as count FROM grossiste_performances'),
      db.query('SELECT COUNT(*) as count FROM promo_paque_performances')
    ]);

    return {
      agents: parseInt(agentsRes.rows[0].count) || 0,
      commando: parseInt(commandoRes.rows[0].count) || 0,
      grossiste: parseInt(grossisteRes.rows[0].count) || 0,
      promoPaque: parseInt(promoPaqueRes.rows[0].count) || 0,
      total: (parseInt(commandoRes.rows[0].count) || 0) + (parseInt(grossisteRes.rows[0].count) || 0)
    };
  }
};