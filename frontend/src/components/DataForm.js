import React, { useState } from 'react';
import './DataForm.css';

function DataForm({ onSave }) {
  const [formData, setFormData] = useState({
    // Informations agent (selon structure Excel exacte)
    agentNumber: '',
    agentName: '',
    city: '',
    
    // OBJECTIFS JOURNALIERS - Visites par type de PDV
    visitsBoutique: 0,
    visitsSuperette: 0,
    visitsKiosque: 0,
    visitsTablier: 0,
    visitsPushcart: 0,
    
    // OBJECTIFS JOURNALIERS - Référencement par type de PDV
    refBoutique: 0,
    refSuperette: 0,
    refKiosque: 0,
    refTablier: 0,
    refPushcart: 0,
    
    // OBJECTIFS JOURNALIERS - Pose de matériel de visibilité
    posterBiblosPremium: 0,        // Affiche Biblos Lait Prémium 16g & 360g
    posterBiblosExcellence: 0,     // Affiche Biblos Lait Excellence
    posterBiblosAvoine: 0,         // Affiche Biblos Flocons d' Avoine
    hanger: 0,                     // Hanger
    wobbler: 0,                    // Wobbler
    
    // OBJECTIFS JOURNALIERS - Vente en cartons
    salesPremium16g: 0,           // Biblos Lait Premium 16g
    salesPremium360g: 0,          // Biblos Lait Premium 360g
    salesExcellence900g: 0,       // Biblos Lait Excellence 900g
    salesAvoine50g: 0,             // Biblos Flocon d'avoine 50g
    salesAvoine400g: 0,            // Biblos Flocon d'avoine 400g
    
    // REALISATIONS - Visites par type de PDV
    realVisitsBoutique: 0,
    realVisitsSuperette: 0,
    realVisitsKiosque: 0,
    realVisitsTablier: 0,
    realVisitsPushcart: 0,
    
    // REALISATIONS - Présence produits antérieure
    presencePremium16g: 0,
    presencePremium360g: 0,
    presenceExcellence900g: 0,
    presenceAvoine50g: 0,
    presenceAvoine400g: 0,
    
    // REALISATIONS - Référencement par type de PDV
    realRefBoutique: 0,
    realRefSuperette: 0,
    realRefKiosque: 0,
    realRefTablier: 0,
    realRefPushcart: 0,
    
    // REALISATIONS - Nouveau Référencement par SKU
    newRefPremium16g: 0,
    newRefPremium360g: 0,
    newRefExcellence900g: 0,
    newRefAvoine50g: 0,
    newRefAvoine400g: 0,
    
    // REALISATIONS - Vente en cartons
    realSalesPremium16g: 0,
    realSalesPremium360g: 0,
    realSalesExcellence900g: 0,
    realSalesAvoine50g: 0,
    realSalesAvoine400g: 0,
    
    // REALISATIONS - Pose de matériel de visibilité
    realPosterPremium: 0,         // Affiche Biblos Lait Prémium 16g & 360g
    realPosterExcellence: 0,      // Affiche Biblos Lait Excellence
    realPosterAvoine: 0,          // Affiche Biblos Flocons d' Avoine
    realHanger: 0,                // Hanger
    realWobbler: 0,               // Wobbler
    
    // REALISATIONS - Gratuits offerts en sachet
    freePremium16g: 0,             // Biblos Lait Premium 16g
    freeExcellence900g: 0,        // Biblos Lait Excellence 900g
    freeAvoine50g: 0,             // Biblos Flocon d'avoine 50g
    
    // Commentaires
    comments: '',
    impressions: ''               // Impressions des PDV et des clients
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const calculateTotals = () => {
    const totalVisits = formData.realVisitsBoutique + formData.realVisitsSuperette + 
                       formData.realVisitsKiosque + formData.realVisitsTablier + 
                       formData.realVisitsPushcart;
    
    const totalSales = formData.realSalesPremium16g + formData.realSalesPremium360g + 
                      formData.realSalesExcellence900g + formData.realSalesAvoine50g + 
                      formData.realSalesAvoine400g;
    
    const totalReferences = formData.realRefBoutique + formData.realRefSuperette + 
                           formData.realRefKiosque + formData.realRefTablier + 
                           formData.realRefPushcart;
    
    return { totalVisits, totalSales, totalReferences };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totals = calculateTotals();
    onSave({
      ...formData,
      ...totals
    });
    // Reset form
    setFormData({
      agentNumber: '',
      agentName: '',
      city: '',
      visitsBoutique: 0,
      visitsSuperette: 0,
      visitsKiosque: 0,
      visitsTablier: 0,
      visitsPushcart: 0,
      refBoutique: 0,
      refSuperette: 0,
      refKiosque: 0,
      refTablier: 0,
      refPushcart: 0,
      posterBiblosPremium: 0,
      posterBiblosExcellence: 0,
      posterBiblosAvoine: 0,
      hanger: 0,
      wobbler: 0,
      salesPremium16g: 0,
      salesPremium360g: 0,
      salesExcellence900g: 0,
      salesAvoine50g: 0,
      salesAvoine400g: 0,
      realVisitsBoutique: 0,
      realVisitsSuperette: 0,
      realVisitsKiosque: 0,
      realVisitsTablier: 0,
      realVisitsPushcart: 0,
      presencePremium16g: 0,
      presencePremium360g: 0,
      presenceExcellence900g: 0,
      presenceAvoine50g: 0,
      presenceAvoine400g: 0,
      newRefPremium16g: 0,
      newRefPremium360g: 0,
      newRefExcellence900g: 0,
      newRefAvoine50g: 0,
      newRefAvoine400g: 0,
      realRefBoutique: 0,
      realRefSuperette: 0,
      realRefKiosque: 0,
      realRefTablier: 0,
      realRefPushcart: 0,
      realSalesPremium16g: 0,
      realSalesPremium360g: 0,
      realSalesExcellence900g: 0,
      realSalesAvoine50g: 0,
      realSalesAvoine400g: 0,
      realPosterPremium: 0,
      realPosterExcellence: 0,
      realPosterAvoine: 0,
      realHanger: 0,
      realWobbler: 0,
      freePremium16g: 0,
      freeExcellence900g: 0,
      freeAvoine50g: 0,
      comments: '',
      impressions: ''
    });
  };

  return (
    <div className="data-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Informations Agent</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">N° Agent</label>
              <input
                type="text"
                name="agentNumber"
                value={formData.agentNumber}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="form-col">
              <label className="form-label">Nom Agent</label>
              <input
                type="text"
                name="agentName"
                value={formData.agentName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="form-col">
              <label className="form-label">Ville</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Visites par Type de PDV (Objectifs)</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Boutique</label>
              <input
                type="number"
                name="visitsBoutique"
                value={formData.visitsBoutique}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Superette</label>
              <input
                type="number"
                name="visitsSuperette"
                value={formData.visitsSuperette}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Kiosque</label>
              <input
                type="number"
                name="visitsKiosque"
                value={formData.visitsKiosque}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Tablier</label>
              <input
                type="number"
                name="visitsTablier"
                value={formData.visitsTablier}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Pushcart</label>
              <input
                type="number"
                name="visitsPushcart"
                value={formData.visitsPushcart}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Référencement par Type de PDV (Objectifs)</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Boutique</label>
              <input
                type="number"
                name="refBoutique"
                value={formData.refBoutique}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Superette</label>
              <input
                type="number"
                name="refSuperette"
                value={formData.refSuperette}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Kiosque</label>
              <input
                type="number"
                name="refKiosque"
                value={formData.refKiosque}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Tablier</label>
              <input
                type="number"
                name="refTablier"
                value={formData.refTablier}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Pushcart</label>
              <input
                type="number"
                name="refPushcart"
                value={formData.refPushcart}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Matériel de Visibilité (Objectifs)</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Affiche Biblos Premium</label>
              <input
                type="number"
                name="posterBiblosPremium"
                value={formData.posterBiblosPremium}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Affiche Biblos Excellence</label>
              <input
                type="number"
                name="posterBiblosExcellence"
                value={formData.posterBiblosExcellence}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Affiche Biblos Avoine</label>
              <input
                type="number"
                name="posterBiblosAvoine"
                value={formData.posterBiblosAvoine}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Hanger</label>
              <input
                type="number"
                name="hanger"
                value={formData.hanger}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Wobbler</label>
              <input
                type="number"
                name="wobbler"
                value={formData.wobbler}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Réalisations - Visites par Type de PDV</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Boutique</label>
              <input
                type="number"
                name="realVisitsBoutique"
                value={formData.realVisitsBoutique}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Superette</label>
              <input
                type="number"
                name="realVisitsSuperette"
                value={formData.realVisitsSuperette}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Kiosque</label>
              <input
                type="number"
                name="realVisitsKiosque"
                value={formData.realVisitsKiosque}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Tablier</label>
              <input
                type="number"
                name="realVisitsTablier"
                value={formData.realVisitsTablier}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Pushcart</label>
              <input
                type="number"
                name="realVisitsPushcart"
                value={formData.realVisitsPushcart}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Ventes par Produit</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Biblos Lait Premium 16g</label>
              <input
                type="number"
                name="realSalesPremium16g"
                value={formData.realSalesPremium16g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Biblos Lait Premium 360g</label>
              <input
                type="number"
                name="realSalesPremium360g"
                value={formData.realSalesPremium360g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Biblos Lait Excellence 900g</label>
              <input
                type="number"
                name="realSalesExcellence900g"
                value={formData.realSalesExcellence900g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Biblos Flocon d'avoine 50g</label>
              <input
                type="number"
                name="realSalesAvoine50g"
                value={formData.realSalesAvoine50g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Biblos Flocon d'avoine 400g</label>
              <input
                type="number"
                name="realSalesAvoine400g"
                value={formData.realSalesAvoine400g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Présence Produits Antérieure</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Premium 16g</label>
              <input
                type="number"
                name="presencePremium16g"
                value={formData.presencePremium16g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Premium 360g</label>
              <input
                type="number"
                name="presencePremium360g"
                value={formData.presencePremium360g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Excellence 900g</label>
              <input
                type="number"
                name="presenceExcellence900g"
                value={formData.presenceExcellence900g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Avoine 50g</label>
              <input
                type="number"
                name="presenceAvoine50g"
                value={formData.presenceAvoine50g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Avoine 400g</label>
              <input
                type="number"
                name="presenceAvoine400g"
                value={formData.presenceAvoine400g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Nouveau Référencement par SKU</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Premium 16g</label>
              <input
                type="number"
                name="newRefPremium16g"
                value={formData.newRefPremium16g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Premium 360g</label>
              <input
                type="number"
                name="newRefPremium360g"
                value={formData.newRefPremium360g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Excellence 900g</label>
              <input
                type="number"
                name="newRefExcellence900g"
                value={formData.newRefExcellence900g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Avoine 50g</label>
              <input
                type="number"
                name="newRefAvoine50g"
                value={formData.newRefAvoine50g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Avoine 400g</label>
              <input
                type="number"
                name="newRefAvoine400g"
                value={formData.newRefAvoine400g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Référencement Réalisé par Type de PDV</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Boutique</label>
              <input
                type="number"
                name="realRefBoutique"
                value={formData.realRefBoutique}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Superette</label>
              <input
                type="number"
                name="realRefSuperette"
                value={formData.realRefSuperette}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Kiosque</label>
              <input
                type="number"
                name="realRefKiosque"
                value={formData.realRefKiosque}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Tablier</label>
              <input
                type="number"
                name="realRefTablier"
                value={formData.realRefTablier}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Pushcart</label>
              <input
                type="number"
                name="realRefPushcart"
                value={formData.realRefPushcart}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Matériel de Visibilité Réalisé</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Affiche Premium</label>
              <input
                type="number"
                name="realPosterPremium"
                value={formData.realPosterPremium}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Affiche Excellence</label>
              <input
                type="number"
                name="realPosterExcellence"
                value={formData.realPosterExcellence}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Affiche Avoine</label>
              <input
                type="number"
                name="realPosterAvoine"
                value={formData.realPosterAvoine}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Hanger</label>
              <input
                type="number"
                name="realHanger"
                value={formData.realHanger}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Wobbler</label>
              <input
                type="number"
                name="realWobbler"
                value={formData.realWobbler}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Gratuits Offerts</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Premium 16g</label>
              <input
                type="number"
                name="freePremium16g"
                value={formData.freePremium16g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Excellence 900g</label>
              <input
                type="number"
                name="freeExcellence900g"
                value={formData.freeExcellence900g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Avoine 50g</label>
              <input
                type="number"
                name="freeAvoine50g"
                value={formData.freeAvoine50g}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Commentaires</h3>
          <div className="form-group">
            <label className="form-label">Commentaires</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Impressions des PDV et des clients</label>
            <textarea
              name="impressions"
              value={formData.impressions}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="button button-primary">
            Enregistrer le Rapport
          </button>
          <button 
            type="button" 
            className="button button-danger"
            onClick={() => window.history.back()}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default DataForm;
