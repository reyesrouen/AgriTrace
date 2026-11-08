/**
 * Agricultural Commodities & Historical Datasets (IAS 41 Compliant)
 * Sourced from:
 * - data/processed/pampanga_aligned_weekly.csv
 * - data/ncr_red_onions_weekly.csv
 * - data/processed/model_accuracy_metrics.csv
 * - data/processed/price_spike_sensitivity.csv
 */

export const COMMODITIES_METADATA = [
  {
    id: 'onions_red',
    name: 'Red Onions',
    variety: 'Red Creole (Bermuda Red)',
    category: 'Condiments & Bulbs',
    ias41Classification: 'AGRICULTURAL_PRODUCE',
    unit: 'PHP/kg',
    currentPrice: 180.0,            // Active spot market gross rate (DA/PSA)
    fvlctsPerKg: 170.20,            // IAS 41 Fair Value Less Costs to Sell
    estimatedCostsToSellPerKg: 9.80, // Brokerage (₱4.50) + DA/LGU levy (₱1.80) + Bagging (₱3.50)
    priceChange7d: +3.5,
    volatility: 'HIGH',
    volatilityIndex: 18.4,
    description: 'High-value staple condiment subject to seasonal biological transformation and monsoon logistics bottlenecks in Central Luzon.',
    iconName: 'Sparkles',
    regions: ['Pampanga (Region III)', 'NCR (Metro Manila)', 'Nueva Ecija', 'Bulacan']
  },
  {
    id: 'onions_white',
    name: 'White Onions',
    variety: 'Yellow Granex',
    category: 'Condiments & Bulbs',
    ias41Classification: 'AGRICULTURAL_PRODUCE',
    unit: 'PHP/kg',
    currentPrice: 145.0,
    fvlctsPerKg: 136.75,
    estimatedCostsToSellPerKg: 8.25,
    priceChange7d: -2.1,
    volatility: 'MEDIUM',
    volatilityIndex: 12.8,
    description: 'Commercial institutional onion popular with food service, heavily dependent on cold storage facilities.',
    iconName: 'Layers',
    regions: ['Pampanga (Region III)', 'Pangasinan', 'NCR (Metro Manila)']
  },
  {
    id: 'rice_regular',
    name: 'Regular Milled Rice',
    variety: 'RMR Well-Polished',
    category: 'Grains & Staples',
    ias41Classification: 'INVENTORY_IAS2', // Converted at mill gate from raw palay
    unit: 'PHP/kg',
    currentPrice: 48.50,
    fvlctsPerKg: 45.59,
    estimatedCostsToSellPerKg: 2.91,
    priceChange7d: +0.4,
    volatility: 'LOW',
    volatilityIndex: 4.2,
    description: 'Core national caloric staple with price monitoring caps and national buffer stock reserves.',
    iconName: 'Wheat',
    regions: ['Pampanga (Region III)', 'Nueva Ecija', 'NCR (Metro Manila)', 'Tarlac']
  },
  {
    id: 'rice_premium',
    name: 'Premium / Dinorado Rice',
    variety: 'Fragrant Long-Grain',
    category: 'Grains & Staples',
    ias41Classification: 'INVENTORY_IAS2',
    unit: 'PHP/kg',
    currentPrice: 62.00,
    fvlctsPerKg: 58.14,
    estimatedCostsToSellPerKg: 3.86,
    priceChange7d: +1.1,
    volatility: 'LOW',
    volatilityIndex: 5.6,
    description: 'High-grade domestic aromatic rice cultivated primarily in Central Luzon irrigated river plains.',
    iconName: 'Award',
    regions: ['Pampanga (Region III)', 'Nueva Ecija', 'NCR (Metro Manila)']
  },
  {
    id: 'tomatoes',
    name: 'Fresh Tomatoes',
    variety: 'Diamante Max / Native',
    category: 'Vegetables',
    ias41Classification: 'AGRICULTURAL_PRODUCE',
    unit: 'PHP/kg',
    currentPrice: 83.10,
    fvlctsPerKg: 74.70,
    estimatedCostsToSellPerKg: 8.40,
    priceChange7d: +12.8,
    volatility: 'VERY_HIGH',
    volatilityIndex: 26.1,
    description: 'Highly perishable vegetable sensitive to heavy rainfall (PAGASA normals) and post-harvest transport delays.',
    iconName: 'Flame',
    regions: ['Pampanga (Region III)', 'Tarlac', 'NCR (Metro Manila)', 'Benguet']
  },
  {
    id: 'garlic',
    name: 'Native Garlic',
    variety: 'Batanes / Ilocos Red',
    category: 'Condiments & Bulbs',
    ias41Classification: 'AGRICULTURAL_PRODUCE',
    unit: 'PHP/kg',
    currentPrice: 135.0,
    fvlctsPerKg: 128.15,
    estimatedCostsToSellPerKg: 6.85,
    priceChange7d: -1.5,
    volatility: 'MEDIUM',
    volatilityIndex: 9.3,
    description: 'Aromatic native bulbs with extended shelf stability and inter-provincial shipping routes.',
    iconName: 'Shield',
    regions: ['Pampanga (Region III)', 'Ilocos', 'NCR (Metro Manila)']
  }
];

// Historical weekly series extracted from pampanga_aligned_weekly.csv & ncr_red_onions_weekly.csv
export const HISTORICAL_SERIES = {
  onions_red: [
    { period: 'W10', date: '2025-03-08', price: 92.5, fvlcts: 85.5, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 96.0, fvlcts: 88.8, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 104.5, fvlcts: 96.9, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 118.2, fvlcts: 109.8, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 125.0, fvlcts: 116.4, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 138.6, fvlcts: 129.5, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 146.0, fvlcts: 136.6, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 155.5, fvlcts: 145.8, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 168.0, fvlcts: 157.9, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 176.5, fvlcts: 166.2, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 192.0, fvlcts: 181.3, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 185.0, fvlcts: 174.6, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 179.0, fvlcts: 168.8, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 172.5, fvlcts: 162.5, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 175.0, fvlcts: 165.0, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 178.5, fvlcts: 168.4, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 180.0, fvlcts: 170.2, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ],
  onions_white: [
    { period: 'W10', date: '2025-03-08', price: 110.0, fvlcts: 103.5, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 114.5, fvlcts: 107.8, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 121.0, fvlcts: 113.9, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 128.5, fvlcts: 121.0, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 133.0, fvlcts: 125.3, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 140.2, fvlcts: 132.2, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 148.5, fvlcts: 140.1, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 154.0, fvlcts: 145.3, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 159.0, fvlcts: 150.1, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 152.0, fvlcts: 143.4, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 158.0, fvlcts: 149.2, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 150.0, fvlcts: 141.6, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 146.0, fvlcts: 137.8, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 142.0, fvlcts: 133.9, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 144.0, fvlcts: 135.8, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 147.0, fvlcts: 138.7, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 145.0, fvlcts: 136.8, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ],
  rice_regular: [
    { period: 'W10', date: '2025-03-08', price: 42.0, fvlcts: 39.5, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 42.5, fvlcts: 40.0, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 43.1, fvlcts: 40.5, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 44.0, fvlcts: 41.4, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 44.8, fvlcts: 42.1, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 45.5, fvlcts: 42.8, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 46.2, fvlcts: 43.4, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 46.8, fvlcts: 44.0, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 47.5, fvlcts: 44.7, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 47.8, fvlcts: 44.9, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 48.0, fvlcts: 45.1, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 48.2, fvlcts: 45.3, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 48.0, fvlcts: 45.1, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 47.8, fvlcts: 44.9, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 48.0, fvlcts: 45.1, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 48.3, fvlcts: 45.4, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 48.5, fvlcts: 45.6, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ],
  rice_premium: [
    { period: 'W10', date: '2025-03-08', price: 54.0, fvlcts: 50.6, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 54.8, fvlcts: 51.4, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 55.5, fvlcts: 52.0, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 56.5, fvlcts: 53.0, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 57.2, fvlcts: 53.6, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 58.4, fvlcts: 54.8, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 59.5, fvlcts: 55.8, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 60.0, fvlcts: 56.3, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 60.8, fvlcts: 57.0, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 61.2, fvlcts: 57.4, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 61.5, fvlcts: 57.7, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 61.8, fvlcts: 58.0, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 61.5, fvlcts: 57.7, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 61.2, fvlcts: 57.4, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 61.5, fvlcts: 57.7, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 61.8, fvlcts: 58.0, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 62.0, fvlcts: 58.1, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ],
  tomatoes: [
    { period: 'W10', date: '2025-03-08', price: 33.1, fvlcts: 27.5, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 35.6, fvlcts: 29.8, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 46.0, fvlcts: 39.8, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 55.0, fvlcts: 48.0, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 57.3, fvlcts: 50.1, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 63.8, fvlcts: 56.1, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 96.5, fvlcts: 87.2, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 119.6, fvlcts: 109.1, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 91.5, fvlcts: 82.3, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 103.6, fvlcts: 93.8, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 145.8, fvlcts: 133.5, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 110.0, fvlcts: 99.8, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 65.0, fvlcts: 57.2, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 45.0, fvlcts: 38.6, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 52.0, fvlcts: 45.1, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 68.0, fvlcts: 60.2, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 83.1, fvlcts: 74.7, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ],
  garlic: [
    { period: 'W10', date: '2025-03-08', price: 115.0, fvlcts: 108.5, dieselLag7: 57.5, rainfallLag14: 18.4 },
    { period: 'W14', date: '2025-04-05', price: 118.0, fvlcts: 111.4, dieselLag7: 58.0, rainfallLag14: 28.4 },
    { period: 'W18', date: '2025-05-03', price: 122.0, fvlcts: 115.3, dieselLag7: 59.2, rainfallLag14: 65.0 },
    { period: 'W22', date: '2025-05-31', price: 125.0, fvlcts: 118.2, dieselLag7: 60.1, rainfallLag14: 177.0 },
    { period: 'W26', date: '2025-06-28', price: 127.5, fvlcts: 120.6, dieselLag7: 61.5, rainfallLag14: 241.2 },
    { period: 'W30', date: '2025-07-26', price: 130.0, fvlcts: 123.1, dieselLag7: 62.0, rainfallLag14: 422.6 },
    { period: 'W34', date: '2025-08-23', price: 134.0, fvlcts: 127.0, dieselLag7: 63.4, rainfallLag14: 429.4 },
    { period: 'W38', date: '2025-09-20', price: 138.0, fvlcts: 131.0, dieselLag7: 64.0, rainfallLag14: 293.1 },
    { period: 'W42', date: '2025-10-18', price: 140.0, fvlcts: 133.0, dieselLag7: 65.0, rainfallLag14: 177.0 },
    { period: 'W46', date: '2025-11-15', price: 142.5, fvlcts: 135.4, dieselLag7: 65.5, rainfallLag14: 78.0 },
    { period: 'W50', date: '2025-12-13', price: 145.0, fvlcts: 137.9, dieselLag7: 66.2, rainfallLag14: 34.2 },
    { period: 'W02', date: '2026-01-10', price: 142.0, fvlcts: 135.0, dieselLag7: 65.8, rainfallLag14: 17.4 },
    { period: 'W06', date: '2026-02-07', price: 139.0, fvlcts: 132.1, dieselLag7: 64.5, rainfallLag14: 18.6 },
    { period: 'W10', date: '2026-03-07', price: 136.5, fvlcts: 129.7, dieselLag7: 64.0, rainfallLag14: 28.4 },
    { period: 'W14', date: '2026-04-04', price: 135.0, fvlcts: 128.2, dieselLag7: 64.8, rainfallLag14: 65.0 },
    { period: 'W18', date: '2026-05-02', price: 134.0, fvlcts: 127.2, dieselLag7: 65.2, rainfallLag14: 120.0 },
    { period: 'W22', date: '2026-05-30', price: 135.0, fvlcts: 128.2, dieselLag7: 65.5, rainfallLag14: 185.0 }
  ]
};

// Benchmark Model Accuracy Metrics (Reproduces data/processed/model_accuracy_metrics.csv)
export const MODEL_ACCURACY_METRICS = [
  { commodity: 'Regular Milled Rice', h1Mae: 1.55, h2Mae: 2.94, h4Mae: 5.38, baselineSelected: 'Naive', bestModel: 'SARIMAX' },
  { commodity: 'Red Onions', h1Mae: 12.40, h2Mae: 18.50, h4Mae: 25.10, baselineSelected: 'Naive', bestModel: 'Prophet + Exog' },
  { commodity: 'Tomatoes', h1Mae: 8.20, h2Mae: 11.40, h4Mae: 16.80, baselineSelected: 'ARIMA', bestModel: 'Holt-Winters' }
];

// Price-Spike Sensitivity Metrics (Reproduces data/processed/price_spike_sensitivity.csv)
export const PRICE_SPIKE_SENSITIVITY = [
  { threshold: '5% Spike', precision: 0.85, recall: 0.88, f1Score: 0.86, alertCount30d: 14 },
  { threshold: '10% Spike', precision: 0.91, recall: 0.89, f1Score: 0.90, alertCount30d: 6 },
  { threshold: '15% Spike', precision: 0.95, recall: 0.82, f1Score: 0.88, alertCount30d: 2 }
];
