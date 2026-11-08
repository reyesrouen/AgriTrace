/**
 * Weather & Fuel Exogenous Datasets
 * Sourced directly from:
 * - data/raw/Climatological_Normals_filtered.csv (PAGASA 30-year Normals)
 * - data/raw/Fuel_Prices_Pampanga_filtered.csv (DOE 211 Reports, 1,395 Entries)
 */

export const WEATHER_STATIONS = [
  {
    id: 'clark',
    name: 'Clark Station (Pampanga)',
    location: 'Clark Freeport Zone / Mabalacat Basin',
    annualRainfallMm: 2026.8,
    monthlyNormalsMm: [17.4, 18.6, 28.4, 65.0, 221.8, 241.2, 422.6, 429.4, 293.1, 177.0, 78.0, 34.2],
    primaryCommoditiesImpacted: ['Tomatoes', 'Red Onions', 'White Onions'],
    riskRating: 'HIGH_MONSOON'
  },
  {
    id: 'cabanatuan',
    name: 'Cabanatuan Station (Nueva Ecija)',
    location: 'Central Luzon Agricultural Granary',
    annualRainfallMm: 1854.9,
    monthlyNormalsMm: [16.9, 16.6, 18.4, 47.4, 179.1, 193.7, 371.1, 372.0, 320.4, 186.4, 90.0, 42.9],
    primaryCommoditiesImpacted: ['Red Onions (Bongabon)', 'Regular Milled Rice (Talavera)'],
    riskRating: 'CRITICAL_HARVEST_ROUTE'
  },
  {
    id: 'iba',
    name: 'Iba Station (Zambales)',
    location: 'Western Coastal Agro-Climatic Zone',
    annualRainfallMm: 3450.7,
    monthlyNormalsMm: [4.1, 9.3, 19.8, 38.1, 254.7, 519.9, 838.1, 897.7, 559.5, 234.2, 62.3, 13.2],
    primaryCommoditiesImpacted: ['Native Garlic', 'Tomatoes'],
    riskRating: 'EXTREME_PRECIPITATION'
  },
  {
    id: 'subic',
    name: 'Subic Bay / Cubi Pt. Station',
    location: 'SCTEX Southern Logistics Corridor',
    annualRainfallMm: 3378.6,
    monthlyNormalsMm: [6.0, 4.2, 16.1, 22.5, 416.8, 385.7, 759.7, 753.5, 695.8, 214.5, 81.9, 21.9],
    primaryCommoditiesImpacted: ['Reefer Freight Transshipment'],
    riskRating: 'HIGH_CORRIDOR_RISK'
  }
];

export const FUEL_PAMPANGA_MUNICIPALITIES = [
  { municipality: 'Angeles City', avgDieselPricePhp: 65.80, minPrice: 59.00, maxPrice: 68.50 },
  { municipality: 'City of San Fernando', avgDieselPricePhp: 65.50, minPrice: 58.14, maxPrice: 67.90 },
  { municipality: 'Guagua', avgDieselPricePhp: 64.90, minPrice: 56.15, maxPrice: 66.80 },
  { municipality: 'Mabalacat', avgDieselPricePhp: 66.10, minPrice: 56.00, maxPrice: 68.20 },
  { municipality: 'Bacolor', avgDieselPricePhp: 64.80, minPrice: 57.99, maxPrice: 66.50 },
  { municipality: 'Magalang', avgDieselPricePhp: 64.75, minPrice: 54.80, maxPrice: 66.30 },
  { municipality: 'Arayat', avgDieselPricePhp: 65.10, minPrice: 57.05, maxPrice: 66.90 }
];

// Econometric parameter matrix: elasticity & sensitivity weights
export const COMMODITY_EXOGENOUS_SENSITIVITIES = {
  onions_red: {
    fuelElasticityBeta: 0.45,       // +10% diesel -> +4.5% wholesale transport surcharge
    rainfallElasticityBeta: 0.38,   // Rainfall delay impact coefficient
    typhoonSpikeFlatPhp: 24.50,     // Direct supply bottleneck surge per kg
    correlationFuel: 0.68,
    correlationRainfall: 0.54,
    spoilageRatePerMmRain: 0.08
  },
  onions_white: {
    fuelElasticityBeta: 0.42,
    rainfallElasticityBeta: 0.35,
    typhoonSpikeFlatPhp: 22.00,
    correlationFuel: 0.65,
    correlationRainfall: 0.51,
    spoilageRatePerMmRain: 0.07
  },
  rice_regular: {
    fuelElasticityBeta: 0.22,       // Staple bulk transport lower elasticity
    rainfallElasticityBeta: 0.18,
    typhoonSpikeFlatPhp: 6.50,
    correlationFuel: 0.42,
    correlationRainfall: 0.31,
    spoilageRatePerMmRain: 0.02
  },
  rice_premium: {
    fuelElasticityBeta: 0.25,
    rainfallElasticityBeta: 0.20,
    typhoonSpikeFlatPhp: 8.00,
    correlationFuel: 0.46,
    correlationRainfall: 0.34,
    spoilageRatePerMmRain: 0.02
  },
  tomatoes: {
    fuelElasticityBeta: 0.52,       // Highly perishable vegetable: high transport & rain sensitivity
    rainfallElasticityBeta: 0.62,
    typhoonSpikeFlatPhp: 32.00,
    correlationFuel: 0.74,
    correlationRainfall: 0.81,
    spoilageRatePerMmRain: 0.14
  },
  garlic: {
    fuelElasticityBeta: 0.32,
    rainfallElasticityBeta: 0.22,
    typhoonSpikeFlatPhp: 14.00,
    correlationFuel: 0.52,
    correlationRainfall: 0.38,
    spoilageRatePerMmRain: 0.03
  }
};
