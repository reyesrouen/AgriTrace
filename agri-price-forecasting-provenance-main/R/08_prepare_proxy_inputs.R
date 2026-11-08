source("R/00_common.R")
source("R/07_prepare_weekly_inputs.R")

prepare_proxy_inputs <- function() {
  Sys.setenv(AGRI_PRICE_PROXY_MODE = "true")
  proxy_root <- project_path("data/proxy")
  dir.create(proxy_root, recursive = TRUE, showWarnings = FALSE)
  status <- proxy_status()

  weekly_prices <- prepare_weekly_prices(
    output_path = "data/proxy/weekly_prices.csv"
  )
  weekly_prices$data_status <- status
  utils::write.csv(
    weekly_prices,
    file.path(proxy_root, "weekly_prices.csv"),
    row.names = FALSE
  )
  weeks <- sort(unique(as.Date(weekly_prices$week_start)))

  candidates <- prepare_fuel_price_candidates(
    output_path = "data/proxy/fuel_price_candidates_undated.csv"
  )
  ron91_mean <- mean(candidates$reported_price)
  if (!is.finite(ron91_mean) || ron91_mean <= 0) {
    stop("Unable to calculate a finite positive RON 91 proxy from local report values.")
  }
  fuel_proxy <- data.frame(
    week_start = as.character(weeks),
    fuel_type = "RON 91 STANDARD; undated cross-report mean proxy; not diesel",
    price_php_l = ron91_mean,
    data_status = status,
    mapping = "Same undated cross-report mean repeated for each week; no report-to-week mapping exists.",
    stringsAsFactors = FALSE
  )
  utils::write.csv(
    fuel_proxy,
    file.path(proxy_root, "weekly_fuel_proxy.csv"),
    row.names = FALSE
  )

  climate_proxy <- prepare_weekly_climatology_normals(
    weeks,
    output_path = "data/proxy/weekly_climate_proxy_estimates.csv"
  )
  climate_proxy$data_status <- status
  climate_proxy$value_status <- NULL
  utils::write.csv(
    climate_proxy,
    file.path(proxy_root, "weekly_climate_proxy.csv"),
    row.names = FALSE
  )

  fuel_reports <- utils::read.csv(
    project_path("data/raw/Fuel_Prices_Pampanga_filtered.csv"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  report_files <- sort(unique(as.character(fuel_reports$Source_File)))
  if (!length(report_files) || anyNA(report_files) || any(!nzchar(report_files))) {
    stop("Fuel source file contains an empty report filename.")
  }
  citation_status <- "UNVERIFIED LOCAL FILENAME; PLACEHOLDER DATE"
  local_citations <- c(
    "local://data/raw/Commodities_pampanga_filtered.csv",
    paste0(
      "local://data/raw/Fuel_Prices_Pampanga_filtered.csv#",
      report_files
    ),
    "local://data/raw/Climatological_Normals_filtered.csv"
  )
  source_register <- data.frame(
    dataset = c(
      "monthly_price_interpolation",
      rep("ron91_undated_proxy", length(report_files)),
      "climatology_weekly_proxy"
    ),
    organization = "Publisher/source URL unavailable in provided files",
    source_url = local_citations,
    accessed_on = "1900-01-01",
    file_name = c(
      "data/raw/Commodities_pampanga_filtered.csv",
      rep("data/raw/Fuel_Prices_Pampanga_filtered.csv", length(report_files)),
      "data/raw/Climatological_Normals_filtered.csv"
    ),
    report_file = c(NA_character_, report_files, NA_character_),
    citation_status = citation_status,
    stringsAsFactors = FALSE
  )
  utils::write.csv(
    source_register,
    file.path(proxy_root, "source_register.csv"),
    row.names = FALSE,
    na = ""
  )

  message(
    "Prepared proxy-only inputs under data/proxy/. The fuel series is an undated RON 91 ",
    "cross-report average, the weather values are estimates from long-term monthly normals, ",
    "and source citations use an explicit placeholder date. These are not observed weekly ",
    "diesel/rainfall data or verified citations."
  )
  invisible(list(
    weekly_prices = weekly_prices,
    weekly_fuel = fuel_proxy,
    weekly_climate = climate_proxy,
    source_register = source_register
  ))
}
