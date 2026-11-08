source("R/00_common.R")

prepare_weekly_prices <- function(
  input_path = "data/raw/Commodities_pampanga_filtered.csv",
  output_path = "data/processed/weekly_prices_interpolated.csv"
) {
  input <- read_csv_checked(
    input_path,
    c("date", "commodity", "unit", "pricetype", "currency", "price")
  )
  input <- input[
    input$unit == "KG" &
      input$pricetype == "Retail" &
      input$currency == "PHP" &
      input$commodity %in% c(
        "Rice (regular, milled)",
        "Onions (red)",
        "Tomatoes"
      ),
    ,
    drop = FALSE
  ]
  if (!nrow(input)) {
    stop("No target retail commodity observations in PHP/kg were found.")
  }

  input$observation_date <- as.Date(input$date, format = "%Y-%m-%d")
  if (anyNA(input$observation_date)) {
    stop("Commodity source contains invalid dates; expected YYYY-MM-DD.")
  }
  input$price <- parse_numeric_column(input$price, "commodity price")
  if (any(input$price <= 0)) stop("Commodity prices must be positive.")
  input$commodity <- normalize_commodity(input$commodity)

  monthly <- stats::aggregate(
    price ~ observation_date + commodity,
    data = input,
    FUN = mean
  )
  required_commodities <- c("regular_milled_rice", "red_onions", "tomatoes")
  missing_commodities <- setdiff(required_commodities, unique(monthly$commodity))
  if (length(missing_commodities)) {
    stop("Commodity source is missing: ", paste(missing_commodities, collapse = ", "))
  }

  first_date <- min(monthly$observation_date)
  last_date <- max(monthly$observation_date)
  first_wday <- as.POSIXlt(first_date)$wday
  last_wday <- as.POSIXlt(last_date)$wday
  first_monday <- first_date + (1L - first_wday) %% 7L
  last_monday <- last_date - (last_wday - 1L) %% 7L
  weeks <- seq.Date(first_monday, last_monday, by = "7 days")
  if (!length(weeks)) stop("No complete Monday week-start dates fall within source coverage.")

  weekly <- do.call(rbind, lapply(required_commodities, function(commodity) {
    series <- monthly[monthly$commodity == commodity, , drop = FALSE]
    series <- series[order(series$observation_date), , drop = FALSE]
    data.frame(
      week_start = as.character(weeks),
      commodity = commodity,
      price_php_kg = stats::approx(
        x = as.numeric(series$observation_date),
        y = series$price,
        xout = as.numeric(weeks),
        method = "linear",
        rule = 1
      )$y,
      value_status = "LINEARLY INTERPOLATED FROM MONTHLY OBSERVATIONS",
      source_date_start = as.character(first_date),
      source_date_end = as.character(last_date),
      stringsAsFactors = FALSE
    )
  }))
  weekly <- weekly[!is.na(weekly$price_php_kg), , drop = FALSE]
  if (!nrow(weekly)) stop("No weekly prices could be interpolated within source coverage.")

  full_output_path <- project_path(output_path)
  dir.create(dirname(full_output_path), recursive = TRUE, showWarnings = FALSE)
  utils::write.csv(weekly, full_output_path, row.names = FALSE)
  message(
    "Wrote ", nrow(weekly), " linearly interpolated price estimates to ",
    output_path, ". These are estimates between monthly observations, not observed weekly prices."
  )
  invisible(weekly)
}

prepare_fuel_price_candidates <- function(
  input_path = "data/raw/Fuel_Prices_Pampanga_filtered.csv",
  output_path = "data/processed/fuel_report_price_candidates.csv"
) {
  reports <- read_csv_checked(
    input_path,
    c("Source_File", "Page", "Municipality", "Product", "Raw_Prices", "Full_Line_Clean")
  )
  tokens <- strsplit(as.character(reports$Raw_Prices), "\\|")
  candidates <- lapply(seq_len(nrow(reports)), function(i) {
    prices <- suppressWarnings(as.numeric(trimws(tokens[[i]])))
    valid <- which(is.finite(prices) & prices > 0)
    if (!length(valid)) return(NULL)
    data.frame(
      source_report = reports$Source_File[[i]],
      page = reports$Page[[i]],
      municipality = reports$Municipality[[i]],
      product = reports$Product[[i]],
      report_text = reports$Full_Line_Clean[[i]],
      value_order_in_report = valid,
      reported_price = prices[valid],
      date_status = "REPORT DATE NOT PRESENT IN SOURCE FILE",
      stringsAsFactors = FALSE
    )
  })
  candidates <- Filter(Negate(is.null), candidates)
  if (!length(candidates)) stop("No numeric prices could be parsed from fuel reports.")
  candidates <- do.call(rbind, candidates)
  full_output_path <- project_path(output_path)
  dir.create(dirname(full_output_path), recursive = TRUE, showWarnings = FALSE)
  utils::write.csv(candidates, full_output_path, row.names = FALSE)
  message(
    "Parsed ", nrow(candidates), " undated fuel-price entries to ", output_path,
    ". They are not weekly prices and are not identified as diesel."
  )
  invisible(candidates)
}

prepare_weekly_climatology_normals <- function(
  weeks,
  input_path = "data/raw/Climatological_Normals_filtered.csv",
  output_path = "data/processed/weekly_climatology_normal_estimates.csv"
) {
  weather <- suppressWarnings(utils::read.csv(
    project_path(input_path),
    skip = 5L,
    stringsAsFactors = FALSE,
    check.names = FALSE
  ))
  months <- month.abb
  if (!"Weather Station" %in% names(weather) || !all(months %in% names(weather))) {
    stop("Climatology file needs a Weather Station row and Jan-Dec normal columns.")
  }
  station_keys <- gsub(
    "[^a-z0-9]+",
    "",
    tolower(weather[["Weather Station"]])
  )
  station_aliases <- c(
    "cabanatuannuevaecija" = "cabanatuan",
    "clarkpampanga" = "clark",
    "ibazambales" = "iba",
    "subicbaycubiptzambales" = "subic_bay"
  )
  stations <- unname(station_aliases[station_keys])
  if (anyNA(stations) ||
      !setequal(stations, c("clark", "cabanatuan", "iba", "subic_bay"))) {
    stop("Climatology file must contain Clark, Cabanatuan, Iba and Subic Bay.")
  }
  weeks <- sort(unique(as.Date(weeks)))
  if (!length(weeks) || anyNA(weeks)) stop("Valid week-start dates are required.")

  weekly <- do.call(rbind, lapply(seq_len(nrow(weather)), function(i) {
    monthly_normals <- parse_numeric_column(
      unlist(weather[i, months], use.names = FALSE),
      paste(stations[[i]], "monthly climatological rainfall normal")
    )
    weekly_values <- vapply(weeks, function(week) {
      days <- week + 0:6
      month_index <- as.POSIXlt(days)$mon + 1L
      month_start <- as.Date(format(days, "%Y-%m-01"))
      next_month <- as.Date(format(month_start + 32L, "%Y-%m-01"))
      month_days <- as.numeric(next_month - month_start)
      sum(monthly_normals[month_index] / month_days)
    }, numeric(1))
    data.frame(
      week_start = as.character(weeks),
      station = stations[[i]],
      rainfall_mm = weekly_values,
      value_status = paste(
        "INTERPOLATED LONG-TERM CLIMATOLOGICAL NORMAL;",
        "NOT OBSERVED WEEKLY RAINFALL"
      ),
      stringsAsFactors = FALSE
    )
  }))
  full_output_path <- project_path(output_path)
  dir.create(dirname(full_output_path), recursive = TRUE, showWarnings = FALSE)
  utils::write.csv(weekly, full_output_path, row.names = FALSE)
  message(
    "Wrote weekly estimates of long-term climatological normals to ", output_path,
    ". These are not observed weekly rainfall."
  )
  invisible(weekly)
}

inspect_weekly_source_gaps <- function() {
  blockers <- character()
  fuel_path <- project_path("data/raw/Fuel_Prices_Pampanga_filtered.csv")
  fuel <- utils::read.csv(
    fuel_path,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  date_columns <- intersect(
    c("week_start", "report_date", "effective_date", "date"),
    names(fuel)
  )
  product_text <- tolower(paste(
    fuel$Product,
    fuel$Full_Line_Clean,
    collapse = " "
  ))
  if (!length(date_columns)) {
    blockers <- c(
      blockers,
      "Fuel reports have no report/effective date column; report_NNN filenames cannot establish weekly dates."
    )
  }
  if (!grepl("diesel", product_text, fixed = TRUE)) {
    blockers <- c(
      blockers,
      "Fuel report rows contain no diesel product; the available STANDARD/RON 91 prices are not diesel."
    )
  }

  weather_path <- project_path("data/raw/Climatological_Normals_filtered.csv")
  weather_text <- readLines(weather_path, warn = FALSE)
  if (!any(grepl("week_start|observation_date|rainfall_mm", weather_text, ignore.case = TRUE))) {
    blockers <- c(
      blockers,
      paste(
        "The weather file contains monthly 30-year climatological normals.",
        "Interpolated weekly normal estimates are not dated weekly rainfall observations."
      )
    )
  }

  register_path <- project_path("data/raw/source_register.csv")
  if (!file.exists(register_path)) {
    blockers <- c(
      blockers,
      paste(
        "source_register.csv was not created: verified source URLs and access dates",
        "are not present in the supplied files and must not be fabricated."
      )
    )
  }
  blockers
}

prepare_weekly_inputs <- function() {
  weekly_prices <- prepare_weekly_prices()
  fuel_price_candidates <- prepare_fuel_price_candidates()
  climatology <- prepare_weekly_climatology_normals(
    unique(as.Date(weekly_prices$week_start))
  )
  blockers <- inspect_weekly_source_gaps()
  if (length(blockers)) {
    message(
      "Only the dated monthly commodity prices could be processed. The forecasting pipeline ",
      "still cannot run:\n- ",
      paste(blockers, collapse = "\n- ")
    )
  }
  invisible(list(
    weekly_prices = weekly_prices,
    fuel_price_candidates = fuel_price_candidates,
    climatology = climatology,
    blockers = blockers,
    source_register_created = FALSE
  ))
}
