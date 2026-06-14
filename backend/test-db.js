const database = require('./src/database/database');

setTimeout(() => {
  console.log('Test de la base de données...');
  database.getStatistics().then(stats => {
    console.log('Statistiques:', stats);
    process.exit(0);
  }).catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
}, 1000);