/**
 * Agricultural Provenance Supply Chain Batches (IAS 41 Compliant)
 * Strictly separates:
 * 1. BIOLOGICAL_ASSET (IAS 41): Standing crops prior to harvest (measured at FVLCTS with biological transformation gain in P&L)
 * 2. AGRICULTURAL_PRODUCE (IAS 41): Produce at the point of harvest (FVLCTS becomes initial deemed cost under IAS 2)
 * 3. INVENTORY_IAS2 (IAS 2): Harvested produce in cold storage, distribution, or transit (Lower of Cost and NRV)
 */

export const INITIAL_BATCHES = [
  // 1. INVENTORY (IAS 2): Red Onions in Cold Storage Transit
  {
    id: 'BATCH-2026-PH-ON-0042',
    commodity: 'Red Onions',
    variety: 'Red Creole (Bermuda Red)',
    quantityKg: 14500,
    unitPricePhp: 180.0,            // Gross active market price
    fvlctsPerKg: 170.20,             // Net Fair Value Less Costs to Sell under IAS 41
    totalGrossValuePhp: 2610000,
    totalCarryingValuePhp: 2467900,  // IAS 41 balance sheet carrying amount (FVLCTS * kg)
    ias41Classification: 'INVENTORY_IAS2',
    growthMaturityPct: 100,
    daysToHarvest: 0,
    harvestTimestamp: '2026-10-02 06:30:00 PST', // Official IAS 41 -> IAS 2 cutover
    origin: 'Bongabon Onion Growers Multi-Purpose Coop, Nueva Ecija',
    originCoords: '15.6322° N, 121.1444° E',
    destination: 'Balintawak Central Wholesale Market, Quezon City',
    status: 'verified', // 'verified' | 'in_transit' | 'flagged' | 'delivered'
    currentStageIndex: 2, // 0: Farm Gate, 1: Cold Storage, 2: Transport, 3: Retail Market
    coldChainCompliance: 98.4,
    currentTemperatureC: 1.8,
    targetTempRange: '-1°C to +2°C',
    manifestHash: '3d9559a43610779de9f3ea74e327cc21dea220a264e459ef9f51405613f1f703',
    signatureEcdsa: '304402206834e59ec5677ead46e99c3ce8031a5bc017a890f3ded5a6bd9364b0548db949022078d816a92d82828c1c10a247a30319503f326b856ca2b3ad08855a674add1c35',
    signerAuthority: 'Bureau of Plant Industry (BPI) / Dept of Agriculture Region III',
    publicKey: 'PUBKEY_SECP256R1_BPI_NUEVA_ECIJA_0042',
    timestamp: '2026-10-04 23:18:27 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 2175000,    // Initial standing crop FVLCTS @ PHP 150/kg
      harvestFairValue: 2436000,          // Point-of-harvest deemed cost @ PHP 168/kg
      unrealizedBioGainLoss: +261000,     // Recognized in P&L under IAS 41 paragraph 26
      estimatedCostsToSellDeducted: 142100,
      reportingStandard: 'IAS 41 Agriculture / IAS 2 Inventories'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Farm Gate Harvest & Field Curing',
        iasCategory: 'AGRICULTURAL_PRODUCE',
        operator: 'Bongabon Coop Quality Unit',
        regulatoryBody: 'Bureau of Plant Industry (BPI)',
        location: 'Bongabon, Nueva Ecija (Field #409)',
        timestamp: '2026-10-02 06:30:00 PST',
        status: 'completed',
        metrics: { moisture: '11.8%', grade: 'Class A Export Standard', fieldCuring: '72h Solar Tray' },
        valuationAtStage: {
          grossMarketRate: 175.0,
          costsToSellPerKg: 9.80,
          fvlctsPerKg: 165.20,
          carryingAmountTotal: 2395400
        },
        blockHash: 'fa208b04a80ec6ef1d595c27f3c4db5475ff87bb729bc489d2d4807a514d2301',
        txSignature: '3045022100d810a0...verified'
      },
      {
        stageNumber: 2,
        title: 'Palayan Cold Storage Complex Intake',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'North Luzon Cold Logistics Corp.',
        regulatoryBody: 'DA Region III Cold Chain Inspectorate',
        location: 'Palayan City, Nueva Ecija',
        timestamp: '2026-10-03 14:15:00 PST',
        status: 'completed',
        metrics: { chamberTemp: '1.2°C', humidity: '68% RH', ethylene: '0.04 ppm' },
        valuationAtStage: {
          grossMarketRate: 178.0,
          costsToSellPerKg: 9.80,
          fvlctsPerKg: 168.20,
          carryingAmountTotal: 2438900
        },
        blockHash: '8cb2f085189e4726bfcfbc705fa75069a7c64a5113d09a05b382d334547b71ea',
        txSignature: '304402207fa12...verified'
      },
      {
        stageNumber: 3,
        title: 'Refrigerated Highway Transit (SCTEX / NLEX)',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'Central Luzon Agri-Haulers Federation',
        regulatoryBody: 'Land Transportation Office (LTO) / DA Express Corridor',
        location: 'NLEX San Fernando Pampanga Interchange',
        timestamp: '2026-10-04 20:45:00 PST',
        status: 'in_progress',
        metrics: { reefersTemp: '1.8°C', speedKmH: 64, gpsStatus: 'Locked' },
        valuationAtStage: {
          grossMarketRate: 180.0,
          costsToSellPerKg: 9.80,
          fvlctsPerKg: 170.20,
          carryingAmountTotal: 2467900
        },
        blockHash: '3d9559a43610779de9f3ea74e327cc21dea220a264e459ef9f51405613f1f703',
        txSignature: '304402206834e59ec5677ead46e99c3ce8031a5bc017a890f3ded5a6bd9364b0548db949022078d816a92d82828c1c10a247a30319503f326b856ca2b3ad08855a674add1c35'
      },
      {
        stageNumber: 4,
        title: 'Balintawak Wholesale Terminal Gate',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'Metro Manila Agricultural Trading Exchange',
        regulatoryBody: 'Quezon City Veterinary & Market Audit Office',
        location: 'Balintawak Commercial Complex, Quezon City',
        timestamp: 'Estimated: 2026-10-05 02:00:00 PST',
        status: 'pending',
        metrics: { targetBay: 'Wholesale Bay #12', auctionType: 'Spot Auction' },
        valuationAtStage: {
          grossMarketRate: 182.0,
          costsToSellPerKg: 9.80,
          fvlctsPerKg: 172.20,
          carryingAmountTotal: 2496900
        },
        blockHash: 'PENDING_ARRIVAL_HASH',
        txSignature: 'PENDING'
      }
    ]
  },

  // 2. BIOLOGICAL ASSET (IAS 41): Standing Red Onion Crop (Pre-Harvest)
  {
    id: 'BATCH-2026-PH-BIO-0091',
    commodity: 'Red Onions',
    variety: 'Red Pinoy Superior',
    quantityKg: 18000,
    unitPricePhp: 175.0,            // Active spot market price for mature crop
    fvlctsPerKg: 165.20,            // FVLCTS under IAS 41
    totalGrossValuePhp: 3150000,
    totalCarryingValuePhp: 2973600, // IAS 41 balance sheet carrying amount
    ias41Classification: 'BIOLOGICAL_ASSET',
    growthMaturityPct: 85,
    daysToHarvest: 18,
    harvestTimestamp: 'Est. 2026-10-24 (Standing Crop)',
    origin: 'San Jose City Onion Growers Agrarian Reform Beneficiaries',
    originCoords: '15.7915° N, 120.9981° E',
    destination: 'On-Farm Standing Field (Pre-Harvest)',
    status: 'verified',
    currentStageIndex: 0,
    coldChainCompliance: 100.0,
    currentTemperatureC: 28.5,
    targetTempRange: 'Ambient Field (24°C - 32°C)',
    manifestHash: '4a1b8c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    signatureEcdsa: '3045022100e4c7a10294bc123089ef01a942bc891024bc019842a98124bc89102834bca002203914bc819024bc89102834bca9102834bca9102834bca9102834bca9102834bc',
    signerAuthority: 'Department of Agriculture - Region III Crops Audit',
    publicKey: 'PUBKEY_SECP256R1_DA_CROPS_SAN_JOSE_0091',
    timestamp: '2026-10-06 08:30:00 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 2430000,    // Initial planting capitalization @ PHP 135/kg
      harvestFairValue: 2973600,          // Current standing crop FVLCTS @ PHP 165.20/kg
      unrealizedBioGainLoss: +543600,     // Recognized in P&L under IAS 41 paragraph 26
      estimatedCostsToSellDeducted: 176400,
      reportingStandard: 'IAS 41: Biological Assets (Standing Crop at Fair Value)'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Vegetative Bulb Expansion & Agronomic Audit',
        iasCategory: 'BIOLOGICAL_ASSET',
        operator: 'San Jose Agri-Extension Technical Group',
        regulatoryBody: 'DA Region III Bureau of Soils and Water Management',
        location: 'San Jose, Nueva Ecija (Purok 4 Field)',
        timestamp: '2026-10-06 08:30:00 PST',
        status: 'in_progress',
        metrics: { bulbDiameterMm: '54 mm', pestIndex: '0.02% Low', irrigationSchedule: 'Furrow Drip' },
        valuationAtStage: {
          grossMarketRate: 175.0,
          costsToSellPerKg: 9.80,
          fvlctsPerKg: 165.20,
          carryingAmountTotal: 2973600
        },
        blockHash: '4a1b8c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
        txSignature: '3045022100e4c7a102...verified'
      }
    ]
  },

  // 3. AGRICULTURAL PRODUCE (IAS 41 Point of Harvest Cutover): Fresh Tomatoes at Farm Gate Shed
  {
    id: 'BATCH-2026-PH-TM-0312',
    commodity: 'Fresh Tomatoes',
    variety: 'Diamante Max F1 Hybrid',
    quantityKg: 6200,
    unitPricePhp: 68.0,
    fvlctsPerKg: 60.30,
    totalGrossValuePhp: 421600,
    totalCarryingValuePhp: 373860,
    ias41Classification: 'AGRICULTURAL_PRODUCE',
    growthMaturityPct: 100,
    daysToHarvest: 0,
    harvestTimestamp: '2026-10-04 05:30:00 PST', // Official point of harvest cutover
    origin: 'Magalang Vegetable Growers Association, Pampanga',
    originCoords: '15.2167° N, 120.6667° E',
    destination: 'San Fernando Central Public Market, Pampanga',
    status: 'in_transit',
    currentStageIndex: 1,
    coldChainCompliance: 96.2,
    currentTemperatureC: 13.5,
    targetTempRange: '+12°C to +15°C',
    manifestHash: 'a5c92e74d110998a44b12398fdca901234bc567890efabcd1234567890abcdef',
    signatureEcdsa: '3045022100e123984576acbd120984576acbd120984576acbd120984576acbd12098450220984576acbd120984576acbd120984576acbd120984576acbd120984576acbd12',
    signerAuthority: 'Pampanga Provincial Agriculturist Office (PAO)',
    publicKey: 'PUBKEY_SECP256R1_PAO_MAGALANG_0312',
    timestamp: '2026-10-04 12:00:00 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 310000,
      harvestFairValue: 373860,          // Point-of-harvest deemed cost under IAS 2
      unrealizedBioGainLoss: +63860,
      estimatedCostsToSellDeducted: 47740,
      reportingStandard: 'IAS 41 Harvest Cutover to IAS 2 Deemed Cost'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Morning Harvest, Sorting & Crate Packing',
        iasCategory: 'AGRICULTURAL_PRODUCE',
        operator: 'Magalang Sorting Facility',
        regulatoryBody: 'Municipal Agriculture Office (MAO) Magalang',
        location: 'Magalang, Pampanga (Packing Shed #2)',
        timestamp: '2026-10-04 05:30:00 PST',
        status: 'completed',
        metrics: { ripenessStage: 'Breaker (Color 3)', brix: '4.8°', crateCount: '310 crates' },
        valuationAtStage: { grossMarketRate: 68.0, costsToSellPerKg: 7.70, fvlctsPerKg: 60.30, carryingAmountTotal: 373860 },
        blockHash: 'a5c92e74d110998a44b12398fdca901234bc567890efabcd1234567890abcdef',
        txSignature: '3045022100e12398...verified'
      },
      {
        stageNumber: 2,
        title: 'Short-Haul Agro-Logistics Transit',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'Pampanga Eco-Freight Service',
        regulatoryBody: 'Land Transportation Franchising Board',
        location: 'En route Magalang - San Fernando',
        timestamp: '2026-10-04 11:30:00 PST',
        status: 'in_progress',
        metrics: { ventilatedTruckTemp: '13.5°C', crateVibration: '0.12g Low' },
        valuationAtStage: { grossMarketRate: 68.0, costsToSellPerKg: 7.70, fvlctsPerKg: 60.30, carryingAmountTotal: 373860 },
        blockHash: 'c7d12489abef0192348576123490857612349085761234908576123490857612',
        txSignature: '30440220984576ac...verified'
      }
    ]
  },

  // 4. INVENTORY (IAS 2): Regular Milled Rice in Central Warehouse
  {
    id: 'BATCH-2026-PH-RC-0188',
    commodity: 'Regular Milled Rice',
    variety: 'RMR Well-Polished (Sinandomeng)',
    quantityKg: 28000,
    unitPricePhp: 44.50,
    fvlctsPerKg: 41.68,
    totalGrossValuePhp: 1246000,
    totalCarryingValuePhp: 1167040,
    ias41Classification: 'INVENTORY_IAS2',
    growthMaturityPct: 100,
    daysToHarvest: 0,
    harvestTimestamp: '2026-09-28 08:00:00 PST',
    origin: 'Tarlac Rice Producers Multi-Purpose Cooperative',
    originCoords: '15.4802° N, 120.5979° E',
    destination: 'Food Terminal Inc. (FTI) Regional Depot, Clark',
    status: 'delivered',
    currentStageIndex: 3,
    coldChainCompliance: 99.6,
    currentTemperatureC: 24.2,
    targetTempRange: 'Ambient Dry (20°C - 28°C)',
    manifestHash: '1987ca990184ca7719873bac019827364188ca0045e8910a129038ba7721890c',
    signatureEcdsa: '30440220881903ba88219087c2b01984288cfa990184ca7719873bac019827364188ca00022045e8910a129038ba7721890cf2210081a9bc77180220881903ba88219087c2b019',
    signerAuthority: 'National Food Authority (NFA) / DA Region III Rice Taskforce',
    publicKey: 'PUBKEY_SECP256R1_NFA_TARLAC_0188',
    timestamp: '2026-10-01 10:15:00 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 980000,
      harvestFairValue: 1148000,
      unrealizedBioGainLoss: +168000,
      estimatedCostsToSellDeducted: 78960,
      reportingStandard: 'IAS 2 Inventories (Lower of Cost and NRV)'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Paddy Palay Threshing & Moisture Reduction',
        iasCategory: 'AGRICULTURAL_PRODUCE',
        operator: 'Tarlac Coop Mill 1',
        regulatoryBody: 'National Food Authority',
        location: 'Concepcion, Tarlac',
        timestamp: '2026-09-28 08:00:00 PST',
        status: 'completed',
        metrics: { moisture: '13.9%', headRiceYield: '64.2%', chalkiness: '1.2%' },
        valuationAtStage: { grossMarketRate: 43.0, costsToSellPerKg: 2.82, fvlctsPerKg: 40.18, carryingAmountTotal: 1125040 },
        blockHash: '1987ca990184ca7719873bac019827364188ca0045e8910a129038ba7721890c',
        txSignature: '30440220881903ba...verified'
      },
      {
        stageNumber: 2,
        title: 'Precision Milling, Destoning & 50kg Bagging',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'Tarlac Milling Plant',
        regulatoryBody: 'Bureau of Agriculture and Fisheries Standards',
        location: 'Concepcion, Tarlac',
        timestamp: '2026-09-29 15:40:00 PST',
        status: 'completed',
        metrics: { sackCount: '560 bags', sealType: 'Tamper-Evident Stitched RFID' },
        valuationAtStage: { grossMarketRate: 44.0, costsToSellPerKg: 2.82, fvlctsPerKg: 41.18, carryingAmountTotal: 1153040 },
        blockHash: '7721890cf2210081a9bc77180220881903ba88219087c2b01984288cfa990184',
        txSignature: '3044022045e8910a...verified'
      },
      {
        stageNumber: 3,
        title: 'Palletized Covered Fleet Transit to Clark',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'North Express Freight Co.',
        regulatoryBody: 'Clark Development Corporation Logistics Gate',
        location: 'SCTEX Subic-Clark Corridor',
        timestamp: '2026-09-30 09:10:00 PST',
        status: 'completed',
        metrics: { tarpaulinSeal: 'Intact', humidity: '55% RH' },
        valuationAtStage: { grossMarketRate: 44.5, costsToSellPerKg: 2.82, fvlctsPerKg: 41.68, carryingAmountTotal: 1167040 },
        blockHash: '881903ba88219087c2b01984288cfa990184ca7719873bac019827364188ca00',
        txSignature: '304502210081a9bc...verified'
      },
      {
        stageNumber: 4,
        title: 'Clark Regional Agricultural Food Terminal Delivery',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'FTI Northern Logistics Hub',
        regulatoryBody: 'Department of Agriculture Inspectorate',
        location: 'Clark Freeport Zone, Pampanga',
        timestamp: '2026-10-01 10:15:00 PST',
        status: 'completed',
        metrics: { warehouseSilo: 'Bay C-4', inspectionResult: 'Zero Infestation' },
        valuationAtStage: { grossMarketRate: 44.5, costsToSellPerKg: 2.82, fvlctsPerKg: 41.68, carryingAmountTotal: 1167040 },
        blockHash: 'COMPLETED_DELIVERY_HASH_0188',
        txSignature: '30440220881903ba88219087c2b01984288cfa990184ca7719873bac019827364188ca00'
      }
    ]
  },

  // 5. BIOLOGICAL ASSET (IAS 41): Standing Irrigated Rice Paddy Crop (Pre-Harvest)
  {
    id: 'BATCH-2026-PH-BIO-0120',
    commodity: 'Premium Rice (Palay)',
    variety: 'NSIC Rc 222 (Tubigan 21)',
    quantityKg: 35000,
    unitPricePhp: 48.0,
    fvlctsPerKg: 44.20,
    totalGrossValuePhp: 1680000,
    totalCarryingValuePhp: 1547000,
    ias41Classification: 'BIOLOGICAL_ASSET',
    growthMaturityPct: 90,
    daysToHarvest: 10,
    harvestTimestamp: 'Est. 2026-10-16 (Standing Crop)',
    origin: 'Concepcion Farmers Irrigators Association, Tarlac',
    originCoords: '15.3245° N, 120.6543° E',
    destination: 'On-Farm Standing Field (Pre-Harvest)',
    status: 'verified',
    currentStageIndex: 0,
    coldChainCompliance: 100.0,
    currentTemperatureC: 29.0,
    targetTempRange: 'Ambient Field (24°C - 34°C)',
    manifestHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    signatureEcdsa: '304402203914bc819024bc89102834bca9102834bca9102834bca9102834bca9102834bc0220e4c7a10294bc123089ef01a942bc891024bc019842a98124bc89102834bca00',
    signerAuthority: 'National Irrigation Administration (NIA) / DA Region III',
    publicKey: 'PUBKEY_SECP256R1_NIA_TARLAC_0120',
    timestamp: '2026-10-05 07:00:00 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 1260000,
      harvestFairValue: 1547000,
      unrealizedBioGainLoss: +287000,
      estimatedCostsToSellDeducted: 133000,
      reportingStandard: 'IAS 41: Biological Assets (Paddy Crop at Fair Value)'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Grain Ripening & Irrigation Water Discharge',
        iasCategory: 'BIOLOGICAL_ASSET',
        operator: 'Concepcion Irrigators Group',
        regulatoryBody: 'National Irrigation Administration (NIA)',
        location: 'Concepcion, Tarlac (Canal Sector 3)',
        timestamp: '2026-10-05 07:00:00 PST',
        status: 'in_progress',
        metrics: { grainFilling: '90% Hard Dough', panicleColor: 'Golden Yellow', waterLevel: 'Drained' },
        valuationAtStage: { grossMarketRate: 48.0, costsToSellPerKg: 3.80, fvlctsPerKg: 44.20, carryingAmountTotal: 1547000 },
        blockHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
        txSignature: '304402203914bc81...verified'
      }
    ]
  },

  // 6. INVENTORY (IAS 2): White Onions - Cold-Chain Incident Breach
  {
    id: 'BATCH-2026-PH-WO-0079',
    commodity: 'White Onions',
    variety: 'Yellow Granex Giant',
    quantityKg: 8200,
    unitPricePhp: 145.0,
    fvlctsPerKg: 136.75,
    totalGrossValuePhp: 1189000,
    totalCarryingValuePhp: 1121350,
    ias41Classification: 'INVENTORY_IAS2',
    growthMaturityPct: 100,
    daysToHarvest: 0,
    harvestTimestamp: '2026-10-03 07:00:00 PST',
    origin: 'Bayambang Farmers Union, Pangasinan',
    originCoords: '15.8115° N, 120.4578° E',
    destination: 'Dinalupihan Regional Exchange, Bataan',
    status: 'flagged',
    currentStageIndex: 1,
    coldChainCompliance: 74.1,
    currentTemperatureC: 7.2,
    targetTempRange: '-1°C to +2°C',
    manifestHash: '99e810fae12089bac19808a287ce884218bbca7721890cf2210081a9bc771899',
    signatureEcdsa: '3044022033881903ba88219087c2b01984288cfa990184ca7719873bac019827364188ca00022099e810fae12089bac19808a287ce884218bbca7721890cf2210081a9bc771899',
    signerAuthority: 'Pangasinan Provincial Agriculture Office',
    publicKey: 'PUBKEY_SECP256R1_PANG_BAYAMBANG_0079',
    timestamp: '2026-10-04 16:30:00 UTC',
    tampered: false,
    tamperedField: null,
    financialLedger: {
      initialBiologicalValue: 984000,
      harvestFairValue: 1121350,
      unrealizedBioGainLoss: +137350,
      estimatedCostsToSellDeducted: 67650,
      reportingStandard: 'IAS 2 Inventories (Subject to IAS 36 Impairment Write-Down)'
    },
    stages: [
      {
        stageNumber: 1,
        title: 'Farm Gate Curing & Bagging',
        iasCategory: 'AGRICULTURAL_PRODUCE',
        operator: 'Bayambang Processing Station',
        regulatoryBody: 'Bureau of Plant Industry',
        location: 'Bayambang, Pangasinan',
        timestamp: '2026-10-03 07:00:00 PST',
        status: 'completed',
        metrics: { moisture: '12.1%', bulbSize: 'Jumbo Class A' },
        valuationAtStage: { grossMarketRate: 142.0, costsToSellPerKg: 8.25, fvlctsPerKg: 133.75, carryingAmountTotal: 1096750 },
        blockHash: '99e810fae12089bac19808a287ce884218bbca7721890cf2210081a9bc771899',
        txSignature: '3044022033881903...verified'
      },
      {
        stageNumber: 2,
        title: 'Tarlac Cold Transit Depot - Sensor Breach',
        iasCategory: 'INVENTORY_IAS2',
        operator: 'Central Luzon Cold Depots Ltd.',
        regulatoryBody: 'DA Region III Post-Harvest Audit',
        location: 'Tarlac City Depot Hub',
        timestamp: '2026-10-04 16:30:00 PST',
        status: 'flagged',
        metrics: { chamberTemp: '7.2°C (EXCEEDED LIMIT)', alarmCode: 'COLD_BREACH_ERR_404' },
        valuationAtStage: { grossMarketRate: 145.0, costsToSellPerKg: 8.25, fvlctsPerKg: 136.75, carryingAmountTotal: 1121350 },
        blockHash: '99e810fae12089bac19808a287ce884218bbca7721890cf2210081a9bc771899',
        txSignature: '3044022033881903...verified'
      }
    ]
  }
];
