source("R/00_common.R")

forecast_with_model <- function(model, training, future, horizon) {
  if (model == "Naive") {
    return(rep(tail(training$price_php_kg, 1L), horizon))
  }
  if (model == "Trend") {
    training$time_index <- seq_len(nrow(training))
    fit <- stats::lm(price_php_kg ~ time_index, data = training)
    return(as.numeric(stats::predict(
      fit,
      newdata = data.frame(time_index = seq.int(nrow(training) + 1L, nrow(training) + horizon))
    )))
  }
  if (model == "Seasonal Naive") {
    if (nrow(training) < 52L) stop("Seasonal Naive requires at least 52 training weeks.")
    return(rep(tail(training$price_php_kg, 52L), length.out = horizon))
  }
  fuel_regressor <- if (proxy_mode()) "fuel_proxy_lag7" else "diesel_lag7"
  weather_regressor <- if (proxy_mode()) {
    "climatology_normal_estimate_lag14"
  } else {
    "rainfall_lag14"
  }
  if (model == "SARIMAX") {
    regressors <- c(fuel_regressor, weather_regressor)
    varying_regressors <- regressors[vapply(
      training[, regressors, drop = FALSE],
      function(values) length(unique(values)) > 1L,
      logical(1)
    )]
    omitted_regressors <- setdiff(regressors, varying_regressors)
    if (length(omitted_regressors) > 0L) {
      message(
        "SARIMAX omitted constant regressors: ",
        paste(omitted_regressors, collapse = ", ")
      )
    }
    xreg <- if (length(varying_regressors) > 0L) {
      as.matrix(training[, varying_regressors, drop = FALSE])
    } else {
      NULL
    }
    future_xreg <- if (length(varying_regressors) > 0L) {
      as.matrix(future[, varying_regressors, drop = FALSE])
    } else {
      NULL
    }
    weekly_series <- stats::ts(training$price_php_kg, frequency = 52L)
    fit <- forecast::auto.arima(
      weekly_series,
      xreg = xreg,
      seasonal = TRUE,
      stepwise = FALSE,
      approximation = FALSE
    )
    return(as.numeric(forecast::forecast(fit, h = horizon, xreg = future_xreg)$mean))
  }
  if (model == "Meta Prophet") {
    training_frame <- data.frame(
      ds = as.POSIXct(training$week_start, tz = "UTC"),
      y = training$price_php_kg,
      fuel_predictor = training[[fuel_regressor]],
      weather_predictor = training[[weather_regressor]]
    )
    fit <- prophet::prophet(
      yearly.seasonality = TRUE,
      weekly.seasonality = FALSE,
      daily.seasonality = FALSE,
      uncertainty.samples = 0
    )
    fit <- prophet::add_regressor(fit, "fuel_predictor")
    fit <- prophet::add_regressor(fit, "weather_predictor")
    fit <- prophet::fit.prophet(fit, training_frame)
    future_frame <- data.frame(
      ds = as.POSIXct(future$week_start, tz = "UTC"),
      fuel_predictor = future[[fuel_regressor]],
      weather_predictor = future[[weather_regressor]]
    )
    return(as.numeric(stats::predict(fit, future_frame)$yhat))
  }
  stop("Unknown forecasting model: ", model)
}

run_forecasts <- function(aligned = NULL) {
  if (is.null(aligned)) {
    aligned <- utils::read.csv(
      processed_path("pampanga_aligned_weekly.csv"),
      stringsAsFactors = FALSE
    )
  }
  aligned$week_start <- as.Date(aligned$week_start)
  models <- c("Naive", "Trend", "Seasonal Naive", "SARIMAX", "Meta Prophet")
  weeks <- sort(unique(aligned$week_start))
  evaluation_weeks <- tail(weeks, 182L)
  if (length(evaluation_weeks) != 182L) {
    stop("The chronological evaluation window must contain exactly 182 weeks.")
  }
  split_labels <- c(
    rep("Training", 104L),
    rep("Testing", 26L),
    rep("Final Review", 52L)
  )
  split_dates <- data.frame(week_start = evaluation_weeks, split = split_labels)
  result <- list()

  commodities <- c("regular_milled_rice", "red_onions", "tomatoes")
  for (commodity in commodities) {
    series <- aligned[aligned$commodity == commodity, , drop = FALSE]
    series <- series[match(evaluation_weeks, series$week_start), , drop = FALSE]
    if (anyNA(series$week_start) || anyNA(series$price_php_kg)) {
      stop("Incomplete evaluation data for ", commodity, ".")
    }
    training <- series[seq_len(104L), , drop = FALSE]
    future <- series[seq.int(105L, 182L), , drop = FALSE]
    for (model in models) {
      predicted <- forecast_with_model(model, training, future, nrow(future))
      if (length(predicted) != nrow(future) || any(!is.finite(predicted))) {
        stop(model, " returned invalid forecasts for ", commodity, ".")
      }
      result[[length(result) + 1L]] <- data.frame(
        week_start = future$week_start,
        commodity = commodity,
        model = model,
        split = split_dates$split[match(future$week_start, split_dates$week_start)],
        actual_php_kg = future$price_php_kg,
        predicted_php_kg = predicted,
        previous_actual_php_kg = c(
          tail(training$price_php_kg, 1L),
          head(future$price_php_kg, -1L)
        ),
        previous_predicted_php_kg = c(
          tail(training$price_php_kg, 1L),
          head(predicted, -1L)
        )
      )
    }
  }

  forecasts <- do.call(rbind, result)
  if (proxy_mode()) {
    forecasts$analysis_status <- proxy_status()
    forecasts$price_status <- "INTERPOLATED FROM MONTHLY OBSERVATIONS; NOT WEEKLY OBSERVATIONS"
    forecasts$fuel_status <- paste(
      "CONSTANT CROSS-REPORT RON 91 MEAN; REPORT DATES UNKNOWN;",
      "NOT DIESEL OR A WEEKLY PRICE SERIES"
    )
    forecasts$weather_status <- "LONG-TERM CLIMATOLOGY ESTIMATE; NOT OBSERVED WEEKLY RAINFALL"
  }
  rownames(forecasts) <- NULL
  output_path <- processed_path("pampanga_forecasts.csv")
  utils::write.csv(forecasts, output_path, row.names = FALSE)
  forecasts
}
