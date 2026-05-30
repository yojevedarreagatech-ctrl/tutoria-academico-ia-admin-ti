terraform {
  required_version = ">= 1.5.0"
}

locals {
  deployment_summary = {
    project_name = var.project_name
    project_path = var.project_path
    ssh_user     = var.ssh_user
    vps_ip       = var.vps_ip
    app_port     = var.app_port
    backup_path  = var.backup_path
  }
}

# Sprint 0:
# Este archivo no crea recursos reales. Solo deja una base documentada
# para la futura automatizacion de infraestructura.
