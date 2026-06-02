variable "project_name" {
  description = "Nombre del proyecto documentado por Terraform."
  type        = string
  default     = "tutoria-academico"
}

variable "environment" {
  description = "Entorno operativo del despliegue."
  type        = string
  default     = "production"
}

variable "vps_ip" {
  description = "IP publica de la VPS existente."
  type        = string
}

variable "ssh_user" {
  description = "Usuario SSH previsto para administrar la VPS."
  type        = string
}

variable "project_path" {
  description = "Ruta del proyecto en la VPS."
  type        = string
}

variable "app_domain" {
  description = "Dominio publico de la aplicacion."
  type        = string
}

variable "app_port" {
  description = "Puerto interno de exposicion de la aplicacion."
  type        = number
}

variable "internal_app_url" {
  description = "URL interna usada para healthchecks y acceso local en la VPS."
  type        = string
}

variable "public_app_url" {
  description = "URL publica principal de la aplicacion."
  type        = string
}

variable "backup_path" {
  description = "Ruta prevista para backups en la VPS."
  type        = string
}

variable "docker_compose_file" {
  description = "Archivo de Docker Compose usado en produccion."
  type        = string
}

variable "ci_cd_provider" {
  description = "Herramienta de CI/CD usada por el proyecto."
  type        = string
}

variable "repository_url" {
  description = "URL del repositorio del proyecto."
  type        = string
}
