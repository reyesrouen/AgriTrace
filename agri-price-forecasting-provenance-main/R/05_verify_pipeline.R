source("R/00_common.R")
source("R/01_manifest_gen.R")

verify_all_pipeline_manifests <- function(write_report = TRUE) {
  manifest_dir <- project_path("data/manifests")
  manifests <- list.files(
    manifest_dir,
    pattern = "^pipeline_.*\\.json$",
    full.names = TRUE
  )
  if (!length(manifests)) stop("No current pipeline manifests were found.")

  public_key <- openssl::read_pubkey(project_path("keys/public_key.pem"))
  results <- lapply(manifests, function(path) {
    verify_manifest(path, public_key)
    signed <- jsonlite::fromJSON(path, simplifyVector = FALSE)
    data.frame(
      artifact_path = signed$manifest$artifact_path,
      sha256_hash = signed$manifest$sha256_hash,
      signature_algorithm = signed$manifest$signature_algorithm,
      verified = TRUE,
      stringsAsFactors = FALSE
    )
  })
  audit <- do.call(rbind, results)
  if (proxy_mode()) audit$verification_scope <- "PROXY INPUTS; PLACEHOLDER CITATIONS NOT VERIFIED"
  if (write_report) {
    utils::write.csv(
      audit,
      processed_path("pipeline_audit.csv"),
      row.names = FALSE
    )
  }
  audit
}

pipeline_source_files <- function() {
  source_files <- c(
    list.files(project_path("R"), pattern = "\\.R$", full.names = TRUE),
    project_path(c(
      "run_all.R",
      "run_pipeline.R",
      "run_proxy.R",
      "demo_security_halt.R",
      "config.yml",
      "README.md",
      "tests/test_security.R"
    ))
  )
  source_files <- source_files[file.exists(source_files)]
  source_files
}

sign_pipeline_artifacts <- function(private_key = ensure_signing_keys()$private) {
  data_files <- list.files(
    project_path("data"),
    recursive = TRUE,
    full.names = TRUE
  )
  data_files <- data_files[
    !file.info(data_files)$isdir &
      !grepl("[/\\\\]manifests[/\\\\]", data_files) &
      !grepl("_TEMPLATE\\.csv$", data_files, ignore.case = TRUE) &
      basename(data_files) != "pipeline_audit.csv"
  ]
  source_files <- pipeline_source_files()
  artifacts <- c(data_files, source_files)
  artifacts <- artifacts[!grepl("[/\\\\]\\.tmp", artifacts)]
  if (!length(artifacts)) stop("No raw or processed data artifacts were found to sign.")

  for (artifact in artifacts) write_manifest(artifact, private_key)
  invisible(artifacts)
}

refresh_pipeline_signatures <- function(private_key = ensure_signing_keys()$private) {
  sign_pipeline_artifacts(private_key)
  verify_all_pipeline_manifests()
  write_manifest(
    if (proxy_mode()) {
      "data/proxy/processed/pipeline_audit.csv"
    } else {
      "data/processed/pipeline_audit.csv"
    },
    private_key
  )
  verify_all_pipeline_manifests(write_report = FALSE)
}

refresh_pipeline_signature <- function(private_key = ensure_signing_keys()$private) {
  refresh_pipeline_signatures(private_key)
}