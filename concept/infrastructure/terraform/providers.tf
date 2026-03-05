# =============================================================================
# Terraform Provider Configuration
# =============================================================================
# Configures the azurerm (~> 3.0) and random (~> 3.5) providers.
# The backend block is intentionally left empty here; backend configuration
# is supplied at runtime via -backend-config flags (see the GitHub Actions
# workflow at .github/workflows/deploy-terraform.yml).
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configured at runtime via -backend-config flags.
  backend "azurerm" {}
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
  }
}
