terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.3.0"
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}

# ─── Resource Group ──────────────────────────────────────────────────
resource "azurerm_resource_group" "micro_store" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    environment = var.environment
    project     = "micro-store"
  }
}

# ─── Networking ──────────────────────────────────────────────────────
resource "azurerm_virtual_network" "micro_store" {
  name                = "micro-store-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.micro_store.location
  resource_group_name = azurerm_resource_group.micro_store.name
}

resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.micro_store.name
  virtual_network_name = azurerm_virtual_network.micro_store.name
  address_prefixes     = ["10.0.1.0/24"]
}

# ─── Storage Account (Product Images) ───────────────────────────────
resource "azurerm_storage_account" "product_images" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.micro_store.name
  location                 = azurerm_resource_group.micro_store.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  allow_nested_items_to_be_public = true

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "PUT", "POST", "DELETE", "OPTIONS"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

resource "azurerm_storage_container" "product_images" {
  name                  = var.container_name
  storage_account_name  = azurerm_storage_account.product_images.name
  container_access_type = "blob"
}



# ─── Azure Cache for Redis ──────────────────────────────────────────
resource "azurerm_redis_cache" "cart" {
  name                = "micro-store-cart-cache"
  location            = azurerm_resource_group.micro_store.location
  resource_group_name = azurerm_resource_group.micro_store.name
  capacity            = var.redis_capacity
  family              = "C"
  sku_name            = var.redis_sku
  enable_non_ssl_port = true # Simplifies cart-service connection for dev
  minimum_tls_version = "1.2"
}

# ─── AKS Cluster ─────────────────────────────────────────────────────
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "micro-store-aks"
  location            = azurerm_resource_group.micro_store.location
  resource_group_name = azurerm_resource_group.micro_store.name
  dns_prefix          = "microstore"

  default_node_pool {
    name       = "default"
    node_count = var.aks_node_count
    vm_size    = var.aks_node_size
    vnet_subnet_id = azurerm_subnet.aks.id
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
    service_cidr      = "10.2.0.0/16"
    dns_service_ip    = "10.2.0.10"
  }

  tags = {
    Environment = var.environment
  }
}
