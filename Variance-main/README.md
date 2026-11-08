# AgriTrace

AgriTrace is a React and Vite application for agricultural market monitoring, scenario forecasting, accounting-stage valuation estimates, and tamper-evident batch provenance.

## What it does

- **Stage-aware valuation:** Growing biological assets and produce at harvest are shown using modeled IAS 41 fair value less estimated costs to sell (FVLCTS). Produce is recognized at harvest-date FVLCTS, which becomes its deemed cost when transferred to IAS 2. Subsequent IAS 2 inventory is shown at the lower of that deemed cost and estimated net realizable value (NRV).
- **Scenario forecasting:** A JavaScript time-series forecast combines commodity price history with historical 7-day lagged diesel and 14-day rainfall observations. A multiple regression estimates the exogenous effects; fuel elasticity and per-variable scenario impacts are bounded to limit unstable extrapolation from small sample datasets. A seasonal baseline and storm scenario are also available.
- **Filtered exports:** Export the selected commodity’s history and forecast rows, or only one row type, as CSV or Excel. The batch ledger also supports search, stage/status filters, and CSV/Excel export.
- **Provenance details on demand:** Batch custody history and SHA-256/signature evidence are available in a detail drawer. A tamper simulation demonstrates the circuit breaker without placing dense hashes on the overview.

## Accounting and model limitations

Valuation and forecast outputs are estimates based on the bundled sample data and configured costs-to-sell assumptions. An IAS 2 inventory write-down compares the harvest-date deemed cost with estimated NRV; an IAS 41 FVLCTS estimate is not used as the IAS 2 carrying basis after harvest. Confirm the principal market, directly attributable selling costs, NRV assumptions, data quality, and reporting-date judgments before using results in financial reporting.

Forecast regressions and scenarios are illustrative and are not an independently validated statistical model. Integrity checks indicate whether a payload matches its registered digest/signature; they do not establish that the source data, market assumptions, or forecast are economically correct.

## Run locally

Requirements: Node.js 18+ and npm 9+.

```powershell
cd Variance-main
npm ci
npm run dev
```

Build and lint:

```powershell
npm run build
npm run lint
```

## Project structure

```text
src/
  components/       Overview, forecasts, provenance ledger, audit and navigation
  data/             Commodity histories, external observations and sample batches
  utils/
    forecaster.js   Time-series and historical exogenous regression calculations
    ias41Valuation.js
                    FVLCTS and IAS-stage carrying-value estimates
    exportUtils.js  Filtered CSV/Excel output
    cryptoSimulator.js
                    Demonstration payload-integrity gate
```
