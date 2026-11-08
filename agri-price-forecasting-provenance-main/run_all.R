source("R/00_common.R")
source("R/01_manifest_gen.R")
source("R/02_data_align.R")
source("R/03_forecasting_models.R")
source("R/04_forecast_plot.R")
source("R/05_verify_pipeline.R")
source("R/06_evaluate_models.R")

required_packages <- c("digest", "openssl", "jsonlite", "forecast", "prophet", "ggplot2")
missing_packages <- required_packages[
  !vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)
]
if (length(missing_packages)) {
  stop(
    "Install the required R packages before running the pipeline: ",
    paste(missing_packages, collapse = ", ")
  )
}

validate_source_files()
validate_source_register()

output_dir <- processed_dir()
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
keys <- ensure_signing_keys()

existing_manifests <- list.files(
  project_path("data/manifests"),
  pattern = "^pipeline_.*\\.json$",
  full.names = TRUE
)
if (length(existing_manifests)) {
  verify_all_pipeline_manifests(write_report = FALSE)
}

run_tamper_trials(keys)
refresh_pipeline_signatures(keys$private)

input_manifest_pattern <- if (proxy_mode()) {
  "^pipeline_data_proxy_.*\\.json$"
} else {
  "^pipeline_data_raw_.*\\.json$"
}
raw_manifests <- list.files(
 project_path("data/manifests"),
 pattern = input_manifest_pattern,
 full.names = TRUE
)
if (!length(raw_manifests)) stop("Input verification gate found no signed inputs.")
for (manifest in raw_manifests) verify_manifest(manifest, keys$public)
if (proxy_mode()) {
  message("PROXY MODE: signatures cover local proxy files; placeholder citations are not verified.")
} else {
  message("Raw-data SHA-256 and ECDSA verification passed.")
}

aligned <- align_weekly_data()
forecasts <- run_forecasts(aligned)
create_forecast_plot()
evaluate_forecasts(forecasts, aligned)

audit <- refresh_pipeline_signatures(keys$private)
if (!nrow(audit) || any(!audit$verified)) {
  stop("Final audit did not verify every signed raw and processed artifact.")
}

message("Pipeline completed. Audited ", nrow(audit), " signed artifacts.")
