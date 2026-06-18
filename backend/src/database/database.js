const { Pool } = require('pg');

// Initialisation de la connexion à PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Indispensable pour Vercel/Supabase
  }
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à Supabase :', err.message);
  } else {
    console.log('✅ Connecté avec succès à Supabase PostgreSQL');
    release();
  }
});

// On exporte explicitement la fonction query pour que database-functions.js puisse l'utiliser
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};