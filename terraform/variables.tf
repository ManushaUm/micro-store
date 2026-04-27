variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "client_id" {
  description = "Azure Service Principal App ID"
  type        = string
}

variable "client_secret" {
  description = "Azure Service Principal Password"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "micro-store-rg"
}

variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ─── Storage Account Variables ──────────────────────────────────────
variable "storage_account_name" {
  description = "Storage account name (lowercase, 3-24 chars, globally unique)"
  type        = string
  default     = "microstoreprodimages"
}

variable "container_name" {
  description = "Blob container name for product images"
  type        = string
  default     = "product-images"
}

# ─── AKS Variables ──────────────────────────────────────────────────
variable "aks_node_count" {
  description = "Number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "aks_node_size" {
  description = "VM size for the AKS nodes"
  type        = string
  default     = "Standard_DC2s_v3" # Explicitly allowed in eastus for this sub
}

# ─── PostgreSQL Variables ───────────────────────────────────────────
variable "db_admin_user" {
  description = "Admin username for PostgreSQL"
  type        = string
  default     = "adminuser"
}

variable "db_admin_password" {
  description = "Admin password for PostgreSQL"
  type        = string
  sensitive   = true
  default     = "P@ssw0rd123!" # Ideally provided via tfvars
}

# ─── Redis Variables ────────────────────────────────────────────────
variable "redis_sku" {
  description = "SKU for Redis Cache"
  type        = string
  default     = "Basic"
}

variable "redis_capacity" {
  description = "Capacity for Redis Cache (0 for Basic)"
  type        = number
  default     = 0
}
