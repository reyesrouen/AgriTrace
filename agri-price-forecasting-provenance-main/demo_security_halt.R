source("R/00_common.R")
source("R/01_manifest_gen.R")

temp_dir <- tempfile("security_demo_", tmpdir = project_path("data/processed"))
dir.create(temp_dir)
keys <- openssl::ec_keygen(curve = "P-256")
key_pair <- list(private = keys, public = as.list(keys)$pubkey)
data_path <- file.path(temp_dir, "demo.csv")
manifest_path <- file.path(temp_dir, "demo.json")

writeLines("week_start,price\n2026-01-05,200", data_path)
jsonlite::write_json(create_manifest(data_path, key_pair$private), manifest_path)
verify_manifest(manifest_path, key_pair$public)

writeLines("week_start,price\n2026-01-05,999", data_path)
tampering_detected <- tryCatch(
  {
    verify_manifest(manifest_path, key_pair$public)
    FALSE
  },
  error = function(error) {
    if (!grepl("\\[SECURITY HALT\\]", conditionMessage(error))) stop(error)
    TRUE
  }
)
unlink(temp_dir, recursive = TRUE)
if (!tampering_detected) stop("The demo failed to detect a modified artifact.")
message("Security demo passed: a modified file was rejected.")
