source("R/00_common.R")

hex_to_raw <- function(hex) {
  if (length(hex) != 1L || is.na(hex) || nchar(hex) %% 2L != 0L ||
      !grepl("^[0-9a-fA-F]+$", hex)) {
    stop("Invalid hexadecimal signature.")
  }
  starts <- seq.int(1L, nchar(hex), by = 2L)
  as.raw(strtoi(substring(hex, starts, starts + 1L), base = 16L))
}

ensure_signing_keys <- function() {
  private_path <- project_path("keys/private_key.pem")
  public_path <- project_path("keys/public_key.pem")
  dir.create(dirname(private_path), recursive = TRUE, showWarnings = FALSE)

  if (file.exists(private_path) && file.exists(public_path)) {
    return(list(
      private = openssl::read_key(private_path),
      public = openssl::read_pubkey(public_path)
    ))
  }
  if (file.exists(private_path) || file.exists(public_path)) {
    stop("Only one signing key exists. Restore the matching key pair; do not silently replace it.")
  }

  private <- openssl::ec_keygen(curve = "P-256")
  public <- as.list(private)$pubkey
  openssl::write_pem(private, private_path)
  openssl::write_pem(public, public_path)
  Sys.chmod(private_path, mode = "0600")
  list(private = private, public = public)
}

create_manifest <- function(artifact_path, private_key) {
  full_path <- if (grepl("^([A-Za-z]:|/)", artifact_path)) {
    normalizePath(artifact_path, winslash = "/", mustWork = TRUE)
  } else {
    normalizePath(project_path(artifact_path), winslash = "/", mustWork = TRUE)
  }
  root <- project_root()
  root_prefix <- paste0(root, "/")
  if (!startsWith(full_path, root_prefix)) {
    stop("Only project files can be added to the signed manifest: ", artifact_path)
  }
  relative_path <- substring(full_path, nchar(root_prefix) + 1L)
  sha256_hash <- digest::digest(full_path, algo = "sha256", file = TRUE)
  payload <- list(
    artifact_path = relative_path,
    sha256_hash = sha256_hash,
    algorithm = "SHA-256",
    signature_algorithm = "ECDSA P-256",
    timestamp_utc = format(Sys.time(), tz = "UTC", usetz = TRUE)
  )
  signed_bytes <- charToRaw(as.character(jsonlite::toJSON(
    payload,
    auto_unbox = TRUE,
    null = "null",
    pretty = FALSE
  )))
  signature <- openssl::signature_create(
    signed_bytes,
    hash = openssl::sha256,
    key = private_key
  )
  signature_hex <- paste(sprintf("%02x", as.integer(signature)), collapse = "")
  list(manifest = payload, signature_ecdsa = signature_hex)
}

write_manifest <- function(artifact_path, private_key) {
  manifest <- create_manifest(artifact_path, private_key)
  file_name <- gsub("[^A-Za-z0-9._-]", "_", manifest$manifest$artifact_path)
  manifest_path <- project_path(file.path("data/manifests", paste0("pipeline_", file_name, ".json")))
  dir.create(dirname(manifest_path), recursive = TRUE, showWarnings = FALSE)
  jsonlite::write_json(manifest, manifest_path, pretty = TRUE, auto_unbox = TRUE)
  manifest_path
}

verify_manifest <- function(manifest_path, public_key = NULL) {
  if (is.null(public_key)) {
    public_key <- openssl::read_pubkey(project_path("keys/public_key.pem"))
  }
  full_manifest_path <- if (grepl("^([A-Za-z]:|/)", manifest_path)) {
    manifest_path
  } else {
    project_path(manifest_path)
  }
  if (!file.exists(full_manifest_path)) stop("Manifest file is missing: ", manifest_path)
  signed <- jsonlite::fromJSON(full_manifest_path, simplifyVector = FALSE)
  payload <- signed$manifest
  signed_bytes <- charToRaw(as.character(jsonlite::toJSON(
    payload,
    auto_unbox = TRUE,
    null = "null",
    pretty = FALSE
  )))
  signature <- tryCatch(
    hex_to_raw(signed$signature_ecdsa),
    error = function(error) {
      stop(
        "[SECURITY HALT] Invalid ECDSA signature for ", manifest_path, ": ",
        conditionMessage(error),
        call. = FALSE
      )
    }
  )
  valid <- tryCatch(
    openssl::signature_verify(
      signed_bytes,
      signature,
      hash = openssl::sha256,
      pubkey = public_key
    ),
    error = function(error) {
      stop(
        "[SECURITY HALT] Invalid ECDSA signature for ", manifest_path, ": ",
        conditionMessage(error),
        call. = FALSE
      )
    }
  )
  if (!isTRUE(valid)) {
    stop("[SECURITY HALT] Invalid ECDSA signature for ", manifest_path)
  }

  relative_path <- payload$artifact_path
  if (length(relative_path) != 1L || is.na(relative_path) || !nzchar(relative_path) ||
      grepl("^(/|[A-Za-z]:|\\\\)", relative_path) ||
      any(strsplit(gsub("\\\\", "/", relative_path), "/", fixed = TRUE)[[1L]] == "..")) {
    stop("[SECURITY HALT] Invalid artifact path in ", manifest_path)
  }
  artifact_path <- project_path(relative_path)
  if (!file.exists(artifact_path)) {
    stop("Signed artifact is missing: ", payload$artifact_path)
  }
  artifact_path <- normalizePath(artifact_path, winslash = "/", mustWork = TRUE)
  root_prefix <- paste0(project_root(), "/")
  if (!startsWith(artifact_path, root_prefix)) {
    stop("[SECURITY HALT] Artifact path is outside the project: ", payload$artifact_path)
  }

  current_hash <- digest::digest(artifact_path, algo = "sha256", file = TRUE)
  if (!identical(current_hash, payload$sha256_hash)) {
    stop("[SECURITY HALT] SHA-256 mismatch for ", payload$artifact_path)
  }
  invisible(TRUE)
}
