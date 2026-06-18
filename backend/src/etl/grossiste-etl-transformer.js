const xlsx = require('xlsx');

class GrossisteETLTransformer {
  
  /**
   * Transforme le buffer Excel en tableau d'objets pour la BDD
   * @param {Buffer} buffer - Le fichier Excel en mémoire
   * @param {Object} options - Contient notamment l'agentId
   */
  transform(buffer, options = {}) {
    const agentId = options.agentId;
    if (!agentId) {
      throw new Error("Impossible de transformer : agentId manquant.");
    }

    // Lecture du fichier avec conversion automatique des dates Excel
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    
    // On cherche 'Feuil1', sinon on prend la première feuille disponible
    const sheetName = workbook.SheetNames.includes('Feuil1') ? 'Feuil1' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Conversion en tableau 2D (lignes et colonnes)
    const df = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    // Coordonnées exactes issues de votre script Python
    const positions_dates = [2, 29, 56, 83, 110, 137, 164];
    const products = [
        { name: "16G", category: "Lait", offset: 0, gratuit_offset: 16 },
        { name: "360G", category: "Lait", offset: 1, gratuit_offset: null },
        { name: "900G", category: "Lait", offset: 2, gratuit_offset: 17 },
        { name: "25KG Excell", category: "Lait", offset: 3, gratuit_offset: null },
        { name: "25KG Super", category: "Lait", offset: 4, gratuit_offset: null },
        { name: "50G", category: "Flocon d'avoine", offset: 5, gratuit_offset: 18 },
        { name: "400G", category: "Flocon d'avoine", offset: 6, gratuit_offset: null }
    ];
    
    const transformedData = [];

    // Boucle sur les données (à partir de la ligne 8 Excel = index 7)
    for (let rowIdx = 7; rowIdx < df.length; rowIdx++) {
        const row = df[rowIdx];
        if (!row) continue;

        const ville = row[0];
        const grossiste = row[1];
        
        // Ignorer les lignes vides ou "TOTAL"
        if (!ville || String(ville).trim().toUpperCase() === "TOTAL") {
            continue;
        }

        // Pour chaque bloc de date
        for (const startCol of positions_dates) {
            // Lecture dynamique de la date à la ligne 4 (index 3)
            let dateObj = df[3] ? df[3][startCol] : null;
            if (!dateObj) continue;

            // Formatage de la date pour PostgreSQL (YYYY-MM-DD)
            if (dateObj instanceof Date) {
                dateObj = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000))
                            .toISOString().split('T')[0];
            } else {
                continue; // Si la date n'est pas valide, on ignore ce bloc
            }

            const visits = parseFloat(row[startCol + 7]) || 0;
            const client = parseFloat(row[startCol + 8]) || 0;
            
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                
                const objVal = parseFloat(String(row[startCol + product.offset] || "0").replace(',', '.')) || 0;
                const realVal = parseFloat(String(row[startCol + 9 + product.offset] || "0").replace(',', '.')) || 0;
                
                let freebies = 0;
                if (product.gratuit_offset !== null) {
                    freebies = parseFloat(String(row[startCol + product.gratuit_offset] || "0").replace(',', '.')) || 0;
                }
                
                // Règle métier : visites/clients comptés que sur le premier produit (16G)
                const client_touche = i === 0 ? client : 0;
                const visite_final = i === 0 ? visits : 0;
                const rate = objVal > 0 ? (realVal / objVal * 100) : 0;
                
                // On n'ajoute la ligne que s'il s'est passé quelque chose (visite ou objectif ou vente)
                if (visite_final > 0 || objVal > 0 || realVal > 0 || freebies > 0) {
                    transformedData.push({
                        agent_id: agentId,
                        report_date: dateObj,
                        city: ville,
                        grossiste_name: grossiste,
                        personnes_approchees: Math.round(visite_final),
                        client_acheteur: String(client_touche),
                        realisation_carton: realVal,
                        gratuit_chapelet_sachet: freebies,
                        taux_realisation: parseFloat(rate.toFixed(2)),
                        objectif_vente_carton: objVal,
                        comments: `Produit: ${product.name} (${product.category})`
                    });
                }
            }
        }
    }
    
    return transformedData;
  }
}

module.exports = GrossisteETLTransformer;