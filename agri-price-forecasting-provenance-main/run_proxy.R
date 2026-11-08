source("R/00_common.R")
source("R/08_prepare_proxy_inputs.R")

prepare_proxy_inputs()
Sys.setenv(AGRI_PRICE_PROXY_MODE = "true")
source("run_all.R")
