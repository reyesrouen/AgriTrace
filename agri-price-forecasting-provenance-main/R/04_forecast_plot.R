source("R/00_common.R")

create_forecast_plot <- function() {
  aligned <- utils::read.csv(
    processed_path("pampanga_aligned_weekly.csv"),
    stringsAsFactors = FALSE
  )
  forecasts <- utils::read.csv(
    processed_path("pampanga_forecasts.csv"),
    stringsAsFactors = FALSE
  )
  aligned$week_start <- as.Date(aligned$week_start)
  forecasts$week_start <- as.Date(forecasts$week_start)
  forecasts <- forecasts[forecasts$model == "SARIMAX", , drop = FALSE]

  price_actual <- data.frame(
    week_start = aligned$week_start,
    commodity = aligned$commodity,
    panel = "Commodity price (PHP/kg)",
    value = aligned$price_php_kg,
    series = "Observed price"
  )
  price_forecast <- data.frame(
    week_start = forecasts$week_start,
    commodity = forecasts$commodity,
    panel = "Commodity price (PHP/kg)",
    value = forecasts$predicted_php_kg,
    series = "SARIMAX forecast"
  )
  fuel <- data.frame(
    week_start = aligned$week_start,
    commodity = aligned$commodity,
    panel = if (proxy_mode()) "RON 91 proxy (PHP/L)" else "Diesel (PHP/L)",
    value = if (proxy_mode()) aligned$fuel_proxy_lag7 else aligned$diesel_lag7,
    series = if (proxy_mode()) "Undated mean proxy; 7-day position" else "7-day lag"
  )
  rainfall <- data.frame(
    week_start = aligned$week_start,
    commodity = aligned$commodity,
    panel = if (proxy_mode()) "Climatology estimate (mm)" else "Rainfall (mm)",
    value = if (proxy_mode()) {
      aligned$climatology_normal_estimate_lag14
    } else {
      aligned$rainfall_lag14
    },
    series = if (proxy_mode()) "Climate-normal estimate; 14-day position" else "14-day lag"
  )
  plot_data <- rbind(price_actual, price_forecast, fuel, rainfall)
  if (proxy_mode()) {
    plot_data$series <- paste0(plot_data$series, " (PROXY ONLY)")
  }
  plot_subtitle <- if (proxy_mode()) {
    "PROVISIONAL PROXY ONLY: RON 91 mean and climate normals; not observed diesel/rainfall"
  } else {
    "Forecast panel shows SARIMAX; evaluation forecasts are out-of-sample"
  }
  plot <- ggplot2::ggplot(
    plot_data,
    ggplot2::aes(x = week_start, y = value, color = series, linetype = series)
  ) +
    ggplot2::geom_line(na.rm = TRUE) +
    ggplot2::facet_grid(panel ~ commodity, scales = "free_y") +
    ggplot2::labs(
      title = "Pampanga commodity prices, forecasts and lagged external factors",
      subtitle = plot_subtitle,
      x = NULL,
      y = NULL,
      color = NULL,
      linetype = NULL
    ) +
    ggplot2::theme_minimal() +
    ggplot2::theme(legend.position = "bottom")

  output_path <- processed_path("pampanga_forecasts_plot.png")
  ggplot2::ggsave(output_path, plot = plot, width = 14, height = 9, dpi = 160)
  invisible(output_path)
}
