output "resource_group_name" {
  value = azurerm_resource_group.micro_store.name
}

output "storage_account_name" {
  value = azurerm_storage_account.product_images.name
}

output "storage_account_key" {
  value     = azurerm_storage_account.product_images.primary_access_key
  sensitive = true
}



# ─── Redis Outputs ──────────────────────────────────────────────────
output "redis_hostname" {
  value = azurerm_redis_cache.cart.hostname
}

output "redis_primary_key" {
  value     = azurerm_redis_cache.cart.primary_access_key
  sensitive = true
}

output "redis_port" {
  value = azurerm_redis_cache.cart.port
}

# ─── AKS Outputs ────────────────────────────────────────────────────
output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "aks_kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
