/**
 * Data Export Utility for IAS 41 Provenance Ledger & Forecasting Engine
 * Supports Excel (.xlsx) and CSV (.csv) exports using SheetJS (xlsx)
 */

import { measureBatchCarryingValue } from './ias41Valuation';

/**
 * Initiates browser file download for a given Blob
 */
export function downloadBlob(blob, filename) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('File exports are only available in a browser.');
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Exports JSON records to Microsoft Excel (.xlsx) format
 */
export async function exportToExcel(dataArray, sheetName = 'Data', filename = 'export.xlsx') {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new RangeError('Cannot export an empty data set.');
  }
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });
  downloadBlob(blob, filename);
}

/**
 * Exports JSON records to Comma-Separated Values (.csv) format
 */
export function exportToCSV(dataArray, filename = 'export.csv') {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new RangeError('Cannot export an empty data set.');
  }
  const columns = [...new Set(dataArray.flatMap((row) => Object.keys(row)))];
  const csvValue = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const csvOutput = [
    columns.map(csvValue).join(','),
    ...dataArray.map((row) => columns.map((column) => csvValue(row[column])).join(','))
  ].join('\r\n');
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Transforms filtered batches into tabular format for accounting export
 */
export function formatBatchesForExport(batches) {
  return batches.map((b) => {
    const measurement = measureBatchCarryingValue(b);
    return {
      'Batch ID': b.id,
      'Commodity': b.commodity,
      'Variety': b.variety || 'Standard',
      'IAS Classification': b.ias41Classification === 'BIOLOGICAL_ASSET'
        ? 'IAS 41: Biological Asset (Standing Crop)'
        : b.ias41Classification === 'AGRICULTURAL_PRODUCE'
        ? 'IAS 41: Produce at Harvest / IAS 2 Deemed Cost'
        : 'IAS 2: Inventory (Lower of Cost and NRV)',
      'Quantity (kg)': b.quantityKg,
      'Market Gross Price (PHP/kg)': b.tampered ? b.authenticUnitPricePhp : b.unitPricePhp,
      'Estimated FVLCTS / NRV (PHP/kg)': measurement.estimatedNRVPerKg ?? measurement.fvlctsPerKg,
      'Harvest-date Deemed Cost (PHP/kg)': measurement.deemedCostPerKg ?? measurement.fvlctsPerKg,
      'Carrying Value (PHP/kg)': measurement.carryingValuePerKg,
      'Total Carrying Value (PHP)': measurement.totalCarryingValuePhp,
      'Measurement Basis': measurement.measurementBasis,
      'Status': b.status.toUpperCase(),
      'Cold Chain Compliance (%)': b.coldChainCompliance,
      'Current Temp (°C)': b.tampered ? b.authenticCurrentTemperatureC : b.currentTemperatureC,
      'Origin': b.origin,
      'Destination': b.destination,
      'Harvest Timestamp': b.harvestTimestamp || 'Pre-Harvest (Standing)',
      'SHA-256 Manifest Hash': b.manifestHash,
      'ECDSA Signature': b.signatureEcdsa ? b.signatureEcdsa.substring(0, 32) + '...' : 'N/A',
      'Signer Authority': b.signerAuthority || 'DA/BPI Region III',
      'Tampered State': b.tampered ? 'TAMPERED / BREACHED' : 'SECURE / VERIFIED'
    };
  });
}

/**
 * Formats forecast points with multivariate regressors and IAS 41 FVLCTS for export
 */
export function formatForecastForExport(forecastChartData, commodityMetadata, valuationMode = 'fvlcts') {
  return forecastChartData.map((pt) => ({
    'Week / Date': pt.date,
    'Period Type': pt.isForecast ? 'Forecast (Future)' : 'Historical (Actual)',
    'Commodity': commodityMetadata.name,
    'Market Price (PHP/kg)': pt.price ?? (pt.isForecast ? pt.forecastValuation : null),
    'IAS 41 FVLCTS (PHP/kg)': pt.fvlctsPrice ?? (pt.isForecast ? pt.forecastValuation : null),
    'Forecast Estimate (PHP/kg)': pt.forecastValuation ?? null,
    'Confidence Band 95% Lower': pt.lower95 ?? pt.ciLower ?? null,
    'Confidence Band 95% Upper': pt.upper95 ?? pt.ciUpper ?? null,
    'SARIMAX Point Estimate': pt.sarimaxValuation ?? null,
    'Prophet Additive Estimate': pt.prophetValuation ?? null,
    'Holt-Winters Estimate': pt.holtWintersValuation ?? null,
    'Baseline Naive': pt.baselineValuation ?? null,
    'Exogenous Diesel Index (DOE)': pt.dieselIndex ?? null,
    'Exogenous Rainfall (mm)': pt.rainfallMm ?? null,
    'Typhoon Impact Index': pt.typhoonIndex ?? 0,
    'Valuation Metric Used': valuationMode === 'fvlcts' ? 'Fair Value Less Costs to Sell (IAS 41)' : 'Gross Active Wholesale Price (Level 1)'
  }));
}
