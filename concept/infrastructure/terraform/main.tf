# =============================================================================
# Main Infrastructure — Taskify POC
# =============================================================================
# Resource deployment order:
#   1.  Resource Group
#   2.  Log Analytics Workspace
#   3.  Application Insights
#   4.  User-Assigned Managed Identity
#   5.  Key Vault
#   6.  Key Vault RBAC role assignment (Managed Identity → Secrets User)
#   7.  random_password (PostgreSQL admin password stored in Key Vault)
#   8.  PostgreSQL Flexible Server
#   9.  PostgreSQL Database
#   10. PostgreSQL Firewall Rule (allow Azure services)
#   11. Container Apps Environment
#   12. API Container App
#   13. Static Web App
#   14. Key Vault Secret — postgresql-admin-password
#   15. Key Vault Secret — postgresql-connection-host
#   16. Key Vault Secret — postgresql-admin-username
# =============================================================================

locals {
  base_tags = {
    Environment = var.environment
    Purpose     = "Taskify POC"
  }
}

# -----------------------------------------------------------------------------
# 1. Resource Group
# -----------------------------------------------------------------------------
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.uid}-taskify-${var.environment}"
  location = var.location
  tags     = merge(local.base_tags, { Stage = "foundation" })
}

# -----------------------------------------------------------------------------
# 2. Log Analytics Workspace
# -----------------------------------------------------------------------------
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.uid}-taskify-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days
  tags                = merge(local.base_tags, { Stage = "foundation" })
}

# -----------------------------------------------------------------------------
# 3. Application Insights
# -----------------------------------------------------------------------------
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.uid}-taskify-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = merge(local.base_tags, { Stage = "foundation" })
}

# -----------------------------------------------------------------------------
# 4. User-Assigned Managed Identity
# -----------------------------------------------------------------------------
resource "azurerm_user_assigned_identity" "api" {
  name                = "id-${var.uid}-taskify-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = merge(local.base_tags, { Stage = "foundation" })
}

# -----------------------------------------------------------------------------
# 5. Key Vault (RBAC-enabled)
# -----------------------------------------------------------------------------
resource "azurerm_key_vault" "main" {
  name                       = "kv-${var.uid}-taskify-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  enable_rbac_authorization  = true
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = merge(local.base_tags, { Stage = "foundation" })
}

data "azurerm_client_config" "current" {}

# -----------------------------------------------------------------------------
# 6. Key Vault RBAC — grant Managed Identity the Key Vault Secrets User role
# -----------------------------------------------------------------------------
resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

# -----------------------------------------------------------------------------
# 7. Random password (used when pg_admin_password is not supplied externally)
# -----------------------------------------------------------------------------
resource "random_password" "pg_admin" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

locals {
  pg_password = var.pg_admin_password != null ? var.pg_admin_password : random_password.pg_admin.result
}

# -----------------------------------------------------------------------------
# 8. PostgreSQL Flexible Server
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${var.uid}-taskify-${var.environment}"
  location               = azurerm_resource_group.main.location
  resource_group_name    = azurerm_resource_group.main.name
  version                = "16"
  administrator_login    = var.pg_admin_username
  administrator_password = local.pg_password
  storage_mb             = 32768
  backup_retention_days  = 7
  sku_name               = "B_Standard_B1ms"
  tags                   = merge(local.base_tags, { Stage = "data" })
}

# -----------------------------------------------------------------------------
# 9. PostgreSQL Database
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_database" "taskify" {
  name      = "taskify"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

# -----------------------------------------------------------------------------
# 10. PostgreSQL Firewall Rule — allow Azure services
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# -----------------------------------------------------------------------------
# 11. Container Apps Environment
# -----------------------------------------------------------------------------
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${var.uid}-taskify-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = merge(local.base_tags, { Stage = "container-infrastructure" })
}

# -----------------------------------------------------------------------------
# 12. API Container App
# -----------------------------------------------------------------------------
resource "azurerm_container_app" "api" {
  name                         = "ca-${var.uid}-taskify-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = merge(local.base_tags, { Stage = "application" })

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api.id]
  }

  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "taskify-api"
      image  = "${var.container_registry_login_server}/taskify-api:${var.api_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "AZURE_KEY_VAULT_URL"
        value = azurerm_key_vault.main.vault_uri
      }
      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.api.client_id
      }
      env {
        name  = "PGDATABASE"
        value = "taskify"
      }
      env {
        name  = "PGPORT"
        value = "5432"
      }
      env {
        name  = "PGSSLMODE"
        value = "require"
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.main.connection_string
      }
    }
  }
}

# -----------------------------------------------------------------------------
# 13. Static Web App
# -----------------------------------------------------------------------------
resource "azurerm_static_web_app" "main" {
  name                = "swa-${var.uid}-taskify-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = merge(local.base_tags, { Stage = "application" })
}

# -----------------------------------------------------------------------------
# 14. Key Vault Secret — postgresql-admin-password
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "pg_password" {
  name         = "postgresql-admin-password"
  value        = local.pg_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.kv_secrets_user]
}

# -----------------------------------------------------------------------------
# 15. Key Vault Secret — postgresql-connection-host
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "pg_host" {
  name         = "postgresql-connection-host"
  value        = azurerm_postgresql_flexible_server.main.fqdn
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.kv_secrets_user]
}

# -----------------------------------------------------------------------------
# 16. Key Vault Secret — postgresql-admin-username
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "pg_username" {
  name         = "postgresql-admin-username"
  value        = var.pg_admin_username
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.kv_secrets_user]
}
