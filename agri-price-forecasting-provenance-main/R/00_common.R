project_root <- function() {
  root <- normalizePath(getwd(), winslash = "/", mustWork = TRUE)
  required <- c("R", "data", "run_all.R")
  missing <- required[!file.exists(file.path(root, required))]
  if (length(missing)) {
    stop("Run this pipeline from the project root. Missing: ", paste(missing, collapse = ", "))
  }
  root
}

project_path <- function(path) {
  file.path(project_root(), path)
}

proxy_mode <- function() {
  identical(tolower(Sys.getenv("AGRI_PRICE_PROXY_MODE")), "true")
}

processed_dir <- function() {
  path <- if (proxy_mode()) "data/proxy/processed" else "data/processed"
  project_path(path)
}

processed_path <- function(path) {
  file.path(processed_dir(), path)
}

proxy_status <- function() {
  if (proxy_mode()) "PROVISIONAL PROXY ONLY; NOT OBSERVED DIESEL OR WEEKLY RAINFALL" else NULL
}

required_source_files <- function() {
  if (proxy_mode()) {
    return(c(
      "data/proxy/weekly_prices.csv",
      "data/proxy/weekly_fuel_proxy.csv",
      "data/proxy/weekly_climate_proxy.csv",
      "data/proxy/source_register.csv"
    ))
  }
  c(
    "data/raw/Commodities_pampanga_filtered.csv",
    "data/raw/Fuel_Prices_Pampanga_filtered.csv",
    "data/raw/Climatological_Normals_filtered.csv",
    "data/raw/source_register.csv"
  )
}

validate_source_files <- function() {
  paths <- required_source_files()
  full_paths <- vapply(paths, project_path, character(1))
  missing <- paths[!file.exists(full_paths)]
  schema <- if (proxy_mode()) {
    list(
      "data/proxy/weekly_prices.csv" = c("week_start", "commodity", "price_php_kg"),
      "data/proxy/weekly_fuel_proxy.csv" =
        c("week_start", "fuel_type", "price_php_l", "data_status"),
      "data/proxy/weekly_climate_proxy.csv" =
        c("week_start", "station", "rainfall_mm", "data_status")
    )
  } else {
    list(
      "data/raw/Commodities_pampanga_filtered.csv" =
        c("week_start", "commodity", "price_php_kg"),
      "data/raw/Fuel_Prices_Pampanga_filtered.csv" =
        c("week_start", "fuel_type", "price_php_l"),
      "data/raw/Climatological_Normals_filtered.csv" =
        c("week_start", "station", "rainfall_mm")
    )
  }
  incompatible <- vapply(names(schema), function(path) {
    full_path <- project_path(path)
    if (!file.exists(full_path)) return(NA_character_)
    columns <- names(utils::read.csv(
      full_path,
      nrows = 0L,
      stringsAsFactors = FALSE,
      check.names = FALSE
    ))
    absent <- setdiff(schema[[path]], columns)
    if (!length(absent)) return(NA_character_)
    paste0(
      path, " is not a compatible weekly source file; missing columns: ",
      paste(absent, collapse = ", "),
      ". Prepare dated weekly observations with the documented schema; do not ",
      "infer weekly fuel dates or measured rainfall from undated reports or climatological normals."
    )
  }, character(1))
  incompatible <- incompatible[!is.na(incompatible)]

  errors <- character()
  if (length(missing)) {
    errors <- c(errors, paste0(
      "Missing required source files:\n- ",
      paste(missing, collapse = "\n- ")
    ))
  }
  if (length(incompatible)) errors <- c(errors, incompatible)
  if (length(errors)) {
    opening <- if (proxy_mode()) {
      "The explicitly provisional proxy run needs its generated proxy inputs."
    } else {
      "The pipeline needs real, dated weekly input files before it can run."
    }
    stop(
      opening, "\n",
      paste(errors, collapse = "\n"),
      "\nSee README.md for the required columns. Do not use AgriTrace forecast/ledger exports as source observations."
    )
  }
  invisible(TRUE)
}

read_csv_checked <- function(path, required_columns) {
  full_path <- project_path(path)
  if (!file.exists(full_path)) stop("Required file not found: ", path)
  data <- utils::read.csv(full_path, stringsAsFactors = FALSE, check.names = FALSE)
  missing <- setdiff(required_columns, names(data))
  if (length(missing)) {
    stop(path, " is missing required columns: ", paste(missing, collapse = ", "))
  }
  if (!nrow(data)) stop(path, " contains a header but no observations.")
  data
}

parse_week_start <- function(values, label) {
  dates <- as.Date(values, format = "%Y-%m-%d")
  if (anyNA(dates)) stop(label, " must contain valid YYYY-MM-DD dates.")
  dates
}

parse_numeric_column <- function(values, label) {
  parsed <- suppressWarnings(as.numeric(values))
  if (anyNA(parsed) || any(!is.finite(parsed))) {
    stop(label, " must contain finite numeric values with no blanks.")
  }
  parsed
}

normalize_commodity <- function(values) {
  key <- tolower(trimws(values))
  key <- gsub("[^a-z0-9]+", "_", key)
  key <- gsub("^_|_$", "", key)
  aliases <- c(
    "regular_milled_rice" = "regular_milled_rice",
    "rice_regular_milled" = "regular_milled_rice",
    "red_onions" = "red_onions",
    "onions_red" = "red_onions",
    "tomatoes" = "tomatoes",
    "tomato" = "tomatoes"
  )
  unname(aliases[key])
}

interpolate_short_gaps <- function(values, dates, label, max_gap = 2L, cutoff = NULL) {
  missing <- is.na(values)
  if (!any(missing)) return(values)

  runs <- rle(missing)
  missing_run_lengths <- runs$lengths[runs$values]
  if (length(missing_run_lengths) && max(missing_run_lengths) > max_gap) {
    stop(
      label, " has a missing weekly gap longer than ", max_gap,
      " weeks. Obtain/correct the source data; large gaps are not interpolated."
    )
  }
  observed <- which(!missing)
  if (!length(observed) || any(missing[c(1L, length(values))])) {
    stop(label, " has a leading or trailing missing value; interpolation is not allowed.")
  }
  if (!is.null(cutoff)) {
    if (any(dates[missing] > as.Date(cutoff))) {
      stop(label, " has missing holdout observations; future data is never used to fill evaluation targets.")
    }
    cutoff_index <- max(which(dates <= as.Date(cutoff)))
    run_starts <- cumsum(c(1L, head(runs$lengths, -1L)))
    for (run in which(runs$values)) {
      run_end <- run_starts[[run]] + runs$lengths[[run]] - 1L
      if (run_end + 1L > cutoff_index) {
        stop(label, " has a gap whose interpolation would use data after the training cutoff.")
      }
    }
  }
  stats::approx(
    x = as.numeric(dates[observed]),
    y = values[observed],
    xout = as.numeric(dates),
    method = "linear",
    rule = 1
  )$y
}

validate_source_register <- function() {
  if (proxy_mode()) {
    register <- read_csv_checked(
      "data/proxy/source_register.csv",
      c(
        "dataset", "organization", "source_url", "accessed_on",
        "file_name", "report_file", "citation_status"
      )
    )
    expected <- c(
      "monthly_price_interpolation",
      "ron91_undated_proxy",
      "climatology_weekly_proxy"
    )
    if (!all(expected %in% register$dataset) || anyDuplicated(register)) {
      stop("Proxy source register must cite each proxy dataset without duplicate rows.")
    }
    if (any(!grepl("^local://data/raw/", register$source_url)) ||
        any(register$accessed_on != "1900-01-01") ||
        any(register$citation_status != "UNVERIFIED LOCAL FILENAME; PLACEHOLDER DATE")) {
      stop("Proxy citations must retain their explicit unverified/placeholder labels.")
    }
    if (any(!file.exists(vapply(register$file_name, project_path, character(1))))) {
      stop("A local file referenced by the proxy source register is missing.")
    }
    return(invisible(register))
  }
  register <- read_csv_checked(
    "data/raw/source_register.csv",
    c("dataset", "organization", "source_url", "accessed_on", "file_name")
  )
  expected <- c(
    "weekly_prices_wfp",
    "weekly_prices_psa",
    "weekly_fuel",
    "weekly_weather"
  )
  if (anyDuplicated(register$dataset)) {
    stop("source_register.csv must contain exactly one citation per dataset.")
  }
  missing <- setdiff(expected, register$dataset)
  if (length(missing)) {
    stop("Source register is missing dataset citations for: ", paste(missing, collapse = ", "))
  }
  rows <- register[match(expected, register$dataset), , drop = FALSE]
  for (column in c("organization", "source_url", "accessed_on", "file_name")) {
    if (anyNA(rows[[column]]) || any(!nzchar(trimws(rows[[column]])))) {
      stop("Source register contains an empty ", column, " value.")
    }
  }
  if (any(!grepl("^https?://", rows$source_url))) {
    stop("Every source_register source_url must be a public http(s) URL.")
  }
  organization_patterns <- c(
    "wfp|world food programme",
    "psa|statistics authority",
    "department of energy|\\bdoe\\b",
    "\\bpagasa\\b"
  )
  for (i in seq_along(expected)) {
    if (!grepl(organization_patterns[[i]], tolower(rows$organization[[i]]))) {
      stop("Incorrect organization for source_register dataset ", expected[[i]], ".")
    }
  }
  if (anyNA(as.Date(rows$accessed_on, format = "%Y-%m-%d"))) {
    stop("Every source_register accessed_on value must use YYYY-MM-DD.")
  }
  invisible(register)
}
