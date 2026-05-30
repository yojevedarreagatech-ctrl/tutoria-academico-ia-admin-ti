output "project_name" {
  description = "Nombre del proyecto."
  value       = var.project_name
}

output "project_path" {
  description = "Ruta prevista del proyecto en la VPS."
  value       = var.project_path
}

output "ssh_user" {
  description = "Usuario SSH previsto."
  value       = var.ssh_user
}

output "vps_ip" {
  description = "IP documentada para la VPS."
  value       = var.vps_ip
}

output "app_port" {
  description = "Puerto previsto para exponer la aplicacion."
  value       = var.app_port
}

output "backup_path" {
  description = "Ruta prevista de backups."
  value       = var.backup_path
}
