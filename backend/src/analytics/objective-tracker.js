// ==================== MODULE COMPARAISON OBJECTIFS VS RÉALISATIONS AVEC ALERTES ====================

/**
 * Tracker d'objectifs avec système d'alertes intelligent
 * Basé sur l'analyse des KPIs et des règles ETL apprises
 */
class ObjectiveTracker {
  
  constructor() {
    // Seuils d'alerte basés sur l'analyse ETL
    this.alertThresholds = {
      achievement: {
        critical: 50,      // En dessous de 50% = critique
        warning: 75,       // En dessous de 75% = avertissement
        target: 100        // Cible = 100%
      },
      trend: {
        negativeGrowth: -10, // Décroissance de plus de 10%
        stagnation: 5,       // Croissance inférieure à 5% = stagnation
        growth: 10          // Croissance supérieure à 10% = bonne croissance
      },
      consistency: {
        minimumReports: 3,  // Minimum de rapports pour évaluer la consistence
        varianceThreshold: 0.3 // Écart-type acceptable
      }
    };
  }

  /**
   * Analyser la performance vs objectifs pour tous les agents
   * @param {Array} performances - Données de performances
   * @param {Array} objectives - Données d'objectifs
   * @returns {Object} Analyse complète avec alertes
   */
  analyzePerformanceVsObjectives(performances, objectives) {
    if (!performances || performances.length === 0) {
      return { error: "Aucune donnée de performance disponible" };
    }

    const analysis = {
      global: this._analyzeGlobalPerformance(performances, objectives),
      byAgent: this._analyzeByAgent(performances, objectives),
      byPeriod: this._analyzeByPeriod(performances, objectives),
      alerts: this._generatePerformanceAlerts(performances, objectives),
      recommendations: this._generateRecommendations(performances, objectives)
    };

    return analysis;
  }

  /**
   * Analyser la performance globale
   * @private
   */
  _analyzeGlobalPerformance(performances, objectives) {
    const totalSales = performances.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                         (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                         (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const totalObjectives = objectives.reduce((sum, obj) => 
      sum + (obj.weekly_sales_premium_16g || 0) + (obj.weekly_sales_premium_360g || 0) + 
      (obj.weekly_sales_excellence_900g || 0) + (obj.weekly_sales_avoine_50g || 0) + 
      (obj.weekly_sales_avoine_400g || 0), 0);
    
    const globalAchievementRate = totalObjectives > 0 ? (totalSales / totalObjectives) * 100 : 0;
    
    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalObjectives: Math.round(totalObjectives * 100) / 100,
      globalAchievementRate: Math.round(globalAchievementRate * 100) / 100,
      performanceLevel: this._categorizePerformance(globalAchievementRate),
      objectiveCoverage: objectives.length > 0 ? (performances.length / objectives.length) * 100 : 0
    };
  }

  /**
   * Analyser par agent
   * @private
   */
  _analyzeByAgent(performances, objectives) {
    const agentGroups = this._groupBy(performances, 'agent_id');
    const agentAnalysis = {};
    
    for (const [agentId, agentPerfs] of Object.entries(agentGroups)) {
      const agentObjectives = objectives.filter(obj => obj.agent_id === parseInt(agentId));
      
      const agentSales = agentPerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const agentObjectivesTotal = agentObjectives.reduce((sum, obj) => 
        sum + (obj.weekly_sales_premium_16g || 0) + (obj.weekly_sales_premium_360g || 0) + 
        (obj.weekly_sales_excellence_900g || 0) + (obj.weekly_sales_avoine_50g || 0) + 
        (obj.weekly_sales_avoine_400g || 0), 0);
      
      const achievementRate = agentObjectivesTotal > 0 ? (agentSales / agentObjectivesTotal) * 100 : 0;
      
      agentAnalysis[agentId] = {
        agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
        agentCity: agentPerfs[0].city,
        totalSales: Math.round(agentSales * 100) / 100,
        totalObjectives: Math.round(agentObjectivesTotal * 100) / 100,
        achievementRate: Math.round(achievementRate * 100) / 100,
        performanceLevel: this._categorizePerformance(achievementRate),
        reportCount: agentPerfs.length,
        objectiveAssigned: agentObjectives.length > 0,
        trend: this._calculateAgentTrend(agentPerfs),
        consistency: this._calculateConsistency(agentPerfs)
      };
    }
    
    return agentAnalysis;
  }

  /**
   * Analyser par période
   * @private
   */
  _analyzeByPeriod(performances, objectives) {
    const periodGroups = this._groupBy(performances, 'report_date');
    const periodAnalysis = {};
    
    for (const [date, datePerfs] of Object.entries(periodGroups)) {
      const dateObjectives = objectives.filter(obj => 
        new Date(date) >= new Date(obj.period_start) && 
        new Date(date) <= new Date(obj.period_end)
      );
      
      const dateSales = datePerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                        (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                        (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const dateObjectivesTotal = dateObjectives.reduce((sum, obj) => 
        sum + (obj.weekly_sales_premium_16g || 0) + (obj.weekly_sales_premium_360g || 0) + 
        (obj.weekly_sales_excellence_900g || 0) + (obj.weekly_sales_avoine_50g || 0) + 
        (obj.weekly_sales_avoine_400g || 0), 0);
      
      const achievementRate = dateObjectivesTotal > 0 ? (dateSales / dateObjectivesTotal) * 100 : 0;
      
      periodAnalysis[date] = {
        date: date,
        totalSales: Math.round(dateSales * 100) / 100,
        totalObjectives: Math.round(dateObjectivesTotal * 100) / 100,
        achievementRate: Math.round(achievementRate * 100) / 100,
        performanceLevel: this._categorizePerformance(achievementRate),
        reportCount: datePerfs.length,
        activeAgents: new Set(datePerfs.map(p => p.agent_id)).size
      };
    }
    
    return periodAnalysis;
  }

  /**
   * Générer des alertes de performance
   * @private
   */
  _generatePerformanceAlerts(performances, objectives) {
    const alerts = [];
    
    // Analyser les alertes par agent
    const agentGroups = this._groupBy(performances, 'agent_id');
    
    for (const [agentId, agentPerfs] of Object.entries(agentGroups)) {
      const agentObjectives = objectives.filter(obj => obj.agent_id === parseInt(agentId));
      
      if (agentObjectives.length === 0) {
        alerts.push({
          type: 'warning',
          category: 'objective',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Aucun objectif assigné à cet agent`,
          priority: 'medium',
          recommendation: 'Assigner des objectifs à cet agent pour suivre les performances'
        });
        continue;
      }
      
      const agentSales = agentPerfs.reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                           (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                           (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
      
      const agentObjectivesTotal = agentObjectives.reduce((sum, obj) => 
        sum + (obj.weekly_sales_premium_16g || 0) + (obj.weekly_sales_premium_360g || 0) + 
        (obj.weekly_sales_excellence_900g || 0) + (obj.weekly_sales_avoine_50g || 0) + 
        (obj.weekly_sales_avoine_400g || 0), 0);
      
      const achievementRate = agentObjectivesTotal > 0 ? (agentSales / agentObjectivesTotal) * 100 : 0;
      
      // Alertes de taux de réalisation
      if (achievementRate < this.alertThresholds.achievement.critical) {
        alerts.push({
          type: 'critical',
          category: 'achievement',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Taux de réalisation critique: ${Math.round(achievementRate)}%`,
          currentValue: achievementRate,
          targetValue: this.alertThresholds.achievement.critical,
          priority: 'high',
          recommendation: 'Action immédiate requise - revoir la stratégie commerciale'
        });
      } else if (achievementRate < this.alertThresholds.achievement.warning) {
        alerts.push({
          type: 'warning',
          category: 'achievement',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Taux de réalisation faible: ${Math.round(achievementRate)}%`,
          currentValue: achievementRate,
          targetValue: this.alertThresholds.achievement.warning,
          priority: 'medium',
          recommendation: 'Surveillance accrue nécessaire - envisager un coaching'
        });
      }
      
      // Alertes de tendance
      const trend = this._calculateAgentTrend(agentPerfs);
      if (trend.growth < this.alertThresholds.trend.negativeGrowth) {
        alerts.push({
          type: 'warning',
          category: 'trend',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Tendance négative détectée: ${Math.round(trend.growth)}%`,
          currentValue: trend.growth,
          priority: 'medium',
          recommendation: 'Analyser les causes de la décroissance des performances'
        });
      }
      
      // Alertes de consistence
      const consistency = this._calculateConsistency(agentPerfs);
      if (consistency.variance > this.alertThresholds.consistency.varianceThreshold && agentPerfs.length >= this.alertThresholds.consistency.minimumReports) {
        alerts.push({
          type: 'warning',
          category: 'consistency',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: `Performance inconsistente détectée (variance: ${Math.round(consistency.variance * 100)}%)`,
          currentValue: consistency.variance,
          priority: 'low',
          recommendation: 'Revoir la régularité des visites et l\'organisation du travail'
        });
      }
    }
    
    // Trier les alertes par priorité
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return alerts;
  }

  /**
   * Générer des recommandations basées sur l'analyse
   * @private
   */
  _generateRecommendations(performances, objectives) {
    const recommendations = [];
    
    const agentGroups = this._groupBy(performances, 'agent_id');
    
    // Recommandations globales
    const globalAnalysis = this._analyzeGlobalPerformance(performances, objectives);
    
    if (globalAnalysis.globalAchievementRate < this.alertThresholds.achievement.warning) {
      recommendations.push({
        type: 'strategic',
        priority: 'high',
        scope: 'global',
        message: 'Performance globale insuffisante - revoir la stratégie commerciale',
        actions: [
          'Analyser les produits sous-performants',
          'Revoir les objectifs assignés',
          'Renforcer le coaching des agents'
        ]
      });
    }
    
    // Recommandations par agent
    for (const [agentId, agentPerfs] of Object.entries(agentGroups)) {
      const agentObjectives = objectives.filter(obj => obj.agent_id === parseInt(agentId));
      
      if (agentObjectives.length === 0) {
        recommendations.push({
          type: 'operational',
          priority: 'medium',
          scope: 'agent',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: 'Assigner des objectifs à cet agent',
          actions: [
            'Définir des objectifs réalistes',
            'Former l\'agent aux objectifs',
            'Établir un suivi régulier'
          ]
        });
      }
      
      const trend = this._calculateAgentTrend(agentPerfs);
      if (trend.growth < 0) {
        recommendations.push({
          type: 'coaching',
          priority: 'medium',
          scope: 'agent',
          agentId: agentId,
          agentName: agentPerfs[0].agent_name || `Agent ${agentId}`,
          message: 'Coaching nécessaire pour améliorer les performances',
          actions: [
            'Session de coaching individuel',
            'Analyser les obstacles rencontrés',
            'Partager les meilleures pratiques'
          ]
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Calculer la tendance d'un agent
   * @private
   */
  _calculateAgentTrend(agentPerfs) {
    const sortedPerfs = [...agentPerfs].sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
    
    if (sortedPerfs.length < 2) {
      return { growth: 0, message: 'Pas assez de données', trend: 'stable' };
    }
    
    const recentSales = sortedPerfs.slice(-3).reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                         (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                         (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    const previousSales = sortedPerfs.slice(-6, -3).reduce((sum, p) => sum + (p.real_sales_premium_16g || 0) + 
                          (p.real_sales_premium_360g || 0) + (p.real_sales_excellence_900g || 0) +
                          (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0), 0);
    
    if (previousSales === 0) {
      return { growth: 0, message: 'Période précédente sans ventes', trend: 'stable' };
    }
    
    const growth = ((recentSales - previousSales) / previousSales) * 100;
    
    let trend = 'stable';
    if (growth > this.alertThresholds.trend.growth) trend = 'croissance';
    else if (growth < this.alertThresholds.trend.negativeGrowth) trend = 'décroissance';
    else if (growth < this.alertThresholds.trend.stagnation) trend = 'stagnation';
    
    return {
      growth: Math.round(growth * 100) / 100,
      recentSales: Math.round(recentSales * 100) / 100,
      previousSales: Math.round(previousSales * 100) / 100,
      trend: trend
    };
  }

  /**
   * Calculer la consistence des performances
   * @private
   */
  _calculateConsistency(agentPerfs) {
    if (agentPerfs.length < 2) {
      return { variance: 0, consistency: 'unknown', message: 'Pas assez de données' };
    }
    
    const salesValues = agentPerfs.map(p => 
      (p.real_sales_premium_16g || 0) + (p.real_sales_premium_360g || 0) + 
      (p.real_sales_excellence_900g || 0) + (p.real_sales_avoine_50g || 0) + (p.real_sales_avoine_400g || 0)
    );
    
    const mean = salesValues.reduce((sum, val) => sum + val, 0) / salesValues.length;
    const variance = salesValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / salesValues.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 0;
    
    let consistency = 'high';
    if (coefficientOfVariation > 0.5) consistency = 'low';
    else if (coefficientOfVariation > 0.3) consistency = 'medium';
    
    return {
      variance: coefficientOfVariation,
      standardDeviation: stdDev,
      mean: mean,
      consistency: consistency
    };
  }

  /**
   * Catégoriser la performance
   * @private
   */
  _categorizePerformance(achievementRate) {
    if (achievementRate >= 150) return 'excellent';
    if (achievementRate >= 100) return 'good';
    if (achievementRate >= 75) return 'satisfactory';
    if (achievementRate >= 50) return 'poor';
    return 'critical';
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
   * Obtenir le tableau de bord des objectifs
   */
  getObjectiveDashboard(performances, objectives) {
    const analysis = this.analyzePerformanceVsObjectives(performances, objectives);
    
    return {
      summary: {
        totalAgents: Object.keys(analysis.byAgent).length,
        agentsWithObjectives: Object.values(analysis.byAgent).filter(a => a.objectiveAssigned).length,
        averageAchievementRate: analysis.global.globalAchievementRate,
        totalAlerts: analysis.alerts.length,
        criticalAlerts: analysis.alerts.filter(a => a.type === 'critical').length
      },
      performanceOverview: {
        global: analysis.global,
        topPerformers: this._getTopPerformers(analysis.byAgent, 3),
        underPerformers: this._getUnderPerformers(analysis.byAgent, 3),
        mostImproved: this._getMostImproved(analysis.byAgent, 3)
      },
      alerts: analysis.alerts,
      recommendations: analysis.recommendations
    };
  }

  /**
   * Obtenir les meilleurs performeurs
   * @private
   */
  _getTopPerformers(agentAnalysis, limit) {
    return Object.values(agentAnalysis)
      .filter(a => a.objectiveAssigned)
      .sort((a, b) => b.achievementRate - a.achievementRate)
      .slice(0, limit);
  }

  /**
   * Obtenir les moins bons performeurs
   * @private
   */
  _getUnderPerformers(agentAnalysis, limit) {
    return Object.values(agentAnalysis)
      .filter(a => a.objectiveAssigned)
      .sort((a, b) => a.achievementRate - b.achievementRate)
      .slice(0, limit);
  }

  /**
   * Obtenir les plus améliorés
   * @private
   */
  _getMostImproved(agentAnalysis, limit) {
    return Object.values(agentAnalysis)
      .filter(a => a.trend && a.trend.growth > 0)
      .sort((a, b) => b.trend.growth - a.trend.growth)
      .slice(0, limit);
  }
}

module.exports = ObjectiveTracker;