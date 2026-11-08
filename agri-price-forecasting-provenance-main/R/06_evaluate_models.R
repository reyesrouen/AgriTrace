source("R/00_common.R")
source("R/01_manifest_gen.R")

calculate_metrics <- function(actual, predicted, training_values) {
  errors <- actual - predicted
  mase_scale <- mean(abs(diff(training_values)))
  data.frame(
    MAE = mean(abs(errors)),
    RMSE = sqrt(mean(errors^2)),
    MAPE = mean(abs(errors / actual)) * 100,
    MASE = if (is.finite(mase_scale) && mase_scale > 0) {
      mean(abs(errors)) / mase_scale
    } else {
      NA_real_
    }
  )
}

detect_price_spike <- function(previous_price, current_price, threshold) {
  if (length(previous_price) != length(current_price) ||
      any(previous_price <= 0) || any(!is.finite(previous_price)) ||
      any(!is.finite(current_price)) || threshold < 0) {
    stop("Spike detection requires finite prices, positive prior prices and a valid threshold.")
  }
  (current_price / previous_price - 1) >= threshold
}

evaluate_forecasts <- function(forecasts, aligned) {
  forecasts$week_start <- as.Date(forecasts$week_start)
  aligned$week_start <- as.Date(aligned$week_start)
  groups <- split(
    forecasts,
    interaction(forecasts$commodity, forecasts$model, forecasts$split, drop = TRUE)
  )
  metrics <- lapply(groups, function(rows) {
    training <- aligned[
      aligned$commodity == rows$commodity[[1L]],
      ,
      drop = FALSE
    ]
    training <- training[order(training$week_start), , drop = FALSE]
    training <- head(tail(training$price_php_kg, 182L), 104L)
    score <- calculate_metrics(
      rows$actual_php_kg,
      rows$predicted_php_kg,
      training
    )
    cbind(
      data.frame(
        commodity = rows$commodity[[1L]],
        model = rows$model[[1L]],
        split = rows$split[[1L]],
        observations = nrow(rows)
      ),
      score
    )
  })
  accuracy <- do.call(rbind, metrics)
  if (proxy_mode()) {
    accuracy$analysis_status <- proxy_status()
    accuracy$metric_caveat <- paste(
      "Scores compare predictions with linearly interpolated monthly values;",
      "they are not out-of-sample accuracy on observed weekly prices."
    )
  }
  rownames(accuracy) <- NULL
  utils::write.csv(
    accuracy,
    processed_path("model_accuracy_metrics.csv"),
    row.names = FALSE
  )

  holdout <- forecasts[forecasts$split != "Training", , drop = FALSE]
  groups <- split(
    holdout,
    interaction(holdout$commodity, holdout$model, holdout$split, drop = TRUE)
  )
  alert_details <- list()
  sensitivity <- lapply(groups, function(rows) {
    rows <- rows[order(rows$week_start), , drop = FALSE]
    previous_prediction <- rows$previous_predicted_php_kg
    actual_jump <- rows$actual_php_kg / rows$previous_actual_php_kg - 1
    predicted_jump <- rows$predicted_php_kg / previous_prediction - 1
    do.call(rbind, lapply(c(0.05, 0.10, 0.15), function(threshold) {
      actual_alert <- detect_price_spike(
        rows$previous_actual_php_kg,
        rows$actual_php_kg,
        threshold
      )
      predicted_alert <- detect_price_spike(
        previous_prediction,
        rows$predicted_php_kg,
        threshold
      )
      alert_details[[length(alert_details) + 1L]] <<- data.frame(
        week_start = rows$week_start,
        commodity = rows$commodity,
        model = rows$model,
        split = rows$split,
        threshold = threshold,
        predicted_change_pct = predicted_jump * 100,
        actual_change_pct = actual_jump * 100,
        predicted_alert = predicted_alert,
        actual_spike = actual_alert
      )
      tp <- sum(actual_alert & predicted_alert)
      fp <- sum(!actual_alert & predicted_alert)
      fn <- sum(actual_alert & !predicted_alert)
      precision <- if (tp + fp) tp / (tp + fp) else NA_real_
      recall <- if (tp + fn) tp / (tp + fn) else NA_real_
      f1 <- if (is.finite(precision) && is.finite(recall) && precision + recall > 0) {
        2 * precision * recall / (precision + recall)
      } else {
        NA_real_
      }
      data.frame(
        commodity = rows$commodity[[1L]],
        model = rows$model[[1L]],
        split = rows$split[[1L]],
        threshold = threshold,
        observations = nrow(rows),
        true_positives = tp,
        false_positives = fp,
        false_negatives = fn,
        precision = precision,
        recall = recall,
        F1 = f1
      )
    }))
  })
  sensitivity <- do.call(rbind, sensitivity)
  rownames(sensitivity) <- NULL
  alerts <- do.call(rbind, alert_details)
  if (proxy_mode()) {
    sensitivity$analysis_status <- proxy_status()
    alerts$analysis_status <- proxy_status()
    sensitivity$metric_caveat <- "Spike metrics use interpolated prices and proxy predictors; not validated performance."
    alerts$metric_caveat <- "Alerts use interpolated prices and proxy predictors; not validated observations."
  }
  rownames(alerts) <- NULL
  utils::write.csv(
    alerts,
    processed_path("price_spike_alerts.csv"),
    row.names = FALSE
  )
  utils::write.csv(
    sensitivity,
    processed_path("price_spike_sensitivity.csv"),
    row.names = FALSE
  )
  list(accuracy = accuracy, sensitivity = sensitivity, alerts = alerts)
}

run_tamper_trials <- function(keys, cases_per_class = 100L) {
  output_dir <- processed_dir()
  temp_dir <- tempfile("tamper_trials_", tmpdir = output_dir)
  dir.create(temp_dir)
  on.exit(unlink(temp_dir, recursive = TRUE), add = TRUE)

  results <- vector("list", cases_per_class * 2L)
  set.seed(20261108)
  for (i in seq_len(cases_per_class)) {
    data_path <- file.path(temp_dir, paste0("normal_", i, ".csv"))
    manifest_path <- file.path(temp_dir, paste0("normal_", i, ".json"))
    content <- paste(
      "case,value",
      paste(i, sample.int(100000L, 1L), sep = ","),
      sep = "\n"
    )
    writeLines(content, data_path, useBytes = TRUE)
    signed <- create_manifest(data_path, keys$private)
    jsonlite::write_json(signed, manifest_path, auto_unbox = TRUE)
    verify_manifest(manifest_path, keys$public)
    results[[i]] <- data.frame(
      case_id = i,
      expected = "VERIFIED",
      observed = "VERIFIED",
      passed = TRUE
    )

    tampered_path <- file.path(temp_dir, paste0("tampered_", i, ".csv"))
    tampered_manifest <- file.path(temp_dir, paste0("tampered_", i, ".json"))
    writeLines(content, tampered_path, useBytes = TRUE)
    signed_tampered <- create_manifest(tampered_path, keys$private)
    jsonlite::write_json(signed_tampered, tampered_manifest, auto_unbox = TRUE)
    writeLines(paste0(content, "\nmodified"), tampered_path, useBytes = TRUE)
    rejected <- tryCatch(
      {
        verify_manifest(tampered_manifest, keys$public)
        FALSE
      },
      error = function(error) {
        if (!grepl("\\[SECURITY HALT\\]", conditionMessage(error))) stop(error)
        TRUE
      }
    )
    results[[cases_per_class + i]] <- data.frame(
      case_id = cases_per_class + i,
      expected = "REJECTED",
      observed = if (rejected) "REJECTED" else "ACCEPTED",
      passed = rejected
    )
  }
  report <- do.call(rbind, results)
  if (nrow(report) != 200L || sum(report$passed) != 200L) {
    stop("Tamper test failed: expected 100 valid and 100 modified cases to be handled correctly.")
  }
  if (proxy_mode()) report$analysis_status <- proxy_status()
  utils::write.csv(
    report,
    processed_path("security_tamper_test_results.csv"),
    row.names = FALSE
  )
  report
}
