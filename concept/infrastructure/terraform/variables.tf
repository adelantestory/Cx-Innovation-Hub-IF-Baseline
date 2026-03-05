# =============================================================================
# Input Variables
# =============================================================================

variable "uid" {
  type        = string
  description = "Unique identifier used in resource names (e.g. \"abc12\")."
}

variable "location" {
  type        = string
  description = "Azure region for all resources (e.g. \"eastus\", \"westus3\")."
  default     = "eastus"
}

variable "environment" {
  type        = string
  description = "Deployment environment tier: dev, stg, or prd."
  default     = "dev"

  validation {
    condition     = contains(["dev", "stg", "prd"], var.environment)
    error_message = "environment must be one of: dev, stg, prd."
  }
}

variable "container_registry_login_server" {
  type        = string
  description = "Login server for the Azure Container Registry (e.g. \"crXXXtaskifydev.azurecr.io\")."
}

variable "api_image_tag" {
  type        = string
  description = "Container image tag for the API container app."
  default     = "latest"
}

variable "pg_admin_username" {
  type        = string
  description = "PostgreSQL administrator username."
  default     = "taskifyadmin"
}

variable "pg_admin_password" {
  type        = string
  description = "PostgreSQL administrator password. Leave null to auto-generate a random password."
  sensitive   = true
  default     = null

  validation {
    condition     = var.pg_admin_password == null || length(var.pg_admin_password) >= 8
    error_message = "pg_admin_password must be at least 8 characters when provided."
  }
}

variable "log_retention_days" {
  type        = number
  description = "Retention period in days for the Log Analytics Workspace."
  default     = 30
}
