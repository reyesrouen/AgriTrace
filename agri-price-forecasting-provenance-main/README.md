# Tamper-Evident Agricultural Commodities Price Forecasting in Pampanga

This R project aligns weekly Pampanga prices for regular milled rice, red onions and tomatoes with dated diesel and rainfall observations. It runs chronological forecasts, computes out-of-sample accuracy and price-spike metrics, and signs source/output artifacts with SHA-256 and ECDSA P-256.

## Research goals

1. Forecast local prices for regular milled rice, red onions and tomatoes.
2. Measure the effect of lagged diesel prices and rainfall from four regional weather stations.
3. Generate and evaluate price-surge alerts at 5%, 10% and 15% week-over-week increases.
4. Detect changes to source data, processed data, model outputs and project scripts using signed manifests.
5. Test forecast accuracy and security behavior using holdout data and repeatable automated tests.

## Important: weekly inputs are required

The helper `prepare_weekly_prices()` in `R/07_prepare_weekly_inputs.R` filters the three target commodities from dated monthly observations and linearly interpolates them to Monday week-start dates. The output values are explicitly labeled as interpolated estimates, not observed weekly prices.

The other supplied files cannot provide the model's real weekly inputs: fuel rows identify report files but contain no report dates and no diesel product rows; the weather file contains 30-year monthly climatological normals, not measured weekly rainfall. Do not assign dates to fuel reports or disaggregate climate normals into purported weekly observations. AgriTrace ledger/forecast exports are outputs, not source data.

Run the local-source preprocessing from the project root:

```r
source("R/07_prepare_weekly_inputs.R")
result <- prepare_weekly_inputs()
```

This writes `data/processed/weekly_prices_interpolated.csv`, parses undated numeric fuel entries to `data/processed/fuel_report_price_candidates.csv`, and maps the monthly climate normals to explicitly labeled weekly normal estimates in `data/processed/weekly_climatology_normal_estimates.csv`. The estimates do not become observed weekly values. The fuel report filenames provide no dates and their `STANDARD` rows describe RON 91 in the report text, not diesel. The source files do not contain their original URLs or access dates, so no verified source register can be produced.

An optional **provisional proxy run** is available with `source("run_proxy.R")`. It uses the same undated cross-report mean RON 91 value for every week, weekly estimates derived from monthly climatology normals, and interpolated monthly prices. It writes inputs and forecast outputs under `data/proxy/`, with local filenames and an explicitly placeholder access date in `data/proxy/source_register.csv`. The proxy register is not verified provenance, and forecast metrics are not valid observed-week accuracy results. The regular `source("run_all.R")` path remains strict and requires real dated weekly inputs and verified public citations.

The proxy mode writes a separate `data/proxy/source_register.csv`. Each fuel report filename is listed as a local reference; its access date is the explicit placeholder `1900-01-01` and every row is marked `UNVERIFIED LOCAL FILENAME; PLACEHOLDER DATE`. These are not verified citations or a substitute for the regular pipeline's required public sources.

### Real `source_register.csv`

`source_register.csv` is also required. Record one row for each of `weekly_prices_wfp`, `weekly_prices_psa`, `weekly_fuel`, and `weekly_weather`, with the organization, exact public source URL, access date, and source filename. The two price citations document the inputs used to prepare the weekly commodity file. The pipeline checks for WFP, PSA, DOE and PAGASA citations, but the team must ensure each URL points to the exact dataset used.

Use the project’s specified crop-price span (May 2020 through 2026) and a consistent seven-day calendar. The aligned model period is the overlap of the crop, diesel and weather sources and must extend through 2026 and cover at least 182 weeks. Each crop and weather station must have continuous coverage apart from short, internal gaps of at most two weeks in the training period; those training-period gaps are linearly interpolated and counted in `data_quality_report.csv`. Gaps in testing/final-review observations, large gaps, edge gaps, or gaps that would require looking past the training cutoff stop the run. Fuel at week *t* is paired with the price at week *t+1* as the 7-day lag; rainfall is shifted by two weeks for the 14-day lag.

The evaluation uses the **latest 182 aligned weeks**: the first 104 weeks are the training set, the next 26 are the test set, and the final 52 are the review set. Earlier observations remain in the aligned history but are outside this fixed evaluation window. This interpretation keeps the full 2020–2026 data span while preserving the requested split sizes.

## Run

From the project root in R or RStudio:

```r
install.packages(c("digest", "openssl", "jsonlite", "forecast", "prophet", "ggplot2", "testthat"))
source("run_all.R")
```

The runner checks that the required files exist and match the weekly input schemas before doing other work. Until compatible weekly observations and the source register are supplied, it will report the missing files or schema columns and will not produce forecast accuracy or spike-sensitivity results.

To run the explicitly provisional local-file proxy workflow instead:

```r
source("run_proxy.R")
```

Proxy inputs, plots, forecast scores, and audit reports remain in `data/proxy/`. Their tables identify interpolated prices, constant undated RON 91 proxy values, climate-normal estimates, and placeholder citations. They demonstrate that the code can execute, but do not validate diesel effects, measured rainfall effects, or forecast accuracy on observed weekly prices.

To run the R tests from the project root:

```r
testthat::test_file("tests/test_security.R")
```

## What the pipeline generates

- `data/processed/pampanga_aligned_weekly.csv` — aligned crop prices and lagged predictors
- `data/processed/data_quality_report.csv` — source coverage and interpolation counts
- `data/processed/pampanga_forecasts.csv` — Naive, Trend, Seasonal Naive, SARIMAX and Meta Prophet test/review predictions
- `data/processed/pampanga_forecasts_plot.png` — observed prices, SARIMAX forecasts, diesel and rainfall panels
- `data/processed/model_accuracy_metrics.csv` — measured MAE, RMSE, MAPE and MASE by crop, model and split
- `data/processed/price_spike_alerts.csv` — forecast alerts and observed spikes at 5%, 10% and 15%
- `data/processed/price_spike_sensitivity.csv` — measured precision, recall and F1 by crop, model, split and threshold
- `data/processed/security_tamper_test_results.csv` — results of the 200 synthetic security test cases
- `data/processed/pipeline_audit.csv` and `data/manifests/` — verification results and signed artifact manifests

Forecast metrics and alert results are produced from the supplied observations; they are not estimates entered by hand. The forecasts, alert thresholds, and integrity checks do not establish that source data or assumptions are economically correct.

## Keys and GitHub

The first run creates `keys/private_key.pem` and `keys/public_key.pem`. The private key is excluded by `.gitignore`; keep a separate secure backup, do not share or commit it, and preserve the matching public key for verification. A lost private key cannot reproduce signatures from the old key pair.

The runner checks that the required weekly inputs exist before doing any work, then verifies existing signed manifests before forecasting. An edited input or project file stops the run instead of being silently re-approved. After reviewing an intentional change, explicitly approve the current project artifacts from the project root with `source("R/00_common.R"); source("R/01_manifest_gen.R"); source("R/05_verify_pipeline.R"); refresh_pipeline_signature()`. This command uses the existing signing key and refreshes the signed manifests; do not use it to bypass an unexplained integrity failure. The plural `refresh_pipeline_signatures()` name remains available as an alias. Keep the public key and signed manifests available to the team for later verification. For verification by another computer or team member, pin the expected public-key fingerprint through a trusted channel; a signature is only as trustworthy as the public key used to check it.

The project folder available in this workspace is not a Git repository, so this program cannot publish or confirm a GitHub backup. Initialize/use the team’s shared repository after reviewing the data licensing and ensuring the private key is excluded.
