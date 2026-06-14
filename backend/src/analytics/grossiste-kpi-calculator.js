// ==================== MODULE CALCULATEUR KPI GROSSISTE ====================

/**
 * Calculateur de KPIs avancés pour les données grossistes
 * Basé sur les métriques identifiées dans l'analyse ETL Python
 */
class GrossisteKPICalculator {
  
  constructor() {
    // Seuils d'alerte basés sur l'analyse ETL
    this.alertThresholds = {
      achievementRate: {
        warning: 100,      // En dessous de 100% = attention
        critical: 50       // En dessous de 50% = critique
      },
      visits: {
        minimum: 10,       // Minimum de visites attendues
        target: 20         // Objectif de visites
      },
      sales: {
        growth: 0.1        // 10% de croissance attendue
      }
    };
  }

  /**
   * Calculer tous les KPIs pour un ensemble de données grossistes
   * @param {Array} performances - Données de performances grossistes
   * @returns {Object} KPIs calculés avec alertes
   */
  calculateAllKPIs(performances) {
    if (!performances || performances.length === 0) {
      return { error: "Aucune donnée fournie" };
    }

    const kpis = {
      global: this._calculateGlobalKPIs(performances),
      byAgent: this._calculateKPIsByAgent(performances),
      byCity: this._calculateKPIsByCity(performances),
      byProduct: this._calculateKPIsByProduct(performances),
      byDate: this._calculateKPIsByDate(performances),
      trends: this._calculateTrends(performances),
      alerts: this._generateAlerts(performances)
    };

    return kpis;
  }

  /**
   * Calculer les KPIs globaux
   * @private
   */
  _calculateGlobalKPIs(performances) {
    const totalSales = performances.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const totalObjectives = performances.reduce((sum, p) => sum + (p.objective_carton || 0), 0);
    
    const totalVisits = performances.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
    
    const totalAffiches = performances.reduce((sum, p) => sum + (p.affiche || 0), 0);
    
    const totalGratuites = performances.reduce((sum, p) => sum + (p.gratuit_chapelet_sachet || 0), 0);
    
    const globalAchievementRate = totalObjectives > 0 ? (totalSales / totalObjectives) * 100 : 0;
    
    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalObjectives: Math.round(totalObjectives * 100) / 100,
      totalVisits: totalVisits,
      totalAffiches: totalAffiches,
      totalGratuites: Math.round(totalGratuites * 100) / 100,
      globalAchievementRate: Math.round(globalAchievementRate * 100) / 100,
      averageVisitsPerAgent: performances.length > 0 ? Math.round(totalVisits / performances.length) : 0,
      dataQuality: this._assessDataQuality(performances)
    };
  }

  /**
   * Calculer les KPIs par agent
   * @private
   */
  _calculateKPIsByAgent(performances) {
    const agentGroups = this._groupBy(performances, 'agent_id');
    
    const agentKPIs = {};
    
    for (const [agentId, agentPerfs] of Object.entries(agentGroups)) {
      const agentSales = agentPerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const agentObjectives = agentPerfs.reduce((sum, p) => sum + (p.objective_carton || 0), 0);
      
      const agentVisits = agentPerfs.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
      
      const agentAchievementRate = agentObjectives > 0 ? (agentSales / agentObjectives) * 100 : 0;
      
      agentKPIs[agentId] = {
        agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
        totalSales: Math.round(agentSales * 100) / 100,
        totalObjectives: Math.round(agentObjectives * 100) / 100,
        totalVisits: agentVisits,
        achievementRate: Math.round(agentAchievementRate * 100) / 100,
        performance: this._ratePerformance(agentAchievementRate),
        reportCount: agentPerfs.length
      };
    }
    
    return agentKPIs;
  }

  /**
   * Calculer les KPIs par ville
   * @private
   */
  _calculateKPIsByCity(performances) {
    const cityGroups = this._groupBy(performances, 'city');
    
    const cityKPIs = {};
    
    for (const [city, cityPerfs] of Object.entries(cityGroups)) {
      const citySales = cityPerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const cityVisits = cityPerfs.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
      
      const cityAgents = new Set(cityPerfs.map(p => p.agent_id)).size;
      
      cityKPIs[city] = {
        totalSales: Math.round(citySales * 100) / 100,
        totalVisits: cityVisits,
        agentCount: cityAgents,
        averageSalesPerAgent: cityAgents > 0 ? Math.round((citySales / cityAgents) * 100) / 100 : 0,
        averageVisitsPerAgent: cityAgents > 0 ? Math.round(cityVisits / cityAgents) : 0
      };
    }
    
    return cityKPIs;
  }

  /**
   * Calculer les KPIs par produit
   * @private
   */
  _calculateKPIsByProduct(performances) {
    const productMetrics = {
      'Lait Premium 16g': { sales: 0, objectives: 0 },
      'Lait Premium 360g': { sales: 0, objectives: 0 },
      'Lait Excellence 900g': { sales: 0, objectives: 0 },
      'Flocon d\'avoine 50g': { sales: 0, objectives: 0 },
      'Flocon d\'avoine 400g': { sales: 0, objectives: 0 }
    };
    
    for (const perf of performances) {
      productMetrics['Lait Premium 16g'].sales += perf.real_sales_premium_16g || 0;
      productMetrics['Lait Premium 360g'].sales += perf.real_sales_premium_360g || 0;
      productMetrics['Lait Excellence 900g'].sales += perf.real_sales_excellence_900g || 0;
      productMetrics['Flocon d\'avoine 50g'].sales += perf.real_sales_avoine_50g || 0;
      productMetrics['Flocon d\'avoine 400g'].sales += perf.real_sales_avoine_400g || 0;
    }
    
    const productKPIs = {};
    for (const [product, metrics] of Object.entries(productMetrics)) {
      const achievementRate = metrics.objectives > 0 ? (metrics.sales / metrics.objectives) * 100 : 0;
      
      productKPIs[product] = {
        totalSales: Math.round(metrics.sales * 100) / 100,
        totalObjectives: Math.round(metrics.objectives * 100) / 100,
        achievementRate: Math.round(achievementRate * 100) / 100,
        performance: this._ratePerformance(achievementRate),
        category: product.includes('Lait') ? 'Lait' : 'Flocon d\'avoine'
      };
    }
    
    return productKPIs;
  }

  /**
   * Calculer les KPIs par date
   * @private
   */
  _calculateKPIsByDate(performances) {
    const dateGroups = this._groupBy(performances, 'report_date');
    
    const dateKPIs = {};
    const sortedDates = Object.keys(dateGroups).sort();
    
    for (const date of sortedDates) {
      const datePerfs = dateGroups[date];
      
      const dateSales = datePerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const dateVisits = datePerfs.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
      
      dateKPIs[date] = {
        totalSales: Math.round(dateSales * 100) / 100,
        totalVisits: dateVisits,
        reportCount: datePerfs.length,
        averageSalesPerReport: datePerfs.length > 0 ? Math.round((dateSales / datePerfs.length) * 100) / 100 : 0
      };
    }
    
    return dateKPIs;
  }

  /**
   * Calculer les tendances
   * @private
   */
  _calculateTrends(performances) {
    const dateGroups = this._groupBy(performances, 'report_date');
    const sortedDates = Object.keys(dateGroups).sort();
    
    if (sortedDates.length < 2) {
      return { message: "Pas assez de données pour calculer les tendances" };
    }
    
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    
    const firstDaySales = dateGroups[firstDate].reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                       (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                       (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const lastDaySales = dateGroups[lastDate].reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                      (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                      (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const salesGrowth = firstDaySales > 0 ? ((lastDaySales - firstDaySales) / firstDaySales) * 100 : 0;
    
    return {
      period: `${firstDate} à ${lastDate}`,
      salesGrowth: Math.round(salesGrowth * 100) / 100,
      trend: salesGrowth > 0 ? 'croissance' : 'décroissance',
      firstDaySales: Math.round(firstDaySales * 100) / 100,
      lastDaySales: Math.round(lastDaySales * 100) / 100
    };
  }

  /**
   * Générer des alertes basées sur les KPIs
   * @private
   */
  _generateAlerts(performances) {
    const alerts = [];
    
    // Analyser les performances par agent
    const agentGroups = this._groupBy(performances, 'agent_id');
    
    for (const [agentId, agentPerfs] of Object.entries(agentGroups)) {
      const agentSales = agentPerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const agentObjectives = agentPerfs.reduce((sum, p) => sum + (p.objective_carton || 0), 0);
      
      const agentAchievementRate = agentObjectives > 0 ? (agentSales / agentObjectives) * 100 : 0;
      
      // Alertes sur le taux de réalisation
      if (agentAchievementRate < this.alertThresholds.achievementRate.critical) {
        alerts.push({
          type: 'critical',
          category: 'achievement',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Taux de réalisation critique: ${Math.round(agentAchievementRate)}%`,
          value: agentAchievementRate,
          threshold: this.alertThresholds.achievementRate.critical
        });
      } else if (agentAchievementRate < this.alertThresholds.achievementRate.warning) {
        alerts.push({
          type: 'warning',
          category: 'achievement',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Taux de réalisation faible: ${Math.round(agentAchievementRate)}%`,
          value: agentAchievementRate,
          threshold: this.alertThresholds.achievementRate.warning
        });
      }
      
      // Alertes sur les visites
      const agentVisits = agentPerfs.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
      const avgVisits = agentPerfs.length > 0 ? agentVisits / agentPerfs.length : 0;
      
      if (avgVisits < this.alertThresholds.visits.minimum) {
        alerts.push({
          type: 'warning',
          category: 'visits',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Moyenne de visites faible: ${Math.round(avgVisits)}/jour`,
          value: avgVisits,
          threshold: this.alertThresholds.visits.minimum
        });
      }
    }
    
    return alerts;
  }

  /**
   * Évaluer la qualité des données
   * @private
   */
  _assessDataQuality(performances) {
    let missingFields = 0;
    let zeroValues = 0;
    let totalFields = 0;
    
    for (const perf of performances) {
      const fieldsToCheck = ['real_sales_premium_16g', 'real_sales_premium_360g', 'real_sales_excellence_900g',
                             'real_sales_avoine_50g', 'real_sales_avoine_400g', 'personnes_approchees'];
      
      for (const field of fieldsToCheck) {
        totalFields++;
        const value = perf[field];
        
        if (value === null || value === undefined || value === '') {
          missingFields++;
        } else if (value === 0) {
          zeroValues++;
        }
      }
    }
    
    const completeness = totalFields > 0 ? ((totalFields - missingFields) / totalFields) * 100 : 0;
    
    return {
      completeness: Math.round(completeness),
      missingFields: missingFields,
      zeroValues: zeroValues,
      totalFields: totalFields,
      quality: this._rateDataQuality(completeness)
    };
  }

  /**
   * Noter la performance
   * @private
   */
  _ratePerformance(achievementRate) {
    if (achievementRate >= 150) return 'excellent';
    if (achievementRate >= 100) return 'good';
    if (achievementRate >= 75) return 'satisfactory';
    if (achievementRate >= 50) return 'poor';
    return 'critical';
  }

  /**
   * Noter la qualité des données
   * @private
   */
  _rateDataQuality(completeness) {
    if (completeness >= 95) return 'excellent';
    if (completeness >= 80) return 'good';
    if (completeness >= 60) return 'satisfactory';
    return 'poor';
  }

  /**
   * Grouper les données par une clé
   * @private
   */
  _groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  /**
   * Calculer les KPIs pour un agent spécifique
   */
  calculateAgentKPIs(agentPerformances) {
    if (!agentPerformances || agentPerformances.length === 0) {
      return { error: "Aucune donnée pour cet agent" };
    }
    
    const kpis = {
      agent: {
        id: agentPerformances[0].agent_id,
        name: agentPerformances[0].agent_name,
        city: agentPerformances[0].city
      },
      performance: this._calculateAgentPerformance(agentPerformances),
      trends: this._calculateAgentTrends(agentPerformances),
      recommendations: this._generateAgentRecommendations(agentPerformances)
    };
    
    return kpis;
  }

  /**
   * Calculer la performance d'un agent
   * @private
   */
  _calculateAgentPerformance(agentPerformances) {
    const totalSales = agentPerformances.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                         (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                         (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const totalObjectives = agentPerformances.reduce((sum, p) => sum + (p.objective_carton || 0), 0);
    
    const totalVisits = agentPerformances.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
    
    const achievementRate = totalObjectives > 0 ? (totalSales / totalObjectives) * 100 : 0;
    
    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalObjectives: Math.round(totalObjectives * 100) / 100,
      totalVisits: totalVisits,
      achievementRate: Math.round(achievementRate * 100) / 100,
      performance: this._ratePerformance(achievementRate),
      reportCount: agentPerformances.length,
      averageVisitsPerDay: agentPerformances.length > 0 ? Math.round(totalVisits / agentPerformances.length) : 0
    };
  }

  /**
   * Calculer les tendances d'un agent
   * @private
   */
  _calculateAgentTrends(agentPerformances) {
    const sortedPerfs = [...agentPerformances].sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
    
    if (sortedPerfs.length < 2) {
      return { message: "Pas assez de données pour les tendances" };
    }
    
    const recentSales = sortedPerfs.slice(-7).reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                         (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                         (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const previousSales = sortedPerfs.slice(-14, -7).reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                          (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                          (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const growth = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;
    
    return {
      recentSales: Math.round(recentSales * 100) / 100,
      previousSales: Math.round(previousSales * 100) / 100,
      growth: Math.round(growth * 100) / 100,
      trend: growth > 0 ? 'croissance' : 'décroissance'
    };
  }

  /**
   * Générer des recommandations pour un agent
   * @private
   */
  _generateAgentRecommendations(agentPerformances) {
    const recommendations = [];
    
    const totalVisits = agentPerformances.reduce((sum, p) => sum + (p.personnes_approchees || 0), 0);
    const avgVisits = agentPerformances.length > 0 ? totalVisits / agentPerformances.length : 0;
    
    if (avgVisits < this.alertThresholds.visits.target) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        message: `Augmenter le nombre de visites quotidiennes (actuel: ${Math.round(avgVisits)}, objectif: ${this.alertThresholds.visits.target})`
      });
    }
    
    const totalSales = agentPerformances.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                         (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                         (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const totalObjectives = agentPerformances.reduce((sum, p) => sum + (p.objective_carton || 0), 0);
    const achievementRate = totalObjectives > 0 ? (totalSales / totalObjectives) * 100 : 0;
    
    if (achievementRate < this.alertThresholds.achievementRate.warning) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        message: `Améliorer le taux de réalisation (actuel: ${Math.round(achievementRate)}%, objectif: ${this.alertThresholds.achievementRate.warning}%)`
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        message: 'Performance satisfaisante - continuer les bonnes pratiques'
      });
    }
    
    return recommendations;
  }
}

module.exports = GrossisteKPICalculator;