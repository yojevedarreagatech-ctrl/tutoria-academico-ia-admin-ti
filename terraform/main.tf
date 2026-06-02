terraform {
  required_version = ">= 1.5.0"
}

locals {
  ssh_connection   = "${var.ssh_user}@${var.vps_ip}"
  healthcheck_url  = "${trimsuffix(var.public_app_url, "/")}/api/health/"
  websocket_scheme = startswith(var.public_app_url, "https://") ? "wss" : "ws"
  websocket_host   = replace(replace(var.public_app_url, "https://", ""), "http://", "")
  websocket_url    = "${local.websocket_scheme}://${local.websocket_host}/ws"

  deployment_summary = {
    project_name        = var.project_name
    environment         = var.environment
    vps_ip              = var.vps_ip
    ssh_user            = var.ssh_user
    project_path        = var.project_path
    app_domain          = var.app_domain
    app_port            = var.app_port
    internal_app_url    = var.internal_app_url
    public_app_url      = var.public_app_url
    backup_path         = var.backup_path
    docker_compose_file = var.docker_compose_file
    ci_cd_provider      = var.ci_cd_provider
    repository_url      = var.repository_url
  }
}

# Sprint 12:
# Esta configuracion NO crea, modifica ni destruye infraestructura real.
# Terraform se usa aqui como evidencia segura de Infrastructure as Code
# para documentar la VPS existente, el despliegue y los valores operativos.
