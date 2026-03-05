# =============================================================================
# Outputs
# =============================================================================

output "api_url" {
  description = "HTTPS URL of the API Container App."
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "web_url" {
  description = "HTTPS URL of the Static Web App."
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
}

output "key_vault_name" {
  description = "Name of the Key Vault."
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault."
  value       = azurerm_key_vault.main.vault_uri
}

output "db_server_name" {
  description = "Name of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.main.name
}

output "db_server_fqdn" {
  description = "Fully-qualified domain name of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "managed_identity_client_id" {
  description = "Client ID of the User-Assigned Managed Identity."
  value       = azurerm_user_assigned_identity.api.client_id
}

output "app_insights_connection_string" {
  description = "Application Insights connection string."
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "swa_api_settings_command" {
  description = "Azure CLI command to wire the API URL into the Static Web App's application settings."
  value       = <<-EOT
    az staticwebapp appsettings set \
      --name ${azurerm_static_web_app.main.name} \
      --resource-group ${azurerm_resource_group.main.name} \
      --setting-names VITE_API_URL=https://${azurerm_container_app.api.ingress[0].fqdn}
  EOT
}
