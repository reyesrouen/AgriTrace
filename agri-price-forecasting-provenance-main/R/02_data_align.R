source("R/00_common.R")

align_weekly_data <- function() {
  validate_source_files()
  validate_source_register()

  if (proxy_mode()) {
    prices <- read_csv_checked(
      "data/proxy/weekly_prices.csv",
      c("week_start", "commodity", "price_php_kg", "value_status")
    )
    fuel_reports <- read_csv_checked(
      "data/proxy/weekly_fuel_proxy.csv",
      c("week_start", "fuel_type", "price_php_l", "data_status", "mapping")
    )
    weather <- read_csv_checked(
      "data/proxy/weekly_climate_proxy.csv",
      c("week_start", "station", "rainfall_mm", "data_status")
    )
  } else {
    prices <- read_csv_checked(
      "data/raw/Commodities_pampanga_filtered.csv",
      c("week_start", "commodity", "price_php_kg")
    )
    fuel_reports <- read_csv_checked(
      "data/raw/Fuel_Prices_Pampanga_filtered.csv",
      c("week_start", "fuel_type", "price_php_l")
    )
    weather <- read_csv_checked(
      "data/raw/Climatological_Normals_filtered.csv",
      c("week_start", "station", "rainfall_mm")
    )
  }

  prices$week_start <- parse_week_start(prices$week_start, "weekly_prices.week_start")
  fuel_reports$week_start <- parse_week_start(
    fuel_reports$week_start,
    "fuel_reports.week_start"
  )
  weather$week_start <- parse_week_start(weather$week_start, "weekly_weather.week_start")
  prices$price_php_kg <- parse_numeric_column(prices$price_php_kg, "price_php_kg")
  fuel_reports$price_php_l <- parse_numeric_column(
    fuel_reports$price_php_l,
    "fuel_reports.price_php_l"
  )
  weather$rainfall_mm <- parse_numeric_column(weather$rainfall_mm, "rainfall_mm")
  prices$commodity <- normalize_commodity(prices$commodity)

  required_commodities <- c("regular_milled_rice", "red_onions", "tomatoes")
  if (anyNA(prices$commodity) || !setequal(unique(prices$commodity), required_commodities)) {
    stop(
      "weekly_prices must contain only the three required commodity IDs: ",
      paste(required_commodities, collapse = ", ")
    )
  }
  if (any(prices$price_php_kg <= 0) || any(fuel_reports$price_php_l <= 0) ||
      any(weather$rainfall_mm < 0)) {
    stop("Prices must be positive and rainfall must be non-negative.")
  }
  if (anyNA(fuel_reports$fuel_type) || any(!nzchar(trimws(fuel_reports$fuel_type)))) {
    stop("fuel_reports.fuel_type must be populated for every source record.")
  }
  if (!proxy_mode() &&
      (nrow(fuel_reports) != 1395L || length(unique(fuel_reports$week_start)) != 211L)) {
    stop("fuel_reports.csv must contain the 1,395 source entries from 211 weekly reports.")
  }
  if (proxy_mode()) {
    fuel <- data.frame(
      week_start = fuel_reports$week_start,
      fuel_proxy_price_php_l = fuel_reports$price_php_l
    )
  } else {
    diesel_reports <- grepl("diesel", tolower(trimws(fuel_reports$fuel_type)))
    if (!any(diesel_reports)) stop("fuel_reports.csv contains no diesel records.")
    fuel <- stats::aggregate(
      price_php_l ~ week_start,
      data = fuel_reports[diesel_reports, , drop = FALSE],
      FUN = mean
    )
    names(fuel)[names(fuel) == "price_php_l"] <- "diesel_price_php_l"
  }

  station_key <- tolower(gsub("[^a-z0-9]+", "", weather$station))
  station_aliases <- c(
    "clark" = "clark",
    "clarkpampanga" = "clark",
    "cabanatuan" = "cabanatuan",
    "cabanatuannuevaecija" = "cabanatuan",
    "iba" = "iba",
    "ibazambales" = "iba",
    "subicbay" = "subic_bay",
    "subicbaycubiptzambales" = "subic_bay",
    "cubipt" = "subic_bay"
  )
  weather$station <- unname(station_aliases[station_key])
  required_stations <- c("clark", "cabanatuan", "iba", "subic_bay")
  if (anyNA(weather$station) || !setequal(unique(weather$station), required_stations)) {
    stop("weekly_weather must contain Clark, Cabanatuan, Iba and Subic Bay observations.")
  }

  price_start <- min(prices$week_start)
  price_end <- max(prices$week_start)
  if (format(price_start, "%Y-%m") != "2020-05" || format(price_end, "%Y") != "2026") {
    stop("The weekly price timeline must begin in May 2020 and include observations dated in 2026.")
  }
  model_start <- max(price_start, min(fuel$week_start), min(weather$week_start))
  model_end <- min(price_end, max(fuel$week_start), max(weather$week_start))
  if (model_end < model_start || format(model_end, "%Y") != "2026") {
    stop("Weekly price, diesel and rainfall sources must overlap through 2026.")
  }
  dates <- seq.Date(model_start, model_end, by = "7 days")
  if (length(dates) < 182L) {
    stop("The overlapping weekly source timeline contains fewer than 182 observations.")
  }
  training_cutoff <- dates[length(dates) - 181L + 103L]
  week_offset <- function(dates) as.numeric(dates - model_start)
  if (any(week_offset(prices$week_start) %% 7 != 0) ||
      any(week_offset(fuel$week_start) %% 7 != 0) ||
      any(week_offset(weather$week_start) %% 7 != 0)) {
    stop("All source records must use the same seven-day week_start calendar.")
  }

  prices <- stats::aggregate(
    price_php_kg ~ week_start + commodity,
    data = prices,
    FUN = mean
  )
  if (proxy_mode()) {
    fuel <- stats::aggregate(
      fuel_proxy_price_php_l ~ week_start,
      data = fuel,
      FUN = mean
    )
  } else {
    fuel <- stats::aggregate(
      diesel_price_php_l ~ week_start,
      data = fuel,
      FUN = mean
    )
  }
  weather <- stats::aggregate(
    rainfall_mm ~ week_start + station,
    data = weather,
    FUN = mean
  )

  aligned_parts <- vector("list", length(required_commodities))
  quality_rows <- list()
  for (i in seq_along(required_commodities)) {
    commodity <- required_commodities[[i]]
    series <- prices[prices$commodity == commodity, , drop = FALSE]
    values <- series$price_php_kg[match(dates, series$week_start)]
    missing_before <- sum(is.na(values))
    values <- interpolate_short_gaps(
      values,
      dates,
      paste(commodity, "price"),
      cutoff = training_cutoff
    )
    aligned_parts[[i]] <- data.frame(
      week_start = dates,
      commodity = commodity,
      price_php_kg = values
    )
    quality_rows[[length(quality_rows) + 1L]] <- data.frame(
      dataset = commodity,
      source_rows = nrow(series),
      interpolated_weeks = missing_before,
      weekly_reports = NA_integer_
    )
  }

  fuel_column <- if (proxy_mode()) "fuel_proxy_price_php_l" else "diesel_price_php_l"
  fuel_values <- fuel[[fuel_column]][match(dates, fuel$week_start)]
  fuel_missing <- sum(is.na(fuel_values))
  fuel_values <- interpolate_short_gaps(
    fuel_values,
    dates,
    if (proxy_mode()) "RON 91 proxy" else "diesel price",
    cutoff = training_cutoff
  )
  quality_rows[[length(quality_rows) + 1L]] <- data.frame(
    dataset = "DOE fuel reports",
    source_rows = nrow(fuel_reports),
    interpolated_weeks = fuel_missing,
    weekly_reports = length(unique(fuel_reports$week_start))
  )

  station_rainfall <- matrix(
    NA_real_,
    nrow = length(dates),
    ncol = length(required_stations),
    dimnames = list(NULL, required_stations)
  )
  for (station in required_stations) {
    station_rows <- weather[weather$station == station, , drop = FALSE]
    values <- station_rows$rainfall_mm[match(dates, station_rows$week_start)]
    missing_before <- sum(is.na(values))
    values <- interpolate_short_gaps(
      values,
      dates,
      paste(station, "rainfall"),
      cutoff = training_cutoff
    )
    station_rainfall[, station] <- values
    quality_rows[[length(quality_rows) + 1L]] <- data.frame(
      dataset = paste0("rainfall_", station),
      source_rows = nrow(station_rows),
      interpolated_weeks = missing_before,
      weekly_reports = NA_integer_
    )
  }

  weather_mean <- rowMeans(station_rainfall)
  base <- data.frame(
    week_start = dates,
    rainfall_mm = weather_mean
  )
  base[[fuel_column]] <- fuel_values
  fuel_lag_column <- if (proxy_mode()) "fuel_proxy_lag7" else "diesel_lag7"
  rainfall_lag_column <- if (proxy_mode()) {
    "climatology_normal_estimate_lag14"
  } else {
    "rainfall_lag14"
  }
  base[[fuel_lag_column]] <- c(NA_real_, head(base[[fuel_column]], -1L))
  base[[rainfall_lag_column]] <- c(NA_real_, NA_real_, head(base$rainfall_mm, -2L))

  aligned <- do.call(rbind, aligned_parts)
  aligned <- merge(aligned, base, by = "week_start", all = FALSE, sort = TRUE)
  aligned <- aligned[complete.cases(aligned), , drop = FALSE]
  aligned <- aligned[order(aligned$commodity, aligned$week_start), , drop = FALSE]
  if (proxy_mode()) {
    aligned$data_status <- proxy_status()
    aligned$price_status <- "INTERPOLATED FROM MONTHLY OBSERVATIONS; NOT WEEKLY OBSERVATIONS"
    aligned$weather_status <- "WEEKLY ESTIMATE FROM MONTHLY CLIMATOLOGICAL NORMALS; NOT OBSERVED RAINFALL"
  }
  rownames(aligned) <- NULL

  unique_weeks <- sort(unique(aligned$week_start))
  if (length(unique_weeks) < 182L) {
    stop("Only ", length(unique_weeks), " complete weeks remain; at least 182 are required.")
  }

  output_dir <- processed_dir()
  dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
  utils::write.csv(
    aligned,
    file.path(output_dir, "pampanga_aligned_weekly.csv"),
    row.names = FALSE
  )
  quality <- do.call(rbind, quality_rows)
  if (proxy_mode()) quality$data_status <- proxy_status()
  quality$timeline_start <- as.character(min(dates))
  quality$timeline_end <- as.character(max(dates))
  quality$price_source_start <- as.character(price_start)
  quality$price_source_end <- as.character(price_end)
  quality$available_weeks <- length(dates)
  utils::write.csv(
    quality,
    file.path(output_dir, "data_quality_report.csv"),
    row.names = FALSE
  )
  aligned
}
