library(testthat)
test_project_root <- if (file.exists(file.path("R", "00_common.R"))) {
  getwd()
} else if (file.exists(file.path("..", "R", "00_common.R"))) {
  normalizePath("..", winslash = "/", mustWork = TRUE)
} else {
  stop("Could not locate the project root from the test directory.")
}
setwd(test_project_root)

source("R/00_common.R")
source("R/01_manifest_gen.R")
source("R/03_forecasting_models.R")
source("R/05_verify_pipeline.R")
source("R/06_evaluate_models.R")
source("R/07_prepare_weekly_inputs.R")
source("R/08_prepare_proxy_inputs.R")

test_that("source validation checks the provided raw file names and weekly schemas", {
  expect_setequal(
    required_source_files(),
    c(
      "data/raw/Commodities_pampanga_filtered.csv",
      "data/raw/Fuel_Prices_Pampanga_filtered.csv",
      "data/raw/Climatological_Normals_filtered.csv",
      "data/raw/source_register.csv"
    )
  )
})

test_that("proxy mode is explicit and isolates its inputs and outputs", {
  previous_mode <- Sys.getenv("AGRI_PRICE_PROXY_MODE", unset = NA_character_)
  on.exit({
    if (is.na(previous_mode)) {
      Sys.unsetenv("AGRI_PRICE_PROXY_MODE")
    } else {
      Sys.setenv(AGRI_PRICE_PROXY_MODE = previous_mode)
    }
  }, add = TRUE)

  Sys.unsetenv("AGRI_PRICE_PROXY_MODE")
  expect_false(proxy_mode())
  expect_true("data/raw/Commodities_pampanga_filtered.csv" %in% required_source_files())

  Sys.setenv(AGRI_PRICE_PROXY_MODE = "true")
  expect_true(proxy_mode())
  expect_true(all(startsWith(required_source_files(), "data/proxy/")))
  expect_match(processed_path("forecasts.csv"), "data/proxy/processed")
  expect_match(proxy_status(), "NOT OBSERVED DIESEL OR WEEKLY RAINFALL")
})

test_that("SARIMAX omits constant proxy regressors", {
  previous_mode <- Sys.getenv("AGRI_PRICE_PROXY_MODE", unset = NA_character_)
  on.exit({
    if (is.na(previous_mode)) {
      Sys.unsetenv("AGRI_PRICE_PROXY_MODE")
    } else {
      Sys.setenv(AGRI_PRICE_PROXY_MODE = previous_mode)
    }
  }, add = TRUE)
  Sys.setenv(AGRI_PRICE_PROXY_MODE = "true")

  training <- data.frame(
    price_php_kg = 100 + seq_len(104) / 10 + sin(seq_len(104) / 8),
    fuel_proxy_lag7 = rep(50, 104),
    climatology_normal_estimate_lag14 = 20 + sin(seq_len(104) / 6)
  )
  future <- data.frame(
    fuel_proxy_lag7 = rep(50, 8),
    climatology_normal_estimate_lag14 = 20 + sin((105:112) / 6)
  )

  expect_message(
    prediction <- forecast_with_model("SARIMAX", training, future, 8L),
    "omitted constant regressors: fuel_proxy_lag7"
  )
  expect_length(prediction, 8L)
  expect_true(all(is.finite(prediction)))
})

test_that("monthly observed prices are interpolated to labeled weekly estimates", {
  output_path <- "data/processed/test_weekly_prices_interpolated.csv"
  on.exit(unlink(project_path(output_path)), add = TRUE)
  weekly <- prepare_weekly_prices(output_path = output_path)

  expect_equal(nrow(weekly), 978L)
  expect_setequal(unique(weekly$commodity), c(
    "regular_milled_rice",
    "red_onions",
    "tomatoes"
  ))
  expect_true(all(as.POSIXlt(as.Date(weekly$week_start))$wday == 1L))
  expect_true(all(
    weekly$value_status == "LINEARLY INTERPOLATED FROM MONTHLY OBSERVATIONS"
  ))
  expect_true(all(is.finite(weekly$price_php_kg) & weekly$price_php_kg > 0))
  expect_true(all(as.Date(weekly$week_start) >= as.Date(weekly$source_date_start)))
  expect_true(all(as.Date(weekly$week_start) <= as.Date(weekly$source_date_end)))
})

test_that("preprocessing reports missing real weekly fuel, rainfall and citations", {
  blockers <- inspect_weekly_source_gaps()
  expect_true(any(grepl("no report/effective date", blockers, fixed = TRUE)))
  expect_true(any(grepl("no diesel product", blockers, fixed = TRUE)))
  expect_true(any(grepl("climatological normals", blockers, fixed = TRUE)))
  expect_true(any(grepl("source_register.csv was not created", blockers, fixed = TRUE)))
})

test_that("fuel prices and climatology are parsed without inventing weekly observations", {
  fuel_path <- "data/processed/test_fuel_price_candidates.csv"
  weather_path <- "data/processed/test_weekly_climatology.csv"
  on.exit(unlink(c(project_path(fuel_path), project_path(weather_path))), add = TRUE)

  fuel <- prepare_fuel_price_candidates(output_path = fuel_path)
  expect_true(nrow(fuel) > 0L)
  expect_false("week_start" %in% names(fuel))
  expect_true(all(grepl("DATE NOT PRESENT", fuel$date_status, fixed = TRUE)))
  expect_true(all(fuel$product == "STANDARD"))

  weeks <- seq.Date(as.Date("2026-01-05"), by = "7 days", length.out = 4L)
  weather <- prepare_weekly_climatology_normals(weeks, output_path = weather_path)
  expect_equal(nrow(weather), 16L)
  expect_setequal(unique(weather$station), c("clark", "cabanatuan", "iba", "subic_bay"))
  expect_true(all(weather$value_status ==
    "INTERPOLATED LONG-TERM CLIMATOLOGICAL NORMAL; NOT OBSERVED WEEKLY RAINFALL"))
  expect_true(all(is.finite(weather$rainfall_mm) & weather$rainfall_mm >= 0))
})

test_that("pipeline signature helpers support the documented no-argument workflow", {
  expect_true(is.function(sign_pipeline_artifacts))
  expect_true(is.function(refresh_pipeline_signature))
  expect_true(is.function(refresh_pipeline_signatures))
  expect_true("private_key" %in% names(formals(refresh_pipeline_signature)))
})

test_that("signed data is accepted and altered data is rejected", {
  run_integrity_test <- function() {
    temp_dir <- tempfile("integrity_test_", tmpdir = project_path("data/processed"))
    dir.create(temp_dir)
    on.exit(unlink(temp_dir, recursive = TRUE), add = TRUE)
    private_key <- openssl::ec_keygen(curve = "P-256")
    keys <- list(private = private_key, public = as.list(private_key)$pubkey)
    data_path <- file.path(temp_dir, "sample.csv")
    manifest_path <- file.path(temp_dir, "sample.json")

    writeLines("week_start,price\n2026-01-05,200", data_path)
    signed <- create_manifest(data_path, keys$private)
    jsonlite::write_json(signed, manifest_path, auto_unbox = TRUE)
    expect_true(verify_manifest(manifest_path, keys$public))

    changed_manifest <- signed
    changed_manifest$manifest$artifact_path <- "data/processed/other.csv"
    jsonlite::write_json(changed_manifest, manifest_path, auto_unbox = TRUE)
    expect_error(
      verify_manifest(manifest_path, keys$public),
      "\\[SECURITY HALT\\] Invalid ECDSA signature"
    )

    jsonlite::write_json(signed, manifest_path, auto_unbox = TRUE)
    writeLines("week_start,price\n2026-01-05,999", data_path)
    expect_error(
      verify_manifest(manifest_path, keys$public),
      "\\[SECURITY HALT\\] SHA-256 mismatch"
    )
  }
  run_integrity_test()
})

test_that("only short internal missing gaps are interpolated", {
  dates <- seq.Date(as.Date("2026-01-05"), by = "7 days", length.out = 5L)
  expect_equal(
    interpolate_short_gaps(c(1, 2, NA, 4, 5), dates, "test"),
    c(1, 2, 3, 4, 5)
  )
  expect_error(
    interpolate_short_gaps(c(1, NA, NA, NA, 5), dates, "test"),
    "longer than 2 weeks"
  )
  expect_error(
    interpolate_short_gaps(c(NA, 2, 3, 4, 5), dates, "test"),
    "leading or trailing missing value"
  )
  expect_error(
    interpolate_short_gaps(c(1, 2, 3, 4, NA), dates, "test"),
    "leading or trailing missing value"
  )
  expect_error(
    interpolate_short_gaps(
      c(1, 2, 3, NA, 5),
      dates,
      "test",
      cutoff = dates[[3L]]
    ),
    "future data is never used"
  )
})

test_that("accuracy metrics are computed from supplied observations", {
  result <- calculate_metrics(
    actual = c(10, 20),
    predicted = c(8, 24),
    training_values = c(9, 10, 11, 12)
  )
  expect_equal(result$MAE, 3)
  expect_equal(result$RMSE, sqrt(10))
  expect_equal(result$MAPE, 20)
  expect_equal(result$MASE, 3)
  expect_true(detect_price_spike(100, 105, 0.05))
  expect_false(detect_price_spike(100, 104, 0.05))
})
