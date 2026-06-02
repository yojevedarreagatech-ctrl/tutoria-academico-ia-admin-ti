output "project_name" {
  description = "Nombre del proyecto."
  value       = var.project_name
}

output "environment" {
  description = "Entorno documentado."
  value       = var.environment
}

output "vps_ip" {
  description = "IP publica de la VPS existente."
  value       = var.vps_ip
}

output "ssh_connection" {
  description = "Conexion SSH documental prevista."
  value       = local.ssh_connection
}

output "project_path" {
  description = "Ruta del proyecto en la VPS."
  value       = var.project_path
}

output "public_app_url" {
  description = "URL publica principal."
  value       = var.public_app_url
}

output "internal_app_url" {
  description = "URL interna del servicio."
  value       = var.internal_app_url
}

output "healthcheck_url" {
  description = "Endpoint publico de healthcheck."
  value       = local.healthcheck_url
}

output "websocket_url" {
  description = "URL publica del WebSocket."
  value       = local.websocket_url
}

output "backup_path" {
  description = "Ruta prevista de backups."
  value       = var.backup_path
}

output "docker_compose_file" {
  description = "Archivo Compose de produccion."
  value       = var.docker_compose_file
}

output "deployment_strategy" {
  description = "Resumen de la estrategia actual de despliegue."
  value       = "VPS existente + docker-compose v1 + GitHub Actions por SSH"
}

output "ci_cd_provider" {
  description = "Proveedor actual de CI/CD."
  value       = var.ci_cd_provider
}
